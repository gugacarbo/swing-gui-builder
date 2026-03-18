# PRD: Review Findings Remediation

## 1. Introduction/Overview

This PRD defines the complete remediation of critical and high-priority findings (CF-01..CF-06) identified in the previous review. The focus is to restore consistency between requirements and implementation, strengthen automated validations to prevent compliance regressions, and ensure publication of coverage artifacts in CI with verifiable evidence.

The approved strategy is phased, with dependent story groups (A -> B -> C -> D -> E), and completion is conditioned on objective evidence for 100% of in-scope findings.

## 2. Goals

- Close 100% of findings CF-01..CF-06 with verifiable and traceable evidence.
- Eliminate contract divergences between documentation, schema, and implementation for points covered by R1..R6.
- Prevent approval of stories marked as `passes=true` without justification (`notes`) through automated validation.
- Publish coverage artifacts in CI in a consistent way that is reusable for technical audits.
- Formalize the scripts contract as `build/verify` and align references across the repository.

## 3. User Stories

### US-001: Define minimum evidence template
**Description:** As a maintainer, I want a standard evidence template so that every remediation item can be audited consistently.

**Group:** A

**Acceptance Criteria:**
- [ ] Create an evidence template containing at least: `files_changed`, `commands`, `command_output`, `links`.
- [ ] Save the template in a versioned path under the current task.
- [ ] Include one completed example for a finding.
- [ ] Repository lint/typecheck remain green after documentation is added.

### US-002: Formalize evidence examples in the requirement
**Description:** As a reviewer, I want concrete evidence examples in the requirement document so that acceptance is objective per finding.

**Group:** A

**Acceptance Criteria:**
- [ ] Update the task requirement document with an evidence examples section per finding.
- [ ] Each finding CF-01..CF-06 has a reference to expected evidence.
- [ ] Acceptance checklist per finding is explicitly verifiable.
- [ ] Lint/typecheck remain green.

### US-003: Block passes=true without notes
**Description:** As a quality gate owner, I want an automated validator for PRD result files so that invalid approvals are rejected early.

**Group:** A

**Acceptance Criteria:**
- [ ] Implement a validation script that fails when `passes=true` and `notes` is empty.
- [ ] Expose a verification command in the approved scripts contract (`verify:prd` or equivalent under `verify`).
- [ ] Create automated tests covering valid and invalid cases.
- [ ] Local pipeline runs the validator with non-zero exit code for invalid cases.
- [ ] Lint/typecheck/new tests pass.

### US-004: Audit schema vs ConfigReader
**Description:** As a developer, I want a documented schema-to-runtime audit so that contract mismatches are visible before code changes.

**Group:** B

**Acceptance Criteria:**
- [ ] Compare `schemas/swingbuilder.schema.json` with real consumption in config reader and templates.
- [ ] Record discrepancies with file evidence and expected behavior.
- [ ] Produce an audit document with an actionable list of adjustments.
- [ ] Lint/typecheck remain green.

### US-005: Fix hierarchy support in schema
**Description:** As a config author, I want hierarchical structures to be explicitly supported and tested so that complex configs remain valid.

**Group:** B

**Acceptance Criteria:**
- [ ] Update schema to represent hierarchies required by requirements.
- [ ] Add integration tests with valid and invalid hierarchical examples.
- [ ] Ensure compatibility with current runtime consumption or document controlled breaking change.
- [ ] Lint/typecheck/schema tests pass.

### US-006: Define official scripts contract
**Description:** As a contributor, I want one official script contract so that build and verification commands are consistent across docs and CI.

**Group:** C

**Acceptance Criteria:**
- [ ] Record an architectural decision standardizing the contract as `build/verify`.
- [ ] Document trade-offs and compatibility strategy for legacy commands.
- [ ] Publish the contract document under the project documentation folder.
- [ ] Lint/typecheck remain green.

### US-007: Apply scripts contract in repository
**Description:** As a maintainer, I want package scripts and docs aligned with the chosen contract so that local and CI workflows are predictable.

**Group:** C

**Acceptance Criteria:**
- [ ] Update root `package.json` with scripts aligned to the official contract.
- [ ] Adjust references in README and related task files.
- [ ] Ensure main build/verification commands execute without regression.
- [ ] Lint/typecheck pass after changes.

