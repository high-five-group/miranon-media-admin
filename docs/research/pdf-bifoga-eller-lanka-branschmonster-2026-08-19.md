---
owner: marcus803
updated: 2026-08-19
review_by: 2026-11-19
status: draft
---

# Bifoga eller länka — branschmönstret 2026 för PDF till identifierad mottagare i transaktionsmail, och vad det kräver av sändvägen (Code, 2026-08-19)

> **Proveniens:** avgränsat research-pass (`marcus-system:research`-skillen),
> kört OISOLERAT i huvudkatalogen på `miranon-media-admin`, gren
> `docs/s107-paus-5` vid start (arbetsträdet delas med en aktiv
> orkestrerar-session), committar aldrig. **Modell:** exakt rad ur egen
> systemprompt — *"You are powered by the model named Sonnet 5. The exact
> model ID is claude-sonnet-5."*
>
> **Läst i sin helhet innan något nytt söktes:**
> [`docs/research/utskicks-bilage-arkitektur-2026-08-03.md`](utskicks-bilage-arkitektur-2026-08-03.md)
> (16 dagar gammal, `status: stable`) grundar redan att Resends
> `POST /emails/batch` **tyst släpper bilagor** (ordagrant citerat ur Resends
> egen dokumentation + `resend/resend-node#409`), att en attachment-bärande
> väg måste loopa singel-`/emails`-anrop, och att Supabase Storage
> service-role-`.download()`/signerad-URL är den etablerade
> lagringsmekaniken. Detta pass tar INTE om något av det — det bygger
> vidare på det som redan är stängt.
> [`docs/research/pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md`](pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md)
> (1 dag gammal, `status: draft`) rör en ANNAN axel — hur PDF:en RENDERAS
> (HTML/CSS-motor vs koordinat-ritning), inte hur den DISTRIBUERAS. Ingen
> ADR eller `tasks/lessons.md`-post om "bifoga vs länka" hittades vid sökning
> (`grep -riE "bifoga|bilaga.*mail|attach"` mot `docs/decisions/` gav noll
> träffar utöver ADR-067/ADR-015/ADR-117, samtliga om sändkontraktet, ingen
> om distributionsformen). **Frågan i detta pass är alltså genuint ny — den
> är inte besvarad eller avgjord av något befintligt dokument.**
>
> **Vad som är nytt i detta pass:** en fullständig branschkartläggning av
> attach-vs-länk-mönstret för kvitto/biljett/bekräftelse (§1), en
> källbelagd prövning av deliverability-hypotesen mot Gmails egen
> dokumentation i stället för tredjeparts-blogg-påståenden (§2), och en
> **falsifiering** av premissen att ett-anrop-per-mottagare är
> branschnormen (§4) — den visar sig vara en Resend-specifik brist, inte
> ett branschvillkor.

## Kort svar

**Hypotesen i uppdraget — att branschledare i stor utsträckning INTE bifogar
PDF:er, av deliverability-, storleks- och spårbarhetsskäl — är FALSIFIERAD
för just dokumentklassen "kvitto/bekräftelse till en identifierad
mottagare".** Stripe bifogar PDF-fakturan/kvittot **som standard** (och
erbjuder en hostad länk DÄRTILL, inte i stället för), Ticketmaster erbjuder
PDF-bifogning som ett av sina ordinarie biljett-leveranssätt, och Postmark —
en e-posttjänst vars hela affär är transaktionsmail-leverans — rekommenderar
uttryckligen att bifoga en PDF till kvitto-/fakturamail. Den enda motsatta
branschrörelsen som hittades (Eventbrite, som tog bort PDF-biljetter ur
mailen) gäller **biljetter** specifikt (anti-bedrägeri/skärmdumps-delning,
inte deliverability) och kräver ett konto — vilket inte gäller Roger/Lottas
deltagare.

**Deliverability-hypotesen är folklore, inte belagd fakta, vid vår
skala.** Gmails egna officiella dokumentation (attachment-blockeringslistan,
bulk-sender-riktlinjerna) nämner PDF:er **inte alls** som ett spam- eller
leveranssignal — blockeringen gäller körbara/skript-filtyper (`.exe`, `.js`,
`.bat` m.fl.), aldrig `.pdf`. Gmails 102 KB-"clipping"-gräns, som flera
tredjeparts-källor felaktigt kopplar till attachments, gäller **uteslutande
HTML-kroppens storlek — attachments räknas INTE in** (bekräftat av flera
oberoende ESP-supportsidor). Bulk-sender-riktlinjerna träder dessutom bara
in vid **5 000+ mail/dag till Gmail** — cirka fyra tiopotenser över Roger &
Lottas volym (max 24 mottagare/event, 30 event/år).

