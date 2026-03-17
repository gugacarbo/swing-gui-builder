import {
  FIXED_ZONE_GAP,
  FIXED_ZONE_PADDING,
  FIXED_ZONE_SECTION_GAP,
  MENU_BAR_MIN_HEIGHT,
  TOOL_BAR_MIN_SIDE_WIDTH,
  TOOL_BAR_MIN_THICKNESS,
} from "@/components/Canvas/constants";
import {
  collectDescendantIds,
  getStackExtent,
  normalizeToolBarPosition,
  type ToolBarEdge,
} from "@/components/Canvas/fixedZoneHelpers";
import type { CanvasComponent as CanvasComponentModel } from "@/types/canvas";

export interface MenuBarLayoutItem {
  menuBar: CanvasComponentModel;
  top: number;
  height: number;
}

export interface HorizontalToolBarLayoutItem {
  toolBar: CanvasComponentModel;
  thickness: number;
  top?: number;
  bottom?: number;
}

export interface VerticalToolBarLayoutItem {
  toolBar: CanvasComponentModel;
  top: number;
  thickness: number;
  width: number;
}

interface FixedZoneLayout {
  componentsById: Map<string, CanvasComponentModel>;
  floatingComponents: CanvasComponentModel[];
  menuBarLayout: MenuBarLayoutItem[];
  northToolBarLayout: HorizontalToolBarLayoutItem[];
  southToolBarLayout: HorizontalToolBarLayoutItem[];
  westToolBarLayout: VerticalToolBarLayoutItem[];
  eastToolBarLayout: VerticalToolBarLayoutItem[];
  sideTopInset: number;
  sideBottomInset: number;
}

export function getComponentLabel(component: CanvasComponentModel, fallback: string): string {
  const text = component.text.trim();
  if (text.length > 0) {
    return text;
  }

  const variableName = component.variableName.trim();
  if (variableName.length > 0) {
    return variableName;
  }

  return fallback;
}

