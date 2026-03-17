import * as vscode from "vscode";
import { CanvasPanel, type PreviewCodeFile } from "./canvas/CanvasPanel";
import { registerGenerateCommand } from "./commands/generateCommand";
import type { CanvasState } from "./components/ComponentModel";
import { initProjectConfig } from "./config/initConfigCommand";
import { generatePreviewJavaFiles } from "./generator/JavaGenerator";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("Swing GUI Builder");

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

  const generateCmd = registerGenerateCommand(outputChannel);

  const previewCodeCmd = vscode.commands.registerCommand(
    "swingGuiBuilder.previewCode",
    async () => {
      if (!CanvasPanel.currentPanel) {
        vscode.window.showErrorMessage("No canvas is open. Open a canvas first.");
        return;
      }

      const state = CanvasPanel.currentPanel.getCanvasState();
      const previewFiles: PreviewCodeFile[] = generatePreviewJavaFiles(state);

      await CanvasPanel.currentPanel.postPreviewCode(previewFiles);
    },
  );

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
    } catch (error) {
      outputChannel.appendLine(`Error opening layout file: ${error}`);
      vscode.window.showErrorMessage(
        "Could not read .swingbuilder-layout.json. File may not exist.",
      );
    }
  });

  const initConfigCmd = vscode.commands.registerCommand("swingGuiBuilder.initConfig", () => {
    initProjectConfig();
  });

  context.subscriptions.push(
    newWindowCmd,
    generateCmd,
    previewCodeCmd,
    saveCmd,
    openCmd,
    initConfigCmd,
  );
}

export function deactivate() {}
