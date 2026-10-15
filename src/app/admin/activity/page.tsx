"use client";

import { useEffect, useMemo, useState } from "react";
import type { ActivityEvent } from "@/types/api";
import { Activity, Calendar, Filter, Loader, RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getActivity } from "@/services/activity";
import { formatDateTime, parseBackendDate } from "@/lib/dates";

const ACTIVITY_TYPES = [
  { value: "project_created", label: "Proyecto creado", color: "bg-blue-500/10 text-blue-400" },
  { value: "document", label: "Documento indexado", color: "bg-green-500/10 text-green-400" },
  { value: "repository", label: "Repositorio indexado", color: "bg-purple-500/10 text-purple-400" },
  { value: "commit", label: "Commits indexados", color: "bg-amber-500/10 text-amber-400" },
];

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(ACTIVITY_TYPES.map((t) => t.value));
  const [sinceDays, setSinceDays] = useState(7);

  const loadActivity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const since = new Date();
      since.setDate(since.getDate() - sinceDays);
      const data = await getActivity(since);
      setActivities(data || []);
    } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setError("No se pudo cargar la actividad.");
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinceDays]);

  const filteredActivities = useMemo(
    // El backend las entrega de la más antigua a la más reciente; se muestran al revés.
    () =>
      activities
        .filter((a) => selectedTypes.includes(a.type))
        .sort(
          (a, b) =>
            parseBackendDate(b.created_at).getTime() - parseBackendDate(a.created_at).getTime()
        ),
    [activities, selectedTypes]
  );

  const toggleActivityType = (type: string) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((t) => t !== type) : [...current, type]
    );
  };

  const getActivityColor = (type: string) => {
    const found = ACTIVITY_TYPES.find((t) => t.value === type);
    return found?.color || "bg-gray-500/10 text-gray-400";
  };

  const getActivityLabel = (type: string) => {
    const found = ACTIVITY_TYPES.find((t) => t.value === type);
    return found?.label || type;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Actividad reciente</h1>
          </div>
          <button
            onClick={loadActivity}
            disabled={isLoading}
            className="rounded border border-border bg-secondary px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            <RefreshCw className={`inline h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sinceDays}
                  onChange={(e) => setSinceDays(Number(e.target.value))}
                  className="rounded border border-border bg-secondary px-2 py-1 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
                >
                  <option value={1}>Últimas 24 horas</option>
                  <option value={7}>Últimos 7 días</option>
                  <option value={30}>Últimos 30 días</option>
                  <option value={90}>Últimos 90 días</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                {ACTIVITY_TYPES.map((type) => {
                  const isActive = selectedTypes.includes(type.value);
                  return (
                    <button
                      key={type.value}
                      onClick={() => toggleActivityType(type.value)}
                      className={`rounded border px-2 py-1 text-[11px] transition-colors ${
                        isActive
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2 p-4">
            {error && <p className="rounded bg-red-500/10 px-3 py-2 text-[12px] text-red-400">{error}</p>}

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && filteredActivities.length === 0 && (
              <p className="rounded bg-secondary px-3 py-2 text-[12px] text-muted-foreground">
                Sin actividad en este período.
              </p>
            )}

            {filteredActivities.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded border border-border bg-secondary/30 p-3 text-[12px]"
              >
                <div
                  className={`mt-0.5 rounded px-2 py-0.5 font-mono text-[10px] ${getActivityColor(activity.type)}`}
                >
                  {getActivityLabel(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  {activity.project_name && (
                    <p className="font-mono text-foreground">
                      Proyecto: <span className="text-primary">{activity.project_name}</span>
                    </p>
                  )}
                  {activity.source && (
                    <p className="truncate font-mono text-muted-foreground">
                      Fuente: {activity.source}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {formatDateTime(activity.created_at, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
