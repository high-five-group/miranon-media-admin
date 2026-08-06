/**
 * [PROTOTYPE] [S93] — HUVUDPROTOTYPFILEN. KASTBAR KOD (throwaway-kontraktet).
 *
 * DIVERGENS-FRÅGAN (verbatim ur uppdraget, besvarad — se § Konvergens nedan):
 *
 * "Hur ska alternativ C — hållplatsen som ETIKETT — bäras på eventsidans
 * Anmälda deltagare-block: vilken av tre strukturella utföranden (a
 * Radbytet, b Stations-railen, c Nästa steg-panelen) gör 'vad gör jag
 * härnäst' och 'hitta Anna utan förkunskap' självklara för Lotta, och vilka
 * delval låser Marcus?"
 *
 * Underlag: docs/research/hallplats-modellen-eventsidan-2026-07-26.md
 * (Del 6, alternativ C; Del 3, sex undantagsfall; Del 8, åtta öppna frågor).
 *
 * § KONVERGENS (S93 Del 3, 2026-08-03, 8/8 Marcus-kvitterade beslut):
 * variant A — RADBYTET — vann divergensen. B (Stations-railen) och C
 * (Nästa steg-panelen) är FÖRKASTADE och RIVNA ur denna fil i
 * konvergens-passet (`HallplatsToppB`/`HallplatsToppC`-motsvarigheten
 * `HallplatsHarnastPanel`/den gamla `<details>`-formen `AvbokadeRad` —
 * samtliga borta). Kvar: `HallplatsToppA` (nu byggd ut mot HELA den grillade
 * strukturen i `Deltagare.tsx`s DEV-gren) + de delade byggstenarna
 * (`HallplatsMarke`, `HallplatsRad`, `HallplatsSaknasDelta`).
 *
 * Registret därunder (nu EN enad, steg-sorterad lista — se
 * `hallplats-steg-prototyp.ts`s `registerOrdning`) är fortfarande SAMMA
 * `DeltagarListan`/`useMarkeringsLage`-mekanik som produktionskoden, inte en
 * kopia (task-48 byggkrav 4 orört; se Deltagare.tsx:s DEV-grindade gren för
 * wiringen).
 *
 * KASTBAR: rivs med `git rm` på denna fil + `hallplats-steg-prototyp.ts` +
 * återställ prototyp-grenarna i Deltagare.tsx/Betalningar.tsx/EventDetail.tsx.
 */
import { Filter, Printer } from 'lucide-react';
import { useState } from 'react';
import { Button as AriaButton, Disclosure, DisclosurePanel } from 'react-aria-components';
import { Select, SelectItem } from '@/components/primitives/Select';
import {
  HALLPLATS_LABEL,
  type HallplatsSteg,
  harAktivtFilter,
  REGISTER_STEG_LABEL,
  type RegisterFilter,
  type RegisterStegFilter,
  TOMT_REGISTER_FILTER,
  VAG_IN_LABEL,
  type VagInFilter,
} from './hallplats-steg-prototyp';

/**
 * Steg-märket (GEMENSAMT-kravet): litet, diskret, i kortets METAYTA (inte
 * pill-slotten uppe till höger — se KortInnehall:s nya `hallplatsMarke`-prop
 * i Deltagare.tsx). Färgen speglar hur brådskande steget är, texten bär
 * alltid (WCAG 1.4.1 — samma disciplin som resten av blocket).
 *
 * KONVERGENS-PASSET (Del 3 beslut 3): "Steg-märkena (befintliga) är
 * grupperingen" — sedan registrets sektionsrubriker ("Obekräftade"/
 * "Bekräftade") revs är detta märke den ENDA visuella grupperings-signalen
 * per kort.
 */
