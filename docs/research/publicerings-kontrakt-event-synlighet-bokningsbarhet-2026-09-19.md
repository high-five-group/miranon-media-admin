---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: draft
---

# Publiceringskontrakt för event — synlighet, bokningsbarhet och livscykel (branschprecedent, 2026-09-19)

> **Proveniens:** avgränsat research-pass, Session 128. Kört OISOLERAT i
> worktreen `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s128-docs`
> (gren `docs/s128-fodelse`). Ingen commit, ingen produktionskod rörd. Frågan:
> hur branschledande event-/biljett- och publiceringsplattformar modellerar ett
> events publiceringstillstånd, publika synlighet och bokningsbarhet — och
> vilken modell Miranon Media bör lägga som grund för nya miranon.se.
> **Tillägg mitt i passet** (orkestreraren, efter Marcus-grillning samma dag):
> lägg dessutom till flerspråkighets-formen för de publika textfälten — v1 är
> svensk-bara, men en känd framtida engelsk yta (Roger) ska inte kräva att
> fält rivs om. Besvarat i § 4.4.

## Kort svar

**Domen i klartext:** fyra genuint ortogonala axlar bär modellen —
**(1) publik synlighet** (en readiness-/publiceringsspärr, boolean räcker),
**(2) anmälningsfönster** (två nullbara datum, aldrig en enum),
**(3) kapacitet** (ett tal + BERÄKNAD "platser kvar", aldrig lagrad), och
**(4) förekomststatus** (inställt/flyttat/planerat/genomfört — Miranon Media
HAR REDAN DENNA AXEL i basen). "Fullbokat", "kommer snart", "passerat" och
"bokningsbart" ska ALDRIG lagras — de är rena härledningar av de fyra axlarna
plus klockan, i varje undersökt precedent. Den avgörande delfrågan var #3
(syntesen): destillatets fyra-läges-`livscykel`-enum (draft|scheduled|
published|archived) håller INTE som en enda lagrad enum mot precedenten — inget
undersökt system lagrar "arkiverat" som ett admin-satt tillstånd skilt från
datumjämförelse, och "schemalagd publicering" är i den starkaste precedenten
(WordPress) ett DATUM på samma post, inte ett fjärde enum-värde. Orkestrerarens
två-reglage-hypotes (synlig-checkbox + anmälan-enum) håller på synlighets-delen
men bör byta sin anmälan-ENUM mot pretix modell precis (nullbart öppnar-datum +
nullbart stänger-datum) — det komponerar samtliga åtta scenarier i uppdraget
utan en enda specialgren. **Flerspråkighet (§ 4.4) påverkar INGEN av de fyra
axlarna** — samtliga tillståndsfält är språkoberoende i alla nio precedenter —
och löses för de publika TEXTFÄLTEN genom att aldrig språksuffixa ett
fältnamn (pretix/Shopify/Sanity-mönstret) och genom att reservera, men inte
bygga, en parallell översättningstabell tills engelskan faktiskt skrivs.

## Vad jag redan hade innan jag sökte

**Läst i sin helhet före första sökning:** hela `docs/research/`-katalogen
(`ls`, 149 filer) och tre pass identifierade som direkt relevanta, lästa helt:

- [`miranon-se-intagskedjan-idag-2026-09-19.md`](miranon-se-intagskedjan-idag-2026-09-19.md)
  (samma session, S128) — kartlägger dagens Elfsight+Zapier-intag och bekräftar
  att `Eventplanering.Status` (Planerat/Genomfört/Inställt/Flyttat) redan
  existerar och triggar A6 (fullbokat-mail) via ett ANNAT, redan beräknat fält
  (`Anmäld beläggning (%)`) — direkt precedent i vår EGEN bas för att
  "fullbokat" redan härleds, aldrig lagras, hos oss.
- [`luma-studie-monster-for-nya-miranon-se-2026-09-19.md`](luma-studie-monster-for-nya-miranon-se-2026-09-19.md)
  (samma session, S128) — undersökte redan Lumas väntelista (manuell
  promovering, aldrig automatisk), påminnelse-gatning (godkännande/väntelista,
  aldrig betalning) och sold-out-läge. **Detta pass ÅTERANVÄNDER de fynden
  rakt av för scenario (c) och lägger inte till en ny Luma-mätning** — samma
  källa citeras, inte omprövad, eftersom den är samma dags mätning och
  frågan (offentlig sida, inte admin) är identisk.
- [`hallplats-modellen-eventsidan-2026-07-26.md`](hallplats-modellen-eventsidan-2026-07-26.md)
  (S91, ~2 månader gammal) — visade att Miranon Medias EGEN
  bekräftelse-/betalningsmodell redan är ett NÄT av sex verkliga undantagsfall,
  inte en ren kedja. Åldersbedömning: strukturellt fynd om vår egen domän,
  åldras inte alls (det är inte ett verktygs-versionsfaktum) — återanvänt
  direkt, ingen ommätning behövs.

**Sökt och läst:** `docs/decisions/` (`ls`, 133 ADR:er) och
`tasks/lessons.md`/`tasks/lessons.d/` för "publicer", "livscykel",
"eventstatus", "synlighet" — **noll ADR och noll lärdom avgör frågan.** Detta
är alltså INTE ett fall av att riva ett medvetet designval — frågan är genuint
öppen. `docs/reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md`
§ Spår 2 (destillatet uppdraget citerar) läst i sin helhet: den slår själv fast
att den är **"INPUT, inte beslut"** (dokumentets egen status-rad) och att
"Hemvist-frågan är öppen" — jag behandlar den alltså som HYPOTES att pröva, per
uppdraget, inte som en källa att luta mig mot.

**Bas-fakta verifierade direkt mot `docs/reference/data-model.md`** (auktoritativ
för fältdata, `ADR-100` §1) innan jag sökte externt:

- `Eventplanering.Publicerad på miranon.se` (`fldrjj61ovL3Zv1mN`), **checkbox**,
  skapad 19.4 (data-model.md rad 125). Skrivs av `create-event`, **ingen
  läs-väg i appen** — `backlog/tasks/task-32`, status `To Do`, citerat
  ordagrant nedan i § "Vad repot redan bär".
- `Eventplanering.Status` (`fld2nXlS1UG0aOHLt`), singleSelect: **Planerat,
  Genomfört, Inställt, Flyttat** (data-model.md rad 1117, 1144, 990–1001).
  "Inställt" är arrangör-initierat och **semantiskt skild från
  `Anmälningar.Status=Avbokad/Ombokad`** (data-model.md rad 990). Ingen post i
  repot beskriver VAD som sätter "Genomfört" (manuellt eller automatiskt) —
  grep gav noll träffar i `schema_reference.md`, behandlas som **[HYPOTES —
  EJ VERIFIERAD]: sannolikt manuellt**, se § Vad jag inte kunde belägga.
  **Ingen fält fångar det GAMLA datumet** när Status sätts till Flyttat
  (grep efter "Tidigare datum"/"Ursprungligt datum" gav noll träffar) — en
  konkret lucka mot schema.org (§ 5).
- Kapacitet: `Eventplanering.Max antal platser` (`fldbyEz8djcxCBO5r`, number,
  data-model.md rad 1119, 1143) och `Platser kvar` (`fldaqwIdTNJ54Xn5P`,
  **formula**, data-model.md rad 1555) — redan en BERÄKNAD (aldrig lagrad)
  platser-kvar-kedja i vår egen bas, med en dokumenterad "blast radius"-lista
  över allt som läser den.
- Inget fält för anmälningsfönster (`Anmälan öppnar`/`Anmälan stänger` eller
  motsvarande) finns i create- eller update-fält-tabellerna
  (`data-model.md` rad 1090–1168, `ADR-066` § Beslut 2) — bekräftad LUCKA,
  inte bara frånvaro i min sökning.
- `docs/reference/airtable-constraints.md` § P22 (rad 260–269): **hård
  `z.enum`-validering på live-läsvägen kraschar om EN record bär ett
  option-värde utanför nuvarande lista** — direkt relevant designvillkor för
  varje ny singleSelect jag rekommenderar (§ 4). § P25 (rad 436–444): Airtable
  saknar schema-as-code — bekräftar att en NY status-enum inte kan ersätta en
  BEFINTLIG fälttyp in-place (samma vägg som redan tvingade fram `Antal aktiva
  anmälningar` som ett NYTT fält i stället för att bygga om `Antal
  anmälningar`, data-model.md rad 1542–1552 — samma mönster gäller om
  `Publicerad på miranon.se` någon gång ska bli mer än en checkbox).

**Åldersbedömning:** samtliga tre interna pass är från samma session (S128,
i dag) utom `hallplats-modellen` (S91, ~2 månader) — vars fynd är ett
strukturellt faktum om vår egen affärsdomän (sex undantagsfall i
bekräftelse-/betalningsflödet), inte ett verktygs- eller API-faktum som kan ha
hunnit ändras. Ingen ommätning behövdes. Externa precedenter (Eventbrite,
pretix, Shopify, WordPress, schema.org, Google) är samtliga hämtade FÖRSTA
gången i detta pass 2026-09-19 — genuint ny mark, ingen tidigare research i
repot täcker dem (grep på "pretix", "Eventbrite", "ProductStatus",
"post_status" i `docs/research/` gav noll träffar före detta pass).

---

## 1. Precedenttabell — klass, källa, hämtdatum

