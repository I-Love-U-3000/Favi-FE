"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingFeatureOne() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      // timeline xuất hiện 1 lần
      const tl = gsap.timeline({ paused: true });

      tl.from(".lf-bounding", {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: "power3.out",
      })
        .from(
          ".lf-slogan",
          {
            opacity: 0,
            y: 30,
            duration: 0.9,
            ease: "power2.out",
          },
          "-=0.6"
        )
        .from(
          ".lf-cat",
          {
            opacity: 0,
            y: 80,
            scale: 0.9,
            duration: 1.2,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .from(
          ".lf-blob",
          {
            opacity: 0,
            scale: 0.8,
            duration: 1.2,
            ease: "power2.out",
            stagger: 0.1,
          },
          "-=0.8"
        );

      // Trigger cho animation xuất hiện
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top 70%",
        once: true,
        onEnter: () => tl.play(),
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section min-h-screen flex items-center justify-center bg-[#fee89b]">
      <div
        ref={rootRef}
        className="relative w-full h-full max-w-6xl mx-auto px-4 py-16 flex items-center justify-center"
      >
        <div className="relative mx-auto w-full max-w-5xl aspect-[16/9] bg-[#fee89b]">
          {/* nền vàng fill full khung */}
          <div className="absolute inset-0 bg-[#fee89b] z-0" />

          {/* --- Nội dung chính --- */}
          <div className="relative w-full h-full z-10">
            {/* Bounding headline đỏ (ô vuông đỏ bên trái) */}
            <img
              src="/pages/landing/page2/BoundingHeadline.svg"
              alt=""
              className="lf-bounding absolute -left-[10%] top-[1%] w-[70%] max-w-xl drop-shadow-[0_18px_45px_rgba(0,0,0,0.2)]"
            />

            {/* Bounding headline xanh (ô vuông xanh bên phải) */}
            <img
              src="/pages/landing/page2/BoundingHeadline2.svg"
              alt=""
              className="lf-bounding absolute -right-[1%] top-[9%] w-[72%] max-w-2xl opacity-95 drop-shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
            />

            {/* Cat + UI nằm trên ô xanh */}
            <img
              src="/pages/landing/page2/Cat.svg"
              alt="Mood preview"
              className="lf-cat absolute right-[1%] top-[20%] w-[40%] max-w-xl drop-shadow-[0_22px_55px_rgba(0,0,0,0.35)]"
            />

            {/* Blob2: vàng – góc trên trái */}
            <img
              src="/pages/landing/page2/Blob2.svg"
              alt=""
              className="lf-blob absolute -left-45 -top-20 w-50 md:w-70 opacity-70"
            />

            {/* Blob3: đỏ – bên trái giữa */}
            <img
              src="/pages/landing/page2/Blob3.svg"
              alt=""
              className="lf-blob absolute -left-15 top-[61%] w-10 md:w-16 opacity-70"
            />

            {/* Blob1: tím – góc trên phải */}
            <img
              src="/pages/landing/page2/Blob1.svg"
              alt=""
              className="lf-blob absolute -right-58 -top-15 w-65 md:w-90 opacity-70"
            />

            {/* Blob4: xanh lá – góc dưới phải */}
            <img
              src="/pages/landing/page2/Blob4.svg"
              alt=""
              className="lf-blob absolute -right-60 -bottom-65 w-65 md:w-90 opacity-70"
            />

            {/* Slogan phía dưới – TĂNG SIZE */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-17 flex justify-center">
              <img
                src="/pages/landing/page2/Slogan.svg"
                alt="Friendly and Smoothie"
                className="lf-slogan w-[95%] max-w-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
