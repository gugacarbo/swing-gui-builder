# PRD: Expandir Componentes Swing no Builder

## 1. Introdução/Overview

O Swing GUI Builder atualmente suporta apenas 5 tipos de componentes Swing (`Button`, `Label`, `TextField`, `PasswordField`, `TextArea`). Este PRD define a expansão para 14 tipos, adicionando suporte a containers, componentes de seleção, listas, progresso e separadores visuais.

**Problema:** Usuários não conseguem construir interfaces Swing completas porque componentes essenciais como painéis, checkboxes, radio buttons, dropdowns, listas, barras de progresso e sliders não estão disponíveis no builder.

**Solução:** Adicionar 9 novos tipos de componentes com suporte completo em todas as camadas: modelagem de tipos, paleta, drag & drop, propriedades específicas e geração de código Java válido.

---

## 2. Goals

- ✅ Suportar 14 tipos de componentes Swing no builder (9 novos + 5 existentes)
- ✅ Corrigir mapeamentos quebrados (`JPanel` e `JCheckBox`)
- ✅ Implementar propriedades específicas por tipo (`selected`, `items`, `value`, `min`, `max`, `orientation`)
- ✅ Garantir geração de código Java válido para todos os tipos
- ✅ Manter renderização genérica no canvas (MVP funcional)

---

## 3. User Stories

### US-001: Estender tipos de componente no backend

**Description:** Como desenvolvedor da extensão, preciso definir os novos tipos de componentes no modelo do backend para que o sistema reconheça e processe os novos componentes Swing.

**Acceptance Criteria:**

- [ ] `src/components/ComponentModel.ts` define `ComponentType` com 14 tipos: `Panel`, `Button`, `Label`, `TextField`, `PasswordField`, `TextArea`, `CheckBox`, `RadioButton`, `ComboBox`, `List`, `ProgressBar`, `Slider`, `Spinner`, `Separator`
- [ ] Tipo `ComponentModel` estendido com props condicionais: `selected?: boolean`, `items?: string[]`, `value?: number`, `min?: number`, `max?: number`, `orientation?: "horizontal" | "vertical"`
- [ ] `pnpm run compile` executa sem erros de tipo

---

### US-002: Sincronizar tipos no frontend do webview

**Description:** Como desenvolvedor da extensão, preciso espelhar os tipos do backend no frontend para garantir consistência entre extensão e webview.

**Acceptance Criteria:**

- [ ] `webview-app/src/types/canvas.ts` define `ComponentType` idêntico ao backend (14 tipos)
- [ ] Interface `CanvasComponent` inclui todas as props condicionais
- [ ] `pnpm run compile` executa sem erros de tipo

---

### US-003: Atualizar paleta com novos componentes

**Description:** Como usuário do builder, quero ver todos os 13 componentes disponíveis na paleta para arrastar para o canvas.

**Acceptance Criteria:**

- [ ] `webview-app/src/components/Palette.tsx` exibe 13 itens: `JPanel`, `JButton`, `JLabel`, `JTextField`, `JTextArea`, `JCheckBox`, `JRadioButton`, `JComboBox`, `JList`, `JProgressBar`, `JSlider`, `JSpinner`, `JSeparator`
- [ ] Ícones do `lucide-react` atribuídos: `JRadioButton → Circle`, `JComboBox → ChevronDown`, `JList → List`, `JProgressBar → Loader`, `JSlider → SlidersHorizontal`, `JSpinner → Hash`, `JSeparator → Minus`
- [ ] Todos os itens são arrastáveis

---

### US-004: Corrigir e estender mapeamentos de drag & drop

**Description:** Como usuário do builder, quero arrastar componentes da paleta para o canvas e criar o tipo correto.

**Acceptance Criteria:**

- [ ] `webview-app/src/hooks/useCanvasDragDrop.ts` define `PALETTE_TO_COMPONENT_TYPE` com 13 mapeamentos corretos
- [ ] `JPanel → Panel` (corrigido de `Label`)
- [ ] `JCheckBox → CheckBox` (corrigido de `Button`)
- [ ] Novos mapeamentos: `JRadioButton → RadioButton`, `JComboBox → ComboBox`, `JList → List`, `JProgressBar → ProgressBar`, `JSlider → Slider`, `JSpinner → Spinner`, `JSeparator → Separator`
- [ ] Drop cria componente com tipo e props corretos

