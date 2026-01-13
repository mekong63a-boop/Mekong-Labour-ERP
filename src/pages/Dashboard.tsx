import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Award, Plane, RefreshCw, Calendar } from "lucide-react";
import { useTrainees } from "@/hooks/useTrainees";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: trainees, isLoading } = useTrainees();

  const stats = {
    total: trainees?.length || 0,
    male: trainees?.filter((t) => t.gender === "Nam" || t.gender === "Male").length || 0,
    female: trainees?.filter((t) => t.gender === "Nữ" || t.gender === "Female").length || 0,
    passed: trainees?.filter((t) => t.progression_stage === "Đậu phỏng vấn").length || 0,
    departed: trainees?.filter((t) => t.progression_stage === "Xuất cảnh" || t.progression_stage === "Đang làm việc").length || 0,
  };

  const processingStages = [
    { label: "OTIT", count: trainees?.filter((t) => t.progression_stage === "OTIT").length || 0, color: "bg-purple-500" },
    { label: "Nhập cảnh", count: trainees?.filter((t) => t.progression_stage === "Nyukan").length || 0, color: "bg-blue-500" },
    { label: "COE", count: trainees?.filter((t) => t.progression_stage === "COE").length || 0, color: "bg-orange-500" },
    { label: "Visa", count: trainees?.filter((t) => t.progression_stage === "Visa").length || 0, color: "bg-green-500" },
  ];

  const totalProcessing = processingStages.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-muted-foreground">Chào mừng đến với Mekong Labour ERP</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="quarter">Quý này</SelectItem>
              <SelectItem value="year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số học viên
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? "..." : stats.total}</div>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Nam: {stats.male}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                Nữ: {stats.female}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng đậu phỏng vấn
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Award className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? "..." : stats.passed}</div>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Nam: 0
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                Nữ: 0
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng xuất cảnh
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Plane className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? "..." : stats.departed}</div>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Nam: 0
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                Nữ: 0
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phễu tuyển dụng</CardTitle>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Nam
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                Nữ
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Biểu đồ phễu tuyển dụng</p>
            </div>
          </CardContent>
        </Card>

        {/* Processing Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tiến trình xử lý hồ sơ</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="flex h-2 rounded-full overflow-hidden mb-6">
              {processingStages.map((stage, idx) => (
                <div
                  key={stage.label}
                  className={`${stage.color} ${idx === 0 ? "rounded-l-full" : ""} ${idx === processingStages.length - 1 ? "rounded-r-full" : ""}`}
                  style={{ width: totalProcessing > 0 ? `${(stage.count / totalProcessing) * 100}%` : "25%" }}
                />
              ))}
            </div>

            {/* Stage Cards */}
            <div className="grid grid-cols-4 gap-4">
              {processingStages.map((stage) => (
                <div key={stage.label} className="text-center">
                  <div className={`mx-auto h-12 w-12 rounded-full ${stage.color} flex items-center justify-center mb-2`}>
                    <span className="text-white font-bold">{stage.count}</span>
                  </div>
                  <p className="text-sm font-medium">{stage.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalProcessing > 0 ? Math.round((stage.count / totalProcessing) * 100) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Contracts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-destructive" />
            </span>
            <CardTitle className="text-base">Hợp đồng sắp hết hạn</CardTitle>
          </div>
          <Badge variant="secondary">0 hồ sơ</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Không có hợp đồng nào sắp hết hạn
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
