import { expect, test } from '@playwright/test';
import type { Parsresultat } from '../../src/components/betalningar/bankimport-parser';
import type { Importradstillstand } from '../../src/components/betalningar/bankimport-rader';
import { byggImportsteg } from '../../src/components/betalningar/bekraftelsesteg-harledningar';
import {
  avkodaImportminne,
  type ImportradIMinnet,
  importradsklass,
  oppnaKandidater,
  tillImportminne,
} from '../../src/components/betalningar/importminne';
import { harledRad } from '../../src/components/betalningar/inkorg-harledningar';
import type { OppenBetalning } from '../../src/domain/schemas';

/**
 * [TASK-402.4 AC #5, PRD TASK-402 § Testbeslut punkt 1] IMPORTENS
 * TILLSTÅNDSKLASSNING som ren funktion, plus överlämningens två ändar
 * (konverteringen in i minnet och uppbyggnaden ut ur det).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR api-pure OCH INTE EN WEBBLÄSARSVIT
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma delning som `markerings-minne.ts` bär och av samma skäl
 * (`importminne.ts` § REGLERNA ÄR RENA FUNKTIONER, LAGRET ÄR TUNT): allt som
 * HAR en regel är indata → utdata utan `window`, och bara de tre nedersta
 * funktionerna rör `sessionStorage`. AC #5 säger uttryckligen "api-pure täcker
 * tillståndsklassningen som ren funktion" — det är den delningen som gör det
 * mekaniskt uppfyllbart.
 *
 * Det OBSERVERBARA beteendet (fyra tillstånd på skärmen, valet som bockar
 * raden, dubblettens 409) prövas i
 * `tests/e2e/betalningar-import-bekraftelsesteget.staging.test.ts`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NEGATIVA KONTROLLER
 * ═══════════════════════════════════════════════════════════════════════════
 * Klassningens fyra grenar är en RANGORDNING, och de troliga felen ligger i
 * ordningen, inte i grenarna var för sig:
 *   - en dubblett som ändå klassas `saker` för att telefonträffen var exakt
 *     (dubbletten måste slå allt, AC #4)
 *   - en `saker` vars anmälan hunnit stängas som ändå räknas säker (en bock
 *     framför en anmälan som inte går att registrera)
 *   - en `osaker` vars alla kandidater stängts som ändå räknas osäker (en
 *     hög med förslagsknappar som inte leder någonstans)
 *   - kandidatlistan renderad OFILTRERAD medan klassningen filtrerar — de två
 *     måste läsa samma mängd
 *   - tom mängd öppna betalningar som ger `saker` (vi vet inte än, och
 *     funktionen får inte gissa)
 */

/* ═══════════════════════════ FIXTUR ═══════════════════════════ */

const IDAG = '2026-09-06';

const ANNA = 'recAnnaAnnaAnna1';
const BENGT = 'recBengtBengt111';
const CECILIA = 'recCeciliaCec111';

function betalning(
  over: Partial<OppenBetalning> &
    Pick<OppenBetalning, 'anmalanRecordId' | 'personNamn' | 'gallandePris' | 'summaInbetalt'>,
): OppenBetalning {
  const saknas = over.gallandePris === null ? null : over.gallandePris - over.summaInbetalt;
  return {
    personEpost: null,
    personTelefon: null,
    eventId: 'rec-event-rim1',
    eventNamn: 'Resor i medvetandet 1, Skövde',
    eventStartdatum: '2026-09-20',
    eventTyp: 'Kurs',
    anmalanStatus: 'Bekräftad',
    anmalningsavgift: 1000,
    summaInbetaltSpegel: over.summaInbetalt,
    spegelIFas: true,
    deadlineSlutbetalning: null,
    kvittonAttSkicka: 0,
    oskickadeKvitton: [],
    saknas,
    ...over,
  };
}

const OPPNA: OppenBetalning[] = [
  betalning({
    anmalanRecordId: ANNA,
    personNamn: 'Anna Lindqvist',
    gallandePris: 2500,
    summaInbetalt: 1000,
  }),
  betalning({
    anmalanRecordId: BENGT,
    personNamn: 'Bengt Lindqvist',
    gallandePris: 2500,
    summaInbetalt: 0,
  }),
  betalning({
    anmalanRecordId: CECILIA,
    personNamn: 'Cecilia Nord',
    gallandePris: 3500,
    summaInbetalt: 0,
  }),
];

