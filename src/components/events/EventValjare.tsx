import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronsUpDown, X } from 'lucide-react';
import { type Ref, useEffect, useId, useMemo } from 'react';
import {
  Button as AriaButton,
  Input as AriaInput,
  Select as AriaSelect,
  Autocomplete,
  Header,
  ListBox,
  ListBoxSection,
  Popover,
  SearchField,
  SelectValue,
  useFilter,
} from 'react-aria-components';
import { SelectItem } from '@/components/primitives/Select';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { kursfargForKurs } from '@/lib/kursfarg';
import { queryKeys } from '@/queries/keys';
import { datumSpannText } from './detail/datumSpann';
import { dateValue, eventName } from './EventCard';
import { groupByMonth } from './manadsgrupp';

/**
 * Sentinel-nyckeln för det KONTEXTLÖSA alternativet (opt-in `gemensamtAlternativ`).
 * Dubbla understreck så den aldrig kan kollidera med ett Airtable-record-ID
 * (`rec…`), som är den enda andra nyckelrymden i listan.
 */
const GEMENSAMT_KEY = '__gemensamt';

/**
 * Eventväljaren — delad väljar-komponent med TVÅ ytor (biblioteks-beviset,
 * dubbel-output-visionen): manuell anmälan-sidan (task-18.18, `form=
 * "kontextrad"`) och eventdetaljsidan (task-18.19, `form="rubrik"` — väljaren
 * ÄR rubriken, variant A). S83 pass 4-facit, Marcus-låst 2026-07-24.
 * Branschledar-precedent: Linear (New issue-teamväljaren) · Stripe
 * (kundväljaren på create-payment + objekt-switchern) · Notion · Airtables
 * record-navigering. Popover-/list-/sök-maskineriet är IDENTISKT mellan
 * formerna — endast triggern växlar.
 *
 * RUBRIK-FORMEN (18.19, facit punkt 1): h1 = eventnamnet i full rubrikstorlek
 * med chevron-par (18 px — §14-standarden; facitets 20 revs öppet i våg 2
 * för rubrik-utrymmet); hela ytan klickbar i hover-plattans grammatik
 * (-mx-2 px-2 py-1 rounded-lg + bg-emphasized; K54-vaktens ande: breddtaket
 * är kolumnen + eget mx-överhäng, aldrig w-full). RUBRIKEN RADBRYTER ALDRIG
 * (Marcus-fix 2026-07-25): namn-spannet är nowrap; RUBRIKEN SKA RYMMA
 * verkliga kursnamn (våg 2: RIM 3 på EN rad — sidytan ger radens utrymme,
 * se EventDetail-headerns pill-vikning) och truncate med ellipsis står kvar
 * ENBART som extremnamns-skyddsnät. Truncaten är ENBART visuell: accessible
 * name är HELA namnet (accname beräknas ur textinnehållet, inte ur
 * CSS-klippningen). RUBRIK-SEMANTIKEN: h1:ans accessible name är EXAKT
 * eventnamnet — triggern aria-labelledby:as till namn-spannet (aldrig
 * "Välj event"-etiketten, som hade förorenat rubriken); "vad kontrollen gör"
 * bärs av aria-description ("Byt event") + aria-haspopup (Stripe-formen:
 * objektnamnet ÄR triggern).
 *
 * KOMPONENTVALET (beslut d, omlandat Select → ComboBox eftersom sök ingår):
 * byggd på React Arias EGEN dokumenterade sökväljar-form — `Select` (rik
 * trigger) + `Autocomplete` + `SearchField` + `ListBox` i Popover
 * (react-aria.adobe.com/Select § "Autocomplete with SearchField"), samma
 * combobox-maskineri i popover-form: sökfältet styr listboxen med virtuell
 * fokus (aria-activedescendant), piltangenter navigerar, Enter väljer,
 * Escape stänger. Den inline-formen av ComboBox (alltid synligt textfält)
 * kan inte rendera facitets stängda läge — en rik kontextrad utan fält —
 * så popover-formen är React Aria-vägen till det låsta facitet; öppet
 * bokfört på kortet. Prototypens råa input/lista är EJ förlagan (punkt 12).
 *
 * STÄNGDA LÄGET bär B-formens kontextrad (kursfärgs-prick + namn
 * font-medium + ort + kollapsat datumspann) — väljaren bär IDENTITETEN
 * (punkt 3): vit (`bg-surface`) på grå kortyta, hover `bg-bg-muted`.
 * FAST BREDD (facit-komplettering, Marcus-beslut 2026-07-25 — bredden var
 * aldrig låst i S83-facitet och triggern växte med innehållet): stängda
 * triggern sträcker sig hela vägen över sitt block (`w-full`) med samma
 * marginal mot blockkanten på höger sida som på vänster (symmetrin bärs av
 * kortets `px-4`); chevronen står vid högerkanten via `ml-auto`. K54-vakten
 * respekteras: ingen `-mx-2` i denna form.
 * TOMT LÄGE (ingen `valtEventId`): fristående full bredd-form som sidans
 * enda handling (punkt 7): `rounded-2xl border bg-surface px-4 py-4`,
 * kalender-ikon + "Välj event" — samma fulla bredd som valda läget.
 *
 * LISTAN (punkt 8–10): sök från start (USWDS-tröskeln >15 val — staging har
 * 11 och listan växer monotont), matchar namn ELLER ort (textValue bär
 * båda); sökfältet får fokus när listan öppnas via `autoFocus` på
 * SearchField — React Arias EGEN dokumenterade form för Select+Autocomplete
 * (react-aria.adobe.com/Select § "Autocomplete with SearchField" och
 * /Autocomplete § "with Select": båda exemplen bär `<SearchField autoFocus>`;
 * propen registreras INUTI RAC:s fokusmaskineri). Ursprungsformens
 * "programmatiskt, aldrig autoFocus" (facit punkt 8) REVS ÖPPET av Marcus
 * våg 2-beslut 2026-07-25: den externa rAF-fokusen var ett race mot RAC:s
 * egen öppnings-fokusering och tappade fokus i verklig användning
 * (prototyp-regressionen — prototypen fokuserade direkt vid öppning).
 * Kommande event närmast först; månadsgrupperade i EventsLists EGEN
 * rubrikform via delade `groupByMonth` (punkt 9 — lyftet är skivans krav).
 *
 * ═══ DET KONTEXTLÖSA ALTERNATIVET (`gemensamtAlternativ`, opt-in) ═══
 *
 * Dokument-ytan har två lägen på SAMMA axel som väljaren styr: ett valt
 * event, eller inget event alls (räckviddsläget — ORDLISTA.md § Gemensam
 * bilaga). Innan denna prop bars lägesbytet av en egen knapp längst ner i
 * dokumentlistan ("Visa gemensamma dokument"), vilket gav ytan TVÅ kontroller
 * på samma axel: väljaren valde event, knappen valde "inget event". Marcus
 * fällde formen 2026-08-18: *"knappen 'Visa gemensamma dokument' förändrar ju
 * hela tillståndet på listan … detta är inte bra."* Knappens etikett var
 * dessutom falsk — eventläget VISAR redan gemensamma bilagor (`get-event-
 * attachments` unionerar dem, ADR-118 beslut 2); det knappen egentligen gjorde
 * var att gå till förvaltningsytan.
 *
 * Propen gör axeln till EN kontroll: en rad överst i listan, vald när
 * `valtEventId` är utelämnad. Stängda läget visar då etiketten i stället för
 * "Välj event" — väljaren säger alltid VAR du är, aldrig att ett val saknas.
 *
 * OPT-IN med avsikt: manuell anmälan (18.18) och eventdetaljsidan (18.19)
 * har inget meningsfullt kontextlöst läge — en anmälan utan event är inget,
 * och detaljsidan ÄR ett event. De skickar inte propen och är oförändrade,
 * inklusive sina testkontrakt på "Välj event" som accessible name.
 *
 * Datakällan är listcachen (`events.list` — samma nyckel som event-listan):
 * varm vid navigering från listan; kall djuplänk startar hämtningen vid
 * mount (sidans primära interaktion är väljaren — ADR-078: ingen väntan på
 * data vi redan har, golvet deklareras).
 */
