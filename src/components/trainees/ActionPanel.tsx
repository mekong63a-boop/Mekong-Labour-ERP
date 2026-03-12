import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trainee } from "@/types/trainee";
import { useUpdateTrainee } from "@/hooks/useTrainees";
import { useToast } from "@/hooks/use-toast";
import { Constants } from "@/integrations/supabase/types";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ActionPanelProps {
  trainee: Trainee;
}

export function ActionPanel({ trainee }: ActionPanelProps) {
  const updateTrainee = useUpdateTrainee();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(trainee.simple_status || "");
  const [selectedStage, setSelectedStage] = useState(trainee.progression_stage || "");

  const simpleStatuses = Constants.public.Enums.simple_status;
  const progressionStages = Constants.public.Enums.progression_stage;

  // Chỉ Admin có quyền thao tác
  const canManage = isAdmin;

  const handleStatusChange = async () => {
    try {
      await updateTrainee.mutateAsync({
        id: trainee.id,
        updates: {
          simple_status: selectedStatus as Trainee["simple_status"],
        },
      });
      toast({ title: "Đã cập nhật trạng thái" });
    } catch {
      toast({ title: "Lỗi khi cập nhật", variant: "destructive" });
    }
  };

  const handleStageChange = async () => {
    try {
      await updateTrainee.mutateAsync({
        id: trainee.id,
        updates: {
          progression_stage: selectedStage as Trainee["progression_stage"],
        },
      });
      toast({ title: "Đã cập nhật giai đoạn" });
    } catch {
      toast({ title: "Lỗi khi cập nhật", variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    try {
      await updateTrainee.mutateAsync({
        id: trainee.id,
        updates: {
          simple_status: "Huy",
        },
      });
      toast({ title: "Đã hủy thực tập sinh" });
    } catch {
      toast({ title: "Lỗi khi hủy", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thao tác</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canManage && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Chuyển trạng thái</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {simpleStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={handleStatusChange}
                disabled={updateTrainee.isPending || selectedStatus === trainee.simple_status}
              >
                Cập nhật trạng thái
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Chuyển giai đoạn</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giai đoạn" />
                </SelectTrigger>
                <SelectContent>
                  {progressionStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={handleStageChange}
                disabled={updateTrainee.isPending || selectedStage === trainee.progression_stage}
              >
                Cập nhật giai đoạn
              </Button>
            </div>

            <div className="border-t pt-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancel}
                disabled={updateTrainee.isPending || trainee.simple_status === "Huy"}
              >
                Hủy thực tập sinh
              </Button>
            </div>
          </>
        )}

        {!canManage && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Bạn không có quyền thực hiện thao tác này
          </p>
        )}
      </CardContent>
    </Card>
  );
}
