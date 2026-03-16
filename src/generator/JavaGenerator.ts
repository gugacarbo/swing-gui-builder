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

function getComponentSwingType(comp: ComponentModel): string {
  if (isMenuBarComponent(comp)) return "JMenuBar";
  if (isMenuComponent(comp)) return "JMenu";
  if (isMenuItemComponent(comp)) return "JMenuItem";
  if (isToolBarComponent(comp)) return "JToolBar";
  return getSwingClass(comp.type);
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

function getOrderedChildren(
  parent: ComponentModel,
  componentMap: Map<string, ComponentModel>,
  allComponents: ComponentModel[],
): ComponentModel[] {
  const orderedByParent = (parent.children ?? [])
    .map((childId) => componentMap.get(childId))
    .filter((comp): comp is ComponentModel => Boolean(comp));

  if (orderedByParent.length > 0) {
    return orderedByParent;
  }

  return allComponents.filter((comp) => comp.parentId === parent.id);
}

function collectDescendantIds(
  parent: ComponentModel,
  componentMap: Map<string, ComponentModel>,
  allComponents: ComponentModel[],
  visited: Set<string>,
): void {
  if (visited.has(parent.id)) {
    return;
  }

  visited.add(parent.id);

  for (const child of getOrderedChildren(parent, componentMap, allComponents)) {
    collectDescendantIds(child, componentMap, allComponents, visited);
  }
}

function applyInlineStyleCode(lines: string[], comp: ComponentModel): void {
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

function getToolBarBorderPosition(comp: ComponentModel): string {
  switch (comp.position) {
    case "bottom":
      return "BorderLayout.SOUTH";
    case "left":
      return "BorderLayout.WEST";
    case "right":
      return "BorderLayout.EAST";
    default:
      return "BorderLayout.NORTH";
  }
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

export function generatePreviewJavaFiles(
  state: CanvasState,
  packageName?: string,
): GeneratedFile[] {
  return generateJavaFiles(state, packageName).map((file) => ({
    fileName: file.fileName,
    content: file.content,
  }));
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

function generateMenuChildrenCode(
  parent: ComponentModel,
  componentMap: Map<string, ComponentModel>,
  allComponents: ComponentModel[],
  methodNames: Map<string, string>,
  generatedIds: Set<string>,
  lines: string[],
): void {
  for (const child of getOrderedChildren(parent, componentMap, allComponents)) {
    if (isMenuComponent(child)) {
      if (!generatedIds.has(child.id)) {
        lines.push(`    ${child.variableName} = new JMenu("${escapeJava(child.text)}");`);
        generatedIds.add(child.id);
      }
      generateMenuChildrenCode(
        child,
        componentMap,
        allComponents,
        methodNames,
        generatedIds,
        lines,
      );
      lines.push(`    ${parent.variableName}.add(${child.variableName});`);
      continue;
    }

    if (isMenuItemComponent(child)) {
      if (!generatedIds.has(child.id)) {
        lines.push(`    ${child.variableName} = new JMenuItem("${escapeJava(child.text)}");`);
        const methodName = methodNames.get(child.id);
        if (methodName) {
          lines.push(`    ${child.variableName}.addActionListener(e -> ${methodName}());`);
        }
        generatedIds.add(child.id);
      }
      lines.push(`    ${parent.variableName}.add(${child.variableName});`);
    }
  }
}

function generateMenuBar(
  menuBar: ComponentModel,
  componentMap: Map<string, ComponentModel>,
  allComponents: ComponentModel[],
  methodNames: Map<string, string>,
): string[] {
  const lines: string[] = [`    ${menuBar.variableName} = new JMenuBar();`];
  const generatedIds = new Set<string>([menuBar.id]);

  generateMenuChildrenCode(menuBar, componentMap, allComponents, methodNames, generatedIds, lines);
  lines.push(`    frame.setJMenuBar(${menuBar.variableName});`);
  lines.push("");

  return lines;
}

function generateToolBar(
  toolBar: ComponentModel,
  componentMap: Map<string, ComponentModel>,
  allComponents: ComponentModel[],
  customIds: Set<string>,
  customClassNames: Map<string, string>,
  methodNames: Map<string, string>,
): string[] {
  const orientation =
    toolBar.orientation === "vertical" ? "JToolBar.VERTICAL" : "JToolBar.HORIZONTAL";
  const lines: string[] = [
    `    ${toolBar.variableName} = new JToolBar();`,
    `    ${toolBar.variableName}.setOrientation(${orientation});`,
  ];
  applyInlineStyleCode(lines, toolBar);

  for (const child of getOrderedChildren(toolBar, componentMap, allComponents)) {
    const isCustom = customIds.has(child.id);
    if (isCustom) {
      const customClassName = customClassNames.get(child.id) as string;
      lines.push(`    ${child.variableName} = new ${customClassName}();`);
    } else {
      lines.push(getComponentInitCode(child, getComponentSwingType(child)));
      applyInlineStyleCode(lines, child);
    }

    lines.push(...getComponentPropsCode(child));

    const methodName = methodNames.get(child.id);
    if (methodName) {
      const listenerCode = getListenerCode(child, methodName);
      if (listenerCode) {
        lines.push(listenerCode);
      }
    }

    lines.push(`    ${toolBar.variableName}.add(${child.variableName});`);
  }

  lines.push(
    `    getContentPane().add(${toolBar.variableName}, ${getToolBarBorderPosition(toolBar)});`,
  );
  lines.push("");

  return lines;
}

function partitionComponentsByGenerationPhase(
  components: ComponentModel[],
  componentMap: Map<string, ComponentModel>,
): {
  menuBars: ComponentModel[];
  regularComponents: ComponentModel[];
  toolBars: ComponentModel[];
} {
  const menuBars = components.filter(isMenuBarComponent);
  const toolBars = components.filter(isToolBarComponent);

  const menuComponentIds = new Set<string>();
  for (const menuBar of menuBars) {
    collectDescendantIds(menuBar, componentMap, components, menuComponentIds);
  }

  const toolBarChildIds = new Set<string>();
  for (const toolBar of toolBars) {
    for (const child of getOrderedChildren(toolBar, componentMap, components)) {
      toolBarChildIds.add(child.id);
    }
  }

  const regularComponents = components.filter(
    (comp) =>
      !menuComponentIds.has(comp.id) && !isToolBarComponent(comp) && !toolBarChildIds.has(comp.id),
  );

  return { menuBars, regularComponents, toolBars };
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
  const componentMap = new Map(state.components.map((comp) => [comp.id, comp]));
  const { menuBars, regularComponents, toolBars } = partitionComponentsByGenerationPhase(
    state.components,
    componentMap,
  );
  const hasToolBars = toolBars.length > 0;
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
      : getComponentSwingType(comp);
    lines.push(`  private ${typeName} ${comp.variableName};`);
  }

  lines.push("");
  lines.push(`  public ${state.className}() {`);
  lines.push(`    setTitle("${escapeJava(state.className)}");`);
  lines.push(`    setSize(${state.frameWidth}, ${state.frameHeight});`);
  lines.push("    setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);");
  if (menuBars.length > 0) {
    lines.push("    JFrame frame = this;");
  }
  if (hasToolBars) {
    lines.push("    getContentPane().setLayout(new BorderLayout());");
    lines.push("    JPanel canvasPanel = new JPanel(null);");
    lines.push("    getContentPane().add(canvasPanel, BorderLayout.CENTER);");
  } else {
    lines.push("    setLayout(null);");
  }
  lines.push("");

  for (const menuBar of menuBars) {
    lines.push(...generateMenuBar(menuBar, componentMap, state.components, methodNames));
  }

  // Component initialization
  for (const comp of regularComponents) {
    const isCustom = customIds.has(comp.id);

    if (isCustom) {
      const customClassName = customClassNames.get(comp.id) as string;
      lines.push(`    ${comp.variableName} = new ${customClassName}();`);
    } else {
      lines.push(getComponentInitCode(comp, getComponentSwingType(comp)));
    }

    lines.push(
      `    ${comp.variableName}.setBounds(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height});`,
    );

    // For non-custom components, set colors/fonts inline
    if (!isCustom) {
      applyInlineStyleCode(lines, comp);
    }

    lines.push(...getComponentPropsCode(comp));

    // Event listener
    const methodName = methodNames.get(comp.id);
    if (methodName) {
      const listenerCode = getListenerCode(comp, methodName);
      if (listenerCode) {
        lines.push(listenerCode);
      }
    }

    lines.push(`    ${hasToolBars ? "canvasPanel" : "this"}.add(${comp.variableName});`);
    lines.push("");
  }

  for (const toolBar of toolBars) {
    lines.push(
      ...generateToolBar(
        toolBar,
        componentMap,
        state.components,
        customIds,
        customClassNames,
        methodNames,
      ),
    );
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
