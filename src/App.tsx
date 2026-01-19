import { Toaster } from "@/components/ui/toaster";
import ClassStudentsPage from "@/pages/education/ClassStudentsPage";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MenuProtectedRoute } from "@/components/auth/MenuProtectedRoute";
import { AuthProviderWrapper } from "@/components/auth/AuthProvider";
import Dashboard from "./pages/Dashboard";
import TraineeDashboard from "./pages/dashboard/TraineeDashboard";
import TraineeList from "./pages/TraineeList";
import TraineeDetail from "./pages/TraineeDetail";
import TraineeForm from "./pages/TraineeForm";
import EducationDashboard from "./pages/education/EducationDashboard";
import TeacherList from "./pages/education/TeacherList";
import ClassList from "./pages/education/ClassList";
import AttendanceCalendar from "./pages/education/AttendanceCalendar";
import TestScoresPage from "./pages/education/TestScoresPage";
import GlossaryPage from "./pages/glossary/GlossaryPage";
import OrderList from "./pages/orders/OrderList";
import InternalUnionPage from "./pages/internal-union/InternalUnionPage";
import PostDeparturePage from "./pages/post-departure/PostDeparturePage";
import PartnerList from "./pages/partners/PartnerList";
import CompanyForm from "./pages/partners/CompanyForm";
import UnionForm from "./pages/partners/UnionForm";
import JobCategoryForm from "./pages/partners/JobCategoryForm";
import DormitoryPage from "./pages/dormitory/DormitoryPage";
import LegalPage from "./pages/legal/LegalPage";
import HandbookPage from "./pages/handbook/HandbookPage";
import ViolationsPage from "./pages/violations/ViolationsPage";
import ReportsPage from "./pages/reports/ReportsPage";
import AdminPage from "./pages/admin/AdminPage";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import NotFound from "./pages/NotFound";
import { useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Create queryClient inside a hook so we can clear it on auth changes
function useQueryClientWithAuthClear() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reduce default staleTime for fresher data
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
            refetchOnWindowFocus: true,
          },
        },
      }),
    []
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        // Clear ALL cache on sign out or sign in to ensure fresh data
        if (event === "SIGNED_OUT" || event === "SIGNED_IN") {
          console.log(`[Auth] ${event} - clearing all query cache`);
          queryClient.clear();
        }

        // IMPORTANT: When a new version is published, existing SPA tabs may keep running old JS.
        // Force a full reload on SIGNED_IN so users always load the latest deployed bundle.
        if (event === "SIGNED_IN") {
          setTimeout(() => {
            window.location.reload();
          }, 50);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return queryClient;
}

