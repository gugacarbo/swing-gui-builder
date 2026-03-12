# Subtask 02 - Garantir nomes unicos e validos

## Objetivo

Evitar conflito de nomes em variaveis, classes customizadas e arquivos `.java` gerados.

## Arquivos principais

- `webview\main.js`
- `src\generator\JavaGenerator.ts`

## Escopo

- validar `variableName` como identificador Java valido
- impedir duplicidade entre componentes no editor
- gerar nomes de classes customizadas que nao dependam apenas de um campo editavel
- manter nomes gerados deterministicos para evitar diffs desnecessarios

## Fora de escopo

- renomeacao automatica de metodos de evento alem da regra ja existente

## Criterio de pronto

- o editor sinaliza nomes invalidos ou duplicados
- dois componentes nunca geram a mesma classe customizada por acidente
- os arquivos gerados compilam em cenarios com varios componentes customizados

