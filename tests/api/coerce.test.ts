// Klass-regressionstest för gräns-coercion (Session 23, "Ort"-klassen).
//
// api-pure (ren logik, ingen staging) → körs lokalt + CI utan creds. Låser den
// kanoniska coercionens beteende OCH demonstrerar buggen den stänger: ett
// fler-värt Airtable-fält får ALDRIG tyst reduceras till ett (Lottas kärnkrav).
// Den array-droppande `firstString` som maskerade buggen är borttagen; här
// replikeras dess gamla beteende inline för att bevisa att testet fångar klassen.

import { expect, test } from '@playwright/test';
import { EventSchema } from '../../src/domain/schemas/Event.schema';
import { PersonSchema } from '../../src/domain/schemas/Person.schema';
import { PersonDetailSchema } from '../../src/domain/schemas/PersonDetail.schema';
import {
  scalarNumber,
  scalarString,
  selectName,
  stringArray,
} from '../../supabase/functions/_shared/coerce';

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

test.describe('gräns-coercion — NaN-specialValue-klassen (event-beläggning)', () => {
  test('scalarNumber: ändligt tal passerar, specialValue-OBJEKT → null', () => {
    expect(scalarNumber(42)).toBe(42);
    expect(scalarNumber(0)).toBe(0);
    // Airtable formel-NaN/Infinity levereras som OBJEKT — buggen som sänkte parse.
    expect(scalarNumber({ specialValue: 'NaN' })).toBeNull();
    expect(scalarNumber({ specialValue: 'Infinity' })).toBeNull();
    expect(scalarNumber({ specialValue: '-Infinity' })).toBeNull();
  });

  test('scalarNumber: icke-ändliga/icke-tal → null (sträng, undefined, null, NaN, Inf)', () => {
    expect(scalarNumber('42')).toBeNull();
    expect(scalarNumber(undefined)).toBeNull();
    expect(scalarNumber(null)).toBeNull();
    expect(scalarNumber(Number.NaN)).toBeNull();
    expect(scalarNumber(Number.POSITIVE_INFINITY)).toBeNull();
  });

  test('scalarNumber: 1-elem-array coercas, MULTI loggar (ej tyst — scalar-disciplin)', () => {
    expect(scalarNumber([7])).toBe(7);
    expect(scalarNumber([])).toBeNull();

    const warnings: string[] = [];
    const original = console.warn;
    console.warn = (msg?: unknown) => warnings.push(String(msg));
    try {
      expect(scalarNumber([7, 8])).toBe(7);
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('data-form-avvikelse');
    } finally {
      console.warn = original;
    }
  });
});

test.describe('schema-parity — EventSchema beläggning (NaN-specialValue stängd)', () => {
  function validEvent(overrides: Record<string, unknown> = {}) {
    return {
      id: 'recE',
      eventlabel: 'Label',
      eventNamn: 'Event',
      typ: 'Utbildning',
      ort: 'Skövde',
      startdatum: '2026-01-15',
      slutdatum: '2026-01-15',
      tidKvarTillEvent: 'Avslutat',
      maxPlatser: null,
      antalAnmalda: 0,
      platserKvar: 0,
      anmaldBelaggning: null,
      bekraftadBelaggning: 0,
      antalNyaAnmalningar: 0,
      antalAnmalningsavgifter: 0,
      antalSlutbetalningar: 0,
      antalSlutbetalningFelande: 0,
      status: null,
      ...overrides,
    };
  }

  test('EventSchema accepterar anmaldBelaggning=null (NaN-fallet efter scalarNumber)', () => {
    const parsed = EventSchema.parse(validEvent());
    expect(parsed.anmaldBelaggning).toBeNull(); // NaN→null-vägen är giltig domänform
  });

  test('EventSchema AVVISAR rå specialValue-objekt (regressionsvakt: coercion krävs)', () => {
    // Utan scalarNumber skulle EF:n släppa objektet rakt igenom — schemat
    // (z.number().nullable()) MÅSTE avvisa det, annars är klass-buggen öppen.
    expect(() =>
      EventSchema.parse(validEvent({ anmaldBelaggning: { specialValue: 'NaN' } })),
    ).toThrow();
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
      motivering: [],
      hamtningar: [],
      motiveringar: [],
      flagga: null,
      inbjudenCommunity: false,
      skapatKontoCommunity: false,
      historik: [],
    });
    expect(parsed.allaHamtningar).toEqual(['Kraftfältet', 'Andetag']);
  });
});

