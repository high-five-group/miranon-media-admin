// Räckviddsmatchningens BESLUTSLOGIK (TASK-338.2 AC #1, ADR-125 § Beslut 1)
// — regressionstest mot `_shared/rackvidd-matchning.ts`. api-pure (ren
// logik, ingen staging, inga creds) → körs lokalt OCH i CI, till skillnad
// från `get-event-attachments.staging.test.ts` som skip:as utan creds.
// Samma tvånivå-uppdelning `plats-uppslag.test.ts` redan etablerar för
// Ort-till-Plats-härledningen; se den filens huvud för resonemanget.
//
// VARFÖR BÅDA NIVÅERNA FINNS: staging-testet bevisar att den DEPLOYADE
// EF:en beter sig rätt mot skarp data (verkliga länkfält, verklig
// Airtable-lookup). Detta test bevisar att SJÄLVA REGELN diskriminerar
// rätt, utan att förutsätta ett bas-tillstånd — och det är den enda nivån
// som kan pröva de kombinationer basen inte innehåller (en bilaga med två
// platser, en nivå utan familj, ett okänt räckviddsvärde). En regression i
// regeln fälls här på millisekunder i stället för i ett creddat CI-jobb.
//
// TVÅ RIKTNINGAR PER AXEL, genomgående: varje axel prövas både i sitt
// träffande fall OCH mot ett grannfall som INTE får matcha. En matchare som
// alltid svarar `true` (eller alltid `false`) hade annars passerat halva
// sviten — och `true` är den farliga riktningen här: den läcker ett
// dokument till event det inte gäller (PRD TASK-338, berättelse 3).
//
// RECORD-ID:N ÄR VERKLIGA staging-rader (`Platser`, live-lästa 2026-08-29):
// Rönninge `rec17l2c64foUy6WU`, ZZ-plats-unik-fixtur `recVWAYh1cbVQKxi7`.
// De läses aldrig här — de gör bara fallen läsbara mot den bas ett
// felsökande öga kommer att öppna.

import { expect, test } from '@playwright/test';
import {
  ATTACHMENT_SCOPE_ALLA_EVENT,
  ATTACHMENT_SCOPE_EVENT,
  ATTACHMENT_SCOPE_GEMENSAM,
  ATTACHMENT_SCOPE_KURSTYP,
  arGemensam,
  type BilagansRackvidd,
  type EventetsAxlar,
  lasPlatsIds,
  matcharEvent,
  normaliseraRackvidd,
  VALID_ATTACHMENT_SCOPES,
} from '../../supabase/functions/_shared/rackvidd-matchning';

const RONNINGE = 'rec17l2c64foUy6WU';
const ANNAN_PLATS = 'recVWAYh1cbVQKxi7';

/** Gemensam bilaga med bara de axlar testet bryr sig om satta. */
function bilaga(overrides: Partial<BilagansRackvidd> = {}): BilagansRackvidd {
  return {
    rackvidd: ATTACHMENT_SCOPE_GEMENSAM,
    kursfamilj: null,
    kursniva: null,
    platsIds: [],
    ...overrides,
  };
}

/** Event med bara de axlar testet bryr sig om satta. */
function event(overrides: Partial<EventetsAxlar> = {}): EventetsAxlar {
  return { kursfamilj: null, kursniva: null, platsIds: [], ...overrides };
}

const RONNINGE_EVENT = event({ platsIds: [RONNINGE] });
const RIM_NIVA2_RONNINGE = event({
  kursfamilj: 'RIM',
  kursniva: 'Nivå 2',
  platsIds: [RONNINGE],
});

test.describe('tom axel begränsar inte', () => {
  test('NOLL axlar → matchar ett event utan några axlar alls', () => {
    expect(matcharEvent(bilaga(), event())).toBe(true);
  });

  test('NOLL axlar → matchar även ett event MED alla axlar satta', () => {
    expect(matcharEvent(bilaga(), RIM_NIVA2_RONNINGE)).toBe(true);
  });

  test('bara familj satt → platsen begränsar inte (matchar oavsett eventets plats)', () => {
    const b = bilaga({ kursfamilj: 'RIM' });
    expect(matcharEvent(b, event({ kursfamilj: 'RIM', platsIds: [RONNINGE] }))).toBe(true);
    expect(matcharEvent(b, event({ kursfamilj: 'RIM', platsIds: [ANNAN_PLATS] }))).toBe(true);
    expect(matcharEvent(b, event({ kursfamilj: 'RIM', platsIds: [] }))).toBe(true);
  });

  test('bara plats satt → familjen begränsar inte (matchar oavsett eventets familj)', () => {
    const b = bilaga({ platsIds: [RONNINGE] });
    expect(matcharEvent(b, event({ kursfamilj: 'RIM', platsIds: [RONNINGE] }))).toBe(true);
    expect(matcharEvent(b, event({ kursfamilj: 'Psionautics', platsIds: [RONNINGE] }))).toBe(true);
    expect(matcharEvent(b, event({ kursfamilj: null, platsIds: [RONNINGE] }))).toBe(true);
  });

  test('TOM STRÄNG behandlas som osatt, inte som ett värde att matcha', () => {
    // Airtable kan lämna ett rensat singleSelect som tomsträng i stället för
    // att utelämna det. En tomsträng-jämförelse mot ett event utan familj
    // hade annars falsk-matchat (ADR-118 § Konsekvenser).
    expect(matcharEvent(bilaga({ kursfamilj: '' }), RIM_NIVA2_RONNINGE)).toBe(true);
    expect(matcharEvent(bilaga({ kursfamilj: '' }), event())).toBe(true);
  });
});

