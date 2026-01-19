import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  WorkflowStageCounts, 
  WorkflowStage, 
  WORKFLOW_STAGE_LABELS 
} from "@/hooks/useWorkflowStageCounts";

interface WorkflowStageTabConfig {
  value: string;
  label: string;
  stageKey: 'all' | WorkflowStage;
}

// Tab configurations mapping to workflow stages
export const WORKFLOW_STAGE_TABS: WorkflowStageTabConfig[] = [
  { value: "all", label: "Tất cả", stageKey: "all" },
  { value: "recruited", label: WORKFLOW_STAGE_LABELS.recruited, stageKey: "recruited" },
  { value: "trained", label: WORKFLOW_STAGE_LABELS.trained, stageKey: "trained" },
  { value: "dormitory", label: WORKFLOW_STAGE_LABELS.dormitory, stageKey: "dormitory" },
  { value: "visa_processing", label: WORKFLOW_STAGE_LABELS.visa_processing, stageKey: "visa_processing" },
  { value: "ready_to_depart", label: WORKFLOW_STAGE_LABELS.ready_to_depart, stageKey: "ready_to_depart" },
  { value: "departed", label: WORKFLOW_STAGE_LABELS.departed, stageKey: "departed" },
  { value: "post_departure", label: WORKFLOW_STAGE_LABELS.post_departure, stageKey: "post_departure" },
  { value: "archived", label: WORKFLOW_STAGE_LABELS.archived, stageKey: "archived" },
];

interface WorkflowStageTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  stageCounts?: WorkflowStageCounts;
  isLoading?: boolean;
}

export function WorkflowStageTabs({ 
  activeTab, 
  onTabChange, 
  stageCounts, 
  isLoading 
}: WorkflowStageTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-muted/30 rounded-lg border">
      {WORKFLOW_STAGE_TABS.map((tab) => {
        const count = stageCounts ? stageCounts[tab.stageKey] : 0;
        const isActive = activeTab === tab.value;
        
        return (
          <Button
            key={tab.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "h-8 px-3 text-xs font-medium transition-all",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-background hover:bg-muted border-border"
            )}
          >
            {tab.label}
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[20px] text-center",
              isActive 
                ? "bg-primary-foreground/20" 
                : "bg-muted-foreground/10"
            )}>
              {isLoading ? "..." : count.toLocaleString('vi-VN')}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
