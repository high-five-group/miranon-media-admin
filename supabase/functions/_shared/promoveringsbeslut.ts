// promoveringsbeslut — de TVÅ rena besluten i `generate-event-attachment`s
// skarpa gren (TASK-340.1, PRD `TASK-340` § Implementationsbeslut A + E,
// `ADR-124` beslut 2, `ADR-125` § Beslut 3).
//
// VARFÖR EN EGEN, BEROENDEFRI FIL: `_shared/attachments.ts` importerar zod
// från `esm.sh`, vilket Node/Playwright inte kan resolva
// (`ERR_UNSUPPORTED_ESM_URL_SCHEME`, empiriskt belagt i `TASK-309.22` — se
// `_shared/attachment-filename.ts`s docblock). Varje modul som ska
// enhetstestas MOT PRODUKTIONSKODEN i `api-pure` måste därför vara fri från
// den importkedjan. Denna fil importerar INGENTING alls — den är ren logik
// över värden anroparen redan hämtat, och `tests/api/promoveringsbeslut.
// test.ts` kör den direkt.
//
// ── BESLUT 1: PROMOVERA ELLER RENDERA ────────────────────────────────────
// Bakgrunden är mätt, inte antagen
// (`docs/research/forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md`
// § 2.3): DocRaptor SLUMPAR PDF:ens `/ID`-par per anrop och det går inte att
// styra (fältet saknas bland de 33 dokumenterade `prince_options`, en
// `pdf_id`-parameter strippas tyst vid API-gränsen, och `/ID` varierade ändå
// mellan två anrop med IDENTISK indata). Följden: den fil Lotta sparar är
// BEVISLIGEN aldrig den fil hon granskade — samma innehåll, andra bytes —
// så länge Skapa renderar om. Att i stället promovera de granskade bytesen
// är därför inte en optimering utan en KORREKTHETSFRÅGA (research § Dom
// punkt 2).
//
// Hashen (`Källhash`, `_shared/mall-hash.ts`) spelar rollen av en ETag:
// klienten får den i preview-svaret och skickar tillbaka den vid Skapa.
// Den är ett PÅSTÅENDE från klienten och verifieras ALLTID mot serverns
// egen omräkning av dagens underlag — en klient kan därför aldrig ljuga sig
// till en promovering av FEL underlag, bara till ett misslyckat försök som
// faller tillbaka på rendering (research § 4, bärar-väg (b): svaret/anropet,
// INTE Storage-metadata som saknas i `list()` och inte kan uppdateras, och
// INTE objektnamnet som hade brutit `ADR-124` beslut 2:s upsert-invariant).
//
// De fyra utfallen, i denna PRIORITETSORDNING:
//
//   1. `ingen-hash-angiven` — klienten gjorde inget påstående (dagens
//      klient, och varje anrop från listans "Skapa om"). RENDERA, tyst.
//   2. `hash-skiljer`       — underlaget har ändrats sedan förhandsgransk-
//      ningen. RENDERA, och SÄG DET (`underlagAndrat: true`). Mönstret har
//      ett etablerat namn: MDN:s optimistiska låsning (`412 Precondition
//      Failed` → *"notifying the user to start again … or by showing the
//      user a diff"*) och EF Cores Current/Original/Database-triad;
//      research § 2.4 fann ingen UX-källa som täcker fallet, men BÅDA
//      protokoll-källorna ger samma svar: avvisa och visa skillnaden.
//   3. `inget-utkast`       — hashen stämmer, men utkastet finns inte
//      (utgånget, städat av en tidigare skarp generering, eller aldrig
//      förhandsgranskat i denna webbläsare). RENDERA, TYST — degradering,
//      ALDRIG ett fel (PRD § A (c)). Det är INTE `underlagAndrat`: underlaget
//      är oförändrat, det är bara bytesen som inte längre finns att kopiera.
//   4. `hash-matchar`       — PROMOVERA: kopiera utkastets bytes till
//      eventets prefix, ingen DocRaptor-rendering.
//
// ORDNINGEN MELLAN 2 OCH 3 ÄR MEDVETEN. En hash som skiljer sig ÄR ett
// ändrat underlag, oavsett om utkastet råkar finnas kvar eller inte — och
// det är den upplysning Lotta behöver ("förhandsgranska gärna igen"). Att
// tysta det till `inget-utkast` bara för att utkastet också hann försvinna
// vore att dölja den enda faktiska nyheten.
//
// ── BESLUT 2: VILKEN BEFINTLIG RAD ERSÄTTS ───────────────────────────────
// PRD § E: finns redan en Event-mallad rad för (event × mall) ska Skapa gå
// EF:ens befintliga ersatt-väg (`ADR-125` § 3, *"Regenerering är
// ERSÄTTNING"*) i stället för att skapa en ny rad. Utan det bygger varje
// upprepat Skapa en DUBBLETT med samma filnamn, som kollapsar bakom "+1
// äldre fil" i `DokumentYta.tsx`s `grupperaPerNamn` och INTE går att radera
// från appen (`BilageRadRow` erbjuder Förhandsvisa · Ladda ner · Skapa om ·
// Ersätt — ingen Radera). Det är en verklig defekt i dag, inte en
// flödesfråga: den permanenta staging-fixturen `recnzSBfLWCo5dBlY` bar
// **23 Bekräftelsebilaga-rader och 4 Deltagarinformation-rader** när denna
// skiva mättes (2026-08-29, samtliga skapade samma dag av CI-körningar).
//
// Uppslaget kan alltså träffa FLERA rader — historiska dubbletter födda före
// E. Valet MÅSTE därför vara deterministiskt, och det ska falla på den rad
// Lotta FAKTISKT SER: `get-event-attachments` sorterar nyast först och
// `grupperaPerNamn` visar `lista[0]`, så den NYASTE raden är den synliga.
// Därav sorteringen nedan. Äldre dubbletter lämnas orörda — att radera data
// vi inte skapade är ett annat beslut (PRD § Utanför omfattningen:
// "radera-knapp för event-mallade rader — eget beslut").

