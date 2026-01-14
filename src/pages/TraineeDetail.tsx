import { useParams, useNavigate } from "react-router-dom";
import { useTrainee } from "@/hooks/useTrainees";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, History, Briefcase, Edit } from "lucide-react";
import { PersonalInfoTab } from "@/components/trainees/tabs/PersonalInfoTab";
import { PersonalHistoryTab } from "@/components/trainees/tabs/PersonalHistoryTab";
import { ProjectInterviewTab } from "@/components/trainees/tabs/ProjectInterviewTab";

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

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{trainee.full_name}</h1>
              <Badge className="bg-primary/10 text-primary">
                {trainee.trainee_code}
              </Badge>
              <Badge variant="secondary">
                {trainee.progression_stage || "Chưa đậu"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {trainee.trainee_type || "Thực tập sinh"} • 
              {trainee.furigana && ` ${trainee.furigana} •`} 
              {trainee.gender || "—"}
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
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
      </Tabs>
    </div>
  );
}
