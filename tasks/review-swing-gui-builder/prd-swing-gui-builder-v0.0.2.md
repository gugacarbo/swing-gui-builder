# PRD — Swing GUI Builder v0.0.2

## 1. Visão Geral

**Produto:** swing-gui-builder-vscode  
**Versão alvo:** 0.0.2  
**Tipo:** Extensão VS Code  
**Objetivo:** Estabilizar, corrigir bugs críticos e enriquecer a experiência de uso do Swing GUI Builder para torná-lo apto para um primeiro release público no Marketplace.

---

## 2. Problema

A extensão na versão `0.0.1` apresenta falhas que podem gerar código Java inválido (cores com `NaN`, nomes de classe duplicados), não respeita configurações do usuário ao criar componentes, não detecta a estrutura real de projetos Java e carece de documentação e metadados de publicação. O canvas também tem limitações de usabilidade que tornam a experiência inferior ao esperado para um editor visual.

---

## 3. Usuário-Alvo

**Desenvolvedor Java individual** — estudante ou entusiasta — que usa VS Code e quer construir interfaces Swing visualmente, sem escrever o código de layout manualmente. Não necessariamente conhece a fundo a API Swing, mas sabe compilar e executar um projeto Java.

---

## 4. Objetivos

1. Garantir que o código Java gerado seja **sempre válido e compilável**.
2. Gerar arquivos com **`package` e pasta de saída coerentes** com a estrutura real do projeto Java.
3. **Respeitar as configurações** de projeto e de usuário na criação de componentes.
4. Oferecer uma **UX mais completa** no canvas: remoção, undo/redo, zoom, pan e resize.
5. Expor as ações principais da extensão **dentro do próprio builder**.
6. **Publicar com documentação e metadados** adequados no Marketplace.

---

## 5. Não-Objetivos (v0.0.2)

- Suporte a novos componentes Swing (JCheckBox, JComboBox, JTable, etc.)
- Suporte a layout managers (BorderLayout, FlowLayout, GridLayout)
- Duplicação/copy-paste de componentes
- Preview/run da janela gerada
- Importação de código Swing existente
- Múltiplas janelas por projeto
- Grid, snap-to-grid e guias de alinhamento
- Árvore/hierarquia de componentes

Esses itens compõem o roadmap futuro e **não bloqueiam** este release.

---

## 6. Requisitos Funcionais

### 6.1 [P0] Validar conversão de cores hex
**Arquivo-chave:** `src/generator/JavaGenerator.ts`

- `hexToRgb()` deve validar que a entrada está no formato `#RRGGBB` antes de converter.
- Entradas inválidas devem lançar um erro explícito ou retornar um fallback documentado (ex.: `Color.BLACK`), nunca produzir `new Color(NaN, NaN, NaN)`.
- Nenhuma cor inválida deve chegar ao arquivo `.java` gerado.

**Critério de aceite:**
- Dado qualquer string de cor inválida, o gerador rejeita a entrada de forma previsível.
- O código Java gerado nunca contém `NaN` em construtores de `Color`.

---

### 6.2 [P0] Garantir nomes únicos para variáveis e classes customizadas
**Arquivos-chave:** `src/generator/JavaGenerator.ts`, `webview/main.js`

- `variableName` de cada componente deve ser único no escopo do canvas.
- O nome da classe customizada gerada no `.java` deve ser desacoplado de valores diretamente editáveis pelo usuário quando houver risco de colisão.
- A geração de nomes deve ser determinística e garantida única por canvas.

**Critério de aceite:**
- Dois componentes no mesmo canvas nunca produzem a mesma classe `.java` por acidente.
- O código Java gerado compila em cenários com vários componentes customizados.

---

### 6.3 [P0] Aplicar defaults de configuração ao criar componentes
**Arquivos-chave:** `webview/main.js`, `src/config/ConfigReader.ts`, `src/canvas/CanvasPanel.ts`

