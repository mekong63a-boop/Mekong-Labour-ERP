import { useParams, useNavigate } from "react-router-dom";
import { useTrainee } from "@/hooks/useTrainees";
import { TraineeHeader } from "@/components/trainees/TraineeHeader";
import { BasicInfoSection } from "@/components/trainees/BasicInfoSection";
import { LegalSection } from "@/components/trainees/LegalSection";
import { StatusTimeline } from "@/components/trainees/StatusTimeline";
import { ActionPanel } from "@/components/trainees/ActionPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function TraineeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trainee, isLoading, error } = useTrainee(id || "");

  if (error) {
    return (
      <div className="py-8">
        <div className="text-center text-destructive">
          Lỗi khi tải dữ liệu: {error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!trainee) {
    return (
      <div className="py-8">
        <div className="text-center text-muted-foreground">
          Không tìm thấy thực tập sinh
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/trainees")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TraineeHeader trainee={trainee} />
          <BasicInfoSection trainee={trainee} />
          <LegalSection trainee={trainee} />
          <StatusTimeline trainee={trainee} />
        </div>

        <div className="lg:col-span-1">
          <ActionPanel trainee={trainee} />
        </div>
      </div>
    </div>
  );
}
