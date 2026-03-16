# PRD: Migrate Webview to Vite 7 + React + TypeScript + Tailwind CSS

## Introduction

Migrate the vanilla JS webview (`webview/`) to a modern **Vite 7 + React 19 + TypeScript + Tailwind CSS v4 + Shadcn UI** stack in `webview-app/`. This migration maintains 100% feature parity with existing functionality (drag-drop, resize, zoom/pan, undo/redo, properties panel) while delivering improved performance, maintainability, and developer experience.

Small, visible UI/UX improvements are permitted as long as they don't increase scope significantly.

## Goals

- Achieve complete feature parity with current webview
- Enable modern React component-based architecture for future extensibility
- Improve build performance with Vite's optimized bundling
- Establish design system with Shadcn UI + Tailwind CSS
- Simplify state management with React Context + hooks
- Complete migration before next release (no fallback to old webview)

## Non-Goals

- No new major features unrelated to migration
- No automated component tests in this phase
- No Zustand or external state management library
- No Zod schema for every possible edge case (only core canvas/message types)
- No shared types between extension and webview (types duplicated in Zod schemas)

## User Stories

### US-001: Bootstrap Vite 7 project with React + TypeScript
**Description:** As a developer, I need a properly configured Vite project so I can start building React components.

**Acceptance Criteria:**
- [ ] `webview-app/` directory created with Vite 7 + React 19 + TypeScript template
- [ ] `pnpm install` completes successfully in `webview-app/`
- [ ] `pnpm dev` starts Vite dev server without errors
- [ ] Typecheck passes (`tsc --noEmit`)

---

### US-002: Configure Tailwind CSS v4 with Vite
**Description:** As a developer, I need Tailwind CSS configured so I can use utility-first styling.

**Acceptance Criteria:**
- [ ] Tailwind CSS v4 installed with Vite plugin
- [ ] `tailwind.config.ts` configured with content paths for `src/**/*.{ts,tsx}`
- [ ] `@import "tailwindcss"` works in main CSS file
- [ ] Test class (e.g., `text-red-500`) renders correctly in browser
- [ ] Typecheck passes

---

### US-003: Configure Vite for VS Code webview context
**Description:** As a developer, I need Vite output compatible with VS Code webview restrictions (CSP, nonce, inline assets).

**Acceptance Criteria:**
- [ ] Output directory configured as `out/webview/`
- [ ] `build.modulePreload: false` set to simplify loading
- [ ] Assets inlined or properly hashed for single-file compatibility
- [ ] Base path configured for `webview.asWebviewUri()` handling
- [ ] Build produces valid HTML + JS bundle in `out/webview/`

---

### US-003.5: Configure Vite dev server with HMR for development
**Description:** As a developer, I need HMR (Hot Module Replacement) during development to speed up iteration without full reloads.

**Acceptance Criteria:**
- [ ] Vite dev server configured with HMR enabled
- [ ] Dev server accessible from VS Code webview context
- [ ] CSS changes reflect immediately without page reload
- [ ] React component changes hot-reload preserving state
- [ ] Dev/production mode switching works correctly
- [ ] Typecheck passes

---

### US-004: Install and configure Shadcn UI
**Description:** As a developer, I need Shadcn UI configured so I can use accessible, pre-built components.

**Acceptance Criteria:**
- [ ] Shadcn UI installed and initialized with `components.json`
- [ ] Button component scaffolded successfully
- [ ] Default theme configured to match VS Code CSS variables
- [ ] Typecheck passes

---

### US-005: Map VS Code CSS variables to Tailwind theme
**Description:** As a developer, I need VS Code colors available in Tailwind so the webview matches editor theming.

**Acceptance Criteria:**
- [ ] `--vscode-*` CSS variables preserved in Tailwind config
- [ ] Custom colors defined: `vscode-foreground`, `vscode-background`, `vscode-panel-background`, etc.
- [ ] Theme tokens usable as `bg-vscode-background`, `text-vscode-foreground`
- [ ] Typecheck passes

---

### US-006: Create App.tsx main layout component
**Description:** As a developer, I need the main 3-panel layout as a React component.

