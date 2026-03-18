# Review US-007 — Componentes Swing

## Escopo avaliado

- `[DONE] task-15_03_26_131444-expand-swing-components`
- `[DONE] task-16_03_26_183407-complex-swing-components`
- `[DONE] task-16_03_26_183407-components-preview`

Base de avaliação: `review-checklist.md` (R1..R3, C1..C3, V1..V3), requisitos de cada task e evidências no código/artefatos.

---

## Resultado consolidado

| Task | Status | Resumo objetivo |
| --- | --- | --- |
| `task-15_03_26_131444-expand-swing-components` | **Concluída** | Escopo principal entregue (tipos, paleta, DnD, defaults, geração Java e props específicas). Evidências consistentes em código e `progress.txt`. |
| `task-16_03_26_183407-complex-swing-components` | **Parcial** | Componentes hierárquicos foram implementados, mas há inconsistência de configuração: template/reader aceitam tipos hierárquicos e schema de validação não lista esses tipos em `components.properties`. |
| `task-16_03_26_183407-components-preview` | **Parcial** | Recursos principais existem (frame visual, preview code com árvore, atalho Delete, seções colapsáveis), porém há desalinhamentos com o texto de requisito e rastreabilidade fraca de evidência por story. |

---

## Evidências de consistência (requisito x entrega)

### 1) task-15_03_26_131444-expand-swing-components

- Requisito pede expansão de componentes Swing + drag/drop e propriedades.
- Entrega observável:
  - Tipos e props compartilhadas: `shared/types/canvas.ts`.
  - Paleta com componentes esperados: `webview-app/src/components/Palette.tsx`.
  - Mapeamento correto da paleta para tipos internos: `webview-app/src/hooks/useCanvasDragDrop.ts`.
  - Defaults por tipo: `webview-app/src/lib/componentDefaults.ts`.
  - Inicialização de props/listeners na geração Java: `src/generator/codeHelpers.ts`.
- Conclusão: **aderente ao objetivo funcional da task**.

### 2) task-16_03_26_183407-complex-swing-components

- Requisito pede implementação de `JMenuBar`, `JMenu`, `JMenuItem`, `JToolBar`.
- Entrega observável:
  - Tipos hierárquicos em modelo compartilhado: `shared/types/canvas.ts`.
  - Renderização fixa de MenuBar/ToolBar no canvas: `webview-app/src/components/Canvas.tsx`, `Canvas/MenuBarZone.tsx`, `Canvas/ToolBarZone.tsx`.
  - Reordenação hierárquica: `webview-app/src/hooks/useHierarchyDragDrop.ts`.
  - Geração Java hierárquica: `src/generator/componentGenerators.ts`.
- Gap relevante:
  - `initConfigCommand.ts` e `ConfigReader.ts` incluem tipos hierárquicos (`MenuBar`, `Menu`, `MenuItem`, `ToolBar`), porém `schemas/swingbuilder.schema.json` não lista esses tipos em `components.properties`.
- Conclusão: **entrega funcional principal concluída, com inconsistência de contrato de configuração**.

### 3) task-16_03_26_183407-components-preview

- Requisito pede:
  - JFrame explícito no preview;
  - revisão/refatoração da visualização dos componentes;
  - menu de componentes e árvore colapsáveis;
  - atalho Delete;
  - preview de código com árvore de arquivos.
- Entrega observável:
  - Moldura visual de JFrame: `webview-app/src/components/Canvas.tsx`.
  - Renderização específica por tipo para componentes principais: `webview-app/src/components/CanvasComponent/previewRenderers.tsx`.
  - Seções colapsáveis com persistência: `Palette.tsx` e `HierarchyPanel.tsx` (localStorage + `aria-expanded`).
  - Atalho Delete com guarda para inputs/contentEditable: `webview-app/src/hooks/useKeyboardShortcuts.ts`.
  - Preview Code com árvore e modal readonly: `PreviewCodeModal.tsx`, `usePostMessage.ts`, `useExtensionListener.ts`, `src/commands/previewCodeCommand.ts`, `src/canvas/CanvasPanel.ts`.
- Gaps:
  - Ordem visual do sidebar está `Hierarchy` acima de `Palette` (`Sidebar.tsx`), enquanto o requisito textual sugere árvore “logo abaixo” do menu de componentes.
  - `progress.txt` e `prd.json` desta task trazem baixa granularidade de evidência por story (rastreabilidade fraca para auditoria posterior).
- Conclusão: **majoritariamente entregue, mas com desalinhamento de UX textual e lacuna documental**.

---

## Gaps e recomendações objetivas

| ID | Severidade | Gap | Evidência | Recomendação |
| --- | --- | --- | --- | --- |
| G1 | **Alto** | Schema não acompanha tipos hierárquicos aceitos pelo reader/template. | `src/config/initConfigCommand.ts`, `src/config/ConfigReader.ts`, `schemas/swingbuilder.schema.json` | Incluir `MenuBar`, `Menu`, `MenuItem`, `ToolBar` em `components.properties` do schema para eliminar divergência de validação. |
| G2 | **Médio** | Ordem dos painéis laterais pode contrariar requisito (“árvore logo abaixo”). | `webview-app/src/components/Sidebar.tsx` | Confirmar UX esperada; se o requisito for literal, inverter para `Palette` acima e `Hierarchy` abaixo. |
| G3 | **Médio** | Rastreabilidade documental insuficiente na task de preview (evidência agregada demais). | `tasks/[DONE] task-16_03_26_183407-components-preview/progress.txt`, `.../prd.json` | Padronizar log por story (arquivo/trecho/comando) para permitir auditoria cruzada por AC. |
| G4 | **Baixo** | Cobertura de fidelidade visual não explicita todos os tipos suportados (ex.: `PasswordField` segue fallback genérico). | `webview-app/src/components/CanvasComponent/previewRenderers.tsx` | Adicionar renderer dedicado para tipos restantes ou registrar explicitamente os não cobertos como decisão de escopo. |

---

## Parecer final (US-007)

- As três tasks foram efetivamente avaliadas.
- Há evidência de consistência entre requisitos e entregas no núcleo funcional.
- Existem gaps objetivos registrados com recomendação acionável.

**Status US-007:** ✅ **Atende**, com pendências de melhoria concentradas em consistência de schema/config e rastreabilidade documental.

