# PRD: Refatoração WebView-App

## Introduction

O `webview-app` atual possui arquivos com responsabilidades misturadas e código duplicado que dificultam manutenção e onboarding de novos desenvolvedores. Esta refatoração reorganiza a codebase extraindo lógica duplicada, dividindo arquivos grandes em módulos coesos e criando utilitários reutilizáveis.

**Resultado esperado:** Redução de ~30% no tamanho total do código com melhor separação de responsabilidades, facilitando manutenção futura e entendimento da arquitetura.

---

## Goals

- **Manutenibilidade:** Reduzir complexidade ciclomática através de hooks e utils especializados
- **Onboarding:** Facilitar entendimento da codebase com arquivos menores e responsabilidade única
- **Eliminar duplicação:** Consolidar padrões repetidos em componentes e hooks reutilizáveis
- **Manter funcionalidade:** Zero regressões no comportamento existente

---

## User Stories

### US-001: Criar constants.ts com limites e constraints

**Description:** Como desenvolvedor, quero constantes centralizadas para valores hardcoded (zoom limits, size constraints) para facilitar ajustes futuros.

**Acceptance Criteria:**

- [ ] Criar `webview-app/src/lib/constants.ts` com ~20 linhas
- [ ] Exportar: `ZOOM_MIN`, `ZOOM_MAX`, `ZOOM_DEFAULT`, `MIN_COMPONENT_SIZE`, `GRID_SIZE`
- [ ] Tipos TypeScript adequados para todas as constantes
- [ ] Typecheck passa (`pnpm build`)

---

### US-002: Criar componentDefaults.ts com mapeamentos

**Description:** Como desenvolvedor, quero mapeamentos de defaults de componentes extraídos em arquivo dedicado para evitar duplicação.

**Acceptance Criteria:**

- [ ] Criar `webview-app/src/lib/componentDefaults.ts` com ~60 linhas
- [ ] Exportar função `getDefaultProps(type: ComponentType): ComponentProps`
- [ ] Exportar função `getDefaultSize(type: ComponentType): { width, height }`
- [ ] Mapeamentos extraídos de `Canvas.tsx`
- [ ] Typecheck passa

---

### US-003: Criar geometry.ts com funções puras

**Description:** Como desenvolvedor, quero funções puras de cálculo geométrico em arquivo dedicado para reutilização e testabilidade.

**Acceptance Criteria:**

- [ ] Criar `webview-app/src/lib/geometry.ts` com ~50 linhas
- [ ] Exportar: `clamp()`, `snapToGrid()`, `calculateResize()`, `isPointInRect()`
- [ ] Funções puras sem side effects
- [ ] JSDoc em cada função explicando propósito
- [ ] Typecheck passa

---

### US-004: Criar hook useCanvasDragDrop

**Description:** Como desenvolvedor, quero lógica de drag&drop do canvas extraída em hook dedicado para reduzir complexidade de `Canvas.tsx`.

**Acceptance Criteria:**

- [ ] Criar `webview-app/src/hooks/useCanvasDragDrop.ts` com ~60 linhas
- [ ] Exportar: `{ handleDrop, handleDragOver, isDragging }`
- [ ] Usar `lib/componentDefaults.ts` para defaults
- [ ] Hook testável isoladamente
- [ ] Typecheck passa

---

### US-005: Criar hook useCanvasZoomPan

**Description:** Como desenvolvedor, quero lógica de zoom e pan do canvas extraída em hook dedicado para separação de responsabilidades.

**Acceptance Criteria:**

- [ ] Criar `webview-app/src/hooks/useCanvasZoomPan.ts` com ~80 linhas
- [ ] Exportar: `{ zoom, pan, handleWheel, handleZoomIn, handleZoomOut, handleResetView }`
- [ ] Usar `lib/constants.ts` para ZOOM_MIN, ZOOM_MAX
- [ ] Usar `lib/geometry.ts` para clamp
- [ ] Typecheck passa

---

### US-006: Criar hook useDragInteraction

**Description:** Como desenvolvedor, quero estado de move/resize extraído em hook dedicado para simplificar `CanvasComponent.tsx`.

**Acceptance Criteria:**

- [ ] Criar `webview-app/src/hooks/useDragInteraction.ts` com ~70 linhas
- [ ] Exportar: `{ isDragging, isResizing, handleMouseDown, handleMouseMove, handleMouseUp }`
- [ ] Usar `lib/geometry.ts` para calculateResize e snapToGrid
- [ ] Suportar ambos: move e resize (8 handles)
- [ ] Typecheck passa

---

### US-007: Criar hook useKeyboardShortcuts

**Description:** Como desenvolvedor, quero atalhos de teclado extraídos em hook dedicado para simplificar `App.tsx`.

**Acceptance Criteria:**

