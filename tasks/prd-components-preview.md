# PRD: Components Preview (Builder)

## 1. Introducao/Visao Geral

Este PRD define a evolucao do preview visual do Swing GUI Builder para aumentar fidelidade ao comportamento de Swing, produtividade durante a montagem da interface e seguranca contra regressao.

A entrega cobre cinco frentes: frame visual explicito de `JFrame`, fidelidade de renderizacao por tipo de componente, colapso independente de paines laterais, atalho de remocao por teclado e preview de codigo com arvore de arquivos antes da geracao real em disco.

## 2. Goals

- Tornar o `JFrame` claramente visivel no canvas, com dimensoes reais do estado (`frameWidth`/`frameHeight`).
- Melhorar o preview de componentes para representacoes mais proximas do Swing por tipo.
- Permitir colapsar `Palette` e `Hierarchy` de forma independente com persistencia em `localStorage`.
- Permitir remocao de componente selecionado com tecla `Delete`.
- Adicionar preview de codigo em modal com arvore de arquivos e editor readonly, sem escrita em disco.
- Manter estabilidade tecnica: `pnpm --dir webview-app typecheck`, `pnpm --dir webview-app build` e `pnpm run compile` passando ao final.

## 3. User Stories

### US-001: Exibir moldura explicita de JFrame
**Description:** Como usuario do builder, quero ver uma moldura explicita de `JFrame` para entender claramente os limites da janela que sera gerada.

**Acceptance Criteria:**
- [ ] O canvas renderiza moldura visual de `JFrame` com barra de titulo simulada e area de conteudo.
- [ ] A largura e altura da moldura respeitam `frameWidth` e `frameHeight` do estado atual.
- [ ] `MenuBar` e `ToolBar` ficam ancorados ao frame visual, nao ao viewport bruto.
- [ ] Zoom e pan continuam funcionando com o novo container de frame.
- [ ] `pnpm --dir webview-app typecheck` passa.
- [ ] Verify in browser using dev-browser skill.

### US-002: Garantir comportamento de selecao/drag/resize com frame visual
**Description:** Como usuario, quero manter interacoes de selecao, arraste e redimensionamento apos a introducao do frame visual para nao perder produtividade.

**Acceptance Criteria:**
- [ ] Selecionar componente no canvas continua destacando o item correto.
- [ ] Arrastar componente atualiza posicao correta sem offset incorreto causado pelo frame container.
- [ ] Redimensionar componente continua respeitando limites e handles existentes.
- [ ] Nao ha regressao funcional nas interacoes basicas do canvas.
- [ ] `pnpm --dir webview-app typecheck` passa.
- [ ] Verify in browser using dev-browser skill.

### US-003: Renderizar componentes com fidelidade por tipo
**Description:** Como usuario, quero que cada tipo de componente tenha representacao visual distinta e reconhecivel para revisar layout com mais confianca.

**Acceptance Criteria:**
- [ ] `JLabel`, `JButton`, `JTextField`, `JTextArea`, `JCheckBox`, `JRadioButton`, `JComboBox`, `JList`, `JProgressBar`, `JSlider`, `JSpinner`, `JSeparator` e `JPanel` possuem renderizacao especifica.
- [ ] Cada tipo possui baseline visual definido (borda, padding, tipografia e estados basicos).
- [ ] A representacao generica deixa de ser o caminho principal para os tipos listados.
- [ ] `pnpm --dir webview-app typecheck` passa.
- [ ] Verify in browser using dev-browser skill.

### US-004: Definir limites minimos de dimensao por tipo
**Description:** Como usuario, quero limites minimos coerentes por tipo para evitar previews quebrados ou ilegiveis.

**Acceptance Criteria:**
- [ ] Existe definicao de tamanho minimo por tipo para componentes suportados.
- [ ] Componentes nao podem ser reduzidos abaixo do minimo definido para legibilidade.
- [ ] Regras de minimo nao quebram drag/resize existentes.
- [ ] `pnpm --dir webview-app typecheck` passa.
- [ ] Verify in browser using dev-browser skill.

### US-005: Colapsar Palette independentemente
**Description:** Como usuario, quero colapsar a secao `Palette` para ganhar area util de trabalho quando necessario.

