import { useEffect } from "react";

import type { UseUndoRedoResult } from "@/hooks/useUndoRedo";

type KeyboardShortcutHandler = UseUndoRedoResult<unknown>["undo"];
type KeyboardShortcutAvailability = UseUndoRedoResult<unknown>["canUndo"];

type KeyboardEventTarget = Pick<Window, "addEventListener" | "removeEventListener">;

export interface UseKeyboardShortcutsOptions {
  onUndo: KeyboardShortcutHandler;
  onRedo: KeyboardShortcutHandler;
  onDelete?: KeyboardShortcutHandler;
  onSave?: KeyboardShortcutHandler;
  canUndo?: KeyboardShortcutAvailability;
  canRedo?: KeyboardShortcutAvailability;
  canDelete?: KeyboardShortcutAvailability;
  canSave?: KeyboardShortcutAvailability;
  target?: KeyboardEventTarget;
  shouldIgnoreEvent?: (event: KeyboardEvent) => boolean;
}

function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  return (
    (target instanceof HTMLElement && target.isContentEditable) ||
    target.closest("input, textarea, [contenteditable='true'], [contenteditable='']") !== null
  );
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onDelete,
  onSave,
  canUndo = true,
  canRedo = true,
  canDelete = false,
  canSave = true,
  target = window,
  shouldIgnoreEvent = isEditableTarget,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreEvent(event)) {
        return;
      }

      const key = event.key.toLowerCase();
      const isDeleteShortcut = key === "delete";

      if (isDeleteShortcut && canDelete && onDelete) {
        event.preventDefault();
        onDelete();
        return;
      }

      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      const isSaveShortcut = key === "s" && !event.shiftKey;
      const isUndoShortcut = key === "z" && !event.shiftKey;
      const isRedoShortcut = key === "y" || (key === "z" && event.shiftKey);

      if (isSaveShortcut && canSave && onSave) {
        event.preventDefault();
        onSave();
        return;
      }

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
  }, [
    canDelete,
    canRedo,
    canSave,
    canUndo,
    onDelete,
    onRedo,
    onSave,
    onUndo,
    shouldIgnoreEvent,
    target,
  ]);
}
