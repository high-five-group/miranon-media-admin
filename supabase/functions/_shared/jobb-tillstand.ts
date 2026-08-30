// Jobbradens TILLSTÅNDSMASKIN — TASK-346.4 AC #3/#4, ADR-129 beslut 2 och 4.
//
// REN MODUL, TRANSITIVT DENO-FRI (ingen import alls) → Node-typkollad via
// `tsconfig.edge-shared.json` och hermetiskt testbar i `api-pure`
// (`tests/api/jobb-tillstand.test.ts`).
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR EN EGEN MODUL OCH INTE BARA IF-SATSER I KONSUMENTEN
// ═══════════════════════════════════════════════════════════════════════════
// Migrationen `20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql` skriver
// tre NUMRERADE REGLER vid självläkningen, med rubriken "LÄS DETTA FÖRE
// TASK-346.4". Reglerna är ett KONTRAKT mellan kön och tabellen, och ett
// kontrakt som bara finns som utspridda if-satser i en Deno-fil kan varken
// enhetstestas eller granskas. Modulen nedan är kontraktet i kod:
//
//   1. TABELLEN ÄR SANNING, KÖN ÄR VÄCKNING. Kön är at-least-once, så samma
//      meddelande kan komma två gånger. `farPlockas` läser RADEN, aldrig
//      meddelandet — en rad som redan är `skickat` hoppas över.
//      → `farPlockas`
//   2. KÖMEDDELANDET RADERAS ALDRIG FÖRE RADENS SLUTSTATUS. Raderas det
//      först och konsumenten dör innan raden skrivs, blir raden en `pagar`
//      som ingen kö längre kan väcka.
//      → `farStadaKomeddelande`
//   3. `pagar` SÄTTS ALLTID MED `paborjad_nar`. Svepet mäter mot den
//      kolumnen; en `pagar`-rad utan tidsstämpel är osynlig för
//      självläkningen (och fälls dessutom av check-constrainten
//      `jobb_rad_pagar_har_start`).
//      → `byggPagarUppdatering`
//
// SJÄLVLÄKNINGEN ÄR SPEGLAD, INTE FLYTTAD. `public.jobb_cron_tick()` äger
// svepet i Postgres; `skaLakas` nedan är samma predikat i TypeScript, och
// finns av två skäl: konsumenten kan diagnostisera en rad utan ett
// databasanrop, och predikatet blir hermetiskt bevisbart. Håll de två
// synkroniserade för hand — taket bor på BÅDA ställena, och SQL-sidan är
// den som faktiskt läker.

/** Radens fyra tillstånd, VERBATIM ur `jobb_rad_status_varden`. */
export const JOBB_RAD_STATUS = ['vantar', 'pagar', 'skickat', 'fel'] as const;
export type JobbRadStatus = (typeof JOBB_RAD_STATUS)[number];

/** Jobbets två tillstånd, VERBATIM ur `jobb_status_varden`. */
export const JOBB_STATUS = ['oppet', 'avslutat'] as const;
export type JobbStatus = (typeof JOBB_STATUS)[number];

/**
 * Taket för hur länge en rad får stå i `pagar` innan självläkningen tar den.
 * SAMMA VÄRDE som `v_pagar_tak constant interval := interval '5 minutes'` i
 * `public.jobb_cron_tick()`. Namngiven konstant, inte en tillfällighet
 * (ADR-129 beslut 4).
 *
 * DIVERGENSRISKEN ÄR REELL och kan inte mekaniseras härifrån: SQL-sidan är
 * den som läker, denna sida är den som diagnostiserar. Ändras den ena måste
 * den andra följa med i SAMMA landning.
 */
export const PAGAR_TAK_MS = 5 * 60 * 1000;

/** De tillstånd en rad aldrig lämnar av sig själv. */
export function arSlutstatus(status: JobbRadStatus): boolean {
  return status === 'skickat' || status === 'fel';
}

/**
 * REGEL 1 — får konsumenten arbeta på raden? Endast `vantar`.
 *
 * `skickat`/`fel` betyder att arbetet är gjort (kön levererade om);
 * `pagar` betyder att någon annan körning håller den, och den tas i så fall
 * av svepet efter `PAGAR_TAK_MS`, inte av en andra parallell konsument.
 */
export function farPlockas(rad: { status: JobbRadStatus }): boolean {
  return rad.status === 'vantar';
}