**Acceptance Criteria:**
- [ ] Existe controle de expandir/colapsar para `Palette`.
- [ ] Estado de colapso de `Palette` persiste em `localStorage`.
- [ ] O controle possui atributo de acessibilidade `aria-expanded` correto.
- [ ] O layout nao quebra em janelas de baixa altura.
- [ ] `pnpm --dir webview-app typecheck` passa.
- [ ] Verify in browser using dev-browser skill.

### US-006: Colapsar Hierarchy independentemente
**Description:** Como usuario, quero colapsar a secao `Hierarchy` separadamente para focar no fluxo de montagem desejado.

**Acceptance Criteria:**
- [ ] Existe controle de expandir/colapsar para `Hierarchy` independente de `Palette`.
- [ ] Estado de colapso de `Hierarchy` persiste em `localStorage`.
- [ ] O controle possui atributo de acessibilidade `aria-expanded` correto.
- [ ] Scroll e layout lateral permanecem funcionais apos colapsos sucessivos.
- [ ] `pnpm --dir webview-app typecheck` passa.
- [ ] Verify in browser using dev-browser skill.

### US-007: Remover componente com tecla Delete
**Description:** Como usuario, quero remover rapidamente o componente selecionado com `Delete` para editar layouts com mais agilidade.

**Acceptance Criteria:**
- [ ] Ao pressionar `Delete` com componente selecionado, o item e removido.
- [ ] Ao pressionar `Delete` sem selecao, nenhuma remocao ocorre.
- [ ] O atalho nao dispara quando foco esta em `input`, `textarea` ou `contentEditable`.
- [ ] O atalho suportado e somente `Delete` (sem `Backspace`).
- [ ] `pnpm --dir webview-app typecheck` passa.
- [ ] Verify in browser using dev-browser skill.

### US-008: Solicitar preview de codigo sem gravar em disco
**Description:** Como usuario, quero acionar um comando de preview para revisar arquivos gerados antes de efetivar a geracao.

**Acceptance Criteria:**
- [ ] Existe comando de toolbar dedicado para preview de codigo.
- [ ] O comando envia mensagem webview->extensao para gerar preview em memoria.
- [ ] O fluxo nao grava arquivos no disco durante o preview.
- [ ] A resposta da extensao retorna lista ordenada de arquivos com `fileName` e `content`.
- [ ] `pnpm --dir webview-app typecheck` e `pnpm run compile` passam.

### US-009: Exibir modal de preview com arvore e editor readonly
**Description:** Como usuario, quero abrir um modal com arvore de arquivos e conteudo readonly para validar o codigo antes da geracao final.

**Acceptance Criteria:**
- [ ] O preview abre em modal dentro da webview.
- [ ] A coluna esquerda exibe arvore/lista de arquivos gerados.
- [ ] A area direita mostra o conteudo do arquivo selecionado em modo readonly.
- [ ] Existe acao secundaria no modal para disparar `Generate` real.
- [ ] O fechamento do modal nao altera o estado do canvas.
- [ ] `pnpm --dir webview-app typecheck` passa.
- [ ] Verify in browser using dev-browser skill.

### US-010: Garantir paridade entre preview e geracao real
**Description:** Como desenvolvedor, quero que o preview reutilize o mesmo gerador da geracao real para evitar divergencia entre o que e exibido e o que e salvo.

**Acceptance Criteria:**
- [ ] O preview reutiliza exatamente `generateJavaFiles(state, packageName?)` na extensao.
- [ ] Para o mesmo estado, nomes de arquivos e conteudos do preview batem com a geracao real.
- [ ] O comando atual de `generate` continua funcionando sem alteracao de contrato.
- [ ] `pnpm run compile` passa.

## 4. Functional Requirements

