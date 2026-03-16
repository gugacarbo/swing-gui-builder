import { useEffect } from "react";

import { parseMessage } from "@/schemas/parsers";
import type { CanvasState, ConfigDefaults } from "@/types/canvas";
import type { PreviewCodeFile } from "@/types/messages";

export interface UseExtensionListenerOptions {
  onLoadState?: (state: CanvasState) => void;
  onConfigDefaults?: (config: ConfigDefaults) => void;
  onPreviewCodeResponse?: (files: PreviewCodeFile[]) => void;
}

export function useExtensionListener(options: UseExtensionListenerOptions): void {
  const { onLoadState, onConfigDefaults, onPreviewCodeResponse } = options;

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      const message = parseMessage(event.data);

      if (!message) {
        return;
      }

      switch (message.type) {
        case "loadState":
          onLoadState?.(message.state as unknown as CanvasState);
          break;
        case "configDefaults":
          onConfigDefaults?.(message.defaults as unknown as ConfigDefaults);
          break;
        case "previewCodeResponse":
          onPreviewCodeResponse?.(message.files);
          break;
        default:
          console.warn("[useExtensionListener] Ignoring unsupported incoming message", {
            type: message.type,
            message,
          });
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onLoadState, onConfigDefaults, onPreviewCodeResponse]);
}
