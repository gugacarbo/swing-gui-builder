import { describe, expect, it } from "vitest";
import type { CanvasState, ComponentModel } from "../../src/components/ComponentModel";
import { generateJavaFiles } from "../../src/generator/JavaGenerator";

type ComponentOverrides = Partial<Omit<ComponentModel, "id" | "type" | "variableName">> & {
  id: string;
  type: string;
  variableName: string;
};

function createComponent(overrides: ComponentOverrides): ComponentModel {
  const { id, type, variableName, ...rest } = overrides;

  return {
    id,
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
    type: type as ComponentModel["type"],
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

function createMixedHierarchyState(): CanvasState {
  return {
    className: "OrderingFrame",
    frameWidth: 800,
    frameHeight: 600,
    components: [
      createComponent({
        id: "toolbarButton",
        type: "Button",
        variableName: "toolbarButton",
        text: "Save",
        parentId: "mainToolBar",
      }),
      createComponent({
        id: "mainToolBar",
        type: "ToolBar",
        variableName: "mainToolBar",
        orientation: "horizontal",
        position: "top",
        children: ["toolbarButton"],
      }),
      createComponent({
        id: "fileMenu",
        type: "Menu",
        variableName: "fileMenu",
        text: "File",
        parentId: "mainMenuBar",
        children: ["openItem"],
      }),
      createComponent({
        id: "contentLabel",
        type: "Label",
        variableName: "contentLabel",
        x: 20,
        y: 30,
        text: "Status",
      }),
      createComponent({
        id: "mainMenuBar",
        type: "MenuBar",
        variableName: "mainMenuBar",
        children: ["fileMenu"],
      }),
      createComponent({
        id: "openItem",
        type: "MenuItem",
        variableName: "openItem",
        text: "Open",
        parentId: "fileMenu",
      }),
      createComponent({
        id: "mainButton",
        type: "Button",
        variableName: "mainButton",
        x: 20,
        y: 70,
        text: "Run",
      }),
    ],
  };
}

describe("JavaGenerator hierarchical generation order", () => {
  it("emits JMenuBar setup before regular components and JToolBar after regular components", () => {
    const content = getMainFrameContent(createMixedHierarchyState());

    const menuBarInitIndex = content.indexOf("    mainMenuBar = new JMenuBar();");
    const setMenuBarIndex = content.indexOf("    frame.setJMenuBar(mainMenuBar);");
    const regularLabelIndex = content.indexOf('    contentLabel = new JLabel("Status");');
    const regularButtonIndex = content.indexOf('    mainButton = new JButton("Run");');
    const toolBarInitIndex = content.indexOf("    mainToolBar = new JToolBar();");

    expect(menuBarInitIndex).toBeGreaterThanOrEqual(0);
    expect(setMenuBarIndex).toBeGreaterThan(menuBarInitIndex);
    expect(regularLabelIndex).toBeGreaterThan(setMenuBarIndex);
    expect(regularButtonIndex).toBeGreaterThan(setMenuBarIndex);
    expect(toolBarInitIndex).toBeGreaterThan(Math.max(regularLabelIndex, regularButtonIndex));
  });

  it("keeps menu and toolbar child components out of flat setBounds section", () => {
    const content = getMainFrameContent(createMixedHierarchyState());

    expect(content).toContain('    openItem = new JMenuItem("Open");');
    expect(content).toContain("    mainToolBar.add(toolbarButton);");
    expect(content).not.toContain("openItem.setBounds(");
    expect(content).not.toContain("toolbarButton.setBounds(");

    const flatAddIndex = content.indexOf("    canvasPanel.add(mainButton);");
    const toolBarAddIndex = content.indexOf(
      "    getContentPane().add(mainToolBar, BorderLayout.NORTH);",
    );
    expect(flatAddIndex).toBeGreaterThanOrEqual(0);
    expect(toolBarAddIndex).toBeGreaterThan(flatAddIndex);
  });
});
