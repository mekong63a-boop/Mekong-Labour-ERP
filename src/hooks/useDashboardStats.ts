import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Job Category Distribution
export interface JobCategoryData {
  id: string;
  name: string;
  count: number;
}

// Monthly comparison data
export interface MonthlyComparisonData {
  month: string;
  recruitment: number;
  departure: number;
}

// Hook to get trainee count by job category
export const useTraineeByJobCategory = () => {
  return useQuery({
    queryKey: ["dashboard-trainee-job-category"],
    queryFn: async () => {
      // Get all trainees with job_category_id
      const { data: trainees, error: traineeError } = await supabase
        .from("trainees")
        .select("job_category_id")
        .not("job_category_id", "is", null);

      if (traineeError) throw traineeError;

      // Get all job categories
      const { data: categories, error: catError } = await supabase
        .from("job_categories")
        .select("id, name");

      if (catError) throw catError;

      // Count trainees per category
      const countMap = new Map<string, number>();
      trainees?.forEach((t) => {
        if (t.job_category_id) {
          countMap.set(t.job_category_id, (countMap.get(t.job_category_id) || 0) + 1);
        }
      });

      // Build result with category names
      const result: JobCategoryData[] = [];
      categories?.forEach((cat) => {
        const count = countMap.get(cat.id) || 0;
        if (count > 0) {
          result.push({ id: cat.id, name: cat.name, count });
        }
      });

      // Sort by count descending
      return result.sort((a, b) => b.count - a.count);
    },
    staleTime: 30 * 1000,
  });
};

// Hook to get yearly target from orders
export const useYearlyTarget = (year: number) => {
  return useQuery({
    queryKey: ["dashboard-yearly-target", year],
    queryFn: async () => {
      // Get total quantity from orders for the year
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("quantity, expected_interview_date")
        .gte("expected_interview_date", `${year}-01-01`)
        .lte("expected_interview_date", `${year}-12-31`);

      if (orderError) throw orderError;

      const target = orders?.reduce((sum, o) => sum + (o.quantity || 0), 0) || 0;

      // Get departed count for the year
      const { data: departed, error: depError } = await supabase
        .from("trainees")
        .select("id")
        .gte("departure_date", `${year}-01-01`)
        .lte("departure_date", `${year}-12-31`);

      if (depError) throw depError;

      const achieved = departed?.length || 0;

      return {
        target,
        achieved,
        percentage: target > 0 ? Math.round((achieved / target) * 100) : 0,
      };
    },
    staleTime: 30 * 1000,
  });
};

// Hook to calculate profile completion rate
export const useProfileCompletionRate = () => {
  return useQuery({
    queryKey: ["dashboard-profile-completion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("full_name, birth_date, gender, phone, cccd_number, passport_number, photo_url, current_address");

      if (error) throw error;

      if (!data || data.length === 0) {
        return { totalTrainees: 0, completedProfiles: 0, percentage: 0 };
      }

      const requiredFields = ["full_name", "birth_date", "gender", "phone", "cccd_number"];
      let completedCount = 0;

      data.forEach((trainee) => {
        const filledFields = requiredFields.filter((field) => {
          const value = trainee[field as keyof typeof trainee];
          return value !== null && value !== undefined && value !== "";
        });
        // Consider complete if at least 4/5 required fields are filled
        if (filledFields.length >= 4) {
          completedCount++;
        }
      });

      return {
        totalTrainees: data.length,
        completedProfiles: completedCount,
        percentage: Math.round((completedCount / data.length) * 100),
      };
    },
    staleTime: 60 * 1000,
  });
};

