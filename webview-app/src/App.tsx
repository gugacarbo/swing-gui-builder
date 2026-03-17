import { useCallback, useEffect, useState } from "react";

import { Canvas } from "@/components/Canvas";
import { HierarchyPanel } from "@/components/HierarchyPanel";
import { Palette } from "@/components/Palette";
import { PreviewCodeModal } from "@/components/PreviewCodeModal";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { Toolbar } from "@/components/Toolbar";
import { useCanvasState } from "@/hooks/useCanvasState";
import { useExtensionListener } from "@/hooks/useExtensionListener";
import { moveComponentInHierarchy } from "@/hooks/useHierarchyDragDrop";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePostMessage } from "@/hooks/usePostMessage";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import type { CanvasComponent, CanvasState } from "@/types/canvas";
import type { PreviewCodeFile } from "@/types/messages";

const INITIAL_CANVAS_STATE: CanvasState = {
  className: "MainWindow",
  frameWidth: 1024,
  frameHeight: 768,
  components: [],
};

function App() {
  const { components, selectedComponent, selectedComponentId, setComponents, selectComponent } =
    useCanvasState([]);
  const [frameDimensions, setFrameDimensions] = useState({
    width: INITIAL_CANVAS_STATE.frameWidth,
    height: INITIAL_CANVAS_STATE.frameHeight,
  });
  const [previewFiles, setPreviewFiles] = useState<PreviewCodeFile[]>([]);
  const [selectedPreviewFileName, setSelectedPreviewFileName] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const {
    state: historyComponents,
    set: setComponentHistory,
    reset: resetComponentHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
  } = useUndoRedo<CanvasComponent[]>([]);

  const { postStateChanged, postToolbarCommand, postPreviewCode } = usePostMessage();

  const updateComponents = useCallback(
    (updater: (current: CanvasComponent[]) => CanvasComponent[]) => {
      setComponentHistory((current) => {
        const next = updater(current);
        setComponents(next);
        return next;
      });
    },
    [setComponentHistory, setComponents],
  );

  const handleAddComponent = useCallback(
    (component: CanvasComponent) => {
      updateComponents((current) => [...current, component]);
      selectComponent(component.id);
    },
    [selectComponent, updateComponents],
  );

  const handleMoveComponent = useCallback(
    (id: string, x: number, y: number) => {
      updateComponents((current) =>
        current.map((component) =>
          component.id === id ? { ...component, x: Math.round(x), y: Math.round(y) } : component,
        ),
      );
    },
    [updateComponents],
  );

  const handleResizeComponent = useCallback(
    (id: string, updates: Pick<CanvasComponent, "x" | "y" | "width" | "height">) => {
      updateComponents((current) =>
        current.map((component) =>
          component.id === id ? { ...component, ...updates } : component,
        ),
      );
    },
    [updateComponents],
  );

  const handleUpdateComponent = useCallback(
    (id: string, updates: Partial<CanvasComponent>) => {
      updateComponents((current) =>
        current.map((component) =>
          component.id === id ? { ...component, ...updates } : component,
        ),
      );
    },
    [updateComponents],
  );

  const handleMoveComponentInHierarchy = useCallback(
    (componentId: string, parentId: string, index: number) => {
      updateComponents((current) =>
        moveComponentInHierarchy(current, componentId, parentId, index),
      );
    },
    [updateComponents],
  );

  const handleDelete = useCallback(() => {
    if (!selectedComponentId) {
      return;
    }

    updateComponents((current) =>
      current.filter((component) => component.id !== selectedComponentId),
    );
    selectComponent(null);
  }, [selectComponent, selectedComponentId, updateComponents]);

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

  const handlePreviewCode = useCallback(() => {
    postPreviewCode();
  }, [postPreviewCode]);

  const handleClosePreviewModal = useCallback(() => {
    setIsPreviewModalOpen(false);
  }, []);

  const handleSelectPreviewFile = useCallback((fileName: string) => {
    setSelectedPreviewFileName(fileName);
  }, []);

  const handlePreviewCodeResponse = useCallback((files: PreviewCodeFile[]) => {
    setPreviewFiles(files);
    setSelectedPreviewFileName(files[0]?.fileName ?? null);
    setIsPreviewModalOpen(true);
  }, []);

  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: handleDelete,
    canUndo,
    canRedo,
    canDelete: selectedComponentId !== null,
  });

  useEffect(() => {
    setComponents(historyComponents);
  }, [historyComponents, setComponents]);

  useEffect(() => {
    postStateChanged({
      ...INITIAL_CANVAS_STATE,
      frameWidth: frameDimensions.width,
      frameHeight: frameDimensions.height,
      components,
    });
  }, [components, frameDimensions.height, frameDimensions.width, postStateChanged]);

  useExtensionListener({
    onLoadState: (state) => {
      setComponents(state.components);
      resetComponentHistory(state.components);
      setFrameDimensions({
        width: Math.max(1, Math.round(state.frameWidth)),
        height: Math.max(1, Math.round(state.frameHeight)),
      });
      selectComponent(null);
    },
    onPreviewCodeResponse: handlePreviewCodeResponse,
  });

  return (
    <main className="flex h-screen min-h-screen flex-col bg-vscode-background text-vscode-foreground">
      <header className="border-b border-vscode-panel-border bg-vscode-panel-background px-4 py-2">
        <Toolbar
          canUndo={canUndo}
          canRedo={canRedo}
          canDelete={selectedComponentId !== null}
          canGenerate
          canPreview
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDelete={handleDelete}
          onGenerate={handleGenerate}
          onPreviewCode={handlePreviewCode}
        />
      </header>

      <section className="grid min-h-0 flex-1 grid-cols-[260px_1fr_300px]">
        <aside className="flex min-h-0 flex-col border-r border-vscode-panel-border bg-vscode-panel-background">
          <div className="min-h-0 flex-1">
            <Palette />
          </div>

          <div className="max-h-[45%] min-h-0 border-t border-vscode-panel-border">
            <HierarchyPanel
              components={components}
              selectedComponentId={selectedComponentId}
              onSelectComponent={selectComponent}
              onMoveComponent={handleMoveComponentInHierarchy}
            />
          </div>
        </aside>

        <section
          className="min-h-0 border-r border-vscode-panel-border bg-vscode-background"
          aria-label="Canvas panel"
        >
          <Canvas
            frameWidth={frameDimensions.width}
            frameHeight={frameDimensions.height}
            components={components}
            selectedComponentId={selectedComponentId}
            onSelectComponent={selectComponent}
            onAddComponent={handleAddComponent}
            onMoveComponent={handleMoveComponent}
            onResizeComponent={handleResizeComponent}
          />
        </section>

        <aside className="min-h-0 bg-vscode-panel-background">
          <PropertiesPanel
            component={selectedComponent}
            onUpdateComponent={handleUpdateComponent}
          />

          <div className="mx-4 mb-4 rounded-md border border-vscode-panel-border bg-vscode-background/40 p-3 text-xs text-muted-foreground">
            <p>Selected node: {selectedComponentId ?? "None"}</p>
            <p>History position: {history.past.length}</p>
            <p>History length: {history.past.length + history.future.length}</p>
          </div>
        </aside>
      </section>

      <PreviewCodeModal
        isOpen={isPreviewModalOpen}
        files={previewFiles}
        selectedFileName={selectedPreviewFileName}
        onSelectFile={handleSelectPreviewFile}
        onGenerate={handleGenerate}
        onClose={handleClosePreviewModal}
      />
    </main>
  );
}

export default App;
