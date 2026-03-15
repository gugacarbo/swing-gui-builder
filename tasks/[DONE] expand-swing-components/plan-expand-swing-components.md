# Plan: Expandir componentes Swing no builder

Ampliar o suporte de componentes do Swing GUI Builder para cobrir o escopo definido (JFrame implícito, JPanel e componentes de entrada/seleção/progresso), mantendo entrega MVP funcional no canvas (renderização genérica) com foco em consistência de tipos, drag and drop completo e geração Java válida.

---

## 📊 Estado Atual (Baseline)

### Tipos suportados atualmente
| Camada                            | Tipos                                                                 | Status      |
| --------------------------------- | --------------------------------------------------------------------- | ----------- |
| `ComponentModel.ts` / `canvas.ts` | `Button`, `Label`, `TextField`, `PasswordField`, `TextArea`           | ✅ 5 tipos   |
| `Palette.tsx`                     | `JPanel`, `JButton`, `JLabel`, `JTextField`, `JTextArea`, `JCheckBox` | ⚠️ 6 itens   |
| `useCanvasDragDrop.ts`            | Mapeia `JPanel→Label`, `JCheckBox→Button`                             | ❌ Incorreto |
| `swingbuilder.schema.json`        | `Button`, `Label`, `TextField`, `PasswordField`, `TextArea`           | ✅ 5 tipos   |
| `JavaGenerator.ts`                | `SWING_CLASS_MAP` com 5 tipos                                         | ✅ 5 tipos   |

### Gaps identificados
1. **Mapeamentos quebrados:** `JPanel` e `JCheckBox` estão mapeados para tipos errados
2. **Tipos faltantes:** 8 componentes do escopo não existem em nenhuma camada
3. **Propriedades específicas:** `CanvasComponent` não suporta `selected`, `items`, `value`, `min`, `max`
4. **Ícones faltantes:** Paleta não tem ícones para 7 componentes novos

---

## Scope - Componentes Swing a suportar

### Container (paleta)
- **JPanel** - Container para agrupar outros componentes

### Entrada de texto
- **JTextField** - Entrada de texto de linha única
- **JTextArea** - Entrada de texto multilinha

### Botões e seleção
- **JButton** - Botão de ação
- **JCheckBox** - Checkbox (seleção múltipla)
- **JRadioButton** - Radio button (seleção exclusiva em grupo)

### Listas e combos
- **JComboBox** - Dropdown de seleção única
- **JList** - Lista de itens com seleção simples/múltipla

### Exibição e rótulo
- **JLabel** - Rótulo de texto/imagem

### Progresso e controle de valor
- **JProgressBar** - Barra de progresso visual
- **JSlider** - Deslizador para seleção de valor em range
- **JSpinner** - Seletor numérico com spin buttons

### Separação
- **JSeparator** - Separador visual horizontal/vertical

### Implícito (não vai na paleta)
- **JFrame** - Janela raiz da aplicação (gerado automaticamente como container principal)

## Steps

### Fase 1: Modelagem de Tipos e Propriedades

#### Step 1.1 - Estender `ComponentType` (backend)
- **Arquivo:** `src/components/ComponentModel.ts`
- **Ação:** Adicionar tipos: `Panel`, `CheckBox`, `RadioButton`, `ComboBox`, `List`, `ProgressBar`, `Slider`, `Spinner`, `Separator`
- **Manter:** `Button`, `Label`, `TextField`, `PasswordField`, `TextArea`
- **Total:** 14 tipos
- **Dependência:** nenhuma

#### Step 1.2 - Estender `ComponentType` (frontend)
- **Arquivo:** `webview-app/src/types/canvas.ts`
- **Ação:** Espelhar exatamente os tipos do backend
- **Dependência:** step 1.1

#### Step 1.3 - Adicionar propriedades específicas ao modelo
- **Arquivos:** `src/components/ComponentModel.ts`, `webview-app/src/types/canvas.ts`
- **Ação:** Estender `ComponentModel` / `CanvasComponent` com props condicionais:
  ```typescript
  // Adicionar ao modelo
  selected?: boolean;        // JCheckBox, JRadioButton
  items?: string[];          // JComboBox, JList
  value?: number;            // JProgressBar, JSlider, JSpinner
  min?: number;              // JProgressBar, JSlider, JSpinner
  max?: number;              // JProgressBar, JSlider, JSpinner
  orientation?: "horizontal" | "vertical";  // JSeparator
  ```
- **Dependência:** step 1.2

### Fase 2: Cadeia de Criação no Canvas

#### Step 2.1 - Atualizar Paleta
- **Arquivo:** `webview-app/src/components/Palette.tsx`
- **Ação:**
  - Adicionar 7 itens faltantes: `JRadioButton`, `JComboBox`, `JList`, `JProgressBar`, `JSlider`, `JSpinner`, `JSeparator`
  - Importar ícones adequados do `lucide-react`:
    - `JRadioButton` → `Circle` ou `CircleDot`
    - `JComboBox` → `ChevronDown`
    - `JList` → `List`
    - `JProgressBar` → `Loader` ou `Gauge`
    - `JSlider` → `SlidersHorizontal` ou `Gauge`
    - `JSpinner` → `Calculator` ou `Hash`
    - `JSeparator` → `Minus` ou `SeparatorHorizontal`
