import { Hourglass } from 'lucide-react';

/**
 * [TASK-475] SPEGELNS EFTERSLÄPNING, SAGD SÅ ATT LOTTA FÖRSTÅR DEN.
 *
 * Ersätter `BasenSlaparPill` (TASK-436) och den inline-form `TASK-456` runda 3
 * flyttade till beloppsraden. Marcus fällde ordalydelsen efter ögonmätning av
 * PR #2541, ordagrant 2026-09-19: *"Ser bra ut, men vad betyder 'Basen släpar'?
 * Den texten kan vi inte visa för användaren (Lotta)."*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FORMEN: EN MENING ÖVERST + EN IKON PER RAD
 * ═══════════════════════════════════════════════════════════════════════════
 * Marcus dom på lösningen, ordagrant samma dag: *"det bästa kanske är som du
 * sa att hela meningen står en gång synligt överst i listan när minst en rad
 * berörs, typ 'Databasen har inte hunnit uppdateras för två betalningar.
 * Beloppen här i appen stämmer.'"*
 *
 * Två delar, samma ikon, och det är samma ikon som gör dem till EN utsaga:
 *
 *   • `SpegelSlaparBesked` — hela meningen, EN gång, synligt överst i den
 *     lista där de berörda raderna står. Den är också TECKENFÖRKLARINGEN för
 *     radernas ikon: ingen text på raden behöver upprepa vad ikonen betyder,
 *     eftersom meningen intill bär den.
 *   • `SpegelSlaparMarkor` — radens markering: ikonen ensam, utan synlig text.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR `Hourglass` OCH INTE `AlertTriangle` — MARCUS EGET SKÄL
 * ═══════════════════════════════════════════════════════════════════════════
 * Inget är fel, och Lotta ska inte göra någonting. En varningstriangel säger
 * motsatsen: `TriangleAlert`/`AlertTriangle` är husets VARNINGSSIGNAL
 * (`StatusBadge.tsx` § TON_FORM ger den till warning-tonen; `RegistreraForm`
 * ger den till `over`-fallet). Att låta den bära ett tillstånd som löser sig
 * självt är exakt den falska brådska kortet fälldes för.
 *
 * `Hourglass` är HUSETS NEUTRALA VÄNTAR-IKON, inte en ny uppfinning:
 * `VantelistePaminnelse.tsx` bär den redan i `text-text-muted` för "N personer
 * väntar på plats" — samma ton, samma storlek, samma betydelse (något pågår,
 * ingen åtgärd krävs). Meningens form nedan är också den filens, rad för rad.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SIFFRA, INTE UTSKRIVET RÄKNEORD — HUSETS MÖNSTER, MÄTT
 * ═══════════════════════════════════════════════════════════════════════════
 * Marcus förlaga skrev "för två betalningar". Ordern var att följa husets
 * befintliga mönster för antal i löpande text, och det mönstret är entydigt
 * SIFFRA + böjt substantiv — utan en enda motinstans i `src/`:
 *
 *   `1 kvitto skickat` / `${skickade} kvitton skickade`  (inkorg-harledningar)
 *   `1 person väntar på plats.` / `${antal} personer väntar på plats.`
 *                                                   (VantelistePaminnelse)
 *   `1 dag kvar` / `${dagar} dagar kvar`                 (EventCard)
 *   `${total} förfallen betalning` / `... förfallna betalningar`
 *                                                   (ForfallnaBetalningar)
 *   `${traffar.length} träff` / `... träffar`         (BetalningsInkorg själv)
 *
 * Den strukturellt närmaste förlagan (`VantelistePaminnelse`: neutral
 * informationsrad med `Hourglass` ovanför en lista) bär alltså redan exakt
 * denna form. ORDEN VAR VID FÖRSTA LANDNINGEN OSTÄMPLADE: Marcus "typ"
 * betydde att de gällde först när han sett dem på plats — `ORDLISTA.md` och
 * kortets AC #1 stod därför orörda/obockade i runda 1. Marcus ögonmätte i
 * dev-server 2026-09-19 och stämplade ordagrant: *"Det blir okej."*
 * `ORDLISTA.md` bär ordvalet sedan TASK-475 runda 2.
 */

