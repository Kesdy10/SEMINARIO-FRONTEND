"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AlertCircle, Eye, EyeOff, Layers, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionExpired =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("expired") === "true";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Ingresa tu correo y tu contraseña.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.push("/");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Correo o contraseña incorrectos.");
      } else if (axios.isAxiosError(err) && !err.response) {
        setError("No se pudo conectar con el servidor.");
      } else {
        setError("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-sm space-y-5">
        {sessionExpired && (
          <div className="flex items-center gap-3 rounded border border-red-500/30 bg-red-500/10 px-4 py-3">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-red-400" />
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-red-400">
                401 Unauthorized
              </div>
              <div className="mt-0.5 text-[12px] text-foreground">
                Tu sesión expiró. Inicia sesión nuevamente.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded border border-primary/30 bg-primary/10">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">RAG Platform</h1>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              Consulta inteligente de proyectos de software
            </p>
          </div>
        </div>

        <div className="space-y-5 rounded border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Acceso restringido
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="usuario@correo.com"
                className="w-full rounded border border-border bg-secondary px-3 py-2.5 text-[13px] text-foreground placeholder-muted-foreground transition-colors focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded border border-border bg-secondary px-3 py-2.5 pr-10 text-[13px] text-foreground placeholder-muted-foreground transition-colors focus:border-primary/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {(error || sessionExpired) && !sessionExpired && error && (
              <div className="flex items-center gap-2 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Verificando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
