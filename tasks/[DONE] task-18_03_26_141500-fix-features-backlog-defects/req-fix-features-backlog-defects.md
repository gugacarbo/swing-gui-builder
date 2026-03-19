# Fix Features Backlog Defects

## Description

Corrigir defeitos e implementar TODOs identificados no `FEATURES.md`:
- 1 item `[ADJUST]` - Undo/Redo History salvando em cada movimento
- 3 itens `[NOT WORKING]` - Hierarchy DnD, Package Detection, Event Stubs
- 2 itens `[TODO]` - Ctrl+S Save, Create New Layout
- 1 item `[FEATURE]` - Hierarchical Folder Structure for Generated Code
- 1 item `[BUG]` - JFrame background não definido no preview
- 1 item `[FEATURE]` - Botão de config do JFrame (tamanho, cores, título)

---

## Decided Requirements

### 1. [ADJUST] Undo/Redo History - Debounce on Drag
- [ ] Modificar `useUndoRedo` para não salvar histórico durante o drag
- [ ] Salvar estado apenas no evento `mouseup`/`pointerup` (término do drag)
- [ ] Implementar batching ou debounce para `updateComponents` durante resize

**Arquivos:** `webview-app/src/App.tsx`, `webview-app/src/hooks/useDragInteraction.ts`, `webview-app/src/hooks/useUndoRedo.ts`

---

### 2. [NOT WORKING] Hierarchy Drag-and-Drop
- [ ] Expandir `resolveDropInstruction()` para suportar TODOS os tipos de componentes
- [ ] Implementar indicadores visuais de drop target (linha azul/destaque)
- [ ] Adicionar função de desassociação (mover componente para raiz)
- [ ] Testar fluxo end-to-end de reordenação e mudança de parentesco

**Arquivos:** `webview-app/src/hooks/useHierarchyDragDrop.ts`, `webview-app/src/components/HierarchyPanel.tsx`

---

### 3. [NOT WORKING] Package Detection in Generated Files
- [ ] Verificar fluxo `generateCommand.ts` → `JavaGenerator.ts`
- [ ] Garantir que `packageName` é passado corretamente para `generateJavaFiles()`
- [ ] Adicionar testes unitários para package inference
- [ ] Validar edge cases (projetos sem estrutura Maven/Gradle)

**Arquivos:** `src/commands/generateCommand.ts`, `src/generator/JavaGenerator.ts`, `src/utils/JavaPackageInference.ts`

---

### 4. [NOT WORKING] Event Methods/Stubs in Properties Panel
- [ ] Adicionar campo `eventMethodName` no `PropertiesPanel/index.tsx`
- [ ] Permitir editar nome do método de evento
- [ ] Conectar campo com `onUpdateComponent()`
- [ ] Validar nome de método Java (regex)

**Arquivos:** `webview-app/src/components/PropertiesPanel/index.tsx`, `webview-app/src/types/canvas.ts`

---

### 5. [TODO] Ctrl+S to Save Layout
- [ ] Adicionar handler em `useKeyboardShortcuts.ts` para `Ctrl+S`
- [ ] Chamar `postToolbarCommand("save")` ao disparar atalho
- [ ] Considerar também keybinding via `package.json` com `when` clause

**Arquivos:** `webview-app/src/hooks/useKeyboardShortcuts.ts`, `package.json` (opcional)

---

### 6. [TODO] Suggest Init Project When File Not Found
- [ ] Modificar `openCommand.ts` para capturar erro de arquivo não encontrado
- [ ] Exibir mensagem sugerindo criar novo projeto/layout

**Arquivos:** `src/commands/openCommand.ts`

### 7. [TODO] Create New Layout When File Not Found
- [ ] Modificar `openCommand.ts` para capturar erro de arquivo não encontrado
- [ ] Criar estado vazio default em vez de mostrar erro
- [ ] Inicializar canvas com `MainWindow` vazio

**Arquivos:** `src/commands/openCommand.ts`

---

### 8. [FEATURE] Hierarchical Folder Structure for Generated Code
- [ ] Modificar `JavaGenerator.ts` para gerar pastas hierárquicas baseadas na árvore de componentes
- [ ] Quando um componente tem filhos, criar pasta com nome do componente pai
- [ ] O pai e todos os arquivos filhos (e netos) devem ficar dentro dessa pasta
- [ ] Estrutura de pastas deve refletir a hierarquia visual do canvas

**Estrutura desejada:**
```
/src/
  MainWindow.java
  MainWindow/
    JPanel1/
        JPanel1.java
      JButton1.java
      JLabel1.java
    JMenu1/
      JMenu1.java
      JMenuItem1.java
      JMenuItem2.java
```

**Arquivos:** `src/generator/JavaGenerator.ts`, `src/commands/generateCommand.ts`

---

### 9. [BUG] JFrame Background Not Applied in Preview
- [ ] O JFrame não está vindo com background definido
- [ ] Atualmente usa o background do tema do VS Code
- [ ] Aplicar background do estado do componente JFrame no preview
- [ ] Garantir que `backgroundColor` é respeitado na renderização do JFrame

