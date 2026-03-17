export type { ComponentType, CanvasComponent, CanvasState } from "@shared/types/canvas";

import type { CanvasComponent, CanvasState } from "@shared/types/canvas";

export type ComponentPosition = NonNullable<CanvasComponent["position"]>;

export interface HierarchicalComponent {
  children?: string[];
  parentId?: string;
  position?: ComponentPosition;
}

export type ComponentProps = Pick<
  CanvasComponent,
  "text" | "backgroundColor" | "textColor" | "fontFamily" | "fontSize" | "eventMethodName"
>;

/**
 * UI-focused state used by the React app.
 */
export interface CanvasViewState extends CanvasState {
  selectedComponentId: string | null;
}

export interface ConfigDefaults {
  defaultBackgroundColor: string;
  defaultTextColor: string;
  defaultFontFamily: string;
  defaultFontSize: number;
  components: Record<string, unknown>;
}
