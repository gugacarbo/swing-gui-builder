import type { CanvasState, ComponentModel, ComponentType } from "../components/ComponentModel";

const SWING_CLASS_MAP: Record<ComponentType, string> = {
  Button: "JButton",
  Label: "JLabel",
  TextField: "JTextField",
  PasswordField: "JPasswordField",
  TextArea: "JTextArea",
};

const DEFAULT_BG = "#FFFFFF";
const DEFAULT_TEXT_COLOR = "#000000";
const DEFAULT_FONT_FAMILY = "Arial";
const DEFAULT_FONT_SIZE = 12;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
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

export function generateJavaFiles(state: CanvasState): GeneratedFile[] {
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

  // Generate custom component classes
  const customComponents = state.components.filter(isCustomComponent);
  for (const comp of customComponents) {
    files.push(generateCustomComponentFile(comp));
  }

  // Generate main JFrame class
  files.push(generateMainFrameFile(state, methodNames, methodStubs, customComponents));

  return files;
}

function generateCustomComponentFile(comp: ComponentModel): GeneratedFile {
  const swingClass = SWING_CLASS_MAP[comp.type];
  const customClassName = capitalize(comp.variableName);
  const lines: string[] = [];

  lines.push("import javax.swing.*;");
  lines.push("import java.awt.*;");
  lines.push("");
  lines.push(`public class ${customClassName} extends ${swingClass} {`);
  lines.push("");
  lines.push(`  public ${customClassName}() {`);

  if (comp.text) {
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
): GeneratedFile {
  const customIds = new Set(customComponents.map((c) => c.id));
  const lines: string[] = [];

  lines.push("import javax.swing.*;");
  lines.push("import java.awt.*;");
  lines.push("");
  lines.push(`public class ${state.className} extends JFrame {`);
  lines.push("");

  // Field declarations
  for (const comp of state.components) {
    const isCustom = customIds.has(comp.id);
    const typeName = isCustom ? capitalize(comp.variableName) : SWING_CLASS_MAP[comp.type];
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
      const customClassName = capitalize(comp.variableName);
      lines.push(`    ${comp.variableName} = new ${customClassName}();`);
    } else {
      const swingClass = SWING_CLASS_MAP[comp.type];
      if (comp.text) {
        lines.push(`    ${comp.variableName} = new ${swingClass}("${escapeJava(comp.text)}");`);
      } else {
        lines.push(`    ${comp.variableName} = new ${swingClass}();`);
      }
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
