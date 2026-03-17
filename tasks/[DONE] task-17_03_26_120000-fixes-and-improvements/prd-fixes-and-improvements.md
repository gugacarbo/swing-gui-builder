# PRD: Fixes and Improvements

Quatro mudanças principais no Swing GUI Builder: correção da declaração de package no preview, estrutura de pastas organizada por containers, coordenadas relativas para filhos de Panel, e refatoração completa do layout da sidebar do webview.

---

## Introdução

Este PRD consolida quatro melhorias identificadas como necessárias para melhorar a experiência de uso e a corretude do código gerado:

1. **Package Declaration:** O preview de código não usa a mesma lógica de inferência de package que o comando generate
2. **Estrutura de Pastas:** Componentes gerados são todos salvos na raiz, sem organização hierárquica
3. **Coordenadas Relativas:** Filhos dePanel são renderizados com coordenadas absolutas, quebrando ao mover o panel
4. **Layout Sidebar:** Layout fixo com `max-h-[45%]` quebra scroll e colapso individual

---

## Goals

- Garantir que preview e generate usem a mesma lógica de inferência de package
- Criar subpastas automáticas para containers com filhos (ex: `output/MainPanel/Button.java`)
- Calcular coordenadas relativas para filhos de Panel no canvas e no código gerado
- Implementar snap automático quando componente é arrastado para dentro de Panel
- Refatorar sidebar com Hierarchy em cima e Palette em baixo, ambos colapsáveis e scrolláveis independentemente
- Garantir que apenas Canvas seja móvel (zoom/pan), resto da UI fixo

---

## User Stories

### US-001: Estender CanvasComponent com parentOffset
**Description:** Como desenvolvedor, preciso que o tipo `CanvasComponent` suporte coordenadas relativas ao pai para que filhos de Panel sejam posicionados corretamente.

**Group:** A

**Acceptance Criteria:**
- [ ] Adicionar campo opcional `parentOffset?: { x: number; y: number }` em `shared/types/canvas.ts`
- [ ] Campo é opcional (undefined = coordenadas absolutas)
- [ ] Typecheck passa

---

### US-002: Criar tipo GeneratedFileWithPath
**Description:** Como desenvolvedor, preciso de um tipo que represente arquivos gerados com subpastas para organizar a saída.

**Group:** A

**Acceptance Criteria:**
- [ ] Adicionar interface `GeneratedFileWithPath` em `src/generator/JavaGenerator.ts`
- [ ] Interface contém `fileName: string`, `content: string`, `subfolder?: string`
- [ ] Typecheck passa

---

### US-003: Criar componente Sidebar
**Description:** Como usuário, preciso de uma sidebar organizada com Hierarchy em cima e Palette em baixo, ambos colapsáveis.

**Group:** A

**Acceptance Criteria:**
- [ ] Criar `webview-app/src/components/Sidebar.tsx`
- [ ] Componente contém HierarchyPanel (topo) e Palette (baixo)
- [ ] Cada painel tem botão de colapso individual
- [ ] Cada painel tem scroll interno independente
- [ ] Typecheck passa
- [ ] Verificar no navegador: sidebar renderiza corretamente com dois painéis

---

### US-004: Passar package no preview code
**Description:** Como usuário, quero que o preview de código use a mesma declaração de package que o comando generate.

**Group:** B

**Acceptance Criteria:**
- [ ] Importar `getOutputDirectory` e `detectJavaProject` em `previewCodeCommand.ts`
- [ ] Inferir package usando lógica idêntica ao `generateCommand`
- [ ] Passar package para `generatePreviewJavaFiles`
- [ ] Preview mostra package correto (ex: `package com.example.app;`)
- [ ] Typecheck passa
- [ ] Verificar no navegador: abrir preview e confirmar package statement correto

---

### US-005: Modificar gerador para retornar subfolder
**Description:** Como desenvolvedor, preciso que o gerador Java indique em qual subpasta cada arquivo deve ser salvo.

**Group:** B

**Acceptance Criteria:**
- [ ] `generateJavaFiles` retorna `GeneratedFileWithPath[]`
- [ ] Função `getParentFolder(comp, allComponents)` retorna nome do pai ou undefined
- [ ] Componentes com pai recebem `subfolder = parentName`
- [ ] Manter compatibilidade: arquivos sem pai têm `subfolder` undefined
- [ ] Typecheck passa

