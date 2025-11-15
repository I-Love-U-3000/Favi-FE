"use client";
import { createContext, useContext, useRef, useState, useCallback } from "react";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { Tooltip } from "primereact/tooltip";
import InstagramPostDialog from "@/components/PostDialog";

type OverlayContextType = {
  toastRef: React.RefObject<Toast | null>;
  showToast: (options: Parameters<Toast["show"]>[0]) => void;
  confirm: typeof confirmDialog;
  confirmPopup: typeof confirmPopup;
  openPostComposer: () => void;
  closePostComposer: () => void;
};

const OverlayContext = createContext<OverlayContextType | null>(null);

export const RootProvider = ({ children }: { children: React.ReactNode }) => {
  const toastRef = useRef<Toast | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const showToast: OverlayContextType["showToast"] = (options) => {
    toastRef.current?.show(options);
  };

  const openPostComposer = useCallback(() => setComposerOpen(true), []);
  const closePostComposer = useCallback(() => setComposerOpen(false), []);

  return (
    <OverlayContext.Provider
      value={{
        toastRef,
        showToast,
        confirm: confirmDialog,
        confirmPopup: confirmPopup,
        openPostComposer,
        closePostComposer,
      }}
    >
      {/* Global overlays */}
      <Toast ref={toastRef} />
      <ConfirmDialog />
      <ConfirmPopup />
      <Tooltip target=".has-tooltip" />

      {children}

      {/* Global Post Composer as share-sheet style */}
      <InstagramPostDialog visible={composerOpen} onHide={closePostComposer} />
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within RootProvider");
  return ctx;
};
