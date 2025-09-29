"use client";

import { memo } from "react";

type Props = {
  /** khi true: nhanh hơn */
  fast?: boolean;
};

/**
 * Nền bong bóng gradient trôi nổi — tối ưu & mượt
 */
export const BackgroundBubbles = memo(function BackgroundBubbles({ fast }: Props) {
  const bubbles = [
    { size: 42, top: "8%", left: "6%", hue: 200, delay: 0.0 },
    { size: 52, top: "18%", left: "78%", hue: 270, delay: 0.8 },
    { size: 34, top: "72%", left: "12%", hue: 160, delay: 0.4 },
    { size: 64, top: "60%", left: "82%", hue: 300, delay: 1.4 },
    { size: 48, top: "34%", left: "26%", hue: 220, delay: 1.0 },
    { size: 38, top: "82%", left: "56%", hue: 180, delay: 0.6 },
  ];

  // nhanh hơn: duration ngắn hơn & biên độ lớn hơn một chút
  const baseDur = fast ? 8 : 14;      // trước đây 14–20s, giờ 8–12s khi fast
  const hueDur = fast ? 18 : 28;
  const translateY = fast ? 64 : 40;  // px (biên độ)

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="bubble absolute rounded-full opacity-40 blur-2xl"
          style={
            {
              width: `min(${b.size}vmin, 28rem)`,
              height: `min(${b.size}vmin, 28rem)`,
              top: b.top,
              left: b.left,
              ["--h" as any]: b.hue,
              ["--delay" as any]: `${b.delay}s`,
              ["--dur" as any]: `${baseDur + (i % 3) * (fast ? 2 : 3)}s`,
              ["--amp" as any]: `${translateY}px`,
              ["--huedur" as any]: `${hueDur}s`,
            } as React.CSSProperties
          }
        />
      ))}

      <style jsx>{`
        .bubble {
          background: radial-gradient(
            ellipse at 30% 30%,
            hsl(var(--h) 90% 65% / 0.45) 0%,
            hsl(calc(var(--h) + 40) 90% 55% / 0.35) 35%,
            hsl(calc(var(--h) + 80) 90% 50% / 0.25) 65%,
            transparent 100%
          );
          animation: float var(--dur) ease-in-out var(--delay) infinite alternate,
            hue var(--huedur) linear infinite;
          will-change: transform, filter;
          filter: saturate(1.1);
        }
        @keyframes float {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(0, calc(var(--amp) * -1), 0) scale(1.06);
          }
        }
        @keyframes hue {
          0% {
            filter: hue-rotate(0deg);
          }
          100% {
            filter: hue-rotate(60deg);
          }
        }
      `}</style>
    </div>
  );
});
