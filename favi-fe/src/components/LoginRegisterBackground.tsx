"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

function isDarkTheme(theme?: string) {
  return (
    theme?.includes("dark") ||
    theme === "dark-night" ||
    theme === "aurora" ||
    theme === "oceanic"
  );
}

export default function LoginBackdrop({
  variant = "neon-stripes",
  className = "",
}: {
  variant?: "neon-stripes" | "aurora" | "grainy-gradient";
  className?: string;
}) {
  const { theme } = useTheme();

  const colorMap = useMemo(() => {
    switch (theme) {
      case "sakura":
        return {
          primary: "hsl(330 80% 70%)",
          accent: "hsl(350 90% 75%)",
          glow: "hsl(340 90% 80%)",
          shadow: "hsl(330 50% 20%)",
        };
      case "minty":
        return {
          primary: "hsl(150 70% 55%)",
          accent: "hsl(170 80% 60%)",
          glow: "hsl(160 90% 70%)",
          shadow: "hsl(160 50% 25%)",
        };
      case "oceanic":
        return {
          primary: "hsl(210 90% 60%)",
          accent: "hsl(190 90% 65%)",
          glow: "hsl(200 90% 75%)",
          shadow: "hsl(210 50% 20%)",
        };
      case "aurora":
        return {
          primary: "hsl(270 75% 60%)",
          accent: "hsl(320 75% 65%)",
          glow: "hsl(300 90% 70%)",
          shadow: "hsl(280 50% 25%)",
        };
      case "dark-night":
        return {
          primary: "hsl(220 60% 50%)",
          accent: "hsl(260 65% 55%)",
          glow: "hsl(240 90% 65%)",
          shadow: "hsl(230 60% 20%)",
        };
      case "claude":
        return {
          primary: "hsl(260 80% 65%)",
          accent: "hsl(280 70% 70%)",
          glow: "hsl(270 80% 75%)",
          shadow: "hsl(260 50% 20%)",
        };
      default:
        return {
          primary: "hsl(200 90% 55%)",
          accent: "hsl(160 90% 60%)",
          glow: "hsl(180 90% 70%)",
          shadow: "hsl(190 50% 20%)",
        };
    }
  }, [theme]);

  const base = "pointer-events-none fixed inset-0 -z-10 overflow-hidden";
  const cx = (s: string) => [base, className, s].filter(Boolean).join(" ");

  if (variant === "neon-stripes")
    return <NeonStripes className={cx("")} color={colorMap} theme={theme} />;
  if (variant === "aurora")
    return <Aurora className={cx("")} color={colorMap} theme={theme} />;
  return <GrainyGradient className={cx("")} color={colorMap} theme={theme} />;
}

function NeonStripes({ className, color, theme }: any) {
  const dark = isDarkTheme(theme);

  // danh sách ảnh, bạn có thể thay bằng ảnh thật trong /public/images
  const images = useMemo(
    () => [
      { src: "/images/social1.png", delay: 0, scale: 1.1 },
      { src: "/images/social2.png", delay: 2, scale: 1.15 },
      { src: "/images/social3.png", delay: 4, scale: 1.05 },
    ],
    []
  );

  return (
    <div className={className}>
      {/* nền */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ background: "var(--bg)" }}
      />

      {/* bong bóng + bụi sáng */}
      <EnhancedBubbles color={color} theme={theme} count={24} />
      <ReactiveParticles color={color.glow} theme={theme} count={150} />

      {/* 3 hình ảnh */}
      <div className="absolute inset-0 overflow-hidden">
        {images.map((img, i) => (
          <motion.img
            key={i}
            src={img.src}
            alt={`social-${i}`}
            className="absolute left-1/2 top-1/2 rounded-3xl shadow-2xl object-cover opacity-70 select-none"
            style={{
              width: "60vw",
              maxWidth: "900px",
              height: "auto",
              transform: "translate(-50%, -50%)",
              filter: dark
                ? "brightness(0.9) contrast(1.1) blur(2px)"
                : "brightness(1.2) contrast(0.9) blur(3px)",
            }}
            animate={{
              y: [0, 10, 0, -10, 0],
              scale: [1, img.scale, 1],
              rotate: [0, 1, -1, 0],
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: img.delay,
            }}
          />
        ))}
      </div>

      {/* ánh sáng trung tâm + noise */}
      <GlowLayer color={color.glow} />
      <NoiseOverlay />
    </div>
  );
}