export function HallplatsMarke({ steg }: { steg: HallplatsSteg }) {
  const ton: Record<HallplatsSteg, string> = {
    'vantar-bekraftelse': 'bg-error-bg text-error',
    'vantar-betalning': 'bg-warning-bg text-warning',
    klar: 'bg-success-bg text-success',
    avbokad: 'bg-bg-muted text-text-muted',
    installt: 'bg-bg-muted text-text-muted',
    'till-vantelista': 'bg-bg-muted text-text-muted',
  };
  return (
    <span
      data-testid="hallplats-marke"
      className={`inline-flex w-fit items-center justify-center rounded-full px-2 py-0.5 text-center font-medium text-caption ${ton[steg]}`}
    >
      {/* ITERATIONSVÅG (Marcus 2026-08-05): "statuspillarna måste ha en låst
          bredd efter den bredaste status-texten. Jag gillar inte när de är
          olika breda."

          BREDDLÅSET ÄR REPOTS EGET MÖNSTER, inte ett nytt: samma osynliga
          grid-platshållare som `MarkeringsBatchBar`s "Bekräfta 99 anmälningar"
          använder — alla varianter i EN grid-cell, den synliga ovanpå, cellen
          blir så bred som den bredaste.

          ALLA SEX ETIKETTER LÄGGS IN, inte "den längsta". Första försöket valde
          längsta etikett på `.length` och mätte 143,69 mot 142,33 px i egen
          granskning — teckenANTAL är fel proxy för renderad BREDD: "Väntar på
          bekräftelse" (21 tecken, breda ä/k/f) är bredare än "På väg till
          väntelistan" (23 tecken, smala i/l/t). Med hela uppsättningen i cellen
          behöver ingen veta vilken som är bredast — layouten avgör, och den kan
          inte ha fel. Nya etiketter följer med automatiskt.

          `aria-hidden` på platshållarna: hjälpmedel ska läsa personens FAKTISKA
          steg, aldrig hela etikettuppsättningen. */}
      <span className="grid">
        {Object.values(HALLPLATS_LABEL).map((label) => (
          <span
            key={label}
            aria-hidden="true"
            className="invisible col-start-1 row-start-1 whitespace-nowrap"
          >
            {label}
          </span>
        ))}
        <span className="col-start-1 row-start-1 whitespace-nowrap">{HALLPLATS_LABEL[steg]}</span>
      </span>
    </span>
  );
}

/**
 * VARIANT A:s byggsten — kastbar kopia av `Deltagare.tsx`:s `SummeringsRad`
 * (samma klasser/struktur, L303-disciplinen: raden är EN knapp, ingen
 * interaktivt-i-interaktivt). Duplicerad hellre än exporterad ur skarpa
 * filen (S86-precedenten: egna märkta prototypfiler där det går).
 *
 * BYGGKRAV 4 (S96, Marcus 2026-08-03) — RADHÖJDS-FYND: `font-medium` sattes
 * tidigare ENDAST via `tonKlass` (error/warning) — "Klara"-radens värde-span
 * (`ton` default `'neutral'` ⇒ tom klass) fick därför font-weight 400 medan
 * de brådskande raderna fick 500, en genuin, ORIENTAD strukturell
 * inkonsekvens i komponentens EGEN klasslogik (inte innehållet). FIXAT:
 * `font-medium` är nu OVILLKORLIG på värde-spannet; `tonKlass` bär ENDAST
 * färgen. Alla värde-siffror i rad-familjen — nuvarande OCH byggkrav 2:s
 * avgifter/slutbetalning nedan — har därmed samma font-vikt, oavsett ton.
 *
 * ÖPPET BOKFÖRT RESTFYND (S96 slutrapport, gäller fortfarande): en separat
 * ~1 px `getBoundingClientRect()`-skillnad kvarstår mellan sista raden i en
 * `divide-y`-stack och raderna ovanför — men den är POSITIONS-bunden, inte
 * innehålls- eller klass-bunden, och finns IDENTISKT i den redan skarpa,
 * oberörda `Betalningar.tsx`s egen `EtikettVardeRad`-lista. En app-bred,
 * förbefintlig sub-pixel-renderingsartefakt — inte en
 * hållplats-prototyp-bugg, och inte åtgärdad här.
 */
