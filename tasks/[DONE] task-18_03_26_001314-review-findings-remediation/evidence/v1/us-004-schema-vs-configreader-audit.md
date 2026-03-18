# US-004 Audit: `swingbuilder.schema.json` vs runtime (`ConfigReader` + templates)

## Scope
- Schema: `schemas/swingbuilder.schema.json`
- Runtime reader: `src/config/ConfigReader.ts`
- Config template source: `src/config/initConfigCommand.ts`
- Runtime generation templates: `src/generator/componentGenerators.ts`
- Webview defaulting path (config consumption): `src/canvas/CanvasPanel.ts`, `webview-app/src/hooks/useExtensionListener.ts`, `webview-app/src/hooks/useCanvasDragDrop.ts`

## Findings and discrepancies

### F1 — Schema is missing runtime-supported hierarchical component keys
**Evidence**
- Schema `components.properties` includes `Panel..Separator` only (no `MenuBar`, `Menu`, `MenuItem`, `ToolBar`): `schemas/swingbuilder.schema.json:35-49`.
- Reader accepts those component keys: `COMPONENT_TYPES` includes `MenuBar`, `Menu`, `MenuItem`, `ToolBar`: `src/config/ConfigReader.ts:33-52`.
- Project config template emits those keys: `src/config/initConfigCommand.ts:45-48`.
- Generator has explicit logic for those component types: `src/generator/componentGenerators.ts:15-29`, `:169-230`, `:240-261`.

**Expected behavior**
- Any component type consumed by `ConfigReader` and generator templates should be representable/valid in `.swingbuilder.json`.

**Actionable adjustments**
1. Add `MenuBar`, `Menu`, `MenuItem`, `ToolBar` entries to `schemas/swingbuilder.schema.json#/properties/components/properties`.
2. Keep `additionalProperties: false` and align schema component list with `COMPONENT_TYPES` (single source of truth).

---

### F2 — `children` contract text conflicts with template usage semantics
**Evidence**
- Schema describes `children` as “IDs of child components”: `schemas/swingbuilder.schema.json:77-83`.
- Init template uses type-like tokens (`"Menu"`, `"MenuItem"`) instead of IDs: `src/config/initConfigCommand.ts:45-47`.
- Generator interprets `children` in canvas model as IDs (maps child IDs via `componentMap.get(childId)`): `src/generator/componentGenerators.ts:40-43`.

**Expected behavior**
- Config docs/schema should clearly distinguish:
  - runtime canvas `children` (component IDs), versus
  - config-level hierarchy defaults/rules (if intended as type relationships).

**Actionable adjustments**
1. Decide contract:
   - Option A: keep `children` as IDs everywhere and change template examples accordingly, or
   - Option B: introduce explicit config field (e.g. `childTypes`) for type-level defaults.
2. Update schema descriptions and init template to match chosen contract.

---

### F3 — Project schema and VS Code settings naming diverge
**Evidence**
- Schema component defaults use `backgroundColor`, `textColor`, `fontFamily`, `fontSize`: `schemas/swingbuilder.schema.json:57-76`.
- Reader also accepts legacy VS Code per-component keys `defaultBackgroundColor/defaultTextColor/defaultFontFamily/defaultFontSize`: `src/config/ConfigReader.ts:93-98`.
- VS Code settings contribute those `default*` keys (example): `package.json:124-223`.

**Expected behavior**
- The naming split should be explicitly documented and ideally normalized to reduce configuration confusion.

**Actionable adjustments**
1. Document `.swingbuilder.json` keys vs `settings.json` keys in one place.
2. Consider introducing normalization helpers and tests to make mapping explicit.
3. Optionally support both key shapes in project config with deprecation warnings.

---

### F4 — Config defaults are emitted by extension but not applied when creating components
**Evidence**
- Extension sends `configDefaults`: `src/canvas/CanvasPanel.ts:97-108`.
- Webview listener supports `onConfigDefaults`: `webview-app/src/hooks/useExtensionListener.ts:9`, `:28-30`.
- App does not pass `onConfigDefaults` callback: `webview-app/src/App.tsx:335-346`.
- New components are created from hardcoded defaults (`getDefaultProps/getDefaultSize`), not extension config: `webview-app/src/hooks/useCanvasDragDrop.ts:171-186`, `webview-app/src/lib/componentDefaults.ts:22-62`.

**Expected behavior**
- Defaults read by `ConfigReader` should influence newly dropped components and preview behavior.

**Actionable adjustments**
1. Add `configDefaults` state in `App.tsx` and wire `onConfigDefaults`.
2. Merge incoming defaults into component creation flow (e.g., injectable resolver in `useCanvasDragDrop`).
3. Add tests validating that `.swingbuilder.json` defaults affect newly created components.

---

### F5 — Runtime validation is weaker than schema guarantees
**Evidence**
- Schema enforces hex color format/range and font bounds: `schemas/swingbuilder.schema.json:9`, `:14`, `:23-25`, `:59`, `:64`, `:73-75`.
- Reader only checks primitive types for project config (`string`/`number`), not patterns/ranges: `src/config/ConfigReader.ts:61-64`, `:109-114`.
- Invalid color handling in codegen falls back silently to black: `src/generator/codeHelpers.ts:33-35`.

**Expected behavior**
- Runtime should either validate against schema or fail loudly when values are out of contract.

**Actionable adjustments**
1. Validate parsed project config against schema (or equivalent runtime validator) before merge.
2. Clamp/reject invalid numeric values and invalid hex colors with user-visible warnings.
3. Add tests for invalid values to prevent silent coercion.

## Recommended implementation order
1. **F1** (schema/runtime type alignment) — prevents false schema errors for supported components.
2. **F4** (apply defaults in webview) — unlocks actual effect of configured defaults.
3. **F2/F3** (contract clarity and naming normalization) — reduces user confusion and drift.
4. **F5** (runtime validation hardening) — improves reliability and debuggability.
