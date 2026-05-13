# Aider Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the Aider AI pair programmer to work seamlessly with the swing-gui-builder repository out of the box, establishing architectural context and automated build/test commands.

**Architecture:** We will create configuration files `.aider.conf.yml` and `.aider.model.settings.yml` to define the default model and behavior. We will also create a `.aider.chat.history.md` ignore rule and a `CONVENTIONS.md` file so Aider understands the VS Code extension + React Webview architecture before making changes.

**Tech Stack:** Aider, YAML, Markdown, Git.

---

### Task 1: Add Aider to .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Modify `.gitignore`**

Append Aider's temporary and history files to the `.gitignore` to prevent committing chat logs.

```bash
echo "" >> .gitignore
echo "# Aider" >> .gitignore
echo ".aider*" >> .gitignore
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore aider history and config files"
```

### Task 2: Create Aider Configuration

**Files:**
- Create: `.aider.conf.yml`

- [ ] **Step 1: Create `.aider.conf.yml`**

This file sets up Aider's default behavior for this project, including auto-linting and test commands.

```yaml
# .aider.conf.yml
# Aider configuration for swing-gui-builder

# Run typecheck and tests before committing
test-cmd: "pnpm run typecheck && pnpm test"

# Lint after editing
lint-cmd: "pnpm exec biome check --apply ."

# Auto commit when tests pass
auto-commits: true

# Keep a clean git history
commit-prompt: "Write a concise conventional commit message for these changes."

# Use conventions file for context
message: "Always follow the architecture described in CONVENTIONS.md."
```

- [ ] **Step 2: Create the file**

```bash
cat << 'EOF' > .aider.conf.yml
# .aider.conf.yml
# Aider configuration for swing-gui-builder

# Run typecheck and tests before committing
test-cmd: "pnpm run typecheck && pnpm test"

# Lint after editing
lint-cmd: "pnpm exec biome check --apply ."

# Auto commit when tests pass
auto-commits: true

# Keep a clean git history
commit-prompt: "Write a concise conventional commit message for these changes."

# Use conventions file for context
message: "Always follow the architecture described in CONVENTIONS.md."
EOF
```

- [ ] **Step 3: Commit**

```bash
git add .aider.conf.yml
git commit -m "chore: configure aider defaults and test commands"
```

### Task 3: Create AI Conventions Document

**Files:**
- Create: `CONVENTIONS.md`

- [ ] **Step 1: Create `CONVENTIONS.md`**

This file gives Aider (and any other AI agent) the architectural context of the project so it doesn't break the communication between the Extension and the Webview.

```markdown
# Swing GUI Builder - AI Developer Conventions

## Architecture Overview
This is a VS Code extension built with TypeScript. It has two main parts:
1. **Extension Host (`src/`):** Node.js environment handling VS Code APIs, file generation (`generator.ts`), and configuration.
2. **Webview (`webview-app/`):** React + Vite application that runs the visual drag-and-drop editor.

## Communication
- The Extension and Webview communicate via message passing (`vscode.postMessage`).
- Shared types and interfaces MUST be placed in the `shared/` directory.

## Code Style
- We use `biome` for formatting and linting.
- Prefer explicit typing in TypeScript.
- Follow Conventional Commits for git messages.

## Testing
- Tests are written with `vitest`.
- Run tests via `pnpm test`.
- Extension tests live in `tests/`, Webview tests in `webview-app/src/`.
```

- [ ] **Step 2: Create the file**

```bash
cat << 'EOF' > CONVENTIONS.md
# Swing GUI Builder - AI Developer Conventions

## Architecture Overview
This is a VS Code extension built with TypeScript. It has two main parts:
1. **Extension Host (`src/`):** Node.js environment handling VS Code APIs, file generation (`generator.ts`), and configuration.
2. **Webview (`webview-app/`):** React + Vite application that runs the visual drag-and-drop editor.

## Communication
- The Extension and Webview communicate via message passing (`vscode.postMessage`).
- Shared types and interfaces MUST be placed in the `shared/` directory.

## Code Style
- We use `biome` for formatting and linting.
- Prefer explicit typing in TypeScript.
- Follow Conventional Commits for git messages.

## Testing
- Tests are written with `vitest`.
- Run tests via `pnpm test`.
- Extension tests live in `tests/`, Webview tests in `webview-app/src/`.
EOF
```

- [ ] **Step 3: Commit**

```bash
git add CONVENTIONS.md
git commit -m "docs: add CONVENTIONS.md for ai agents context"
```
