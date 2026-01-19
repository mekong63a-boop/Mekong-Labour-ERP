import { Navigate } from "react-router-dom";

/**
 * Dashboard.tsx - REPLACED
 * 
 * Logic tính KPI bằng JavaScript đã bị XÓA.
 * Tất cả KPI được tính từ PostgreSQL views (dashboard_trainee_*).
 * 
 * Component này chỉ redirect đến TraineeDashboard.
 * Giữ file để backward compatibility với routes cũ.
 */
export default function Dashboard() {
  return <Navigate to="/dashboard/trainees" replace />;
}
