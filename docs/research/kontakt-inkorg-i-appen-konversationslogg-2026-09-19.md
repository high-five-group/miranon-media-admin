---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: draft
---

# Kontakt-inkorg i appen — konversationslogg per person, branschmönster och byggordning

> **Uppdrag:** Session 128, avgränsat research-pass. Frågan: hur bygger
> branschledande CRM-/supportverktyg en inkorg där inkommande kontakt loggas
> på rätt person — och vilken modell bör Miranon Media lägga, i vilka steg?
> Kört som `research-pass`-agent i worktreen
> `.claude/worktrees/s128-docs` (gren `docs/s128-fodelse`). Ingen prod-Airtable-
> åtkomst (subagent-spärren i `CLAUDE.md` § Verktygsfakta); ingen Resend-API-
> eller Resend-MCP-anrop — endast dokumentation.
>
> **ÄNDRAD PREMISS mitt i passet (orkestrerar-meddelande, 2026-09-19):**
> Marcus avvisade tre-stegs-trappans steg 1 som ett eget mål — ordagrant:
> *"Vi måste ju lägga grunden för ett branschledande CRM, appen måste ha koll
> på allt. Ingen mening med att bara ha steg 1 i appen, då kan det lika gärna
> vara som det är idag."* Uppdraget justerades till: målbilden är en
> FULLSTÄNDIG tvåvägs-konversationslogg som CRM-grund (trappan är byggordning,
> inte tre separata leveranser), plus tre nya delfrågor — Lottas mail UTANFÖR
> appen (M365-fångst), en prövning av en ny fasningshypotes (datagrund dag 1,
> inkorgs-UI separat), och ett eget "CRM-grunden"-avsnitt om den enhetliga
> tidslinje-modellen. Dessa är inbakade nedan (§ D–F) snarare än tilläggda på
> slutet, eftersom de omformar hela syntesen.

## Kort svar

**Branschledarna delar EN modell trots olika UI: en tråd (status
öppen/väntar/stängd) innehåller meddelanden (riktning in/ut, rå
avsändaradress bevarad), matchas mot en kontakt via normaliserad e-post med
AUTOSKAPANDE av ny kontakt vid miss (Help Scout, Chatwoot, Front) eller en
uttrycklig karantän-kö för misstänkt skräp (Zendesks "Suspended Tickets").
Miranon Medias bas har redan halva denna modell byggd och aldrig kopplad in
— `Kontaktlogg (rådata)` (`tblzg4DsRzCCXH8Vy`) bär `Riktning` (In/Ut),
`Källa`, rå e-post, `Person`-länk och en vilande `Touchpoint trigger`-formel
sedan minst mars 2026, men ingen automation triggar på tabellen (bekräftat
`docs/research/miranon-se-intagskedjan-idag-2026-09-19.md` § 1.3).**

**Meddelandena ska bo i Supabase, inte Airtable** — exakt ADR-110s
resonemang (fritext + bilagor + volym + 5 anrop/s-taket), inte ett nytt
avvägande. **Trappans snitt håller EFTER omprövning, men bara om
"steg 1" omdefinieras**: inte "inkorgen syns i appen" utan "DATAGRUNDEN
(tråd + meddelande + matchning, i den modell som ska bära v2/v3 utan
ombyggnad) lagras från dag 1 — samtidigt som formuläret fortsätter mejla
Lotta precis som i dag." Det håller Marcus rätt: appen "har koll på allt"
från dag ett även om GRÄNSSNITTET kommer senare, eftersom inget kontakt-
tillfälle går förlorat och ingenting behöver rivas när UI:t byggs. **Den
öppna kanten är INTE trådning av Lottas svar** (hon svarar utanför appen,
inget bryts av det — se § E) **utan att en osynlig datagrund utan UI riskerar
att stå overifierad i veckor.** Mildringen: bygg matchningslogiken och en
minimal, oskylten läsvy (staging-testad) i SAMMA skiva som skrivvägen, inte
en QA-blind rörledning.

**Att fånga Lottas mail UTANFÖR appen (hennes M365-inkorg) har tre etablerade
mönster — ingen av dem är gratis:** BCC/vidarebefordringsadress (HubSpot,
Pipedrive — manuell vana per mejl, skört för en icke-teknisk ensam
användare), eller full Microsoft Graph-mailbox-synk (komplett men kräver
Azure-appregistrering + admin-samtycke, en STÖRRE insats). Den
BCC/vidarebefordrings-adressen kan dock byggas OVANPÅ samma Resend inbound-
infrastruktur formuläret redan behöver — se § F för rekommendationen.

**Resend inbound är verifierat GA sedan november 2025**, webhook-baserat,
INGET eget tråd-/inbox-objekt (trådning är appens eget ansvar via
In-Reply-To/References), 30 dagars lagring hos Resend oavsett plan, och
kräver ett MX-record med lägst prioritet på en SUBDOMÄN för att inte röra
miranon.se:s Microsoft 365-MX.

## Vad jag redan hade innan jag sökte

**Läst före första sökning:** `docs/research/`-katalogen (grep på
kontakt/inkorg/mail/resend/lead/touchpoint/person/crm/konversa — sju
träffar, ingen täcker denna fråga direkt men flera är angränsande och lästa:
`touchpoint-kurs-och-ort-2026-08-10.md`, `utskickspublikens-leads-och-
namnlosa-2026-08-17.md`, `mallvaljare-och-mall-editor-resend-2026-09-18.md`,
`utskicksbekraftelse-inkorg-auto-dismiss-vs-persistent-2026-09-02.md`),
`docs/decisions/` (grepp på ADR-063/067/103/110/048),
`tasks/sessions/2026-09-19-session-128.md` Del 1–3 (uppdragets bakgrund),
och framför allt **`docs/research/miranon-se-intagskedjan-idag-2026-09-19.md`**
i sin helhet — samma sessions systerpass, klart innan detta startade.

**Vad som redan var avgjort och INTE ska omprövas här:**

- **ADR-110** (Accepted, 2026-08-11): aktivitetsloggen (`activity_log`)
  lagras i Supabase, inte Airtable — exakt samma tre skäl (append-only-
  volym mot radtaket, 5 anrop/s delat tak, "ingen Airtable-mellanstation som
  ändå måste migreras") som gäller för meddelanden, fast starkare (fritext +
  bilagor väger tyngre än strukturerade statement-rader). Jag har INTE
  omprövat om Supabase är rätt för `activity_log` — jag har TILLÄMPAT samma
  resonemang på en ny datatyp och verifierat att det håller (§ C).
- **ADR-063**: Airtable-basens BEFINTLIGA data maximeras i basen, resolution
  sker där. `activity_log` är en bokförd, medveten avgränsning från den
  regeln för NY systemgenererad telemetri — meddelanden är samma klass av
  avgränsning, inte ett nytt undantag som behöver eget beslut.
- **ADR-103**: en ny yta i admin-appen (inkorgen) går genom repots
  tvåfas-prototyp (divergens → konvergens). Jag har inte designat UI:t här —
  det är prototyp-passets jobb, inte research-passets.

**Vad jag hittade som INTE stod i uppdragets bakgrund och som ändrar
syntesen väsentligt** — detta är det starkaste enskilda fyndet i hela
passet:

**Basen bär redan en nästan färdig datamodell för exakt denna feature, sedan
minst mars 2026, aldrig kopplad in.** `docs/reference/schema_reference.md`
rad 505–530 (frusen ögonblicksbild, se dess egen banderoll — men
tabellstrukturen är strukturell, osannolikt ändrad) beskriver
`Kontaktlogg (rådata)` (`tblzg4DsRzCCXH8Vy`):

| Fält | Typ | Betydelse för denna fråga |
|---|---|---|
| `Källa` | singleSelect (Kontaktformulär, Direkt mail) | Kanal — exakt vad § B kräver som golv |
| `Riktning` | singleSelect (**In, Ut**) | Redan tvåvägs-modellerat — precis den axel som saknas i "bara ta emot"-varianten |
| `Från e-post` / `Till e-post` | email | Rå avsändar-/mottagaradress |
| `Ämne` / `Body` / `Bilagor` | text/text/attachments | Innehåll + filer |
| `Person` | multipleRecordLinks → Personer, `prefersSingle=true` | Matchning, samma länkform som `Anmälningar.Person`/`Touchpoints.Person` |
| `Touchpoint trigger` | formula: `AND(Riktning="In", Källa="Kontaktformulär", LEN(Body)>30)` | **Ett inbyggt spam-/brusfilter** — ett kort "tack"-svar (<30 tecken) triggar aldrig en Touchpoint |
| `Touchpoint skapad` | checkbox | Avsedd att sättas av en automation som aldrig byggdes |
| `Länkad touchpoint` | multipleRecordLinks → Touchpoints | Länken formeln pekar mot |

Källa: [`schema_reference.md`](../reference/schema_reference.md) rad
505–530, korsverifierad mot [`data-model.md`](../reference/data-model.md)
rad 95 (tabellen finns, 20 rader idag mot 15 i mars-ögonblicksbilden — en
tillväxt som är förenlig med att formuläret fortsatt postar dit via en
odokumenterad väg, se intagskedje-passets § 1.3/§ 6) och rad 1311
("CRM/kontakt: Touchpoints, Kontaktlogg (rådata)").

