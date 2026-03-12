import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

export interface ComponentDefaults {
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
}

export interface SwingBuilderConfig {
  defaultBackgroundColor: string;
  defaultTextColor: string;
  defaultFontFamily: string;
  defaultFontSize: number;
  outputDirectory: string;
  components: Record<string, Partial<ComponentDefaults>>;
}

const INTERNAL_DEFAULTS: SwingBuilderConfig = {
  defaultBackgroundColor: "#FFFFFF",
  defaultTextColor: "#000000",
  defaultFontFamily: "Arial",
  defaultFontSize: 12,
  outputDirectory: "swing/components/",
  components: {},
};

const COMPONENT_TYPES = ["Button", "Label", "TextField", "PasswordField", "TextArea"];

function readVSCodeSettings(): Partial<SwingBuilderConfig> {
  const cfg = vscode.workspace.getConfiguration("swingGuiBuilder");
  const result: Partial<SwingBuilderConfig> = {};

  const bgColor = cfg.get<string>("defaultBackgroundColor");
  if (bgColor !== undefined) result.defaultBackgroundColor = bgColor;
  const textColor = cfg.get<string>("defaultTextColor");
  if (textColor !== undefined) result.defaultTextColor = textColor;
  const fontFamily = cfg.get<string>("defaultFontFamily");
  if (fontFamily !== undefined) result.defaultFontFamily = fontFamily;
  const fontSize = cfg.get<number>("defaultFontSize");
  if (fontSize !== undefined) result.defaultFontSize = fontSize;
  const outputDir = cfg.get<string>("outputDirectory");
  if (outputDir !== undefined) result.outputDirectory = outputDir;

  result.components = {};
  for (const type of COMPONENT_TYPES) {
    const compCfg = cfg.get<Record<string, unknown>>(`components.${type}`);
    if (compCfg) {
      const comp: Partial<ComponentDefaults> = {};
      if (typeof compCfg.defaultBackgroundColor === "string")
        comp.backgroundColor = compCfg.defaultBackgroundColor;
      if (typeof compCfg.defaultTextColor === "string") comp.textColor = compCfg.defaultTextColor;
      if (typeof compCfg.defaultFontFamily === "string")
        comp.fontFamily = compCfg.defaultFontFamily;
      if (typeof compCfg.defaultFontSize === "number") comp.fontSize = compCfg.defaultFontSize;
      result.components[type] = comp;
    }
  }

  return result;
}

function normalizeProjectConfig(raw: Record<string, unknown>): Partial<SwingBuilderConfig> {
  const result: Partial<SwingBuilderConfig> = {};

  if (typeof raw.defaultBackgroundColor === "string")
    result.defaultBackgroundColor = raw.defaultBackgroundColor;
  if (typeof raw.defaultTextColor === "string") result.defaultTextColor = raw.defaultTextColor;
  if (typeof raw.defaultFontFamily === "string") result.defaultFontFamily = raw.defaultFontFamily;
  if (typeof raw.defaultFontSize === "number") result.defaultFontSize = raw.defaultFontSize;
  if (typeof raw.outputDirectory === "string") result.outputDirectory = raw.outputDirectory;

  if (raw.components && typeof raw.components === "object") {
    result.components = {};
    for (const [type, val] of Object.entries(
      raw.components as Record<string, Record<string, unknown>>,
    )) {
      if (val && typeof val === "object") {
        const comp: Partial<ComponentDefaults> = {};
        if (typeof val.backgroundColor === "string") comp.backgroundColor = val.backgroundColor;
        if (typeof val.textColor === "string") comp.textColor = val.textColor;
        if (typeof val.fontFamily === "string") comp.fontFamily = val.fontFamily;
        if (typeof val.fontSize === "number") comp.fontSize = val.fontSize;
        result.components[type] = comp;
      }
    }
  }

  return result;
}

function readProjectConfig(): Partial<SwingBuilderConfig> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) return {};

  const configPath = path.join(workspaceFolders[0].uri.fsPath, ".swingbuilder.json");

  try {
    if (!fs.existsSync(configPath)) return {};
    const content = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(content);
    return normalizeProjectConfig(parsed);
  } catch {
    return {};
  }
}

function mergeConfigs(
  defaults: SwingBuilderConfig,
  vsCode: Partial<SwingBuilderConfig>,
  project: Partial<SwingBuilderConfig>,
): SwingBuilderConfig {
  const merged: SwingBuilderConfig = {
    defaultBackgroundColor:
      project.defaultBackgroundColor ??
      vsCode.defaultBackgroundColor ??
      defaults.defaultBackgroundColor,
    defaultTextColor:
      project.defaultTextColor ?? vsCode.defaultTextColor ?? defaults.defaultTextColor,
    defaultFontFamily:
      project.defaultFontFamily ?? vsCode.defaultFontFamily ?? defaults.defaultFontFamily,
    defaultFontSize: project.defaultFontSize ?? vsCode.defaultFontSize ?? defaults.defaultFontSize,
    outputDirectory: project.outputDirectory ?? vsCode.outputDirectory ?? defaults.outputDirectory,
    components: {},
  };

  const allTypes = new Set([
    ...Object.keys(defaults.components),
    ...Object.keys(vsCode.components || {}),
    ...Object.keys(project.components || {}),
  ]);

  for (const type of allTypes) {
    const d = defaults.components[type] || {};
    const v = vsCode.components?.[type] || {};
    const p = project.components?.[type] || {};
    merged.components[type] = {
      backgroundColor: p.backgroundColor ?? v.backgroundColor ?? d.backgroundColor,
      textColor: p.textColor ?? v.textColor ?? d.textColor,
      fontFamily: p.fontFamily ?? v.fontFamily ?? d.fontFamily,
      fontSize: p.fontSize ?? v.fontSize ?? d.fontSize,
    };
  }

  return merged;
}

export function getConfig(): SwingBuilderConfig {
  const vsCodeConfig = readVSCodeSettings();
  const projectConfig = readProjectConfig();
  return mergeConfigs(INTERNAL_DEFAULTS, vsCodeConfig, projectConfig);
}

export function getComponentDefaults(componentType: string): ComponentDefaults {
  const config = getConfig();
  const componentOverrides = config.components[componentType] || {};
  return {
    backgroundColor: componentOverrides.backgroundColor || config.defaultBackgroundColor,
    textColor: componentOverrides.textColor || config.defaultTextColor,
    fontFamily: componentOverrides.fontFamily || config.defaultFontFamily,
    fontSize: componentOverrides.fontSize || config.defaultFontSize,
  };
}

export function getOutputDirectory(): string {
  return getConfig().outputDirectory;
}
