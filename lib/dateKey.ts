/**
 * Converte Date | string ISO para "yyyy-MM-dd" sem sofrer com timezone.
 *
 * Heuristica:
 * - String ISO ("2026-05-19T..."): pega primeiros 10 chars (data UTC armazenada).
 * - Date object com hora exatamente 00:00:00 UTC: veio do `@db.Date` → usa componentes UTC.
 * - Date object com hora UTC != 00:00:00: foi gerado localmente (date-fns) → usa componentes locais.
 *
 * Resolve o bug onde `format(new Date(dataUTC), "yyyy-MM-dd")` recua 1 dia em UTC-3.
 */
export function dateKey(d: Date | string | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string") {
    return d.slice(0, 10);
  }
  // Date object vindo de @db.Date (Prisma) está em UTC midnight
  if (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  ) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
  // Date object local (date-fns startOfWeek, eachDayOfInterval, etc.)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
