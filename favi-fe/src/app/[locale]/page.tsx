"use client";

import HeroSection from "@/components/HeroSection";
import LandingFeatureOne from "@/components/LandingFeatureOne";
import LandingFeatureTwo from "@/components/LandingFeatureTwo";
import LandingFeatureThree from "@/components/LandingFeatureThree";
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
      <section className="section bg-[#FEF7F7] min-h-screen flex items-center justify-center">
        <h1 className="text-4xl font-bold">Gallery</h1>
      </section>
      <section className="section bg-gray-200 min-h-screen flex items-center justify-center">
        <h1 className="text-4xl font-bold">Contact</h1>
      </section>
      <section className="relative w-full min-h-screen bg-[#FCEFD4]">
      {/* Grid 2 cột chính */}
      <div className="grid grid-cols-2 gap-6 p-8">
        {/* Left block */}
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Mockup feed card */}
          <div className="w-[280px] h-[400px] bg-white rounded-xl shadow-md flex flex-col justify-between p-4">
            <div className="w-full h-40 bg-black rounded-md" />
            <div className="space-y-2">
              <div className="w-full h-6 bg-gray-200 rounded-md" />
              <div className="w-full h-6 bg-gray-200 rounded-md" />
              <div className="w-2/3 h-6 bg-gray-200 rounded-md" />
            </div>
          </div>

          {/* Green text box */}
          <div className="bg-green-400 text-white p-4 rounded-md w-[220px] text-center">
            Friendly, effortless, and always there for every moment that
            matters.
          </div>
        </div>

        {/* Right block */}
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Mockup image post */}
          <div className="w-[320px] h-[400px] bg-white rounded-xl shadow-md flex flex-col">
            <div className="w-full h-56 bg-gray-300 rounded-t-xl" />
            <div className="flex-1 p-4 space-y-2">
              <div className="w-full h-4 bg-gray-200 rounded-md" />
              <div className="w-2/3 h-4 bg-gray-200 rounded-md" />
              <div className="w-full h-4 bg-gray-200 rounded-md" />
              <div className="w-1/2 h-4 bg-gray-200 rounded-md" />
            </div>
          </div>

          {/* Orange text box */}
          <div className="bg-orange-400 text-white p-4 rounded-md w-[220px] text-center">
            An intuitive interface that lets you post a mood or share a photo in
            seconds.
          </div>
        </div>
      </div>

      {/* Bottom slogan */}
      <div className="w-full text-center py-8 bg-yellow-300 font-bold text-3xl rounded-t-md">
        Friendly and Smoothie
      </div>

      {/* Decorative shapes placeholders */}
      <div className="absolute top-10 left-0 w-32 h-20 bg-red-300 rounded-full opacity-70" />
      <div className="absolute top-0 right-10 w-40 h-24 bg-blue-300 rounded-full opacity-70" />
      <div className="absolute bottom-0 left-1/4 w-40 h-24 bg-green-300 rounded-full opacity-70" />
    </section>
    <section className="p-6 bg-rose-200">
      <div className="grid grid-cols-3 gap-4">
        {/* Hàng 1 */}
        <div className="bg-yellow-200 p-6 rounded-xl shadow-md col-span-2">
          <h2 className="font-bold text-xl mb-4">Favi Check list</h2>
          <ul className="space-y-2">
            <li>✅ A huge online image gallery</li>
            <li>✅ Colorful and wonderful social media</li>
            <li>✅ All-in-One Creative Hub</li>
            <li>✅ Powerful AI driven features</li>
          </ul>
        </div>

        <div className="bg-blue-200 p-6 rounded-xl shadow-md">
          <h2 className="font-bold text-lg mb-2">Favi Vault: Endless Visual Inspiration</h2>
          <p className="text-sm">
            Dive into millions of high-quality, exclusive images. Our smart tagging ensures precise discovery. Enjoy unlimited storage and curate custom collections.
          </p>
        </div>

        {/* Hàng 2 */}
        <div className="col-span-3 bg-green-200 p-4 text-center font-bold text-lg rounded-xl">
          Discover what makes Favi unique
        </div>

        {/* Hàng 3 */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-bold">Your Complete Creative Hub</h3>
          <p className="text-sm mt-2">
            Stop switching between apps. Favi seamlessly integrates a massive image library...
          </p>
        </div>

        <div className="bg-purple-300 p-6 rounded-xl shadow-md">
          <h3 className="font-bold">Unleash AI-Powered Creativity</h3>
          <p className="text-sm mt-2">
            Favi's AI isn't just smart – it's your creative partner...
          </p>
        </div>

        <div className="bg-green-300 p-6 rounded-xl shadow-md">
          <h3 className="font-bold">Connect, Create & Dazzle</h3>
          <p className="text-sm mt-2">
            Share your masterpieces within a vibrant, supportive community...
          </p>
        </div>
      </div>
    </section>
    </main>
  );
}
