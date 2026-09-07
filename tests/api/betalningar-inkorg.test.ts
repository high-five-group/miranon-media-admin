// Inkorgens härledningar — TASK-346.6 AC #2, #3, #4, #5. PRD TASK-346 DoD #5.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARJE REGEL BÄR SIN EGEN NEGATIVA KONTROLL
// ═══════════════════════════════════════════════════════════════════════════
// PRD:ns DoD #5 kräver att testet "fäller en trasig implementation". Ett test
// som bara påstår `grupperaPerEvent(...).kommande.length === 2` uppfyller inte
// det: en implementation som lade ALLT bland de kommande hade varit grön.
//
// Varje regel prövas därför i TVÅ riktningar: den riktiga implementationen ger
// rätt svar, OCH en trasig variant (skriven här, aldrig i produktionskoden) ger
// ett annat svar på samma indata. De trasiga varianterna är inte halmgubbar -
// de är den enklaste form någon skulle skriva i förbifarten.
//
// api-pure: `inkorg-harledningar.ts` importerar bara `belopp-inmatning.ts` och
// domänens zod-typer (type-only), så modulen kör rakt i Node utan webbläsare.

import { expect, test } from '@playwright/test';
import {
  beloppsutfall,
  grupperaPerEvent,
  harledBeloppsknappar,
  harledKvittoAttSkicka,
  harledRad,
  type InkorgsRad,
  jobbDelutfall,
  kanForhandsgranska,
  matcharSokning,
  rankaTraffar,
} from '@/components/betalningar/inkorg-harledningar';
import type { Jobbstatus, OppenBetalning } from '@/domain/schemas';

const IDAG = '2026-08-31';

/**
 * TUSENTALSAVGRÄNSAREN ÄR U+00A0, INTE ETT VANLIGT BLANKSTEG.
 *
 * `visaKronor` bygger sin sträng med `toLocaleString('sv-SE')`, som ger HÅRT
 * blanksteg - korrekt svensk typografi, och dessutom exakt det tecken
 * `betalningsbelopp.ts` § GRUPPTECKEN accepterar tillbaka vid inklistring.
 *
 * Konstanten står här därför att skillnaden är OSYNLIG i en editor: en
 * förväntad sträng med vanligt blanksteg ger `Expected: "2 500" / Received:
 * "2 500"` - två identiska rader och ett fällt test. Mätt när denna svit
 * skrevs (5 fall föll på precis det). Skriv aldrig av ett belopp med
 * blanksteg för hand här; bygg det med `kr()`.
 */
const NBSP = String.fromCodePoint(0x00a0);

/** Bygger ett förväntat kronbelopp med rätt avgränsartecken. */
const kr = (text: string) => text.replaceAll(' ', NBSP);

/** Bygger en `OppenBetalning` med rimliga defaults; varje test sätter sitt. */
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

/* ═══════════════════════════ RADEN ═══════════════════════════ */

test('kvar räknas ur POSTGRES-summan, inte ur basens saknas-fält', () => {
  // Spegeln släpar: basen tror att 2 500 saknas, Postgres vet att 1 000 kommit
  // in. `kvar` MÅSTE följa Postgres (ADR-128 § Konsekvenser).
  const r = rad({ saknas: 2500, summaInbetalt: 1000, summaInbetaltSpegel: 0, spegelIFas: false });
  expect(r.kvar).toBe(1500);
  expect(r.spegelSlapar).toBe(true);

  // NEGATIV KONTROLL: den trasiga varianten läser `saknas`.
  const trasigKvar = (b: OppenBetalning) => b.saknas;
  expect(trasigKvar(r.betalning)).toBe(2500);
  expect(trasigKvar(r.betalning)).not.toBe(r.kvar);
});

test('klar när Postgres säger fullbetalt, ÄVEN när basen ännu säger att pengar saknas', () => {
  const r = rad({ saknas: 2500, summaInbetalt: 2500, spegelIFas: false });
  expect(r.klar).toBe(true);

  // NEGATIV KONTROLL: en implementation som läste `saknas > 0` hade sagt
  // "inte klar" och begravt raden bland de öppna.
  expect(r.betalning.saknas).toBeGreaterThan(0);
});

