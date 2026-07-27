import { z } from 'zod';

/**
 * Kontraktsvaktens jämförelsekärna (task-59.2, ADR-080 beslut 3).
 *
 * VARFÖR VAKTEN FINNS. Zod-schemana är HALVA kontraktet. De fångar form-drift
 * i det de själva deklarerar — ett fält som byter typ, ett enum-värde som inte
 * finns. De fångar INTE (a) att ett fält finns kvar men betyder något annat,
 * och inte (b) att schemat självt glidit: schemat är VÅR BILD av Edge
 * Functionen, inte dess deklaration, så ändras funktion och schema i samma
 * commit uppstår ingen signal alls. Airtable-basen byggs dessutom aktivt om
 * under AT-Max-milstolpen ([ADR-063]), vilket är precis den period fixturer
 * driftar tyst.
 *
 * SNITTET: modulen är REN. Den gör inga anrop och läser ingen env — den tar en
 * fixtur och ett skarpt svar och svarar med avvikelser plus en larmtext. Det är
 * villkoret för att vakten kan bevisas negativt utan staging
 * (`tests/api/kontraktsvakt-jamforelse.test.ts`), på samma sätt som
 * hermetik-vakten bevisas i `tests/visual/hermetik-vakt.spec.ts`: en grön svit
 * kan aldrig visa att en vakt fäller — bara ett medvetet fel kan det.
 *
 * SAMMA SCHEMA PARSAR BÅDA SIDOR. Fixtursvaret och det skarpa svaret går genom
 * `fall.schema`, aldrig genom ett jämförelse-eget schema. Ett eget schema hade
 * rivit hela argumentet för acceptance-klassen: fogen mellan klasserna ÄR att
 * en enda schemadeklaration bär båda sidor (ADR-080 beslut 2).
 *
 * LARMET NAMNGER VAD OCH HUR. Formen är lånad ur hermetik-vaktens meddelande —
 * ett anonymt larm tvingar fram exakt den utredning vakten finns för att göra.
 * Texten skrivs för någon som väcks kl. 03 utan kontext: vad som glidit, vad
 * följden är, vad man gör nu, och vad vakten INTE ser.
 */

/** JSON-typerna ett fältvärde kan anta. `null` bärs som egen token. */
export type Typtoken = 'sträng' | 'tal' | 'boolean' | 'lista' | 'objekt' | 'null';

export interface Nyckelprofil {
  /** Alla typer nyckeln antagit över posterna, `null` inräknad. */
  typer: Set<Typtoken>;
  /** Antal poster där nyckeln över huvud taget fanns. */
  poster: number;
}

/** Nyckel → observerad form, unionerad över alla poster i ett svar. */
export type Formprofil = Map<string, Nyckelprofil>;

/**
 * Ett bevakat kontrakt: en Edge Function, dess fixtur och det schema som
 * parsar båda.
 *
 * ENDPOINT-LISTAN ÄR DEN DEL SOM SKRIVS OM VID SUPABASE-BYTET (ADR-080 beslut
 * 5, ~10 %-halvan). Vaktens FORM överlever oförändrad; det är vilka funktioner
 * som bär trafiken som byts.
 */
export interface Kontraktsfall {
  /** Edge Function-namnet, t.ex. `get-events`. Står först i larmet. */
  endpoint: string;
  /** Sökvägen inklusive ev. query, relativ Supabase-basen. */
  sokvag: string;
  /** Kuvertets nyckel — `{ events: [...] }` ⇒ `'events'`. */
  kuvertnyckel: string;
  /** Schemat som parsar EN post. Samma objekt används på båda sidor. */
  schema: z.ZodObject;
  /** Schemats namn + fil, för larmets adressering. */
  schemanamn: string;
  schemakalla: string;
  /** Fixturens kuvert (hela svaret, inte listan). */
  fixtur: unknown;
  /** Fixturens adress i klartext, för larmets adressering. */
  fixturkalla: string;
  /** Varför just detta anrop — mätdata-motiveringen, återgiven i larmet. */
  urval: string;
}

/** Det skarpa svaret, normaliserat till vad jämförelsen behöver. */
export interface SkarptSvar {
  status: number;
  /** Parsad JSON-kropp, eller `null` när svaret inte var JSON. */
  kropp: unknown;
  /** Råtext, endast för felmeddelanden när kroppen inte gick att parsa. */
  ratext?: string;
}

