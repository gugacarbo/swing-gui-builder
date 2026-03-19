import type { CanvasState, ComponentModel } from "../components/ComponentModel";
import {
  DEFAULT_BG,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
  escapeJava,
  hexToRgb,
  isCustomComponent,
  supportsTextConstructor,
} from "./codeHelpers";
import { generateComponentCode, generateHierarchicalCode } from "./componentGenerators";
import { getComponentSwingType, getSwingClass } from "./swingMappings";

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

export interface GeneratedFile {
  fileName: string;
  content: string;
}

export interface GeneratedFileWithPath {
  fileName: string;
  content: string;
  subfolder?: string;
}

/**
 * Combines the base package name with a subfolder path to form the full package.
 * Example: ("com.example", "parent/child") => "com.example.parent.child"
 */
function combinePackageWithSubfolder(
  packageName: string | undefined,
  subfolder: string | undefined,
): string | undefined {
  if (!packageName && !subfolder) {
    return undefined;
  }

  const subfolderAsPackage = subfolder?.replace(/[/\\]/g, ".");

  if (!packageName) {
    return subfolderAsPackage;
  }

  if (!subfolderAsPackage) {
    return packageName;
  }

  return `${packageName}.${subfolderAsPackage}`;
}

export function getParentFolder(
  comp: ComponentModel,
  allComponents: ComponentModel[],
): string | undefined {
  const componentMap = new Map(allComponents.map((component) => [component.id, component]));
  const pathSegments: string[] = [];
  const visitedParentIds = new Set<string>();
  let currentParentId = comp.parentId;

  while (currentParentId) {
    if (visitedParentIds.has(currentParentId)) {
      break;
    }

    visitedParentIds.add(currentParentId);
    const parent = componentMap.get(currentParentId);
    if (!parent) {
      break;
    }

    pathSegments.unshift(parent.variableName);
    currentParentId = parent.parentId;
  }

  return pathSegments.length > 0 ? pathSegments.join("/") : undefined;
}

export function generateJavaFiles(
  state: CanvasState,
  packageName?: string,
): GeneratedFileWithPath[] {
  const files: GeneratedFileWithPath[] = [];
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
    files.push(
      generateCustomComponentFile(
        comp,
        className,
        packageName,
        getParentFolder(comp, state.components),
      ),
    );
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
  subfolder?: string,
): GeneratedFileWithPath {
  const swingClass = getSwingClass(comp.type);
  const lines: string[] = [];

  const fullPackage = combinePackageWithSubfolder(packageName, subfolder);
  if (fullPackage) {
    lines.push(`package ${fullPackage};`);
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
    subfolder,
  };
}

function generateMainFrameFile(
  state: CanvasState,
  methodNames: Map<string, string>,
  methodStubs: string[],
  customComponents: ComponentModel[],
  customClassNames: Map<string, string>,
  packageName?: string,
): GeneratedFileWithPath {
  const customIds = new Set(customComponents.map((c) => c.id));
  const { menuBars, regularComponents, toolBars, menuBarLines, toolBarLines } =
    generateHierarchicalCode(state.components, customIds, customClassNames, methodNames);
  const hasToolBars = toolBars.length > 0;
  const componentMap = new Map(state.components.map((component) => [component.id, component]));
  const lines: string[] = [];
  const frameTitle = state.frameTitle ?? state.className;

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
  lines.push(`    setTitle("${escapeJava(frameTitle)}");`);
  lines.push(`    setSize(${state.frameWidth}, ${state.frameHeight});`);
  lines.push("    setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);");
  if (state.backgroundColor && state.backgroundColor !== DEFAULT_BG) {
    const rgb = hexToRgb(state.backgroundColor);
    lines.push(`    getContentPane().setBackground(new Color(${rgb.r}, ${rgb.g}, ${rgb.b}));`);
  }
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

  lines.push(...menuBarLines);

  // Component initialization
  for (const comp of regularComponents) {
    lines.push(
      ...generateComponentCode(
        comp,
        customIds,
        customClassNames,
        methodNames,
        hasToolBars,
        componentMap,
        state.components,
      ),
    );
  }

  lines.push(...toolBarLines);

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
