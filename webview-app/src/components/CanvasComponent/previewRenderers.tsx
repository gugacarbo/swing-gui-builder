import type { CSSProperties, ReactNode } from "react";

import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

function getDisplayText(component: CanvasComponentModel, fallback: string): string {
  const value = component.text.trim();
  return value.length > 0 ? value : fallback;
}

function getPasswordDisplayText(component: CanvasComponentModel): string {
  const value = component.text.trim();
  if (value.length === 0) {
    return "••••••";
  }

  return "•".repeat(Math.min(value.length, 12));
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

export function renderComponentPreview(
  component: CanvasComponentModel,
  textStyle: CSSProperties,
): ReactNode {
  const frameStyle = { ...textStyle, backgroundColor: component.backgroundColor };

  switch (component.type) {
    case "Label":
      return (
        <div
          className="pointer-events-none flex h-full w-full items-center px-1 text-left"
          style={textStyle}
        >
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
    case "PasswordField":
      return (
        <div
          className="pointer-events-none flex h-full w-full items-center rounded-sm border border-vscode-panel-border px-2 text-left"
          style={frameStyle}
        >
          <span className="truncate tracking-[0.08em]">{getPasswordDisplayText(component)}</span>
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
        <div
          className="pointer-events-none flex h-full w-full items-center gap-2 px-1 text-left"
          style={textStyle}
        >
          <span className="flex size-4 shrink-0 items-center justify-center rounded-[2px] border border-vscode-panel-border bg-vscode-input-background text-[10px] leading-none">
            {component.selected ? "✓" : ""}
          </span>
          <span className="truncate">{getDisplayText(component, "CheckBox")}</span>
        </div>
      );
    case "RadioButton":
      return (
        <div
          className="pointer-events-none flex h-full w-full items-center gap-2 px-1 text-left"
          style={textStyle}
        >
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
      const entries = (
        component.items?.length ? component.items : ["Item 1", "Item 2", "Item 3"]
      ).slice(0, 5);

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
            <span
              className="block h-full bg-vscode-button-background"
              style={{ width: `${ratio * 100}%` }}
            />
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
            <span className="flex flex-1 items-center justify-center border-t border-vscode-panel-border">
              ▼
            </span>
          </span>
        </div>
      );
    }
    case "Separator": {
      const isVertical = component.orientation === "vertical";

      return (
        <div className="pointer-events-none flex h-full w-full items-center justify-center p-1">
          <span
            className={
              isVertical
                ? "h-full w-px bg-vscode-panel-border"
                : "h-px w-full bg-vscode-panel-border"
            }
          />
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