- [ ] Criar `webview-app/src/hooks/useKeyboardShortcuts.ts` com ~30 linhas
- [ ] Exportar: hook que registra listeners de Ctrl+Z (undo) e Ctrl+Y/Ctrl+Shift+Z (redo)
- [ ] Reutilizar `useUndoRedo.ts` existente
- [ ] Cleanup de listeners no unmount
- [ ] Typecheck passa

---

### US-008: Refatorar Canvas.tsx

**Description:** Como desenvolvedor, quero `Canvas.tsx` simplificado usando os novos hooks para facilitar leitura e manutenção.

**Acceptance Criteria:**

- [ ] Reduzir de 264 linhas para ~80 linhas (~70% de redução)
- [ ] Usar `useCanvasDragDrop` para drag&drop
- [ ] Usar `useCanvasZoomPan` para zoom/pan
- [ ] Importar constantes de `lib/constants.ts`
- [ ] Remover código duplicado movido para hooks/libs
- [ ] Typecheck passa
- [ ] Verificar no browser usando dev-browser skill

---

### US-009: Refatorar CanvasComponent.tsx

**Description:** Como desenvolvedor, quero `CanvasComponent.tsx` simplificado usando `useDragInteraction` para reduzir complexidade.

**Acceptance Criteria:**

- [ ] Reduzir de 193 linhas para ~100 linhas (~48% de redução)
- [ ] Usar `useDragInteraction` para estado de move/resize
- [ ] Usar `lib/geometry.ts` para cálculos
- [ ] Manter comportamento de 8 resize handles
- [ ] Typecheck passa
- [ ] Verificar no browser usando dev-browser skill: mover componente e redimensionar

---

### US-010: Criar FormField e field components

**Description:** Como desenvolvedor, quero componentes de formulário reutilizáveis para eliminar duplicação em `PropertiesPanel.tsx`.

**Acceptance Criteria:**

- [ ] Criar pasta `webview-app/src/components/PropertiesPanel/`
- [ ] Criar `FormField.tsx` genérico (~40 linhas) com label + wrapper
- [ ] Criar `NumberField.tsx` (~25 linhas) usando shadcn input
- [ ] Criar `ColorField.tsx` (~25 linhas) com picker
- [ ] Exportar barrel de `index.ts`
- [ ] Typecheck passa

---

### US-011: Refatorar PropertiesPanel.tsx

**Description:** Como desenvolvedor, quero `PropertiesPanel.tsx` simplificado usando os novos field components para eliminar código repetitivo.

**Acceptance Criteria:**

- [ ] Transformar `PropertiesPanel.tsx` em pasta com `index.tsx`
- [ ] Reduzir de 184 linhas para ~80 linhas (~57% de redução)
- [ ] Usar `FormField`, `NumberField`, `ColorField` criados
- [ ] Eliminar mapeamentos duplicados de propriedades
- [ ] Typecheck passa
- [ ] Verificar no browser usando dev-browser skill: editar propriedades de componente selecionado

---

### US-012: Refatorar App.tsx

**Description:** Como desenvolvedor, quero `App.tsx` simplificado usando `useKeyboardShortcuts` para reduzir código de efeitos.

**Acceptance Criteria:**

- [ ] Reduzir de 138 linhas para ~80 linhas (~42% de redução)
- [ ] Usar `useKeyboardShortcuts` para undo/redo
- [ ] Remover handlers/effects não necessários
- [ ] Typecheck passa
- [ ] Verificar no browser usando dev-browser skill: testar Ctrl+Z e Ctrl+Y

---

### US-013: Validação final e cleanup

**Description:** Como desenvolvedor, quero validar que toda refatoração está completa e código morto foi removido.

**Acceptance Criteria:**

- [ ] Atualizar todos os imports nos arquivos modificados
- [ ] Remover código morto (exports não utilizados, variáveis não usadas)
- [ ] `pnpm build` compila sem erros nem warnings
- [ ] Drag & drop de paleta funciona
- [ ] Zoom (scroll + botões) e pan funcionam
- [ ] Mover e resize componentes funcionam
- [ ] Undo/redo (Ctrl+Z/Y) funciona
- [ ] Propriedades sincronizam corretamente
- [ ] Geração de código Java funciona
- [ ] Verificar no browser usando dev-browser skill: fluxo completo de criação de UI

---

## Functional Requirements

### Extração de Código (Fase 1)

- **FR-1:** O sistema deve concentrar constantes numéricas (zoom, tamanho mínimo, grid) em `lib/constants.ts`
- **FR-2:** O sistema deve fornecer defaults de componentes via `lib/componentDefaults.ts`
- **FR-3:** O sistema deve fornecer funções geométricas puras via `lib/geometry.ts`

### Criação de Hooks (Fase 2)

