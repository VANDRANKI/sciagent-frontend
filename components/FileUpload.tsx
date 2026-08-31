"use client";

import { useCallback, useRef, useState } from "react";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      // file.type is not reliable on its own: some OS/browser combinations
      // (notably drag-and-drop on Linux without a registered PDF handler)
      // report an empty string instead of "application/pdf" for a genuine
      // PDF, which rejected valid files with "Only PDF files are accepted."
      // Falling back to the .pdf extension when the browser gives no MIME
      // type at all still rejects anything with a real, wrong MIME type.
      const looksLikePdf =
        file.type === "application/pdf" ||
        (file.type === "" && file.name.toLowerCase().endsWith(".pdf"));
      if (!looksLikePdf) {
        alert("Only PDF files are accepted.");
        return;
      }
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0] ?? null;
    handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFile(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full">
      {selectedFile ? (
        <div className="flex items-start justify-between gap-3 p-4 rounded-xl border border-success bg-success-bg animate-fade-in">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-medium text-success truncate">
              {selectedFile.name}
            </span>
            <span className="text-xs text-text-muted">{formatSize(selectedFile.size)}</span>
          </div>
          {!disabled && (
            <button
              onClick={handleClear}
              className="flex-shrink-0 text-xs text-text-muted hover:text-error transition-colors duration-150 mt-0.5"
              aria-label="Remove file"
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={disabled}
          className={[
            "w-full rounded-xl border-2 border-dashed p-8 text-center",
            "transition-all duration-200 cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-base",
            isDragging
              ? "border-accent-primary bg-accent-primary/10 shadow-accent-glow"
              : "border-border hover:border-border-bright hover:bg-card-hover",
            disabled ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
          aria-label="Upload PDF"
        >
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-accent-primary/15 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-accent-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary">
              {isDragging ? "Drop your PDF here" : "Drop PDF here or click to browse"}
            </p>
            <p className="text-xs text-text-muted">PDF files only</p>
          </div>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