const OPPNA_IDS = new Set(OPPNA.map((b) => b.anmalanRecordId));

/** En minnesrad med bara det som skiljer satt. */
function minnesrad(
  over: Partial<ImportradIMinnet> & Pick<ImportradIMinnet, 'nyckel'>,
): ImportradIMinnet {
  return {
    radnummer: 1,
    belopp: 1500,
    datum: '2026-09-05',
    bankreferens: null,
    namn: 'Anna Swish',
    telefon: '+46701234567',
    meddelande: null,
    matchning: 'omatchad',
    grund: 'Ingen anmälan matchade telefonnumret eller namnet.',
    kandidater: [],
    vald: null,
    tidigareImporterad: null,
    ...over,
  };
}

/* ═══════════════════ KLASSNINGEN (AC #2, AC #5) ═══════════════════ */

test.describe('importradsklass — de fyra tillstånden', () => {
  test('säker: den valda anmälan är fortfarande öppen', () => {
    const rad = minnesrad({ nyckel: 'rad-1', matchning: 'saker', vald: ANNA, kandidater: [ANNA] });
    expect(importradsklass(rad, OPPNA_IDS)).toBe('saker');
  });

  test('osäker: flera kandidater, ingen vald', () => {
    const rad = minnesrad({
      nyckel: 'rad-2',
      matchning: 'osaker',
      kandidater: [ANNA, BENGT],
    });
    expect(importradsklass(rad, OPPNA_IDS)).toBe('osaker');
  });

  test('omatchad: varken vald eller kandidater', () => {
    expect(importradsklass(minnesrad({ nyckel: 'rad-3' }), OPPNA_IDS)).toBe('omatchad');
  });

  test('dubblett: bankreferensen är redan importerad', () => {
    const rad = minnesrad({
      nyckel: 'rad-4',
      bankreferens: '4469411476093487',
      tidigareImporterad: '2026-08-30',
    });
    expect(importradsklass(rad, OPPNA_IDS)).toBe('dubblett');
  });
});

test.describe('importradsklass — rangordningen (negativa kontroller)', () => {
  test('DUBBLETT SLÅR SÄKER: en redan importerad rad blir aldrig förbockad (AC #4)', () => {
    const rad = minnesrad({
      nyckel: 'rad-5',
      matchning: 'saker',
      vald: ANNA,
      kandidater: [ANNA],
      bankreferens: '4469411476093487',
      tidigareImporterad: '2026-08-30',
    });
    // Utan rangordningen hade denna rad klassats `saker` och kommit
    // förbockad in i steget för pengar som redan är bokförda.
    expect(importradsklass(rad, OPPNA_IDS)).toBe('dubblett');
  });

  test('en säker rad vars anmälan stängts faller till omatchad, inte säker', () => {
    const rad = minnesrad({ nyckel: 'rad-6', matchning: 'saker', vald: ANNA, kandidater: [ANNA] });
    const utanAnna = new Set([BENGT, CECILIA]);
    expect(importradsklass(rad, utanAnna)).toBe('omatchad');
  });

  test('en osäker rad vars ENDA kvarvarande kandidat är öppen är fortfarande osäker', () => {
    const rad = minnesrad({ nyckel: 'rad-7', matchning: 'osaker', kandidater: [ANNA, BENGT] });
    expect(importradsklass(rad, new Set([BENGT]))).toBe('osaker');
  });

  test('en osäker rad vars ALLA kandidater stängts faller till omatchad', () => {
    const rad = minnesrad({ nyckel: 'rad-8', matchning: 'osaker', kandidater: [ANNA, BENGT] });
    expect(importradsklass(rad, new Set([CECILIA]))).toBe('omatchad');
  });

  test('tom mängd öppna betalningar gissar aldrig säker', () => {
    const rad = minnesrad({ nyckel: 'rad-9', matchning: 'saker', vald: ANNA, kandidater: [ANNA] });
    expect(importradsklass(rad, new Set())).toBe('omatchad');
  });

  test('tom mängd öppna betalningar rör inte dubbletten', () => {
    const rad = minnesrad({ nyckel: 'rad-10', tidigareImporterad: '2026-08-30' });
    expect(importradsklass(rad, new Set())).toBe('dubblett');
  });
});

