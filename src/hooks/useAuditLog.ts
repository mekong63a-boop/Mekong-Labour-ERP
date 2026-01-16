import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to log audit entries for tracking changes
 * Usage: const { logAudit } = useAuditLog();
 *        await logAudit('UPDATE', 'trainees', traineeId, oldData, newData, 'Cập nhật thông tin học viên Nguyễn Văn A');
 */
export function useAuditLog() {
  const logAudit = async (
    action: "INSERT" | "UPDATE" | "DELETE" | "SELECT" | "LOGIN" | "LOGOUT",
    tableName: string,
    recordId: string | null,
    oldData: any | null,
    newData: any | null,
    description: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData,
        new_data: newData,
        description,
      });
    } catch (error) {
      console.error("Error logging audit:", error);
    }
  };

  return { logAudit };
}

/**
 * Helper to generate Vietnamese description for audit logs
 */
export function generateAuditDescription(
  action: "INSERT" | "UPDATE" | "DELETE",
  tableName: string,
  recordName?: string
): string {
  const tableLabels: Record<string, string> = {
    trainees: "học viên",
    orders: "đơn hàng",
    companies: "công ty tiếp nhận",
    unions: "nghiệp đoàn",
    job_categories: "ngành nghề",
    classes: "lớp học",
    teachers: "giáo viên",
    attendance: "điểm danh",
    test_scores: "điểm thi",
    user_roles: "phân quyền",
    profiles: "hồ sơ người dùng",
    family_members: "thành viên gia đình",
    education_history: "lịch sử học vấn",
    work_history: "lịch sử làm việc",
    japan_relatives: "người thân tại Nhật",
  };

  const actionLabels: Record<string, string> = {
    INSERT: "Thêm mới",
    UPDATE: "Cập nhật",
    DELETE: "Xóa",
  };

  const table = tableLabels[tableName] || tableName;
  const actionLabel = actionLabels[action];

  if (recordName) {
    return `${actionLabel} ${table}: ${recordName}`;
  }
  return `${actionLabel} ${table}`;
}
