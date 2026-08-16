import type {
  FallenMottagare,
  GruppUtfall,
  Scenario,
  SimEventGrupp,
  SimMottagare,
  SvepTyp,
} from './types';

/**
 * [PROTOTYPE-DATA, TASK-241.1] Svep-prototypens simulerade universum —
 * konvergensvarv 1. Två svep-instanser (ADR-114 beslut 4) × tre datalägen
 * (kortets AC #1) ur EN härledningsfunktion, samma disciplin som
 * `hem-prototyp/data.ts`: EN källa garanterar att triadens tre delar
 * (adresslista · förhandsvisning · testmail) alltid visar SAMMA tal.
 *
 * EN-PÅMINNELSE-MODELLENS INVARIANT (S102 Del 10 beslut 7, ADR-114 beslut 4):
 * påminnelsesvepets mottagare bär ALDRIG ett tidigare `paminnelseSkickadIso`
 * — de är, per definition, läge 1 "Att påminna". Skulle en framtida ändring
 * av `PAMINNELSE_GRUPPER` råka lägga till ett sådant fält vore det en
 * modellbrist: urvalet skulle inte längre vara mekaniskt spamsäkert. Ingen
 * körtidskontroll behövs i en simulerad fixtur, men invarianten är
 * dokumenterad HÄR, vid källan.
 */

function mottagare(
  id: string,
  namn: string,
  fornamn: string,
  epost: string,
  extra?: Partial<SimMottagare>,
): SimMottagare {
  return { id, namn, fornamn, epost, ...extra };
}

const BEKRAFTELSE_GRUPPER: SimEventGrupp[] = [
  {
    eventId: 'svep-ev-1',
    eventNamn: 'Sommarkurs i akvarell',
    ort: 'Uppsala',
    startdatum: '2026-09-12',
    mottagare: [
      mottagare('svep-m-1', 'Anna Lindqvist', 'Anna', 'anna.lindqvist@example.se'),
      mottagare('svep-m-2', 'Erik Sandberg', 'Erik', 'erik.sandberg@example.se'),
      mottagare('svep-m-3', 'Karin Holm', 'Karin', 'karin.holm@example.se'),
    ],
  },
  {
    eventId: 'svep-ev-2',
    eventNamn: 'Hantverkshelg',
    ort: 'Falun',
    startdatum: '2026-09-19',
    mottagare: [
      mottagare('svep-m-4', 'Björn Ahlgren', 'Björn', 'bjorn.ahlgren@example.se'),
      mottagare('svep-m-5', 'Maria Ek', 'Maria', 'maria.ek@example.se'),
    ],
  },
  {
    eventId: 'svep-ev-3',
    eventNamn: 'Novemberretreat',
    ort: 'Åre',
    startdatum: '2026-11-06',
    mottagare: [
      mottagare('svep-m-6', 'Johanna Berg', 'Johanna', 'johanna.berg@example.se'),
      mottagare('svep-m-7', 'Peter Nyström', 'Peter', 'peter.nystrom@example.se'),
      mottagare('svep-m-8', 'Sara Dahl', 'Sara', 'sara.dahl@example.se'),
      mottagare('svep-m-9', 'Oskar Lund', 'Oskar', 'oskar.lund@example.se'),
    ],
  },
];

/** Påminnelsesvepets grupper — samtliga mottagare är läge 1 "Att påminna"
    (se dokblockets invariant ovan). `avgiftstyp` speglar hemmets egen
    förfallna-rad (S102 Del 10). */
const PAMINNELSE_GRUPPER: SimEventGrupp[] = [
  {
    eventId: 'svep-ev-1',
    eventNamn: 'Sommarkurs i akvarell',
    ort: 'Uppsala',
    startdatum: '2026-09-12',
    mottagare: [
      mottagare('svep-p-1', 'Camilla Öst', 'Camilla', 'camilla.ost@example.se', {
        telefon: '070-123 45 67',
        avgiftstyp: 'Anmälningsavgift',
      }),
      mottagare('svep-p-2', 'David Frank', 'David', 'david.frank@example.se', {
        telefon: '073-234 56 78',
        avgiftstyp: 'Slutbetalning',
      }),
    ],
  },
  {
    eventId: 'svep-ev-3',
    eventNamn: 'Novemberretreat',
    ort: 'Åre',
    startdatum: '2026-11-06',
    mottagare: [
      mottagare('svep-p-3', 'Elin Vik', 'Elin', 'elin.vik@example.se', {
        telefon: '076-345 67 89',
        avgiftstyp: 'Anmälningsavgift',
      }),
    ],
  },
];

/** Sändytans rubrik per svep-typ — EN källa, delad mellan `Dialog`s `title`-
    prop (routen, aria-labelledby-källan) och prototypens rail-etiketter, så
    ingen kopierings-drift (rubriken definieras aldrig på två ställen). */
export const SVEP_RUBRIK: Record<SvepTyp, string> = {
  bekraftelse: 'Bekräfta alla',
  paminnelse: 'Skicka påminnelse till alla',
};

