import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { KONTRAKTSFALL } from '../kontraktsvakt/kontraktsfall';
import {
  byggLarm,
  granskaKontrakt,
  KontraktsavvikelseError,
  type Kontraktsfall,
  type SkarptSvar,
} from '../kontraktsvakt/kontraktsjamforelse';

/**
 * Negativt self-test för kontraktsvakten (task-59.2, ADR-080 beslut 3).
 *
 * EN VAKT SOM ALDRIG SETTS LARMA ÄR INTE VERIFIERAD. Den nattliga körningen är
 * tyst så länge fixturerna stämmer — och en tyst körning kan aldrig bevisa att
 * vakten skulle fälla. Bara ett medvetet fel kan det. Samma disciplin som
 * hermetik-vaktens negativa self-test (`tests/visual/hermetik-vakt.spec.ts`).
 *
 * VARFÖR FILEN BOR I `tests/api/` OCH INTE HOS VAKTEN. Jämförelsekärnan är ren
 * — inga anrop, ingen env — så beviset kräver ingen staging. Här kör det i
 * `api-pure`, alltså i `test-fast`-jobbet vid VARJE PR, utan mutex och utan
 * creds. Låg det i `kontraktsvakt`-projektet hade det ärvt dess
 * staging-beroende och bara körts på natten: vakten hade då kunnat gå sönder
 * i en PR utan att någon såg det förrän nästa natt.
 *
 * TVÅ SORTERS FALL, MEDVETET BLANDADE:
 *
 *   · DE VERKLIGA (`KONTRAKTSFALL`) används där beviset ska gälla den skarpa
 *     uppställningen — att varje fixtur parsar genom sitt eget schema, och att
 *     en medvetet felaktig VERKLIG fixtur larmar med endpointen namngiven.
 *   · SYNTETISKA fall används för de klasser som inte går att framkalla rent i
 *     verklig data (typdivergens utan samtidigt schemabrott kräver ett fält
 *     schemat inte typar). Det syntetiska schemat prövar JÄMFÖRELSEN, aldrig
 *     ett svar — vaktens egen regel att samma schema ska parsa båda sidor står
 *     orörd.
 */

/** Djupkopia så en saboterad fixtur aldrig läcker till nästa test. */
function kopia<T>(varde: T): T {
  return structuredClone(varde);
}

/** Det verkliga get-event-notes-fallet — minsta ytan, fem nycklar. */
const NOTES = KONTRAKTSFALL.find((f) => f.endpoint === 'get-event-notes');
if (NOTES === undefined) throw new Error('get-event-notes saknas i KONTRAKTSFALL');

/** Det verkliga get-person-fallet — vaktens djupaste enkelpost-kuvert (TASK-68). */
const PERSON = KONTRAKTSFALL.find((f) => f.endpoint === 'get-person');
if (PERSON === undefined) throw new Error('get-person saknas i KONTRAKTSFALL');

/** Ett skarpt svar som är EXAKT fixturen — utgångsläget "allt stämmer". */
function skarptLikaSomFixturen(fall: Kontraktsfall): SkarptSvar {
  return { status: 200, kropp: kopia(fall.fixtur) };
}

function poster(svar: SkarptSvar, nyckel: string): Record<string, unknown>[] {
  return (svar.kropp as Record<string, Record<string, unknown>[]>)[nyckel];
}

/** Enkelpost-kuvertets enda post — `{ person: {…} }` (TASK-68). */
function enkelpost(svar: SkarptSvar, nyckel: string): Record<string, unknown> {
  return (svar.kropp as Record<string, Record<string, unknown>>)[nyckel];
}

function klasser(fall: Kontraktsfall, skarpt: SkarptSvar): string[] {
  return granskaKontrakt(fall, skarpt).map((a) => a.klass);
}

/** Hela larmtexten för ett fall — det som faktiskt når den som väcks kl. 03. */
function larmtext(fall: Kontraktsfall, skarpt: SkarptSvar): string {
  const avvikelser = granskaKontrakt(fall, skarpt);
  expect(avvikelser.length, 'saboterat fall ska ge minst en avvikelse').toBeGreaterThan(0);
  return byggLarm(fall, skarpt, avvikelser);
}

