"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Skeleton } from "primereact/skeleton";
import { AuditLogDto } from "@/lib/api/admin";

interface AuditLogsTableProps {
  auditLogs?: AuditLogDto[];
  loading?: boolean;
  totalRecords?: number;
  first?: number;
  onPageChange: (first: number, rows: number) => void;
  onFilterByAdmin?: (adminId: string) => void;
}

// Action type colors mapping
const ACTION_COLORS: Record<string, "success" | "info" | "warning" | "danger" | undefined> = {
  ban_user: "danger",
  unban_user: "success",
  warn_user: "warning",
  delete_content: "danger",
  resolve_report: "success",
  reject_report: "warning",
  export_data: "info",
};

const ACTION_LABELS: Record<string, string> = {
  ban_user: "Ban User",
  unban_user: "Unban User",
  warn_user: "Warn User",
  delete_content: "Delete Content",
  resolve_report: "Resolve Report",
  reject_report: "Reject Report",
  export_data: "Export Data",
};

const ACTION_ICONS: Record<string, string> = {
  ban_user: "pi-ban",
  unban_user: "pi-check",
  warn_user: "pi-exclamation-triangle",
  delete_content: "pi-trash",
  resolve_report: "pi-check-circle",
  reject_report: "pi-times-circle",
  export_data: "pi-download",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  post: "Post",
  user: "User",
  comment: "Comment",
  report: "Report",
};

export default function AuditLogsTable({
  auditLogs = [],
  loading = false,
  totalRecords = 0,
  first = 0,
  onPageChange,
  onFilterByAdmin,
}: AuditLogsTableProps) {
  const router = useRouter();

  const timestampTemplate = (log: AuditLogDto) => {
    const date = new Date(log.createdAt);
    return (
      <div className="text-sm">
        <p className="text-gray-900 dark:text-white">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p className="text-gray-500 text-xs">
          {date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    );
  };

  const adminTemplate = (log: AuditLogDto) => {
    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
        onClick={() => onFilterByAdmin?.(log.admin.id)}
        title="Click to filter by this admin"
      >
        <Avatar
          image={log.admin.avatar}
          icon={!log.admin.avatar ? "pi pi-user" : undefined}
          shape="circle"
          size="normal"
        />
        <div>
          <p className="text-sm text-gray-900 dark:text-white">@{log.admin.username}</p>
          <p className="text-xs text-gray-500">{log.admin.displayName}</p>
        </div>
      </div>
    );
  };

  const actionTemplate = (log: AuditLogDto) => {
    const severity = ACTION_COLORS[log.actionType] || "info";
    const icon = ACTION_ICONS[log.actionType] || "pi-circle";
    return (
      <Tag
        value={ACTION_LABELS[log.actionType] || log.action}
        severity={severity}
        icon={`pi ${icon}`}
        className="text-xs"
      />
    );
  };

  const targetTemplate = (log: AuditLogDto) => {
    const targetLabel =
      TARGET_TYPE_LABELS[log.targetType] || log.targetType;
    const targetDisplay =
      log.target?.caption?.substring(0, 30) ||
      log.target?.content?.substring(0, 30) ||
      log.target?.username ||
      log.targetId;

    const handleClick = () => {
      switch (log.targetType) {
        case "user":
          router.push(`/admin/users/${log.targetId}`);
          break;
        case "post":
          router.push(`/admin/posts/${log.targetId}`);
          break;
        case "report":
          router.push(`/admin/reports/${log.targetId}`);
          break;
        case "comment":
          router.push(`/admin/posts/${log.target?.author?.id}`);
          break;
      }
    };

    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
        onClick={handleClick}
        title={`Click to view ${targetLabel.toLowerCase()}`}
      >
        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <i className={`pi ${ACTION_ICONS[log.actionType] || "pi-circle"} text-gray-400`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-900 dark:text-white truncate">{targetLabel}</p>
          <p className="text-xs text-gray-500 truncate">{targetDisplay || log.targetId}</p>
        </div>
      </div>
    );
  };

  const detailsTemplate = (log: AuditLogDto) => {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
        {log.details || "-"}
      </p>
    );
  };

  const header = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4">
      <span className="text-sm text-gray-500">
        {loading ? "Loading..." : `${totalRecords} audit logs found`}
      </span>
    </div>
  );

  const emptyMessage = (
    <div className="text-center py-8">
      <i className="pi pi-list text-4xl text-gray-300 mb-2" />
      <p className="text-gray-500">No audit logs found</p>
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
              <Skeleton width="80px" />
              <Skeleton width="100px" height="40px" />
              <div className="flex-1">
                <Skeleton width="40%" />
              </div>
              <Skeleton width="80px" />
              <Skeleton width="120px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <DataTable
        value={auditLogs}
        header={header}
        emptyMessage={emptyMessage}
        dataKey="id"
        lazy
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
          header="Timestamp"
          body={timestampTemplate}
          style={{ width: "120px" }}
          sortable
          sortField="createdAt"
        />
        <Column
          header="Admin"
          body={adminTemplate}
          style={{ width: "180px" }}
        />
        <Column
          header="Action"
          body={actionTemplate}
          style={{ width: "160px" }}
        />
        <Column
          header="Target"
          body={targetTemplate}
          style={{ width: "200px" }}
        />
        <Column
          header="Details"
          body={detailsTemplate}
          style={{ width: "200px" }}
        />
      </DataTable>
    </div>
  );
}
