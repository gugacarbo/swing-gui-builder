# Plan: Adicionar Componentes Swing Hierárquicos ao GUI Builder

**TL;DR**: Implementar 4 componentes hierárquicos (JMenuBar, JMenu, JMenuItem, JToolBar) que requerem redesign arquitetural para suportar estrutura parent-child.

---

## Componentes

### **Complexos (4 componentes)**
- **JMenuBar** → Barra de menu (topo do frame)
- **JMenu** → Menu dropdown (child de JMenuBar)
- **JMenuItem** → Item de menu (child de JMenu)
- **JToolBar** → Barra de ferramentas (pode conter buttons)

---

## Desafios Arquiteturais

### 1. **Estrutura Hierárquica**
Componentes atuais são "planos" — todos no mesmo nível do Container. Menus e toolbar requerem:
- Parent-child relationships
- Aninhamento: JMenuBar → JMenu → JMenuItem
- Ordenação: sequência de menus/items importa

### 2. **Posicionamento Especial**
- JMenuBar: fixo no topo do JFrame (setJMenuBar)
- JToolBar: fixo em border layout (NORTH/SOUTH/EAST/WEST)
- Não usa coordenadas x/y absolutas

### 3. **Renderização Visual**
- Canvas atual: todos os componentes são retângulos arrastáveis
- Menus: estrutura em árvore → precisa de tree view ou painel especial
- Toolbar: container horizontal/vertical especial

### 4. **Geração Java**
```java
// Estrutura esperada:
JMenuBar menuBar = new JMenuBar();
JMenu fileMenu = new JMenu("File");
JMenuItem newItem = new JMenuItem("New");
fileMenu.add(newItem);
menuBar.add(fileMenu);
frame.setJMenuBar(menuBar);
```

---

## Abordagem Recomendada

### **Fase 1: Novo Model para Hierarquia** ⭐⭐
**Tempo**: 1-2 dias

1. **Estender ComponentModel**
```typescript
interface ComponentModel {
  // ... existing props
  children?: string[];      // IDs dos componentes filhos
  parentId?: string;        // ID do componente pai
  position?: "top" | "bottom" | "left" | "right"; // Para JToolBar
}
```

2. **Criar novo estado global**
- `hierarchicalComponents`: Map<string, ComponentModel>
- `rootComponents`: string[] (top-level containers)

3. **Atualizar CanvasState**
- Adicionar suporte a estrutura em árvore
- Manter compatibilidade com componentes planos existentes

### **Fase 2: UI para Hierarquia** ⭐⭐⭐
**Tempo**: 2-3 dias

1. **Novo componente: HierarchyPanel**
- Tree view para JMenuBar/JMenu/JMenuItem
- Drag-and-drop para reordenar
- Botões: add menu, add item, delete

2. **Paleta especial**
- Separar "Container Components" (JMenuBar, JToolBar) dos demais
- Quando arrastar JMenuBar ao canvas, criar estrutura padrão (1 menu + 1 item)

3. **Preview visual**
- Mostrar JMenuBar no topo do canvas (não-draggable)
- Mostrar JToolBar em posição fixa (border layout)

### **Fase 3: Geração Java** ⭐
**Tempo**: 1 dia

1. **JavaGenerator.hierarchical()**
```typescript
private generateMenuBar(menuBar: ComponentModel): string {
  const menus = this.getChildren(menuBar.id);
  const menuCode = menus.map(menu => this.generateMenu(menu)).join('\n');

  return `
JMenuBar ${menuBar.name} = new JMenuBar();
${menuCode}
${menuBar.name}.add(${menus.map(m => m.name).join('\n')});
frame.setJMenuBar(${menuBar.name});
`;
}
```

2. **Atualizar ordem de geração**
- JMenuBar primeiro (setJMenuBar)
- JToolBar por último (add ao content pane)
- Componentes planos no meio

### **Fase 4: Validação e Testes** ⭐
**Tempo**: 1 dia

1. **Testes unitários**
- Hierarchical state management
- Tree traversal
- Java generation com nesting

2. **Testes de integração**
- Criar menu completo via UI
- Gerar código Java
- Compilar e executar

3. **Edge cases**
- Menu vazio (warning?)
- Menu profundamente aninhado (submenu)
- Toolbar com diferentes orientações

---

## Arquivos Modificados

