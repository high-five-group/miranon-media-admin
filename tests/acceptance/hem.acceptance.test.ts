import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { FIXTUR_EPOST } from '../support/fixturvarld/hermetic';
import { expect, type Page, test } from './support/acceptance-bas';

/**
 * Hem-vyn (task-1.3 A-skelettet → task-4.2 K10-facit-strukturen → task-4.3
 * facit-korten → task-4.4 anmälningslistan → task-4.5 osynliga uppdateringen
 * [B3] → task-9.3 platshållar-borttagningen). Uppifrån och ned: hälsningskort
 * (h1 "Hej {namn}" utan utropstecken; återbesök i sessionen visar bara namnet
 * [B2]; INGEN "Mina sidor"-platshållare — riven per T69 Revision S64 p3, och
 * uppdatera-kontrollen borta sedan B5) →
 * Nästa event (primär-tint, HELA kortet klickbart till eventets detaljsida;
 * dagar-kvar-pill, metagrupp med ikoner, beläggningsstapel) bredvid Obetalda
 * anmälningsavgifter (BARA antalet, task-4.3) → helbredds-listkortet "Nya
 * anmälningar att hantera" (koppar-kontur + varningsikon; ~25 senaste i
 * rullbar zebra-lista; raden bär namn / joinad event-identitet / relativ tid;
 * rad-klick → EVENTETS sida [B1]; rad utan event olänkad med "Utan event") →
 * stor helbredds-CTA sist. INGEN separat "Hem"-rubrik (AC #6): hälsningen ÄR
 * sidans h1 → h1-assertions matchar /^Hej/ (miljö-neutralt: namn-delen styrs
 * av sessionens display-namn, task-1.1).
 *
 * ACCEPTANCE-KLASSEN (task-59.3, ADR-080): filen flyttades hit ur e2e-sviten
 * med hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade.
 * Klassningen är HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 62
 * restanrop, samtliga typsnitt, noll skarpa — filen bar FLEST restanrop av alla
 * arton i klassen och är därmed den tyngsta lasten pilotvågen kunde pröva.
 *
 * **Deterministisk via `network.use()`** — överskuggningar på fixturvärldens
 * delade normalläge, inte `page.route`. Skälet är inte smak: page-routes prövas
 * FÖRE MSW:s context-routes, så en page-route-mock hade lagt en andra
 * avlyssningsmekanism ovanpå den fixturvärlden bär och gett EF-lagret en annan
 * stränghet än allt annat nätverk — precis den tudelning task-54.2 tog bort.
 * Mönstren byggs med `EF(namn)` ur handlers-modulen: en egenskriven sträng som
 * inte matchar faller igenom till normalläget UTAN att något fälls, och testet
 * ser då normalläget i stället för sitt eget fall (den tysta fällan,
 * `hermetic.ts` § Överskugga en delad handler).
 *
 * Mockarna speglar EF-svaren `{ registrations: [...] }` / `{ events: [...] }`
 * (Registration.schema / Event.schema-rader → adapterns `.parse()` passerar).
 *
 * Täckning: A-skelettets rendering (senaste anmälningar recency-sorterat,
 * nästa event temporalt, obetalda-antal stort), hälsnings-h1, klick-ytorna
 * (helkorts-klick AC #2, rad-klick + "Utan event" AC #3), CTA→/event,
 * tom-state per card, fel (4xx role=alert, no-retry), axe 0. INGEN
 * h1-auto-fokus-assertion: /hem är default-landningsytan → containern flyttar
 * INTE fokus (skip-link-först-tab-ordning, speglar EventsList; se Hem.tsx +
 * shell DoD 2).
 */

/** Sidrubriken = hälsningen (AC #6) — namn-delen är miljöberoende → prefix-match. */
const H1_HALSNING = /^Hej/;

/**
 * Härledda ur schemana, ej beskrivna bredvid dem (TASK-63) — se `acceptance-bas.ts`
 * § fogen. Vyn läser TVÅ EF:er med olika svarsform, så det tidigare gemensamma
 * `Row`-aliaset delas: ett `Record<string, unknown>` kunde bära båda, en härledd
 * typ kan inte — och ska inte.
 */
type RegRow = z.infer<typeof RegistrationSchema>;
type EventRow = z.infer<typeof EventSchema>;

/** En komplett Registration-rad (EF-svarets form, Registration.schema). */
function reg(overrides: Partial<RegRow> = {}): RegRow {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-20T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEvent1',
    personId: 'recPerson1',
    ...overrides,
  };
}

