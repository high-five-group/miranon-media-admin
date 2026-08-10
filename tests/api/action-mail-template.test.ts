// Kontraktstest för platshållar-mirrorn (TASK-147.1, ADR-067-revisionen).
//
// api-pure (ren logik, NOLL I/O, NOLL Deno-global): denna modul speglar
// src/components/events/atgarder/AtgardsSida.tsx:s `fyllPlatshallare` +
// `deadlineDatum` + `dagManad` EXAKT — granskningen Lotta ser (klient-sidan)
// och mailet som faktiskt går ut (denna modul, server-sidan) måste rendera
// IDENTISKT. Testerna bevisar båda hälfterna av det kontraktet: fyllda
// platshållare ersätts korrekt, OFYLLDA lämnas LITERALT i texten (aldrig
// tyst blankade) — samma "de ofyllda är fyndet"-regel som klientens
// docblock (AtgardsSida.tsx rad 431).

import { expect, test } from '@playwright/test';
import {
  dagManad,
  deadlineDatum,
  fillPlaceholders,
} from '../../supabase/functions/_shared/action-mail-template';

test.describe('action-mail-template — platshållar-mirrorn (TASK-147.1)', () => {
  test('dagManad: sv-SE "dag månad"-format', () => {
    expect(dagManad('2026-08-15')).toBe('15 augusti');
    expect(dagManad(null)).toBeNull();
    expect(dagManad(undefined)).toBeNull();
    expect(dagManad('inte-ett-datum')).toBeNull();
  });

  test('deadlineDatum: 14 dagar före startdatum', () => {
    // 2026-08-15 minus 14 dagar = 2026-08-01.
    expect(deadlineDatum('2026-08-15')).toBe('1 augusti');
    expect(deadlineDatum(null)).toBeNull();
    expect(deadlineDatum('trasigt')).toBeNull();
  });

  test('fillPlaceholders: alla fem platshållare ersätts när värdet finns', () => {
    const { text, ofyllda } = fillPlaceholders(
      'Hej {förnamn}, {event} i {ort} börjar {datum}. Sista dag är {deadline}.',
      {
        förnamn: 'Anna',
        event: 'RIM 1',
        ort: 'Skövde',
        datum: '15 augusti',
        deadline: '1 augusti',
      },
    );
    expect(text).toBe('Hej Anna, RIM 1 i Skövde börjar 15 augusti. Sista dag är 1 augusti.');
    expect(ofyllda).toEqual([]);
  });

  test('fillPlaceholders: OFYLLDA lämnas LITERALT i texten, aldrig tomma', () => {
    const { text, ofyllda } = fillPlaceholders('Hej {förnamn}, sista dag är {deadline}.', {
      förnamn: 'Anna',
      event: null,
      ort: null,
      datum: null,
      deadline: null,
    });
    // {förnamn} fylldes; {deadline} lämnades literalt — INTE tomsträng, INTE borttaget.
    expect(text).toBe('Hej Anna, sista dag är {deadline}.');
    expect(ofyllda).toEqual(['{deadline}']);
  });

  test('fillPlaceholders: tom sträng räknas som ofylld (samma regel som null)', () => {
    const { text, ofyllda } = fillPlaceholders('{event}', {
      förnamn: null,
      event: '',
      ort: null,
      datum: null,
      deadline: null,
    });
    expect(text).toBe('{event}');
    expect(ofyllda).toEqual(['{event}']);
  });

  test('fillPlaceholders: samma platshållare två gånger räknas EN gång i ofyllda', () => {
    const { ofyllda } = fillPlaceholders('{event} ... {event}', {
      förnamn: null,
      event: null,
      ort: null,
      datum: null,
      deadline: null,
    });
    expect(ofyllda).toEqual(['{event}']);
  });

  test('fillPlaceholders: okänd platshållar-nyckel (utanför de fem) lämnas literalt', () => {
    const { text, ofyllda } = fillPlaceholders('{okantfalt}', {
      förnamn: null,
      event: null,
      ort: null,
      datum: null,
      deadline: null,
    });
    expect(text).toBe('{okantfalt}');
    expect(ofyllda).toEqual(['{okantfalt}']);
  });

  test('fillPlaceholders: mall utan platshållare (fritt-utskickets facit) passerar oförändrad', () => {
    const { text, ofyllda } = fillPlaceholders('Ett helt fritt mail utan mallord.', {
      förnamn: 'Anna',
      event: null,
      ort: null,
      datum: null,
      deadline: null,
    });
    expect(text).toBe('Ett helt fritt mail utan mallord.');
    expect(ofyllda).toEqual([]);
  });
});
