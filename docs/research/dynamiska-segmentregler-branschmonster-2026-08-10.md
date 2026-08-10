---
owner: marcus803
updated: 2026-08-10
review_by: 2026-11-10
status: draft
---

# Dynamiska segmentregler — branschmönster för att en sparad publik inte ska bli tyst inaktuell (2026-08-10)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört
> oisolerat i huvudkatalogen (delad worktree med orkestreraren,
> `docs/s104-segment-passet`, `71fb222f`). Committar inget.

## Inventering FÖRE första sökningen — vad som redan fanns

Fyra ADR:er styr redan vår segment-arkitektur direkt och lästes i sin helhet
innan någon websökning gjordes:

- **[ADR-062](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md)**
  (2026-06-25) — grundbeslutet. Har REDAN gjort branschledar-research
  (HubSpot, Klaviyo, Adobe Real-Time CDP, Salesforce Data Cloud, Twilio
  Segment, AWS CDP) och slog fast: segment = sparad regel med BERÄKNAT
  medlemskap, dynamisk default + frys/export-handling för snapshot,
  medlemskap beräknas från KÄLLAN (Deltaganden) inte en lossy projektion,
  on-demand-eval (beslut 6 — "taxonomin är 6×2, känd och liten — ledarnas
  modell i rätt skala, INTE en CDP").
- **[ADR-064](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md)**
  (2026-06-25) — förfinar taxonomin: `include[]`/`exclude[]`-**rymden**
  (vilka `(kurs, modalitet)`-par som GÅR att välja) härleds domän-drivet ur
  Eventplanering och växer automatiskt utan kodändring. Medlemskaps-golvet
  (`Närvaropoäng=1`) är strikt och lättas aldrig.
- **[ADR-065](../decisions/ADR-065-segment-regel-persistens.md)** (2026-06-26)
  — persistens-formen: typad JSON (`{include, exclude}`) i ett nytt
  `App-segmentregel`-fält, migrationsmål för 9 legacy-formelsträng-segment.
- **[ADR-067](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md)**
  (2026-06-28) — sändkontraktet: mottagare löses **server-side** ur
  `segmentIds`, aldrig ur en klientbyggd lista (`send-email/index.ts:22-23`).
  Schemalagd send (framtida sändtid) är explicit **deferrad**, ej byggd.

Plus `docs/reference/segment-arkitektur.md` (uppslagsverk, binder ADR:erna),
och `tasks/sessions/bilagor/s104-segment-divergens/DUKNING.md` — dagens
(2026-08-10) egna dukning för ett PARALLELLT UI-prototyp-pass (`task-181`)
som redan flaggar exakt samma spänning i sin § Osäkerheter punkt 7: *"`ADR-064`
är inte läst i sin helhet av utredarna. En variant som överväger att bredda
`SegmentRule`-schemat måste läsa den först."* — löst här genom att läsa den i
sin helhet (se ovan). DUKNING § 7 "Funktionsfyndet" bekräftar dessutom att
handplockning är **funktionellt omöjligt** i dagens fem lager (UI → domänschema
→ EF-kontrakt → allowlist → källa) och att öppna för det är en ADR-064-revision,
inte en UI-ändring.

**Vad som INTE redan fanns:** ingen tidigare research (`grep -ril` över
`docs/research/` för "segment" gav ovanstående ADR:er + arkitekturdokumentet,
inget annat) hade undersökt den specifika **regelFORMEN** — uppräkning vs.
predikat — hos branschledarna, eller hur de hanterar **publik-drift mellan
granskning och sändning**. ADR-062:s research (juni 2026) besvarade "ska
medlemskap vara beräknat eller lagrat" (dynamiskt vann); den besvarade INTE
"ska regeln uttrycka VÄRDEN (kurs=RIM 1) eller PREDIKAT (modalitet=Utbildning,
oavsett kurs)" — vilket är precis den lucka som gör att en ny kurs (RIM 4)
inte automatiskt täcks av ett befintligt "alla utbildningar"-segment idag.
Detta pass fyller den luckan och den kritiska frågan om sänd-tids-drift.

**Ålder:** ADR-062:s research är ~6 veckor gammal (2026-06-25). Ingen av de
undersökta produkternas kärnmekanik (statisk/dynamisk-distinktionen,
send-time-recompute-mönstret) rör sig på veckor — detta är arkitektur-mönster
som hållit i flera år hos samtliga sju undersökta verktyg. Inget skäl att
misstänka att ADR-062:s research-slutsats är inaktuell.

---

## Kort svar

Branschen har redan konvergerat på den nivå ADR-062 undersökte: **sparad
regel med beräknat medlemskap**, inte en lagrad lista. Vår öppna fråga sitter
en nivå högre än det ADR-062 besvarade — inte "dynamiskt vs statiskt
medlemskap" (redan avgjort, vi har rätt) utan **regelns egen uttrycksform**:
räknar den upp kända värden (`kurs=RIM 1`), eller uttrycker den ett predikat
över en dimension (`modalitet=Utbildning`, oavsett vilka kurs-värden som
någonsin funnits eller kommer finnas)? Samtliga sju undersökta verktyg bygger
segment som **filter-/predikat-byggare över attribut** — ingen av dem har en
"räkna upp kända kategorivärden"-mekanik som huvudform. Det är den arkitektur
som gör att en ny kategori (en ny produkt, en ny händelsetyp, en ny kurs)
automatiskt omfattas av ett existerande "alla X"-villkor: **villkoret binder
till ATTRIBUTET, inte till en frusen lista av dess värden.**