test('förfallen bara när deadline PASSERAT; saknad deadline är aldrig förfallen', () => {
  expect(rad({ deadlineSlutbetalning: '2026-08-30' }).forfallen).toBe(true);
  expect(rad({ deadlineSlutbetalning: IDAG }).forfallen).toBe(false);
  expect(rad({ deadlineSlutbetalning: '2026-09-01' }).forfallen).toBe(false);
  expect(rad({ deadlineSlutbetalning: null }).forfallen).toBe(false);

  // NEGATIV KONTROLL: fail-CLOSED hade märkt varje deadline-lös anmälan som
  // förfallen - en anklagelse mot en deltagare vi inte har underlag för.
  const trasigForfallen = (d: string | null) => (d ?? '') < IDAG;
  expect(trasigForfallen(null)).toBe(true);
  expect(rad({ deadlineSlutbetalning: null }).forfallen).toBe(false);
});

test('obekräftad märks, men räknas fortfarande med (ADR-128 beslut 2)', () => {
  expect(rad({ anmalanStatus: 'Obekräftad' }).obekraftad).toBe(true);
  expect(rad({ anmalanStatus: 'Bekräftad (mail skickat)' }).obekraftad).toBe(false);
  // Den obekräftade faller INTE ur listan.
  const vy = grupperaPerEvent([rad({ anmalanStatus: 'Obekräftad' })], IDAG);
  expect(vy.kommande[0].oppna).toHaveLength(1);
});

/* ═══════════════════════════ GRUPPERINGEN ═══════════════════════════ */

test('kommande event grupperas närmast först, tidigare event i egen hink', () => {
  const rader = [
    rad({ anmalanRecordId: 'a', eventId: 'sen', eventStartdatum: '2026-12-01' }),
    rad({ anmalanRecordId: 'b', eventId: 'snart', eventStartdatum: '2026-09-07' }),
    rad({ anmalanRecordId: 'c', eventId: 'gammal', eventStartdatum: '2026-05-01' }),
  ];
  const vy = grupperaPerEvent(rader, IDAG);

  expect(vy.kommande.map((g) => g.nyckel)).toEqual(['snart', 'sen']);
  expect(vy.tidigare.map((g) => g.nyckel)).toEqual(['gammal']);

  // NEGATIV KONTROLL: en gruppering utan tidsdelning hade lagt alla tre bland
  // de kommande, och lördagen hade skymts av gamla skulder (PRD berättelse 26).
  expect(vy.kommande).toHaveLength(2);
  expect(vy.kommande.map((g) => g.nyckel)).not.toContain('gammal');
});

test('ett event som startar I DAG är kommande, inte tidigare', () => {
  const vy = grupperaPerEvent([rad({ eventStartdatum: IDAG })], IDAG);
  expect(vy.kommande).toHaveLength(1);
  expect(vy.tidigare).toHaveLength(0);
});

test('tidigare event sorteras SENAST först - närmast i dag överst i båda hinkarna', () => {
  const rader = [
    rad({ anmalanRecordId: 'a', eventId: 'aldst', eventStartdatum: '2025-01-01' }),
    rad({ anmalanRecordId: 'b', eventId: 'nyast', eventStartdatum: '2026-08-01' }),
  ];
  expect(grupperaPerEvent(rader, IDAG).tidigare.map((g) => g.nyckel)).toEqual(['nyast', 'aldst']);
});

test('event utan startdatum hamnar bland de kommande, och SIST i sin hink', () => {
  const rader = [
    rad({ anmalanRecordId: 'a', eventId: 'utan', eventStartdatum: null, eventNamn: 'Utan datum' }),
    rad({ anmalanRecordId: 'b', eventId: 'med', eventStartdatum: '2026-09-07' }),
  ];
  const vy = grupperaPerEvent(rader, IDAG);
  expect(vy.kommande.map((g) => g.nyckel)).toEqual(['med', 'utan']);

  // NEGATIV KONTROLL: en sortering som behandlade null som tomma strängen hade
  // lagt gruppen FÖRST, som om den låg vid tidens början.
  const trasigNyckel = (d: string | null) => d ?? '';
  expect(trasigNyckel(null) < '2026-09-07').toBe(true);
});

test('klara rader hamnar i sin egen hink och räknas inte som förfallna', () => {
  const rader = [
    rad({ anmalanRecordId: 'oppen', summaInbetalt: 0, deadlineSlutbetalning: '2026-08-01' }),
    rad({ anmalanRecordId: 'klar', summaInbetalt: 2500, deadlineSlutbetalning: '2026-08-01' }),
  ];
  const grupp = grupperaPerEvent(rader, IDAG).kommande[0];
  expect(grupp.oppna.map((r) => r.nyckel)).toEqual(['oppen']);
  expect(grupp.klara.map((r) => r.nyckel)).toEqual(['klar']);
  expect(grupp.forfallna).toBe(1);
});

