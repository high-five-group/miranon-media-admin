// Kursnamnsmappningen (TASK-249.4, ADR-115) — regressionstest mot
// `_shared/course-dimensions.ts`. api-pure (ren logik, ingen staging) → körs
// lokalt + CI utan creds.
//
// Mappningen är EXAKT samma som prototypens KURS_KARTA
// (src/components/segment/prototyp/VariantD.tsx) och backfillens källa
// (data-model.md § "Staging- och prodbasens additiva tillskott
// 2026-08-17") — värdena nedan är LIVE-VERIFIERADE mot staging
// (apphjj8Q7lkXCMsL4, Eventplanering, mcp__airtable__list_records
// 2026-08-17) innan detta test skrevs.

import { expect, test } from '@playwright/test';
import { lookupCourseDimensions } from '../../supabase/functions/_shared/course-dimensions';

test.describe('lookupCourseDimensions — kursnamnsmappningen', () => {
  test('RIM-familjen: naken "Resor i medvetandet" → Intro; numrerade → Nivå N', () => {
    expect(lookupCourseDimensions('Resor i medvetandet')).toEqual({
      kursfamilj: 'RIM',
      kursniva: 'Intro',
    });
    expect(lookupCourseDimensions('Resor i medvetandet 1')).toEqual({
      kursfamilj: 'RIM',
      kursniva: 'Nivå 1',
    });
    expect(lookupCourseDimensions('Resor i medvetandet 2')).toEqual({
      kursfamilj: 'RIM',
      kursniva: 'Nivå 2',
    });
    expect(lookupCourseDimensions('Resor i medvetandet 3')).toEqual({
      kursfamilj: 'RIM',
      kursniva: 'Nivå 3',
    });
  });

  test('nivålösa familjer: Fjärrskådning/Psionautics → kursniva null', () => {
    expect(lookupCourseDimensions('Fjärrskådning')).toEqual({
      kursfamilj: 'Fjärrskådning',
      kursniva: null,
    });
    expect(lookupCourseDimensions('Psionautics')).toEqual({
      kursfamilj: 'Psionautics',
      kursniva: null,
    });
  });

  test('okänt kursnamn → null (öppet, aldrig gissat — ingen fallback-familj)', () => {
    expect(lookupCourseDimensions('Resor i medvetandet 4')).toBeNull();
    expect(lookupCourseDimensions('Höstretreat')).toBeNull();
    expect(lookupCourseDimensions('')).toBeNull();
  });

  test('exakt strängmatchning: whitespace/case-varianter matchar INTE (ingen fuzzy-gissning)', () => {
    expect(lookupCourseDimensions('resor i medvetandet 1')).toBeNull();
    expect(lookupCourseDimensions('Resor i medvetandet 1 ')).toBeNull();
  });
});