**Acceptance Criteria:**
- [ ] `App.tsx` renders 3-panel layout: left (palette), center (canvas), right (properties)
- [ ] Panels resize correctly with window
- [ ] Uses Tailwind flex/grid layout
- [ ] Typecheck passes

---

### US-007: Create Palette.tsx component
**Description:** As a developer, I need a React component for the component palette (left panel).

**Acceptance Criteria:**
- [ ] `Palette.tsx` renders list of draggable components (JPanel, JButton, JLabel, JTextField, etc.)
- [ ] Each component item shows icon and name
- [ ] Drag initiation works (drag data set correctly)
- [ ] Styling matches VS Code panel aesthetic
- [ ] Typecheck passes

---

### US-008: Create Canvas.tsx component with drag-drop
**Description:** As a developer, I need a React canvas component that accepts dropped components.

**Acceptance Criteria:**
- [ ] `Canvas.tsx` renders main canvas area
- [ ] Drop zone highlights when dragging over
- [ ] Dropped components appear at drop coordinates
- [ ] Canvas handles zoom and pan state
- [ ] Typecheck passes

---

### US-009: Create CanvasComponent.tsx with resize handles
**Description:** As a developer, I need individual canvas components with resize functionality.

**Acceptance Criteria:**
- [ ] `CanvasComponent.tsx` renders component with position and dimensions
- [ ] Selection state shows resize handles on all corners/edges
- [ ] Drag to reposition works
- [ ] Drag resize handles updates component dimensions
- [ ] Typecheck passes

---

### US-010: Create PropertiesPanel.tsx component
**Description:** As a developer, I need a properties editor panel as a React component.

**Acceptance Criteria:**
- [ ] `PropertiesPanel.tsx` displays selected component properties
- [ ] Text inputs update properties (text, font, bounds)
- [ ] Color inputs for background/foreground
- [ ] Changes reflect immediately in canvas
- [ ] Typecheck passes

---

### US-011: Create Toolbar.tsx component
**Description:** As a developer, I need a toolbar with action buttons as a React component.

**Acceptance Criteria:**
- [ ] `Toolbar.tsx` renders action buttons (undo, redo, delete, generate)
- [ ] Buttons disabled when action unavailable
- [ ] Click handlers invoke correct actions
- [ ] Uses Shadcn Button component
- [ ] Typecheck passes

---

### US-012: Create useCanvasState hook
**Description:** As a developer, I need a React hook for managing canvas component state.

**Acceptance Criteria:**
- [ ] `useCanvasState.ts` provides components array state
- [ ] Exposes: `addComponent`, `updateComponent`, `removeComponent`, `selectComponent`
- [ ] State updates trigger re-renders correctly
- [ ] Typecheck passes

---

### US-013: Create useUndoRedo hook
**Description:** As a developer, I need undo/redo functionality as a React hook.

**Acceptance Criteria:**
- [ ] `useUndoRedo.ts` maintains history stack
- [ ] `undo()` reverts to previous state
- [ ] `redo()` restores next state
- [ ] `canUndo` and `canRedo` boolean flags exposed
- [ ] Typecheck passes

---

### US-014: Create usePostMessage hook for extension communication
**Description:** As a developer, I need a hook to communicate with the VS Code extension.

**Acceptance Criteria:**
- [ ] `usePostMessage.ts` sends messages to extension
- [ ] Message types preserved: `stateChanged`, `toolbarCommand`
- [ ] `postMessage()` function typed with message interface
- [ ] Typecheck passes

---

### US-015: Create useExtensionListener hook
**Description:** As a developer, I need a hook to receive messages from the extension.

**Acceptance Criteria:**
- [ ] `useExtensionListener.ts` registers `message` event listener
- [ ] Handles `loadState`, `configDefaults` message types
- [ ] Cleanup on unmount
- [ ] Typecheck passes

---

### US-016: Install Zod for runtime validation
**Description:** As a developer, I need Zod installed so I can define schemas for runtime type validation.

**Acceptance Criteria:**
- [ ] `zod` package installed in `webview-app/`
- [ ] Import `z` from `zod` works without errors
- [ ] Typecheck passes

