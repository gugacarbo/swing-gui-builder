# Subtask 03 - Aplicar defaults configurados a novos componentes

## Objetivo

Fazer com que novos componentes usem os defaults definidos pelo usuario e pelo projeto, em vez de valores hardcoded.

## Arquivos principais

- `src\config\ConfigReader.ts`
- `src\canvas\CanvasPanel.ts`
- `webview\main.js`

## Escopo

- enviar para a WebView os defaults por tipo de componente
- aplicar esses defaults no momento do drop no canvas
- preservar a precedencia `projeto > VS Code > internos`

## Fora de escopo

- migrar layouts ja salvos
- criar um editor novo para configuracoes

## Criterio de pronto

- um novo componente nasce com os valores configurados corretamente
- defaults globais e por tipo continuam funcionando
- `.swingbuilder.json` e `settings.json` impactam o canvas como esperado

