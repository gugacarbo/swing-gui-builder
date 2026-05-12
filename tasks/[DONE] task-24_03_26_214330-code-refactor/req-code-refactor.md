# Code Refactor

## Description

Refatoração completa da base de código para adherence aos princípios SOLID e design patterns, redução de duplicação, e arquivos com responsabilidades claras (target: < 300 linhas).

**Status:** Requirements gathering

## Decided Requirements

- [ ] Extrair predicados `is*Component` duplicados para `ComponentPredicates.ts` compartilhado
- [ ] Dividir `componentGenerators.ts` em geradores focados (menu, toolbar, component)
- [ ] Extrair `WebviewHtmlBuilder` de `CanvasPanel.ts`
- [ ] Criar `ListenerFactory` para geração de event listeners
- [ ] Adicionar interface `MergeStrategy` no merger
- [ ] Extrair `OutputDirectoryResolver` de `generateCommand.ts`
- [ ] Garantir todos os arquivos < 300 linhas
- [ ] Zero código duplicado em geradores

---

## Findings

### Files Over 250 Lines (Priority Targets)

| File                                   | Est. Lines | Main Issues                               |
| -------------------------------------- | ---------- | ----------------------------------------- |
| `src/parser/JavaParserUtils.ts`        | ~450       | Funções utilitárias demais (46 funções)   |
| `src/generator/componentGenerators.ts` | ~400       | 7 responsabilidades misturadas            |
| `src/canvas/CanvasPanel.ts`            | ~400       | Lifecycle UI + HTML generation misturados |
| `src/merger/JavaFileMerger.ts`         | ~400       | Merge strategies + file I/O misturados    |
| `src/parser/JavaParser.ts`             | ~400       | Parsing + symbol table management         |
| `src/generator/codeHelpers.ts`         | ~300       | Helpers duplicados de componentGenerators |
| `src/commands/generateCommand.ts`      | ~300       | File ops + business logic + UI misturados |

### Design Pattern Opportunities

| Pattern         | Location                 | Benefit                                                                |
| --------------- | ------------------------ | ---------------------------------------------------------------------- |
| Factory         | `componentGenerators.ts` | Substituir switch `getListenerCode` por `ListenerFactory.create(type)` |
| Strategy        | `JavaFileMerger.ts`      | Interface `MergeStrategy` para merge com/sem markers                   |
| Builder         | `generateCommand.ts`     | Construir `OutputConfig` step-by-step                                  |
| Template Method | `JavaGenerator.ts`       | Skeleton com hooks para componentes customizados                       |
| Observer        | `CanvasPanel.ts`         | Handlers registrados ao invés de switch statelick                      |

### Duplication Found

1. **Predicates `is*Component`** — existem em `componentGenerators.ts` E `codeHelpers.ts`
2. **Type-to-string logic** — `getComponentType()` duplicado
3. **Merge strategies** — `mergeWithMarkers` e `mergeWithoutMarkers` com estruturas quase idênticas

---

## Gaps & Risks

1. **Arquivos muito grandes** — 7 arquivos acima de 250 linhas, maior com 450
2. **Acoplamento forte** — `componentGenerators.ts` importa muitos módulos, diffs serão extensos
3. **Testes podem quebrar** — refatoração heavy vai precisar de updates nos testes existentes
4. **Sem testes para algumas funções** — gap de testabilidade antes de refatorar
5. **Imports precisarão ser re-ruteados** — pode causar breaking changes na API pública se houver

---

## Suggestions

### High Priority (Fase 1)

1. **Criar `src/utils/ComponentPredicates.ts`** — extrair todos os `is*Component` para arquivo único
2. **Dividir `componentGenerators.ts`:**
   - `MenuCodeGenerator.ts` — `generateMenuBar`, `generateMenuChildrenCode`
   - `ToolBarCodeGenerator.ts` — `generateToolBar`, `getToolBarBorderPosition`
   - `ComponentCodeGenerator.ts` — `generateComponentCode`, `sortRegularComponentsForGeneration`
3. **Extrair `WebviewHtmlBuilder.ts`** de `CanvasPanel.ts` — isolar `getHtmlForWebview`, `rewriteBundledHtml`

### Medium Priority (Fase 2)

4. **Criar `ListenerFactory`** — factory pattern para `getListenerCode`
5. **Adicionar `MergeStrategy` interface** em `JavaFileMerger.ts`
6. **Extrair `OutputDirectoryResolver.ts`** de `generateCommand.ts`

### Low Priority (Fase 3)

7. **Dividir `JavaParserUtils.ts`** em `CstUtils.ts` + `JavaTypeUtils.ts`
8. **Builder pattern** para `GeneratedFileWithPath`

---

## Stakeholder & Success Criteria

- **Stakeholder:** Time de desenvolvimento / auto-review
- **Success Criteria:**
  - Arquivos < 300 linhas
  - Responsabilidades claras por arquivo
  - Design patterns aplicados (Factory, Strategy, Observer)
  - Zero duplicação em geradores de código
  - Testes existentes passando após refatoração

---

## Research Permission

- ✅ Pesquisa no repositório realizada
- ⏸️ Pesquisa web não necessária por enquanto