- Ao abrir o builder, os defaults configurados (VS Code settings ou `.swingbuilder.json`) devem ser enviados à WebView.
- Ao fazer drop de um novo componente no canvas, os valores de cor, fonte e tamanho devem respeitar os defaults configurados, na ordem de precedência: **projeto (`.swingbuilder.json`) > VS Code settings > valores internos do código**.
- O comportamento deve ser consistente entre uma sessão nova e uma sessão reaberta.

**Critério de aceite:**
- Componentes novos nascem com os valores configurados, sem edição manual posterior.
- A ordem de precedência é respeitada para todos os campos configuráveis.

---

### 6.4 [P0] Detectar estrutura de projeto Java e inferir package/pasta de saída
**Arquivos-chave:** `src/extension.ts`, `src/generator/JavaGenerator.ts`, `src/config/ConfigReader.ts`

- A extensão deve detectar estruturas comuns de projeto Java: `src/main/java` (Maven/Gradle padrão), raiz com pasta `src`, etc.
- Quando uma estrutura reconhecível for detectada, a sugestão padrão de pasta de saída deve ser `<raiz-java>/components` em vez de um caminho genérico.
- O `package` declarado no `.java` gerado deve ser derivado automaticamente do caminho relativo da pasta de saída em relação à raiz de código-fonte detectada.
- **Para workspaces sem estrutura Java padrão:**
  - Apresentar um dialog picker para o usuário escolher a pasta de saída manualmente.
  - Como fallback, permitir que a pasta de saída seja definida em `.swingbuilder.json` para evitar o picker em toda geração.
- O fluxo de geração deve funcionar normalmente em workspaces sem estrutura Java reconhecida.

**Critério de aceite:**
- Em projetos Maven/Gradle padrão, a pasta sugerida é `src/main/java/components` e o `package` é `components` (ou subpacote coerente).
- Em workspaces sem estrutura padrão, o picker é exibido e a escolha é respeitada.
- `.swingbuilder.json` pode fixar a pasta de saída para suprimir o picker.
- O código Java gerado compila com o `package` correto nos dois cenários.

---

### 6.5 [P0] Revisar integração do JSON schema
**Arquivos-chave:** `package.json`, `schemas/swingbuilder.schema.json`

- A contribuição `jsonValidation` no `package.json` da extensão deve expor corretamente o schema para `.swingbuilder.json` quando a extensão estiver instalada (não apenas em desenvolvimento).
- O usuário deve ter autocomplete e validação inline ao editar `.swingbuilder.json` no VS Code.

**Critério de aceite:**
- Ao abrir `.swingbuilder.json` com a extensão instalada, VS Code exibe autocomplete e aponta erros de schema.
- Não há quebra de validação quando a extensão é carregada de um `.vsix`.

---

### 6.6 [P0] Fechar itens mínimos de publicação
**Arquivos-chave:** `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE`

- `README.md` deve conter: descrição da extensão, requisitos, instalação, como usar (com screenshots ou GIFs), comandos disponíveis e configurações suportadas.
- `CHANGELOG.md` deve ser criado com a entrada `0.0.2` e o histórico de mudanças.
- `LICENSE` deve ter o ano e o titular corretos (remover placeholders).
- `package.json` deve ter `publisher`, `categories`, `icon`, `repository`, `homepage` e `keywords` preenchidos de forma coerente com o Marketplace.
- A extensão deve ser empacotável com `vsce package` sem warnings críticos.

**Critério de aceite:**
- `vsce package` gera um `.vsix` sem erros.
- Um usuário novo consegue instalar e usar a extensão lendo apenas o `README.md`.

---

### 6.7 [P1] Remoção de componentes e validação de nomes no editor
**Arquivo-chave:** `webview/main.js`, `src/generator/JavaGenerator.ts`

- O usuário deve poder remover um componente selecionado com a tecla `Delete` ou `Backspace`.
- Opcionalmente, um botão de remoção pode ser exibido no painel de propriedades.
- `variableName` deve ser validado como identificador Java válido (ex.: sem espaços, sem palavras reservadas, começa com letra ou `_`).
- Nomes duplicados entre componentes do canvas devem gerar feedback visual (ex.: borda vermelha, mensagem de erro inline) e bloquear a geração até serem corrigidos.

