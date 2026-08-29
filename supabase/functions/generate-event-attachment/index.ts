// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som send-email/index.ts och test-pdf-generation/index.ts.
//
// generate-event-attachment — TASK-146.5 "Klass B — event-mallad generering
// ur systemmall" (PRD task-146, bilage-fundamentet). ADR-125-PROMOVERAD
// (TASK-309.4): BÅDA bilagemallarna (`mall: 'bekraftelse' | 'deltagarinfo'`)
// renderas nu genom `_shared/mall-render.ts` (Eta + DocRaptor) i stället för
// pdf-lib och en hårdkodad systemmall. Se ADR-125 § Beslut 4+5.
//
// [TASK-309.4, RIVET] All pdf-lib-kod (SYSTEMMALL_BRODTEXT, byggPdf,
// lasEventUppgifter, formatSvenskDatum/MANADSNAMN) är BORTA — den mallen
// bar EN hårdkodad "Deltagarinformation"-text (AC #2 i task-146.5, ingen
// mall-editor i v1). Ersatt av de RIKTIGA mallarna
// (`docs/mallar/bilagor/{bekraftelsebilaga,deltagarinformation}.html`) med
// eventets FAKTISKA ifyllnadsunderlag (`_shared/document-sources.ts`, delad
// med `get-document-sources/index.ts`, ADR-125 § Beslut 5).
//
// MALL-PARAMETERN (NY, TASK-309.4): body bär nu `mall: 'bekraftelse' |
// 'deltagarinfo'` — EN EF för BÅDA mallarna (ADR-125 § Beslut 5:s
// EF-topologi-tabell), i stället för en hårdkodad enda mall. Ett angivet
// men okänt värde är ett klientfel (400), aldrig en tyst fallback.
//
// KÄLLHASH (NY, TASK-309.4, ADR-125 § Beslut 3): SHA-256
// (`_shared/mall-hash.ts`) över den EXAKTA, mall-resolvda ifyllnadsdatan
// (`_shared/mall-data.ts`s `byggBekraftelseData`/`byggDeltagarinfoData`) —
// samma data Eta faktiskt fyller mallen med, inte råa standard/kopia-par.
// Skriven till Bilagor-radens `Källhash`-fält tillsammans med `Mall`
// (singleSelect-namnet). Adaptern (TASK-309.6) härleder inaktualitet genom
// att räkna om samma hash vid listning och jämföra.
//
// ERSATT-LÄGET (NYTT, TASK-309.4, ADR-125 § Beslut 3 "Regenerering är
// ERSÄTTNING"): body kan bära `ersatt: <attachmentId>` — regenererar EN
// BEFINTLIG Event-mallad rad i stället för att skapa en ny. SAMMA
// Bilagor-rad (samma attachmentId, ägarskaps-guard som delete-attachment/
// index.ts), SAMMA Storage-lagringsnyckel (`upsert: true`, filen skrivs
// över i stället för att en ny path allokeras) — så Åtgärds-sidans
// bilageval förblir giltigt (ADR-125 § 3). `useReplaceAttachment.ts`s
// upload-nytt-radera-gammalt-mönster (TASK-147.11) är ett ANNAT flöde
// (klientens manuella filersättning, en NY rad + en NY attachmentId) —
// denna EF:s ersatt-läge är regenerering AV SAMMA rad, arkitektoniskt
// skilt (se skivans slutrapport för resonemanget).
//
// [ADR-124, TASK-302.2] FÖRHANDSVISNINGS-LÄGET (body-flaggan `preview:
// true`) OFÖRÄNDRAT I FORM: skriver ett TRANSIENT Storage-utkast
// (`_shared/utkast.ts` § `laggUtkast`) och returnerar `{ url, utgar }`.
// `typ` härleds ur `mall` ('bekraftelse' → 'bilaga', 'deltagarinfo' →
// 'deltagarinformation' — SAMMA `UTKAST_TYPER`-enum TASK-302 redan
// definierade, ingen ny typ behövdes).
//
// AC #3 (TASK-146.5), AMENDERAD TVÅ GÅNGER — RIVEN INGEN GÅNG.
// `ADR-124` § Beslut 3 föreskriver att den amenderade lydelsen står
// VERBATIM i BÅDA preview-EF:ernas filhuvuden. `preview-receipt/index.ts`
// har burit den sedan `TASK-302.2`; DENNA fil bar bara en förkortad
// parafras ("noll konsument-synliga sidoeffekter (ingen Bilagor-rad, inget
// kvittonummer, inget mail)") — en ADR-083-avvikelse som rättas här.
// Andra amenderingen (`TASK-340.1`) är de två markerade leden:
//
//   Förhandsvisningen har noll KONSUMENT-SYNLIGA sidoeffekter: ingen
//   Bilagor-rad, inget allokerat kvittonummer, inget mail. Den skriver ett
//   TRANSIENT utkast under `utkast/<eventId>/<typ>.pdf` i bucket `bilagor`
//   — aldrig listat i appen, överskrivet per event och typ (`upsert`),
//   PROMOVERAT till eventets dokument när en skarp generering bär en
//   `kallhash` som stämmer med serverns omräkning, och borttaget vid varje
//   skarp generering — för att Chromes PDF-visare bara scrollar jämnt på en
//   URL serverad av nätverkstjänsten (ADR-124), och för att den fil Lotta
//   sparar ska vara EXAKT de bytes hon granskade (TASK-340.1).
//
// Invarianterna är oförändrade: fortfarande högst ETT utkast per event och
// typ, fortfarande aldrig listat i appen, fortfarande ingen Bilagor-rad och
// inget mail från förhandsvisningen. Det som tillkommer är att utkastet
// KONSUMERAS i stället för att bara kastas.
//
// ÖPPEN, TILLDELAD SKULD (bokförd, inte tyst): `ADR-124` § Updates och
// `ADR-125` § Updates skrivs av `TASK-340.3` (PRD `TASK-340` §
// Implementationsbeslut, "Dokumentation" — en egen skiva). Tills den landat
// är ADR-124 § Beslut 3:s block i ADR-filen den ÄLDRE lydelsen och detta
// filhuvud den nyare. `preview-receipt/index.ts` rörs INTE av denna skiva
// (kvittoflödet är uttryckligen utanför PRD:ns omfattning) och bär därför
// fortsatt förstaamenderingens lydelse — korrekt för den EF:en, vars utkast
// inte promoveras.
//
// ─────────────────────────────────────────────────────────────────────────
// [TASK-340.1, PRD `TASK-340` § Implementationsbeslut A + E] SKAPA
// PROMOVERAR UTKASTET, OCH ETT UPPREPAT SKAPA ERSÄTTER I STÄLLET FÖR ATT
// DUBBLERA. Två ändringar i den skarpa grenen; förhandsvisningen behåller
// sin form och sitt eget fönster.
//
// **A — hashen i preview-svaret, promovering vid Skapa.** Preview-svaret
// bär nu `kallhash` — den `Källhash` EF:en REDAN räknade ut och kastade
// bort i preview-grenen. Klienten skickar tillbaka den i body:n vid Skapa
// (`kallhash`, VALFRI); servern räknar om dagens hash och:
//   (a) likhet OCH utkastet finns → utkastets EXAKTA bytes KOPIERAS till
//       eventets prefix (`_shared/storage-kopiera.ts`, server-side copy
//       inom bucketen) — INGEN DocRaptor-rendering — och svaret bär
//       `promoverad: true`;
//   (b) skillnad → omrendering, `underlagAndrat: true` (klienten säger det
//       i klartext: "förhandsgranska gärna igen");
//   (c) inget utkast → omrendering, TYST (degradering, aldrig ett fel);
//   (d) ingen hash angiven → omrendering, tyst — precis dagens beteende,
//       vilket är vad varje befintlig klient och listans "Skapa om" får.
// Klientens hash är ett PÅSTÅENDE som ALLTID verifieras mot serverns egen
// omräkning: en felaktig hash kan aldrig ge promovering av FEL underlag,
// bara ett misslyckat försök som faller tillbaka på rendering. Beslutet
// självt är en REN funktion (`_shared/promoveringsbeslut.ts`) med egen
// enhetstestsvit; denna fil hämtar bara dess indata.
// VARFÖR ÖVER HUVUD TAGET: DocRaptor slumpar PDF:ens `/ID`-par per anrop
// och det går inte att styra, så en omrendering ger BEVISLIGEN andra bytes
// än den fil Lotta granskade. Det är en korrekthetsfråga, inte en
// optimering — research `forhandsgranska-spara-atervand-bilageflodet-
// 2026-08-29.md` § 2.3 + § Dom punkt 2.
//
// **E — ersatt-vägen väljs av SERVERN.** Finns redan en Event-mallad
// Bilagor-rad för (event × `Mall`) går skrivningen ersatt-vägen
// AUTOMATISKT (`ADR-125` § 3, *"Regenerering är ERSÄTTNING"*): samma rad,
// samma `attachmentId`, samma lagringsnyckel, `ersatte: true` i svaret,
// status 200 i stället för 201. EF:en gör uppslaget SJÄLV (eventets
// omvända `Bilagor`-länk → rader filtrerade på `Dokumentklass` +
// `Mall`), så klienten kan inte skapa en dubblett av misstag. Ett
// EXPLICIT `ersatt` i body:n fortsätter fungera oförändrat (listans
// "Skapa om") och tar företräde — server-uppslaget körs bara när klienten
// INTE själv pekat ut en rad.
// VARFÖR: utan E bygger varje upprepat Skapa en dubblett med IDENTISKT
// filnamn, som kollapsar bakom "+1 äldre fil" i `DokumentYta.tsx`s
// `grupperaPerNamn` och INTE går att radera från appen. Mätt på den
// permanenta staging-fixturen 2026-08-29: 23 Bekräftelsebilaga-rader och
// 4 Deltagarinformation-rader på ETT event, samtliga födda samma dag.
//
// SVARSFORMEN ÄR ADDITIV. Befintliga fält är oförändrade och varje anrop
// UTAN `kallhash` får exakt dagens svar; tillkommande fält är `kallhash`
// (preview) samt `promoverad`/`underlagAndrat`/`ersatte` (skarpt, alltid
// närvarande booleaner så en konsument slipper skilja `false` från
// `undefined`). ETT undantag, medvetet: `pdfBase64` utelämnas när svaret
// är en PROMOVERING. Det fältet är den sista resten av den leveransväg
// `ADR-124` beslut 1 ersatte med signerade URL:er — klienten läser det
// inte (`AirtableAdapter.skapaEventBilaga` parsar bara `attachment`), och
// att ladda ner den nyss serverkopierade filen enbart för att base64-koda
// den tillbaka till en anropare som kastar den vore precis det
// byte-varv promoveringen finns för att slippa. Grenen kan bara nås av en
// klient som själv skickat `kallhash`, så ingen befintlig anropare ser en
// förändring.
// ─────────────────────────────────────────────────────────────────────────
//
// AUKTORISATION: samma nivå som create-event-note/create-event
// (requireUser, ingen extra ADMIN_EMAILS-gate).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  createAirtableRecord,
  fetchAirtableRecord,
  fetchFromAirtable,
  updateAirtableRecord,
} from '../_shared/airtable-client.ts';
import { buildEqualsFilter, combineWithAnd } from '../_shared/airtable-filter.ts';
import {
  ATTACHMENT_CLASS_EVENT_MALLAD,
  BILAGOR_BUCKET_ID,
  BILAGOR_TABLE,
  buildAttachmentLeaf,
  buildAttachmentPath,
  EVENTPLANERING_TABLE,
  isValidEventId,
  mapAttachmentRecord,
  toBase64,
} from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { fetchDocumentSources } from '../_shared/document-sources.ts';
import {
  ForbiddenError,
  generateRequestId,
  HttpError,
  mapErrorToResponse,
  ValidationError,
} from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import { byggBekraftelseData, byggDeltagarinfoData } from '../_shared/mall-data.ts';
import { berakaKallhash } from '../_shared/mall-hash.ts';
import { renderaMallPdf } from '../_shared/mall-render.ts';
import {
  arKanoniskKallhash,
  beslutaPromovering,
  valjErsattKandidat,
} from '../_shared/promoveringsbeslut.ts';
import { kopieraInomBucket } from '../_shared/storage-kopiera.ts';
import { hittaUtkast, laggUtkast, rensaUtkast } from '../_shared/utkast.ts';

