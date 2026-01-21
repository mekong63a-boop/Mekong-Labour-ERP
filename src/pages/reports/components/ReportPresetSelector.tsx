import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Users, Plane, GraduationCap, Building2, Archive, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { REPORT_PRESETS, ReportPreset } from "../types";

interface ReportPresetSelectorProps {
  selectedPreset: string | null;
  onSelectPreset: (preset: ReportPreset) => void;
}

const presetIcons: Record<string, React.ReactNode> = {
  all_trainees: <Users className="h-5 w-5" />,
  departed: <Plane className="h-5 w-5" />,
  interview_passed: <CheckCircle className="h-5 w-5" />,
  training: <GraduationCap className="h-5 w-5" />,
  post_departure: <Building2 className="h-5 w-5" />,
  archived: <Archive className="h-5 w-5" />,
};

export function ReportPresetSelector({ selectedPreset, onSelectPreset }: ReportPresetSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Chọn hạng mục báo cáo</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORT_PRESETS.map((preset) => (
          <Card
            key={preset.key}
            className={cn(
              "cursor-pointer transition-all hover:border-primary hover:shadow-md",
              selectedPreset === preset.key && "border-primary bg-primary/5 ring-1 ring-primary"
            )}
            onClick={() => onSelectPreset(preset)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  selectedPreset === preset.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {presetIcons[preset.key] || <FileSpreadsheet className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">{preset.label}</h4>
                    {selectedPreset === preset.key && (
                      <Badge variant="default" className="shrink-0">Đã chọn</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
