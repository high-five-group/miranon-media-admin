import { useEffect, useId, useState } from 'react';
import { ProgressBar } from 'react-aria-components';
import { STALL_THRESHOLD_MS } from '@/data/warmup/startvarmningen';

/**
 * Rännstens-kamouflagets referensräknare (S107 fynd-fix).
 *
 * Markören `data-forberedelse-fond` bor på `<html>` — den är en EGENSKAP HOS
 * DOKUMENTET, inte hos komponentinstansen, och `/dev/primitives` renderar
 * TRE instanser samtidigt. En naiv `set på mount / ta bort på unmount` hade
 * därför låtit den först avmonterade instansen städa bort markören medan de
 * andra två fortfarande stod kvar. Räknaren gör städningen korrekt oavsett
 * antal samtidiga instanser: sista ut släcker lyset.
 *
 * Modul-scope, inte `useRef`: räknaren delas MELLAN instanser, vilket är
 * hela poängen. (Vite code-splitting-fällan som TASK-261 mätte gäller
 * route-filer som delas i separata chunkar — denna modul importeras av
 * samtliga konsumenter som EN modul, så delat modultillstånd är säkert här.)
 */
let fondReferenser = 0;

export interface ForberedelseskarmProps {
  /** Antal hämtningar (av startvärmningens set) som blivit klara. */
  klara: number;
  /** Totalt antal hämtningar i startvärmningen. */
  totalt: number;
}

/**
 * Platshållar-props för de TVÅ ingångspunkter (`src/main.tsx`s `InnerApp`,
 * TASK-218.3, samt `src/routes/_authenticated.tsx`s app-yta-gate,
 * TASK-227) som visar skärmen INNAN en riktig startvärmnings-handle finns:
 * auth-resolution-fasen (varm/kall ännu inte avgjord, ADR-112 beslut 5
 * tillåter skärmen i 0-läge här) respektive en aktiv inloggning på en kall
 * enhet. `totalt: 1` håller stapeln vid 0 % utan division med noll —
 * INGEN relation till startvärmningens riktiga `totalt` (7 datamängder,
 * `startvarmningen.ts` `WARMUP_ITEMS`).
 *
 * TASK-233 (rättelse): `src/routes/__root.tsx`s rot-Suspense-fallback
 * (route-chunk-nedladdning vid SPA-sidbyten) återanvände tidigare DENNA
 * komponent — redan då flaggat här som "ett HELT ANNAT väntoläge än
 * startvärmningens sju hämtningar". Det visade sig vara fel vikt (mikro-
 * blink av hela skärmen vid vanliga in-app-navigationer) och är nu ersatt
 * av `Sidbytesindikator.tsx`, som INTE bygger på denna komponent —
 * se den filens doc-block för hela rotorsaks- och tröskel-resonemanget.
 */
export const FORBEREDELSESKARM_VANTAR: ForberedelseskarmProps = { klara: 0, totalt: 1 };

