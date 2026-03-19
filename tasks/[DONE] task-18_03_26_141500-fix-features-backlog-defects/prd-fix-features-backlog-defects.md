# PRD: Fix Features Backlog Defects

## 1. Introduction / Overview

This PRD defines the work needed to close the backlog defects and TODO items documented in `docs/FEATURES.md` and summarized in `req-fix-features-backlog-defects.md`.

The scope is intentionally limited: fix the broken or incomplete user flows, keep the current canvas and generator architecture intact, and avoid expanding into unrelated product work. The goal is to make the editor reliable for daily use, especially in undo/redo, hierarchy editing, open/save flows, and Java generation.

The requirements are split into 11 implementation stories because one backlog item was separated into two user-facing outcomes: recovery guidance when the layout file is missing and automatic creation of a new empty layout.

## 2. Baseline / Current State

The codebase already has the foundation for these flows, but several behaviors are incomplete or too narrow:

| Area                      | Current State                                                                                                                   | Relevant Files                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Undo / redo history       | History is still recorded during continuous drag and resize updates                                                             | `webview-app/src/hooks/useUndoRedo.ts`, `webview-app/src/hooks/useDragInteraction.ts`, `webview-app/src/App.tsx` |
| Keyboard shortcuts        | Undo, redo, and delete are handled, but save is not mapped                                                                      | `webview-app/src/hooks/useKeyboardShortcuts.ts`                                                                  |
| Missing layout open flow  | `openCommand` currently shows a generic error when `.swingbuilder-layout.json` cannot be read                                   | `src/commands/openCommand.ts`                                                                                    |
| Package inference         | The generate command already computes `javaPackage`, but the backlog item requires verifying the end-to-end flow and edge cases | `src/commands/generateCommand.ts`, `src/utils/JavaPackageInference.ts`, `src/generator/JavaGenerator.ts`         |
| Properties panel          | The component model already contains `eventMethodName`, but the UI does not render it                                           | `webview-app/src/types/canvas.ts`, `webview-app/src/components/PropertiesPanel/index.tsx`                        |
| Hierarchy drag and drop   | The current logic is still limited to menu-related component types                                                              | `webview-app/src/hooks/useHierarchyDragDrop.ts`                                                                  |
| JFrame preview background | The preview path must be validated against the current component-state rendering path, not just the theme defaults              | `webview-app/src/components/CanvasComponent/previewRenderers.tsx`                                                |
| Hierarchical code output  | The generator already supports `subfolder` for custom components, but it does not yet mirror the full component tree            | `src/generator/JavaGenerator.ts`                                                                                 |
| JFrame configuration      | There is no dedicated frame-configuration action yet                                                                            | `webview-app/src/components/Toolbar.tsx`, `webview-app/src/App.tsx`                                              |

## 3. Goals

- Close the backlog items captured in `req-fix-features-backlog-defects.md`.
- Reduce undo/redo noise created by drag and resize interactions.
- Make save and open flows more forgiving and actionable.
- Expose event method editing in the properties UI.
- Ensure generated Java files receive the correct package and folder structure.
- Expand hierarchy drag-and-drop so supported components can be reorganized consistently.
- Add a dedicated JFrame configuration entry point for size, colors, and title.
- Keep the changes compatible with the current canvas state model and existing generated projects.

## 4. Scope

### In Scope

- Undo/redo history batching for drag and resize updates.
- Ctrl+S / Cmd+S save shortcut in the webview.
- Helpful missing-file recovery when opening the layout file.
- Automatic empty layout creation when the file is missing.
- Package propagation from generate command to Java output.
- `eventMethodName` editing in the properties panel.
- JFrame preview background behavior.
- Broader hierarchy drag-and-drop support, including valid root moves and cycle prevention.
- Hierarchical folder generation for Java output.
- Dedicated JFrame configuration action.

### Out of Scope

- New Swing component families beyond the current backlog.
- Rewriting the canvas architecture or replacing the current state model.
- New file formats for layout persistence.
- A broader webview redesign.
- Introducing a new E2E framework.
- Fixes unrelated to the backlog items in `FEATURES.md`.

