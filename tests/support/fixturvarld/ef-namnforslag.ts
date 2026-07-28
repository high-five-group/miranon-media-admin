/**
 * Namnförslag för Edge Function-mönster — fixturvärldens delade stavfelshjälp.
 *
 * HEMVISTEN ÄR EGEN MODUL SEDAN task-62, och det är inte en abstraktion i
 * förväg: maskineriet har TVÅ faktiska konsumenter, båda vakter i denna katalog.
 *
 *   · `hermetik-vakt.ts` — ett anrop nådde ingen handler. Vilken handler MENADE
 *     utvecklaren att skriva?
 *   · `overskuggnings-vakt.ts` — en handler nådde inget anrop. Vilket mönster
 *     MENADE utvecklaren att överskugga?
 *
 * Det är samma fråga sedd från var sitt håll, och därför samma svar. Koden
 * flyttades hit VERBATIM ur `hermetik-vakt.ts` (task-54.2, skärpt i task-57) —
 * noll beteendeändring, samma konstanter, samma källa.
 */

/**
 * NÄRHETS-TRÖSKELN ÄR LÅNAD, INTE PÅHITTAD.
 *
 * TypeScripts `getSpellingSuggestion` utesluter kandidater vars
 * Levenshtein-avstånd överstiger **0,4 gånger** det sökta namnets längd, och
 * hoppar över avståndsberäkning helt för namn kortare än **3 tecken** (där
 * bara skiftlägesokänslig likhet prövas). Kvoten 0,4 tillåter ungefär en
 * ersättning per fem tecken och en insättning/borttagning vid tre.
 *
 * Samma konstanter används här, av samma skäl: en tröskel som är för generös
 * föreslår fel handler med självförtroende, vilket är värre än att inte
 * föreslå något alls.
 *
 * Källa: microsoft/TypeScript, `getSpellingSuggestion` i `checker.ts`
 * (införd i PR #15507).
 */
const NARHETS_KVOT = 0.4;
const MINSTA_NAMNLANGD = 3;

/** Pathen alla Edge Functions bor under. Klassgränsen i vakternas meddelanden. */
export const EF_PREFIX = '/functions/v1/';

/**
 * Levenshtein-avstånd i tvåradsform — O(a·b) tid, O(b) minne.
 *
 * Egen implementation i stället för ett beroende: vakterna är testkod som ska
 * kunna läsas i sin helhet av den som felsöker dem, och funktionen är kortare
 * än den installations-rad som annars hade behövts.
 */
function levenshteinAvstand(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let forra = Array.from({ length: b.length + 1 }, (_, i) => i);
  let denna = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    denna[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const kostnad = a[i - 1] === b[j - 1] ? 0 : 1;
      denna[j] = Math.min(
        denna[j - 1] + 1, // insättning
        forra[j] + 1, // borttagning
        forra[j - 1] + kostnad, // ersättning
      );
    }
    [forra, denna] = [denna, forra];
  }

  // Efter sista växlingen ligger den färdiga raden i `forra`.
  return forra[b.length];
}

/**
 * Plockar Edge Function-namnet ur en path. `undefined` betyder att anropet inte
 * ens försökte nå en EF — alltså den andra felklassen.
 */
export function efNamn(path: string): string | undefined {
  const index = path.indexOf(EF_PREFIX);
  if (index === -1) return undefined;
  const namn = path.slice(index + EF_PREFIX.length).split('/')[0];
  return namn === '' ? undefined : namn;
}

/**
 * Närmaste registrerade handler för ett EF-namn, eller `undefined` när ingen är
 * rimligt nära. Skiftlägesskillnad vinner alltid — den är säkraste träffen.
 *
 * MÄTNINGEN GÖRS PÅ EF-NAMNET, INTE PÅ HELA MÖNSTRET. Alla handlers delar
 * prefixet `*` + `/functions/v1/`, så ett avstånd över hela strängen hade
 * dränkts av det gemensamma och fått varje kandidat att se nära ut.
 */
export function narmasteHandler(
  soktNamn: string,
  kandidater: ReadonlyMap<string, string>,
): string | undefined {
  for (const [namn, header] of kandidater) {
    if (namn.toLowerCase() === soktNamn.toLowerCase()) return header;
  }

  if (soktNamn.length < MINSTA_NAMNLANGD) return undefined;

  const tak = Math.floor(soktNamn.length * NARHETS_KVOT);
  let bastaHeader: string | undefined;
  let bastaAvstand = Number.POSITIVE_INFINITY;

  for (const [namn, header] of kandidater) {
    const avstand = levenshteinAvstand(soktNamn, namn);
    if (avstand <= tak && avstand < bastaAvstand) {
      bastaHeader = header;
      bastaAvstand = avstand;
    }
  }

  return bastaHeader;
}

/** EF-namn → handlerns fulla header, byggd ur samma källa som matchningen. */
export function efKandidater(mockade: readonly string[]): ReadonlyMap<string, string> {
  const karta = new Map<string, string>();
  for (const header of mockade) {
    const monster = header.slice(header.indexOf(' ') + 1);
    const namn = efNamn(monster);
    if (namn !== undefined && !karta.has(namn)) karta.set(namn, header);
  }
  return karta;
}
