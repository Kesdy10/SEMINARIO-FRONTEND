// El backend guarda las fechas en UTC pero las envía sin zona horaria
// ("2026-10-15T19:58:35"). Sin la "Z" el navegador las tomaría como hora
// local y se verían adelantadas (6 horas en Guatemala).
export function parseBackendDate(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function formatDateTime(
  value?: string | null,
  options: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "medium" }
): string {
  if (!value) return "—";
  const date = parseBackendDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-GT", options);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = parseBackendDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-GT");
}
