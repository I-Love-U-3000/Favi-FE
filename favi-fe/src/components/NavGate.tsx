"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavGate() {
  const pathname = usePathname() || "";
  const segments = pathname.split("?")[0].split("/").filter(Boolean);
  const hideAuth = /\/(login|register)(\/|$)/i.test(pathname);
  const hideLanding = segments.length === 1;
  if (hideAuth || hideLanding) return null;
  return <Navbar />;
}

