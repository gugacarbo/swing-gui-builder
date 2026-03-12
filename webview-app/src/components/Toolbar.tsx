import { WandSparkles, Undo2, Redo2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  canDelete: boolean;
  canGenerate: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onGenerate: () => void;
}

export function Toolbar({
  canUndo,
  canRedo,
  canDelete,
  canGenerate,
  onUndo,
  onRedo,
  onDelete,
  onGenerate,
}: ToolbarProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Editor actions toolbar">
      <Button type="button" variant="outline" size="sm" onClick={onUndo} disabled={!canUndo} aria-label="Undo">
        <Undo2 aria-hidden="true" />
        Undo
      </Button>

      <Button type="button" variant="outline" size="sm" onClick={onRedo} disabled={!canRedo} aria-label="Redo">
        <Redo2 aria-hidden="true" />
        Redo
      </Button>

      <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={!canDelete} aria-label="Delete selected component">
        <Trash2 aria-hidden="true" />
        Delete
      </Button>

      <Button type="button" size="sm" onClick={onGenerate} disabled={!canGenerate} aria-label="Generate Java code">
        <WandSparkles aria-hidden="true" />
        Generate
      </Button>
    </nav>
  );
}