**Critério de aceite:**
- `Delete`/`Backspace` remove o componente selecionado.
- Nome inválido ou duplicado é sinalizado visualmente e bloqueia a geração de código.

---

### 6.8 [P1] Undo/redo
**Arquivo-chave:** `webview/main.js`

- O canvas deve manter um histórico de estados que cobre: adição, remoção, movimentação e alteração de propriedades de componentes.
- `Ctrl+Z` / `Cmd+Z` desfaz a última ação.
- `Ctrl+Shift+Z` / `Ctrl+Y` refaz a última ação desfeita.
- O histórico não precisa ser persistido entre sessões na v0.0.2.

**Critério de aceite:**
- Mover um componente e pressionar `Ctrl+Z` retorna à posição anterior.
- Alterar uma propriedade e pressionar `Ctrl+Z` restaura o valor anterior.
- Redo funciona após undo.

---

### 6.9 [P1] Melhorar tratamento de erros
**Arquivo-chave:** `src/extension.ts`

- Blocos `catch` silenciosos devem ser substituídos por notificações de erro ou mensagens de log coerentes.
- Erros relevantes para debug devem ser preservados no Output Channel da extensão sem poluir a UX com popups excessivos.
- Mensagens de erro devem ser acionáveis: indicar o que falhou e, quando possível, como corrigir.

**Critério de aceite:**
- Nenhum erro crítico é silenciado sem registro.
- Erros de geração exibem mensagem útil ao usuário (ex.: VS Code notification com detalhe clicável).

---

### 6.10 [P1] Barra de ações do builder
**Arquivos-chave:** `src/canvas/CanvasPanel.ts`, `webview/main.js`, `webview/style.css`, `src/extension.ts`

- O builder deve exibir uma toolbar com botões para os comandos principais: **Novo**, **Abrir**, **Salvar**, **Gerar** e **Init Config**.
- Os botões devem acionar os mesmos handlers dos comandos da extensão (sem duplicação de lógica).
- Botões devem ter estado visual de desabilitado quando a ação não estiver disponível no contexto atual.
- Feedback visual (ex.: spinner, texto temporário) deve ser exibido durante operações de geração ou salvamento.

**Critério de aceite:**
- Todos os 5 comandos estão acessíveis via toolbar dentro do builder.
- Clicar em "Gerar" dentro do builder tem o mesmo efeito que executar `swingGuiBuilder.generate` pela Command Palette.

---

### 6.11 [P1] Zoom e pan do canvas
**Arquivos-chave:** `webview/main.js`, `webview/style.css`

- O usuário deve poder aumentar/diminuir o zoom do canvas (ex.: `Ctrl + scroll`, botões de zoom na toolbar).
- O usuário deve poder mover o viewport do canvas (ex.: clique com botão do meio + arrastar, ou scroll).
- Zoom e pan não devem quebrar a seleção de componentes nem o drag-and-drop.
- As coordenadas internas dos componentes (x, y, width, height) devem permanecer independentes do nível de zoom.

**Critério de aceite:**
- Zoom in/out funciona sem corromper o estado dos componentes.
- Pan do canvas não interfere na seleção ou no arraste de componentes.
- O código Java gerado usa coordenadas absolutas, não afetadas pelo zoom atual.

---

### 6.12 [P1] Redimensionamento de componentes por arraste
**Arquivos-chave:** `webview/main.js`, `webview/style.css`

- Componentes selecionados devem exibir handles visuais nas bordas/cantos.
- Arrastar um handle deve atualizar `width` e `height` em tempo real no canvas.
- O painel de propriedades deve refletir os novos valores imediatamente.
- O estado salvo deve conter os valores pós-resize.

**Critério de aceite:**
- Handles aparecem ao selecionar um componente.
- Arrastar um handle altera o tamanho visualmente e no painel de propriedades.
- O tamanho é preservado ao salvar e reabrir o layout.

