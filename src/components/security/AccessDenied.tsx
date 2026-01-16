import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AccessDeniedProps {
  message?: string;
  requiredRole?: string;
  currentRole?: string;
}

export function AccessDenied({ 
  message = "Bạn không có quyền truy cập nội dung này.",
  requiredRole,
  currentRole 
}: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-destructive mb-2">Truy cập bị từ chối</h2>
      <p className="text-muted-foreground text-center mb-4 max-w-md">{message}</p>
      
      {requiredRole && currentRole && (
        <p className="text-sm text-muted-foreground mb-4">
          Vai trò yêu cầu: <span className="font-medium">{requiredRole}</span>
          <br />
          Vai trò của bạn: <span className="font-medium">{currentRole}</span>
        </p>
      )}
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
        <Button onClick={() => navigate("/")}>
          Trang chủ
        </Button>
      </div>
    </div>
  );
}