test('inom en grupp går FÖRFALLNA först, därefter svensk namnordning', () => {
  const rader = [
    rad({ anmalanRecordId: '1', personNamn: 'Åke', deadlineSlutbetalning: '2026-09-30' }),
    rad({ anmalanRecordId: '2', personNamn: 'Bengt', deadlineSlutbetalning: '2026-09-30' }),
    rad({ anmalanRecordId: '3', personNamn: 'Zara', deadlineSlutbetalning: '2026-08-01' }),
  ];
  const grupp = grupperaPerEvent(rader, IDAG).kommande[0];
  expect(grupp.oppna.map((r) => r.namn)).toEqual(['Zara', 'Bengt', 'Åke']);

  // NEGATIV KONTROLL: ren alfabetisk ordning hade begravt den förfallna sist.
  const rentAlfabetiskt = [...rader].map((r) => r.namn).sort((a, b) => a.localeCompare(b, 'sv'));
  expect(rentAlfabetiskt).toEqual(['Bengt', 'Zara', 'Åke']);
});

/* ═══════════════════════════ SÖKNINGEN ═══════════════════════════ */

test('sökning på namn är skiftlägesokänslig och matchar del av namnet', () => {
  const r = rad({ personNamn: 'Cecilia Ödman' });
  expect(matcharSokning(r, 'cecilia')).toBe(true);
  expect(matcharSokning(r, 'ÖDMAN')).toBe(true);
  expect(matcharSokning(r, 'ödm')).toBe(true);
  expect(matcharSokning(r, 'Bengt')).toBe(false);
});

test('tom sökning träffar allt - det är sökfältets viloläge', () => {
  expect(matcharSokning(rad(), '')).toBe(true);
  expect(matcharSokning(rad(), '   ')).toBe(true);
});

test('telefonsökning jämför SIFFRORNA, oavsett hur numret är formaterat', () => {
  const r = rad({ personTelefon: '070-102 12 17' });
  expect(matcharSokning(r, '0701021217')).toBe(true);
  expect(matcharSokning(r, '070 102')).toBe(true);
  expect(matcharSokning(r, '+46 70-102 12 17')).toBe(false); // landsnummer, annat prefix

  // NEGATIV KONTROLL: råtext-jämförelse missar alla tre skrivsätten.
  const trasigTelefon = (t: string | null, term: string) => (t ?? '').includes(term);
  expect(trasigTelefon(r.betalning.personTelefon, '0701021217')).toBe(false);
});

test('för korta siffersträngar läses INTE som telefon - annars blir småbelopp osökbara', () => {
  const r = rad({ personTelefon: '070-100 10 11', gallandePris: 2500, anmalningsavgift: 10 });
  // '10' finns i telefonnumret, men får inte ge en telefonträff.
  // Den enda vägen till true här är beloppsmatchningen mot avgiften.
  expect(matcharSokning(r, '10')).toBe(true);
  const utanBelopp = rad({
    personTelefon: '070-100 10 11',
    anmalningsavgift: null,
    gallandePris: null,
    saknas: null,
  });
  expect(matcharSokning(utanBelopp, '10')).toBe(false);
});

test('beloppssökning matchar pris, avgift, saknas och resterna - men aldrig redan inbetalt', () => {
  const r = rad({ gallandePris: 2500, anmalningsavgift: 1000, summaInbetalt: 400, saknas: 2100 });
  expect(matcharSokning(r, '2500')).toBe(true); // hela priset
  expect(matcharSokning(r, '1000')).toBe(true); // avgiften
  expect(matcharSokning(r, '2 100')).toBe(true); // basens saknas
  expect(matcharSokning(r, '600')).toBe(true); // resten av avgiften
  expect(matcharSokning(r, '2 100,00')).toBe(true); // svensk form

  // 400 är REDAN INBETALT och är inget Lotta kan se på en ny banktransaktion.
  expect(matcharSokning(r, '400')).toBe(false);
  expect(matcharSokning(r, '999')).toBe(false);
});

test('sökrankning: öppna före klara, förfallna före övriga, kommande före tidigare', () => {
  const rader = [
    rad({ anmalanRecordId: 'klar', personNamn: 'Anna Klar', summaInbetalt: 2500 }),
    rad({ anmalanRecordId: 'gammal', personNamn: 'Anna Gammal', eventStartdatum: '2026-01-01' }),
    rad({ anmalanRecordId: 'sen', personNamn: 'Anna Sen', deadlineSlutbetalning: '2026-08-01' }),
    rad({ anmalanRecordId: 'vanlig', personNamn: 'Anna Vanlig' }),
  ];
  expect(rankaTraffar(rader, 'Anna', IDAG).map((r) => r.nyckel)).toEqual([
    'sen',
    'vanlig',
    'gammal',
    'klar',
  ]);

  // NEGATIV KONTROLL: ofiltrerad, osorterad ordning ger en annan lista.
  expect(rader.map((r) => r.nyckel)).not.toEqual(['sen', 'vanlig', 'gammal', 'klar']);
});

