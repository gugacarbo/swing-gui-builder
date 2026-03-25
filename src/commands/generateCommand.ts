import * as path from "node:path";
import * as vscode from "vscode";
import { CanvasPanel } from "../canvas/CanvasPanel";
import { getOutputDirectory } from "../config/ConfigReader";
import { generateJavaFiles } from "../generator/JavaGenerator";
import { mergeJavaFile } from "../merger/JavaFileMerger";
import { inferJavaPackage } from "../utils/JavaPackageInference";
import { detectJavaProject } from "../utils/JavaProjectDetector";
import {
  DEFAULT_OUTPUT_DIRECTORY,
  type OutputDirectoryConfig,
  type OutputDirectoryContext,
  resolveOutputDirectoryWithUI,
} from "./OutputDirectoryResolver";

function getFileName(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const segments = normalizedPath.split("/").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : filePath;
}

export function registerGenerateCommand(outputChannel: vscode.OutputChannel): vscode.Disposable {
  return vscode.commands.registerCommand("swingGuiBuilder.generate", async () => {
    if (!CanvasPanel.currentPanel) {
      vscode.window.showErrorMessage("No canvas is open. Open a canvas first.");
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace folder open.");
      return;
    }

    const state = CanvasPanel.currentPanel.getCanvasState();
    if (state.components.length === 0) {
      vscode.window.showWarningMessage(
        "Canvas has no components. Add components before generating.",
      );
      return;
    }

    // Resolve output directory using OutputDirectoryResolver
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const projectStructure = detectJavaProject(workspaceRoot);
    const configuredDir = getOutputDirectory();

    const config: OutputDirectoryConfig = {
      configuredDir,
      projectStructure,
      defaultDir: DEFAULT_OUTPUT_DIRECTORY,
    };

    const ctx: OutputDirectoryContext = {
      workspaceRoot,
      workspaceUri: workspaceFolders[0].uri,
      ui: {
        showInputBox: (options) =>
          vscode.window.showInputBox({
            prompt: options.prompt,
            value: options.value,
          }),
        showOpenDialog: (options) =>
          vscode.window.showOpenDialog({
            canSelectFolders: options.canSelectFolders,
            canSelectFiles: options.canSelectFiles,
            canSelectMany: options.canSelectMany,
            openLabel: options.openLabel,
            defaultUri: options.defaultUri as vscode.Uri | undefined,
          }) as Thenable<readonly { fsPath: string }[] | undefined>,
      },
    };

    const result = await resolveOutputDirectoryWithUI(config, ctx);
    if (result.cancelled) return;

    const outputDir = result.outputDir;

    const outputUri = vscode.Uri.joinPath(workspaceFolders[0].uri, outputDir);

    // Ensure output directory exists
    try {
      await vscode.workspace.fs.createDirectory(outputUri);
    } catch (_) {
      outputChannel.appendLine(`Note: Directory may already exist: ${outputDir}`);
    }

    const javaPackage = inferJavaPackage(outputDir, projectStructure);

    const generatedFiles = generateJavaFiles(state, javaPackage);
    const sourceFilePath = CanvasPanel.currentPanel.getSourceFile?.();
    const roundTripMainFileName = `${state.className}.java`;
    let overwriteAll = false;
    let mergedFiles = 0;

    for (const file of generatedFiles) {
      if (sourceFilePath && file.fileName === roundTripMainFileName && !file.subfolder) {
        const sourceFileUri = vscode.Uri.file(sourceFilePath);
        const sourceFileName = getFileName(sourceFilePath);
        let sourceFileExists = false;

        try {
          await vscode.workspace.fs.stat(sourceFileUri);
          sourceFileExists = true;
        } catch (_) {
          sourceFileExists = false;
        }

        if (sourceFileExists) {
          const mergeResult = await mergeJavaFile(sourceFilePath, file.content);
          if (!mergeResult.success) {
            const mergeMessage = mergeResult.message ?? "No mergeable sections were detected.";
            outputChannel.appendLine(
              `Warning: Could not merge round-trip file ${sourceFilePath}: ${mergeMessage}`,
            );
            vscode.window.showWarningMessage(
              `Could not merge generated code into ${sourceFileName}: ${mergeMessage}`,
            );
            continue;
          }

          mergedFiles += 1;
          outputChannel.appendLine(`Merged generated code into ${sourceFilePath}`);
          if (mergeResult.backupPath) {
            outputChannel.appendLine(`Created backup: ${mergeResult.backupPath}`);
          }

          const previewChoice = await vscode.window.showInformationMessage(
            `Merged generated code into ${sourceFileName}.`,
            "Preview Diff",
            "Continue",
          );

          if (previewChoice === "Preview Diff") {
            if (!mergeResult.backupPath) {
              vscode.window.showWarningMessage(
                "Diff preview unavailable because no backup was created for this merge.",
              );
            } else {
              await vscode.commands.executeCommand(
                "vscode.diff",
                vscode.Uri.file(mergeResult.backupPath),
                sourceFileUri,
                `Round-trip merge: ${sourceFileName}`,
              );
            }
          }

          continue;
        }

        await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(sourceFilePath)));
        await vscode.workspace.fs.writeFile(sourceFileUri, Buffer.from(file.content, "utf-8"));
        outputChannel.appendLine(
          `Round-trip source file not found. Created new file: ${sourceFilePath}`,
        );
        continue;
      }

      const targetDirUri = file.subfolder
        ? vscode.Uri.joinPath(outputUri, file.subfolder)
        : outputUri;
      const relativeOutputPath = file.subfolder
        ? `${file.subfolder}/${file.fileName}`
        : file.fileName;

      if (file.subfolder) {
        await vscode.workspace.fs.createDirectory(targetDirUri);
      }

      const fileUri = vscode.Uri.joinPath(targetDirUri, file.fileName);

      // Check if file exists
      let fileExists = false;
      try {
        await vscode.workspace.fs.stat(fileUri);
        fileExists = true;
      } catch (_) {
        fileExists = false;
        outputChannel.appendLine(`Debug: File does not exist yet: ${relativeOutputPath}`);
      }

      if (fileExists && !overwriteAll) {
        const choice = await vscode.window.showWarningMessage(
          `${relativeOutputPath} already exists. What do you want to do?`,
          "Overwrite",
          "Overwrite All",
          "Cancel",
        );

        if (choice === "Cancel") {
          vscode.window.showInformationMessage("Code generation cancelled.");
          return;
        }

        if (choice === "Overwrite All") {
          overwriteAll = true;
        }

        if (choice === "Overwrite" || choice === "Overwrite All") {
          // Create backup
          const backupName = file.fileName.replace(".java", "_backup.java");
          const backupUri = vscode.Uri.joinPath(targetDirUri, backupName);
          try {
            const existingContent = await vscode.workspace.fs.readFile(fileUri);
            await vscode.workspace.fs.writeFile(backupUri, existingContent);
          } catch (error) {
            outputChannel.appendLine(
              `Warning: Could not create backup for ${relativeOutputPath}: ${error}`,
            );
            vscode.window.showWarningMessage(
              `Could not create backup for ${relativeOutputPath}. Proceeding without backup.`,
            );
          }
        }

        if (!choice) {
          return; // Dialog was dismissed
        }
      } else if (fileExists && overwriteAll) {
        // Create backup for overwrite all
        const backupName = file.fileName.replace(".java", "_backup.java");
        const backupUri = vscode.Uri.joinPath(targetDirUri, backupName);
        try {
          const existingContent = await vscode.workspace.fs.readFile(fileUri);
          await vscode.workspace.fs.writeFile(backupUri, existingContent);
        } catch (error) {
          outputChannel.appendLine(
            `Warning: Could not create backup for ${relativeOutputPath}: ${error}`,
          );
          vscode.window.showWarningMessage(
            `Could not create backup for ${relativeOutputPath}. Proceeding without backup.`,
          );
        }
      }

      // Write the file
      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(file.content, "utf-8"));
    }

    const mergedLabel = mergedFiles > 0 ? ` (${mergedFiles} merged with round-trip mode)` : "";
    vscode.window.showInformationMessage(
      `Generated ${generatedFiles.length} Java file(s) in ${outputDir}${mergedLabel}`,
    );
  });
}
