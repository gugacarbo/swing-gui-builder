import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasState, ComponentModel } from "../../src/components/ComponentModel";

const mocks = vi.hoisted(() => ({
  commandHandlers: new Map<string, () => Promise<void>>(),
  workspaceFolders: [{ uri: { fsPath: "C:\\workspace" } }] as
    | Array<{ uri: { fsPath: string } }>
    | undefined,
  executeCommand: vi.fn<(command: string, ...args: unknown[]) => Promise<void>>(async () => {}),
  createDirectory: vi.fn<(uri: { fsPath: string }) => Promise<void>>(async () => {}),
  stat: vi.fn<(uri: { fsPath: string }) => Promise<void>>(async () => {
    throw new Error("File not found");
  }),
  readFile: vi.fn<(uri: { fsPath: string }) => Promise<Uint8Array>>(async () =>
    Buffer.from("existing"),
  ),
  writeFile: vi.fn<(uri: { fsPath: string }, content: Uint8Array) => Promise<void>>(async () => {}),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn<(message: string, ...items: string[]) => Promise<string | undefined>>(
    async () => undefined,
  ),
  showInformationMessage: vi.fn<
    (message: string, ...items: string[]) => Promise<string | undefined>
  >(async () => undefined),
  showInputBox: vi.fn(async () => "src/main/java"),
  showOpenDialog: vi.fn<(options: unknown) => Promise<Array<{ fsPath: string }> | undefined>>(
    async () => undefined,
  ),
  getOutputDirectory: vi.fn(() => "src/main/java"),
  detectJavaProject: vi.fn(() => undefined),
  resolveOutputDirectory: vi.fn((configuredDir: string) => configuredDir),
  inferJavaPackage: vi.fn(() => undefined),
  generateJavaFiles: vi.fn<
    (
      state: CanvasState,
      packageName?: string,
    ) => Array<{ fileName: string; content: string; subfolder?: string }>
  >(() => [
    { fileName: "MainFrame.java", content: "public class MainFrame {}", subfolder: undefined },
  ]),
  mergeJavaFile: vi.fn<
    (
      filePath: string,
      generatedContent: string,
    ) => Promise<{
      success: boolean;
      mergedContent: string;
      hadMarkers: boolean;
      replacedSections: string[];
      preservedSections: string[];
      detectedGuiRegions: Array<{ startLine: number; endLine: number; reasons: string[] }>;
      backupPath?: string;
      message?: string;
    }>
  >(async (_filePath: string, generatedContent: string) => ({
    success: true,
    mergedContent: generatedContent,
    hadMarkers: true,
    replacedSections: ["fields", "constructor", "methods"],
    preservedSections: ["outside-markers"],
    detectedGuiRegions: [],
    backupPath: undefined,
  })),
}));

