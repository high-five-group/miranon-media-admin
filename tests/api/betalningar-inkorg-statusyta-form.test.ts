// [TASK-362] EN statusyta, källkodsnivå — bevisar att `BetalningsInkorg.tsx`s
// kompakta, höjd-reserverade sändstatusrad renderas för VARJE
// `utfall.intent !== 'warning'`, alltså BÅDE `info` (`vantar`/`pagar`) och
// `success` (`allt-skickat`) genom SAMMA gren/nod — inte bara det tillstånd
// en enda e2e-körning råkar fånga.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR KÄLLKODSNIVÅ OCH INTE EN LIVE DOM-MÄTNING AV "PÅGÅR"
// ═══════════════════════════════════════════════════════════════════════════
// `tests/e2e/betalningar-inkorg-utskicksflode.staging.test.ts` § filhuvud
// ("MEDVETET UTANFÖR") bokför skälet i sin helhet: `useJobbstatus` pollar
// ALDRIG (`refetchOnMount: 'always'` + Postgres Realtime-push), så en
// e2e-mock kan inte hermetiskt producera en ANDRA, senare fetch att skilja
// "pågår" från "klart" med utan att fejka den riktiga Supabase Realtime-
// websocketen. Denna fil bevisar i stället den STRUKTURELLA garantin: att
// koden INTE grenar på `pagar` kontra `vantar` kontra `success` var för sig
// — den grenar EN gång, på `intent === 'warning'`, och `pagar`/`vantar` delar
// `intent: 'info'` (bevisat i `tests/api/betalningar-inkorg.test.ts`s
// "ett jobb som ARBETAR är varken lyckat eller misslyckat"). De två filerna
// TILLSAMMANS ger fullständig täckning: e2e-filen bevisar `köat` och
// `klart` LIVE, denna fil bevisar att `pågår` matematiskt MÅSTE dela
// `klart`s DOM-form eftersom koden har EN gren, inte tre.
//
// TVÅ RIKTNINGAR PER GRIND (samma disciplin som `kvitto-forhandsgranskning.
// test.ts` § filhuvud): varje kontroll prövas mot en KONSTRUERAD sträng som
// ska falla, aldrig bara mot riktig källkod som råkar vara grön.
//
// api-pure: läser filen från disk med `node:fs`, inget nätverk, inga creds.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const INKORG_KALLA = readFileSync(
  path.join(REPO_ROOT, 'src', 'components', 'betalningar', 'BetalningsInkorg.tsx'),
  'utf8',
);

/**
 * INDEX-BASERAD, INTE EN ENDA REGEX ÖVER HELA GRENEN — och det är avsiktligt.
 * Filens kommentarsblock mellan noderna är LÅNGA (flera hundra tecken,
 * ibland över tusen) och byter längd varje gång docblocket redigeras; en
 * regex med ett fast `{0,N}`-fönster blir därför en TICKANDE BOMB som fäller
 * på nästa oskyldiga kommentarsredigering, inte på en verklig regression.
 * `indexOf`-kedjan bryr sig bara om ORDNINGEN mellan markörerna, aldrig om
 * hur långt det är mellan dem.
 */
function grenarKorrekt(kalla: string): boolean {
  const villkor = kalla.indexOf("utfall.intent === 'warning' ?");
  if (villkor === -1) return false;
  const warningBox = kalla.indexOf('<MessageBox intent="warning"', villkor);
  if (warningBox === -1) return false;
  // ") : (" skiljer sant-grenen (MessageBox) från falskt-grenen (den
  // kompakta statusraden) i denna specifika ternary.
  const elseGren = kalla.indexOf(') : (', warningBox);
  if (elseGren === -1) return false;
  const statusRad = kalla.indexOf('<p', elseGren);
  if (statusRad === -1) return false;
  // `role="status"` ska stå på/nära SAMMA `<p`-nod (inom en kort räckvidd —
  // JSX-attribut ligger typiskt inom några rader från taggens öppning).
  const roleStatus = kalla.indexOf('role="status"', statusRad);
  return roleStatus !== -1 && roleStatus - statusRad < 100;
}

test('sändstatus-slotten grenar EXAKT på intent === "warning" — info/success delar samma kompakta rad', () => {
  // Den kompakta statusraden (`role="status"`, ingen `MessageBox`) MÅSTE stå
  // i den GREN som körs när `utfall.intent` INTE är `'warning'` — alltså för
  // BÅDE `'info'` (vantar/pagar) och `'success'` (allt-skickat).
  expect(grenarKorrekt(INKORG_KALLA)).toBe(true);

  // NEGATIV KONTROLL: en trasig variant som i stället grenar per KLASS
  // ('pagar' | 'vantar' | 'allt-skickat' var för sig) hade INTE matchat
  // mönstret ovan — den skulle ge tre separata `<p role="status">`-noder,
  // ingen gemensam garanti om att de delar exakt samma JSX-nod/höjd-slot.
  const trasigVariant = `
    {utfall.klass === 'allt-skickat' ? (
      <p role="status">klart</p>
    ) : utfall.klass === 'pagar' ? (
      <p role="status">pågår</p>
    ) : (
      <MessageBox intent="warning">varning</MessageBox>
    )}
  `;
  expect(grenarKorrekt(trasigVariant)).toBe(false);
});

test('warning-grenen (och bara den) använder MessageBox — kryss-regeln kan aldrig nås av info/success-raden', () => {
  // Källan ska INNEHÅLLA exakt EN plats där `intent="warning"` kopplas till
  // en `MessageBox` i sändstatus-slotten (den andra `intent="warning"`-
  // träffen i filen hör till realtidsfel-boxen, ett annat, orört block).
  const warningMessageBoxAntal = (INKORG_KALLA.match(/<MessageBox intent="warning"/g) ?? []).length;
  // Realtidsfel-boxen (oförändrad) + sändstatus-slottens warning-gren = 2.
  expect(warningMessageBoxAntal).toBe(2);

  // NEGATIV KONTROLL: en variant som (felaktigt) gav SUCCESS-utfallet en
  // `MessageBox` också hade höjt antalet till 3 — mönstret ovan hade inte
  // upptäckt den skillnaden på egen hand, så den prövas explicit här.
  const trasigKalla = `${INKORG_KALLA}\n<MessageBox intent="warning" title="extra">x</MessageBox>`;
  const trasigtAntal = (trasigKalla.match(/<MessageBox intent="warning"/g) ?? []).length;
  expect(trasigtAntal).not.toBe(warningMessageBoxAntal);
  expect(trasigtAntal).toBe(3);
});

test('sändstatus-slotten reserverar min-h-10 — samma höjd som Button size="md" (Button.tsx)', () => {
  expect(INKORG_KALLA).toMatch(/flex min-h-10 flex-col justify-center gap-2/);

  const BUTTON_KALLA = readFileSync(
    path.join(REPO_ROOT, 'src', 'components', 'primitives', 'Button.tsx'),
    'utf8',
  );
  // Källan för husets DEFAULT-knappstorlek ('md') ska bära SAMMA `min-h-10`
  // — annars är "matchar knappens egen höjd" ett obelagt påstående i
  // BetalningsInkorg.tsx:s egen kommentar.
  expect(BUTTON_KALLA).toMatch(/md:\s*'min-h-10/);

  // NEGATIV KONTROLL: en slot utan reserverad höjd (bara `flex flex-col
  // gap-2`, ingen `min-h-*`) hade INTE matchat första mönstret.
  const trasigVariant = 'flex flex-col gap-2';
  expect(trasigVariant).not.toMatch(/flex min-h-10 flex-col justify-center gap-2/);
});
