import type { PointerEvent } from "react";

import type { ResizeHandle } from "@/lib/geometry";

interface ResizeHandleConfig {
  handle: ResizeHandle;
  className: string;
  cursorClassName: string;
}

export const RESIZE_HANDLES: ReadonlyArray<ResizeHandleConfig> = [
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

interface ResizeHandlesProps {
  isSelected: boolean;
  componentType: string;
  onHandlePointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    handle: ResizeHandle,
  ) => void;
}

export function ResizeHandles({
  isSelected,
  componentType,
  onHandlePointerDown,
}: ResizeHandlesProps) {
  if (!isSelected) {
    return null;
  }

  return RESIZE_HANDLES.map(({ handle, className, cursorClassName }) => (
    <button
      key={handle}
      type="button"
      aria-label={`Resize ${componentType} ${handle}`}
      onPointerDown={(event) => onHandlePointerDown(event, handle)}
      className={`canvas-selection-handle ${className} ${cursorClassName}`}
    />
  ));
}