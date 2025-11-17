"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingFeatureThree() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });

      tl.from(".lf3-slogan", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
      })
        .from(
          [".lf3-img-top-left", ".lf3-img-bottom-left"],
          {
            opacity: 0,
            x: -40,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.15,
          },
          "-=0.3"
        )
        .from(
          ".lf3-img-top-right",
          {
            opacity: 0,
            x: 40,
            y: -40,
            duration: 0.7,
            ease: "power2.out",
          },
          "-=0.4"
        )
        .from(
          ".lf3-frame",
          {
            opacity: 0,
            scale: 1.15,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.5"
        )
        .from(
          ".lf3-img-bottom-right",
          {
            opacity: 0,
            x: 40,
            y: 40,
            duration: 0.7,
            ease: "power2.out",
          },
          "-=0.4"
        )
        .from(
          ".lf3-blob",
          {
            opacity: 0,
            scale: 0.8,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.1,
          },
          "-=0.7"
        )
        .from(
          ".lf3-cta",
          {
            opacity: 0,
            x: 40,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.1,
          },
          "-=0.4"
        );

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

    const current = document.getElementById("landing-feature-three");
    if (!current) return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>(".section"));
    if (!sections.length) {
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
      return;
    }

    const currentIndex = sections.findIndex((el) => current.contains(el) || el === current);
    const next = currentIndex >= 0 ? sections[currentIndex + 1] : null;

    if (next) {
      next.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  return (
    <section
      id="landing-feature-three"
      className="section w-full min-h-screen flex items-center justify-center bg-[#2fd68b]"
    >
      <div
        ref={rootRef}
        className="relative w-full h-full max-w-6xl mx-auto px-4 py-16 flex items-center justify-center"
      >
        <div className="relative mx-auto h-full w-full max-w-5xl aspect-[16/9]">
          {/* Outer blobs */}
          <img
            src="/pages/landing/page4/BlopUp.svg"
            alt=""
            className="lf3-blob pointer-events-none absolute -top-20 -right-24 w-40 md:w-56 opacity-80 z-0"
          />
          <img
            src="/pages/landing/page4/BlopDown.svg"
            alt=""
            className="lf3-blob pointer-events-none absolute -bottom-20 -left-24 w-44 md:w-60 opacity-80 z-0"
          />

          {/* Inner green container for content */}
          <div className="absolute inset-0 bg-[#03a35b] z-10">
            <div className="relative w-full h-full">
              {/* Slogan on top */}
              <div className="relative flex justify-center top-5">
                <img
                  src="/pages/landing/page4/Slogan.svg"
                  alt="Favi Slogan"
                  className="lf3-slogan w-[85%] max-w-2xl"
                />
              </div>

              {/* Main grid images */}
              <div className="relative w-full h-full mt-6 md:mt-10">
                {/* Top-left */}
                <div className="absolute left-[10%] top-[1%] w-[30%] max-w-sm">
                  <img
                    src="/pages/landing/page4/ImageTopLeft.svg"
                    alt="Top left"
                    className="lf3-img-top-left w-full drop-shadow-[0_18px_35px_rgba(0,0,0,0.18)]"
                  />
                </div>

                {/* Bottom-left */}
                <div className="absolute left-[10%] bottom-[28%] w-[30%] max-w-sm">
                  <img
                    src="/pages/landing/page4/ImageBottomLeft.svg"
                    alt="Bottom left"
                    className="lf3-img-bottom-left w-full drop-shadow-[0_18px_35px_rgba(0,0,0,0.18)]"
                  />
                </div>

                {/* Top-right with frame overlay */}
                <div className="absolute right-[10%] top-[1%] w-[30%] max-w-sm">
                  <div className="relative w-full">
                    <img
                      src="/pages/landing/page4/ImageTopRight.svg"
                      alt="Top right"
                      className="lf3-img-top-right w-full relative z-10 drop-shadow-[0_18px_35px_rgba(0,0,0,0.22)]"
                    />
                    <img
                      src="/pages/landing/page4/ImageTopRightFrame.svg"
                      alt="Top right frame"
                      className="lf3-frame pointer-events-none absolute inset-0 z-20"
                    />
                  </div>
                </div>

                {/* Bottom-right */}
                <div className="absolute right-[10%] bottom-[28%] w-[30%] max-w-sm">
                  <img
                    src="/pages/landing/page4/ImageBottomRight.svg"
                    alt="Bottom right"
                    className="lf3-img-bottom-right w-full drop-shadow-[0_18px_35px_rgba(0,0,0,0.18)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CTA ellipses: Next (top) and Skip (bottom) on the right edge */}
          <div className="absolute -right-14 top-80 -translate-y-1/2 z-30 flex flex-col items-center gap-4">
            <button
              type="button"
              className="lf3-cta relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center focus:outline-none"
              onClick={scrollToNextSection}
            >
              <img
                src="/pages/landing/page4/Ellipse1.svg"
                alt="Next"
                className="w-full h-full"
              />
              <img
                src="/pages/landing/page4/NextButton.svg"
                alt="Next label"
                className="absolute w-1/2 h-1/2 object-contain"
              />
            </button>

            <button
              type="button"
              className="lf3-cta relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center focus:outline-none"
              onClick={scrollToNextSection}
            >
              <img
                src="/pages/landing/page4/Ellipse2.svg"
                alt="Skip"
                className="w-full h-full"
              />
              <img
                src="/pages/landing/page4/SkipButton.svg"
                alt="Skip label"
                className="absolute w-1/2 h-1/2 object-contain"
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
