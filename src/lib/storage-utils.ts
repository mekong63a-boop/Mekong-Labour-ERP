import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Extract the storage path from a full Supabase public URL or return the path as-is.
 * Handles both old public URLs and new path-only values.
 */
export function extractStoragePath(urlOrPath: string): string {
  if (!urlOrPath) return urlOrPath;
  
  // If it's already a relative path (no http), return as-is
  if (!urlOrPath.startsWith("http")) return urlOrPath;
  
  // Extract path from full Supabase URL
  // Format: https://<project>.supabase.co/storage/v1/object/public/trainee-photos/<path>
  const match = urlOrPath.match(/\/storage\/v1\/object\/(?:public|sign)\/trainee-photos\/(.+?)(?:\?.*)?$/);
  if (match) return match[1];
  
  // Fallback: return original (might be an external URL)
  return urlOrPath;
}

/**
 * Generate a signed URL for a file in the trainee-photos bucket.
 * Returns null if the path is invalid or signing fails.
 */
export async function getSignedUrl(urlOrPath: string): Promise<string | null> {
  if (!urlOrPath) return null;
  
  // If it's a blob URL (local preview), return as-is
  if (urlOrPath.startsWith("blob:")) return urlOrPath;
  
  const path = extractStoragePath(urlOrPath);
  
  // If we couldn't extract a path (external URL), return original
  if (path.startsWith("http")) return urlOrPath;
  
  const { data, error } = await supabase.storage
    .from("trainee-photos")
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  
  if (error) {
    console.error("Failed to create signed URL:", error.message);
    return null;
  }
  
  return data.signedUrl;
}

/**
 * Upload a file and return the storage PATH (not a public URL).
 */
export async function uploadToStorage(
  file: File,
  folder: string,
  prefix: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${prefix}_${Date.now()}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from("trainee-photos")
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  return filePath;
}
