import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * MASTER REALTIME HOOK
 * Lắng nghe TẤT CẢ các bảng trong hệ thống để đồng bộ realtime
 * Khi admin thay đổi dữ liệu, tất cả tài khoản khác sẽ tự động cập nhật
 */
export function useSystemRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Create unique channel to avoid conflicts
    const channelId = `system-realtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelId)
      // ========== ORDERS MODULE ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Realtime] Orders changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      // ========== PARTNERS MODULE ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        (payload) => {
          console.log('[Realtime] Companies changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["companies"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unions' },
        (payload) => {
          console.log('[Realtime] Unions changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["unions"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_categories' },
        (payload) => {
          console.log('[Realtime] Job categories changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["job_categories"] });
        }
      )
      // ========== INTERNAL UNION MODULE ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'union_members' },
        (payload) => {
          console.log('[Realtime] Union members changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["union-members"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'union_transactions' },
        (payload) => {
          console.log('[Realtime] Union transactions changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["union-transactions"] });
        }
      )
      // ========== TRAINEE RELATED TABLES ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainees' },
        (payload) => {
          console.log('[Realtime] Trainees changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["trainees"] });
          queryClient.invalidateQueries({ queryKey: ["trainees-paginated"] });
          queryClient.invalidateQueries({ queryKey: ["trainee-stage-counts"] });
          queryClient.invalidateQueries({ queryKey: ["trainees-count"] });
          queryClient.invalidateQueries({ queryKey: ["class-students"] });
          
          // Invalidate specific trainee if available
          if (payload.old && (payload.old as any).id) {
            queryClient.invalidateQueries({ queryKey: ["trainee", (payload.old as any).id] });
          }
          if (payload.new && (payload.new as any).id) {
            queryClient.invalidateQueries({ queryKey: ["trainee", (payload.new as any).id] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'education_history' },
        (payload) => {
          console.log('[Realtime] Education history changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["education-history"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_history' },
        (payload) => {
          console.log('[Realtime] Work history changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["work-history"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'family_members' },
        (payload) => {
          console.log('[Realtime] Family members changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["family-members"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'japan_relatives' },
        (payload) => {
          console.log('[Realtime] Japan relatives changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["japan-relatives"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interview_history' },
        (payload) => {
          console.log('[Realtime] Interview history changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["interview-history"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainee_reviews' },
        (payload) => {
          console.log('[Realtime] Trainee reviews changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["trainee-reviews"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrollment_history' },
        (payload) => {
          console.log('[Realtime] Enrollment history changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["enrollment-history"] });
        }
      )
      // ========== EDUCATION MODULE ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes' },
        (payload) => {
          console.log('[Realtime] Classes changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["classes"] });
          queryClient.invalidateQueries({ queryKey: ["class"] });
          queryClient.invalidateQueries({ queryKey: ["class-students"] });
          queryClient.invalidateQueries({ queryKey: ["education-stats"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teachers' },
        (payload) => {
          console.log('[Realtime] Teachers changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["teachers"] });
          queryClient.invalidateQueries({ queryKey: ["class-teachers"] });
          queryClient.invalidateQueries({ queryKey: ["education-stats"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_teachers' },
        (payload) => {
          console.log('[Realtime] Class teachers changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["class-teachers"] });
          queryClient.invalidateQueries({ queryKey: ["classes"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('[Realtime] Attendance changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["attendance"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'test_scores' },
        (payload) => {
          console.log('[Realtime] Test scores changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["test-scores"] });
          queryClient.invalidateQueries({ queryKey: ["test-names"] });
        }
      )
      // ========== GLOSSARY TABLES ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vocabulary' },
        (payload) => {
          console.log('[Realtime] Vocabulary changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'katakana_names' },
        (payload) => {
          console.log('[Realtime] Katakana names changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["katakana-names"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'religions' },
        (payload) => {
          console.log('[Realtime] Religions changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["religions"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referral_sources' },
        (payload) => {
          console.log('[Realtime] Referral sources changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["referral-sources"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'policy_categories' },
        (payload) => {
          console.log('[Realtime] Policy categories changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["policy-categories"] });
        }
      )
      // ========== USER & PERMISSIONS ==========
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        (payload) => {
          console.log('[Realtime] User roles changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["user-role"] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["all-users"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_menu_permissions' },
        (payload) => {
          console.log('[Realtime] User menu permissions changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["menu-permissions"] });
          queryClient.invalidateQueries({ queryKey: ["effective-permissions"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'department_members' },
        (payload) => {
          console.log('[Realtime] Department members changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["department-members"] });
          queryClient.invalidateQueries({ queryKey: ["department-counts"] });
          queryClient.invalidateQueries({ queryKey: ["effective-permissions"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'department_menu_permissions' },
        (payload) => {
          console.log('[Realtime] Department menu permissions changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["department-permissions"] });
          queryClient.invalidateQueries({ queryKey: ["effective-permissions"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menus' },
        (payload) => {
          console.log('[Realtime] Menus changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["menus"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('[Realtime] Profiles changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["profiles"] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["all-users"] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] System subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Cleaning up system channel');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Hook cho Orders module realtime
 */
export function useOrdersRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`orders-realtime-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Realtime] Orders changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Hook cho Partners module realtime (companies, unions, job_categories)
 */
export function usePartnersRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`partners-realtime-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        (payload) => {
          console.log('[Realtime] Companies changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["companies"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unions' },
        (payload) => {
          console.log('[Realtime] Unions changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["unions"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_categories' },
        (payload) => {
          console.log('[Realtime] Job categories changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["job_categories"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Hook cho Internal Union module realtime
 */
export function useInternalUnionRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`internal-union-realtime-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'union_members' },
        (payload) => {
          console.log('[Realtime] Union members changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["union-members"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'union_transactions' },
        (payload) => {
          console.log('[Realtime] Union transactions changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["union-transactions"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Hook cho Glossary module realtime
 */
export function useGlossaryRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`glossary-realtime-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vocabulary' },
        () => queryClient.invalidateQueries({ queryKey: ["vocabulary"] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'katakana_names' },
        () => queryClient.invalidateQueries({ queryKey: ["katakana-names"] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'religions' },
        () => queryClient.invalidateQueries({ queryKey: ["religions"] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referral_sources' },
        () => queryClient.invalidateQueries({ queryKey: ["referral-sources"] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'policy_categories' },
        () => queryClient.invalidateQueries({ queryKey: ["policy-categories"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
