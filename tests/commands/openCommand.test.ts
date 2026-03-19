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
      '{ "className": "LoadedWindow", "frameWidth": 800, "frameHeight": 600, "components": [] }',
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
        '{ "className": "LoadedWindow", "frameWidth": 800, "frameHeight": 600, "components": [] }',
      ),
    );
  });

  it("loads state from layout file when present", async () => {
    const outputChannel = { appendLine: vi.fn() };

    registerOpenCommand({ extensionUri: { fsPath: "C:\\ext" } } as never, outputChannel as never);
    const handler = mocks.commandHandlers.get("swingGuiBuilder.open");

    await handler?.();

    expect(mocks.createOrShow).toHaveBeenCalledWith(
      { fsPath: "C:\\ext" },
      "LoadedWindow",
    );
    expect(mocks.loadState).toHaveBeenCalledWith({
      className: "LoadedWindow",
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
});
