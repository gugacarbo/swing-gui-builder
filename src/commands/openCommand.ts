import * as vscode from "vscode";
import { CanvasPanel } from "../canvas/CanvasPanel";
import type { CanvasState } from "../components/ComponentModel";

export function registerOpenCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): vscode.Disposable {
  return vscode.commands.registerCommand("swingGuiBuilder.open", async () => {
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
    } catch (error) {
      outputChannel.appendLine(`Error opening layout file: ${error}`);
      vscode.window.showErrorMessage(
        "Could not read .swingbuilder-layout.json. File may not exist.",
      );
    }
  });
}
