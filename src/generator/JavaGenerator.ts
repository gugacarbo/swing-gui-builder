import type { CanvasState, ComponentModel, ComponentType } from "../components/ComponentModel";

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

function getSwingClass(componentType: ComponentType): string {
  return SWING_CLASS_MAP[componentType] ?? "JButton";
}

const DEFAULT_BG = "#FFFFFF";
const DEFAULT_TEXT_COLOR = "#000000";
const DEFAULT_FONT_FAMILY = "Arial";
const DEFAULT_FONT_SIZE = 12;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return { r: 0, g: 0, b: 0 };
  }
  const clean = hex.replace("#", "");
  return {
    r: Number.parseInt(clean.substring(0, 2), 16),
    g: Number.parseInt(clean.substring(2, 4), 16),
    b: Number.parseInt(clean.substring(4, 6), 16),
  };
}

function isCustomComponent(comp: ComponentModel): boolean {
  return (
    comp.backgroundColor !== DEFAULT_BG ||
    comp.textColor !== DEFAULT_TEXT_COLOR ||
    comp.fontFamily !== DEFAULT_FONT_FAMILY ||
    comp.fontSize !== DEFAULT_FONT_SIZE
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function supportsTextConstructor(type: ComponentType): boolean {
  return (
    type === "Button" ||
    type === "Label" ||
    type === "TextField" ||
    type === "PasswordField" ||
    type === "TextArea" ||
    type === "CheckBox" ||
    type === "RadioButton"
  );
}

function getComponentInitCode(comp: ComponentModel, swingClass: string): string {
  if (supportsTextConstructor(comp.type) && comp.text) {
    return `    ${comp.variableName} = new ${swingClass}("${escapeJava(comp.text)}");`;
  }
  return `    ${comp.variableName} = new ${swingClass}();`;
}

function getComponentPropsCode(comp: ComponentModel): string[] {
  const lines: string[] = [];

  switch (comp.type) {
    case "CheckBox":
    case "RadioButton":
      if (typeof comp.selected === "boolean") {
        lines.push(`    ${comp.variableName}.setSelected(${comp.selected});`);
      }
      break;
    case "ComboBox": {
      const values = (comp.items ?? []).map((item) => `"${escapeJava(item)}"`).join(", ");
      lines.push(
        `    ${comp.variableName}.setModel(new DefaultComboBoxModel<>(new String[] {${values}}));`,
      );
      break;
    }
    case "List": {
      const modelName = `${comp.variableName}Model`;
      lines.push(`    DefaultListModel<String> ${modelName} = new DefaultListModel<>();`);
      for (const item of comp.items ?? []) {
        lines.push(`    ${modelName}.addElement("${escapeJava(item)}");`);
      }
      lines.push(`    ${comp.variableName}.setModel(${modelName});`);
      break;
    }
    case "ProgressBar":
    case "Slider":
      if (typeof comp.min === "number") {
        lines.push(`    ${comp.variableName}.setMinimum(${comp.min});`);
      }
      if (typeof comp.max === "number") {
        lines.push(`    ${comp.variableName}.setMaximum(${comp.max});`);
      }
      if (typeof comp.value === "number") {
        lines.push(`    ${comp.variableName}.setValue(${comp.value});`);
      }
      break;
    case "Spinner":
      lines.push(
        `    SpinnerNumberModel ${comp.variableName}NumberModel = (SpinnerNumberModel) ${comp.variableName}.getModel();`,
      );
      if (typeof comp.min === "number") {
        lines.push(`    ${comp.variableName}NumberModel.setMinimum(${comp.min});`);
      }
      if (typeof comp.max === "number") {
        lines.push(`    ${comp.variableName}NumberModel.setMaximum(${comp.max});`);
      }
      if (typeof comp.value === "number") {
        lines.push(`    ${comp.variableName}.setValue(${comp.value});`);
      }
      break;
    case "Separator": {
      const orientation =
        comp.orientation === "vertical" ? "SwingConstants.VERTICAL" : "SwingConstants.HORIZONTAL";
      lines.push(`    ${comp.variableName}.setOrientation(${orientation});`);
      break;
    }
  }

  return lines;
}

function getListenerCode(comp: ComponentModel, methodName: string): string {
  switch (comp.type) {
    case "Button":
      return `    ${comp.variableName}.addActionListener(e -> ${methodName}());`;
    case "TextField":
    case "PasswordField":
      return `    ${comp.variableName}.addActionListener(e -> ${methodName}());`;
    case "TextArea":
      return [
        `    ${comp.variableName}.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {`,
        `      public void insertUpdate(javax.swing.event.DocumentEvent e) { ${methodName}(); }`,
        `      public void removeUpdate(javax.swing.event.DocumentEvent e) { ${methodName}(); }`,
        `      public void changedUpdate(javax.swing.event.DocumentEvent e) { ${methodName}(); }`,
        "    });",
      ].join("\n");
    case "CheckBox":
      return `    ${comp.variableName}.addItemListener(e -> ${methodName}());`;
    case "RadioButton":
      return `    ${comp.variableName}.addActionListener(e -> ${methodName}());`;
    case "ComboBox":
      return `    ${comp.variableName}.addActionListener(e -> ${methodName}());`;
    case "List":
      return `    ${comp.variableName}.addListSelectionListener(e -> { if (!e.getValueIsAdjusting()) ${methodName}(); });`;
    case "Slider":
      return `    ${comp.variableName}.addChangeListener(e -> ${methodName}());`;
    case "Spinner":
      return `    ${comp.variableName}.addChangeListener(e -> ${methodName}());`;
    default:
      return "";
  }
}

function deduplicateMethodNames(components: ComponentModel[]): Map<string, string> {
  const result = new Map<string, string>();
  const usedNames = new Map<string, number>();

  for (const comp of components) {
    if (!comp.eventMethodName) continue;

    const baseName = comp.eventMethodName;
    const count = usedNames.get(baseName) || 0;

    if (count === 0) {
      result.set(comp.id, baseName);
      usedNames.set(baseName, 1);
    } else {
      const newName = `${baseName}${count + 1}`;
      result.set(comp.id, newName);
      usedNames.set(baseName, count + 1);
    }
  }

  return result;
}

export interface GeneratedFile {
  fileName: string;
  content: string;
}

export function generateJavaFiles(state: CanvasState, packageName?: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const methodNames = deduplicateMethodNames(state.components);

  // Collect all unique method stubs
  const methodStubs: string[] = [];
  const seenMethods = new Set<string>();

  for (const comp of state.components) {
    const methodName = methodNames.get(comp.id);
    if (methodName && !seenMethods.has(methodName)) {
      seenMethods.add(methodName);
      methodStubs.push(`  private void ${methodName}() {\n    // TODO: implement\n  }`);
    }
  }

  // Generate custom component classes with deterministic unique names
  const customComponents = state.components.filter(isCustomComponent);
  const customClassNames = new Map<string, string>();
  const typeCounters = new Map<string, number>();

  for (const comp of customComponents) {
    const count = (typeCounters.get(comp.type) || 0) + 1;
    typeCounters.set(comp.type, count);
    customClassNames.set(comp.id, `Custom${comp.type}${count}`);
  }

  for (const comp of customComponents) {
    const className = customClassNames.get(comp.id) as string;
    files.push(generateCustomComponentFile(comp, className, packageName));
  }

  // Generate main JFrame class
  files.push(
    generateMainFrameFile(
      state,
      methodNames,
      methodStubs,
      customComponents,
      customClassNames,
      packageName,
    ),
  );

  return files;
}

function generateCustomComponentFile(
  comp: ComponentModel,
  customClassName: string,
  packageName?: string,
): GeneratedFile {
  const swingClass = getSwingClass(comp.type);
  const lines: string[] = [];

  if (packageName) {
    lines.push(`package ${packageName};`);
    lines.push("");
  }

  lines.push("import javax.swing.*;");
  lines.push("import java.awt.*;");
  lines.push("");
  lines.push(`public class ${customClassName} extends ${swingClass} {`);
  lines.push("");
  lines.push(`  public ${customClassName}() {`);

  if (supportsTextConstructor(comp.type) && comp.text) {
    lines.push(`    super("${escapeJava(comp.text)}");`);
  } else {
    lines.push("    super();");
  }

  if (comp.backgroundColor !== DEFAULT_BG) {
    const rgb = hexToRgb(comp.backgroundColor);
    lines.push(`    setBackground(new Color(${rgb.r}, ${rgb.g}, ${rgb.b}));`);
  }

  if (comp.textColor !== DEFAULT_TEXT_COLOR) {
    const rgb = hexToRgb(comp.textColor);
    lines.push(`    setForeground(new Color(${rgb.r}, ${rgb.g}, ${rgb.b}));`);
  }

  if (comp.fontFamily !== DEFAULT_FONT_FAMILY || comp.fontSize !== DEFAULT_FONT_SIZE) {
    lines.push(
      `    setFont(new Font("${escapeJava(comp.fontFamily)}", Font.PLAIN, ${comp.fontSize}));`,
    );
  }

  lines.push("  }");
  lines.push("}");
  lines.push("");

  return {
    fileName: `${customClassName}.java`,
    content: lines.join("\n"),
  };
}

function generateMainFrameFile(
  state: CanvasState,
  methodNames: Map<string, string>,
  methodStubs: string[],
  customComponents: ComponentModel[],
  customClassNames: Map<string, string>,
  packageName?: string,
): GeneratedFile {
  const customIds = new Set(customComponents.map((c) => c.id));
  const lines: string[] = [];

  if (packageName) {
    lines.push(`package ${packageName};`);
    lines.push("");
  }

  lines.push("import javax.swing.*;");
  lines.push("import java.awt.*;");
  lines.push("");
  lines.push(`public class ${state.className} extends JFrame {`);
  lines.push("");

  // Field declarations
  for (const comp of state.components) {
    const isCustom = customIds.has(comp.id);
    const typeName = isCustom
      ? (customClassNames.get(comp.id) as string)
      : getSwingClass(comp.type);
    lines.push(`  private ${typeName} ${comp.variableName};`);
  }

  lines.push("");
  lines.push(`  public ${state.className}() {`);
  lines.push(`    setTitle("${escapeJava(state.className)}");`);
  lines.push(`    setSize(${state.frameWidth}, ${state.frameHeight});`);
  lines.push("    setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);");
  lines.push("    setLayout(null);");
  lines.push("");

  // Component initialization
  for (const comp of state.components) {
    const isCustom = customIds.has(comp.id);

    if (isCustom) {
      const customClassName = customClassNames.get(comp.id) as string;
      lines.push(`    ${comp.variableName} = new ${customClassName}();`);
    } else {
      const swingClass = getSwingClass(comp.type);
      lines.push(getComponentInitCode(comp, swingClass));
    }

    lines.push(
      `    ${comp.variableName}.setBounds(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height});`,
    );

    // For non-custom components, set colors/fonts inline
    if (!isCustom) {
      if (comp.backgroundColor !== DEFAULT_BG) {
        const rgb = hexToRgb(comp.backgroundColor);
        lines.push(
          `    ${comp.variableName}.setBackground(new Color(${rgb.r}, ${rgb.g}, ${rgb.b}));`,
        );
      }
      if (comp.textColor !== DEFAULT_TEXT_COLOR) {
        const rgb = hexToRgb(comp.textColor);
        lines.push(
          `    ${comp.variableName}.setForeground(new Color(${rgb.r}, ${rgb.g}, ${rgb.b}));`,
        );
      }
      if (comp.fontFamily !== DEFAULT_FONT_FAMILY || comp.fontSize !== DEFAULT_FONT_SIZE) {
        lines.push(
          `    ${comp.variableName}.setFont(new Font("${escapeJava(comp.fontFamily)}", Font.PLAIN, ${comp.fontSize}));`,
        );
      }
    }

    lines.push(...getComponentPropsCode(comp));

    // Event listener
    const methodName = methodNames.get(comp.id);
    if (methodName) {
      lines.push(getListenerCode(comp, methodName));
    }

    lines.push(`    add(${comp.variableName});`);
    lines.push("");
  }

  lines.push("    setLocationRelativeTo(null);");
  lines.push("  }");

  // Method stubs
  if (methodStubs.length > 0) {
    lines.push("");
    for (const stub of methodStubs) {
      lines.push(stub);
      lines.push("");
    }
  }

  // Main method
  lines.push("  public static void main(String[] args) {");
  lines.push("    SwingUtilities.invokeLater(() -> {");
  lines.push(`      ${state.className} frame = new ${state.className}();`);
  lines.push("      frame.setVisible(true);");
  lines.push("    });");
  lines.push("  }");
  lines.push("}");
  lines.push("");

  return {
    fileName: `${state.className}.java`,
    content: lines.join("\n"),
  };
}

function escapeJava(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}
