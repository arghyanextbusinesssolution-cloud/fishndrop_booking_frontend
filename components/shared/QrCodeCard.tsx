"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QrCodeCardProps {
  value: string;
  title?: string;
  subtitle?: string;
  size?: number;
  className?: string;
}

export default function QrCodeCard({ value, title, subtitle, size = 220, className = "" }: QrCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    }).catch(() => {
      setError(true);
    });
  }, [value, size]);

  if (error) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div
          className="bg-white rounded-xl flex items-center justify-center border border-gray-200"
          style={{ width: size, height: size }}
        >
          <p className="text-gray-400 text-xs text-center px-4">QR code unavailable</p>
        </div>
        {title && <p className="text-sm font-bold text-white">{title}</p>}
        {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100">
        <canvas ref={canvasRef} />
      </div>
      {title && <p className="text-sm font-bold text-white">{title}</p>}
      {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
    </div>
  );
}
