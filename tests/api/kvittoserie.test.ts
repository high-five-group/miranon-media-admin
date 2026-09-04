// Hermetiskt kontraktstest för kvittoseriens KOD-halva (TASK-346.3, AC #4).
//
// api-pure: ren logik, ingen staging, inga creds, ingen databas.
//
// VAD DETTA TESTET BEVISAR, OCH VAD DET MEDVETET INTE GÖR. ADR-128 beslut 4
// flyttar seriens garantier från bevisad kod till databasegenskaper —
// atomiciteten är `nextval`, unikheten en `unique`-klausul, formatet en
// genererad kolumn. Att modellera dem i TypeScript och kalla det ett bevis
// vore teater: modellen kan vara grön medan databasen är fel. De tre bevisas
// i stället mot skarp staging efter `db push` (se
// `scripts/task-346-3-staging-verifiering.sql`).
//
// Kvar här är den halva som FAKTISKT bor i kod, eftersom dess underlag
// ligger utanför Postgres: härledningen av årets GOLV ur den befintliga
// Airtable-ledgern, formatets läsväg, och tätshets-instrumentet.
//
// NEGATIVA KONTROLLER (kortets AC #4, PRD:ns DoD #5): varje regel prövas mot
// en tabell av MUTANTER — trasiga implementationer av samma regel. Ett fall
// måste skilja mutanten från originalet, annars är regeln inte bevisad utan
// bara körd. Formen är hämtad ur `tests/api/mutation-hemvist-vakt.ts` och
// `plats-uppslag.test.ts` § NEGATIVKONTROLL: visa att detektorn inte
// degenererar till "alltid samma svar".

import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import {
  arTatOchStigande,
  formatKvittonummer,
  harledGolv,
  harledGolvUrLedger,
  KVITTOSERIE_AR_MAX,
  KVITTOSERIE_AR_MIN,
  KVITTOSERIE_START,
  tolkaKvittonummer,
} from '../../supabase/functions/_shared/kvittoserie';

// ═══════════════════════════════════════════════════════════════════════════
// § 1 — Formatet (ADR-109 beslut 1, oförändrat av ADR-128)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('formatKvittonummer', () => {
  test('bygger MM-<år>-<löpnummer>', () => {
    expect(formatKvittonummer(2026, 1001)).toBe('MM-2026-1001');
    expect(formatKvittonummer(2026, 1003)).toBe('MM-2026-1003');
    expect(formatKvittonummer(2027, 1001)).toBe('MM-2027-1001');
  });

  test('nollpaddar ALDRIG — löpnumret är ett tal, inte ett fält', () => {
    expect(formatKvittonummer(2026, 1001)).not.toContain('01001');
  });

  test('avvisar år och löpnummer utanför serien', () => {
    expect(() => formatKvittonummer(2025, 1001)).toThrow(/ogiltigt år/);
    expect(() => formatKvittonummer(3000, 1001)).toThrow(/ogiltigt år/);
    expect(() => formatKvittonummer(2026.5, 1001)).toThrow(/ogiltigt år/);
    expect(() => formatKvittonummer(2026, 1000)).toThrow(/ogiltigt löpnummer/);
    expect(() => formatKvittonummer(2026, 1001.5)).toThrow(/ogiltigt löpnummer/);
  });
});

