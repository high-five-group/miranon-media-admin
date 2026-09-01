import { Filter, Printer } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { useState } from 'react';
import { Button as AriaButton, Disclosure, DisclosurePanel } from 'react-aria-components';
import { cn } from '@/lib/cn';
import { Select, SelectItem } from './Select';
import { Skeleton } from './Skeleton';

/**
 * En filterdimension: EN kategorisk axel med ETT val (eller nolläget).
 *
 * Alternativen kommer FÄRDIGSORTERADE från konsumenten — ordningen är
 * domänkunskap, inte layout: event-listans typ/ort är sv-alfabetiska medan
 * status står i basens kanoniska ordning (aldrig alfabetisk). En komponent
 * som sorterade själv hade tvingat fram exakt den drift som EventsLists
 * `STATUS_ORDNING` finns för att förhindra.
 */
export interface FilterDimension {
  /** Unik nyckel inom filtret. Bär `data-testid="filter-<nyckel>"`. */
  nyckel: string;
  /** Dropdownens synliga etikett. Exempel: `Typ`. */
  etikett: string;
  /** Nolläges-alternativet, alltid först. Exempel: `Alla typer`. */
  nollage: string;
  /** Värdena, i visningsordning. Tom lista ⇒ dimensionen renderas inte.
      Utelämnas när `kontroll` är satt — kontrollen äger då sin egen rymd. */
  alternativ?: string[];
  /**
   * KONSUMENT-ÄGD KONTROLL som ersätter dropdownen för just denna dimension.
   * Utelämnad (normalfallet) ⇒ dimensionen renderas som förut, som en
   * `Select` över `alternativ` — ingen befintlig konsument ser någon
   * skillnad.
   *
   * Finns för dimensioner vars värderymd är för STOR för en dropdown.
   * Första konsumenten är anmälningssidans `Event`-dimension: en lista över
   * enskilda event är hundratals poster lång (mätt: 108 i staging
   * 2026-08-23) där typ/ort är en handfull, och en naken `Select` tappar
   * fotfästet långt innan dess. Den slotten bär `EventValjare` — husets
   * egen sök- och månadsgrupperade väljare — i stället för att `FilterRad`
   * själv skulle växa ett andra, sökbart dropdown-läge som bara en
   * dimension på en sida behöver.
   *
   * ANSVARSGRÄNSEN ÄR OFÖRÄNDRAD: kontrollen är bara PRESENTATION.
   * Dimensionen räknas som aktiv på exakt samma villkor som alla andra
   * (`valda[nyckel] != null`), så trattens badge, `Rensa filter` och
   * filter-tomläget fungerar utan att veta vad som renderas här.
   */
  kontroll?: ReactNode;
}

/** Räknarens substantiv, böjt efter NÄMNAREN (`Visar 1 av 3 anmälningar`). */
export interface FilterEnhet {
  ental: string;
  flertal: string;
}

export interface FilterRadProps {
  /**
   * Kontrollen till VÄNSTER om tratt-ingången, typiskt en period-toggel.
   * Den får radens fria bredd; tratten är `shrink-0` bredvid den.
   */
  children?: ReactNode;
  dimensioner: FilterDimension[];
  /** Valt värde per dimensionsnyckel. `null`/saknat = nolläget. */
  valda: Record<string, string | null | undefined>;
  /** Ett val ändrades. `varde === null` ⇒ nolläget (ta bort filtret). */
  onValj: (nyckel: string, varde: string | null) => void;
  /**
   * Rensa-knappen trycktes. Konsumenten nollställer sina värden OCH äger
   * fokusflytten (se `triggerRef`) — knapparna unmountas i samma tryck.
   */
  onRensa: () => void;
  /** Räknarens täljare: antal poster EFTER filtrering. */
  visade: number;
  /** Räknarens nämnare: antal poster FÖRE filtrering, efter övriga axlar. */
  totalt: number;
  enhet: FilterEnhet;
  /** Skeleton i panelens slutgeometri tills källan landat. */
  isPending?: boolean;
  /** Renderar `Skriv ut` i panelfoten. Utelämnad ⇒ ingen utskriftsknapp. */
  onSkrivUt?: () => void;
  /** Ref till tratt-knappen — filter-ytans stabila fokus-ankare. */
  triggerRef?: Ref<HTMLButtonElement>;
  className?: string;
}

/** Nolläges-nyckeln i dropdownsen (`Alla …`) — sentinel skild från datavärden. */
const ALLA = '__alla';

