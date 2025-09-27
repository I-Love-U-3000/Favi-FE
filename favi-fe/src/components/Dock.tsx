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
        router.push("/chat");
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
    <div>
      <PrimeDock
  model={dockItems}
  position="left"
  className="mt-10 custom-dock"
  style={{ transform: "scale(0.9)" }}
/>
<style jsx>{`
  :global(.p-dock .p-dock-item .pi) {
    font-size: 1.3rem;
    transition: color 0.2s ease-in-out;
  }
  /* Khi bạn muốn “dính” (sticky) */
  :global(.custom-dock) {
    position: sticky !important;
    top: 20px; /* bạn chỉnh khoảng cách từ top */
  }
`}</style>


      <InstagramPostDialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
      />

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
          <ScrollPanel style={{ height: "calc(100vh - 100px)" }} className="w-full">
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
    </div>
  );
}
export default Dock;
