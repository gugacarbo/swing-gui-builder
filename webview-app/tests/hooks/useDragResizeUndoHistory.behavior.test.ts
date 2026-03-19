import { act, createElement, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDragInteraction } from "@/hooks/useDragInteraction";
import { useUndoRedo } from "@/hooks/useUndoRedo";
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

const mountedHooks: Array<{ unmount: () => void }> = [];

afterEach(() => {
  for (const hook of mountedHooks.splice(0)) {
    hook.unmount();
  }
});

function createComponent(overrides: Partial<CanvasComponent> = {}): CanvasComponent {
  return {
    id: "component-1",
    type: "Button",
    variableName: "button1",
    x: 10,
    y: 20,
    width: 120,
    height: 40,
    text: "Button",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    fontFamily: "Arial",
    fontSize: 12,
    eventMethodName: "",
    ...overrides,
  };
}

function createPointerEvent(overrides: Partial<React.PointerEvent<HTMLElement>> = {}) {
  return {
    button: 0,
    clientX: 0,
    clientY: 0,
    pointerId: 1,
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as React.PointerEvent<HTMLElement>;
}

describe("drag/resize undo history batching behavior", () => {
  it("creates one undo entry after drag end and does not flood history on pointer move", () => {
    const hook = renderHook(() => {
      const history = useUndoRedo<CanvasComponent[]>([createComponent()]);
      const interactionHistoryStartRef = useRef<CanvasComponent[] | null>(null);
      const component = history.state[0];

      const updateComponents = useCallback(
        (
          updater: (current: CanvasComponent[]) => CanvasComponent[],
          options: {
            mode?: "push" | "replace" | "pushFrom";
            from?: CanvasComponent[];
          } = {},
        ) => {
          history.set((current) => updater(current), options);
        },
        [history],
      );

      const handleComponentInteractionStart = useCallback(
        (_id: string, _mode: "move" | "resize") => {
          if (interactionHistoryStartRef.current === null) {
            interactionHistoryStartRef.current = history.state;
          }
        },
        [history.state],
      );

      const handleComponentInteractionEnd = useCallback(
        (_id: string, _mode: "move" | "resize") => {
          const interactionHistoryStart = interactionHistoryStartRef.current;
          if (!interactionHistoryStart) {
            return;
          }

          interactionHistoryStartRef.current = null;
          history.set((current) => current, {
            mode: "pushFrom",
            from: interactionHistoryStart,
          });
        },
        [history],
      );

      const handleMove = useCallback(
        (id: string, nextX: number, nextY: number) => {
          updateComponents(
            (current) =>
              current.map((entry) =>
                entry.id === id ? { ...entry, x: Math.round(nextX), y: Math.round(nextY) } : entry,
              ),
            { mode: interactionHistoryStartRef.current ? "replace" : "push" },
          );
        },
        [updateComponents],
      );

      const handleResize = useCallback(
        (id: string, updates: Pick<CanvasComponent, "x" | "y" | "width" | "height">) => {
          updateComponents(
            (current) =>
              current.map((entry) =>
                entry.id === id
                  ? {
                      ...entry,
                      x: Math.round(updates.x),
                      y: Math.round(updates.y),
                      width: Math.round(updates.width),
                      height: Math.round(updates.height),
                    }
                  : entry,
              ),
            { mode: interactionHistoryStartRef.current ? "replace" : "push" },
          );
        },
        [updateComponents],
      );

      const interaction = useDragInteraction({
        component,
        zoom: 1,
        onSelect: () => {},
        onMove: handleMove,
        onResize: handleResize,
        onInteractionStart: handleComponentInteractionStart,
        onInteractionEnd: handleComponentInteractionEnd,
        minWidth: 1,
        minHeight: 1,
      });

      return {
        component: history.state[0],
        pastLength: history.history.past.length,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        undo: history.undo,
        redo: history.redo,
        handleMouseDown: interaction.handleMouseDown,
        handleMouseMove: interaction.handleMouseMove,
        handleMouseUp: interaction.handleMouseUp,
      };
    }, null);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.handleMouseDown(createPointerEvent({ clientX: 100, clientY: 100 }), {
        mode: "move",
      });
      hook.result.current.handleMouseMove(createPointerEvent({ clientX: 120, clientY: 120 }));
      hook.result.current.handleMouseMove(createPointerEvent({ clientX: 140, clientY: 130 }));
    });

    expect(hook.result.current.component.x).toBe(50);
    expect(hook.result.current.component.y).toBe(50);
    expect(hook.result.current.pastLength).toBe(0);

    act(() => {
      hook.result.current.handleMouseUp(createPointerEvent({ clientX: 140, clientY: 130 }));
    });

    expect(hook.result.current.pastLength).toBe(1);
    expect(hook.result.current.canUndo).toBe(true);

    act(() => {
      hook.result.current.undo();
    });
    expect(hook.result.current.component.x).toBe(10);
    expect(hook.result.current.component.y).toBe(20);

    act(() => {
      hook.result.current.redo();
    });
    expect(hook.result.current.component.x).toBe(50);
    expect(hook.result.current.component.y).toBe(50);
    expect(hook.result.current.canRedo).toBe(false);
  });

  it("creates one undo entry after resize end, preserves final size and keeps non-drag undo behavior", () => {
    const hook = renderHook(() => {
      const history = useUndoRedo<CanvasComponent[]>([createComponent()]);
      const interactionHistoryStartRef = useRef<CanvasComponent[] | null>(null);
      const component = history.state[0];

      const updateComponents = useCallback(
        (
          updater: (current: CanvasComponent[]) => CanvasComponent[],
          options: {
            mode?: "push" | "replace" | "pushFrom";
            from?: CanvasComponent[];
          } = {},
        ) => {
          history.set((current) => updater(current), options);
        },
        [history],
      );

      const handleComponentInteractionStart = useCallback(
        (_id: string, _mode: "move" | "resize") => {
          if (interactionHistoryStartRef.current === null) {
            interactionHistoryStartRef.current = history.state;
          }
        },
        [history.state],
      );

      const handleComponentInteractionEnd = useCallback(
        (_id: string, _mode: "move" | "resize") => {
          const interactionHistoryStart = interactionHistoryStartRef.current;
          if (!interactionHistoryStart) {
            return;
          }

          interactionHistoryStartRef.current = null;
          history.set((current) => current, {
            mode: "pushFrom",
            from: interactionHistoryStart,
          });
        },
        [history],
      );

      const handleMove = useCallback(
        (id: string, nextX: number, nextY: number) => {
          updateComponents(
            (current) =>
              current.map((entry) =>
                entry.id === id ? { ...entry, x: Math.round(nextX), y: Math.round(nextY) } : entry,
              ),
            { mode: interactionHistoryStartRef.current ? "replace" : "push" },
          );
        },
        [updateComponents],
      );

      const handleResize = useCallback(
        (id: string, updates: Pick<CanvasComponent, "x" | "y" | "width" | "height">) => {
          updateComponents(
            (current) =>
              current.map((entry) =>
                entry.id === id
                  ? {
                      ...entry,
                      x: Math.round(updates.x),
                      y: Math.round(updates.y),
                      width: Math.round(updates.width),
                      height: Math.round(updates.height),
                    }
                  : entry,
              ),
            { mode: interactionHistoryStartRef.current ? "replace" : "push" },
          );
        },
        [updateComponents],
      );

      const interaction = useDragInteraction({
        component,
        zoom: 1,
        onSelect: () => {},
        onMove: handleMove,
        onResize: handleResize,
        onInteractionStart: handleComponentInteractionStart,
        onInteractionEnd: handleComponentInteractionEnd,
        minWidth: 1,
        minHeight: 1,
      });

      const applyNonDragChange = () => {
        updateComponents((current) =>
          current.map((entry) =>
            entry.id === component.id ? { ...entry, text: "Updated" } : entry,
          ),
        );
      };

      return {
        component: history.state[0],
        pastLength: history.history.past.length,
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        handleMouseDown: interaction.handleMouseDown,
        handleMouseMove: interaction.handleMouseMove,
        handleMouseUp: interaction.handleMouseUp,
        applyNonDragChange,
      };
    }, null);
    mountedHooks.push(hook);

    act(() => {
      hook.result.current.handleMouseDown(createPointerEvent({ clientX: 100, clientY: 100 }), {
        mode: "resize",
        handle: "se",
      });
      hook.result.current.handleMouseMove(createPointerEvent({ clientX: 130, clientY: 120 }));
      hook.result.current.handleMouseMove(createPointerEvent({ clientX: 160, clientY: 150 }));
    });

    expect(hook.result.current.component.width).toBe(180);
    expect(hook.result.current.component.height).toBe(90);
    expect(hook.result.current.pastLength).toBe(0);

    act(() => {
      hook.result.current.handleMouseUp(createPointerEvent({ clientX: 160, clientY: 150 }));
    });

    expect(hook.result.current.pastLength).toBe(1);

    act(() => {
      hook.result.current.undo();
    });
    expect(hook.result.current.component.width).toBe(120);
    expect(hook.result.current.component.height).toBe(40);

    act(() => {
      hook.result.current.redo();
    });
    expect(hook.result.current.component.width).toBe(180);
    expect(hook.result.current.component.height).toBe(90);

    act(() => {
      hook.result.current.applyNonDragChange();
    });
    expect(hook.result.current.pastLength).toBe(2);
    expect(hook.result.current.canUndo).toBe(true);
  });
});
