# Plan: Codebase Refactoring

Refatoração estrutural do swing-gui-builder-vscode visando modularização, separação de responsabilidades e melhor manutenibilidade do código.

---

## 📊 Estado Atual (Baseline)

### O que já existe

| Camada    | Arquivo                                           | Status      | Linhas (~) | Observações                                  |
| --------- | ------------------------------------------------- | ----------- | ---------- | -------------------------------------------- |
| Extension | `src/extension.ts`                                | ⚠️ Grande    | 160        | Múltiplos comandos inline, lógica de arquivo |
| Extension | `src/canvas/CanvasPanel.ts`                       | ⚠️ Médio     | 150        | Gerencia webview + mensagens                 |
| Extension | `src/components/ComponentModel.ts`                | ⚠️ Duplicado | 60         | Tipos duplicados com webview-app             |
| Extension | `src/generator/JavaGenerator.ts`                  | ⚠️ Grande    | 300+       | Geração + mapeamentos + helpers              |
| Extension | `src/config/ConfigReader.ts`                      | ⚠️ Médio     | 100        | Config + validação + defaults                |
| Webview   | `webview-app/src/App.tsx`                         | ✅ OK        | 150        | Bem estruturado com hooks                    |
| Webview   | `webview-app/src/components/Canvas.tsx`           | ⚠️ Grande    | 250        | Zoom, pan, drag/drop, fixed zones            |
| Webview   | `webview-app/src/components/CanvasComponent.tsx`  | ⚠️ Grande    | 350        | Render de todos os tipos                     |
| Webview   | `webview-app/src/components/HierarchyPanel.tsx`   | ✅ OK        | 200        | Bem modular                                  |
| Webview   | `webview-app/src/components/Palette.tsx`          | ✅ OK        | 120        | Componente focado                            |
| Webview   | `webview-app/src/components/PropertiesPanel/`     | ✅ OK        | -          | Já modularizado                              |
| Webview   | `webview-app/src/components/PreviewCodeModal.tsx` | ⚠️ Médio     | 200        | Lógica de árvore inline                      |
| Webview   | `webview-app/src/hooks/`                          | ✅ OK        | -          | 9 hooks bem separados                        |
| Webview   | `webview-app/src/types/canvas.ts`                 | ⚠️ Duplicado | 75         | Tipos duplicados com extension               |
| Webview   | `webview-app/src/lib/`                            | ✅ OK        | -          | Utils e constantes separadas                 |

### Gaps identificados

1. **Duplicação de tipos** - `ComponentModel.ts` (extension) e `canvas.ts` (webview) definem tipos quase idênticos
2. **Responsabilidades múltiplas em Canvas.tsx** - Gerencia zoom, pan, drag/drop, menu bars, toolbars
3. **Comandos inline em extension.ts** - Lógica de generate/save/open acoplada
4. **Constantes espalhadas** - `DEFAULT_*` em múltiplos arquivos
5. **Nomenclatura inconsistente** - `ComponentModel` vs `CanvasComponent`

---

## Scope

### In Scope
- ✅ Extrair tipos compartilhados para pacote shared
- ✅ Separar lógica de comandos do extension.ts
- ✅ Modularizar Canvas.tsx em componentes menores
- ✅ Extrair funções helper de JavaGenerator.ts
- ✅ Padronizar nomenclatura e constantes
- ✅ Prefixos de constantes (SWING_, DEFAULT_, etc.)

### Out of Scope
- ❌ Mudanças de funcionalidade (behavior deve permanecer igual)
- ❌ Adição de novos componentes Swing
- ❌ Refatoração de testes (manter como estão)
- ❌ Mudanças no sistema de build

---

## Steps

### Fase 1: Shared Types (Foundation)

#### Step 1.1 - Criar pacote shared/types
- **Arquivo:** `shared/types/canvas.ts` (novo)
- **Ação:** Criar diretório `shared/` na raiz com definição única de tipos (`ComponentType`, `CanvasComponent`, `CanvasState`)
- **Dependência:** nenhum

#### Step 1.2 - Atualizar extension para usar shared types
- **Arquivo:** `src/components/ComponentModel.ts`
- **Ação:** Importar de `shared/types/canvas.ts` e remover definições duplicadas
- **Dependência:** step 1.1

#### Step 1.3 - Atualizar webview-app para usar shared types
- **Arquivo:** `webview-app/src/types/canvas.ts`
- **Ação:** Importar de `shared/types/canvas.ts` e remover duplicações
- **Dependência:** step 1.1

