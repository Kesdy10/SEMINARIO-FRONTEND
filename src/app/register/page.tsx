"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AlertCircle, Layers, UserPlus } from "lucide-react";
import { register } from "@/services/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return "Ingresa tu nombre.";
    if (!EMAIL_REGEX.test(email.trim())) return "Ingresa un correo válido.";
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      router.push("/login");
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError("No se pudo conectar con el servidor.");
      } else if (axios.isAxiosError(err) && (err.response?.status === 400 || err.response?.status === 409)) {
        const detail = err.response.data?.detail;
        setError(typeof detail === "string" ? detail : "Ese correo ya está registrado.");
      } else {
        setError("Ocurrió un error al registrarte. Intenta de nuevo.");
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
            <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Crear cuenta
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="name" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-border bg-secondary px-3 py-2.5 text-[13px] text-foreground placeholder-muted-foreground transition-colors focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@correo.com"
                className="w-full rounded border border-border bg-secondary px-3 py-2.5 text-[13px] text-foreground placeholder-muted-foreground transition-colors focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-border bg-secondary px-3 py-2.5 text-[13px] text-foreground placeholder-muted-foreground transition-colors focus:border-primary/60 focus:outline-none"
              />
              <p className="font-mono text-[10px] text-muted-foreground">Mínimo 8 caracteres.</p>
            </div>

            {error && (
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
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
