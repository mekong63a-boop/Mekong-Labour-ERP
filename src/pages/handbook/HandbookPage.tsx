import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HandbookPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Cẩm nang tư vấn</h1>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Đang phát triển</CardTitle>
          </CardHeader>
          <CardContent>
            Trang cẩm nang tư vấn sẽ hỗ trợ lưu tài liệu, quy trình và mẫu tư vấn.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
