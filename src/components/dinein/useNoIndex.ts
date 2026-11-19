import { useEffect } from "react";

/**
 * Ensures a <meta name="robots" content="noindex, nofollow" /> tag exists
 * on sensitive transactional and administrative routes (/order and /admin).
 */
export function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
      created = true;
    }

    const previousContent = meta.content;
    meta.content = "noindex, nofollow";

    return () => {
      if (created && meta && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      } else if (meta) {
        meta.content = previousContent || "index, follow";
      }
    };
  }, []);
}
