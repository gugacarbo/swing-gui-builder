import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

type ToolBarEdge = "north" | "south" | "east" | "west";

const FIXED_ZONE_PADDING = 8;
const FIXED_ZONE_GAP = 4;
const FIXED_ZONE_SECTION_GAP = 6;
const MENU_BAR_MIN_HEIGHT = 30;
const TOOL_BAR_MIN_THICKNESS = 36;
const TOOL_BAR_MIN_SIDE_WIDTH = 44;

function normalizeToolBarPosition(position: CanvasComponentModel["position"] | undefined): ToolBarEdge {
  switch (position) {
    case "north":
    case "top":
      return "north";
    case "south":
    case "bottom":
      return "south";
    case "east":
    case "right":
      return "east";
    case "west":
    case "left":
      return "west";
    default:
      return "north";
  }
}

function getOrderedChildren(
  parent: CanvasComponentModel,
  componentsById: Map<string, CanvasComponentModel>,
  allComponents: CanvasComponentModel[],
): CanvasComponentModel[] {
  const explicitChildren = (parent.children ?? [])
    .map((childId) => componentsById.get(childId))
    .filter((child): child is CanvasComponentModel => child !== undefined);
  const explicitChildIds = new Set(explicitChildren.map((child) => child.id));
  const implicitChildren = allComponents.filter(
    (candidate) => candidate.parentId === parent.id && !explicitChildIds.has(candidate.id),
  );

  return [...explicitChildren, ...implicitChildren];
}

function collectDescendantIds(
  parent: CanvasComponentModel,
  componentsById: Map<string, CanvasComponentModel>,
  allComponents: CanvasComponentModel[],
  collected: Set<string>,
  visiting = new Set<string>(),
): void {
  if (visiting.has(parent.id)) {
    return;
  }

  visiting.add(parent.id);
  collected.add(parent.id);

  for (const child of getOrderedChildren(parent, componentsById, allComponents)) {
    collectDescendantIds(child, componentsById, allComponents, collected, visiting);
  }

  visiting.delete(parent.id);
}

function getStackExtent<T>(items: T[], getSize: (item: T, index: number) => number): number {
  if (items.length === 0) {
    return 0;
  }

  const size = items.reduce((total, item, index) => total + getSize(item, index), 0);
  return size + FIXED_ZONE_GAP * (items.length - 1);
}

function getComponentLabel(component: CanvasComponentModel, fallback: string): string {
  const text = component.text.trim();
  if (text.length > 0) {
    return text;
  }

  const variableName = component.variableName.trim();
  if (variableName.length > 0) {
    return variableName;
  }

  return fallback;
}

