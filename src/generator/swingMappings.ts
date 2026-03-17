import type { ComponentModel, ComponentType } from "../components/ComponentModel";

const SWING_CLASS_MAP: Partial<Record<ComponentType, string>> = {
  Panel: "JPanel",
  Button: "JButton",
  Label: "JLabel",
  TextField: "JTextField",
  PasswordField: "JPasswordField",
  TextArea: "JTextArea",
  CheckBox: "JCheckBox",
  RadioButton: "JRadioButton",
  ComboBox: "JComboBox<String>",
  List: "JList<String>",
  ProgressBar: "JProgressBar",
  Slider: "JSlider",
  Spinner: "JSpinner",
  Separator: "JSeparator",
};

export function getSwingClass(componentType: ComponentType): string {
  return SWING_CLASS_MAP[componentType] ?? "JButton";
}

export function getComponentSwingType(comp: ComponentModel): string {
  const componentType = comp.type as string;
  if (componentType === "MenuBar") return "JMenuBar";
  if (componentType === "Menu") return "JMenu";
  if (componentType === "MenuItem") return "JMenuItem";
  if (componentType === "ToolBar") return "JToolBar";
  return getSwingClass(comp.type);
}