export function EventValjare({
  valtEventId,
  valtEvent,
  onByte,
  isDisabled,
  form = 'kontextrad',
  rubrikRef,
  onAvsikt,
  gemensamtAlternativ,
}: {
  /** Valt event-ID (djuplänken/URL:en). Utelämnad = tomt läge (punkt 7). */
  valtEventId?: string;
  /** Eventdata för stängda lägets kontextrad (placeholder eller detalj). */
  valtEvent?: Event;
  /** Byte/val: navigerar URL:en (beslut a/13) — väljaren äger inget state. */
  onByte: (eventId: string) => void;
  isDisabled?: boolean;
  /** Triggerns form: 'kontextrad' (18.18-ytan) eller 'rubrik' — väljaren ÄR
      h1:an (18.19 variant A). List-/sök-maskineriet är identiskt. */
  form?: 'kontextrad' | 'rubrik';
  /** h1-elementet i rubrik-formen (sidans fokusmål vid laddning). */
  rubrikRef?: Ref<HTMLHeadingElement>;
  /** Avsikts-signal (hover) på en listrad — prefetch-krok (ADR-078 beslut 3).
      Anropas med radens event-ID; konsumenten äger vad som värms. */
  onAvsikt?: (eventId: string) => void;
  /** Opt-in kontextlöst alternativ överst i listan — se komponent-huvudet.
      Etikett och handling i ETT objekt, så formen aldrig kan hamna i ett
      halvtillstånd (etikett utan handler, eller tvärtom). Utelämnad = ingen
      sådan rad, och komponenten beter sig exakt som före propen. */
  gemensamtAlternativ?: { etikett: string; onValj: () => void };
}) {
  const dataSource = useDataSource();
  const { contains } = useFilter({ sensitivity: 'base' });
  // Rubrik-formens labelling (rubrik-semantiken, se komponent-huvudet):
  // namn-spannet är knappens OCH Selectens accessible name; beskrivningen
  // bär "vad kontrollen gör" utan att förorena rubriken.
  const namnId = useId();
  const beskrivningId = useId();

  const { data, isPending } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });

  // Dagsstarten: EN referenspunkt (NastaEventCard-disciplinen).
  const idagStart = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  // Kommande event, närmast först (punkt 10; ORDLISTA "Period": härlett ur
  // startdatum, aldrig Status); odaterade (Infinity) räknas kommande, sist.
  // Månadsrubrikerna läggs OVANPÅ ordningen (delade groupByMonth).
  const grupper = useMemo(() => {
    const kommande = (data ?? [])
      .filter((e) => dateValue(e) >= idagStart)
      .sort((a, b) => dateValue(a) - dateValue(b));
    return groupByMonth(kommande);
  }, [data, idagStart]);

  // TRE lägen sedan `gemensamtAlternativ`, inte längre två: valt event ·
  // det kontextlösa alternativet valt · inget alls. Det sista nås BARA av
  // konsumenter som inte skickar propen — för dem är härledningen oförändrad.
  const gemensamtValt = valtEventId == null && gemensamtAlternativ != null;
  const tomtLage = valtEventId == null && gemensamtAlternativ == null;
  const rubrikForm = form === 'rubrik';

  return (
    <AriaSelect
      // Rubrik-formen labelas av namn-spannet (rubrik-semantiken); övriga
      // former av den osynliga "Välj event"-etiketten (18.18-testkontraktet).
      aria-label={rubrikForm ? undefined : 'Välj event'}
      aria-labelledby={rubrikForm ? namnId : undefined}
      selectedKey={valtEventId ?? (gemensamtValt ? GEMENSAMT_KEY : null)}
      onSelectionChange={(key) => {
        if (key == null) return;
        const id = String(key);
        // Sentinel-grenen FÖRE event-grenen: nyckelrymderna är disjunkta
        // (`__gemensamt` vs `rec…`), så ordningen är läsbarhet snarare än
        // korrekthet — men den håller om record-ID-formen någonsin ändras.
        if (id === GEMENSAMT_KEY) {
          gemensamtAlternativ?.onValj();
          return;
        }
        if (id !== valtEventId) onByte(id);
      }}
      isDisabled={isDisabled}
      className="flex min-w-0 flex-col"
    >
      {rubrikForm ? (
        // RUBRIK-FORMEN (18.19 facit punkt 1): h1:an ÄR triggern — eventnamnet
        // i full rubrikstorlek, chevron-par intill, hela ytan klickbar i
        // hover-plattans grammatik. Knappen aria-labelledby:as till namn-
        // spannet (namnet, aldrig etiketten, är rubriken) och beskrivs av
        // "Byt event"-spannet nedanför.
        <h1 ref={rubrikRef} tabIndex={-1} className="min-w-0 font-semibold text-3xl">
          {/* max-w-[calc(100%+1rem)]: RUBRIKEN FÅR HELA RADENS UTRYMME
              (Marcus våg 2 2026-07-25 — RIM 3 ska rymmas på EN rad). Formen
              fullbordar -mx-2-designen: hover-plattans padding bor UTANFÖR
              textkolumnen, så knappens breddtak är kolumnen + sitt eget
              mx-överhäng (16 px) — texten linjerar med innehållskanten och
              får kolumnens fulla bredd. K54-vaktens ande hålls: bredden
              växer aldrig utanför överhänget (ingen w-full). gap-1.5 +
              chevron 18 (§14-chevronstorlekens standard; 20-formen riven
              öppet) ger RIM 3 ~17 px marginal med Inter laddad (uppmätt i
              preview-loopen; fallback-metrik ryms exakt). */}
          <AriaButton
            data-testid="event-valjare-trigger"
            aria-labelledby={namnId}
            aria-describedby={beskrivningId}
            className="-mx-2 inline-flex max-w-[calc(100%+1rem)] items-center gap-1.5 rounded-lg px-2 py-1 text-left hover:bg-bg-emphasized motion-safe:transition-colors"
          >
            <SelectValue className="min-w-0">
              {() =>
                valtEvent ? (
                  // block + truncate = nowrap-låset (aldrig radbrytning) med
                  // ellipsis vid överflöd; enbart visuellt — accname bär hela
                  // namnet (se komponent-huvudet, Marcus-fix 2026-07-25).
                  <span id={namnId} className="block truncate">
                    {eventName(valtEvent)}
                  </span>
                ) : (
                  // Kontrakts-defensiv gren (nås EJ av EventDetail — dess
                  // helsides-skeleton renderar före väljaren; review-pilotens
                  // F7): en framtida konsument utan event-data får skeleton i
                  // rubrikens slutgeometri, och namn-spannet står sr-only så
                  // labelledby aldrig pekar tomt (axe aria-valid-attr-value).
                  <>
                    <span id={namnId} className="sr-only">
                      Välj event
                    </span>
                    <Skeleton variant="text" className="w-64 text-3xl" />
                  </>
                )
              }
            </SelectValue>
            <ChevronsUpDown aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
          </AriaButton>
        </h1>
      ) : (
        <AriaButton
          data-testid="event-valjare-trigger"
          className={
            tomtLage
              ? // Fristående formen (punkt 7): sidans enda handling, full bredd.
                'flex w-full items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-4 text-body hover:bg-bg-muted motion-safe:transition-colors'
              : // Pillen på grå kortyta (punkt 3): vit, lyfter ur ytan. FAST
                // BREDD över hela blocket (Marcus-beslut 2026-07-25) — aldrig
                // innehållsstyrd; chevronen vid högerkanten (ml-auto).
                'flex w-full items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-small hover:bg-bg-muted motion-safe:transition-colors'
          }
        >
          {tomtLage ? (
            <CalendarDays aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
          ) : null}
          <SelectValue className="flex min-w-0 items-center gap-2">
            {() =>
              tomtLage ? (
                'Välj event'
              ) : gemensamtAlternativ != null && valtEventId == null ? (
                // Det kontextlösa alternativet valt: ren text i KontextRads
                // namn-vikt, utan färgprick/ort/datumspann — de leden hör till
                // ett event och har inget värde här. Triggern behåller
                // pill-formen: detta ÄR ett val, inte ett tomt läge.
                <span className="min-w-0 truncate font-medium">{gemensamtAlternativ.etikett}</span>
              ) : valtEvent ? (
                <KontextRad event={valtEvent} />
              ) : (
                // Kall djuplänk utan cache: skeleton i trigger-radens
                // slutgeometri (en textrad i pillen) tills data landat —
                // accessibla namnet bärs av Select-etiketten (Roselli-formen:
                // blocket är dekor).
                <Skeleton variant="text" className="w-48 text-small" />
              )
            }
          </SelectValue>
          <ChevronsUpDown
            aria-hidden="true"
            size={16}
            className="ml-auto shrink-0 text-text-secondary"
          />
        </AriaButton>
      )}
      {rubrikForm ? (
        <span id={beskrivningId} className="sr-only">
          Byt event
        </span>
      ) : null}
      {/* POPOVER-BREDDEN = TRIGGERNS (facit-komplettering form B, Marcus-
          beslut 2026-07-25 efter research): default-placeringen "bottom"
          centrerade en innehållsbred popover under triggern → högerförskjuten
          utanför innehållet. RAC:s Popover sätter --trigger-width automatiskt
          (uppdaterad via resize observer; verifierad i 1.19.0) — width:
          var(--trigger-width) + min-w-72-golv (18rem, så en smal rubrik-
          trigger inte ger oanvändbar söklista) + placement="bottom start"
          (vänsterkant-linjerad). Precedent: React Aria Select-docs använder
          exakt --trigger-width; Radix --radix-select-trigger-width; Material
          exposed dropdown. containerPadding/shouldFlip = RAC-default. */}
      <Popover
        data-testid="event-valjare-popover"
        placement="bottom start"
        className="flex w-(--trigger-width) min-w-72 flex-col gap-1 rounded-xl border border-(--mm-select-popover-border) bg-(--mm-select-popover-bg) p-2 shadow-lg"
      >
        {/* Autocomplete = React Arias combobox-maskineri i popover-form:
            sökfältet styr listboxen (virtuell fokus), filtret matchar
            namn ELLER ort via textValue (punkt 8). */}
        <Autocomplete filter={contains}>
          <SokFalt />
          <ListBox
            className="scrollbar-inline max-h-80 overflow-auto outline-none"
            renderEmptyState={() => (
              <p className="px-3 py-2 text-small text-text-muted">
                {isPending ? 'Laddar event…' : 'Inga event matchar sökningen'}
              </p>
            )}
          >
            {/* Det kontextlösa alternativet står ÖVERST, utanför månads-
                grupperna — det hör inte till någon månad. Direkt `SelectItem`
                i stället för en egen `ListBoxSection`: en sektionsrubrik över
                EN rad hade varit brus, och nästa månadsrubrik skiljer den
                visuellt ändå. Sökningen filtrerar den som vilken rad som helst
                (Autocomplete matchar `textValue`) — söker man "RIM" är den
                borta, vilket är rätt. */}
            {gemensamtAlternativ != null ? (
              <SelectItem
                id={GEMENSAMT_KEY}
                textValue={gemensamtAlternativ.etikett}
                className="font-medium"
              >
                {gemensamtAlternativ.etikett}
              </SelectItem>
            ) : null}
            {grupper.map((grupp) => (
              <ListBoxSection id={grupp.label} key={grupp.label}>
                {/* Månadsrubriks-formen — EventsLists EGEN (punkt 9):
                    font-semibold text-small text-text-secondary, ALDRIG
                    ALL CAPS (S83 pass 4-fångst #1). */}
                <Header className="px-3 pt-3 pb-1 font-semibold text-small text-text-secondary">
                  {grupp.label}
                </Header>
                {grupp.events.map((e) => (
                  // Primitivens SelectItem (review-pilotens F6 — en
                  // item-grammatik, ingen lokal kopia med drift).
                  <SelectItem
                    id={e.id}
                    key={e.id}
                    // textValue bär namn + ort → sök matchar båda (punkt 8);
                    // spannet ingår i radens accessibla namn via innehållet.
                    textValue={`${eventName(e)} ${e.ort ?? ''}`}
                    // Prefetch på avsikt (ADR-078 beslut 3): hover är den
                    // tidigaste ärliga signalen om ett byte — konsumenten
                    // värmer bytesmålets queries här, aldrig först vid valet.
                    onHoverStart={onAvsikt ? () => onAvsikt(e.id) : undefined}
                  >
                    {({ isFocused }) => (
                      <>
                        {/* Tangentbordets avsikts-signal (18.19-review F1):
                            piltangenterna flyttar VIRTUELL fokus (aria-
                            activedescendant) — DOM-fokusevent finns inte att
                            lyssna på, så radens fokus-state bär signalen.
                            Likvärdig värmning oavsett styrsätt (a11y-11). */}
                        {onAvsikt ? (
                          <AvsiktVidFokus aktiv={isFocused} eventId={e.id} onAvsikt={onAvsikt} />
                        ) : null}
                        <KontextRad event={e} />
                      </>
                    )}
                  </SelectItem>
                ))}
              </ListBoxSection>
            ))}
          </ListBox>
        </Autocomplete>
      </Popover>
    </AriaSelect>
  );
}

