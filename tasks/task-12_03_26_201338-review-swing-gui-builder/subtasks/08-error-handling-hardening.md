# Subtask 08 - Melhorar tratamento de erros

## Objetivo

Parar de esconder falhas relevantes e deixar o comportamento da extensao mais observavel.

## Arquivos principais

- `src\extension.ts`
- outros arquivos tocados por fluxos de leitura, escrita e geracao

## Escopo

- revisar `catch` silenciosos
- exibir mensagens adequadas para erros recuperaveis
- registrar detalhes uteis para debug sem degradar a UX

## Fora de escopo

- adicionar telemetria completa
- criar infraestrutura externa de monitoramento

## Criterio de pronto

- erros relevantes nao desaparecem silenciosamente
- falhas de arquivo, backup ou leitura ficam mais faceis de diagnosticar
- fluxos de sucesso continuam simples para o usuario

