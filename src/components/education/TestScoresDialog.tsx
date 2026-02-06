import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClassStudents, useBulkUpsertTestScores, useTestScores, useTestNames } from "@/hooks/useEducation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatVietnameseDate } from "@/lib/vietnamese-utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TestScoresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
}

export function TestScoresDialog({ open, onOpenChange, classId, className }: TestScoresDialogProps) {
  const { toast } = useToast();
  const { data: students } = useClassStudents(classId);
  const { data: testNames } = useTestNames(classId);
  const bulkUpsert = useBulkUpsertTestScores();
  
  const [activeTab, setActiveTab] = useState("new");
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [newTestData, setNewTestData] = useState({
    test_name: "",
    test_date: format(new Date(), "yyyy-MM-dd"),
    max_score: 100,
  });
  const [scores, setScores] = useState<Record<string, number | null>>({});

  // Fetch scores for selected test
  const { data: existingScores } = useTestScores(classId, selectedTest || undefined);

  const handleScoreChange = (traineeId: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setScores(prev => ({ ...prev, [traineeId]: numValue }));
  };

  const handleSaveNewTest = async () => {
    if (!newTestData.test_name) {
      toast({ title: "Vui lòng nhập tên bài kiểm tra", variant: "destructive" });
      return;
    }

    if (!students || students.length === 0) {
      toast({ title: "Lớp chưa có học viên", variant: "destructive" });
      return;
    }

    const scoreRecords = students.map(student => ({
      class_id: classId,
      trainee_id: student.id,
      test_name: newTestData.test_name,
      test_date: newTestData.test_date,
      max_score: newTestData.max_score,
      score: scores[student.id] ?? null,
    }));

    try {
      await bulkUpsert.mutateAsync(scoreRecords);
      toast({ title: "Lưu điểm thành công" });
      setScores({});
      setNewTestData({
        test_name: "",
        test_date: format(new Date(), "yyyy-MM-dd"),
        max_score: 100,
      });
    } catch (error) {
      toast({ title: "Lỗi khi lưu điểm", variant: "destructive" });
    }
  };

  const handleUpdateExistingTest = async () => {
    if (!selectedTest || !existingScores) return;

    const testInfo = existingScores[0];
    if (!testInfo) return;

    const scoreRecords = students?.map(student => ({
      class_id: classId,
      trainee_id: student.id,
      test_name: selectedTest,
      test_date: testInfo.test_date,
      max_score: testInfo.max_score,
      score: scores[student.id] ?? existingScores.find(s => s.trainee_id === student.id)?.score ?? null,
    })) || [];

    try {
      await bulkUpsert.mutateAsync(scoreRecords);
      toast({ title: "Cập nhật điểm thành công" });
    } catch (error) {
      toast({ title: "Lỗi khi cập nhật điểm", variant: "destructive" });
    }
  };

  // Initialize scores from existing data when selecting a test
  const handleSelectTest = (testName: string) => {
    setSelectedTest(testName);
    setScores({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Điểm kiểm tra - {className}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Thêm bài kiểm tra mới</TabsTrigger>
            <TabsTrigger value="existing">Xem/Sửa điểm</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tên bài kiểm tra *</Label>
                <Input
                  placeholder="VD: Kiểm tra giữa kỳ"
                  value={newTestData.test_name}
                  onChange={(e) => setNewTestData(prev => ({ ...prev, test_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Ngày kiểm tra</Label>
                <Input
                  type="date"
                  value={newTestData.test_date}
                  onChange={(e) => setNewTestData(prev => ({ ...prev, test_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Điểm tối đa</Label>
                <Input
                  type="number"
                  value={newTestData.max_score}
                  onChange={(e) => setNewTestData(prev => ({ ...prev, max_score: parseFloat(e.target.value) || 100 }))}
                />
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-md p-4">
              {students && students.length > 0 ? (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between gap-4 py-2 border-b">
                      <div className="flex-1">
                        <span className="font-mono text-sm text-muted-foreground mr-2">{student.trainee_code}</span>
                        <span className="font-medium">{student.full_name}</span>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="Điểm"
                          min={0}
                          max={newTestData.max_score}
                          value={scores[student.id] ?? ""}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Lớp chưa có học viên
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              <Button onClick={handleSaveNewTest} disabled={bulkUpsert.isPending}>
                {bulkUpsert.isPending ? "Đang lưu..." : "Lưu điểm"}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="existing" className="space-y-4">
            <div>
              <Label>Chọn bài kiểm tra</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {testNames && testNames.length > 0 ? (
                  testNames.map((test) => (
                    <Badge
                      key={test.test_name}
                      variant={selectedTest === test.test_name ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleSelectTest(test.test_name)}
                    >
                      {test.test_name} ({formatVietnameseDate(test.test_date)})
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Chưa có bài kiểm tra nào</span>
                )}
              </div>
            </div>

            {selectedTest && existingScores && (
              <>
                <ScrollArea className="h-[350px] border rounded-md p-4">
                  <div className="space-y-2">
                    {students?.map((student) => {
                      const existingScore = existingScores.find(s => s.trainee_id === student.id);
                      const currentScore = scores[student.id] ?? existingScore?.score;
                      const maxScore = existingScore?.max_score || 100;
                      
                      return (
                        <div key={student.id} className="flex items-center justify-between gap-4 py-2 border-b">
                          <div className="flex-1">
                            <span className="font-mono text-sm text-muted-foreground mr-2">{student.trainee_code}</span>
                            <span className="font-medium">{student.full_name}</span>
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              placeholder="Điểm"
                              min={0}
                              max={maxScore}
                              value={currentScore ?? ""}
                              onChange={(e) => handleScoreChange(student.id, e.target.value)}
                            />
                          </div>
                          <div className="w-16 text-right text-sm text-muted-foreground">
                            / {maxScore}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Đóng
                  </Button>
                  <Button onClick={handleUpdateExistingTest} disabled={bulkUpsert.isPending}>
                    {bulkUpsert.isPending ? "Đang lưu..." : "Cập nhật điểm"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}