import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { RegistrationSchema } from '../../src/domain/schemas';
import { EVENT_ATTACHMENTS_RESPONSE, VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-416.20 — regressionstest för prefetch på avsikt (ADR-078 beslut 3).
 *
 * VARFÖR DENNA FIL FINNS: `TASK-416.11` (bilagor, PR #2399) och `TASK-416.16`
 * (närvaro, PR #2403) landade prefetch-på-avsikt utan ett test som blir rött
 * om någon river den — regeln stod bara som prosa i de tre docblocken
 * (`Atgarder.tsx` § `HandlingsLank`/`AtgarderKort`/`CheckInKort`,
 * `EventDetail.tsx` § "Närvaro på avsikt", `AtgardsSida.tsx` §
 * "FÖRVÄRMNING VID SIDMOUNT"). Denna fil är den regressionsgrinden.
 *
 * TRE OBEROENDE MEKANISMER PROVAS, VAR FÖR SIG:
 *
 *   A. `CheckInKort`s `onIntent` (EventDetail → /narvaro): hover/fokus på
 *      "Gå till check-in" ska ha värmt `get-attendance` innan klicket.
 *   B. `AtgarderKort`s `onIntent` (EventDetail → /atgarder): hover/fokus på
 *      "Gå till åtgärder" ska ha värmt `get-event-attachments` innan klicket.
 *   C. `AtgardsSida`s egen sidmonterings-förvärmning (TASK-416.11): navigerar
 *      man DIREKT till Åtgärds-sidan (utan att någonsin ha hovrat/fokuserat
 *      ingången på eventdetaljen) ska `get-event-attachments` ändå vara
 *      begärd innan någon åtgärdsrad öppnas.
 *
 * ── VARFÖR "MSW-RÄKNARE" INTE LÄSTS BOKSTAVLIGT (avvikelse mot kortets
 *    ordalydelse, bokförd per ADR-086/premiss-passet) ──────────────────────
 *
 * Kortets beskrivning ber om en "MSW-räknare" för att bevisa att EF:en
 * anropats FÖRE klicket. `acceptance-bas.ts` § VAD KLASSEN BEVISAR säger
 * dock uttryckligen: "Klassen testar EXTERNT BETEENDE — aldrig att en
 * handler anropades eller hur många gånger. Det vore att testa fixturen."
 * En räknare INUTI en MSW-handler är exakt det den raden förbjuder.
 *
 * I STÄLLET återanvänds husets ENDA befintliga prefetch-test
 * (`tabbar-personer-prefetch.acceptance.test.ts`, ADR-078/ADR-123): en
 * HÅLL-BAR mock (`hallbarMock`-mönstret, `laddning-cls.acceptance.test.ts`/
 * `event-checkin-laddlage.acceptance.test.ts`) som håller svaret inne tills
 * testet EXPLICIT släpper det, kombinerat med `page.waitForResponse` —
 * PLAYWRIGHTS EGET nätverkslager, samma yta en riktig devtools-flik visar.
 * Det är fortfarande "EF-anrop före klick" som bevisas — bara via ett
 * observerbart NÄTVERKSSVAR i stället för en intern handler-räknare. Formen
 * är STARKARE än `tabbar-personer-prefetch.acceptance.test.ts`s egen
 * `delay()`-baserade kontrast: eftersom mocken håller INNAN interaktionen
 * sker, finns inget tidsfönster att missa — svaret kan per konstruktion
 * bara landa när testet väljer att släppa det.
 *
 * ── EN UPPTÄCKT GRÄNS, BOKFÖRD ÖPPET (premiss-passet) ────────────────────
 *
 * För NÄRVARO finns TVÅ prefetch-vägar på SAMMA sida (`EventDetail.tsx`):
 * `CheckInKort`s `onIntent` (denna skiva bevisar den) OCH ett eget
 * sidmonterings-`useEffect` (TASK-416.16 AC #2, kör OVILLKORLIGT vid varje
 * mount, oavsett hover). React Querys dedupe gör att BARA den som hinner
 * FÖRST faktiskt startar nätverksanropet — och mount-effekten körs
 * strukturellt före en Playwright-hover kan hinna ske. Ett svart-låda-test
 * kan därför INTE isolera "just onIntent-vägen" för närvaro: tas ENBART
 * `onIntent={varmNarvaro}` bort från `<CheckInKort>` i `EventDetail.tsx`
 * förblir testet GRÖNT (mount-effekten bär hela vägen ändå) — det är inte
 * en lucka i DETTA test, det är att de två mekanismerna observerbart
 * producerar SAMMA utfall för Lotta. Test A:s tvåsidiga bevis (AC #3)
 * river därför BÅDA närvaro-mekanismerna samtidigt (mount-effekten OCH
 * onIntent-kopplingen) — se testets eget bevis-avsnitt i PR-beskrivningen/
 * kortets notes för de uppmätta talen. BILAGORS två mekanismer (`AtgarderKort`
 * på eventdetaljen kontra `AtgardsSida`s egen sidmontering) ligger däremot på
 * OLIKA sidor, sekvenserade av en navigering — de ÄR oberoende observerbara,
 * och test B/C river dem var för sig.
 */

// ─── Håll/släpp-mock (hallbarMock-mönstret) ───────────────────────────────

type HallbarState = { slappAlla: () => void };

function nyHallbarState(): HallbarState & { vantaOmHallen: () => Promise<void> } {
  let hall = true;
  const parkerade: Array<() => void> = [];
  return {
    vantaOmHallen: () =>
      hall ? new Promise<void>((slapp) => parkerade.push(slapp)) : Promise.resolve(),
    slappAlla() {
      hall = false;
      for (const slapp of parkerade.splice(0)) slapp();
    },
  };
}

/** Håller `get-attendance` inne tills testet släpper — svaret är TOMT
 *  (samma normalläge som `ATTENDANCE_RESPONSE`): denna fil bryr sig bara om
 *  NÄR svaret landar, inte vilken data det bär. */
function hallbarAttendance(network: NetworkFixture): HallbarState {
  const st = nyHallbarState();
  network.use(
    http.get(EF('get-attendance'), async () => {
      await st.vantaOmHallen();
      return json({ attendance: [] });
    }),
  );
  return st;
}

/** Håller `get-event-attachments` inne tills testet släpper — samma tomma
 *  normalläge som `EVENT_ATTACHMENTS_RESPONSE`. */
function hallbarAttachments(network: NetworkFixture): HallbarState {
  const st = nyHallbarState();
  network.use(
    http.get(EF('get-event-attachments'), async () => {
      await st.vantaOmHallen();
      return json(EVENT_ATTACHMENTS_RESPONSE);
    }),
  );
  return st;
}

// ─── Minimal registrerings-fixtur för check-in-testet (test A) ────────────
// Samma form som `laddning-cls.acceptance.test.ts`s `reg()` (proven att
// producera en riktig dörrlista-rad) — en person räcker: testet bevisar
// NÄR datan landar, inte vilken data det är.

type RegRow = z.infer<typeof RegistrationSchema>;

function nordinRegistrering(): RegRow {
  return {
    id: 'recPrefetchReg0001',
    namn: null,
    fornamn: 'Nora',
    efternamn: 'Nordin',
    email: 'nora.nordin@example.se',
    telefon: '070-9999999',
    eventNamn: 'Utbildning Skövde',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: null,
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-09-01T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: VISUAL_EVENT_ID,
    personId: 'recPrefetchPers0001',
  };
}

function waitForEf(page: import('@playwright/test').Page, efNamn: string) {
  return page.waitForResponse(
    (res) => res.url().includes(`/functions/v1/${efNamn}`) && res.status() === 200,
  );
}

test.describe('Prefetch på avsikt — regression (ADR-078 beslut 3, TASK-416.20)', () => {
  test('A — hover/fokus på Check-in-ingången värmer get-attendance FÖRE klick; ingen laddläge vid check-in', async ({
    page,
    network,
  }) => {
    network.use(
      http.get(EF('get-registrations'), ({ request }) => {
        const eventId = new URL(request.url).searchParams.get('eventId');
        if (!eventId) return json({ registrations: [nordinRegistrering()] });
        return json({
          registrations: [nordinRegistrering()].filter((r) => r.eventId === eventId),
        });
      }),
    );
    const mocken = hallbarAttendance(network);

    await page.goto(`/event/${VISUAL_EVENT_ID}`);
    const checkinLank = page.getByRole('link', { name: 'Gå till check-in' });
    await expect(checkinLank).toBeVisible();

    // Registrera väntan FÖRE avsiktssignalen — annars kan svaret hinna landa
    // (via sidmonterings-effekten, se filhuvudets § EN UPPTÄCKT GRÄNS) innan
    // lyssnaren är på plats.
    const attendanceSvar = waitForEf(page, 'get-attendance');
    await checkinLank.focus();
    mocken.slappAlla();
    await attendanceSvar; // BEVIS: svaret landade innan något klick skett.

    await checkinLank.click();
    await expect(page).toHaveURL(`/event/${VISUAL_EVENT_ID}/narvaro`);

    // Väntar in check-in-SIDANS eget rubrikelement (routen är lazy-laddad —
    // `history`/URL:en uppdateras innan chunken hunnit rendera klart, mätt:
    // omedelbart efter navigeringen stod eventdetaljens EGEN h1 kvar en kort
    // stund). Utan detta kan `getByText('Nora Nordin')` nedan träffa BÅDA
    // eventdetaljens Anmälda-rad OCH dörrlistans rad samtidigt.
    await expect(page.getByRole('heading', { name: 'Check-in', level: 1 })).toBeVisible();

    // Cachen var redan varm — skelettet syns ALDRIG, och Noras rad står där
    // direkt. Scopat till dörrlistan (samma disciplin som
    // `event-checkin-dorrlistan.acceptance.test.ts`): en text-sökning utan
    // scope kan annars träffa fler ställen än dörrraden.
    await expect(page.getByTestId('dorrlista-skelettrad')).toHaveCount(0);
    await expect(
      page.getByRole('list', { name: 'Anmälda att checka in' }).getByText('Nora Nordin'),
    ).toBeVisible();
  });

  test('B — hover på "Gå till åtgärder" värmer get-event-attachments FÖRE klick; bilageväljaren renderar utan laddläge', async ({
    page,
    network,
  }) => {
    const mocken = hallbarAttachments(network);

    await page.goto(`/event/${VISUAL_EVENT_ID}`);
    const atgarderLank = page.getByRole('link', { name: 'Gå till åtgärder' });
    await expect(atgarderLank).toBeVisible();

    const attachmentsSvar = waitForEf(page, 'get-event-attachments');
    await atgarderLank.hover();
    mocken.slappAlla();
    await attachmentsSvar; // BEVIS: svaret landade innan något klick skett.

    await atgarderLank.click();
    await expect(page).toHaveURL(`/event/${VISUAL_EVENT_ID}/atgarder`);
    await expect(page.getByTestId('eventet-block')).toBeVisible();

    // Öppna en åtgärd för att nå bilageväljarens levande lista (BilageValjare
    // monteras bara när en åtgärds ArbetsYta fälls ut).
    await page.getByRole('button', { name: /Skicka bekräftelsemail/ }).click();

    await expect(page.getByText('Hämtar bilagor…')).toHaveCount(0);
    await expect(page.getByText('Inga bilagor tillgängliga för det här eventet.')).toBeVisible();
  });

  test('C — Åtgärds-sidans sidmonterings-prefetch: get-event-attachments begärs vid mount, utan interaktion', async ({
    page,
    network,
  }) => {
    const mocken = hallbarAttachments(network);

    // Registreras FÖRE goto: mount-effekten (AtgardsSida.tsx) kan fyra
    // omedelbart vid montering, innan testet hinner göra något annat.
    const attachmentsSvar = waitForEf(page, 'get-event-attachments');

    await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
    await expect(page.getByTestId('eventet-block')).toBeVisible();

    mocken.slappAlla();
    await attachmentsSvar; // BEVIS: anropet skedde utan att någon rad öppnats.

    // Öppna en åtgärd EFTER att ha bevisat sidmonterings-anropet — cachen ska
    // redan vara varm, ingen laddläge-skeleton i bilageväljaren.
    await page.getByRole('button', { name: /Skicka bekräftelsemail/ }).click();

    await expect(page.getByText('Hämtar bilagor…')).toHaveCount(0);
    await expect(page.getByText('Inga bilagor tillgängliga för det här eventet.')).toBeVisible();
  });
});
