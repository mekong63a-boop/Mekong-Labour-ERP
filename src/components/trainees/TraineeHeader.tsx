import { Badge } from "@/components/ui/badge";
import { Trainee } from "@/types/trainee";

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
        {trainee.simple_status && (
          <Badge variant="outline" className="text-sm">
            {trainee.simple_status}
          </Badge>
        )}
        {trainee.progression_stage && (
          <Badge variant="secondary" className="text-sm">
            {trainee.progression_stage}
          </Badge>
        )}
      </div>
    </div>
  );
}