/* ═══════════════════════════ BELOPPS-KNAPPARNA ═══════════════════════════ */

test('PRD:ns exempelform: inget inbetalt ger 1 000 anmälningsavgift och 2 500 allt', () => {
  const knappar = harledBeloppsknappar(rad({ summaInbetalt: 0 }));
  expect(knappar).toEqual([
    { nyckel: 'avgift', belopp: 1000, etikett: 'anmälningsavgift' },
    { nyckel: 'allt', belopp: 2500, etikett: 'allt' },
  ]);
});

test('knapparna ANPASSAS efter redan inbetalt', () => {
  // Avgiften betald: bara resten återstår.
  expect(harledBeloppsknappar(rad({ summaInbetalt: 1000 }))).toEqual([
    { nyckel: 'allt', belopp: 1500, etikett: 'resten' },
  ]);
  // Halva avgiften betald: båda knapparna krymper, och etiketterna säger det.
  expect(harledBeloppsknappar(rad({ summaInbetalt: 400 }))).toEqual([
    { nyckel: 'avgift', belopp: 600, etikett: 'resten av anmälningsavgiften' },
    { nyckel: 'allt', belopp: 2100, etikett: 'resten' },
  ]);

  // NEGATIV KONTROLL: en implementation som ignorerade inbetalt hade gett
  // 1 000 och 2 500 i BÅDA fallen - och Lotta hade dubbelbetalt avgiften.
  const trasigaKnappar = (b: OppenBetalning) => [b.anmalningsavgift, b.gallandePris];
  expect(trasigaKnappar(betalning({ summaInbetalt: 1000 }))).toEqual([1000, 2500]);
});

test('föreläsning utan fack ger EN knapp, och den heter allt', () => {
  // Avgift == pris (ADR-128 beslut 6): två knappar med samma tal hade varit
  // ett val utan skillnad.
  const knappar = harledBeloppsknappar(rad({ gallandePris: 500, anmalningsavgift: 500 }));
  expect(knappar).toEqual([{ nyckel: 'allt', belopp: 500, etikett: 'allt' }]);
});

test('okänt pris ger NOLL knappar - ett belopp uppfinns aldrig', () => {
  expect(harledBeloppsknappar(rad({ gallandePris: null, anmalningsavgift: null }))).toEqual([]);
});

test('fullbetald rad ger noll knappar', () => {
  expect(harledBeloppsknappar(rad({ summaInbetalt: 2500 }))).toEqual([]);
});

/* ═══════════════════════════ VAD BELOPPET TÄCKER ═══════════════════════════ */

test('AC #5: ett belopp som täcker båda facken sägs rakt ut', () => {
  const utfall = beloppsutfall(rad({ summaInbetalt: 0 }), 2500);
  expect(utfall.ton).toBe('tacker');
  expect(utfall.text).toBe(`${kr('2 500')} kr täcker anmälningsavgift + slutbetalning.`);
});

test('AC #5: udda belopp visar saknas-resten', () => {
  const utfall = beloppsutfall(rad({ summaInbetalt: 0 }), 700);
  expect(utfall.ton).toBe('delvis');
  expect(utfall.text).toBe(`700 kr registreras. ${kr('1 800')} kr kvar att betala.`);
});

test('ett belopp som täcker exakt avgiften säger det, och resten', () => {
  const utfall = beloppsutfall(rad({ summaInbetalt: 0 }), 1000);
  expect(utfall.text).toBe(
    `${kr('1 000')} kr täcker anmälningsavgiften. ${kr('1 500')} kr kvar att betala.`,
  );
});

test('slutbetalningen efter avgiften nämner INTE facken - de är redan förbi', () => {
  const utfall = beloppsutfall(rad({ summaInbetalt: 1000 }), 1500);
  expect(utfall.ton).toBe('tacker');
  expect(utfall.text).toBe('Inget kvar att betala.');
});

test('föreläsning utan fack nämner aldrig anmälningsavgift', () => {
  const utfall = beloppsutfall(rad({ gallandePris: 500, anmalningsavgift: 500 }), 500);
  expect(utfall.text).toBe('Inget kvar att betala.');
  expect(utfall.text).not.toContain('anmälningsavgift');
});

/* HELTÄCKNINGEN SÄGER SLUTSATSEN, INTE TÄCKNINGSGRADEN (Marcus 2026-09-01).
   Texten var `<belopp> kr täcker hela priset.`; den formen ställde beloppet mot
   ett pris Lotta inte har framför sig och lämnade slutsatsen åt henne. */
