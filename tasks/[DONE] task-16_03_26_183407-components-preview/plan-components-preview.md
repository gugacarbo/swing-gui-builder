# Plan: Components Preview (Builder)

## Objetivo
Executar os requisitos de preview e UX do builder com foco em fidelidade visual ao Swing, produtividade e baixo risco de regressao.

## Diagnostico Atual (baseado no codigo)

1. JFrame nao aparece no preview
- O estado possui `frameWidth` e `frameHeight`, mas o canvas nao usa esses valores para desenhar um frame visual.
- Evidencias:
  - `webview-app/src/App.tsx` define `INITIAL_CANVAS_STATE` com frame size.
  - `webview-app/src/components/Canvas.tsx` renderiza area livre sem moldura de `JFrame`.

2. Review de visualizacao dos componentes
- O preview atual de componentes flutuantes usa uma representacao generica (`CanvasComponent`) para varios tipos.
- Componentes especiais (MenuBar/ToolBar) ja possuem render custom no canvas, mas os demais ainda nao seguem um nivel consistente de fidelidade Swing.
- Evidencias:
  - `webview-app/src/components/CanvasComponent.tsx` usa uma base unica para diferentes tipos.
  - `webview-app/src/components/Canvas.tsx` contem renderizacao dedicada para MenuBar e ToolBar.

3. Menu de componentes colapsavel (palette e hierarchy)
- Lado esquerdo ja tem Palette e Hierarchy, mas nao existe estado para colapsar os dois blocos.
- Evidencia:
  - `webview-app/src/App.tsx` usa layout fixo com os dois paineis sempre visiveis.

4. Atalho Delete
- Ha botao Delete na toolbar e handler de remocao no App.
- Atalhos de teclado atualmente cobrem Undo/Redo, sem `Delete`.
- Evidencias:
  - `webview-app/src/components/Toolbar.tsx`
  - `webview-app/src/hooks/useKeyboardShortcuts.ts`

5. Preview de codigo com arvore de arquivos
- Fluxo atual envia `toolbarCommand: generate` para extensao, que gera arquivos no disco.
- Nao existe comando/mensagem para preview de codigo em memoria com arvore de arquivos.
- Evidencias:
  - `webview-app/src/schemas/messages.ts`
  - `webview-app/src/hooks/usePostMessage.ts`
  - `src/canvas/CanvasPanel.ts`
  - `src/extension.ts`

## Estrategia de Execucao

### Fase 1 - Fundacao do Preview do JFrame
Objetivo: tornar o frame explicito na area de design e corrigir percepcao de menu fixo "solto".

Escopo tecnico:
- Introduzir uma moldura visual de `JFrame` dentro do `Canvas` com:
  - barra de titulo simulada;
  - area de conteudo separada;
  - dimensoes ligadas a `frameWidth` e `frameHeight`.
- Garantir que MenuBar e ToolBar sejam ancorados no frame visual (nao no viewport bruto).
- Preservar zoom/pan e selecao atual.

Arquivos-alvo principais:
- `webview-app/src/components/Canvas.tsx`
- `webview-app/src/App.tsx` (se precisar ajustar estado/props de frame)

Criterios de aceite:
- Com ou sem MenuBar, o usuario enxerga claramente o contorno do JFrame.
- O topo do preview nao fica visualmente "implicito".

Estimativa: 0.5 a 1 dia.

---

### Fase 2 - Refatoracao de Fidelidade de Componentes
Objetivo: aumentar aderencia visual dos componentes ao comportamento/renderizacao Swing.

Escopo tecnico:
- Criar uma camada de render por tipo (em vez de um bloco unico para todos):
  - `JLabel`, `JButton`, `JTextField`, `JTextArea`, `JCheckBox`, `JRadioButton`, `JComboBox`, `JList`, `JProgressBar`, `JSlider`, `JSpinner`, `JSeparator`, `JPanel`.
- Definir baseline visual por componente (tipografia, borda, padding, estados, placeholder).
- Normalizar dimensoes minimas por tipo para evitar componentes inviaveis no preview.
- Manter selecao/resize/drag sem quebrar.

Arquivos-alvo principais:
- `webview-app/src/components/CanvasComponent.tsx`
- `webview-app/src/components/Canvas.tsx`
- `webview-app/src/lib/componentDefaults.ts` (se precisar de limites/ajustes)

Criterios de aceite:
- Todos os tipos da paleta possuem representacao distinta e reconhecivel.
- Distorcoes visuais graves (especialmente entrada de texto, lista, progresso e slider) sao reduzidas.

Estimativa: 1.5 a 2.5 dias.

---

### Fase 3 - Painel Esquerdo Colapsavel
Objetivo: permitir colapsar Palette e Hierarchy de forma independente.

Escopo tecnico:
- Adicionar controles de colapso/expansao para:
  - secao da Palette;
  - secao da Hierarchy.
