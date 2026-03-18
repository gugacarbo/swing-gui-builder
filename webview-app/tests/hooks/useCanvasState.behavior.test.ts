import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { useCanvasState } from "@/hooks/useCanvasState";
import type { CanvasComponent } from "@/types/canvas";

interface HookRenderer<TResult> {
  result: { current: TResult };
  unmount: () => void;
}

function renderHook<TProps, TResult>(
  useHook: (props: TProps) => TResult,
  initialProps: TProps,
): HookRenderer<TResult> {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const result = { current: undefined as TResult };

  function TestComponent({ hookProps }: { hookProps: TProps }) {
    result.current = useHook(hookProps);
    return null;
  }

  act(() => {
    root.render(createElement(TestComponent, { hookProps: initialProps }));
  });

  return {
    result,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function createComponent(id: string, overrides: Partial<CanvasComponent> = {}): CanvasComponent {
  return {
    id,
    type: "Button",
    variableName: `${id}Var`,
    x: 10,
    y: 20,
    width: 120,
    height: 40,
    text: `${id} text`,
    backgroundColor: "#ffffff",
    textColor: "#000000",
    fontFamily: "Arial",
    fontSize: 12,
    eventMethodName: "",
    ...overrides,
  };
}

const mountedHooks: Array<{ unmount: () => void }> = [];

afterEach(() => {
  for (const hook of mountedHooks.splice(0)) {
    hook.unmount();
  }
});

describe("useCanvasState additional behavior", () => {
  it("removes parent links and child references when deleting a component", () => {
    const initial = [
      createComponent("parent", { type: "Panel", children: ["child"] }),
      createComponent("child", { parentId: "parent" }),
      createComponent("container", { type: "Panel", children: ["parent"] }),
    ];
    const hook = renderHook((components: CanvasComponent[]) => useCanvasState(components), initial);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.removeComponent("parent");
    });

    expect(hook.result.current.components.find((component) => component.id === "child")?.parentId).toBeUndefined();
    expect(hook.result.current.components.find((component) => component.id === "container")?.children).toEqual([]);
  });

  it("handles addChild edge cases and re-parenting", () => {
    const initial = [
      createComponent("oldParent", { type: "Panel", children: ["child"] }),
      createComponent("newParent", { type: "Panel", children: [] }),
      createComponent("child", { parentId: "oldParent" }),
      createComponent("sibling"),
    ];
    const hook = renderHook((components: CanvasComponent[]) => useCanvasState(components), initial);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.addChild("child", "child");
      hook.result.current.addChild("missing", "child");
      hook.result.current.addChild("newParent", "child");
    });

    expect(hook.result.current.components.find((component) => component.id === "newParent")?.children).toEqual([
      "child",
    ]);
    expect(hook.result.current.components.find((component) => component.id === "oldParent")?.children).toEqual([]);
    expect(hook.result.current.components.find((component) => component.id === "child")?.parentId).toBe(
      "newParent",
    );
    const sibling = hook.result.current.components.find((component) => component.id === "sibling");
    expect(sibling).toMatchObject({ id: "sibling" });
    expect(sibling).not.toHaveProperty("parentId");

    const snapshot = JSON.stringify(hook.result.current.components);
    act(() => {
      hook.result.current.addChild("newParent", "child");
    });
    expect(JSON.stringify(hook.result.current.components)).toBe(snapshot);
  });

  it("handles removeChild branches for missing, unrelated and linked components", () => {
    const initial = [
      createComponent("parent", { type: "Panel", children: ["child"] }),
      createComponent("child", { parentId: "parent" }),
      createComponent("otherChild"),
    ];
    const hook = renderHook((components: CanvasComponent[]) => useCanvasState(components), initial);
    mountedHooks.push(hook);

    const beforeMissing = JSON.stringify(hook.result.current.components);
    act(() => {
      hook.result.current.removeChild("parent", "missing");
    });
    expect(JSON.stringify(hook.result.current.components)).toBe(beforeMissing);

    act(() => {
      hook.result.current.removeChild("parent", "otherChild");
    });
    expect(hook.result.current.components.find((component) => component.id === "parent")?.children).toEqual([
      "child",
    ]);

    act(() => {
      hook.result.current.removeChild("parent", "child");
    });
    expect(hook.result.current.components.find((component) => component.id === "parent")?.children).toEqual([]);
    expect(hook.result.current.components.find((component) => component.id === "child")?.parentId).toBeUndefined();
  });

  it("returns ordered children from both children array and parentId fallback", () => {
    const initial = [
      createComponent("panel", { type: "Panel", children: ["childB", "missing", "childA"] }),
      createComponent("childA", { parentId: "panel" }),
      createComponent("childB", { parentId: "panel" }),
      createComponent("childC", { parentId: "panel" }),
    ];
    const hook = renderHook((components: CanvasComponent[]) => useCanvasState(components), initial);
    mountedHooks.push(hook);

    expect(hook.result.current.getChildren("unknown")).toEqual([]);
    expect(hook.result.current.getChildren("panel").map((component) => component.id)).toEqual([
      "childB",
      "childA",
      "childC",
    ]);
  });

  it("returns root components and clears invalid selection when selected component disappears", () => {
    const initial = [
      createComponent("root"),
      createComponent("orphan", { parentId: "missingParent" }),
      createComponent("child", { parentId: "root" }),
    ];
    const hook = renderHook((components: CanvasComponent[]) => useCanvasState(components), initial);
    mountedHooks.push(hook);

    expect(hook.result.current.getRootComponents().map((component) => component.id)).toEqual([
      "root",
      "orphan",
    ]);

    act(() => {
      hook.result.current.selectComponent("child");
    });
    expect(hook.result.current.selectedComponentId).toBe("child");

    act(() => {
      hook.result.current.setComponents((components) =>
        components.filter((component) => component.id !== "child"),
      );
    });
    expect(hook.result.current.selectedComponentId).toBeNull();
    expect(hook.result.current.selectedComponent).toBeNull();
  });
});