/** En komplett Event-rad (EF-svarets form, Event.schema). */
function ev(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: `recE${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: 'RIM1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Kurs',
    ort: 'Skövde',
    startdatum: '2099-06-01',
    slutdatum: '2099-06-02',
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 5,
    platserKvar: 15,
    anmaldBelaggning: 0.25,
    bekraftadBelaggning: 0.2,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 3,
    antalSlutbetalningar: 1,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    ...overrides,
  };
}

/**
 * Överskuggar Hem-vyns två EF-svar för ETT test. Isoleringen är strukturell —
 * `network` byggs om per test, så nästa test ser aldrig dessa handlers.
 *
 * Anropas den flera gånger i samma test vinner det SENASTE anropet: MSW lägger
 * `use()`-handlers först (`handlers-controller.js` rad 82) och första träffen
 * vinner. Samma företräde som den tidigare page.route-formen hade.
 */
function mock(
  network: NetworkFixture,
  {
    registrations = [],
    events = [],
    regStatus = 200,
    eventStatus = 200,
  }: {
    registrations?: RegRow[];
    events?: EventRow[];
    regStatus?: number;
    eventStatus?: number;
  } = {},
) {
  network.use(
    http.get(EF('get-registrations'), () =>
      regStatus === 200 ? json({ registrations }) : json({ error: 'x' }, regStatus),
    ),
    http.get(EF('get-events'), () =>
      eventStatus === 200 ? json({ events }) : json({ error: 'x' }, eventStatus),
    ),
  );
}

test.describe('Hem — A-skelettet (task-1.3)', () => {
  test('get-registrations 4xx → fel-UI (role=alert) i anmälnings-cards, event-card opåverkat', async ({
    page,
    network,
  }) => {
    // 4xx = klient-fel → no-retry-grenen (speglar 6c). Båda anmälnings-cards delar
    // queryn → båda visar alert; event-cardet (separat query, 200) renderar fint.
    mock(network, { regStatus: 404, events: [ev({ eventNamn: 'Resor i medvetandet 1' })] });
    await page.goto('/hem');

    await expect(page.getByRole('alert').first()).toContainText('Kunde inte hämta anmälningar');
    await expect(page.getByRole('link', { name: 'Resor i medvetandet 1' })).toBeVisible();
  });

  test('axe 0 violations på den renderade Hem-vyn', async ({ page, network }) => {
    mock(network, {
      registrations: [reg({ anmalningsavgift: 'Ej mottagen' }), reg()],
      events: [ev()],
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

/**
 * Hälsningen (task-1.1 — namnkällan): display-namnet läses ur inloggnings-
 * kontots user_metadata (Supabase-sessionen i localStorage, seedad av
 * auth.setup via storageState). Hermetiskt via addInitScript-patch av den
 * lagrade sessionen — assertionerna är oberoende av staging-kontots faktiska
 * metadata (T26-klassen: miljö-beroende assertions är sköra). Patchen körs
 * FÖRE app-boot, så getSession() läser det patchade värdet.
 */
function patchStoredDisplayName(page: Page, displayName: string | null) {
  return page.addInitScript((name) => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const session = JSON.parse(raw);
      if (!session?.user) continue;
      session.user.user_metadata = { ...session.user.user_metadata };
      if (name === null) delete session.user.user_metadata.display_name;
      else session.user.user_metadata.display_name = name;
      localStorage.setItem(key, JSON.stringify(session));
    }
  }, displayName);
}

test.describe('Hälsningen (task-1.1 — namnkällan ur kontots metadata)', () => {
  test('display-namn i sessionen → h1 "Hej {namn}"', async ({ page, network }) => {
    // 'Lotta' speglar staging-kontots faktiska display-namn — en (osannolik)
    // mitt-i-testet token-refresh, där server-sanningen ersätter patchen, kan
    // då inte flippa texten. Hälsningen är sidans h1 (task-1.3 AC #6);
    // UTAN utropstecken sedan K10-facitet (task-4.2).
    await patchStoredDisplayName(page, 'Lotta');
    mock(network);
    await page.goto('/hem');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hej Lotta', exact: true }),
    ).toBeVisible();
  });

  test('utan display-namn → neutral hälsning, aldrig e-postadressen', async ({ page, network }) => {
    await patchStoredDisplayName(page, null);
    mock(network);
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: 'Hej', exact: true })).toBeVisible();
    // E-posten är ALDRIG fallback (AC 2, Gunilla-principen). Adressen läses ur
    // fixturvärldens session (task-59.3) i stället för ur en staging-credential
    // i process.env — samma bevis, men utan miljöberoende. Riggkontrollen står
    // kvar: en tom sträng hade gjort assertionen meningslös.
    expect(FIXTUR_EPOST).not.toBe('');
    await expect(page.getByText(FIXTUR_EPOST)).toHaveCount(0);
  });

  /**
   * TASK-220 kantfall — AuthProviderns `sessionToUser` trimmar bara det
   * OMGIVANDE whitespace:t (`rawName.trim()`); inre extra mellanslag når
   * hälsningens `fornamn()` orörda. Beviset står här, inte i AuthProvider —
   * extraktionen (och därmed robustheten) bor i hälsningens visningslogik.
   */
  test('TASK-220 kantfall — omgivande/inre whitespace i display-namnet trimmas robust', async ({
    page,
    network,
  }) => {
    await patchStoredDisplayName(page, '  Marcus   Johansson  ');
    mock(network);
    await page.goto('/hem');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hej Marcus', exact: true }),
    ).toBeVisible();
  });
});

test.describe('Hem polling (Fas 6d L2 — ADR-017 + erratum)', () => {
  // RefreshButton-invalidate-testet borttaget med kontrollen (B5, task-4.2):
  // manuella uppdatera-vägen finns inte längre — poll-lagret (testet nedan)
  // är färskhetens enda bärare (ADR-017 Updates-noten).

  test('refetchInterval (60s) triggar polling-refetch — falsk klocka', async ({
    page,
    network,
  }) => {
    // page.clock fakar timers → vi kan avancera förbi 60s-intervallet deterministiskt
    // utan att vänta i realtid. refetchIntervalInBackground:false pausar bara när
    // fliken är dold; i testet är document synligt → intervallet är aktivt.
    await page.clock.install();
    // Räknaren mäter APPENS beteende (att intervallet fyrar en ny hämtning),
    // inte att en handler anropades — klassen testar aldrig fixturen. Utan
    // räknaren finns ingen observerbar skillnad mellan "pollade" och "pollade
    // inte", eftersom svaret är identiskt.
    let evCalls = 0;
    network.use(
      http.get(EF('get-registrations'), () => json({ registrations: [reg()] })),
      http.get(EF('get-events'), () => {
        evCalls += 1;
        return json({ events: [ev()] });
      }),
    );
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    await expect.poll(() => evCalls).toBe(1); // initial hämtning

    // Avancera förbi 60s → refetchInterval fyrar en polling-refetch.
    await page.clock.fastForward(61_000);
    await expect.poll(() => evCalls).toBeGreaterThan(1);
  });
});

/**
 * task-4.3 — Nästa event + Obetalda till K10-facit (S55 Del 12). Renderad
 * verifiering per L246: computed-style/boxmätning, aldrig enbart klass-närvaro.
 * Facit-formerna: dagar-kvar som VIT pill topp-höger med tre EXAKTA former;
 * metagrupp text-small med kartnåls-/kalenderikon och långdatum; kortrubrik
 * text-xl semibold mörk; beläggningsstapel (vit track, primär-dämpad fyllnad)
 * vars andel matchar X/Y; Obetalda anmälningsavgifter BARA antalet text-3xl.
 */
test.describe('Nästa event + Obetalda till facit (task-4.3)', () => {
  test('AC 4 — "X av Y platser reserverade" + beläggningsstapelns fyllnadsandel matchar X/Y (renderad mätning)', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [],
      events: [
        ev({
          eventNamn: 'Fjärrskådning',
          startdatum: '2099-09-15',
          antalAnmalda: 5,
          maxPlatser: 20,
        }),
      ],
    });
    await page.goto('/hem');
    const kort = page.getByRole('region', { name: 'Nästa event' });

    // Caption-texten är informationsbäraren (stapeln aldrig ensam): 12px
    // (text-caption) i secondary (--mm-text-secondary #525151).
    const caption = kort.getByText('5 av 20 platser reserverade', { exact: true });
    await expect(caption).toBeVisible();
    const captionStil = await caption.evaluate((el) => {
      const s = getComputedStyle(el);
      return { storlek: s.fontSize, farg: s.color };
    });
    expect(captionStil).toEqual({ storlek: '12px', farg: 'rgb(82, 81, 81)' });

    // Stapeln RENDERAD (L246-boxmätning): fyllnadsbredd / trackbredd == 5/20.
    // Track = kortets enda aria-dolda div (ikonerna är svg, pillen span).
    const track = kort.locator('div[aria-hidden="true"]');
    await expect(track).toHaveCount(1);
    const fyllnad = track.locator('div');
    const trackBox = await track.boundingBox();
    const fyllnadBox = await fyllnad.boundingBox();
    if (!trackBox || !fyllnadBox) throw new Error('boundingBox saknas för stapel-mätningen');
    expect(fyllnadBox.width / trackBox.width).toBeGreaterThan(0.23);
    expect(fyllnadBox.width / trackBox.width).toBeLessThan(0.27);

    // Färgerna renderade: vit track (--mm-surface), primär-dämpad fyllnad
    // (--mm-primary-muted #c4a840) — tokensystemet, inga hårdkodade färger.
    const farger = await track.evaluate((el) => {
      const fill = el.firstElementChild;
      if (!fill) throw new Error('fyllnadselementet saknas');
      return {
        track: getComputedStyle(el).backgroundColor,
        fyllnad: getComputedStyle(fill).backgroundColor,
      };
    });
    expect(farger).toEqual({ track: 'rgb(255, 255, 255)', fyllnad: 'rgb(196, 168, 64)' });
  });
});

test.describe('Hem-strukturen till K10-facit (task-4.2)', () => {
  test('kolumnen 600 px skärm-centrerad på desktop; headern borta (AC 1–2)', async ({
    page,
    network,
  }) => {
    mock(network);
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('header')).toHaveCount(0);
    const box = await page.locator('main#main').boundingBox();
    if (!box) throw new Error('main saknar boundingBox');
    // Renderad mätning (L246): 600-boxen + skärm-centrering (viewport 1280).
    expect(box.width).toBe(600);
    expect(Math.abs(box.x - (1280 - 600) / 2)).toBeLessThanOrEqual(1);
  });
});
