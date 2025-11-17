"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingFeatureFour() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });

      tl.from(".lf4-slogan-container", {
        opacity: 0,
        y: -40,
        duration: 0.8,
        ease: "power3.out",
      })
        .from(
          ".lf4-img-top-left",
          {
            opacity: 0,
            x: -120,
            y: -120,
            rotation: -12,
            transformOrigin: "0% 0%",
            duration: 1.0,
            ease: "elastic.out(1, 0.8)",
          },
          "-=0.4"
        )
        .from(
          ".lf4-img-right",
          {
            opacity: 0,
            x: 140,
            scale: 1.05,
            duration: 0.9,
            ease: "power3.out",
          },
          "-=0.7"
        )
        .from(
          [".lf4-img-bottom-left", ".lf4-img-bottom-center", ".lf4-img-bottom-right"],
          {
            opacity: 0,
            y: 120,
            duration: 0.9,
            ease: "back.out(1.4)",
            stagger: 0.12,
          },
          "-=0.6"
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

  const handleSloganClick = () => {
    router.push("/login");
  };

  return (
    <section
      id="landing-feature-four"
      className="section w-full min-h-screen flex items-center justify-center bg-[#f7486b]"
    >
      <div
        ref={rootRef}
        className="relative w-full h-full max-w-6xl mx-auto px-4 py-16 flex items-center justify-center"
      >
        <div className="relative mx-auto h-full w-full max-w-5xl aspect-[16/9] bg-[#f7486b]">
          <div className="absolute inset-0 bg-[#f7486b] z-0" />

          <div className="relative w-full h-full z-10 flex flex-col gap-6 md:gap-8 justify-center">
            {/* Top: Favi checklist (yellow) pinned independently so moving it doesn't affect others */}
            <div className="absolute -left-55 -top-12 w-[70%] max-w-md">
              <img
                src="/pages/landing/page5/TopLeftImage.svg"
                alt="Favi checklist"
                className="lf4-img-top-left w-full h-auto drop-shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
              />
            </div>

            {/* Favi Vault (blue) pinned near right edge, slightly above */}
            <div className="absolute -right-55 -top-20 w-[40%] max-w-md">
              <img
                src="/pages/landing/page5/RightLeftImage.svg"
                alt="Favi Vault"
                className="lf4-img-right w-full h-auto drop-shadow-[0_22px_45px_rgba(0,0,0,0.25)]"
              />
            </div>

            {/* Middle row: Discover slogan full width */}
            <div className="flex w-full justify-center">
              <button
                type="button"
                onClick={handleSloganClick}
                className="group flex justify-center focus:outline-none cursor-pointer"
              >
                <div className="lf4-slogan-container relative w-[80%] max-w-2xl mx-auto transition-transform duration-200 ease-out group-hover:scale-105 group-hover:-translate-y-1">
                  <img
                    src="/pages/landing/page5/SloganContainer.svg"
                    alt=""
                    className="w-full h-full object-contain"
                  />
                  <img
                    src="/pages/landing/page5/Slogan.svg"
                    alt="Discover what makes Favi unique"
                    className="lf4-slogan absolute inset-y-0 left-1/2 -translate-x-1/2 w-[90%] h-full object-contain"
                  />
                </div>
              </button>
            </div>

            {/* Bottom row: all three pinned absolutely so có thể kéo tự do bằng bottom/left/right */}
            <div className="relative w-full mt-2">
              {/* Bottom-left pinned near left edge */}
              <div className="absolute -left-55 -bottom-47 w-[56%] max-w-xs">
                <img
                  src="/pages/landing/page5/BottomLeftImage.svg"
                  alt="Your complete creative hub"
                  className="lf4-img-bottom-left w-full h-auto drop-shadow-[0_16px_35px_rgba(0,0,0,0.18)]"
                />
              </div>

              {/* Bottom-center pinned & centered */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-77 w-[64%] max-w-xs">
                <img
                  src="/pages/landing/page5/BottomCenterImage.svg"
                  alt="Unleash AI-powered creativity"
                  className="lf4-img-bottom-center w-full h-auto drop-shadow-[0_18px_40px_rgba(0,0,0,0.2)]"
                />
              </div>

              {/* Bottom-right pinned near right edge */}
              <div className="absolute -right-55 -bottom-77 w-[50%] max-w-xs">
                <img
                  src="/pages/landing/page5/BottomRightImage.svg"
                  alt="Connect, create & dazzle"
                  className="lf4-img-bottom-right w-full h-auto drop-shadow-[0_16px_35px_rgba(0,0,0,0.18)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
