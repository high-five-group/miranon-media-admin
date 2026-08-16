---
owner: marcus803
updated: 2026-08-16
review_by: 2026-11-16
status: draft
---

# Segment-byggare för icke-tekniska användare — branschmönster (2026-08-16)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört
> oisolerat i `.claude/worktrees/s104-segment-passet` (huvudkatalogen ägs av
> en annan aktiv session, S102). Committar inget — orkestreraren landar
> filen på S104:s gren (`fix/task-181-s104-granskningsvarv-utbildning-tackning`).
> Research genomfört av tre parallella fork-agenter (delad kontext, egna
> sök-turer) som var och en täckte en avgränsad delmängd produkter/frågor;
> denna fil är syntesen.

## Frågan

Hur designar branschledande produkter sina segment-/audience-byggarytor så
att icke-tekniska användare kan bygga regelbaserade urval utan att
skrämmas — och vilka konkreta mönster (struktur, progression, AND/OR-
framställning, exkludering, live-förhandsvisning, rubriker/namngivning)
bär den enkelheten?

---

## Inventering FÖRE första sökningen — vad som redan fanns

Fyra ADR:er och ett tidigare research-pass täcker angränsande mark, lästa i
sin helhet innan någon websökning gjordes:

- **[`dynamiska-segmentregler-branschmonster-2026-08-10.md`](./dynamiska-segmentregler-branschmonster-2026-08-10.md)**
  är det mest näraliggande passet (samma dag-6-veckor-gamla research,
  samma sju produkter delvis). Men det svarar på en ANNAN fråga:
  **regelns DATAMODELL** — statiskt vs dynamiskt medlemskap, uppräkning vs
  predikat som schema-form, var beräkningen sker, sänd-tids-drift. Det
  rör aldrig BYGGAR-UI:t — hur ett villkor SER UT på skärmen, var
  rubriken sitter, vad ett tomt läge visar. Detta pass är alltså
  komplementärt, inte en omskrivning: det besvarar UX-lagret ovanpå den
  datamodell som redan är avgjord.
- **[ADR-062](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md)**,
  **[ADR-064](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md)**,
  **[ADR-065](../decisions/ADR-065-segment-regel-persistens.md)** — styr
  taxonomi, medlemskaps-golv och persistens. Ingen av dem tar ställning
  till UI-formen; de styr vad regeln FÅR uttrycka, inte hur den visas.
- **[ADR-078](../decisions/ADR-078-instant-regeln.md)** (INSTANT-regeln) —
  navigering och data som redan finns i cachen får aldrig vänta. Relevant
  begränsning för § 1(d) nedan: vårt live-antal ska vara instant per
  regel, inte klick-gated — det är redan en hårdare invariant än vad
  flertalet undersökta konkurrenter faktiskt bygger (se § 1 och § Dom).
- **`src/components/segment/prototyp/VariantD.tsx`** (regelverkstaden,
  rad ~2769–3403) lästes i sin helhet för att förankra fynden mot den
  FAKTISKA nuvarande ytan: villkorskort med chip-rader (Familj, Nivå,
  Format och modalitet), "Med"-listan som konjunkt-grupper ("Alternativ" =
  OR, "och-krav" inom ett alternativ = AND, max två nästlingsnivåer), en
  platt "Utan"-lista, ett `aria-live`-räknat antal som följer regeln direkt
  (ingen räkna-knapp, riven 2026-08-10), och en genererad klartextmening
  (`predikatKlartext(pred)`) sist i en summerings-sektion.

**Vad som INTE redan fanns:** ingen tidigare research i detta repo har
undersökt själva BYGGAR-YTANS form hos branschledarna — villkorsframställning,
AND/OR-visualisering, exkluderings-UI, var live-antalet sitter, var
namngivningen sker i flödet, tomt-läges-onboarding, eller UX-forskningens
belägg för/emot boolesk logik och mallar. Detta pass fyller den luckan.

**Ålder:** samtliga källor hämtades 2026-08-16 (detta pass) med undantag
för `dynamiska-segmentregler`-passets bakgrundsmaterial (~6 veckor gammalt,
bedömt fortsatt giltigt av det passet självt — UI-arkitekturmönster rör sig
inte på veckor).

