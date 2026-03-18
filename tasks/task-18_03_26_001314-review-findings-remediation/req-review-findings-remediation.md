# Review Findings Remediation

## Description

Fix critical and high-priority issues identified in `task/[DONE] task-17_03_26_231940-completed-tasks-review`, restoring traceability, contract consistency, and CI coverage artifacts.

## Context

This task addresses the mandatory findings from the consolidated review:

- `CF-01` (Critical): `[DONE]` tasks without minimum verifiable execution trail.
- `CF-02` (High): Functional divergence between initial PRD and current implementation.
- `CF-03` (High): `prd.json` with `passes=true` and empty `notes`.
- `CF-04` (High): Configuration schema mismatch with accepted hierarchical component types.
- `CF-05` (High): Missing root scripts contract (`build`/`verify`) versus documented expectations.
- `CF-06` (High): CI tests workflow does not publish coverage artifacts.

Primary evidence source:

- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-findings.md`

## Goal

Close all critical/high review findings with objective evidence, re-establishing delivery governance and consistency between documentation, contracts, and implementation.

## In Scope

- Remediation of findings `CF-01` to `CF-06`.
- Documentation and process updates required to make remediation auditable.
- CI workflow updates related to coverage artifact publication.

## Out of Scope

- Medium/low findings (`CF-07+`) that are not blockers for this remediation cycle.
- New feature development unrelated to review findings.
- Broad UI/UX refactors not required to satisfy `CF-01` to `CF-06`.

## Decided Requirements

### R1 - Task Traceability Governance (CF-01)

- [ ] Re-open `[DONE]` tasks flagged without verifiable evidence.
- [ ] Define and apply a minimum evidence template per story in `progress.txt` and `prd.json` notes.
- [ ] Require, for each completed story: changed files, commands executed, and command results.
- [ ] Only allow `[DONE]` status when the minimum evidence checklist is complete.

### R2 - Functional Reconciliation Against Initial PRD (CF-02)

- [ ] Compare implemented behavior against the initial PRD and list divergences explicitly.
- [ ] Resolve each divergence by either:
	- [ ] Implementing the missing behavior, or
	- [ ] Updating documentation with formal justification and approval.
- [ ] Ensure key examples from the finding are reconciled (e.g., password field support and other PRD-contract mismatches).

### R3 - Enforce Non-Empty Technical Notes in prd.json (CF-03)

- [ ] Define a validation rule that blocks `passes=true` when `notes` is empty.
- [ ] Backfill missing notes for stories marked as passed in impacted tasks.
- [ ] Standardize note format to include at least: file evidence, command evidence, result evidence.

### R4 - Schema Contract Alignment for Hierarchical Components (CF-04)

- [ ] Align `schemas/swingbuilder.schema.json` with accepted hierarchical types used by reader/template.
- [ ] Supported contract must be consistent across schema, config reader, and generation pipeline.
- [ ] Add/update validation tests proving schema acceptance for hierarchical component definitions.

### R5 - Root Scripts Contract Consistency (CF-05)

- [ ] Resolve mismatch between documented script contract and actual root scripts.
- [ ] Choose one consistent contract path:
	- [ ] Add `build` and `verify` scripts at root, or
	- [ ] Update PRD/progress/README to officially use `compile` and `check`.
- [ ] Ensure all references in task docs and repository docs reflect the same contract.

### R6 - CI Coverage Artifact Publication (CF-06)

- [ ] Update `.github/workflows/test.yml` to publish coverage artifacts.
- [ ] Artifact upload must run on successful test execution and be traceable in workflow logs.
- [ ] Document artifact naming/location conventions to support future audits.

## Acceptance Criteria

### AC-01 - Critical/High Closure

- [ ] `CF-01` to `CF-06` are marked as closed with evidence in task documentation and repository state.

### AC-02 - Reproducible Validation

- [ ] Root validation command(s) defined by the chosen contract execute successfully.
- [ ] CI test workflow completes and publishes coverage artifacts.

### AC-03 - Auditability

- [ ] Every remediated finding has explicit before/after evidence links in task documents.
- [ ] `progress.txt` and `prd.json` entries are consistent with final status.

### AC-04 - No Contract Drift

- [ ] Schema, reader, templates, scripts, and docs are mutually consistent after remediation.

## Deliverables

- [ ] Updated task evidence records (`progress.txt`, `prd.json`, and related review follow-up notes).
- [ ] Updated schema/tests for hierarchical components.
- [ ] Updated root scripts or docs to eliminate script-contract mismatch.
- [ ] Updated CI workflow publishing coverage artifacts.

## Notes

- This task is remediation-focused and should prioritize objective closure of review findings over feature expansion.
- Any decision to defer a finding must include explicit rationale, owner, and follow-up task reference.

