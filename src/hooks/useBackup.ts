import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BackupResult {
  timestamp: string;
  success: boolean;
  csvFileLink?: string;
  error?: string;
  rowCount?: number;
}

interface UseBackupReturn {
  runBackup: () => Promise<BackupResult>;
  isRunning: boolean;
  lastResult: BackupResult | null;
}

export function useBackup(): UseBackupReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<BackupResult | null>(null);

  const runBackup = async (): Promise<BackupResult> => {
    setIsRunning(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'weekly-backup'
      );

      if (invokeError) {
        const result: BackupResult = {
          timestamp: new Date().toISOString(),
          success: false,
          error: invokeError.message,
        };
        setLastResult(result);
        return result;
      }

      setLastResult(data);
      return data;
    } catch (err) {
      const result: BackupResult = {
        timestamp: new Date().toISOString(),
        success: false,
        error: err instanceof Error ? err.message : 'Sao lưu thất bại',
      };
      setLastResult(result);
      return result;
    } finally {
      setIsRunning(false);
    }
  };

  return { runBackup, isRunning, lastResult };
}