/**
 * Panelens rutnät följer antalet DROPDOWN-dimensioner. Klasserna står som
 * literaler (Tailwind ser aldrig en interpolerad klass) och listan är
 * komplett för 1–4; fler dimensioner än så delar fyrkolumnsformen i stället
 * för att tvinga fram ett nytt steg som ingen konsument har bett om.
 *
 * En dimension med egen `kontroll` räknas INTE — den tar en egen full rad
 * (`col-span-full`), se render-grenen. Skälet är innehållet, inte smaken: en
 * kontroll som skickats hit har per definition en värderymd som inte rymdes
 * i en dropdown, och dess VALDA tillstånd är rikare än ett ord.
 * Anmälningssidans event-väljare visar "kurs · ort · datum" — i en
 * tredjedels kolumn (uppmätt 162,7 px vid 1280) klipps det till ~15 tecken
 * och kontrollen slutar säga vad som är valt. På egen rad ryms hela raden.
 * Konsumenter utan `kontroll` får exakt samma rutnät som förut.
 */
const KOLUMN_KLASS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

function kolumnKlass(antal: number): string {
  return KOLUMN_KLASS[antal] ?? KOLUMN_KLASS[4];
}

/** Antal dimensioner med ett aktivt val. Delad sanning för badge och tomläge. */
export function antalAktivaFilter(
  dimensioner: FilterDimension[],
  valda: Record<string, string | null | undefined>,
): number {
  return dimensioner.filter((d) => valda[d.nyckel] != null).length;
}

/**
 * `Visar 3 av 12 event` — panelfotens räknartext.
 *
 * Exporterad för att konsumentens aria-live-bekräftelse ska kunna bära
 * SAMMA sträng (plus punkt) som den synliga räknaren, i stället för en
 * andra formulering som kan drifta ifrån den.
 */
export function filterRaknartext(visade: number, totalt: number, enhet: FilterEnhet): string {
  return `Visar ${visade} av ${totalt} ${totalt === 1 ? enhet.ental : enhet.flertal}`;
}

/** `Typ: Kurs · Ort: Skövde` — de aktiva valen i läsbar form. */
export function aktivaFilterBeskrivning(
  dimensioner: FilterDimension[],
  valda: Record<string, string | null | undefined>,
): string {
  return dimensioner
    .filter((d) => valda[d.nyckel] != null)
    .map((d) => `${d.etikett}: ${valda[d.nyckel]}`)
    .join(' · ');
}

/**
 * Filtrerings-ingången för en listvy: en RAD (konsumentens egen kontroll +
 * tratt-ingång) med en disclosure-panel under.
 *
 * Formen är EventsLists (task-17.7, S83-prototyp-facit k02, Marcus-låst
 * 2026-07-24) utbruten UTAN omstämpling — samma DOM, samma klasser, samma
 * a11y-mekanik. Research bakom mönstret:
 * `docs/research/filtervy-listor-monster-2026-07-24.md` (disclosure-bar =
 * MOJ-mönstret, NN/g:s live-filtrering vid klientlokal data).
 *
 * - Tratt-ingång HÖGER om `children`; öppen ELLER aktiv bär bg-text-svärtan.
 *   Siffer-badgen är dekor (`aria-hidden`) — sr-only-namnet bär antalet, så
 *   ett aktivt filter syns även med stängd panel (MOJ-affordans-läxan:
 *   *"Users don't always see they can filter"*).
 * - Panelen bär EN dropdown per dimension, `Alla …` som nolläge, ETT val per
 *   dimension och AND över dimensioner. LIVE utan Apply-knapp — NN/g:s
 *   <1 s-villkor är trivialt uppfyllt när datat redan ligger i klienten.
 *   En dimension vars värderymd är för stor för en dropdown skickar i
 *   stället sin egen kontroll (`FilterDimension.kontroll`) — räkningen,
 *   badgen och `Rensa` är oförändrade, se propens docblock.
 * - Panelfoten: räknare · `Rensa filter` vid aktiva val · valfri `Skriv ut`.
 *
 * VAD KOMPONENTEN MEDVETET INTE ÄGER:
 * - **Urvalet.** Den renderar kontroller och räknar; konsumenten filtrerar.
 * - **aria-live-regionen.** Sidan äger sina live-regioner, eftersom samma
 *   region ofta bär flera besked (EventsList delar EN region mellan period-
 *   och filterväxling — Roselli-anatomin: en region per ANSVAR, inte per
 *   komponent). `filterRaknartext()` finns för att strängen ändå ska vara
 *   en enda sanning.
 * - **URL-state.** `nuqs`-kopplingen är sidans kontrakt, inte filtrets.
 *
 * PANEL-ELEMENTET LÄMNAS OSTYLAT (Marcus-fix 2026-07-25, grundorsak
 * verifierad i react-arias useDisclosure-källa): stängd panel döljs med
 * `hidden="until-found"` ⇒ `content-visibility: hidden` — INNEHÅLLET döljs
 * men panel-elementets EGEN bakgrund/padding renderas, så visuella stilar
 * direkt på DisclosurePanel gav en tom grå rand i stängt läge. Bakgrund/
 * padding/rounded/gap bor därför på en INRE wrapper (försvinner med
 * innehållet), och rytmen mellan rad och öppen panel bärs av wrapperns
 * `mt-6` — INTE av gap på roten (ett rot-gap hade lämnat 24 px dött
 * utrymme efter det 0 px höga panel-elementet i stängt läge).
 *
 * `print:hidden` på roten: kontroller är meningslösa på papper
 * (GOV.UK-blacklistens `govuk-!-display-none-print`-idiom).
 *
 * @example
 * ```tsx
 * <FilterRad
 *   dimensioner={[{ nyckel: 'typ', etikett: 'Typ', nollage: 'Alla typer', alternativ: typer }]}
 *   valda={{ typ }}
 *   onValj={(nyckel, varde) => nyckel === 'typ' && setTyp(varde)}
 *   onRensa={rensa}
 *   visade={filtrerade.length}
 *   totalt={alla.length}
 *   enhet={{ ental: 'event', flertal: 'event' }}
 * >
 *   <PeriodToggel />
 * </FilterRad>
 * ```
 */