---

### US-017: Define Zod schemas for canvas components
**Description:** As a developer, I need Zod schemas to validate canvas state at runtime and prevent invalid data.

**Acceptance Criteria:**
- [ ] `schemas/canvas.ts` created with Zod schemas
- [ ] `BoundsSchema`: x, y, width, height (all numbers, min constraints)
- [ ] `ComponentPropertiesSchema`: text, font, background, foreground (optional strings)
- [ ] `CanvasComponentSchema`: id (uuid), type (enum), bounds, properties
- [ ] `CanvasStateSchema`: components array, selectedId (nullable), zoom, pan
- [ ] Export inferred types: `type CanvasComponent = z.infer<typeof CanvasComponentSchema>`
- [ ] Typecheck passes

---

### US-018: Define Zod schemas for extension messages
**Description:** As a developer, I need schemas for all postMessage communication to ensure type safety.

**Acceptance Criteria:**
- [ ] `MessageSchema` created as discriminated union by `type` field
- [ ] `StateChangeMessage`: type='stateChanged', state (CanvasStateSchema)
- [ ] `ToolbarCommandMessage`: type='toolbarCommand', command (enum: undo/redo/delete/generate)
- [ ] `LoadStateMessage`: type='loadState', state (CanvasStateSchema)
- [ ] `ConfigDefaultsMessage`: type='configDefaults', defaults (object schema)
- [ ] Typecheck passes

---

### US-019: Parse all extension messages with Zod
**Description:** As a developer, I need all incoming messages validated before use to prevent runtime errors.

**Acceptance Criteria:**
- [ ] `useExtensionListener` parses messages with `MessageSchema.safeParse()`
- [ ] Invalid messages logged with error details, not crashing app
- [ ] Valid messages typed correctly via schema inference
- [ ] Unknown message types handled gracefully (ignored with warning)
- [ ] Typecheck passes

---

### US-020: Parse all user inputs in properties panel
**Description:** As a developer, I need all property inputs validated to prevent invalid state updates.

**Acceptance Criteria:**
- [ ] Numeric inputs (x, y, width, height) parsed and clamped to valid ranges
- [ ] Color inputs validated as hex format (`#RRGGBB` or `#RGB`)
- [ ] Empty/invalid inputs show visual feedback but don't crash
- [ ] `safeParse()` used to handle validation errors gracefully
- [ ] Typecheck passes

---

### US-021: Create type guards and parsing utilities
**Description:** As a developer, I need utility functions for common parsing operations.

**Acceptance Criteria:**
- [ ] `parseCanvasComponent(data: unknown): CanvasComponent | null` created
- [ ] `parseCanvasState(data: unknown): CanvasState | null` created
- [ ] `parseMessage(data: unknown): Message | null` created
- [ ] All utilities use Zod safeParse and log errors on failure
- [ ] Typecheck passes

---

### US-022: Migrate all event handlers to React patterns
**Description:** As a developer, I need all `main.js` event handlers converted to React.

**Acceptance Criteria:**
- [ ] No direct DOM event listeners (use React `onEvent` props)
- [ ] useEffect used for lifecycle and cleanup
- [ ] useCallback for memoized handlers where needed
- [ ] No memory leaks on component unmount
- [ ] Typecheck passes

---

### US-023: Convert style.css to Tailwind utilities
**Description:** As a developer, I need all custom CSS converted to Tailwind classes.

**Acceptance Criteria:**
- [ ] `style.css` converted to Tailwind utilities in components
- [ ] Custom utilities added for canvas-specific styles (handles, selection)
- [ ] No inline styles (use Tailwind classes or CSS variables)
- [ ] Original `style.css` can be removed
- [ ] Typecheck passes

---

### US-024: Update CanvasPanel.ts to load Vite bundle
**Description:** As a developer, I need the extension to load the new React bundle.

**Acceptance Criteria:**
- [ ] `CanvasPanel.ts` reads HTML from `out/webview/index.html`
- [ ] `localResourceRoots` includes `out/webview/`
- [ ] Nonce injected into bundled script tags
- [ ] CSP updated to allow React bundle scripts
- [ ] Typecheck passes

