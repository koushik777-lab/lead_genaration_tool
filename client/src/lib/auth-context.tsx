import React, { createContext, useContext, useState, useEffect } from "react";
import { apiAuth } from "./api";
import { navigateTo } from "@/lib/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await apiAuth.me();
        setUser(userData);
      } catch (err) {
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const login = async (data: any) => {
    const res = await apiAuth.login(data);
    setUser(res);
  };

  const register = async (data: any) => {
    const res = await apiAuth.register(data);
    setUser(res);
  };

  const logout = async () => {
    try {
      await apiAuth.logout();
    } finally {
      setUser(null);
      navigateTo("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
