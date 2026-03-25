import * as path from "node:path";
import * as vscode from "vscode";
import { CanvasPanel } from "../canvas/CanvasPanel";
import { parseJavaFile } from "../parser/JavaParser";
import { parsedToCanvasState } from "../parser/toCanvasState";
import { restoreLatestBackupForSource } from "./restoreFromBackupCommand";

function isJavaParseError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /parsing errors detected|no class declaration found|expecting\s+-->/i.test(error.message);
}

export function registerOpenFromJavaCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): vscode.Disposable {
  return vscode.commands.registerCommand("swingGuiBuilder.openFromJava", async () => {
    const pickedFiles = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: "Open Java File",
      filters: {
        "Java Files": ["java"],
      },
      defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
    });

    if (!pickedFiles || pickedFiles.length === 0) {
      return;
    }

    const selectedFile = pickedFiles[0];

    try {
      const rawFileContent = await vscode.workspace.fs.readFile(selectedFile);
      const javaContent = Buffer.from(rawFileContent).toString("utf-8");
      const parsedJava = parseJavaFile(javaContent);
      const canvasState = parsedToCanvasState(parsedJava);

      CanvasPanel.createOrShow(context.extensionUri, canvasState.className);
      if (CanvasPanel.currentPanel) {
        CanvasPanel.currentPanel.loadState(canvasState);
        CanvasPanel.currentPanel.setSourceFile(selectedFile.fsPath);
        CanvasPanel.currentPanel.setRoundTripStatus?.(true);
      }

      const selectedFileName = path.basename(selectedFile.fsPath);
      outputChannel.appendLine(`Opened Java file on canvas: ${selectedFile.fsPath}`);
      vscode.window.showInformationMessage(`Opened ${selectedFileName} in Swing GUI Builder.`);
    } catch (error) {
      outputChannel.appendLine(`Error opening Java file: ${error}`);
      const selectedFileName = path.basename(selectedFile.fsPath);

      if (isJavaParseError(error)) {
        outputChannel.appendLine(
          `Parse error detected while opening Java file: ${selectedFile.fsPath}`,
        );
        const restoreChoice = await vscode.window.showWarningMessage(
          `Could not parse ${selectedFileName}. Do you want to restore the latest backup?`,
          "Restore Backup",
          "Cancel",
        );

        if (restoreChoice === "Restore Backup") {
          try {
            const restored = await restoreLatestBackupForSource(selectedFile.fsPath, outputChannel);
            if (restored) {
              return;
            }
          } catch (restoreError) {
            outputChannel.appendLine(`Error restoring backup: ${restoreError}`);
          }
        }
      }

      vscode.window.showErrorMessage(
        "Could not open Java file in Swing GUI Builder. See output for details.",
      );
    }
  });
}
