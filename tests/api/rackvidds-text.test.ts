// Enhetstester för räckviddens TEXTER och läsvägens LEGACY-normalisering
// (TASK-338.3, ADR-125 § Beslut 1; kortets AC #2 och AC #4).
//
// api-pure (ren logik, ingen staging) → körs lokalt + i CI. Importerar
// produktionskoden direkt via relativ sökväg — samma "test importerar
// produktionskod direkt"-mönster som `activity-statement-schema.test.ts`
// (TASK-201.1) och `eventformat-etikett.test.ts` (task-19.3).
//
// ═══ VARFÖR EN REN FUNKTION OCH INTE EN RENDERAD KOMPONENT ═══
//
// AC #4 kräver "enhetstest per form". Repot har ingen React-komponentprovare:
// `tests/a11y/*.spec.ts` är Playwright-WEBBLÄSARtester och `tests/api/` kör i
// Node utan JSX-stöd. Texten bröts därför ut ur `RackviddBadge.tsx` till den
// React-fria `src/components/dokument/rackviddsText.ts` — samma strukturella
// flytt som `_shared/attachment-filename.ts` (TASK-309.22) och `nivaSprak.ts`.
// Att badgen FAKTISKT renderar strängen (och på rätt ytor) låses i
// `tests/acceptance/dokument-rackviddsval.acceptance.test.ts`; formerna själva
// låses här, en och en.
//
// ═══ "STEG", INTE "NIVÅ" — FÖRVÄNTNINGARNA NEDAN ÄR AVSIKTLIGA ═══
//
// PRD TASK-338 och kortets beskrivning skriver formerna som "RIM · Nivå 1",
// men säger i samma mening att steg-etiketten går *"via befintlig
// stegEtikett"* — och den funktionen översätter basvärdet 'Nivå 1' → 'Steg 1'
// sedan 2026-08-17. ORDLISTA.md § Steg är dessutom kategorisk: *"Ordet är
// Steg — aldrig 'Nivå' — överallt"*. Reglerna slår bokstaven; att asserta
// "Nivå 1" här hade låst fast en REGRESSION av ett landat Marcus-beslut.

import { expect, test } from '@playwright/test';
import {
  rackviddsBadgeText,
  rackviddsSammanfattning,
} from '../../src/components/dokument/rackviddsText';
import { normaliseraRaAttachment } from '../../src/domain/schemas/Attachment.schema';

const INGA_AXLAR = { kursfamilj: null, kursniva: null, platsNamn: null };

test.describe('rackviddsBadgeText — de fem formerna ur kortets AC #4', () => {
  test('inga axlar → "Alla event"', () => {
    expect(rackviddsBadgeText(INGA_AXLAR)).toBe('Alla event');
  });

  test('familj + steg → "RIM · Steg 1" (basvärdet Nivå 1 visas som Steg 1)', () => {
    expect(rackviddsBadgeText({ kursfamilj: 'RIM', kursniva: 'Nivå 1', platsNamn: null })).toBe(
      'RIM · Steg 1',
    );
  });

  test('bara plats → "Rönninge"', () => {
    expect(rackviddsBadgeText({ kursfamilj: null, kursniva: null, platsNamn: 'Rönninge' })).toBe(
      'Rönninge',
    );
  });

  test('familj + plats → "RIM · Rönninge" (ingen "Alla steg" emellan)', () => {
    expect(rackviddsBadgeText({ kursfamilj: 'RIM', kursniva: null, platsNamn: 'Rönninge' })).toBe(
      'RIM · Rönninge',
    );
  });

  test('alla tre axlarna → "RIM · Steg 1 · Rönninge"', () => {
    expect(
      rackviddsBadgeText({ kursfamilj: 'RIM', kursniva: 'Nivå 1', platsNamn: 'Rönninge' }),
    ).toBe('RIM · Steg 1 · Rönninge');
  });
});

