import * as vscode from "vscode";
import { registerGenerateCommand } from "./commands/generateCommand";
import { registerInitConfigCommand } from "./commands/initConfigCommand";
import { registerNewWindowCommand } from "./commands/newWindowCommand";
import { registerOpenCommand } from "./commands/openCommand";
import { registerOpenFromJavaCommand } from "./commands/openFromJavaCommand";
import { registerPreviewCodeCommand } from "./commands/previewCodeCommand";
import { registerRestoreFromBackupCommand } from "./commands/restoreFromBackupCommand";
import { registerSaveCommand } from "./commands/saveCommand";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("Swing GUI Builder");

  const newWindowCmd = registerNewWindowCommand(context);
  const generateCmd = registerGenerateCommand(outputChannel);
  const previewCodeCmd = registerPreviewCodeCommand();
  const saveCmd = registerSaveCommand();
  const openCmd = registerOpenCommand(context, outputChannel);
  const openFromJavaCmd = registerOpenFromJavaCommand(context, outputChannel);
  const restoreFromBackupCmd = registerRestoreFromBackupCommand(outputChannel);
  const initConfigCmd = registerInitConfigCommand();

  context.subscriptions.push(
    newWindowCmd,
    generateCmd,
    previewCodeCmd,
    saveCmd,
    openCmd,
    openFromJavaCmd,
    restoreFromBackupCmd,
    initConfigCmd,
  );
}

export function deactivate() {}
