// Ytornas härledningar — TASK-346.7 AC #1, #2, #3, #4. PRD TASK-346 DoD #5.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARJE REGEL BÄR SIN EGEN NEGATIVA KONTROLL
// ═══════════════════════════════════════════════════════════════════════════
// Samma disciplin och samma skäl som `betalningar-inkorg.test.ts` (TASK-346.6)
// redan bär: PRD:ns DoD #5 kräver att testet "fäller en trasig
// implementation". Varje regel prövas därför i TVÅ riktningar — den riktiga
// implementationen ger rätt svar, OCH en trasig variant (skriven här, aldrig i
// produktionskoden) ger ett ANNAT svar på samma indata.
//
// De trasiga varianterna är inte halmgubbar. Var och en är den enklaste form
// någon skulle skriva i förbifarten: "läs `saknas`", "sortera på `skapadNar`",
// "matcha på namn", "erbjud Skicka igen så fort det finns ett kvitto".
//
// api-pure: `panel-harledningar.ts` importerar `belopp-inmatning.ts`,
// `inkorg-harledningar.ts` och domänens zod-typer (type-only) — modulen kör
// rakt i Node utan webbläsare.

import { expect, test } from '@playwright/test';
import {
  harledRad,
  type InkorgsRad,
  sammanfattaBetalningar,
} from '@/components/betalningar/inkorg-harledningar';
import {
  inbetalningsText,
  kvittolage,
  personOversikt,
  sorteraInbetalningar,
} from '@/components/betalningar/panel-harledningar';
import type { Inbetalning, Kvitto, OppenBetalning } from '@/domain/schemas';

const IDAG = '2026-08-31';

/** Se `betalningar-inkorg.test.ts` § NBSP: `toLocaleString('sv-SE')` ger U+00A0. */
const NBSP = String.fromCodePoint(0x00a0);
const kr = (text: string) => text.replaceAll(' ', NBSP);

function betalning(over: Partial<OppenBetalning> = {}): OppenBetalning {
  return {
    anmalanRecordId: 'rec1',
    personNamn: 'Astrid Almqvist',
    personEpost: 'astrid@example.com',
    personTelefon: '070-100 10 11',
    eventId: 'ev1',
    eventNamn: 'Fjärrskådning',
    eventStartdatum: '2026-09-07',
    eventTyp: 'Utbildning',
    anmalanStatus: 'Bekräftad (mail skickat)',
    saknas: 2500,
    gallandePris: 2500,
    anmalningsavgift: 1000,
    summaInbetalt: 0,
    summaInbetaltSpegel: 0,
    spegelIFas: true,
    deadlineSlutbetalning: '2026-09-01',
    kvittonAttSkicka: 0,
    ...over,
  };
}

const rad = (over: Partial<OppenBetalning> = {}): InkorgsRad => harledRad(betalning(over), IDAG);

function inbetalning(over: Partial<Inbetalning> = {}): Inbetalning {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    anmalanRecordId: 'rec1',
    ogonblicksbildNamn: 'Astrid Almqvist',
    ogonblicksbildEvent: 'Fjärrskådning',
    ogonblicksbildEventdatum: '2026-09-07',
    belopp: 1000,
    betalsatt: 'Swish',
    betalningsdatum: '2026-08-30',
    typ: 'inbetalning',
    status: 'aktiv',
    makuleradSkal: null,
    makuleradNar: null,
    bankreferens: null,
    kvittoId: null,
    skapadAv: 'lotta@miranonmedia.se',
    skapadNar: '2026-08-30T09:00:00.000Z',
    ...over,
  };
}

function kvitto(over: Partial<Kvitto> = {}): Kvitto {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    kvittonummer: 'MM-2026-1007',
    ar: 2026,
    lopnummer: 1007,
    inbetalningId: '11111111-1111-4111-8111-111111111111',
    lagringsnyckel: 'kvitton/2026/MM-2026-1007.pdf',
    skickadNar: '2026-08-30T09:05:00.000Z',
    mottagare: 'astrid@example.com',
    typ: 'kvitto',
    originalKvittoId: null,
    status: 'skickat',
    skapadNar: '2026-08-30T09:04:00.000Z',
    ...over,
  };
}

