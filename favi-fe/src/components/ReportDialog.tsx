"use client";

import { useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useTranslations } from "next-intl";
import reportAPI from "@/lib/api/reportAPI";
import type { ReportTarget } from "@/types";

export default function ReportDialog({
  visible,
  onHide,
  targetType,
  targetId,
  reporterProfileId,
  targetName,
}: {
  visible: boolean;
  onHide: () => void;
  targetType: ReportTarget;
  targetId: string;
  reporterProfileId: string;
  targetName?: string;
}) {
  const t = useTranslations("ReportDialog");
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = useMemo(() => {
    switch (targetType) {
      case 0: // ReportTarget.User
        return [
          { key: "Impersonation", label: t("reasonImpersonation") },
          { key: "Harassment", label: t("reasonHarassment") },
          { key: "Spam", label: t("reasonSpam") },
          { key: "Underage", label: t("reasonUnderage") },
          { key: "Other", label: t("reasonOther") },
        ];
      case 2: // ReportTarget.Comment
        return [
          { key: "Harassment", label: t("reasonHarassment") },
          { key: "Spam", label: t("reasonSpam") },
          { key: "Explicit", label: t("reasonExplicit") },
          { key: "Misinformation", label: t("reasonMisinformation") },
          { key: "Other", label: t("reasonOther") },
        ];
      default: // ReportTarget.Post, Message, Collection
        return [
          { key: "Copyright", label: t("reasonCopyright") },
          { key: "Explicit", label: t("reasonExplicit") },
          { key: "Spam", label: t("reasonSpam") },
          { key: "Violence", label: t("reasonViolence") },
          { key: "Other", label: t("reasonOther") },
        ];
    }
  }, [targetType, t]);

  const reset = () => {
    setReason("");
    setDetails("");
    setError(null);
  };

  const submit = async () => {
    if (!reason) return;

    // Combine reason and details into a single reason string
    const fullReason = details ? `${reason}: ${details}` : reason;

    try {
      setSubmitting(true);
      setError(null);
      await reportAPI.create({
        reporterProfileId,
        targetType,
        targetId,
        reason: fullReason,
      });
      alert(t("submitSuccess"));
      reset();
      onHide();
    } catch (e: any) {
      setError(e?.error || e?.message || t("submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetTypeName = () => {
    switch (targetType) {
      case 0:
        return t("targetUser");
      case 2:
        return t("targetComment");
      case 3:
        return t("targetMessage");
      case 4:
        return t("targetCollection");
      case 1:
      default:
        return t("targetPost");
    }
  };

  return (
    <Dialog
      header={`${t("title")} ${getTargetTypeName()}${targetName ? ` @${targetName}` : ""}`}
      visible={visible}
      onHide={() => {
        reset();
        onHide();
      }}
      style={{ width: "520px", maxWidth: "95vw" }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            label={t("cancel")}
            className="p-button-text"
            onClick={() => {
              reset();
              onHide();
            }}
            disabled={submitting}
          />
          <Button
            label={submitting ? t("submitting") : t("submit")}
            disabled={!reason || submitting}
            onClick={submit}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <div className="text-sm mb-2">{t("selectReason")}</div>
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => (
              <button
                key={r.key}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  reason === r.key
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-transparent border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
                onClick={() => setReason(r.key)}
                disabled={submitting}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm mb-2">{t("additionalDetails")}</div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={5}
            className="w-full p-3 border rounded-lg text-sm"
            style={{
              backgroundColor: "var(--input-bg)",
              color: "var(--text)",
              borderColor: "var(--input-border)",
            }}
            placeholder={t("detailsPlaceholder")}
            disabled={submitting}
          />
        </div>
      </div>
    </Dialog>
  );
}
