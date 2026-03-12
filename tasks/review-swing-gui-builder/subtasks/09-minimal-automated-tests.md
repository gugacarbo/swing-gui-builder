# Subtask 09 - Adicionar testes minimos automatizados

## Objetivo

Aumentar a confianca nas partes mais sensiveis da extensao com cobertura minima e de alto valor.

## Arquivos principais

- `src\generator\JavaGenerator.ts`
- `src\config\ConfigReader.ts`
- pasta de testes a definir

## Escopo

- cobrir funcoes puras e fluxos que nao dependem diretamente da UI
- adicionar testes para conversao de cor, deduplicacao de nomes e defaults de configuracao
- incluir pelo menos um fluxo feliz e cenarios invalidos principais

## Fora de escopo

- cobertura completa da WebView
- testes end-to-end pesados de interface

## Criterio de pronto

- existe uma base minima de testes automatizados para o gerador e configuracao
- casos criticos do review deixam de depender apenas de verificacao manual
- o projeto passa a ter um caminho claro para ampliar cobertura depois
