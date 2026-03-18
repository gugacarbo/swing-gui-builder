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

function getGeneratedContentsByFileName(): Map<string, string> {
  const generatedFiles = new Map<string, string>();
  for (const call of mocks.writeFile.mock.calls) {
    const targetPath = (call[0] as { fsPath: string }).fsPath;
    if (!targetPath.endsWith(".java")) {
      continue;
    }

    generatedFiles.set(
      path.basename(targetPath),
      Buffer.from(call[1] as Uint8Array).toString("utf-8"),
    );
  }

  return generatedFiles;
}

describe("integration package inference", () => {
  beforeEach(() => {
    mocks.commandHandlers.clear();
    vi.clearAllMocks();

    mocks.workspaceFolders[0].uri = { fsPath: "C:\\workspace" };
    mocks.stat.mockRejectedValue(new Error("File not found"));
    mocks.getOutputDirectory.mockReturnValue("swing/components/");
    mocks.detectJavaProject.mockReturnValue({
      type: "maven-gradle",
      sourceRoot: path.join("src", "main", "java"),
      suggestedOutputFolder: path.join("src", "main", "java", "com", "acme", "generated"),
    });
    mocks.showInputBox.mockResolvedValue(
      path.join("src", "main", "java", "com", "acme", "generated"),
    );

    CanvasPanel.currentPanel = undefined;
  });

  it("keeps inferred package consistent between preview and generate", async () => {
    const state: CanvasState = {
      className: "PackageConsistencyFrame",
      frameWidth: 900,
      frameHeight: 700,
      components: [
        createComponent({
          id: "saveButton",
          type: "Button",
          variableName: "saveButton",
          text: "Save",
          backgroundColor: "#336699",
        }),
        createComponent({
          id: "statusLabel",
          type: "Label",
          variableName: "statusLabel",
          text: "Ready",
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
    const generatedByName = getGeneratedContentsByFileName();
    const expectedPackage = "package com.acme.generated;";

    expect(previewPayloads).toHaveLength(1);
    expect(previewFiles.length).toBeGreaterThan(0);
    expect(previewFiles.every((file) => file.content.startsWith(expectedPackage))).toBe(true);

    for (const previewFile of previewFiles) {
      expect(generatedByName.get(previewFile.fileName)).toBe(previewFile.content);
    }

    expect(mocks.getOutputDirectory).toHaveBeenCalledTimes(2);
    expect(mocks.detectJavaProject).toHaveBeenCalledTimes(2);
  });
});
