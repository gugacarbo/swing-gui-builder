import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasState, ComponentModel } from "../../src/components/ComponentModel";
import type { JavaProjectStructure } from "../../src/utils/JavaProjectDetector";

const mocks = vi.hoisted(() => ({
  commandHandlers: new Map<string, () => Promise<void>>(),
  workspaceFolders: [{ uri: { fsPath: "C:\\workspace" } }],
  createDirectory: vi.fn<(uri: { fsPath: string }) => Promise<void>>(async () => {}),
  stat: vi.fn<(uri: { fsPath: string }) => Promise<void>>(async () => {
    throw new Error("File not found");
  }),
  readFile: vi.fn<(uri: { fsPath: string }) => Promise<Uint8Array>>(async () => Buffer.from("")),
  writeFile: vi.fn<(uri: { fsPath: string }, content: Uint8Array) => Promise<void>>(async () => {}),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(async () => undefined),
  showInformationMessage: vi.fn(),
  showInputBox: vi.fn<(options?: unknown) => Promise<string | undefined>>(async () => undefined),
  showOpenDialog: vi.fn(async () => undefined),
  getOutputDirectory: vi.fn(() => "src/main/java"),
  detectJavaProject: vi.fn<(workspaceRoot: string) => JavaProjectStructure | undefined>(
    () => undefined,
  ),
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

import { CanvasPanel, type PreviewCodeFile } from "../../src/canvas/CanvasPanel";
import { registerGenerateCommand } from "../../src/commands/generateCommand";
import { registerPreviewCodeCommand } from "../../src/commands/previewCodeCommand";

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

function getCommandHandler(commandId: string): () => Promise<void> {
  const handler = mocks.commandHandlers.get(commandId);
  if (!handler) {
    throw new Error(`Command ${commandId} was not registered`);
  }

  return handler;
}

function getGeneratedContent(fileName: string): string {
  const output = mocks.writeFile.mock.calls.find((call) =>
    (call[0] as { fsPath: string }).fsPath.endsWith(fileName),
  );
  if (!output) {
    throw new Error(`File ${fileName} was not generated`);
  }

  return Buffer.from(output[1] as Uint8Array).toString("utf-8");
}

describe("integration panel children generation", () => {
  beforeEach(() => {
    mocks.commandHandlers.clear();
    vi.clearAllMocks();

    mocks.workspaceFolders[0].uri = { fsPath: "C:\\workspace" };
    mocks.stat.mockRejectedValue(new Error("File not found"));
    mocks.getOutputDirectory.mockReturnValue("src/main/java");
    mocks.detectJavaProject.mockReturnValue(undefined);
    mocks.showInputBox.mockResolvedValue("src/main/java");

    CanvasPanel.currentPanel = undefined;
  });

  it("creates nested hierarchy subfolder output and keeps panel child bounds relative", async () => {
    const state: CanvasState = {
      className: "PanelChildrenFrame",
      frameWidth: 900,
      frameHeight: 700,
      components: [
        createComponent({
          id: "parentPanel",
          type: "Panel",
          variableName: "mainPanel",
          x: 100,
          y: 80,
          width: 320,
          height: 240,
        }),
        createComponent({
          id: "childButton",
          type: "Button",
          variableName: "childButton",
          parentId: "parentPanel",
          x: 138,
          y: 126,
          width: 130,
          height: 34,
          parentOffset: { x: 38, y: 46 },
          text: "Child",
          backgroundColor: "#336699",
        }),
        createComponent({
          id: "nestedPanel",
          type: "Panel",
          variableName: "nestedPanel",
          parentId: "parentPanel",
        }),
        createComponent({
          id: "nestedButton",
          type: "Button",
          variableName: "nestedButton",
          parentId: "nestedPanel",
          text: "Nested Child",
          backgroundColor: "#225577",
        }),
      ],
    };
    const previewPayloads: PreviewCodeFile[][] = [];

    CanvasPanel.currentPanel = {
      getCanvasState: () => state,
      postPreviewCode: async (files: readonly PreviewCodeFile[]) => {
        previewPayloads.push([...files]);
        return true;
      },
    } as unknown as CanvasPanel;

    registerPreviewCodeCommand();
    registerGenerateCommand({ appendLine: vi.fn() } as never);

    await getCommandHandler("swingGuiBuilder.previewCode")();
    await getCommandHandler("swingGuiBuilder.generate")();

    const outputRoot = path.join("C:\\workspace", "src/main/java");
    const createDirectoryTargets = mocks.createDirectory.mock.calls.map(
      (call) => (call[0] as { fsPath: string }).fsPath,
    );
    const writeTargets = mocks.writeFile.mock.calls.map(
      (call) => (call[0] as { fsPath: string }).fsPath,
    );
    const mainFileContent = getGeneratedContent("PanelChildrenFrame.java");

    expect(previewPayloads).toHaveLength(1);
    expect(createDirectoryTargets).toContain(outputRoot);
    expect(createDirectoryTargets).toContain(path.join(outputRoot, "mainPanel"));
    expect(createDirectoryTargets).toContain(path.join(outputRoot, "mainPanel", "nestedPanel"));
    expect(writeTargets).toContain(path.join(outputRoot, "mainPanel", "CustomButton1.java"));
    expect(writeTargets).toContain(
      path.join(outputRoot, "mainPanel", "nestedPanel", "CustomButton2.java"),
    );
    expect(mainFileContent).toContain("    mainPanel.setBounds(100, 80, 320, 240);");
    expect(mainFileContent).toContain("    mainPanel.setLayout(null);");
    expect(mainFileContent).toContain("    childButton.setBounds(38, 46, 130, 34);");
    expect(mainFileContent).toContain("    mainPanel.add(childButton);");
    expect(mainFileContent).not.toContain("    this.add(childButton);");
    expect(mainFileContent).not.toContain("    childButton.setBounds(138, 126, 130, 34);");
  });
});
