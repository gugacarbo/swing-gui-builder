# PRD: Automated Tests

## 1. Introducao/Overview

Este PRD define a implementacao de uma suite de testes automatizados para o projeto swing-gui-builder-vscode, cobrindo a extensao VS Code e o webview app. O objetivo e reduzir regressao nas funcionalidades criticas entregues em "fixes-and-improvements", estabelecendo uma base de testes unitarios e de integracao com execucao automatica em CI.

A meta inicial e atingir cobertura global entre 50% e 60%, com foco de 70% ou mais nas areas criticas (geracao Java e hooks centrais de canvas), sem ampliar escopo para E2E completo nesta fase.

## 2. Goals

- Estabelecer infraestrutura de testes para extensao (Node) e webview (jsdom).
- Cobrir regras criticas de geracao de codigo Java e mapeamentos Swing.
- Cobrir hooks centrais do webview responsaveis por estado, drag/drop e undo/redo.
- Validar fluxos de integracao mais sujeitos a regressao (package inference, panel filhos, geracao completa).
- Automatizar execucao de testes via GitHub Actions em push e pull request.
- Publicar cobertura de codigo e aplicar thresholds realistas para evolucao incremental.

## 3. User Stories

### US-001: Configurar Vitest na extensao
**Description:** Como desenvolvedor, eu quero configurar Vitest na raiz da extensao para executar testes de forma padronizada em ambiente Node.

**Group:** A

**Acceptance Criteria:**
- [ ] Existe arquivo `vitest.config.ts` na raiz com `environment: "node"`.
- [ ] A configuracao inclui `include: ["src/**/*.test.ts"]`.
- [ ] `@vitest/coverage-v8` esta declarado em devDependencies da raiz.
- [ ] Existem scripts `test`, `test:watch` e `test:coverage` no `package.json` da raiz.
- [ ] `pnpm test` na raiz executa sem erro de configuracao do Vitest.

### US-002: Configurar Vitest no webview app
**Description:** Como desenvolvedor, eu quero configurar Vitest no webview para testar hooks e logica React em ambiente jsdom.

**Group:** A

**Acceptance Criteria:**
- [ ] Existe `webview-app/vitest.config.ts` com `environment: "jsdom"`.
- [ ] A configuracao usa `setupFiles: ["./vitest.setup.ts"]`.
- [ ] A configuracao inclui `include: ["src/**/*.test.{ts,tsx}"]`.
- [ ] Existe alias `@/` apontando para `./src/` na configuracao de teste.
- [ ] `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` estao em devDependencies do webview.
- [ ] Scripts `test`, `test:watch` e `test:coverage` existem em `webview-app/package.json`.

### US-003: Preparar setup global de testes do webview
**Description:** Como desenvolvedor, eu quero um setup global para testes do webview para evitar repeticao de mocks e matchers.

**Group:** A

**Acceptance Criteria:**
- [ ] Existe `webview-app/vitest.setup.ts` importando `@testing-library/jest-dom`.
- [ ] `crypto.randomUUID()` e mockado no setup quando necessario para estabilidade.
- [ ] Os testes do webview executam sem erro de APIs globais ausentes.

### US-004: Testar utilitarios de geracao na extensao
**Description:** Como mantenedor, eu quero testes para utilitarios de geracao para detectar regressao em transformacoes basicas de codigo.

**Group:** B

**Acceptance Criteria:**
- [ ] Existe `src/generator/codeHelpers.test.ts` cobrindo `escapeJava`, `hexToRgb`, `supportsTextConstructor` e `isCustomComponent`.
- [ ] Existe `src/generator/swingMappings.test.ts` cobrindo `getSwingClass` e `getComponentSwingType`.
- [ ] Todos os cenarios de erro/edge relevantes para os utilitarios sao testados.
- [ ] Os novos testes passam em `pnpm test`.

### US-005: Testar JavaGenerator para package, subpastas e coordenadas relativas
**Description:** Como mantenedor, eu quero testar regras centrais do JavaGenerator para garantir geracao correta de codigo em cenarios reais de canvas.

**Group:** B

