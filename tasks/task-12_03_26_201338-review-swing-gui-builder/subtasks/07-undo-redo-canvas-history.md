# Subtask 07 - Implementar undo/redo no canvas

## Objetivo

Adicionar historico de alteracoes para que o usuario possa desfazer e refazer operacoes no editor visual.

## Arquivos principais

- `webview\main.js`

## Escopo

- criar pilhas de historico para acoes do canvas
- cobrir inclusao, remocao, movimento, resize e alteracao de propriedades
- suportar atalhos de desfazer e refazer

## Fora de escopo

- merge sofisticado de operacoes continuas
- persistencia de historico entre sessoes

## Criterio de pronto

- o usuario consegue desfazer e refazer as principais acoes do canvas
- o historico nao corrompe o estado interno
- selecao e renderizacao permanecem coerentes apos undo/redo

