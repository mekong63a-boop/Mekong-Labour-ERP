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
      // Lấy tất cả interview_history theo company_id, union_id, job_category_id, interview_date
      const { data: interviews, error } = await supabase
        .from("interview_history")
        .select("company_id, union_id, job_category_id, interview_date, trainee_id");

      if (error) throw error;

      // Lấy tất cả orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, company_id, union_id, job_category_id, expected_interview_date");

      if (ordersError) throw ordersError;

      // Đếm số học viên cho mỗi đơn hàng
      const counts: Record<string, number> = {};
      
      orders?.forEach(order => {
        const matchingTrainees = new Set<string>();
        
        interviews?.forEach(interview => {
          // Match dựa trên company_id, union_id, job_category_id và ngày phỏng vấn
          const isMatch = 
            interview.company_id === order.company_id &&
            interview.union_id === order.union_id &&
            interview.job_category_id === order.job_category_id &&
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
export function useOrderTrainees(orderId: string | null, orderData?: {
  company_id: string | null;
  union_id: string | null;
  job_category_id: string | null;
  expected_interview_date: string | null;
}) {
  return useQuery({
    queryKey: ["order-trainees", orderId],
    queryFn: async () => {
      if (!orderId || !orderData) return [];

      // Lấy danh sách interview_history khớp với đơn hàng này
      let query = supabase
        .from("interview_history")
        .select("trainee_id")
        .eq("company_id", orderData.company_id || "")
        .eq("union_id", orderData.union_id || "")
        .eq("job_category_id", orderData.job_category_id || "");
      
      if (orderData.expected_interview_date) {
        query = query.eq("interview_date", orderData.expected_interview_date);
      }

      const { data: interviews, error } = await query;

      if (error) throw error;
      if (!interviews || interviews.length === 0) return [];

      // Lấy unique trainee IDs
      const traineeIds = [...new Set(interviews.map(i => i.trainee_id))];

      // Lấy thông tin chi tiết học viên
      const { data: trainees, error: traineesError } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, birth_date, birthplace, phone")
        .in("id", traineeIds);

      if (traineesError) throw traineesError;

      // Lấy số lần tham gia phỏng vấn của mỗi học viên (từ interview_history)
      const { data: allInterviews, error: allInterviewsError } = await supabase
        .from("interview_history")
        .select("trainee_id")
        .in("trainee_id", traineeIds);

      if (allInterviewsError) throw allInterviewsError;

      // Đếm số lần phỏng vấn cho mỗi học viên
      const interviewCounts: Record<string, number> = {};
      allInterviews?.forEach(interview => {
        interviewCounts[interview.trainee_id] = (interviewCounts[interview.trainee_id] || 0) + 1;
      });

      // Kết hợp dữ liệu
      const result: OrderTrainee[] = trainees?.map(trainee => ({
        id: trainee.id,
        trainee_code: trainee.trainee_code,
        full_name: trainee.full_name,
        birth_date: trainee.birth_date,
        birthplace: trainee.birthplace,
        phone: trainee.phone,
        interview_count: interviewCounts[trainee.id] || 0,
      })) || [];

      return result;
    },
    enabled: !!orderId && !!orderData,
  });
}
