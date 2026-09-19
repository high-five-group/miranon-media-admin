// TASK-451.4 — api-pure (ren logik, ingen staging, inga creds, ingen browser,
// inget UI). Regressionstest för tidsgränsen per hämtning och för att ett
// AVBRUTET anrop aldrig retryas
// (docs/research/kallstarten-diagnoskarta-2026-09-18.md § 1.7 + § 6 punkt 5).
//
// ── RÖTT-FÖRST, exakt vad som fälldes ────────────────────────────────────────
//
// FÖRE denna skiva fanns ingen `AbortController` någonstans i klienten
// (`src/data/utils.ts` var 65 rader och nämnde aldrig `signal`). En Edge
// Function som aldrig svarade hängde tills webbläsarens egen socket-timeout.
// `HANGER_EVIGT`-testet nedan är beviset: samma stub, samma `fetchWithRetry`,
// men UTAN tidsgränsens signal settlar anropet aldrig — mätt som en race mot
// en vaktklocka, inte påstått.
//
// Testerna kör mot `medTidsgrans` + `fetchWithRetry` DIREKT i stället för via
// `callEdgeFunction`, av samma hermetiska skäl som
// `hem-delad-hamtning.test.ts`s filhuvud bokför: `supabase-client.ts`
// importerar `@/env`, som läser `import.meta.env` vid modul-laddning, och
// `tsconfig.tests.json` sätter medvetet `"types": ["node"]` utan
// `vite/client`. `utils.ts` importerar ingenting alls — säker att importera
// härifrån. Det är också den RÄTTA mätpunkten: `callEdgeFunction` är ren
// ledningsdragning (den bygger signalen och skickar den vidare), medan
// mekaniken som faktiskt kan gå sönder bor i de två funktionerna nedan.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import {
  fetchWithRetry,
  HAMTNINGENS_TIDSGRANS_MS,
  medTidsgrans,
  TidsgransFel,
} from '../../src/data/utils';

/** Vaktklocka: resolvar med `'VAKT'` efter `ms`. Används för att MÄTA att
 * något aldrig settlar, i stället för att påstå det. */
function vakt(ms: number): Promise<'VAKT'> {
  return new Promise((resolve) => setTimeout(() => resolve('VAKT'), ms));
}

/**
 * En `fetch`-stub som ALDRIG svarar — men som respekterar `signal` precis som
 * en riktig `fetch` gör (WHATWG Fetch § "abort fetch": begäran avvisas med
 * signalens abort-reason). Räknar sina anrop så retry-beteendet blir mätbart.
 */
function hangandeFetch(): { impl: typeof fetch; anrop: () => number } {
  let anrop = 0;
  const impl = ((_input: RequestInfo | URL, init?: RequestInit) => {
    anrop += 1;
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) return; // ingen signal ⇒ hänger för evigt (det GAMLA beteendet)
      if (signal.aborted) {
        reject(signal.reason);
        return;
      }
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  }) as unknown as typeof fetch;
  return { impl, anrop: () => anrop };
}

test.describe('AC #1 — en EF som aldrig svarar avbryts vid en config-satt gräns', () => {
  test('RÖTT-FÖRST-BEVISET: utan tidsgränsens signal settlar anropet ALDRIG', async () => {
    const { impl } = hangandeFetch();

    // Exakt det gamla anropet: `fetchWithRetry(url, { headers })` — inget
    // `signal`-fält fanns i `callEdgeFunction`s init före denna skiva.
    const utan = fetchWithRetry('https://exempel.invalid/get-events', {}, { fetchImpl: impl });

    const utfall = await Promise.race([
      utan.then(
        () => 'SETTLADE' as const,
        () => 'SETTLADE' as const,
      ),
      vakt(300),
    ]);

    // Detta ÄR buggen kortet beskriver, mätt: anropet hänger obegränsat.
    expect(utfall).toBe('VAKT');
  });

  test('med tidsgräns: anropet avbryts, kastar TidsgransFel och bär gränsen i felet', async () => {
    const { impl, anrop } = hangandeFetch();
    const tidsgrans = medTidsgrans(undefined, 50);

    const start = Date.now();
    const fel = await fetchWithRetry(
      'https://exempel.invalid/get-events',
      { signal: tidsgrans.signal },
      { fetchImpl: impl },
    ).then(
      () => null,
      (e: unknown) => e,
    );
    const varaktighet = Date.now() - start;
    tidsgrans.stang();

    expect(fel).toBeInstanceOf(TidsgransFel);
    expect((fel as TidsgransFel).tidsgransMs).toBe(50);
    // Fälld PÅ TID, inte efter att ha gett upp på något annat sätt.
    expect(varaktighet).toBeLessThan(2000);
    // AC #3-halvan: ett avbrutet anrop retryas ALDRIG. Hade transportlagret
    // retryat på abort hade talet blivit 4 (maxRetries 3 + första försöket),
    // och värsta väggtiden 4 x tidsgränsen i stället för 1 x.
    expect(anrop()).toBe(1);
  });

  test('felet är ett ÄKTA fel (inte en tyst resolve) — det som gör att warmup räknar det som misslyckat', async () => {
    // TASK-451.2-kontraktet: `misslyckade` ökar i `kor()`s reject-gren. Ett
    // avbrott måste därför REJECT:a hela vägen upp, inte resolva till
    // undefined. Mäts som ett kastat Error med läsbart meddelande.
    const { impl } = hangandeFetch();
    const tidsgrans = medTidsgrans(undefined, 30);

    await expect(
      fetchWithRetry(
        'https://exempel.invalid/get-events',
        { signal: tidsgrans.signal },
        {
          fetchImpl: impl,
        },
      ),
    ).rejects.toThrow(/avbröts/);

    tidsgrans.stang();
  });
});

