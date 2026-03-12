import { useCallback, useMemo, useRef, useState } from "react";

import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

interface CanvasComponentProps {
  component: CanvasComponentModel;
  zoom: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, nextX: number, nextY: number) => void;
  onResize: (id: string, updates: Pick<CanvasComponentModel, "x" | "y" | "width" | "height">) => void;
}

interface DragInteraction {
  mode: "move" | "resize";
  pointerId: number;
  handle?: ResizeHandle;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

const HANDLE_DEFINITIONS: Array<{ key: ResizeHandle; className: string; cursorClassName: string }> = [
  { key: "nw", className: "-left-1 -top-1", cursorClassName: "cursor-nwse-resize" },
  { key: "n", className: "left-1/2 -top-1 -translate-x-1/2", cursorClassName: "cursor-ns-resize" },
  { key: "ne", className: "-right-1 -top-1", cursorClassName: "cursor-nesw-resize" },
  { key: "e", className: "-right-1 top-1/2 -translate-y-1/2", cursorClassName: "cursor-ew-resize" },
  { key: "se", className: "-bottom-1 -right-1", cursorClassName: "cursor-nwse-resize" },
  { key: "s", className: "-bottom-1 left-1/2 -translate-x-1/2", cursorClassName: "cursor-ns-resize" },
  { key: "sw", className: "-bottom-1 -left-1", cursorClassName: "cursor-nesw-resize" },
  { key: "w", className: "-left-1 top-1/2 -translate-y-1/2", cursorClassName: "cursor-ew-resize" },
];

const MIN_WIDTH = 48;
const MIN_HEIGHT = 28;

function clampSize(value: number, min: number): number {
  return Math.max(min, Math.round(value));
}

export function CanvasComponent({ component, zoom, isSelected, onSelect, onMove, onResize }: CanvasComponentProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [interaction, setInteraction] = useState<DragInteraction | null>(null);

  const componentStyle = useMemo(
    () => ({
      left: component.x,
      top: component.y,
      width: component.width,
      height: component.height,
      backgroundColor: component.backgroundColor,
      color: component.textColor,
      fontFamily: component.fontFamily,
      fontSize: `${component.fontSize}px`,
    }),
    [component],
  );

  const finishInteraction = useCallback(() => {
    if (!interaction || !rootRef.current) {
      setInteraction(null);
      return;
    }

    if (rootRef.current.hasPointerCapture(interaction.pointerId)) {
      rootRef.current.releasePointerCapture(interaction.pointerId);
    }

    setInteraction(null);
  }, [interaction]);

  const startMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.stopPropagation();
      onSelect(component.id);

      rootRef.current?.setPointerCapture(event.pointerId);

      setInteraction({
        mode: "move",
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: component.x,
        startY: component.y,
        startWidth: component.width,
        startHeight: component.height,
      });
    },
    [component.height, component.id, component.width, component.x, component.y, onSelect],
  );

  const startResize = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, handle: ResizeHandle) => {
      if (event.button !== 0) {
        return;
      }

      event.stopPropagation();
      onSelect(component.id);

      rootRef.current?.setPointerCapture(event.pointerId);

      setInteraction({
        mode: "resize",
        pointerId: event.pointerId,
        handle,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: component.x,
        startY: component.y,
        startWidth: component.width,
        startHeight: component.height,
      });
    },
    [component.height, component.id, component.width, component.x, component.y, onSelect],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!interaction || event.pointerId !== interaction.pointerId) {
        return;
      }

      const deltaX = (event.clientX - interaction.startClientX) / zoom;
      const deltaY = (event.clientY - interaction.startClientY) / zoom;

      if (interaction.mode === "move") {
        onMove(component.id, interaction.startX + deltaX, interaction.startY + deltaY);
        return;
      }

      const handle = interaction.handle;
      if (!handle) {
        return;
      }

      let nextX = interaction.startX;
      let nextY = interaction.startY;
      let nextWidth = interaction.startWidth;
      let nextHeight = interaction.startHeight;

      if (handle.includes("e")) {
        nextWidth = clampSize(interaction.startWidth + deltaX, MIN_WIDTH);
      }

      if (handle.includes("s")) {
        nextHeight = clampSize(interaction.startHeight + deltaY, MIN_HEIGHT);
      }

      if (handle.includes("w")) {
        const candidateWidth = interaction.startWidth - deltaX;
        nextWidth = clampSize(candidateWidth, MIN_WIDTH);
        nextX = interaction.startX + (interaction.startWidth - nextWidth);
      }

      if (handle.includes("n")) {
        const candidateHeight = interaction.startHeight - deltaY;
        nextHeight = clampSize(candidateHeight, MIN_HEIGHT);
        nextY = interaction.startY + (interaction.startHeight - nextHeight);
      }

      onResize(component.id, {
        x: Math.round(nextX),
        y: Math.round(nextY),
        width: nextWidth,
        height: nextHeight,
      });
    },
    [component.id, interaction, onMove, onResize, zoom],
  );

  const handlePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!interaction || event.pointerId !== interaction.pointerId) {
        return;
      }

      finishInteraction();
    },
    [finishInteraction, interaction],
  );

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      data-canvas-component="true"
      aria-label={`${component.type} component`}
      onPointerDown={startMove}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={() => onSelect(component.id)}
      className={`canvas-component-base ${
        isSelected
          ? "border-[var(--canvas-selection)] ring-1 ring-[var(--canvas-selection)]"
          : "border-vscode-panel-border"
      }`}
      style={componentStyle}
    >
      <span className="pointer-events-none px-1 text-center">{component.text}</span>

      {isSelected &&
        HANDLE_DEFINITIONS.map((handle) => (
          <button
            key={handle.key}
            type="button"
            aria-label={`Resize ${component.type} ${handle.key}`}
            onPointerDown={(event) => startResize(event, handle.key)}
            className={`canvas-selection-handle ${handle.className} ${handle.cursorClassName}`}
          />
        ))}
    </div>
  );
}
