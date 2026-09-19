// TASK-451.4 runda 2 — api-pure (ren logik, ingen staging, inga creds, ingen
// browser, inget UI).
//
// VAD DENNA FIL ÄR TILL FÖR: att göra en LAGERÖVERSKRIDANDE invariant
// mekanisk i stället för nedskriven. Klientens tidsgräns per hämtning
// (`HAMTNINGENS_TIDSGRANS_MS`, src/data/utils.ts) ligger OVANPÅ Edge
// Function-lagret, som har sin EGEN Airtable-429-backoff
// (supabase/functions/_shared/airtable-retry.ts) kalibrerad mot Supabases
// 150 s idle timeout. Sätts klientgränsen under serverns backoff blir en
// läsning som SKULLE ha lyckats i stället ett fel, och ett manuellt omförsök
// landar inuti Airtables lockout-fönster och förlänger det.
//
// Det var precis vad skivans FÖRSTA omgång gjorde: `HAMTNINGENS_TIDSGRANS_MS`
// = 20 000 ms mot en 429-backoff vars GOLV är 30 000 ms. Granskningens runda 1
// fynd 1 (error/ask-user); Marcus beslut 2026-09-19: väg A, klientgränsen
// läggs ÖVER EF-lagrets tak.
//
// FORMEN ÄR POÄNGEN: testet HÄRLEDER serverns värsta väntan ur serverns EGNA
// konstanter via `airtable429BackoffMs` — det skriver ALDRIG av talet 112 500.
// Ändrar någon `AIRTABLE_429_BASE_WAIT_MS` eller `AIRTABLE_429_MAX_RETRIES`
// utan att ompröva klientgränsen FÄLLER denna fil. Samma härlednings-form som
// `tests/api/airtable-retry.test.ts` redan använder för serverns eget tak, och
// samma skäl som gör `airtable-retry.ts` medvetet Deno-fri: modulen ska gå att
// importera härifrån (se dess filhuvud § "Varför en egen modul").

import { expect, test } from '@playwright/test';
import {
  fetchWithRetry,
  HAMTNINGENS_TIDSGRANS_MS,
  medTidsgrans,
  TidsgransFel,
} from '../../src/data/utils';
import {
  AIRTABLE_429_BASE_WAIT_MS,
  AIRTABLE_429_MAX_RETRIES,
  airtable429BackoffMs,
} from '../../supabase/functions/_shared/airtable-retry';

/**
 * Supabase Edge Functions "Request idle timeout": plattformen avbryter en
 * funktion som inte hunnit skicka något svar och returnerar 504 Gateway
 * Timeout. https://supabase.com/docs/guides/functions/limits (verifierad
 * 2026-07-31 av TASK-53, återanvänd här).
 *
 * Namngiven konstant med avsikt: talet är EF-lagrets gräns, inte vår, och
 * `airtable-retry.ts` bygger sitt eget retry-tak på exakt samma tal. Samma
 * deklaration finns i `tests/api/airtable-retry.test.ts` — den filen låser
 * SERVERNS tak mot gränsen, denna låser KLIENTENS mot samma gräns.
 */
const EF_IDLE_TIMEOUT_MS = 150_000;

/**
 * Serverns värsta LEGITIMA väntan innan den ger upp på en 429, härledd ur
 * serverns egna konstanter.
 *
 * `random: () => 1` ger jitterns SUPREMUM: `Math.random()` returnerar [0, 1),
 * så den faktiska väntan är alltid strikt mindre än detta. Ett tak byggt på
 * supremum är alltså konservativt åt rätt håll.
 */
function varstaServer429VantanMs(): number {
  let summa = 0;
  for (let attempt = 0; attempt < AIRTABLE_429_MAX_RETRIES; attempt++) {
    summa += airtable429BackoffMs(attempt, () => 1);
  }
  return summa;
}

/**
 * Invarianten som helhet, som ett PREDIKAT över en godtycklig klientgräns —
 * så att den går att pröva i BÅDA riktningar (den ska falla för det gamla
 * talet, inte bara hålla för det nya).
 */
function invariantenHaller(klientGransMs: number): boolean {
  return klientGransMs > varstaServer429VantanMs() && klientGransMs > EF_IDLE_TIMEOUT_MS;
}

