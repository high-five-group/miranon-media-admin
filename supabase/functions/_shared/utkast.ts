// @ts-nocheck — Deno Edge Function shared module (Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som övriga _shared-filer som körs i Deno-runtimen.
//
// laggUtkast — TASK-302.1 (PRD TASK-302, `ADR-124`, S108 resume 7,
// 2026-08-22). Skriver ett TRANSIENT förhandsgransknings-utkast till
// Storage och returnerar en kort signerad URL — ANLEDNINGEN till hela
// skivan: Chromes PDF-visare scrollar bara jämnt på en URL SERVERAD AV
// NÄTVERKSTJÄNSTEN. `blob:` (dagens väg), en Service Worker som fångar
// svaret, och båda med `noopener` mättes ALLA laggiga (sex armar, headed
// Chrome 151, `tasks/sessions/2026-08-20-session-108.md` Del 10 § B punkt
// 3 + Del 11) — bara en riktig nätverks-URL scrollar identiskt med
// `http://`-referensen.
//
// KONTRAKTSBROTTET, ÖPPET (TASK-302 § "Kontraktsbrottet, öppet"):
// `generate-event-attachment`/`preview-receipt` förbjöd tidigare ALL
// Storage-skrivning i förhandsvisningen. Den nya, amenderade regeln: EN
// TRANSIENT fil under `utkast/<eventId>/<typ>.pdf`, `upsert: true` — högst
// EN fil per event OCH typ, aldrig listad i appen, borttagen vid skarp
// generering (TASK-302.3). Mängden växer med ANTAL EVENT, inte med antal
// förhandsgranskningar.
//
// [TASK-340.1, PRD `TASK-340` § A] UTKASTET ÄR INTE LÄNGRE BARA EN
// FÖRHANDSVISNING — DET PROMOVERAS. Skarp generering kopierar utkastets
// EXAKTA bytes till eventets prefix när klientens `kallhash` stämmer med
// serverns omräkning (`_shared/promoveringsbeslut.ts`, `_shared/storage-
// kopiera.ts`), i stället för att rendera om. Skälet är korrekthet, inte
// hastighet: DocRaptor slumpar PDF:ens `/ID` per anrop, så en omrendering
// ger BEVISLIGEN andra bytes än den fil Lotta granskade (research
// `forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md` § 2.3).
// INVARIANTERNA ÄR OFÖRÄNDRADE: sökvägen är fortfarande `utkast/<eventId>/
// <typ>.pdf` med `upsert: true` (hashen bärs i ANROPET, aldrig i
// objektnamnet — ett namn som bar hashen hade brutit `ADR-124` beslut 2:s
// "högst ETT utkast per event och typ"), och `rensaUtkast` städar precis
// som förut EFTER en lyckad skarp skrivning — nu även efter en promovering,
// eftersom utkastet DÅ är konsumerat.
//
// ÅTERANVÄNDER MEDVETET — ingen ny TTL, ingen ny bucket, ingen ny
// eventId-valideringsform: `BILAGOR_BUCKET_ID` och
// `SIGNED_DOWNLOAD_URL_TTL_SECONDS` (samma konstant `get-attachment-
// download-url` redan bär, 300s — se `attachments.ts`s docblock för det
// fulla, källbelagda TTL-resonemanget) och `isValidEventId` (samma
// rec-prefix-grind som `create-registration`/`create-event-note`).
//
// SÖKVÄGS-VALIDERING, INGEN PATH-INJEKTION: `eventId` måste ha rec-formen
// (`isValidEventId`) och `typ` måste vara ETT av de tre stängda
// enum-värdena (`UTKAST_TYPER`) — SAMMA "stängd uppsättning, ingen fri
// sträng i en path-SEGMENT"-disciplin `_shared/attachments.ts`s
// `buildStorageAnchor`/`KURSFAMILJ_SLUG` redan etablerar för Kursfamilj.
// Valideringen sitter HÄR (inte bara i anropande EF) eftersom denna
// funktion är den GEMENSAMMA vägen in — `test-docraptor-render` (denna
// skiva, prototypen) OCH de skarpa preview-EF:erna (`TASK-302.2`) anropar
// samma `laggUtkast`, en formel, flera anropare.

import { ValidationError, HttpError } from './errors.ts';
import { BILAGOR_BUCKET_ID, isValidEventId, SIGNED_DOWNLOAD_URL_TTL_SECONDS } from './attachments.ts';

/** De tre dokumentklasserna utkast-vägen stödjer (TASK-302 § Designbeslut). */
export const UTKAST_TYPER = ['bilaga', 'kvitto', 'deltagarinformation'] as const;
export type UtkastTyp = (typeof UTKAST_TYPER)[number];

export function isValidUtkastTyp(value: unknown): value is UtkastTyp {
  return typeof value === 'string' && (UTKAST_TYPER as readonly string[]).includes(value);
}

/** Minimal ytstruktur för den del av `SupabaseClient` denna funktion faktiskt
 * använder — undviker att importera hela SDK-typen bara för storage-anropen.
 * [TASK-302.3] `list`/`remove` tillkom för `rensaUtkast` nedan — samma
 * minimal-yta-disciplin, bara de metoder filen faktiskt anropar. */
