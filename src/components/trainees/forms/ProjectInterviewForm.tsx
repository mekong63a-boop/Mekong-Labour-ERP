import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface ProjectInterviewFormProps {
  data: {
    order_id: string;
    interview_date: string;
    expected_entry_month: string;
    receiving_company_id: string;
    union_id: string;
    job_category_id: string;
    contract_term: string;
  };
  onChange: (data: any) => void;
}

export function ProjectInterviewForm({ data, onChange }: ProjectInterviewFormProps) {
  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ["orders-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, code")
        .eq("status", "active")
        .order("code");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ["companies-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, code, name, name_japanese")
        .eq("status", "Đang hợp tác")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch unions
  const { data: unions = [] } = useQuery({
    queryKey: ["unions-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unions")
        .select("id, code, name, name_japanese")
        .eq("status", "Đang hợp tác")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch job categories
  const { data: jobCategories = [] } = useQuery({
    queryKey: ["job-categories-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_categories")
        .select("id, code, name, name_japanese")
        .eq("status", "Hoạt động")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const orderOptions = orders.map((o) => ({
    value: o.id,
    label: o.code,
  }));

  const companyOptions = companies.map((c) => ({
    value: c.id,
    label: `${c.code} - ${c.name_japanese ? `${c.name} (${c.name_japanese})` : c.name}`,
  }));

  const unionOptions = unions.map((u) => ({
    value: u.id,
    label: `${u.code} - ${u.name_japanese ? `${u.name} (${u.name_japanese})` : u.name}`,
  }));

  const jobCategoryOptions = jobCategories.map((j) => ({
    value: j.id,
    label: `${j.code} - ${j.name_japanese ? `${j.name} (${j.name_japanese})` : j.name}`,
  }));

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary">
          <FileText className="h-5 w-5" />
          Thông tin Dự án & Phỏng vấn
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Row 1 */}
          <div>
            <Label className="text-xs text-muted-foreground">Đơn tuyển</Label>
            <SearchableSelect
              options={orderOptions}
              value={data.order_id}
              onValueChange={(v) => updateField("order_id", v)}
              placeholder="Chọn đơn tuyển"
              emptyText="Không có đơn tuyển"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Ngày phỏng vấn</Label>
            <Input
              type="date"
              value={data.interview_date}
              onChange={(e) => updateField("interview_date", e.target.value)}
              className={data.interview_date ? "bg-white" : "bg-amber-50 border-amber-200"}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tháng/Năm dự kiến nhập quốc</Label>
            <Input
              type="month"
              value={data.expected_entry_month}
              onChange={(e) => updateField("expected_entry_month", e.target.value)}
              className={data.expected_entry_month ? "bg-white" : "bg-amber-50 border-amber-200"}
            />
          </div>

          {/* Row 2 */}
          <div>
            <Label className="text-xs text-muted-foreground">Công ty tiếp nhận</Label>
            <SearchableSelect
              options={companyOptions}
              value={data.receiving_company_id}
              onValueChange={(v) => updateField("receiving_company_id", v)}
              placeholder="Chọn công ty"
              emptyText="Không có công ty"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Nghiệp đoàn</Label>
            <SearchableSelect
              options={unionOptions}
              value={data.union_id}
              onValueChange={(v) => updateField("union_id", v)}
              placeholder="Chọn nghiệp đoàn"
              emptyText="Không có nghiệp đoàn"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Ngành nghề</Label>
            <SearchableSelect
              options={jobCategoryOptions}
              value={data.job_category_id}
              onValueChange={(v) => updateField("job_category_id", v)}
              placeholder="Chọn ngành nghề"
              emptyText="Không có ngành nghề"
            />
          </div>

          {/* Row 3 - Contract Term */}
          <div>
            <Label className="text-xs text-muted-foreground">Thời hạn hợp đồng</Label>
            <SearchableSelect
              options={[
                { value: "1", label: "1 năm" },
                { value: "2", label: "2 năm" },
                { value: "3", label: "3 năm" },
                { value: "4", label: "4 năm" },
                { value: "5", label: "5 năm" },
              ]}
              value={data.contract_term}
              onValueChange={(v) => updateField("contract_term", v)}
              placeholder="Chọn thời hạn"
              emptyText="Không có thời hạn"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
