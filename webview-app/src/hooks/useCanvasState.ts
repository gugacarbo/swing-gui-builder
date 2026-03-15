import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { CanvasComponent } from "@/types/canvas";

export interface UseCanvasStateResult {
  components: CanvasComponent[];
  selectedComponentId: string | null;
  selectedComponent: CanvasComponent | null;
  setComponents: Dispatch<SetStateAction<CanvasComponent[]>>;
  addComponent: (component: CanvasComponent) => void;
  updateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  removeComponent: (id: string) => void;
  addChild: (parentId: string, childId: string) => void;
  removeChild: (parentId: string, childId: string) => void;
  getChildren: (componentId: string) => CanvasComponent[];
  getRootComponents: () => CanvasComponent[];
  selectComponent: (id: string | null) => void;
}

export function useCanvasState(initialComponents: CanvasComponent[] = []): UseCanvasStateResult {
  const [components, setComponents] = useState<CanvasComponent[]>(initialComponents);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const addComponent = useCallback((component: CanvasComponent) => {
    setComponents((previous) => [...previous, component]);
  }, []);

  const updateComponent = useCallback((id: string, updates: Partial<CanvasComponent>) => {
    setComponents((previous) => previous.map((component) => (component.id === id ? { ...component, ...updates } : component)));
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((previous) =>
      previous
        .filter((component) => component.id !== id)
        .map((component) => {
          let nextComponent = component;

          if (nextComponent.parentId === id) {
            nextComponent = { ...nextComponent };
            delete nextComponent.parentId;
          }

          if (nextComponent.children?.includes(id)) {
            nextComponent = {
              ...nextComponent,
              children: nextComponent.children.filter((childId) => childId !== id),
            };
          }

          return nextComponent;
        }),
    );
    setSelectedComponentId((previous) => (previous === id ? null : previous));
  }, []);

  const addChild = useCallback((parentId: string, childId: string) => {
    if (parentId === childId) {
      return;
    }

    setComponents((previous) => {
      const parent = previous.find((component) => component.id === parentId);
      const child = previous.find((component) => component.id === childId);

      if (!parent || !child) {
        return previous;
      }

      const parentChildren = parent.children ?? [];
      const shouldAddChildToParent = !parentChildren.includes(childId);
      const shouldUpdateChildParent = child.parentId !== parentId;
      const previousParentId = child.parentId;
      const shouldDetachFromPreviousParent = previousParentId !== undefined && previousParentId !== parentId;

      if (!shouldAddChildToParent && !shouldUpdateChildParent && !shouldDetachFromPreviousParent) {
        return previous;
      }

      return previous.map((component) => {
        if (component.id === parentId && shouldAddChildToParent) {
          return {
            ...component,
            children: [...parentChildren, childId],
          };
        }

        if (shouldDetachFromPreviousParent && component.id === previousParentId) {
          return {
            ...component,
            children: (component.children ?? []).filter((id) => id !== childId),
          };
        }

        if (component.id === childId && shouldUpdateChildParent) {
          return {
            ...component,
            parentId,
          };
        }

        return component;
      });
    });
  }, []);

  const removeChild = useCallback((parentId: string, childId: string) => {
    setComponents((previous) => {
      const parent = previous.find((component) => component.id === parentId);
      const child = previous.find((component) => component.id === childId);

      if (!parent || !child) {
        return previous;
      }

      const parentChildren = parent.children ?? [];
      const shouldRemoveChildFromParent = parentChildren.includes(childId);
      const shouldClearChildParent = child.parentId === parentId;

      if (!shouldRemoveChildFromParent && !shouldClearChildParent) {
        return previous;
      }

      return previous.map((component) => {
        if (component.id === parentId && shouldRemoveChildFromParent) {
          return {
            ...component,
            children: parentChildren.filter((id) => id !== childId),
          };
        }

        if (component.id === childId && shouldClearChildParent) {
          const childWithoutParent = { ...component };
          delete childWithoutParent.parentId;
          return childWithoutParent;
        }

        return component;
      });
    });
  }, []);

  const getChildren = useCallback(
    (componentId: string) => {
      const parent = components.find((component) => component.id === componentId);

      if (!parent) {
        return [];
      }

      const componentsById = new Map(components.map((component) => [component.id, component]));
      const orderedChildren = (parent.children ?? [])
        .map((childId) => componentsById.get(childId))
        .filter((child): child is CanvasComponent => child !== undefined);

      const knownChildIds = new Set(orderedChildren.map((child) => child.id));
      const parentBasedChildren = components.filter(
        (component) => component.parentId === componentId && !knownChildIds.has(component.id),
      );

      return [...orderedChildren, ...parentBasedChildren];
    },
    [components],
  );

  const getRootComponents = useCallback(() => {
    const componentIds = new Set(components.map((component) => component.id));
    return components.filter((component) => !component.parentId || !componentIds.has(component.parentId));
  }, [components]);

  const selectComponent = useCallback(
    (id: string | null) => {
      if (id === null) {
        setSelectedComponentId(null);
        return;
      }

      if (components.some((component) => component.id === id)) {
        setSelectedComponentId(id);
      }
    },
    [components],
  );

  useEffect(() => {
    if (selectedComponentId && !components.some((component) => component.id === selectedComponentId)) {
      setSelectedComponentId(null);
    }
  }, [components, selectedComponentId]);

  const selectedComponent = useMemo(
    () => components.find((component) => component.id === selectedComponentId) ?? null,
    [components, selectedComponentId],
  );

  return {
    components,
    selectedComponentId,
    selectedComponent,
    setComponents,
    addComponent,
    updateComponent,
    removeComponent,
    addChild,
    removeChild,
    getChildren,
    getRootComponents,
    selectComponent,
  };
}
