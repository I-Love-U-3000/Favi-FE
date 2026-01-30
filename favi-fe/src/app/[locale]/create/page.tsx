"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import InstagramPostDialog from "@/components/PostDialog";
import { Button } from "primereact/button";

export default function CreatePage() {
  const t = useTranslations("CreatePage");
  const [open, setOpen] = useState(true);
  return (
    <div className="max-w-4xl mx-auto p-6" style={{ color: 'var(--text)' }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{t("Title")}</h1>
        {!open && <Button label={t("OpenComposer")} onClick={() => setOpen(true)} />}
      </div>
      <InstagramPostDialog visible={open} onHide={() => setOpen(false)} />
    </div>
  );
}
