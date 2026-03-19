import type { ComponentModel, ComponentType } from "../components/ComponentModel";

export const DEFAULT_BG = "#FFFFFF";
export const DEFAULT_TEXT_COLOR = "#000000";
export const DEFAULT_FONT_FAMILY = "Arial";
export const DEFAULT_FONT_SIZE = 12;

function getComponentType(comp: ComponentModel): string {
  return comp.type as string;
}

function isMenuBarComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "MenuBar";
}

function isMenuComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "Menu";
}

function isMenuItemComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "MenuItem";
}

function isToolBarComponent(comp: ComponentModel): boolean {
  return getComponentType(comp) === "ToolBar";
}

function isHierarchicalMenuComponent(comp: ComponentModel): boolean {
  return isMenuBarComponent(comp) || isMenuComponent(comp) || isMenuItemComponent(comp);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
    return { r: 0, g: 0, b: 0 };
  }
  const raw = hex.replace("#", "");
  const clean =
    raw.length === 3 ? raw.split("").map((channel) => `${channel}${channel}`).join("") : raw;
  return {
    r: Number.parseInt(clean.substring(0, 2), 16),
    g: Number.parseInt(clean.substring(2, 4), 16),
    b: Number.parseInt(clean.substring(4, 6), 16),
  };
}

export function isCustomComponent(comp: ComponentModel): boolean {
  if (isHierarchicalMenuComponent(comp) || isToolBarComponent(comp)) {
    return false;
  }

  return (
    comp.backgroundColor !== DEFAULT_BG ||
    comp.textColor !== DEFAULT_TEXT_COLOR ||
    comp.fontFamily !== DEFAULT_FONT_FAMILY ||
    comp.fontSize !== DEFAULT_FONT_SIZE
  );
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function escapeJava(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

export function supportsTextConstructor(type: ComponentType): boolean {
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

export function getComponentInitCode(comp: ComponentModel, swingClass: string): string {
  if (supportsTextConstructor(comp.type) && comp.text) {
    return `    ${comp.variableName} = new ${swingClass}("${escapeJava(comp.text)}");`;
  }
  return `    ${comp.variableName} = new ${swingClass}();`;
}

export function getComponentPropsCode(comp: ComponentModel): string[] {
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

export function getListenerCode(comp: ComponentModel, methodName: string): string {
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

export function applyInlineStyleCode(lines: string[], comp: ComponentModel): void {
  if (comp.backgroundColor !== DEFAULT_BG) {
    const rgb = hexToRgb(comp.backgroundColor);
    lines.push(`    ${comp.variableName}.setBackground(new Color(${rgb.r}, ${rgb.g}, ${rgb.b}));`);
  }
  if (comp.textColor !== DEFAULT_TEXT_COLOR) {
    const rgb = hexToRgb(comp.textColor);
    lines.push(`    ${comp.variableName}.setForeground(new Color(${rgb.r}, ${rgb.g}, ${rgb.b}));`);
  }
  if (comp.fontFamily !== DEFAULT_FONT_FAMILY || comp.fontSize !== DEFAULT_FONT_SIZE) {
    lines.push(
      `    ${comp.variableName}.setFont(new Font("${escapeJava(comp.fontFamily)}", Font.PLAIN, ${comp.fontSize}));`,
    );
  }
}
