// @ts-nocheck — Deno Edge Function shared module (esm.sh-import +
// Deno-globaler; typas vid deploy av `deno check`/`deno lint`, se ADR-010
// § Fas 7-åtagande). Samma undantags-mönster som övriga esm.sh-
// konsumerande `_shared`-filer.
//
// renderaMallPdf — TASK-309.4, ADR-125 § Beslut 4. Renderaren i EF-lagret:
// bundlade mallfiler (genererade TS-strängmoduler, se
// `scripts/synka-bilagemallar.mjs` + `scripts/check-mallparitet.sh`) fylls
// med Eta, görs självbärande UTAN DOM (Deno saknar `DOMParser`,
// research-passet `mallar-server-side-docraptor-prod-2026-08-23.md`
// § Delfråga 3), och skickas till DocRaptor.
//
// MINIMALTEST-DISCIPLIN (Tier-not, TASK-309.4): Eta via
// `https://esm.sh/eta@4.6.0` deployades och kördes SKARPT i en kastbar EF
// mot staging (autoEscape + villkorlig blockborttagning + loop, samtliga
// verifierade) innan denna fil byggdes — se skivans slutrapport för
// utfallet. Samma version pinnad här och i `package.json`s `eta`-
// devDependency (Node-testbar via `tests/api/mall-render.test.ts`, som
// importerar den EGNA `eta`-modulen ur node_modules, inte denna fil — en
// `https://`-import kan inte resolvas av Node/Playwright).
//
// EN RENDERARE, TRE MALLAR (`MallNamn`): `generate-event-attachment/
// index.ts` anropar denna funktion för 'bekraftelse' och 'deltagarinfo'.
// Kvittots renderingsväg ('kvitto', ADR-125 § Beslut 5) TILLKOM I
// TASK-309.5: `preview-receipt/index.ts` och `send-receipt-email/
// index.ts` anropar den nu i stället för det gamla pdf-lib-baserade
// `_shared/receipt-pdf.ts` (RIVET, TASK-309.5). Ifyllnadsdatan byggs av
// `_shared/mall-data.ts`s `byggKvittoData`, som ÅTERANVÄNDER
// `_shared/receipt-content.ts`s rena hjälpfunktioner (beraknaMoms/
// formatBelopp/formatKvittoDatum/kvittoBenamning/MIRANON_ORG) men bygger
// en STRUKTURERAD Eta-data-form, inte en textrad-lista.
//
// KVITTO-MALLEN BÄR TVÅ `<link rel="stylesheet">`-TAGGAR (`bilaga-delad.css`
// + `kvitto.css` — se docs/mallar/bilagor/kvitto.css § filhuvud för VARFÖR
// en egen CSS-fil i stället för att lägga posterna i bilaga-delad.css).
// `MALL_TEMPLATES.kvitto.css` nedan är de TVÅ källornas SAMMANSLAGNA
// innehåll (samma cascade-ordning som mallens egna två `<link>`-taggar:
// delad CSS/@font-face FÖRE kvittots egna regler) — och `gorSjalvbarande`
// nedan är skriven om till att hantera GODTYCKLIGT MÅNGA `<link>`-taggar
// (tidigare bara EN, se den funktionens egen docstring för detaljen).
//
// SJÄLVBÄRANDE UTAN DOM — regex-baserad, portering av `<link>`/`url()`-
// inlinings-BETEENDET ur `scripts/docraptor-sjalvbarande.mjs`
// (Node/fs-baserad) och `src/components/dokument/prototyp/sjalvbarande.ts`
// (klient/DOM-baserad) till en tredje form utan filsystem OCH utan DOM:
// varje `url(...)`-referens i den delade CSS:en slås upp mot en
// FÖRUTBESTÄMD tabell av redan bundlade typsnitts-base64-strängar (samma
// FAIL-SAFE-princip som klientens `inlinaCssUrls` — Cavolini saknas
// alltid här, faller till `local("")`, aldrig ett kastat fel); varje
// `<img src>` slås upp mot en tabell av redan bundlade bild-data-URI:er
// (HÅRT fel om en bild saknar en genererad modul — samma asymmetri som
// klientens `inlinaBilder`: en font som faller tillbaka ger ett annat
// typsnitt, en bild som inte kan hämtas ger ett hål i dokumentet).
//
// ADR-125 § BESLUT 4 OMFATTAR ÄVEN LOGGA/IKON-BILDERNA, TROTS ATT DEN
// EGNA TEXTEN BARA NÄMNER HTML/CSS/TYPSNITT: `bekraftelsebilaga.html`/
// `deltagarinformation.html` refererar fyra `public/…`-bilder
// (logga, Instagram-ikon, bokomslag, globe-ikon) som annars vore ONÅBARA
// för en Deno Edge Function (ingen `public/`-mapp i bundlet, inget
// nätverk mot appens egen domän konfigurerat). Bokfört som ett upptäckt,
// löst gap — inte en tyst utvidgning: `scripts/synka-bilagemallar.mjs`
// AUTO-UPPTÄCKER varje `<img src="../../../public/…">`-referens och
// bäddar in den, samma mönster som typsnitten. [TASK-309.5] `kvitto.html`
// refererar EN av de FYRA (loggan, `miranon-media-ordmarke-original.svg`)
// — redan i `BILD_DATA_URI_PER_FILNAMN` sedan skiva 3, ingen ny
// bild-modul behövdes för kvitto-kopplingen.
//
// DOCRAPTOR: synkront anrop (60 s-tak, se research-passet § Delfråga 2 —
// våra dokument mäter ~3 s), EN retry på 5xx/timeout (aldrig 4xx — en
// ogiltig payload retryas inte till ett annat resultat). `test`-flaggan
// är ETT PARAMETER TILL FUNKTIONEN, INTE en intern `ENVIRONMENT`-läsning
// här — anroparen (`generate-event-attachment/index.ts`) härleder den ur
// `Deno.env.get('ENVIRONMENT') !== 'production'`, SAMMA fail-closed-
// mönster `send-receipt-email/index.ts` (`isProd`) redan etablerat, så
// mall-render.ts förblir en REN funktion av sina argument (testbar utan
// att mocka miljövariabler).

