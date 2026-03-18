import { describe, expect, it } from "vitest";
import type { CanvasState, ComponentModel } from "../../src/components/ComponentModel";
import { generateJavaFiles } from "../../src/generator/JavaGenerator";

function createComponent(overrides: Partial<ComponentModel> & Pick<ComponentModel, "id" | "type" | "variableName">): ComponentModel {
  return {
    id: overrides.id,
    type: overrides.type,
    variableName: overrides.variableName,
    x: 0,
    y: 0,
    width: 120,
    height: 40,
    text: "",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    fontFamily: "Arial",
    fontSize: 12,
    eventMethodName: "",
    ...overrides,
  };
}

describe("generateJavaFiles custom style generation", () => {
  it("uses super() and applies custom text color for non-text-constructor components", () => {
    const state: CanvasState = {
      className: "CustomPanelFrame",
      frameWidth: 800,
      frameHeight: 600,
      components: [
        createComponent({
          id: "panel-1",
          type: "Panel",
          variableName: "mainPanel",
          textColor: "#123456",
        }),
      ],
    };

    const files = generateJavaFiles(state, "com.example");
    const customPanel = files.find((file) => file.fileName === "CustomPanel1.java");

    expect(customPanel).toBeDefined();
    expect(customPanel?.content).toContain("    super();");
    expect(customPanel?.content).toContain("    setForeground(new Color(18, 52, 86));");
  });
});
