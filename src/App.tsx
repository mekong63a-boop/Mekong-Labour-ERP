import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import TraineeList from "./pages/TraineeList";
import TraineeDetail from "./pages/TraineeDetail";
import TraineeForm from "./pages/TraineeForm";
import EducationDashboard from "./pages/education/EducationDashboard";
import TeacherList from "./pages/education/TeacherList";
import ClassList from "./pages/education/ClassList";
import AttendanceCalendar from "./pages/education/AttendanceCalendar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trainees" element={<TraineeList />} />
            <Route path="/hoc-vien" element={<TraineeList />} />
            <Route path="/trainees/new" element={<TraineeForm />} />
            <Route path="/trainees/:id/edit" element={<TraineeForm />} />
            <Route path="/trainees/:id" element={<TraineeDetail />} />
            {/* Education Module */}
            <Route path="/education" element={<EducationDashboard />} />
            <Route path="/training" element={<EducationDashboard />} />
            <Route path="/education/teachers" element={<TeacherList />} />
            <Route path="/education/classes" element={<ClassList />} />
            <Route path="/education/classes/:id/attendance" element={<AttendanceCalendar />} />
            <Route path="/education/attendance" element={<ClassList />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
