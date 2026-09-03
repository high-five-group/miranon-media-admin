// [TASK-370.1, PRD TASK-370 § Implementationsbeslut, S116 Del 2 beslut 6]
// Komponerar N redan Eta-fyllda kvitto-HTML-dokument
// (`_shared/mall-render.ts`s `fyllMall('kvitto', …)`, ETT anrop per kvitto)
// till ETT sammanhängande HTML-dokument med `break-before: page` mellan
// varje kvittosida. Självbärande-görningen sker EN gång, UTANFÖR denna fil
// (`gorMallSjalvbarande('kvitto', …)`), och DocRaptor-anropet likaså
// (`renderaSjalvbarandeHtmlPdf`) — se `_shared/mall-render.ts`s filhuvud
// för hela fyllning/självbärande-uppdelningen och `preview-receipt/
// index.ts`s `inbetalningIds`-gren för hur de tre stegen kedjas.
//
// ═══════════════════════════════════════════════════════════════════════════
// IMPORTFRI, MEDVETET — SAMMA MÖNSTER SOM `_shared/hojdanpassning.ts`
// (TASK-309.34)
// ═══════════════════════════════════════════════════════════════════════════
// `_shared/mall-render.ts` importerar `https://esm.sh/eta@4.6.0` på sin
// första rad, vilket gör HELA den filen ett strukturellt Node-oimporterbart
// ESM (`ERR_UNSUPPORTED_ESM_URL_SCHEME` — minimalt repro i
// `hojdanpassning.ts`s filhuvud; lärdomen:
// `tasks/lessons.d/esm-sh-toppimport-gor-hela-delad-fil-otestbar-i-node.md`
// [UNIVERSAL]). Denna fil rör VARKEN Eta eller något Deno-globalt — den
// enda importen är `ValidationError` ur `./errors.ts` (redan transitivt
// Deno-fri, se `tsconfig.edge-shared.json`s include-lista, som denna fil
// läggs till i) — och är därför Node/Playwright-testbar utan mock:
// `tests/api/kvitto-kombination.test.ts` bevisar kompositionen,
// valideringen och lagringsnyckelns form utan ett enda DocRaptor-anrop
// (AC #2/#3/#5/#6).
//
// VARFÖR REN STRÄNGOPERATION RÄCKER FÖR KOMPOSITIONEN: den sker EFTER
// Eta-fyllningen, inte i stället för den. Varje ingående HTML-sträng är
// redan en FULLSTÄNDIG `kvitto.html`-rendering (head + body), byggd av
// anroparen via `fyllMall`. Denna fil extraherar bara `<body>`-innehållet,
// injicerar en sidbrytning på alla utom den första sidan, och sätter ihop
// dem under den FÖRSTA sidans `<head>` (två `<link rel="stylesheet">`,
// orört av kompositionen — `mall-render.ts`s `gorSjalvbarande` hanterar
// redan GODTYCKLIGT MÅNGA identiska `<link>`-träffar, se den filens
// kommentar vid `LINK_STYLESHEET_REGEX`; kompositionen ändrar aldrig deras
// antal). `kvitto.html`/`kvitto.css`/sändflödet rörs INTE av denna fil.
//
// TAKET (30, `MAX_KOMBINERADE_KVITTON`): S116 Del 2 beslut 6, orkestrerarens
// startvärde — justeras vid mätning mot N≈30 (skiva TASK-370.3). DocRaptors
// dokumenterade "Simultaneous Request Limit: 30"
// (docs/research/kvitto-forhandsgranskning-flera-som-ett-dokument-
// 2026-09-03.md § DocRaptor/Prince-fakta) gäller SAMTIDIGA ANROP, inte
// sidor i ETT dokument — talet återanvänds ändå som en konservativ,
// motiverad startgräns tills en riktig mätning (skiva 370.3) säger annat.

import { ValidationError } from './errors.ts';

/** [S116 Del 2 beslut 6] Max antal kvitton i EN kombinerad förhandsgranskning. */
export const MAX_KOMBINERADE_KVITTON = 30;

