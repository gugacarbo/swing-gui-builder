# Plano de melhorias: Swing GUI Builder

## 1. Contexto

Esta task consolida a revisao tecnica da extensao `swing-gui-builder-vscode` e organiza as proximas melhorias em ordem de impacto.

O objetivo principal e deixar a extensao segura para um primeiro release publico, reduzindo riscos de geracao de codigo invalido, melhorando a experiencia de uso e fechando lacunas de documentacao e empacotamento.

---

## 2. Objetivo

Entregar uma versao mais estavel e publicavel da extensao, com foco em:

- corrigir bugs que podem gerar codigo Java invalido
- gerar arquivos Java em locais e packages coerentes com a estrutura do projeto
- aplicar corretamente configuracoes de projeto e de usuario
- melhorar a usabilidade basica do editor visual
- enriquecer o canvas com interacoes mais fluidas
- preparar a extensao para distribuicao e manutencao

### Subtasks

- `subtasks\01-validate-hex-color-generation.md` - impedir geracao de `NaN` em cores
- `subtasks\02-enforce-unique-generated-names.md` - garantir nomes unicos e validos no editor e no gerador
- `subtasks\03-apply-config-defaults-to-new-components.md` - aplicar defaults configurados na criacao de componentes
- `subtasks\04-fix-project-config-schema-wiring.md` - revisar e corrigir integracao do schema
- `subtasks\05-release-readiness-docs-and-metadata.md` - fechar lacunas de release e documentacao
- `subtasks\06-component-deletion-and-shortcuts.md` - adicionar remocao de componentes e atalhos basicos
- `subtasks\07-undo-redo-canvas-history.md` - implementar historico de desfazer/refazer
- `subtasks\08-error-handling-hardening.md` - melhorar tratamento de erros e observabilidade
- `subtasks\09-minimal-automated-tests.md` - adicionar cobertura minima para fluxos criticos
- `subtasks\10-detect-project-structure-and-package.md` - detectar estrutura Java do projeto e inferir package/pasta padrao
- `subtasks\11-builder-command-toolbar.md` - expor acoes principais da extensao dentro do builder
- `subtasks\12-canvas-zoom-and-pan.md` - adicionar zoom e movimentacao do viewport do canvas
- `subtasks\13-drag-resize-components.md` - permitir redimensionamento por arraste no canvas

---

## 3. Prioridade alta - corrigir antes de publicar

### 3.1 Validar conversao de cores hex

**Arquivos principais:** `src\generator\JavaGenerator.ts`

**Problema:** `hexToRgb()` nao valida entrada e pode gerar `NaN`, resultando em codigo Java quebrado.

**Plano:**

- validar formato `#RRGGBB` antes da conversao
- tratar entrada invalida com erro explicito ou fallback consistente
- adicionar cobertura de teste para cores validas e invalidas

**Criterio de pronto:**

- nenhuma cor invalida gera `new Color(NaN, ...)`
- casos invalidos sao rejeitados de forma previsivel

### 3.2 Garantir nomes unicos para classes customizadas

**Arquivos principais:** `src\generator\JavaGenerator.ts`, `webview\main.js`

**Problema:** o nome da classe customizada depende apenas de `variableName`, o que pode causar colisao de classes e falha de compilacao.

**Plano:**

- garantir unicidade de `variableName` no editor
- desacoplar o nome da classe customizada de um valor editavel pelo usuario, se necessario
- gerar nomes de classe unicos e deterministicos

**Criterio de pronto:**

- dois componentes nunca geram a mesma classe `.java` por acidente
- o codigo Java gerado compila em cenarios com varios componentes customizados

### 3.3 Aplicar defaults de configuracao ao criar componentes

**Arquivos principais:** `webview\main.js`, `src\config\ConfigReader.ts`, possivelmente `src\canvas\CanvasPanel.ts`

**Problema:** novos componentes usam valores hardcoded em vez das configuracoes definidas no VS Code ou em `.swingbuilder.json`.

**Plano:**

- enviar defaults configurados para a WebView na carga inicial
- usar defaults por tipo de componente no momento do drop
- manter a ordem de precedencia: projeto > VS Code > internos

**Criterio de pronto:**

- componentes novos respeitam os defaults configurados sem edicao manual

### 3.4 Revisar integracao do JSON schema

**Arquivos principais:** `package.json`, `schemas\swingbuilder.schema.json`

**Problema:** o `jsonValidation` atual merece revisao para garantir que o schema seja encontrado corretamente quando a extensao estiver instalada.

**Plano:**

- validar a forma correta de expor o schema para `.swingbuilder.json`
- ajustar contribuicao da extensao se necessario
- testar autocomplete/validacao no arquivo de configuracao do projeto

**Criterio de pronto:**

- `.swingbuilder.json` tem validacao e autocomplete funcionando no VS Code

### 3.5 Fechar itens minimos de publicacao

**Arquivos principais:** `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE`

**Plano:**

- revisar categorias, publisher e metadados de marketplace
- criar `README.md` com setup, uso e screenshots
- criar `CHANGELOG.md`
- corrigir placeholder/ano no `LICENSE`

