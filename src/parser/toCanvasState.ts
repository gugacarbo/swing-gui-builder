import type { CanvasComponent, CanvasState, ComponentType } from "@shared/types/canvas";
import { DEFAULT_COMPONENT_SIZES } from "../components/ComponentModel";
import type { ParsedJavaFile, ParsedMethodCall } from "./types";

const DEFAULT_FRAME_WIDTH = 800;
const DEFAULT_FRAME_HEIGHT = 600;

const DEFAULT_COMPONENT_STYLE = {
  backgroundColor: "#FFFFFF",
  textColor: "#000000",
  fontFamily: "Arial",
  fontSize: 12,
  eventMethodName: "",
} as const;

const SWING_TO_COMPONENT_TYPE: Record<string, ComponentType> = {
  JPanel: "Panel",
  Panel: "Panel",
  JButton: "Button",
  Button: "Button",
  JLabel: "Label",
  Label: "Label",
  JTextField: "TextField",
  TextField: "TextField",
  JPasswordField: "PasswordField",
  JTextArea: "TextArea",
  TextArea: "TextArea",
  JCheckBox: "CheckBox",
  Checkbox: "CheckBox",
  JRadioButton: "RadioButton",
  JComboBox: "ComboBox",
  Choice: "ComboBox",
  JList: "List",
  List: "List",
  JProgressBar: "ProgressBar",
  JSlider: "Slider",
  JSpinner: "Spinner",
  JSeparator: "Separator",
  JMenuBar: "MenuBar",
  JMenu: "Menu",
  JMenuItem: "MenuItem",
  JToolBar: "ToolBar",
};

function normalizeSwingType(rawSwingType: string): string {
  const withoutGenerics = rawSwingType
    .replace(/<[^>]*>/g, "")
    .replace(/\[\]/g, "")
    .trim();
  const token = withoutGenerics.split(/\s+/).pop() ?? withoutGenerics;
  return token.split(".").pop() ?? token;
}

