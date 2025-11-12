"use client";

import { useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";

type ReportTarget = "post" | "comment" | "user";

export default function ReportDialog({
  visible,
  onHide,
  targetType,
  targetName,
}: {
  visible: boolean;
  onHide: () => void;
  targetType: ReportTarget;
  targetName?: string;
}) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");

  const reasons = useMemo(() => {
    switch (targetType) {
      case "user":
        return [
          "Impersonation",
          "Harassment or hate",
          "Spam or scam",
          "Underage account",
          "Other",
        ];
      case "comment":
        return [
          "Harassment or hate",
          "Spam",
          "Explicit content",
          "Misinformation",
          "Other",
        ];
      default:
        return [
          "Copyright infringement",
          "Explicit content",
          "Spam or scam",
          "Violence or gore",
          "Other",
        ];
    }
  }, [targetType]);

  const reset = () => {
    setReason("");
    setDetails("");
  };

  const submit = () => {
    // Mock submit only
    console.log("Report submitted", { targetType, targetName, reason, details });
    reset();
    onHide();
    alert("Thanks for your report. Our team will review it.");
  };

  return (
    <Dialog
      header={`Report ${targetType}${targetName ? ` @${targetName}` : ""}`}
      visible={visible}
      onHide={() => {
        reset();
        onHide();
      }}
      style={{ width: "520px", maxWidth: "95vw" }}
      footer={
        <div className="flex justify-end gap-2">
          <Button label="Cancel" className="p-button-text" onClick={() => { reset(); onHide(); }} />
          <Button label="Submit" disabled={!reason} onClick={submit} />
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-sm mb-2">Select a reason</div>
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => (
              <button
                key={r}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  reason === r
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-transparent border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm mb-2">Additional details (optional)</div>
          <InputTextarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={5}
            className="w-full"
            placeholder="Add context, links, timestamps…"
          />
        </div>
      </div>
    </Dialog>
  );
}

