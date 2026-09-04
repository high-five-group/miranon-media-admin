import type { LucideIcon } from 'lucide-react';
import { CircleCheck, TriangleAlert } from 'lucide-react';

/**
 * [BIBLIOTEKS-KANDIDAT] StatusBadge — tonal tillstånds-pill (task-18.17
 * byggkrav 3/5; Polaris-idiomet): ikon + ord i en tonal kapsel. EN form för
 * alla tillstånds-utsagor på anmälningssidan (statusraden i headern +
 * behörigheten i Avser) — texten bär ALLTID, tonen förstärker (WCAG 1.4.1:
 * färg/ikon aldrig ensam bärare). Nyskriven mot facit (throwaway-kontraktet
 * — prototypkod absorberas aldrig); promoveras till primitives/ vid andra
 * konsumenten (rule of three-disciplinen, registration-display-precedent).
 *
 * A11y (11): ikonen är aria-hidden (dekorativ förstärkning — bock=klart,
 * triangel=uppmärksamhet); det tillgängliga namnet är exakt badge-texten.
 * Tonala bakgrunder via semantiska tokens (bg-success-bg/bg-warning-bg);
 * texten står i default-textfärgen (AA mot 100-tonerna). prefers-contrast:
 * more får en synlig kant i ikonens ton (tonal platta ensam tunnas annars ut).
 */
/**
 * Pill-skalans TVÅ steg (S93 våg 16; Marcus 2026-08-06: "alla pills [ska] hålla
 * en konsekvent utseendemönster i de olika miljöerna").
 *
 * Stegen är INTE uppfunna här — de är HÄRLEDDA ur en inventering av appens
 * samtliga pillar (23 status-/metadata-förekomster, `rounded-full` + padding,
 * grep över src/ 2026-08-06). Skalan fanns redan de facto; den saknade bara
 * namn, och därför drev den:
 *
 *   `sm`  px-2   py-0.5  text-caption  — 13 förekomster. LIST- och KORT-miljö:
 *         metadata bredvid ett namn i en lista. (Deltagare 1017/1040/1259,
 *         Gruppdynamik 112, PersonsList 144, PersonDetail 113, hållplats-
 *         märket 71, Betalningars egna två …)
 *   `md`  px-2.5 py-1    text-small    — 7 förekomster. DETALJSIDA/HEADER:
 *         sidans status-utsaga. (AnmalanDetail 329/343, EventDetail 255,
 *         Deltagare 1779/1880, deadline-pillen …)
 *
 * `md` är default — det var StatusBadges enda form före denna prop, och
 * anmälnings-detaljsidan (facit-låst 2026-07-24 "Lås den") får därmed exakt
 * samma rendering som förut.
 *
 * TREDJE REGELN, lika viktig som padding och textgrad: varje pill bär
 * `border border-transparent`. Kanten ritas aldrig i normalläge, men den
 * reserverar sin px så att `contrast-more:border-*` kan tändas UTAN att
 * layouten hoppar — och så att en pill med kant och en utan får IDENTISK
 * ytterhöjd. Utan regeln mättes StatusBadge till 24 px bredvid två
 * kantlösa pillar på 22 (S93 våg 16, samma kort). Två pixel, och de syns.
 *
 * VARFÖR PROPPEN BEHÖVDES: badgen skrevs för detaljsidans header och användes
 * sedan i betalningsvyns LISTA, bredvid pillar i `sm`. Marcus såg det direkt —
 * "Obekräftad är störst och har fetstilt … den passar inte lika bra i denna
 * miljö". Rätt svar är inte att krympa badgen överallt, utan att låta miljön
 * välja steg.
 */
const PILL_STORLEK = {
  sm: { kapsel: 'px-2 py-0.5 text-caption', ikon: 13 },
  md: { kapsel: 'px-2.5 py-1 text-small', ikon: 15 },
} as const;

