"use client"

import { useState, useCallback } from "react"
import { Eye, Radar, Target, Download, VideoOff } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import EyeTracker from "@/components/analytics/EyeTracker"
import { CalibrationOverlay } from "@/components/analytics/CalibrationOverlay"

export function EyeTrackingDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [predictionVisible, setPredictionVisible] = useState(false)
  const [recording, setRecording] = useState(false)
  const [calibrationActive, setCalibrationActive] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`)

  const handleRecordingChange = useCallback(async (value: boolean) => {
    setRecording(value)
  }, [])

  const handleCalibrationStart = useCallback(() => {
    setCalibrationActive(true)
  }, [])

  const handleCalibrationFinish = useCallback(() => {
    setCalibrationActive(false)
  }, [])

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const response = await fetch(
        `/api/analytics/gaze?sessionId=${encodeURIComponent(sessionId)}`,
        { method: "GET" }
      )

      if (response.status === 404) {
        alert("No gaze data recorded for this session. Start recording first.")
        return
      }

      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `gaze-${sessionId}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download gaze data", error)
      alert("Failed to download gaze data. Check console for details.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      {isOpen && (
        <>
          <EyeTracker
            showPredictionPoints={predictionVisible}
            captureSamples={recording}
            sessionId={sessionId}
          />
          <CalibrationOverlay
            active={calibrationActive}
            onComplete={handleCalibrationFinish}
            onCancel={handleCalibrationFinish}
          />
        </>
      )}

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <button className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-lg border border-border/50 px-4 py-2.5 text-sm font-medium transition-all hover:bg-background hover:border-border shadow-lg">
            <Eye className="h-4 w-4" />
            Eye Tracking
          </button>
        </DrawerTrigger>
        <DrawerContent className="border-t border-border/50">
          <DrawerTitle className="sr-only">Eye Tracking Analytics</DrawerTitle>
          <div className="mx-auto w-full max-w-6xl py-6">

            <div className="grid grid-cols-[320px_1fr_320px] gap-6 px-6">
              {/* Left Column - Controls */}
              <div className="space-y-3">
                {/* Prediction Dot Control */}
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/50">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Prediction Dot</h4>
                        <p className="text-xs text-muted-foreground">
                          Status: <span className={predictionVisible ? 'text-blue-500' : 'text-muted-foreground'}>{predictionVisible ? 'Visible' : 'Hidden'}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPredictionVisible(!predictionVisible)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${predictionVisible ? 'bg-blue-500' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${predictionVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Recording Control */}
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/50">
                        <Radar className={`h-5 w-5 ${recording ? 'text-red-500' : ''}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Recording</h4>
                        <p className="text-xs text-muted-foreground">
                          Status: <span className={recording ? 'text-red-500' : 'text-muted-foreground'}>{recording ? 'Active' : 'Inactive'}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRecordingChange(!recording)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${recording ? 'bg-red-500' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${recording ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Column - Webcam Preview */}
              <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  {recording && <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />}
                </div>
                
                <div id="webgazer-video-container" className="aspect-video rounded-xl border border-border/30 bg-background/30 flex items-center justify-center overflow-hidden relative">
                  {!isOpen && (
                    <div className="absolute inset-0 flex items-center justify-center text-center space-y-3 z-10 bg-background/30">
                      <div>
                        <VideoOff className="h-16 w-16 mx-auto text-muted-foreground/30" />
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">
                            Webcam feed processes locally.
                          </p>
                          <p className="text-xs text-muted-foreground/60">
                            No video data uploaded.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Additional Controls */}
              <div className="space-y-3">
                {/* Calibration */}
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/50">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Calibration</h4>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCalibrationStart}
                      className="rounded-lg"
                    >
                      Launch
                    </Button>
                  </div>
                </div>

                {/* Download Data */}
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/50">
                        <Download className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Export Data</h4>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="rounded-lg"
                    >
                      {downloading ? "..." : "Download"}
                    </Button>
                  </div>
                </div>

                {/* Session Info */}
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Session ID</h4>
                    <p className="font-mono text-xs text-muted-foreground break-all">
                      {sessionId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default EyeTrackingDrawer
