# Arquitetura Final do Projeto

## Visão geral

Após a refatoração, o projeto está organizado em três camadas principais:

1. **Extensão VS Code (`src/`)**: orquestra comandos, webview e geração de código Java.
2. **Tipos compartilhados (`shared/`)**: contrato único de tipos entre extensão e webview.
3. **Webview React (`webview-app/`)**: interface visual de edição do canvas.

---

## Estrutura de pastas (final)

```text
swing-gui-builder-vscode/
├── docs/
│   └── architecture.md
├── shared/
│   └── types/
│       └── canvas.ts
├── src/
│   ├── extension.ts
│   ├── canvas/
│   │   └── CanvasPanel.ts
│   ├── commands/
│   │   ├── generateCommand.ts
│   │   ├── initConfigCommand.ts
│   │   ├── newWindowCommand.ts
│   │   ├── openCommand.ts
│   │   ├── previewCodeCommand.ts
│   │   └── saveCommand.ts
│   ├── components/
│   │   └── ComponentModel.ts
│   ├── config/
│   │   ├── ConfigReader.ts
│   │   └── initConfigCommand.ts
│   ├── generator/
│   │   ├── JavaGenerator.ts
│   │   ├── codeHelpers.ts
│   │   ├── componentGenerators.ts
│   │   └── swingMappings.ts
│   └── utils/
│       └── JavaProjectDetector.ts
├── schemas/
│   └── swingbuilder.schema.json
└── webview-app/
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── components/
        │   ├── Canvas.tsx
        │   ├── Canvas/
        │   │   ├── MenuBarZone.tsx
        │   │   ├── ToolBarZone.tsx
        │   │   ├── constants.ts
        │   │   ├── fixedZoneHelpers.ts
        │   │   └── fixedZoneLayout.ts
        │   ├── CanvasComponent.tsx
        │   ├── CanvasComponent/
        │   │   ├── componentView.tsx
        │   │   ├── minSizes.ts
        │   │   ├── previewRenderers.tsx
        │   │   └── resizeHandles.tsx
        │   ├── HierarchyPanel.tsx
        │   ├── Palette.tsx
        │   ├── PreviewCodeModal.tsx
        │   ├── Toolbar.tsx
        │   ├── PropertiesPanel/
        │   │   ├── index.tsx
        │   │   ├── ColorField.tsx
        │   │   ├── FormField.tsx
        │   │   └── NumberField.tsx
        │   └── ui/
        │       └── button.tsx
        ├── hooks/
        │   ├── useCanvasDragDrop.ts
        │   ├── useCanvasState.ts
        │   ├── useCanvasZoomPan.ts
        │   ├── useDragInteraction.ts
        │   ├── useExtensionListener.ts
        │   ├── useHierarchyDragDrop.ts
        │   ├── useKeyboardShortcuts.ts
        │   ├── usePostMessage.ts
        │   └── useUndoRedo.ts
        ├── lib/
        │   ├── componentDefaults.ts
        │   ├── constants.ts
        │   ├── geometry.ts
        │   ├── swingTypeLabels.ts
        │   └── utils.ts
        ├── schemas/
        │   ├── canvas.ts
        │   ├── messages.ts
        │   └── parsers.ts
        └── types/
            ├── canvas.ts
            └── messages.ts
```

---

## Convenções adotadas

1. **Separação por responsabilidade**
   - `src/commands/*` contém um arquivo por comando do VS Code.
   - `src/generator/*` separa helpers, mapeamentos Swing e geração hierárquica.
   - `webview-app/src/components/*` contém apenas composição de UI.

2. **Entry point enxuto na extensão**
   - `src/extension.ts` registra comandos e evita lógica de negócio inline.

3. **Tipos compartilhados como fonte única**
   - `shared/types/canvas.ts` define `ComponentType`, `CanvasComponent` e `CanvasState`.
   - Extensão e webview importam esses tipos via alias `@shared/*`.

4. **Aliases de import padronizados**
   - Raiz: `@shared/*` → `shared/*`.
   - Webview: `@/*` → `webview-app/src/*` e `@shared/*` → `shared/*`.

5. **Webview modular por domínio**
   - Canvas e CanvasComponent têm submódulos específicos (`fixedZoneLayout`, `previewRenderers`, `resizeHandles`, etc.).
   - Hooks seguem padrão `use*` com responsabilidade única.

6. **Contratos validados**
   - Mensagens e estado da webview são validados com Zod em `webview-app/src/schemas/*` e parseados por `parsers.ts`.

7. **Type-only imports quando aplicável**
   - Uso de `import type` para evitar bindings de runtime desnecessários.

---

## Diagrama de arquitetura (ASCII)

```text
┌─────────────────────────────── VS Code Extension Host ───────────────────────────────┐
│                                                                                       │
│  src/extension.ts                                                                      │
│      │ registers                                                                       │
│      ▼                                                                                 │
│  src/commands/*Command.ts ───────► src/canvas/CanvasPanel.ts                          │
│      │                                   │                                             │
│      │ generate                           │ postMessage/loadState                      │
│      ▼                                   ▼                                             │
│  src/generator/*.ts                Webview (out/webview)                               │
│      │                                   ▲                                             │
│      └────────────── uses ───────────────┘                                             │
│                      shared/types/canvas.ts                                             │
└───────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────── React Webview App ──────────────────────────────────┐
│ webview-app/src/App.tsx                                                               │
│   ├─ components/* (Canvas, Palette, Hierarchy, PropertiesPanel, Toolbar)             │
│   ├─ hooks/* (estado, drag/drop, atalhos, bridge com extensão)                       │
│   ├─ schemas/* + parsers.ts (validação de mensagens/estado)                           │
│   └─ types/* + lib/* (tipos locais e utilitários de UI)                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