const OPERATION_KEY = 'create-attachment';
const EVENT_LINK_FIELD = 'Event';

// [TASK-340.1] Eventets OMVÄNDA länkfält som bär dess Bilagor-record-ID:n —
// samma auto-födda fält `get-event-attachments/index.ts` läser, och samma
// namn som tabellen. Verifierat live mot staging 2026-08-29 (fältlistan på
// `Eventplanering` bär `Bilagor`).
const ATTACHMENTS_LINK_FIELD = 'Bilagor';

// Max record-ID:n per batch-anrop i ersätt-uppslaget — spegel av
// `get-event-attachments`s `ATTACHMENTS_BATCH_SIZE`, samma korta
// `OR(RECORD_ID()=…)`-formel.
const ERSATT_UPPSLAG_BATCH_SIZE = 50;

// Fälten ersätt-uppslaget behöver. `Lagringsnyckel` INGÅR — till skillnad
// mot `get-event-attachments` (som medvetet utesluter den ur sitt
// KLIENT-svar) är detta ett server-internt uppslag vars enda syfte är att
// hitta filen som ska skrivas över. Fältet lämnar aldrig EF:en.
const ERSATT_UPPSLAG_FIELDS = ['Skapad', 'Dokumentklass', 'Mall', 'Lagringsnyckel', 'Event'];

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * [TASK-340.1, PRD `TASK-340` § E] Slår upp en BEFINTLIG Event-mallad
 * Bilagor-rad för (event × mall). Returnerar `null` när ingen finns — då
 * skapas en ny rad, precis som förut.
 *
 * VÄGEN ÄR EVENTETS OMVÄNDA LÄNK, INTE ETT LÄNKFÄLT-FILTER. Ett
 * `FIND(recId, ARRAYJOIN({Event}))` mot Bilagor hade matchat länkens
 * PRIMÄR-DISPLAY, inte record-ID (T15-klassens bugg) — samma skäl
 * `get-event-attachments/index.ts` och `get-event-notes` redan bokför för
 * sina egna uppslag. Record-ID är den enda tillförlitliga nyckeln, så vi
 * läser eventraden och batchar dess `Bilagor`-ID:n.
 *
 * INGEN ÄGARSKAPS-GUARD BEHÖVS HÄR — till skillnad mot det klient-angivna
 * `ersatt` (som guardas ovan, FÖRE `fetchDocumentSources`, se den notens
 * resonemang) kommer dessa ID:n ur EVENTETS EGEN länk och kan strukturellt
 * inte tillhöra ett annat event. `Dokumentklass` och `Mall` filtreras i
 * formeln, så samma tre invarianter den klient-angivna vägen kontrollerar
 * är uppfyllda av konstruktion.
 *
 * FLERA TRÄFFAR ÄR NORMALT, inte ett undantag: alla dubbletter som föddes
 * FÖRE denna skiva ligger kvar (23 st på staging-fixturen 2026-08-29).
 * `valjErsattKandidat` (ren funktion, egen enhetstestsvit) väljer den
 * NYASTE — den rad Lotta faktiskt ser i listan, eftersom
 * `get-event-attachments` sorterar nyast först och `grupperaPerNamn` visar
 * `lista[0]`. Äldre dubbletter rörs inte; att radera dem är ett eget beslut
 * (PRD § Utanför omfattningen).
 */