---

### US-006: Atualizar webview para calcular coords relativas
**Description:** Como usuário, quando arrasto um componente para dentro de um Panel, ele deve automaticamente se tornar filho com coordenadas relativas.

**Group:** B

**Acceptance Criteria:**
- [ ] Detectar drop dentro de Panel em `useCanvasDragDrop.ts`
- [ ] Calcular `parentOffset = { x: dropX - panelX, y: dropY - panelY }`
- [ ] Atribuir `parentId` ao componente dropado
- [ ] Snap automático: componente vira filho do Panel quando solto dentro
- [ ] Typecheck passa
- [ ] Verificar no navegador: arrastar botão para dentro de panel e confirmar parentOffset

---

### US-007: Refatorar layout do App.tsx
**Description:** Como usuário, preciso que a sidebar seja um componente dedicado com layout flexível.

**Group:** B

**Acceptance Criteria:**
- [ ] Mover lógica de sidebar para componente `Sidebar.tsx`
- [ ] App.tsx usa `<Sidebar />` ao invés de inline JSX
- [ ] Layout principal: `[Sidebar][Canvas]` com flexbox
- [ ] Apenas Canvas tem zoom/pan, sidebar é fixa
- [ ] Typecheck passa
- [ ] Verificar no navegador: layout responsivo sem quebra

---

### US-008: Atualizar generateCommand para criar subpastas
**Description:** Como usuário, quero que arquivos gerados sejam organizados em subpastas por container pai.

**Group:** C

**Acceptance Criteria:**
- [ ] Para cada arquivo com `subfolder`, criar pasta `{outputDir}/{subfolder}/`
- [ ] Salvar arquivo em `{outputDir}/{subfolder}/{fileName}`
- [ ] Arquivos sem subfolder são salvos em `{outputDir}/{fileName}`
- [ ] Usar `fs.createDirectory` do VS Code API
- [ ] Typecheck passa
- [ ] Testar: gerar código com panel contendo botão e verificar estrutura de pastas

---

### US-009: Atualizar gerador para panels com filhos
**Description:** Como desenvolvedor, preciso que o gerador produza código com `panel.add()` e coordenadas relativas para filhos.

**Group:** C

**Acceptance Criteria:**
- [ ] `generateComponentCode` detecta Panel com filhos em `componentGenerators.ts`
- [ ] Para cada filho, gerar `panel.add(childComponent)`
- [ ] Filhos recebem `setBounds(parentOffset.x, parentOffset.y, width, height)`
- [ ] Código gerado compila e executa corretamente
- [ ] Typecheck passa

---

### US-010: Atualizar HierarchyPanel layout
**Description:** Como usuário, preciso que o painel de hierarquia tenha scroll interno e comportamento de colapso adequado.

**Group:** C

**Acceptance Criteria:**
- [ ] Remover `max-h-[45%]` fixo
- [ ] Usar `flex-1 min-h-0` para participação no flexbox
- [ ] Adicionar `overflow-y-auto` para scroll interno
- [ ] Colapso funciona independentemente da Palette
- [ ] Typecheck passa
- [ ] Verificar no navegador: colapsar Hierarchy e confirmar que Palette não é afetada

---

### US-011: Atualizar Palette layout
**Description:** Como usuário, preciso que a paleta de componentes tenha scroll interno e comportamento de colapso adequado.

**Group:** C

**Acceptance Criteria:**
- [ ] Usar `flex-1 min-h-0` para participação no flexbox
- [ ] Adicionar `overflow-y-auto` para scroll interno
- [ ] Colapso funciona independentemente da Hierarchy
- [ ] Quando Hierarchy colapsada, Palette expande para ocupar espaço
- [ ] Typecheck passa
- [ ] Verificar no navegador: colapsar Hierarchy e confirmar expansão da Palette

---

### US-012: Renderizar filhos dentro do Panel no Canvas
**Description:** Como usuário, preciso ver os filhos de um Panel renderizados com posição relativa no canvas.

**Group:** D