## 5. User Stories

### US-001: Batch undo history for drag and resize
**Description:** As a user, I want a completed drag or resize to create a single undo step so history stays usable.

**Group:** A

**Target Files:** `webview-app/src/hooks/useUndoRedo.ts`, `webview-app/src/hooks/useDragInteraction.ts`, `webview-app/src/App.tsx`

**Acceptance Criteria:**
- [ ] A drag or resize action adds one final history entry when the interaction ends.
- [ ] Pointer-move updates do not flood the undo stack.
- [ ] Existing undo and redo behavior still works for non-drag state changes.
- [ ] Resize interactions preserve the final component geometry.
- [ ] Targeted tests cover drag and resize history behavior.
- [ ] Typecheck and lint pass for the affected package.
- [ ] Verify in browser using dev-browser skill.

### US-002: Add Ctrl+S save shortcut
**Description:** As a user, I want Ctrl+S or Cmd+S to save the layout so I can persist changes without using the toolbar.

**Group:** A

**Target Files:** `webview-app/src/hooks/useKeyboardShortcuts.ts`, optionally `webview-app/src/App.tsx`

**Acceptance Criteria:**
- [ ] Ctrl+S and Cmd+S trigger the existing save layout command from the webview.
- [ ] The shortcut does not fire while the user is typing in an input, textarea, or contenteditable field.
- [ ] Undo, redo, and delete shortcuts continue to work as they do today.
- [ ] Shortcut handling is covered by tests.
- [ ] Typecheck and lint pass for the affected package.
- [ ] Verify in browser using dev-browser skill.

### US-003: Show guided recovery when the layout file is missing
**Description:** As a user, I want a clear recovery message when the layout file is missing so I know what to do next.

**Group:** A

**Target Files:** `src/commands/openCommand.ts`

**Acceptance Criteria:**
- [ ] The open command handles the missing-file case as a guided, non-fatal path.
- [ ] The user sees an actionable message that points to creating a new layout or initializing a project.
- [ ] The extension logs a clear recovery message instead of a generic error stack trace.
- [ ] Tests cover the missing-file branch.
- [ ] Typecheck and lint pass for the affected package.

### US-004: Create an empty layout when the file is missing
**Description:** As a user, I want the app to create an empty layout when the file is missing so I can start immediately.

**Group:** A

**Target Files:** `src/commands/openCommand.ts`

**Acceptance Criteria:**
- [ ] The open command can initialize an empty `CanvasState` with `MainWindow` defaults when the file is missing.
- [ ] The new layout opens with default dimensions and zero components.
- [ ] The created layout can be saved immediately without additional setup.
- [ ] Tests cover default state creation and loading.
- [ ] Typecheck and lint pass for the affected package.

### US-005: Propagate inferred package to generated Java files
**Description:** As a developer, I want the inferred Java package to reach the generator so generated files compile correctly in structured and simple projects.

**Group:** B

**Target Files:** `src/commands/generateCommand.ts`, `src/generator/JavaGenerator.ts`, `src/utils/JavaPackageInference.ts`

**Acceptance Criteria:**
- [ ] The generate command passes the inferred `packageName` to `generateJavaFiles()`.
- [ ] Generated Java files include a `package` declaration when the project structure supports it.
- [ ] Maven/Gradle and simple-project inference cases are covered by tests.
- [ ] Missing or incomplete project metadata is handled without breaking generation.
- [ ] Typecheck and tests pass for the generator path.

### US-006: Expose event method name in the properties panel
**Description:** As a user, I want to edit the event method name from the properties panel so I can control the generated stub names.

**Group:** B

**Target Files:** `webview-app/src/components/PropertiesPanel/index.tsx`, `webview-app/src/types/canvas.ts`

