import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  webViewLink?: string;
  webContentLink?: string;
  error?: string;
}

interface UseGoogleDriveUploadReturn {
  uploadFile: (
    file: File,
    folderPath: string
  ) => Promise<UploadResult>;
  isUploading: boolean;
  error: string | null;
}

export function useGoogleDriveUpload(): UseGoogleDriveUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    folderPath: string
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);

    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Content = btoa(binary);

      const { data, error: invokeError } = await supabase.functions.invoke(
        'google-drive-upload',
        {
          body: {
            fileName: file.name,
            fileContent: base64Content,
            mimeType: file.type || 'application/octet-stream',
            folderPath,
          },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Tải lên thất bại');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tải lên thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, error };
}
