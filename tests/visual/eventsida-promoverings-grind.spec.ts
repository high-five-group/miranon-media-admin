import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN (TASK-162.1, ADR-103 B4) — ariaSnapshot-referenser ur
 * variant-läget (`?variant=a&data=verklig`), FÅNGADE FÖRE NÅGON FLIP.
 *
 * Detta är prefaktoreringen ADR-103 B2 beskriver: bevismekanismen byggs INNAN
 * åtgärds-ytan (skiva 162.2) eller registret (skiva 162.3) promoveras. De sex
 * referensfilerna denna spec genererar (`--update-snapshots`, körda en gång
 * vid byggandet av DENNA skiva) ÄR grindens facit — incheckade `.aria.yml`-
 * filer under `tests/visual/__aria__/`. Skiva 162.2/162.3 pekar SAMMA
 * locators mot den promoverade (flippade) skarpa ytan: identisk rendering ⇒
 * identisk ariaSnapshot ⇒ grönt. Varje skillnad — även en enda rad — fäller
 * rött, med Playwrights egen diff i testutdatan.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (ADR-103 B4): deterministiskt, noll nya
 * beroenden, och det jämför STRUKTUR OCH TILLGÄNGLIGT NAMN — exakt det som
 * facitkartan (`docs/research/eventsidan-prototyp-mot-skarpa-facitkarta-
 * 2026-08-07.md`) läste för hand (roll, namn, synligt innehåll). Pixel-diff
 * (BackstopJS-klassen) är den bokförda eskaleringsvägen OM ariaSnapshot
 * empiriskt visar sig missa en formskillnad — inte default.
 *
 * SCOPE — VARFÖR DESSA SEX YTOR OCH INGA FLER: facitkartans blockkarta (A1,
 * A2–A6) pekar ut EXAKT de block som skiljer sig mellan prototyp och skarpa.
 * De fem block som redan är identiska (toppblocket 6a, deltagarkorten 6g,
 * betalningsarbetsytan 6h, Beläggning/Gruppdynamik/Anteckningar) ingår
 * MEDVETET inte i referensen — de har inget att bevisas mot, och att dra in
 * dem hade gjort varje referens större och sprödare (en oskyldig datapunkt i
 * ett oberört block hade kunnat fälla grinden för fel skäl).
 *
 *   · Åtgärds-ytan (A1): `AtgarderKort` (`data-testid="atgarder-kort"`) och
 *     `SkrivUtKort` (`data-testid="skriv-ut-kort"`) är SYSKON i EventDetail.tsx
 *     (React-fragment, inget gemensamt DOM-skal) — därför TVÅ separata
 *     referenser i stället för en. Att linda in dem i en ny gemensam div hade
 *     LAGT TILL ett DOM-landmärke prototypens facit inte har, vilket är
 *     exakt den formändring grinden finns för att förhindra.
 *   · Registret (A2–A6): fyra lägen genom SAMMA lokator
 *     (`data-testid="register-yta"`, TASK-162.1-tillägget i Deltagare.tsx —
 *     wrappern är GEMENSAM för variant- och skarpa-grenen redan innan
 *     tillägget, se docblocket där, så testid:t flippar ingen form).
 *
 * FYRA LÄGEN, VALDA MOT KÄNDA FAKTA (uppdraget + facitkartan § A2/§ A6):
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
 *
 * `?data=verklig` (S90-kontraktet, se EventDetail.tsx/Deltagare.tsx) gör att
 * variant-läget hämtar via NÄTVERKET precis som skarpa gör — samma metod
 * facitkartans research-pass använde, så referensen är byggd mot samma
 * fixturdata skiva 162.2/162.3 kommer rendera EFTER flippen. Utan `data=verklig`
 * hade variant-läget läst sina egna in-memory `HALLPLATS_PROTO_FIXTURES`
 * (`hallplats-steg-prototyp.ts`) i stället — en ANNAN datamängd, och en
 * jämförelse mot den hade bevisat fel sak.
 */

async function gotoVariantA(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}?variant=a&data=verklig`);
  // Ankaret för BÅDA ytorna: väntar in att sidan lämnat sitt laddningsskelett
  // innan någon ariaSnapshot tas (toMatchAriaSnapshot väntar/pollar redan,
  // men en explicit väntan här gör testets FÖRSTA steg entydigt — laddning,
  // inte assertion — om servern är ovanligt långsam).
  await expect(page.getByTestId('atgarder-kort')).toBeVisible();
}

test.describe('promoverings-grinden — ariaSnapshot-referenser ur variant-läget (ADR-103 B4)', () => {
  test('åtgärds-ytan — "Gå till åtgärder"-kortet (AtgarderKort)', async ({ page }) => {
    await gotoVariantA(page);
    await expect(page.getByTestId('atgarder-kort')).toMatchAriaSnapshot({
      name: 'atgarder-kort.aria.yml',
    });
  });

  test('åtgärds-ytan — "Skriv ut"-kortet (SkrivUtKort)', async ({ page }) => {
    await gotoVariantA(page);
    await expect(page.getByTestId('skriv-ut-kort')).toMatchAriaSnapshot({
      name: 'skriv-ut-kort.aria.yml',
    });
  });

  test('registret — default (inget filter)', async ({ page }) => {
    await gotoVariantA(page);
    await expect(page.getByTestId('register-yta')).toMatchAriaSnapshot({
      name: 'register-default.aria.yml',
    });
  });

  test('registret — aktivt filter (Visa: Väntar på bekräftelse)', async ({ page }) => {
    await gotoVariantA(page);
    await page.getByRole('button', { name: 'Visa' }).click();
    await page.getByRole('option', { name: 'Väntar på bekräftelse' }).click();
    await expect(page.getByTestId('register-yta')).toMatchAriaSnapshot({
      name: 'register-aktivt-filter.aria.yml',
    });
  });

  test('registret — Bor över-kryss', async ({ page }) => {
    await gotoVariantA(page);
    // Toppblockets EGEN "Bor över"-rad, inte panelens "Visa"-dropdown — se
    // docblocket ovan för varför (borOverSnapshot-fällan).
    await page.getByRole('button', { name: /^Bor över/ }).click();
    await expect(page.getByTestId('register-yta')).toMatchAriaSnapshot({
      name: 'register-bor-over.aria.yml',
    });
  });

  test('registret — noll träffar (Visa: Avbokade)', async ({ page }) => {
    await gotoVariantA(page);
    await page.getByRole('button', { name: 'Visa' }).click();
    await page.getByRole('option', { name: 'Avbokade' }).click();
    await expect(page.getByTestId('register-yta')).toMatchAriaSnapshot({
      name: 'register-noll-traffar.aria.yml',
    });
  });
});
