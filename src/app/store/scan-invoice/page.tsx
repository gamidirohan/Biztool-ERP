"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, X, FlipHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ScanInvoicePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const router = useRouter();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera access error:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          sessionStorage.setItem("invoiceImage", base64);
          sessionStorage.setItem("invoiceFileName", `invoice_${Date.now()}.jpg`);
          stopCamera();
          router.push("/store/preview-invoice");
        };
        reader.readAsDataURL(blob);
      }
    }, "image/jpeg", 0.9);
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const goBack = () => {
    stopCamera();
    router.back();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <Button
          onClick={goBack}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-white font-semibold">Scan Invoice</h1>
        <Button
          onClick={flipCamera}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <FlipHorizontal className="h-6 w-6" />
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center bg-gradient-to-t from-black/60 to-transparent">
        <Button
          onClick={capturePhoto}
          size="lg"
          className="h-16 w-16 rounded-full bg-white hover:bg-gray-200 text-black"
        >
          <Camera className="h-8 w-8" />
        </Button>
      </div>

      {/* Guidelines */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="border-2 border-white/50 rounded-lg w-[90%] max-w-md aspect-[3/4]" />
      </div>
    </div>
  );
}
