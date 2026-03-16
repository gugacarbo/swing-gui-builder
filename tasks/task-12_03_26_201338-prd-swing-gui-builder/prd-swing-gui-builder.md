# PRD: Swing GUI Builder — Extensão VSCode para Java Swing

## 1. Introdução / Visão Geral

Esta extensão para o VS Code oferece um construtor visual (GUI Builder) para aplicações Java com Swing. O desenvolvedor pode arrastar e soltar componentes em um canvas, configurar suas propriedades visuais e de funcionalidade via painel lateral, e gerar automaticamente os arquivos `.java` correspondentes. O objetivo é reduzir o tempo de bootstrap de interfaces Swing e eliminar a necessidade de escrever código boilerplate manualmente.

> **Status:** MVP — projeto ainda não existe. A primeira história de usuário (US-000) cobre a inicialização completa do repositório.

---

## 2. Objetivos

- Permitir a criação visual de janelas Swing com drag-and-drop de componentes
- Suportar os componentes: JFrame (janela principal), JButton, JLabel, JTextField, JPasswordField e JTextArea
- Permitir configuração de propriedades visuais (cor, tamanho, fonte, texto) e de funcionalidade (nome do método de evento) via painel de propriedades
- Gerar múltiplos arquivos `.java`: um por componente customizado + a classe principal da janela
- Oferecer configurações padrão globais (via `settings.json` do VS Code) e por projeto (via `.swingbuilder.json`)
- Entregar um MVP funcional com escopo mínimo e bem definido

---

## 3. Histórias de Usuário

### US-000: Inicializar o projeto da extensão VS Code
**Descrição:** Como desenvolvedor, preciso inicializar o projeto da extensão VS Code com a estrutura correta, dependências e configurações de build para poder começar a desenvolver as funcionalidades. Pesquise a documentação oficial de extensões do VS Code para garantir que a estrutura e configuração estejam alinhadas com as melhores práticas.

**Critérios de Aceitação:**
- [ ] Criar `package.json` com metadados da extensão: nome (`swing-gui-builder`), publisher, versão `0.0.1`, engines `^1.85.0`, activationEvents, contributes
- [ ] Configurar TypeScript (`tsconfig.json`) com target ES2020, module commonjs, strict mode, outDir `out/`
- [ ] Configurar build scripts no `package.json`: `compile`, `watch`, `package`, `lint`
- [ ] Instalar dependências de desenvolvimento: `typescript`, `@types/vscode`, `@types/node`, `@vscode/vsce`, `esbuild`, `@biomejs/biome`
- [ ] Criar `biome.json` com configurações de lint e formatação para o projeto (ver seção 10)
- [ ] Criar estrutura de pastas conforme definida na seção 10:
  ```
  src/
    extension.ts
    canvas/
    components/
    generator/
    config/
  media/
  schemas/
  webview/
  tasks/
  ```
- [ ] Criar `.vscode/launch.json` para debug com F5
- [ ] Criar `.vscodeignore` e `.gitignore`
- [ ] Verificar que a extensão compila sem erros (`pnpm run compile`)
- [ ] Verificar que a extensão pode ser carregada no VS Code em modo debug (F5)
- [ ] `pnpm run lint` passa sem erros

---

### US-001: Abrir o editor visual Swing
**Descrição:** Como desenvolvedor Java, quero abrir um editor canvas dentro do VS Code para montar visualmente minha interface Swing.

**Ao criar um novo canvas, o sistema solicita o nome da classe Java da janela principal (ex: `MainWindow`), com esse valor como sugestão padrão editável.**

**Critérios de Aceitação:**
- [ ] Um comando de paleta `Swing GUI Builder: New Window` exibe um input box pedindo o nome da classe Java (padrão: `MainWindow`, somente caracteres válidos para identificador Java)
- [ ] Após confirmar o nome, uma nova aba WebView é aberta no VS Code
- [ ] A aba exibe um canvas em branco com dimensões padrão (800×600)
- [ ] A aba exibe a paleta de componentes e o painel de propriedades
- [ ] Typecheck/lint passa

---

### US-002: Definir o tamanho da janela
**Descrição:** Como desenvolvedor, quero configurar as dimensões da janela JFrame para que o layout gerado respeite o tamanho desejado.

