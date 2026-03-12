# Plan: Migrate Webview to Vite 7 + React + Tailwind CSS

Migrate the vanilla JS webview (`webview/`) to a modern **Vite 7 + React + TypeScript + Tailwind CSS** setup in `webview-app/`, maintaining all existing functionality (drag-drop, resize, zoom/pan, undo/redo, properties panel) while enabling hot reload during development and optimized builds for production.

## Steps

### Phase 1 - Bootstrap Vite + React + Tailwind
1. Initialize Vite 7 project in `webview-app/` with React + TypeScript template
2. Install and configure Tailwind CSS v4 with Vite plugin
3. Configure `vite.config.ts` for VS Code webview context:
   - Output to `out/webview/` (bundled with extension)
   - Inline assets for single-file webview compatibility
   - Base path handling with `webview.asWebviewUri()`
4. Map VS Code CSS variables to Tailwind theme tokens

### Phase 2 - React Components Architecture
5. Create component structure:
   - `components/App.tsx` - Main layout (3-panel)
   - `components/Palette.tsx` - Component palette (left panel)
   - `components/Canvas.tsx` - Drag/drop canvas (center)
   - `components/CanvasComponent.tsx` - Individual component renderer
   - `components/PropertiesPanel.tsx` - Properties editor (right panel)
   - `components/Toolbar.tsx` - Toolbar buttons
   - `hooks/useCanvasState.ts` - State management hook
   - `hooks/useUndoRedo.ts` - History management hook
   - `hooks/usePostMessage.ts` - Extension communication hook

### Phase 3 - Tailwind Styling
6. Convert `style.css` to Tailwind utility classes
7. Configure Tailwind to preserve VS Code CSS variables (`--vscode-*`)
8. Add custom utilities for component handles, selection states
9. Use Tailwind theme for VS Code colors mapping

### Phase 4 - Migrate Logic to React
10. Convert `main.js` event handlers to React patterns:
    - Use `useState`, `useEffect`, `useCallback` for component management
    - Implement drag-drop with React refs and event handlers
    - Convert resize handles to React-controlled elements
11. Implement React-based state management:
    - Central state in `App.tsx` or Context provider
    - Canvas components stored in React state array
    - Types defined in `types/canvas.ts`
12. Preserve all postMessage patterns:
    - `usePostMessage` hook for extension → webview
    - `useExtensionListener` hook for webview → extension
    - Same message types: `stateChanged`, `toolbarCommand`, `loadState`, `configDefaults`

### Phase 5 - Update Extension Integration
13. Modify `CanvasPanel.ts` to load Vite output:
    - Read bundled HTML from `out/webview/index.html`
    - Update `localResourceRoots` to include `out/webview/`
    - Inject nonce into bundled script tags
14. Update build scripts in `package.json`:
    - Add `build:webview` → `cd webview-app && pnpm build`
    - Update `vscode:prepublish` → include webview build
15. Test production build - React bundle loads, no external dependencies

### Phase 6 - Compatibility & Security
16. Configure Vite for nonce-compatible output:
    - Use `build.modulePreload: false` to simplify module loading
    - Inline styles or use nonce for style tags
17. Update CSP in `CanvasPanel.ts`:
    - Allow React bundle scripts with nonce
    - Handle Tailwind generated classes
18. Test dev mode (if HMR needed):
    - Vite dev server on localhost:5173
    - CSP relaxed for local development

### Phase 7 - Documentation & Cleanup
19. Update README with React + Vite development workflow
20. Remove old `webview/` folder after migration validated
21. Document component architecture in `webview-app/README.md`

## Relevant Files

**Current (to migrate from):**
- `webview/main.js` — Current vanilla JS (~900 lines) — migrate logic to React components
- `webview/style.css` — Current styles — convert to Tailwind utilities

**Target (to create):**
- `webview-app/src/main.tsx` — React entry point
- `webview-app/src/App.tsx` — Main 3-panel layout
- `webview-app/src/components/Palette.tsx` — Component palette (left)
- `webview-app/src/components/Canvas.tsx` — Drag/drop canvas (center)
- `webview-app/src/components/CanvasComponent.tsx` — Individual component
- `webview-app/src/components/PropertiesPanel.tsx` — Properties editor (right)
- `webview-app/src/components/Toolbar.tsx` — Toolbar buttons
- `webview-app/src/hooks/useCanvasState.ts` — State management
- `webview-app/src/hooks/useUndoRedo.ts` — Undo/redo history
- `webview-app/src/hooks/usePostMessage.ts` — Extension communication
- `webview-app/src/types/canvas.ts` — TypeScript interfaces
- `webview-app/vite.config.ts` — Vite configuration
- `webview-app/tailwind.config.ts` — Tailwind configuration

**Extension (to modify):**
- `src/canvas/CanvasPanel.ts` — Update to load Vite bundle
- `package.json` — Add `build:webview` script
- `tsconfig.json` — May need webview-app references

## Verification

1. **Functional Tests:**
   - Open a `.swing` file - webview loads correctly
   - Drag components from palette to canvas
   - Resize components with handles
   - Zoom (Ctrl+scroll) and pan (middle-click)
   - Undo/Redo (Ctrl+Z/Y)
   - Properties panel updates in real-time
   - Generate Java code still works

2. **Build Verification:**
   - Run `pnpm build:webview` - produces bundle
   - Run `pnpm compile` - extension compiles
   - Package extension (`vsce package`) - webview assets included
   - Install packaged extension - webview works

3. **Security Check:**
   - CSP enforced, no external resources loaded
   - Nonce or hash-based script allowlist works

## Decisions

- **Framework choice:** ✅ React + TypeScript chosen — better DX, component-based architecture, enables future extensibility
- **Dev server:** Start without HMR (simpler CSP), add later if needed
- **Output location:** `out/webview/` — consistent with current `out/` pattern
- **Tailwind approach:** Full utility migration with custom utilities for canvas-specific styles

## Further Considerations

1. ~~**React vs Vanilla JS?**~~ — ✅ React chosen by user
2. **State Management** — Use React Context + hooks (simple) or Zustand (if complexity grows)?
   - Context api
3. **Component Library** — Use headless UI library (Radix, Headless UI) for accessibility, or build fully custom?
 - Shadcn ui