/**
 * TONERNA — EN ANATOMI, TRE BETYDELSER (Marcus dom 2026-09-01).
 *
 * Marcus såg "Förfallen" (kopparfärgad text + klocka) och "Obekräftad"
 * (svart text + varningstriangel, liknande tint) SIDA VID SIDA på inkorgens
 * rader och kallade dem inkonsekventa. De var det på två sätt samtidigt:
 * olika ANATOMI (`rounded` mot `rounded-full`, egen span mot denna komponent)
 * och två VARNINGSSIGNALER på samma rad.
 *
 * Regeln som ersätter båda felen: MAX EN VARNINGSSIGNAL PER RAD.
 *   • `warning` = ÄKTA BRÅDSKA. "Förfallen" är en deadline som passerat —
 *     något har gått fel i tiden. Kopparton + ikon.
 *   • `neutral` = ETT TILLSTÅND, INTE ETT LARM. "Obekräftad" har ett eget
 *     bekräftelseflöde och är det NORMALA läget för en ny anmälan. Den bar
 *     tidigare en varningstriangel (och på två ytor en RÖD pill), vilket
 *     ropade lika högt som den verkliga brådskan bredvid. Neutral text på
 *     neutral tint, UTAN ikon.
 *   • `success` = oförändrad.
 *
 * NEUTRAL HAR INGEN IKON, med avsikt. WCAG 1.4.1 är oberörd — texten bär
 * ALLTID hela utsagan i denna komponent, ikonen har aldrig varit annat än
 * dekorativ förstärkning (`aria-hidden`). En ikon utan larm-betydelse hade
 * bara varit brus.
 *
 * TEXTFÄRGEN ÄR TONENS, inte alltid default. `success`/`warning` behåller
 * default-texten (AA mot 100-tonerna, mätt); `neutral` bär
 * `text-text-secondary` — 7,25:1 mot `bg-bg-muted`, alltså väl över AA — så
 * att den läses som dämpad i förhållande till en warning-pill bredvid.
 */
const TON_FORM = {
  success: {
    kapsel: 'bg-success-bg contrast-more:border-success',
    ikonKlass: 'text-success',
    Ikon: CircleCheck as LucideIcon | null,
  },
  warning: {
    kapsel: 'bg-warning-bg contrast-more:border-warning',
    ikonKlass: 'text-warning',
    Ikon: TriangleAlert as LucideIcon | null,
  },
  neutral: {
    kapsel: 'bg-bg-muted text-text-secondary contrast-more:border-border-strong',
    ikonKlass: 'text-text-secondary',
    Ikon: null as LucideIcon | null,
  },
} as const;

export function StatusBadge({
  ton,
  storlek = 'md',
  ikon,
  children,
}: {
  ton: keyof typeof TON_FORM;
  /** Pill-skalans steg — se PILL_STORLEK. `md` (default) = detaljsida/header;
      `sm` = list-/kortmiljö. */
  storlek?: keyof typeof PILL_STORLEK;
  /**
   * Byter ut tonens standardikon. Finns för att "Förfallen" bär en KLOCKA
   * (tiden är det som gått fel) i stället för warning-tonens triangel — och
   * för att den pillen annars hade behövt vara en egen handrullad span igen,
   * vilket är precis den drift denna komponent finns för att stoppa.
   *
   * Storleken sätts ALDRIG av anroparen: den följer `storlek` ur PILL_STORLEK,
   * så en utbytt ikon aldrig kan hamna i fel skalsteg.
   */
  ikon?: LucideIcon;
  children: string;
}) {
  const form = TON_FORM[ton];
  const skala = PILL_STORLEK[storlek];
  const Ikon = ikon ?? form.Ikon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-transparent font-medium ${skala.kapsel} ${form.kapsel}`}
    >
      {Ikon && (
        <Ikon aria-hidden="true" size={skala.ikon} className={`shrink-0 ${form.ikonKlass}`} />
      )}
      {children}
    </span>
  );
}
