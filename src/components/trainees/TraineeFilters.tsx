import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Constants } from "@/integrations/supabase/types";
import { PROGRESSION_STAGE_LABELS, SIMPLE_STATUS_LABELS } from "@/lib/enum-labels";

interface TraineeFiltersProps {
  simpleStatus: string | null;
  progressionStage: string | null;
  onSimpleStatusChange: (value: string | null) => void;
  onProgressionStageChange: (value: string | null) => void;
}

export function TraineeFilters({
  simpleStatus,
  progressionStage,
  onSimpleStatusChange,
  onProgressionStageChange,
}: TraineeFiltersProps) {
  const simpleStatuses = Constants.public.Enums.simple_status;
  const progressionStages = Constants.public.Enums.progression_stage
    .filter((s) => s !== "Visa" && s !== "DangLamViec");

  return (
    <div className="flex gap-4 mb-4">
      <div className="w-48">
        <Select
          value={simpleStatus || "all"}
          onValueChange={(v) => onSimpleStatusChange(v === "all" ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {simpleStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {SIMPLE_STATUS_LABELS[status] || status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-48">
        <Select
          value={progressionStage || "all"}
          onValueChange={(v) => {
            onProgressionStageChange(v === "all" ? null : v);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Giai đoạn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả giai đoạn</SelectItem>
            {progressionStages.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
