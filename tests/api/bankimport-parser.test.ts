// Bankimportens parser och formatigenkänning — TASK-346.10 AC #1.
// PRD TASK-346 DoD #5.
//
// ═══════════════════════════════════════════════════════════════════════════
// FIXTUREN ÄR BANKENS EGNA FILER, INTE HANDSKRIVNA RADER
// ═══════════════════════════════════════════════════════════════════════════
// AC #1 kräver att "Handelsbankens exempelfiler (docs/research/
// swish-rapport-exempel/) är fixtur för komma- och semikolon-varianterna".
// Sviten läser därför de FYRA riktiga filerna från disk. De är hämtade direkt
// från Handelsbankens dokumentserver 2026-08-30 (`curl`, Content-Type
// verifierad — se katalogens README) och är byte för byte vad banken
// publicerar.
//
// Det är skillnaden mot en handskriven fixtur: en sådan hade bevisat att
// parsern läser vad JAG trodde att formatet var. Dessa filer bevisar att den
// läser vad BANKEN faktiskt skickar — inklusive tre egenheter jag inte hade
// hittat på själv, och som var för sig hade gett fel data:
//
//   1. Ingen rubrikrad. Filen bär tre POSTTYPER (01/02/03) och fälten
//      identifieras av sin PLATS. Ett `split` som antog rubriker hade läst
//      startposten som kolumnnamn.
//   2. Exempelfilerna bär 15 fält, specifikationen (v3.1.2, 2024) listar 18.
//      Filerna är daterade 2015 och följer alltså en ÄLDRE formatversion.
//      En parser som krävt 18 fält hade avvisat bankens egna exempel.
//   3. Semikolon-INTRADAG-filen bär ett LEDANDE MELLANSLAG före
//      betalningsreferensen (`Anna Swish; 4469411476093487`). Utan trimning
//      blir dubblettnyckeln en annan sträng än samma referens i dagsfilen —
//      och dubblettskyddet hade tyst slutat gälla mellan två filer.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARJE REGEL BÄR SIN EGEN NEGATIVA KONTROLL (DoD #5)
// ═══════════════════════════════════════════════════════════════════════════
// Varje regel prövas i TVÅ riktningar: den riktiga implementationen ger rätt
// svar, OCH en trasig variant (skriven här, aldrig i produktionskoden) ger
// ett annat svar på samma indata. De trasiga varianterna är inte halmgubbar
// — `text.split(',')` är exakt vad en förbipasserande skulle skriva.
//
// api-pure: `bankimport-parser.ts` importerar bara `belopp-inmatning.ts` och
// en type-only domäntyp, så modulen kör rakt i Node utan webbläsare.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import {
  analyseraFil,
  arHandelsbanksformat,
  beraknaSignatur,
  delaFil,
  delaRad,
  gissaAvgransare,
  HANDELSBANKEN_SWISH,
  harRubrikrad,
  type Kolumnmappning,
  lasDatum,
  mappningsFel,
  matcharSignatur,
  parsaTransaktioner,
} from '@/components/betalningar/bankimport-parser';

const EXEMPELKATALOG = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../docs/research/swish-rapport-exempel',
);

const las = (filnamn: string) => readFileSync(path.join(EXEMPELKATALOG, filnamn), 'utf8');

const KOMMA_DAGLIG = 'handelsbanken-swishrapport-kommaseparerad-daglig.csv';
const SEMIKOLON_DAGLIG = 'handelsbanken-swishrapport-semikolonseparerad-daglig.csv';
const KOMMA_INTRADAG = 'handelsbanken-swishrapport-kommaseparerad-intradag.csv';
const SEMIKOLON_INTRADAG = 'handelsbanken-swishrapport-semikolonseparerad-intradag.csv';

/** Kör en fil genom hela kedjan: analysera, känn igen, läs. */
function korFil(filnamn: string) {
  const innehall = las(filnamn);
  const analys = analyseraFil(innehall);
  expect(analys.igenkand, `${filnamn} ska kännas igen`).not.toBeNull();
  return parsaTransaktioner(innehall, analys.igenkand as Kolumnmappning);
}

/* ═══════════════════════════ CSV-LÄSNINGEN ═══════════════════════════ */

