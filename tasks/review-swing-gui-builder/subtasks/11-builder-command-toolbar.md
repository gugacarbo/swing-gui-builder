# Subtask 11 - Adicionar botoes de comando no builder

## Objetivo

Permitir que as principais acoes da extensao sejam executadas diretamente pela interface do builder, sem depender da Command Palette.

## Arquivos principais

- `src\canvas\CanvasPanel.ts`
- `webview\main.js`
- `webview\style.css`
- `src\extension.ts`

## Escopo

- adicionar uma barra de acoes visivel no builder
- expor botoes para comandos como novo, abrir, salvar, gerar e inicializar configuracao
- reutilizar os comandos ja registrados na extensao
- fornecer feedback visual quando uma acao estiver indisponivel ou em andamento

## Fora de escopo

- criar uma barra de ferramentas complexa ou altamente customizavel

## Criterio de pronto

- o usuario consegue executar as acoes principais sem abrir o F1
- os botoes chamam os mesmos fluxos ja usados pela extensao
- a interface deixa claro quando a acao foi disparada ou nao pode ser executada

