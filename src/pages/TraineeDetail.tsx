import { useParams, useNavigate } from "react-router-dom";
import { useTrainee } from "@/hooks/useTrainees";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, History, Briefcase, Edit, Clock, Home } from "lucide-react";
import { PersonalInfoTab } from "@/components/trainees/tabs/PersonalInfoTab";
import { PersonalHistoryTab } from "@/components/trainees/tabs/PersonalHistoryTab";
import { ProjectInterviewTab } from "@/components/trainees/tabs/ProjectInterviewTab";
import { StageTimeline } from "@/components/trainees/StageTimeline";
import { StageTransitionPanel } from "@/components/trainees/StageTransitionPanel";
import { useStageTimeline } from "@/hooks/useStageTransition";
export default function TraineeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trainee, isLoading, error } = useTrainee(id || "");
  const { data: stageData } = useStageTimeline(id);

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
      <div className="py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
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

  // Get stage color for badge
  const stageColorMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-800",
    blue: "bg-blue-100 text-blue-800",
    cyan: "bg-cyan-100 text-cyan-800",
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    orange: "bg-orange-100 text-orange-800",
    purple: "bg-purple-100 text-purple-800",
    indigo: "bg-indigo-100 text-indigo-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
  };

  const currentStage = stageData?.current;

  return (
    <div className="space-y-6">
      {/* Header with current stage prominently displayed */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/trainees")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{trainee.full_name}</h1>
              <Badge className="bg-primary/10 text-primary">
                {trainee.trainee_code}
              </Badge>
              {/* Current Stage Badge - from State Machine */}
              {currentStage && (
                <Badge className={`${stageColorMap[currentStage.ui_color] || stageColorMap.gray}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {currentStage.stage_name}
                </Badge>
              )}
              {currentStage?.sub_status && (
                <Badge variant="outline" className="text-xs">
                  {currentStage.sub_status}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {trainee.trainee_type || "Thực tập sinh"} • 
              {trainee.furigana && ` ${trainee.furigana} •`} 
              {trainee.gender || "—"}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/trainees/${id}/edit`)} className="gap-2">
          <Edit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </div>

      {/* Stage Transition Panel - Actions based on current stage */}
      <StageTransitionPanel traineeId={trainee.id} traineeName={trainee.full_name} />

      {/* Tabs - Single Source View */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            Thông tin cá nhân
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Lý lịch cá nhân
          </TabsTrigger>
          <TabsTrigger value="project" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Dự án & Phỏng vấn
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            Lịch sử trạng thái
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <PersonalInfoTab trainee={trainee} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <PersonalHistoryTab traineeId={trainee.id} />
        </TabsContent>

        <TabsContent value="project" className="mt-6">
          <ProjectInterviewTab trainee={trainee} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <StageTimeline traineeId={trainee.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