### US-008: Publish coverage artifacts in CI
**Description:** As a reviewer, I want coverage artifacts uploaded in CI so that quality evidence is available after every successful run.

**Group:** D

**Acceptance Criteria:**
- [ ] Update test workflow to upload `coverage/lcov-report` and `coverage/coverage-summary.json` on successful runs.
- [ ] Artifact name and location are standardized and documented.
- [ ] Local simulation/CI execution validates existence of expected artifacts.
- [ ] Remediation branch pipeline remains green.

### US-009: Mandatory backfill of historical notes
**Description:** As a quality auditor, I want historical pass entries without notes to be backfilled so that previous approvals become traceable.

**Group:** E

**Acceptance Criteria:**
- [ ] Identify historical entries with `passes=true` and missing/empty `notes`.
- [ ] Create backfill evidence in a dedicated task structure with before/after links.
- [ ] Associate owner and status for each backfill item.
- [ ] Automated validation passes after backfill.

### US-010: Reconcile PRD vs implementation
**Description:** As a tech lead, I want a reconciliation report so that every documented divergence has an owner and resolution path.

**Group:** E

**Acceptance Criteria:**
- [ ] Create `reconciliation.md` with divergences between PRD and implementation.
- [ ] For each divergence, record decision: fix code, fix docs, or accept justified exception.
- [ ] Define owner and deadline for each open item.
- [ ] No critical divergences remain without a resolution plan.

## 4. Functional Requirements

- FR-1: The system must provide a reusable standard minimum evidence template for remediations (R1).
- FR-2: The remediation requirements document must include verifiable evidence examples per finding (R1).
- FR-3: There must be automated validation that rejects entries with `passes=true` and empty `notes` (R3).
- FR-4: The project must provide automated tests for the `prd.json` validator with positive and negative scenarios (R3).
- FR-5: The main schema must explicitly reflect required hierarchies and their runtime consumption (R4).
- FR-6: There must be schema integration tests covering valid and invalid hierarchy cases (R4).
- FR-7: The repository official scripts contract must be standardized as `build/verify` and documented (R5).
- FR-8: Scripts and documentation must be aligned to the official contract without operational ambiguity (R5).
- FR-9: The CI workflow must publish coverage artifacts with standardized path and naming (R6).
- FR-10: The remediation must include mandatory historical backfill for traceability compliance (R2/R3).
- FR-11: There must be a PRD vs implementation reconciliation report with an owner per divergence (R2).
- FR-12: Feature completion requires verifiable evidence for 100% of CF-01..CF-06.

## 5. Non-Goals (Out of Scope)

- Remediate medium or low priority findings outside CF-01..CF-06.
- Introduce new product features beyond remediation of findings.
- Broad refactors not directly related to R1..R6.
- Change CI stack, test framework, or the project's base architecture.

## 6. Design Considerations

- Documentation artifacts should use a simple Markdown structure for human readability and fast auditing.
- Evidence should prioritize file links and reproducible command outputs.
- Remediation file naming should follow the current task pattern to simplify historical traceability.

## 7. Technical Considerations

- Validation script must run in local and CI environments without proprietary dependencies.
- Schema adjustments should preserve compatibility whenever possible; breaking changes require explicit documentation.
- The `build/verify` contract should consider temporary compatibility aliases when needed to avoid breaking existing workflows.
- Artifact upload in CI must respect provider-configured retention and size limits.

## 8. Success Metrics

- 100% of findings CF-01..CF-06 closed with verifiable and approved evidence.
- 0 occurrences of `passes=true` without `notes` after validator adoption.
- 100% of successful CI runs publish expected coverage artifacts.
- 100% of critical divergences mapped in reconciliation with owner and defined plan.
- Reduced technical audit time for the remediation task (internal baseline) due to stronger evidence standardization.

## 9. Open Questions

- What deprecation window will be adopted for legacy commands after standardization in `build/verify`?
- What final ownership format will be used in backfill (name only, or name + deadline + status)?
- Is there a formal retention policy for coverage artifacts that must be reflected in documentation?

## Clarifying Answers Used

- Main objective: deliver balanced and complete remediation for CF-01..CF-06.
- Scope: phased execution by dependent groups.
- Scripts contract: standardize as `build/verify`.
- Backfill/reconciliation: mandatory in the same cycle.
- Mandatory success criterion: 100% of in-scope findings with verifiable evidence.
