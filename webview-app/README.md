# webview-app

React + Vite frontend used by the VS Code webview panel.

## Architecture

- `src/App.tsx` composes the UI shell (`Toolbar`, `Palette`, `Canvas`, `PropertiesPanel`) and wires state/actions.
- `src/components/` contains presentational and interaction components for canvas editing.
- `src/hooks/` contains state and integration hooks (`useCanvasState`, `useUndoRedo`, `usePostMessage`, `useExtensionListener`).
- `src/schemas/` and `src/types/` define and validate message/state contracts exchanged with the extension host.
- `vite.config.ts` outputs bundled assets to `../out/webview`, which is loaded by `src/canvas/CanvasPanel.ts` in the extension.

## Commands

Run from repository root:

```bash
pnpm --dir webview-app dev
pnpm --dir webview-app typecheck
pnpm --dir webview-app build
pnpm --dir webview-app preview
```

## Extension integration workflow

1. Develop UI locally with `pnpm --dir webview-app dev`.
2. Build webview bundle with `pnpm --dir webview-app build`.
3. Compile extension host code with `pnpm run compile`.
4. Package/test extension from root (for example `pnpm run package`).
