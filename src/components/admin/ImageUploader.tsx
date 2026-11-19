import React, { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Link,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  compressAndResizeImage,
  deleteFromR2,
  uploadToR2,
} from "../../lib/imageOptimization";

interface ImageUploaderProps {
  value: string;
  imageKey?: string;
  altText?: string;
  label?: string;
  recommendedSize?: string;
  folder?: string;
  onChange: (url: string, key?: string, alt?: string) => void;
  onRemove?: () => void;
}

export function ImageUploader({
  value,
  imageKey = "",
  altText = "",
  label = "Image",
  recommendedSize = "Max 1920px width (JPG, PNG, WebP)",
  folder = "cms",
  onChange,
  onRemove,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [compressionRatio, setCompressionRatio] = useState<string | null>(null);
  const [currentAlt, setCurrentAlt] = useState(altText);
  const [manualUrlMode, setManualUrlMode] = useState(false);
  const [tempManualUrl, setTempManualUrl] = useState(value);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setCompressionRatio(null);

    try {
      setIsProcessing(true);
      setProgress(15);

      // 1. Client-side resize & compress to WebP
      const optimized = await compressAndResizeImage(file, 1920, 1920, 0.85);
      const savings = Math.round(
        ((optimized.originalSize - optimized.compressedSize) / optimized.originalSize) * 100
      );
      setCompressionRatio(
        `${(optimized.originalSize / 1024 / 1024).toFixed(1)}MB → ${(
          optimized.compressedSize / 1024
        ).toFixed(0)}KB (-${savings}%)`
      );

      setProgress(40);

      // 2. Upload to Cloudflare R2
      const oldKey = imageKey;
      const { publicUrl, key } = await uploadToR2(
        optimized.blob,
        file.name.replace(/\.[^/.]+$/, ""),
        folder,
        (p) => setProgress(p)
      );

      setProgress(100);

      // 3. Notify parent
      onChange(publicUrl, key, currentAlt || file.name.replace(/\.[^/.]+$/, ""));

      // 4. Delete old object from R2 if replaced
      if (oldKey && oldKey !== key) {
        deleteFromR2(oldKey).catch(() => {});
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(null), 1200);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleAltChange = (newAlt: string) => {
    setCurrentAlt(newAlt);
    if (value) {
      onChange(value, imageKey, newAlt);
    }
  };

  const handleApplyManualUrl = () => {
    if (tempManualUrl.trim()) {
      onChange(tempManualUrl.trim(), "", currentAlt);
      setManualUrlMode(false);
    }
  };

  const handleRemoveClick = async () => {
    if (imageKey) {
      await deleteFromR2(imageKey).catch(() => {});
    }
    if (onRemove) {
      onRemove();
    } else {
      onChange("", "", "");
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <label className="text-[0.72rem] uppercase tracking-wider text-[#D9B780] font-medium">
          {label}
        </label>
        <span className="text-[0.65rem] text-[#F7F2E9]/50">{recommendedSize}</span>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-600/50 p-2.5 text-rose-200 flex items-start gap-2 text-[0.72rem] leading-relaxed">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex items-center justify-end gap-2 text-[0.68rem] text-[#D9B780]/80">
        <button
          type="button"
          onClick={() => setManualUrlMode(!manualUrlMode)}
          className="hover:underline flex items-center gap-1"
        >
          <Link className="w-3 h-3" />
          <span>{manualUrlMode ? "Upload to Cloudflare R2" : "Paste Custom URL"}</span>
        </button>
      </div>

      {manualUrlMode ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://... or /src/assets/..."
            value={tempManualUrl}
            onChange={(e) => setTempManualUrl(e.target.value)}
            className="flex-1 bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
          />
          <button
            type="button"
            onClick={handleApplyManualUrl}
            className="px-3 py-2 bg-[#12352B] hover:bg-[#811C36] border border-[#D9B780]/60 text-xs text-[#FFF9F1]"
          >
            Apply
          </button>
        </div>
      ) : value ? (
        /* Image Preview & Management View */
        <div className="bg-[#10110F] border border-[#D9B780]/30 p-3 space-y-3">
          <div className="relative aspect-video sm:aspect-[21/9] max-h-48 overflow-hidden bg-black/60 border border-[#D9B780]/20 flex items-center justify-center">
            <img
              src={value}
              alt={currentAlt || "Uploaded asset"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#D9B780] animate-spin" />
                <span className="text-xs text-[#FFF9F1]">Uploading to Cloudflare R2...</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[0.68rem]">
            {compressionRatio && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {compressionRatio}
              </span>
            )}
            {imageKey && (
              <span className="text-[#F7F2E9]/40 font-mono truncate max-w-[200px]" title={imageKey}>
                R2: {imageKey}
              </span>
            )}
          </div>

          {/* Alt text field */}
          <div>
            <label className="block text-[0.65rem] uppercase tracking-wider text-[#F7F2E9]/60 mb-0.5">
              Alt Text (for SEO & Accessibility)
            </label>
            <input
              type="text"
              placeholder="Descriptive caption for screen readers & search engines"
              value={currentAlt}
              onChange={(e) => handleAltChange(e.target.value)}
              className="w-full bg-[#12352B]/30 border border-[#D9B780]/20 px-2.5 py-1.5 text-xs text-[#FFF9F1] placeholder-[#F7F2E9]/30 focus:outline-none focus:border-[#D9B780]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-[#D9B780]/15">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#12352B] hover:bg-[#811C36] border border-[#D9B780]/40 text-xs text-[#D9B780] hover:text-[#FFF9F1] transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Replace (R2)</span>
            </button>

            <button
              type="button"
              onClick={handleRemoveClick}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? "border-[#D9B780] bg-[#12352B]/40"
              : "border-[#D9B780]/30 hover:border-[#D9B780]/70 bg-[#12352B]/15"
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <RefreshCw className="w-6 h-6 text-[#D9B780] animate-spin" />
              <span className="text-xs text-[#D9B780]">Optimizing & Uploading to Cloudflare R2...</span>
              {progress !== null && (
                <div className="w-48 bg-[#10110F] h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-[#D9B780] h-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[#12352B] border border-[#D9B780]/40 flex items-center justify-center text-[#D9B780]">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#FFF9F1] font-medium">
                Click or drag & drop image here
              </p>
              <p className="text-[0.68rem] text-[#F7F2E9]/50">
                Max 5MB (JPG, PNG, WebP) • Uploads directly to Cloudflare R2
              </p>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />
    </div>
  );
}
