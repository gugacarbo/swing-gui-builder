# PRD: Test Coverage Improvement — 95% to 100%

## Introduction

Increase test coverage from 95% to 100% for both the VS Code extension (`src/`) and webview app (`webview-app/src/`). This is a quality-standard initiative aimed at achieving full coverage to minimize regressions, improve maintainability, and ensure all edge cases and error paths are properly tested.

The goal is **100% coverage on all measurable metrics** with no exclusions.

---

## Goals

- Reach 100% line, branch, and function coverage for `src/` and `webview-app/src/`
- Cover all edge cases, error paths, and uncaught exceptions
- Add tests for untested modules: `canvas/CanvasPanel.ts` and `extension.ts` (activate/deactivate)
- Maintain all 36+ existing passing tests without regression
- Generate and publish coverage badges/report at 100%

---

## User Stories

### US-001: Baseline coverage measurement
**Description:** As a developer, I need to measure the current detailed coverage baseline so I know exactly which lines and branches are uncovered.

**Acceptance Criteria:**
- [ ] Run `pnpm run test:coverage` and capture output
- [ ] Identify all uncovered files, lines, and branches
- [ ] Document gaps in a coverage report (e.g., `coverage-gaps.md`)
- [ ] Baseline report shows current percentage per module

---

### US-002: CanvasPanel coverage
**Description:** As a developer, I need tests for `CanvasPanel.ts` so that the largest untested module is fully covered.

**Acceptance Criteria:**
- [ ] Create `tests/canvas/CanvasPanel.test.ts`
- [ ] Test all public methods: `render()`, `updateCanvas()`, `handleMessage()`, `dispose()`
- [ ] Cover normal execution paths
- [ ] Cover error/exception paths
- [ ] Mock VS Code webview API dependencies
- [ ] All new tests pass (`npm run test`)
- [ ] `CanvasPanel.ts` reaches 100% coverage

---

### US-003: Extension activate/deactivate coverage
**Description:** As a developer, I need tests for `extension.ts` activate and deactivate so VS Code lifecycle events are covered.

**Acceptance Criteria:**
- [ ] Create `tests/extension.test.ts`
- [ ] Test `activate()` — success path (registers commands, initializes state)
- [ ] Test `activate()` — error path (e.g., config read failure)
- [ ] Test `deactivate()` — cleanup path
- [ ] Mock `vscode` module appropriately
- [ ] All new tests pass (`npm run test`)
- [ ] `extension.ts` reaches 100% coverage

---

### US-004: Command handler edge cases
**Description:** As a developer, I need edge-case tests for command handlers so error branches and boundary conditions are covered.

**Acceptance Criteria:**
- [ ] Review existing command tests in `tests/commands/`
- [ ] Add tests for error paths (file not found, invalid input, permission errors)
- [ ] Add tests for null/undefined edge cases
- [ ] Add tests for concurrent execution scenarios
- [ ] All new tests pass (`npm run test`)

---

### US-005: Generator module branch coverage
**Description:** As a developer, I need full branch coverage in `src/generator/` so no code path is left untested.

**Acceptance Criteria:**
- [ ] Run coverage report and identify uncovered branches in generator files
- [ ] Add branch-coverage tests for all `if/else`, `switch`, `try/catch` paths
- [ ] All new tests pass (`npm run test`)
- [ ] `src/generator/` reaches 100% branch coverage

---

### US-006: Webview app 100% coverage
**Description:** As a developer, I need the webview app to also reach 100% coverage so the entire codebase is fully tested.

**Acceptance Criteria:**
- [ ] Run `pnpm --filter webview-app test:coverage` to measure webview baseline
- [ ] Identify uncovered components and utilities in `webview-app/src/`
- [ ] Add tests until webview-app reaches its coverage target (see Non-Goals for target clarification)
- [ ] All webview-app tests pass
- [ ] Coverage report shows percentage within acceptable range (target TBD — document in coverage report)

---

### US-007: Progressive threshold updates
**Description:** As a developer, I need vitest thresholds updated progressively so coverage quality is enforced in CI.

**Acceptance Criteria:**
- [ ] Update `vitest.config.ts` thresholds incrementally: 50% → 75% → 95% → 100%
- [ ] Final thresholds require 100% line, branch, and function coverage
- [ ] CI fails if coverage drops below threshold
- [ ] All tests and coverage pass at 100% level

---

### US-008: Coverage badges and report
**Description:** As a developer, I need generated coverage badges and a report so coverage metrics are visible and trackable.

**Acceptance Criteria:**
- [ ] Run full coverage report at 100%
- [ ] Generate coverage badges via existing `scripts/generateCoverageBadges.mjs`
- [ ] Verify badges display correctly (e.g., in `media/coverage-badges/`)
- [ ] Coverage report accessible and accurate

---

## Functional Requirements

- FR-1: Run `npm run test:coverage` to produce V8/c8 coverage output
- FR-2: Create `tests/canvas/CanvasPanel.test.ts` covering all public methods and error paths
- FR-3: Create `tests/extension.test.ts` covering activate/deactivate lifecycle
- FR-4: Add edge-case tests for command handlers covering error branches
- FR-5: Add branch-coverage tests for generator module
- FR-6: Measure and improve webview-app coverage
- FR-7: Update `vitest.config.ts` thresholds: 50% → 75% → 95% → 100%
- FR-8: Run `npm run test` and verify all tests pass at each threshold step
- FR-9: Run `scripts/generateCoverageBadges.mjs` to produce badges at final 100%

---

## Non-Goals

- **Webview-app coverage target is NOT necessarily 100%** — webview may have UI/rendering dependencies that are difficult to unit test. The target for webview-app will be documented after baseline measurement (aim for the highest practical percentage).
- No UI visual regression testing (only unit test coverage)
- No performance testing
- No changes to production code to make testing easier (only test additions)

---

## Technical Considerations

- **VS Code API mocking**: Use `vitest` mocks for `vscode` module in `extension.ts` and `CanvasPanel.ts` tests
- **Webview API mocking**: Mock `acquireVsCodeApi()` and postMessage flow
- **Progressive approach**: Increment thresholds in `vitest.config.ts` rather than jumping to 100% to allow gradual fixes
- **Existing infrastructure**: Reuse `scripts/generateCoverageBadges.mjs` and `vitest.config.ts` V8 provider
- **Test isolation**: Each test file should be independent; no shared mutable state

---

## Success Metrics

| Metric                          | Target       |
| ------------------------------- | ------------ |
| `src/` line/branch/function cov | 100%         |
| `webview-app/src/` coverage     | Documented % |
| All existing tests pass         | 36+ tests    |
| Vitest thresholds               | 100%         |
| Coverage badges generated       | Yes          |

---

## Open Questions

1. Should `webview-app/src/` have a 100% target or a practical maximum (e.g., 95%)? Baseline measurement will inform this.
2. Are there any third-party library wrappers in `src/` that should be excluded from coverage? (Current answer: No exclusions.)
3. Should the coverage improvement be done in stages (one module per PR) or all at once? (Recommend staged PRs for reviewability.)
