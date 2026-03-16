# PRD: Codebase Refactoring

## Introduction

Refatoração estrutural do swing-gui-builder-vscode visando modularização, separação de responsabilidades e melhor manutenibilidade do código. O projeto atual apresenta problemas de código duplicado, responsabilidades múltiplas em arquivos grandes, e nomenclatura inconsistente entre extensão e webview.

## Goals

- Eliminar duplicação de tipos entre extension e webview-app
- Separar lógica de comandos do arquivo principal da extensão
- Modularizar componentes React grandes (Canvas.tsx, CanvasComponent.tsx)
- Padronizar nomenclatura e constantes em toda a codebase
- Manter backward compatibility durante a refatoração
- Preservar todas as funcionalidades existentes (comportamento inalterado)

## User Stories

### US-001: Criar pacote de tipos compartilhados
**Description:** Como desenvolvedor, preciso de tipos compartilhados entre extension e webview-app para eliminar duplicação e garantir consistência.

**Acceptance Criteria:**
- [ ] Criar diretório `shared/types/` na raiz do projeto
- [ ] Definir tipos únicos: `ComponentType`, `CanvasComponent`, `CanvasState`
- [ ] Executar typecheck sem erros
- [ ] Documentar tipos em comentário JSDoc

### US-002: Atualizar extension para usar shared types
**Description:** Como desenvolvedor, preciso que a extensão importe tipos do pacote compartilhado.

**Acceptance Criteria:**
- [ ] Remover definições duplicadas de `src/components/ComponentModel.ts`
- [ ] Importar tipos de `shared/types/canvas.ts`
- [ ] Executar typecheck na extensão
- [ ] Verificar que extension continua funcionando

### US-003: Atualizar webview-app para usar shared types
**Description:** Como desenvolvedor, preciso que o webview-app importe tipos do pacote compartilhado.

**Acceptance Criteria:**
- [ ] Remover definições duplicadas de `webview-app/src/types/canvas.ts`
- [ ] Importar tipos de `shared/types/canvas.ts`
- [ ] Configurar tsconfig path alias corretamente
- [ ] Executar typecheck no webview-app

### US-004: Configurar tsconfig paths
**Description:** Como desenvolvedor, preciso de path aliases configurados para importar de `@shared/types`.

**Acceptance Criteria:**
- [ ] Adicionar path alias em `tsconfig.json` (root)
- [ ] Adicionar path alias em `webview-app/tsconfig.json`
- [ ] Testar build da extensão
- [ ] Testar build do webview-app

### US-005: Extrair comando generate para arquivo dedicado
**Description:** Como desenvolvedor, preciso extrair a lógica de geração de código do extension.ts para um arquivo separado.

**Acceptance Criteria:**
- [ ] Criar arquivo `src/commands/generateCommand.ts`
- [ ] Mover lógica de `swingGuiBuilder.generate` para o novo arquivo
- [ ] Importar comando em `extension.ts`
- [ ] Executar comando generate manualmente e verificar funcionamento

### US-006: Extrair comando save para arquivo dedicado
**Description:** Como desenvolvedor, preciso extrair a lógica de salvamento do extension.ts para um arquivo separado.

**Acceptance Criteria:**
- [ ] Criar arquivo `src/commands/saveCommand.ts`
- [ ] Mover lógica de `swingGuiBuilder.save` para o novo arquivo
- [ ] Importar comando em `extension.ts`
- [ ] Executar comando save manualmente e verificar funcionamento

### US-007: Extrair comando open para arquivo dedicado
**Description:** Como desenvolvedor, preciso extrair a lógica de abertura do extension.ts para um arquivo separado.

**Acceptance Criteria:**
- [ ] Criar arquivo `src/commands/openCommand.ts`
- [ ] Mover lógica de `swingGuiBuilder.open` para o novo arquivo
- [ ] Importar comando em `extension.ts`
- [ ] Executar comando open manualmente e verificar funcionamento

### US-008: Refatorar extension.ts principal
**Description:** Como desenvolvedor, preciso que o extension.ts importe comandos separados e fique mais simples.

