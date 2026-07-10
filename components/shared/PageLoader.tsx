"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PageLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const start = () => {
        setProgress(0);
        setVisible(true);

        let current = 0;
        timerRef.current = setInterval(() => {
            // Ease toward ~85% — never auto-completes
            current += (85 - current) * 0.08;
            setProgress(Math.min(current, 85));
        }, 50);
    };

    const finish = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setProgress(100);
        completeTimerRef.current = setTimeout(() => {
            setVisible(false);
            setProgress(0);
        }, 400);
    };

    // Fire on every route change
    useEffect(() => {
        start();
        // Small delay so it feels snappy even on instant navigations
        const t = setTimeout(() => finish(), 120);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                zIndex: 9999,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #C8A96A, #e8c97a, #C8A96A)",
                    backgroundSize: "200% 100%",
                    transition: progress === 100 ? "width 0.2s ease-out" : "width 0.05s linear",
                    animation: progress < 100 ? "shimmer 1.4s infinite" : undefined,
                    boxShadow: "0 0 8px rgba(200,169,106,0.7)",
                    borderRadius: "0 2px 2px 0",
                }}
            />
            <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
        </div>
    );
}
