import { type CstNode, parse } from "java-parser";
import {
  collectNodesByName,
  extractBinaryExpressionFromExpressionStatement,
  extractIntegerFromExpression,
  extractLayoutName,
  extractMethodInvocationArgumentExpressions,
  extractNewExpressionArguments,
  extractNewExpressionType,
  extractNodeText,
  extractPrimaryFromExpression,
  extractPrimaryPath,
  extractVariableDeclarators,
  extractVariableNameFromDeclarator,
  extractVariableReference,
  getChildNodes,
  getChildTokens,
  getFirstChildNode,
  getFirstTokenImage,
  getSimpleTypeName,
  parseJavaStringLiteral,
} from "./CstUtils";
import {
  extractTypeNameFromLocalVariableDeclaration,
  extractTypeNameFromUnannType,
  isGuiRootType,
  isGuiType,
} from "./JavaTypeUtils";
import type {
  ParsedGuiComponent,
  ParsedJavaFile,
  ParsedMethodCall,
  ParsedMethodReceiverKind,
  ParsedParentChildRelationship,
} from "./types";

interface InvocationCall {
  methodName: string;
  receiverPath: string[];
  arguments: CstNode[];
  line: number;
}

interface MethodReceiver {
  kind: ParsedMethodReceiverKind;
  variableName?: string;
}

function createComponent(variableName: string, typeName: string): ParsedGuiComponent {
  return {
    variableName,
    type: getSimpleTypeName(typeName) ?? typeName,
    properties: {},
    childVariableNames: [],
  };
}

function extractClassName(normalClassDeclaration: CstNode): string {
  return (
    getFirstTokenImage(getFirstChildNode(normalClassDeclaration, "typeIdentifier"), "Identifier") ??
    "MainWindow"
  );
}

function extractExtendsClass(normalClassDeclaration: CstNode): string | undefined {
  const classType = getFirstChildNode(
    getFirstChildNode(normalClassDeclaration, "classExtends"),
    "classType",
  );
  const identifiers = getChildTokens(classType, "Identifier").map((token) => token.image);
  return identifiers.length > 0 ? identifiers.join(".") : undefined;
}

function extractPackageName(cst: CstNode): string | undefined {
  const packageDeclaration = collectNodesByName(cst, "packageDeclaration")[0];
  if (!packageDeclaration) {
    return undefined;
  }

  const identifiers = getChildTokens(packageDeclaration, "Identifier").map((token) => token.image);
  return identifiers.length > 0 ? identifiers.join(".") : undefined;
}

function resolveMethodReceiver(receiverPath: string[]): MethodReceiver {
  if (receiverPath.length === 0) {
    return { kind: "this" };
  }

  const lastSegment = receiverPath[receiverPath.length - 1];
  if (!lastSegment) {
    return { kind: "unknown" };
  }

  if (lastSegment === "getContentPane" || lastSegment === "contentPane") {
    return { kind: "contentPane" };
  }

  if (receiverPath[0] === "this") {
    if (receiverPath.length === 1) {
      return { kind: "this" };
    }

    return { kind: "variable", variableName: lastSegment };
  }

  return { kind: "variable", variableName: lastSegment };
}

function extractAssignedVariableName(binaryExpression: CstNode): string | undefined {
  const primary = getFirstChildNode(
    getFirstChildNode(binaryExpression, "unaryExpression"),
    "primary",
  );
  const path = extractPrimaryPath(primary);
  if (path.length === 0) {
    return undefined;
  }

  if (path[0] === "this" && path.length >= 2) {
    return path[path.length - 1];
  }

  return path[path.length - 1];
}

function extractStringLiteralFromExpression(expression: CstNode | undefined): string | undefined {
  const primary = extractPrimaryFromExpression(expression);
  const primaryPrefix = getFirstChildNode(primary, "primaryPrefix");
  const literal = getFirstChildNode(primaryPrefix, "literal");

  const stringLiteral = getFirstTokenImage(literal, "StringLiteral");
  if (stringLiteral) {
    return parseJavaStringLiteral(stringLiteral);
  }

  const textBlock = getFirstTokenImage(literal, "TextBlock");
  if (textBlock) {
    return parseJavaStringLiteral(textBlock);
  }

  return undefined;
}

