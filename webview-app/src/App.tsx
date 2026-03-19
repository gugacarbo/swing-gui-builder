import { useCallback, useEffect, useRef, useState } from "react";

import { Canvas } from "@/components/Canvas";
import { FrameConfigModal, type FrameConfigurationValues } from "@/components/FrameConfigModal";
import { PreviewCodeModal } from "@/components/PreviewCodeModal";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { Sidebar } from "@/components/Sidebar";
import { Toolbar } from "@/components/Toolbar";
import { useCanvasState } from "@/hooks/useCanvasState";
import { useExtensionListener } from "@/hooks/useExtensionListener";
import { moveComponentInHierarchy } from "@/hooks/useHierarchyDragDrop";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePostMessage } from "@/hooks/usePostMessage";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { clamp } from "@/lib/geometry";
import type { CanvasComponent, CanvasState } from "@/types/canvas";
import type { PreviewCodeFile } from "@/types/messages";

const INITIAL_CANVAS_STATE: CanvasState = {
  className: "MainWindow",
  frameTitle: "MainWindow",
  frameWidth: 1024,
  frameHeight: 768,
  components: [],
};

function buildComponentMap(components: CanvasComponent[]): Map<string, CanvasComponent> {
  return new Map(components.map((component) => [component.id, component]));
}

function buildChildLookup(components: CanvasComponent[]): Map<string, string[]> {
  const childLookup = new Map<string, string[]>();
  const componentIds = new Set(components.map((component) => component.id));

  const addChild = (parentId: string, childId: string) => {
    if (!componentIds.has(parentId) || !componentIds.has(childId)) {
      return;
    }

    const children = childLookup.get(parentId) ?? [];
    if (!children.includes(childId)) {
      children.push(childId);
      childLookup.set(parentId, children);
    }
  };

  for (const component of components) {
    if (component.parentId) {
      addChild(component.parentId, component.id);
    }

    for (const childId of component.children ?? []) {
      addChild(component.id, childId);
    }
  }

  return childLookup;
}

function collectDescendantIds(rootId: string, childLookup: Map<string, string[]>): Set<string> {
  const descendants = new Set<string>();
  const stack = [rootId];

  while (stack.length > 0) {
    const parentId = stack.pop();
    if (!parentId) {
      continue;
    }

    for (const childId of childLookup.get(parentId) ?? []) {
      if (childId === rootId || descendants.has(childId)) {
        continue;
      }

      descendants.add(childId);
      stack.push(childId);
    }
  }

  return descendants;
}

function normalizeToParentPanelBounds(
  component: CanvasComponent,
  componentsById: Map<string, CanvasComponent>,
): CanvasComponent {
  if (!component.parentId) {
    return component;
  }

  const parent = componentsById.get(component.parentId);
  if (!parent || parent.type !== "Panel") {
    return component;
  }

  const panelX = Math.round(parent.x);
  const panelY = Math.round(parent.y);
  const panelWidth = Math.max(1, Math.round(parent.width));
  const panelHeight = Math.max(1, Math.round(parent.height));

  const width = Math.min(Math.max(1, Math.round(component.width)), panelWidth);
  const height = Math.min(Math.max(1, Math.round(component.height)), panelHeight);
  const x = clamp(Math.round(component.x), panelX, panelX + Math.max(0, panelWidth - width));
  const y = clamp(Math.round(component.y), panelY, panelY + Math.max(0, panelHeight - height));

  return {
    ...component,
    x,
    y,
    width,
    height,
    parentOffset: {
      x: x - panelX,
      y: y - panelY,
    },
  };
}

