# Plan: Test Coverage and Tests Folder Reorganization

Reorganizar arquivos de teste para pasta `tests/` e aumentar cobertura para 95%+ (target: 100%).

---

## 📊 Estado Atual (Baseline)

### Cobertura Atual (execucao real)
| Metrica   | Atual | Meta   |
| --------- | ----- | ------ |
| Lines     | 79.9% | 95%+   |
| Functions | 96.6% | 95%+ ✓ |
| Branches  | 68.9% | 95%+   |

### Arquivos com menor cobertura (prioridade)
| Arquivo            | Coverage | Prioridade |
| ------------------ | -------- | ---------- |
| generateCommand.ts | 48.57%   | Alta       |
| codeHelpers.ts     | 49.33%   | Alta       |

### Estrutura de testes atual

| Camada                   | Status      | Observações                              |
| ------------------------ | ----------- | ---------------------------------------- |
| **Root tests**           | Ausente     | Não existe pasta `tests/` no root        |
| **webview-app tests**    | Ausente     | Não existe pasta `tests/` no webview-app |
| **Arquivos .test.ts**    | em src/     | 18 arquivos distribuídos em subpastas    |
| **webview-app .test.ts** | em src/     | 4 arquivos em src/lib e src/hooks        |
| **Config vitest**        | Configurado | `include: ["src/**/*.test.ts"]`          |
| **webview-app vitest**   | Configurado | `include: ["src/**/*.test.{ts,tsx}"]`    |
| **Coverage thresholds**  | 50%         | Mínimo atual: 50%                        |

### Gaps identificados

1. **Estrutura de pastas** - Arquivos de teste misturados com código-fonte em `src/`
2. **Caminhos de importação** - Ao mover, precisam ser atualizados de `../` para `../../`
3. **Configuração vitest** - Precisa mudar `include` de `src/**/*.test.ts` para `tests/**/*.test.ts`
4. **Cobertura insuficiente** - Lines: 79.9%, Branches: 68.9% (meta: 95%+)
5. **Coverage badges** - Scripts de coverage podem precisar de ajustes

---

## Scope

### In Scope
- Criar pasta `tests/` no projeto raiz
- Criar pasta `tests/` no webview-app
- Mover todos os arquivos `.test.ts` do `src/` para `tests/`
- Mover todos os arquivos `.test.ts` do `webview-app/src/` para `webview-app/tests/`
- Atualizar caminhos de importação nos arquivos movidos
- Atualizar configuração do vitest em ambos os projetos
- Executar testes para validar funcionamento
- Aumentar coverage threshold para 95%+
- Adicionar testes faltantes para atingir meta de cobertura

### Out of Scope
- Modificar código-fonte (apenas testes)
- Alterar estrutura de pastas que não sejam de testes

---

## Steps

### Fase 1: Preparação e Criação de Estrutura

#### Step 1.1 - Criar pastas tests/
- **Arquivo:** N/A (criação de diretórios)
- **Ação:** Criar diretórios:
  - `tests/commands/`
  - `tests/components/`
  - `tests/config/`
  - `tests/generator/`
  - `tests/integration/`
  - `tests/utils/`
  - `webview-app/tests/lib/`
  - `webview-app/tests/hooks/`
- **Dependência:** nenhuma

#### Step 1.2 - Atualizar vitest.config.ts (projeto raiz)
- **Arquivo:** `vitest.config.ts`
- **Ação:** Mudar `include` de `["src/**/*.test.ts"]` para `["tests/**/*.test.ts"]`
- **Dependência:** step 1.1

#### Step 1.3 - Atualizar vitest.config.ts (webview-app)
- **Arquivo:** `webview-app/vitest.config.ts`
- **Ação:** Mudar `include` de `["src/**/*.test.{ts,tsx}"]` para `["tests/**/*.test.{ts,tsx}"]`
- **Dependência:** step 1.1

---

### Fase 2: Mover Arquivos e Atualizar Importações

#### Step 2.1 - Mover testes de generator/
- **Arquivo:** `src/generator/*.test.ts` → `tests/generator/`
- **Ação:** Mover 9 arquivos de teste do generator e atualizar imports:
  - JavaGenerator.ordering.test.ts
  - JavaGenerator.package.test.ts
  - JavaGenerator.parity.test.ts
  - JavaGenerator.relative-coords.test.ts
  - JavaGenerator.subfolders.test.ts
  - componentGenerators.test.ts
  - codeHelpers.test.ts
  - swingMappings.test.ts
  - De `import { ... } from "../components/ComponentModel"` → `import { ... } from "../../components/ComponentModel"`
  - De `import { ... } from "./JavaGenerator"` → `import { ... } from "../../generator/JavaGenerator"`
  - De `import { ... } from "./componentGenerators"` → `import { ... } from "../../generator/componentGenerators"`
  - De `import { ... } from "./codeHelpers"` → `import { ... } from "../../generator/codeHelpers"`