interface SupabaseAdminLike {
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        bytes: Uint8Array,
        options: { contentType: string; upsert: boolean },
      ): Promise<{ error: { message: string } | null }>;
      createSignedUrl(
        path: string,
        expiresIn: number,
      ): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
      // [TASK-340.1] `metadata.size` tillkom i den lästa ytan — `hittaUtkast`
      // nedan behöver källobjektets storlek som RESERV när Storage-copyns
      // eget svar inte rapporterar den (`_shared/storage-kopiera.ts`).
      // Fältet är valfritt i typen: `rensaUtkast` läser bara `name`, och
      // Storage returnerar `metadata: null` för mapp-poster.
      list(path: string): Promise<{
        data: { name: string; metadata?: { size?: number } | null }[] | null;
        error: { message: string } | null;
      }>;
      remove(paths: string[]): Promise<{ error: { message: string } | null }>;
    };
  };
}

/**
 * [TASK-340.1] Utkastets sökväg — EN formel, tre anropare (`laggUtkast`
 * skriver den, `hittaUtkast` läser den, `generate-event-attachment` kopierar
 * FRÅN den vid promovering). Formen är `ADR-124` beslut 2:s ordagrant:
 * `utkast/<eventId>/<typ>.pdf`, alltså högst ETT utkast per event och typ.
 *
 * VALIDERINGEN BOR HÄR, inte hos anroparen: `eventId` måste ha rec-formen
 * och `typ` vara ett av de tre enum-värdena — samma "stängd uppsättning,
 * ingen fri sträng i ett path-SEGMENT"-disciplin filhuvudet beskriver. Att
 * lyfta ut den i en egen funktion gjorde INTE valideringen svagare: den
 * kördes tidigare inuti `laggUtkast` och körs nu i varje anropare av denna,
 * `laggUtkast` inräknad.
 */
export function byggUtkastPath(eventId: string, typ: UtkastTyp): string {
  if (!isValidEventId(eventId)) {
    throw new ValidationError('eventId must be an Airtable record ID (rec…)');
  }
  if (!isValidUtkastTyp(typ)) {
    throw new ValidationError(`typ must be one of: ${UTKAST_TYPER.join(', ')}`);
  }
  return `utkast/${eventId}/${typ}.pdf`;
}

export interface UtkastResultat {
  /** Kort signerad URL till PDF:en, serverad av nätverkstjänsten (Storage). */
  url: string;
  /** ISO-tidsstämpel för när `url` slutar fungera (nu + `SIGNED_DOWNLOAD_URL_TTL_SECONDS`). */
  utgar: string;
}

/**
 * Skriver `bytes` till `utkast/<eventId>/<typ>.pdf` i `BILAGOR_BUCKET_ID`
 * (`upsert: true` — samma path skriven två gånger ERSÄTTER, skapar aldrig
 * ett andra objekt) och returnerar en signerad URL + dess utgångstid.
 *
 * Kastar `ValidationError` (400) för ogiltig `eventId`/`typ`-form,
 * `HttpError` (502) om Storage-skrivningen eller signeringen misslyckas —
 * SAMMA felkontrakt som `upload-attachment`/`get-attachment-download-url`
 * redan bär för motsvarande fel, propagerat av anroparens `mapErrorToResponse`.
 */
export async function laggUtkast(
  supabaseAdmin: SupabaseAdminLike,
  params: { eventId: string; typ: UtkastTyp; bytes: Uint8Array },
): Promise<UtkastResultat> {
  const path = byggUtkastPath(params.eventId, params.typ);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BILAGOR_BUCKET_ID)
    .upload(path, params.bytes, { contentType: 'application/pdf', upsert: true });
  if (uploadError) {
    throw new HttpError(502, `Utkastet kunde inte sparas: ${uploadError.message}`);
  }

  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from(BILAGOR_BUCKET_ID)
    .createSignedUrl(path, SIGNED_DOWNLOAD_URL_TTL_SECONDS);
  if (signError || !signed) {
    throw new HttpError(
      502,
      `Kunde inte skapa en nedladdningslänk: ${signError?.message ?? 'okänt fel'}`,
    );
  }

  const utgar = new Date(Date.now() + SIGNED_DOWNLOAD_URL_TTL_SECONDS * 1000).toISOString();
  return { url: signed.signedUrl, utgar };
}

/** [TASK-340.1] Det befintliga utkastet för ETT event och EN typ. */
export interface FunnetUtkast {
  /** Objektets fulla nyckel i bucketen (`utkast/<eventId>/<typ>.pdf`). */
  path: string;
  /** Storleken i bytes ur `list()`s `metadata.size`, `null` om den saknas. */
  storlek: number | null;
}

