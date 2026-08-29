// Självbärande-mätvakten (TASK-342) — noll externa resurs-URL:er i den HTML
// som skickas till DocRaptor, källkods-nivå, ingen nätverk.
//
// VARFÖR DENNA MÄTNING FINNS: DocRaptors `prince_options[http_timeout]`
// defaultar till 10 SEKUNDER, inte 60 som tidigare antagits — verifierat
// verbatim mot https://docraptor.com/documentation/api (WebFetch +
// browser-kontroll 2026-08-29, samma disciplin som
// `mall-render-docraptor-request.test.ts`): "By default, DocRaptor will
// attempt to fetch any external resource for up to 10 seconds." Prince
// hämtar externa resurser (typsnitt via CSS `url(...)`, bilder via
// `<img src>`) UNDER rendering — en sådan resurs som svarar långsamt eller
// inte alls skulle tysta fallera eller trunkeras inom 10 s. Mallarna är
// AVSEDDA att vara helt självbärande (ADR-125 § 4, `gorSjalvbarande` i
// `_shared/mall-render.ts`), men det var till TASK-342 INTE MÄTT — bara
// antaget.
//
// MÄTMETODEN: kopierar `_shared/mall-render.ts`s EGNA extraktions-regexer
// (CSS_URL_REGEX, IMG_SRC_REGEX) ordagrant och kör dem mot de FAKTISKA
// mall-/CSS-strängarna (importerade direkt — dessa moduler bär INGEN
// esm.sh-import, till skillnad från mall-render.ts självt, och är därför
// Node-importerbara, samma mönster som `mall-render.test.ts` redan
// etablerat). KONFIG-PARITETSNOT (samma accepterade, bokförda gräns som
// `mall-render.test.ts` § KONFIG-PARITETSNOT): en framtida ändring av
// regexerna i mall-render.ts som INTE speglas hit upptäcks inte automatiskt.
//
// MÄTT RESULTAT (2026-08-29, TASK-342 § Implementation Notes): NOLL externa
// resurs-URL:er (`url(http…)` eller `<img src="http…">`) i någon av de tre
// mallarna. Kortet är alltså en BOKFÖRD FRÅNVARO — se AC #1: "vid > 0:
// åtgärdat eller http_timeout satt med skäl" gäller inte, träffarna är 0.
// EN plaintext-förekomst av `https://miranon.se/` finns i
// bekraftelsebilaga.html.ts (en `<span class="ikonruta-bildtext">`-etikett i
// sidfoten) — den är INGEN resurs Prince hämtar (inget `href`/`src`), bara
// synlig text, och räknas därför medvetet INTE mot det http_timeout-relevanta
// måttet. Ett eget test nedan bevisar och dokumenterar just den
// klassningen, så den inte glöms bort som "en URL till" vid en framtida läsning.

import { expect, test } from '@playwright/test';
import { bekraftelsebilagaHtml } from '../../supabase/functions/_shared/mallar/bekraftelsebilaga.html';
import { bilagaDeladCss } from '../../supabase/functions/_shared/mallar/bilaga-delad.css';
import { deltagarinformationHtml } from '../../supabase/functions/_shared/mallar/deltagarinformation.html';
import { kvittoCss } from '../../supabase/functions/_shared/mallar/kvitto.css';
import { kvittoHtml } from '../../supabase/functions/_shared/mallar/kvitto.html';

