// Startvärmningsmotorn (TASK-218.1) — api-pure (ren logik, ingen staging,
// inga creds, ingen browser, inget UI). Hermetiska tester för AC #4:
// äkta settled-räkning, hård timeout, offline-gate, seed-delning.
//
// `QueryClient` (från `@tanstack/react-query`) fungerar utan DOM/React-
// rendering — samma precedens som `tests/api/record-activity.test.ts`s
// `stubQueryClient()`/`spionQueryClient()`, fast här en RIKTIG `QueryClient`
// (inte en stub) eftersom modulen faktiskt anropar `ensureQueryData`/
// `setQueryData`/`getQueryData` — precis de metoder ett stubbat objekt hade
// varit fel verktyg för att pröva.
//
// `dataSource` injiceras via `StartvarmningBeroenden` (samma
// injektionsseam-mönster som `airtable-retry.ts`s `sleep`-parameter) —
// aldrig modul-mockning, som `record-activity.test.ts`s `stubAdapter`.

import { expect, test } from '@playwright/test';
import { QueryClient } from '@tanstack/react-query';
import type { DataSourceAdapter } from '../../src/data/adapters/DataSourceAdapter';
import type { StartvarmningForlopp } from '../../src/data/warmup/startvarmningen';
import { starta } from '../../src/data/warmup/startvarmningen';
import { queryKeys } from '../../src/queries/keys';

const WARMUP_SET_SIZE = 7; // events, registrations, waitlist, intresserade, maillog, segment, activityLog

/** Distinkta sentinelvärden per datamängd — bevisar att RÄTT payload hamnar
 * i RÄTT nyckel (inte bara "något" hamnar där). */
const SENTINEL = {
  events: [{ id: 'e1' }],
  registrations: [{ id: 'r1' }],
  waitlist: [{ id: 'w1' }],
  intresserade: [{ id: 'i1' }],
  maillog: [{ id: 'm1' }],
  segment: [{ id: 's1' }],
  activityLog: { statements: [{ id: 'a1' }], nextCursor: null },
};

interface StubOptions {
  /** Fördröjning i ms per metod (default 1). Styr batch-ordningen i testerna. */
  delays?: Partial<Record<keyof typeof SENTINEL, number>>;
  /** Metoder som ska AVVISAS i stället för att lösa ut. */
  rejects?: Partial<Record<keyof typeof SENTINEL, Error>>;
  /** Metoder vars promise ALDRIG settlar (hänger för evigt) — timeout-testet. */
  hangs?: Array<keyof typeof SENTINEL>;
}

/** Räknar anrop per metod — AC #3s "en hämtning per datamängd" bevisas mot
 * dessa räknare, inte mot en gissning. */
function stubDataSource(opts: StubOptions = {}): {
  ds: DataSourceAdapter;
  anrop: Record<keyof typeof SENTINEL, number>;
} {
  const anrop: Record<keyof typeof SENTINEL, number> = {
    events: 0,
    registrations: 0,
    waitlist: 0,
    intresserade: 0,
    maillog: 0,
    segment: 0,
    activityLog: 0,
  };

  function svar<K extends keyof typeof SENTINEL>(namn: K): Promise<(typeof SENTINEL)[K]> {
    anrop[namn] += 1;
    if (opts.hangs?.includes(namn)) {
      return new Promise(() => {}); // avsiktligt aldrig settlad
    }
    const delay = opts.delays?.[namn] ?? 1;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const fel = opts.rejects?.[namn];
        if (fel) reject(fel);
        else resolve(SENTINEL[namn]);
      }, delay);
    });
  }

  const ds = {
    fetchEvents: () => svar('events'),
    fetchRegistrations: () => svar('registrations'),
    fetchWaitlist: () => svar('waitlist'),
    fetchIntresserade: () => svar('intresserade'),
    fetchMailLog: () => svar('maillog'),
    listSegments: () => svar('segment'),
    fetchActivityLog: () => svar('activityLog'),
  } as unknown as DataSourceAdapter;

  return { ds, anrop };
}

function nyQueryClient(overrides: { staleTimeMs?: number } = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // inga verkliga backoff-väntor i testerna
        staleTime: overrides.staleTimeMs ?? 0,
      },
    },
  });
}