export function HallplatsRad({
  term,
  aktiv,
  onClick,
  ton = 'neutral',
  children,
}: {
  term: string;
  aktiv: boolean;
  onClick: () => void;
  /** Färgtonen på värdet när det är > 0 (brådska-signalen). */
  ton?: 'error' | 'warning' | 'neutral';
  children: React.ReactNode;
}) {
  const tonKlass = ton === 'error' ? 'text-error' : ton === 'warning' ? 'text-warning' : '';
  return (
    // ITERATIONSVÅG (Marcus 2026-08-05): "'Klara-raden' är högre än de andra
    // raderna … alla rader måste såklart vara lika höga och se likadana ut i
    // koden också."
    //
    // MÄTT ROTORSAK, inte gissad: raden är 1 px LÄGRE, inte högre (52 mot 53 px
    // — knapphöjd, padding och radhöjd är identiska på alla fyra). Tailwinds
    // `divide-y` på föräldern lägger border-bottom på alla barn UTOM det sista,
    // så sista raden saknade sin pixel. Samma 52 px mättes på "Avbokade", som
    // också är sist i sin stack. Det Marcus SÅG var sannolikt mellanrummet
    // under blocket, som får raden att läsa som högre — men asymmetrin fanns
    // och är det som rättas.
    //
    // Kanten bärs nu av RADEN själv, inte av förälderns `divide-y`: varje rad
    // är därmed identisk i koden (Marcus krav) och alla får samma 53 px,
    // inklusive den sista. Blocket avslutas med en kant precis som varje annan
    // rad — konsekvent, och den markerar samtidigt blockgränsen mot nästa stack.
    <div className="flex flex-col border-border border-b py-2">
      <button
        type="button"
        aria-pressed={aktiv}
        onClick={onClick}
        className={`-mx-2 flex w-auto items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-left hover:bg-bg-emphasized motion-safe:transition-colors ${
          aktiv ? 'bg-bg-emphasized' : ''
        }`}
      >
        <span className="flex items-center gap-1.5 text-small text-text-muted">{term}</span>
        <span className={`text-right font-medium text-body tabular-nums ${tonKlass}`}>
          {children}
        </span>
      </button>
    </div>
  );
}

/**
 * Röd saknas-delta i EXAKT Betalningar-blockets grammatik (`SaknasDelta`-
 * kopia, kastbar — samma tvärimport-skäl som `betalKlar`/`harPaminnelse` i
 * hallplats-steg-prototyp.ts: Betalningar.tsx är en ANNAN skarp fil och rörs
 * inte av detta pass). Byggkrav 2 (S96).
 */
function HallplatsSaknasDelta({ antal }: { antal: number }) {
  if (antal <= 0) return null;
  return <span className="ml-2 font-medium text-error tabular-nums">{`−${antal}`}</span>;
}

/**
 * ITERATIONSVÅG (Marcus 2026-08-05): "'5 av 12 mottagna' och '3 mottagna' är i
 * fetstil, det bör de inte vara."
 *
 * `HallplatsRad`s värde-span bär `font-medium` OVILLKORLIGT sedan byggkrav 4
 * (S96) — den ändringen fanns för att jämna ut radhöjden mellan toner, och
 * den regeln står kvar. Men på de två betalningsraderna är värdet inte bara
 * en siffra utan en HEL MENING, och `font-medium` träffade då även orden.
 * Räkneraderna med rent tal ("Väntar på bekräftelse", "Klara") är oförändrade.
 *
 * Formen är den gängse i sifferrader: VÄRDET bär vikten, ENHETEN gör det inte.
 * Färgen rörs inte — bara vikten var det Marcus pekade på.
 */
function HallplatsTalOchText({ tal, text }: { tal: number; text: string }) {
  return (
    <>
      {tal}
      <span className="font-normal">{` ${text}`}</span>
    </>
  );
}

/**
 * Byggkrav 2:s split-data (S96) — "Väntar på betalning" ersätts av två
 * räknerader i Betalningar-blockets EGNA grammatik ("Anmälningsavgifter — x
 * av y mottagna −n" / "Slutbetalningar — x mottagna −n"). Siffrorna är
 * Deltagare.tsx:s ansvar, härledda ur `betalningsSplit()`
 * (hallplats-steg-prototyp.ts) — SAMMA funktion `Betalningar.tsx`s eget block
 * anropar för sina motsvarande rader (S96 review-fix, se funktionens
 * docblock för rotorsaksfyndet: en tidigare egen inline-uträkning i
 * `Betalningar.tsx` divergerade tyst från denna sidas tal). Denna komponent
 * lägger bara ut dem i radgrammatiken.
 */
export type HallplatsBetalningsSplit = {
  avgifterMottagna: number;
  avgifterTotalt: number;
  avgifterSaknas: number;
  slutMottagna: number;
  slutSaknas: number;
  /** ITERATIONSVÅG: samma stegaxel som räknarna ovan skriver — betalnings-
      raderna hade förut ett EGET filter-state ('avgift' | 'slut'), vilket var
      en av de fyra parallella som nu är enade. */
  aktivFilter: RegisterStegFilter | null;
  onFilterClick: (typ: RegisterStegFilter) => void;
};

export type HallplatsCounts = {
  'vantar-bekraftelse': number;
  'vantar-betalning': number;
  klar: number;
};