- FR-1: O sistema deve renderizar uma moldura visual de `JFrame` no `Canvas`, incluindo barra de titulo simulada e area de conteudo.
- FR-2: A moldura do `JFrame` deve usar `frameWidth` e `frameHeight` como dimensoes efetivas de preview.
- FR-3: `MenuBar` e `ToolBar` devem ser posicionados relativos ao frame visual.
- FR-4: O canvas deve manter compatibilidade com zoom, pan, selecao, drag e resize apos introducao do frame container.
- FR-5: O sistema deve renderizar visualmente cada tipo listado na US-003 com representacao distinta.
- FR-6: O sistema deve aplicar limites minimos de dimensao por tipo para prevenir preview inviavel.
- FR-7: O painel esquerdo deve permitir colapso independente de `Palette`.
- FR-8: O painel esquerdo deve permitir colapso independente de `Hierarchy`.
- FR-9: O estado de colapso de `Palette` e `Hierarchy` deve persistir em `localStorage`.
- FR-10: Os controles de colapso devem expor `aria-expanded` coerente com o estado visual.
- FR-11: O sistema deve remover o componente selecionado ao pressionar `Delete`.
- FR-12: O atalho de `Delete` nao deve executar remocao com foco em elementos editaveis.
- FR-13: A toolbar deve incluir acao `previewCode` para solicitar preview sem escrita em disco.
- FR-14: A extensao deve responder ao preview com lista ordenada de arquivos e conteudos gerados em memoria.
- FR-15: A webview deve exibir modal de preview com arvore/lista de arquivos e visualizador readonly de conteudo.
- FR-16: O modal de preview deve incluir acao secundaria para executar geracao real.
- FR-17: O preview deve reutilizar o mesmo pipeline de geracao (`generateJavaFiles`) usado pela geracao real.
- FR-18: O fluxo existente de comandos (`generate`, `save`, `open`) deve permanecer operacional sem regressao.

## 5. Non-Goals (Out of Scope)

- Nao implementar editor de codigo com edicao no modal de preview (somente leitura).
- Nao adicionar persistencia em nuvem ou sincronizacao remota de estado de UI.
- Nao criar sistema de atalho configuravel pelo usuario nesta entrega.
- Nao introduzir suporte a novos componentes Swing fora da lista definida na US-003.
- Nao alterar arquitetura do gerador Java para novos formatos de output.
- Nao adicionar temas visuais completos (dark/light) para o builder nesta fase.

## 6. Design Considerations

- O `JFrame` visual deve deixar claro o limite da tela de destino, com contraste suficiente entre moldura e area externa do canvas.
- O modal de preview deve priorizar legibilidade do codigo e navegacao rapida entre arquivos.
- Controles de colapso devem ter affordance clara (icone/rotulo) e estado visual consistente.
- A hierarquia visual deve evitar ambiguidade entre area de trabalho e estrutura do frame.

## 7. Technical Considerations

- Webview: alteracoes principais em `Canvas.tsx`, `CanvasComponent.tsx`, `App.tsx`, `Toolbar.tsx`, hooks de atalhos e mensageria.
- Extensao: ajuste de contrato de mensagens em `messages.ts` e manipulacao do comando de preview em `CanvasPanel.ts`/`extension.ts`.
- Persistencia local: `localStorage` com chaves versionadas para evitar conflito com mudancas futuras de formato.
- Paridade de output: preview deve consumir a mesma funcao de geracao (`generateJavaFiles`) da geracao real.
- Validacao tecnica obrigatoria:
  - `pnpm --dir webview-app typecheck`
  - `pnpm --dir webview-app build`
  - `pnpm run compile`

## 8. Success Metrics

- SM-1: `pnpm --dir webview-app typecheck` finaliza com sucesso na branch da feature.
- SM-2: `pnpm --dir webview-app build` finaliza com sucesso na branch da feature.
- SM-3: `pnpm run compile` finaliza com sucesso na branch da feature.
- SM-4: Fluxo funcional completo e executavel sem erro critico: montar UI -> deletar com `Delete` -> abrir modal de preview -> revisar arquivos -> gerar codigo real.
- SM-5: Zero regressao critica reportada nos comandos existentes (`generate`, `save`, `open`) durante validacao manual da release.

## 9. Open Questions

- O estado de colapso em `localStorage` deve ser compartilhado entre projetos ou separado por identificador de workspace?
- O modal de preview deve lembrar ultimo arquivo selecionado entre aberturas na mesma sessao?
- Em caso de grande volume de arquivos gerados, sera necessario filtro por nome na arvore ja nesta fase?
- Deve haver indicador de diferenca entre preview atual e ultimo generate executado (nao incluso neste escopo)?

## Checklist

- [x] Asked clarifying questions with lettered options
- [x] Incorporated user's answers
- [x] User stories are small and specific
- [x] Functional requirements are numbered and unambiguous
- [x] Non-goals section defines clear boundaries
- [x] Saved to `tasks/prd-components-preview.md`
