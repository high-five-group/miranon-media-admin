// Kontraktstest för bilagornas Eta-ifyllnadsdata (TASK-309.4, ADR-125 §
// Beslut 3+4). api-pure (ren logik, ingen staging, inga creds) —
// `_shared/mall-data.ts`/`_shared/mall-hash.ts` är dual-importable (samma
// mirror-kontrakt som `_shared/receipt-content.ts`), ingen esm.sh-import,
// inget Deno-globalt.
//
// TÄCKER (AC #1:s "enhetstest av ifyllnad ... utan nätverk" — HALVA
// modulen; se `mall-render.test.ts` för ETA-FYLLNINGEN + ESCAPING-halvan,
// som körs mot den FAKTISKA mallen, inte en syntetisk sträng):
//   1. `valjKopia` — kopia vinner över standard, standard gäller när kopia
//      är null.
//   2. `formatSvenskDatum`/`formatSvenskDatumspann` — samma dag, samma
//      månad (kollapsad), olika månad, olika år, ogiltig/saknad input.
//   3. `byggBekraftelseData` — `visaResterande` kräver BÅDA
//      (resterandeBelopp + sistaBetalningsdag), `beskrivning` delas på
//      dubbla radbrytningar, agenda-kopian vinner över standarden.
//   4. `byggDeltagarinfoData` — tomt fält → null (blocket utelämnas i
//      mallen, se mall-render.test.ts), satt fält → strängen.
//   5. `serialiseraKanoniskt`/`berakaKallhash` — nyckelordning påverkar
//      INTE hashen, olika data ger olika hash, samma data ger samma hash.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { summeraKronor } from '../../supabase/functions/_shared/betalningsbelopp';
import { fetMarkera } from '../../supabase/functions/_shared/fet-markering';
import {
  byggBekraftelseData,
  byggDeltagarinfoData,
  byggForsattsbladData,
  byggKvittoData,
  type DocumentSourcesResult,
  type ForsattsbladRadSpec,
  formatSvenskDatum,
  formatSvenskDatumspann,
  stockholmDatumTid,
  valjKopia,
} from '../../supabase/functions/_shared/mall-data';
import { berakaKallhash, serialiseraKanoniskt } from '../../supabase/functions/_shared/mall-hash';
import type { KvittoradSpec } from '../../supabase/functions/_shared/receipt-content';

function tomKopia(standard: string | null = null): {
  standard: string | null;
  kopia: string | null;
} {
  return { standard, kopia: null };
}

type KopiorOverrides = Partial<DocumentSourcesResult['kopior']>;
type AgendaOverride = DocumentSourcesResult['agenda'];

/** Minimal, giltig DocumentSourcesResult-fixture — varje test overridar
 *  bara `kopior`-delfälten och/eller `agenda` det faktiskt provar. */
function fixtureSources(
  kopiorOverrides: KopiorOverrides = {},
  agendaOverride?: AgendaOverride,
): DocumentSourcesResult {
  const bas: DocumentSourcesResult = {
    event: {
      id: 'recEvent1',
      eventNamn: 'Resor i Medvetandet 1',
      typ: 'Utbildning',
      ort: 'Arboga',
      startdatum: '2026-10-31',
      slutdatum: '2026-11-01',
      eventlabel: 'Arboga - Utbildning - Resor i medvetandet 1 - 2026-10-31',
    },
    eventinnehall: { id: 'recEi1', namn: 'Resor i Medvetandet 1 · Utbildning' },
    plats: { id: 'recPlats1', namn: 'Rönninge' },
    agenda: {
      dag1: { standard: [{ text: 'Standardpunkt 1', tid: '', meditation: false }], kopia: null },
      dag2: { standard: [], kopia: null },
    },
    kopior: {
      tid: tomKopia('kl. 10:00 - 17:00'),
      pris: tomKopia('2500'),
      anmalningsavgift: tomKopia('1000'),
      resterandeBelopp: tomKopia('1500'),
      sistaBetalningsdag: { standard: '2026-10-17', kopia: null },
      beskrivning: tomKopia(null),
      forberedelser: tomKopia(null),
      tagMed: tomKopia(null),
      rokning: tomKopia(null),
      parfym: tomKopia(null),
      mat: tomKopia(null),
      overnattning: tomKopia(null),
      utrustning: tomKopia(null),
      adress: tomKopia('Uttringe Hages väg 17'),
      parkering: tomKopia(null),
      transport: tomKopia(null),
      klader: tomKopia(null),
    },
  };
  return {
    ...bas,
    agenda: agendaOverride ?? bas.agenda,
    kopior: { ...bas.kopior, ...kopiorOverrides },
  };
}

