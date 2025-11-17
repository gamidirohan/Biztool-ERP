"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getFaceEmbedding, ensureCamera, toArray } from "@/lib/face-recognition";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, LogIn, LogOut, UserPlus } from "lucide-react";

type ModuleRow = { code: string; status: string };

export default function FaceAttendance() {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [faceLinked, setFaceLinked] = useState<boolean>(false);
  const [attendanceAllowed, setAttendanceAllowed] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera on mount
  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      if (videoRef.current && mounted) {
        try {
          const stream = await ensureCamera(videoRef.current);
          if (mounted) {
            streamRef.current = stream;
            setCameraReady(true);
            setCameraError(null);
          } else {
            // Component unmounted during initialization, clean up
            stream.getTracks().forEach(track => track.stop());
          }
        } catch (err) {
          console.error("Camera initialization error:", err);
          if (mounted) {
            const errorMsg = err instanceof Error ? err.message : "Camera access denied";
            setCameraError(errorMsg);
            setError("Camera access denied. Please allow camera permission in your browser.");
          }
        }
      }
    };
    
    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      initCamera();
    }, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const retryCamera = async () => {
    setCameraError(null);
    setError(null);
    if (videoRef.current) {
      try {
        // Stop existing stream if any
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        const stream = await ensureCamera(videoRef.current);
        streamRef.current = stream;
        setCameraReady(true);
      } catch (err) {
        console.error("Camera retry error:", err);
        const errorMsg = err instanceof Error ? err.message : "Camera access denied";
        setCameraError(errorMsg);
        setError("Camera access denied. Please allow camera permission in your browser.");
      }
    }
  };

  // Load current user profile and module subscription state
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found in attendance page');
        return;
      }
      
      setUserId(user.id);
      console.log('User ID set:', user.id);
      
      // Try user_profiles first
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();
      
      let tId = profile?.tenant_id ?? null;
      
      // Fallback to tenant_memberships if no profile
      if (!tId) {
        const { data: membership } = await supabase
          .from("tenant_memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();
        tId = membership?.tenant_id ?? null;
      }
      
      console.log('Tenant ID:', tId);
      setTenantId(tId);

      if (tId) {
        // Check module subscription
        const { data } = await supabase
          .from("tenant_effective_modules")
          .select("code,status")
          .eq("tenant_id", tId)
          .eq("code", "attendance");
        const rows = (data as ModuleRow[] | null) ?? [];
        const allowed = rows.length > 0 && ["active", "trial", "subscribed"].includes(rows[0].status);
        console.log('Attendance module allowed:', allowed);
        setAttendanceAllowed(allowed);
      } else {
        console.log('No tenant ID - allowing attendance for demo/testing');
        // Allow attendance even without tenant for demo users
        setAttendanceAllowed(true);
      }

      // Check if this user already has a face enrollment
      if (user.id && tId) {
        const { data: fe } = await supabase
          .from("face_embeddings")
          .select("id")
          .eq("user_id", user.id)
          .eq("tenant_id", tId)
          .maybeSingle();
        setFaceLinked(Boolean(fe));
      }
    })();
  }, [supabase]);

  // Only require userId and attendanceAllowed (tenantId may be null for demo users)
  const disabled = useMemo(() => {
    const isDisabled = !userId || !attendanceAllowed;
    console.log('Disabled state:', { userId, tenantId, attendanceAllowed, isDisabled });
    return isDisabled;
  }, [userId, tenantId, attendanceAllowed]);

  const enroll = useCallback(async () => {
    setError(null); setSuccess(null);
    try {
      if (!videoRef.current) {
        throw new Error("Camera not ready. Please refresh the page.");
      }
      
      if (!cameraReady) {
        // Try to initialize camera if not ready
        try {
          await ensureCamera(videoRef.current);
          setCameraReady(true);
        } catch (camErr: unknown) {
          const message = camErr instanceof Error ? camErr.message : 'Camera access denied';
          throw new Error("Camera access denied. Please allow camera permission in your browser and refresh the page. Details: " + message);
        }
      }

      const emb = await getFaceEmbedding(videoRef.current);
      const response = await fetch("/api/attendance/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enroll", embedding: toArray(emb) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save enrollment");
      setFaceLinked(true);
      setSuccess("Face enrollment linked to your employee profile.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Enrollment failed";
      setError(message);
    }
  }, [cameraReady]);

  const punch = useCallback(async (action: "check_in" | "check_out") => {
    setError(null); setSuccess(null);
    try {
      if (!videoRef.current) {
        throw new Error("Camera not ready. Please refresh the page.");
      }
      
      if (!cameraReady) {
        // Try to initialize camera if not ready
        try {
          await ensureCamera(videoRef.current);
          setCameraReady(true);
        } catch (camErr: unknown) {
          const message = camErr instanceof Error ? camErr.message : 'Camera access denied';
          throw new Error("Camera access denied. Please allow camera permission in your browser and refresh the page. Details: " + message);
        }
      }

      const emb = await getFaceEmbedding(videoRef.current);
      const response = await fetch("/api/attendance/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, embedding: toArray(emb) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to record attendance");
      setSuccess(`Attendance ${action === "check_in" ? "check-in" : "check-out"} recorded.`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Authentication failed";
      setError(message);
    }
  }, [cameraReady]);

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-[color:var(--card-bg)] rounded-lg border border-[color:var(--card-border)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-6 w-6 text-[color:var(--primary)]" />
          <h2 className="text-xl font-semibold">Face Attendance</h2>
        </div>
        <div className="mb-4 relative">
          <video 
            ref={videoRef} 
            className="w-full rounded border border-[color:var(--card-border)] bg-black" 
            playsInline 
            muted 
            autoPlay
            style={{ minHeight: '300px' }}
          />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
              <div className="text-center text-white">
                {cameraError ? (
                  <>
                    <p className="text-sm mb-3">Camera not accessible</p>
                    <button
                      onClick={retryCamera}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-sm font-medium transition-colors"
                    >
                      Retry Camera Access
                    </button>
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Initializing camera...</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {!attendanceAllowed && (
          <div className="mb-4 text-sm text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-300/60 rounded p-3">
            Attendance module is not active for your organization. Ask an admin to subscribe to it in Dashboard.
          </div>
        )}

        {error && <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
        {success && (
          <div className="mb-3 text-sm text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 border border-green-300/60 rounded p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {success}
          </div>
        )}
        <div className="flex gap-3">
          <Button onClick={enroll} disabled={disabled || faceLinked} className="flex-1">
            <UserPlus className="h-4 w-4 mr-2" /> {faceLinked ? "Face Linked" : "Enroll Face"}
          </Button>
          <Button onClick={() => punch("check_in")} disabled={disabled} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            <LogIn className="h-4 w-4 mr-2" /> Check In
          </Button>
          <Button onClick={() => punch("check_out")} disabled={disabled} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            <LogOut className="h-4 w-4 mr-2" /> Check Out
          </Button>
        </div>
                <p className="text-[10px] text-[color:var(--foreground)]/50 mt-3">Camera permission is required. Your face embedding is computed locally and matched securely against your own template in Supabase.</p>
      </div>
    </div>
  );
}
