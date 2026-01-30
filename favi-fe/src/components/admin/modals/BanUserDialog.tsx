"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressBar } from "primereact/progressbar";
import { Dropdown } from "primereact/dropdown";

interface BanDurationOption {
  label: string;
  value: number | null;
  description: string;
}

const BAN_DURATION_OPTIONS: BanDurationOption[] = [
  { label: "7 ngày", value: 7, description: "1 tuần" },
  { label: "14 ngày", value: 14, description: "2 tuần" },
  { label: "30 ngày", value: 30, description: "1 tháng" },
  { label: "60 ngày", value: 60, description: "2 tháng" },
  { label: "90 ngày", value: 90, description: "3 tháng" },
  { label: "180 ngày", value: 180, description: "6 tháng" },
  { label: "365 ngày", value: 365, description: "1 năm" },
  { label: "Vĩnh viễn", value: null, description: "Không giới hạn" },
];

interface BanUserDialogProps {
  visible: boolean;
  onHide: () => void;
  userId: string;
  userName: string;
  onBan: (reason?: string, durationDays?: number | null) => void;
  loading?: boolean;
}

export default function BanUserDialog({
  visible,
  onHide,
  userId,
  userName,
  onBan,
  loading = false,
}: BanUserDialogProps) {
  const [reason, setReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<BanDurationOption>(BAN_DURATION_OPTIONS[2]); // Default 30 days

  const handleBan = () => {
    onBan(reason, selectedDuration.value);
    setReason("");
    setSelectedDuration(BAN_DURATION_OPTIONS[2]);
  };

  const handleHide = () => {
    setReason("");
    setSelectedDuration(BAN_DURATION_OPTIONS[2]);
    onHide();
  };

  const durationOptionTemplate = (option: BanDurationOption) => {
    if (!option) return null;
    return (
      <div className="flex items-center justify-between w-full">
        <span className="font-medium">{option.label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{option.description}</span>
      </div>
    );
  };

  const selectedDurationTemplate = (option: BanDurationOption | null) => {
    if (!option) return <span className="text-gray-400">Chọn thời gian ban...</span>;
    return (
      <div className="flex items-center gap-2">
        <i className="pi pi-clock text-orange-500" />
        <span>{option.label}</span>
        <span className="text-xs text-gray-500">({option.description})</span>
      </div>
    );
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancel"
        className="p-button-text"
        onClick={handleHide}
        disabled={loading}
      />
      <Button
        label={selectedDuration.value === null ? "Ban vĩnh viễn" : `Ban ${selectedDuration.label}`}
        icon="pi pi-ban"
        severity="danger"
        onClick={handleBan}
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      header={`Ban User: @${userName}`}
      visible={visible}
      onHide={handleHide}
      style={{ width: "500px" }}
      footer={footer}
      className="p-fluid"
    >
      <div className="flex flex-col gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">
            <i className="pi pi-exclamation-triangle mr-2" />
            Banning a user will prevent them from accessing the platform.
            They will not be able to login, view posts, or interact with content.
          </p>
        </div>

        {/* Duration Selection */}
        <div className="flex flex-col gap-2">
          <label htmlFor="duration" className="font-medium text-gray-700 dark:text-gray-300">
            <i className="pi pi-calendar mr-2" />
            Thời gian ban
          </label>
          <Dropdown
            id="duration"
            value={selectedDuration}
            options={BAN_DURATION_OPTIONS}
            onChange={(e) => setSelectedDuration(e.value)}
            optionLabel="label"
            itemTemplate={durationOptionTemplate}
            valueTemplate={selectedDurationTemplate}
            className="w-full"
            placeholder="Chọn thời gian ban..."
          />
          {selectedDuration.value === null && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-xs text-orange-700 dark:text-orange-300">
              <i className="pi pi-info-circle" />
              <span>Ban vĩnh viễn chỉ có thể được gỡ bởi admin</span>
            </div>
          )}
        </div>

        {/* Reason Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="reason" className="font-medium text-gray-700 dark:text-gray-300">
            Reason for ban (optional)
          </label>
          <InputTextarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for banning this user..."
            rows={4}
            className="w-full"
          />
        </div>

        {loading && (
          <ProgressBar
            mode="indeterminate"
            className="h-2 mt-2"
            color="#ef4444"
          />
        )}
      </div>
    </Dialog>
  );
}
