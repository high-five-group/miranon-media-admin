import AxeBuilder from '@axe-core/playwright';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * REGRESSIONSLÅSET för eventsidans promoverade ytor (ADR-103 B4, TASK-145.6).
 *
 * [RIVEN, TASK-145.6, ROLLBYTE] Denna spec bar ursprungligen ETT PAR
 * (TASK-162.1/162.2/162.3, ADR-103 B4): sex `ariaSnapshot`-referenser
 * FÅNGADE UR VARIANT-LÄGET (`?variant=a&data=verklig`), FÖRE någon flip —
 * och en andra hälft som pekade SAMMA lokatorer mot den promoverade skarpa
 * ytan, för att bevisa att promoveringen INTE ändrade formen. Variant-halvan
 * (`gotoVariantA`, `?variant=a&data=verklig`) är riven med denna skiva:
 * `?variant=`-maskineriet den förutsatte finns inte längre (Marcus
 * godkännande, ADR-103 B2 steg 4) — det fanns inget kvar att jämföra MOT.
 *
 * De SEX incheckade referensfilerna (`tests/visual/__aria__/…/*.aria.yml`)
 * VAR ORÖRDA genom TASK-145.6 — samma facit, samma `name:`-nycklar. Vad som
 * ändrades DÅ var BARA vad testerna bevisar: inte längre "variant == skarpt",
 * utan REGRESSION — att den promoverade ytan fortsätter rendera EXAKT den
 * låsta formen, för alla framtida ändringar i `Deltagare.tsx`/`Atgarder.tsx`.
 * Rivningen tog villkor och växlar, ALDRIG form (DoD #5) — därför var det
 * korrekt och avsett att alla sex tester förblev GRÖNA oförändrade rakt
 * igenom den skivan.
 *
 * [TASK-147.8, SANKTIONERAD FACIT-UPPDATERING] `atgarder-kort.aria.yml`
 * (desktop + mobile) är de FÖRSTA av de sex referenserna som ändrats sedan
 * födseln — med avsikt, inte drift. `AtgarderKort` (`Atgarder.tsx`) gick
 * från en disclosure-`button` (interim platshållare, ingen navigation) till
 * en riktig `Link` mot `/event/$eventId/atgarder`, på Marcus uttryckliga
 * order ("koppla ingången", TASK-147.8s tilläggsorder) — den formändringen
 * ÄR skivans jobb, inte en regression grinden ska fånga. Facit regenererat
 * med `npm run test:visual -- --update-snapshots` mot BÅDA viewporten;
 * diffen är exakt rollbytet `button "Gå till åtgärder"` →
 * `link "Gå till åtgärder": /url: /event/$eventId/atgarder` (verifierat med
 * riktigt event-ID, `VISUAL_EVENT_ID`), inga andra rader. De återstående fem
 * referenserna (SkrivUtKort + registrets fyra lägen) är alltjämt ORÖRDA.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (ADR-103 B4): deterministiskt, noll nya
 * beroenden, och det jämför STRUKTUR OCH TILLGÄNGLIGT NAMN — exakt det som
 * facitkartan (`docs/research/eventsidan-prototyp-mot-skarpa-facitkarta-
 * 2026-08-07.md`) läste för hand (roll, namn, synligt innehåll). Pixel-diff
 * (BackstopJS-klassen) är den bokförda eskaleringsvägen OM ariaSnapshot
 * empiriskt visar sig missa en formskillnad — inte default.
 *
 * SCOPE — VARFÖR DESSA SEX YTOR OCH INGA FLER: facitkartans blockkarta (A1,
 * A2–A6) pekar ut EXAKT de block som skilde sig mellan prototyp och skarpa
 * innan promoveringen. De fem block som redan var identiska (toppblocket 6a,
 * deltagarkorten 6g, betalningsarbetsytan 6h, Beläggning/Gruppdynamik/
 * Anteckningar) ingår MEDVETET inte i referensen — de hade inget att bevisas
 * mot, och att dra in dem hade gjort varje referens större och sprödare (en
 * oskyldig datapunkt i ett oberört block hade kunnat fälla grinden för fel
 * skäl).
 *
 *   · Genvägar-ytan (A1 i facitkartan; hette "Åtgärds-ytan" till och med
 *     TASK-147.8 — MARCUS-BESLUT 2026-08-10, S102, namnkollisionen:
 *     "Åtgärder" är nu reserverat för den riktiga Åtgärds-sidan,
 *     `AtgardsSida.tsx`. Blockbeteckningen "A1" ur den ursprungliga
 *     facitkartan, `docs/research/eventsidan-prototyp-mot-skarpa-facitkarta-
 *     2026-08-07.md`, är ORÖRD — bara det informella namnet bytt):
 *     `AtgarderKort` (`data-testid="atgarder-kort"`) och
 *     `SkrivUtKort` (`data-testid="skriv-ut-kort"`) är SYSKON i EventDetail.tsx
 *     (React-fragment, inget gemensamt DOM-skal) — därför TVÅ separata
 *     referenser i stället för en. Att linda in dem i en ny gemensam div hade
 *     LAGT TILL ett DOM-landmärke facit inte har, vilket är exakt den
 *     formändring grinden finns för att förhindra.
 *   · Registret (A2–A6): fyra lägen genom SAMMA lokator
 *     (`data-testid="register-yta"`, TASK-162.1-tillägget i Deltagare.tsx —
 *     wrappern är GEMENSAM för hela registret, testid:t flippar ingen form).
 *
 * FYRA REGISTER-LÄGEN, VALDA MOT KÄNDA FAKTA (uppdraget + facitkartan
 * § A2/§ A6):
 *   1. Default — `TOMT_REGISTER_FILTER`, ingen interaktion.
 *   2. Aktivt filter — "Visa: Väntar på bekräftelse" (en axel, en enkel och
 *      läsbar referens; kombinerade axlar är produktbeteende, inte grindens
 *      jobb att bevisa).
 *   3. Bor över-kryss — klick på toppblockets "Bor över"-rad (INTE panelens
 *      egen "Visa"-dropdown: `borOverSnapshot` sätts bara av toppradens
 *      onClick, se Deltagare.tsx — att välja "Bor över" via dropdownen hade
 *      gett en TOM kryss-lista och alltså fel referens).
 *   4. Noll träffar — "Visa: Avbokade". Fixturvärlden har noll avbokade
 *      registreringar på `VISUAL_EVENT_ID` (`fixture-data.ts`s
 *      `REGISTRATIONS_RESPONSE`, verifierat: samtliga fem Skövde-poster har
 *      status Obekräftad/Bekräftad/Betalningspåminnelse, ingen Avbokad) —
 *      känt faktum ur uppdraget, verifierat mot fixturen i stället för antaget.
 */

async function gotoPromoverad(page: import('@playwright/test').Page) {
  // INGA query-params: `?variant`/`?data` läses inte längre av någon fil
  // (TASK-145.6 rev hela `?variant=`-maskineriet) — sidan renderar alltid den
  // enda, promoverade formen. Samma ankare som förr.
  await page.goto(`/event/${VISUAL_EVENT_ID}`);
  await expect(page.getByTestId('atgarder-kort')).toBeVisible();
}

test.describe('regressionslåset — ariaSnapshot mot den promoverade ytan (ADR-103 B4, TASK-145.6)', () => {
  test('genvägar-ytan — "Gå till åtgärder"-kortet (AtgarderKort)', async ({ page }) => {
    await gotoPromoverad(page);
    await expect(page.getByTestId('atgarder-kort')).toMatchAriaSnapshot({
      name: 'atgarder-kort.aria.yml',
    });
  });

  test('genvägar-ytan — "Skriv ut"-kortet (SkrivUtKort)', async ({ page }) => {
    await gotoPromoverad(page);
    await expect(page.getByTestId('skriv-ut-kort')).toMatchAriaSnapshot({
      name: 'skriv-ut-kort.aria.yml',
    });
  });

  test('registret — default (inget filter)', async ({ page }) => {
    await gotoPromoverad(page);
    await expect(page.getByTestId('register-yta')).toMatchAriaSnapshot({
      name: 'register-default.aria.yml',
    });
  });

  test('registret — aktivt filter (Visa: Väntar på bekräftelse)', async ({ page }) => {
    await gotoPromoverad(page);
    await page.getByRole('button', { name: 'Visa' }).click();
    await page.getByRole('option', { name: 'Väntar på bekräftelse' }).click();
    await expect(page.getByTestId('register-yta')).toMatchAriaSnapshot({
      name: 'register-aktivt-filter.aria.yml',
    });
  });

  test('registret — Bor över-kryss', async ({ page }) => {
    await gotoPromoverad(page);
    // Toppblockets EGEN "Bor över"-rad, inte panelens "Visa"-dropdown — se
    // filens docblock för varför (borOverSnapshot-fällan).
    await page.getByRole('button', { name: /^Bor över/ }).click();
    await expect(page.getByTestId('register-yta')).toMatchAriaSnapshot({
      name: 'register-bor-over.aria.yml',
    });
  });

  test('registret — noll träffar (Visa: Avbokade)', async ({ page }) => {
    await gotoPromoverad(page);
    await page.getByRole('button', { name: 'Visa' }).click();
    await page.getByRole('option', { name: 'Avbokade' }).click();
    await expect(page.getByTestId('register-yta')).toMatchAriaSnapshot({
      name: 'register-noll-traffar.aria.yml',
    });
  });
});

/**
 * [TASK-145.6, AC #4] STALE VARIANT-URL — degraderar till den skarpa vyn utan
 * krasch och utan halvbyggd yta. Innan rivningen villkorade `?variant=a`
 * (+ `?data=proto|verklig`) vilken datakälla/form sex olika filer renderade;
 * en länk som fortfarande bär den gamla queryn (bokmärke, delad URL, öppen
 * flik) får nu träffa en app där INGEN fil längre läser parametern —
 * `useQueryState('variant')` är riven överallt (grep-verifierat, se
 * `EventDetail.tsx`/`Deltagare.tsx`/`Betalningar.tsx`/`Belaggning.tsx`/
 * `Anteckningar.tsx`/`Gruppdynamik.tsx`). Samma ariaSnapshot-referens som
 * regressionslåset ovan bevisar det MEKANISKT, inte bara "sidan kraschar
 * inte": en stale `?variant=a&data=proto`-URL måste rendera BYTE FÖR BYTE
 * samma träd som ingen query alls — inte en tom yta, inte fixturdata, inte
 * ett kvarvarande prototyp-fragment.
 */
test.describe('TASK-145.6 AC #4 — stale ?variant=-URL degraderar till skarpa vyn', () => {
  test('?variant=a&data=proto renderar identiskt med ingen query alls', async ({ page }) => {
    await page.goto(`/event/${VISUAL_EVENT_ID}?variant=a&data=proto`);
    await expect(page.getByTestId('atgarder-kort')).toBeVisible();
    // Ingen krasch (sidan laddade) och ingen halvbyggd yta: exakt samma
    // låsta form som regressionslåsets "default"-test ovan, med den stale
    // frågan ur uppdragets S86-kontrakt fortfarande i URL:en.
    await expect(page.getByTestId('atgarder-kort')).toMatchAriaSnapshot({
      name: 'atgarder-kort.aria.yml',
    });
    await expect(page.getByTestId('register-yta')).toMatchAriaSnapshot({
      name: 'register-default.aria.yml',
    });
  });

  test('okänd ?variant=z degraderar likaså (ingen känd variant kan matcha)', async ({ page }) => {
    await page.goto(`/event/${VISUAL_EVENT_ID}?variant=z`);
    await expect(page.getByTestId('atgarder-kort')).toBeVisible();
    await expect(page.getByTestId('register-yta')).toMatchAriaSnapshot({
      name: 'register-default.aria.yml',
    });
  });
});

/**
 * [TASK-162.4, ADR-103 B4/PRD TASK-162 § Testbeslut — "A11y-golvet består:
 * promoverade ytor behåller nivå 11; axe-pass ingår i härdningen"] Axe-pass
 * på EXAKT samma promoverade ytor/lokatorer som ariaSnapshot-grinden ovan
 * bevisar formen på: åtgärds-korten (`atgarder-kort`/`skriv-ut-kort`) och
 * registret (`register-yta`) i samtliga fyra filter-lägen.
 *
 * VARFÖR HÄR OCH INTE I `event-detail.staging.test.ts`/
 * `event-deltagare.staging.test.ts`: dessa filer BÄR redan egna axe-scanningar
 * av samma ytor (helsides-scan rad ~485 resp. registrets grundläge/filtrerat/
 * markera-läge rad ~612 i respektive fil, uppdaterade i TASK-162.2/162.3) —
 * men de kör i `chromium-authenticated`-projektet, som kräver en riktig
 * staging-inloggning (`setup`-projektets storageState) och port 5173. En
 * agent-worktree kan strukturellt inte köra dem (5173-förbudet,
 * CONTRIBUTING.md § Landnings-ordningen); post-merge-nätet är den enda platsen
 * de faktiskt körs. PRD TASK-162:s EGET testbeslut pekar ut den hermetiska
 * fixturvärlden som PRIMÄR skarv för just denna feature-yta — samma `test`/
 * `gotoPromoverad` som ariaSnapshot-grinden ovan redan bär, alltså den
 * faktiska LOKALA MOTSVARIGHETEN till axe-runner-jobbet (`npm run test:a11y`)
 * för en yta jobbet självt inte når (DEV-guardat, ADR-044/045 — eventsidan är
 * ingen DEV-route). Körs lokalt: `npm run test:visual` (ingen staging,
 * ingen port 5173, samma fixtur-env som visual/acceptance).
 *
 * Detta ÄR en TILLKOMMANDE, oberoende täckning — inte en ersättning för
 * ovanstående staging-sviter (som bevisar mot verklig auth-kontext) eller för
 * `npm run test:a11y` (DEV-primitiven). Tre lager, tre olika saker bevisade.
 */
test.describe('TASK-162.4 — axe-pass på de promoverade ytorna (ADR-103, härdningen)', () => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  /** Kör axe scopat till en lokator; violations skrivs ut läsbart vid fällning. */
  async function axeNoll(page: import('@playwright/test').Page, selector: string) {
    const resultat = await new AxeBuilder({ page })
      .withTags(WCAG_TAGGAR)
      .include(selector)
      .analyze();
    expect(
      resultat.violations,
      resultat.violations
        .map((v) => `[${v.impact ?? 'utan impact'}] ${v.id}: ${v.help}`)
        .join('\n'),
    ).toEqual([]);
  }

  test('genvägar-ytan — AtgarderKort + SkrivUtKort: axe 0 violations', async ({ page }) => {
    await gotoPromoverad(page);
    const resultat = await new AxeBuilder({ page })
      .withTags(WCAG_TAGGAR)
      .include('[data-testid="atgarder-kort"]')
      .include('[data-testid="skriv-ut-kort"]')
      .analyze();
    expect(
      resultat.violations,
      resultat.violations
        .map((v) => `[${v.impact ?? 'utan impact'}] ${v.id}: ${v.help}`)
        .join('\n'),
    ).toEqual([]);
  });

  test('registret — default (inget filter): axe 0 violations', async ({ page }) => {
    await gotoPromoverad(page);
    await axeNoll(page, '[data-testid="register-yta"]');
  });

  test('registret — aktivt filter (Visa: Väntar på bekräftelse): axe 0 violations', async ({
    page,
  }) => {
    await gotoPromoverad(page);
    await page.getByRole('button', { name: 'Visa' }).click();
    await page.getByRole('option', { name: 'Väntar på bekräftelse' }).click();
    await axeNoll(page, '[data-testid="register-yta"]');
  });

  test('registret — Bor över-kryss: axe 0 violations', async ({ page }) => {
    await gotoPromoverad(page);
    // Toppradens EGNA "Bor över"-rad — samma borOverSnapshot-fälla som
    // ariaSnapshot-grinden ovan dokumenterar (panelens "Visa"-dropdown ger en
    // TOM kryss-lista, fel läge).
    await page.getByRole('button', { name: /^Bor över/ }).click();
    await axeNoll(page, '[data-testid="register-yta"]');
  });

  test('registret — noll träffar (Visa: Avbokade): axe 0 violations', async ({ page }) => {
    await gotoPromoverad(page);
    await page.getByRole('button', { name: 'Visa' }).click();
    await page.getByRole('option', { name: 'Avbokade' }).click();
    await axeNoll(page, '[data-testid="register-yta"]');
  });
});
