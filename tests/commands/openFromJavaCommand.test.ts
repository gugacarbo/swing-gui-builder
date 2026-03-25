import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasState } from "../../src/components/ComponentModel";
import type { ParsedJavaFile } from "../../src/parser/types";

const mocks = vi.hoisted(() => ({
  commandHandlers: new Map<string, () => Promise<void>>(),
  workspaceFolders: [{ uri: { fsPath: "/workspace" } }] as
    | Array<{ uri: { fsPath: string } }>
    | undefined,
  showOpenDialog: vi.fn<(options: unknown) => Promise<Array<{ fsPath: string }> | undefined>>(
    async () => undefined,
  ),
  readFile: vi.fn<(uri: { fsPath: string }) => Promise<Uint8Array>>(async () =>
    Buffer.from("public class MainWindow {}"),
  ),
  showWarningMessage: vi.fn<(message: string, ...items: string[]) => Promise<string | undefined>>(
    async () => undefined,
  ),
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  createOrShow: vi.fn(),
  loadState: vi.fn(),
  setSourceFile: vi.fn(),
  setRoundTripStatus: vi.fn(),
  restoreLatestBackupForSource: vi.fn<
    (sourceFilePath: string, outputChannel: unknown) => Promise<boolean>
  >(async () => false),
  parseJavaFile: vi.fn<(content: string) => ParsedJavaFile>(() => ({
    classInfo: {
      className: "MainWindow",
      isGuiClass: true,
      extendsClass: "JFrame",
    },
    symbolTable: {},
    components: [],
    parentChildRelationships: [],
    methodCalls: [],
  })),
  parsedToCanvasState: vi.fn<(parsed: ParsedJavaFile) => CanvasState>(() => ({
    className: "MainWindow",
    frameTitle: "MainWindow",
    frameWidth: 800,
    frameHeight: 600,
    components: [],
  })),
}));

vi.mock("vscode", () => ({
  commands: {
    registerCommand: vi.fn((commandId: string, callback: () => Promise<void>) => {
      mocks.commandHandlers.set(commandId, callback);
      return { dispose: vi.fn() };
    }),
  },
  workspace: {
    get workspaceFolders() {
      return mocks.workspaceFolders;
    },
    fs: {
      readFile: mocks.readFile,
    },
  },
  window: {
    showOpenDialog: mocks.showOpenDialog,
    showWarningMessage: mocks.showWarningMessage,
    showInformationMessage: mocks.showInformationMessage,
    showErrorMessage: mocks.showErrorMessage,
  },
}));

vi.mock("../../src/canvas/CanvasPanel", () => ({
  CanvasPanel: {
    createOrShow: mocks.createOrShow,
    currentPanel: {
      loadState: mocks.loadState,
      setSourceFile: mocks.setSourceFile,
      setRoundTripStatus: mocks.setRoundTripStatus,
    },
  },
}));

vi.mock("../../src/parser/JavaParser", () => ({
  parseJavaFile: mocks.parseJavaFile,
}));

vi.mock("../../src/parser/toCanvasState", () => ({
  parsedToCanvasState: mocks.parsedToCanvasState,
}));

vi.mock("../../src/commands/restoreFromBackupCommand", () => ({
  restoreLatestBackupForSource: mocks.restoreLatestBackupForSource,
}));

import { CanvasPanel } from "../../src/canvas/CanvasPanel";
import { registerOpenFromJavaCommand } from "../../src/commands/openFromJavaCommand";

