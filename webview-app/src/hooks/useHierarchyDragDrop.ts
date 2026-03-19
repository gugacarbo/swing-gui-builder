import { useCallback, useMemo, useState } from "react";

import type { CanvasComponent } from "@/types/canvas";

const HIERARCHY_DRAG_DATA_MIME = "application/x-swing-hierarchy-component";

type HierarchyType = "MenuBar" | "Menu" | "MenuItem" | "Panel" | "ToolBar" | "Other";
export type HierarchyDropPosition = "before" | "after" | "inside";

interface HierarchyDropInstruction {
  parentId: string | null;
  index: number;
}

export interface HierarchyDropTarget {
  componentId: string;
  position: HierarchyDropPosition;
}

export interface UseHierarchyDragDropOptions {
  components: CanvasComponent[];
  onMoveComponent: (componentId: string, parentId: string | null, index: number) => void;
}

export interface UseHierarchyDragDropResult {
  draggingComponentId: string | null;
  dropTarget: HierarchyDropTarget | null;
  isDraggableComponent: (componentId: string) => boolean;
  handleDragStart: (event: React.DragEvent<HTMLElement>, componentId: string) => void;
  handleDragOver: (event: React.DragEvent<HTMLElement>, targetComponentId: string) => void;
  handleDrop: (event: React.DragEvent<HTMLElement>, targetComponentId: string) => void;
  handleDragEnd: () => void;
}

function toHierarchyType(type: string): HierarchyType {
  switch (type) {
    case "MenuBar":
    case "JMenuBar":
      return "MenuBar";
    case "Menu":
    case "JMenu":
      return "Menu";
    case "MenuItem":
    case "JMenuItem":
      return "MenuItem";
    case "Panel":
    case "JPanel":
      return "Panel";
    case "ToolBar":
    case "JToolBar":
      return "ToolBar";
    default:
      return "Other";
  }
}

function isMovableType(type: HierarchyType): boolean {
  return type !== "MenuBar" && type !== "ToolBar";
}

function canBeRoot(type: HierarchyType): boolean {
  return type !== "Menu" && type !== "MenuItem";
}

function areEqualLists(first: readonly string[], second: readonly string[]): boolean {
  if (first.length !== second.length) {
    return false;
  }

  for (let index = 0; index < first.length; index += 1) {
    if (first[index] !== second[index]) {
      return false;
    }
  }

  return true;
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}

function getDraggingId(dataTransfer: DataTransfer): string | null {
  const dragId =
    dataTransfer.getData(HIERARCHY_DRAG_DATA_MIME) || dataTransfer.getData("text/plain");
  const trimmedDragId = dragId.trim();
  return trimmedDragId.length > 0 ? trimmedDragId : null;
}

function resolveParentId(
  componentId: string,
  components: CanvasComponent[],
  componentsById: Map<string, CanvasComponent>,
): string | null {
  const component = componentsById.get(componentId);
  if (component?.parentId && componentsById.has(component.parentId)) {
    return component.parentId;
  }

  const explicitParent = components.find((candidate) =>
    (candidate.children ?? []).includes(componentId),
  );
  return explicitParent?.id ?? null;
}

function getOrderedChildIds(
  parentId: string,
  components: CanvasComponent[],
  componentsById: Map<string, CanvasComponent>,
): string[] {
  const parent = componentsById.get(parentId);
  if (!parent) {
    return [];
  }

  const explicitChildren: string[] = [];
  for (const childId of parent.children ?? []) {
    if (componentsById.has(childId) && !explicitChildren.includes(childId)) {
      explicitChildren.push(childId);
    }
  }

  const explicitChildIds = new Set(explicitChildren);
  const implicitChildren = components
    .filter((candidate) => candidate.parentId === parentId && !explicitChildIds.has(candidate.id))
    .map((candidate) => candidate.id);

  return [...explicitChildren, ...implicitChildren];
}

function getOrderedRootIds(
  components: CanvasComponent[],
  componentsById: Map<string, CanvasComponent>,
): string[] {
  const rootIds: string[] = [];
  const seen = new Set<string>();

  for (const component of components) {
    if (seen.has(component.id)) {
      continue;
    }

    if (resolveParentId(component.id, components, componentsById) === null) {
      rootIds.push(component.id);
      seen.add(component.id);
    }
  }

  return rootIds;
}

function resolveDropPosition(event: React.DragEvent<HTMLElement>): "before" | "after" {
  const targetBounds = event.currentTarget.getBoundingClientRect();
  return event.clientY >= targetBounds.top + targetBounds.height / 2 ? "after" : "before";
}

