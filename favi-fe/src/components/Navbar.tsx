"use client";

import Link from "next/link";
import { Bayon, PT_Mono } from "next/font/google";

const bayon = Bayon({ weight: "400", subsets: ["latin"] });
const ptMono = PT_Mono({ weight: "400", subsets: ["latin"] });

export default function Navbar() {
  const menuItems = ["About us", "Our gallery", "Login", "Register"];

  return (
    <nav className="flex items-center justify-between pt-4 px-8 bg-[#FEF7F7] border-b border-gray-200 z-20 navbar">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src="/favi-logo.png" alt="logo" className="w-10 h-10" />
        <span className={`${bayon.className} text-[47px] text-red-600`}>FAVI</span>
      </div>

      {/* Menu */}
      <div className="flex justify-center flex-grow">
        <div className={`flex gap-12 ${ptMono.className}`}>
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              href="#"
              className="
                relative
                pb-2
                transition-all
                duration-300
                hover:text-red-500
                group
              "
            >
              {item}
              {/* Underline */}
              <span
                className="
                  absolute left-0 bottom-0 h-[2px] w-0
                  bg-red-500 transition-all duration-300
                  group-hover:w-full
                "
              ></span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}