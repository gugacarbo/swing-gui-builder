import { describe, expect, it } from "vitest";
import type { ComponentModel } from "../../src/components/ComponentModel";
import {
  generateComponentCode,
  generateHierarchicalCode,
} from "../../src/generator/componentGenerators";

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

describe("generateHierarchicalCode edge branches", () => {
  it.each([
    ["bottom", "BorderLayout.SOUTH"],
    ["left", "BorderLayout.WEST"],
    ["right", "BorderLayout.EAST"],
  ] as const)("maps toolbar position %s to %s and supports custom children", (position, border) => {
    const toolBar = createComponent({
      id: `toolbar-${position}`,
      type: "ToolBar",
      variableName: `toolbar${position}`,
      position,
      children: ["toolbar-child"],
    });
    const toolbarChild = createComponent({
      id: "toolbar-child",
      type: "Button",
      variableName: "toolbarChild",
      parentId: toolBar.id,
    });

    const result = generateHierarchicalCode(
      [toolBar, toolbarChild],
      new Set(["toolbar-child"]),
      new Map([["toolbar-child", "CustomButton1"]]),
      new Map(),
    );
    const content = result.toolBarLines.join("\n");

    expect(content).toContain("    toolbarChild = new CustomButton1();");
    expect(content).toContain(`    getContentPane().add(${toolBar.variableName}, ${border});`);
  });

  it("handles cyclic descendants and cyclic regular parent relations without recursion loops", () => {
    const menuBar = createComponent({
      id: "menuBar",
      type: "MenuBar",
      variableName: "menuBar",
      children: ["menuA"],
    });
    const menuA = createComponent({
      id: "menuA",
      type: "Menu",
      variableName: "menuA",
      parentId: "menuBar",
      children: ["menuBar"],
    });
    const regularA = createComponent({
      id: "regularA",
      type: "Button",
      variableName: "regularA",
      parentId: "regularB",
    });
    const regularB = createComponent({
      id: "regularB",
      type: "Button",
      variableName: "regularB",
      parentId: "regularA",
    });

    const result = generateHierarchicalCode(
      [menuBar, menuA, regularA, regularB],
      new Set(),
      new Map(),
      new Map(),
    );

    expect(result.menuBars.map((component) => component.id)).toEqual(["menuBar"]);
    expect(result.regularComponents.map((component) => component.id).sort()).toEqual([
      "regularA",
      "regularB",
    ]);
  });

  it("generates ActionListener for MenuItem with eventMethodName", () => {
    const menuBar = createComponent({
      id: "menuBar",
      type: "MenuBar",
      variableName: "menuBar",
      children: ["fileMenu"],
    });
    const fileMenu = createComponent({
      id: "fileMenu",
      type: "Menu",
      variableName: "fileMenu",
      parentId: "menuBar",
      children: ["exitMenuItem"],
    });
    const exitMenuItem = createComponent({
      id: "exitMenuItem",
      type: "MenuItem",
      variableName: "exitMenuItem",
      parentId: "fileMenu",
      text: "Exit",
      eventMethodName: "onExit",
    });

    const result = generateHierarchicalCode(
      [menuBar, fileMenu, exitMenuItem],
      new Set(),
      new Map(),
      new Map([["exitMenuItem", "onExit"]]),
    );

    const content = result.menuBarLines.join("\n");
    expect(content).toContain('    exitMenuItem = new JMenuItem("Exit");');
    expect(content).toContain("    exitMenuItem.addActionListener(e -> onExit());");
  });

  it("generates ActionListener for ToolBar child with eventMethodName", () => {
    const toolBar = createComponent({
      id: "mainToolBar",
      type: "ToolBar",
      variableName: "mainToolBar",
      position: "top",
      children: ["actionButton"],
    });
    const actionButton = createComponent({
      id: "actionButton",
      type: "Button",
      variableName: "actionButton",
      parentId: "mainToolBar",
      text: "Action",
      eventMethodName: "doAction",
    });

    const result = generateHierarchicalCode(
      [toolBar, actionButton],
      new Set(),
      new Map(),
      new Map([["actionButton", "doAction"]]),
    );

    const content = result.toolBarLines.join("\n");
    expect(content).toContain('    actionButton = new JButton("Action");');
    expect(content).toContain("    actionButton.addActionListener(e -> doAction());");
  });

  it("generates ActionListener for regular component with eventMethodName", () => {
    const button = createComponent({
      id: "submitButton",
      type: "Button",
      variableName: "submitButton",
      text: "Submit",
      eventMethodName: "onSubmit",
    });

    const components = [button];
    const componentMap = new Map(components.map((comp) => [comp.id, comp]));
    const lines = generateComponentCode(
      button,
      new Set(),
      new Map(),
      new Map([["submitButton", "onSubmit"]]),
      false,
      componentMap,
      components,
    );

    const content = lines.join("\n");
    expect(content).toContain('    submitButton = new JButton("Submit");');
    expect(content).toContain("    submitButton.addActionListener(e -> onSubmit());");
  });
});
