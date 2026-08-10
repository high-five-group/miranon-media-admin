# Personlistan som scan-lista: branschmönster för kortyta och statuspiller

> **Proveniens:** avgränsat research-pass (bakgrundsagent), 2026-08-10, inför
> Marcus konvergensval mellan de två byggda kandidaterna i
> `PersonsListPrototyp.tsx` (S103, tråd T97). Kört oisolerat i worktreen
> `.claude/worktrees/s103-t97-personvyerna`, ocommittat.

## Vad jag redan hade, innan sökningen

`docs/research/` innehåller ett pass nära ämnet:
`filtervy-listor-monster-2026-07-24.md` (2026-07-24) om filtreringsmönster
för listvyer. Det svarar inte på denna fråga (det gäller
filter-interaktion, inte radstil eller statuspiller) men bekräftar samma
källhierarki-ordning (FK, MOJ, GOV.UK, NN/g) och samma slutsats om FK:s
tunna precedens-rymd på listmönster.

`docs/decisions/` gav två träffar: `ADR-102` (prototypen är facit) och
`ADR-103` (promoveringsformen). Båda avgör PROCESSEN kring hur en godkänd
prototyp blir skarp yta. Ingen av dem tar ställning till radformen eller
statuspiller-frågan. Ingen ADR reglerar alltså detta i förväg, och det
finns ingen tidigare research att komplettera i stället för att duplicera.
`tasks/lessons.md` gav noll relevanta träffar på "zebra", "tonal",
"divide-y" eller "badge".

Slutsats: detta pass körs i full bredd, det är genuint nytt underlag.

## Frågan

Hur bygger branschledarna en scan-lista över personer i ett admin-verktyg,
och vad säger deras praxis om (a) tonal kortyta med avdelare kontra
zebra-tintade rader, och (b) om en statusbadge som betyder "ingenting har
hänt" hör hemma i en scan-lista?

## Sammanfattat svar

**Fork 1 (kortyta):** branschledarna skiljer konsekvent mellan
EN-kolumns-listor (radera som länkar till en detaljsida: namn + dämpad
metarad) och FLER-kolumners-tabeller (data som ska jämföras cell mot
cell). Zebra-randning hör till den andra klassen. Ingen av de
förstapartskällor som har en ren en-kolumns-listkomponent (Shopify
Polaris ResourceList, GitHub Primer ActionList, GOV.UK Summary List, Ant
Design List, Material Design 3 List) erbjuder eller rekommenderar zebra
för den komponenten; samtliga bygger radseparation med
avdelare/marginal. Zebra-randning finns däremot uttryckligen i alla
komponenter som är explicit TABELLER eller multi-cells-listor (Polaris
IndexTable/DataTable, Carbon Data Table, Carbon Structured List,
Salesforce SLDS-tabell), med samma motivering varje gång: hjälpa ögat
följa en rad HORISONTELLT över flera kolumner. Vår personlista är en
EN-kolumns scan-lista (namn bär raden, kontakt och piller står under) -
den horisontella spårningsuppgiften zebra löser finns inte här. **Detta
är research-passets tyngsta enskilda fynd** och pekar entydigt mot
`tonal`.

