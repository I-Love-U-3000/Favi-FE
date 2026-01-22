"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Menu } from "primereact/menu";
import ReportsTable from "@/components/admin/tables/ReportsTable";
import {
  useAdminReports,
  useBulkResolveReports,
  useBulkRejectReports,
} from "@/hooks/queries/useAdminReports";
import { ReportDto } from "@/lib/api/admin";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { useOverlay } from "@/components/RootProvider";
import { useDebounce } from "@/lib/hooks/useDebounce";

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Resolved", value: "resolved" },
  { label: "Rejected", value: "rejected" },
];

const TARGET_TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Post", value: "post" },
  { label: "User", value: "user" },
  { label: "Comment", value: "comment" },
];

const REASON_OPTIONS = [
  { label: "All Reasons", value: "" },
  { label: "Spam", value: "spam" },
  { label: "Harassment", value: "harassment" },
  { label: "Inappropriate", value: "inappropriate" },
  { label: "Misinformation", value: "misinformation" },
  { label: "Other", value: "other" },
];

export default function ReportsPage() {
  const toast = useOverlay();
  const actionMenuRef = useRef<Menu>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [targetType, setTargetType] = useState("");
  const [reason, setReason] = useState("");
  const [first, setFirst] = useState(0);
  const [selection, setSelection] = useState<ReportDto[]>([]);

  const debouncedSearch = useDebounce(search, 300);



  const { data, isLoading, refetch } = useAdminReports({
    search: debouncedSearch,
    status: status || undefined,
    targetType: targetType || undefined,
    reason: reason || undefined,
    skip: first,
    take: 20,
  });

  const bulkResolve = useBulkResolveReports();
  const bulkReject = useBulkRejectReports();

  const handlePageChange = useCallback((first: number, rows: number) => {
    setFirst(first);
  }, []);

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setTargetType("");
    setReason("");
    setFirst(0);
    setSelection([]);
  };

  const handleBulkAction = (action: "resolve" | "reject") => {
    const count = selection.length;
    const actionLabel = action === "resolve" ? "resolve" : "reject";

    confirmDialog({
      message: `Are you sure you want to ${actionLabel} ${count} report(s)?`,
      header: `Confirm ${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}`,
      icon: action === "resolve" ? "pi pi-check-circle" : "pi pi-times-circle",
      acceptClassName: action === "resolve" ? "p-button-success" : "p-button-danger",
      accept: () => {
        if (action === "resolve") {
          bulkResolve.mutate({ reportIds: selection.map((r) => r.id), action: "resolve" });
        } else {
          bulkReject.mutate({ reportIds: selection.map((r) => r.id) });
        }
        setSelection([]);
      },
    });
  };

  const handleExport = (format: string) => {
    toast.showToast({
      severity: "info",
      summary: "Export",
      detail: `Exporting reports as ${format}...`,
    });
  };

  const exportItems = [
    {
      label: "Export as CSV",
      icon: "pi pi-file",
      command: () => handleExport("CSV"),
    },
    {
      label: "Export as JSON",
      icon: "pi pi-file",
      command: () => handleExport("JSON"),
    },
    {
      label: "Export as Excel",
      icon: "pi pi-file-excel",
      command: () => handleExport("Excel"),
    },
  ];

  const actionItems = [
    {
      label: "Resolve Selected",
      icon: "pi pi-check",
      command: () => handleBulkAction("resolve"),
    },
    {
      label: "Reject Selected",
      icon: "pi pi-times",
      command: () => handleBulkAction("reject"),
    },
  ];

  return (
    <div className="space-y-4">
      <Toast ref={toast.toastRef} />
      <ConfirmDialog />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and moderate user reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Menu model={exportItems} popup ref={actionMenuRef} />
          <Button
            label="Export"
            icon="pi pi-download"
            className="p-button-outlined"
            onClick={(e) => actionMenuRef.current?.toggle(e)}
          />
        </div>
      </div>


      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-10"
            />
          </div>
          <Dropdown
            value={status}
            onChange={(e) => setStatus(e.value)}
            options={STATUS_OPTIONS}
            placeholder="All Status"
            className="w-full"
          />
          <Dropdown
            value={targetType}
            onChange={(e) => setTargetType(e.value)}
            options={TARGET_TYPE_OPTIONS}
            placeholder="All Types"
            className="w-full"
          />
          <Dropdown
            value={reason}
            onChange={(e) => setReason(e.value)}
            options={REASON_OPTIONS}
            placeholder="All Reasons"
            className="w-full"
          />
          <Button
            label="Reset"
            icon="pi pi-refresh"
            className="p-button-outlined p-button-secondary"
            onClick={resetFilters}
          />
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selection.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <i className="pi pi-check-circle text-blue-500" />
            <span className="font-medium text-blue-700 dark:text-blue-300">
              {selection.length} reports selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              label="Resolve"
              icon="pi pi-check"
              severity="success"
              size="small"
              onClick={() => handleBulkAction("resolve")}
              loading={bulkResolve.isPending}
            />
            <Button
              label="Reject"
              icon="pi pi-times"
              severity="danger"
              size="small"
              onClick={() => handleBulkAction("reject")}
              loading={bulkReject.isPending}
            />
            <Button
              label="Clear"
              icon="pi pi-times"
              className="p-button-text"
              size="small"
              onClick={() => setSelection([])}
            />
          </div>
        </div>
      )}

      {/* Reports Table */}
      <ReportsTable
        reports={data?.items || []}
        loading={isLoading}
        totalRecords={data?.totalCount || 0}
        first={first}
        onPageChange={handlePageChange}
        selection={selection}
        onSelectionChange={setSelection}
      />
    </div>
  );
}