test('heltäckning använder domäntermen "kvar att betala", inte "täcker hela priset"', () => {
  // `summaInbetalt: 1000` (avgiften redan betald) + 1500 = den rena
  // heltäckningsgrenen. Fixturen defaultar till `summaInbetalt: 0`, och DÅ
  // träffar 2 500 kr i stället två-facks-grenen nedan — samma `ton`, annan text.
  const utfall = beloppsutfall(rad({ summaInbetalt: 1000 }), 1500);
  expect(utfall.ton).toBe('tacker');
  expect(utfall.text).not.toContain('täcker hela priset');
  expect(utfall.text).toContain('kvar att betala');
});

/* DE ANDRA GRENARNA ÄR ORÖRDA — regressionsvakt. Marcus bytte heltäckningen
   och ingenting annat; två-facks-texten och de två delfallen nämner fortfarande
   facket respektive resten. Utan detta hade en framtida förenkling kunnat dra
   med sig dem i samma svep. */
test('övriga grenar behåller sina texter när heltäckningen byter form', () => {
  // Två fack, båda täckta i ett svep (AC #5:s ordagranna krav).
  expect(beloppsutfall(rad({ summaInbetalt: 0 }), 2500).text).toBe(
    `${kr('2 500')} kr täcker anmälningsavgift + slutbetalning.`,
  );
  // Delfall 1: exakt avgiften, resten kvar.
  expect(beloppsutfall(rad({ summaInbetalt: 0 }), 1000).text).toBe(
    `${kr('1 000')} kr täcker anmälningsavgiften. ${kr('1 500')} kr kvar att betala.`,
  );
  // Delfall 2: udda belopp.
  expect(beloppsutfall(rad({ summaInbetalt: 0 }), 700).text).toBe(
    `700 kr registreras. ${kr('1 800')} kr kvar att betala.`,
  );
});

test('överbetalning sägs rakt ut i stället för att avrundas bort', () => {
  const utfall = beloppsutfall(rad({ summaInbetalt: 0 }), 3000);
  expect(utfall.ton).toBe('over');
  expect(utfall.text).toBe(`${kr('3 000')} kr är 500 kr mer än vad som är kvar att betala.`);

  // NEGATIV KONTROLL: en implementation som klampade resten till noll hade
  // sagt "täcker hela priset" och dolt skrivfelet.
  const trasigRest = Math.max(0, 2500 - 3000);
  expect(trasigRest).toBe(0);
});

test('okänt pris säger att det är okänt, i stället för att gissa', () => {
  const utfall = beloppsutfall(rad({ gallandePris: null }), 1000);
  expect(utfall.ton).toBe('okant');
  expect(utfall.text).toContain('Priset saknas i basen');
});

test('ören räknas utan flyttalsdrift', () => {
  const utfall = beloppsutfall(rad({ gallandePris: 3000.3, summaInbetalt: 1000.1 }), 2000.2);
  expect(utfall.ton).toBe('tacker');
});

/* ═══════════════════════════ JOBBETS DELUTFALL ═══════════════════════════ */

function jobbstatus(rader: { status: 'vantar' | 'pagar' | 'skickat' | 'fel' }[]): Jobbstatus {
  const skickade = rader.filter((r) => r.status === 'skickat').length;
  const fel = rader.filter((r) => r.status === 'fel').length;
  return {
    jobb: {
      id: '11111111-1111-1111-1111-111111111111',
      jobbtyp: 'kvitto',
      status: 'oppet',
      skapadAv: 'lotta',
      skapadNar: '2026-08-31T08:00:00Z',
      avslutadNar: null,
    },
    rader: rader.map((r, i) => ({
      id: `22222222-2222-2222-2222-00000000000${i}`,
      jobbId: '11111111-1111-1111-1111-111111111111',
      jobbtyp: 'kvitto',
      objektId: `33333333-3333-3333-3333-00000000000${i}`,
      status: r.status,
      skal: r.status === 'fel' ? 'Mottagaren avvisade adressen' : null,
      forsok: 1,
      skapadNar: '2026-08-31T08:00:00Z',
      paborjadNar: null,
      avslutadNar: null,
      uppdateradNar: '2026-08-31T08:00:00Z',
      kvittonummer: r.status === 'skickat' ? 'MM-2026-1003' : null,
    })),
    sammanfattning: {
      totalt: rader.length,
      skickade,
      fel,
      kvar: rader.length - skickade - fel,
    },
  };
}