**Fork 2 (badgen):** ingen källa adresserar frågan rakt av ("ska en
badge som betyder frånvaro-av-händelse visas när den bär hälften av
raderna i en lång scan-lista"), men det närmaste släktskapet -
progressions-status i en radlista - har verklig precedent, och den pekar
åt att VISA statusen: GOV.UK:s task-list-mönster har en dedikerad,
forskningsbelagd "Not started"/"Cannot start yet"-tagg, och Atlassians
Lozenge-komponent listar "not started" som ett kanoniskt exempel på
default-utseendet. Motstående princip: allmän badge-brus-litteratur
(sekundärkälla) varnar för att en badge som bärs av nästan alla rader
tappar signalvärde. Ingen branschledare kopplar dock sin regel till en
tröskel ("om >N % av raderna bär badgen, ta bort den") - den bedömningen
är min egen syntes, inte ett citat.

---

## Fork 1: Tonal kortyta med avdelare kontra zebra-tintade rader

### Vad de en-kolumns-listkomponenter som finns hos branschledarna gör

- **Shopify Polaris ResourceList/List** - den komponent Polaris själva
  visar med en KUNDLISTA som exempel (samma domän som vår Personer-lista):
  radinnehåll rangordnas efter vikt (namn -> sekundär info -> metadata) i
  en enda kolumn. Zebra-propen (`hasZebraStriping`/
  `hasZebraStripingOnData`) finns namngiven bara på **IndexTable** och
  **DataTable** - Polaris egna multi-kolumns-tabellkomponenter. Jag har
  inte hittat någon motsvarande zebra-prop på ResourceList/List; sökningen
  fann ingen sådan, vilket inte är samma sak som ett bevisat negativt
  fynd, men ingen av flera riktade sökningar gav träff.
  <https://polaris-react.shopify.com/components/tables/index-table>,
  <https://polaris-react.shopify.com/components/lists/resource-list>
- **GitHub Primer ActionList** (samma listform som vår: klickbar rad,
  ikon/text, enkel kolumn): "*Item dividers allow users to parse heavier
  amounts of information. They're placed between items and are useful in
  complex lists, particularly when descriptions or multi-line text is
  present.*" - men med en uttrycklig vakt mot att använda dem slentrianmässigt:
  "*When considering whether to use item dividers, make sure they truly
  make the presented information easier to parse, instead of only
  increasing visual clutter.*" Ingen zebra-mekanism nämns över huvud
  taget för ActionList.
  <https://primer.style/product/components/action-list/guidelines/>
- **GOV.UK Summary List** (rad = etikett + värde + åtgärd, en radtyp per
  post): dividers är default, och GOV.UK varnar UTTRYCKLIGEN mot att ta
  bort dem: "*Think carefully before you remove row borders. Borders help
  many users find and read information that's laid out in rows,
  especially users who zoom in on pages or use assistive technologies to
  magnify their screen.*" Ingen zebra-variant finns i komponenten.
  <https://design-system.service.gov.uk/components/summary-list/>
- **Material Design 3 List**: dividers är valfria för listor med
  repetitivt format - marginalen mellan posterna räcker då. Full-bredd-
  avdelare rekommenderas för att separera ORELATERAT innehåll, och
  systemet varnar mot överanvändning: för många avdelarlinjer gör
  gränssnittet "cluttered". Ingen zebra-mekanism dokumenterad för List.
  (Källan är JS-renderad och kunde inte hämtas fulltext - detta bygger på
  sökmotorns utdrag, svagare källgrund än de tre ovan, men konsekvent med
  dem.) <https://m3.material.io/components/lists/guidelines>,
  <https://m3.material.io/components/divider/guidelines>
- **Ant Design List**: har en `split`-prop för avdelare mellan poster
  (default-på); ingen zebra-mekanism hittad.
  <https://ant.design/components/list/>

### Vad zebra-komponenterna hos branschledarna faktiskt är

- **Polaris IndexTable/DataTable**: `hasZebraStriping` /
  `hasZebraStripingOnData` - namngivna EXPLICIT som tabell-features, inte
  list-features.
  <https://polaris-react.shopify.com/components/tables/data-table>
- **Carbon Data Table**: zebra-modifieraren finns "*to make scanning
  horizontal information easier for the user*" - motiveringen är
  ordagrant horisontell spårning över kolumner, inte vertikal scanning
  nedåt i en lista.
  <https://carbondesignsystem.com/components/data-table/usage/>
- **Carbon Structured List**: har också en zebra-modifierare, men
  komponenten är i sig multi-cells (flera kolumner per rad, används bl.a.
  för jämförelsetabeller) - den ligger alltså närmare tabellklassen än
  vår en-kolumns radlista, trots namnet "list". Samma sida ger en
  konkret trösekel för komponentbyte: "*If you have more than 25 items or
  additional content that needs to be shown, consider using a data
  table.*" - vilket indirekt säger att structured list (den enkla,
  icke-zebra-motiverade formen) är den avsedda formen för KORTARE listor,
  medan datatabellen (med sin horisontella-scan-motivering) tar över vid
  volym och komplexitet.
  <https://v10.carbondesignsystem.com/components/structured-list/usage/>
- **Salesforce Lightning (SLDS)**: `slds-table_striped`-klassen finns
  bara på `slds-table`, dvs. tabellkomponenten.
- **Eleken (branschsammanställning, sekundärkälla, 2026)**: uttrycker
  samma sak i klartext: "*If you have massive amounts of dense data, use
  zebra striping ... to guide the eye horizontally without adding border
  weight*" - zebra beskrivs explicit som ett verktyg för att hålla ISÄR
  KOLUMNER i BREDA tabeller.
  <https://www.eleken.co/blog-posts/table-design-ux>

