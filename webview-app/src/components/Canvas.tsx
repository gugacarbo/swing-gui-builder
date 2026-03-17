import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FRAME_TITLE_BAR_HEIGHT } from "@/components/Canvas/constants";
import { buildFixedZoneLayout, getComponentLabel } from "@/components/Canvas/fixedZoneLayout";
import { MenuBarZone } from "@/components/Canvas/MenuBarZone";
import { ToolBarZone } from "@/components/Canvas/ToolBarZone";
import { CanvasComponent } from "@/components/CanvasComponent";
import { useCanvasDragDrop } from "@/hooks/useCanvasDragDrop";
import { useCanvasZoomPan } from "@/hooks/useCanvasZoomPan";
import { ZOOM_DEFAULT } from "@/lib/constants";
import { clamp } from "@/lib/geometry";
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

interface PanelRenderContext {
  absoluteX: number;
  absoluteY: number;
  width: number;
  height: number;
}

function getOrderedPanelChildren(
  panel: CanvasComponentModel,
  componentsById: Map<string, CanvasComponentModel>,
  allComponents: CanvasComponentModel[],
): CanvasComponentModel[] {
  const orderedChildren: CanvasComponentModel[] = [];
  const knownChildIds = new Set<string>();

  for (const childId of panel.children ?? []) {
    const child = componentsById.get(childId);
    if (!child || knownChildIds.has(child.id)) {
      continue;
    }

    orderedChildren.push(child);
    knownChildIds.add(child.id);
  }

  const parentLinkedChildren = allComponents.filter(
    (component) => component.parentId === panel.id && !knownChildIds.has(component.id),
  );

  return [...orderedChildren, ...parentLinkedChildren];
}