- **Dependência:** step 1.2

#### Step 2.2 - Corrigir e estender mapeamentos
- **Arquivo:** `webview-app/src/hooks/useCanvasDragDrop.ts`
- **Ação:**
  - **CORRIGIR:** `JPanel → Panel` (era `Label`), `JCheckBox → CheckBox` (era `Button`)
  - **ADICIONAR:** Todos os novos mapeamentos
  ```typescript
  const PALETTE_TO_COMPONENT_TYPE: Record<string, ComponentType> = {
    JPanel: "Panel",
    JButton: "Button",
    JLabel: "Label",
    JTextField: "TextField",
    JTextArea: "TextArea",
    JCheckBox: "CheckBox",
    JRadioButton: "RadioButton",
    JComboBox: "ComboBox",
    JList: "List",
    JProgressBar: "ProgressBar",
    JSlider: "Slider",
    JSpinner: "Spinner",
    JSeparator: "Separator",
  };
  ```
- **Dependência:** step 1.2

#### Step 2.3 - Estender defaults por tipo
- **Arquivo:** `webview-app/src/lib/componentDefaults.ts`
- **Ação:** Adicionar entradas para todos os 14 tipos com props e tamanhos adequados:
  - `Panel`: `{ text: "Panel", width: 200, height: 150 }`
  - `CheckBox`: `{ text: "CheckBox", selected: false }`
  - `RadioButton`: `{ text: "RadioButton", selected: false }`
  - `ComboBox`: `{ items: ["Item 1", "Item 2"], width: 150 }`
  - `List`: `{ items: ["Item 1", "Item 2", "Item 3"], width: 150, height: 80 }`
  - `ProgressBar`: `{ value: 50, min: 0, max: 100, width: 200, height: 24 }`
  - `Slider`: `{ value: 50, min: 0, max: 100, width: 200, height: 40 }`
  - `Spinner`: `{ value: 0, min: 0, max: 100, width: 100 }`
  - `Separator`: `{ orientation: "horizontal", width: 200, height: 10 }`
- **Dependência:** step 1.3

### Fase 3: Geração Java

#### Step 3.1 - Estender mapeamento de classes Swing
- **Arquivo:** `src/generator/JavaGenerator.ts`
- **Ação:** Atualizar `SWING_CLASS_MAP`:
  ```typescript
  const SWING_CLASS_MAP: Record<ComponentType, string> = {
    Panel: "JPanel",
    Button: "JButton",
    Label: "JLabel",
    TextField: "JTextField",
    PasswordField: "JPasswordField",
    TextArea: "JTextArea",
    CheckBox: "JCheckBox",
    RadioButton: "JRadioButton",
    ComboBox: "JComboBox<String>",
    List: "JList<String>",
    ProgressBar: "JProgressBar",
    Slider: "JSlider",
    Spinner: "JSpinner",
    Separator: "JSeparator",
  };
  ```
- **Dependência:** step 1.1

#### Step 3.2 - Estender geração de listeners
- **Arquivo:** `src/generator/JavaGenerator.ts`
- **Ação:** Atualizar `getListenerCode` para novos tipos com eventos:
  - `CheckBox`: `addActionListener` ou `addItemListener`
  - `RadioButton`: `addActionListener`
  - `ComboBox`: `addActionListener` ou `addItemListener`
  - `List`: `addListSelectionListener`
  - `Slider`: `addChangeListener`
  - `Spinner`: `addChangeListener`
- **Dependência:** step 3.1

#### Step 3.3 - Gerar código de inicialização de props específicas
- **Arquivo:** `src/generator/JavaGenerator.ts`
- **Ação:** Adicionar código para props específicas na geração do componente:
  - `setSelected(boolean)` para CheckBox/RadioButton
  - `setModel(...)` ou `addItem(...)` para ComboBox/List
  - `setValue(int)` / `setMinimum(int)` / `setMaximum(int)` para ProgressBar/Slider/Spinner
  - `setOrientation(...)` para Separator
- **Dependência:** step 3.2

### Fase 4: Configuração e Schema

#### Step 4.1 - Atualizar schema JSON
- **Arquivo:** `schemas/swingbuilder.schema.json`
- **Ação:** Adicionar todos os 14 tipos na propriedade `components`:
  ```json
  "components": {
    "properties": {
      "Panel": { "$ref": "#/definitions/componentDefaults" },
      "Button": { "$ref": "#/definitions/componentDefaults" },
      // ... repetir para todos os tipos
    }
  }
  ```
- **Dependência:** step 1.1

#### Step 4.2 - Atualizar ConfigReader
- **Arquivo:** `src/config/ConfigReader.ts`
- **Ação:** Validar que o leitor aceita os novos tipos de componente
- **Dependência:** step 4.1

#### Step 4.3 - Atualizar template de configuração
- **Arquivo:** `src/config/initConfigCommand.ts`
- **Ação:** Incluir exemplos de configuração para todos os tipos no template gerado
- **Dependência:** step 4.1

