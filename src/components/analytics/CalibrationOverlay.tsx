"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const CALIBRATION_POINTS = [
  { x: "10%", y: "15%" },
  { x: "50%", y: "15%" },
  { x: "90%", y: "15%" },
  { x: "50%", y: "50%" },
  { x: "15%", y: "80%" },
  { x: "50%", y: "85%" },
  { x: "85%", y: "80%" },
];

const STEP_DURATION_MS = 1300;

export type CalibrationOverlayProps = {
  active: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
};

export function CalibrationOverlay({
  active,
  onComplete,
  onCancel,
}: CalibrationOverlayProps) {
  const [step, setStep] = useState(0);
  // Added state to ensure calibration is called only once
  const [calibrated, setCalibrated] = useState(false);

  useEffect(() => {
    if (!active) {
      setStep(0);
      setCalibrated(false);
      return;
    }

    if (step >= CALIBRATION_POINTS.length) {
      if (!calibrated && typeof window !== "undefined") {
        const webgazer = (window as any).webgazer;
        if (webgazer?.calibrate) {
          try {
            // Calibrate with the points we showed
            CALIBRATION_POINTS.forEach((point) => {
              const x = (parseFloat(point.x) / 100) * window.innerWidth;
              const y = (parseFloat(point.y) / 100) * window.innerHeight;
              webgazer.calibrate(x, y);
            });
            setCalibrated(true);
          } catch (error) {
            console.warn("WebGazer calibration failed", error);
          }
        }
      }
      onComplete?.();
      return;
    }

    const handle = window.setTimeout(() => {
      setStep((prev) => prev + 1);
    }, STEP_DURATION_MS);

    return () => {
      window.clearTimeout(handle);
    };
  }, [active, step, calibrated, onComplete]);

  const dotPosition = useMemo(() => {
    if (!active) {
      return null;
    }
    return CALIBRATION_POINTS[Math.min(step, CALIBRATION_POINTS.length - 1)];
  }, [active, step]);

  if (!active || !dotPosition) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 text-white">
      <button
        type="button"
        aria-label="Cancel calibration"
        className="absolute right-4 top-4 rounded-full border border-white/40 bg-white/10 p-2 text-white shadow"
        onClick={onCancel}
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mb-12 max-w-sm text-center text-base">
        <h2 className="mb-2 text-xl font-semibold">Eye calibration</h2>
        <p className="text-sm text-white/80">
          Follow the pink dot with your eyes until the calibration finishes.
        </p>
      </div>

      <div className="relative h-[80vh] w-[90vw] max-w-4xl rounded-2xl border border-white/20 bg-white/5">
        <div
          style={{
            left: dotPosition.x,
            top: dotPosition.y,
            transform: "translate(-50%, -50%)",
          }}
          className="absolute h-5 w-5 rounded-full bg-rose-400 shadow-lg shadow-rose-500/50 transition-all duration-300"
        />
      </div>
    </div>
  );
}

export default CalibrationOverlay;