const AMNE: Record<SvepTyp, string> = {
  bekraftelse: 'Bekräftelse: din anmälan till {{eventnamn}}',
  paminnelse: 'Påminnelse: din betalning för {{eventnamn}}',
};

const MAILTEXT: Record<SvepTyp, string> = {
  bekraftelse:
    'Hej {{fornamn}},\n\n' +
    'Vi bekräftar din anmälan till {{eventnamn}} i {{ort}} den {{datum}}.\n\n' +
    'Varmt välkommen!\nLotta',
  paminnelse:
    'Hej {{fornamn}},\n\n' +
    'Det här är en påminnelse om att din {{avgiftstyp}} för {{eventnamn}} i {{ort}} den {{datum}} ' +
    'ännu inte har kommit in. Hör gärna av dig om något är oklart.\n\n' +
    'Vänliga hälsningar,\nLotta',
};

/** Platshållare fyllda ur den FÖRSTA mottagaren i en grupp — samma ärlighets-
    princip som `AtgardsSida.tsx`s `fyllPlatshallare` ("Förhandsvisningsexempel"
    är ett VERKLIGT utfall, inte en påhittad Anna Andersson). Egen, mindre
    implementation här — sändytans mall-vokabulär (fornamn/eventnamn/ort/datum/
    avgiftstyp) är en delmängd av den skarpa sidans, och prototypens mallar är
    egna simulerade strängar, inte de riktiga `Granskning`-objekten. */
function fyllPlatshallare(mall: string, event: SimEventGrupp, forsta: SimMottagare): string {
  const datum = new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(event.startdatum));
  return mall
    .replaceAll('{{fornamn}}', forsta.fornamn)
    .replaceAll('{{eventnamn}}', event.eventNamn)
    .replaceAll('{{ort}}', event.ort)
    .replaceAll('{{datum}}', datum)
    .replaceAll('{{avgiftstyp}}', forsta.avgiftstyp ?? 'avgift');
}

export interface SvepInnehall {
  eventGrupper: SimEventGrupp[];
  amne: (grupp: SimEventGrupp) => string;
  mailtext: (grupp: SimEventGrupp) => string;
}

/** Kortets AC #1 "alla tillstånd är dömbara": `tomt` nollställer urvalet helt
    (hemmets pekning gav noll träffar), `fel`/`normal` delar samma grupper —
    skillnaden avgörs av `simuleraSand` nedan, inte av urvalet i sig. */
export function svepInnehall(svepTyp: SvepTyp, scenario: Scenario): SvepInnehall {
  const bas = svepTyp === 'bekraftelse' ? BEKRAFTELSE_GRUPPER : PAMINNELSE_GRUPPER;
  const eventGrupper = scenario === 'tomt' ? [] : bas;
  return {
    eventGrupper,
    amne: (grupp) => fyllPlatshallare(AMNE[svepTyp], grupp, grupp.mottagare[0]),
    mailtext: (grupp) => fyllPlatshallare(MAILTEXT[svepTyp], grupp, grupp.mottagare[0]),
  };
}

const SKAL_STUDSADE = 'E-postadressen studsade';
const SKAL_SERVERFEL = 'Serverfel, försök igen';

/**
 * Simulerat sändanrop, ETT PER EVENT-GRUPP (ADR-114 beslut 3 — "ett
 * sändanrop per event-grupp under huven", fel och delresultat rapporteras
 * per grupp). `fel`-scenariot lägger avsiktligt en PARTIAL-grupp (näst sista)
 * och en FAILED-grupp (sista) om de finns, så bägge delresultat-formerna är
 * dömbara i samma körning — `normal` ger alltid `sent` för alla grupper.
 */
export function simuleraSand(eventGrupper: SimEventGrupp[], scenario: Scenario): GruppUtfall[] {
  return eventGrupper.map((grupp, i): GruppUtfall => {
    const sistaIndex = eventGrupper.length - 1;
    if (scenario === 'fel' && i === sistaIndex && eventGrupper.length > 1) {
      // Sista gruppen: allt föll (t.ex. eventets e-postdomän nekade batchen).
      const fallna: FallenMottagare[] = grupp.mottagare.map((m) => ({
        mottagare: m,
        skal: SKAL_SERVERFEL,
      }));
      return { eventId: grupp.eventId, status: 'failed', lyckade: [], fallna };
    }
    if (scenario === 'fel' && i === sistaIndex - 1 && grupp.mottagare.length > 1) {
      // Näst sista gruppen: en mottagare studsar, resten går fram.
      const [forst, ...rest] = grupp.mottagare;
      return {
        eventId: grupp.eventId,
        status: 'partial',
        lyckade: rest,
        fallna: [{ mottagare: forst, skal: SKAL_STUDSADE }],
      };
    }
    return { eventId: grupp.eventId, status: 'sent', lyckade: grupp.mottagare, fallna: [] };
  });
}

/** Totalräkning över samtliga grupper — sändytans "till N personer i M
    event"-mening. */
export function totalMottagare(eventGrupper: SimEventGrupp[]): number {
  return eventGrupper.reduce((sum, g) => sum + g.mottagare.length, 0);
}
