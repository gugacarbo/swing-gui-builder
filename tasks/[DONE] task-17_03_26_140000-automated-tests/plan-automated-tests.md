# Plan: Automated Tests

Criar suite de testes automatizados (unitários + integração) com foco em cobertura das funcionalidades críticas implementadas no PRD "fixes-and-improvements". Meta: 50-60% de cobertura nas áreas críticas, usando Vitest e GitHub Actions para CI.

---

## 📊 Estado Atual (Baseline)

### O que já existe
| Camada            | Status        | Observações                                      |
| ----------------- | ------------- | ------------------------------------------------ |
| Vitest config     | ✅ Existe      | `vitest: ^4.1.0` no package.json raiz            |
| Testes existentes | ⚠️ Parcial     | 2 testes em `src/generator/` (parity + ordering) |
| Testes webview    | ❌ Inexistente | Nenhum teste em `webview-app/src/`               |
| CI/CD             | ❌ Inexistente | Sem workflows GitHub Actions                     |
| Coverage report   | ❌ Inexistente | Sem @vitest/coverage-v8                          |

### Gaps identificados
1. **Sem vitest.config.ts na raiz** - Extensão não tem config de testes própria
2. **Webview sem infra de testes** - Sem Vitest, jsdom, testing-library
3. **Sem testes de hooks React** - useCanvasDragDrop, useCanvasState, etc.
4. **Sem testes de integração** - Fluxo completo package inference
5. **Sem CI pipeline** - Testes rodam apenas local

---

## Scope

### In Scope
- ✅ Configurar Vitest para extension (Node env)
- ✅ Configurar Vitest para webview-app (jsdom env)
- ✅ Testes unitários: JavaGenerator (package inference, subfolders, coords relativas)
- ✅ Testes unitários: codeHelpers (escapeJava, hexToRgb, etc.)
- ✅ Testes unitários: swingMappings (mapeamento de tipos)
- ✅ Testes unitários: useCanvasDragDrop (snap para Panel, parentOffset)
- ✅ Testes unitários: useCanvasState (actions, undo/redo)
- ✅ Testes unitários: componentDefaults (getDefaultProps, getDefaultSize)
- ✅ Testes de integração: fluxo canvas → gerar código → verificar package
- ✅ GitHub Actions workflow para rodar testes
- ✅ Coverage report com @vitest/coverage-v8

### Out of Scope
- ❌ Testes E2E com @vscode/test-electron (fase posterior)
- ❌ Testes de UI components React (Canvas, Palette, HierarchyPanel)
- ❌ Testes de comandos VS Code (generateCommand, previewCodeCommand)
- ❌ 90%+ coverage (meta é 50-60% crítico)
- ❌ Tests de snapshots do webview
- ❌ Playwright para webview

---

## Steps

### Fase 1: Infraestrutura de Testes

#### Step 1.1 - Criar vitest.config.ts para Extension
- **Arquivo:** `vitest.config.ts` (raiz)
- **Ação:** Criar config Vitest para testes da extensão (Node env, coverage v8)
- **Dependência:** nenhum
- **Detalhes:**
  - `include: ["src/**/*.test.ts"]`
  - `environment: "node"`
  - Coverage com @vitest/coverage-v8 declarado em devDependencies
  - Script `"test": "vitest run"` e `"test:watch": "vitest"` no package.json

#### Step 1.2 - Instalar dependências de teste na Extension
- **Arquivo:** `package.json` (raiz)
- **Ação:** Adicionar `@vitest/coverage-v8` em devDependencies
- **Dependência:** step 1.1

#### Step 1.3 - Criar vitest.config.ts para Webview
- **Arquivo:** `webview-app/vitest.config.ts`
- **Ação:** Criar config Vitest para testes do webview (jsdom env)
- **Dependência:** step 1.2
- **Detalhes:**
  - `environment: "jsdom"`
  - `setupFiles: ["./vitest.setup.ts"]`
  - `include: ["src/**/*.test.{ts,tsx}"]`
  - Alias `@/` para `./src/`

#### Step 1.4 - Instalar dependências de teste no Webview
- **Arquivo:** `webview-app/package.json`
- **Ação:** Adicionar `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`
- **Dependência:** step 1.3

#### Step 1.5 - Criar vitest.setup.ts para Webview
- **Arquivo:** `webview-app/vitest.setup.ts`
- **Ação:** Configurar testing-library matchers e mocks globais
- **Dependência:** step 1.4
- **Detalhes:**
  - Importar `@testing-library/jest-dom`
  - Mock de `crypto.randomUUID()` para testes