/**
 * [PROTOTYPE] [S93] REGISTRETS FILTERRAD (ITERATIONSVÅG, Marcus 2026-08-05).
 *
 * Marcus: "'Alla/Manuella/Medföljande-togglen' behöver byggas om … jag funderar
 * på om vi ska sätta in exakt den filtrerings-lösningen vi har på eventsidan.
 * Då kan Lotta filtrera som hon vill, och då kan vi även få in utskriftsknapp
 * där precis som det är på eventfiltreringen. Frågan är var vi ska göra av
 * Markera-knappen och 'rensa filtret-knappen', de kan inte sitta där de gör,
 * ser fult ut."
 *
 * MÖNSTRET ÄR EVENTLISTANS, inte ett nytt: `EventsList.tsx` (task-17.7) bär
 * redan tratt-ingången med aktiv-badge, dropdown-panelen, "Visar X av Y" i
 * foten, Rensa filter och Skriv ut — research-grundat i
 * `docs/research/filtervy-listor-monster-2026-07-24.md`. Formen kopieras hit
 * i stället för att uppfinnas.
 *
 * TRE LÖSA KONTROLLER BLIR EN RAD: fliken (Alla/Manuella/Medföljande), den
 * högerställda "Rensa filtret" och den högerställda "Markera" satt var för sig
 * på egna rader. Nu står tratten till vänster och Markera till höger på SAMMA
 * rad; Rensa flyttar in i panelfoten där eventlistan har den.
 *
 * UTSKRIFTEN HÄR ÄR REGISTRETS — den synliga, filtrerade listan (Del 3 beslut
 * 3: "utskriften = hela registret med märken"). Sidans utskrift är en ANNAN
 * knapp, uppe vid åtgärds-ingången; Marcus ville ha båda.
 */
