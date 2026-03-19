import * as vscode from "vscode";
import { CanvasPanel } from "../canvas/CanvasPanel";
import type { CanvasState } from "../components/ComponentModel";

function createDefaultCanvasState(): CanvasState {
  return {
    className: "MainWindow",
    frameTitle: "MainWindow",
    frameWidth: 800,
    frameHeight: 600,
    components: [],
  };
}

function isMissingLayoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = Reflect.get(error, "code");
  if (code === "FileNotFound" || code === "ENOENT") {
    return true;
  }

  const message = Reflect.get(error, "message");
  if (typeof message === "string" && /file not found|enoent|not exist|cannot find/i.test(message)) {
    return true;
  }

  return false;
}

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

    let state: CanvasState;

    try {
      const fileContent = await vscode.workspace.fs.readFile(filePath);
      const parsedState = JSON.parse(Buffer.from(fileContent).toString("utf-8")) as CanvasState;
      const className = parsedState.className || "MainWindow";
      state = { ...parsedState, className, frameTitle: parsedState.frameTitle ?? className };
      vscode.window.showInformationMessage("Canvas loaded from .swingbuilder-layout.json");
    } catch (error) {
      if (isMissingLayoutError(error)) {
        state = createDefaultCanvasState();
        outputChannel.appendLine(
          "Layout file .swingbuilder-layout.json was not found. Opened a new empty MainWindow layout.",
        );
        vscode.window.showInformationMessage(
          "No .swingbuilder-layout.json found. Opened a new empty MainWindow layout.",
        );
      } else {
        outputChannel.appendLine(`Error opening layout file: ${error}`);
        vscode.window.showErrorMessage("Could not read .swingbuilder-layout.json.");
        return;
      }
    }

    CanvasPanel.createOrShow(context.extensionUri, state.className);
    if (CanvasPanel.currentPanel) {
      CanvasPanel.currentPanel.loadState(state);
    }
  });
}
