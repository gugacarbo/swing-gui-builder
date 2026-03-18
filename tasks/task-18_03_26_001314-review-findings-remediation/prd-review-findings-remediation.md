# PRD: Review Findings Remediation

## 1. Introduction/Overview

Este PRD define a remediacao completa dos findings criticos e de alta prioridade (CF-01..CF-06) identificados na revisao anterior. O foco e restaurar consistencia entre requisitos e implementacao, reforcar validacoes automatizadas para evitar regressao de conformidade e garantir publicacao de artefatos de cobertura no CI com evidencias verificaveis.

A estrategia aprovada e faseada, com grupos de historias dependentes (A -> B -> C -> D -> E), e com conclusao condicionada a evidencia objetiva para 100% dos findings no escopo.

## 2. Goals

- Fechar 100% dos findings CF-01..CF-06 com evidencia verificavel e rastreavel.
- Eliminar divergencias de contrato entre documentacao, schema e implementacao para os pontos cobertos por R1..R6.
- Impedir aprovacao de historias marcadas como `passes=true` sem justificativa (`notes`) por validacao automatica.
- Publicar artefatos de cobertura no CI de forma consistente e reutilizavel em auditoria tecnica.
- Formalizar o contrato de scripts em `build/verify` e alinhar referencias no repositorio.

## 3. User Stories

### US-001: Definir template de evidencia minima
**Description:** As a maintainer, I want a standard evidence template so that every remediation item can be audited consistently.

**Group:** A

**Acceptance Criteria:**
- [ ] Criar template de evidencia contendo no minimo: `files_changed`, `commands`, `command_output`, `links`.
- [ ] Template salvo em caminho versionado da task atual.
- [ ] Template inclui exemplo preenchido para um finding.
- [ ] Lint/typecheck do repositorio permanecem verdes apos a adicao documental.

### US-002: Formalizar exemplos de evidencia no requisito
**Description:** As a reviewer, I want concrete evidence examples in the requirement document so that acceptance is objective per finding.

**Group:** A

**Acceptance Criteria:**
- [ ] Atualizar documento de requisitos da task com secao de exemplos de evidencia por finding.
- [ ] Cada finding CF-01..CF-06 possui referencia de evidencia esperada.
- [ ] Checklist de aceite por finding e explicitamente verificavel.
- [ ] Lint/typecheck permanecem verdes.

### US-003: Bloquear passes=true sem notes
**Description:** As a quality gate owner, I want an automated validator for PRD result files so that invalid approvals are rejected early.

**Group:** A

**Acceptance Criteria:**
- [ ] Implementar script de validacao que falha quando `passes=true` e `notes` estiver vazio.
- [ ] Expor comando de verificacao no contrato de scripts aprovado (`verify:prd` ou equivalente sob `verify`).
- [ ] Criar testes automatizados cobrindo casos valido e invalido.
- [ ] Pipeline local executa o validador com codigo de saida nao zero em caso invalido.
- [ ] Lint/typecheck/testes novos passam.

### US-004: Auditar schema vs ConfigReader
**Description:** As a developer, I want a documented schema-to-runtime audit so that contract mismatches are visible before code changes.

**Group:** B

**Acceptance Criteria:**
- [ ] Comparar `schemas/swingbuilder.schema.json` com consumo real em leitor de configuracao e templates.
- [ ] Registrar discrepancias com evidencia de arquivo e comportamento esperado.
- [ ] Produzir documento de auditoria com lista acionavel de ajustes.
- [ ] Lint/typecheck permanecem verdes.

### US-005: Corrigir suporte a hierarquia no schema
**Description:** As a config author, I want hierarchical structures to be explicitly supported and tested so that complex configs remain valid.

**Group:** B

**Acceptance Criteria:**
- [ ] Atualizar schema para representar hierarquias exigidas pelos requisitos.
- [ ] Adicionar testes de integracao com exemplos hierarquicos validos e invalidos.
- [ ] Garantir compatibilidade com consumo atual em runtime ou documentar quebra controlada.
- [ ] Lint/typecheck/testes de schema passam.

### US-006: Definir contrato oficial de scripts
**Description:** As a contributor, I want one official script contract so that build and verification commands are consistent across docs and CI.

**Group:** C

**Acceptance Criteria:**
- [ ] Registrar decisao arquitetural padronizando contrato em `build/verify`.
- [ ] Documentar trade-offs e estrategia de compatibilidade para comandos legados.
- [ ] Publicar documento de contrato em pasta de documentacao do projeto.
- [ ] Lint/typecheck permanecem verdes.

### US-007: Aplicar contrato de scripts no repositorio
**Description:** As a maintainer, I want package scripts and docs aligned with the chosen contract so that local and CI workflows are predictable.

**Group:** C

**Acceptance Criteria:**
- [ ] Atualizar `package.json` raiz com scripts coerentes ao contrato oficial.
- [ ] Ajustar referencias em README e tarefas relacionadas.
- [ ] Garantir que comandos principais de build/verificacao executem sem regressao.
- [ ] Lint/typecheck passam apos alteracoes.

### US-008: Publicar coverage artifacts no CI
**Description:** As a reviewer, I want coverage artifacts uploaded in CI so that quality evidence is available after every successful run.

