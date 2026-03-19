import {
  Braces,
  ChevronDown,
  ChevronRight,
  Circle,
  Component,
  Hash,
  LayoutPanelLeft,
  List,
  ListTree,
  Loader,
  Minus,
  PanelTop,
  Rows3,
  SlidersHorizontal,
  Square,
  SquareMenu,
  Type,
  Wrench,
} from "lucide-react";
import { useEffect, useId, useState } from "react";

import { toSwingTypeLabel } from "@/lib/swingTypeLabels";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  name: string;
  icon: typeof Component;
}

interface PaletteSection {
  id: string;
  name: string;
  items: PaletteItem[];
}

const COMPONENT_ITEMS: PaletteItem[] = [
  { id: "JPanel", name: toSwingTypeLabel("JPanel"), icon: LayoutPanelLeft },
  { id: "JButton", name: toSwingTypeLabel("JButton"), icon: Square },
  { id: "JLabel", name: toSwingTypeLabel("JLabel"), icon: Type },
  { id: "JTextField", name: toSwingTypeLabel("JTextField"), icon: Braces },
  { id: "JTextArea", name: toSwingTypeLabel("JTextArea"), icon: PanelTop },
  { id: "JCheckBox", name: toSwingTypeLabel("JCheckBox"), icon: Component },
  { id: "JRadioButton", name: toSwingTypeLabel("JRadioButton"), icon: Circle },
  { id: "JComboBox", name: toSwingTypeLabel("JComboBox"), icon: ChevronDown },
  { id: "JList", name: toSwingTypeLabel("JList"), icon: List },
  { id: "JProgressBar", name: toSwingTypeLabel("JProgressBar"), icon: Loader },
  { id: "JSlider", name: toSwingTypeLabel("JSlider"), icon: SlidersHorizontal },
  { id: "JSpinner", name: toSwingTypeLabel("JSpinner"), icon: Hash },
  { id: "JSeparator", name: toSwingTypeLabel("JSeparator"), icon: Minus },
];

const CONTAINER_ITEMS: PaletteItem[] = [
  { id: "JMenuBar", name: toSwingTypeLabel("JMenuBar"), icon: Rows3 },
  { id: "JMenu", name: toSwingTypeLabel("JMenu"), icon: SquareMenu },
  { id: "JMenuItem", name: toSwingTypeLabel("JMenuItem"), icon: ListTree },
  { id: "JToolBar", name: toSwingTypeLabel("JToolBar"), icon: Wrench },
];

const PALETTE_SECTIONS: PaletteSection[] = [
  { id: "components", name: "Components", items: COMPONENT_ITEMS },
  { id: "containers", name: "Containers", items: CONTAINER_ITEMS },
];

const PALETTE_COLLAPSED_STORAGE_KEY = "swing-gui-builder.sidebar.palette-collapsed";

function getInitialPaletteCollapsedState(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(PALETTE_COLLAPSED_STORAGE_KEY) === "true";
  } catch (error) {
    console.warn("[Palette] Failed to read persisted collapse state", error);
    return true;
  }
}

export function Palette() {
  const [isCollapsed, setIsCollapsed] = useState(getInitialPaletteCollapsedState);
  const contentId = useId();

  useEffect(() => {
    try {
      window.localStorage.setItem(PALETTE_COLLAPSED_STORAGE_KEY, String(isCollapsed));
    } catch (error) {
      console.warn("[Palette] Failed to persist collapse state", error);
    }
  }, [isCollapsed]);

  const handleDragStart = (event: React.DragEvent<HTMLLIElement>, componentType: string) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", componentType);
    event.dataTransfer.setData("application/x-swing-component", componentType);
  };

  return (
    <section
      className={cn("flex min-h-0 flex-col overflow-hidden", isCollapsed ? "flex-none" : "flex-1")}
      aria-label="Swing component palette"
    >
      <header className="flex items-center justify-between border-b border-vscode-panel-border px-4 py-3">
        <h2 className="text-sm font-semibold">Palette</h2>
        <button
          type="button"
          className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => setIsCollapsed((previous) => !previous)}
          aria-controls={contentId}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Expand palette section" : "Collapse palette section"}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" aria-hidden="true" />
          )}
        </button>
      </header>

      <div
        id={contentId}
        hidden={isCollapsed}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-2"
        aria-label="Draggable Swing components"
      >
        {PALETTE_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-1">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.name}
            </h3>
            <ul
              className="space-y-1"
              aria-label={`Draggable ${section.name.toLowerCase()} components`}
            >
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <li
                    key={item.id}
                    draggable
                    onDragStart={(event) => handleDragStart(event, item.id)}
                    className="flex cursor-grab select-none items-center gap-2 rounded-md border border-transparent px-2 py-2 text-sm hover:border-vscode-panel-border hover:bg-accent active:cursor-grabbing"
                    aria-label={`Drag ${item.name}`}
                    title={`Drag ${item.name} to canvas`}
                  >
                    <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span>{item.name}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
