import { describe, expect, it } from "vitest";
import type { CanvasState, ComponentModel } from "../components/ComponentModel";
import { generateJavaFiles } from "./JavaGenerator";

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

function getMainFrameContent(state: CanvasState): string {
  const mainFile = generateJavaFiles(state).find(
    (file) => file.fileName === `${state.className}.java`,
  );

  if (!mainFile) {
    throw new Error(`Main frame file ${state.className}.java was not generated`);
  }

  return mainFile.content;
}

describe("JavaGenerator relative setBounds for panel children", () => {
  it("keeps panel child setBounds values relative to panel coordinates", () => {
    const state: CanvasState = {
      className: "RelativeCoordsFrame",
      frameWidth: 1024,
      frameHeight: 768,
      components: [
        createComponent({
          id: "mainPanel",
          type: "Panel",
          variableName: "mainPanel",
          x: 180,
          y: 120,
          width: 300,
          height: 220,
        }),
        createComponent({
          id: "insideButton",
          type: "Button",
          variableName: "insideButton",
          parentId: "mainPanel",
          x: 204,
          y: 156,
          parentOffset: { x: 24, y: 36 },
          text: "Inside",
        }),
      ],
    };

    const content = getMainFrameContent(state);

    expect(content).toContain("    mainPanel.setBounds(180, 120, 300, 220);");
    expect(content).toContain("    mainPanel.setLayout(null);");
    expect(content).toContain("    insideButton.setBounds(24, 36, 120, 30);");
    expect(content).toContain("    mainPanel.add(insideButton);");
    expect(content).not.toContain("    this.add(insideButton);");
    expect(content).not.toContain("    insideButton.setBounds(204, 156, 120, 30);");
  });

  it("does not affect root component coordinates while handling panel children", () => {
    const state: CanvasState = {
      className: "MixedCoordsFrame",
      frameWidth: 900,
      frameHeight: 700,
      components: [
        createComponent({
          id: "containerPanel",
          type: "Panel",
          variableName: "containerPanel",
          x: 100,
          y: 80,
          width: 280,
          height: 200,
        }),
        createComponent({
          id: "panelChildLabel",
          type: "Label",
          variableName: "panelChildLabel",
          parentId: "containerPanel",
          x: 112,
          y: 98,
          parentOffset: { x: 12, y: 18 },
          text: "Child",
        }),
        createComponent({
          id: "rootButton",
          type: "Button",
          variableName: "rootButton",
          x: 420,
          y: 300,
          text: "Root",
        }),
      ],
    };

    const content = getMainFrameContent(state);

    expect(content).toContain("    panelChildLabel.setBounds(12, 18, 120, 30);");
    expect(content).toContain("    containerPanel.add(panelChildLabel);");
    expect(content).not.toContain("    this.add(panelChildLabel);");
    expect(content).toContain("    rootButton.setBounds(420, 300, 120, 30);");
  });
});
