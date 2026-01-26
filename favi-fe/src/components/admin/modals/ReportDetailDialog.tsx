"use client";

import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { ReportDto } from "@/lib/api/admin";

interface ReportDetailDialogProps {
  visible: boolean;
  onHide: () => void;
  report: ReportDto;
  onResolve: (action: "delete" | "resolve") => void;
  onReject: () => void;
  resolveLoading?: boolean;
  rejectLoading?: boolean;
}

const REASON_COLORS: Record<string, "success" | "info" | "warning" | "danger" | undefined> = {
  spam: "warning",
  harassment: "danger",
  inappropriate: "danger",
  misinformation: "warning",
  other: "info",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  post: "Post",
  user: "User",
  comment: "Comment",
};

export default function ReportDetailDialog({
  visible,
  onHide,
  report,
  onResolve,
  onReject,
  resolveLoading = false,
  rejectLoading = false,
}: ReportDetailDialogProps) {
  const router = useRouter();

  // Early return if report is null to prevent accessing properties on null
  if (!report) {
    return null;
  }

  const footer = (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        label="Reject"
        icon="pi pi-times"
        severity="danger"
        className="p-button-outlined"
        onClick={onReject}
        loading={rejectLoading}
      />
      <Button
        label="Resolve Only"
        icon="pi pi-check"
        severity="success"
        className="p-button-outlined"
        onClick={() => onResolve("resolve")}
        loading={resolveLoading}
      />
      <Button
        label="Resolve & Delete"
        icon="pi pi-trash"
        severity="danger"
        onClick={() => onResolve("delete")}
        loading={resolveLoading}
      />
    </div>
  );

  return (
    <Dialog
      header={`Report #${report.id.slice(0, 8)}`}
      visible={visible}
      onHide={onHide}
      style={{ width: "700px" }}
      footer={footer}
      className="p-fluid"
    >
      <div className="flex flex-col gap-6">
        {/* Report Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Reported By
            </label>
            <div
              className="flex items-center gap-2 mt-1 cursor-pointer hover:opacity-80"
              onClick={() => router.push(`/admin/users/${report.reporter?.id || report.reporterProfileId}`)}
            >
              <Avatar
                image={report.reporter?.avatar}
                icon={!report.reporter?.avatar ? "pi pi-user" : undefined}
                shape="circle"
              />
              <span className="font-medium text-gray-900 dark:text-white">
                @{report.reporter?.username || `ID: ${report.reporterProfileId.substring(0, 8)}...`}
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Reason
            </label>
            <div className="mt-1">
              <Tag
                value={report.reason}
                severity={REASON_COLORS[report.reasonCode || report.reason.toLowerCase().replace(/\s+/g, '_')] || "info"}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Date Reported
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">
              {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Status
            </label>
            <div className="mt-1">
              <Tag
                value={report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                severity={
                  report.status.toLowerCase() === "pending"
                    ? "warning"
                    : report.status.toLowerCase() === "resolved"
                      ? "success"
                      : "danger"
                }
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Target Preview */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
            Reported {TARGET_TYPE_LABELS[report.targetType.toLowerCase()] || report.targetType}
          </label>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {report.targetType.toLowerCase() === "post" && (
              <div className="flex gap-4">
                {report.target?.mediaUrl && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                    <img
                      src={report.target.mediaUrl}
                      alt="Post media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  {report.target?.author && (
                    <div
                      className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80"
                      onClick={() =>
                        report.target?.author?.id && router.push(`/admin/users/${report.target.author.id}`)
                      }
                    >
                      <Avatar
                        image={report.target.author.avatar}
                        icon={!report.target.author.avatar ? "pi pi-user" : undefined}
                        shape="circle"
                      />
                      <span className="font-medium text-sm">
                        @{report.target.author.username}
                      </span>
                    </div>
                  )}
                  <p className="text-gray-900 dark:text-white">
                    {report.target?.caption || `Target ID: ${report.targetId.substring(0, 8)}...`}
                  </p>
                </div>
              </div>
            )}
            {report.targetType.toLowerCase() === "user" && (
              <div className="flex items-center gap-3">
                <Avatar
                  image={report.target?.author?.avatar}
                  icon={!report.target?.author?.avatar ? "pi pi-user" : undefined}
                  shape="circle"
                  size="large"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {report.target?.author?.displayName || `User ID: ${report.targetId.substring(0, 8)}...`}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{report.target?.author?.username || report.targetId.substring(0, 8)}
                  </p>
                </div>
              </div>
            )}
            {report.targetType.toLowerCase() === "comment" && (
              <div>
                {report.target?.author && (
                  <div
                    className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80"
                    onClick={() =>
                      report.target?.author?.id && router.push(`/admin/users/${report.target.author.id}`)
                    }
                  >
                    <Avatar
                      image={report.target.author.avatar}
                      icon={!report.target.author.avatar ? "pi pi-user" : undefined}
                      shape="circle"
                    />
                    <span className="font-medium text-sm">
                      @{report.target.author.username}
                    </span>
                  </div>
                )}
                <p className="text-gray-900 dark:text-white">
                  {report.target?.content || `Comment ID: ${report.targetId.substring(0, 8)}...`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {report.notes && (
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
              Admin Notes
            </label>
            <p className="text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              {report.notes}
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