**Critérios de Aceitação:**
- [ ] Existe um painel de propriedades da janela com campos numéricos de largura e altura
- [ ] Ao alterar os valores, o canvas é redimensionado visualmente em tempo real
- [ ] O tamanho da janela é refletido no código gerado (`frame.setSize(width, height)`)
- [ ] Typecheck/lint passa

---

### US-003: Editar posição e tamanho via painel de propriedades numérico
**Descrição:** Como desenvolvedor, quero ajustar com precisão a posição e o tamanho de um componente via painel de propriedades.

**Critérios de Aceitação:**
- [ ] Ao selecionar um componente no canvas, o painel de propriedades exibe campos: X, Y, Largura, Altura
- [ ] Alterar os valores no painel atualiza a posição/tamanho do componente no canvas em tempo real
- [ ] Os valores são refletidos no código gerado (`component.setBounds(x, y, w, h)`)
- [ ] Typecheck/lint passa

---

### US-004: Adicionar componentes ao canvas por drag-and-drop
**Descrição:** Como desenvolvedor, quero arrastar componentes da paleta e soltá-los no canvas para montar o layout visualmente.

**Critérios de Aceitação:**
- [ ] A paleta exibe os componentes: Button, Label, TextField, PasswordField, TextArea
- [ ] O usuário pode arrastar qualquer componente da paleta para o canvas
- [ ] O componente é renderizado no canvas na posição onde foi solto
- [ ] O componente pode ser movido após ser posicionado (drag no canvas)
- [ ] Typecheck/lint passa

---

### US-005: Configurar propriedades visuais dos componentes
**Descrição:** Como desenvolvedor, quero personalizar a aparência de cada componente para refletir o design da minha aplicação.

**Cores são armazenadas como hex string (`#RRGGBB`) na WebView e convertidas para `new Color(r, g, b)` no momento da geração de código Java.**

**Critérios de Aceitação:**
- [ ] O painel de propriedades expõe: texto/placeholder, cor de fundo (color picker hex), cor do texto (color picker hex), família e tamanho da fonte
- [ ] As alterações são refletidas visualmente no canvas em tempo real
- [ ] Na geração, hex é convertido para RGB: `button.setBackground(new Color(r, g, b))` — ex: `#FF0000` → `new Color(255, 0, 0)`
- [ ] Typecheck/lint passa

---

### US-006: Configurar funcionalidade — nome do método de evento
**Descrição:** Como desenvolvedor, quero definir o nome do método Java que será chamado no evento do componente para que o código gerado inclua o stub do método.

**Quando dois ou mais componentes informam o mesmo nome de método, o gerador cria stubs com sufixo incremental para evitar conflito de nomes na classe gerada (ex: `onButtonClick`, `onButtonClick2`, `onButtonClick3`).**

**Critérios de Aceitação:**
- [ ] O painel de propriedades de JButton exibe um campo "onClick Method Name"
- [ ] O painel de propriedades de JTextField e JPasswordField exibe um campo "onSubmit Method Name"
- [ ] O painel de propriedades de JTextArea exibe um campo "onChange Method Name"
- [ ] O código gerado inclui o listener de evento chamando o método informado (ex: `button.addActionListener(e -> onClickMethod())`)
- [ ] A classe principal gerada inclui um stub `private void onClickMethod() { /* TODO: implement */ }`
- [ ] Se dois componentes usam o mesmo nome de método, o segundo recebe sufixo `2`, o terceiro `3`, e assim por diante (ex: `onAction`, `onAction2`)
- [ ] Caso o campo fique em branco, nenhum listener é gerado para aquele componente
- [ ] Typecheck/lint passa

---

### US-007: Gerar arquivos Java a partir do canvas
**Descrição:** Como desenvolvedor, quero gerar os arquivos `.java` do meu layout Swing com um único comando.

**Se arquivos com o mesmo nome já existirem, o usuário é consultado com opções: sobrescrever um a um, sobrescrever todos, ou cancelar. Antes de sobrescrever, o arquivo original é renomeado para `<nome>_backup.java` no mesmo diretório.**

