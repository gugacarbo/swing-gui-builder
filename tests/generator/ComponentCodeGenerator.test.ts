import { describe, expect, it } from "vitest";
import type { ComponentModel } from "../../src/components/ComponentModel";
import {
  generateComponentCode,
  sortRegularComponentsForGeneration,
} from "../../src/generator/ComponentCodeGenerator";

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

describe("sortRegularComponentsForGeneration", () => {
  it("returns empty array for empty input", () => {
    const result = sortRegularComponentsForGeneration([]);
    expect(result).toEqual([]);
  });

  it("returns single component unchanged", () => {
    const button = createComponent({
      id: "button1",
      type: "Button",
      variableName: "button1",
    });

    const result = sortRegularComponentsForGeneration([button]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("button1");
  });

  it("orders parent before child", () => {
    const parent = createComponent({
      id: "panel1",
      type: "Panel",
      variableName: "panel1",
    });
    const child = createComponent({
      id: "button1",
      type: "Button",
      variableName: "button1",
      parentId: "panel1",
    });

    const result = sortRegularComponentsForGeneration([child, parent]);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("panel1"); // Parent first
    expect(result[1].id).toBe("button1"); // Child second
  });

  it("handles multiple levels of nesting", () => {
    const grandparent = createComponent({
      id: "panel1",
      type: "Panel",
      variableName: "panel1",
    });
    const parent = createComponent({
      id: "panel2",
      type: "Panel",
      variableName: "panel2",
      parentId: "panel1",
    });
    const child = createComponent({
      id: "button1",
      type: "Button",
      variableName: "button1",
      parentId: "panel2",
    });

    const result = sortRegularComponentsForGeneration([child, parent, grandparent]);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("panel1"); // Grandparent first
    expect(result[1].id).toBe("panel2"); // Parent second
    expect(result[2].id).toBe("button1"); // Child last
  });

  it("handles multiple independent components without parent", () => {
    const button1 = createComponent({
      id: "button1",
      type: "Button",
      variableName: "button1",
    });
    const button2 = createComponent({
      id: "button2",
      type: "Button",
      variableName: "button2",
    });
    const button3 = createComponent({
      id: "button3",
      type: "Button",
      variableName: "button3",
    });

    const result = sortRegularComponentsForGeneration([button1, button2, button3]);

    expect(result).toHaveLength(3);
    expect(result.map((c) => c.id)).toContain("button1");
    expect(result.map((c) => c.id)).toContain("button2");
    expect(result.map((c) => c.id)).toContain("button3");
  });

  it("handles mixed hierarchy and independent components", () => {
    const panel = createComponent({
      id: "panel1",
      type: "Panel",
      variableName: "panel1",
    });
    const childButton = createComponent({
      id: "childButton",
      type: "Button",
      variableName: "childButton",
      parentId: "panel1",
    });
    const independentButton = createComponent({
      id: "independentButton",
      type: "Button",
      variableName: "independentButton",
    });

    const result = sortRegularComponentsForGeneration([childButton, independentButton, panel]);

    expect(result).toHaveLength(3);
    const panelIndex = result.findIndex((c) => c.id === "panel1");
    const childIndex = result.findIndex((c) => c.id === "childButton");
    expect(panelIndex).toBeLessThan(childIndex);
  });

  it("handles circular reference gracefully (ignores cycle)", () => {
    // Create components that would create a cycle if we followed parent relationships
    // In practice this shouldn't happen, but the algorithm guards against it
    const comp1 = createComponent({
      id: "comp1",
      type: "Panel",
      variableName: "comp1",
      parentId: "comp2",
    });
    const comp2 = createComponent({
      id: "comp2",
      type: "Panel",
      variableName: "comp2",
      parentId: "comp1",
    });

    // Should not hang and should return both components
    const result = sortRegularComponentsForGeneration([comp1, comp2]);

    expect(result).toHaveLength(2);
  });

  it("handles component with non-existent parent reference", () => {
    const child = createComponent({
      id: "button1",
      type: "Button",
      variableName: "button1",
      parentId: "nonExistentParent",
    });

    const result = sortRegularComponentsForGeneration([child]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("button1");
  });
});

describe("generateComponentCode", () => {
  it("generates basic button component code", () => {
    const button = createComponent({
      id: "button1",
      type: "Button",
      variableName: "okButton",
      x: 10,
      y: 20,
      width: 100,
      height: 30,
    });

    const componentMap = new Map<string, ComponentModel>([["button1", button]]);

    const result = generateComponentCode(
      button,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [button],
    );

    expect(result).toContain("    okButton = new JButton();");
    expect(result).toContain("    okButton.setBounds(10, 20, 100, 30);");
    expect(result).toContain("    this.add(okButton);");
  });

  it("generates custom class component when in customIds", () => {
    const button = createComponent({
      id: "button1",
      type: "Button",
      variableName: "customButton",
      x: 10,
      y: 20,
      width: 100,
      height: 30,
    });

    const componentMap = new Map<string, ComponentModel>([["button1", button]]);
    const customIds = new Set(["button1"]);
    const customClassNames = new Map([["button1", "MyCustomButton"]]);

    const result = generateComponentCode(
      button,
      customIds,
      customClassNames,
      new Map(),
      false,
      componentMap,
      [button],
    );

    expect(result).toContain("    customButton = new MyCustomButton();");
  });

  it("adds component to canvasPanel when hasToolBars is true", () => {
    const button = createComponent({
      id: "button1",
      type: "Button",
      variableName: "testButton",
    });

    const componentMap = new Map<string, ComponentModel>([["button1", button]]);

    const result = generateComponentCode(
      button,
      new Set(),
      new Map(),
      new Map(),
      true, // hasToolBars = true
      componentMap,
      [button],
    );

    expect(result).toContain("    canvasPanel.add(testButton);");
  });

  it("adds listener code when method name is provided", () => {
    const button = createComponent({
      id: "button1",
      type: "Button",
      variableName: "clickButton",
    });

    const componentMap = new Map<string, ComponentModel>([["button1", button]]);
    const methodNames = new Map([["button1", "onClick"]]);

    const result = generateComponentCode(
      button,
      new Set(),
      new Map(),
      methodNames,
      false,
      componentMap,
      [button],
    );

    expect(result.some((line) => line.includes("addActionListener"))).toBe(true);
  });

  it("generates panel with null layout when it has children", () => {
    const panel = createComponent({
      id: "panel1",
      type: "Panel",
      variableName: "mainPanel",
      children: ["button1"],
    });
    const button = createComponent({
      id: "button1",
      type: "Button",
      variableName: "childButton",
      parentId: "panel1",
    });

    const componentMap = new Map<string, ComponentModel>([
      ["panel1", panel],
      ["button1", button],
    ]);

    const result = generateComponentCode(
      panel,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [panel, button],
    );

    expect(result).toContain("    mainPanel.setLayout(null);");
  });

  it("adds component to panel parent when parent is a panel", () => {
    const panel = createComponent({
      id: "panel1",
      type: "Panel",
      variableName: "mainPanel",
    });
    const button = createComponent({
      id: "button1",
      type: "Button",
      variableName: "childButton",
      parentId: "panel1",
      parentOffset: { x: 5, y: 10 },
    });

    const componentMap = new Map<string, ComponentModel>([
      ["panel1", panel],
      ["button1", button],
    ]);

    const result = generateComponentCode(
      button,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [panel, button],
    );

    expect(result).toContain("    mainPanel.add(childButton);");
    // Should use parentOffset for bounds
    expect(result).toContain("    childButton.setBounds(5, 10, 120, 30);");
  });

  it("generates text field component", () => {
    const textField = createComponent({
      id: "tf1",
      type: "TextField",
      variableName: "nameField",
      x: 50,
      y: 100,
      width: 200,
      height: 25,
    });

    const componentMap = new Map<string, ComponentModel>([["tf1", textField]]);

    const result = generateComponentCode(
      textField,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [textField],
    );

    expect(result).toContain("    nameField = new JTextField();");
    expect(result).toContain("    nameField.setBounds(50, 100, 200, 25);");
  });

  it("generates text field with text constructor", () => {
    const textField = createComponent({
      id: "tf1",
      type: "TextField",
      variableName: "nameField",
      text: "Enter name",
      x: 50,
      y: 100,
      width: 200,
      height: 25,
    });

    const componentMap = new Map<string, ComponentModel>([["tf1", textField]]);

    const result = generateComponentCode(
      textField,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [textField],
    );

    expect(result).toContain('    nameField = new JTextField("Enter name");');
  });

  it("generates label component without text", () => {
    const label = createComponent({
      id: "label1",
      type: "Label",
      variableName: "titleLabel",
      x: 0,
      y: 0,
      width: 300,
      height: 40,
    });

    const componentMap = new Map<string, ComponentModel>([["label1", label]]);

    const result = generateComponentCode(
      label,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [label],
    );

    expect(result).toContain("    titleLabel = new JLabel();");
  });

  it("generates label component with text constructor", () => {
    const label = createComponent({
      id: "label1",
      type: "Label",
      variableName: "titleLabel",
      text: "Welcome",
      x: 0,
      y: 0,
      width: 300,
      height: 40,
    });

    const componentMap = new Map<string, ComponentModel>([["label1", label]]);

    const result = generateComponentCode(
      label,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [label],
    );

    expect(result).toContain('    titleLabel = new JLabel("Welcome");');
  });

  it("generates combo box component", () => {
    const comboBox = createComponent({
      id: "cb1",
      type: "ComboBox",
      variableName: "countryCombo",
      items: ["USA", "Canada", "Mexico"],
      x: 100,
      y: 50,
      width: 150,
      height: 25,
    });

    const componentMap = new Map<string, ComponentModel>([["cb1", comboBox]]);

    const result = generateComponentCode(
      comboBox,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [comboBox],
    );

    // ComboBox uses JComboBox<String> from swingMappings
    expect(result).toContain("    countryCombo = new JComboBox<String>();");
  });

  it("generates list component", () => {
    const list = createComponent({
      id: "list1",
      type: "List",
      variableName: "itemsList",
      items: ["Item 1", "Item 2", "Item 3"],
      x: 0,
      y: 0,
      width: 200,
      height: 150,
    });

    const componentMap = new Map<string, ComponentModel>([["list1", list]]);

    const result = generateComponentCode(
      list,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [list],
    );

    // List uses JList<String> from swingMappings
    expect(result).toContain("    itemsList = new JList<String>();");
  });

  it("generates progress bar component", () => {
    const progressBar = createComponent({
      id: "pb1",
      type: "ProgressBar",
      variableName: "progressBar",
      min: 0,
      max: 100,
      value: 50,
      x: 0,
      y: 0,
      width: 300,
      height: 25,
    });

    const componentMap = new Map<string, ComponentModel>([["pb1", progressBar]]);

    const result = generateComponentCode(
      progressBar,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [progressBar],
    );

    expect(result).toContain("    progressBar = new JProgressBar();");
  });

  it("generates slider component", () => {
    const slider = createComponent({
      id: "slider1",
      type: "Slider",
      variableName: "sliderControl",
      min: 0,
      max: 100,
      x: 0,
      y: 0,
      width: 200,
      height: 30,
    });

    const componentMap = new Map<string, ComponentModel>([["slider1", slider]]);

    const result = generateComponentCode(
      slider,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [slider],
    );

    expect(result).toContain("    sliderControl = new JSlider();");
  });

  it("generates spinner component", () => {
    const spinner = createComponent({
      id: "spinner1",
      type: "Spinner",
      variableName: "spinnerControl",
      x: 0,
      y: 0,
      width: 100,
      height: 30,
    });

    const componentMap = new Map<string, ComponentModel>([["spinner1", spinner]]);

    const result = generateComponentCode(
      spinner,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [spinner],
    );

    expect(result).toContain("    spinnerControl = new JSpinner();");
  });

  it("generates separator component", () => {
    const separator = createComponent({
      id: "sep1",
      type: "Separator",
      variableName: "separatorControl",
      x: 0,
      y: 0,
      width: 200,
      height: 10,
    });

    const componentMap = new Map<string, ComponentModel>([["sep1", separator]]);

    const result = generateComponentCode(
      separator,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [separator],
    );

    expect(result).toContain("    separatorControl = new JSeparator();");
  });

  it("generates check box component without text", () => {
    const checkBox = createComponent({
      id: "cb1",
      type: "CheckBox",
      variableName: "rememberCheck",
    });

    const componentMap = new Map<string, ComponentModel>([["cb1", checkBox]]);

    const result = generateComponentCode(
      checkBox,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [checkBox],
    );

    expect(result).toContain("    rememberCheck = new JCheckBox();");
  });

  it("generates check box component with text and selected", () => {
    const checkBox = createComponent({
      id: "cb1",
      type: "CheckBox",
      variableName: "rememberCheck",
      text: "Remember me",
      selected: true,
    });

    const componentMap = new Map<string, ComponentModel>([["cb1", checkBox]]);

    const result = generateComponentCode(
      checkBox,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [checkBox],
    );

    expect(result).toContain('    rememberCheck = new JCheckBox("Remember me");');
    expect(result).toContain("    rememberCheck.setSelected(true);");
  });

  it("generates radio button component without text", () => {
    const radioButton = createComponent({
      id: "rb1",
      type: "RadioButton",
      variableName: "optionRadio",
    });

    const componentMap = new Map<string, ComponentModel>([["rb1", radioButton]]);

    const result = generateComponentCode(
      radioButton,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [radioButton],
    );

    expect(result).toContain("    optionRadio = new JRadioButton();");
  });

  it("generates radio button component with text and selected", () => {
    const radioButton = createComponent({
      id: "rb1",
      type: "RadioButton",
      variableName: "optionRadio",
      text: "Option A",
      selected: true,
    });

    const componentMap = new Map<string, ComponentModel>([["rb1", radioButton]]);

    const result = generateComponentCode(
      radioButton,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [radioButton],
    );

    expect(result).toContain('    optionRadio = new JRadioButton("Option A");');
    expect(result).toContain("    optionRadio.setSelected(true);");
  });

  it("generates text area component without text", () => {
    const textArea = createComponent({
      id: "ta1",
      type: "TextArea",
      variableName: "descriptionArea",
      x: 0,
      y: 0,
      width: 300,
      height: 150,
    });

    const componentMap = new Map<string, ComponentModel>([["ta1", textArea]]);

    const result = generateComponentCode(
      textArea,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [textArea],
    );

    expect(result).toContain("    descriptionArea = new JTextArea();");
  });

  it("generates text area component with text constructor", () => {
    const textArea = createComponent({
      id: "ta1",
      type: "TextArea",
      variableName: "descriptionArea",
      text: "Description",
      x: 0,
      y: 0,
      width: 300,
      height: 150,
    });

    const componentMap = new Map<string, ComponentModel>([["ta1", textArea]]);

    const result = generateComponentCode(
      textArea,
      new Set(),
      new Map(),
      new Map(),
      false,
      componentMap,
      [textArea],
    );

    expect(result).toContain('    descriptionArea = new JTextArea("Description");');
  });
});