test.describe('schema-parity — motivering är string[] (TASK-52-bug stängd)', () => {
  function validPersonDetail(overrides: Record<string, unknown> = {}) {
    return {
      id: 'recX',
      namn: 'A',
      fornamn: null,
      efternamn: null,
      email: null,
      telefon: null,
      ort: [],
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
      aterkommande: null,
      nastaEvent: null,
      antalGenomfordaEvent: 0,
      senasteDeltagandeDatum: null,
      antalHamtningar: 0,
      allaHamtningar: [],
      motivering: [],
      hamtningar: [],
      motiveringar: [],
      flagga: null,
      inbjudenCommunity: false,
      skapatKontoCommunity: false,
      historik: [],
      ...overrides,
    };
  }

  // RÖTT-FÖRST, FAKTISKT KÖRT (inte bara påstått): mot den GAMLA
  // schemadeklarationen (`z.string().nullable()`, git-stashad tillfälligt och
  // körd separat) fäller alla fyra tester i denna describe med ZodError
  // `expected string, received array` på `motivering` — ordagrant TASK-52:s
  // live-verifierade fel. Efter `git stash pop` (denna fix) är alla fyra
  // gröna. Se PR-beskrivning/slutrapport för körningen.
  test('PersonDetailSchema accepterar motivering som array (TASK-52, live-verifierad form)', () => {
    const parsed = PersonDetailSchema.parse(
      validPersonDetail({
        motivering: ['Jag har länge varit nyfiken på medvetandeutveckling.'],
      }),
    );
    expect(parsed.motivering).toEqual(['Jag har länge varit nyfiken på medvetandeutveckling.']);
  });

  test('PersonDetailSchema bevarar FLERHET — ingen tyst första-element-reduktion', () => {
    // Flera Anmälningar kan var och en bära en motivering (kortets egen
    // rekommendation, § ATT AVGÖRA I SKIVAN (b)). Ingen live-post visar >1
    // element ännu (TASK-89: "flerhet är inte observerad") — detta bevisar att
    // KONTRAKTET bär flerhet, inte att verkligheten gör det idag.
    const parsed = PersonDetailSchema.parse(
      validPersonDetail({ motivering: ['Motivering från anmälan A', 'Motivering från anmälan B'] }),
    );
    expect(parsed.motivering).toEqual(['Motivering från anmälan A', 'Motivering från anmälan B']);
  });

  test('PersonDetailSchema: tom lista är giltig (ingen motivering registrerad)', () => {
    const parsed = PersonDetailSchema.parse(validPersonDetail({ motivering: [] }));
    expect(parsed.motivering).toEqual([]);
  });

  test('PersonDetailSchema AVVISAR gammal skalär-sträng-form (regressionsvakt)', () => {
    // Den GAMLA (buggiga) schemaformen (`z.string().nullable()`) väntade sig en
    // sträng eller null. Skulle get-person någonsin sluta coerca med
    // stringArray och gå tillbaka till en rå skalär (eller null) ska schemat
    // fälla — inte tyst acceptera regressionen.
    expect(() =>
      PersonDetailSchema.parse(validPersonDetail({ motivering: 'En sträng, ingen array' })),
    ).toThrow();
    expect(() => PersonDetailSchema.parse(validPersonDetail({ motivering: null }))).toThrow();
  });
});

