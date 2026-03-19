import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { moveComponentInHierarchy, useHierarchyDragDrop } from "@/hooks/useHierarchyDragDrop";
import type { CanvasComponent } from "@/types/canvas";

function createMockDataTransfer(data: Record<string, string> = {}): DataTransfer {
  const store = { ...data };
  return {
    getData: (format: string) => store[format] ?? "",
    setData: (format: string, value: string) => {
      store[format] = value;
    },
    effectAllowed: "none" as DataTransfer["effectAllowed"],
    dropEffect: "none" as DataTransfer["dropEffect"],
  } as DataTransfer;
}

function createMockDragEvent(
  target: HTMLElement,
  clientY: number,
  dataTransfer?: DataTransfer,
): React.DragEvent<HTMLElement> {
  return {
    preventDefault: vi.fn(),
    currentTarget: target,
    clientY,
    dataTransfer: dataTransfer ?? createMockDataTransfer(),
  } as unknown as React.DragEvent<HTMLElement>;
}

function createMockElement(height: number, top: number): HTMLElement {
  const element = {
    getBoundingClientRect: () => ({
      top,
      height,
      bottom: top + height,
      left: 0,
      right: 100,
      width: 100,
      x: 0,
      y: top,
      toJSON: () => "",
    }),
  } as HTMLElement;
  return element;
}
const baseComponent: Omit<CanvasComponent, "id" | "type"> = {
  x: 0,
  y: 0,
  width: 200,
  height: 100,
  backgroundColor: "#eee",
  textColor: "#000",
  text: "Text",
  variableName: "variableName",
  fontFamily: "Arial",
  fontSize: 14,
  eventMethodName: "handleEvent",
};

const createPanel = (id: string, overrides: Partial<CanvasComponent> = {}): CanvasComponent => ({
  ...baseComponent,
  id,
  type: "Panel",
  x: 0,
  y: 0,
  width: 200,
  height: 100,

  ...overrides,
});

const createButton = (id: string, overrides: Partial<CanvasComponent> = {}): CanvasComponent => ({
  ...baseComponent,
  id,
  type: "Button",
  x: 0,
  y: 0,
  width: 80,
  height: 30,
  ...overrides,
});

const createMenuBar = (id: string, overrides: Partial<CanvasComponent> = {}): CanvasComponent => ({
  ...baseComponent,
  id,
  type: "MenuBar",
  x: 0,
  y: 0,
  width: 200,
  height: 30,

  ...overrides,
});

const createMenu = (id: string, overrides: Partial<CanvasComponent> = {}): CanvasComponent => ({
  ...baseComponent,
  id,
  type: "Menu",
  x: 0,
  y: 0,
  width: 80,
  height: 30,

  ...overrides,
});

const createMenuItem = (id: string, overrides: Partial<CanvasComponent> = {}): CanvasComponent => ({
  ...baseComponent,
  id,
  type: "MenuItem",
  x: 0,
  y: 0,
  width: 80,
  height: 30,

  ...overrides,
});

const createToolBar = (id: string, overrides: Partial<CanvasComponent> = {}): CanvasComponent => ({
  ...baseComponent,
  id,
  type: "ToolBar",
  x: 0,
  y: 0,
  width: 200,
  height: 40,
  ...overrides,
});

