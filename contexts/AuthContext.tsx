import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { authApi, getToken, storeToken, clearToken, User } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;   // initial session check
  isLoggedIn: boolean;
}

interface AuthActions {
  login:  (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

type AuthContextValue = AuthState & AuthActions;

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  // ── Boot: restore session from storage ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const saved = await getToken();
        if (saved) {
          const res = await authApi.me();
          setToken(saved);
          setUser(res.data);
        }
      } catch {
        // Token invalid / expired — clear it
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const res = await authApi.login(email, password);
    await storeToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (
    name: string, email: string, password: string
  ): Promise<User> => {
    const res = await authApi.register({
      name,
      email,
      password,
      password_confirmation: password,
    });
    await storeToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    await clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isLoggedIn: !!user,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
