import type { ComponentModel } from "../components/ComponentModel";
import {
  applyInlineStyleCode,
  escapeJava,
  getComponentInitCode,
  getComponentPropsCode,
  getListenerCode,
} from "./codeHelpers";
import { getComponentSwingType } from "./swingMappings";

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

export interface HierarchicalCodeResult {
  menuBars: ComponentModel[];
  regularComponents: ComponentModel[];
  toolBars: ComponentModel[];
  menuBarLines: string[];
  toolBarLines: string[];
}

export function generateHierarchicalCode(
  components: ComponentModel[],
  customIds: Set<string>,
  customClassNames: Map<string, string>,
  methodNames: Map<string, string>,
): HierarchicalCodeResult {
  const componentMap = new Map(components.map((comp) => [comp.id, comp]));
  const { menuBars, regularComponents, toolBars } = partitionComponentsByGenerationPhase(
    components,
    componentMap,
  );

  const menuBarLines: string[] = [];
  for (const menuBar of menuBars) {
    menuBarLines.push(...generateMenuBar(menuBar, componentMap, components, methodNames));
  }

  const toolBarLines: string[] = [];
  for (const toolBar of toolBars) {
    toolBarLines.push(
      ...generateToolBar(
        toolBar,
        componentMap,
        components,
        customIds,
        customClassNames,
        methodNames,
      ),
    );
  }

  return { menuBars, regularComponents, toolBars, menuBarLines, toolBarLines };
}

export function generateComponentCode(
  comp: ComponentModel,
  customIds: Set<string>,
  customClassNames: Map<string, string>,
  methodNames: Map<string, string>,
  hasToolBars: boolean,
): string[] {
  const lines: string[] = [];
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

  if (!isCustom) {
    applyInlineStyleCode(lines, comp);
  }

  lines.push(...getComponentPropsCode(comp));

  const methodName = methodNames.get(comp.id);
  if (methodName) {
    const listenerCode = getListenerCode(comp, methodName);
    if (listenerCode) {
      lines.push(listenerCode);
    }
  }

  lines.push(`    ${hasToolBars ? "canvasPanel" : "this"}.add(${comp.variableName});`);
  lines.push("");

  return lines;
}
