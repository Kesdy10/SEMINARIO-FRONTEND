"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, Layers, LogOut, MessageSquare, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { href: "/chat", label: "Consulta RAG", icon: MessageSquare },
  { href: "/login-history", label: "Historial accesos", icon: Clock },
  { href: "/profile", label: "Mi perfil", icon: UserIcon },
];

// Navegacion lateral persistente de toda la app autenticada
export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "—";

  return (
    <aside className="flex h-screen w-44 flex-shrink-0 flex-col border-r border-border bg-sidebar">
      <Link href="/" className="flex items-center gap-2 border-b border-sidebar-border px-3 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded border border-primary/30 bg-primary/10">
          <Layers className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[13px] font-semibold text-foreground">RAG Platform</span>
      </Link>

      <nav className="flex-1 space-y-0.5 p-2">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded px-2.5 py-2 font-mono text-[12px] transition-colors ${
                active
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-sidebar-border p-2.5">
          <div className="flex items-center gap-2 rounded px-1 py-1.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] text-foreground">{user.name}</div>
              <div className="truncate font-mono text-[10px] text-muted-foreground">{user.role}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="flex-shrink-0 text-muted-foreground transition-colors hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
