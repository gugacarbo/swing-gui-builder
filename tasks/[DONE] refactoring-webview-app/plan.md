# Plan: Refatoração WebView-App

**TL;DR:** Reorganizar webview-app extraindo código duplicado, dividindo arquivos grandes e criando utilitários reutilizáveis. Redução de ~30% no tamanho total com melhor separação de responsabilidades.

**Principais arquivos problemáticos:**
- `Canvas.tsx` (264 linhas, 3 responsabilidades) → dividir em 2 hooks
- `PropertiesPanel.tsx` (184 linhas, código duplicado) → criar FormField genérico
- `CanvasComponent.tsx` (193 linhas) → extrair hook de interação

---

## Steps (4 Fases)

### Fase 1: Foundations *(sem dependências)*
1. Criar `lib/constants.ts` — zoom limits, size constraints (~20 linhas)
2. Criar `lib/componentDefaults.ts` — mapeamentos extraídos de Canvas.tsx (~60 linhas)
3. Criar `lib/geometry.ts` — funções puras de cálculo (~50 linhas)

### Fase 2: Hooks *(depende de Fase 1)*
1. `hooks/useCanvasDragDrop.ts` — drag&drop do canvas (~60 linhas)
2. `hooks/useCanvasZoomPan.ts` — zoom e pan (~80 linhas)
3. `hooks/useDragInteraction.ts` — estado de move/resize (~70 linhas)
4. `hooks/useKeyboardShortcuts.ts` — atalhos undo/redo (~30 linhas)

### Fase 3: Componentes *(depende de Fase 2, pode ser paralelo)*
1. Refatorar `Canvas.tsx` — usar novos hooks (264 → ~80 linhas)
2. Refatorar `CanvasComponent.tsx` — usar useDragInteraction (193 → ~100 linhas)
3. Criar pasta `components/PropertiesPanel/`:
   - `FormField.tsx` genérico (~40 linhas)
   - `NumberField.tsx` + `ColorField.tsx` (~50 linhas total)
   - Refatorar `PropertiesPanel.tsx` (184 → ~80 linhas)
4. Refatorar `App.tsx` — usar useKeyboardShortcuts (138 → ~80 linhas)

### Fase 4: Validação
1. Atualizar imports, remover código morto
2. Testar: drag&drop, zoom/pan, resize, undo/redo, propriedades
3. Build de produção (`pnpm build`)

---

## Relevant files

- `webview-app/src/components/Canvas.tsx` — remover ~184 linhas, usar novos hooks
- `webview-app/src/components/CanvasComponent.tsx` — remover ~93 linhas, usar useDragInteraction
- `webview-app/src/components/PropertiesPanel.tsx` — transformar em pasta com 4 arquivos
- `webview-app/src/App.tsx` — remover ~58 linhas de handlers/effects
- `webview-app/src/lib/` — 3 novos arquivos (constants, componentDefaults, geometry)
- `webview-app/src/hooks/` — 4 novos hooks

---

## Verification

1. `pnpm build` compila sem erros
2. Drag & drop de paleta funciona
3. Zoom (scroll + botões) e pan funcionam
4. Mover e resize componentes funcionam
5. Undo/redo (Ctrl+Z/Y) funciona
6. Propriedades sincronizam corretamente
7. Geração de código Java funciona

---

## Further Considerations

1. **Criar ResizeHandles como componente separado?**
   - Recomendação: Não por enquanto, manter inline (pode ser extraído depois)
2. **Refatorar types/schemas juntos?**
   - Recomendação: Não, deixar para outro PR (são funcionais e não afetam organização)
