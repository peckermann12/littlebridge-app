import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { isDemoMode } from "@/lib/supabase";

export interface Profile {
  id: string;
  role: "family" | "educator" | "center" | "admin";
  email: string;
  preferred_language: string;
  is_active: boolean;
  onboarding_completed: boolean;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  session: unknown;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, role: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    if (isDemoMode) {
      // In demo mode, check localStorage for a demo session
      try {
        const stored = localStorage.getItem("littlebridge_demo_user");
        if (stored) {
          const data = JSON.parse(stored);
          setUser({ id: data.id, email: data.email });
          setProfile(data);
        }
      } catch {}
      setLoading(false);
      return;
    }

    // Try the API backend
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser({ id: data.id, email: data.email });
        setProfile(data);
      }
    } catch {
      // API not available, stay logged out
    }
    setLoading(false);
  }

  const signIn = useCallback(async (email: string, password: string) => {
    if (isDemoMode) {
      // Demo mode sign in — accept any credentials
      const demoProfile: Profile = {
        id: "demo-user-001",
        email,
        role: email.includes("admin") ? "admin" : email.includes("center") ? "center" : "family",
        preferred_language: "en",
        is_active: true,
        onboarding_completed: true,
      };
      setUser({ id: demoProfile.id, email });
      setProfile(demoProfile);
      localStorage.setItem("littlebridge_demo_user", JSON.stringify(demoProfile));
      return {};
    }

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Sign in failed" };
      setUser({ id: data.id, email: data.email });
      setProfile(data);
      return {};
    } catch {
      return { error: "Network error. Please try again." };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, role: string) => {
    if (isDemoMode) {
      const demoProfile: Profile = {
        id: "demo-user-" + Date.now(),
        email,
        role: role as Profile["role"],
        preferred_language: "en",
        is_active: true,
        onboarding_completed: false,
      };
      setUser({ id: demoProfile.id, email });
      setProfile(demoProfile);
      localStorage.setItem("littlebridge_demo_user", JSON.stringify(demoProfile));
      return {};
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Sign up failed" };
      setUser({ id: data.id, email: data.email });
      setProfile(data);
      return {};
    } catch {
      return { error: "Network error. Please try again." };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      localStorage.removeItem("littlebridge_demo_user");
    } else {
      try {
        await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
      } catch {}
    }
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session: null, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
