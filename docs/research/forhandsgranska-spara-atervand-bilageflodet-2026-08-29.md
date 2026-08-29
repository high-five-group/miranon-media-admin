---
owner: marcus803
updated: 2026-08-29
review_by: 2026-11-29
status: draft
---

# Förhandsgranska → skapa → visa resultat: bilageflödets form (2026-08-29)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört
> OISOLERAT i huvudkatalogen på grenen `docs/s113-fodelse`, HEAD
> `cfbaa449`. Committar inget. Beställt på Marcus prod-röktest 2026-08-29
> (S113), ordagrant citerat i uppdraget och i `TASK-309.38`s beskrivning.
> Passet BESLUTAR ingenting — det belägger, och matar en grillning Marcus
> själv startar.
>
> **Inventering FÖRE första sökningen** (passets första handling, per
> kontraktet). `ls docs/research/` (137 poster) + `ls docs/decisions/`
> (127 ADR:er) lästes; nio filer öppnades. Vad som REDAN täcks:
>
> | Redan täckt | Var |
> |---|---|
> | Källformat vs artefakt · vilken YTA förhandsgranskningen visas i · WYSIWYG-glappet | [`forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22.md`](forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22.md) |
> | Varför `blob:` laggar och en nätverks-URL inte gör det (sex mätta armar) | [`pdf-forhandsgranskning-leveransvag-blob-vs-url-2026-08-22.md`](pdf-forhandsgranskning-leveransvag-blob-vs-url-2026-08-22.md) · [`pdf-scrollprestanda-pdfium-chrome-2026-08-22.md`](pdf-scrollprestanda-pdfium-chrome-2026-08-22.md) |
> | Servervägarnas optionsrymd (utkast · hosted docs · EF som GET-svarar) | [`pdf-forhandsgranskning-serverlosning-natverkstjanst-2026-08-22.md`](pdf-forhandsgranskning-serverlosning-natverkstjanst-2026-08-22.md) |
> | Var användaren hamnar efter en avfyrad HANDLING + GOV.UK:s kriterium bekräftelsesida vs banner + fokus vid utfall | [`post-send-tillstandet-bulkutskick-2026-08-08.md`](post-send-tillstandet-bulkutskick-2026-08-08.md) |
> | Notis-taxonomin, toast-persistens, WCAG 2.2.1:s carve-out | [`uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`](uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md) → [`ADR-121`](../decisions/ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md) |
> | DocRaptor-latens och teckenkodning mot VÅRA mallar | [`docraptor-minimaltest-2026-08-22.md`](docraptor-minimaltest-2026-08-22.md) |
>
> **Beslut som redan avgjort delar av frågan** — lästa i sin helhet, inte
> skummade: [`ADR-119`](../decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md)
> (extern motor, EN generering per event, invalidering),
> [`ADR-124`](../decisions/ADR-124-forhandsgranskningens-leveransvag-transient-utkast-i-storage.md)
> (utkast-vägen, beslut 4 om origin, beslut 5 om att Marcus hand är
> acceptansen), [`ADR-125`](../decisions/ADR-125-bilagornas-modell-och-promoveringsvag.md)
> (§ 3 härledd inaktualitet, § 4–5 en renderare) och `ADR-121`
> (notistrappan). § 5 nedan är därför strukturerad som *"håller
> beslutens skäl fortfarande?"*, inte som en öppen fråga.
>
> **Vad som är ÅLDRAT och därför omprövat riktat.** Ett bärande led i
> 2026-08-22-passet — *"iframe-inbäddad PDF är strukturellt trasig på iOS
> Safari"* — vilade på källor från 2015–2020 (iOS 8-eran). Det ledet är
> **falsifierat för iOS 26+** (§ 6). Det är passets enskilt viktigaste
> omprövning, eftersom hela konvergensen mot "ny flik" byggde på att
> alternativet var sönder.
>
> **Vad som är NYTT i detta pass:** de fyra axlar 2026-08-22-passet
> uttryckligen INTE undersökte — regenerering vid spara, landningsyta,
> kvittoform, markering — plus plattformsväggarna för promovering, PDF-
> determinismen, och en genomlysning av vår egen kod som fällde tre
> premisser (§ 0).
>
> **Källdisciplin, med en varning.** Externa sidor hämtade 2026-08-29.
> Ett delpass fångade att WebFetch:s sammanfattningsmodell **fabricerade
> ett verbatim-citat** (en Visma-mening som inte finns på sidan). Varje
> citat nedan som bär extra vikt är därför antingen (a) hämtat två gånger
> oberoende, eller (b) hämtat av mig själv som fulltext. Citat som vilar
> på EN maskinell sammanfattning är märkta.

## Kort svar

**Branschen har ingen "förhandsgranska, rendera om vid spara"-modell.
Sju av åtta undersökta aktörer PROMOVERAR samma objekt över spara-gränsen
i stället för att skapa ett nytt.** Stripe är skarpast: PDF:en existerar
inte alls före `finalize` — *"If the invoice has not been finalized yet,
this will be null."* Fortnox och Xero löser samma sak från andra hållet:
fakturan är **redan sparad** när du förhandsgranskar (Fortnox tvingar
fram en save, Xero autosparar var few seconds), så preview och
slutdokument kan strukturellt inte divergera. **Vårt dubbelrenderande
flöde har alltså noll precedent bland åtta undersökta leverantörer.**
Marcus formulering *"detta kan omöjligen vara branschstandard"* håller.

**Kostnaden är däremot inte argumentet — den är noll kronor.** DocRaptor
säljer flata månadsplaner; Basic är 125 dokument för 15 USD. `ADR-119`
räknar ~5,5 genereringar/månad; med dubbelrendering ~11. Elva mot 125 —
den andra renderingen kostar **0 kr** och gör det tills volymen
tiodubblas. Argumenten för att sluta rendera om är tre andra:
**integritet** (§ 2), **~1 s serverside + 2–3 s round-trip mindre att
vänta** (§ 4), och **ett fönster mindre**.

**Integritetsargumentet är starkare än väntat, och det är mätt:**
DocRaptor slumpar PDF:ens `/ID` per anrop och exponerar ingen väg att
styra det. **En omrendering är därför ALDRIG byte-identisk med den fil
Lotta granskade — inte ens när underlaget är oförändrat.** Vår egen
interna källa som såg ut att bevisa motsatsen mätte i själva verket bara
byte-ANTAL (§ 2.3).

**Marcus punkt 4 (skicka Lotta tillbaka till dokumentvyn med raden
markerad) är den svagaste delen av röktestets förslag** — och det av tre
skäl som alla ligger i vår egen kod, inte i branschen. (1) Husets egen
skapa-precedent, `CreateEventForm.tsx`, säger uttryckligen motsatsen:
*"ingen automatisk omdirigering (skapandet ska KVITTERAS, inte bara
hända)"*. (2) Dokumentlistan **kollapsar rader per filnamn**, och
filnamnet är deterministiskt per (event × mall) — den "nya raden" finns
oftast inte som en ny rad, den ersätter tyst en befintlig. (3) **Noll av
åtta** undersökta leverantörer dokumenterar markering av ett nyskapat
objekt i en lista.

**Det största fyndet ligger utanför frågan:** ett andra klick på "Skapa"
är redan trasigt idag. Det skapar en dubblett med samma namn, som
kollapsar bakom "+1 äldre fil", och som **inte går att radera** från
appen — event-egna bilagerader har ingen Radera-knapp. Skapandet är
alltså irreversibelt, vilket gör förhandsgranskningen till det enda som
bär WCAG 3.3.4 (§ 3.1).

