import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DormitoryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Quản lý KTX</h1>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Đang phát triển</CardTitle>
          </CardHeader>
          <CardContent>
            Trang quản lý KTX sẽ được bổ sung chức năng theo yêu cầu.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
