import { useEffect, useState } from "react";

import { parseClampedNumericInput, parseHexColorInput, type NumericInputOptions } from "@/schemas/parsers";
import type { CanvasComponent } from "@/types/canvas";

interface PropertiesPanelProps {
  component: CanvasComponent | null;
  onUpdateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
}

interface NumberFieldProps {
  label: string;
  value: number;
  range: NumericInputOptions;
  onChange: (value: number) => void;
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const FIELD_CLASS_NAME =
  "rounded border bg-vscode-input-background px-2 py-1 text-sm text-vscode-input-foreground outline-none transition-colors focus:border-ring";

function NumberField({ label, value, range, onChange }: NumberFieldProps) {
  const [inputValue, setInputValue] = useState(String(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(String(value));
    setError(null);
  }, [value]);

  const handleChange = (nextValue: string) => {
    setInputValue(nextValue);

    const parsed = parseClampedNumericInput(nextValue, range);
    if (parsed === null) {
      setError("Enter a valid number");
      return;
    }

    setError(null);
    onChange(parsed);
  };

  const handleBlur = () => {
    const parsed = parseClampedNumericInput(inputValue, range);

    if (parsed === null) {
      setInputValue(String(value));
      setError(null);
      return;
    }

    setInputValue(String(parsed));
  };

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        className={`${FIELD_CLASS_NAME} ${error ? "border-destructive" : "border-vscode-panel-border"}`}
        value={inputValue}
        aria-invalid={error ? "true" : "false"}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
      />
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </label>
  );
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(value);
    setError(null);
  }, [value]);

  const handleChange = (nextValue: string) => {
    setInputValue(nextValue);

    const parsed = parseHexColorInput(nextValue);
    if (parsed === null) {
      setError("Use #RGB or #RRGGBB");
      return;
    }

    setError(null);
    onChange(parsed);
  };

  const handleBlur = () => {
    const parsed = parseHexColorInput(inputValue);

    if (parsed === null) {
      setInputValue(value);
      setError(null);
      return;
    }

    setInputValue(parsed);
  };

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="text"
        className={`${FIELD_CLASS_NAME} ${error ? "border-destructive" : "border-vscode-panel-border"}`}
        value={inputValue}
        aria-invalid={error ? "true" : "false"}
        placeholder="#RRGGBB"
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
      />
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </label>
  );
}

const NUMERIC_RANGES: Record<"x" | "y" | "width" | "height" | "fontSize", NumericInputOptions> = {
  x: { min: 0, max: 9_999, integer: true },
  y: { min: 0, max: 9_999, integer: true },
  width: { min: 48, max: 2_000, integer: true },
  height: { min: 28, max: 2_000, integer: true },
  fontSize: { min: 1, max: 200, integer: true },
};

export function PropertiesPanel({ component, onUpdateComponent }: PropertiesPanelProps) {
  if (!component) {
    return (
      <section className="flex h-full flex-col" aria-label="Properties panel">
        <header className="border-b border-vscode-panel-border px-4 py-3">
          <h2 className="text-sm font-semibold">Properties</h2>
        </header>
        <div className="p-4 text-sm text-muted-foreground">Select a component on canvas to edit its properties.</div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col" aria-label="Properties panel">
      <header className="border-b border-vscode-panel-border px-4 py-3">
        <h2 className="text-sm font-semibold">Properties</h2>
      </header>

      <div className="space-y-3 overflow-y-auto p-4">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Text</span>
          <input
            type="text"
            className={`${FIELD_CLASS_NAME} border-vscode-panel-border`}
            value={component.text}
            onChange={(event) => onUpdateComponent(component.id, { text: event.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Font Family</span>
          <input
            type="text"
            className={`${FIELD_CLASS_NAME} border-vscode-panel-border`}
            value={component.fontFamily}
            onChange={(event) => onUpdateComponent(component.id, { fontFamily: event.target.value })}
          />
        </label>

        <NumberField
          label="Font Size"
          value={component.fontSize}
          range={NUMERIC_RANGES.fontSize}
          onChange={(fontSize) => onUpdateComponent(component.id, { fontSize })}
        />

        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="X"
            value={component.x}
            range={NUMERIC_RANGES.x}
            onChange={(x) => onUpdateComponent(component.id, { x })}
          />
          <NumberField
            label="Y"
            value={component.y}
            range={NUMERIC_RANGES.y}
            onChange={(y) => onUpdateComponent(component.id, { y })}
          />
          <NumberField
            label="Width"
            value={component.width}
            range={NUMERIC_RANGES.width}
            onChange={(width) => onUpdateComponent(component.id, { width })}
          />
          <NumberField
            label="Height"
            value={component.height}
            range={NUMERIC_RANGES.height}
            onChange={(height) => onUpdateComponent(component.id, { height })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label="Background"
            value={component.backgroundColor}
            onChange={(backgroundColor) => onUpdateComponent(component.id, { backgroundColor })}
          />

          <ColorField
            label="Foreground"
            value={component.textColor}
            onChange={(textColor) => onUpdateComponent(component.id, { textColor })}
          />
        </div>
      </div>
    </section>
  );
}
