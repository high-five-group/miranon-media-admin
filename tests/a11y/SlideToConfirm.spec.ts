import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * SlideToConfirm — a11y-mönster-spec mot S73-facit-utökningens
 * publicerings-handtag (task-19.1; facit-källa S73-bilagan
 * `tasks/sessions/bilagor/s73-eventsida-konvergens/`,
 * FACIT-skapa-sidan.png + FACIT-skapa-handtag-armad.png + README
 * §FACIT-UTÖKNINGEN K73–K84).
 *
 * Testar externt beteende, inte implementationsdetaljer (PRD TASK-19
 * §Testbeslut): switch-semantik, tangentbords- och icke-drag-vägen som
 * KRAV (draget är förstärkning, aldrig enda vägen), drag-armering med
 * K79-vakterna, pling-preferensrespekt och computed-form där facitet
 * kräver exakthet (L245/L246: renderad verifiering, aldrig källkodstitt).
 *
 * Kör i a11y-projektet mot /dev/primitives (ADR-044/045); sektions-skanen
 * i runnern bor i primitives.spec.ts — mönster-specen bär axe-0 i BÅDA
 * tillstånden (AC 1).
 */

const SEKTION = '[aria-labelledby="rubrik-slidetoconfirm"]';
const NAMN = 'Publicera på miranon.se';
const HANDTAG_PX = 48;

/** Facit-switchen (demo-sektionens huvudinstans). */
function switchen(page: Page) {
  return page.locator(SEKTION).getByRole('switch', { name: NAMN });
}

/** Handtags-cirkeln (aria-hidden, data-slot="handle") i facit-switchen. */
function handtaget(page: Page) {
  return switchen(page).locator('[data-slot="handle"]');
}

/** Löser en CSS-custom-property till computed färg via en DOM-probe. */
async function resolvedTokenColor(page: Page, tokenNamn: string): Promise<string> {
  return page.evaluate((namn) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${namn})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, tokenNamn);
}

/**
 * Stubbar Web Audio med en räknare FÖRE nästa navigation: varje
 * pling-försök konstruerar en AudioContext → `__mmPling` räknar dem.
 * Observerbart utan ljudkort — renderad verifiering av pling-vägen.
 */
async function stubbaWebAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __mmPling: number; AudioContext: unknown };
    w.__mmPling = 0;
    w.AudioContext = class {
      currentTime = 0;
      destination = {};
      constructor() {
        w.__mmPling += 1;
      }
      createOscillator() {
        return {
          type: '',
          frequency: { setValueAtTime() {} },
          connect(nod: unknown) {
            return nod;
          },
          start() {},
          stop() {},
          onended: null,
        };
      }
      createGain() {
        const gain = {
          gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect(nod: unknown) {
            return nod;
          },
        };
        return gain;
      }
      close() {
        return Promise.resolve();
      }
    };
  });
  await page.reload();
  // .first(): se tests/a11y/fixtures.ts (samma strict-mode-krock sedan
  // TASK-285.3 la två h1-rubriker till på /dev/primitives).
  await page.getByRole('heading', { level: 1 }).first().waitFor();
}

async function antalPling(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __mmPling: number }).__mmPling);
}