function resolveLayoutName(
  expression: CstNode | undefined,
  source: string,
  symbolTable: Map<string, string>,
): string | undefined {
  const expressionText = extractNodeText(expression, source);
  if (expressionText?.trim() === "null") {
    return "null";
  }

  const primary = extractPrimaryFromExpression(expression);
  const newType = extractNewExpressionType(primary);
  if (newType) {
    return getSimpleTypeName(newType) ?? newType;
  }

  const variableReference = extractVariableReference(expressionText);
  if (variableReference) {
    const variableType = symbolTable.get(variableReference);
    if (variableType) {
      return getSimpleTypeName(variableType) ?? variableType;
    }
  }

  return extractLayoutName(expressionText);
}

function extractInvocationCalls(binaryExpression: CstNode): InvocationCall[] {
  if (getChildTokens(binaryExpression, "AssignmentOperator").length > 0) {
    return [];
  }

  const primary = getFirstChildNode(
    getFirstChildNode(binaryExpression, "unaryExpression"),
    "primary",
  );
  if (!primary) {
    return [];
  }

  const callPath = extractPrimaryPath(primary);
  const suffixes = getChildNodes(primary, "primarySuffix");
  const calls: InvocationCall[] = [];

  for (const suffix of suffixes) {
    const identifier = getFirstTokenImage(suffix, "Identifier");
    if (identifier) {
      callPath.push(identifier);
    }

    const methodInvocationSuffix = getFirstChildNode(suffix, "methodInvocationSuffix");
    if (!methodInvocationSuffix || callPath.length === 0) {
      continue;
    }

    const methodName = callPath[callPath.length - 1];
    if (!methodName) {
      continue;
    }

    calls.push({
      methodName,
      receiverPath: callPath.slice(0, -1),
      arguments: extractMethodInvocationArgumentExpressions(methodInvocationSuffix),
      line: methodInvocationSuffix.location.startLine,
    });
  }

  return calls;
}

