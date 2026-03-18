# PRD: Test Coverage e Reorganização da Pasta de Testes

## Introdução

Objetivo: reorganizar a estrutura de testes (mover `*.test.ts` para pastas `tests/`) e elevar a cobertura de testes unitários para 95% em statements/lines/functions/branches. Baseado em [plan-test-coverage.md](tasks/task-17_03_26_170000-test-coverage/plan-test-coverage.md).

## Goals
- Reorganizar testes em `tests/` no repositório raiz e em `webview-app/tests/`.
- Atualizar configurações do Vitest para apontar para `tests/`.
- Garantir que testes unitários passem após migração.
- Atingir cobertura mínima de 95% em statements/lines/functions/branches.
- Entrega faseada: mover e validar primeiro; adicionar testes faltantes em etapa posterior.

## User Stories

### US-001: Criar estrutura `tests/`
**Description:** Como mantenedor do repositório, quero pastas de testes dedicadas para separar testes do código-fonte.

**Group:** A

**Acceptance Criteria:**
- [ ] Pastas criadas no root: `tests/commands`, `tests/components`, `tests/config`, `tests/generator`, `tests/integration`, `tests/utils`.
- [ ] Pastas criadas em `webview-app/tests/lib` e `webview-app/tests/hooks`.
- [ ] Commit contendo apenas a criação das pastas e um README mínimo em cada ('se aplicável).

### US-002: Atualizar configurações do Vitest
**Description:** Como engenheiro de build, preciso que o `vitest.config.ts` aponte para `tests/` para que a execução de testes detecte os arquivos movidos.

**Group:** A

**Acceptance Criteria:**
- [ ] `vitest.config.ts` substitui `include: ["src/**/*.test.ts"]` por `include: ["tests/**/*.test.ts"]`. Veja [vitest.config.ts](vitest.config.ts).
- [ ] `webview-app/vitest.config.ts` atualiza `include` para `tests/**/*.test.{ts,tsx}`. Veja [webview-app/vitest.config.ts](webview-app/vitest.config.ts).
- [ ] Typecheck/linters passam.

### US-003: Mover arquivos de teste e atualizar imports
**Description:** Como desenvolvedor, quero que os testes sejam movidos para `tests/` mantendo imports corretos.

**Group:** B

**Acceptance Criteria:**
- [ ] Arquivos listados em [plan-test-coverage.md](tasks/task-17_03_26_170000-test-coverage/plan-test-coverage.md) foram movidos para `tests/` correspondentes.
- [ ] Todos os imports relativos dentro dos testes atualizados e compilam sem erros.
- [ ] Execução `pnpm test` no root passa localmente.

### US-004: Validar integração do webview-app
**Description:** Como responsável pela webview, quero mover e validar os testes do `webview-app` para a nova pasta.

**Group:** B

**Acceptance Criteria:**
- [ ] Testes movidos para `webview-app/tests/` e `pnpm --dir webview-app test` passa.

### US-005: Aumentar cobertura até 95% (fase 2)
**Description:** Como time de qualidade, quero adicionar testes faltantes para alcançar 95% de coverage em metrics-chave.

**Group:** C

**Acceptance Criteria:**
- [ ] Thresholds de coverage ajustados para 95% em `vitest.config.ts` e `webview-app/vitest.config.ts`.
- [ ] `pnpm test:coverage` retorna >=95% em statements/lines/functions/branches.
- [ ] Arquivos com baixa cobertura (ex.: `generateCommand.ts`, `codeHelpers.ts`) têm testes cobrindo casos críticos.

## Functional Requirements
- FR-1: Criar diretórios `tests/` listados no plano.
- FR-2: Atualizar `include` em [vitest.config.ts](vitest.config.ts) e [webview-app/vitest.config.ts](webview-app/vitest.config.ts) para `tests/**`.
- FR-3: Atualizar todos os caminhos relativos em arquivos de teste movidos.
- FR-4: Garantir que `pnpm test` e `pnpm test:coverage` executem com sucesso após migração.
- FR-5: Ajustar thresholds de coverage para 95% (configurável por ambiente CI).
- FR-6: Documentar o processo de migração em `tasks/task-17_03_26_170000-test-coverage/README.md` minimal.

## Non-Goals
- Não alterar código-fonte (fixes no source são out-of-scope nesta tarefa inicial).
- Não incluir testes E2E nesta fase (escopo definido como unitário/integration conforme seleção).
- Não reescrever ou refatorar a lógica de negócio para melhorar testabilidade nesta tarefa.

## Technical Considerations
- Ajustes nos imports relativos ao mover arquivos: prefira caminhos relativos estáveis (`../../`) e evite aliases que não estejam resolvidos no ambiente de teste.
- Verificar se o alias `@` em `webview-app` continua válido ou precisa ser tratado nos testes.
- CI: atualizar workflow que executa `pnpm test`/`pnpm test:coverage` para refletir novos paths.

## Success Metrics
- Cobertura de testes (statements/lines/functions/branches) >= 95% no relatório `pnpm test:coverage`.
- `pnpm test` no root e em `webview-app` passa sem erros após migração.
- Mudanças de configuração e arquivos de teste revisadas e aceitas em PR.

## Open Questions
- Confirmado: entregaremos de forma faseada (mover primeiro, depois adicionar testes); há janela preferida para a fase 2?
- Existe alguma test-suite que precise permanecer em `src/` por dependência de build/loader? Se sim, listar.

---

## Plano de Ação Recomendado (resumo)
1. Criar diretórios `tests/` (Group A).
2. Atualizar `vitest.config.ts` e `webview-app/vitest.config.ts` para apontar `tests/` (Group A).
3. Mover testes e atualizar imports (Group B).
4. Validar execução de `pnpm test` localmente e em CI.
5. Fase 2: adicionar testes faltantes para atingir 95% e ajustar thresholds (Group C).

Arquivo relacionado: [plan-test-coverage.md](tasks/task-17_03_26_170000-test-coverage/plan-test-coverage.md)
