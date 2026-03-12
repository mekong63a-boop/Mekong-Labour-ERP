// ReportsPage - Tra cứu hồ sơ & Tra cứu nâng cao
import { useState } from "react";
import { FileSpreadsheet, UserSearch, Search, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TraineeSearchBox } from "./components/TraineeSearchBox";
import { TraineeProfileView } from "./components/TraineeProfileView";
import { useTraineeProfile } from "./hooks/useTraineeProfile";
import DashboardAdvancedFilter from "@/components/dashboard/DashboardAdvancedFilter";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ReportsPage() {
  const { profile, isLoading: isSearching, searchTrainee, clearProfile } = useTraineeProfile();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!profile) return;
    setIsExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("Vui lòng đăng nhập lại"); return; }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/export-trainee-pdf?trainee_code=${encodeURIComponent(profile.trainee_code)}`,
        { method: "GET", headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_PUBLISHABLE_KEY } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Lỗi xuất PDF");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${profile.trainee_code} - ${profile.full_name}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (match) filename = decodeURIComponent(match[1]);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Đã tải PDF thành công");
    } catch (error) {
      console.error("Export PDF error:", error);
      toast.error((error as Error).message || "Lỗi xuất PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Báo cáo & Tra cứu
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tra cứu hồ sơ học viên và báo cáo nâng cao
        </p>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <UserSearch className="h-4 w-4" />
            Tra cứu hồ sơ
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-1.5">
            <Search className="h-4 w-4" />
            Tra cứu nâng cao
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Tra cứu hồ sơ học viên */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserSearch className="h-5 w-5" />
                Tra cứu hồ sơ học viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <TraineeSearchBox onSearch={searchTrainee} isLoading={isSearching} />
                </div>
                {profile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-500 font-medium shrink-0"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    Xuất PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {profile && (
            <TraineeProfileView profile={profile} onClose={clearProfile} />
          )}

          {!profile && !isSearching && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <UserSearch className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nhập mã học viên để xem hồ sơ chi tiết</p>
                <p className="text-sm mt-1">Ví dụ: 009080, 008123...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Tra cứu nâng cao (chuyển từ Dashboard) */}
        <TabsContent value="advanced" className="mt-4">
          <DashboardAdvancedFilter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
