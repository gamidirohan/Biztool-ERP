"use client";

import { useState } from "react";
import { Download, Eye, EyeOff, Radar, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type EyeTrackingDebugPanelProps = {
  predictionVisible: boolean;
  onPredictionVisibleChange: (value: boolean) => void;
  recording: boolean;
  onRecordingChange: (value: boolean) => void | Promise<void>;
  onStartCalibration: () => void;
  sessionId: string;
  onClose?: () => void;
};

export function EyeTrackingDebugPanel({
  predictionVisible,
  onPredictionVisibleChange,
  recording,
  onRecordingChange,
  onStartCalibration,
  sessionId,
  onClose,
}: EyeTrackingDebugPanelProps) {
  const [downloading, setDownloading] = useState(false);
  const [recordingTransition, setRecordingTransition] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(
        `/api/analytics/gaze?sessionId=${encodeURIComponent(sessionId)}`,
        {
          method: "GET",
        }
      );

      if (response.status === 404) {
        alert("No gaze data recorded for this session. Start recording first.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gaze-${sessionId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download gaze data", error);
      alert("Failed to download gaze data. Check console for details.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[90] w-72 rounded-2xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border border-border bg-background/80 p-1 text-muted-foreground transition hover:bg-background"
          aria-label="Close eye tracking tools"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Eye tracking tools
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs uppercase text-muted-foreground">
            <span>Prediction dot</span>
            <span>{predictionVisible ? "visible" : "hidden"}</span>
          </div>
          <Button
            size="sm"
            variant={predictionVisible ? "default" : "outline"}
            className="w-full"
            onClick={() => onPredictionVisibleChange(!predictionVisible)}
          >
            {predictionVisible ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {predictionVisible ? "Hide" : "Show"} prediction dot
          </Button>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs uppercase text-muted-foreground">
            <span>Recording</span>
            <span>{recording ? "on" : "off"}</span>
          </div>
          <Button
            size="sm"
            variant={recording ? "destructive" : "outline"}
            className="w-full"
            disabled={recordingTransition}
            onClick={async () => {
              try {
                setRecordingTransition(true);
                await onRecordingChange(!recording);
              } finally {
                setRecordingTransition(false);
              }
            }}
          >
            <Radar className="mr-2 h-4 w-4" />
            {recordingTransition
              ? "Working..."
              : recording
              ? "Stop" : "Start"} capture
          </Button>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase text-muted-foreground">Calibration</div>
          <Button
            size="sm"
            className="w-full"
            variant="secondary"
            onClick={onStartCalibration}
          >
            <Target className="mr-2 h-4 w-4" />
            Launch calibration
          </Button>
        </div>

        <div className="rounded-lg bg-muted/40 p-2 text-[11px] leading-4 text-muted-foreground">
          Session ID: <span className="font-mono text-xs">{sessionId}</span>
        </div>

        <Button
          size="sm"
          className="w-full"
          variant="outline"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download className="mr-2 h-4 w-4" />
          {downloading ? "Preparing..." : "Download CSV"}
        </Button>
      </div>
    </div>
  );
}

export default EyeTrackingDebugPanel;