### Core (Model)
1. `src/components/ComponentModel.ts` — Adicionar children, parentId
2. `webview-app/src/types/canvas.ts` — Sincronizar tipos

### State Management
3. `webview-app/src/hooks/useCanvasState.ts` — Gerenciar hierarquia
4. `webview-app/src/hooks/useHierarchyDragDrop.ts` — **NOVO** — Drag de menus

### UI Components
5. `webview-app/src/components/Palette.tsx` — Seção "Containers"
6. `webview-app/src/components/HierarchyPanel.tsx` — **NOVO** — Tree view
7. `webview-app/src/components/Canvas.tsx` — Render JMenuBar/ToolBar fixos

### Java Generation
8. `src/generator/JavaGenerator.ts` — generateMenuBar(), generateToolBar()

### Config
9. `src/config/initConfigCommand.ts` — Template para JMenuBar/JToolBar
10. `src/config/ConfigReader.ts` — Validar tipos hierárquicos

### Schema
11. `schemas/swingbuilder.schema.json` — Adicionar children/parentId

---

## Detalhes por Componente

### 1. JMenuBar
```typescript
{
  type: "MenuBar",
  name: "menuBar1",
  children: ["menu1", "menu2"],
  position: "top"
}
```
- Não tem x/y (fixo no topo)
- Listener: nenhum
- Geração: `frame.setJMenuBar(menuBar1)`

### 2. JMenu
```typescript
{
  type: "Menu",
  name: "fileMenu",
  text: "File",
  parentId: "menuBar1",
  children: ["menuItem1", "menuItem2"]
}
```
- Child de JMenuBar
- Listener: addMenuListener (opcional)
- Geração: `menuBar.add(fileMenu)`

### 3. JMenuItem
```typescript
{
  type: "MenuItem",
  name: "newItem",
  text: "New",
  parentId: "fileMenu",
  eventMethodName: "handleNew"
}
```
- Child de JMenu
- Listener: addActionListener
- Geração: `fileMenu.add(newItem)`

### 4. JToolBar
```typescript
{
  type: "ToolBar",
  name: "toolBar1",
  position: "north", // ou "south", "east", "west"
  children: ["btnNew", "btnOpen", "separator1"]
}
```
- Posição: border layout (não x/y)
- Pode conter: JButton, JSeparator
- Listener: nenhum (children têm seus listeners)

---

## Alternativas Consideradas

### **Opção A: Hierarquia Completa** ↔️
- Prós: UX profissional, flexível
- Contras: 5-7 dias de trabalho, complexo

### **Opção B: Hardcoded Por Enquanto** ⚡
- Single JMenuBar com menus fixos
- Editar via JSON config (não UI)
- Prós: 1-2 dias
- Contras: UX limitada

### **Opção C: Externo** 📦
- Integrar com editor de menus existente (GUI external)
- Prós:Menos trabalho
- Contras: Dependência externa

---

## Decisões

- **Implementar Opção A** (hierarquia completa)
- **Priorizar JMenuBar** → menus → items primeiro
- **JToolBar** depois (mais simples, similares patterns)
- **UI**: Tree view dedicada (não混 misturar com canvas drag)

---

## Estimativa de Tempo

| Fase      | Descrição                | Tempo        |
| --------- | ------------------------ | ------------ |
| Fase 1    | Model hierárquico        | 1-2 dias     |
| Fase 2    | UI (tree view + preview) | 2-3 dias     |
| Fase 3    | Geração Java             | 1 dia        |
| Fase 4    | Testes + edge cases      | 1 dia        |
| **Total** | **4 componentes**        | **5-7 dias** |

---

## Next Steps

1. Decidir entre hierarquia completa vs hardcoded
2. Se completa: criar branch feature/hierarchical-components
3. Implementar Fase 1 (model) primeiro
4. Validar com POC de JMenuBar simples
5. Iterar com UI + geração

---

## Riscos

- **Complexidade UI**: Tree view drag-and-drop é tricky
- **Compatibilidade`: Não quebrar componentes planos existentes
- **Performance**: State tree pode crescer muito com muitos menus
- **UX**: Usuários podem achar tree view confusa

---

## Escopo

### Incluído
- 4 componentes hierárquicos
- Tree view para edição
- Geração Java correta
- Drag-and-drop de menus

### Excluído (futuro)
- Submenus (JMenu dentro de JMenu)
- Icons em menus
- Shortcuts/accelerators
- Popup menus (JPopupMenu)
