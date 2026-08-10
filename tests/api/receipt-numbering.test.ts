// Kontraktstest för kvittonummer-allokeraren (TASK-147.7, ADR-109, AC #2).
//
// api-pure (ren logik, ingen staging, inga creds, NOLL riktig Airtable): en
// IN-MEMORY-ledger injiceras via `ReceiptAllocationDeps` — konformans-kärnan
// (unikhet under samtidighet, ingen retroaktiv omnumrering av UTFÄRDADE
// nummer, deterministisk start/format) bevisas mekaniskt, inte antaget.
//
// SAMTIDIGHETS-BEVISET (huvudtestet nedan) är HERMETISKT MEN INTE FEJKAT:
// mock-ledgerns `listByYear`/`create`/`remove` är alla riktiga `async`-
// funktioner utan konstgjord `setTimeout`-fördröjning. Det räcker för att
// tvinga fram ÄKTA kollisioner — JS microtask-schemaläggning gör att N
// parallella `allocateReceiptNumber(...)`-anrop, startade i SAMMA
// synkrona tick (`Promise.all`), alla hinner läsa den TOMMA ledgern INNAN
// någon av dem hunnit skriva sin egen kandidat-rad (varje `await` yieldar
// minst en microtask-runda, och `.map()` kör alla N anropens FÖRSTA
// synkrona prefix — inklusive `listByYear`s kropp — före något av dem
// återupptas). Detta är INTE en tajming-gissning: det är samma
// determinism som gör `Promise.all([a(), b()])` reproducerbart i Node
// oavsett maskin/last (ingen riktig tråd-parallellitet inblandad).

import { expect, test } from '@playwright/test';
import {
  allocateReceiptNumber,
  formatKvittonummer,
  KVITTO_START,
  type KvittoLedgerEntry,
  type ReceiptAllocationDeps,
  ReceiptAllocationExhaustedError,
} from '../../supabase/functions/_shared/receipt-numbering';

/** En delad in-memory ledger — samma "bas" alla parallella anrop i ett test skriver mot. */
function makeLedger(): ReceiptAllocationDeps & { rader: () => KvittoLedgerEntry[] } {
  let rader: KvittoLedgerEntry[] = [];
  let nasta = 0;

  return {
    async listByYear(ar) {
      return rader.filter((r) => r.ar === ar).map((r) => ({ ...r }));
    },
    async create(ar, lopnummer) {
      nasta += 1;
      // Nollpaddat så sträng-sortering (tie-breaken) matchar skapelseordning
      // i det hermetiska testet — se allocateReceiptNumber § tie-break.
      const id = `rec${String(nasta).padStart(8, '0')}`;
      rader.push({ id, ar, lopnummer });
      return { id };
    },
    async remove(id) {
      rader = rader.filter((r) => r.id !== id);
    },
    rader: () => rader,
  };
}

test.describe('formatKvittonummer + KVITTO_START — formatet (Marcus-beslut S102 Implementation Notes b)', () => {
  test('MM-<år>-<löpnummer>, start 1001', () => {
    expect(KVITTO_START).toBe(1001);
    expect(formatKvittonummer(2026, 1001)).toBe('MM-2026-1001');
    expect(formatKvittonummer(2027, 1002)).toBe('MM-2027-1002');
  });
});

test.describe('allocateReceiptNumber — normalfallet (ensam allokerare)', () => {
  test('tom ledger → första numret är KVITTO_START', async () => {
    const ledger = makeLedger();
    const result = await allocateReceiptNumber(2026, ledger);
    expect(result).toEqual({
      id: expect.any(String),
      kvittonummer: 'MM-2026-1001',
      lopnummer: 1001,
      ar: 2026,
    });
  });

  test('sekventiella anrop räknar upp löpnummer, ett per anrop', async () => {
    const ledger = makeLedger();
    const first = await allocateReceiptNumber(2026, ledger);
    const second = await allocateReceiptNumber(2026, ledger);
    const third = await allocateReceiptNumber(2026, ledger);
    expect([first.lopnummer, second.lopnummer, third.lopnummer]).toEqual([1001, 1002, 1003]);
  });

  test('åren är OBEROENDE serier — 2026 och 2027 börjar båda på 1001', async () => {
    const ledger = makeLedger();
    await allocateReceiptNumber(2026, ledger);
    await allocateReceiptNumber(2026, ledger);
    const forstaFor2027 = await allocateReceiptNumber(2027, ledger);
    expect(forstaFor2027.lopnummer).toBe(1001);
    expect(forstaFor2027.kvittonummer).toBe('MM-2027-1001');
  });

  test('förlorade kandidater lämnar INGEN spårlös rest — ledgern bär exakt N rader efter N lyckade allokeringar', async () => {
    const ledger = makeLedger();
    await allocateReceiptNumber(2026, ledger);
    await allocateReceiptNumber(2026, ledger);
    expect(ledger.rader()).toHaveLength(2);
  });
});

