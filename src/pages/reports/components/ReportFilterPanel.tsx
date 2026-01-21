import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReportFilters } from "../types";

const WORKFLOW_STAGES = ["recruited", "trained", "dormitory", "visa_processing", "ready_to_depart", "departed", "post_departure", "archived"] as const;
const TRAINEE_TYPES = ["TTS", "Tokutei", "Kỹ_sư"] as const;

const ALL_VALUE = "__all__";

interface ReportFilterPanelProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
}

export function ReportFilterPanel({ filters, onFiltersChange }: ReportFilterPanelProps) {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [unions, setUnions] = useState<{ id: string; name: string }[]>([]);
  const [jobCategories, setJobCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Fetch lookup data
    const fetchLookups = async () => {
      const [companiesRes, unionsRes, jobCategoriesRes] = await Promise.all([
        supabase.from("companies").select("id, name").order("name"),
        supabase.from("unions").select("id, name").order("name"),
        supabase.from("job_categories").select("id, name").order("name"),
      ]);

      if (companiesRes.data) setCompanies(companiesRes.data);
      if (unionsRes.data) setUnions(unionsRes.data);
      if (jobCategoriesRes.data) setJobCategories(jobCategoriesRes.data);
    };

    fetchLookups();
  }, []);

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    // Convert __all__ back to empty string for the filter
    const actualValue = value === ALL_VALUE ? "" : value;
    onFiltersChange({ ...filters, [key]: actualValue });
  };

  const resetFilters = () => {
    onFiltersChange({});
  };

  // Helper to convert empty/undefined to ALL_VALUE for Select
  const getSelectValue = (value: string | undefined) => {
    return value || ALL_VALUE;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const stageLabels: Record<string, string> = {
    recruited: "Mới tuyển dụng",
    trained: "Đang đào tạo",
    dormitory: "Chờ xuất cảnh",
    visa_processing: "Đang xử lý visa",
    ready_to_depart: "Sẵn sàng xuất cảnh",
    departed: "Đã xuất cảnh",
    post_departure: "Đang ở Nhật",
    archived: "Lưu trữ",
  };

  const typeLabels: Record<string, string> = {
    TTS: "Thực tập sinh (TTS)",
    Tokutei: "Tokutei Ginou",
    Kỹ_sư: "Kỹ sư",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Bộ lọc</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Đặt lại
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Time filters */}
        <div className="space-y-2">
          <Label>Năm tạo</Label>
          <Select value={getSelectValue(filters.year)} onValueChange={(v) => updateFilter("year", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả năm</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tháng tạo</Label>
          <Select value={getSelectValue(filters.month)} onValueChange={(v) => updateFilter("month", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả tháng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả tháng</SelectItem>
              {months.map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  Tháng {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stage filter */}
        <div className="space-y-2">
          <Label>Giai đoạn</Label>
          <Select value={getSelectValue(filters.current_stage)} onValueChange={(v) => updateFilter("current_stage", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả giai đoạn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả giai đoạn</SelectItem>
              {WORKFLOW_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stageLabels[stage] || stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trainee type filter */}
        <div className="space-y-2">
          <Label>Loại chương trình</Label>
          <Select value={getSelectValue(filters.trainee_type)} onValueChange={(v) => updateFilter("trainee_type", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả loại</SelectItem>
              {TRAINEE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {typeLabels[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender filter */}
        <div className="space-y-2">
          <Label>Giới tính</Label>
          <Select value={getSelectValue(filters.gender)} onValueChange={(v) => updateFilter("gender", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
              <SelectItem value="Nam">Nam</SelectItem>
              <SelectItem value="Nữ">Nữ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Company filter */}
        <div className="space-y-2">
          <Label>Công ty tiếp nhận</Label>
          <Select value={getSelectValue(filters.company_id)} onValueChange={(v) => updateFilter("company_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả công ty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả công ty</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Union filter */}
        <div className="space-y-2">
          <Label>Nghiệp đoàn</Label>
          <Select value={getSelectValue(filters.union_id)} onValueChange={(v) => updateFilter("union_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả nghiệp đoàn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả nghiệp đoàn</SelectItem>
              {unions.map((union) => (
                <SelectItem key={union.id} value={union.id}>
                  {union.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Job category filter */}
        <div className="space-y-2">
          <Label>Ngành nghề</Label>
          <Select value={getSelectValue(filters.job_category_id)} onValueChange={(v) => updateFilter("job_category_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả ngành" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả ngành</SelectItem>
              {jobCategories.map((jc) => (
                <SelectItem key={jc.id} value={jc.id}>
                  {jc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date range filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t">
        <div className="space-y-2">
          <Label>Xuất cảnh từ ngày</Label>
          <Input
            type="date"
            value={filters.departure_from || ""}
            onChange={(e) => updateFilter("departure_from", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Xuất cảnh đến ngày</Label>
          <Input
            type="date"
            value={filters.departure_to || ""}
            onChange={(e) => updateFilter("departure_to", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Đậu PV từ ngày</Label>
          <Input
            type="date"
            value={filters.interview_pass_from || ""}
            onChange={(e) => updateFilter("interview_pass_from", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Đậu PV đến ngày</Label>
          <Input
            type="date"
            value={filters.interview_pass_to || ""}
            onChange={(e) => updateFilter("interview_pass_to", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
