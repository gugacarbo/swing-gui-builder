import { useRef, type CSSProperties, type ReactNode } from "react";

import { useDragInteraction } from "@/hooks/useDragInteraction";
import type { ResizeHandle } from "@/lib/geometry";
import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

interface CanvasComponentProps {
  component: CanvasComponentModel;
  zoom: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, nextX: number, nextY: number) => void;
  onResize: (
    id: string,
    updates: Pick<CanvasComponentModel, "x" | "y" | "width" | "height">,
  ) => void;
}

interface ComponentMinSize {
  minWidth: number;
  minHeight: number;
}

const RESIZE_HANDLES: ReadonlyArray<{
  handle: ResizeHandle;
  className: string;
  cursorClassName: string;
}> = [
  { handle: "nw", className: "-left-1 -top-1", cursorClassName: "cursor-nwse-resize" },
  {
    handle: "n",
    className: "left-1/2 -top-1 -translate-x-1/2",
    cursorClassName: "cursor-ns-resize",
  },
  { handle: "ne", className: "-right-1 -top-1", cursorClassName: "cursor-nesw-resize" },
  {
    handle: "e",
    className: "-right-1 top-1/2 -translate-y-1/2",
    cursorClassName: "cursor-ew-resize",
  },
  { handle: "se", className: "-bottom-1 -right-1", cursorClassName: "cursor-nwse-resize" },
  {
    handle: "s",
    className: "-bottom-1 left-1/2 -translate-x-1/2",
    cursorClassName: "cursor-ns-resize",
  },
  { handle: "sw", className: "-bottom-1 -left-1", cursorClassName: "cursor-nesw-resize" },
  {
    handle: "w",
    className: "-left-1 top-1/2 -translate-y-1/2",
    cursorClassName: "cursor-ew-resize",
  },
];

const FALLBACK_MIN_SIZE: ComponentMinSize = { minWidth: 48, minHeight: 28 };

const MIN_SIZE_BY_TYPE: Partial<Record<CanvasComponentModel["type"], ComponentMinSize>> = {
  Label: { minWidth: 24, minHeight: 20 },
  Button: { minWidth: 72, minHeight: 28 },
  TextField: { minWidth: 88, minHeight: 28 },
  TextArea: { minWidth: 88, minHeight: 52 },
  CheckBox: { minWidth: 72, minHeight: 24 },
  RadioButton: { minWidth: 72, minHeight: 24 },
  ComboBox: { minWidth: 92, minHeight: 28 },
  List: { minWidth: 96, minHeight: 60 },
  ProgressBar: { minWidth: 96, minHeight: 16 },
  Slider: { minWidth: 96, minHeight: 24 },
  Spinner: { minWidth: 72, minHeight: 28 },
  Separator: { minWidth: 24, minHeight: 6 },
  Panel: { minWidth: 72, minHeight: 48 },
};

function getComponentMinSize(component: CanvasComponentModel): ComponentMinSize {
  if (component.type === "Separator" && component.orientation === "vertical") {
    return { minWidth: 6, minHeight: 24 };
  }

  return MIN_SIZE_BY_TYPE[component.type] ?? FALLBACK_MIN_SIZE;
}

function getDisplayText(component: CanvasComponentModel, fallback: string): string {
  const value = component.text.trim();
  return value.length > 0 ? value : fallback;
}

function getRangeMetrics(component: CanvasComponentModel): {
  min: number;
  max: number;
  value: number;
  ratio: number;
} {
  const min = component.min ?? 0;
  const configuredMax = component.max ?? 100;
  const max = configuredMax > min ? configuredMax : min + 1;
  const rawValue = component.value ?? min;
  const value = Math.min(max, Math.max(min, rawValue));
  const ratio = (value - min) / (max - min);

  return { min, max, value, ratio };
}

