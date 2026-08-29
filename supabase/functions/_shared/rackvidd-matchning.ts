// Räckviddens NORMALISERING och MATCHNING — den rena kärnan i ADR-125
// § Beslut 1 ("räckvidden är ett filter över tre kombinerbara axlar:
// Familj · Event · Plats"), TASK-338.2.
//
// ═══ VARFÖR EN EGEN, ZOD-FRI FIL ═══
// `_shared/attachments.ts` importerar `https://esm.sh/zod@4` för write-
// sidans `AttachmentScopeInputSchema`. Den importen gör HELA den filen
// otestbar som ett direkt Node-import (`tests/api/*.test.ts` kör i Node via
// Playwright, inte i Deno) — exakt det strukturella skäl `attachment-
// filename.ts` redan bröts ut för (TASK-309.22, se den filens huvud).
// Matcharen är kortets AC #1 ("ren matchare i _shared med enhetstester …
// deterministiska, ingen staging"), så den MÅSTE vara Node-importerbar.
// Scope-KONSTANTERNA bor därför också här och RE-EXPORTERAS oförändrat ur
// `attachments.ts` — ingen av de EF:er som redan importerar dem därifrån
// behöver ändra sin importsats.
//
// ═══ MODELLEN, EFTER ADR-125 § Beslut 1 (ersätter ADR-118 beslut 1) ═══
// `Räckvidd` bär numera TVÅ levande värden:
//   - `Event`    — bilagan hör till exakt de event `Event`-länken pekar på.
//   - `Gemensam` — FILTER-räckvidd. Tre VALFRIA axlar (Kursfamilj,
//                  Kursnivå, Plats) kombineras med OCH. En TOM axel
//                  BEGRÄNSAR INTE. Noll satta axlar = alla event.
// `Kurstyp` och `Alla event` är LEGACY-värden (ADR-118 beslut 1) som lever
// kvar i basen tills slutgenomlysningen (ADR-063 § Updates). Läsvägen
// NORMALISERAR dem till `Gemensam` med sina axlar INNAN matchning, så
// EF:en fungerar oavsett i vilken ordning EF-deploy och radmigrering sker
// (TASK-338.6 kör dem som två skilda steg mot prod).
//
// ═══ VARFÖR MATCHNINGEN BOR I KOD OCH INTE I `filterByFormula` ═══
// `Plats` är ett multipleRecordLinks-fält. Airtables formelspråk kan inte
// jämföra ett länkfält mot ett record-ID utan ett hjälpfält — en
// `{Plats} = 'rec…'`-jämförelse läser länkens PRIMÄR-DISPLAY (namnet),
// inte ID:t, vilket är exakt den T15-klassbugg `get-event-attachments`
// filhuvud redan varnar för. Namnmatchning är dessutom drift-känslig av
// samma skäl ADR-125 § 8 avvisar Ort-matchning. Mängden gemensamma rader
// är liten och bunden (tiotals), så EN hämtning plus matchning i kod är
// både korrekt och billigare än flera formel-hämtningar — och den enda
// formen som går att bevisa deterministiskt utan staging (ADR-057:
// matchningen bor i EF/_shared, aldrig i klienten).

/** `Räckvidd = Event` — bilagan hör till exakt sitt/sina länkade event. */
export const ATTACHMENT_SCOPE_EVENT = 'Event';

/** `Räckvidd = Gemensam` — filter-räckvidd, axlarna gäller (ADR-125 § 1). */
export const ATTACHMENT_SCOPE_GEMENSAM = 'Gemensam';

/** LEGACY (ADR-118 beslut 1). Normaliseras till Gemensam vid läsning. */
export const ATTACHMENT_SCOPE_KURSTYP = 'Kurstyp';

/** LEGACY (ADR-118 beslut 1). Normaliseras till Gemensam vid läsning. */
export const ATTACHMENT_SCOPE_ALLA_EVENT = 'Alla event';

/**
 * De legacy-värden läsvägen tolererar. RIVNINGSSKULD, bokförd öppet:
 * listan töms när prod-raderna är migrerade (TASK-338.6) OCH installerade
 * PWA-klienter bevisligen slutat skicka dem (egen skuldpost, PRD TASK-338
 * § Utanför omfattningen). Att tömma den innan dess gör en gemensam bilaga
 * osynlig i drift — inte ett fel som syns i CI.
 */
