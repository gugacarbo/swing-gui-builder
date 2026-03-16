import { describe, expect, it } from "vitest";
import type { CanvasState, ComponentModel } from "../components/ComponentModel";
import { generateJavaFiles, generatePreviewJavaFiles } from "./JavaGenerator";

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

function createParityState(): CanvasState {
  return {
    className: "ParityFrame",
    frameWidth: 960,
    frameHeight: 720,
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
        text: "Status",
        fontFamily: "Courier New",
      }),
      createComponent({
        id: "searchField",
        type: "TextField",
        variableName: "searchField",
        text: "Query",
      }),
    ],
  };
}

function expectPreviewParity(state: CanvasState, packageName?: string): void {
  const previewFiles = generatePreviewJavaFiles(state, packageName);
  const generatedFiles = generateJavaFiles(state, packageName);

  expect(previewFiles.map((file) => file.fileName)).toEqual(
    generatedFiles.map((file) => file.fileName),
  );

  expect(previewFiles.map((file) => file.content)).toEqual(
    generatedFiles.map((file) => file.content),
  );
}

describe("JavaGenerator preview/generate parity", () => {
  it("keeps ordered file list and file contents identical for the same state", () => {
    expectPreviewParity(createParityState());
  });

  it("keeps ordered file list and file contents identical when package is provided", () => {
    expectPreviewParity(createParityState(), "com.example.generated");
  });
});
