# Coverage Report — US-012

## Baseline (local)

Command used:

```bash
pnpm --workspace-concurrency=1 --filter . --filter ./shared --filter ./webview-app --if-present test:coverage
```

| Scope | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Extension (root) | 79.95% | 68.95% | 96.66% | 79.90% |
| Webview (`webview-app`) | 53.75% | 32.60% | 52.23% | 54.62% |

## Initial goals

1. Enforce minimum global coverage threshold of **50%** for `statements`, `functions`, and `lines` in both Vitest configs.
2. Keep branch coverage tracked in reports and improve webview branch coverage in upcoming stories.
3. Maintain CI visibility through workflow status badge and coverage artifacts upload.
