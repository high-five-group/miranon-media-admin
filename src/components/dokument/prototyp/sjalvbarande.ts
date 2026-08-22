/**
 * sjalvbarande.ts — gör prototypens renderade bilage-HTML SJÄLVBÄRANDE inför
 * ett DocRaptor-anrop (S108 MARCUS-SEKVENS punkt 3, `ADR-119` beslut 7).
 *
 * VARFÖR SJÄLVBÄRANDE: DocRaptor renderar i sitt EGET nät. Allt HTML:en
 * pekar på med en relativ sökväg — stilmall, typsnitt, bilder — är för
 * DocRaptor en adress som inte finns. Motorn har därmed exakt två val
 * (`scripts/docraptor-sjalvbarande.mjs` § filhuvud): en publik bas-URL
 * (`prince_options.baseurl`, kräver att mallfilerna är nåbara via HTTP
 * utifrån — de ligger på `localhost` i dev och är det aldrig), eller en helt
 * självbärande HTML-sträng utan en enda extern hämtning. Det senare är valt,
 * av samma skäl som minimaltestet valde det: deterministiskt, inga CORS-
 * eller publik-URL-beroenden, identiskt oavsett var anropet görs ifrån.
 *
 * VARFÖR EN EGEN IMPLEMENTATION OCH INTE DELAD KOD MED
 * `scripts/docraptor-sjalvbarande.mjs`: paus-handoffens formulering var
 * "dela logik med" skriptet. Den vägen prövades och valdes bort med öppna
 * ögon. Skriptet är ren Node — det läser `fs` mot disk och bor i `scripts/`
 * utanför `src/`. Att dela transformationen hade krävt att den görs
 * I/O-agnostisk (en injicerad `las(sökväg)`), alltså en abstraktion mellan
 * exakt två konsumenter: ett mätskript och en PROTOTYP vars browser-väg
 * enligt `GenereringsPrototyp.tsx` rad ~575 "inte finns alls" i skarp drift
 * (`ADR-119` renderar server-side). Bron hade byggts mellan två ytor som
 * båda försvinner. Det som däremot ÄR delat, och som är det som betyder
 * något, är BETEENDET: samma url()/img-ersättning, samma MIME-tabell, och
 * medvetet samma fail-safe-asymmetri (se `inlinaCssUrls` respektive
 * `inlinaBilder` nedan) som redan är mätt mot DocRaptor i minimaltestet.
 * Avviker de två någon gång är det ett fynd, inte en tyst divergens —
 * därför står skälet skrivet här och inte bara i ett commit-meddelande.
 *
 * STORLEK, MÄTT (2026-08-22, `node scripts/docraptor-sjalvbarande.mjs`):
 * bekräftelsebilagan blir **4 302 445 bytes** självbärande, kvittot
 * **3 998 291 bytes** — nästan allt är de sju typsnittsfilerna (2 951 304
 * bytes råa, +33 % som base64). Minimaltestet postade samma storleksklass
 * genom `test-docraptor-render` och fick svar på ~3 s, så gränsen håller —
 * men typsnitts-subsettning är den uppenbara optimeringen den dag detta
 * blir skarp väg, och den är MEDVETET inte gjord här (prototypen ska bevisa
 * formen, inte prestandan).
 */

/**
 * MIME härleds ur FILÄNDELSEN, aldrig ur svarets `Content-Type`. Vites
 * dev-server svarar för `.ttf` med en generisk typ, och ett felaktigt
 * MIME i en `data:`-URI gör att renderaren tyst hoppar över typsnittet —
 * exakt den klass av fel som bara syns som "fel font i PDF:en".
 * Tabellen är avsiktligt identisk med skriptets `MIME_PER_EXT`.
 */