test.describe('delaRad — RFC 4180', () => {
  test('citerat fält får bära avgränsaren utan att kolumnerna förskjuts', () => {
    const falt = delaRad('a,"Berg, Bo",1500.00', ',');
    expect(falt).toEqual(['a', 'Berg, Bo', '1500.00']);
  });

  test('NEGATIV KONTROLL: split(",") förskjuter varje kolumn till höger om namnet', () => {
    // Detta är felklassen som gör ONT: beloppet läses ur namnkolumnen och
    // parsern fäller raden — eller värre, läser ett annat fälts tal.
    const trasigSplit = (rad: string) => rad.split(',');
    expect(trasigSplit('a,"Berg, Bo",1500.00')).toHaveLength(4);
    expect(delaRad('a,"Berg, Bo",1500.00', ',')).toHaveLength(3);
    expect(trasigSplit('a,"Berg, Bo",1500.00')[2]).not.toBe(
      delaRad('a,"Berg, Bo",1500.00', ',')[2],
    );
  });

  test('dubblat citattecken inuti ett citerat fält blir ett enkelt', () => {
    expect(delaRad('x,"Berg, ""Bo""",y', ',')).toEqual(['x', 'Berg, "Bo"', 'y']);
  });

  test('citattecken MITT i ett ociterat fält är text, inte en citatstart', () => {
    // 6" är en tumangivelse, inte ett öppnande citattecken. Läses det som en
    // citatstart sväljs resten av raden.
    expect(delaRad('a,6" bred,b', ',')).toEqual(['a', '6" bred', 'b']);
  });

  test('tomt fält mellan två avgränsare bevaras (specens ,, respektive ;;)', () => {
    expect(delaRad('a,,b', ',')).toEqual(['a', '', 'b']);
    expect(delaRad('a;;b', ';')).toEqual(['a', '', 'b']);
  });
});

test.describe('delaFil — radslut, BOM och radnummer', () => {
  test('CRLF, LF och ensamt CR ger alla samma rader', () => {
    const forvantat = [
      { radnummer: 1, text: 'a' },
      { radnummer: 2, text: 'b' },
    ];
    expect(delaFil('a\r\nb')).toEqual(forvantat);
    expect(delaFil('a\nb')).toEqual(forvantat);
    expect(delaFil('a\rb')).toEqual(forvantat);
  });

  test('bankens filer är CRLF, och läses som tre eller fler rader', () => {
    // Mätt med `file`: "UTF-8 text, with CRLF line terminators".
    expect(las(KOMMA_DAGLIG)).toContain('\r\n');
    expect(delaFil(las(KOMMA_DAGLIG)).length).toBeGreaterThanOrEqual(4);
  });

  test('RADNUMREN är filens egna, tomma rader bortsorterade men inte omnumrerade', () => {
    // Numret är det enda Lotta kan slå upp i sin nedladdade fil.
    expect(delaFil('a\n\n\nb')).toEqual([
      { radnummer: 1, text: 'a' },
      { radnummer: 4, text: 'b' },
    ]);
  });

  test('NEGATIV KONTROLL: omnumrering efter filtrering pekar ut fel rad', () => {
    const trasigNumrering = (innehall: string) =>
      innehall
        .split('\n')
        .filter((text) => text.trim() !== '')
        .map((text, index) => ({ radnummer: index + 1, text }));
    expect(trasigNumrering('a\n\n\nb')[1].radnummer).toBe(2);
    expect(delaFil('a\n\n\nb')[1].radnummer).toBe(4);
  });

  test('UTF-8 BOM strippas, annars blir filens första fält oläsbart', () => {
    // Excel skriver BOM i sina CSV-exporter. Utan strippningen blir
    // posttypen "﻿02" och radfiltret kastar hela filen.
    expect(delaFil('﻿02,x')[0].text).toBe('02,x');
  });
});

/* ═══════════════════════════ FORMATIGENKÄNNINGEN ═══════════════════════════ */

test.describe('gissaAvgransare — MÄTT ur filen, inte antagen', () => {
  test('kommafilen ger komma, semikolonfilen ger semikolon', () => {
    expect(gissaAvgransare(delaFil(las(KOMMA_DAGLIG)))).toBe(',');
    expect(gissaAvgransare(delaFil(las(SEMIKOLON_DAGLIG)))).toBe(';');
    expect(gissaAvgransare(delaFil(las(KOMMA_INTRADAG)))).toBe(',');
    expect(gissaAvgransare(delaFil(las(SEMIKOLON_INTRADAG)))).toBe(';');
  });

  test('NEGATIV KONTROLL: en hårdkodad kommaavgränsare styckar semikolonfilen I BELOPPET', () => {
    // MÄTT, och värre än jag antog när testet skrevs: en komma-läsning av
    // semikolonfilen ger inte EN kolumn utan TVÅ — därför att beloppet
    // "1500,00" självt bär ett komma, som blir en falsk kolumngräns mitt i
    // talet. Fältet på index 7 blir "1500" i stället för "1500,00", och det
    // är ett TAL. Parsern hade alltså inte fällt raden; den hade bokfört
    // 1 500 kronor där banken skrev 1 500,00 — och på ett belopp med ören
    // hade den bokfört fel summa utan att något såg trasigt ut.
    const rader = delaFil(las(SEMIKOLON_DAGLIG));
    const trasigt = delaRad(rader[1].text, ',');
    expect(trasigt).toHaveLength(2);
    expect(trasigt[0].endsWith('1500')).toBe(true);

    const ratt = delaRad(rader[1].text, ';');
    expect(ratt.length).toBeGreaterThan(13);
    expect(ratt[7]).toBe('1500,00');
  });
});

