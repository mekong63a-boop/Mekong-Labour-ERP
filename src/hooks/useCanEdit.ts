import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";
import { toast } from "sonner";

/**
 * Hook to check if current user can edit a record based on:
 * - Role (admin/manager can always edit)
 * - Same-day rule for staff (can only edit records created today)
 * - Edit permissions granted by manager/admin
 */
export function useCanEdit() {
  const { isAdmin, isManager, isStaff, userId } = useUserRole();
  const [isRequesting, setIsRequesting] = useState(false);

  /**
   * Check if user can edit a record
   * @param tableName - The table name
   * @param recordId - The record ID
   * @param recordCreatedAt - When the record was created
   * @returns boolean - Whether user can edit
   */
  const canEdit = async (
    tableName: string,
    recordId: string,
    recordCreatedAt: string | Date
  ): Promise<boolean> => {
    // Admin and manager can always edit
    if (isAdmin || isManager) {
      return true;
    }

    // Staff same-day rule
    if (isStaff) {
      const createdDate = new Date(recordCreatedAt);
      const today = new Date();
      
      // Check if same day
      const isSameDay = 
        createdDate.getFullYear() === today.getFullYear() &&
        createdDate.getMonth() === today.getMonth() &&
        createdDate.getDate() === today.getDate();

      if (isSameDay) {
        return true;
      }

      // Check for approved edit permission
      const { data: permission } = await supabase
        .from("edit_permissions")
        .select("*")
        .eq("user_id", userId)
        .eq("table_name", tableName)
        .eq("record_id", recordId)
        .eq("status", "approved")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();

      return !!permission;
    }

    return true; // Default allow for other roles
  };

  /**
   * Request edit permission for a record
   * @param tableName - The table name
   * @param recordId - The record ID
   * @param reason - Reason for the request
   */
  const requestEditPermission = async (
    tableName: string,
    recordId: string,
    reason: string
  ): Promise<boolean> => {
    if (!userId) {
      toast.error("Bạn cần đăng nhập để gửi yêu cầu");
      return false;
    }

    setIsRequesting(true);
    try {
      // Check if there's already a pending request
      const { data: existing } = await supabase
        .from("edit_permissions")
        .select("*")
        .eq("user_id", userId)
        .eq("table_name", tableName)
        .eq("record_id", recordId)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        toast.info("Bạn đã có yêu cầu đang chờ duyệt cho bản ghi này");
        return false;
      }

      const { error } = await supabase.from("edit_permissions").insert({
        user_id: userId,
        table_name: tableName,
        record_id: recordId,
        reason,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Đã gửi yêu cầu chỉnh sửa. Vui lòng chờ phê duyệt.");
      return true;
    } catch (error) {
      console.error("Error requesting edit permission:", error);
      toast.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    canEdit,
    requestEditPermission,
    isRequesting,
    isStaff,
  };
}
