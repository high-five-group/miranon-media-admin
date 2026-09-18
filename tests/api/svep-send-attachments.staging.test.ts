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
});
