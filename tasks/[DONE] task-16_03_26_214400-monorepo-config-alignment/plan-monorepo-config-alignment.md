# Plan: Monorepo Config Alignment

Planejamento para alinhar scripts de orquestracao no root, consistencia da documentacao e configuracao de workspace pnpm, com foco em execucao previsivel de lint/build/typecheck e atualizacao ampla de dependencias.

---

## 📊 Estado Atual (Baseline)

### O que ja existe
| Camada                                        | Status        | Observacoes                                                                                                   |
| --------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| Root scripts (`package.json`)                 | Parcial       | Existe `lint-all`, mas nao existe `lint`; README referencia `pnpm run lint` e falha no root.                  |
| Workspace (`pnpm-workspace.yaml`)             | Inconsistente | Inclui `src` e `shared` sem `package.json`; apenas `webview-app` e pacote root sao efetivamente pacotes hoje. |
| Frontend package (`webview-app/package.json`) | Bom           | Possui `lint`, `lint:fix`, `typecheck`, `build` funcionais.                                                   |
| Shared code (`shared/types`)                  | Parcial       | Existe codigo TS e artefatos JS (`canvas.js`, `canvas.js.map`) sem pacote proprio formalizado.                |
| Documentacao (`README.md`)                    | Desalinhada   | Lista comando `pnpm run lint` no bloco de validacao sem script correspondente no root.                        |

### Gaps identificados
1. Comandos de validacao no root nao refletem o fluxo real dos pacotes.
2. Politica do workspace pnpm esta indefinida entre pacote real e caminho de intencao futura.
3. Ausencia de checklist objetivo de verificacao no root.
4. Dependencias compartilhadas (ex.: TypeScript/Biome) estao desalinhadas entre root e `webview-app`.
5. `shared` nao esta formalizado como pacote apesar de ser candidato claro para compartilhamento no monorepo.

---

## Scope

### In Scope
- Padronizar scripts root para orquestrar lint, lint:fix, build e typecheck dos pacotes relevantes.
- Tornar validos e consistentes os comandos da documentacao.
- Definir e aplicar politica de workspace com `shared` como pacote real.
- Atualizar dependencias para versoes atuais e alinhar versoes compartilhadas entre pacotes.
- Adicionar checklist minimo de verificacao executavel a partir do root.

### Out of Scope
- Refatoracao funcional de features da extensao/webview.
- Mudanca de arquitetura de build para ferramentas diferentes (ex.: migrar para Turbo/Nx).
- Publicacao de novos pacotes npm externos.

---

## Steps

### Fase 1: Inventario e Politica de Workspace

#### Step 1.1 - Congelar baseline de scripts e comandos
- **Arquivo:** `package.json`
- **Acao:** mapear scripts existentes e definir matriz alvo de scripts root (`lint`, `lint:fix`, `typecheck`, `build`, `verify`) para orquestrar pacotes.
- **Dependencia:** nenhum

#### Step 1.2 - Definir formato final do workspace
- **Arquivo:** `pnpm-workspace.yaml`
- **Acao:** substituir globs ambiguos por pacotes reais; manter `webview-app` e incluir `shared` como pacote formal.
- **Dependencia:** step 1.1

#### Step 1.3 - Formalizar pacote shared
- **Arquivo:** `shared/package.json`
- **Acao:** criar manifesto minimo do pacote `shared` com scripts locais de `build`, `typecheck` e `lint`.
- **Dependencia:** step 1.2

#### Step 1.4 - Definir compilacao e saida do shared
- **Arquivo:** `shared/tsconfig.json`
- **Acao:** configurar compilacao de `shared/types/*.ts` e politica de artefatos gerados (`dist` ou limpeza de JS no fonte).
- **Dependencia:** step 1.3

### Fase 2: Orquestracao dos Scripts no Root

#### Step 2.1 - Criar scripts root canonicos
- **Arquivo:** `package.json`
- **Acao:** adicionar scripts faltantes no root (`lint`, `lint:fix`, `typecheck`) usando recursao pnpm nos pacotes do workspace.
- **Dependencia:** step 1.4

#### Step 2.2 - Revisar script de build integrado
- **Arquivo:** `package.json`
- **Acao:** ajustar `compile`/`build:webview` para nao duplicar passos e manter pipeline previsivel para extensao + webview + shared.
- **Dependencia:** step 2.1