**Acceptance Criteria:**
- [ ] Simplificar `src/extension.ts` para apenas registrar comandos
- [ ] Remover lógica inline dos comandos
- [ ] Manter backward compatibility de imports
- [ ] Executar typecheck e testes existentes

### US-009: Extrair mapeamentos Swing do JavaGenerator
**Description:** Como desenvolvedor, preciso extrair mapeamentos de componentes Swing para arquivo dedicado.

**Acceptance Criteria:**
- [ ] Criar arquivo `src/generator/swingMappings.ts`
- [ ] Mover `SWING_CLASS_MAP`, `getSwingClass`, `getComponentSwingType`
- [ ] Importar em `JavaGenerator.ts`
- [ ] Executar testes de geração existentes

### US-010: Extrair helpers de código do JavaGenerator
**Description:** Como desenvolvedor, preciso extrair funções helper de formatação para arquivo dedicado.

**Acceptance Criteria:**
- [ ] Criar arquivo `src/generator/codeHelpers.ts`
- [ ] Mover `hexToRgb`, `capitalize`, `isCustomComponent` e outros helpers
- [ ] Importar em `JavaGenerator.ts`
- [ ] Executar testes existentes

### US-011: Extrair geradores específicos de componentes
**Description:** Como desenvolvedor, preciso extrair lógica de geração de componentes para arquivo dedicado.

**Acceptance Criteria:**
- [ ] Criar arquivo `src/generator/componentGenerators.ts`
- [ ] Mover `generateComponentCode`, `generateHierarchicalCode`
- [ ] Importar em `JavaGenerator.ts`
- [ ] Executar testes de paridade

### US-012: Extrair helpers de MenuBar/ToolBar do Canvas
**Description:** Como desenvolvedor, preciso extrair funções auxiliares de zonas fixas do Canvas.tsx.

**Acceptance Criteria:**
- [ ] Criar arquivo `webview-app/src/components/Canvas/fixedZoneHelpers.ts`
- [ ] Mover `normalizeToolBarPosition`, `getOrderedChildren`, `collectDescendantIds`, `getStackExtent`
- [ ] Importar em `Canvas.tsx`
- [ ] Verificar funcionamento em browser

### US-013: Extrair componente MenuBarZone
**Description:** Como desenvolvedor, preciso criar componente dedicado para renderizar menu bars.

**Acceptance Criteria:**
- [ ] Criar arquivo `webview-app/src/components/Canvas/MenuBarZone.tsx`
- [ ] Implementar componente para renderização de menu bars
- [ ] Importar em `Canvas.tsx`
- [ ] Verificar funcionamento em browser

### US-014: Extrair componente ToolBarZone
**Description:** Como desenvolvedor, preciso criar componente dedicado para renderizar tool bars.

**Acceptance Criteria:**
- [ ] Criar arquivo `webview-app/src/components/Canvas/ToolBarZone.tsx`
- [ ] Implementar componente para renderização de tool bars
- [ ] Importar em `Canvas.tsx`
- [ ] Verificar funcionamento em browser

### US-015: Extrair constantes do Canvas
**Description:** Como desenvolvedor, preciso extrair constantes do Canvas.tsx para arquivo dedicado.

**Acceptance Criteria:**
- [ ] Criar arquivo `webview-app/src/components/Canvas/constants.ts`
- [ ] Mover `FIXED_ZONE_*`, `MENU_BAR_*`, `TOOL_BAR_*`, `FRAME_TITLE_BAR_HEIGHT`
- [ ] Importar em Canvas.tsx e CanvasComponent.tsx
- [ ] Executar typecheck

### US-016: Refatorar Canvas.tsx principal
**Description:** Como desenvolvedor, preciso que o Canvas.tsx importe helpers e subcomponentes extraídos.

**Acceptance Criteria:**
- [ ] Simplificar `Canvas.tsx` com imports de helpers e subcomponentes
- [ ] Remover lógica inline de menu/tool bars
- [ ] Executar typecheck
- [ ] Verificar funcionamento em browser

### US-017: Extrair constantes de tamanho mínimo do CanvasComponent
**Description:** Como desenvolvedor, preciso extrair constantes de tamanho mínimo do CanvasComponent.tsx.

