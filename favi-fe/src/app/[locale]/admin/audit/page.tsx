"use client";

import { useState, useRef, useCallback } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { useOverlay } from "@/components/RootProvider";
import AuditLogsTable from "@/components/admin/tables/AuditLogsTable";
import {
  useAdminAudit,
  useActionTypes,
  useAdminList,
  AuditLogsFilter,
} from "@/hooks/queries/useAdminAudit";
import { exportAuditLogs } from "@/lib/api/admin";

export default function AuditPage() {
  const { showToast } = useOverlay();
  const menuRef = useRef<Menu>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedActionType, setSelectedActionType] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<Date[] | null>(null);
  const [first, setFirst] = useState(0);
  const [rows] = useState(20);

  // API queries
  const { data: auditData, isLoading } = useAdminAudit({
    search: search || undefined,
    actionType: selectedActionType || undefined,
    adminId: selectedAdmin || undefined,
    startDate:
      dateRange && dateRange[0]
        ? dateRange[0].toISOString()
        : undefined,
    endDate:
      dateRange && dateRange[1]
        ? dateRange[1].toISOString()
        : undefined,
    skip: first,
    take: rows,
  });

  const { data: actionTypes } = useActionTypes();
  const { data: admins } = useAdminList();

  // Export menu items
  const exportItems = [
    {
      label: "Export CSV",
      icon: "pi pi-file",
      command: () => handleExport("csv"),
    },
    {
      label: "Export JSON",
      icon: "pi pi-code",
      command: () => handleExport("json"),
    },
    {
      label: "Export Excel",
      icon: "pi pi-file-excel",
      command: () => handleExport("xlsx"),
    },
  ];

  const handleExport = async (format: string) => {
    try {
      const params: Record<string, string> = { format };
      if (search) params.search = search;
      if (selectedActionType) params.actionType = selectedActionType;
      if (selectedAdmin) params.adminId = selectedAdmin;
      if (dateRange && dateRange[0]) params.startDate = dateRange[0].toISOString();
      if (dateRange && dateRange[1]) params.endDate = dateRange[1].toISOString();

      const blob = await exportAuditLogs(format, params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast({
        severity: "success",
        summary: "Export Complete",
        detail: `Audit logs exported as ${format.toUpperCase()}`,
      });
    } catch {
      showToast({
        severity: "error",
        summary: "Export Failed",
        detail: "Failed to export audit logs",
      });
    }
  };

  const handlePageChange = useCallback((first: number, rows: number) => {
    setFirst(first);
  }, []);

  const handleFilterByAdmin = useCallback((adminId: string) => {
    setSelectedAdmin(adminId);
    showToast({
      severity: "info",
      summary: "Filter Applied",
      detail: "Filtering by selected admin",
    });
  }, [showToast]);

  const clearFilters = () => {
    setSearch("");
    setSelectedActionType(null);
    setSelectedAdmin(null);
    setDateRange(null);
    setFirst(0);
  };

  const hasFilters =
    search || selectedActionType || selectedAdmin || dateRange;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track all administrative actions and changes made to the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon="pi pi-download"
            label="Export"
            className="p-button-outlined"
            onClick={(e) => menuRef.current?.toggle(e)}
            aria-haspopup
            aria-controls="export-menu"
          />
          <Menu
            ref={menuRef}
            model={exportItems}
            popup
            id="export-menu"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by admin, target, or details..."
              className="w-full pl-10"
            />
          </div>

          {/* Action Type Filter */}
          <Dropdown
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.value)}
            options={actionTypes || []}
            optionLabel="label"
            optionValue="value"
            placeholder="All Actions"
            showClear
            className="w-full md:w-48"
          />

          {/* Admin Filter */}
          <Dropdown
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.value)}
            options={
              admins?.map((admin) => ({
                label: `@${admin.username}`,
                value: admin.id,
                avatar: admin.avatar,
              })) || []
            }
            optionLabel="label"
            optionValue="value"
            placeholder="All Admins"
            showClear
            className="w-full md:w-48"
            itemTemplate={(option) => (
              <div className="flex items-center gap-2">
                <img
                  src={option.avatar || "/placeholder-avatar.png"}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
                <span>{option.label}</span>
              </div>
            )}
          />

          {/* Date Range Filter */}
          <Calendar
            value={dateRange}
            onChange={(e) => setDateRange(e.value as Date[] | null)}
            selectionMode="range"
            placeholder="Select date range"
            showIcon
            className="w-full md:w-64"
            dateFormat="mm/dd/yy"
          />

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              icon="pi pi-filter-slash"
              label="Clear"
              className="p-button-text"
              onClick={clearFilters}
            />
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <AuditLogsTable
        auditLogs={auditData?.data}
        loading={isLoading}
        totalRecords={auditData?.total || 0}
        first={first}
        onPageChange={handlePageChange}
        onFilterByAdmin={handleFilterByAdmin}
      />
    </div>
  );
}
