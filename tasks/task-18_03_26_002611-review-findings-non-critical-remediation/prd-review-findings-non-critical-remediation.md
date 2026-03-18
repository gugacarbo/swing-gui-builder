# PRD: Review Findings Non-Critical Remediation

## 1. Introduction/Overview

Este PRD define a remediacao completa dos findings nao-criticos CF-07..CF-14, mantendo separacao estrita do fluxo critico (CF-01..CF-06). O foco e consolidar consistencia documental, rastreabilidade auditavel por story, alinhamento de escopo (incluindo E2E/non-goals) e execucao obrigatoria dos refinamentos de UX/docs de baixa criticidade.

A estrategia aprovada segue grupos dependentes (A -> B -> C -> D -> E), com criterio de fechamento de 100% dos findings em escopo como `Resolved`, `Deferred` ou `Split to Follow-up`, sempre com evidencia objetiva.

## 2. Goals

- Fechar 100% de CF-07..CF-14 com decisao final rastreavel por finding.
- Eliminar contradicoes internas de status em progressos e artefatos relacionados.
- Harmonizar declaracoes de escopo (simplificacao, E2E, non-goals) com o estado efetivamente entregue.
- Padronizar evidencia minima por story: arquivo alterado, comando executado e resultado observado.
- Executar os ajustes de UX/docs de CF-14 no ciclo atual (obrigatorio para fechamento).
- Garantir que nenhuma acao desta task dependa de remediacao pendente de CF-01..CF-06.

## 3. Research Baseline (Evidence)

- tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-findings.md
- tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md
- tasks/task-18_03_26_002611-review-findings-non-critical-remediation/req-review-findings-non-critical-remediation.md
- tasks/task-18_03_26_002611-review-findings-non-critical-remediation/plan-review-findings-non-critical-remediation.md

Principais evidencias mapeadas:
- CF-07, CF-09, CF-12: contradicoes de status e trilha documental ambigua.
- CF-08, CF-10, CF-13: divergencias de escopo declarado vs escopo entregue.
- CF-11: granularidade fraca de evidencias por story.
- CF-14: refinamentos UX/docs de baixo risco pendentes e mandatarios neste ciclo.

## 4. User Stories

### US-001: Definir vocabulario oficial de fechamento por finding
**Description:** Como owner de governanca, eu quero um vocabulario unico de fechamento para que o status final de CF-07..CF-14 seja consistente e auditavel.

**Group:** A

**Acceptance Criteria:**
- [ ] Definir e documentar os status oficiais: `Resolved`, `Deferred`, `Split to Follow-up`.
- [ ] Registrar regra de uso de cada status com exemplo objetivo por finding.
- [ ] Publicar checklist de sincronizacao cruzada entre req/prd/progress antes de marcar concluido.
- [ ] Typecheck/lint do repositorio permanece verde apos atualizacao documental.

**US-001 Delivery Contract (Closure Vocabulary + Sync Gate):**

| Status | Regra objetiva de uso | Exemplo concreto |
| --- | --- | --- |
| `Resolved` | Aplicar somente quando o finding estiver totalmente remediado no ciclo atual, com evidencias objetivas (`arquivo`, `comando`, `resultado`) e sem pendencia residual em backlog. | `CF-07` fica `Resolved` apenas quando os estados contraditorios forem removidos dos artefatos impactados e restar uma narrativa final unica. |
| `Deferred` | Aplicar somente quando a remediacao for deliberadamente postergada. Exige referencia `FUP-xx`, owner, racional e proximo passo com alvo de aceite. | `CF-14` fica `Deferred` quando um ajuste UX de baixa prioridade e transferido para `FUP-03` com owner e criterio de aceite. |
| `Split to Follow-up` | Aplicar somente quando parte do finding for concluida agora e o escopo residual for desmembrado para follow-up identificado. Deve separar explicitamente o que fechou agora vs o que migrou para `FUP-xx`. | `CF-10` fica `Split to Follow-up` quando a harmonizacao de escopo E2E fecha no ciclo atual e a expansao adicional de cobertura fica para `FUP-10` (owner: QA Lead + Product Owner; alvo de aceite: documentos de escopo de testes automatizados sem ambiguidade sobre inclusao/exclusao de E2E). |

**Cross-sync checklist before done (req/prd/progress):**

- [ ] `req-review-findings-non-critical-remediation.md` esta alinhado ao vocabulario oficial e regras de uso.
- [ ] `prd-review-findings-non-critical-remediation.md` e `prd.json` refletem os mesmos status finais/racionais.
- [ ] `progress.txt` registra trilha de evidencia coerente com req/prd (`files`, `commands`, `results`).
- [ ] Todo item `Deferred`/`Split` aponta para `FUP-xx` com owner, racional e proximo passo.
- [ ] Gates tecnicos executados antes de fechamento: `pnpm run lint` e `pnpm run typecheck`.

