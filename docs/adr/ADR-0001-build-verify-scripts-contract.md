# ADR-0001: Official scripts contract is `build/verify`

- Status: Accepted
- Date: 2026-03-18
- Decision owners: Maintainers of `swing-gui-builder-vscode`
- Related story: `US-006` (task-18_03_26_001314-review-findings-remediation)

## Context

The repository currently exposes multiple script entry points (`compile`, `check`, and task-specific commands). This made it harder to keep local workflows, CI pipelines, and documentation aligned, because different contributors referenced different script combinations.

For remediation and future maintenance, we need one explicit contract that is simple to communicate and stable over time.

## Decision

The official automation contract is standardized to exactly two top-level entry points:

1. `pnpm run build`
   - Purpose: produce project artifacts across required workspaces.
   - Contract: deterministic build output, fail fast on compilation/build errors.

2. `pnpm run verify`
   - Purpose: execute the quality gate required to accept changes.
   - Contract: runs mandatory validations (at minimum lint/typecheck/tests and task-specific verifiers when applicable).

All documentation and CI references must treat `build` and `verify` as the canonical interface.

## Trade-offs

### Benefits

- Reduces ambiguity in contributor onboarding and CI setup.
- Makes scripts usage easier to audit and enforce.
- Keeps room for internal refactors without changing the public contract.

### Costs / Risks

- Requires migration of existing docs and workflows that still use legacy names.
- During migration, duplicated aliases may temporarily increase script maintenance overhead.

## Compatibility strategy for legacy commands

To avoid disruptive changes, legacy command names remain as compatibility aliases during a transition window.

- `compile` is treated as a legacy alias for `build`.
- `check` is treated as a legacy alias for `verify` (or the closest equivalent gate while migration is in progress).
- Legacy aliases stay operational for a temporary deprecation window of **90 days or two minor releases (whichever is longer)**.
- New or updated documentation must use only `build`/`verify` during the window.
- CI must migrate to `build`/`verify` first; alias removal happens only after CI and docs are fully migrated.

## Consequences

- Future script changes should happen behind the `build`/`verify` façade.
- Additions of new top-level contract commands require a new ADR.
- Repository validation stories should test `build` and `verify` as the source of truth.

