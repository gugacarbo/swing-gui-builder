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

  it("handles toolbar with vertical orientation", () => {
    const toolBar = createComponent({
      id: "verticalToolBar",
      type: "ToolBar",
      variableName: "verticalToolBar",
      orientation: "vertical",
      position: "left",
      children: ["toolbarChild"],
    });
    const toolbarChild = createComponent({
      id: "toolbarChild",
      type: "Button",
      variableName: "toolbarChild",
      parentId: toolBar.id,
      text: "Vertical",
    });

    const result = generateHierarchicalCode(
      [toolBar, toolbarChild],
      new Set(),
      new Map(),
      new Map(),
    );

    const content = result.toolBarLines.join("\n");
    expect(content).toContain("JToolBar.VERTICAL");
    expect(content).not.toContain("JToolBar.HORIZONTAL");
    expect(content).toContain("    getContentPane().add(verticalToolBar, BorderLayout.WEST);");
  });

  it("skips listener code for toolbar child when getListenerCode returns empty string", () => {
    const toolBar = createComponent({
      id: "toolBar",
      type: "ToolBar",
      variableName: "toolBar",
      children: ["labelChild"],
    });
    // Label type doesn't produce listener code (getListenerCode returns "")
    const labelChild = createComponent({
      id: "labelChild",
      type: "Label",
      variableName: "labelChild",
      parentId: toolBar.id,
      text: "Info",
      eventMethodName: "onClick", // Label doesn't support this, so getListenerCode returns ""
    });

    const result = generateHierarchicalCode(
      [toolBar, labelChild],
      new Set(),
      new Map(),
      new Map([["labelChild", "onClick"]]),
    );

    const content = result.toolBarLines.join("\n");
    // Should contain the label initialization
    expect(content).toContain("    labelChild = new JLabel(");
    // Should NOT contain addActionListener since getListenerCode returns "" for Label
    expect(content).not.toContain("addActionListener");
  });

  it("skips listener code for regular component when getListenerCode returns empty string", () => {
    // Panel type doesn't produce listener code (getListenerCode returns "")
    const panel = createComponent({
      id: "mainPanel",
      type: "Panel",
      variableName: "mainPanel",
      text: "Panel",
      eventMethodName: "onClick", // Panel doesn't support this, so getListenerCode returns ""
    });

    const components = [panel];
    const componentMap = new Map(components.map((comp) => [comp.id, comp]));
    const lines = generateComponentCode(
      panel,
      new Set(),
      new Map(),
      new Map([["mainPanel", "onClick"]]),
      false,
      componentMap,
      components,
    );

    const content = lines.join("\n");
    // Should contain the panel initialization
    expect(content).toContain("    mainPanel = new JPanel();");
    // Should NOT contain addActionListener since getListenerCode returns "" for Panel
    expect(content).not.toContain("addActionListener");
  });

  it("skips MenuItem code when already generated in same parent", () => {
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
      children: ["exitMenuItem", "exitMenuItem"], // Same child listed twice
    });
    const exitMenuItem = createComponent({
      id: "exitMenuItem",
      type: "MenuItem",
      variableName: "exitMenuItem",
      parentId: "fileMenu",
      text: "Exit",
    });

    const result = generateHierarchicalCode(
      [menuBar, fileMenu, exitMenuItem],
      new Set(),
      new Map(),
      new Map(),
    );

    const content = result.menuBarLines.join("\n");
    // Should only generate the MenuItem once
    const matches = content.match(/exitMenuItem = new JMenuItem/g);
    expect(matches).toHaveLength(1);
  });

  it("skips Menu code when already generated in parent", () => {
    const menuBar = createComponent({
      id: "menuBar",
      type: "MenuBar",
      variableName: "menuBar",
      children: ["fileMenu", "fileMenu"], // Same Menu child listed twice
    });
    const fileMenu = createComponent({
      id: "fileMenu",
      type: "Menu",
      variableName: "fileMenu",
      parentId: "menuBar",
      text: "File",
    });

    const result = generateHierarchicalCode([menuBar, fileMenu], new Set(), new Map(), new Map());

    const content = result.menuBarLines.join("\n");
    // Should only generate the Menu once (not twice)
    const matches = content.match(/fileMenu = new JMenu/g);
    expect(matches).toHaveLength(1);
  });
});
