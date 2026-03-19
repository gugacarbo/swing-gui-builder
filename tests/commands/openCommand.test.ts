import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasState } from "../../src/components/ComponentModel";

const mocks = vi.hoisted(() => ({
  commandHandlers: new Map<string, () => Promise<void>>(),
  workspaceFolders: [{ uri: { fsPath: "C:\\workspace" } }] as
    | Array<{ uri: { fsPath: string } }>
    | undefined,
  readFile: vi.fn<(uri: { fsPath: string }) => Promise<Uint8Array>>(async () =>
    Buffer.from(
      '{ "className": "LoadedWindow", "frameTitle": "Loaded Frame", "frameWidth": 800, "frameHeight": 600, "components": [] }',
    ),
  ),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  showInformationMessage: vi.fn(),
  createOrShow: vi.fn(),
  loadState: vi.fn(),
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
      readFile: mocks.readFile,
    },
  },
  window: {
    showErrorMessage: mocks.showErrorMessage,
    showWarningMessage: mocks.showWarningMessage,
    showInformationMessage: mocks.showInformationMessage,
  },
}));

vi.mock("../../src/canvas/CanvasPanel", () => ({
  CanvasPanel: {
    createOrShow: mocks.createOrShow,
    currentPanel: {
      loadState: mocks.loadState,
    },
  },
}));

import { registerOpenCommand } from "../../src/commands/openCommand";

