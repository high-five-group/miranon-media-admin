import { useId } from 'react';
import { ProgressBar } from 'react-aria-components';

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
 * startvärmningens LOGIK bor helt utanför denna fil.
 *
 * Namnet är Swedish/ORDLISTA-transrivet (ö→o, ä→a) enligt samma konvention
 * som `NastaEventCard` (`hem/`) — Förberedelseskärmen är ett låst, namngivet
 * domänbegrepp (inte en generisk tvärprodukt-primitiv som `Button`/`Skeleton`),
 * så komponenten bor i `AppShell/` tillsammans med annan app-rot-chrome
 * (`AppUpdateBanner`, `OfflineIndicator`) snarare än i `primitives/`.
 *
 * ═══ FYLLNADSFÄRGEN — GOLD-11, INTE --mm-primary (components.css) ═══
 *
 * `--mm-primary` (gold-500/gold-9) mäter 2,57:1 mot vitt — under WCAG
 * 1.4.11:s 3:1-golv för UI-komponentgränser. gold-10 (kryssrutans platta,
 * 3,06:1 mot VITT) räcker inte här: spåret är `--mm-bg-muted` (en aning
 * mörkare än vitt), och computed-mätt (`Forberedelseskarm.spec.ts`) landar
 * gold-10 mot den ytan på 2,80:1 — under golvet. I stället för att förlita
 * sig på `contrast-more:` för att bli laglig (tak, inte golv) bär fyllnaden
 * gold-11 (kryssrutans kant-ton, ≥3:1 mot `--mm-bg-muted`) redan i
 * normalläge; contrast-more mörknar vidare till gold-12 (≥4,5:1). Tokens:
 * `--mm-forberedelseskarm-bar-*` (components.css).
 *
 * ═══ TVÅ SKILDA A11Y-KANALER (spec §15 Roselli-mönstret + AppUpdateBanner-
 * precedentet: en snäv, alltid-monterad live-region för DYNAMISKT innehåll,
 * statisk struktur utanför den) ═══
 *
 * 1. **Widgeten** — `role="progressbar"` + `aria-valuenow/min/max/valuetext`
 *    (react-aria-components `ProgressBar`, samma etablerade bibliotek som
 *    `Select`/`Button`/`ToggleButtonGroup` redan bygger på). Namnges via
 *    `aria-labelledby` mot den låsta textraden under baren — ingen dold
 *    dubblett-etikett. `valueLabel` sätts explicit till "X av Y" (ADR-112:s
 *    egen fras) i stället för RAC:s procent-default, så `aria-valuetext`
 *    matchar ADR:ns språk för en skärmläsare som frågar widgeten direkt.
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
 * ═══ LOGOTYPEN ═══
 *
 * `public/miranon-media-ordmarke.svg` — det fullständiga ordmärket (SVG,
 * bokstavsformerna som paths, inga fontberoenden), oanvänt sedan det
 * lämnades kvar av auth-skärmarnas prototyp-divergens (`VariantB.tsx`s
 * kommentar: "LOGOTYPEN ÄR BORTTAGEN … `public/miranon-media-ordmarke.svg`
 * ligger kvar oanvänd"). Valt framför `public/miranon-logo.svg` (det fria
 * 4-parallellogram-märket utan text, källan för PWA-ikonerna) eftersom
 * Förberedelseskärmen är den enda ytan på skärmen — ordmärket stavar ut
 * varumärket och ger starkare igenkänning under en blockerande väntan än
 * den textlösa ikon-formen. `alt` är varumärkesnamnet, inte "logotyp"
 * (etablerad a11y-konvention för logotyper).
 *
 * ═══ LAYOUTANKARET — SAMMA MÖNSTER SOM LOGIN-BLOCKET (skärpningsvarv
 * TASK-242, forberedelseskarm-splash-branschmonster-2026-08-16.md,
 * Marcus-kvitterad punkt 1) ═══
 *
 * Ytterdiven centrerar EXAKT som `login.tsx`s `<main>` (`items-center
 * justify-center`, samma responsiva padding-skala `p-4 sm:p-8 lg:p-12`).
 * Logotyp → progressindikator → stegtext sitter i ett INRE
 * `max-w-md flex-col items-center gap-8`-block — samma bredd/gap-kontrakt
 * som login-blocket (`w-full max-w-md flex-col gap-8`, `login.tsx` rad
 * ~227). `items-center` läggs till på blocket (login-blockets enda barn är
 * ett `w-full`-formulär som inte behöver det) eftersom denna ytas innehåll
 * är en centrerad KOLUMN, inte ett vänsterställt kort.
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
 */
export function Forberedelseskarm({ klara, totalt }: ForberedelseskarmProps) {
  const textId = useId();
  const besked = `${klara} av ${totalt} hämtningar klara`;

  return (
    <div className="flex h-full min-h-full w-full flex-col items-center justify-center bg-bg p-4 sm:p-8 lg:p-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <img
          src="/miranon-media-ordmarke.svg"
          alt="Miranon Media"
          className="h-auto w-48 sm:w-56"
        />
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <ProgressBar
            aria-labelledby={textId}
            value={klara}
            minValue={0}
            maxValue={totalt}
            valueLabel={besked}
            className="w-full"
          >
            {({ percentage }) => (
              <div className="h-2 w-full overflow-hidden rounded-full bg-(--mm-forberedelseskarm-bar-track) outline-border-strong contrast-more:outline print:outline">
                <div
                  className="h-full rounded-full bg-(--mm-forberedelseskarm-bar-fill) motion-safe:transition-[width] contrast-more:bg-(--mm-forberedelseskarm-bar-fill-contrast)"
                  style={{ width: `${percentage ?? 0}%` }}
                />
              </div>
            )}
          </ProgressBar>
          {/* MARCUS-LÅST ORDALYDELSE — ändra aldrig ett tecken (PRD TASK-218,
              ADR-112, ORDLISTA "Förberedelseskärmen"). */}
          <p id={textId} className="text-center text-body text-text-secondary">
            Förbereder ditt administrationsverktyg
          </p>
        </div>
      </div>
      {/* Kanal 2 — polite, alltid monterad; se klassdoc-blocket ovan. */}
      <p role="status" aria-live="polite" className="sr-only">
        {besked}
      </p>
    </div>
  );
}