test('inget jobb ger inget utfall', () => {
  expect(jobbDelutfall(undefined)).toBeNull();
});

test('alla skickade ger success', () => {
  const u = jobbDelutfall(jobbstatus([{ status: 'skickat' }, { status: 'skickat' }]));
  expect(u?.klass).toBe('allt-skickat');
  expect(u?.intent).toBe('success');
  expect(u?.rubrik).toBe('2 kvitton skickade');
});

test('ETT skickat kvitto sägs i singular', () => {
  expect(jobbDelutfall(jobbstatus([{ status: 'skickat' }]))?.rubrik).toBe('1 kvitto skickat');

  // NEGATIV KONTROLL: mätt fynd, S113-slutvandringen 2026-08-31 — "1 kvitto
  // skickade" (participet i FEL numerus, plural mot ett singulart huvudord)
  // var faktiskt produktionsbeteende fram till denna fix.
  const trasigRubrik = (n: number) => `${n} ${n === 1 ? 'kvitto' : 'kvitton'} skickade`;
  expect(trasigRubrik(1)).toBe('1 kvitto skickade');
  expect(trasigRubrik(1)).not.toBe(jobbDelutfall(jobbstatus([{ status: 'skickat' }]))?.rubrik);

  // PLURALFORMEN (N>1) ÄR OFÖRÄNDRAD av kongruensfixen — "alla skickade ger
  // success" ovan bevisar det redan ('2 kvitton skickade'); denna rad säger
  // det uttryckligen så båda formerna är testade i samma svep.
  const flera = jobbDelutfall(jobbstatus([{ status: 'skickat' }, { status: 'skickat' }]));
  expect(flera?.rubrik).toBe('2 kvitton skickade');
});

test('delutfall är ALDRIG grönt - ett halvt utfall får inte se helt ut', () => {
  const u = jobbDelutfall(jobbstatus([{ status: 'skickat' }, { status: 'fel' }]));
  expect(u?.klass).toBe('delutfall');
  expect(u?.intent).toBe('warning');
  expect(u?.intent).not.toBe('success');

  // NEGATIV KONTROLL: "minst ett gick fram = lyckat" är den trasiga regeln
  // ADR-067 D3 och `svep/ResultatVy.tsx` uttryckligen förbjuder.
  const trasigIntent = (skickade: number) => (skickade > 0 ? 'success' : 'warning');
  expect(trasigIntent(1)).toBe('success');
  expect(u?.intent).toBe('warning');
});

test('noll skickade är aldrig grönt, ens när jobbet är klart', () => {
  const u = jobbDelutfall(jobbstatus([{ status: 'fel' }, { status: 'fel' }]));
  expect(u?.klass).toBe('inget-skickat');
  expect(u?.intent).toBe('warning');
});

test('ett jobb som ARBETAR är varken lyckat eller misslyckat', () => {
  const vantar = jobbDelutfall(jobbstatus([{ status: 'vantar' }, { status: 'skickat' }]));
  expect(vantar?.klass).toBe('vantar');
  expect(vantar?.intent).toBe('info');

  const pagar = jobbDelutfall(jobbstatus([{ status: 'pagar' }, { status: 'skickat' }]));
  expect(pagar?.klass).toBe('pagar');
  expect(pagar?.rubrik).toBe('Skickar kvitton, 1 av 2 klara');
  // [TASK-362] `pagar` bär SAMMA intent som `vantar` ('info', aldrig
  // 'warning') — det är därför `BetalningsInkorg.tsx`s kompakta, höjd-
  // reserverade statusrad (se `betalningar-inkorg-statusyta-form.test.ts`)
  // kan visa BÅDA klasserna genom samma `min-h-10`-slot utan att en levande
  // "pågår"-fas behöver observeras i DOM för att bevisa att den delar
  // formen: den delar `intent`, och `intent` är vad som styr grenvalet.
  expect(pagar?.intent).toBe('info');

  // NEGATIV KONTROLL: en klassning som bara läste `fel === 0` hade sagt
  // "allt skickat" om ett jobb som knappt börjat.
  const trasigKlass = (fel: number) => (fel === 0 ? 'allt-skickat' : 'delutfall');
  expect(trasigKlass(0)).toBe('allt-skickat');
  expect(vantar?.klass).toBe('vantar');
});

