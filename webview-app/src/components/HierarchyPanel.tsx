import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { useHierarchyDragDrop, type HierarchyDropTarget } from "@/hooks/useHierarchyDragDrop";
import { toSwingTypeLabel } from "@/lib/swingTypeLabels";
import { cn } from "@/lib/utils";
import type { CanvasComponent } from "@/types/canvas";

interface HierarchyPanelProps {
  components: CanvasComponent[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
  onMoveComponent: (componentId: string, parentId: string, index: number) => void;
}

interface HierarchyNode {
  component: CanvasComponent;
  children: HierarchyNode[];
}

interface HierarchyTreeNodeProps {
  node: HierarchyNode;
  depth: number;
  selectedComponentId: string | null;
  collapsedNodeIds: ReadonlySet<string>;
  onSelectComponent: (id: string) => void;
  onToggleNode: (id: string) => void;
  draggingComponentId: string | null;
  dropTarget: HierarchyDropTarget | null;
  isDraggableComponent: (componentId: string) => boolean;
  onDragStart: (event: React.DragEvent<HTMLElement>, componentId: string) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>, targetComponentId: string) => void;
  onDrop: (event: React.DragEvent<HTMLElement>, targetComponentId: string) => void;
  onDragEnd: () => void;
}

const HIERARCHY_COLLAPSED_STORAGE_KEY = "swing-gui-builder.sidebar.hierarchy-collapsed";

function getInitialHierarchyCollapsedState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(HIERARCHY_COLLAPSED_STORAGE_KEY) === "true";
  } catch (error) {
    console.warn("[HierarchyPanel] Failed to read persisted collapse state", error);
    return false;
  }
}

function getComponentName(component: CanvasComponent): string {
  return component.variableName || component.text || component.id;
}

function collectNodeIds(node: HierarchyNode, ids: Set<string>): void {
  ids.add(node.component.id);
  for (const child of node.children) {
    collectNodeIds(child, ids);
  }
}

function collectExpandableNodeIds(nodes: HierarchyNode[]): string[] {
  const expandableNodeIds: string[] = [];

  const traverse = (node: HierarchyNode) => {
    if (node.children.length > 0) {
      expandableNodeIds.push(node.component.id);
    }

    for (const child of node.children) {
      traverse(child);
    }
  };

  for (const node of nodes) {
    traverse(node);
  }

  return expandableNodeIds;
}

function buildHierarchyTree(components: CanvasComponent[]): HierarchyNode[] {
  if (components.length === 0) {
    return [];
  }

  const componentsById = new Map(components.map((component) => [component.id, component]));

  const getOrderedChildren = (component: CanvasComponent): CanvasComponent[] => {
    const explicitChildren = (component.children ?? [])
      .map((childId) => componentsById.get(childId))
      .filter((child): child is CanvasComponent => child !== undefined);

    const explicitChildIds = new Set(explicitChildren.map((child) => child.id));
    const implicitChildren = components.filter(
      (candidate) => candidate.parentId === component.id && !explicitChildIds.has(candidate.id),
    );

    return [...explicitChildren, ...implicitChildren];
  };

  const buildNode = (component: CanvasComponent, ancestry: Set<string>): HierarchyNode => {
    if (ancestry.has(component.id)) {
      return { component, children: [] };
    }

    const nextAncestry = new Set(ancestry);
    nextAncestry.add(component.id);

    const children = getOrderedChildren(component).map((child) => buildNode(child, nextAncestry));

    return {
      component,
      children,
    };
  };

  const rootComponents = components.filter((component) => !component.parentId || !componentsById.has(component.parentId));
  const orderedRoots = rootComponents.length > 0 ? rootComponents : components;

  const visitedNodeIds = new Set<string>();
  const tree: HierarchyNode[] = [];

  for (const rootComponent of orderedRoots) {
    if (visitedNodeIds.has(rootComponent.id)) {
      continue;
    }

    const rootNode = buildNode(rootComponent, new Set<string>());
    tree.push(rootNode);
    collectNodeIds(rootNode, visitedNodeIds);
  }

  for (const component of components) {
    if (visitedNodeIds.has(component.id)) {
      continue;
    }

    const fallbackNode = buildNode(component, new Set<string>());
    tree.push(fallbackNode);
    collectNodeIds(fallbackNode, visitedNodeIds);
  }

  return tree;
}

