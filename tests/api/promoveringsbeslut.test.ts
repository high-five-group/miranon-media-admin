// Promoveringsbeslutet + ersätt-uppslagets val + Storage-kopieringens
// anropsform (TASK-340.1, PRD `TASK-340` § A + E) — api-pure: ren logik,
// ingen staging, inga creds, inget nätverk.
//
// TESTAR PRODUKTIONSKODEN, INTE EN KOPIA. Det är möjligt därför att
// `_shared/promoveringsbeslut.ts` och `_shared/storage-kopiera.ts`
// importerar INGENTING — hade de rört `_shared/attachments.ts` (som
// importerar zod från `esm.sh`) vore de omöjliga att importera från Node
// (`ERR_UNSUPPORTED_ESM_URL_SCHEME`, empiriskt belagt i TASK-309.22, se
// `tests/api/attachment-filename.test.ts`s filhuvud). Beroendefriheten är
// alltså ett testbarhetskrav, inte en stilfråga.
//
// VARFÖR DESSA FALL, OCH INTE FLER: de fyra promoveringsutfallen är
// uttömmande (hash saknas · hash skiljer · utkast saknas · likhet), och
// AC #2:s krav — "ogiltig/felaktig hash → verifieras server-side, aldrig
// promovering av fel underlag" — bevisas i BÅDA sina former: ett VÄLFORMAT
// men felaktigt värde ger rendering (aldrig promovering), och ett
// MISSFORMAT värde avvisas av formvakten `arKanoniskKallhash` som EF:en
// 400:ar på. Storage-kopieringens fall bevisar den enda egenskap som
// motiverade att den skrevs för hand i stället för via storage-js:
// `x-upsert`-headern.

import { expect, test } from '@playwright/test';
import {
  arKanoniskKallhash,
  beslutaPromovering,
  valjErsattKandidat,
} from '../../supabase/functions/_shared/promoveringsbeslut';
import { kopieraInomBucket } from '../../supabase/functions/_shared/storage-kopiera';

/** Två distinkta, kanoniska SHA-256-hexar (64 tecken, gemener). */
const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

test.describe('arKanoniskKallhash — formvakten', () => {
  test('accepterar exakt 64 hex-tecken i gemener', () => {
    expect(arKanoniskKallhash(HASH_A)).toBe(true);
    expect(
      arKanoniskKallhash('66ffac80c5fca8696e0c161f31f75793d308d16002110c1c99fe8a490b9a16f9'),
    ).toBe(true);
  });

  test('avvisar VERSALER — `berakaKallhash` producerar aldrig sådana', () => {
    expect(arKanoniskKallhash('A'.repeat(64))).toBe(false);
  });

  test('avvisar fel längd (63 och 65) och icke-hex-tecken', () => {
    expect(arKanoniskKallhash('a'.repeat(63))).toBe(false);
    expect(arKanoniskKallhash('a'.repeat(65))).toBe(false);
    expect(arKanoniskKallhash(`${'a'.repeat(63)}g`)).toBe(false);
  });

  test('avvisar allt som inte är en sträng', () => {
    for (const varde of [null, undefined, 0, 1, true, false, {}, [], [HASH_A]]) {
      expect(arKanoniskKallhash(varde)).toBe(false);
    }
  });
});

