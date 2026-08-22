// Enhetstest för personregistrets klientfilter (`src/lib/person-sok.ts`,
// ADR-123 beslut 2 + § Updates 2026-08-22, TASK-286.7).
//
// api-pure (ren logik, ingen staging, ingen nätverk) → körs lokalt + CI.
// Låser den EXAKTA semantiken klientfiltret måste bära: skiftläges-okänslig
// OCH DIAKRITIK-TOLERANT delsträngsmatch ("asa" hittar Åsa, samma beteende
// som eventväljarens `useFilter({ sensitivity: 'base' })`), "något element"
// för arrayfältet Ort, och tom sökterm = hela registret.
//
// [OMSKRIVEN, TASK-286.7] Sviten låste tidigare motsatsen — diakritik-
// KÄNSLIGHET, i paritet med Airtables `SEARCH()`. Marcus beslutade breddningen
// 2026-08-22 (TASK-286.5, JA): svenska namn bär diakritiker som vardag, och
// två sökytor med olika beteende i samma app är en inkonsekvens användaren
// omöjligt kan förutse. EF-pariteten var en MÄTNING av dagens läge, aldrig
// ett mål.
//
// Likvärdighetsproven mot eventväljarens filter, körd på VERKLIG staging-data,
// bor i `tests/api/get-persons-sok-paritet.staging.test.ts` — den filen
// importerar SAMMA `filtreraPersonregister` som denna, så de två sviterna kan
// aldrig glida isär till två olika implementationer.

