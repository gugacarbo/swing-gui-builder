# Plano de melhorias: Swing GUI Builder

## 1. Contexto

Esta task consolida a revisao tecnica da extensao `swing-gui-builder-vscode` e organiza as proximas melhorias em ordem de impacto.

O objetivo principal e deixar a extensao segura para um primeiro release publico, reduzindo riscos de geracao de codigo invalido, melhorando a experiencia de uso e fechando lacunas de documentacao e empacotamento.

---

## 2. Objetivo

Entregar uma versao mais estavel e publicavel da extensao, com foco em:

- corrigir bugs que podem gerar codigo Java invalido
- aplicar corretamente configuracoes de projeto e de usuario
- melhorar a usabilidade basica do editor visual
- preparar a extensao para distribuicao e manutencao

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

---

## 5. Prioridade baixa - roadmap de produto

Itens que aumentam bastante o valor da extensao, mas podem entrar depois da estabilizacao:

- suporte a mais componentes Swing (`JCheckBox`, `JRadioButton`, `JComboBox`, `JPanel`, `JTable`, etc.)
- suporte a layout managers (`BorderLayout`, `FlowLayout`, `GridLayout`)
- redimensionamento com mouse
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
4. Revisar schema/config
5. Fechar documentacao e metadados de release
6. Implementar delete + validacao de nomes
7. Adicionar undo/redo
8. Criar testes minimos

---

## 7. Resultado esperado

Ao final desta task, a extensao deve:

- gerar codigo Java mais confiavel
- respeitar a configuracao esperada pelo usuario
- oferecer uma UX basica mais completa no canvas
- estar mais proxima de um release publico com documentacao adequada

