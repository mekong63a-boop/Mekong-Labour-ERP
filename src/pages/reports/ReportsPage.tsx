import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Báo cáo</h1>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Đang phát triển</CardTitle>
          </CardHeader>
          <CardContent>
            Trang báo cáo sẽ tổng hợp số liệu theo học viên/đơn hàng/đào tạo.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