test.describe('rackviddsBadgeText — formerna kortet inte räknar upp', () => {
  // Kortets lista är fem former; axelrymden är åtta (2³). Resten prövas här
  // så att ingen av dem tyst producerar något orimligt.
  test('bara familj → "RIM" — INTE "RIM · Alla steg"', () => {
    // Medvetet byte mot ADR-118-erans form. Kortets egen "RIM · Rönninge"
    // bevisar att tomma axlar inte längre skrivs ut; att göra undantag för
    // just steg-axeln hade gett "RIM · Alla steg · Rönninge" i tre-axel-
    // fallet, alltså en pill som mest består av det den INTE begränsar.
    expect(rackviddsBadgeText({ kursfamilj: 'RIM', kursniva: null, platsNamn: null })).toBe('RIM');
  });

  test('nivålös familj + plats bär ingen steg-del alls', () => {
    expect(
      rackviddsBadgeText({ kursfamilj: 'Fjärrskådning', kursniva: null, platsNamn: 'Gotland' }),
    ).toBe('Fjärrskådning · Gotland');
  });

  test('steg utan familj (historisk data) faller inte — steget visas ensamt', () => {
    // Skrivvägen kan inte producera detta (EF:ens AttachmentScopeInputSchema
    // avvisar en nivå utan familj) och dialogen inte heller (Steg-selecten är
    // `inert` tills en nivåbärande familj är vald). Läsvägen kan ändå möta
    // historisk data, och en ren funktion ska då ge ett ärligt svar.
    expect(rackviddsBadgeText({ kursfamilj: null, kursniva: 'Nivå 2', platsNamn: null })).toBe(
      'Steg 2',
    );
  });

  test('okänt nivåvärde returneras oförändrat (basen kan växa före kartan)', () => {
    expect(rackviddsBadgeText({ kursfamilj: 'RIM', kursniva: 'Nivå 9', platsNamn: null })).toBe(
      'RIM · Nivå 9',
    );
  });

  test('"Intro" är sitt eget ord i BÅDA språken och byter alltså inte', () => {
    expect(rackviddsBadgeText({ kursfamilj: 'RIM', kursniva: 'Intro', platsNamn: null })).toBe(
      'RIM · Intro',
    );
  });

  test('tomt platsnamn räknas som OSATT axel — aldrig som ett tomt led', () => {
    // `Platsnamn`-lookupen kan halka efter en nyss skapad länk
    // (`Attachment.plats`s docblock). Badgen ska då visa övriga axlar, inte
    // en pill med ett hål i ("RIM · ").
    expect(rackviddsBadgeText({ kursfamilj: 'RIM', kursniva: null, platsNamn: '' })).toBe('RIM');
    expect(rackviddsBadgeText({ kursfamilj: null, kursniva: null, platsNamn: '   ' })).toBe(
      'Alla event',
    );
  });
});

test.describe('rackviddsSammanfattning — de fyra formerna ur kortets AC #1', () => {
  test('inga axlar → "Gäller: alla event"', () => {
    expect(rackviddsSammanfattning(INGA_AXLAR)).toBe('Gäller: alla event');
  });

  test('bara plats → "Gäller: alla event i Rönninge"', () => {
    expect(
      rackviddsSammanfattning({ kursfamilj: null, kursniva: null, platsNamn: 'Rönninge' }),
    ).toBe('Gäller: alla event i Rönninge');
  });

  test('familj + plats → "Gäller: RIM-event i Rönninge"', () => {
    expect(
      rackviddsSammanfattning({ kursfamilj: 'RIM', kursniva: null, platsNamn: 'Rönninge' }),
    ).toBe('Gäller: RIM-event i Rönninge');
  });

  test('alla tre → "Gäller: RIM-event, Steg 1, i Rönninge"', () => {
    expect(
      rackviddsSammanfattning({ kursfamilj: 'RIM', kursniva: 'Nivå 1', platsNamn: 'Rönninge' }),
    ).toBe('Gäller: RIM-event, Steg 1, i Rönninge');
  });
});

