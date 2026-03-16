# Subtask 10 - Detectar estrutura de projeto e inferir package

## Objetivo

Fazer a extensao entender melhor quando esta gerando codigo dentro de um projeto Java, para sugerir uma pasta de saida mais util e definir corretamente o `package` dos arquivos gerados.

## Arquivos principais

- `src\extension.ts`
- `src\generator\JavaGenerator.ts`
- `src\config\ConfigReader.ts`

## Escopo

- detectar estruturas comuns de projeto Java, com foco inicial em `src\main\java`
- quando um projeto for detectado, sugerir por padrao a pasta `components` dentro da area principal de codigo-fonte
- inferir o `package` a partir da pasta de saida escolhida pelo usuario
- gerar declaracao `package` coerente com o caminho salvo
- manter fallback simples para workspaces que nao sejam projetos Java padrao

## Fora de escopo

- suporte completo a todos os formatos de projeto Java existentes
- refatoracao automatica de packages ja existentes

## Criterio de pronto

- a sugestao inicial de pasta deixa de ser generica quando a estrutura do projeto e reconhecida
- os arquivos gerados recebem `package` consistente com a estrutura de pastas
- o fluxo continua funcional em projetos nao convencionais

