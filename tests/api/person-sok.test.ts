// Enhetstest för personregistrets klientfilter (`src/lib/person-sok.ts`,
// ADR-123 beslut 2, TASK-286.2).
//
// api-pure (ren logik, ingen staging, ingen nätverk) → körs lokalt + CI.
// Låser den EXAKTA semantiken klientfiltret måste bära: skiftläges-okänslig
// delsträngsmatch, DIAKRITIK-känslig (ingen normalisering — mätt i staging
// mot Airtables SEARCH(), se `person-sok.ts`s filhuvud), "något element" för
// arrayfältet Ort, och tom sökterm = hela registret.
//
// Den LIVE paritetsproven (samma termer mot EF:ens verkliga SEARCH()-formel
// i staging) bor i `tests/api/get-persons-sok-paritet.staging.test.ts` — den
// filen importerar SAMMA `filtreraPersonregister` som denna, så de två
// sviterna kan aldrig glida isär till två olika implementationer.

import { expect, test } from '@playwright/test';
import type { Person } from '../../src/domain/models/Person';
import { filtreraPersonregister, personMatcharSokterm } from '../../src/lib/person-sok';

/** Minimal, komplett `Person` — overrides sätter bara det testet bryr sig om. */
function bas(overrides: Partial<Person> = {}): Person {
  return {
    id: 'recBAS0000000000',
    namn: 'Bas Basson',
    fornamn: 'Bas',
    efternamn: 'Basson',
    email: 'bas.basson@example.test',
    telefon: null,
    ort: [],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar: null,
    antalAnmalningar: 1,
    antalDeltaganden: 0,
    erfarenhetsniva: null,
    erfarenhetsbadge: null,
    senasteInteraktion: null,
    senasteInteraktionDatum: null,
    dagarSedanSenaste: null,
    harAktivAnmalan: null,
    ejGodkandMail: false,
    radSkapad: null,
    anmalningIds: [],
    deltagandeIds: [],
    ...overrides,
  };
}

test.describe('personMatcharSokterm — fält, skiftläge, diakritik', () => {
  test('tom sökterm matchar ALLTID (samma falsy-check som EF:ens `if (search)`)', () => {
    expect(personMatcharSokterm(bas(), '')).toBe(true);
  });

  test('matchar Namn, skiftlägesokänsligt', () => {
    const p = bas({ namn: 'Anna Andersson' });
    expect(personMatcharSokterm(p, 'anna')).toBe(true);
    expect(personMatcharSokterm(p, 'ANNA')).toBe(true);
    expect(personMatcharSokterm(p, 'Anna')).toBe(true);
  });

  test('matchar E-post', () => {
    const p = bas({ email: 'anna.andersson@example.com' });
    expect(personMatcharSokterm(p, 'example.com')).toBe(true);
    expect(personMatcharSokterm(p, 'inteHar@')).toBe(false);
  });

  test('matchar Telefon oavsett format — ingen normalisering av bindestreck/mellanslag', () => {
    const p = bas({ telefon: '070-233 14 56' });
    expect(personMatcharSokterm(p, '070')).toBe(true);
    expect(personMatcharSokterm(p, '070-')).toBe(true);
    // '070 1' finns INTE som delsträng i '070-233 14 56' (bindestreck, inte
    // mellanslag, direkt efter 070) — samma sträng-till-sträng-jämförelse som
    // EF:ens SEARCH(), ingen tolerans att gissa fram.
    expect(personMatcharSokterm(p, '070 1')).toBe(false);
  });

  test('arrayfältet Ort — "något element" (PRD-beslutet, ADR-123 beslut 2)', () => {
    const p = bas({ ort: ['Falköping', 'Varberg'] });
    expect(personMatcharSokterm(p, 'falköping')).toBe(true);
    expect(personMatcharSokterm(p, 'varberg')).toBe(true);
    expect(personMatcharSokterm(p, 'göteborg')).toBe(false);
  });

  test('sentinel-namnet "Ej tillgängligt" matchar en delsträng av sig själv', () => {
    const p = bas({ namn: 'Ej tillgängligt' });
    expect(personMatcharSokterm(p, 'ej till')).toBe(true);
  });

  test(
    'DIAKRITIK-KÄNSLIGT — mätt mot Airtables SEARCH() i staging (ADR-123 § Kontext): ' +
      '"åsa" hittar Åsa, "asa" gör det INTE (ingen normalisering)',
    () => {
      const p = bas({ namn: 'Åsa Öberg' });
      expect(personMatcharSokterm(p, 'åsa')).toBe(true);
      expect(personMatcharSokterm(p, 'asa')).toBe(false);
      // Substräng av samma diakritiska tecken ska fortsatt matcha.
      expect(personMatcharSokterm(p, 'ås')).toBe(true);
    },
  );

  test('null-fält (namn/email/telefon) deltar aldrig i matchningen, kraschar aldrig', () => {
    const p = bas({ namn: null, email: null, telefon: null, ort: [] });
    expect(personMatcharSokterm(p, 'vad som helst')).toBe(false);
    expect(personMatcharSokterm(p, '')).toBe(true);
  });
});

test.describe('filtreraPersonregister — hela registret', () => {
  test('tom sökterm returnerar registret OFÖRÄNDRAT (samma referens)', () => {
    const register = [bas({ id: 'rec1' }), bas({ id: 'rec2' })];
    expect(filtreraPersonregister(register, '')).toBe(register);
  });

  test('filtrerar ned till exakt de matchande posterna, ordningen bevarad', () => {
    const register = [
      bas({ id: 'rec1', namn: 'Anna Andersson' }),
      bas({ id: 'rec2', namn: 'Björn Bergström' }),
      bas({ id: 'rec3', namn: 'Cecilia Ceder' }),
    ];
    const traff = filtreraPersonregister(register, 'björn');
    expect(traff.map((p) => p.id)).toEqual(['rec2']);
  });

  test('noll träffar ger en tom array, inte undefined/krasch', () => {
    const register = [bas({ namn: 'Anna Andersson' })];
    expect(filtreraPersonregister(register, 'finnsinte')).toEqual([]);
  });
});
