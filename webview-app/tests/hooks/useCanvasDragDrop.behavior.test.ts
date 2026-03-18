import { act, createElement, type DragEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type UseCanvasDragDropOptions,
  type UseCanvasDragDropResult,
  useCanvasDragDrop,
} from "@/hooks/useCanvasDragDrop";
import type { CanvasComponent } from "@/types/canvas";

interface HarnessProps {
  options: UseCanvasDragDropOptions;
  onRender: (result: UseCanvasDragDropResult) => void;
}

function HookHarness({ options, onRender }: HarnessProps) {
  const result = useCanvasDragDrop(options);
  onRender(result);
  return null;
}

function createComponent(overrides: Partial<CanvasComponent>): CanvasComponent {
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
  customMimeData?: string;
  plainTextData?: string;
  clientX: number;
  clientY: number;
}): DragEvent<HTMLDivElement> {
  const getData = vi.fn((mimeType: string) => {
    if (mimeType === "application/x-swing-component") {
      return args.customMimeData ?? "";
    }

    if (mimeType === "text/plain") {
      return args.plainTextData ?? "";
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

describe("useCanvasDragDrop additional behavior", () => {
  let container: HTMLDivElement;
  let root: Root;
  let viewport: HTMLDivElement;

  function getHookResult(result: UseCanvasDragDropResult | null): UseCanvasDragDropResult {
    if (!result) {
      throw new Error("Hook result was not initialized");
    }

    return result;
  }

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
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("tracks native dragenter/dragleave/drop events through drag depth", () => {
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
            createId: () => "id",
          },
          onRender: (result) => {
            hookResult = result;
          },
        }),
      );
    });

    expect(getHookResult(hookResult).isDragging).toBe(false);

    act(() => {
      viewport.dispatchEvent(new Event("dragenter"));
      viewport.dispatchEvent(new Event("dragenter"));
    });
    expect(getHookResult(hookResult).isDragging).toBe(true);

    act(() => {
      viewport.dispatchEvent(new Event("dragleave"));
    });
    expect(getHookResult(hookResult).isDragging).toBe(true);

    act(() => {
      viewport.dispatchEvent(new Event("dragleave"));
    });
    expect(getHookResult(hookResult).isDragging).toBe(false);

    act(() => {
      viewport.dispatchEvent(new Event("dragenter"));
      viewport.dispatchEvent(new Event("drop"));
    });
    expect(getHookResult(hookResult).isDragging).toBe(false);
  });

  it("handles drag over events and sets copy dropEffect", () => {
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
            createId: () => "id",
          },
          onRender: (result) => {
            hookResult = result;
          },
        }),
      );
    });

    const dragOverEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: "none" },
    } as unknown as DragEvent<HTMLDivElement>;

    act(() => {
      hookResult?.handleDragOver(dragOverEvent);
    });
    expect(dragOverEvent.preventDefault).toHaveBeenCalled();
    expect(dragOverEvent.dataTransfer.dropEffect).toBe("copy");
    expect(getHookResult(hookResult).isDragging).toBe(true);

    act(() => {
      hookResult?.handleDragOver(dragOverEvent);
    });
    expect(dragOverEvent.dataTransfer.dropEffect).toBe("copy");
  });

  it("returns early on drop when component type cannot be resolved", () => {
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
            createId: () => "id",
          },
          onRender: (result) => {
            hookResult = result;
          },
        }),
      );
    });

    const dropEvent = createDropEvent({
      customMimeData: "UnknownType",
      clientX: 120,
      clientY: 80,
    });

    act(() => {
      hookResult?.handleDrop(dropEvent);
    });

    expect(onAddComponent).not.toHaveBeenCalled();
    expect(onSelectComponent).not.toHaveBeenCalled();
  });

  it("returns early when viewport ref is unavailable", () => {
    const onAddComponent = vi.fn();
    const onSelectComponent = vi.fn();
    const viewportRef = { current: null as HTMLDivElement | null };

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
            createId: () => "id",
          },
          onRender: (result) => {
            hookResult = result;
          },
        }),
      );
    });

    const dropEvent = createDropEvent({
      customMimeData: "JButton",
      clientX: 150,
      clientY: 80,
    });

    act(() => {
      hookResult?.handleDrop(dropEvent);
    });

    expect(onAddComponent).not.toHaveBeenCalled();
    expect(onSelectComponent).not.toHaveBeenCalled();
  });

  it("uses text/plain fallback and picks the smallest matching panel as parent", () => {
    const onAddComponent = vi.fn();
    const onSelectComponent = vi.fn();
    const viewportRef = { current: viewport };
    const largePanel = createComponent({
      id: "large-panel",
      x: 0,
      y: 0,
      width: 300,
      height: 300,
    });
    const smallPanel = createComponent({
      id: "small-panel",
      x: 80,
      y: 60,
      width: 120,
      height: 120,
    });

    let hookResult: UseCanvasDragDropResult | null = null;

    act(() => {
      root.render(
        createElement(HookHarness, {
          options: {
            viewportRef,
            zoom: 1,
            pan: { x: 0, y: 0 },
            components: [smallPanel, largePanel],
            onAddComponent,
            onSelectComponent,
          },
          onRender: (result) => {
            hookResult = result;
          },
        }),
      );
    });

    const dropEvent = createDropEvent({
      customMimeData: "",
      plainTextData: "JButton",
      clientX: 220,
      clientY: 160,
    });

    act(() => {
      hookResult?.handleDrop(dropEvent);
    });

    expect(onAddComponent).toHaveBeenCalledTimes(1);
    const created = onAddComponent.mock.calls[0][0] as CanvasComponent;

    expect(created.id).toEqual(expect.any(String));
    expect(created.id.length).toBeGreaterThan(0);
    expect(created.type).toBe("Button");
    expect(created.parentId).toBe("small-panel");
    expect(onSelectComponent).toHaveBeenCalledWith(created.id);
  });

  it("falls back to timestamp-based ids when crypto.randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", { randomUUID: undefined });
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    vi.spyOn(Math, "random").mockReturnValue(0.5);

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
          },
          onRender: (result) => {
            hookResult = result;
          },
        }),
      );
    });

    const dropEvent = createDropEvent({
      customMimeData: "JButton",
      clientX: 220,
      clientY: 100,
    });

    act(() => {
      hookResult?.handleDrop(dropEvent);
    });

    const created = onAddComponent.mock.calls[0]?.[0] as CanvasComponent;
    expect(created.id).toMatch(/^1700000000000-/);
    expect(onSelectComponent).toHaveBeenCalledWith(created.id);
  });
});
