# Official Scripts Contract

This document defines the repository's official command contract for local development and CI.

## Canonical commands

Use these commands as the only public interface:

- `pnpm run build`: build artifacts for the extension and dependent workspaces.
- `pnpm run verify`: run the verification gate required for change acceptance.

## Contract rules

1. Documentation and CI must reference `build` and `verify` as primary commands.
2. Internal script composition can evolve as long as these entry points remain stable.
3. Task-specific validators can be included inside `verify` when required by a remediation or release gate.

## Compatibility matrix (legacy command strategy)

| Legacy command | Compatibility role | Migration guidance |
| --- | --- | --- |
| `compile` | Temporary alias to `build` | Replace references with `build` |
| `check` | Temporary alias to `verify` (or nearest equivalent gate during migration) | Replace references with `verify` |

Deprecation window for legacy aliases: **90 days or two minor releases (whichever is longer)**, then aliases can be removed after CI/docs migration is complete.

## CI usage

- Required pipeline stages should invoke:
  - `pnpm run build`
  - `pnpm run verify`
- Test workflow coverage evidence is published as artifact `test-coverage-report` from:
  - `coverage/lcov-report/`
  - `coverage/coverage-summary.json`
- Pipelines still using `compile`/`check` should be considered transitional and scheduled for update.

## Architectural decision

The rationale and trade-offs for this contract are recorded in:

- `docs/adr/ADR-0001-build-verify-scripts-contract.md`

