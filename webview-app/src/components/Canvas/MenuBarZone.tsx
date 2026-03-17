import type { Dispatch, SetStateAction } from "react";

import { FIXED_ZONE_PADDING } from "@/components/Canvas/constants";
import type { MenuBarLayoutItem } from "@/components/Canvas/fixedZoneLayout";
import { getOrderedChildren } from "@/components/Canvas/fixedZoneHelpers";
import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

interface MenuBarZoneProps {
  menuBarLayout: MenuBarLayoutItem[];
  componentsById: Map<string, CanvasComponentModel>;
  components: CanvasComponentModel[];
  selectedComponentId: string | null;
  expandedMenuId: string | null;
  setExpandedMenuId: Dispatch<SetStateAction<string | null>>;
  onSelectComponent: (id: string | null) => void;
  getComponentLabel: (component: CanvasComponentModel, fallback: string) => string;
}

export function MenuBarZone({
  menuBarLayout,
  componentsById,
  components,
  selectedComponentId,
  expandedMenuId,
  setExpandedMenuId,
  onSelectComponent,
  getComponentLabel,
}: MenuBarZoneProps) {
  return menuBarLayout.map(({ menuBar, top, height }) => {
    const menuChildren = getOrderedChildren(menuBar, componentsById, components).filter(
      (child) => child.type === "Menu",
    );
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
  });
}
