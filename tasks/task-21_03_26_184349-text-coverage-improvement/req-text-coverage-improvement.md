# Test Coverage Improvement: 95% to 100%

## Description

Increase test coverage from 95% to 100% for both the VS Code extension and webview app. This task focuses on covering edge cases, error paths, and modules currently not tested (canvas, extension.ts activation/deactivate).

## Research & Gap Analysis

### Findings

- **Current Baseline**: Thresholds set at 20% in `vitest.config.ts` - significant gap to 100%
- **Existing Tests**: 36 tests across commands, generator, config, utils modules
- **Uncovered Modules**: `canvas/CanvasPanel.ts`, `extension.ts` (activate/deactivate)
- **Tools**: V8 Provider (good), c8 as alternative, Vitest UI for visualization
- **Webview App**: Has `vitest.setup.ts` and existing tests but coverage unclear

### Gaps & Risks

| Module/File                 | Current Status | Gap                                |
| --------------------------- | -------------- | ---------------------------------- |
| `src/canvas/CanvasPanel.ts` | No tests       | Entire file uncovered              |
| `src/extension.ts`          | No tests       | activate/deactivate not tested     |
| `src/commands/*.ts`         | Partial        | Error branches, edge cases missing |
| `src/generator/*.ts`        | ~80%           | Some branches uncovered            |
| `webview-app/src/`          | Unknown        | Needs baseline measurement         |

### Suggestions

1. **Measure baseline**: Run `npm run test:coverage` to get current detailed report
2. **Prioritize uncovered modules**: CanvasPanel and extension.ts are largest gaps
3. **Use progressive thresholds**: 20% → 50% → 75% → 95% → 100%
4. **Add `/* v8 ignore next */` for unavoidable VS Code API stubs**
5. **Create canvas tests first** as it's the largest untested module

## Decided Requirements

- [ ] Run baseline coverage report and identify exact gaps
- [ ] Create `tests/canvas/CanvasPanel.test.ts` for CanvasPanel coverage
- [ ] Create `tests/extension.test.ts` for activate/deactivate paths
- [ ] Add edge case tests for command handlers (error branches)
- [ ] Increase vitest thresholds progressively: 50% → 75% → 95% → 100%
- [ ] Ensure webview-app also reaches 100% coverage
- [ ] Verify all new tests pass with `npm run test`
- [ ] Generate and review coverage badges/report

## Success Criteria

- **Main stakeholder**: Developer/maintainer
- **Success metrics**:
  - All vitest thresholds reach 100%
  - No uncovered lines in src/ and webview-app/src/
  - All 36+ existing tests still pass
  - Coverage report shows 100% on all metrics