/**
 * Avsikts-signal för tangentbordsvägen (review-pilotens F1): listboxens
 * virtuella fokus (Autocomplete/aria-activedescendant) avger inga DOM-
 * fokusevent, så signalen dras ur radens render-state. Effekten avfyras när
 * raden BLIR fokuserad; upprepade avfyrningar är gratis (React Query dedupar
 * prefetch, ADR-078 beslut 3).
 *
 * MEDVETET BREDDAD SEMANTIK (ompasseringens N1, öppet bokförd): React Arias
 * Autocomplete auto-fokuserar FÖRSTA träffen vid varje sökinmatning, så även
 * skrivande värmer den aktuella första-träffen — det är Enter-målet i samma
 * ögonblick, alltså en ärlig avsikts-proxy. Bounded: dedup per id + staleTime;
 * distinkta första-träffar under en sökning är få.
 */
function AvsiktVidFokus({
  aktiv,
  eventId,
  onAvsikt,
}: {
  aktiv: boolean;
  eventId: string;
  onAvsikt: (eventId: string) => void;
}) {
  useEffect(() => {
    if (aktiv) onAvsikt(eventId);
  }, [aktiv, eventId, onAvsikt]);
  return null;
}

/**
 * B-formens kontextrad (facit punkt 3): kursfärgs-prick (18.17:s
 * Avser-rad-grammatik, aria-hidden — texten bär, WCAG 1.4.1) + namn
 * font-medium + ort + kollapsat datumspann. Delad mellan stängda läget
 * och listraderna — väljaren bär identiteten med EN grammatik.
 */