function canAcceptChildType(parentType: HierarchyType, childType: HierarchyType): boolean {
  if (childType === "MenuBar" || childType === "ToolBar") {
    return false;
  }

  switch (parentType) {
    case "MenuBar":
      return childType === "Menu";
    case "Menu":
      return childType === "Menu" || childType === "MenuItem";
    case "Panel":
      return childType !== "Menu" && childType !== "MenuItem";
    case "ToolBar":
      return childType !== "Panel" && childType !== "Menu" && childType !== "MenuItem";
    default:
      return false;
  }
}

function canMoveToParent(childType: HierarchyType, parentType: HierarchyType | null): boolean {
  if (parentType === null) {
    return canBeRoot(childType);
  }

  return canAcceptChildType(parentType, childType);
}

function isAssignedToParent(component: CanvasComponent, parentId: string | null): boolean {
  return parentId === null ? component.parentId == null : component.parentId === parentId;
}

function wouldCreateCycle(
  draggedComponentId: string,
  targetParentId: string,
  components: CanvasComponent[],
  componentsById: Map<string, CanvasComponent>,
): boolean {
  if (draggedComponentId === targetParentId) {
    return true;
  }

  const visited = new Set<string>([draggedComponentId]);
  const queue = [draggedComponentId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }

    for (const childId of getOrderedChildIds(currentId, components, componentsById)) {
      if (childId === targetParentId) {
        return true;
      }

      if (visited.has(childId)) {
        continue;
      }

      visited.add(childId);
      queue.push(childId);
    }
  }

  return false;
}

function shouldForceInsideDrop(draggedType: HierarchyType, targetType: HierarchyType): boolean {
  return (
    (draggedType === "MenuItem" && targetType === "Menu") ||
    (draggedType === "Menu" && targetType === "MenuBar")
  );
}

function getDropPositionCandidates(
  event: React.DragEvent<HTMLElement>,
  draggedType: HierarchyType,
  targetType: HierarchyType,
  allowInside: boolean,
): HierarchyDropPosition[] {
  if (shouldForceInsideDrop(draggedType, targetType)) {
    return ["inside"];
  }

  if (!allowInside) {
    return [resolveDropPosition(event)];
  }

  const targetBounds = event.currentTarget.getBoundingClientRect();
  const offsetY = event.clientY - targetBounds.top;
  const topThreshold = targetBounds.height * 0.25;
  const bottomThreshold = targetBounds.height * 0.75;

  if (offsetY <= topThreshold) {
    return ["before", "inside", "after"];
  }

  if (offsetY >= bottomThreshold) {
    return ["after", "inside", "before"];
  }

  return ["inside", "before", "after"];
}

function resolveDropInstruction(
  draggedComponentId: string,
  targetComponentId: string,
  dropPosition: HierarchyDropPosition,
  components: CanvasComponent[],
  componentsById: Map<string, CanvasComponent>,
): HierarchyDropInstruction | null {
  if (draggedComponentId === targetComponentId) {
    return null;
  }

  const draggedComponent = componentsById.get(draggedComponentId);
  const targetComponent = componentsById.get(targetComponentId);
  if (!draggedComponent || !targetComponent) {
    return null;
  }

  const draggedType = toHierarchyType(draggedComponent.type);
  const targetType = toHierarchyType(targetComponent.type);

  if (dropPosition === "inside") {
    if (!canAcceptChildType(targetType, draggedType)) {
      return null;
    }

    if (wouldCreateCycle(draggedComponentId, targetComponent.id, components, componentsById)) {
      return null;
    }

    const targetChildren = getOrderedChildIds(
      targetComponent.id,
      components,
      componentsById,
    ).filter((childId) => childId !== draggedComponentId);
    return { parentId: targetComponent.id, index: targetChildren.length };
  }

  const targetParentId = resolveParentId(targetComponent.id, components, componentsById);
  const targetParent = targetParentId ? componentsById.get(targetParentId) : null;
  const targetParentType = targetParent ? toHierarchyType(targetParent.type) : null;
  if (!canMoveToParent(draggedType, targetParentType)) {
    return null;
  }

  if (
    targetParentId &&
    wouldCreateCycle(draggedComponentId, targetParentId, components, componentsById)
  ) {
    return null;
  }

  const siblings = (
    targetParentId
      ? getOrderedChildIds(targetParentId, components, componentsById)
      : getOrderedRootIds(components, componentsById)
  ).filter((childId) => childId !== draggedComponentId);
  const targetIndex = siblings.indexOf(targetComponent.id);
  if (targetIndex < 0) {
    return null;
  }

  return {
    parentId: targetParentId,
    index: dropPosition === "after" ? targetIndex + 1 : targetIndex,
  };
}

