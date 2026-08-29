// DocRaptor-REQUESTENS nyckel-vakt (TASK-341) — källkods-nivå, ingen nätverk.
//
// VARFÖR KÄLLKODS-NIVÅ OCH INTE ETT LIVE-ANROP: `_shared/mall-render.ts`
// importerar `Eta` från `https://esm.sh/eta@4.6.0` på sin första rad, en
// `https://`-specifikation Node/Playwright inte kan resolva
// (`ERR_UNSUPPORTED_ESM_URL_SCHEME`, samma begränsning `mall-render.test.ts`s
// filhuvud redan dokumenterar). Denna fil kan alltså inte importera modulen
// och kalla `postaTillDocRaptor` direkt — den läser i stället källkoden som
// TEXT (samma mönster som `ef-metod-vakt.test.ts` och
// `mall-render.test.ts`s källkods-nivå-tester längst ner i den filen) och
// extraherar de FAKTISKA nycklarna ur `body: JSON.stringify({ … })`.
//
// VAD GRINDEN SKYDDAR MOT: DocRaptor svarar HTTP 200 och TYST STRIPPAR en
// okänd nyckel — belagt med en `pdf_id`-probe, se
// docs/research/forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md
// § Oväntade fynd. En felstavad eller borttagen nyckel i denna fil skulle
// alltså ge grön rendering och utebliven effekt, utan ett enda fel någonstans
// — precis den tysta felklassen detta test finns för att fånga LOKALT.
//
// ALLOWLISTERNA nedan är härledda ur https://docraptor.com/documentation/api,
// verifierade WebFetch + browser-kontroll 2026-08-29 (samma disciplin som
// `_shared/mall-render.ts`s filhuvud § DOCRAPTOR-REQUEST-YTAN — läs den
// för de fulla citaten och premissavvikelsen mot fynd-kortet).

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MALL_RENDER_PATH = path.join(REPO_ROOT, 'supabase', 'functions', '_shared', 'mall-render.ts');

/** DocRaptors 19 dokumenterade TOPP-NIVÅ-parametrar (docraptor.com/documentation/api,
 *  2026-08-29). `type` och dess legacy-alias `document_type` räknas som TVÅ
 *  namn för SAMMA fält — sidan säger verbatim: "This field was previously
 *  called document_type and is still available for applications that depend
 *  on it." `prince_options` är med som CONTAINER-nyckeln (det nästlade
 *  objektet), inte som en av dess egna nycklar — se PRINCE_OPTIONS_ALLOWLIST. */
const DOCRAPTOR_TOP_LEVEL_ALLOWLIST = new Set([
  'type',
  'document_type',
  'document_content',
  'document_url',
  'name',
  'test',
  'referrer',
  'pipeline',
  'async',
  'callback_url',
  'hosted',
  'hosted_download_limit',
  'hosted_expires_at',
  'javascript',
  'ignore_console_messages',
  'ignore_resource_errors',
  'strict',
  'help',
  'tag',
  'prince_options',
]);

/** DocRaptors 32 dokumenterade `prince_options[…]`-nycklar (samma källa och
 *  datum). Framåtsäkring: `postaTillDocRaptor` skickar i dag NOLL av dessa
 *  (se testet "prince_options" nedan) — allowlisten finns här så en framtida
 *  tillägg fälls lokalt utan att denna fil behöver skrivas om. */
const DOCRAPTOR_PRINCE_OPTIONS_ALLOWLIST = new Set([
  'media',
  'version',
  'baseurl',
  'javascript',
  'max_passes',
  'no_xinclude',
  'no_network',
  'no_parallel_downloads',
  'http_user',
  'http_password',
  'http_proxy',
  'http_timeout',
  'insecure',
  'no_author_style',
  'no_default_style',
  'no_embed_fonts',
  'no_subset_fonts',
  'no_compress',
  'encrypt',
  'key_bits',
  'user_password',
  'owner_password',
  'disallow_print',
  'disallow_copy',
  'allow_copy_for_accessibility',
  'disallow_annotate',
  'disallow_modify',
  'allow_assembly',
  'input',
  'css_dpi',
  'profile',
  'pdf_title',
]);

/** Nyckelnamnen på en rad av ett objektlitteral, formen `test,` (shorthand)
 *  eller `document_type: 'pdf',` (fullständig). En rad utan `:` tolkas som
 *  shorthand-property (namnet ÄR raden). */
function extraheraNycklar(objektBody: string): string[] {
  return objektBody
    .split('\n')
    .map((rad) => rad.trim())
    .filter((rad) => rad.length > 0)
    .map((rad) => rad.replace(/,\s*$/, ''))
    .map((rad) => rad.split(':')[0]?.trim() ?? '')
    .filter((namn) => namn.length > 0);
}

const KALLKOD = readFileSync(MALL_RENDER_PATH, 'utf8');