test.describe('kontraktsvakten — tyst när fixturen stämmer', () => {
  for (const fall of KONTRAKTSFALL) {
    test(`${fall.endpoint}: identiska sidor ger NOLL avvikelser`, () => {
      // Dubbelt bevis i ett: jämförelsen är inte trigger-happy, OCH varje
      // fixtur parsar genom sitt eget schema (annars hade SCHEMA-FIXTUR
      // fyrat här utan att någon skarp körning behövdes).
      expect(granskaKontrakt(fall, skarptLikaSomFixturen(fall))).toEqual([]);
    });
  }

  test('null i staging där fixturen har värde larmar INTE', () => {
    // Designbeslutet, prövat: schemat tillåter null, så vakten kan inte skilja
    // "fältet är tomt i staging" från "fältet har slutat fyllas". Larmade den
    // här vore varje natt full av brus från en tunn staging-bas — och en vakt
    // med brus är en vakt ingen läser.
    const skarpt = skarptLikaSomFixturen(NOTES);
    for (const post of poster(skarpt, NOTES.kuvertnyckel)) post.forfattare = null;

    expect(granskaKontrakt(NOTES, skarpt)).toEqual([]);
  });
});

test.describe('kontraktsvakten — larmar på en medvetet felaktig fixtur', () => {
  test('fixturen saknar en nyckel staging levererar → FIXTUREN-BAKOM', () => {
    const fall: Kontraktsfall = { ...NOTES, fixtur: kopia(NOTES.fixtur) };
    for (const post of poster({ status: 200, kropp: fall.fixtur }, fall.kuvertnyckel)) {
      delete post.forfattare;
    }
    const text = larmtext(fall, skarptLikaSomFixturen(NOTES));

    expect(klasser(fall, skarptLikaSomFixturen(NOTES))).toContain('FIXTUREN-BAKOM');
    // AC 4: larmet ska namnge VAD som glidit och HUR — inte bara att något gjort det.
    expect(text).toContain('get-event-notes');
    expect(text).toContain('forfattare');
    expect(text).toContain('FIXTUREN-BAKOM');
  });

  test('fixturen har hittat på ett fält → OKÄND-NYCKEL-FIXTUR + FIXTUREN-FÖRE', () => {
    const fall: Kontraktsfall = { ...NOTES, fixtur: kopia(NOTES.fixtur) };
    for (const post of poster({ status: 200, kropp: fall.fixtur }, fall.kuvertnyckel)) {
      post.pahittatFalt = 'finns inte i basen';
    }
    const utfall = klasser(fall, skarptLikaSomFixturen(NOTES));

    expect(utfall).toContain('OKÄND-NYCKEL-FIXTUR');
    expect(utfall).toContain('FIXTUREN-FÖRE');
    expect(larmtext(fall, skarptLikaSomFixturen(NOTES))).toContain('pahittatFalt');
  });

  test('fixturen bryter mot sitt eget schema → SCHEMA-FIXTUR', () => {
    const fall: Kontraktsfall = { ...NOTES, fixtur: kopia(NOTES.fixtur) };
    for (const post of poster({ status: 200, kropp: fall.fixtur }, fall.kuvertnyckel)) {
      post.tidpunkt = 42;
    }

    expect(klasser(fall, skarptLikaSomFixturen(NOTES))).toContain('SCHEMA-FIXTUR');
  });
});