/* ═══════════════════ FÖRHANDSGRANSKNINGEN (TASK-353) ═══════════════════
 *
 * Marcus order 2026-09-01: en "Förhandsgranska"-knapp bredvid "Skicka X
 * kvitton". `kanForhandsgranska` äger regeln för NÄR knappen får erbjudas,
 * så den bedömningen aldrig blir en villkorskedja i JSX.
 *
 * SAMMA TVÅ-RIKTNINGS-DISCIPLIN som resten av filen: varje regel prövas
 * både mot den riktiga implementationen och mot den trasiga variant någon
 * skulle skriva i förbifarten. Den mest närliggande trasiga formen här är
 * "visa knappen på varje rad" — den hade erbjudit förhandsgranskning av
 * kvitton som redan gått i väg, alltså en efterhandsgranskning som utger
 * sig för att kunna ändra något.
 */

test('en rad som ligger i kön med kvitto FÅR förhandsgranskas', () => {
  const rad = { medKvitto: true, inbetalningId: 'i1' };
  expect(kanForhandsgranska(rad, ['i1'])).toBe(true);
});

test('en rad UTAN kvitto får aldrig förhandsgranskas, ens om id:t råkar stå i kön', () => {
  // Kryssrutan var ur ⇒ det finns inget kvitto att granska. Att id:t skulle
  // kunna stå i kön samtidigt är ett omöjligt tillstånd i dag (kön fylls
  // bara av rader med `medKvitto`), och regeln prövas ändå mot det: en
  // härledning som bara läste kön hade sagt `true` här.
  const rad = { medKvitto: false, inbetalningId: 'i1' };
  expect(kanForhandsgranska(rad, ['i1'])).toBe(false);

  // NEGATIV KONTROLL: den trasiga formen "står den i kön så visa knappen".
  const trasig = (id: string, ko: string[]) => ko.includes(id);
  expect(trasig('i1', ['i1'])).toBe(true);
  expect(kanForhandsgranska(rad, ['i1'])).toBe(false);
});

test('en rad vars kvitto REDAN köats får inte förhandsgranskas — kön är tömd', () => {
  // Efter "Skicka N kvitton" töms `vantande`. Raden står kvar i loggen med
  // sitt kvitto på väg, och då är det för sent att granska: en
  // förhandsgranskning som inte kan ändra något är ingen granskning.
  const rad = { medKvitto: true, inbetalningId: 'i1' };
  expect(kanForhandsgranska(rad, [])).toBe(false);

  // NEGATIV KONTROLL: "har raden begärt kvitto?" ensamt hade sagt `true`
  // för varje rad Lotta någonsin registrerat i sessionen — alltså en knapp
  // på skickade kvitton, som är `kanVisa`s uppgift (`panel-harledningar.ts`)
  // och en HELT annan väg: den hämtar en lagrad PDF, denna renderar ett
  // utkast som ännu inte finns.
  const trasig = (r: { medKvitto: boolean }) => r.medKvitto;
  expect(trasig(rad)).toBe(true);
  expect(kanForhandsgranska(rad, [])).toBe(false);
});

test('bara den egna raden — ett annat id i kön öppnar ingen knapp', () => {
  const rad = { medKvitto: true, inbetalningId: 'i1' };
  expect(kanForhandsgranska(rad, ['i2', 'i3'])).toBe(false);

  // NEGATIV KONTROLL: "är kön icke-tom?" hade gett varje rad en knapp så
  // fort NÅGON rad väntade.
  const trasig = (ko: string[]) => ko.length > 0;
  expect(trasig(['i2', 'i3'])).toBe(true);
  expect(kanForhandsgranska(rad, ['i2', 'i3'])).toBe(false);
});

test('regeln är stabil över flera rader i kön — var och en bedöms för sig', () => {
  const ko = ['i1', 'i3'];
  const rader = [
    { medKvitto: true, inbetalningId: 'i1' },
    { medKvitto: true, inbetalningId: 'i2' },
    { medKvitto: false, inbetalningId: 'i3' },
    { medKvitto: true, inbetalningId: 'i3' },
  ];

  expect(rader.map((r) => kanForhandsgranska(r, ko))).toEqual([true, false, false, true]);
});

/* ═══════════════════ KVITTO ATT SKICKA, DURABELT (TASK-367) ═══════════════════
 *
 * Fyndet (S115 Del 2): en registrerad inbetalning utan kvitto låg bara i
 * flikens minne (`vantande`, React-state) — stängs fliken innan Lotta
 * trycker "Skicka N kvitton" är listan borta, trots att Postgres redan vet
 * att inbetalningen väntar. `harledKvittoAttSkicka` bygger samma lista ur
 * `OppenBetalning.oskickadeKvitton`, som EF:en (`hamta-oppna-betalningar`)
 * härleder VARJE hämtning — oberoende av flik, session eller enhet.
 *
 * SAMMA TVÅ-RIKTNINGS-DISCIPLIN som resten av filen.
 */

