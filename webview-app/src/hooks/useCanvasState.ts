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
    setComponents((previous) => previous.filter((component) => component.id !== id));
    setSelectedComponentId((previous) => (previous === id ? null : previous));
  }, []);

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
    selectComponent,
  };
}
