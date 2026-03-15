import {
  Braces,
  ChevronDown,
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
  SquareMenu,
  Square,
  Type,
  Wrench,
} from "lucide-react";

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
  { id: "JPanel", name: "JPanel", icon: LayoutPanelLeft },
  { id: "JButton", name: "JButton", icon: Square },
  { id: "JLabel", name: "JLabel", icon: Type },
  { id: "JTextField", name: "JTextField", icon: Braces },
  { id: "JTextArea", name: "JTextArea", icon: PanelTop },
  { id: "JCheckBox", name: "JCheckBox", icon: Component },
  { id: "JRadioButton", name: "JRadioButton", icon: Circle },
  { id: "JComboBox", name: "JComboBox", icon: ChevronDown },
  { id: "JList", name: "JList", icon: List },
  { id: "JProgressBar", name: "JProgressBar", icon: Loader },
  { id: "JSlider", name: "JSlider", icon: SlidersHorizontal },
  { id: "JSpinner", name: "JSpinner", icon: Hash },
  { id: "JSeparator", name: "JSeparator", icon: Minus },
];

const CONTAINER_ITEMS: PaletteItem[] = [
  { id: "JMenuBar", name: "JMenuBar", icon: Rows3 },
  { id: "JMenu", name: "JMenu", icon: SquareMenu },
  { id: "JMenuItem", name: "JMenuItem", icon: ListTree },
  { id: "JToolBar", name: "JToolBar", icon: Wrench },
];

const PALETTE_SECTIONS: PaletteSection[] = [
  { id: "components", name: "Components", items: COMPONENT_ITEMS },
  { id: "containers", name: "Containers", items: CONTAINER_ITEMS },
];

export function Palette() {
  const handleDragStart = (event: React.DragEvent<HTMLLIElement>, componentType: string) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", componentType);
    event.dataTransfer.setData("application/x-swing-component", componentType);
  };

  return (
    <section className="flex h-full flex-col" aria-label="Swing component palette">
      <header className="border-b border-vscode-panel-border px-4 py-3">
        <h2 className="text-sm font-semibold">Palette</h2>
      </header>

      <div className="space-y-4 overflow-y-auto p-2" aria-label="Draggable Swing components">
        {PALETTE_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-1">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.name}
            </h3>
            <ul className="space-y-1" aria-label={`Draggable ${section.name.toLowerCase()} components`}>
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
