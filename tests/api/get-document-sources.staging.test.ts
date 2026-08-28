// get-document-sources — conformance mot deployad staging-EF (TASK-309.2
// AC #4, ADR-125 § 2). LÄSER bara — ingen write/mutation.
//
// Bevisar standard/kopia-kontraktet i BÅDA riktningar mot EN permanent
// fixtur (DOKUMENTUNDERLAG_EVENT_ID, tests/api/fixtures.ts — se dess docblock
// för den fulla facit-tabellen): Tid/Pris är ÖVERSKRIVNA (kopia-hälften),
// Beskrivning/Adress är OSKRIVNA (standard-hälften), agendan har EN egen
// override-rad (agenda-kopia-hälften, hela-agendan-eller-inget-formen).
//
// Auth via getValidUserJWT — samma mönster som get-event.staging.test.ts.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { DocumentSourcesSchema } from '../../src/domain/schemas';
import { DOKUMENTUNDERLAG_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

async function callGetDocumentSources(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  eventId: string | undefined,
) {
  const query = eventId === undefined ? '' : `?eventId=${encodeURIComponent(eventId)}`;
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.get(`${config.baseUrl}/functions/v1/get-document-sources${query}`, { headers });
}

// Verbatim standardtext för "Resor i medvetandet 1 · Utbildning" — staging
// bär numera fetstilsmarkörer (**...**) kring nyckelorden, INSKRIVNA MED
// AVSIKT direkt i Airtable-basen (TASK-309.27, commit 9bb8d6be), verifierat
// live 2026-08-28 mot Eventinnehåll-raden rec2MZrLMKWAzxarB (Airtable
// apphjj8Q7lkXCMsL4). scripts/seed-eventinnehall-modell.mjs bär fortfarande
// den gamla omarkerade texten — en ny seed från grunden skulle återskapa
// DEN texten, inte denna (öppen skuld, TASK-333). Börjes-fragment räcker
// för att bevisa att STANDARDEN (inte kopian, som är null) kom med.
const FYLLD_BESKRIVNING_BORJAN =
  'Utbildningen **Resor i Medvetandet** kommer att ge dig en djupare insikt om medvetandet';

test.describe('get-document-sources — conformance (ADR-125 § 2, standard/kopia)', () => {
  test('fixturen (AC #4): kopia-hälften — Tid/Pris är överskrivna, INTE standarden', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetDocumentSources(request, config, jwt, DOKUMENTUNDERLAG_EVENT_ID);
    expect(res.status()).toBe(200);
    const body = DocumentSourcesSchema.parse(await res.json());

    expect(body.kopior.tid.kopia).toBe('ZZ-override-tid');
    expect(body.kopior.tid.standard).toBe('kl. 10:00 - 17:00'); // standarden finns kvar, kopian VINNER inte över den i svaret
    expect(body.kopior.pris.kopia).toBe('ZZ-override-pris');
    expect(body.kopior.pris.standard).toBe('2.500');
  });

  test('fixturen (AC #4): standard-hälften — Beskrivning/Adress saknar kopia, standarden når fram', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetDocumentSources(request, config, jwt, DOKUMENTUNDERLAG_EVENT_ID);
    expect(res.status()).toBe(200);
    const body = DocumentSourcesSchema.parse(await res.json());

    expect(body.kopior.beskrivning.kopia).toBeNull();
    expect(body.kopior.beskrivning.standard).not.toBeNull();
    expect(body.kopior.beskrivning.standard).toContain(FYLLD_BESKRIVNING_BORJAN);

    // Platsen (Rönninge) ger standard, ingen (bilagetext)-kopia satt på fixturen.
    expect(body.kopior.adress.kopia).toBeNull();
    expect(body.kopior.adress.standard).toBe('Uttringe Hages väg 17, Rönninge');
    expect(body.plats).not.toBeNull();
    expect(body.plats?.namn).toBe('Rönninge');
  });

  test('fixturen (AC #4): sista betalningsdag härleds Startdatum − 14 dagar när kopian saknas', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetDocumentSources(request, config, jwt, DOKUMENTUNDERLAG_EVENT_ID);
    expect(res.status()).toBe(200);
    const body = DocumentSourcesSchema.parse(await res.json());

    // Fixturens Startdatum = 2026-12-01 (fixtures.ts) → 2026-11-17.
    expect(body.event.startdatum).toBe('2026-12-01');
    expect(body.kopior.sistaBetalningsdag.standard).toBe('2026-11-17');
    expect(body.kopior.sistaBetalningsdag.kopia).toBeNull();
  });

  test('fixturen (AC #4): eventinnehall-metadata pekar på den uppslagna raden', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetDocumentSources(request, config, jwt, DOKUMENTUNDERLAG_EVENT_ID);
    expect(res.status()).toBe(200);
    const body = DocumentSourcesSchema.parse(await res.json());

    expect(body.eventinnehall).not.toBeNull();
    expect(body.eventinnehall?.namn).toBe('Resor i medvetandet 1 · Utbildning');
  });

  test('fixturen (AC #4): agendan — dag1-kopia finns (1 egen rad), dag2-kopia tom array (inte null); standard är de 14/16 seedade raderna', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetDocumentSources(request, config, jwt, DOKUMENTUNDERLAG_EVENT_ID);
    expect(res.status()).toBe(200);
    const body = DocumentSourcesSchema.parse(await res.json());

    // Standardagendan (Eventinnehåll → Agendapunkter) — dag1 seedad verbatim
    // ur prototypens dagEtt (GenereringsVy.tsx), oförändrad. Dag2 fick SEX
    // nya rader i Airtable-basen 2026-08-27 (Ordning 11-16, #2020s
    // beskrivning — MED AVSIKT, se seed-skriptets öppna skuld ovan/TASK-333),
    // 10 → 16, verifierat live mot Agendapunkter-tabellen (apphjj8Q7lkXCMsL4,
    // tblgEItD0UM1oJVI9) 2026-08-28.
    expect(body.agenda.dag1.standard.length).toBe(14);
    expect(body.agenda.dag2.standard.length).toBe(16);
    expect(body.agenda.dag1.standard[0]).toEqual({
      text: 'Miranon Media',
      tid: '',
      meditation: false,
    });
    // De sex nya raderna (Ordning 11-16) — sista sex elementen i dag2.standard.
    expect(body.agenda.dag2.standard.slice(10)).toEqual([
      { text: 'Tanke respektive medvetande', tid: '', meditation: false },
      { text: 'Meditation: Kristallvägen', tid: '41 min', meditation: true },
      { text: 'Upplevelser utanför verkligheten', tid: '', meditation: false },
      { text: 'Tid, Affirmationer, Altruism', tid: '', meditation: false },
      { text: 'Själshämtning', tid: '', meditation: false },
      { text: 'Meditation: Spegeln', tid: '40 min', meditation: true },
    ]);

    // Eventets egen kopia: EN rad, länkad via Event, Dag 1 → dag1-kopian bär
    // den, dag2-kopian är en TOM array (samma "har en kopia" som dag1, inte
    // null — se get-document-sources/index.ts § eventHarEgenAgenda).
    expect(body.agenda.dag1.kopia).not.toBeNull();
    expect(body.agenda.dag1.kopia).toHaveLength(1);
    expect(body.agenda.dag1.kopia?.[0]).toEqual({
      text: 'ZZ-egen-agendapunkt',
      tid: '10 min',
      meditation: false,
    });
    expect(body.agenda.dag2.kopia).not.toBeNull();
    expect(body.agenda.dag2.kopia).toHaveLength(0);
  });

  test('event utan Event (source)-värde → eventinnehall null, kopior faller tillbaka till null (ingen krasch)', async ({
    request,
  }) => {
    // Läser en BEFINTLIG, av annan testsvit ägd fixtur (ZZ-Checkin-fixtur,
    // get-attendance.staging.test.ts) READ-ONLY — get-document-sources
    // muterar aldrig, så det är säkert att dela. Fixturens `Event (source)`
    // är medvetet TOM (data-model.md § Kända fällor 52 — samma rad utan
    // eventlänk-klass), vilket gör den till ett bra "uppslaget missar"-fall
    // utan att en tredje fixtur behöver seedas.
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetDocumentSources(request, config, jwt, 'recPwJEj88Hj8C2gU');
    expect(res.status()).toBe(200);
    const body = DocumentSourcesSchema.parse(await res.json());

    expect(body.event.eventNamn).toBeNull();
    expect(body.eventinnehall).toBeNull();
    expect(body.kopior.tid.standard).toBeNull();
    expect(body.kopior.tid.kopia).toBeNull();
  });

  test('okänt ID → 404 + body { error } (mall-kontraktet, ärvt från get-event)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetDocumentSources(request, config, jwt, 'recZZZZZZZZZZZZZZ');

    expect(res.status()).toBe(404);
    const body = (await res.json()) as { error?: unknown };
    expect(typeof body.error).toBe('string');
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await callGetDocumentSources(request, config, undefined, DOKUMENTUNDERLAG_EVENT_ID);
    await classify401Body(res);
  });

  test('saknat eventId-param → 400 { error: "Missing eventId" }', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetDocumentSources(request, config, jwt, undefined);

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: unknown };
    expect(body.error).toBe('Missing eventId');
  });
});
