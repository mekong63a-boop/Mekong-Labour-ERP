import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import mekongLogo from "@/assets/mekong-logo.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if we have a session from the recovery link
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User is in password recovery mode
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
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
        description: "Mật khẩu đã được đặt lại",
      });
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(152,60%,8%)] via-[hsl(152,50%,12%)] to-[hsl(160,45%,18%)]" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[hsl(152,60%,30%)]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[hsl(165,50%,25%)]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="relative w-full max-w-md z-10">
        {/* Logo & Title */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-[hsl(152,50%,40%)] to-[hsl(165,45%,35%)] rounded-3xl opacity-40 blur-xl group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative bg-white rounded-2xl p-5 shadow-2xl transform transition-transform duration-300 group-hover:scale-105">
                <img 
                  src={mekongLogo} 
                  alt="Mekong Logo" 
                  className="h-16 w-auto"
                />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">
            Đặt lại mật khẩu
          </h1>
          <p className="text-[hsl(152,30%,70%)] text-lg font-medium">
            Nhập mật khẩu mới cho tài khoản
          </p>
        </div>

        {/* Card */}
        <div className="relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="absolute -inset-1 bg-gradient-to-r from-[hsl(152,50%,35%)] via-[hsl(160,45%,30%)] to-[hsl(152,50%,35%)] rounded-3xl opacity-30 blur-xl" />
          
          <Card className="relative border-0 bg-white/[0.07] backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 rounded-2xl border border-white/20" />
            
            <CardHeader className="text-center pb-2 pt-8 relative">
              {isSuccess ? (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-green-500/20 rounded-full">
                      <CheckCircle className="h-12 w-12 text-green-400" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">Thành công!</CardTitle>
                  <CardDescription className="text-white/60 mt-2">
                    Mật khẩu đã được đặt lại. Đang chuyển hướng...
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/20 rounded-full">
                      <Lock className="h-12 w-12 text-[hsl(152,50%,50%)]" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">Mật khẩu mới</CardTitle>
                  <CardDescription className="text-white/60 mt-1">
                    Tạo mật khẩu mới an toàn
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            <CardContent className="relative pb-8 px-8">
              {!isSuccess && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-medium">Mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(152,50%,50%)] focus:ring-2 focus:ring-[hsl(152,50%,50%)]/20 rounded-xl transition-all duration-300 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white font-medium">Xác nhận mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(152,50%,50%)] focus:ring-2 focus:ring-[hsl(152,50%,50%)]/20 rounded-xl transition-all duration-300 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-[hsl(152,50%,40%)] to-[hsl(160,45%,35%)] hover:from-[hsl(152,50%,45%)] hover:to-[hsl(160,45%,40%)] text-white font-bold rounded-xl shadow-lg shadow-[hsl(152,50%,30%)]/30 hover:shadow-[hsl(152,50%,30%)]/50 transition-all duration-300 border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        Đặt mật khẩu mới
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-8 font-medium">
          © 2026 Mekong Connect Hub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