/**
 * hittaUtkast — TASK-340.1, PRD `TASK-340` § A (c): *"saknas utkastet
 * renderas tyst (degradering, aldrig fel)"*. Slår upp om
 * `utkast/<eventId>/<typ>.pdf` FINNS just nu, och hämtar samtidigt dess
 * storlek (reserv för `Storlek (bytes)` när Storage-copyns eget svar inte
 * bär `metadata.size`).
 *
 * ANVÄNDER `list(prefix)` OCH INTE en HEAD/`download` — `list` är den enda
 * lästa Storage-ytan denna fil redan bär (`rensaUtkast`), den hämtar INGA
 * bytes, och den ger storleken på köpet. Prefixet innehåller som mest tre
 * objekt (`UTKAST_TYPER`), så filtreringen i minnet är gratis.
 *
 * RETURNERAR `null` — kastar ALDRIG — när utkastet saknas ELLER när `list`
 * fallerar. Skälet är kortets kontrakt: ett saknat/oläsbart utkast får
 * ALDRIG fälla den skarpa genereringen, det ska bara leda till att vi
 * renderar i stället. Samma best-effort-disciplin som `rensaUtkast` nedan,
 * av samma skäl och med samma loggning. Formfel i `eventId`/`typ` är dock
 * ett ANNAT slag av fel (programmerings-/klientfel) och propageras från
 * `byggUtkastPath` som `ValidationError` — de tystas inte.
 */
export async function hittaUtkast(
  supabaseAdmin: SupabaseAdminLike,
  params: { eventId: string; typ: UtkastTyp },
): Promise<FunnetUtkast | null> {
  const path = byggUtkastPath(params.eventId, params.typ);
  const prefix = `utkast/${params.eventId}`;
  const filnamn = `${params.typ}.pdf`;

  try {
    const { data: entries, error: listError } = await supabaseAdmin.storage
      .from(BILAGOR_BUCKET_ID)
      .list(prefix);
    if (listError) {
      console.error(
        `[hittaUtkast] list("${prefix}") misslyckades (behandlas som "utkast saknas") | ` +
          `event=${params.eventId} | error=${listError.message}`,
      );
      return null;
    }
    const traff = (entries ?? []).find((entry) => entry.name === filnamn);
    if (!traff) return null;

    const storlek = traff.metadata?.size;
    return {
      path,
      storlek: typeof storlek === 'number' && Number.isFinite(storlek) ? storlek : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[hittaUtkast] oväntat fel (behandlas som "utkast saknas") | event=${params.eventId} | ` +
        `error=${message}`,
    );
    return null;
  }
}

/**
 * rensaUtkast — TASK-302.3 (PRD TASK-302, `ADR-124` § Beslut 2: *"Skarp
 * generering eller sändning för ett event tar bort utkast/<eventId>/
 * (utkastet är ersatt)."*). Tar bort HELA `utkast/<eventId>/`-mappen — ALLA
 * dokumenttyper för det eventet, inte bara den typ som just genererades —
 * eftersom en skarp artefakt ersätter FÖRHANDSGRANSKNINGENS SYFTE för det
 * eventet oavsett vilken typ som förhandsgranskades senast.
 *
 * BEST-EFFORT, ALDRIG FÄLLANDE (kortets AC #1: "skarp operation lyckas även
 * om remove fallerar"): varje fel — `list`, `remove`, eller ett oväntat
 * kastat undantag — LOGGAS och SVÄLJS. Denna funktion returnerar aldrig ett
 * avvisande och kastar ALDRIG. Samma disciplin som `delete-attachment/
 * index.ts`s egen Storage-borttagning (§ "STORAGE-BORTTAGNINGEN ÄR
 * BEST-EFFORT") — ett utkast som blir kvar en stund extra efter en skarp
 * generering är ofarligt skräp (nästa `laggUtkast` för samma event/typ
 * skriver över det via `upsert`); en skarp generering/sändning som FALLERAR
 * på grund av en städnings-detalj vore fel prioritetsordning.
 *
 * ANROPAS EFTER lyckad persistering/sändning, ALDRIG före — se anroparna
 * (`generate-event-attachment/index.ts`s persisterande gren,
 * `_shared/send-receipt.ts` § `sendReceipt` efter lyckad `finalizeReceipt`).
 * Ett utkast ska finnas kvar om den skarpa operationen avvisas.
 */
export async function rensaUtkast(supabaseAdmin: SupabaseAdminLike, eventId: string): Promise<void> {
  const prefix = `utkast/${eventId}`;
  try {
    const { data: entries, error: listError } = await supabaseAdmin.storage
      .from(BILAGOR_BUCKET_ID)
      .list(prefix);
    if (listError) {
      console.error(
        `[rensaUtkast] list("${prefix}") misslyckades (fäller inte den skarpa operationen) | ` +
          `event=${eventId} | error=${listError.message}`,
      );
      return;
    }
    if (!entries || entries.length === 0) {
      return;
    }
    const paths = entries.map((entry) => `${prefix}/${entry.name}`);
    const { error: removeError } = await supabaseAdmin.storage.from(BILAGOR_BUCKET_ID).remove(paths);
    if (removeError) {
      console.error(
        `[rensaUtkast] remove(${paths.length} objekt) misslyckades (fäller inte den skarpa ` +
          `operationen) | event=${eventId} | error=${removeError.message}`,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[rensaUtkast] oväntat fel (fäller inte den skarpa operationen) | event=${eventId} | ` +
        `error=${message}`,
    );
  }
}
