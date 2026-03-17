import { FIXED_ZONE_PADDING } from "@/components/Canvas/constants";
import type {
  HorizontalToolBarLayoutItem,
  VerticalToolBarLayoutItem,
} from "@/components/Canvas/fixedZoneLayout";
import { getOrderedChildren } from "@/components/Canvas/fixedZoneHelpers";
import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

interface ToolBarZoneProps {
  northToolBarLayout: HorizontalToolBarLayoutItem[];
  southToolBarLayout: HorizontalToolBarLayoutItem[];
  westToolBarLayout: VerticalToolBarLayoutItem[];
  eastToolBarLayout: VerticalToolBarLayoutItem[];
  sideTopInset: number;
  sideBottomInset: number;
  componentsById: Map<string, CanvasComponentModel>;
  components: CanvasComponentModel[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  getComponentLabel: (component: CanvasComponentModel, fallback: string) => string;
}

function getToolBarButtons(
  toolBar: CanvasComponentModel,
  componentsById: Map<string, CanvasComponentModel>,
  components: CanvasComponentModel[],
  getComponentLabel: (component: CanvasComponentModel, fallback: string) => string,
) {
  const children = getOrderedChildren(toolBar, componentsById, components);

  if (children.length === 0) {
    return [
      {
        id: `${toolBar.id}-preview-button`,
        label: "Button",
        componentId: undefined,
      },
    ];
  }

  return children.map((child) => ({
    id: child.id,
    label: getComponentLabel(child, "Button"),
    componentId: child.id,
  }));
}

export function ToolBarZone({
  northToolBarLayout,
  southToolBarLayout,
  westToolBarLayout,
  eastToolBarLayout,
  sideTopInset,
  sideBottomInset,
  componentsById,
  components,
  selectedComponentId,
  onSelectComponent,
  getComponentLabel,
}: ToolBarZoneProps) {
  return (
    <>
      {northToolBarLayout.map(({ toolBar, top, thickness }) => {
        const childButtons = getToolBarButtons(toolBar, componentsById, components, getComponentLabel);

        return (
          <div
            key={toolBar.id}
            data-canvas-fixed="true"
            className={`absolute z-10 rounded border border-vscode-panel-border bg-vscode-panel-background/95 text-vscode-foreground shadow ${
              selectedComponentId === toolBar.id ? "ring-1 ring-(--canvas-selection)" : ""
            }`}
            style={{
              top,
              left: FIXED_ZONE_PADDING,
              right: FIXED_ZONE_PADDING,
              height: thickness,
            }}
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
                    childButton.componentId ? "hover:bg-accent/70" : "cursor-default text-muted-foreground"
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
        const childButtons = getToolBarButtons(toolBar, componentsById, components, getComponentLabel);

        return (
          <div
            key={toolBar.id}
            data-canvas-fixed="true"
            className={`absolute z-10 rounded border border-vscode-panel-border bg-vscode-panel-background/95 text-vscode-foreground shadow ${
              selectedComponentId === toolBar.id ? "ring-1 ring-(--canvas-selection)" : ""
            }`}
            style={{
              bottom,
              left: FIXED_ZONE_PADDING,
              right: FIXED_ZONE_PADDING,
              height: thickness,
            }}
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
                    childButton.componentId ? "hover:bg-accent/70" : "cursor-default text-muted-foreground"
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
        const childButtons = getToolBarButtons(toolBar, componentsById, components, getComponentLabel);

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
                    childButton.componentId ? "hover:bg-accent/70" : "cursor-default text-muted-foreground"
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
        const childButtons = getToolBarButtons(toolBar, componentsById, components, getComponentLabel);

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
                    childButton.componentId ? "hover:bg-accent/70" : "cursor-default text-muted-foreground"
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
    </>
  );
}
