# Monorepo Config Alignment

## Description

Monorepo orchestration appears misaligned: root scripts and workspace configuration do not fully match how packages are organized and how commands are documented/expected to run.

Observed signals:
- `pnpm run lint` fails at repository root (`ERR_PNPM_NO_SCRIPT`).
- README lists `pnpm run lint` as a validation command.
- Root `lint-all` script currently runs `pnpm --if-present lint`, which does not explicitly recurse through workspace packages.
- `pnpm-workspace.yaml` includes paths (`src`, `shared`) that are not workspace packages (no `package.json`).
- .js files on shared/types after build;

## Decided Requirements

- [ ] Normalize monorepo scripts so root commands orchestrate all relevant packages predictably.
- [ ] Ensure README commands are valid and consistent with actual scripts.
- [ ] Decide and apply a clear policy for `pnpm-workspace.yaml` package globs (only real packages vs future-intent paths).
- [ ] Add a minimal verification checklist (install, lint, build, typecheck) that succeeds from root.
- [ ] Update Packages to last version of dependencies, and ensure all packages have consistent versions of shared dependencies (e.g. typescript, eslint).