export const LEGACY_ATTACHMENT_SCOPES: readonly string[] = [
  ATTACHMENT_SCOPE_KURSTYP,
  ATTACHMENT_SCOPE_ALLA_EVENT,
];

/**
 * Alla `Räckvidd`-optionsnamn läsvägen KÄNNER IGEN (levande + legacy).
 * Allt utanför listan mappas till `null` av `mapAttachmentRecord` — samma
 * "okänt → null, gissa aldrig"-disciplin som `Dokumentklass`.
 */
export const VALID_ATTACHMENT_SCOPES: readonly string[] = [
  ATTACHMENT_SCOPE_EVENT,
  ATTACHMENT_SCOPE_GEMENSAM,
  ...LEGACY_ATTACHMENT_SCOPES,
];

/** Bilagans räckviddsaxlar, som de står på raden (före normalisering). */
export interface BilagansRackvidd {
  /** `Räckvidd`-optionsnamnet, eller `null` för en rad som saknar värdet. */
  rackvidd: string | null;
  kursfamilj: string | null;
  kursniva: string | null;
  /** `Plats`-länkens record-ID:n. Tom lista = platsen begränsar inte. */
  platsIds: readonly string[];
}

/** Eventets egna axlar att matcha MOT. */
export interface EventetsAxlar {
  kursfamilj: string | null;
  kursniva: string | null;
  /** Eventets `Plats`-länk (`Eventplanering.Plats`, ADR-125 § 2). */
  platsIds: readonly string[];
}

/**
 * Airtable UTELÄMNAR ett tomt multipleRecordLinks-fält ur `fields` helt
 * (det är inte `[]`, det FINNS inte) — båda formerna måste därför
 * behandlas som "ingen länk". Samma observation som
 * `plats-uppslag.ts` § `harRedanPlats` redan bokför.
 */
export function lasPlatsIds(varde: unknown): string[] {
  if (!Array.isArray(varde)) return [];
  return varde.filter((v): v is string => typeof v === 'string' && v.length > 0);
}

/** Tom sträng och `null` är samma sak här: "axeln är inte satt". */
function tomAxel(varde: string | null): boolean {
  return varde === null || varde.length === 0;
}

/**
 * NORMALISERAR legacy-räckvidden till den levande modellen.
 *
 *   - `Kurstyp`    → `Gemensam`, axlarna BEHÅLLS (`Kursfamilj`/`Kursnivå`
 *                    var precis det Kurstyp-räckvidden betydde).
 *   - `Alla event` → `Gemensam`, axlarna TÖMS. "Alla event" betyder per
 *                    definition inga begränsningar; en rad som mot alla
 *                    odds bär en axel (vår skrivväg har aldrig skrivit en
 *                    sådan — `buildScopeFields` utelämnade dem) skulle
 *                    annars tyst SMALNA till färre event än värdet lovar.
 *   - allt annat   → oförändrat (`Event`, `Gemensam`, `null`, okänt).
 *
 * `Plats` rörs aldrig av normaliseringen — fältet föddes med `Gemensam`
 * (TASK-338.1) och kan inte finnas på en legacy-rad.
 */
export function normaliseraRackvidd(bilaga: BilagansRackvidd): BilagansRackvidd {
  if (bilaga.rackvidd === ATTACHMENT_SCOPE_KURSTYP) {
    return { ...bilaga, rackvidd: ATTACHMENT_SCOPE_GEMENSAM };
  }
  if (bilaga.rackvidd === ATTACHMENT_SCOPE_ALLA_EVENT) {
    return {
      ...bilaga,
      rackvidd: ATTACHMENT_SCOPE_GEMENSAM,
      kursfamilj: null,
      kursniva: null,
      platsIds: [],
    };
  }
  return bilaga;
}

