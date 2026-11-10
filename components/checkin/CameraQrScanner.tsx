"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, RefreshCw, SwitchCamera } from "lucide-react";

interface Props {
  /** Called once per distinct QR value. Return a promise to pause scanning until it resolves. */
  onDetected: (value: string) => void | Promise<void>;
  /** Pause decoding (e.g. while a check-in request is in flight). */
  paused?: boolean;
}

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new (opts: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}
type JsQr = typeof import("jsqr").default;

/** Same code is ignored for this long, so one ticket held in front of the camera isn't submitted repeatedly. */
const DUPLICATE_WINDOW_MS = 4000;

/**
 * Live camera QR scanner for door check-in.
 * Uses the native BarcodeDetector where available (Chrome/Android), falling back to jsQR
 * (iOS Safari, Firefox). Requires HTTPS (or localhost) for camera access.
 */
export function CameraQrScanner({ onDetected, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const jsQrRef = useRef<JsQr | null>(null);
  const lastRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const busyRef = useRef(false);
  const pausedRef = useRef(paused);
  const onDetectedRef = useRef(onDetected);

  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [flash, setFlash] = useState(false);

  pausedRef.current = paused;
  onDetectedRef.current = onDetected;

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const decodeFrame = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return null;

    if (detectorRef.current) {
      try {
        const codes = await detectorRef.current.detect(video);
        return codes?.[0]?.rawValue || null;
      } catch {
        detectorRef.current = null; // fall through to jsQR permanently
      }
    }

    const canvas = canvasRef.current;
    if (!canvas || !jsQrRef.current) return null;
    // Downscale for speed; QR codes on phones decode fine at ~640px
    const scale = Math.min(1, 640 / video.videoWidth);
    const w = Math.floor(video.videoWidth * scale);
    const h = Math.floor(video.videoHeight * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const result = jsQrRef.current(img.data, w, h, { inversionAttempts: "dontInvert" });
    return result?.data || null;
  }, []);

  const loop = useCallback(async () => {
    if (!streamRef.current) return;
    if (!pausedRef.current && !busyRef.current) {
      const value = (await decodeFrame())?.trim();
      const now = Date.now();
      if (value && !(value === lastRef.current.value && now - lastRef.current.at < DUPLICATE_WINDOW_MS)) {
        lastRef.current = { value, at: now };
        busyRef.current = true;
        setFlash(true);
        setTimeout(() => setFlash(false), 350);
        if (navigator.vibrate) navigator.vibrate(80);
        try {
          await onDetectedRef.current(value);
        } finally {
          busyRef.current = false;
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [decodeFrame]);

  const start = useCallback(
    async (mode: "environment" | "user" = facing) => {
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera is not available in this browser. Use HTTPS, or enter the code manually below.");
        return;
      }
      setStarting(true);
      stop();
      try {
        const BD = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
        if (BD && !detectorRef.current) {
          try {
            const formats: string[] = (await BD.getSupportedFormats?.()) || [];
            if (formats.includes("qr_code")) detectorRef.current = new BD({ formats: ["qr_code"] });
          } catch {
            /* use jsQR */
          }
        }
        if (!detectorRef.current && !jsQrRef.current) {
          jsQrRef.current = (await import("jsqr")).default;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true"); // iOS: don't go fullscreen
        await video.play();
        setActive(true);
        rafRef.current = requestAnimationFrame(loop);
      } catch (err: unknown) {
        stop();
        const name = err instanceof Error ? err.name : "";
        setError(
          name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access in your browser settings and try again."
            : name === "NotFoundError" || name === "OverconstrainedError"
            ? "No camera was found on this device."
            : name === "NotReadableError"
            ? "The camera is in use by another app. Close it and try again."
            : "Could not start the camera. Make sure the site is opened over HTTPS."
        );
      } finally {
        setStarting(false);
      }
    },
    [facing, loop, stop]
  );

  // Stop camera when leaving the page / tab hidden
  useEffect(() => {
    const onVisibility = () => document.hidden && stop();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [stop]);

  const switchCamera = () => {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    void start(next);
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-white/15 bg-black">
        <video ref={videoRef} muted playsInline className={`h-full w-full object-cover ${active ? "" : "hidden"}`} />
        <canvas ref={canvasRef} className="hidden" />

        {active && (
          <>
            {/* Viewfinder */}
            <div className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-[#C8A96A]/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            <div className="pointer-events-none absolute inset-x-[15%] top-1/2 h-0.5 bg-[#C8A96A]/70 animate-pulse" />
            {flash && <div className="pointer-events-none absolute inset-0 bg-emerald-400/30" />}
            {paused && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold uppercase tracking-wider text-white">
                Validating…
              </div>
            )}
          </>
        )}

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Camera className="w-10 h-10 text-[#C8A96A]/70" />
            <p className="text-xs text-white/60">Point the camera at the guest&apos;s QR ticket.</p>
            <button
              type="button"
              onClick={() => start()}
              disabled={starting}
              className="px-5 py-2.5 rounded-xl bg-[#C8A96A] hover:bg-[#d8b97a] text-black text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
            >
              {starting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {starting ? "Starting camera…" : "Start camera"}
            </button>
          </div>
        )}
      </div>

      {active && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={switchCamera}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
          >
            <SwitchCamera className="w-4 h-4" /> Flip
          </button>
          <button
            type="button"
            onClick={stop}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
          >
            <CameraOff className="w-4 h-4" /> Stop
          </button>
        </div>
      )}

      {error && <p className="text-center text-xs text-amber-300">{error}</p>}
    </div>
  );
}
