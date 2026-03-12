# Subtask 13 - Redimensionar componentes por arraste

## Objetivo

Permitir ajustar largura e altura dos componentes diretamente no canvas usando mouse, sem depender apenas do painel de propriedades.

## Arquivos principais

- `webview\main.js`
- `webview\style.css`

## Escopo

- adicionar handles de resize aos componentes selecionados
- suportar resize por arraste com atualizacao visual em tempo real
- sincronizar largura e altura com o painel de propriedades
- manter compatibilidade com o fluxo de selecao, drag e salvamento

## Fora de escopo

- constraints avancadas de alinhamento
- resize proporcional inteligente por tipo de componente

## Criterio de pronto

- o usuario consegue redimensionar componentes pelo canvas com precisao basica
- largura e altura persistem corretamente no estado salvo
- o codigo gerado continua refletindo o tamanho final escolhido
