# Plan: Remediation of Non-Critical Review Findings (CF-07 a CF-14)

Objetivo: fechar findings médios/baixos da revisão consolidada com consistência documental, rastreabilidade auditável e refinamentos UX/docs não bloqueantes, sem contaminar o fluxo de remediação crítica.

---

## 📊 Estado Atual (Baseline)

### O que já existe

| Camada                             | Status     | Observações                                                                |
| ---------------------------------- | ---------- | -------------------------------------------------------------------------- |
| Requisito da task não-crítica      | Definido   | `req-review-findings-non-critical-remediation.md` com R1-R4 e AC-01..AC-04 |
| Mapeamento consolidado de findings | Disponível | `review-findings.md` lista CF-07..CF-14 com severidade/evidência           |
| Backlog de follow-ups              | Disponível | `review-followups.md` já separa P2/P3 e owners sugeridos                   |
| Task crítica separada              | Disponível | `task-18_03_26_001314-review-findings-remediation` evita mistura de escopo |

### Achados da pesquisa / Evidências

- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-findings.md`
- `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-followups.md`
- `tasks/task-18_03_26_002611-review-findings-non-critical-remediation/req-review-findings-non-critical-remediation.md`
- Evidências de inconsistência citadas nos reviews de US-006, US-007, US-008 e US-009 (status conflitante, escopo E2E, rastreabilidade, non-goals, UX/docs).

### Gaps identificados

1. Vocabulário de fechamento ainda não padronizado por finding (Resolved/Deferred/Split to Follow-up).
2. Falta de reconciliação explícita entre estados temporários e estado final em alguns `progress.txt`.
3. Divergência entre escopo declarado (E2E/non-goals/simplificação) e o que está efetivamente registrado como entregue.
4. Rastreabilidade por story inconsistente (nem sempre inclui arquivo + comando + resultado).
5. CF-14 exige decisão de execução obrigatória no ciclo (definido pelo aprovador).

---

## Scope

### In Scope

- Fechamento de `CF-07` a `CF-14` com status final por finding: `Resolved`, `Deferred` ou `Split to Follow-up`.
- Correção de inconsistências documentais em `progress.txt`, `req`/`prd` e artefatos de tarefa afetados.
- Padronização mínima de rastreabilidade por story (arquivo alterado, comando executado, resultado).
- Execução dos ajustes de UX/docs de `CF-14` como requisito obrigatório deste ciclo.

### Out of Scope

- Qualquer finding crítico/alto (`CF-01` a `CF-06`).
- Desenvolvimento de features novas sem vínculo com os findings não-críticos.
- Refatorações arquiteturais amplas fora do necessário para fechar `CF-07`..`CF-14`.

---

## Steps (focados e pequenos)

### 1. Governança de fechamento e checklist de sync
- **Arquivo:** `tasks/task-18_03_26_002611-review-findings-non-critical-remediation/progress.txt` (criar/atualizar), artefatos de task impactada
- **Ação:** Definir vocabulário oficial (`Resolved`, `Deferred`, `Split to Follow-up`) e checklist de sincronização cruzada (`req`/`prd`/`progress`) antes de marcar done.
- **Dependência:** nenhuma

### 2. Mapa objetivo de impacto por finding
- **Arquivo:** `tasks/task-18_03_26_002611-review-findings-non-critical-remediation/progress.txt`
- **Ação:** Para cada `CF-07`..`CF-14`, registrar: artefato alvo, owner, decisão de fechamento e evidência esperada.
- **Dependência:** Step 1

### 3. Remediação documental de contradições de status (R1)
- **Arquivo:** `progress.txt` e docs das tasks afetadas por `CF-07`, `CF-09`, `CF-12`
- **Ação:** Eliminar estados conflitantes, manter narrativa final única e adicionar nota de reconciliação quando houve bloqueio temporário.
- **Dependência:** Step 2

### 4. Alinhamento de escopo Webview/Testes (R2)
- **Arquivo:** artefatos `req`/`prd`/`progress` das tasks associadas a `CF-08`, `CF-10`, `CF-13`
- **Ação:** Harmonizar declaração final de simplificação, escopo E2E e non-goals com o entregue; registrar owner/racional/referência de backlog quando houver deferimento.
- **Dependência:** Step 2

### 5. Padronização de rastreabilidade por story (R3)
- **Arquivo:** `progress.txt`/`prd.json` das tasks com trilha fraca (mínimo: components-preview e fixes-and-improvements)
- **Ação:** Aplicar padrão de evidência por story: arquivo alterado, comando executado, resultado observável.
- **Dependência:** Step 3

### 6. Execução dos refinamentos UX/docs (R4, obrigatório)
- **Arquivo:** artefatos da task de components preview + código/documentação correspondente
- **Ação:** Implementar ajustes de baixo risco de `CF-14`; se algum item não couber, abrir follow-up explícito com critério de aceite e referência.
- **Dependência:** Step 4

### 7. Validação de aceites e fechamento controlado
- **Arquivo:** `tasks/task-18_03_26_002611-review-findings-non-critical-remediation/progress.txt`
- **Ação:** Validar AC-01..AC-04 com checklist final e matriz de fechamento por finding; confirmar ausência de dependência pendente em `CF-01`..`CF-06`.
- **Dependência:** Steps 5 e 6

---

## ⚠️ Riscos e Mitigações

| Risco                                                              | Mitigação                                                                          |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Reabertura de inconsistências por atualização parcial de artefatos | Tornar obrigatório checklist de sync cruzado no fechamento (Step 1 e 7)            |
| Deferimentos sem rastreabilidade acionável                         | Exigir owner + racional + referência de backlog em todo item `Deferred`/`Split`    |
| Escopo crescer e invadir trilha crítica                            | Gate explícito de escopo: bloquear qualquer item que dependa de `CF-01`..`CF-06`   |
| Evidências insuficientes para auditoria futura                     | Template mínimo por story (arquivo/comando/resultado) e revisão final de qualidade |

---

## 📝 Notas e Perguntas Abertas

Decisões acordadas para este plano:

- Approval owner para fechamento documental: **Tech Lead**.
- `CF-14` (UX/docs) é **obrigatório para fechamento** deste ciclo.
- Itens `P2` (`CF-07`..`CF-12`) estão **sem prazo rígido**, com execução no ciclo não-crítico sem comprometer qualidade.

Perguntas em aberto após definição inicial:

- Qual convenção final de backlog será usada para referenciar itens `Deferred`/`Split` (ex.: nova task em `tasks/` ou issue externa)?
- Haverá uma matriz única de fechamento por finding no `progress.txt` desta task ou distribuída por task impactada?

---

## Checklist de Validação do Plano

- [x] Cada step referencia arquivo/artefato alvo.
- [x] Dependências entre steps explícitas.
- [x] Steps pequenos e executáveis por unidade.
- [x] Questões de governança essenciais respondidas antes do planejamento final.
