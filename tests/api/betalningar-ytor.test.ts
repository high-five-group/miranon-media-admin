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
  inbetalningsBeloppKolumn,
  inbetalningsText,
  inbetalningsUnderdelar,
  kanMakulera,
  kanRadera,
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
    oskickadeKvitton: [],
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
    notering: null,
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

/* ═══════════ TASK-352: KÖA OM ETT ALDRIG-SKICKAT/FALLERAT KVITTO ═══════════ */
//
// Mätt fynd, S113-slutvandringen 2026-08-31: den enda "Skicka igen"-knappen
// för en fallerad rad levde i inkorgens TRANSIENTA utfallsregion (borta efter
// navigering). Anmälans egen rad ("väntar på att skickas") hade ENDAST
// Makulera — inget sätt att köa om, och inget sätt att se VARFÖR ett försök
// hade fallerat innan ett kvitto ens hann skapas.

test('UTFÄRDAT kvitto (aldrig skickat): KÖA OM erbjuds ÄVEN utan känt felskäl — servern avgör om raden är köbar', () => {
  const lage = kvittolage(inbetalning(), [kvitto({ status: 'utfardat', skickadNar: null })]);
  expect(lage.kanKoaOm).toBe(true);
  expect(lage.felskal).toBeNull();
  // Den GAMLA vägen (skickaKvittoIgen) förblir stängd — det är en annan knapp.
  expect(lage.kanSkickaIgen).toBe(false);

  // NEGATIV KONTROLL: buggen ur vandringen var att `kanKoaOm` alltid var
  // `false` för denna gren — raden hade ingen skicka-handling alls.
  const trasigKanKoaOm = () => false;
  expect(trasigKanKoaOm()).not.toBe(lage.kanKoaOm);
});

test('inget jobb har fallerat: inget felskäl och ingen köa-om-knapp på en obesökt rad utan kvitto', () => {
  const lage = kvittolage(inbetalning(), []);
  expect(lage.felskal).toBeNull();
  expect(lage.kanKoaOm).toBe(false);
});

test('senaste kvittojobbet FALLERADE innan ett kvitto hann skapas: felskälet syns, och köa-om erbjuds', () => {
  const skal =
    'Anmälan har flera kvitton som skulle kunna vara originalet (2 st) — Hör av dig till Roger eller Marcus.';
  const lage = kvittolage(inbetalning(), [], skal);

  expect(lage.kvitto).toBeNull();
  expect(lage.text).toBe('Inget kvitto');
  expect(lage.felskal).toBe(skal);
  expect(lage.kanKoaOm).toBe(true);

  // NEGATIV KONTROLL: mätt fynd — raden teg helt om att ett försök redan
  // fallerat, trots att `jobb_rad.skal` bar ett Gunilla-klart skäl.
  const trasigFelskal = () => null;
  expect(trasigFelskal()).not.toBe(lage.felskal);
});

test('SKICKAT kvitto: aldrig felskäl och aldrig köa-om, oavsett vad ett gammalt jobbförsök säger', () => {
  const lage = kvittolage(inbetalning(), [kvitto()], 'ett gammalt fel som inte längre gäller');
  expect(lage.felskal).toBeNull();
  expect(lage.kanKoaOm).toBe(false);
  // Ett kvitto som FAKTISKT gick fram tystar ett eventuellt äldre felförsök.
});

test('MAKULERAT kvitto: aldrig felskäl och aldrig köa-om', () => {
  const lage = kvittolage(inbetalning(), [kvitto({ status: 'makulerat' })], 'ett gammalt fel');
  expect(lage.felskal).toBeNull();
  expect(lage.kanKoaOm).toBe(false);
});

test('MAKULERAD INBETALNING: varken felskäl eller köa-om, trots ett känt jobbfel', () => {
  const makulerad = inbetalning({
    status: 'makulerad',
    makuleradSkal: 'S113 kedjebevis, teststäd',
  });

  expect(kvittolage(makulerad, [], 'ett fel som inte längre är aktionabelt').kanKoaOm).toBe(false);
  expect(kvittolage(makulerad, [], 'ett fel som inte längre är aktionabelt').felskal).toBeNull();
  expect(kvittolage(makulerad, [kvitto({ status: 'utfardat', skickadNar: null })]).kanKoaOm).toBe(
    false,
  );

  // Och en AKTIV inbetalning med samma kvittoläge får fortfarande knappen —
  // regeln får inte ha stängt av köa-om för alla.
  expect(
    kvittolage(inbetalning(), [kvitto({ status: 'utfardat', skickadNar: null })]).kanKoaOm,
  ).toBe(true);
});

