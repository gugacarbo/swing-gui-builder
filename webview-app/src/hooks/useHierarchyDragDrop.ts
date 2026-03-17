import { useCallback, useMemo, useState } from "react";

import type { CanvasComponent } from "@/types/canvas";

const HIERARCHY_DRAG_DATA_MIME = "application/x-swing-hierarchy-component";

type HierarchyType = "MenuBar" | "Menu" | "MenuItem" | "Other";
export type HierarchyDropPosition = "before" | "after" | "inside";

interface HierarchyDropInstruction {
  parentId: string;
  index: number;
}

export interface HierarchyDropTarget {
  componentId: string;
  position: HierarchyDropPosition;
}

export interface UseHierarchyDragDropOptions {
  components: CanvasComponent[];
  onMoveComponent: (componentId: string, parentId: string, index: number) => void;
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
    default:
      return "Other";
  }
}

function isMovableType(type: HierarchyType): boolean {
  return type === "Menu" || type === "MenuItem";
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

function resolveDropPosition(
  event: React.DragEvent<HTMLElement>,
  draggedType: HierarchyType,
  targetType: HierarchyType,
): HierarchyDropPosition {
  if (
    (draggedType === "MenuItem" && targetType === "Menu") ||
    (draggedType === "Menu" && targetType === "MenuBar")
  ) {
    return "inside";
  }

  const targetBounds = event.currentTarget.getBoundingClientRect();
  return event.clientY >= targetBounds.top + targetBounds.height / 2 ? "after" : "before";
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

  if (draggedType === "MenuItem") {
    if (targetType === "Menu") {
      const targetChildren = getOrderedChildIds(targetComponent.id, components, componentsById);
      return { parentId: targetComponent.id, index: targetChildren.length };
    }

    if (targetType === "MenuItem") {
      const targetParentId = resolveParentId(targetComponent.id, components, componentsById);
      if (!targetParentId) {
        return null;
      }

      const targetParent = componentsById.get(targetParentId);
      if (!targetParent || toHierarchyType(targetParent.type) !== "Menu") {
        return null;
      }

      const siblings = getOrderedChildIds(targetParentId, components, componentsById);
      const targetIndex = siblings.indexOf(targetComponent.id);
      if (targetIndex < 0) {
        return null;
      }

      return {
        parentId: targetParentId,
        index: dropPosition === "after" ? targetIndex + 1 : targetIndex,
      };
    }

    return null;
  }

  if (draggedType === "Menu") {
    if (targetType === "MenuBar") {
      const targetChildren = getOrderedChildIds(targetComponent.id, components, componentsById);
      return { parentId: targetComponent.id, index: targetChildren.length };
    }

    if (targetType === "Menu") {
      const targetParentId = resolveParentId(targetComponent.id, components, componentsById);
      if (!targetParentId) {
        return null;
      }

      const targetParent = componentsById.get(targetParentId);
      if (!targetParent || toHierarchyType(targetParent.type) !== "MenuBar") {
        return null;
      }

      const siblings = getOrderedChildIds(targetParentId, components, componentsById);
      const targetIndex = siblings.indexOf(targetComponent.id);
      if (targetIndex < 0) {
        return null;
      }

      return {
        parentId: targetParentId,
        index: dropPosition === "after" ? targetIndex + 1 : targetIndex,
      };
    }

    return null;
  }

  return null;
}

export function moveComponentInHierarchy(
  components: CanvasComponent[],
  componentId: string,
  nextParentId: string,
  nextIndex: number,
): CanvasComponent[] {
  if (componentId === nextParentId) {
    return components;
  }

  const componentsById = new Map(components.map((component) => [component.id, component]));
  const component = componentsById.get(componentId);
  const nextParent = componentsById.get(nextParentId);

  if (!component || !nextParent) {
    return components;
  }

  const componentType = toHierarchyType(component.type);
  const nextParentType = toHierarchyType(nextParent.type);
  const isValidMove =
    (componentType === "MenuItem" && nextParentType === "Menu") ||
    (componentType === "Menu" && nextParentType === "MenuBar");

  if (!isValidMove) {
    return components;
  }

  const currentParentId = resolveParentId(componentId, components, componentsById);
  const currentChildren = currentParentId
    ? getOrderedChildIds(currentParentId, components, componentsById)
    : [];
  if (currentParentId && !currentChildren.includes(componentId)) {
    return components;
  }

  const sameParent = currentParentId !== null && currentParentId === nextParentId;
  const sourceChildrenWithoutComponent = currentParentId
    ? currentChildren.filter((childId) => childId !== componentId)
    : [];
  const targetChildrenBeforeInsert = sameParent
    ? sourceChildrenWithoutComponent
    : getOrderedChildIds(nextParentId, components, componentsById).filter(
        (childId) => childId !== componentId,
      );

  const insertionIndex = clampIndex(nextIndex, targetChildrenBeforeInsert.length);
  const reorderedTargetChildren = [...targetChildrenBeforeInsert];
  reorderedTargetChildren.splice(insertionIndex, 0, componentId);

  const noReorderChange = sameParent && areEqualLists(currentChildren, reorderedTargetChildren);
  if (noReorderChange && component.parentId === nextParentId) {
    return components;
  }

  let didChange = false;

  const nextComponents = components.map((candidate) => {
    if (candidate.id === componentId) {
      if (candidate.parentId === nextParentId) {
        return candidate;
      }

      didChange = true;
      return {
        ...candidate,
        parentId: nextParentId,
      };
    }

    if (candidate.id === nextParentId) {
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

  return didChange ? nextComponents : components;
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

      const dropPosition = resolveDropPosition(
        event,
        toHierarchyType(draggedComponent.type),
        toHierarchyType(targetComponent.type),
      );
      const dropInstruction = resolveDropInstruction(
        draggedId,
        targetComponentId,
        dropPosition,
        components,
        componentsById,
      );

      if (!dropInstruction) {
        setDropTarget((previous) =>
          previous?.componentId === targetComponentId ? null : previous,
        );
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      setDropTarget((previous) => {
        if (previous?.componentId === targetComponentId && previous.position === dropPosition) {
          return previous;
        }

        return {
          componentId: targetComponentId,
          position: dropPosition,
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

      const dropPosition = resolveDropPosition(
        event,
        toHierarchyType(draggedComponent.type),
        toHierarchyType(targetComponent.type),
      );
      const dropInstruction = resolveDropInstruction(
        draggedId,
        targetComponentId,
        dropPosition,
        components,
        componentsById,
      );

      if (!dropInstruction) {
        resetDragState();
        return;
      }

      event.preventDefault();
      onMoveComponent(draggedId, dropInstruction.parentId, dropInstruction.index);
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
