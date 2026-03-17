export const SWING_TYPE_LABELS: Readonly<Record<string, string>> = {
  Panel: "JPanel",
  Button: "JButton",
  Label: "JLabel",
  TextField: "JTextField",
  PasswordField: "JPasswordField",
  TextArea: "JTextArea",
  CheckBox: "JCheckBox",
  RadioButton: "JRadioButton",
  ComboBox: "JComboBox",
  List: "JList",
  ProgressBar: "JProgressBar",
  Slider: "JSlider",
  Spinner: "JSpinner",
  Separator: "JSeparator",
  MenuBar: "JMenuBar",
  JMenuBar: "JMenuBar",
  Menu: "JMenu",
  JMenu: "JMenu",
  MenuItem: "JMenuItem",
  JMenuItem: "JMenuItem",
};

export function toSwingTypeLabel(type: string): string {
  if (type in SWING_TYPE_LABELS) {
    return SWING_TYPE_LABELS[type];
  }

  return type.startsWith("J") ? type : `J${type}`;
}