#### Step 1.6 - Adicionar scripts de teste no Webview
- **Arquivo:** `webview-app/package.json`
- **Ação:** Adicionar `"test"`, `"test:watch"`, `"test:coverage"` em scripts
- **Dependência:** step 1.5

### Fase 2: Testes Unitários - Extension

#### Step 2.1 - Testar codeHelpers.ts
- **Arquivo:** `src/generator/codeHelpers.test.ts`
- **Ação:** Criar testes para escapeJava, hexToRgb, supportsTextConstructor, isCustomComponent
- **Dependência:** step 1.2

#### Step 2.2 - Testar swingMappings.ts
- **Arquivo:** `src/generator/swingMappings.test.ts`
- **Ação:** Criar testes para getSwingClass, getComponentSwingType
- **Dependência:** step 1.2

#### Step 2.3 - Testar JavaGenerator - Package Inference
- **Arquivo:** `src/generator/JavaGenerator.package.test.ts`
- **Ação:** Testar que generateJavaFiles e generatePreviewJavaFiles aceitam package corretamente
- **Dependência:** step 1.2

#### Step 2.4 - Testar JavaGenerator - Subfolders
- **Arquivo:** `src/generator/JavaGenerator.subfolders.test.ts`
- **Ação:** Testar que componentes com parentId geram subfolder correto
- **Dependência:** step 2.3

#### Step 2.5 - Testar JavaGenerator - Coordenadas Relativas
- **Arquivo:** `src/generator/JavaGenerator.relative-coords.test.ts`
- **Ação:** Testar que filhos de Panel recebem setBounds com coords relativas
- **Dependência:** step 2.4

#### Step 2.6 - Testar componentGenerators.ts
- **Arquivo:** `src/generator/componentGenerators.test.ts`
- **Ação:** Testar generateComponentCode para Panel com filhos
- **Dependência:** step 2.5

### Fase 3: Testes Unitários - Webview

#### Step 3.1 - Testar componentDefaults.ts
- **Arquivo:** `webview-app/src/lib/componentDefaults.test.ts`
- **Ação:** Testar getDefaultProps e getDefaultSize para todos os tipos
- **Dependência:** step 1.5

#### Step 3.2 - Testar useCanvasDragDrop - Criação de componente
- **Arquivo:** `webview-app/src/hooks/useCanvasDragDrop.test.ts`
- **Ação:** Testar criação de componente a partir de drop da palette
- **Dependência:** step 3.1

#### Step 3.3 - Testar useCanvasDragDrop - Snap para Panel
- **Arquivo:** `webview-app/src/hooks/useCanvasDragDrop.test.ts`
- **Ação:** Testar detecção de drop dentro de Panel e cálculo de parentOffset
- **Dependência:** step 3.2

#### Step 3.4 - Testar useCanvasState - Actions
- **Arquivo:** `webview-app/src/hooks/useCanvasState.test.ts`
- **Ação:** Testar addComponent, updateComponent, deleteComponent, selectComponent
- **Dependência:** step 3.1

#### Step 3.5 - Testar useCanvasState - Undo/Redo
- **Arquivo:** `webview-app/src/hooks/useCanvasState.test.ts`
- **Ação:** Testar undo e redo de operações
- **Dependência:** step 3.4

#### Step 3.6 - Testar useUndoRedo hook isolado
- **Arquivo:** `webview-app/src/hooks/useUndoRedo.test.ts`
- **Ação:** Testar pushState, undo, redo, canUndo, canRedo
- **Dependência:** step 3.5

### Fase 4: Testes de Integração

#### Step 4.1 - Testar fluxo completo de package inference
- **Arquivo:** `src/integration/package-inference.test.ts`
- **Ação:** Testar que previewCommand e generateCommand produzem mesmo package
- **Dependência:** step 2.3
- **Nota:** Usar detectJavaProject e getOutputDirectory mocks

#### Step 4.2 - Testar fluxo Panel com filhos
- **Arquivo:** `src/integration/panel-children.test.ts`
- **Ação:** Criar estado com Panel + Button, gerar código, verificar subpasta e coords relativas
- **Dependência:** step 2.6

#### Step 4.3 - Testar fluxo canvas → código completo
- **Arquivo:** `src/integration/full-generation.test.ts`
- **Ação:** Testar canvas state complexo → JavaFiles → verificar package, subfolders, coords
- **Dependência:** step 4.2

### Fase 5: CI/CD