function KontextRad({ event }: { event: Event }) {
  const farg = kursfargForKurs(event.eventNamn);
  return (
    <>
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${farg.bgClass}`} />
      <span className="min-w-0 truncate">
        <span className="font-medium">{eventName(event)}</span>
        <span className="text-text-secondary">
          {' '}
          · {event.ort ?? 'Ort ej satt'} · {datumSpannText(event)}
        </span>
      </span>
    </>
  );
}

/**
 * Sökfältet i listan (punkt 8): med från start (USWDS-tröskeln). Fokus vid
 * öppning bärs av `autoFocus`-PROPEN på SearchField — React Arias
 * dokumenterade mekanism för Select+Autocomplete (docs-exemplens exakta
 * form; propen går genom RAC:s FocusScope i stället för att tävla med den).
 * Ursprungsformen (extern rAF-fokus efter mount) revs öppet 2026-07-25:
 * den var ett race mot RAC:s egen öppnings-fokusering — grönt i e2e men
 * fokus-tapp i verklig användning (prototyp-regressionen). Detta är RAC:s
 * autoFocus-prop i en just-öppnad popover (svar på användarens egen
 * handling), inte sidladdnings-autofokus — a11y/noAutofocus-golvet gäller
 * sidladdning och skärs inte.
 */
function SokFalt() {
  return (
    <SearchField autoFocus aria-label="Sök event eller ort" className="group flex flex-col">
      <div className="relative">
        {/* RING-DETERMINISMEN (Marcus-beslut 2026-07-25, våg 3): sökrutan i en
            ÖPPNAD väljare är en skriv-yta — ringen visas ALLTID vid DOM-fokus
            (RAC data-focused), oavsett modalitet. Grundorsaken till "ibland
            ring": globala *:focus-visible + data-rac-släckaren (S73 K85) gör
            ringen modalitetsstyrd — mus-öppning gav fokus utan ring, första
            tangenttryck tände den, kryss-klick släckte. Samma ring-tokens som
            globalen; outline-none hindrar dubbelritning när båda gäller.
            Native webkit-krysset (blått) ersätts av RAC:s clear-Button i
            appens grå ikonform (X 16, muted → text vid hover). */}
        <AriaInput
          placeholder="Sök event eller ort…"
          className="text-(color:--mm-input-text) placeholder:text-(color:--mm-input-text-placeholder) mm-fokusring-vid-fokus min-h-10 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 pr-10 text-body [&::-webkit-search-cancel-button]:[-webkit-appearance:none]"
        />
        <AriaButton
          aria-label="Rensa sökningen"
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:text-text group-data-[empty]:hidden"
        >
          <X aria-hidden="true" size={16} className="shrink-0" />
        </AriaButton>
      </div>
    </SearchField>
  );
}
