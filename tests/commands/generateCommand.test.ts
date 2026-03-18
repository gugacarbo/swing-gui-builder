import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasState, ComponentModel } from "../../src/components/ComponentModel";

const mocks = vi.hoisted(() => ({
  commandHandlers: new Map<string, () => Promise<void>>(),
  createDirectory: vi.fn<(uri: { fsPath: string }) => Promise<void>>(async () => {}),
  stat: vi.fn<(uri: { fsPath: string }) => Promise<void>>(async () => {
    throw new Error("File not found");
  }),
  readFile: vi.fn<(uri: { fsPath: string }) => Promise<Uint8Array>>(async () => Buffer.from("")),
  writeFile: vi.fn<(uri: { fsPath: string }, content: Uint8Array) => Promise<void>>(async () => {}),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(async () => undefined),
  showInformationMessage: vi.fn(),
  showInputBox: vi.fn(async () => "src/main/java"),
  showOpenDialog: vi.fn(async () => undefined),
  workspaceFolders: [{ uri: { fsPath: "C:\\workspace" } }],
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
    workspaceFolders: mocks.workspaceFolders,
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

vi.mock("../../src/config/ConfigReader", () => ({
  getOutputDirectory: () => "src/main/java",
}));

vi.mock("../../src/utils/JavaProjectDetector", () => ({
  detectJavaProject: () => undefined,
}));

vi.mock("../../src/utils/JavaPackageInference", () => ({
  inferJavaPackage: () => undefined,
  resolveOutputDirectory: (configuredDir: string) => configuredDir,
}));

vi.mock("../../src/canvas/CanvasPanel", () => ({
  CanvasPanel: {
    currentPanel: undefined,
  },
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

describe("registerGenerateCommand subfolder output", () => {
  beforeEach(() => {
    mocks.commandHandlers.clear();
    vi.clearAllMocks();
    mocks.workspaceFolders[0].uri = { fsPath: "C:\\workspace" };
    mocks.stat.mockRejectedValue(new Error("File not found"));
    mocks.showInputBox.mockResolvedValue("src/main/java");
    CanvasPanel.currentPanel = undefined;
  });

  it("creates parent subfolders and keeps root output for files without subfolder", async () => {
    const state: CanvasState = {
      className: "PanelWithChildFrame",
      frameWidth: 900,
      frameHeight: 700,
      components: [
        createComponent({
          id: "panel",
          type: "Panel",
          variableName: "mainPanel",
          x: 100,
          y: 80,
          width: 300,
          height: 220,
        }),
        createComponent({
          id: "childButton",
          type: "Button",
          variableName: "childButton",
          parentId: "panel",
          text: "Inside",
          backgroundColor: "#336699",
        }),
      ],
    };

    CanvasPanel.currentPanel = {
      getCanvasState: () => state,
    } as never;

    const outputChannel = { appendLine: vi.fn() };

    registerGenerateCommand(outputChannel as never);
    const generateHandler = mocks.commandHandlers.get("swingGuiBuilder.generate");

    expect(generateHandler).toBeDefined();
    await generateHandler?.();

    const createDirectoryTargets = mocks.createDirectory.mock.calls.map(
      (call) => (call[0] as { fsPath: string }).fsPath,
    );
    const writeFileTargets = mocks.writeFile.mock.calls.map(
      (call) => (call[0] as { fsPath: string }).fsPath,
    );
    const outputRoot = path.join("C:\\workspace", "src/main/java");

    expect(createDirectoryTargets).toContain(outputRoot);
    expect(createDirectoryTargets).toContain(path.join(outputRoot, "mainPanel"));
    expect(writeFileTargets).toContain(path.join(outputRoot, "PanelWithChildFrame.java"));
    expect(writeFileTargets).toContain(path.join(outputRoot, "mainPanel", "CustomButton1.java"));
  });
});