/* ═══════════════════════ SAMMANFATTNINGEN (AC #1) ═══════════════════════ */

test('sammanfattningen räknar ICKE-KLARA rader som öppna, inte listans längd', () => {
  // Basen tror att pengar saknas på båda; Postgres vet att den andra är betald.
  const rader = [
    rad({ anmalanRecordId: 'rec1', saknas: 2500, summaInbetalt: 0 }),
    rad({ anmalanRecordId: 'rec2', saknas: 2500, summaInbetalt: 2500, spegelIFas: false }),
  ];
  expect(sammanfattaBetalningar(rader).oppna).toBe(1);

  // NEGATIV KONTROLL: den trasiga varianten räknar listans längd — precis vad
  // en implementation som litade på EF:ens filter hade gjort. Den hade sagt
  // "2 öppna" på Hem medan inkorgen visade en av dem som klar.
  const trasigOppna = (r: InkorgsRad[]) => r.length;
  expect(trasigOppna(rader)).toBe(2);
  expect(trasigOppna(rader)).not.toBe(sammanfattaBetalningar(rader).oppna);
});

test('förfallna räknar bara ÖPPNA förfallna — en betald rad med passerad deadline räknas inte', () => {
  const rader = [
    rad({ anmalanRecordId: 'rec1', deadlineSlutbetalning: '2026-08-01', summaInbetalt: 0 }),
    rad({ anmalanRecordId: 'rec2', deadlineSlutbetalning: '2026-08-01', summaInbetalt: 2500 }),
  ];
  expect(sammanfattaBetalningar(rader).forfallna).toBe(1);

  // NEGATIV KONTROLL: utan `!klar`-villkoret blir varje gammal, fullbetald
  // anmälan en förfallen betalning på Hem — ett larm om en skuld som inte finns.
  const trasigForfallna = (r: InkorgsRad[]) => r.filter((x) => x.forfallen).length;
  expect(trasigForfallna(rader)).toBe(2);
});

test('kvitton att skicka SUMMERAS över raderna, den räknar inte rader med kvitton', () => {
  const rader = [
    rad({ anmalanRecordId: 'rec1', kvittonAttSkicka: 3 }),
    rad({ anmalanRecordId: 'rec2', kvittonAttSkicka: 2 }),
    rad({ anmalanRecordId: 'rec3', kvittonAttSkicka: 0 }),
  ];
  expect(sammanfattaBetalningar(rader).kvittonAttSkicka).toBe(5);

  // NEGATIV KONTROLL: att räkna RADER med väntande kvitton hade gett 2 —
  // Hem hade sagt "2 kvitton att skicka" när fem faktiskt låg i kön.
  const trasigKvitton = (r: InkorgsRad[]) =>
    r.filter((x) => x.betalning.kvittonAttSkicka > 0).length;
  expect(trasigKvitton(rader)).toBe(2);
  expect(trasigKvitton(rader)).not.toBe(sammanfattaBetalningar(rader).kvittonAttSkicka);
});

test('tom lista ger tre nollor, aldrig NaN eller undefined', () => {
  expect(sammanfattaBetalningar([])).toEqual({ oppna: 0, forfallna: 0, kvittonAttSkicka: 0 });
});

/* ═══════════════════════ KVITTOTS LÄGE (AC #2/#3) ═══════════════════════ */

test('utan kvitto: varken Visa eller Skicka igen erbjuds', () => {
  const lage = kvittolage(inbetalning(), []);
  expect(lage.kvitto).toBeNull();
  expect(lage.text).toBe('Inget kvitto');
  expect(lage.kanVisa).toBe(false);
  expect(lage.kanSkickaIgen).toBe(false);
});

