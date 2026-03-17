import * as vscode from "vscode";
import { initProjectConfig } from "../config/initConfigCommand";

export function registerInitConfigCommand(): vscode.Disposable {
  return vscode.commands.registerCommand("swingGuiBuilder.initConfig", initProjectConfig);
}
