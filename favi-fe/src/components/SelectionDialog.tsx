"use client";

import { Dialog } from "primereact/dialog";
import { classNames } from "primereact/utils";

export type SelectionOption = {
  label: string;
  value: string;
  description?: string;
};

type SelectionDialogProps = {
  visible: boolean;
  title: string;
  options: SelectionOption[];
  value?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export default function SelectionDialog({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: SelectionDialogProps) {
  return (
    <Dialog
      header={title}
      visible={visible}
      onHide={onClose}
      modal
      className="w-[320px] max-w-full"
      contentClassName="p-0"
    >
      <div className="flex flex-col">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              className={classNames(
                "flex items-start gap-3 px-4 py-3 text-left transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              )}
              onClick={() => {
                onSelect(opt.value);
                onClose();
              }}
            >
              <span className="flex-1">
                <span className="block text-sm font-medium">{opt.label}</span>
                {opt.description && (
                  <span className="block text-xs opacity-70">
                    {opt.description}
                  </span>
                )}
              </span>
              {active && (
                <span
                  className="pi pi-check text-primary text-base"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
