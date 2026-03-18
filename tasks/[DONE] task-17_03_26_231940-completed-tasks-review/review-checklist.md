# Checklist unico de done real

Objetivo: avaliar tasks marcadas como `[DONE]` com criterio objetivo e repetivel.

## Como aplicar (passo a passo)

1. Reunir artefatos da task: `req`, `prd`, `plan`, `progress`, `review`, `coverage-report` (quando existir), codigo e testes relacionados.
2. Avaliar cada item do checklist e marcar `ATENDE`, `NAO_ATENDE` ou `NAO_APLICA`.
3. Registrar evidencia minima por item (arquivo + trecho relevante ou comando executado).
4. Classificar a task usando as regras da secao **Classificacao final**.
5. Registrar o resultado final com pendencias objetivas (quando houver).

## Criterios minimos obrigatorios

### A) Rastreabilidade

| ID  | Criterio objetivo                                                               | Evidencia minima exigida                                   |
| --- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| R1  | O objetivo da task esta explicito e alinhado entre `req`/`prd`.                 | Referencia ao objetivo no `req` ou `prd` (arquivo citado). |
| R2  | Cada entrega declarada no `progress`/`review` aponta para artefato verificavel. | Caminho de arquivo, diff, teste ou comando executado.      |
| R3  | Existe vinculo claro entre requisito e entrega tecnica observada.               | Mapeamento requisito -> evidencia tecnica.                 |

### B) Consistencia

| ID  | Criterio objetivo                                                        | Evidencia minima exigida                                                   |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| C1  | Nao ha contradicao entre status declarado e artefatos existentes.        | Conferencia cruzada entre `progress`, `prd` e estado atual do repositorio. |
| C2  | Escopo executado e compativel com o que foi planejado.                   | Itens planejados versus itens entregues.                                   |
| C3  | Pendencias ou lacunas estao explicitadas quando escopo ficou incompleto. | Registro textual de gaps com impacto.                                      |

### C) Validacao tecnica

| ID  | Criterio objetivo                                                            | Evidencia minima exigida                                 |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| V1  | Validacoes tecnicas prometidas foram executadas (ex.: typecheck/test/build). | Comando e resultado registrado.                          |
| V2  | Resultado tecnico e coerente com a conclusao da task.                        | Saida de comando sem erro para itens obrigatorios.       |
| V3  | Nao existe falha critica aberta que invalide a entrega declarada.            | Ausencia de erro bloqueante associado ao escopo da task. |

## Classificacao final

Use apenas os itens obrigatorios (`R1..R3`, `C1..C3`, `V1..V3`):

- **Concluida**
  - Todos os itens obrigatorios marcados como `ATENDE` ou `NAO_APLICA`; e
  - Nenhum bloqueador ativo.

- **Parcial**
  - Existe pelo menos 1 item obrigatorio `ATENDE`; e
  - Ha 1 ou 2 itens obrigatorios `NAO_ATENDE`; e
  - Nao ha bloqueador ativo.

- **Nao concluida**
  - 3 ou mais itens obrigatorios `NAO_ATENDE`; ou
  - Nenhum item obrigatorio `ATENDE`; ou
  - Existe bloqueador ativo.

### Bloqueadores ativos (qualquer um)

1. Nao ha evidencia tecnica minima da entrega principal da task.
2. Existe contradicao direta entre status `[DONE]` e estado real (entrega principal ausente).
3. Validacao tecnica obrigatoria falhou ou nao foi executada sem justificativa aceitavel.

## Escala de severidade dos achados

Classifique cada achado usando impacto observado + urgencia de resposta:

| Severidade | Criterio objetivo de impacto                                                                 | Criterio objetivo de urgencia                                               |
| ---------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Critico    | Bloqueia entrega principal da task ou invalida conclusao declarada de forma imediata.       | Follow-up imediato, iniciar em ate 24h.                                    |
| Alto       | Compromete parte essencial da entrega, com risco relevante e sem contorno confiavel.        | Follow-up de alta prioridade, iniciar em ate 2 dias uteis.                |
| Medio      | Afeta qualidade, completude ou fluxo secundario, com contorno parcial disponivel.           | Follow-up planejado no proximo ciclo/sprint.                               |
| Baixo      | Impacto localizado, documental ou de refinamento, sem bloquear uso principal da entrega.    | Follow-up pode entrar em backlog, sem acao urgente.                        |

## Regra de priorizacao de follow-up

1. Ordenar sempre por severidade: `Critico > Alto > Medio > Baixo`.
2. Dentro da mesma severidade, priorizar primeiro o achado com maior raio de impacto (mais tarefas/artefatos afetados).
3. Empates no raio de impacto devem ser resolvidos pela urgencia (menor prazo de inicio primeiro).
4. Todo achado `Critico` ou `Alto` deve gerar item de follow-up com owner e prazo explicitos no registro da revisao.

## Formato minimo de registro para outro revisor

```text
Task avaliada: <nome-da-task>
Classificacao final: Concluida | Parcial | Nao concluida
Checklist:
- R1: ATENDE | NAO_ATENDE | NAO_APLICA - evidencia: <arquivo/comando>
- R2: ...
- R3: ...
- C1: ...
- C2: ...
- C3: ...
- V1: ...
- V2: ...
- V3: ...
Pendencias objetivas (se houver):
- <acao recomendada>
```
