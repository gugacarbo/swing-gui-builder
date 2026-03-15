import { useCallback, useEffect, useRef, useState } from "react";

import { getDefaultProps, getDefaultSize } from "@/lib/componentDefaults";
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
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface UseCanvasDragDropOptions {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  pan: Point;
  componentsCount: number;
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

export function useCanvasDragDrop({
  viewportRef,
  zoom,
  pan,
  componentsCount,
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
        event.dataTransfer.getData("application/x-swing-component") || event.dataTransfer.getData("text/plain");

      const componentType = resolveComponentType(paletteType);
      if (!componentType || !viewportRef.current) {
        return;
      }

      const viewportRect = viewportRef.current.getBoundingClientRect();
      const dropX = (event.clientX - viewportRect.left - pan.x) / zoom;
      const dropY = (event.clientY - viewportRect.top - pan.y) / zoom;

      const size = getDefaultSize(componentType);
      const defaultProps = getDefaultProps(componentType);

      const component: CanvasComponent = {
        id: createId(),
        type: componentType,
        variableName: `${componentType.charAt(0).toLowerCase()}${componentType.slice(1)}${componentsCount + 1}`,
        x: Math.round(dropX - size.width / 2),
        y: Math.round(dropY - size.height / 2),
        width: size.width,
        height: size.height,
        ...defaultProps,
      };

      onAddComponent(component);
      onSelectComponent(component.id);
    },
    [componentsCount, createId, onAddComponent, onSelectComponent, pan.x, pan.y, resolveComponentType, viewportRef, zoom],
  );

  return {
    handleDragOver,
    handleDrop,
    isDragging,
  };
}