**Den överraskande falsifieringen gäller delfråga 4:** "ett anrop per
mottagare" är INTE branschnormen för att skicka en delad bilaga till många
mottagare — det är specifikt Resends brist. Tre av fyra andra granskade
leverantörer (Amazon SES, SendGrid, och Postmarks nya Bulk-API) stöder
**ett enda API-anrop** med en delad bilaga till många mottagare; Mailgun
stöder attachments i batch men den exakta delnings-mekaniken kunde inte
beläggas. Resend är den enda av de fem granskade leverantörerna vars
batch-ändpunkt **inte alls** kan bära en bilaga — inte ens dupliceringen
Postmarks äldre Batch-API tillåter.

**Konsekvens för vår arkitektur: det redan fattade beslutet (bifoga,
genererat en gång per event, lagrat, utskickat till varje anmäld) HÅLLER —
det förstärks av branschmönstret, inte omkullkastas.** Loop-arbetsgången mot
Resend (etablerad 2026-08-03) kvarstår som rätt lösning givet att
leverantörsbytet inte är i scope — men den ska förstås som en kompensation
för en Resend-egenhet, inte som "branschen gör alltid så". Vid 24
mottagare/event är kostnaden av loopen fortsatt försumbar (~2,4 sekunder
sekventiellt vid Resends 10 req/s-tak, redan räknat i 2026-08-03-passet).

## Delfråga 1 — Mönstret: bifoga eller länka för kvitto/biljett/bekräftelse?

**Käll-hierarki:** leverantörernas egna produktdokumentation i första hand
(Stripe, Postmark, Ticketmaster, Eventbrite); tredjeparts-branschguider i
andra hand, läst med skepsis där de säljer en konkurrerande tjänst.

### Stripe — bifogar OCH länkar, inte det ena i stället för det andra

