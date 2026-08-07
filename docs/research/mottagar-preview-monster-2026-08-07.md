---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
---

# Mottagar-preview-mönster hos branschledare — chips, avatarstaplar och overflow (2026-08-07)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört
> oisolerat i huvudkatalogen. Committar inget.
>
> **Inventering FÖRE första sökningen** (per passets kontrakt): `grep` över
> `docs/research/` och `docs/decisions/` för `avatar|chip|pill|preview|
> mottagarf` gav **noll relevanta träffar** — ingen tidigare research eller
> ADR täcker mottagar-preview-mönster i det här repot. Det finns alltså inget
> att komplettera; passet körs i full bredd.
>
> Däremot lästes tre filer i sin helhet som **styrande kontext**, inte som
> research att duplicera:
>
> - [`docs/specs/ATGARDSSIDAN-UNDERLAG.md`](../specs/ATGARDSSIDAN-UNDERLAG.md)
>   — det samlade underlaget för åtgärds-sidan. § 4 slår fast att mottagarna
>   ska vara "avmarkeringsbara på plats" i **listan** (de fullständiga
>   deltagarkorten), men uttalar sig aldrig om previewns VISUELLA form — det
>   är precis den lucka detta pass fyller.
> - `src/components/events/atgarder/AtgardsSida.tsx` — dagens prototyp
>   (varv 4c). Previewn Marcus dömde ut är rad 673–680:
>   `mottagarNamn.join(', ')` i en `<p>` med `text-caption`, under en räknare
>   ("N av M deltagare markerade") som redan bär `aria-live="polite"`.
> - `src/components/events/detail/Deltagare.tsx` — systerkomponentens
>   platshållare (`MarkeringsBatchBar`, rad 578–748) har samma problem i en
>   annan form: en `<ul>` med ett namn per rad, samma brist på gräns.
>
> `src/components/registrations/StatusBadge.tsx` lästes som internt
> precedent (se § 4): appens enda existerande "pill"-vokabulär (23
> förekomster) är uteslutande icke-borttagbara statusmärken.
>
> Alla externa källor nedan är hämtade **2026-08-07** mot respektive
> källas nuvarande publicerade version — inga versioner pinnade i förväg,
> version anges där den kunde fastställas.

## Frågan + beslutet den informerar

**Frågan:** hur visar branschledande produkter och designsystem en preview
av ett urval av personer/mottagare — pills/chips, avatarstapel, löpande
text, eller något annat — var går gränsen för hur många som visas, och hur
hanteras overflow?

**Beslutet:** vilken FORM ska mottagar-previewn ha på åtgärds-sidan, och
vilken overflow-regel? Sidan är läst-orienterad på just den här ytan — den
markerade mottagarlistan redigeras i de fullständiga deltagarkorten en
accordion-klick bort, inte i previewn själv. Marcus dom om nuvarande form,
verbatim: *"Jävlar vilken ful preview, vad använder vi den till? Den är
oanvändbar och måste göras om."*

## Kort svar

Tre mönster delar marknaden, och de svarar på tre OLIKA frågor — inte
samma fråga i tre stilar:

1. **Avatarstapel** (överlappande cirklar + "+N") svarar på *"vilka känner
   jag igen"* i en samarbets-/tillgångskontext, och förutsätter foton
   — utan foton degraderar den till initial-cirklar, vilket är strikt
   svagare än att bara visa namnet i text.
2. **Chips/pills med x-knapp** svarar på *"vad har jag valt, och kan jag
   ändra det HÄR"* — designsystemen är samstämmiga (MUI, Salesforce) om att
   borttagnings-affordансen antingen är opt-in per instans (MUI: ingen
   delete-ikon utan `onDelete`) eller är hela komponentens existensskäl
   (Salesforce: pills "by default … include a remove button", byggd som ett
   fullt listbox-mönster med piltangenter).
3. **Ren räknare** ("N valda") svarar bara på *"hur många"* — det är
   standardformen i varje bulk-actionbar vi hittat (Gmail, Shopify Polaris
   ResourceList, GitHub Issues).

