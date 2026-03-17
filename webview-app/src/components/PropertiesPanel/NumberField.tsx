import { useEffect, useState } from "react";

import { FormField } from "@/components/PropertiesPanel/FormField";
import { cn } from "@/lib/utils";
import { type NumericInputOptions, parseClampedNumericInput } from "@/schemas/parsers";

interface NumberFieldProps {
  label: string;
  value: number;
  range: NumericInputOptions;
  onChange: (value: number) => void;
}

const INPUT_CLASS_NAME =
  "flex h-8 w-full rounded border border-vscode-panel-border bg-vscode-input-background px-2 py-1 text-sm text-vscode-input-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function NumberField({ label, value, range, onChange }: NumberFieldProps) {
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
    <FormField label={label} error={error}>
      <input
        type="text"
        inputMode="numeric"
        className={cn(INPUT_CLASS_NAME, error && "border-destructive")}
        value={inputValue}
        aria-invalid={error ? "true" : "false"}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
      />
    </FormField>
  );
}
