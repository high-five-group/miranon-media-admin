---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-22
status: stable
---

# Förhandsgranskning av dokument som strax ska genereras — branschmönster (2026-08-22)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört i
> worktreen `s108-bilagesparet` (oisolerat repo-läge). Committar inget —
> filen är fristående och orörd i Git tills orkestreraren landar den.
>
> **Inventering FÖRE första sökningen** (per passets kontrakt): `grep -li`
> över `docs/research/` och `docs/decisions/` för
> `preview|förhandsgransk|iframe|pdf\.js|wysiwyg` gav ett tjugotal träffar.
> De fyra pass Marcus själv pekade ut kontrollerades och **bekräftas** inte
> täcka frågan:
>
> - [`mall-ifyllnadsvyer-branschmonster-2026-08-21.md`](mall-ifyllnadsvyer-branschmonster-2026-08-21.md)
>   — noll träffar på preview/iframe; handlar om hur FÄLT fylls i, inte hur
>   resultatet visas.
> - [`pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md`](pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md)
>   — täcker VILKEN MOTOR som producerar PDF:en (DocRaptor vs `pdf-lib`,
>   ADR-119:s underlag), aldrig i vilken YTA resultatet visas för
>   användaren. Kompletteras av detta pass, dupliceras inte.
> - [`pdf-bifoga-eller-lanka-branschmonster-2026-08-19.md`](pdf-bifoga-eller-lanka-branschmonster-2026-08-19.md)
>   — täcker LEVERANS i mail (bifoga vs länka), en annan fråga än
>   förhandsgranskning före generering.
> - [`mottagar-preview-monster-2026-08-07.md`](mottagar-preview-monster-2026-08-07.md)
>   — "preview" där avser en chip-lista av VALDA PERSONER, inte en
>   dokument-förhandsgranskning. Bekräftat irrelevant, precis som Marcus
>   flaggade.
>
> **Två filer utanför Marcus lista visade sig vara den egentliga,
> tyngsta källan** — inte extern branschresearch utan **redan kört,
> Marcus-godkänt arbete i det egna repot**:
>
> - `src/components/dokument/DokumentYta.tsx` (den PROMOVERADE
>   Dokument-ytan, `/mer/dokument`) — docblocket dokumenterar TRE
>   byggvarv (TASK-245 → 246 → 273.4) som gick från iframe/`<img>`-
>   inbäddad förhandsvisning I EN DIALOG, till en riktig PDF öppnad i en
>   NY WEBBLÄSARFLIK — för BÅDA klass B (mall/bilaga) och klass C
>   (kvitto/generator), identiskt.
> - `tasks/sessions/bilagor/s102-dokument-konvergens/AMENDERING-2026-08-17-visa-till-ikonpar.md`
>   — amenderingens grund, VERBATIM Marcus prod-granskningsfynd:
>   *"dokument-ytans inbyggda förhandsvisning är för liten för att läsa —
>   Lotta behöver full flik eller nedladdning."*
>
> Detta är inte en åldrad källa som behöver omprövas — den är från
> 2026-08-17, fem dagar gammal, och beskriver den NUVARANDE skarpa ytan.
> Den besvarar delfråga 1 och 2 för klass B/C redan, med en styrka
> (Marcus-testat mot riktig prod-läsbarhet) som ingen extern källa kan
> matcha. Detta pass bygger vidare på den, inte om den, och fyller
> luckan den INTE täcker: `GenereringsPrototyp.tsx` (bilage-EDITERINGEN,
> S108, aktivt WIP) valde ett ANNAT mönster (HTML via `document.write` i
> ny flik) — och frågan är om det är ett medvetet avsteg eller en
> prototyp-provisorisk lucka som bör alignas.
>
> Läst i sin helhet som styrande kontext, inte som duplicerad research:
> [`ADR-119`](../decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md)
> (DocRaptor-beslutet, Accepted) och `src/components/dokument/prototyp/
> GenereringsPrototyp.tsx` § docblock (S108-kontraktet för bilage-vyn).
>
> Alla externa källor nedan hämtade **2026-08-22**; ingen version pinnad
> i förväg.

## Frågan + beslutet den informerar

**Frågan:** när en användare ska förhandsgranska ett dokument som produkten
strax ska GENERERA (en PDF-bilaga eller ett kvitto) — visar
branschledande produkter källformatet (HTML) eller den faktiska
utskriftsartefakten (PDF), och i vilken yta?