function resolveLocalPosition(
  component: CanvasComponentModel,
  parentContext: PanelRenderContext,
): { x: number; y: number } {
  const safeWidth = Math.max(1, Math.round(component.width));
  const safeHeight = Math.max(1, Math.round(component.height));
  const safeParentWidth = Math.max(1, Math.round(parentContext.width));
  const safeParentHeight = Math.max(1, Math.round(parentContext.height));

  const rawOffsetX = Math.round(component.parentOffset?.x ?? component.x - parentContext.absoluteX);
  const rawOffsetY = Math.round(component.parentOffset?.y ?? component.y - parentContext.absoluteY);

  const boundedX = clamp(rawOffsetX, 0, Math.max(0, safeParentWidth - safeWidth));
  const boundedY = clamp(rawOffsetY, 0, Math.max(0, safeParentHeight - safeHeight));

  return { x: boundedX, y: boundedY };
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
    components,
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

  const floatingComponentsById = useMemo(
    () => new Map(floatingComponents.map((component) => [component.id, component])),
    [floatingComponents],
  );

  const panelChildrenById = useMemo(() => {
    const panelChildren = new Map<string, CanvasComponentModel[]>();

    for (const component of floatingComponents) {
      if (component.type !== "Panel") {
        continue;
      }

      panelChildren.set(
        component.id,
        getOrderedPanelChildren(component, floatingComponentsById, floatingComponents),
      );
    }

    return panelChildren;
  }, [floatingComponents, floatingComponentsById]);

  const nestedPanelChildIds = useMemo(() => {
    const childIds = new Set<string>();
    for (const children of panelChildrenById.values()) {
      for (const child of children) {
        childIds.add(child.id);
      }
    }
    return childIds;
  }, [panelChildrenById]);

  const rootFloatingComponents = useMemo(
    () => floatingComponents.filter((component) => !nestedPanelChildIds.has(component.id)),
    [floatingComponents, nestedPanelChildIds],
  );

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

  const renderFloatingComponent = useCallback(
    (
      component: CanvasComponentModel,
      parentContext?: PanelRenderContext,
      ancestry = new Set<string>(),
    ) => {
      if (ancestry.has(component.id)) {
        return null;
      }

      const safeWidth = Math.max(1, Math.round(component.width));
      const safeHeight = Math.max(1, Math.round(component.height));
      const nextAncestry = new Set(ancestry);
      nextAncestry.add(component.id);

      const localPosition = parentContext
        ? resolveLocalPosition(component, parentContext)
        : { x: Math.round(component.x), y: Math.round(component.y) };

      const absoluteX = parentContext ? parentContext.absoluteX + localPosition.x : localPosition.x;
      const absoluteY = parentContext ? parentContext.absoluteY + localPosition.y : localPosition.y;

      const renderedComponent: CanvasComponentModel = {
        ...component,
        x: localPosition.x,
        y: localPosition.y,
        width: safeWidth,
        height: safeHeight,
      };

      const handleMove = (id: string, nextX: number, nextY: number) => {
        if (!parentContext) {
          onMoveComponent(id, Math.round(nextX), Math.round(nextY));
          return;
        }

        const maxLocalX = Math.max(0, Math.round(parentContext.width) - safeWidth);
        const maxLocalY = Math.max(0, Math.round(parentContext.height) - safeHeight);
        const boundedLocalX = clamp(Math.round(nextX), 0, maxLocalX);
        const boundedLocalY = clamp(Math.round(nextY), 0, maxLocalY);

        onMoveComponent(
          id,
          parentContext.absoluteX + boundedLocalX,
          parentContext.absoluteY + boundedLocalY,
        );
      };

      const handleResize = (
        id: string,
        updates: Pick<CanvasComponentModel, "x" | "y" | "width" | "height">,
      ) => {
        if (!parentContext) {
          onResizeComponent(id, {
            x: Math.round(updates.x),
            y: Math.round(updates.y),
            width: Math.max(1, Math.round(updates.width)),
            height: Math.max(1, Math.round(updates.height)),
          });
          return;
        }

        const safeParentWidth = Math.max(1, Math.round(parentContext.width));
        const safeParentHeight = Math.max(1, Math.round(parentContext.height));
        let boundedWidth = Math.min(Math.max(1, Math.round(updates.width)), safeParentWidth);
        let boundedHeight = Math.min(Math.max(1, Math.round(updates.height)), safeParentHeight);

        const maxLocalX = Math.max(0, safeParentWidth - boundedWidth);
        const maxLocalY = Math.max(0, safeParentHeight - boundedHeight);
        const boundedLocalX = clamp(Math.round(updates.x), 0, maxLocalX);
        const boundedLocalY = clamp(Math.round(updates.y), 0, maxLocalY);

        boundedWidth = Math.min(boundedWidth, Math.max(1, safeParentWidth - boundedLocalX));
        boundedHeight = Math.min(boundedHeight, Math.max(1, safeParentHeight - boundedLocalY));

        onResizeComponent(id, {
          x: parentContext.absoluteX + boundedLocalX,
          y: parentContext.absoluteY + boundedLocalY,
          width: boundedWidth,
          height: boundedHeight,
        });
      };

      const nestedChildren =
        component.type === "Panel"
          ? (panelChildrenById.get(component.id) ?? []).map((child) =>
              renderFloatingComponent(
                child,
                {
                  absoluteX,
                  absoluteY,
                  width: safeWidth,
                  height: safeHeight,
                },
                nextAncestry,
              ),
            )
          : null;

      return (
        <CanvasComponent
          key={component.id}
          component={renderedComponent}
          zoom={zoom}
          isSelected={selectedComponentId === component.id}
          onSelect={onSelectComponent}
          onMove={handleMove}
          onResize={handleResize}
        >
          {nestedChildren}
        </CanvasComponent>
      );
    },
    [
      onMoveComponent,
      onResizeComponent,
      onSelectComponent,
      panelChildrenById,
      selectedComponentId,
      zoom,
    ],
  );

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
                {rootFloatingComponents.map((component) => renderFloatingComponent(component))}

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
