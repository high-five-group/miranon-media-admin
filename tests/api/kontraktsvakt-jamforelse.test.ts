import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { FELKONTRAKTSFALL, KONTRAKTSFALL } from '../kontraktsvakt/kontraktsfall';
import {
  byggFellarm,
  byggLarm,
  type Felkontraktsfall,
  granskaFelkontrakt,
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

/**
 * FELKONTRAKTEN (TASK-69) — det tvåsidiga beviset.
 *
 * En vakt som aldrig setts fälla är inte verifierad, och en som aldrig setts
 * tiga är inte användbar. Båda riktningarna prövas därför här, i den RENA
 * sviten: `granskaFelkontrakt` gör inga anrop, så beviset kräver ingen staging
 * och körs vid varje PR — till skillnad från själva vakten, som bara går på
 * natten.
 *
 * KONTRAKTSVÄRDENA I FALLEN ÄR MÄTTA MOT STAGING (se `kontraktsfall.ts` §
 * VÄRDENA ÄR MÄTTA). Testerna nedan spelar upp avvikelser FRÅN den mätta
 * sanningen — de hittar alltså inte på vad kontraktet är.
 */

/** get-person-felfallet — 404-kontraktet som kortet är skrivet om. */
const FEL_PERSON = FELKONTRAKTSFALL.find((f) => f.endpoint === 'get-person');
if (FEL_PERSON === undefined) throw new Error('get-person saknas i FELKONTRAKTSFALL');

/** get-persons-felfallet — cursor-400, obevakat i repot före detta kort. */
const FEL_PERSONS = FELKONTRAKTSFALL.find((f) => f.endpoint === 'get-persons');
if (FEL_PERSONS === undefined) throw new Error('get-persons saknas i FELKONTRAKTSFALL');

/** Svaret kontraktet föreskriver — utgångsläget "funktionen håller ordning". */
function svarEnligtKontrakt(fall: Felkontraktsfall): SkarptSvar {
  return {
    status: fall.forvantadStatus,
    kropp: { [fall.felnyckel]: fall.felmeddelande },
  };
}

test.describe('felkontrakten — TYST när kontraktet hålls', () => {
  for (const fall of FELKONTRAKTSFALL) {
    test(`${fall.endpoint}: ${fall.forvantadStatus} + rätt felkropp ger NOLL avvikelser`, () => {
      expect(granskaFelkontrakt(fall, svarEnligtKontrakt(fall))).toEqual([]);
    });
  }

  test('extra nycklar i felkroppen larmar INTE', () => {
    // Vakten prövar det DEKLARERADE kontraktet, inte hela kuvertet. En
    // funktion som börjar skicka `requestId` bredvid `error` har inte brutit
    // något löfte — och att larma på det hade gjort varje berikning till en
    // natt med brus.
    const skarpt: SkarptSvar = {
      status: FEL_PERSON.forvantadStatus,
      kropp: { [FEL_PERSON.felnyckel]: FEL_PERSON.felmeddelande, requestId: 'abc-123' },
    };

    expect(granskaFelkontrakt(FEL_PERSON, skarpt)).toEqual([]);
  });
});

test.describe('felkontrakten — FÄLLER när kontraktet bryts', () => {
  test('FAIL-OPEN: 200 där kontraktet säger 404 → FELSTATUS med fail-open-följden', () => {
    // DEN FARLIGA RIKTNINGEN, och exakt den form fixturvärlden redan har:
    // `resolvePersonResponse` ger `undefined` för okänt ID, vilket via
    // `json(undefined)` blir HTTP 200 med tom kropp. Skulle EF:en glida dit
    // vore spärren borta utan en enda röd signal någon annanstans — ingen
    // zod-parse kan se ett kontrakt som ligger i STATUSKODEN.
    const skarpt: SkarptSvar = { status: 200, kropp: null, ratext: '' };
    const avvikelser = granskaFelkontrakt(FEL_PERSON, skarpt);

    expect(avvikelser.map((a) => a.klass)).toEqual(['FELSTATUS']);
    expect(avvikelser[0].foljd).toContain('FAIL-OPEN');
    expect(avvikelser[0].rubrik).toContain('Staging svarade 200, inte 404');
  });

  test('200 + en riktig person där 404 väntades → fortfarande FELSTATUS', () => {
    // Samma fail-open, men med en kropp som PARSAR. Poängen: det är statusen
    // som bär kontraktet, så ett välformat svar gör avvikelsen värre — inte
    // mindre.
    const skarpt: SkarptSvar = { status: 200, kropp: { person: { id: 'recX', namn: 'Ingen' } } };
    const avvikelser = granskaFelkontrakt(FEL_PERSON, skarpt);

    expect(avvikelser.map((a) => a.klass)).toEqual(['FELSTATUS']);
    expect(avvikelser[0].foljd).toContain('FAIL-OPEN');
  });

  test('500 där 404 väntades → FELSTATUS UTAN fail-open-påståendet', () => {
    // Fortfarande avvisat, men i fel gren. Följden ska inte överdriva: en 500
    // är illa, men den är inte fail-open, och ett larm som blandar ihop de två
    // lär läsaren att misstro texten.
    const skarpt: SkarptSvar = { status: 500, kropp: { error: 'Internal error' } };
    const avvikelser = granskaFelkontrakt(FEL_PERSON, skarpt);

    expect(avvikelser.map((a) => a.klass)).toEqual(['FELSTATUS']);
    expect(avvikelser[0].foljd).not.toContain('FAIL-OPEN');
    expect(avvikelser[0].foljd).toContain('fel gren');
  });

  test('rätt status men felkroppen saknar nyckeln → FELKROPP', () => {
    const skarpt: SkarptSvar = { status: 404, kropp: { message: 'Person not found' } };
    const avvikelser = granskaFelkontrakt(FEL_PERSON, skarpt);

    expect(avvikelser.map((a) => a.klass)).toEqual(['FELKROPP']);
    expect(avvikelser[0].rubrik).toContain("saknar nyckeln 'error'");
    // Larmet ska namnge vad som fanns i stället — inte bara att något saknades.
    expect(avvikelser[0].detaljer.join('\n')).toContain('message');
  });

  test('rätt status men felkroppen är inget objekt → FELKROPP', () => {
    const skarpt: SkarptSvar = { status: 404, kropp: null, ratext: 'Not Found' };
    const avvikelser = granskaFelkontrakt(FEL_PERSON, skarpt);

    expect(avvikelser.map((a) => a.klass)).toEqual(['FELKROPP']);
    expect(avvikelser[0].detaljer.join('\n')).toContain('Not Found');
  });

  test('felnyckeln har bytt typ → FELKROPP med typen utskriven', () => {
    const skarpt: SkarptSvar = { status: 404, kropp: { error: { code: 'NOT_FOUND' } } };
    const avvikelser = granskaFelkontrakt(FEL_PERSON, skarpt);

    expect(avvikelser.map((a) => a.klass)).toEqual(['FELKROPP']);
    expect(avvikelser[0].rubrik).toContain('objekt, inte en sträng');
  });

  test('felmeddelandet har bytt lydelse → FELKROPP med båda texterna', () => {
    const skarpt: SkarptSvar = { status: 404, kropp: { error: 'Not found' } };
    const avvikelser = granskaFelkontrakt(FEL_PERSON, skarpt);

    expect(avvikelser.map((a) => a.klass)).toEqual(['FELKROPP']);
    const detaljer = avvikelser[0].detaljer.join('\n');
    expect(detaljer).toContain('"Not found"');
    expect(detaljer).toContain('"Person not found"');
  });

  test('cursor-fallet: 200 + sida 1 där 400 väntades → FELSTATUS fail-open', () => {
    // Fixturens FAKTISKA beteende i dag: `resolvePersonsResponse` gör
    // `cursor ? decodeFixtureCursor(cursor) : 0` med sin EGEN avkodare, så en
    // trasig cursor ger tyst sida 1 i stället för ett fel. Glider EF:en dit
    // börjar "Ladda fler" tyst om från början — ett fullt giltigt svar, och
    // därför osynligt för varje schema vi har.
    const skarpt: SkarptSvar = { status: 200, kropp: { persons: [], nextCursor: null } };
    const avvikelser = granskaFelkontrakt(FEL_PERSONS, skarpt);

    expect(avvikelser.map((a) => a.klass)).toEqual(['FELSTATUS']);
    expect(avvikelser[0].foljd).toContain('FAIL-OPEN');
  });
});

test.describe('felkontrakten — larmets form', () => {
  test('bär endpoint, kontraktskälla, icke-blockerande, nästa steg och gränsen', () => {
    const skarpt: SkarptSvar = { status: 200, kropp: null, ratext: '' };
    const avvikelser = granskaFelkontrakt(FEL_PERSON, skarpt);
    const text = byggFellarm(FEL_PERSON, skarpt, avvikelser);

    expect(text).toContain('KONTRAKTSVAKTEN LARMAR — get-person');
    // Adressering: den som väcks kl. 03 ska hitta grenen utan att leta.
    expect(text).toContain(FEL_PERSON.kontraktskalla);
    expect(text).toContain('HTTP 404');
    expect(text).toContain('Person not found');

    expect(text).toContain('BLOCKERAR INGEN PR');
    expect(text).toContain('VAD DU GÖR NU');
    expect(text).toContain('npm run vakt:kontrakt');
    expect(text).toContain('VAD VAKTEN INTE SER');

    // DEN AVGÖRANDE INSTRUKTIONEN: fixturen är inte part i denna jämförelse,
    // så att "laga" den vore att byta en synlig avvikelse mot en tyst.
    expect(text).toContain('Lappa ALDRIG fixturvärlden');

    // Räckvidden går genom larmets ordbrytare — prövas whitespace-normaliserat
    // så assertionen inte binds till var just denna text råkar brytas.
    expect(text.replace(/\s+/g, ' ')).toContain('Två felkontrakt bevakas');
  });

  test('felkontraktets larm bärs av samma feltyp som formkontraktets', () => {
    // Larmkedjan i nightly.yml grenar inte på feltyp — men en avvikande klass
    // hade gjort en röd natt svårare att söka i loggen, inte lättare.
    const skarpt: SkarptSvar = { status: 200, kropp: null, ratext: '' };
    const fel = new KontraktsavvikelseError(
      byggFellarm(FEL_PERSON, skarpt, granskaFelkontrakt(FEL_PERSON, skarpt)),
    );

    expect(fel.name).toBe('KontraktsavvikelseError');
    expect(fel.message).toContain('KONTRAKTSVAKTEN LARMAR');
  });

  test('200-larmet säger numera att felkontrakten prövas separat', () => {
    // Sanningskravet på "VAD VAKTEN INTE SER": texten påstod före TASK-69 att
    // felkontrakten var obevakade. Den meningen får inte bli kvar och ljuga åt
    // andra hållet heller — grönt på 200-formen säger fortfarande inget om dem.
    const skarpt = skarptLikaSomFixturen(NOTES);
    for (const post of poster(skarpt, NOTES.kuvertnyckel)) post.nyttFaltFranBasen = 'AT-Max';
    const text = larmtext(NOTES, skarpt).replace(/\s+/g, ' ');

    expect(text).toContain('Felkontrakten (404/400) har EGNA fall sedan TASK-69');
    expect(text).toContain('ett grönt utfall här säger alltså inget om dem');
  });
});