test.describe('Klientgränsen ligger över HELA serverlagrets legitima väntan', () => {
  test('HAMTNINGENS_TIDSGRANS_MS > serverns värsta 429-väntan, HÄRLEDD ur serverns konstanter', () => {
    const varsta = varstaServer429VantanMs();

    // Härledningen ska stämma med serverns egen dokumenterade siffra. Detta
    // är den ENDA platsen 112 500 nämns, och den är en KONTROLL av
    // härledningen — inte källan till den.
    expect(varsta).toBe(112_500);
    expect(varsta).toBeGreaterThanOrEqual(AIRTABLE_429_BASE_WAIT_MS);

    // KÄRNAN: klientgränsen får aldrig skära genom serverns återhämtning.
    // Airtables dokumenterade lockout är 30 s, så en läsning som möter 429
    // lyckas typiskt först efter ~32-38 s; ett klient-tak därunder gör en
    // lyckad hämtning till ett fel.
    expect(
      HAMTNINGENS_TIDSGRANS_MS,
      'klientens tidsgräns måste överstiga serverns värsta legitima 429-väntan',
    ).toBeGreaterThan(varsta);
  });

  test('HAMTNINGENS_TIDSGRANS_MS > EF:ens idle timeout (150 s) — servern hinner alltid svara först', () => {
    // Varje ärligt utfall anländer vid eller före ~150 s: antingen svarar
    // funktionen, eller så svarar plattformen 504. En klientgräns under det
    // talet gissar där servern strax hade gett ett riktigt svar.
    expect(HAMTNINGENS_TIDSGRANS_MS).toBeGreaterThan(EF_IDLE_TIMEOUT_MS);

    // Marginalen bär klientsidig overhead som EF:ens serverklocka inte mäter
    // (DNS, TLS, kö, uppladdning, kropps-läsningen i callEdgeFunction).
    expect(HAMTNINGENS_TIDSGRANS_MS - EF_IDLE_TIMEOUT_MS).toBeGreaterThanOrEqual(5_000);
  });

  test('...men UNDER två hela idle-cykler — budgeten får inte finansiera ett andra 150 s-försök', () => {
    // `fetchWithRetry` retryar 504 som vilket 5xx som helst (medvetet orört,
    // se dess egen kommentar). Efter en gateway-504 vid ~150 s är omförsöket
    // nästan säkert bortkastat: träffade vi idle timeouten på grund av en
    // Airtable-lockout pågår lockouten fortfarande. Budgeten är därför det
    // som sätter taket — den ska rymma EN hel cykel plus marginal, aldrig TVÅ.
    expect(
      HAMTNINGENS_TIDSGRANS_MS,
      'budgeten får inte rymma två hela EF-idle-cykler — då blir ett sent omförsök gratis',
    ).toBeLessThan(2 * EF_IDLE_TIMEOUT_MS);
  });

  test('TVÅSIDIGT: invarianten FÄLLER det gamla talet (20 000) och HÅLLER för det nuvarande', () => {
    // Utan detta fall vore de tre ovan bara "grönt i dag" — en invariant som
    // aldrig bevisats kunna falla är inte en grind. 20 000 är inte ett
    // påhittat motexempel: det är exakt värdet granskningen fällde.
    expect(invariantenHaller(20_000)).toBe(false);
    expect(invariantenHaller(HAMTNINGENS_TIDSGRANS_MS)).toBe(true);

    // ...och den fäller även ett tal som bara klarar den ena halvan: 120 000
    // ligger över serverns 429-väntan men UNDER EF:ens idle timeout.
    expect(invariantenHaller(120_000)).toBe(false);

    // Kontroll att de två halvorna verkligen är olika krav — hade
    // 429-väntan legat över idle timeouten vore serverns egen kalibrering
    // trasig, och denna fils första test hade fällt i stället.
    expect(varstaServer429VantanMs()).toBeLessThan(EF_IDLE_TIMEOUT_MS);
  });
});

test.describe('Gateway-504 → transport-omförsök → budgeten kapar det (uppdragets punkt 3)', () => {
  /**
   * En `fetch`-stub som svarar 504 på de `antal504` första anropen och sedan
   * HÄNGER (men respekterar `signal`, precis som en riktig `fetch`).
   *
   * DETERMINISTISKT UTAN VÄGGKLOCKE-MARGINAL: det hängande anropet kan bara
   * settla genom att signalen abortas, så utfallet beror inte på hur snabb
   * eller belastad maskinen är.
   */
  function gatewayTimeoutSedanHang(antal504: number): {
    impl: typeof fetch;
    anrop: () => number;
  } {
    let anrop = 0;
    const impl = ((_input: RequestInfo | URL, init?: RequestInit) => {
      anrop += 1;
      if (anrop <= antal504) {
        return Promise.resolve(new Response('upstream timeout', { status: 504 }));
      }
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) return;
        if (signal.aborted) {
          reject(signal.reason);
          return;
        }
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    }) as unknown as typeof fetch;
    return { impl, anrop: () => anrop };
  }

  test('ett 504 RETRYAS (regeln är orörd) — men det är budgeten, inte retry-räknaren, som avslutar', async () => {
    const { impl, anrop } = gatewayTimeoutSedanHang(1);
    const tidsgrans = medTidsgrans(undefined, 40);

    const fel = await fetchWithRetry(
      'https://exempel.invalid/get-registrations',
      { signal: tidsgrans.signal },
      { fetchImpl: impl, sleep: () => Promise.resolve() },
    ).then(
      () => null,
      (e: unknown) => e,
    );
    tidsgrans.stang();

    // Omförsöket SKEDDE — transportens 5xx-regel är medvetet oförändrad, för
    // ett snabbt 502/503/504 från kanten är precis det fall ett omförsök
    // löser. Vi kan inte skilja det fallet från ett idle-timeout-504 på
    // statusen ensam (transporten har ingen klocka).
    expect(anrop()).toBe(2);

    // ...och det var TIDSGRÄNSEN som avslutade sekvensen, inte maxRetries.
    // Hade budgeten varit ≥ 2 × idle timeout hade det sena omförsöket fått en
    // hel ny 150 s-cykel i stället för att kapas.
    expect(fel).toBeInstanceOf(TidsgransFel);
    expect((fel as TidsgransFel).tidsgransMs).toBe(40);
  });

  test('den kapade resten är liten mot en hel cykel — omförsöket får marginalen, inte 150 s till', () => {
    // Samma sak uttryckt i produktionens faktiska tal, utan att behöva vänta
    // 160 sekunder: när ett 504 kommer vid EF:ens idle timeout återstår bara
    // marginalen av budgeten, och den ska vara en bråkdel av en cykel.
    const restenEfterEnCykel = HAMTNINGENS_TIDSGRANS_MS - EF_IDLE_TIMEOUT_MS;

    expect(restenEfterEnCykel).toBeGreaterThan(0);
    expect(restenEfterEnCykel).toBeLessThan(EF_IDLE_TIMEOUT_MS / 2);
  });
});
