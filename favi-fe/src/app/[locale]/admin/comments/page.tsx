"use client";

import { useState, useRef, useCallback } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { Tag } from "primereact/tag";
import { useOverlay } from "@/components/RootProvider";
import CommentsTable from "@/components/admin/tables/CommentsTable";
import {
  useAdminComments,
  useCommentStats,
  useBulkDeleteComments,
  CommentsFilter,
  CommentDto,
} from "@/hooks/queries/useAdminComments";
import DeleteContentDialog from "@/components/admin/modals/DeleteContentDialog";
import { useTranslations } from "next-intl";

const STATUS_OPTIONS = [
  { labelKey: "AllStatus", value: "" },
  { labelKey: "Active", value: "active" },
  { labelKey: "Hidden", value: "hidden" },
  { labelKey: "Deleted", value: "deleted" },
];

export default function CommentsPage() {
  const { showToast } = useOverlay();
  const menuRef = useRef<Menu>(null);
  const t = useTranslations("AdminPanel");

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateRange, setDateRange] = useState<Date[] | null>(null);
  const [first, setFirst] = useState(0);
  const [rows] = useState(20);

  // Selection state
  const [selectedComments, setSelectedComments] = useState<CommentDto[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // API queries
  const { data: commentsData, isLoading } = useAdminComments({
    search: search || undefined,
    postId: selectedPost || undefined,
    status: selectedStatus || undefined,
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

  const { data: stats } = useCommentStats();
  const bulkDeleteComments = useBulkDeleteComments();

  // Export menu items
  const exportItems = [
    {
      label: t("ExportCSV"),
      icon: "pi pi-file",
      command: () => handleExport("csv"),
    },
    {
      label: t("ExportJSON"),
      icon: "pi pi-code",
      command: () => handleExport("json"),
    },
  ];

  const handleExport = async (format: string) => {
    showToast({
      severity: "info",
      summary: "Export Started",
      detail: `Exporting comments as ${format.toUpperCase()}...`,
    });
    // Export logic would go here
  };

  const handlePageChange = useCallback((first: number, rows: number) => {
    setFirst(first);
  }, []);

  const handleBulkDelete = () => {
    if (selectedComments.length > 0) {
      setShowBulkDeleteDialog(true);
    }
  };

  const handleBulkDeleteConfirm = (reason?: string) => {
    bulkDeleteComments.mutate({
      commentIds: selectedComments.map((c) => c.id),
      reason,
    });
    setShowBulkDeleteDialog(false);
    setSelectedComments([]);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedPost(null);
    setSelectedStatus("");
    setDateRange(null);
    setFirst(0);
  };

  const hasFilters = search || selectedPost || selectedStatus || dateRange;

  const getStatusLabel = (key: string) => {
    return t(key as any);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("CommentsManagement")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and manage comments across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon="pi pi-download"
            label={t("Export")}
            className="p-button-outlined"
            onClick={(e) => menuRef.current?.toggle(e)}
          />
          <Menu ref={menuRef} model={exportItems} popup />
        </div>
      </div>

      {/* Stats Bar */}
      {!isLoading && stats && (
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <i className="pi pi-comments text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {stats.total.toLocaleString()} {t("Total")}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <i className="pi pi-check-circle text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {stats.active.toLocaleString()} {t("Active")}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <i className="pi pi-eye-slash text-yellow-500" />
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              {stats.hidden.toLocaleString()} {t("Hidden")}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <i className="pi pi-trash text-red-500" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              {stats.deleted.toLocaleString()} {t("Deleted")}
            </span>
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedComments.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Tag value={t("CommentsSelected", { count: selectedComments.length })} severity="info" />
          <Button
            icon="pi pi-trash"
            label={t("BulkDelete")}
            severity="danger"
            size="small"
            onClick={handleBulkDelete}
          />
          <Button
            icon="pi pi-times"
            label={t("ClearSelection")}
            severity="secondary"
            size="small"
            text
            onClick={() => setSelectedComments([])}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("SearchComments")}
              className="w-full pl-10"
            />
          </div>

          {/* Status Filter */}
          <Dropdown
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.value)}
            options={STATUS_OPTIONS}
            optionLabel="labelKey"
            optionValue="value"
            placeholder={t("FilterByStatus")}
            showClear
            itemTemplate={(option) => <span>{getStatusLabel(option.labelKey)}</span>}
            className="w-full md:w-40"
          />

          {/* Post Filter */}
          <Dropdown
            value={selectedPost}
            onChange={(e) => setSelectedPost(e.value)}
            options={[]}
            placeholder="Filter by Post"
            showClear
            filter
            className="w-full md:w-48"
            emptyMessage="No posts available"
          />

          {/* Date Range Filter */}
          <Calendar
            value={dateRange}
            onChange={(e) => setDateRange(e.value as Date[] | null)}
            selectionMode="range"
            placeholder={t("CustomRange")}
            showIcon
            className="w-full md:w-64"
            dateFormat="mm/dd/yy"
          />

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              icon="pi pi-filter-slash"
              label={t("ClearFilters")}
              className="p-button-text"
              onClick={clearFilters}
            />
          )}
        </div>
      </div>

      {/* Comments Table */}
      <CommentsTable
        comments={commentsData?.data}
        loading={isLoading}
        totalRecords={commentsData?.total || 0}
        first={first}
        onPageChange={handlePageChange}
        selection={selectedComments}
        onSelectionChange={setSelectedComments}
      />

      {/* Bulk Delete Dialog */}
      <DeleteContentDialog
        visible={showBulkDeleteDialog}
        onHide={() => setShowBulkDeleteDialog(false)}
        contentId=""
        contentType="Comments"
        isBulk
        count={selectedComments.length}
        onConfirm={(reason) => handleBulkDeleteConfirm(reason)}
        loading={bulkDeleteComments.isPending}
      />
    </div>
  );
}
