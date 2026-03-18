import { describe, expect, it } from "vitest";
import type { ComponentModel } from "../../src/components/ComponentModel";
import {
  DEFAULT_BG,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
  applyInlineStyleCode,
  capitalize,
  getComponentInitCode,
  getComponentPropsCode,
  getListenerCode,
} from "../../src/generator/codeHelpers";

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
    backgroundColor: DEFAULT_BG,
    textColor: DEFAULT_TEXT_COLOR,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: DEFAULT_FONT_SIZE,
    eventMethodName: "",
    ...rest,
  };
}

describe("codeHelpers additional behavior coverage", () => {
  it("capitalizes strings safely", () => {
    expect(capitalize("button")).toBe("Button");
    expect(capitalize("")).toBe("");
  });

  it("generates constructor init code based on type and text", () => {
    const textButton = createComponent({
      id: "button-1",
      type: "Button",
      variableName: "button1",
      text: 'Save "Now"',
    });
    const panel = createComponent({
      id: "panel-1",
      type: "Panel",
      variableName: "mainPanel",
      text: "Ignored",
    });

    expect(getComponentInitCode(textButton, "JButton")).toBe(
      '    button1 = new JButton("Save \\"Now\\"");',
    );
    expect(getComponentInitCode(panel, "JPanel")).toBe("    mainPanel = new JPanel();");
  });

  it("generates property code for selection components", () => {
    const selectedCheck = createComponent({
      id: "check-1",
      type: "CheckBox",
      variableName: "check1",
      selected: true,
    });
    const radioWithoutSelected = createComponent({
      id: "radio-1",
      type: "RadioButton",
      variableName: "radio1",
    });

    expect(getComponentPropsCode(selectedCheck)).toEqual(["    check1.setSelected(true);"]);
    expect(getComponentPropsCode(radioWithoutSelected)).toEqual([]);
  });

  it("generates property code for combo box and list models", () => {
    const combo = createComponent({
      id: "combo-1",
      type: "ComboBox",
      variableName: "combo1",
      items: ['Item "A"', "Item B"],
    });
    const list = createComponent({
      id: "list-1",
      type: "List",
      variableName: "list1",
      items: ["One", "Two"],
    });

    expect(getComponentPropsCode(combo)).toEqual([
      '    combo1.setModel(new DefaultComboBoxModel<>(new String[] {"Item \\"A\\"", "Item B"}));',
    ]);
    expect(getComponentPropsCode(list)).toEqual([
      "    DefaultListModel<String> list1Model = new DefaultListModel<>();",
      '    list1Model.addElement("One");',
      '    list1Model.addElement("Two");',
      "    list1.setModel(list1Model);",
    ]);
  });

  it("handles missing optional item and range values", () => {
    const emptyCombo = createComponent({
      id: "combo-empty",
      type: "ComboBox",
      variableName: "comboEmpty",
      items: undefined,
    });
    const emptyList = createComponent({
      id: "list-empty",
      type: "List",
      variableName: "listEmpty",
      items: undefined,
    });
    const emptyProgress = createComponent({
      id: "progress-empty",
      type: "ProgressBar",
      variableName: "progressEmpty",
    });
    const emptySpinner = createComponent({
      id: "spinner-empty",
      type: "Spinner",
      variableName: "spinnerEmpty",
    });

    expect(getComponentPropsCode(emptyCombo)).toEqual([
      "    comboEmpty.setModel(new DefaultComboBoxModel<>(new String[] {}));",
    ]);
    expect(getComponentPropsCode(emptyList)).toEqual([
      "    DefaultListModel<String> listEmptyModel = new DefaultListModel<>();",
      "    listEmpty.setModel(listEmptyModel);",
    ]);
    expect(getComponentPropsCode(emptyProgress)).toEqual([]);
    expect(getComponentPropsCode(emptySpinner)).toEqual([
      "    SpinnerNumberModel spinnerEmptyNumberModel = (SpinnerNumberModel) spinnerEmpty.getModel();",
    ]);
  });

  it("generates min/max/value code for range-based components", () => {
    const slider = createComponent({
      id: "slider-1",
      type: "Slider",
      variableName: "slider1",
      min: 0,
      max: 100,
      value: 42,
    });
    const progress = createComponent({
      id: "progress-1",
      type: "ProgressBar",
      variableName: "progress1",
      min: 10,
    });
    const spinner = createComponent({
      id: "spinner-1",
      type: "Spinner",
      variableName: "spinner1",
      min: 1,
      max: 9,
      value: 3,
    });

    expect(getComponentPropsCode(slider)).toEqual([
      "    slider1.setMinimum(0);",
      "    slider1.setMaximum(100);",
      "    slider1.setValue(42);",
    ]);
    expect(getComponentPropsCode(progress)).toEqual(["    progress1.setMinimum(10);"]);
    expect(getComponentPropsCode(spinner)).toEqual([
      "    SpinnerNumberModel spinner1NumberModel = (SpinnerNumberModel) spinner1.getModel();",
      "    spinner1NumberModel.setMinimum(1);",
      "    spinner1NumberModel.setMaximum(9);",
      "    spinner1.setValue(3);",
    ]);
  });

  it("generates orientation code for separators", () => {
    const verticalSeparator = createComponent({
      id: "separator-1",
      type: "Separator",
      variableName: "separator1",
      orientation: "vertical",
    });
    const horizontalSeparator = createComponent({
      id: "separator-2",
      type: "Separator",
      variableName: "separator2",
      orientation: "horizontal",
    });

    expect(getComponentPropsCode(verticalSeparator)).toEqual([
      "    separator1.setOrientation(SwingConstants.VERTICAL);",
    ]);
    expect(getComponentPropsCode(horizontalSeparator)).toEqual([
      "    separator2.setOrientation(SwingConstants.HORIZONTAL);",
    ]);
  });

  it("returns empty property code for components without mapped props", () => {
    const button = createComponent({
      id: "button-2",
      type: "Button",
      variableName: "button2",
    });

    expect(getComponentPropsCode(button)).toEqual([]);
  });

  it("generates listeners for all supported interactive component types", () => {
    const byType = {
      Button: "    button1.addActionListener(e -> onAction());",
      TextField: "    textField1.addActionListener(e -> onAction());",
      PasswordField: "    password1.addActionListener(e -> onAction());",
      TextArea: [
        "    textArea1.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {",
        "      public void insertUpdate(javax.swing.event.DocumentEvent e) { onAction(); }",
        "      public void removeUpdate(javax.swing.event.DocumentEvent e) { onAction(); }",
        "      public void changedUpdate(javax.swing.event.DocumentEvent e) { onAction(); }",
        "    });",
      ].join("\n"),
      CheckBox: "    check1.addItemListener(e -> onAction());",
      RadioButton: "    radio1.addActionListener(e -> onAction());",
      ComboBox: "    combo1.addActionListener(e -> onAction());",
      List: "    list1.addListSelectionListener(e -> { if (!e.getValueIsAdjusting()) onAction(); });",
      Slider: "    slider1.addChangeListener(e -> onAction());",
      Spinner: "    spinner1.addChangeListener(e -> onAction());",
    } as const;

    const components: Record<keyof typeof byType, ComponentModel> = {
      Button: createComponent({ id: "button", type: "Button", variableName: "button1" }),
      TextField: createComponent({ id: "textField", type: "TextField", variableName: "textField1" }),
      PasswordField: createComponent({
        id: "password",
        type: "PasswordField",
        variableName: "password1",
      }),
      TextArea: createComponent({ id: "textArea", type: "TextArea", variableName: "textArea1" }),
      CheckBox: createComponent({ id: "check", type: "CheckBox", variableName: "check1" }),
      RadioButton: createComponent({ id: "radio", type: "RadioButton", variableName: "radio1" }),
      ComboBox: createComponent({ id: "combo", type: "ComboBox", variableName: "combo1" }),
      List: createComponent({ id: "list", type: "List", variableName: "list1" }),
      Slider: createComponent({ id: "slider", type: "Slider", variableName: "slider1" }),
      Spinner: createComponent({ id: "spinner", type: "Spinner", variableName: "spinner1" }),
    };

    for (const [type, expected] of Object.entries(byType) as Array<
      [keyof typeof byType, string]
    >) {
      expect(getListenerCode(components[type], "onAction")).toBe(expected);
    }

    expect(
      getListenerCode(
        createComponent({ id: "panel", type: "Panel", variableName: "panel1" }),
        "onAction",
      ),
    ).toBe("");
  });

  it("applies inline style lines only when style differs from defaults", () => {
    const custom = createComponent({
      id: "custom-1",
      type: "Button",
      variableName: "customButton",
      backgroundColor: "#123456",
      textColor: "#FEDCBA",
      fontFamily: "Monaco",
      fontSize: 16,
    });
    const defaults = createComponent({
      id: "default-1",
      type: "Button",
      variableName: "defaultButton",
    });

    const customLines: string[] = [];
    applyInlineStyleCode(customLines, custom);
    expect(customLines).toEqual([
      "    customButton.setBackground(new Color(18, 52, 86));",
      "    customButton.setForeground(new Color(254, 220, 186));",
      '    customButton.setFont(new Font("Monaco", Font.PLAIN, 16));',
    ]);

    const defaultLines: string[] = [];
    applyInlineStyleCode(defaultLines, defaults);
    expect(defaultLines).toEqual([]);
  });
});
