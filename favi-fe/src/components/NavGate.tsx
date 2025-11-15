"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavGate() {
  const pathname = usePathname() || "";
  const hide = /\/(login|register)(\/|$)/i.test(pathname);
  if (hide) return null;
  return <Navbar />;
}