test.describe('valjKopia — den ENDA platsen kopia-ELLER-standard-regeln skrivs (ADR-125 § 4)', () => {
  test('kopia vinner när satt', () => {
    expect(valjKopia({ standard: 'A', kopia: 'B' })).toBe('B');
  });
  test('standard gäller när kopia är null', () => {
    expect(valjKopia({ standard: 'A', kopia: null })).toBe('A');
  });
});

test.describe('formatSvenskDatum', () => {
  test('ISO-datum → svensk prosa', () => {
    expect(formatSvenskDatum('2026-10-31')).toBe('31 oktober 2026');
  });
  test('ogiltig/saknad input → null', () => {
    expect(formatSvenskDatum('inte-ett-datum')).toBeNull();
    expect(formatSvenskDatum(null)).toBeNull();
    expect(formatSvenskDatum(undefined)).toBeNull();
  });
});

test.describe('formatSvenskDatumspann', () => {
  test('samma dag → ett datum', () => {
    expect(formatSvenskDatumspann('2026-10-31', '2026-10-31')).toBe('31 oktober 2026');
  });
  test('saknat slutdatum → ett datum', () => {
    expect(formatSvenskDatumspann('2026-10-31', null)).toBe('31 oktober 2026');
  });
  test('samma år+månad → kollapsad dagintervall', () => {
    expect(formatSvenskDatumspann('2026-11-14', '2026-11-15')).toBe('14-15 november 2026');
  });
  test('olika månad, samma år → båda hela datumen', () => {
    expect(formatSvenskDatumspann('2026-10-31', '2026-11-01')).toBe(
      '31 oktober 2026 - 1 november 2026',
    );
  });
  test('olika år → båda hela datumen', () => {
    expect(formatSvenskDatumspann('2026-12-31', '2027-01-01')).toBe(
      '31 december 2026 - 1 januari 2027',
    );
  });
  test('ogiltigt startdatum → tom sträng', () => {
    expect(formatSvenskDatumspann('inte-ett-datum', '2026-11-01')).toBe('');
    expect(formatSvenskDatumspann(null, '2026-11-01')).toBe('');
  });
});