**Men ingen automation triggar på tabellen** — intagskedje-passet
verifierade detta genom att läsa samtliga 11 automationers trigger-tabeller
(`miranon-se-intagskedjan-idag-2026-09-19.md` § 1.3, § 3). Formeln och
checkboxen är **designad men död**: exakt den modell branschledarna
(§ A–B) konvergerat mot fanns redan i Roger/Lottas bas innan någon i det
här projektet undersökte frågan, den blev bara aldrig kopplad till en
körande automation. Detta pass rekommenderar INTE att återuppliva
`Kontaktlogg (rådata)` (§ C förklarar varför — samma ADR-110-resonemang
gäller), men modellens FORM (riktning, rå adress bevarad, person-länk,
brusfilter) är ett verifierat, redan-Marcus/Lotta-godkänt designmönster att
återanvända i den nya Supabase-tabellen.

**Åldrat att flagga:** `schema_reference.md` är frusen mars 2026 och inte
auktoritativ för fältdata (`data-model.md` är det, `ADR-100` §1). Jag har
därför INTE antagit att `Kontaktlogg (rådata)`s fält ser likadana ut idag —
bara att tabellen EXISTERAR och växer (bekräftat via `data-model.md`s
radräkning, som är nyare). Exakt fältform idag är **MÅSTE VERIFIERAS**
(§ Vad jag inte kunde belägga).

**Kod-prior-art i appen (grep, inte gissat):**

- `src/routes/_authenticated/mer/maillogg.tsx` + `src/components/maillog/
  MailLog.tsx` — en fristående lista över UTSKICKADE mail (`get-mail-log`-EF
  mot Airtable-tabellen `Utskickslogg`, `tblIesjbuSWNp6oxK`), global, inte
  per person. Bra UI-precedent för en listvy, men **enkelriktad** (bara
  "ut") och inte tråd-baserad.
- `src/components/persons/PersonDetail.tsx` har INGEN enhetlig polymorf
  tidslinje idag — den har separata, typade sektioner (`proto-d-kontakt`,
  `proto-d-nulage`, `proto-d-strom` [kurshistorik/Deltaganden, INTE en
  generisk aktivitetsström trots namnet — `PersonHistoryEntrySchema`
  (`src/domain/schemas/PersonDetail.schema.ts` rad 10–19) är
  Deltaganden-formad: `kursnamn`, `session`, `narvaro`], `proto-d-
  eventhistorik`, `proto-d-hamtningar` [riktiga Touchpoint-poster],
  `proto-d-motiveringar`). **En sann HubSpot-stil enhetlig tidslinje finns
  alltså inte i appen ännu** — det är en aspiration § D kan peka mot, inte
  ett befintligt widget att bara utöka.
- `supabase/migrations/20260811211759_create_activity_log.sql` +
  `src/domain/schemas/ActivityStatement.schema.ts` — **konkret, kodläst
  begränsning som formar hela § D:** `ActivityActorAccountSchema.name` är
  `z.string().uuid()` bundet till `session.user.id` (kommentar rad ~93–99:
  "Supabase auth-användarens ID... MEDVETET inte `mbox`"). `activity_log`s
  xAPI-aktör MÅSTE vara en INLOGGAD STAFF-användare (Lotta/Roger/Marcus) —
  en anonym formulärinskickare kan strukturellt INTE vara `actor` i ett
  statement som skrivs enligt dagens schema. Detta är den enskilt
  viktigaste kodgrundade begränsningen för § D:s "tredje parallella
  modell"-fråga.
- `PERSON_ID_EXTENSION_IRI` (samma fil, `TASK-201.12`) — redan byggd
  kapacitet att länka en `activity_log`-rad till en person. Återanvändbar.
- `supabase/functions/_shared/send-action-email.ts` +
  `send-action-email/index.ts` § `resolveAttachments` — befintligt,
  skarpbevisat mönster för bilage-hantering (Storage-path
  `${eventId}/${lagringsnyckel}`, fail-closed ägarskaps-kontroll). Formen
  (inte koden) är återanvändbar för meddelande-bilagor.

---

## Del A — Fem+ precedenter, primärkällor

Samtliga hämtade 2026-09-19. Format per verktyg: objekt, matchning,
status-/ägarmodell, tidslinje.

### A1. HubSpot — Conversations API + Engagements/Timeline

**Objekt:** `Inbox → Channel → Channel Account → Thread → Message`.
"Threads are... a group of related messages that make up a conversation in
the inbox." Trådstatus är binärt: `OPEN`/`CLOSED` (fält `status`), plus
`archived` (boolean) och `associatedContactId`.

**Matchning:** trådar kopplas till en kontakt via `associatedContactId`;
avsändare/mottagare i meddelanden bär prefixade aktör-ID:n (`V-` =
kontakt/besökare, `E-` = e-postadress, `A-` = HubSpot-användare, `S-` =
system). Dokumentationen specificerar INTE explicit om en okänd avsändare
autoskapar en ny kontakt (flaggat som obelagt nedan) — men HubSpots separata
**Engagements API** (unified timeline-objektet) bekräftar mönstret för den
BREDARE frågan: EMAIL/CALL/MEETING/NOTE/TASK är samtliga
"engagement"-undertyper i SAMMA objektmodell, sökbara i en gemensam
`/crm/v3/objects/engagements/search`-yta, var och en associerad till
kontakt/företag/deal via ett separat associations-API. **Detta är den
tydligaste primärkälle-bekräftelsen på "en gemensam tidslinje-modell, flera
händelsetyper"** som § D bygger vidare på.