test.describe('Startvärmningsmotorn — online-gate (AC #2)', () => {
  test('offline vid start ⇒ direkt-släpp, NOLL startade hämtningar', async () => {
    const { ds, anrop } = stubDataSource();
    const qc = nyQueryClient();
    const snapshots: StartvarmningForlopp[] = [];

    const handle = starta(qc, { dataSource: ds, isOnline: () => false, timeoutMs: 5000 });
    handle.forloppsprenumeration((f) => snapshots.push(f));

    const resultat = await handle.slutlofte;

    expect(resultat).toEqual({
      utfall: 'offline',
      forlopp: { klara: 0, totalt: WARMUP_SET_SIZE },
    });
    // Ingen enda dataSource-metod fick anropas — inte ens startad-och-avbruten.
    for (const namn of Object.keys(anrop) as Array<keyof typeof anrop>) {
      expect(anrop[namn], `${namn} skulle inte ha anropats`).toBe(0);
    }
    // Prenumeranten fick sitt omedelbara snapshot innan slutlöftet ens hann lösas ut.
    expect(snapshots[0]).toEqual({ klara: 0, totalt: WARMUP_SET_SIZE });
  });
});

test.describe('Startvärmningsmotorn — äkta settled-räkning (AC #1)', () => {
  test('förloppet stiger monotont 0→7, bundet till FAKTISKA avslut — aldrig en fejkad animation', async () => {
    // Första posten i varje batch-par löser ut snabbare än den andra —
    // bevisar att räkningen följer VERKLIG avslutsordning, inte en fast takt.
    const { ds } = stubDataSource({
      delays: {
        events: 2,
        registrations: 20,
        waitlist: 2,
        intresserade: 20,
        maillog: 2,
        segment: 20,
        activityLog: 2,
      },
    });
    const qc = nyQueryClient();
    const snapshots: StartvarmningForlopp[] = [];

    const handle = starta(qc, { dataSource: ds, isOnline: () => true, timeoutMs: 5000 });
    handle.forloppsprenumeration((f) => snapshots.push({ ...f }));

    const resultat = await handle.slutlofte;

    expect(resultat).toEqual({
      utfall: 'klar',
      forlopp: { klara: WARMUP_SET_SIZE, totalt: WARMUP_SET_SIZE },
    });

    // Omedelbart snapshot (0) + en uppdatering per faktiskt avslut (7) = 8.
    expect(snapshots).toHaveLength(WARMUP_SET_SIZE + 1);
    expect(snapshots[0]).toEqual({ klara: 0, totalt: WARMUP_SET_SIZE });
    // Strikt stigande, ett steg i taget, ingen skippad eller dubblerad räkning.
    for (let i = 1; i < snapshots.length; i++) {
      expect(snapshots[i].klara).toBe(snapshots[i - 1].klara + 1);
      expect(snapshots[i].totalt).toBe(WARMUP_SET_SIZE);
    }
    expect(snapshots.at(-1)).toEqual({ klara: WARMUP_SET_SIZE, totalt: WARMUP_SET_SIZE });
  });

  test('avprenumerering stoppar vidare uppdateringar', async () => {
    const { ds } = stubDataSource({ delays: { activityLog: 15 } });
    const qc = nyQueryClient();
    const snapshots: StartvarmningForlopp[] = [];

    const handle = starta(qc, { dataSource: ds, isOnline: () => true, timeoutMs: 5000 });
    const avprenumerera = handle.forloppsprenumeration((f) => snapshots.push(f));
    avprenumerera(); // avprenumerera OMEDELBART, före några avslut hunnit ske

    await handle.slutlofte;

    // Bara det initiala snapshotet (givet vid prenumereringstillfället) — inga
    // efterföljande avslut nådde en lyssnare som redan lämnat.
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual({ klara: 0, totalt: WARMUP_SET_SIZE });
  });
});

