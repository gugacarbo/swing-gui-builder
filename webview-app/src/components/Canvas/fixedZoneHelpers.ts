import { FIXED_ZONE_GAP } from "@/components/Canvas/constants";
import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

export type ToolBarEdge = "north" | "south" | "east" | "west";

export function normalizeToolBarPosition(
  position: CanvasComponentModel["position"] | undefined,
): ToolBarEdge {
  switch (position) {
    case "north":
    case "top":
      return "north";
    case "south":
    case "bottom":
      return "south";
    case "east":
    case "right":
      return "east";
    case "west":
    case "left":
      return "west";
    default:
      return "north";
  }
}

export function getOrderedChildren(
  parent: CanvasComponentModel,
  componentsById: Map<string, CanvasComponentModel>,
  allComponents: CanvasComponentModel[],
): CanvasComponentModel[] {
  const explicitChildren = (parent.children ?? [])
    .map((childId) => componentsById.get(childId))
    .filter((child): child is CanvasComponentModel => child !== undefined);
  const explicitChildIds = new Set(explicitChildren.map((child) => child.id));
  const implicitChildren = allComponents.filter(
    (candidate) => candidate.parentId === parent.id && !explicitChildIds.has(candidate.id),
  );

  return [...explicitChildren, ...implicitChildren];
}

export function collectDescendantIds(
  parent: CanvasComponentModel,
  componentsById: Map<string, CanvasComponentModel>,
  allComponents: CanvasComponentModel[],
  collected: Set<string>,
  visiting = new Set<string>(),
): void {
  if (visiting.has(parent.id)) {
    return;
  }

  visiting.add(parent.id);
  collected.add(parent.id);

  for (const child of getOrderedChildren(parent, componentsById, allComponents)) {
    collectDescendantIds(child, componentsById, allComponents, collected, visiting);
  }

  visiting.delete(parent.id);
}

export function getStackExtent<T>(items: T[], getSize: (item: T, index: number) => number): number {
  if (items.length === 0) {
    return 0;
  }

  const size = items.reduce((total, item, index) => total + getSize(item, index), 0);
  return size + FIXED_ZONE_GAP * (items.length - 1);
}
