import { parse } from "java-parser";
import { describe, expect, it } from "vitest";
import type { CanvasState, ComponentModel } from "../../src/components/ComponentModel";
import { generateJavaFiles } from "../../src/generator/JavaGenerator";
import { getBeginMarker, getEndMarker } from "../../src/merger/MarkerManager";

function createComponent(
  overrides: Partial<Omit<ComponentModel, "id" | "type" | "variableName">> &
    Pick<ComponentModel, "id" | "type" | "variableName">,
): ComponentModel {
  return {
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
    ...overrides,
  };
}

function getMainFrameContent(state: CanvasState): string {
  const mainFile = generateJavaFiles(state).find(
    (file) => file.fileName === `${state.className}.java`,
  );

  if (!mainFile) {
    throw new Error(`Main frame file ${state.className}.java was not generated`);
  }

  return mainFile.content;
}

describe("JavaGenerator generated markers", () => {
  it("wraps fields, constructor body, and method stubs with markers in nested Java-safe order", () => {
    const state: CanvasState = {
      className: "MarkerFrame",
      frameWidth: 800,
      frameHeight: 600,
      components: [
        createComponent({
          id: "saveButton",
          type: "Button",
          variableName: "saveButton",
          text: "Save",
          eventMethodName: "handleSave",
        }),
        createComponent({
          id: "statusLabel",
          type: "Label",
          variableName: "statusLabel",
          text: "Ready",
        }),
      ],
    };

    const content = getMainFrameContent(state);

    const fieldsBegin = `  ${getBeginMarker("fields")}`;
    const fieldsEnd = `  ${getEndMarker("fields")}`;
    const constructorBegin = `    ${getBeginMarker("constructor")}`;
    const constructorEnd = `    ${getEndMarker("constructor")}`;
    const methodsBegin = `  ${getBeginMarker("methods")}`;
    const methodsEnd = `  ${getEndMarker("methods")}`;

    const fieldsBeginIndex = content.indexOf(fieldsBegin);
    const firstFieldIndex = content.indexOf("  private JButton saveButton;");
    const lastFieldIndex = content.indexOf("  private JLabel statusLabel;");
    const fieldsEndIndex = content.indexOf(fieldsEnd);
    const constructorDeclarationIndex = content.indexOf("  public MarkerFrame() {");
    const constructorBeginIndex = content.indexOf(constructorBegin);
    const constructorEndIndex = content.indexOf(constructorEnd);
    const methodsBeginIndex = content.indexOf(methodsBegin);
    const methodStubIndex = content.indexOf("  private void handleSave() {");
    const methodsEndIndex = content.indexOf(methodsEnd);
    const mainMethodIndex = content.indexOf("  public static void main(String[] args) {");

    expect(fieldsBeginIndex).toBeGreaterThanOrEqual(0);
    expect(fieldsBeginIndex).toBeLessThan(firstFieldIndex);
    expect(firstFieldIndex).toBeLessThan(lastFieldIndex);
    expect(lastFieldIndex).toBeLessThan(fieldsEndIndex);
    expect(fieldsEndIndex).toBeLessThan(constructorDeclarationIndex);

    expect(constructorDeclarationIndex).toBeLessThan(constructorBeginIndex);
    expect(constructorBeginIndex).toBeLessThan(constructorEndIndex);
    expect(constructorEndIndex).toBeLessThan(methodsBeginIndex);

    expect(methodsBeginIndex).toBeLessThan(methodStubIndex);
    expect(methodStubIndex).toBeLessThan(methodsEndIndex);
    expect(methodsEndIndex).toBeLessThan(mainMethodIndex);
  });

  it("keeps generated Java parsable with marker comments", () => {
    const state: CanvasState = {
      className: "ParsableMarkerFrame",
      frameWidth: 640,
      frameHeight: 480,
      components: [
        createComponent({
          id: "okButton",
          type: "Button",
          variableName: "okButton",
          text: "OK",
          eventMethodName: "onOk",
        }),
      ],
    };

    const content = getMainFrameContent(state);

    expect(() => parse(content)).not.toThrow();
  });
});