test.describe('arHandelsbanksformat — strukturell signatur, ingen gissning', () => {
  test('alla fyra riktiga exempelfilerna känns igen', () => {
    for (const filnamn of [KOMMA_DAGLIG, SEMIKOLON_DAGLIG, KOMMA_INTRADAG, SEMIKOLON_INTRADAG]) {
      const rader = delaFil(las(filnamn));
      expect(
        arHandelsbanksformat(rader, gissaAvgransare(rader)),
        `${filnamn} ska kännas igen`,
      ).toBe(true);
    }
  });

  test('en vanlig rubrik-CSV känns INTE igen och går till dialogen (AC #1)', () => {
    const nordealik = 'Datum,Namn,Mobilnummer,Belopp\r\n2026-08-30,Anna,+46701234567,1500\r\n';
    const rader = delaFil(nordealik);
    expect(arHandelsbanksformat(rader, gissaAvgransare(rader))).toBe(false);
    expect(analyseraFil(nordealik).igenkand).toBeNull();
  });

  test('en fil UTAN slutpost känns inte igen — alla tre villkoren krävs', () => {
    const stympad =
      '01,2015-04-17,2015-04-16,\r\n02,a,b,c,d,2015-04-16,SWH,1500.00,SEK,x,y,z,m,,t\r\n';
    const rader = delaFil(stympad);
    expect(arHandelsbanksformat(rader, ',')).toBe(false);
  });

  test('NEGATIV KONTROLL: "börjar med 01" ensamt känner igen fel filer', () => {
    // Den troliga genvägen. Ett ordernummer, ett artikelnummer eller ett
    // klockslag kan börja med 01 — och en godtycklig CSV hade då lästs med
    // Handelsbankens kolumnindex, alltså med beloppet ur fel kolumn.
    const trasigSignatur = (text: string) => text.startsWith('01');
    const framling = '01,Anna Andersson,2026-08-30\r\n01,Bo Berg,2026-08-31\r\n';
    expect(trasigSignatur(delaFil(framling)[0].text)).toBe(true);
    expect(arHandelsbanksformat(delaFil(framling), ',')).toBe(false);
  });
});

test.describe('harRubrikrad — härledd, inte antagen', () => {
  test('Handelsbankens fil har INGEN rubrikrad (rad 1 bär datum)', () => {
    const rader = delaFil(las(KOMMA_DAGLIG));
    expect(harRubrikrad(rader, ',')).toBe(false);
  });

  test('en rubrik-CSV känns igen: rad 1 saknar belopp, senare rader har det', () => {
    const rader = delaFil('Datum,Namn,Belopp\r\n2026-08-30,Anna,1500\r\n');
    expect(harRubrikrad(rader, ',')).toBe(true);
  });

  test('NEGATIV KONTROLL: "första raden är alltid rubrik" äter en riktig betalning', () => {
    // Regeln är vanlig och tyst fel på ett posttypsformat: Handelsbankens
    // rad 1 är startposten, och en fil vars rad 1 ÄR en betalning tappar den.
    const trasigRubrik = () => true;
    const rader = delaFil('2026-08-30,Anna,1500\r\n2026-08-30,Bo,2500\r\n');
    expect(trasigRubrik()).toBe(true);
    expect(harRubrikrad(rader, ',')).toBe(false);
  });
});

/* ═══════════════════════════ DATUMLÄSNINGEN ═══════════════════════════ */

test.describe('lasDatum — ISO eller ingenting', () => {
  test('ISO-datum läses, med och utan efterföljande tid', () => {
    expect(lasDatum('2015-04-16')).toBe('2015-04-16');
    expect(lasDatum('2026-08-30 13:32')).toBe('2026-08-30');
    expect(lasDatum('2026-08-30T13:32:22')).toBe('2026-08-30');
  });

  test('tvetydiga former läses INTE — Lotta fyller i i stället (AC #1)', () => {
    // 03/08/2026 är tredje augusti i Sverige och åttonde mars i USA. En
    // parser som väljer åt Lotta väljer fel halva tiden, tyst.
    expect(lasDatum('03/08/2026')).toBeNull();
    expect(lasDatum('30.08.2026')).toBeNull();
    expect(lasDatum('')).toBeNull();
    expect(lasDatum('i går')).toBeNull();
  });

  test('NEGATIV KONTROLL: new Date(...) tolkar 3 augusti som mars — och testet är TIDSZONSOBEROENDE', () => {
    // Talet blir ett datum, och datumet hamnar på kvittot. Det är ett fel som
    // ser ut som ett svar.
    //
    // RÄTTAD (fix-runda 2, granskning runda 1, ERROR-fyndet): asserten fick
    // INTE peka på ett exakt resultatdatum. `new Date('03/08/2026')` läser
    // strängen som amerikansk (mars, inte augusti) och som LOKAL midnatt, så
    // `toISOString().slice(0, 10)` drar av körningens tidszonsförskjutning —
    // `2026-03-07` i Europe/Stockholm, `2026-03-08` i UTC. `api-pure` är
    // SERVERFRI (playwright.config.ts § "API-projekten... är serverfria: pure
    // är rena enhetstester") och läser därför INTE `use.timezoneId` (den
    // sätter webbläsarkontextens tidszon) — `new Date()` följer i stället
    // Node-processens egen TZ, som är UTC på CI-runnern men Europe/Stockholm
    // lokalt. Ett test som pekade på EXAKT `2026-03-07` var därför grönt
    // lokalt och rött i CI (tre identiska fällningar, deterministiskt — inte
    // flakigt). Kontrollen är i stället att resultatet inte är det KORREKTA
    // datumet (`2026-08-03`), oavsett vilken tidszon körningen råkar ha.
    const trasigtDatum = (text: string) => new Date(text).toISOString().slice(0, 10);
    expect(trasigtDatum('03/08/2026')).not.toBe('2026-08-03');
    expect(lasDatum('03/08/2026')).toBeNull();
  });
});