#### Step 5.1 - Criar workflow GitHub Actions
- **Arquivo:** `.github/workflows/test.yml`
- **Ação:** Criar workflow que roda testes em cada PR e push
- **Dependência:** step 1.6
- **Detalhes:**
  - Checkout, Setup Node, Setup pnpm
  - Install dependencies
  - Run `pnpm -r test` (recursivo em todos os packages)
  - Upload coverage report

#### Step 5.2 - Adicionar badge de status no README
- **Arquivo:** `README.md`
- **Ação:** Adicionar badge com status dos testes
- **Dependência:** step 5.1

#### Step 5.3 - Configurar coverage threshold
- **Arquivo:** `vitest.config.ts` (raiz e webview-app)
- **Ação:** Adicionar `coverage.thresholds` com metas realistas (50% global, 70% crítico)
- **Dependência:** step 5.1

### Fase 6: Documentação

#### Step 6.1 - Documentar como rodar testes
- **Arquivo:** `README.md`
- **Ação:** Adicionar seção "Testing" com comandos pnpm test, test:watch, test:coverage
- **Dependência:** step 1.6

#### Step 6.2 - Documentar coverage atual
- **Arquivo:** `tasks/task-17_03_26_140000-automated-tests/coverage-report.md`
- **Ação:** Criar relatório com coverage inicial e metas
- **Dependência:** fase 3 completa

---

## ⚠️ Riscos e Mitigações

| Risco                                    | Mitigação                                                 |
| ---------------------------------------- | --------------------------------------------------------- |
| jsdom não simula DOM perfeitamente       | Usar mocks para APIs específicas (crypto, ResizeObserver) |
| Testes de hooks React podem ser verbosos | Usar @testing-library/react-hooks ou wrapper simples      |
| Coverage threshold muito agressivo       | Começar com 50% e aumentar gradualmente                   |
| CI lento (pnpm install)                  | Usar pnpm cache e cache do Node                           |
| Dependências de VS Code API em testes    | Usar mocks para vscode.workspace, vscode.window           |

---

## 📝 Notas

- Os testes existentes (`JavaGenerator.parity.test.ts`, `JavaGenerator.ordering.test.ts`) servem como base para novos testes
- Meta de cobertura: **50-60% global**, com **70%+ em arquivos críticos** (JavaGenerator, codeHelpers, useCanvasDragDrop)
- CI deve rodar em paralelo: extension tests e webview tests como jobs separados
- Considerar usar `vi.stubGlobal` para mocks de VS Code API
- Testes de integração não abrem VS Code real, apenas testam lógica pura

---

## Dependências de Pacotes

### Extension (package.json raiz)
```json
{
  "devDependencies": {
    "@vitest/coverage-v8": "^4.1.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Webview (webview-app/package.json)
```json
{
  "devDependencies": {
    "vitest": "^4.1.0",
    "@vitest/coverage-v8": "^4.1.0",
    "jsdom": "^26.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Estrutura Final de Arquivos de Teste

```
swing-gui-builder-vscode/
├── vitest.config.ts                          # NOVO
├── src/
│   ├── generator/
│   │   ├── JavaGenerator.parity.test.ts      # EXISTE
│   │   ├── JavaGenerator.ordering.test.ts    # EXISTE
│   │   ├── JavaGenerator.package.test.ts     # NOVO
│   │   ├── JavaGenerator.subfolders.test.ts  # NOVO
│   │   ├── JavaGenerator.relative-coords.test.ts # NOVO
│   │   ├── codeHelpers.test.ts               # NOVO
│   │   ├── swingMappings.test.ts             # NOVO
│   │   └── componentGenerators.test.ts       # NOVO
│   └── integration/
│       ├── package-inference.test.ts         # NOVO
│       ├── panel-children.test.ts            # NOVO
│       └── full-generation.test.ts           # NOVO
├── webview-app/
│   ├── vitest.config.ts                      # NOVO
│   ├── vitest.setup.ts                       # NOVO
│   └── src/
│       ├── lib/
│       │   └── componentDefaults.test.ts     # NOVO
│       └── hooks/
│           ├── useCanvasDragDrop.test.ts     # NOVO
│           ├── useCanvasState.test.ts        # NOVO
│           └── useUndoRedo.test.ts           # NOVO
└── .github/
    └── workflows/
        └── test.yml                          # NOVO
```

---

## Métricas de Sucesso

- [ ] `pnpm -r test` passa com 0 erros
- [ ] Coverage global ≥ 50%
- [ ] Coverage em JavaGenerator.ts ≥ 70%
- [ ] Coverage em useCanvasDragDrop.ts ≥ 70%
- [ ] CI verde no GitHub Actions
- [ ] Badge de testes no README