### US-002: Montar matriz de fechamento por finding
**Description:** Como reviewer, eu quero uma matriz unica de decisao por finding para validar rapidamente owner, evidencias e resultado final.

**Group:** A

**Acceptance Criteria:**
- [ ] Criar matriz unica para CF-07..CF-14 com colunas: finding, owner, status final, evidencia esperada, referencia de follow-up quando aplicavel.
- [ ] Cada finding possui exatamente uma decisao final.
- [ ] Itens `Deferred` ou `Split to Follow-up` incluem racional e referencia backlog.
- [ ] Matriz fica no artefato principal da task nao-critica para auditoria centralizada.

### US-003: Reconciliar contradicoes de status (CF-07, CF-09, CF-12)
**Description:** Como maintainer, eu quero eliminar contradicoes de status para que cada task impactada tenha narrativa final coerente.

**Group:** B

**Acceptance Criteria:**
- [ ] Atualizar os artefatos impactados por CF-07, CF-09 e CF-12 removendo estados conflitantes.
- [ ] Registrar nota de reconciliacao quando houve bloqueio temporario seguido de resolucao.
- [ ] Garantir consistencia entre status no progress e conclusao no PRD da task afetada.
- [ ] Evidencias por finding sao anexadas na matriz de fechamento.

### US-004: Alinhar declaracoes de simplificacao e non-goals (CF-08, CF-13)
**Description:** Como owner de escopo, eu quero alinhar simplificacao e non-goals ao estado real para evitar nova divergencia documental.

**Group:** B

**Acceptance Criteria:**
- [ ] Revisar e alinhar declaracoes de simplificacao da webview com o estado atual documentado.
- [ ] Corrigir divergencias de non-goal com decisao explicita: ajustar docs, ajustar implementacao, ou registrar excecao justificada.
- [ ] Cada decisao inclui owner e justificativa tecnica curta.
- [ ] Nenhum item fica sem destino claro (resolved/deferred/split).

**Registro oficial de decisao de simplificacao/non-goals (ciclo atual):**

- `CF-08` -> **docs fix** + `Split to Follow-up`
  - Owner: Frontend/Webview Maintainer.
  - Justificativa tecnica: a simplificacao estrutural foi entregue (hooks/libs/componentizacao), mas os arquivos chave seguem acima das metas de reducao originais no estado atual (`Canvas.tsx=370`, `PropertiesPanel/index.tsx=218`, `App.tsx=355`), portanto o alvo de reducao adicional permanece como residual planejado.
  - Destino final: `Split to Follow-up` com referencia `FUP-08`.
- `CF-13` -> **justified exception** + `Resolved`
  - Owner: Frontend/Webview Maintainer.
  - Justificativa tecnica: o non-goal "nao extrair ResizeHandles" divergiu do entregue e foi superado por modularizacao valida (`resizeHandles.tsx` extraido e reutilizado em `componentView.tsx`), sem necessidade de rollback tecnico.
  - Destino final: `Resolved` nesta task (com excecao justificada registrada).

### US-005: Harmonizar escopo E2E entre req/prd/progress (CF-10)
**Description:** Como QA owner, eu quero uma decisao unica sobre E2E para que aceite e evidencias de testes nao sejam ambiguos.

**Group:** B

**Acceptance Criteria:**
- [ ] Definir e registrar decisao oficial sobre escopo E2E desta fase.
- [ ] Atualizar req/prd/progress relevantes para refletir a mesma decisao.
- [ ] Quando E2E for diferido, incluir referencia de backlog com owner e criterio de aceite.
- [ ] Nao restam conflitos textuais de escopo E2E nos artefatos revisados.

**Registro de decisao oficial de escopo E2E (ciclo atual):**

- Nesta task nao-critica, o escopo fechado para `CF-10` e apenas a harmonizacao documental da declaracao de escopo E2E entre `req`/`prd`/`progress`.
- Nao ha expansao de implementacao/cobertura E2E nesta story; esse residual fica formalmente desmembrado para `FUP-10`.
- Backlog de continuidade: `FUP-10` em `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`.
- Owner do item diferido: QA Lead + Product Owner.
- Alvo de aceite do item diferido: artefatos de `task-17_03_26_140000-automated-tests` (`req`, `prd` e criterios de aceite) devem explicitar uma unica decisao de inclusao/exclusao de E2E, sem ambiguidade.

### US-006: Padronizar trilha minima por story (CF-11, CF-12)
**Description:** Como auditor tecnico, eu quero um padrao de evidencia por story para validar qualquer entrega sem suposicoes externas.

**Group:** C

**Acceptance Criteria:**
- [ ] Definir template minimo por story com: arquivos alterados, comandos executados, resultado observavel.
- [ ] Aplicar o template nas tasks com rastreabilidade fraca apontadas pela revisao.
- [ ] Validar que os registros permitem auditoria sem buscar contexto fora da task.
- [ ] Padrao publicado e reutilizavel para proximas tasks.