/* ═══════════════════════════ LÄSNINGEN AV BANKENS FILER ═══════════════════════════ */

test.describe('parsaTransaktioner — bankens fyra riktiga filer', () => {
  test('kommaseparerad dagsrapport: TVÅ betalningar, med rätt fält', () => {
    const utfall = korFil(KOMMA_DAGLIG);
    expect(utfall.rader).toHaveLength(2);
    expect(utfall.fel).toEqual([]);

    expect(utfall.rader[0].transaktion).toEqual({
      datum: '2015-04-16',
      belopp: 1500,
      namn: 'Anna Swish',
      telefon: '+46709879879',
      meddelande: 'Meddelande från Anna',
      bankreferens: '4469411476093487',
    });
    expect(utfall.rader[1].transaktion).toEqual({
      datum: '2015-04-16',
      belopp: 2300.5,
      namn: 'Sven Svensson',
      telefon: '+46709873339',
      meddelande: 'Meddelande från Sven ang vad betalningen avser',
      bankreferens: '4469411476093492',
    });
  });

  test('semikolonseparerad dagsrapport ger IDENTISKA transaktioner', () => {
    // Specen: decimaltecknet är punkt i kommafilen och komma i
    // semikolonfilen, avtalat per kund. Samma pengar, två skrivsätt — och
    // parsern får aldrig göra dem till olika belopp.
    const komma = korFil(KOMMA_DAGLIG);
    const semikolon = korFil(SEMIKOLON_DAGLIG);
    expect(semikolon.rader.map((r) => r.transaktion)).toEqual(
      komma.rader.map((r) => r.transaktion),
    );
    expect(semikolon.rader[1].transaktion.belopp).toBe(2300.5);
  });

  test('NEGATIV KONTROLL: Number("2300,50") ger NaN — semikolonfilen kräver normaliseringen', () => {
    const trasigtBelopp = (text: string) => Number(text);
    expect(Number.isNaN(trasigtBelopp('2300,50'))).toBe(true);
    expect(korFil(SEMIKOLON_DAGLIG).rader[1].transaktion.belopp).toBe(2300.5);
  });

  test('INTRADAG-filerna läses likadant som dagsfilerna', () => {
    // Skillnaden mellan dags- och intradagsrapport ligger i STARTPOSTEN (ett
    // klockslag i fält 4), inte i informationsposterna. Filtreras 01-raden
    // bort spelar skillnaden ingen roll — och detta är beviset.
    expect(korFil(KOMMA_INTRADAG).rader.map((r) => r.transaktion)).toEqual(
      korFil(KOMMA_DAGLIG).rader.map((r) => r.transaktion),
    );
  });

  test('LEDANDE MELLANSLAG i semikolon-intradagsfilens referens trimmas bort', () => {
    // Bankens egen fil bär "Anna Swish; 4469411476093487" — ett mellanslag
    // som inte finns i dagsfilen. Utan trimning blir dubblettnyckeln en
    // ANNAN sträng, och skyddet slutar gälla mellan två filer från samma bank.
    expect(las(SEMIKOLON_INTRADAG)).toContain('; 4469411476093487');

    const intradag = korFil(SEMIKOLON_INTRADAG);
    expect(intradag.rader[0].transaktion.bankreferens).toBe('4469411476093487');
    expect(intradag.rader.map((r) => r.transaktion.bankreferens)).toEqual(
      korFil(SEMIKOLON_DAGLIG).rader.map((r) => r.transaktion.bankreferens),
    );
  });

  test('NEGATIV KONTROLL: utan trim blir samma referens två olika nycklar', () => {
    const trasigLas = (falt: string[]) => falt[11];
    const rad = delaFil(las(SEMIKOLON_INTRADAG))[1];
    expect(trasigLas(delaRad(rad.text, ';'))).toBe(' 4469411476093487');
    expect(trasigLas(delaRad(rad.text, ';'))).not.toBe(
      korFil(SEMIKOLON_INTRADAG).rader[0].transaktion.bankreferens,
    );
  });

  test('START- och SLUTPOSTEN filtreras bort och RÄKNAS, aldrig tyst', () => {
    const utfall = korFil(KOMMA_DAGLIG);
    expect(utfall.bortfiltrerade).toHaveLength(2);
    expect(utfall.bortfiltrerade.map((b) => b.radnummer)).toEqual([1, 4]);
    expect(utfall.bortfiltrerade[0].skal).toContain('start');
  });
});