Samtliga sju skiljer också uttryckligen mellan **statisk** (manuellt
kuraterad eller frusen snapshot, ändras aldrig av sig själv) och **dynamisk**
(regel, omvärderas kontinuerligt) — se § 2. Ingen produkt erbjuder ett
förstklassigt "dynamisk regel PLUS handplockade individer i samma fält"
— den kombinationen byggs i samtliga fall genom att en STATISK lista
refereras som **ett villkor bland flera** i en i övrigt dynamisk regel
(§ 3) — precis den set-algebra-form (`include[]`/`exclude[]` av `Par`) vi
redan har i `Segment.schema.ts`.

Den enskilt viktigaste frågan — **publik-drift mellan granskning och
sändning** — har ett konsekvent svar över alla undersökta verktyg: **ju
närmre sändningsögonblicket beräkningen sker, desto säkrare, och verktygen
erbjuder explicit det valet snarare än att göra det implicit.** Se § "Den
avgörande frågan" nedan — vår nuvarande arkitektur (server löser mottagare på
nytt ur `segmentIds` vid själva `send-email`-anropet, aldrig ur klientens
tidigare `compute-segment`-svar) motsvarar redan branschens SÄKRASTE läge
(Customer.io broadcast-modellen), av en anledning som inte är designad utan
strukturell: vi saknar ännu schemalagd send (ADR-067, deferrad tråd) — det är
FÖRST när en framtida sändtid införs som drift-frågan blir skarp, och då
finns ett tydligt branschmönster att kopiera (§ "Den avgörande frågan").

---

## 1 — Regelformen hos sju branschledare

