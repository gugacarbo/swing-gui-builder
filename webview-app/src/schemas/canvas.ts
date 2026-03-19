import { z } from "zod";
import {
  DEFAULT_BG,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
} from "@/lib/constants";

export const ComponentTypeSchema = z.enum([
  "Panel",
  "Button",
  "Label",
  "TextField",
  "PasswordField",
  "TextArea",
  "CheckBox",
  "RadioButton",
  "ComboBox",
  "List",
  "ProgressBar",
  "Slider",
  "Spinner",
  "Separator",
  "MenuBar",
  "Menu",
  "MenuItem",
  "ToolBar",
]);

const OrientationSchema = z.enum(["horizontal", "vertical"]);
const ParentOffsetSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

const PositionSchema = z
  .enum(["top", "bottom", "left", "right", "north", "south", "east", "west"])
  .transform((position) => {
    switch (position) {
      case "north":
        return "top";
      case "south":
        return "bottom";
      case "west":
        return "left";
      case "east":
        return "right";
      default:
        return position;
    }
  });

export const CanvasComponentSchema = z.object({
  id: z.string().min(1),
  type: ComponentTypeSchema,
  variableName: z.string().default(""),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().min(1),
  height: z.number().finite().min(1),
  text: z.string().default(""),
  backgroundColor: z.string().default(DEFAULT_BG),
  textColor: z.string().default(DEFAULT_TEXT_COLOR),
  fontFamily: z.string().default(DEFAULT_FONT_FAMILY),
  fontSize: z.number().finite().min(1).default(DEFAULT_FONT_SIZE),
  eventMethodName: z.string().default(""),
  selected: z.boolean().optional(),
  items: z.array(z.string()).optional(),
  value: z.number().finite().optional(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  orientation: OrientationSchema.optional(),
  children: z.array(z.string()).optional(),
  parentId: z.string().optional(),
  parentOffset: ParentOffsetSchema.optional(),
  position: PositionSchema.optional(),
});

export const CanvasStateSchema = z
  .object({
    components: z.array(CanvasComponentSchema),
    className: z.string().min(1).default("MainWindow"),
    frameTitle: z.string().optional(),
    frameWidth: z.number().finite().min(1).default(800),
    frameHeight: z.number().finite().min(1).default(600),
    backgroundColor: z.string().optional(),
  })
  .passthrough();

export const ComponentDefaultsSchema = z
  .object({
    backgroundColor: z.string(),
    textColor: z.string(),
    fontFamily: z.string(),
    fontSize: z.number().finite().min(1),
  })
  .passthrough();

export const ConfigDefaultsSchema = z
  .object({
    defaultBackgroundColor: z.string(),
    defaultTextColor: z.string(),
    defaultFontFamily: z.string(),
    defaultFontSize: z.number().finite().min(1),
    components: z.record(z.string(), ComponentDefaultsSchema),
  })
  .passthrough();

export type ComponentType = z.infer<typeof ComponentTypeSchema>;
export type CanvasComponent = z.infer<typeof CanvasComponentSchema>;
export type CanvasState = z.infer<typeof CanvasStateSchema>;
export type ConfigDefaults = z.infer<typeof ConfigDefaultsSchema>;