test.describe('SlideToConfirm — semantik + tangentbord (minimaltestet)', () => {
  test('switchen finns med tillgängligt namn och är oarmerad från start', async ({ page }) => {
    const handtag = switchen(page);
    await expect(handtag).toBeVisible();
    // role="switch" + aria-checked är den begripliga annonseringen
    // (oarmerat/armerat läses som av/på av skärmläsare) — AC 1.
    await expect(handtag).toHaveAttribute('aria-checked', 'false');
  });

  test('tangentbord: Space armerar, Enter avarmerar — icke-drag-vägen är ett KRAV', async ({
    page,
  }) => {
    const handtag = switchen(page);
    await handtag.focus();
    await page.keyboard.press(' ');
    await expect(handtag).toHaveAttribute('aria-checked', 'true');
    // Demo-sidans aria-live-statusrad bevisar att värdet nådde konsumenten.
    await expect(page.getByTestId('senast-tryckt')).toHaveText('slidetoconfirm: armerad');

    await page.keyboard.press('Enter');
    await expect(handtag).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('senast-tryckt')).toHaveText('slidetoconfirm: oarmerad');
  });

  test('tangentbordsfokus ger den globala fokus-ringen (2 px + 2 px offset)', async ({ page }) => {
    // Tab-flytt in i switchen garanterar :focus-visible (inte programmatisk focus).
    await page.locator(SEKTION).getByRole('heading').click();
    await page.keyboard.press('Tab');
    const handtag = switchen(page);
    await expect(handtag).toBeFocused();
    const ring = await handtag.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bredd: s.outlineWidth, stil: s.outlineStyle, farg: s.outlineColor };
    });
    expect(ring.bredd).toBe('2px');
    expect(ring.stil).toBe('solid');
    expect(ring.farg).toBe(await resolvedTokenColor(page, '--mm-focus-ring'));
  });
});

test.describe('SlideToConfirm — drag-armering och K79-vakterna', () => {
  test('mus-drag från handtaget till målet armerar; drag tillbaka avarmerar', async ({ page }) => {
    const handtag = switchen(page);
    // Sektionen ligger under folden — mus-koordinater är viewport-relativa.
    await handtag.scrollIntoViewIfNeeded();
    const yta = await handtag.boundingBox();
    if (!yta) throw new Error('switchen saknar bounding box');
    const cy = yta.y + yta.height / 2;

    // Grepp mitt i cirkeln (vänsterläget) → dra till högerkanten.
    await page.mouse.move(yta.x + HANDTAG_PX / 2, cy);
    await page.mouse.down();
    await page.mouse.move(yta.x + yta.width - HANDTAG_PX / 2, cy, { steps: 10 });
    await page.mouse.up();
    await expect(handtag).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('senast-tryckt')).toHaveText('slidetoconfirm: armerad');

    // Ångra-vägen: grepp i högerläget → dra tillbaka till vänsterkanten.
    await page.mouse.move(yta.x + yta.width - HANDTAG_PX / 2, cy);
    await page.mouse.down();
    await page.mouse.move(yta.x + HANDTAG_PX / 2, cy, { steps: 10 });
    await page.mouse.up();
    await expect(handtag).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('senast-tryckt')).toHaveText('slidetoconfirm: oarmerad');
  });

  test('klick på rännan teleporterar inte cirkeln och armerar inte (K79)', async ({ page }) => {
    const handtag = switchen(page);
    await handtag.scrollIntoViewIfNeeded();
    const yta = await handtag.boundingBox();
    if (!yta) throw new Error('switchen saknar bounding box');

    await page.mouse.click(yta.x + yta.width / 2, yta.y + yta.height / 2);
    await expect(handtag).toHaveAttribute('aria-checked', 'false');
    await expect(handtaget(page)).toHaveCSS('left', '0px');
  });

  test('släpp mitt i fjädrar tillbaka (90/10) — och instruktionstexten tonar under draget', async ({
    page,
  }) => {
    const handtag = switchen(page);
    await handtag.scrollIntoViewIfNeeded();
    const yta = await handtag.boundingBox();
    if (!yta) throw new Error('switchen saknar bounding box');
    const cy = yta.y + yta.height / 2;

    await page.mouse.move(yta.x + HANDTAG_PX / 2, cy);
    await page.mouse.down();
    await page.mouse.move(yta.x + yta.width / 2, cy, { steps: 10 });
    // Mitt i draget (pos ≈ 0,5): instruktionstexten har tonat ut påtagligt.
    const opacitet = await handtag
      .locator('[data-slot="text"]')
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).opacity));
    expect(opacitet).toBeLessThan(0.8);
    expect(opacitet).toBeGreaterThan(0.2);

    await page.mouse.up();
    // Under 90 %-tröskeln → fjädrar tillbaka till oarmerat vänsterläge.
    await expect(handtag).toHaveAttribute('aria-checked', 'false');
    await expect(handtaget(page)).toHaveCSS('left', '0px');
  });

  test('grepp-offset: kant-grepp ger kant-följ — cirkeln hoppar inte till pekaren (K79)', async ({
    page,
  }) => {
    const handtag = switchen(page);
    await handtag.scrollIntoViewIfNeeded();
    const yta = await handtag.boundingBox();
    if (!yta) throw new Error('switchen saknar bounding box');
    const cy = yta.y + yta.height / 2;

    // Grepp 20 px HÖGER om cirkelns mitt (nära kanten) → efter flytt ska
    // cirkelns mitt ligga ~20 px VÄNSTER om pekaren (offset bevarad).
    const offset = 20;
    await page.mouse.move(yta.x + HANDTAG_PX / 2 + offset, cy);
    await page.mouse.down();
    const malX = yta.x + yta.width / 2;
    await page.mouse.move(malX, cy, { steps: 5 });
    const cirkel = await handtaget(page).boundingBox();
    await page.mouse.up();
    if (!cirkel) throw new Error('handtaget saknar bounding box');
    expect(Math.abs(cirkel.x + cirkel.width / 2 - (malX - offset))).toBeLessThan(2);
  });
});

