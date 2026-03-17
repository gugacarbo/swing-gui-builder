import * as vscode from "vscode";
import { CanvasPanel } from "../canvas/CanvasPanel";

export function registerSaveCommand(): vscode.Disposable {
  return vscode.commands.registerCommand("swingGuiBuilder.save", async () => {
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
}
