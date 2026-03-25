# Java File Round-Trip Editing

## Description

Atualmente o Swing GUI Builder apenas **gera** código Java a partir de layouts visuais. Esta task expande a funcionalidade para permitir:

1. **Abrir arquivos Java existentes** e importar seus layouts GUI
2. **Editar visualmente** os componentes Swing
3. **Preservar código não-GUI** como métodos, campos, imports, e lógica de negócio
4. **Regerar arquivos** mantendo o código preservado intacto

### Fluxo Atual (One-Way)
```
CanvasState → JavaGenerator → .java files (sobrescreve)
```

### Fluxo Desejado (Round-Trip)
```
.java files → JavaParser → CanvasState ↔ Visual Editor → JavaGenerator → .java files (preserva)
```

## Decisions Made

| Decisão                      | Escolha                  | Justificativa                                                                                |
| ---------------------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| **Abordagem de Preservação** | Híbrido (Markers + AST)  | Robusto: markers delimitam seções GUI, AST parsing para reconstrução precisa                 |
| **Arquivos Não-Gerados**     | Sim, com conversão       | Permite editar qualquer arquivo Java; markers são adicionados automaticamente                |
| **Escopo de Preservação**    | Classe Completa          | Preserva: supertypes, interfaces, annotations, inner classes, imports, fields, métodos, etc. |
| **Fonte de Verdade**         | Arquivo .java (não JSON) | CanvasState deriva do .java; arquivo intermediário é opcional/cache                          |

---

## Decided Requirements

### Fase 1: Parsing & Importação

- [ ] RF-1: Criar `JavaParser` module usando `java-parser` npm package
- [ ] RF-2: Comando "Swing GUI Builder: Open from Java File" no VS Code
- [ ] RF-3: Extrair CanvasState a partir de:
  - Nome da classe e package
  - Campos do tipo Swing component
  - Bounds via `.setBounds(x, y, w, h)`
  - Propriedades visuais (text, colors, fonts)
- [ ] RF-4: Identificar e preservar:
  - Package declaration
  - Todos os imports
  - Modificadores de classe (public, abstract, final)
  - Extends/implements
  - Annotations na classe
  - Javadoc

### Fase 2: Round-Trip & Preservação (Híbrida)

- [ ] RF-5: Inserir marker comments no código gerado:
  ```java
  // @swingbuilder:gui-components begin
  private JButton saveButton;
  // @swingbuilder:gui-components end
  ```
- [ ] RF-6: Gerador deve substituir apenas código entre markers
- [ ] RF-7: Preservar código de negócio:
  - Fields não-GUI (User, Logger, etc.)
  - Métodos não-GUI (loadData(), save(), etc.)
  - Event handlers com corpo preenchido (não stub)
  - Inner classes
  - Static/instance initializers
- [ ] RF-8: Converter arquivos sem markers:
  - Detectar ausência de markers
  - Dialog: "Este arquivo não foi gerado pelo SwingBuilder. Deseja converter para o formato compatível?"
  - Adicionar markers automaticamente ao redor do código GUI detectado

### Fase 3: Full Class Preservation

- [ ] RF-9: Preservar estrutura completa da classe:
  - Constructors múltiplos
  - Generic type parameters
  - Enums e interfaces aninhadas
  - Todos os modifiers (synchronized, native, strictfp, etc.)
- [ ] RF-10: Manter formatação original do código preservado
- [ ] RF-11: Integração com VS Code formatter (não reformatar código preservado)

### UX & Commands

- [ ] RF-12: Comando "Open from Java File" → file picker → parse → canvas
- [ ] RF-13: Ao salvar canvas → regenerar arquivo Java preservando código
- [ ] RF-14: Indicação visual no canvas quando arquivo tem código preservado (badge/warning)
- [ ] RF-15: Backup automático (.bak) antes de sobrescrever
- [ ] RF-16: Diff preview antes de aplicar mudanças (opcional)

---

## Findings

### 1. Parser Java em TypeScript/JavaScript

**Opção principal identiticada:**