**Beslutet:** vad "Förhandsgranska först" ska betyda i bilage-editeringen
(`GenereringsPrototyp.tsx`), och om samma form ska gälla bilaga och
kvitto.

## Kort svar

**Branschledare för TRANSAKTIONELLA dokument** (fakturor, kvitton, avtal —
Miranons klass) visar så gott som alltid **den faktiska slutartefakten**
(en riktig genererad PDF, eller en förhandsvisning som körs genom SAMMA
renderingsmotor som slutresultatet), aldrig en fristående HTML-
approximation — och gör det **i en ny webbläsarflik**, inte i en
iframe/modal/sidopanel. Det senare är INTE ett älskat mönster (auktoritativ
UX-forskning avråder uttryckligen från nya flikar på mobil) — det vinner
för att **iframe-inbäddad PDF är strukturellt trasig på iOS Safari**,
vilket gör ny flik till den minst dåliga lösningen snarare än den ideala.

**Ingen undersökt leverantör särskiljer preview-FORMEN mellan ett
dokument som just redigerats (fält ifyllda) och ett som bara genererats
ur data.** Skillnaden ligger i steget FÖRE (editeringsytan), inte i
förhandsgransknings-handlingen — samma slutsats som vårt eget repo redan
nått, oberoende, för `DokumentYta.tsx`: klass B och klass C förhandsgranskas
identiskt.

**WYSIWYG-glappet hanteras inte — det ELIMINERAS strukturellt** i denna
dokumentklass: leverantörerna visar aldrig en separat HTML-vy som ska
"likna" PDF:en. De två produktklasser som faktiskt BÄR ett kroniskt,
erkänt, aldrig helt löst glapp (Google Docs, Word Online, Canva) är
INTERAKTIVA redigeringsytor för fri text/design — en annan klass än
Miranons datadrivna dokumentgenerering.

Den starkaste enskilda källan är inte extern: **vårt eget repo har redan,
tre byggvarv och en explicit Lotta-läsbarhets-anmärkning senare,
konvergerat till exakt detta mönster** för `DokumentYta.tsx`. Bilage-
editorns nuvarande HTML-i-ny-flik är en prototyp-provisorisk brist, inte
ett medvetet avsteg.

## 1. Källformat eller faktisk artefakt — och med vilket skäl

| Produkt | Vad förhandsgranskningen visar | Källa |
|---|---|---|
| **Fortnox** | Uttryckligen PDF: *"Den skrivs då ut som en PDF"* — genererad artefakt, inte en HTML-yta | fortnox.helpjuice.com |
| **Stripe Invoicing** | Invoice-editorns realtidspreview drivs av SAMMA mall-/renderingssystem som producerar den slutgiltiga Invoice PDF:en (samma data, samma template-motor) — inte en fristående HTML-approximation skriven separat | docs.stripe.com/invoicing/customize |
| **QuickBooks (Time)** | *"View Invoice PDF"* öppnar en ny flik med PDF:en direkt | quickbooks.intuit.com (community) |
| **Xero** | Produktforumet bekräftar att "Preview"/"Print PDF" renderar en riktig PDF — men Xero Centrals egen hjälpsida gick INTE att hämta (se § Vad jag inte kunde belägga); svagare källklass här | productideas.xero.com |
| **DocuSign (draft-preview)** | Visar textdata, men **beräknar inte formelfält** i draft-läge — en dokumenterad, KÄND begränsning i förhandsgranskningen jämfört med den slutgiltiga renderade PDF:en efter att kuvertet skickats | community.docusign.com |

**Skälet som anges (Fortnox/Xero-linjen):** förhandsgranskningen finns för
att verifiera vad mottagaren FAKTISKT kommer att se innan dokumentet
skickas — ett syfte en HTML-approximation med annan typsnitts-/
sidbrytningsmotor inte kan uppfylla. Ingen av leverantörerna motiverar
detta explicit i löpande text (se § Vad jag inte kunde belägga) — det är
ett observerat mönster, inte ett citerat designskäl.

**DocuSigns undantag är informativt, inte en motsägelse:** begränsningen
gäller bara DRAFT-läget (innan skicka), och gäller beräknade fält — inte
ett medvetet val att visa en annan rendering än slutresultatet. Det är
närmare en teknisk lucka i förhandsgranskningens täckning än ett HTML-vs-
PDF-designval.

