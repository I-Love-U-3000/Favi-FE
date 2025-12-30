"use client";
import { createContext, useContext, useRef, useState, useCallback } from "react";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { Tooltip } from "primereact/tooltip";
import InstagramPostDialog from "@/components/PostDialog";
import CollectionDialog from "@/components/CollectionDialog";
import AddToCollectionDialog from "@/components/AddToCollectionDialog";
import NotificationDialog from "@/components/NotificationDialog";
import StoryDialog from "@/components/StoryDialog";
import { CollectionResponse } from "@/types";

type OverlayContextType = {
  toastRef: React.RefObject<Toast | null>;
  showToast: (options: Parameters<Toast["show"]>[0]) => void;
  confirm: typeof confirmDialog;
  confirmPopup: typeof confirmPopup;
  openPostComposer: () => void;
  closePostComposer: () => void;
  openCollectionComposer: (collection?: CollectionResponse | null) => void;
  closeCollectionComposer: () => void;
  openStoryComposer: () => void;
  closeStoryComposer: () => void;
  openAddToCollectionDialog: (postId: string) => void;
  closeAddToCollectionDialog: () => void;
  openNotificationDialog: () => void;
  closeNotificationDialog: () => void;
};

const OverlayContext = createContext<OverlayContextType | null>(null);

export const RootProvider = ({ children }: { children: React.ReactNode }) => {
  const toastRef = useRef<Toast | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [collectionComposerOpen, setCollectionComposerOpen] = useState(false);
  const [storyComposerOpen, setStoryComposerOpen] = useState(false);
  const [addToCollectionDialogOpen, setAddToCollectionDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionResponse | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const showToast: OverlayContextType["showToast"] = (options) => {
    toastRef.current?.show(options);
  };

  const openPostComposer = useCallback(() => setComposerOpen(true), []);
  const closePostComposer = useCallback(() => setComposerOpen(false), []);

  const openCollectionComposer = useCallback((collection?: CollectionResponse | null) => {
    setEditingCollection(collection || null);
    setCollectionComposerOpen(true);
  }, []);

  const closeCollectionComposer = useCallback(() => {
    setEditingCollection(null);
    setCollectionComposerOpen(false);
  }, []);

  const openStoryComposer = useCallback(() => setStoryComposerOpen(true), []);
  const closeStoryComposer = useCallback(() => setStoryComposerOpen(false), []);

  const openAddToCollectionDialog = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setAddToCollectionDialogOpen(true);
  }, []);

  const closeAddToCollectionDialog = useCallback(() => {
    setSelectedPostId(null);
    setAddToCollectionDialogOpen(false);
  }, []);

  const openNotificationDialog = useCallback(() => setNotificationDialogOpen(true), []);
  const closeNotificationDialog = useCallback(() => setNotificationDialogOpen(false), []);

  return (
    <OverlayContext.Provider
      value={{
        toastRef,
        showToast,
        confirm: confirmDialog,
        confirmPopup: confirmPopup,
        openPostComposer,
        closePostComposer,
        openCollectionComposer,
        closeCollectionComposer,
        openStoryComposer,
        closeStoryComposer,
        openAddToCollectionDialog,
        closeAddToCollectionDialog,
        openNotificationDialog,
        closeNotificationDialog,
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

      {/* Global Collection Composer */}
      <CollectionDialog
        visible={collectionComposerOpen}
        onHide={closeCollectionComposer}
        collection={editingCollection}
      />

      {/* Global Story Composer */}
      <StoryDialog visible={storyComposerOpen} onHide={closeStoryComposer} />

      {/* Global Add to Collection Dialog */}
      {selectedPostId && (
        <AddToCollectionDialog
          visible={addToCollectionDialogOpen}
          onHide={closeAddToCollectionDialog}
          postId={selectedPostId}
        />
      )}

      {/* Global Notification Dialog */}
      <NotificationDialog visible={notificationDialogOpen} onHide={closeNotificationDialog} />
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within RootProvider");
  return ctx;
};