**Group:** D

**Acceptance Criteria:**
- [ ] Atualizar workflow de testes para upload de `coverage/lcov-report` e `coverage/coverage-summary.json` em execucao bem-sucedida.
- [ ] Nome e local do artifact estao padronizados e documentados.
- [ ] Simulacao local/execucao de CI valida existencia dos artifacts esperados.
- [ ] Pipeline da branch de remediacao permanece verde.

### US-009: Backfill obrigatorio de notes historicos
**Description:** As a quality auditor, I want historical pass entries without notes to be backfilled so that previous approvals become traceable.

**Group:** E

**Acceptance Criteria:**
- [ ] Identificar entradas historicas com `passes=true` e `notes` ausente/vazio.
- [ ] Criar evidencias de backfill em estrutura dedicada da task com links before/after.
- [ ] Associar owner e status para cada item de backfill.
- [ ] Validacao automatica passa apos backfill.

### US-010: Reconciliar PRD vs implementacao
**Description:** As a tech lead, I want a reconciliation report so that every documented divergence has an owner and resolution path.

**Group:** E

**Acceptance Criteria:**
- [ ] Criar `reconciliation.md` com divergencias entre PRD e implementacao.
- [ ] Para cada divergencia, registrar decisao: corrigir codigo, corrigir doc ou aceitar excecao justificada.
- [ ] Definir owner e prazo para cada item em aberto.
- [ ] Nao restam divergencias criticas sem plano de resolucao.

## 4. Functional Requirements

- FR-1: O sistema deve prover um template padrao de evidencia minima reutilizavel para remediacoes (R1).
- FR-2: O documento de requisitos da remediacao deve conter exemplos de evidencia verificavel por finding (R1).
- FR-3: Deve existir validacao automatica que reprova entradas com `passes=true` e `notes` vazio (R3).
- FR-4: O projeto deve disponibilizar testes automatizados para o validador de `prd.json` com cenarios positivos e negativos (R3).
- FR-5: O schema principal deve refletir explicitamente as hierarquias exigidas e seu consumo em runtime (R4).
- FR-6: Devem existir testes de integracao de schema cobrindo hierarquia valida e invalida (R4).
- FR-7: O contrato oficial de scripts do repositorio deve ser padronizado em `build/verify` e documentado (R5).
- FR-8: Scripts e documentacao devem estar alinhados ao contrato oficial sem ambiguidade operacional (R5).
- FR-9: O workflow de CI deve publicar artifacts de cobertura com caminho e nomenclatura padronizados (R6).
- FR-10: A remediacao deve incluir backfill obrigatorio de historico para conformidade de rastreabilidade (R2/R3).
- FR-11: Deve existir relatorio de reconciliacao PRD vs implementacao com owner por divergencia (R2).
- FR-12: A conclusao da feature exige evidencia verificavel para 100% de CF-01..CF-06.

## 5. Non-Goals (Out of Scope)

- Remediar findings de prioridade media ou baixa fora de CF-01..CF-06.
- Introduzir novas funcionalidades de produto alem da remediacao dos findings.
- Refatoracoes amplas sem relacao direta com R1..R6.
- Troca de stack de CI, framework de testes ou arquitetura base do projeto.

## 6. Design Considerations

- Artefatos documentais devem usar estrutura simples em Markdown para leitura humana e auditoria rapida.
- Evidencias devem priorizar links de arquivo e saidas de comando reproduziveis.
- Nomenclaturas de arquivos de remediacao devem seguir padrao da task corrente para facilitar rastreio historico.

## 7. Technical Considerations

- Script de validacao deve ser executavel em ambiente local e CI sem dependencia proprietaria.
- Ajustes de schema devem preservar compatibilidade sempre que possivel; quebras exigem documentacao explicita.
- O contrato `build/verify` deve considerar alias de compatibilidade temporaria quando necessario para nao quebrar fluxos existentes.
- Upload de artifacts no CI deve respeitar limites de retention e tamanho configurados no provedor.

## 8. Success Metrics

- 100% dos findings CF-01..CF-06 fechados com evidencia verificavel e aprovada.
- 0 ocorrencias de `passes=true` sem `notes` apos adocao do validador.
- 100% das execucoes de CI bem-sucedidas publicam artifacts de cobertura esperados.
- 100% das divergencias criticas mapeadas em reconciliacao com owner e plano definido.
- Reducao do tempo de auditoria tecnica da task de remediacao (baseline interno) por maior padronizacao de evidencias.

## 9. Open Questions

- Qual janela de descontinuacao sera adotada para comandos legados apos padronizacao em `build/verify`?
- Qual formato final de ownership sera usado no backfill (apenas nome, ou nome + prazo + status)?
- Existe politica formal de retention para artifacts de cobertura que precise ser refletida na documentacao?

## Clarifying Answers Used

- Objetivo principal: entregar remediacao balanceada e completa de CF-01..CF-06.
- Escopo: execucao faseada por grupos dependentes.
- Contrato de scripts: padronizar em `build/verify`.
- Backfill/reconciliacao: obrigatorios no mesmo ciclo.
- Criterio de sucesso obrigatorio: 100% dos findings no escopo com evidencia verificavel.