## 2. Ytan — ny flik, iframe, modal, sidopanel — och mobilfallet

**Mönstret hos samtliga undersökta leverantörer är NY FLIK för den
faktiska PDF:en**, aldrig iframe-inbäddning i sidan. QuickBooks Time är
explicit ("View Invoice PDF" → ny flik); Xero:s "New Invoicing" öppnar
bilagor i ny flik som DEFAULT-beteende (så pass mycket default att
användare i produktforumet efterfrågar att få tillbaka det GAMLA
samma-fönster-beteendet — se § Fynd utanför frågan).

**Varför inte iframe/modal — plattformsskälet, mätt mot iOS Safari
specifikt (vår användares plattform):** att bädda in en PDF i en
`<iframe>`/`<embed>` på iOS Safari är STRUKTURELLT TRASIGT, inte en
smaksak:

> *"iOS Safari renders only the first page [...] the iframe appears
> 'cropped', and no vertical/horizontal scrollbars appear [...] it is
> impossible to scroll to further pages, and it is impossible to print the
> pdf"* — grundorsaken är att Safari i embed-läge ritar PDF:en som en
> BILD i stället för att montera sin riktiga PDF-visare.
> (codestudy.net, bekräftat av flera trådar på Apple Developer Forums och
> Apple Community, samma felbild sedan iOS 8 och ännu olöst)

Native navigation (ny flik/nytt fönster) fungerar väl på iOS Safari —
samma källor. Det enda tekniskt gångbara alternativet till ny flik för en
FULLSTÄNDIG, scrollbar, utskrivbar PDF-vy vore att montera en egen
renderare (**PDF.js**, kallad "gold standard" i samma artikel) — det vill
säga ett helt nytt beroende att underhålla, inte en enklare lösning.

**Motkraften — auktoritativ tredjepartskälla, INTE en leverantörsröst:**
Nielsen Norman Group avråder uttryckligen från nya flikar på just MOBIL:

> *"New windows or tabs can cause disorientation [...] exacerbated on
> mobile, where the old window is never visible."* [...] *"if your users
> are primarily completing the task on mobile, don't use a PDF in the
> first place, or if you must, at least open it in the same tab so they
> can more easily get back."*
> (nngroup.com/articles/new-browser-windows-and-tabs/, publicerad
> 2020-09-27, fortsatt citerad UX-referens)

**Slutsats för delfrågan:** branschens FAKTISKA praxis (ny flik) och den
auktoritativa UX-rekommendationen (undvik ny flik på mobil) pekar åt
OLIKA håll — och det är en genuin, olöst spänning, inte en spänning jag
kan trolla bort. Den mest sannolika förklaringen till att branschen ändå
konvergerar på ny flik: alternativet (iframe) är sönder på exakt den
plattform (iOS Safari) där NN/g:s invändning väger tyngst. Ny flik vinner
genom eliminering av alternativ, inte för att det är den mest älskade
lösningen. **Modal/sidopanel förekom i INGEN av de undersökta
leverantörernas nuvarande preview-mönster** för denna dokumentklass —
DokumentYta.tsx:s egen historik (dialog-inbäddad iframe, TASK-245/246)
prövade det mönstret och Marcus dömde ut det som "för liten för att
läsa", vilket är en direkt, skarp datapunkt i samma riktning.

## 3. Redigerbart dokument (bilaga) kontra rent genererat (kvitto)

DocuSign är den enda undersökta leverantören som gör en explicit
HTML-vs-PDF-åtskillnad kopplad till dokumentets natur — men axeln är
**interaktion**, inte **redigerbarhet-i-föregående-steg**:

> Responsiv HTML ("Smart Sections") används när **mottagaren/signeraren**
> ska interagera med dokumentet på en mobilskärm — fylla i fält, klicka
> signaturzoner — där flytande HTML-layout ger bättre läsbarhet än en
> statisk PDF i fast sidbredd. Statisk PDF används när dokumentet bara
> ska LÄSAS. (esignglobal.com/esign.ai, sekundärkälla — se § Vad jag inte
> kunde belägga)

