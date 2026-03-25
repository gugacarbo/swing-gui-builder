import type { ComponentModel } from "../components/ComponentModel";
import { isMenuComponent, isMenuItemComponent } from "../utils/ComponentPredicates";
import { escapeJava } from "./codeHelpers";

/**
 * Gets ordered children for a parent component.
 * First tries to use the children array, then falls back to filtering by parentId.
 */
export function getOrderedChildren(
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

/**
 * Generates code for menu children recursively.
 * Handles JMenu (nested menus) and JMenuItem components.
 */
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

/**
 * Generates code for a JMenuBar component and its children.
 * @param menuBar The menu bar component
 * @param componentMap Map of all components by ID
 * @param allComponents All components in the canvas
 * @param methodNames Map of component IDs to event method names
 * @returns Array of code lines for the menu bar
 */
export function generateMenuBar(
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
