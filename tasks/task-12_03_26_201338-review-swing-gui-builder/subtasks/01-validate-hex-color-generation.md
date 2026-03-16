# Subtask 01 - Validar cores hex na geracao Java

## Objetivo

Garantir que o gerador nunca produza `new Color(NaN, ...)` quando receber cores invalidas.

## Arquivos principais

- `src\generator\JavaGenerator.ts`

## Escopo

- validar o formato esperado antes da conversao para RGB
- decidir se a entrada invalida deve gerar erro explicito ou fallback controlado
- centralizar a normalizacao de cores para evitar regras duplicadas

## Fora de escopo

- alterar o formato de armazenamento de cor na WebView
- adicionar novos tipos de entrada alem de hex

## Criterio de pronto

- cores validas seguem gerando Java correto
- cores invalidas nunca geram `NaN`
- o comportamento para erro e consistente e previsivel