export function Canvas({ components, selectedComponentId, onSelectComponent, onAddComponent, onMoveComponent, onResizeComponent }: CanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
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

  const componentsById = useMemo(() => new Map(components.map((component) => [component.id, component])), [components]);

  const { floatingComponents, menuBars, toolBarsByEdge } = useMemo(() => {
    const menuBarComponents = components.filter((component) => component.type === "MenuBar");
    const toolBarComponents = components.filter((component) => component.type === "ToolBar");

    const fixedComponentIds = new Set<string>();
    for (const menuBar of menuBarComponents) {
      collectDescendantIds(menuBar, componentsById, components, fixedComponentIds);
    }
    for (const toolBar of toolBarComponents) {
      collectDescendantIds(toolBar, componentsById, components, fixedComponentIds);
    }

    const groupedToolBars: Record<ToolBarEdge, CanvasComponentModel[]> = {
      north: [],
      south: [],
      east: [],
      west: [],
    };

    for (const toolBar of toolBarComponents) {
      groupedToolBars[normalizeToolBarPosition(toolBar.position)].push(toolBar);
    }

    return {
      floatingComponents: components.filter((component) => !fixedComponentIds.has(component.id)),
      menuBars: menuBarComponents,
      toolBarsByEdge: groupedToolBars,
    };
  }, [components, componentsById]);

  useEffect(() => {
    if (!expandedMenuId) {
      return;
    }

    if (!components.some((component) => component.id === expandedMenuId)) {
      setExpandedMenuId(null);
    }
  }, [components, expandedMenuId]);

  const menuBarHeights = menuBars.map((menuBar) => Math.max(MENU_BAR_MIN_HEIGHT, Math.round(menuBar.height || MENU_BAR_MIN_HEIGHT)));
  const northToolBarSizes = toolBarsByEdge.north.map((toolBar) =>
    Math.max(TOOL_BAR_MIN_THICKNESS, Math.round(toolBar.height || TOOL_BAR_MIN_THICKNESS)),
  );
  const southToolBarSizes = toolBarsByEdge.south.map((toolBar) =>
    Math.max(TOOL_BAR_MIN_THICKNESS, Math.round(toolBar.height || TOOL_BAR_MIN_THICKNESS)),
  );

  const menuBarStackHeight = getStackExtent(menuBars, (_, index) => menuBarHeights[index] ?? MENU_BAR_MIN_HEIGHT);
  const northToolBarStackHeight = getStackExtent(
    toolBarsByEdge.north,
    (_, index) => northToolBarSizes[index] ?? TOOL_BAR_MIN_THICKNESS,
  );
  const southToolBarStackHeight = getStackExtent(
    toolBarsByEdge.south,
    (_, index) => southToolBarSizes[index] ?? TOOL_BAR_MIN_THICKNESS,
  );

  const topFixedHeight =
    menuBarStackHeight +
    northToolBarStackHeight +
    (menuBarStackHeight > 0 && northToolBarStackHeight > 0 ? FIXED_ZONE_SECTION_GAP : 0);

  const sideTopInset = FIXED_ZONE_PADDING + topFixedHeight + (topFixedHeight > 0 ? FIXED_ZONE_SECTION_GAP : 0);
  const sideBottomInset =
    FIXED_ZONE_PADDING +
    southToolBarStackHeight +
    (southToolBarStackHeight > 0 ? FIXED_ZONE_SECTION_GAP : 0);

  let menuTopOffset = FIXED_ZONE_PADDING;
  const menuBarLayout = menuBars.map((menuBar, index) => {
    const height = menuBarHeights[index];
    const top = menuTopOffset;
    menuTopOffset += height + FIXED_ZONE_GAP;

    return { menuBar, top, height };
  });

  const northToolBarsStart = FIXED_ZONE_PADDING + menuBarStackHeight + (menuBarStackHeight > 0 && toolBarsByEdge.north.length > 0 ? FIXED_ZONE_SECTION_GAP : 0);
  let northTopOffset = northToolBarsStart;
  const northToolBarLayout = toolBarsByEdge.north.map((toolBar, index) => {
    const thickness = northToolBarSizes[index];
    const top = northTopOffset;
    northTopOffset += thickness + FIXED_ZONE_GAP;

    return { toolBar, top, thickness };
  });

  let southBottomOffset = FIXED_ZONE_PADDING;
  const southToolBarLayout = toolBarsByEdge.south.map((toolBar, index) => {
    const thickness = southToolBarSizes[index];
    const bottom = southBottomOffset;
    southBottomOffset += thickness + FIXED_ZONE_GAP;

    return { toolBar, bottom, thickness };
  });

  let westTopOffset = sideTopInset;
  const westToolBarLayout = toolBarsByEdge.west.map((toolBar) => {
    const thickness = Math.max(TOOL_BAR_MIN_THICKNESS, Math.round(toolBar.height || TOOL_BAR_MIN_THICKNESS));
    const width = Math.max(TOOL_BAR_MIN_SIDE_WIDTH, Math.round(toolBar.width || TOOL_BAR_MIN_SIDE_WIDTH));
    const top = westTopOffset;
    westTopOffset += thickness + FIXED_ZONE_GAP;

    return { toolBar, top, thickness, width };
  });

  let eastTopOffset = sideTopInset;
  const eastToolBarLayout = toolBarsByEdge.east.map((toolBar) => {
    const thickness = Math.max(TOOL_BAR_MIN_THICKNESS, Math.round(toolBar.height || TOOL_BAR_MIN_THICKNESS));
    const width = Math.max(TOOL_BAR_MIN_SIDE_WIDTH, Math.round(toolBar.width || TOOL_BAR_MIN_SIDE_WIDTH));
    const top = eastTopOffset;
    eastTopOffset += thickness + FIXED_ZONE_GAP;

    return { toolBar, top, thickness, width };
  });

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!(event.target as HTMLElement | null)?.closest("[data-canvas-component='true'], [data-canvas-fixed='true']")) {
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

          {menuBarLayout.map(({ menuBar, top, height }) => {
            const menuChildren = getOrderedChildren(menuBar, componentsById, components).filter((child) => child.type === "Menu");
            const menuEntries =
              menuChildren.length > 0
                ? menuChildren.map((menu) => {
                    const menuItems = getOrderedChildren(menu, componentsById, components).filter(
                      (child) => child.type === "MenuItem" || child.type === "Menu",
                    );

                    return {
                      id: menu.id,
                      componentId: menu.id,
                      label: getComponentLabel(menu, "Menu"),
                      items:
                        menuItems.length > 0
                          ? menuItems.map((item) => ({
                              id: item.id,
                              componentId: item.id,
                              label: getComponentLabel(item, item.type === "MenuItem" ? "Menu Item" : "Menu"),
                              isSubmenu: item.type === "Menu",
                            }))
                          : [
                              {
                                id: `${menu.id}-preview-item`,
                                componentId: undefined,
                                label: "Menu Item",
                                isSubmenu: false,
                              },
                            ],
                    };
                  })
                : [
                    {
                      id: menuBar.id,
                      componentId: menuBar.id,
                      label: getComponentLabel(menuBar, "Menu"),
                      items: [
                        {
                          id: `${menuBar.id}-preview-item`,
                          componentId: undefined,
                          label: "Menu Item",
                          isSubmenu: false,
                        },
                      ],
                    },
                  ];

            return (
              <div
                key={menuBar.id}
                data-canvas-fixed="true"
                className={`absolute z-20 rounded border border-vscode-panel-border bg-vscode-panel-background/95 text-[11px] text-vscode-foreground shadow ${
                  selectedComponentId === menuBar.id ? "ring-1 ring-(--canvas-selection)" : ""
                }`}
                style={{ top, left: FIXED_ZONE_PADDING, right: FIXED_ZONE_PADDING, height }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectComponent(menuBar.id);
                }}
              >
                <div className="flex h-full items-center gap-1 px-1">
                  {menuEntries.map((menu) => {
                    const isExpanded = expandedMenuId === menu.id;

                    return (
                      <div key={menu.id} className="relative">
                        <button
                          type="button"
                          data-canvas-fixed="true"
                          className={`rounded px-2 py-1 text-[11px] ${
                            isExpanded ? "bg-accent text-accent-foreground" : "hover:bg-accent/70"
                          }`}
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectComponent(menu.componentId);
                            setExpandedMenuId((current) => (current === menu.id ? null : menu.id));
                          }}
                        >
                          {menu.label}
                        </button>

                        {isExpanded ? (
                          <div className="absolute left-0 top-[calc(100%+2px)] min-w-40 rounded border border-vscode-panel-border bg-vscode-panel-background py-1 shadow-lg">
                            {menu.items.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                data-canvas-fixed="true"
                                disabled={!item.componentId}
                                className={`flex w-full items-center justify-between gap-2 px-3 py-1 text-left text-[11px] ${
                                  item.componentId
                                    ? "hover:bg-accent/70"
                                    : "cursor-default text-muted-foreground"
                                }`}
                                onPointerDown={(event) => {
                                  event.stopPropagation();
                                }}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (item.componentId) {
                                    onSelectComponent(item.componentId);
                                  }
                                }}
                              >
                                <span>{item.label}</span>
                                {item.isSubmenu ? <span className="text-muted-foreground">▶</span> : null}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {northToolBarLayout.map(({ toolBar, top, thickness }) => {
            const children = getOrderedChildren(toolBar, componentsById, components);
            const childButtons =
              children.length > 0
                ? children.map((child) => ({
                    id: child.id,
                    label: getComponentLabel(child, "Button"),
                    componentId: child.id,
                  }))
                : [{ id: `${toolBar.id}-preview-button`, label: "Button", componentId: undefined }];

            return (
              <div
                key={toolBar.id}
                data-canvas-fixed="true"
                className={`absolute z-10 rounded border border-vscode-panel-border bg-vscode-panel-background/95 text-vscode-foreground shadow ${
                  selectedComponentId === toolBar.id ? "ring-1 ring-(--canvas-selection)" : ""
                }`}
                style={{ top, left: FIXED_ZONE_PADDING, right: FIXED_ZONE_PADDING, height: thickness }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectComponent(toolBar.id);
                }}
              >
                <div className="flex h-full items-center gap-1 overflow-x-auto p-1">
                  {childButtons.map((childButton) => (
                    <button
                      key={childButton.id}
                      type="button"
                      data-canvas-fixed="true"
                      disabled={!childButton.componentId}
                      className={`rounded border border-vscode-panel-border bg-vscode-background px-2 py-1 text-[11px] whitespace-nowrap ${
                        childButton.componentId
                          ? "hover:bg-accent/70"
                          : "cursor-default text-muted-foreground"
                      } ${
                        childButton.componentId && selectedComponentId === childButton.componentId
                          ? "border-(--canvas-selection)"
                          : ""
                      }`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (childButton.componentId) {
                          onSelectComponent(childButton.componentId);
                        }
                      }}
                    >
                      {childButton.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {southToolBarLayout.map(({ toolBar, bottom, thickness }) => {
            const children = getOrderedChildren(toolBar, componentsById, components);
            const childButtons =
              children.length > 0
                ? children.map((child) => ({
                    id: child.id,
                    label: getComponentLabel(child, "Button"),
                    componentId: child.id,
                  }))
                : [{ id: `${toolBar.id}-preview-button`, label: "Button", componentId: undefined }];

            return (
              <div
                key={toolBar.id}
                data-canvas-fixed="true"
                className={`absolute z-10 rounded border border-vscode-panel-border bg-vscode-panel-background/95 text-vscode-foreground shadow ${
                  selectedComponentId === toolBar.id ? "ring-1 ring-(--canvas-selection)" : ""
                }`}
                style={{ bottom, left: FIXED_ZONE_PADDING, right: FIXED_ZONE_PADDING, height: thickness }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectComponent(toolBar.id);
                }}
              >
                <div className="flex h-full items-center gap-1 overflow-x-auto p-1">
                  {childButtons.map((childButton) => (
                    <button
                      key={childButton.id}
                      type="button"
                      data-canvas-fixed="true"
                      disabled={!childButton.componentId}
                      className={`rounded border border-vscode-panel-border bg-vscode-background px-2 py-1 text-[11px] whitespace-nowrap ${
                        childButton.componentId
                          ? "hover:bg-accent/70"
                          : "cursor-default text-muted-foreground"
                      } ${
                        childButton.componentId && selectedComponentId === childButton.componentId
                          ? "border-(--canvas-selection)"
                          : ""
                      }`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (childButton.componentId) {
                          onSelectComponent(childButton.componentId);
                        }
                      }}
                    >
                      {childButton.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {westToolBarLayout.map(({ toolBar, top, thickness, width }) => {
            const children = getOrderedChildren(toolBar, componentsById, components);
            const childButtons =
              children.length > 0
                ? children.map((child) => ({
                    id: child.id,
                    label: getComponentLabel(child, "Button"),
                    componentId: child.id,
                  }))
                : [{ id: `${toolBar.id}-preview-button`, label: "Button", componentId: undefined }];

            return (
              <div
                key={toolBar.id}
                data-canvas-fixed="true"
                className={`absolute z-10 rounded border border-vscode-panel-border bg-vscode-panel-background/95 text-vscode-foreground shadow ${
                  selectedComponentId === toolBar.id ? "ring-1 ring-(--canvas-selection)" : ""
                }`}
                style={{
                  left: FIXED_ZONE_PADDING,
                  top,
                  width,
                  height: thickness,
                  maxHeight: `calc(100% - ${sideTopInset + sideBottomInset}px)`,
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectComponent(toolBar.id);
                }}
              >
                <div className="flex h-full flex-col gap-1 overflow-y-auto p-1">
                  {childButtons.map((childButton) => (
                    <button
                      key={childButton.id}
                      type="button"
                      data-canvas-fixed="true"
                      disabled={!childButton.componentId}
                      className={`rounded border border-vscode-panel-border bg-vscode-background px-2 py-1 text-[11px] ${
                        childButton.componentId
                          ? "hover:bg-accent/70"
                          : "cursor-default text-muted-foreground"
                      } ${
                        childButton.componentId && selectedComponentId === childButton.componentId
                          ? "border-(--canvas-selection)"
                          : ""
                      }`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (childButton.componentId) {
                          onSelectComponent(childButton.componentId);
                        }
                      }}
                    >
                      {childButton.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {eastToolBarLayout.map(({ toolBar, top, thickness, width }) => {
            const children = getOrderedChildren(toolBar, componentsById, components);
            const childButtons =
              children.length > 0
                ? children.map((child) => ({
                    id: child.id,
                    label: getComponentLabel(child, "Button"),
                    componentId: child.id,
                  }))
                : [{ id: `${toolBar.id}-preview-button`, label: "Button", componentId: undefined }];

            return (
              <div
                key={toolBar.id}
                data-canvas-fixed="true"
                className={`absolute z-10 rounded border border-vscode-panel-border bg-vscode-panel-background/95 text-vscode-foreground shadow ${
                  selectedComponentId === toolBar.id ? "ring-1 ring-(--canvas-selection)" : ""
                }`}
                style={{
                  right: FIXED_ZONE_PADDING,
                  top,
                  width,
                  height: thickness,
                  maxHeight: `calc(100% - ${sideTopInset + sideBottomInset}px)`,
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectComponent(toolBar.id);
                }}
              >
                <div className="flex h-full flex-col gap-1 overflow-y-auto p-1">
                  {childButtons.map((childButton) => (
                    <button
                      key={childButton.id}
                      type="button"
                      data-canvas-fixed="true"
                      disabled={!childButton.componentId}
                      className={`rounded border border-vscode-panel-border bg-vscode-background px-2 py-1 text-[11px] ${
                        childButton.componentId
                          ? "hover:bg-accent/70"
                          : "cursor-default text-muted-foreground"
                      } ${
                        childButton.componentId && selectedComponentId === childButton.componentId
                          ? "border-(--canvas-selection)"
                          : ""
                      }`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (childButton.componentId) {
                          onSelectComponent(childButton.componentId);
                        }
                      }}
                    >
                      {childButton.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
