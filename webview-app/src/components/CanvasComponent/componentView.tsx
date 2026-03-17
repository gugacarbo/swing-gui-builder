import type { PointerEvent, ReactNode, RefObject } from "react";

import { ResizeHandles } from "@/components/CanvasComponent/resizeHandles";
import type { ResizeHandle } from "@/lib/geometry";
import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

interface CanvasComponentViewProps {
  rootRef: RefObject<HTMLDivElement | null>;
  component: CanvasComponentModel;
  isSelected: boolean;
  isDragging: boolean;
  isResizing: boolean;
  preview: ReactNode;
  onMovePointerDown: (event: PointerEvent<HTMLDivElement>) => boolean;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerFinish: (event: PointerEvent<HTMLDivElement>) => boolean;
  onResizeHandlePointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    handle: ResizeHandle,
  ) => boolean;
  onSelect: (id: string) => void;
}

export function CanvasComponentView({
  rootRef,
  component,
  isSelected,
  isDragging,
  isResizing,
  preview,
  onMovePointerDown,
  onPointerMove,
  onPointerFinish,
  onResizeHandlePointerDown,
  onSelect,
}: CanvasComponentViewProps) {
  const capturePointer = (pointerId: number) => {
    rootRef.current?.setPointerCapture(pointerId);
  };

  const releasePointer = (pointerId: number) => {
    if (rootRef.current?.hasPointerCapture(pointerId)) {
      rootRef.current.releasePointerCapture(pointerId);
    }
  };

  const handleActivate = () => {
    onSelect(component.id);
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
        if (onMovePointerDown(event)) {
          capturePointer(event.pointerId);
        }
      }}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => {
        if (onPointerFinish(event)) {
          releasePointer(event.pointerId);
        }
      }}
      onPointerCancel={(event) => {
        if (onPointerFinish(event)) {
          releasePointer(event.pointerId);
        }
      }}
      onClick={handleActivate}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          handleActivate();
        }
      }}
      className={`absolute touch-none select-none border-none bg-transparent p-0 text-left outline-none ${
        isSelected ? "ring-1 ring-(--canvas-selection)" : ""
      }`}
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
      }}
    >
      {preview}

      <ResizeHandles
        isSelected={isSelected}
        componentType={component.type}
        onHandlePointerDown={(event, handle) => {
          if (onResizeHandlePointerDown(event, handle)) {
            capturePointer(event.pointerId);
          }
        }}
      />
    </div>
  );
}