**Arquivos:** `webview-app/src/components/CanvasPreview.tsx`, `webview-app/src/components/Canvas.tsx`

---

### 10. [FEATURE] JFrame Configuration Button
- [ ] Adicionar botão dedicado para configurar o JFrame
- [ ] Incluir campos para: tamanho (width/height), cores (background), título
- [ ] UI pode ser dialog ou panel específico
- [ ] Conectar com o estado do JFrame no canvas

**Arquivos:** `webview-app/src/components/Toolbar.tsx`, `webview-app/src/components/JFrameConfigDialog.tsx` (novo), `webview-app/src/App.tsx`

---

## Findings

### 1. Undo/Redo - Salvando a cada movimento
- **Local:** `App.tsx` L165-240 + `useDragInteraction.ts` L95-115
- **Causa:** `handleMouseMove` chama `onMove()` continuamente, que dispara `setComponentHistory()` a cada frame
- **Evidência:** O hook `useUndoRedo` salva histórico a cada `updateComponents()` call

### 2. Hierarchy DnD - Apenas Menu/MenuItem
- **Local:** `useHierarchyDragDrop.ts` L155-210
- **Causa:** `resolveDropInstruction()` tem lógica hardcoded apenas para Menu/MenuItem
- **Evidência:** Switch statement não contempla Button, Label, Panel, etc.

### 3. Package Detection - Fluxo incerto
- **Local:** `JavaProjectDetector.ts` (OK) + `JavaPackageInference.ts` (OK) + `generateCommand.ts` (suspeito)
- **Status:** Detecção e inferência funcionam, mas package pode não ser passado corretamente
- **Necessário:** Debug do fluxo `generateCommand.ts` → `generateJavaFiles()`

### 4. Event Stubs - Campo não renderizado
- **Local:** `PropertiesPanel/index.tsx`
- **Causa:** O campo `eventMethodName` existe no tipo mas não é renderizado no UI
- **Nota:** `JavaGenerator.ts` já gera os stubs corretamente

### 5. Ctrl+S - Atalho ausente
- **Local:** `useKeyboardShortcuts.ts`
- **Causa:** Comando `save` existe, mas atalho não está mapeado
- **Solução simples:** Adicionar handler no hook existente

### 6. New Layout - Sem fallback
- **Local:** `openCommand.ts` L16-31
- **Causa:** `catch` bloco apenas mostra erro
- **Correção:** Criar estado vazio default

---

## Gaps & Risks

| Gap                                    | Risco                            | Impacto |
| -------------------------------------- | -------------------------------- | ------- |
| Sem testes E2E para drag hierarquia    | Regredir ao fixar                | Alto    |
| Package inference não tem testes       | Bugs silenciosos na geração      | Médio   |
| Ctrl+S pode conflitar com VS Code Save | UX confusa                       | Baixo   |
| Hierarchy DnD exige refatoração grande | Quebrar funcionalidade existente | Alto    |
| Não há design para indicadores visuais | UI inconsistente                 | Médio   |
| Hierarchical folders muda estrutura    | Projetos existentes quebram      | Médio   |
| JFrame config pode complicar UI        | UX cluttered                     | Baixo   |

---

## Suggestions

### Priorização Sugerida

| Prioridade | Item                      | Esforço Estimado |
| ---------- | ------------------------- | ---------------- |
| 🔴 Alta     | 1. Undo/Redo Debounce     | 2h               |
| 🔴 Alta     | 6. New Layout Fallback    | 30min            |
| � Alta     | 9. JFrame Background Fix  | 1h               |
| 🟡 Média    | 5. Ctrl+S Save            | 30min            |
| 🟡 Média    | 4. Event Stubs Properties | 1h               |
| 🟡 Média    | 3. Package Detection      | 2h               |
| 🟡 Média    | 8. Hierarchical Folders   | 2-3h             |
| 🟡 Média    | 10. JFrame Config Button  | 2h               |
| 🔴 Complexa | 2. Hierarchy DnD          | 4-6h             |

### Ordem de Implementação Recomendada

1. **Quick wins:** #6 (New Layout) + #5 (Ctrl+S) + #9 (JFrame BG) → primeira sessão
2. **Core fix:** #1 (Undo/Redo) → crítica para UX
3. **Feature completion:** #4 (Event Stubs) + #3 (Package) + #8 (Hierarchical Folders) + #10 (JFrame Config) → funcionalidade
4. **Complex refactor:** #2 (Hierarchy DnD) → maior esforço, separar em subtasks

---

## Perguntas para o Tech Lead

1. **Hierarchy DnD (#2)** - Deseja implementação completa (4-6h) ou MVP apenas para componentes específicos?
   - Completa
2. **Package Detection (#3)** - Projetos sem Maven/Gradle devem ter package vazio ou inferir do path?
   - Inferir do path
3. **Ctrl+S (#5)** - Preferência: keybinding via extension (package.json) ou webview hook?
    - Webview hook
---

*Task criada em: 18/03/2026*
*Stakeholder: Tech Lead*
*Critério de sucesso: Todos os 10 itens funcionando conforme especificação*