test('en anmälan med ett oskickat kvitto ger en post, namnet är RADENS, beloppet är INBETALNINGENS', () => {
  const r = rad({
    personNamn: 'Cecilia Örning',
    saknas: 0,
    gallandePris: 2500,
    summaInbetalt: 2500,
    oskickadeKvitton: [{ inbetalningId: 'inb-1', belopp: 2500 }],
  });

  expect(harledKvittoAttSkicka([r], new Set())).toEqual([
    { inbetalningId: 'inb-1', namn: 'Cecilia Örning', belopp: 2500 },
  ]);
});

test('EN ANMÄLAN kan bidra med FLERA poster, avgift och slutbetalning kan båda vänta samtidigt', () => {
  const r = rad({
    personNamn: 'Bengt Lindqvist',
    saknas: 0,
    gallandePris: 2500,
    summaInbetalt: 2500,
    oskickadeKvitton: [
      { inbetalningId: 'inb-avgift', belopp: 1000 },
      { inbetalningId: 'inb-slut', belopp: 1500 },
    ],
  });

  // NEGATIV KONTROLL: en implementation som slog ihop till en anmälan-nivå-
  // summa (`{ inbetalningId: rad.nyckel, namn, belopp: summaInbetalt }`) hade
  // gett EN post på 2500 kr — och "Skicka N kvitton" hade då köat ett
  // inbetalnings-ID (anmälans record-ID) som inte finns i `inbetalningar`-
  // tabellen, vilket `koa-kvitton` fäller på (främmande nyckel).
  expect(harledKvittoAttSkicka([r], new Set())).toEqual([
    { inbetalningId: 'inb-avgift', namn: 'Bengt Lindqvist', belopp: 1000 },
    { inbetalningId: 'inb-slut', namn: 'Bengt Lindqvist', belopp: 1500 },
  ]);
});

test('doljIds utesluter EXAKT den inbetalningen som redan syns i DENNA flikens Registrerat nu-block', () => {
  const r = rad({
    personNamn: 'Astrid Almqvist',
    saknas: 0,
    gallandePris: 1000,
    summaInbetalt: 1000,
    oskickadeKvitton: [{ inbetalningId: 'inb-1', belopp: 1000 }],
  });

  expect(harledKvittoAttSkicka([r], new Set(['inb-1']))).toEqual([]);

  // NEGATIV KONTROLL: en implementation som ignorerade `doljIds` helt hade
  // visat raden i BÅDA sektionerna samtidigt — "Registrerat nu" (sessionens
  // egen logg) OCH "Kvitto att skicka" (den durabla), med två oberoende
  // "Skicka"-knappar för samma inbetalning.
  const utanDoljIds = (rader: readonly InkorgsRad[]) =>
    rader.flatMap((x) =>
      x.betalning.oskickadeKvitton.map((p) => ({
        inbetalningId: p.inbetalningId,
        namn: x.namn,
        belopp: p.belopp,
      })),
    );
  expect(utanDoljIds([r])).toHaveLength(1);
  expect(harledKvittoAttSkicka([r], new Set(['inb-1']))).toHaveLength(0);
});

test('inget oskickat kvitto → tom lista, inte en post med tomt innehåll', () => {
  const r = rad({ saknas: 500 });
  expect(r.betalning.oskickadeKvitton).toEqual([]);
  expect(harledKvittoAttSkicka([r], new Set())).toEqual([]);
});

test('flera anmälningar plattas till EN lista, oberoende av event-gruppering', () => {
  const radA = rad({
    anmalanRecordId: 'rec-a',
    personNamn: 'Anna',
    saknas: 0,
    gallandePris: 1000,
    summaInbetalt: 1000,
    oskickadeKvitton: [{ inbetalningId: 'inb-a', belopp: 1000 }],
  });
  const radB = rad({
    anmalanRecordId: 'rec-b',
    personNamn: 'Björn',
    saknas: 500,
    gallandePris: 2500,
    summaInbetalt: 2000,
    oskickadeKvitton: [{ inbetalningId: 'inb-b', belopp: 1000 }],
  });
  // Björn är fortfarande ÖPPEN (saknas 500 kr) — beviset att härledningen
  // inte kräver `klar: true`. En inbetalning kan behöva ett kvitto oavsett
  // om HELA anmälan är färdigbetald.
  expect(radB.klar).toBe(false);

  expect(harledKvittoAttSkicka([radA, radB], new Set())).toEqual([
    { inbetalningId: 'inb-a', namn: 'Anna', belopp: 1000 },
    { inbetalningId: 'inb-b', namn: 'Björn', belopp: 1000 },
  ]);
});
