import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  commandHandlers: new Map<string, () => Promise<void>>(),
  workspaceFolders: [{ uri: { fsPath: "C:\\workspace" } }] as
    | Array<{ uri: { fsPath: string } }>
    | undefined,
  showErrorMessage: vi.fn(),
  getOutputDirectory: vi.fn(() => "src/main/java"),
  generatePreviewJavaFiles: vi.fn(() => []),
  inferJavaPackage: vi.fn(() => undefined),
  resolveOutputDirectory: vi.fn((configuredDir: string) => configuredDir),
  detectJavaProject: vi.fn(() => undefined),
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
  },
  window: {
    showErrorMessage: mocks.showErrorMessage,
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

vi.mock("../../src/generator/JavaGenerator", () => ({
  generatePreviewJavaFiles: mocks.generatePreviewJavaFiles,
}));

vi.mock("../../src/utils/JavaPackageInference", () => ({
  inferJavaPackage: mocks.inferJavaPackage,
  resolveOutputDirectory: mocks.resolveOutputDirectory,
}));

vi.mock("../../src/utils/JavaProjectDetector", () => ({
  detectJavaProject: mocks.detectJavaProject,
}));

import { CanvasPanel } from "../../src/canvas/CanvasPanel";
import { registerPreviewCodeCommand } from "../../src/commands/previewCodeCommand";

describe("registerPreviewCodeCommand", () => {
  beforeEach(() => {
    mocks.commandHandlers.clear();
    vi.clearAllMocks();
    mocks.workspaceFolders = [{ uri: { fsPath: "C:\\workspace" } }];
    mocks.getOutputDirectory.mockReturnValue("src/main/java");
    mocks.resolveOutputDirectory.mockImplementation((configuredDir: string) => configuredDir);
    mocks.inferJavaPackage.mockReturnValue(undefined);
    mocks.generatePreviewJavaFiles.mockReturnValue([]);
    mocks.detectJavaProject.mockReturnValue(undefined);
    CanvasPanel.currentPanel = undefined;
  });

  it("shows an error when there is no open canvas panel", async () => {
    registerPreviewCodeCommand();
    const handler = mocks.commandHandlers.get("swingGuiBuilder.previewCode");

    expect(handler).toBeDefined();
    await handler?.();

    expect(mocks.showErrorMessage).toHaveBeenCalledWith("No canvas is open. Open a canvas first.");
  });

  it("handles preview generation when workspace folder is unavailable", async () => {
    mocks.workspaceFolders = undefined;
    const postPreviewCode = vi.fn(async () => true);
    CanvasPanel.currentPanel = {
      getCanvasState: () => ({ className: "PreviewOnly", frameWidth: 800, frameHeight: 600, components: [] }),
      postPreviewCode,
    } as never;

    registerPreviewCodeCommand();
    const handler = mocks.commandHandlers.get("swingGuiBuilder.previewCode");

    await handler?.();

    expect(mocks.detectJavaProject).not.toHaveBeenCalled();
    expect(mocks.generatePreviewJavaFiles).toHaveBeenCalledTimes(1);
    expect(postPreviewCode).toHaveBeenCalledWith([]);
  });
});
