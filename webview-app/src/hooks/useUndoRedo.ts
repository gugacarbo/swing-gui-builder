import { useCallback, useMemo, useState } from "react";

export interface UndoRedoOptions {
  historyLimit?: number;
}

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UseUndoRedoResult<T> {
  state: T;
  set: (next: T | ((current: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  reset: (nextState: T) => void;
  canUndo: boolean;
  canRedo: boolean;
  history: {
    past: T[];
    future: T[];
  };
}

export function useUndoRedo<T>(
  initialState: T,
  options: UndoRedoOptions = {},
): UseUndoRedoResult<T> {
  const { historyLimit = 100 } = options;

  const [historyState, setHistoryState] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const set = useCallback(
    (next: T | ((current: T) => T)) => {
      setHistoryState((currentState) => {
        const nextValue =
          typeof next === "function" ? (next as (current: T) => T)(currentState.present) : next;

        if (Object.is(currentState.present, nextValue)) {
          return currentState;
        }

        const nextPast = [...currentState.past, currentState.present];
        return {
          past:
            nextPast.length > historyLimit
              ? nextPast.slice(nextPast.length - historyLimit)
              : nextPast,
          present: nextValue,
          future: [],
        };
      });
    },
    [historyLimit],
  );

  const undo = useCallback(() => {
    setHistoryState((currentState) => {
      if (currentState.past.length === 0) {
        return currentState;
      }

      const previous = currentState.past[currentState.past.length - 1];
      return {
        past: currentState.past.slice(0, -1),
        present: previous,
        future: [currentState.present, ...currentState.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryState((currentState) => {
      if (currentState.future.length === 0) {
        return currentState;
      }

      const [nextPresent, ...remainingFuture] = currentState.future;
      return {
        past: [...currentState.past, currentState.present],
        present: nextPresent,
        future: remainingFuture,
      };
    });
  }, []);

  const reset = useCallback((nextState: T) => {
    setHistoryState({ past: [], present: nextState, future: [] });
  }, []);

  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;

  const history = useMemo(
    () => ({
      past: historyState.past,
      future: historyState.future,
    }),
    [historyState.future, historyState.past],
  );

  return {
    state: historyState.present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    history,
  };
}