/* ═══════════════════════════ RADFILTRET ═══════════════════════════ */

test.describe('radfiltret — bara SWH är en inbetalning', () => {
  /** Bankens format med en rad per transaktionstyp. */
  const medTyper = (typer: string[]) =>
    [
      '01,2026-08-30,2026-08-30,',
      ...typer.map(
        (typ, i) =>
          `02,5566778899,123456789,HANDSESS,1235524400,2026-08-30,${typ},1500.00,SEK,` +
          `+4670987987${i},Anna Swish,446941147609348${i},Hej,,2026-08-30T13:32:22`,
      ),
      `03,${typer.length}`,
    ].join('\r\n');

  test('SWR, SWT, SWU och SWZ filtreras bort — bara SWH blir en transaktion', () => {
    const innehall = medTyper(['SWH', 'SWR', 'SWT', 'SWU', 'SWZ']);
    const utfall = parsaTransaktioner(innehall, {
      ...HANDELSBANKEN_SWISH,
      avgransare: ',',
    });

    expect(utfall.rader).toHaveLength(1);
    expect(utfall.rader[0].radnummer).toBe(2);
    // De fyra plus start- och slutposten. Sex bortfiltrerade, noll tysta.
    expect(utfall.bortfiltrerade).toHaveLength(6);
    expect(utfall.bortfiltrerade.some((b) => b.skal.includes('inte en inbetalning'))).toBe(true);
  });

  test('NEGATIV KONTROLL: ett filter på ENBART posttypen bokför fyra utbetalningar', () => {
    // Detta är det dyra felet, och skälet till att radfiltret bär TVÅ regler.
    // En utbetalning importerad som inbetalning bokför pengar som aldrig
    // kommit in — och kvittot går till en deltagare som inte betalat.
    const baraPosttyp: Kolumnmappning = {
      ...HANDELSBANKEN_SWISH,
      avgransare: ',',
      radfilter: [HANDELSBANKEN_SWISH.radfilter[0]],
    };
    const innehall = medTyper(['SWH', 'SWR', 'SWT', 'SWU', 'SWZ']);
    expect(parsaTransaktioner(innehall, baraPosttyp).rader).toHaveLength(5);
    expect(
      parsaTransaktioner(innehall, { ...HANDELSBANKEN_SWISH, avgransare: ',' }).rader,
    ).toHaveLength(1);
  });
});

/* ═══════════════════════════ FELHÖGEN ═══════════════════════════ */

test.describe('rader som inte går att läsa SYNS, de försvinner inte', () => {
  const mappning: Kolumnmappning = {
    bank: 'Testbank',
    avgransare: ',',
    harRubrikrad: true,
    radfilter: [],
    kolumner: {
      datum: 0,
      belopp: 1,
      namn: 2,
      telefon: 3,
      meddelande: null,
      bankreferens: 4,
    },
    signatur: null,
  };

  test('tomt belopp, oläsligt belopp och nollbelopp hamnar var för sig i felhögen', () => {
    const innehall = [
      'Datum,Belopp,Namn,Telefon,Referens',
      '2026-08-30,,Anna,+46701234567,r1',
      '2026-08-30,abc,Bo,+46701234568,r2',
      '2026-08-30,0,Cecilia,+46701234569,r3',
      '2026-08-30,1500,David,+46701234570,r4',
    ].join('\r\n');

    const utfall = parsaTransaktioner(innehall, mappning);
    expect(utfall.rader).toHaveLength(1);
    expect(utfall.fel.map((f) => f.radnummer)).toEqual([2, 3, 4]);
    expect(utfall.fel[0].skal).toContain('tom');
    expect(utfall.fel[1].skal).toContain('gick inte att läsa');
    expect(utfall.fel[2].skal).toContain('nollbelopp');
  });

  test('NEGATIVT belopp fälls, det vänds INTE till en inbetalning', () => {
    // `registrera-inbetalning` tar Math.abs() av beloppet för typen
    // `inbetalning` (EF:ens § TECKNET FÖLJER TYPEN). En importerad -1500
    // hade alltså bokförts som +1500 kronor in.
    const innehall = 'Datum,Belopp,Namn,Telefon,Referens\r\n2026-08-30,-1500,Anna,x,r1';
    const utfall = parsaTransaktioner(innehall, mappning);
    expect(utfall.rader).toEqual([]);
    expect(utfall.fel[0].skal).toContain('Negativt belopp');
  });

  test('NEGATIV KONTROLL: Math.abs gör en utbetalning till en inbetalning', () => {
    const trasigAbs = (belopp: number) => Math.abs(belopp);
    expect(trasigAbs(-1500)).toBe(1500);
    const innehall = 'Datum,Belopp,Namn,Telefon,Referens\r\n2026-08-30,-1500,Anna,x,r1';
    expect(parsaTransaktioner(innehall, mappning).rader).toHaveLength(0);
  });

  test('summan av alla tre högarna är filens alla datarader — inget tappas', () => {
    const innehall = [
      'Datum,Belopp,Namn,Telefon,Referens',
      '2026-08-30,1500,Anna,+46701234567,r1',
      '2026-08-30,abc,Bo,+46701234568,r2',
      '2026-08-30,2500,Cecilia,+46701234569,r3',
    ].join('\r\n');

    const utfall = parsaTransaktioner(innehall, mappning);
    const summa = utfall.rader.length + utfall.bortfiltrerade.length + utfall.fel.length;
    expect(summa).toBe(delaFil(innehall).length - 1);
  });

  test('saknad kolumn ger null, inte ett fel — meddelande är frivilligt', () => {
    const innehall = 'Datum,Belopp,Namn,Telefon,Referens\r\n2026-08-30,1500,Anna,x,r1';
    const utfall = parsaTransaktioner(innehall, mappning);
    expect(utfall.rader[0].transaktion.meddelande).toBeNull();
    expect(utfall.fel).toEqual([]);
  });
});