/** Den kanoniska formen `_shared/mall-hash.ts`s `berakaKallhash` producerar:
 *  SHA-256 som 64 hex-tecken i GEMENER (`bytesToHex` använder `toString(16)`,
 *  som aldrig ger versaler). Formen valideras — den gissas aldrig. */
const KALLHASH_FORM = /^[0-9a-f]{64}$/;

/** Sant EXAKT när `varde` är en sträng på `berakaKallhash`s utdataform. */
export function arKanoniskKallhash(varde: unknown): varde is string {
  return typeof varde === 'string' && KALLHASH_FORM.test(varde);
}

/** Varför beslutet blev som det blev — en STÄNGD uppsättning, aldrig fri text. */
export type PromoveringsSkal =
  | 'hash-matchar'
  | 'hash-skiljer'
  | 'inget-utkast'
  | 'ingen-hash-angiven';

export interface PromoveringsBeslut {
  /** Sant ⇒ kopiera utkastets bytes; falskt ⇒ rendera med DocRaptor. */
  promovera: boolean;
  /** Sant ⇒ underlaget har BEVISLIGEN ändrats sedan förhandsgranskningen.
   *  Blir `underlagAndrat` i EF-svaret; klienten säger det i klartext. */
  underlagAndrat: boolean;
  skal: PromoveringsSkal;
}

