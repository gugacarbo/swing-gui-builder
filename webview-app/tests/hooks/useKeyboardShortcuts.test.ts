import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

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

type Handler = () => void;

interface TestHookProps {
  onUndo: Handler;
  onRedo: Handler;
  onDelete: Handler;
  onSave: Handler;
  target?: Pick<Window, "addEventListener" | "removeEventListener">;
}

const mountedHooks: Array<{ unmount: () => void }> = [];

afterEach(() => {
  for (const hook of mountedHooks.splice(0)) {
    hook.unmount();
  }
});

describe("useKeyboardShortcuts", () => {
  it("triggers save with Ctrl+S and Cmd+S", () => {
    const onSave = vi.fn();
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const onDelete = vi.fn();

    const hook = renderHook(
      (props: TestHookProps) =>
        useKeyboardShortcuts({
          onUndo: props.onUndo,
          onRedo: props.onRedo,
          onDelete: props.onDelete,
          onSave: props.onSave,
          canDelete: true,
          canSave: true,
          target: props.target,
        }),
      { onUndo, onRedo, onDelete, onSave, target: window },
    );
    mountedHooks.push(hook);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", metaKey: true, bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("does not trigger save while typing in input, textarea, or contenteditable", () => {
    const onSave = vi.fn();
    const hook = renderHook(
      (props: TestHookProps) =>
        useKeyboardShortcuts({
          onUndo: props.onUndo,
          onRedo: props.onRedo,
          onDelete: props.onDelete,
          onSave: props.onSave,
          canSave: true,
          target: props.target,
        }),
      {
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        onDelete: vi.fn(),
        onSave,
        target: window,
      },
    );
    mountedHooks.push(hook);

    const input = document.createElement("input");
    document.body.append(input);
    const textarea = document.createElement("textarea");
    document.body.append(textarea);
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    document.body.append(editable);

    const dispatchSave = (target: HTMLElement) => {
      target.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "s",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    };

    act(() => {
      dispatchSave(input);
      dispatchSave(textarea);
      dispatchSave(editable);
    });

    expect(onSave).not.toHaveBeenCalled();

    input.remove();
    textarea.remove();
    editable.remove();
  });

  it("keeps undo/redo/delete shortcuts working", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const onDelete = vi.fn();
    const onSave = vi.fn();

    const hook = renderHook(
      (props: TestHookProps) =>
        useKeyboardShortcuts({
          onUndo: props.onUndo,
          onRedo: props.onRedo,
          onDelete: props.onDelete,
          onSave: props.onSave,
          canUndo: true,
          canRedo: true,
          canDelete: true,
          canSave: true,
          target: props.target,
        }),
      { onUndo, onRedo, onDelete, onSave, target: window },
    );
    mountedHooks.push(hook);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "y", ctrlKey: true, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));
    });

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