/* ═══════════════════════════ MAPPNINGENS EGEN KONTROLL ═══════════════════════════ */

test.describe('mappningsFel — fångas FÖRE läsningen', () => {
  const bas: Kolumnmappning = {
    bank: 'Nordea',
    avgransare: ',',
    harRubrikrad: true,
    radfilter: [],
    kolumner: {
      datum: 0,
      belopp: 1,
      namn: 2,
      telefon: 3,
      meddelande: null,
      bankreferens: null,
    },
    signatur: null,
  };

  test('en komplett mappning har inget fel', () => {
    expect(mappningsFel(bas)).toBeNull();
  });

  test('utan beloppskolumn fälls mappningen, inte varje enskild rad', () => {
    const utan = { ...bas, kolumner: { ...bas.kolumner, belopp: null } };
    expect(mappningsFel(utan)).toContain('belopp');
  });

  test('utan banknamn kan mappningen inte sparas per bank (AC #1)', () => {
    expect(mappningsFel({ ...bas, bank: '   ' })).toContain('bank');
  });

  test('NEGATIV KONTROLL: utan kontrollen ser en trasig mappning ut som en trasig FIL', () => {
    // Varje rad hamnar i felhögen med "beloppskolumnen är tom" — vilket
    // pekar Lotta mot sin bank i stället för mot dialogen hon just fyllde i.
    const utan = { ...bas, kolumner: { ...bas.kolumner, belopp: null } };
    const innehall = 'Datum,Belopp,Namn,Telefon\r\n2026-08-30,1500,Anna,x';
    expect(parsaTransaktioner(innehall, utan).fel).toHaveLength(1);
    expect(parsaTransaktioner(innehall, utan).rader).toEqual([]);
    expect(mappningsFel(utan)).not.toBeNull();
  });
});

/* ═══════════════════════════ ANALYSEN SOM HELHET ═══════════════════════════ */