test.describe('AC #2 — tidsgränsen är kopplad till TanStack Querys signal', () => {
  test('en query-cancel (yttre signal) fäller anropet, och reason bevaras ORÖRD', async () => {
    const { impl, anrop } = hangandeFetch();
    // Speglar TanStack Querys egen `AbortController` i `Query#fetch()`
    // (källäst, query-core 5.102.2 `query.js`: en controller per fetch-cykel,
    // exponerad som `signal` på queryFn-kontexten).
    const queryStyrning = new AbortController();
    const tidsgrans = medTidsgrans(queryStyrning.signal, 60_000);

    const loftet = fetchWithRetry(
      'https://exempel.invalid/get-events',
      { signal: tidsgrans.signal },
      { fetchImpl: impl },
    );

    const cancelSkal = new Error('query avbruten av TanStack');
    queryStyrning.abort(cancelSkal);

    const fel = await loftet.then(
      () => null,
      (e: unknown) => e,
    );
    tidsgrans.stang();

    // Reason vidarebefordras orörd (samma semantik MDN beskriver för
    // AbortSignal.any: "the reason of the first signal that is aborted") —
    // en query-cancel ser fortfarande ut som en query-cancel nedströms, och
    // förväxlas ALDRIG med vår egen tidsgräns.
    expect(fel).toBe(cancelSkal);
    expect(fel).not.toBeInstanceOf(TidsgransFel);
    expect(anrop()).toBe(1);
  });

  test('en REDAN avbruten yttre signal fäller innan något nätverksanrop görs', async () => {
    const { impl, anrop } = hangandeFetch();
    const queryStyrning = new AbortController();
    queryStyrning.abort(new Error('avbruten innan start'));

    const tidsgrans = medTidsgrans(queryStyrning.signal, 60_000);
    expect(tidsgrans.signal.aborted).toBe(true);

    await expect(
      fetchWithRetry(
        'https://exempel.invalid/get-events',
        { signal: tidsgrans.signal },
        {
          fetchImpl: impl,
        },
      ),
    ).rejects.toThrow(/avbruten innan start/);

    // NOLL anrop: kontrollen i loopens början fäller före första fetchen.
    expect(anrop()).toBe(0);
    tidsgrans.stang();
  });

  test('tidsgränsen vinner när den yttre signalen aldrig fyrar', async () => {
    const { impl } = hangandeFetch();
    const queryStyrning = new AbortController(); // abortas aldrig
    const tidsgrans = medTidsgrans(queryStyrning.signal, 40);

    const fel = await fetchWithRetry(
      'https://exempel.invalid/get-events',
      { signal: tidsgrans.signal },
      { fetchImpl: impl },
    ).then(
      () => null,
      (e: unknown) => e,
    );
    tidsgrans.stang();

    expect(fel).toBeInstanceOf(TidsgransFel);
  });
});