test('MAKULERAD INBETALNING skickar aldrig om sitt kvitto — även när kvittot står som skickat', () => {
  // MÄTT I ACCEPTANSVANDRINGEN 2026-08-31 mot staging: Cecilia Ödmans två
  // inbetalningar är makulerade (städade testposter) medan deras kvitton står
  // kvar som `skickat`. Raden erbjöd "Skicka igen" innan denna regel fanns —
  // ett tryck hade skickat om ett kvitto för en betalning som inte gäller.
  const makulerad = inbetalning({
    status: 'makulerad',
    makuleradSkal: 'S113 kedjebevis, teststäd',
  });
  const lage = kvittolage(makulerad, [kvitto({ status: 'skickat' })]);

  expect(lage.kanSkickaIgen).toBe(false);
  // ARKIVET BESTÅR (ADR-128): kvittot ska fortfarande gå att SE.
  expect(lage.kanVisa).toBe(true);
  expect(lage.text).toBe('Kvitto MM-2026-1007 · skickat');

  // NEGATIV KONTROLL: en regel som bara läser KVITTOTS status — vilket var
  // precis vad implementationen gjorde innan vandringen — säger ja här.
  const trasigRegel = (k: Kvitto) => k.status === 'skickat';
  expect(trasigRegel(kvitto({ status: 'skickat' }))).toBe(true);
  expect(trasigRegel(kvitto({ status: 'skickat' }))).not.toBe(lage.kanSkickaIgen);

  // Och en AKTIV inbetalning med samma kvitto får fortfarande sin knapp —
  // regeln får inte ha stängt av "Skicka igen" för alla.
  expect(kvittolage(inbetalning(), [kvitto({ status: 'skickat' })]).kanSkickaIgen).toBe(true);
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

/* ═══════════════════ RADERA / MAKULERA (TASK-346.9 AC #1/#2) ═══════════════ */

test('RADERA: erbjuds för en aktiv inbetalning UTAN kvitto', () => {
  expect(kanRadera(inbetalning({ status: 'aktiv' }), [])).toBe(true);
});

test('RADERA: erbjuds ALDRIG när ett kvitto finns', () => {
  expect(kanRadera(inbetalning({ status: 'aktiv' }), [kvitto()])).toBe(false);

  // NEGATIV KONTROLL: "det finns en rad, alltså kan den raderas" är den
  // enklaste trasiga regeln — den hade låtit Lotta radera en post vars kvitto
  // redan gått ut till en deltagare (`kvitton.inbetalning_id on delete
  // restrict` hade fällt DATABASEN, men UI:t hade visat en knapp som alltid
  // fäller, i stället för att aldrig erbjudas).
  const trasigRadera = () => true;
  expect(trasigRadera()).toBe(true);
  expect(trasigRadera()).not.toBe(kanRadera(inbetalning({ status: 'aktiv' }), [kvitto()]));
});

test('RADERA: erbjuds ALDRIG för en redan makulerad rad', () => {
  expect(kanRadera(inbetalning({ status: 'makulerad' }), [])).toBe(false);
});

test('MAKULERA: erbjuds för en aktiv inbetalning MED kvitto', () => {
  expect(kanMakulera(inbetalning({ status: 'aktiv' }), [kvitto()])).toBe(true);
});

test('MAKULERA: erbjuds ALDRIG utan kvitto — det är RADERAS yta', () => {
  expect(kanMakulera(inbetalning({ status: 'aktiv' }), [])).toBe(false);

  // NEGATIV KONTROLL: en regel som ENDAST läser `status === 'aktiv'` hade
  // erbjudit Makulera på en rad utan kvitto också — bägge knapparna synliga
  // på samma rad, en motsägelse i gränssnittet.
  const trasigMakulera = (i: Inbetalning) => i.status === 'aktiv';
  expect(trasigMakulera(inbetalning({ status: 'aktiv' }))).toBe(true);
  expect(trasigMakulera(inbetalning({ status: 'aktiv' }))).not.toBe(
    kanMakulera(inbetalning({ status: 'aktiv' }), []),
  );
});

test('MAKULERA: erbjuds ALDRIG för en redan makulerad rad — EF:en ger 409', () => {
  expect(kanMakulera(inbetalning({ status: 'makulerad' }), [kvitto()])).toBe(false);
});

test('RADERA och MAKULERA är ALDRIG båda sanna för samma rad', () => {
  for (const kvitton of [[], [kvitto()]] as Kvitto[][]) {
    for (const status of ['aktiv', 'makulerad'] as const) {
      const post = inbetalning({ status });
      expect(kanRadera(post, kvitton) && kanMakulera(post, kvitton)).toBe(false);
    }
  }
});

test('RADERA/MAKULERA: ett UTFÄRDAT (ännu ej skickat) kvitto räknas som "har kvitto" — granskningsfynd runda 2, W1', () => {
  // `kvitto_id` på INBETALNINGEN kopplas av `kopplaKvitto()` EFTER mailet
  // skickats (`kvittojobb.ts`). En rad vars kvitto står `utfardat` (allokerat,
  // inte mailat än) har alltså `kvittoId === null` på inbetalningen trots att
  // kvittot FINNS i ledgern — exakt det tillstånd den gamla proxyn missade.
  const post = inbetalning({ kvittoId: null, status: 'aktiv' });
  const utfardat = kvitto({ status: 'utfardat', skickadNar: null, lagringsnyckel: null });

  expect(kanRadera(post, [utfardat])).toBe(false);
  expect(kanMakulera(post, [utfardat])).toBe(true);

  // NEGATIV KONTROLL: den GAMLA proxyn (`inbetalning.kvittoId === null`)
  // hade sagt raka motsatsen på BÅDA — precis granskningsfyndets scenario:
  // Radera erbjuds (EF:en 409:ar), Makulera göms (återvändsgränd).
  const trasigKanRadera = (i: Inbetalning) => i.kvittoId === null && i.status === 'aktiv';
  const trasigKanMakulera = (i: Inbetalning) => i.kvittoId !== null && i.status === 'aktiv';
  expect(trasigKanRadera(post)).toBe(true);
  expect(trasigKanRadera(post)).not.toBe(kanRadera(post, [utfardat]));
  expect(trasigKanMakulera(post)).toBe(false);
  expect(trasigKanMakulera(post)).not.toBe(kanMakulera(post, [utfardat]));
});

/* ═══════════════════════ RADERNAS ORDNING (AC #3/#4) ═══════════════════════ */

test('senast betald först; saknat betalningsdatum hamnar SIST', () => {
  const gammal = inbetalning({ id: 'a', betalningsdatum: '2026-08-01' });
  const ny = inbetalning({ id: 'b', betalningsdatum: '2026-08-30' });
  const backfill = inbetalning({ id: 'c', betalningsdatum: null, betalsatt: 'Historik' });

  const ordning = sorteraInbetalningar([gammal, backfill, ny]).map((i) => i.id);
  expect(ordning).toEqual(['b', 'a', 'c']);

  // NEGATIV KONTROLL: en STIGANDE sortering (äldst först) lägger den
  // datumlösa backfill-posten ÖVERST, där den läses som den färskaste
  // betalningen — precis tvärtemot vad raden ska säga.
  //
  // ÄRLIG AVGRÄNSNING, bokförd i stället för utjämnad: en naiv FALLANDE
  // sortering med `?? ''` ger av en slump samma ordning som den riktiga
  // implementationen för dessa indata (tomma strängen är minst, alltså sist
  // även fallande). Ett sådant `expect` hade sett ut som en negativ kontroll
  // utan att diskriminera något, och stod här till granskningsrunda 1 av
  // PR #2156. Null-placeringen i FALLANDE riktning skyddas därför inte av
  // ett test — den skillnaden finns inte att mäta. Det som mäts är
  // riktningen, och tie-breaket har sitt eget test nedan.
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

/* ═══════════ BANK-ANATOMINS TVÅ LED (pass 14, 2026-09-01) ═══════════
   Raden renderar sedan bank-anatomin beloppet i en HÖGERKOLUMN med datans
   eget tecken, medan `inbetalningsText` ovan lever kvar som radens
   TILLGÄNGLIGA namn i ord. De två testas var för sig, eftersom det är
   skillnaden mellan dem som är designen — inte en av dem. */

test('beloppskolumnen bär DATANS EGET TECKEN, inte ett absolutbelopp', () => {
  expect(inbetalningsBeloppKolumn(inbetalning({ belopp: 2500 }))).toBe(`${kr('2 500')} kr`);

  // MINUSTECKNET ÄR TYPOGRAFISKT (U+2212), inte ASCII-bindestreck — det är
  // vad `toLocaleString('sv-SE')` skriver, och kolumnen ärver det i stället
  // för att formatera om talet själv.
  const ater = inbetalningsBeloppKolumn(
    inbetalning({ belopp: -500, typ: 'aterbetalning', betalsatt: 'Bankgiro' }),
  );
  expect(ater).toBe('−500 kr');
  expect(ater).not.toContain('-500');

  // NEGATIV KONTROLL: en implementation som tog `Math.abs` (som
  // `inbetalningsBelopp` gör, med avsikt) hade gjort ett uttag och en
  // insättning omöjliga att skilja åt i sifferpelaren.
  expect(ater).not.toBe('500 kr');
});

test('sekundärledet SÄGER "Återbetalning" — minustecknet står aldrig ensamt', () => {
  // PRD berättelse 18 lever kvar: ordet finns på raden, det har bara flyttat
  // från sifferkolumnen till textkolumnen.
  expect(inbetalningsUnderdelar(inbetalning({ belopp: -500, typ: 'aterbetalning' }))).toEqual([
    'Återbetalning',
    '2026-08-30',
  ]);

  // En vanlig inbetalning bär INGET typord — "Inbetalning · 2026-08-30" hade
  // varit brus på varje rad i en lista som per definition är inbetalningar.
  expect(inbetalningsUnderdelar(inbetalning())).toEqual(['2026-08-30']);

  // BETALSÄTTET SAKNAS I BÅDA: det är radens TITELLED sedan bank-anatomin.
  // Utan denna kontroll hade en återinförd `betalsatt` gett "Swish · Swish".
  expect(inbetalningsUnderdelar(inbetalning({ betalsatt: 'Bankgiro' }))).not.toContain('Bankgiro');

  // Okänt datum SÄGS, precis som i `inbetalningsText`.
  expect(inbetalningsUnderdelar(inbetalning({ betalningsdatum: null }))).toEqual(['datum okänt']);
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