| Biblioteca                                                 | Tipo             | Tamanho | Status                           |
| ---------------------------------------------------------- | ---------------- | ------- | -------------------------------- |
| [`java-parser`](https://www.npmjs.com/package/java-parser) | CST (Chevrotain) | 257KB   | ✅ Ativo (523k+ downloads/semana) |
| JavaParser (Java)                                          | AST              | N/A     | ✅ Muito ativo, mas requer JVM    |

**Recomendação:** `java-parser` (npm) - é TypeScript-native, mantido pelo time do JHipster, e produz uma Concrete Syntax Tree que preserva formatação original.

### 2. Estrutura de Custódia de Código (Code Custody)

Arquivos Java típicos têm estas seções:

```java
package com.example;

// 1. IMPORTS (misturados: GUI + negócio)
import javax.swing.*;     // GUI
import java.sql.*;        // Business
import com.example.dao.*; // Business

public class MainWindow extends JFrame {
  // 2. FIELDS (misturados)
  private JButton saveButton;     // GUI
  private User currentUser;       // Business
  private final Logger log = ...; // Infrastructure

  // 3. CONSTRUCTOR GUI (parcialmente gerado)
  public MainWindow() {
    // --- BEGIN GUI GENERATED ---
    setTitle("App");
    saveButton = new JButton("Save");
    // --- END GUI GENERATED ---

    // Business logic
    loadUserData();
    setupDatabase();
  }

  // 4. METHODS (business logic)
  private void loadUserData() { ... }
  public void save() { ... }

  // 5. EVENT HANDLERS (GUI callbacks - stubs gerados)
  private void onSaveClicked() {
    // TODO: implement
  }
}
```

### 3. Estratégias de Preservação

**Approach A: Marker Comments** (mais simples)
```java
// @swingbuilder:begin-init
setTitle("App");
// @swingbuilder:end-init
```

**Approach B: AST Region Mapping** (mais robusto)
- Mapear offsets de código gerado
- Reconstituir apenas essas regiões
- Preservar tudo fora dos offsets

**Approach C: Bidirectional Transformation** (ideal mas complexo)
- Sincronização semântica entre modelo visual e AST
- Exemplo: [tree-ware](https://github.com/tree-ware/tree-ware-core)

### 4. Casos Similar na Indústria

| Tool                         | Tipo        | Round-Trip          |
| ---------------------------- | ----------- | ------------------- |
| NetBeans Matisse             | GUI Builder | ✅ Yes               |
| IntelliJ GUI Designer        | GUI Builder | ✅ Yes (binary form) |
| Eclipse WindowBuilder        | GUI Builder | ✅ Yes               |
| Android Studio Layout Editor | XML Layout  | ✅ Yes (XML)         |

---

## Gaps & Risks

### Gaps Críticos

1. **Parser não produz AST completo para modificação**
   - `java-parser` produz CST, que preserva tokens mas requer lógica customizada para reconstrução
   - Necessário implementar CST → CanvasState extraction

2. **Identificação de código GUI gerado vs. manual**
   - Classes posso ter componentes criados dinamicamente
   - Custom components podem não seguir padrão SwingBuilder
   - Nenhum marker atual para diferenciar

3. **Sincronização de variable names**
   - Canvas usa `variableName`, arquivo Java pode ter nomes diferentes
   - Risk: duplicação ou perda de referências

4. **Hierarquia de componentes complexa**
   - Atual suporta MenuBar, ToolBar, Panel com filhos
   - Arquivos existentes podem ter layouts aninhados não suportados

### Riscos

| Risco                              | Probabilidade | Impacto | Mitigação                                                    |
| ---------------------------------- | ------------- | ------- | ------------------------------------------------------------ |
| Parser falhar em código complexo   | Média         | Alto    | Primeiro suporte apenas a arquivos gerados pelo próprio tool |
| Perda de código do usuário         | Baixa         | Crítico | Backup automático + confirmação de overwrite                 |
| Incompatibilidade com padrões Java | Média         | Médio   | Documentar limitações claramente                             |
| Performance em arquivos grandes    | Baixa         | Baixo   | Lazy parsing + caching                                       |

### Assumptions

1. Arquivos alvo seguem estrutura padrão de classe Java
2. Componentes Swing usam construtores/sets padrão
3. Não há código GUI dentro de inner classes (fora do escopo inicial)
4. Layout é absolute (null layout) como atualmente suportado

---

## Suggestions

### Fase 1: Foundation (MVP)

1. **Criar módulo `src/parser/JavaParser.ts`**
   - Usar `java-parser` npm package
   - Implementar extração de:
     - Nome da classe, package
     - Fields do tipo Swing (JButton, JLabel, etc.)
     - Posições (bounds) via `.setBounds(x, y, w, h)`

2. **Comando: "Open from Java File"**
   - Selecionar arquivo `.java`
   - Parse e extrair CanvasState
   - Abrir no editor visual

3. **Marker Comments para round-trip**
   ```java
   // @swingbuilder:generated begin
   // ... código GUI ...
   // @swingbuilder:generated end
   ```
   - Ao gerar, inserir markers
   - Ao re-abrir, preservar código entre markers

### Fase 2: Preservation

1. **Implementar `JavaFileMerger`**
   - Input: arquivo original + CanvasState atualizado
   - Preservar: imports, fields não-GUI, métodos não-GUI
   - Replace: código entre markers

2. **Detectar arquivos não-gerados**
   - Warning ao tentar abrir arquivo sem markers
   - Opção: "Convert to SwingBuilder format" (adiciona markers)

### Fase 3: Advanced

1. Suportar layouts não-absolute (BorderLayout, GridLayout)
2. Parser para inner classes
3. Symbol resolution (para referências cross-component)

---

## Open Questions (Still Pending)

1. **Como lidar com inicialização dinâmica de componentes?**
   - Exemplo: componentes criados em loops ou condicionais
   - Opção A: ignorar e manter como "código preservado" (fora dos markers)
   - Opção B: tentar detectar e converter para CanvasState (complexo)

2. **Suportar arquivos com múltiplas classes?**
   - Arquivos com inner classes ou múltiplas top-level classes
   - Opção: Selecionar qual classe editar (dialog)

3. **Integração com sistema de undo/redo atual?**
   - CanvasState já suporta undo/redo
   - Abrir arquivo Java seria uma ação undoable?
   - "Revert to original file" action?

4. **Conflict resolution quando código GUI foi editado manualmente?**
   - Usuário editou código dentro dos markers manualmente
   - Opção: Sempre preferir CanvasState ou oferecer merge?

---

## Summary

| Item                       | Valor                                         |
| -------------------------- | --------------------------------------------- |
| **Task Name**              | `task-24_03_26121103-java-file-roundtrip`     |
| **Arquivo de Requisitos**  | `req-java-file-roundtrip.md`                  |
| **Complexidade**           | Alta (infraestrutura de parsing + round-trip) |
| **Prioridade Recomendada** | Alta (feature transformadora)                 |
| **Dependencies**           | `java-parser` npm package                     |
| **Estimativa Inicial**     | 3-4 sprints (dividido em fases)               |

---

## Stakeholders

- **Main Stakeholder:** @gugacarbo
- **Success Criteria:** Conseguir abrir um arquivo Java gerado, fazer pequenas alterações visuais, salvar, e ter o código de negócio preservado.
