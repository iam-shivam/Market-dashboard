// src/context/AuthContext.tsx
// React Context = global state any component can read without prop-drilling.
// This one stores the logged-in user and token.
//  
// Usage in any component:
//   const { user, login, logout } = useAuth();

import  {
  createContext,
  useContext,
  useState,
  useEffect,
 type ReactNode,
} from "react";
import type { User } from "../types/oi";
import { apiLogin, apiVerify } from "../api";

// ── Types ──────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ── Context ────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider — wraps your entire app in main.tsx ───────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load: check if there's a stored token and if it's still valid
  useEffect(() => {
    const stored = localStorage.getItem("oi_token");
    if (!stored) {
      setIsLoading(false);
      return;
    }
    apiVerify()
      .then(({ valid, user: u }) => {
        if (valid && u) {
          setToken(stored);
          setUser(u as User);
        } else {
          localStorage.removeItem("oi_token");
        }
      })
      .catch(() => localStorage.removeItem("oi_token"))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { token: t, user: u } = await apiLogin(email, password);
    localStorage.setItem("oi_token", t);
    setToken(t);
    setUser(u);
  };

  const logout = (): void => {
    localStorage.removeItem("oi_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}
