import { type CSSProperties, type ReactNode, useRef } from "react";

import { CanvasComponentView } from "@/components/CanvasComponent/componentView";
import { getComponentMinSize } from "@/components/CanvasComponent/minSizes";
import { renderComponentPreview } from "@/components/CanvasComponent/previewRenderers";
import { useDragInteraction } from "@/hooks/useDragInteraction";
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
  children?: ReactNode;
}

export function CanvasComponent({
  component,
  zoom,
  isSelected,
  onSelect,
  onMove,
  onResize,
  children,
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

  return (
    <CanvasComponentView
      rootRef={rootRef}
      component={component}
      isSelected={isSelected}
      isDragging={isDragging}
      isResizing={isResizing}
      preview={renderComponentPreview(component, textStyle)}
      onMovePointerDown={(event) => handleMouseDown(event, { mode: "move" })}
      onPointerMove={handleMouseMove}
      onPointerFinish={handleMouseUp}
      onResizeHandlePointerDown={(event, handle) =>
        handleMouseDown(event, { mode: "resize", handle })
      }
      onSelect={onSelect}
    >
      {children}
    </CanvasComponentView>
  );
}