**Acceptance Criteria:**
- [ ] The properties panel renders an `eventMethodName` field for supported component types.
- [ ] The field validates Java method naming rules and rejects invalid input.
- [ ] Changes persist to canvas state and are reflected in generated method stubs.
- [ ] Duplicate names are handled consistently with the existing generator behavior.
- [ ] Tests cover rendering, validation, and state update behavior.
- [ ] Typecheck and lint pass for the affected package.
- [ ] Verify in browser using dev-browser skill.

### US-007: Respect JFrame background color in preview
**Description:** As a user, I want the JFrame preview to use the configured background color so the preview matches the component state.

**Group:** B

**Target Files:** `webview-app/src/components/CanvasComponent/previewRenderers.tsx`, `webview-app/src/App.tsx`

**Acceptance Criteria:**
- [ ] The preview rendering uses the JFrame `backgroundColor` from component state.
- [ ] Changing the background color updates the preview immediately.
- [ ] The default behavior remains stable when no explicit background color is set.
- [ ] Tests cover the preview color path for the JFrame.
- [ ] Typecheck and lint pass for the affected package.
- [ ] Verify in browser using dev-browser skill.

### US-008: Generalize hierarchy drag-and-drop rules
**Description:** As a user, I want hierarchy drag-and-drop to support the full component set so I can reorganize the canvas consistently.

**Group:** C

**Target Files:** `webview-app/src/hooks/useHierarchyDragDrop.ts`, `webview-app/src/components/HierarchyPanel.tsx`

**Acceptance Criteria:**
- [ ] `resolveDropInstruction()` handles supported component families beyond menu-only cases.
- [ ] The hierarchy view shows clear drop target indicators for valid positions.
- [ ] Valid reparenting works for supported component types without breaking existing menu behavior.
- [ ] Invalid parent-child combinations are rejected.
- [ ] Tests cover representative component families and target positions.
- [ ] Typecheck and lint pass for the affected package.
- [ ] Verify in browser using dev-browser skill.

### US-009: Allow unparenting to root and block invalid cycles
**Description:** As a user, I want to move components back to the root level and avoid invalid hierarchy cycles so the canvas state stays valid.

**Group:** C

**Target Files:** `webview-app/src/hooks/useHierarchyDragDrop.ts`

**Acceptance Criteria:**
- [ ] A supported component can be moved back to the root when the move is valid.
- [ ] Moving a component into one of its descendants or any equivalent cycle is blocked.
- [ ] The hierarchy tree and canvas state remain consistent after reparenting.
- [ ] Tests cover unparenting and cycle prevention.
- [ ] Typecheck and lint pass for the affected package.
- [ ] Verify in browser using dev-browser skill.

### US-010: Generate hierarchical folder structure for code output
**Description:** As a developer, I want generated Java files to mirror the component hierarchy in folders so the output is easier to navigate and maintain.

**Group:** D

**Target Files:** `src/generator/JavaGenerator.ts`, `src/commands/generateCommand.ts`

**Acceptance Criteria:**
- [ ] Output folders mirror the component hierarchy derived from the canvas tree.
- [ ] Parent components own a folder that contains their descendant classes.
- [ ] File naming remains deterministic and does not break existing output conventions.
- [ ] Flat layouts continue to generate valid output without special-case handling.
- [ ] Tests cover nested tree generation and the flat-layout fallback.
- [ ] Typecheck and tests pass for the generator path.

### US-011: Add a dedicated JFrame configuration action
**Description:** As a user, I want a dedicated JFrame configuration action so I can edit size, colors, and title in one place.

**Group:** E

**Target Files:** `webview-app/src/components/Toolbar.tsx`, `webview-app/src/App.tsx`, new dialog or panel component if needed

**Acceptance Criteria:**
- [ ] The toolbar or equivalent primary action surface exposes a dedicated JFrame configuration action.
- [ ] The configuration UI allows editing width, height, background color, and title.
- [ ] Changes update the canvas state and are reflected in generated code.
- [ ] Validation prevents invalid size or color values from being applied.
- [ ] Tests cover the state update and validation behavior.
- [ ] Typecheck and lint pass for the affected package.
- [ ] Verify in browser using dev-browser skill.

