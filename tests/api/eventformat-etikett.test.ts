// Enhetstest för Eventformat-etiketterna (task-19.3; PRD task-19 beslut 5).
//
// api-pure (ren logik, ingen staging) → körs lokalt + CI. Låser den EXPLICITA
// mappningen mellan basens Eventformat-poster och UI-språket "2 dagar"/"1 dag"
// (K83, Marcus: etikett ≠ record) samt fallback-riktningen: en post som saknar
// mappning DÖLJS ALDRIG — den visas med sitt bas-namn, annars kunde ett event
// bli omöjligt att skapa när basen växer.
//
// Bas-namnen är LIVE-VERIFIERADE 2026-07-22 via Airtable-MCP (Eventformat
// tbl8qhuJQ5ZWPMRk4): prod bär "Utbildning - 2 dagar" (Format: Dag 1 + Dag 2)
// och "Föreläsning" (Format: Föreläsning); staging bär dessutom
// sentinel-fixturen ZZ-create-event-test-format.

import { expect, test } from '@playwright/test';
import { eventformatEtikett } from '../../src/lib/eventformat-etikett';

test.describe('eventformatEtikett — UI-språket mot basens Eventformat-poster', () => {
  test('"Utbildning - 2 dagar" → "2 dagar" (facit-etiketten)', () => {
    expect(eventformatEtikett({ id: 'recA', namn: 'Utbildning - 2 dagar' })).toBe('2 dagar');
  });

  test('"Föreläsning" → "1 dag" (facit-etiketten)', () => {
    expect(eventformatEtikett({ id: 'recB', namn: 'Föreläsning' })).toBe('1 dag');
  });

  test('omgivande blanksteg i bas-namnet stör inte mappningen', () => {
    expect(eventformatEtikett({ id: 'recA', namn: '  Utbildning - 2 dagar  ' })).toBe('2 dagar');
  });

  test('omappad post visas med sitt bas-namn (döljs aldrig)', () => {
    expect(eventformatEtikett({ id: 'recZ', namn: 'ZZ-create-event-test-format' })).toBe(
      'ZZ-create-event-test-format',
    );
  });

  test('namnlös post faller tillbaka på record-ID:t (aldrig tom etikett)', () => {
    expect(eventformatEtikett({ id: 'recTom', namn: null })).toBe('recTom');
    expect(eventformatEtikett({ id: 'recTom', namn: '   ' })).toBe('recTom');
  });
});