test.describe('rackviddsSammanfattning — övriga axelkombinationer', () => {
  test('bara familj → "Gäller: RIM-event"', () => {
    expect(rackviddsSammanfattning({ kursfamilj: 'RIM', kursniva: null, platsNamn: null })).toBe(
      'Gäller: RIM-event',
    );
  });

  test('familj + steg utan plats → inskottet stängs av meningen, inte av ett komma', () => {
    expect(
      rackviddsSammanfattning({ kursfamilj: 'RIM', kursniva: 'Nivå 3', platsNamn: null }),
    ).toBe('Gäller: RIM-event, Steg 3');
  });

  test('steg utan familj → subjektet förblir "alla event" (total funktion)', () => {
    expect(rackviddsSammanfattning({ kursfamilj: null, kursniva: 'Nivå 1', platsNamn: null })).toBe(
      'Gäller: alla event, Steg 1',
    );
  });

  test('ordet "Nivå" förekommer ALDRIG i en sammanfattning av ett känt steg', () => {
    // ORDLISTA.md § Steg, mekaniskt prövad över hela den kända nivådomänen.
    for (const niva of ['Nivå 1', 'Nivå 2', 'Nivå 3']) {
      const text = rackviddsSammanfattning({ kursfamilj: 'RIM', kursniva: niva, platsNamn: null });
      expect(text).not.toContain('Nivå');
      expect(text).toContain('Steg');
    }
  });
});

test.describe('normaliseraRaAttachment — läsvägens legacy-tolerans (AC #2)', () => {
  // Grenarna speglar EF:ens `normaliseraRackvidd`
  // (`supabase/functions/_shared/rackvidd-matchning.ts`) byte för byte.
  // Driver de isär visar badgen något annat än vad servern matchar på.
  const bas = {
    id: 'recX',
    namn: 'Fil.pdf',
    storlekBytes: 1,
    skapad: '2026-08-29T00:00:00.000Z',
    eventId: null,
    dokumentklass: 'Uppladdad',
    kursfamilj: null,
    kursniva: null,
    plats: null,
  };

  test('"Kurstyp" → "Gemensam" med axlarna BEVARADE', () => {
    const ut = normaliseraRaAttachment({
      ...bas,
      rackvidd: 'Kurstyp',
      kursfamilj: 'RIM',
      kursniva: 'Nivå 1',
    }) as Record<string, unknown>;
    expect(ut.rackvidd).toBe('Gemensam');
    expect(ut.kursfamilj).toBe('RIM');
    expect(ut.kursniva).toBe('Nivå 1');
  });

  test('"Alla event" → "Gemensam" med axlarna TÖMDA', () => {
    // En rad som mot alla odds bär en axel skulle annars tyst SMALNA till
    // färre event än värdet lovar — Lotta hade sett badgen "RIM" på ett
    // dokument hon själv märkt "alla event".
    const ut = normaliseraRaAttachment({
      ...bas,
      rackvidd: 'Alla event',
      kursfamilj: 'RIM',
      kursniva: 'Nivå 1',
      plats: { id: 'recP', namn: 'Rönninge' },
    }) as Record<string, unknown>;
    expect(ut.rackvidd).toBe('Gemensam');
    expect(ut.kursfamilj).toBeNull();
    expect(ut.kursniva).toBeNull();
    expect(ut.plats).toBeNull();
  });

  test('levande värden passerar ORÖRDA (Event och Gemensam)', () => {
    for (const varde of ['Event', 'Gemensam']) {
      const post = { ...bas, rackvidd: varde, kursfamilj: 'RIM' };
      const ut = normaliseraRaAttachment(post) as Record<string, unknown>;
      expect(ut.rackvidd).toBe(varde);
      expect(ut.kursfamilj).toBe('RIM');
    }
  });

  test('okänt räckviddsvärde blir null — aldrig ett kast, aldrig en gissning', () => {
    const ut = normaliseraRaAttachment({ ...bas, rackvidd: 'Nånting nytt' }) as Record<
      string,
      unknown
    >;
    expect(ut.rackvidd).toBeNull();
  });

  test('null/saknat räckviddsfält lämnas som det är', () => {
    expect(
      (normaliseraRaAttachment({ ...bas, rackvidd: null }) as Record<string, unknown>).rackvidd,
    ).toBeNull();
    expect(normaliseraRaAttachment({ ...bas })).toEqual(bas);
  });

  test('icke-objekt passerar orört (schemat får fälla, inte normaliseringen)', () => {
    expect(normaliseraRaAttachment(null)).toBeNull();
    expect(normaliseraRaAttachment('inte en post')).toBe('inte en post');
  });
});