function AppWithQueryClient() {
  const queryClient = useQueryClientWithAuthClear();

  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProviderWrapper>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes - Menu-based permissions */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard - accessible to all authenticated users with dashboard permission */}
              <Route
                path="/"
                element={
                  <MenuProtectedRoute menuKey="dashboard">
                    <Dashboard />
                  </MenuProtectedRoute>
                }
              />
              
              {/* Dashboard Học viên */}
              <Route
                path="/dashboard/trainees"
                element={
                  <MenuProtectedRoute menuKey="dashboard">
                    <TraineeDashboard />
                  </MenuProtectedRoute>
                }
              />

              {/* Trainee Routes */}
              <Route
                path="/trainees"
                element={
                  <MenuProtectedRoute menuKey="trainees">
                    <TraineeList />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/hoc-vien"
                element={
                  <MenuProtectedRoute menuKey="trainees">
                    <TraineeList />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/trainees/new"
                element={
                  <MenuProtectedRoute menuKey="trainees" requiredAction="create">
                    <TraineeForm />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/trainees/:id/edit"
                element={
                  <MenuProtectedRoute menuKey="trainees" requiredAction="update">
                    <TraineeForm />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/trainees/:id"
                element={
                  <MenuProtectedRoute menuKey="trainees">
                    <TraineeDetail />
                  </MenuProtectedRoute>
                }
              />
              
              {/* Education Routes */}
              <Route
                path="/education"
                element={
                  <MenuProtectedRoute menuKey="education">
                    <EducationDashboard />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/training"
                element={
                  <MenuProtectedRoute menuKey="education">
                    <EducationDashboard />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/education/teachers"
                element={
                  <MenuProtectedRoute menuKey="education">
                    <TeacherList />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/education/classes"
                element={
                  <MenuProtectedRoute menuKey="education">
                    <ClassList />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/education/classes/:id/attendance"
                element={
                  <MenuProtectedRoute menuKey="education">
                    <AttendanceCalendar />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/education/attendance"
                element={
                  <MenuProtectedRoute menuKey="education">
                    <AttendanceCalendar />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/education/attendance/:id"
                element={
                  <MenuProtectedRoute menuKey="education">
                    <AttendanceCalendar />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/education/classes/:classId/students"
                element={
                  <MenuProtectedRoute menuKey="education">
                    <ClassStudentsPage />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/education/classes/:classId/test-scores"
                element={
                  <MenuProtectedRoute menuKey="education">
                    <TestScoresPage />
                  </MenuProtectedRoute>
                }
              />
              
              {/* Orders */}
              <Route
                path="/orders"
                element={
                  <MenuProtectedRoute menuKey="orders">
                    <OrderList />
                  </MenuProtectedRoute>
                }
              />

              {/* Partners */}
              <Route
                path="/partners"
                element={
                  <MenuProtectedRoute menuKey="partners">
                    <PartnerList />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/partners/companies/new"
                element={
                  <MenuProtectedRoute menuKey="partners" requiredAction="create">
                    <CompanyForm />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/partners/companies/:id/edit"
                element={
                  <MenuProtectedRoute menuKey="partners" requiredAction="update">
                    <CompanyForm />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/partners/unions/new"
                element={
                  <MenuProtectedRoute menuKey="partners" requiredAction="create">
                    <UnionForm />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/partners/unions/:id/edit"
                element={
                  <MenuProtectedRoute menuKey="partners" requiredAction="update">
                    <UnionForm />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/partners/job-categories/new"
                element={
                  <MenuProtectedRoute menuKey="partners" requiredAction="create">
                    <JobCategoryForm />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/partners/job-categories/:id/edit"
                element={
                  <MenuProtectedRoute menuKey="partners" requiredAction="update">
                    <JobCategoryForm />
                  </MenuProtectedRoute>
                }
              />

              {/* Glossary */}
              <Route
                path="/glossary"
                element={
                  <MenuProtectedRoute menuKey="glossary">
                    <GlossaryPage />
                  </MenuProtectedRoute>
                }
              />

              {/* Internal Union */}
              <Route
                path="/internal-union"
                element={
                  <MenuProtectedRoute menuKey="internal_union">
                    <InternalUnionPage />
                  </MenuProtectedRoute>
                }
              />

              {/* Post Departure */}
              <Route
                path="/post-departure"
                element={
                  <MenuProtectedRoute menuKey="post_departure">
                    <PostDeparturePage />
                  </MenuProtectedRoute>
                }
              />

              {/* Internal Ops */}
              <Route
                path="/dormitory"
                element={
                  <MenuProtectedRoute menuKey="dormitory">
                    <DormitoryPage />
                  </MenuProtectedRoute>
                }
              />
              <Route
                path="/legal"
                element={
                  <MenuProtectedRoute menuKey="legal">
                    <LegalPage />
                  </MenuProtectedRoute>
                }
              />

              {/* Handbook */}
              <Route
                path="/handbook"
                element={
                  <MenuProtectedRoute menuKey="handbook">
                    <HandbookPage />
                  </MenuProtectedRoute>
                }
              />

              {/* Blacklist/Violations */}
              <Route
                path="/violations"
                element={
                  <MenuProtectedRoute menuKey="violations">
                    <ViolationsPage />
                  </MenuProtectedRoute>
                }
              />

              {/* Reports */}
              <Route
                path="/reports"
                element={
                  <MenuProtectedRoute menuKey="reports">
                    <ReportsPage />
                  </MenuProtectedRoute>
                }
              />

              {/* Admin Page */}
              <Route
                path="/admin"
                element={
                  <MenuProtectedRoute menuKey="admin">
                    <AdminPage />
                  </MenuProtectedRoute>
                }
              />

              {/* Legacy redirects */}
              <Route
                path="/system-monitor"
                element={<Navigate to="/admin" replace />}
              />
              <Route
                path="/admin/users"
                element={<Navigate to="/admin" replace />}
              />
              <Route
                path="/admin/departments"
                element={<Navigate to="/admin" replace />}
              />
              
              {/* Change Password - accessible to all authenticated users */}
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
            </Route>
            
            {/* Logout redirect */}
            <Route path="/logout" element={<Login />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProviderWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
}

const App = () => <AppWithQueryClient />;

export default App;