function renderComponentPreview(component: CanvasComponentModel, textStyle: CSSProperties): ReactNode {
  const frameStyle = { ...textStyle, backgroundColor: component.backgroundColor };

  switch (component.type) {
    case "Label":
      return (
        <div className="pointer-events-none flex h-full w-full items-center px-1 text-left" style={textStyle}>
          <span className="truncate">{getDisplayText(component, "Label")}</span>
        </div>
      );
    case "Button":
      return (
        <div
          className="pointer-events-none flex h-full w-full items-center justify-center rounded-sm border border-vscode-panel-border px-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          style={frameStyle}
        >
          <span className="truncate">{getDisplayText(component, "Button")}</span>
        </div>
      );
    case "TextField":
      return (
        <div
          className="pointer-events-none flex h-full w-full items-center rounded-sm border border-vscode-panel-border px-2 text-left"
          style={frameStyle}
        >
          <span className="truncate">{getDisplayText(component, "TextField")}</span>
        </div>
      );
    case "TextArea":
      return (
        <div
          className="pointer-events-none h-full w-full rounded-sm border border-vscode-panel-border px-2 py-1 text-left"
          style={frameStyle}
        >
          <span className="block h-full overflow-hidden whitespace-pre-wrap break-words">
            {getDisplayText(component, "TextArea")}
          </span>
        </div>
      );
    case "CheckBox":
      return (
        <div className="pointer-events-none flex h-full w-full items-center gap-2 px-1 text-left" style={textStyle}>
          <span className="flex size-4 shrink-0 items-center justify-center rounded-[2px] border border-vscode-panel-border bg-vscode-input-background text-[10px] leading-none">
            {component.selected ? "✓" : ""}
          </span>
          <span className="truncate">{getDisplayText(component, "CheckBox")}</span>
        </div>
      );
    case "RadioButton":
      return (
        <div className="pointer-events-none flex h-full w-full items-center gap-2 px-1 text-left" style={textStyle}>
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-vscode-panel-border bg-vscode-input-background">
            {component.selected ? <span className="size-2 rounded-full bg-current" /> : null}
          </span>
          <span className="truncate">{getDisplayText(component, "RadioButton")}</span>
        </div>
      );
    case "ComboBox": {
      const selectedItem = component.items?.[0] ?? getDisplayText(component, "ComboBox");

      return (
        <div
          className="pointer-events-none flex h-full w-full items-center justify-between rounded-sm border border-vscode-panel-border px-2 text-left"
          style={frameStyle}
        >
          <span className="truncate">{selectedItem}</span>
          <span className="ml-2 text-[10px] leading-none opacity-80">▾</span>
        </div>
      );
    }
    case "List": {
      const entries = (component.items?.length ? component.items : ["Item 1", "Item 2", "Item 3"]).slice(0, 5);

      return (
        <div
          className="pointer-events-none flex h-full w-full flex-col gap-0.5 overflow-hidden rounded-sm border border-vscode-panel-border p-1 text-left"
          style={frameStyle}
        >
          {entries.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="truncate rounded px-1 py-0.5"
              style={index === 0 ? { backgroundColor: "var(--canvas-drop-target)" } : undefined}
            >
              {item}
            </span>
          ))}
        </div>
      );
    }
    case "ProgressBar": {
      const { ratio } = getRangeMetrics(component);

      return (
        <div className="pointer-events-none flex h-full w-full items-center px-1">
          <div className="relative h-3 w-full overflow-hidden rounded-full border border-vscode-panel-border bg-vscode-input-background">
            <span className="block h-full bg-vscode-button-background" style={{ width: `${ratio * 100}%` }} />
          </div>
        </div>
      );
    }
    case "Slider": {
      const { ratio } = getRangeMetrics(component);

      return (
        <div className="pointer-events-none relative flex h-full w-full items-center px-2">
          <span className="h-1 w-full rounded bg-vscode-panel-border" />
          <span
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-vscode-panel-border bg-vscode-input-background shadow-sm"
            style={{ left: `${ratio * 100}%` }}
          />
        </div>
      );
    }
    case "Spinner": {
      const { value } = getRangeMetrics(component);

      return (
        <div
          className="pointer-events-none flex h-full w-full overflow-hidden rounded-sm border border-vscode-panel-border text-left"
          style={frameStyle}
        >
          <span className="flex flex-1 items-center px-2">{value}</span>
          <span className="flex w-5 flex-col border-l border-vscode-panel-border text-[8px] leading-none">
            <span className="flex flex-1 items-center justify-center">▲</span>
            <span className="flex flex-1 items-center justify-center border-t border-vscode-panel-border">▼</span>
          </span>
        </div>
      );
    }
    case "Separator": {
      const isVertical = component.orientation === "vertical";

      return (
        <div className="pointer-events-none flex h-full w-full items-center justify-center p-1">
          <span className={isVertical ? "h-full w-px bg-vscode-panel-border" : "h-px w-full bg-vscode-panel-border"} />
        </div>
      );
    }
    case "Panel":
      return (
        <div
          className="pointer-events-none h-full w-full rounded-sm border border-vscode-panel-border p-2 text-left"
          style={frameStyle}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
            {getDisplayText(component, "Panel")}
          </span>
        </div>
      );
    default:
      return (
        <div
          className="pointer-events-none flex h-full w-full items-center justify-center rounded-sm border border-vscode-panel-border px-2 text-center shadow-sm"
          style={frameStyle}
        >
          <span className="truncate">{getDisplayText(component, component.type)}</span>
        </div>
      );
  }
}

export function CanvasComponent({
  component,
  zoom,
  isSelected,
  onSelect,
  onMove,
  onResize,
}: CanvasComponentProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const minSize = getComponentMinSize(component);
  const textStyle: CSSProperties = {
    color: component.textColor,
    fontFamily: component.fontFamily,
    fontSize: `${component.fontSize}px`,
  };

  const { isDragging, isResizing, handleMouseDown, handleMouseMove, handleMouseUp } =
    useDragInteraction({
      component,
      zoom,
      onSelect,
      onMove,
      onResize,
      minWidth: minSize.minWidth,
      minHeight: minSize.minHeight,
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
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect(component.id);
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
      {renderComponentPreview(component, textStyle)}

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