const MIME_PER_EXT: Record<string, string> = {
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

function mimeFor(sokvag: string): string {
  const utanFraga = sokvag.split(/[?#]/)[0];
  const ext = utanFraga.split('.').pop()?.toLowerCase() ?? '';
  return MIME_PER_EXT[ext] ?? 'application/octet-stream';
}

/**
 * Hämtar en resurs och returnerar den som `data:`-URI.
 *
 * `FileReader.readAsDataURL` gör base64-kodningen, INTE `btoa` +
 * `String.fromCharCode(...bytes)`: spread-formen spränger anropsstacken på
 * filer i den här storleksklassen (Carlito-BoldItalic är 808 508 bytes), och
 * en chunkad btoa-loop hade varit egen kod att underhålla för något
 * plattformen redan gör. MIME sätts av OSS via en ny `Blob` — se
 * `MIME_PER_EXT` ovan för varför svarets egen typ inte duger.
 */
async function tillDataUri(absUrl: string): Promise<string> {
  const svar = await fetch(absUrl);
  if (!svar.ok) throw new Error(`${svar.status}`);
  const bytes = await svar.arrayBuffer();
  const blob = new Blob([bytes], { type: mimeFor(absUrl) });
  return await new Promise<string>((klar, fel) => {
    const lasare = new FileReader();
    lasare.onload = () => klar(lasare.result as string);
    lasare.onerror = () => fel(new Error('kunde inte base64-kodas'));
    lasare.readAsDataURL(blob);
  });
}

const CSS_URL_REGEX = /url\((['"]?)([^'")]+)\1\)/g;

/**
 * Ersätter varje `url(...)` i en CSS-textmassa med en `data:`-URI.
 *
 * EN OHÄMTBAR REFERENS NEUTRALISERAS — den lämnas ALDRIG orörd. Detta är
 * fixen efter en mätt 422 (2026-08-22, första skarpkörningen): DocRaptor
 * svarade `File system access is not allowed` och renderade ingenting alls.
 * Orsaken var att en orörd `url()` INTE är neutral mot en server-renderare.
 * Skriptets fail-safe (`docraptor-sjalvbarande.mjs` § `inlinaCssUrls`)
 * lämnar sådana orörda, och motiverar det med att "CSS:ens egen
 * fallback-stack tar över" — det stämmer i en WEBBLÄSARE, som tyst ger upp
 * på en 404. Prince/DocRaptor gör tvärtom: en relativ eller `/@fs/`-väg
 * läses som ett försök att nå renderarens filsystem, och HELA jobbet fälls.
 * Samma rad kod, motsatt utfall i de två miljöerna.
 *
 * `local("")` är ersättningen: CSS Fonts 4 låter `local()` peka ut ett
 * installerat typsnitt, och det tomma namnet matchar per definition inget.
 * `@font-face`-regeln blir därmed verkningslös utan att någonsin nämna en
 * adress — vilket är precis vad vi vill, och exakt vad
 * `bilaga-delad.css` § FONTSTRATEGIN redan beskriver som AVSETT beteende för
 * Cavolini: filen får aldrig committas (licensen tillåter inbäddning i
 * dokument, inte distribution av filen), den nås via en git-ignorerad
 * symlänk, och "saknas symlänken laddar @font-face för Cavolini aldrig —
 * CSS font-family-stacken faller då till Comic Neue automatiskt, vilket är
 * AVSIKTLIGT". Vites dev-server skriver dessutom om just den sökvägen till
 * `/@fs/…` och nekar den sedan med 403, så fallet är regel här, inte undantag.
 *
 * Varje neutraliserad referens returneras ändå i `saknade`, så ytan kan säga
 * rakt ut vilket typsnitt som ersattes i stället för att leverera en PDF med
 * fel typsnitt som ingen upptäcker.
 */
async function inlinaCssUrls(
  css: string,
  basUrl: string,
): Promise<{ css: string; saknade: string[] }> {
  const unika = new Map<string, string>();
  for (const [hel, , rawPath] of css.matchAll(CSS_URL_REGEX)) {
    if (rawPath.startsWith('data:')) continue;
    if (!unika.has(hel)) unika.set(hel, rawPath);
  }

  const saknade: string[] = [];
  const ersattningar = await Promise.all(
    [...unika].map(async ([hel, rawPath]) => {
      try {
        const dataUri = await tillDataUri(new URL(rawPath, basUrl).href);
        return { hel, ersattning: `url("${dataUri}")` };
      } catch {
        saknade.push(rawPath);
        return { hel, ersattning: 'local("")' };
      }
    }),
  );

  let ut = css;
  for (const post of ersattningar) {
    if (post) ut = ut.split(post.hel).join(post.ersattning);
  }
  return { css: ut, saknade };
}

/**
 * Ersätter varje `<img src>` med en `data:`-URI.
 *
 * HÅRT FEL här, till skillnad från CSS:en ovan — samma asymmetri som
 * skriptet gör, och av samma skäl: en font som faller tillbaka ger ett
 * dokument som ser lite annorlunda ut, medan en bild som inte kan hämtas ger
 * ett dokument med ett HÅL där loggan skulle stå. Det andra ska aldrig
 * levereras tyst som en färdig förhandsgranskning.
 */
async function inlinaBilder(doc: Document, basUrl: string): Promise<void> {
  await Promise.all(
    [...doc.querySelectorAll('img')].map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      try {
        img.setAttribute('src', await tillDataUri(new URL(src, basUrl).href));
      } catch (e) {
        throw new Error(
          `Bilden ${src} kunde inte bäddas in (${e instanceof Error ? e.message : 'okänt fel'}).`,
        );
      }
    }),
  );
}

export type SjalvbarandeResultat = {
  /** Fullständig HTML-sträng utan en enda extern hämtning. */
  html: string;
  /** CSS-referenser som lämnades orörda (se `inlinaCssUrls` § FAIL-SAFE). */
  saknade: string[];
};

/**
 * Tar prototypens redan renderade HTML (se `renderaDokument` i
 * `GenereringsPrototyp.tsx`) och gör den självbärande.
 *
 * Adresser löses mot dokumentets egen `<base>` — den som `renderaDokument`
 * lägger in för att peka på mallkatalogen. Taggen tas bort på vägen ut:
 * när ingenting längre är relativt fyller den ingen funktion, och den
 * pekar på `localhost`, en adress DocRaptor per definition inte kan nå.
 *
 * Överlever en `<link rel="stylesheet">` hit har `renderaDokument`s egen
 * FOUC-fallback slagit till, vilket betyder att CSS:en inte gick att läsa.
 * Det är ett HÅRT FEL här och inte något att inlina runt: DocRaptor når inte
 * `localhost`, så resultatet hade blivit en helt ostilad PDF — och en
 * ostilad PDF som ser ut som en färdig förhandsgranskning är sämre än ett
 * ärligt felmeddelande.
 */
export async function gorSjalvbarande(html: string): Promise<SjalvbarandeResultat> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const basUrl = doc.querySelector('base')?.getAttribute('href') ?? window.location.href;

  if (doc.querySelector('link[rel="stylesheet"]')) {
    throw new Error(
      'Stilmallen kunde inte läsas in, så dokumentet skulle bli helt ostilat. ' +
        'Kontrollera att dev-servern svarar på mallkatalogen och försök igen.',
    );
  }

  /* VITES INJICERADE SKRIPT MÅSTE BORT — dev-servern lägger till
     `<script type="module" src="/@vite/client">` plus ett inline-skript i
     VARJE .html den serverar under projektroten (mätt 2026-08-22 mot
     `/docs/mallar/bilagor/bekraftelsebilaga.html`). De följer med in i
     dokumentet och blir för renderaren en adress att slå upp — `/@vite/client`
     är exakt den `/@fs`-klass av filsystemsväg som fällde det första
     skarpförsöket. EF:en sätter visserligen `javascript: false`, men det
     styr KÖRNINGEN, inte upplösningen av `src`. Ett PDF-dokument har
     dessutom ingen användning för skript över huvud taget, så rensningen är
     rätt oavsett vad renderaren hade gjort med dem. */
  for (const skript of doc.querySelectorAll('script')) skript.remove();

  const saknade: string[] = [];
  for (const stil of doc.querySelectorAll('style')) {
    const { css, saknade: missade } = await inlinaCssUrls(stil.textContent ?? '', basUrl);
    stil.textContent = css;
    saknade.push(...missade);
  }

  await inlinaBilder(doc, basUrl);
  doc.querySelector('base')?.remove();

  return { html: `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`, saknade };
}
