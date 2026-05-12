# PRD: Code Refactor — SOLID Principles & Design Patterns

## Introduction

Refatoração completa da base de código para adherence aos princípios SOLID e design patterns, com extração de responsabilidades, redução de duplicação, e arquivos com ≤300 linhas. O objetivo é melhorar a manutenibilidade futura para devs internos e agentes de IA, aumentando a cobertura de testes para cada arquivo refatorado.

---

## Goals

- Extrair predicados `is*Component` duplicados para `ComponentPredicates.ts` compartilhado
- Dividir `componentGenerators.ts` em geradores focados (menu, toolbar, component)
- Extrair `WebviewHtmlBuilder` de `CanvasPanel.ts`
- Criar `ListenerFactory` para geração de event listeners (Factory Pattern)
- Adicionar interface `MergeStrategy` no merger (Strategy Pattern)
- Extrair `OutputDirectoryResolver` de `generateCommand.ts`
- Garantir todos os arquivos < 300 linhas
- Zero código duplicado em geradores
- Adicionar testes unitários para cada novo arquivo extraído

---

## User Stories

### US-001: Extrair ComponentPredicates.ts

**Description:** Como developer, quero extrair todos os predicados `is*Component` para um arquivo compartilhado para eliminar duplicação.

**Group:** A

**Acceptance Criteria:**
- [ ] Criar `src/utils/ComponentPredicates.ts`
- [ ] Mover `isButtonComponent`, `isTextFieldComponent`, `isLabelComponent`, `isComboBoxComponent`, `isListComponent`, `isTableComponent`, `isTreeComponent`, `isPanelComponent`, `isMenuComponent`, `isMenuItemComponent`, `isCheckBoxComponent`, `isRadioButtonComponent`, `isScrollPaneComponent`, `isToolBarComponent`, `isMenuBarComponent` para o novo arquivo
- [ ] Remover duplicatas de `componentGenerators.ts` e `codeHelpers.ts`
- [ ] Atualizar imports em todos os arquivos que usam predicados
- [ ] Typecheck passa
- [ ] Criar testes unitários para `ComponentPredicates.ts` (>80% cobertura)

---

### US-002: Dividir componentGenerators.ts em MenuCodeGenerator.ts

**Description:** Como developer, quero extrair lógica de geração de menu para `MenuCodeGenerator.ts` para separar responsabilidades.

**Group:** A

**Acceptance Criteria:**
- [ ] Criar `src/generator/MenuCodeGenerator.ts`
- [ ] Extrair `generateMenuBar` e `generateMenuChildrenCode` do `componentGenerators.ts`
- [ ] Reduzir `componentGenerators.ts` em ~100 linhas
- [ ] Atualizar imports em `generateCommand.ts`
- [ ] Typecheck passa
- [ ] Criar testes unitários para `MenuCodeGenerator.ts`

---

### US-003: Dividir componentGenerators.ts em ToolBarCodeGenerator.ts

**Description:** Como developer, quero extrair lógica de geração de toolbar para `ToolBarCodeGenerator.ts`.

**Group:** A

**Acceptance Criteria:**
- [ ] Criar `src/generator/ToolBarCodeGenerator.ts`
- [ ] Extrair `generateToolBar` e `getToolBarBorderPosition` do `componentGenerators.ts`
- [ ] Reduzir `componentGenerators.ts` em ~80 linhas
- [ ] Atualizar imports em `generateCommand.ts`
- [ ] Typecheck passa
- [ ] Criar testes unitários para `ToolBarCodeGenerator.ts`

---

### US-004: Dividir componentGenerators.ts em ComponentCodeGenerator.ts

**Description:** Como developer, quero extrair lógica de geração de componentes para `ComponentCodeGenerator.ts`.

**Group:** A

**Acceptance Criteria:**
- [ ] Criar `src/generator/ComponentCodeGenerator.ts`
- [ ] Extrair `generateComponentCode` e `sortRegularComponentsForGeneration` do `componentGenerators.ts`
- [ ] `componentGenerators.ts` deve ter < 200 linhas após extração
- [ ] Atualizar imports em `generateCommand.ts`
- [ ] Typecheck passa
- [ ] Criar testes unitários para `ComponentCodeGenerator.ts`

---

### US-005: Extrair WebviewHtmlBuilder de CanvasPanel.ts

**Description:** Como developer, quero extrair `WebviewHtmlBuilder` de `CanvasPanel.ts` para separar lógica de UI do lifecycle do panel.

**Group:** B

**Acceptance Criteria:**
- [ ] Criar `src/canvas/WebviewHtmlBuilder.ts`
- [ ] Extrair `getHtmlForWebview` e `rewriteBundledHtml` do `CanvasPanel.ts`
- [ ] `CanvasPanel.ts` deve ter < 300 linhas
- [ ] `WebviewHtmlBuilder` recebe dependências via constructor (testável)
- [ ] Typecheck passa
- [ ] Criar testes unitários para `WebviewHtmlBuilder.ts`

---

### US-006: Criar ListenerFactory com Factory Pattern

**Description:** Como developer, quero criar `ListenerFactory` para substituir o switch `getListenerCode` por uma factory testável.

**Group:** B

**Acceptance Criteria:**
- [ ] Criar `src/generator/ListenerFactory.ts`
- [ ] Implementar `create(type: ListenerType): string` que substitui switch em `getListenerCode`
- [ ] Criar `ListenerType` enum/string union para todos os tipos suportados
- [ ] Atualizar `ComponentCodeGenerator.ts` para usar `ListenerFactory`
- [ ] Typecheck passa
- [ ] Criar testes unitários para `ListenerFactory.ts`

