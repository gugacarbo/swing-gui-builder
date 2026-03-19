import { describe, expect, it } from "vitest";
import type { CanvasState, ComponentModel } from "../../src/components/ComponentModel";
import { generateJavaFiles } from "../../src/generator/JavaGenerator";

function createBaseComponent(
  overrides: Partial<Omit<ComponentModel, "id" | "type" | "variableName">> &
    Pick<ComponentModel, "id" | "type" | "variableName">,
): ComponentModel {
  return {
    id: overrides.id,
    type: overrides.type,
    variableName: overrides.variableName,
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
  const mainFile = generateJavaFiles(state).find((file) => file.fileName === `${state.className}.java`);
  if (!mainFile) {
    throw new Error(`Main frame file ${state.className}.java was not generated`);
  }

  return mainFile.content;
}

describe("JavaGenerator frame configuration", () => {
  it("uses frameTitle for JFrame setTitle when provided", () => {
    const state: CanvasState = {
      className: "ConfiguredFrame",
      frameTitle: "Customer Dashboard",
      frameWidth: 980,
      frameHeight: 720,
      backgroundColor: "#abc",
      components: [
        createBaseComponent({
          id: "status",
          type: "Label",
          variableName: "statusLabel",
          text: "Ready",
        }),
      ],
    };

    const content = getMainFrameContent(state);
    expect(content).toContain('setTitle("Customer Dashboard");');
    expect(content).toContain("setSize(980, 720);");
    expect(content).toContain("getContentPane().setBackground(new Color(170, 187, 204));");
  });

  it("falls back to className title and omits default frame background color", () => {
    const state: CanvasState = {
      className: "MainWindow",
      frameWidth: 800,
      frameHeight: 600,
      backgroundColor: "#FFFFFF",
      components: [
        createBaseComponent({
          id: "button1",
          type: "Button",
          variableName: "button1",
          text: "Click",
        }),
      ],
    };

    const content = getMainFrameContent(state);
    expect(content).toContain('setTitle("MainWindow");');
    expect(content).not.toContain("getContentPane().setBackground(");
  });
});