export function RegisterFilterRad({
  filter,
  onFilterChange,
  visadeAntal,
  totaltAntal,
  markeraKnapp,
}: {
  filter: RegisterFilter;
  onFilterChange: (f: RegisterFilter) => void;
  visadeAntal: number;
  totaltAntal: number;
  /** Markera-knappen monteras av `ArbetsKo` (den äger markerings-läget) men
      RENDERAS här, på filterradens högerkant — Marcus placering. */
  markeraKnapp: React.ReactNode;
}) {
  const [oppen, setOppen] = useState(false);
  const aktiva = harAktivtFilter(filter);
  return (
    <Disclosure
      isExpanded={oppen}
      onExpandedChange={setOppen}
      className="flex flex-col print:hidden"
    >
      {/* PUNKT 4 (Marcus 2026-08-06): "Filtreringsknappen behöver flyttas så
          den sitter på höger sidan till höger om markeraknappen."

          Raden var `justify-between` med tratten längst till vänster och
          Markera längst till höger — eventlistans form, där tratten sitter
          bredvid en periodväxlare som fyller vänsterkanten. Här finns ingen
          sådan granne, så tratten stod ensam i tomrummet. Nu är båda
          högerställda med Markera FÖRE tratten, i den ordning Marcus angav. */}
      <div className="flex items-center justify-end gap-2">
        {markeraKnapp}
        {/* Tratt-ingången — EXAKT eventlistans form (facit k02): svärtad när
            öppen eller när filter är aktiva, accent-badge med antalet, och
            sr-only-namnet som bär antalet för hjälpmedel (badgen är dekor). */}
        <AriaButton
          slot="trigger"
          className={`relative inline-flex shrink-0 items-center justify-center rounded-full p-2.5 motion-safe:transition-colors ${
            oppen || aktiva > 0 ? 'bg-text text-text-inverse' : 'bg-bg-muted hover:bg-bg-emphasized'
          }`}
        >
          <Filter aria-hidden="true" size={18} className="shrink-0" />
          {aktiva > 0 ? (
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
      <DisclosurePanel data-testid="register-filter-panel">
        <div className="mt-3 flex flex-col gap-4 rounded-2xl bg-bg-muted p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              data-testid="filter-steg"
              label="Visa"
              size="sm"
              selectedKey={filter.steg ?? ALLA_VAL}
              onSelectionChange={(k) =>
                onFilterChange({
                  ...filter,
                  steg:
                    k == null || String(k) === ALLA_VAL ? null : (String(k) as RegisterStegFilter),
                })
              }
            >
              <SelectItem id={ALLA_VAL}>Alla i registret</SelectItem>
              {(Object.keys(REGISTER_STEG_LABEL) as RegisterStegFilter[]).map((v) => (
                <SelectItem key={v} id={v}>
                  {REGISTER_STEG_LABEL[v]}
                </SelectItem>
              ))}
            </Select>
            <Select
              data-testid="filter-vag-in"
              label="Väg in"
              size="sm"
              selectedKey={filter.vagIn ?? ALLA_VAL}
              onSelectionChange={(k) =>
                onFilterChange({
                  ...filter,
                  vagIn: k == null || String(k) === ALLA_VAL ? null : (String(k) as VagInFilter),
                })
              }
            >
              <SelectItem id={ALLA_VAL}>Alla vägar in</SelectItem>
              {(Object.keys(VAG_IN_LABEL) as VagInFilter[]).map((v) => (
                <SelectItem key={v} id={v}>
                  {VAG_IN_LABEL[v]}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 border-border-light border-t pt-3">
            <span className="text-small text-text-secondary">
              {`Visar ${visadeAntal} av ${totaltAntal} i registret`}
            </span>
            <div className="flex items-center gap-2">
              {aktiva > 0 ? (
                <AriaButton
                  onPress={() => onFilterChange(TOMT_REGISTER_FILTER)}
                  className="rounded-full px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
                >
                  Rensa filter
                </AriaButton>
              ) : null}
              <AriaButton
                onPress={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
              >
                <Printer aria-hidden="true" size={18} className="shrink-0" />
                Skriv ut
              </AriaButton>
            </div>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}

/** Nollägets id i dropdownarna — `null` går inte att bära som RAC-nyckel. */
const ALLA_VAL = '__alla';

/**
 * VARIANT A — tre rader, exakt SummeringsRad-grammatiken.
 *
 * `betalning` (byggkrav 2, S96 — sedan konvergens-passet OVILLKORLIG: enda
 * kvarvarande variant, se § Konvergens i filens toppkommentar): ersätter
 * mittraden ("Väntar på betalning") med TVÅ rader (Anmälningsavgifter/
 * Slutbetalningar) i Betalningar-blockets egen grammatik. Var tidigare
 * optional (variant B/C:s samma komponent-anrop utelämnade propen) — de
 * varianterna är rivna, så det finns bara EN anropare kvar och den skickar
 * alltid propen.
 */
export function HallplatsToppA({
  counts,
  filter,
  onFilterClick,
  betalning,
}: {
  counts: HallplatsCounts;
  filter: RegisterStegFilter | null;
  onFilterClick: (steg: RegisterStegFilter) => void;
  betalning: HallplatsBetalningsSplit;
}) {
  return (
    // `divide-y` borttagen — varje HallplatsRad bär sin egen kant, se dess
    // docblock (lika höjd + kod-symmetri, Marcus 2026-08-05).
    <div>
      <HallplatsRad
        term={HALLPLATS_LABEL['vantar-bekraftelse']}
        aktiv={filter === 'vantar-bekraftelse'}
        onClick={() => onFilterClick('vantar-bekraftelse')}
        ton={counts['vantar-bekraftelse'] > 0 ? 'error' : 'neutral'}
      >
        {counts['vantar-bekraftelse']}
      </HallplatsRad>
      <HallplatsRad
        term="Anmälningsavgifter"
        aktiv={betalning.aktivFilter === 'avgift-saknas'}
        onClick={() => betalning.onFilterClick('avgift-saknas')}
      >
        <HallplatsTalOchText
          tal={betalning.avgifterMottagna}
          text={`av ${betalning.avgifterTotalt} mottagna`}
        />
        <HallplatsSaknasDelta antal={betalning.avgifterSaknas} />
      </HallplatsRad>
      {/* ITERATIONSVÅG (Marcus 2026-08-05, punkt 1): "Det ska vara 'Klara'".
          Raden räknar `slutKlar` = Mottagen ELLER Ej relevant — en föreläsning
          utan slutbetalning är FÄRDIG, inte "mottagen". Ordet var en term-drift
          som blev synlig när `betalningsSplit()` enade talen (S96 review-fix).
          AVGIFTSRADEN ovan behåller "mottagna" på Marcus beslut: den har inget
          Ej relevant-fall, så där är ordet fortfarande sant. */}
      <HallplatsRad
        term="Slutbetalningar"
        aktiv={betalning.aktivFilter === 'slut-saknas'}
        onClick={() => betalning.onFilterClick('slut-saknas')}
      >
        <HallplatsTalOchText tal={betalning.slutMottagna} text="klara" />
        <HallplatsSaknasDelta antal={betalning.slutSaknas} />
      </HallplatsRad>
      <HallplatsRad term="Klara" aktiv={filter === 'klar'} onClick={() => onFilterClick('klar')}>
        {counts.klar}
      </HallplatsRad>
    </div>
  );
}
