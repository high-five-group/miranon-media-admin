// Svepets bilagekontrakt × deployad staging-EF (TASK-455 AC #3, andra
// halvan). Rött-först-halvan (logiken i klientens sändlager) bevisas i
// `svep-send-attachments.test.ts` (api-pure). DENNA fil bevisar att exakt
// den FORM `sendSvepGrupper` (`src/data/mutations/svepSendGrupper.ts`) nu
// sänder — flera event-grupper i SAMMA svep, EN med vald bilaga, EN utan —
// faktiskt fungerar mot den RIKTIGA, deployade `send-action-email`-EF:en.
//
// VARFÖR EN NY FIL OCH INTE EN UTÖKNING AV
// `send-action-email-gemensam-bilaga.staging.test.ts`: den filen bevisar EN
// specifik vägg (Gemensam-bilagans cross-event-matchning, TASK-452) med EN
// registrering per anrop. Svepets egen kontrakt är bredare (bulk
// `registrationIds[]` PER event-grupp, blandat: någon grupp bär bilagor,
// någon inte) — precis den formen `docs/research/utskicksytan-karta-och-
// historik-2026-09-18.md` § C2 Option 1 beskriver och som `sendSvepGrupper`
// implementerar. Att bevisa den formen i en fil vars docblock handlar om en
// annan bugg hade gjort båda svårare att läsa.
//
// MAIL-LÅSET RESPEKTERAS: `SENTINEL_EMAIL` = `delivered@resend.dev`
// (`RESEND_TEST_ADDRESSES`, `_shared/send-bulk.ts`) — den ENDA typ av adress
// icke-prod-spärren tillåter `send-action-email` att faktiskt dispatcha mot.
// Ingen verklig adress förekommer i denna fil.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).
//
// ═══ VAD "BILAGAN FÖLJDE MED" FAKTISKT BEVISAS AV HÄR, OCH VAD SOM INTE
// KAN BEVISAS MED DAGENS KONTRAKT (läs innan du litar på eller utökar
// detta) ═══
//
// `SendActionEmailResultSchema` (klientens svarsform) bär status/requested/
// attempted/completed/skipped/failed — INGET Resend-meddelande-ID, ingen
// bilage-bekräftelse. `makeRealSingleSender`
// (`supabase/functions/send-action-email/index.ts`) destrukturerar
// `resend.emails.send()`s svar som `const { error } = ...` — `data.id`
// (Resends meddelande-ID) LÄSS ALDRIG UT och returneras alltså inte till
// klienten. Ingen mail-logg (`get-mail-log`/Utskickslogg) skrivs av
// `send-action-email` — den loggningen är exklusiv för segment-/batch-vägen
// (ADR-067 D7), verifierat genom att `_shared/send-action-email.ts` och
// `send-action-email/index.ts` grep-inspekterats för `get-mail-log`/
// `MailLog`-referenser (noll träffar). Repot har heller ingen Resend-webhook-
// mottagare (grep efter "webhook"/"svix" i `supabase/functions/` — noll
// träffar), så `delivered@resend.dev`s leverans-simulering (Resends egna
// testadresser, som utlöser webhook-events i stället för verklig leverans)
// har ingen mottagare att rapportera till HÄR.
//
// DEN STARKASTE BEVISNING SOM ÄR TEKNISKT MÖJLIG GENOM DEN DEPLOYADE,
// OFÖRÄNDRADE EF:EN ÄR DÄRFÖR STRUKTURELL, INTE INNEHÅLLSLIG:
//
//   1. POSITIVT (testet nedan): en `attachmentIds`-post som pekar på en
//      RIKTIG, nyss uppladdad bilaga resolveras av `resolveAttachments`
//      (Airtable-uppslag + eventägarskaps-kontroll), bytes LÄSES FAKTISKT ur
//      Supabase Storage (`makeRealAttachmentReader`, samma anrop som skulle
//      404:a "kunde inte hämtas ur lagringen" om filen saknades), och HELA
//      den paketen — email + bilage-bytes — skickas som EN ATOMISK
//      `resend.emails.send()`-request. Resends `/emails`-ändpunkt (INTE
//      `/emails/batch`, som ADR-067 D9 dokumenterar tappar bilagor tyst)
//      validerar och accepterar eller avvisar HELA payloaden som en enhet —
//      ett 200/`sent`-svar är därför bevis för att Resend tog emot och
//      accepterade precis den request som bar bilagan, inte ett svar som är
//      oberoende av om bilagan fanns med.
//   2. NEGATIVT (kontrollen nedan): en `attachmentIds`-post med ett
//      PÅHITTAT record-ID (aldrig skapat) ger 404 "Attachment not found"
//      INNAN sändningen ens når Resend. Detta visar att attachmentId:t är
//      GENUINT LASTBÄRANDE — request 1:s 200/`sent` är alltså inte ett
//      resultat av att servern ignorerar `attachmentIds` och bara skickar
//      batch-vägen ändå; en overksam parameter hade gett SAMMA 200 här.
//
// VAD DETTA INTE ÄR: ett bevis att `delivered@resend.dev`s (fiktiva) inkorg
// faktiskt innehåller ett mail med bilagan bifogad som en läsbar PDF. Den
// biten av AC #3:s ordalydelse ("mottagaren får bilagan") kräver antingen
// (a) att EF:en börjar returnera/logga Resends meddelande-ID så en extern
// Resend-API-fråga kan bekräfta leverans+bilaga i efterhand, eller (b) en
// Resend-webhook-mottagare i repot. Ingetdera finns idag, och att bygga
// någotdera är UTANFÖR TASK-455:s omfattning (det är en observability-
// utökning av `send-action-email`, inte av svepets klientlager). Detta
// stycke bokför gränsen öppet i stället för att låta testnamnet påstå mer
// än det kan bevisa (samma ADR-083-disciplin som resten av repot).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const SEND_ENDPOINT = '/functions/v1/send-action-email';
const UPLOAD_ENDPOINT = '/functions/v1/upload-attachment';
const DELETE_ENDPOINT = '/functions/v1/delete-attachment';
const CREATE_EVENT_ENDPOINT = '/functions/v1/create-event';
const CREATE_REGISTRATION_ENDPOINT = '/functions/v1/create-registration';
const SENTINEL_ORT = 'ZZ-create-event-test';

