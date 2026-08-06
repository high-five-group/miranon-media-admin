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
import { Printer } from 'lucide-react';
import { useState } from 'react';
import { Disclosure, DisclosurePanel } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
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
 * `docs/research/filtervy-listor-monster-2026-07-24.md`. STRUKTUREN kopierades
 * hit i stället för att uppfinnas.
 *
 * MEN FORMEN HAR DIVERGERAT sedan iterationsvåg 3 (Marcus 2026-08-06,
 * punkt 1–4), och det är avsiktligt: eventlistans kontroller är handrullade
 * piller (`rounded-full`, ~37 px), medan sidans övriga knappar går via
 * `Button`-primitiven (`rounded` 4 px, `min-h-8` 32 px). De två språken möttes
 * på denna rad — Markera intill tratten — och det var den skillnaden Marcus
 * fyra punkter beskrev. Kontrollerna här går nu via primitiven. Eventlistan
 * är PRODUKTIONSKOD och lämnades ORÖRD på Marcus scope-beslut ("vi håller oss
 * till prototypen"); den divergensen är alltså känd och bokförd, inte drift.
 * Migreringen av eventlistan + appens övriga handrullade knappar är Marcus
 * punkt 4, deferrad till tråd-registret.
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
  avbokadeAntal,
  markeraKnapp,
}: {
  filter: RegisterFilter;
  onFilterChange: (f: RegisterFilter) => void;
  visadeAntal: number;
  totaltAntal: number;
  /** TALENS OLIKA BASER (Marcus 2026-08-06) — se fotens docblock nedan. */
  avbokadeAntal: number;
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
      {/* PLACERINGENS TREDJE VÄNDA (Marcus 2026-08-06, iterationsvåg 4):
          "båda knapparna 'Markera' och 'Filtrera' bör flyttas till vänster
          sida istället."

          Historiken, för den som undrar varför raden bytt sida två gånger:
          först `justify-between` (tratten vänster, Markera höger — eventlistans
          form, där tratten har en periodväxlare som granne på vänsterkanten;
          här fanns ingen sådan granne, så tratten stod ensam i tomrummet) →
          sedan båda HÖGERSTÄLLDA på Marcus punkt 4 i iterationsvåg 2 → nu båda
          VÄNSTERSTÄLLDA. Det som ändrades däremellan är att tratten fick text
          i stället för ikon (se nedan): två textknappar har en helt annan
          tyngd på raden än en textknapp plus en liten ikonruta, och
          vänsterkanten är där ögat börjar läsa.

          Inbördes ordning OFÖRÄNDRAD — Markera före Filtrera, den ordning
          Marcus angav i iterationsvåg 2 och upprepade nu. */}
      <div className="flex items-center justify-start gap-2">
        {markeraKnapp}
        {/* ITERATIONSVÅG 3 (Marcus 2026-08-06, punkt 2): "byta ut den runda
            filtreringsknappen ... till en rektangulär knapp precis som
            Markera-knappen bredvid ... bakgrundsfärgen ska vara den som är vid
            hover just nu ... kolla vad vi har för befintliga lösningar."

            DEN BEFINTLIGA LÖSNINGEN SATT PÅ SAMMA RAD: `Button`-primitivens
            `emphasis="subtle"` — det är formen Markera-knappens tvillingform
            (`Avbryt`, Deltagare.tsx) redan bär i markeringsläge. Att gå via
            primitiven i stället för att handplocka `bg-bg-emphasized` ger tre
            saker på köpet som en handrullad knapp aldrig får: samma `rounded`
            (4 px) som Markera — punkt 1 · samma `min-h-8` (32 px) som sidans
            övriga knappar — punkt 4 · `contrast-more`-kanten (11-golvet).

            RESULTATET LIGGER NÄRA ORDALYDELSEN — MÄTT, inte antaget. Marcus
            bad om nuvarande HOVER-färg (`bg-bg-emphasized` = `rgb(237,238,233)`).
            `subtle` är primärfärgen vid 10 %, och eftersom detta systems
            primär är nästan svart (`rgb(40,41,40)`, inte en kulör) blir ytan
            NEUTRALT GRÅ — inte tonad i någon färg. På panelens bakgrund landar
            den kring `rgb(224,225,222)`: samma familj som referensen, en aning
            mörkare, alltså om något tydligare än vad som begärdes.

            HOVER byttes ut som Marcus bad om: 10 % → 16 % (renderat ca
            `rgb(212,213,210)`). Skillnaden är avsiktligt återhållen — det är
            primitivens egen `subtle`-trappa, delad med varje annan knapp i
            appen. Vill Marcus ha ett kraftigare hopp är det tokens i
            `components.css` som ska ändras, inte denna knapp lokalt.

            AKTIV-LÄGET behåller sin distinkta signal, men i systemets form:
            solid primär i stället för handrullad `bg-text`.

            IKONEN RIVEN, TEXT I STÄLLET (Marcus 2026-08-06, iterationsvåg 4):
            "Filtrera-knappens ikon bör bytas ut mot texten 'Filtrera'."
            Ordet ERSÄTTER tratten, står inte bredvid den — knappen är nu
            teckenmässigt samma sorts objekt som Markera intill, vilket är hela
            poängen med att de flyttades ihop till vänsterkanten.

            BADGEN STÅR KVAR och är fortsatt `aria-hidden` dekor: den bär
            antalet aktiva filterval, vilket texten "Filtrera" inte gör.
            sr-only-namnet bär samma antal för hjälpmedel — men säger inte
            längre "Visa/Dölj filter", eftersom den synliga texten nu bär
            knappens namn och `Disclosure` bär öppet/stängt via
            `aria-expanded`. Att låta sr-only upprepa ett namn som redan står
            skrivet vore precis den överflödiga a11y-struktur som rev två CI-
            grindar i iterationsvåg 2. */}
        <Button
          slot="trigger"
          intent="primary"
          emphasis={oppen || aktiva > 0 ? 'solid' : 'subtle'}
          size="sm"
          className="relative shrink-0"
        >
          Filtrera
          {aktiva > 0 ? (
            <>
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-medium text-[10px] text-text-inverse"
              >
                {aktiva}
              </span>
              <span className="sr-only">{`, ${aktiva} ${aktiva === 1 ? 'aktivt' : 'aktiva'} filterval`}</span>
            </>
          ) : null}
        </Button>
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
            {/* TALENS OLIKA BASER (Marcus 2026-08-06): "topp-räknarna räknar
                aktiva (12) medan registret nu visar ALLA (14, inkl. två
                avbokade). '5 av 12 mottagna' bredvid 'Visar 14 av 14' kan
                läsas som en motsägelse."

                KROCKEN ÄR ÄKTA och uppstod i iterationsvåg 1: avbokade togs in
                i registret (Marcus punkt 3, 2026-08-05) men topp-räknarna
                behöll sin bas i `aktiva`. Att ge toppen samma bas vore FEL —
                en avbokad ska inte räknas som "saknar betalning", då hade
                `avgifterSaknas` ljugit i stället.

                FIXEN SITTER HÄR för att det är HÄR 14:an föds. Ett första
                försök la en "Avbokade"-rad i `HallplatsToppA`; DOM-mätningen
                visade då två identiska knappar 197 px isär — raden fanns redan
                i logistik-gruppen. Informationen SAKNADES alltså aldrig, den
                stod bara 200 px från talet den förklarar.

                ORDVALET undviker "aktiva": det är ett begrepp Lotta aldrig
                sett, infört för att lappa ett tal (Gunilla-principen — hon ska
                FÖRSTÅ, inte få en idé). "2 av dem är avbokade" räcker för att
                12 + 2 = 14 ska gå ihop, och pekar mot raden som redan finns.

                Tillägget hänger på TOTALEN, inte på `visadeAntal`: 14 = 12 + 2
                oavsett vad filtret just nu visar. Noll avbokade ⇒ inget
                tillägg — då finns ingen krock att förklara. */}
            <span className="text-small text-text-secondary">
              {`Visar ${visadeAntal} av ${totaltAntal} i registret`}
              {avbokadeAntal > 0
                ? ` — ${avbokadeAntal} av dem ${avbokadeAntal === 1 ? 'är avbokad' : 'är avbokade'}`
                : ''}
            </span>
            {/* ITERATIONSVÅG 3 (Marcus 2026-08-06, punkt 3): "Skriv ut-knappen
                på Anmälda blockets filtrering kanske ska nog ha samma
                bakgrundsfärg som blocket så den inte syns i normalt läge,
                endast vid hover liksom."

                Det ÄR `intent="ghost"`: transparent i vila, `bg-muted` först
                vid hover. Den formen fanns redan — och satt redan på raden,
                i "Rensa filter" bredvid, som aldrig burit någon platta. Den
                gamla `bg-surface`-plattan var faktiskt det ljusaste elementet
                i en `bg-bg-muted`-panel, alltså det som stack ut mest.

                HELA FOTEN TOGS SAMLAT, inte bara Skriv ut: hade bara den ena
                bytt form hade den stått bredvid ett kvarvarande piller, och
                inkonsekvensen punkt 1 vill bort från vore flyttad en meter i
                stället för borttagen. Nu bär båda samma primitiv, samma
                `rounded`, samma 32 px. */}
            <div className="flex items-center gap-2">
              {aktiva > 0 ? (
                <Button
                  intent="ghost"
                  size="sm"
                  onPress={() => onFilterChange(TOMT_REGISTER_FILTER)}
                >
                  Rensa filter
                </Button>
              ) : null}
              <Button intent="ghost" size="sm" onPress={() => window.print()}>
                <Printer aria-hidden="true" size={18} className="shrink-0" />
                Skriv ut
              </Button>
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
      {/* TALENS OLIKA BASER (Marcus 2026-08-06) löstes INTE här — en
          "Avbokade"-rad lades först till på denna plats och REVS igen när
          DOM-mätningen visade två identiska knappar 197 px isär: raden fanns
          redan, i logistik-gruppen (`Deltagare.tsx`, intill Eventinfo skickad
          och Bor över). Upplysningen bor nu i registrets fot i stället, där
          talet 14 faktiskt föds — se `RegisterFilterRad`. */}
    </div>
  );
}
