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

// Hook để lấy số lượng học viên tham gia mỗi đơn tuyển
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

      // Đếm số học viên cho mỗi đơn hàng - chỉ match theo company_id và interview_date
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
            matchingTrainees.add(interview.trainee_id);
          }
        });
        
        counts[order.id] = matchingTrainees.size;
      });

      return counts;
    },
  });
}

// Các trạng thái đã xuất cảnh - học viên ở đây không được phép gán vào đơn hàng phỏng vấn
const DEPARTED_STAGES = ["Xuất cảnh", "Đang làm việc", "Bỏ trốn", "Về trước hạn", "Hoàn thành hợp đồng"];

// Hook để lấy danh sách học viên tham gia một đơn tuyển cụ thể
// CHỈ hiển thị học viên chưa xuất cảnh (dựa trên progression_stage)
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

      // Lấy thông tin chi tiết học viên - LOẠI TRỪ học viên đã xuất cảnh
      const { data: trainees, error: traineesError } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, birth_date, birthplace, phone, progression_stage")
        .in("id", traineeIds);

      if (traineesError) throw traineesError;
      if (!trainees || trainees.length === 0) return [];

      // Filter: chỉ giữ lại học viên CHƯA xuất cảnh
      const eligibleTrainees = trainees.filter(
        t => !t.progression_stage || !DEPARTED_STAGES.includes(t.progression_stage)
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
