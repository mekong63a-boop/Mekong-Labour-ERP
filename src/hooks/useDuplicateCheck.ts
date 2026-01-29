import { useState, useEffect, useRef } from 'react';
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
  caseInsensitive?: boolean; // Force case-insensitive check
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
  const { table, field, currentId, enabled = true, caseInsensitive = false } = options;
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce the value to avoid too many API calls
  const debouncedValue = useDebounce(value, 500);
  
  // Use ref to track the latest request and avoid race conditions
  const requestIdRef = useRef(0);

  useEffect(() => {
    // Skip check if not enabled or value is empty
    if (!enabled || !debouncedValue?.trim()) {
      setIsDuplicate(false);
      setError(null);
      setIsChecking(false);
      return;
    }

    const trimmedValue = debouncedValue.trim();
    
    // Increment request ID to track latest request
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    const checkDuplicate = async () => {
      setIsChecking(true);
      setError(null);

      try {
        // Use case-insensitive for name fields or when explicitly requested
        const useCaseInsensitive = field === 'name' || field === 'name_japanese' || caseInsensitive;
        
        let data: { id: string }[] | null = null;
        let dbError: any = null;

        if (useCaseInsensitive) {
          // Case-insensitive comparison
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

        // Only update state if this is still the latest request
        if (currentRequestId !== requestIdRef.current) {
          return;
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
        // Only update state if this is still the latest request
        if (currentRequestId !== requestIdRef.current) {
          return;
        }
        console.error('Duplicate check exception:', err);
        setError('Lỗi kiểm tra dữ liệu');
      } finally {
        // Only update state if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          setIsChecking(false);
        }
      }
    };

    checkDuplicate();
  }, [debouncedValue, table, field, currentId, enabled, caseInsensitive]);

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
      name_japanese: 'Tên tiếng Nhật đã tồn tại',
    },
    unions: {
      code: 'Mã nghiệp đoàn đã tồn tại',
      name: 'Tên nghiệp đoàn đã tồn tại',
      name_japanese: 'Tên tiếng Nhật đã tồn tại',
    },
    job_categories: {
      code: 'Mã ngành nghề đã tồn tại',
      name: 'Tên ngành nghề đã tồn tại',
      name_japanese: 'Tên tiếng Nhật đã tồn tại',
    },
    referral_sources: {
      name: 'Nguồn giới thiệu đã tồn tại',
    },
  };

  return messages[table]?.[field] || 'Giá trị đã tồn tại';
}
