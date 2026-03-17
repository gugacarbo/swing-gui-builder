import { act, createElement, type DragEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CanvasComponent } from "@/types/canvas";
import {
  useCanvasDragDrop,
  type UseCanvasDragDropOptions,
  type UseCanvasDragDropResult,
} from "./useCanvasDragDrop";

interface HarnessProps {
  options: UseCanvasDragDropOptions;
  onRender: (result: UseCanvasDragDropResult) => void;
}

function HookHarness({ options, onRender }: HarnessProps) {
  const result = useCanvasDragDrop(options);
  onRender(result);
  return null;
}

function createBaseComponent(overrides: Partial<CanvasComponent>): CanvasComponent {
  return {
    id: "component-1",
    type: "Panel",
    variableName: "panel1",
    x: 0,
    y: 0,
    width: 200,
    height: 150,
    text: "Panel",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    fontFamily: "Arial",
    fontSize: 12,
    eventMethodName: "",
    ...overrides,
  };
}

function createDropEvent(args: {
  paletteType: string;
  clientX: number;
  clientY: number;
}): DragEvent<HTMLDivElement> {
  const getData = vi.fn((mimeType: string) => {
    if (mimeType === "application/x-swing-component") {
      return args.paletteType;
    }

    return "";
  });

  return {
    preventDefault: vi.fn(),
    clientX: args.clientX,
    clientY: args.clientY,
    dataTransfer: {
      getData,
      dropEffect: "none",
    },
  } as unknown as DragEvent<HTMLDivElement>;
}

describe("useCanvasDragDrop", () => {
  let container: HTMLDivElement;
  let root: Root;
  let viewport: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    viewport = document.createElement("div");
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 50, 900, 600));
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it("creates a component when dropping a palette item", () => {
    const onAddComponent = vi.fn();
    const onSelectComponent = vi.fn();
    const viewportRef = { current: viewport };

    let hookResult: UseCanvasDragDropResult | null = null;

    act(() => {
      root.render(
        createElement(HookHarness, {
          options: {
            viewportRef,
            zoom: 1,
            pan: { x: 0, y: 0 },
            components: [],
            onAddComponent,
            onSelectComponent,
            createId: () => "button-created-id",
          },
          onRender: (result) => {
            hookResult = result;
          },
        }),
      );
    });

    const dropEvent = createDropEvent({
      paletteType: "JButton",
      clientX: 220,
      clientY: 100,
    });

    act(() => {
      hookResult?.handleDrop(dropEvent);
    });

    expect(onAddComponent).toHaveBeenCalledTimes(1);
    expect(onAddComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "button-created-id",
        type: "Button",
        variableName: "button1",
        x: 60,
        y: 32,
        width: 120,
        height: 36,
      }),
    );

    expect(onSelectComponent).toHaveBeenCalledWith("button-created-id");
  });

  it("binds dropped component to panel with snapped parentOffset", () => {
    const onAddComponent = vi.fn();
    const onSelectComponent = vi.fn();
    const viewportRef = { current: viewport };
    const panel = createBaseComponent({
      id: "panel-1",
      x: 100,
      y: 80,
      width: 300,
      height: 200,
    });

    let hookResult: UseCanvasDragDropResult | null = null;

    act(() => {
      root.render(
        createElement(HookHarness, {
          options: {
            viewportRef,
            zoom: 2,
            pan: { x: 20, y: 10 },
            components: [panel],
            onAddComponent,
            onSelectComponent,
            createId: () => "child-button-id",
          },
          onRender: (result) => {
            hookResult = result;
          },
        }),
      );
    });

    const dropEvent = createDropEvent({
      paletteType: "JButton",
      clientX: 330,
      clientY: 270,
    });

    act(() => {
      hookResult?.handleDrop(dropEvent);
    });

    expect(onAddComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "child-button-id",
        parentId: "panel-1",
        x: 45,
        y: 87,
        parentOffset: {
          x: -55,
          y: 7,
        },
      }),
    );
    expect(onSelectComponent).toHaveBeenCalledWith("child-button-id");
  });

  it("does not bind parentId when dropped outside panel bounds", () => {
    const onAddComponent = vi.fn();
    const onSelectComponent = vi.fn();
    const viewportRef = { current: viewport };
    const panel = createBaseComponent({
      id: "panel-1",
      x: 100,
      y: 80,
      width: 300,
      height: 200,
    });

    let hookResult: UseCanvasDragDropResult | null = null;

    act(() => {
      root.render(
        createElement(HookHarness, {
          options: {
            viewportRef,
            zoom: 2,
            pan: { x: 20, y: 10 },
            components: [panel],
            onAddComponent,
            onSelectComponent,
            createId: () => "outside-button-id",
          },
          onRender: (result) => {
            hookResult = result;
          },
        }),
      );
    });

    const dropEvent = createDropEvent({
      paletteType: "JButton",
      clientX: 930,
      clientY: 270,
    });

    act(() => {
      hookResult?.handleDrop(dropEvent);
    });

    const createdComponent = onAddComponent.mock.calls[0]?.[0] as CanvasComponent;

    expect(createdComponent.parentId).toBeUndefined();
    expect(createdComponent.parentOffset).toBeUndefined();
    expect(onSelectComponent).toHaveBeenCalledWith("outside-button-id");
  });
});
