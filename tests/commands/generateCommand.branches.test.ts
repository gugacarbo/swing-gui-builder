import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasState, ComponentModel } from "../../src/components/ComponentModel";

const mocks = vi.hoisted(() => ({
  commandHandlers: new Map<string, () => Promise<void>>(),
  workspaceFolders: [{ uri: { fsPath: "C:\\workspace" } }] as
    | Array<{ uri: { fsPath: string } }>
    | undefined,
  createDirectory: vi.fn<(uri: { fsPath: string }) => Promise<void>>(async () => {}),
  stat: vi.fn<(uri: { fsPath: string }) => Promise<void>>(async () => {
    throw new Error("File not found");
  }),
  readFile: vi.fn<(uri: { fsPath: string }) => Promise<Uint8Array>>(async () =>
    Buffer.from("existing"),
  ),
  writeFile: vi.fn<(uri: { fsPath: string }, content: Uint8Array) => Promise<void>>(async () => {}),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn<
    (message: string, ...items: string[]) => Promise<string | undefined>
  >(async () => undefined),
  showInformationMessage: vi.fn(),
  showInputBox: vi.fn(async () => "src/main/java"),
  showOpenDialog: vi.fn<
    (options: unknown) => Promise<Array<{ fsPath: string }> | undefined>
  >(async () => undefined),
  getOutputDirectory: vi.fn(() => "src/main/java"),
  detectJavaProject: vi.fn(() => undefined),
  resolveOutputDirectory: vi.fn((configuredDir: string) => configuredDir),
  inferJavaPackage: vi.fn(() => undefined),
  generateJavaFiles: vi.fn<
    (state: CanvasState, packageName?: string) => Array<{ fileName: string; content: string; subfolder?: string }>
  >(() => [{ fileName: "MainFrame.java", content: "public class MainFrame {}", subfolder: undefined }]),
}));

vi.mock("vscode", () => ({
  commands: {
    registerCommand: vi.fn((commandId: string, callback: () => Promise<void>) => {
      mocks.commandHandlers.set(commandId, callback);
      return { dispose: vi.fn() };
    }),
  },
  Uri: {
    joinPath: (baseUri: { fsPath: string }, ...paths: string[]) => ({
      fsPath: path.join(baseUri.fsPath, ...paths),
    }),
  },
  workspace: {
    get workspaceFolders() {
      return mocks.workspaceFolders;
    },
    fs: {
      createDirectory: mocks.createDirectory,
      stat: mocks.stat,
      readFile: mocks.readFile,
      writeFile: mocks.writeFile,
    },
  },
  window: {
    showErrorMessage: mocks.showErrorMessage,
    showWarningMessage: mocks.showWarningMessage,
    showInformationMessage: mocks.showInformationMessage,
    showInputBox: mocks.showInputBox,
    showOpenDialog: mocks.showOpenDialog,
  },
}));

vi.mock("../../src/canvas/CanvasPanel", () => ({
  CanvasPanel: {
    currentPanel: undefined,
  },
}));

vi.mock("../../src/config/ConfigReader", () => ({
  getOutputDirectory: mocks.getOutputDirectory,
}));

vi.mock("../../src/utils/JavaProjectDetector", () => ({
  detectJavaProject: mocks.detectJavaProject,
}));

vi.mock("../../src/utils/JavaPackageInference", () => ({
  inferJavaPackage: mocks.inferJavaPackage,
  resolveOutputDirectory: mocks.resolveOutputDirectory,
}));

vi.mock("../../src/generator/JavaGenerator", () => ({
  generateJavaFiles: mocks.generateJavaFiles,
}));

import { CanvasPanel } from "../../src/canvas/CanvasPanel";
import { registerGenerateCommand } from "../../src/commands/generateCommand";

type ComponentOverrides = Partial<Omit<ComponentModel, "id" | "type" | "variableName">> & {
  id: string;
  type: ComponentModel["type"];
  variableName: string;
};

function createComponent(overrides: ComponentOverrides): ComponentModel {
  const { id, type, variableName, ...rest } = overrides;

  return {
    id,
    type,
    variableName,
    x: 0,
    y: 0,
    width: 120,
    height: 30,
    text: "",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    fontFamily: "Arial",
    fontSize: 12,
    eventMethodName: "",
    ...rest,
  };
}

