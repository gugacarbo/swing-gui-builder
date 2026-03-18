# Swing GUI Builder - Features Completas

---

## 📋 Visão Geral

O **Swing GUI Builder** é uma extensão para VS Code que permite criar interfaces gráficas Java Swing de forma visual, utilizando drag-and-drop, sem necessidade de escrever código manualmente. A extensão gera automaticamente código Java pronto para uso.

---

## 🎨 Editor Visual (Canvas)

### Canvas Interativo
- **Área de design visual** para criar interfaces Swing
- **Redimensionamento de componentes** com handles visuais (8 pontos de controle)
- **Seleção de componentes** com clique
- **Drag-and-drop** de componentes da paleta para o canvas
- **Grid de snap** para alinhamento preciso
- **Zoom visual** (simulação em escala real)

### Dimensões do Frame
- Largura configurável (padrão: 1024px)
- Altura configurável (padrão: 768px)
- Redimensionamento dinâmico

---

## 🧩 Componentes Suportados

### Componentes Básicos

| Componente        | Classe Swing     | Descrição                          |
| ----------------- | ---------------- | ---------------------------------- |
| **Panel**         | `JPanel`         | Container para agrupar componentes |
| **Button**        | `JButton`        | Botão de ação                      |
| **Label**         | `JLabel`         | Texto estático                     |
| **TextField**     | `JTextField`     | Campo de texto de linha única      |
| **PasswordField** | `JPasswordField` | Campo de senha (texto mascarado)   |
| **TextArea**      | `JTextArea`      | Campo de texto multilinha          |

### Componentes de Seleção

| Componente      | Classe Swing        | Descrição        |
| --------------- | ------------------- | ---------------- |
| **CheckBox**    | `JCheckBox`         | Caixa de seleção |
| **RadioButton** | `JRadioButton`      | Botão de opção   |
| **ComboBox**    | `JComboBox<String>` | Lista dropdown   |
| **List**        | `JList<String>`     | Lista de itens   |

### Componentes de Valor

| Componente      | Classe Swing   | Descrição           |
| --------------- | -------------- | ------------------- |
| **ProgressBar** | `JProgressBar` | Barra de progresso  |
| **Slider**      | `JSlider`      | Controle deslizante |
| **Spinner**     | `JSpinner`     | Seletor numérico    |
| **Separator**   | `JSeparator`   | Separador visual    |

### Containers e Menus

| Componente   | Classe Swing | Descrição               |
| ------------ | ------------ | ----------------------- |
| **MenuBar**  | `JMenuBar`   | Barra de menu principal |
| **Menu**     | `JMenu`      | Menu dropdown           |
| **MenuItem** | `JMenuItem`  | Item de menu            |
| **ToolBar**  | `JToolBar`   | Barra de ferramentas    |

---

## 🎛️ Painel de Propriedades

### Propriedades Gerais (Todos os Componentes)
- **Text** - Texto exibido no componente
- **Font Family** - Família da fonte (Arial, Consolas, etc.)
- **Font Size** - Tamanho da fonte (1-200)
- **X** - Posição horizontal (0-9999)
- **Y** - Posição vertical (0-9999)
- **Width** - Largura (48-2000)
- **Height** - Altura (28-2000)
- **Background** - Cor de fundo (color picker hexadecimal)
- **Foreground** - Cor do texto (color picker hexadecimal)

### Propriedades Específicas por Tipo

#### CheckBox / RadioButton
- **Selected** - Estado de seleção (checkbox)

#### ComboBox / List
- **Items** - Lista de itens (múltiplas linhas, um item por linha)

#### ProgressBar / Slider / Spinner
- **Value** - Valor atual (-9999 a 9999)
- **Min** - Valor mínimo (-9999 a 9999)
- **Max** - Valor máximo (-9999 a 9999)

#### ToolBar
- **Position** - Posicionamento fixo:
  - Top (north)
  - Bottom (south)
  - Left (west)
  - Right (east)

---

## 📁 Painel de Hierarquia

### Visualização em Árvore
- Exibe estrutura hierárquica de todos os componentes
- **Indentação visual** para componentes aninhados
- **Expandir/Colapsar** nós da árvore
- **Persistência** do estado de colapso no localStorage