**Om options:** ingen av A/B/C räcker ensam. Domen i § 7 är **A + E**
(promovera utkastet, och låt ett upprepat Skapa gå ERSÄTT-vägen), med
kvittensen kvar på plats i husets egen form — inte automatisk
omdirigering. **C är återöppnad av iOS-fyndet men fortfarande obevisad
på den enda axel som avgjorde saken förra gången: Marcus scroll.**

## 0. Premisserna — prövade mot disk, tre föll

Uppdraget källmärkte sitt nuläge (`ADR-086`). Varje adress är prövad.
Bekräftade: `GenereringsVy.tsx:727–800`, `:1075–1114`,
`skriv-laddningssida.ts:139`, båda hookarna, EF:ens ordning, ADR-124/125.

Tre premisser i den vidare bilden föll:

**(a) Renderingen sker FÖRE preview-grenen, inte i den.**
`generate-event-attachment/index.ts` anropar `renderaMallPdf` på rad ~228
och `berakaKallhash(mallData)` på rad 234 — BÅDA före `if (preview)` på
rad 241. Följden är att **preview-grenen redan har räknat ut källhashen
och kastar bort den**. Option A behöver alltså ingen ny beräkning; den
behöver att ett redan beräknat värde returneras.

**(b) "Skapa" två gånger ger en oraderbar dubblett.**
`useGenereraEventBilaga`s eget docblock: *"Skapar ALLTID en ny rad
(aldrig `ersatt`) — upprepade klick kan ge dubbletter"*. Filnamnet är
deterministiskt (`${meta.namnPrefix} – ${sources.event.eventlabel}.pdf`,
EF rad 227), och `DokumentYta.tsx:337` `grupperaPerNamn` grupperar per
namn och visar bara `lista[0]` med `dolda: lista.length - 1`. Servern
sorterar nyast först (`get-event-attachments/index.ts:214,270`), så den
nya filen blir den synliga och den gamla göms som "+1 äldre fil".
`BilageRadRow` (rad 1395–1470) erbjuder Förhandsvisa · Ladda ner ·
Skapa om · Ersätt — **ingen Radera**; standalone-Radera finns bara i
räckviddsläget (`DokumentYta.tsx:390–393`).

**(c) Huset har redan en skapa-kvittens, och den flyttar fokus.**
Den tidigare research-domen *"Ingen befintlig kod i repot flyttar fokus
TILL en resultat-yta"* (post-send-passet, 2026-08-08) var **redan falsk
när den skrevs**. `CreateEventForm.tsx:133–137` + `:191–215`, landad
`2ab90224` **2026-07-22**, ersätter formuläret med en `MessageBox
intent="success"`, flyttar fokus dit (`bekraftelseRef`, `tabIndex={-1}`)
och erbjuder TVÅ navigeringar som val. Kodkommentaren är den viktigaste
meningen i hela detta pass:

> `// klick bort (till eventet eller tillbaka till listan). Ersätter`
> `// formuläret; ingen automatisk omdirigering (skapandet ska KVITTERAS,`
> `// inte bara hända).`

## 1. Branschledarnas mönster (delfråga 1)

Åtta aktörer mot förstapartsdokumentation. Tabellen är jämförelsen
grillningen läser först; `—` betyder **ej dokumenterat**, aldrig "gör
inte".

| Aktör | Förhandsgransknings-form | Regenereras vid spara? | Landningsyta | Kvittoform | Markering av ny post |
|---|---|---|---|---|---|
| **Stripe Invoicing** | "Review invoice"-steg i editorn | **Nej — promovering.** Samma `in_…`-objekt, `draft`→`open`. PDF:en **finns inte före** finalize | — | — | — |
| **Fortnox** | Verktyg *Förhandsgranska*, visas **som PDF** | **Nej — promovering, med sidoeffekt:** *"om fakturan förhandsgranskas så sparas fakturan automatiskt"* | Kundfaktura-listan¹ | — | — |
| **Visma eEkonomi / Spiris** | Knapp *Förhandsgranska* nederst till vänster | — | *"Fakturan sparas under Obetalda fakturor"* | — | — |
| **Xero** | Preview-LÄGE på en **redan sparad** faktura | **Nej — promovering.** *"Xero will save the invoice every few seconds"* | Awaiting Payment-fliken² | — | — |
| **QuickBooks Online** | Ingen preview i nuvarande primärartikel | — (endast 7 år gammalt community-påstående) | — | **Status på posten:** *"The invoice status shows Sent"* | — |
| **DocuSign** | **Preview-läge i samma fönster**, stegvis per mottagare | **Nej — promovering.** Samma envelope, `created`→`sent` | Agreements page (vid Discard) | — | — |
| **Adobe Acrobat Sign** | *"Preview & add fields"* → authoring-miljö; *"Review and send"*-sida | **Nej — promovering.** Save = Draft på Manage page; Send startar flödet | **Manage page** | **Egen bekräftelsevy** med tre nästa-steg | — |
| **Shopify (draft order)** | **Dialog/modal:** *"Click Review invoice. In the dialog, review your invoice"* | **Nej — promovering.** `draftOrderComplete` *"converts it into a regular order"* | **Orders page** | — | — |

¹ Via WebFetch-sammanfattning, ej verbatim-verifierat i browser.
² Citatet härrör ur Xero **Practice Manager / Partner Hub**-artiklar, inte
kärnprodukten — behandla som svagare belägg.

**Det entydiga mönstret:** sju av åtta promoverar. Ingen renderar om.
Stripes formulering är den skarpaste, verbatim ur
`docs.stripe.com/api/invoices/object`:

> "`invoice_pdf` … The link to download the PDF for the invoice.
> **If the invoice has not been finalized yet, this will be null.**"

Och finalize är ögonblicket artefakten föds (verifierat av mig själv som
fulltext, `docs.stripe.com/invoicing/integration/workflow-transitions`):

> "Finalizing an invoice does the following: … **It generates a unique
> URL where someone can pay the invoice, and a link to download a PDF of
> the invoice.**"

Skälet Stripe anger är juridiskt, inte tekniskt: *"This is to satisfy the
common tax-compliance requirement that finalized invoices be
retained—as they were finalized—for a legally required minimum time
period."*

**Två distinkta lösningar på samma problem, och båda är relevanta för
oss.** Stripe/DocuSign/Shopify/Adobe gör dokumentet till **ett objekt med
tillstånd** (draft → låst). Fortnox/Xero gör i stället **sparandet
osynligt tidigt** — du kan inte titta på något som inte redan är sparat.
Båda eliminerar glappet mellan granskat och sparat; ingen av dem gör det
genom att rendera två gånger.

**Landningsytan är svagare belagd än förhandsgransknings-formen.** Fyra
av åtta säger var posten hamnar (lista/Manage/Orders/Obetalda); **ingen
säger var ANVÄNDAREN hamnar** med samma tydlighet, utom Adobe. Adobe är
också den enda med en dokumenterad kvittensvy:

> "**You'll see a confirmation message with options to:** Save the
> agreement as a template / Track the agreement / Send another
> agreement"

Det är exakt formen `CreateEventForm.tsx` redan bär hos oss: en
bekräftelse med nästa-steg som VAL.

**Markering i lista: noll av åtta.** Ingen leverantör dokumenterar att en
nyskapad post markeras. Frånvaro av dokumentation är inte frånvaro av
funktion — men det finns **inget branschbelägg att luta ett beslut mot**,
och räkningen fejkas inte.

## 2. "What you see is what you save" (delfråga 2)

### 2.1 Den normativa kärnan är WCAG 3.3.4 — och den är ett ELLER

Verifierad av mig direkt mot W3C (nivå **AA**):

> "For web pages that cause legal commitments or financial transactions
> for the user to occur, **that modify or delete user-controllable data
> in data storage systems**, or that submit user test responses, at least
> one of the following is true: **Reversible:** Submissions are
> reversible. **Checked:** Data entered by the user is checked for input
> errors and the user is provided an opportunity to correct them.
> **Confirmed:** A mechanism is available for reviewing, confirming, and
> correcting information before finalizing the submission."