test('SKICKAT kvitto: både Visa och Skicka igen', () => {
  const lage = kvittolage(inbetalning(), [kvitto()]);
  expect(lage.text).toBe('Kvitto MM-2026-1007 · skickat');
  expect(lage.kanVisa).toBe(true);
  expect(lage.kanSkickaIgen).toBe(true);
});

test('UTFÄRDAT kvitto väntar på jobbmotorn — Skicka igen erbjuds ALDRIG', () => {
  const lage = kvittolage(inbetalning(), [kvitto({ status: 'utfardat', skickadNar: null })]);
  expect(lage.text).toBe('Kvitto MM-2026-1007 · väntar på att skickas');
  expect(lage.kanVisa).toBe(true);
  expect(lage.kanSkickaIgen).toBe(false);

  // NEGATIV KONTROLL: "det finns ett kvitto, alltså kan det skickas om" är den
  // enklaste trasiga regeln. Den hade bett Lotta åtgärda en rad som redan är
  // på väg — och `skickaKvittoIgen` förutsätter ett REDAN utskickat kvitto
  // (samma PDF, samma nummer), så anropet hade varit meningslöst.
  const trasigSkickaIgen = (k: Kvitto | null) => k !== null;
  expect(trasigSkickaIgen(lage.kvitto)).toBe(true);
  expect(trasigSkickaIgen(lage.kvitto)).not.toBe(lage.kanSkickaIgen);
});

test('MAKULERAT kvitto: syns och kan visas, men skickas aldrig om', () => {
  const lage = kvittolage(inbetalning(), [kvitto({ status: 'makulerat' })]);
  expect(lage.text).toBe('Kvitto MM-2026-1007 · makulerat');
  expect(lage.kanVisa).toBe(true);
  expect(lage.kanSkickaIgen).toBe(false);
});

test('kvitto UTAN sparad PDF kan inte visas — numret ensamt räcker inte', () => {
  const lage = kvittolage(inbetalning(), [kvitto({ lagringsnyckel: null })]);
  expect(lage.kanVisa).toBe(false);
  expect(lage.kanSkickaIgen).toBe(true);

  // NEGATIV KONTROLL: "det finns ett kvittonummer, alltså finns en PDF" hade
  // gett Lotta en Visa-knapp som öppnar ett tomt fönster — `hamta-kvittolank`
  // har ingen fil att signera.
  const trasigKanVisa = (k: Kvitto | null) => k !== null;
  expect(trasigKanVisa(lage.kvitto)).toBe(true);
  expect(trasigKanVisa(lage.kvitto)).not.toBe(lage.kanVisa);
});

test('kvittot paras mot RÄTT inbetalning, aldrig mot listans första', () => {
  const min = inbetalning({ id: '33333333-3333-4333-8333-333333333333' });
  const annans = kvitto({ inbetalningId: '11111111-1111-4111-8111-111111111111' });
  const mitt = kvitto({
    id: '44444444-4444-4444-8444-444444444444',
    kvittonummer: 'MM-2026-1008',
    inbetalningId: min.id,
  });

  expect(kvittolage(min, [annans, mitt]).kvitto?.kvittonummer).toBe('MM-2026-1008');

  // NEGATIV KONTROLL: `kvitton[0]` hade gett Bengts kvittonummer på Astrids
  // rad — och "Visa" hade öppnat fel persons kvitto.
  const trasigPar = (k: Kvitto[]) => k[0];
  expect(trasigPar([annans, mitt]).kvittonummer).toBe('MM-2026-1007');
});

/* ═══════════════════════ RADERNAS ORDNING (AC #3/#4) ═══════════════════════ */