function Aurora({ className, color }: any) {
  return (
    <div className={className}>
      <motion.div
        className="absolute -inset-20 blur-3xl opacity-70"
        style={{
          background: `
            radial-gradient(50% 50% at 20% 30%, ${color.primary}/.6, transparent 70%),
            radial-gradient(40% 50% at 80% 20%, ${color.accent}/.6, transparent 70%),
            radial-gradient(60% 60% at 80% 80%, ${color.glow}/.5, transparent 70%)
          `,
        }}
        animate={{ scale: [1, 1.05, 1], rotate: [0, 3, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <EnhancedBubbles color={color} count={18} region="edges" opacity={0.4} />
      <ReactiveParticles color={color.glow} count={120} />
      <GlowLayer color={color.glow} />
      <NoiseOverlay />
    </div>
  );
}

function GrainyGradient({ className, color }: any) {
  return (
    <div className={className}>
      <motion.div
        className="absolute -inset-[20%] blur-3xl"
        style={{
          background: `
            radial-gradient(40% 40% at 30% 30%, ${color.primary}/.5, transparent 70%),
            radial-gradient(40% 40% at 70% 70%, ${color.accent}/.5, transparent 70%)
          `,
        }}
        animate={{ x: [0, -15, 10, 0], y: [0, 10, -10, 0], rotate: [0, -3, 2, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <EnhancedBubbles color={color} count={20} />
      <ReactiveParticles color={color.glow} count={100} />
      <GlowLayer color={color.glow} />
      <NoiseOverlay strong />
    </div>
  );
}

function EnhancedBubbles({ color, theme, count = 18, opacity = 0.5 }: any) {
  const dark = isDarkTheme(theme);
  const anchors = useMemo(() => Array.from({ length: count }), [count]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {anchors.map((_, i) => {
        const size = 80 + Math.random() * 220;
        const x = `${Math.random() * 100}%`;
        const y = `${Math.random() * 100}%`;
        const drift = 10 + Math.random() * 6;
        const orbit = 8 + Math.random() * 6;
        const delay = Math.random() * 2;

        // 🔹 Màu bubble tuỳ theme
        const bubbleColor = dark ? color.glow : "rgba(0,0,0,0.15)";
        const shadowColor = dark ? color.glow : "rgba(0,0,0,0.2)";

        return (
          <motion.div
            key={i}
            className="absolute rounded-full backdrop-blur-2xl border border-white/10"
            style={{
              left: x,
              top: y,
              width: size,
              height: size,
              translate: "-50% -50%",
              background: `radial-gradient(circle at 35% 30%, ${bubbleColor}, transparent 70%)`,
              opacity: dark ? opacity : 0.35,
              filter: `drop-shadow(0 0 15px ${shadowColor})`,
            }}
            animate={{
              y: [0, drift, 0, -drift, 0],
              x: [0, orbit, 0, -orbit, 0],
              rotate: [0, orbit * 2, 0],
              scale: [0.96, 1.02, 0.97, 1],
            }}
            transition={{
              duration: 8 + (i % 5),
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
          />
        );
      })}
    </div>
  );
}

function ReactiveParticles({ color, theme, count = 100 }: any) {
  const dark = isDarkTheme(theme);
  const arr = useMemo(() => Array.from({ length: count }), [count]);

  return (
    <div className="absolute inset-0">
      {arr.map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 2.5 + 1,
            height: Math.random() * 2.5 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: dark ? color : "rgba(0,0,0,0.2)",
            opacity: dark ? 0.15 + Math.random() * 0.25 : 0.08,
            filter: `blur(${dark ? 1 : 0.4}px)`,
          }}
          animate={{
            y: [0, -8, 0],
            x: [0, i % 2 ? 6 : -6, 0],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 6 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}

function GlowLayer({ color }: any) {
  return (
    <div
      className="absolute inset-0 mix-blend-overlay opacity-20"
      style={{
        background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 70%)`,
      }}
    />
  );
}

function NoiseOverlay({ strong = false }: { strong?: boolean }) {
  const data =
    "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"140\" height=\"140\" viewBox=\"0 0 140 140\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"2\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.25\"/></svg>')";
  return (
    <div
      className="absolute inset-0 mix-blend-overlay"
      style={{
        backgroundImage: data,
        backgroundSize: "240px 240px",
        opacity: strong ? 0.18 : 0.08,
      }}
    />
  );
}