function resolveDropForEvent(
  event: React.DragEvent<HTMLElement>,
  draggedComponentId: string,
  targetComponentId: string,
  components: CanvasComponent[],
  componentsById: Map<string, CanvasComponent>,
): { instruction: HierarchyDropInstruction; position: HierarchyDropPosition } | null {
  const draggedComponent = componentsById.get(draggedComponentId);
  const targetComponent = componentsById.get(targetComponentId);
  if (!draggedComponent || !targetComponent) {
    return null;
  }

  const draggedType = toHierarchyType(draggedComponent.type);
  const targetType = toHierarchyType(targetComponent.type);
  const allowInside =
    canAcceptChildType(targetType, draggedType) &&
    !wouldCreateCycle(draggedComponentId, targetComponentId, components, componentsById);
  const candidatePositions = getDropPositionCandidates(event, draggedType, targetType, allowInside);

  for (const candidatePosition of candidatePositions) {
    const instruction = resolveDropInstruction(
      draggedComponentId,
      targetComponentId,
      candidatePosition,
      components,
      componentsById,
    );
    if (instruction) {
      return { instruction, position: candidatePosition };
    }
  }

  return null;
}

export function moveComponentInHierarchy(
  components: CanvasComponent[],
  componentId: string,
  nextParentId: string | null,
  nextIndex: number,
): CanvasComponent[] {
  if (nextParentId && componentId === nextParentId) {
    return components;
  }

  const componentsById = new Map(components.map((component) => [component.id, component]));
  const component = componentsById.get(componentId);
  const nextParent = nextParentId ? componentsById.get(nextParentId) : null;

  if (!component || (nextParentId && !nextParent)) {
    return components;
  }

  const componentType = toHierarchyType(component.type);
  const nextParentType = nextParent ? toHierarchyType(nextParent.type) : null;
  if (!canMoveToParent(componentType, nextParentType)) {
    return components;
  }

  if (nextParentId && wouldCreateCycle(componentId, nextParentId, components, componentsById)) {
    return components;
  }

  const currentParentId = resolveParentId(componentId, components, componentsById);
  const currentChildren = currentParentId
    ? getOrderedChildIds(currentParentId, components, componentsById)
    : [];
  if (currentParentId && !currentChildren.includes(componentId)) {
    return components;
  }

  const sameParent = currentParentId === nextParentId;
  const sourceChildrenWithoutComponent = currentParentId
    ? currentChildren.filter((childId) => childId !== componentId)
    : [];
  const rootChildren = getOrderedRootIds(components, componentsById).filter(
    (childId) => childId !== componentId,
  );
  const targetChildrenBeforeInsert = sameParent
    ? currentParentId
      ? sourceChildrenWithoutComponent
      : rootChildren
    : nextParentId
      ? getOrderedChildIds(nextParentId, components, componentsById).filter(
          (childId) => childId !== componentId,
        )
      : rootChildren;

  const insertionIndex = clampIndex(nextIndex, targetChildrenBeforeInsert.length);
  const reorderedTargetChildren = [...targetChildrenBeforeInsert];
  reorderedTargetChildren.splice(insertionIndex, 0, componentId);

  const currentOrder = currentParentId ? currentChildren : getOrderedRootIds(components, componentsById);
  const noReorderChange = sameParent && areEqualLists(currentOrder, reorderedTargetChildren);
  if (noReorderChange && isAssignedToParent(component, nextParentId)) {
    return components;
  }

  let didChange =
    currentParentId === null &&
    nextParentId === null &&
    !areEqualLists(currentOrder, reorderedTargetChildren);

  const updatedComponents = components.map((candidate) => {
    if (candidate.id === componentId) {
      if (isAssignedToParent(candidate, nextParentId)) {
        return candidate;
      }

      didChange = true;
      const nextCandidate = { ...candidate };

      if (nextParentId) {
        nextCandidate.parentId = nextParentId;

        if (nextParent?.type === "Panel") {
          nextCandidate.parentOffset = {
            x: Math.round(nextCandidate.x - nextParent.x),
            y: Math.round(nextCandidate.y - nextParent.y),
          };
        } else {
          delete nextCandidate.parentOffset;
        }
      } else {
        delete nextCandidate.parentId;
        delete nextCandidate.parentOffset;
      }

      return nextCandidate;
    }

    if (nextParentId && candidate.id === nextParentId) {
      if (areEqualLists(candidate.children ?? [], reorderedTargetChildren)) {
        return candidate;
      }

      didChange = true;
      return {
        ...candidate,
        children: reorderedTargetChildren,
      };
    }

    if (!sameParent && candidate.id === currentParentId) {
      if (areEqualLists(candidate.children ?? [], sourceChildrenWithoutComponent)) {
        return candidate;
      }

      didChange = true;
      return {
        ...candidate,
        children: sourceChildrenWithoutComponent,
      };
    }

    return candidate;
  });

  if (!didChange) {
    return components;
  }

  if (nextParentId) {
    return updatedComponents;
  }

  const reorderedRootComponents = reorderedTargetChildren
    .map((id) => updatedComponents.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is CanvasComponent => candidate !== undefined);
  const reorderedRootIds = new Set(reorderedRootComponents.map((candidate) => candidate.id));
  const nonRootComponents = updatedComponents.filter((candidate) => !reorderedRootIds.has(candidate.id));
  const updatedComponentsById = new Map(updatedComponents.map((candidate) => [candidate.id, candidate]));
  const rootInsertionIndexes = updatedComponents
    .map((candidate, index) => ({ candidate, index }))
    .filter(
      ({ candidate }) => resolveParentId(candidate.id, updatedComponents, updatedComponentsById) === null,
    )
    .map(({ index }) => index);

  if (rootInsertionIndexes.length === 0) {
    return updatedComponents;
  }

  const nextComponents = [...nonRootComponents];
  for (const [rootOrderIndex, insertionIndex] of rootInsertionIndexes.entries()) {
    const rootComponent = reorderedRootComponents[rootOrderIndex];
    if (!rootComponent) {
      continue;
    }

    nextComponents.splice(insertionIndex, 0, rootComponent);
  }

  return nextComponents;
}

