export interface ParsedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ParsedComponentProperties {
  bounds?: ParsedBounds;
  text?: string;
  layout?: string;
}

export interface ParsedGuiComponent {
  variableName: string;
  type: string;
  properties: ParsedComponentProperties;
  parentVariableName?: string;
  childVariableNames: string[];
}

export interface ParsedParentChildRelationship {
  parentVariableName: string;
  childVariableName: string;
}

export type ParsedMethodReceiverKind = "variable" | "this" | "contentPane" | "unknown";

export interface ParsedMethodCall {
  methodName: string;
  receiverKind: ParsedMethodReceiverKind;
  receiverVariableName?: string;
  arguments: string[];
  line: number;
}

export interface ParsedJavaClassInfo {
  className: string;
  extendsClass?: string;
  isGuiClass: boolean;
}

export interface ParsedJavaFile {
  packageName?: string;
  classInfo: ParsedJavaClassInfo;
  symbolTable: Record<string, string>;
  components: ParsedGuiComponent[];
  parentChildRelationships: ParsedParentChildRelationship[];
  methodCalls: ParsedMethodCall[];
  rootLayout?: string;
}
