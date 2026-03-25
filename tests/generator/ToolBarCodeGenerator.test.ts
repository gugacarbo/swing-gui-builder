import { describe, expect, it } from "vitest";
import type { ComponentModel } from "../../src/components/ComponentModel";
import { generateToolBar, getToolBarBorderPosition } from "../../src/generator/ToolBarCodeGenerator";

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

describe("getToolBarBorderPosition", () => {
  it("returns NORTH for default/undefined position", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
    });

    expect(getToolBarBorderPosition(toolBar)).toBe("BorderLayout.NORTH");
  });

  it("returns NORTH for top position", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      position: "top",
    });

    expect(getToolBarBorderPosition(toolBar)).toBe("BorderLayout.NORTH");
  });

  it("returns SOUTH for bottom position", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      position: "bottom",
    });

    expect(getToolBarBorderPosition(toolBar)).toBe("BorderLayout.SOUTH");
  });

  it("returns WEST for left position", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      position: "left",
    });

    expect(getToolBarBorderPosition(toolBar)).toBe("BorderLayout.WEST");
  });

  it("returns EAST for right position", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      position: "right",
    });

    expect(getToolBarBorderPosition(toolBar)).toBe("BorderLayout.EAST");
  });
});

describe("generateToolBar", () => {
  it("generates basic toolbar without children", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
    });

    const componentMap = new Map<string, ComponentModel>([["toolBar", toolBar]]);

    const result = generateToolBar(
      toolBar,
      componentMap,
      [toolBar],
      new Set(),
      new Map(),
      new Map(),
    );

    expect(result).toContain(`    toolBar = new JToolBar();`);
    expect(result).toContain(`    toolBar.setOrientation(JToolBar.HORIZONTAL);`);
    expect(result).toContain(`    getContentPane().add(toolBar, BorderLayout.NORTH);`);
  });

  it("generates vertical toolbar with orientation", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      orientation: "vertical",
    });

    const componentMap = new Map<string, ComponentModel>([["toolBar", toolBar]]);

    const result = generateToolBar(
      toolBar,
      componentMap,
      [toolBar],
      new Set(),
      new Map(),
      new Map(),
    );

    expect(result).toContain(`    toolBar.setOrientation(JToolBar.VERTICAL);`);
  });

  it("generates toolbar with button children", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      children: ["btn1", "btn2"],
    });
    const btn1 = createComponent({
      id: "btn1",
      type: "Button",
      variableName: "btn1",
      parentId: "toolBar",
      text: "Save",
    });
    const btn2 = createComponent({
      id: "btn2",
      type: "Button",
      variableName: "btn2",
      parentId: "toolBar",
      text: "Open",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["toolBar", toolBar],
      ["btn1", btn1],
      ["btn2", btn2],
    ]);

    const result = generateToolBar(
      toolBar,
      componentMap,
      [toolBar, btn1, btn2],
      new Set(),
      new Map(),
      new Map(),
    );

    expect(result).toContain(`    btn1 = new JButton("Save");`);
    expect(result).toContain(`    btn2 = new JButton("Open");`);
    expect(result).toContain(`    toolBar.add(btn1);`);
    expect(result).toContain(`    toolBar.add(btn2);`);
  });

  it("generates toolbar with custom component children", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      children: ["customBtn"],
    });
    const customBtn = createComponent({
      id: "customBtn",
      type: "Button",
      variableName: "customBtn",
      parentId: "toolBar",
      text: "Custom",
      backgroundColor: "#FF0000",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["toolBar", toolBar],
      ["customBtn", customBtn],
    ]);

    const customIds = new Set<string>(["customBtn"]);
    const customClassNames = new Map<string, string>([["customBtn", "CustomButton"]]);

    const result = generateToolBar(
      toolBar,
      componentMap,
      [toolBar, customBtn],
      customIds,
      customClassNames,
      new Map(),
    );

    expect(result).toContain(`    customBtn = new CustomButton();`);
  });

  it("generates toolbar with event listener for child", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      children: ["btn1"],
    });
    const btn1 = createComponent({
      id: "btn1",
      type: "Button",
      variableName: "btn1",
      parentId: "toolBar",
      text: "Click Me",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["toolBar", toolBar],
      ["btn1", btn1],
    ]);

    const methodNames = new Map<string, string>([["btn1", "onButtonClick"]]);

    const result = generateToolBar(
      toolBar,
      componentMap,
      [toolBar, btn1],
      new Set(),
      new Map(),
      methodNames,
    );

    expect(result).toContain(`    btn1.addActionListener(e -> onButtonClick());`);
  });

  it("generates toolbar with bottom position", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      position: "bottom",
    });

    const componentMap = new Map<string, ComponentModel>([["toolBar", toolBar]]);

    const result = generateToolBar(
      toolBar,
      componentMap,
      [toolBar],
      new Set(),
      new Map(),
      new Map(),
    );

    expect(result).toContain(`    getContentPane().add(toolBar, BorderLayout.SOUTH);`);
  });

  it("generates toolbar components in children array order", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      children: ["btnA", "btnB", "btnC"],
    });
    const btnA = createComponent({
      id: "btnA",
      type: "Button",
      variableName: "btnA",
      parentId: "toolBar",
      text: "A",
    });
    const btnB = createComponent({
      id: "btnB",
      type: "Button",
      variableName: "btnB",
      parentId: "toolBar",
      text: "B",
    });
    const btnC = createComponent({
      id: "btnC",
      type: "Button",
      variableName: "btnC",
      parentId: "toolBar",
      text: "C",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["toolBar", toolBar],
      ["btnA", btnA],
      ["btnB", btnB],
      ["btnC", btnC],
    ]);

    const result = generateToolBar(
      toolBar,
      componentMap,
      [toolBar, btnA, btnB, btnC],
      new Set(),
      new Map(),
      new Map(),
    );

    const btnAIndex = result.findIndex((line) => line.includes("toolBar.add(btnA)"));
    const btnBIndex = result.findIndex((line) => line.includes("toolBar.add(btnB)"));
    const btnCIndex = result.findIndex((line) => line.includes("toolBar.add(btnC)"));

    expect(btnAIndex).toBeLessThan(btnBIndex);
    expect(btnBIndex).toBeLessThan(btnCIndex);
  });
});