| # | Klass | Precedent | Primärkälla | Hämtad |
|---|---|---|---|---|
| 1 | (i) Biljett/event | **Eventbrite** | API-hjälpdokumentation + Help Center + community-tråd (delvis sökträffs-syntes, se markering) | 2026-09-19 |
| 2 | (i) Biljett/event | **pretix** (öppen källkod) | `docs.pretix.eu` API-referens (Event/SubEvent/Quota/Waitlist) | 2026-09-19 |
| 3 | (i) Biljett/event | **Ticket Tailor** | Help Center (delvis sökträffs-syntes) | 2026-09-19 |
| 4 | (i) Biljett/event | **Luma** | ÅTERANVÄND ur `luma-studie-monster-for-nya-miranon-se-2026-09-19.md` (samma dag) | 2026-09-19 |
| 5 | (ii) Publicering/CMS | **Shopify** (Product status + Publications) | `shopify.dev` GraphQL Admin API-referens | 2026-09-19 |
| 6 | (ii) Publicering/CMS | **WordPress** (post_status) | `wordpress.org/documentation` + `developer.wordpress.org` | 2026-09-19 |
| 7 | (ii) Publicering/CMS | **Sanity** (drafts) | `sanity.io/docs` | 2026-09-19 |
| 8 | (iii) Standard | **schema.org Event** | `schema.org` (eventStatus, offers, eventAttendanceMode, validFrom, previousStartDate) | 2026-09-19 |
| 9 | (iii) Standard | **Google Search Central** | `developers.google.com/search` Event-strukturerad-data-guide | 2026-09-19 |

**Kandidatlistan omprövad enligt uppdraget:** Meetup och Tito undersöktes INTE
— fyra biljettplattformar (Eventbrite, pretix, Ticket Tailor, Luma) gav redan
konsekvent, samstämmig evidens för samma axel-uppdelning, och ett femte
tillägg hade inte flyttat slutsatsen. Contentful undersöktes INTE till förmån
för Sanity — samma "draft-dokument"-mönster, och Sanity hade en tydligare
förstaparts-sida om just förhandsgranskning (scenario g). Precedent-rymden för
klass (i) och (ii) är **BRED, inte tunn** — nio källor, fyra oberoende
biljettsystem, samtliga samstämmiga på huvudaxeln. Precedent-rymden för klass
(iii) är **smalare men auktoritativ**: exakt en standard (schema.org) och exakt
en stor konsument av den (Google) — det finns ingen tredje jämförbar källa att
tillföra, vilket deklareras öppet, inte fyllt med gissning.

---

## 2. Per-precedent: tillstånd, vem sätter dem, hur uttrycks fallen

### 2.1 Eventbrite

**Två SKILDA fält, inte en enda status** (community-belagt, se markering):
`status` (event-nivå: `draft`/`live`/`started`/`ended`/`completed`/`canceled` —
sökträffs-syntes, EJ ordagrant citerat ur en enda primärkälla trots tre
försök, se § Vad jag inte kunde belägga) och en SEPARAT
`event_sales_status`-expansion (`on_sale`/`sold_out`/`sales_ended`, med en
`message_code` som `event_cancelled` eller `event_postponed`). Citerat
ordagrant ur community-tråden:

