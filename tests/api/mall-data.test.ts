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

import { expect, test } from '@playwright/test';
import {
  byggBekraftelseData,
  byggDeltagarinfoData,
  type DocumentSourcesResult,
  formatSvenskDatum,
  formatSvenskDatumspann,
  valjKopia,
} from '../../supabase/functions/_shared/mall-data';
import { berakaKallhash, serialiseraKanoniskt } from '../../supabase/functions/_shared/mall-hash';

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