#### Step 1.4 - Configurar tsconfig paths
- **Arquivo:** `tsconfig.json`, `webview-app/tsconfig.json`
- **Ação:** Adicionar path alias para `@shared/types`
- **Dependência:** step 1.1

---

### Fase 2: Extension Commands (Separation)

#### Step 2.1 - Extrair comando generate
- **Arquivo:** `src/commands/generateCommand.ts` (novo)
- **Ação:** Mover lógica de `swingGuiBuilder.generate` para arquivo dedicado
- **Dependência:** step 1.2

#### Step 2.2 - Extrair comando save
- **Arquivo:** `src/commands/saveCommand.ts` (novo)
- **Ação:** Mover lógica de `swingGuiBuilder.save` para arquivo dedicado
- **Dependência:** step 1.2

#### Step 2.3 - Extrair comando open
- **Arquivo:** `src/commands/openCommand.ts` (novo)
- **Ação:** Mover lógica de `swingGuiBuilder.open` para arquivo dedicado
- **Dependência:** step 1.2

#### Step 2.4 - Refatorar extension.ts
- **Arquivo:** `src/extension.ts`
- **Ação:** Importar comandos de `./commands` e simplificar arquivo principal
- **Dependência:** steps 2.1, 2.2, 2.3

---

### Fase 3: JavaGenerator Modularization

#### Step 3.1 - Extrair mapeamentos Swing
- **Arquivo:** `src/generator/swingMappings.ts` (novo)
- **Ação:** Mover `SWING_CLASS_MAP` e funções `getSwingClass`, `getComponentSwingType`
- **Dependência:** step 1.2

#### Step 3.2 - Extrair helpers de código
- **Arquivo:** `src/generator/codeHelpers.ts` (novo)
- **Ação:** Mover `hexToRgb`, `capitalize`, `isCustomComponent`, helpers de formatação
- **Dependência:** nenhum

#### Step 3.3 - Extrair geradores específicos
- **Arquivo:** `src/generator/componentGenerators.ts` (novo)
- **Ação:** Funções `generateComponentCode`, `generateHierarchicalCode`
- **Dependência:** steps 3.1, 3.2

---

### Fase 4: Canvas.tsx Modularization

#### Step 4.1 - Extrair helpers de MenuBar/ToolBar
- **Arquivo:** `webview-app/src/components/Canvas/fixedZoneHelpers.ts` (novo)
- **Ação:** Mover `normalizeToolBarPosition`, `getOrderedChildren`, `collectDescendantIds`, `getStackExtent`
- **Dependência:** step 1.3

#### Step 4.2 - Extrair componente MenuBarZone
- **Arquivo:** `webview-app/src/components/Canvas/MenuBarZone.tsx` (novo)
- **Ação:** Componente dedicado para renderizar menu bars
- **Dependência:** step 4.1

#### Step 4.3 - Extrair componente ToolBarZone
- **Arquivo:** `webview-app/src/components/Canvas/ToolBarZone.tsx` (novo)
- **Ação:** Componente dedicado para renderizar tool bars
- **Dependência:** step 4.1

#### Step 4.4 - Extrair constantes de Canvas
- **Arquivo:** `webview-app/src/components/Canvas/constants.ts` (novo)
- **Ação:** Mover `FIXED_ZONE_*`, `MENU_BAR_*`, `TOOL_BAR_*`, `FRAME_TITLE_BAR_HEIGHT`
- **Dependência:** nenhum

#### Step 4.5 - Refatorar Canvas.tsx principal
- **Arquivo:** `webview-app/src/components/Canvas.tsx`
- **Ação:** Importar helpers e subcomponentes, simplificar componente principal
- **Dependência:** steps 4.1, 4.2, 4.3, 4.4


---

### Fase 5: CanvasComponent Modularization

#### Step 5.1 - Extrair constantes de tamanho mínimo
- **Arquivo:** `webview-app/src/components/CanvasComponent/minSizes.ts` (novo)
- **Ação:** Mover `MIN_SIZE_BY_TYPE`, `FALLBACK_MIN_SIZE`
- **Dependência:** nenhum

#### Step 5.2 - Extrair renderizadores de preview
- **Arquivo:** `webview-app/src/components/CanvasComponent/previewRenderers.tsx` (novo)
- **Ação:** Mover `renderComponentPreview` e lógica de cada tipo
- **Dependência:** step 5.1

#### Step 5.3 - Extrair handles de resize
- **Arquivo:** `webview-app/src/components/CanvasComponent/resizeHandles.tsx` (novo)
- **Ação:** Mover `RESIZE_HANDLES` e lógica de renderização
- **Dependência:** nenhum

