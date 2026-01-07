"use client";

import HeroSection from "@/components/HeroSection";
import LandingFeatureOne from "@/components/LandingFeatureOne";
import LandingFeatureTwo from "@/components/LandingFeatureTwo";
import LandingFeatureThree from "@/components/LandingFeatureThree";
import LandingFeatureFour from "@/components/LandingFeatureFour";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Home() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const animateIn = (section: HTMLElement, index: number) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          delay: index * 0.2,
        }
      );
    };

    // Section animations on scroll
    (gsap.utils.toArray(".section") as HTMLElement[]).forEach((section, index) => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 80%", // Animation starts when top of section is 80% from top of viewport
        onEnter: () => animateIn(section, index),
        once: true, // chỉ animate lần đầu
      });
    });
  }, []);

  return (
    <main>
      <HeroSection />
      <LandingFeatureOne />
      <LandingFeatureTwo/>
      <LandingFeatureThree />
      <LandingFeatureFour />
    </main>
  );
}