**Critérios de Aceitação:**
- [ ] Um botão "Generate Code" (ou comando `Swing GUI Builder: Generate`) dispara a geração
- [ ] É gerado um arquivo `<NomeDaClasse>.java` com a classe JFrame principal contendo todos os componentes e seus `setBounds`
- [ ] Para cada componente com propriedades customizadas além do padrão, é gerado um arquivo `.java` separado que estende o componente Swing base (ex: `MyButton.java extends JButton`)
- [ ] O usuário é solicitado a escolher ou confirmar o diretório de saída
- [ ] Se arquivos já existem: exibir diálogo com opções "Sobrescrever", "Sobrescrever todos", "Cancelar"
- [ ] Antes de sobrescrever, o arquivo existente é renomeado para `<nome>_backup.java` no mesmo diretório
- [ ] Os arquivos gerados compilam sem erros com `javac` (testado manualmente)
- [ ] Typecheck/lint passa

---

### US-008: Configurações padrão globais via VS Code Settings
**Descrição:** Como desenvolvedor, quero definir valores padrão para os componentes nas configurações globais do VS Code para não precisar reconfigurar sempre.

**Critérios de Aceitação:**
- [ ] A extensão registra entradas em `contributes.configuration` no `package.json`
- [ ] Configurações disponíveis: cor de fundo padrão, cor do texto padrão, fonte padrão, tamanho de fonte padrão para cada tipo de componente; diretório de saída padrão (default: `swing/components/`)
- [ ] Novos componentes adicionados ao canvas herdam os valores das configurações globais como valores iniciais
- [ ] Typecheck/lint passa

---

### US-009: Override de configurações padrão por projeto via `.swingbuilder.json`
**Descrição:** Como desenvolvedor, quero que um arquivo de configuração local ao projeto sobrescreva os padrões globais para ter diferentes estilos por repositório.

**Critérios de Aceitação:**
- [ ] A extensão detecta e lê um arquivo `.swingbuilder.json` na raiz do workspace aberto
- [ ] As configurações do arquivo local têm precedência sobre as configurações globais do VS Code
- [ ] Um comando `Swing GUI Builder: Init Project Config` cria um `.swingbuilder.json` template na raiz do projeto
- [ ] A extensão disponibiliza um JSON Schema para `.swingbuilder.json` via `jsonValidation` no `package.json`, habilitando autocomplete no VS Code
- [ ] Typecheck/lint passa

---

### US-010: Salvar e reabrir o projeto do canvas
**Descrição:** Como desenvolvedor, quero salvar o estado do canvas para continuar editando o layout em outra sessão.

**Critérios de Aceitação:**
- [ ] Um comando `Swing GUI Builder: Save` salva o estado do canvas em um arquivo `.swingbuilder-layout.json` no workspace
- [ ] Ao abrir o arquivo `.swingbuilder-layout.json` (ou usar `Swing GUI Builder: Open`), o canvas é restaurado com todos os componentes, posições e propriedades
- [ ] O arquivo `.swingbuilder-layout.json` é JSON puro, legível e versionável no git
- [ ] Typecheck/lint passa

---

## 4. Requisitos Funcionais

- **FR-1:** A extensão deve funcionar como uma WebView Tab dentro do VS Code (sem browser externo)
- **FR-2:** O canvas deve usar posicionamento absoluto (`null layout` / `setBounds`) refletindo o layout gerado em Swing
- **FR-3:** Os componentes suportados na versão MVP são: JButton, JLabel, JTextField, JPasswordField, JTextArea
- **FR-4:** Cada componente no canvas deve ter um `variableName` único editável pelo usuário (usado no código gerado como nome da variável Java)
- **FR-5:** O código gerado deve usar `JFrame` com `setLayout(null)` e `setBounds` para posicionamento absoluto
- **FR-6:** O código gerado deve ser Java válido, compatível com Java 8+
- **FR-7:** A extensão deve ler configurações na seguinte ordem de precedência: `.swingbuilder.json` > VS Code `settings.json` > valores hardcoded internos
- **FR-8:** Os stubs de método gerados devem incluir o comentário `// TODO: implement` no corpo
- **FR-9:** O painel de propriedades deve ser exibido lateralmente ao canvas na mesma WebView
- **FR-10:** O arquivo de layout `.swingbuilder-layout.json` deve ser um JSON legível para controle de versão
- **FR-11:** O nome da classe Java da janela principal é definido pelo usuário no momento de criação do canvas (padrão sugerido: `MainWindow`)
- **FR-12:** Cores são armazenadas como hex (`#RRGGBB`) na UI e convertidas para `new Color(r, g, b)` na geração de código
- **FR-13:** Nomes de método de evento duplicados recebem sufixo incremental (`method`, `method2`, `method3`, …)
- **FR-14:** Antes de sobrescrever um arquivo `.java` existente, o original é salvo como `<nome>_backup.java`
- **FR-15:** O linter usado no projeto é o Biome (`@biomejs/biome`)

