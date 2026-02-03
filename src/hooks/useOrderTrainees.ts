import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrderTrainee {
  id: string;
  trainee_code: string;
  full_name: string;
  birth_date: string | null;
  birthplace: string | null;
  phone: string | null;
  interview_count: number;
}

// Các trạng thái được phép tham gia đơn hàng phỏng vấn
// CHỈ học viên "Chưa đậu" mới được gán vào đơn hàng để phỏng vấn
const ELIGIBLE_STAGES_FOR_ORDER = ["Chưa đậu"];

// Hook để lấy số lượng học viên tham gia mỗi đơn tuyển
// CHỈ đếm học viên có trạng thái "Chưa đậu" (eligible for interview)
export function useOrderTraineeCounts() {
  return useQuery({
    queryKey: ["order-trainee-counts"],
    queryFn: async () => {
      // Lấy tất cả orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, company_id, expected_interview_date");

      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return {};

      // Lấy tất cả interview_history
      const { data: interviews, error } = await supabase
        .from("interview_history")
        .select("company_id, interview_date, trainee_id");

      if (error) throw error;
      if (!interviews || interviews.length === 0) return {};

      // Lấy tất cả trainee IDs từ interview_history
      const allTraineeIds = [...new Set(interviews.map(i => i.trainee_id).filter(Boolean))];
      
      if (allTraineeIds.length === 0) return {};

      // Lấy thông tin progression_stage của tất cả học viên liên quan
      const { data: trainees, error: traineesError } = await supabase
        .from("trainees")
        .select("id, progression_stage")
        .in("id", allTraineeIds);

      if (traineesError) throw traineesError;

      // Tạo map trainee_id -> progression_stage
      const traineeStageMap: Record<string, string | null> = {};
      trainees?.forEach(t => {
        traineeStageMap[t.id] = t.progression_stage;
      });

      // Đếm số học viên cho mỗi đơn hàng - CHỈ đếm học viên "Chưa đậu"
      const counts: Record<string, number> = {};
      
      orders.forEach(order => {
        if (!order.company_id || !order.expected_interview_date) {
          counts[order.id] = 0;
          return;
        }

        const matchingTrainees = new Set<string>();
        
        interviews?.forEach(interview => {
          // Match dựa trên company_id và ngày phỏng vấn
          const isMatch = 
            interview.company_id === order.company_id &&
            interview.interview_date === order.expected_interview_date;
          
          if (isMatch && interview.trainee_id) {
            // Chỉ đếm học viên có trạng thái "Chưa đậu" hoặc null
            const stage = traineeStageMap[interview.trainee_id];
            if (!stage || ELIGIBLE_STAGES_FOR_ORDER.includes(stage)) {
              matchingTrainees.add(interview.trainee_id);
            }
          }
        });
        
        counts[order.id] = matchingTrainees.size;
      });

      return counts;
    },
  });
}

// Hook để lấy danh sách học viên tham gia một đơn tuyển cụ thể
// CHỈ hiển thị học viên "Chưa đậu" (eligible for interview)
export function useOrderTrainees(orderId: string | null, orderData?: {
  company_id: string | null;
  union_id: string | null;
  job_category_id: string | null;
  expected_interview_date: string | null;
}) {
  return useQuery({
    queryKey: ["order-trainees", orderId, orderData?.company_id, orderData?.expected_interview_date],
    queryFn: async () => {
      if (!orderId || !orderData) return [];
      if (!orderData.company_id || !orderData.expected_interview_date) return [];

      // Lấy danh sách interview_history khớp với đơn hàng này
      // Chỉ match theo company_id và interview_date vì union_id và job_category_id có thể null
      const { data: interviews, error } = await supabase
        .from("interview_history")
        .select("trainee_id")
        .eq("company_id", orderData.company_id)
        .eq("interview_date", orderData.expected_interview_date);

      if (error) throw error;
      if (!interviews || interviews.length === 0) return [];

      // Lấy unique trainee IDs
      const traineeIds = [...new Set(interviews.map(i => i.trainee_id))];
      if (traineeIds.length === 0) return [];

      // Lấy thông tin chi tiết học viên - CHỈ lấy học viên "Chưa đậu"
      const { data: trainees, error: traineesError } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, birth_date, birthplace, phone, progression_stage")
        .in("id", traineeIds);

      if (traineesError) throw traineesError;
      if (!trainees || trainees.length === 0) return [];

      // Filter: CHỈ giữ lại học viên "Chưa đậu" hoặc null (eligible for interview)
      const eligibleTrainees = trainees.filter(
        t => !t.progression_stage || ELIGIBLE_STAGES_FOR_ORDER.includes(t.progression_stage)
      );

      if (eligibleTrainees.length === 0) return [];

      // Lấy số lần tham gia phỏng vấn của mỗi học viên (từ interview_history)
      const eligibleIds = eligibleTrainees.map(t => t.id);
      const { data: allInterviews, error: allInterviewsError } = await supabase
        .from("interview_history")
        .select("trainee_id")
        .in("trainee_id", eligibleIds);

      if (allInterviewsError) throw allInterviewsError;

      // Đếm số lần phỏng vấn cho mỗi học viên
      const interviewCounts: Record<string, number> = {};
      allInterviews?.forEach(interview => {
        interviewCounts[interview.trainee_id] = (interviewCounts[interview.trainee_id] || 0) + 1;
      });

      // Kết hợp dữ liệu
      const result: OrderTrainee[] = eligibleTrainees.map(trainee => ({
        id: trainee.id,
        trainee_code: trainee.trainee_code,
        full_name: trainee.full_name,
        birth_date: trainee.birth_date,
        birthplace: trainee.birthplace,
        phone: trainee.phone,
        interview_count: interviewCounts[trainee.id] || 0,
      }));

      return result;
    },
    enabled: !!orderId && !!orderData?.company_id && !!orderData?.expected_interview_date,
  });
}