/**
 * Avgör om den skarpa genereringen ska PROMOVERA utkastet eller RENDERA om.
 *
 * @param angivenKallhash Klientens påstående ur preview-svaret — `null` när
 *   inget påstående gjordes. Ett angivet värde MÅSTE ha den kanoniska formen
 *   (`arKanoniskKallhash`); anroparen validerar den vid HTTP-gränsen och
 *   svarar 400 på en trasig form (samma "ett angivet men okänt värde är ett
 *   klientfel, aldrig en tyst fallback"-disciplin `mall`/`ersatt` redan bär).
 *   Ett formfel som ändå når hit är ett PROGRAMMERINGSFEL och kastar.
 * @param serverKallhash Serverns egen omräkning av DAGENS underlag. Alltid
 *   kanonisk — den kommer direkt ur `berakaKallhash`.
 * @param utkastFinns Om `utkast/<eventId>/<typ>.pdf` faktiskt ligger i
 *   bucketen just nu (anroparen har slagit upp det).
 */
export function beslutaPromovering(params: {
  angivenKallhash: string | null;
  serverKallhash: string;
  utkastFinns: boolean;
}): PromoveringsBeslut {
  const { angivenKallhash, serverKallhash, utkastFinns } = params;

  if (!arKanoniskKallhash(serverKallhash)) {
    throw new TypeError(
      'beslutaPromovering: serverKallhash måste vara en kanonisk SHA-256-hex (64 tecken, gemener)',
    );
  }
  if (angivenKallhash !== null && !arKanoniskKallhash(angivenKallhash)) {
    throw new TypeError(
      'beslutaPromovering: angivenKallhash måste vara null eller en kanonisk SHA-256-hex — ' +
        'formen valideras vid HTTP-gränsen, aldrig här',
    );
  }

  if (angivenKallhash === null) {
    return { promovera: false, underlagAndrat: false, skal: 'ingen-hash-angiven' };
  }
  if (angivenKallhash !== serverKallhash) {
    return { promovera: false, underlagAndrat: true, skal: 'hash-skiljer' };
  }
  if (!utkastFinns) {
    return { promovera: false, underlagAndrat: false, skal: 'inget-utkast' };
  }
  return { promovera: true, underlagAndrat: false, skal: 'hash-matchar' };
}

/** Den minimala formen `valjErsattKandidat` behöver — anroparen mappar sina
 *  Airtable-rader hit och slipper släppa in Airtable-formen i ren logik. */
export interface ErsattKandidat {
  /** Bilagor-radens EGNA Airtable record-ID (`rec…`) — samma "attachmentId"
   *  klienten ser, och samma värde EF:ens `ersatt`-parameter tar. */
  id: string;
  /** `Skapad` som ISO-sträng, eller `null` när fältet saknas/har fel typ. */
  skapad: string | null;
}

/**
 * Väljer VILKEN befintlig Event-mallad rad ett upprepat Skapa ska ersätta
 * (PRD § E). Anroparen har redan filtrat mängden till rätt event, rätt
 * `Dokumentklass` och rätt `Mall` — denna funktion avgör bara ordningen.
 *
 * ORDNING: `Skapad` fallande (ISO-8601 sorterar korrekt lexikografiskt),
 * rader UTAN `Skapad` sist, och vid EXAKT lika `Skapad` record-ID fallande
 * som andra nyckel. Den andra nyckeln finns för att utfallet ska vara
 * deterministiskt även för två rader skapade inom samma millisekund — utan
 * den hade valet berott på Airtables returordning, vilket är precis den
 * sortens tysta godtycke `ADR-125` § 3 undviker på andra ställen.
 *
 * Returnerar `null` för en tom mängd (inget att ersätta → ny rad).
 * Muterar ALDRIG indatan (`[...rader]` innan `sort`).
 */
export function valjErsattKandidat<T extends ErsattKandidat>(rader: readonly T[]): T | null {
  if (rader.length === 0) return null;
  const sorterade = [...rader].sort((a, b) => {
    const sa = a.skapad ?? '';
    const sb = b.skapad ?? '';
    if (sa !== sb) return sa < sb ? 1 : -1;
    if (a.id !== b.id) return a.id < b.id ? 1 : -1;
    return 0;
  });
  return sorterade[0];
}