// KOPIERADE ORDAGRANT ur `_shared/mall-render.ts` (CSS_URL_REGEX/IMG_SRC_REGEX)
// — se filhuvudets KONFIG-PARITETSNOT.
const CSS_URL_REGEX = /url\((['"]?)([^'")]+)\1\)/g;
const IMG_SRC_REGEX = /(<img\s+[^>]*?src=")([^"]+)(")/g;

const EXTERN_RESURS_RE = /^https?:\/\//i;

type MallSpec = { namn: string; html: string; css: string };

// SAMMA sammanslagning som MALL_TEMPLATES i mall-render.ts (bilaga-delad.css
// FÖRE kvitto.css för kvittots del).
const MALLAR: MallSpec[] = [
  { namn: 'bekraftelse', html: bekraftelsebilagaHtml, css: bilagaDeladCss },
  { namn: 'deltagarinfo', html: deltagarinformationHtml, css: bilagaDeladCss },
  { namn: 'kvitto', html: kvittoHtml, css: `${bilagaDeladCss}\n${kvittoCss}` },
];

function cssUrlTraffar(css: string): string[] {
  return [...css.matchAll(CSS_URL_REGEX)].map((m) => m[2]);
}

function imgSrcTraffar(html: string): string[] {
  return [...html.matchAll(IMG_SRC_REGEX)].map((m) => m[2]);
}

test.describe('Självbärande mallar — externa resurs-URL:er (TASK-342, källkods-nivå)', () => {
  for (const mall of MALLAR) {
    test(`${mall.namn}: noll externa (http/https) URL:er i CSS-ens url(...)`, () => {
      const traffar = cssUrlTraffar(mall.css);
      expect(
        traffar.length,
        `${mall.namn}: CSS bär ${traffar.length} url(...)-referenser totalt`,
      ).toBeGreaterThan(0);
      const externa = traffar.filter((url) => EXTERN_RESURS_RE.test(url));
      expect(
        externa,
        `${mall.namn}: externa CSS url(...)-referenser (http_timeout-exponering)`,
      ).toEqual([]);
    });

    test(`${mall.namn}: noll externa (http/https) URL:er i <img src>`, () => {
      const traffar = imgSrcTraffar(mall.html);
      const externa = traffar.filter((src) => EXTERN_RESURS_RE.test(src));
      expect(
        externa,
        `${mall.namn}: externa <img src>-referenser (http_timeout-exponering)`,
      ).toEqual([]);
    });
  }

  test('bekraftelse: den ENDA http(s)-strängen i mallen är sidfotens plaintext-etikett, inte en hämtad resurs', () => {
    // Dokumenterar och låser klassningen ovan: en förekomst finns, den är
    // AVSIKTLIGT undantagen eftersom den varken är ett url(...) eller en
    // <img src>. Hittas en TREDJE plats en http(s)-sträng dyker upp (t.ex.
    // ett nytt <a href> eller <script src>) fäller detta test — det tvingar
    // en medveten klassning i stället för att tyst godkänna en ny form.
    const alla = [...bekraftelsebilagaHtml.matchAll(/https?:\/\/[^"'\s\\)<]*/gi)].map((m) => m[0]);
    expect(alla).toEqual(['https://miranon.se/']);

    const cssTraffar = cssUrlTraffar(bilagaDeladCss);
    expect(cssTraffar.some((url) => url.includes('miranon.se'))).toBe(false);
    const imgTraffar = imgSrcTraffar(bekraftelsebilagaHtml);
    expect(imgTraffar.some((src) => src.includes('miranon.se'))).toBe(false);
  });

  test('deltagarinfo + kvitto: noll http(s)-strängar överhuvudtaget (varken resurs eller plaintext)', () => {
    expect([...deltagarinformationHtml.matchAll(/https?:\/\//gi)]).toEqual([]);
    expect([...kvittoHtml.matchAll(/https?:\/\//gi)]).toEqual([]);
    expect([...kvittoCss.matchAll(/https?:\/\//gi)]).toEqual([]);
  });

  test('självtest — en KONSTRUERAD extern URL fälls av detektorn (bevisar att den diskriminerar)', () => {
    const konstrueradCss = '@font-face { src: url("https://evil.example.com/font.ttf"); }';
    const konstrueradHtml = '<img class="logga" src="https://evil.example.com/bild.png">';
    expect(cssUrlTraffar(konstrueradCss).filter((u) => EXTERN_RESURS_RE.test(u))).toEqual([
      'https://evil.example.com/font.ttf',
    ]);
    expect(imgSrcTraffar(konstrueradHtml).filter((s) => EXTERN_RESURS_RE.test(s))).toEqual([
      'https://evil.example.com/bild.png',
    ]);
  });
});
