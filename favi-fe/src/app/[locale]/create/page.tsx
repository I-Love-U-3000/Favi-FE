"use client";

import { useState } from "react";
import InstagramPostDialog from "@/components/PostDialog";
import { Button } from "primereact/button";

export default function CreatePage() {
  const [open, setOpen] = useState(true);
  return (
    <div className="max-w-4xl mx-auto p-6" style={{ color: 'var(--text)' }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Create a post</h1>
        {!open && <Button label="Open composer" onClick={() => setOpen(true)} />}
      </div>
      <InstagramPostDialog visible={open} onHide={() => setOpen(false)} />
    </div>
  );
}