**Acceptance Criteria:**
- [ ] Criar arquivo `webview-app/src/components/CanvasComponent/minSizes.ts`
- [ ] Mover `MIN_SIZE_BY_TYPE`, `FALLBACK_MIN_SIZE`
- [ ] Importar em `CanvasComponent.tsx`
- [ ] Executar typecheck

### US-018: Extrair renderizadores de preview
**Description:** Como desenvolvedor, preciso extrair lógica de renderização de preview para arquivo dedicado.

**Acceptance Criteria:**
- [ ] Criar arquivo `webview-app/src/components/CanvasComponent/previewRenderers.tsx`
- [ ] Mover `renderComponentPreview` e lógica de cada tipo
- [ ] Importar em `CanvasComponent.tsx`
- [ ] Verificar funcionamento em browser

### US-019: Extrair handles de resize
**Description:** Como desenvolvedor, preciso extrair lógica de handles de redimensionamento.

**Acceptance Criteria:**
- [ ] Criar arquivo `webview-app/src/components/CanvasComponent/resizeHandles.tsx`
- [ ] Mover `RESIZE_HANDLES` e lógica de renderização
- [ ] Importar em `CanvasComponent.tsx`
- [ ] Verificar funcionamento em browser

### US-020: Refatorar CanvasComponent.tsx principal
**Description:** Como desenvolvedor, preciso que o CanvasComponent.tsx importe módulos extraídos.

**Acceptance Criteria:**
- [ ] Simplificar `CanvasComponent.tsx` com imports de módulos
- [ ] Remover lógica inline de renderização
- [ ] Executar typecheck
- [ ] Verificar funcionamento em browser

### US-021: Consolidar constantes centralizadas
**Description:** Como desenvolvedor, preciso de constantes centralizadas com prefixos padronizados.

**Acceptance Criteria:**
- [ ] Criar/expandir `webview-app/src/lib/constants.ts`
- [ ] Adicionar prefixos padronizados (`DEFAULT_BG`, `DEFAULT_TEXT_COLOR`)
- [ ] Atualizar imports em todos os componentes
- [ ] Executar typecheck

### US-022: Criar mapeamentos de tipos Swing
**Description:** Como desenvolvedor, preciso de mapeamento centralizado de labels de tipos Swing.

**Acceptance Criteria:**
- [ ] Criar arquivo `webview-app/src/lib/swingTypeLabels.ts`
- [ ] Mover `SWING_TYPE_LABELS` do HierarchyPanel
- [ ] Atualizar imports em Palette.tsx, HierarchyPanel.tsx
- [ ] Executar typecheck

### US-023: Executar testes de validação por fase
**Description:** Como desenvolvedor, preciso validar que testes passam após cada fase de refatoração.

**Acceptance Criteria:**
- [ ] Executar testes de paridade (`JavaGenerator.parity.test.ts`)
- [ ] Executar testes de ordering (`JavaGenerator.ordering.test.ts`)
- [ ] Corrigir regressions identificadas
- [ ] Documentar resultados de testes

### US-024: Testar funcionalidade completa da extensão
**Description:** Como desenvolvedor, preciso testar o fluxo completo após refatoração.

**Acceptance Criteria:**
- [ ] Testar abrir canvas
- [ ] Testar adicionar componentes
- [ ] Testar geração de código
- [ ] Testar salvamento de projeto
- [ ] Documentar resultados

### US-025: Limpar imports não utilizados
**Description:** Como desenvolvedor, preciso remover imports órfãos após refatoração.

**Acceptance Criteria:**
- [ ] Identificar imports não utilizados
- [ ] Remover imports órfãos
- [ ] Executar lint sem warnings

### US-026: Documentar estrutura final
**Description:** Como desenvolvedor, preciso de documentação da nova estrutura de pastas.

**Acceptance Criteria:**
- [ ] Criar arquivo `docs/architecture.md`
- [ ] Documentar nova estrutura de pastas
- [ ] Documentar convenções adotadas
- [ ] Incluir diagrama de arquitetura

## Functional Requirements

