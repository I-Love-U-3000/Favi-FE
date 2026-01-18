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
import { useBanUser, useUnbanUser, useWarnUser, UserDto } from "@/hooks/queries/useAdminUsers";
import BanUserDialog from "@/components/admin/modals/BanUserDialog";
import WarnUserDialog from "@/components/admin/modals/WarnUserDialog";

interface UsersTableProps {
  users?: UserDto[];
  loading?: boolean;
  totalRecords?: number;
  first?: number;
  onPageChange: (first: number, rows: number) => void;
  selection?: UserDto[];
  onSelectionChange: (selection: UserDto[]) => void;
}

export default function UsersTable({
  users = [],
  loading = false,
  totalRecords = 0,
  first = 0,
  onPageChange,
  selection = [],
  onSelectionChange,
}: UsersTableProps) {
  const router = useRouter();
  const menuRef = useRef<Menu>(null);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showWarnDialog, setShowWarnDialog] = useState(false);

  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const warnUser = useWarnUser();

  const handleMenuAction = (e: { item: { action: string } }, user: UserDto) => {
    switch (e.item.action) {
      case "view":
        router.push(`/admin/users/${user.id}`);
        break;
      case "ban":
        setSelectedUser(user);
        setShowBanDialog(true);
        break;
      case "unban":
        unbanUser.mutate(user.id);
        break;
      case "warn":
        setSelectedUser(user);
        setShowWarnDialog(true);
        break;
      case "activity":
        // TODO: Show activity popover
        break;
    }
  };

  const getMenuItems = (user: UserDto) => [
    {
      label: "View Profile",
      icon: "pi pi-eye",
      action: "view",
    },
    ...(user.status === "banned"
      ? [
          {
            label: "Unban User",
            icon: "pi pi-check",
            action: "unban",
            className: "text-green-600",
          },
        ]
      : [
          {
            label: "Ban User",
            icon: "pi pi-ban",
            action: "ban",
            className: "text-red-600",
          },
          {
            label: "Warn User",
            icon: "pi pi-exclamation-triangle",
            action: "warn",
            className: "text-yellow-600",
          },
        ]),
    { separator: true },
    {
      label: "View Activity",
      icon: "pi pi-chart-line",
      action: "activity",
    },
  ];

  const actionsTemplate = (user: UserDto) => {
    const items = getMenuItems(user);

    return (
      <div className="flex items-center gap-2">
        <Button
          icon="pi pi-ellipsis-v"
          className="p-button-text p-button-sm p-button-rounded"
          onClick={(e) => {
            setSelectedUser(user);
            menuRef.current?.toggle(e);
          }}
        />
        <Menu
          ref={menuRef}
          model={items.map((item) => ({
            label: item.label,
            icon: item.icon,
            className: item.className,
            command: () => handleMenuAction({ item }, user),
          }))}
          popup
        />
      </div>
    );
  };

  const userTemplate = (user: UserDto) => {
    return (
      <div className="flex items-center gap-3">
        <Avatar
          image={user.avatar}
          icon={!user.avatar ? "pi pi-user" : undefined}
          shape="circle"
          size="normal"
        />
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            @{user.username}
          </div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </div>
    );
  };

  const roleTemplate = (user: UserDto) => {
    return (
      <Tag
        value={user.role === "admin" ? "Admin" : "User"}
        severity={user.role === "admin" ? "info" : "secondary"}
        className="text-xs"
      />
    );
  };

  const statusTemplate = (user: UserDto) => {
    const severity = {
      active: "success",
      banned: "danger",
      inactive: "warning",
    } as const;

    return (
      <Tag
        value={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
        severity={severity[user.status]}
        className="text-xs"
      />
    );
  };

  const dateTemplate = (user: UserDto) => {
    return (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {new Date(user.createdAt).toLocaleDateString()}
      </span>
    );
  };

  const header = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {loading ? "Loading..." : `${totalRecords} users found`}
        </span>
      </div>
    </div>
  );

  const emptyMessage = (
    <div className="text-center py-8">
      <i className="pi pi-users text-4xl text-gray-300 mb-2" />
      <p className="text-gray-500">No users found</p>
    </div>
  );

  const loadingBodyTemplate = () => {
    return (
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" size="2.5rem" />
        <div>
          <Skeleton width="100px" className="mb-2" />
          <Skeleton width="150px" />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b last:border-0 border-gray-100 dark:border-gray-800">
              <Skeleton width="20px" height="20px" />
              <Skeleton shape="circle" size="2.5rem" />
              <Skeleton width="120px" />
              <Skeleton width="60px" />
              <Skeleton width="80px" />
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
          value={users}
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
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            style={{ width: "3rem" }}
          />
          <Column
            header="User"
            body={userTemplate}
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Role"
            body={roleTemplate}
            style={{ width: "100px" }}
          />
          <Column
            header="Status"
            body={statusTemplate}
            style={{ width: "100px" }}
          />
          <Column
            header="Joined"
            body={dateTemplate}
            style={{ width: "120px" }}
          />
          <Column
            header="Actions"
            body={actionsTemplate}
            style={{ width: "80px" }}
          />
        </DataTable>
      </div>

      {/* Ban Dialog */}
      <BanUserDialog
        visible={showBanDialog}
        onHide={() => {
          setShowBanDialog(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?.id || ""}
        userName={selectedUser?.username || ""}
        onBan={(userId, reason) => {
          banUser.mutate({ userId, reason });
          setShowBanDialog(false);
          setSelectedUser(null);
        }}
        loading={banUser.isPending}
      />

      {/* Warn Dialog */}
      <WarnUserDialog
        visible={showWarnDialog}
        onHide={() => {
          setShowWarnDialog(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?.id || ""}
        userName={selectedUser?.username || ""}
        onWarn={(userId, reason) => {
          warnUser.mutate({ userId, reason });
          setShowWarnDialog(false);
          setSelectedUser(null);
        }}
        loading={warnUser.isPending}
      />
    </>
  );
}
