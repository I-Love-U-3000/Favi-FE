"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * LoginBackdrop
 * Modern, theme-aware animated backgrounds for auth pages.
 * Variants:
 *  - "neon-stripes": 3 bold diagonal bands with flowing gradients + soft parallax haze
 *  - "aurora": glassy blobs drifting with subtle light streaks
 *  - "grainy-gradient": cinematic moving radial gradient with film-grain
 *
 * Usage:
 *  <LoginBackdrop variant="neon-stripes" />
 *  <LoginBackdrop variant="aurora" />
 *  <LoginBackdrop variant="grainy-gradient" />
 *
 * Place this as the first child of your page, with auth card stacked above using relative z.
 */
export default function LoginBackdrop({
  variant = "neon-stripes",
  className = "",
}: {
  variant?: "neon-stripes" | "aurora" | "grainy-gradient";
  className?: string;
}) {
  const base = "pointer-events-none fixed inset-0 -z-10 overflow-hidden";
  const cx = (s: string) => [base, className, s].filter(Boolean).join(" ");

  if (variant === "neon-stripes") return <NeonStripes className={cx("")} />;
  if (variant === "aurora") return <Aurora className={cx("")} />;
  return <GrainyGradient className={cx("")} />;
}

function NeonStripes({ className = "" }: { className?: string }) {
  // Theme-aware colors; tweak HSLs to match your brand
  const stripes = useMemo(
    () => [
      {
        rotate: -20,
        from: "hsl(200 90% 55%)",
        to: "hsl(160 90% 60%)",
        blur: "4xl",
        width: "42rem",
        opacity: 0.9,
        delay: 0,
      },
      {
        rotate: -20,
        from: "hsl(50 95% 60%)",
        to: "hsl(20 90% 55%)",
        blur: "4xl",
        width: "30rem",
        opacity: 0.75,
        delay: 0.1,
      },
      {
        rotate: -20,
        from: "hsl(280 90% 60%)",
        to: "hsl(320 90% 60%)",
        blur: "4xl",
        width: "22rem",
        opacity: 0.6,
        delay: 0.2,
      },
    ],
    []
  );

  return (
    <div className={className}>
      {/* Background base follows user theme */}
      <div className="absolute inset-0 bg-background" />

      {/* Soft vignette to focus center */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,hsl(0_0%_100%/0.08)_0%,transparent_60%)] dark:bg-[radial-gradient(60%_60%_at_50%_50%,hsl(0_0%_0%/0.35)_0%,transparent_60%)]" />

      <Bubbles/>
      
      {/* Central stripes container */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1200px] h-[120vh] -skew-y-[8deg]">
        {stripes.map((s, i) => (
          <motion.div
            key={i}
            initial={{ backgroundPosition: "0% 50%", opacity: 0 }}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              opacity: s.opacity,
            }}
            transition={{
              duration: 12 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: s.delay,
            }}
            className={`absolute left-1/2 -translate-x-1/2 rounded-[4rem] shadow-2xl blur-${s.blur}`}
            style={{
              top: `${i * 16 + 10}%`,
              rotate: `${s.rotate}deg`,
              width: s.width,
              height: "18rem",
              backgroundImage: `linear-gradient(90deg, ${s.from}, ${s.to})`,
              backgroundSize: "200% 200%",
              filter: "saturate(115%)",
            }}
          />
        ))}

        {/* Dimmed background mini-bands for depth */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`bg-${i}`}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 50, opacity: 0.18 }}
            transition={{ duration: 10 + i, repeat: Infinity, repeatType: "mirror" }}
            className="absolute left-1/2 -translate-x-1/2 h-40 w-[90%] rotate-[-20deg] rounded-3xl bg-gradient-to-r from-sky-400/30 via-cyan-300/30 to-emerald-300/30 blur-3xl"
            style={{ top: `${i * 12}%` }}
          />
        ))}
      </div>

      {/* Floating dust/particles */}
      <Particles count={80} />

      {/* Fine film grain */}
      <NoiseOverlay />
    </div>
  );
}

