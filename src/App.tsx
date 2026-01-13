import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import TraineeList from "./pages/TraineeList";
import TraineeDetail from "./pages/TraineeDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <Navigate to="/dashboard" replace />
              </AppLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/trainees"
            element={
              <AppLayout>
                <TraineeList />
              </AppLayout>
            }
          />
          <Route
            path="/trainees/:id"
            element={
              <AppLayout>
                <TraineeDetail />
              </AppLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
