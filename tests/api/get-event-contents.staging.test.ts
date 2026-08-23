// get-event-contents — skarp conformance mot deployad staging-EF
// (TASK-309.7 AC #2, ADR-125 § 7). GLOBAL läs-lista över SAMTLIGA
// Eventinnehåll-rader (Mer-sidans Eventinnehåll-yta) — speglar
// get-event-formats global-läs-mönstret.
//
// Bevisar mot SKARP staging-data:
//   1. allow: GET → 200 + { eventinnehall: [...] }; varje rad bär rec-id,
//      namn, falt (de tolv nycklarna) och agenda (dag1/dag2-listor).
//      Den permanenta, verbatim-fyllda kombinationen ("Resor i medvetandet
//      1" × "Utbildning", data-model.md § Bilagornas datamodell) finns med
//      och bär en ICKE-TOM agenda för BÅDA dagarna (skiljer den från de sex
//      tomma seedade raderna — bevisar att agenda-hämtningen faktiskt
//      fungerar, inte bara att fältet existerar).
//   2. anon (ingen JWT) → 401.
//
// Auth via getValidUserJWT. Lokalt skip:as utan creds; skarpa beviset körs
// i CI (STAGING_REQUIRED=1).

import { expect, test } from '@playwright/test';
import { classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/get-event-contents';

// "Resor i medvetandet 1" × "Utbildning" — den ENDA av de sju kombinationerna
// fylld verbatim ur prototypens fixtur (data-model.md § Bilagornas
// datamodell, TASK-309.2). Samma rad `DOKUMENTUNDERLAG_EVENT_ID` slår upp
// via get-document-sources.
const FYLLD_KOMBINATION_ID = 'rec2MZrLMKWAzxarB';

test.describe('get-event-contents — skarp conformance (TASK-309.7)', () => {
  test('allow: GET → 200 + eventinnehall[] med falt+agenda; den fyllda kombinationen bär en icke-tom agenda', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as {
      eventinnehall: {
        id: string;
        namn: string;
        event: string | null;
        typ: string | null;
        falt: Record<string, string | null>;
        agenda: { dag1: unknown[]; dag2: unknown[] };
      }[];
    };
    expect(Array.isArray(body.eventinnehall)).toBe(true);
    // Sju kombinationer mätt READ-ONLY mot prod (data-model.md § Bilagornas
    // datamodell) — staging seedar samma sju.
    expect(body.eventinnehall.length).toBe(7);

    const FALT_KEYS = [
      'tid',
      'pris',
      'anmalningsavgift',
      'resterandeBelopp',
      'beskrivning',
      'forberedelser',
      'tagMed',
      'rokning',
      'parfym',
      'mat',
      'overnattning',
      'utrustning',
    ];
    for (const rad of body.eventinnehall) {
      expect(rad.id.startsWith('rec')).toBe(true);
      expect(typeof rad.namn).toBe('string');
      for (const key of FALT_KEYS) {
        const v = rad.falt[key];
        expect(v === null || typeof v === 'string').toBe(true);
      }
      expect(Array.isArray(rad.agenda.dag1)).toBe(true);
      expect(Array.isArray(rad.agenda.dag2)).toBe(true);
    }

    const fylld = body.eventinnehall.find((r) => r.id === FYLLD_KOMBINATION_ID);
    expect(
      fylld,
      'den fyllda kombinationen (Resor i medvetandet 1 × Utbildning) saknas',
    ).toBeTruthy();
    expect(fylld?.agenda.dag1.length ?? 0).toBeGreaterThan(0);
    expect(fylld?.agenda.dag2.length ?? 0).toBeGreaterThan(0);
    expect(fylld?.falt.beskrivning).toBeTruthy();
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.get(`${config.baseUrl}${ENDPOINT}`);
    await classify401Body(res);
  });
});