**Ingen av de tre är byggd för vår fråga**, som är en fjärde: *"är det
RÄTT namngivna personer jag tog med mig, utan att behöva klicka."* Det
närmaste belagda mönstret är en **gränssatt, trunkerad namnlista i text**
("A, B, C, D och 10 till") — vilket i grunden är vad dagens preview
försöker vara, bara utan gräns. Talen för var gränsen går sprider sig
**3–5** hos de källor som faktiskt anger ett tal (Pinterest Gestalt: 3;
MUI-default och Fluent UI-default+rekommendation: 5), med GitHub Primer
som ett avvikande datapunkt som **inte** kompirmerar mot ett tal alls —
den sätter ett hårt tak på 4 och byter mönster helt istället för att
trunkera längre.

## 1. Mönster-katalogen

| Form | Syfte | Förutsätter | Exempel | Källa |
|---|---|---|---|---|
| **Avatarstapel** (överlappande cirklar, "+N") | Snabb igenkänning av EN grupp personer i en samarbets-/access-kontext ("vem är med", "vem har behörighet") | Foto eller initial per person | MUI `AvatarGroup`, Fluent UI `Facepile`/`AvatarGroup`, Pinterest Gestalt `AvatarGroup`, GitHub Primer `AvatarStack`, Figma multiplayer-baren | se § 2 |
| **Avatar + namn-rad** (vertikal lista, en rad per person) | Full identifiering, granskningsbar EN OCH EN | Avatar/initial + namn + ev. metadata | Vår egen `MarkerbartDeltagarKort` (redan byggd), GitHub PR-sidans reviewer-lista, Linear assignee-dropdown | intern kod |
| **Chip/pill med x-knapp** | Redigerbart urval — "det här har jag valt, och jag kan ta bort det HÄR" | En editerbar container (multi-select-fält) | Gmail/Superhuman mottagarfält, Salesforce `lightning-pill-container`, MUI `Chip` med `onDelete` | se § 4 |
| **Ren räknare** ("N valda") | Bulk-action-bekräftelse utan behov av att identifiera individer | — | Gmail bulk-select, Shopify Polaris ResourceList, GitHub Issues bulk-bar, vår egen `MarkeringsBatchBar`s `role="status"`-räknare | intern kod + produktmönster (se § 6) |
| **Trunkerad namnlista i text** ("A, B och N till") | Mellanting: snabb identifiering av NAMNGIVNA personer inom en gräns för utrymme | Text, ingen bild krävs | Google Kalenders gästlista (mönstret är allmänt känt men **kunde inte primärkälle-beläggas** denna session, se § "Vad jag inte kunde belägga") | delvis obelagt |

**Det avgörande urvalskriteriet mellan rad 1 och rad 4** är om identiteten
bärs av ett ANSIKTE (då är avatarstapeln rätt verktyg — igenkänning är
snabbare visuellt än textläsning) eller av ett NAMN (då är avatarstapeln
en omväg: den tvingar användaren att antingen känna igen initialerna eller
klicka för att få namnen, när namnen kunde stått där direkt). Vår app har
**inga profilfoton i datamodellen** (verifierat: `Registration`/`Person`-
typerna saknar foto-/avatar-fält) — varje avatarstapel hos oss vore alltså
initial-cirklar, inte ansikten.

## 2. Talen — vad som är belagt, med spridning

**Ingen konsensussiffra finns.** De källor som faktiskt anger ett tal gör
det olika:

| Källa | Tal | Typ av belägg |
|---|---|---|
| Pinterest Gestalt `AvatarGroup` | **3** synliga, resten som siffra | Dokumentationstext: *"up to three user avatars. More users, if present, will be displayed as a numerical count."* |
| MUI `AvatarGroup` | **5** (`max`-propens default) | Källkod: `AvatarGroup.js`, destrukturering `max = 5,` |
| Fluent UI (v8) `Facepile` | **5** (`maxDisplayablePersonas` default) | Källkod: `Facepile.base.tsx`, `static defaultProps = { maxDisplayablePersonas: 5, … }` |
| Microsoft Power Platform Creator Kit (samma Facepile-omslag) | **5**, uttryckligen rekommenderat | Dokumentationstext, ordagrant: *"Maximum number of Persona to appear of the Facepile — **Five is the default and recommended number**"* |
| Fluent 2 (nuvarande webb-designsystem) `AvatarGroup` | **5** som tröskel | Dokumentationstext: *"If there are more than five people or groups to represent, the fifth avatar slot can show an overflow avatar…"* |
| GitHub Primer `AvatarStack` | **4** som HÅRT tak — inget tal däröver, mönstret byts | Dokumentationstext: *"An AvatarStack displays a minimum of 2 Avatars and a maximum of 4 Avatars"*; *"Don't use AvatarStack if there is adequate space to show 4 Avatars or less"* (dvs. har du fler väljer du ett annat mönster, du trunkerar inte till 4) |
| Ant Design `Avatar.Group` | **Inget default-tak** — `max`/`maxCount` är opt-in per instans; utelämnat visas alla | Källkod/API-referens: `maxCount` (v5, deprecated) → `max={{ count }}` (v6); ingen default-siffra dokumenterad |
| Atlassian `avatar-group` (Atlaskit) | **Ej verifierat** denna session | Se § "Vad jag inte kunde belägga" — komponentsidan är JS-renderad och gav inte upp props-tabellen via hämtning |