**Syntes (min slutsats, byggd på källorna ovan):** mönstret är
konsekvent nog över fem oberoende designsystem för att kallas
branschstandard snarare än tillfällighet: **en-kolumns scan-listor
använder avdelare (eller ren marginal); zebra-randning hör till
multi-kolumners tabeller** och motiveras alltid med horisontell
spårning. Vår Personer-lista är strukturellt en en-kolumns-lista (namn
bär raden, kontaktrad och piller är underordnad information i SAMMA
kolumn, inte egna kolumner) - den faller på "list"-sidan av denna
branschgräns, inte på "table"-sidan.

### A11y-ställningen för zebra kontra avdelare

- **Forskningsläget är äldre och blandat, med en enda konsekvent
  slutsats.** Jessica Enders/A List Apart (2008, två studier): den
  första (244 deltagare, 9-kolumners tabell) gav ingen signifikant
  hastighetsvinst och ingen skillnad i felfrekvens - "*it didn't give any
  indication that zebra striping makes things worse*". Uppföljningen
  (2 276 respektive 1 200+ deltagare) fann signifikant högre precision
  på 3 av 8 frågor under tidspress, och en tydlig PREFERENS för enfärgad
  randning i en rankningsstudie. Slutsatsen då: "*the safest option is to
  shade the alternating, individual rows of your table with a single
  color.*" **Detta är den empiriskt STARKASTE precedenten i hela passet**
  - men den gäller uttryckligen TABELLER (9 kolumner), inte en-kolumns
  listor, och den är arton år gammal - omprövad i den bemärkelsen att
  senare källor (Eleken, Carbon, Polaris) smalnat av rekommendationen
  till just multi-kolumns-fallet snarare än att motsäga den.
  <https://alistapart.com/article/zebrastripingdoesithelp/>,
  <https://alistapart.com/article/zebrastripingmoredataforthecase/>
- **Forced-colors/Windows High Contrast Mode är den skarpaste tekniska
  invändningen mot zebra, och den är väldokumenterad.** Adrian Roselli
  (etablerad a11y-praktiker, artikeln från 2017-11-02, uppdaterad
  2024-01-10): "*The zebra stripes will go away completely*" under
  Windows High Contrast Mode, eftersom bakgrundsfärger tvingas bort av
  systemet. En äkta RAM/border (vår `tonal`-variants `divide-y`) består
  som synlig linje i samma läge, eftersom kantfärger hanteras av
  forced-colors på ett sätt som bevarar dem som en urskiljbar linje - det
  är precis den mekanik som redan syns i kodbasens egen
  `contrast-more:border-border-strong`-klass på `tonal`-varianten.
  <http://adrianroselli.com/2017/11/a-responsive-accessible-table.html>
- **WCAG 1.4.1 (Use of Color) är sannolikt INTE ett formellt krav mot
  zebra i sig** - zebra bär ingen DISKRET INFORMATION (det är ett rent
  scan-hjälpmedel, inte en statusindikator), så kriteriet gäller inte i
  samma mening som för färgkodade statuspiller. Detta är min egen
  bedömning byggd på hur SC 1.4.1 är formulerat i sekundärkällor
  (webaim.org, w3.org/TR-förklaringen); jag har inte verifierat den mot
  en jurist-nivås tolkning och den bör läsas som en rimlig slutsats, inte
  ett garanterat faktum.
- **Community-praxis där zebra ändå används rekommenderar låg kontrast**
  ("*soft greys ... a 5-10% grey tint is enough*", Eleken) - dvs. även i
  de fall zebra används är rådet att göra kontrasten SVAG, vilket
  ytterligare urholkar dess värde som scanhjälp jämfört med en riktig
  avdelare.

### Mobil kontra desktop

Den bredare branschrörelsen (tabell -> kort på smal viewport, bekräftad
i flera sekundärkällor om responsiv tabell-design) handlar om att en
BRED tabell blir OHANTERLIG på mobil och görs om till kort. Den frågan är
redan avgjord i vår kod: båda kandidaterna är redan kort-baserade
en-kolumns-listor, på både mobil och desktop (samma 600 px-spalt). Ingen
källa jag hittat byter METOD (divider kontra zebra) vid en brytpunkt
inom en redan kortbaserad lista - frågan verkar inte uppstå i den formen
någonstans i det material jag sökt igenom. **Tunn precedent, öppet
deklarerad**: ingen branschledare adresserar "byter divider/zebra-valet
form vid en brytpunkt" specifikt, sannolikt för att frågan bara uppstår
när listan ändå redan är i kortform (vilket vår är, på båda
brytpunkterna).

