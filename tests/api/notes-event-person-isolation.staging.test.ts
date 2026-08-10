// Anteckningar-tabellens INVARIANT (S103, T97-bygg-spåret) — den viktigaste
// regressionsrisken i hela person-anteckningsströmmens landning: en rad bär
// `Event` ELLER `Person`, ALDRIG BÅDA, och EN ANTECKNINGSTYPS LÄS-EF FÅR ALDRIG
// BÖRJA RETURNERA DEN ANDRA TYPENS RADER.
//
// get-event-notes/get-person-notes är strukturellt säkrade (de läser bara
// record-ID:n ur den EGNA sidans omvända länk — en rad som bara har `Person`
// satt kan aldrig dyka upp i ett events omvända `Anteckningar`-länk, och tvärtom
// för `Anteckningar 2` på Personer). Det här testet BEVISAR det mekaniskt i
// stället för att bara hävda det: skapar en PERSON-anteckning och verifierar att
// den INTE läcker in i ett events ström, och skapar en EVENT-anteckning och
// verifierar att den INTE läcker in i en persons ström.
//
// SENTINEL: SAMMA form som create-event-note/create-person-note
// (`ZZ-note-test+${uuid}@sentinel`) — täcks av den befintliga
// `create-event-note-sentineler`-purge-targeten (matchar `{Anteckning}`-fältets
// text oavsett länk-typ; verifierat mot .purge-staging-policy.json på disk).
//
// MÅL: BELAGGNING_EVENT_ID (event-sidan) · HISTORY_PERSON_ID (person-sidan) —
// samma permanenta fixturer create-event-note/create-person-note-sviterna
// redan skriver mot.
//
// Lokalt skip:as utan creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER
// att get-person-notes/create-person-note deployats till staging.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, expect, test } from '@playwright/test';
import { BELAGGNING_EVENT_ID, HISTORY_PERSON_ID } from './fixtures';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const GET_EVENT_NOTES = '/functions/v1/get-event-notes';
const CREATE_EVENT_NOTE = '/functions/v1/create-event-note';
const GET_PERSON_NOTES = '/functions/v1/get-person-notes';
const CREATE_PERSON_NOTE = '/functions/v1/create-person-note';

function sentinelText(): string {
  return `ZZ-note-test+${randomUUID()}@sentinel`;
}

async function createEventNote(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  text: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${CREATE_EVENT_NOTE}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { eventId, text },
  });
  expect(res.status(), await res.text()).toBe(201);
  const body = (await res.json()) as { record: { id: string } };
  return body.record.id;
}

async function createPersonNote(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  personId: string,
  text: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${CREATE_PERSON_NOTE}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { personId, text },
  });
  expect(res.status(), await res.text()).toBe(201);
  const body = (await res.json()) as { record: { id: string } };
  return body.record.id;
}

test.describe('Anteckningar — Event/Person-isolation (S103, kritisk regressionsvakt)', () => {
  test('en PERSON-anteckning läcker inte in i ett events ström', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const personNoteId = await createPersonNote(
      request,
      config,
      jwt,
      HISTORY_PERSON_ID,
      sentinelText(),
    );

    const res = await request.get(
      `${config.baseUrl}${GET_EVENT_NOTES}?eventId=${encodeURIComponent(BELAGGNING_EVENT_ID)}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    expect(res.status()).toBe(200);
    const { notes } = (await res.json()) as { notes: { id: string }[] };

    const lackage = notes.find((n) => n.id === personNoteId);
    expect(
      lackage,
      'en person-anteckning ska ALDRIG dyka upp i get-event-notes svar',
    ).toBeUndefined();
  });

  test('en EVENT-anteckning läcker inte in i en persons ström', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const eventNoteId = await createEventNote(
      request,
      config,
      jwt,
      BELAGGNING_EVENT_ID,
      sentinelText(),
    );

    const res = await request.get(
      `${config.baseUrl}${GET_PERSON_NOTES}?personId=${encodeURIComponent(HISTORY_PERSON_ID)}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    expect(res.status()).toBe(200);
    const { notes } = (await res.json()) as { notes: { id: string }[] };

    const lackage = notes.find((n) => n.id === eventNoteId);
    expect(
      lackage,
      'en event-anteckning ska ALDRIG dyka upp i get-person-notes svar',
    ).toBeUndefined();
  });
});