test.describe('oppnaKandidater', () => {
  test('behåller ordningen och skär bort de stängda', () => {
    const rad = minnesrad({ nyckel: 'rad-11', kandidater: [ANNA, BENGT, CECILIA] });
    expect(oppnaKandidater(rad, new Set([CECILIA, ANNA]))).toEqual([ANNA, CECILIA]);
  });

  test('läser SAMMA mängd som klassningen: noll öppna kandidater ger tom lista', () => {
    const rad = minnesrad({ nyckel: 'rad-12', matchning: 'osaker', kandidater: [ANNA, BENGT] });
    const stangda = new Set([CECILIA]);
    expect(importradsklass(rad, stangda)).toBe('omatchad');
    expect(oppnaKandidater(rad, stangda)).toEqual([]);
  });
});

/* ═══════════════════ UPPBYGGNADEN UT UR MINNET ═══════════════════ */

test.describe('byggImportsteg — två högar ur en importlista', () => {
  const rader: ImportradIMinnet[] = [
    minnesrad({
      nyckel: 'rad-3',
      radnummer: 3,
      matchning: 'omatchad',
      belopp: 900,
      namn: 'Okänd Betalare',
    }),
    minnesrad({
      nyckel: 'rad-1',
      radnummer: 1,
      matchning: 'saker',
      vald: ANNA,
      kandidater: [ANNA],
      belopp: 1500,
      datum: '2026-09-05',
      bankreferens: 'REF-1',
      namn: 'Anna Swish',
    }),
    minnesrad({
      nyckel: 'rad-2',
      radnummer: 2,
      matchning: 'osaker',
      kandidater: [BENGT, CECILIA],
      belopp: 1000,
      namn: 'Bengt Swish',
    }),
    minnesrad({
      nyckel: 'rad-4',
      radnummer: 4,
      bankreferens: 'REF-4',
      tidigareImporterad: '2026-08-30',
      namn: 'Anna Swish',
    }),
  ];

  test('säkra rader blir stegrader, resten blir obestämda', () => {
    const byggt = byggImportsteg(rader, OPPNA, IDAG, 'Swish');
    expect(byggt.rader.map((r) => r.nyckel)).toEqual([ANNA]);
    expect(byggt.obestamda.map((r) => r.klass)).toEqual(['osaker', 'omatchad', 'dubblett']);
  });

  test('ordningen är FILENS radnummer, inte listans', () => {
    const byggt = byggImportsteg(rader, OPPNA, IDAG, 'Swish');
    expect(byggt.obestamda.map((r) => r.nyckel)).toEqual(['rad-2', 'rad-3', 'rad-4']);
  });

  test('en säker rad bär BANKENS belopp och datum, inte radens förslag (AC #2)', () => {
    const byggt = byggImportsteg(rader, OPPNA, IDAG, 'Swish');
    const rad = byggt.rader[0];
    // Anna har betalat 1 000 av 2 500 — appens eget förslag hade varit
    // resten, 1 500. Här sammanfaller de av en slump; testet nedan gör
    // skillnaden mätbar.
    //
    // REGEX OCH INTE LITERAL: `visaKronor` formaterar via sv-SE, vars
    // tusentalsavskiljare är ett NON-BREAKING SPACE. En literal med vanligt
    // mellanslag faller med ett diff där båda sidor ser IDENTISKA ut (mätt
    // här under bygget, samma fälla som `bekraftelsesteget.staging.test.ts`
    // § REGEX OCH INTE LITERAL bokför).
    expect(rad.belopp).toMatch(/^1\s500$/);
    expect(rad.datum).toBe('2026-09-05');
    expect(rad.markerad).toBe(true);
    expect(rad.import?.bankreferens).toBe('REF-1');
  });

  test('bankens belopp vinner även när det AVVIKER från appens förslag', () => {
    const delbetalning = [
      minnesrad({
        nyckel: 'rad-1',
        radnummer: 1,
        matchning: 'saker',
        vald: ANNA,
        kandidater: [ANNA],
        belopp: 700,
        datum: '2026-09-01',
      }),
    ];
    const byggt = byggImportsteg(delbetalning, OPPNA, IDAG, 'Swish');
    // Appens förslag för Anna är 1 500 (resten). Banken säger 700.
    expect(harledRad(OPPNA[0], IDAG).kvar).toBe(1500);
    expect(byggt.rader[0].belopp).toBe('700');
  });

  test('ett saknat datum i filen faller till idag, aldrig till tomt', () => {
    const utanDatum = [
      minnesrad({
        nyckel: 'rad-1',
        radnummer: 1,
        matchning: 'saker',
        vald: ANNA,
        kandidater: [ANNA],
        datum: null,
      }),
    ];
    expect(byggImportsteg(utanDatum, OPPNA, IDAG, 'Swish').rader[0].datum).toBe(IDAG);
  });

  test('en osäker rads kandidater byggs som inkorgsrader, bäst först och bara de öppna', () => {
    const byggt = byggImportsteg(rader, OPPNA, IDAG, 'Swish');
    const osaker = byggt.obestamda[0];
    expect(osaker.kandidater.map((k) => k.betalning.anmalanRecordId)).toEqual([BENGT, CECILIA]);
    expect(osaker.kandidater[0].namn).toBe('Bengt Lindqvist');
  });

  test('en omatchad och en dubblett bär INGA kandidater', () => {
    const byggt = byggImportsteg(rader, OPPNA, IDAG, 'Swish');
    expect(byggt.obestamda[1].kandidater).toEqual([]);
    expect(byggt.obestamda[2].kandidater).toEqual([]);
  });

  test('dubbletten bär sitt importdatum och en egen grund', () => {
    const byggt = byggImportsteg(rader, OPPNA, IDAG, 'Swish');
    const dubblett = byggt.obestamda[2];
    expect(dubblett.tidigareImporterad).toBe('2026-08-30');
    expect(dubblett.grund).toContain('redan registrerad');
  });

  test('en importrad utan namn i banken faller till husets fallback', () => {
    const namnlos = [minnesrad({ nyckel: 'rad-1', radnummer: 1, namn: null })];
    expect(byggImportsteg(namnlos, OPPNA, IDAG, 'Swish').obestamda[0].namn).toBe('Utan namn');
  });

  test('en manuell rad bär INGEN importkoppling (fältet är frånvarande, inte tomt)', () => {
    const byggt = byggImportsteg(rader, OPPNA, IDAG, 'Swish');
    expect(byggt.rader[0].import).toBeDefined();
    // Kontrasten: `byggRader` (manuella mataren) sätter aldrig fältet.
    // Prövas i `bekraftelsesteg-harledningar.test.ts`; här räcker att
    // importvägen faktiskt sätter det.
    expect(byggt.rader[0].import?.nyckel).toBe('rad-1');
  });
});

