"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X, Trash2, Image as ImageIcon, Check, AlertTriangle, Loader2,
  Link2, Upload, RefreshCw, ArrowRightToLine, CheckCircle2, Search,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  updateMediaAltAction,
  deleteMediaAction,
  assignMediaToServiceAction,
  replaceMediaFileAction,
  removeMediaAssignmentAction,
} from "@/media/actions";
import type { MediaWithUsage, ServiceOption } from "@/media/actions";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function MediaDetailModal({
  asset,
  services,
  onClose,
  onDeleted,
  onUpdated,
}: {
  asset: MediaWithUsage;
  services: ServiceOption[];
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState(asset.altText ?? "");
  const [savingAlt, setSavingAlt] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Assign flow
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [assignRole, setAssignRole] = useState<"featured" | "gallery">("featured");
  const [serviceSearch, setServiceSearch] = useState("");

  // Replace flow
  const [replacing, setReplacing] = useState(false);

  const refresh = () => {
    onUpdated?.();
    router.refresh();
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  const totalUsage = (asset.usedAsFeatured ? 1 : 0) + asset.usedAsGallery.length;

  // Close on overlay click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Trap focus
  useEffect(() => {
    const modal = overlayRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    modal.addEventListener("keydown", handler);
    first?.focus();
    return () => modal.removeEventListener("keydown", handler);
  }, []);

  const handleSaveAlt = async () => {
    setSavingAlt(true);
    try {
      await updateMediaAltAction(asset.id, altText);
      toast.success("Alt text saved");
      refresh();
      onClose();
    } catch {
      toast.error("Failed to save alt text");
    }
    setSavingAlt(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteMediaAction(asset.id);
      if (result?.error) {
        toast.error(result.error);
        setDeleting(false);
        return;
      }
      toast.success("Image deleted");
      onDeleted?.();
      onClose();
    } catch {
      toast.error("Failed to delete image");
      setDeleting(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedServiceId) {
      toast.error("Please select a service first.");
      return;
    }
    setAssigning(true);
    try {
      const result = await assignMediaToServiceAction(asset.id, selectedServiceId, assignRole);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          assignRole === "featured"
            ? "Assigned as featured image"
            : "Added to gallery",
        );
        refresh();
        onClose();
      }
    } catch {
      toast.error("Assignment failed");
    }
    setAssigning(false);
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReplacing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await replaceMediaFileAction(asset.id, formData);
      if (result?.error) {
        toast.error(result.error);
        setReplacing(false);
        return;
      }
      toast.success("Image replaced");
      refresh();
      onClose();
    } catch {
      toast.error("Replace failed");
      setReplacing(false);
    }
  };

  const fileName = asset.storageKey.split("/").pop() ?? asset.storageKey;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Media detail: ${fileName}`}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3 sm:px-6">
          <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {asset.altText || fileName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Preview */}
            <div className="overflow-hidden rounded-xl border border-border bg-surface-muted">
              {asset.publicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.publicUrl}
                  alt={asset.altText ?? fileName}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-5">
              {/* File info */}
              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  File Info
                </h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium text-foreground">{asset.mimeType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Size</dt>
                    <dd className="font-medium text-foreground">{formatBytes(asset.byteSize)}</dd>
                  </div>
                  {asset.width && asset.height && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Dimensions</dt>
                      <dd className="font-medium text-foreground">
                        {asset.width}&times;{asset.height}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Uploaded</dt>
                    <dd className="font-medium text-foreground">
                      {asset.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Alt text */}
              <div>
                <label
                  htmlFor="alt-text"
                  className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Alt Text
                </label>
                <div className="flex gap-2">
                  <input
                    id="alt-text"
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe the image for accessibility"
                    className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAlt}
                    disabled={savingAlt || altText === (asset.altText ?? "")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
                    aria-label="Save alt text"
                  >
                    {savingAlt ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Usage */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  <Link2 className="h-3 w-3" aria-hidden="true" />
                  Usage
                </h3>
                {totalUsage === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Not assigned to any content.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {asset.usedAsFeatured && (
                      <li className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-1.5 text-sm">
                        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <span className="flex-1 text-foreground">
                          Featured image for{" "}
                          <span className="font-medium">{asset.usedAsFeatured.serviceName}</span>
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            setRemoving(`${asset.usedAsFeatured!.serviceId}-featured`);
                            const res = await removeMediaAssignmentAction(
                              asset.id,
                              asset.usedAsFeatured!.serviceId,
                              "featured",
                            );
                            setRemoving(null);
                            if (res?.error) toast.error(res.error);
                            else { toast.success("Assignment removed"); refresh(); onClose(); }
                          }}
                          disabled={removing !== null}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-destructive disabled:opacity-30"
                          aria-label={`Remove featured image assignment for ${asset.usedAsFeatured.serviceName}`}
                        >
                          {removing === `${asset.usedAsFeatured!.serviceId}-featured` ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          ) : (
                            <X className="h-3 w-3" aria-hidden="true" />
                          )}
                        </button>
                      </li>
                    )}
                    {asset.usedAsGallery.map((g) => (
                      <li
                        key={g.serviceId}
                        className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-1.5 text-sm"
                      >
                        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="flex-1 text-foreground">
                          Gallery image for{" "}
                          <span className="font-medium">{g.serviceName}</span>
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            setRemoving(`${g.serviceId}-gallery`);
                            const res = await removeMediaAssignmentAction(
                              asset.id,
                              g.serviceId,
                              "gallery",
                            );
                            setRemoving(null);
                            if (res?.error) toast.error(res.error);
                            else { toast.success("Gallery image removed"); refresh(); onClose(); }
                          }}
                          disabled={removing !== null}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-destructive disabled:opacity-30"
                          aria-label={`Remove gallery image for ${g.serviceName}`}
                        >
                          {removing === `${g.serviceId}-gallery` ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          ) : (
                            <X className="h-3 w-3" aria-hidden="true" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* --- Assign to Content --- */}
              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  <ArrowRightToLine className="h-3 w-3" aria-hidden="true" />
                  Assign to Content
                </h3>

                {/* Service search */}
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Service picker */}
                <div className="mb-3 max-h-32 overflow-y-auto rounded-lg border border-border bg-surface">
                  {filteredServices.length === 0 ? (
                    <p className="p-3 text-center text-xs text-muted-foreground">No services found</p>
                  ) : (
                    filteredServices.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedServiceId(s.id)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-surface-muted ${
                          selectedServiceId === s.id
                            ? "bg-primary/5 text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {selectedServiceId === s.id && (
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                        )}
                        <span>{s.name}</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Role selector */}
                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignRole("featured")}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      assignRole === "featured"
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface text-muted-foreground hover:bg-surface-muted"
                    }`}
                  >
                    Featured Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignRole("gallery")}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      assignRole === "gallery"
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface text-muted-foreground hover:bg-surface-muted"
                    }`}
                  >
                    Gallery Image
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={assigning || !selectedServiceId}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <ArrowRightToLine className="h-3.5 w-3.5" aria-hidden="true" />
                      Assign
                    </>
                  )}
                </button>
              </div>

              {/* --- Replace Image --- */}
              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  Replace Image
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Upload a new file to replace this image. Assignments will be preserved.
                </p>
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  onChange={handleReplace}
                  className="sr-only"
                  id="replace-file-input"
                />
                <button
                  type="button"
                  onClick={() => replaceInputRef.current?.click()}
                  disabled={replacing}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50"
                >
                  {replacing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      Choose new file
                    </>
                  )}
                </button>
              </div>

              {/* Delete */}
              <div className="border-t border-border pt-4">
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className="flex h-10 items-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete image
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    {totalUsage > 0 && (
                      <div className="flex items-start gap-2 text-sm text-destructive">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <p>
                          This image is used by {totalUsage} service{totalUsage > 1 ? "s" : ""}.
                          Deleting it may break those service pages. Remove the association first
                          from the service edit page.
                        </p>
                      </div>
                    )}
                    {totalUsage === 0 && (
                      <p className="text-sm text-foreground">
                        This image is not used anywhere. Are you sure you want to delete it?
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex h-9 items-center gap-1.5 rounded-xl bg-destructive px-4 text-xs font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Yes, delete
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="h-9 rounded-xl border border-border px-4 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
