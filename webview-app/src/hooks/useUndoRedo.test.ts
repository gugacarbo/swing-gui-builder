import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { useUndoRedo } from "@/hooks/useUndoRedo";

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

describe("useUndoRedo", () => {
  it("pushes state changes with set (pushState behavior)", () => {
    const hook = renderHook(() => useUndoRedo<number>(0), null);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.set(1);
      hook.result.current.set(2);
    });

    expect(hook.result.current.state).toBe(2);
    expect(hook.result.current.history.past).toEqual([0, 1]);
    expect(hook.result.current.canUndo).toBe(true);
    expect(hook.result.current.canRedo).toBe(false);
  });

  it("undoes and redoes state transitions", () => {
    const hook = renderHook(() => useUndoRedo<string>("draft"), null);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.set("review");
      hook.result.current.set("published");
    });

    act(() => {
      hook.result.current.undo();
    });
    expect(hook.result.current.state).toBe("review");
    expect(hook.result.current.canUndo).toBe(true);
    expect(hook.result.current.canRedo).toBe(true);

    act(() => {
      hook.result.current.undo();
    });
    expect(hook.result.current.state).toBe("draft");
    expect(hook.result.current.canUndo).toBe(false);
    expect(hook.result.current.canRedo).toBe(true);

    act(() => {
      hook.result.current.redo();
    });
    expect(hook.result.current.state).toBe("review");
    expect(hook.result.current.canUndo).toBe(true);
  });

  it("clears redo stack when a new state is pushed after undo", () => {
    const hook = renderHook(() => useUndoRedo<number>(10), null);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.set(20);
      hook.result.current.set(30);
      hook.result.current.undo();
      hook.result.current.set(25);
    });

    expect(hook.result.current.state).toBe(25);
    expect(hook.result.current.history.future).toEqual([]);
    expect(hook.result.current.canRedo).toBe(false);
  });
});
