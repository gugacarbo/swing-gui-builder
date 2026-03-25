import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  commandHandlers: new Map<string, (...args: unknown[]) => Promise<void>>(),
  workspaceFolders: [{ uri: { fsPath: "C:\\workspace" } }] as
    | Array<{ uri: { fsPath: string } }>
    | undefined,
  executeCommand: vi.fn<(command: string, ...args: unknown[]) => Promise<void>>(async () => {}),
  readDirectory: vi.fn<(uri: { fsPath: string }) => Promise<Array<[string, number]>>>(
    async () => [],
  ),
  stat: vi.fn<(uri: { fsPath: string }) => Promise<{ mtime: number }>>(async () => ({ mtime: 0 })),
  readFile: vi.fn<(uri: { fsPath: string }) => Promise<Uint8Array>>(async () =>
    Buffer.from("backup-content"),
  ),
  writeFile: vi.fn<(uri: { fsPath: string }, content: Uint8Array) => Promise<void>>(async () => {}),
  showOpenDialog: vi.fn<(options: unknown) => Promise<Array<{ fsPath: string }> | undefined>>(
    async () => undefined,
  ),
  showWarningMessage: vi.fn<(message: string, ...items: string[]) => Promise<string | undefined>>(
    async () => undefined,
  ),
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  outputAppendLine: vi.fn(),
  getSourceFile: vi.fn<() => string | undefined>(() => undefined),
}));

vi.mock("vscode", () => ({
  FileType: {
    File: 1,
    Directory: 2,
  },
  commands: {
    registerCommand: vi.fn((commandId: string, callback: (...args: unknown[]) => Promise<void>) => {
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
      readDirectory: mocks.readDirectory,
      stat: mocks.stat,
      readFile: mocks.readFile,
      writeFile: mocks.writeFile,
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
    currentPanel: {
      getSourceFile: () => mocks.getSourceFile(),
    },
  },
}));

import {
  inferSourcePathFromBackupPath,
  registerRestoreFromBackupCommand,
  restoreLatestBackupForSource,
} from "../../src/commands/restoreFromBackupCommand";

describe("restoreFromBackupCommand", () => {
  beforeEach(() => {
    mocks.commandHandlers.clear();
    vi.clearAllMocks();
    mocks.workspaceFolders = [{ uri: { fsPath: "C:\\workspace" } }];
    mocks.readDirectory.mockResolvedValue([]);
    mocks.stat.mockResolvedValue({ mtime: 0 });
    mocks.readFile.mockResolvedValue(Buffer.from("backup-content"));
    mocks.writeFile.mockResolvedValue(undefined);
    mocks.showOpenDialog.mockResolvedValue(undefined);
    mocks.showWarningMessage.mockResolvedValue(undefined);
    mocks.getSourceFile.mockReturnValue(undefined);
  });

  it("infers source file path from timestamped backup file", () => {
    expect(
      inferSourcePathFromBackupPath(
        "C:\\workspace\\src\\MainFrame.java.2026-03-24T10-20-30-400Z.bak",
      ),
    ).toBe("C:\\workspace\\src\\MainFrame.java");
  });

  it("infers source file path from non-timestamp backup file", () => {
    expect(inferSourcePathFromBackupPath("C:\\workspace\\src\\MainFrame.java.bak")).toBe(
      "C:\\workspace\\src\\MainFrame.java",
    );
  });

  it("restores the latest backup for a source file", async () => {
    const sourceFilePath = "C:\\workspace\\src\\MainFrame.java";
    mocks.readDirectory.mockResolvedValueOnce([
      ["MainFrame.java.2026-03-24T10-20-30-400Z.bak", 1],
      ["MainFrame.java.2026-03-24T08-00-00-000Z.bak", 1],
      ["MainFrame.java.bak", 1],
      ["OtherFrame.java.2026-03-24T10-20-30-400Z.bak", 1],
    ]);
    mocks.showWarningMessage.mockResolvedValueOnce("Restore");
    const outputChannel = { appendLine: mocks.outputAppendLine };

    const restored = await restoreLatestBackupForSource(sourceFilePath, outputChannel as never);

    expect(restored).toBe(true);
    expect(mocks.readFile).toHaveBeenCalledWith({
      fsPath: "C:\\workspace\\src\\MainFrame.java.2026-03-24T10-20-30-400Z.bak",
    });
    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: "C:\\workspace\\src\\MainFrame.java" },
      Buffer.from("backup-content"),
    );
    expect(mocks.showInformationMessage).toHaveBeenCalledWith(
      "Restored MainFrame.java from MainFrame.java.2026-03-24T10-20-30-400Z.bak.",
    );
  });

  it("shows warning and skips restore when no backup is available", async () => {
    const outputChannel = { appendLine: mocks.outputAppendLine };
    const restored = await restoreLatestBackupForSource(
      "C:\\workspace\\src\\MainFrame.java",
      outputChannel as never,
    );

    expect(restored).toBe(false);
    expect(mocks.showWarningMessage).toHaveBeenCalledWith(
      "No backup files found for MainFrame.java.",
    );
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it("registers command and restores using source file from current panel", async () => {
    mocks.getSourceFile.mockReturnValue("C:\\workspace\\src\\MainFrame.java");
    mocks.readDirectory.mockResolvedValueOnce([["MainFrame.java.bak", 1]]);
    mocks.showWarningMessage.mockResolvedValueOnce("Restore");

    registerRestoreFromBackupCommand({ appendLine: mocks.outputAppendLine } as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.restoreFromBackup");

    await handler?.();

    expect(mocks.showWarningMessage).toHaveBeenCalledWith(
      "Restore MainFrame.java from backup MainFrame.java.bak?",
      "Restore",
      "Cancel",
    );
    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: "C:\\workspace\\src\\MainFrame.java" },
      Buffer.from("backup-content"),
    );
  });

  it("falls back to backup picker when there is no tracked source file", async () => {
    mocks.getSourceFile.mockReturnValue(undefined);
    mocks.showOpenDialog.mockResolvedValueOnce([
      { fsPath: "C:\\workspace\\src\\MainFrame.java.2026-03-24T10-20-30-400Z.bak" },
    ]);
    mocks.showWarningMessage.mockResolvedValueOnce("Restore");

    registerRestoreFromBackupCommand({ appendLine: mocks.outputAppendLine } as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.restoreFromBackup");

    await handler?.();

    expect(mocks.showOpenDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { "Backup Files": ["bak"] },
      }),
    );
    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: "C:\\workspace\\src\\MainFrame.java" },
      Buffer.from("backup-content"),
    );
  });
});
