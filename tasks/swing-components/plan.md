# Plan: Expandir componentes Swing no builder

Ampliar o suporte de componentes do Swing GUI Builder para cobrir o escopo definido (JFrame implícito, JPanel e componentes de entrada/seleção/progresso), mantendo entrega MVP funcional no canvas (renderização genérica) com foco em consistência de tipos, drag and drop completo e geração Java válida.

## Steps

1. Fase 1 - Consolidar escopo e baseline técnico
- Mapear quais tipos já existem.
- Ajustar a lista final da task para incluir revisão dos atuais e inclusão dos faltantes do requisito.
- Manter JFrame fora da paleta (implícito como janela raiz).
- Dependência: nenhuma.

2. Fase 1 - Sincronizar domínio de tipos backend/frontend
- Atualizar `ComponentType` nos dois pontos canônicos para refletir exatamente os componentes suportados nesta task.
- Dependência: passo 1.

3. Fase 1 - Completar cadeia de criação no canvas
- Alinhar paleta (`PALETTE_ITEMS`), mapping de drag and drop (`PALETTE_TO_COMPONENT_TYPE`) e criação com defaults para todos os novos tipos.
- Dependência: passo 2.

4. Fase 1 - Estender defaults por tipo
- Adicionar tamanho e propriedades padrão por componente.
- Cobrir campos mínimos para geração Java consistente (texto/estado/listas/range, conforme tipo).
- Dependência: passo 2. Pode rodar em paralelo com passo 3.

5. Fase 2 - Atualizar geração Java
- Expandir mapeamentos de classe Swing e listeners por tipo (quando aplicável).
- Garantir que código gerado compile para componentes novos e revisados.
- Dependência: passos 3 e 4.

6. Fase 2 - Alinhar configuração e validação
- Atualizar schema e leitura de config para aceitar exatamente os novos tipos suportados.
- Evitar dessincronia entre editor, extensão e gerador.
- Dependência: passo 2. Pode rodar em paralelo com passo 5.

7. Fase 3 - Revisar painel de propriedades para MVP funcional
- Assegurar edição das propriedades comuns.
- Dar suporte mínimo às novas propriedades introduzidas (sem renderização visual específica por tipo no canvas).
- Dependência: passos 3 e 4.

8. Fase 4 - Verificação técnica automatizável
- Validar roundtrip (paleta -> canvas -> modelo).
- Validar consistência de tipos entre camadas.
- Validar aceitação de schema/config.
- Validar geração Java sem erro de compilação para casos representativos.
- Dependência: passos 5, 6 e 7.

9. Fase 4 - Verificação manual guiada
- Testar drag and drop e edição de propriedades dos novos componentes no webview.
- Conferir comportamento básico e saída do gerador para um projeto de exemplo.
- Dependência: passo 8.

## Relevant files

- `src/components/ComponentModel.ts` - fonte de verdade de tipos da extensão (`ComponentType`).
- `webview-app/src/types/canvas.ts` - espelho de tipos no frontend do webview.
- `webview-app/src/components/Palette.tsx` - itens exibidos e origem do drag de componentes.
- `webview-app/src/hooks/useCanvasDragDrop.ts` - mapping Swing -> tipo interno e criação no drop.
- `webview-app/src/lib/componentDefaults.ts` - props e tamanhos padrão por tipo.
- `webview-app/src/components/PropertiesPanel/index.tsx` - campos editáveis de propriedades no painel.
- `src/generator/JavaGenerator.ts` - mapeamento para classes Swing e listeners na geração.
- `schemas/swingbuilder.schema.json` - schema de validação da configuração.
- `src/config/ConfigReader.ts` - leitura/validação de tipos suportados.
- `src/config/initConfigCommand.ts` - template inicial de configuração do projeto.
- `tasks/swing-components/requirements.md` - referência de escopo funcional da task.

## Verification

1. Executar checagem de tipos/build do monorepo para garantir que `ComponentType` e uso em hooks/componentes não quebraram.
2. Validar manualmente no webview: cada componente novo aparece na paleta, arrasta, dropa e mantém propriedades padrão esperadas.
3. Validar configuração: schema aceita os novos tipos e `ConfigReader` não rejeita entradas válidas.
4. Gerar Java para uma tela exemplo contendo ao menos um de cada novo tipo e compilar com `javac` para confirmar saída válida.
5. Conferir listeners gerados para tipos com evento (quando configurado) e ausência de código inválido para tipos sem listener.

## Decisions

- Incluído: componentes citados no requisito selecionado, com revisão dos atuais para consistência.
- Decisão de escopo: `JFrame` permanece implícito como janela raiz e não entra na paleta de drag and drop.
- Decisão de UX para esta task: MVP funcional com renderização genérica no canvas; fidelidade visual específica por tipo fica fora desta entrega.
- Incluído: correções de consistência entre backend/frontend/schema/config relacionadas diretamente ao suporte dos componentes.
- Excluído: redesign visual profundo do canvas e refatorações arquiteturais amplas fora do necessário para suportar os novos tipos.

## Further considerations

1. Se houver necessidade de eventos avançados por tipo no curto prazo, pode valer criar uma matriz explícita "tipo -> propriedades -> listener suportado" para reduzir regressão em futuras expansões.
2. Para próximas tasks, avaliar centralização do registro de componentes para reduzir duplicação entre paleta, defaults, mapeamentos e gerador.
3. Se a quantidade de propriedades específicas crescer, priorizar modelagem orientada a schema para escalar sem acoplamento rígido no frontend.