import { Eta } from 'https://esm.sh/eta@4.6.0';
import { HttpError } from './errors.ts';
import { carlitoBoldFontBase64 } from './mallar/Carlito-Bold.font.ts';
import { carlitoBoldItalicFontBase64 } from './mallar/Carlito-BoldItalic.font.ts';
import { carlitoItalicFontBase64 } from './mallar/Carlito-Italic.font.ts';
import { carlitoRegularFontBase64 } from './mallar/Carlito-Regular.font.ts';
import { comicNeueBoldFontBase64 } from './mallar/ComicNeue-Bold.font.ts';
import { selawikBoldFontBase64 } from './mallar/Selawik-Bold.font.ts';
import { bekraftelsebilagaHtml } from './mallar/bekraftelsebilaga.html.ts';
import { bilagaDeladCss } from './mallar/bilaga-delad.css.ts';
import { deltagarinformationHtml } from './mallar/deltagarinformation.html.ts';
import { globeOutlinedImageDataUri } from './mallar/globe-outlined.image.ts';
import { instagramGlyfGradientImageDataUri } from './mallar/instagram-glyf-gradient.image.ts';
import { kvittoCss } from './mallar/kvitto.css.ts';
import { kvittoHtml } from './mallar/kvitto.html.ts';
import { miranonMediaOrdmarkeOriginalImageDataUri } from './mallar/miranon-media-ordmarke-original.image.ts';
import { utanforVerklighetenOmslagImageDataUri } from './mallar/utanfor-verkligheten-omslag.image.ts';

export type MallNamn = 'bekraftelse' | 'deltagarinfo' | 'kvitto';

const MALL_TEMPLATES: Record<MallNamn, { html: string; css: string }> = {
  bekraftelse: { html: bekraftelsebilagaHtml, css: bilagaDeladCss },
  deltagarinfo: { html: deltagarinformationHtml, css: bilagaDeladCss },
  // Sammanslagen CSS, SAMMA ordning som mallens egna två <link>-taggar
  // (bilaga-delad.css FÖRE kvitto.css) — se filhuvudet.
  kvitto: { html: kvittoHtml, css: `${bilagaDeladCss}\n${kvittoCss}` },
};