---

### US-025: Update package.json build scripts
**Description:** As a developer, I need build scripts updated to include webview build.

**Acceptance Criteria:**
- [ ] `build:webview` script added: `cd webview-app && pnpm build`
- [ ] `vscode:prepublish` includes webview build step
- [ ] `compile` script remains functional
- [ ] Build order correct (webview first, then extension)

---

### US-026: Update CSP for nonce-compatible output
**Description:** As a developer, I need Content Security Policy updated for React bundle.

**Acceptance Criteria:**
- [ ] CSP allows scripts with nonce
- [ ] Inline styles handled (nonce or Tailwind approach)
- [ ] No external resources loaded
- [ ] No CSP violations in console

---

### US-027: Verify production build and packaging
**Description:** As a developer, I need the extension to package correctly with webview assets.

**Acceptance Criteria:**
- [ ] `pnpm build:webview` produces valid bundle
- [ ] `pnpm compile` succeeds
- [ ] `vsce package` includes `out/webview/` assets
- [ ] Installed extension loads webview correctly

---

### US-028: Functional verification - drag and drop
**Description:** As a user, I want to drag components from palette to canvas so I can build my UI.

**Acceptance Criteria:**
- [ ] Components appear in palette panel
- [ ] Drag from palette initiates correctly
- [ ] Drop on canvas adds component at cursor position
- [ ] Component renders with default size
- [ ] Typecheck passes

---

### US-029: Functional verification - resize components
**Description:** As a user, I want to resize components on canvas so I can adjust their dimensions.

**Acceptance Criteria:**
- [ ] Click component shows selection handles
- [ ] Drag corner handles resizes both width/height
- [ ] Drag edge handles resizes one dimension
- [ ] Minimum size enforced (prevents too-small components)
- [ ] Typecheck passes

---

### US-030: Functional verification - zoom and pan
**Description:** As a user, I want to zoom (Ctrl+scroll) and pan (middle-click drag) the canvas.

**Acceptance Criteria:**
- [ ] Ctrl+scroll zooms canvas in/out
- [ ] Zoom level clamped (min/max limits)
- [ ] Middle-click drag pans canvas
- [ ] Zoom/pan state persists during session
- [ ] Typecheck passes

---

### US-031: Functional verification - undo/redo
**Description:** As a user, I want to undo (Ctrl+Z) and redo (Ctrl+Y) my actions.

**Acceptance Criteria:**
- [ ] Ctrl+Z reverts last action
- [ ] Ctrl+Y restores undone action
- [ ] Toolbar buttons reflect canUndo/canRedo state
- [ ] History depth reasonable (limit prevents memory issues)
- [ ] Typecheck passes

---

### US-032: Functional verification - properties panel
**Description:** As a user, I want to edit component properties and see changes immediately.

**Acceptance Criteria:**
- [ ] Selecting component shows its properties
- [ ] Editing text updates canvas in real-time
- [ ] Changing color updates component background/foreground
- [ ] Bounds inputs reflect and update position/size
- [ ] Typecheck passes

---

### US-033: Functional verification - Java generation
**Description:** As a user, I want to generate Java code from my canvas design.

**Acceptance Criteria:**
- [ ] "Generate" button triggers code generation
- [ ] Generated Java code matches canvas state
- [ ] No errors during generation
- [ ] Output file created/updated correctly
- [ ] Typecheck passes

---

### US-034: Remove old webview/ folder
**Description:** As a developer, I need the old webview removed to complete migration.

**Acceptance Criteria:**
- [ ] `webview/main.js` deleted
- [ ] `webview/style.css` deleted
- [ ] `webview/` folder removed
- [ ] No references to old webview in codebase
- [ ] Typecheck passes

---

### US-035: Update documentation
**Description:** As a developer, I need updated docs for React + Vite development workflow.

**Acceptance Criteria:**
- [ ] README updated with webview development instructions
- [ ] `webview-app/README.md` documents component architecture
- [ ] Build commands documented
- [ ] Dev workflow (if applicable) explained

---

## Functional Requirements