/**
 * REGEL 2 — får kömeddelandet städas bort (raderas eller arkiveras)?
 * Endast när raden nått slutstatus.
 *
 * Formuleringen är MEDVETET "städas" och inte "raderas": konsumenten
 * ARKIVERAR ett meddelande vars rad blev `fel` (historiken är värd att
 * behålla) och RADERAR ett vars rad blev `skickat`. Båda är
 * kö-borttagningar, och båda lyder samma regel.
 */
export function farStadaKomeddelande(rad: { status: JobbRadStatus }): boolean {
  return arSlutstatus(rad.status);
}

/**
 * REGEL 3 — påbörjandets uppdatering. Returnerar ALLTID båda fälten, så en
 * skrivväg strukturellt inte kan sätta `pagar` utan `paborjad_nar`.
 */
export function byggPagarUppdatering(nu: string): {
  status: 'pagar';
  paborjad_nar: string;
} {
  return { status: 'pagar', paborjad_nar: nu };
}

/**
 * Självläkningens predikat — spegling av `jobb_cron_tick()`s
 * `where status = 'pagar' and paborjad_nar < now() - v_pagar_tak`.
 *
 * En `pagar`-rad UTAN `paborjad_nar` läks ALDRIG (returnerar `false`) —
 * exakt som SQL:en, där `null < ...` är `null`, alltså inte sant. Det är
 * inte en lucka utan skälet till att regel 3 finns: check-constrainten
 * `jobb_rad_pagar_har_start` gör tillståndet omöjligt att skriva från
 * början.
 */
export function skaLakas(
  rad: { status: JobbRadStatus; paborjadNar: string | null },
  nu: string,
  takMs: number = PAGAR_TAK_MS,
): boolean {
  if (rad.status !== 'pagar') return false;
  if (rad.paborjadNar === null) return false;
  const paborjad = Date.parse(rad.paborjadNar);
  const nuMs = Date.parse(nu);
  if (!Number.isFinite(paborjad) || !Number.isFinite(nuMs)) return false;
  return paborjad < nuMs - takMs;
}

/** Läkningens uppdatering — tillbaka till `vantar`, tidsstämpeln nollad. */
export function byggLakningsUppdatering(): {
  status: 'vantar';
  paborjad_nar: null;
} {
  return { status: 'vantar', paborjad_nar: null };
}

/**
 * Slutstatusens uppdatering. `skal` är OBLIGATORISKT vid `fel` — samma
 * villkor som check-constrainten `jobb_rad_fel_kraver_skal`, uttryckt i
 * typsystemet så att en anropare inte KAN glömma det.
 *
 * "Ett fel utan skäl är ett halvt utfall som ser helt ut"
 * (användarberättelse 10: se per rad om kvittot är skickat, väntar eller
 * misslyckades OCH VARFÖR).
 */
export function byggSlutUppdatering(
  utfall: { status: 'skickat' } | { status: 'fel'; skal: string },
  nu: string,
): { status: 'skickat' | 'fel'; skal: string | null; avslutad_nar: string } {
  return {
    status: utfall.status,
    skal: utfall.status === 'fel' ? utfall.skal : null,
    avslutad_nar: nu,
  };
}

/**
 * Jobbets sammanfattning ur dess rader. `oppet` så länge någon rad kan
 * ändras; `avslutat` när alla nått slutstatus.
 *
 * ETT JOBB MED NOLL RADER ÄR `oppet`, inte `avslutat`. Ett tomt jobb uppstår
 * bara i fönstret mellan att `jobb` skapats och dess rader skrivits, och att
 * kalla det avslutat hade fått Hem att säga "klart" om ett arbete som inte
 * börjat (`Array.prototype.every` på en tom lista är `true` — precis den
 * fällan).
 */
export function sammanfattaJobb(rader: readonly { status: JobbRadStatus }[]): {
  status: JobbStatus;
  totalt: number;
  skickade: number;
  fel: number;
  kvar: number;
} {
  const totalt = rader.length;
  const skickade = rader.filter((rad) => rad.status === 'skickat').length;
  const fel = rader.filter((rad) => rad.status === 'fel').length;
  const kvar = totalt - skickade - fel;
  return {
    status: totalt > 0 && kvar === 0 ? 'avslutat' : 'oppet',
    totalt,
    skickade,
    fel,
    kvar,
  };
}
