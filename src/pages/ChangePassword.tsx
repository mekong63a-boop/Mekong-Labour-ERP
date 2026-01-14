import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, CheckCircle, Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Get current user's email
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin người dùng",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Verify current password by trying to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu hiện tại không đúng",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsSuccess(true);
      toast({
        title: "Thành công",
        description: "Mật khẩu đã được thay đổi",
      });
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }

    setIsLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Đổi mật khẩu</h1>
            <p className="text-muted-foreground">Thay đổi mật khẩu tài khoản của bạn</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <Card>
        <CardHeader>
          {isSuccess ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Thành công!</CardTitle>
              <CardDescription className="mt-2">
                Mật khẩu đã được thay đổi. Đang chuyển hướng...
              </CardDescription>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Lock className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center">Tạo mật khẩu mới</CardTitle>
              <CardDescription className="text-center">
                Nhập mật khẩu hiện tại và mật khẩu mới
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(-1)}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Đổi mật khẩu
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