export type Avvikelseklass =
  | 'HTTP-STATUS'
  | 'KUVERT'
  | 'TOMT-UNDERLAG'
  | 'SCHEMA-STAGING'
  | 'SCHEMA-FIXTUR'
  | 'OKÄND-NYCKEL-STAGING'
  | 'OKÄND-NYCKEL-FIXTUR'
  | 'FIXTUREN-BAKOM'
  | 'FIXTUREN-FÖRE'
  | 'TYPDIVERGENS';

export interface Avvikelse {
  klass: Avvikelseklass;
  /** En rad som säger VAD. */
  rubrik: string;
  /** Punktlista som säger HUR — namngivna fält, inte antal. */
  detaljer: string[];
  /** Varför det spelar roll. Skriven för den som saknar kontexten. */
  foljd: string;
}

/** Kastas när ett kontrakt divergerar. Namnet gör klassen sökbar i loggen. */
export class KontraktsavvikelseError extends Error {
  constructor(larm: string) {
    super(larm);
    this.name = 'KontraktsavvikelseError';
  }
}

function typtoken(varde: unknown): Typtoken {
  if (varde === null) return 'null';
  if (Array.isArray(varde)) return 'lista';
  switch (typeof varde) {
    case 'string':
      return 'sträng';
    case 'number':
      return 'tal';
    case 'boolean':
      return 'boolean';
    default:
      return 'objekt';
  }
}

function arPost(varde: unknown): varde is Record<string, unknown> {
  return varde !== null && typeof varde === 'object' && !Array.isArray(varde);
}

/**
 * Unionerar posternas form. Poster som inte är objekt hoppas över — de fångas
 * av schema-parsen, som säger det bättre än en formprofil kan.
 */
export function byggFormprofil(poster: readonly unknown[]): Formprofil {
  const profil: Formprofil = new Map();
  for (const post of poster) {
    if (!arPost(post)) continue;
    for (const [nyckel, varde] of Object.entries(post)) {
      let p = profil.get(nyckel);
      if (p === undefined) {
        p = { typer: new Set<Typtoken>(), poster: 0 };
        profil.set(nyckel, p);
      }
      p.typer.add(typtoken(varde));
      p.poster++;
    }
  }
  return profil;
}

function typerText(profil: Nyckelprofil | undefined): string {
  if (profil === undefined) return '—';
  return [...profil.typer].sort().join(' | ');
}

/** Typerna utan `null`. Tom mängd = nyckeln var null i varje post. */
function ickeNullTyper(profil: Nyckelprofil): Set<Typtoken> {
  return new Set([...profil.typer].filter((t) => t !== 'null'));
}

