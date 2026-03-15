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
  parentId?: string | null; // ID do componente pai (null = root)
  position?: "top" | "bottom" | "left" | "right"; // Para JToolBar
}
```

> **Nota**: Não precisamos de estado separado (`hierarchicalComponents`). Componentes planos existentes funcionam com `parentId: undefined` e `children: undefined`.

2. **Atualizar CanvasState**
- Adicionar suporte a estrutura em árvore
- Manter compatibilidade com componentes planos existentes
- Componentes sem `parentId` são considerados root

### **Fase 1.5: Validação de Hierarquia** ⭐
**Tempo**: 0.5 dia

1. **Criar hook de validação**
```typescript
// webview-app/src/hooks/useHierarchyValidation.ts
function validateHierarchy(components: ComponentModel[]): ValidationError[] {
  const errors: ValidationError[] = [];
  // Check cycles (A → B → A)
  // Check orphan references (parentId inexistente)
  // Check invalid parent types (MenuItem parent deve ser Menu, não MenuBar)
  // Check max depth (limite de aninhamento)
  return errors;
}
```

2. **Regras de validação**
| Pai válido | Filhos permitidos |
|------------|-------------------|
| `null` (root) | MenuBar, ToolBar, componentes planos |
| MenuBar | Menu |
| Menu | Menu (submenu), MenuItem |
| ToolBar | Button, Separator |

3. **Edge cases a tratar**
- **Deletar pai**: Deletar filhos em cascata (com confirmação)
- **Ciclos**: Rejeitar ao tentar criar `A → B → A`
- **Órfãos**: Se `parentId` aponta para ID inexistente, mostrar erro
- **Profundidade**: Máximo 3 níveis de submenu (MenuBar → Menu → Menu → MenuItem)

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

4. **Biblioteca de Tree View**
Usar **Custom Tree com shadcn/ui Collapsible** (zero nova dependência):
```typescript
// Baseado em Collapsible do shadcn/ui
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
```
Isso mantém consistência com o design system existente.

### **Fase 2.5: Serialização** ⭐
**Tempo**: 0.5 dia

1. **Atualizar formato do arquivo**
```json
{
  "components": [
    {
      "id": "menuBar1",
      "type": "MenuBar",
      "variableName": "menuBar1",
      "children": ["menu1"],
      "parentId": null
    },
    {
      "id": "menu1",
      "type": "Menu",
      "variableName": "fileMenu",
      "parentId": "menuBar1",
      "children": ["item1"]
    },
    {
      "id": "item1",
      "type": "MenuItem",
      "variableName": "newItem",
      "parentId": "menu1",
      "children": []
    }
  ]
}
```

2. **Atualizar ConfigReader.ts**
- Carregar hierarquia do JSON
- Validar referências de `parentId` e `children`
- Migrar arquivos existentes (adicionar `parentId: null` implicitamente)

### **Fase 3: Geração Java** ⭐
**Tempo**: 1 dia

1. **Ordem correta de geração** (importante!)
```java
// 1. Declarações (top-to-bottom da árvore)
JMenuBar menuBar = new JMenuBar();
JMenu fileMenu = new JMenu("File");
JMenuItem newItem = new JMenuItem("New");

// 2. Montagem (bottom-up: filhos primeiro)
fileMenu.add(newItem);
menuBar.add(fileMenu);

// 3. Attach ao frame
frame.setJMenuBar(menuBar);
```

2. **JavaGenerator.hierarchical()**
```typescript
private generateMenuBar(menuBar: ComponentModel): string {
  const menus = this.getChildren(menuBar.id);

  // 1. Declarations
  const decl = `JMenuBar ${menuBar.variableName} = new JMenuBar();`;

  // 2. Build children (recursive, bottom-up)
  const childCode = menus.map(menu => this.generateMenu(menu)).join('\n');

  // 3. Add to parent
  const addCode = menus.map(m => `${menuBar.variableName}.add(${m.variableName});`).join('\n');

  return `${decl}\n${childCode}\n${addCode}`;
}

