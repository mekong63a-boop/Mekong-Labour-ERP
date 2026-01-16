import { Toaster } from "@/components/ui/toaster";
import ClassStudentsPage from "@/pages/education/ClassStudentsPage";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProviderWrapper } from "@/components/auth/AuthProvider";
import Dashboard from "./pages/Dashboard";
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

const queryClient = new QueryClient();

const App = () => (
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
            
            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              
              {/* Trainee Routes - Admin, Manager, Staff */}
              <Route
                path="/trainees"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                    <TraineeList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hoc-vien"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                    <TraineeList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trainees/new"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                    <TraineeForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trainees/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                    <TraineeForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trainees/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                    <TraineeDetail />
                  </ProtectedRoute>
                }
              />
              
              {/* Education Routes - Admin, Manager, Teacher */}
              <Route
                path="/education"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "teacher"]}>
                    <EducationDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/training"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "teacher"]}>
                    <EducationDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/education/teachers"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <TeacherList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/education/classes"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "teacher"]}>
                    <ClassList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/education/classes/:id/attendance"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "teacher"]}>
                    <AttendanceCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/education/attendance"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "teacher"]}>
                    <AttendanceCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/education/attendance/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "teacher"]}>
                    <AttendanceCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/education/classes/:classId/students"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "teacher"]}>
                    <ClassStudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/education/classes/:classId/test-scores"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "teacher"]}>
                    <TestScoresPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Orders - Admin, Manager */}
              <Route
                path="/orders"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <OrderList />
                  </ProtectedRoute>
                }
              />

              {/* Partners - Admin, Manager */}
              <Route
                path="/partners"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <PartnerList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partners/companies/new"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <CompanyForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partners/companies/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <CompanyForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partners/unions/new"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <UnionForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partners/unions/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <UnionForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partners/job-categories/new"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <JobCategoryForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partners/job-categories/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <JobCategoryForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/glossary"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                    <GlossaryPage />
                  </ProtectedRoute>
                }
              />

              {/* Internal Union - Admin, Manager */}
              <Route
                path="/internal-union"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <InternalUnionPage />
                  </ProtectedRoute>
                }
              />

              {/* Post Departure - Admin, Manager */}
              <Route
                path="/post-departure"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <PostDeparturePage />
                  </ProtectedRoute>
                }
              />

              {/* Internal Ops */}
              <Route
                path="/dormitory"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                    <DormitoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/legal"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                    <LegalPage />
                  </ProtectedRoute>
                }
              />

              {/* Handbook */}
              <Route
                path="/handbook"
                element={
                  <ProtectedRoute>
                    <HandbookPage />
                  </ProtectedRoute>
                }
              />

              {/* Blacklist */}
              <Route
                path="/violations"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                    <ViolationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Reports */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Page - Combined System Monitor, User Management, Departments */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              {/* Legacy redirects for old routes */}
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

export default App;