// ———————————————————————————————————————————
// 2) AURORA BLOBS — soft glassy blobs + light streaks
// ———————————————————————————————————————————
function Aurora({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="absolute inset-0 bg-background" />

      {/* Color wash */}
      <motion.div
        className="absolute -inset-20 blur-3xl opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 20% 30%, hsl(190 85% 60% / .6), transparent 70%),\n             radial-gradient(40% 50% at 80% 20%, hsl(260 85% 65% / .6), transparent 60%),\n             radial-gradient(60% 60% at 80% 80%, hsl(45 95% 60% / .6), transparent 70%)",
        }}
        animate={{ scale: [1, 1.06, 1], rotate: [0, 2, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Glass blobs */}
      {[{ x: "20%", y: "40%" }, { x: "70%", y: "55%" }, { x: "50%", y: "25%" }].map(
        (p, i) => (
          <motion.div
            key={i}
            className="absolute size-[26rem] rounded-full backdrop-blur-2xl bg-white/3 dark:bg-white/2 border border-white/10 shadow-[0_0_80px_20px_hsl(0_0%_100%/0.05)]"
            style={{ left: p.x, top: p.y, translate: "-50% -50%" }}
            animate={{ y: [0, 12, 0], x: [0, i % 2 ? -10 : 10, 0] }}
            transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )
      )}

      {/* Light streaks */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-[1px] w-[120vw] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          style={{ rotate: -20 + i * 10 }}
          animate={{ opacity: [0.1, 0.35, 0.1] }}
          transition={{ duration: 8 + i, repeat: Infinity }}
        />
      ))}

      <Particles count={60} size={1.2} opacity={0.18} />
      <NoiseOverlay />
    </div>
  );
}

// ———————————————————————————————————————————
// 3) GRAINY GRADIENT — cinematic moving radial gradient + grain
// ———————————————————————————————————————————
function GrainyGradient({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="absolute inset-0 bg-background" />

      <motion.div
        className="absolute -inset-[20%] blur-3xl"
        style={{
          background:
            "radial-gradient(45% 45% at 30% 30%, hsl(200 90% 60% / .55), transparent 70%),\n             radial-gradient(35% 35% at 70% 30%, hsl(320 90% 65% / .5), transparent 70%),\n             radial-gradient(55% 55% at 70% 70%, hsl(50 95% 60% / .55), transparent 70%),\n             radial-gradient(40% 40% at 30% 70%, hsl(160 90% 60% / .5), transparent 70%)",
        }}
        animate={{ x: [0, -20, 10, 0], y: [0, 10, -10, 0], rotate: [0, -2, 1, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_50%,hsl(0_0%_0%/0.2),transparent_70%)]" />

      <NoiseOverlay strong />
    </div>
  );
}

// ———————————————————————————————————————————
// Utilities: particles + noise overlay
// ———————————————————————————————————————————
function Particles({ count = 80, size = 1, opacity = 0.12 }: { count?: number; size?: number; opacity?: number }) {
  const arr = useMemo(() => Array.from({ length: count }), [count]);
  return (
    <div className="absolute inset-0">
      {arr.map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: size,
            height: size,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity,
            filter: "blur(0.5px)",
          }}
          animate={{ y: [0, -10, 0], x: [0, i % 2 === 0 ? 6 : -6, 0] }}
          transition={{ duration: 6 + (i % 5), repeat: Infinity, ease: "easeInOut", delay: (i % 10) * 0.2 }}
        />
      ))}
    </div>
  );
}

function NoiseOverlay({ strong = false }: { strong?: boolean }) {
  // Tiny base64 SVG noise (no network)
  const data =
    "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"140\" height=\"140\" viewBox=\"0 0 140 140\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"2\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.25\"/></svg>')";
  return (
    <div
      className="absolute inset-0 mix-blend-overlay"
      style={{ backgroundImage: data, backgroundSize: "240px 240px", opacity: strong ? 0.18 : 0.10 }}
    />
  );
}

