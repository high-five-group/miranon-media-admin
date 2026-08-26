/**
 * skrivLaddningssida — den momentana sidan i ett synkront öppnat,
 * `about:blank`-fönster (TASK-309.26).
 *
 * DELAD MELLAN GenereringsVy.tsx OCH DokumentYta.tsx (review-runda 1, AC
 * #4): båda ytorna öppnar ett fönster synkront (`window.open('', '_blank')`)
 * i klickhanteraren och sätter dess adress först när ett asynkront svar är
 * klart (`GenereringsVy.tsx`s `skapaDokument` — server-genererad PDF;
 * `DokumentYta.tsx`s `DokumentAtgardsKnappar` — `useForhandsvisaDokument`,
 * en redan lagrad/förhandsvisad fil). Innan detta tillägg lämnade BÅDA
 * ytorna fönstret tomt (`about:blank`) under väntan — samma "abrupt tomt
 * fönster" Marcus avvisade 22 aug 2026 (*"då öppnas ett nytt fönster helt
 * abrupt, men en text uppe i högra hörnet om att bilagan genereras… Va?
 * Seriöst?"*). Skillnaden mot den avvisade formen är INTE att en text
 * skrivs in — det gjorde 22 aug-varianten också — utan VAR och HUR: 22
 * aug-varianten var en anonym statusrad i ett hörn av en annars orelaterad
 * yta; denna är en egen, tyst, centrerad sida vars ENDA syfte är att vara
 * just det fönstret blir, tills adressen sätts (eller felet visas).
 *
 * TEKNIKEN ÄR HUSETS EGEN, INTE NY: `useForhandsvisaDokument.ts`s felväg
 * gjorde redan exakt detta (`handle.document.write(...)`, inline `style`,
 * ingen extern stylesheet) — denna funktion generaliserar samma mönster
 * till att även bära det FÖRVÄNTADE, icke-fel-läget, och till en andra yta.
 * `document.write` på ett same-origin `about:blank`-fönster öppnaren själv
 * skapade är standardbeteende (MDN `Window.open()`: en same-origin browsing
 * context kan läsas/skrivas av öppnaren). Att SEDAN sätta fönstrets
 * `location.href` (i anroparens `onSuccess`) är en helt separat, vanlig
 * navigering som kasserar detta dokument och ersätter det med den faktiska
 * destinationen — EMPIRISKT verifierat (se nedan) att detta fungerar
 * OFÖRÄNDRAT efter `document.close()`.
 *
 * `document.close()` ÄR OBLIGATORISK — INTE valfri (RÄTTAT, review-runda 2,
 * severity ERROR, granskaren reproducerade felet i skarp Chromium via
 * Playwright MCP). En tidigare version av detta docblock påstod att
 * strömmen "förblir öppen tills webbläsaren självmant stänger den" — det
 * påståendet var FEL och orsakade en verklig bugg: utan `close()` står
 * dokumentet i `readyState: 'loading'` på obestämd tid, och ETT ANNAT
 * `document.write`-anrop på samma (fortfarande öppna) dokument APPENDAR då
 * sitt innehåll i stället för att ERSÄTTA det. Det slog till skarpt i
 * `useForhandsvisaDokument.ts`s felväg: dess `catch`-block skriver
 * felmeddelandet med `handle.document.write(...)` — utan `close()` här
 * hade Lotta sett "Öppnar dokument…" och "Kunde inte öppna dokumentet…"
 * STAPLADE ovanpå varandra i samma fönster.
 *
 * MEKANIKEN, EMPIRISKT MÄTT (Playwright + `playwright-core`s Chromium, inte
 * bara MDN-läsning — tre scenarier körda, throwaway-skript, kastade efter
 * passet):
 *   A. `write(laddning)` → `readyState` = `'loading'`. `close()` →
 *      `readyState` = `'complete'`, `body.innerText` fortfarande
 *      laddningstexten. Ett ANDRA `write(fel)` (utan explicit `open()`,
 *      exakt `useForhandsvisaDokument.ts`s kod) → `body.innerText` blir
 *      ENBART feltexten — `write()` på ett STÄNGT dokument anropar implicit
 *      `document.open()` FÖRST (som TÖMMER dokumentet, HTML-spec/MDN), sedan
 *      skriver den nya kroppen. `location.href`-navigering EFTER `close()`
 *      fungerar identiskt (ingen `navigationError`).
 *   B. Samma sekvens UTAN `close()` (dagens bugg, reproducerad för att
 *      bekräfta felbeskrivningen innan fixen skrevs): `body.innerText` blir
 *      `"LADDNINGSTEXT\n\nFELTEXT"` — bekräftar granskarens fynd exakt.
 *   C. Robusthetskontroll: om laddningssidan HYPOTETISKT glömde `close()`
 *      (en annan anropare, ett framtida missat fall) gör ett explicit
 *      `document.open()` FÖRE `write()` samma jobb oavsett dokumentets
 *      föregående tillstånd (`'loading'` ELLER `'complete'`) — det är därför
 *      `useForhandsvisaDokument.ts`s felväg NU gör `open()`+`write()`+
 *      `close()` explicit (försvar i djup, se den filens docblock), i
 *      stället för att bara lita på att DENNA funktion städat efter sig.
 *
 * INGEN `fonster.closed`-vakt HÄR: denna funktion anropas SYNKRONT, i samma
 * tick som `window.open` skapade fönstret — ingen realistisk tid för Lotta
 * att hinna stänga det mellan öppning och skrivning. Den vakten hör hemma
 * hos ANROPAREN, vid den SENARE, asynkrona `location.href`-sättningen
 * (efter ett EF-svar som kan ta sekunder) — se `GenereringsVy.tsx`s
 * `skapaDokument` för den vakten (review-runda 1: `fonster.closed` kan bli
 * sant medan mutationen arbetar; att sätta `location.href` på ett stängt
 * fönster kan kasta i vissa webbläsare, och `blockerad` måste då bli sant
 * så fallback-vägen visas).
 *
 * VIEWPORT-META (review-runda 1): utan `width=device-width, initial-
 * scale=1.0` (samma literal som appens `index.html`) antar mobila
 * webbläsare ett 980 px-skrivbordslayout-viewport för ett dokument utan
 * egen viewport-deklaration, och skalar ner det till skärmen — texten hade
 * blivit oläsligt liten på en 375 px-skärm. iOS SAFARI-BOKFÖRING (kortets
 * research-not bad om detta): `window.open`/`document.write`-mönstret är
 * INTE skarpt testat mot fysisk iOS Safari av denna agent (ingen
 * enhetstillgång i bygg-miljön) — det som ÄR verifierat är plattforms-
 * mekaniken via MDN (samma källor som ovan) och att mönstret redan är
 * skarpt i drift i `useForhandsvisaDokument.ts`. Kvarstående öppen fråga,
 * bokförd inte gissad: om iOS Safaris nya-flik-hantering öppnar detta
 * fönster identiskt med desktop Safari/Chrome. Se AC #2:s manuella-
 * verifiering-anteckning i `TASK-309.26`.
 *
 * LITERALA FÄRG-/TYPSNITTSVÄRDEN, INTE CSS CUSTOM PROPERTIES: detta
 * dokument delar INGENTING med appens `index.html`/`base.css` — det är
 * fönstrets EGET, fristående dokument, utan tillgång till appens
 * stylesheet. Värdena är en ÖGONBLICKSKOPIA av `--mm-bg`/`--mm-text`
 * (`src/styles/tokens/primitives.css` § `--p-neutral-0`/`--p-neutral-900`)
 * tagen vid skrivtillfället — en framtida tokenändring synkas INTE hit
 * automatiskt, samma avvägning som alla andra literal-kopior i huset.
 * Typsnittet UTELÄMNAR Inter/Google Fonts medvetet, av samma skäl
 * `useForhandsvisaDokument.ts`s felsida redan gör (`system-ui, sans-serif`,
 * ingen import): sidan lever i högst någon sekund, en fontleverans över
 * nätet vore en kostnad utan en mottagare som hinner se skillnaden.
 *
 * `lang="sv"` sätts explicit — dokumentet ärver annars webbläsarens
 * standardspråk, inte appens (ett fristående `document.write`-dokument har
 * ingen relation till appens `<html lang>`).
 *
 * ESCAPING (RÄTTAT, review-runda 3): `titel`/`text` escapas nu genom
 * `escapeHtml` innan de interpoleras i markupen — ANROPAREN BEHÖVER ALDRIG
 * sanera sina strängar själv, det är denna funktions eget ansvar (samma
 * disciplin som en ren templating-motor). I dag är båda anropssajterna
 * (`GenereringsVy.tsx`, `DokumentYta.tsx`) statiska, utvecklarskrivna
 * strängar — ingen levande injektionsväg finns — men en framtida anropare
 * som interpolerar t.ex. ett filnamn eller mallnamn i texten ska INTE
 * behöva komma ihåg att escapa det själv. Verifierat (Playwright-test): en
 * `titel`/`text` som innehåller `<b>x</b>` renderas som LITERAL TEXT (ingen
 * riktig `<b>`-nod skapas i det skrivna dokumentet).
 */
