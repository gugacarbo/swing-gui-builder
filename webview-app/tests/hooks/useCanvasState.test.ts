import { act, createElement, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { useCanvasState } from "@/hooks/useCanvasState";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import type { CanvasComponent } from "@/types/canvas";

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

const mountedHooks: Array<{ unmount: () => void }> = [];

afterEach(() => {
  for (const hook of mountedHooks.splice(0)) {
    hook.unmount();
  }
});

describe("useCanvasState", () => {
  it("adds components to canvas state", () => {
    const hook = renderHook(() => useCanvasState([]), null);
    mountedHooks.push(hook);

    const newComponent = createComponent("button-1");
    act(() => {
      hook.result.current.addComponent(newComponent);
    });

    expect(hook.result.current.components).toHaveLength(1);
    expect(hook.result.current.components[0]).toEqual(newComponent);
  });

  it("updates a component by id", () => {
    const initial = [createComponent("button-1")];
    const hook = renderHook((components: CanvasComponent[]) => useCanvasState(components), initial);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.updateComponent("button-1", { x: 80, text: "Updated label" });
    });

    expect(hook.result.current.components[0]).toMatchObject({
      id: "button-1",
      x: 80,
      text: "Updated label",
    });
  });

  it("deletes component and clears selected state when removed", () => {
    const initial = [createComponent("button-1"), createComponent("button-2")];
    const hook = renderHook((components: CanvasComponent[]) => useCanvasState(components), initial);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.selectComponent("button-2");
      hook.result.current.removeComponent("button-2");
    });

    expect(hook.result.current.components.map((component) => component.id)).toEqual(["button-1"]);
    expect(hook.result.current.selectedComponentId).toBeNull();
    expect(hook.result.current.selectedComponent).toBeNull();
  });

  it("selects existing component, ignores unknown id and supports clear selection", () => {
    const initial = [createComponent("button-1")];
    const hook = renderHook((components: CanvasComponent[]) => useCanvasState(components), initial);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.selectComponent("button-1");
    });
    expect(hook.result.current.selectedComponentId).toBe("button-1");

    act(() => {
      hook.result.current.selectComponent("missing-id");
    });
    expect(hook.result.current.selectedComponentId).toBe("button-1");

    act(() => {
      hook.result.current.selectComponent(null);
    });
    expect(hook.result.current.selectedComponentId).toBeNull();
  });
});

describe("useCanvasState + useUndoRedo key flows", () => {
  it("undoes and redoes canvas updates for add/update/delete flows", () => {
    const initial = [createComponent("button-1")];

    const hook = renderHook((components: CanvasComponent[]) => {
      const canvas = useCanvasState(components);
      const history = useUndoRedo<CanvasComponent[]>(components);

      const pushState = (
        next: CanvasComponent[] | ((current: CanvasComponent[]) => CanvasComponent[]),
      ) => {
        history.set((current) => (typeof next === "function" ? next(current) : next));
      };

      useEffect(() => {
        canvas.setComponents(history.state);
      }, [canvas.setComponents, history.state]);

      return {
        components: canvas.components,
        pushState,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        undo: history.undo,
        redo: history.redo,
      };
    }, initial);

    mountedHooks.push(hook);

    act(() => {
      hook.result.current.pushState((current) => [...current, createComponent("button-2")]);
    });
    expect(hook.result.current.components.map((component) => component.id)).toEqual([
      "button-1",
      "button-2",
    ]);

    act(() => {
      hook.result.current.pushState((current) =>
        current.map((component) =>
          component.id === "button-2" ? { ...component, text: "Renamed" } : component,
        ),
      );
    });
    expect(
      hook.result.current.components.find((component) => component.id === "button-2")?.text,
    ).toBe("Renamed");

    act(() => {
      hook.result.current.pushState((current) =>
        current.filter((component) => component.id !== "button-1"),
      );
    });
    expect(hook.result.current.components.map((component) => component.id)).toEqual(["button-2"]);

    act(() => {
      hook.result.current.undo();
    });
    expect(hook.result.current.components.map((component) => component.id)).toEqual([
      "button-1",
      "button-2",
    ]);

    act(() => {
      hook.result.current.redo();
    });
    expect(hook.result.current.components.map((component) => component.id)).toEqual(["button-2"]);
    expect(hook.result.current.canUndo).toBe(true);
    expect(hook.result.current.canRedo).toBe(false);
  });
});