### Rekommendation, Fork 1

**`tonal`. Precedent-styrka: STARK (5 oberoende förstapartskällor pekar
samstämmigt åt samma håll: Polaris, Primer, GOV.UK, Material, Ant
Design).** Skälen i prioritetsordning:

1. Vår lista är strukturellt en en-kolumns scan-lista, exakt den klass
   där samtliga funna designsystem använder avdelare/marginal och INTE
   zebra.
2. Zebras hela evidensbas (Enders, Eleken, Carbon, Polaris-tabellerna)
   motiverar tekniken med horisontell spårning över kolumner - en
   uppgift vår lista inte har.
3. GOV.UK:s uttryckliga varning mot att ta bort radavdelare (zoom- och
   förstoringsanvändare) är en positiv a11y-siffra FÖR avdelare, inte
   bara en neutral avsaknad av invändning mot zebra.
4. Forced-colors-beteendet (Roselli) är en konkret, mätbar robusthets-
   fördel för `divide-y`/border framför bakgrundstining.

Motargumentet värt att notera öppet: Enders fann faktiskt en svag
PREFERENS-fördel för randning i en enkätstudie (inte en
prestandafördel) - men den studien mätte en 9-kolumners tabell, inte en
en-kolumns kortlista, så överförbarheten till vårt fall är låg.

---

## Fork 2: "Ingenting hänt"-badgen

### Närmaste precedent: progressions-status i en radlista

- **GOV.UK task-list-mönstret** (aktuell komponentsida + mönstersidan
  "Complete multiple tasks"): statusarna är "Not yet started"/"Cannot
  start yet" (grå/blå, ingen röd bakgrund som är reserverad för fel),
  "In progress" och "Completed" (svart text, INGEN bakgrundsfärg alls -
  även den "färdiga" statusen hålls visuellt lätt). Mönstret INKLUDERAR
  alltså aktivt en badge för "inget har hänt än". Guidance-texten öppnar
  dock för att statusen är VILLKORAD av användarforskning: "*You may find
  you need additional statuses if your user research shows that users
  want to be able to distinguish between the tasks they haven't started
  at all, and those they've started but not completed.*"
  <https://design-system.service.gov.uk/patterns/complete-multiple-tasks/>,
  <https://design-system.service.gov.uk/components/task-list/>
- **Skarpt användarforskningsbelägg för just detta:** tempertemper.net
  (2019), en praktiker som byggde en tidig version av GOV.UK:s
  task-list-mönster och testade båda formerna: "*After testing with both
  blank and the 'not started' tags, we were reassured that users found
  the 'not started' tag easier to use.*" Det är den enda källan i hela
  passet som direkt mätt "tom yta" mot "explicit badge för
  frånvaro-av-status" - och resultatet talar FÖR badgen.
  <https://www.tempertemper.net/portfolio/a-minimal-task-list-pattern-for-govuk>
- **Atlassian Lozenge**: "not started" listas som ett av de kanoniska
  exemplen på default-lozengens (grå, låg valör) användningsområde,
  tillsammans med "to do", "unavailable", "minor". Design systemet har
  alltså en färdig, avsedd plats för exakt denna typ av status.
  <https://atlassian.design/components/lozenge>
- **Shopify Polaris Badge, "default"-tonen**: reserverad för "*passive
  notifications ... a state where merchant action is not required or
  when these statuses are achieved automatically without any merchant
  input*". Semantiskt närbesläktat (låg-signal, ej krävande status) men
  adresserar inte specifikt "inget har hänt ÄN"-fallet - Polaris exempel
  är snarare autonoma bakgrundsstatusar än frånvaro-av-handling.

### Motstående signal: badge-brus som allmän princip

