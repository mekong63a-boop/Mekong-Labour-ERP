import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  isChecking: boolean;
  error: string | null;
}

interface UseDuplicateCheckOptions {
  table: 'trainees' | 'companies' | 'unions' | 'job_categories' | 'referral_sources';
  field: string;
  currentId?: string; // For edit mode - exclude current record
  enabled?: boolean;
}

/**
 * Hook to check for duplicate values in a database table
 * Triggers check with debounce for performance
 * Uses case-insensitive comparison for name fields
 */
export function useDuplicateCheck(
  value: string,
  options: UseDuplicateCheckOptions
): DuplicateCheckResult {
  const { table, field, currentId, enabled = true } = options;
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedValue = useDebounce(value, 500);

  const checkDuplicate = useCallback(async () => {
    if (!enabled || !debouncedValue?.trim()) {
      setIsDuplicate(false);
      setError(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const trimmedValue = debouncedValue.trim();

      // Build query based on field type
      // Use ilike for case-insensitive comparison on name fields
      let data: { id: string }[] | null = null;
      let dbError: any = null;

      if (field === 'name') {
        // Case-insensitive comparison for name
        const result = await supabase
          .from(table)
          .select('id')
          .ilike(field, trimmedValue)
          .limit(5);
        data = result.data;
        dbError = result.error;
      } else {
        // Exact match for code fields using filter
        const filters: Record<string, string> = {};
        filters[field] = trimmedValue;
        const result = await supabase
          .from(table)
          .select('id')
          .match(filters)
          .limit(5);
        data = result.data;
        dbError = result.error;
      }

      if (dbError) {
        console.error('Duplicate check error:', dbError);
        setError('Lỗi kiểm tra dữ liệu');
        return;
      }

      // Check if result exists and isn't the current record
      if (data && data.length > 0) {
        if (currentId) {
          setIsDuplicate(data.some((item) => item.id !== currentId));
        } else {
          setIsDuplicate(true);
        }
      } else {
        setIsDuplicate(false);
      }
    } catch (err) {
      console.error('Duplicate check exception:', err);
      setError('Lỗi kiểm tra dữ liệu');
    } finally {
      setIsChecking(false);
    }
  }, [debouncedValue, table, field, currentId, enabled]);

  useEffect(() => {
    checkDuplicate();
  }, [checkDuplicate]);

  return { isDuplicate, isChecking, error };
}

/**
 * Get error message for duplicate field
 */
export function getDuplicateErrorMessage(table: string, field: string): string {
  const messages: Record<string, Record<string, string>> = {
    trainees: {
      trainee_code: 'Mã học viên đã tồn tại trong hệ thống',
    },
    companies: {
      code: 'Mã công ty đã tồn tại',
      name: 'Tên công ty đã tồn tại',
    },
    unions: {
      code: 'Mã nghiệp đoàn đã tồn tại',
      name: 'Tên nghiệp đoàn đã tồn tại',
    },
    job_categories: {
      code: 'Mã ngành nghề đã tồn tại',
      name: 'Tên ngành nghề đã tồn tại',
    },
    referral_sources: {
      name: 'Nguồn giới thiệu đã tồn tại',
    },
  };

  return messages[table]?.[field] || 'Giá trị đã tồn tại';
}
