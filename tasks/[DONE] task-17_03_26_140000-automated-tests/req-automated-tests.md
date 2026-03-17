# Automated Tests

## Description

Criar suite de testes automatizados (unitários + integração + E2E) para cobrir todas as funcionalidades implementadas no PRD "fixes-and-improvements". O objetivo é garantir que as 13 user stories funcionem corretamente e previnir regressões futuras.

## Context

O PRD fixes-and-improvements introduz mudanças críticas em:
- **Extension side:** Inferência de package, estrutura de pastas organizada, coordenadas relativas
- **Webview side:** Layout da sidebar, drag-drop com snap, renderização de filhos de Panel
- **Shared types:** CanvasComponent com parentOffset, GeneratedFileWithPath

## Decided Requirements

### Testes Unitários - Extension


### Testes Unitários - Webview


### Testes de Integração

- [ ] Testar fluxo completo: canvas → gerar código → verificar package statement
- [ ] Testar fluxo completo: panel com filhos → gerar código → verificar subpastas
- [ ] Testar preview code e generate command produzem package idêntico

### Testes E2E (VS Code Extension)

- [ ] Testar drag & drop de botão para dentro de Panel
- [ ] Testar coordenadas relativas após mover Panel
- [ ] Testar zoom/pan não afeta sidebar
- [ ] Testar colapso individual de Hierarchy e Palette

## Notes

- Frameworks sugeridos: Vitest para unit/integration, @vscode/test-electron para E2E
-Considerar usar Playwright para testes do webview em browser
- Meta: 80%+ coverage nas áreas críticas