Ingen förstapartskälla bland designsystemen ovan formulerar en regel om
att UTELÄMNA en statuspille pga. hög andel. Den regeln finns bara i
sekundärkällor om badge-design generellt (Setproduct, Mobbin, Eleken
badge-artiklarna): "*when every nav item, card, and button has a badge,
none of them mean anything*" och en tumregel att ifrågasätta en fjärde
badge på samma skärm. Den regeln handlar dock om badge-TÄTHET PER YTA
(hur många OLIKA badge-typer syns samtidigt), inte om andelen RADER i en
LÅNG LISTA som bär SAMMA badge - det är inte samma fråga, och jag har
INTE hittat en källa som uttalar sig om just den tröskeln.

Den närmast liggande, men strukturellt ANNORLUNDA regeln:
**count/notifikations-badgar döljs vid noll** (Ant Design: "*Badge will
be hidden when count is 0*", allmän branschkonvention för
notifikations-prickar). Detta är en annan komponentklass än en
STATUS-etikett: en räknare vid 0 bär bokstavligen ingen information
("inget nytt"), medan en statusetikett som "Ej påbörjat" bär en
faktisk, om än vanlig, sanning om personen. Regeln för räknare är därför
inte direkt överförbar till statuspiller - GOV.UK:s egen praxis (som
explicit VISAR "not started"/"cannot start yet") bekräftar att
design-branschen behandlar de två klasserna olika.

### Vad som skiljer vårt fall från GOV.UK-precedenten, öppet

GOV.UK:s task-list är EN lista över UPPGIFTER som tillhör EN användare
(vanligen 3-10 poster) - varje rad är relevant för användaren att
slutföra, och statusen hjälper HEN spåra sin EGEN progression. Vår
Personer-lista är en lista över HUNDRATALS OLIKA PERSONER, där "Ej
påbörjat" beskriver ett tillstånd hos DEN PERSONEN (inte hos den som
scannar listan), och bärs av ~hälften av raderna. Ingen källa jag
hittat adresserar den specifika situationen "en status delas av ungefär
hälften av posterna i en lång scan-lista av OLIKA entiteter" - det är en
skarp och öppet deklarerad lucka i precedensen.

### Rekommendation, Fork 2

**Svag precedent åt båda hållen - men den precedent som FINNS lutar mot
att BEHÅLLA en synlig badge, inte mot att ta bort den.** Min egen
bedömning, byggd på resonemang snarare än ett direkt citat: GOV.UK:s
mönster + tempertempers faktiska A/B-liknande test är den enda källan
som mätt "tom yta" mot "explicit badge för frånvaro-av-status", och
resultatet var entydigt till badgens fördel - blank yta lästes som
osäkerhet, inte som "inget att rapportera". Det talar mot att helt
utesluta pillen.

Det jag INTE kan belägga med precedent, och där jag i stället resonerar
själv: när andelen som bär samma etikett är hög (ungefär hälften av 200
rader) i en lista av OLIKA entiteter (inte en persons egna uppgifter),
väger scan-kostnaden annorlunda än i GOV.UK:s fall - en etikett som
upprepas på varannan rad bidrar mindre särskiljande information per
rad, vilket är precis den mekanism badge-brus-litteraturen varnar för
(fast för en annan situation). En rimlig syntes, som INGEN källa säger
rakt ut men som följer av att lägga GOV.UK-precedensen och
badge-brus-principen sida vid sida: behåll pillen som koncept
(GOV.UK-argumentet), men överväg att sänka dess visuella vikt
ytterligare för basfallet (samma riktning som GOV.UK själva gör för sin
egen "Completed"-status: svart text, ingen bakgrundsfärg alls) snarare
än att ge den samma pill-form som de mer sällsynta, mer handlingskrävande
statusarna. Det är en avvägning Marcus bör göra med öppna ögon snarare
än en branschregel jag kan hänvisa till.

---

## Vad precedenten INTE svarar på

1. Ingen källa ger en numerisk tröskel för när en lista räknas som
   "scan-lista" och byter form (Carbon:s "25 poster" gäller
   komponentval structured-list -> data-table, inte divider -> zebra).
2. Ingen källa adresserar explicit "badge som bärs av ~50 % av raderna i
   en lång lista av olika entiteter" - se Fork 2 ovan.
3. Apple HIG:s sidor för "Lists and tables" gick inte att hämta i
   fulltext (JavaScript-renderad sida); passet bygger här bara på
   sökmotor-utdrag och räknas INTE som en verifierad förstapartskälla i
   detta dokument.
4. Material Design 3:s sidor (Lists, Divider) gick av samma tekniska skäl
   inte att hämta i fulltext - slutsatserna ovan bygger på sökmotorns
   utdrag av sidorna, inte en fullständig läsning. Konsekvent med övriga
   källor, men svagare belagt än de källor som hämtades direkt.