### Drag-and-Drop na Hierarquia
- [NOT WORKING] **Reordenação de componentes** arrastando na árvore
- [NOT WORKING] **Mudança de parentesco** (mover componente para outro container)
- [NOT WORKING] **Indicadores visuais** de drop target
- **Restrições** de movimentação (componentes não podem ser movidos para seus descendentes)
- [NOT WORKING] **Desassociação** de componentes (mover para raiz)
---

## 🛠️ Barra de Ferramentas (Toolbar)

| Ação             | Descrição                      | Atalho |
| ---------------- | ------------------------------ | ------ |
| **Undo**         | Desfazer última ação           | Ctrl+Z |
| **Redo**         | Refazer ação desfeita          | Ctrl+Y |
| **Delete**       | Remover componente selecionado | Delete |
| **Preview Code** | Visualizar código Java gerado  | -      |
| **Generate**     | Gerar arquivos Java finais     | -      |

---

## ⌨️ Atalhos de Teclado

- [ADJUST] - HISTORY DE MOVIMENTAÇÃO SALVANDO A CADA MOVIMENTO, NÃO APENAS AO SOLTAR
- **Ctrl+Z** - Desfazer
- **Ctrl+Y** - Refazer
- **Ctrl+Shift+Z** - Refazer (alternativo)
- **Delete** - Excluir componente selecionado
- **Backspace** - Excluir componente selecionado
- [TODO] **Ctrl+S** - Salvar layout atual
---

## 💾 Persistência e Arquivos

### Salvar Layout
- **Arquivo:** `.swingbuilder-layout.json`
- **Localização:** Raiz do workspace
- **Conteúdo:** Estado completo do canvas (classe, dimensões, componentes)
- **Comando:** `Swing GUI Builder: Save`

### Abrir Layout
- Lê arquivo `.swingbuilder-layout.json` do workspace
- Restaura estado completo do canvas
- **Comando:** `Swing GUI Builder: Open`
- [TODO] Criar novo layout se arquivo não existir, atualmente exibe erro

### Formato do Estado (CanvasState)
```json
{
  "className": "MainWindow",
  "frameWidth": 800,
  "frameHeight": 600,
  "components": [...]
}
```

---

## ⚙️ Configuração

### Configuração Global (VS Code Settings)

Configurações acessíveis via `Ctrl+,` pesquisando "Swing GUI Builder":

| Configuração             | Padrão              | Descrição                    |
| ------------------------ | ------------------- | ---------------------------- |
| `defaultBackgroundColor` | `#FFFFFF`           | Cor de fundo padrão          |
| `defaultTextColor`       | `#000000`           | Cor de texto padrão          |
| `defaultFontFamily`      | `Arial`             | Família de fonte padrão      |
| `defaultFontSize`        | `12`                | Tamanho de fonte padrão      |
| `outputDirectory`        | `swing/components/` | Diretório de saída para Java |

### Configuração por Componente

Cada tipo de componente pode ter suas próprias configurações:

```
swingGuiBuilder.components.<Tipo>.defaultBackgroundColor
swingGuiBuilder.components.<Tipo>.defaultTextColor
swingGuiBuilder.components.<Tipo>.defaultFontFamily
swingGuiBuilder.components.<Tipo>.defaultFontSize
```

### Configuração de Projeto (.swingbuilder.json)

Arquivo opcional na raiz do projeto para configurações específicas:

```json
{
  "defaultBackgroundColor": "#FFFFFF",
  "defaultTextColor": "#000000",
  "defaultFontFamily": "Arial",
  "defaultFontSize": 12,
  "outputDirectory": "swing/components/",
  "components": {
    "Panel": { "backgroundColor": "#F5F5F5" },
    "Button": { "backgroundColor": "#4A90E2", "textColor": "#FFFFFF" },
    "Label": { "textColor": "#222222" },
    "TextField": { "fontFamily": "Consolas", "fontSize": 13 }
  }
}
```

**Comando para criar:** `Swing GUI Builder: Init Project Config`

### Schema de Validação

Schema JSON disponível em `schemas/swingbuilder.schema.json` para autocompletar e validar o arquivo `.swingbuilder.json`.

---

## 🔧 Comandos da Extensão