## 6. Functional Requirements

- FR-1: The system must save only one undo history entry per completed drag or resize interaction.
- FR-2: The system must trigger the save layout command when the user presses Ctrl+S or Cmd+S, except inside editable fields.
- FR-3: When the layout file is missing, the system must show a guided recovery message instead of a generic error.
- FR-4: When the layout file is missing, the system must be able to initialize a new empty layout with `MainWindow` defaults.
- FR-5: The system must pass inferred package metadata from the generate command into Java generation.
- FR-6: The system must expose `eventMethodName` editing in the properties panel for supported components.
- FR-7: The system must render the JFrame preview using the configured `backgroundColor`.
- FR-8: The system must support hierarchy drag-and-drop for supported component families, including reparenting and valid root moves.
- FR-9: The system must block invalid hierarchy cycles and preserve tree consistency after reparenting.
- FR-10: The system must generate Java files into folders that mirror the component hierarchy.
- FR-11: The system must provide a dedicated JFrame configuration action for size, colors, and title.

## 7. Technical Considerations

- `CanvasState` and `ComponentModel` remain the source of truth for canvas updates.
- Package inference should stay centralized through the generate command so the generator does not guess context.
- The hierarchy implementation must validate ancestor and descendant relationships before applying moves.
- Hierarchical folder generation must continue to work with both structured and flat output roots.
- The missing-file open flow should not require a migration; a default in-memory state is sufficient for the new-layout path.
- Preview rendering should read directly from component state so background changes are reflected immediately.
- Use targeted tests around `useUndoRedo`, `useKeyboardShortcuts`, `openCommand`, `JavaGenerator`, hierarchy drag/drop, and the properties panel.

## 8. Design Considerations

- Reuse the existing toolbar, properties panel, preview rendering, and generator pipeline instead of introducing parallel systems.
- Keep save/open recovery flows explicit and low-friction so users can continue working immediately.
- Keep hierarchy drag-and-drop feedback visible but restrained so the tree remains readable.
- Preserve menu-specific hierarchy behavior while extending the same interaction model to other supported component types.
- Prefer a focused configuration surface for JFrame settings rather than spreading frame options across unrelated panels.
- Keep generated Java file names deterministic so existing projects remain predictable after regeneration.

## 9. Risks and Mitigations

| Risk                                                                                  | Mitigation                                                            |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Broader hierarchy rules can break the current menu-specific flow                      | Add representative tests and keep the existing menu path covered      |
| Hierarchical folder generation can change output structure for existing projects      | Preserve deterministic naming and keep the flat-layout fallback valid |
| Ctrl+S may conflict with the editor environment                                       | Ignore editable targets and keep behavior inside the webview only     |
| The missing-layout flow can become ambiguous if both recovery paths are shown at once | Make one path primary and keep the secondary action explicit          |
| A dedicated JFrame config UI can add visual clutter                                   | Keep it small and scoped to frame-level settings only                 |

## 10. Success Metrics

- All backlog items in `FEATURES.md` can be exercised without known defects.
- Drag and resize interactions produce one undo step per completed action.
- Ctrl+S saves the current layout without conflicting with text entry.
- Missing layout files no longer create a dead-end error flow.
- Generated Java files include the correct package and hierarchical structure where applicable.
- Hierarchy changes work beyond menu-only interactions.
- JFrame configuration and background preview changes are visible immediately in the webview.
- Affected tests and type checks pass consistently in local development.

## 11. Open Questions

No open questions remain for the PRD scope. The requirements already resolved the main decisions:

- Hierarchy drag-and-drop should be implemented fully, not as a menu-only MVP.
- Projects without Maven/Gradle structure should infer package from the output path when possible.
- Ctrl+S should be handled in the webview hook.

## 12. Notes

- Source requirements: `req-fix-features-backlog-defects.md`
- Context source: `docs/FEATURES.md`
- This PRD intentionally stays within the backlog defect scope and avoids expanding into unrelated product work.