test.describe('analyseraFil — vad dialogen får se', () => {
  test('kolumnproven bär rubrik och exempelvärden ur riktiga rader', () => {
    const analys = analyseraFil(
      'Datum,Namn,Belopp\r\n2026-08-30,Anna,1500\r\n2026-08-31,Bo,2500\r\n',
    );
    expect(analys.harRubrikrad).toBe(true);
    expect(analys.kolumner).toHaveLength(3);
    expect(analys.kolumner[1].rubrik).toBe('Namn');
    expect(analys.kolumner[1].exempel).toEqual(['Anna', 'Bo']);
  });

  test('på ett rubriklöst format bär kolumnproven ändå exempel (Lotta ser vad de ÄR)', () => {
    const analys = analyseraFil(las(KOMMA_DAGLIG));
    expect(analys.harRubrikrad).toBe(false);
    expect(analys.kolumner[10].rubrik).toBeNull();
    expect(analys.kolumner[10].exempel).toContain('Anna Swish');
  });

  test('en SPARAD mappning som matchar STRUKTURELLT vinner — ensam kandidat, ingen ambiguitet', () => {
    // En sparad mappning för en RUBRIK-CSV (t.ex. Nordea) är den enda
    // kandidaten: den inbyggda Handelsbanken-profilen är posttypsbaserad och
    // blir aldrig ens en kandidat för en fil med rubrikrad
    // (`arHandelsbanksformat` kräver `01`/`03`-ramposter, som en rubrikrad
    // aldrig bär). Signaturen är beräknad UR SAMMA FIL mappningen prövas
    // mot, precis som `bekraftaMappning` gör i produktionskoden.
    const filinnehall = 'Datum,Namn,Belopp\r\n2026-08-30,Anna,1500\r\n2026-08-31,Bo,2500\r\n';
    const forstaAnalys = analyseraFil(filinnehall);
    const signatur = beraknaSignatur(
      forstaAnalys.rader,
      forstaAnalys.avgransare,
      forstaAnalys.harRubrikrad,
      forstaAnalys.kolumner,
    );

    const egen: Kolumnmappning = {
      bank: 'Min bank',
      avgransare: ',',
      harRubrikrad: true,
      radfilter: [],
      kolumner: {
        datum: 0,
        belopp: 2,
        namn: 1,
        telefon: null,
        meddelande: null,
        bankreferens: null,
      },
      signatur,
    };

    const analys = analyseraFil(filinnehall, [egen]);
    expect(analys.igenkand?.bank).toBe('Min bank');
  });

  test('NEGATIV KONTROLL: rätt avgränsare, rätt bredd, FEL bank — signaturen stoppar pengafällan', () => {
    // Skarpt demonstrerad i granskningen av runda 1 (TASK-346.10): en sparad
    // mappning för en ANNAN bank vann tidigare över den inbyggda,
    // strukturellt verifierade Handelsbanken-profilen bara för att
    // avgränsare och kolumnbredd RÅKADE passa. Utfallet var
    // `belopp = 1 235 524 400 kr` i stället för `1500`, och
    // `bankreferens = 5566778899` på BÅDA raderna i stället för de två
    // unika referenserna — utan någon felsignal.
    //
    // Denna mappning har EXAKT samma avgränsare och kolumnindex som den
    // förra testens `egen` (skulle alltså ha "passat" under den gamla
    // kontrollen) men en signatur sparad för en ANNAN, posttypslös fil.
    const felBank: Kolumnmappning = {
      bank: 'Fel bank (sparad för en annan fil)',
      avgransare: ',',
      harRubrikrad: false,
      radfilter: [],
      kolumner: {
        datum: 5,
        belopp: 7,
        namn: 10,
        telefon: 9,
        meddelande: 12,
        bankreferens: 11,
      },
      signatur: { typ: 'postmarkorer', forstaFalt: '99', sistaFalt: '99' },
    };

    const analys = analyseraFil(las(KOMMA_DAGLIG), [felBank]);

    // Fel bank utesluts ur kandidaterna. Den inbyggda profilen är kvar som
    // EXAKT EN kandidat och väljs i stället — korrekt, inte en gissning.
    expect(analys.igenkand?.bank).toBe(HANDELSBANKEN_SWISH.bank);
    expect(analys.igenkand?.bank).not.toBe(felBank.bank);

    // Och läsningen ger rätt belopp och rätt, UNIKA bankreferenser — inte
    // granskningens 1 235 524 400 kr / dubblerad referens.
    const lasta = parsaTransaktioner(las(KOMMA_DAGLIG), analys.igenkand as Kolumnmappning);
    expect(lasta.rader.map((r) => r.transaktion.belopp)).toEqual([1500, 2300.5]);
    expect(new Set(lasta.rader.map((r) => r.transaktion.bankreferens)).size).toBe(2);
  });

  test('flera strukturellt matchande kandidater → igenkand null, bästa gissning är SPARAD (ordningen inom kandidater)', () => {
    // En sparad mappning kan RÅKA vara en äkta strukturell match för samma
    // fil som den inbyggda profilen redan känner igen (Lotta har manuellt
    // konfigurerat om exakt samma format). Två kandidater är en tvetydighet,
    // och Marcus beslut (2026-08-31) är att en tvetydighet aldrig tystas —
    // dialogen visas, aldrig en tyst gissning, oavsett hur "rätt" båda är.
    const egenMedRattSignatur: Kolumnmappning = {
      bank: 'Min bank (samma format som Handelsbanken)',
      avgransare: ',',
      harRubrikrad: false,
      radfilter: [],
      kolumner: {
        datum: 5,
        belopp: 7,
        namn: 10,
        telefon: 9,
        meddelande: 12,
        bankreferens: 11,
      },
      signatur: { typ: 'postmarkorer', forstaFalt: '01', sistaFalt: '03' },
    };

    const analys = analyseraFil(las(KOMMA_DAGLIG), [egenMedRattSignatur]);

    expect(analys.igenkand).toBeNull();
    // "SPARAD FÖRE INBYGGD" lever vidare som ORDNING inom kandidaterna —
    // bästa gissningen (dialogens förifyllnad) är den sparade, inte den
    // inbyggda, trots att båda strukturellt matchar.
    expect(analys.bastaGissning?.bank).toBe('Min bank (samma format som Handelsbanken)');
  });

  test('en sparad mappning med FEL avgränsare används INTE', () => {
    // Att köra en semikolonmappning på en kommafil hade läst beloppet ur en
    // kolumn som inte finns — tyst, och för varenda rad. Avgränsarvillkoret
    // fäller FÖRE signaturen ens kontrolleras.
    const semikolonmappning: Kolumnmappning = {
      bank: 'Min bank',
      avgransare: ';',
      harRubrikrad: false,
      radfilter: [],
      kolumner: {
        datum: 5,
        belopp: 7,
        namn: 10,
        telefon: 9,
        meddelande: 12,
        bankreferens: 11,
      },
      signatur: { typ: 'postmarkorer', forstaFalt: '01', sistaFalt: '03' },
    };
    const analys = analyseraFil(las(KOMMA_DAGLIG), [semikolonmappning]);
    expect(analys.igenkand?.bank).toBe(HANDELSBANKEN_SWISH.bank);
  });

  test('en sparad mappning som inte RYMS i filens kolumnantal används inte', () => {
    const forBred: Kolumnmappning = {
      bank: 'Min bank',
      avgransare: ',',
      harRubrikrad: true,
      radfilter: [],
      kolumner: {
        datum: 0,
        belopp: 47,
        namn: 1,
        telefon: null,
        meddelande: null,
        bankreferens: null,
      },
      signatur: null,
    };
    const analys = analyseraFil('Datum,Namn,Belopp\r\n2026-08-30,Anna,1500\r\n', [forBred]);
    expect(analys.igenkand).toBeNull();
  });
});