test.describe('beslutaPromovering — de fyra utfallen (PRD § A)', () => {
  test('LIKHET + utkast finns → PROMOVERA, inget besked om ändrat underlag', () => {
    const beslut = beslutaPromovering({
      angivenKallhash: HASH_A,
      serverKallhash: HASH_A,
      utkastFinns: true,
    });
    expect(beslut).toEqual({ promovera: true, underlagAndrat: false, skal: 'hash-matchar' });
  });

  test('SKILLNAD → RENDERA + underlagAndrat (aldrig promovering av fel underlag)', () => {
    const beslut = beslutaPromovering({
      angivenKallhash: HASH_B,
      serverKallhash: HASH_A,
      utkastFinns: true,
    });
    expect(beslut).toEqual({ promovera: false, underlagAndrat: true, skal: 'hash-skiljer' });
  });

  test('SKILLNAD väger TYNGRE än ett saknat utkast — ordningen är medveten', () => {
    // Ett ändrat underlag ÄR nyheten Lotta behöver ("förhandsgranska gärna
    // igen"). Att tysta den till `inget-utkast` bara för att utkastet också
    // hann försvinna hade dolt den enda faktiska upplysningen.
    const beslut = beslutaPromovering({
      angivenKallhash: HASH_B,
      serverKallhash: HASH_A,
      utkastFinns: false,
    });
    expect(beslut.skal).toBe('hash-skiljer');
    expect(beslut.underlagAndrat).toBe(true);
  });

  test('LIKHET men utkastet saknas → RENDERA TYST (degradering, aldrig fel)', () => {
    const beslut = beslutaPromovering({
      angivenKallhash: HASH_A,
      serverKallhash: HASH_A,
      utkastFinns: false,
    });
    expect(beslut).toEqual({ promovera: false, underlagAndrat: false, skal: 'inget-utkast' });
  });

  test('INGEN hash angiven → RENDERA TYST, oavsett om utkastet finns', () => {
    for (const utkastFinns of [true, false]) {
      const beslut = beslutaPromovering({
        angivenKallhash: null,
        serverKallhash: HASH_A,
        utkastFinns,
      });
      expect(beslut).toEqual({
        promovera: false,
        underlagAndrat: false,
        skal: 'ingen-hash-angiven',
      });
    }
  });

  test('ETT tecken i skillnad räcker — jämförelsen är exakt, aldrig prefix', () => {
    const nastanA = `${HASH_A.slice(0, 63)}b`;
    const beslut = beslutaPromovering({
      angivenKallhash: nastanA,
      serverKallhash: HASH_A,
      utkastFinns: true,
    });
    expect(beslut.promovera).toBe(false);
    expect(beslut.skal).toBe('hash-skiljer');
  });

  test('MISSFORMAD angiven hash kastar — formen valideras vid HTTP-gränsen, inte här', () => {
    expect(() =>
      beslutaPromovering({
        angivenKallhash: 'inte-en-hash',
        serverKallhash: HASH_A,
        utkastFinns: true,
      }),
    ).toThrow(TypeError);
  });

  test('MISSFORMAD serverhash kastar — det vore ett programmeringsfel, aldrig ett klientfel', () => {
    expect(() =>
      beslutaPromovering({
        angivenKallhash: HASH_A,
        serverKallhash: 'FEL',
        utkastFinns: true,
      }),
    ).toThrow(TypeError);
  });
});

test.describe('valjErsattKandidat — ersätt-uppslagets val (PRD § E)', () => {
  test('tom mängd → null (ingen rad att ersätta ⇒ ny rad skapas)', () => {
    expect(valjErsattKandidat([])).toBeNull();
  });

  test('en rad → den raden', () => {
    const rad = { id: 'recA', skapad: '2026-08-29T08:00:00.000Z' };
    expect(valjErsattKandidat([rad])).toBe(rad);
  });

  test('flera rader → den NYASTE (den Lotta faktiskt ser i listan)', () => {
    // Listan sorterar nyast först (`get-event-attachments`) och
    // `grupperaPerNamn` visar `lista[0]` — så den nyaste raden ÄR den synliga.
    const rader = [
      { id: 'recGammal', skapad: '2026-08-29T07:48:38.269Z' },
      { id: 'recNyast', skapad: '2026-08-29T08:20:59.590Z' },
      { id: 'recMitten', skapad: '2026-08-29T08:00:22.416Z' },
    ];
    expect(valjErsattKandidat(rader)?.id).toBe('recNyast');
  });

  test('rader UTAN Skapad sorteras sist — en daterad rad vinner alltid', () => {
    const rader = [
      { id: 'recUtanDatum', skapad: null },
      { id: 'recMedDatum', skapad: '2020-01-01T00:00:00.000Z' },
    ];
    expect(valjErsattKandidat(rader)?.id).toBe('recMedDatum');
  });

  test('bara odaterade rader → fortfarande ett deterministiskt val (id fallande)', () => {
    const rader = [
      { id: 'recA', skapad: null },
      { id: 'recZ', skapad: null },
      { id: 'recM', skapad: null },
    ];
    expect(valjErsattKandidat(rader)?.id).toBe('recZ');
  });

  test('EXAKT lika Skapad → record-ID fallande som andra nyckel, aldrig Airtables returordning', () => {
    const tid = '2026-08-29T08:20:59.590Z';
    const framat = valjErsattKandidat([
      { id: 'recA', skapad: tid },
      { id: 'recB', skapad: tid },
    ]);
    const bakat = valjErsattKandidat([
      { id: 'recB', skapad: tid },
      { id: 'recA', skapad: tid },
    ]);
    expect(framat?.id).toBe('recB');
    expect(bakat?.id).toBe('recB');
  });

  test('indatan muteras ALDRIG', () => {
    const rader = [
      { id: 'recGammal', skapad: '2020-01-01T00:00:00.000Z' },
      { id: 'recNy', skapad: '2026-01-01T00:00:00.000Z' },
    ];
    const fore = rader.map((r) => r.id);
    valjErsattKandidat(rader);
    expect(rader.map((r) => r.id)).toEqual(fore);
  });

  test('bär anroparens egna extrafält vidare (samma objekt, inte en kopia)', () => {
    const rad = { id: 'recA', skapad: '2026-01-01T00:00:00.000Z', lagringsnyckel: 'x.pdf' };
    expect(valjErsattKandidat([rad])).toBe(rad);
  });
});

