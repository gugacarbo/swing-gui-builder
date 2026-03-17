import type { CanvasState, ComponentModel } from "../components/ComponentModel";
import {
  DEFAULT_BG,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
  applyInlineStyleCode,
  escapeJava,
  getComponentInitCode,
  getComponentPropsCode,
  getListenerCode,
  hexToRgb,
  isCustomComponent,
  supportsTextConstructor,
} from "./codeHelpers";
import { getComponentSwingType, getSwingClass } from "./swingMappings";

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

export { hexToRgb };

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