#### Step 5.4 - Refatorar CanvasComponent.tsx principal
- **Arquivo:** `webview-app/src/components/CanvasComponent.tsx`
- **Ação:** Importar helpers extraídos, simplificar componente
- **Dependência:** steps 5.1, 5.2, 5.3

---

### Fase 6: Constants & Naming Standardization

#### Step 6.1 - Criar constantes centralizadas
- **Arquivo:** `webview-app/src/lib/constants.ts`
- **Ação:** Consolidar todas as constantes com prefixos padronizados (`DEFAULT_BG`, `DEFAULT_TEXT_COLOR`)
- **Dependência:** nenhum

#### Step 6.2 - Criar mapeamentos de tipos Swing
- **Arquivo:** `webview-app/src/lib/swingTypeLabels.ts`
- **Ação:** Mover `SWING_TYPE_LABELS` de HierarchyPanel e centralizar
- **Dependência:** nenhum

#### Step 6.3 - Atualizar imports dos componentes
- **Arquivo:** Múltiplos (Palette.tsx, HierarchyPanel.tsx, Canvas.tsx)
- **Ação:** Importar constantes de `@/lib/constants` e `@/lib/swingTypeLabels`
- **Dependência:** steps 6.1, 6.2

---

### Fase 7: Validation & Cleanup

#### Step 7.1 - Executar testes existentes
- **Arquivo:** `src/generator/*.test.ts`
- **Ação:** Validar que testes de paridade e ordering ainda passam
- **Dependência:** todas as fases anteriores

#### Step 8.2 - Verificar funcionamento da extensão
- **Arquivo:** N/A (manual)
- **Ação:** Testar fluxo completo: open canvas, add components, generate, save
- **Dependência:** step 8.1

#### Step 8.3 - Limpar imports não utilizados
- **Arquivo:** Múltiplos
- **Ação:** Remover imports órfãos após refatoração
- **Dependência:** step 8.2

#### Step 8.4 - Documentar estrutura final
- **Arquivo:** `docs/architecture.md` (novo)
- **Ação:** Documentar nova estrutura de pastas e convenções
- **Dependência:** step 8.3

---

## ⚠️ Riscos e Mitigações

| Risco                                  | Probabilidade | Impacto | Mitigação                                               |
| -------------------------------------- | ------------- | ------- | ------------------------------------------------------- |
| Quebrar testes existentes              | Média         | Alto    | Executar testes após cada fase; commits granulares      |
| Imports circulares                     | Média         | Médio   | Usar barrel exports com cuidado; verificar dependências |
| Divergência de tipos extension/webview | Baixa         | Alto    | Shared types eliminam duplicação                        |
| Regressão de funcionalidade            | Média         | Alto    | Teste manual após cada fase                             |
| Problemas de path alias                | Baixa         | Baixo   | Configurar tsconfigs adequadamente; testar build        |

---

## 📈 Estimativas de Complexidade

| Fase                                   | Complexidade | Tempo Estimado |
| -------------------------------------- | ------------ | -------------- |
| Fase 1: Shared Types                   | Média        | 2h             |
| Fase 2: Extension Commands             | Baixa        | 1.5h           |
| Fase 3: JavaGenerator                  | Média        | 2h             |
| Fase 4: Canvas Modularization          | Alta         | 3h             |
| Fase 5: CanvasComponent Modularization | Alta         | 2.5h           |
| Fase 6: Constants & Naming             | Baixa        | 1h             |
| Fase 7: Barrel Exports                 | Baixa        | 0.5h           |
| Fase 8: Validation                     | Média        | 1.5h           |
| **Total**                              |              | **~14h**       |

---

## 📝 Notas

- **Commits granulares:** Cada step deve ser um commit separado para facilitar rollback
- **Ordem de execução:** Fases 1-3 são foundation, obrigatórias antes de 4-7
- **Paralelismo:** Fases 2 e 3 podem ser executadas em paralelo após Fase 1
- **Testes:** Não adicionar novos testes durante refatoração (escopo diferente)
- **Backward compatibility:** Imports antigos devem continuar funcionando via reexports

---

## 📂 Estrutura de Pastas Proposta

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
│   ├── hooks/
│   │   └── index.ts               # NOVO
│   ├── lib/
│   │   ├── constants.ts           # Expandido
│   │   ├── swingTypeLabels.ts     # NOVO
│   │   └── index.ts               # NOVO
│   └── types/
│       └── index.ts               # NOVO
└── docs/
    └── architecture.md            # NOVO
```
