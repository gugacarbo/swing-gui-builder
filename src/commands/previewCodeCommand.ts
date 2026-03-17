import * as vscode from "vscode";
import { CanvasPanel, type PreviewCodeFile } from "../canvas/CanvasPanel";
import { generatePreviewJavaFiles } from "../generator/JavaGenerator";

export function registerPreviewCodeCommand(): vscode.Disposable {
  return vscode.commands.registerCommand("swingGuiBuilder.previewCode", async () => {
    if (!CanvasPanel.currentPanel) {
      vscode.window.showErrorMessage("No canvas is open. Open a canvas first.");
      return;
    }

    const state = CanvasPanel.currentPanel.getCanvasState();
    const previewFiles: PreviewCodeFile[] = generatePreviewJavaFiles(state);

    await CanvasPanel.currentPanel.postPreviewCode(previewFiles);
  });
}
