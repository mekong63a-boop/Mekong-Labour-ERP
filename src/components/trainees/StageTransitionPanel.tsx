import { useState } from "react";
import { useAllowedTransitions, useTransitionStage, useTerminatedReasons, useMasterStages } from "@/hooks/useStageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, AlertTriangle, CheckCircle2, Loader2, Settings2 } from "lucide-react";
import { useCanAction } from "@/hooks/useMenuPermissions";

interface StageTransitionPanelProps {
  traineeId: string;
  traineeName?: string;
}

const stageColorMap: Record<string, string> = {
  slate: "bg-slate-100 text-slate-800 hover:bg-slate-200",
  blue: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  cyan: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
  green: "bg-green-100 text-green-800 hover:bg-green-200",
  amber: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  orange: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  purple: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  indigo: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
  red: "bg-red-100 text-red-800 hover:bg-red-200",
  gray: "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

export function StageTransitionPanel({ traineeId, traineeName }: StageTransitionPanelProps) {
  const { data, isLoading } = useAllowedTransitions(traineeId);
  const { data: terminatedReasons } = useTerminatedReasons();
  const { data: masterStages } = useMasterStages();
  const transitionMutation = useTransitionStage();
  
  // Check if user can edit stage directly (via trainees update permission)
  const { hasPermission: canEditStage } = useCanAction("trainees", "update");

  const [selectedTransition, setSelectedTransition] = useState<{
    to_stage: string;
    stage_name: string;
    requires_fields: string[] | null;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [directSelectMode, setDirectSelectMode] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>("");

  const handleSelectTransition = (transition: typeof selectedTransition) => {
    setSelectedTransition(transition);
    setReason("");
    setSubStatus("");
    setDirectSelectMode(false);
    setDialogOpen(true);
  };

  // Handle direct stage selection from dropdown
  const handleDirectStageSelect = (stageCode: string) => {
    const stage = masterStages?.find(s => s.stage_code === stageCode);
    if (!stage) return;
    
    setSelectedStage(stageCode);
    setSelectedTransition({
      to_stage: stageCode,
      stage_name: stage.stage_name,
      requires_fields: null, // Direct mode skips validation (admin override)
    });
    setReason("");
    setSubStatus("");
    setDirectSelectMode(true);
    setDialogOpen(true);
  };

  const handleConfirmTransition = async () => {
    if (!selectedTransition) return;

    await transitionMutation.mutateAsync({
      traineeId,
      toStage: selectedTransition.to_stage,
      subStatus: selectedTransition.to_stage === "terminated" ? subStatus : undefined,
      reason: reason || undefined,
    });

    setDialogOpen(false);
    setSelectedTransition(null);
    setSelectedStage("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { current_stage, transitions } = data || { current_stage: null, transitions: [] };

  if (!current_stage) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Chưa có workflow cho học viên này
        </CardContent>
      </Card>
    );
  }

  // Filter out current stage from master stages list
  const availableStages = masterStages?.filter(s => s.stage_code !== current_stage) || [];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Chuyển trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick transitions - workflow-based */}
          {transitions && transitions.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Chuyển nhanh:</p>
              <div className="flex flex-wrap gap-2">
                {transitions.map((transition) => (
                  <Button
                    key={transition.to_stage}
                    variant="outline"
                    size="sm"
                    className={`${stageColorMap[transition.ui_color] || stageColorMap.gray} border`}
                    onClick={() => handleSelectTransition(transition)}
                    disabled={transitionMutation.isPending}
                  >
                    {transition.stage_name}
                    {transition.requires_fields && transition.requires_fields.length > 0 && (
                      <AlertTriangle className="h-3 w-3 ml-1 text-amber-600" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {transitions && transitions.some(t => t.requires_fields && t.requires_fields.length > 0) && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Có điều kiện yêu cầu trước khi chuyển
            </p>
          )}

          {/* Direct stage selection - for authorized users */}
          {canEditStage && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Chọn giai đoạn trực tiếp (Admin):</p>
              </div>
              <Select 
                value={selectedStage} 
                onValueChange={handleDirectStageSelect}
                disabled={transitionMutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn giai đoạn bất kỳ..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStages.map((stage) => (
                    <SelectItem key={stage.stage_code} value={stage.stage_code}>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${stageColorMap[stage.ui_color] || stageColorMap.gray} text-xs`}
                        >
                          {stage.order_index}
                        </Badge>
                        {stage.stage_name}
                        {stage.stage_name_jp && (
                          <span className="text-muted-foreground text-xs">({stage.stage_name_jp})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(!transitions || transitions.length === 0) && !canEditStage && (
            <p className="text-sm text-muted-foreground">
              Không có chuyển đổi khả dụng từ trạng thái hiện tại
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Xác nhận chuyển trạng thái
            </DialogTitle>
            <DialogDescription>
              Chuyển {traineeName ? `"${traineeName}"` : "học viên"} sang trạng thái{" "}
              <Badge variant="secondary">{selectedTransition?.stage_name}</Badge>
              {directSelectMode && (
                <span className="block mt-2 text-amber-600 text-xs">
                  ⚠️ Chế độ Admin - bỏ qua kiểm tra điều kiện
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Required fields warning - only for workflow transitions */}
            {!directSelectMode && selectedTransition?.requires_fields && selectedTransition.requires_fields.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Yêu cầu điền đủ thông tin:
                </p>
                <ul className="text-sm text-amber-700 mt-1 ml-6 list-disc">
                  {selectedTransition.requires_fields.map((field) => (
                    <li key={field}>{fieldLabels[field] || field}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sub-status for terminated */}
            {selectedTransition?.to_stage === "terminated" && (
              <div className="space-y-2">
                <Label>Lý do kết thúc *</Label>
                <Select value={subStatus} onValueChange={setSubStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn lý do" />
                  </SelectTrigger>
                  <SelectContent>
                    {terminatedReasons?.map((r) => (
                      <SelectItem key={r.reason_code} value={r.reason_code}>
                        {r.reason_name} {r.reason_name_jp && `(${r.reason_name_jp})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason input */}
            <div className="space-y-2">
              <Label>Ghi chú {directSelectMode ? "(khuyến nghị điền lý do)" : "(tùy chọn)"}</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do hoặc ghi chú..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirmTransition}
              disabled={
                transitionMutation.isPending ||
                (selectedTransition?.to_stage === "terminated" && !subStatus)
              }
            >
              {transitionMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Field labels for display
const fieldLabels: Record<string, string> = {
  class_id: "Lớp học",
  receiving_company_id: "Công ty tiếp nhận",
  visa_date: "Ngày cấp Visa",
  coe_date: "Ngày cấp COE",
  departure_date: "Ngày xuất cảnh",
  entry_date: "Ngày nhập cảnh Nhật",
};