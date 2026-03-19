import { HierarchyPanel } from "@/components/HierarchyPanel";
import { Palette } from "@/components/Palette";
import type { CanvasComponent } from "@/types/canvas";

interface SidebarProps {
  components: CanvasComponent[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
  onMoveComponent: (componentId: string, parentId: string | null, index: number) => void;
}

export function Sidebar({
  components,
  selectedComponentId,
  onSelectComponent,
  onMoveComponent,
}: SidebarProps) {
  return (
    <aside className="flex h-full min-h-0 w-64 shrink-0 flex-col border-r border-vscode-panel-border bg-vscode-panel-background">
      <HierarchyPanel
        components={components}
        selectedComponentId={selectedComponentId}
        onSelectComponent={onSelectComponent}
        onMoveComponent={onMoveComponent}
      />
      <Palette />
    </aside>
  );
}
