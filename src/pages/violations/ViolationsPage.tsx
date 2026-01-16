import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ViolationsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Blacklist</h1>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Đang phát triển</CardTitle>
          </CardHeader>
          <CardContent>
            Trang blacklist sẽ quản lý danh sách vi phạm/blacklist và lý do.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
