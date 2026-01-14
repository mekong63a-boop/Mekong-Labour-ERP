import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import GlossaryPage from "./pages/glossary/GlossaryPage";
import Login from "./pages/Login";
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
                    <ClassList />
                  </ProtectedRoute>
                }
              />
              
              {/* Glossary - Admin, Manager, Staff */}
              <Route
                path="/glossary"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                    <GlossaryPage />
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
