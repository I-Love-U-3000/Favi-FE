"use client";
import { createContext, useContext, useRef } from "react";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { Tooltip } from "primereact/tooltip";

type OverlayContextType = {
  toastRef: React.RefObject<Toast | null>;
  showToast: (options: Parameters<Toast["show"]>[0]) => void;
  confirm: typeof confirmDialog;
  confirmPopup: typeof confirmPopup;
};

const OverlayContext = createContext<OverlayContextType | null>(null);

export const RootProvider = ({ children }: { children: React.ReactNode }) => {
  const toastRef = useRef<Toast | null>(null);

  const showToast: OverlayContextType["showToast"] = (options) => {
    toastRef.current?.show(options);
  };

  return (
    <OverlayContext.Provider
      value={{
        toastRef,
        showToast,
        confirm: confirmDialog,
        confirmPopup: confirmPopup,
      }}
    >
      {/* Global overlays */}
      <Toast ref={toastRef} />
      <ConfirmDialog />
      <ConfirmPopup />
      <Tooltip target=".has-tooltip" />

      {children}
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within RootProvider");
  return ctx;
};