// De sex FRIA typsnittsfilerna (Cavolini bundlas ALDRIG — gitignorerad
// licens, se docs/mallar/bilagor/README.md § Fontstrategin). Nyckeln är
// filnamnet SÅ SOM det står i CSS:ens `url(...)`, inte exportnamnet.
const FONT_BASE64_PER_FILNAMN: Record<string, string> = {
  'Carlito-Regular.ttf': carlitoRegularFontBase64,
  'Carlito-Bold.ttf': carlitoBoldFontBase64,
  'Carlito-Italic.ttf': carlitoItalicFontBase64,
  'Carlito-BoldItalic.ttf': carlitoBoldItalicFontBase64,
  'ComicNeue-Bold.ttf': comicNeueBoldFontBase64,
  'Selawik-Bold.ttf': selawikBoldFontBase64,
};

// Bilderna mallarna refererar via `<img src="../../../public/…">` — se
// filhuvudets ADR-125-gap-not.
const BILD_DATA_URI_PER_FILNAMN: Record<string, string> = {
  'miranon-media-ordmarke-original.svg': miranonMediaOrdmarkeOriginalImageDataUri,
  'instagram-glyf-gradient.png': instagramGlyfGradientImageDataUri,
  'globe-outlined.svg': globeOutlinedImageDataUri,
  'utanfor-verkligheten-omslag.jpeg': utanforVerklighetenOmslagImageDataUri,
};

