import { Badge } from "@/components/ui/badge";
import { Trainee } from "@/types/trainee";
import { getStageLabel, getStatusLabel, getTypeLabel } from "@/lib/enum-labels";

interface TraineeHeaderProps {
  trainee: Trainee;
}

export function TraineeHeader({ trainee }: TraineeHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold">{trainee.full_name}</h1>
        {trainee.furigana && (
          <p className="text-muted-foreground">{trainee.furigana}</p>
        )}
        <p className="text-sm text-muted-foreground font-mono mt-1">
          {trainee.trainee_code}
        </p>
      </div>
      <div className="flex gap-2">
        {trainee.trainee_type && (
          <Badge variant="outline" className="text-sm">
            {getTypeLabel(trainee.trainee_type)}
          </Badge>
        )}
        {trainee.simple_status && (
          <Badge variant="outline" className="text-sm">
            {getStatusLabel(trainee.simple_status)}
          </Badge>
        )}
        {trainee.progression_stage && (
          <Badge variant="secondary" className="text-sm">
            {getStageLabel(trainee.progression_stage)}
          </Badge>
        )}
      </div>
    </div>
  );
}
