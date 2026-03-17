import { webcrypto } from "node:crypto";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let uuidCounter = 0;

beforeEach(() => {
  uuidCounter = 0;
  if (globalThis.crypto?.randomUUID) {
    vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
      uuidCounter += 1;
      return `00000000-0000-4000-8000-${uuidCounter.toString().padStart(12, "0")}`;
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});
