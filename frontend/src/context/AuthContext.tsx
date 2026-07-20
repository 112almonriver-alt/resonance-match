import { createContext, useContext, useState, ReactNode } from "react";
import { apiFetch } from "../api/client";

type User = { id: string; name: string; email: string };

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    birthDate: string;
    city: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("resonance_user");
    return raw ? JSON.parse(raw) : null;
  });

  function persist(token: string, user: User) {
    localStorage.setItem("resonance_token", token);
    localStorage.setItem("resonance_user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email: string, password: string) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    persist(data.token, data.user);
  }

  async function register(payload: {
    email: string;
    password: string;
    name: string;
    birthDate: string;
    city: string;
  }) {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    persist(data.token, data.user);
  }

  function logout() {
    localStorage.removeItem("resonance_token");
    localStorage.removeItem("resonance_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен использоваться внутри AuthProvider");
  return ctx;
}
