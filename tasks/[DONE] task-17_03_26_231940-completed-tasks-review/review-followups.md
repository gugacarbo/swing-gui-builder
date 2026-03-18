# US-012 — Backlog de follow-ups acionaveis [DONE]

## Resumo de entrada (origem da priorizacao)

- Fonte principal: `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-findings.md`
- Apoio de rastreabilidade: `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-matrix.md`
- Snapshot consolidado: **3 concluidas, 7 parciais, 2 nao concluidas**.

## Escala de prioridade usada

- **P0 (imediato <=24h)**: risco critico de governanca/aceite.
- **P1 (alta <=2 dias uteis)**: risco alto funcional/contratual.
- **P2 (proximo ciclo)**: risco medio com impacto de confiabilidade.
- **P3 (backlog)**: refinamentos de baixo risco.

---

### FUP-01 — Reabrir tasks marcadas `[DONE]` sem trilha minima de execucao
- **Prioridade:** P0
- **Owner sugerido:** Tech Lead + Project Owner de task
- **Acao objetiva:** Reabrir as tasks sinalizadas como nao concluidas/parciais por falta de evidencia, exigindo por story: arquivos alterados, comandos executados e resultados.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-01 (Critico)**.
  - `review-matrix.md` — linhas das tasks `task-12_03_26_201338-prd-swing-gui-builder` e `task-12_03_26_201338-review-swing-gui-builder` (status **Nao concluida**).
- **Criterio de conclusao:** status `[DONE]` mantido apenas apos atender checklist R2/R3/V1/V2 com evidencias verificaveis.

### FUP-02 — Reconciliar PRD inicial com implementacao (lacunas funcionais)
- **Prioridade:** P1
- **Owner sugerido:** Maintainer de Webview/Canvas + Product Owner
- **Acao objetiva:** Decidir e executar alinhamento entre PRD inicial e codigo atual (ex.: suporte a `JPasswordField`, dimensoes de janela e metodo de evento), com registro formal de aceite.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-02 (Alto)**.
  - `review-matrix.md` — linha da task `task-12_03_26_201338-prd-swing-gui-builder` (pendencia de reconciliacao PRD x implementacao).
- **Criterio de conclusao:** divergencias fechadas por correcao de codigo ou update documental aprovado.

### FUP-03 — Tornar obrigatorio `notes` tecnico por story em `prd.json`
- **Prioridade:** P1
- **Owner sugerido:** Maintainer de processo (Tasks/PRD) + Tech Lead
- **Acao objetiva:** Definir regra de governanca para impedir `passes=true` com `notes` vazias; incluir template minimo de evidencia tecnica por story.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-03 (Alto)**.
  - `review-matrix.md` — linha da task `task-12_03_26_201338-review-swing-gui-builder` (execucao nao comprovada).
- **Criterio de conclusao:** novas stories com `passes=true` exigem `notes` preenchidas com referencia a diff/comando/saida.

### FUP-04 — Alinhar schema com componentes hierarquicos aceitos
- **Prioridade:** P1
- **Owner sugerido:** Maintainer de configuracao/schema + Maintainer de geracao
- **Acao objetiva:** Atualizar `schemas/swingbuilder.schema.json` para incluir tipos hierarquicos (`MenuBar`, `Menu`, `MenuItem`, `ToolBar`) ou ajustar reader/template para contrato unico.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-04 (Alto)**.
  - `review-matrix.md` — linha da task `task-16_03_26_183407-complex-swing-components` (pendencia de schema).
- **Criterio de conclusao:** validacao de configuracao consistente entre schema, reader e template.

### FUP-05 — Restaurar/alinha contrato de scripts root (`build`/`verify`)
- **Prioridade:** P1
- **Owner sugerido:** Maintainer de monorepo/tooling
- **Acao objetiva:** Reintroduzir scripts `build`/`verify` no root ou revisar PRD/progress/README para o contrato real (`compile`/`check`) sem contradicoes.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-05 (Alto)**.
  - `review-matrix.md` — linha da task `task-16_03_26_214400-monorepo-config-alignment` (status parcial needs-work).
- **Criterio de conclusao:** contrato de scripts unico e consistente entre codigo e documentacao.

### FUP-06 — Publicar artefatos de cobertura no CI (ou ajustar AC)
- **Prioridade:** P1
- **Owner sugerido:** DevOps/CI Owner + QA Lead
- **Acao objetiva:** Adicionar upload de artefatos de cobertura no workflow de testes, ou registrar revisao formal do requisito quando upload nao for exigido.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-06 (Alto)**.
  - `review-matrix.md` — linha da task `task-17_03_26_140000-automated-tests` (pendencia de artifact no CI).