test.describe('tolkaKvittonummer', () => {
  test('läser tillbaka ett giltigt nummer till sina delar', () => {
    expect(tolkaKvittonummer('MM-2026-1001')).toEqual({ ar: 2026, lopnummer: 1001 });
    expect(tolkaKvittonummer('MM-2026-1002')).toEqual({ ar: 2026, lopnummer: 1002 });
    expect(tolkaKvittonummer('MM-2099-98765')).toEqual({ ar: 2099, lopnummer: 98765 });
  });

  test('är rundgångssäker mot formatKvittonummer', () => {
    for (const [ar, lopnummer] of [
      [2026, 1001],
      [2026, 1003],
      [2030, 5000],
    ] as const) {
      expect(tolkaKvittonummer(formatKvittonummer(ar, lopnummer))).toEqual({ ar, lopnummer });
    }
  });

  test('avvisar allt som inte är exakt seriens form (negativ kontroll)', () => {
    // Utan dessa fall vore en tolkare som "hittar siffror var som helst"
    // lika grön — och den hade läst ett golv ur en främmande sträng.
    for (const skrap of [
      '',
      'MM-2026-1001 ',
      ' MM-2026-1001',
      'mm-2026-1001',
      'MM-2026-01001', // nollpaddat — serien utfärdade aldrig detta
      'MM-2026-1000', // under start
      'MM-2026-999',
      'MM-26-1001',
      'MM-2025-1001', // före serien fanns
      'MM-3000-1001',
      'MM-2026-1001-2',
      'FAKTURA-2026-1001',
      'MM-2026-abc',
      'MM-2026-',
    ]) {
      expect(tolkaKvittonummer(skrap), `"${skrap}" ska inte tolkas`).toBeNull();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 2 — Golvet: "startande efter högsta befintliga" (AC #4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('harledGolv', () => {
  test('tom ledger startar serien på 1001', () => {
    expect(harledGolv(null)).toBe(KVITTOSERIE_START);
    expect(harledGolv(null)).toBe(1001);
  });

  test('befintligt högsta ger exakt ETT mer', () => {
    expect(harledGolv(1001)).toBe(1002);
    expect(harledGolv(1002)).toBe(1003);
    expect(harledGolv(9999)).toBe(10000);
  });

  test('ett högsta under seriens start kan inte sänka golvet', () => {
    expect(harledGolv(1)).toBe(1001);
    expect(harledGolv(0)).toBe(1001);
    expect(harledGolv(-5)).toBe(1001);
  });

  test('avvisar icke-heltal — ett halvt löpnummer är inget löpnummer', () => {
    expect(() => harledGolv(1002.5)).toThrow(/heltal eller null/);
    expect(() => harledGolv(Number.NaN)).toThrow(/heltal eller null/);
  });
});

test.describe('harledGolvUrLedger — mot de FAKTISKT MÄTTA ledgrarna', () => {
  // Mätt 2026-08-30 mot Airtable staging (apphjj8Q7lkXCMsL4, tabell Kvitton):
  // exakt två rader, MM-2026-1001 och MM-2026-1002. Samma mätning som
  // ADR-128 beslut 4 och kortets AC #1 vilar på — ommätt av denna skiva.
  test('stagings ledger (1001, 1002) ger golv 1003', () => {
    expect(harledGolvUrLedger(['MM-2026-1001', 'MM-2026-1002'], 2026)).toBe(1003);
  });

  test('ordningen i ledgern spelar ingen roll', () => {
    expect(harledGolvUrLedger(['MM-2026-1002', 'MM-2026-1001'], 2026)).toBe(1003);
  });

  // Mätt read-only 2026-08-30 (ADR-128 beslut 4): prod-ledgern bär 0 kvitton.
  test('prods tomma ledger ger golv 1001', () => {
    expect(harledGolvUrLedger([], 2026)).toBe(1001);
  });

  test('ett annat års nummer flyttar inte golvet — serien är årsbunden', () => {
    expect(harledGolvUrLedger(['MM-2026-5000'], 2027)).toBe(1001);
    expect(harledGolvUrLedger(['MM-2026-1002', 'MM-2027-1001'], 2026)).toBe(1003);
  });

  test('en främmande sträng i ledgern ignoreras, den kastar inte (negativ kontroll)', () => {
    // En ledger som råkar bära en fakturarad eller ett tomt fält får varken
    // fälla härledningen eller flytta golvet.
    expect(harledGolvUrLedger(['FAKTURA-2026-9999', '', 'MM-2026-1002'], 2026)).toBe(1003);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 3 — Tätheten: verifieringens instrument (AC #4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('arTatOchStigande', () => {
  test('en tät stigande serie godkänns', () => {
    expect(arTatOchStigande([1003, 1004, 1005])).toBe(true);
    expect(arTatOchStigande([1001])).toBe(true);
    expect(arTatOchStigande([])).toBe(true);
  });

  test('ett HOPP fälls — det är hela poängen med instrumentet', () => {
    expect(arTatOchStigande([1003, 1005])).toBe(false);
    expect(arTatOchStigande([1003, 1004, 1006])).toBe(false);
  });

  test('en UPPREPNING fälls — två kvitton får aldrig bära samma nummer', () => {
    expect(arTatOchStigande([1003, 1003])).toBe(false);
  });

  test('FALLANDE ordning fälls — utfärdandeordningen är en bokföringsegenskap', () => {
    // ADR-129 beslut 9: numren allokeras sekventiellt, aldrig parallellt,
    // just för att nummerordningen ska följa utfärdandeordningen.
    expect(arTatOchStigande([1005, 1004, 1003])).toBe(false);
    expect(arTatOchStigande([1003, 1005, 1004])).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 4 — MUTATIONSBEVISET (AC #4 "negativ kontroll", PRD DoD #5)
// ═══════════════════════════════════════════════════════════════════════════
//
// Ett grönt test bevisar bara att koden KÖRDES om ingen trasig variant kan
// vara lika grön. Varje mutant nedan är en rimlig felskrivning av samma
// regel; testet kräver att minst ETT indata skiljer den från originalet.
// Faller det kravet är regeln inte bevisad — och DÅ ska denna fil bli röd,
// inte den dag en riktig regression smyger in.

interface Mutant<TIn, TUt> {
  readonly namn: string;
  readonly muterad: (indata: TIn) => TUt;
}

/**
 * Kör original och mutant över samma indata-mängd och kräv minst en
 * skillnad. Undantag räknas som ett utfall — en implementation som kastar
 * där originalet svarar (eller tvärtom) ÄR skild från originalet.
 */
function kravSkiljbar<TIn, TUt>(
  original: (indata: TIn) => TUt,
  mutant: Mutant<TIn, TUt>,
  indataMangd: readonly TIn[],
): void {
  const utfall = (f: (i: TIn) => TUt, i: TIn): string => {
    try {
      return `ok:${JSON.stringify(f(i))}`;
    } catch (fel) {
      return `kast:${(fel as Error).constructor.name}`;
    }
  };

  const skiljande = indataMangd.filter((i) => utfall(original, i) !== utfall(mutant.muterad, i));

  expect(
    skiljande.length,
    `MUTANTEN "${mutant.namn}" är oskiljbar från originalet över testets ` +
      `indata-mängd — regeln är inte bevisad, bara körd. Lägg till ett fall ` +
      `som skiljer dem.`,
  ).toBeGreaterThan(0);
}

test.describe('negativ kontroll — mutanter måste fällas', () => {
  test('harledGolv: varje mutant skiljs av minst ett fall', () => {
    const indata: readonly (number | null)[] = [null, 0, 1, 1001, 1002, 9999];

    const mutanter: readonly Mutant<number | null, number>[] = [
      {
        namn: 'returnerar HÖGSTA i stället för högsta + 1 (av-med-ett)',
        muterad: (h) => (h === null ? KVITTOSERIE_START : Math.max(KVITTOSERIE_START, h)),
      },
      {
        namn: 'glömmer golvet — ett lågt högsta sänker serien under 1001',
        muterad: (h) => (h === null ? KVITTOSERIE_START : h + 1),
      },
      {
        namn: 'startar tom ledger på 1 i stället för 1001',
        muterad: (h) => (h === null ? 1 : Math.max(KVITTOSERIE_START, h + 1)),
      },
      {
        namn: 'hoppar två steg',
        muterad: (h) => (h === null ? KVITTOSERIE_START : Math.max(KVITTOSERIE_START, h + 2)),
      },
    ];

    for (const mutant of mutanter) {
      kravSkiljbar(harledGolv, mutant, indata);
    }
  });

  test('arTatOchStigande: varje mutant skiljs av minst ett fall', () => {
    const indata: readonly number[][] = [
      [],
      [1001],
      [1003, 1004, 1005],
      [1003, 1005],
      [1003, 1003],
      [1005, 1004, 1003],
      [1003, 1005, 1004],
      // Detta fall finns FÖR mutanten "jämför mot ändarna": första och sista
      // ligger exakt length-1 isär, så en ände-till-ände-kontroll säger
      // "tät" medan serien i själva verket bär en upprepning OCH ett hopp.
      // Utan raden är den mutanten oskiljbar och regeln obevisad.
      [1003, 1003, 1005],
    ];

    const mutanter: readonly Mutant<number[], boolean>[] = [
      {
        namn: 'alltid true (degenererad detektor)',
        muterad: () => true,
      },
      {
        namn: 'kollar bara STIGANDE, inte tätt — släpper igenom hopp',
        muterad: (rad) => rad.every((v, i) => i === 0 || v > rad[i - 1]),
      },
      {
        namn: 'kollar bara UNIKHET, inte ordning eller täthet',
        muterad: (rad) => new Set(rad).size === rad.length,
      },
      {
        namn: 'jämför mot ändarna i stället för parvis',
        muterad: (rad) => rad.length <= 1 || rad[rad.length - 1] - rad[0] === rad.length - 1,
      },
    ];

    for (const mutant of mutanter) {
      kravSkiljbar(arTatOchStigande, mutant, indata);
    }
  });

  test('tolkaKvittonummer: varje mutant skiljs av minst ett fall', () => {
    const indata: readonly string[] = [
      'MM-2026-1001',
      'MM-2026-01001',
      'MM-2026-1000',
      'MM-2025-1001',
      'mm-2026-1001',
      'FAKTURA-2026-1001',
      'MM-2026-1001 ',
    ];

    const mutanter: readonly Mutant<string, { ar: number; lopnummer: number } | null>[] = [
      {
        namn: 'oankrad regex — hittar ett nummer var som helst i strängen',
        muterad: (s) => {
          const t = /MM-(\d{4})-(\d+)/.exec(s);
          return t ? { ar: Number(t[1]), lopnummer: Number(t[2]) } : null;
        },
      },
      {
        namn: 'skiftlägesokänslig — accepterar mm-2026-1001',
        muterad: (s) => {
          const t = /^MM-(\d{4})-([1-9]\d{3,})$/i.exec(s);
          return t ? { ar: Number(t[1]), lopnummer: Number(t[2]) } : null;
        },
      },
      {
        namn: 'utan intervallkontroll — släpper igenom år före serien',
        muterad: (s) => {
          const t = /^MM-(\d{4})-([1-9]\d{3,})$/.exec(s);
          return t ? { ar: Number(t[1]), lopnummer: Number(t[2]) } : null;
        },
      },
    ];

    for (const mutant of mutanter) {
      kravSkiljbar(tolkaKvittonummer, mutant, indata);
    }
  });

  test('vaktmästaren själv fälls av en oskiljbar mutant (självtest)', () => {
    // Utan detta fall vore `kravSkiljbar` en grind som aldrig kan fälla —
    // exakt det den finns för att förhindra hos andra. Identitetsmutanten
    // MÅSTE få den att kasta.
    expect(() =>
      kravSkiljbar(harledGolv, { namn: 'identitet', muterad: harledGolv }, [null, 1002]),
    ).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 5 — DRIFT-VAKTEN: TypeScript-konstanterna mot migrationens SQL
// ═══════════════════════════════════════════════════════════════════════════
//
// Seriens tre tal (start 1001, åren 2026–2999) och dess FORMAT finns på TVÅ
// ställen: som konstanter här i `_shared/kvittoserie.ts` och som
// check-constraints plus en genererad kolumn i migration 20260830195728.
// TypeScript och SQL kan inte dela modul.
//
// Går de isär blir felet TYST och skevt: TS accepterar ett år som databasen
// avvisar (eller tvärtom), och kvittonumret i den genererade kolumnen slutar
// matcha det numret koden visade för användaren — ett kvitto vars PDF och
// ledgerrad bär olika nummer. Samma felklass, och samma lösning, som
// sentinel-mönstrets korsläsning i `scripts/test-purge-staging-sentinels.mjs`
// och `KASTBARA_POSTER_FIL` i samma fil.
//
// Vakten läser migrationen som TEXT. Den bevisar inte att databasen beter sig
// som texten säger — det gör `scripts/task-346-3-staging-verifiering.sql` mot
// skarp staging. Den bevisar att de två KÄLLORNA säger samma sak, vilket är
// exakt vad ingen annan grind kan se.

const MIGRATION_SQL = readFileSync(
  new URL(
    '../../supabase/migrations/20260830195728_betalningsdomanen_inbetalningar_kvitton.sql',
    import.meta.url,
  ),
  'utf8',
);

/** Plockar EN grupp ur migrationen, eller fäller med ett läsbart skäl. */
function urMigrationen(monster: RegExp, vad: string): RegExpExecArray {
  const traff = monster.exec(MIGRATION_SQL);
  if (traff === null) {
    throw new Error(
      `drift-vakten hittade inte ${vad} i migration 20260830195728 — ` +
        `har satsen skrivits om? Uppdatera mönstret ELLER konstanten, aldrig ` +
        `bara den ena.`,
    );
  }
  return traff;
}

test.describe('drift-vakt: TS-konstanterna mot migrationens check-constraints', () => {
  test('kvitton.ar-intervallet matchar KVITTOSERIE_AR_MIN/MAX', () => {
    const m = urMigrationen(
      /constraint kvitton_ar_intervall\s+check \(ar between (\d{4}) and (\d{4})\)/,
      'kvitton_ar_intervall',
    );
    expect(Number(m[1]), 'kvitton.ar undre gräns').toBe(KVITTOSERIE_AR_MIN);
    expect(Number(m[2]), 'kvitton.ar övre gräns').toBe(KVITTOSERIE_AR_MAX);
  });

  test('kvittoserie_golv.ar-intervallet matchar samma konstanter', () => {
    const m = urMigrationen(
      /constraint kvittoserie_golv_ar_intervall\s+check \(ar between (\d{4}) and (\d{4})\)/,
      'kvittoserie_golv_ar_intervall',
    );
    expect(Number(m[1])).toBe(KVITTOSERIE_AR_MIN);
    expect(Number(m[2])).toBe(KVITTOSERIE_AR_MAX);
  });

  test('allokerarens egen årskontroll matchar samma konstanter', () => {
    const m = urMigrationen(
      /p_ar < (\d{4}) or p_ar > (\d{4})/,
      'allokera_kvittonummer:s årsintervall',
    );
    expect(Number(m[1])).toBe(KVITTOSERIE_AR_MIN);
    expect(Number(m[2])).toBe(KVITTOSERIE_AR_MAX);
  });

  test('kvitton.lopnummer-golvet matchar KVITTOSERIE_START', () => {
    const m = urMigrationen(
      /constraint kvitton_lopnummer_golv\s+check \(lopnummer >= (\d+)\)/,
      'kvitton_lopnummer_golv',
    );
    expect(Number(m[1])).toBe(KVITTOSERIE_START);
  });

  test('kvittoserie_golv.forsta_lopnummer-golvet matchar KVITTOSERIE_START', () => {
    const m = urMigrationen(
      /constraint kvittoserie_golv_minst_start\s+check \(forsta_lopnummer >= (\d+)\)/,
      'kvittoserie_golv_minst_start',
    );
    expect(Number(m[1])).toBe(KVITTOSERIE_START);
  });

  test('den GENERERADE kolumnen bygger samma sträng som formatKvittonummer', () => {
    // Den viktigaste raden i vakten. Databasen bygger kvittonumret själv
    // (generated always as … stored); koden bygger det i formatKvittonummer.
    // Skiljer sig prefix eller separator, bär PDF:en ett annat nummer än
    // ledgerraden — och det upptäcks först av Roger, i bokföringen.
    const m = urMigrationen(
      /generated always as \('([^']*)' \|\| ar::text \|\| '([^']*)' \|\| lopnummer::text\) stored/,
      'kvittonummer-kolumnens generated-uttryck',
    );
    const [, prefix, separator] = m;

    for (const [ar, lopnummer] of [
      [KVITTOSERIE_AR_MIN, KVITTOSERIE_START],
      [2026, 1003],
      [2030, 12345],
      [KVITTOSERIE_AR_MAX, 99999],
    ] as const) {
      const sqlBygger = `${prefix}${ar}${separator}${lopnummer}`;
      expect(
        formatKvittonummer(ar, lopnummer),
        `SQL bygger "${sqlBygger}" för (${ar}, ${lopnummer})`,
      ).toBe(sqlBygger);
    }
  });

  test('NEGATIV KONTROLL: vakten fäller när ett mönster inte längre finns', () => {
    // Utan detta fall vore `urMigrationen` förenlig med att tyst returnera
    // något för en sats som skrivits om — och då hade vakten varit grön
    // medan den inte längre läste något alls.
    expect(() =>
      urMigrationen(/constraint kvitton_finns_inte\s+check \((\d+)\)/, 'påhittad'),
    ).toThrow(/drift-vakten hittade inte/);
  });
});
