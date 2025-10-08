"use client";

import { useCallback, useEffect, useRef } from "react";
import type { WebgazerAPI, WebgazerPrediction } from "webgazer";

type EyeTrackerOptions = {
  /**
   * When true, gaze coordinates will be forwarded to Microsoft Clarity via custom tags
   * (requires Clarity script to be present on the page).
   */
  enableClaritySync?: boolean;
  /**
   * Controls whether the prediction point (red dot) rendered by WebGazer should be visible.
   */
  showPredictionPoints?: boolean;
  /**
   * Optional session identifier. When provided alongside captureSamples, gaze samples
   * will be buffered and posted to the analytics API for CSV export.
   */
  sessionId?: string;
  /** Enable streaming gaze samples to the analytics API */
  captureSamples?: boolean;
  /** Milliseconds between gaze samples when captureSamples is enabled. */
  sampleThrottleMs?: number;
  /** Milliseconds between POST uploads to the analytics API. */
  flushIntervalMs?: number;
};

function isClarityAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.clarity === "function";
}

type GazeSample = {
  x: number;
  y: number;
  t: number;
};

const DEFAULT_SAMPLE_THROTTLE_MS = 120;
const DEFAULT_FLUSH_INTERVAL_MS = 2_000;

export function EyeTracker({
  enableClaritySync = true,
  showPredictionPoints = false,
  sessionId,
  captureSamples = false,
  sampleThrottleMs = DEFAULT_SAMPLE_THROTTLE_MS,
  flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS,
}: EyeTrackerOptions = {}) {
  const webgazerRef = useRef<WebgazerAPI | null>(null);
  const initializedRef = useRef(false);
  const clarityEnabledRef = useRef(enableClaritySync);
  const captureEnabledRef = useRef(captureSamples);
  const sessionIdRef = useRef<string | undefined>(sessionId);
  const bufferRef = useRef<GazeSample[]>([]);
  const lastSampleRef = useRef(0);
  const flushingRef = useRef(false);

  const flushBuffer = useCallback(async () => {
    if (flushingRef.current) {
      return;
    }

    const activeSession = sessionIdRef.current;
    if (!activeSession || bufferRef.current.length === 0) {
      return;
    }

    const payload = {
      sessionId: activeSession,
      samples: bufferRef.current.splice(0, bufferRef.current.length),
    };

    flushingRef.current = true;
    try {
      await fetch("/api/analytics/gaze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to upload gaze samples", error);
      bufferRef.current.unshift(...payload.samples);
    } finally {
      flushingRef.current = false;
    }
  }, []);

  useEffect(() => {
    clarityEnabledRef.current = enableClaritySync;
  }, [enableClaritySync]);

  useEffect(() => {
    captureEnabledRef.current = captureSamples;
    if (!captureSamples) {
      void flushBuffer();
    }
  }, [captureSamples, flushBuffer]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
    if (!sessionId) {
      bufferRef.current = [];
    }
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;

    if (typeof window === "undefined" || initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const load = async () => {
      try {
        const imported = await import("webgazer");
        const webgazer: WebgazerAPI =
          imported.default ?? (imported as unknown as WebgazerAPI);

        if (!webgazer?.begin) {
          console.warn("WebGazer failed to initialize: missing begin() method");
          return;
        }

        if (cancelled) {
          return;
        }

        webgazerRef.current = webgazer;

        // begin() may be async or may not return the API instance in some builds.
        // Call it and then call other API methods separately to avoid chaining errors.
        const beginResult = webgazer.begin?.();
        if (beginResult instanceof Promise) {
          try {
            await beginResult;
          } catch (error) {
            console.warn("WebGazer begin() rejected", error);
          }
        }

        if (typeof webgazer.setGazeListener === "function") {
          webgazer.setGazeListener((data: WebgazerPrediction | null) => {
            if (!data) {
              return;
            }

            if (clarityEnabledRef.current && isClarityAvailable()) {
              window.clarity?.("set", "gazeX", data.x);
              window.clarity?.("set", "gazeY", data.y);
            }

            if (captureEnabledRef.current && sessionIdRef.current) {
              const now = Date.now();
              if (now - lastSampleRef.current >= sampleThrottleMs) {
                bufferRef.current.push({ x: data.x, y: data.y, t: now });
                lastSampleRef.current = now;
              }
            }
          });
        }

        if (typeof webgazer.showPredictionPoints === "function") {
          try {
            webgazer.showPredictionPoints(showPredictionPoints);
          } catch (error) {
            console.warn("Failed to set prediction visibility", error);
          }
        }

        if (typeof webgazer.start === "function") {
          try {
            webgazer.start();
          } catch (error) {
            console.warn("WebGazer start() failed", error);
          }
        }
      } catch (error) {
        console.error("WebGazer failed to load", error);
      }
    };

    load();

    return () => {
      cancelled = true;
      const webgazer = webgazerRef.current;
      try {
        webgazer?.clearGazeListener?.();
        webgazer?.end?.();
      } catch (error) {
        console.error("Failed to clean up WebGazer", error);
      }
      void flushBuffer();
      webgazerRef.current = null;
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const webgazer = webgazerRef.current;
    if (!webgazer || typeof webgazer.showPredictionPoints !== "function") {
      return;
    }
    try {
      webgazer.showPredictionPoints(showPredictionPoints);
    } catch (error) {
      console.error("Failed to toggle prediction points", error);
    }
  }, [showPredictionPoints]);

  useEffect(() => {
    if (!captureSamples || !sessionId) {
      return () => {
        void flushBuffer();
      };
    }

    const interval = window.setInterval(() => {
      void flushBuffer();
    }, Math.max(flushIntervalMs, 500));

    return () => {
      window.clearInterval(interval);
      void flushBuffer();
    };
  }, [captureSamples, flushIntervalMs, flushBuffer, sessionId]);

  return null;
}

export default EyeTracker;
