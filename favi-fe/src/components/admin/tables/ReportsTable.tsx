"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Menu } from "primereact/menu";
import { Skeleton } from "primereact/skeleton";
import { ReportDto, useResolveReport, useRejectReport } from "@/hooks/queries/useAdminReports";
import ReportDetailDialog from "@/components/admin/modals/ReportDetailDialog";
import ResolveReportDialog from "@/components/admin/modals/ResolveReportDialog";

interface ReportsTableProps {
  reports?: ReportDto[];
  loading?: boolean;
  totalRecords?: number;
  first?: number;
  onPageChange: (first: number, rows: number) => void;
  selection?: ReportDto[];
  onSelectionChange: (selection: ReportDto[]) => void;
}

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

const TARGET_TYPE_LABELS: Record<string, string> = {
  post: "Post",
  user: "User",
  comment: "Comment",
};

export default function ReportsTable({
  reports = [],
  loading = false,
  totalRecords = 0,
  first = 0,
  onPageChange,
  selection = [],
  onSelectionChange,
}: ReportsTableProps) {
  const router = useRouter();
  const menuRef = useRef<Menu>(null);
  const [selectedReport, setSelectedReport] = useState<ReportDto | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveAction, setResolveAction] = useState<"delete" | "resolve">("resolve");

  const resolveReport = useResolveReport();
  const rejectReport = useRejectReport();

  const handleMenuAction = (e: { item: { action: string } }, report: ReportDto) => {
    switch (e.item.action) {
      case "view":
        setSelectedReport(report);
        setShowDetailDialog(true);
        break;
      case "resolve-delete":
        setSelectedReport(report);
        setResolveAction("delete");
        setShowResolveDialog(true);
        break;
      case "resolve-only":
        setSelectedReport(report);
        setResolveAction("resolve");
        setShowResolveDialog(true);
        break;
      case "reject":
        setSelectedReport(report);
        rejectReport.mutate({ reportId: report.id });
        break;
      case "author":
        if (report.target.author) {
          router.push(`/admin/users/${report.target.author.id}`);
        }
        break;
    }
  };

  const getMenuItems = (report: ReportDto) => [
    {
      label: "View Details",
      icon: "pi pi-eye",
      action: "view",
    },
    { separator: true },
    {
      label: "Resolve with Delete",
      icon: "pi pi-check-circle",
      action: "resolve-delete",
      className: "text-green-600",
    },
    {
      label: "Resolve Only",
      icon: "pi pi-check",
      action: "resolve-only",
    },
    {
      label: "Reject Report",
      icon: "pi pi-times",
      action: "reject",
      className: "text-orange-600",
    },
    { separator: true },
    report.target.author && {
      label: "View Author",
      icon: "pi pi-user",
      action: "author",
    },
  ].filter(Boolean);

  const actionsTemplate = (report: ReportDto) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-text p-button-sm p-button-rounded"
          tooltip="View Details"
          onClick={() => {
            setSelectedReport(report);
            setShowDetailDialog(true);
          }}
        />
        <Button
          icon="pi pi-ellipsis-v"
          className="p-button-text p-button-sm p-button-rounded"
          onClick={(e) => {
            setSelectedReport(report);
            menuRef.current?.toggle(e);
          }}
        />
        <Menu
          ref={menuRef}
          model={getMenuItems(report).map((item: any) => ({
            label: item.label,
            icon: item.icon,
            className: item.className,
            command: () => handleMenuAction({ item }, report),
          }))}
          popup
        />
      </div>
    );
  };

  const targetTemplate = (report: ReportDto) => {
    return (
      <div
        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 -m-2 rounded-lg transition"
        onClick={() => {
          setSelectedReport(report);
          setShowDetailDialog(true);
        }}
      >
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {report.targetType === "post" && report.target.mediaUrl ? (
            <img
              src={report.target.mediaUrl}
              alt="Target"
              className="w-full h-full object-cover"
            />
          ) : report.targetType === "post" ? (
            <i className="pi pi-image text-gray-400" />
          ) : report.targetType === "user" ? (
            <i className="pi pi-user text-gray-400" />
          ) : (
            <i className="pi pi-comment text-gray-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-900 dark:text-white truncate">
            {TARGET_TYPE_LABELS[report.targetType]}:{" "}
            {report.target.caption?.substring(0, 50) ||
              report.target.content?.substring(0, 50) ||
              report.target.author?.username ||
              "Unknown"}
          </p>
        </div>
      </div>
    );
  };

  const reporterTemplate = (report: ReportDto) => {
    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
        onClick={() => router.push(`/admin/users/${report.reporter.id}`)}
      >
        <Avatar
          image={report.reporter.avatar}
          icon={!report.reporter.avatar ? "pi pi-user" : undefined}
          shape="circle"
          size="small"
        />
        <span className="text-sm text-gray-900 dark:text-white">
          @{report.reporter.username}
        </span>
      </div>
    );
  };

  const reasonTemplate = (report: ReportDto) => {
    return (
      <Tag
        value={report.reason}
        severity={REASON_COLORS[report.reasonCode] || "info"}
        className="text-xs"
      />
    );
  };

  const statusTemplate = (report: ReportDto) => {
    return (
      <Tag
        value={report.status.charAt(0).toUpperCase() + report.status.slice(1)}
        severity={STATUS_COLORS[report.status] || "info"}
        className="text-xs"
      />
    );
  };

  const dateTemplate = (report: ReportDto) => {
    return (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {new Date(report.createdAt).toLocaleDateString()}
      </span>
    );
  };

  const header = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4">
      <span className="text-sm text-gray-500">
        {loading ? "Loading..." : `${totalRecords} reports found`}
      </span>
    </div>
  );

  const emptyMessage = (
    <div className="text-center py-8">
      <i className="pi pi-flag text-4xl text-gray-300 mb-2" />
      <p className="text-gray-500">No reports found</p>
    </div>
  );

  if (loading) {
    return (
      <div className="card">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 border-b last:border-0 border-gray-100 dark:border-gray-800"
            >
              <Skeleton width="20px" height="20px" />
              <Skeleton width="40px" height="40px" borderRadius="8px" />
              <div className="flex-1">
                <Skeleton width="60%" className="mb-2" />
                <Skeleton width="40%" />
              </div>
              <Skeleton width="60px" />
              <Skeleton width="60px" />
              <Skeleton width="100px" />
              <Skeleton width="50px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <DataTable
          value={reports}
          header={header}
          emptyMessage={emptyMessage}
          selection={selection}
          onSelectionChange={(e) => onSelectionChange(e.value)}
          dataKey="id"
          paginator
          rows={20}
          first={first}
          onPage={(e) => onPageChange(e.first, e.rows)}
          totalRecords={totalRecords}
          className="p-datatable-sm"
          responsiveLayout="scroll"
          rowHover
          sortField="createdAt"
          sortOrder={-1}
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            style={{ width: "3rem" }}
          />
          <Column
            header="Target"
            body={targetTemplate}
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Reporter"
            body={reporterTemplate}
            style={{ width: "150px" }}
          />
          <Column
            header="Reason"
            body={reasonTemplate}
            style={{ width: "120px" }}
          />
          <Column
            header="Status"
            body={statusTemplate}
            style={{ width: "100px" }}
          />
          <Column
            header="Date"
            body={dateTemplate}
            style={{ width: "120px" }}
          />
          <Column
            header="Actions"
            body={actionsTemplate}
            style={{ width: "100px" }}
          />
        </DataTable>
      </div>

      {/* Report Detail Dialog */}
      <ReportDetailDialog
        visible={showDetailDialog}
        onHide={() => {
          setShowDetailDialog(false);
          setSelectedReport(null);
        }}
        report={selectedReport!}
        onResolve={(action) => {
          setShowDetailDialog(false);
          setResolveAction(action);
          setShowResolveDialog(true);
        }}
        onReject={() => {
          setShowDetailDialog(false);
          if (selectedReport) {
            rejectReport.mutate({ reportId: selectedReport.id });
          }
          setSelectedReport(null);
        }}
        resolveLoading={resolveReport.isPending}
        rejectLoading={rejectReport.isPending}
      />

      {/* Resolve Dialog */}
      <ResolveReportDialog
        visible={showResolveDialog}
        onHide={() => {
          setShowResolveDialog(false);
          setSelectedReport(null);
        }}
        reportId={selectedReport?.id || ""}
        action={resolveAction}
        onConfirm={(notes) => {
          if (selectedReport) {
            resolveReport.mutate({
              reportId: selectedReport.id,
              action: resolveAction,
              notes,
            });
          }
          setShowResolveDialog(false);
          setSelectedReport(null);
        }}
        loading={resolveReport.isPending}
      />
    </>
  );
}
