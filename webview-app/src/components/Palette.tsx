import {
  Braces,
  Component,
  LayoutPanelLeft,
  PanelTop,
  Square,
  Type,
} from "lucide-react";

interface PaletteItem {
  id: string;
  name: string;
  icon: typeof Component;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { id: "JPanel", name: "JPanel", icon: LayoutPanelLeft },
  { id: "JButton", name: "JButton", icon: Square },
  { id: "JLabel", name: "JLabel", icon: Type },
  { id: "JTextField", name: "JTextField", icon: Braces },
  { id: "JTextArea", name: "JTextArea", icon: PanelTop },
  { id: "JCheckBox", name: "JCheckBox", icon: Component },
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

      <ul className="space-y-1 overflow-y-auto p-2" aria-label="Draggable Swing components">
        {PALETTE_ITEMS.map((item) => {
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
    </section>
  );
}
