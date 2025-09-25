"use client";
import { useState } from "react";
import { Dock as PrimeDock } from "primereact/dock";
import { useOverlay } from "./RootProvider";

function Dock() {
  const { showToast, confirm } = useOverlay();
  const [active, setActive] = useState<string>("");

  const dockItems = [
    {
      label: "Home",
      icon: () => (
        <i
          className={`pi pi-home text-2xl ${
            active === "Home" ? "text-blue-500" : "text-gray-700"
          }`}
        />
      ),
      command: () => setActive("Home"),
    },
    {
      label: "Search",
      icon: () => (
        <i
          className={`pi pi-search text-2xl ${
            active === "Search" ? "text-blue-500" : "text-gray-700"
          }`}
        />
      ),
      command: () => {
        setActive("Search");
        confirm({
          message: "Are you sure you want to delete?",
          header: "Confirmation",
          icon: "pi pi-exclamation-triangle",
          accept: () => console.log("Accepted"),
          reject: () => console.log("Rejected"),
        });
      },
    },
    {
      label: "New Post",
      icon: () => (
        <i
          className={`pi pi-plus-circle text-2xl ${
            active === "New Post" ? "text-blue-500" : "text-gray-700"
          }`}
        />
      ),
      command: () => {
        setActive("New Post");
        showToast({
          severity: "info",
          summary: "Uploaded",
          detail: "Your photo is live!",
          life: 3000,
        });
      },
    },
    {
      label: "Messages",
      icon: () => (
        <i
          className={`pi pi-envelope text-2xl ${
            active === "Messages" ? "text-blue-500" : "text-gray-700"
          }`}
        />
      ),
      command: () => setActive("Messages"),
    },
    {
      label: "Profile",
      icon: () => (
        <i
          className={`pi pi-user text-2xl ${
            active === "Profile" ? "text-blue-500" : "text-gray-700"
          }`}
        />
      ),
      command: () => setActive("Profile"),
    },
  ];

  return (
    <div>
      <PrimeDock
        model={dockItems}
        position="left"
        className="mt-10"
        style={{ transform: "scale(0.9)" }}
      />
      <style jsx>{`
        :global(.p-dock .p-dock-item .pi) {
          font-size: 1.3rem;
          transition: color 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
}
export default Dock;