test.describe('byggBekraftelseData', () => {
  test('grundfallet — header + plats (adress + platsnamn kombinerat)', () => {
    const data = byggBekraftelseData(fixtureSources());
    expect(data.kursnamn).toBe('Resor i Medvetandet 1');
    expect(data.plats).toBe('Uttringe Hages väg 17, Rönninge');
    expect(data.datumTid).toBe('31 oktober 2026 - 1 november 2026, kl. 10:00 - 17:00');
    expect(data.pris).toBe('2500');
    expect(data.anmalningsavgift).toBe('1000');
  });

  test('visaResterande kräver BÅDA resterandeBelopp och sistaBetalningsdag', () => {
    const bada = byggBekraftelseData(fixtureSources());
    expect(bada.visaResterande).toBe(true);
    expect(bada.resterandeBelopp).toBe('1500');
    expect(bada.sistaBetalningsdatum).toBe('17 oktober 2026');

    const utanRest = byggBekraftelseData(fixtureSources({ resterandeBelopp: tomKopia(null) }));
    expect(utanRest.visaResterande).toBe(false);

    const utanSista = byggBekraftelseData(
      fixtureSources({ sistaBetalningsdag: { standard: '', kopia: null } }),
    );
    expect(utanSista.visaResterande).toBe(false);
  });

  test('beskrivning delas på dubbla radbrytningar, tomma rader filtreras', () => {
    const data = byggBekraftelseData(
      fixtureSources({ beskrivning: tomKopia('Första stycket.\n\n\nAndra stycket.') }),
    );
    expect(data.beskrivning).toEqual(['Första stycket.', 'Andra stycket.']);
  });

  test('tom beskrivning → tom array (blocket utelämnas i mallen)', () => {
    const data = byggBekraftelseData(fixtureSources());
    expect(data.beskrivning).toEqual([]);
  });

  // ── Att byggBekraftelseData FAKTISKT kör fetMarkera ────────────────────
  //
  // Review-fynd på PR #2025: fetMarkera var enhetstestad isolerat, och
  // mall-render.test.ts matade FÖRBEHANDLAD data in i mallen — men INGET test
  // höll produktionsfunktionen till sitt ansvar. En refaktor som tog bort
  // `.map(fetMarkera)` hade passerat hela sviten grönt och öppnat en levande
  // injektionsväg, eftersom mallen renderar beskrivningen rått (`<%~ %>`).
  //
  // Dessa två testar den kopplingen, inte funktionen i sig.

  test('byggBekraftelseData escapar beskrivningen — HTML från Airtable kan aldrig nå mallen rå', () => {
    const data = byggBekraftelseData(
      fixtureSources({ beskrivning: tomKopia('<script>alert(1)</script>') }),
    );
    expect(data.beskrivning).toEqual(['&lt;script&gt;alert(1)&lt;/script&gt;']);
  });

  test('byggBekraftelseData konverterar **fet** till <strong>', () => {
    const data = byggBekraftelseData(
      fixtureSources({ beskrivning: tomKopia('Boken **Utanför Verkligheten** ligger till grund') }),
    );
    expect(data.beskrivning).toEqual([
      'Boken <strong>Utanför Verkligheten</strong> ligger till grund',
    ]);
  });

  test('agendans KOPIA vinner över standarden när eventet har en egen agenda', () => {
    const data = byggBekraftelseData(
      fixtureSources(
        {},
        {
          dag1: {
            standard: [{ text: 'Standard', tid: '', meditation: false }],
            kopia: [{ text: 'Egen punkt', tid: '10 min', meditation: true }],
          },
          dag2: { standard: [], kopia: null },
        },
      ),
    );
    expect(data.dagEttAgenda).toEqual([{ text: 'Egen punkt', tid: '10 min', meditation: true }]);
    expect(data.dagTvaAgenda).toEqual([]);
  });
});

test.describe('byggDeltagarinfoData', () => {
  test('satt fält → strängen; tomt fält → null (blocket utelämnas)', () => {
    const data = byggDeltagarinfoData(
      fixtureSources({ forberedelser: tomKopia('Kom i tid.'), klader: tomKopia(null) }),
    );
    expect(data.forberedelser).toBe('Kom i tid.');
    expect(data.klader).toBeNull();
  });

  test('eventets egen kopia vinner över Eventinnehållets standard', () => {
    const data = byggDeltagarinfoData(
      fixtureSources({ forberedelser: { standard: 'Standardtext', kopia: 'Eventets egen text' } }),
    );
    expect(data.forberedelser).toBe('Eventets egen text');
  });
});

// [TASK-309.5] byggKvittoData — indatan är KvittoradSpec (Lotta-inmatat vid
// sändningstillfället), INTE DocumentSourcesResult, se filhuvudets not.
function kvittoSpec(overrides: Partial<KvittoradSpec> = {}): KvittoradSpec {
  return {
    kvittonummer: 'MM-2026-1001',
    kundnamn: 'Anna Andersson',
    kundEpost: 'anna.andersson@example.com',
    belopp: 2500,
    betalsatt: 'Swish',
    betalning: 'avgift',
    eventNamn: 'Resor i medvetandet 1',
    datum: '2026-08-03T00:00:00.000Z',
    eventTyp: 'Utbildning',
    eventStart: '2026-07-25',
    eventSlut: '2026-07-26',
    bokforingstext: 'personlig utveckling, meditation',
    // [TASK-346.5] Default satt (INTE null) — samma fixturvärde som
    // `docs/mallar/bilagor/fixtures/kvitto.exempel.json`, medvetet skilt
    // från `datum` för att bevisa att raderna kan avvika (se testerna
    // nedan för `null`-fallet).
    betalningsdatum: '2026-08-01',
    ...overrides,
  };
}

