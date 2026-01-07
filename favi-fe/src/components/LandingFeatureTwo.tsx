"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingFeatureTwo() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });

      tl.from(".lf2-slogan-container-1", {
        opacity: 0,
        y: 40,
        duration: 0.7,
        ease: "power3.out",
      })
        .from(
          ".lf2-slogan-container-2",
          {
            opacity: 0,
            y: 40,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.2"
        )
        .from(".lf2-bounding", {
          opacity: 0,
          x: 60,
          duration: 1.0,
          ease: "power3.out",
        });

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top 70%",
        once: true,
        onEnter: () => tl.play(),
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const scrollToNextSection = () => {
    if (typeof window === "undefined") return;

    const current = document.getElementById("landing-feature-two");
    if (!current) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".section")
    );
    if (!sections.length) {
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
      return;
    }

    const currentIndex = sections.findIndex(
      (el) => current.contains(el) || el === current
    );
    const next = currentIndex >= 0 ? sections[currentIndex + 1] : null;

    if (next) {
      next.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  return (
    <section
      id="landing-feature-two"
      className="section min-h-screen flex items-center justify-center bg-[#5FB5CA]"
    >
      <div
        ref={rootRef}
        className="relative w-full h-full max-w-6xl mx-auto px-4 py-16 flex items-center justify-center"
      >
        <div className="relative mx-auto w-full max-w-5xl aspect-[16/9] bg-[#5FB5CA]">
          <div className="absolute inset-0 bg-[#5FB5CA] z-0" />

          <div className="relative w-full h-full z-10 flex items-center">
            {/* Left: two slogans stacked */}
            <div className="relative flex-1 flex flex-col gap-6 items-start justify-center pl-4 md:pl-8">
              <button
                type="button"
                onClick={scrollToNextSection}
                className="lf2-slogan-container-1 group relative focus:outline-none cursor-pointer"
              >
                <img
                  src="/pages/landing/page3/Slogan1Container.svg"
                  alt=""
                  className="max-w-xs md:max-w-sm"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 md:px-6">
                  <img
                    src="/pages/landing/page3/Slogan1.svg"
                    alt="Slogan 1"
                    className="lf2-slogan-1 w-full h-auto object-contain transition-transform duration-200 ease-out group-hover:scale-105 group-hover:-translate-y-1"
                  />
                </div>
              </button>

              <button
                type="button"
                onClick={scrollToNextSection}
                className="lf2-slogan-container-2 group relative -ml-20 md:-ml-40 focus:outline-none cursor-pointer"
              >
                <img
                  src="/pages/landing/page3/Slogan2Container.svg"
                  alt=""
                  className="max-w-xs md:max-w-sm"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 md:px-6">
                  <img
                    src="/pages/landing/page3/Slogan2.svg"
                    alt="Slogan 2"
                    className="lf2-slogan-2 w-full h-auto object-contain transition-transform duration-200 ease-out group-hover:scale-105 group-hover:-translate-y-1"
                  />
                </div>
              </button>
            </div>

            {/* Right: bounding headline */}
            <div className="relative flex-1 flex items-center justify-end pr-4 md:pr-8">
              <img
                src="/pages/landing/page3/BoundingHeadline.svg"
                alt=""
                className="lf2-bounding w-[97%] max-w-xl drop-shadow-[0_18px_45px_rgba(0,0,0,0.2)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