function App() {
  const { components, selectedComponent, selectedComponentId, setComponents, selectComponent } =
    useCanvasState([]);
  const [frameDimensions, setFrameDimensions] = useState({
    width: INITIAL_CANVAS_STATE.frameWidth,
    height: INITIAL_CANVAS_STATE.frameHeight,
  });
  const [frameBackgroundColor, setFrameBackgroundColor] = useState<string | undefined>(
    INITIAL_CANVAS_STATE.backgroundColor,
  );
  const [frameTitle, setFrameTitle] = useState(
    INITIAL_CANVAS_STATE.frameTitle ?? INITIAL_CANVAS_STATE.className,
  );
  const [isFrameConfigModalOpen, setIsFrameConfigModalOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<PreviewCodeFile[]>([]);
  const [selectedPreviewFileName, setSelectedPreviewFileName] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const interactionHistoryStartRef = useRef<CanvasComponent[] | null>(null);

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
    (
      updater: (current: CanvasComponent[]) => CanvasComponent[],
      historyOptions: {
        mode?: "push" | "replace" | "pushFrom";
        from?: CanvasComponent[];
      } = {},
    ) => {
      setComponentHistory((current) => {
        const next = updater(current);
        setComponents(next);
        return next;
      }, historyOptions);
    },
    [setComponentHistory, setComponents],
  );

  const handleComponentInteractionStart = useCallback(
    (_id: string, _mode: "move" | "resize") => {
      if (interactionHistoryStartRef.current === null) {
        interactionHistoryStartRef.current = historyComponents;
      }
    },
    [historyComponents],
  );

  const handleComponentInteractionEnd = useCallback(
    (_id: string, _mode: "move" | "resize") => {
      const interactionHistoryStart = interactionHistoryStartRef.current;
      if (!interactionHistoryStart) {
        return;
      }

      interactionHistoryStartRef.current = null;
      setComponentHistory((current) => current, {
        mode: "pushFrom",
        from: interactionHistoryStart,
      });
    },
    [setComponentHistory],
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
      updateComponents(
        (current) => {
          const componentsById = buildComponentMap(current);
          const target = componentsById.get(id);
          if (!target) {
            return current;
          }

          const nextX = Math.round(x);
          const nextY = Math.round(y);

          if (target.type === "Panel") {
            const deltaX = nextX - Math.round(target.x);
            const deltaY = nextY - Math.round(target.y);

            if (deltaX === 0 && deltaY === 0) {
              return current;
            }

            const descendants = collectDescendantIds(id, buildChildLookup(current));

            return current.map((component) => {
              if (component.id === id) {
                return { ...component, x: nextX, y: nextY };
              }

              if (!descendants.has(component.id)) {
                return component;
              }

              return {
                ...component,
                x: Math.round(component.x + deltaX),
                y: Math.round(component.y + deltaY),
              };
            });
          }

          return current.map((component) => {
            if (component.id !== id) {
              return component;
            }

            return normalizeToParentPanelBounds(
              { ...component, x: nextX, y: nextY },
              componentsById,
            );
          });
        },
        { mode: interactionHistoryStartRef.current ? "replace" : "push" },
      );
    },
    [updateComponents],
  );

  const handleResizeComponent = useCallback(
    (id: string, updates: Pick<CanvasComponent, "x" | "y" | "width" | "height">) => {
      updateComponents(
        (current) => {
          const componentsById = buildComponentMap(current);
          const target = componentsById.get(id);
          if (!target) {
            return current;
          }

          const roundedUpdates = {
            x: Math.round(updates.x),
            y: Math.round(updates.y),
            width: Math.max(1, Math.round(updates.width)),
            height: Math.max(1, Math.round(updates.height)),
          };

          const resizedComponents = current.map((component) => {
            if (component.id !== id) {
              return component;
            }

            return normalizeToParentPanelBounds(
              { ...component, ...roundedUpdates },
              componentsById,
            );
          });

          if (target.type !== "Panel") {
            return resizedComponents;
          }

          const resizedById = buildComponentMap(resizedComponents);
          return resizedComponents.map((component) =>
            normalizeToParentPanelBounds(component, resizedById),
          );
        },
        { mode: interactionHistoryStartRef.current ? "replace" : "push" },
      );
    },
    [updateComponents],
  );

  const handleUpdateComponent = useCallback(
    (id: string, updates: Partial<CanvasComponent>) => {
      updateComponents((current) => {
        const nextComponents = current.map((component) =>
          component.id === id ? { ...component, ...updates } : component,
        );
        const nextById = buildComponentMap(nextComponents);
        return nextComponents.map((component) => normalizeToParentPanelBounds(component, nextById));
      });
    },
    [updateComponents],
  );

  const handleMoveComponentInHierarchy = useCallback(
    (componentId: string, parentId: string | null, index: number) => {
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

  const handleSave = useCallback(() => {
    postToolbarCommand("save");
  }, [postToolbarCommand]);

  const handleOpenFrameConfig = useCallback(() => {
    setIsFrameConfigModalOpen(true);
  }, []);

  const handleCloseFrameConfig = useCallback(() => {
    setIsFrameConfigModalOpen(false);
  }, []);

  const handleApplyFrameConfig = useCallback((values: FrameConfigurationValues) => {
    setFrameDimensions({
      width: values.width,
      height: values.height,
    });
    setFrameTitle(values.title);
    setFrameBackgroundColor(values.backgroundColor);
  }, []);

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
    onSave: handleSave,
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
      frameTitle,
      frameWidth: frameDimensions.width,
      frameHeight: frameDimensions.height,
      backgroundColor: frameBackgroundColor,
      components,
    });
  }, [
    components,
    frameBackgroundColor,
    frameDimensions.height,
    frameDimensions.width,
    frameTitle,
    postStateChanged,
  ]);

  useExtensionListener({
    onLoadState: (state) => {
      setComponents(state.components);
      resetComponentHistory(state.components);
      setFrameDimensions({
        width: Math.max(1, Math.round(state.frameWidth)),
        height: Math.max(1, Math.round(state.frameHeight)),
      });
      setFrameTitle(state.frameTitle ?? state.className);
      setFrameBackgroundColor(state.backgroundColor ?? INITIAL_CANVAS_STATE.backgroundColor);
      selectComponent(null);
    },
    onPreviewCodeResponse: handlePreviewCodeResponse,
  });

  return (
    <main className="flex h-screen min-h-screen flex-col overflow-hidden bg-vscode-background text-vscode-foreground">
      <header className="shrink-0 border-b border-vscode-panel-border bg-vscode-panel-background px-4 py-2">
        <Toolbar
          canUndo={canUndo}
          canRedo={canRedo}
          canDelete={selectedComponentId !== null}
          canGenerate
          canPreview
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDelete={handleDelete}
          onConfigureFrame={handleOpenFrameConfig}
          onGenerate={handleGenerate}
          onPreviewCode={handlePreviewCode}
        />
      </header>

      <section className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          components={components}
          selectedComponentId={selectedComponentId}
          onSelectComponent={selectComponent}
          onMoveComponent={handleMoveComponentInHierarchy}
        />

        <section className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <section
            className="min-h-0 min-w-0 flex-1 overflow-hidden border-r border-vscode-panel-border bg-vscode-background"
            aria-label="Canvas panel"
          >
            <Canvas
              frameWidth={frameDimensions.width}
              frameHeight={frameDimensions.height}
              frameTitle={frameTitle}
              frameBackgroundColor={frameBackgroundColor}
              components={components}
              selectedComponentId={selectedComponentId}
              onSelectComponent={selectComponent}
              onAddComponent={handleAddComponent}
              onMoveComponent={handleMoveComponent}
              onResizeComponent={handleResizeComponent}
              onComponentInteractionStart={handleComponentInteractionStart}
              onComponentInteractionEnd={handleComponentInteractionEnd}
            />
          </section>

          <aside className="min-h-0 w-75 shrink-0 bg-vscode-panel-background">
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
      </section>

      <PreviewCodeModal
        isOpen={isPreviewModalOpen}
        files={previewFiles}
        selectedFileName={selectedPreviewFileName}
        onSelectFile={handleSelectPreviewFile}
        onGenerate={handleGenerate}
        onClose={handleClosePreviewModal}
      />

      <FrameConfigModal
        isOpen={isFrameConfigModalOpen}
        initialWidth={frameDimensions.width}
        initialHeight={frameDimensions.height}
        initialTitle={frameTitle}
        initialBackgroundColor={frameBackgroundColor}
        onApply={handleApplyFrameConfig}
        onClose={handleCloseFrameConfig}
      />
    </main>
  );
}

export default App;