**Denna axel mappar inte direkt mot Miranon-fallet.** I DocuSigns modell
är det MOTTAGAREN som interagerar med HTML:en. I Miranons fall är det
ARRANGÖREN (Lotta) som fyller i fält i editeringssteget — deltagaren
(mottagaren) interagerar ALDRIG med bilagan, den levereras som en frusen,
bifogad PDF (ADR-119 beslut 3 och 5). Den giltiga DocuSign-parallellen är
alltså sändarens FÖRBEREDELSE-yta (`createSenderView`), inte mottagarens
signeringsyta — och där visar DocuSigns egna källor att förhandsgransk-
ningen ändå är en förenklad, textbaserad vy i draft-läget, inte en full
HTML-redigeringsyta identisk med slutresultatet (§ 1 ovan).

**Ingen av de undersökta leverantörerna särskiljer FORMEN på
förhandsgransknings-HANDLINGEN (PDF/HTML, vilken yta) mellan ett
fält-ifyllt och ett rent genererat dokument.** Skillnaden ligger enbart i
STEGET FÖRE (formulär vs ingen inmatning) — när användaren väl trycker
"Förhandsgranska" är förväntningen densamma: den faktiska artefakten.

**Detta styrks starkast av vårt eget repo, inte av extern research:**
`DokumentYta.tsx` behandlar klass B (mall/bilaga, ADR-119:s domän) och
klass C (kvitto, `preview-receipt`) EXAKT LIKA — samma ikon
(`DokumentAtgardsKnappar`), samma `window.open`-synkront-mönster, samma
"sidoeffektsfri riktig PDF från en dedikerad EF"-arkitektur
(`generate-event-attachment` med `preview: true` för B,
`preview-receipt` för C). Detta är inget industri-observerat mönster —
det är vårt eget teams redan fattade, Marcus-godkända beslut (S102/
TASK-273.4), och det landar på exakt samma svar som branschgenomgången:
**ingen skillnad i preview-form mellan redigerbart och rent genererat.**

## 4. WYSIWYG-glappet — hur branschen hanterar att preview ≠ leverans

Två distinkta produktklasser, två helt olika hanteringar:

**Klass A — interaktiva fri-text/design-redigerare** (Google Docs, Word
för webben, Canva): skärmvyn ÄR en HTML/canvas-rendering, strukturellt
skild från utskriftsmotorn. Glappet är KRONISKT och ERKÄNT, inte löst:

> *"docs view in editor is different than print to pdf and download to
> pdf which differ themselves"* — flerårig, återkommande klagomålstråd i
> Google Docs Editors Community, ingen lösning erbjuden utöver "verifiera
> manuellt via Print Preview/Ladda ner PDF före leverans."
>
> Canva: dokumenterade typsnitts- och layoutavvikelser mellan
> designytan och exporterad PDF (Type 3-fontkonvertering, element som
> försvinner vid vidare bearbetning) — community.adobe.com-trådar,
> hanterat med exportinställningar ("PDF Print" i stället för "PDF
> Standard"), inte med en enhetlig renderingsmotor.

Detta är INTE branschens svar på "acceptabelt glapp" för transaktionella
dokument — det är en annan produktklass med en annan avvägning (fri
redigeringsflexibilitet kostar renderingskonsistens), och glappet
accepteras där för att alternativet (en enda tung renderingsmotor som
körs vid VARJE tangenttryckning) inte är praktiskt genomförbart för ett
levande redigeringsdokument.

**Klass B — transaktionell dokumentgenerering ur data** (Stripe, Fortnox,
Xero, DocuSign efter skicka): glappet ELIMINERAS strukturellt genom att
ALDRIG visa en fristående HTML-approximation. Förhandsgranskningen ÄR
(eller körs genom) samma renderingsväg som slutartefakten (§ 1).

**Miranon Media hör till klass B**, inte klass A: bilagan/kvittot byggs ur
strukturerad eventdata plus ett begränsat antal fältöverskrivningar
(fasta block, inte fri textredigering) — precis den dokumentklass där
branschmönstret är entydigt. **Det uttalade mönstret för "när glappet är
acceptabelt" är alltså: aldrig, som medveten designpunkt, i denna
dokumentklass.** Den enda dokumenterade avvikelsen (DocuSigns
draft-begränsning) är en teknisk lucka i förhandsgranskningens TÄCKNING
(beräknade fält), inte ett val att visa en annan RENDERING.

**Konsekvens för Miranon Media, konkret:** med ADR-119:s DocRaptor-beslut redan
Accepted blir svaret på delfråga 4 automatiskt "inget glapp att hantera"
— om förhandsgranskningen går genom SAMMA DocRaptor-anrop som den
slutgiltiga genereringen (samma HTML/CSS-mall, samma motor), är
förhandsgranskningen per konstruktion identisk med leveransen. Det är
exakt vad `preview-receipt`/`generate-event-attachment(preview: true)`
redan gör för klass C/B idag (fast ännu mot `pdf-lib`, inte DocRaptor) —
mönstret finns redan i repot, det väntar bara på att bilage-editorns
prototyp kopplas till samma väg.

## Dom

Frågans premiss (att bilagan och kvittot idag har två olika
förhandsgransknings-upplevelser) är korrekt beskriven i uppdraget, men
**bara för prototypen** — den PROMOVERADE, skarpa ytan (`DokumentYta.tsx`)
har redan, oberoende av detta pass, konvergerat till EN gemensam form för
båda dokumentklasserna: riktig PDF, ny flik. Branschgenomgången bekräftar
den formen oberoende, med en tydlig kvalificering: ny flik är den
tekniskt tvingade lösningen på iOS Safari, inte den UX-mässigt ideala
(NN/g), och ingen leverantör låter ett dokuments redigerbarhet i
föregående steg påverka förhandsgransknings-FORMEN. Bilage-editorns
(`GenereringsPrototyp.tsx`) nuvarande HTML-i-ny-flik är därför bäst
förstådd som en PROTOTYP-provisorisk brist orsakad av avsaknad av en
kopplad Edge Function (S108 är fixture-baserad, ingen server-rendering
ännu) — inte som ett medvetet designval att avvika från det redan
konvergerade, Marcus-godkända mönstret.

## Vad jag inte kunde belägga

- **Inget leverantörscitat förklarar VARFÖR ny flik väljs framför
  iframe.** Slutsatsen att iOS Safaris trasiga iframe-PDF-stöd är
  drivkraften är MIN INFERENS, byggd på plattformsforskning — ingen
  leverantör (Fortnox/Xero/QuickBooks/Stripe) uttalar detta skäl i text.
- **Xero Centrals egen hjälpsida** (`central.xero.com/0/article/
  Print-or-preview-a-customer-invoice`) gick inte att hämta (två försök,
  60 s timeout vardera). Xero-beläggen ovan vilar på websearch-snippets
  och produktforumcitat — en svagare källklass än en direkt hämtad
  förstapartssida. Bör verifieras separat om Xero-precedent blir bärande
  i ett kommande beslut.
- **DocuSigns egen `DocumentResponsiveHtmlPreview`-referens**
  (developers.docusign.com) gick att nå men returnerade endast en tom
  rubrik vid hämtning — mitt DocuSign-belägg om HTML-vs-PDF-axeln vilar
  på två sekundära bloggkällor (esignglobal.com, esign.ai), inte
  DocuSigns egen förstapartsdokumentation.
- **PandaDocs renderingsarkitektur** (delar editor-preview samma motor
  som PDF-export?) kunde inte beläggas alls — websearch gav inget
  tekniskt svar inom passets tidsram. PandaDoc utelämnas därför ur
  jämförelsetabellen i § 1 i stället för att gissas in.
- **Ingen kvantifierad mätning av WYSIWYG-glappets storlek i just
  Prince-motorn** (DocRaptors renderingsmotor, ADR-119:s val) hittades.
  Glappet är väldokumenterat generellt för HTML→PDF-kedjor, men ingen
  Prince-specifik mätning. ADR-119 flaggar redan latens som obelagd —
  detta pass lägger till att visuell trohet mot förhandsgranskningen
  ALDRIG blir en fråga om samma motor används för båda, vilket gör den
  specifika mätningen mindre kritisk (se § 4).
- **Ingen extern leverantör befanns dela Miranons exakta mönster** —
  "generera en gång per event, sidoeffektsfri förhandsgranskning
  frikopplad från skarp generering." Närmast: Stripes sparade
  draft-fakturor (flera preview-visningar innan finalize) och Fortnox
  (men Fortnox preview HAR en sidoeffekt — se § Fynd utanför frågan).
  Ingen ren analog till vår `preview: true`-flagga hittades.

**Precedent-rymden, öppet deklarerad:** fem förstapartskällor bar
substans (Fortnox, Stripe, DocuSign delvis, QuickBooks via forum, NN/g
som auktoritativ tredjepart) plus två svagare sekundärkällor (Xero,
DocuSign HTML-axeln). Detta är en rimlig bredd för en UX-mönsterfråga,
men INTE en 3+-projekts-ADR-kvalitet-räkning på varje delfråga
enskilt — särskilt delfråga 3 (redigerbart vs rent genererat) vilar
till stor del på EN leverantör (DocuSign) plus vårt eget interna
precedent. Räkningen fejkas inte: där rymden är tunn står det ovan.

## Fynd utanför frågan

- **Fortnox preview HAR en sidoeffekt** ("Note that when you preview an
  invoice, it is automatically saved") — skiljer sig från vårt uttryckliga
  krav (ADR-119 beslut 7, `preview-receipt`s eget filhuvud) att
  förhandsgranskning ska vara SIDOEFFEKTSFRI. Ingen motargument mot vårt
  val — snarare en bekräftelse på att vårt strängare krav inte är
  branschstandard, utan ett medvetet, striktare val.
- **Xero migrerade nyligen BORT från direktutskrift** i "New Invoicing"
  (nu bara nedladdning) och användare klagar aktivt i produktforumet —
  ett tecken på att invoicing-UX i denna kategori fortfarande är i
  rörelse hos etablerade aktörer, inte ett för längesedan stabiliserat
  mönster att kopiera blint.
- **DocuSigns Smart Sections/responsiv-HTML-mönster** för INTERAKTIVA
  mobila signeringsflöden (mottagaren fyller i/signerar direkt i
  webbläsaren) är irrelevant för dagens Miranon Media-flöde (deltagaren
  interagerar aldrig med bilagan) — men värt att minnas som paradigm OM
  Miranon Media någon gång bygger ett flöde där mottagaren ska interagera med
  ett dokument direkt i webbläsaren.
- **`Content-Disposition: inline` vs `attachment`-header-mekaniken** som
  codestudy.net beskriver för PDF-nedladdning är samma header-mekanik
  vårt repo redan använder och har verifierat live mot staging
  (`DokumentYta.tsx` docblock, TASK-273.4, `download`-query-parameter på
  signerade Storage-URL:er) — bekräftar oberoende att det tidigare
  bygget redan följer plattforms-best-practice, utan att detta pass
  behövde upptäcka det på nytt.

## Rekommendation

**Detta är en rekommendation, inte ett beslut** — Marcus avgör.

1. "Förhandsgranska först" i bilage-editeringen (`GenereringsPrototyp.tsx`,
   och dess framtida skarpa efterträdare) bör betyda **en riktig,
   server-genererad PDF** — samma renderingsväg (DocRaptor, ADR-119) som
   den slutgiltiga skarpa genereringen — öppnad i en **ny webbläsarflik**
   via det redan skarpt bevisade `window.open('', '_blank')`-synkront-
   mönstret från `DokumentYta.tsx` (TASK-273.4 AC #1). INTE
   `document.write` av rå HTML.
2. **Samma form ska gälla bilaga och kvitto** — det finns inget
   branschmönster eller internt precedent som motiverar en skillnad, och
   `DokumentYta.tsx` har redan konvergerat dit oberoende.
3. **Öppen avvägning att ta medvetet, inte ärva blint:** NN/g:s
   mobil-varning mot nya flikar är en genuin, obesvarad spänning mot det
   redan valda mönstret. Miranon Media-admin är dessutom en SPA (TanStack Router) —
   en samma-flik-navigering till en extern PDF-URL hade sannolikt förstört
   app-state på ett sätt en vanlig webbsida inte drabbas av, vilket är ett
   argument FÖR ny flik som NN/g:s generella artikel inte väger in. Detta
   pass löser inte den avvägningen — det lägger fram båda sidor öppet så
   Marcus kan besluta med ögonen öppna, snarare än att detta pass tyst
   väljer sida.

## Källförteckning

- Fortnox — Förhandsgranska kundfakturor (helpjuice):
  <https://fortnox.helpjuice.com/sv_SE/hantering/forhandsgranska-fakturor-tips>
  (hämtad 2026-08-22)
- Fortnox — Förhandsgranska kundfakturor (support.fortnox.se, HTTP 402 vid
  hämtning, ej nåbar denna gång):
  <https://support.fortnox.se/produkthjalp/fakturering/forhandsgranska-kundfakturor>
  (försökt 2026-08-22)
- Stripe — Customize invoices (invoice-editor, PDF page size, rendering):
  <https://docs.stripe.com/invoicing/customize> (hämtad 2026-08-22)
- Stripe — Create a preview invoice API:
  <https://docs.stripe.com/api/invoices/create_preview> (länk identifierad,
  ej djupfetchad — sekundär bekräftelse)
- DocuSign Community — Print or Preview a draft envelope:
  <https://community.docusign.com/esignature-111/print-or-preview-a-draft-envelope-24951>
  (hämtad 2026-08-22)
- DocuSign — DocumentResponsiveHtmlPreview REST-referens (endast rubrik
  nådd, kroppen ej hämtningsbar):
  <https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/documentresponsivehtmlpreview/>
  (försökt 2026-08-22)
- esignglobal.com — DocuSign API: Creating a "Responsive" HTML document
  for mobile signing (sekundärkälla, DocuSign HTML-vs-PDF-axeln):
  <https://www.esignglobal.com/blog/docusign-api-creating-responsive-html-document-mobile-signing-code>
  (hämtad 2026-08-22)
- QuickBooks Community — View Invoice PDF / preview-beteende:
  <https://quickbooks.intuit.com/learn-support/en-us/help-article/invoicing/create-invoices-quickbooks-time/L4XMWuh6i_US_en_US>
  (websearch-snippet, hämtad 2026-08-22)
- Xero Central — Print or preview a customer invoice (EJ nåbar, två
  timeout-försök):
  <https://central.xero.com/0/article/Print-or-preview-a-customer-invoice>
  (försökt 2026-08-22)
- Xero Product Ideas — attachments open in new tab-klagomål:
  <https://productideas.xero.com/forums/967115-invoices-quotes/suggestions/47579270-new-invoicing-open-attached-files-in-the-current>
  (websearch-snippet, hämtad 2026-08-22)
- codestudy.net — How to Fix PDF Display Issues in iFrame on Mobile
  Safari (grundorsak + workarounds, iOS Safari):
  <https://www.codestudy.net/blog/problems-displaying-pdf-in-iframe-on-mobile-safari/>
  (hämtad 2026-08-22)
- Apple Developer Forums — Embedded PDFs in mobile safari broken since
  iOS8 (bekräftande plattformskälla):
  <https://developer.apple.com/forums/thread/649982> (websearch-snippet,
  hämtad 2026-08-22)
- Nielsen Norman Group — Opening Links in New Browser Windows and Tabs
  (auktoritativ UX-forskning, mobil-specifikt PDF-råd):
  <https://www.nngroup.com/articles/new-browser-windows-and-tabs/>
  (publicerad 2020-09-27, hämtad 2026-08-22)
- Google Docs Editors Community — editor-vy skiljer sig från print/
  download-PDF, flerårig känd brist:
  <https://support.google.com/docs/thread/4537136/docs-view-in-editor-is-different-than-print-to-pdf-and-download-to-pdf-which-differ-themselves-why>
  (websearch-snippet, hämtad 2026-08-22)
- Adobe Community — Canva-to-PDF typsnitts-/layoutavvikelser:
  <https://community.adobe.com/questions-9/canva-to-pdf-character-encoding-issues-1299090>
  (websearch-snippet, hämtad 2026-08-22)

### Interna källor (repot)

- `src/components/dokument/DokumentYta.tsx` § docblock (rad 1–120) —
  den promoverade Dokument-ytans tre byggvarv och det konvergerade
  ny-flik-mönstret.
- `tasks/sessions/bilagor/s102-dokument-konvergens/AMENDERING-2026-08-17-visa-till-ikonpar.md`
  — Marcus verbatim prod-granskningsfynd som drev iframe→ny-flik-bytet.
- `src/components/dokument/prototyp/GenereringsPrototyp.tsx` § docblock
  och `oppnaDokument` (rad 1300–1340) — bilage-editorns nuvarande
  HTML-i-ny-flik-mönster.
- `supabase/functions/preview-receipt/index.ts` § filhuvud — klass C:s
  sidoeffektsfria PDF-förhandsgranskning.
- `supabase/functions/_shared/receipt-pdf.ts` — delad `pdf-lib`-renderare
  mellan skarp sändning och förhandsgranskning.
- `supabase/functions/generate-event-attachment/index.ts` rad 202, 220 —
  klass B:s `preview: true`-läge, samma mönster som klass C.
- [`ADR-119`](../decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md)
  — DocRaptor-beslutet (Accepted 2026-08-19) som gör § 4:s slutsats
  (glappet försvinner om preview går genom samma motor) konkret
  genomförbart.
