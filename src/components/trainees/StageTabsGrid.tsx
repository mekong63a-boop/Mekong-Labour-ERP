import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PROGRESSION_STAGE_LABELS } from "@/lib/enum-labels";

// =============================================================================
// KHÓA CỨNG: Tên tab UI cho quản lý học viên
// SOURCE OF TRUTH cho nghiệp vụ vận hành
// Keys map to DB enum slugs, labels display Vietnamese
// =============================================================================

export interface StageCounts {
  all: number;
  'ChuaDau': number;
  'DauPV': number;
  'NopHS': number;
  'OTIT': number;
  'Nyukan': number;
  'COE': number;
  'Visa': number;
  'DaXuatCanh': number;
  'DangLamViec': number;
  'BoTron': number;
  'VeNuocSom': number;
  'HoanThanhHD': number;
}

interface StageTabConfig {
  value: string;
  label: string;
  key: keyof StageCounts;
}

// HARDCODED TAB CONFIG - Keys = DB enum slugs
export const STAGE_TABS: StageTabConfig[] = [
  { value: "all", label: "Tất cả", key: "all" },
  { value: "chua_dau", label: "Chưa đậu", key: "ChuaDau" },
  { value: "dau_pv", label: "Đậu phỏng vấn", key: "DauPV" },
  { value: "nop_hs", label: "Nộp hồ sơ", key: "NopHS" },
  { value: "otit", label: "OTIT", key: "OTIT" },
  { value: "nyukan", label: "Nyukan", key: "Nyukan" },
  { value: "coe", label: "COE", key: "COE" },
  { value: "xuat_canh", label: "Xuất cảnh", key: "DaXuatCanh" },
  { value: "bo_tron", label: "Bỏ trốn", key: "BoTron" },
  { value: "ve_truoc", label: "Về trước hạn", key: "VeNuocSom" },
  { value: "hoan_thanh", label: "Hoàn thành HĐ / về nước", key: "HoanThanhHD" },
];

// Mapping 1 chiều: UI tab key → progression_stage value (DB slug)
export function getProgressionStageFromTab(tabValue: string): string | null {
  const tab = STAGE_TABS.find(t => t.value === tabValue);
  if (!tab || tab.key === 'all') return null;
  return tab.key;
}

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
        const count = stageCounts ? stageCounts[tab.key] : 0;
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
