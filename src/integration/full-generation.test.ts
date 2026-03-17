import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasState, ComponentModel } from "../components/ComponentModel";
import type { JavaProjectStructure } from "../utils/JavaProjectDetector";

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
  getOutputDirectory: vi.fn(() => "swing/components/"),
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

vi.mock("../canvas/CanvasPanel", () => ({
  CanvasPanel: {
    currentPanel: undefined,
  },
}));

vi.mock("../config/ConfigReader", () => ({
  getOutputDirectory: mocks.getOutputDirectory,
}));

vi.mock("../utils/JavaProjectDetector", () => ({
  detectJavaProject: mocks.detectJavaProject,
}));

import { CanvasPanel, type PreviewCodeFile } from "../canvas/CanvasPanel";
import { registerGenerateCommand } from "../commands/generateCommand";
import { registerPreviewCodeCommand } from "../commands/previewCodeCommand";

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

function getGeneratedByFileName(): Map<string, { outputPath: string; content: string }> {
  const generatedFiles = new Map<string, { outputPath: string; content: string }>();
  for (const call of mocks.writeFile.mock.calls) {
    const outputPath = (call[0] as { fsPath: string }).fsPath;
    if (!outputPath.endsWith(".java")) {
      continue;
    }

    generatedFiles.set(path.basename(outputPath), {
      outputPath,
      content: Buffer.from(call[1] as Uint8Array).toString("utf-8"),
    });
  }

  return generatedFiles;
}

describe("integration full generation flow", () => {
  beforeEach(() => {
    mocks.commandHandlers.clear();
    vi.clearAllMocks();

    mocks.workspaceFolders[0].uri = { fsPath: "C:\\workspace" };
    mocks.stat.mockRejectedValue(new Error("File not found"));
    mocks.getOutputDirectory.mockReturnValue("swing/components/");
    mocks.detectJavaProject.mockReturnValue({
      type: "maven-gradle",
      sourceRoot: path.join("src", "main", "java"),
      suggestedOutputFolder: path.join("src", "main", "java", "com", "acme", "generated", "ui"),
    });
    mocks.showInputBox.mockResolvedValue(
      path.join("src", "main", "java", "com", "acme", "generated", "ui"),
    );

    CanvasPanel.currentPanel = undefined;
  });

  it("keeps preview and generated files in sync for a complex canvas state", async () => {
    const state: CanvasState = {
      className: "ComplexFlowFrame",
      frameWidth: 1100,
      frameHeight: 800,
      components: [
        createComponent({
          id: "mainMenuBar",
          type: "MenuBar",
          variableName: "mainMenuBar",
          width: 500,
          height: 32,
          children: ["fileMenu"],
        }),
        createComponent({
          id: "fileMenu",
          type: "Menu",
          variableName: "fileMenu",
          parentId: "mainMenuBar",
          text: "File",
          children: ["saveItem"],
        }),
        createComponent({
          id: "saveItem",
          type: "MenuItem",
          variableName: "saveItem",
          parentId: "fileMenu",
          text: "Save",
          eventMethodName: "handleSave",
        }),
        createComponent({
          id: "topToolbar",
          type: "ToolBar",
          variableName: "topToolbar",
          width: 500,
          height: 40,
          position: "top",
          orientation: "horizontal",
          children: ["toolSaveButton"],
        }),
        createComponent({
          id: "toolSaveButton",
          type: "Button",
          variableName: "toolSaveButton",
          parentId: "topToolbar",
          text: "Quick Save",
          eventMethodName: "handleSave",
        }),
        createComponent({
          id: "contentPanel",
          type: "Panel",
          variableName: "contentPanel",
          x: 120,
          y: 90,
          width: 360,
          height: 240,
        }),
        createComponent({
          id: "searchField",
          type: "TextField",
          variableName: "searchField",
          parentId: "contentPanel",
          x: 145,
          y: 122,
          width: 180,
          height: 30,
          parentOffset: { x: 25, y: 32 },
          text: "Search",
          backgroundColor: "#EEEEEE",
        }),
        createComponent({
          id: "insideAction",
          type: "Button",
          variableName: "insideAction",
          parentId: "contentPanel",
          x: 168,
          y: 186,
          width: 130,
          height: 34,
          parentOffset: { x: 48, y: 96 },
          text: "Run",
          backgroundColor: "#224466",
          eventMethodName: "handleSave",
        }),
        createComponent({
          id: "progressSlider",
          type: "Slider",
          variableName: "progressSlider",
          x: 560,
          y: 130,
          width: 180,
          height: 45,
          min: 0,
          max: 100,
          value: 35,
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

    const previewFiles = previewPayloads[0];
    const generatedByName = getGeneratedByFileName();
    const expectedPackage = "package com.acme.generated.ui;";
    const outputRoot = path.join("C:\\workspace", "src", "main", "java", "com", "acme", "generated", "ui");
    const mainContent = generatedByName.get("ComplexFlowFrame.java")?.content;

    expect(previewPayloads).toHaveLength(1);
    expect(previewFiles.length).toBe(3);
    expect(previewFiles.every((file) => file.content.startsWith(expectedPackage))).toBe(true);
    expect([...generatedByName.keys()].sort()).toEqual(previewFiles.map((file) => file.fileName).sort());

    for (const previewFile of previewFiles) {
      expect(generatedByName.get(previewFile.fileName)?.content).toBe(previewFile.content);
    }

    expect(generatedByName.get("CustomTextField1.java")?.outputPath).toBe(
      path.join(outputRoot, "contentPanel", "CustomTextField1.java"),
    );
    expect(generatedByName.get("CustomButton1.java")?.outputPath).toBe(
      path.join(outputRoot, "contentPanel", "CustomButton1.java"),
    );
    expect(mainContent).toContain("    frame.setJMenuBar(mainMenuBar);");
    expect(mainContent).toContain("    getContentPane().add(topToolbar, BorderLayout.NORTH);");
    expect(mainContent).toContain("    contentPanel.setLayout(null);");
    expect(mainContent).toContain("    searchField.setBounds(25, 32, 180, 30);");
    expect(mainContent).toContain("    insideAction.setBounds(48, 96, 130, 34);");
    expect(mainContent).toContain("    contentPanel.add(searchField);");
    expect(mainContent).toContain("  private void handleSave()");
    expect(mainContent).toContain("  private void handleSave2()");
  });
});