test.describe('kontraktsvakten — larmar när STAGING glidit', () => {
  test('staging levererar en nyckel schemat inte känner → OKÄND-NYCKEL-STAGING', () => {
    // Den tysta felklassen ADR-080 beslut 3 punkt 2 pekar ut: zod släpper
    // okända nycklar, alltså finns ingen parse som kan fälla. Utan vakten
    // finns "there is no signal".
    const skarpt = skarptLikaSomFixturen(NOTES);
    for (const post of poster(skarpt, NOTES.kuvertnyckel)) post.nyttFaltFranBasen = 'AT-Max';

    expect(klasser(NOTES, skarpt)).toContain('OKÄND-NYCKEL-STAGING');
    expect(larmtext(NOTES, skarpt)).toContain('nyttFaltFranBasen');
  });

  test('staging bryter mot schemat → SCHEMA-STAGING, prioriterad i texten', () => {
    const skarpt = skarptLikaSomFixturen(NOTES);
    for (const post of poster(skarpt, NOTES.kuvertnyckel)) post.tidpunkt = 42;

    expect(klasser(NOTES, skarpt)).toContain('SCHEMA-STAGING');
    expect(larmtext(NOTES, skarpt)).toContain('trolig regression i');
  });

  test('staging svarar inte 200 → HTTP-STATUS utan påstående om fixturen', () => {
    const avvikelser = granskaKontrakt(NOTES, {
      status: 503,
      kropp: null,
      ratext: 'upstream nere',
    });

    expect(avvikelser.map((a) => a.klass)).toEqual(['HTTP-STATUS']);
    // Samma disciplin som larm-jobbets okända commit-spann: frånvaro av data
    // får aldrig kläs ut till ett faktapåstående.
    expect(avvikelser[0].foljd).toContain('INTE ett påstående om att fixturen glidit');
  });

  test('staging returnerar tom lista → TOMT-UNDERLAG, inte "fixturen är fel"', () => {
    const avvikelser = granskaKontrakt(NOTES, { status: 200, kropp: { notes: [] } });

    expect(avvikelser.map((a) => a.klass)).toEqual(['TOMT-UNDERLAG']);
    expect(avvikelser[0].foljd).toContain('INTE ett påstående om att fixturen glidit');
  });

  test('kuvertet byter nyckel → KUVERT och inget annat', () => {
    const avvikelser = granskaKontrakt(NOTES, { status: 200, kropp: { anteckningar: [] } });

    expect(avvikelser.map((a) => a.klass)).toEqual(['KUVERT']);
  });
});

test.describe('kontraktsvakten — enkelpost-kuvert', () => {
  /**
   * `get-event` och `get-person` svarar med ETT objekt, inte en lista. Utan
   * `enkelpost` hade `listaAvPoster` gett `undefined` och vakten larmat KUVERT
   * varje natt om sin egen form i stället för om kontraktet — därför prövas
   * wrappningen här, i den rena sviten, och inte först mot staging.
   */

  test('enkelpost går genom SAMMA jämförelse som en lista, inte en genväg', () => {
    // Beviset att wrappningen matar hela kedjan: en okänd nyckel i staging ska
    // ge exakt samma klass som den gör i ett listfall.
    const skarpt = skarptLikaSomFixturen(PERSON);
    enkelpost(skarpt, PERSON.kuvertnyckel).nyttFaltFranBasen = 'AT-Max';

    expect(klasser(PERSON, skarpt)).toContain('OKÄND-NYCKEL-STAGING');
    expect(larmtext(PERSON, skarpt)).toContain('nyttFaltFranBasen');
  });

  test('TASK-52:s form — motivering som ARRAY i staging → SCHEMA-STAGING', () => {
    // DEN LIVE-VERIFIERADE PRODUKTIONSDEFEKTEN, spelad upp mot vakten utan
    // staging: `Motivering (text)` är ett lookup i Airtable och returnerar en
    // array, medan PersonDetail.schema.ts:44 kräver `z.string().nullable()`.
    // Kartläggningen (§ 6, lager 1) säger att vakten hade fällt den FÖRSTA
    // NATTEN om get-person stått i listan. Det påståendet är ett antagande så
    // länge ingen prövat det — här prövas det.
    const skarpt = skarptLikaSomFixturen(PERSON);
    enkelpost(skarpt, PERSON.kuvertnyckel).motivering = ['Det är dags', null];
    const utfall = klasser(PERSON, skarpt);

    expect(utfall).toContain('SCHEMA-STAGING');
    // Typdivergensen fyrar också: sträng i fixturen, lista i staging. Två
    // oberoende signaler på samma drift.
    expect(utfall).toContain('TYPDIVERGENS');
    expect(larmtext(PERSON, skarpt)).toContain('motivering');
  });

  test('enkelpost-fall som får en LISTA → KUVERT och inget annat', () => {
    // Kuvertet har bytt form från objekt till lista. Att tolerera det hade
    // gjort vakten blind för precis den drift den finns för att se.
    const avvikelser = granskaKontrakt(PERSON, { status: 200, kropp: { person: [] } });

    expect(avvikelser.map((a) => a.klass)).toEqual(['KUVERT']);
    expect(avvikelser[0].rubrik).toContain("posten 'person'");
  });

  test('listfall som får ett OBJEKT → KUVERT och inget annat', () => {
    // Spegelvänt mot testet ovan — samma spärr åt andra hållet.
    const avvikelser = granskaKontrakt(NOTES, { status: 200, kropp: { notes: {} } });

    expect(avvikelser.map((a) => a.klass)).toEqual(['KUVERT']);
    expect(avvikelser[0].rubrik).toContain("listan 'notes'");
  });
});

