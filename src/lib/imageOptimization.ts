import { supabase } from "./supabase";

export interface OptimizedImageResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

/**
 * Client-side image resize and WebP conversion.
 * Limits max dimension to 1920px and compresses to WebP.
 */
export async function compressAndResizeImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/avif"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return reject(
        new Error("Unsupported file type. Please upload a JPG, PNG, or WebP image.")
      );
    }

    // Validate size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return reject(new Error("File size exceeds 5MB limit."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image for compression."));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Could not initialize 2D canvas."));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Image compression failed."));
            }
            resolve({
              blob,
              width,
              height,
              originalSize: file.size,
              compressedSize: blob.size,
            });
          },
          "image/webp",
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image to Cloudflare R2 via Vercel /api/upload-url presigned PUT.
 */
export async function uploadToR2(
  fileOrBlob: File | Blob,
  filename: string,
  folder = "cms",
  onProgress?: (percent: number) => void
): Promise<{ publicUrl: string; key: string }> {
  // 1. Get Supabase Auth token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("You must be logged in to upload images. Please sign in to the Admin Portal.");
  }

  onProgress?.(15);

  // 2. Request presigned upload URL from /api/upload-url
  const presignRes = await fetch("/api/upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: filename.endsWith(".webp") ? filename : `${filename}.webp`,
      contentType: "image/webp",
      folder,
    }),
  });

  if (!presignRes.ok) {
    const errData = await presignRes.json().catch(() => ({}));
    if (presignRes.status === 404) {
      throw new Error(
        "Upload API route (/api/upload-url) is not active in this environment. It is enabled on Vercel deployment or via `vercel dev`."
      );
    }
    throw new Error(errData.error || `Upload presigning failed (${presignRes.status}).`);
  }

  const { uploadUrl, publicUrl, key } = await presignRes.json();
  onProgress?.(45);

  // 3. PUT directly to Cloudflare R2
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "image/webp",
    },
    body: fileOrBlob,
  });

  if (!uploadRes.ok) {
    throw new Error(`Direct upload to Cloudflare R2 failed (${uploadRes.status}). Check R2 CORS settings.`);
  }

  onProgress?.(100);

  return { publicUrl, key };
}

/**
 * Delete an image object from Cloudflare R2 via /api/delete-image.
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  if (!key) return false;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return false;

    const res = await fetch("/api/delete-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key }),
    });

    return res.ok;
  } catch {
    return false;
  }
}
