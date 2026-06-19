// Klass-regressionstest för gräns-coercion (Session 23, "Ort"-klassen).
//
// api-pure (ren logik, ingen staging) → körs lokalt + CI utan creds. Låser den
// kanoniska coercionens beteende OCH demonstrerar buggen den stänger: ett
// fler-värt Airtable-fält får ALDRIG tyst reduceras till ett (Lottas kärnkrav).
// Den array-droppande `firstString` som maskerade buggen är borttagen; här
// replikeras dess gamla beteende inline för att bevisa att testet fångar klassen.

import { expect, test } from '@playwright/test';
import { PersonSchema } from '../../src/domain/schemas/Person.schema';
import { PersonDetailSchema } from '../../src/domain/schemas/PersonDetail.schema';
import { scalarString, selectName, stringArray } from '../../supabase/functions/_shared/coerce';

// Den BORTTAGNA logiken (L5b-regressionen) — replikerad för att visa gammalt utfall.
function oldFirstString(val: unknown): string | null {
  if (Array.isArray(val)) return typeof val[0] === 'string' ? val[0] : null;
  return typeof val === 'string' ? val : null;
}

test.describe('gräns-coercion — "Ort"-klassen (fler-värt får aldrig tappas)', () => {
  test('stringArray bevarar ALLA värden (ej tyst drop)', () => {
    // Nytt: båda bevarade. Gammalt (firstString): bara första → DATA-FÖRLUST.
    expect(stringArray(['Skövde', 'Göteborg'])).toEqual(['Skövde', 'Göteborg']);
    expect(oldFirstString(['Skövde', 'Göteborg'])).toBe('Skövde'); // buggen, dokumenterad
  });

  test('stringArray: tom/saknad → [], ensam skalär → ettelements', () => {
    expect(stringArray([])).toEqual([]);
    expect(stringArray(undefined)).toEqual([]);
    expect(stringArray(null)).toEqual([]);
    expect(stringArray('Skövde')).toEqual(['Skövde']);
  });

  test('stringArray plockar namn ur {name}-objekt, filtrerar skräp', () => {
    expect(stringArray([{ name: 'A' }, 'B', 42, null])).toEqual(['A', 'B']);
  });

  test('scalarString: skalär passerar, 1-elem-array coercas, MULTI loggar (ej tyst)', () => {
    expect(scalarString('Skövde')).toBe('Skövde');
    expect(scalarString(['Skövde'])).toBe('Skövde'); // 1→1-lookup-form
    expect(scalarString([])).toBeNull();
    expect(scalarString(undefined)).toBeNull();

    // >1 på ett skalärt fält = data-form-avvikelse → console.warn, ALDRIG tyst.
    const warnings: string[] = [];
    const original = console.warn;
    console.warn = (msg?: unknown) => warnings.push(String(msg));
    try {
      const result = scalarString(['a', 'b']);
      expect(result).toBe('a');
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('data-form-avvikelse');
    } finally {
      console.warn = original;
    }
  });

  test('selectName: {name} → namn, sträng → sträng, annars null', () => {
    expect(selectName({ name: 'Erfaren' })).toBe('Erfaren');
    expect(selectName('Skövde')).toBe('Skövde');
    expect(selectName(undefined)).toBeNull();
  });
});

test.describe('schema-parity — ort/allaHamtningar är string[] (SAKNAD-bug stängd)', () => {
  function validPerson(overrides: Record<string, unknown> = {}) {
    return {
      id: 'recX',
      namn: 'A',
      fornamn: null,
      efternamn: null,
      email: null,
      telefon: null,
      ort: ['Skövde', 'Göteborg'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 0,
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

  test('PersonSchema accepterar ort som string[] med flera orter', () => {
    const parsed = PersonSchema.parse(validPerson());
    expect(parsed.ort).toEqual(['Skövde', 'Göteborg']); // båda bevarade genom parse
  });

  test('PersonSchema AVVISAR gammal rå-sträng-form (regressionsvakt)', () => {
    // Gamla get-persons (`f['Ort'] ?? null`) hade gett en sträng/array — nu kräver
    // schemat string[]. En rå sträng → ZodError (fångar SAKNAD-coercion-regression).
    expect(() => PersonSchema.parse(validPerson({ ort: 'Skövde' }))).toThrow();
  });

  test('PersonDetailSchema: allaHamtningar string[], båda värden bevarade', () => {
    const parsed = PersonDetailSchema.parse({
      ...validPerson(),
      aterkommande: null,
      nastaEvent: null,
      antalGenomfordaEvent: 0,
      senasteDeltagandeDatum: null,
      antalHamtningar: 2,
      allaHamtningar: ['Kraftfältet', 'Andetag'],
      motivering: null,
      inbjudenCommunity: false,
      skapatKontoCommunity: false,
      historik: [],
    });
    expect(parsed.allaHamtningar).toEqual(['Kraftfältet', 'Andetag']);
  });
});
