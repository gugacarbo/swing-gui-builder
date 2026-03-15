import type { NumericInputOptions } from "@/schemas/parsers";
import type { CanvasComponent } from "@/types/canvas";

import { ColorField } from "@/components/PropertiesPanel/ColorField";
import { FormField } from "@/components/PropertiesPanel/FormField";
import { NumberField } from "@/components/PropertiesPanel/NumberField";

interface PropertiesPanelProps {
  component: CanvasComponent | null;
  onUpdateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
}

const TEXT_INPUT_CLASS_NAME =
  "flex h-8 w-full rounded border border-vscode-panel-border bg-vscode-input-background px-2 py-1 text-sm text-vscode-input-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const NUMERIC_RANGES: Record<"x" | "y" | "width" | "height" | "fontSize", NumericInputOptions> = {
  x: { min: 0, max: 9_999, integer: true },
  y: { min: 0, max: 9_999, integer: true },
  width: { min: 48, max: 2_000, integer: true },
  height: { min: 28, max: 2_000, integer: true },
  fontSize: { min: 1, max: 200, integer: true },
};

const TEXT_FIELDS: ReadonlyArray<{ label: string; key: "text" | "fontFamily" }> = [
  { label: "Text", key: "text" },
  { label: "Font Family", key: "fontFamily" },
];

const POSITION_AND_SIZE_FIELDS: ReadonlyArray<{
  label: string;
  key: "x" | "y" | "width" | "height";
}> = [
  { label: "X", key: "x" },
  { label: "Y", key: "y" },
  { label: "Width", key: "width" },
  { label: "Height", key: "height" },
];

const COLOR_FIELDS: ReadonlyArray<{ label: string; key: "backgroundColor" | "textColor" }> = [
  { label: "Background", key: "backgroundColor" },
  { label: "Foreground", key: "textColor" },
];

const RANGE_FIELDS: ReadonlyArray<{ label: string; key: "value" | "min" | "max" }> = [
  { label: "Value", key: "value" },
  { label: "Min", key: "min" },
  { label: "Max", key: "max" },
];

const RANGE_INPUTS: Record<"value" | "min" | "max", NumericInputOptions> = {
  value: { min: -9_999, max: 9_999, integer: true },
  min: { min: -9_999, max: 9_999, integer: true },
  max: { min: -9_999, max: 9_999, integer: true },
};

const SELECT_CLASS_NAME = `${TEXT_INPUT_CLASS_NAME} pr-8`;
const CHECKBOX_TYPES = new Set<CanvasComponent["type"]>(["CheckBox", "RadioButton"]);
const ITEM_TYPES = new Set<CanvasComponent["type"]>(["ComboBox", "List"]);
const RANGE_TYPES = new Set<CanvasComponent["type"]>(["ProgressBar", "Slider", "Spinner"]);
const TOOLBAR_POSITION_OPTIONS: ReadonlyArray<{ label: string; value: "top" | "bottom" | "left" | "right" }> = [
  { label: "Top (north)", value: "top" },
  { label: "Bottom (south)", value: "bottom" },
  { label: "Left (west)", value: "left" },
  { label: "Right (east)", value: "right" },
];

function toToolBarPositionValue(position: CanvasComponent["position"] | undefined): "top" | "bottom" | "left" | "right" {
  switch (position) {
    case "north":
      return "top";
    case "south":
      return "bottom";
    case "west":
      return "left";
    case "east":
      return "right";
    case "bottom":
    case "left":
    case "right":
    case "top":
    default:
      return position ?? "top";
  }
}

function PropertiesHeader() {
  return (
    <header className="border-b border-vscode-panel-border px-4 py-3">
      <h2 className="text-sm font-semibold">Properties</h2>
    </header>
  );
}

export function PropertiesPanel({ component, onUpdateComponent }: PropertiesPanelProps) {
  if (!component) {
    return (
      <section className="flex h-full flex-col" aria-label="Properties panel">
        <PropertiesHeader />
        <div className="p-4 text-sm text-muted-foreground">Select a component on canvas to edit its properties.</div>
      </section>
    );
  }

  const isSelectableType = CHECKBOX_TYPES.has(component.type);
  const hasItems = ITEM_TYPES.has(component.type);
  const hasRange = RANGE_TYPES.has(component.type);
  const hasToolBarPosition = component.type === "ToolBar";

  return (
    <section className="flex h-full flex-col" aria-label="Properties panel">
      <PropertiesHeader />

      <div className="space-y-3 overflow-y-auto p-4">
        {TEXT_FIELDS.map(({ label, key }) => (
          <FormField key={key} label={label}>
            <input
              type="text"
              className={TEXT_INPUT_CLASS_NAME}
              value={component[key]}
              onChange={(event) => onUpdateComponent(component.id, { [key]: event.target.value })}
            />
          </FormField>
        ))}

        <NumberField
          label="Font Size"
          value={component.fontSize}
          range={NUMERIC_RANGES.fontSize}
          onChange={(fontSize) => onUpdateComponent(component.id, { fontSize })}
        />

        <div className="grid grid-cols-2 gap-2">
          {POSITION_AND_SIZE_FIELDS.map(({ label, key }) => (
            <NumberField
              key={key}
              label={label}
              value={component[key]}
              range={NUMERIC_RANGES[key]}
              onChange={(nextValue) => onUpdateComponent(component.id, { [key]: nextValue })}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {COLOR_FIELDS.map(({ label, key }) => (
            <ColorField
              key={key}
              label={label}
              value={component[key]}
              onChange={(nextValue) => onUpdateComponent(component.id, { [key]: nextValue })}
            />
          ))}
        </div>

        {isSelectableType ? (
          <FormField label="Selected">
            <input
              type="checkbox"
              className="h-4 w-4 accent-vscode-focusBorder"
              checked={component.selected ?? false}
              onChange={(event) => onUpdateComponent(component.id, { selected: event.target.checked })}
            />
          </FormField>
        ) : null}

        {hasItems ? (
          <FormField label="Items">
            <textarea
              className="min-h-24 w-full rounded border border-vscode-panel-border bg-vscode-input-background px-2 py-1 text-sm text-vscode-input-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
              value={(component.items ?? []).join("\n")}
              placeholder={"Item 1\nItem 2"}
              onChange={(event) =>
                onUpdateComponent(component.id, {
                  items: event.target.value
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0),
                })
              }
            />
          </FormField>
        ) : null}

        {hasRange ? (
          <div className="grid grid-cols-3 gap-2">
            {RANGE_FIELDS.map(({ label, key }) => (
              <NumberField
                key={key}
                label={label}
                value={component[key] ?? (key === "max" ? 100 : 0)}
                range={RANGE_INPUTS[key]}
                onChange={(nextValue) => onUpdateComponent(component.id, { [key]: nextValue })}
              />
            ))}
          </div>
        ) : null}

        {component.type === "Separator" ? (
          <FormField label="Orientation">
            <select
              className={SELECT_CLASS_NAME}
              value={component.orientation ?? "horizontal"}
              onChange={(event) =>
                onUpdateComponent(component.id, {
                  orientation: event.target.value as CanvasComponent["orientation"],
                })
              }
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </FormField>
        ) : null}

        {hasToolBarPosition ? (
          <FormField label="Position">
            <select
              className={SELECT_CLASS_NAME}
              value={toToolBarPositionValue(component.position)}
              onChange={(event) =>
                onUpdateComponent(component.id, {
                  position: event.target.value as CanvasComponent["position"],
                })
              }
            >
              {TOOLBAR_POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}
      </div>
    </section>
  );
}
