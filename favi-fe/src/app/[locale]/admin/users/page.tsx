"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Menu } from "primereact/menu";
import { Skeleton } from "primereact/skeleton";
import { useDebounce } from "@/lib/hooks/useDebounce";
import UsersTable from "@/components/admin/tables/UsersTable";
import { useAdminUsers, useBulkBan, useBulkUnban, useBulkWarn } from "@/hooks/queries/useAdminUsers";
import { UserDto } from "@/lib/api/admin";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { useOverlay } from "@/components/RootProvider";
import BanUserDialog from "@/components/admin/modals/BanUserDialog";
import WarnUserDialog from "@/components/admin/modals/WarnUserDialog";

const ROLE_OPTIONS = [
  { label: "All Roles", value: "" },
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Active", value: "active" },
  { label: "Banned", value: "banned" },
  { label: "Inactive", value: "inactive" },
];

export default function UsersPage() {
  const toast = useOverlay();
  const exportMenuRef = useRef<Menu>(null);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [first, setFirst] = useState(0);
  const [selection, setSelection] = useState<UserDto[]>([]);
  const [showBulkBanDialog, setShowBulkBanDialog] = useState(false);
  const [showBulkWarnDialog, setShowBulkWarnDialog] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const pageSize = 20;
  const page = Math.floor(first / pageSize) + 1;

  const { data, isLoading, refetch } = useAdminUsers({
    search: debouncedSearch,
    role: role || undefined,
    status: status || undefined,
    page,
    pageSize,
  });

  const bulkBan = useBulkBan();
  const bulkUnban = useBulkUnban();
  const bulkWarn = useBulkWarn();

  const handlePageChange = useCallback((first: number, rows: number) => {
    setFirst(first);
  }, []);

  const resetFilters = () => {
    setSearch("");
    setRole("");
    setStatus("");
    setFirst(0);
    setSelection([]);
  };

  const handleBulkBan = (reason?: string) => {
    bulkBan.mutate({
      profileIds: selection.map((u) => u.id),
      reason,
    });
    setSelection([]);
    setShowBulkBanDialog(false);
  };

  const handleBulkUnban = () => {
    confirmDialog({
      message: `Are you sure you want to unban ${selection.length} users?`,
      header: "Confirm Unban",
      icon: "pi pi-question-circle",
      acceptClassName: "p-button-success",
      accept: () => {
        bulkUnban.mutate(selection.map((u) => u.id));
        setSelection([]);
      },
    });
  };

  const handleBulkWarn = (reason?: string) => {
    bulkWarn.mutate({
      profileIds: selection.map((u) => u.id),
      reason,
    });
    setSelection([]);
    setShowBulkWarnDialog(false);
  };

  const handleExport = (format: string) => {
    // TODO: Implement export
    toast.showToast({
      severity: "info",
      summary: "Export",
      detail: `Exporting users as ${format}...`,
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

  return (
    <div className="space-y-4">
      <Toast ref={toast.toastRef} />
      <ConfirmDialog />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Menu model={exportItems} popup ref={exportMenuRef} />
          <Button
            label="Export"
            icon="pi pi-download"
            className="p-button-outlined"
            onClick={(e) => exportMenuRef.current?.toggle(e)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10"
            />
          </div>
          <Dropdown
            value={role}
            onChange={(e) => setRole(e.value)}
            options={ROLE_OPTIONS}
            placeholder="All Roles"
            className="w-full"
          />
          <Dropdown
            value={status}
            onChange={(e) => setStatus(e.value)}
            options={STATUS_OPTIONS}
            placeholder="All Status"
            className="w-full"
          />
          <div className="flex gap-2">
            <Button
              label="Reset"
              icon="pi pi-refresh"
              className="p-button-outlined p-button-secondary"
              onClick={resetFilters}
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selection.length > 0 && (
        <div className="bg-primary/10 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <i className="pi pi-check-circle text-primary" />
            <span className="font-medium text-primary">
              {selection.length} users selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              label="Ban"
              icon="pi pi-ban"
              severity="danger"
              size="small"
              onClick={() => setShowBulkBanDialog(true)}
              loading={bulkBan.isPending}
            />
            <Button
              label="Unban"
              icon="pi pi-check"
              severity="success"
              size="small"
              onClick={handleBulkUnban}
              loading={bulkUnban.isPending}
            />
            <Button
              label="Warn"
              icon="pi pi-exclamation-triangle"
              severity="warning"
              size="small"
              onClick={() => setShowBulkWarnDialog(true)}
              loading={bulkWarn.isPending}
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

      {/* Users Table */}
      <UsersTable
        users={data?.items || []}
        loading={isLoading}
        totalRecords={data?.totalCount || 0}
        first={first}
        onPageChange={handlePageChange}
        selection={selection}
        onSelectionChange={setSelection}
      />

      {/* Bulk Ban Dialog */}
      <BanUserDialog
        visible={showBulkBanDialog}
        onHide={() => setShowBulkBanDialog(false)}
        userId=""
        userName={`${selection.length} users`}
        onBan={handleBulkBan}
        loading={bulkBan.isPending}
      />

      {/* Bulk Warn Dialog */}
      <WarnUserDialog
        visible={showBulkWarnDialog}
        onHide={() => setShowBulkWarnDialog(false)}
        userId=""
        userName={`${selection.length} users`}
        onWarn={handleBulkWarn}
        loading={bulkWarn.isPending}
      />
    </div>
  );
}