---

## Kort svar

**Branschen konvergerar på en tvåstegsarkitektur snarare än en enda form:**
(1) en platt, chip-/dropdown-baserad villkorsbyggare med **gruppnivå-logik**
(en logiktyp — AND eller OR — per grupp, aldrig fri blandning inom samma
lista) som den TEKNISKA basen, och (2) **namngivna mallar/förval** som
primär ingång för vanliga fall, med den fria byggaren som sekundärt/
avancerat läge. Vår nuvarande regelverkstad (`VariantD.tsx`) har redan
ARKITEKTUR 1 nästan exakt rätt — samma gruppnivå-logik, samma tvånivå-gräns,
namngivning tidigt i flödet, ett eget namngivet "Utan"-block — men saknar
helt ARKITEKTUR 2: det finns ingen mall-/förvalsingång, bara den fulla
byggaren, för en domän som är liten nog (4 kurser × 2 modaliteter) att
mallar sannolikt skulle täcka merparten av verkliga behov.

Den enskilt starkast belagda enskilda punkten i hela passet är **inte** en
produktjämförelse utan UX-forskningen om boolesk logik (§ 3): rå
AND/OR-terminologi missförstås dokumenterat även av erfarna användare,
mätt i flera oberoende källor (Nielsen själv, en akademisk lärobok,
query-loggar med 2,1 % adoption och upp till 1/3 felfrekvens bland dem som
försöker). Vår nuvarande text ("och", "eller", inga versaler, inga
bokstäver som "AND"/"OR") ligger redan på rätt sida av den rekommendationen.

---

## Metod

Tre parallella fork-agenter (delad kontext med detta pass, egna sök-turer)
undersökte var sin avgränsad delmängd:

1. Mailchimp, Klaviyo, HubSpot, Customer.io — byggar-UI:t
2. Intercom, ActiveCampaign, Braze, Attio — byggar-UI:t
3. UX-forskning (NN/g, Hearst) + mall-/förvalsmönster

Källhierarkin i repots konvention hölls: förstaparts produktdokumentation
först, tredjeparts/community som märkt komplement där förstaparten saknade
detaljen. Där en källa blockerade automatiserad hämtning (ActiveCampaigns
hjälpcenter gav `403` på fyra separata försök) vilar fyndet på ett
sökmotor-sammandrag av samma sida — en svagare källklass än direkt
sidhämtning trots att ursprunget är förstaparts; detta märks explicit i
tabellen nedan och i § Vad jag inte kunde belägga.

**Åtta produkter undersöktes totalt** — mer än den efterfrågade minimi-
bredden på fem — plus en UX-forskningsgren. Precedent-styrkan anges per
fynd, inte som en enhetlig siffra.

---

## 1 — Branschledarnas segment-byggare

### Översiktstabell