test.describe('byggKvittoData (TASK-309.5, ADR-125 § Beslut 4-5)', () => {
  test('Rogers facit — netto/moms/brutto, Rogers eget beloppsformat (sv-SE, två decimaler, ingen valutakod)', () => {
    const data = byggKvittoData(kvittoSpec());
    expect(data.netto).toBe('2 000,00');
    expect(data.moms).toBe('500,00');
    expect(data.brutto).toBe('2 500,00');
  });

  test('datum är ISO (formatKvittoDatum) — kvittot är en bokföringshandling', () => {
    const data = byggKvittoData(kvittoSpec({ datum: '2026-08-03T00:00:00.000Z' }));
    expect(data.datum).toBe('2026-08-03');
  });

  // [TASK-346.5, ADR-128 § Beslut 1/9] "Betalningsdatum"-raden — ett SKILT
  // fält från `datum` (utfärdandedagen). Fixturens värden avviker medvetet
  // (2026-08-01 vs 2026-08-03) för att bevisa att de INTE är samma fält
  // som råkar formateras lika.
  test('betalningsdatum är ISO och SKILT från datum — de kan avvika', () => {
    const data = byggKvittoData(
      kvittoSpec({ datum: '2026-08-03T00:00:00.000Z', betalningsdatum: '2026-08-01' }),
    );
    expect(data.betalningsdatum).toBe('2026-08-01');
    expect(data.datum).toBe('2026-08-03');
    expect(data.betalningsdatum).not.toBe(data.datum);
  });

  test('betalningsdatum: null (backfillad historisk inbetalning, ADR-128 beslut 8) ger "-", inte "undefined"/"null"', () => {
    const data = byggKvittoData(kvittoSpec({ betalningsdatum: null }));
    expect(data.betalningsdatum).toBe('-');
  });

  // [TASK-346.5, förberedd för 346.9, AC #5] Kreditkvittots mallvariant —
  // TOKEN förberedd, INTE aktiverad: `typ`/`hanvisningTillKvittonummer`
  // utelämnas av VARJE befintlig anropssite i dag.
  test('rubrik/hanvisning DEFAULTAR till ett vanligt kvitto när typ/hanvisningTillKvittonummer utelämnas (nuvarande läge, ingen anropssite sätter dem)', () => {
    const data = byggKvittoData(kvittoSpec());
    expect(data.rubrik).toBe('Kvitto');
    expect(data.hanvisning).toBe('');
  });

  test('rubrik blir "Kreditkvitto" när typ === "kreditkvitto" (346.9 aktiverar detta senare)', () => {
    const data = byggKvittoData(kvittoSpec({ typ: 'kreditkvitto' }));
    expect(data.rubrik).toBe('Kreditkvitto');
  });

  test('hanvisning byggs som "Kvitto <nummer>" när hanvisningTillKvittonummer är satt', () => {
    const data = byggKvittoData(kvittoSpec({ hanvisningTillKvittonummer: 'MM-2026-1001' }));
    expect(data.hanvisning).toBe('Kvitto MM-2026-1001');
  });

  test('benamning byggs via kvittoBenamning (TASK-306 rättelsevarv-formen)', () => {
    const data = byggKvittoData(kvittoSpec());
    expect(data.benamning).toBe('Utbildning 2026-07-25/26, personlig utveckling, meditation');
  });

  test('kvittonummer/kundnamn/kundEpost tradas oformaterade rakt igenom', () => {
    const data = byggKvittoData(
      kvittoSpec({
        kvittonummer: 'FÖRHANDSVISNING',
        kundnamn: 'Exempelperson',
        kundEpost: 'x@example.com',
      }),
    );
    expect(data.kvittonummer).toBe('FÖRHANDSVISNING');
    expect(data.kundnamn).toBe('Exempelperson');
    expect(data.kundEpost).toBe('x@example.com');
  });

  test('org-fälten kommer från MIRANON_ORG, ALDRIG platshållartext', () => {
    const data = byggKvittoData(kvittoSpec());
    expect(data.orgNamn).toBe('Miranon Media AB');
    expect(data.orgReferens).toBe('Miranon Media/Lotta Gotthardsson');
    expect(data.orgNummer).toBe('559540-5498');
    expect(data.orgGatuadress).toBe('Uttringe Hages väg 17');
    expect(data.orgPostadress).toBe('144 63 Rönninge');
    expect(data.orgLand).toBe('Sverige');
    expect(data.orgMomsregnummer).toBe('SE559540549801');
  });

  test('samtliga arton fält i KvittoMallData är satta (inget "undefined")', () => {
    const data = byggKvittoData(kvittoSpec());
    const nycklar = [
      'kvittonummer',
      'datum',
      'betalningsdatum',
      'orgReferens',
      'kundnamn',
      'kundEpost',
      'rubrik',
      'benamning',
      'netto',
      'moms',
      'brutto',
      'orgNamn',
      'orgGatuadress',
      'orgPostadress',
      'orgLand',
      'orgNummer',
      'orgMomsregnummer',
      'hanvisning',
    ] as const;
    expect(nycklar).toHaveLength(18);
    for (const nyckel of nycklar) {
      expect(data[nyckel]).not.toBeUndefined();
      expect(typeof data[nyckel]).toBe('string');
    }
  });

  // [AC #2, "byte-identiska för samma indata"] REN funktion av `spec` — en
  // ANNAN spec-instans med samma VÄRDEN ger EXAKT samma resultat. Detta är
  // api-pure-halvan av AC #2:s bevis: preview-receipt och send-receipt-email
  // anropar BÅDA byggKvittoData(spec) → renderaMallPdf('kvitto', …) med
  // strukturellt identisk spec-form (samma fält, se `_shared/send-receipt.ts`
  // ReceiptPdfBuilder), så identisk spec MÅSTE ge identisk Eta-data — den
  // faktiska DocRaptor-renderingen (samma HTML in → samma PDF ut) bevisas
  // skarpt i tests/api/preview-receipt.staging.test.ts.
  test('REN funktion — två separata anrop med samma spec-VÄRDEN ger djupt identiskt resultat', () => {
    const specA = kvittoSpec();
    const specB = { ...kvittoSpec() }; // ny objekt-identitet, samma värden
    expect(byggKvittoData(specA)).toEqual(byggKvittoData(specB));
  });

  test('olika belopp ger olika netto/moms/brutto (negativ kontroll — inte alltid samma svar)', () => {
    const dataA = byggKvittoData(kvittoSpec({ belopp: 2500 }));
    const dataB = byggKvittoData(kvittoSpec({ belopp: 1000 }));
    expect(dataA.brutto).not.toBe(dataB.brutto);
    expect(dataA.netto).not.toBe(dataB.netto);
  });
});

