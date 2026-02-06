import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useClassStudents, useTraineeReviews, useCreateReview, useDeleteReview } from "@/hooks/useEducation";
import { useToast } from "@/hooks/use-toast";
import { formatVietnameseDatetime } from "@/lib/vietnamese-utils";
import { Trash2, Star, AlertTriangle } from "lucide-react";

interface ReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
}

const REVIEW_TYPES = [
  { value: "general", label: "Nhận xét chung" },
  { value: "behavior", label: "Hành vi" },
  { value: "academic", label: "Học tập" },
  { value: "blacklist", label: "Blacklist" },
];

export function ReviewsDialog({ open, onOpenChange, classId, className }: ReviewsDialogProps) {
  const { toast } = useToast();
  const { data: students } = useClassStudents(classId);
  const { data: reviews, refetch: refetchReviews } = useTraineeReviews(undefined, classId);
  const createReview = useCreateReview();
  const deleteReview = useDeleteReview();
  
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>("");
  const [formData, setFormData] = useState({
    review_type: "general",
    rating: 3,
    content: "",
    is_blacklisted: false,
    blacklist_reason: "",
  });

  const handleSubmit = async () => {
    if (!selectedTraineeId) {
      toast({ title: "Vui lòng chọn học viên", variant: "destructive" });
      return;
    }
    if (!formData.content.trim()) {
      toast({ title: "Vui lòng nhập nội dung nhận xét", variant: "destructive" });
      return;
    }

    try {
      await createReview.mutateAsync({
        trainee_id: selectedTraineeId,
        class_id: classId,
        review_type: formData.review_type,
        rating: formData.rating,
        content: formData.content,
        is_blacklisted: formData.is_blacklisted,
        blacklist_reason: formData.is_blacklisted ? formData.blacklist_reason : undefined,
      });
      
      toast({ title: "Thêm nhận xét thành công" });
      setFormData({
        review_type: "general",
        rating: 3,
        content: "",
        is_blacklisted: false,
        blacklist_reason: "",
      });
      setSelectedTraineeId("");
      refetchReviews();
    } catch (error) {
      toast({ title: "Lỗi khi thêm nhận xét", variant: "destructive" });
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteReview.mutateAsync(reviewId);
      toast({ title: "Đã xóa nhận xét" });
    } catch (error) {
      toast({ title: "Lỗi khi xóa nhận xét", variant: "destructive" });
    }
  };

  const getTypeLabel = (type: string) => {
    return REVIEW_TYPES.find(t => t.value === type)?.label || type;
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "blacklist":
        return "bg-red-100 text-red-800";
      case "behavior":
        return "bg-yellow-100 text-yellow-800";
      case "academic":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nhận xét / Blacklist - {className}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Form thêm nhận xét */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Thêm nhận xét mới</h3>
            
            <div>
              <Label>Học viên *</Label>
              <Select value={selectedTraineeId} onValueChange={setSelectedTraineeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học viên..." />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.trainee_code} - {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Loại nhận xét</Label>
              <Select 
                value={formData.review_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, review_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Đánh giá (1-5)</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={formData.rating >= rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, rating }))}
                  >
                    <Star className={`h-4 w-4 ${formData.rating >= rating ? "fill-current" : ""}`} />
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Nội dung nhận xét *</Label>
              <Textarea
                placeholder="Nhập nội dung nhận xét..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="blacklist"
                checked={formData.is_blacklisted}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_blacklisted: !!checked }))}
              />
              <Label htmlFor="blacklist" className="text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Đưa vào blacklist
              </Label>
            </div>

            {formData.is_blacklisted && (
              <div>
                <Label>Lý do blacklist</Label>
                <Input
                  placeholder="Nhập lý do..."
                  value={formData.blacklist_reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, blacklist_reason: e.target.value }))}
                />
              </div>
            )}

            <Button onClick={handleSubmit} disabled={createReview.isPending} className="w-full">
              {createReview.isPending ? "Đang lưu..." : "Thêm nhận xét"}
            </Button>
          </div>

          {/* Danh sách nhận xét */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Lịch sử nhận xét ({reviews?.length || 0})</h3>
            
            <ScrollArea className="h-[450px] border rounded-md p-2">
              {reviews && reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => {
                    const trainee = review.trainee as any;
                    return (
                      <div 
                        key={review.id} 
                        className={`p-3 rounded-lg border ${review.is_blacklisted ? 'border-red-300 bg-red-50' : 'bg-muted/30'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{trainee?.full_name}</span>
                              <Badge className={getTypeBadgeClass(review.review_type)}>
                                {getTypeLabel(review.review_type)}
                              </Badge>
                              {review.is_blacklisted && (
                                <Badge className="bg-red-600 text-white">BLACKLIST</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-3 w-3 ${review.rating && star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">{review.content}</p>
                            {review.blacklist_reason && (
                              <p className="text-sm text-red-600 mt-1">Lý do: {review.blacklist_reason}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatVietnameseDatetime(review.created_at)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(review.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có nhận xét nào
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}