**Acceptance Criteria:**
- [ ] `Canvas.tsx` renderiza filhos de Panel com posição absoluta relativa ao container
- [ ] Filhos são movidos junto quando Panel é arrastado
- [ ] Filhos permanecem dentro dos limites visuais do Panel
- [ ] Zoom/pan do canvas afeta Panel e filhos proporcionalmente
- [ ] Typecheck passa
- [ ] Verificar no navegador: criar panel com botão dentro, mover panel e confirmar filhos acompanhão

---

### US-013: Garantir que apenas Canvas seja movível
**Description:** Como usuário, preciso que apenas o canvas tenha zoom/pan, enquanto sidebar e header permaneçam fixos.

**Group:** D

**Acceptance Criteria:**
- [ ] Remover overflow/movimento do container pai do Canvas
- [ ] Zoom/pan aplicado apenas no elemento do Canvas
- [ ] Sidebar permanece fixa durante zoom/pan
- [ ] Toolbar/header permanece fixo durante zoom/pan
- [ ] Typecheck passa
- [ ] Verificar no navegador: testar zoom/pan no canvas e confirmar sidebar fixa

---

## Functional Requirements

- FR-1: `previewCodeCommand` deve usar mesma lógica de inferência de package que `generateCommand`
- FR-2: Gerador Java deve retornar estrutura com `fileName`, `content`, e `subfolder` opcional
- FR-3: `generateCommand` deve criar subpastas automaticamente quando `subfolder` está presente
- FR-4: `CanvasComponent` deve suportar `parentOffset?: { x: number; y: number }`
- FR-5: Webview deve detectar drop dentro de Panel e calcular `parentOffset` automaticamente
- FR-6: Gerador deve produzir código com `panel.add(child)` para filhos de Panel
- FR-7: Canvas deve renderizar filhos de Panel com posição relativa ao pai
- FR-8: Sidebar deve ter HierarchyPanel (topo) e Palette (baixo)
- FR-9: HierarchyPanel e Palette devem ter scroll interno independente
- FR-10: HierarchyPanel e Palette devem ser colapsáveis individualmente
- FR-11: Apenas Canvas deve ter zoom/pan, sidebar e header fixos

---

## Non-Goals (Out of Scope)

- Layout managers do Swing (BorderLayout, FlowLayout, GridLayout)
- Sistema de divisória arrastável (resizer) entre Hierarchy e Palette
- Suporte a hierarquias aninhadas profundas (Panel dentro de Panel)
- Testes unitários automatizados
- Persistência de estado de colapso da sidebar
- Drag & drop de componentes entre Panels

---

## Technical Considerations

### Compatibilidade
- `GeneratedFileWithPath` deve manter compatibilidade com código existente
- Campo `subfolder` opcional (undefined = comportamento atual)

### Dependências
- Fase 3 depende de mudanças no tipo `CanvasComponent` (shared)
- Fase 4 é independente e pode ser desenvolvida em paralelo

### Performance
- Usar `useMemo` para cálculo de coordenadas relativas no canvas
- Lazy loading de componentes da sidebar se necessário

### Limitações Conhecidas
- Apenas um nível de aninhamento suportado (filho direto de Panel)
- Sem validação de limites (filho pode ser movido para fora do Panel visualmente)

---

## Success Metrics

- Preview e generate produzem package declaration idêntica (100% paridade)
- Estrutura de pastas reflete hierarquia de containers
- Filhos de Panel se movem junto com pai sem quebrar coordenadas
- Sidebar mantém layout funcional em qualquer tamanho de tela
- Zoom/pan no canvas não afeta sidebar

---

## Open Questions

- ~Como deve ser o comportamento quando componente é arrastado para dentro de Panel?~ **Resolvido: Snap automático**
- ~Scroll da sidebar deve ser unificado ou individual?~ **Resolvido: Scroll individual**
- ~Quais testes devem ser incluídos?~ **Resolvido: Testes manuais (verificação no browser)**

---

## Notas de Implementação

- **Ordem recomendada:** Fase 1 → Fase 2 → Fase 3 → Fase 4
- **Paralelismo:** Fases 1 e 2 podem ser desenvolvidas em paralelo
- **Grupo A:** Foundation (pode rodar em paralelo)
- **Grupo B:** Lógica de negócio (depende de A)
- **Grupo C:** Integração (depende de B)
- **Grupo D:** Finalização e polimento (depende de C)
- **Tempo estimado:** 2-3 horas para todas as fases
