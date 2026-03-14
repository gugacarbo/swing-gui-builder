import { useCallback, useRef } from "react";

import { CanvasComponent } from "@/components/CanvasComponent";
import { useCanvasDragDrop } from "@/hooks/useCanvasDragDrop";
import { useCanvasZoomPan } from "@/hooks/useCanvasZoomPan";
import { ZOOM_DEFAULT } from "@/lib/constants";
import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

interface CanvasProps {
  components: CanvasComponentModel[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onAddComponent: (component: CanvasComponentModel) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onResizeComponent: (id: string, updates: Pick<CanvasComponentModel, "x" | "y" | "width" | "height">) => void;
}

export function Canvas({ components, selectedComponentId, onSelectComponent, onAddComponent, onMoveComponent, onResizeComponent }: CanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const { zoom, pan, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, handleZoomIn, handleZoomOut, handleResetView } =
    useCanvasZoomPan();

  const { handleDrop, handleDragOver, isDragging } = useCanvasDragDrop({
    viewportRef,
    zoom,
    pan,
    componentsCount: components.length,
    onAddComponent,
    onSelectComponent,
  });

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!(event.target as HTMLElement | null)?.closest("[data-canvas-component='true']")) {
        onSelectComponent(null);
      }
      handlePointerDown(event);
    },
    [handlePointerDown, onSelectComponent],
  );

  const isDefaultView = zoom === ZOOM_DEFAULT && pan.x === 0 && pan.y === 0;

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Canvas panel">
      <header className="flex items-center justify-between border-b border-vscode-panel-border px-3 py-2 text-xs text-muted-foreground">
        <span>Canvas</span>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded border border-vscode-panel-border px-2 py-0.5 hover:bg-accent" onClick={handleZoomOut}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" className="rounded border border-vscode-panel-border px-2 py-0.5 hover:bg-accent" onClick={handleZoomIn}>+</button>
          <button
            type="button"
            className="rounded border border-vscode-panel-border px-2 py-0.5 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleResetView}
            disabled={isDefaultView}
          >
            Reset View
          </button>
        </div>
      </header>

      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 overflow-hidden ${isDragging ? "bg-[var(--canvas-drop-target)] outline-2 outline-[var(--canvas-selection)]" : "bg-vscode-background"}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onWheel={handleWheel}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          {components.map((component) => (
            <CanvasComponent
              key={component.id}
              component={component}
              zoom={zoom}
              isSelected={selectedComponentId === component.id}
              onSelect={onSelectComponent}
              onMove={onMoveComponent}
              onResize={onResizeComponent}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
