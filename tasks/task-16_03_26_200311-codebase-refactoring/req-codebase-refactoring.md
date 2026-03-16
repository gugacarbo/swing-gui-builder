# Codebase Refactoring

## Description

Refatorar o código visando separar componentes e funções em arquivos menores e aplicar melhores padrões de código para facilitar manutenção e implementação de novas features. Os arquivos atuais estão muito grandes e precisam ser modularizados.

## Context

- Projeto: swing-gui-builder-vscode
- Extension VS Code para criar interfaces Swing graficamente
- Possui webview-app com React/Vite/TypeScript
- Arquivos com responsabilidades múltiplas dificultam manutenção

## Decided Requirements

- [ ] Analisar estrutura atual e identificar arquivos grandes
- [ ] Separar componentes React em arquivos individuais
- [ ] Extrair funções utilitárias para arquivos dedicados
- [ ] Aplicar padrões de código consistentes
- [ ] Melhorar organização de pastas (features/modules)
- [ ] Documentar decisões de arquitetura
- [ ] Garantir que testes continuem passando após refatoração

### Phase 1: Analysis
- [ ] Mapear tamanhos e responsabilidades dos arquivos atuais
- [ ] Identificar code smells e anti-patterns
- [ ] Definir nova estrutura de pastas proposta

### Phase 2: Extension Code (src/)
- [ ] Separar responsabilidades do extension.ts
- [ ] Modularizar CanvasPanel.ts
- [ ] Organizar comandos e handlers

### Phase 3: Webview App (webview-app/)
- [ ] Separar componentes React em arquivos individuais
- [ ] Extrair hooks customizados
- [ ] Criar camada de serviços/utils
- [ ] Organizar tipos e interfaces

### Phase 4: Patterns & Standards
- [ ] Definir convenções de nomenclatura
- [ ] Aplicar SOLID principles onde aplicável
- [ ] Implementar barrel exports (index.ts)
- [ ] Padronizar tratamento de erros

### Phase 5: Validation
- [ ] Executar testes existentes
- [ ] Validar funcionamento da extensão
- [ ] Code review das mudanças

## Notes

- Manter backward compatibility durante refatoração
- Fazer commits granulares por fase
- Priorizar mudanças de maior impacto primeiro
