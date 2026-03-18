# Review US-006 — Webview + Refatoração

## Escopo avaliado

- `[DONE] task-12_03_26_201338-webview-with-react-vite`
- `[DONE] task-13_03_26_213128-refactoring-webview-app`

Base: checklist `R1..R3`, `C1..C3`, `V1..V3` em `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-checklist.md`.

---

## Resultado consolidado

| Task | Classificação | Resumo |
| --- | --- | --- |
| `task-12_03_26_201338-webview-with-react-vite` | **Parcial** | Entrega técnica principal está presente no estado atual, porém há contradição documental forte no `progress.txt` (status/sumário ainda “Not Started”). |
| `task-13_03_26_213128-refactoring-webview-app` | **Parcial** | Estrutura de refatoração (hooks/libs/componentização) existe, mas o estado atual diverge de metas explícitas de simplificação/redução e de um non-goal declarado. |

---

## Evidências objetivas — task-12_03_26_201338-webview-with-react-vite

### Aderência observada

1. Escopo da migração para React+Vite está explícito no PRD (`prd-migrate-webview-react-vite.md:5`, `:11`).
2. Requisito de carregar bundle em `out/webview/index.html` e roots/CSP está no PRD (`prd-migrate-webview-react-vite.md:315-316`, `:453`) e implementado em `CanvasPanel.ts`:
   - root `out/webview`: `src/canvas/CanvasPanel.ts:22`, `:125-127`
   - `localResourceRoots`: `src/canvas/CanvasPanel.ts:35`
   - nonce + CSP: `src/canvas/CanvasPanel.ts:153-177`
3. Script de build webview e fluxo de publish existem no `package.json` (`package.json:45`, `:47`, `:53`), aderente a `US-025`.
4. Atualização de documentação existe no root e no webview app:
   - `README.md:109-111`
   - `webview-app/README.md:1-12`
5. Remoção do legado `webview/` (US-034) está aderente ao estado atual:
   - evidência de execução local: `webview folder | ABSENT` (comando de verificação de diretório).
6. PRD operacional (`prd.json`) da task marca stories como concluídas:
   - `[DONE] task-12_03_26_201338-webview-with-react-vite | stories=36 | passes_true=36 | passes_false=0`.

### Inconsistência registrada

| ID | Severidade | Achado | Evidência |
| --- | --- | --- | --- |
| WVR-01 | **Médio** | `progress.txt` contradiz status de concluído: cabeçalho/sumário indicam “Not Started”, apesar de logs finais de conclusão e `passes=true` no PRD. | `progress.txt:5`, `:55`, `:57` **vs** `progress.txt:115`, `:126`; `prd.json` resumo de passes (36/36). |

---

## Evidências objetivas — task-13_03_26_213128-refactoring-webview-app

### Aderência observada

1. PRD define claramente a refatoração por hooks/libs/componentes (`prd-refactoring-webview-app.md:22-233`).
2. Artefatos centrais da refatoração existem no estado atual:
   - `useCanvasDragDrop`: `webview-app/src/hooks/useCanvasDragDrop.ts`
   - `useCanvasZoomPan`: `webview-app/src/hooks/useCanvasZoomPan.ts`
   - `useDragInteraction`: `webview-app/src/hooks/useDragInteraction.ts`
   - `useKeyboardShortcuts`: `webview-app/src/hooks/useKeyboardShortcuts.ts`
   - `constants/componentDefaults/geometry`: `webview-app/src/lib/*.ts`
   - `PropertiesPanel/` modularizado: `webview-app/src/components/PropertiesPanel/*`
3. Uso efetivo desses hooks em componentes-chave:
   - `Canvas.tsx`: imports/uso `useCanvasDragDrop` e `useCanvasZoomPan` (`webview-app/src/components/Canvas.tsx:7-8`, `:99`, `:104`)
   - `CanvasComponent.tsx`: uso `useDragInteraction` (`webview-app/src/components/CanvasComponent.tsx:6`, `:40`)
   - `App.tsx`: uso `useKeyboardShortcuts` (`webview-app/src/App.tsx:11`, `:313`)
4. Status documental da própria task é de concluída e coerente com PRD operacional:
   - `progress.txt:3`, `:5`, `:15`
   - `[DONE] task-13_03_26_213128-refactoring-webview-app | stories=13 | passes_true=13 | passes_false=0`.

### Inconsistências registradas

| ID | Severidade | Achado | Evidência |
| --- | --- | --- | --- |
| REF-01 | **Médio** | Metas explícitas de redução/simplificação não aderem ao estado atual dos arquivos principais. | Meta no PRD: `Canvas ~80` (`:125`), `PropertiesPanel ~80` (`:172`), `App ~80` (`:186`). Estado atual: `Canvas.tsx=416`, `PropertiesPanel/index.tsx=241`, `App.tsx=417` (comando de contagem de linhas). |
| REF-02 | **Baixo** | Non-goal explícito “não extrair ResizeHandles” está divergente no estado atual. | Non-goal: `prd-refactoring-webview-app.md:246`; estado atual: `webview-app/src/components/CanvasComponent/resizeHandles.tsx` e uso em `componentView.tsx`. |

> Nota: parte da divergência pode ter sido introduzida por tasks posteriores; a avaliação aqui compara **escopo declarado** vs **estado atual**.

---

## Checklist aplicado

### task-12_03_26_201338-webview-with-react-vite

- R1: **ATENDE**
- R2: **ATENDE**
- R3: **ATENDE**
- C1: **NAO_ATENDE** (contradição de status em `progress.txt`)
- C2: **ATENDE** (núcleo técnico presente)
- C3: **NAO_ATENDE** (lacuna não explicitada no próprio artefato)
- V1: **ATENDE**
- V2: **ATENDE**
- V3: **ATENDE**

Classificação: **Parcial**.

### task-13_03_26_213128-refactoring-webview-app

- R1: **ATENDE**
- R2: **ATENDE**
- R3: **ATENDE**
- C1: **ATENDE**
- C2: **NAO_ATENDE** (desalinhamento com metas explícitas de simplificação/non-goal)
- C3: **NAO_ATENDE** (desalinhamentos não registrados como pendência)
- V1: **ATENDE**
- V2: **ATENDE**
- V3: **ATENDE**

Classificação: **Parcial**.

---

## Validação técnica desta US-006

Comando executado:

```bash
pnpm run typecheck
```

Resultado: **OK (exit code 0)**.

Evidência de saída:

- `pnpm --dir shared build && pnpm --dir webview-app typecheck && tsc -p ./ --noEmit`
- conclusão sem erros (`exit code 0`).

---

## Pendências objetivas recomendadas

1. **WVR-01 (Médio):** corrigir `progress.txt` da task webview para refletir status final real.
2. **REF-01 (Médio):** decidir se metas de redução ainda são mandatórias; se sim, registrar follow-up de simplificação ou atualizar critérios com justificativa.
3. **REF-02 (Baixo):** alinhar documentação de non-goal com implementação atual (ou reverter extração se necessário).