/* ═══════════════════════════ STRUKTURENSIGNATUREN ═══════════════════════════ */
// Fix-runda 2 (TASK-346.10, granskning runda 1, fynd 2/ask-user + Marcus
// beslut 2026-08-31): avgränsare+bredd räcker bevisligen inte. Dessa test
// prövar `beraknaSignatur`/`matcharSignatur` isolerat, utanför
// `analyseraFil`s kandidatval ovan.

test.describe('Strukturensignatur — signaturen stoppar "avgränsare+bredd räcker"-fällan', () => {
  test('matcharSignatur(null, ...) matchar ALDRIG', () => {
    // En mappning utan lagrad signatur (gammalt förskiva-format, eller ett
    // obekräftat working-utkast) är ICKE-matchande, inte "matchar allt".
    const analys = analyseraFil(las(KOMMA_DAGLIG));
    expect(
      matcharSignatur(null, analys.rader, analys.avgransare, analys.harRubrikrad, analys.kolumner),
    ).toBe(false);
  });

  test('postmarkorer: samma första/sista fält matchar, ett annat par gör det inte', () => {
    const analys = analyseraFil(las(KOMMA_DAGLIG));
    const signatur = beraknaSignatur(
      analys.rader,
      analys.avgransare,
      analys.harRubrikrad,
      analys.kolumner,
    );
    expect(signatur).toEqual({ typ: 'postmarkorer', forstaFalt: '01', sistaFalt: '03' });
    expect(
      matcharSignatur(
        signatur,
        analys.rader,
        analys.avgransare,
        analys.harRubrikrad,
        analys.kolumner,
      ),
    ).toBe(true);
    expect(
      matcharSignatur(
        { typ: 'postmarkorer', forstaFalt: '99', sistaFalt: '99' },
        analys.rader,
        analys.avgransare,
        analys.harRubrikrad,
        analys.kolumner,
      ),
    ).toBe(false);
  });

  test('rubrik: fälten måste vara identiska, ordagrant — annan rubriktext matchar inte', () => {
    const filA = analyseraFil('Datum,Namn,Belopp\r\n2026-08-30,Anna,1500\r\n');
    const filB = analyseraFil('Bokföringsdag,Namn,Summa\r\n2026-08-31,Bo,2500\r\n');
    const signaturA = beraknaSignatur(
      filA.rader,
      filA.avgransare,
      filA.harRubrikrad,
      filA.kolumner,
    );
    expect(signaturA).toEqual({ typ: 'rubrik', falt: ['Datum', 'Namn', 'Belopp'] });
    expect(
      matcharSignatur(signaturA, filA.rader, filA.avgransare, filA.harRubrikrad, filA.kolumner),
    ).toBe(true);
    expect(
      matcharSignatur(signaturA, filB.rader, filB.avgransare, filB.harRubrikrad, filB.kolumner),
    ).toBe(false);
  });

  test('en rubrik-signatur matchar aldrig en rubriklös fil, och tvärtom', () => {
    const medRubrik = analyseraFil('Datum,Namn,Belopp\r\n2026-08-30,Anna,1500\r\n');
    const rubrikSignatur = beraknaSignatur(
      medRubrik.rader,
      medRubrik.avgransare,
      medRubrik.harRubrikrad,
      medRubrik.kolumner,
    );

    const utanRubrik = analyseraFil(las(KOMMA_DAGLIG));
    expect(
      matcharSignatur(
        rubrikSignatur,
        utanRubrik.rader,
        utanRubrik.avgransare,
        utanRubrik.harRubrikrad,
        utanRubrik.kolumner,
      ),
    ).toBe(false);

    const postmarkorSignatur = beraknaSignatur(
      utanRubrik.rader,
      utanRubrik.avgransare,
      utanRubrik.harRubrikrad,
      utanRubrik.kolumner,
    );
    expect(
      matcharSignatur(
        postmarkorSignatur,
        medRubrik.rader,
        medRubrik.avgransare,
        medRubrik.harRubrikrad,
        medRubrik.kolumner,
      ),
    ).toBe(false);
  });
});
