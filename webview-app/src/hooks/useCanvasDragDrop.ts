import { useCallback, useEffect, useRef, useState } from "react";

import { getDefaultProps, getDefaultSize } from "@/lib/componentDefaults";
import { snapToGrid } from "@/lib/geometry";
import type { CanvasComponent, ComponentType } from "@/types/canvas";

interface Point {
  x: number;
  y: number;
}

const PALETTE_TO_COMPONENT_TYPE: Record<string, ComponentType> = {
  JPanel: "Panel",
  JButton: "Button",
  JLabel: "Label",
  JPasswordField: "PasswordField",
  JTextField: "TextField",
  JTextArea: "TextArea",
  JCheckBox: "CheckBox",
  JRadioButton: "RadioButton",
  JComboBox: "ComboBox",
  JList: "List",
  JProgressBar: "ProgressBar",
  JSlider: "Slider",
  JSpinner: "Spinner",
  JSeparator: "Separator",
  JMenuBar: "MenuBar",
  JMenu: "Menu",
  JMenuItem: "MenuItem",
  JToolBar: "ToolBar",
};

function toComponentType(rawType: string): ComponentType | null {
  return PALETTE_TO_COMPONENT_TYPE[rawType] ?? null;
}

function createComponentId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export interface UseCanvasDragDropOptions {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  pan: Point;
  components: CanvasComponent[];
  onAddComponent: (component: CanvasComponent) => void;
  onSelectComponent: (id: string) => void;
  resolveComponentType?: (paletteType: string) => ComponentType | null;
  createId?: () => string;
}

export interface UseCanvasDragDropResult {
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  isDragging: boolean;
}

function isPointInsideComponent(component: CanvasComponent, point: Point): boolean {
  return (
    point.x >= component.x &&
    point.x <= component.x + component.width &&
    point.y >= component.y &&
    point.y <= component.y + component.height
  );
}

function resolvePanelDropTarget(
  components: CanvasComponent[],
  point: Point,
): CanvasComponent | null {
  let targetPanel: CanvasComponent | null = null;
  let targetArea = Number.POSITIVE_INFINITY;

  for (const component of components) {
    if (component.type !== "Panel" || !isPointInsideComponent(component, point)) {
      continue;
    }

    const area = component.width * component.height;
    if (area <= targetArea) {
      targetPanel = component;
      targetArea = area;
    }
  }

  return targetPanel;
}

export function useCanvasDragDrop({
  viewportRef,
  zoom,
  pan,
  components,
  onAddComponent,
  onSelectComponent,
  resolveComponentType = toComponentType,
  createId = createComponentId,
}: UseCanvasDragDropOptions): UseCanvasDragDropResult {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    const viewportElement = viewportRef.current;
    if (!viewportElement) {
      return;
    }

    const handleNativeDragEnter = () => {
      dragDepthRef.current += 1;
      setIsDragging(true);
    };

    const handleNativeDragLeave = () => {
      dragDepthRef.current -= 1;
      if (dragDepthRef.current <= 0) {
        dragDepthRef.current = 0;
        setIsDragging(false);
      }
    };

    const handleNativeDrop = () => {
      dragDepthRef.current = 0;
      setIsDragging(false);
    };

    viewportElement.addEventListener("dragenter", handleNativeDragEnter);
    viewportElement.addEventListener("dragleave", handleNativeDragLeave);
    viewportElement.addEventListener("drop", handleNativeDrop);

    return () => {
      viewportElement.removeEventListener("dragenter", handleNativeDragEnter);
      viewportElement.removeEventListener("dragleave", handleNativeDragLeave);
      viewportElement.removeEventListener("drop", handleNativeDrop);
    };
  }, [viewportRef]);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";

      if (!isDragging) {
        setIsDragging(true);
      }
    },
    [isDragging],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      dragDepthRef.current = 0;
      setIsDragging(false);

      const paletteType =
        event.dataTransfer.getData("application/x-swing-component") ||
        event.dataTransfer.getData("text/plain");

      const componentType = resolveComponentType(paletteType);
      if (!componentType || !viewportRef.current) {
        return;
      }

      const viewportRect = viewportRef.current.getBoundingClientRect();
      const pointerX = (event.clientX - viewportRect.left - pan.x) / zoom;
      const pointerY = (event.clientY - viewportRect.top - pan.y) / zoom;

      const size = getDefaultSize(componentType);
      const defaultProps = getDefaultProps(componentType);
      const dropX = Math.round(snapToGrid(pointerX - size.width / 2));
      const dropY = Math.round(snapToGrid(pointerY - size.height / 2));
      const targetPanel = resolvePanelDropTarget(components, { x: pointerX, y: pointerY });

      const component: CanvasComponent = {
        id: createId(),
        type: componentType,
        variableName: `${componentType.charAt(0).toLowerCase()}${componentType.slice(1)}${components.length + 1}`,
        x: dropX,
        y: dropY,
        width: size.width,
        height: size.height,
        ...defaultProps,
      };

      if (targetPanel) {
        component.parentId = targetPanel.id;
        component.parentOffset = {
          x: Math.round(snapToGrid(dropX - targetPanel.x)),
          y: Math.round(snapToGrid(dropY - targetPanel.y)),
        };
      }

      onAddComponent(component);
      onSelectComponent(component.id);
    },
    [
      components,
      createId,
      onAddComponent,
      onSelectComponent,
      pan.x,
      pan.y,
      resolveComponentType,
      viewportRef,
      zoom,
    ],
  );

  return {
    handleDragOver,
    handleDrop,
    isDragging,
  };
}
