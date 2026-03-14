import { useRef } from "react";

import { useDragInteraction } from "@/hooks/useDragInteraction";
import type { ResizeHandle } from "@/lib/geometry";
import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

interface CanvasComponentProps {
  component: CanvasComponentModel;
  zoom: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, nextX: number, nextY: number) => void;
  onResize: (id: string, updates: Pick<CanvasComponentModel, "x" | "y" | "width" | "height">) => void;
}

const RESIZE_HANDLES: ReadonlyArray<{ handle: ResizeHandle; className: string; cursorClassName: string }> = [
  { handle: "nw", className: "-left-1 -top-1", cursorClassName: "cursor-nwse-resize" },
  { handle: "n", className: "left-1/2 -top-1 -translate-x-1/2", cursorClassName: "cursor-ns-resize" },
  { handle: "ne", className: "-right-1 -top-1", cursorClassName: "cursor-nesw-resize" },
  { handle: "e", className: "-right-1 top-1/2 -translate-y-1/2", cursorClassName: "cursor-ew-resize" },
  { handle: "se", className: "-bottom-1 -right-1", cursorClassName: "cursor-nwse-resize" },
  { handle: "s", className: "-bottom-1 left-1/2 -translate-x-1/2", cursorClassName: "cursor-ns-resize" },
  { handle: "sw", className: "-bottom-1 -left-1", cursorClassName: "cursor-nesw-resize" },
  { handle: "w", className: "-left-1 top-1/2 -translate-y-1/2", cursorClassName: "cursor-ew-resize" },
];

export function CanvasComponent({ component, zoom, isSelected, onSelect, onMove, onResize }: CanvasComponentProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const { isDragging, isResizing, handleMouseDown, handleMouseMove, handleMouseUp } = useDragInteraction({
    component,
    zoom,
    onSelect,
    onMove,
    onResize,
  });

  const capturePointer = (pointerId: number) => {
    rootRef.current?.setPointerCapture(pointerId);
  };

  const releasePointer = (pointerId: number) => {
    if (rootRef.current?.hasPointerCapture(pointerId)) {
      rootRef.current.releasePointerCapture(pointerId);
    }
  };

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      data-canvas-component="true"
      data-dragging={isDragging ? "true" : "false"}
      data-resizing={isResizing ? "true" : "false"}
      aria-label={`${component.type} component`}
      onPointerDown={(event) => {
        if (handleMouseDown(event, { mode: "move" })) {
          capturePointer(event.pointerId);
        }
      }}
      onPointerMove={handleMouseMove}
      onPointerUp={(event) => {
        if (handleMouseUp(event)) {
          releasePointer(event.pointerId);
        }
      }}
      onPointerCancel={(event) => {
        if (handleMouseUp(event)) {
          releasePointer(event.pointerId);
        }
      }}
      onClick={() => onSelect(component.id)}
      className={`canvas-component-base ${
        isSelected ? "border-[var(--canvas-selection)] ring-1 ring-[var(--canvas-selection)]" : "border-vscode-panel-border"
      }`}
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
        backgroundColor: component.backgroundColor,
        color: component.textColor,
        fontFamily: component.fontFamily,
        fontSize: `${component.fontSize}px`,
      }}
    >
      <span className="pointer-events-none px-1 text-center">{component.text}</span>

      {isSelected &&
        RESIZE_HANDLES.map(({ handle, className, cursorClassName }) => (
          <button
            key={handle}
            type="button"
            aria-label={`Resize ${component.type} ${handle}`}
            onPointerDown={(event) => {
              if (handleMouseDown(event, { mode: "resize", handle })) {
                capturePointer(event.pointerId);
              }
            }}
            className={`canvas-selection-handle ${className} ${cursorClassName}`}
          />
        ))}
    </div>
  );
}
