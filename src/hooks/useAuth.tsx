"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as authService from "@/services/auth";
import { getToken } from "@/services/token";
import type { LoginRequest, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Envuelve la aplicación y guarda quién inició sesión
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al abrir la app: si ya hay un token en la cookie, recupera los datos del usuario
  useEffect(() => {
    let active = true;

    async function loadSession() {
      const savedToken = getToken();
      if (savedToken) {
        try {
          const me = await authService.getMe();
          if (active) {
            setTokenState(savedToken);
            setUser(me);
          }
        } catch {
          // Token inválido o sesión expirada: se queda sin usuario
        }
      }
      if (active) setIsLoading(false);
    }

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authService.login(data);
    setTokenState(response.access_token);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Cualquier pantalla usa esto para saber quién inició sesión
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return context;
}