| Comando                 | ID                           | Descrição                     |
| ----------------------- | ---------------------------- | ----------------------------- |
| **New Window**          | `swingGuiBuilder.newWindow`  | Criar nova janela/canvas      |
| **Generate**            | `swingGuiBuilder.generate`   | Gerar arquivos Java           |
| **Save**                | `swingGuiBuilder.save`       | Salvar layout em JSON         |
| **Open**                | `swingGuiBuilder.open`       | Abrir layout salvo            |
| **Init Project Config** | `swingGuiBuilder.initConfig` | Criar arquivo de configuração |

---

## 🚀 Geração de Código Java

### Recursos de Geração

- **Geração automática de classes Java** válidas e compiláveis
- [NOT WORKING] **Detecção automática de estrutura de projeto:** (Não está inserindo o package nos arquivos gerados, mesmo quando detecta a estrutura)
  - Maven/Gradle (`src/main/java`)
  - Projeto simples (`src`)
- **Inferência automática de package** baseada no diretório de saída
- **Classes customizadas** para componentes complexos
- [NOT WORKING] **Métodos de evento** (stubs) com nomes únicos [Não está aparecendo na arvore de configurações dos componentes]

### Estrutura de Arquivos Gerados

```
swing/components/
├── MainWindow.java           # Classe principal do JFrame
├── CustomPanel1.java         # Classes customizadas (se necessário)
├── CustomPanel2.java
└── ...
```

### Características do Código Gerado

- **Imports automáticos:** `javax.swing.*`, `java.awt.*`
- **Declaração de package** (quando detectável)
- **Variáveis de instância** para cada componente
- **Método de Inicialização** com configurações visuais
- **Layout Managers:** BorderLayout para JFrame, Absolute/Null para Panels
- **Event Listeners:** Stubs para métodos de ação
- **Hierarquia de componentes** respeitada (menus, toolbars, panels)

### Preview de Código

- **Modal de preview** para visualizar código antes de gerar
- **Múltiplos arquivos** exibidos em abas
- **Syntax highlighting** Java

---

## 🎯 Detecção de Projeto Java

### Tipos de Projeto Suportados

| Tipo                | Detecção                             | Diretório de Saída Sugerido |
| ------------------- | ------------------------------------ | --------------------------- |
| **Maven/Gradle**    | `pom.xml` ou `build.gradle` presente | `src/main/java/components`  |
| **Projeto Simples** | Pasta `src` existe                   | `src/components`            |
| **Genérico**        | Sem estrutura detectada              | `swing/components/`         |

---

## 📐 Sistema de Undo/Redo

- **Histórico ilimitado** de alterações
- **Estados completos** do canvas salvos
- **Navegação** para frente e para trás no histórico
- **Reset automático** ao abrir novo layout

---

## 🎨 Interface de Usuário

### Layout da Extensão

```
┌────────────────────────────────────────────────────────────┐
│  [Toolbar: Undo | Redo | Delete | Preview | Generate]      │
├────────────┬───────────────────────────────┬───────────────┤
│            │                               │               │
│  PALETTE   │          CANVAS               │  PROPERTIES   │
│            │                               │               │
│  Components│     [Área de Design Visual]   │  Text         │
│  - JPanel  │                               │  Font         │
│  - JButton │                               │  Position     │
│  - JLabel  │                               │  Size         │
│  - ...     │                               │  Colors       │
│            │                               │               │
│  Containers│                               │               │
│  - JMenuBar│                               │               │
│  - JToolBar│                               │               │
│            │                               │               │
├────────────┴───────────────────────────────┴───────────────┤
│  HIERARCHY (opcional)                                      │
│  Tree view de componentes                                  │
└────────────────────────────────────────────────────────────┘
```

### Tema Visual

- **Integração completa** com tema do VS Code
- **Cores adaptativas** para light/dark mode
- **Variáveis CSS** do VS Code para consistência visual

---

## 🔌 Arquitetura Webview

### Comunicação Extension ↔ Webview

A extensão utiliza uma arquitetura de webview React com comunicação via postMessage:

**Mensagens da Webview → Extension:**
- `stateChanged` - Estado do canvas alterado
- `toolbarCommand` - Comando da toolbar executado

**Mensagens da Extension → Webview:**
- `loadState` - Carregar estado salvo
- `configDefaults` - Configurações padrão
- `previewCodeResponse` - Código preview gerado

