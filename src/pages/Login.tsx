import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LogIn, UserPlus, Shield } from "lucide-react";
import mekongLogo from "@/assets/mekong-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, assignFirstAdmin, hasAnyAdmin, user, role } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
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

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn trở lại!",
      });
      navigate("/");
    }

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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(152,45%,15%)] via-[hsl(152,40%,20%)] to-[hsl(152,35%,25%)] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-2xl">
              <img 
                src={mekongLogo} 
                alt="Mekong Logo" 
                className="h-16 w-auto"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Mekong Connect Hub</h1>
          <p className="text-white/70">Hệ thống quản lý thực tập sinh</p>
        </div>

        {/* First Admin Setup Banner */}
        {!hasAnyAdmin && user && !role && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-500/20 rounded-full">
                  <Shield className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-100">Thiết lập Admin đầu tiên</h3>
                  <p className="text-sm text-amber-200/70 mt-1">
                    Hệ thống chưa có Admin. Bạn có thể trở thành Admin đầu tiên để quản lý toàn bộ hệ thống.
                  </p>
                  <Button 
                    onClick={handleAssignAdmin}
                    disabled={isAssigning}
                    className="mt-4 bg-amber-500 hover:bg-amber-600 text-black"
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
            </CardContent>
          </Card>
        )}

        {/* Auth Card */}
        <Card className="border-white/20 bg-white/10 backdrop-blur-md shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-white">Chào mừng</CardTitle>
            <CardDescription className="text-white/60">
              Đăng nhập hoặc tạo tài khoản mới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[hsl(152,40%,20%)]"
                >
                  Đăng nhập
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-white data-[state=active]:text-[hsl(152,40%,20%)]"
                >
                  Đăng ký
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white/80">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white/80">Mật khẩu</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-[hsl(152,40%,20%)] hover:bg-white/90 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Đăng nhập
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-white/80">Họ và tên</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-white/80">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="email@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-white/80">Mật khẩu</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="text-white/80">Xác nhận mật khẩu</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-[hsl(152,40%,20%)] hover:bg-white/90 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Tạo tài khoản
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-6">
          © 2024 Mekong Connect Hub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