// Hook to get monthly recruitment vs departure comparison
export const useMonthlyComparison = (year: number) => {
  return useQuery({
    queryKey: ["dashboard-monthly-comparison", year],
    queryFn: async () => {
      const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
      const result: MonthlyComparisonData[] = months.map((m) => ({
        month: m,
        recruitment: 0,
        departure: 0,
      }));

      // Get registrations
      const { data: registrations, error: regError } = await supabase
        .from("trainees")
        .select("registration_date, created_at")
        .or(`registration_date.gte.${year}-01-01,created_at.gte.${year}-01-01`)
        .or(`registration_date.lte.${year}-12-31,created_at.lte.${year}-12-31`);

      if (regError) throw regError;

      registrations?.forEach((t) => {
        const dateStr = t.registration_date || t.created_at;
        if (dateStr) {
          const date = new Date(dateStr);
          if (date.getFullYear() === year) {
            const monthIndex = date.getMonth();
            result[monthIndex].recruitment++;
          }
        }
      });

      // Get departures
      const { data: departures, error: depError } = await supabase
        .from("trainees")
        .select("departure_date")
        .gte("departure_date", `${year}-01-01`)
        .lte("departure_date", `${year}-12-31`);

      if (depError) throw depError;

      departures?.forEach((t) => {
        if (t.departure_date) {
          const date = new Date(t.departure_date);
          const monthIndex = date.getMonth();
          result[monthIndex].departure++;
        }
      });

      return result;
    },
    staleTime: 30 * 1000,
  });
};

// Hook to calculate growth rates
export const useGrowthRates = () => {
  return useQuery({
    queryKey: ["dashboard-growth-rates"],
    queryFn: async () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Calculate last month
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Get current month registrations
      const currentMonthStart = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];
      const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];
      
      const { data: currentRegs, error: err1 } = await supabase
        .from("trainees")
        .select("id")
        .or(`registration_date.gte.${currentMonthStart},created_at.gte.${currentMonthStart}`)
        .or(`registration_date.lte.${currentMonthEnd},created_at.lte.${currentMonthEnd}`);

      if (err1) throw err1;

      // Get last month registrations
      const lastMonthStart = new Date(lastMonthYear, lastMonth, 1).toISOString().split("T")[0];
      const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0).toISOString().split("T")[0];
      
      const { data: lastRegs, error: err2 } = await supabase
        .from("trainees")
        .select("id")
        .or(`registration_date.gte.${lastMonthStart},created_at.gte.${lastMonthStart}`)
        .or(`registration_date.lte.${lastMonthEnd},created_at.lte.${lastMonthEnd}`);

      if (err2) throw err2;

      const currentCount = currentRegs?.length || 0;
      const lastCount = lastRegs?.length || 0;
      
      const growthRate = lastCount > 0 
        ? Math.round(((currentCount - lastCount) / lastCount) * 100) 
        : currentCount > 0 ? 100 : 0;

      return {
        registrationGrowth: growthRate,
        currentMonthRegs: currentCount,
        lastMonthRegs: lastCount,
      };
    },
    staleTime: 60 * 1000,
  });
};

// Hook to get total orders count
export const useTotalOrders = () => {
  return useQuery({
    queryKey: ["dashboard-total-orders"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "Đang xử lý");

      if (error) throw error;
      return count || 0;
    },
    staleTime: 30 * 1000,
  });
};

// Hook to get trainees in Japan count
export const useTraineesInJapan = () => {
  return useQuery({
    queryKey: ["dashboard-trainees-in-japan"],
    queryFn: async () => {
      // Trainees with departure_date but no return_date or early_return_date
      const { data, error } = await supabase
        .from("trainees")
        .select("id, departure_date, return_date, early_return_date")
        .not("departure_date", "is", null);

      if (error) throw error;

      const inJapan = data?.filter((t) => !t.return_date && !t.early_return_date) || [];
      const totalDeparted = data?.length || 0;

      return {
        inJapan: inJapan.length,
        totalDeparted,
      };
    },
    staleTime: 30 * 1000,
  });
};

// Hook to get currently studying trainees
export const useCurrentlyStudying = () => {
  return useQuery({
    queryKey: ["dashboard-currently-studying"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("trainees")
        .select("*", { count: "exact", head: true })
        .or("enrollment_status.eq.Đang học,simple_status.eq.Đang học");

      if (error) throw error;
      return count || 0;
    },
    staleTime: 30 * 1000,
  });
};
