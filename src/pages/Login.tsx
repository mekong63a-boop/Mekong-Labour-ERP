import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LogIn, UserPlus, Shield, Sparkles, Mail } from "lucide-react";
import mekongLogo from "@/assets/mekong-logo.png";
import { supabase } from "@/integrations/supabase/client";

// Helper function to log auth events
const logAuthEvent = async (action: "LOGIN" | "LOGOUT", userId: string, email: string, success: boolean) => {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      table_name: "auth",
      description: success 
        ? `${action === "LOGIN" ? "Đăng nhập" : "Đăng xuất"} thành công: ${email}`
        : `${action === "LOGIN" ? "Đăng nhập" : "Đăng xuất"} thất bại: ${email}`,
    });
  } catch (error) {
    console.error("Error logging auth event:", error);
  }
};

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, assignFirstAdmin, hasAnyAdmin, user, role } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResendOption(false);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      // Check if error is "Email not confirmed"
      const isEmailNotConfirmed = error.message?.toLowerCase().includes("email not confirmed") ||
                                   error.message?.toLowerCase().includes("email_not_confirmed");
      
      if (isEmailNotConfirmed) {
        setShowResendOption(true);
      }
      
      toast({
        title: "Đăng nhập thất bại",
        description: isEmailNotConfirmed 
          ? "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư (bao gồm Spam) hoặc gửi lại email xác nhận."
          : error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Fire-and-forget audit log (đừng chặn UI / điều hướng)
    void (async () => {
      try {
        const {
          data: { user: loggedInUser },
        } = await supabase.auth.getUser();
        if (loggedInUser) {
          await logAuthEvent("LOGIN", loggedInUser.id, loginEmail, true);
        }
      } catch (e) {
        console.error("Error logging login event:", e);
      }
    })();

    toast({
      title: "Đăng nhập thành công",
      description: "Chào mừng bạn trở lại!",
    });
    navigate("/");
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(registerEmail, registerPassword, registerFullName);

    if (error) {
      toast({
        title: "Đăng ký thất bại",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Đăng ký thành công",
        description: "Vui lòng kiểm tra email để xác nhận tài khoản hoặc đăng nhập trực tiếp.",
      });
    }

    setIsLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!loginEmail) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email để gửi lại xác nhận",
        variant: "destructive",
      });
      return;
    }

    setIsResendingEmail(true);
    
    const redirectUrl = window.location.hostname === "localhost" 
      ? window.location.origin 
      : "https://erpmekong.lovable.app";

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: loginEmail,
      options: {
        emailRedirectTo: `${redirectUrl}/login`,
      },
    });

    if (error) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Đã gửi email",
        description: "Vui lòng kiểm tra hộp thư (bao gồm thư mục Spam) và click vào link xác nhận.",
      });
      setShowResendOption(false);
    }

    setIsResendingEmail(false);
  };

  const handleAssignAdmin = async () => {
    setIsAssigning(true);
    const success = await assignFirstAdmin();
    
    if (success) {
      toast({
        title: "Thiết lập thành công",
        description: "Bạn đã được gán quyền Admin!",
      });
      navigate("/");
    } else {
      toast({
        title: "Lỗi",
        description: "Không thể gán quyền Admin. Có thể đã có Admin khác.",
        variant: "destructive",
      });
    }
    setIsAssigning(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(152,60%,8%)] via-[hsl(152,50%,12%)] to-[hsl(160,45%,18%)]" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[hsl(152,60%,30%)]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[hsl(165,50%,25%)]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[hsl(152,40%,20%)]/10 rounded-full blur-3xl" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="relative w-full max-w-md z-10">
        {/* Logo & Title - Enhanced */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[hsl(152,50%,40%)] to-[hsl(165,45%,35%)] rounded-3xl opacity-40 blur-xl group-hover:opacity-60 transition-opacity duration-500" />
              {/* Logo Container */}
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
            Mekong Connect Hub
          </h1>
          <p className="text-[hsl(152,30%,70%)] text-lg font-medium">
            Hệ thống quản lý thực tập sinh
          </p>
        </div>

        {/* First Admin Setup Banner */}
        {!hasAnyAdmin && user && !role && (
          <div className="mb-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl p-5 shadow-xl">
              <div className="absolute inset-0 bg-amber-400/5" />
              <div className="relative flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-100 text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Thiết lập Admin đầu tiên
                  </h3>
                  <p className="text-amber-200/80 mt-1 text-sm leading-relaxed">
                    Hệ thống chưa có Admin. Bạn có thể trở thành Admin đầu tiên để quản lý toàn bộ hệ thống.
                  </p>
                  <Button 
                    onClick={handleAssignAdmin}
                    disabled={isAssigning}
                    className="mt-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black font-bold shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40"
                  >
                    {isAssigning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Trở thành Admin
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auth Card - Glass Morphism */}
        <div className="relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Card Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[hsl(152,50%,35%)] via-[hsl(160,45%,30%)] to-[hsl(152,50%,35%)] rounded-3xl opacity-30 blur-xl" />
          
          <Card className="relative border-0 bg-white/[0.07] backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden">
            {/* Inner Border Gradient */}
            <div className="absolute inset-0 rounded-2xl border border-white/20" />
            
            <CardHeader className="text-center pb-2 pt-8 relative">
              <CardTitle className="text-2xl font-bold text-white">Chào mừng</CardTitle>
              <CardDescription className="text-white/60 mt-1">
                Đăng nhập hoặc tạo tài khoản mới
              </CardDescription>
            </CardHeader>
            <CardContent className="relative pb-8 px-8">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 p-1 rounded-xl h-12">
                  <TabsTrigger 
                    value="login" 
                    className="rounded-lg font-semibold text-white/70 data-[state=active]:bg-white data-[state=active]:text-[hsl(152,50%,20%)] data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    Đăng nhập
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="rounded-lg font-semibold text-white/70 data-[state=active]:bg-white data-[state=active]:text-[hsl(152,50%,20%)] data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    Đăng ký
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="mt-8">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-white font-medium">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="email@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(152,50%,50%)] focus:ring-2 focus:ring-[hsl(152,50%,50%)]/20 rounded-xl transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-white font-medium">Mật khẩu</Label>
                        <Link 
                          to="/forgot-password" 
                          className="text-sm text-[hsl(152,50%,60%)] hover:text-[hsl(152,50%,70%)] transition-colors"
                        >
                          Quên mật khẩu?
                        </Link>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
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
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-5 w-5" />
                          Đăng nhập
                        </>
                      )}
                    </Button>
                    
                    {/* Resend confirmation email option */}
                    {showResendOption && (
                      <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <p className="text-amber-200 text-sm mb-3">
                          Email chưa được xác nhận? Click để gửi lại email xác nhận.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResendConfirmation}
                          disabled={isResendingEmail}
                          className="w-full h-10 bg-amber-500/20 border-amber-500/40 text-amber-100 hover:bg-amber-500/30 hover:text-white rounded-lg"
                        >
                          {isResendingEmail ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang gửi...
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Gửi lại email xác nhận
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register" className="mt-8">
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-white font-medium">Họ và tên</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={registerFullName}
                        onChange={(e) => setRegisterFullName(e.target.value)}
                        required
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(152,50%,50%)] focus:ring-2 focus:ring-[hsl(152,50%,50%)]/20 rounded-xl transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-white font-medium">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="email@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(152,50%,50%)] focus:ring-2 focus:ring-[hsl(152,50%,50%)]/20 rounded-xl transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-white font-medium">Mật khẩu</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(152,50%,50%)] focus:ring-2 focus:ring-[hsl(152,50%,50%)]/20 rounded-xl transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm" className="text-white font-medium">Xác nhận mật khẩu</Label>
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
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
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-5 w-5" />
                          Tạo tài khoản
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
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
