import { useUserRole } from "./useUserRole";

/**
 * Hook to check if current user can edit a record based on:
 * - Role (admin can always edit)
 * - Same-day rule for staff (can only edit records created today)
 * Note: edit_permissions table has been removed - using simplified logic
 */
export function useCanEdit() {
  const { isAdmin, isStaff } = useUserRole();

  /**
   * Check if user can edit a record
   * @param _tableName - The table name (unused after simplification)
   * @param _recordId - The record ID (unused after simplification)
   * @param recordCreatedAt - When the record was created
   * @returns boolean - Whether user can edit
   */
  const canEdit = async (
    _tableName: string,
    _recordId: string,
    recordCreatedAt: string | Date
  ): Promise<boolean> => {
    // Admin can always edit
    if (isAdmin) {
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

      return isSameDay;
    }

    return true; // Default allow for other roles
  };

  /**
   * Request edit permission - simplified (no longer uses database)
   * Shows message to contact admin
   */
  const requestEditPermission = async (
    _tableName: string,
    _recordId: string,
    _reason: string
  ): Promise<boolean> => {
    // Since edit_permissions table was removed, just show info message
    console.log("Edit permission requests are handled by admin directly");
    return false;
  };

  return {
    canEdit,
    requestEditPermission,
    isRequesting: false,
    isStaff,
  };
}