| Produkt | (a) Villkorsform | (b) AND/OR | (c) Exkludering | (d) Live-antal | (e) Namngivning | (f) Tomt läge |
|---|---|---|---|---|---|---|
| **Mailchimp** | Dropdown-kedja: fält → operator → värde | Toppnivå-val "and"/"or" FÖRE villkor läggs till; nästlade grupper obegränsat (Advanced) | Inline negativa operatorer, inget eget block bekräftat | **Klick-gated** — "Review segment"-knapp krävs | **Mitt i flödet**, obligatoriskt gate innan granskning | Ej belagt för byggaren; men **Pre-Built Segments** som separat, mall-baserad ingång |
| **Klaviyo** | Kategori → egenskap → operator → värde; PLUS ett parallellt naturligt-språk-läge ("Define with AI") | Grupper OR:as internt, grupper AND:as sinsemellan (medel tillförlitlighet) | Inline-negation ("Doesn't equal", "Is not in") | **Inte kontinuerligt** — kräver uppdatering; relativa tidsvillkor uppdateras var 24:e timme | Tidigt/parallellt (svag källa) | Ej specifikt belagt för byggaren |
| **HubSpot** | Dropdown, "+ Add filter" | `and`/`or`-dropdown inom grupp; grupper sinsemellan = OR; "+ Add filter group" | Inline negativa operatorer | **Delvis live** — ungefärlig preview under byggande, exakt tal efter spara | **Tidigt** — namnfält synligt överst från start | Ej belagt; men en scenario-TABELL med färdiga kombinationer fyller delvis samma roll |
| **Customer.io** | Datakälla → operator → värde | Explicit val vid start: "All" / "At least one"; Group-funktion med drag-och-släpp för nästling | Inline "is not one of" | **Live under byggande** (medel tillförlitlighet, ej direktcitat) | **Tidigt** — "Click 'Untitled'" är första steget efter typval | Ej belagt |
| **Intercom** | Dropdown-kedja | "+"-ikon per grupp väljer And/Or; grupper i sig kombinerbara (nästlad tvånivå) | **Inline "is not"**, samt hel-segment-negation ("Segment is NOT X"); explicit varning mot att blanda "is not" med OR | Ej belagt (antyds INTE alltid-live: varning om att komplexa queries "may take longer") | **Sist** — namnges vid "Save segment", efter byggd regel | Ej belagt |
| **ActiveCampaign** | Ej i detalj belagt (källa blockerad) | **Condition groups** — en logiktyp per grupp, ingen blandning inom samma grupp, ny grupp krävs för att byta | Ej specifikt belagt utöver generella negativa operatorer | **Hover/Preview** — antal visas vid hover över segmentet, plus en separat "Preview"-knapp | **Först** — namn + beskrivning anges på "Create a Segment"-sidan innan villkor | Ej belagt |
| **Braze** | Dropdown-kedja RENDERAD som läsbar mening ("First Did Custom Event Less than 1 day ago") | **Filter groups**; explicit dokumenterad formel `(A AND B AND C) OR (C AND E AND F)` | **Eget namngivet block** ("AND NOT"-sektion, parallell till våra villkorsgrupper) — starkaste precedensen för separat exkluderings-sektion | "**Estimated** Reachable Users" — explicit estimat-språk, plus en per-person "User Lookup"-testfunktion | **Först** — segmentet skapas (namn + metadata) omedelbart, före första filtret | Inga skärmdumpar hittade, men konkreta användningsfalls-exempel fyller samma didaktiska roll |
| **Attio** | Dropdown-kedja, FLAT lista med implicit AND som förval | **Progressive disclosure via namngiven handling**: "Convert to advanced condition" → "Convert to group" — komplexitet är en aktiv, benämnd övergång, inte alltid synlig | Inline "is not" | Ej belagt | Ej belagt | Ej belagt |

### Vad som sticker ut utöver tabellen

- **Gruppnivå-logik är universell** — samtliga åtta produkter löser AND/OR
  genom att tvinga EN logiktyp per grupp och kräva en ny grupp för att
  blanda, aldrig fri boolesk komposition i en enda lista. Vårt eget
  "Alternativ" (OR mellan alternativ) / "och-krav" (AND inom ett
  alternativ) matchar detta mönster exakt, inklusive Attios och Braze
  tvånivå-struktur.
- **Namngivningens plats delar sig, men majoriteten namnger TIDIGT.** Fem
  av åtta (HubSpot, Customer.io, ActiveCampaign, Braze, samt Klaviyo med
  svagare belägg) namnger i BÖRJAN av flödet eller parallellt med
  byggandet. Bara Intercom namnger uttryckligen SIST. Mailchimp namnger
  som ett obligatoriskt MELLANSTEG (gate före granskning). Det finns alltså
  ingen enhällig branschstandard, men en tydlig majoritetslutning mot
  tidig namngivning — vilket redan matchar `VariantD.tsx`s ordning
  (namn-input direkt efter rubriken, före Med/Utan-listorna).