#### Step 2.3 - Criar comando unico de verificacao
- **Arquivo:** `package.json`
- **Acao:** adicionar `verify` (ou `check`) com ordem fixa: install precondicao, lint, typecheck e build.
- **Dependencia:** step 2.2

### Fase 3: Alinhamento de Dependencias

#### Step 3.1 - Auditar versoes atuais por pacote
- **Arquivo:** `package.json`
- **Acao:** comparar dependencias root, `webview-app` e novo `shared` para identificar conflitos (TypeScript, Biome, tipos, tooling).
- **Dependencia:** step 2.3

#### Step 3.2 - Atualizar dependencias do root
- **Arquivo:** `package.json`
- **Acao:** atualizar para ultimas versoes compativeis com VS Code extension e ferramentas de build/lint.
- **Dependencia:** step 3.1

#### Step 3.3 - Atualizar dependencias do webview
- **Arquivo:** `webview-app/package.json`
- **Acao:** atualizar deps/devDeps para latest estavel e remover duplicidades de Biome (`@biomejs/biome` vs `biome`).
- **Dependencia:** step 3.2

#### Step 3.4 - Alinhar versoes compartilhadas entre pacotes
- **Arquivo:** `pnpm-workspace.yaml`
- **Acao:** aplicar estrategia de consistencia (ex.: `overrides` ou padrao de versao) para toolchain comum.
- **Dependencia:** step 3.3

### Fase 4: Documentacao e Checklist de Verificacao

#### Step 4.1 - Corrigir comandos de desenvolvimento no README
- **Arquivo:** `README.md`
- **Acao:** substituir comandos invalidos por scripts reais do root e descrever fluxo oficial para monorepo.
- **Dependencia:** step 2.3

#### Step 4.2 - Registrar politica de workspace e pacotes
- **Arquivo:** `README.md`
- **Acao:** incluir secao curta explicando quais diretorios sao pacotes pnpm e por que `shared` foi formalizado.
- **Dependencia:** step 1.4

#### Step 4.3 - Adicionar checklist minimo de validacao
- **Arquivo:** `README.md`
- **Acao:** criar checklist executavel no root (`pnpm install`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run build`/`verify`).
- **Dependencia:** step 4.1

### Fase 5: Validacao Tecnica Final

#### Step 5.1 - Executar instalacao limpa do workspace
- **Arquivo:** `pnpm-lock.yaml`
- **Acao:** rodar install e atualizar lockfile com novas versoes e novos pacotes do workspace.
- **Dependencia:** step 3.4

#### Step 5.2 - Validar lint/typecheck/build no root
- **Arquivo:** `package.json`
- **Acao:** executar pipeline completo e corrigir inconsistencias residuais de scripts/filtros.
- **Dependencia:** step 5.1

#### Step 5.3 - Verificacao de documentacao vs realidade
- **Arquivo:** `README.md`
- **Acao:** confirmar que todos os comandos documentados funcionam sem ajustes manuais extras.
- **Dependencia:** step 5.2

---

## ⚠️ Riscos e Mitigacoes

| Risco                                                                     | Mitigacao                                                                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Atualizacao ampla quebrar compatibilidade (especialmente VS Code tooling) | Atualizar em lotes pequenos, validar pipeline apos cada lote e travar versoes estaveis no lockfile.           |
| Formalizacao de `shared` introduzir conflito de paths/compilacao          | Definir contrato explicito de entrada/saida no `shared/tsconfig.json` e revisar imports que usam `@shared/*`. |
| Scripts recursivos pnpm executarem em pacotes indevidos                   | Usar filtros explicitos e/ou nomes canonicos de scripts por pacote.                                           |
| Documentacao desatualizar novamente                                       | Tratar `README` como parte do Definition of Done de toda mudanca de scripts.                                  |

---

## 📝 Notas

- Preferencias confirmadas: prioridade em funcionalidade completa, sem restricao de tempo, e atualizacao ampla de dependencias.
- Decisao de workspace derivada da clarificacao: `shared` deve virar pacote real (nao apenas caminho de intencao futura).

---

## ✅ Checklist de Validacao do Plano

- [x] Cada step tem arquivo especifico.
- [x] Dependencias entre steps estao corretas e sem ciclo.
- [x] Steps possuem foco unico e granularidade de 30-60 min.
- [x] Nao ha steps ambiguos.
- [x] Ordem de execucao esta logica (baseline -> scripts -> deps -> docs -> validacao).
