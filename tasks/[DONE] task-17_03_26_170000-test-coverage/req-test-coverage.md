# Test Coverage and Tests Folder Reorganization

## Description

Reorganizar todos os arquivos de teste para uma pasta `tests/` na raiz de cada projeto (raiz e webview-app), mover os arquivos `.test.ts` existentes mantendo a estrutura de diretórios, e aumentar a cobertura de testes para 95%+.

## Current State

### Root Project (src/)
| Pasta Atual      | Arquivos de Teste                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| src/utils/       | JavaPackageInference.test.ts                                                                     |
| src/commands/    | generateCommand.test.ts                                                                          |
| src/integration/ | panel-children.test.ts, package-inference.test.ts, full-generation.test.ts                       |
| src/generator/   | JavaGenerator.*.test.ts, componentGenerators.test.ts, codeHelpers.test.ts, swingMappings.test.ts |

### webview-app
| Pasta Atual            | Arquivos de Teste                                                      |
| ---------------------- | ---------------------------------------------------------------------- |
| webview-app/src/lib/   | componentDefaults.test.ts                                              |
| webview-app/src/hooks/ | useCanvasState.test.ts, useCanvasDragDrop.test.ts, useUndoRedo.test.ts |

## Decided Requirements

- [ ] Criar pasta `tests/` na raiz do projeto principal
- [ ] Criar pasta `tests/` na raiz do webview-app
- [ ] Mover arquivos de teste do `src/` para `tests/` mantendo estrutura de diretórios
- [ ] Mover arquivos de teste do `webview-app/src/` para `webview-app/tests/` mantendo estrutura de diretórios
- [ ] Atualizar caminhos de importação nos arquivos movidos
- [ ] Atualizar configuração do vitest para reconhecer a nova estrutura
- [ ] Executar testes para garantir que nada quebrou
- [ ] Aumentar cobertura para 95%+
- [ ] Verificar se coverage badges continuam funcionando

## Decisions

- **Tipo de reorganização:** Mover arquivos existentes para `tests/`
- **Escopo:** Ambos os projetos (raiz e webview-app)
- **Meta de cobertura:** 95%+
