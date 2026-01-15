import { StageCounts } from "@/hooks/useTraineeStageCounts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StageTabConfig {
  value: string;
  label: string;
  key: keyof StageCounts | null;
}

export const STAGE_TABS: StageTabConfig[] = [
  { value: "all", label: "Tất cả", key: "all" },
  { value: "chua_dau", label: "Chưa đậu", key: "Chưa đậu" },
  { value: "dau_pv", label: "Đậu phỏng vấn", key: "Đậu phỏng vấn" },
  { value: "nop_hs", label: "Nộp hồ sơ", key: "Nộp hồ sơ" },
  { value: "otit", label: "OTIT", key: "OTIT" },
  { value: "nyukan", label: "Nyukan", key: "Nyukan" },
  { value: "coe", label: "COE", key: "COE" },
  { value: "xuat_canh", label: "Xuất cảnh", key: "Xuất cảnh" },
  { value: "dang_lam", label: "Đang làm việc", key: "Đang làm việc" },
  { value: "bo_tron", label: "Bỏ trốn", key: "Bỏ trốn" },
  { value: "ve_truoc", label: "Về trước hạn", key: "Về trước hạn" },
  { value: "hoan_thanh", label: "Hoàn thành HĐ", key: "Hoàn thành hợp đồng" },
];

interface StageTabsGridProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  stageCounts?: StageCounts;
  isLoading?: boolean;
}

export function StageTabsGrid({ 
  activeTab, 
  onTabChange, 
  stageCounts, 
  isLoading 
}: StageTabsGridProps) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-muted/30 rounded-lg border">
      {STAGE_TABS.map((tab) => {
        const count = tab.key && stageCounts ? stageCounts[tab.key] : 0;
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
