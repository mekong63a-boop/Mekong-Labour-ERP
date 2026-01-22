import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import mekongLogo from "@/assets/mekong-logo.png";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Luôn trỏ về domain publish để tránh email bị trỏ nhầm (localhost/preview)
  const RESET_REDIRECT_URL = "https://erpmekong.lovable.app/reset-password";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: RESET_REDIRECT_URL,
    });

    if (error) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEmailSent(true);
      toast({
        title: "Đã gửi email",
        description: "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu",
      });
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
            Quên mật khẩu
          </h1>
          <p className="text-[hsl(152,30%,70%)] text-lg font-medium">
            Nhập email để đặt lại mật khẩu
          </p>
        </div>

        {/* Card */}
        <div className="relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="absolute -inset-1 bg-gradient-to-r from-[hsl(152,50%,35%)] via-[hsl(160,45%,30%)] to-[hsl(152,50%,35%)] rounded-3xl opacity-30 blur-xl" />
          
          <Card className="relative border-0 bg-white/[0.07] backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 rounded-2xl border border-white/20" />
            
            <CardHeader className="text-center pb-2 pt-8 relative">
              {emailSent ? (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-green-500/20 rounded-full">
                      <CheckCircle className="h-12 w-12 text-green-400" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">Đã gửi email!</CardTitle>
                  <CardDescription className="text-white/60 mt-2">
                    Vui lòng kiểm tra hộp thư <strong className="text-white">{email}</strong> và làm theo hướng dẫn để đặt lại mật khẩu.
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/20 rounded-full">
                      <Mail className="h-12 w-12 text-[hsl(152,50%,50%)]" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">Đặt lại mật khẩu</CardTitle>
                  <CardDescription className="text-white/60 mt-1">
                    Nhập địa chỉ email đã đăng ký
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            <CardContent className="relative pb-8 px-8">
              {emailSent ? (
                <div className="space-y-4">
                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                  >
                    Gửi lại email
                  </Button>
                  <Link to="/login">
                    <Button className="w-full h-12 bg-gradient-to-r from-[hsl(152,50%,40%)] to-[hsl(160,45%,35%)] hover:from-[hsl(152,50%,45%)] hover:to-[hsl(160,45%,40%)] text-white font-bold rounded-xl shadow-lg border-0">
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Quay lại đăng nhập
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(152,50%,50%)] focus:ring-2 focus:ring-[hsl(152,50%,50%)]/20 rounded-xl transition-all duration-300"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-[hsl(152,50%,40%)] to-[hsl(160,45%,35%)] hover:from-[hsl(152,50%,45%)] hover:to-[hsl(160,45%,40%)] text-white font-bold rounded-xl shadow-lg shadow-[hsl(152,50%,30%)]/30 hover:shadow-[hsl(152,50%,30%)]/50 transition-all duration-300 border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Gửi link đặt lại mật khẩu
                      </>
                    )}
                  </Button>

                  <Link to="/login" className="block">
                    <Button 
                      type="button"
                      variant="ghost"
                      className="w-full h-12 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Quay lại đăng nhập
                    </Button>
                  </Link>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-8 font-medium">
          © 2026 Mekong Connect Hub. Bảo lưu mọi quyền.
        </p>
      </div>
    </div>
  );
}
