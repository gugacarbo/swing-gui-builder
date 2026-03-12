import * as vscode from "vscode";
import { CanvasPanel } from "./canvas/CanvasPanel";
import type { CanvasState } from "./components/ComponentModel";
import { getOutputDirectory } from "./config/ConfigReader";
import { initProjectConfig } from "./config/initConfigCommand";
import { generateJavaFiles } from "./generator/JavaGenerator";

export function activate(context: vscode.ExtensionContext) {
  const newWindowCmd = vscode.commands.registerCommand("swingGuiBuilder.newWindow", async () => {
    const className = await vscode.window.showInputBox({
      prompt: "Enter the Java class name for the window",
      value: "MainWindow",
      validateInput: (value) => {
        if (!value || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
          return "Invalid Java class name. Must start with a letter, _ or $ and contain only letters, digits, _ or $.";
        }
        return undefined;
      },
    });

    if (className) {
      CanvasPanel.createOrShow(context.extensionUri, className);
    }
  });

  const generateCmd = vscode.commands.registerCommand("swingGuiBuilder.generate", async () => {
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

    // Ask for output directory
    const defaultDir = getOutputDirectory();
    const outputDir = await vscode.window.showInputBox({
      prompt: "Output directory for generated Java files (relative to workspace)",
      value: defaultDir,
    });

    if (!outputDir) return;

    const outputUri = vscode.Uri.joinPath(workspaceFolders[0].uri, outputDir);

    // Ensure output directory exists
    try {
      await vscode.workspace.fs.createDirectory(outputUri);
    } catch {
      // Directory may already exist
    }

    const generatedFiles = generateJavaFiles(state);
    let overwriteAll = false;

    for (const file of generatedFiles) {
      const fileUri = vscode.Uri.joinPath(outputUri, file.fileName);

      // Check if file exists
      let fileExists = false;
      try {
        await vscode.workspace.fs.stat(fileUri);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      if (fileExists && !overwriteAll) {
        const choice = await vscode.window.showWarningMessage(
          `${file.fileName} already exists. What do you want to do?`,
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
          const backupUri = vscode.Uri.joinPath(outputUri, backupName);
          try {
            const existingContent = await vscode.workspace.fs.readFile(fileUri);
            await vscode.workspace.fs.writeFile(backupUri, existingContent);
          } catch {
            // Ignore backup errors
          }
        }

        if (!choice) {
          return; // Dialog was dismissed
        }
      } else if (fileExists && overwriteAll) {
        // Create backup for overwrite all
        const backupName = file.fileName.replace(".java", "_backup.java");
        const backupUri = vscode.Uri.joinPath(outputUri, backupName);
        try {
          const existingContent = await vscode.workspace.fs.readFile(fileUri);
          await vscode.workspace.fs.writeFile(backupUri, existingContent);
        } catch {
          // Ignore backup errors
        }
      }

      // Write the file
      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(file.content, "utf-8"));
    }

    vscode.window.showInformationMessage(
      `Generated ${generatedFiles.length} Java file(s) in ${outputDir}`,
    );
  });

  const saveCmd = vscode.commands.registerCommand("swingGuiBuilder.save", async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace folder open.");
      return;
    }
    if (!CanvasPanel.currentPanel) {
      vscode.window.showErrorMessage("No canvas is open. Open a canvas first.");
      return;
    }

    const state = CanvasPanel.currentPanel.getCanvasState();
    const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, ".swingbuilder-layout.json");
    const content = Buffer.from(`${JSON.stringify(state, null, 2)}\n`, "utf-8");
    await vscode.workspace.fs.writeFile(filePath, content);
    vscode.window.showInformationMessage("Canvas saved to .swingbuilder-layout.json");
  });

  const openCmd = vscode.commands.registerCommand("swingGuiBuilder.open", async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace folder open.");
      return;
    }

    const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, ".swingbuilder-layout.json");
    try {
      const fileContent = await vscode.workspace.fs.readFile(filePath);
      const state = JSON.parse(Buffer.from(fileContent).toString("utf-8")) as CanvasState;
      CanvasPanel.createOrShow(context.extensionUri, state.className || "MainWindow");
      if (CanvasPanel.currentPanel) {
        CanvasPanel.currentPanel.loadState(state);
      }
      vscode.window.showInformationMessage("Canvas loaded from .swingbuilder-layout.json");
    } catch {
      vscode.window.showErrorMessage(
        "Could not read .swingbuilder-layout.json. File may not exist.",
      );
    }
  });

  const initConfigCmd = vscode.commands.registerCommand("swingGuiBuilder.initConfig", () => {
    initProjectConfig();
  });

  context.subscriptions.push(newWindowCmd, generateCmd, saveCmd, openCmd, initConfigCmd);
}

export function deactivate() {}