test.describe('kursfamilj-axeln', () => {
  test('exakt familjmatch → true', () => {
    expect(matcharEvent(bilaga({ kursfamilj: 'RIM' }), event({ kursfamilj: 'RIM' }))).toBe(true);
  });

  test('familj-MISMATCH → false (Psionautics-bilaga på RIM-event)', () => {
    expect(matcharEvent(bilaga({ kursfamilj: 'Psionautics' }), RIM_NIVA2_RONNINGE)).toBe(false);
  });

  test('familjebunden bilaga på ett event UTAN känd familj → false', () => {
    // Aldrig "tom matchar tom": en bilaga för RIM ska inte dyka upp på ett
    // event vars familj är okänd bara för att båda saknar värde någonstans.
    expect(matcharEvent(bilaga({ kursfamilj: 'RIM' }), event({ kursfamilj: null }))).toBe(false);
    expect(matcharEvent(bilaga({ kursfamilj: 'RIM' }), event({ kursfamilj: '' }))).toBe(false);
  });
});

test.describe('kursnivå-axeln — tom-nivå-regeln', () => {
  test('TOM nivå på bilagan = hela familjen (matchar varje nivå i familjen)', () => {
    const b = bilaga({ kursfamilj: 'RIM' });
    expect(matcharEvent(b, event({ kursfamilj: 'RIM', kursniva: 'Nivå 1' }))).toBe(true);
    expect(matcharEvent(b, event({ kursfamilj: 'RIM', kursniva: 'Nivå 2' }))).toBe(true);
    expect(matcharEvent(b, event({ kursfamilj: 'RIM', kursniva: null }))).toBe(true);
  });

  test('SATT nivå kräver exakt match → rätt nivå true, annan nivå false', () => {
    const b = bilaga({ kursfamilj: 'RIM', kursniva: 'Nivå 2' });
    expect(matcharEvent(b, event({ kursfamilj: 'RIM', kursniva: 'Nivå 2' }))).toBe(true);
    expect(matcharEvent(b, event({ kursfamilj: 'RIM', kursniva: 'Nivå 1' }))).toBe(false);
    expect(matcharEvent(b, event({ kursfamilj: 'RIM', kursniva: null }))).toBe(false);
  });

  test('nivå UTAN familj är fail-CLOSED, inte ignorerad', () => {
    // Skrivvägen kan inte producera detta (AttachmentScopeInputSchema
    // avvisar det), men läsvägen möter historisk data. Att IGNORERA nivån
    // hade spritt dokumentet till FLER event; att tillämpa den håller det på
    // färre. Se matcharens docblock för varför asymmetrin avgör.
    const b = bilaga({ kursniva: 'Nivå 2' });
    expect(matcharEvent(b, event({ kursniva: 'Nivå 2' }))).toBe(true);
    expect(matcharEvent(b, event({ kursniva: 'Nivå 1' }))).toBe(false);
    expect(matcharEvent(b, event({ kursniva: null }))).toBe(false);
  });
});