- **Criterio de conclusao:** pipeline com etapa de artifact validada ou requisito/aceite oficialmente atualizado.

### FUP-07 — Corrigir contradicoes de status na migracao webview
- **Prioridade:** P2
- **Owner sugerido:** Owner da task `webview-with-react-vite`
- **Acao objetiva:** Atualizar `progress.txt` para remover status conflitante ("Not Started" x conclusao) e anexar trilha cronologica objetiva.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-07 (Medio)**.
  - `review-matrix.md` — linha da task `task-12_03_26_201338-webview-with-react-vite` (parcial por contradicao documental).
- **Criterio de conclusao:** progresso com estado final unico e coerente com evidencias tecnicas.

### FUP-08 — Decidir e executar rodada adicional de simplificacao da webview
- **Prioridade:** P2
- **Owner sugerido:** Frontend/Webview Maintainer
- **Acao objetiva:** Revisar metas declaradas de simplificacao/refatoracao e definir plano de reducao (ou formalizar mudanca de meta), incluindo ajuste de non-goals divergentes.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-08 (Medio)** e **CF-13 (Baixo)**.
  - `review-matrix.md` — linha da task `task-13_03_26_213128-refactoring-webview-app` (parcial).
- **Criterio de conclusao:** metas de simplificacao/non-goals harmonizadas com estado atual e evidencias.

### FUP-09 — Resolver inconsistencia de conclusao na refatoracao estrutural
- **Prioridade:** P2
- **Owner sugerido:** Tech Lead da refatoracao estrutural
- **Acao objetiva:** Corrigir status final da task com contradicao (`26/26` concluido com story bloqueada) e anexar decisao oficial de fechamento parcial ou resolucao total.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-09 (Medio)**.
  - `review-matrix.md` — linha da task `task-16_03_26_200311-codebase-refactoring` (parcial needs-work).
- **Criterio de conclusao:** status final sem contradicoes internas no progresso/PRD.

### FUP-10 — Harmonizar escopo E2E entre requisito e PRD de testes automatizados
- **Prioridade:** P2
- **Owner sugerido:** QA Lead + Product Owner
- **Acao objetiva:** Registrar decisao explicita sobre inclusao/exclusao de E2E nesta fase e alinhar `req`, `prd` e criterios de aceite.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-10 (Medio)**.
  - `review-matrix.md` — linha da task `task-17_03_26_140000-automated-tests` (pendencia de alinhamento de escopo).
- **Criterio de conclusao:** documentos de escopo sem ambiguidade sobre E2E.

### FUP-11 — Padronizar rastreabilidade por story em `progress`/`prd`
- **Prioridade:** P2
- **Owner sugerido:** PMO/Process Owner + Owners das tasks
- **Acao objetiva:** Criar padrao unico de evidencia por story (arquivo, comando, resultado, data) e aplicar nas tasks com trilha fraca/ambigua.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-11 (Medio)** e **CF-12 (Medio)**.
  - `review-matrix.md` — linhas de `task-16_03_26_183407-components-preview` e `task-17_03_26_120000-fixes-and-improvements` (ressalvas documentais).
- **Criterio de conclusao:** templates e registros atualizados para eliminar ambiguidades de auditoria.

### FUP-12 — Executar backlog de refinamento UX/documentacao de componentes Swing
- **Prioridade:** P3
- **Owner sugerido:** Frontend/Webview Maintainer
- **Acao objetiva:** Tratar ajustes nao bloqueantes (ordem sidebar, cobertura de renderers dedicados) em lote de refinamento.
- **Origem/evidencia:**
  - `review-findings.md` — **CF-14 (Baixo)**.
  - `review-matrix.md` — linha da task `task-16_03_26_183407-components-preview` (pendencias de UX/documentacao).
- **Criterio de conclusao:** melhorias entregues sem regressao no fluxo principal.

---

## Ordenacao recomendada de execucao

1. **Janela imediata (P0):** FUP-01.
2. **Janela alta (P1):** FUP-02, FUP-03, FUP-04, FUP-05, FUP-06.
3. **Proximo ciclo (P2):** FUP-07, FUP-08, FUP-09, FUP-10, FUP-11.
4. **Backlog (P3):** FUP-12.