**Läsning av spridningen:** tre oberoende källor (MUI, Fluent UI v8, Fluent
2) konvergerar på **5**, och en av dem (Microsoft) kallar det uttryckligen
"rekommenderat" snarare än bara en implementationsdetalj. Pinterest
avviker nedåt (3). Primer avviker genom att inte alls erbjuda ett tal —
den sätter en hård gräns och byter verktyg. Ant Design lämnar beslutet helt
åt utvecklaren. **Det finns alltså inte EN branschsiffra** — det finns ett
kluster runt 3–5 för system som väljer att trunkera, och en princip
("byt mönster, trunkera inte för långt") hos det system som inte gör det.

## 3. Overflow-mönstren

Fyra distinkta sätt att hantera det som inte får plats, alla belagda:

1. **Statisk "+N", ingen interaktion inbyggd.** MUI:s default: overflow-
   avataren renderas som ett textinnehåll (`+${extraAvatars}`) utan
   ARIA-attribut eller klick-hanterare — utvecklaren kopplar på egen hand
   via `slotProps`/`renderSurplus` om något ska hända vid klick.
2. **Popover/menu-trigger med namnlista.** Ant Design: `max`-avataren är en
   Popover-trigger (klick per nuvarande API); Fluent 2: *"Overflow avatars
   can generally display a popup menu with a detailed list of people."*
   Fluent UI v8 `Facepile`: overflow-knappen bär `ariaDescription` satt
   till en kommaseparerad namnsträng av de dolda personerna — namnen finns
   alltså tillgängliga för skärmläsare/tooltip även innan klick.
3. **En enda sammanfattande accessible name för HELA gruppen.** Pinterest
   Gestalt kräver en `accessibilityLabel` på hela `AvatarGroup`-elementet
   och ger detta konkreta exempel på vad skärmläsaren då läser upp:
   *"Collaborators: Keerthi, Alberto, and 10 more. Add collaborators to
   this board."* — namnen OCH call-to-action i en sammanhållen sats, inte
   uppdelat per avatar.
4. **Inget overflow alls — byt mönster.** Primer `AvatarStack` truncar
   inte längre än 4; går urvalet över det används enligt Primers egen
   dokumentation ett annat komponentval (t.ex. en räknare eller en
   fullständig lista), inte en djupare "+N".

**Ingen av källorna dokumenterar overflow som scroll eller radbrytning**
inom samma yta — samtliga fyra mönster ovan är antingen "visa en gräns +
räkna resten" eller "byt komponent helt".

## 4. Chips/tokens när urvalet INTE redigeras i previewn

Detta är den delfråga där källorna ger en **nyanserad**, inte entydig,
bild — värt att redovisa ärligt i stället för att runda av till en enkel
regel.

**Salesforce Lightning Design System är entydig:** `lightning-pill-
container` implementerar det uttryckliga "Listbox of Pill Options"-
blueprintet. *"By default, pills include a remove button."* Hela
tangentbordsmodellen är byggd kring borttagning: Tab till första pillen,
vänster/höger-pilar mellan pillarna, Tab vidare till x-knappen, Enter/
Space för att ta bort. Det är inte en stödfunktion på en visningskomponent
— det ÄR komponentens existensskäl.

