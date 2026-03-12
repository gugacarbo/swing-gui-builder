import { useCallback, useEffect } from "react";

import { Canvas } from "@/components/Canvas";
import { Palette } from "@/components/Palette";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { Toolbar } from "@/components/Toolbar";
import { useCanvasState } from "@/hooks/useCanvasState";
import { useExtensionListener } from "@/hooks/useExtensionListener";
import { usePostMessage } from "@/hooks/usePostMessage";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import type { CanvasComponent, CanvasState } from "@/types/canvas";

const INITIAL_CANVAS_STATE: CanvasState = {
  className: "MainWindow",
  frameWidth: 1024,
  frameHeight: 768,
  components: [],
};

function App() {
  const { components, selectedComponent, selectedComponentId, setComponents, selectComponent } = useCanvasState([]);

  const {
    state: componentHistoryState,
    set: setComponentHistory,
    reset: resetComponentHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
  } = useUndoRedo<CanvasComponent[]>([]);

  const { postStateChanged, postToolbarCommand } = usePostMessage();

  const commitComponents = useCallback(
    (updater: (current: CanvasComponent[]) => CanvasComponent[]) => {
      const nextComponents = updater(components);
      setComponents(nextComponents);
      setComponentHistory(nextComponents);
    },
    [components, setComponentHistory, setComponents],
  );

  const handleAddComponent = useCallback(
    (component: CanvasComponent) => {
      commitComponents((current) => [...current, component]);
      selectComponent(component.id);
    },
    [commitComponents, selectComponent],
  );

  const handleMoveComponent = useCallback(
    (id: string, x: number, y: number) => {
      commitComponents((current) =>
        current.map((component) => (component.id === id ? { ...component, x: Math.round(x), y: Math.round(y) } : component)),
      );
    },
    [commitComponents],
  );

  const handleResizeComponent = useCallback(
    (id: string, updates: Pick<CanvasComponent, "x" | "y" | "width" | "height">) => {
      commitComponents((current) => current.map((component) => (component.id === id ? { ...component, ...updates } : component)));
    },
    [commitComponents],
  );

  const handleUpdateComponent = useCallback(
    (id: string, updates: Partial<CanvasComponent>) => {
      commitComponents((current) => current.map((component) => (component.id === id ? { ...component, ...updates } : component)));
    },
    [commitComponents],
  );

  const handleDelete = useCallback(() => {
    if (!selectedComponentId) {
      return;
    }

    commitComponents((current) => current.filter((component) => component.id !== selectedComponentId));
    selectComponent(null);
  }, [commitComponents, selectComponent, selectedComponentId]);

  const handleUndo = useCallback(() => {
    undo();
    postToolbarCommand("undo");
  }, [postToolbarCommand, undo]);

  const handleRedo = useCallback(() => {
    redo();
    postToolbarCommand("redo");
  }, [postToolbarCommand, redo]);

  const handleGenerate = useCallback(() => {
    postToolbarCommand("generate");
  }, [postToolbarCommand]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target?.closest("input, textarea")) {
        return;
      }

      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleRedo, handleUndo]);

  useEffect(() => {
    setComponents(componentHistoryState);
  }, [componentHistoryState, setComponents]);

  useEffect(() => {
    if (selectedComponentId && !components.some((component) => component.id === selectedComponentId)) {
      selectComponent(null);
    }
  }, [components, selectComponent, selectedComponentId]);

  useEffect(() => {
    postStateChanged({
      ...INITIAL_CANVAS_STATE,
      components,
    });
  }, [components, postStateChanged]);

  useExtensionListener({
    onLoadState: (state) => {
      setComponents(state.components);
      resetComponentHistory(state.components);
      selectComponent(null);
    },
  });

  return (
    <main className="flex h-screen min-h-screen flex-col bg-vscode-background text-vscode-foreground">
      <header className="border-b border-vscode-panel-border bg-vscode-panel-background px-4 py-2">
        <Toolbar
          canUndo={canUndo}
          canRedo={canRedo}
          canDelete={selectedComponentId !== null}
          canGenerate
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDelete={handleDelete}
          onGenerate={handleGenerate}
        />
      </header>

      <section className="grid min-h-0 flex-1 grid-cols-[260px_1fr_300px]">
        <aside className="min-h-0 border-r border-vscode-panel-border bg-vscode-panel-background">
          <Palette />
        </aside>

        <section className="min-h-0 border-r border-vscode-panel-border bg-vscode-background" aria-label="Canvas panel">
          <Canvas
            components={components}
            selectedComponentId={selectedComponentId}
            onSelectComponent={selectComponent}
            onAddComponent={handleAddComponent}
            onMoveComponent={handleMoveComponent}
            onResizeComponent={handleResizeComponent}
          />
        </section>

        <aside className="min-h-0 bg-vscode-panel-background">
          <PropertiesPanel component={selectedComponent} onUpdateComponent={handleUpdateComponent} />

          <div className="mx-4 mb-4 rounded-md border border-vscode-panel-border bg-vscode-background/40 p-3 text-xs text-muted-foreground">
            <p>Selected node: {selectedComponentId ?? "None"}</p>
            <p>History position: {history.past.length}</p>
            <p>History length: {history.past.length + history.future.length}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default App;