describe("registerOpenCommand", () => {
  beforeEach(() => {
    mocks.commandHandlers.clear();
    vi.clearAllMocks();
    mocks.workspaceFolders = [{ uri: { fsPath: "C:\\workspace" } }];
    mocks.readFile.mockResolvedValue(
      Buffer.from(
        '{ "className": "LoadedWindow", "frameTitle": "Loaded Frame", "frameWidth": 800, "frameHeight": 600, "components": [] }',
      ),
    );
  });

  it("loads state from layout file when present", async () => {
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.createOrShow).toHaveBeenCalledWith({ fsPath: "C:\\ext" }, "LoadedWindow");
    expect(mocks.loadState).toHaveBeenCalledWith({
      className: "LoadedWindow",
      frameTitle: "Loaded Frame",
      frameWidth: 800,
      frameHeight: 600,
      components: [],
    } satisfies CanvasState);
    expect(mocks.showInformationMessage).toHaveBeenCalledWith(
      "Canvas loaded from .swingbuilder-layout.json",
    );
  });

  it("initializes default empty MainWindow state when layout file is missing", async () => {
    const missingError = Object.assign(new Error("File not found"), { code: "FileNotFound" });
    mocks.readFile.mockRejectedValueOnce(missingError);
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.createOrShow).toHaveBeenCalledWith({ fsPath: "C:\\ext" }, "MainWindow");
    expect(mocks.loadState).toHaveBeenCalledWith({
      className: "MainWindow",
      frameTitle: "MainWindow",
      frameWidth: 800,
      frameHeight: 600,
      components: [],
    } satisfies CanvasState);
    expect(outputChannel.appendLine).toHaveBeenCalledWith(
      "Layout file .swingbuilder-layout.json was not found. Opened a new empty MainWindow layout.",
    );
    expect(mocks.showInformationMessage).toHaveBeenCalledWith(
      "No .swingbuilder-layout.json found. Opened a new empty MainWindow layout.",
    );
    expect(mocks.showErrorMessage).not.toHaveBeenCalled();
  });

  it("keeps generic error handling for non-missing-file failures", async () => {
    mocks.readFile.mockRejectedValueOnce(new Error("Permission denied"));
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(outputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining("Error opening layout file"),
    );
    expect(mocks.showErrorMessage).toHaveBeenCalledWith(
      "Could not read .swingbuilder-layout.json.",
    );
  });

  it("shows error when no workspace folder is open", async () => {
    mocks.workspaceFolders = undefined;
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.showErrorMessage).toHaveBeenCalledWith("No workspace folder open.");
    expect(mocks.createOrShow).not.toHaveBeenCalled();
  });

  it("detects ENOENT error code for missing file", async () => {
    const enoentError = Object.assign(new Error("ENOENT: no such file"), { code: "ENOENT" });
    mocks.readFile.mockRejectedValueOnce(enoentError);
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.createOrShow).toHaveBeenCalledWith({ fsPath: "C:\\ext" }, "MainWindow");
    expect(mocks.showInformationMessage).toHaveBeenCalledWith(
      "No .swingbuilder-layout.json found. Opened a new empty MainWindow layout.",
    );
    expect(mocks.showErrorMessage).not.toHaveBeenCalled();
  });

  it("detects file not found from error message", async () => {
    const notFoundError = new Error("The file not exist in the system");
    mocks.readFile.mockRejectedValueOnce(notFoundError);
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.createOrShow).toHaveBeenCalledWith({ fsPath: "C:\\ext" }, "MainWindow");
    expect(mocks.showInformationMessage).toHaveBeenCalledWith(
      "No .swingbuilder-layout.json found. Opened a new empty MainWindow layout.",
    );
  });

  it("detects 'cannot find' in error message", async () => {
    const cannotFindError = new Error("Cannot find the specified file");
    mocks.readFile.mockRejectedValueOnce(cannotFindError);
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.createOrShow).toHaveBeenCalledWith({ fsPath: "C:\\ext" }, "MainWindow");
    expect(mocks.showInformationMessage).toHaveBeenCalledWith(
      "No .swingbuilder-layout.json found. Opened a new empty MainWindow layout.",
    );
  });

  it("handles null error object gracefully", async () => {
    mocks.readFile.mockRejectedValueOnce(null);
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.showErrorMessage).toHaveBeenCalledWith(
      "Could not read .swingbuilder-layout.json.",
    );
  });

  it("handles non-object error gracefully", async () => {
    mocks.readFile.mockRejectedValueOnce("string error");
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.showErrorMessage).toHaveBeenCalledWith(
      "Could not read .swingbuilder-layout.json.",
    );
  });

  it("does not call loadState when currentPanel is null after createOrShow", async () => {
    // This test verifies the branch where CanvasPanel.currentPanel is falsy
    // In the real implementation, if currentPanel is null, loadState is not called
    mocks.loadState.mockClear();

    // Temporarily set currentPanel to null in the mock
    const { CanvasPanel } = await import("../../src/canvas/CanvasPanel");
    const originalPanel = CanvasPanel.currentPanel;
    Object.defineProperty(CanvasPanel, "currentPanel", {
      value: null,
      writable: true,
      configurable: true,
    });

    const outputChannel = { appendLine: vi.fn() };
    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.createOrShow).toHaveBeenCalled();
    expect(mocks.loadState).not.toHaveBeenCalled();

    // Restore original panel
    Object.defineProperty(CanvasPanel, "currentPanel", {
      value: originalPanel,
      writable: true,
      configurable: true,
    });
  });

  it("uses 'MainWindow' as className when empty string is provided", async () => {
    mocks.readFile.mockResolvedValueOnce(
      Buffer.from('{ "className": "", "frameWidth": 800, "frameHeight": 600, "components": [] }'),
    );
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.createOrShow).toHaveBeenCalledWith({ fsPath: "C:\\ext" }, "MainWindow");
  });

  it("falls back frameTitle to className when frameTitle is missing", async () => {
    mocks.readFile.mockResolvedValueOnce(
      Buffer.from('{ "className": "FallbackTitleFrame", "frameWidth": 900, "frameHeight": 700, "components": [] }'),
    );
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.loadState).toHaveBeenCalledWith({
      className: "FallbackTitleFrame",
      frameTitle: "FallbackTitleFrame",
      frameWidth: 900,
      frameHeight: 700,
      components: [],
    } satisfies CanvasState);
  });
});