/*
———————————————————————————————————————————————
STYLE & LAYOUT TIP (not code):
Wrap your auth card in a container like:

<div className="relative min-h-svh grid place-items-center p-4">
  <LoginBackdrop variant="neon-stripes" />
  <Card className="relative z-10 w-full max-w-md backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/40 bg-white/85 dark:bg-black/50 border border-white/20">
    ...
  </Card>
</div>

*/

function Bubbles({
  region = "center", // "center" | "edges"
  opacity = 0.5,
}: {
  region?: "center" | "edges";
  opacity?: number;
}) {
  const anchors = useMemo(() => {
    if (region === "edges") {
      // Các điểm neo nằm sát rìa, để trống vùng giữa
      return [
        // Trên
        { x: "10%", y: "8%",  size: 160, drift: 10, orbit: 8,  delay: 0.1 },
        { x: "35%", y: "6%",  size: 110, drift: 8,  orbit: -6, delay: 0.4 },
        { x: "70%", y: "7%",  size: 140, drift: 12, orbit: 9,  delay: 0.2 },
        { x: "90%", y: "10%", size: 120, drift: 9,  orbit: -7, delay: 0.5 },

        // Trái
        { x: "6%",  y: "28%", size: 220, drift: 12, orbit: 10, delay: 0.15 },
        { x: "7%",  y: "60%", size: 140, drift: 8,  orbit: -8, delay: 0.35 },
        { x: "9%",  y: "85%", size: 170, drift: 10, orbit: 6,  delay: 0.55 },

        // Phải
        { x: "94%", y: "25%", size: 180, drift: 9,  orbit: -10, delay: 0.25 },
        { x: "92%", y: "55%", size: 220, drift: 11, orbit: 7,   delay: 0.45 },
        { x: "93%", y: "82%", size: 150, drift: 8,  orbit: -7,  delay: 0.65 },

        // Dưới
        { x: "14%", y: "92%", size: 140, drift: 10, orbit: -8, delay: 0.2 },
        { x: "45%", y: "94%", size: 200, drift: 12, orbit: 10, delay: 0.5 },
        { x: "78%", y: "93%", size: 130, drift: 9,  orbit: -9, delay: 0.7 },
      ];
    }

    // Mặc định (center) — như trước
    return [
      { x: "35%", y: "36%", size: 220, drift: 12, orbit: -8, delay: 0 },
      { x: "62%", y: "48%", size: 180, drift: 14, orbit: 10, delay: 0.3 },
      { x: "48%", y: "60%", size: 260, drift: 10, orbit: -6, delay: 0.6 },
      { x: "28%", y: "54%", size: 160, drift: 9,  orbit: 7,  delay: 0.15 },
      { x: "72%", y: "34%", size: 200, drift: 11, orbit: -9, delay: 0.45 },
    ];
  }, [region]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {anchors.map((a, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full backdrop-blur-2xl border border-white/15 shadow-[0_0_80px_12px_hsl(0_0%_100%/0.06)]"
          style={{
            left: a.x,
            top: a.y,
            width: a.size,
            height: a.size,
            translate: "-50% -50%",
            background:
              "radial-gradient(40% 40% at 35% 30%, hsl(0 0% 100% / .25), transparent 70%), " +
              "radial-gradient(55% 55% at 60% 65%, hsl(0 0% 100% / .12), transparent 70%)",
            opacity,
          }}
          initial={{ scale: 0.95, filter: "saturate(110%)" }}
          animate={{
            y: [0, a.drift, 0, -a.drift, 0],
            x: [0, a.orbit, 0, -a.orbit, 0],
            rotate: [0, a.orbit * 1.2, 0],
            scale: [0.96, 1, 0.98, 1],
          }}
          transition={{
            duration: 10 + (i % 3) * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: a.delay ?? 0,
          }}
        />
      ))}
    </div>
  );
}