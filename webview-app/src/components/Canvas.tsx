import { useCallback, useMemo, useRef, useState } from "react";

import { CanvasComponent } from "@/components/CanvasComponent";
import type { CanvasComponent as CanvasComponentModel, ComponentType } from "@/types/canvas";

interface CanvasProps {
  components: CanvasComponentModel[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onAddComponent: (component: CanvasComponentModel) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onResizeComponent: (id: string, updates: Pick<CanvasComponentModel, "x" | "y" | "width" | "height">) => void;
}

interface Point {
  x: number;
  y: number;
}

const DEFAULT_SIZE_BY_TYPE: Record<ComponentType, { width: number; height: number }> = {
  Button: { width: 120, height: 36 },
  Label: { width: 120, height: 28 },
  TextField: { width: 180, height: 36 },
  PasswordField: { width: 180, height: 36 },
  TextArea: { width: 220, height: 96 },
};

const PALETTE_TO_COMPONENT_TYPE: Record<string, ComponentType> = {
  JButton: "Button",
  JLabel: "Label",
  JPanel: "Label",
  JTextField: "TextField",
  JTextArea: "TextArea",
  JCheckBox: "Button",
};

function toComponentType(rawType: string): ComponentType | null {
  return PALETTE_TO_COMPONENT_TYPE[rawType] ?? null;
}

function buildDefaultText(type: ComponentType, sourceType: string): string {
  switch (sourceType) {
    case "JCheckBox":
      return "CheckBox";
    case "JPanel":
      return "Panel";
    default:
      return type;
  }
}

export function Canvas({
  components,
  selectedComponentId,
  onSelectComponent,
  onAddComponent,
  onMoveComponent,
  onResizeComponent,
}: CanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const dragDepthRef = useRef(0);

  const isPanningRef = useRef(false);
  const panLastPointRef = useRef<Point | null>(null);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      dragDepthRef.current = 0;
      setIsDragOver(false);

      const paletteType =
        event.dataTransfer.getData("application/x-swing-component") || event.dataTransfer.getData("text/plain");

      const componentType = toComponentType(paletteType);
      if (!componentType || !viewportRef.current) {
        return;
      }

      const viewportRect = viewportRef.current.getBoundingClientRect();
      const dropX = (event.clientX - viewportRect.left - pan.x) / zoom;
      const dropY = (event.clientY - viewportRect.top - pan.y) / zoom;

      const size = DEFAULT_SIZE_BY_TYPE[componentType];
      const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const component: CanvasComponentModel = {
        id,
        type: componentType,
        variableName: `${componentType.charAt(0).toLowerCase()}${componentType.slice(1)}${components.length + 1}`,
        x: Math.round(dropX - size.width / 2),
        y: Math.round(dropY - size.height / 2),
        width: size.width,
        height: size.height,
        text: buildDefaultText(componentType, paletteType),
        backgroundColor: "#ffffff",
        textColor: "#000000",
        fontFamily: "Arial",
        fontSize: 12,
        eventMethodName: "",
      };

      onAddComponent(component);
      onSelectComponent(component.id);
    },
    [components.length, onAddComponent, onSelectComponent, pan.x, pan.y, zoom],
  );

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.ctrlKey) {
      setZoom((previousZoom) => {
        const delta = event.deltaY < 0 ? 0.1 : -0.1;
        return Math.min(2.5, Math.max(0.4, Number((previousZoom + delta).toFixed(2))));
      });
      return;
    }

    setPan((previousPan) => ({
      x: previousPan.x - event.deltaX,
      y: previousPan.y - event.deltaY,
    }));
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const targetElement = event.target as HTMLElement | null;
      const isCanvasComponentTarget = Boolean(targetElement?.closest("[data-canvas-component='true']"));

      if (!isCanvasComponentTarget) {
        onSelectComponent(null);
      }

      if (event.button !== 1 && !event.altKey) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      isPanningRef.current = true;
      panLastPointRef.current = { x: event.clientX, y: event.clientY };
    },
    [onSelectComponent],
  );

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current || !panLastPointRef.current) {
      return;
    }

    const deltaX = event.clientX - panLastPointRef.current.x;
    const deltaY = event.clientY - panLastPointRef.current.y;
    panLastPointRef.current = { x: event.clientX, y: event.clientY };

    setPan((previousPan) => ({
      x: previousPan.x + deltaX,
      y: previousPan.y + deltaY,
    }));
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    isPanningRef.current = false;
    panLastPointRef.current = null;
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((previous) => Math.max(0.4, Number((previous - 0.1).toFixed(2))));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((previous) => Math.min(2.5, Number((previous + 0.1).toFixed(2))));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const viewportClassName = useMemo(
    () =>
      `relative min-h-0 flex-1 overflow-hidden ${
        isDragOver ? "bg-[var(--canvas-drop-target)] outline-2 outline-[var(--canvas-selection)]" : "bg-vscode-background"
      }`,
    [isDragOver],
  );

  const transformStyle = useMemo(
    () => ({
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    }),
    [pan.x, pan.y, zoom],
  );

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Canvas panel">
      <header className="flex items-center justify-between border-b border-vscode-panel-border px-3 py-2 text-xs text-muted-foreground">
        <span>Canvas</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-vscode-panel-border px-2 py-0.5 hover:bg-accent"
            onClick={handleZoomOut}
          >
            -
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="rounded border border-vscode-panel-border px-2 py-0.5 hover:bg-accent"
            onClick={handleZoomIn}
          >
            +
          </button>
          <button
            type="button"
            className="rounded border border-vscode-panel-border px-2 py-0.5 hover:bg-accent"
            onClick={handleResetView}
          >
            Reset View
          </button>
        </div>
      </header>

      <div
        ref={viewportRef}
        className={viewportClassName}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-0 origin-top-left" style={transformStyle}>
          {components.map((component) => (
            <CanvasComponent
              key={component.id}
              component={component}
              zoom={zoom}
              isSelected={selectedComponentId === component.id}
              onSelect={onSelectComponent}
              onMove={onMoveComponent}
              onResize={onResizeComponent}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
