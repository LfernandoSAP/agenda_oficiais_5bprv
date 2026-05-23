/**
 * Feriados brasileiros nativos — calculados em runtime.
 * Inclui nacionais (todos os anos), móveis (via Páscoa) e estadual SP.
 */

export type TipoFeriado = "NACIONAL" | "ESTADUAL" | "MUNICIPAL" | "PONTO_FACULTATIVO";

export type Feriado = {
  data: string; // yyyy-MM-dd
  nome: string;
  tipo: TipoFeriado;
};

/** Algoritmo de Páscoa Gregoriano Anônimo */
function easterDate(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function offsetDate(year: number, month: number, day: number, offset: number): string {
  const d = new Date(Date.UTC(year, month - 1, day + offset));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Retorna todos os feriados de um ano */
export function getFeriadosAno(year: number): Feriado[] {
  const easter = easterDate(year);
  const carnavalSegunda = offsetDate(year, easter.month, easter.day, -48);
  const carnavalTerca = offsetDate(year, easter.month, easter.day, -47);
  const cinzas = offsetDate(year, easter.month, easter.day, -46);
  const sextaSanta = offsetDate(year, easter.month, easter.day, -2);
  const corpusChristi = offsetDate(year, easter.month, easter.day, 60);

  return [
    { data: `${year}-01-01`, nome: "Confraternização Universal", tipo: "NACIONAL" },
    { data: carnavalSegunda, nome: "Carnaval", tipo: "PONTO_FACULTATIVO" },
    { data: carnavalTerca, nome: "Carnaval", tipo: "PONTO_FACULTATIVO" },
    { data: cinzas, nome: "Quarta-feira de Cinzas (meio-dia)", tipo: "PONTO_FACULTATIVO" },
    { data: sextaSanta, nome: "Sexta-feira Santa", tipo: "NACIONAL" },
    { data: `${year}-04-21`, nome: "Tiradentes", tipo: "NACIONAL" },
    { data: `${year}-05-01`, nome: "Dia do Trabalho", tipo: "NACIONAL" },
    { data: corpusChristi, nome: "Corpus Christi", tipo: "NACIONAL" },
    { data: `${year}-07-09`, nome: "Revolução Constitucionalista (SP)", tipo: "ESTADUAL" },
    { data: `${year}-09-07`, nome: "Independência do Brasil", tipo: "NACIONAL" },
    { data: `${year}-10-12`, nome: "Nossa Senhora Aparecida", tipo: "NACIONAL" },
    { data: `${year}-11-02`, nome: "Finados", tipo: "NACIONAL" },
    { data: `${year}-11-15`, nome: "Proclamação da República", tipo: "NACIONAL" },
    { data: `${year}-11-20`, nome: "Consciência Negra", tipo: "NACIONAL" },
    { data: `${year}-12-25`, nome: "Natal", tipo: "NACIONAL" },
  ];
}

/** Feriados entre datas (yyyy-MM-dd inclusivo) */
export function getFeriadosEntre(inicio: string, fim: string): Feriado[] {
  const yearStart = parseInt(inicio.slice(0, 4));
  const yearEnd = parseInt(fim.slice(0, 4));
  const result: Feriado[] = [];
  for (let y = yearStart; y <= yearEnd; y++) {
    for (const f of getFeriadosAno(y)) {
      if (f.data >= inicio && f.data <= fim) result.push(f);
    }
  }
  return result;
}

/** Retorna o feriado naquela data ou null */
export function getFeriadoEm(dateStr: string): Feriado | null {
  const year = parseInt(dateStr.slice(0, 4));
  return getFeriadosAno(year).find((f) => f.data === dateStr) ?? null;
}