test.describe('Tidsgränsen stör INTE anrop som hinner klart', () => {
  test('ett snabbt svar passerar orört, och stang() släcker timern', async () => {
    let anrop = 0;
    const impl = ((_i: RequestInfo | URL, _init?: RequestInit) => {
      anrop += 1;
      return Promise.resolve(new Response('{"ok":true}', { status: 200 }));
    }) as unknown as typeof fetch;

    const tidsgrans = medTidsgrans(undefined, 50);
    const res = await fetchWithRetry(
      'https://exempel.invalid/x',
      { signal: tidsgrans.signal },
      {
        fetchImpl: impl,
      },
    );
    tidsgrans.stang();

    expect(res.status).toBe(200);
    expect(anrop).toBe(1);

    // Timern är släckt: signalen abortas ALDRIG, inte ens långt efter att
    // tidsgränsen skulle ha löpt ut. Utan `clearTimeout` i `stang()` hade
    // varje snabbt anrop ändå hållit en timer hela gränsen ut (skälet att
    // `AbortSignal.timeout()` valdes bort — se `medTidsgrans`s docblock).
    await vakt(120);
    expect(tidsgrans.signal.aborted).toBe(false);
  });

  test('5xx retryas fortfarande, och ALLA fyra försöken delar EN OCH SAMMA budget', async () => {
    // [Runda 2, granskningens info-fynd 10] Titeln löd tidigare "...ryms i EN
    // tidsgräns (budgeten är per anrop, inte per försök)", men de två
    // assertionerna (status 200, anrop 4) mätte ingenting om budgeten — med
    // injicerad, momentan `sleep` ryms fyra försök i vilken gräns som helst.
    // Egenskapen mäts nu direkt, och deterministiskt: alla försök får SAMMA
    // signalinstans, alltså samma timer. En budget PER FÖRSÖK hade krävt en ny
    // signal per varv, och värsta väggtiden blivit 4 × gränsen i stället för
    // 1 × — exakt det `fetchWithRetry` läser `init?.signal` EN gång utanför
    // loopen för att förhindra.
    let anrop = 0;
    const settSignal: Array<AbortSignal | null | undefined> = [];
    const impl = ((_i: RequestInfo | URL, init?: RequestInit) => {
      anrop += 1;
      settSignal.push(init?.signal);
      // Lyckas på fjärde försöket — bevisar att transportlagrets retry lever
      // kvar oförändrat under tidsgränsen.
      return Promise.resolve(
        anrop < 4 ? new Response('fel', { status: 503 }) : new Response('{}', { status: 200 }),
      );
    }) as unknown as typeof fetch;

    const tidsgrans = medTidsgrans(undefined, 5000);
    const res = await fetchWithRetry(
      'https://exempel.invalid/x',
      { signal: tidsgrans.signal },
      { fetchImpl: impl, sleep: () => Promise.resolve() },
    );
    tidsgrans.stang();

    expect(res.status).toBe(200);
    expect(anrop).toBe(4); // maxRetries 3 + första försöket — transportens tak
    expect(settSignal).toHaveLength(4);
    for (const signal of settSignal) {
      expect(signal).toBe(tidsgrans.signal);
    }
  });

  test('4xx retryas ALDRIG av transportlagret (AC #4:s mekanik, oberoende av query-lagret)', async () => {
    let anrop = 0;
    const impl = ((_i: RequestInfo | URL, _init?: RequestInit) => {
      anrop += 1;
      return Promise.resolve(new Response('{"error":"utgången session"}', { status: 401 }));
    }) as unknown as typeof fetch;

    const tidsgrans = medTidsgrans(undefined, 5000);
    const res = await fetchWithRetry(
      'https://exempel.invalid/x',
      { signal: tidsgrans.signal },
      {
        fetchImpl: impl,
      },
    );
    tidsgrans.stang();

    expect(res.status).toBe(401);
    // ETT anrop. Det är regeln AC #4 kräver, och den är inbyggd i
    // transporten — inte beroende av att någon kommer ihåg en `noRetryOn4xx`
    // vid varje anropsställe.
    expect(anrop).toBe(1);
  });
});

test.describe('Värdet bor på ETT ställe (AC #2)', () => {
  test('HAMTNINGENS_TIDSGRANS_MS ÄR defaulten när ingen gräns anges, och ligger över warmup-gatens 9 s', () => {
    // [Runda 2, granskningens info-fynd 10] Fram till runda 2 var den enda
    // assertion som rörde defaulten `expect(medTidsgrans().signal.aborted)
    // .toBe(false)` — sant för VILKET tal som helst, alltså en titel som lovade
    // mer än den mätte. `Tidsgrans.tidsgransMs` finns just för att göra
    // defaulten mätbar: nu asserteras den faktiskt.
    const utanArgument = medTidsgrans();
    expect(utanArgument.tidsgransMs).toBe(HAMTNINGENS_TIDSGRANS_MS);
    expect(utanArgument.signal.aborted).toBe(false);
    utanArgument.stang();

    // Tvåsidigt: ett UTTRYCKLIGT argument vinner över defaulten, så fältet
    // speglar den gräns som faktiskt gäller och inte bara konstanten.
    const medArgument = medTidsgrans(undefined, 50);
    expect(medArgument.tidsgransMs).toBe(50);
    medArgument.stang();

    // Den bärande invarianten mot ADR-112 beslut 3: per-hämtnings-gränsen
    // MÅSTE ligga över startvärmningens hårda 9 s-gate. Vore den lägre skulle
    // den kapa just de hämtningar som i dag landar EFTER timeout-släppet och
    // fyller Hem — alltså göra Hem sämre, inte bättre.
    expect(HAMTNINGENS_TIDSGRANS_MS).toBeGreaterThan(9000);

    // DET SOM STOD HÄR FÖRE RUNDA 2: `toBeGreaterThan(14_088)`, alltså den
    // värsta latens som mätts i kodbasen. Det skyddsräcket är FLYTTAT, inte
    // struket — och skälet är granskningens fynd 1: normal-latens (även
    // "värsta mätta") är fel härledningsgrund för en tidsgräns som ligger
    // ovanpå ett Edge Function-lager med egen 429-backoff. De BINDANDE
    // invarianterna (mot serverns värsta 429-väntan och mot EF:ens 150 s idle
    // timeout) är härledda ur serverns egna konstanter och bor i
    // `tests/api/tidsgrans-mot-serverlagret.test.ts`. Att duplicera ett
    // strikt svagare tak här hade bara gett två ställen att glida isär.
  });
});