**Källor:** [Conversations API-referens](https://developers.hubspot.com/docs/api-reference/legacy/conversations/guide),
[Create an engagement](https://developers.hubspot.com/docs/api-reference/legacy/crm/activities/engagements/post-engagements-v1-engagements).

### A2. Front — Conversations, Contacts, Handles

**Objekt:** "A conversation is a unique thread of messages." En konversation
kan synas i flera inboxar men har alltid EN `recipient`. Meddelanden och
kommentarer länkar tillbaka via `_links.related.messages`.

**Matchning:** Front har inget "e-post"-fält direkt på Contact — i stället
en lista av **`handles`** (email, phone, twitter, facebook, intercom,
smooch, custom), var och en med en `source`. "Each pair handle/source is
unique." En kontakt kan alltså ha FLERA e-postadresser (flera handles med
`source=email`), vilket är exakt uppdragets delfråga "flera adresser per
person" — Fronts svar är: en handle per adress, alla på samma kontakt-ID.
Alias-formen `alt:{source}:{handle}` gör en handle direkt adresserbar utan
extra uppslag.

**Status/ägare:** `status`/`status_category` (t.ex. `archived`), `assignee`
(teammedlem), `tags`.

**Källor:** [Conversations](https://dev.frontapp.com/reference/conversations),
[Contacts](https://dev.frontapp.com/reference/contacts).

### A3. Help Scout — Conversations, Threads, Customer

**Objekt:** `Conversation` (fält `type`: email/chat/phone, `status`:
active/pending/closed/spam, `customer`, `owner`, `mailbox`) innehåller ett
eller flera `threads` (typ: `customer`/`reply`/`note`/`chat`/`phone`,
minst en krävs).

**Matchning — den mest EXPLICITA primärkällan i hela passet:** *"If a
customer with this email doesn't exist yet, the API will create a new
customer — using all the optional fields."* Matchar man via existerande
ID/e-post ignoreras övriga fält. **Detta är facit på "okänd avsändare → ny
kontakt eller omatchad-kö"-frågan för Help Scout specifikt: autoskapande,
ingen karantän.** Kontrasten mot Zendesk (§ A5) är skarp och avsiktlig att
lyfta fram.

**Källor:** [Conversation Object](https://developer.helpscout.com/webhooks/objects/conversation/),
[Create Conversation](https://developer.helpscout.com/mailbox-api/endpoints/conversations/create/).

### A4. Intercom — Conversations, Contacts (lead/user), Conversation Parts

**Objekt:** en `Conversation` har `contacts` ("users or leads"), en lista av
**Conversation Parts** (max 500) som utgör meddelandena, och ett `open`-
booleanfält plus tri-state `state`: `open`/`closed`/`snoozed`.

**Matchning:** dokumentationsutdraget jag läste specificerar INTE
mekaniken för hur en anonym besökare blir en "lead"-kontakt (flaggat som
obelagt) — men objektmodellen bekräftar SJÄLVA distinktionen "lead" (okänd,
ingen e-post krävd) kontra "user" (identifierad), vilket är en tredje
variant på "okänd avsändare"-frågan: varken autoskapa-som-fullständig-
kontakt (Help Scout) eller karantän (Zendesk) utan en MELLANNIVÅ (lead) som
sedan kan höjas till user. Detta mönster är EXAKT vad `Hämtade
erbjudanden`→A4→namnlös-Person redan gör i Miranon Medias bas idag (§ Vad
jag redan hade) — inte en ny idé att importera, en bekräftelse på ett
mönster basen redan använder.

**Källa:** [Conversation object](https://developers.intercom.com/docs/references/rest-api/api.intercom.io/conversations/conversation).

### A5. Zendesk — Tickets, Requester, Suspended Tickets

**Objekt:** `Ticket` med `requester` (e-poststräng, användar-ID, eller
`{name, email}`-objekt), `status` (`new`/`open`/`pending`/`hold`/`solved`/
`closed`), kommentarer (`comment`-fältet sätter FÖRSTA kommentaren —
"do not use the `description` property... for reading purposes only").

**Matchning:** *"if the user doesn't exist, they may be created
automatically depending on account settings"* — konfigurerbart, inte
tvingat autoskapande.

**Skräpmodellen — den starkaste primärkällan för req #7:** Zendesk har en
UTTRYCKLIG **Suspended Tickets**-kö, skild från vanliga tickets. *"Tickets
can be suspended for several reasons, including: the email is rated as
spam..., the sender is not allowed to create or update a ticket..., the
sender is not a person, or the email failed DMARC authentication."*
Suspenderade ärenden **auto-raderas efter 14 dagar** om ingen granskar dem;
en människa "recover"-ar en legitim avsändare manuellt, vilket "informs the
spam filter that the sender is legitimate." **Detta är precis
karantän-mönstret uppdraget efterfrågar** — kontrasten mot Help Scouts
autoskapande är den tydligaste branschskillnaden i hela undersökningen: en
supportinkorg med hög volym (Zendesk) kvarantänerar av nödvändighet; en
lättare inkorg (Help Scout) autoskapar och förlitar sig på att volymen är
låg nog att en människa ändå ser skräpet.

**Källor:** [Tickets API](https://developer.zendesk.com/api-reference/ticketing/tickets/tickets/),
[Understanding suspended tickets and spam](https://support.zendesk.com/hc/en-us/articles/4408889141146-Understanding-suspended-tickets-and-spam),
[Causes for ticket suspension](https://support.zendesk.com/hc/en-us/articles/4408828416282-Causes-for-ticket-suspension).

### A6. Chatwoot (öppen källkod) — Contact, ContactInbox, Conversation, Message

Enda precedenten där jag läste FAKTISK KÄLLKOD, inte bara API-dokumentation
— starkare bevisnivå för just matchningslogiken.

**Objekt:** `Contact` ←→ `ContactInbox` (join-tabell: kontakt × inbox ×
`source_id`) ←→ `Conversation` (`status` enum: `open`(0)/`resolved`(1)/
`pending`(2)/`snoozed`(3)) → `Message`.

**Matchning, verbatim ur källkoden** (`app/models/contact.rb`,
`raw.githubusercontent.com/chatwoot/chatwoot/develop/app/models/contact.rb`,
hämtad 2026-09-19):

```ruby
def self.from_email(email)
  find_by(email: email&.downcase)
end
```

Case-okänslig, unik per konto (`uniqueness: { scope: [:account_id],
case_sensitive: false }`). **Det här är byggstenen för § B:s golv-krav
"e-post-normalisering" — inte en tolkning, en direkt kodrad.**

**Trådning av e-postsvar — den mest relevanta enskilda källan för § E/F:s
fasningsfråga.** Ur DeepWiki:s kodanalys (sekundärkälla, men kryssverifierad
mot GitHub-issue #15869/#14993/#885 i samma sökning): Chatwoot matchar ett
inkommande svar mot en BEFINTLIG konversation via
`In-Reply-To`/`References`-headers (`Imap::ImapMailbox#find_or_create_
conversation`). **Känd, dokumenterad begränsning:** saknas matchande
`In-Reply-To`/`References` (t.ex. ett mejlprogram som inte sätter dem
korrekt, eller ett ämne som ändrats) skapar Chatwoot en NY konversation —
**även för samma avsändare och samma ämne**. Detta är inte ett Chatwoot-fel
att undvika, det är branschens accepterade gräns: trådning kräver
RFC 2822-korrekta headers, och ingen leverantör (inte ens Gmail, enligt
samma källor) trådar tillförlitligt utan dem.

**Källor:** [`contact.rb`](https://github.com/chatwoot/chatwoot/blob/develop/app/models/contact.rb),
[`contact_inbox.rb`](https://github.com/chatwoot/chatwoot/blob/develop/app/models/contact_inbox.rb),
[`conversation.rb`](https://github.com/chatwoot/chatwoot/blob/develop/app/models/conversation.rb),
[Conversation Continuity docs](https://developers.chatwoot.com/self-hosted/configuration/features/email-channel/conversation-continuity),
GitHub-issues #15869, #14993, #885 (sekundär, använd för att kryssverifiera
DeepWiki-sammanfattningen, inte som primärkälla i sig).

### A7. Lätt-CRM — Attio (assert-mönstret) och Pipedrive (Mailbox + Activities)

**Attio** löser matchning genom ett **`assert`-API**: skicka ett
`matching_attribute` (typiskt e-post) + värde — hittas en post uppdateras
den, annars skapas en ny. *"The create endpoint will throw on conflicts of
unique attributes... If you would prefer to update person records on
conflicts, you should use the Assert person record endpoint instead."*
Detta är samma princip som Help Scouts auto-skapande (§ A3) men uttryckt
som en explicit, idempotent UPSERT-primitiv — arkitektoniskt renare att
efterlikna i en EF än "sök sedan skapa" (samma poäng ADR-014s
idempotens-mönster redan gör i Miranon Medias egen kod, se
intagskedje-passet § 3).

**Pipedrive** har en **Smart BCC-adress** (kopplas manuellt in i mejl-
klientens BCC/vidarebefordran) som loggar mejl mot rätt person/deal —
byggd på att avsändarens e-post matchas mot en befintlig Person. Viktig
gräns, direkt relevant för § F: *"Any replies received from your customers
will need to be forwarded to that same universal Bcc address in order to
appear in your Pipedrive inbox"* — mekanismen är **manuell, per mejl**, inte
automatisk mailbox-synk. Pipedrives `Activities`-API loggar händelser
(mejl, samtal, möten, uppgifter) mot Person/Organization/Deal och bygger en
delad tidslinje — samma "en händelsemodell, flera typer"-mönster som
HubSpots Engagements (§ A1, § D).

**Källor:** [Create a person Record](https://docs.attio.com/rest-api/endpoint-reference/people/create-a-person-record),
[A Guide to Smart BCC Emailing](https://support.pipedrive.com/en/article/smart-email-bcc),
[Activities](https://support.pipedrive.com/en/article/activities).

---

## Del B — Syntes: minsta gemensamma datamodell

**Samtliga sju precedenter delar denna kärna**, oavsett om de kallar det
tråd/konversation/ticket:

| Koncept | Namn hos precedenterna | Miranon Medias motsvarighet (rekommenderad) |
|---|---|---|
| Tråd | Thread (HubSpot/Zendesk-familjen kallar det Ticket), Conversation | Ny tabell, `contact_threads` |
| Meddelande, skilt från tråden | Message, Conversation Part, Thread (Help Scout döper om) | Ny tabell, `contact_messages` |
| Riktning | Implicit i thread `type`/`customer` vs `reply` | Explicit `direction: 'in'\|'ut'` — Miranon Medias EGEN bas har redan denna kolumn i `Kontaktlogg (rådata).Riktning` |
| Kanal | Channel (HubSpot), källa (Help Scout `type`) | `channel: 'kontaktformular'\|'mail'` |
| Kontakt-matchning | e-post, normaliserad, case-okänslig | Samma — Chatwoots `from_email` är facit-koden |
| Rå avsändaradress bevarad efter matchning | Handle (Front), `email` på Person (Help Scout autoskapar FRÅN den) | **Golv, inte tillval** — se motivering nedan |
| Status | open/closed (binärt: HubSpot, Chatwoot 4-värde, Zendesk 6-värde, Intercom 3-värde) | `öppen`/`besvarad`/`stängd` — tre räcker för EN användare (Lotta), sex är Zendesk-skala överkurs |

### Golv redan i v1 — annars målar sig lösningen in

1. **Tråd-ID från dag ett**, även om v1 bara har EN tråd per person (ett
   inkommande meddelande). Skälet är inte spekulativt: samtliga sju
   precedenter modellerar tråden separat från meddelandet REDAN i sin
   FÖRSTA version — ingen av dem har en historik av att ha börjat utan och
   migrerat till. Att hoppa över tråd-konceptet "tills det behövs" är den
   vanligaste väg in i modelleringsfelet nedan (#1).
2. **Meddelande skilt från tråd** — annars kan ett svar (v2/v3) inte
   representeras utan schemaändring.
3. **Riktning (in/ut) på meddelandet, inte på tråden.** En tråd kan innehålla
   BÅDA riktningarna; att sätta riktning på tråden tvingar en 1:1-modell som
   bryter så fort ett svar loggas.
4. **Kanal på meddelandet.** Miranon Media har redan två kanaler
   (kontaktformulär, framtida "direkt mail" — samma två värden
   `Kontaktlogg (rådata).Källa` redan bär).
5. **Rå avsändaradress SPARAD ÄVEN EFTER matchning.** Detta är golvet som
   lättast missas: när ett meddelande matchas mot en Person frestas man att
   bara spara `person_id` och släppa e-postadressen ("den finns ju redan på
   Personen"). Men Personens e-postadress kan ÄNDRAS senare, eller personen
   kan ha FLERA adresser (Front: handles) — utan den råa adressen bevarad
   på MEDDELANDET blir det omöjligt att i efterhand se exakt vilken adress
   avsändaren använde DEN GÅNGEN. `Kontaktlogg (rådata).Från e-post`
   bevisar att Miranon Medias egen tidigare design redan visste detta.

### De vanligaste modelleringsfelen, sett över precedenterna

1. **Meddelanden direkt på personen, utan tråd.** Symptomet syns först när
   ett andra meddelande kommer — då finns ingen plats att gruppera dem, och
   en efterhandsmigrering till tråd-modell kräver att gissa vilka
   meddelanden hörde ihop (exakt det Chatwoots kända begränsning, § A6,
   visar är svårt även med headers i handen).
2. **Status på meddelandet i stället för tråden.** "Öppen"/"besvarad" är en
   egenskap hos KONVERSATIONEN, inte hos ett enskilt inlägg i den — annars
   blir frågan "är tråden öppen?" en aggregering över N rader i stället för
   en kolumn-läsning, och en agent som markerar "besvarad" måste veta VILKET
   meddelande som bär sanningen.
3. **Dedupe på visningsnamn.** Ingen av de sju precedenterna matchar på
   namn — samtliga matchar på e-post (normaliserad) eller ett kanal-
   specifikt handle/source_id. Namn används ALDRIG som matchningsnyckel, av
   samma skäl `data-model.md` fälla 21 redan dokumenterar för Miranon Medias
   egen bas (två personer kan heta likadant, en person kan stava sitt namn
   olika mellan formulär).
4. **(Sett i Miranon Medias EGEN historik, ej i precedenterna — men värt att
   lyfta här eftersom det är exakt denna felklass):** ett fungerande
   matchnings-facit (`Kontaktlogg (rådata)`) som aldrig kopplas till en
   körande process. Modellen är inte det svåra — INKOPPLINGEN är.

---

## Del C — Var ska meddelandena bo: Airtable eller Supabase

**Dom: Supabase, med `person_id` som referens till Airtables record-ID
(text, inte foreign key) tills Fas E.** Detta är INTE ett nytt avvägande —
det är ADR-110s exakta resonemang tillämpat på en STARKARE variant av samma
problem.

| Faktor | ADR-110 (`activity_log`) | Meddelanden (denna fråga) | Slutsats |
|---|---|---|---|
| Volym | 20 000–70 000 rader/år, strukturerade statements | Lägre volym (HYPOTES: några/vecka), men VARJE rad bär fritext + ev. bilagor | Samma riktning, starkare skäl |
| Airtable-radtak | Strukturell risk mot befintlig data | Samma risk, plus attachment-fält blåser upp bas-storlek fortare än text | Samma riktning, starkare skäl |
| 5 anrop/s delat tak | Ett API-anrop per statement i EF:ens efterspel | Ett anrop per inkommande OCH per utgående meddelande — vid bulk-svar (framtida "svep" för mail, jfr `utskicksytan-karta-och-historik-2026-09-18.md`) multipliceras detta | Samma riktning, starkare skäl |
| "Aldrig två sanningar" | `activity_log` har ALDRIG legat i Airtable — inget att synka | `Kontaktlogg (rådata)` EXISTERAR redan i Airtable med snarlik form (§ Vad jag redan hade) — en RISK att av misstag bygga en andra, konkurrerande sanning | **Explicit åtgärd krävs**, se nedan |
| Fas E | `activity_log` blir FÖRSTA Postgres-tabellen, mönstret upprepas rakt av vid migrering | Samma — meddelande-tabellerna överlever Fas E OFÖRÄNDRADE (redan i målarkitekturen) | Samma riktning |
| Persontidslinjen i appen | Läses via `get-activity-log`-EF, `PERSON_ID_EXTENSION_IRI` | Läses via en ny, analog EF mot de nya tabellerna | Samma mönster, ny EF |

**Den explicita åtgärden "aldrig två sanningar" kräver:** när den nya
Supabase-baserade skrivvägen (EF via Resend inbound-webhook) tas i drift,
**sluta skriva nya rader till `Kontaktlogg (rådata)`** (oavsett vilken
odokumenterad mekanism som gör det idag — se § Vad jag inte kunde belägga
post 1). De befintliga 15–20 raderna lämnas som arkivhistorik, orörda — de
raderas inte (samma "radera aldrig namnlösa Personer"-disciplin
`data-model.md` rad 2203 redan etablerat för näraliggande data), men de
matas inte längre. Att låta BÅDA vägarna leva parallellt (Elfsight→
Kontaktlogg OCH EF→Supabase) är precis den "två sanningar"-risk `ADR-100`
finns för att förhindra.

**Vad som INTE flyttar till Supabase:** person-IDENTITETEN. Så länge
Airtable är datakälla (`ADR-063`) är `Personer`-tabellen fortsatt facit för
VEM en person är. Meddelande-tabellerna refererar `person_id` som en
TEXTSTRÄNG (Airtables record-ID, `recXXXXXXXXXXXXXX`), inte en Postgres
foreign key mot en tabell som inte finns än — exakt samma
adapter-medvetna form `activity_log`s `object_id`/`context.extensions`
redan använder för andra Airtable-refererade entiteter.

---

## Del D — CRM-grunden: en gemensam tidslinje, eller en tredje modell?

**Frågan orkestreraren ställde:** hur förhåller sig ett nytt
meddelande-koncept till `activity_log` (ADR-110) och `Touchpoints`, så att
inkorgen inte blir en tredje parallell händelsemodell?

**Svaret, grundat i kod (inte bara princip):** de tre lagren löser OLIKA
problem och ska förbli tre, men KOPPLADE — inte konkurrerande, och inte en
tvingad sammanslagning. Att tvinga in meddelanden i `activity_log` FUNGERAR
INTE rakt av, av ett konkret, kodverifierat skäl:

**`activity_log`s xAPI-aktör MÅSTE vara en inloggad Supabase auth-
användare.** `ActivityActorAccountSchema.name: z.string().uuid()` är bundet
till `session.user.id` (`ActivityStatement.schema.ts`, kommentar: *"Supabase
auth-användarens ID... MEDVETET inte `mbox`"*). Ett INKOMMANDE meddelande
från en anonym formulärinskickare har INGEN session — det finns ingen
giltig `actor` för ett sådant statement enligt dagens schema. Att tvinga in
det (t.ex. med en påhittad "system"-UUID) vore att bryta schemats egen,
medvetna disciplin ("aldrig ett tomt/påhittat värde", samma kommentar-stil
som `PERSON_ID_EXTENSION_IRI`s egen doc).

**Rekommenderad tredelning — samma mönster HubSpot redan visar
(§ A1: Engagements är en union-typ, men EMAIL-typens rika innehåll bor i sin
egen struktur, inte pressad in i NOTE/TASK-formen):**

1. **`contact_messages`/`contact_threads` (ny, Supabase) — sanningskällan
   för INNEHÅLLET.** Vad sades, av vem, när, med vilka bilagor. Detta är
   analogt med HubSpots EMAIL-engagement eller Chatwoots `Message`-tabell —
   den rika, kanal-specifika strukturen.
2. **`activity_log` (befintlig) — sanningskällan för STAFF-HANDLINGAR på en
   tråd.** Lotta öppnar tråden, loggar ett svar, markerar den besvarad —
   VARJE sådan handling HAR en naturlig staff-aktör och passar
   xAPI-modellen perfekt (verb: "läste", "svarade", "stängde"; objekt:
   IRI som pekar på tråden; `PERSON_ID_EXTENSION_IRI` sätts till personens
   Airtable-ID — kapaciteten finns redan). Detta är exakt samma nivå som
   `activity_log`s existerande ~11 mutationstyper (betalning, anmälan,
   närvaro...) — alla är STAFF-INITIERADE mutationer, ett mönster
   meddelande-HANDLINGAR (inte meddelande-MOTTAGANDET) passar i utan att
   töja schemat.
3. **`Touchpoints` (befintlig, Airtable) — RÖRS INTE av varje meddelande.**
   Att skriva en Touchpoint per meddelande skulle (a) återupprepa exakt
   ADR-110s rate-limit/volym-argument mot Airtable, och (b) skapa en TREDJE
   sanning om "vad hände" utöver `contact_messages` och `activity_log`.
   **Enda rekommenderade kopplingen:** när ett meddelande leder till att en
   HELT NY Person skapas i Airtable (samma "ny lead"-gren A4 redan kör för
   `Hämtade erbjudanden`, § A4/Intercoms lead-mönster), skapas EN Touchpoint
   ("Kontaktat via formulär" — ny option, samma tabell, samma mönster som
   "Angett e-post för erbjudande"). Detta bevarar Touchpoints roll som
   CRM-relationssignal för framtida automationer/rapporter UTAN att göra
   den till en meddelandelogg.

**Läsningen på personens sida i appen** blir därför en **UNION vid
läs-tillfället**, inte en fysisk sammanslagen tabell: en ny EF (analog
`get-mail-log`/`get-activity-log`) hämtar `contact_messages` för personen
och kan slås samman med `activity_log`-raderna i UI-lagret för en
kronologisk vy — precis som HubSpots Timeline-UI frågar flera
engagement-typer och visar dem interfolierade utan att de är samma
databasrad.

**Ärligt om nulägets UI:** `PersonDetail.tsx` har i dag INGEN sann
polymorf tidslinje att utöka — sektionerna (`proto-d-strom`,
`proto-d-hamtningar`, `proto-d-motiveringar`) är var och en typ-specifika,
inte en generisk feed. En fullt enhetlig HubSpot-stil tidslinje är alltså
en FRAMTIDA UI-investering (eget backlog-kort), inte något v1 av inkorgen
kan låna färdigt. v1:s enklaste, minst spekulativa väg är en EGEN sektion
("Meddelanden", samma mönster som `proto-d-hamtningar`), inte ett försök
att bygga den enhetliga tidslinjen samtidigt.

---

## Del E — Trappan omprövad: datagrund dag 1, UI separat

**Orkestrerarens fasningshypotes:** DATAGRUNDEN (tråd + meddelande +
matchning, i SLUTLIG modell) tas i bruk redan den dag nya sajten lanseras
— formuläret mejlar Lotta som i dag OCH lagrar meddelandet — medan
inkorgens GRÄNSSNITT släpps separat, senare, när hela tvåvägs-funktionen
är klar.

**Prövning: håller det?**

**Ja, strukturellt — ingen av precedenterna motsäger detta, och det
undviker ADR-110-klassens misstag (en mellanstation som ändå måste
migreras).** Att lagra i den SLUTLIGA modellen (tråd + meddelande +
riktning + kanal, § B:s golv) från dag ett betyder att v2 (svar från appen)
och v3 (inkommande svar fångas) är TILLÄGG av nya rader i samma tabeller,
aldrig en schemamigrering. Detta är kärnpoängen i "trappan är byggordning,
inte tre separata leveranser."

**Nej, inte problemfritt — men INTE av det skäl orkestreraren själv
misstänkte (trådning).** Trådning av Lottas svar är INTE en risk i denna
fasning: så länge Lotta svarar UTANFÖR appen (sitt vanliga M365-klientflöde,
oförändrat) finns inget att tråda FÖRRÄN v2/v3 byggs — det uppstår inget
"halvfärdigt", ospårat tillstånd, för det finns inget UI som LOVAR att visa
svaret. Den verkliga risken är en ANNAN:

1. **En osynlig rörledning är en oövervakad rörledning.** Skrivvägen
   (Resend-webhook → EF → matchning → `contact_threads`/`contact_messages`)
   kommer att köras i produktion i veckor eller månader UTAN att någon
   människa tittar på resultatet (ingen UI). Matchningslogikens fel — fel
   person kopplad, dubbletter, ett brustet Resend-webhook-kontrakt — märks
   FÖRST när UI:t byggs, potentiellt på en hög av redan-felaktig historisk
   data. **Mildring: bygg en minimal, oskylten läsväg REDAN i
   datagrund-skivan** — inte den polerade inkorgen, bara en verifikations-
   yta (kan vara lika enkel som ett `SELECT`/en Airtable-liknande rå-tabell
   i en admin-only route, eller helt enkelt manuell staging-granskning per
   `npm run seed:review`-mönstret) — så att matchningslogiken faktiskt
   PRÖVAS mot verklig trafik innan v2/v3 bygger vidare på den.
2. **Formulärets mejl-till-Lotta och den lagrade kopian kan divergera
   tyst.** Om EF:en som lagrar meddelandet kraschar (Resend-webhook timeout,
   matchningsfel, Supabase nere) medan mejlet till Lotta ÄNDÅ går fram
   (två oberoende sändvägar, ingen atomisk garanti mellan dem), uppstår ett
   GAP: Lotta har mejlet, basen har det inte — precis dagens läge, fast nu
   OSYNLIGT eftersom förväntningen är att det ska finnas. **Mildring:
   logga/larma på misslyckad lagring** (samma disciplin som `UTSKICK_SPARR`/
   aktivitetsloggens felhantering redan följer i andra sändvägar), och
   acceptera att mejlet-till-Lotta ÄR facit-vägen om de två divergerar (den
   kan aldrig gå förlorad, den nya lagringen kan i värsta fall missa en
   rad).
3. **"Slutlig modell" är ett löfte, inte en garanti.** Innan v2/v3:s
   faktiska krav är kända i detalj (exakt vilka fält Resend inbound-
   webhooken ger, exakt vilken trådnings-header-form som fungerar
   tillförlitligt, § F) riskerar "slutlig" att visa sig sakna ett fält.
   Detta är inte unikt för denna fasning — det gäller ALL schemadesign i
   förväg — men värt att säga rakt ut i stället för att låtsas att modellen
   är riskfri bara för att den är avsiktligt bred.

**Slutsats på fasningsfrågan:** hypotesen håller, med tillägget att
"datagrund dag 1" måste inkludera en MINIMAL verifikationsväg, inte bara en
skrivväg — annars byts en känd risk (dagens: inget loggas) mot en dold risk
(morgondagens: något loggas fel, ingen ser det).

---

## Del F — Lottas mail utanför appen: BCC, vidarebefordran, eller Microsoft Graph

**Frågan:** appen ska "ha koll på allt" — inklusive mejl Lotta skickar och
tar emot i sin vanliga Microsoft 365-brevlåda, INTE bara det som går genom
det nya kontaktformuläret. Tre etablerade mönster, ingen gratis:

### F1. BCC/vidarebefordringsadress (HubSpot, Pipedrive — § A1, A7)

**Hur det fungerar:** Lotta lägger till en särskild adress
(`logga@<subdomän>`) i BCC-fältet när hon SKICKAR ett mejl, eller
vidarebefordrar ett MOTTAGET mejl dit. HubSpots variant matchar avsändaren
(måste vara samma adress som är inloggad i HubSpot) mot kontakter; Pipedrive
kräver att BÅDA hennes utgående BCC OCH varje mottaget svar vidarebefordras
manuellt dit — *"Any replies received... will need to be forwarded to that
same universal Bcc address."*

**Fördel:** kräver INGEN admin-åtkomst till M365-tenanten, ingen
app-registrering — bara en adress Lotta lär sig använda. Kan byggas
OVANPÅ SAMMA Resend inbound-infrastruktur som formuläret redan behöver
(samma webhook, samma EF, samma matchningslogik — adressen är bara ETT
till mottagarfilter, jfr Resends egen "routing by recipient"-mönster,
§ G).

**Nackdel, allvarlig för Gunilla-principen:** det är en MANUELL VANA, inte
automatik. Missar Lotta BCC:n på ett enda mejl (mänskligt, dagligen,
oundvikligt över tid) är just DET mejlet osynligt för basen — precis den
typ av "appen har inte koll på allt ändå" Marcus explicit ville undvika.
**Detta mönster löser INTE branschledar-ambitionen ensamt** — det är ett
komplement för de mejl Lotta AKTIVT väljer att logga, inte en fullständig
fångst.

### F2. Microsoft Graph API — full mailbox-synk

**Två separata kapaciteter, olika krav:**

- **Läsning (delegerad):** `Mail.Read.Shared`/`Mail.ReadWrite.Shared`
  fungerar för DELEGERAD åtkomst till en delad brevlåda Lotta redan har
  behörighet till — kräver inloggning/OAuth-flöde, ingen tenant-admin-
  åtgärd nödvändigtvis (beror på hur brevlådan delas).
- **Webhook/push (change notifications):** kräver **Application
  Permissions** (inte delegerad) plus **admin-samtycke** — *"webhook
  subscriptions for shared mailboxes are only possible using Application
  Permissions... administrators can configure application access policy
  to limit app access to specific mailboxes."* En prenumeration har
  **max 4230 minuter (~3 dygn) livslängd** och måste förnyas aktivt, annars
  missas ändringar tyst.

**Detta är den enda av de tre vägarna som ger VERKLIG, automatisk,
fullständig fångst** (allt Lotta gör i sin brevlåda, utan att hon ändrar
sin arbetsvana) — och därmed den som faktiskt matchar "ett branschledande
CRM ska ha koll på allt." Men den kräver Azure AD-app-registrering,
admin-samtycke i M365-tenanten (vem administrerar den — Roger? Marcus?
Extern IT? **MÅSTE VERIFIERAS**), och en förnyelsemekanism för
prenumerationen — en STÖRRE, separat teknisk investering än
formulär-fångsten. Detta hör naturligt hemma som en EGEN, senare fas
(v4?), inte något som ska gate:a datagrunden i § E.

### F3. Enkel vidarebefordringsregel i Outlook/M365 (avfärdad, med skäl)

**Varför den INTE är en gångbar väg utan verifiering:** Microsoft ändrade
2021 default-policyn för utgående AUTOMATISK vidarebefordran till externa
adresser till **"Off – Forwarding is disabled"** för nya och de flesta
befintliga tenanter. *"When set to 'Off'... all automatic external email
forwarding is disabled by the policy, which also disables any Inbox rules
or mailbox forwarding that redirects messages to external addresses."* En
regel Lotta ställer in själv i sin Outlook ("vidarebefordra allt från
`kontakt@miranon.se` till vårt-EF@...") skulle med DEFAULT-policyn **blockeras
tyst av tenanten** om den pekar utanför M365. **MÅSTE VERIFIERAS mot
Miranon Medias faktiska tenant-inställning** innan denna väg övervägs alls
— annars byggs en lösning som ser ut att fungera i test men blockeras i
skarp drift.

### Rekommenderad sekvens för F

1. **v1/datagrund:** ingen M365-fångst alls — bara formulärets EF-väg
   (§ E). Lottas vanliga mejlarbete rörs inte.
2. **Tidig, billig utökning (samma infrastruktur):** en BCC/
   vidarebefordringsadress (§ F1) på SAMMA Resend inbound-domän, dokumenterad
   för Lotta som en VALFRI vana ("logga viktiga mejl du skickar/får UTANFÖR
   formuläret genom att BCC:a den här adressen") — billig att bygga, men
   ska INTE säljas till Marcus som "fullständig fångst", bara som ett
   komplement.
3. **Branschledar-ambitionens fullständiga svar (egen, senare fas):**
   Microsoft Graph-mailbox-synk, efter att tenant-admin-frågan är
   klarlagd och efter att v2/v3 (appens EGEN send/receive-väg) är i drift
   och bevisad. Detta är en medveten, uttalad SENARE investering — inte en
   spekulativ komplexitet att bygga "för säkerhets skull" nu.

---

## Del G — Resend inbound konkret

Verifierat mot Resends dokumentation och den installerade
`resend`/`agent-email-inbox`-skillen (plugin-cache, 2026-09-19) samt
WebFetch/WebSearch mot `resend.com/docs` och relaterade sidor samma dag.

| Fråga | Svar | Källa |
|---|---|---|
| GA eller beta? | **GA, lanserad november 2025** ("Inbound by Resend") | [Resend på X](https://x.com/resend/status/1985365199340384280), [alternativeto.net](https://alternativeto.net/news/2025/11/resend-adds-inbound-feature-for-webhooks-based-email-receiving-and-processing/) |
| API-form | Webhook (`email.received`), payload = METADATA ENDAST (`email_id`, `from`, `to`, `subject`, `message_id`, bilage-METADATA) — kropp/headers hämtas separat via `resend.emails.receiving.get(email_id)` | [Receiving-referens](https://resend.com/docs/dashboard/receiving/introduction), plugin-skillen `resend/receiving.md` |
| Webhook-verifiering | `resend.webhooks.verify()` mot `svix-id`/`svix-timestamp`/`svix-signature`-headers och en delad hemlighet — RÅ body krävs (`req.text()`, inte `req.json()`) | plugin-skillen `resend/webhooks.md`, `resend/receiving.md` |
| Trådning | **INGET eget tråd-/inbox-objekt.** Appen sätter själv `In-Reply-To` = mottaget `message_id` vid svar, och APPENDAR alla tidigare `message_id` till `References`, separerade med mellanslag, vid efterföljande svar i samma tråd | [Reply to Receiving Emails](https://resend.com/docs/dashboard/receiving/reply-to-emails) |
| Bilagor | Metadata i webhooken; fullständig hämtning via `emails.receiving.attachments.list/get` → tidsbegränsad `download_url` (`expires_at`) | plugin-skillen `resend/receiving.md` |
| Pris | Mottagna mejl räknas MOT samma kvot som skickade ("Both sent emails and received emails (inbound) count towards your account's email quota") — INGEN separat avgift för mottagning på de granskade sidorna | [Pricing](https://resend.com/pricing), [Account quotas and limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits) |
| Lagringstid hos Resend | **30 dagar, samtliga planer** (Free/Pro/Scale); Enterprise kan förhandla längre | [Account quotas and limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits) |
| DNS-krav | Ett MX-record med **prioritet 10 (lägsta numret vinner)** på önskad adress/subdomän. **Använd en SUBDOMÄN** ("Use a subdomain... to avoid disrupting existing email services") — miranon.se:s rot-MX (Microsoft 365) rörs INTE om Resends MX läggs på t.ex. `kontakt.miranon.se` eller `mail.miranon.se` i stället för på roten | plugin-skillen `resend/receiving.md`, bekräftat av `agent-email-inbox`-skillen |

**Konsekvens för DNS-planen:** en NY subdomän (t.ex. `kontakt.miranon.se`)
pekas med ett eget MX-record mot Resend, helt frikopplad från
`miranon.se`:s rot-MX som (per uppdragets bakgrund) mätts med `dig`
2026-09-19 och pekar mot Microsoft 365. Detta är den etablerade,
dokumenterade vägen — inte en improviserad lösning.

**Alternativ om Resend inte räcker (kort, ej djupdykt — utanför tids-
budget för fullständig utvärdering):**

- **Postmark Inbound** — samma grundmönster (webhook + parsead JSON),
  äldre och mer etablerad specifikt för inbound (Postmark byggde detta
  före Resend), men introducerar en ANDRA e-postleverantör vid sidan av
  Resend (som redan bär allt utgående) — dubbel leverantörsyta att
  underhålla. Ej primärkälle-verifierat i detta pass.
- **Microsoft Graph mot den befintliga brevlådan** — redan täckt i § F2;
  löser BÅDE formulär-inbound OCH Lottas M365-fångst i en och samma
  mekanism, men är den tyngsta vägen (Azure-app, admin-samtycke).

---

## Del H — Gränssnittet för Lotta: en icke-teknisk användare

**WAI-ARIA APG har ett EGET, namngivet arbetsexempel för just detta:**
["Treegrid Email Inbox Example"](https://www.w3.org/TR/2021/NOTE-wai-aria-practices-1.2-20211129/examples/treegrid/treegrid-1.html)
— ett grid-widget där rader (meddelanden) navigeras med pil-tangenter, Home/
End, och celler (avsändare, ämne, datum) kan navigeras separat inom en rad.

**Men detta är sannolikt ÖVERKURS för Miranon Medias volym** (HYPOTES:
några meddelanden/vecka, EN användare). Treegrid-mönstret är designat för
en RIK, kolumn-tung inkorg (flera sorterbara kolumner, kompakt
massnavigering) — motiverat vid hundratals rader, inte vid en handfull i
veckan. **Rekommendation: en enkel semantisk lista** (`<ul>`/`<li>` med
`<button>` eller `<a>` per rad som öppnar tråden) kräver INGEN ARIA-roll
alls utöver standard HTML-semantik — webbläsare och skärmläsare hanterar
detta korrekt utan widget-mönster. Om listan senare växer till att
AUTOMATISKT ladda fler rader vid skroll (oscilerande volym), är **Feed-
mönstret** (`role="feed"`, `article` per rad, `aria-posinset`/
`aria-setsize`, `aria-busy` under laddning — verifierat mot
[W3C Feed Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/)) rätt
val — men det är EN av de fyra "golv, inte spekulation"-avvägningarna att
skjuta upp tills volymen faktiskt kräver det.

**Vad precedenterna visar i list- kontra trådvy (mönster, inte pixel-exakt
kopiering):**

- **Listvy:** avsändare, ämne/utdrag, tidpunkt, olästmarkör — samtliga
  precedenter (Help Scout, Front, Zendesk, Chatwoot) visar exakt dessa
  fyra fält i sin listrad, ingen mer.
- **Trådvy:** meddelanden i kronologisk ordning, riktning visuellt skild
  (avsändarens meddelanden till vänster/annan färg än Lottas svar — samma
  konvention i samtliga sju precedenter).
- **Tomt läge:** inte research-belagt i detta pass specifikt (ingen
  primärkälla granskad för "empty state"-text) — **generellt UX-mönster**
  (ej källbelagt här, flaggas som sådant): en förklarande text + ev. en
  länk till formuläret/en synlig "inget att göra just nu"-signal, i linje
  med `MailLog`-komponentens befintliga tomt-läge-konvention i appen
  (åter-användbar, inte ny research).
- **Koppling "visa personen":** samtliga precedenter länkar tråden/ticketen
  till kontaktens FULLSTÄNDIGA profil med ETT klick (`_links.related.
  contact` hos Front, `associatedContactId` hos HubSpot, `customer`-objektet
  hos Help Scout). Miranon Medias motsvarighet: en länk till
  `/person/$personId` från varje trådrad — mönstret finns redan i appen
  (`PersonHistoryEntry`s event-/anmälningslänkar, § Vad jag redan hade).
- **Hantering av omatchade avsändare:** en egen sektion/flik ("Ej kopplade"
  eller motsvarande) — se § I, samma mekanism som skräp-hanteringen.

**Vad som ÄR överkurs vid några meddelanden i veckan** (uttryckligt svar på
uppdragets fråga): tilldelning/ägarskap (meningslöst med EN användare),
SLA-timers, makron/snabbsvarsmallar (Zendesk/Help Scout-funktioner byggda
för TEAM med hög volym), taggar/kategorisering utöver kanal (`Källa`),
och multi-inbox-routing. Samtliga dessa är byggda av precedenterna för
TEAM-skala supportvolym — att bygga dem för Lotta ensam vore precis den
"lösning som letar problem" den dubbelriktade över-engineering-vakten
varnar för.

---

## Del I — Skräp och missbruk: skydda kundregistret

**Kärnfrågan, ordagrant ur uppdraget: basen är ett kundregister, inte en
spamkorg.** Två branschmönster, redan kontrasterade i § A3/A5:

1. **Autoskapande (Help Scout, Front, Chatwoot):** varje ny avsändaradress
   blir en kontakt/lead. Fungerar när volymen är LÅG NOG att en människa
   ändå ser och kan städa skräp manuellt (samma logik som Front/Help Scout
   riktar sig mot små supportteam).
2. **Karantän (Zendesk Suspended Tickets):** misstänkt skräp hamnar i en
   SKILD kö, aldrig i huvudlistan, med auto-radering efter 14 dagar om
   ingen agerar. Byggt för volym där autoskapande skulle dränka
   kundregistret i brus.

**Rekommendation för Miranon Media: en HYBRID, inte en ren kopia av
någotdera** — motiverad av att basen redan bär hälften av lösningen:

- **`Kontaktlogg (rådata).Touchpoint trigger`-formeln
  (`AND(Riktning="In", Källa="Kontaktformulär", LEN(Body)>30))`** är
  redan ett filter mot det TRIVIALASTE bruset (ett ord, en tom rad) —
  återanvänd SAMMA tröskel-idé (inte samma Airtable-formel) i den nya
  EF:en: ett meddelande under en viss längd, eller utan text alls, skapar
  ALDRIG automatiskt en ny Person — det lagras (för spårbarhet) men
  matchas till ett "omatchat"-läge, aldrig till en autoskapad kontakt.
- **Ny avsändare + reCAPTCHA/spam-signal saknas (§ intagskedje-passet:
  dagens Elfsight-formulär har reCAPTCHA, en EF-ersättning måste bygga
  EGET skydd, t.ex. Turnstile eller rate-limiting)** → tråden markeras
  **"Ej kopplad"** (omatchad-kö, Zendesk-inspirerad) snarare än att
  autoskapa en Person direkt. En MÄNNISKA (Lotta) kopplar den till en
  befintlig person, skapar en ny, eller arkiverar den som skräp — samma
  princip som Zendesks "recover"-handling.
- **Auto-radering av kvarvarande skräp** (Zendesks 14 dagar) rekommenderas
  INTE rakt av för Miranon Media utan Marcus GO — GDPR-avvägningen (§ J)
  pekar snarare mot att en KORT, uttryckligt beslutad gallringsperiod är
  rätt för ALL okopplad kontakt, inte bara "misstänkt skräp"; att skilja
  "skräp" från "en legitim men ännu okopplad kontakt" kräver mänsklig
  bedömning första gången, en tidsgräns är en EFTERHANDS-städning, inte en
  ersättning för den bedömningen.

**Den avgörande skillnaden mot precedenterna:** ingen av dem har Miranon Medias
specifika begränsning — att en `Personer`-post i Airtable ÄR kundregistret,
konsumerat av Bulkmail/Segment/rapporter. Att låta en
autoskapad skräp-Person slinka in där är DYRARE än hos en ren
support-inkorg (där en skräp-kontakt bara skräpar i en kontaktlista) —
den skulle förorena SEGMENT och UTSKICK. Detta är skälet till att
"omatchad-kö tills en människa godkänt" väger tyngre för Miranon Media än
för en generisk supportinkorg.

---

## Del J — GDPR

**Rättslig grund (Art 6(1)):** att BESVARA en persons egen förfrågan via
kontaktformuläret vilar rimligast på **legitimt intresse (f)** — *"processing
is necessary for the purposes of the legitimate interests pursued by the
controller"* — eftersom personen SJÄLV initierade kontakten och ett svar är
en rimlig förväntan, inte en överraskande behandling. Är kontakten en
föranmälan till ett köp/en kurs kan **avtal/åtgärd före avtal (b)** vara
starkare grund. **Detta är min syntes av allmän GDPR-struktur, inte ett
Miranon Media-specifikt juridiskt utlåtande** — flaggas uttryckligen som
sådant; en slutlig rättslig-grund-bedömning bör göras av Roger/Lotta eller
en rådgivare, inte antas här.

**Lagringstid (Art 5(1)(e), storage limitation):** *"personal data must be
kept in a form which permits identification of data subjects for no longer
than is necessary"* för det ändamål datan samlades in. Det finns INGEN
generisk siffra i lagtexten — den sätts av verksamheten själv, motiverat av
syftet. **Rekommendation, inte facit:** en explicit gallringsprincip
(t.ex. "olästa/okopplade meddelanden gallras efter N månader om ingen
handling tagits", separat från meddelanden som LEDER till en aktiv
kundrelation, vilka följer Personer-postens egen livslängd) — samma
disciplin som `T171`s städning av persondata redan visar att Miranon Media
tar på allvar.

**Radering/export per person (Art 15 rätt till tillgång, Art 17 rätt till
radering):** *"personal data are no longer necessary in relation to the
purposes for which they were collected"* är förstagrunden för radering;
undantagen (Art 17(3)) — rättsliga anspråk, arkivändamål — är sannolikt
INTE relevanta för vanlig kontakt-korrespondens. **Konsekvens för
datamodellen:** en radering av en Person (om den funktionen någonsin byggs)
måste kaskad-radera eller anonymisera KOPPLADE `contact_messages`-rader,
inte lämna föräldralösa meddelanden kvar med en referens till ett
`person_id` som inte längre finns. Detta är en design-KONSEKVENS att bygga
in i tabellschemat (en `ON DELETE`-policy eller en explicit
anonymiserings-EF), inte en efterhandslösning.

**Känsliga uppgifter i fritext (Art 9(1)):** *"racial or ethnic origin,
political opinions, **religious or philosophical beliefs**... data
concerning health..."* är särskilda kategorier med extra skydd. **Detta är
INTE ett teoretiskt scenario för Miranon Media** — verksamheten säljer
meditations-/andlighetsrelaterade kurser (Resor i medvetandet, Fjärrskådning,
Pyramidernas vajrar), och ett fritext-kontaktmeddelande kan mycket väl
innehålla uppgifter om hälsa ("jag har ångest och undrar om kursen passar
mig") eller andlig/filosofisk övertygelse — precis den kategori Art 9
skyddar. **Konsekvens:** ingen automatisk vidarebehandling (t.ex.
AI-sammanfattning, segmentering) av fritext-innehållet utan att detta vägs
in; mänsklig läsning (Lotta läser och svarar) är i sig en lägre risk än
automatiserad bearbetning, men om en framtida funktion (sökning,
AI-assisterad triage) byggs ovanpå meddelande-arkivet måste denna kategori
beaktas explicit då — flaggas här som en FRAMTIDA gräns, inte ett hinder
för v1 (v1 gör ingenting med innehållet utöver att visa det för Lotta).

---

## Dom

**Miranon Media ska bygga en trådad, tvåvägs-meddelandemodell i Supabase
(inte Airtable) som förlänger, inte duplicerar, en design basen redan bar
sedan mars 2026 men aldrig kopplade in (`Kontaktlogg (rådata)`). Trappan
håller som byggordning när "steg 1" omdefinieras till "datagrunden i
slutlig form, plus en minimal verifikationsväg" — inte "en synlig
inkorgsyta." Den starkaste enskilda insikten i passet är kodgrundad, inte
branschjämförd: `activity_log`s xAPI-aktör kan strukturellt inte
representera en anonym avsändare, vilket löser "tredje modell"-frågan åt
oss genom att visa var gränsen MÅSTE gå — meddelandeinnehåll i en ny
tabell, staff-handlingar i `activity_log`, CRM-relationssignaler i
`Touchpoints`, tre lager, en läs-tidslinje.**

## Rekommendation

**Detta är en rekommendation, inte ett beslut — Marcus/grillningen avgör.**

### Datamodell (rekommenderad, ej facit)

| Tabell | Plats | Nyckelfält | Vem sätter |
|---|---|---|---|
| `contact_threads` | Supabase (ny) | `id`, `person_id` (text, Airtable record-ID, nullable = omatchad), `status` (öppen/besvarad/stängd), `channel`, `subject`, `match_status` (matchad/omatchad/skräp), `first_message_at`, `last_message_at` | EF (skapas vid första meddelandet i tråden) |
| `contact_messages` | Supabase (ny) | `id`, `thread_id` (referens till `contact_threads.id`), `direction` (in/ut), `from_email`/`from_name` (rå, alltid sparad), `to_email`, `body_text`, `resend_message_id`, `in_reply_to`, `references` (array), `source` (`resend_inbound`/`manual_log`/`app_send`), `sent_by` (uuid, staff, nullable) | EF vid inbound; Lotta/EF vid manuell loggning eller app-svar (v2) |
| `contact_message_attachments` | Supabase (ny) | `id`, `message_id` (referens till `contact_messages.id`), `filename`, `content_type`, `storage_path` | EF, samma mönster som `send-action-email`s attachment-resolution |
| `activity_log` (befintlig) | Supabase | Ny `verb`/`object_type` för trådhandlingar ("öppnade tråden", "loggade ett svar", "stängde tråden") — `PERSON_ID_EXTENSION_IRI` återanvänds | Staff-handling, aldrig inbound-mottagandet självt |
| `Touchpoints` (befintlig) | Airtable | Ny option i `Typ` ("Kontaktat via formulär"), skapas ENDAST vid ny-Person, inte per meddelande | EF, samma gren-logik som A4 |
| `Kontaktlogg (rådata)` (befintlig) | Airtable | **INGEN ny skrivning** efter EF-lansering — arkiv, orörd | Ingen (frusen) |

### Trappans snitt

- **v1 (datagrund, dag 1 av sajtlansering):** Resend inbound-webhook →
  EF → matchning (Chatwoots `from_email`-mönster, normaliserad, case-
  okänslig) → skriv `contact_threads`/`contact_messages` i slutlig form →
  formuläret FORTSÄTTER mejla Lotta parallellt (facit-vägen om något
  brister) → EN minimal, intern verifikationsyta (INTE den polerade
  inkorgen) för att bevisa matchningslogiken mot verklig trafik.
- **v1.5 (samma infrastruktur, låg extra kostnad, valfri för Lotta):**
  BCC/vidarebefordringsadress på samma Resend-subdomän för mejl Lotta
  AKTIVT väljer att logga — sålt till Marcus som komplement, inte som
  "appen har nu koll på allt."
- **v2 (inkorgens gränssnitt + svar från appen):** enkel listvy + trådvy
  (§ H), svar skickas via Resend från appen och loggas som `source:
  'app_send'` — **bör INTE tvingas in i v1** trots att det återanvänder
  befintligt utskicksflöde (`send-action-email`-mönstret), eftersom UI:t
  (ADR-103 tvåfas-prototyp) är en egen, icke-trivial investering Marcus
  själv pekat ut som ett separat spår.
- **v3 (fullständig tvåvägs, inkommande svar fångas automatiskt):**
  In-Reply-To/References-trådning (§ G), känd branschgräns (Chatwoots
  dokumenterade begränsning) accepteras öppet: ett svar utan matchande
  headers skapar en ny tråd, inte ett fel att jaga bort helt.
- **v4 (branschledar-ambitionens fulla svar, egen fas):** Microsoft
  Graph-mailbox-synk (§ F2) — efter tenant-admin-frågan är klarlagd.

### Vad som återanvänds ur repot, fil för fil

- Chatwoots `from_email`-mönster (extern, ej repo) → ny matchningsfunktion,
  normaliserad/case-okänslig e-post, samma princip som A2:s 4-grens-mönster
  (`data-model.md` § A2:s decision) men adapterad (ingen "uppdatera namn
  på namnlös Person"-gren behövs här — se § I:s omatchad-kö i stället).
- `supabase/functions/_shared/send-action-email.ts` § `resolveAttachments`
  → formen för bilage-lagring och ägarskaps-kontroll.
- `src/domain/schemas/ActivityStatement.schema.ts` §
  `PERSON_ID_EXTENSION_IRI` → återanvänds rakt av för trådhandlingars
  person-länk.
- `src/components/maillog/MailLog.tsx` → UI-mönster för en global listvy
  (tomt läge, radformat) — inte kod-återanvändning, mönster-referens.
- `Kontaktlogg (rådata)`s fältform (`Riktning`, rå e-post,
  `Touchpoint trigger`-tröskeln) → modell-referens för den nya
  Supabase-tabellen, INTE en levande koppling.

### Vad som överlever Fas E oförändrat

`contact_threads`/`contact_messages`/`contact_message_attachments` är REDAN
i Postgres — Fas E:s migrering rör bara `person_id`-referensens ID-rymd
(Airtable record-ID → Supabase person-UUID), samma punktändring ADR-110
redan förutsett för `activity_log`. Ingen tabellform, ingen EF-kontrakt-
grund behöver rivas.

### Golv kontra spekulativ komplexitet

**Golv (icke förhandlingsbart):** tråd-ID, meddelande skilt från tråd,
riktning på meddelandet, kanal, rå avsändaradress bevarad, normaliserad
e-post-matchning, omatchad-kö (inte autoskapande rakt av, § I), tillgänglig
lista utan widget-tvång (§ H), minimal verifikationsväg i v1 (§ E).

**Spekulativ komplexitet att SKÄRA BORT tills den behövs:** treegrid-widget
(§ H), tilldelning/SLA/makron/taggar (§ H), Microsoft Graph-synk i v1 (§ F),
full Postmark-utvärdering (§ G, ej gjord — inte efterfrågad förrän Resend
visar sig otillräckligt), en generell enhetlig polymorf tidslinje-widget i
`PersonDetail.tsx` (§ D — bygg en egen sektion, inte en ny plattform),
auto-radering av "skräp" utan Marcus GO (§ I).

## Vad jag inte kunde belägga

1. **`Kontaktlogg (rådata)`s EXAKTA fältform idag.** Källan
   (`schema_reference.md`) är frusen mars 2026; jag har bara verifierat att
   tabellen EXISTERAR och växer (15→20 rader) via `data-model.md`, inte att
   fälten är oförändrade. Kräver en live Airtable-läsning (orkestrerar-
   uppgift, subagent-spärren gäller mig).
2. **Vilken mekanism som postar Kontaktformulärets rader till
   `Kontaktlogg (rådata)` idag** — Zapier-webhook eller direkt
   Elfsight-koppling. Redan flaggat som obelagt i systerpasset
   (`miranon-se-intagskedjan-idag-2026-09-19.md` § 6), oförändrat här.
3. **Vem administrerar Miranon Medias M365-tenant** och om
   organisationens outbound-forwarding-policy tillåter externa
   vidarebefordringsregler (§ F3) — avgörande för om F1/F3 ens är
   tekniskt möjliga utan en admin-ändring.
4. **HubSpot Conversations APIs exakta autoskapande-beteende för okänd
   avsändare** — dokumentationsutdraget jag nådde beskrev INTE detta
   explicit (till skillnad från Help Scout, § A3, där källan var
   entydig). Flaggat som obelagt i § A1, inte antaget.
5. **Intercoms mekanism för lead→user-övergång** — samma typ av lucka,
   dokumentationsutdraget beskrev bara att distinktionen finns, inte hur
   övergången triggas.
6. **"Tomt läge"-texter/mönster** (§ H) — INGEN primärkälla granskades
   specifikt för detta; angivet som allmänt UX-mönster, inte
   källbelagt.
7. **Attachments-storleksgräns för Resend inbound specifikt** — flera
   sökningar gav ingen exakt siffra i den granskade dokumentationen (till
   skillnad från lagringstiden, som VAR entydig: 30 dagar).
8. **Postmark Inbound / Microsoft Graph som fullständiga alternativ till
   Resend** — nämnda kort (§ G) enligt uppdragets egen "kort"-instruktion,
   INTE djupforskade med samma rigör som Resend. En fullständig jämförelse
   är ett eget, separat pass om Resend visar sig otillräckligt.
9. **Precedent-rymden för "omatchad-kö"-UI specifikt** (hur Zendesk/andra
   visuellt PRESENTERAR en karantän-kö för en icke-teknisk användare, inte
   bara att den finns) — TUNN, deklareras öppet: jag har bevisat att
   MÖNSTRET finns (Zendesk Suspended Tickets) men inte studerat dess
   faktiska gränssnitt i detalj.
10. **Om `Personer.Antal hämtningar`-klassens dubbelräknings-fällor**
    (`data-model.md` fälla 47/50) har en motsvarighet i en framtida
    `contact_messages`-räknare — inte undersökt, för tidigt att spekulera
    om innan tabellen finns.

## Källförteckning

**Repo, primärt:**

- [`docs/reference/schema_reference.md`](../reference/schema_reference.md)
  rad 505–530 (Kontaktlogg/Touchpoints fältform, frusen mars 2026)
- [`docs/reference/data-model.md`](../reference/data-model.md) rad 95, 1311,
  2454 (Touchpoints-konsumenter, "luckor")
- [`docs/decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-
  airtable.md`](../decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md)
- [`docs/decisions/ADR-063-airtable-bas-som-forstklassig-
  leverabel.md`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)
- [`docs/research/miranon-se-intagskedjan-idag-2026-09-19.md`](miranon-se-intagskedjan-idag-2026-09-19.md)
  § 1.3, § 3, § 6 (samma sessions systerpass)
- `src/domain/schemas/ActivityStatement.schema.ts` (aktör-begränsningen)
- `supabase/migrations/20260811211759_create_activity_log.sql`
- `src/components/persons/PersonDetail.tsx`,
  `src/domain/schemas/PersonDetail.schema.ts`
- `src/components/maillog/MailLog.tsx`,
  `src/routes/_authenticated/mer/maillogg.tsx`
- `supabase/functions/_shared/send-action-email.ts`

**Externt, primärkällor (samtliga hämtade 2026-09-19):**

- [HubSpot Conversations API](https://developers.hubspot.com/docs/api-reference/legacy/conversations/guide)
- [HubSpot Create an engagement](https://developers.hubspot.com/docs/api-reference/legacy/crm/activities/engagements/post-engagements-v1-engagements)
- [Front Conversations](https://dev.frontapp.com/reference/conversations),
  [Front Contacts](https://dev.frontapp.com/reference/contacts)
- [Help Scout Conversation Object](https://developer.helpscout.com/webhooks/objects/conversation/),
  [Help Scout Create Conversation](https://developer.helpscout.com/mailbox-api/endpoints/conversations/create/)
- [Intercom Conversation object](https://developers.intercom.com/docs/references/rest-api/api.intercom.io/conversations/conversation)
- [Zendesk Tickets API](https://developer.zendesk.com/api-reference/ticketing/tickets/tickets/),
  [Understanding suspended tickets and spam](https://support.zendesk.com/hc/en-us/articles/4408889141146-Understanding-suspended-tickets-and-spam),
  [Causes for ticket suspension](https://support.zendesk.com/hc/en-us/articles/4408828416282-Causes-for-ticket-suspension)
- Chatwoot källkod:
  [`contact.rb`](https://github.com/chatwoot/chatwoot/blob/develop/app/models/contact.rb),
  [`contact_inbox.rb`](https://github.com/chatwoot/chatwoot/blob/develop/app/models/contact_inbox.rb),
  [`conversation.rb`](https://github.com/chatwoot/chatwoot/blob/develop/app/models/conversation.rb),
  [Conversation Continuity](https://developers.chatwoot.com/self-hosted/configuration/features/email-channel/conversation-continuity)
- [Attio Create a person Record](https://docs.attio.com/rest-api/endpoint-reference/people/create-a-person-record)
- [Pipedrive Smart BCC](https://support.pipedrive.com/en/article/smart-email-bcc),
  [Pipedrive Activities](https://support.pipedrive.com/en/article/activities)
- Resend: plugin-skillarna `resend:resend` och `resend:agent-email-inbox`
  (lokal cache, `/Users/marcus/.claude/plugins/cache/claude-plugins-official/resend/1.0.5/`),
  [Receiving Emails](https://resend.com/docs/dashboard/receiving/introduction),
  [Reply to Receiving Emails](https://resend.com/docs/dashboard/receiving/reply-to-emails),
  [Pricing](https://resend.com/pricing),
  [Account quotas and limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits),
  [Inbound Emails blogg](https://resend.com/blog/inbound-emails)
- [WAI-ARIA APG Feed Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/),
  [Treegrid Email Inbox Example](https://www.w3.org/TR/2021/NOTE-wai-aria-practices-1.2-20211129/examples/treegrid/treegrid-1.html)
- GDPR: [Art. 5](https://gdpr-info.eu/art-5-gdpr/),
  [Art. 6](https://gdpr-info.eu/art-6-gdpr/),
  [Art. 9](https://gdpr-info.eu/art-9-gdpr/),
  [Art. 17](https://gdpr-info.eu/art-17-gdpr/)
- Microsoft Graph: sökningsresultat mot
  [`learn.microsoft.com`](https://learn.microsoft.com/en-us/graph/permissions-reference)
  (Mail.Read.Shared, application vs delegated permissions för webhook-
  prenumerationer på delade brevlådor), subscription-livslängd (4230 min)
- Microsoft 365 outbound-forwarding-policy: sökningsresultat mot
  [`learn.microsoft.com`](https://learn.microsoft.com/en-us/defender-office-365/outbound-spam-policies-external-email-forwarding)
  och [Microsoft Community Hub](https://techcommunity.microsoft.com/blog/exchange/all-you-need-to-know-about-automatic-email-forwarding-in-exchange-online/2074888)
