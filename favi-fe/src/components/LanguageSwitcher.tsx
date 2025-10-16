"use client";

import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const langs = [
    { label: "English", value: "en" },
    { label: "Tiếng Việt", value: "vi" },
  ];

  const handleChange = (e: { value: string }) => {
    const nextLocale = e.value;
    router.push(`/${nextLocale}${pathname.replace(/^\/(en|vi)/, "")}`);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        icon="pi pi-globe"
        rounded
        text
        className="!text-xl"
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="absolute right-0 mt-2 w-40">
          <Dropdown
            value={locale}
            options={langs}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}