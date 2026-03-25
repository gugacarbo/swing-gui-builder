import { describe, expect, it } from "vitest";
import type { ComponentModel } from "../../src/components/ComponentModel";
import { generateMenuBar, getOrderedChildren } from "../../src/generator/MenuCodeGenerator";

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

describe("getOrderedChildren", () => {
  it("returns children from parent.children array when present", () => {
    const parent = createComponent({
      id: "parent",
      type: "MenuBar",
      variableName: "parent",
      children: ["child1", "child2"],
    });
    const child1 = createComponent({
      id: "child1",
      type: "Menu",
      variableName: "child1",
      parentId: "parent",
    });
    const child2 = createComponent({
      id: "child2",
      type: "Menu",
      variableName: "child2",
      parentId: "parent",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["parent", parent],
      ["child1", child1],
      ["child2", child2],
    ]);

    const result = getOrderedChildren(parent, componentMap, [parent, child1, child2]);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("child1");
    expect(result[1].id).toBe("child2");
  });

  it("filters out non-existent children from children array", () => {
    const parent = createComponent({
      id: "parent",
      type: "MenuBar",
      variableName: "parent",
      children: ["child1", "child2", "nonexistent"],
    });
    const child1 = createComponent({
      id: "child1",
      type: "Menu",
      variableName: "child1",
      parentId: "parent",
    });
    const child2 = createComponent({
      id: "child2",
      type: "Menu",
      variableName: "child2",
      parentId: "parent",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["parent", parent],
      ["child1", child1],
      ["child2", child2],
    ]);

    const result = getOrderedChildren(parent, componentMap, [parent, child1, child2]);

    expect(result).toHaveLength(2);
  });

  it("falls back to filtering by parentId when children array is empty", () => {
    const parent = createComponent({
      id: "parent",
      type: "MenuBar",
      variableName: "parent",
      children: [],
    });
    const child1 = createComponent({
      id: "child1",
      type: "Menu",
      variableName: "child1",
      parentId: "parent",
    });
    const child2 = createComponent({
      id: "child2",
      type: "Menu",
      variableName: "child2",
      parentId: "parent",
    });
    const otherChild = createComponent({
      id: "otherChild",
      type: "Menu",
      variableName: "otherChild",
      parentId: "otherParent",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["parent", parent],
      ["child1", child1],
      ["child2", child2],
      ["otherChild", otherChild],
    ]);

    const result = getOrderedChildren(parent, componentMap, [parent, child1, child2, otherChild]);

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id).sort()).toEqual(["child1", "child2"]);
  });

  it("returns empty array when no children exist", () => {
    const parent = createComponent({
      id: "parent",
      type: "MenuBar",
      variableName: "parent",
    });

    const componentMap = new Map<string, ComponentModel>([["parent", parent]]);

    const result = getOrderedChildren(parent, componentMap, [parent]);

    expect(result).toHaveLength(0);
  });
});