test.describe('stockholmDatumTid (TASK-370.2)', () => {
  test('sommartid (CEST, UTC+2) — 2026-09-03T12:00:00Z blir 2026-09-03 14:00', () => {
    expect(stockholmDatumTid(new Date('2026-09-03T12:00:00.000Z'))).toBe('2026-09-03 14:00');
  });

  test('vintertid (CET, UTC+1) — 2026-01-15T12:00:00Z blir 2026-01-15 13:00', () => {
    expect(stockholmDatumTid(new Date('2026-01-15T12:00:00.000Z'))).toBe('2026-01-15 13:00');
  });

  test('dygnsgräns — sen kväll UTC rullar över till nästa dag i Stockholm', () => {
    // 2026-09-03T22:30:00Z är sommartid (+2) -> 2026-09-04 00:30 i Stockholm.
    expect(stockholmDatumTid(new Date('2026-09-03T22:30:00.000Z'))).toBe('2026-09-04 00:30');
  });

  test('timme/minut är alltid två siffror (Intl 2-digit) — inte "9:5"', () => {
    // 2026-01-01T08:05:00Z -> Stockholm CET (+1) -> 09:05.
    expect(stockholmDatumTid(new Date('2026-01-01T08:05:00.000Z'))).toBe('2026-01-01 09:05');
  });
});