export function parseJavaFile(javaContent: string): ParsedJavaFile {
  const cst = parse(javaContent) as CstNode;
  const packageName = extractPackageName(cst);

  const normalClassDeclaration = collectNodesByName(cst, "normalClassDeclaration")[0];
  if (!normalClassDeclaration) {
    throw new Error("No class declaration found in Java source.");
  }

  const className = extractClassName(normalClassDeclaration);
  const extendsClass = extractExtendsClass(normalClassDeclaration);
  const symbolTable = new Map<string, string>();
  const componentByVariable = new Map<string, ParsedGuiComponent>();
  const parentChildRelationshipSet = new Set<string>();
  const parentChildRelationships: ParsedParentChildRelationship[] = [];
  const methodCalls: ParsedMethodCall[] = [];
  let rootLayout: string | undefined;

  const upsertComponent = (variableName: string, typeName?: string): ParsedGuiComponent => {
    const existing = componentByVariable.get(variableName);
    if (existing) {
      if (typeName) {
        existing.type = getSimpleTypeName(typeName) ?? typeName;
      }
      return existing;
    }

    const component = createComponent(
      variableName,
      typeName ?? symbolTable.get(variableName) ?? "JComponent",
    );
    componentByVariable.set(variableName, component);
    return component;
  };

  const addParentChildRelationship = (parentVariableName: string, childVariableName: string) => {
    const relationshipKey = `${parentVariableName}→${childVariableName}`;
    if (parentChildRelationshipSet.has(relationshipKey)) {
      return;
    }

    parentChildRelationshipSet.add(relationshipKey);
    parentChildRelationships.push({ parentVariableName, childVariableName });
  };

  const processVariableDeclarator = (variableDeclarator: CstNode, declaredType?: string) => {
    const variableName = extractVariableNameFromDeclarator(variableDeclarator);
    if (!variableName) {
      return;
    }

    if (declaredType) {
      symbolTable.set(variableName, declaredType);
      if (isGuiType(declaredType)) {
        upsertComponent(variableName, declaredType);
      }
    }

    const variableInitializer = getFirstChildNode(variableDeclarator, "variableInitializer");
    const initializerExpression = getFirstChildNode(variableInitializer, "expression");
    if (!initializerExpression) {
      return;
    }

    const initializerPrimary = extractPrimaryFromExpression(initializerExpression);
    const instantiatedType = extractNewExpressionType(initializerPrimary);
    if (instantiatedType) {
      if (!symbolTable.has(variableName)) {
        symbolTable.set(variableName, instantiatedType);
      }

      if (isGuiType(instantiatedType) || isGuiType(symbolTable.get(variableName))) {
        const component = upsertComponent(
          variableName,
          symbolTable.get(variableName) ?? instantiatedType,
        );
        const firstConstructorArgument = extractNewExpressionArguments(initializerPrimary)[0];
        const constructorText = extractStringLiteralFromExpression(firstConstructorArgument);
        if (constructorText !== undefined) {
          component.properties.text = constructorText;
        }
      }
    }
  };

  for (const fieldDeclaration of collectNodesByName(normalClassDeclaration, "fieldDeclaration")) {
    const declaredType = extractTypeNameFromUnannType(
      getFirstChildNode(fieldDeclaration, "unannType"),
    );
    const variableDeclaratorList = getFirstChildNode(fieldDeclaration, "variableDeclaratorList");
    for (const variableDeclarator of extractVariableDeclarators(variableDeclaratorList)) {
      processVariableDeclarator(variableDeclarator, declaredType);
    }
  }

  for (const localVariableDeclaration of collectNodesByName(
    normalClassDeclaration,
    "localVariableDeclaration",
  )) {
    const declaredType = extractTypeNameFromLocalVariableDeclaration(localVariableDeclaration);
    const variableDeclaratorList = getFirstChildNode(
      localVariableDeclaration,
      "variableDeclaratorList",
    );
    for (const variableDeclarator of extractVariableDeclarators(variableDeclaratorList)) {
      processVariableDeclarator(variableDeclarator, declaredType);
    }
  }

  for (const expressionStatement of collectNodesByName(
    normalClassDeclaration,
    "expressionStatement",
  )) {
    const line = expressionStatement.location.startLine;
    const normalizedBinaryExpression =
      extractBinaryExpressionFromExpressionStatement(expressionStatement);
    if (!normalizedBinaryExpression) {
      continue;
    }

    const isAssignment =
      getChildTokens(normalizedBinaryExpression, "AssignmentOperator").length > 0;
    if (isAssignment) {
      const assignedVariable = extractAssignedVariableName(normalizedBinaryExpression);
      const rhsExpression = getFirstChildNode(normalizedBinaryExpression, "expression");
      const rhsPrimary = extractPrimaryFromExpression(rhsExpression);
      const instantiatedType = extractNewExpressionType(rhsPrimary);

      if (assignedVariable && instantiatedType) {
        symbolTable.set(assignedVariable, instantiatedType);
        if (isGuiType(instantiatedType)) {
          const component = upsertComponent(assignedVariable, instantiatedType);
          const firstConstructorArgument = extractNewExpressionArguments(rhsPrimary)[0];
          const constructorText = extractStringLiteralFromExpression(firstConstructorArgument);
          if (constructorText !== undefined) {
            component.properties.text = constructorText;
          }
        }
      }

      continue;
    }

    for (const call of extractInvocationCalls(normalizedBinaryExpression)) {
      const receiver = resolveMethodReceiver(call.receiverPath);
      const argumentTexts = call.arguments.map(
        (argument) => extractNodeText(argument, javaContent) ?? "",
      );

      methodCalls.push({
        methodName: call.methodName,
        receiverKind: receiver.kind,
        receiverVariableName: receiver.variableName,
        arguments: argumentTexts,
        line: call.line || line,
      });

      if (
        call.methodName === "setBounds" &&
        receiver.kind === "variable" &&
        receiver.variableName
      ) {
        const receiverType = symbolTable.get(receiver.variableName);
        if (!receiverType || !isGuiType(receiverType)) {
          continue;
        }

        const [x, y, width, height] = call.arguments
          .slice(0, 4)
          .map((argument) => extractIntegerFromExpression(argument, javaContent));
        if (
          typeof x === "number" &&
          typeof y === "number" &&
          typeof width === "number" &&
          typeof height === "number"
        ) {
          const component = upsertComponent(receiver.variableName, receiverType);
          component.properties.bounds = { x, y, width, height };
        }
        continue;
      }

      if (call.methodName === "setText" && receiver.kind === "variable" && receiver.variableName) {
        const receiverType = symbolTable.get(receiver.variableName);
        if (!receiverType || !isGuiType(receiverType)) {
          continue;
        }

        const componentText = extractStringLiteralFromExpression(call.arguments[0]);
        if (componentText !== undefined) {
          const component = upsertComponent(receiver.variableName, receiverType);
          component.properties.text = componentText;
        }
        continue;
      }

      if (call.methodName === "setLayout") {
        const layoutName = resolveLayoutName(call.arguments[0], javaContent, symbolTable);
        if (!layoutName) {
          continue;
        }

        if (receiver.kind === "variable" && receiver.variableName) {
          const receiverType = symbolTable.get(receiver.variableName);
          if (receiverType && isGuiType(receiverType)) {
            const component = upsertComponent(receiver.variableName, receiverType);
            component.properties.layout = layoutName;
          }
        } else if (receiver.kind === "this" || receiver.kind === "contentPane") {
          rootLayout = layoutName;
        }
        continue;
      }

      if (call.methodName !== "add") {
        continue;
      }

      const childExpressionText = extractNodeText(call.arguments[0], javaContent);
      const childVariableName = extractVariableReference(childExpressionText);
      if (!childVariableName) {
        continue;
      }

      const childType = symbolTable.get(childVariableName);
      if (!childType || !isGuiType(childType)) {
        continue;
      }

      const childComponent = upsertComponent(childVariableName, childType);

      if (receiver.kind === "variable" && receiver.variableName) {
        const parentType = symbolTable.get(receiver.variableName);
        if (!parentType || !isGuiType(parentType)) {
          continue;
        }

        const parentComponent = upsertComponent(receiver.variableName, parentType);
        childComponent.parentVariableName = receiver.variableName;
        if (!parentComponent.childVariableNames.includes(childVariableName)) {
          parentComponent.childVariableNames.push(childVariableName);
        }
        addParentChildRelationship(receiver.variableName, childVariableName);
      } else if (receiver.kind === "this" || receiver.kind === "contentPane") {
        childComponent.parentVariableName = undefined;
      }
    }
  }

  const orderedSymbolEntries = [...symbolTable.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const orderedComponents = [...componentByVariable.values()].sort((left, right) =>
    left.variableName.localeCompare(right.variableName),
  );
  const orderedRelationships = [...parentChildRelationships].sort((left, right) => {
    if (left.parentVariableName === right.parentVariableName) {
      return left.childVariableName.localeCompare(right.childVariableName);
    }
    return left.parentVariableName.localeCompare(right.parentVariableName);
  });
  const orderedMethodCalls = [...methodCalls].sort((left, right) => left.line - right.line);

  return {
    packageName,
    classInfo: {
      className,
      extendsClass,
      isGuiClass: isGuiRootType(extendsClass),
    },
    symbolTable: Object.fromEntries(orderedSymbolEntries),
    components: orderedComponents,
    parentChildRelationships: orderedRelationships,
    methodCalls: orderedMethodCalls,
    rootLayout,
  };
}