### US-007: Vincular itens Deferred/Split a backlog interno padrao FUP
**Description:** Como gestor de backlog, eu quero referencias padronizadas para itens nao fechados no ciclo para garantir continuidade com ownership.

**Group:** C

**Acceptance Criteria:**
- [ ] Todo item `Deferred` ou `Split to Follow-up` referencia backlog interno em tasks/ usando convencao FUP-xx.
- [ ] Cada referencia inclui owner sugerido, racional e proximo passo acionavel.
- [ ] Nao existe finding em estado aberto sem referencia de continuidade.
- [ ] A matriz final aponta para cada item FUP associado.

### US-008: Executar refinamentos UX/docs obrigatorios (CF-14)
**Description:** Como maintainer do webview, eu quero concluir os refinamentos UX/docs de baixo risco para encerrar o escopo nao-critico deste ciclo.

**Group:** D

**Acceptance Criteria:**
- [ ] Implementar ajustes de UX/docs de CF-14 que sao viaveis no ciclo atual.
- [ ] Atualizar documentacao e registros de entrega correspondentes.
- [ ] Se algum item residual permanecer, registrar `Split to Follow-up` com FUP-xx e criterio de aceite.
- [ ] Verificar no browser usando dev-browser skill quando houver mudanca visual.

### US-009: Validar fechamento de escopo sem dependencia critica
**Description:** Como aprovador, eu quero validar gates finais para confirmar que a task nao-critica fecha sem depender de CF-01..CF-06.

**Group:** E

**Acceptance Criteria:**
- [ ] Confirmar matriz final com 100% de CF-07..CF-14 em estado final valido.
- [ ] Confirmar que nenhuma acao pendente depende de CF-01..CF-06 para ser aceita.
- [ ] Executar checklist final AC-01..AC-04 do requirement desta task.
- [ ] Registrar aprovacao final com data e owner responsavel.

## 5. Functional Requirements

- FR-1: O processo deve usar vocabulario oficial de fechamento (`Resolved`, `Deferred`, `Split to Follow-up`) para CF-07..CF-14.
- FR-2: Deve existir matriz unica de fechamento por finding com owner, status e evidencia.
- FR-3: Artefatos impactados por CF-07, CF-09 e CF-12 devem ficar sem contradicoes de status.
- FR-4: Declaracoes de simplificacao e non-goals para webview devem ser reconciliadas e justificadas.
- FR-5: A decisao de escopo E2E deve ser unica e consistente entre req/prd/progress.
- FR-6: Toda story em escopo deve registrar evidencia minima (arquivo/comando/resultado).
- FR-7: Itens `Deferred`/`Split` devem apontar para backlog interno em tasks/ com convencao FUP-xx.
- FR-8: Refinamentos de CF-14 devem ser executados no ciclo atual ou explicitamente desdobrados com aceite.
- FR-9: O fechamento final deve validar AC-01..AC-04 da task nao-critica.
- FR-10: O ciclo nao-critico nao pode depender de resolucao pendente de CF-01..CF-06.

## 6. Non-Goals (Out of Scope)

- Remediar findings criticos/altos CF-01..CF-06.
- Introduzir features novas sem relacao com CF-07..CF-14.
- Fazer refatoracoes arquiteturais amplas fora do necessario para fechamento documental/UX em escopo.
- Alterar stack base de CI/testes sem necessidade direta para os findings nao-criticos.

## 7. Design Considerations

- Priorizar estrutura documental simples e padronizada para auditoria rapida.
- Concentrar a matriz de fechamento em artefato unico da task para reduzir divergencias.
- Preservar nomenclatura consistente de findings (CF-xx) e follow-ups (FUP-xx).

## 8. Technical Considerations

- Mudancas de documentacao devem manter compatibilidade com historico e padroes atuais das tasks.
- Onde houver ajuste visual em webview, validar comportamento com verificacao em navegador.
- Evidencias devem preferir referencias objetivas a arquivo/comando/resultado, evitando notas vagas.

## 9. Success Metrics

- 100% de CF-07..CF-14 com status final valido e evidencias objetivas.
- 0 contradicoes internas remanescentes nos artefatos atualizados em escopo.
- 100% das stories de remediacao com trilha minima de auditoria.
- 100% dos itens diferidos/split com referencia FUP-xx e owner.
- 0 dependencia nao-resolvida em CF-01..CF-06 para aceite desta task.

## 10. Open Questions

- Qual nivel de detalhe minimo de evidencias deve virar politica global para tasks futuras alem deste ciclo?
- A matriz unica desta task deve evoluir para artefato consolidado cross-task em revisoes futuras?

## Clarifying Answers Used

- Formato do artefato: gerar ambos, PRD Markdown e PRD JSON.
- Criterio de fechamento: obrigatorio fechar 100% de CF-07..CF-14 no ciclo (com status final valido).
- Convencao de backlog: usar novas referencias internas em tasks/ com padrao FUP-xx para `Deferred`/`Split`.
- Destino de arquivo: salvar neste diretorio com nome prd-review-findings-non-critical-remediation.md.