test.describe('SlideToConfirm — facit-formen (computed-låst, K77–K82)', () => {
  test('rännan: kapselrund tonad yta utan kontur; cirkeln täcker exakt höjden (ingen inset)', async ({
    page,
  }) => {
    const handtag = switchen(page);
    const ranna = await handtag.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        radie: s.borderTopLeftRadius,
        kant: s.borderTopWidth,
        hojd: s.height,
      };
    });
    // Tonad ränna i bg-emphasized-token bär formen själv — konturen är
    // RIVEN (K78-formen: ingen border i normalläget).
    expect(ranna.bg).toBe(await resolvedTokenColor(page, '--mm-bg-emphasized'));
    expect(ranna.kant).toBe('0px');
    expect(ranna.hojd).toBe('48px');
    expect(Number.parseFloat(ranna.radie)).toBeGreaterThanOrEqual(24);

    // Cirkeln: exakt 48×48 px i rännans överkant — ingen inset (K78).
    const yta = await handtag.boundingBox();
    const cirkel = await handtaget(page).boundingBox();
    if (!yta || !cirkel) throw new Error('bounding box saknas');
    expect(Math.abs(cirkel.width - HANDTAG_PX)).toBeLessThan(0.5);
    expect(Math.abs(cirkel.height - HANDTAG_PX)).toBeLessThan(0.5);
    expect(Math.abs(cirkel.y - yta.y)).toBeLessThan(0.5);
    expect(Math.abs(cirkel.x - yta.x)).toBeLessThan(0.5);

    const cirkelForm = await handtaget(page).evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, skugga: s.boxShadow };
    });
    expect(cirkelForm.bg).toBe(await resolvedTokenColor(page, '--mm-surface'));
    expect(cirkelForm.skugga).not.toBe('none');
  });

  test('armerat läge: bock i success-token + monotext — och INGEN fyllnad (K82)', async ({
    page,
  }) => {
    const handtag = switchen(page);
    await handtag.focus();
    await page.keyboard.press(' ');
    await expect(handtag).toHaveAttribute('aria-checked', 'true');

    // Bocken i cirkeln — målets belöning (K78), i success-token (sage).
    const bock = handtaget(page).locator('svg');
    await expect(bock).toBeVisible();
    expect(await bock.evaluate((el) => getComputedStyle(el).color)).toBe(
      await resolvedTokenColor(page, '--mm-success'),
    );

    // Domänen i mono — adress-grammatiken (K81) — i det armerade textläget.
    const doman = handtag.locator('[data-slot="text"]').locator('.font-mono');
    await expect(doman).toHaveText('miranon.se');
    expect(await doman.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/mono/i);

    // K82-rivningen: INGEN grön fyllnad — rännan förblir tonad i armerat
    // läge; armad-signalen bärs av bocken + texten.
    expect(await handtag.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      await resolvedTokenColor(page, '--mm-bg-emphasized'),
    );

    // Cirkeln vilar mot högerkanten (pos 1: left = 100 % − 48 px).
    const yta = await handtag.boundingBox();
    if (!yta) throw new Error('switchen saknar bounding box');
    await expect(handtaget(page)).toHaveCSS('left', `${yta.width - HANDTAG_PX}px`);
  });

  test('print: rännan och cirkeln förblir synliga (outline ersätter bg/skugga)', async ({
    page,
  }) => {
    await page.emulateMedia({ media: 'print' });
    const handtag = switchen(page);
    await expect(handtag).toBeVisible();
    const kontur = await handtag.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(kontur).toBe('solid');
    const cirkelKontur = await handtaget(page).evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(cirkelKontur).toBe('solid');
  });

  test('prefers-contrast: more ger synlig kontur på ränna och cirkel', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' });
    const handtag = switchen(page);
    const kontur = await handtag.evaluate((el) => {
      const s = getComputedStyle(el);
      return { stil: s.outlineStyle, farg: s.outlineColor };
    });
    expect(kontur.stil).toBe('solid');
    expect(kontur.farg).toBe(await resolvedTokenColor(page, '--mm-border-strong'));
  });
});