export function buildFixedZoneLayout(components: CanvasComponentModel[]): FixedZoneLayout {
  const componentsById = new Map(components.map((component) => [component.id, component]));

  const menuBars = components.filter((component) => component.type === "MenuBar");
  const toolBarComponents = components.filter((component) => component.type === "ToolBar");

  const fixedComponentIds = new Set<string>();
  for (const menuBar of menuBars) {
    collectDescendantIds(menuBar, componentsById, components, fixedComponentIds);
  }
  for (const toolBar of toolBarComponents) {
    collectDescendantIds(toolBar, componentsById, components, fixedComponentIds);
  }

  const toolBarsByEdge: Record<ToolBarEdge, CanvasComponentModel[]> = {
    north: [],
    south: [],
    east: [],
    west: [],
  };

  for (const toolBar of toolBarComponents) {
    toolBarsByEdge[normalizeToolBarPosition(toolBar.position)].push(toolBar);
  }

  const menuBarHeights = menuBars.map((menuBar) =>
    Math.max(MENU_BAR_MIN_HEIGHT, Math.round(menuBar.height || MENU_BAR_MIN_HEIGHT)),
  );
  const northToolBarSizes = toolBarsByEdge.north.map((toolBar) =>
    Math.max(TOOL_BAR_MIN_THICKNESS, Math.round(toolBar.height || TOOL_BAR_MIN_THICKNESS)),
  );
  const southToolBarSizes = toolBarsByEdge.south.map((toolBar) =>
    Math.max(TOOL_BAR_MIN_THICKNESS, Math.round(toolBar.height || TOOL_BAR_MIN_THICKNESS)),
  );

  const menuBarStackHeight = getStackExtent(
    menuBars,
    (_, index) => menuBarHeights[index] ?? MENU_BAR_MIN_HEIGHT,
  );
  const northToolBarStackHeight = getStackExtent(
    toolBarsByEdge.north,
    (_, index) => northToolBarSizes[index] ?? TOOL_BAR_MIN_THICKNESS,
  );
  const southToolBarStackHeight = getStackExtent(
    toolBarsByEdge.south,
    (_, index) => southToolBarSizes[index] ?? TOOL_BAR_MIN_THICKNESS,
  );

  const topFixedHeight =
    menuBarStackHeight +
    northToolBarStackHeight +
    (menuBarStackHeight > 0 && northToolBarStackHeight > 0 ? FIXED_ZONE_SECTION_GAP : 0);

  const sideTopInset =
    FIXED_ZONE_PADDING + topFixedHeight + (topFixedHeight > 0 ? FIXED_ZONE_SECTION_GAP : 0);
  const sideBottomInset =
    FIXED_ZONE_PADDING +
    southToolBarStackHeight +
    (southToolBarStackHeight > 0 ? FIXED_ZONE_SECTION_GAP : 0);

  let menuTopOffset = FIXED_ZONE_PADDING;
  const menuBarLayout = menuBars.map((menuBar, index) => {
    const height = menuBarHeights[index] ?? MENU_BAR_MIN_HEIGHT;
    const top = menuTopOffset;
    menuTopOffset += height + FIXED_ZONE_GAP;

    return { menuBar, top, height };
  });

  const northToolBarsStart =
    FIXED_ZONE_PADDING +
    menuBarStackHeight +
    (menuBarStackHeight > 0 && toolBarsByEdge.north.length > 0 ? FIXED_ZONE_SECTION_GAP : 0);
  let northTopOffset = northToolBarsStart;
  const northToolBarLayout = toolBarsByEdge.north.map((toolBar, index) => {
    const thickness = northToolBarSizes[index] ?? TOOL_BAR_MIN_THICKNESS;
    const top = northTopOffset;
    northTopOffset += thickness + FIXED_ZONE_GAP;

    return { toolBar, top, thickness };
  });

  let southBottomOffset = FIXED_ZONE_PADDING;
  const southToolBarLayout = toolBarsByEdge.south.map((toolBar, index) => {
    const thickness = southToolBarSizes[index] ?? TOOL_BAR_MIN_THICKNESS;
    const bottom = southBottomOffset;
    southBottomOffset += thickness + FIXED_ZONE_GAP;

    return { toolBar, bottom, thickness };
  });

  let westTopOffset = sideTopInset;
  const westToolBarLayout = toolBarsByEdge.west.map((toolBar) => {
    const thickness = Math.max(
      TOOL_BAR_MIN_THICKNESS,
      Math.round(toolBar.height || TOOL_BAR_MIN_THICKNESS),
    );
    const width = Math.max(
      TOOL_BAR_MIN_SIDE_WIDTH,
      Math.round(toolBar.width || TOOL_BAR_MIN_SIDE_WIDTH),
    );
    const top = westTopOffset;
    westTopOffset += thickness + FIXED_ZONE_GAP;

    return { toolBar, top, thickness, width };
  });

  let eastTopOffset = sideTopInset;
  const eastToolBarLayout = toolBarsByEdge.east.map((toolBar) => {
    const thickness = Math.max(
      TOOL_BAR_MIN_THICKNESS,
      Math.round(toolBar.height || TOOL_BAR_MIN_THICKNESS),
    );
    const width = Math.max(
      TOOL_BAR_MIN_SIDE_WIDTH,
      Math.round(toolBar.width || TOOL_BAR_MIN_SIDE_WIDTH),
    );
    const top = eastTopOffset;
    eastTopOffset += thickness + FIXED_ZONE_GAP;

    return { toolBar, top, thickness, width };
  });

  return {
    componentsById,
    floatingComponents: components.filter((component) => !fixedComponentIds.has(component.id)),
    menuBarLayout,
    northToolBarLayout,
    southToolBarLayout,
    westToolBarLayout,
    eastToolBarLayout,
    sideTopInset,
    sideBottomInset,
  };
}
