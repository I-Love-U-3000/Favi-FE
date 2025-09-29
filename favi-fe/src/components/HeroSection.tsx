"use client";

import { ArrowRight } from "lucide-react";
import { Hepta_Slab } from "next/font/google";
import { Button } from "primereact/button";
import { useEffect } from "react";
import { gsap } from "gsap";

const heptaSlab = Hepta_Slab({ weight: "400", subsets: ["latin"] });

export default function HeroSection() {
  useEffect(() => {
    gsap.from(".hero-bg", { opacity: 0, scale: 0.8, duration: 1.5, ease: "power2.out" });
    gsap.from(".hero-img", { opacity: 0, y: 100, duration: 1.2, delay: 0.5, ease: "power2.out" });
    gsap.from(".hero-btn", { opacity: 0, y: 50, duration: 1, delay: 1, ease: "power2.out" });
  }, []);

  return (
    <section className="flex flex-col justify-center bg-[#FEF7F7] relative min-h-screen hero-section">
      {/* Wrapper for background and image with fixed aspect ratio */}
      <div
        className="absolute inset-0 bg-[url('/QuaDuRoi.svg')] bg-no-repeat bg-center items-center hero-bg"
        style={{
          backgroundSize: "contain",
          backgroundPosition: "center",
          minHeight: "100%",
          minWidth: "100%",
          scale: 0.85,
          transform: "translateY(-10%)"
        }}
      />
      {/* Image Element with Custom Scaling */}
      <img
        src="/GroupFN.svg"
        alt="Moods"
        className="hero-img"
        style={{ scale: 0.7, transform: "translateY(10%) translateX(2%)" }}
      />
      {/* CTA Button */}
      <button
        style={{ marginTop: "150px" }}
        className={`text-center w-200 h-12 self-center border-4 border-black bg-[#F24E1E] hover:bg-[#d13f0f] z-20 ${heptaSlab.className} text-white text-[30px] hero-btn`}
      >
        Which is your mood today? Explore now!
      </button>
    </section>
  );
}