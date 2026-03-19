# Review Findings Non-Critical Remediation

## Description

Address medium and low-priority issues identified in the completed review task, improving documentation consistency, traceability quality, and non-blocking UX/process refinements.

## Context

This task is intentionally split from the critical/high remediation cycle and targets only non-critical findings from:

- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-findings.md`
- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`

Target findings:

- `CF-07` Contradiction in migration progress status (webview + vite)
- `CF-08` Simplification goals not reflected in current webview refactor state
- `CF-09` Internal inconsistency in structural refactor completion status
- `CF-10` E2E scope misalignment between requirements and delivered/tested scope
- `CF-11` Weak story-level traceability in components-preview task
- `CF-12` Ambiguous documentary trail in fixes-and-improvements task
- `CF-13` Non-goal divergence in webview refactor
- `CF-14` Non-critical Swing UX/documentation adjustments

## Goal

Close medium/low findings with objective documentation and scoped technical follow-ups, without introducing scope drift into the critical remediation stream.

## In Scope

- Remediation of findings `CF-07` to `CF-14`.
- Status and documentation consistency updates in affected task artifacts.
- Definition of clear decisions for deferred or optional improvements.
- Lightweight technical refinements where required to validate documented decisions.

## Out of Scope

- Any critical/high finding (`CF-01` to `CF-06`).
- New feature development unrelated to review findings.
- Broad architectural rewrites not required to close `CF-07` to `CF-14`.

## Decided Requirements

### R1 - Resolve Medium Documentary Contradictions (`CF-07`, `CF-09`, `CF-12`)

- [ ] Fix contradictory status entries in affected `progress.txt` and associated task docs.
- [ ] Ensure each affected task has one final, coherent completion narrative.
- [ ] Add explicit reconciliation notes where temporary blockers existed.

### R2 - Align Scope Decisions for Webview/Test Work (`CF-08`, `CF-10`, `CF-13`)

- [ ] Document final decision for simplification goals that remained partially unmet.
- [ ] Harmonize E2E scope statements across `req`, `prd`, and progress artifacts.
- [ ] Reconcile non-goal statements with actual delivered changes.
- [ ] If any item remains deferred, register owner, rationale, and next-step backlog reference.

#### Official Webview Simplification + Non-Goal Decisions (US-004 / `CF-08`, `CF-13`)

- `CF-08` decision type: **docs fix** (current-state alignment) + **Split to Follow-up**.
  - Owner: Frontend/Webview Maintainer.
  - Technical rationale: the refactor delivered architectural extraction (hooks/libs/components), but current file sizes remain above original reduction targets due subsequent feature growth (`Canvas.tsx=370`, `PropertiesPanel/index.tsx=218`, `App.tsx=355`).
  - Final destination: `Split to Follow-up` with continuity in `FUP-08` (`tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`) for additional reduction work.
- `CF-13` decision type: **justified exception** + **docs fix**.
  - Owner: Frontend/Webview Maintainer.
  - Technical rationale: the former non-goal "do not extract ResizeHandles" diverged from delivered architecture (`webview-app/src/components/CanvasComponent/resizeHandles.tsx` extracted and reused in `componentView.tsx`), and this extraction is now accepted as a stable modularization outcome.
  - Final destination: `Resolved` in this cycle (no rollback/implementation revert required).

#### Official E2E Scope Decision (US-005 / `CF-10`)

- Current cycle decision: this non-critical remediation cycle closes only documentary harmonization for E2E scope statements (`req`/`prd`/`progress`), with no net-new E2E implementation expansion in this task.
- Deferred residual scope: define and approve broader E2E inclusion/exclusion execution for automated-tests artifacts in `FUP-10` (`tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`).
- Owner for deferred scope: QA Lead + Product Owner.
- Acceptance target for deferred scope: `task-17_03_26_140000-automated-tests` scope documents (`req`, `prd`, acceptance criteria) must state one explicit E2E inclusion/exclusion decision with no ambiguity.

#### Deferred/Split Continuity Register (US-007)

| Finding | Final Status | FUP Reference | Owner | Rationale | Next Actionable Step |
| --- | --- | --- | --- | --- | --- |
| `CF-07` | Split to Follow-up | `FUP-07` (`tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`) | Owner da task `webview-with-react-vite` | Documentary contradiction requires sustained single-status governance in migration records. | Revalidate migration status narrative against delivered evidence and preserve one final progress state snapshot. |
| `CF-08` | Split to Follow-up | `FUP-08` (`tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`) | Frontend/Webview Maintainer | Simplification alignment is documented, but additional reduction remains as residual scope. | Define measurable reduction targets for `Canvas.tsx`, `PropertiesPanel/index.tsx`, and `App.tsx`, then execute or formally adjust targets. |
| `CF-09` | Split to Follow-up | `FUP-09` (`tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`) | Tech Lead da refatoracao estrutural | Structural-refactor closure had contradictory blocked/completed narrative history. | Audit closure records and publish one official final decision in both `progress` and `prd` artifacts. |
| `CF-10` | Split to Follow-up | `FUP-10` (`tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`) | QA Lead + Product Owner | Broader E2E execution decision is intentionally deferred from this cycle. | Approve one explicit E2E inclusion/exclusion decision in automated-tests scope documents (`req`/`prd`/acceptance criteria). |
| `CF-11` | Split to Follow-up | `FUP-11` (`tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`) | PMO/Process Owner + task owners | Weak story-level traceability spans multiple tasks and needs standardized enforcement. | Initial rollout completed in US-006 (components-preview evidence backfill); enforce template for future `passes: true` stories. |
| `CF-12` | Split to Follow-up | `FUP-11` (`tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`) | PMO/Process Owner + task owners | Ambiguous documentary trail shares the same root cause as CF-11. | Applied in US-006 for fixes-and-improvements US-002/US-003; keep using template to reconcile temporary blockers with final outcomes. |

