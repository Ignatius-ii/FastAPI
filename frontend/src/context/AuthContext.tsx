import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, LoginPayload } from "@/types";
import { authApi } from "@/api/auth";
import { setAccessToken, setStoredRefreshToken, getStoredRefreshToken } from "@/api/client";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean; // true only during the initial session-restore check
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, if a refresh token survived from a previous session,
  // silently try to restore it rather than forcing a fresh login every time.
  useEffect(() => {
    async function restoreSession() {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }
      try {
        // apiRequest's 401 handling can't kick in until we have SOME access
        // token to attempt, so directly hit /auth/me — client.ts will
        // transparently refresh using the stored refresh token on the 401.
        const me = await authApi.me();
        setUser(me);
      } catch {
        setStoredRefreshToken(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(payload: LoginPayload) {
    const tokens = await authApi.login(payload);
    setAccessToken(tokens.access_token);
    setStoredRefreshToken(tokens.refresh_token);
    const me = await authApi.me();
    setUser(me);
  }

  async function logout() {
    const refreshToken = getStoredRefreshToken();
    setAccessToken(null);
    setStoredRefreshToken(null);
    setUser(null);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // best-effort — local state is already cleared either way
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