test.describe('SlideToConfirm — plinget respekterar preferenser (AC 2)', () => {
  test('armering plingar (Web Audio observeras); avarmering plingar aldrig', async ({ page }) => {
    await stubbaWebAudio(page);
    const handtag = switchen(page);
    await handtag.focus();
    await page.keyboard.press(' ');
    await expect(handtag).toHaveAttribute('aria-checked', 'true');
    expect(await antalPling(page)).toBe(1);

    await page.keyboard.press(' ');
    await expect(handtag).toHaveAttribute('aria-checked', 'false');
    expect(await antalPling(page)).toBe(1);
  });

  test('prefers-reduced-motion: reduce → armering utan pling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stubbaWebAudio(page);
    const handtag = switchen(page);
    await handtag.focus();
    await page.keyboard.press(' ');
    await expect(handtag).toHaveAttribute('aria-checked', 'true');
    expect(await antalPling(page)).toBe(0);
  });

  test('sound={false} → armering utan pling (konsument-preferensens säte)', async ({ page }) => {
    await stubbaWebAudio(page);
    const tyst = page.locator(SEKTION).getByRole('switch', { name: 'Tyst demo utan pling' });
    // Instansen är armerad från start (defaultSelected) — cykla av → på.
    await expect(tyst).toHaveAttribute('aria-checked', 'true');
    await tyst.focus();
    await page.keyboard.press(' ');
    await expect(tyst).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press(' ');
    await expect(tyst).toHaveAttribute('aria-checked', 'true');
    expect(await antalPling(page)).toBe(0);
  });
});

test.describe('SlideToConfirm — axe-0 i båda tillstånden (AC 1)', () => {
  test('oarmerat + armerat tillstånd: 0 violations', async ({ page, checkA11y }) => {
    // Sektionen bär båda tillstånden redan vid load (huvudinstansen
    // oarmerad + tyst-instansen armerad) — skannas, armeras, skannas igen.
    await checkA11y({ include: [SEKTION] });
    const handtag = switchen(page);
    await handtag.focus();
    await page.keyboard.press(' ');
    await expect(handtag).toHaveAttribute('aria-checked', 'true');
    await checkA11y({ include: [SEKTION] });
  });
});
