import type { Registration } from '@/domain/models/Registration';

/**
 * Delade presentations-hjälpare för Registration-rader (task-1.4, rule of
 * three: tredje konsumenten — NyaAnmalningarCard + ObetaldaCard +
 * AnmalningarList — lyfte dem hit ur hem-korten). Ren formatering, ingen
 * datalogik — domänmodellen röres inte.
 */

/** Visningsnamn ur de namnfält Airtable kan leverera — aldrig record-ID/tomt (Gunilla). */
export function displayName(reg: Registration): string {
  if (reg.namn) return reg.namn;
  const composed = [reg.fornamn, reg.efternamn].filter(Boolean).join(' ');
  return composed || 'Namn saknas';
}

/** Inskickad-tid för sort; null/ogiltigt → -Infinity (hamnar sist vid fallande sort). */
export function inskickadTid(reg: Registration): number {
  if (!reg.inskickad) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(reg.inskickad);
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

/** Inskickad som läsbart sv-SE-datum (Gunilla: aldrig rå ISO); null/ogiltigt → null. */
export function inskickadDatum(reg: Registration): string | null {
  if (!reg.inskickad) return null;
  const t = Date.parse(reg.inskickad);
  return Number.isNaN(t) ? null : new Date(t).toLocaleDateString('sv-SE');
}
