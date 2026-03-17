# Requirements: Fixes and Improvements

## Visão Geral

Quatro mudanças principais no projeto Swing GUI Builder:

1. **FIX: Package declaration** - Detectar package a partir da pasta de saída
2. **Estrutura de pastas** - Salvar componentes com filhos em subpastas
3. **Panel children** - Coordenadas relativas ao container pai
4. **Layout webview** - Sidebar com Palette/Hierarchy colapsáveis

---

## 1. FIX: Package Declaration

### Problema
O `package` não está sendo escrito no arquivo Java gerado.

### Requisitos
- **Generate Command**: Detectar package a partir da pasta de saída ESPECIFICADA pelo usuário no momento de gerar
- **Preview Code**: Usar o output padrão do `.swingbuilder.json` ou do projeto Java detectado
- O package deve ser inferido do caminho relativo à source root

### Decisões
- ✅ Usar output selecionado pelo usuário para inferir package
- ✅ No preview, usar o padrão do projeto/config

---

## 2. Estrutura de Pastas por Componente Pai

### Requisitos
- Quando um container (Panel, MenuBar, Menu, ToolBar) tiver filhos, salvar os arquivos em uma subpasta com o nome do componente pai
- Exemplo: `MyPanel.java` com filhos → `MyPanel/MyPanel.java`, `MyPanel/MyButton.java`

### Decisões
- ✅ Aplicar a TODOS containers com filhos (Panel, MenuBar, Menu, ToolBar)
- Cada container com filhos gera uma subpasta

---

## 3. Coordenadas Relativas ao Panel

### Requisitos
- Filhos de Panel devem ter coordenadas relativas ao container pai
- `x` e `y` dos filhos são em relação ao Panel, não ao JFrame
- O código gerado deve manter essa relação

### Decisões
- ✅ Implementar coordenadas relativas ao pai
- Filhos são adicionados via `panel.add(component)` com setBounds relativo

---

## 4. Layout Webview - Sidebar Responsiva

### Problema
- Palette e Hierarchy ficam um em cima do outro quando ambas abertas
- Componentes ficam fora da página
- Canvas é móvel, mas o resto também está móvel

### Requisitos
- **Hierarchy em CIMA, Palette em BAIXO**
- Ambos **colapsáveis** individualmente
- Apenas o **Canvas é móvel** (zoom/pan)
- Sidebar, Palette, Hierarchy, Properties são **estritos ao tamanho da janela**
-溢出 da sidebar deve ser tratado com scroll interno nos painéis, não scroll global

### Layout Proposto
```
┌─────────────────────────────────────────────────┐
│                  Toolbar                         │
├────────────┬──────────────────────┬─────────────┤
│ [collapse] │                      │  Properties │
│ Hierarchy  │                      │   (scroll)  │
├────────────│      Canvas          │             │
│ (scroll)   │    (zoom/pan)        │             │
│            │                      │             │
├────────────│                      │             │
│ [collapse] │                      │             │
│ Palette    │                      │             │
├────────────│                      │             │
│ (scroll)   │                      │   Footer    │
└────────────┴──────────────────────┴─────────────┘
```

---

## Arquivos Principais

### Package & Pastas
- `src/commands/generateCommand.ts`
- `src/commands/previewCodeCommand.ts`
- `src/generator/JavaGenerator.ts`
- `src/generator/componentGenerators.ts`

### Panel Children
- `shared/types/canvas.ts`
- `webview-app/src/components/Canvas.tsx`
- `webview-app/src/components/CanvasComponent/`
- `src/generator/componentGenerators.ts`

### Layout Webview
- `webview-app/src/App.tsx`
- `webview-app/src/components/Palette.tsx`
- `webview-app/src/components/HierarchyPanel.tsx`
- `webview-app/src/styles/` (se necessário)

---

## Gaps Identificados

1. **Package não está sendo passado no preview** - `generatePreviewJavaFiles` não recebe package
2. **Arquivos são gerados na raiz do output dir** - sem estrutura de subpastas
3. **Panel children usam coords absolutas** - não há tratamento de parentId no gerador
4. **Sidebar sem layout flexível** - `max-h-[45%]` fixo, sem colapso individual