/** Samma UUID-form som `preview-receipt/index.ts`s `UUID_RE` (inbetalningId). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validerar `inbetalningIds`: måste vara en array av UNIKA UUID:er, minst
 * ETT, som mest `MAX_KOMBINERADE_KVITTON`. Kastar `ValidationError` (400,
 * samma felklass som `inbetalningId`-grenens `UUID_RE`-vakt) med ett
 * meddelande klienten kan visa rakt av — ALDRIG en tyst delmängd (PRD
 * TASK-370 § Implementationsbeslut, "Tak").
 */
export function valideraInbetalningIdLista(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError('inbetalningIds must be a non-empty array of UUIDs');
  }
  if (value.length > MAX_KOMBINERADE_KVITTON) {
    throw new ValidationError(
      `inbetalningIds may contain at most ${MAX_KOMBINERADE_KVITTON} entries (got ${value.length})`,
    );
  }
  const sedda = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string' || !UUID_RE.test(item)) {
      throw new ValidationError('inbetalningIds must be an array of UUIDs');
    }
    if (sedda.has(item)) {
      throw new ValidationError(`inbetalningIds contains a duplicate id: ${item}`);
    }
    sedda.add(item);
  }
  return value as string[];
}

const BODY_REGEX = /<body>([\s\S]*?)<\/body>/;
const SIDA_KLASS = 'class="sida sida--kvitto"';
/** Prince 14-guiden, verbatim-exempel `h1 { break-before: page; }` (se
 *  research-passets § DocRaptor/Prince-fakta) — appliceras via ett
 *  INLINE-attribut på den enskilda sidans div, inte via en ändring av
 *  `kvitto.css` (som förblir helt orörd, se filhuvudet). */
const SIDBRYTNING_ATTRIBUT = 'style="break-before: page;"';

/** Extraherar `<body>`-innehållet ur ETT redan Eta-fyllt kvitto-dokument
 *  (index bara för felmeddelandets skull). */
function extraheraKropp(fylldHtml: string, index: number): string {
  const match = fylldHtml.match(BODY_REGEX);
  if (!match) {
    throw new Error(
      `Kvitto ${index + 1}: hittade ingen <body> att extrahera ur det fyllda dokumentet — mallens form har ändrats`,
    );
  }
  return match[1].trim();
}

/** Lägger `break-before: page` på sidans YTTERSTA `.sida--kvitto`-div.
 *  Den FÖRSTA sidan (index 0) får ALDRIG en sidbrytning framför sig — den
 *  öppnar dokumentet. */
function markeraSidbrytning(kropp: string, index: number): string {
  if (index === 0) return kropp;
  if (!kropp.includes(SIDA_KLASS)) {
    throw new Error(
      `Kvitto ${index + 1}: hittade ingen ${SIDA_KLASS} att sidbryta — mallens form har ändrats`,
    );
  }
  return kropp.replace(SIDA_KLASS, `${SIDA_KLASS} ${SIDBRYTNING_ATTRIBUT}`);
}

/**
 * Slår ihop N redan Eta-fyllda kvitto-dokument (`fyllMall('kvitto', …)`,
 * ETT per kvitto, i GIVEN visningsordning — PRD TASK-370 användarberättelse
 * 8) till ETT dokument: `<head>` (två `<link>`) ärvs oförändrat från den
 * FÖRSTA sidan, varje EFTERFÖLJANDE sida får `break-before: page` på sin
 * `.sida--kvitto`-div. Ren strängoperation — självbärande-görningen sker EN
 * gång, UTANFÖR denna funktion (`gorMallSjalvbarande('kvitto', …)`,
 * `_shared/mall-render.ts`).
 */
export function kombineraFylldaKvittoSidor(fyllda: string[]): string {
  if (fyllda.length === 0) {
    throw new Error('kombineraFylldaKvittoSidor kräver minst ETT fyllt kvitto-dokument');
  }
  const kroppar = fyllda.map((html, i) => markeraSidbrytning(extraheraKropp(html, i), i));
  return fyllda[0].replace(BODY_REGEX, `<body>\n${kroppar.join('\n')}\n</body>`);
}

