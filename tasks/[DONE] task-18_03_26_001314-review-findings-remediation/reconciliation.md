# Reconciliation — PRD vs Implementation (US-010)

## Scope and sources

This report reconciles functional divergences from the initial PRD baseline and the current repository implementation, focusing on CF-02 follow-up items.

Primary sources:

- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-us-004-prd-inicial.md`
- `tasks/[DONE] task-12_03_26_201338-review-swing-gui-builder/prd-swing-gui-builder-v0.0.2.md`
- `webview-app/src/components/Palette.tsx`
- `webview-app/src/components/PropertiesPanel/index.tsx`
- `webview-app/src/components/Toolbar.tsx`
- `webview-app/src/App.tsx`
- `webview-app/src/hooks/useCanvasDragDrop.ts`

## Divergence matrix

| ID | Divergence | Evidence (expected vs actual) | Severity | Decision | Status | Owner | Deadline |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D-01 | `PasswordField` expected in palette but not exposed in UI palette list | Expected in prior review baseline (`review-us-004-prd-inicial.md:32-34`). Actual: palette list does not include `JPasswordField` (`webview-app/src/components/Palette.tsx:38-52`), while drag/drop mapping supports it (`webview-app/src/hooks/useCanvasDragDrop.ts:12-31`). | High | **Fix code** | Open | Webview maintainer | 2026-03-25 |
| D-02 | Frame width/height should be editable from builder UI but are only internal state/load values | Expected in prior review baseline (`review-us-004-prd-inicial.md:33`). Actual: frame dimensions are stored and propagated (`webview-app/src/App.tsx:120-123`, `:327-333`) and rendered (`webview-app/src/components/Canvas.tsx:101-103`), but there is no input control in toolbar/properties (`webview-app/src/components/Toolbar.tsx:4-90`, `webview-app/src/components/PropertiesPanel/index.tsx:94-241`). | High | **Fix code** | Open | Webview maintainer | 2026-03-27 |
| D-03 | Event method name is part of model/schema but not editable in properties UI | Expected in prior review baseline (`review-us-004-prd-inicial.md:34`). Actual: model/schema define `eventMethodName` (`webview-app/src/types/canvas.ts:15`, `webview-app/src/schemas/canvas.ts:66`) and defaults include it (`webview-app/src/lib/componentDefaults.ts:14`), but no corresponding field exists in properties editor (`webview-app/src/components/PropertiesPanel/index.tsx:23-237`). | High | **Fix code** | Open | Webview + generator maintainer | 2026-03-28 |
| D-04 | Builder toolbar command set diverges from initial PRD toolbar contract | Initial PRD v0.0.2 requests toolbar access for New/Open/Save/Generate/Init Config (`tasks/[DONE] task-12_03_26_201338-review-swing-gui-builder/prd-swing-gui-builder-v0.0.2.md:182-190`). Actual toolbar currently focuses on editing actions (Undo/Redo/Delete/Preview/Generate) (`webview-app/src/components/Toolbar.tsx:30-89`) and posts only `generate` to extension command channel (`webview-app/src/App.tsx:291-293`). | Medium | **Accepted exception** | Closed | Tech lead (task-18) | N/A |

## Resolution plans for open items

### D-01 plan (High)
1. Add `JPasswordField` entry to `COMPONENT_ITEMS` in `Palette.tsx`.
2. Add/update webview test coverage validating palette rendering includes password field.
3. Validate with `pnpm run typecheck` and webview test suite.

### D-02 plan (High)
1. Add dedicated frame dimension controls (width/height) in builder UI.
2. Wire controls to `setFrameDimensions` with numeric validation/clamping.
3. Validate persisted load/save roundtrip and run `pnpm run typecheck`.

### D-03 plan (High)
1. Add `eventMethodName` input to properties panel for supported interactive components.
2. Ensure serialization and Java generation flow consume the field consistently.
3. Add/adjust tests and run `pnpm run typecheck`.

## Accepted exception rationale

### D-04 rationale
The current toolbar evolved toward in-canvas editing operations, while extension-level commands remain available through existing VS Code command wiring (`package.json` contributes + extension handlers). This is accepted as a documented UX evolution for v0.0.3 and does not block remediation findings CF-01..CF-06.

## Critical divergence check

No **critical** PRD-vs-implementation divergences were identified in this reconciliation scope.  
All **high** divergences (D-01, D-02, D-03) include explicit owner, deadline, and action plan.
