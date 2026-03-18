# Matriz consolidada de rastreabilidade ([DONE] tasks)

Escopo consolidado: **12/12** tasks com prefixo `[DONE]` listadas em `review-inventory.md`.

## Leitura rapida de status

- 🚫 **Nao concluida (2):**
  - `task-12_03_26_201338-prd-swing-gui-builder`
  - `task-12_03_26_201338-review-swing-gui-builder`
- ⚠️ **Parcial (7):**
  - `task-12_03_26_201338-webview-with-react-vite`
  - `task-13_03_26_213128-refactoring-webview-app`
  - `task-16_03_26_183407-complex-swing-components`
  - `task-16_03_26_183407-components-preview`
  - `task-16_03_26_200311-codebase-refactoring`
  - `task-16_03_26_214400-monorepo-config-alignment`
  - `task-17_03_26_140000-automated-tests`
- ✅ **Concluida (3):**
  - `task-15_03_26_131444-expand-swing-components`
  - `task-17_03_26_120000-fixes-and-improvements` (com ressalva documental)
  - `task-17_03_26_170000-test-coverage`

## Matriz por task

| Sinal | Task [DONE] | Requisito/objetivo | Evidencias principais | Status final | Pendencias objetivas |
| --- | --- | --- | --- | --- | --- |
| 🚫 | `[DONE] task-12_03_26_201338-prd-swing-gui-builder` | Definir PRD inicial do builder Swing (canvas + geracao Java + comandos base). | `review-us-004-prd-inicial.md`; aderencia parcial em `src/extension.ts`, `src/generator/JavaGenerator.ts`; divergencias funcionais (`Palette.tsx` sem PasswordField, lacunas de dimensao/event method); `progress.txt` sem evidencias por story. | **Nao concluida** | Reconstituir evidencias por story; reconciliar PRD x implementacao; preencher trilha de validacao no PRD/progresso. |
| 🚫 | `[DONE] task-12_03_26_201338-review-swing-gui-builder` | Revisar projeto e decompor melhorias com execucao comprovavel. | `review-us-005-review-projeto.md`; `review-swing-gui-builder.md` e 13 subtasks em formato de plano; ausencia de `progress.txt`; `prd.json` com `passes=true` e `notes` vazias. | **Nao concluida** | Registrar execucao real por subtask/story (arquivos/comandos/resultados); atualizar evidencias de aceite antes de manter `[DONE]`. |
| ⚠️ | `[DONE] task-12_03_26_201338-webview-with-react-vite` | Migrar webview para React+Vite com bundle em `out/webview` e fluxo de build/publicacao. | `review-us-006-webview-refatoracao.md`; `src/canvas/CanvasPanel.ts` (root/CSP/roots), `package.json` (scripts webview), `README.md` e `webview-app/README.md`; remocao de `webview/` legado. | **Parcial** | Corrigir contradicao de status no `progress.txt` ("Not Started" x conclusao). |
| ⚠️ | `[DONE] task-13_03_26_213128-refactoring-webview-app` | Refatorar webview com hooks/libs/componentizacao e simplificacao estrutural. | `review-us-006-webview-refatoracao.md`; hooks em `webview-app/src/hooks/*`; uso em `App.tsx`, `Canvas.tsx`, `CanvasComponent.tsx`; modularizacao em `PropertiesPanel/*`. | **Parcial** | Alinhar metas explicitas de reducao/simplificacao com estado atual; reconciliar non-goal de `ResizeHandles`. |
| ✅ | `[DONE] task-15_03_26_131444-expand-swing-components` | Expandir componentes Swing suportados (paleta, DnD, defaults, geracao Java e props). | `review-us-007-componentes-swing.md`; `shared/types/canvas.ts`, `webview-app/src/components/Palette.tsx`, `webview-app/src/hooks/useCanvasDragDrop.ts`, `webview-app/src/lib/componentDefaults.ts`, `src/generator/codeHelpers.ts`. | **Concluida** | Sem pendencia critica registrada na revisao consolidada. |
| ⚠️ | `[DONE] task-16_03_26_183407-complex-swing-components` | Implementar componentes hierarquicos (`JMenuBar`, `JMenu`, `JMenuItem`, `JToolBar`) com DnD e geracao Java. | `review-us-007-componentes-swing.md`; tipos e hierarquia em `shared/types/canvas.ts` e `useHierarchyDragDrop.ts`; zonas fixas e geracao em `Canvas/*` e `src/generator/componentGenerators.ts`; mismatch com schema. | **Parcial** | Incluir tipos hierarquicos em `schemas/swingbuilder.schema.json` (`components.properties`) para eliminar divergencia config/schema. |
| ⚠️ | `[DONE] task-16_03_26_183407-components-preview` | Melhorar preview (frame visual, arvore/menu colapsaveis, Delete, preview de codigo). | `review-us-007-componentes-swing.md`; `Canvas.tsx` (frame), `previewRenderers.tsx`, `Palette.tsx` + `HierarchyPanel.tsx` (colapsavel), `useKeyboardShortcuts.ts`, `PreviewCodeModal.tsx` + `previewCodeCommand.ts`. | **Parcial** | Validar ordem esperada `Palette`/`Hierarchy` no sidebar; aumentar granularidade de evidencia por story em `progress/prd`. |
| ⚠️ | `[DONE] task-16_03_26_200311-codebase-refactoring` | Refatorar estrutura da codebase (comandos, gerador e webview em modulos dedicados). | `review-us-008-refatoracao-estrutural.md`; modulos presentes em `src/commands/*`, `src/generator/*`, `webview-app/src/components/Canvas/*`, `docs/architecture.md`. | **Parcial (needs-work)** | Resolver contradicao documental (`Completed Stories 26/26` com US-024 registrada como `BLOCKED`). |
| ⚠️ | `[DONE] task-16_03_26_214400-monorepo-config-alignment` | Alinhar monorepo/workspace e contrato de scripts raiz para build/verify. | `review-us-008-refatoracao-estrutural.md`; `pnpm-workspace.yaml` e `shared/package.json`/`shared/tsconfig.json` aderentes; falta de `build`/`verify` no `package.json` raiz apesar de claim no progresso/PRD. | **Parcial (needs-work)** | Restaurar `build`/`verify` (ou ajustar PRD/progress/README para contrato oficial atual). |
| ✅ | `[DONE] task-17_03_26_120000-fixes-and-improvements` | Corrigir bugs e fortalecer qualidade tecnica em fluxos criticos da extensao. | `review-us-009-qualidade-testes-cobertura.md`; testes em `tests/generator/*` e `tests/integration/panel-children.test.ts`; cobertura alta em `coverage/combined/coverage-summary.json`. | **Concluida (com ressalva documental)** | Conciliar contradicao interna no `progress.txt` (bloqueio intermediario x fechamento final). |
| ⚠️ | `[DONE] task-17_03_26_140000-automated-tests` | Estabelecer base de testes automatizados e validacao CI com cobertura. | `review-us-009-qualidade-testes-cobertura.md`; suites verdes (`coverage/vitest-summary.json`), cobertura alta e docs em `README.md`; divergencia de artifact no workflow CI. | **Parcial (needs-work)** | Implementar upload de artefatos de cobertura no CI (ou ajustar AC); alinhar escopo E2E entre req e PRD. |
| ✅ | `[DONE] task-17_03_26_170000-test-coverage` | Reorganizar testes para `tests/` e atingir cobertura >=95%. | `review-us-009-qualidade-testes-cobertura.md`; estrutura em `tests/` + `webview-app/tests/`; thresholds em `vitest.config.ts` e `webview-app/vitest.config.ts`; metricas >95% em `coverage/`. | **Concluida** | Sem pendencia material registrada. |

## Fontes usadas nesta consolidacao

- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-inventory.md`
- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-checklist.md`
- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-us-004-prd-inicial.md`
- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-us-005-review-projeto.md`
- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-us-006-webview-refatoracao.md`
- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-us-007-componentes-swing.md`
- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-us-008-refatoracao-estrutural.md`
- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-us-009-qualidade-testes-cobertura.md`
- Artefatos relevantes em `tasks/[DONE] ...` citados pelas revisoes acima.