---

## 5. Não-Objetivos (Fora de Escopo do MVP)

- Suporte a outros frameworks UI além de Java Swing (JavaFX, AWT puro)
- Layout managers automáticos (FlowLayout, GridLayout, BorderLayout, etc.)
- Preview de execução real da janela Swing
- Desfazer/Refazer (Ctrl+Z)
- Múltiplas janelas/telas no mesmo projeto
- Importar e parsear código Java Swing existente
- Internacionalização (i18n) dos componentes gerados
- Temas visuais do próprio editor canvas
- Zoom in/out no canvas

---

## 6. Considerações de Design

- **Stack da WebView:** HTML + CSS + JavaScript vanilla — sem transpilação no frontend da WebView
- **Comunicação:** `vscode.postMessage` / `window.addEventListener('message')` entre WebView e Extension Host para leitura/escrita de arquivos e configurações
- **Canvas:** `<div>` com `position: relative` e componentes filhos com `position: absolute`
- **Paleta de componentes:** barra lateral esquerda dentro da WebView
- **Painel de propriedades:** barra lateral direita dentro da WebView; atualiza ao selecionar componente
- **Seleção de componente:** clique no componente no canvas → destaca com borda e carrega propriedades no painel

---

## 7. Considerações Técnicas

- **Tecnologia da extensão:** TypeScript + VS Code Extension API
- **WebView:** HTML/CSS/JS vanilla; comunicação via `postMessage`
- **Geração de código Java:** template strings TypeScript puras (sem biblioteca externa)
- **Linter/Formatador:** Biome (`@biomejs/biome`) — substitui ESLint e Prettier
- **Schema do `.swingbuilder.json`:** JSON Schema incluído no repositório e referenciado em `package.json > contributes.jsonValidation`
- **Empacotamento:** `@vscode/vsce` para gerar o `.vsix` instalável localmente
- **Package manager:** pnpm
- **Node.js mínimo:** 18+; VS Code Engine mínimo: `^1.85.0`
- **Java:** código gerado compatível com Java 8+

---

## 8. Métricas de Sucesso

- Um desenvolvedor sem experiência prévia com a extensão consegue criar uma janela com 3+ componentes e gerar código Java funcional em menos de 5 minutos
- O código `.java` gerado compila sem erros usando `javac` sem modificações manuais
- As configurações padrão do `.swingbuilder.json` são aplicadas corretamente a novos componentes

---

## 9. Questões em Aberto

Nenhuma. Todas as questões foram resolvidas e incorporadas ao PRD:

| Questão                          | Decisão tomada                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Nome da classe Java da janela    | Perguntado ao criar o canvas; padrão sugerido `MainWindow` (FR-11)                                            |
| Nomes de método duplicados       | Sufixo incremental: `onAction`, `onAction2`, `onAction3` (FR-13, US-006)                                      |
| Formato do color picker          | Hex string `#RRGGBB` na UI, convertido para `new Color(r,g,b)` no gerador (FR-12, US-005)                     |
| Sobrescrever arquivos existentes | Diálogo com "Sobrescrever / Sobrescrever todos / Cancelar" + backup automático `_backup.java` (FR-14, US-007) |
| Zoom no canvas                   | Fora do escopo do MVP (seção 5)                                                                               |

---

## 10. Setup / Estrutura do Projeto

Esta seção descreve a estrutura completa do repositório a ser criado do zero.

### 10.1 Pré-requisitos

- Node.js 18+ instalado
- pnpm instalado globalmente (`npm install -g pnpm`)
- VS Code instalado
- Java JDK 8+ (para testar o código gerado manualmente)

### 10.2 Estrutura de Pastas