- FR-1: Criar diretório `shared/types/` com tipos compartilhados
- FR-2: Configurar path aliases em tsconfig.json para `@shared/types`
- FR-3: Extrair comandos generate, save, open para `src/commands/`
- FR-4: Extrair mapeamentos Swing para `src/generator/swingMappings.ts`
- FR-5: Extrair helpers de código para `src/generator/codeHelpers.ts`
- FR-6: Extrair geradores de componentes para `src/generator/componentGenerators.ts`
- FR-7: Criar subcomponentes MenuBarZone e ToolBarZone em `webview-app/src/components/Canvas/`
- FR-8: Extrair helpers de zonas fixas para `fixedZoneHelpers.ts`
- FR-9: Extrair constantes de Canvas para arquivo dedicado
- FR-10: Criar subcomponentes em `webview-app/src/components/CanvasComponent/`
- FR-11: Consolidar constantes em `webview-app/src/lib/constants.ts`
- FR-12: Criar mapeamentos de labels em `webview-app/src/lib/swingTypeLabels.ts`
- FR-13: Executar testes existentes após cada fase
- FR-14: Criar documentação de arquitetura em `docs/architecture.md`

## Non-Goals

- Não adicionar novas funcionalidades durante a refatoração
- Não refatorar testes existentes
- Não alterar o sistema de build atual
- Não modificar o schema do JSON de configuração
- Não adicionar novos componentes Swing

## Design Considerations

### Estrutura de Pastas Proposta

```
swing-gui-builder-vscode/
├── shared/
│   └── types/
│       └── canvas.ts          # Tipos compartilhados
├── src/
│   ├── commands/              # NOVO: Comandos separados
│   │   ├── generateCommand.ts
│   │   ├── saveCommand.ts
│   │   ├── openCommand.ts
│   │   └── index.ts
│   ├── generator/
│   │   ├── JavaGenerator.ts   # Principal (simplificado)
│   │   ├── swingMappings.ts   # NOVO
│   │   ├── codeHelpers.ts     # NOVO
│   │   └── index.ts           # NOVO
│   └── ...
├── webview-app/src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── MenuBarZone.tsx    # NOVO
│   │   │   ├── ToolBarZone.tsx    # NOVO
│   │   │   ├── fixedZoneHelpers.ts # NOVO
│   │   │   ├── constants.ts       # NOVO
│   │   │   └── index.ts           # NOVO
│   │   ├── CanvasComponent/
│   │   │   ├── CanvasComponent.tsx
│   │   │   ├── minSizes.ts        # NOVO
│   │   │   ├── previewRenderers.tsx # NOVO
│   │   │   ├── resizeHandles.tsx  # NOVO
│   │   │   └── index.ts           # NOVO
│   │   └── index.ts               # NOVO
│   ├── lib/
│   │   ├── constants.ts           # Expandido
│   │   └── swingTypeLabels.ts     # NOVO
│   └── types/
│       └── index.ts               # NOVO
└── docs/
    └── architecture.md            # NOVO
```

### Convenções de Nomenclatura

- Constantes com prefixos: `SWING_`, `DEFAULT_`, `FIXED_ZONE_`
- Arquivos de comandos: `*Command.ts`
- Arquivos de helpers: `*Helpers.ts` ou `*Helpers.tsx`
- Arquivos de constantes: `constants.ts`

## Technical Considerations

- Usar path aliases para imports absolutos (`@shared/types`, `@/components`)
- Manter reexports para backward compatibility
- Commits granulares (um por step) para facilitar rollback
- Fase 1 (shared types) é foundation para todas as outras fases
- Fases 2 e 3 podem ser executadas em paralelo após Fase 1

## Success Metrics

- Eliminação de 100+ linhas de código duplicado
- Redução de complexidade em arquivos grandes (Canvas.tsx, CanvasComponent.tsx)
- Typecheck passa em 100% dos arquivos
- Todos os testes existentes passam
- Fluxo completo (open → add → generate → save) funciona corretamente
- Tempo de build não aumenta significativamente

## Open Questions

- Barrel exports (index.ts) devem ser criados em cada diretório?
- Devemos migrar para modules (ESM) na extensão?
- Prefere manter testes na mesma estrutura ou mover para diretório separado?