**Acceptance Criteria:**
- [ ] Existe `src/generator/JavaGenerator.package.test.ts` validando inferencia e propagacao de package.
- [ ] Existe `src/generator/JavaGenerator.subfolders.test.ts` validando geracao por parentId/subpastas.
- [ ] Existe `src/generator/JavaGenerator.relative-coords.test.ts` validando `setBounds` relativo para filhos de Panel.
- [ ] Os testes cobrem cenarios positivos e ao menos um edge case por regra critica.
- [ ] Os novos testes passam em `pnpm test`.

### US-006: Testar geradores de componentes com composicao
**Description:** Como mantenedor, eu quero validar geracao de componentes compostos para reduzir regressao em estruturas com hierarquia.

**Group:** B

**Acceptance Criteria:**
- [ ] Existe `src/generator/componentGenerators.test.ts` cobrindo `generateComponentCode` para Panel com filhos.
- [ ] O teste verifica ordem de geracao e estrutura esperada de codigo para composicao.
- [ ] O teste passa em execucao local e no pipeline.

### US-007: Testar defaults de componentes no webview
**Description:** Como desenvolvedor, eu quero validar defaults de props e tamanho para garantir criacao consistente de componentes no canvas.

**Group:** C

**Acceptance Criteria:**
- [ ] Existe `webview-app/src/lib/componentDefaults.test.ts` cobrindo `getDefaultProps`.
- [ ] O teste cobre `getDefaultSize` para tipos suportados.
- [ ] Existem assercoes para tipos conhecidos e comportamento esperado para entrada invalida/nao mapeada.
- [ ] Os testes passam em `pnpm --filter webview-app test`.

### US-008: Testar useCanvasDragDrop no webview
**Description:** Como desenvolvedor, eu quero testes de drag/drop para garantir criacao de componentes e snap correto em Panels.

**Group:** C

**Acceptance Criteria:**
- [ ] Existe `webview-app/src/hooks/useCanvasDragDrop.test.ts` cobrindo drop da palette e criacao de componente.
- [ ] O teste cobre snap para Panel e calculo de `parentOffset`.
- [ ] O teste cobre cenario fora de Panel sem vinculo indevido de parentId.
- [ ] Os testes passam em `pnpm --filter webview-app test`.

### US-009: Testar useCanvasState e useUndoRedo
**Description:** Como desenvolvedor, eu quero validar estado e historico de operacoes para evitar regressao em edicao do canvas.

**Group:** C

**Acceptance Criteria:**
- [ ] Existe `webview-app/src/hooks/useCanvasState.test.ts` cobrindo `addComponent`, `updateComponent`, `deleteComponent` e `selectComponent`.
- [ ] O mesmo arquivo cobre undo/redo dos principais fluxos.
- [ ] Existe `webview-app/src/hooks/useUndoRedo.test.ts` cobrindo `pushState`, `undo`, `redo`, `canUndo`, `canRedo`.
- [ ] Os testes passam em `pnpm --filter webview-app test`.

### US-010: Criar testes de integracao de geracao
**Description:** Como mantenedor, eu quero testes de integracao para validar fluxo fim a fim de dados de canvas para arquivos Java.

**Group:** D

**Acceptance Criteria:**
- [ ] Existe `src/integration/package-inference.test.ts` verificando consistencia entre preview e generate para package.
- [ ] Existe `src/integration/panel-children.test.ts` verificando subpasta e coordenadas relativas com Panel + filho.
- [ ] Existe `src/integration/full-generation.test.ts` verificando fluxo completo com estado complexo.
- [ ] Mocks necessarios de `detectJavaProject` e `getOutputDirectory` sao aplicados sem dependencia de VS Code real.
- [ ] Os testes de integracao passam em `pnpm test`.

### US-011: Automatizar testes no GitHub Actions
**Description:** Como equipe, eu quero pipeline CI de testes para bloquear regressao antes de merge.

**Group:** E

**Acceptance Criteria:**
- [ ] Existe workflow `.github/workflows/test.yml` disparado em push e pull request.
- [ ] O workflow faz checkout, setup de Node, setup de pnpm e instala dependencias.
- [ ] O workflow executa testes de todos os pacotes via comando recursivo.
- [ ] O workflow publica artefatos de cobertura.
- [ ] O tempo de execucao e monitoravel e sem falhas intermitentes recorrentes.