import { expect, test } from '@playwright/test';
import type { Person } from '../../src/domain/models/Person';
import {
  arNamnlosSentinel,
  filtreraPersonregister,
  personMatcharSokterm,
  personVisningsnamn,
  SENTINEL_NAMNLOS,
  sorteraPersonregister,
} from '../../src/lib/person-sok';

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
    // mellanslag, direkt efter 070). TASK-286.7:s breddning gäller DIAKRITIKER
    // — den gör inte skiljetecken utbytbara, och den semantiken förblir
    // därför oförändrad här.
    expect(personMatcharSokterm(p, '070 1')).toBe(false);
  });

  test('arrayfältet Ort — "något element" (PRD-beslutet, ADR-123 beslut 2)', () => {
    const p = bas({ ort: ['Falköping', 'Varberg'] });
    expect(personMatcharSokterm(p, 'falköping')).toBe(true);
    // Vikningen gäller ALLA fyra sökfälten, inte bara Namn (AC #2:s ordval).
    expect(personMatcharSokterm(p, 'falkoping')).toBe(true);
    expect(personMatcharSokterm(p, 'varberg')).toBe(true);
    expect(personMatcharSokterm(p, 'göteborg')).toBe(false);
    expect(personMatcharSokterm(p, 'goteborg')).toBe(false);
  });

  test('sentinel-namnet "Ej tillgängligt" matchar en delsträng av sig själv', () => {
    const p = bas({ namn: 'Ej tillgängligt' });
    expect(personMatcharSokterm(p, 'ej till')).toBe(true);
  });

  test(
    'DIAKRITIK-TOLERANT (TASK-286.7, Marcus JA 2026-08-22): "asa" hittar Åsa, ' +
      '"åsa" gör det fortfarande',
    () => {
      const p = bas({ namn: 'Åsa Öberg' });
      // VÄNT FACIT: raden nedan var `false` fram till TASK-286.7 och är
      // kortets AC #1 i sin helhet. Går den röd har vikningen slutat gälla.
      expect(personMatcharSokterm(p, 'asa')).toBe(true);
      expect(personMatcharSokterm(p, 'åsa')).toBe(true);
      // Substräng av samma diakritiska tecken ska fortsatt matcha.
      expect(personMatcharSokterm(p, 'ås')).toBe(true);
      // Vikningen går ÅT BÅDA HÅLL och gäller alla tre svenska diakritikerna,
      // inte bara å: Ö i efternamnet nås av ett rent o.
      expect(personMatcharSokterm(p, 'oberg')).toBe(true);
      expect(personMatcharSokterm(p, 'öberg')).toBe(true);
    },
  );

  test('de namn Marcus motiverade beslutet med hittas utan diakritiker', () => {
    // TASK-286.5:s notes, ordagrant: "Åsa, Östergren, Ängström".
    expect(personMatcharSokterm(bas({ namn: 'Erik Östergren' }), 'ostergren')).toBe(true);
    expect(personMatcharSokterm(bas({ namn: 'Nils Ängström' }), 'angstrom')).toBe(true);
    // Och en icke-svensk diakritiker som kollationen bär utan eget bord.
    expect(personMatcharSokterm(bas({ namn: 'Sara Müller' }), 'muller')).toBe(true);
  });

  test('breddningen VIDGAR aldrig till fel person — bokstäverna måste fortfarande stämma', () => {
    // Marcus egen formulering: "fler namn, aldrig färre". Toleransen gäller
    // diakritiker, inte stavning — annars vore varje sökning en gissning.
    expect(personMatcharSokterm(bas({ namn: 'Anna Asp' }), 'åsa')).toBe(false);
    expect(personMatcharSokterm(bas({ namn: 'Anna Asp' }), 'asa')).toBe(false);
    // V och W är EGNA bokstäver, också i vikningskollationen (mätt).
    expect(personMatcharSokterm(bas({ namn: 'Wilma Wass' }), 'vilma')).toBe(false);
  });

  test(
    'VIKNINGSLOKALEN ÄR LASTBÄRANDE: en `sv`-kollation hade INTE gett toleransen ' +
      '(TASK-286.5:s kortformulering, falsifierad genom mätning)',
    () => {
      // TVÅSIDIGHETEN. Kortet föreslog `Intl.Collator('sv', { sensitivity:
      // 'base' })`. Å/Ä/Ö är EGNA bokstäver i svensk kollation, inte
      // accenttecken, så den vägen har ingenting att vika bort. Raden nedan
      // mäter det i stället för att lita på filhuvudets tabell — byter någon
      // `SOK_VIKNINGSLOKAL` till 'sv' blir testet ovan rött, och DENNA rad
      // förklarar varför.
      const svensk = new Intl.Collator('sv', { usage: 'search', sensitivity: 'base' });
      expect(svensk.compare('asa', 'åsa')).not.toBe(0);
      expect(svensk.compare('o', 'ö')).not.toBe(0);

      // Sorteringens collator är samma svenska kollation — och det är rätt
      // där. Att de två axlarna säger olika saker är avsikten (ADR-123
      // beslut 4 mot beslut 2), inte en motsägelse.
      expect(personMatcharSokterm(bas({ namn: 'Åsa Öberg' }), 'asa')).toBe(true);
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

// ---------------------------------------------------------------------------
// SVENSK SORTERING (ADR-123 beslut 4, TASK-286.3 AC #1)
// ---------------------------------------------------------------------------
//
// Två egenskaper låses, och de är oberoende av varandra:
//
//   1. KOLLATIONEN — A till Z följt av Å, Ä, Ö. Airtables egen
//      `Namn`-sortering lade Å bland A; det är fälla 51:s synliga
//      inkonsekvens mot bokstavsindexets Å-hink (TASK-283), och den stängs
//      här.
//   2. SENTINEL-HINKEN — `Ej tillgängligt` (fälla 43) sist, oavsett var
//      bokstavsordningen ensam hade placerat den.
//
// Egenskap 2 prövas TVÅSIDIGT: sentinelen sorterar alfabetiskt mellan `David`
// och `Emma` (fixturvärlden bygger på exakt det, `fixture-data.ts`), så ett
// utfall där den ligger SIST bevisar att hink-regeln faktiskt körde. Låg den
// sist redan av kollationen vore fallet grönt av en slump — och det låser
// ingenting.

test.describe('sorteraPersonregister — svensk kollation + sentinel sist', () => {
  const namnen = (personer: Person[]) => personer.map((p) => personVisningsnamn(p));

  test('A till Z, sedan Å, Ä, Ö — inte Airtables ordning där Å låg bland A', () => {
    const register = ['Östen Öberg', 'Anna Andersson', 'Åsa Ask', 'Bo Berg', 'Ärla Älv'].map(
      (namn) => bas({ id: `rec-${namn}`, namn }),
    );

    expect(namnen(sorteraPersonregister(register))).toEqual([
      'Anna Andersson',
      'Bo Berg',
      'Åsa Ask',
      'Ärla Älv',
      'Östen Öberg',
    ]);
  });

  test('fälla 51 är stängd: Åsa hamnar EFTER Z, aldrig bland A:na', () => {
    const register = ['Zäta Zetterberg', 'Åsa Ask', 'Anna Andersson'].map((namn) =>
      bas({ id: `rec-${namn}`, namn }),
    );

    const sorterat = namnen(sorteraPersonregister(register));
    expect(sorterat).toEqual(['Anna Andersson', 'Zäta Zetterberg', 'Åsa Ask']);
    expect(sorterat.indexOf('Åsa Ask')).toBeGreaterThan(sorterat.indexOf('Zäta Zetterberg'));
  });

  test('sentinelen sorteras SIST — inte på sin alfabetiska plats', () => {
    const namnlista = ['Emma Eklund', SENTINEL_NAMNLOS, 'David Dahl', 'Anna Andersson'];
    const register = namnlista.map((namn) => bas({ id: `rec-${namn}`, namn }));

    const sorterat = namnen(sorteraPersonregister(register));
    expect(sorterat).toEqual(['Anna Andersson', 'David Dahl', 'Emma Eklund', SENTINEL_NAMNLOS]);
    expect(sorterat.indexOf(SENTINEL_NAMNLOS)).toBe(sorterat.length - 1);

    // TVÅSIDIGHETEN: ren kollation UTAN hink-regeln lägger sentinelen på
    // index 2, mellan David och Emma. Att den ovan ligger sist är därför
    // regelns förtjänst, inte ordningens tur.
    const utanHinkregel = [...namnlista].sort(new Intl.Collator('sv').compare);
    expect(utanHinkregel.indexOf(SENTINEL_NAMNLOS)).toBe(2);
  });

  test('FLERA sentinel-poster hamnar alla sist, inbördes ordning stabil', () => {
    const register = [
      bas({ id: 'recS1', namn: SENTINEL_NAMNLOS }),
      bas({ id: 'recA', namn: 'Anna Andersson' }),
      bas({ id: 'recS2', namn: SENTINEL_NAMNLOS }),
    ];

    expect(sorteraPersonregister(register).map((p) => p.id)).toEqual(['recA', 'recS1', 'recS2']);
  });

  test('muterar ALDRIG indatan — React Querys cache får aldrig sorteras in-place', () => {
    const register = [
      bas({ id: 'rec2', namn: 'Björn Bergström' }),
      bas({ id: 'rec1', namn: 'Anna Andersson' }),
    ];
    const sorterat = sorteraPersonregister(register);

    expect(register.map((p) => p.id)).toEqual(['rec2', 'rec1']);
    expect(sorterat.map((p) => p.id)).toEqual(['rec1', 'rec2']);
    expect(sorterat).not.toBe(register);
  });

  test('tomt register kraschar inte', () => {
    expect(sorteraPersonregister([])).toEqual([]);
  });
});

test.describe('personVisningsnamn — sorteringsnyckeln ÄR nyckeln raden visar', () => {
  test('namn-formeln vinner när den är satt', () => {
    expect(personVisningsnamn(bas({ namn: 'Anna Andersson' }))).toBe('Anna Andersson');
  });

  test('faller till förnamn plus efternamn när namn saknas', () => {
    expect(personVisningsnamn(bas({ namn: null, fornamn: 'Anna', efternamn: 'Andersson' }))).toBe(
      'Anna Andersson',
    );
  });

  test('helt namnlös post får UI-tomformen, som INTE är basens sentinel', () => {
    const tom = bas({ namn: null, fornamn: null, efternamn: null });
    expect(personVisningsnamn(tom)).toBe('Okänt namn');
    // Medvetet smal sentinel-regel (se `person-sok.ts`): UI-tomformen hinkas
    // INTE, eftersom `Namn`-formeln alltid levererar en sträng och mängden
    // därför är omätt i verklig data.
    expect(arNamnlosSentinel(tom)).toBe(false);
  });

  test('sentinel-strängen känns igen exakt, aldrig på delsträng', () => {
    expect(arNamnlosSentinel(bas({ namn: SENTINEL_NAMNLOS }))).toBe(true);
    expect(arNamnlosSentinel(bas({ namn: 'Ej tillgängligt just nu' }))).toBe(false);
  });
});
