"use client";

import { useState } from "react";
import { Dock as PrimeDock } from "primereact/dock";
import { useOverlay } from "./RootProvider";
import InstagramPostDialog from "./PostDialog";
import { useRouter } from "next/navigation";
import { Sidebar } from "primereact/sidebar";
import { ScrollPanel } from "primereact/scrollpanel";
import { Avatar } from "primereact/avatar";

function Dock() {
  const { showToast, confirm } = useOverlay();
  const [active, setActive] = useState<string>("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const messages = [
    {
      id: 1,
      username: "elenavoyage",
      avatar: "https://i.pravatar.cc/150?img=2",
      text: "Hey, loved your latest post! 😊",
      time: "5 mins ago",
    },
    {
      id: 2,
      username: "john_doe",
      avatar: "https://i.pravatar.cc/150?img=3",
      text: "Are we meeting up later?",
      time: "1 hour ago",
    },
    {
      id: 3,
      username: "sarah_smith",
      avatar: "https://i.pravatar.cc/150?img=4",
      text: "Check out this new place I found!",
      time: "2 hours ago",
    },
  ];

  // ===== Dock items =====
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
      command: () => {
        setActive("Home");
        router.push("/home");
      },
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
        setDialogVisible(true);
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
      command: () => {
        setActive("Messages");
        setSidebarVisible(true);
      },
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
      command: () => {
        setActive("Profile");
        router.push("/profile");
      },
    },
  ];

  return (
    <>
      {/* Navbar ngang trên cùng */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-sm ring-1 ring-black/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-sky-500 rounded-lg grid place-items-center text-white font-bold text-xl">
              F
            </div>
            <span className="font-semibold text-lg">Favi</span>
          </div>

          {/* Dock menu ngang */}
          <div className="flex-1 flex justify-center">
            <PrimeDock
              model={dockItems}
              position="top"
              className="!bg-transparent !shadow-none scale-90"
            />
          </div>

          {/* Search hoặc Avatar bên phải */}
          <div className="flex items-center gap-3"></div>
        </div>
      </header>

      {/* Spacer để tránh che nội dung */}
      <div className="h-[68px]" />

      {/* Dialog tạo bài post */}
      <InstagramPostDialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
      />

      {/* Sidebar tin nhắn */}
      <Sidebar
        visible={sidebarVisible}
        onHide={() => {
          setSidebarVisible(false);
          setActive("");
        }}
        position="right"
        className="w-full max-w-md bg-gray-800 text-white"
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Messages</h2>
          <ScrollPanel
            style={{ height: "calc(100vh - 100px)" }}
            className="w-full"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start mb-4 p-2 hover:bg-gray-700 transition-colors rounded"
              >
                <Avatar className="h-10 w-10 mr-2">
                  <img
                    src={message.avatar}
                    alt={message.username}
                    className="rounded-full"
                  />
                </Avatar>
                <div className="max-w-[calc(100%-3rem)]">
                  <div className="font-semibold">{message.username}</div>
                  <div className="text-gray-400 text-sm">{message.time}</div>
                  <p className="break-words">{message.text}</p>
                </div>
              </div>
            ))}
          </ScrollPanel>
        </div>
      </Sidebar>

      <style jsx global>{`
        .p-dock {
          background: transparent !important;
          border: none !important;
        }
        .p-dock .p-dock-item {
          transition: transform 0.15s ease-in-out;
        }
        .p-dock .p-dock-item:hover {
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
}

export default Dock;


