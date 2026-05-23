/**
 * Converte Date | string ISO para "yyyy-MM-dd" sem sofrer com timezone.
 *
 * - Strings ISO ("2026-05-19T00:00:00.000Z") → pega primeiros 10 chars (data UTC armazenada).
 * - Date objects (gerados localmente via date-fns) → usa componentes locais.
 *
 * Isto resolve o bug onde `format(new Date(dataUTC), "yyyy-MM-dd")` recua 1 dia
 * para clientes em fuso negativo (Brasil UTC-3).
 */
export function dateKey(d: Date | string | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string") {
    return d.slice(0, 10);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