/**
 * Är räckvidden gemensam (efter normalisering)?
 *
 * `null`/tomt `Räckvidd` är MEDVETET **inte** gemensamt. Det är den
 * historiska default-formen för rader skapade före ADR-118 (fältets egen
 * beskrivning i basen: "Event = … default för befintliga rader") och
 * bärs i dag av mall-genererade klass B-rader som ALLTID hör till sitt
 * event. Mätt mot staging 2026-08-29: `NOT({Räckvidd} = 'Event')` gav 49
 * rader, varav 34 var event-bundna, tomma-`Räckvidd`-rader. Att låta dem
 * räknas som gemensamma hade lagt 34 event-bundna PDF:er i Lottas lista
 * över delade dokument — och på VARJE events dokumentlista.
 */
export function arGemensam(rackvidd: string | null): boolean {
  return rackvidd === ATTACHMENT_SCOPE_GEMENSAM;
}

/**
 * Matchar bilagans räckvidd detta event?
 *
 * Normaliserar FÖRST (legacy → Gemensam), och avgör sedan per axel. Varje
 * SATT axel är ett villkor; varje TOM axel är inget villkor. Villkoren
 * kombineras med OCH — "RIM + Rönninge" betyder "RIM-event i Rönninge",
 * aldrig "RIM-event ELLER event i Rönninge" (PRD TASK-338, berättelse 4).
 *
 * Endast `Gemensam` kan matcha här. En `Event`-räckviddig bilaga når sitt
 * event genom `Event`-LÄNKEN (mängd (a) i get-event-attachments), aldrig
 * genom detta filter — annars hade en event-bilaga läckt till varje event
 * som råkade dela familj/plats.
 *
 * ═══ AXLARNA, EN OCH EN ═══
 *
 * **Kursfamilj.** Tom på bilagan → ingen begränsning. Satt → eventets EGEN
 * `Kursfamilj` (ADR-115) måste vara EXAKT samma. Ett event UTAN känd
 * familj matchar därför aldrig en familjebunden bilaga — en tom-mot-tom-
 * jämförelse hade annars falsk-matchat (ADR-118 § Konsekvenser).
 *
 * **Kursnivå — "tom-nivå-regeln", oförändrad.** Tom nivå på bilagan
 * betyder HELA familjen. Satt nivå kräver exakt match mot eventets nivå.
 *
 * En nivå UTAN familj kan skrivvägen inte producera (`AttachmentScope-
 * InputSchema` avvisar den), men läsvägen möter historisk data den inte
 * kontrollerat skrev. Den behandlas som ett SJÄLVSTÄNDIGT villkor —
 * alltså fail-CLOSED (bilagan syns på färre event), inte ignorerad. Skälet
 * är asymmetriskt: skadan i denna produkt är att fel information går ut i
 * ett utskick (PRD TASK-338, berättelse 3), inte att ett dokument syns på
 * för få event, vilket Lotta upptäcker direkt i listan.
 *
 * **Plats.** Tom länk på bilagan → ingen begränsning. Satt → eventets
 * `Plats`-länk måste innehålla MINST ETT av bilagans plats-ID:n.
 * Jämförelsen sker alltid på RECORD-ID, aldrig på `Platsnamn` (som bara
 * finns för att Lotta och appen ska slippa ett extra uppslag).
 *
 * "Minst ett" och inte "exakt ett": Airtable kan strukturellt inte tvinga
 * max en länk på ett multipleRecordLinks-fält (`airtable-constraints.md`),
 * så invarianten vaktas av EF/adapter — och en rad som ändå bär två
 * platser (handredigerad i basen, ADR-063:s bas-som-leverabel innebär att
 * Lotta och Marcus arbetar direkt där) ska bete sig som "gäller båda
 * platserna", inte matcha ingenting alls.
 */
export function matcharEvent(bilaga: BilagansRackvidd, event: EventetsAxlar): boolean {
  const norm = normaliseraRackvidd(bilaga);
  if (!arGemensam(norm.rackvidd)) return false;

  if (!tomAxel(norm.kursfamilj) && norm.kursfamilj !== event.kursfamilj) return false;
  if (!tomAxel(norm.kursniva) && norm.kursniva !== event.kursniva) return false;

  if (norm.platsIds.length > 0) {
    const traff = norm.platsIds.some((id) => event.platsIds.includes(id));
    if (!traff) return false;
  }

  return true;
}
