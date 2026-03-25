import type { ComponentModel } from "../components/ComponentModel";
import {
  isMenuBarComponent,
  isPanelComponent,
  isToolBarComponent,
} from "../utils/ComponentPredicates";
import {
  applyInlineStyleCode,
  getComponentInitCode,
  getComponentPropsCode,
  getListenerCode,
} from "./codeHelpers";
import { generateMenuBar, getOrderedChildren } from "./MenuCodeGenerator";
import { getComponentSwingType } from "./swingMappings";
import { generateToolBar } from "./ToolBarCodeGenerator";

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

function hasPanelChildren(panel: ComponentModel, allComponents: ComponentModel[]): boolean {
  if (!isPanelComponent(panel)) {
    return false;
  }

  if ((panel.children?.length ?? 0) > 0) {
    return true;
  }

  return allComponents.some((candidate) => candidate.parentId === panel.id);
}

function sortRegularComponentsForGeneration(regularComponents: ComponentModel[]): ComponentModel[] {
  const componentMap = new Map(regularComponents.map((component) => [component.id, component]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const ordered: ComponentModel[] = [];

  const visit = (component: ComponentModel): void => {
    if (visited.has(component.id)) {
      return;
    }

    if (visiting.has(component.id)) {
      return;
    }

    visiting.add(component.id);

    if (component.parentId) {
      const parent = componentMap.get(component.parentId);
      if (parent) {
        visit(parent);
      }
    }

    visiting.delete(component.id);
    visited.add(component.id);
    ordered.push(component);
  };

  for (const component of regularComponents) {
    visit(component);
  }

  return ordered;
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

  return {
    menuBars,
    regularComponents: sortRegularComponentsForGeneration(regularComponents),
    toolBars,
    menuBarLines,
    toolBarLines,
  };
}

function resolvePanelParent(
  comp: ComponentModel,
  componentMap: Map<string, ComponentModel>,
): ComponentModel | undefined {
  if (!comp.parentId) {
    return undefined;
  }

  const parent = componentMap.get(comp.parentId);
  if (!parent || parent.id === comp.id || !isPanelComponent(parent)) {
    return undefined;
  }

  return parent;
}

export function generateComponentCode(
  comp: ComponentModel,
  customIds: Set<string>,
  customClassNames: Map<string, string>,
  methodNames: Map<string, string>,
  hasToolBars: boolean,
  componentMap: Map<string, ComponentModel>,
  allComponents: ComponentModel[],
): string[] {
  const lines: string[] = [];
  const isCustom = customIds.has(comp.id);
  const panelParent = resolvePanelParent(comp, componentMap);
  const boundsX = panelParent && comp.parentOffset ? comp.parentOffset.x : comp.x;
  const boundsY = panelParent && comp.parentOffset ? comp.parentOffset.y : comp.y;

  if (isCustom) {
    const customClassName = customClassNames.get(comp.id) as string;
    lines.push(`    ${comp.variableName} = new ${customClassName}();`);
  } else {
    lines.push(getComponentInitCode(comp, getComponentSwingType(comp)));
  }

  lines.push(
    `    ${comp.variableName}.setBounds(${boundsX}, ${boundsY}, ${comp.width}, ${comp.height});`,
  );

  if (hasPanelChildren(comp, allComponents)) {
    lines.push(`    ${comp.variableName}.setLayout(null);`);
  }

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

  const addTarget = panelParent?.variableName ?? (hasToolBars ? "canvasPanel" : "this");
  lines.push(`    ${addTarget}.add(${comp.variableName});`);
  lines.push("");

  return lines;
}