### Fase 5: Painel de Propriedades (MVP)

#### Step 5.1 - Campos condicionais no PropertiesPanel
- **Arquivo:** `webview-app/src/components/PropertiesPanel/index.tsx`
- **Ação:** Adicionar campos condicionais por tipo:
  - **Todos:** text, backgroundColor, textColor, fontFamily, fontSize
  - **CheckBox/RadioButton:** selected (checkbox)
  - **ComboBox/List:** items (textarea com linhas)
  - **ProgressBar/Slider/Spinner:** value, min, max (number inputs)
  - **Separator:** orientation (select: horizontal/vertical)
- **Dependência:** step 1.3 e step 2.3

### Fase 6: Verificação e Validação

#### Step 6.1 - Verificação automatizada
- **Ações:**
  - `pnpm run compile`: build sem erros de tipo
  - Validar roundtrip: paleta → drag → drop → modelo → Estado sincronizado
  - Verificar consistência de tipos em todas as camadas
- **Dependência:** steps 3.3, 4.2, 5.1

#### Step 6.2 - Teste manual guiado
- **Ações:**
  1. Abrir webview no VS Code
  2. Testar drag & drop de todos os 13 componentes da paleta
  3. Verificar se cada componente recebe defaults corretos
  4. Editar propriedades específicas no painel
  5. Gerar código Java e verificar sintaxe
- **Dependência:** step 6.1

#### Step 6.3 - Validação de compilação Java
- **Ação:** Gerar classe Java com todos os tipos e compilar com `javac`
- **Dependência:** step 6.2

---

## 📁 Relevant files

| Arquivo                                                | Propósito                                               |
| ------------------------------------------------------ | ------------------------------------------------------- |
| `src/components/ComponentModel.ts`                     | Fonte de verdade de tipos da extensão (`ComponentType`) |
| `webview-app/src/types/canvas.ts`                      | Espelho de tipos no frontend do webview                 |
| `webview-app/src/components/Palette.tsx`               | Itens exibidos e origem do drag de componentes          |
| `webview-app/src/hooks/useCanvasDragDrop.ts`           | Mapping Swing → tipo interno e criação no drop          |
| `webview-app/src/lib/componentDefaults.ts`             | Props e tamanhos padrão por tipo                        |
| `webview-app/src/components/PropertiesPanel/index.tsx` | Campos editáveis de propriedades no painel              |
| `src/generator/JavaGenerator.ts`                       | Mapeamento para classes Swing e listeners na geração    |
| `schemas/swingbuilder.schema.json`                     | Schema de validação da configuração                     |
| `src/config/ConfigReader.ts`                           | Leitura/validação de tipos suportados                   |
| `src/config/initConfigCommand.ts`                      | Template inicial de configuração do projeto             |
| `tasks/swing-components/requirements.md`               | Referência de escopo funcional da task                  |

---

## ✅ Verification Checklist

| #   | Verificação              | Critério de Sucesso                              |
| --- | ------------------------ | ------------------------------------------------ |
| 1   | Build do monorepo        | `pnpm run compile` sem erros                     |
| 2   | Tipos sincronizados      | `ComponentType` idêntico em backend e frontend   |
| 3   | Paleta completa          | 13 itens visíveis e arrastáveis                  |
| 4   | Mapeamentos corretos     | `PALETTE_TO_COMPONENT_TYPE` sem erros            |
| 5   | Defaults aplicados       | Cada tipo recebe props e tamanho adequados       |
| 6   | Propriedades específicas | Painel exibe campos condicionais por tipo        |
| 7   | Schema válido            | JSON Schema aceita configuração com novos tipos  |
| 8   | Java gerado compila      | `javac` compila classe com todos os componentes  |
| 9   | Listeners corretos       | Tipos com evento geram código de listener válido |

---

## 📌 Decisions

| Decisão                         | Justificativa                                                               |
| ------------------------------- | --------------------------------------------------------------------------- |
| `JFrame` não entra na paleta    | Janela raiz é implícita, gerada automaticamente                             |
| Renderização genérica no canvas | MVP funcional; fidelidade visual por tipo é out-of-scope                    |
| `PasswordField` mantido         | Já implementado, não faz parte do scope de requisitos mas não será removido |
| Props condicionais no modelo    | Evita explosão de tipos, mantém flexibilidade                               |

---

## 🚀 Further considerations

1. **Matriz de eventos:** Criar documento `docs/component-events.md` mapeando `tipo → propriedades → listeners suportados` para reduzir regressão em expansões futuras

2. **Registro centralizado:** Avaliar refatoração para um `ComponentRegistry` único que sirva paleta, defaults, mapeamentos e gerador, reduzindo duplicação

3. **Schema-driven UI:** Se props específicas crescerem, considerar geração do PropertiesPanel a partir do schema JSON

4. **Testes automatizados:** Adicionar testes unitários para:
   - `PALETTE_TO_COMPONENT_TYPE` cobertura completa
   - `componentDefaults.ts` todos os tipos com defaults
   - `JavaGenerator.ts` geração de código para cada tipo

5. **Acessibilidade:** Revisar ícones da paleta para garantir contraste e semântica adequados
