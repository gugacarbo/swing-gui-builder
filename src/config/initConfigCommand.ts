import * as vscode from "vscode";

export async function initProjectConfig(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }

  const configPath = vscode.Uri.joinPath(workspaceFolders[0].uri, ".swingbuilder.json");

  try {
    await vscode.workspace.fs.stat(configPath);
    const overwrite = await vscode.window.showWarningMessage(
      ".swingbuilder.json already exists. Overwrite?",
      "Yes",
      "No",
    );
    if (overwrite !== "Yes") return;
  } catch {
    // File doesn't exist, proceed
  }

  const template = {
    defaultBackgroundColor: "#FFFFFF",
    defaultTextColor: "#000000",
    defaultFontFamily: "Arial",
    defaultFontSize: 12,
    outputDirectory: "swing/components/",
    components: {
      Button: {},
      Label: {},
      TextField: {},
      PasswordField: {},
      TextArea: {},
    },
  };

  const content = Buffer.from(`${JSON.stringify(template, null, 2)}\n`, "utf-8");
  await vscode.workspace.fs.writeFile(configPath, content);
  vscode.window.showInformationMessage("Created .swingbuilder.json");
}
