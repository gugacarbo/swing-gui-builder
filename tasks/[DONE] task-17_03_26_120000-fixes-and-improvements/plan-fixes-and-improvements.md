# Plan: Fixes and Improvements

Quatro mudanças principais: package declaration, estrutura de pastas, coordenadas relativas, e layout do webview.

---

## 📊 Estado Atual (Baseline)

### O que já existe
| Camada                       | Status     | Observações                                            |
| ---------------------------- | ---------- | ------------------------------------------------------ |
| Package inference (generate) | ✅ Existe   | Detecta package de `outputDir` relativo a `sourceRoot` |
| Package inference (preview)  | ❌ Faltando | `generatePreviewJavaFiles` não recebe package          |
| Estrutura de pastas          | ❌ Faltando | Todos arquivos salvos na raiz do output                |
| Panel children coords        | ❌ Faltando | Coordenadas absolutas, sem parentId no gerador         |
| HierarchyPanel colapso       | ✅ Parcial  | Tem colapso global, mas sem scroll adequado            |
| Palette colapso              | ✅ Parcial  | Tem colapso global                                     |
| Sidebar layout               | ❌ Quebrado | `max-h-[45%]` fixo, overflow mal configurado           |

### Gaps identificados
1. `previewCodeCommand` não passa package para `generatePreviewJavaFiles`
2. Gerador não cria subpastas por componente pai
3. `componentGenerators.ts` não trata Panel com filhos
4. `App.tsx` tem layout fixo sem flexbox adequado para sidebar
5. Sidebar sem scroll interno quando colapsada/expandida

---

## Scope

### In Scope
- ✅ Fix package declaration no preview
- ✅ Criar subpastas para containers com filhos
- ✅ Gerar código com coordenadas relativas para filhos de Panel
- ✅ Refazer layout da sidebar com Hierarchy em cima, Palette em baixo
- ✅ Ambos colapsáveis individualmente
- ✅ Apenas Canvas móvel, resto estrito

### Out of Scope
- ❌ Layout managers (BorderLayout, FlowLayout)
- ❌ Sistema de divisória arrastável (resizer)
- ❌ Suporte a hierarquias aninhadas profundas (Panel dentro de Panel)

---

## Steps

### Fase 1: Package Declaration

#### Step 1.1 - Passar package no preview code
- **Arquivo:** `src/commands/previewCodeCommand.ts`
- **Ação:** Importar `getOutputDirectory`, `detectJavaProject`, e inferir package como em `generateCommand`
- **Dependência:** nenhuma

#### Step 1.2 - Atualizar previewCodeCommand para detectar package
- **Arquivo:** `src/commands/previewCodeCommand.ts`
- **Ação:** Adicionar lógica de detecção de projeto e package, passar para `generatePreviewJavaFiles`
- **Dependência:** step 1.1

---

### Fase 2: Estrutura de Pastas

#### Step 2.1 - Criar tipo para representar estrutura de arquivos
- **Arquivo:** `src/generator/JavaGenerator.ts`
- **Ação:** Adicionar interface `GeneratedFileWithPath` com `subfolder?: string`
- **Dependência:** nenhuma

#### Step 2.2 - Modificar gerador para retornar subfolder
- **Arquivo:** `src/generator/JavaGenerator.ts`
- **Ação:** `generateJavaFiles` retorna `{ fileName, content, subfolder?: string }[]`
- **Dependência:** step 2.1

#### Step 2.3 - Identificar containers com filhos
- **Arquivo:** `src/generator/JavaGenerator.ts`
- **Ação:** Criar função `getParentFolder(comp, allComponents)` que retorna nome do pai ou undefined
- **Dependência:** step 2.2

#### Step 2.4 - Atualizar generateCommand para criar subpastas
- **Arquivo:** `src/commands/generateCommand.ts`
- **Ação:** Para cada arquivo com `subfolder`, criar pasta `{outputDir}/{subfolder}/` antes de salvar
- **Dependência:** step 2.2, step 2.3

---

### Fase 3: Coordenadas Relativas ao Panel

#### Step 3.1 - Estender CanvasComponent com parentOffset
- **Arquivo:** `shared/types/canvas.ts`
- **Ação:** Adicionar campo opcional `parentOffset?: { x: number; y: number }`
- **Dependência:** nenhuma

#### Step 3.2 - Atualizar gerador para panels com filhos
- **Arquivo:** `src/generator/componentGenerators.ts`
- **Ação:** Em `generateComponentCode`, verificar se comp é Panel com filhos, gerar `panel.add()` com setBounds relativo
- **Dependência:** step 3.1

#### Step 3.3 - Atualizar webview para calcular coords relativas
- **Arquivo:** `webview-app/src/hooks/useCanvasDragDrop.ts`
- **Ação:** Ao mover componente filho de Panel, calcular x/y relativo ao pai
- **Dependência:** step 3.1

#### Step 3.4 - Renderizar filhos dentro do Panel no Canvas
- **Arquivo:** `webview-app/src/components/Canvas.tsx`
- **Ação:** Renderizar filhos de Panel com posição absoluta relativa ao container no canvas
- **Dependência:** step 3.3

---

### Fase 4: Layout Webview - Sidebar

#### Step 4.1 - Refatorar layout do App.tsx
- **Arquivo:** `webview-app/src/App.tsx`
- **Ação:** Mover sidebar para um componente dedicado, inverter ordem (Hierarchy top, Palette bottom)
- **Dependência:** nenhuma

#### Step 4.2 - Criar componente Sidebar
- **Arquivo:** `webview-app/src/components/Sidebar.tsx` (novo)
- **Ação:** Container flexível com HierarchyPanel e Palette, ambos colapsáveis e scrolláveis
- **Dependência:** step 4.1

#### Step 4.3 - Atualizar HierarchyPanel layout
- **Arquivo:** `webview-app/src/components/HierarchyPanel.tsx`
- **Ação:** Remover `max-h-[45%]`, usar `flex-1 min-h-0` com scroll interno
- **Dependência:** step 4.2

#### Step 4.4 - Atualizar Palette layout
- **Arquivo:** `webview-app/src/components/Palette.tsx`
- **Ação:** Usar `flex-1 min-h-0` com scroll interno, comportamento de colapso mantido
- **Dependência:** step 4.2

#### Step 4.5 - Garantir que apenas Canvas seja movível
- **Arquivo:** `webview-app/src/components/Canvas.tsx`
- **Ação:** Remover qualquer overflow/movimento do container pai, garantir zoom/pan apenas no canvas
- **Dependência:** step 4.1

---

## ⚠️ Riscos e Mitigações

| Risco                                       | Mitigação                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| Breaking change no formato de GeneratedFile | Manter compat com `fileName`/`content`, adicionar `subfolder` opcional |
| Panel children quebrando drag & drop        | Testar exaustivamente `useCanvasDragDrop` com parentId                 |
| Sidebar layout quebrar em telas pequenas    | Usar `min-h-[200px]` para cada painel colapsado                        |
| Preview vs Generate desync                  | Garantir que ambos usem mesma lógica de package inference              |

---

## 📝 Notas

- **Ordem de execução recomendada:** Fase 1 → Fase 2 → Fase 3 → Fase 4
- Fases 1 e 2 são independentes e podem ser paralelas
- Fase 3 depende de mudanças no tipo `CanvasComponent` (shared)
- Fase 4 é puramente frontend e pode ser feita independentemente
- Tempo estimado: 2-3 horas para todas as fases
