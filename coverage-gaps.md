# Coverage Gaps Report

**Generated:** 2026-03-21

## Extension (src/) Coverage

**Overall: 99.61% statements, 97.61% branches, 100% functions, 99.79% lines**

### Files NOT Currently Tracked by Coverage

These files exist in `src/` but are not included in coverage reports (likely excluded or no tests):

| File | Status |
|------|--------|
| `src/canvas/CanvasPanel.ts` | Not in coverage report - needs tests |
| `src/commands/initConfigCommand.ts` | Not in coverage report - needs tests |
| `src/commands/newWindowCommand.ts` | Not in coverage report - needs tests |
| `src/components/ComponentModel.ts` | Not in coverage report - needs tests |
| `src/config/ConfigReader.ts` | Not in coverage report - needs tests |
| `src/config/initConfigCommand.ts` | Not in coverage report - needs tests |
| `src/extension.ts` | Not in coverage report - needs tests |
| `src/utils/JavaProjectDetector.ts` | Not in coverage report - needs tests |

### Files with Uncovered Branches

| File | Line Coverage | Branch Coverage | Uncovered Lines |
|------|---------------|-----------------|-----------------|
| `src/commands/generateCommand.ts` | 100% | 97.5% | Line 63 (branch) |
| `src/generator/JavaGenerator.ts` | 99.27% | 98.21% | Line 87 |
| `src/generator/componentGenerators.ts` | 100% | 93.24% | Lines 142-144, 156, 194, 216, 366 (branches) |

### Detailed Uncovered Branches in componentGenerators.ts

Based on the coverage report, these branches are not covered:
- Lines 142-144, 156, 194, 216, 366 - conditional branches not exercised

---

## Webview App (webview-app/src/) Coverage

**Overall: 58.17% statements, 48.75% branches, 47.66% functions, 58.65% lines**

### Files at 100% Coverage

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| `src/components/Sidebar.tsx` | 100% | 100% | 100% | 100% |
| `src/components/Toolbar.tsx` | 100% | 100% | 100% | 100% |
| `src/components/Canvas/constants.ts` | 100% | 100% | 100% | 100% |
| `src/components/CanvasComponent/previewRenderers.tsx` | 100% | 97.43% | 100% | 100% |
| `src/components/ui/button.tsx` | 100% | 66.66% | 100% | 100% |
| `src/hooks/useCanvasDragDrop.ts` | 100% | 100% | 100% | 100% |
| `src/lib/componentDefaults.ts` | 100% | 100% | 100% | 100% |
| `src/lib/constants.ts` | 100% | 100% | 100% | 100% |
| `src/lib/geometry.ts` | 100% | 100% | 100% | 100% |
| `src/lib/utils.ts` | 100% | 100% | 100% | 100% |
| `src/schemas/parsers.ts` | 100% | 100% | 100% | 100% |

### Files with 0% Coverage (Priority)

| File | Lines | Reason |
|------|-------|--------|
| `src/components/CanvasComponent.tsx` | 0% | Needs tests |
| `src/components/CanvasComponent/componentView.tsx` | 0% | Needs tests |

### Low Coverage Files (< 50%)

