import { useParams, useNavigate } from "react-router-dom";
import { useTrainee } from "@/hooks/useTrainees";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, History, Briefcase, Edit, Lock, FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PersonalInfoTab } from "@/components/trainees/tabs/PersonalInfoTab";
import { PersonalHistoryTab } from "@/components/trainees/tabs/PersonalHistoryTab";
import { ProjectInterviewTab } from "@/components/trainees/tabs/ProjectInterviewTab";
import { useUserRole } from "@/hooks/useUserRole";
import { usePresence } from "@/hooks/usePresence";
import { PresenceIndicator } from "@/components/trainees/PresenceIndicator";
import { getStageLabel, getTypeLabel } from "@/lib/enum-labels";

export default function TraineeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trainee, isLoading, error } = useTrainee(id || "");
  const { isAdmin } = useUserRole();
  const [isExporting, setIsExporting] = useState(false);
  const { onlineUsers } = usePresence(id ? `trainee-detail:${id}` : null);

  const handleExportRirekisho = async () => {
    if (!trainee?.trainee_code) return;
    setIsExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";
      const projectId = "bcltzwpnhfpbfiuhfkxi";
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/export-rirekisho?trainee_code=${encodeURIComponent(trainee.trainee_code)}`,
        { headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Lỗi xuất file");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename\*=UTF-8''(.+)/);
      const serverName = match ? decodeURIComponent(match[1]) : null;
      a.download = serverName || `${trainee.trainee_code} - 履歴書 - ${(trainee.full_name || "").toUpperCase()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Xuất lí lịch thành công");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xuất lí lịch");
    } finally {
      setIsExporting(false);
    }
  };

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
              {trainee.is_locked && (
                <Badge variant="destructive" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Đã khóa
                </Badge>
              )}
              {trainee.progression_stage && (
                <Badge variant="outline">
                  {getStageLabel(trainee.progression_stage)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {getTypeLabel(trainee.trainee_type) || "Thực tập sinh"} • 
              {trainee.furigana && ` ${trainee.furigana} •`} 
              {trainee.gender || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PresenceIndicator onlineUsers={onlineUsers} />
          <Button
            variant="outline"
            onClick={handleExportRirekisho}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Xuất lí lịch
          </Button>
          {(!trainee.is_locked || isAdmin) && (
            <Button onClick={() => navigate(`/trainees/${id}/edit`)} className="gap-2">
              <Edit className="h-4 w-4" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
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
