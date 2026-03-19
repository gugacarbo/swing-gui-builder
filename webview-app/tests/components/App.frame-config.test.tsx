import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";

interface MountedApp {
  container: HTMLDivElement;
  unmount: () => void;
}

interface MockVsCodeApi {
  postMessage: (message: unknown) => void;
}

const mountedApps: MountedApp[] = [];

function mountApp(): MountedApp {
  const container = document.createElement("div");
  document.body.append(container);
  const root: Root = createRoot(container);

  act(() => {
    root.render(createElement(App));
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

function clickElement(element: HTMLElement) {
  act(() => {
    element.click();
  });
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

const postMessageMock = vi.fn();
let originalAcquireVsCodeApi: (() => MockVsCodeApi) | undefined;

beforeEach(() => {
  postMessageMock.mockClear();
  originalAcquireVsCodeApi = (
    globalThis as typeof globalThis & { acquireVsCodeApi?: () => MockVsCodeApi }
  ).acquireVsCodeApi;
  (globalThis as typeof globalThis & { acquireVsCodeApi?: () => MockVsCodeApi }).acquireVsCodeApi =
    () => ({
      postMessage: postMessageMock,
    });
});

afterEach(() => {
  for (const mounted of mountedApps.splice(0)) {
    mounted.unmount();
  }

  (globalThis as typeof globalThis & { acquireVsCodeApi?: () => MockVsCodeApi }).acquireVsCodeApi =
    originalAcquireVsCodeApi;
});

describe("App JFrame configuration flow", () => {
  it("exposes toolbar action and applies JFrame configuration to outgoing state", () => {
    const mounted = mountApp();
    mountedApps.push(mounted);

    const configureButton = Array.from(mounted.container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Configure JFrame"),
    );
    if (!(configureButton instanceof HTMLButtonElement)) {
      throw new Error("Configure JFrame button not found");
    }

    clickElement(configureButton);

    const widthInput = findInputByLabel(mounted.container, "Width");
    const heightInput = findInputByLabel(mounted.container, "Height");
    const titleInput = findInputByLabel(mounted.container, "Title");
    const useCustomBackgroundCheckbox = findInputByLabel(
      mounted.container,
      "Use custom background color",
      "checkbox",
    );
    const applyButton = Array.from(mounted.container.querySelectorAll("button")).find(
      (button) => button.textContent === "Apply",
    );

    if (!(applyButton instanceof HTMLButtonElement)) {
      throw new Error("Apply button not found");
    }

    setInputValue(widthInput, "1280");
    setInputValue(heightInput, "720");
    setInputValue(titleInput, "Orders Dashboard");
    clickElement(useCustomBackgroundCheckbox);
    const backgroundInput = findInputByLabel(mounted.container, "Background", "text");
    setInputValue(backgroundInput, "#123abc");
    clickElement(applyButton);

    const stateChangedMessages = postMessageMock.mock.calls
      .map(([message]) => message)
      .filter(
        (message): message is { type: "stateChanged"; state: Record<string, unknown> } =>
          typeof message === "object" &&
          message !== null &&
          "type" in message &&
          (message as { type?: string }).type === "stateChanged",
      );

    const latestStateMessage = stateChangedMessages.at(-1);
    expect(latestStateMessage).toBeDefined();
    expect(latestStateMessage?.state.frameWidth).toBe(1280);
    expect(latestStateMessage?.state.frameHeight).toBe(720);
    expect(latestStateMessage?.state.frameTitle).toBe("Orders Dashboard");
    expect(latestStateMessage?.state.backgroundColor).toBe("#123abc");
  });
});