function forsattsbladRad(overrides: Partial<ForsattsbladRadSpec> = {}): ForsattsbladRadSpec {
  return {
    namn: 'Anna Andersson',
    epost: 'anna.andersson@example.com',
    event: 'Resor i medvetandet 1',
    belopp: 2500,
    betalsatt: 'Swish',
    ...overrides,
  };
}

test.describe('byggForsattsbladData (TASK-370.2, PRD TASK-370 § Implementationsbeslut)', () => {
  const NU = new Date('2026-09-03T12:00:00.000Z');

  test('antal = radernas längd', () => {
    const data = byggForsattsbladData([forsattsbladRad(), forsattsbladRad()], NU);
    expect(data.antal).toBe(2);
  });

  test('rätt radantal och rätt fält per rad, i GIVEN ordning (PRD användarberättelse 8)', () => {
    const rader = [
      forsattsbladRad({ namn: 'Anna Andersson', belopp: 2500 }),
      forsattsbladRad({ namn: 'Bengt Bengtsson', belopp: 1200, betalsatt: 'Bankgiro' }),
    ];
    const data = byggForsattsbladData(rader, NU);
    expect(data.rader).toHaveLength(2);
    expect(data.rader[0].namn).toBe('Anna Andersson');
    expect(data.rader[1].namn).toBe('Bengt Bengtsson');
    expect(data.rader[1].betalsatt).toBe('Bankgiro');
  });

  test('summan är RÄTT (2500 + 1200 = 3700), formaterad "SEK 3 700,00"', () => {
    const data = byggForsattsbladData(
      [forsattsbladRad({ belopp: 2500 }), forsattsbladRad({ belopp: 1200 })],
      NU,
    );
    expect(data.summa).toBe('SEK 3 700,00');
  });

  test('summan räknas med summeraKronor (heltalsören) — INTE rå flyttalsaddition (review-fynd runda 1, regressionsbevis)', () => {
    // NEGATIVT BEVIS, MÄTT (Node): 1000.10 + 2000.20 + 0.30 med rå
    // flyttalsaddition är INTE exakt 3000.6 — `(1000.1 + 2000.2 + 0.3)`
    // ger `3000.6000000000004`. Detta ÄR precis den drift
    // `summeraKronor`s eget filhuvud citerar ("0.1 + 0.2 !== 0.3 gäller
    // lika mycket för 1000.10 + 2000.20"). Körd mot den GAMLA raden
    // (`rader.reduce((sum, rad) => sum + rad.belopp, 0)`) INNAN bytet till
    // `summeraKronor` — bokfört utfall: `3000.6000000000004`, `!== 3000.6`.
    const belopp = [1000.1, 2000.2, 0.3];
    const raFlyttalsaddition = belopp.reduce((sum, kr) => sum + kr, 0);
    expect(raFlyttalsaddition).not.toBe(3000.6); // den gamla formens fel, dokumenterat

    // `summeraKronor` (den NYA, korrekta formen) ger den exakta summan —
    // detta diskriminerar mellan de två implementationerna på ett sätt den
    // FORMATERADE strängen INTE gör här: `Intl.NumberFormat` avrundar bort
    // 4e-13-felet ovan så BÅDA formerna råkar formatera till "SEK 3 000,60"
    // för just dessa tal (mätt: sträng-nivå-kontrollen ensam hade alltså
    // INTE fällt en regression till rå addition för detta specifika fall).
    expect(summeraKronor(belopp)).toBe(3000.6);

    const data = byggForsattsbladData(
      belopp.map((belopp) => forsattsbladRad({ belopp })),
      NU,
    );
    expect(data.summa).toBe('SEK 3 000,60');
  });

  test('varje rads belopp formateras "SEK <formatBelopp>" — samma form som kvittots totalruta', () => {
    const data = byggForsattsbladData([forsattsbladRad({ belopp: 2500 })], NU);
    expect(data.rader[0].belopp).toBe('SEK 2 500,00');
  });

  test('event: null blir tom sträng, inte "null"/"undefined" (samma konvention som byggKvittoData)', () => {
    const data = byggForsattsbladData([forsattsbladRad({ event: null })], NU);
    expect(data.rader[0].event).toBe('');
  });

  test('tidpunkten är stockholmDatumTid(nu) — anroparen skickar klockan, funktionen läser den aldrig själv', () => {
    const data = byggForsattsbladData([forsattsbladRad()], NU);
    expect(data.tidpunkt).toBe(stockholmDatumTid(NU));
    expect(data.tidpunkt).toBe('2026-09-03 14:00');
  });

  test('REN funktion — två separata anrop med samma indata-VÄRDEN ger djupt identiskt resultat', () => {
    expect(byggForsattsbladData([forsattsbladRad()], NU)).toEqual(
      byggForsattsbladData([forsattsbladRad()], NU),
    );
  });

  test('tom lista (N=0, oåtkomlig i praktiken via valideraInbetalningIdLista) ger antal 0 och summa "SEK 0,00" — inget kastat fel', () => {
    const data = byggForsattsbladData([], NU);
    expect(data.antal).toBe(0);
    expect(data.rader).toEqual([]);
    expect(data.summa).toBe('SEK 0,00');
  });

  test('olika belopp ger olika summa (negativ kontroll — inte alltid samma svar)', () => {
    const dataA = byggForsattsbladData([forsattsbladRad({ belopp: 2500 })], NU);
    const dataB = byggForsattsbladData([forsattsbladRad({ belopp: 1000 })], NU);
    expect(dataA.summa).not.toBe(dataB.summa);
  });
});