| File | Statements | Branches | Functions | Lines | Uncovered Lines |
|------|------------|----------|-----------|-------|-----------------|
| `src/App.tsx` | 25.43% | 4.34% | 13.04% | 26.5% | 33-38,63-70,77-82,87-92,106-166,182-384,421-429 |
| `src/components/Canvas.tsx` | 28% | 22.91% | 36.84% | 28.86% | 35-38,61-94,207-300,402 |
| `src/components/HierarchyPanel.tsx` | 31.25% | 10.14% | 25.71% | 31.13% | 32-124,228,328,365-383 |
| `src/components/PreviewCodeModal.tsx` | 27.58% | 12.82% | 33.33% | 27.27% | 36-51,66-87,187-198,206-219 |
| `src/components/Canvas/MenuBarZone.tsx` | 4.16% | 0% | 6.66% | 4.34% | 30-140 |
| `src/components/Canvas/ToolBarZone.tsx` | 2.17% | 0% | 3.7% | 2.22% | 29-41,64-305 |
| `src/components/Canvas/fixedZoneHelpers.ts` | 7.69% | 5.55% | 11.11% | 8.33% | 9-61,69-70 |
| `src/components/CanvasComponent/minSizes.ts` | 40% | 0% | 0% | 40% | 27-31 |
| `src/components/CanvasComponent/resizeHandles.tsx` | 16.66% | 0% | 0% | 16.66% | 49-58 |
| `src/components/PropertiesPanel/index.tsx` | 31.14% | 3.17% | 9.52% | 32.2% | 38-207,221-354 |
| `src/hooks/useCanvasZoomPan.ts` | 29.54% | 0% | 7.14% | 33.33% | 56-84,88,92,96-97 |
| `src/hooks/useExtensionListener.ts` | 35.29% | 0% | 75% | 35.29% | 18-35 |
| `src/schemas/canvas.ts` | 57.14% | 0% | 0% | 57.14% | 39-49 |
| `src/schemas/messages.ts` | 76.92% | 0% | 0% | 76.92% | 39-47 |

### Medium Coverage Files (50-90%)

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| `src/components/FrameConfigModal.tsx` | 82.85% | 72.22% | 77.77% | 82.85% |
| `src/components/Palette.tsx` | 62.96% | 50% | 55.55% | 65.38% |
| `src/components/PropertiesPanel/ColorField.tsx` | 58.06% | 66.66% | 57.14% | 58.06% |
| `src/components/PropertiesPanel/NumberField.tsx` | 73.91% | 75% | 80% | 73.91% |
| `src/components/Canvas/fixedZoneLayout.ts` | 40.84% | 14.28% | 5.88% | 42.64% |
| `src/hooks/useDragInteraction.ts` | 84.21% | 71.42% | 100% | 84.21% |
| `src/hooks/useHierarchyDragDrop.ts` | 82.43% | 74% | 91.66% | 81.91% |
| `src/hooks/useKeyboardShortcuts.ts` | 96.96% | 95.23% | 100% | 96.96% |
| `src/hooks/usePostMessage.ts` | 75% | 50% | 71.42% | 73.68% |
| `src/hooks/useUndoRedo.ts` | 94.87% | 88.88% | 100% | 94.87% |
| `src/hooks/useCanvasState.ts` | 100% | 93.24% | 100% | 100% |
| `src/lib/swingTypeLabels.ts` | 100% | 75% | 100% | 100% |

---

## Summary of Gaps

### Extension (src/) - Gap Summary

1. **8 files with 0% coverage** (not in coverage report):
   - CanvasPanel.ts, initConfigCommand.ts (commands), newWindowCommand.ts
   - ComponentModel.ts, ConfigReader.ts, initConfigCommand.ts (config)
   - extension.ts, JavaProjectDetector.ts

2. **3 files with uncovered branches**:
   - generateCommand.ts (line 63)
   - JavaGenerator.ts (line 87)
   - componentGenerators.ts (lines 142-144, 156, 194, 216, 366)

### Webview App (webview-app/src/) - Gap Summary

1. **2 files at 0% coverage**:
   - CanvasComponent.tsx
   - componentView.tsx

2. **14 files below 50% coverage** (majority of UI components)

3. **Primary uncovered areas**:
   - UI rendering components (App, Canvas, HierarchyPanel, etc.)
   - Canvas zones (MenuBarZone, ToolBarZone)
   - Properties panel
   - Zoom/pan hooks

---

## Recommendations

1. **Extension Priority 1**: Add tests for `extension.ts` (activate/deactivate lifecycle)
2. **Extension Priority 2**: Add tests for `CanvasPanel.ts`
3. **Extension Priority 3**: Cover remaining branches in generator files
4. **Webview Priority 1**: The webview has many UI components that are harder to unit test. Consider:
   - Targeting 80% coverage for webview-app instead of 100%
   - Using React Testing Library for component tests
   - Focusing on hooks and utility functions (which have better coverage)