test.describe('kopieraInomBucket — anropsformen mot Storage-API:t', () => {
  interface FangatAnrop {
    url: string;
    method?: string;
    headers: Record<string, string>;
    body: unknown;
  }

  function fejkFetch(
    svar: { status: number; body: string },
    fangat: FangatAnrop[],
  ): typeof globalThis.fetch {
    return (async (input: unknown, init?: RequestInit) => {
      fangat.push({
        url: String(input),
        method: init?.method,
        headers: (init?.headers ?? {}) as Record<string, string>,
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });
      return new Response(svar.body, { status: svar.status });
    }) as unknown as typeof globalThis.fetch;
  }

  const LYCKAT_SVAR = JSON.stringify({
    Key: 'bilagor/recEV/uuid-bekraftelsebilaga.pdf',
    name: 'recEV/uuid-bekraftelsebilaga.pdf',
    metadata: { size: 248_311, mimetype: 'application/pdf' },
  });

  test('POST:ar till /storage/v1/object/copy med x-upsert: true och rätt kropp', async () => {
    // x-upsert ÄR hela skälet till att detta anrop inte går via storage-js:
    // SDK:ns `copy()` sätter aldrig headern, och en BEFINTLIG destination ger
    // då 409 (mätt mot staging 2026-08-29). Ersatt-vägens destination finns
    // alltid — därav måste headern vara med.
    const fangat: FangatAnrop[] = [];
    const resultat = await kopieraInomBucket({
      supabaseUrl: 'https://exempel.supabase.co',
      serviceRoleKey: 'sr-nyckel',
      bucket: 'bilagor',
      franPath: 'utkast/recEV/bilaga.pdf',
      tillPath: 'recEV/uuid-bekraftelsebilaga.pdf',
      forvantadStorlek: 248_311,
      fetchImpl: fejkFetch({ status: 200, body: LYCKAT_SVAR }, fangat),
    });

    expect(fangat).toHaveLength(1);
    expect(fangat[0].url).toBe('https://exempel.supabase.co/storage/v1/object/copy');
    expect(fangat[0].method).toBe('POST');
    expect(fangat[0].headers['x-upsert']).toBe('true');
    expect(fangat[0].headers.Authorization).toBe('Bearer sr-nyckel');
    expect(fangat[0].headers.apikey).toBe('sr-nyckel');
    expect(fangat[0].body).toEqual({
      bucketId: 'bilagor',
      sourceKey: 'utkast/recEV/bilaga.pdf',
      destinationKey: 'recEV/uuid-bekraftelsebilaga.pdf',
    });
    expect(resultat).toEqual({
      nyckel: 'bilagor/recEV/uuid-bekraftelsebilaga.pdf',
      storlek: 248_311,
      storlekFranServern: true,
    });
  });

  test('avslutande snedstreck i supabaseUrl dubblerar inte sökvägen', async () => {
    const fangat: FangatAnrop[] = [];
    await kopieraInomBucket({
      supabaseUrl: 'https://exempel.supabase.co/',
      serviceRoleKey: 'sr',
      bucket: 'bilagor',
      franPath: 'a',
      tillPath: 'b',
      forvantadStorlek: 1,
      fetchImpl: fejkFetch({ status: 200, body: LYCKAT_SVAR }, fangat),
    });
    expect(fangat[0].url).toBe('https://exempel.supabase.co/storage/v1/object/copy');
  });

  test('icke-2xx kastar med statuskod OCH serverns kropp i meddelandet', async () => {
    const fangat: FangatAnrop[] = [];
    await expect(
      kopieraInomBucket({
        supabaseUrl: 'https://exempel.supabase.co',
        serviceRoleKey: 'sr',
        bucket: 'bilagor',
        franPath: 'a',
        tillPath: 'b',
        forvantadStorlek: 1,
        fetchImpl: fejkFetch(
          { status: 404, body: '{"error":"not_found","message":"Object not found"}' },
          fangat,
        ),
      }),
    ).rejects.toThrow(/404.*Object not found/s);
  });

  test('saknad/ogiltig storlek i svaret → källans kända storlek används, aldrig ett gissat tal', async () => {
    const fangat: FangatAnrop[] = [];
    const utanStorlek = await kopieraInomBucket({
      supabaseUrl: 'https://exempel.supabase.co',
      serviceRoleKey: 'sr',
      bucket: 'bilagor',
      franPath: 'a',
      tillPath: 'b',
      forvantadStorlek: 4711,
      fetchImpl: fejkFetch({ status: 200, body: JSON.stringify({ Key: 'bilagor/b' }) }, fangat),
    });
    expect(utanStorlek).toEqual({ nyckel: 'bilagor/b', storlek: 4711, storlekFranServern: false });

    const ickeNumerisk = await kopieraInomBucket({
      supabaseUrl: 'https://exempel.supabase.co',
      serviceRoleKey: 'sr',
      bucket: 'bilagor',
      franPath: 'a',
      tillPath: 'b',
      forvantadStorlek: 4711,
      fetchImpl: fejkFetch(
        { status: 200, body: JSON.stringify({ Key: 'bilagor/b', metadata: { size: '17' } }) },
        fangat,
      ),
    });
    expect(ickeNumerisk.storlek).toBe(4711);
    expect(ickeNumerisk.storlekFranServern).toBe(false);
  });

  test('lyckad status men oparsbar kropp → källans storlek står kvar, inget kast', async () => {
    const fangat: FangatAnrop[] = [];
    const resultat = await kopieraInomBucket({
      supabaseUrl: 'https://exempel.supabase.co',
      serviceRoleKey: 'sr',
      bucket: 'bilagor',
      franPath: 'a',
      tillPath: 'b',
      forvantadStorlek: 99,
      fetchImpl: fejkFetch({ status: 200, body: 'inte JSON' }, fangat),
    });
    expect(resultat).toEqual({ nyckel: null, storlek: 99, storlekFranServern: false });
  });

  test('saknad url eller nyckel kastar innan något nätverksanrop görs', async () => {
    const fangat: FangatAnrop[] = [];
    const fetchImpl = fejkFetch({ status: 200, body: LYCKAT_SVAR }, fangat);
    await expect(
      kopieraInomBucket({
        supabaseUrl: '',
        serviceRoleKey: 'sr',
        bucket: 'bilagor',
        franPath: 'a',
        tillPath: 'b',
        forvantadStorlek: 1,
        fetchImpl,
      }),
    ).rejects.toThrow(/supabaseUrl och serviceRoleKey/);
    await expect(
      kopieraInomBucket({
        supabaseUrl: 'https://exempel.supabase.co',
        serviceRoleKey: '',
        bucket: 'bilagor',
        franPath: 'a',
        tillPath: 'b',
        forvantadStorlek: 1,
        fetchImpl,
      }),
    ).rejects.toThrow(/supabaseUrl och serviceRoleKey/);
    expect(fangat).toHaveLength(0);
  });

  test('ORDNINGEN: okänd källstorlek kastar UTAN att en enda kopiering görs (review-runda 2)', async () => {
    // Den promoverande skrivvägen skriver destinationen FÖRE Bilagor-raden
    // uppdateras. Kastade vi efter kopieringen hade filen bytts ut medan
    // raden stod kvar med gammal Källhash mot nytt innehåll. Detta test
    // bevisar spärren mekaniskt: `fangat` måste vara TOM efter varje
    // ogiltigt värde — ingen byte har lämnat maskinen.
    const fangat: FangatAnrop[] = [];
    const fetchImpl = fejkFetch({ status: 200, body: LYCKAT_SVAR }, fangat);
    const ogiltiga: unknown[] = [
      null,
      undefined,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      -1,
      '248311',
    ];

    for (const storlek of ogiltiga) {
      await expect(
        kopieraInomBucket({
          supabaseUrl: 'https://exempel.supabase.co',
          serviceRoleKey: 'sr',
          bucket: 'bilagor',
          franPath: 'utkast/recEV/bilaga.pdf',
          tillPath: 'recEV/uuid-bekraftelsebilaga.pdf',
          forvantadStorlek: storlek as number,
          fetchImpl,
        }),
        `forvantadStorlek=${String(storlek)} borde ha avvisats FÖRE kopieringen`,
      ).rejects.toThrow(/forvantadStorlek/);
    }

    expect(fangat, 'ingen kopiering får ske utan känd storlek').toHaveLength(0);
  });

  test('storlek 0 är ett KÄNT värde och tillåts — bara okända värden spärrar', async () => {
    const fangat: FangatAnrop[] = [];
    const resultat = await kopieraInomBucket({
      supabaseUrl: 'https://exempel.supabase.co',
      serviceRoleKey: 'sr',
      bucket: 'bilagor',
      franPath: 'a',
      tillPath: 'b',
      forvantadStorlek: 0,
      fetchImpl: fejkFetch({ status: 200, body: JSON.stringify({ Key: 'bilagor/b' }) }, fangat),
    });
    expect(fangat).toHaveLength(1);
    expect(resultat.storlek).toBe(0);
  });
});
