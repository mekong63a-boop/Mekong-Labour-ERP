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
  progression_stage: string | null;
}

// Hook để lấy số lượng học viên tham gia mỗi đơn tuyển
// Đếm TẤT CẢ học viên tham gia phỏng vấn (dù đậu hay chưa đậu)
export function useOrderTraineeCounts() {
  return useQuery({
    queryKey: ["order-trainee-counts"],
    staleTime: 0,
    queryFn: async () => {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, company_id, expected_interview_date");

      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return {};

      const { data: interviews, error } = await supabase
        .from("interview_history")
        .select("company_id, interview_date, trainee_id");

      if (error) throw error;
      if (!interviews || interviews.length === 0) return {};

      // Đếm TẤT CẢ học viên tham gia (không filter eligible)
      const counts: Record<string, number> = {};
      
      orders.forEach(order => {
        if (!order.company_id || !order.expected_interview_date) {
          counts[order.id] = 0;
          return;
        }

        const matchingTrainees = new Set<string>();
        
        interviews?.forEach(interview => {
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

// Hook để lấy danh sách học viên tham gia một đơn tuyển cụ thể
// Hiển thị TẤT CẢ học viên tham gia (dù đậu hay chưa đậu)
export function useOrderTrainees(orderId: string | null, orderData?: {
  company_id: string | null;
  union_id: string | null;
  job_category_id: string | null;
  expected_interview_date: string | null;
}) {
  return useQuery({
    queryKey: ["order-trainees", orderId, orderData?.company_id, orderData?.expected_interview_date],
    staleTime: 0,
    queryFn: async () => {
      if (!orderId || !orderData) return [];
      if (!orderData.company_id || !orderData.expected_interview_date) return [];

      const { data: interviews, error } = await supabase
        .from("interview_history")
        .select("trainee_id")
        .eq("company_id", orderData.company_id)
        .eq("interview_date", orderData.expected_interview_date);

      if (error) throw error;
      if (!interviews || interviews.length === 0) return [];

      const traineeIds = [...new Set(interviews.map(i => i.trainee_id))];
      if (traineeIds.length === 0) return [];

      const { data: trainees, error: traineesError } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, birth_date, birthplace, phone, progression_stage")
        .in("id", traineeIds);

      if (traineesError) throw traineesError;
      if (!trainees || trainees.length === 0) return [];

      // Lấy số lần tham gia phỏng vấn
      const { data: allInterviews, error: allInterviewsError } = await supabase
        .from("interview_history")
        .select("trainee_id")
        .in("trainee_id", traineeIds);

      if (allInterviewsError) throw allInterviewsError;

      const interviewCounts: Record<string, number> = {};
      allInterviews?.forEach(interview => {
        interviewCounts[interview.trainee_id] = (interviewCounts[interview.trainee_id] || 0) + 1;
      });

      const result: OrderTrainee[] = trainees.map(trainee => ({
        id: trainee.id,
        trainee_code: trainee.trainee_code,
        full_name: trainee.full_name,
        birth_date: trainee.birth_date,
        birthplace: trainee.birthplace,
        phone: trainee.phone,
        interview_count: interviewCounts[trainee.id] || 0,
        progression_stage: trainee.progression_stage,
      }));

      return result;
    },
    enabled: !!orderId && !!orderData?.company_id && !!orderData?.expected_interview_date,
  });
}
