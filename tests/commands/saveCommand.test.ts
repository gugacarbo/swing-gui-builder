import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasState } from "../../src/components/ComponentModel";

const mocks = vi.hoisted(() => ({
  commandHandlers: new Map<string, () => Promise<void>>(),
  workspaceFolders: [{ uri: { fsPath: "C:\\workspace" } }] as
    | Array<{ uri: { fsPath: string } }>
    | undefined,
  writeFile: vi.fn<(uri: { fsPath: string }, content: Uint8Array) => Promise<void>>(async () => {}),
  showErrorMessage: vi.fn(),
  showInformationMessage: vi.fn(),
  getCanvasState: vi.fn<() => CanvasState>(() => ({
    className: "MainWindow",
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
      writeFile: mocks.writeFile,
    },
  },
  window: {
    showErrorMessage: mocks.showErrorMessage,
    showInformationMessage: mocks.showInformationMessage,
  },
}));

vi.mock("../../src/canvas/CanvasPanel", () => ({
  CanvasPanel: {
    currentPanel: {
      getCanvasState: () => mocks.getCanvasState(),
    },
  },
}));

import { CanvasPanel } from "../../src/canvas/CanvasPanel";
import { registerSaveCommand } from "../../src/commands/saveCommand";

describe("registerSaveCommand", () => {
  beforeEach(() => {
    mocks.commandHandlers.clear();
    vi.clearAllMocks();
    mocks.workspaceFolders = [{ uri: { fsPath: "C:\\workspace" } }];
    mocks.getCanvasState.mockReturnValue({
      className: "MainWindow",
      frameWidth: 800,
      frameHeight: 600,
      components: [],
    });
    CanvasPanel.currentPanel = {
      getCanvasState: () => mocks.getCanvasState(),
    } as never;
  });

  it("saves an empty default layout state", async () => {
    registerSaveCommand();
    const handler = mocks.commandHandlers.get("swingGuiBuilder.save");

    await handler?.();

    const expectedState = {
      className: "MainWindow",
      frameWidth: 800,
      frameHeight: 600,
      components: [],
    } satisfies CanvasState;

    expect(mocks.writeFile).toHaveBeenCalledWith(
      { fsPath: path.join("C:\\workspace", ".swingbuilder-layout.json") },
      Buffer.from(`${JSON.stringify(expectedState, null, 2)}\n`, "utf-8"),
    );
    expect(mocks.showInformationMessage).toHaveBeenCalledWith(
      "Canvas saved to .swingbuilder-layout.json",
    );
  });
});
