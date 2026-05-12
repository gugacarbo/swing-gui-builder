# Swing GUI Builder - AI Developer Conventions

## Architecture Overview
This is a VS Code extension built with TypeScript. It has two main parts:
1. **Extension Host (`src/`):** Node.js environment handling VS Code APIs, file generation (`src/generator/` — files like `JavaGenerator.ts`, `ComponentCodeGenerator.ts`), and configuration.
2. **Webview (`webview-app/`):** React + Vite application that runs the visual drag-and-drop editor.

## Communication
- The Extension and Webview communicate via message passing (`vscode.postMessage`).
- Shared types and interfaces MUST be placed in the `shared/` directory.

## Code Style
- We use `biome` for formatting and linting.
- Prefer explicit typing in TypeScript.
- Follow Conventional Commits for git messages.

## Testing
- Tests are written with `vitest`. From within `webview-app/` or `shared/`, run tests via `pnpm test`. For root-level extension tests, use `npx vitest run`.
- Extension tests live in `tests/`, Webview tests in `webview-app/tests/`.