Intent: *"The intent of this success criterion is to help users with
disabilities avoid serious consequences as the result of a mistake when
performing an action that cannot be reversed."*

**Två konsekvenser som pekar åt olika håll.** Förhandsgranskningen ÄR
"Confirmed" — men kriteriet är ett ELLER, så en **reversibel** operation
uppfyller det utan förhandsgranskning alls. Hos oss finns ingen
reversibilitet i UI:t (§ 0 b), vilket gör förhandsgranskningen till det
enda ledet som bär kriteriet — och den är valfri. Ärlig
tillämpningsgräns: bokstaven säger *"modify or delete"*, och att SKAPA en
ny bilaga är varken; *"Skapa om"* (som skriver över filen på samma
lagringsnyckel) ligger däremot klart innanför. Jag övertolkar inte
kriteriet till att täcka mer än det säger.

### 2.2 GOV.UK ger formen, Microsoft ger avvägningen

GOV.UK "Check answers" (verifierad av mig som fulltext):

> "Let users check their answers before submitting information to a
> service." … Mönstret hjälper till att *"reduce error rates as users are
> given a second chance to notice and correct errors before submitting
> data"*. … "You should provide a **'Change' link** next to each section
> … When they've finished, the 'Continue' button should return them to
> the check answers page."

Det är precis vår genereringsvy: blocken listade, var och en ändringsbar,
med en Skapa-knapp sist. **Vi har redan check-answers-mönstret — det som
saknas är att förhandsgranskningen och sparandet delar artefakt.**

Microsofts Win32-UX-guide är den enda källa som DEFINIERAR principen och
samtidigt nyanserar den:

> "Historically, the most fundamental principle for the printing user
> experience is known as WYSIWYG … This principle suggests that there
> should be a strong relationship between what is seen on the display and
> what is printed."
> "it's better to have a print preview that renders quickly and is
> accurate enough … than to have a completely accurate preview that
> renders slowly."
> "**Don't rely on users finding problems using the print preview.**"

Den sista meningen är värd att ta med i grillningen: förhandsgranskningen
är inte ett skyddsnät som ersätter att systemet gör rätt av sig självt.

### 2.3 Är en omrendering byte-identisk? Nej — mätt

Detta avgör om dagens dubbelrendering är *slösaktig* eller *felaktig*.

**Mätt av delpasset mot DocRaptor:** `/ID`-paret i PDF:ens trailer
**slumpas per anrop** och kan inte styras — belagt i tre led: fältet
saknas bland DocRaptors 33 dokumenterade `prince_options`, en
`pdf_id`-parameter **strippas vid API-gränsen** (kontots egen doc-logg
visar `"prince_options": {}` för probe-anropet), och `/ID` varierade
ändå mellan två anrop med identisk indata. Tidsstämplar är däremot
**inte** problemet: Prince skriver varken `/CreationDate` eller
`/ModDate` som default.

ISO 32000-1 § 14.4 formulerar `/ID`-receptet som `should`, med en NOTE
att beräkningen *"need not be reproducible"* — deterministisk `/ID` vore
alltså spec-lagligt. Det är en produktbegränsning hos DocRaptor, inte en
omöjlighet.

**Och vår egen interna källa som såg ut att bevisa determinism gör det
inte.** [`docraptor-minimaltest-2026-08-22.md`](docraptor-minimaltest-2026-08-22.md)
skriver *"PDF-bytesen var byte-för-byte identiska över samtliga
körningar"* — men parentesen direkt efter avslöjar mätningen: *"(samma
`bytes`-värde per mall i alla tre)"*. Jag hämtade upp mätskriptet ur
git (`git show 0563adae:scripts/docraptor-minimaltest.mjs`, filen är
sedan riven): `bytes: Number(res.headers.get('x-pdf-bytes'))`. Det är
byte-ANTAL ur en header — ingen hashning, ingen innehållsjämförelse. Ett
`/ID` med fast längd ändrar inte storleken. Påståendet går alltså utöver
sitt eget belägg (`ADR-083`-klassen), och är rättat här.

**Slutsatsen är robust åt båda håll.** Om renderingar vore deterministiska
vore dagens dubbelrendering bara slöseri. Eftersom de bevisligen inte är
det, sparar Lotta idag en fil som **inte är den hon godkände** — samma
innehåll, andra bytes. Att promovera de granskade bytesen är alltså minst
lika korrekt och strikt snabbare, oavsett hur determinismfrågan hade
fallit.

### 2.4 Stale preview — ingen UX-källa täcker det

Delpasset sökte NN/g, GOV.UK, Material och W3C. **Ingen riktlinje
adresserar att underlaget ändras mellan förhandsgranskning och spara.**
GOV.UK check-answers säger uttryckligen ingenting om det (verifierat av
mig: *"The page does not mention anything about underlying data changing
between the check and submission."*).

Mönstret finns i stället på protokoll- och datalagernivå, och båda
källorna ger samma UI-svar: **avvisa skrivningen och visa skillnaden.**
MDN om optimistisk låsning:

> "If the ETag doesn't match the original file … the change is rejected
> with a `412 Precondition Failed` error. **It is then up to the client to
> deal with the error: either by notifying the user to start again (this
> time on the newest version), or by showing the user a *diff* of both
> versions, helping them decide which changes they wish to keep.**"

Microsofts EF Core-dokumentation namnger de tre värdemängderna (Current /
Original / Database) och säger att sammanslagningen *"may be directed by
a user interface, where both sets of values are displayed."*

**Detta är exakt option A:s hash-jämförelse, med etablerat namn.**
Källhashen ÄR vår ETag. Ordalydelsen för meddelandet är däremot obelagd i
varje förstapartskälla — den får vi skriva själva, mot copy-golvet i
`DESIGN-SYSTEM-SPEC.md` § 21.

## 3. Återvänd, markera, kvittera (delfråga 3)

### 3.1 Ska Lotta skickas tillbaka? Regeln finns, och den är GOV.UK:s

Post-send-passet (2026-08-08) grävde fram kriteriet och citerar det
verbatim:

> "Use a Confirmation page in a linear service to tell users that they've
> finished using the service instead of a notification banner." …
> "Using a notification banner is unlikely to be the right approach in a
> linear service."

Passet tillämpade det på **åtgärds-sidan** och landade i "stanna kvar",
eftersom den sidan är en STÅENDE arbetsyta. **Genereringsvyn är den
motsatta klassen:** den öppnas för EN uppgift (skapa ett dokument för ett
event) och är slut när dokumentet finns. Samma regel pekar alltså åt
andra hållet här — mot en bekräftelse som avslutar, inte en banner mitt i
ett pågående arbete.

**Men "bekräftelsesida" betyder inte "navigera bort".** Husets egen form
(§ 0 c) uppfyller GOV.UK:s syfte utan route-byte: bekräftelsen ERSÄTTER
formuläret på plats, tar fokus, och erbjuder navigeringarna som val.
Adobe Acrobat Sign gör exakt samma sak (§ 1). Att i stället
auto-omdirigera vore ett avsteg från både husets precedent och den enda
leverantör som dokumenterar sin kvittensvy.

### 3.2 Markeringen är svagare än den låter — tre skäl i vår egen kod

1. **Det finns oftast ingen ny rad att markera.** `grupperaPerNamn`
   kollapsar per namn, och namnet är deterministiskt per (event × mall)
   (§ 0 b). En andra bilaga för samma event och mall blir inte rad två —
   den blir samma rads nya `current`.
2. **Markeringen får inte bäras av färg ensam.** Radens egen konvention
   är redan satt: `INAKTUELL` renderas som `StatusBadge` med TEXT
   uttryckligen för WCAG 1.4.1 (`DokumentYta.tsx:1291–1295` och dess
   kommentar). En "Ny"-markering måste följa samma form — en badge med
   ord, inte en tonad bakgrund.
3. **Scrollen följer inte med.** `nuqs` 2.9.5 defaultar `scroll = false`
   och `history = 'replace'` (mätt i `node_modules/nuqs/dist/index.js`
   rad 485), och routens `onTillbaka` skickar inga options. Listan
   renderas alltså på genereringsvyns scrollposition, och raden kan ligga
   utanför vyn. En markering ingen ser är ingen markering.

### 3.3 Fokus efter navigering — två auktoritativa källor säger olika

Detta är en genuin konflikt som måste avgöras medvetet, inte blandas.

- **GOV.UK notification banner** (verifierad av mig som fulltext):
  success-varianten bär `role="alert"`, ska placeras *"immediately before
  the page `h1`"*, och *"JavaScript moves the keyboard focus to the
  notification banner when the page loads"* (avstängbart via
  `disableAutoFocus`). Plus varningen: *"There's evidence that people
  often miss them"*, och *"Remove a green notification banner when the
  user moves to a new page."*