function HierarchyTreeNode({
  node,
  depth,
  selectedComponentId,
  collapsedNodeIds,
  onSelectComponent,
  onToggleNode,
  draggingComponentId,
  dropTarget,
  isDraggableComponent,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: HierarchyTreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = hasChildren && !collapsedNodeIds.has(node.component.id);
  const componentName = getComponentName(node.component);
  const isSelected = selectedComponentId === node.component.id;
  const isDragging = draggingComponentId === node.component.id;
  const isDropTarget = dropTarget?.componentId === node.component.id;
  const isDraggable = isDraggableComponent(node.component.id);

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className="flex items-center gap-1"
        style={{ paddingLeft: `${depth * 14}px` }}
        onDragOver={(event) => onDragOver(event, node.component.id)}
        onDrop={(event) => onDrop(event, node.component.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="inline-flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => onToggleNode(node.component.id)}
            aria-label={isExpanded ? `Collapse ${componentName} subtree` : `Expand ${componentName} subtree`}
          >
            {isExpanded ? <ChevronDown className="size-3" aria-hidden="true" /> : <ChevronRight className="size-3" aria-hidden="true" />}
          </button>
        ) : (
          <span className="inline-flex size-4 shrink-0" aria-hidden="true" />
        )}

        <button
          type="button"
          className={`flex min-w-0 flex-1 items-center justify-between rounded px-2 py-1 text-left text-xs ${
            isSelected ? "bg-accent text-foreground" : "text-vscode-foreground hover:bg-accent/70"
          } ${isDropTarget ? "bg-[var(--canvas-drop-target)] outline-1 outline-[var(--canvas-selection)]" : ""} ${
            isDraggable ? "cursor-grab active:cursor-grabbing" : ""
          } ${isDragging ? "opacity-60" : ""}`}
          draggable={isDraggable}
          onDragStart={(event) => onDragStart(event, node.component.id)}
          onDragEnd={onDragEnd}
          onClick={() => onSelectComponent(node.component.id)}
        >
          <span className="truncate font-medium">{componentName}</span>
          <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">{toSwingTypeLabel(node.component.type)}</span>
        </button>
      </div>

      {hasChildren && isExpanded ? (
        <ul role="group" className="space-y-0.5">
          {node.children.map((childNode) => (
            <HierarchyTreeNode
              key={childNode.component.id}
              node={childNode}
              depth={depth + 1}
                selectedComponentId={selectedComponentId}
                collapsedNodeIds={collapsedNodeIds}
                onSelectComponent={onSelectComponent}
                onToggleNode={onToggleNode}
                draggingComponentId={draggingComponentId}
                dropTarget={dropTarget}
                isDraggableComponent={isDraggableComponent}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
            ))}
          </ul>
      ) : null}
    </li>
  );
}

export function HierarchyPanel({ components, selectedComponentId, onSelectComponent, onMoveComponent }: HierarchyPanelProps) {
  const hierarchyTree = useMemo(() => buildHierarchyTree(components), [components]);
  const expandableNodeIds = useMemo(() => collectExpandableNodeIds(hierarchyTree), [hierarchyTree]);
  const hasExpandableNodes = expandableNodeIds.length > 0;
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(getInitialHierarchyCollapsedState);
  const contentId = useId();
  const { draggingComponentId, dropTarget, isDraggableComponent, handleDragStart, handleDragOver, handleDrop, handleDragEnd } =
    useHierarchyDragDrop({
      components,
      onMoveComponent,
    });

  useEffect(() => {
    const validNodeIds = new Set(expandableNodeIds);

    setCollapsedNodeIds((previous) => {
      const next = new Set<string>();
      for (const nodeId of previous) {
        if (validNodeIds.has(nodeId)) {
          next.add(nodeId);
        }
      }
      return next;
    });
  }, [expandableNodeIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HIERARCHY_COLLAPSED_STORAGE_KEY, String(isCollapsed));
    } catch (error) {
      console.warn("[HierarchyPanel] Failed to persist collapse state", error);
    }
  }, [isCollapsed]);

  const handleToggleNode = useCallback((id: string) => {
    setCollapsedNodeIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodeIds(new Set());
  }, []);

  const handleCollapseAll = useCallback(() => {
    setCollapsedNodeIds(new Set(expandableNodeIds));
  }, [expandableNodeIds]);

  return (
    <section
      className={cn("flex min-h-0 flex-col border-t border-vscode-panel-border", isCollapsed ? "shrink-0" : "flex-1")}
      aria-label="Hierarchy panel"
    >
      <header className="flex items-center justify-between border-b border-vscode-panel-border px-3 py-2">
        <h2 className="text-sm font-semibold">Hierarchy</h2>
        <div className="flex items-center gap-1">
          {!isCollapsed ? (
            <>
              <button
                type="button"
                className="rounded border border-vscode-panel-border px-2 py-0.5 text-[11px] hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleExpandAll}
                disabled={!hasExpandableNodes}
              >
                Expand all
              </button>
              <button
                type="button"
                className="rounded border border-vscode-panel-border px-2 py-0.5 text-[11px] hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCollapseAll}
                disabled={!hasExpandableNodes}
              >
                Collapse all
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => setIsCollapsed((previous) => !previous)}
            aria-controls={contentId}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Expand hierarchy section" : "Collapse hierarchy section"}
          >
            {isCollapsed ? <ChevronRight className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </header>

      <div id={contentId} hidden={isCollapsed} className="min-h-0 flex-1 overflow-y-auto p-2">
        {hierarchyTree.length > 0 ? (
          <ul role="tree" aria-label="Component hierarchy tree" className="space-y-0.5">
            {hierarchyTree.map((node) => (
              <HierarchyTreeNode
                key={node.component.id}
                node={node}
                depth={0}
                selectedComponentId={selectedComponentId}
                collapsedNodeIds={collapsedNodeIds}
                onSelectComponent={onSelectComponent}
                onToggleNode={handleToggleNode}
                draggingComponentId={draggingComponentId}
                dropTarget={dropTarget}
                isDraggableComponent={isDraggableComponent}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            ))}
          </ul>
        ) : (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Add components to see their hierarchy. Drag JMenu and JMenuItem nodes here to reorder menu structures.
          </p>
        )}
      </div>
    </section>
  );
}
