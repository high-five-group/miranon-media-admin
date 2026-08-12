/**
 * Hem-ytans relativa tidsform (K10-facit, `bb31a12`).
 *
 * EXTRAHERAD UR `NyaAnmalningarCard.tsx` VID FAKTISK ANDRA KONSUMENT
 * (TASK-201.7) — inte i förskott. Fram till dess bodde funktionen modul-privat
 * i sitt enda kort; hem-spalten "Senaste aktivitet" (`SenasteAktivitet.tsx`)
 * är den andra konsumenten, och K10-facitets desktop-bild visar SAMMA
 * tidssträngar i båda ytorna på samma skärm ("för 2 tim sedan", "igår 16:42" i
 * spalten; "för 10 min sedan", "igår 14:02" i anmälningskortet). Två kopior av
 * formatteraren hade kunnat drifta isär och göra den låsta bilden osann i
 * efterhand — därav EN källa, inte två.
 *
 * Ingen beteendeändring i flytten: samma funktion, samma hjälpare, samma
 * strängar. `NyaAnmalningarCard` importerar den härifrån i stället för att
 * definiera den själv.
 */

/** Klockslag "14:02" — igår-formens tidsdel. */
const KLOCKSLAG = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });

/** Lokal dagsstart (midnatt) — kalenderdags-diffens referenspunkt. */
function dagsStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Relativ tid per K10-facitets former: "för N min sedan" →
 * "för N tim sedan" (samma kalenderdag) → "igår HH:MM" (gårdagens
 * kalenderdag) → "för N dagar sedan" (kalenderdiff — Math.round absorberar
 * DST-skiftenas 23/25-timmarsdygn). Under minuten: "nyss" (facit-exemplen
 * börjar vid 10 min; ev. framtida klockskev clampas hit — aldrig negativt).
 * "för 1 dagar sedan" kan inte uppstå: dagsdiff 1 är alltid igår-formen.
 */
export function relativTid(tidpunktMs: number, nuMs: number): string {
  const minuter = Math.floor((nuMs - tidpunktMs) / 60_000);
  if (minuter < 1) return 'nyss';
  if (minuter < 60) return `för ${minuter} min sedan`;
  const dagar = Math.round((dagsStart(nuMs) - dagsStart(tidpunktMs)) / 86_400_000);
  if (dagar === 0) return `för ${Math.floor(minuter / 60)} tim sedan`;
  if (dagar === 1) return `igår ${KLOCKSLAG.format(tidpunktMs)}`;
  return `för ${dagar} dagar sedan`;
}