> "the event status and the event sales status" är separata indikatorer — ett
> event kan visa `status: live` medan `sales_status` säger `sales_ended` med
> `message_code: event_cancelled`.
> — [Google Groups-tråd, Eventbrite API](https://groups.google.com/g/eventbrite-api/c/HKSxB9vYCNA), hämtad 2026-09-19

`listed` (boolean) är ETT TREDJE, separat fält: *"true means the Event is
allowed to be publicly searchable on the Eventbrite website"* (sökträffs-syntes
mot Eventbrite-dokumentationen). **Vem sätter vad:** `status` sätts av
organisatören via ett UI-läge (Draft→Live-knapp); "Cancelled"/"Postponed" sätts
via ETT MÄNSKLIGT VAL i en "Change event status"-meny med mänskligt språk —
Help Center-artikeln (citerad, [Change your event status](https://www.eventbrite.com/help/en-us/articles/125543/how-to-manage-your-event-status/),
hämtad 2026-09-19) listar just "Tickets At The Door", "Sold Out", "Cancelled",
"Postponed" som knappval, inte råa enum-strängar. `sales_status`/`sold_out`
härleds av plattformen ur kapacitet, aldrig satt av människan direkt.

**Axelantal:** MINST TRE — publiceringsstatus (draft/live/…), synlighet
(`listed`), sälj-/bokningsbarhetsstatus (`sales_status` + message_code).

### 2.2 pretix (öppen källkod)

Den mest exakt dokumenterade av alla nio källor — API-referensen ger
fältnamn, typer och beskrivningar ordagrant:

| Fält | Nivå | Typ | Beskrivning (ordagrant) |
|---|---|---|---|
| `live` | Event/SubEvent | boolean | *"If `true`, the event ticket shop is publicly available."* |
| `is_public` | Event/SubEvent | boolean | *"If `true`, the event shows up in places like the organizer's public list of events"* |
| `presale_start` | Event/SubEvent | datetime, nullbar | *"The date at which the ticket shop opens (or `null`)"* |
| `presale_end` | Event/SubEvent | datetime, nullbar | *"The date at which the ticket shop closes (or `null`)"* |
| `date_from` | Event/SubEvent | datetime | *"The event's start date"* |
| `date_to` | Event/SubEvent | datetime, nullbar | *"The event's end date (or `null`)"* |
| `size` (Quota) | Quota | int, nullbar | storleken på kvoten, `null` = obegränsat |
| `closed` (Quota) | Quota | boolean | *"Whether the quota is currently closed"* |
| `close_when_sold_out` (Quota) | Quota | boolean | *"If `true`, the quota will 'close' as soon as it is sold out once."* |

Källa: [Events](https://docs.pretix.eu/en/latest/api/resources/events.html),
[SubEvents](https://docs.pretix.eu/en/latest/api/resources/subevents.html),
[Quotas](https://docs.pretix.eu/en/latest/api/resources/quotas.html), samtliga
hämtade 2026-09-19.

**Tillgänglighet BERÄKNAS på läsning, aldrig lagras** — dokumentationen säger
det rakt ut: *"Only returned if `with_availability=true` is set on the
request. Do not rely on this value for critical operations, it may be
slightly out of date."* Detta är EXAKT samma försiktighet Miranon Medias egen
`Platser kvar`-formel redan bär (formula-fördröjning, `airtable-constraints.md`
P14).

**Väntelista:** helt SEPARAT mekanism (`waitinglist`-resursen), inte ett
event-status-värde. En person lägger sig i kö per PRODUKT (inte per event),
och pretix kan valfritt räkna in väntelistan i kvot-beräkningen. Manuell
voucher-tilldelning från admin, ingen automatisk plats-tilldelning
([Waiting list entries](https://docs.pretix.eu/en/latest/api/resources/waitinglist.html),
sökträffs-syntes för detaljerna, hämtad 2026-09-19).

**Publiceringsspärr — mätt indirekt (community-källa, ej primärkälla
ordagrant):** pretix kontrollpanelen blockerar `live`-toggeln tills minst en
produkt existerar OCH är kopplad till en kvot OCH en betalmetod är
konfigurerad. Markerad som svagare evidens, se § Vad jag inte kunde belägga.

**Axelantal:** FYRA, tydligt separerade i schemat — `live` (publicering),
`is_public` (synlighet i listor — subtilt SKILD från `live`: ett event kan vara
`live` men INTE `is_public`, dvs. "unlisted"-länk), presale-fönster
(bokningsbarhet), kvot (kapacitet).

### 2.3 Ticket Tailor

Svagare källkvalitet (JS-renderad dokumentationssajt, WebFetch nådde bara
navigeringsstrukturen — se § Vad jag inte kunde belägga) men
Help Center-sökträffar gav samstämmig bild: status **Draft** / **Published** /
**"SALES CLOSED"** (använt som cancel-mekanism — dropdown-valet för att
avbryta ett event är att sätta samma status som "vi har stängt försäljningen
manuellt", inte ett dedikerat "Cancelled"-värde) samt **Suspended**
(billing-relaterat, en HELT annan axel — kontots betalningsstatus, inte
eventets). Väntelista är en per-event AKTIVERINGS-checkbox i "advanced
settings", separat aktiverad.

**Modelleringsanmärkning värd att bära vidare:** att återanvända "SALES
CLOSED" för BÅDE "vi pausar försäljningen tillfälligt" och "eventet är
inställt" är precis den typ av AXEL-SAMMANBLANDNING § 3 varnar för — två olika
frågor (är bokningsbart? har eventet hänt?) pressas in i EN status-knapp.
Noterat som ett NEGATIVT exempel, inte ett att kopiera.

### 2.4 Luma (återanvänt, se § "Vad jag redan hade")

Ur `luma-studie-monster-for-nya-miranon-se-2026-09-19.md`: väntelista är
**HELT MANUELLT** promoverad (*"hosts must manually approve waitlisted guests
when spots become available"*), påminnelser gatas på godkännande-/
väntelistestatus men ALDRIG på betalning, och sold-out-läget bär FÖRKLARANDE
text i stället för att bara gråtona en knapp. Ingen ny mätning i detta pass —
samma källa, samma dag.

### 2.5 Shopify — Product status + Publications

**`ProductStatus`-enum, ordagrant citerat:**

| Värde | Beskrivning (ordagrant) |
|---|---|
| `ACTIVE` | *"The product is ready to sell and can be published to sales channels and apps. Products with an active status aren't automatically published to sales channels, such as the online store, or apps."* |
| `ARCHIVED` | *"The product is no longer being sold and isn't available to customers on sales channels and apps."* |
| `DRAFT` | *"The product isn't ready to sell and is unavailable to customers on sales channels and apps. By default, duplicated and unarchived products are set to draft."* |

Källa: [ProductStatus](https://shopify.dev/docs/api/admin-graphql/latest/enums/ProductStatus),
hämtad 2026-09-19.

**Den avgörande meningen är i `ACTIVE`-raden: "aren't automatically
published."** `status` är en READINESS-SPÄRR (får ens publiceras?), inte
publiceringen själv. Den FAKTISKA publiceringen är ett HELT SEPARAT objekt,
`Publication`/`ProductPublication`, ett-per-säljkanal, med sitt eget
`publishedAt`-datum (*"the date that the product was or is going to be
published on the channel"*, [ProductPublication](https://shopify.dev/docs/api/admin-graphql/latest/objects/productpublication),
sökträff-syntes, hämtad 2026-09-19). `Product.status` beskrivs samtidigt som
"controls visibility across all sales channels" ([Product](https://shopify.dev/docs/api/admin-graphql/latest/objects/product),
hämtad 2026-09-19) — en spänning värd att bära vidare: `status` är
förutsättningen, `Publication` är verkställandet. Miranon Media behöver bara
ETT distributionsmål (miranon.se), så denna dubbelhet KAN kollapsas till en
enda boolean hos oss (se § 4) — men principen (readiness-spärr ≠
publicerings-handling) håller ändå.

**Axelantal:** TVÅ — status (readiness-gate) och Publication (faktisk
publicering, per kanal, med tidsstämpel).

### 2.6 WordPress — `post_status`

Åtta inbyggda statusar, ordagrant citerade
([Post Status](https://wordpress.org/documentation/article/post-status/),
hämtad 2026-09-19):

| Status | Beskrivning (ordagrant) |
|---|---|
| `publish` | *"Viewable by everyone."* |
| `future` | *"Scheduled to be published in a future date."* |
| `draft` | *"Incomplete post viewable by anyone with proper user role."* |
| `pending` | *"Awaiting a user with the `publish_posts` capability … to publish."* |
| `private` | *"Viewable only to WordPress users at Administrator level."* |
| `trash` | — |
| `auto-draft` | *"Revisions that WordPress saves automatically while you are editing."* |
| `inherit` | (barn-poster ärver förälderns status) |

**`future` är EN ENDA extra enum-värde, inte ett andra fält** — WordPress
löser tidsstyrd publicering genom att en post FAKTISKT SKRIVER `post_status =
future` plus ett `post_date` i framtiden, och en cron-liknande mekanism
(`WP-Cron`) flippar `post_status` till `publish` EXAKT vid det datumet — ett
riktigt skrivet tillståndsbyte, inte en beräkning vid varje läsning. Detta är
en genuint annan lösning än pretix `presale_start` (som ALDRIG skriver om
någonting — tillgängligheten beräknas varje gång). Båda mönstren är giltiga;
skillnaden och valet för Miranon Media diskuteras i § 4.

**Axelantal:** WordPress har INGEN separat "synlighet"-axel utöver
`post_status` självt (`private` FÅR vara synonymt med "publicerad men bara för
inloggade" — en annan variant av samma fält) och INGEN kapacitets- eller
bokningsfönster-axel alls (poster har ingen kapacitet). Svagare analogi för
just DEN delen av frågan — men den STARKASTE källan i hela undersökningen för
just scenario (h), tidsstyrd publicering.

### 2.7 Sanity — drafts

**Mekanism, ordagrant:** *"Drafts are saved in a document with an id
beginning with the path `drafts.`"* Vid publicering kopieras innehållet
*"from the draft into a document without the `drafts.`-prefix"* — draften och
den publicerade posten är TVÅ FYSISKA DOKUMENT under samma logiska ID, inte
ETT dokument med ett status-fält. Källa: [Drafts](https://www.sanity.io/docs/content-lake/drafts),
hämtad 2026-09-19.

**Förhandsgranskning löses INTE med ett tredje status-värde** utan med en
"Perspectives"-mekanism som låter en fråga returnera antingen draft-versionen
(för förhandsgranskning) eller den publicerade versionen (för produktion) —
SAMMA data, olika LÄS-läge. Direkt relevant för scenario (g) i § 5.

### 2.8 schema.org `Event`

Fyra egenskaper, samtliga ordagrant citerade från `schema.org`, hämtat
2026-09-19:

- **`eventStatus`** — *"An eventStatus of an event represents its status;
  particularly useful when an event is cancelled or rescheduled."* Tillåtna
  värden (`EventStatusType`): `EventScheduled`, `EventCancelled`,
  `EventPostponed`, `EventRescheduled` — **FYRA värden, inte tre**: Postponed
  (nytt datum ännu okänt) och Rescheduled (nytt datum känt) är SKILDA
  tillstånd i standarden.
- **`previousStartDate`** — *"Used in conjunction with eventStatus for
  rescheduled or cancelled events. This property contains the previously
  scheduled start date."* Appliceras på `Event`, typ Date/DateTime.
- **`eventAttendanceMode`** (`EventAttendanceModeEnumeration`):
  `OnlineEventAttendanceMode`, `OfflineEventAttendanceMode`,
  `MixedEventAttendanceMode`.
- **`offers.availability`** (`ItemAvailability`, egenskap på `Offer` — INTE
  på `Event` direkt): `InStock`, `OutOfStock`, `SoldOut`,
  `LimitedAvailability`, `PreOrder`, `Discontinued`.
- **`validFrom`** — *"The date when the item becomes valid."* Appliceras på
  `Offer`/`Demand` (INTE på `Event`) — dvs. det är biljettens/anmälans
  giltighetsstart, inte eventets. Källa: [validFrom](https://schema.org/validFrom),
  hämtad 2026-09-19.

**Axelantal:** MINST TVÅ inom standarden själv — eventStatus (på Event) och
availability/validFrom (på det nästlade Offer-objektet). Standarden separerar
dem strukturellt genom att placera dem på OLIKA objekt i grafen.

### 2.9 Google Search Central — Event rich results

Krav och rekommendationer, delvis ordagrant citerade
([Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event),
hämtad 2026-09-19):

- **Obligatoriska fält:** `location` (med `address`), `name`, `startDate`.
- **Rekommenderade fält:** `description`, `endDate`, `eventStatus`, `image`,
  `location.name`, `offers`, `organizer`, `performer`, `previousStartDate`.
- **Inställt event:** *"DON'T remove or change other properties (for example,
  don't remove startDate or location); instead, keep all values as the same
  as they were before the cancellation."*
- **Uppskjutet (postponed):** använd `EventPostponed` och *"Keep the original
  date in the startDate of the event until you know when the event will take
  place."*
- **Omschemalagt (rescheduled):** *"Update the startDate and endDate with the
  relevant new dates. Optionally, you can also mark the eventStatus field as
  rescheduled."*
- **Slutsåld:** använd `InStock`/`SoldOut`/`PreOrder` på `offers.availability`.

**Google ger INGEN vägledning om att ta bort sidan för ett PASSERAT event** —
strukturerad data-guiden nämner ingenting om det, vilket är en genuin lucka
(§ Vad jag inte kunde belägga), inte en tolkning jag kan citera.

---

## 3. Syntes — axlarna, vad som aldrig ska lagras, vanliga modelleringsfel

### 3.1 Axel-prövningen mot uppdragets egen hypotes

Uppdraget bad mig pröva: **livscykel · synlighet · bokningsbarhet ·
evenemangsstatus (inställt/framflyttat)** som fyra separata axlar. Mot nio
precedenter håller INTE den exakta fyrdelningen — den håller i en ANNAN form:

| Uppdragets hypotes | Vad precedenten faktiskt visar |
|---|---|
| "Livscykel" (draft→scheduled→published→archived) som EGEN axel, skild från "synlighet" | **Håller INTE som två skilda axlar.** I varenda precedent jag hittade KOLLAPSAR "är den redo att visas" och "visas den nu" till EN axel (Shopify `status`, WordPress `post_status`, pretix `live`). Det som verkligen är en TREDJE sak hos Shopify (`Publication`, per kanal) löser ett multi-kanal-problem Miranon Media inte har (en publik sajt, en kanal). |
| "Bokningsbarhet" som EN axel | **Håller INTE som EN axel — det är TVÅ.** pretix/Eventbrite/Ticket Tailor separerar TID (presale-fönster/sales window) från MÄNGD (kvot/kapacitet). De är oberoende: ett event kan ha öppen anmälningstid men noll platser kvar (fullbokat), eller stängd anmälningstid med gott om platser kvar (Lotta pausade avsiktligt). |
| "Evenemangsstatus" (inställt/framflyttat) som EGEN axel | **HÅLLER, starkt.** Eventbrites separata `sales_status`+`message_code`, schema.org:s eget `eventStatus` skilt från `offers.availability`, och Miranon Medias EGEN `Eventplanering.Status` (redan byggd, redan skild från `Publicerad på miranon.se`) — tre oberoende bekräftelser. |

**Reviderad, precedent-bekräftad axel-lista (fyra, men en annan fyra än
hypotesen):**

1. **Publik synlighet** (readiness-/publiceringsspärr) — EN boolean räcker
   för en enda distributionskanal (Shopify/pretix/WordPress-mönstret, kollapsat
   till Miranon Medias skala).
2. **Anmälningsfönster** (tid) — TVÅ nullbara datum (pretix `presale_start`/
   `presale_end`), aldrig en enum.
3. **Kapacitet** (mängd) — ett tal + en BERÄKNAD rest, aldrig lagrad
   (pretix-varningen, Airtable P14, vår egen `Platser kvar`-formel).
4. **Förekomststatus** (hände det som planerat?) — Planerat/Inställt/Flyttat/
   (Genomfört), redan Miranon Medias EGEN axel.

### 3.2 Vad som ALDRIG ska lagras — härledningar, med precedent per rad

| Härledning | Härleds ur | Precedent som bekräftar "beräkna, lagra aldrig" |
|---|---|---|
| Fullbokat | kapacitet − aktiva bokningar ≤ 0 | pretix (`with_availability`-varningen), Eventbrite (`sales_status` beräknas, sätts aldrig av människa), Miranon Medias egen `Platser kvar`-formel |
| Kommer snart | synlig=sant AND nu < anmälan-öppnar (eller inget datum satt än) AND nu < startdatum | Ingen precedent lagrar detta som fält — samtliga beräknar det av datumjämförelse (WordPress `future`-status är NÄRA ett undantag, men det ÄR själva publiceringstillståndet, inte ett fjärde separat fält) |
| Bokningsbart | synlig AND inom anmälningsfönster AND kapacitet kvar AND ej passerat AND ej inställt | Sammansatt av samtliga fyra axlar — ingen precedent lagrar en femte "är bokningsbar"-flagga |
| Passerat | nu > slutdatum (eller startdatum) | Ingen precedent har ett admin-satt "arkiverad"-fält skilt från datumjämförelse — Shopifys `ARCHIVED` är en MÄNSKLIG handling (produkten slutade säljas), inte en tidsberäkning, och mappar därför INTE till "passerat event" |

### 3.3 Vanliga modelleringsfel, med instans per fel

1. **En enda status-enum som blandar axlar.** Ticket Tailors återbruk av
   "SALES CLOSED" för både "vi pausar frivilligt" och "eventet är inställt"
   (§ 2.3) är ett levande exempel — två frågor, en knapp. Destillatets
   fyra-läges-`livscykel` riskerar SAMMA fel om "archived" (en tidsberäkning)
   och "published" (en mänsklig handling) delar fält.
2. **En boolean som senare måste bli en enum.** Detta är den fälla scenario
   (g) (förhandsgranskning) lätt leder rakt in i: reflexen är att lägga till
   ett tredje status-värde ("preview"/"unlisted"). **Ingen av de nio
   precedenterna gör det.** WordPress förhandsgranskar en `draft` via en
   SIGNERAD preview-URL, Sanity förhandsgranskar via en LÄS-PERSPEKTIV-växel
   — i båda fallen är förhandsgranskning en ÅTKOMST-mekanism ovanpå samma
   boolean, inte ett tredje tillstånd. Se § 5, scenario (g).
3. **Att lagra en beräknad tillgänglighet som sanning.** pretix varnar
   uttryckligen mot att lita på sitt EGET `with_availability`-svar för kritiska
   operationer. Miranon Medias `Platser kvar` är redan en formel (rätt val) —
   men om en framtida Postgres-modell av bekvämlighet lägger en TRIGGER som
   skriver "platser_kvar" till en kolumn i stället för att räkna vid behov,
   återinförs precis den TYSTA KORRUPTIONS-risk `airtable-constraints.md`
   redan katalogiserar under P2/P16.
4. **Att blanda ihop "readiness" (får den publiceras) med "publicerad"
   (är den publicerad).** Shopifys `ACTIVE`-status är EXPLICIT inte samma sak
   som att produkten faktiskt syns någonstans (§ 2.5) — en spärr som
   FÖRHINDRAR ett ofullständigt event från att publiceras (§ 6) är en ANNAN
   mekanism än checkboxen som FAKTISKT publicerar det.
5. **Att inte skilja Postponed från Rescheduled.** schema.org gör det
   uttryckligen (§ 2.8) — "vet vi inte nytt datum än" och "vi vet nytt datum"
   är olika kommunikationslägen mot en besökare. Miranon Medias enda
   `Flyttat`-option kan i dag inte uttrycka skillnaden (§ 4, ny fält-rekommendation).

---

## 4. Rekommendation för Miranon Media — fälttabell

> Märkt REKOMMENDATION, inte beslut — Marcus äger valet.

### 4.1 Airtable (additivt, per ADR-063 — ingen befintlig fälttyp ändras)

| Axel | Fält (NAMN) | Fält-ID | Typ | Sätts av | Status |
|---|---|---|---|---|---|
| Synlighet | `Publicerad på miranon.se` | `fldrjj61ovL3Zv1mN` | checkbox | Lotta (manuellt) | **BEFINTLIGT** — bygg bara läs/skriv-vägen (`TASK-32`) |
| Förekomst | `Status` | `fld2nXlS1UG0aOHLt` | singleSelect: Planerat/Genomfört/Inställt/Flyttat | Lotta (manuellt) | **BEFINTLIGT** — återanvänd, inga nya värden |
| Förekomst (nytt) | `Tidigare startdatum` | *(nytt fält)* | date (ISO), nullbar | Lotta, när hon sätter Status=Flyttat | **NYTT** — krävs för schema.org `previousStartDate` och för att skilja Postponed från Rescheduled (§ 3.3 fel 5) |
| Kapacitet | `Max antal platser` | `fldbyEz8djcxCBO5r` | number | Lotta (manuellt) | **BEFINTLIGT** |
| Kapacitet (härledd) | `Platser kvar` | `fldaqwIdTNJ54Xn5P` | formula | Systemet (beräknat) | **BEFINTLIGT** |
| Bokningsfönster (nytt) | `Anmälan öppnar` | *(nytt fält)* | dateTime, nullbar | Lotta (manuellt, valfritt) | **NYTT** — `null` = öppen omedelbart, matchar pretix `presale_start` |
| Bokningsfönster (nytt) | `Anmälan stänger` | *(nytt fält)* | dateTime, nullbar | Lotta (manuellt, valfritt; UI kan erbjuda en "Stäng anmälan nu"-knapp som fyller dagens tid) | **NYTT** — `null` = ingen bortre gräns förutom eventdatum, matchar pretix `presale_end` |

**Publiceringsspärr (§ 6) implementeras i EF-lagret** (`update-event`-verktyget,
samma allowlist-mönster som `ADR-066`), inte som ett nytt bas-fält — en
checklista, inte ett lagrat tillstånd.

**P22-medveten formdesign:** de nya fälten är antingen date/dateTime (inget
enum-tak att knäcka på) eller återanvänder en BEFINTLIG, redan produktionsprövad
singleSelect (`Status`) — INGEN ny singleSelect föreslås för synlighet eller
bokningsfönster, vilket undviker att skapa en femte enum-yta P22 kan knäcka på.

### 4.2 Postgres (Fas E, 1:1-mappning — samma fyra axlar, samma namn-princip)

```sql
-- events (utdrag, endast publicerings-/synlighets-/bokningsbarhets-kolumner)
status                    text NOT NULL DEFAULT 'planerat'
  CHECK (status IN ('planerat', 'genomfort', 'installt', 'flyttat')),
tidigare_startdatum       date NULL,               -- previousStartDate-käll
publicerad_pa_miranon_se  boolean NOT NULL DEFAULT false,
max_antal_platser         integer NULL,             -- null = obegränsat (pretix-mönster)
anmalan_oppnar            timestamptz NULL,
anmalan_stanger           timestamptz NULL,
startdatum                date NOT NULL,
slutdatum                 date NULL
-- "platser kvar" är ALDRIG en kolumn — beräknas i en VY eller vid frågetillfället
-- (COUNT över aktiva bokningar), exakt samma disciplin som dagens Airtable-formel
-- och exakt den varning pretix API-dokumentationen själv ger om sitt eget
-- with_availability-svar (§ 3.2).
```

**Namn-principen:** kolumnnamnen är svenska (domänspråket), INTE en
engelsk/schema.org-översättning inbakad i databasen — samma princip som
`ADR-050` redan etablerat för Airtable-fältnamn (adressera på NAMN, portabelt).
Mappningen till schema.org-vokabulären (`EventScheduled`/`EventCancelled`/…,
`InStock`/`SoldOut`/…) sker i PRESENTATIONSLAGRET (JSON-LD-serialiseringen),
som en ren funktion av kolumnvärdena — INTE som en andra uppsättning
databas-enum-värden att hålla i synk. Detta håller Fas E-migreringen
mekanisk: samma kolumnnamn, samma fyra axlar, ingen omtolkning av vad ett
fält BETYDER.

### 4.3 Migrering av den befintliga checkboxen — utan beteendeändring

`Publicerad på miranon.se` är redan en boolean och behöver INGEN
typkonvertering — den ÄR redan i sin slutgiltiga form (§ 3.1: synlighet
kollapsar korrekt till en boolean för en enda kanal). Befintliga event
påverkas INTE av något i denna rekommendation: `Status`, `Max antal platser`
och `Platser kvar` är oförändrade fält som redan bär data för alla befintliga
rader; de två NYA fälten (`Anmälan öppnar`/`Anmälan stänger`) är nullbara och
defaultar till "inget fönster satt" — identiskt med dagens FAKTISKA beteende
(anmälan är öppen tills kapaciteten tar slut, vilket är exakt vad `null`/`null`
betyder i den nya modellen). **Noll rader behöver backfyllas för att den nya
modellen ska vara korrekt för befintliga event** — det är den additiva,
beteende-oförändrande egenskap `ADR-063` kräver.

### 4.4 Flerspråkighet — grunden nu, engelskan senare

> **Tillägg efter passets start:** orkestreraren meddelade under research-
> passet att Marcus (grillningen, 2026-09-19) beslutat att v1 lanseras på
> svenska men att en grund för översättning ska läggas nu — Roger vill ha
> sajten på engelska senare, ett känt framtida behov, inte spekulation. Detta
> avsnitt svarar på den frågan specifikt: hur precedenten modellerar
> ÖVERSÄTTBARA publika fält, och vilken form Miranon Media bör välja NU för att
> aldrig behöva riva om ett fält när engelskan kommer.

**Ett fynd under detta tillägg, värt att bära in i beslutet:** Miranon Media
har REDAN en tabell med exakt den typ av publikt/kund-riktat prosa-innehåll
frågan gäller — `Eventinnehåll` (`tblfwqsNPSYd6o44L`, `data-model.md` rad
507–519) med fälten `Beskrivning`, `Förberedelser`, `Tag med`, `För dig som
röker`, `Parfym och kosmetika`, `Mat/fika`, `Övernattning`, `Utrustning` (alla
`multilineText`), plus per-event override-kopior på `Eventplanering` självt
(de 17 `"… (bilagetext)"`-fälten, `data-model.md` rad 543–564: tomt fält =
`Eventinnehåll`-standarden gäller). **Detta system är byggt för PDF-bilagor**
(`ADR-125`/`ADR-118`, bekräftelse-/deltagarinformationsdokument), inte
uttryckligen för en publik webbsida — men det är den enda befintliga
publik-riktade prosa-texten i basen, och om nya miranon.se ska visa
"Förberedelser"/"Tag med" etc. är frågan om den ÅTERANVÄNDER detta system
eller bygger ett parallellt en Marcus-fråga, inte min att avgöra i detta pass.
Flaggat i § Vad jag inte kunde belägga.

**Fyra precedenter, tre mönster:**

1. **pretix (öppen källkod) — värde-nivå ordbok i SAMMA fält.** Event-modellens
   `name`-fält är typat `I18nCharField` (bibliotek `django-i18nfield`, källa:
   [`event.py`](https://github.com/pretix/pretix/blob/master/src/pretix/base/models/event.py),
   hämtad 2026-09-19 — fältdefinitionen `I18nCharField(max_length=200,
   verbose_name=_("Event name"))` citerad verbatim). Under huven är en
   `LazyI18nString` *"just a dictionary that maps languages to values"*
   (sökträffs-syntes mot [django-i18nfield-dokumentationen](https://django-i18nfield.readthedocs.io/en/latest/strings.html),
   hämtad 2026-09-19) — FÄLTNAMNET (`name`) ändras ALDRIG när ett nytt språk
   läggs till, bara VÄRDET växer till en ny nyckel i ordboken. I Postgres
   lagras detta som EN JSON-serialiserad textkolumn på SAMMA rad.
2. **Shopify Translations — parallell resurs, inte ett fält-suffix.**
   `TranslatableContent`-objektet bär `key` (*"The resource field that's
   being translated"*), `value`, `locale`, `digest` (ordagrant citerat,
   [TranslatableContent](https://shopify.dev/docs/api/admin-graphql/latest/objects/TranslatableContent),
   hämtad 2026-09-19). Basresursens EGET fält (t.ex. `Product.title`) förblir
   butikens standardspråks-värde, orört och utan suffix — översättningar
   registreras som en HELT SEPARAT, parallell post
   (`translationsRegister`-mutationen) som PEKAR TILLBAKA på `key`. Samma
   grundmönster som pretix (fältidentiteten är språklös), men löst som en
   sido-tabell i stället för ett värde-i-fältet.
3. **Sanity (headless CMS) — TVÅ officiellt erkända mönster, valet beror på
   hur MYCKET som skiljer sig per språk.** Sanitys egen dokumentation
   ([How to Localize Content](https://www.sanity.io/docs/studio/localization),
   sökträffs-syntes, hämtad 2026-09-19) delar upp i **fält-nivå**
   (`internationalized-array`-plugin — *"works well for shared content
   structure where only certain fields differ"*, exemplet är en biografi på
   en person vars namn/bild är gemensamt) och **dokument-nivå**
   (`document-internationalization`-plugin — separata dokument per språk,
   sammanlänkade via en referens, rekommenderat *"when you need unique slugs
   per language (and for Portable Text content)"*, dvs. när MESTA innehållet
   skiljer sig). Miranon Medias fall (rubrik + lång publik beskrivning, som
   troligen skiljer sig helt på engelska, inte bara enstaka ord) matchar
   Sanitys EGET kriterium för DOKUMENT-nivå, inte fält-nivå.
4. **Eventbrite — NEGATIV precedent, värd att redovisa öppet.** Eventbrite
   har INGEN inbyggd per-event-översättning alls: *"Event title, event
   description, and ticket name won't be translated"* av plattformens egna
   språkinställning — den styr bara gränssnittet, inte eventinnehållet
   (sökträffs-syntes, hämtad 2026-09-19). Organisatörer som vill ha
   flerspråkiga listningar skapar SEPARATA event per språk, eller kopplar in
   tredjepartsverktyg. Detta är INTE en modell att kopiera — det är ett bevis
   på att problemet är genuint svårt nog att en stor branschaktör helt enkelt
   INTE löst det i sin datamodell.

**Den gemensamma nämnaren i de tre FUNGERANDE mönstren (pretix, Shopify,
Sanity): fält-/nyckel-IDENTITETEN bär ALDRIG språket.** Inget system suffixar
ett fältnamn med språkkod (`title_en`, `Titel_SV`) — språket är antingen en
nyckel INUTI värdet (pretix) eller en SEPARAT dimension i en parallell resurs
(Shopify, Sanity dokument-nivå). Det är den regel som svarar direkt på
uppdragets fråga.

**Rekommendation för Miranon Media, given (a) Airtable nu och (c) ingen
engelsk text i v1:**

Pretix-mönstret (värde-som-ordbok i EN kolumn) har INGEN naturlig Airtable-
motsvarighet — Airtable saknar en redigerbar flerspråkig fälttyp, och att
lagra rå JSON i ett textfält är fientligt mot Lotta (Gunilla-principen) och
mot `airtable-constraints.md` P22:s allmänna lärdom (strukturerad data i ett
fält Airtable inte förstår är en framtida krasch-yta). **Shopifys
parallell-tabell-mönster, valt av Sanitys EGET kriterium för dokument-nivå,
är därför rätt form** — och den är samtidigt den enda av de tre som ger EN
IDENTISK STRUKTUR i både Airtable och Postgres (en länkad tabell i det ena,
en främmande-nyckel-tabell i det andra), vilket är exakt destillatets krav på
att datamodellen ska överleva bytet orörd (§ Spår 2).

**Konkret, i två lager:**

- **GOLV NU, kostar noll extra fält:** de publika textfält som byggs för nya
  miranon.se (arbetsnamn `Publik titel`, `Publik beskrivning`,
  `Platsbeskrivning` — eller `Eventinnehåll`-systemets befintliga fält, om
  Marcus väljer att återanvända det) namnges UTAN språksuffix, exakt som de
  hade gjort om ingen översättning någonsin skulle byggas. Det svenska
  innehållet ÄR, till sin form, redan "standardspråkets värde" i Shopify-
  bemärkelse — ingen omdöpning krävs den dag engelska läggs till.
- **GRUNDEN, en dokumenterad formbeslut, INGEN ny tabell byggd i v1:** när
  engelska blir aktuellt läggs en NY, länkad Airtable-tabell till (arbetsnamn
  `Innehållsöversättningar`: länk till källposten, `Språk` singleSelect,
  samt EN kolumn per översättningsbart fält — smal och typad, inte en generisk
  fält-namn-som-text-rad, eftersom Miranon Medias översättningsbara fält är
  FÅ och KÄNDA, inte ett öppet innehållsschema; smalt-över-generiskt är
  samma över-engineering-vakt som resten av dokumentet). Postgres-motsvarighet:
  `innehallsoversattningar(entity_id, sprak, publik_titel, publik_beskrivning,
  platsbeskrivning)`. **Detta byggs INTE i detta pass eller i v1** — exakt
  regeln "ingen abstraktion utan en faktisk nuvarande användare" tillämpad:
  Roger är en känd FRAMTIDA användare, inte en nuvarande, så tabellen väntar
  tills engelska faktiskt ska skrivas.

**Tillståndsfälten är språkoberoende — bekräftat, inte antaget.** Ingen av de
fyra axlarna i § 3.1 (synlighet, anmälningsfönster, kapacitet, förekomststatus)
bär en språkdimension i NÅGON av de nio precedenterna i detta dokument —
pretix `live`/`presale_start`/`presale_end`, Shopifys `status`, och
schema.orgs `eventStatus`/`offers.availability` är samtliga skalär-/
datum-/enum-värden utan lokal-nyckel. `Publicerad på miranon.se`,
`Anmälan öppnar`/`Anmälan stänger`, `Status` och kapacitetsfälten behöver
alltså INGEN förändring alls för flerspråkighet — precis vad uppdraget bad
mig bekräfta eller motbevisa.

---

## 5. Scenarioprövning

| # | Scenario | Utfall i rekommenderad modell |
|---|---|---|
| a | Kommer snart, innan anmälan öppnar | `Publicerad`=sant, `Status`=Planerat, `Anmälan öppnar`=framtida datum. Härlett `kommer_snart`=sant (nu < Anmälan öppnar). UI: "Anmälan öppnar DATUM". JSON-LD: `eventStatus=EventScheduled`, `offers.availability=PreOrder`, `offers.validFrom=Anmälan öppnar` (§ 2.8: `validFrom` sitter på `Offer`, exakt denna betydelse). |
| b | Anmälan stängs, sidan lever kvar (gamla länkar döda inte) | `Publicerad` FÖRBLIR sant (orörd) — bara `Anmälan stänger` sätts till nu/förfluten tid. Sidan är fortsatt nåbar på samma URL. Härlett `bokningsbart`=falskt. UI: "Anmälan är stängd" utan att ta bort sidan. Detta är PRECIS varför synlighet och bokningsfönster måste vara SKILDA fält (§ 3.1) — en enda enum hade tvingat ett val mellan "synlig" och "stängd". |
| c | Fullbokat → intresselista | `Max antal platser` uppnått, härlett `fullbokat`=sant (Platser kvar ≤ 0) medan bokningsfönstret annars vore öppet. UI byter CTA till väntelista, per Lumas manuella promoveringsmönster (§ 2.4, ÅTERANVÄND). **Byggberoende, utanför denna frågas scope:** dagens `Väntelista`-tabell är hårdkodad till ETT event/brand (`miranon-se-intagskedjan-idag-2026-09-19.md` § 1.4) och måste generaliseras innan detta scenario kan byggas skarpt. |
| d | Inställt med redan anmälda | `Status`=Inställt (BEFINTLIG mekanism, redan använd 3 gånger i prod). `Publicerad` förblir sant — sidan STANNAR live per Googles explicita krav (§ 2.9, citerat ordagrant: rör inte `startDate`/`location`). UI: framträdande "INSTÄLLT"-banner, CTA borttagen. JSON-LD: `eventStatus=EventCancelled`, alla övriga fält oförändrade. |
| e | Framflyttat datum | `Status`=Flyttat, `Tidigare startdatum`=det GAMLA `Startdatum`-värdet (NYTT fält, § 4.1), `Startdatum` uppdateras till det nya datumet när det är känt. Är nytt datum INTE känt än: `eventStatus=EventPostponed` (startDate ORÖRT, per Google § 2.9). Är nytt datum känt: `eventStatus=EventRescheduled`, `previousStartDate`=`Tidigare startdatum`, `startDate`=nytt. **Detta är den distinktion Miranon Medias nuvarande enda "Flyttat"-värde inte kan uttrycka** (§ 3.3 fel 5) — löst av det nya datumfältet, inte av en ny enum. |
| f | Passerat event — ska sidan finnas kvar? | Härlett `passerat`=sant (nu > Slutdatum). **REKOMMENDATION, inte en ren mätning** (Google ger ingen egen vägledning, § 2.9 slutrad): behåll sidan LIVE på sin permanenta URL, ingen redirect/404. Grunden: (1) Luma behåller passerade eventsidor synligt (`"X Went"`, § 2.4-källan, ursprungligen mätt i Luma-passet), (2) generell SEO-praxis säger 404/410 bara när sidan saknar kvarvarande värde — en sida med testimonials/foton/historik har det, (3) Marcus explicita krav i scenario (b) om att gamla länkar aldrig ska dö gäller lika starkt här. JSON-LD kan behållas (Google exkluderar sannolikt ändå passerade `startDate` ur rich-result-karusellen automatiskt) men detta ÄR TOLKNING, inte en primärkälla — markerat i § Vad jag inte kunde belägga. |
| g | Utkast Lotta vill förhandsgranska publikt före publicering | **Löses INTE med ett tredje status-värde** (§ 3.3 fel 2). `Publicerad`=falskt, men en ADMIN-AUTENTISERAD eller SIGNERAD förhandsgransknings-länk visar sidan ändå — exakt WordPress "Preview"/Sanity "Perspectives"-mönstret (§ 2.6, § 2.7). Ingen ny bas-kolumn krävs. |
| h | Tidsstyrd publicering | **Fas 2, inte MVP** — motiverat av Gunilla-principen och Miranon Medias skala (en admin, låg volym, `CLAUDE.md`: "Liten volym, hög kvalitet"). Byggs det: ett `Publicera automatiskt den`-datumfält (WordPress `future`-mönstret, § 2.6) som en schemalagd mekanism SKRIVER om till `Publicerad`=sant vid rätt tidpunkt — en RIKTIG skrivning (som WordPress), inte en läs-tids-beräkning, så att Lotta ser checkboxen bli sann i UI:t vid rätt tillfälle. Tills byggt: Lotta klickar checkboxen manuellt, vilket matchar hur hon redan arbetar (`miranon-se-intagskedjan-idag-2026-09-19.md`). |

---

## 6. Publiceringsspärren — hindra ofullständiga event från att bli "live"

**Mönster hos precedenterna:** pretix BLOCKERAR sin `live`-toggel tills minst
en produkt är kopplad till en kvot och en betalmetod är konfigurerad
(community-belagt, § 2.2, svagare källkvalitet). Shopifys `ACTIVE`-status är
en EXPLICIT förutsättning skild från själva publiceringshandlingen (§ 2.5).
Ingen av de nio precedenterna implementerar spärren som ett NYTT LAGRAT
statusvärde — den implementeras som en VALIDERING vid SKRIVTILLFÄLLET (kan
inte sätta `live`/`ACTIVE`/checkboxen utan att kraven är uppfyllda).

**Form för Miranon Media:** en checklista i EF-lagrets `update-event`-verktyg
(samma mönster som `ADR-066`s server-side-byggda `create-event`-fält-set och
`_shared/field-allowlists.ts`-SSOT) som vägrar sätta `Publicerad på
miranon.se`=sant om obligatoriska fält saknas: `Startdatum`, `Ort`, `Max antal
platser` (eller ett explicit "obegränsat"-val), pris/kostnadsinformation om
sådan finns. **Detta matchar schema.orgs egna OBLIGATORISKA fält** (§ 2.9:
`name`, `location`, `startDate`) — kravlistan är inte godtycklig, den är
samma minimum som krävs för att JSON-LD:n över huvud taget ska vara giltig
för Googles rich results.

**UI-formen (§ 7) presenterar detta som en checklista Lotta kan LÄSA, inte
ett tekniskt felmeddelande** — se nästa avsnitt.

---

## 7. Administratörens upplevelse

| Precedent | UI-form | Överförbart? |
|---|---|---|
| Eventbrite | Enkel Draft↔Live-knapp + en SEPARAT "Change event status"-meny med MÄNSKLIGA etiketter ("Sold Out", "Cancelled", "Postponed") — aldrig råa enum-strängar | **Ja** — mönstret "mänskligt språk på knappen, teknisk enum bakom" |
| pretix | En (1) toggle-switch ("Shop is live") som är BLOCKERAD med synlig förklaring tills förutsättningarna är uppfyllda | **Ja** — direkt modell för § 6:s checklista |
| Shopify | Status-dropdown (Active/Draft/Archived) + en SEPARAT lista av kanal-toggles | **Delvis** — kanal-listan är överflödig för en enda kanal, men separationen readiness/publicering är värd att behålla konceptuellt |
| WordPress | En (1) "Publish"-knapp + en kalenderväljare för schemaläggning inline i SAMMA panel | **Ja** — bra referens för scenario (h) när det byggs |
| Sanity/WordPress preview | Dedikerad "Förhandsgranska"-knapp, alltid tillgänglig, ingen statusändring | **Ja** — direkt lösning för scenario (g) |

**Rekommenderad form för Miranon Media, Gunilla-anpassad:**

1. **EN checkbox/switch** ("Publicerad på miranon.se") — INAKTIVERAD med en
   synlig, läsbar checklista ("Det här saknas innan du kan publicera: …") tills
   kraven i § 6 är uppfyllda. Matchar pretix.
2. **Ett litet "Anmälan"-avsnitt** med två VALFRIA datumväljare i klarspråk
   ("Anmälan öppnar automatiskt" som förvalt/tomt läge, "Sätt datum" för att
   schemalägga, en "Stäng anmälan nu"-knapp som fyller dagens tid i bakgrunden
   — Lotta behöver ALDRIG förstå begreppet `null`, UI:t översätter). Matchar
   pretix koncept, presenterat i Eventbrites mänskliga-etikett-stil.
3. **En "Förhandsgranska"-länk**, alltid synlig oavsett publiceringsläge.
   Matchar Sanity/WordPress. Löser scenario (g) utan ny modell.
4. **Statusfältet (Planerat/Genomfört/Inställt/Flyttat) är OFÖRÄNDRAT** —
   redan byggt, redan i drift, ingen ny UI-yta krävs för det i detta pass.

**Komplexiteten stannar i datamodellen, inte i gränssnittet:** fyra axlar
bakom kulisserna, men Lotta möter EN switch + ETT litet datumval-avsnitt + EN
länk — tre begripliga kontroller, inte en flerstegsformulär-status-meny.

---

## 8. Bedömning av de två befintliga förslagen

### Orkestrerarens hypotes: två reglage (Synlig-checkbox + Anmälan-enum)

**Håller:** grundinstinkten — TVÅ enkla kontroller i stället för en komplex
status-meny — är EXAKT rätt riktning och matchar pretix/Shopifys mönster av
att hålla admin-ytan minimal medan modellen bär fyra axlar bakom den (§ 3.1,
§ 7). Att "fullbokat" och "passerat" härleds ur data, aldrig lagras, är
DIREKT precedent-bekräftat (§ 3.2) — denna del av hypotesen är korrekt som
den står.

**Håller INTE:** den föreslagna "Anmälan"-ENUMEN (automatisk/stängd/öppnar
datum X) bör ERSÄTTAS av TVÅ nullbara datumfält (pretix `presale_start`/
`presale_end`-mönstret, § 2.2, § 4.1). En enum tvingar fram specialgrenar för
varje kombination; två datum KOMPONERAR samtliga åtta scenarier i § 5 utan en
enda specialgren (t.ex. "stängd men startar om senare" är annars ett femte
enum-värde att uppfinna, medan det i datummodellen bara är att sätta ett nytt
`Anmälan öppnar`-datum). Detta är den PRECIS omvända varianten av fel 2 i
§ 3.3 (en enum där en boolean/datumpar räcker) — samma modelleringsfel-klass,
bytt håll.

### Destillatets hypotes: fyra-läges-livscykel (draft/scheduled/published/archived) + synlighet skild från bokningsbarhet

**Håller:** principen "synlighet skild från bokningsbarhet" är starkt
precedent-bekräftad (§ 3.1) — det ÄR rätt att inte blanda dessa. Att
datamodellen ska vara IDENTISK oavsett Airtable eller Postgres (destillatets
egen tidsordning-rekommendation) är också rätt och är precis vad § 4
levererar.

**Håller INTE:** att packa `draft`/`scheduled`/`published`/`archived` i EN
enda enum. Ingen av de nio precedenterna gör detta fullt ut för ett system med
Miranon Medias egenskaper (kapacitet + bokningsfönster + en enda distributions
kanal). `archived` är särskilt problematiskt — INGEN precedent lagrar "detta
är historiskt" som ett admin-satt fält skilt från datumjämförelse (§ 3.2);
att göra det introducerar en RISK ingen annan precedent bär: en admin som
glömmer flippa statusen lämnar ett event som SER publicerat och aktuellt ut
fast det redan hänt. `scheduled` är den enda biten värd att spara till Fas 2
(§ 5 scenario h) och bör då vara ETT datumfält bredvid den befintliga
checkboxen (WordPress-mönstret), inte ett fjärde enum-värde i samma fält som
draft/published.

**Sammanfattat i tre meningar (för slutrapporten):** Båda förslagens
GRUNDPRINCIP — enkla admin-kontroller, flera axlar bakom kulisserna, härledda
tillstånd aldrig lagrade — är rätt och precedent-bekräftad. Orkestrerarens
"Anmälan"-reglage bör vara två nullbara datum i stället för en enum; destillatets
fyra-läges-enum bör delas upp i en boolean (synlighet) + ett härlett
"passerat"-begrepp (aldrig lagrat) + ett separat schemaläggnings-datumfält
byggt i Fas 2. Ingen av de två förslagen behöver en fjärde status-axel för
"förekomststatus" — den finns redan, byggd, i basen.

---

## 9. Vad som INTE besvarades

- **Vad som sätter `Eventplanering.Status`="Genomfört".** Ingen post i repot
  beskriver mekanismen. [HYPOTES — EJ VERIFIERAD]: sannolikt manuellt av
  Lotta, eftersom ingen automation (A1–A12) i `data-model.md`s
  automationssekvenser rör `Status`-fältet på Eventplanering. Om det ÄR
  manuellt förstärker det § 5 scenario (f):s rekommendation att aldrig lita
  på `Status` för "har eventet hänt" på den publika sajten — bara datummatte.
- **Eventbrites exakta `status`-fält-enum, ordagrant ur en primärkälla.**
  Tre separata försök (den officiella API-referensen, Apiary-mirrorn, en
  Automattic WordPress-plugin-dokumentation) gav antingen `401 Unauthorized`
  (JS-renderad SPA bakom autentisering för WebFetch) eller ofullständigt
  innehåll. Värdena (`draft`/`live`/`started`/`ended`/`completed`/`canceled`)
  är en SÖKTRÄFFS-SYNTES, konsekvent över flera oberoende sökträffar, men jag
  har inte själv sett primärkällans råa JSON-schema. Community-tråden om
  `sales_status`/`message_code` DÄREMOT citerades ordagrant ur en riktig
  Google Groups-diskussion.
- **pretix egen kontrollpanel-UI för publiceringsspärren** (§ 2.2, § 6) —
  API-referensen dokumenterar FÄLTEN men inte UI-flödet; blockerings-
  beteendet är en sökträffs-syntes, inte en skärmdump eller ett citat ur
  pretix-kontrollpanelens egen dokumentation.
- **Ticket Tailors fullständiga API-schema.** Deras utvecklardokumentation
  är en JS-renderad sida WebFetch bara kunde läsa navigeringsstrukturen av —
  fälten i § 2.3 kommer från Help Center-artiklar (sökträffs-syntes), inte
  API-referensen direkt.
- **Om Google exkluderar passerade events ur rich-result-karusellen
  AUTOMATISKT, eller om JSON-LD för ett passerat event aktivt SKADAR
  sökrankingen.** Google Search Central-guiden om Event-strukturerad data
  säger ingenting om detta — det är en genuin lucka i den auktoritativa
  källan, inte något jag valt att inte leta efter. Min rekommendation i
  scenario (f) vilar därför på GENERELL SEO-praxis (404/410-forskning) och
  Luma-precedentets FAKTISKA beteende (behåller sidor), inte på en direkt
  Google-anvisning om just detta.
- **Om pretix/Eventbrite/Ticket Tailor STÖDJER "Postponed utan nytt datum"
  som ett distinkt UI-läge**, eller om de (liksom Miranon Medias nuvarande
  bas) bara har ETT "flyttat/uppskjutet"-läge som schema.org-mappningen sedan
  får gissa riktning på. Endast schema.org SJÄLVT gör distinktionen explicit
  (§ 2.8); jag verifierade INTE om någon av de tre ticket-plattformarna har
  motsvarande UI-distinktion.
- **Meetup och Tito** undersöktes inte alls (§ 1, medvetet bortval — bred
  nog precedent utan dem).
- **Om nya miranon.se ska återanvända den BEFINTLIGA `Eventinnehåll`/
  `(bilagetext)`-fältmodellen** (§ 4.4, byggd för PDF-bilagor) för sitt
  publika textinnehåll, eller bygga en egen, parallell uppsättning fält.
  Detta är ett Marcus-beslut jag inte kan ta åt honom — flaggat, inte gissat.
- **Shopifys `translationsRegister`-mutation i detalj** (parametrarna utöver
  `key`/`value`/`locale`/`digest`, t.ex. exakt hur `translatableContentDigest`
  används för att förhindra att en översättning skrivs över en samtidig
  redigering) — jag citerade `TranslatableContent`-objektets fält ordagrant
  men läste INTE mutationens fullständiga parameterschema.
- **Om Sanitys `internationalized-array`- respektive
  `document-internationalization`-plugin är förstaparts UNDERHÅLLNA
  kärnfunktioner eller community-plugins** — sökträffarna talar om dem som
  "Sanity recommends", men jag verifierade INTE ägarskapet (Sanity AB vs.
  community) för respektive paket i detalj.

---

## Dom

**Fyra axlar bär modellen — synlighet, anmälningsfönster (två datum, aldrig
en enum), kapacitet (ett tal + en beräkning) och förekomststatus (redan byggd
hos Miranon Media) — och samtliga härledda tillstånd (fullbokat, kommer
snart, passerat, bokningsbart) ska beräknas vid behov, aldrig lagras.** Den
avgörande delfrågan var syntesen (§ 3): varken orkestrerarens
"Anmälan"-enum eller destillatets fyra-läges-`livscykel`-enum överlever
prövningen mot nio precedenter oförändrade, men GRUNDPRINCIPEN bakom båda
(enkla admin-kontroller, härledda tillstånd, synlighet skild från
bokningsbarhet) är precedent-bekräftad och rätt. Den enskilt starkaste
enskilda källan var pretix (§ 2.2) — dess `presale_start`/`presale_end`-par
är den städigaste lösningen på "anmälningsfönster" jag hittade, och dess
egen varning mot att lagra beräknad tillgänglighet speglar en disciplin
Miranon Medias bas redan följer (`Platser kvar` är en formel, inte ett
skrivet tal).

## Vad jag inte kunde belägga

Se § 9 i sin helhet — sammanfattat: Eventbrites exakta status-enum (endast
sökträffs-syntes, inte primärkälls-citat), pretix och Ticket Tailors
UI-blockeringsbeteende (samma svaghetsklass), Googles vägledning om
PASSERADE (inte bara inställda/uppskjutna) events, och huruvida "Genomfört"
i Miranon Medias bas sätts manuellt eller automatiskt.

## Rekommendation

> Märkt REKOMMENDATION — Marcus beslut, inte ett genomfört val.

1. Bygg läs/skriv-vägen för `Publicerad på miranon.se` (`TASK-32`) som den
   ENDA synlighets-kontrollen — ingen ny enum, ingen "unlisted"-mellanstatus.
2. Lägg till TVÅ nya, nullbara Airtable-fält: `Anmälan öppnar` och `Anmälan
   stänger` (dateTime) — ersätter orkestrerarens enum-hypotes, § 4.1, § 8.
3. Lägg till ETT nytt Airtable-fält: `Tidigare startdatum` (date, nullbar) —
   sätts av Lotta när `Status` flippas till Flyttat, löser schema.org
   `previousStartDate`-mappningen och Postponed/Rescheduled-distinktionen.
4. Bygg publiceringsspärren (§ 6) som EF-lagrad validering vid
   skrivtillfället, inte som ett lagrat statusfält.
5. Bygg förhandsgranskning (scenario g) som en åtkomstmekanism (signerad
   länk/admin-bypass), aldrig som ett tredje synlighets-värde.
6. Skjut tidsstyrd publicering (scenario h) till Fas 2 av denna yta —
   WordPress `future`-mönstret (ett datumfält + en RIKTIG skrivning vid
   utlöst tid) när/om Marcus vill ha det; inget MVP-krav givet Miranon Medias
   skala.
7. Notera som separat byggberoende: dagens hårdkodade `Väntelista`-tabell
   måste generaliseras innan scenario (c) kan byggas skarpt — utanför denna
   frågas scope men upptäckt under scenarioprövningen.
8. Mappningen till schema.org/JSON-LD (`eventStatus`, `offers.availability`,
   `previousStartDate`, `validFrom`) byggs som en ren presentationsfunktion
   av kolumnvärdena, aldrig som egna lagrade fält (§ 4.2).
9. Namnge de publika textfälten (titel/beskrivning/platsbeskrivning) UTAN
   språksuffix redan i v1 (§ 4.4) — kostar noll extra i dag, sparar en
   rivning den dag Roger vill ha engelska. Bygg INGEN översättningstabell
   förrän engelskan faktiskt ska skrivas; reservera bara formen (smal,
   Shopify/Sanity-dokument-nivå-mönstret, en länkad Airtable-tabell som
   mappar 1:1 mot en Postgres-tabell i Fas E).

## Källförteckning

**Förstapart, klass (i) biljett/event:**

- [Eventbrite — Events API](https://www.eventbrite.com/platform/docs/events), hämtad 2026-09-19 (401/JS-blockerad för WebFetch, se § 9)
- [Eventbrite Help Center — Change your event status](https://www.eventbrite.com/help/en-us/articles/125543/how-to-manage-your-event-status/), hämtad 2026-09-19
- [Google Groups — Eventbrite API, event status vs sales status](https://groups.google.com/g/eventbrite-api/c/HKSxB9vYCNA), hämtad 2026-09-19 — ordagrant citerat
- [pretix — Events API](https://docs.pretix.eu/en/latest/api/resources/events.html), hämtad 2026-09-19 — ordagrant citerat
- [pretix — SubEvents API](https://docs.pretix.eu/en/latest/api/resources/subevents.html), hämtad 2026-09-19 — ordagrant citerat
- [pretix — Quotas API](https://docs.pretix.eu/en/latest/api/resources/quotas.html), hämtad 2026-09-19 — ordagrant citerat
- [pretix — Waiting list entries API](https://docs.pretix.eu/dev/api/resources/waitinglist.html), hämtad 2026-09-19
- [Ticket Tailor — How to set up a waitlist](https://help.tickettailor.com/en/articles/2748053-how-to-set-up-a-waitlist-for-your-event), hämtad 2026-09-19 (403 för WebFetch, sökträffs-syntes)
- [Ticket Tailor — How do I make my event live?](https://help.tickettailor.com/en/articles/950005-how-do-i-make-my-event-live), hämtad 2026-09-19 (sökträffs-syntes)
- [pretix — `event.py` källkod, `Event.name` som `I18nCharField`](https://github.com/pretix/pretix/blob/master/src/pretix/base/models/event.py), hämtad 2026-09-19 — fältdefinitionen citerad verbatim (§ 4.4)
- [django-i18nfield — Working with translated strings](https://django-i18nfield.readthedocs.io/en/latest/strings.html), hämtad 2026-09-19 — sökträffs-syntes, `LazyI18nString`-beskrivningen (§ 4.4)
- [Eventbrite — sökträffs-syntes om avsaknad av per-event-översättning](https://www.eventbrite.com/support/articles/en_US/How_To/how-to-change-the-language-settings-for-your-event) (§ 4.4, negativ precedent), hämtad 2026-09-19

**Förstapart, klass (ii) publicering/CMS:**

- [Shopify — ProductStatus enum](https://shopify.dev/docs/api/admin-graphql/latest/enums/ProductStatus), hämtad 2026-09-19 — ordagrant citerat
- [Shopify — Product object](https://shopify.dev/docs/api/admin-graphql/latest/objects/product), hämtad 2026-09-19 — ordagrant citerat
- [Shopify — Publication object](https://shopify.dev/docs/api/admin-graphql/latest/objects/Publication), hämtad 2026-09-19
- [Shopify — ProductPublication object](https://shopify.dev/docs/api/admin-graphql/latest/objects/productpublication), hämtad 2026-09-19
- [Shopify — TranslatableContent object](https://shopify.dev/docs/api/admin-graphql/latest/objects/TranslatableContent), hämtad 2026-09-19 — ordagrant citerat (§ 4.4)
- [WordPress — Post Status](https://wordpress.org/documentation/article/post-status/), hämtad 2026-09-19 — ordagrant citerat
- [Sanity — Drafts](https://www.sanity.io/docs/content-lake/drafts), hämtad 2026-09-19 — ordagrant citerat
- [Sanity — How to Localize Content](https://www.sanity.io/docs/studio/localization), hämtad 2026-09-19 — sökträffs-syntes (§ 4.4)

**Förstapart, klass (iii) standard:**

- [schema.org — Event](https://schema.org/Event), hämtad 2026-09-19 — ordagrant citerat
- [schema.org — previousStartDate](https://schema.org/previousStartDate), hämtad 2026-09-19 — ordagrant citerat
- [schema.org — validFrom](https://schema.org/validFrom), hämtad 2026-09-19 — ordagrant citerat
- [Google Search Central — Event (Event) structured data](https://developers.google.com/search/docs/appearance/structured-data/event), hämtad 2026-09-19 — delvis ordagrant citerat

**Tertiärt (SEO-praxis, för scenario f, uttryckligen svagare källklass):**

- [Search Engine Journal — Google's John Mueller Explains Why Expired Product Pages May Become Soft 404s](https://www.searchenginejournal.com/googles-john-mueller-explains-why-expired-product-pages-may-become-soft-404s/293959/), hämtad 2026-09-19

**Internt (detta repo):**

- [`docs/reference/data-model.md`](../reference/data-model.md) — rad 125 (`Publicerad på miranon.se`), 990–1001/1117/1144 (`Status`), 1119/1143/1555 (kapacitet), 1090–1168 (create/update-fält-tabeller, ADR-066), 507–564 (`Eventinnehåll`/`(bilagetext)`-fälten, § 4.4)
- [`docs/reference/airtable-constraints.md`](../reference/airtable-constraints.md) — P14 (rad 350–360, formelfördröjning), P22 (rad 260–269, hård enum-krasch), P25 (rad 436–444, ingen schema-as-code)
- [`docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md) — additivt-krav
- [`docs/decisions/ADR-066-skapa-event-write-vertikal-idempotens.md`](../decisions/ADR-066-skapa-event-write-vertikal-idempotens.md) — server-side fält-shape-mönstret för § 6
- [`docs/decisions/ADR-125-bilagornas-modell-och-promoveringsvag.md`](../decisions/ADR-125-bilagornas-modell-och-promoveringsvag.md) — `Eventinnehåll`/`(bilagetext)`-systemets beslutskälla, § 4.4
- [`docs/reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md`](../reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md) § Spår 2 — destillatets hypotes, prövad i § 8
- `backlog/tasks/task-32` — kortet publiceringsspärren och läs/skriv-vägen (rekommendation 1) landar i
- [`docs/research/miranon-se-intagskedjan-idag-2026-09-19.md`](miranon-se-intagskedjan-idag-2026-09-19.md) — Väntelista-tabellens hårdkodning (scenario c-beroendet)
- [`docs/research/luma-studie-monster-for-nya-miranon-se-2026-09-19.md`](luma-studie-monster-for-nya-miranon-se-2026-09-19.md) — Luma-väntelista/påminnelse-fynden, återanvända i § 2.4
- [`docs/research/hallplats-modellen-eventsidan-2026-07-26.md`](hallplats-modellen-eventsidan-2026-07-26.md) — Miranon Medias egen bekräftelsemodell som ett nät, inte en kedja