---

### US-005: Definir defaults por tipo de componente

**Description:** Como usuário do builder, quero que componentes recém-criados tenham valores padrão adequados ao seu tipo.

**Acceptance Criteria:**

- [ ] `webview-app/src/lib/componentDefaults.ts` define defaults para todos os 14 tipos
- [ ] `Panel`: `{ text: "Panel", width: 200, height: 150 }`
- [ ] `CheckBox`: `{ text: "CheckBox", selected: false }`
- [ ] `RadioButton`: `{ text: "RadioButton", selected: false }`
- [ ] `ComboBox`: `{ items: ["Item 1", "Item 2"], width: 150 }`
- [ ] `List`: `{ items: ["Item 1", "Item 2", "Item 3"], width: 150, height: 80 }`
- [ ] `ProgressBar`: `{ value: 50, min: 0, max: 100, width: 200, height: 24 }`
- [ ] `Slider`: `{ value: 50, min: 0, max: 100, width: 200, height: 40 }`
- [ ] `Spinner`: `{ value: 0, min: 0, max: 100, width: 100 }`
- [ ] `Separator`: `{ orientation: "horizontal", width: 200, height: 10 }`

---

### US-006: Estender geração de código Java - Classes Swing

**Description:** Como usuário do builder, quero gerar código Java que use as classes Swing corretas para cada tipo de componente.

**Acceptance Criteria:**

- [ ] `src/generator/JavaGenerator.ts` atualiza `SWING_CLASS_MAP` com 14 mapeamentos
- [ ] `Panel → JPanel`, `CheckBox → JCheckBox`, `RadioButton → JRadioButton`, `ComboBox → JComboBox<String>`, `List → JList<String>`, `ProgressBar → JProgressBar`, `Slider → JSlider`, `Spinner → JSpinner`, `Separator → JSeparator`
- [ ] Mapeamentos mantêm tipos existentes: `Button`, `Label`, `TextField`, `PasswordField`, `TextArea`

---

### US-007: Estender geração de código Java - Inicialização de props

**Description:** Como usuário do builder, quero gerar código Java que configure corretamente as propriedades específicas de cada componente.

**Acceptance Criteria:**

- [ ] Código gerado inclui `setSelected(boolean)` para `CheckBox` e `RadioButton`
- [ ] Código gerado inclui modelo de dados para `ComboBox` e `List` (`DefaultComboBoxModel`, `DefaultListModel`)
- [ ] Código gerado inclui `setValue(int)`, `setMinimum(int)`, `setMaximum(int)` para `ProgressBar`, `Slider`, `Spinner`
- [ ] Código gerado inclui `setOrientation(SwingConstants.HORIZONTAL/VERTICAL)` para `Separator`

---

### US-008: Estender geração de código Java - Listeners

**Description:** Como usuário do builder, quero gerar código Java que adicione listeners apropriados a componentes interativos.

**Acceptance Criteria:**

- [ ] `CheckBox` gera `addActionListener` ou `addItemListener`
- [ ] `RadioButton` gera `addActionListener`
- [ ] `ComboBox` gera `addActionListener` ou `addItemListener`
- [ ] `List` gera `addListSelectionListener`
- [ ] `Slider` gera `addChangeListener`
- [ ] `Spinner` gera `addChangeListener`

---

### US-009: Atualizar schema de configuração

**Description:** Como desenvolvedor da extensão, preciso atualizar o schema JSON para aceitar configurações para todos os tipos de componentes.

**Acceptance Criteria:**

- [ ] `schemas/swingbuilder.schema.json` define defaults para todos os 14 tipos em `components.properties`
- [ ] Schema referencia `#/definitions/componentDefaults` para cada tipo
- [ ] `pnpm run compile` executa sem erros

---

### US-010: Atualizar template de configuração inicial

