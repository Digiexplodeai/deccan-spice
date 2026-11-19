import { useState } from "react";
import { Utensils } from "lucide-react";

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
  fallbackTitle?: string;
}

export function SafeImage({
  src,
  alt,
  className = "",
  loading = "lazy",
  fetchPriority = "auto",
  sizes,
  fallbackTitle,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 text-center bg-[#12352B] border border-[#D9B780]/25 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Utensils className="w-6 h-6 text-[#D9B780] mb-2" strokeWidth={1.5} />
        <p className="font-display text-base text-[#FFF9F1]">
          {fallbackTitle || alt}
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      sizes={sizes}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
