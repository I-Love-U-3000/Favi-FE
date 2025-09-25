"use client";

import Dock from "@/components/Dock";
import InstagramPostDialog from "@/components/PostDialog";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";

export default function Home() {
const [dialogVisible, setDialogVisible] = useState(false);

  return (
    <div>
      <Dock/>
      
      <button
        onClick={() => setDialogVisible(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Tạo bài đăng
      </button>
      <InstagramPostDialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
      />
    </div>    
  );
}



   