**Description:** Como desenvolvedor da extensão, preciso fornecer um template de configuração que demonstre todos os tipos suportados.

**Acceptance Criteria:**

- [ ] `src/config/initConfigCommand.ts` gera template com exemplos para todos os 14 tipos
- [ ] Template inclui pelo menos um componente de cada categoria (container, entrada, seleção, lista, progresso, separador)

---

### US-011: Adicionar campos condicionais no painel de propriedades

**Description:** Como usuário do builder, quero editar propriedades específicas de cada tipo de componente no painel de propriedades.

**Acceptance Criteria:**

- [ ] `webview-app/src/components/PropertiesPanel/index.tsx` exibe campos condicionais por tipo
- [ ] **Todos os tipos:** `text`, `backgroundColor`, `textColor`, `fontFamily`, `fontSize`
- [ ] **CheckBox/RadioButton:** campo `selected` (checkbox)
- [ ] **ComboBox/List:** campo `items` (textarea multiline)
- [ ] **ProgressBar/Slider/Spinner:** campos `value`, `min`, `max` (number inputs)
- [ ] **Separator:** campo `orientation` (select: horizontal/vertical)
- [ ] Alterações refletem no modelo em tempo real

---

### US-012: Validação end-to-end da cadeia de componentes

**Description:** Como desenvolvedor da extensão, preciso garantir que todos os componentes funcionem corretamente do drag à geração de código.

**Acceptance Criteria:**

- [ ] `pnpm run compile` executa sem erros
- [ ] Roundtrip funcional: paleta → drag → canvas → modelo → estado sincronizado para todos os 13 componentes
- [ ] `PALETTE_TO_COMPONENT_TYPE` tem cobertura 100% dos itens da paleta
- [ ] `componentDefaults.ts` tem defaults para todos os 14 tipos
- [ ] `SWING_CLASS_MAP` tem mapeamento para todos os 14 tipos

---

### US-013: Validação de compilação Java

**Description:** Como usuário do builder, quero ter garantia de que o código Java gerado compila corretamente.

**Acceptance Criteria:**

- [ ] Classe Java gerada com todos os 14 tipos de componentes compila com `javac` sem erros
- [ ] Código gerado segue sintaxe Java válida
- [ ] Imports corretos incluídos (`javax.swing.*`, `java.awt.*`)

---

## 4. Functional Requirements

**FR-1:** O sistema deve reconhecer 14 tipos de componentes Swing: `Panel`, `Button`, `Label`, `TextField`, `PasswordField`, `TextArea`, `CheckBox`, `RadioButton`, `ComboBox`, `List`, `ProgressBar`, `Slider`, `Spinner`, `Separator`.

**FR-2:** O sistema deve exibir 13 componentes na paleta (excluindo `JFrame` que é implícito).

**FR-3:** O sistema deve mapear corretamente cada item da paleta para seu tipo interno correspondente.

**FR-4:** O sistema deve fornecer valores padrão adequados para cada tipo de componente ao criá-lo no canvas.

**FR-5:** O sistema deve suportar propriedades específicas por tipo:
   - `selected: boolean` para `CheckBox` e `RadioButton`
   - `items: string[]` para `ComboBox` e `List`
   - `value: number` para `ProgressBar`, `Slider`, `Spinner`
   - `min/max: number` para `ProgressBar`, `Slider`, `Spinner`
   - `orientation: "horizontal" | "vertical"` para `Separator`

**FR-6:** O sistema deve gerar código Java com classes Swing corretas para cada tipo.

**FR-7:** O sistema deve gerar código de inicialização de propriedades específicas.

**FR-8:** O sistema deve gerar listeners apropriados para componentes interativos.

**FR-9:** O painel de propriedades deve exibir campos condicionais de acordo com o tipo do componente selecionado.

**FR-10:** O schema JSON deve aceitar configurações de defaults para todos os 14 tipos.

**FR-11:** O template de configuração inicial deve incluir exemplos de todos os tipos.

---

## 5. Non-Goals (Out of Scope)

❌ **Renderização visual específica por tipo:** Canvas usará renderização genérica para todos os componentes (MVP funcional, não fidelidade visual).

