import { useEffect } from "react";

import type { UseUndoRedoResult } from "@/hooks/useUndoRedo";

type KeyboardShortcutHandler = UseUndoRedoResult<unknown>["undo"];
type KeyboardShortcutAvailability = UseUndoRedoResult<unknown>["canUndo"];

type KeyboardEventTarget = Pick<Window, "addEventListener" | "removeEventListener">;

export interface UseKeyboardShortcutsOptions {
  onUndo: KeyboardShortcutHandler;
  onRedo: KeyboardShortcutHandler;
  canUndo?: KeyboardShortcutAvailability;
  canRedo?: KeyboardShortcutAvailability;
  target?: KeyboardEventTarget;
  shouldIgnoreEvent?: (event: KeyboardEvent) => boolean;
}

function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;

  return target?.isContentEditable === true || target?.closest("input, textarea") !== null;
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = true,
  target = window,
  shouldIgnoreEvent = isEditableTarget,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreEvent(event) || (!event.ctrlKey && !event.metaKey)) {
        return;
      }

      const key = event.key.toLowerCase();
      const isUndoShortcut = key === "z" && !event.shiftKey;
      const isRedoShortcut = key === "y" || (key === "z" && event.shiftKey);

      if (isUndoShortcut && canUndo) {
        event.preventDefault();
        onUndo();
        return;
      }

      if (isRedoShortcut && canRedo) {
        event.preventDefault();
        onRedo();
      }
    };

    target.addEventListener("keydown", handleKeyDown);

    return () => {
      target.removeEventListener("keydown", handleKeyDown);
    };
  }, [canRedo, canUndo, onRedo, onUndo, shouldIgnoreEvent, target]);
}