export function FilterRad({
  children,
  dimensioner,
  valda,
  onValj,
  onRensa,
  visade,
  totalt,
  enhet,
  isPending = false,
  onSkrivUt,
  triggerRef,
  className,
}: FilterRadProps) {
  // Öppet/stängt är HUR-state (URL-STATE-SPEC §Princip) och ägs internt —
  // bara filterVALEN är delbara, och ingen konsument har behövt läsa det.
  const [oppen, setOppen] = useState(false);
  const aktiva = antalAktivaFilter(dimensioner, valda);
  // Kolumnantalet räknas på dropdown-dimensionerna; kontroll-dimensioner tar
  // egen full rad och ska inte krympa de andra (se KOLUMN_KLASS-docblocket).
  const rutnat = `grid gap-3 ${kolumnKlass(dimensioner.filter((d) => d.kontroll == null).length)}`;

  return (
    <Disclosure
      isExpanded={oppen}
      onExpandedChange={setOppen}
      className={cn('flex flex-col print:hidden', className)}
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        {/* Tratt-ingången: öppen/aktiv bär bg-text-svärtan (facit k02);
            badgen är dekor (aria-hidden) — sr-only-namnet bär antalet.
            Badge-texten är text-inverse på accent: ÖPPET BOKFÖRD
            facit-avvikelse från prototypens text-text (2,6:1 mot
            accent-kopparn — WCAG 1.4.3-golvet skärs aldrig). */}
        <AriaButton
          ref={triggerRef}
          slot="trigger"
          className={`relative inline-flex shrink-0 items-center justify-center rounded-full p-2.5 motion-safe:transition-colors ${
            oppen || aktiva > 0 ? 'bg-text text-text-inverse' : 'bg-bg-muted hover:bg-bg-emphasized'
          }`}
        >
          <Filter aria-hidden="true" size={18} className="shrink-0" />
          {aktiva > 0 ? (
            // text-[10px]: ÖPPET BOKFÖRD avvikelse från typografiskalan
            // (spec-regeln no-hardcoded-font-size) — badge-mikrotexten är
            // prototyp-facitets låsta form (k02) och skalan saknar steg
            // under text-caption; ett badge-skalsteg mintas först vid en
            // andra konsument (över-engineering-vakten).
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-medium text-[10px] text-text-inverse"
            >
              {aktiva}
            </span>
          ) : null}
          <span className="sr-only">
            {oppen ? 'Dölj filter' : 'Visa filter'}
            {aktiva > 0 ? `, ${aktiva} ${aktiva === 1 ? 'aktivt' : 'aktiva'} filterval` : ''}
          </span>
        </AriaButton>
      </div>
      <DisclosurePanel data-testid="filter-panel">
        {/* Tonala kortets form på INRE wrappern (se docblocket): allt
            visuellt försvinner med innehållet när until-found döljer panelen. */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-bg-muted p-4">
          {isPending ? (
            // Lugnt laddläge (ADR-078 beslut 2+4): dropdown-formade skelett i
            // SLUTGEOMETRIN (label-rad + sm-fält = samma höjd som Select)
            // tills källan landat — alternativen kan inte härledas ur
            // ingenting, och en tom grid hade hoppat vid datalandningen.
            // Blocken är dekor (Skeleton är alltid aria-hidden); laddbeskedet
            // ägs av listkroppens status-region (Roselli-anatomin — EN region).
            <div className={rutnat}>
              {dimensioner.map((dim) => (
                <div key={dim.nyckel} className="flex w-full flex-col gap-1">
                  <Skeleton variant="text" className="w-10 text-small" />
                  <Skeleton variant="text" className="h-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className={rutnat}>
              {/* En dimension utan värden i källan renderar ingen dropdown:
                  inget att filtrera på är ärligare än en död kontroll. Ett
                  OKÄNT värde (t.ex. ur en handskriven URL) renderas som extra
                  alternativ så triggern kommunicerar vad som faktiskt
                  filtreras på — aldrig RAC:s råa placeholder. */}
              {dimensioner.map((dim) => {
                // KONSUMENT-ÄGD KONTROLL: etiketten är `sr-only` sedan
                // 2026-09-01 (Marcus: *"ta bort rubriken 'Event' över
                // eventväljaren … på komponenten, den behövs inte på
                // anmälningssidan heller"* — alltså på PRIMITIVEN, så den
                // försvinner på båda ytorna samtidigt).
                //
                // BARA DEN VISUELLA RUBRIKEN GÅR. Texten står kvar i
                // tillgänglighetsträdet, så en skärmläsare som läser panelen
                // i ordning fortfarande hör vilken axel kontrollen gäller.
                // Det är också varför detta INTE är en regression: spannet
                // var aldrig ett `label`-element och namngav aldrig
                // kontrollen programmatiskt (kontrollen bär sitt eget
                // tillgängliga namn) — det var ren visuell rubrik, och det
                // är exakt den delen som tas bort.
                //
                // Skälet att kontroll-dimensionen inte behöver sin rubrik
                // medan dropdown-dimensionerna gör det: en `Select` visar
                // bara sitt VALDA värde ("Kurs"), medan `EventValjare`s
                // stängda trigger säger vad den är ("Alla event", eller
                // eventets namn med ikon). Rubriken upprepade alltså vad
                // kontrollen redan sa.
                if (dim.kontroll != null) {
                  return (
                    <div
                      key={dim.nyckel}
                      data-testid={`filter-${dim.nyckel}`}
                      className="flex w-full flex-col gap-1 sm:col-span-full"
                    >
                      <span className="sr-only">{dim.etikett}</span>
                      {dim.kontroll}
                    </div>
                  );
                }
                const alternativ = dim.alternativ ?? [];
                const valt = valda[dim.nyckel] ?? null;
                // ALLA-vakten: ett handskrivet `?typ=__alla` får inte skapa
                // ett dubblett-id bredvid nolläges-itemet (RAC-kollektionen
                // kräver unika nycklar).
                const okantVarde =
                  valt != null && valt !== ALLA && !alternativ.includes(valt) ? valt : null;
                return alternativ.length > 0 ? (
                  <Select
                    key={dim.nyckel}
                    data-testid={`filter-${dim.nyckel}`}
                    label={dim.etikett}
                    size="sm"
                    selectedKey={valt ?? ALLA}
                    onSelectionChange={(k) =>
                      onValj(dim.nyckel, k == null || String(k) === ALLA ? null : String(k))
                    }
                  >
                    <SelectItem id={ALLA}>{dim.nollage}</SelectItem>
                    {alternativ.map((varde) => (
                      <SelectItem key={varde} id={varde}>
                        {varde}
                      </SelectItem>
                    ))}
                    {okantVarde != null ? (
                      <SelectItem id={okantVarde}>{okantVarde}</SelectItem>
                    ) : null}
                  </Select>
                ) : null;
              })}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-border-light border-t pt-3">
            {/* RÄKNARENS SEGMENTERING ÄR AVSIKTLIG — slå INTE ihop spanen
                nedan till `{filterRaknartext(...)}`. Interpolationen ger
                flera textnoder; en enda sträng ger EN, och webbläsaren
                text-shapear per textnod. Hopslagningen mättes till 180
                avvikande pixlar i räknarraden (2880x1994, maxDelta 125) mot
                annars byte-identisk DOM: osynligt för ögat, men en äkta
                renderingsdrift. `filterRaknartext()` bär samma sträng för
                aria-live, där segmentering inte kan påverka något. */}
            {isPending ? (
              <Skeleton variant="text" className="w-32 text-small" />
            ) : (
              <span className="text-small text-text-secondary">
                Visar {visade} av {totalt} {totalt === 1 ? enhet.ental : enhet.flertal}
              </span>
            )}
            <div className="flex items-center gap-2">
              {aktiva > 0 ? (
                <AriaButton
                  onPress={onRensa}
                  className="rounded-full px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
                >
                  Rensa filter
                </AriaButton>
              ) : null}
              {/* Skriv ut = den synliga filtrerade listan — ingen parallell
                  utskriftsvy. Kapseln lyft på surface mot panelens tonala
                  botten. */}
              {onSkrivUt ? (
                <AriaButton
                  onPress={onSkrivUt}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
                >
                  <Printer aria-hidden="true" size={18} className="shrink-0" />
                  Skriv ut
                </AriaButton>
              ) : null}
            </div>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
