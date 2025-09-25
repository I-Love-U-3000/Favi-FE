"use client";

import Dock from "@/components/Dock";
import LocationIQAutoComplete from "@/components/LocationIQAutoComplete";
import InstagramPostDialog from "@/components/PostDialog";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";

export default function Home() {
return (
    <div className="flex bg-gray-100 min-h-screen">
    {/* Dock cố định giữa bên trái */}
    <div className="fixed left-4 top-1/2 -translate-y-1/2">
      <Dock />
    </div>

    {/* Content chính */}
    <div>
      
    </div>
  </div>
  );
}



   
