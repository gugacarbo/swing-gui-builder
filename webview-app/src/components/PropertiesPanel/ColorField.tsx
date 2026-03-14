import { useEffect, useState } from "react";

import { FormField } from "@/components/PropertiesPanel/FormField";
import { parseHexColorInput } from "@/schemas/parsers";
import { cn } from "@/lib/utils";

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const INPUT_CLASS_NAME =
  "flex h-8 w-full rounded border border-vscode-panel-border bg-vscode-input-background px-2 py-1 text-sm text-vscode-input-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(value);
    setError(null);
  }, [value]);

  const handleTextChange = (nextValue: string) => {
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

  const handleColorPickerChange = (nextValue: string) => {
    const parsed = parseHexColorInput(nextValue);
    if (!parsed) {
      return;
    }

    setInputValue(parsed);
    setError(null);
    onChange(parsed);
  };

  return (
    <FormField label={label} error={error}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-8 w-10 cursor-pointer rounded border border-vscode-panel-border bg-transparent p-0"
          value={parseHexColorInput(inputValue) ?? value}
          aria-label={`${label} color picker`}
          onChange={(event) => handleColorPickerChange(event.target.value)}
        />
        <input
          type="text"
          className={cn(INPUT_CLASS_NAME, error && "border-destructive")}
          value={inputValue}
          aria-invalid={error ? "true" : "false"}
          placeholder="#RRGGBB"
          onChange={(event) => handleTextChange(event.target.value)}
          onBlur={handleBlur}
        />
      </div>
    </FormField>
  );
}
