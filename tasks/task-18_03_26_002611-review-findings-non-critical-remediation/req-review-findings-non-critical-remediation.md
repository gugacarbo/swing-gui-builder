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

### R3 - Improve Story-Level Traceability Pattern (`CF-11`, `CF-12`)

- [ ] Standardize evidence granularity for impacted tasks (file, command, result).
- [ ] Apply the pattern to at least the tasks flagged with weak/ambiguous traceability.
- [ ] Ensure updated records are auditable without external assumptions.

### R4 - Execute Non-Blocking Swing UX/Docs Refinements (`CF-14`)

- [ ] Address pending low-risk UX/documentation refinements for Swing component preview where feasible.
- [ ] Record residual items explicitly as backlog if not completed in this cycle.

## Acceptance Criteria

### AC-01 - Non-Critical Findings Closure

- [ ] Findings `CF-07` to `CF-14` are each marked as resolved, deferred with rationale, or split into follow-up references.

### AC-02 - Documentary Consistency

- [ ] No internal contradictions remain in status summaries for impacted tasks.
- [ ] Scope decisions (including E2E and non-goals) are consistent across related artifacts.

### AC-03 - Traceability Quality

- [ ] Updated stories include minimum evidence entries: changed files, commands run, and outcomes.

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

## Open Questions

- Who is the approval owner for documentary closure in this non-critical cycle?
- Should low-priority UX refinements (`CF-14`) be mandatory for closure or optional backlog?
- Is there a hard deadline for `P2` findings from the previous review prioritization?
