# Check-in vid entrén som mönsterklass — mönster-research (Code, 2026-07-26)

> **Proveniens:** avgränsat research-pass (bakgrundsagent) 2026-07-26, på
> väg in i check-in-passet (T97). Alla bärande påståenden är verifierade
> mot angiven käll-URL samma dag. Tunn precedent-rymd deklareras öppet
> där den finns — räkningen är inte fejkad.

## Frågan

Vad är branschens etablerade mönster för dörr-optimerade
incheckningsflöden, och hur förhåller de sig till valet mellan
event-nivå-massmarkering ("markera alla närvarande") och
per-person-toggle?

## Beslutet frågan informerar

Tre saker. **(1)** Prototyp-passets tre divergens-varianter för
check-in-sidan: A = event-nivå massmarkering, B = per-person-toggle,
C = dörr-optimerad sök-/skanna-först. **(2)** Det ADR-bara beslutet om
närvaro-write-vägen — A9/A10-automationen via
`Eventplanering`-checkboxen mot en egen `Deltaganden`-operation
(`docs/reference/data-model.md` rad 294–298, 904–916). **(3)**
Interaktionsdesignen för entrésituationen: EN person (Lotta) står i
dörren med mobil eller laptop och checkar in deltagare medan de kommer
in.

Kända lokala förutsättningar som styr tolkningen: närvaro-WRITE saknas
helt i dag (noll av 13 operationer i `field-allowlists.ts` rör
`Deltaganden`); läs-shapen (`get-attendance`) bär redan record-ID,
personId, personNamn, session, status och `Närvaropoäng`;
närvaro-REGISTRET (`Narvaro.tsx`) är redan byggt som ren läsvy i
LMS-registerform; appen har **noll toast-lager** (tråd T96), men bär
`alertScreenReader` (aria-live-utility portad från FK).

---

## Destillat per källa

### 1. Eventbrite Organizer — scan-först, svep som fallback

Eventbrites egen hjälpdokumentation beskriver dörr-flödet i två steg:
skanna primärt, sök sekundärt. *"Tap the scan icon to scan tickets. The
app uses your device's camera to scan tickets."* När biljetten saknas:
*"search or scroll to find their ticket. Then either: Swipe right on
their ticket to check it in. Select **Check in** to check in the
ticket."*

- **Ingen bulk-funktion dokumenterad.** Hjälpartikeln beskriver
  uteslutande enskild biljetthantering — ingen "checka in alla".
- **Omvändningen är en egen scan-läge-inställning, inte en undo:**
  "Scan to check out" låter organisatören *"Check out attendees you
  scan"*. Någon ångra-av-senaste-incheckning dokumenteras inte (tunn
  precedent — deklarerad nedan).
- **Offline är en förstklassig egenskap:** produktsidan lyfter att
  check-in fungerar utan uppkoppling och synkar när nätet återvänder,
  och att check-in-data *"instantly syncs in real time across multiple
  devices at different entry points"*.

### 2. Luma — de två scanner-lägena och ångra-mönstret

Luma är den enda funna källan som **explicit designar för
avvägningen kontroll mot hastighet** och dokumenterar båda lägena:

- **Standard-läget:** *"opens the guest's details when you scan their
  ticket. You'll see their information and registration status, then tap
  a button to confirm the check-in (or undo it)."* Ångra bor alltså **på
  posten**, inte i en transient toast.
- **Express-läget:** *"checks guests in automatically as soon as you
  scan their QR code — no tap needed"*, med *"color-coded feedback for
  each scan and a list of recently scanned guests at the bottom of the
  screen"*. Den nedre listan över senast skannade är
  ångra-affordansen i snabbläget — en kvarstående historik, inte ett
  meddelande som försvinner.
- **Manuell väg:** sök på namn i gästlistan.
- **Felfallet är synligt och färgkodat:** *"if a ticket is invalid,
  you'll see a red 'Not Valid' message"* — och färgen är alltid parad
  med text.

### 3. Cvent OnArrival — sökfältets fyra nycklar, offline, kiosk

Cvent är klassens tyngsta enterprise-precedent och den enda som
dokumenterar **sökningens nycklar** explicit: attendee search låter
gästen checkas in genom sökning på *namn, e-postadress, source ID eller
bekräftelsenummer*, med QR-skanning som parallell väg.

