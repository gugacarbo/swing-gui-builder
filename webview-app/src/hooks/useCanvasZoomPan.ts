import { useCallback, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";

import { ZOOM_DEFAULT, ZOOM_MAX, ZOOM_MIN } from "@/lib/constants";
import { clamp } from "@/lib/geometry";

interface Point {
  x: number;
  y: number;
}

export interface UseCanvasZoomPanResult {
  zoom: number;
  pan: Point;
  handleWheel: (event: WheelEvent<HTMLDivElement>) => void;
  handlePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetView: () => void;
}

const ZOOM_STEP = 0.1;

function roundZoom(value: number): number {
  return Number(value.toFixed(2));
}

export function useCanvasZoomPan(): UseCanvasZoomPanResult {
  const [zoom, setZoom] = useState<number>(ZOOM_DEFAULT);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.ctrlKey) {
      setZoom((previousZoom) => clamp(roundZoom(previousZoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)), ZOOM_MIN, ZOOM_MAX));
      return;
    }

    setPan((previousPan) => ({
      x: previousPan.x - event.deltaX,
      y: previousPan.y - event.deltaY,
    }));
  }, []);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 1 && !event.altKey) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    isPanningRef.current = true;
    lastPointRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current || !lastPointRef.current) {
      return;
    }

    const deltaX = event.clientX - lastPointRef.current.x;
    const deltaY = event.clientY - lastPointRef.current.y;

    lastPointRef.current = { x: event.clientX, y: event.clientY };
    setPan((previousPan) => ({ x: previousPan.x + deltaX, y: previousPan.y + deltaY }));
  }, []);

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    isPanningRef.current = false;
    lastPointRef.current = null;
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((previousZoom) => clamp(roundZoom(previousZoom - ZOOM_STEP), ZOOM_MIN, ZOOM_MAX));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((previousZoom) => clamp(roundZoom(previousZoom + ZOOM_STEP), ZOOM_MIN, ZOOM_MAX));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(ZOOM_DEFAULT);
    setPan({ x: 0, y: 0 });
  }, []);

  return {
    zoom,
    pan,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
  };
}
