// ReportsPage - Tra cứu hồ sơ & Tra cứu nâng cao
import { FileSpreadsheet, UserSearch, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TraineeSearchBox } from "./components/TraineeSearchBox";
import { TraineeProfileView } from "./components/TraineeProfileView";
import { useTraineeProfile } from "./hooks/useTraineeProfile";
import DashboardAdvancedFilter from "@/components/dashboard/DashboardAdvancedFilter";

export default function ReportsPage() {
  const { profile, isLoading: isSearching, searchTrainee, clearProfile } = useTraineeProfile();

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
              <TraineeSearchBox onSearch={searchTrainee} isLoading={isSearching} />
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