private generateMenu(menu: ComponentModel): string {
  const items = this.getChildren(menu.id);
  const decl = `JMenu ${menu.variableName} = new JMenu("${menu.text}");`;
  const childCode = items.map(item => this.generateMenuItem(item)).join('\n');
  const addCode = items.map(i => `${menu.variableName}.add(${i.variableName});`).join('\n');

  return `${decl}\n${childCode}\n${addCode}`;
}
```

3. **Atualizar ordem de geração no frame**
- JMenuBar primeiro (setJMenuBar)
- Componentes planos no meio (add ao content pane)
- JToolBar por último (add ao content pane ou border layout)

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
5. `webview-app/src/hooks/useHierarchyValidation.ts` — **NOVO** — Validação (ciclos, órfãos)

### UI Components
6. `webview-app/src/components/Palette.tsx` — Seção "Containers"
7. `webview-app/src/components/HierarchyPanel.tsx` — **NOVO** — Tree view (usa Collapsible)
8. `webview-app/src/components/Canvas.tsx` — Render JMenuBar/ToolBar fixos

### Java Generation
9. `src/generator/JavaGenerator.ts` — generateMenuBar(), generateMenu(), generateToolBar()

### Config & Serialization
10. `src/config/initConfigCommand.ts` — Template para JMenuBar/JToolBar
11. `src/config/ConfigReader.ts` — Carregar/validar hierarquia, migrar arquivos antigos

### Schema
12. `schemas/swingbuilder.schema.json` — Adicionar children, parentId, tipos hierárquicos

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
  parentId: "menuBar1",  // ou outro JMenu (submenu)
  children: ["menuItem1", "menuItem2", "submenu1"]  // pode conter JMenu (submenu)
}
```
- Child de JMenuBar **ou outro JMenu** (submenu)
- Listener: addMenuListener (opcional)
- Geração: `parent.add(fileMenu)`
- **Profundidade máxima**: 3 níveis de aninhamento

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
- **UI**: Tree view dedicada (não misturar com canvas drag)

---

## Estimativa de Tempo

| Fase | Descrição | Tempo |
| --------- | ------------------------ | ------------ |
| Fase 1 | Model hierárquico | 1-2 dias |
| Fase 1.5 | Validação de hierarquia | 0.5 dia |
| Fase 2 | UI (tree view + preview) | 2-3 dias |
| Fase 2.5 | Serialização | 0.5 dia |
| Fase 3 | Geração Java | 1 dia |
| Fase 4 | Testes + edge cases | 1 dia |
| **Total** | **Com submenus** | **6-8 dias** |

---

## Next Steps

1. ~~Decidir entre hierarquia completa vs hardcoded~~ → **Decidido: hierarquia completa**
2. Criar branch `feature/hierarchical-components`
3. Implementar Fase 1 (model) primeiro
4. Implementar Fase 1.5 (validação)
5. Validar com POC de JMenuBar simples
6. Iterar com UI + geração

---

## Riscos

- **Complexidade UI**: Tree view drag-and-drop é tricky
- **Compatibilidade**: Não quebrar componentes planos existentes
- **Performance**: State tree pode crescer muito com muitos menus
- **UX**: Usuários podem achar tree view confusa
- **Migração**: Arquivos .swingbuilder existentes precisam de parentId implícito
- **Profundidade**: Submenus muito profundos podem ser difíceis de editar na UI

---

## Escopo

### Incluído
- 4 componentes hierárquicos (MenuBar, Menu, MenuItem, ToolBar)
- **Submenus** (JMenu dentro de JMenu) ✅
- Tree view para edição
- Geração Java correta (ordem bottom-up)
- Drag-and-drop de menus
- Validação de hierarquia (ciclos, órfãos, tipos inválidos)
- Serialização/desserialização com parentId

### Excluído (futuro)
- Icons em menus
- Shortcuts/accelerators (Ctrl+S, etc.)
- Popup menus (JPopupMenu)
- Mnemonics (Alt+F para File)
