// ReportsPage - Tra cứu hồ sơ học viên
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, UserSearch } from "lucide-react";
import { TraineeSearchBox } from "./components/TraineeSearchBox";
import { TraineeProfileView } from "./components/TraineeProfileView";
import { useTraineeProfile } from "./hooks/useTraineeProfile";

export default function ReportsPage() {
  const { profile, isLoading: isSearching, searchTrainee, clearProfile } = useTraineeProfile();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Tra cứu hồ sơ
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tra cứu thông tin chi tiết học viên theo mã
        </p>
      </header>

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

      {/* Profile Result */}
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
    </div>
  );
}