**MUI Chip är mer försiktig, men landar i samma riktning för vårt fall:**
delete-ikonen är OPT-IN (*"Chips with the `onDelete` prop defined will
display a delete icon"*) — en Chip utan `onDelete`/`onClick` är enligt
dokumentationen ren presentation och ligger **inte** i tab-ordningen
(*"if the Chip is deletable or clickable then it is a button in tab
order"*, underförstått: annars inte). Så MUI:s Chip-KOMPONENT tvingar inte
fram borttagbarhet. Men den avgörande risken är inte komponent-API:t —
den är **produktkonventionen**: när ett namn visas i en rundad, kantad
"pill"-form i en editerbar kontext (mottagarfält, filterurval,
tagg-väljare) har användare genom Gmail, Salesforce och liknande system
lärt sig att förvänta sig en x-knapp. Formen bär förväntan även när
komponent-API:t tekniskt tillåter en passiv variant.

**Vårt eget kodbas-precedent pekar åt samma håll, av ett annat skäl.**
`StatusBadge` (`src/components/registrations/StatusBadge.tsx`) är appens
enda etablerade "pill"-vokabulär — 23 förekomster, samtliga
icke-borttagbara statusmärken (kategori, bekräftelse-status,
deadline-läge). Introducerar previewn en NY pill-form för namn skulle den
antingen (a) likna `StatusBadge` och därmed korrekt signalera
"icke-interaktiv", vilket är fint men gör chip-formen till ren dekoration
utan chip-formens egentliga poäng, eller (b) få en synlig x-knapp och
därmed bli appens FÖRSTA borttagbara chip — på en yta som enligt underlaget
uttryckligen INTE redigeras där. Det bryter samma ärlighetsprincip som
redan styr resten av sidan (*"En chevron hade lovat en navigation som inte
finns"*, ur `AtgardsSida.tsx`s egen docblock) — en pill med x-knapp lovar
en borttagning som inte sker på den platsen.

**Slutsats för denna delfråga:** ingen källa säger explicit "använd aldrig
chips read-only". Men ingen källa förespråkar det heller — Salesforces
pill-mönster är byggt end-to-end för borttagning, och MUI:s "passiva
Chip" är ett understött läge, inte det avsedda användningsfallet
(komponentens egen rubrik: *"Chips are compact elements that represent
an input, attribute, or **action**"* — inte "en lista att titta på").
Kombinerat med vårt eget non-removable pill-precedent är slutsatsen att
chip/pill-formen är fel val för en yta som uttryckligen inte redigeras
där den visas.

## 5. Tillgänglighet

**WAI-ARIA APG saknar ett dedikerat "avatar group"-mönster.** Sökning mot
`w3.org/WAI/ARIA/apg/` gav ingen träff på ett sådant pattern i
mönsterkatalogen — designsystemen bygger sina overflow-popovrar på
generiska APG-mönster (Menu, Popover/Dialog) i stället för ett standard-
kontrakt för just "grupp av avatarer". Det här är en **frånvaro-fynd**,
inte en negativ bekräftelse — jag hittade ingen sida som säger "det finns
inget mönster", bara att sökningen inte gav någon träff.

**Det etablerade svaret på "hur annonseras urvalet" är EN sammanhållen
accessible name, inte per-avatar-annonsering.** Pinterest Gestalts
konkreta exempel (§ 3, punkt 3) är den tydligaste primärkällan: hela
gruppen bär `accessibilityLabel`, och skärmläsaren läser upp namnen OCH
syftet i en sats. Fluent UI v8:s `Facepile` gör motsvarande för sin
overflow-knapp specifikt (`ariaDescription` = kommaseparerade namn).

**Avatar-cirkeln själv ska vara `aria-hidden` när ett namn står bredvid
den — det är samma princip som W3C WAI:s egen vägledning om dekorativa
bilder.** WAI:s tutorial om dekorativa bilder: *"a null (empty) `alt` text
should be provided (`alt=""`) so that they can be ignored by assistive
technologies"* när bilden är *"supplementary to adjacent [text]"* eller
*"already described by surrounding text."* Det är EXAKT den regeln vårt
eget deltagarkort redan följer (`NumRuta`, initial-cirkeln i
`DeltagarKortInnehall` — kommentaren i koden citerar samma princip: "texten
är bäraren (WCAG 1.4.1)"). Frågans hypotes — att en avatarstapel med
`aria-hidden` + textalternativ är det etablerade svaret — **håller**, men
mer specifikt: det etablerade svaret är EN sammanfattande text för hela
gruppen (Pinterest-mönstret), inte N separata `aria-hidden`-cirklar med N
separata alt-texter.

**Ett konkret internt a11y-fynd, utanför frågan men värt att bokföra:**
MDN:s guide om aria-live-regioner ger en direkt
relevant varning för räknar-texten som redan finns i `AtgardsSida.tsx`
("N av M deltagare markerade", rad 632, `aria-live="polite"` utan
`aria-atomic="true"`). MDN:s exempel är nästan identiskt med vårt: en
klocka som går från "17:33" till "17:34" utan `aria-atomic="true"`
annonseras av skärmläsare som enbart *"34"* — siffran utan sammanhanget.
Vår rad riskerar samma sak: växlar bara antalet (7→8) kan skärmläsaren
annonsera bara "8", inte "8 av 19 deltagare markerade". Systerkomponenten
`MarkeringsBatchBar` i `Deltagare.tsx` har redan `aria-atomic="true"`
på sin motsvarande status-span (rad 719) — `AtgardsSida.tsx` saknar den,
en genuin inkonsekvens mellan två systerkomponenter i samma kodbas.

## 6. Vid MÅNGA (20–30+)

**Inget källmaterial byter mönster vid en specifik tröskel för "person-
preview" specifikt** — de tal som är belagda (§ 2) handlar om
avatar-STAPELNS egen gräns (3–5 innan "+N"), inte om en högre brytpunkt
där hela ansatsen byts. Det system som kommer närmast en explicit
brytpunkts-regel är Primer: över 4 avatarer byts `AvatarStack` mot något
annat, men dokumentationen namnger inte vilket "något annat" är för större
grupper.

**Det som DÄREMOT är konsekvent belagt är att overflow-mekaniken själv
inte förändras med storleken** — MUI:s, Ant Designs och Fluent UI:s "+N"
skalar aritmetiskt (N blir bara ett större tal); ingen av dem byter till
ett annat gränssnitt vid t.ex. 20 eller 30. En trunkerad namnlista med
"och N till" skalar likadant — texten blir inte längre, bara siffran gör
det.

**Vår egen situation vid 20–30 markerade** skiljer sig från de flesta
källors underliggande scenario på ett sätt värt att notera explicit:
avatarstaplarnas och pillarnas ursprungliga användningsfall (Facepile,
Gestalt, Salesforce) är samarbets-/formulär-kontext med typiskt 2–15
deltagare där VARJE person kan vara relevant att identifiera individuellt.
Vårt tak på 30 med en READ-ONLY bekräftelse ligger närmare bulk-
selection-fältet (Gmail/Polaris "N valda") än avatarstapelns
kärnscenario — ytterligare ett skäl (utöver avsaknaden av foton, § 1) att
inte välja avatarstapeln, snarare än bara ett tal-argument.

## Dom

**Ingen av de tre huvudmönstren (avatarstapel, chip/pill, ren räknare)
passar vårt fall rakt av.** Det starkaste, mest samstämmiga källmaterialet
pekar mot en **hybrid som redan är hälften byggd**: en räknare som
PRIMÄR bekräftelse (matchar branschens standard-bulk-action-mönster
rakt av) plus en **gränssatt, trunkerad namnlista i text** som SEKUNDÄR
bekräftelse för "rätt namngivna personer" — men med en explicit gräns
(3–5, konvergerande mot 5 via tre oberoende källor) i stället för dagens
ogränsade `join(', ')` av upp till 30 namn. Ingen ny chip- eller
avatarstapel-komponent är motiverad: chip/pill bryter appens egen
non-removable-pill-konvention och lovar en borttagning som inte finns
där; avatarstapel förutsätter foton vi saknar och löser fel problem
(igenkänning-via-ansikte, inte namn-verifiering).

## Vad jag inte kunde belägga

- **Atlassian `avatar-group`s exakta default-`maxCount`.** Komponentsidan
  (`atlassian.design/components/avatar-group` och dess `/examples`,
  `/code`-undersidor) är JS-renderad; `WebFetch` fick bara ut
  navigationsskalet och en enda beskrivningsmening, inte props-tabellen.
  Jag försökte tre separata URL:er och npm-readmet (403). Antag inget
  tal härifrån.
- **Google Kalenders gästlista-truncering** ("och N till") nämndes som
  allmänt känt mönster i § 1, men jag hittade ingen primärkälle-sida (varken
  Google Calendar Help eller utvecklardokumentation) som anger det exakta
  antalet synliga gäster innan truncering. Raden i katalogen är därför
  märkt "delvis obelagd" och bör INTE citeras som en fastställd siffra.
  Samma sak för Superhuman/Gmail-mottagarfältets exakta antal chips innan
  kollaps — jag bekräftade att Gmail visar avatar-chips per mottagare
  (Google Workspace Updates-bloggen), men inte vid vilket antal fältet
  börjar kollapsa.
- **Overflow-klickets exakta beteende hos Atlassians `avatar-group`**
  (meny? modal? tooltip?) — samma renderings-begränsning som ovan.
- **MD3-taxonomin för chip-typer (assist/filter/input/suggestion)** kunde
  inte primärkälle-verifieras denna session (`m3.material.io/components/
  chips/*` gav bara sidtitlar, ingen brödtext via `WebFetch`). Jag har
  därför INTE byggt dom 4 på MD3-specifik terminologi, bara på MUI Chip
  (som verifierades) och Salesforce Pills (som verifierades).
- **Slack/Notion/Figma-multiplayerns exakta overflow-tal** för sina
  avatar-barer — jag bekräftade att Figma visar en avatar per aktiv
  deltagare (Figma Blog, "Multiplayer Editing in Figma"), men fick ingen
  siffra för när baren själv börjar trunkera vid många samtidiga
  deltagare.

## Rekommendation för vårt fall

**REKOMMENDATION, inte beslut** — Marcus avgör formen.

Läge: read-only bekräftelse, 1–30 personer, mobil 430 px först, ingen
borttagning sker i previewn (den sker i deltagarkorten en accordion-klick
under).

1. **Behåll räknaren som primär bekräftelse, oförändrad i sin roll.**
   "N av M deltagare markerade" matchar exakt branschmönstret för
   bulk-action-bars (§ 6) och är redan byggd med `aria-live`. **Lägg till
   `aria-atomic="true"`** på räknar-spannet (§ 5) — en liten, källbelagd
   fix, oberoende av resten av beslutet.

2. **Ersätt den ogränsade `join(', ')`-strängen med en gräns på 5 synliga
   namn, sedan "och N till" som REN TEXT** — ingen ny interaktiv yta.
   Gränsen 5 följer det starkaste konvergerande talet i § 2 (MUI-default,
   Fluent UI-default+rekommendation, Fluent 2-tröskel — tre oberoende
   källor). Formatet blir t.ex. *"Rasmus Wallin, Petra Kvist, Nils
   Zetterlund, Anna Berg, Erik Holm och 9 till."* — 14 namn krymper till en
   rad i stället för ett stycke.

3. **Gör INTE "och N till" klickbar/expanderbar.** Sidan har redan en
   fungerande "se alla"-mekanik ett steg bort: räknar-raden ÄR redan
   accordion-huvudet för den fullständiga kortlistan (varv 4b/4c,
   redan byggt). Att lägga en andra klick-yta på namntexten hade byggt
   parallell maskineri för samma jobb, och APG erbjuder inget standard-
   kontrakt för en sådan mini-popover (§ 5) — varje sådan yta blir
   eget, otestat mönster. Låt HELA räknar-raden (som redan är knappen)
   vara den enda vägen till fullständig lista.

4. **Bygg ingen chip/pill-form och ingen avatarstapel för denna yta.**
   Motiveringen är sammanfallande, inte enkelspårig: chips/pills bryter
   appens egen non-removable-pill-konvention (`StatusBadge`, 23
   förekomster) och signalerar en borttagning som inte finns på denna
   plats (§ 4); avatarstapeln förutsätter foton vi inte har och löser
   igenkänning-via-ansikte snarare än namn-verifiering, som är vad Lotta
   faktiskt behöver (§ 1, § 6).

**Avvägningen som talar EMOT denna rekommendation, öppet:** en trunkerad
textlista är fortfarande TEXT — den vinner inget av avatarstapelns
visuella skanningshastighet för den som KÄNNER igen ansikten (irrelevant
här, inga foton) men den vinner heller inget av en riktig lista-layouts
läsbarhet för långa namn. Om Marcus värderar visuell "detta är en grupp
av N personer"-signal högre än exakt namn-verifiering, är en enkel
initial-cirkel-rad (utan foto, men med tydlig avgränsning per person och
UTAN x-knapp) ett rimligt mellanting — det är fortfarande inte belagt som
branschstandard FÖR VÅRT SCENARIO (ingen källa i detta pass adresserar
just "trunkerad namn-bekräftelse utan foto, read-only, 1–30 poster"), och
den luckan är den ärligaste sammanfattningen av vad detta pass visar:
**vårt exakta scenario ligger mellan de etablerade mönstren, inte på ett
av dem.**

## Källförteckning

**Auktoritativa förstapartskällor — designsystem, dokumentation:**

- [MUI — React Avatar (AvatarGroup)](https://mui.com/material-ui/react-avatar/)
- [MUI — AvatarGroup källkod (`max = 5`)](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/AvatarGroup/AvatarGroup.js)
- [MUI — React Chip](https://mui.com/material-ui/react-chip/)
- [Fluent UI (v8) — Facepile källkod (`Facepile.base.tsx`)](https://github.com/microsoft/fluentui/blob/master/packages/react/src/components/Facepile/Facepile.base.tsx)
- [Fluent UI (v8) — Facepile types (`Facepile.types.ts`)](https://github.com/microsoft/fluentui/blob/master/packages/react/src/components/Facepile/Facepile.types.ts)
- [Microsoft Learn — Power Platform Creator Kit, Facepile control reference ("Five is the default and recommended number")](https://learn.microsoft.com/en-us/power-platform/guidance/creator-kit/facepile)
- [Fluent 2 Design System — React Avatar group usage](https://fluent2.microsoft.design/components/web/react/core/avatargroup/usage)
- [Pinterest Gestalt — AvatarGroup (web)](https://gestalt.pinterest.systems/v1/web/avatargroup)
- [Ant Design — Avatar (Avatar.Group)](https://ant.design/components/avatar/)
- [GitHub Primer — AvatarStack (product guidance)](https://primer.style/product/components/avatar-stack/)
- [GitHub Primer — AvatarStack (React API)](https://primer.style/react/AvatarStack/)
- [Salesforce Lightning Design System — `lightning-pill-container` documentation](https://developer.salesforce.com/docs/component-library/bundle/lightning-pill-container/documentation)
- [Atlassian Design System — Avatar group (landningssida, se förbehåll ovan)](https://atlassian.design/components/avatar-group)
- [W3C WAI — Images tutorial, Decorative images](https://www.w3.org/WAI/tutorials/images/decorative/)
- [MDN — ARIA: Live regions (`aria-atomic`)](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
- [W3C WAI-ARIA Authoring Practices Guide (APG) — mönsterkatalog, sökt utan träff på "avatar"](https://www.w3.org/WAI/ARIA/apg/)

**Sekundära/produktbelägg (lägre vikt, ej primärkälle-verifierade i denna
session utöver vad som citeras explicit ovan):**

- [Google Workspace Updates — visuella uppdateringar för To/Cc/Bcc i Gmail (avatar-chips per mottagare)](https://workspaceupdates.googleblog.com/2021/10/visual-updates-for-composing-email-in-gmail.html)
- [Figma Blog — Multiplayer Editing in Figma](https://www.figma.com/blog/multiplayer-editing-in-figma/)
- [Linear Docs — Assign and delegate issues](https://linear.app/docs/assigning-issues)

**Internt refererat (kontext, inte extern källa):**

- [`docs/specs/ATGARDSSIDAN-UNDERLAG.md`](../specs/ATGARDSSIDAN-UNDERLAG.md)
  — det styrande underlaget, § 4 och § 9
- `src/components/events/atgarder/AtgardsSida.tsx` — dagens
  preview-implementation (raden Marcus dömde ut)
- `src/components/events/detail/Deltagare.tsx` — systerkomponentens
  `MarkeringsBatchBar`
- `src/components/registrations/StatusBadge.tsx` — appens
  non-removable-pill-precedent