async function hittaBefintligEventMalladRad(
  eventId: string,
  airtableOption: string,
): Promise<{ id: string; fields: Record<string, unknown> } | null> {
  const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
  const lankade = eventRecord?.fields?.[ATTACHMENTS_LINK_FIELD];
  if (!Array.isArray(lankade) || lankade.length === 0) return null;

  const traffar: { id: string; fields: Record<string, unknown> }[] = [];
  for (const idChunk of chunk(lankade as string[], ERSATT_UPPSLAG_BATCH_SIZE)) {
    const filterByFormula = combineWithAnd([
      `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`,
      buildEqualsFilter('Dokumentklass', ATTACHMENT_CLASS_EVENT_MALLAD),
      buildEqualsFilter('Mall', airtableOption),
    ]) as string;
    const rows = (await fetchFromAirtable(BILAGOR_TABLE, {
      filterByFormula,
      fields: ERSATT_UPPSLAG_FIELDS,
    })) as { id: string; fields: Record<string, unknown> }[];
    traffar.push(...rows);
  }

  const vald = valjErsattKandidat(
    traffar.map((r) => ({
      id: r.id,
      skapad: typeof r.fields['Skapad'] === 'string' ? (r.fields['Skapad'] as string) : null,
    })),
  );
  if (!vald) return null;
  return traffar.find((r) => r.id === vald.id) ?? null;
}