- **Dependência:** step 1.2

#### Step 2.2 - Mover testes de utils/
- **Arquivo:** `src/utils/*.test.ts` → `tests/utils/`
- **Ação:** Mover JavaPackageInference.test.ts e atualizar imports
- **Dependência:** step 1.2

#### Step 2.3 - Mover testes de commands/
- **Arquivo:** `src/commands/*.test.ts` → `tests/commands/`
- **Ação:** Mover generateCommand.test.ts e atualizar imports
- **Dependência:** step 1.2

#### Step 2.4 - Mover testes de integration/
- **Arquivo:** `src/integration/*.test.ts` → `tests/integration/`
- **Ação:** Mover 3 arquivos e atualizar imports
- **Dependência:** step 1.2

#### Step 2.5 - Mover webview-app/lib/
- **Arquivo:** `webview-app/src/lib/*.test.ts` → `webview-app/tests/lib/`
- **Ação:** Mover componentDefaults.test.ts
- **Dependência:** step 1.3

#### Step 2.6 - Mover webview-app/hooks/
- **Arquivo:** `webview-app/src/hooks/*.test.ts` → `webview-app/tests/hooks/`
- **Ação:** Mover 3 arquivos de hooks e atualizar imports
- **Dependência:** step 1.3

---

### Fase 3: Validar Funcionamento

#### Step 3.1 - Executar testes do projeto raiz
- **Arquivo:** N/A
- **Ação:** Executar `pnpm test` para validar que os testes funcionam após a migração
- **Dependência:** steps 2.1-2.4

#### Step 3.2 - Executar testes do webview-app
- **Arquivo:** N/A
- **Ação:** Executar `pnpm --dir webview-app test` para validar funcionamento
- **Dependência:** steps 2.5-2.6

---

### Fase 4: Aumentar Cobertura para 95%+

#### Step 4.1 - Atualizar thresholds de coverage
- **Arquivo:** `vitest.config.ts`
- **Ação:** Alterar thresholds de 50% para 95%+ (target: 100%):
```typescript
thresholds: {
  statements: 95,
  functions: 95,
  lines: 95,
  branches: 95,
}
```
- **Dependência:** step 3.1

#### Step 4.2 - Atualizar thresholds do webview-app
- **Arquivo:** `webview-app/vitest.config.ts`
- **Ação:** Alterar thresholds de 50% para 95%
- **Dependência:** step 3.2

#### Step 4.3 - Analisar coverage atual
- **Arquivo:** N/A
- **Ação:** Executar `pnpm test:coverage` e analisar quais arquivos/funções não estão cobertos
- **Dependência:** step 4.1

#### Step 4.4 - Adicionar testes faltantes
- **Arquivo:** Arquivos identificados na análise
- **Ação:** Criar novos testes para cobrir código não testado, focado em:
  - CanvasPanel.ts
  - ComponentModel.ts
  - extension.ts
  - Comandos não testados
- **Dependência:** step 4.3

#### Step 4.5 - Validar coverage final
- **Arquivo:** N/A
- **Ação:** Executar `pnpm coverage` e verificar se atingiu 95%+
- **Dependência:** step 4.4

---

### Fase 5: Limpeza e Validação Final

#### Step 5.1 - Remover arquivos antigos
- **Arquivo:** Arquivos .test.ts antigos em src/
- **Ação:** Deletar os arquivos originais que foram movidos
- **Dependência:** step 3.1

#### Step 5.2 - Testar coverage merged
- **Arquivo:** N/A
- **Ação:** Executar `pnpm coverage` para validar que coverage badges funcionam
- **Dependência:** step 5.1

---

## ⚠️ Riscos e Mitigações

| Risco                        | Mitigação                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Quebrar imports após mover   | Atualizar todos os caminhos de importação sistematicamente                                      |
| Tests falharem após migração | Executar testes após cada phase antes de prosseguir                                             |
| Coverage não atingir 95%     | Adicionar testes específicos para código não coberto                                            |
| Coverage badges quebrarem    | Verificar scripts de coverage após mudanças                                                     |
| Branches difíceis de cobrir  | Branches têm cobertura atual de 68.9% - pode precisar de testes específicos para casos de borda |

---

## 📝 Notas

- **Contagem corrigida:** 18 arquivos de teste no src/ (não 16), 9 no generator/ (não 8)
- **Aliases webview-app:** O alias `@` para `./src` pode precisar de ajuste ou novos testes podem precisar usar caminhos relativos
- **Arquivo .agents/skills:** O teste em `.agents/skills/dev-browser/src/snapshot/__tests__/snapshot.test.ts` não faz parte do escopo principal - está fora das pastas `src/` e `webview-app/src/`
- **Ordem de execução:** Seguir a ordem dos steps para evitar problemas de dependência