- **Exkludering delar sig i två skolor.** De flesta (Intercom, Klaviyo,
  HubSpot, Customer.io, Attio) löser exkludering som en INLINE
  negations-operator ("is not", "doesn't contain") i samma villkorslista.
  Braze är ensam om ett eget, namngivet exkluderings-BLOCK parallellt med
  inkluderings-grupperna. Vår "Utan — dessa räknas bort"-sektion matchar
  Braze-skolan — den svagare precedensen räknat i antal produkter (1 av 8
  bekräftat), men den starkare för en ICKE-teknisk användare: en synlig,
  namngiven "vad räknas bort"-yta kräver inte att användaren lär sig läsa
  en negationsoperator inbäddad i en villkorsrad.
- **Live-antal är den svagast och mest SPRIDDA belagda dimensionen.**
  Ingen av de åtta har en bekräftad, alltid-synlig, kontinuerligt
  uppdaterad räknare utan någon form av gate (klick, hover, 24-timmars
  batch-fördröjning, eller "estimated"-brasklapp). Detta kontrasterar med
  vår egen implementation, som redan ger ett `aria-live`-räknat antal som
  följer varje regeländring direkt (ADR-078, riven räkna-knapp
  2026-08-10) — se § Dom för vad detta betyder.
- **Två produkter erbjuder ett naturligt-språk-LÄGE som alternativ ingång,
  inte bara en kontrollmening:** Klaviyos "Define with AI" (skriv en
  mening, få redigerbara villkor tillbaka) och ActiveCampaigns
  betalanserade "Segments agent" (samma idé, uttryckligen sålt som "No
  complex conditions or operators are required"). Bägge är för nya (2025,
  beta) och för svagt källbelagda (ActiveCampaign-fyndet vilar enbart på
  ett sökmotor-sammandrag) för att räknas som etablerad branschstandard —
  se § Vad jag inte kunde belägga och den öppna noten i § Dom.

---

## 2 — Förenklingens mönster

**Mönster som ÄR belagt, flera oberoende exempel:**