test.describe('schema-parity — hamtningar/motiveringar/flagga (S103 steg 2, get-person)', () => {
  // Samma `validPersonDetail`-mönster som motivering-describe-blocket ovan,
  // duplicerat lokalt (inte importerat mellan describe-block — matchar
  // filens egen konvention: varje describe äger sin egen fixtur-builder).
  function validPersonDetail(overrides: Record<string, unknown> = {}) {
    return {
      id: 'recX',
      namn: 'A',
      fornamn: null,
      efternamn: null,
      email: null,
      telefon: null,
      ort: [],
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
      aterkommande: null,
      nastaEvent: null,
      antalGenomfordaEvent: 0,
      senasteDeltagandeDatum: null,
      antalHamtningar: 0,
      allaHamtningar: [],
      motivering: [],
      hamtningar: [],
      motiveringar: [],
      flagga: null,
      inbjudenCommunity: false,
      skapatKontoCommunity: false,
      historik: [],
      ...overrides,
    };
  }

  test('PersonDetailSchema accepterar hamtningar som array av strukturerade poster', () => {
    const parsed = PersonDetailSchema.parse(
      validPersonDetail({
        hamtningar: [
          {
            id: 'recTP001',
            erbjudande: 'Meditationen Kraftfältet',
            typ: 'Angett e-post för att ta del av ett erbjudande',
            datum: '2026-04-19',
          },
          { id: 'recTP002', erbjudande: null, typ: 'Öppnat e-post', datum: null },
        ],
      }),
    );
    // FLERHET bevarad — ingen tyst första-element-reduktion (samma disciplin
    // som motivering-blocket ovan, nu för en array av OBJEKT i stället för
    // strängar).
    expect(parsed.hamtningar).toHaveLength(2);
    expect(parsed.hamtningar[0]).toEqual({
      id: 'recTP001',
      erbjudande: 'Meditationen Kraftfältet',
      typ: 'Angett e-post för att ta del av ett erbjudande',
      datum: '2026-04-19',
    });
    // `erbjudande` null för en touchpoint-typ som inte gäller ett erbjudande —
    // inte en tom sträng, och `datum` null för en datumlös post.
    expect(parsed.hamtningar[1]).toEqual({
      id: 'recTP002',
      erbjudande: null,
      typ: 'Öppnat e-post',
      datum: null,
    });
  });

  test('PersonDetailSchema: hamtningar tom lista är giltig (inga touchpoints länkade)', () => {
    const parsed = PersonDetailSchema.parse(validPersonDetail({ hamtningar: [] }));
    expect(parsed.hamtningar).toEqual([]);
  });

  test('PersonDetailSchema AVVISAR hamtningar i den GAMLA platta string[]-formen', () => {
    // hamtningar är en array av OBJEKT (id/erbjudande/typ/datum) — inte en
    // array av strängar som `allaHamtningar`. Skulle get-person någonsin
    // returnera den plattade formen på det nya fältnamnet ska schemat fälla.
    expect(() =>
      PersonDetailSchema.parse(
        validPersonDetail({ hamtningar: ['Meditationen Kraftfältet (2026-04-19)'] }),
      ),
    ).toThrow();
  });

  test('PersonDetailSchema accepterar motiveringar som array av strukturerade poster', () => {
    const parsed = PersonDetailSchema.parse(
      validPersonDetail({
        motiveringar: [
          {
            id: 'recANM001',
            motivering: 'Jag vill lära mig mer.',
            event: 'Resor i medvetandet 1',
            datum: '2026-02-01T09:00:00.000Z',
          },
          { id: 'recANM002', motivering: null, event: null, datum: null },
        ],
      }),
    );
    expect(parsed.motiveringar).toHaveLength(2);
    expect(parsed.motiveringar[0]).toEqual({
      id: 'recANM001',
      motivering: 'Jag vill lära mig mer.',
      event: 'Resor i medvetandet 1',
      datum: '2026-02-01T09:00:00.000Z',
    });
    expect(parsed.motiveringar[1]).toEqual({
      id: 'recANM002',
      motivering: null,
      event: null,
      datum: null,
    });
  });

  test('PersonDetailSchema: motiveringar tom lista är giltig (inga anmälningar länkade)', () => {
    const parsed = PersonDetailSchema.parse(validPersonDetail({ motiveringar: [] }));
    expect(parsed.motiveringar).toEqual([]);
  });

  test('PersonDetailSchema AVVISAR motiveringar i den GAMLA platta string[]-formen', () => {
    expect(() =>
      PersonDetailSchema.parse(validPersonDetail({ motiveringar: ['Jag vill lära mig mer.'] })),
    ).toThrow();
  });

  test('PersonDetailSchema: flagga accepterar sträng och null', () => {
    expect(
      PersonDetailSchema.parse(validPersonDetail({ flagga: 'Ring innan nästa event' })).flagga,
    ).toBe('Ring innan nästa event');
    expect(PersonDetailSchema.parse(validPersonDetail({ flagga: null })).flagga).toBeNull();
  });

  test('PersonDetailSchema AVVISAR flagga som saknas helt (regressionsvakt mot manuellFlagga-klassen)', () => {
    // `Manuella flagga` (manuellFlagga) kunde ALDRIG sättas (choices=[],
    // data-model.md §Kända fällor 25) — `flagga` ersätter den. Skulle
    // get-person någonsin sluta läsa `Flagga` och tappa nyckeln helt ska
    // schemat fälla, inte tyst acceptera ett `undefined`.
    const utanFlagga = validPersonDetail() as Record<string, unknown>;
    delete utanFlagga.flagga;
    expect(() => PersonDetailSchema.parse(utanFlagga)).toThrow();
  });
});
