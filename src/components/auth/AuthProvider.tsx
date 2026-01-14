import { ReactNode } from "react";
import { AuthProvider as AuthContextProvider, useAuthState } from "@/hooks/useAuth";

interface AuthProviderWrapperProps {
  children: ReactNode;
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  const authState = useAuthState();
  
  return (
    <AuthContextProvider value={authState}>
      {children}
    </AuthContextProvider>
  );
}
