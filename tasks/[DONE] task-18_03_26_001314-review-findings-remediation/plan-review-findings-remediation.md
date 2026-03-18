# Plan: Review Findings Remediation

Breve descrição

Corrigir as issues críticas e de alta prioridade listadas em `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-findings.md`, restabelecendo rastreabilidade, consistência de contratos (schema/scripts) e publicação de artefatos de cobertura no CI.

---

## 📊 Estado Atual (Baseline)

### O que já existe
- Repositório com tarefas concluídas que geraram findings críticos/alta prioridade.
- Documento de evidência: `tasks/[DONE] task-17_03_26_231940-completed-tasks-review/review-findings.md`.
- Requisitos decididos no `req-review-findings-remediation.md` (fonte desta análise).

### Achados da pesquisa / Evidências
- `CF-01`..`CF-06` enumerados no `req-review-findings-remediation.md` com requisitos R1..R6.
- Necessidade de validação cruzada entre `schemas/swingbuilder.schema.json`, `ConfigReader`, e pipeline de geração.
- Falta de publicação de coverage artifacts no workflow de CI.

### Gaps identificados (resumo)
1. Não há definição operacional de "evidência mínima" (ex.: formato, localização, exemplos concretos). (R1)
2. Processo para reconciliar divergências PRD ↔ implementação não detalhado (responsáveis, critérios de aceitação por divergência). (R2)
3. Validação técnica que impeça `passes=true` sem `notes` não implementada — falta script/validator e testes de integração. (R3)
4. Especificidade do schema hierárquico insuficiente — exemplos de uso e testes faltantes. (R4)
5. Decisão de contrato de scripts (`build`/`verify` vs `compile`/`check`) não documentada; referências dispersas. (R5)
6. Workflow de CI existente não contém passo de upload de coverage artifacts ou documentação de naming/location. (R6)

---

## Scope

### In Scope
- Remediar `CF-01` a `CF-06` conforme R1..R6.
- Atualizar docs e adicionar validações automatizadas e testes mínimos.
- Atualizar workflow de CI para publicar cobertura.

### Out of Scope
- Findings de prioridade média/baixa (`CF-07+`).
- Novos recursos além do necessário para remediação.

---

## Steps (pequenos e acionáveis)

Nota: cada step deve ser ~30–90 minutos; onde aplicável, há arquivos alvo.

Group A — Base (sequencial)

A1. Definir template de "evidência mínima" e formato (ex.: `progress.txt` entries + `prd.json` notes). Arquivo: `tasks/task-18_03_26_001314-review-findings-remediation/evidence-template.md`.
- Ação: escrever template com campos: `files_changed`, `commands`, `command_output`, `links`.
- Dependência: nenhum.

A2. Atualizar `req-review-findings-remediation.md` com checklist de evidências por finding e adicionar exemplos concretos.
- Ação: adicionar seção `Evidence examples` no req.
- Dependência: A1.

A3. Implementar validador simples para `prd.json`: script `scripts/validate-prd.js` que falha se `passes=true` e `notes` vazio; adicionar entrada de execução em CI local (ex.: `npm run verify:prd`).
- Ação: criar script + unit test (vitest).
- Arquivos: `scripts/validate-prd.js`, `tests/validate-prd.test.ts`.
- Dependência: A1 (para formato de notes).

Group B — Schema & Config

B1. Auditar `schemas/swingbuilder.schema.json` vs uso atual em `ConfigReader` e templates.
- Ação: listar discrepâncias e criar PRD-style doc com exemplos. Arquivos: `schemas/swingbuilder.schema.json`, `src/config/ConfigReader.ts`.
- Dependência: A2.

B2. Adicionar/ajustar schema para suportar hierarquias documentadas e criar validação de integração (testes que carregam exemplos hierárquicos).
- Ação: atualizar schema + adicionar `tests/schema-hierarchy.test.ts`.
- Dependência: B1.

Group C — Scripts Contract

