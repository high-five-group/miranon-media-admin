// Spegel-budskapets ikon-vakt — AlertTriangle förbjuden (TASK-475 runda 2,
// granskningsfynd 1).
//
// KONTRAKTET: ingen fil under src/components/betalningar/** (utom dev-only-
// prototyperna, se UNDANTAGNA_KATALOGER) får bära en `<AlertTriangle`-JSX-tagg
// i närheten av spegel-eftersläpningens budskapstext ("... hunnit
// uppdateras ..."). Marcus underkände just den kopplingen på PR #2541
// ordagrant: "Ser bra ut, men vad betyder 'Basen släpar'? Den texten kan vi
// inte visa för användaren (Lotta)." — SpegelSlaparBesked.tsx:s docblock
// dokumenterar VARFÖR: `AlertTriangle`/`TriangleAlert` är husets
// VARNINGSSIGNAL, och spegeleftersläpningen löser sig alltid själv. TASK-475
// runda 1 bytte ikon i BetalningsInkorg.tsx/events/detail/Betalningar.tsx men
// missade InbetalningsLista.tsx — granskningens runda 1-fynd 1 fångade den
// enda kvarvarande instansen. Detta test är den permanenta vakten mot att
// samma glidning händer igen, i den filen eller en framtida.
//
// KÄLLTEXT, INTE RENDERING: modulen som bär meningen (InbetalningsLista.tsx)
// är React-JSX utan en RTL/vitest-rigg i repot (allt annat rendering-bevis
// går via Playwright-e2e mot staging eller hermetiskt mockad browser). En
// källtexts-vakt körs i api-pure — creds-fri, ingen browser, samma mönster
// som tests/api/ef-metod-vakt.test.ts (405-vakten) och
// tests/api/mutation-hemvist-vakt.test.ts.
//
// VARFÖR "<AlertTriangle" (MED VINKELPARENTES) OCH INTE BARA "AlertTriangle":
// SpegelSlaparBesked.tsx:s EGEN docblock nämner ordet "AlertTriangle" tre
// gånger i PROSA (bakåtcitationstecken-citerat, `AlertTriangle`) för att
// FÖRKLARA varför ikonen INTE används — en bar substrängs-sökning på ordet
// hade fällt den filen på sin egen dokumentation. Ingen av house-konventionens
// docblock-citat skriver identifieraren med en föregående vinkelparentes
// (`<AlertTriangle`), så den formen träffar bara faktisk JSX-användning.
//
// VARFÖR ETT FÖNSTER OCH INTE "FILEN INNEHÅLLER BÅDA STRÄNGARNA NÅGONSTANS":
// en fil-nivå-kontroll är för grov — en fil skulle kunna bära AlertTriangle
// för ett HELT ANNAT syfte (en riktig varning, någon annanstans i samma fil)
// och separat råka nämna spegel-budskapet, utan att de två hör ihop. Fyndet
// gäller KOPPLINGEN (ikonen SOM HÖR TILL just detta budskap), inte
// samexistens i samma fil.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BETALNINGAR_DIR = path.join(REPO_ROOT, 'src', 'components', 'betalningar');

// Spegel-budskapets markörtext — gemensam för alla fyra kända konsumenter
// (SpegelSlaparBesked.tsx, InbetalningsLista.tsx, RegistreraForm.tsx,
// AterbetalningsForm.tsx), oavsett vilken exakt mening som omger den.
const SPEGEL_MARKER = 'hunnit uppdateras';

// JSX-formen en faktisk ikon-användning bär. Vinkelparentesen är avsiktlig —
// se filhuvudets "VARFÖR" ovan.
const IKON_TRAFF = '<AlertTriangle';

// Fönstret BAKÅT från markören där en ikon som hör till SAMMA rad/mening kan
// stå (JSX-ikoner står före sin text). Uppmätt avstånd i den brutna formen
// (InbetalningsLista.tsx, före denna runda): `<AlertTriangle .../>` till
// ordet "hunnit" var ~110 tecken. 400 ger bred marginal utan att bli så stort
// att det börjar läsa in grannstycken.
const IKON_FONSTER = 400;

// Kataloger som INTE räknas: dev-only-prototyper bakom
// `import.meta.env.DEV`, aldrig Lottas yta (samma undantag TASK-475 runda 1:s
// ordsvep gjorde, se PR #2576 § Ordsvepet § Medvetet ORÖRDA).
const UNDANTAGNA_KATALOGER = new Set(['prototype', 'dev']);

