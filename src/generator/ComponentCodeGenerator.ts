import type { ComponentModel } from "../components/ComponentModel";
import { isPanelComponent } from "../utils/ComponentPredicates";
import {
  applyInlineStyleCode,
  getComponentInitCode,
  getComponentPropsCode,
  getListenerCode,
} from "./codeHelpers";
import { getComponentSwingType } from "./swingMappings";

/**
 * Checks if a panel component has children.
 * Used to determine if a panel needs layout set to null.
 */
function hasPanelChildren(panel: ComponentModel, allComponents: ComponentModel[]): boolean {
  if (!isPanelComponent(panel)) {
    return false;
  }

  if ((panel.children?.length ?? 0) > 0) {
    return true;
  }

  return allComponents.some((candidate) => candidate.parentId === panel.id);
}

/**
 * Sorts regular components in topological order for generation.
 * Ensures parent components are generated before their children.
 * @param regularComponents - Array of components to sort
 * @returns Sorted array with parents before children
 */
export function sortRegularComponentsForGeneration(
  regularComponents: ComponentModel[],
): ComponentModel[] {
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

/**
 * Resolves the panel parent of a component if it exists.
 * Used to determine if a component should be added to a panel instead of the main container.
 */
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

/**
 * Generates Java code for a single component.
 * @param comp - Component to generate code for
 * @param customIds - Set of component IDs with custom classes
 * @param customClassNames - Map of component IDs to custom class names
 * @param methodNames - Map of component IDs to event handler method names
 * @param hasToolBars - Whether the canvas has toolbars (affects container target)
 * @param componentMap - Map of all components by ID
 * @param allComponents - Array of all components
 * @returns Array of code lines for the component
 */
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
