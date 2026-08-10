// Kontraktstest för `senasteInteraktion`s GRAMMATIK (2026-08-10-ändringen).
//
// api-pure (ren logik, ingen staging) → körs lokalt + CI utan creds, ingen
// mutex. Detta är den BILLIGA halvan av kontraktet: den bevisar att
// matcharna i `tests/support/senasteInteraktionGrammatik.ts` FÄLLER de gamla
// formerna och GODKÄNNER den nya — tvåsidigt, enligt uppdraget.
//
// Vad detta test INTE kan bevisa: att Airtable-FORMELN faktiskt producerar
// den nya formen just nu. Formeln lever bara i Airtable-UI:t
// (`airtable-constraints.md` P25 — inget versionerat schema-as-code, ingen
// diff, ingen CI-granskning av formeltext), så en hermetisk fixtur kan
// bara bevaka DRIFT i den handskrivna fixturfilen, aldrig en verklig
// formelregression. Den skarpa halvan av kontraktet —
// `senaste-interaktion-grammatik.staging.test.ts` — pinnar de två permanenta
// staging-fixturerna mot LIVE Airtable-data. Se ADR-108 för hela
// avvägningen mellan bas och app.
//
// Deltagandegrenens "på"-exempel nedan (RIM 1/Fjärrskådning i ZZ-History
// Ort / ZZ-arbetsko-fixtur) är INTE påhittade — de är LIVE-verifierade
// värden ur `Deltaganden.Deltog sammanfattning` (staging `apphjj8Q7lkXCMsL4`,
// `describe_table` + `list_records` 2026-08-10), citerade här som
// litteraler eftersom appens `get-person`/`get-persons` aldrig exponerar
// den grenen ORÖRD (bara VINNANDE gren når `senasteInteraktion` — se
// tie-break-regeln, `data-model.md` §"Tie-break"). Ingen live person i
// staging har just nu deltagande som vinnande gren (samtliga 27 Personer
// mätta 2026-08-10 vinner antingen på anmälan eller saknar interaktion
// helt) — den skarpa halvan av kontraktet kan därför INTE pinna
// deltagandegrenen mot en vinnande `senasteInteraktion` just nu. Det är en
// öppen, bokförd lucka, inte en tyst brist (se slutrapporten/ADR-108).

import { expect, test } from '@playwright/test';
import {
  ANMALAN_MENING,
  DELTAGANDE_MENING,
  GAMMALT_DATUMPREFIX,
} from '../support/senasteInteraktionGrammatik';

test.describe('senasteInteraktion — anmälningsgrenens grammatik (ADR-108)', () => {
  test('GODKÄNNER: alla fyra kurs/ort-kombinationer av EFTER-formen', () => {
    // Källa: live staging 2026-08-10 (`Anmälningar.fldwgo1fJirUwUiOC`).
    expect(ANMALAN_MENING.test('Anmälde sig till RIM 1 i Rönninge')).toBe(true);
    expect(ANMALAN_MENING.test('Anmälde sig till Fjärrskådning i ZZ-arbetsko-fixtur')).toBe(true);
    // Ort men ingen kurs — live-verifierad mot `ZZ-History Person 01`
    // (`recqxaFNwHAdQlAqb`), en kantfall uppdraget inte räknade upp men som
    // formeln faktiskt producerar (IF-grenarna är oberoende).
    expect(ANMALAN_MENING.test('Anmälde sig i ZZ-Göteborg')).toBe(true);
    // Kurs men ingen ort.
    expect(ANMALAN_MENING.test('Anmälde sig till RIM 1')).toBe(true);
    // Varken kurs eller ort — live-verifierad mot `ZZ-Conformance Person 01-05`.
    expect(ANMALAN_MENING.test('Anmälde sig')).toBe(true);
  });

  test('FÄLLER: prick-formen (FÖRE, mission-dokumenterad)', () => {
    expect(ANMALAN_MENING.test('Anmälde sig · RIM 1, Rönninge')).toBe(false);
  });

  test('FÄLLER: prick-formen MED datum (TASK-184:s landningsform, ur data-model.md)', () => {
    expect(ANMALAN_MENING.test('Anmälde sig · RIM 1, Rönninge · 19 apr 2026')).toBe(false);
  });

  test('FÄLLER: den ännu äldre datum-prefixade formen (fixture-data.ts FÖRE denna ändring)', () => {
    expect(ANMALAN_MENING.test('2026-09-12 18:04 – Inskickad anmälan')).toBe(false);
  });
});

test.describe('senasteInteraktion — deltagandegrenens grammatik (ADR-108)', () => {
  test('GODKÄNNER: "på"-formen, med och utan ort, och prick-fallbacken', () => {
    // Källa: live staging 2026-08-10 (`Deltaganden.fldKaxHf6UzcHN94v`,
    // record `recbfLxgzWw7FpO6W` / `recQWjimysYJrkY0n`).
    expect(DELTAGANDE_MENING.test('Deltog på RIM 1 i ZZ-History Ort')).toBe(true);
    expect(DELTAGANDE_MENING.test('Deltog på Fjärrskådning i ZZ-arbetsko-fixtur')).toBe(true);
    expect(DELTAGANDE_MENING.test('Deltog på RIM 2')).toBe(true);
    // Fallbacken: Kursnamn-lookupen tom → hela Event sammanfattning, PRICK-
    // FORMEN BEVARAD MED AVSIKT (uppdragets egen kantfall, formelbekräftad).
    expect(
      DELTAGANDE_MENING.test(
        'Deltog · ZZ-History Ort – Utbildning – Resor i medvetandet 1 – 2026-01-15',
      ),
    ).toBe(true);
  });

  test('FÄLLER: den gamla en-dash-listformen (fixture-data.ts FÖRE denna ändring)', () => {
    expect(
      DELTAGANDE_MENING.test('Varberg – Utbildning – Resor i medvetandet 1 – 2026-08-22'),
    ).toBe(false);
  });
});

test.describe('senasteInteraktion — datumprefix-regressionen (borttagen 2026-08-10)', () => {
  test('FÄLLER samtliga tre grenars FÖRE-former (datumet satt först)', () => {
    expect(GAMMALT_DATUMPREFIX.test('2026-09-12 18:04 – Inskickad anmälan')).toBe(true);
    expect(
      GAMMALT_DATUMPREFIX.test('2026-09-14 08:12 – Angett e-post för att ta del av ett erbjudande'),
    ).toBe(true);
  });

  test('GODKÄNNER (matchar EJ): samtliga tre grenars EFTER-former', () => {
    expect(GAMMALT_DATUMPREFIX.test('Anmälde sig till RIM 1 i Rönninge')).toBe(false);
    expect(GAMMALT_DATUMPREFIX.test('Deltog på RIM 1 i ZZ-History Ort')).toBe(false);
    // Touchpoint-grenen är OFÖRÄNDRAD (mission, bekräftat via live
    // `describe_table` mot `Touchpoints.fldO3G3hY0iFLKopR` 2026-08-10) —
    // den har aldrig burit datumet i strängen.
    expect(GAMMALT_DATUMPREFIX.test('Hämtade Meditationen Kraftfältet')).toBe(false);
  });
});
