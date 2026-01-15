import { StageCounts } from "@/hooks/useTraineeStageCounts";
import { cn } from "@/lib/utils";
import { 
  Users, 
  UserCheck, 
  FileText, 
  ClipboardCheck, 
  Building2, 
  Award, 
  Stamp,
  Plane,
  Briefcase,
  UserX,
  Undo2,
  CheckCircle2
} from "lucide-react";

interface StageTabConfig {
  value: string;
  label: string;
  key: keyof StageCounts | null;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

export const STAGE_TABS: StageTabConfig[] = [
  { 
    value: "all", 
    label: "Tất cả", 
    key: "all",
    icon: Users,
    colorClass: "from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700"
  },
  { 
    value: "chua_dau", 
    label: "Chưa đậu", 
    key: "Chưa đậu",
    icon: UserCheck,
    colorClass: "from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600"
  },
  { 
    value: "dau_pv", 
    label: "Đậu phỏng vấn", 
    key: "Đậu phỏng vấn",
    icon: CheckCircle2,
    colorClass: "from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600"
  },
  { 
    value: "nop_hs", 
    label: "Nộp hồ sơ", 
    key: "Nộp hồ sơ",
    icon: FileText,
    colorClass: "from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600"
  },
  { 
    value: "otit", 
    label: "OTIT", 
    key: "OTIT",
    icon: ClipboardCheck,
    colorClass: "from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600"
  },
  { 
    value: "nyukan", 
    label: "Nyukan", 
    key: "Nyukan",
    icon: Building2,
    colorClass: "from-violet-400 to-violet-500 hover:from-violet-500 hover:to-violet-600"
  },
  { 
    value: "coe", 
    label: "COE", 
    key: "COE",
    icon: Award,
    colorClass: "from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600"
  },
  { 
    value: "visa", 
    label: "Visa", 
    key: "Visa",
    icon: Stamp,
    colorClass: "from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600"
  },
  { 
    value: "xuat_canh", 
    label: "Xuất cảnh", 
    key: "Xuất cảnh",
    icon: Plane,
    colorClass: "from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600"
  },
  { 
    value: "dang_lam", 
    label: "Đang làm việc", 
    key: "Đang làm việc",
    icon: Briefcase,
    colorClass: "from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600"
  },
  { 
    value: "bo_tron", 
    label: "Bỏ trốn", 
    key: "Bỏ trốn",
    icon: UserX,
    colorClass: "from-red-400 to-red-500 hover:from-red-500 hover:to-red-600"
  },
  { 
    value: "ve_truoc", 
    label: "Về trước hạn", 
    key: "Về trước hạn",
    icon: Undo2,
    colorClass: "from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600"
  },
  { 
    value: "hoan_thanh", 
    label: "Hoàn thành HĐ", 
    key: "Hoàn thành hợp đồng",
    icon: CheckCircle2,
    colorClass: "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
  },
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
      {STAGE_TABS.map((tab) => {
        const Icon = tab.icon;
        const count = tab.key && stageCounts ? stageCounts[tab.key] : 0;
        const isActive = activeTab === tab.value;
        
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-lg font-medium text-white transition-all duration-200 shadow-md",
              "bg-gradient-to-br",
              tab.colorClass,
              isActive && "ring-2 ring-offset-2 ring-offset-background ring-white/80 shadow-lg scale-105",
              !isActive && "opacity-85 hover:opacity-100 hover:shadow-lg hover:scale-102"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-semibold leading-tight text-center">
              {tab.label}
            </span>
            <span className={cn(
              "inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-full text-xs font-bold",
              "bg-white/25 backdrop-blur-sm"
            )}>
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                count.toLocaleString('vi-VN')
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
