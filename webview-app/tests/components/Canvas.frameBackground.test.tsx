import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Canvas } from "@/components/Canvas";
import { FRAME_TITLE_BAR_HEIGHT } from "@/components/Canvas/constants";

interface MountedCanvas {
  container: HTMLDivElement;
  rerender: (overrides?: Partial<ComponentProps<typeof Canvas>>) => void;
  unmount: () => void;
}

const mountedCanvases: MountedCanvas[] = [];

function mountCanvas(initialOverrides: Partial<ComponentProps<typeof Canvas>> = {}): MountedCanvas {
  const container = document.createElement("div");
  document.body.append(container);
  const root: Root = createRoot(container);

  const baseProps: ComponentProps<typeof Canvas> = {
    frameWidth: 800,
    frameHeight: 600,
    components: [],
    selectedComponentId: null,
    onSelectComponent: vi.fn(),
    onAddComponent: vi.fn(),
    onMoveComponent: vi.fn(),
    onResizeComponent: vi.fn(),
  };

  const rerender = (overrides: Partial<ComponentProps<typeof Canvas>> = {}) => {
    act(() => {
      root.render(createElement(Canvas, { ...baseProps, ...overrides }));
    });
  };

  rerender(initialOverrides);

  return {
    container,
    rerender,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function getFrameContentArea(container: HTMLElement): HTMLElement {
  const title = Array.from(container.querySelectorAll("span")).find((element) =>
    element.textContent?.includes("JFrame ("),
  );
  if (!title?.parentElement?.parentElement) {
    throw new Error("Failed to locate JFrame preview content area");
  }

  const frameElement = title.parentElement.parentElement;
  const contentArea = frameElement.children.item(1);

  if (!(contentArea instanceof HTMLElement)) {
    throw new Error("Failed to locate JFrame preview content container");
  }

  return contentArea;
}

afterEach(() => {
  for (const mounted of mountedCanvases.splice(0)) {
    mounted.unmount();
  }
});

describe("Canvas JFrame preview background", () => {
  it("uses frameBackgroundColor in preview rendering", () => {
    const mounted = mountCanvas({ frameBackgroundColor: "#123456" });
    mountedCanvases.push(mounted);

    const contentArea = getFrameContentArea(mounted.container);

    expect(contentArea.style.top).toBe(`${FRAME_TITLE_BAR_HEIGHT}px`);
    expect(contentArea.style.backgroundColor).toBe("rgb(18, 52, 86)");
  });

  it("updates preview background immediately when frameBackgroundColor changes", () => {
    const mounted = mountCanvas({ frameBackgroundColor: "#123456" });
    mountedCanvases.push(mounted);

    mounted.rerender({ frameBackgroundColor: "#abcdef" });

    const contentArea = getFrameContentArea(mounted.container);
    expect(contentArea.style.backgroundColor).toBe("rgb(171, 205, 239)");
  });

  it("keeps default preview behavior when no explicit frameBackgroundColor is provided", () => {
    const mounted = mountCanvas();
    mountedCanvases.push(mounted);

    const contentArea = getFrameContentArea(mounted.container);

    expect(contentArea.style.top).toBe(`${FRAME_TITLE_BAR_HEIGHT}px`);
    expect(contentArea.style.backgroundColor).toBe("");
  });
});
