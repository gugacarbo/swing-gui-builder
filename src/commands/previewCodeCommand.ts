import * as vscode from "vscode";
import { CanvasPanel, type PreviewCodeFile } from "../canvas/CanvasPanel";
import { getOutputDirectory } from "../config/ConfigReader";
import { generatePreviewJavaFiles } from "../generator/JavaGenerator";
import { inferJavaPackage, resolveOutputDirectory } from "../utils/JavaPackageInference";
import { detectJavaProject } from "../utils/JavaProjectDetector";

export function registerPreviewCodeCommand(): vscode.Disposable {
  return vscode.commands.registerCommand("swingGuiBuilder.previewCode", async () => {
    if (!CanvasPanel.currentPanel) {
      vscode.window.showErrorMessage("No canvas is open. Open a canvas first.");
      return;
    }

    const state = CanvasPanel.currentPanel.getCanvasState();
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const projectStructure = workspaceRoot ? detectJavaProject(workspaceRoot) : undefined;
    const outputDir = resolveOutputDirectory(getOutputDirectory(), projectStructure);
    const javaPackage = inferJavaPackage(outputDir, projectStructure);
    const previewFiles: PreviewCodeFile[] = generatePreviewJavaFiles(state, javaPackage);

    await CanvasPanel.currentPanel.postPreviewCode(previewFiles);
  });
}