type MallParam = 'bekraftelse' | 'deltagarinfo';

/** Per-mall konstanter — EN källa, inga syskon-if-satser utspridda i filen. */
const MALL_META: Record<
  MallParam,
  { namnPrefix: string; storageFilnamn: string; airtableOption: string; utkastTyp: 'bilaga' | 'deltagarinformation' }
> = {
  bekraftelse: {
    namnPrefix: 'Bekräftelsebilaga',
    storageFilnamn: 'bekraftelsebilaga.pdf',
    airtableOption: 'Bekräftelsebilaga',
    utkastTyp: 'bilaga',
  },
  deltagarinfo: {
    namnPrefix: 'Deltagarinformation',
    storageFilnamn: 'deltagarinformation.pdf',
    airtableOption: 'Deltagarinformation',
    utkastTyp: 'deltagarinformation',
  },
};

function isValidMallParam(value: unknown): value is MallParam {
  return value === 'bekraftelse' || value === 'deltagarinfo';
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const eventId = body?.eventId;
    const mallRaw = body?.mall;
    // [TASK-246] Strikt boolean — se filhuvudet, samma "gissa aldrig"-disciplin.
    const preview = body?.preview === true;
    const ersattRaw = body?.ersatt;
    const kallhashRaw = body?.kallhash;

    if (typeof eventId !== 'string' || !isValidEventId(eventId)) {
      throw new ValidationError('eventId is required and must be an Airtable record ID (rec…)');
    }
    if (!isValidMallParam(mallRaw)) {
      throw new ValidationError("mall is required and must be 'bekraftelse' or 'deltagarinfo'");
    }
    const mall: MallParam = mallRaw;
    const meta = MALL_META[mall];

    // [SKARPT FYND, TASK-309.4 staging-tester] `ersatt` är Bilagor-radens
    // EGNA Airtable record-ID (samma "attachmentId" klienten ser i
    // `attachment.id`/`record.id` — rec…-formen), INTE den interna
    // `crypto.randomUUID()` som bara lever i Storage-lagringsnyckeln
    // (`buildAttachmentLeaf`). `isValidAttachmentId` (UUID-forms-grinden)
    // var FEL validering här — samma rec-forms-grind som
    // `delete-attachment/index.ts` redan använder för sitt `attachmentId`.
    let ersatt: string | null = null;
    if (ersattRaw !== undefined) {
      if (!isValidEventId(ersattRaw)) {
        throw new ValidationError('ersatt must be an Airtable record ID (rec…) when provided');
      }
      ersatt = ersattRaw;
    }

    // [TASK-340.1, PRD § A] Klientens PÅSTÅENDE om vilket underlag den
    // förhandsgranskade — valfritt. Formen valideras HÄR, vid HTTP-gränsen:
    // ett angivet men trasigt värde är ett klientfel (400), aldrig en tyst
    // fallback — samma disciplin `mall` och `ersatt` redan bär, och samma
    // regel filhuvudets MALL-PARAMETER-stycke slår fast. Ett VÄLFORMAT men
    // felaktigt värde är däremot INTE ett fel: det behandlas som "underlaget
    // har ändrats" och leder till omrendering (`beslutaPromovering`), aldrig
    // till promovering av fel underlag.
    let angivenKallhash: string | null = null;
    if (kallhashRaw !== undefined && kallhashRaw !== null) {
      if (!arKanoniskKallhash(kallhashRaw)) {
        throw new ValidationError(
          'kallhash must be a 64-character lowercase SHA-256 hex string when provided',
        );
      }
      angivenKallhash = kallhashRaw;
    }

    // [SKARPT FYND, TASK-309.4 staging-tester] ÄGARSKAPS-GUARDEN MÅSTE KÖRAS
    // FÖRE `fetchDocumentSources(eventId)` — INTE efter. Testet "fel eventId
    // (ägarskaps-guard) → 403" skickar ett PÅHITTAT eventId
    // (`recZZZZZZZZZZZZZZ`) som INTE finns; med den gamla ordningen (fetch
    // DocumentSources FÖRST) föll koden på "Event not found" (404) innan
    // ägarskaps-kontrollen ens nåddes — en attacker hade då kunnat
    // SKILJA "fel event, existerar" (skulle nå ägarskaps-koden) från "fel
    // event, existerar inte" (404) via svarskoden, en informationsläcka
    // ovanpå att skyddet aldrig triggade för det påhittade fallet. Samma
    // "gör den billiga/säkra kontrollen FÖRE den dyra/informativa"-ordning
    // som `delete-attachment/index.ts` redan följer (ägarskap FÖRE
    // Storage-läsning).
    let existingErsattRecord: { id: string; fields: Record<string, unknown> } | null = null;
    if (ersatt) {
      const existing = await fetchAirtableRecord(BILAGOR_TABLE, ersatt);
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Bilagan hittades inte.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const linkedEventIds = existing.fields[EVENT_LINK_FIELD];
      const belongsToEvent =
        Array.isArray(linkedEventIds) && (linkedEventIds as unknown[]).includes(eventId);
      if (!belongsToEvent) {
        console.warn(
          `[generate-event-attachment] DENY ersatt ownership guard | caller_user_id=${user.id} | attachment=${ersatt} | claimed_event=${eventId}`,
        );
        throw new ForbiddenError('Bilagan hör inte till det angivna eventet.');
      }
      if (existing.fields['Dokumentklass'] !== ATTACHMENT_CLASS_EVENT_MALLAD) {
        throw new ForbiddenError('Endast mall-genererade bilagor kan regenereras via ersatt-läget.');
      }
      if (existing.fields['Mall'] !== meta.airtableOption) {
        throw new ValidationError(
          `Bilagans mall (${String(existing.fields['Mall'])}) matchar inte den angivna mallen (${meta.airtableOption}).`,
        );
      }
      existingErsattRecord = existing;
    }

    const sources = await fetchDocumentSources(eventId);
    if (!sources) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mallData =
      mall === 'bekraftelse' ? byggBekraftelseData(sources) : byggDeltagarinfoData(sources);

    // Fail-closed, SAMMA mönster som send-receipt-email/index.ts:s `isProd`
    // (se mall-render.ts:s filhuvud för varför denna härledning bor HÄR,
    // hos anroparen, och inte inne i renderaMallPdf).
    const test = Deno.env.get('ENVIRONMENT') !== 'production';

    const namn = `${meta.namnPrefix} – ${sources.event.eventlabel}.pdf`;

    // [TASK-340.1] RENDERINGEN ÄR NU LAT. Den låg tidigare här, ovillkorligt,
    // FÖRE `if (preview)` — vilket var hela poängen med research-passets fynd
    // (a): preview-grenen räknade redan ut `Källhash` och kastade bort den.
    // En PROMOVERING får inte rendera alls (det är själva vinsten), så anropet
    // flyttas in i en funktion som körs bara när vi faktiskt behöver bytes.
    // DOCRAPTOR_API_KEY-kontrollen följer med in: att svara 500 "nyckeln
    // saknas" på ett anrop som aldrig skulle rört DocRaptor vore ett påhittat
    // fel. Fail-fast-formen är oförändrad för varje anrop som DO renderar.
    async function renderaPdf(): Promise<Uint8Array> {
      const apiKey = Deno.env.get('DOCRAPTOR_API_KEY');
      if (!apiKey) {
        throw new HttpError(500, 'DOCRAPTOR_API_KEY saknas i secrets');
      }
      return await renderaMallPdf(mall, mallData as unknown as Record<string, unknown>, {
        apiKey,
        test,
        namn,
      });
    }

    const kallhash = await berakaKallhash(mallData);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (preview) {
      console.log(
        `[generate-event-attachment] PREVIEW | caller_user_id=${user.id} | event=${eventId} | mall=${mall}`,
      );
      const { url, utgar } = await laggUtkast(supabaseAdmin, {
        eventId,
        typ: meta.utkastTyp,
        bytes: await renderaPdf(),
      });
      // [TASK-340.1, AC #1] `kallhash` ÄR den enda tillagda nyckeln. Klienten
      // (TASK-340.2) skickar tillbaka den vid Skapa; `DocumentPreviewSchema`
      // är ett icke-strikt zod-objekt, så en klient som ännu inte känner
      // fältet strippar det tyst i stället för att fela.
      return new Response(JSON.stringify({ url, utgar, kallhash, requestId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      throw new Error(`Unknown operation: ${OPERATION_KEY}`);
    }

    // ── [TASK-340.1, PRD § E] ERSÄTT-UPPSLAGET ─────────────────────────────
    // Klientens EXPLICITA `ersatt` tar FÖRETRÄDE och är redan guardat ovan
    // (existens · ägarskap · dokumentklass · mall-matchning, FÖRE
    // fetchDocumentSources — se den notens resonemang för varför ordningen är
    // låst). Först när klienten INTE pekat ut en rad gör servern sitt eget
    // uppslag. Ordningen är avsiktlig: listans "Skapa om" ska fortsätta styra
    // exakt vilken rad den regenererar, medan genereringsvyns "Skapa" aldrig
    // ska kunna föda en dubblett av misstag.
    if (!ersatt) {
      const befintlig = await hittaBefintligEventMalladRad(eventId, meta.airtableOption);
      if (befintlig) {
        ersatt = befintlig.id;
        existingErsattRecord = befintlig;
        console.log(
          `[generate-event-attachment] ERSATT-UPPSLAG traff | caller_user_id=${user.id} | ` +
            `event=${eventId} | mall=${mall} | attachment=${ersatt}`,
        );
      }
    }
    const ersatte = Boolean(ersatt && existingErsattRecord);

    // ── [TASK-340.1, PRD § A] PROMOVERA ELLER RENDERA ──────────────────────
    // Utkastet slås upp ENDAST när klienten faktiskt gjort ett påstående —
    // ett anrop utan `kallhash` ska inte betala för en Storage-listning vars
    // svar ändå inte kan användas till något.
    const utkast =
      angivenKallhash !== null
        ? await hittaUtkast(supabaseAdmin, { eventId, typ: meta.utkastTyp })
        : null;
    const beslut = beslutaPromovering({
      angivenKallhash,
      serverKallhash: kallhash,
      utkastFinns: utkast !== null,
    });
    const promoverad = beslut.promovera && utkast !== null;

    // DESTINATIONEN. Ersatt-vägen skriver över SAMMA lagringsnyckel — så
    // Åtgärds-sidans bilageval förblir giltigt (ADR-125 § 3); en ny rad får en
    // ny, deterministisk path (samma form som mönster 1/2, TASK-146.4).
    const attachmentId = ersatte ? null : crypto.randomUUID();
    let path: string;
    if (ersatte && existingErsattRecord && ersatt) {
      const lagringsnyckel = existingErsattRecord.fields['Lagringsnyckel'];
      path =
        typeof lagringsnyckel === 'string' && lagringsnyckel.length > 0
          ? `${eventId}/${lagringsnyckel}`
          : buildAttachmentPath(eventId, ersatt, meta.storageFilnamn);
    } else {
      path = buildAttachmentPath(eventId, attachmentId as string, meta.storageFilnamn);
    }

    // `pdfBytes` finns BARA när vi faktiskt renderade — se filhuvudets not om
    // varför `pdfBase64` då utelämnas ur svaret.
    let pdfBytes: Uint8Array | null = null;
    let storlekBytes: number;

    if (promoverad && utkast) {
      const kopia = await kopieraInomBucket({
        supabaseUrl: Deno.env.get('SUPABASE_URL')!,
        serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        bucket: BILAGOR_BUCKET_ID,
        franPath: utkast.path,
        tillPath: path,
      });
      // Storleken kommer i FÖRSTA hand ur kopieringssvarets egen
      // `metadata.size` (den beskriver DESTINATIONEN), i andra hand ur
      // källobjektets `list()`-metadata. Saknas båda FELAR vi hellre än
      // skriver ett gissat tal till `Storlek (bytes)` — ett fält Lotta ser.
      const storlek = kopia.storlek ?? utkast.storlek;
      if (typeof storlek !== 'number') {
        throw new HttpError(
          502,
          'Utkastet kopierades, men storleken kunde inte läsas ur Storage-svaret.',
        );
      }
      storlekBytes = storlek;
      console.log(
        `[generate-event-attachment] PROMOVERAT | caller_user_id=${user.id} | event=${eventId} | ` +
          `mall=${mall} | fran=${utkast.path} | till=${path}`,
      );
    } else {
      pdfBytes = await renderaPdf();
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BILAGOR_BUCKET_ID)
        .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: ersatte });
      if (uploadError) {
        throw new Error(`Storage-uppladdning misslyckades: ${uploadError.message}`);
      }
      storlekBytes = pdfBytes.byteLength;
      console.log(
        `[generate-event-attachment] RENDERAT | caller_user_id=${user.id} | event=${eventId} | ` +
          `mall=${mall} | skal=${beslut.skal}`,
      );
    }

    // Fältmängderna är OFÖRÄNDRADE mot före TASK-340.1 — ersatt-vägen rör
    // fyra fält, ny-rad-vägen åtta. Enda skillnaden är att `Storlek (bytes)`
    // nu kommer ur `storlekBytes` (bytes ELLER kopieringssvaret) i stället
    // för alltid ur `pdfBytes.byteLength`.
    const fields: Record<string, unknown> = ersatte
      ? {
          Namn: namn,
          'Storlek (bytes)': storlekBytes,
          Skapad: new Date().toISOString(),
          Källhash: kallhash,
        }
      : {
          Namn: namn,
          'Storlek (bytes)': storlekBytes,
          Skapad: new Date().toISOString(),
          Event: [eventId],
          Lagringsnyckel: buildAttachmentLeaf(attachmentId as string, meta.storageFilnamn),
          Dokumentklass: ATTACHMENT_CLASS_EVENT_MALLAD,
          Mall: meta.airtableOption,
          Källhash: kallhash,
        };

    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[generate-event-attachment] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      throw new Error(`Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`);
    }

    console.log(
      ersatte
        ? `[generate-event-attachment] ALLOW ersatt | caller_user_id=${user.id} | event=${eventId} | attachment=${ersatt} | mall=${mall}`
        : `[generate-event-attachment] ALLOW | caller_user_id=${user.id} | event=${eventId} | mall=${mall} | path=${path}`,
    );

    const rad =
      ersatte && ersatt
        ? await updateAirtableRecord(BILAGOR_TABLE, ersatt, fields)
        : await createAirtableRecord(operation.tableId, fields);

    // Utkastet är nu antingen KONSUMERAT (promoverat) eller ersatt av en ny
    // rendering — i båda fallen städas hela `utkast/<eventId>/` som förut
    // (ADR-124 § Beslut 2, best-effort, fäller aldrig den skarpa operationen).
    await rensaUtkast(supabaseAdmin, eventId);

    return new Response(
      JSON.stringify({
        attachment: mapAttachmentRecord(rad),
        record: { id: rad.id, fields: rad.fields },
        storagePath: path,
        ...(pdfBytes !== null ? { pdfBase64: toBase64(pdfBytes) } : {}),
        promoverad,
        underlagAndrat: beslut.underlagAndrat,
        ersatte,
        requestId,
      }),
      {
        status: ersatte ? 200 : 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'generate-event-attachment',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