/* ═══════════════════ KONVERTERINGEN IN I MINNET ═══════════════════ */

test.describe('tillImportminne', () => {
  function importradstillstand(over: Partial<Importradstillstand> = {}): Importradstillstand {
    return {
      rad: {
        radnummer: 7,
        transaktion: {
          datum: '2026-09-05',
          belopp: 1500,
          namn: 'Anna Swish',
          telefon: '+46709879879',
          meddelande: 'Kursavgift',
          bankreferens: '4469411476093487',
        },
      },
      matchning: {
        klass: 'saker',
        kandidater: [harledRad(OPPNA[0], IDAG)],
        grund: 'Telefonnumret matchar anmälans mobilnummer.',
      },
      vald: ANNA,
      ibockad: true,
      medKvitto: true,
      tidigareImporterad: null,
      utfall: null,
      ...over,
    };
  }

  const parsat: Parsresultat = { rader: [], bortfiltrerade: [], fel: [] };

  test('bär över bankradens sex fält, matchningen och valet', () => {
    const minne = tillImportminne(parsat, [importradstillstand()], {
      filnamn: 'swish.csv',
      bank: 'Handelsbanken',
      skapad: '2026-09-06T08:00:00.000Z',
    });
    expect(minne.rader).toHaveLength(1);
    const rad = minne.rader[0];
    expect(rad.nyckel).toBe('rad-7');
    expect(rad.radnummer).toBe(7);
    expect(rad.belopp).toBe(1500);
    expect(rad.datum).toBe('2026-09-05');
    expect(rad.bankreferens).toBe('4469411476093487');
    expect(rad.namn).toBe('Anna Swish');
    expect(rad.telefon).toBe('+46709879879');
    expect(rad.meddelande).toBe('Kursavgift');
    expect(rad.matchning).toBe('saker');
    expect(rad.kandidater).toEqual([ANNA]);
    expect(rad.vald).toBe(ANNA);
  });

  test('lämnar KVAR listans tre egna fält: ibockad, medKvitto och utfall', () => {
    const minne = tillImportminne(parsat, [importradstillstand()], {
      filnamn: 'swish.csv',
      bank: '',
      skapad: '2026-09-06T08:00:00.000Z',
    });
    // Steget äger bocken, kvittot och utfallet. Fälten får inte smyga med.
    expect(Object.keys(minne.rader[0])).not.toContain('ibockad');
    expect(Object.keys(minne.rader[0])).not.toContain('medKvitto');
    expect(Object.keys(minne.rader[0])).not.toContain('utfall');
  });

  test('räknar parserns två högar', () => {
    const medHogar: Parsresultat = {
      rader: [],
      bortfiltrerade: [
        { radnummer: 1, skal: 'Filens startpost.' },
        { radnummer: 9, skal: 'Utbetalning.' },
      ],
      fel: [{ radnummer: 4, skal: 'Beloppet gick inte att läsa.' }],
    };
    const minne = tillImportminne(medHogar, [importradstillstand()], {
      filnamn: 'swish.csv',
      bank: 'Handelsbanken',
      skapad: '2026-09-06T08:00:00.000Z',
    });
    expect(minne.lasta).toBe(1);
    expect(minne.bortfiltrerade).toBe(2);
    expect(minne.fel).toEqual([{ radnummer: 4, skal: 'Beloppet gick inte att läsa.' }]);
  });
});

