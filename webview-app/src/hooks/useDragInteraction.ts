import { useCallback, useState } from "react";

import { calculateResize, snapToGrid, type Rect, type ResizeHandle } from "@/lib/geometry";
import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

interface DragStartOptions {
  mode?: "move" | "resize";
  handle?: ResizeHandle;
}

interface DragSession {
  mode: "move" | "resize";
  pointerId: number | null;
  handle?: ResizeHandle;
  startClientX: number;
  startClientY: number;
  startRect: Rect;
}

type DragPointerEvent = Pick<React.PointerEvent<HTMLElement>, "button" | "clientX" | "clientY" | "stopPropagation"> &
  Partial<Pick<React.PointerEvent<HTMLElement>, "pointerId">>;

interface UseDragInteractionOptions {
  component: Pick<CanvasComponentModel, "id" | "x" | "y" | "width" | "height">;
  zoom: number;
  onSelect: (id: string) => void;
  onMove: (id: string, nextX: number, nextY: number) => void;
  onResize: (id: string, updates: Pick<CanvasComponentModel, "x" | "y" | "width" | "height">) => void;
  minWidth?: number;
  minHeight?: number;
  gridSize?: number;
}

export function useDragInteraction({
  component,
  zoom,
  onSelect,
  onMove,
  onResize,
  minWidth = 48,
  minHeight = 28,
  gridSize = 1,
}: UseDragInteractionOptions) {
  const [interaction, setInteraction] = useState<DragSession | null>(null);

  const isDragging = interaction !== null;
  const isResizing = interaction?.mode === "resize";

  const handleMouseDown = useCallback(
    (event: DragPointerEvent, options: DragStartOptions = { mode: "move" }) => {
      if (event.button !== 0) {
        return false;
      }

      event.stopPropagation();
      onSelect(component.id);

      const pointerId = typeof event.pointerId === "number" ? event.pointerId : null;
      const mode = options.mode ?? "move";

      setInteraction({
        mode,
        pointerId,
        handle: options.handle,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startRect: {
          x: component.x,
          y: component.y,
          width: component.width,
          height: component.height,
        },
      });

      return true;
    },
    [component.height, component.id, component.width, component.x, component.y, onSelect],
  );

  const handleMouseMove = useCallback(
    (event: DragPointerEvent) => {
      if (!interaction) {
        return;
      }

      if (
        interaction.pointerId !== null &&
        typeof event.pointerId === "number" &&
        event.pointerId !== interaction.pointerId
      ) {
        return;
      }

      const deltaX = (event.clientX - interaction.startClientX) / zoom;
      const deltaY = (event.clientY - interaction.startClientY) / zoom;

      if (interaction.mode === "move") {
        onMove(component.id, snapToGrid(interaction.startRect.x + deltaX, gridSize), snapToGrid(interaction.startRect.y + deltaY, gridSize));
        return;
      }

      if (!interaction.handle) {
        return;
      }

      const nextRect = calculateResize(interaction.startRect, {
        handle: interaction.handle,
        deltaX,
        deltaY,
        minWidth,
        minHeight,
        gridSize,
      });

      onResize(component.id, nextRect);
    },
    [component.id, gridSize, interaction, minHeight, minWidth, onMove, onResize, zoom],
  );

  const handleMouseUp = useCallback((event: DragPointerEvent) => {
    if (!interaction) {
      return false;
    }

    if (
      interaction.pointerId !== null &&
      typeof event.pointerId === "number" &&
      event.pointerId !== interaction.pointerId
    ) {
      return false;
    }

    setInteraction(null);
    return true;
  }, [interaction]);

  return {
    isDragging,
    isResizing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}