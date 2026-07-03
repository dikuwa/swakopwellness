"use client";

import { useCallback, useRef, useState } from "react";
import { uploadMultipleMediaAction } from "@/media/actions";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const MAX_SIZE = 8 * 1024 * 1024;

type FileStatus = {
  file: File;
  preview: string;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const newFiles: FileStatus[] = [];
    for (let i = 0; i < incoming.length; i++) {
      const file = incoming[i];
      // Only accept valid image types
      if (!["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"].includes(file.type)) {
        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
          status: "error",
          error: `Unsupported type: ${file.type}`,
        });
        continue;
      }
      // Client-side size check
      if (file.size > MAX_SIZE) {
        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
          status: "error",
          error: `File too large (max 8MB).`,
        });
        continue;
      }
      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        status: "queued",
      });
    }
    setFiles((prev) => {
      // Clean up old previews
      for (const f of prev) URL.revokeObjectURL(f.preview);
      return newFiles;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    for (const f of files) URL.revokeObjectURL(f.preview);
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  }, [files]);

  const startUpload = useCallback(async () => {
    const toUpload = files.filter((f) => f.status === "queued");
    if (toUpload.length === 0) return;

    setUploading(true);

    // Mark all as uploading
    setFiles((prev) =>
      prev.map((f) => (f.status === "queued" ? { ...f, status: "uploading" as const } : f)),
    );

    const formData = new FormData();
    for (const f of toUpload) {
      formData.append("files", f.file);
    }

    const result = await uploadMultipleMediaAction(formData);

    if (result && "error" in result) {
      // Top-level error from the action
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error" as const, error: (result as { error: string }).error }
            : f,
        ),
      );
    } else if (result?.results) {
      let resultIdx = 0;
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status === "uploading") {
            const r = result.results[resultIdx++];
            if (r?.success) {
              return { ...f, status: "done" as const };
            } else {
              return { ...f, status: "error" as const, error: r?.error ?? "Upload failed." };
            }
          }
          return f;
        }),
      );
    } else {
      setFiles((prev) =>
        prev.map((f) => (f.status === "uploading" ? { ...f, status: "error" as const, error: "Upload failed." } : f)),
      );
    }

    setUploading(false);
  }, [files]);

  const queuedCount = files.filter((f) => f.status === "queued").length;
  const hasUploaded = files.some((f) => f.status === "done");
  const hasError = files.some((f) => f.status === "error");

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface-muted p-4 sm:p-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background p-8 transition-colors hover:border-primary hover:bg-primary/[0.02]"
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          Drop images here or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG, PNG, WebP, AVIF or GIF &middot; Max 8MB each
        </p>
        <input
          ref={inputRef}
          id="fileInput"
          name="files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          onChange={(e) => addFiles(e.target.files)}
          className="sr-only"
        />
      </div>

      {/* File preview list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex items-center gap-2">
              {!uploading && queuedCount > 0 && (
                <button
                  type="button"
                  onClick={startUpload}
                  disabled={uploading}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Upload {queuedCount > 0 ? `(${queuedCount})` : ""}
                </button>
              )}
              {!uploading && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {files.map((f, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-xl border transition-colors ${
                  f.status === "done"
                    ? "border-success bg-success/5"
                    : f.status === "error"
                      ? "border-destructive bg-destructive/5"
                      : "border-border bg-background"
                }`}
              >
                {/* Thumbnail */}
                <div className="aspect-square overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.preview}
                    alt={f.file.name}
                    className={`h-full w-full object-cover transition-opacity ${f.status === "uploading" ? "opacity-50" : ""}`}
                  />
                </div>

                {/* Overlay status */}
                {f.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
                  </div>
                )}
                {f.status === "done" && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  </div>
                )}
                {f.status === "error" && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  </div>
                )}

                {/* File info */}
                <div className="space-y-0.5 p-2">
                  <p className="truncate text-xs font-medium text-foreground">{f.file.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {f.file.size > 1024 * 1024
                      ? `${(f.file.size / (1024 * 1024)).toFixed(1)}MB`
                      : `${(f.file.size / 1024).toFixed(0)}KB`}
                  </p>
                  {f.status === "queued" && (
                    <p className="text-[11px] text-muted-foreground italic">Ready to upload</p>
                  )}
                  {f.status === "uploading" && (
                    <p className="text-[11px] text-primary animate-pulse">Uploading&hellip;</p>
                  )}
                  {f.status === "done" && (
                    <p className="text-[11px] text-success font-medium">Uploaded</p>
                  )}
                  {f.status === "error" && f.error && (
                    <p className="text-[11px] text-destructive">{f.error}</p>
                  )}

                  {/* Remove button (only when not uploading) */}
                  {!uploading && f.status !== "done" && (
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Remove ${f.file.name}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {!uploading && hasUploaded && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {files.filter((f) => f.status === "done").length} file{files.filter((f) => f.status === "done").length !== 1 ? "s" : ""} uploaded successfully.
            </p>
          )}
          {!uploading && hasError && !hasUploaded && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              Some files could not be uploaded. Check the file types and sizes.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