test.describe('plats-axeln — matchar på RECORD-ID, aldrig på namn', () => {
  test('samma plats-ID → true', () => {
    expect(matcharEvent(bilaga({ platsIds: [RONNINGE] }), RONNINGE_EVENT)).toBe(true);
  });

  test('plats-MISMATCH → false (Rönninge-bilaga på ett event på annan plats)', () => {
    expect(matcharEvent(bilaga({ platsIds: [RONNINGE] }), event({ platsIds: [ANNAN_PLATS] }))).toBe(
      false,
    );
  });

  test('platsbunden bilaga på ett event UTAN plats-länk → false', () => {
    expect(matcharEvent(bilaga({ platsIds: [RONNINGE] }), event({ platsIds: [] }))).toBe(false);
  });

  test('bilaga med TVÅ platser matchar båda ("minst en", inte "exakt en")', () => {
    // Airtable kan strukturellt inte tvinga max en länk (airtable-
    // constraints.md), och basen är en yta Lotta och Marcus arbetar direkt
    // i (ADR-063). En handredigerad tvåplats-rad ska bete sig som "gäller
    // båda", aldrig som "matchar ingenting".
    const b = bilaga({ platsIds: [RONNINGE, ANNAN_PLATS] });
    expect(matcharEvent(b, event({ platsIds: [RONNINGE] }))).toBe(true);
    expect(matcharEvent(b, event({ platsIds: [ANNAN_PLATS] }))).toBe(true);
    expect(matcharEvent(b, event({ platsIds: ['recNagotHeltAnnat'] }))).toBe(false);
  });

  test('ID-jämförelsen är exakt — ett prefix eller en delsträng matchar inte', () => {
    expect(
      matcharEvent(bilaga({ platsIds: [RONNINGE] }), event({ platsIds: [RONNINGE.slice(0, -1)] })),
    ).toBe(false);
  });
});

test.describe('kombination — axlarna kombineras med OCH, aldrig ELLER', () => {
  test('RIM + Rönninge matchar ett RIM-event i Rönninge', () => {
    expect(
      matcharEvent(bilaga({ kursfamilj: 'RIM', platsIds: [RONNINGE] }), RIM_NIVA2_RONNINGE),
    ).toBe(true);
  });

  test('RIM + Rönninge matchar INTE ett RIM-event på annan plats', () => {
    expect(
      matcharEvent(
        bilaga({ kursfamilj: 'RIM', platsIds: [RONNINGE] }),
        event({ kursfamilj: 'RIM', platsIds: [ANNAN_PLATS] }),
      ),
    ).toBe(false);
  });

  test('RIM + Rönninge matchar INTE ett Psionautics-event i Rönninge', () => {
    // Detta är OCH-beviset: ett ELLER hade svarat true här, eftersom
    // platsen stämmer.
    expect(
      matcharEvent(
        bilaga({ kursfamilj: 'RIM', platsIds: [RONNINGE] }),
        event({ kursfamilj: 'Psionautics', platsIds: [RONNINGE] }),
      ),
    ).toBe(false);
  });

  test('alla TRE axlar satta — exakt träff true, en avvikande axel false', () => {
    const b = bilaga({ kursfamilj: 'RIM', kursniva: 'Nivå 2', platsIds: [RONNINGE] });
    expect(matcharEvent(b, RIM_NIVA2_RONNINGE)).toBe(true);
    expect(
      matcharEvent(b, event({ kursfamilj: 'RIM', kursniva: 'Nivå 1', platsIds: [RONNINGE] })),
    ).toBe(false);
    expect(
      matcharEvent(b, event({ kursfamilj: 'RIM', kursniva: 'Nivå 2', platsIds: [ANNAN_PLATS] })),
    ).toBe(false);
  });
});

test.describe('räckvidden själv — bara Gemensam matchar via filtret', () => {
  test('Event-räckvidd matchar ALDRIG, ens med identiska axlar', () => {
    // En event-bilaga når sitt event via Event-LÄNKEN (mängd (a)). Matchade
    // den även här hade varje event-bilaga läckt till varje event som delar
    // familj eller plats.
    expect(
      matcharEvent(
        bilaga({ rackvidd: ATTACHMENT_SCOPE_EVENT, kursfamilj: 'RIM', platsIds: [RONNINGE] }),
        RIM_NIVA2_RONNINGE,
      ),
    ).toBe(false);
  });

  test('TOMT Räckvidd matchar ALDRIG (historisk default = Event)', () => {
    // De 34 mall-genererade, event-bundna staging-raderna med tomt Räckvidd
    // (mätt 2026-08-29) fastnar här, inte i formeln.
    expect(matcharEvent(bilaga({ rackvidd: null }), event())).toBe(false);
    expect(matcharEvent(bilaga({ rackvidd: '' }), event())).toBe(false);
  });

  test('OKÄNT räckviddsvärde matchar ALDRIG', () => {
    expect(matcharEvent(bilaga({ rackvidd: 'Något framtida' }), event())).toBe(false);
  });

  test('arGemensam säger ja BARA till Gemensam (efter normalisering)', () => {
    expect(arGemensam(ATTACHMENT_SCOPE_GEMENSAM)).toBe(true);
    expect(arGemensam(ATTACHMENT_SCOPE_EVENT)).toBe(false);
    expect(arGemensam(null)).toBe(false);
    // Legacy-värdena är INTE gemensamma FÖRE normalisering — predikatet
    // prövar det normaliserade värdet, aldrig det råa.
    expect(arGemensam(ATTACHMENT_SCOPE_KURSTYP)).toBe(false);
    expect(arGemensam(ATTACHMENT_SCOPE_ALLA_EVENT)).toBe(false);
  });
});