test.describe('Startvärmningsmotorn — hämta en gång, dela (AC #3, ADR-112 beslut 4)', () => {
  test('events/registrations hämtas EN gång var, seedas till BÅDA nyckelfamiljerna', async () => {
    const { ds, anrop } = stubDataSource();
    const qc = nyQueryClient();

    const resultat = await starta(qc, {
      dataSource: ds,
      isOnline: () => true,
      timeoutMs: 5000,
    }).slutlofte;

    expect(resultat.utfall).toBe('klar');
    // EN hämtning, inte två, trots att payloaden landar i två nycklar.
    expect(anrop.events).toBe(1);
    expect(anrop.registrations).toBe(1);

    expect(qc.getQueryData(queryKeys.events.list)).toEqual(SENTINEL.events);
    expect(qc.getQueryData(queryKeys.dashboard.events)).toEqual(SENTINEL.events);
    expect(qc.getQueryData(queryKeys.registrations.all)).toEqual(SENTINEL.registrations);
    expect(qc.getQueryData(queryKeys.dashboard.registrations)).toEqual(SENTINEL.registrations);
  });

  test('de fem enkla datamängderna seedas var och en till sin EGNA enda nyckel', async () => {
    const { ds, anrop } = stubDataSource();
    const qc = nyQueryClient();

    await starta(qc, { dataSource: ds, isOnline: () => true, timeoutMs: 5000 }).slutlofte;

    expect(anrop.waitlist).toBe(1);
    expect(anrop.intresserade).toBe(1);
    expect(anrop.maillog).toBe(1);
    expect(anrop.segment).toBe(1);
    expect(anrop.activityLog).toBe(1);

    expect(qc.getQueryData(queryKeys.waitlist.all)).toEqual(SENTINEL.waitlist);
    expect(qc.getQueryData(queryKeys.intresserade.all)).toEqual(SENTINEL.intresserade);
    expect(qc.getQueryData(queryKeys.maillog.all)).toEqual(SENTINEL.maillog);
    expect(qc.getQueryData(queryKeys.segment.saved)).toEqual(SENTINEL.segment);
    // Nyckeln BÄR limit-talet (§ HEM_SENASTE_AKTIVITET_LIMIT i modulens
    // filhuvud) — fel tal skulle skriva en post ingen konsument läser.
    expect(qc.getQueryData(queryKeys.activityLog.latest(4))).toEqual(SENTINEL.activityLog);
    // Ingen bortglömd skrivning till roten (aldrig läst av någon konsument, se keys.ts).
    expect(qc.getQueryData(queryKeys.dashboard.all)).toBeUndefined();
  });

  test('varm, färsk cache ⇒ INGEN nätverksanrop (ensureQueryData läser cachen)', async () => {
    const { ds, anrop } = stubDataSource();
    // Speglar produktionens globala staleTime (`src/router.ts`, 5 min) — utan
    // detta skulle en precis seedad post räknas som stale omedelbart (default 0).
    const qc = nyQueryClient({ staleTimeMs: 5 * 60 * 1000 });
    qc.setQueryData(queryKeys.events.list, SENTINEL.events);

    const resultat = await starta(qc, {
      dataSource: ds,
      isOnline: () => true,
      timeoutMs: 5000,
    }).slutlofte;

    expect(resultat.utfall).toBe('klar');
    expect(anrop.events).toBe(0); // cache-träff, inget nätverksanrop
    // Delningen sker ändå — dashboard.events seedas från cache-träffen.
    expect(qc.getQueryData(queryKeys.dashboard.events)).toEqual(SENTINEL.events);
  });
});

test.describe('Startvärmningsmotorn — hård timeout (ADR-112 beslut 3, AC #2)', () => {
  test('en hängande hämtning ⇒ timeout släpper med delresultat, aldrig ett oändligt häng', async () => {
    // De sex första (tre batchar) löser ut snabbt; den sjunde (fjärde batchen,
    // ensam) hänger för evigt — timeout måste ändå släppa.
    const { ds, anrop } = stubDataSource({
      delays: { events: 1, registrations: 1, waitlist: 1, intresserade: 1, maillog: 1, segment: 1 },
      hangs: ['activityLog'],
    });
    const qc = nyQueryClient();

    const start = Date.now();
    const resultat = await starta(qc, {
      dataSource: ds,
      isOnline: () => true,
      timeoutMs: 100,
    }).slutlofte;
    const forflutet = Date.now() - start;

    expect(resultat.utfall).toBe('timeout');
    expect(resultat.forlopp).toEqual({ klara: WARMUP_SET_SIZE - 1, totalt: WARMUP_SET_SIZE });
    expect(anrop.activityLog).toBe(1); // startad — bara aldrig avslutad
    // Släpptes runt timeoutMs, inte efter att ha väntat ut den hängande hämtningen.
    expect(forflutet).toBeLessThan(2000);
  });
});

test.describe('Startvärmningsmotorn — slutlöfte kastar aldrig', () => {
  test('en avvisad hämtning räknas som settlad; slutlöfte resolvar ändå med utfall klar', async () => {
    const { ds } = stubDataSource({
      rejects: { maillog: new Error('EF nere, testfixtur') },
    });
    const qc = nyQueryClient();

    const resultat = await starta(qc, {
      dataSource: ds,
      isOnline: () => true,
      timeoutMs: 5000,
    }).slutlofte;

    expect(resultat).toEqual({
      utfall: 'klar',
      forlopp: { klara: WARMUP_SET_SIZE, totalt: WARMUP_SET_SIZE },
    });
    // Den avvisade datamängdens nyckel förblir alltså oseedad — men resten
    // av startvärmningen sänks inte av det.
    expect(qc.getQueryData(queryKeys.maillog.all)).toBeUndefined();
  });
});
