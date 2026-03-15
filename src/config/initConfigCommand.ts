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
      Panel: { backgroundColor: "#F5F5F5" },
      Button: { backgroundColor: "#4A90E2", textColor: "#FFFFFF" },
      Label: { textColor: "#222222" },
      TextField: { fontFamily: "Consolas", fontSize: 13 },
      PasswordField: { fontFamily: "Consolas", fontSize: 13 },
      TextArea: { fontFamily: "Segoe UI", fontSize: 12 },
      CheckBox: { textColor: "#1A1A1A" },
      RadioButton: { textColor: "#1A1A1A" },
      ComboBox: { backgroundColor: "#FFFFFF" },
      List: { backgroundColor: "#FFFFFF", textColor: "#333333" },
      ProgressBar: { backgroundColor: "#E6F4EA" },
      Slider: { backgroundColor: "#F4F7FF" },
      Spinner: { backgroundColor: "#FFFFFF" },
      Separator: { backgroundColor: "#D9D9D9" },
    },
  };

  const content = Buffer.from(`${JSON.stringify(template, null, 2)}\n`, "utf-8");
  await vscode.workspace.fs.writeFile(configPath, content);
  vscode.window.showInformationMessage("Created .swingbuilder.json");
}