/**
 * Forberedelseskarm — Förberedelseskärmen (ORDLISTA; ADR-112; DESIGN-SYSTEM-
 * SPEC §15-familjen; PRD TASK-218 användarberättelser 1, 6, 7).
 *
 * Helskärmsyta, helt PROPS-DRIVEN: `{ klara, totalt }` är den enda
 * datakontrakt-ytan — komponenten gör ingen egen datahämtning och vet
 * ingenting om TanStack Query, warmup-motorn (TASK-218.1) eller
 * gate-integrationen (TASK-218.3) som monterar den. Den blockerande
 * startvärmningens LOGIK bor helt utanför denna fil. ENDA undantaget
 * (task-240, STALL-SIGNALEN nedan): `STALL_THRESHOLD_MS` importeras som en
 * REN KONSTANT ur `startvarmningen.ts` — samma mönster som
 * `HEM_SENASTE_AKTIVITET_ANTAL` (queries/keys.ts) redan etablerar för att
 * hålla en delad siffra i EN källa. Ingen QueryClient-, hook- eller
 * motor-koppling adderas.
 *
 * ═══ STALL-SIGNALEN (task-240, Marcus-beslut 2026-08-17) ═══
 *
 * Rotorsak (task-240s Implementation Notes, kontrollerad repro): när
 * motorns SISTA batch-item är segt fryser baren SYNLIGT utan feedback tills
 * ADR-112 beslut 3:s hårda timeout löser ut abrupt. Denna komponent håller
 * därför internt reda på tid sedan senaste `klara`/`totalt`-ÄNDRING
 * (`useEffect` som återstartar en `setTimeout(STALL_THRESHOLD_MS)` vid
 * varje props-ändring) — INTE motorns interna tillstånd, bara "har mina
 * props ändrats nyligen". Vid tröskeln: fyllnaden får en pulserande
 * opacitets-animation (`motion-safe:animate-pulse` — Tailwinds
 * `motion-safe:`-variant applicerar ALDRIG under `prefers-reduced-motion:
 * reduce`, samma dubbelbälte-mönster som `motion-safe:transition-[width]`
 * nedan) och en ADDITIV rad ("Tar lite längre tid än vanligt…") monteras
 * under den LÅSTA textraden — den låsta raden ändras inte ett tecken.
 * Bredden (`percentage`) förblir hela tiden den FAKTISKA `klara`/`totalt`-
 * kvoten — signalen lägger till en "fortfarande igång"-indikation, den
 * ersätter aldrig den sanningsenliga datan med en generisk indeterminate-
 * bar. Tokens: samma `--mm-forberedelseskarm-bar-fill` som redan bär
 * kontrast-golvet (§ "Höjden och fyllnadsfärgen" nedan) — ingen ny färg
 * införs för pulsningen specifikt (den ÄRVER task-273.1s sage, se nedan).
 *
 * Namnet är Swedish/ORDLISTA-transrivet (ö→o, ä→a) enligt samma konvention
 * som `NastaEventCard` (`hem/`) — Förberedelseskärmen är ett låst, namngivet
 * domänbegrepp (inte en generisk tvärprodukt-primitiv som `Button`/`Skeleton`),
 * så komponenten bor i `AppShell/` tillsammans med annan app-rot-chrome
 * (`AppUpdateBanner`, `OfflineIndicator`) snarare än i `primitives/`.
 *
 * ═══ HÖJDEN OCH FYLLNADSFÄRGEN — 6 PX + SAGE, INTE GOLD (task-273.1) ═══
 *
 * Baren delar nästa event-kortets bar-KLASS (`hem/NastaEvent.tsx` rad ~95,
 * `h-1.5` = 6 px) men INTE dess färg: systemets egen laddningssignal (sage)
 * ska skiljas visuellt från innehållets kapacitetsbar (guld,
 * `--mm-primary`/`bg-primary-muted`), så de två aldrig förväxlas (Marcus
 * prod-granskning 2026-08-17, PRD task-273 användarberättelser 1–2).
 *
 * Fyllnaden bär `--p-sage-9` (`#606b57`) — samma hex som `--mm-success`
 * redan pekar på via sin `--p-green-500`-alias (33 användningar, bl.a.
 * skapa-knappen), alltså en redan bevisat läsbar ton i appen, inte en ny
 * uppfunnen kulör. Computed-mätt mot faktiska spårfärgen `--mm-bg-muted`
 * (`--p-neutral-50`, `#f5f5f3`): sage-9 mäter **5,15:1** — golvet i WCAG
 * 1.4.11 (3:1 för UI-komponentgränser) är alltså rejält passerat redan i
 * normalläge, samma "golv-inte-tak"-princip som `Sidbytesindikator`s
 * gold-11/gold-12-par etablerade (se den tokenkommentaren i
 * `components.css` för resonemanget bakom mönstret; siffrorna skiljer sig
 * eftersom sage och gold har olika luminanskurvor — sage klarar 3:1 redan
 * vid steg 7, gold behövde steg 11 av 12). contrast-more mörknar vidare
 * till `--p-sage-11` (`#434c3b`, **8,24:1** mot spåret) — en meningsfull
 * skärpning, inte en marginell. Båda talen är räknade med WCAG 2.x
 * relativ-luminans-formeln mot spårets FAKTISKA färgvärde, inte mot vitt.
 * Tokens: `--mm-forberedelseskarm-bar-*` (components.css).
 *
 * ═══ TVÅ SKILDA A11Y-KANALER (spec §15 Roselli-mönstret + AppUpdateBanner-
 * precedentet: en snäv, alltid-monterad live-region för DYNAMISKT innehåll,
 * statisk struktur utanför den) ═══
 *
 * 1. **Widgeten** — `role="progressbar"` + `aria-valuenow/min/max/valuetext`
 *    (react-aria-components `ProgressBar`, samma etablerade bibliotek som
 *    `Select`/`Button`/`ToggleButtonGroup` redan bygger på). Namnges via
 *    `aria-labelledby` mot den låsta textraden under baren — ingen dold
 *    dubblett-etikett (raden är själv `sr-only` sedan task-273.6, se
 *    § BAKGRUNDSBILDEN — `aria-labelledby` fungerar identiskt oavsett om
 *    måltexten är visuellt synlig eller ej). `valueLabel` sätts explicit
 *    till "X av Y" (ADR-112:s egen fras) i stället för RAC:s procent-
 *    default, så `aria-valuetext` matchar ADR:ns språk för en skärmläsare
 *    som frågar widgeten direkt.
 * 2. **Den polite-annonserade statusraden** — en SEPARAT `role="status"
 *    aria-live="polite"` `sr-only`-rad med samma "X av Y"-text. En
 *    `aria-valuenow`-ändring på en `role="progressbar"` annonseras INTE
 *    automatiskt av skärmläsare (progressbar är inte en implicit
 *    live-region) — därav den andra kanalen, alltid monterad från första
 *    rendering (MDN: en region måste finnas FÖRE sitt innehåll för att
 *    annonseras tillförlitligt).
 *
 * INTE `role="alert"` (Marcus-kravet): detta är förloppsinformation, inte
 * ett fel — samma info/status-mappning som `MessageBox` och `AppUpdateBanner`
 * redan följer.
 *
 * ═══ REDUCERAD RÖRELSE — DISKRET STEGNING (Marcus-kravet) ═══
 *
 * Fyllnaden animeras ENDAST via `motion-safe:transition-[width]` (samma
 * klassfragment som `EventCheckin.tsx`s `FramstegskortD` redan använder för
 * en identisk klara/totalt-bar) — under `prefers-reduced-motion: reduce`
 * appliceras ingen transition-klass alls, så varje breddändring blir en
 * diskret hoppning i stället för en mjuk fyllnad. base.css:s globala
 * `transition-duration: 0.01ms !important`-neutralisering står kvar som
 * dubbelbälte, precis som Skeleton-shimmerns mönster.
 *
 * ═══ BAKGRUNDSBILDEN — ROGER & LOTTA-FOTOT, INTE LOGOTYPEN (task-273.6,
 * Marcus tillägg 2, 2026-08-17) ═══
 *
 * Skärmen "rensas till enbart loadingbaren" (Marcus egna ord, PRD-kortet):
 * ordmärket (`public/miranon-media-ordmarke.svg`, tidigare synligt här) och
 * den låsta textraden är BORTA ur den RENDERADE ytan — bara baren är
 * visuellt kvar. `public/roger-och-lotta.webp` (1600×1061, 97 kB) ersätter
 * dem som en dov, centrerad, fönsterfyllande bakgrund BAKOM baren — inte en
 * logotyp-ersättning, ett stämningsfoto.
 *
 * BILDEN BYTTES 2026-08-17 (S107 fynd-fix, Marcus-fångst "det är fel bild"):
 * skivan tog repots ENDA befintliga RL-bild, vilken var fel foto. Marcus
 * levererade rätt original (`Roger_och_Lotta_Miranon_Media_1.png`, 4096×2714,
 * 20,9 MB) som skalats och konverterats med `cwebp -q 80` — LÄTTARE än den
 * gamla (97 mot 132 kB) trots högre källupplösning. Scrimmets
 * luminansanalys är omräknad mot den nya filen i samma landning
 * (components.css-tokenens kommentar): marginalen steg 4,48 → 4,52:1.
 *
 * RÄNNSTENEN: foto- och scrimlagren ligger INUTI body och kan därför aldrig
 * nå ut i den rännsten `scrollbar-gutter: stable both-edges` reserverar —
 * det syntes som två vita spalter i kanterna (Marcus-fångst 2026-08-17,
 * samma klass som login-fondens S96-fynd). Åtgärdat med en platt
 * kamouflagefärg på `<html>` via markören `data-forberedelse-fond`
 * (referensräknad ovan) — se base.css § RÄNNSTENS-KAMOUFLAGE för varför
 * bilden SJÄLV inte kan målas där oavsett teknik.
 *
 * ...OCH KAMOUFLAGET ENSAMT RÄCKTE INTE (S107 QA-fynd runda 3, Marcus:
 * "jag ser den vita strimman fortfarande ganska väl"). En flat färg kan bara
 * matcha fotot i ETT beskärningsfall: `cover` byter beskärningsaxel när
 * fönstrets sidförhållande understiger bildens egna 1,508, och då möter
 * bildens nästan vita MITTKOLUMN rännstenen i stället för kantkolumnen
 * kamouflaget samplades ur. Scrim-lagret nedan bär därför också
 * `--mm-forberedelseskarm-kantton`: en gradient som tonar fotots yttersta
 * 24 px till EXAKT kamouflagefärgen, så att sömmen försvinner oavsett
 * beskärningsaxel (uppmätt max kanalavvikelse 17–22 → 1 i fem fönsterformat).
 * Hela mätserien, breddsvepet och den kvarstående overlay-scrollbar-kanten:
 * components.css § Forberedelseskarm KANTTON.
 *
 * GATEN ÄR `min-[640px]:`, INTE `sm:` — och skillnaden är funktionell, inte
 * stilistisk. Tailwinds `sm:` kompilerar till `40rem`, medan rännstenen i
 * base.css aktiveras vid `640px`. Vid en annan rot-fontstorlek än 16 px
 * glider de isär, och kanttonen hade då antingen uteblivit där rännstenen
 * finns eller målats där den inte finns. Gaten måste matcha rännstensregelns
 * villkor ORDAGRANT, alltså i px.
 *
 * TVÅ LAGER, inte en förblandad bild: ett rent `bg-cover bg-center`-foto-
 * lager och ett separat vitt scrim-lager ovanpå (`--mm-forberedelseskarm-
 * scrim`, 85 % vit color-mix, components.css). `cover`-beteendet ger
 * "centrerad och lika stor som webbläsarfönstret" (Marcus form-beskrivning)
 * — beskär i stället för att bredda ut, aldrig letterboxad. Scrimmets
 * opacitet är INTE en gissning: en pixel-för-pixel WCAG-luminansanalys av
 * den FAKTISKA filen (sharp, samtliga 1 708 800 pixlar) visar att även det
 * absolut mörkaste pixelvärdet i bilden, blandat med scrimmet, ger
 * fyllnaden (--p-sage-9) en kontrastkvot **4,02:1** mot bakgrunden — 34 %
 * marginal över 1.4.11:s 3:1-golv. Full räkning: components.css:s
 * tokenkommentar för `--mm-forberedelseskarm-scrim`.
 *
 * SIFFRORNA OVAN ÄR RUNDA 2:s, inte runda 1:s. Marcus sänkte scrimmet
 * 90 % → 85 % ("liiite mer av fotot") och kontrastkvoten föll då 4,52 →
 * 4,02:1; 80 % mättes till 3,56:1 och valdes bort. Detta docblock bar
 * "90 %" och "4,48:1" i ett dygn efter att tokenet redan sagt 85 % —
 * rättat 2026-08-18. Prosan om ett tokenvärde är alltid den som glider;
 * läs `components.css` när de två säger olika.
 *
 * `aria-hidden="true"` på båda lagren (rent dekorativt, CSS-bakgrund — inte
 * en `<img>`, så inget textalternativ-krav uppstår över huvud taget).
 * contrast-more och print DÖLJER båda lagren helt (`contrast-more:hidden
 * print:hidden`) — faller tillbaka till containerns egna `bg-bg` (samma
 * rena vita bakgrund skärmen hade FÖRE denna skiva), Marcus egen
 * AC-formulering ("bilden får tonas ned ytterligare eller döljas där").
 *
 * ═══ LADDNINGSSTRATEGI (AC 4 — 132 kB på APPENS FÖRSTA skärm) ═══
 *
 * CSS `background-image` (via Tailwinds `bg-[url(...)]`), INTE en `<img>`.
 * Skälet är fetch-PRIORITET, inte semantik: Chrome tilldelar varje bild Low
 * priority som DEFAULT — även hjältebilder — och höjer den bara vid
 * explicit `fetchpriority="high"` eller `<link rel="preload">` (web.dev,
 * "Optimize resource loading with the Fetch Priority API",
 * https://web.dev/articles/fetch-priority). Ingen av delarna används HÄR,
 * MEDVETET: fotot är dekoration bakom baren, inte innehållet skärmen
 * finns för att kommunicera — det ska ALDRIG konkurrera om bandbredd med
 * auth-hämtningen eller startvärmningens sju hämtningar (samma nätverk,
 * samma sekund). Med CSS-bakgrund upptäcks resursen dessutom först efter
 * layout (i en CSR-app utan server-renderad HTML finns ingen
 * preload-scanner-fördel för `<img>` att förlora här — DOM:en existerar
 * inte förrän React committat den, oavsett teknik). Containerns egen
 * `bg-bg` (vit) är en OMEDELBAR fallback: baren och dess (sr-only) text
 * renderar direkt oavsett bildens hämtningsstatus, fotot poppar in bakom
 * när det är klart, ingen blockering, ingen layoutskift. Sedan bildbytet
 * 2026-08-17 är filstorleken dessutom en aktiv del av mitigeringen och inte
 * bara prioritetsstrategin: 20,9 MB-originalet skalades till 1600 px bredd
 * och `-q 80` innan det landade (97 kB). Rå-PNG:n får ALDRIG skeppas —
 * detta är appens första skärm.
 *
 * ═══ LAYOUTANKARET — SAMMA MÖNSTER SOM LOGIN-BLOCKET (skärpningsvarv
 * TASK-242, forberedelseskarm-splash-branschmonster-2026-08-16.md,
 * Marcus-kvitterad punkt 1) ═══
 *
 * Ytterdiven centrerar EXAKT som `login.tsx`s `<main>` (`items-center
 * justify-center`, samma responsiva padding-skala `p-4 sm:p-8 lg:p-12`) och
 * är dessutom `relative` — positioneringskontext för bakgrundslagren i
 * § BAKGRUNDSBILDEN ovan, ett tillägg i task-273.6.
 *
 * FÖRE task-273.6 satt progressindikatorn i ett tvånivå-block
 * (`max-w-md` yttre för logotypen, `max-w-xs` inre för bar+text). Sedan
 * logotypen togs bort finns bara EN nivå kvar: `max-w-xs flex-col
 * items-center gap-4` (`data-testid="forberedelseskarm-block"` — ersätter
 * `img[alt="Miranon Media"]` som testankare i
 * `tests/webblasarbeteende/forberedelseskarm-hojdkedja.test.ts`, se den
 * filens kommentar). Blocket är `relative` av samma stapel-skäl som
 * ytterdiven: utan det målar de `absolute`-positionerade bakgrundslagren
 * OVANPÅ det (CSS-målningsordning rankar positionerade element efter
 * positionerade element, inte efter DOM-ordning mot icke-positionerade
 * syskon) — ett `position: static`-block hade hamnat UNDER fotot.
 *
 * EN AVSIKTLIG SKILLNAD mot login, disk-verifierad
 * (`src/routes/dev/primitives.tsx` rad ~455–458): ytterdiven behåller
 * `h-full min-h-full` (fyller SIN FÖRÄLDER) i stället för login.tsx:s
 * `min-h-dvh` (fyller VIEWPORTEN). Komponenten har TRE renderingskontexter
 * (`main.tsx`s InnerApp, `_authenticated.tsx`s app-yta-gate, samt
 * dev-showcasen `/dev/primitives` — TASK-233 tog bort den fjärde,
 * `__root.tsx`s Suspense-fallback, se doc-blocket ovan) — dev-showcasen
 * begränsar MEDVETET varje instans till
 * en `h-72 overflow-hidden`-inramning för att visa alla tre förloppslägen
 * sida vid sida (kommentaren där: "I produktion fyller ytan hela
 * viewporten ... här begränsas varje instans till en fast inramning"). Ett
 * byte till `min-h-dvh` hade brutit ut ur den inramningen och gjort
 * dev-showcasens tre instanser omöjliga att jämföra sida vid sida — precis
 * det `h-full min-h-full` finns för att undvika. Login har ingen sådan
 * multi-kontext-återanvändning (en enda route, en enda rendering), så
 * `min-h-dvh` är säkert DÄR men inte HÄR.
 *
 * FÖLJDEN AV DET VALET ÄR ETT KRAV PÅ ANROPAREN, och det kravet var i tre
 * kontexter skrivet men i två av dem aldrig uppfyllt (TASK-266): `h-full`
 * fyller sin förälder, alltså MÅSTE föräldern ha en höjd. Dev-showcasen
 * uppfyllde kravet (`h-72`) och formulerade det ("I produktion fyller ytan
 * hela viewporten — ANROPAREN SÄTTER HÖJDEN"), men båda produktions-
 * anroparna renderade komponenten NAKEN direkt under `#root`. Eftersom
 * `base.css` inte sätter någon höjd på html/body och `#root` saknar
 * CSS-regel kollapsade hela kedjan: skarpt uppmätt 2026-08-17 på 1280×720
 * var html/body/#root/container ALLA 219 px (176 px innan logo-SVG:n
 * laddat), och `justify-center` centrerade därför i den kollapsade
 * topplådan — logons mitt på y=69 i stället för 360.
 *
 * Rättat i anroparna, inte här: `main.tsx`s gate-gren och
 * `_authenticated.tsx`s app-yta-gate bär nu `grid min-h-dvh w-full`. Att i
 * stället flytta `min-h-dvh` HIT hade brutit dev-showcasen enligt stycket
 * ovan. Se `main.tsx`s kommentar vid gate-grenen för varför wrappern måste
 * vara `grid` och inte `flex` (mätt: `h-full` mot en flex-förälder med
 * min-height ger 219 px, mot en grid-förälder 720 px).
 */