describe("useHierarchyDragDrop", () => {
  describe("isDraggableComponent", () => {
    it("returns false for MenuBar", () => {
      const components = [createMenuBar("menuBar1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      expect(result.current.isDraggableComponent("menuBar1")).toBe(false);
    });

    it("returns false for ToolBar", () => {
      const components = [createToolBar("toolBar1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      expect(result.current.isDraggableComponent("toolBar1")).toBe(false);
    });

    it("returns true for Panel", () => {
      const components = [createPanel("panel1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      expect(result.current.isDraggableComponent("panel1")).toBe(true);
    });

    it("returns true for Button (Other type)", () => {
      const components = [createButton("button1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      expect(result.current.isDraggableComponent("button1")).toBe(true);
    });

    it("returns true for Menu", () => {
      const components = [createMenu("menu1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      expect(result.current.isDraggableComponent("menu1")).toBe(true);
    });

    it("returns true for MenuItem", () => {
      const components = [createMenuItem("menuItem1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      expect(result.current.isDraggableComponent("menuItem1")).toBe(true);
    });

    it("returns false for non-existent component", () => {
      const components: CanvasComponent[] = [];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      expect(result.current.isDraggableComponent("nonexistent")).toBe(false);
    });
  });

  describe("handleDragStart", () => {
    it("prevents default if component is not draggable (MenuBar)", () => {
      const components = [createMenuBar("menuBar1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      const dataTransfer = createMockDataTransfer();
      const target = createMockElement(100, 0);
      const event = createMockDragEvent(target, 50, dataTransfer);

      act(() => {
        result.current.handleDragStart(event, "menuBar1");
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.draggingComponentId).toBe(null);
    });

    it("sets draggingComponentId for draggable component", () => {
      const components = [createButton("button1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      const dataTransfer = createMockDataTransfer();
      const target = createMockElement(100, 0);
      const event = createMockDragEvent(target, 50, dataTransfer);

      act(() => {
        result.current.handleDragStart(event, "button1");
      });

      expect(result.current.draggingComponentId).toBe("button1");
      expect(dataTransfer.effectAllowed).toBe("move");
      expect(dataTransfer.getData("application/x-swing-hierarchy-component")).toBe("button1");
    });

    it("sets both mime type and text/plain data", () => {
      const components = [createButton("button1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      const dataTransfer = createMockDataTransfer();
      const target = createMockElement(100, 0);
      const event = createMockDragEvent(target, 50, dataTransfer);

      act(() => {
        result.current.handleDragStart(event, "button1");
      });

      expect(dataTransfer.getData("application/x-swing-hierarchy-component")).toBe("button1");
      expect(dataTransfer.getData("text/plain")).toBe("button1");
    });
  });

  describe("handleDragEnd", () => {
    it("clears drag state", () => {
      const components = [createButton("button1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      const dataTransfer = createMockDataTransfer();
      const target = createMockElement(100, 0);
      const event = createMockDragEvent(target, 50, dataTransfer);

      act(() => {
        result.current.handleDragStart(event, "button1");
      });

      expect(result.current.draggingComponentId).toBe("button1");

      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggingComponentId).toBe(null);
      expect(result.current.dropTarget).toBe(null);
    });
  });

  describe("handleDragOver", () => {
    it("does nothing if no dragged component", () => {
      const components = [createPanel("panel1"), createButton("button1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      const target = createMockElement(100, 0);
      const event = createMockDragEvent(target, 50);

      act(() => {
        result.current.handleDragOver(event, "panel1");
      });

      expect(result.current.dropTarget).toBe(null);
    });

    it("sets dropTarget when valid drop is available", () => {
      const components = [createPanel("panel1"), createButton("button1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      const dataTransfer = createMockDataTransfer();
      const target = createMockElement(100, 0);
      const startEvent = createMockDragEvent(target, 50, dataTransfer);

      act(() => {
        result.current.handleDragStart(startEvent, "button1");
      });

      const overEvent = createMockDragEvent(target, 60, dataTransfer);
      act(() => {
        result.current.handleDragOver(overEvent, "panel1");
      });

      expect(result.current.dropTarget).not.toBe(null);
      expect(overEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe("handleDrop", () => {
    it("calls onMoveComponent with correct parameters for valid drop", () => {
      const components = [createPanel("panel1"), createButton("button1")];
      const onMoveComponent = vi.fn();
      const { result } = renderHook(() => useHierarchyDragDrop({ components, onMoveComponent }));

      const dataTransfer = createMockDataTransfer();
      const target = createMockElement(100, 0);
      const startEvent = createMockDragEvent(target, 50, dataTransfer);

      act(() => {
        result.current.handleDragStart(startEvent, "button1");
      });

      const dropEvent = createMockDragEvent(target, 60, dataTransfer);
      act(() => {
        result.current.handleDrop(dropEvent, "panel1");
      });

      expect(onMoveComponent).toHaveBeenCalledWith("button1", "panel1", 0);
    });
  });
});

describe("moveComponentInHierarchy", () => {
  describe("basic moves", () => {
    it("returns unchanged if component is moved to itself as parent", () => {
      const components = [createPanel("panel1")];
      const result = moveComponentInHierarchy(components, "panel1", "panel1", 0);
      expect(result).toBe(components);
    });

    it("returns unchanged if component does not exist", () => {
      const components = [createPanel("panel1")];
      const result = moveComponentInHierarchy(components, "nonexistent", null, 0);
      expect(result).toBe(components);
    });

    it("returns unchanged if target parent does not exist", () => {
      const components = [createButton("button1")];
      const result = moveComponentInHierarchy(components, "button1", "nonexistent", 0);
      expect(result).toBe(components);
    });

    it("moves component to root level", () => {
      const panel = createPanel("panel1", { children: ["button1"] });
      const button = createButton("button1", { parentId: "panel1" });
      const components = [panel, button];

      const result = moveComponentInHierarchy(components, "button1", null, 0);

      const movedButton = result.find((c) => c.id === "button1");
      expect(movedButton?.parentId).toBeUndefined();
    });

    it("moves component into panel", () => {
      const panel = createPanel("panel1");
      const button = createButton("button1");
      const components = [panel, button];

      const result = moveComponentInHierarchy(components, "button1", "panel1", 0);

      const movedButton = result.find((c) => c.id === "button1");
      expect(movedButton?.parentId).toBe("panel1");

      const updatedPanel = result.find((c) => c.id === "panel1");
      expect(updatedPanel?.children).toContain("button1");
    });
  });

  describe("type constraints", () => {
    it("prevents moving MenuBar into Panel", () => {
      const panel = createPanel("panel1");
      const menuBar = createMenuBar("menuBar1");
      const components = [panel, menuBar];

      const result = moveComponentInHierarchy(components, "menuBar1", "panel1", 0);

      // MenuBar can't be child of Panel
      const movedMenuBar = result.find((c) => c.id === "menuBar1");
      expect(movedMenuBar?.parentId).toBeUndefined();
    });

    it("prevents moving Menu to root (must be in MenuBar)", () => {
      const menu = createMenu("menu1", { parentId: "menuBar1" });
      const menuBar = createMenuBar("menuBar1", { children: ["menu1"] });
      const components = [menuBar, menu];

      const result = moveComponentInHierarchy(components, "menu1", null, 0);

      // Menu can't be at root
      const movedMenu = result.find((c) => c.id === "menu1");
      expect(movedMenu?.parentId).toBe("menuBar1");
    });

    it("prevents MenuItem from being at root", () => {
      const menuItem = createMenuItem("menuItem1", { parentId: "menu1" });
      const menu = createMenu("menu1", { children: ["menuItem1"] });
      const components = [menu, menuItem];

      const result = moveComponentInHierarchy(components, "menuItem1", null, 0);

      const movedMenuItem = result.find((c) => c.id === "menuItem1");
      expect(movedMenuItem?.parentId).toBe("menu1");
    });

    it("allows Menu as child of MenuBar", () => {
      const menuBar = createMenuBar("menuBar1");
      const menu = createMenu("menu1");
      const components = [menuBar, menu];

      const result = moveComponentInHierarchy(components, "menu1", "menuBar1", 0);

      const movedMenu = result.find((c) => c.id === "menu1");
      expect(movedMenu?.parentId).toBe("menuBar1");

      const updatedMenuBar = result.find((c) => c.id === "menuBar1");
      expect(updatedMenuBar?.children).toContain("menu1");
    });

    it("allows MenuItem as child of Menu", () => {
      const menu = createMenu("menu1");
      const menuItem = createMenuItem("menuItem1");
      const components = [menu, menuItem];

      const result = moveComponentInHierarchy(components, "menuItem1", "menu1", 0);

      const movedMenuItem = result.find((c) => c.id === "menuItem1");
      expect(movedMenuItem?.parentId).toBe("menu1");
    });
  });

  describe("cycle detection", () => {
    it("prevents moving parent into its own child", () => {
      const panel = createPanel("panel1", { children: ["panel2"] });
      const childPanel = createPanel("panel2", { parentId: "panel1" });
      const components = [panel, childPanel];

      const result = moveComponentInHierarchy(components, "panel1", "panel2", 0);

      // Should not allow cycle
      const movedPanel = result.find((c) => c.id === "panel1");
      expect(movedPanel?.parentId).toBeUndefined();
    });
  });

  describe("index handling", () => {
    it("inserts component at correct index", () => {
      const panel = createPanel("panel1", { children: ["button1", "button3"] });
      const button1 = createButton("button1", { parentId: "panel1" });
      const button2 = createButton("button2");
      const button3 = createButton("button3", { parentId: "panel1" });
      const components = [panel, button1, button2, button3];

      const result = moveComponentInHierarchy(components, "button2", "panel1", 1);

      const updatedPanel = result.find((c) => c.id === "panel1");
      expect(updatedPanel?.children).toEqual(["button1", "button2", "button3"]);
    });

    it("clamps index to valid range", () => {
      const panel = createPanel("panel1");
      const button1 = createButton("button1");
      const components = [panel, button1];

      const result = moveComponentInHierarchy(components, "button1", "panel1", 999);

      const updatedPanel = result.find((c) => c.id === "panel1");
      expect(updatedPanel?.children).toEqual(["button1"]);
    });

    it("handles negative index by clamping to 0", () => {
      const panel = createPanel("panel1");
      const button1 = createButton("button1");
      const components = [panel, button1];

      const result = moveComponentInHierarchy(components, "button1", "panel1", -5);

      const updatedPanel = result.find((c) => c.id === "panel1");
      expect(updatedPanel?.children).toEqual(["button1"]);
    });
  });

  describe("children array updates", () => {
    it("removes component from old parent children array", () => {
      const oldPanel = createPanel("oldPanel", { children: ["button1"] });
      const newPanel = createPanel("newPanel");
      const button = createButton("button1", { parentId: "oldPanel" });
      const components = [oldPanel, newPanel, button];

      const result = moveComponentInHierarchy(components, "button1", "newPanel", 0);

      const updatedOldPanel = result.find((c) => c.id === "oldPanel");
      expect(updatedOldPanel?.children).not.toContain("button1");
    });

    it("adds component to new parent children array", () => {
      const oldPanel = createPanel("oldPanel", { children: ["button1"] });
      const newPanel = createPanel("newPanel");
      const button = createButton("button1", { parentId: "oldPanel" });
      const components = [oldPanel, newPanel, button];

      const result = moveComponentInHierarchy(components, "button1", "newPanel", 0);

      const updatedNewPanel = result.find((c) => c.id === "newPanel");
      expect(updatedNewPanel?.children).toContain("button1");
    });
  });

  describe("parentOffset updates", () => {
    it("sets parentOffset when moving into Panel", () => {
      const panel = createPanel("panel1", { x: 100, y: 100 });
      const button = createButton("button1", { x: 0, y: 0 });
      const components = [panel, button];

      const result = moveComponentInHierarchy(components, "button1", "panel1", 0);

      const movedButton = result.find((c) => c.id === "button1");
      expect(movedButton?.parentOffset).toEqual({ x: -100, y: -100 });
    });
  });

  describe("reordering without parent change", () => {
    it("reorders children within same parent", () => {
      const panel = createPanel("panel1", { children: ["button1", "button2", "button3"] });
      const button1 = createButton("button1", { parentId: "panel1" });
      const button2 = createButton("button2", { parentId: "panel1" });
      const button3 = createButton("button3", { parentId: "panel1" });
      const components = [panel, button1, button2, button3];

      const result = moveComponentInHierarchy(components, "button3", "panel1", 0);

      const updatedPanel = result.find((c) => c.id === "panel1");
      expect(updatedPanel?.children).toEqual(["button3", "button1", "button2"]);
    });

    it("returns unchanged if position is same", () => {
      const panel = createPanel("panel1", { children: ["button1"] });
      const button = createButton("button1", { parentId: "panel1" });
      const components = [panel, button];

      const result = moveComponentInHierarchy(components, "button1", "panel1", 0);

      // Should return same array if nothing changed
      expect(result).toBe(components);
    });
  });

  describe("multiple root components", () => {
    it("maintains root order when moving to root", () => {
      const panel1 = createPanel("panel1");
      const panel2 = createPanel("panel2");
      const button = createButton("button1", { parentId: "panel1" });
      panel1.children = ["button1"];
      const components = [panel1, button, panel2];

      const result = moveComponentInHierarchy(components, "button1", null, 0);

      // Button should be at root level now
      const movedButton = result.find((c) => c.id === "button1");
      expect(movedButton?.parentId).toBeUndefined();
    });
  });
});