test.describe('allocateReceiptNumber — SAMTIDIGHET (AC #2, huvudbeviset)', () => {
  test('8 parallella allokeringar mot SAMMA ledger → 8 helt unika, sekventiella löpnummer', async () => {
    const ledger = makeLedger();
    const N = 8;

    const results = await Promise.all(
      Array.from({ length: N }, () => allocateReceiptNumber(2026, ledger)),
    );

    const lopnummer = results.map((r) => r.lopnummer).sort((a, b) => a - b);
    // Unikhet — kärnpåståendet AC #2 kräver.
    expect(new Set(lopnummer).size).toBe(N);
    // Ingen lucka och ingen dubblett: exakt {1001..1008} — protokollet
    // konvergerar till en TÄT serie även under maximal, fullt synkroniserad
    // kollision (varje förlorad kandidat raderas och görs om, se
    // receipt-numbering.ts § protokollbeskrivning).
    expect(lopnummer).toEqual(Array.from({ length: N }, (_, i) => KVITTO_START + i));

    // Kvittonummer-strängarna är EXAKT parade med sina löpnummer.
    for (const r of results) {
      expect(r.kvittonummer).toBe(formatKvittonummer(2026, r.lopnummer));
    }

    // Ledgern bär EXAKT N rader efteråt — inga övergivna förlorar-kandidater
    // kvar (allokeraren städar sina egna kollisioner, se § remove).
    expect(ledger.rader()).toHaveLength(N);
  });

  test('16 parallella allokeringar (högre samtidighet) konvergerar fortfarande till fullt unika nummer', async () => {
    const ledger = makeLedger();
    const N = 16;

    const results = await Promise.all(
      Array.from({ length: N }, () => allocateReceiptNumber(2026, ledger, { maxAttempts: 30 })),
    );

    const lopnummer = results.map((r) => r.lopnummer);
    expect(new Set(lopnummer).size).toBe(N);
    expect(ledger.rader()).toHaveLength(N);
  });

  test('samtidiga allokeringar mot TVÅ ÅR stör inte varandra — varje år konvergerar till sin egen unika, täta serie', async () => {
    const ledger = makeLedger();
    const perAr = 5;

    const [resultat2026, resultat2027] = await Promise.all([
      Promise.all(Array.from({ length: perAr }, () => allocateReceiptNumber(2026, ledger))),
      Promise.all(Array.from({ length: perAr }, () => allocateReceiptNumber(2027, ledger))),
    ]);

    expect(new Set(resultat2026.map((r) => r.lopnummer)).size).toBe(perAr);
    expect(new Set(resultat2027.map((r) => r.lopnummer)).size).toBe(perAr);
    // Ingen kollision ÖVER årsgränsen — samma löpnummer FÅR förekomma i
    // båda årens serier (varje år är sin egen namnrymd).
    expect(resultat2026.some((r) => r.lopnummer === KVITTO_START)).toBe(true);
    expect(resultat2027.some((r) => r.lopnummer === KVITTO_START)).toBe(true);
  });

  test('ingen retroaktiv omnumrering: en redan UTFÄRDAD allokering ändras aldrig av senare, konkurrerande försök', async () => {
    const ledger = makeLedger();
    const forsta = await allocateReceiptNumber(2026, ledger);
    expect(forsta.lopnummer).toBe(1001);

    // Fyra NYA, samtidiga allokeringar efter den första är redan klar —
    // ingen av dem får röra `forsta`s rad eller nummer.
    await Promise.all(Array.from({ length: 4 }, () => allocateReceiptNumber(2026, ledger)));

    const raderMedForstaNumret = ledger
      .rader()
      .filter((r) => r.lopnummer === 1001 && r.id === forsta.id);
    expect(raderMedForstaNumret).toHaveLength(1);
  });

  test('uttömd allokering (orimligt lågt maxAttempts under hög samtidighet) fäller ReceiptAllocationExhaustedError, kraschar aldrig tyst', async () => {
    const ledger = makeLedger();
    const N = 5;

    const forsok = await Promise.allSettled(
      Array.from({ length: N }, () => allocateReceiptNumber(2026, ledger, { maxAttempts: 1 })),
    );

    // Med maxAttempts=1 och full synkroniserad kollision (alla N ser samma
    // tomma ledger) VINNER exakt en av de N — resten fäller den namngivna
    // exhausted-typen (aldrig ett generiskt/tyst fel).
    const lyckade = forsok.filter((f) => f.status === 'fulfilled');
    const fallna = forsok.filter((f) => f.status === 'rejected');
    expect(lyckade.length).toBeGreaterThanOrEqual(1);
    expect(lyckade.length).toBeLessThan(N);
    for (const f of fallna) {
      if (f.status === 'rejected') {
        expect(f.reason).toBeInstanceOf(ReceiptAllocationExhaustedError);
      }
    }
  });
});