- Coverage check: all open in-scope findings (`CF-07`, `CF-08`, `CF-09`, `CF-10`, `CF-11`, `CF-12`) have explicit continuity references with owner/rationale/next step.
- FUP coverage check: associated continuity items are fully represented (`FUP-07`, `FUP-08`, `FUP-09`, `FUP-10`, `FUP-11`).

### R3 - Improve Story-Level Traceability Pattern (`CF-11`, `CF-12`)

- [x] Standardize evidence granularity for impacted tasks (file, command, result).
- [x] Apply the pattern to at least the tasks flagged with weak/ambiguous traceability.
- [x] Ensure updated records are auditable without external assumptions.

### R4 - Execute Non-Blocking Swing UX/Docs Refinements (`CF-14`)

- [x] Address pending low-risk UX/documentation refinements for Swing component preview where feasible.
- [x] Record residual items explicitly as backlog if not completed in this cycle (no residual remained after US-008 execution).

#### CF-14 execution evidence (US-008)

- `webview-app/src/components/Sidebar.tsx`: sidebar order aligned to requirement (`Palette` above `Hierarchy`, with hierarchy panel rendered below component menu).
- `webview-app/src/components/CanvasComponent/previewRenderers.tsx`: added dedicated `PasswordField` preview renderer (masked visual treatment) to avoid generic fallback for this pending type.
- Browser verification (dev-browser skill): screenshot evidence captured at `temp/dev-browser/us008-ux-verification.png`.
- Final status for `CF-14`: `Resolved` in this cycle (no new `Split to Follow-up` item required).

## Acceptance Criteria

### AC-01 - Non-Critical Findings Closure

- [ ] Findings `CF-07` to `CF-14` are each marked as resolved, deferred with rationale, or split into follow-up references.

### AC-02 - Documentary Consistency

- [ ] No internal contradictions remain in status summaries for impacted tasks.
- [ ] Scope decisions (including E2E and non-goals) are consistent across related artifacts.

### AC-03 - Traceability Quality

- [x] Updated stories include minimum evidence entries: changed files, commands run, and outcomes.

### AC-04 - Controlled Scope

- [ ] No change in this task introduces unresolved dependency on critical/high findings.

## Findings

- The repository already has a dedicated critical/high remediation task:
  - `tasks/task-18_03_26_001314-review-findings-remediation/req-review-findings-remediation.md`
- Consolidated follow-up mapping is available and already separates priorities (`P2` and `P3` for non-critical):
  - `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`
- Evidence and severity are explicitly listed in:
  - `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-findings.md`

## Gaps & Risks

- Ownership for each non-critical follow-up is suggested but not yet formally assigned.
- The closure model for medium findings can become inconsistent if defer/close criteria are not standardized.
- Non-goal and E2E scope statements may drift again without a single source-of-truth artifact.

## Suggestions

1. Define one closure vocabulary for non-critical findings: `Resolved`, `Deferred`, `Split to Follow-up`.
2. Assign a single owner per finding group before implementation starts.
3. Require cross-document sync checks before setting task status to completed.
4. If low-priority UX changes are deferred, create explicit backlog items with references.

## Closure Governance Baseline (US-001)

### Official Closure Vocabulary for Findings

| Status | Objective usage rule | Concrete example |
| --- | --- | --- |
| `Resolved` | Use only when the finding scope is fully remediated in the current cycle, with objective evidence (`file changed`, `command run`, `observable result`) and no residual action pending in backlog. | `CF-07` is `Resolved` only after all contradictory status statements are removed from impacted artifacts and the final narrative is coherent in task records. |
| `Deferred` | Use only when remediation is intentionally postponed to a future cycle. Must include `FUP-xx`, owner, rationale, and next action/acceptance target. | `CF-14` is `Deferred` when a low-priority UX polish is intentionally postponed and linked to `FUP-03` with owner and acceptance target. |
| `Split to Follow-up` | Use only when part of the finding is completed now and a clearly delimited residual scope is moved to follow-up. Must explicitly separate what is closed now vs what moved to `FUP-xx`. | `CF-10` is `Split to Follow-up` when scope statement harmonization is done now, while any additional E2E expansion decision is moved to `FUP-10` (owner: QA Lead + Product Owner; acceptance target: automated-tests scope documents become unambiguous about E2E inclusion/exclusion). |

### Cross-Sync Checklist Before Marking Done (req/prd/progress)

- [ ] `req`: final finding statuses use only `Resolved`, `Deferred`, or `Split to Follow-up` with matching rules.
- [ ] `prd` (`prd-review...md` and `prd.json` notes/matrix): each finding status and rationale matches `req`.
- [ ] `progress.txt`: closure narrative and evidence (`files`, `commands`, `results`) match `req` + `prd`.
- [ ] Every `Deferred`/`Split` item includes `FUP-xx`, owner, rationale, and next actionable step.
- [ ] Repository gates executed before closure: `pnpm run lint` and `pnpm run typecheck`.

## Open Questions

- Who is the approval owner for documentary closure in this non-critical cycle?
- Should low-priority UX refinements (`CF-14`) be mandatory for closure or optional backlog?
- Is there a hard deadline for `P2` findings from the previous review prioritization?