| Verktyg | Regelform | Hur "alla i kategori X" fångar nya medlemmar | Källa |
|---|---|---|---|
| **HubSpot** | Filter-villkor över kontakt-/företagsegenskaper (`property operator value`), kombinerade AND/OR, i "active lists". | Ett villkor på EN egenskap (t.ex. `Lifecycle stage = Customer`) matchar automatiskt varje nytt värde som uppfyller det — det finns ingen uppräkning av kända egenskapsvärden att underhålla. | [Active vs static lists — officiell doc, hämtad](https://knowledge.hubspot.com/lists/create-active-or-static-lists): *"Active segments automatically update their members based on its criteria."* |
| **Klaviyo** | Villkorsbyggare över properties/events ("everyone who's ever purchased…"), kombinerade AND/OR. | Samma mekanik — ett villkor på en händelse-/egenskapstyp matchar alla framtida instanser. | [Getting started with segments](https://help.klaviyo.com/hc/en-us/articles/115005237908); [Understanding segments vs lists](https://help.klaviyo.com/hc/en-us/articles/115005061447) |
| **Braze** | "Segments are dynamic groups of users that fit specific criteria you define, such as user attributes, user behavior, and custom events" — filter, ej ID-lista. | *"Rather than manually listing specific user IDs, Braze segments function as **persistent queries**"* — ett attributvillkor täcker automatiskt alla framtida matchningar. | [Segments — officiell doc, hämtad](https://www.braze.com/docs/user_guide/audience/segments) |
| **Customer.io** | "Data-driven segments" — villkor över person-attribut/events; folk går in/ur automatiskt. | Samma predikat-mekanik. | [Segmentation overview](https://docs.customer.io/journeys/segments/); [How segments work](https://docs.customer.io/messaging/segmentation/segments/) |
| **Twilio Segment (Engage)** | "Audiences" byggs av "core tracking events, traits, and computed traits" via operatorer/villkor — explicit **inte** en förhandsuppräknad ID-lista. | *"Users will enter in real-time as they meet entry criteria"* — nya användare som matchar ett villkor kommer in automatiskt. | [Audiences — officiell doc, hämtad](https://www.twilio.com/docs/segment/engage/audiences) |
| **Salesforce Marketing Cloud** | Audience Builder: "granular segmentation … on the basis of demographic and behavioral data" över Data Extensions (godtyckligt schema, ej frusen enum). | Villkor på ett fält matchar automatiskt nya rader som läggs till Data Extension-källan. | [Audience Builder — officiell doc](https://help.salesforce.com/s/articleView?language=en_US&id=mktg.mc_ab_audience_builder.htm&type=5) (sidans fullständiga innehåll gick inte att extrahera via automatiserad hämtning — se § Vad jag inte kunde belägga) |
| **Intercom** | "A segment is a group of your contacts defined by the rules that you set" — filter (`+ Add filter`) på person-/företagsdata, AND/OR. | *"Users are automatically added to the segment every time the user updates to match those rules."* | [How to segment your contacts](https://www.intercom.com/help/en/articles/324-how-to-segment-your-contacts); [Segment-modellen (API)](https://developers.intercom.com/docs/references/2.4/rest-api/segments/segment-model) |

**Mönster, konsekvent över alla sju:** ingen av dem modellerar en
kategori-dimension (kurs, produkt, event-typ) som en **fryst uppräkning av
kända värden i regeln**. De modellerar den som ett **fält att filtrera på**.
Vår `Par = {kurs: string, modalitet}` är redan hälften rätt — `kurs` är
öppen taxonomi på DATA-nivå (ADR-064 beslut 2, `kurs` valideras inte mot en
lista). Men själva REGELN (`include: Par[]`) tvingar fortfarande en
explicit uppräkning av VILKA `kurs`-värden som ingår — motsvarande att
HubSpot skulle kräva att varje `Lifecycle stage`-värde listas explicit i
stället för att tillåta `Lifecycle stage = Customer` som ett öppet villkor.
Gapet är alltså inte "dynamiskt vs statiskt" (vi har redan dynamiskt) utan
att regeln idag bara kan uttrycka **konjunktioner av specifika par**, inte
**ett villkor på en enda dimension** (modalitet, utan kurs).

---

## 2 — Statisk vs dynamisk som etablerad distinktion

Samtliga undersökta verktyg gör denna åtskillnad explicit, med i princip
identisk terminologi och rekommendation:

| Verktyg | Statisk (namn) | Dynamisk (namn) | Rekommendation |
|---|---|---|---|
| HubSpot | Static list — *"records meeting criteria are captured at the moment of saving; no automatic additions afterward"* | Active list — *"records automatically join when they meet criteria and leave when they no longer do"* | Statisk för *"one-time email blasts… event attendees… groups that won't change"*; aktiv för återkommande utskick. [Officiell doc](https://knowledge.hubspot.com/lists/create-active-or-static-lists) |
| Mailchimp | Tags (ersatte tidigare "static segments") | Saved segment | Dynamiska segment är standardvägen; taggar för manuell, permanent gruppering. [Save and Manage Segments](https://mailchimp.com/help/save-and-manage-segments/) |
| Klaviyo | Lists — *"static and contain anyone who has subscribed to join the list"* | Segments — *"dynamic, meaning they grow as people meet the segments' conditions and shrink as people no longer meet them"* | Lista = samtycke/entry-punkt; segment = targeting. [Segments vs lists](https://help.klaviyo.com/hc/en-us/articles/115005061447) |
| Customer.io | Manual segment — *"people enter and exit when you explicitly add them to or remove them"* | Data-driven segment — *"enter and exit automatically"* | *"Data-driven segments are where Customer.io shines best… for the most part this is the type you should be using."* [Segmentation overview](https://docs.customer.io/journeys/segments/) |
| Salesforce (Journey Builder) | Data Extension som frusen entry-source-snapshot vid aktivering | Audience Builder / löpande events som entry-trigger | Se § "Den avgörande frågan" — snapshot är en MEDVETEN mekanism, inte en brist. [Entry Sources](https://help.salesforce.com/s/articleView?id=000232652&language=en_US&type=1) |
| Braze | (Ingen förstklassig "statisk segment"-typ; närmast: en Connected Audience angiven inline per API-anrop, eller en CSV-importerad lista) | Segment = *"persistent queries"* | Dynamiskt segment är förvalet för allt utom engångs-API-targeting. [Connected Audience](https://www.braze.com/docs/api/objects_filters/connected_audience) |
| Twilio Segment | (Ingen renodlad statisk audience-typ i Engage — CDP:t är byggt runt kontinuerlig computed-trait-uppdatering) | Audiences, real-time eller batch-sync | [Audiences overview](https://www.twilio.com/docs/segment/engage/audiences) |

**Slutsats för delfråga 2:** distinktionen är branschstandard och
terminologiskt stabil (samma två-vägs-uppdelning återkommer hos alla sju,
oavsett om orden är "static/active", "list/segment" eller "manual/data-driven").
Vår egen modell har redan BÅDA lägena — ADR-062 beslut 1 (dynamisk regel,
default) + beslut 4 (frys/export-handling = statisk snapshot) — vilket
matchar mönstret exakt. Frågan "ska segment vara statiska eller dynamiska"
är alltså redan korrekt besvarad hos oss (dynamiska, med en frys-väg för
export); den ÅTERSTÅENDE frågan är regelns uttrycksform (§ 1), inte
dynamik-vs-statik.

---

## 3 — Hybridformen: dynamisk regel + handplockade individer

Ingen av de sju produkterna erbjuder ett förstklassigt fält av typen
`{ rule, plus: personId[], minus: personId[] }` som EN sammanhållen
segment-typ. Mönstret som FAKTISKT existerar, och som är den etablerade
lösningen på exakt vårt problem, är att en **statisk (manuellt kuraterad)
lista refereras som ETT villkor bland flera** inuti en i övrigt dynamisk
regel — dvs. samma `include[]`/`exclude[]`-mängdalgebra vi redan har i
`Segment.schema.ts`, fast med ytterligare en villkorstyp ("är medlem i lista
Y") vid sidan av attributvillkoren.

- **HubSpot** — dokumenterat i community-praktik (ej HubSpots egen
  produktdoc, men beskriver ett INBYGGT filtervillkor `is a member of list
  X`): *"Create a static list using filters: 'is a member of list 1' OR 'is
  a member of list 2'."* En admin kan alltså skapa en liten statisk lista
  ("dessa tre testpersoner") och referera den som ett OR-villkor i en i
  övrigt regelbaserad lista — precis vår efterfrågade "alla utbildningar,
  plus dessa tre". [HubSpot Community-tråd](https://community.hubspot.com/t5/CRM/Merging-Lists-Not-really-static-is-it/m-p/438770)
  (tredjehands/praktiker-källa, ej officiell produktdokumentation — se
  källmärkning).
- **Klaviyo** — samma mönster beskrivs av praktiker (segmentbyggaren har ett
  villkor "is/is not in list"), men jag kunde INTE hitta Klaviyos EGEN
  officiella dokumentation som specificerar exakt villkorstypen — se
  § Vad jag inte kunde belägga.
- **Braze Segment Extension** — undersökt specifikt eftersom namnet lät
  relevant. **Negativt fynd:** det är INTE en hybrid-mekanism. Det är ett
  rent regelbaserat verktyg för att förlänga en attributvillkorets
  historiska lookback-fönster (upp till 730 dagar) — *"The system operates
  on rules alone… There is no manual addition of individual users."*
  [Segment Extensions](https://www.braze.com/docs/user_guide/audience/segments/segment_extension)

**Slutsats för delfråga 3:** hybridformen existerar i branschen, men som en
KOMPOSITION (statisk lista som ett villkor i en dynamisk regel), inte som en
egen förstklassig segment-typ. Det är strukturellt identiskt med att bredda
vår `Par`-typ till en unions-typ: `Par | { personIds: string[] }` som en
tredje gren i `include[]`/`exclude[]` — samma mängdalgebra
(`computeMembership`s OR-över-include/NOT-any-exclude) bär redan denna
utvidgning utan att ändra sin form. **Precedensen är tunn** (2 av 7 verktyg
korroborerat, och det ena bara via community-källor) — deklareras öppet,
inte uppblåst.

---

## 4 — Migreringsmönstret: uppräkning → predikat

Detta är den svagast belagda delfrågan. Jag hittade **ingen** dokumenterad
instans av att en branschledare bytt sin segment-regel-SCHEMA-form (från
enumererade värden till öppna predikat) och beskrivit hur befintliga sparade
regler hanterades under övergången — varken i produktdokumentation eller i
en teknisk blogg. Sökningar efter en sådan case-studie (Segment/Twilio
engineering-blogg, Mailchimp, HubSpot) gav ingen träff.

Det jag HITTADE är närliggande, inte identiskt:

- **Mailchimp:** "static segments" ersattes av taggar (en FUNKTIONS-deprecation,
  inte en regel-schema-migration): *"Mailchimp's Static Segment Feature Is
  Now Changed To Mailchimp Tags."* [Cazoomi support-artikel](https://support.cazoomi.com/hc/en-us/articles/360012866132-Mailchimp-s-Static-Segment-Feature-Is-Now-Changed-To-Mailchimp-Tags)
  (tredjeparts-sammanfattning; jag hittade ingen kvarvarande officiell
  Mailchimp-sida som beskriver migreringen i detalj — trolig arkivering).
- **HubSpot (april 2025):** en NY konverteringsfunktion (`Actions → Convert
  to Active/Static`) som medvetet bevarar identitet över en typ-ändring:
  *"You can now convert static lists to active lists while keeping the list
  ID and references intact"* — tidigare krävde en sådan ändring att skapa en
  NY lista (nytt ID, alla referenser bröts). Relevant analogt: HubSpot löste
  ett snarlikt problem (byta en listas UNDERLIGGANDE mekanik utan att bryta
  vad som pekar på den) genom in-place-konvertering som bevarar identitet,
  inte genom parallella system. (Community-korroborerat, ej en primär
  HubSpot-knowledge-base-sida jag kunnat verifiera direkt — se nedan.)
  [HubSpot Community](https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/Converting-Static-List-to-Active-List-Filter-Issues/m-p/1138500)
- **Salesforce Journey Builder:** hanterar en näraliggande (ej identisk)
  situation — en aktiv journeys entry-source är en FRUSEN snapshot av
  data-extension-SCHEMAT vid aktivering (*"the running journey doesn't
  detect fields added after activation"*); Salesforce löser inte detta
  in-place utan kräver en **NY journey-VERSION** för schemaändringar.
  [Entry Sources](https://help.salesforce.com/s/articleView?id=000232652&language=en_US&type=1)
  Detta är en form-migrations-analogi (schema-drift hanteras via
  VERSIONERING, inte tyst omtolkning av befintliga körande definitioner).

**Slutsats för delfråga 4:** ingen direkt precedens hittad — deklareras
öppet. De två indirekta mönstren pekar dock åt SAMMA håll: **bevara
identitet/referenser vid en formändring** (HubSpots ID-bevarande
konvertering) och **versionera i stället för att tyst omtolka** (Salesforces
journey-version-krav). Applicerat på vår situation: en breddning av
`SegmentRuleSchema` bör (a) vara **bakåtkompatibel att LÄSA** — ett
`Par`-baserat `include[]` ska fortsätta betyda exakt vad det alltid betytt
(ren additiv union-typ, aldrig en omtolkning av befintlig data), och
(b) INTE kräva att de 9 legacy-segmenten eller redan sparade app-segment
skrivs om för att fortsätta fungera. Detta är en rekommendation grundad i
generellt mönster, inte en styrkt branschprecedens.

---

## 5 — Var utvärderingen sker

| Verktyg | Beräkningsmodell | Källa |
|---|---|---|
| HubSpot | Kontinuerlig, händelsedriven bakgrundsuppdatering ("active lists … continually updated in real-time") — materialiserat medlemskap, ej query-tid. | [Active vs static lists](https://knowledge.hubspot.com/lists/create-active-or-static-lists) |
| Klaviyo | *"updates in close to real time"* — kontinuerlig inkrementell uppdatering. | [Getting started with segments](https://help.klaviyo.com/hc/en-us/articles/115005237908) |
| Braze | Default: utvärderas vid **enqueue-tid** (när triggerhändelsen processas), inte vid send. Explicit opt-in för omvärdering vid send-tid vid fördröjda kampanjer. | [Action-Based Delivery](https://www.braze.com/docs/user_guide/messaging/campaigns/schedule_your_campaign/triggered_delivery) |
| Customer.io (data-driven) | Kontinuerlig — folk går in/ur automatiskt när data matchar/slutar matcha. | [Data-driven segments](https://docs.customer.io/messaging/segmentation/data-driven-segments/) |
| Twilio Segment | **Två lägen**: real-time (*"users will enter in real-time as they meet entry criteria"*) ELLER batch, med synk-kadens styrd av destinationens gräns (1–6 timmar; t.ex. Google Ads var 6:e timme). | [Audiences overview](https://www.twilio.com/docs/segment/engage/audiences); [Linked Audiences Limits](https://www.twilio.com/docs/segment/engage/audiences/linked-audiences-limits) |
| Salesforce Journey Builder | Entry-source = frusen SNAPSHOT tagen vid journey-AKTIVERING; nya kontakter kommer in via löpande data-ändrings-triggers, men schemat är fruset. | [Entry Sources](https://help.salesforce.com/s/articleView?id=000232652&language=en_US&type=1) |
| **Vår app (compute-segment/send-email)** | **On-demand, full källwalk vid varje anrop** — `segment-resolution.ts` läser HELA `Deltaganden`-tabellen (filtrerad på `Närvaropoäng=1`) vid VARJE `compute-segment`- och `send-email`-anrop. Ingen materialisering, ingen bakgrundsjobb, ingen cache. | Disk-verifierat, `supabase/functions/_shared/segment-resolution.ts` (denna sessions läsning) |

**Kostnads-mönstret branschen visar:** samtliga sex externa verktyg
INVESTERAR i kontinuerlig/inkrementell materialisering (bakgrundsjobb som
håller medlemskap uppdaterat löpande) snarare än att räkna om från grunden
vid varje läsning — och Twilio Segment lägger DESSUTOM in en explicit
sync-KADENS (1–6h) mellan sin egen kontinuerliga beräkning och leverans till
en extern destination, vilket är ett direkt vittnesbörd om att
"beräkna-vid-varje-anrop" inte skalar ens för en CDP med materialiserad
källa. **Detta är INTE en indikation på att vår modell är fel** — ADR-062
beslut 6 gjorde detta avvägande MEDVETET och deklarerade det öppet: *"Taxonomin
är 6×2, känd och liten … INTE en CDP."* Skalan (hundratals personer, en
handfull kurser) är kvalitativt annorlunda än de miljontals-profiler dessa
verktyg är byggda för. On-demand-modellen är fortsatt rätt val i vår skala;
branschens materialiserings-investering är ett svar på ett problem
(query-kostnad vid stor skala) vi inte har.

---

## 6 — Fallgropar branschen varnar för

- **Klaviyo, dokumenterat officiellt:** flera samtidiga skäl till att en
  profil som "borde" få mailet ändå hoppas över — global suppression (utan
  att automatiskt tas bort från listor), engagemangsbaserad borttagning
  (unsubscribe/spam/hard bounce), ogiltig e-post, OCH **schemaläggnings-
  snapshot-drift** (*"list membership at scheduling time… the audience may
  have grown/shrunk by send date"*) om inte send-time-läget aktiveras.
  [Troubleshooting skipped profiles](https://help.klaviyo.com/hc/en-us/articles/115005258268)
- **Salesforce Journey Builder:** schema-drift efter aktivering — fält som
  läggs till entry-source-data-extensionen efter aktivering syns ALDRIG i
  den löpande journeyn; kräver ny version. En tyst, lätt missad fälla om
  man antar att en "levande" datakälla automatiskt propagerar
  schemaändringar till en redan aktiverad publik-definition.
  [Entry Sources](https://help.salesforce.com/s/articleView?id=000232652&language=en_US&type=1)
- **Braze:** en ordnings-fälla vid action-baserade kampanjer — användare som
  utförde triggerhändelsen FÖRE kampanjens lansering kvalificerar ALDRIG,
  även om de senare uppfyller segmentvillkoren. En tyst exkludering som inte
  syns i segment-räknaren.
  [Action-Based Delivery](https://www.braze.com/docs/user_guide/messaging/campaigns/schedule_your_campaign/triggered_delivery)
- **Mailchimp:** samma funktion ("Finalize your recipients at send time")
  beter sig OLIKA beroende på abonnemangsnivå — Free/Essentials finaliserar
  alltid vid sändtid, Standard+ tar en snapshot vid GENERERING som inte
  uppdateras automatiskt om inte funktionen aktiveras explicit. En fälla i
  sig: samma UI-koncept, olika faktiskt beteende, lätt att anta fel default.
  [Schedule or Pause a Regular Email](https://mailchimp.com/help/schedule-or-pause-a-regular-email-campaign/)

**Gemensam nämnare:** samtliga dokumenterade fallgropar handlar om **glappet
mellan när en publik VISAS/beräknas och när den faktiskt används** — exakt
vår nästa sektion.

---

## Den avgörande frågan: publik-drift mellan granskning och sändning

Vår hårda invariant (servern äger sanningen; `send-email` löser mottagare
ur `segmentIds`, aldrig ur en klientbyggd lista — `send-email/index.ts:22-23`,
disk-verifierat) placerar oss redan i det läge branschen visar sig behandla
som SÄKRAST, av ett strukturellt skäl snarare än ett designval vi gjort
medvetet för just detta syfte: **vi har ingen schemalagd send.** ADR-067
listar *"Schemalagd send (send vid framtida tidpunkt)"* explicit som
DEFERRAD (ej byggd). All send idag är synkron/omedelbar — klienten anropar
`compute-segment` för förhandsvisning, sedan (vid klick på Skicka)
`send-email`, som **omedelbart** och **på nytt** löser medlemskap server-side.
Glappet mellan "granskad publik" och "faktiskt kontaktad publik" är därför i
praktiken bara de sekunder ett synkront HTTP-anrop tar — inte den
minuter-till-dagar-lucka schemaläggning öppnar upp.

Branschens mönster, lagt bredvid varandra:

1. **Recompute-vid-send är den modell verktygen bygger FÖR omedelbar/broadcast-
   send.** Customer.io säger det rakt ut om sina broadcasts: *"We calculate
   who receives your message at send time, so the audience count you see …
   could differ from the final count we send to later."*
   [One-time sends](https://docs.customer.io/messaging/send/broadcasts/one-time-sends/)
   Vår arkitektur GÖR redan detta — `compute-segment`s förhandsvisning är en
   ESTIMAT, `send-email` är den auktoritativa, senare beräkningen. Det är
   samma epistemiska status som Customer.ios modell, och Customer.io kallar
   det inte en brist utan det korrekta kontraktet för en broadcast.

2. **När sändningen kan FÖRDRÖJAS (schemaläggning, eller Brazes
   action-baserade fördröjning) blir frågan skarp, och verktygen svarar med
   ett EXPLICIT VAL, inte en tyst standard:**
   - Klaviyo: default = frys publiken vid **schemaläggnings**-ögonblicket
     (*"Klaviyo takes a picture of your lists or segments the moment you
     click Schedule"*), med ett namngivet alternativ *"Determine recipients
     at send time"* som tar en ny snapshot precis före sändning. Verktyget
     VARNAR uttryckligen att send-time-läget kan öka volym/kostnad
     oförutsägbart. [How to change when a campaign's recipients are
     determined](https://help.klaviyo.com/hc/en-us/articles/22501501263899)
   - Mailchimp: samma två lägen, men **default beror på abonnemangsnivå**
     (se § 6 — en fälla i sig). [Schedule or Pause a Regular
     Email](https://mailchimp.com/help/schedule-or-pause-a-regular-email-campaign/)
   - Braze: default = utvärdera vid **enqueue**-tid (händelsen som
     triggar), med ett namngivet opt-in *"Re-evaluate segment membership at
     send-time"* för fördröjda kampanjer. [Action-Based
     Delivery](https://www.braze.com/docs/user_guide/messaging/campaigns/schedule_your_campaign/triggered_delivery)
   - Salesforce Journey Builder: fryser entry-KÄLLANS SCHEMA (inte bara
     medlemskap) vid AKTIVERING, och kräver en ny journey-version för att
     ändra det — den mest konservativa varianten av mönstret.
     [Entry Sources](https://help.salesforce.com/s/articleView?id=000232652&language=en_US&type=1)

   **Gemensamt:** INGEN av dessa verktyg låter frysnings-tidpunkten vara
   implicit eller odokumenterad. Var och en namnger explicit VILKET
   ögonblick som gäller (schemaläggning, enqueue, aktivering, eller send)
   och erbjuder — i de flesta fall — ett uttryckligt val mellan tidigt-fryst
   och sent-omvärderat.

3. **Ingen av de sju hittade jag varnar för eller nämner "publik-drift
   mellan förhandsvisning och sändning" som en SEPARAT risk från
   schemaläggnings-frysningen** — sannolikt eftersom deras
   förhandsgranskning ANTINGEN är samma frusna snapshot som kommer sändas
   (Klaviyo/Mailchimp default) ELLER en känd, dokumenterad estimat-status
   (Customer.io). Vår situation är strukturellt identisk med Customer.ios:
   `compute-segment`s antal är ett ESTIMAT, `send-email`s beräkning är
   facit — och eftersom båda sker inom loppet av ett synkront användarflöde
   (inga minuter/timmar emellan idag) är draget minimalt.

**Rekommendation (min egen syntes, INTE branschprecedens i sig):** Formulera
detta uttryckligen i UI:t enligt Customer.ios mönster — antalet i
förhandsvisningen ("Segmentet innehåller just nu N personer") bör vara
läsbart som ett ESTIMAT, inte ett löfte, EXAKT tills schemalagd send byggs
(ADR-067:s deferrade tråd). Den dagen schemalagd send införs blir denna
fråga skarp på riktigt, och Klaviyos/Brazes mönster — explicit, namngivet
val mellan "frys vid schemaläggning" och "beräkna om vid sändning", med
sistnämnda som förvalet givet vår `send-email`-arkitekturs redan
server-auktoritativa modell — är den etablerade branschlösningen att luta
sig mot. Detta ÄR en öppen fråga precedensen inte färdigbesvarar för oss:
ingen av de sju säger vad som är RÄTT förval, bara att valet måste vara
explicit och namngivet.

---

## Dom

Branschen har konvergerat på ett tvådelat mönster som vår arkitektur redan
till hälften följer:

1. **Dynamiskt medlemskap över statiskt** (redan vårt val, ADR-062 beslut 1
   — bekräftat helt rätt av samtliga sju undersökta verktyg).
2. **Regeln uttrycks som predikat/villkor över attribut, inte som
   uppräkning av kända värden** (INTE ännu vårt val — `SegmentRuleSchema`
   tvingar `include[]` att räkna upp specifika `(kurs, modalitet)`-par, även
   om `kurs`-VÄRDERYMDEN är domän-öppen). Detta är den faktiska källan till
   att RIM 4 inte automatiskt omfattas av ett befintligt "alla
   utbildningar"-segment — inte en dynamik-brist, utan en uttrycksform-brist.

En breddning av regelformen mot att tillåta ett villkor som "modalitet =
Utbildning, oavsett kurs" (dvs. ett `Par` där `kurs` är valfri/wildcard, som
en tredje form vid sidan av dagens exakta par) skulle vara branschmönstret
korrekt applicerat, och skulle lösa exakt det problem som utlöste detta
research-pass. Formen kan uttryckas additivt inom befintlig
`{include, exclude}`-mängdalgebra (samma OR-över-include/NOT-any-exclude-
mekanik `computeMembership` redan implementerar) — den kräver INTE att
dynamik-modellen (ADR-062) eller närvaro-golvet (ADR-064 beslut 1) rivs,
bara att `Par`s form breddas.

**Hybridformen** (dynamisk regel + handplockade individer) har svag men
konsekvent precedens (§ 3) som samma mängdalgebra-utvidgning: en tredje
gren i `include[]`/`exclude[]` av typen `{ personIds: string[] }` vid sidan
av `Par`.

**Sänd-tids-frysningsfrågan** är redan löst FÖR VÅR NUVARANDE
send-omedelbar-arkitektur (branschens säkraste läge, Customer.io-mönstret)
och blir en öppen, namngivningskrävande fråga FÖRST den dag schemalagd send
byggs.

---

## Vad jag inte kunde belägga

- **Ingen direkt branschprecedens för en regel-SCHEMA-migration** (uppräkning
  → predikat) med beskrivning av hur befintliga sparade regler hanterades.
  De två närmaste analogierna (HubSpots ID-bevarande list-konvertering,
  Salesforces journey-versionering vid schema-drift) är STRUKTURELLT
  näraliggande, inte samma problem. Deklareras öppet — räkningen fejkas
  inte: detta är **0 av 7** verktyg med en bekräftad direkt-match-precedens.
- **Klaviyos exakta villkorstyp för "är medlem i lista X" inuti en
  segmentregel** kunde inte verifieras mot Klaviyos EGEN officiella
  dokumentation (två separata WebFetch-försök mot Klaviyos help-center gav
  inte den specifika detaljen) — bara mot community-/praktiker-källor.
  Hybridform-precedensen (§ 3) vilar därför på 1 stark (HubSpot,
  community-korroborerad) + 1 svag (Klaviyo, oöverifierad) källa, inte 2
  officiella.
- **Salesforce Audience Builders fullständiga sida** (`help.salesforce.com …
  mktg.mc_ab_audience_builder.htm`) gick inte att hämta i sin helhet via
  automatiserad hämtning under detta pass — regelformens beskrivning där
  vilar på sökmotor-sammandrag, inte en direkt sidhämtning. Kärnpåståendet
  (predikat-byggare över Data Extension-fält) är dock konsekvent med hur
  Journey Builders Audience-entry-källa beskrivs i den sida som GICK att
  hämta, så jag bedömer det som sannolikt korrekt men inte primärkälle-
  verifierat i detalj.
- **Inga kvantifierade kostnadstal** (latens, radantal) för
  query-tids-beräkning kontra materialisering hittades hos något av
  verktygen — bara den strukturella observationen att samtliga sex externa
  verktyg VALT att investera i materialisering/inkrementell uppdatering
  snarare än ren query-tids-beräkning. Detta är ett indirekt, inte ett
  mätt, belägg för att query-tid inte skalar — jag har INTE mätt vår egen
  `compute-segment`s faktiska svarstid i detta pass (utanför scope; skulle
  krävt körning mot staging).
- **Rätt FÖRVAL** för "frys vid schemaläggning" vs "beräkna om vid sändning"
  när/om schemalagd send byggs hos oss — precedensen visar att valet måste
  vara explicit, men ger inget entydigt svar på vilket som ska vara
  förvalet i VÅR kontext. Detta lämnas uttryckligen som en öppen fråga för
  det passet, inte gissat här.

---

## Rekommendation (ej beslut)

1. **Bredda `Par`-typen** (ej hela regel-modellen) till att tillåta ett
   villkor utan `kurs` (predikat på enbart `modalitet`) som en additiv,
   bakåtkompatibel utvidgning av `SegmentRuleSchema` — branschmönstret
   applicerat minimalt. Befintliga sparade regler (exakta par) fortsätter
   fungera oförändrat; nya regler kan uttrycka "alla utbildningar" som ETT
   predikat i stället för en uppräkning som måste underhållas manuellt vid
   varje ny kurslansering.
2. **Överväg samma additiva mönster för handplockning** (§ 3): en tredje
   gren `{ personIds: string[] }` i `include[]`/`exclude[]`, vilket
   återanvänder `computeMembership`s existerande OR/NOT-any-algebra utan
   att ändra dess form. Detta besvarar `task-181`:s öppna funktionsfynd
   ("gå inte att lägga till en handplockad individ") med samma mekanik som
   redan finns, i stället för ett parallellt system.
3. **Formulera `compute-segment`s förhandsvisnings-antal som ett estimat**
   (Customer.io-mönstret) redan nu, i god tid före schemalagd send någonsin
   byggs — kostar en textformulering, inte en arkitekturändring, och stänger
   den enda del av "avgörande frågan" som är billig att stänga idag.
4. **Vid ADR-064-revision:** dokumentera uttryckligen att breddningen är en
   UTVIDGNING av `Par`s form (additiv union), inte en ersättning — i linje
   med det enda migrationsmönster precedensen (svagt) antyder: bevara
   identitet och bakåtkompatibilitet vid en formändring, hellre än att byta
   modell under befintliga sparade regler.

---

## Källförteckning

**Primärkällor (officiell produktdokumentation, hämtad direkt):**

- [HubSpot — Create active or static lists](https://knowledge.hubspot.com/lists/create-active-or-static-lists)
- [Klaviyo — How to change when a campaign's recipients are determined](https://help.klaviyo.com/hc/en-us/articles/22501501263899)
- [Klaviyo — Troubleshooting skipped profiles in email campaigns](https://help.klaviyo.com/hc/en-us/articles/115005258268)
- [Klaviyo — Understanding the difference between segments and lists](https://help.klaviyo.com/hc/en-us/articles/115005061447)
- [Klaviyo — Getting started with segments](https://help.klaviyo.com/hc/en-us/articles/115005237908)
- [Braze — Segments](https://www.braze.com/docs/user_guide/audience/segments)
- [Braze — Segment Extensions](https://www.braze.com/docs/user_guide/audience/segments/segment_extension)
- [Braze — Connected Audience object](https://www.braze.com/docs/api/objects_filters/connected_audience)
- [Braze — Action-Based Delivery (campaign scheduling)](https://www.braze.com/docs/user_guide/messaging/campaigns/schedule_your_campaign/triggered_delivery)
- [Customer.io — Segmentation overview](https://docs.customer.io/journeys/segments/)
- [Customer.io — How segments work](https://docs.customer.io/messaging/segmentation/segments/)
- [Customer.io — Data-driven segments](https://docs.customer.io/messaging/segmentation/data-driven-segments/)
- [Customer.io — One-time sends (broadcasts)](https://docs.customer.io/messaging/send/broadcasts/one-time-sends/)
- [Twilio Segment — Engage Audiences Overview](https://www.twilio.com/docs/segment/engage/audiences)
- [Twilio Segment — Linked Audiences Limits](https://www.twilio.com/docs/segment/engage/audiences/linked-audiences-limits)
- [Twilio Segment — Computed Traits](https://www.twilio.com/docs/segment/unify/traits/computed-traits)
- [Salesforce — Journey Builder Entry Sources](https://help.salesforce.com/s/articleView?id=000232652&language=en_US&type=1)
- [Salesforce — Audience Builder](https://help.salesforce.com/s/articleView?language=en_US&id=mktg.mc_ab_audience_builder.htm&type=5) (sammandrag, ej fullt hämtad — se § Vad jag inte kunde belägga)
- [Intercom — How to segment your contacts](https://www.intercom.com/help/en/articles/324-how-to-segment-your-contacts)
- [Intercom — Segment model (API-dokumentation)](https://developers.intercom.com/docs/references/2.4/rest-api/segments/segment-model)
- [Mailchimp — Save and Manage Segments](https://mailchimp.com/help/save-and-manage-segments/)
- [Mailchimp — Schedule or Pause a Regular Email](https://mailchimp.com/help/schedule-or-pause-a-regular-email-campaign/)

**Tredjeparts-/community-källor (märkta, används som komplement där
primärkälla saknades eller inte kunde verifieras i detalj):**

- [HubSpot Community — Merging Lists](https://community.hubspot.com/t5/CRM/Merging-Lists-Not-really-static-is-it/m-p/438770) (hybrid-mönster, "is member of list X OR Y")
- [HubSpot Community — Converting Static List to Active List](https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/Converting-Static-List-to-Active-List-Filter-Issues/m-p/1138500) (2025 konverteringsfunktion, ID-bevarande)
- [Cazoomi — Mailchimp's Static Segment Feature Is Now Changed To Tags](https://support.cazoomi.com/hc/en-us/articles/360012866132-Mailchimp-s-Static-Segment-Feature-Is-Now-Changed-To-Mailchimp-Tags) (migrations-kontext, tredjehand)

**Interna källor (vår egen arkitektur, disk-verifierade denna session):**

- `src/domain/schemas/Segment.schema.ts` (`SegmentRuleSchema`, `ParSchema`)
- `supabase/functions/_shared/segment-membership.ts` (`computeMembership`-algebra)
- `supabase/functions/_shared/segment-resolution.ts` (on-demand källwalk, `NARVARO_FILTER`)
- `supabase/functions/send-email/index.ts` (server-side mottagar-upplösning, rad 22–23)
- [ADR-062](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md), [ADR-064](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md), [ADR-065](../decisions/ADR-065-segment-regel-persistens.md), [ADR-067](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md)
- `docs/reference/segment-arkitektur.md`
- `tasks/sessions/bilagor/s104-segment-divergens/DUKNING.md`
- `backlog/tasks/task-181` (funktionsfyndet: handplockning ej möjlig idag)