### US-012: Documentar testes, cobertura e status
**Description:** Como equipe, eu quero documentacao clara para rodar testes localmente e acompanhar cobertura no repositorio.

**Group:** F

**Acceptance Criteria:**
- [ ] README possui secao de Testing com comandos de execucao local.
- [ ] README exibe badge de status do workflow de testes.
- [ ] Existe `tasks/task-17_03_26_140000-automated-tests/coverage-report.md` com baseline e metas.
- [ ] Thresholds de cobertura foram configurados com meta inicial global de 50%.

## 4. Functional Requirements

- FR-1: O sistema deve permitir executar testes da extensao com Vitest em ambiente Node.
- FR-2: O sistema deve permitir executar testes do webview com Vitest em ambiente jsdom.
- FR-3: O sistema deve oferecer relatorio de cobertura via provider v8.
- FR-4: O sistema deve validar regras de utilitarios de geracao (`codeHelpers`, `swingMappings`).
- FR-5: O sistema deve validar regras do JavaGenerator para package inference.
- FR-6: O sistema deve validar regras do JavaGenerator para subpastas baseadas em hierarquia.
- FR-7: O sistema deve validar coordenadas relativas de componentes filhos em Panel.
- FR-8: O sistema deve validar geracao de codigo para composicao de componentes.
- FR-9: O sistema deve validar defaults de componentes no webview.
- FR-10: O sistema deve validar criacao por drag/drop e snap em Panel no webview.
- FR-11: O sistema deve validar operacoes de estado e historico (undo/redo) do canvas.
- FR-12: O sistema deve executar testes de integracao para fluxo canvas -> geracao Java.
- FR-13: O sistema deve executar testes em CI para push e pull request.
- FR-14: O sistema deve disponibilizar artefatos de cobertura no pipeline.
- FR-15: O sistema deve documentar comandos de teste e metas de cobertura para a equipe.

## 5. Non-Goals (Out of Scope)

- Nao incluir testes E2E com `@vscode/test-electron` nesta fase.
- Nao incluir testes de componentes visuais React (renderizacao detalhada de UI).
- Nao incluir Playwright ou suite de browser automation para webview nesta fase.
- Nao perseguir cobertura 90%+ nesta iteracao.
- Nao incluir snapshots de UI como requisito obrigatorio.

## 6. Design Considerations

- Priorizar testes de logica e comportamento sobre testes de implementacao interna.
- Reutilizar padroes dos testes ja existentes de `JavaGenerator` para manter consistencia.
- Evitar acoplamento dos testes a detalhes visuais da interface nesta fase.

## 7. Technical Considerations

- Necessidade de mocks para APIs de VS Code e APIs globais do browser (ex.: `crypto.randomUUID`).
- Uso de `vi.stubGlobal` e mocks isolados por suite para reduzir flaky tests.
- Divisao de ambiente Node (extensao) e jsdom (webview) para previsibilidade.
- Threshold inicial de cobertura deve ser realista para evitar bloqueio improdutivo do pipeline.
- Pipeline deve considerar cache de pnpm para reduzir tempo de CI.

## 8. Success Metrics

- `pnpm -r test` executa com sucesso sem falhas.
- Cobertura global minima de 50% no repositorio.
- Cobertura minima de 70% em arquivos criticos definidos (ex.: `JavaGenerator`, `useCanvasDragDrop`).
- Workflow de testes verde de forma consistente em push e pull request.
- Documentacao de testes suficiente para onboarding de novos contribuidores.

## 9. Open Questions

- Quais arquivos exatos entram oficialmente na lista de "criticos" para threshold de 70%?
- O upload de cobertura sera apenas artefato bruto ou tambem integrado a servico externo?
- A estrategia de jobs paralelos no GitHub Actions deve separar extensao e webview desde a primeira versao?
- Devemos incluir meta incremental por sprint para elevar cobertura acima de 60% apos estabilizacao inicial?