---

### US-007: Adicionar MergeStrategy Interface em JavaFileMerger.ts

**Description:** Como developer, quero adicionar interface `MergeStrategy` para permitir estratégias de merge intercambiáveis.

**Group:** B

**Acceptance Criteria:**
- [ ] Criar `MergeStrategy` interface em `src/merger/MergeStrategy.ts`
- [ ] Extrair `mergeWithMarkers` e `mergeWithoutMarkers` para classes que implementam a interface
- [ ] `JavaFileMerger.ts` usa Strategy via injeção de dependência
- [ ] `JavaFileMerger.ts` < 300 linhas
- [ ] Typecheck passa
- [ ] Criar testes unitários para cada MergeStrategy

---

### US-008: Extrair OutputDirectoryResolver de generateCommand.ts

**Description:** Como developer, quero extrair `OutputDirectoryResolver` para separar lógica de resolução de caminhos.

**Group:** B

**Acceptance Criteria:**
- [ ] Criar `src/commands/OutputDirectoryResolver.ts`
- [ ] Extrair lógica de `generateCommand.ts` que resolve diretório de output
- [ ] `generateCommand.ts` < 300 linhas
- [ ] `OutputDirectoryResolver`.testável standalone
- [ ] Typecheck passa
- [ ] Criar testes unitários para `OutputDirectoryResolver.ts`

---

### US-009: Dividir JavaParserUtils.ts em CstUtils.ts e JavaTypeUtils.ts

**Description:** Como developer, quero dividir `JavaParserUtils.ts` para melhorar organização e testabilidade.

**Group:** C

**Acceptance Criteria:**
- [ ] Criar `src/parser/CstUtils.ts` — funções de manipulação de CST (Concrete Syntax Tree)
- [ ] Criar `src/parser/JavaTypeUtils.ts` — funções de análise de tipos Java
- [ ] `JavaParserUtils.ts` < 300 linhas (ou ser removido se vazio)
- [ ] Atualizar imports em `JavaParser.ts`
- [ ] Typecheck passa
- [ ] Criar testes unitários para `CstUtils.ts` e `JavaTypeUtils.ts`

---

### US-010: Verificar Cobertura Final e Typecheck

**Description:** Como developer, quero garantir que toda refatoração mantém funcionalidade e cobertura.

**Group:** C

**Acceptance Criteria:**
- [ ] `pnpm run typecheck` passa
- [ ] `pnpm test` passa (testes existentes + novos)
- [ ] Cobertura de testes > 80% para arquivos refatorados
- [ ] Nenhum arquivo em `src/` > 300 linhas
- [ ] Zero duplicação de código reportada pelo linter

---

## Functional Requirements

- FR-1: Criar `src/utils/ComponentPredicates.ts` com todos os predicados `is*Component`
- FR-2: Criar `src/generator/MenuCodeGenerator.ts` com `generateMenuBar` e `generateMenuChildrenCode`
- FR-3: Criar `src/generator/ToolBarCodeGenerator.ts` com `generateToolBar` e `getToolBarBorderPosition`
- FR-4: Criar `src/generator/ComponentCodeGenerator.ts` com `generateComponentCode` e `sortRegularComponentsForGeneration`
- FR-5: Criar `src/canvas/WebviewHtmlBuilder.ts` com `getHtmlForWebview` e `rewriteBundiedHtml`
- FR-6: Criar `src/generator/ListenerFactory.ts` com Factory Pattern para `getListenerCode`
- FR-7: Criar `src/merger/MergeStrategy.ts` interface com implementações `WithMarkersStrategy` e `WithoutMarkersStrategy`
- FR-8: Criar `src/commands/OutputDirectoryResolver.ts` para resolução de caminhos de output
- FR-9: Criar `src/parser/CstUtils.ts` e `src/parser/JavaTypeUtils.ts` (divisão de JavaParserUtils)
- FR-10: Todos os arquivos em `src/` devem ter < 300 linhas após refatoração
- FR-11: Zero duplicação de código em geradores (usar ESLint rules)

---

## Non-Goals

- Não refatorar a lógica de parsing do JavaParser.ts (apenas reorganizar imports)
- Não alterar a API pública dos generators (Backward Compatibility)
- Não adicionar novas features além da reorganização de código
- Não modificar o schema JSON ou configurações

---

## Design Patterns to Apply

| Pattern      | Where                                    | Implementation                        |
| ------------ | ---------------------------------------- | ------------------------------------- |
| Factory      | `ListenerFactory.ts`                     | `create(type) → string`               |
| Strategy     | `MergeStrategy.ts` + `JavaFileMerger.ts` | Interface com `WithMarkers`/`Without` |
| Builder      | `OutputDirectoryResolver.ts`             | Step-by-step construction             |
| Single Resp. | Todos os arquivos extraídos              | 1 responsabilidade por arquivo        |

---

## Technical Considerations

- Manter compatibilidade de imports — usar re-exports se necessário para não quebrar código existente
- Usar `export type { ... }` para tipos e interfaces públicas
- Seguir convenção de nomes do projeto: `PascalCase` para arquivos com classes, `camelCase` para utilitários
- Testes unitários com Vitest (framework já configurado no projeto)

---

## Success Metrics

- 100% dos arquivos em `src/` com < 300 linhas
- Cobertura de testes > 80% para módulos refatorados
- Zero duplicação de código (verificado por ESLint/BIOME)
- Typecheck e testes passando
- PRD executado via ralph-worker com todas as US completas

---

## Open Questions

- Nenhuma — todas as questões foram esclarecidas nas respostas.