describe("registerOpenFromJavaCommand", () => {
  beforeEach(() => {
    mocks.commandHandlers.clear();
    vi.clearAllMocks();
    mocks.workspaceFolders = [{ uri: { fsPath: "/workspace" } }];
    mocks.showOpenDialog.mockResolvedValue(undefined);
    mocks.readFile.mockResolvedValue(Buffer.from("public class MainWindow {}"));
    mocks.showWarningMessage.mockResolvedValue(undefined);
    mocks.restoreLatestBackupForSource.mockResolvedValue(false);
    mocks.parseJavaFile.mockReturnValue({
      classInfo: {
        className: "MainWindow",
        isGuiClass: true,
        extendsClass: "JFrame",
      },
      symbolTable: {},
      components: [],
      parentChildRelationships: [],
      methodCalls: [],
    });
    mocks.parsedToCanvasState.mockReturnValue({
      className: "MainWindow",
      frameTitle: "MainWindow",
      frameWidth: 800,
      frameHeight: 600,
      components: [],
    });
    CanvasPanel.currentPanel = {
      loadState: mocks.loadState,
      setSourceFile: mocks.setSourceFile,
      setRoundTripStatus: mocks.setRoundTripStatus,
    } as never;
  });

  it("registers swingGuiBuilder.openFromJava and opens file picker filtered to java", async () => {
    const outputChannel = { appendLine: vi.fn() };

    registerOpenFromJavaCommand(
      { extensionUri: { fsPath: "/extension" } } as never,
      outputChannel as never,
    );
    const handler = mocks.commandHandlers.get("swingGuiBuilder.openFromJava");

    await handler?.();

    expect(handler).toBeDefined();
    expect(mocks.showOpenDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          "Java Files": ["java"],
        },
        defaultUri: { fsPath: "/workspace" },
      }),
    );
  });

  it("parses selected Java file, loads canvas and stores source path", async () => {
    const selectedFile = { fsPath: "/workspace/src/ui/MainWindow.java" };
    const outputChannel = { appendLine: vi.fn() };
    const parsedJava: ParsedJavaFile = {
      classInfo: {
        className: "ParsedWindow",
        isGuiClass: true,
        extendsClass: "JFrame",
      },
      symbolTable: {},
      components: [],
      parentChildRelationships: [],
      methodCalls: [],
    };
    const canvasState: CanvasState = {
      className: "ParsedWindow",
      frameTitle: "Parsed Window",
      frameWidth: 1024,
      frameHeight: 768,
      components: [],
    };

    mocks.showOpenDialog.mockResolvedValueOnce([selectedFile]);
    mocks.parseJavaFile.mockReturnValueOnce(parsedJava);
    mocks.parsedToCanvasState.mockReturnValueOnce(canvasState);

    registerOpenFromJavaCommand(
      { extensionUri: { fsPath: "/extension" } } as never,
      outputChannel as never,
    );
    const handler = mocks.commandHandlers.get("swingGuiBuilder.openFromJava");

    await handler?.();

    expect(mocks.readFile).toHaveBeenCalledWith(selectedFile);
    expect(mocks.parseJavaFile).toHaveBeenCalledWith("public class MainWindow {}");
    expect(mocks.parsedToCanvasState).toHaveBeenCalledWith(parsedJava);
    expect(mocks.createOrShow).toHaveBeenCalledWith({ fsPath: "/extension" }, "ParsedWindow");
    expect(mocks.loadState).toHaveBeenCalledWith(canvasState);
    expect(mocks.setSourceFile).toHaveBeenCalledWith("/workspace/src/ui/MainWindow.java");
    expect(mocks.setRoundTripStatus).toHaveBeenCalledWith(true);
    expect(outputChannel.appendLine).toHaveBeenCalledWith(
      "Opened Java file on canvas: /workspace/src/ui/MainWindow.java",
    );
    expect(mocks.showInformationMessage).toHaveBeenCalledWith(
      "Opened MainWindow.java in Swing GUI Builder.",
    );
  });

  it("handles parse/open errors and reports to output channel", async () => {
    const outputChannel = { appendLine: vi.fn() };
    const selectedFile = { fsPath: "/workspace/src/ui/BrokenWindow.java" };

    mocks.showOpenDialog.mockResolvedValueOnce([selectedFile]);
    mocks.parseJavaFile.mockImplementationOnce(() => {
      throw new Error("Parse failed");
    });

    registerOpenFromJavaCommand(
      { extensionUri: { fsPath: "/extension" } } as never,
      outputChannel as never,
    );
    const handler = mocks.commandHandlers.get("swingGuiBuilder.openFromJava");

    await handler?.();

    expect(outputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining("Error opening Java file:"),
    );
    expect(mocks.showErrorMessage).toHaveBeenCalledWith(
      "Could not open Java file in Swing GUI Builder. See output for details.",
    );
  });

  it("offers restore from backup when a parse error occurs", async () => {
    const outputChannel = { appendLine: vi.fn() };
    const selectedFile = { fsPath: "/workspace/src/ui/BrokenWindow.java" };

    mocks.showOpenDialog.mockResolvedValueOnce([selectedFile]);
    mocks.parseJavaFile.mockImplementationOnce(() => {
      throw new Error(
        "Sad sad panda, parsing errors detected in line: NaN, column: NaN! Expecting --> '}' <--",
      );
    });
    mocks.showWarningMessage.mockResolvedValueOnce("Restore Backup");
    mocks.restoreLatestBackupForSource.mockResolvedValueOnce(true);

    registerOpenFromJavaCommand(
      { extensionUri: { fsPath: "/extension" } } as never,
      outputChannel as never,
    );
    const handler = mocks.commandHandlers.get("swingGuiBuilder.openFromJava");

    await handler?.();

    expect(mocks.showWarningMessage).toHaveBeenCalledWith(
      "Could not parse BrokenWindow.java. Do you want to restore the latest backup?",
      "Restore Backup",
      "Cancel",
    );
    expect(mocks.restoreLatestBackupForSource).toHaveBeenCalledWith(
      "/workspace/src/ui/BrokenWindow.java",
      outputChannel,
    );
    expect(mocks.showErrorMessage).not.toHaveBeenCalledWith(
      "Could not open Java file in Swing GUI Builder. See output for details.",
    );
  });

  it("keeps parse error flow when restore attempt fails", async () => {
    const outputChannel = { appendLine: vi.fn() };
    const selectedFile = { fsPath: "/workspace/src/ui/BrokenWindow.java" };

    mocks.showOpenDialog.mockResolvedValueOnce([selectedFile]);
    mocks.parseJavaFile.mockImplementationOnce(() => {
      throw new Error("parsing errors detected");
    });
    mocks.showWarningMessage.mockResolvedValueOnce("Restore Backup");
    mocks.restoreLatestBackupForSource.mockRejectedValueOnce(new Error("restore failed"));

    registerOpenFromJavaCommand(
      { extensionUri: { fsPath: "/extension" } } as never,
      outputChannel as never,
    );
    const handler = mocks.commandHandlers.get("swingGuiBuilder.openFromJava");

    await handler?.();

    expect(outputChannel.appendLine).toHaveBeenCalledWith(
      "Error restoring backup: Error: restore failed",
    );
    expect(mocks.showErrorMessage).toHaveBeenCalledWith(
      "Could not open Java file in Swing GUI Builder. See output for details.",
    );
  });
});