function likaMangder(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function listaAvPoster(kuvert: unknown, kuvertnyckel: string): unknown[] | undefined {
  if (!arPost(kuvert)) return undefined;
  const lista = kuvert[kuvertnyckel];
  return Array.isArray(lista) ? lista : undefined;
}

/** Zod-fel som `sökväg: meddelande`-rader, max fem så larmet inte blir en vägg. */
function zodRader(fel: z.ZodError): string[] {
  const rader = fel.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join('.') || '(roten)'}: ${issue.message}`);
  if (fel.issues.length > 5) rader.push(`… ytterligare ${fel.issues.length - 5} fel`);
  return rader;
}

/**
 * Granskar ett kontrakt. Tom lista = fixturen speglar fortfarande staging.
 *
 * ORDNINGEN ÄR MEDVETEN: en trasig grund gör efterföljande jämförelser
 * meningslösa, så HTTP-status, kuvert och tomt underlag kortsluter. Att låta
 * dem falla igenom hade gett ett larm som skyller på fixturen när felet ligger
 * någon helt annanstans — precis det anonyma larm vakten ska undvika.
 */
export function granskaKontrakt(fall: Kontraktsfall, skarpt: SkarptSvar): Avvikelse[] {
  const avvikelser: Avvikelse[] = [];

  if (skarpt.status !== 200) {
    avvikelser.push({
      klass: 'HTTP-STATUS',
      rubrik: `Staging svarade ${skarpt.status}, inte 200`,
      detaljer: [`kropp: ${(skarpt.ratext ?? JSON.stringify(skarpt.kropp) ?? '').slice(0, 300)}`],
      foljd:
        'Ingen jämförelse gjordes. Detta är INTE ett påstående om att fixturen glidit — ' +
        'kontraktet kunde inte prövas. Vanligast: funktionen är inte deployad, token är ' +
        'utgången, eller staging är nere.',
    });
    return avvikelser;
  }

  const skarpLista = listaAvPoster(skarpt.kropp, fall.kuvertnyckel);
  const fixturLista = listaAvPoster(fall.fixtur, fall.kuvertnyckel);

  if (fixturLista === undefined) {
    avvikelser.push({
      klass: 'KUVERT',
      rubrik: `Fixturen saknar listan '${fall.kuvertnyckel}' i sitt kuvert`,
      detaljer: [`fixturens rotnycklar: ${JSON.stringify(rotnycklar(fall.fixtur))}`],
      foljd:
        'Fixturen är felformad — jämförelsen kunde inte göras. Fixturen och kontraktsfallet ' +
        'säger olika saker om vilken nyckel svaret bär.',
    });
    return avvikelser;
  }

  if (skarpLista === undefined) {
    avvikelser.push({
      klass: 'KUVERT',
      rubrik: `Staging svarar inte längre med listan '${fall.kuvertnyckel}'`,
      detaljer: [
        `fixturens rotnycklar: ${JSON.stringify(rotnycklar(fall.fixtur))}`,
        `stagings rotnycklar: ${JSON.stringify(rotnycklar(skarpt.kropp))}`,
      ],
      foljd:
        'Hela svarskuvertet har bytt form. Varje test som läser fixturen kör mot ett kuvert ' +
        'som inte finns, och appen mot ett den aldrig sett.',
    });
    return avvikelser;
  }

  if (skarpLista.length === 0) {
    avvikelser.push({
      klass: 'TOMT-UNDERLAG',
      rubrik: 'Staging returnerade noll poster — det fanns inget att jämföra mot',
      detaljer: [`fixturen bär ${fixturLista.length} poster`],
      foljd:
        'Detta är INTE ett påstående om att fixturen glidit: jämförelsen kunde inte göras. ' +
        'Frånvaro av data är inte ett grönt besked (samma klass som larm-jobbets okända ' +
        'commit-spann). Kontrollera att staging-basen fortfarande bär sina permanenta ' +
        'fixtur-rader.',
    });
    return avvikelser;
  }

  const listschema = z.array(fall.schema);

  const skarpParse = listschema.safeParse(skarpLista);
  if (!skarpParse.success) {
    avvikelser.push({
      klass: 'SCHEMA-STAGING',
      rubrik: `Det SKARPA svaret parsar inte genom ${fall.schemanamn}`,
      detaljer: zodRader(skarpParse.error),
      foljd:
        'Edge Functionen svarar i en form vårt schema inte beskriver. Appen kör samma schema ' +
        'i produktion — detta är alltså inte bara ett testfel utan en trolig regression i ' +
        'appen. Prioritera denna avvikelse före alla andra.',
    });
  }

  const fixturParse = listschema.safeParse(fixturLista);
  if (!fixturParse.success) {
    avvikelser.push({
      klass: 'SCHEMA-FIXTUR',
      rubrik: `FIXTURENS svar parsar inte genom ${fall.schemanamn}`,
      detaljer: zodRader(fixturParse.error),
      foljd:
        'Fixturen påstår sig spegla en form schemat inte tillåter. Testerna som läser den ' +
        'bevisar därmed ingenting om appen — den skulle ha förkastat svaret.',
    });
  }

  const fixturProfil = byggFormprofil(fixturLista);
  const skarpProfil = byggFormprofil(skarpLista);
  const schemanycklar = new Set(Object.keys(fall.schema.shape));

  const okandaStaging = [...skarpProfil.keys()].filter((n) => !schemanycklar.has(n)).sort();
  if (okandaStaging.length > 0) {
    avvikelser.push({
      klass: 'OKÄND-NYCKEL-STAGING',
      rubrik: `Staging levererar ${okandaStaging.length} nyckel/nycklar som ${fall.schemanamn} inte deklarerar`,
      detaljer: okandaStaging.map((n) => `${n}   skarp typ: ${typerText(skarpProfil.get(n))}`),
      foljd:
        'Detta är schemats egen drift, och den är per konstruktion TYST: zod släpper okända ' +
        'nycklar utan att klaga, så ingen parse fäller. Fältet finns i verkligheten men ' +
        'existerar inte för appen. Antingen ska schemat bära det, eller så ska funktionen ' +
        'sluta skicka det.',
    });
  }

  const okandaFixtur = [...fixturProfil.keys()].filter((n) => !schemanycklar.has(n)).sort();
  if (okandaFixtur.length > 0) {
    avvikelser.push({
      klass: 'OKÄND-NYCKEL-FIXTUR',
      rubrik: `Fixturen bär ${okandaFixtur.length} nyckel/nycklar som ${fall.schemanamn} inte deklarerar`,
      detaljer: okandaFixtur.map((n) => `${n}   fixtur-typ: ${typerText(fixturProfil.get(n))}`),
      foljd:
        'Fixturen har hittat på ett fält. Ingen parse fäller på det (zod släpper okända ' +
        'nycklar), men inget i appen läser det heller — fixturen ser rikare ut än den är.',
    });
  }

  const saknasIFixturen = [...skarpProfil.keys()].filter((n) => !fixturProfil.has(n)).sort();
  if (saknasIFixturen.length > 0) {
    avvikelser.push({
      klass: 'FIXTUREN-BAKOM',
      rubrik: `Staging levererar ${saknasIFixturen.length} nyckel/nycklar som fixturen saknar`,
      detaljer: saknasIFixturen.map(
        (n) =>
          `${n}   skarp typ: ${typerText(skarpProfil.get(n))}   (i ${skarpProfil.get(n)?.poster ?? 0}/${skarpLista.length} skarpa poster)`,
      ),
      foljd:
        'Fixturen speglar en äldre svarsform. Testerna prövar aldrig appen mot fälten, och ' +
        'skulle något av dem försvinna ur Edge Functionen märks det aldrig — fixturen ' +
        'saknade det redan.',
    });
  }

  const saknasIStaging = [...fixturProfil.keys()].filter((n) => !skarpProfil.has(n)).sort();
  if (saknasIStaging.length > 0) {
    avvikelser.push({
      klass: 'FIXTUREN-FÖRE',
      rubrik: `Fixturen bär ${saknasIStaging.length} nyckel/nycklar staging inte levererar`,
      detaljer: saknasIStaging.map(
        (n) =>
          `${n}   fixtur-typ: ${typerText(fixturProfil.get(n))}   (saknas i alla skarpa poster)`,
      ),
      foljd:
        'Fixturen matar appen med fält verkligheten inte har. Ett test som ser rätt ut kan ' +
        'därför vara grönt av fel skäl: i drift kommer fältet aldrig.',
    });
  }

  const typdivergens: string[] = [];
  for (const [nyckel, fixturNyckel] of fixturProfil) {
    const skarpNyckel = skarpProfil.get(nyckel);
    if (skarpNyckel === undefined) continue;
    const f = ickeNullTyper(fixturNyckel);
    const s = ickeNullTyper(skarpNyckel);
    // Tom mängd på någon sida = allt var null där. Det säger inget om typen,
    // bara att fältet var tomt — och schemat tillåter null, så vakten kan
    // strukturellt inte skilja "tomt" från "slutat fyllas". Se § VAD VAKTEN
    // INTE SER i larmet; att larma här hade gett brus varje natt.
    if (f.size === 0 || s.size === 0) continue;
    if (!likaMangder(f, s)) {
      typdivergens.push(
        `${nyckel}   fixtur: ${[...f].sort().join(' | ')}   staging: ${[...s].sort().join(' | ')}`,
      );
    }
  }
  if (typdivergens.length > 0) {
    avvikelser.push({
      klass: 'TYPDIVERGENS',
      rubrik: `${typdivergens.length} nyckel/nycklar har bytt typ mellan fixtur och staging`,
      detaljer: typdivergens.sort(),
      foljd:
        'Samma fältnamn, olika typ. Appen renderar mot fixturens typ i test och stagings i ' +
        'drift. `null` är bortsett i jämförelsen — den skillnaden är data, inte form.',
    });
  }

  return avvikelser;
}

function rotnycklar(kuvert: unknown): string[] {
  return arPost(kuvert) ? Object.keys(kuvert) : [];
}

const BREDD = 72;
const LINJE = '═'.repeat(BREDD);

/** `── RUBRIK ───…` ut till full bredd, så avsnitten linjerar. */
function avsnittsrad(rubrik: string): string {
  const inledning = `── ${rubrik} `;
  return inledning + '─'.repeat(Math.max(3, BREDD - inledning.length));
}

/**
 * Larmets text. Skriven för någon som väcks kl. 03 utan kontext: vad som
 * glidit, vad följden är, vad man gör nu, och var vaktens gräns går.
 */
export function byggLarm(
  fall: Kontraktsfall,
  skarpt: SkarptSvar,
  avvikelser: readonly Avvikelse[],
  nu: Date = new Date(),
): string {
  const skarpLista = listaAvPoster(skarpt.kropp, fall.kuvertnyckel);
  const fixturLista = listaAvPoster(fall.fixtur, fall.kuvertnyckel);

  const rader: string[] = [
    LINJE,
    `KONTRAKTSVAKTEN LARMAR — ${fall.endpoint}`,
    LINJE,
    '',
    'En fixtur i testernas fixturvärld speglar inte längre vad den skarpa Edge',
    'Functionen svarar. LARMET BLOCKERAR INGEN PR. Det säger att ett test som',
    'läser fixturen kan vara grönt av fel skäl.',
    '',
    `  Skarpt anrop   GET ${fall.sokvag}`,
    `                 staging · HTTP ${skarpt.status} · ${skarpLista?.length ?? 0} poster`,
    `  Fixtur         ${fall.fixturkalla}`,
    `                 ${fixturLista?.length ?? 0} poster`,
    `  Delat schema   ${fall.schemanamn} — ${fall.schemakalla}`,
    `  Kört           ${nu.toISOString()}`,
    '',
    avsnittsrad(`VAD SOM GLIDIT (${avvikelser.length})`),
    '',
  ];

  avvikelser.forEach((avvikelse, index) => {
    rader.push(`${index + 1}. [${avvikelse.klass}] ${avvikelse.rubrik}`);
    rader.push(...avvikelse.detaljer.map((d) => `     · ${d}`));
    rader.push('');
    rader.push(...brytRad(`Följd: ${avvikelse.foljd}`, 70).map((r) => `   ${r}`));
    rader.push('');
  });

  rader.push(
    avsnittsrad('VAD DU GÖR NU'),
    '',
    '1. Avgör vilken sida som har rätt. Staging är facit om Edge Functionen',
    '   ändrats med avsikt; fixturen är facit om staging-basen gått sönder.',
    '2. Ändrad med avsikt ⇒ uppdatera fixturen, och schemat i',
    '   src/domain/schemas/ om nyckeln är ny för oss.',
    '3. Staging trasig ⇒ laga basen. Lappa ALDRIG fixturen bara för att larmet',
    '   ska tystna — då byter du en synlig avvikelse mot en tyst.',
    '4. Kör om lokalt när du tror det är löst:  npm run vakt:kontrakt',
    '5. Stäng nattärendet med åtgärd eller öppen motivering — aldrig tyst',
    '   (CONTRIBUTING § Nattnätet).',
    '',
    avsnittsrad('VAD VAKTEN INTE SER'),
    '',
    'Den jämför FORM, inte värden: att ett tal byter betydelse (andel → procent)',
    'syns inte här. Den kan inte skilja "fältet är tomt i staging" från "fältet',
    'har slutat fyllas", eftersom schemat tillåter null — därför är null bortsett',
    'i typjämförelsen. Nästlade objekt prövas bara av schemat. Och urvalet är',
    'tre endpoints, inte alla:',
    ...brytRad(fall.urval, 68).map((r) => `  ${r}`),
    '',
    LINJE,
  );

  return rader.join('\n');
}

/** Ordbryter en löptext så larmet håller sig inom terminalbredd. */
function brytRad(text: string, bredd: number): string[] {
  const ord = text.split(' ');
  const rader: string[] = [];
  let aktuell = '';
  for (const o of ord) {
    if (aktuell.length === 0) {
      aktuell = o;
    } else if (aktuell.length + 1 + o.length <= bredd) {
      aktuell = `${aktuell} ${o}`;
    } else {
      rader.push(aktuell);
      aktuell = o;
    }
  }
  if (aktuell.length > 0) rader.push(aktuell);
  return rader;
}
