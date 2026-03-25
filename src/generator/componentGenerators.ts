import type { ComponentModel } from "../components/ComponentModel";
import { isMenuBarComponent, isToolBarComponent } from "../utils/ComponentPredicates";
import { sortRegularComponentsForGeneration } from "./ComponentCodeGenerator";
import { generateMenuBar, getOrderedChildren } from "./MenuCodeGenerator";
import { generateToolBar } from "./ToolBarCodeGenerator";

// Re-export for backward compatibility
export { generateComponentCode } from "./ComponentCodeGenerator";

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