// Matchar `body: JSON.stringify({ … })` ICKE-GIRIGT — stannar vid FÖRSTA
// `})` efter `{`. Håller så länge objektlitteralet inte själv innehåller ett
// nästlat `{…}` (sant i dag: samtliga fem värden är enkla uttryck). Ändras
// det till att bära ett nästlat objekt (t.ex. `prince_options: {…}`) måste
// denna regex bytas mot en balanserad parser — testet nedan ("postaTillDocRaptor
// bär inget nästlat objektlitteral ännu") fäller EXPLICIT om det händer, i
// stället för att tyst extrahera fel innehåll.
const BODY_RE = /body:\s*JSON\.stringify\(\{([\s\S]*?)\}\)/;

test.describe('DocRaptor-requestens nycklar (TASK-341, källkods-nivå)', () => {
  test('postaTillDocRaptor bär inget nästlat objektlitteral ännu (spärr mot att BODY_RE tyst extraherar fel innehåll)', () => {
    const matchning = KALLKOD.match(BODY_RE);
    expect(matchning, 'body: JSON.stringify({…}) hittades inte i mall-render.ts').not.toBeNull();
    const objektBody = matchning?.[1] ?? '';
    expect(
      objektBody,
      'objektlitteralet innehåller nu ett nästlat "{" — BODY_RE:s icke-giriga matchning stannar vid FÖRSTA "})" och kan därför ha extraherat fel innehåll. Byt till en balanserad parser innan detta test godkänns.',
    ).not.toContain('{');
  });

  test('postaTillDocRaptor skickar EXAKT de förväntade fem topp-nivå-nycklarna, i denna ordning', () => {
    const matchning = KALLKOD.match(BODY_RE);
    const nycklar = extraheraNycklar(matchning?.[1] ?? '');
    expect(nycklar).toEqual(['test', 'document_type', 'document_content', 'name', 'javascript']);
  });

  test('varje skickad topp-nivå-nyckel finns i DocRaptors dokumenterade referens (källa: docraptor.com/documentation/api, 2026-08-29)', () => {
    const matchning = KALLKOD.match(BODY_RE);
    const nycklar = extraheraNycklar(matchning?.[1] ?? '');
    expect(nycklar.length).toBeGreaterThan(0);
    for (const nyckel of nycklar) {
      expect(DOCRAPTOR_TOP_LEVEL_ALLOWLIST.has(nyckel), `okänd DocRaptor-nyckel: "${nyckel}"`).toBe(
        true,
      );
    }
  });

  test('en felstavad nyckel skulle INTE godkännas (självtest — bevisar att allowlisten diskriminerar)', () => {
    // Samma felklass forsknings-passet mätte: en förväntad nyckel med ETT
    // tecken bytt (dokumenterat i mängden ovan) hamnar UTANFÖR allowlisten.
    expect(DOCRAPTOR_TOP_LEVEL_ALLOWLIST.has('documnet_type')).toBe(false);
    expect(DOCRAPTOR_TOP_LEVEL_ALLOWLIST.has('docoment_content')).toBe(false);
    expect(DOCRAPTOR_PRINCE_OPTIONS_ALLOWLIST.has('http_timeot')).toBe(false);
  });

  test('prince_options: mall-render.ts skickar NOLL prince_options-nycklar i dag (mätt, bokförd frånvaro) — hittas ett block ändå prövas det mot referensen', () => {
    // Sökningen är GLOBAL i HELA källkoden (inte bara body-fångsten ovan) —
    // ett `prince_options`-block skulle kunna läggas till UTANFÖR den fångade
    // body:en (t.ex. i en helt annan funktion) och ska ändå upptäckas.
    //
    // ANKRAD TILL RADENS BÖRJAN (`^\s*prince_options:`, `m`-flagga) — INTE en
    // fri sökning var som helst i texten. En fri `/prince_options:\s*\{/`
    // matchade tidigare denna FILS EGET filhuvud (prosan beskriver kortets
    // syfte med exemplet "prince_options: { … }") och gav ett falskt fynd.
    // En riktig objekt-egenskap i denna kodbas INLEDER alltid sin trimmade
    // rad med nyckelnamnet (se t.ex. `kvitto: { html: …` i MALL_TEMPLATES
    // ovan) — kommentarsprosa gör det aldrig, den inleds med `//`.
    const princeMatchning = KALLKOD.match(/^\s*prince_options:\s*\{([\s\S]*?)\}/m);
    if (!princeMatchning) {
      // Detta ÄR det mätta, förväntade utfallet i dag (TASK-341 § filhuvud
      // "PREMISSAVVIKELSE MOT FYND-KORTET"). Explicit assertion i stället för
      // att bara returnera, så en tyst bortoptimering av kontrollen syns.
      expect(princeMatchning).toBeNull();
      return;
    }
    const nycklar = extraheraNycklar(princeMatchning[1]);
    expect(
      nycklar.length,
      'prince_options: {} hittades men objektet innehöll inga nycklar',
    ).toBeGreaterThan(0);
    for (const nyckel of nycklar) {
      expect(
        DOCRAPTOR_PRINCE_OPTIONS_ALLOWLIST.has(nyckel),
        `okänd DocRaptor prince_options-nyckel: "${nyckel}"`,
      ).toBe(true);
    }
  });
});