- **FR-4:** O hook `useCanvasDragDrop` deve encapsular toda lógica de drop de componentes
- **FR-5:** O hook `useCanvasZoomPan` deve encapsular zoom via scroll e botões, e pan via drag
- **FR-6:** O hook `useDragInteraction` deve suportar resize nos 8 lados/cantos
- **FR-7:** O hook `useKeyboardShortcuts` deve registrar e limpar listeners adequadamente

### Refatoração de Componentes (Fase 3)

- **FR-8:** `Canvas.tsx` deve ter apenas renderização e orquestração, sem lógica inline
- **FR-9:** `CanvasComponent.tsx` não deve conter estado de drag diretamente
- **FR-10:** `PropertiesPanel` deve usar components de field reutilizáveis para cada tipo de propriedade
- **FR-11:** `App.tsx` não deve ter efeitos de teclado inline

### Validação (Fase 4)

- **FR-12:** Build de produção deve completar sem erros
- **FR-13:** Todas as funcionalidades existentes devem permanecer funcionando

---

## Non-Goals (Out of Scope)

- ❌ Adicionar novas funcionalidades ao builder
- ❌ Refatorar `types/` ou `schemas/` (são funcionais como estão)
- ❌ Extrair `ResizeHandles` como componente separado (manter inline)
- ❌ Adicionar testes automatizados (validação manual conforme plano)
- ❌ Otimizar performance de renderização
- ❌ Documentar API interna ou breaking changes
- ❌ Modificar estilos ou tema visual

---

## Design Considerations

### Estrutura de Arquivos Proposta

```
webview-app/src/
├── lib/
│   ├── constants.ts         (NOVO)
│   ├── componentDefaults.ts (NOVO)
│   ├── geometry.ts          (NOVO)
│   └── utils.ts             (existente)
├── hooks/
│   ├── useCanvasDragDrop.ts (NOVO)
│   ├── useCanvasZoomPan.ts  (NOVO)
│   ├── useDragInteraction.ts(NOVO)
│   ├── useKeyboardShortcuts.ts (NOVO)
│   ├── useCanvasState.ts    (existente)
│   ├── useExtensionListener.ts (existente)
│   ├── usePostMessage.ts    (existente)
│   └── useUndoRedo.ts       (existente)
└── components/
    ├── PropertiesPanel/
    │   ├── index.tsx        (NOVO, era PropertiesPanel.tsx)
    │   ├── FormField.tsx    (NOVO)
    │   ├── NumberField.tsx  (NOVO)
    │   └── ColorField.tsx   (NOVO)
    └── ... (outros existentes)
```

---

## Technical Considerations

### Dependências

- React 19 hooks patterns
- shadcn/ui components (Button, Input)
- Tailwind CSS para estilos

### Abordagem de Implementação

Fases podem ser executadas em paralelo seguindo dependências:
- **Fase 1 independente:** Pode começar imediatamente
- **Fase 2 depende de Fase 1:** Usa libs criadas
- **Fase 3 depende de Fase 2:** Pode ter arquivos em paralelo
- **Fase 4 final:** Após todas refatorações

### Redução de Linhas Esperada

| Arquivo                            | Antes | Depois | Redução  |
| ---------------------------------- | ----- | ------ | -------- |
| Canvas.tsx                         | 264   | ~80    | -70%     |
| CanvasComponent.tsx                | 193   | ~100   | -48%     |
| PropertiesPanel.tsx                | 184   | ~80    | -57%     |
| App.tsx                            | 138   | ~80    | -42%     |
| **Linhas movidas para libs/hooks** | -     | +310   | -        |
| **Net reduction**                  | 779   | ~620   | **~30%** |

---

## Success Metrics

1. **Código:** Redução de ~30% no total de linhas da webview-app
2. **Complexidade:** Arquivos com no máximo 100 linhas (exceto App.tsx pode ter até 120)
3. **Funcionalidade:** Zero regressões no fluxo de criação de UI Swing
4. **Build:** `pnpm build` sem erros nem warnings
5. **Validação manual:** Checklist completo de verificação passa

---

## Open Questions

1. ~~Como as fases devem ser implementadas?~~ **Resolvido: Em paralelo onde possível**
2. ~~Precisa de testes automatizados?~~ **Resolvido: Apenas validação manual**
3. ~~Documentar breaking changes?~~ **Resolvido: Não é necessário**

---

## Checklist de Validação Final

Antes de considerar completo:

- [ ] Todos os 4 novos arquivos em `lib/` criados
- [ ] Todos os 4 novos hooks criados
- [ ] PropertiesPanel transformado em pasta com field components
- [ ] Canvas.tsx refatorado usando novos hooks
- [ ] CanvasComponent.tsx refatorado usando useDragInteraction
- [ ] App.tsx refatorado usando useKeyboardShortcuts
- [ ] Build passa sem erros
- [ ] Fluxo completo testado manualmente
