import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LegalPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Hồ sơ / Pháp lý</h1>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Đang phát triển</CardTitle>
          </CardHeader>
          <CardContent>
            Trang hồ sơ/pháp lý sẽ được bổ sung chức năng theo quy trình thực tế.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
