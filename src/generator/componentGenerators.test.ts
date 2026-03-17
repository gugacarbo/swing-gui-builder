import { describe, expect, it } from "vitest";
import type { ComponentModel } from "../components/ComponentModel";
import { generateComponentCode } from "./componentGenerators";

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

function generateComposedCode(
  components: ComponentModel[],
  hasToolBars = false,
): { lines: string[]; content: string } {
  const customIds = new Set<string>();
  const customClassNames = new Map<string, string>();
  const methodNames = new Map<string, string>();
  const componentMap = new Map(components.map((component) => [component.id, component]));
  const lines = components.flatMap((component) =>
    generateComponentCode(
      component,
      customIds,
      customClassNames,
      methodNames,
      hasToolBars,
      componentMap,
      components,
    ),
  );

  return { lines, content: lines.join("\n") };
}

describe("generateComponentCode composition", () => {
  it("generates panel and child code in composition order with expected structure", () => {
    const panel = createComponent({
      id: "mainPanel",
      type: "Panel",
      variableName: "mainPanel",
      x: 20,
      y: 30,
      width: 320,
      height: 200,
      children: ["saveButton"],
    });

    const childButton = createComponent({
      id: "saveButton",
      type: "Button",
      variableName: "saveButton",
      parentId: "mainPanel",
      x: 240,
      y: 260,
      parentOffset: { x: 48, y: 72 },
      width: 120,
      height: 30,
      text: "Save",
    });

    const components = [panel, childButton];
    const componentMap = new Map(components.map((component) => [component.id, component]));

    const panelLines = generateComponentCode(
      panel,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      components,
    );
    expect(panelLines).toEqual([
      "    mainPanel = new JPanel();",
      "    mainPanel.setBounds(20, 30, 320, 200);",
      "    mainPanel.setLayout(null);",
      "    this.add(mainPanel);",
      "",
    ]);

    const childLines = generateComponentCode(
      childButton,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      components,
    );
    expect(childLines).toEqual([
      '    saveButton = new JButton("Save");',
      "    saveButton.setBounds(48, 72, 120, 30);",
      "    mainPanel.add(saveButton);",
      "",
    ]);

    const { content } = generateComposedCode(components);

    const panelInitIndex = content.indexOf("    mainPanel = new JPanel();");
    const panelAddIndex = content.indexOf("    this.add(mainPanel);");
    const childInitIndex = content.indexOf('    saveButton = new JButton("Save");');
    const childAddIndex = content.indexOf("    mainPanel.add(saveButton);");

    expect(panelInitIndex).toBeGreaterThanOrEqual(0);
    expect(panelAddIndex).toBeGreaterThan(panelInitIndex);
    expect(childInitIndex).toBeGreaterThan(panelAddIndex);
    expect(childAddIndex).toBeGreaterThan(childInitIndex);
  });

  it("keeps composition add target on canvasPanel when toolbar layout is enabled", () => {
    const panel = createComponent({
      id: "mainPanel",
      type: "Panel",
      variableName: "mainPanel",
      children: ["saveButton"],
    });

    const childButton = createComponent({
      id: "saveButton",
      type: "Button",
      variableName: "saveButton",
      parentId: "mainPanel",
      x: 180,
      y: 210,
      parentOffset: { x: 16, y: 24 },
      text: "Save",
    });

    const { lines } = generateComposedCode([panel, childButton], true);

    expect(lines).toContain("    canvasPanel.add(mainPanel);");
    expect(lines).toContain("    mainPanel.add(saveButton);");
    expect(lines).not.toContain("    canvasPanel.add(saveButton);");
  });
});