test.describe('serialiseraKanoniskt / berakaKallhash (ADR-125 § 3)', () => {
  test('nyckelordning påverkar INTE den kanoniska strängen', () => {
    const a = serialiseraKanoniskt({ b: 1, a: 2, c: { y: 1, x: 2 } });
    const b = serialiseraKanoniskt({ a: 2, c: { x: 2, y: 1 }, b: 1 });
    expect(a).toBe(b);
  });

  test('array-ORDNING bevaras (semantiskt meningsfull, t.ex. agenda)', () => {
    const a = serialiseraKanoniskt({ lista: ['första', 'andra'] });
    const b = serialiseraKanoniskt({ lista: ['andra', 'första'] });
    expect(a).not.toBe(b);
  });

  test('samma data (oavsett nyckelordning) → samma hash', async () => {
    const h1 = await berakaKallhash({ b: 1, a: 2 });
    const h2 = await berakaKallhash({ a: 2, b: 1 });
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  test('olika data → olika hash', async () => {
    const h1 = await berakaKallhash({ x: 1 });
    const h2 = await berakaKallhash({ x: 2 });
    expect(h1).not.toBe(h2);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// `fetMarkera` — säker **fet**-markering (2026-08-27, Marcus fångst att
// fetstilen försvann i TASK-309.4). TVÅSIDIGT: att fetstilen KOMMER TILLBAKA
// (positiv), och att inget ANNAT slinker igenom (negativ). Den andra halvan
// är den viktiga — funktionens utdata renderas RÅTT i mallen (`<%~ %>`), så
// en lucka här är en injektionsväg in i ett dokument som mailas till
// deltagare.
// ─────────────────────────────────────────────────────────────────────────

test('fetMarkera: **text** blir <strong>, som i förlagan', () => {
  expect(fetMarkera('Utbildningen **Resor i Medvetandet** ger dig insikt')).toBe(
    'Utbildningen <strong>Resor i Medvetandet</strong> ger dig insikt',
  );
});

test('fetMarkera: flera markeringar i samma stycke', () => {
  expect(fetMarkera('**ett** mitten **två**')).toBe(
    '<strong>ett</strong> mitten <strong>två</strong>',
  );
});

test('fetMarkera: text utan markörer passerar oförändrad', () => {
  expect(fetMarkera('helt vanlig text')).toBe('helt vanlig text');
});

test('fetMarkera: HTML i indata escapas — ingen tagg överlever', () => {
  expect(fetMarkera('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('fetMarkera: HTML INUTI en markering escapas också', () => {
  expect(fetMarkera('**<img src=x onerror=alert(1)>**')).toBe(
    '<strong>&lt;img src=x onerror=alert(1)&gt;</strong>',
  );
});

test('fetMarkera: attribut-brytande tecken escapas', () => {
  expect(fetMarkera(`"citat" & 'apostrof'`)).toBe('&quot;citat&quot; &amp; &#39;apostrof&#39;');
});

test('fetMarkera: & escapas FÖRE < och > — ingen dubbel-escaping', () => {
  // Om ordningen vore omvänd skulle &lt; bli &amp;lt; och visas som text.
  expect(fetMarkera('a & b < c')).toBe('a &amp; b &lt; c');
});

test('fetMarkera: oparad markör lämnas som literal text', () => {
  expect(fetMarkera('detta ** är inte fet')).toBe('detta ** är inte fet');
});

test('fetMarkera: markering spänner INTE över radbrytning', () => {
  // Ett asterisk-par över två rader är nästan alltid ett skrivfel — det ska
  // synas, inte svälja resten av stycket i fetstil.
  expect(fetMarkera('**start\nslut**')).toBe('**start\nslut**');
});

test('fetMarkera: tom markering (****) blir inte en tom tagg', () => {
  expect(fetMarkera('****')).toBe('****');
});

test('fetMarkera: tomt fält ger tom sträng', () => {
  expect(fetMarkera('')).toBe('');
});

test('fetMarkera: den lokala kopian i render-bilage-mall.mjs är i synk', () => {
  // scripts/render-bilage-mall.mjs kan inte importera Deno-TypeScript och bär
  // därför en kopia av mönstret. Glider de isär granskar man lokalt en ANNAN
  // bilaga än den som skickas — den klassen av tyst divergens vaktas här.
  const rot = process.cwd();
  const kanonisk = readFileSync(join(rot, 'supabase/functions/_shared/fet-markering.ts'), 'utf8');
  const lokal = readFileSync(join(rot, 'scripts/render-bilage-mall.mjs'), 'utf8');
  // Den literala mönsterkällan, tecken för tecken. Skiljer sig strängarna åt
  // renderar de två vägarna olika — exakt den divergens testet finns för.
  const MONSTER_KALLA = String.raw`\*\*([^*\n]+?)\*\*`;
  expect(kanonisk).toContain(MONSTER_KALLA);
  expect(lokal).toContain(MONSTER_KALLA);

  // Review-fynd på #2025: bold-regexet ensamt räckte inte. En ändring som rör
  // vid ESCAPING-stegen i bara den ena filen — en borttagen rad, en kastad
  // ordning — hade passerat obemärkt, trots att det är just escapingen som
  // gör rå-renderingen säker. Alla fem stegen och deras ORDNING jämförs nu.
  const ESCAPE_STEG = [
    String.raw`.replace(/&/g, '&amp;')`,
    String.raw`.replace(/</g, '&lt;')`,
    String.raw`.replace(/>/g, '&gt;')`,
    String.raw`.replace(/"/g, '&quot;')`,
    String.raw`.replace(/'/g, '&#39;')`,
  ];
  for (const steg of ESCAPE_STEG) {
    expect(kanonisk).toContain(steg);
    expect(lokal).toContain(steg);
  }
  // Ordningen är säkerhetskritisk: & måste escapas FÖRST, annars blir &lt;
  // till &amp;lt; och visas som text i stället för att skydda.
  const index = (fil: string) => ESCAPE_STEG.map((steg) => fil.indexOf(steg));
  for (const positioner of [index(kanonisk), index(lokal)]) {
    expect(positioner).toEqual([...positioner].sort((a, b) => a - b));
  }
});
