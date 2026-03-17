import * as vscode from "vscode";
import { CanvasPanel } from "../canvas/CanvasPanel";

export function registerNewWindowCommand(context: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand("swingGuiBuilder.newWindow", async () => {
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
}
