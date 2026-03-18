import { useSignedUrl } from "@/hooks/useSignedUrl";

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Storage path or legacy public URL stored in DB */
  storagePath: string | null | undefined;
}

/**
 * Renders an <img> with a signed URL resolved from a storage path.
 * Drop-in replacement for <img src={photo_url} />.
 */
export function SecureImage({ storagePath, alt, ...props }: SecureImageProps) {
  const signedUrl = useSignedUrl(storagePath);

  if (!signedUrl) return null;

  return <img src={signedUrl} alt={alt || ""} {...props} />;
}
