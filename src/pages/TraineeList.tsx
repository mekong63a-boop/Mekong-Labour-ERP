import { useState, useMemo } from "react";
import { useTrainees } from "@/hooks/useTrainees";
import { TraineeFilters } from "@/components/trainees/TraineeFilters";
import { TraineeTable } from "@/components/trainees/TraineeTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function TraineeList() {
  const { data: trainees, isLoading, error } = useTrainees();
  const [simpleStatus, setSimpleStatus] = useState<string | null>(null);
  const [progressionStage, setProgressionStage] = useState<string | null>(null);

  const filteredTrainees = useMemo(() => {
    if (!trainees) return [];

    return trainees.filter((trainee) => {
      if (simpleStatus && trainee.simple_status !== simpleStatus) return false;
      if (progressionStage && trainee.progression_stage !== progressionStage)
        return false;
      return true;
    });
  }, [trainees, simpleStatus, progressionStage]);

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center text-destructive">
          Lỗi khi tải dữ liệu: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Danh sách thực tập sinh</h1>
      </div>

      <TraineeFilters
        simpleStatus={simpleStatus}
        progressionStage={progressionStage}
        onSimpleStatusChange={setSimpleStatus}
        onProgressionStageChange={setProgressionStage}
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <TraineeTable trainees={filteredTrainees} />
      )}
    </div>
  );
}
