"use client";

import { use, useState } from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "next/navigation";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { InputTextarea } from "primereact/inputtextarea";
import { Skeleton } from "primereact/skeleton";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import {
  useReport,
  useResolveReport,
  useRejectReport,
} from "@/hooks/queries/useAdminReports";
import { ReportDto } from "@/lib/api/admin";
import { useOverlay } from "@/components/RootProvider";

const REASON_COLORS: Record<string, "success" | "info" | "warning" | "danger" | undefined> = {
  spam: "warning",
  harassment: "danger",
  inappropriate: "danger",
  misinformation: "warning",
  other: "info",
};

const STATUS_COLORS: Record<string, "success" | "info" | "warning" | "danger" | undefined> = {
  pending: "warning",
  resolved: "success",
  rejected: "danger",
};

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;
  const router = useRouter();
  const toast = useOverlay();

  const [notes, setNotes] = useState("");

  const { data: report, isLoading: reportLoading } = useReport(reportId);

  const resolveReport = useResolveReport();
  const rejectReport = useRejectReport();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    return formatDate(date);
  };

  const handleResolveWithDelete = () => {
    confirmDialog({
      message: "Are you sure you want to resolve this report and delete the associated content?",
      header: "Confirm Resolve & Delete",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => {
        resolveReport.mutate({ reportId, action: "delete", notes });
      },
    });
  };

  const handleResolveOnly = () => {
    confirmDialog({
      message: "Are you sure you want to resolve this report without deleting the content?",
      header: "Confirm Resolve",
      icon: "pi pi-question-circle",
      accept: () => {
        resolveReport.mutate({ reportId, action: "resolve", notes });
      },
    });
  };

  const handleReject = () => {
    confirmDialog({
      message: "Are you sure you want to reject this report?",
      header: "Confirm Reject",
      icon: "pi pi-times-circle",
      acceptClassName: "p-button-danger",
      accept: () => {
        rejectReport.mutate({ reportId, reason: notes });
      },
    });
  };

  const handleViewAuthor = () => {
    if (report?.target.author?.id) {
      router.push(`/admin/users/${report.target.author.id}`);
    }
  };

  // Render target preview based on target type
  const renderTargetPreview = () => {
    if (!report) return null;

    switch (report.targetType) {
      case "post":
        return (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {report.target.author && (
              <div
                className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-80"
                onClick={handleViewAuthor}
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
            {report.target.mediaUrl && (
              <div className="mb-3 rounded-lg overflow-hidden">
                <img
                  src={report.target.mediaUrl}
                  alt="Post media"
                  className="w-full max-h-64 object-cover"
                />
              </div>
            )}
            <p className="text-gray-900 dark:text-white">
              {report.target.caption || "No caption"}
            </p>
          </div>
        );

      case "user":
        return (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {report.target.author && (
              <div className="flex items-center gap-3">
                <Avatar
                  image={report.target.author.avatar}
                  icon={!report.target.author.avatar ? "pi pi-user" : undefined}
                  shape="circle"
                  size="xlarge"
                  className="w-16 h-16"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {report.target.author.displayName || "Unknown User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{report.target.author.username}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case "comment":
        return (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {report.target.author && (
              <div
                className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80"
                onClick={handleViewAuthor}
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
              {report.target.content}
            </p>
          </div>
        );

      default:
        return (
          <div className="text-gray-500 text-center py-4">
            <i className="pi pi-question-circle text-4xl mb-2" />
            <p>Unknown target type</p>
          </div>
        );
    }
  };



  // Loading state
  if (reportLoading) {
    return (
      <div className="space-y-6">
        <Skeleton width="150px" height="2rem" className="mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Skeleton width="100%" height="300px" />
          </Card>
          <Card>
            <Skeleton width="100%" height="300px" />
          </Card>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <i className="pi pi-flag text-6xl text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Report not found
        </h2>
        <p className="text-gray-500 mb-4">The report you're looking for doesn't exist.</p>
        <Link href="/admin/reports">
          <Button label="Back to Reports" icon="pi pi-arrow-left" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast ref={toast.toastRef} />
      <ConfirmDialog />

      {/* Back Button */}
      <Link
        href="/admin/reports"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition"
      >
        <i className="pi pi-arrow-left" />
        <span>Back to Reports</span>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Report #{report.id.slice(0, 8)}
          </h1>
          <Tag
            value={report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            severity={STATUS_COLORS[report.status] || "info"}
            className="mt-1"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Report Info */}
        <div className="space-y-6">
          {/* Report Info Card */}
          <Card className="shadow-sm border border-gray-100 dark:border-gray-800" title="Report Information">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Reason</p>
                  <Tag
                    value={report.reason}
                    severity={REASON_COLORS[report.reasonCode] || "info"}
                    className="mt-1"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {formatDate(report.createdAt)}
                  </p>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Reporter Info */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Reported By
                </p>
                <div
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 p-2 -m-2 rounded-lg transition"
                  onClick={() => router.push(`/admin/users/${report.reporter.id}`)}
                >
                  <Avatar
                    image={report.reporter.avatar}
                    icon={!report.reporter.avatar ? "pi pi-user" : undefined}
                    shape="circle"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      @{report.reporter.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(report.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Type */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Target Type
                </p>
                <Tag
                  value={report.targetType.charAt(0).toUpperCase() + report.targetType.slice(1)}
                  severity="info"
                />
              </div>
            </div>
          </Card>

          {/* Notes Card */}
          <Card className="shadow-sm border border-gray-100 dark:border-gray-800" title="Admin Notes">
            <InputTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this report resolution..."
              rows={4}
              className="w-full"
            />
          </Card>
        </div>

        {/* Right Column - Target Preview */}
        <div className="space-y-6">
          {/* Target Preview Card */}
          <Card className="shadow-sm border border-gray-100 dark:border-gray-800" title="Target Preview">
            {renderTargetPreview()}
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-sm border border-gray-100 dark:border-gray-800" title="Actions">
            <div className="space-y-3">
              <Button
                label="Resolve with Delete"
                icon="pi pi-trash"
                severity="danger"
                className="w-full"
                onClick={handleResolveWithDelete}
                loading={resolveReport.isPending}
              />
              <Button
                label="Resolve Only"
                icon="pi pi-check"
                severity="success"
                className="w-full"
                onClick={handleResolveOnly}
                loading={resolveReport.isPending}
              />
              <Button
                label="Reject Report"
                icon="pi pi-times"
                severity="secondary"
                className="w-full"
                onClick={handleReject}
                loading={rejectReport.isPending}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Report History Timeline */}
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800" title="Report History">
        <div className="text-center py-8 text-gray-500">
          <i className="pi pi-history text-4xl mb-2 opacity-50" />
          <p>No history available</p>
        </div>
      </Card>
    </div>
  );
}