test('senast betald först; saknat betalningsdatum hamnar SIST', () => {
  const gammal = inbetalning({ id: 'a', betalningsdatum: '2026-08-01' });
  const ny = inbetalning({ id: 'b', betalningsdatum: '2026-08-30' });
  const backfill = inbetalning({ id: 'c', betalningsdatum: null, betalsatt: 'Historik' });

  const ordning = sorteraInbetalningar([gammal, backfill, ny]).map((i) => i.id);
  expect(ordning).toEqual(['b', 'a', 'c']);

  // NEGATIV KONTROLL: en ren `localeCompare`-sortering utan null-hantering
  // behandlar den tomma strängen som det TIDIGASTE datumet och lägger
  // backfill-posten först — alltså överst, som om den vore färskast.
  const trasigSortering = [gammal, backfill, ny]
    .slice()
    .sort((x, y) => (y.betalningsdatum ?? '').localeCompare(x.betalningsdatum ?? ''))
    .map((i) => i.id);
  expect(trasigSortering).toEqual(['b', 'a', 'c']);
  const trasigStigande = [gammal, backfill, ny]
    .slice()
    .sort((x, y) => (x.betalningsdatum ?? '').localeCompare(y.betalningsdatum ?? ''))
    .map((i) => i.id);
  expect(trasigStigande[0]).toBe('c');
});

test('samma betalningsdatum avgörs av registreringsögonblicket, inte av slumpen', () => {
  const forst = inbetalning({
    id: 'a',
    betalningsdatum: '2026-08-30',
    skapadNar: '2026-08-30T08:00:00.000Z',
  });
  const sedan = inbetalning({
    id: 'b',
    betalningsdatum: '2026-08-30',
    skapadNar: '2026-08-30T10:00:00.000Z',
  });
  expect(sorteraInbetalningar([forst, sedan]).map((i) => i.id)).toEqual(['b', 'a']);
  expect(sorteraInbetalningar([sedan, forst]).map((i) => i.id)).toEqual(['b', 'a']);
});

test('sorteringen muterar aldrig sin indata', () => {
  const poster = [
    inbetalning({ id: 'a', betalningsdatum: '2026-08-01' }),
    inbetalning({ id: 'b', betalningsdatum: '2026-08-30' }),
  ];
  sorteraInbetalningar(poster);
  expect(poster.map((i) => i.id)).toEqual(['a', 'b']);
});

/* ═══════════════════════ RADENS TEXT ═══════════════════════ */

test('radtexten bär belopp, betalsätt och datum', () => {
  // BARA TUSENTALSAVGRÄNSAREN ÄR U+00A0. Separatorerna runt `·` är VANLIGA
  // blanksteg, skrivna av `inbetalningsText` självt — `kr()` över hela
  // strängen hade bytt även dem och gett två visuellt identiska rader i
  // felutskriften (mätt när denna svit skrevs: exakt det felet).
  expect(inbetalningsText(inbetalning({ belopp: 2500 }))).toBe(
    `${kr('2 500')} kr · Swish · 2026-08-30`,
  );
});

test('återbetalning SÄGS ut i ord, inte som ett ensamt minustecken', () => {
  const text = inbetalningsText(
    inbetalning({ belopp: -500, typ: 'aterbetalning', betalsatt: 'Bankgiro' }),
  );
  expect(text).toBe('500 kr återbetalt · Bankgiro · 2026-08-30');

  // NEGATIV KONTROLL: rå formatering av det negativa talet ger "-500 kr" i en
  // lista med positiva belopp — läses lika lätt som ett skrivfel som en
  // återbetalning.
  expect(text).not.toContain('-500');
});

test('saknat betalningsdatum SÄGS vara okänt, det tystas inte', () => {
  const text = inbetalningsText(inbetalning({ betalningsdatum: null, betalsatt: 'Historik' }));
  expect(text).toContain('datum okänt');
});

/* ═══════════════════════ PERSONENS ÖVERSIKT (AC #4) ═══════════════════════ */

