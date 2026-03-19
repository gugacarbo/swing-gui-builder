import { useEffect, useState } from "react";

import { ColorField } from "@/components/PropertiesPanel/ColorField";
import { FormField } from "@/components/PropertiesPanel/FormField";
import { NumberField } from "@/components/PropertiesPanel/NumberField";
import { Button } from "@/components/ui/button";
import type { NumericInputOptions } from "@/schemas/parsers";

const FRAME_SIZE_RANGE: NumericInputOptions = {
  min: 1,
  max: 5_000,
  integer: true,
};

export interface FrameConfigurationValues {
  width: number;
  height: number;
  title: string;
  backgroundColor?: string;
}

interface FrameConfigModalProps {
  isOpen: boolean;
  initialWidth: number;
  initialHeight: number;
  initialTitle: string;
  initialBackgroundColor?: string;
  onApply: (values: FrameConfigurationValues) => void;
  onClose: () => void;
}

export function FrameConfigModal({
  isOpen,
  initialWidth,
  initialHeight,
  initialTitle,
  initialBackgroundColor,
  onApply,
  onClose,
}: FrameConfigModalProps) {
  const [frameWidth, setFrameWidth] = useState(initialWidth);
  const [frameHeight, setFrameHeight] = useState(initialHeight);
  const [frameTitle, setFrameTitle] = useState(initialTitle);
  const [useCustomBackground, setUseCustomBackground] = useState(initialBackgroundColor !== undefined);
  const [frameBackgroundColor, setFrameBackgroundColor] = useState(
    initialBackgroundColor ?? "#ffffff",
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFrameWidth(initialWidth);
    setFrameHeight(initialHeight);
    setFrameTitle(initialTitle);
    setUseCustomBackground(initialBackgroundColor !== undefined);
    setFrameBackgroundColor(initialBackgroundColor ?? "#ffffff");
  }, [initialBackgroundColor, initialHeight, initialTitle, initialWidth, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleApply = () => {
    onApply({
      width: frameWidth,
      height: frameHeight,
      title: frameTitle,
      backgroundColor: useCustomBackground ? frameBackgroundColor : undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="jframe-config-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="w-full max-w-md rounded-lg border border-vscode-panel-border bg-vscode-panel-background shadow-2xl">
        <header className="border-b border-vscode-panel-border px-4 py-3">
          <h2 id="jframe-config-title" className="text-sm font-semibold">
            JFrame Configuration
          </h2>
        </header>

        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Width"
              value={frameWidth}
              range={FRAME_SIZE_RANGE}
              onChange={setFrameWidth}
            />
            <NumberField
              label="Height"
              value={frameHeight}
              range={FRAME_SIZE_RANGE}
              onChange={setFrameHeight}
            />
          </div>

          <FormField label="Title">
            <input
              type="text"
              className="flex h-8 w-full rounded border border-vscode-panel-border bg-vscode-input-background px-2 py-1 text-sm text-vscode-input-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={frameTitle}
              onChange={(event) => setFrameTitle(event.target.value)}
            />
          </FormField>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-vscode-focusBorder"
              checked={useCustomBackground}
              onChange={(event) => setUseCustomBackground(event.target.checked)}
            />
            Use custom background color
          </label>

          {useCustomBackground ? (
            <ColorField
              label="Background"
              value={frameBackgroundColor}
              onChange={setFrameBackgroundColor}
            />
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t border-vscode-panel-border px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleApply}>
            Apply
          </Button>
        </footer>
      </section>
    </div>
  );
}