test.describe('legacy-normaliseringen (Kurstyp / Alla event → Gemensam)', () => {
  test('Kurstyp → Gemensam med axlarna BEVARADE', () => {
    const norm = normaliseraRackvidd(
      bilaga({ rackvidd: ATTACHMENT_SCOPE_KURSTYP, kursfamilj: 'RIM', kursniva: 'Nivå 2' }),
    );
    expect(norm.rackvidd).toBe(ATTACHMENT_SCOPE_GEMENSAM);
    expect(norm.kursfamilj).toBe('RIM');
    expect(norm.kursniva).toBe('Nivå 2');
  });

  test('Kurstyp matchar som en Gemensam med samma axlar (båda riktningar)', () => {
    const legacy = bilaga({ rackvidd: ATTACHMENT_SCOPE_KURSTYP, kursfamilj: 'RIM' });
    expect(matcharEvent(legacy, event({ kursfamilj: 'RIM' }))).toBe(true);
    expect(matcharEvent(legacy, event({ kursfamilj: 'Psionautics' }))).toBe(false);
  });

  test('Alla event → Gemensam med axlarna TÖMDA', () => {
    // "Alla event" betyder per definition inga begränsningar. En rad som mot
    // alla odds bär en axel får inte tyst SMALNA till färre event än värdet
    // lovar — vår skrivväg har aldrig skrivit en sådan, men basen är
    // handredigerbar (ADR-063).
    const norm = normaliseraRackvidd(
      bilaga({
        rackvidd: ATTACHMENT_SCOPE_ALLA_EVENT,
        kursfamilj: 'RIM',
        kursniva: 'Nivå 2',
        platsIds: [RONNINGE],
      }),
    );
    expect(norm.rackvidd).toBe(ATTACHMENT_SCOPE_GEMENSAM);
    expect(norm.kursfamilj).toBeNull();
    expect(norm.kursniva).toBeNull();
    expect(norm.platsIds).toEqual([]);
  });

  test('Alla event matchar VARJE event, även med en kvarglömd axel', () => {
    const legacy = bilaga({ rackvidd: ATTACHMENT_SCOPE_ALLA_EVENT, kursfamilj: 'Psionautics' });
    expect(matcharEvent(legacy, RIM_NIVA2_RONNINGE)).toBe(true);
    expect(matcharEvent(legacy, event())).toBe(true);
  });

  test('normaliseringen rör INTE Event, Gemensam eller ett okänt värde', () => {
    for (const varde of [ATTACHMENT_SCOPE_EVENT, ATTACHMENT_SCOPE_GEMENSAM, 'Framtida', null]) {
      const indata = bilaga({ rackvidd: varde, kursfamilj: 'RIM', platsIds: [RONNINGE] });
      const norm = normaliseraRackvidd(indata);
      expect(norm.rackvidd).toBe(varde);
      expect(norm.kursfamilj).toBe('RIM');
      expect(norm.platsIds).toEqual([RONNINGE]);
    }
  });

  test('VALID_ATTACHMENT_SCOPES bär alla fyra värden läsvägen känner igen', () => {
    expect([...VALID_ATTACHMENT_SCOPES].sort()).toEqual(
      [
        ATTACHMENT_SCOPE_EVENT,
        ATTACHMENT_SCOPE_GEMENSAM,
        ATTACHMENT_SCOPE_KURSTYP,
        ATTACHMENT_SCOPE_ALLA_EVENT,
      ].sort(),
    );
  });
});

test.describe('lasPlatsIds — Airtables länkfältsformer', () => {
  test('en icke-tom array av ID:n läses rakt av', () => {
    expect(lasPlatsIds([RONNINGE, ANNAN_PLATS])).toEqual([RONNINGE, ANNAN_PLATS]);
  });

  test('undefined (Airtable UTELÄMNAR ett tomt länkfält) → tom lista', () => {
    // Fältet är inte `[]`, det FINNS inte — samma observation som
    // plats-uppslag.ts § harRedanPlats bokför.
    expect(lasPlatsIds(undefined)).toEqual([]);
    expect(lasPlatsIds(null)).toEqual([]);
    expect(lasPlatsIds([])).toEqual([]);
  });

  test('skräp i arrayen filtreras bort i stället för att bli falska ID:n', () => {
    expect(lasPlatsIds([RONNINGE, '', 42, null, { id: 'x' }])).toEqual([RONNINGE]);
  });

  test('en skalär (fel fälttyp) → tom lista, aldrig en krasch', () => {
    expect(lasPlatsIds(RONNINGE)).toEqual([]);
    expect(lasPlatsIds(7)).toEqual([]);
  });
});
