import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemMonitorPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Giám sát hệ thống</h1>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Đang phát triển</CardTitle>
          </CardHeader>
          <CardContent>
            Trang giám sát sẽ hiển thị tình trạng đồng bộ, lỗi hệ thống và nhật ký.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