function parseNumberArg(arg: string | undefined): number | undefined {
  if (!arg) {
    return undefined;
  }

  const match = arg.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return undefined;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseStringArg(arg: string | undefined): string | undefined {
  if (!arg) {
    return undefined;
  }

  const trimmed = arg.trim();
  const hasQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  const unwrapped = hasQuotes ? trimmed.slice(1, -1) : trimmed;

  return unwrapped
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

function parseDimensionArgument(arg: string | undefined):
  | {
      width: number;
      height: number;
    }
  | undefined {
  if (!arg) {
    return undefined;
  }

  const match = arg.match(/Dimension\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/i);
  if (!match) {
    return undefined;
  }

  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return undefined;
  }

  return { width, height };
}

function isFrameMethodTarget(
  call: ParsedMethodCall,
  className: string,
  frameVariables: Set<string>,
  extendsFrame: boolean,
): boolean {
  if (call.receiverKind === "this" || call.receiverKind === "contentPane") {
    return true;
  }

  if (call.receiverKind === "unknown") {
    return extendsFrame || frameVariables.size > 0;
  }

  const receiverVariable = call.receiverVariableName?.replace(/^this\./, "");
  if (!receiverVariable) {
    return extendsFrame || frameVariables.size > 0;
  }

  if (receiverVariable === className || receiverVariable === `${className}.this`) {
    return true;
  }

  return frameVariables.has(receiverVariable);
}

function getFrameVariableNames(parsed: ParsedJavaFile): Set<string> {
  const names = new Set<string>();
  for (const [variableName, typeName] of Object.entries(parsed.symbolTable)) {
    const normalizedType = normalizeSwingType(typeName);
    if (normalizedType === "JFrame" || normalizedType === "Frame") {
      names.add(variableName);
    }
  }
  return names;
}

function normalizeBounds(
  bounds: CanvasComponent["parentOffset"] & {
    width: number;
    height: number;
  },
  defaultWidth: number,
  defaultHeight: number,
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const safeX = Number.isFinite(bounds.x) ? Math.round(bounds.x) : 0;
  const safeY = Number.isFinite(bounds.y) ? Math.round(bounds.y) : 0;
  const safeWidth = Number.isFinite(bounds.width)
    ? Math.max(1, Math.round(bounds.width))
    : defaultWidth;
  const safeHeight = Number.isFinite(bounds.height)
    ? Math.max(1, Math.round(bounds.height))
    : defaultHeight;

  return {
    x: safeX,
    y: safeY,
    width: safeWidth,
    height: safeHeight,
  };
}

function extractFrameSettings(parsed: ParsedJavaFile): {
  title: string;
  width: number;
  height: number;
} {
  const className = parsed.classInfo.className?.trim() || "MainWindow";
  const extendsFrame =
    normalizeSwingType(parsed.classInfo.extendsClass ?? "") === "JFrame" ||
    normalizeSwingType(parsed.classInfo.extendsClass ?? "") === "Frame";
  const frameVariables = getFrameVariableNames(parsed);

  let frameTitle = className;
  let frameWidth: number | undefined;
  let frameHeight: number | undefined;

  for (const call of parsed.methodCalls) {
    const methodName = call.methodName.toLowerCase();
    if (!isFrameMethodTarget(call, className, frameVariables, extendsFrame)) {
      continue;
    }

    if (methodName === "settitle") {
      const title = parseStringArg(call.arguments[0]);
      if (typeof title === "string") {
        frameTitle = title;
      }
      continue;
    }

    if (methodName === "setsize" || methodName === "setbounds") {
      const widthCandidate = methodName === "setbounds" ? call.arguments[2] : call.arguments[0];
      const heightCandidate = methodName === "setbounds" ? call.arguments[3] : call.arguments[1];

      frameWidth = frameWidth ?? parseNumberArg(widthCandidate);
      frameHeight = frameHeight ?? parseNumberArg(heightCandidate);
      continue;
    }

    if (methodName === "setpreferredsize") {
      frameWidth = frameWidth ?? parseNumberArg(call.arguments[0]);
      frameHeight = frameHeight ?? parseNumberArg(call.arguments[1]);

      if (frameWidth === undefined || frameHeight === undefined) {
        const dimension = parseDimensionArgument(call.arguments[0]);
        if (dimension) {
          frameWidth = frameWidth ?? dimension.width;
          frameHeight = frameHeight ?? dimension.height;
        }
      }
    }
  }

  return {
    title: frameTitle,
    width: frameWidth && frameWidth > 0 ? Math.round(frameWidth) : DEFAULT_FRAME_WIDTH,
    height: frameHeight && frameHeight > 0 ? Math.round(frameHeight) : DEFAULT_FRAME_HEIGHT,
  };
}

function collectSetTextByVariable(parsed: ParsedJavaFile): Map<string, string> {
  const textByVariable = new Map<string, string>();
  for (const call of parsed.methodCalls) {
    if (call.methodName.toLowerCase() !== "settext" || call.receiverKind !== "variable") {
      continue;
    }

    const variableName = call.receiverVariableName;
    if (!variableName) {
      continue;
    }

    const text = parseStringArg(call.arguments[0]);
    if (typeof text === "string") {
      textByVariable.set(variableName, text);
    }
  }

  return textByVariable;
}

export function swingTypeToComponentType(swingType: string): ComponentType | undefined {
  return SWING_TO_COMPONENT_TYPE[normalizeSwingType(swingType)];
}

export function parsedToCanvasState(parsed: ParsedJavaFile): CanvasState {
  const className = parsed.classInfo.className?.trim() || "MainWindow";
  const {
    title: frameTitle,
    width: frameWidth,
    height: frameHeight,
  } = extractFrameSettings(parsed);
  const setTextByVariable = collectSetTextByVariable(parsed);

  const componentsById = new Map<string, CanvasComponent>();
  for (const parsedComponent of parsed.components) {
    const componentType = swingTypeToComponentType(parsedComponent.type);
    if (!componentType || componentsById.has(parsedComponent.variableName)) {
      continue;
    }

    const defaultSize = DEFAULT_COMPONENT_SIZES[componentType];
    const bounds = normalizeBounds(
      {
        x: parsedComponent.properties.bounds?.x ?? 0,
        y: parsedComponent.properties.bounds?.y ?? 0,
        width: parsedComponent.properties.bounds?.width ?? defaultSize.width,
        height: parsedComponent.properties.bounds?.height ?? defaultSize.height,
      },
      defaultSize.width,
      defaultSize.height,
    );
    const text =
      setTextByVariable.get(parsedComponent.variableName) ?? parsedComponent.properties.text ?? "";

    componentsById.set(parsedComponent.variableName, {
      id: parsedComponent.variableName,
      type: componentType,
      variableName: parsedComponent.variableName,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      text,
      ...DEFAULT_COMPONENT_STYLE,
    });
  }

  const childrenByParent = new Map<string, string[]>();
  for (const relation of parsed.parentChildRelationships) {
    const parent = componentsById.get(relation.parentVariableName);
    const child = componentsById.get(relation.childVariableName);

    if (!parent || !child || parent.id === child.id) {
      continue;
    }

    child.parentId = parent.id;
    child.parentOffset = {
      x: Math.round(child.x - parent.x),
      y: Math.round(child.y - parent.y),
    };

    const children = childrenByParent.get(parent.id) ?? [];
    if (!children.includes(child.id)) {
      children.push(child.id);
      childrenByParent.set(parent.id, children);
    }
  }

  for (const parsedComponent of parsed.components) {
    const parent = componentsById.get(parsedComponent.variableName);
    if (!parent) {
      continue;
    }

    const normalizedChildren = parsedComponent.childVariableNames
      .map((childId) => componentsById.get(childId)?.id)
      .filter((childId): childId is string => Boolean(childId));

    const relationChildren = childrenByParent.get(parent.id) ?? [];
    for (const relationChildId of relationChildren) {
      if (!normalizedChildren.includes(relationChildId)) {
        normalizedChildren.push(relationChildId);
      }
    }

    if (normalizedChildren.length > 0) {
      parent.children = normalizedChildren;
    }
  }

  return {
    className,
    frameTitle,
    frameWidth,
    frameHeight,
    components: [...componentsById.values()],
  };
}