**Criterio de pronto:**

- a extensao consegue ser empacotada com metadados coerentes
- um usuario novo entende como instalar e usar a extensao

### 3.6 Detectar estrutura de projeto e package automaticamente

**Arquivos principais:** `src\extension.ts`, `src\generator\JavaGenerator.ts`, `src\config\ConfigReader.ts`

**Problema:** a extensao ainda nao usa a estrutura do projeto Java para sugerir a pasta de saida ideal nem para derivar corretamente o `package` dos arquivos gerados.

**Plano:**

- detectar estruturas comuns de projeto Java, como `src\main\java`
- sugerir por padrao uma pasta `components` dentro da raiz principal do codigo-fonte quando um projeto for detectado
- inferir o `package` a partir da pasta de saida escolhida pelo usuario
- garantir que o `package` gerado seja coerente com o caminho salvo

**Criterio de pronto:**

- quando houver um projeto Java reconhecivel, a sugestao de pasta deixa de ser generica
- os arquivos gerados usam `package` compativel com a estrutura de pastas
- o fluxo continua funcionando tambem para workspaces sem estrutura Java padrao

---

## 4. Prioridade media - melhorar UX e confianca

### 4.1 Remocao de componentes

**Arquivos principais:** `webview\main.js`

**Plano:**

- adicionar delete por teclado
- opcionalmente adicionar botao de remocao no painel de propriedades

### 4.2 Undo/redo

**Arquivos principais:** `webview\main.js`

**Plano:**

- criar historico de estado simples para movimentos e alteracoes de propriedades
- suportar atalhos basicos de desfazer/refazer

### 4.3 Validacao de nomes no editor

**Arquivos principais:** `webview\main.js`, `src\generator\JavaGenerator.ts`

**Plano:**

- validar `variableName` como identificador Java valido
- impedir duplicidade entre componentes
- exibir feedback visual quando houver conflito

### 4.4 Melhorar tratamento de erros

**Arquivos principais:** `src\extension.ts`

**Plano:**

- substituir `catch` silenciosos por mensagens ou logs coerentes
- preservar erros relevantes para debug sem poluir a UX

### 4.5 Cobertura minima de testes

**Arquivos principais:** a definir

**Plano:**

- adicionar testes para geracao Java
- cobrir `hexToRgb`, deduplicacao de nomes e defaults de configuracao
- garantir ao menos um fluxo feliz e cenarios invalidos principais

### 4.6 Barra de acoes do builder

**Arquivos principais:** `src\canvas\CanvasPanel.ts`, `webview\main.js`, `webview\style.css`, `src\extension.ts`

**Plano:**

- adicionar botoes no builder para comandos como novo, abrir, salvar, gerar e inicializar configuracao
- reutilizar os mesmos comandos da extensao para evitar logica duplicada
- dar feedback visual de acao em andamento ou indisponivel

### 4.7 Zoom e pan do canvas

**Arquivos principais:** `webview\main.js`, `webview\style.css`

**Plano:**

- permitir zoom in/out do canvas com controles claros
- permitir mover o viewport do builder sem quebrar selecao e drag-and-drop
- manter coordenadas coerentes entre renderizacao e estado interno

### 4.8 Redimensionamento por arraste

**Arquivos principais:** `webview\main.js`, `webview\style.css`

**Plano:**

- adicionar handles visuais para resize dos componentes selecionados
- atualizar largura e altura em tempo real ao arrastar
- sincronizar o resultado com o painel de propriedades e com o estado salvo

---

## 5. Prioridade baixa - roadmap de produto

Itens que aumentam bastante o valor da extensao, mas podem entrar depois da estabilizacao:

- suporte a mais componentes Swing (`JCheckBox`, `JRadioButton`, `JComboBox`, `JPanel`, `JTable`, etc.)
- suporte a layout managers (`BorderLayout`, `FlowLayout`, `GridLayout`)
- duplicacao e copy/paste de componentes
- preview/run da janela gerada
- importacao de codigo Swing existente
- multiplas janelas por projeto
- grid, snap-to-grid e guias de alinhamento
- atalhos de teclado para acoes principais
- arvore/hierarquia de componentes

---

## 6. Ordem recomendada de execucao

1. Corrigir `hexToRgb`
2. Resolver unicidade de nomes
3. Aplicar defaults configurados na criacao
4. Detectar estrutura de projeto e `package`
5. Revisar schema/config
6. Fechar documentacao e metadados de release
7. Adicionar botoes de comando no builder
8. Implementar delete + validacao de nomes
9. Implementar zoom e pan
10. Implementar resize por arraste
11. Adicionar undo/redo
12. Criar testes minimos

---

## 7. Resultado esperado

Ao final desta task, a extensao deve:

- gerar codigo Java mais confiavel
- gerar `package` e pasta de saida mais coerentes com projetos Java reais
- respeitar a configuracao esperada pelo usuario
- oferecer uma UX mais completa no canvas, com comandos, zoom e resize
- estar mais proxima de um release publico com documentacao adequada