❌ **JFrame na paleta:** Janela raiz é implícita, gerada automaticamente no código Java final.

❌ **Remoção de `PasswordField`:** Componente já implementado, será mantido apesar de não estar no escopo original.

❌ **Layout managers complexos:** Suporte a `BorderLayout`, `GridBagLayout`, etc. não incluído.

❌ **Eventos customizados:** Apenas listeners padrão serão gerados.

❌ **Edição de propriedades avançadas:** Propriedades como borders, tooltips, atalhos de teclado não incluídas.

---

## 6. Design Considerations

### UI/UX

- **Paleta:** Usar ícones do `lucide-react` consistentes com a linguagem visual existente
- **Painel de Propriedades:** Campos condicionais devem aparecer/desaparecer suavemente
- **Canvas:** Componentes renderizados de forma genérica com nome e ícone representativo

### Ícones Sugeridos (lucide-react)

| Componente   | Ícone                   |
| ------------ | ----------------------- |
| JPanel       | `Square` (existente)    |
| JRadioButton | `Circle` ou `CircleDot` |
| JComboBox    | `ChevronDown`           |
| JList        | `List`                  |
| JProgressBar | `Loader` ou `Gauge`     |
| JSlider      | `SlidersHorizontal`     |
| JSpinner     | `Hash`                  |
| JSeparator   | `Minus`                 |

---

## 7. Technical Considerations

### Dependências

- `lucide-react` para ícones (já instalado)
- Nenhuma nova dependência necessária

### Arquivos Afetados

| Camada   | Arquivo                                       |
| -------- | --------------------------------------------- |
| Backend  | `src/components/ComponentModel.ts`            |
| Backend  | `src/generator/JavaGenerator.ts`              |
| Backend  | `src/config/ConfigReader.ts`                  |
| Backend  | `src/config/initConfigCommand.ts`             |
| Frontend | `webview-app/src/types/canvas.ts`             |
| Frontend | `webview-app/src/components/Palette.tsx`      |
| Frontend | `webview-app/src/hooks/useCanvasDragDrop.ts`  |
| Frontend | `webview-app/src/lib/componentDefaults.ts`    |
| Frontend | `webview-app/src/components/PropertiesPanel/` |
| Schema   | `schemas/swingbuilder.schema.json`            |

### Riscos Técnicos

1. **Inconsistência de tipos:** Mitigado mantendo `ComponentType` sincronizado entre backend e frontend
2. **Código Java inválido:** Mitigado com teste de compilação automatizado (US-013)
3. **Regressão em tipos existentes:** Mitigado mantendo tipos existentes sem alteração

### Performance

- Nenhum impacto significativo esperado (novos tipos não aumentam complexidade algorítmica)

---

## 8. Success Metrics

| Métrica                       | Meta                            |
| ----------------------------- | ------------------------------- |
| Tipos suportados              | 14 tipos                        |
| Cobertura da paleta           | 13 itens arrastáveis            |
| Correção de mapeamentos       | 100% (0 mapeamentos quebrados)  |
| Código Java gerado            | Compila sem erros               |
| Build do projeto              | `pnpm run compile` sem erros    |
| Props específicas             | 6 propriedades novas suportadas |
| Campos condicionais no painel | 5 categorias de campos por tipo |

---

## 9. Open Questions

⚠️ Nenhuma questão em aberto. O plano de implementação está completo e detalhado em `tasks/swing-components/plan.md`.

---

## 10. References

- **Plano de Implementação:** `tasks/swing-components/plan.md`
- **Requisitos Originais:** `tasks/swing-components/requirements.md`
- **Schema Atual:** `schemas/swingbuilder.schema.json`

---

## Checklist

- [x] Analisado plano de implementação detalhado
- [x] User stories são pequenas e específicas
- [x] Requisitos funcionais são numerados e inequívocos
- [x] Seção de non-goals define limites claros
- [x] Criada pasta `tasks/expand-swing-components/`
- [x] Salvo em `tasks/expand-swing-components/prd-expand-swing-components.md`
