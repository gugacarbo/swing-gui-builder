import { useEffect, useMemo } from "react";
import { FileCode2, FolderTree, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PreviewCodeFile } from "@/types/messages";

interface PreviewCodeModalProps {
  isOpen: boolean;
  files: PreviewCodeFile[];
  selectedFileName: string | null;
  onSelectFile: (fileName: string) => void;
  onGenerate: () => void;
  onClose: () => void;
}

interface PreviewTreeFolderNode {
  kind: "folder";
  id: string;
  name: string;
  children: PreviewTreeNode[];
}

interface PreviewTreeFileNode {
  kind: "file";
  id: string;
  name: string;
  file: PreviewCodeFile;
}

type PreviewTreeNode = PreviewTreeFolderNode | PreviewTreeFileNode;

interface MutableFolderNode {
  id: string;
  name: string;
  folders: Map<string, MutableFolderNode>;
  files: PreviewTreeFileNode[];
}

function normalizeFilePath(fileName: string): string {
  return fileName.trim().replace(/\\/g, "/").replace(/^\/+/, "");
}

function createMutableFolderNode(id: string, name: string): MutableFolderNode {
  return {
    id,
    name,
    folders: new Map<string, MutableFolderNode>(),
    files: [],
  };
}

function compareByName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function toPreviewTreeNodes(folder: MutableFolderNode): PreviewTreeNode[] {
  const folderNodes = [...folder.folders.values()]
    .sort(compareByName)
    .map<PreviewTreeFolderNode>((child) => ({
      kind: "folder",
      id: child.id,
      name: child.name,
      children: toPreviewTreeNodes(child),
    }));

  const fileNodes = [...folder.files].sort(compareByName);
  return [...folderNodes, ...fileNodes];
}

function buildPreviewTree(files: PreviewCodeFile[]): PreviewTreeNode[] {
  const root = createMutableFolderNode("", "");

  files
    .slice()
    .sort((left, right) => left.fileName.localeCompare(right.fileName, undefined, { sensitivity: "base" }))
    .forEach((file, index) => {
      const normalizedPath = normalizeFilePath(file.fileName);
      const parts = normalizedPath.split("/").filter((part) => part.length > 0);

      if (parts.length === 0) {
        root.files.push({
          kind: "file",
          id: `${file.fileName}-${index}`,
          name: file.fileName || `untitled-${index + 1}.java`,
          file,
        });
        return;
      }

      let currentFolder = root;
      let currentPath = "";

      for (const part of parts.slice(0, -1)) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        let nextFolder = currentFolder.folders.get(currentPath);

        if (!nextFolder) {
          nextFolder = createMutableFolderNode(currentPath, part);
          currentFolder.folders.set(currentPath, nextFolder);
        }

        currentFolder = nextFolder;
      }

      const fileLabel = parts.at(-1) ?? file.fileName;
      currentFolder.files.push({
        kind: "file",
        id: normalizedPath || `${file.fileName}-${index}`,
        name: fileLabel,
        file,
      });
    });

  return toPreviewTreeNodes(root);
}

function renderTreeNodes(
  nodes: PreviewTreeNode[],
  selectedFileName: string | null,
  onSelectFile: (fileName: string) => void,
  depth = 0,
): React.ReactNode {
  return (
    <ul className={cn("space-y-0.5", depth > 0 && "pl-4")}>
      {nodes.map((node) => {
        if (node.kind === "folder") {
          return (
            <li key={node.id} className="space-y-0.5">
              <div className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground">
                <FolderTree className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{node.name}</span>
              </div>
              {node.children.length > 0 ? renderTreeNodes(node.children, selectedFileName, onSelectFile, depth + 1) : null}
            </li>
          );
        }

        const isSelected = node.file.fileName === selectedFileName;

        return (
          <li key={node.id}>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs",
                isSelected ? "bg-accent text-foreground" : "text-vscode-foreground hover:bg-accent/70",
              )}
              onClick={() => onSelectFile(node.file.fileName)}
              title={node.file.fileName}
            >
              <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{node.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function PreviewCodeModal({ isOpen, files, selectedFileName, onSelectFile, onGenerate, onClose }: PreviewCodeModalProps) {
  const selectedFile = useMemo(
    () => files.find((file) => file.fileName === selectedFileName) ?? null,
    [files, selectedFileName],
  );
  const previewTree = useMemo(() => buildPreviewTree(files), [files]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleGenerate = () => {
    onGenerate();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-code-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="flex h-full max-h-[920px] w-full max-w-6xl min-w-0 flex-col overflow-hidden rounded-lg border border-vscode-panel-border bg-vscode-panel-background shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-vscode-panel-border px-4 py-3">
          <div className="min-w-0">
            <h2 id="preview-code-title" className="truncate text-sm font-semibold">
              Code Preview
            </h2>
            <p className="text-xs text-muted-foreground">
              {files.length} file{files.length === 1 ? "" : "s"} ready for review
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleGenerate}>
              Generate
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose} aria-label="Close preview modal">
              <X className="size-4" aria-hidden="true" />
              Close
            </Button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr]">
          <aside className="min-h-0 border-r border-vscode-panel-border bg-vscode-background/45">
            <div className="border-b border-vscode-panel-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Files
            </div>
            <div className="h-full overflow-y-auto p-2">
              {previewTree.length > 0 ? (
                renderTreeNodes(previewTree, selectedFileName, onSelectFile)
              ) : (
                <p className="rounded border border-dashed border-vscode-panel-border px-3 py-3 text-xs text-muted-foreground">
                  Preview returned no files.
                </p>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-col">
            <div className="border-b border-vscode-panel-border px-4 py-2 text-xs text-muted-foreground">
              {selectedFile?.fileName ?? "No file selected"}
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-vscode-background">
              {selectedFile ? (
                <pre className="h-full min-h-full whitespace-pre p-4 font-mono text-[12px] leading-5 text-vscode-foreground">
                  <code>{selectedFile.content}</code>
                </pre>
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
                  Select a file from the list to inspect generated code.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