export function useHierarchyDragDrop({
  components,
  onMoveComponent,
}: UseHierarchyDragDropOptions): UseHierarchyDragDropResult {
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<HierarchyDropTarget | null>(null);
  const componentsById = useMemo(
    () => new Map(components.map((component) => [component.id, component])),
    [components],
  );

  const isDraggableComponent = useCallback(
    (componentId: string): boolean => {
      const component = componentsById.get(componentId);
      if (!component) {
        return false;
      }

      return isMovableType(toHierarchyType(component.type));
    },
    [componentsById],
  );

  const resetDragState = useCallback(() => {
    setDraggingComponentId(null);
    setDropTarget(null);
  }, []);

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLElement>, componentId: string) => {
      if (!isDraggableComponent(componentId)) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(HIERARCHY_DRAG_DATA_MIME, componentId);
      event.dataTransfer.setData("text/plain", componentId);
      setDraggingComponentId(componentId);
      setDropTarget(null);
    },
    [isDraggableComponent],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLElement>, targetComponentId: string) => {
      const draggedId = getDraggingId(event.dataTransfer) ?? draggingComponentId;
      if (!draggedId) {
        return;
      }

      const draggedComponent = componentsById.get(draggedId);
      const targetComponent = componentsById.get(targetComponentId);
      if (!draggedComponent || !targetComponent) {
        return;
      }

      const resolvedDrop = resolveDropForEvent(
        event,
        draggedId,
        targetComponentId,
        components,
        componentsById,
      );

      if (!resolvedDrop) {
        setDropTarget(null);
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      setDropTarget((previous) => {
        if (
          previous?.componentId === targetComponentId &&
          previous.position === resolvedDrop.position
        ) {
          return previous;
        }

        return {
          componentId: targetComponentId,
          position: resolvedDrop.position,
        };
      });
    },
    [components, componentsById, draggingComponentId],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLElement>, targetComponentId: string) => {
      const draggedId = getDraggingId(event.dataTransfer) ?? draggingComponentId;
      if (!draggedId) {
        resetDragState();
        return;
      }

      const draggedComponent = componentsById.get(draggedId);
      const targetComponent = componentsById.get(targetComponentId);
      if (!draggedComponent || !targetComponent) {
        resetDragState();
        return;
      }

      const resolvedDrop = resolveDropForEvent(
        event,
        draggedId,
        targetComponentId,
        components,
        componentsById,
      );

      if (!resolvedDrop) {
        resetDragState();
        return;
      }

      event.preventDefault();
      onMoveComponent(draggedId, resolvedDrop.instruction.parentId, resolvedDrop.instruction.index);
      resetDragState();
    },
    [components, componentsById, draggingComponentId, onMoveComponent, resetDragState],
  );

  const handleDragEnd = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  return {
    draggingComponentId,
    dropTarget,
    isDraggableComponent,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