- **Offline via förladdning:** *"preload event data to devices, so they
  can continue scanning, checking in, and printing badges even without
  internet"*, varefter *"all data syncs automatically"*.
- **Latensbudgeten är sub-sekund:** *"Guests scan a QR code or barcode
  in under a second. Their name appears instantly."*
- **Kön är det uttalade problemet:** *"Nobody enjoys standing in a long
  line."*
- **Kiosk-läget** flyttar arbetet till gästen (självincheckning,
  badge-utskrift) när bemanningen inte räcker.

### 4. Splash Host och Sched — svep respektive cirkel-toggle

Två oberoende produkter som bekräftar att **per-person-handlingen är en
enda gest på raden**:

- **Splash Host:** *"… swipe right on a guest's name or scan their
  QR code to check them in"*, med sökikon i skärmens nederkant (iOS)
  och en *"live check-in count"* som synkar i realtid. Walk-in-
  registrering direkt i flödet.
- **Sched:** *"search for registered attendees by name and click the
  circle to check them in"*; check-in-managern kan *"un-do the scans
  after testing"*; exporten bär *"a column for the check-in status and
  time"*.

### 5. Massmarkeringens verkliga hemvist — LMS- och register-klassen

Sökningen efter "markera alla närvarande" landar inte i
event-check-in-produkter utan i **närvaroregister för undervisning**.
Det är en annan mönsterklass med ett annat arbetsläge.