[`docs.stripe.com/invoicing/send-email`](https://docs.stripe.com/invoicing/send-email):
Stripe bifogar en PDF-kopia av fakturan/kvittot **som standard** till
mailet — "a PDF attachment of the same invoice is automatically included to
assist customers with record keeping". Utöver detta kan man **även** aktivera
en hostad betalningssida (`Hosted Invoice Page`,
[`docs.stripe.com/invoicing/hosted-invoice-page`](https://docs.stripe.com/invoicing/hosted-invoice-page)):
en unik, säker URL där kunden kan se detaljer, betala och **ladda ner** en
PDF-kopia. De två lägena kombineras ("Email invoice with link" = båda
samtidigt) — Stripe konstruerar alltså INTE detta som ett antingen/eller-val.
Detta är den starkaste enskilda datapunkten i hela passet: en av branschens
mest citerade betalningsplattformar, för exakt dokumentklassen
"kvitto/faktura till identifierad mottagare", väljer **både**.

### Postmark — rekommenderar uttryckligen att bifoga

[`postmarkapp.com/guides/receipt-and-invoice-email-best-practices`](https://postmarkapp.com/guides/receipt-and-invoice-email-best-practices),
ordagrant: **"Ideally, every receipt or invoice email will include a PDF or
other printer-friendly document attached."** Postmark är en leverantör vars
hela affärsidé är transaktionsmail-leverans — om bifogning systematiskt
skadade deliverability skulle det stå i deras EGEN best-practice-guide, och
det gör det inte. Guiden nämner en online-repository/på-begäran-generering
som ett alternativ, men presenterar det aldrig som förstahandsvalet.

### Ticketmaster — PDF-bifogning är ett av de ordinarie leveranssätten

Enligt Ticketmasters egen supportsida (sökt via `help.ticketmaster.com`):
väljer köparen "email"-leverans levereras biljetterna **som PDF-bifogning**
i inkorgen — ett av flera parallella leveranssätt (mobil, konto), inte ett
avvecklat sådant.

### Eventbrite — motsatt rörelse, men för biljetter specifikt och av ett annat skäl

[`eventbrite.com/blog/eventbrite-app-tickets`](https://www.eventbrite.com/blog/eventbrite-app-tickets/):
Eventbrite tog **bort** PDF-biljetter ur bekräftelse-/påminnelsemail och
pekar i stället mot inloggat konto/app ("Find my tickets"). Den publicerade
motiveringen ramar det som upplevelse/säkerhet/app-engagemang — **ingen
deliverability-motivering hittades**, och det stämmer inte med denna
frågas ram: konto-baserad åtkomst kräver att mottagaren HAR ett konto, vilket
Roger & Lottas deltagare uttryckligen inte har (uppdragets premiss). Viktigt:
samma Eventbrite-källa bekräftar att **kvitton/skattefakturor fortsatt
bifogas som separat PDF** när sådana utfärdas — det är specifikt
**biljetten** (ett engångs-scannbart bevis, sårbart för skärmdumps-delning)
som flyttades, inte kvittoklassen. Roger & Lottas två dokument
(bekräftelsebilaga, deltagarinformation) är statiskt informationsinnehåll
utan skann-/engångsanvändning — de tillhör kvitto-klassen i denna
distinktion, inte biljett-klassen.

### Sammanvägt mönster

För dokumentklassen "kvitto/bekräftelse/informationsbrev till en
identifierad, redan känd mottagare" är **bifoga** det dominerande,
väl-etablerade mönstret — ofta KOMBINERAT med en länk (Stripe), sällan
ENBART länk. Länk-ENBART hittades bara för biljett-klassen
(scan-/engångsanvändning, kontobaserad åtkomst) — en annan dokumentklass än
Roger & Lottas två dokument.

## Delfråga 2 — Deliverability-effekten av bilagor: mätdata eller folklore?

**Käll-hierarki:** Googles egen dokumentation (`support.google.com`) i
första hand — starkast tillgängliga förstapartskälla för just Gmail-mottagning,
som är den mottagarsida svenska privatpersoner till störst del sannolikt
använder. Tredjeparts-blogg-påståenden (mailforge.ai, mailwarm.com,
pushwoosh.com) läses därefter, med uttrycklig skepsis eftersom flera säljer
egna "deliverability"-produkter.

### Vad Google FAKTISKT säger

[`support.google.com/mail/answer/6590`](https://support.google.com/mail/answer/6590)
(Gmails officiella attachment-blockeringspolicy) listar blockerade
filändelser uttömmande: körbara filer, skript, arkiv med lösenordsskydd
(`.exe`, `.js`, `.bat`, `.msi`, `.iso`, m.fl. — se fullständig lista i
källförteckningen). **`.pdf` finns INTE på listan.** Ingen storleks- eller
innehållsbaserad "spam-risk"-klassning för PDF nämns.

[`support.google.com/a/answer/14229414`](https://support.google.com/a/answer/14229414?hl=en)
(Gmails Bulk Sender Guidelines FAQ, den officiella källan bakom
november 2025-hårdenforcementet) nämner **attachments inte alls** — kraven
är uteslutande autentisering (SPF/DKIM/DMARC-alignment), spamklagomålsgrad
(<0,3 %, mål <0,1 %) och en-klicks-avprenumeration. Tröskeln för att ens
omfattas: **"5,000 or more messages a day to Gmail accounts"** — Roger &
Lottas hela årsvolym (30 event × max 24 mottagare = ≤720 mail/år i denna
dokumentklass) ligger flera tiopotenser under den tröskeln.

### Den vanligast citerade motsatta siffran — och varför den är missvisande här

Flera tredjeparts-källor (mailforge.ai m.fl.) citerar "emails over 110 KB
begin to experience deliverability issues" (ursprungligen Email on Acid).
**Detta gäller Gmails HTML-kropps-"clipping" vid ~102 KB, inte
deliverability i betydelsen spamklassning eller avvisning** — bekräftat av
flera oberoende ESP-supportsidor (Mailchimp, Klaviyo, ActiveCampaign,
Blueshift): gränsen mäter HTML-koden (text, inline-CSS,
tracking-pixlar, länk-URL:er), och **attachments räknas uttryckligen INTE
in**. Effekten av att träffa gränsen är att Gmail visar "[Meddelande
klippt] Visa hela meddelandet" — en RENDERINGS-olägenhet, inte en
spam-mapp-placering. Denna sammanblandning (attachment-storlek ↔
HTML-clipping) är den troliga källan till en stor del av
"attachments skadar leverans"-folkloren.

### Vad som ÄR verkligt, men inte relevant vid vår skala/autenticering

- 85 % av **skadliga** mail innehåller en bifogning (F-Secure, citerat av
  mailforge.ai) — sant för malware-detektion i allmänhet, men säger
  ingenting om en legitim, liten PDF från en SPF/DKIM/DMARC-autentiserad
  avsändardomän till en känd, samtyckt mottagare.
- Stora mailleverantörers generella per-mail-storlekstak (Gmail 25 MB,
  Outlook 20 MB, Yahoo 25 MB) är verkliga tak, men irrelevanta för
  dokument i tiotals-till-några-hundra-KB-klassen som Roger & Lottas två
  PDF:er (jfr `pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md` §2:s
  bild-mätningar — enskilda inbäddade bilder på 36,7 KB, inga
  megabyte-dokument).

### Dom på delfrågan

**Ingen förstapartskälla (Google, Postmark, Stripe) bekräftar att en
legitim, liten PDF-bifogning från en autentiserad domän försämrar
inbox-placering.** Den vitt spridda tredjeparts-blogg-versionen av påståendet
är antingen ocitrerad åsikt, eller — där den citerar en siffra — en
sammanblandning med ett HTML-rendering-fenomen som inte gäller bifogningar.
Vid Roger & Lottas volym (fyra tiopotenser under Gmails bulk-tröskel) är
frågan dessutom praktiskt irrelevant oavsett vilken sida av debatten man
tror på.

## Delfråga 3 — Kostnaden för länk i vår kontext (kort, bygger på redan gjord Storage-research)

Redan grundat i `utskicks-bilage-arkitektur-2026-08-03.md` § Delfråga 2 och
INTE omtaget här: Supabase Storage `createSignedUrl()` ger en tidsbegränsad,
inloggningsfri URL — mekanismen finns redan och kräver ingen ny research.

Det som ÄR nytt att notera för DENNA frågas skull: en länk-ENBART-väg måste
lösa en avvägning bifoga slipper — **hur länge ska länken vara giltig?**
Deltagarinformation kan rimligen behöva vara läsbar veckor efter
utskicket (deltagaren letar upp mailet igen strax före kursstart);
bekräftelsen kan behövas långt efter för bokföring. En kort giltighetstid
(timmar/dagar, vanligt default-mönster i signerad-URL-exempel) skulle bryta
den användningen; en lång giltighetstid (`utskicks-bilage`-passets § Vad
jag inte kunde belägga flaggar redan att EXAKT
`createSignedUploadUrl`-giltighetstiden inte kunde citeras direkt ur
Supabases referenssida) är fortsatt overifierad i detalj. Detta är inte en
blockerande upptäckt — bara en påminnelse om att "länk i stället för
bifogning" inte är gratis: den flyttar ett UX-beslut (hur länge håller
länken) in i arkitekturen som en bifogning aldrig behöver ta ställning
till, eftersom bifogningen ligger i mottagarens egen inkorg utan
utgångsdatum.

## Delfråga 4 — Kräver de stora tjänsterna ett anrop per mottagare vid bilagor?

**Käll-hierarki:** varje leverantörs egen API-referens.

| Tjänst | Ett anrop, delad bilaga till MÅNGA mottagare? | Källa (förstaparts) |
|---|---|---|
| **Resend** | **Nej** — batch-ändpunkten stödjer inte bilagor alls (redan grundat 2026-08-03) | [`resend.com/docs/dashboard/emails/attachments`](https://resend.com/docs/dashboard/emails/attachments) |
| **Amazon SES** (`SendBulkEmail`, v2) | **Ja** — `DefaultContent.Template.Attachments` delas av alla mottagare i `BulkEmailEntries`; AWS eget kodexempel: *"All recipients receive the same attachment(s) defined in DefaultContent"* | [AWS-exempel](https://docs.aws.amazon.com/ses/latest/dg/sesv2_example_sesv2_Scenario_EmailAttachments_section.html), [SendBulkEmail-referens](https://docs.aws.amazon.com/ses/latest/APIReference-V2/API_SendBulkEmail.html) |
| **SendGrid** (Mail Send v3) | **Ja** — `attachments` är ett TOPPNIVÅ-fält som gäller HELA anropet, delat av upp till 1000 `personalizations` | [SendGrid Mail Send-referens](https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send) |
| **Postmark, nya Bulk-API** | **Ja** — *"Attachments ✓ Defined once, sent to all"* — men API:t är **early access**, inte allmänt tillgängligt | [postmarkapp.com/bulk-api](https://postmarkapp.com/bulk-api), [early-access-sidan](https://postmarkapp.com/support/article/1311-the-early-access-program-for-the-new-bulk-api) |
| **Postmark, äldre Batch-API** (GA) | **Delvis** — ett HTTP-anrop, men varje av de ≤500 meddelande-objekten bär SIN EGEN attachment-kopia (dupliceras i payload, inte delad); ändå EN nätverksrundtripp för många mottagare | [Postmark batch-dokumentation](https://postmarkapp.com/developer/user-guide/send-email-with-api/batch-emails) |
| **Mailgun** | **Obelagt i detalj** — batch (recipient variables) + attachments är BÅDA dokumenterat fungerande, men om bilagan delas eller dupliceras per mottagare kunde inte beläggas i detta pass | [batch-sending](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/batch-sending), [send-attachments](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-attachments) |

**Dom på delfrågan: FALSIFIERAD.** Ett-anrop-per-mottagare är INTE
branschnormen — tvärtom stöder tre av fem granskade leverantörer (SES,
SendGrid, och Postmarks kommande Bulk-API) uttryckligen EN delad bilaga i
ETT anrop till MÅNGA mottagare, och en fjärde (Postmarks GA Batch-API) löser
det med en HTTP-rundtripp även om bilagan dupliceras i payloaden. **Resend
är outlier, inte representant för branschen.** Vår loop-arbetsgång (redan
etablerad 2026-08-03) är en kompensation för en Resend-specifik lucka —
inte, som uppdragets ram antydde, ett generellt branschvillkor vi bara
råkar dela med alla andra.

Detta ändrar INTE den tekniska rekommendationen (vi byter inte leverantör,
och loopen är billig vid n≤24) — men det ändrar HUR fyndet ska förstås och
dokumenteras: som en Resend-egenhet att leva med, inte en branschsanning
att luta sig mot.

## Delfråga 5 — Finns en tredje väg?

**Ja, delvis: bifoga OCH länka, samtidigt — Stripes mönster, inte ett eget
påfund.** Eftersom PDF-bytesen enligt det redan fattade
arkitekturbeslutet (2026-08-03) ändå kommer att ligga i Supabase Storage
innan mailet skickas, kostar det i praktiken ingenting extra att LÄGGA TILL
en signerad länk i mailkroppen utöver bifogningen — samma bytes, två
åtkomstvägar. Det ger: bifogningen täcker branschmönstrets
förstahandsförväntan (öppna/skriva ut direkt, ingen extra klick, fungerar
utan nätverksanslutning efter nedladdning) och länken täcker
reservläget (mailklienten strippade bifogningen, mottagaren tappade
mailet men sparade länken, eller filen behöver hämtas på nytt efter att
originalmailet raderats). Detta är INTE detsamma som att välja länk
I STÄLLET FÖR bifogning (delfråga 3:s avvägning) — det är en tillagd
robusthet ovanpå ett redan grundat "bifoga"-beslut, till en marginell kostnad
eftersom lagringen redan finns.

Ingen annan tredje väg (t.ex. Wallet-pass, in-app-visning) hittades som
relevant för Roger & Lottas kontext — de kräver ett konto eller en app
Roger/Lottas deltagare inte har, samma skäl Eventbrite-mönstret (§1) inte
överförs hit.

## Dom

**Det redan fattade beslutet — generera en gång per event, lagra, bifoga i
varje utskick — FÖRSTÄRKS av detta pass, inte omkullkastas.** Två av de tre
hypoteser uppdraget bad mig pröva föll: (1) branschledare bifogar mycket
riktigt PDF:er till precis denna dokumentklass, ofta i kombination med en
länk snarare än i stället för den; (2) deliverability-hypotesen saknar stöd
i förstapartskällor vid vår autentiserings-/volymnivå och bygger delvis på
en sammanblandning med ett orelaterat HTML-rendering-fenomen. Den tredje
frågan — huruvida ett-anrop-per-mottagare är branschnorm — visade sig vara
FALSIFIERAD på ett sätt som INTE ändrar den tekniska planen men som
KORRIGERAR hur den ska motiveras: loopen mot Resend är en
leverantörsspecifik kompensation, inte ett branschvillkor.

**Den avgörande delfrågan var delfråga 2.** Inte för att den ändrar
rekommendationen (den gjorde inte det — bifoga stod redan starkt på
delfråga 1 ensam), utan för att den tar bort den enda tekniska grunden
hypotesen i uppdraget vilade på. Utan en verifierad deliverability-risk
finns ingen kvarvarande anledning att välja bort branschmönstret.

## Vad jag inte kunde belägga

- **Mailguns exakta delnings-mekanik för attachments i batch-sändning**
  (delad en gång, eller duplicerad per mottagare i payloaden) — irrelevant
  för oss (vi använder Resend), men lämnas öppet i tabellen i delfråga 4 i
  stället för gissat.
- **Postmarks nya Bulk-API:s slutliga, allmänt tillgängliga form.** Det är
  early access vid tidpunkten för detta pass — dess "delad en gång"-modell
  kan ändras innan GA. Irrelevant för oss (vi använder Resend) men noterat
  för fullständighet i tabellen.
- **Varför Eventbrite konkret tog bort PDF-biljetter** — den publicerade
  bloggposten ramar det i upplevelse-/säkerhetstermer utan att specificera
  EXAKT vilket hot (skärmdumps-återanvändning? support-belastning?) som
  motiverade beslutet. Registreras som obelagt snarare än gissat.
- **Om Roger & Lottas nuvarande manuella mailutskick (Gmail/Outlook,
  enligt produktkravets ursprung i telefonsamtalet 2026-08-03) någonsin
  haft ett konkret leveransproblem kopplat till bifogningar.** Ingen sådan
  incident är dokumenterad i repot, och detta pass sökte inte i
  mailhistorik utanför repot (ingen sådan källa finns tillgänglig här).
  Frånvaro av dokumenterad incident tolkas INTE som bevis för att inget
  hänt — bara att inget är bokfört.
- **En exakt, mätt siffra på hur stora de faktiskt genererade
  DocRaptor-PDF:erna blir** (klass B: bekräftelsebilaga + deltagarinformation)
  — `pdf-renderingsvagen`-passet mätte enskilda BILDOBJEKT (36,7 KB logga
  m.fl.) i de EXISTERANDE PowerPoint-exporterna, inte en färdig
  DocRaptor-rendering av samma layout. Rimligt att anta samma storleksordning
  (låga hundratal KB), men inte mätt mot den faktiska framtida
  rendering-pipelinen.

## Rekommendation

Detta är en rekommendation, inte ett beslut.

1. **Behåll bifoga som primär leveransform** för bekräftelsebilagan och
   deltagarinformationen — branschmönstret bär det, och
   deliverability-invändningen håller inte vid vår autentiserings-/volymnivå.
2. **Lägg till en signerad Supabase Storage-länk i mailkroppen som
   komplement till bifogningen** (delfråga 5) — samma mönster som Stripe,
   marginalkostnad eftersom bytesen redan ligger i Storage per det redan
   fattade lagringsbeslutet. Detta är en förstärkning, inte ett krav —
   avvisa den om Marcus bedömer att den extra raden i mailkroppen inte är
   värd komplexiteten för en volym på 24 mottagare/event.
3. **Behåll Resend-loopen (singel-`/emails`, en per mottagare) som
   sändmekanik** — men dokumentera i ADR:n (den PRD-146 redan kräver, ej
   ännu mintad — `backlog/tasks/task-182`) att detta är en
   **Resend-specifik kompensation**, inte ett generellt branschmönster.
   Framtida läsare av ADR:n ska inte behöva göra om denna research för att
   förstå VARFÖR loopen finns.
4. **Sätt en uttrycklig giltighetstid på den signerade länken** vid bygget
   (delfråga 3) — inget i detta pass eller det tidigare fastställer rätt
   tal; ett rimligt golv är "minst event-slutdatum + någon buffert för
   bokföring/referens i efterhand", men den avvägningen hör hemma i
   bygg-ADR:n, inte här.

## Källförteckning

**Stripe (förstaparts):**

- [Send customer emails](https://docs.stripe.com/invoicing/send-email) — PDF bifogas som standard
- [Hosted Invoice Page](https://docs.stripe.com/invoicing/hosted-invoice-page) — kombinerad länk+bifogning

**Postmark (förstaparts):**

- [Receipt and invoice email best practices](https://postmarkapp.com/guides/receipt-and-invoice-email-best-practices) — rekommenderar bifogning
- [Bulk Email API](https://postmarkapp.com/bulk-api) — "Defined once, sent to all"
- [Early access-programmet för Bulk-API:t](https://postmarkapp.com/support/article/1311-the-early-access-program-for-the-new-bulk-api) — GA-status
- [Send batch emails](https://postmarkapp.com/developer/user-guide/send-email-with-api/batch-emails) — äldre Batch-API, ≤500 meddelanden, 50 MB

**Ticketmaster (förstaparts):**

- [What ticket delivery options does Ticketmaster offer?](https://help.ticketmaster.com/hc/en-us/articles/9641645631889-What-ticket-delivery-options-does-Ticketmaster-offer) — PDF-bifogning som leveranssätt

**Eventbrite (förstaparts):**

- [Important Update: Eventbrite App Tickets](https://www.eventbrite.com/blog/eventbrite-app-tickets/) — borttagen PDF-biljett, motiv ospecificerat teknisk-skälsmässigt

**Google/Gmail (förstaparts):**

- [Gmail attachment-blockeringspolicy](https://support.google.com/mail/answer/6590) — blockerade filtyper, `.pdf` ej listad
- [Gmail Bulk Sender Guidelines FAQ](https://support.google.com/a/answer/14229414?hl=en) — 5 000 mail/dag-tröskel, ingen attachment-nämning

**Amazon SES (förstaparts):**

- [SendBulkEmail API-referens](https://docs.aws.amazon.com/ses/latest/APIReference-V2/API_SendBulkEmail.html)
- [Send emails with attachments — kodexempel](https://docs.aws.amazon.com/ses/latest/dg/sesv2_example_sesv2_Scenario_EmailAttachments_section.html) — "All recipients receive the same attachment(s)"
- [Amazon SES Attachment-tillkännagivande, april 2025](https://aws.amazon.com/about-aws/whats-new/2025/04/amazon-ses-attachments-sending-apis)

**SendGrid/Twilio (förstaparts):**

- [Personalizations](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/personalizations) — max 1000 personalizations/anrop
- [Mail Send v3 API-referens](https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send) — `attachments` toppnivåfält

**Mailgun (förstaparts):**

- [Batch Sending](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/batch-sending) — ≤1000 mottagare/anrop
- [Sending Messages with Attachments](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-attachments)

**Gmail-clipping (oberoende ESP-supportsidor, korslästa mot varandra):**

- [Mailchimp — Gmail is clipping my email](https://mailchimp.com/help/gmail-is-clipping-my-email/)
- [Klaviyo — Why is my email being clipped?](https://help.klaviyo.com/hc/en-us/articles/115000591251)
- [ActiveCampaign — Why is Gmail "clipping" my email?](https://help.activecampaign.com/hc/en-us/articles/115001060524-Why-is-Gmail-clipping-my-email)

**Tredjeparts (läst med skepsis, marknadsförande blogginlägg):**

- [Mailforge — How Attachments Impact Email Deliverability](https://www.mailforge.ai/blog/how-attachments-impact-email-deliverability) — källa till 110 KB/85 %-siffrorna, blandar HTML-clipping med attachments
- [Email Vendor Selection — Sending Attachments with Transactional Emails](https://www.emailvendorselection.com/email-attachments-transactional-email/)

**Interna källor:**

- [`docs/research/utskicks-bilage-arkitektur-2026-08-03.md`](utskicks-bilage-arkitektur-2026-08-03.md) — Resend-batch-bristen, Storage-mönstret (redan grundat, ej omtaget)
- [`docs/research/pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md`](pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md) — renderingsvägen (annan axel, inte omtagen)
- [`backlog/tasks/task-146`](../../backlog/tasks/task-146%20-%20PRD-Bilage-fundamentet-—-delad-hemvist-tre-dokumentklasser-och-PDF-generering-inom-plattformen.md) — PRD, "inget externt beroende"-linjen
- [`backlog/tasks/task-182`](../../backlog/tasks/task-182%20-%20ADR-för-bilage-hemvisten-—-PRD-146-kravet-ouppfyllt-genom-146.1–146.4.md) — ännu ej mintad ADR för bilage-hemvisten
- [`docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md`](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md) — sändkontraktet loopen kompletterar
- [`tasks/sessions/2026-08-17-session-107.md`](../../tasks/sessions/2026-08-17-session-107.md) Del 14 § D — Marcus pushback som styrde föregående pass, samma disciplin gäller här