test('personens rader väljs på ANMÄLNINGS-ID, aldrig på namn', () => {
  const min = rad({ anmalanRecordId: 'recMIN', personNamn: 'Astrid Almqvist' });
  const namne = rad({ anmalanRecordId: 'recNAMNE', personNamn: 'Astrid Almqvist' });

  const oversikt = personOversikt([min, namne], ['recMIN']);
  expect(oversikt.rader.map((r) => r.nyckel)).toEqual(['recMIN']);

  // NEGATIV KONTROLL: namn-matchningen — som inkorgens sökläge själv kallar
  // "en känd grovhet" — hade dragit in namnens betalning på fel persons kort,
  // och Lotta hade registrerat en inbetalning på fel anmälan.
  const trasigtUrval = (r: InkorgsRad[], namn: string) => r.filter((x) => x.namn === namn);
  expect(trasigtUrval([min, namne], 'Astrid Almqvist')).toHaveLength(2);
});

test('summan räknas i ören — tre 0,10-rester blir 0,30 och inte 0,30000000000000004', () => {
  const rader = [
    rad({ anmalanRecordId: 'r1', gallandePris: 100.1, summaInbetalt: 100 }),
    rad({ anmalanRecordId: 'r2', gallandePris: 100.1, summaInbetalt: 100 }),
    rad({ anmalanRecordId: 'r3', gallandePris: 100.1, summaInbetalt: 100 }),
  ];
  const oversikt = personOversikt(rader, ['r1', 'r2', 'r3']);
  expect(oversikt.saknasTotalt).toBe(0.3);

  // NEGATIV KONTROLL: rå flyttalsaddition av samma tal.
  const trasigSumma = rader.reduce((s, r) => s + (r.kvar ?? 0), 0);
  expect(trasigSumma).not.toBe(0.3);
});

test('klara anmälningar ingår aldrig i personens öppna', () => {
  const oppen = rad({ anmalanRecordId: 'r1', summaInbetalt: 0 });
  const klar = rad({ anmalanRecordId: 'r2', summaInbetalt: 2500 });
  const oversikt = personOversikt([oppen, klar], ['r1', 'r2']);
  expect(oversikt.rader.map((r) => r.nyckel)).toEqual(['r1']);
  expect(oversikt.saknasTotalt).toBe(2500);
});

test('förfallna först, därefter närmast event — och antalet förfallna räknas', () => {
  const senare = rad({
    anmalanRecordId: 'r1',
    eventStartdatum: '2026-12-01',
    deadlineSlutbetalning: '2026-11-01',
  });
  const tidigare = rad({
    anmalanRecordId: 'r2',
    eventStartdatum: '2026-09-07',
    deadlineSlutbetalning: '2026-09-01',
  });
  const forfallen = rad({
    anmalanRecordId: 'r3',
    eventStartdatum: '2026-10-01',
    deadlineSlutbetalning: '2026-08-01',
  });

  const oversikt = personOversikt([senare, tidigare, forfallen], ['r1', 'r2', 'r3']);
  expect(oversikt.rader.map((r) => r.nyckel)).toEqual(['r3', 'r2', 'r1']);
  expect(oversikt.forfallna).toBe(1);
});

test('anmälan utan pris räknas med via basens saknas, inte som noll', () => {
  const utanPris = rad({ anmalanRecordId: 'r1', gallandePris: null, saknas: 750 });
  const oversikt = personOversikt([utanPris], ['r1']);
  expect(oversikt.rader).toHaveLength(1);
  expect(oversikt.saknasTotalt).toBe(750);

  // NEGATIV KONTROLL: att bara läsa `kvar` (null vid okänt pris) hade tyst
  // gett 0 kr — en person med en öppen skuld hade sett "Saknas 0 kr".
  const trasigSumma = (r: InkorgsRad[]) => r.reduce((s, x) => s + (x.kvar ?? 0), 0);
  expect(trasigSumma([utanPris])).toBe(0);
});

test('tom person: inga rader, noll kronor, noll förfallna', () => {
  expect(personOversikt([], [])).toEqual({ rader: [], saknasTotalt: 0, forfallna: 0 });
});