vi.mock("vscode", () => ({
  commands: {
    registerCommand: vi.fn((commandId: string, callback: () => Promise<void>) => {
      mocks.commandHandlers.set(commandId, callback);
      return { dispose: vi.fn() };
    }),
    executeCommand: mocks.executeCommand,
  },
  Uri: {
    joinPath: (baseUri: { fsPath: string }, ...paths: string[]) => ({
      fsPath: path.join(baseUri.fsPath, ...paths),
    }),
    file: (fsPath: string) => ({ fsPath }),
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

vi.mock("../../src/merger/JavaFileMerger", () => ({
  mergeJavaFile: mocks.mergeJavaFile,
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
    mocks.showInformationMessage.mockResolvedValue(undefined);
    mocks.getOutputDirectory.mockReturnValue("src/main/java");
    mocks.detectJavaProject.mockReturnValue(undefined);
    mocks.resolveOutputDirectory.mockImplementation((configuredDir: string) => configuredDir);
    mocks.inferJavaPackage.mockReturnValue(undefined);
    mocks.generateJavaFiles.mockReturnValue([
      { fileName: "MainFrame.java", content: "public class MainFrame {}" },
    ]);
    mocks.mergeJavaFile.mockResolvedValue({
      success: true,
      mergedContent: "public class MainFrame {}",
      hadMarkers: true,
      replacedSections: ["fields", "constructor", "methods"],
      preservedSections: ["outside-markers"],
      detectedGuiRegions: [],
      backupPath: undefined,
    });
    mocks.executeCommand.mockResolvedValue(undefined);

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
      getSourceFile: () => undefined,
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
    expect(mocks.createDirectory).toHaveBeenCalled();
    const actualFsPath = mocks.createDirectory.mock.calls[0][0].fsPath.replace(/\\/g, "/");
    const expectedFsPath = ["C:", "workspace", "src", "generated", "ui"].join("/");
    expect(actualFsPath).toBe(expectedFsPath);
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

  it("shows folder picker when no project structure detected and using default output dir", async () => {
    // This tests the branch where: !projectStructure && configuredDir === "swing/components/"
    // Set up mocks for this specific test
    mocks.workspaceFolders = [{ uri: { fsPath: "C:\\workspace" } }];
    mocks.getOutputDirectory.mockReturnValue("swing/components/");
    mocks.detectJavaProject.mockReturnValue(undefined);
    mocks.resolveOutputDirectory.mockImplementation((configuredDir: string) => configuredDir);
    mocks.showOpenDialog.mockResolvedValue([{ fsPath: "C:\\workspace\\custom\\output" }]);
    mocks.generateJavaFiles.mockReturnValue([]);
    mocks.createDirectory.mockResolvedValue(undefined);
    mocks.showInputBox.mockResolvedValue(undefined); // Ensure input box returns undefined

    // Register fresh handler
    const outputChannel = { appendLine: vi.fn() };
    registerGenerateCommand(outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.generate");
    if (!handler) throw new Error("Handler not registered");

    await handler();

    // Folder picker should be shown
    expect(mocks.showOpenDialog).toHaveBeenCalled();
    // Input box should NOT be shown since folder picker is used instead
    expect(mocks.showInputBox).not.toHaveBeenCalled();
    // Directory should be created
    expect(mocks.createDirectory).toHaveBeenCalled();
  });

  it("uses JavaFileMerger in round-trip mode and offers diff preview", async () => {
    const sourcePath = "C:\\workspace\\src\\ui\\BranchCoverageFrame.java";
    const backupPath = `${sourcePath}.2026-03-24T10-20-30-400Z.bak`;
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
      getSourceFile: () => sourcePath,
    } as never;

    mocks.generateJavaFiles.mockReturnValue([
      {
        fileName: "BranchCoverageFrame.java",
        content: "public class BranchCoverageFrame {}",
      },
    ]);
    mocks.stat.mockResolvedValue(undefined);
    mocks.mergeJavaFile.mockResolvedValue({
      success: true,
      mergedContent: "public class BranchCoverageFrame {}",
      hadMarkers: true,
      replacedSections: ["fields", "constructor", "methods"],
      preservedSections: ["outside-markers"],
      detectedGuiRegions: [],
      backupPath,
    });
    mocks.showInformationMessage.mockResolvedValue(undefined);
    mocks.showInformationMessage.mockResolvedValueOnce("Preview Diff");
    const { handler } = registerAndGetHandler();

    await handler();

    expect(mocks.mergeJavaFile).toHaveBeenCalledWith(
      sourcePath,
      "public class BranchCoverageFrame {}",
    );
    expect(mocks.executeCommand).toHaveBeenCalledWith(
      "vscode.diff",
      { fsPath: backupPath },
      { fsPath: sourcePath },
      "Round-trip merge: BranchCoverageFrame.java",
    );
    expect(mocks.writeFile).not.toHaveBeenCalled();
    expect(mocks.showInformationMessage).toHaveBeenCalledWith(
      "Merged generated code into BranchCoverageFrame.java.",
      "Preview Diff",
      "Continue",
    );
    expect(mocks.showInformationMessage).toHaveBeenCalledWith(
      "Generated 1 Java file(s) in src/main/java (1 merged with round-trip mode)",
    );
  });

  it("falls back to writing new file when round-trip source file does not exist", async () => {
    const sourcePath = "C:\\workspace\\src\\ui\\BranchCoverageFrame.java";
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
      getSourceFile: () => sourcePath,
    } as never;

    mocks.generateJavaFiles.mockReturnValue([
      {
        fileName: "BranchCoverageFrame.java",
        content: "public class BranchCoverageFrame {}",
      },
    ]);
    mocks.stat.mockRejectedValue(new Error("File not found"));
    const { handler, outputChannel } = registerAndGetHandler();

    await handler();

    expect(mocks.mergeJavaFile).not.toHaveBeenCalled();
    expect(mocks.createDirectory).toHaveBeenCalledWith({
      fsPath: path.dirname(sourcePath),
    });
    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: sourcePath },
      Buffer.from("public class BranchCoverageFrame {}", "utf-8"),
    );
    expect(outputChannel.appendLine).toHaveBeenCalledWith(
      `Round-trip source file not found. Created new file: ${sourcePath}`,
    );
  });
});
