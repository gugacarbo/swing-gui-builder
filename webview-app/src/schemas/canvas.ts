import { z } from "zod";

export const ComponentTypeSchema = z.enum([
  "Button",
  "Label",
  "TextField",
  "PasswordField",
  "TextArea",
]);

export const BoundsSchema = z.object({
  x: z.number().finite().min(0),
  y: z.number().finite().min(0),
  width: z.number().finite().min(1),
  height: z.number().finite().min(1),
});

export const ComponentPropertiesSchema = z
  .object({
    text: z.string().optional(),
    font: z.string().optional(),
    background: z.string().optional(),
    foreground: z.string().optional(),
  })
  .passthrough();

export const CanvasComponentSchema = z.object({
  id: z.string().uuid(),
  type: ComponentTypeSchema,
  bounds: BoundsSchema,
  properties: ComponentPropertiesSchema,
});

export const PanSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const CanvasStateSchema = z
  .object({
    components: z.array(CanvasComponentSchema),
    selectedId: z.string().uuid().nullable(),
    zoom: z.number().finite().min(0.1),
    pan: PanSchema,
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
export type Bounds = z.infer<typeof BoundsSchema>;
export type ComponentProperties = z.infer<typeof ComponentPropertiesSchema>;
export type CanvasComponent = z.infer<typeof CanvasComponentSchema>;
export type Pan = z.infer<typeof PanSchema>;
export type CanvasState = z.infer<typeof CanvasStateSchema>;
export type ConfigDefaults = z.infer<typeof ConfigDefaultsSchema>;
