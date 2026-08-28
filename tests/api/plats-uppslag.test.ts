// Ort-till-Plats-härledningens BESLUTSLOGIK (TASK-309.30) — regressionstest
// mot `_shared/plats-uppslag.ts`. api-pure (ren logik, ingen staging, inga
// creds) → körs lokalt OCH i CI, till skillnad från
// `create-event.staging.test.ts` som skip:as utan creds.
//
// VARFÖR BÅDA NIVÅERNA FINNS: staging-testet bevisar att den DEPLOYADE EF:en
// beter sig rätt mot skarp data (inklusive den seedade dubblett-fixturen,
// som är det enda sättet att nå flera-träffar-grenen skarpt — ingen EF kan
// skapa två Platser-rader med samma Namn). Detta test bevisar att SJÄLVA
// regeln diskriminerar rätt, utan att förutsätta ett bas-tillstånd. En
// regression i regeln fälls här på millisekunder i stället för i ett
// creddat CI-jobb.
//
// TVÅ RIKTNINGAR PER GREN: varje utfall prövas både i sitt eget fall OCH
// mot ett grannfall som INTE får ge samma svar — en regel som alltid säger
// "ingen träff" hade annars passerat halva sviten.

import { expect, test } from '@playwright/test';
import {
  avgorPlatsLank,
  harRedanPlats,
  PLATS_UPPSLAG_MAX_RECORDS,
} from '../../supabase/functions/_shared/plats-uppslag';

test.describe('avgorPlatsLank — exakt en träff, aldrig annars', () => {
  test('exakt EN träff → länka den radens ID', () => {
    const beslut = avgorPlatsLank([{ id: 'recVWAYh1cbVQKxi7' }]);
    expect(beslut.lanka).toBe(true);
    // Typsmalningen är en del av kontraktet: `platsId` finns ENDAST på
    // länka-grenen, så en konsument kan inte läsa ett ID som aldrig skrevs.
    if (beslut.lanka) {
      expect(beslut.platsId).toBe('recVWAYh1cbVQKxi7');
    }
  });

  test('NOLL träffar → ingen länk, skäl "ingen-traff"', () => {
    const beslut = avgorPlatsLank([]);
    expect(beslut.lanka).toBe(false);
    if (!beslut.lanka) {
      expect(beslut.skal).toBe('ingen-traff');
    }
  });

  test('TVÅ träffar → ingen länk, skäl "flera-traffar" (aldrig den första)', () => {
    // Exakt formen den seedade staging-fixturen har: två Platser-rader med
    // samma `Namn` (ZZ-plats-dubblett-fixtur, rec1bMcnYvgAYeO6d +
    // rec3XSjtWhbK3PRXF, live-verifierade 2026-08-28). Airtable kan inte
    // tvinga unikhet på ett primärfält, så detta är ett möjligt bas-tillstånd
    // och inte ett konstruerat gränsfall.
    const beslut = avgorPlatsLank([{ id: 'rec1bMcnYvgAYeO6d' }, { id: 'rec3XSjtWhbK3PRXF' }]);
    expect(beslut.lanka).toBe(false);
    if (!beslut.lanka) {
      expect(beslut.skal).toBe('flera-traffar');
    }
    // NEGATIVKONTROLL: regeln får ALDRIG degenerera till "ta första träffen"
    // — det är exakt den tysta fel-länkning modulen finns för att förhindra.
    expect(JSON.stringify(beslut)).not.toContain('rec1bMcnYvgAYeO6d');
  });

  test('TRE träffar → fortfarande "flera-traffar" (regeln är >1, inte ==2)', () => {
    const beslut = avgorPlatsLank([{ id: 'recA' }, { id: 'recB' }, { id: 'recC' }]);
    expect(beslut.lanka).toBe(false);
    if (!beslut.lanka) {
      expect(beslut.skal).toBe('flera-traffar');
    }
  });

  test('uppslagets maxRecords är 2 — ett hade gjort grenarna oskiljbara', () => {
    // Kontrakts-assertion, inte en trivialitet: med `maxRecords: 1` svarar
    // Airtable med EN rad både när det finns en och när det finns fem, och
    // `avgorPlatsLank` hade då aldrig kunnat nå flera-träffar-grenen.
    expect(PLATS_UPPSLAG_MAX_RECORDS).toBe(2);
  });
});

test.describe('harRedanPlats — en satt Plats vinner alltid över härledningen', () => {
  test('icke-tom länk-array → true', () => {
    expect(harRedanPlats({ Plats: ['recZc1EMWMYw5KADo'] })).toBe(true);
  });

  test('fältet saknas helt (Airtables form för tomt länkfält) → false', () => {
    expect(harRedanPlats({ Ort: 'Rönninge' })).toBe(false);
  });

  test('tom array → false', () => {
    // Airtable utelämnar normalt fältet helt, men en tom array får aldrig
    // läsas som en befintlig länk om den ändå dyker upp.
    expect(harRedanPlats({ Plats: [] })).toBe(false);
  });

  test('icke-array-värde → false (aldrig ett kast)', () => {
    expect(harRedanPlats({ Plats: 'recZc1EMWMYw5KADo' })).toBe(false);
    expect(harRedanPlats({ Plats: null })).toBe(false);
  });
});