// Samma seedade Eventformat-ankare som övriga *.staging.test.ts-filer i
// denna familj (get-event-attachments, send-action-email-gemensam-bilaga,
// create-event) — delad hemvist saknas, house-mönstret dupliceras medvetet
// per fil (samma norm som syskonfilerna).
const SEEDED_EVENTFORMAT_ID = 'recclDd7hUQsfxoVs';
function eventformatId(): string {
  return process.env.TEST_EVENTFORMAT_RECORD_ID || SEEDED_EVENTFORMAT_ID;
}

/** Auktoritativ Resend-test-adress — se filhuvudets MAIL-LÅSET-stycke. */
const SENTINEL_EMAIL = 'delivered@resend.dev';

function buildPseudoPdfBase64(totalBytes: number): string {
  const header = '%PDF-1.4\n%';
  const footer = '\n%%EOF';
  const fillLength = totalBytes - header.length - footer.length;
  const content = header + 'A'.repeat(fillLength) + footer;
  return Buffer.from(content, 'utf8').toString('base64');
}

async function skapaEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  startdatum: string,
  slutdatum: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${CREATE_EVENT_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      event: 'Fjärrskådning',
      typ: 'Utbildning',
      ort: SENTINEL_ORT,
      startdatum,
      slutdatum,
      maxPlatser: 20,
      eventtyp: eventformatId(),
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup create-event misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as { record: { id: string } };
  registreraKastbarPost(body.record.id, 'svep-send-attachments/Eventplanering');
  return body.record.id;
}

/** Laddar upp en RIKTIG bilaga (mönster 1) mot `eventId`. Scope UTELÄMNAD →
 *  default (`Event`-räckvidd) — svepets vanliga fall, inte den redan
 *  bevisade Gemensam-cross-event-vägen (TASK-452). */
async function skapaBilaga(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      eventId,
      filnamn: `ZZ-attachment-test-${randomUUID()}.pdf`,
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup-uppladdning misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as { attachment: { id: string } };
  return body.attachment.id;
}

