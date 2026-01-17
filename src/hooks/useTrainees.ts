import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trainee } from "@/types/trainee";
import { Database } from "@/integrations/supabase/types";

type TraineeUpdate = Database["public"]["Tables"]["trainees"]["Update"];

/**
 * Hook để lắng nghe realtime changes từ trainees table
 * Tự động invalidate queries khi có thay đổi từ bất kỳ browser nào
 */
export function useTraineesRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Create unique channel to avoid conflicts
    const channelId = `trainees-realtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trainees',
        },
        (payload) => {
          console.log('[Realtime] Trainee data changed:', payload.eventType);
          // Invalidate all trainee-related queries
          queryClient.invalidateQueries({ queryKey: ["trainees"] });
          queryClient.invalidateQueries({ queryKey: ["trainees-paginated"] });
          queryClient.invalidateQueries({ queryKey: ["trainee-stage-counts"] });
          queryClient.invalidateQueries({ queryKey: ["trainees-count"] });
          queryClient.invalidateQueries({ queryKey: ["class-students"] });
          
          // If it's an update/delete for a specific trainee, invalidate that too
          if (payload.old && (payload.old as any).id) {
            queryClient.invalidateQueries({ queryKey: ["trainee", (payload.old as any).id] });
          }
          if (payload.new && (payload.new as any).id) {
            queryClient.invalidateQueries({ queryKey: ["trainee", (payload.new as any).id] });
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Trainees subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Cleaning up trainees channel');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useTrainees() {
  // Subscribe to realtime changes
  useTraineesRealtime();
  
  return useQuery({
    queryKey: ["trainees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Trainee[];
    },
  });
}

export function useTrainee(id: string) {
  return useQuery({
    queryKey: ["trainee", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Trainee;
    },
    enabled: !!id,
  });
}

export function useUpdateTrainee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TraineeUpdate }) => {
      const { data, error } = await supabase
        .from("trainees")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["trainee", data.id] });
    },
  });
}

export function useDeleteTrainee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trainees")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["trainee-stage-counts"] });
    },
  });
}