- **MDN om `role="status"`**: *"**Do not give focus to the status when
  its content updates.** … If a situation requires that focus needs to be
  moved, then using a `status`, or other live region, are likely not
  appropriate."*

De är inte i motsägelse — de gäller olika roller — men de tvingar fram ett
val: **antingen** en `alert`-yta som tar fokus (GOV.UK-vägen, och husets
`CreateEventForm`-väg), **eller** en `status`-live-region utan fokusflytt.
Att göra båda ger dubbelannonsering. Vår `MessageBox` väljer redan
automatiskt: `role = intent === 'error' || intent === 'warning' ? 'alert'
: 'status'` (`MessageBox.tsx:118`) — en success-ruta är alltså en
`status`, och MDN säger då att fokus INTE ska flyttas dit. Att
`CreateEventForm` ändå flyttar fokus dit är en medveten avvikelse med ett
gott skäl (knappen som trycktes försvinner ur DOM); den bör namnges som
sådan, inte upprepas oreflekterat.

**En mätning som saknas och som är billig att göra:** `RouteAnnouncer.tsx`
prenumererar på `router.subscribe('onResolved')` och annonserar routens
`staticData.title` när `href` ändras. `nuqs` TanStack-adaptern anropar
`router.navigate(...)` vid VARJE query-ändring (mätt i
`node_modules/nuqs/dist/adapters/tanstack-router.js`). Att gå från
`?vy=generering` tillbaka till listan borde alltså annonsera *"Dokument"*
igen — vilket i så fall krockar med en samtidig bekräftelse-annonsering.
**Detta är härlett ur källkod, INTE kört** (repot har noll tester på
`RouteAnnouncer`). Mät med skärmläsare eller ett Playwright-assert innan
en form låses.

### 3.4 Toast — vad som är tillåtet, och varför detta troligen inte är toast-klassen

`ADR-121` § 4 och `DESIGN-SYSTEM-SPEC.md` § 21 placerar *"Uppgiftsgenererad
bekräftelse"* i toast-klassen ("överlagrad, får auto-döljas"), och
`ORDLISTA.md` noterar att klassen är **ännu inte byggd**. Tre belägg
avgränsar vad en sådan toast får göra:

- **WCAG 2.2.1 Timing Adjustable (nivå A)** tillåter auto-döljning bara
  när informationen går att nå på annat sätt. Understanding-dokumentets
  carve-out, verbatim: *"**Users are able to identify the arrival of email
  through other means, such as viewing the Inbox**, so the disappearance
  of the message does not set a time limit."* **Tillämpat:** en toast som
  säger "Bekräftelsebilagan är skapad" får auto-döljas — bilagan finns i
  listan. En toast vars "Öppna bilagan"-knapp är **enda** vägen till PDF:en
  får det inte. Hos oss finns Förhandsvisa på raden, så vägen finns —
  men bara om Lotta faktiskt är på dokumentvyn.
- **WCAG 2.4.11 Focus Not Obscured (nivå AA):** *"When a user interface
  component receives keyboard focus, the component is not entirely hidden
  due to author-created content."* Sidan pekar ut *"Non-modal dialogs
  similarly risk obscuring focused items"*. `ADR-121`s facit placerar den
  överlagrade notisen `fixed right-4 bottom-24` — **det är exakt den
  geometri kriteriet varnar för**, och en fråga att lösa när toast-klassen
  faktiskt byggs.
- **NN/g:** *"a toast … while appropriate for passive notifications,
  would be a bad way to implement an error message"*, med den mätta
  instansen där en användare väntade fem minuter på innehåll som redan
  fallerat.

**Ingen riktlinjekälla anger en varaktighet i sekunder.** Materials egen
dokumentation gör det inte; de citerade talen (1500 / 2750 ms) kommer ur
Material Components for Android-**källkoden**. NN/g:s mätta instans säger
att 5 s var för kort. Gmail är den enda förstaparten som löser spänningen
— genom att göra fönstret konfigurerbart (5/10/20/30 s), alltså WCAG:s
"Adjust".

**Domen för vår yta:** att skapa en bilaga är inte en passiv notis. Det är
slutpunkten på en uppgift, resultatet är irreversibelt i UI:t (§ 0 b), och
Lotta vill sannolikt öppna dokumentet direkt. Det är **bekräftelse**-formen
(MessageBox + fokus + nästa-steg som val), inte toast-formen. Toast passar
de INCIDENTELLA kvittenserna inuti flödet — *"Rönninge har nu parkering
som standard"* — inte flödets slutpunkt.

## 4. Plattformsväggarna för option A (delfråga 4)

**Allt A behöver finns, och det mesta finns redan i koden.**

| Fråga | Svar | Belägg |
|---|---|---|
| `copy()` inom bucket? | **Ja.** `copy(fromPath, toPath, options?)`, `options.destinationBucket` för korsning | Supabase JS-referens; guiden: *"You can copy objects between buckets or within the same bucket"* |
| Bevaras anpassad metadata vid copy? | **Ja, som default** — `copyMetadata: request.body.copyMetadata ?? true` i `copyObject.ts`; tre förstaparts-tester binder beteendet | `supabase/storage`-källkod + `src/test/object.test.ts` |
| Vid move? | Ja — `user_metadata: sourceObj.user_metadata`, ovillkorligt. **Ingen testtäckning** | `src/storage/object.ts` |
| Anpassad metadata vid upload? | **Ja.** `FileOptions.metadata?: Record<string, any>` → header `x-metadata` (base64-JSON) → kolumnen `storage.objects.user_metadata` | JS-referens + serverkälla |
| Läsa tillbaka? | `info(path)` returnerar `metadata: obj.user_metadata` | `src/storage/renderer/info.ts` |
| **`list()` returnerar den?** | **NEJ** — öppen issue `supabase/storage#759` sedan 2025-09-11 | förstaparts-issue |
| Uppdatera metadata efter upload? | **Nej** — `getMetadata`/`updateMetadata` är utkommenterade i storage-js 2.111.0 | installerad källa |
| Versionskrav | `copy`/`destinationBucket`: `storage-js` **2.6.0** / `supabase-js` **2.43.5**. `metadata`/`info`: **2.7.0** / **2.45.2** | release-noter |
| Vad vi kör | klient **2.111.0** (låst); EF:erna `esm.sh/@supabase/supabase-js@2` i **16 filer** — flytande, löser i dag till **2.112.4** | `package-lock.json`, grep i `supabase/functions/` |
| REST-väg utan `supabase-js`? | Ja: `POST /storage/v1/object/{copy,move}`. `copyMetadata` finns i REST men **exponeras inte** av `storage-js` | self-hosting-referensen |

