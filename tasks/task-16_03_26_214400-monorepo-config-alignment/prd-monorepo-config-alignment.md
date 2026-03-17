# PRD: Monorepo Config Alignment

## 1. Overview

This document defines the requirements for aligning the monorepo configuration across the swing-gui-builder project. The goal is to ensure consistent and predictable execution of build, lint, typecheck, and verification commands across all packages in the pnpm workspace.

**Problem:** The monorepo has misaligned configuration where:
- Root scripts don't match documented commands
- Workspace globs include non-package paths
- Dependencies are inconsistent across packages
- No unified verification checklist exists

---

## 2. Goals

- Root package.json scripts orchestrate all relevant workspace packages predictably
- Documentation commands match actual available scripts
- Clear workspace policy: only real packages in `pnpm-workspace.yaml`
- Unified verification: install → lint → typecheck → build succeeds from root
- Aligned dependency versions across all packages

---

## 3. User Stories

### US-001: Standardize Root Scripts
**Description:** As a developer, I want consistent root scripts (lint, lint:fix, typecheck, build, verify) so that I can run predictable validation commands from the repository root.

**Acceptance Criteria:**
- [ ] `pnpm run lint` executes lint across all workspace packages
- [ ] `pnpm run lint:fix` executes lint with fix across all workspace packages
- [ ] `pnpm run typecheck` executes type checking across all packages
- [ ] `pnpm run build` builds all packages in correct order
- [ ] `pnpm run verify` (or `check`) runs: install precheck, lint, typecheck, build in sequence

---

### US-002: Fix Workspace Configuration
**Description:** As a developer, I want `pnpm-workspace.yaml` to only include real packages so that workspace operations are predictable and fast.

**Acceptance Criteria:**
- [ ] `pnpm-workspace.yaml` contains only packages with `package.json`
- [ ] `webview-app` remains as a workspace package
- [ ] `shared` is formalized as a proper workspace package
- [ ] Non-package paths (`src`) are removed from workspace config

---

### US-003: Formalize Shared Package
**Description:** As a developer, I want `shared/` to be a proper workspace package with its own build configuration so it can be properly shared and versioned.

**Acceptance Criteria:**
- [ ] `shared/package.json` exists with proper manifest (name, version, scripts)
- [ ] `shared/tsconfig.json` configured to compile TypeScript sources
- [ ] `shared/types/*.ts` compile to appropriate output (dist/ or cleaned)
- [ ] Build artifacts don't pollute source with .js files

---

### US-004: Align Documentation with Scripts
**Description:** As a developer, I want README.md to list only valid commands so that documentation is trustworthy.

**Acceptance Criteria:**
- [ ] All commands listed in README validation section exist in root package.json
- [ ] No broken references like `pnpm run lint` that don't exist
- [ ] Commands execute successfully when run

---

### US-005: Update and Align Dependencies
**Description:** As a developer, I want consistent dependency versions across packages so that there are no version conflicts.

**Acceptance Criteria:**
- [ ] Root dependencies updated to latest compatible versions
- [ ] webview-app dependencies updated to latest stable versions
- [ ] Shared dependency versions aligned (TypeScript, Biome, types)
- [ ] No duplicate Biome packages (@biomejs/biome vs biome)

---

## 4. Technical Notes

### Current State (Baseline)

| Layer            | Status       | Notes                                         |
| ---------------- | ------------ | --------------------------------------------- |
| Root scripts     | Partial      | `lint-all` exists; `lint` missing             |
| Workspace config | Inconsistent | Includes `src`, `shared` without package.json |
| webview-app      | Good         | Has lint, lint:fix, typecheck, build          |
| shared/types     | Partial      | TS + JS artifacts without own package         |
| README           | Misaligned   | Lists `pnpm run lint` which doesn't exist     |

### Workspace Structure Target

```
swing-gui-builder/
├── package.json           # Root with orchestration scripts
├── pnpm-workspace.yaml    # Only: webview-app, shared
├── webview-app/           # React frontend package
│   └── package.json
└── shared/               # Shared types package
    ├── package.json
    └── tsconfig.json
```

---

## 5. Out of Scope

- Functional refactoring of extension/webview features
- Migrating build tools (e.g., to Turbo/Nx)
- Publishing packages to npm

---

## 6. Dependencies

- Step 1.1 → Step 1.2 → Step 1.3 → Step 1.4
- Step 1.4 → Step 2.1 → Step 2.2 → Step 2.3
- Step 2.3 → Step 3.1 → Step 3.2 → Step 3.3
