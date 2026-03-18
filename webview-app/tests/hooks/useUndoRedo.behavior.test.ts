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

describe("useUndoRedo additional behavior", () => {
  it("does not push history when setting the same value", () => {
    const hook = renderHook(() => useUndoRedo<number>(5), null);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.set((current) => current);
    });

    expect(hook.result.current.state).toBe(5);
    expect(hook.result.current.history.past).toEqual([]);
    expect(hook.result.current.canUndo).toBe(false);
  });

  it("keeps state unchanged when undo or redo is not possible", () => {
    const hook = renderHook(() => useUndoRedo<string>("initial"), null);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.undo();
      hook.result.current.redo();
    });

    expect(hook.result.current.state).toBe("initial");
    expect(hook.result.current.canUndo).toBe(false);
    expect(hook.result.current.canRedo).toBe(false);
  });

  it("resets state and clears history", () => {
    const hook = renderHook(() => useUndoRedo<number>(0), null);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.set(1);
      hook.result.current.set(2);
      hook.result.current.undo();
      hook.result.current.reset(99);
    });

    expect(hook.result.current.state).toBe(99);
    expect(hook.result.current.history.past).toEqual([]);
    expect(hook.result.current.history.future).toEqual([]);
    expect(hook.result.current.canUndo).toBe(false);
    expect(hook.result.current.canRedo).toBe(false);
  });

  it("respects historyLimit by trimming old entries", () => {
    const hook = renderHook(() => useUndoRedo<number>(0, { historyLimit: 2 }), null);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.set(1);
      hook.result.current.set(2);
      hook.result.current.set(3);
    });

    expect(hook.result.current.state).toBe(3);
    expect(hook.result.current.history.past).toEqual([1, 2]);
  });
});