```
swing-gui-builder-vscode/
├── src/
│   ├── extension.ts          # Entry point: exporta activate() e deactivate()
│   ├── canvas/
│   │   └── CanvasPanel.ts    # Gerencia o WebviewPanel do canvas
│   ├── components/
│   │   └── ComponentModel.ts # Tipos/interfaces dos componentes do canvas
│   ├── generator/
│   │   └── JavaGenerator.ts  # Geração de código Java a partir do estado do canvas
│   └── config/
│       └── ConfigReader.ts   # Lê .swingbuilder.json e VS Code settings
├── webview/
│   ├── index.html            # HTML da WebView (canvas + paleta + propriedades)
│   ├── main.js               # JS vanilla da WebView
│   └── style.css             # Estilos do editor visual
├── schemas/
│   └── swingbuilder.schema.json  # JSON Schema para .swingbuilder.json
├── media/
│   └── icon.png              # Ícone da extensão (opcional no MVP)
├── tasks/
│   └── prd-swing-gui-builder.md
├── .vscode/
│   ├── launch.json           # Debug F5
│   └── extensions.json       # Recomendações de extensões
├── out/                      # Gerado pelo tsc (não versionado)
├── package.json
├── tsconfig.json
├── biome.json
├── .vscodeignore
├── .gitignore
└── README.md
```

### 10.3 Configurações de Arquivos Chave

**`package.json` (campos obrigatórios da extensão):**
```json
{
  "name": "swing-gui-builder",
  "displayName": "Swing GUI Builder",
  "description": "Visual drag-and-drop GUI builder for Java Swing in VS Code",
  "version": "0.0.1",
  "publisher": "seu-publisher-id",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "activationEvents": ["onCommand:swingGuiBuilder.newWindow"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      { "command": "swingGuiBuilder.newWindow",      "title": "Swing GUI Builder: New Window" },
      { "command": "swingGuiBuilder.generate",       "title": "Swing GUI Builder: Generate" },
      { "command": "swingGuiBuilder.save",           "title": "Swing GUI Builder: Save" },
      { "command": "swingGuiBuilder.open",           "title": "Swing GUI Builder: Open" },
      { "command": "swingGuiBuilder.initConfig",     "title": "Swing GUI Builder: Init Project Config" }
    ],
    "configuration": {
      "title": "Swing GUI Builder",
      "properties": {
        "swingGuiBuilder.defaultBackgroundColor": { "type": "string", "default": "#FFFFFF" },
        "swingGuiBuilder.defaultTextColor":       { "type": "string", "default": "#000000" },
        "swingGuiBuilder.defaultFontFamily":      { "type": "string", "default": "Arial" },
        "swingGuiBuilder.defaultFontSize":        { "type": "number", "default": 12 },
        "swingGuiBuilder.outputDirectory":        { "type": "string", "default": "swing/components/" }
      }
    },
    "jsonValidation": [
      { "fileMatch": ".swingbuilder.json", "url": "./schemas/swingbuilder.schema.json" }
    ]
  },
  "scripts": {
    "compile":            "tsc -p ./",
    "watch":              "tsc -watch -p ./",
    "package":            "vsce package",
    "lint":               "biome check src/",
    "lint:fix":           "biome check --write src/",
    "vscode:prepublish":  "pnpm run compile"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@types/node":    "^20.0.0",
    "@types/vscode":  "^1.85.0",
    "@vscode/vsce":   "^3.0.0",
    "typescript":     "^5.4.0"
  }
}
```

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "rootDir": "src",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", ".vscode-test", "out"]
}
```

**`biome.json`:**
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "files": {
    "ignore": ["out/", "node_modules/"]
  }
}
```

**`.vscode/launch.json`:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

### 10.4 Checklist de Pronto para Iniciar Desenvolvimento

- [ ] `pnpm install` executa sem erros
- [ ] `pnpm run compile` executa sem erros
- [ ] `pnpm run lint` passa sem erros
- [ ] Extensão carrega no VS Code (F5 abre Extension Development Host)
- [ ] Comando `Swing GUI Builder: New Window` aparece na Command Palette
- [ ] Estrutura de pastas criada conforme seção 10.2
- [ ] Repositório git inicializado com `.gitignore` cobrindo `out/` e `node_modules/`