/* ═══════════════════ AVKODNINGEN (TOLERANSEN) ═══════════════════ */

test.describe('avkodaImportminne', () => {
  const giltigt = JSON.stringify({
    skapad: '2026-09-06T08:00:00.000Z',
    filnamn: 'swish.csv',
    bank: 'Handelsbanken',
    lasta: 1,
    bortfiltrerade: 0,
    fel: [],
    rader: [minnesrad({ nyckel: 'rad-1' })],
  });

  test('läser ett giltigt minne', () => {
    const minne = avkodaImportminne(giltigt);
    expect(minne?.filnamn).toBe('swish.csv');
    expect(minne?.rader).toHaveLength(1);
  });

  test('tom, null och undefined ger null', () => {
    expect(avkodaImportminne('')).toBeNull();
    expect(avkodaImportminne(null)).toBeNull();
    expect(avkodaImportminne(undefined)).toBeNull();
  });

  test('trasig JSON ger null i stället för att kasta', () => {
    expect(avkodaImportminne('{ inte json')).toBeNull();
  });

  test('ett minne med fel form ger null i stället för halva rader', () => {
    // En äldre version utan `radnummer` skulle annars ha byggt rader vars
    // sortering är `undefined - undefined`.
    expect(avkodaImportminne(JSON.stringify({ skapad: '2026-09-06', rader: [] }))).toBeNull();
    expect(
      avkodaImportminne(
        JSON.stringify({
          skapad: '2026-09-06T08:00:00.000Z',
          filnamn: 'x.csv',
          bank: '',
          lasta: 1,
          bortfiltrerade: 0,
          fel: [],
          rader: [{ nyckel: 'rad-1' }],
        }),
      ),
    ).toBeNull();
  });
});