test.describe('SKRIVVÄGEN bär ingen tidsgräns, och det är vaktat (granskningens fynd 5)', () => {
  // `postEdgeFunction` bär ett uttryckligt säkerhetsbeslut: INGEN tidsgräns,
  // ingen signal. Skälet står i dess docblock — en avbruten SKRIVNING kan
  // redan ha genomförts i Airtable, så ett klient-sidigt avbrott kan ge
  // dubbla betalningsrader eller dubbla utskick. Fram till runda 2 bars det
  // beslutet ENBART av prosa: lade någon till `signal: medTidsgrans().signal`
  // på skrivvägen föll ingen grind.
  //
  // Källkods-nivå av samma skäl som `mutation-hemvist-vakt.test.ts` och
  // `ef-metod-vakt.test.ts`: egenskapen ("funktionen bär ingen signal") är en
  // egenskap hos KÄLLAN, den mäts träffsäkrast där, och `supabase-client.ts`
  // går inte att importera i api-pure (den drar in `@/env`, som läser
  // `import.meta.env` vid modul-load medan `tsconfig.tests.json` medvetet
  // saknar `vite/client`).
  const REPO_ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const KLIENT_FIL = path.join(REPO_ROT, 'src', 'data', 'config', 'supabase-client.ts');

  /** Plockar ut EN exporterad funktions kropp ur källan — signaturen till och
   * med den avslutande `}` i kolumn 0. Docblocket ovanför ingår ALDRIG, vilket
   * är hela poängen: prosan NÄMNER tidsgränsen, koden ska inte bära den. */
  function funktionskropp(kalla: string, namn: string): string {
    const start = kalla.search(new RegExp(`^export async function ${namn}\\b`, 'm'));
    if (start === -1) throw new Error(`hittade ingen export async function ${namn} i källan`);
    const resten = kalla.slice(start);
    const slut = resten.search(/^\}$/m);
    if (slut === -1) throw new Error(`hittade ingen avslutande rad för ${namn}`);
    return resten.slice(0, slut + 1);
  }

  test('postEdgeFunction bär varken signal, medTidsgrans eller AbortController', () => {
    const kalla = readFileSync(KLIENT_FIL, 'utf8');
    const kropp = funktionskropp(kalla, 'postEdgeFunction');

    // POSITIV KONTROLL FÖRST — utan den kan hela testet passera tomt om
    // extraktionen går sönder (en tom sträng innehåller inte heller "signal").
    expect(kropp).toContain('fetchWithRetry(');
    expect(kropp).toContain("method: 'POST'");

    expect(kropp, 'skrivvägen får inte bära en AbortSignal').not.toContain('signal');
    expect(kropp, 'skrivvägen får inte bygga en tidsgräns').not.toContain('medTidsgrans');
    expect(kropp, 'skrivvägen får inte bygga en egen AbortController').not.toContain('Abort');
  });

  test('...medan LÄSVÄGEN gör det — tvåsidigt, så vakten bevisligen diskriminerar', () => {
    const kalla = readFileSync(KLIENT_FIL, 'utf8');
    const kropp = funktionskropp(kalla, 'callEdgeFunction');

    // Samma extraktion, motsatt utfall. Faller detta är det vakten som är
    // trasig, inte skrivvägen — skillnaden är värd att kunna läsa direkt.
    expect(kropp).toContain('medTidsgrans(options?.signal)');
    expect(kropp).toContain('signal: tidsgrans.signal');
    expect(kropp).toContain('tidsgrans.stang()');
  });
});
