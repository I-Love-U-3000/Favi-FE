"use client";

import { Button } from "primereact/button";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import SelectionDialog from "@/components/SelectionDialog";

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Common");

  const langs = [
    { label: "English", value: "en" },
    { label: "Tiếng Việt", value: "vi" },
  ];

  const handleSelect = (value: string) => {
    const nextLocale = value;
    router.push(`/${nextLocale}${pathname.replace(/^\/(en|vi)/, "")}`);
  };

  return (
    <>
      <Button
        icon="pi pi-globe"
        type="button"
        rounded
        text
        className="!text-xl"
        aria-label={t("ChangeLanguage")}
        onClick={() => setOpen(true)}
      />
      <SelectionDialog
        visible={open}
        title={t("ChooseLanguage")}
        options={langs}
        value={locale}
        onSelect={handleSelect}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