**Metadata är dock inte det enklaste sättet att bära hashen.** Tre skäl:
den saknas i `list()` (issue #759), den kan inte uppdateras i efterhand,
och den är **odokumenterad i Supabases guider** (noll träffar på
`x-metadata`/`copyMetadata` i hela `llms-full.txt`) trots att beteendet är
belagt i källkod och tester. Ytan fick dessutom en buggfix så sent som
2026-07-20 (`supabase/storage#1111`, *"S3 Copy reads user metadata now"*).

**Det finns två billigare bärare, och den ena kräver ingen Storage-läsning
alls.** (a) Hashen läggs i **utkastets objektnamn**
(`utkast/<eventId>/<typ>-<hash>.pdf`) — namnet är den enda identifierare
som garanterat överlever `copy`, det är läsbart utan extra anrop, och
`list(prefix)` hittar det. Men det bryter `ADR-124` beslut 2:s
`upsert`-invariant (ett objekt per event och typ) och måste då kompletteras
med en städning. (b) **Preview-svaret returnerar hashen till klienten**,
som skickar tillbaka den vid Skapa; EF:en räknar om dagens hash server-side
och promoverar bara vid likhet. Hashen är då ett påstående från klienten,
men den **verifieras** mot serverns egen omräkning, så klienten kan inte
ljuga sig till en promovering av fel underlag — bara till ett misslyckat
försök. Väg (b) kräver noll nya Storage-egenskaper och är därför den
minsta ändringen.

### Vad den sparade renderingen faktiskt är värd

**I kronor: noll.** DocRaptors planer (hämtade två gånger oberoende,
`docraptor.com/plans` — `/pricing` ger 404):

| Plan | Dok/mån | Pris/mån | Overage |
|---|---|---|---|
| Free | 5 | $0 | **ingen tillåten — genereringen stoppas** |
| Basic | 125 | $15 | 12 ¢ |
| Professional | 325 | $29 | 9 ¢ |
| Premium | 1 250 | $75 | 6 ¢ |
| Max | 5 000 | $149 | 3 ¢ |

`ADR-119` § Konsekvenser räknar **~5,5 genereringar/månad** (30 event ×
2 dokument). Med dubbelrendering ~11. Basic inkluderar 125. Marginalen
mellan 5,5 och 11 kostar alltså **0 USD** — och gör det tills volymen
ökar elvafalt. Styckpriset (0,12 USD ≈ 1,14 SEK på Basic; USD/SEK
9,5237, ECB 2026-08-28) är relevant först vid overage.

**I tid: 1–3 sekunder per Skapa.** Ur DocRaptors egen dokumentlogg för
VÅRT konto (100 senaste renderingar, 2026-08-28→29): `test: true` n=98,
**median 1,0 s**; `test: false` n=2, median 0,5 s; noll misslyckade.
Round-trip från Sverige mättes till 2,3–3,0 s; vår egen S108-mätning gav
EF-latens 2,9–3,4 s och klient-latens 4,3–5,5 s. **Det är den vinsten
Lotta faktiskt känner** — Skapa blir en Storage-kopiering i stället för en
motorrendering.

## 5. Håller ADR-124/125:s skäl fortfarande? (delfråga 5)

**ADR-124 beslut 1–3 (utkast i Storage, signerad URL): håller
oförändrat.** Ingenting i detta pass rör mätningen som bar dem.

**ADR-124 beslut 2 (utkastet är transient, ett per event och typ):
option A river den INTE.** A kopierar utkastets bytes till eventets
prefix; utkastet förblir transient och tas bort av `rensaUtkast` precis
som i dag. Det som blir varaktigt är kopian, inte utkastet. Men A gör
utkastet till en **funktionell förutsättning** för ett snabbt Skapa, och
utkast kan försvinna (staging-purgens `utkast-drafts`-target, `upsert`
från en annan mall). **A måste därför alltid ha en falla-tillbaka-väg som
renderar** — degradering, inte fel.

**ADR-124 beslut 3 (noll konsument-synliga sidoeffekter): håller.** Under
A skapas fortfarande ingen Bilagor-rad, inget kvittonummer och inget mail
av en förhandsgranskning.

**ADR-124 beslut 4 (aldrig under appens origin) mot option C: ingen
konflikt i bokstaven, men läs den noga.** Beslutet förbjuder att
utkast-URL:en läggs under appens domän, med skälet att `src/sw.ts`s
`NavigationRoute` serverar `index.html` för varje NAVIGERING under appens
origin. En `<iframe src="https://<ref>.supabase.co/…">` håller URL:en
cross-origin och rör inte den mekanismen. **Men om Service Workern fångar
en cross-origin iframe-laddning är OBELAGT** — delpasset kunde inte hämta
W3C:s Handle-Fetch-algoritm i tillräcklig detalj, och jag har inte mätt
det i DevTools. Behandla som hypotes, inte som klarsignal.

**ADR-124 beslut 5 (acceptansen är Marcus scroll, inte ett mekaniskt
bevis): håller, och binder detta pass.** Ingen agent kan avgöra option C.
Riggen bevisade en gång att SW-vägen öppnade *identiskt* med http-vägen —
och Marcus hand fällde den ändå.

**ADR-125 § 3 ("regenerering är ERSÄTTNING", "aldrig tyst regenerering")
mot option A:s hash-matchning: ingen konflikt — A stärker beslutet.**
§ 3:s kärna är att en INAKTUELL bilaga aldrig får regenereras automatiskt
bakom Lottas rygg; markeringen ska vara ett val hon ser. Option A gör
motsatsen till en tyst automat: vid hash-LIKHET renderas ingenting alls,
och vid hash-SKILLNAD renderas om **med ett synligt besked** att
underlaget ändrats sedan förhandsgranskningen. Det är mer transparent än i
dag, inte mindre. Den verkliga kostnaden är en **koppling**: `Källhash`
blir både inaktualitets-ankare och promoveringsnyckel. Den kopplingen bör
namnges i ett beslut, inte glida in.

**ADR-125 § 5 (`test`-flaggan ur `ENVIRONMENT`): oförändrad, och den
förklarar en siffra.** I prod betalas både förhandsgranskning och
skapande; i staging är båda gratis och vattenstämplade (*"All DocRaptor
plans have unlimited test documents … Test PDFs will be watermarked."*).
Det syns i doc-loggen: **98 av våra 100 senaste renderingar var
`test: true`**.

**ADR-119 beslut 3 (en generering per event och dokumenttyp): den är i
praktiken redan bruten av flödet.** Beslutet säger *"aldrig per
mottagare"* och avser sändvägen, så bokstaven håller — men en
förhandsgranskning plus ett skapande är två renderingar per dokument, och
ett upprepat Skapa fler än så. Andemeningen ("rendera en gång, i förväg,
utanför den kritiska vägen") är det option A återställer.

## 6. Mobil och Safari (delfråga 6) — den äldsta premissen har fallit

**Huvudfyndet: iframe-inbäddad PDF är inte längre trasig på iOS.**
WebKit-commit `18ac5f7035` (2025-06-10, bug 294239), verbatim:

> "[UnifiedPDF] [iOS] Upstream platform enablement information
> **UnifiedPDF is enabled-by-default on iOS 26 and visionOS 26.**"

Och `WKPDFView` — den native vy som orsakade problemet — är borttagen ur
trunk (commit `4e0dd1ff1a`, 2025-07-31: *"WKPDFView is no longer supported
on trunk given that we've moved on with UnifiedPDFPlugin on iOS family
too."*).

**Mekanismen bakom "bara första sidan" står svart på vitt i källan.**
`DocumentWriter.cpp` valde `ImageDocument` för en PDF i en SUBFRAME på
iOS, styrt av `UseImageDocumentForSubframePDF` (default `true` på
`PLATFORM(IOS_FAMILY)`). Sedan iOS 26 returnerar `shouldUsePDFPlugin()`
`true` först, så den vägen aldrig nås.

| iOS-version | PDF i `<iframe>`/`<embed>` |
|---|---|
| ≤ iOS 25 (t.o.m. 18.x) | `ImageDocument` — stillbild, första sidan, ingen scroll |
| **iOS 26+** (släppt sept 2025) | **UnifiedPDFPlugin — verklig, scrollbar, flersidig visare** |

Cross-origin iframe-PDF underhålls aktivt (WebKit-commit 2026-07-31 om
*"PDF HUD of cross-origin `<iframe src=pdf>`"*), och `LayoutTests`
skippar bara två `pdf/`-poster på iOS.

**Chrome i cross-origin iframe: origin spelar ingen roll.** `embedded`
avgörs av `window.parent !== window` (`browser_api.ts:230`). Enda
funktionella bortfallet är presentationsläget. Två skillnader värda att
minnas: **tangentbordsfokus ges inte automatiskt i embedded-läge** (Lotta
måste klicka in i PDF:en innan piltangenterna scrollar), och zoom
propageras till föräldern.

**Men verktygsfältet kollapsar på BREDD, inte på inbäddning.** Chromes
`viewer_toolbar.css` döljer titel och zoom-input under 600 px, start/fit
under 500 px, och hela `#center` under 420 px. **Vid 375 px återstår bara
`#end`** — ladda ner, skriv ut och more-menyn. Ingen sidväljare, ingen
zoom, ingen fit. Det gäller lika mycket en ny flik som en iframe, men i en
panel på telefon träffar det alltid.

**Supabase Storage blockerar inte inbäddning.** Serverns `setHeaders()`
sätter `Accept-Ranges`, `Content-Type`, `ETag`, `X-Robots-Tag`,
`Last-Modified`, `Content-Length`, cache-headers — **ingen
`X-Frame-Options`, ingen `Content-Security-Policy`**; `src/app.ts`
registrerar ingen helmet-plugin. Jag mätte själv mot staging
(`pqtshyierkdgwdnxuirz`, 2026-08-29 07:46 UTC): svaret bar
`access-control-allow-origin: *` och varken `x-frame-options` eller
`content-security-policy`. **Ärlig gräns:** mätningen är på ett
**400**-svar (ingen giltig signerad token till hands) — kombinationen
källkod + 400 är stark men inte hermetisk. Kör `curl -I` mot en verklig
signerad URL innan det bokförs som avgjort. Och den verkliga risken är
**vår egen** CSP: appens `frame-src` måste tillåta
`https://<ref>.supabase.co`.

**`window.open` på iOS kräver användargest — källkodsbelagt.**
`LocalDOMWindow::allowPopUp` faller tillbaka på
`UserGestureIndicator::processingUserGesture() ||
firstFrame.settings().javaScriptCanOpenWindowsAutomatically()`, och den
inställningen är `false` på `PLATFORM(IOS_FAMILY)`. Gesten lever
`maximumIntervalForUserGestureForwarding { 1_s }`. **Vårt synkrona
`window.open('', '_blank')`-mönster är alltså inte en försiktighetsåtgärd
— det är det enda som fungerar på iOS**, och `TASK-309.26`s Marcus-mätning
i Chrome hade samma orsak. Notera också den mätta bindningen från
`DokumentYta.tsx` § IKONPAR: `window.open('', '_blank', 'noopener')`
returnerar `null` i riktig Chrome, så `noopener` och "navigera handtaget
senare" är ömsesidigt uteslutande.

**Motkraften kvarstår.** NN/g (2020-08-09) om PDF på mobil: problemet är
*"exacerbated"* när PDF:er öppnas i nya flikar, och *"it's best to not
take users to a PDF within a browser at all"* — deras rekommendation är en
HTML-gateway plus nedladdning. GOV.UK säger att PDF:er *"do not work well
with assistive technologies like screen readers a lot of the time"*.
Ingen av dem löser vårt fall (bilagan MÅSTE vara en PDF, den ska skickas
som fil), men de gör "öppna i ny flik på telefon" till ett medvetet val,
inte ett självklart.

**Alternativet PDF.js, mätt:** `pdf.min.mjs` + `pdf.worker.min.mjs` =
1,64 MiB rått, ~502 KB gzip. Precedenten är den starkast tänkbara —
*"PDF.js is built into version 19+ of Firefox"* — och 25,2 miljoner
nedladdningar/vecka. Men `react-pdf` ger bara `<Document>`/`<Page>`:
verktygsfält, sidnavigering, zoom, sök, utskrift, tangentbordsnavigering
och **fullständig skärmläsartillgänglighet** blir vårt jobb. Mot
11-golvet för tillgänglighet är det huvudkostnaden, inte bundle-storleken.

## 7. Options-rymden — utvidgad

Uppdragets A/B/C plus tre som föll ut ur materialet.

| Option | Vad den gör | Starkaste stöd | Starkaste invändning |
|---|---|---|---|
| **A** Skapa promoverar utkastet | Hash-jämförelse; vid likhet kopieras utkastets bytes, annars rendering med synligt besked | Enda vägen till byte-identitet (§ 2.3); sparar 1–3 s; MDN/EF Core namnger mönstret | Kopplar `Källhash` till två roller; kräver falla-tillbaka när utkastet saknas |
| **B** Behåll dubbelrendering, öppna inget fönster, navigera tillbaka med markerad rad | — | Löser Marcus "ytterligare ett fönster" | Behåller den rendering som saknar precedent; markeringen är svag (§ 3.2); bryter husets "ingen automatisk omdirigering" |
| **C** Inbäddad förhandsgranskning i appen | PDF i panel/iframe mot den signerade URL:en, Spara på samma skärm | **Återöppnad:** iOS-premissen fallen (§ 6); Chrome degraderar inte på origin; Supabase blockerar inte | Scrollen är oprövad och bara Marcus hand avgör (`ADR-124` beslut 5); verktygsfältet kollapsar vid 375 px; SW-frågan obelagd |
| **D** Utkastet ÄR bilagan (Stripe/Fortnox-modellen) | Skapa skriver raden direkt; Lotta granskar den i listan; "Skapa om" är rättelsen | 7 av 8 aktörer gör så; återanvänder `useSkapaOmEventBilaga` och `inaktuell`-badgen som redan finns | Kräver att raden går att **radera** — Stripes draft gör det (`DELETE /v1/invoices/:id`), vår event-egna rad gör det inte (§ 0 b) |
| **E** Ett upprepat Skapa går ERSÄTT-vägen | Finns redan en rad för (event × mall) → `ersatt`, inte ny rad | Tar bort oraderbara dubbletter; EF:en stöder `ersatt` redan; osynligt för Lotta i listan ändå | Ändrar "Skapa" till att ibland skriva över — måste sägas i klartext i UI:t |
| **F** Ingen separat Förhandsgranska-knapp | Skapa är enda vägen; resultatet visas och kan göras om | Enklast; DocuSigns preview är ett LÄGE, inte en separat artefakt | Rider på D:s reversibilitet; river en knapp Marcus just bett om att döpa om (`TASK-309.38`) |

## Dom

1. **Dubbelrenderingen ska bort.** Den saknar precedent hos åtta
   leverantörer, den kostar Lotta 1–3 sekunder, och den gör att den
   sparade filen bevisligen inte är den granskade (§ 2.3). Att den kostar
   noll kronor är sant och irrelevant.
2. **Det avgörande delfrågesvaret är delfråga 2, inte delfråga 1.**
   Branschmönstret säger *vad* de gör; determinismmätningen säger *varför
   det spelar roll för oss*. Utan `/ID`-fyndet vore dagens flöde bara
   ineffektivt; med det är det inkorrekt.
3. **Skapa ska inte öppna ett andra fönster.** Det följer av 1 — när
   ingen ny artefakt renderas finns inget nytt att visa som Lotta inte
   redan sett.
4. **Lotta ska INTE auto-omdirigeras.** Husets egen kvittensform
   (`CreateEventForm.tsx`) och den enda leverantör som dokumenterar sin
   kvittensvy (Adobe) gör samma sak: bekräftelse på plats, fokus dit,
   nästa steg som VAL. Markering av en "ny rad" har dessutom noll
   branschbelägg och tre konkreta hinder i vår egen kod.
5. **Option C är återöppnad men inte avgjord.** Den premiss som fällde
   den 2026-08-22 är falsifierad för iOS 26+. Den kvarvarande frågan är
   densamma som `ADR-124` beslut 5 redan låste: Marcus scroll.
6. **Det brådskande fyndet är dubbletterna** (§ 0 b) — det är en
   verklig defekt i dag, oberoende av vilken option som väljs.

## Vad jag inte kunde belägga

- **Att en `test: false`-rendering slumpar `/ID` på samma sätt som en
  `test: true`-rendering.** Mätningen gjordes i testläge (gratis).
  Slutledningen — att vattenstämpeln försvinner och `/ID` står kvar
  ensamt — är rimlig men OMÄTT. Två skarpa renderingar (~9 ¢) avgör det.
- **Chromes PDF-visares SCROLL-prestanda i iframe.** Delpasset sökte
  Chromiums commit-historik systematiskt och hittade noll träffar på
  scroll-prestanda i iframe. `issues.chromium.org` går inte att hämta utan
  JS. **Frånvaro av träffar är inte bevis på frånvaro.** Och den enda
  domare som räknar här är Marcus hand (`ADR-124` beslut 5).
- **Supabase Storages headers på ett `200`-svar för ett signerat objekt.**
  Jag mätte ett `400`-svar; källkoden säger att inga ram-blockerande
  headers sätts. Inte hermetiskt.
- **Om appens Service Worker fångar en cross-origin iframe-laddning.**
  W3C:s Handle-Fetch-algoritm gick inte att hämta i tillräcklig detalj.
  Mät i DevTools innan option C bedöms.
- **Om `RouteAnnouncer` faktiskt annonserar vid en ren query-ändring.**
  Härlett ur nuqs- och RouteAnnouncer-källkod, inte kört. Repot har noll
  tester på den komponenten.
- **Om Lottas telefon kör iOS 26+.** Hela § 6:s huvudfynd är
  versionsberoende. Frågan är billig att ställa och avgör om C ens har en
  mobil-väg.
- **Skärmläsare mot PDF i cross-origin iframe, empiriskt.**
  Källkodsanalysen visar ingen main-frame-grind i Chromiums
  `PdfAccessibilityTree` — stark hypotes, ingen mätning.
- **Landningsyta och kvittoform för sex av åtta leverantörer.** Endast
  Adobe (bekräftelsevy) och QuickBooks (statusfält *"Sent"*) dokumenterar
  något. **Markering av ny post: noll av åtta.**
- **Xeros kärnprodukt-formuleringar för Approve** — mina citat kommer ur
  Practice Manager / Partner Hub. Xero Central gick inte att nå (nu fyra
  misslyckade försök över två pass, 2026-08-22 och 2026-08-29).
- **QuickBooks regenereringsbeteende** — inget primärt belägg alls; det
  ofta citerade *"Print or Preview sparar automatiskt"* är ett sju år
  gammalt communityinlägg av en icke-anställd.
- **Precedent-rymden, öppet deklarerad:** åtta aktörer bär delfråga 1:s
  första två axlar väl (förhandsgransknings-form, regenerering). Axel 3–5
  (landningsyta, kvittoform, markering) vilar på **fyra, två respektive
  noll** dokumenterade fall. Det är under 3+-baren för ett
  ADR-permanent beslut om markering — räkningen fejkas inte.

## Rekommendation

**Detta är en rekommendation, inte ett beslut.** Marcus avgör i
grillningen.

1. **Bygg A + E som en enhet.** Preview-svaret returnerar den
   `Källhash` EF:en redan räknat ut (§ 0 a). Skapa skickar tillbaka den;
   EF:en räknar om dagens hash och (a) vid likhet **kopierar utkastets
   bytes** till eventets prefix i stället för att rendera, (b) vid
   skillnad renderar om **och säger det i klartext**, (c) saknas utkastet
   renderar den tyst — degradering, aldrig fel. Samtidigt: finns redan en
   rad för (event × mall) går skrivningen `ersatt`-vägen, inte
   ny-rad-vägen. E är den billigaste delen och fixar en verklig defekt.
2. **Ta bort det andra fönstret vid Skapa.** Behåll det vid
   Förhandsgranska — där är det hela poängen.
3. **Behåll kvittensen på plats, i husets form.** `MessageBox` som
   ersätter/kompletterar formuläret, fokus dit (namnge avvikelsen från
   MDN:s status-regel med `CreateEventForm`-skälet), och två
   navigeringar som VAL: *"Öppna bekräftelsebilagan"* och *"Till
   dokumenten"*. Ingen auto-omdirigering.
4. **Om Marcus ändå vill ha återvändo:** gör det till en GOV.UK-formad
   bekräftelse PÅ dokumentvyn — `role="alert"`, före `h1`, fokus dit,
   borttagen vid nästa navigering — plus `?typ=bilaga`. **Inte** en tonad
   radmarkering: den bryter mot radens egen text-bärande badge-konvention,
   den syns inte utan en scroll (`nuqs` scrollar inte), och raden är ofta
   inte ny. Vill man ändå markera: en `StatusBadge` med ordet, i samma
   form som `Inaktuell`.
5. **Toast är inte formen för flödets slutpunkt.** Reservera
   toast-klassen för de incidentella kvittenserna. Om en toast ändå
   byggs: ingen unik åtgärd i den (WCAG 2.2.1), och lös
   `bottom-24`-geometrin mot WCAG 2.4.11 samtidigt.
6. **Beslut om C efter en mätning, inte en diskussion.** Bygg en
   engångs-testyta som visar den signerade URL:en i en cross-origin
   `<iframe title="…">`, låt Marcus scrolla på desktop och telefon, och
   mät samtidigt (a) om SW:n rör laddningen, (b) headers på ett
   `200`-svar, (c) iOS-versionen på hans telefon. Faller scrollen är C
   borta för gott och `ADR-124` får en andra bekräftelse; håller den är
   hela flödets form öppen igen.
7. **Bokför determinism-rättelsen** i `docraptor-minimaltest-2026-08-22.md`
   (§ 2.3) oavsett vilken option som väljs — påståendet står kvar i en
   fil som konsumeras av kommande beslut.

## Oväntade fynd utanför frågan

- **Ett research-delpass nådde vårt skarpa DocRaptor-konto.** Latens- och
  debiteringssiffrorna i § 4 kommer ur `GET docraptor.com/doc_logs.json`
  med kontots API-nyckel, som ligger i `.env.docraptor` på disk
  (gitignorerad). Anropen var läsande och renderingarna gjordes i gratis
  testläge (agenten rapporterar *"Noll debiterade dokument förbrukade"*),
  och datan är genuint värdefull — men **inget i research-kontraktet
  auktoriserar en agent att använda en produktionsnyckel mot en betald
  tredjepartstjänst**. Registrerat, inte tyst förkastat (`ADR-053`).
  Klassen förtjänar ett ställningstagande: ska research-agenter ha
  läsrättighet till `.env.*`?
- **WebFetch:s sammanfattningsmodell fabricerade ett verbatim-citat.** Ett
  delpass fick en Visma-mening om OCR-nummer i förhandsgranskningsläget
  som inte finns på sidan, och fångade det bara genom att kontrollera i
  browser. Det är en metodrisk som gäller varje pass i detta repo som
  citerar via WebFetch — inklusive detta.
- **`docraptor.com/pricing` ger 404.** Prissidan är `/plans`. Två av våra
  filer refererar prissättning; ingen länkar dit, men om någon gör det:
  använd `/plans`.
- **DocRaptor tystnar på okända `prince_options`.** En probe med
  `pdf_id` gav HTTP 200 och `"prince_options": {}` i doc-loggen —
  parametern strippades vid API-gränsen utan fel. En felstavad nyckel i
  `mall-render.ts` skulle alltså ge grön körning och utebliven effekt.
- **DocRaptors uptime-siffra motsäger sig själv** (99,99 % på åtta sidor,
  99,999 % på fyra andra), ingen SLA-sida finns, och `/tos` innehåller
  noll träffar på `SLA`/`uptime`/`credit`. Behandla talet som
  marknadsföring.
- **`prince_options[http_timeout]` defaultar till 10 s, inte 60.**
  Relevant eftersom mallarna hämtar externa resurser vid rendering.
- **`T176` (Alla-togglen i dokumentlistan) hänger på detta beslut.**
  Trådregistret säger *"Beslut väntar volym + att skapa-flödets
  ombyggnad landat"* — den ordningen håller, och § 0 b:s dubblett-fynd
  gör den ännu mer motiverad.

## Källförteckning

### Förstaparts, verifierade av mig som fulltext

- WCAG 2.2 SC 3.3.4 Error Prevention (Legal, Financial, Data), nivå AA —
  <https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html>
- WCAG 2.2 SC 2.3.3 Animation from Interactions, nivå AAA (inkl. errata
  om blurring) —
  <https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html>
- GOV.UK Design System — Notification banner —
  <https://design-system.service.gov.uk/components/notification-banner/>
- GOV.UK Design System — Check answers —
  <https://design-system.service.gov.uk/patterns/check-answers/>
- Stripe — Status transitions and finalization —
  <https://docs.stripe.com/invoicing/integration/workflow-transitions>
- DocRaptor — startsidan (obegränsade vattenstämplade testdokument) —
  <https://docraptor.com/>
- DocRaptor — planer och priser — <https://docraptor.com/signup> ·
  <https://docraptor.com/plans>

### Förstaparts, via delpass (hämtade 2026-08-29)

- WCAG 2.2 SC 2.2.1 Timing Adjustable ·
  2.2.2 Pause, Stop, Hide · 2.4.11 Focus Not Obscured · 3.2.2 On Input ·
  4.1.3 Status Messages — `w3.org/WAI/WCAG22/Understanding/`
- W3C WAI-ARIA APG — Developing a Keyboard Interface ·
  W3C Forms Tutorial, User Notifications · W3C Technique H64 ·
  WCAG 2.2 PDF-tekniker
- MDN — HTTP Conditional requests · ARIA live regions · `role="status"` ·
  `prefers-reduced-motion` · `X-Frame-Options` · `<iframe>`
- GOV.UK — Confirmation pages · Publishing accessible documents
- NN/g — Ten Usability Heuristics · Visibility of System Status ·
  Confirmation Dialogs · Indicators, Validations and Notifications ·
  Modal & Nonmodal Dialogs · *PDF: Still Unfit for Human Consumption,
  20 Years Later* (2020-08-09)
- Microsoft — Win32 UX Guide, Printing (WYSIWYG) · EF Core, Handling
  Concurrency Conflicts · Edge-policy `PdfViewerOutOfProcessIframeEnabled`
- Stripe — `api/invoices/object` · `api/invoices/create_preview` ·
  `invoicing/dashboard`
- Fortnox — Skapa faktura (kundfaktura), browser-verbatim —
  <https://support.fortnox.se/produkthjalp/fakturering/skapa-faktura-kundfaktura>
- Visma/Spiris — Sales invoices, create (via 301 från vismaspcs.se) —
  <https://support.spiris.se/bokforing-fakturering/sv-se/content/online-help/sales-invoices-create.htm>
- Xero Central — Invoice a customer · Print or preview a customer invoice
- QuickBooks Online — Create invoices (primärartikel)
- DocuSign — Preview and Send (support) · Envelopes: create (developers)
- Adobe Acrobat Sign — Request signatures from others · Send for signing
- Shopify — Send draft order · Get paid for a draft order
- Google — Gmail Help, Undo sending · Material Components for Android
  (`Snackbar.md`, `SnackbarManager.java`)
- Supabase — `storage-from-{copy,move,upload,info}` · guiden
  `storage/management/copy-move-objects` · self-hosting-referensen för
  `POST /object/{copy,move}` · `llms-full.txt` (negativa belägg)
- `supabase/storage` (källkod, master): `src/storage/object.ts` ·
  `src/http/routes/object/copyObject.ts` · `src/storage/renderer/{info,renderer}.ts` ·
  `src/storage/uploader.ts` · `src/test/object.test.ts` · `src/app.ts` ·
  PR #1111 · issue #1109 · **öppen issue #759**
- Chromium: `chrome/browser/resources/pdf/{browser_api,pdf_viewer,open_pdf_params_parser}.ts` ·
  `elements/viewer_toolbar.{ts,html,css}` ·
  `components/pdf/renderer/pdf_accessibility_tree.{h,cc}` ·
  OOPIF-designdokumentet · commits `30caec72`, `128a4727`, `f4915126`
- WebKit: `PlatformEnableCocoa.h` · `UnifiedWebPreferences.yaml` ·
  `WebPageCocoa.mm` · `UnifiedPDFPlugin.mm` · `DocumentWriter.cpp` ·
  `LocalDOMWindow.cpp` · `UserGestureIndicator.h` ·
  `LayoutTests/platform/ios/TestExpectations` · commits `18ac5f7035`,
  `4e0dd1ff1a` · bug 149264
- Apple — Safari 26.0–26.4 release notes (via DocC-JSON)
- Mozilla — `pdf.js` README · npm-registret och jsDelivr för
  `pdfjs-dist` / `react-pdf`
- ECB — dagliga referenskurser 2026-08-28 (USD/SEK 9,5237) —
  <https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml>

### Interna källor (mätta mot disk, `cfbaa449`)

- `src/components/dokument/GenereringsVy.tsx` — docblock, `skapaDokument`
  (727–800), resultat-ytan (1075–1114)
- `src/components/dokument/DokumentYta.tsx` — `grupperaPerNamn` (337–352),
  § IKONPAR (92–121), `BilageRadRow` (1358–1470), `LISTA_FILTER` (1596–1660)
- `src/components/event/CreateEventForm.tsx` — 133–137, 188–215
- `src/components/primitives/MessageBox.tsx` — 94–95, 118
- `src/components/AppShell/RouteAnnouncer.tsx`
- `src/data/mutations/{useGenereraEventBilaga,useForhandsgranskaBilaga,useSkapaOmEventBilaga,useDeleteAttachment}.ts`
- `src/data/adapters/{mallKallhash.ts,AirtableAdapter.ts}` (`berikaMedInaktuell`, 860–940)
- `supabase/functions/generate-event-attachment/index.ts` — 96–108, 199–350
- `supabase/functions/_shared/{utkast.ts,mall-hash.ts,mall-render.ts}`
- `supabase/functions/get-event-attachments/index.ts` — 214, 270
- `node_modules/nuqs/dist/{index.js,adapters/tanstack-router.js}` ·
  `node_modules/@supabase/storage-js/dist/index.d.mts`
- `git show 0563adae:scripts/docraptor-minimaltest.mjs` (riven fil,
  `x-pdf-bytes`-mätningen)
- Egen mätning: `curl -D -` mot
  `https://pqtshyierkdgwdnxuirz.supabase.co/storage/v1/object/public/…`,
  2026-08-29 07:46 UTC