C1. Decidir contrato de scripts (opção 1: adicionar `build`/`verify`; opção 2: padronizar `compile`/`check`). Registrar decisão em `docs/scripts-contract.md`.
- Ação: proposta com trade-offs e recomendação.
- Dependência: nenhuma (mas consulte stakeholders).

C2. Implementar mudanças escolhidas: adicionar scripts no `package.json` raiz e adaptar docs/tasks que referenciam scripts.
- Ação: atualizar `package.json` e `README.md`/task docs.
- Dependência: C1.

Group D — CI Coverage

D1. Atualizar `.github/workflows/test.yml` para publicar coverage artifacts on success (nome e path padronizados: `coverage/lcov-report` e `coverage/coverage-summary.json`).
- Ação: patch no workflow com `actions/upload-artifact@v3` step.
- Dependência: C2 (se scripts alterarem como cobertura é gerada).

D2. Executar run local/CI simulado para verificar upload e trails; documentar logs location.
- Ação: executar workflow via GitHub Actions runner (ou simular local) e capturar logs.
- Dependência: D1.

Group E — Backfill & Reconciliation

E1. Backfill `prd.json` notes for stories marked `passes=true` without notes (create `tasks/.../backfill/*.md` with before/after evidence links).
- Ação: team-assigned task; create templates to be filled by owners.
- Dependência: A1, A3.

E2. Reconcile PRD vs implementation: create `reconciliation.md` listing divergences and proposed fixes; assign owner per divergence.
- Ação: review code + docs; for each divergence: implement or document justification.
- Dependência: B1, E1.

---

## ⚠️ Riscos e Mitigações

- Risco: Falta de donos para backfill → Mitigação: dividir em subtasks e atribuir responsáveis com prazo curto.
- Risco: Mudanças de schema quebram consumidores → Mitigação: incluir testes de compatibilidade e versionamento do schema.
- Risco: CI upload falha por path incorreto → Mitigação: padronizar paths e validar localmente antes do merge.

---

## 📝 Notas e Perguntas Abertas (para validar com o usuário)

1. Aprovação: quem decide a escolha do contrato de scripts (`build`/`verify` vs `compile`/`check`)? Indicar stakeholder/owner.
2. Permissão para editar `package.json` raiz e workflows no PR de remediação? (sim/não)
3. Existe um padrão preferido para formato de evidência (ex.: YAML vs JSON vs markdown)? Se não, sugiro Markdown estruturado (A1 propõe formato).
4. Há CI runners limitados que repercutem no upload de artifacts (restrições de tamanho/retention)?
5. Owner(s) para backfill: indicar 1–3 responsáveis para completar `E1`.

---

## Cronograma sugerido (curto)
- Dia 0 (início): A1, A2 (definir template e atualizar req)
- Dia 1: A3, B1
- Dia 2: B2, C1
- Dia 3: C2, D1
- Dia 4: D2, E1 start
- Dia 5: E2, final verification and close

---

## Entregáveis (mapped to req)
- `tasks/task-18_03_26_001314-review-findings-remediation/evidence-template.md` (A1)
- `scripts/validate-prd.js` + `tests/validate-prd.test.ts` (A3)
- `schemas/swingbuilder.schema.json` updates + `tests/schema-hierarchy.test.ts` (B2)
- `docs/scripts-contract.md` and updated `package.json` (C1/C2)
- `.github/workflows/test.yml` updated to upload coverage artifacts (D1)
- Backfill artifacts in `tasks/.../backfill/` (E1)
- `reconciliation.md` with divergences and resolution records (E2)

---

## Próximos passos (imediatos)
1. Confirme: posso criar os arquivos de template (`evidence-template.md`) e os scripts de validação no PR de remediação? (sim/não)
2. Indique o stakeholder/owner para decisão de scripts.
3. Se confirmar, eu crio os arquivos e um PR inicial contendo A1, A2 e A3 como mudança mínima.

---

*Gerado automaticamente a partir de `req-review-findings-remediation.md`.*
