// Enhetstest för segment-taxonomi-helpern (Fas 6g L2, ADR-064).
//
// api-pure (ren logik, ingen staging) → körs lokalt + CI. Låser distinkt-
// härledningen, modalitet-filtreringen, deterministisk sortering, och
// labelForPar inkl. FÄLLA-35-disambigueringen (data-model §Kända fällor #35).

import { expect, test } from '@playwright/test';
import type { Event } from '../../src/domain/models/Event';
import { deriveTaxonomy, labelForPar, parKey } from '../../src/lib/segment-taxonomy';

// deriveTaxonomy läser bara eventNamn + typ → bygg de fälten direkt (param är
// Pick<Event,'eventNamn'|'typ'>[], så inga casts behövs).
function ev(eventNamn: string | null, typ: string | null): Pick<Event, 'eventNamn' | 'typ'> {
  return { eventNamn, typ };
}

test.describe('deriveTaxonomy — distinkta (kurs × modalitet)-par', () => {
  test('distinkt: dubbletter kollapsar till ett par', () => {
    const pars = deriveTaxonomy([
      ev('Resor i medvetandet 1', 'Utbildning'),
      ev('Resor i medvetandet 1', 'Utbildning'),
      ev('Resor i medvetandet 1', 'Utbildning'),
    ]);
    expect(pars).toEqual([{ kurs: 'Resor i medvetandet 1', modalitet: 'Utbildning' }]);
  });

  test('samma kurs, olika modalitet = TVÅ par (Fjärrskådning U + F)', () => {
    const pars = deriveTaxonomy([
      ev('Fjärrskådning', 'Utbildning'),
      ev('Fjärrskådning', 'Föreläsning'),
    ]);
    expect(pars).toEqual([
      { kurs: 'Fjärrskådning', modalitet: 'Föreläsning' },
      { kurs: 'Fjärrskådning', modalitet: 'Utbildning' },
    ]);
  });

  test('filtrerar bort par med null kurs eller ogiltig/null modalitet', () => {
    const pars = deriveTaxonomy([
      ev(null, 'Utbildning'), // null kurs → bort
      ev('Psionautics', null), // null modalitet → bort
      ev('Psionautics', 'Workshop'), // utanför enum → bort
      ev('Psionautics', 'Utbildning'), // giltig → kvar
    ]);
    expect(pars).toEqual([{ kurs: 'Psionautics', modalitet: 'Utbildning' }]);
  });

  test('deterministisk sortering (kurs, sedan modalitet)', () => {
    const pars = deriveTaxonomy([
      ev('Psionautics', 'Utbildning'),
      ev('Fjärrskådning', 'Utbildning'),
      ev('Fjärrskådning', 'Föreläsning'),
    ]);
    expect(pars.map((p) => `${p.kurs}|${p.modalitet}`)).toEqual([
      'Fjärrskådning|Föreläsning',
      'Fjärrskådning|Utbildning',
      'Psionautics|Utbildning',
    ]);
  });

  test('tom input → []', () => {
    expect(deriveTaxonomy([])).toEqual([]);
  });

  test('parKey är stabil och par-distinkt', () => {
    expect(parKey({ kurs: 'Resor i medvetandet 1', modalitet: 'Utbildning' })).toBe(
      'Resor i medvetandet 1|Utbildning',
    );
    expect(parKey({ kurs: 'Fjärrskådning', modalitet: 'Föreläsning' })).not.toBe(
      parKey({ kurs: 'Fjärrskådning', modalitet: 'Utbildning' }),
    );
  });
});

test.describe('labelForPar — Gunilla-läsbar etikett', () => {
  test('serie-kurs: "{kurs} ({modalitet i gemener})"', () => {
    expect(labelForPar({ kurs: 'Resor i medvetandet 1', modalitet: 'Utbildning' })).toBe(
      'Resor i medvetandet 1 (utbildning)',
    );
    expect(labelForPar({ kurs: 'Fjärrskådning', modalitet: 'Föreläsning' })).toBe(
      'Fjärrskådning (föreläsning)',
    );
  });

  test('FÄLLA 35: naket "Resor i medvetandet" (Föreläsning) får omisskännlig etikett', () => {
    const label = labelForPar({ kurs: 'Resor i medvetandet', modalitet: 'Föreläsning' });
    expect(label).toBe('Resor i medvetandet - fristående föreläsning (ej del 1/2/3)');
    // ...och är SKILD från serie-etiketterna (ingen sammanblandning).
    expect(label).not.toBe(labelForPar({ kurs: 'Resor i medvetandet 1', modalitet: 'Utbildning' }));
  });

  test('naket "Resor i medvetandet" som Utbildning faller på generisk etikett (ej fälla-35-fallet)', () => {
    expect(labelForPar({ kurs: 'Resor i medvetandet', modalitet: 'Utbildning' })).toBe(
      'Resor i medvetandet (utbildning)',
    );
  });
});