- **Mailchimp — "Pre-Built Segments".** Färdiga, namngivna segment
  ("Engaged Subscribers", "New Subscribers", "Recent Customers", "First
  Time Customers", "Repeat Customers", "Lapsed Customers") som kräver noll
  byggande. Explicit dokumenterad relation till den avancerade byggaren:
  *"If our pre-built segments do not fit your needs, use them as
  inspiration to build your own custom segments."* Detta är den starkaste
  enskilda precedensen i hela passet för "mall som primär ingång, avancerat
  vid behov" — en produkt som SÄGER RAKT UT vad relationen mellan de två
  lägena ska vara.
- **Klaviyo** — nya konton får förifyllda standardsegment direkt vid
  setup ("Engaged" 30/60/90 dagar, "New Subscribers" senaste 2 veckorna,
  m.fl.) innan användaren någonsin öppnar den fria byggaren.
- **Shopify** — "Create segments in just two clicks with easy-to-use
  templates"; sidans egen struktur placerar mall-CTA:n ("Try templates")
  FÖRE det avancerade filter-avsnittet.
- **Mailchimps egen rekommendation ("skriv en mening")** som
  kvalitetskontroll av en byggd regel — *"write a sentence that
  represents your segment"* — är exakt vad `predikatKlartext(pred)` redan
  gör i vår yta, fast placerad sist i en summerings-sektion snarare än som
  en löpande, tidig kontrollpunkt.

**Naturligt språk som PRIMÄR framställning (i stället för formulär/rad):**
svagt och nytt belagt (Klaviyo, ActiveCampaign, se § 1) — inte etablerad
branschstandard, snarare en framväxande, 2025-tidig riktning hos två av
åtta undersökta produkter. UX-forskningen (§ 3) ger dessutom indirekt stöd
FÖR strukturerad/facetterad framställning över fri text (Hearst: facetterad
sökning ligger som en medveten "mellanväg" mellan full boolesk syntax och
fri naturligt-språk-fråga, inte ett argument för ren fritext).

**Ersättning av en generisk builder med domänspecifika förval i en LITEN,
sluten kategori-rymd (analogt med vår 4×2-domän): ingen direkt precedens
hittad.** Samtliga tre mall-exempel ovan (Mailchimp, Klaviyo, Shopify)
KOMPLETTERAR en kvarvarande generisk byggare — ingen av dem ERSÄTTER den,
och samtliga opererar över en OBEGRÄNSAD kunddatabas (beteendebaserade
mallar: engagemang, köphistorik), en annan problemklass än att räkna upp
ett fåtal kända kurser. **Precedent-rymden för just "ersätt" är tunn,
deklareras öppet** — 0 av 8 undersökta produkter.

---

## 3 — UX-forskning om query-/filter-builders

### Progressive disclosure och recognition over recall

NN/g:s etablerade princip (sekundärkälla som sammanfattar en NN/g-studie
från 2006): gränssnitt som skjuter avancerade funktioner till en sekundär
skärm mättes ge 30–50 % snabbare förstagångs-tidsåtgång utan förlorad
upptäckbarhet — men Nielsens egen regel är att det FREKVENT ANVÄNDA måste
synas direkt; gömmer man för mycket flyttar man bara komplexiteten.
[NN/g, "Applying Filters"](https://www.nngroup.com/articles/applying-filters/)
(hämtat 2026-08-16) skiljer explicit mellan INTERAKTIV filtrering (resultat
uppdateras per val — passar utforskande användare utan ett klart mål) och
BATCH-filtrering (en "Apply"-knapp — passar användare med redan bestämda
kriterier). Ingen av källorna gav en explicit tröskel för "hur många filter
samtidigt" — det påståendet kan inte beläggas mot dessa källor.

### Nästlad boolesk logik — den bäst belagda enskilda UX-fällan i passet

Detta är **inte** ett svagt antagande utan en av de mest konkret mätta
UX-fällorna som finns, korroborerad av tre oberoende källor:

- **Marti Hearst, *Search User Interfaces* (Cambridge University Press,
  2009), kap. 4** — läroboks-genomgång som citerar underliggande studier:
  *"Studies have shown time and again that most users have difficulty
  specifying queries in Boolean format and often misjudge what the results
  will be."* Konkret: vardaglig läsning av "AND" som "bredare" (fast
  Boolesk AND är strikt SNÄVARE) är kontraintuitiv även för experter.
  Mätta siffror: 2,1 % av sökningar innehöll booleska operatorer i en
  1,5-miljoner-frågors query-logg (Dogpile, 2007), och i en annan studie
  använde bara 8,7 % operatorer någonsin — bland dem missförstod flera dem
  helt. [searchuserinterfaces.com/book/sui_ch4_query_specification.html](https://searchuserinterfaces.com/book/sui_ch4_query_specification.html)
  (hämtat 2026-08-16).
- **Jakob Nielsen, "Search and You May Find"** — citat: *"Boolean search
  should be avoided since all experience shows that users cannot use it
  correctly."* Konkret exempel: en uppgift att hitta info om "katter OCH
  hundar" fick nästan alla användare att skriva `cats AND dogs`, få noll
  träffar, och felaktigt dra slutsatsen att informationen inte fanns.
  Rekommendation: booleska operatorer hör hemma på en SEPARAT, medvetet
  mindre lättillgänglig "avancerad sökning"-yta.
  [nngroup.com/articles/search-and-you-may-find](https://www.nngroup.com/articles/search-and-you-may-find/)
  (hämtat 2026-08-16).
- **Laurian Vega, "The Dreaded Boolean Search"** (praktikerartikel som
  själv citerar Hearst) — felfrekvens *"roughly 1/3 times — even with
  experts."* Rekommenderat UI-mönster: ersätt "AND"/"OR" med "ALL"/"ANY",
  visuell gruppering (rutor) i stället för parenteser, och **stöd bara två
  nästlingsnivåer som default** — mer bara på begäran.

**Konsekvent rekommendation över alla tre:** undvik rå AND/OR-terminologi,
använd "alla/något av"-formuleringar, begränsa nästlingsdjupet till två
nivåer som förval. Vår nuvarande text ("och", "eller", gemener, ingen
bokstavskod) och vår hårda tvånivå-gräns (Alternativ × och-krav, ingen
djupare nästling möjlig i UI:t) ligger redan på rätt sida av samtliga tre
källors rekommendation.

### Naturligt språk kontra formulär/rad-baserad framställning

**Ingen direkt jämförande studie hittades.** Det som finns är indirekt:
Hearst beskriver facetterad sökning (fält + värde-chips) som en medveten
"mellanväg" mellan full boolesk syntax och fri naturligt-språk-fråga — inte
ett argument FÖR ren fritext. Detta ger svagt indirekt stöd för strukturerad
framställning, men ska INTE presenteras som ett belagt "meningsform vinner
över rad-form"-påstående — det är det inte.

---

## 4 — Vad vår lilla domän tillåter

Med bara fyra kurser × två modaliteter är kombinationsrymden för "vanliga"
regler litet nog att räkna upp: "Alla som gått Fjärrskådning", "RIM 1 men
inte RIM 2", "Gått eller varit på föreläsning i något format", "Alla
utbildningar" — en handfull namngivna mallar skulle sannolikt täcka
merparten av Lottas faktiska behov, med den fria byggaren kvar för resten.

Detta MATCHAR det universella mönstret i § 2 (mall som primär ingång,
byggare som sekundärt/avancerat läge) men har **ingen direkt precedens för
att en produkt gjort exakt detta i en lika liten, sluten kategori-rymd**
— de tre bekräftade mall-exemplen (Mailchimp, Klaviyo, Shopify) opererar
alla över obegränsade, beteendebaserade kunddatabaser, en annan
problemklass. Applikationen av mönstret på vår situation är alltså en
EXTRAPOLERING från ett bekräftat generellt mönster ("mallar sänker
tröskeln, byggare finns kvar"), inte en direkt kopierad instans. Detta
deklareras öppet i rekommendationen nedan.

---

## Dom

Branschen konvergerar inte på EN form utan på ett tvåstegsmönster: en
teknisk, gruppnivå-baserad villkorsbyggare (arkitektur 1) UNDER en
mall-/förvalsingång för vanliga fall (arkitektur 2). Vår nuvarande
regelverkstad har redan arkitektur 1 korrekt implementerad och på flera
punkter STRÄNGARE än branschsnittet:

- gruppnivå-AND/OR med hård tvånivå-gräns — matchar samtliga åtta
  undersökta produkter och UX-forskningens uttryckliga rekommendation
  (Vega: "två nivåer som default"),
- ett eget namngivet exkluderings-block ("Utan") — matchar den starkaste
  enskilda precedensen (Braze) snarare än inline-negations-skolan,
- namngivning tidigt i flödet — matchar majoriteten (5 av 8),
- ett `aria-live`-räknat, alltid-instant antal utan gate — **striktare än
  samtliga åtta undersökta konkurrenter**, av vilka ingen har en bekräftad
  ogated, kontinuerligt uppdaterad räknare (Klaviyo: 24h-batch för
  relativa tidsvillkor; Mailchimp/HubSpot: klick-gated; Braze/Customer.io:
  uttryckligt "estimated"-språk). Detta är INTE en brist relativt
  branschen — det är ADR-078:s INSTANT-regel applicerad hårdare än något
  jämförelseobjekt bygger, och en genuin styrka att bevara, inte en lucka
  att stänga.

Det som SAKNAS helt är arkitektur 2: det finns ingen mall-/förvalsingång.
Given domänens litenhet (4×2) är detta den enskilt tydligaste,
bäst belagda förbättringsmöjligheten passet identifierar — men
precedensen för att den ska ERSÄTTA snarare än KOMPLETTERA byggaren är
tunn (§ 2, § 4), så rekommendationen nedan föreslår komplettering, inte
ersättning.

---

## Vad jag inte kunde belägga

- **Intercom, ActiveCampaign, Braze, Attio: tomt läge (f).** Ingen av de
  fyra har en bekräftad, direkt beskriven "byggaren öppnad utan villkor
  än"-vy. Braze har indirekt stöd via användningsfalls-exempel i
  hjälptexten, men det är inte samma sak som en verifierad tom-vy-skärmdump.
- **ActiveCampaigns exakta UI-form för (a) och (c).** Källan
  (`help.activecampaign.com`) gav `403 Forbidden` på fyra separata
  hämtningsförsök; allt AC-material vilar på sökmotor-sammandrag av samma
  sidor — förstaparts i ursprung men en svagare källklass än direkt
  sidhämtning.
- **Klaviyos exakta AND/OR-mekanik och namngivningens exakta placering.**
  Bedömd "medel"/"svag" tillförlitlighet av den undersökande forken — inget
  direktcitat från en primärsida kunde verifieras för dessa två punkter.
- **Ingen direkt jämförande studie mellan naturligt-språk-framställning och
  formulär-/rad-baserad framställning.** Bara indirekt stöd (Hearst:
  facetterad UI som "mellanväg") — se § 3.
- **Ingen precedens för att en produkt ERSATT (i stället för kompletterat)
  en generisk query-builder med domänspecifika förval i en liten, sluten
  kategori-rymd.** 0 av 8 undersökta produkter. Deklareras öppet, se § 2
  och § 4 — extrapolering, inte en bekräftad instans.
- **Klaviyos "Define with AI" och ActiveCampaigns "Segments agent" som
  etablerad branschstandard.** Bägge är 2025-tidiga/beta-funktioner hos
  två av åtta produkter — för nytt och för smalt för att kallas ett
  konvergerat mönster. Registreras som ett OVÄNTAT FYND utanför
  huvudfrågan (framväxande AI-läge som tredje väg vid sidan av
  byggare/mallar), inte som en rekommenderad väg för vår skala — se
  triage-noten i rapporten till orkestreraren.
- **NN/g:s exakta tröskel för "hur många filter/villkor bör synas
  samtidigt".** Sökt riktat, ingen källa gav en konkret siffra.

---

## Rekommendation (ej beslut)

Rangordnad efter (kostnad × precedent-styrka), tydligt märkt som
rekommendation — besluten är Marcus/orkestrerarens.

1. **Bygg en mall-/förvalsingång ovanför den fria byggaren** — namngivna
   förval som "Alla som gått Fjärrskådning", "RIM 1 men inte RIM 2", "Gått
   eller varit på föreläsning" — med byggaren kvar som "anpassa"/avancerat
   läge, exakt som Mailchimps *"use them as inspiration to build your own
   custom segments"*-mönster. Starkast belagd precedens i passet (3
   oberoende produkter, § 2), men **extrapolerad** till en liten sluten
   kategori-rymd utan direkt matchande instans (§ 4, deklarerat öppet).
   Högst förväntad effekt för Gunilla-principen: de flesta av Lottas
   faktiska behov täcks sannolikt utan att hon någonsin ser en chip-rad.
2. **Behåll gruppnivå-AND/OR och tvånivå-gränsen oförändrad** — redan
   korrekt, bekräftat av samtliga åtta produkter OCH av UX-forskningens
   uttryckliga rekommendation (Vega: två nivåer som default). Ingen
   ändring, bara en dokumenterad validering att arkitekturen är rätt.
3. **Behåll "Utan" som eget namngivet block** — svagare i antal (1 av 8,
   Braze) men den starkare precedensen för en icke-teknisk användare: en
   synlig egen exkluderings-yta i stället för en negationsoperator gömd i
   en villkorsrad. Ingen ändring, en validering.
4. **Formulera det räknade antalet explicit som ett estimat** (redan
   rekommenderat i `dynamiska-segmentregler-branschmonster-2026-08-10.md`,
   förstärkt här av Braze/Customer.ios "estimated"-språk) — låg kostnad
   (textformulering), stänger den enda punkt där branschens vokabulär
   skiljer sig från vår nuvarande, i övrigt striktare, instant-modell.
5. **Lyft klartextmeningen (`predikatKlartext`) tidigare/mer framträdande
   i flödet**, snarare än enbart som sista rad i en summerings-sektion —
   matchar Mailchimps rekommendation att en läsbar mening fungerar som en
   LÖPANDE kontrollpunkt under byggandet, inte bara en eftertext.
   Svagare belagd (en produkts rekommendation, inte en UI-precedens för
   PLACERING), lägst kostnad av de fem.

**Uttryckligen INTE rekommenderat, men registrerat:** ett naturligt-språk-
/AI-inmatningsläge (Klaviyo/ActiveCampaign-mönstret). För nytt, för smalt
belagt, och löser ett problem (fri-text-tolkning av en obegränsad
attributrymd) vår 4×2-domän inte har — mallarna i punkt 1 täcker samma
Gunilla-behov utan att införa en LLM-beroende tolkningslänk.

---

## Källförteckning

### Primärkällor (förstaparts produktdokumentation)

- [Mailchimp — Getting started with segments](https://mailchimp.com/help/getting-started-with-segments/)
- [Mailchimp — Create an advanced segment](https://mailchimp.com/help/create-an-advanced-segment/)
- [Mailchimp — Understanding advanced segmentation logic](https://mailchimp.com/help/understanding-advanced-segmentation-logic/)
- [Mailchimp — About Pre-Built Segments](https://mailchimp.com/help/about-pre-built-segments/)
- [Klaviyo — Segment condition reference](https://help.klaviyo.com/hc/en-us/articles/115005062847)
- [Klaviyo — Define segments with AI](https://help.klaviyo.com/hc/en-us/articles/18986425586715)
- [HubSpot — Create active or static lists](https://knowledge.hubspot.com/lists/create-active-or-static-lists)
- [HubSpot — Determine filter criteria](https://knowledge.hubspot.com/segments/determine-filter-criteria)
- [Customer.io — Data-driven segments](https://docs.customer.io/messaging/segmentation/data-driven-segments/)
- [Intercom — How do filters work?](https://www.intercom.com/help/en/articles/2410715-how-do-filters-work)
- [Intercom — Create more targeted audiences with And/Or rules](https://www.intercom.com/help/en/articles/2848161-create-more-targeted-audiences-with-and-or-rules)
- [Intercom — How to segment your contacts](https://www.intercom.com/help/en/articles/324-how-to-segment-your-contacts)
- [Braze — Segments](https://www.braze.com/docs/user_guide/audience/segments)
- [Braze — Segmentation Filters](https://www.braze.com/docs/user_guide/audience/segments/segmentation_filters)
- [Braze — Create a Segment](https://www.braze.com/docs/user_guide/engagement_tools/segments/creating_a_segment)
- [Attio — Create and manage table views](https://attio.com/help/reference/managing-your-data/views/create-and-manage-table-views)
- [Attio — Filter and sort views](https://attio.com/help/reference/managing-your-data/views/filter-and-sort-views)
- [Shopify — Segmentation](https://www.shopify.com/segmentation)
- [NN/g — Search and You May Find](https://www.nngroup.com/articles/search-and-you-may-find/)
- [NN/g — User Intent Affects Filter Design (Applying Filters)](https://www.nngroup.com/articles/applying-filters/)
- [Marti Hearst — Search User Interfaces, kap. 4 (Cambridge University Press)](https://searchuserinterfaces.com/book/sui_ch4_query_specification.html)

### Sekundärkällor (märkta, komplement där förstaparten saknade detaljen)

- [ActiveCampaign — Create and save segments (sökmotor-sammandrag; direkthämtning 403)](https://help.activecampaign.com/hc/en-us/articles/115001324324-Create-and-save-segments)
- [ecomva.com — ActiveCampaign segmentation-guide (tredjepart)](https://ecomva.com)
- [Laurian Vega — "The Dreaded Boolean Search" (Medium, praktiker, citerar Hearst)](https://medium.com/next-century-user-experience/the-dreaded-boolean-search-413fa757a81c)
- [Candu — Empty states-blogg (Klaviyo omnämnd generellt, ej segment-specifikt)](https://candu.ai)

### Interna källor (vårt eget repo, denna session)

- [`dynamiska-segmentregler-branschmonster-2026-08-10.md`](./dynamiska-segmentregler-branschmonster-2026-08-10.md)
- [ADR-062](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md)
- [ADR-064](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md)
- [ADR-065](../decisions/ADR-065-segment-regel-persistens.md)
- [ADR-078](../decisions/ADR-078-instant-regeln.md)
- `src/components/segment/prototyp/VariantD.tsx` (regelverkstaden, rad ~2769–3403)
- `backlog/tasks/task-181`