function createState(components: ComponentModel[]): CanvasState {
  return {
    className: "BranchCoverageFrame",
    frameWidth: 800,
    frameHeight: 600,
    components,
  };
}

function registerAndGetHandler() {
  const outputChannel = { appendLine: vi.fn() };
  registerGenerateCommand(outputChannel as never);
  const handler = mocks.commandHandlers.get("swingGuiBuilder.generate");

  if (!handler) {
    throw new Error("Generate command handler was not registered");
  }

  return { handler, outputChannel };
}

describe("registerGenerateCommand branch coverage", () => {
  beforeEach(() => {
    mocks.commandHandlers.clear();
    vi.clearAllMocks();

    mocks.workspaceFolders = [{ uri: { fsPath: "C:\\workspace" } }];
    mocks.createDirectory.mockResolvedValue(undefined);
    mocks.stat.mockRejectedValue(new Error("File not found"));
    mocks.readFile.mockResolvedValue(Buffer.from("existing"));
    mocks.writeFile.mockResolvedValue(undefined);
    mocks.showInputBox.mockResolvedValue("src/main/java");
    mocks.showOpenDialog.mockResolvedValue(undefined);
    mocks.showWarningMessage.mockResolvedValue(undefined);
    mocks.getOutputDirectory.mockReturnValue("src/main/java");
    mocks.detectJavaProject.mockReturnValue(undefined);
    mocks.resolveOutputDirectory.mockImplementation((configuredDir: string) => configuredDir);
    mocks.inferJavaPackage.mockReturnValue(undefined);
    mocks.generateJavaFiles.mockReturnValue([
      { fileName: "MainFrame.java", content: "public class MainFrame {}" },
    ]);

    CanvasPanel.currentPanel = {
      getCanvasState: () =>
        createState([
          createComponent({
            id: "button-1",
            type: "Button",
            variableName: "button1",
            text: "Generate",
          }),
        ]),
    } as never;
  });

  it("shows an error when no canvas panel is open", async () => {
    CanvasPanel.currentPanel = undefined;
    const { handler } = registerAndGetHandler();

    await handler();

    expect(mocks.showErrorMessage).toHaveBeenCalledWith("No canvas is open. Open a canvas first.");
  });

  it("shows an error when no workspace folder is open", async () => {
    mocks.workspaceFolders = undefined;
    const { handler } = registerAndGetHandler();

    await handler();

    expect(mocks.showErrorMessage).toHaveBeenCalledWith("No workspace folder open.");
  });

  it("warns when the canvas has no components", async () => {
    CanvasPanel.currentPanel = {
      getCanvasState: () => createState([]),
    } as never;
    const { handler } = registerAndGetHandler();

    await handler();

    expect(mocks.showWarningMessage).toHaveBeenCalledWith(
      "Canvas has no components. Add components before generating.",
    );
    expect(mocks.generateJavaFiles).not.toHaveBeenCalled();
  });

  it("returns early when folder picker is dismissed for default output path", async () => {
    mocks.getOutputDirectory.mockReturnValue("swing/components/");
    mocks.detectJavaProject.mockReturnValue(undefined);
    mocks.resolveOutputDirectory.mockImplementation((configuredDir: string) => configuredDir);
    mocks.showOpenDialog.mockResolvedValue(undefined);
    const { handler } = registerAndGetHandler();

    await handler();

    expect(mocks.showOpenDialog).toHaveBeenCalled();
    expect(mocks.createDirectory).not.toHaveBeenCalled();
  });

  it("uses folder picker path and resolves it relative to workspace root", async () => {
    mocks.getOutputDirectory.mockReturnValue("swing/components/");
    mocks.detectJavaProject.mockReturnValue(undefined);
    mocks.resolveOutputDirectory.mockImplementation((configuredDir: string) => configuredDir);
    mocks.showOpenDialog.mockResolvedValue([{ fsPath: "C:\\workspace\\src\\generated\\ui" }]);
    mocks.generateJavaFiles.mockReturnValue([]);
    const { handler } = registerAndGetHandler();

    await handler();

    expect(mocks.showOpenDialog).toHaveBeenCalled();
    expect(mocks.showInputBox).not.toHaveBeenCalled();
    expect(mocks.createDirectory).toHaveBeenCalledWith({
      fsPath: path.join("C:\\workspace", "src\\generated\\ui"),
    });
  });

  it("logs a note when output directory creation fails", async () => {
    mocks.createDirectory.mockRejectedValueOnce(new Error("already exists"));
    mocks.generateJavaFiles.mockReturnValue([]);
    const { handler, outputChannel } = registerAndGetHandler();

    await handler();

    expect(outputChannel.appendLine).toHaveBeenCalledWith(
      "Note: Directory may already exist: src/main/java",
    );
  });

  it("cancels generation when overwrite prompt returns Cancel", async () => {
    mocks.stat.mockResolvedValue(undefined);
    mocks.showWarningMessage.mockResolvedValueOnce("Cancel");
    const { handler } = registerAndGetHandler();

    await handler();

    expect(mocks.showInformationMessage).toHaveBeenCalledWith("Code generation cancelled.");
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it("returns when overwrite dialog is dismissed", async () => {
    mocks.stat.mockResolvedValue(undefined);
    mocks.showWarningMessage.mockResolvedValueOnce(undefined);
    const { handler } = registerAndGetHandler();

    await handler();

    expect(mocks.writeFile).not.toHaveBeenCalled();
    expect(mocks.showInformationMessage).not.toHaveBeenCalledWith(
      expect.stringContaining("Generated"),
    );
  });

  it("continues overwrite when backup creation fails", async () => {
    mocks.stat.mockResolvedValue(undefined);
    mocks.showWarningMessage.mockResolvedValueOnce("Overwrite");
    mocks.readFile.mockRejectedValueOnce(new Error("backup failed"));
    const { handler, outputChannel } = registerAndGetHandler();

    await handler();

    expect(outputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Could not create backup for MainFrame.java"),
    );
    expect(mocks.showWarningMessage).toHaveBeenCalledWith(
      "Could not create backup for MainFrame.java. Proceeding without backup.",
    );
    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: path.join("C:\\workspace", "src/main/java", "MainFrame.java") },
      Buffer.from("public class MainFrame {}", "utf-8"),
    );
  });

  it("creates backups for overwrite-all flow and handles backup errors on subsequent files", async () => {
    mocks.stat.mockResolvedValue(undefined);
    mocks.showWarningMessage.mockResolvedValueOnce("Overwrite All");
    mocks.generateJavaFiles.mockReturnValue([
      { fileName: "MainFrame.java", content: "public class MainFrame {}" },
      { fileName: "CustomButton1.java", content: "public class CustomButton1 {}" },
    ]);
    mocks.readFile
      .mockResolvedValueOnce(Buffer.from("existing-main"))
      .mockRejectedValueOnce(new Error("backup failed"));
    const { handler, outputChannel } = registerAndGetHandler();

    await handler();

    expect(mocks.readFile).toHaveBeenCalledTimes(2);
    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: path.join("C:\\workspace", "src/main/java", "MainFrame_backup.java") },
      Buffer.from("existing-main"),
    );
    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: path.join("C:\\workspace", "src/main/java", "MainFrame.java") },
      Buffer.from("public class MainFrame {}", "utf-8"),
    );
    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: path.join("C:\\workspace", "src/main/java", "CustomButton1.java") },
      Buffer.from("public class CustomButton1 {}", "utf-8"),
    );
    expect(outputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Could not create backup for CustomButton1.java"),
    );
  });

  it("creates overwrite-all backups successfully for subsequent files", async () => {
    mocks.stat.mockResolvedValue(undefined);
    mocks.showWarningMessage.mockResolvedValueOnce("Overwrite All");
    mocks.generateJavaFiles.mockReturnValue([
      { fileName: "MainFrame.java", content: "public class MainFrame {}" },
      { fileName: "CustomButton1.java", content: "public class CustomButton1 {}" },
    ]);
    mocks.readFile
      .mockResolvedValueOnce(Buffer.from("existing-main"))
      .mockResolvedValueOnce(Buffer.from("existing-custom"));
    const { handler } = registerAndGetHandler();

    await handler();

    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: path.join("C:\\workspace", "src/main/java", "CustomButton1_backup.java") },
      Buffer.from("existing-custom"),
    );
    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: path.join("C:\\workspace", "src/main/java", "CustomButton1.java") },
      Buffer.from("public class CustomButton1 {}", "utf-8"),
    );
  });
});