- Persistir estado local da sessao (em memoria) e manter acessibilidade (aria-expanded).
- Ajustar layout para evitar quebra de scroll e sobreposicoes.

Arquivos-alvo principais:
- `webview-app/src/App.tsx`
- `webview-app/src/components/Palette.tsx`
- `webview-app/src/components/HierarchyPanel.tsx`

Criterios de aceite:
- Usuario colapsa cada secao separadamente.
- Layout continua funcional em alturas menores.

Estimativa: 0.5 a 1 dia.

---

### Fase 4 - Atalho de Delete
Objetivo: deletar componente selecionado com tecla `Delete` (e opcionalmente `Backspace` com guardas).

Escopo tecnico:
- Estender `useKeyboardShortcuts` para suportar acao de delete.
- Integrar `onDelete` no `App` via hook existente.
- Respeitar regra de nao capturar quando foco estiver em input/textarea/contentEditable.
- Nao disparar quando nao houver selecao.

Arquivos-alvo principais:
- `webview-app/src/hooks/useKeyboardShortcuts.ts`
- `webview-app/src/App.tsx`

Criterios de aceite:
- Com componente selecionado, `Delete` remove o componente.
- Em campos editaveis, tecla nao dispara remocao.

Estimativa: 0.25 dia.

---

### Fase 5 - Preview de Codigo com Arvore de Arquivos
Objetivo: adicionar botao para visualizar codigo gerado antes da escrita em disco, com estrutura de arquivos.

Escopo tecnico:
1. Contrato de mensagens webview <-> extensao
- Adicionar novo comando de toolbar (ex.: `previewCode`).
- Adicionar nova mensagem de retorno com payload de arquivos gerados.

2. Extensao
- Registrar comando `swingGuiBuilder.previewCode`.
- Reusar `generateJavaFiles(state, packageName?)` para montar preview em memoria.
- Retornar para webview: lista ordenada de arquivos (`fileName`, `content`) e metadados (pasta/pacote estimado).

3. Webview UI
- Novo botao na toolbar para abrir preview.
- Modal/painel com:
  - arvore de arquivos a esquerda;
  - editor readonly a direita;
  - acao secundaria para "Generate" real.

Arquivos-alvo principais:
- `webview-app/src/components/Toolbar.tsx`
- `webview-app/src/App.tsx`
- `webview-app/src/schemas/messages.ts`
- `webview-app/src/types/messages.ts`
- `webview-app/src/hooks/usePostMessage.ts`
- `webview-app/src/hooks/useExtensionListener.ts`
- `src/extension.ts`
- `src/canvas/CanvasPanel.ts`

Criterios de aceite:
- Botao de preview abre listagem de arquivos e conteudo sem gravar no disco.
- Estrutura exibida reflete o output do gerador atual.
- Fluxo de generate atual continua funcionando.

Estimativa: 1.5 a 2 dias.

## Ordem Recomendada
1. Fase 1 (JFrame visivel)
2. Fase 4 (Delete shortcut)
3. Fase 3 (colapsavel)
4. Fase 2 (fidelidade visual)
5. Fase 5 (preview de codigo)

Motivo:
- Entrega rapida de dor principal (frame implicito).
- Ganho de produtividade imediato (Delete + colapsar paineis).
- Refactor visual mais profundo entra com base de layout estavel.
- Preview de codigo depende de contrato de mensagens e mexe em front + extensao.

## Plano de Testes e Validacao

Checklist tecnico por entrega:
- `pnpm --dir webview-app typecheck`
- `pnpm --dir webview-app build`
- `pnpm run compile`

Checklist funcional:
- Abrir builder, adicionar MenuBar/Menu/MenuItem e validar ancoragem no frame visual.
- Colapsar/expandir Palette e Hierarchy em diferentes alturas de janela.
- Selecionar componente e remover com `Delete`.
- Abrir preview de codigo, navegar na arvore de arquivos e conferir conteudo de classe principal + classes custom.
- Gerar codigo real apos preview e validar que comportamento anterior foi preservado.

## Riscos e Mitigacoes

1. Regressao em drag/resize ao introduzir "frame container"
- Mitigacao: manter contrato de `onMoveComponent`/`onResizeComponent` e validar offsets com testes manuais guiados.

2. Complexidade de render por tipo crescer rapido
- Mitigacao: extrair renderers por tipo em funcoes/componentes pequenos, com fallback padrao.

3. Divergencia entre preview de codigo e generate real
- Mitigacao: preview deve reutilizar exatamente `generateJavaFiles` na extensao.

## Definicao de Pronto (DoD)
- Todos os 5 requisitos atendidos.
- Sem quebra nos comandos existentes (`generate`, `save`, `open`).
- Build e typecheck passando.
- Fluxo principal demonstravel: montar UI, revisar preview visual, deletar por teclado, revisar preview de codigo, gerar arquivos.