/* ═══════════════════════ LAGRINGSNYCKELN (AC #5) ═══════════════════════ */
//
// [ADR-124 § Updates, S116] `vantande`-kön i `BetalningsInkorg.tsx` är
// SID-omfattande, inte per event (research-passets "Oväntade fynd") — ett
// kombinerat utkast kan alltså spänna över FLERA event samtidigt, och
// `utkast/<eventId>/<typ>.pdf` (`_shared/utkast.ts`) har strukturellt
// ingen plats att sätta det (kräver EN eventId). Nyckeln nedan är i
// stället KEYAD PÅ ANROPET: `requestId` — samma `crypto.randomUUID()`
// (`generateRequestId()`, `_shared/errors.ts`) som `preview-receipt/
// index.ts` REDAN genererar per anrop och REDAN returnerar till klienten i
// svaret (`{ url, utgar, requestId }`), inte på eventId, inte på
// caller/user. Se `_shared/utkast.ts`s `laggKombineratUtkast`/
// `stadaKombineradeUtkast` för Storage-sidan och ADR-124 § Updates för hela
// motiveringen — inklusive varför "livstid + städning" byggs som en
// OPPORTUNISTISK sweep (körs som en sidoeffekt av nästa kombinerade anrop)
// i stället för en cron-artefakt: repot har ingen storage-TTL-cron, och att
// bygga en ny sådan infrastruktur för EN skiva vore over-engineering
// (`~/.claude/CLAUDE.md` § Dubbelriktad över-engineering-vakt) — samma
// "svepet körs när något annat körs, inte tidsstyrt"-disciplin som
// `npm run seed:review -- --sweep` redan etablerar för
// granskningsfixturer.

export const KOMBINERAT_UTKAST_MAPP = 'utkast/kombinerat';

/**
 * [S116, ADR-124 § Updates] Ett kombinerat utkast äldre än detta är
 * BEVISLIGEN oåtkomligt: dess signerade URL (`SIGNED_DOWNLOAD_URL_TTL_
 * SECONDS`, 300 s, `_shared/attachments.ts`) har för länge sedan gått ut,
 * och en ny kombinerad förhandsgranskning skapar alltid ett NYTT
 * `requestId` (ingen klient kan någonsin fråga efter samma nyckel igen).
 * Marginalen (12× URL-TTL:n) täcker nätverksfördröjning och klockskillnad
 * utan att sopa undan ett utkast någon fortfarande skulle kunna öppna.
 */
export const KOMBINERAT_UTKAST_TTL_MS = 60 * 60 * 1000; // 1 timme

/**
 * Bygger sökvägen för ETT kombinerat utkast: `utkast/kombinerat/<requestId>.pdf`.
 * `requestId` måste ha UUID-form (samma vakt som `byggUtkastPath` ställer på
 * `eventId`/`typ` — stängd uppsättning, ingen fri sträng i ett path-segment).
 */
export function byggKombineratUtkastPath(requestId: string): string {
  if (typeof requestId !== 'string' || !UUID_RE.test(requestId)) {
    throw new ValidationError('requestId must be a UUID');
  }
  return `${KOMBINERAT_UTKAST_MAPP}/${requestId}.pdf`;
}

/**
 * Rent ålders-predikat (ingen Storage-åtkomst) — `_shared/utkast.ts`s
 * `stadaKombineradeUtkast` matar denna med `list()`s `updated_at` per
 * objekt. Utbruten som ren funktion av samma skäl som resten av filen:
 * testbar utan mock av Supabase Storage.
 *
 * Saknad/otolkbar tidsstämpel behandlas som FÖRFALLEN — medvetet fail-safe
 * åt STÄD-hållet (aldrig åt växande-hållet): denna sweep finns för att
 * förhindra obegränsad tillväxt i `utkast/kombinerat/`, och värsta
 * konsekvensen av en för tidig städning är att en Lotta-session måste
 * förhandsgranska på nytt — billigare än en bucket som växer obegränsat.
 */
export function arKombineratUtkastForfallet(
  updatedAtIso: string | null,
  nuMs: number,
  ttlMs: number = KOMBINERAT_UTKAST_TTL_MS,
): boolean {
  if (!updatedAtIso) return true;
  const updatedAtMs = Date.parse(updatedAtIso);
  if (Number.isNaN(updatedAtMs)) return true;
  return nuMs - updatedAtMs > ttlMs;
}