/** Samlar in .tsx-filer rekursivt under `dir`, exkl. undantagna underkataloger. */
function samlaTsxFiler(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (UNDANTAGNA_KATALOGER.has(entry.name)) continue;
      samlaTsxFiler(path.join(dir, entry.name), acc);
    } else if (entry.name.endsWith('.tsx')) {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
}

/**
 * Hittar varje förekomst av `<AlertTriangle` inom `fonster` tecken FÖRE en
 * spegel-budskaps-markör i `source`. Returnerar textsnutten kring varje
 * träff, för felmeddelandet.
 */
function hittaAlertTriangleNaraSpegelBudskap(source: string, fonster: number): string[] {
  const traffar: string[] = [];
  let fran = 0;
  for (;;) {
    const idx = source.indexOf(SPEGEL_MARKER, fran);
    if (idx === -1) break;
    const fonsterStart = Math.max(0, idx - fonster);
    const fore = source.slice(fonsterStart, idx);
    if (fore.includes(IKON_TRAFF)) {
      traffar.push(source.slice(fonsterStart, idx + SPEGEL_MARKER.length));
    }
    fran = idx + SPEGEL_MARKER.length;
  }
  return traffar;
}

test.describe('Spegel-budskapets ikon-vakt — AlertTriangle förbjuden (TASK-475 runda 2)', () => {
  // FAIL-CLOSED: vakten är meningslös om marköranssträngen aldrig hittas —
  // ett villkor som aldrig kan fälla är tyst grönt av fel skäl (samma
  // disciplin som ef-metod-vaktens "allowlisten är läst och icke-tom").
  test('spegel-budskapets markörtext finns i minst en fil under src/components/betalningar/**', () => {
    const filer = samlaTsxFiler(BETALNINGAR_DIR);
    const barare = filer.filter((f) => readFileSync(f, 'utf8').includes(SPEGEL_MARKER));
    expect(
      barare.length,
      'ingen fil under src/components/betalningar/** bär spegel-budskapets markörtext — vakten kan aldrig fälla i detta läge',
    ).toBeGreaterThan(0);
  });

  // NEGATIV KONTROLL 1: bevisar att matchningslogiken FAKTISKT fäller ett
  // trasigt fall — oberoende av vad som råkar stå i src/ just nu.
  test('matchningen fäller en syntetisk trasig sträng (AlertTriangle nära budskapet)', () => {
    const trasig = `<AlertTriangle aria-hidden size={13} className="shrink-0" />\n{\`Databasen har inte ${SPEGEL_MARKER} än.\`}`;
    expect(hittaAlertTriangleNaraSpegelBudskap(trasig, IKON_FONSTER)).toHaveLength(1);
  });

  // NEGATIV KONTROLL 2: en giltig (Hourglass/SpegelSlaparIkon) sträng ska
  // INTE fällas — annars är vakten inte bara sträng, den är fel.
  test('matchningen är tyst för en giltig sträng (SpegelSlaparIkon)', () => {
    const giltig = `<SpegelSlaparIkon size={13} />\n{\`Databasen har inte ${SPEGEL_MARKER} än.\`}`;
    expect(hittaAlertTriangleNaraSpegelBudskap(giltig, IKON_FONSTER)).toHaveLength(0);
  });

  // NEGATIV KONTROLL 3: en docblock-PROSA-mention av identifieraren
  // (bakåtcitationstecken, ingen vinkelparentes) ska INTE fällas — annars
  // fäller vakten på sin egen dokumentation, exakt SpegelSlaparBesked.tsx:s
  // situation.
  test('matchningen är tyst för en prosa-mention utan vinkelparentes', () => {
    const prosa = `VARFÖR \`Hourglass\` OCH INTE \`AlertTriangle\`\n... budskapet ${SPEGEL_MARKER} ...`;
    expect(hittaAlertTriangleNaraSpegelBudskap(prosa, IKON_FONSTER)).toHaveLength(0);
  });

  for (const fil of samlaTsxFiler(BETALNINGAR_DIR)) {
    const relativ = path.relative(REPO_ROOT, fil);
    test(`${relativ}: AlertTriangle förekommer inte nära spegel-budskapet`, () => {
      const source = readFileSync(fil, 'utf8');
      const traffar = hittaAlertTriangleNaraSpegelBudskap(source, IKON_FONSTER);
      expect(
        traffar,
        `${relativ} bär <AlertTriangle inom ${IKON_FONSTER} tecken före spegel-budskapets markörtext ("${SPEGEL_MARKER}"):\n${traffar.join('\n---\n')}`,
      ).toHaveLength(0);
    });
  }
});
