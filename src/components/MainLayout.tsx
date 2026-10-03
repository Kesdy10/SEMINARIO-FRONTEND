"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow">
        <div>
          <h1 className="text-xl font-bold">Plataforma RAG</h1>

          {user && (
            <p className="text-sm text-gray-600">
              Bienvenido, {user.name}
            </p>
          )}
        </div>

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        )}
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}