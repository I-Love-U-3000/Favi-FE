"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Menu } from "primereact/menu";
import PostsTable from "@/components/admin/tables/PostsTable";
import { useAdminPosts, useBulkDeletePosts } from "@/hooks/queries/useAdminPosts";
import { PostDto } from "@/lib/api/admin";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { useOverlay } from "@/components/RootProvider";
import { useDebounce } from "@/lib/hooks/useDebounce";

const PRIVACY_OPTIONS = [
  { label: "All Privacy", value: "" },
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
  { label: "Followers", value: "followers" },
];

export default function PostsPage() {
  const toast = useOverlay();
  const exportMenuRef = useRef<Menu>(null);

  const [search, setSearch] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [first, setFirst] = useState(0);
  const [selection, setSelection] = useState<PostDto[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useAdminPosts({
    search: debouncedSearch,
    privacy: privacy || undefined,
    skip: first,
    take: 20,
  });

  const bulkDelete = useBulkDeletePosts();

  const handlePageChange = useCallback((first: number, rows: number) => {
    setFirst(first);
  }, []);

  const resetFilters = () => {
    setSearch("");
    setPrivacy("");
    setFirst(0);
    setSelection([]);
  };

  const handleBulkDelete = () => {
    confirmDialog({
      message: `Are you sure you want to delete ${selection.length} posts? This action cannot be undone.`,
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => {
        bulkDelete.mutate({
          postIds: selection.map((p) => p.id),
        });
        setSelection([]);
      },
    });
  };

  const handleExport = (format: string) => {
    toast.showToast({
      severity: "info",
      summary: "Export",
      detail: `Exporting posts as ${format}...`,
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Posts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and moderate user posts
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
              placeholder="Search posts..."
              className="w-full pl-10"
            />
          </div>
          <Dropdown
            value={privacy}
            onChange={(e) => setPrivacy(e.value)}
            options={PRIVACY_OPTIONS}
            placeholder="All Privacy"
            className="w-full"
          />
          <Calendar
            placeholder="Select date range"
            selectionMode="range"
            showIcon
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
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <i className="pi pi-check-circle text-red-500" />
            <span className="font-medium text-red-700 dark:text-red-300">
              {selection.length} posts selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              label="Delete"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              onClick={handleBulkDelete}
              loading={bulkDelete.isPending}
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

      {/* Posts Table */}
      <PostsTable
        posts={data?.items || []}
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