export function Forberedelseskarm({ klara, totalt }: ForberedelseskarmProps) {
  const textId = useId();
  const besked = `${klara} av ${totalt} hämtningar klara`;

  // Stall-signalen (se klassdoc-blocket ovan) — återstartar vid VARJE
  // props-ändring, inte bara vid mount. `totalt` i deps FÖRUTOM `klara`:
  // övergången FORBEREDELSESKARM_VANTAR ({0,1}) → riktig startvärmning
  // ({0,7}) är en totalt-ändring UTAN klara-ändring, och räknas korrekt som
  // "nyss gjorde framsteg" (en riktig handle just anslöt).
  const [stallad, setStallad] = useState(false);
  // TRIGGER på klara/totalt-ÄNDRING (samma etablerade mönster som main.tsx:s
  // InnerApp-invalidate-effekt) — ingen av dem LÄSES i effektkroppen, de
  // finns bara för att tvinga en omstart av timern varje gång ett nytt
  // framsteg anländer.
  // biome-ignore lint/correctness/useExhaustiveDependencies: medveten TRIGGER på props-ändring, se ovan
  useEffect(() => {
    setStallad(false);
    const timer = setTimeout(() => setStallad(true), STALL_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [klara, totalt]);

  // Rännstens-kamouflaget (S107 fynd-fix) — se doc-block § BAKGRUNDSBILDEN
  // och base.css § RÄNNSTENS-KAMOUFLAGE. Tom beroendelista: markören hör till
  // skärmens LIVSTID, inte till dess framsteg.
  useEffect(() => {
    fondReferenser += 1;
    document.documentElement.setAttribute('data-forberedelse-fond', 'true');
    return () => {
      fondReferenser -= 1;
      if (fondReferenser <= 0) {
        fondReferenser = 0;
        document.documentElement.removeAttribute('data-forberedelse-fond');
      }
    };
  }, []);

  return (
    <div className="relative flex h-full min-h-full w-full flex-col items-center justify-center bg-bg p-4 sm:p-8 lg:p-12">
      {/* Bakgrundsbilden — se doc-block § BAKGRUNDSBILDEN (task-273.6). Foto
          och scrim är TVÅ separata lager i stället för en förblandad bild:
          scrimmets opacitet är en TOKEN (mätbar, testad, bytbar för sig),
          och båda döljs oberoende av innehållet under contrast-more. Båda
          `aria-hidden` — rent dekorativt, ingen textalternativ-skuld. */}
      <div
        aria-hidden="true"
        data-testid="forberedelseskarm-bakgrund"
        className="absolute inset-0 bg-[url('/roger-och-lotta.webp')] bg-center bg-cover bg-no-repeat contrast-more:hidden print:hidden"
      />
      {/* Scrimmet bär TVÅ saker på samma nod, med avsikt: sin egen
          `background-color` (opaciteten, en token för sig) och ovanpå den
          kanttonens `background-image` (se doc-block § RÄNNSTENEN). Ett eget
          tredje lager hade gett samma pixlar men en nod till — gradienten
          måste ändå ligga OVANPÅ scrimmet för att stoppfärgen ska kunna vara
          kamouflaget självt, och `background-image` målas per CSS Backgrounds
          § 3.8 alltid ovanpå samma elements `background-color`. Bonusen är
          att contrast-more/print-döljningen redan sitter här: kanttonen
          försvinner tillsammans med det den justerar, i stället för att bli
          den enda tonade ytan på en i övrigt ren skärm. */}
      <div
        aria-hidden="true"
        data-testid="forberedelseskarm-scrim"
        className="min-[640px]:bg-(image:--mm-forberedelseskarm-kantton) absolute inset-0 bg-(--mm-forberedelseskarm-scrim) contrast-more:hidden print:hidden"
      />
      <div
        data-testid="forberedelseskarm-block"
        className="relative flex w-full max-w-xs flex-col items-center gap-4"
      >
        <ProgressBar
          aria-labelledby={textId}
          value={klara}
          minValue={0}
          maxValue={totalt}
          valueLabel={besked}
          className="w-full"
        >
          {({ percentage }) => (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--mm-forberedelseskarm-bar-track) outline-border-strong contrast-more:outline print:outline">
              <div
                className={
                  stallad
                    ? 'h-full rounded-full bg-(--mm-forberedelseskarm-bar-fill) motion-safe:animate-pulse motion-safe:transition-[width] contrast-more:bg-(--mm-forberedelseskarm-bar-fill-contrast)'
                    : 'h-full rounded-full bg-(--mm-forberedelseskarm-bar-fill) motion-safe:transition-[width] contrast-more:bg-(--mm-forberedelseskarm-bar-fill-contrast)'
                }
                style={{ width: `${percentage ?? 0}%` }}
              />
            </div>
          )}
        </ProgressBar>
        {/* MARCUS-LÅST ORDALYDELSE — ändra aldrig ett tecken (PRD TASK-218,
            ADR-112, ORDLISTA "Förberedelseskärmen"). Sedan task-273.6:
            sr-only i stället för synlig text — "rensas till enbart
            loadingbaren" (Marcus tillägg 2) — men kvar i DOM:en som
            progressbarens aria-labelledby-mål, se § TVÅ SKILDA
            A11Y-KANALER ovan. Ordalydelsen ändras inte, bara synligheten. */}
        <p id={textId} className="sr-only">
          Förbereder ditt administrationsverktyg
        </p>
        {/* STALL-SIGNALEN (task-240) — ADDITIV rad, den låsta raden ovan
            rörs inte. Monteras/avmonteras med `stallad`, ej bara döljd via
            CSS, så den aldrig ligger dold-men-närvarande i DOM:en mellan
            framsteg. sr-only sedan task-273.6 av samma skäl som ovan —
            stall-LOGIKEN (tröskel, pulsning på baren) är oförändrad, bara
            denna rads visuella närvaro. */}
        {stallad && <p className="sr-only">Tar lite längre tid än vanligt…</p>}
      </div>
      {/* Kanal 2 — polite, alltid monterad; se klassdoc-blocket ovan.
          Stall-meddelandet vävs in i SAMMA live-region (inte en andra) så
          det annonseras vid text-ändringen utan att duplicera kanal 1. */}
      <p role="status" aria-live="polite" className="sr-only">
        {stallad ? `${besked}. Tar lite längre tid än vanligt…` : besked}
      </p>
    </div>
  );
}
