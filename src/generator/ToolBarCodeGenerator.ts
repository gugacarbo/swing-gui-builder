import type { ComponentModel } from "../components/ComponentModel";
import {
  applyInlineStyleCode,
  getComponentInitCode,
  getComponentPropsCode,
  getListenerCode,
} from "./codeHelpers";
import { getOrderedChildren } from "./MenuCodeGenerator";
import { getComponentSwingType } from "./swingMappings";

/**
 * Determines the toolbar position for BorderLayout based on component position.
 * @param comp - The toolbar component
 * @returns The BorderLayout position constant
 */
export function getToolBarBorderPosition(comp: ComponentModel): string {
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

/**
 * Generates Java code for a JToolBar and its children.
 * @param toolBar - The toolbar component
 * @param componentMap - Map of all components by ID
 * @param allComponents - All components in the canvas
 * @param customIds - Set of component IDs that use custom classes
 * @param customClassNames - Map of component IDs to custom class names
 * @param methodNames - Map of component IDs to event method names
 * @returns Array of Java code lines
 */
export function generateToolBar(
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