5. USWDS och Fluent UI (DetailsList) undersöktes ytligt men gav inget
   substantiellt fynd om vare sig divider/zebra-frågan eller
   badge-frågan - negativt fynd, inte ett bevis på att de saknar
   ståndpunkt.
6. Ingen källa uttalar sig om exakt VILKEN visuell vikt en "inget hänt"-
   status bör ha relativt andra statusar (min rekommendation i Fork 2
   är syntes, inte citat).

## Källförteckning

### Förstapartskällor, hämtade i fulltext

- GitHub Primer, ActionList-riktlinjer:
  <https://primer.style/product/components/action-list/guidelines/>
- GOV.UK Design System, Summary list-komponenten:
  <https://design-system.service.gov.uk/components/summary-list/>
- GOV.UK Design System, Task list-komponenten:
  <https://design-system.service.gov.uk/components/task-list/>
- GOV.UK Design System, mönstret "Complete multiple tasks":
  <https://design-system.service.gov.uk/patterns/complete-multiple-tasks/>
- GOV.UK Design System, Table-komponenten (negativt fynd - ingen
  striping-vägledning):
  <https://design-system.service.gov.uk/components/table/>
- Shopify Polaris React, Data table:
  <https://polaris-react.shopify.com/components/tables/data-table>
- Carbon Design System, Structured list usage:
  <https://v10.carbondesignsystem.com/components/structured-list/usage/>

### Förstapartskällor, via sökmotor-utdrag (ej fulltext-verifierade)

- Material Design 3, Lists guidelines:
  <https://m3.material.io/components/lists/guidelines>
- Material Design 3, Divider guidelines:
  <https://m3.material.io/components/divider/guidelines>
- Shopify Polaris React, ResourceList/List:
  <https://polaris-react.shopify.com/components/lists/resource-list>
- Shopify Polaris React, Badge:
  <https://www.setproduct.com/blog/badge-ui-design> (indirekt, se
  primärkälla-diskussion i Fork 2)
- Carbon Design System, Data table usage:
  <https://carbondesignsystem.com/components/data-table/usage/>
- Ant Design, List-komponenten: <https://ant.design/components/list/>
- Ant Design, Badge-komponenten: <https://ant.design/components/badge/>
- Atlassian Design System, Lozenge:
  <https://atlassian.design/components/lozenge>
- Apple Human Interface Guidelines, Lists and tables (kunde inte hämtas
  i fulltext, se § Vad precedenten INTE svarar på):
  <https://developer.apple.com/design/human-interface-guidelines/components/layout-and-organization/lists-and-tables/>

### Forskning och etablerad tredjepart

- Jessica Enders, "Zebra Striping: Does it Really Help?", A List Apart,
  2008-05-06: <https://alistapart.com/article/zebrastripingdoesithelp/>
- Jessica Enders, "Zebra Striping: More Data for the Case", A List
  Apart, 2008-09-10:
  <https://alistapart.com/article/zebrastripingmoredataforthecase/>
- Adrian Roselli, "A Responsive Accessible Table", 2017-11-02
  (uppdaterad 2024-01-10):
  <http://adrianroselli.com/2017/11/a-responsive-accessible-table.html>
- tempertemper.net, "A minimal task list pattern for GOV.UK", 2019:
  <https://www.tempertemper.net/portfolio/a-minimal-task-list-pattern-for-govuk>
- Eleken, "Table Design UX Guide to Improve SaaS Usability and
  Clarity" (branschsammanställning, sekundärkälla):
  <https://www.eleken.co/blog-posts/table-design-ux>
- Nielsen Norman Group, "Designing Empty States in Complex
  Applications" (allmän empty-state-vägledning, ej badge-specifik):
  <https://www.nngroup.com/articles/empty-state-interface-design/>

### Ej bekräftat / negativa fynd

- USWDS (designsystem.digital.gov): ingen relevant divider/zebra- eller
  badge-vägledning hittad i detta pass.
- Fluent UI (DetailsList): sökningen gav bara GitHub-diskussioner om
  buggar, ingen officiell riktlinjetext om radstil.
- Base Web: inte undersökt i detta pass (tidsprioritering; frågan var
  redan väl täckt av de fem huvudkällorna i Fork 1 innan Base Web hanns
  med).
