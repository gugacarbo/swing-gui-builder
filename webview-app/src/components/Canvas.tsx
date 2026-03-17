import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MenuBarZone } from "@/components/Canvas/MenuBarZone";
import { ToolBarZone } from "@/components/Canvas/ToolBarZone";
import {
  buildFixedZoneLayout,
  getComponentLabel,
} from "@/components/Canvas/fixedZoneLayout";
import { CanvasComponent } from "@/components/CanvasComponent";
import { useCanvasDragDrop } from "@/hooks/useCanvasDragDrop";
import { useCanvasZoomPan } from "@/hooks/useCanvasZoomPan";
import { ZOOM_DEFAULT } from "@/lib/constants";
import { FRAME_TITLE_BAR_HEIGHT } from "@/components/Canvas/constants";
import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

interface CanvasProps {
  frameWidth: number;
  frameHeight: number;
  components: CanvasComponentModel[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onAddComponent: (component: CanvasComponentModel) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onResizeComponent: (
    id: string,
    updates: Pick<CanvasComponentModel, "x" | "y" | "width" | "height">,
  ) => void;
}

export function Canvas({
  frameWidth,
  frameHeight,
  components,
  selectedComponentId,
  onSelectComponent,
  onAddComponent,
  onMoveComponent,
  onResizeComponent,
}: CanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const {
    zoom,
    pan,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
  } = useCanvasZoomPan();

  const normalizedFrameWidth = Math.max(1, Math.round(frameWidth));
  const normalizedFrameHeight = Math.max(FRAME_TITLE_BAR_HEIGHT + 1, Math.round(frameHeight));

  const { handleDrop, handleDragOver, isDragging } = useCanvasDragDrop({
    viewportRef,
    zoom,
    pan: {
      x: pan.x,
      y: pan.y + FRAME_TITLE_BAR_HEIGHT * zoom,
    },
    componentsCount: components.length,
    onAddComponent,
    onSelectComponent,
  });

  const {
    componentsById,
    floatingComponents,
    menuBarLayout,
    northToolBarLayout,
    southToolBarLayout,
    westToolBarLayout,
    eastToolBarLayout,
    sideTopInset,
    sideBottomInset,
  } = useMemo(() => buildFixedZoneLayout(components), [components]);

  useEffect(() => {
    if (!expandedMenuId) {
      return;
    }

    if (!components.some((component) => component.id === expandedMenuId)) {
      setExpandedMenuId(null);
    }
  }, [components, expandedMenuId]);

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (
        !(event.target as HTMLElement | null)?.closest(
          "[data-canvas-component='true'], [data-canvas-fixed='true']",
        )
      ) {
        onSelectComponent(null);
        setExpandedMenuId(null);
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
          <button
            type="button"
            className="rounded border border-vscode-panel-border px-2 py-0.5 hover:bg-accent"
            onClick={handleZoomOut}
          >
            -
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="rounded border border-vscode-panel-border px-2 py-0.5 hover:bg-accent"
            onClick={handleZoomIn}
          >
            +
          </button>
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
        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div
            className="relative overflow-hidden rounded-md border border-vscode-panel-border bg-vscode-panel-background shadow-lg"
            style={{ width: normalizedFrameWidth, height: normalizedFrameHeight }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between border-b border-vscode-panel-border bg-vscode-panel-background px-3 text-[11px] text-muted-foreground"
              style={{ height: FRAME_TITLE_BAR_HEIGHT }}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              </div>
              <span className="truncate">{`JFrame (${normalizedFrameWidth} × ${normalizedFrameHeight})`}</span>
              <span className="w-8" />
            </div>

            <div
              className="absolute inset-x-0 bottom-0 border-t border-vscode-panel-border bg-vscode-background"
              style={{ top: FRAME_TITLE_BAR_HEIGHT }}
            >
              <div className="relative h-full w-full overflow-hidden">
                {floatingComponents.map((component) => (
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

                <MenuBarZone
                  menuBarLayout={menuBarLayout}
                  componentsById={componentsById}
                  components={components}
                  selectedComponentId={selectedComponentId}
                  expandedMenuId={expandedMenuId}
                  setExpandedMenuId={setExpandedMenuId}
                  onSelectComponent={onSelectComponent}
                  getComponentLabel={getComponentLabel}
                />

                <ToolBarZone
                  northToolBarLayout={northToolBarLayout}
                  southToolBarLayout={southToolBarLayout}
                  westToolBarLayout={westToolBarLayout}
                  eastToolBarLayout={eastToolBarLayout}
                  sideTopInset={sideTopInset}
                  sideBottomInset={sideBottomInset}
                  componentsById={componentsById}
                  components={components}
                  selectedComponentId={selectedComponentId}
                  onSelectComponent={onSelectComponent}
                  getComponentLabel={getComponentLabel}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