const CSS_URL_REGEX = /url\((['"]?)([^'")]+)\1\)/g;

/** Ersätter varje `url(...)` i CSS:en med en `data:`-URI. FAIL-SAFE (se
 *  filhuvudet): ett typsnitt utan en genererad modul (Cavolini) faller
 *  till `local("")`, aldrig ett kastat fel. */
function inlinaCssUrls(css: string): string {
  return css.replace(CSS_URL_REGEX, (heltMatch, _quote, rawPath) => {
    if (rawPath.startsWith('data:')) return heltMatch;
    const filnamn = rawPath.split('/').pop() ?? '';
    const base64 = FONT_BASE64_PER_FILNAMN[filnamn];
    if (!base64) return 'local("")';
    return `url("data:font/ttf;base64,${base64}")`;
  });
}

const IMG_SRC_REGEX = /(<img\s+[^>]*?src=")([^"]+)(")/g;

/** Ersätter varje `<img src="...">` med en `data:`-URI. HÅRT fel (se
 *  filhuvudet) — en bild utan en genererad modul är ett buggat bygge,
 *  inte ett förväntat runtime-läge. */
function inlinaBilder(html: string): string {
  return html.replace(IMG_SRC_REGEX, (heltMatch, pre, src, post) => {
    if (src.startsWith('data:')) return heltMatch;
    const filnamn = src.split('/').pop() ?? '';
    const dataUri = BILD_DATA_URI_PER_FILNAMN[filnamn];
    if (!dataUri) {
      throw new Error(`Bilden kunde inte bäddas in (ingen genererad modul för "${filnamn}"): ${src}`);
    }
    return `${pre}${dataUri}${post}`;
  });
}

// GLOBAL (`g`) sedan TASK-309.5 — kvitto.html bär TVÅ `<link
// rel="stylesheet">`-taggar (bekraftelse/deltagarinfo bär bara EN, se
// filhuvudet). Utan `g` hade `.replace()` bara ersatt den FÖRSTA och
// lämnat den ANDRA kvar som en obrukbar relativ referens i den
// självbärande HTML:en (DocRaptor får aldrig ett filsystem att slå upp
// den mot) — mätt som en verklig bugg under denna skivas bygge, se
// `gorSjalvbarande` nedan för fixen.
const LINK_STYLESHEET_REGEX = /<link\s+rel="stylesheet"\s+href="[^"]+"\s*\/?>/g;

/** `<link rel="stylesheet">` → `<style>…</style>` (CSS:en inlinad, dess
 *  egna `url()`-referenser redan bäddade in) + varje `<img>` inbäddad.
 *  Hanterar GODTYCKLIGT MÅNGA `<link>`-taggar (kvitto.html bär två, se
 *  filhuvudet): den FÖRSTA träffen ersätts med style-blocket (som redan
 *  bär BÅDA/ALLA källornas sammanslagna CSS, se `MALL_TEMPLATES`), varje
 *  EFTERFÖLJANDE `<link>` tas bort helt i stället för att lämnas kvar. */
function gorSjalvbarande(ifylldHtml: string, css: string): string {
  const inlinadCss = inlinaCssUrls(css);
  let styleInjicerad = false;
  const medInlinadStil = ifylldHtml.replace(LINK_STYLESHEET_REGEX, () => {
    if (styleInjicerad) return '';
    styleInjicerad = true;
    return `<style>\n${inlinadCss}\n</style>`;
  });
  return inlinaBilder(medInlinadStil);
}

// EN Eta-instans, delad mellan alla anrop — `autoEscape: true` är den
// disciplin research-passet (§ Delfråga 4) kräver: `<%= %>` (aldrig
// `<%~ %>`) på VARJE fält som ytterst härstammar från Airtable-fritext.
// `varName: 'data'` matchar mallarnas egen `<%= data.x %>`-syntax.
const eta = new Eta({ autoEscape: true, varName: 'data' });

/** Fyller mallen med Eta och gör resultatet självbärande. Ren funktion,
 *  inget nätverk — den halva `renderaMallPdf` kallar innan DocRaptor. */
export function fyllOchGorSjalvbarande(mall: MallNamn, data: Record<string, unknown>): string {
  const { html, css } = MALL_TEMPLATES[mall];
  const ifylld = eta.renderString(html, data) as string;
  return gorSjalvbarande(ifylld, css);
}

const DOCRAPTOR_URL_BAS = 'https://api.docraptor.com/docs';
const DOCRAPTOR_TIMEOUT_MS = 30_000;

async function postaTillDocRaptor(
  apiKey: string,
  html: string,
  namn: string,
  test: boolean,
): Promise<Uint8Array> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOCRAPTOR_TIMEOUT_MS);
  try {
    const response = await fetch(`https://${apiKey}@api.docraptor.com/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test,
        document_type: 'pdf',
        document_content: html,
        name: namn,
        javascript: false,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const feltext = await response.text().catch(() => '');
      throw new HttpError(
        response.status >= 500 ? 502 : response.status,
        `DocRaptor svarade ${response.status}: ${feltext.slice(0, 500)}`,
      );
    }
    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof HttpError) throw error;
    const isAbort = error instanceof Error && error.name === 'AbortError';
    throw new HttpError(
      isAbort ? 504 : 502,
      isAbort
        ? `DocRaptor svarade inte inom ${DOCRAPTOR_TIMEOUT_MS} ms (timeout)`
        : `Nätverksfel mot DocRaptor: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 5xx eller timeout (504) — de ENDA felklasser som retryas (aldrig 4xx). */
function arRetrybart(error: unknown): boolean {
  return error instanceof HttpError && (error.status === 504 || error.status >= 500);
}

export interface RenderaMallPdfOpts {
  /** DocRaptor-nyckeln (secret). */
  apiKey: string;
  /** `Deno.env.get('ENVIRONMENT') !== 'production'` — se filhuvudet för varför anroparen äger denna härledning. */
  test: boolean;
  /** Dokumentets namn i DocRaptors loggar/kvitto. */
  namn: string;
}

/**
 * Renderar `mall` med `data` (Eta, autoEscape) → självbärande HTML →
 * DocRaptor → PDF-bytes. EN retry på 5xx/timeout, aldrig på 4xx.
 */
export async function renderaMallPdf(
  mall: MallNamn,
  data: Record<string, unknown>,
  opts: RenderaMallPdfOpts,
): Promise<Uint8Array> {
  const html = fyllOchGorSjalvbarande(mall, data);
  try {
    return await postaTillDocRaptor(opts.apiKey, html, opts.namn, opts.test);
  } catch (error) {
    if (!arRetrybart(error)) throw error;
    return await postaTillDocRaptor(opts.apiKey, html, opts.namn, opts.test);
  }
}