### Stack Tecnológica da Webview

- **React 19** com TypeScript
- **Vite** para build
- **TailwindCSS** para estilização
- **shadcn/ui** para componentes UI
- **Lucide React** para ícones

---

## 📊 Hooks e Estado (React)

### Hooks Principais

| Hook                   | Função                                    |
| ---------------------- | ----------------------------------------- |
| `useCanvasState`       | Gerencia estado dos componentes no canvas |
| `useUndoRedo`          | Sistema de undo/redo com histórico        |
| `usePostMessage`       | Comunicação com a extensão                |
| `useExtensionListener` | Recebe mensagens da extensão              |
| `useKeyboardShortcuts` | Atalhos de teclado globais                |
| `useHierarchyDragDrop` | Drag-and-drop na hierarquia               |

---

## 🔄 Fluxos de Trabalho

### Fluxo: Criar Nova Interface

1. `Ctrl+Shift+P` → "Swing GUI Builder: New Window"
2. Digitar nome da classe (ex: `LoginDialog`)
3. Arrastar componentes da Paleta para o Canvas
4. Ajustar propriedades no painel direito
5. Salvar layout (`Save`)
6. Gerar código (`Generate`)

### Fluxo: Editar Interface Existente

1. `Ctrl+Shift+P` → "Swing GUI Builder: Open"
2. Modificar componentes e propriedades
3. Usar Undo/Redo se necessário
4. Salvar e/ou Regenerar código

### Fluxo: Preview de Código

1. Clicar em "Preview Code" na toolbar
2. Visualizar código gerado em cada aba
3. Fechar modal e ajustar se necessário
4. Gerar quando satisfeito

---

## 🏗️ Componentes Customizados

Quando componentes do tipo `Panel` possuem filhos, a extensão gera automaticamente classes customizadas:

```java
// CustomPanel1.java
public class CustomPanel1 extends JPanel {
  public CustomPanel1() {
    setLayout(null);
    // Configuração dos componentes filhos
  }
}
```

---

## 📝 Validação

### Validação de Nome de Classe
- Deve começar com letra, `_` ou `$`
- Apenas letras, dígitos, `_` ou `$` permitidos
- Validação em tempo real no input

### Validação de Propriedades
- Números respeitam intervalos (min/max)
- Valores inválidos são automaticamente corrigidos (clamp)
- Cores devem estar em formato hexadecimal `#RRGGBB`

---

## 🧪 Testes

O projeto possui cobertura de testes automatizados:

- **Testes unitários** para geradores
- **Testes de componentes** React
- **Testes de integração** (extension ↔ webview)
- **Coverage badges** gerados automaticamente

---

## 📦 Dependências

### Extensão (Node.js)
- `vscode` - API do VS Code

### Webview (React)
- `react` / `react-dom`
- `lucide-react` - Ícones
- `tailwindcss` - CSS Framework
- `@radix-ui/*` - Componentes shadcn/ui
- `class-variance-authority` - Variantes de estilo
- `clsx` / `tailwind-merge` - Utilitários de classe

---

## 🎯 Casos de Uso

### Ideal Para:
- Desenvolvedores Java que precisam criar interfaces Swing rapidamente
- Prototipação de UI desktop
- Aprendizado de Java Swing (código gerado como referência)
- Manutenção de aplicações legadas Swing
- Criação de formulários e diálogos simples

### Não Indicado Para:
- Interfaces extremamente complexas com layouts avançados
- Aplicações com requisitos de acessibilidade avançados
- Interfaces que requerem animações complexas

---

## 📚 Documentação Relacionada

- [Architecture](./architecture.md) - Arquitetura técnica da extensão
- [Scripts Contract](./scripts-contract.md) - Contrato de scripts NPM
- [ADR-0001](./adr/ADR-0001-build-verify-scripts-contract.md) - ADR sobre build

---

## 🤝 Contribuindo

Veja o repositório GitHub para diretrizes de contribuição:
https://github.com/gugacarbo/swing-gui-builder

---

## 📄 Licença

MIT License - Veja arquivo [LICENSE](../LICENSE)

---

*Todas as funcionalidades listadas neste documento estão disponíveis na versão atual da extensão Swing GUI Builder para VS Code.*