- **Blackboard Learn (Anthology, förstaparts-dok):** *"You can use the
  menu in a column heading to mark all students present or absent.
  Then, you can change individual students' statuses from their cells
  as needed."* Tillstånden är fyra och viktade: Present 100 %, Late
  50 % (justerbar), Absent 0 %, Excused (*"Counts as Present for
  scoring purposes"*).
- **ClassDojo:** en *"Mark all"*-åtgärd överst som sätter samma status
  på hela klassen, varefter undantagen justeras.
- **SmartPass:** *"Mark All Present"* för hela klasslistan.
- **FooEvents (event-sidan av samma idé):** bulk-uppdatering där man
  markerar biljetter och sätter dem till checked-in, checked-out eller
  cancelled — beskrivet som ett listverktyg, inte ett dörrverktyg.

**Mönstrets logik:** massmarkering förutsätter att *de flesta redan är i
samma tillstånd* och att listan står stilla medan man arbetar. Det är
ett efterhands-/registerarbete mot en avslutad händelse — inte en
inmatning i realtid.

### 6. Plattforms-golven — träffytor och enhandsanvändning

- **WCAG 2.2 SC 2.5.8 Target Size (Minimum):** *"The size of the target
  for pointer inputs is at least 24 by 24 CSS pixels"*, med fem
  undantag. Understanding-dokumentet rekommenderar uttryckligen att man
  för viktiga kontroller siktar på *"the stricter 2.5.5 Target Size
  (Enhanced)"* i stället för att luta sig mot spacing-undantaget.
- **Apple HIG:** en knapp *"needs a hit region of at least 44x44 pt … to
  ensure that people can select it easily"*.
- **Material 3:** komponenternas interaktiva mål möter *"Material's
  48x48dp minimum touch target"*.
- **Enhandsanvändning är majoritetsfallet:** Steven Hoobers
  observationsstudie (1 333 observationer, UXmatters 2013) fann att
  49 % använder telefonen enhänt, 36 % vaggar den i en hand och pekar
  med den andra, 15 % håller med två händer. Tumzonen — skärmens nedre
  del — är därmed den primära handlingsytan på mobil.

**Konsekvens för dörren:** entrén är ett primärflöde under tidspress,
alltså gäller 44/48 px som golv, inte 24. Sökfält och primär
check-in-handling hör hemma i tumzonen.

### 7. Mönsterkällor — lägen, urval, ångra

- **NN/g om lägen:** *"Modes are different interpretations of the user
  input by the system, depending on the state which is active. Same
  input, different results."* Mode-slips uppstår när användaren tappar
  medvetenheten om aktivt läge; motmedlet är *"strong visual signals"*,
  redundans (minst två indikatorer) och tydligt namngivna lägen. NN/g
  behandlar inte skillnaden mellan lägen för upprepade enskilda
  handlingar och lägen för batch-operationer — den kopplingen är vår
  egen slutsats, inte en citerad regel.
- **Material Selection (förstaparts-mönster):** urvalsläget nås via
  *"a long-press, touch, or mousedown that's held in the same position
  for a moment"*, åtgärden utförs från en verktygsrad och man lämnar
  läget genom att avmarkera eller köra åtgärden. Uttryckligt råd:
  *"Avoid persistently displaying checkboxes as part of each item."*
- **MOJ Design System, Multi select:** *"Use the multi select component
  to help users save time when they're applying an action to 2 or more
  items in a table"* — mönstrets syfte är EN åtgärd på FLERA objekt, i
  en tabell, och *"Do not use the multi select component outside of a
  table."*
- **NN/g om bekräftelsedialoger:** *"Do not use confirmation dialogs for
  routine actions"*; *"if you cry wolf too many times, people will stop
  paying attention"*; och som riktning: *"do try your best to offer
  undo"*. Bekräftelse reserveras för allvarliga, icke ångerbara
  handlingar.
- **Material 3 Snackbar:** en (1) åtgärd per snackbar, "Undo" som
  kanonisk åtgärd, och en accessibility-regel: undvik att sätta en
  varaktighet på snackbars som bär en åtgärd, eftersom skärmläsar-
  användare behöver kunna navigera dit.
- **WAI-ARIA APG, Alert:** *"An alert that disappears too quickly can
  lead to failure to meet WCAG 2.0 success criterion 2.2.3."*

### 8. React Aria — vilka byggstenar som faktiskt finns

- **GridList:** *"displays a list of interactive items, with support for
  keyboard navigation, single or multiple selection, and row actions"*;
  `selectionMode="multiple"` renderar kryssrutor, semantiken är
  `role="grid"` + `aria-selected`. Detta är **urvals**-semantik.
- **SearchField:** `type="search"` (implicit `role="searchbox"`),
  clear-knapp som visas när fältet har innehåll, `onSubmit` på Enter.
- **Toast finns — men som instabilt API.** React Aria Components
  exponerar `UNSTABLE_Toast`/`UNSTABLE_ToastRegion` med en
  `ToastQueue`, landmark-region och F6-navigering. Dokumentationen
  rekommenderar *"a minimum timeout of 5 seconds"* och varnar: *"Only
  auto-dismiss toasts when the information is not critical, or may be
  found elsewhere"*.
- **TanStack Query, optimistic updates:** två vägar — via UI
  (`variables`) eller via cache (`onMutate` + rollback i `onError`).
  *"If you only have one place where the optimistic result should be
  shown, using `variables` … requires less code"*; flera samtidiga ytor
  talar för cache-vägen.

### 9. Tillstånds-annonsering — WCAG 4.1.3

SC 4.1.3 Status Messages kräver att *"status messages can be
programmatically determined through role or properties such that they
can be presented to the user by assistive technologies without
receiving focus"*. Det kanoniska exemplet i understanding-dokumentet är
en räknare som uppdateras efter en handling: *"After a user presses an
Add to Shopping Cart button, a section of content near the Shopping
Cart icon adds the text '5 items'. A screen reader announces 'Five
items'"* — strukturellt identiskt med "12 av 34 incheckade".

---

## Syntes och REKOMMENDATION för check-in-passet

### (a) Vad som skiljer dörren från vanlig listhantering

Sex egenskaper, alla käll-belagda, som tillsammans definierar klassen:

1. **Strömmen, inte mängden.** Dörren tar emot N separata händelser
   spridda över tid i godtycklig ordning. Listhantering arbetar mot en
   mängd som står stilla. Alla fem produkter (Eventbrite, Luma, Cvent,
   Splash, Sched) bygger per-person-handlingar; ingen av dem bygger
   markera-och-tillämpa.
2. **Enhandsdrift och stora träffytor.** 49 % enhandsanvändning
   (Hoober) plus 44/48 px-golven (Apple, Material) plus WCAG 2.5.5-
   rekommendationen för primärflöden. Primärhandlingen hör till
   tumzonen.
3. **Uppslagning slår bläddring.** Cvents fyra sök-nycklar och
   Eventbrites *"search or scroll"* är samma erkännande: personen framför
   dig är en känd post som ska hittas, inte upptäckas.
4. **Latens-tolerans i sub-sekundsklass.** Cvent mäter i *"under a
   second"*. Detta är den skarpaste lokala risken: `get-registrations`
   väg D svarade ~30 s på staging (TASK-14), och A8 sätter `Avstämt`
   inom <60 s efter PATCH. Dörren kan alltså aldrig vänta på basen —
   optimistisk write med rollback är golv, inte förfining.
5. **Offline-tolerans är en produktegenskap i klassen.** Både Cvent och
   Eventbrite förladdar data och synkar i efterhand. Vi har läs-sidan
   redan halvvägs (persistQueryClient/ADR-078) men **ingen** write-kö.
6. **Fel måste vara billiga.** Fel person incheckad är den vanliga
   felhandlingen, den sker under press, och NN/g:s regel är entydig:
   ingen bekräftelsedialog för rutinhandlingar — bygg ångra i stället.

### (b) Sök-först är dörrens dominerande mönster (delfråga 2)

Alla fem produkter erbjuder skanning + sökning; **ingen** erbjuder
enbart en lista att bläddra i. Rangordningen skanna → söka → bläddra är
konsekvent: Eventbrite ("scan … or search or scroll"), Cvent (QR +
fyra sök-nycklar), Luma (skanner + sök på gästlistan), Splash (svep
eller skanna, med sökikon), Sched (sök på namn, skanning som tillägg).

**Lokal reservation som ändrar bilden:** Miranon Media Admin har ingen
biljett-QR. Sökning i `src/` och `supabase/functions/` ger noll
scanner-kod, och `Anmälningar` bär ingen biljettkod. Skanna-grenen är
alltså inte byggbar utan att först införa biljettkoder i basen och i
bekräftelsemailen — ett eget spår, inte en check-in-skiva. **Dörren
degraderar därmed till sök-först**, vilket är exakt den väg alla fem
produkter håller öppen som fallback när biljetten saknas.

### (c) Massmarkering är en REGISTER-funktion, inte en dörr-funktion (delfråga 3)

**Skarpt svar: nej, "markera alla närvarande" är inte ett
dörr-mönster.** Beläggen pekar entydigt:

- Ingen av de fem event-check-in-produkterna dokumenterar en
  massmarkering vid dörren.
- Varje funnen massmarkering ligger i **register-klassen**: Blackboard
  (kolumnmenyns "mark all present or absent, then change individual
  students' statuses"), ClassDojo ("Mark all"), SmartPass ("Mark All
  Present"), FooEvents (bulk-uppdatering av biljettstatus i en lista).
- MOJ:s multi-select formulerar villkoret som gör skillnaden tydlig:
  mönstret är för att *tillämpa en åtgärd på 2 eller flera objekt* i en
  **tabell**. Dörren tillämpar N åtgärder på N objekt, en i taget.
- Mönstrets premiss — "de flesta har samma tillstånd, markera
  undantagen" — är sann EFTER eventet och falsk under insläppet, då
  ingen ännu är incheckad.

**Vad det betyder för oss:** massmarkeringen har redan sin naturliga
hemvist i appen. `Narvaro.tsx` är byggd som LMS-register enligt
Blackboard-/Canvas-mönstret (rad 12–19 i filens dok-kommentar) och är i
dag ren läsning. Massmarkeringen hör dit — inte till check-in-sidan.
Det gör också write-forken lättare: A9/A10-vägen (event-nivå-checkbox)
är semantiskt en **event-nivå-operation** och passar registret, medan
dörren behöver en per-post-operation.

### (d) Ångra-mönstret utan toast-lager (delfråga 4)

Branschen använder tre former, och bara en av dem kräver toast:

1. **Ångra på posten (Luma Standard):** detaljbladet bär både
   check-in-knappen och undo. Statusen är fritt vändbar så länge posten
   är åtkomlig.
2. **Ångra ur en kvarstående historik (Luma Express):** listan över
   senast skannade i skärmens nederkant, som ger åtkomst till de
   senaste händelserna utan att något försvinner.
3. **Omvänd handling som eget läge (Eventbrite "Scan to check out",
   Sched "un-do the scans", FooEvents bulk-status).**

**Ingen av de tre är en toast.** Rekommendationen blir därför entydig
för oss: **bygg inte check-in på ett toast-undo.** T96 slår fast att
appen har noll toast-lager, och att införa ett är ADR-bart arbete i
egen tråd. React Aria har visserligen ett Toast-API, men det är märkt
`UNSTABLE_` — att införa det som beroende i en write-vertikal vore att
låna instabilitet till dörren.

Konkret form som täcker klassen utan nytt lager: **statusen på raden är
själva ångra-affordansen** (tryck igen ⇒ tillbaka till "Ej avstämt"),
förstärkt av en **"Senast incheckade"-lista** i skärmens nedre del som
både ger kvitto och åtkomst till de senaste händelserna. Skärmläsar-
kvittot bärs av befintliga `alertScreenReader` (aria-live), som redan
är appens etablerade väg. Ingen bekräftelsedialog — NN/g:s regel om
rutinhandlingar gäller rakt av.

### (e) Tillståndsmodellen: binärt vid dörren, flertillstånd i registret (delfråga 5)

`Deltaganden.Status` (`fldRFOzNqVswqZ1mN`) bär sex options: Ej avstämt
(default, poäng 0), Närvarande (1), Frånvarande (0), Försenad (0),
Avbröt (0), Deltog online (1).

Branschen delar upp dessa i två skilda ytor:

- **Dörren är binär.** Samtliga fem produkter modellerar incheckning som
  tvåtillstånds (incheckad / ej incheckad); Eventbrite lägger till
  check-out som en spegling av samma axel. Luma Standard-läget öppnar
  gästdetaljen just för att **avvikelser ska hanteras utanför
  strömmen**.
- **Registret är flertillstånds.** Blackboards fyra viktade tillstånd
  (Present/Late/Absent/Excused) motsvarar strukturellt våra sex.

**Rekommendation:** check-in-sidan skriver EN övergång — `Ej avstämt` →
`Närvarande` — och dess omvändning. Frånvarande, Försenad, Avbröt och
Deltog online är registerstatusar som sätts i `Narvaro.tsx` eller på
per-persons-ytan, inte i dörrströmmen. Det håller också
`Närvaropoäng`-formeln (1 för Närvarande/Deltog online) fri från
dörr-beroenden: dörren sätter alltid Närvarande; "Deltog online" är per
definition inte en dörr-händelse.

**Fältvakt:** A8 sätter `Avstämt = NOW()` vid varje statusändring på
`Deltaganden`. Appen ska därför **aldrig** skriva `Avstämt` själv —
annars får vi två skribenter på samma fält.

### (f) Generaliserar task-48:s markera-läge till dörren? (delfråga 6)

**Skarpt svar: nej — grammatiken generaliserar inte, byggstenarna gör
det.** Tre skäl, alla belagda:

1. **Målformen skiljer sig.** Task-48 är MOJ-/Material-klassen: markera
   N objekt i samma tillstånd → tillämpa EN åtgärd EN gång, med
   batch-bar och live-count. MOJ:s egen formulering (*"applying an
   action to 2 or more items"*) beskriver task-48 exakt och beskriver
   dörren inte alls. Dörren är N åtgärder på N objekt, spridda över tid,
   med sökningar emellan.
2. **Läget kostar fel över tid.** NN/g:s mode-varning gäller lägen som
   står aktiva medan användaren tappar uppmärksamheten. Task-48:s läge
   är kort, avsiktligt och avslutas av sin egen batch-åtgärd. Ett
   markera-läge vid dörren skulle stå aktivt i en timme, under
   avbrott, med människor som pratar — det är mode-slip-scenariot i
   klartext. Ett läge som ska stå på hela tiden är inte ett läge, det är
   en vy.
3. **Materials egen regel pekar bort.** *"Avoid persistently displaying
   checkboxes as part of each item"* — och Material låter urvalsläget
   nås genom långtryck, alltså genom en avsiktlig extra gest. Dörren
   tål ingen extra gest före varje incheckning.

**Vad som ändå generaliserar (och bör återanvändas):** hela kortet som
klickyta med kryssruta-semantik; breddlåset via osynlig platshållare +
`tabular-nums` (batch-barens teknik löser räknar-hopp var som helst);
`sr-only aria-live` med antal; Esc som lämnar-väg. Dessa är
byggstenar, inte grammatik.

**Och en viktig nyans:** task-48:s grammatik generaliserar utmärkt till
**registret**. Vill man ha "markera alla närvarande" med kontroll per
person är markera-läge + batch-bar precis rätt form — i `Narvaro.tsx`,
efter eventet. Det är samma insikt som (c) från andra hållet.

### (g) A11y-golvet för 11-ribban (delfråga 7)

- **Träffytor:** 44×44 px (Apple) respektive 48×48 dp (Material) som
  golv för check-in-handlingen och för sökfältets clear-knapp; WCAG
  2.5.8:s 24 px är miniminivån vi ligger över, inte målet.
- **Statusannonsering:** varje incheckning ska ge ett
  `aria-live="polite"`-meddelande med personens namn och nya status;
  räknaren "X av Y incheckade" är en status message enligt SC 4.1.3
  (shopping cart-exemplet är samma konstruktion). Befintliga
  `alertScreenReader` bär detta utan nytt lager.
- **Ingen auto-försvinnande bekräftelse.** APG:s alert-varning
  (WCAG 2.2.3) och Materials snackbar-regel (ingen varaktighet på
  meddelanden med åtgärd) pekar båda på att ett tidsbegränsat kvitto
  aldrig får vara enda vägen till ångra.
- **Semantik per rad:** dörr-raden är en **toggle** — knapp med
  `aria-pressed`, eller kryssruta med `aria-checked` — inte
  `aria-selected`. `aria-selected` (GridList) hör till urval;
  dörr-handlingen är en tillståndsändring i datat.
- **Tangentbordsflöde:** sökfältet ska vara fokuserat vid inladdning
  (uppslagning är primärhandlingen), Enter/Space aktiverar radens
  toggle, Escape rensar sökningen (SearchField-semantiken), och
  fokus får aldrig hoppa när listan filtreras om.
- **Färg bär aldrig ensam.** Lumas *"Not Valid"* är röd **och** text;
  vår incheckad-markör måste bära ikon eller text utöver kulören
  (WCAG 1.4.1) — samma krav som task-48:s byggkrav 7 redan slår fast.

---

## Rekommendation per divergens-variant

### Variant A — event-nivå massmarkering

**Rekommendation: behåll i divergensen, men rendera den ärligt som
REGISTER-vy, inte som dörr-vy.** Precedent-rymden för massmarkering
ligger helt i LMS-/register-klassen (Blackboard, ClassDojo, SmartPass);
noll av fem event-check-in-produkter bär den vid dörren. Om A ställs upp
som en dörr-variant vinner den aldrig en ärlig jämförelse — och den
förlorar av fel skäl, eftersom funktionen i sig är värdefull på rätt
plats.

Bygg A som "efter eventet"-vyn: sessionsväljare + "Markera alla
närvarande" + möjlighet att justera undantag (Blackboards exakta
arbetsordning). Write-vägen för A är rimligen A9/A10-checkboxen på
`Eventplanering` — den är semantiskt en event-nivå-operation, den
logiken finns redan och behöver inte dupliceras. Priset är känt och
acceptabelt för en efterhandsfunktion: latens och att appen inte äger
logiken. Detta är alltså inte ett argument mot A9/A10 — det är ett
argument för att A9/A10 hör hemma i registret.

### Variant B — per-person-toggle

**Rekommendation: detta är dörrens kärna, men B som "ren lista" är
underspecificerad.** Per-person-toggle stöds av alla fem produkter, och
det är den enda formen som ger kontroll, idempotens och en trivial
ångra-väg. Men ingen produkt levererar den som enbart en lista: alla
lägger en uppslagningsyta ovanpå. Med upp till 88 platser per event
(MK-eventet) och 218 `Deltaganden`-rader är listan för lång för ren
bläddring.

B bör därför byggas som: lista är default, **sökfältet är sticky** och
placerat i tumzonen, radens primäryta ≥44 px, tryck igen ångrar. Är B
och C i praktiken samma sak då? Nästan — och det är ett fynd i sig.
Divergensen blir skarpare om B renderas som *lista-först med sök
sekundärt* och C som *sök-först med lista sekundärt*, så att Marcus
väljer mellan två genuint olika utgångslägen i stället för två
gradskillnader.

### Variant C — dörr-optimerad sök-först

**Rekommendation: C är den mest belagda dörr-formen — men bygg den som
SÖK-först, inte skanna-först.** Skanna-grenen är inte byggbar i dag
(ingen biljett-QR i basen, ingen scanner-kod i repot) och skulle kräva
ett eget spår med biljettkoder i `Anmälningar` och i bekräftelsemailen.
Att låta C bära ett skanna-löfte i prototypen vore att prototypa en
funktion vi inte kan leverera.

C:s form, destillerad ur de fem produkterna: stort sökfält högst upp
(alternativt i tumzonen) med autofokus och typeahead-filtrering över
eventets deltagare; träffarna som stora rader med namn + status +
en primär check-in-yta; **"Senast incheckade"-lista i nederkanten**
(Lumas Express-mönster) som kvitto och ångra-väg; räknare "X av Y
incheckade" som både visas och annonseras; optimistisk write med
rollback.

### Write-forken — vad researchen säger inför ADR:n

Mönsterbilden delar forken efter SITUATION, inte efter teknik:

- **Dörren ⇒ per-post-write (fork B).** En ny `operationKey` mot
  `Deltaganden` som sätter `Status`. Idempotent (samma status två
  gånger = samma resultat), rollback-bar, och ångra = skriv tillbaka
  `Ej avstämt`. Appen skriver aldrig `Avstämt` (A8 äger fältet).
- **Registret ⇒ event-nivå-write (fork A).** A9/A10-checkboxen på
  `Eventplanering` + `Check-in session`. Ingen ny logik, priset
  (latens, ingen per-person-kontroll) är acceptabelt efter eventet.
- **Batch-EF (fork C) är spekulativ komplexitet i dag.** Den löser
  massmarkering snabbare än A9/A10 — men massmarkeringen är inte en
  dörr-funktion, och A9/A10 finns redan. Bygg den inte "ifall".

Nettot: **en skrivväg per situation, inte två för samma.** Det är också
det som gör ADR:n formulerbar — forken är inte "vilken teknik", utan
"vilken yta ägs av vilken skrivväg".

### Öppet deklarerade tunna precedent-rymder

1. **Ingen offentlig design-system-precedent finns för klassen.**
   Varken GOV.UK Design System eller USWDS har mönster för
   incheckning/närvaro — riktad sökning mot båda domänerna gav noll
   träffar. Klassen är produktdriven, inte design-system-dokumenterad.
2. **NN/g har ingen artikel om entré-incheckning.** De NN/g-källor som
   används här (lägen, bekräftelsedialoger, sök-dominanta användare) är
   generella och tillämpas av oss på klassen — de uttalar sig inte om
   den.
3. **Eventbrite dokumenterar ingen undo av check-in.** Hjälpartikeln
   nämner enbart "Scan to check out" som separat scan-läge.
   Undo-formen är belagd hos Luma och Sched, inte hos Eventbrite.
4. **Splash-hjälpsidan gick inte att hämta** (403 vid direkthämtning).
   Splash-påståendena vilar på Splash egen produktsida plus
   sökmotorns sammandrag av hjälpartikeln — svagare belägg än de
   övriga fyra produkterna, flaggat här.
5. **Throughput-siffror saknar oberoende mätning.** De
   gäster-per-timme-tal som cirkulerar (60–120 per station och timme,
   1 bemannad station per 50–75 anländande) finns enbart i
   leverantörs- och bemanningsbloggar. De används därför INTE som
   bärande här; endast Cvents egen *"under a second"* per skanning
   citeras, och den är ett produktpåstående.
6. **Ljusförhållanden vid entré saknar funnen förstapartskälla.**
   Ingen av de fem produkterna dokumenterar utomhus-/motljusläsbarhet.
   WCAG:s kontrastgolv och regeln att färg aldrig bär ensam får bära
   frågan; ett mörkt läge eller förstärkt kontrast vid dörren är en
   hypotes, inte ett belagt mönster.
7. **Offline-write har ingen precedent i vår arkitektur.** Cvent och
   Eventbrite förladdar och synkar, men båda är native-appar med lokal
   lagring. Vad det motsvarar i vår webbapp (write-kö, service worker)
   är ett öppet arkitekturbeslut som researchen inte avgör.

---

## Källförteckning

### Förstapartskällor — standarder och design-system

- W3C, Understanding SC 2.5.8 Target Size (Minimum):
  <https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>
- W3C, Understanding SC 4.1.3 Status Messages:
  <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>
- W3C WAI-ARIA Authoring Practices, Alert Pattern:
  <https://www.w3.org/WAI/ARIA/apg/patterns/alert/>
- Apple Human Interface Guidelines, Buttons (44×44 pt hit region):
  <https://developer.apple.com/design/human-interface-guidelines/buttons>
- Apple Human Interface Guidelines, Lists and tables:
  <https://developer.apple.com/design/human-interface-guidelines/lists-and-tables>
- Material Design 3, Accessible design (48×48 dp):
  <https://m3.material.io/foundations/accessible-design>
- Material Design 3, Snackbar guidelines (undo, duration):
  <https://m3.material.io/components/snackbar/guidelines>
- Material Design, Selection pattern (långtryck, kontextuell
  verktygsrad): <https://m1.material.io/patterns/selection.html>
- MOJ Design System, Multi select:
  <https://design-patterns.service.justice.gov.uk/components/multi-select/>
- GOV.UK Design System, Patterns (negativt fynd — ingen
  check-in-/närvaro-mönster):
  <https://design-system.service.gov.uk/patterns/>
- U.S. Web Design System, Patterns (negativt fynd):
  <https://designsystem.digital.gov/patterns/>

### Förstapartskällor — vår stack

- React Aria Components, GridList:
  <https://react-aria.adobe.com/GridList>
- React Aria Components, SearchField:
  <https://react-aria.adobe.com/SearchField>
- React Aria Components, Toast (UNSTABLE-API):
  <https://react-aria.adobe.com/Toast>
- TanStack Query, Optimistic Updates:
  <https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates>

### Produktdokumentation (leverantörens egen dok om egen produkt)

- Eventbrite Help Center, Check in attendees with the Organizer app:
  <https://www.eventbrite.com/help/en-us/articles/741083/how-to-check-in-attendees-at-the-event-with-eventbrite-organizer/>
- Eventbrite, Event Check-in App (produktsida — offline, realtidssynk):
  <https://www.eventbrite.com/organizer/features/organizer-check-in-app/>
- Luma Help, Check In Guests for In-Person Events (Standard/Express,
  undo): <https://help.luma.com/p/check-in-guests-for-in-person-events>
- Cvent, OnArrival — onsite check-in och badging:
  <https://www.cvent.com/en/event-marketing-management/onarrival-event-check-in-software>
- Cvent Blog, The 2026 Guide to Event Check-in Apps (offline, "under a
  second", kö): <https://www.cvent.com/en/blog/events/event-check-in-apps-guide>
- Splash, On-site tools (svep för incheckning, live check-in count):
  <https://splashthat.com/platform/on-site-tools>
- Sched Support, Check-in App:
  <https://support.sched.com/knowledge/check-in-app>
- Anthology (Blackboard) Help, Manage attendance (mark all present,
  fyra tillstånd):
  <https://help.anthology.com/blackboard/instructor/en/grading/attendance/manage-attendance.html>
- ClassDojo Help, How to Take Attendance ("Mark all"):
  <https://help.classdojo.com/hc/en-us/articles/203969355-How-to-Take-Attendance>
- SmartPass Help, Flex Period Attendance ("Mark All Present"):
  <https://articles.smartpass.app/en/articles/8204585-attendance>

### Auktoritativ tredjepart (research-organ)

- NN/g, "Modes in User Interfaces: When They Help and When They Hurt
  Users": <https://www.nngroup.com/articles/modes/>
- NN/g, "Confirmation Dialogs Can Prevent User Errors (If Not
  Overused)": <https://www.nngroup.com/articles/confirmation-dialog/>
- NN/g, "Search and You May Find" (sök-dominanta användare):
  <https://www.nngroup.com/articles/search-and-you-may-find/>
- Steven Hoober, "How Do Users Really Hold Mobile Devices?", UXmatters
  (1 333 observationer):
  <https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php>
