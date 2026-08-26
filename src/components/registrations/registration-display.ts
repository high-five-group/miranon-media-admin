import type { Registration } from '@/domain/models/Registration';
import { Eventmatchning } from '@/domain/types/Status';

/**
 * Delade presentations-hjälpare för Registration-rader (task-1.4, rule of
 * three: tredje konsumenten — NyaAnmalningarCard + ObetaldaCard +
 * AnmalningarList — lyfte dem hit ur hem-korten). Ren formatering, ingen
 * datalogik — domänmodellen röres inte.
 */

/**
 * Eventlänkens vakt (TASK-284.4; ADR-122 beslut 7, § 22 Åtgärdskön) — den
 * DELADE predikat-källan bakom BÅDE Hem-vyns åtgärdskö-räknare
 * (`hem-derivations.ts`) OCH markören i `AnmalningarSida` (f.d.
 * `AnmalningarList`, `TASK-299.5`), så de aldrig kan
 * säga olika saker om samma rad (Hem-vyns AC #3). En anmälan "behöver
 * hanteras" när dess beräknade `eventmatchning` INTE är `'OK'` —
 * `'Avviker'` (länkad till fel event) eller `'Utan event'` (ingen länk
 * alls). `'OK'` bär BÅDA "stämmer" och "kan inte avgöras" (ADR-122 beslut
 * 4, tomt jämförelsefält ger aldrig `'Avviker'`), så frånvaro av flagg är
 * den enda säkra tolkningen — funktionen läser fältet rakt av och
 * omtolkar det aldrig.
 */
export function behoverAtgard(reg: Pick<Registration, 'eventmatchning'>): boolean {
  return (
    reg.eventmatchning === Eventmatchning.AVVIKER ||
    reg.eventmatchning === Eventmatchning.UTAN_EVENT
  );
}

/** Antal anmälningar som behöver hanteras (Hem-vyns åtgärdskö-räknare, AC #3). */
export function antalBehoverAtgard(regs: Registration[] | undefined): number {
  if (!regs) return 0;
  return regs.filter(behoverAtgard).length;
}

/**
 * Åtgärdskö-copyn — "N anmälningar kunde inte kopplas till rätt event".
 *
 * DELNINGEN MED HEM ÄR UPPHÄVD (TASK-291 AC #3, 2026-08-23). Frasen var
 * tidigare gemensam för Hem-vyns bevakningsrad och den förfiltrerade
 * `/mer/anmalningar`-vyn. Den promoverade bevakningsraden bär sedan dess en
 * TVÅDELAD anatomi (rubrik + undertext, `Bevakningsrad.tsx` § `RadInnehall`)
 * som Marcus godkände i S111 Del 5, och en enda mening kan inte fylla två
 * fält: raden säger nu "N kräver åtgärd" i rubriken och "Kunde inte kopplas
 * till rätt event" i undertexten. Denna funktion är därför `/mer/anmalningar`s
 * ensam, och `Bevakningsrad.tsx` importerar den inte längre. Samma tal, samma
 * orsak, två ytors egna former — bokfört från andra hållet i
 * `Bevakningsrad.tsx` § `AtgardskoRadLink`.
 */
export function atgardskoText(antal: number): string {
  return `${antal} ${antal === 1 ? 'anmälan' : 'anmälningar'} kunde inte kopplas till rätt event`;
}

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