- **FR-1:** Webview must load React bundle from `out/webview/index.html`
- **FR-2:** All message types preserved: `stateChanged`, `toolbarCommand`, `loadState`, `configDefaults`
- **FR-3:** Canvas supports component types: JPanel, JButton, JLabel, JTextField, JTextArea, JComboBox, JCheckBox, JRadioButton, JList, JTable, JProgressBar, JSlider, JSpinner
- **FR-4:** Zoom range: 25% to 400% with Ctrl+scroll and Ctrl+ (+/-) shortcuts
- **FR-5:** Undo/redo history depth: 50 states maximum
- **FR-6:** Component minimum size: 20x20 pixels
- **FR-7:** CSP must not allow external resources

## Technical Considerations

### Architecture
```
webview-app/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Main layout (3-panel)
│   ├── components/
│   │   ├── Palette.tsx
│   │   ├── Canvas.tsx
│   │   ├── CanvasComponent.tsx
│   │   ├── PropertiesPanel.tsx
│   │   └── Toolbar.tsx
│   ├── hooks/
│   │   ├── useCanvasState.ts
│   │   ├── useUndoRedo.ts
│   │   ├── usePostMessage.ts
│   │   └── useExtensionListener.ts
│   ├── schemas/
│   │   ├── canvas.ts         # Zod schemas for canvas state
│   │   └── message.ts        # Zod schemas for extension messages
│   ├── lib/
│   │   ├── utils.ts          # Shadcn utils
│   │   └── parsing.ts        # Type guards & Zod parsers
│   └── types/
│       └── canvas.ts         # Inferred types from Zod schemas
├── vite.config.ts
├── tailwind.config.ts
├── components.json           # Shadcn config
└── package.json
```

### State Management Strategy
- React Context for global canvas state
- `useCanvasState` hook provides state + actions
- `useUndoRedo` wraps state changes with history
- No external state library (Zustand, Redux, etc.)

### Data Validation Strategy (Zod)
- All types derived from Zod schemas:
  ```typescript
  // schemas/canvas.ts
  export const CanvasComponentSchema = z.object({ ... });
  export type CanvasComponent = z.infer<typeof CanvasComponentSchema>;
  ```
- `safeParse()` for all external data (extension messages, user inputs)
- Invalid data logged with details, never crashes app
- Type guards wrap Zod parsers for ergonomic use:
  ```typescript
  const component = parseCanvasComponent(unknownData);
  if (component) { /* type-safe access */ }
  ```

### Build Integration
```json
{
  "scripts": {
    "build:webview": "cd webview-app && pnpm build",
    "compile": "tsc -p ./",
    "vscode:prepublish": "pnpm build:webview && pnpm compile"
  }
}
```

### Security
- Nonce-based script allowlist in CSP
- No external CDN resources
- All assets bundled inline or with hashes

## Design Considerations

### UI/UX Improvements (Permitted)
- Consistent focus states for accessibility
- Smooth selection transitions
- Better visual feedback on drag operations
- Improved toolbar button states

### Shadcn UI Components
- `Button` for toolbar actions
- `Input` for properties panel text fields
- `Slider` for numeric properties (if applicable)
- `Tooltip` for component palette items

### VS Code Theming Integration
- All colors derive from `--vscode-*` CSS variables
- Dark/light theme support automatic
- No hardcoded colors
- The canvas background must match the configured background color

## Success Metrics

- [ ] Feature parity: 100% of current functionality works
- [ ] Build time: Webview build completes in < 10 seconds
- [ ] Bundle size: Total webview assets < 500KB
- [ ] Memory: No memory leaks during canvas operations
- [ ] Code quality: TypeScript strict mode, no `any` types
- [ ] Developer experience: Clear component structure, easy to extend

---

## Checklist

- [x] Asked clarifying questions with lettered options
- [x] Incorporated user's answers (1A=HMR now, 2A=Manual testing, 3B=No shared types, 4B+C=To be clarified, 5A=Applied)
- [x] User stories are small and specific
- [x] Functional requirements are numbered and unambiguous
- [x] Non-goals section defines clear boundaries
- [x] Saved to `tasks/webview-with-react-vite/prd-migrate-webview-react-vite.md`