export interface Laddningssida {
  /** Fönstrets `<title>`. */
  titel: string;
  /** Den synliga texten i sidans kropp. */
  text: string;
}

/**
 * Minimal HTML-escaping av de fem tecken som annars kan bryta ut ur en
 * `document.write`-interpolering (`&`, `<`, `>`, `"`, `'`) — ingen ny
 * abstraktion utöver detta, bara en lokal hjälpare för `skrivLaddningssida`.
 */
export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function skrivLaddningssida(fonster: Window | null, sida: Laddningssida): void {
  if (!fonster) return;
  fonster.document.write(
    '<!doctype html><html lang="sv"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>' +
      escapeHtml(sida.titel) +
      '</title>' +
      '<style>' +
      'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
      'font-family:system-ui,-apple-system,sans-serif;background:#ffffff;color:#242424;}' +
      'p{max-width:32rem;padding:2rem;text-align:center;}' +
      '</style></head><body><p>' +
      escapeHtml(sida.text) +
      '</p></body></html>',
  );
  // [RÄTTAT, TASK-309.26 review-runda 2] document.close() ÄR OBLIGATORISK —
  // se docblocket ovan för den empiriska mätningen (readyState 'loading' →
  // 'complete', och varför en SENARE write() annars APPENDAR i stället för
  // att ERSÄTTA).
  fonster.document.close();
}
