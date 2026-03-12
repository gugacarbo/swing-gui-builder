import { useCallback, useMemo } from "react";

import type { OutgoingExtensionMessage, StateChangedMessage, ToolbarCommand, ToolbarCommandMessage } from "@/types/messages";

interface VsCodeApi {
  postMessage: (message: unknown) => void;
}

function getVsCodeApi(): VsCodeApi | null {
  const maybeAcquire = (globalThis as typeof globalThis & { acquireVsCodeApi?: () => VsCodeApi }).acquireVsCodeApi;
  if (!maybeAcquire) {
    return null;
  }

  try {
    return maybeAcquire();
  } catch {
    return null;
  }
}

export interface UsePostMessageResult {
  postMessage: (message: OutgoingExtensionMessage) => void;
  postStateChanged: (message: StateChangedMessage["state"]) => void;
  postToolbarCommand: (command: ToolbarCommandMessage["command"]) => void;
}

export function usePostMessage(): UsePostMessageResult {
  const vscode = useMemo(() => getVsCodeApi(), []);

  const postMessage = useCallback(
    (message: OutgoingExtensionMessage) => {
      if (vscode) {
        vscode.postMessage(message);
        return;
      }

      // Useful fallback during browser development outside VS Code webview.
      console.debug("[webview-app] postMessage fallback", message);
    },
    [vscode],
  );

  const postStateChanged = useCallback(
    (state: StateChangedMessage["state"]) => {
      postMessage({ type: "stateChanged", state });
    },
    [postMessage],
  );

  const postToolbarCommand = useCallback(
    (command: ToolbarCommand) => {
      postMessage({ type: "toolbarCommand", command });
    },
    [postMessage],
  );

  return {
    postMessage,
    postStateChanged,
    postToolbarCommand,
  };
}
