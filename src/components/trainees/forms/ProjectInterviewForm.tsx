import { useQuery } from "@tanstack/react-query";
import { FileText, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
  onInterviewDateChange?: (date: string) => void; // Callback to sync interview_pass_date
  traineeId?: string; // For finalize action
}

export function ProjectInterviewForm({ data, onChange, onInterviewDateChange, traineeId }: ProjectInterviewFormProps) {
  const queryClient = useQueryClient();
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Fetch orders with full details
  const { data: orders = [] } = useQuery({
    queryKey: ["orders-select-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, 
          code, 
          company_id, 
          union_id, 
          job_category_id, 
          expected_interview_date, 
          contract_term,
          status,
          quantity,
          companies:companies!fk_orders_company(id, name, name_japanese, code),
          unions:unions!fk_orders_union(id, name, name_japanese, code),
          job_categories:job_categories!fk_orders_job_category(id, name, name_japanese, code)
        `)
        .eq("status", "Đang tuyển")
        .order("code", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Finalize interview draft into history
  const handleFinalizeInterview = async () => {
    if (!traineeId || !data.interview_date) {
      toast.error("Vui lòng nhập ngày phỏng vấn");
      return;
    }

    setIsFinalizing(true);
    try {
      const { error } = await supabase.rpc("finalize_interview_draft", {
        p_trainee_id: traineeId,
        p_interview_date: data.interview_date,
        p_result: null, // Placeholder, will be updated via workflow
      });

      if (error) throw error;

      toast.success("Đã lưu lịch sử phỏng vấn");
      queryClient.invalidateQueries({ queryKey: ["interview-history", traineeId] });
    } catch (error) {
      console.error("Error finalizing interview:", error);
      toast.error("Không thể lưu lịch sử phỏng vấn");
    } finally {
      setIsFinalizing(false);
    }
  };

  // Fetch companies - sorted by code descending (same as Partners)
  const { data: companies = [] } = useQuery({
    queryKey: ["companies-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, code, name, name_japanese")
        .eq("status", "Đang hợp tác")
        .order("code", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch unions - sorted by code descending (same as Partners)
  const { data: unions = [] } = useQuery({
    queryKey: ["unions-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unions")
        .select("id, code, name, name_japanese")
        .eq("status", "Đang hợp tác")
        .order("code", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch job categories - sorted by code descending (same as Partners)
  const { data: jobCategories = [] } = useQuery({
    queryKey: ["job-categories-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_categories")
        .select("id, code, name, name_japanese")
        .eq("status", "Hoạt động")
        .order("code", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Get selected order details
  const selectedOrder = useMemo(() => {
    return orders.find((o: any) => o.id === data.order_id);
  }, [orders, data.order_id]);

  // Auto-fill fields when order is selected
  useEffect(() => {
    if (selectedOrder && data.order_id) {
      const newData = { ...data };
      let hasChanges = false;

      // Auto-fill company if order has company_id
      if (selectedOrder.company_id && !data.receiving_company_id) {
        newData.receiving_company_id = selectedOrder.company_id;
        hasChanges = true;
      }

      // Auto-fill union if order has union_id
      if (selectedOrder.union_id && !data.union_id) {
        newData.union_id = selectedOrder.union_id;
        hasChanges = true;
      }

      // Auto-fill job category if order has job_category_id
      if (selectedOrder.job_category_id && !data.job_category_id) {
        newData.job_category_id = selectedOrder.job_category_id;
        hasChanges = true;
      }

      // Auto-fill interview date from expected_interview_date
      if (selectedOrder.expected_interview_date && !data.interview_date) {
        newData.interview_date = selectedOrder.expected_interview_date;
        hasChanges = true;
      }

      // Auto-fill contract term
      if (selectedOrder.contract_term && !data.contract_term) {
        newData.contract_term = selectedOrder.contract_term.toString();
        hasChanges = true;
      }

      if (hasChanges) {
        onChange(newData);
      }
    }
  }, [selectedOrder, data.order_id]);

  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
    // Auto-sync interview_pass_date when interview_date changes
    if (field === "interview_date" && onInterviewDateChange) {
      onInterviewDateChange(value);
    }
  };

  // Handle order selection - force fill all fields from order
  const handleOrderSelect = (orderId: string) => {
    const order = orders.find((o: any) => o.id === orderId);
    if (order) {
      const interviewDate = order.expected_interview_date || data.interview_date;
      onChange({
        ...data,
        order_id: orderId,
        receiving_company_id: order.company_id || data.receiving_company_id,
        union_id: order.union_id || data.union_id,
        job_category_id: order.job_category_id || data.job_category_id,
        interview_date: interviewDate,
        contract_term: order.contract_term ? order.contract_term.toString() : data.contract_term,
      });
      // Also sync interview_pass_date when order is selected
      if (order.expected_interview_date && onInterviewDateChange) {
        onInterviewDateChange(interviewDate);
      }
    } else {
      updateField("order_id", orderId);
    }
  };

  const orderOptions = orders.map((o: any) => {
    const companyName = o.companies?.name || "Chưa có công ty";
    const unionName = o.unions?.name || "";
    const jobName = o.job_categories?.name || "";
    const details = [companyName, unionName, jobName].filter(Boolean).join(" - ");
    return {
      value: o.id,
      label: `${o.code}${details ? ` (${details})` : ""}`,
    };
  });

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
          {/* Row 1 - Order Selection */}
          <div className="md:col-span-3">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />
              Chọn đơn tuyển (tự động điền thông tin)
            </Label>
            <SearchableSelect
              options={orderOptions}
              value={data.order_id}
              onValueChange={handleOrderSelect}
              placeholder="Chọn đơn tuyển để tự động điền thông tin..."
              emptyText="Không có đơn tuyển đang hoạt động"
            />
            {selectedOrder && (
              <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Số lượng: {selectedOrder.quantity || 0}
                  </Badge>
                  {selectedOrder.companies?.name && (
                    <Badge variant="secondary" className="text-xs">
                      CT: {selectedOrder.companies.name}
                    </Badge>
                  )}
                  {selectedOrder.unions?.name && (
                    <Badge variant="secondary" className="text-xs">
                      NĐ: {selectedOrder.unions.name}
                    </Badge>
                  )}
                  {selectedOrder.job_categories?.name && (
                    <Badge variant="secondary" className="text-xs">
                      NN: {selectedOrder.job_categories.name}
                    </Badge>
                  )}
                  {selectedOrder.expected_interview_date && (
                    <Badge variant="secondary" className="text-xs">
                      PV: {selectedOrder.expected_interview_date}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Row 2 */}
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
          <div>
            <Label className="text-xs text-muted-foreground">Thời hạn hợp đồng</Label>
            <SearchableSelect
              options={[
                { value: "0.5", label: "6 tháng" },
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

          {/* Row 3 */}
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

          {/* Finalize Button */}
          {traineeId && data.interview_date && (
            <div className="md:col-span-3 flex gap-2 pt-2">
              <Button
                onClick={handleFinalizeInterview}
                disabled={isFinalizing}
                variant="default"
                className="flex-1"
              >
                {isFinalizing ? "Đang lưu..." : "Lưu lịch sử phỏng vấn"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