/**
 * IKONEN ENSAM — ÅTERANVÄND ÖVER TRE YTOR, INTE KOPIERAD (TASK-475 runda 2,
 * granskningsfynd 1). `SpegelSlaparMarkor`/`SpegelSlaparBesked` nedan OCH
 * `InbetalningsLista`s egen beloppsjämförelserad (den enda kvarvarande
 * `AlertTriangle`-ytan för detta budskap i `src/components/betalningar/**`
 * fram till denna runda) delar samma glyf i stället för att var och en
 * hand-skriver sin egen `<Hourglass ... />`. VILKEN ikon och VARFÖR står i
 * blockkommentaren ovan, oförändrat — den domen gäller alla tre ytor.
 * `className` läggs EFTER de fasta klasserna, så en anropares extra klass
 * (t.ex. Beskeds `mt-0.5`) kompletterar i stället för att riskera att
 * skuggas av en senare regel med samma specificitet.
 */
export function SpegelSlaparIkon({ size, className = '' }: { size: number; className?: string }) {
  return (
    <Hourglass
      aria-hidden="true"
      size={size}
      className={['shrink-0 text-text-muted', className].filter(Boolean).join(' ')}
    />
  );
}

/** Meningen som text, delad av båda ytorna och av testerna. */
export function spegelSlaparMening(antal: number): string {
  return antal === 1
    ? 'Databasen har inte hunnit uppdateras för 1 betalning. Beloppet här i appen stämmer.'
    : `Databasen har inte hunnit uppdateras för ${antal} betalningar. Beloppen här i appen stämmer.`;
}

/** Radens mening, i sin helhet — det skärmläsaren får där seende ser ikonen. */
export const SPEGEL_SLAPAR_RADMENING =
  'Databasen har inte hunnit uppdateras för den här betalningen. Beloppet här i appen stämmer.';

/**
 * HELA MENINGEN, EN GÅNG, ÖVERST I LISTAN. Tyst vid noll — `antal` räknar de
 * rader som faktiskt VISAR markören i just denna lista, aldrig fler: en
 * teckenförklaring som räknar rader utanför sin egen lista förklarar ingenting.
 *
 * `items-start` + `mt-0.5` i stället för `items-center`: meningen radbryter på
 * smal skärm, och en centrerad ikon hade då hamnat mitt i textblocket i stället
 * för vid dess första rad.
 */
export function SpegelSlaparBesked({ antal }: { antal: number }) {
  if (antal <= 0) return null;
  return (
    <p
      className="my-0 flex items-start gap-2 text-small text-text-secondary"
      data-testid="spegel-slapar-besked"
    >
      <SpegelSlaparIkon size={16} className="mt-0.5" />
      {spegelSlaparMening(antal)}
    </p>
  );
}

/**
 * RADENS MARKERING: ikonen ensam. Meningen överst bär förklaringen för seende;
 * skärmläsaren får den per rad ur `sr-only`-noden här.
 *
 * `aria-label` PÅ DEN YTTRE SPANNEN VORE FEL, och det är mätt, inte befarat:
 * `biome`s `lint/a11y/useAriaPropsSupportedByRole` fällde exakt det försöket i
 * `TASK-456` runda 2 — ett `<span>` utan explicit roll stödjer inga namngivande
 * ARIA-attribut. `sr-only` är husets väg (samma mönster
 * `event-detail.staging.test.ts:495` redan verifierar med `toHaveClass`).
 *
 * `h-[1lh]` + `align-bottom` ÄR INTE KOSMETIK — arvet från `TASK-456` runda 3,
 * där det mättes: utan dem blir den inline-flexade ikonen radboxens högsta
 * element och drar upp kortet 2,5 px (146,5 mot 144), precis nog för att bryta
 * kravet att alla kort är exakt lika höga. Låst till en radhöjd kan den inte
 * växa.
 */
export function SpegelSlaparMarkor() {
  return (
    <span className="inline-flex h-[1lh] items-center align-bottom" data-testid="rad-spegel-slapar">
      <SpegelSlaparIkon size={13} />
      <span className="sr-only">{SPEGEL_SLAPAR_RADMENING}</span>
    </span>
  );
}
