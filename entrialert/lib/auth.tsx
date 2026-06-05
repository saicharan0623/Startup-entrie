"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  organization_name: string;
  organization_id: string;
  role: "admin" | "viewer";
  api_key: string;
  created_at: string;
  last_login: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  isAdmin: false,
  isLoggedIn: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("entrialert_user");
      if (stored) setUserState(JSON.parse(stored));
    } catch {
      localStorage.removeItem("entrialert_user");
    }
  }, []);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem("entrialert_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("entrialert_user");
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        isAdmin: user?.role === "admin",
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