async function skapaRegistrering(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${CREATE_REGISTRATION_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      fornamn: 'ZzTask455',
      efternamn: 'Sentinel',
      email: SENTINEL_EMAIL,
      telefon: null,
      eventId,
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup create-registration misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as { record: { id: string } };
  return body.record.id;
}

/** Formen `sendSvepGrupper` faktiskt bygger PER event-grupp
 *  (`svepSendGrupper.ts`): `actionType`/`eventId`/`registrationIds`/`amne`/
 *  `mailtext`/`idempotencyKey`/`attachmentIds` (alltid en array, aldrig
 *  `undefined` för en grupp utan urval — se den filens `attachmentIds:
 *  (grupp) => string[]`-kontrakt). */
async function skickaSvepGrupp(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  registrationId: string,
  attachmentIds: string[],
): Promise<APIResponse> {
  return request.post(`${config.baseUrl}${SEND_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      actionType: 'fritt',
      eventId,
      registrationIds: [registrationId],
      amne: 'TASK-455 staging-conformance',
      mailtext: 'TASK-455 staging-conformance — sentinel-mottagare, ignorera.',
      idempotencyKey: randomUUID(),
      attachmentIds,
    },
  });
}

test.describe('Svepets bilagekontrakt — flera event-grupper, en med bilaga och en utan (TASK-455 AC #3)', () => {
  test('gruppen med vald bilaga går bilage-bärande, gruppen utan går batch-vägen — BÅDA "sent" mot sentinel', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // TVÅ event-grupper, exakt formen ett bekräftelse-/påminnelsesvep bygger
    // (ADR-114 beslut 2/3) — olika event, ett gemensamt sändanrop VAR.
    const eventMedBilaga = await skapaEvent(request, config, jwt, '2026-11-02', '2026-11-03');
    const eventUtanBilaga = await skapaEvent(request, config, jwt, '2026-11-09', '2026-11-10');

    const regMedBilaga = await skapaRegistrering(request, config, jwt, eventMedBilaga);
    const regUtanBilaga = await skapaRegistrering(request, config, jwt, eventUtanBilaga);

    const attachmentId = await skapaBilaga(request, config, jwt, eventMedBilaga);

    try {
      // GRUPP 1: vald bilaga — `attachmentIds` icke-tom, samma form
      // `Forhandsvisning.tsx`s `BilageValjare` skriver till `SvepOverlay`s
      // `bilagorPerGrupp`.
      const resMedBilaga = await skickaSvepGrupp(
        request,
        config,
        jwt,
        eventMedBilaga,
        regMedBilaga,
        [attachmentId],
      );
      const rawMedBilaga = await resMedBilaga.text();
      expect(resMedBilaga.status(), `bilage-bärande gruppen: ${rawMedBilaga}`).toBe(200);
      const bodyMedBilaga = JSON.parse(rawMedBilaga) as {
        status: string;
        completed: string[];
        failed: { registrationId: string; reason: string }[];
      };
      expect(bodyMedBilaga.status, JSON.stringify(bodyMedBilaga)).toBe('sent');
      expect(bodyMedBilaga.completed).toEqual([regMedBilaga]);
      expect(bodyMedBilaga.failed).toEqual([]);

      // GRUPP 2: INGET valt — `attachmentIds: []`, ADR-067 D9s batch-väg,
      // exakt formen en grupp utan bilageval har i dag.
      const resUtanBilaga = await skickaSvepGrupp(
        request,
        config,
        jwt,
        eventUtanBilaga,
        regUtanBilaga,
        [],
      );
      const rawUtanBilaga = await resUtanBilaga.text();
      expect(resUtanBilaga.status(), `batch-gruppen: ${rawUtanBilaga}`).toBe(200);
      const bodyUtanBilaga = JSON.parse(rawUtanBilaga) as {
        status: string;
        completed: string[];
        failed: { registrationId: string; reason: string }[];
      };
      expect(bodyUtanBilaga.status, JSON.stringify(bodyUtanBilaga)).toBe('sent');
      expect(bodyUtanBilaga.completed).toEqual([regUtanBilaga]);
      expect(bodyUtanBilaga.failed).toEqual([]);
    } finally {
      const del = await request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        data: { eventId: eventMedBilaga, attachmentId },
      });
      expect(del.status(), await del.text()).toBe(200);
    }
  });

  test('NEGATIV KONTROLL: ett påhittat attachmentId ger 404 INNAN Resend nås — attachmentIds är genuint lastbärande, inte en overksam parameter', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const event = await skapaEvent(request, config, jwt, '2026-11-16', '2026-11-17');
    const registrationId = await skapaRegistrering(request, config, jwt, event);

    // Välformat record-ID (rec-prefix + 17 alfanumeriska tecken, samma form
    // REC_ID_RE i send-action-email/index.ts kräver) som ALDRIG skapats —
    // resolveAttachments MÅSTE alltså slå fel på Airtable-uppslaget, inte på
    // formvalideringen (vilket hade gett 400, inte 404, och bevisat mindre).
    const paHittatAttachmentId = 'recZZnonExistent01';

    const res = await skickaSvepGrupp(request, config, jwt, event, registrationId, [
      paHittatAttachmentId,
    ]);
    const raw = await res.text();
    // Se filhuvudets § "VAD 'BILAGAN FÖLJDE MED' FAKTISKT BEVISAS": denna
    // 404 är NEGATIV-halvan av tvåsidig bevisning — utan den skulle ett
    // 200/sent-svar i testet ovan lika gärna kunna betyda "attachmentIds
    // ignorerades tyst och batch-vägen kördes ändå".
    expect(res.status(), `förväntade 404 (attachmentId aldrig skapat): ${raw}`).toBe(404);
    const body = JSON.parse(raw) as { error: string };
    expect(body.error).toBe(`Attachment not found: ${paHittatAttachmentId}`);
  });
});
