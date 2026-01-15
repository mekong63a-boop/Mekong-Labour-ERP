import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trainee } from "@/types/trainee";
import { Database } from "@/integrations/supabase/types";

type TraineeUpdate = Database["public"]["Tables"]["trainees"]["Update"];

export function useTrainees() {
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
