import { act, type ComponentProps, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FrameConfigModal } from "@/components/FrameConfigModal";

interface MountedModal {
  container: HTMLDivElement;
  unmount: () => void;
}

const mountedModals: MountedModal[] = [];

function mountModal(
  overrides: Partial<ComponentProps<typeof FrameConfigModal>> = {},
): MountedModal {
  const container = document.createElement("div");
  document.body.append(container);
  const root: Root = createRoot(container);

  const baseProps: ComponentProps<typeof FrameConfigModal> = {
    isOpen: true,
    initialWidth: 800,
    initialHeight: 600,
    initialTitle: "MainWindow",
    initialBackgroundColor: "#abcdef",
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  act(() => {
    root.render(createElement(FrameConfigModal, { ...baseProps, ...overrides }));
  });

  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function findInputByLabel(
  container: HTMLElement,
  labelText: string,
  inputType: HTMLInputElement["type"] = "text",
): HTMLInputElement {
  const label = Array.from(container.querySelectorAll("label")).find((node) =>
    node.textContent?.includes(labelText),
  );

  if (!label) {
    throw new Error(`Could not find label: ${labelText}`);
  }

  const inputs = Array.from(label.querySelectorAll("input")).filter(
    (input): input is HTMLInputElement => input instanceof HTMLInputElement,
  );
  const input = inputs.find((candidate) => candidate.type === inputType);
  if (!input) {
    throw new Error(`Could not find ${inputType} input for label: ${labelText}`);
  }

  return input;
}

function setInputValue(input: HTMLInputElement, value: string) {
  act(() => {
    // Use native setter to properly trigger React's synthetic events
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    if (descriptor?.set) {
      descriptor.set.call(input, value);
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function clickElement(element: HTMLElement) {
  act(() => {
    element.click();
  });
}

afterEach(() => {
  for (const mounted of mountedModals.splice(0)) {
    mounted.unmount();
  }
});

describe("FrameConfigModal validation", () => {
  it("keeps previous width when invalid width input is entered", () => {
    const onApply = vi.fn();
    const mounted = mountModal({ onApply });
    mountedModals.push(mounted);

    const widthInput = findInputByLabel(mounted.container, "Width");
    const applyButton = Array.from(mounted.container.querySelectorAll("button")).find(
      (button) => button.textContent === "Apply",
    );

    if (!(applyButton instanceof HTMLButtonElement)) {
      throw new Error("Apply button not found");
    }

    setInputValue(widthInput, "invalid");
    clickElement(applyButton);

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 800,
      }),
    );
  });

  it("keeps previous background color when invalid color input is entered", () => {
    const onApply = vi.fn();
    const mounted = mountModal({ onApply });
    mountedModals.push(mounted);

    const backgroundInput = findInputByLabel(mounted.container, "Background", "text");
    const applyButton = Array.from(mounted.container.querySelectorAll("button")).find(
      (button) => button.textContent === "Apply",
    );

    if (!(applyButton instanceof HTMLButtonElement)) {
      throw new Error("Apply button not found");
    }

    setInputValue(backgroundInput, "#12gg12");
    clickElement(applyButton);

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundColor: "#abcdef",
      }),
    );
  });

  it("applies updated dimensions, title and background color", () => {
    const onApply = vi.fn();
    const mounted = mountModal({ onApply });
    mountedModals.push(mounted);

    const widthInput = findInputByLabel(mounted.container, "Width");
    const heightInput = findInputByLabel(mounted.container, "Height");
    const titleInput = findInputByLabel(mounted.container, "Title");
    const backgroundInput = findInputByLabel(mounted.container, "Background", "text");
    const applyButton = Array.from(mounted.container.querySelectorAll("button")).find(
      (button) => button.textContent === "Apply",
    );

    if (!(applyButton instanceof HTMLButtonElement)) {
      throw new Error("Apply button not found");
    }

    setInputValue(widthInput, "1280");
    setInputValue(heightInput, "720");
    setInputValue(titleInput, "Orders Dashboard");
    setInputValue(backgroundInput, "#123456");
    clickElement(applyButton);

    expect(onApply).toHaveBeenCalledWith({
      width: 1280,
      height: 720,
      title: "Orders Dashboard",
      backgroundColor: "#123456",
    });
  });
});