describe("generateMenuBar", () => {
  it("generates basic menu bar with single menu", () => {
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
      text: "File",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["menuBar", menuBar],
      ["fileMenu", fileMenu],
    ]);

    const result = generateMenuBar(menuBar, componentMap, [menuBar, fileMenu], new Map());

    expect(result).toContain(`    menuBar = new JMenuBar();`);
    expect(result).toContain(`    fileMenu = new JMenu("File");`);
    expect(result).toContain(`    menuBar.add(fileMenu);`);
    expect(result).toContain(`    frame.setJMenuBar(menuBar);`);
  });

  it("generates nested menu structure", () => {
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
      text: "File",
      children: ["recentMenu"],
    });
    const recentMenu = createComponent({
      id: "recentMenu",
      type: "Menu",
      variableName: "recentMenu",
      parentId: "fileMenu",
      text: "Recent",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["menuBar", menuBar],
      ["fileMenu", fileMenu],
      ["recentMenu", recentMenu],
    ]);

    const result = generateMenuBar(
      menuBar,
      componentMap,
      [menuBar, fileMenu, recentMenu],
      new Map(),
    );

    expect(result).toContain(`    fileMenu = new JMenu("File");`);
    expect(result).toContain(`    recentMenu = new JMenu("Recent");`);
    expect(result).toContain(`    fileMenu.add(recentMenu);`);
    expect(result).toContain(`    menuBar.add(fileMenu);`);
  });

  it("generates menu items with action listeners", () => {
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
      text: "File",
      children: ["exitItem"],
    });
    const exitItem = createComponent({
      id: "exitItem",
      type: "MenuItem",
      variableName: "exitItem",
      parentId: "fileMenu",
      text: "Exit",
      eventMethodName: "onExit",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["menuBar", menuBar],
      ["fileMenu", fileMenu],
      ["exitItem", exitItem],
    ]);

    const result = generateMenuBar(
      menuBar,
      componentMap,
      [menuBar, fileMenu, exitItem],
      new Map([["exitItem", "onExit"]]),
    );

    expect(result).toContain(`    exitItem = new JMenuItem("Exit");`);
    expect(result).toContain(`    exitItem.addActionListener(e -> onExit());`);
    expect(result).toContain(`    fileMenu.add(exitItem);`);
  });

  it("generates menu items without action listener when no method name", () => {
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
      text: "File",
      children: ["alertItem"],
    });
    const alertItem = createComponent({
      id: "alertItem",
      type: "MenuItem",
      variableName: "alertItem",
      parentId: "fileMenu",
      text: "Alert",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["menuBar", menuBar],
      ["fileMenu", fileMenu],
      ["alertItem", alertItem],
    ]);

    const result = generateMenuBar(
      menuBar,
      componentMap,
      [menuBar, fileMenu, alertItem],
      new Map(),
    );

    expect(result).toContain(`    alertItem = new JMenuItem("Alert");`);
    expect(result).not.toContain("addActionListener");
    expect(result).toContain(`    fileMenu.add(alertItem);`);
  });

  it("escapes special characters in menu text", () => {
    const menuBar = createComponent({
      id: "menuBar",
      type: "MenuBar",
      variableName: "menuBar",
      children: ["quotesMenu"],
    });
    const quotesMenu = createComponent({
      id: "quotesMenu",
      type: "Menu",
      variableName: "quotesMenu",
      parentId: "menuBar",
      text: 'Test "quoted" text',
    });

    const componentMap = new Map<string, ComponentModel>([
      ["menuBar", menuBar],
      ["quotesMenu", quotesMenu],
    ]);

    const result = generateMenuBar(menuBar, componentMap, [menuBar, quotesMenu], new Map());

    expect(result).toContain(`    quotesMenu = new JMenu("Test \\"quoted\\" text");`);
  });

  it("handles multiple top-level menus", () => {
    const menuBar = createComponent({
      id: "menuBar",
      type: "MenuBar",
      variableName: "menuBar",
      children: ["fileMenu", "editMenu", "helpMenu"],
    });
    const fileMenu = createComponent({
      id: "fileMenu",
      type: "Menu",
      variableName: "fileMenu",
      parentId: "menuBar",
      text: "File",
    });
    const editMenu = createComponent({
      id: "editMenu",
      type: "Menu",
      variableName: "editMenu",
      parentId: "menuBar",
      text: "Edit",
    });
    const helpMenu = createComponent({
      id: "helpMenu",
      type: "Menu",
      variableName: "helpMenu",
      parentId: "menuBar",
      text: "Help",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["menuBar", menuBar],
      ["fileMenu", fileMenu],
      ["editMenu", editMenu],
      ["helpMenu", helpMenu],
    ]);

    const result = generateMenuBar(
      menuBar,
      componentMap,
      [menuBar, fileMenu, editMenu, helpMenu],
      new Map(),
    );

    expect(result).toContain(`    fileMenu = new JMenu("File");`);
    expect(result).toContain(`    editMenu = new JMenu("Edit");`);
    expect(result).toContain(`    helpMenu = new JMenu("Help");`);
    expect(result).toContain(`    menuBar.add(fileMenu);`);
    expect(result).toContain(`    menuBar.add(editMenu);`);
    expect(result).toContain(`    menuBar.add(helpMenu);`);
  });

  it("handles cyclic references without infinite loop", () => {
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
      text: "MenuA",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["menuBar", menuBar],
      ["menuA", menuA],
    ]);

    // Should not throw or hang
    const result = generateMenuBar(menuBar, componentMap, [menuBar, menuA], new Map());

    expect(result).toContain(`    menuBar = new JMenuBar();`);
    expect(result).toContain(`    menuA = new JMenu("MenuA");`);
  });

  it("handles menu items in deeply nested structure", () => {
    const menuBar = createComponent({
      id: "menuBar",
      type: "MenuBar",
      variableName: "menuBar",
      children: ["level1"],
    });
    const level1 = createComponent({
      id: "level1",
      type: "Menu",
      variableName: "level1",
      parentId: "menuBar",
      text: "Level1",
      children: ["level2"],
    });
    const level2 = createComponent({
      id: "level2",
      type: "Menu",
      variableName: "level2",
      parentId: "level1",
      text: "Level2",
      children: ["deepItem"],
    });
    const deepItem = createComponent({
      id: "deepItem",
      type: "MenuItem",
      variableName: "deepItem",
      parentId: "level2",
      text: "Deep Item",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["menuBar", menuBar],
      ["level1", level1],
      ["level2", level2],
      ["deepItem", deepItem],
    ]);

    const result = generateMenuBar(
      menuBar,
      componentMap,
      [menuBar, level1, level2, deepItem],
      new Map(),
    );

    expect(result).toContain(`    deepItem = new JMenuItem("Deep Item");`);
    expect(result).toContain(`    level2.add(deepItem);`);
    expect(result).toContain(`    level1.add(level2);`);
    expect(result).toContain(`    menuBar.add(level1);`);
  });

  it("avoids reinitializing components already generated", () => {
    const menuBar = createComponent({
      id: "menuBar",
      type: "MenuBar",
      variableName: "menuBar",
      children: ["sharedMenu"],
    });
    const sharedMenu = createComponent({
      id: "sharedMenu",
      type: "Menu",
      variableName: "sharedMenu",
      parentId: "menuBar",
      text: "Shared",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["menuBar", menuBar],
      ["sharedMenu", sharedMenu],
    ]);

    const result = generateMenuBar(menuBar, componentMap, [menuBar, sharedMenu], new Map());

    // Should only appear once in the output
    const menuCreationCount = result.filter(
      (line) => line === `    sharedMenu = new JMenu("Shared");`,
    ).length;
    expect(menuCreationCount).toBe(1);
  });
});
