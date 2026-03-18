import { useState, useEffect } from "react";
import { getSignedUrl } from "@/lib/storage-utils";

/**
 * Hook that resolves a stored photo URL/path to a signed URL for display.
 * Caches the result and refreshes when the input changes.
 */
export function useSignedUrl(urlOrPath: string | null | undefined): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!urlOrPath) {
      setSignedUrl(null);
      return;
    }

    // Blob URLs (local previews) don't need signing
    if (urlOrPath.startsWith("blob:")) {
      setSignedUrl(urlOrPath);
      return;
    }

    let cancelled = false;

    getSignedUrl(urlOrPath).then((url) => {
      if (!cancelled) setSignedUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [urlOrPath]);

  return signedUrl;
}