test.describe('kontraktsvakten — typdivergens', () => {
  // Syntetiskt fall: `matt` är otypat i schemat, så sidorna kan skilja sig i
  // TYP utan att någon schema-parse fäller. Just den kombinationen går inte
  // att framkalla i verklig data, och det är den zod ensam är blind för.
  const SYNTETISKT: Kontraktsfall = {
    endpoint: 'syntetisk-endpoint',
    sokvag: '/functions/v1/syntetisk-endpoint',
    kuvertnyckel: 'poster',
    schema: z.object({ id: z.string(), matt: z.unknown() }),
    schemanamn: 'SyntetisktSchema',
    schemakalla: '(syntetiskt, endast för self-testet)',
    fixtur: { poster: [{ id: 'a', matt: 0.67 }] },
    fixturkalla: '(syntetiskt)',
    urval: '(syntetiskt)',
  };

  test('samma nyckel, olika typ → TYPDIVERGENS med båda typerna utskrivna', () => {
    const skarpt: SkarptSvar = { status: 200, kropp: { poster: [{ id: 'a', matt: '67 %' }] } };
    const avvikelser = granskaKontrakt(SYNTETISKT, skarpt);

    expect(avvikelser.map((a) => a.klass)).toEqual(['TYPDIVERGENS']);
    expect(avvikelser[0].detaljer.join('\n')).toContain('fixtur: tal');
    expect(avvikelser[0].detaljer.join('\n')).toContain('staging: sträng');
  });

  test('identisk typ → tyst', () => {
    const skarpt: SkarptSvar = { status: 200, kropp: { poster: [{ id: 'b', matt: 0.5 }] } };

    expect(granskaKontrakt(SYNTETISKT, skarpt)).toEqual([]);
  });
});

test.describe('larmets form', () => {
  test('bär endpoint, fixturkälla, schema, icke-blockerande och nästa steg', () => {
    const skarpt = skarptLikaSomFixturen(NOTES);
    for (const post of poster(skarpt, NOTES.kuvertnyckel)) post.nyttFaltFranBasen = 'AT-Max';
    const text = larmtext(NOTES, skarpt);

    // Adressering: den som väcks kl. 03 ska slippa leta reda på var något bor.
    expect(text).toContain('KONTRAKTSVAKTEN LARMAR — get-event-notes');
    expect(text).toContain(NOTES.fixturkalla);
    expect(text).toContain(NOTES.schemanamn);
    expect(text).toContain(NOTES.schemakalla);

    // AC 1: att larmet inte fäller en PR ska stå i larmet, inte bara i en ADR.
    expect(text).toContain('BLOCKERAR INGEN PR');

    // Handling framför diagnos, och den ärliga gränsen med.
    expect(text).toContain('VAD DU GÖR NU');
    expect(text).toContain('npm run vakt:kontrakt');
    expect(text).toContain('VAD VAKTEN INTE SER');
    // Mätdata-motiveringen går genom larmets ordbrytare, så den prövas mot en
    // whitespace-normaliserad kopia. Annars vore assertionen bunden till var
    // just denna URVAL-text råkar brytas — och det är inte vad den vill bevisa
    // (TASK-68: texten bröt mellan '103 av' och '118' när svansen togs med).
    expect(text.replace(/\s+/g, ' ')).toContain('103 av 118');
  });

  test('felet bär larmet i sitt meddelande', () => {
    const skarpt = skarptLikaSomFixturen(NOTES);
    for (const post of poster(skarpt, NOTES.kuvertnyckel)) post.nyttFaltFranBasen = 'AT-Max';
    const fel = new KontraktsavvikelseError(larmtext(NOTES, skarpt));

    expect(fel).toBeInstanceOf(Error);
    expect(fel.name).toBe('KontraktsavvikelseError');
    expect(fel.message).toContain('KONTRAKTSVAKTEN LARMAR');
  });
});
