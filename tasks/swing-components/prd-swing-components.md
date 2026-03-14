# PRD: Expansão de Componentes Swing no Builder

## 1. Introdução / Visão Geral

Expandir o suporte de componentes Swing no Swing GUI Builder para cobrir o escopo definido (JFrame implícito, JPanel, e componentes de entrada/seleção/progresso) com foco em fidelidade visual no canvas e suporte a geração Java. A entrega será faseada: começar por um MVP funcional e estender para maior fidelidade visual e propriedades completas.

Público-alvo primário: desenvolvedores que usam o gerador Java.

Decisão chave do cliente: não é obrigatório que a geração passe por compilação automática (`javac`) como requisito de aceitação; porém a saída deverá ser plausível e verificável manualmente.

## 2. Objetivos

- Fornecer suporte a novos componentes Swing na paleta e canvas com drag & drop funcional.
- Garantir paridade de tipos entre backend (extensão) e frontend (webview) para evitar dessincronias.
- Entregar um MVP que permita criar telas, editar propriedades mínimas e gerar código Java válido em formato (legível) — seguir com melhorias visuais em fases posteriores.
- Priorizar a experiência do desenvolvedor que usa o gerador Java (clareza e consistência do modelo de componentes).

## 3. User Stories

### US-001: Fonte de verdade de tipos

**Descrição:** Como mantenedor, quero que `ComponentType` esteja sincronizado entre `src/components/ComponentModel.ts` e `webview-app/src/types` para evitar dessincronias.

**Acceptance Criteria:**
- [ ] `ComponentType` definido na extensão contém os novos tipos suportados
- [ ] Tipos equivalentes definidos no frontend (tipos TypeScript)
- [ ] Typecheck/lint passa no monorepo

### US-002: Itens da paleta e arrasto

**Descrição:** Como usuário do builder, quero ver os novos componentes na paleta e arrastá-los para o canvas.

**Acceptance Criteria:**
- [ ] Cada novo tipo aparece em `webview-app/src/components/Palette.tsx`
- [ ] Drag inicia a partir da paleta e o drop cria um componente no canvas
- [ ] Ao soltar, o componente é criado com propriedades default apropriadas
- [ ] Verify in browser using dev-browser skill

### US-003: Defaults por tipo

**Descrição:** Como usuário, quero que componentes sejam criados com tamanho e propriedades padrão úteis para permitir edição imediata.

**Acceptance Criteria:**
- [ ] `webview-app/src/lib/componentDefaults.ts` inclui defaults mínimos por tipo (tamanho, texto, valores de lista/intervalo)
- [ ] Generated model contains fields required for Java generation
- [ ] Typecheck/lint passa

### US-004: Painel de propriedades mínimo

**Descrição:** Como usuário, quero editar as propriedades essenciais de cada componente após colocá-lo no canvas.

**Acceptance Criteria:**
- [ ] Propriedades comuns (id/nome, bounds, texto, enabled) editáveis em `PropertiesPanel`
- [ ] Alterações atualizam o modelo e persistem no estado do canvas
- [ ] Verify in browser using dev-browser skill

### US-005: Geração Java (MVP)

**Descrição:** Como desenvolvedor, quero que o gerador em `src/generator/JavaGenerator.ts` produza código Java coerente que represente os componentes criados.

**Acceptance Criteria:**
- [ ] Mapeamento básico tipo->classe Swing implementado (e.g., `JLabel`, `JButton`, `JTextField`)
- [ ] Gerador produz código compilável em muitos cenários comuns (teste manual)
- [ ] Saída não contém referências a propriedades inexistentes

### US-006: Fidelidade visual gradual

**Descrição:** Como usuário, quero que o canvas represente visualmente os componentes com fidelidade incremental (cores, bordas, tamanhos reais) após o MVP.

**Acceptance Criteria:**
- [ ] Implementar melhorias visuais em fases (lista de checkpoints no PRD)
- [ ] Cada checkpoint tem verificação visual no webview
- [ ] Verify in browser using dev-browser skill

## 4. Requisitos Funcionais

- FR-1: A extensão deve expor um enum `ComponentType` atualizado com os novos tipos.
- FR-2: O frontend deve mapear itens da paleta para `ComponentType` e disparar criação no drop.
- FR-3: O sistema deve atribuir defaults mínimos no momento da criação (tamanho, texto padrão quando aplicável).
- FR-4: O painel de propriedades deve permitir edição e salvar mudanças no estado do canvas.
- FR-5: O gerador Java deve aceitar o modelo e produzir um arquivo Java por tela com importações e inicialização de componentes.
- FR-6: O schema `schemas/swingbuilder.schema.json` deve permitir os novos tipos quando usados na configuração do projeto.

## 5. Non-Goals (Fora de Escopo)

- Não será implementada compilação automática e validação por `javac` como requisito obrigatório para aceitação (foi marcado como não necessário). Testes de compilação podem ser adicionados posteriormente.
- Redesign completo do canvas ou fidelidade fotográfica nesta fase inicial — a entrega será faseada.
- Integração com sistemas externos além do gerador Java local.

## 6. Considerações de Design

- Manter `JFrame` implícito como janela raiz (não expor na paleta).
- Preferir registro centralizado de componentes em fases futuras para reduzir duplicação entre paleta, defaults e gerador.
- UI: começar com representações genéricas (boxes com label) e evoluir para estilos mais próximos do Swing.

## 7. Considerações Técnicas

- Arquivos-chave:
  - `src/components/ComponentModel.ts`
  - `webview-app/src/types/canvas.ts`
  - `webview-app/src/components/Palette.tsx`
  - `webview-app/src/hooks/useCanvasDragDrop.ts`
  - `webview-app/src/lib/componentDefaults.ts`
  - `webview-app/src/components/PropertiesPanel/index.tsx`
  - `src/generator/JavaGenerator.ts`
  - `schemas/swingbuilder.schema.json`
  - `src/config/ConfigReader.ts`

- Dependências e riscos:
  - Risco de dessincronização entre enums no backend e types no frontend — mitigar com testes de tipo e CI.
  - Geração Java: cuidados com nomes únicos e imports duplicados.

## 8. Métricas de Sucesso

- Todos os novos componentes aparecem na paleta e podem ser arrastados para o canvas.
- Pelo menos 80% dos casos comuns geram código Java plausível (verificação manual).
- Paridade de tipos confirmada (typecheck/lint passa no monorepo).
- Propriedades mínimas editáveis no painel e persistidas no modelo.

## 9. Plano de Fases (Resumo)

- Fase 1 (MVP): Paridade de tipos, paleta, drag & drop, defaults, geração Java MVP, painel de propriedades básico.
- Fase 2: Expandir propriedades por tipo, melhorar mapeamento do gerador, ajustes no schema/config.
- Fase 3: Fidelidade visual incremental no canvas, testes de usabilidade, e opcionalmente automação de compilação Java.

## 10. Open Questions

- Existem componentes adicionais prioritários além dos listados no requisito original?
- Preferem testes automatizados de geração Java nesta entrega (mesmo sem compilação automática)?
- Há design system ou tokens visuais a aplicar no canvas para acelerar a fidelidade visual?


---

**Arquivo gerado automaticamente:** `tasks/swing-components/prd-swing-components.md`