---

### 6.13 [P2] Cobertura mínima de testes automatizados
**Arquivos-chave:** a definir pela equipe

- A equipe decide quais fluxos cobrir e o nível de cobertura, priorizando os bugs corrigidos nesta versão.
- Candidatos naturais: `hexToRgb` (cores válidas e inválidas), unicidade de nomes, aplicação de defaults de configuração.
- A infraestrutura de testes deve ser compatível com a toolchain existente.

**Critério de aceite:**
- Existe ao menos uma suíte de testes executável via `npm test` ou equivalente.
- Os fluxos cobertos pelo time passam consistentemente em CI.

---

## 7. Requisitos Não-Funcionais

| # | Requisito | Detalhe |
|---|-----------|---------|
| NF-1 | Retrocompatibilidade | Layouts `.swingbuilder-layout.json` salvos na v0.0.1 devem abrir normalmente na v0.0.2. |
| NF-2 | Performance do canvas | Operações de drag, resize e undo/redo devem responder em < 100ms para um canvas com até 50 componentes. |
| NF-3 | Código Java gerado | Deve compilar com `javac` sem modificações para todos os componentes suportados. |
| NF-4 | Empacotamento | `vsce package` deve concluir sem erros ou warnings críticos. |
| NF-5 | Compatibilidade VS Code | Manter compatibilidade com VS Code >= 1.85.0. |

---

## 8. Dependências e Riscos

| Item | Descrição | Mitigação |
|------|-----------|-----------|
| Detecção de estrutura Java | Projetos com estruturas não convencionais podem não ser detectados corretamente | Picker + fallback via `.swingbuilder.json` cobrem o caso de erro |
| Inferência de `package` | Renomear pastas pós-geração invalida o `package` | Documentar que o `package` é gerado no momento da geração, não é dinâmico |
| Undo/redo em WebView | Estado de histórico pode crescer sem limite em sessões longas | Limitar o histórico a N estados (ex.: 50) na implementação inicial |
| Schema `jsonValidation` | A URI do schema pode diferir entre dev e produção | Testar o `.vsix` instalado, não só o modo de desenvolvimento |

---

## 9. Métricas de Sucesso

- Zero ocorrências de `NaN` em código Java gerado durante smoke tests manuais com todas as cores de componente.
- Zero colisão de nomes de classe em canvas com 10+ componentes do mesmo tipo.
- 100% dos comandos da extensão acessíveis dentro do builder sem precisar da Command Palette.
- `vsce package` bem-sucedido e extensão instalável a partir do `.vsix`.
- Um desenvolvedor Java iniciante consegue instalar, criar um canvas com 3 componentes e gerar código Java válido em menos de 5 minutos, seguindo apenas o `README.md`.

---

## 10. Ordem de Implementação Recomendada

1. `6.1` — Corrigir `hexToRgb`
2. `6.2` — Resolver unicidade de nomes
3. `6.3` — Aplicar defaults configurados na criação
4. `6.4` — Detectar estrutura de projeto e `package`
5. `6.5` — Revisar schema/config
6. `6.6` — Fechar documentação e metadados de release
7. `6.10` — Adicionar toolbar de comandos no builder
8. `6.7` — Implementar delete + validação de nomes
9. `6.11` — Implementar zoom e pan
10. `6.12` — Implementar resize por arraste
11. `6.8` — Implementar undo/redo
12. `6.9` — Melhorar tratamento de erros
13. `6.13` — Criar testes mínimos

---

## 11. Resultado Esperado

Ao final da v0.0.2, a extensão deve:

- Gerar código Java **sempre válido e compilável**.
- Gerar `package` e pasta de saída **coerentes com projetos Java reais**.
- **Respeitar a configuração** esperada pelo usuário desde a criação do primeiro componente.
- Oferecer uma UX mais completa no canvas: toolbar de comandos, remoção de componentes, zoom, pan, resize e undo/redo.
- Estar **pronta para publicação no Marketplace** com documentação e metadados adequados.
