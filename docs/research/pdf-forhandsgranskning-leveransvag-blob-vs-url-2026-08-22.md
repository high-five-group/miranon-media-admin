---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-22
status: draft
---

# PDF-förhandsgranskningens leveransväg — varför `blob:` scrollar sämre än en riktig URL (2026-08-22)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört
> **oisolerat** i huvudkatalogen (`s108-bilagesparet`-worktreen). Committar
> inget — filen är fristående och orörd i Git tills orkestreraren landar
> den.
>
> **Inventering FÖRE första sökningen.** `docs/research/` innehöll redan
> tre pass från SAMMA dag, alla del av samma S108-utredning:
>
> - [`pdf-scrollprestanda-pdfium-chrome-2026-08-22.md`](pdf-scrollprestanda-pdfium-chrome-2026-08-22.md)
>   (landade kl 21:15, medan detta pass redan pågick) — undersöker VARFÖR
>   PDFium rasteriserar långsamt som RENDERINGSMOTOR (soft masks,
>   blend-lägen, QR-vektorkomplexitet). Slutsats: inget av detta
>   förekommer i den faktiska mallen. Passets egen § 5, rekommendation 5,
>   lämnar explicit den fråga DETTA pass besvarar öppen: *"vilket avgör om
>   nästa steg är ett PDFium-spårat problem alls eller något i
>   Chrome-fönstrets egen compositing (t.ex. en `blob:`-URL som triggar en
>   extra kopiering)."* Detta pass är alltså den uttryckligt efterfrågade
>   fortsättningen, inte en dubblering — och min egen mätning (§ 1 nedan)
>   **förfinar** den hypotesen: det är inte en enskild extra kopiering,
>   utan en strukturellt annorlunda transportväg för HELA bootstrap-kedjan.
> - [`forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22.md`](forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22.md)
>   — besvarar VAR förhandsgranskningen ska visas (ny flik, inte iframe —
>   iframe är strukturellt trasig på iOS Safari, oavsett prestanda) och
>   VILKET INNEHÅLL (riktig PDF, samma motor som slutleveransen). Detta
>   pass tar den slutsatsen som GIVEN och går vidare till nästa lager:
>   redan i en ny flik, med en redan riktig PDF — HUR ska bytesen ta sig
>   dit? Ingen dubblering: det passet nämner `blob:` bara i förbigående
>   (§ Interna källor, `GenereringsPrototyp.tsx`s dåvarande
>   `document.write`-mönster) och analyserar aldrig leveransmekanismen.
> - [`docraptor-minimaltest-2026-08-22.md`](docraptor-minimaltest-2026-08-22.md)
>   — ger baslinjedata (51–310 kB per fil, 2,8–3,6 s servergenerering)
>   som används nedan för att bedöma hur allvarlig kostnaden av en extra
>   nätverksomväg faktiskt är.
>
> [`ADR-118`](../decisions/ADR-118-bilagors-rackviddsmodell.md) och
> [`ADR-119`](../decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md)
> lästa i sin helhet: ADR-119 beslutar VILKEN motor (DocRaptor) och att
> **sparade** bilagor genereras EN gång och lagras i Supabase Storage —
> men täcker inte den TRANSIENTA redigeringstids-förhandsgranskningen
> (`useForhandsgranskaBilaga`), som per sin egen docblock är
> *"SIDOEFFEKTSFRI per konstruktion"* och medvetet ALDRIG når Storage.
> Ingen ADR eller lesson diskuterar `blob:`- kontra URL-leverans;
> `tasks/lessons.md` gav noll träffar på `blob|laggig|scroll|hackig`.
>
> **Kodläget verifierat mot faktisk `git log` (HEAD `12b87030`), inte mot
> vad de andra passens läsning beskrev.** De två senaste commiten före
> detta pass (`80ef31dc`, `6959f7ea`, båda 2026-08-22) konverterade
> `GenereringsPrototyp.tsx`s förhandsgranskning FRÅN det `document.write`-
> mönster grannpasset ovan beskrev TILL exakt den `blob:`-väg frågan här
> gäller (`useForhandsgranskaBilaga.ts`, `URL.createObjectURL(pdf)` +
> `window.open`). Grannpassets kodläsning var korrekt när den gjordes —
> koden har sedan dess hunnit vidare under samma session. Detta pass utgår
> alltså ifrån det NUVARANDE, mest aktuella läget.
>
> Alla externa källor hämtade **2026-08-22**. Chrome-version uppmätt i
> detta pass egen live-körning: **151.0.7922.170 (macOS)**.

## Kort svar

**Mekanismen är BELAGD till hälften, resten är källbelagt SANNOLIKT.**
Egen live-mätning i en riktig Chrome-instans (chrome-devtools MCP, samma
motor som produktionen) visar att Chromes inbyggda PDF-visare
(`chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai`) bootstrap:ar VARJE
PDF-navigering — oavsett schema — genom EXAKT samma trestegskedja: en
dokument-wrapper hämtar resursen, en inre iframe hämtar SAMMA resurs en
andra gång, och slutligen serveras bytesen till PDFium-`<embed>`:et från
en tredje, extension-egen resurs. Detta gäller **identiskt** för `blob:`
och `https:` (mätt i detta pass, se § 1) — vilket **falsifierar** den
enkla hypotesen "blob hämtas fler gånger". Skillnaden ligger i stället
**hur billig varje hämtning är**: en `https:`/`file:`-läsning nummer två
av samma URL går sannolikt via nätverkstjänstens cache (i praktiken
gratis), medan en `blob:`-läsning ALLTID måste passera Chromiums
Blob-mojo-gränssnitt (`ReadAll`/`ReadRange` över en IPC-datapipe till
webbläsarprocessens blob-register) — en dyrare, källkodsbelagd väg som
Chromiums eget designdokument beskriver, men vars faktiska millisekund-
kostnad för EN specifik 150 KB-fil detta pass inte mätt i mikrosekunder.

**Blob: + `window.open` är dessutom ett DOKUMENTERAT, aktivt trubbligt
hörn i Chrome just nu** — inte bara arkitekturellt dyrare utan genuint
buggigt: Chrome migrerar sin PDF-visare från en äldre GuestView-arkitektur
till en nyare OOPIF-baserad (pågående, komponenttaggad
"Internals>Plugins>PDF>OOPIF PDF Migration"), och en Chromium-bugg (fixad,
P1/S2, 2024) visar att exakt kombinationen `blob:` + `window.open` gav ett
hårt "connection refused"-fel under den nya arkitekturen. En annan,
fortfarande öppen bugg från 2020 visar att en `blob:`-servad PDF-visares
EGEN styling läcker in i den ÖPPNANDE sidans CSP — ett beteende som
samma bugg uttryckligen säger var FIXAT för HTTP-levererade PDF:er men
INTE för blob-levererade. Två oberoende, källbelagda datapunkter: `blob:`
lever i en mindre väl underhållen gren av samma kodväg som `http(s)`/
`file:`.

**Popup kontra vanlig flik är, källbelagt, INTE huvudförklaringen.**
PDF-visaren (guest-viewn) körs ALLTID i sin egen, strikt isolerade
process oavsett vad som bäddar in den — Chromiums egen
process-modell-dokumentation säger det rakt ut. Att `useForhandsvisaDokument`
medvetet utelämnar `noopener` gör bara att den ÖPPNANDE flikens ram
delar process med SPA:n (eftersom båda är samma-site) — det påverkar
aldrig PDF-renderarens egen process. Ingen primärkälla hittades som
visar en mätbar GPU-/rasteriserings-skillnad specifikt för popup kontra
flik.

**Rekommenderad leveransväg, om lagget faktiskt ska åtgärdas:** en riktig
URL slår `blob:` var gång det finns en att tillgå — vilket redan är exakt
vad klass A (sparade bilagor, `dokumentKalla.ts`) gör och vad Marcus
själv rapporterar som snabbt. För den GENUINT transienta,
sidoeffektsfria förhandsgranskningen (`useForhandsgranskaBilaga`, som per
design aldrig får röra Storage) finns en väg som ger samma
nätverks-liknande leveransväg UTAN att bryta sidoeffektsfriheten: en
Service Worker som fångar en syntetisk samma-ursprungs-URL och svarar med
en riktig `Response` byggd ur de redan hämtade bytesen — appen har redan
en Workbox-baserad service worker (`src/sw.ts`) och paketen
`workbox-range-request` hade behövt läggas till, inte hela SW-
infrastrukturen. Se § 5 för fullständig rangordning.

## 1. Mekanismen — hur laddar Chromes PDF-visare sitt dokument, mätt live

**Metod:** en riktig Chrome-instans (chrome-devtools MCP, Chrome
151.0.7922.170) navigerades till (a) en hemmagjord 434-byte PDF levererad
som `blob:https://example.com/<uuid>` och (b) en riktig extern PDF
(`https://www.orimi.com/pdf-test.pdf`, ~13 KB). Nätverksloggen togs för
båda.

**Resultat, `blob:`-fallet (reqid 145, 161, 162):**

| Steg | Begäran | Vad som kom tillbaka |
|---|---|---|
| 1 | `GET blob:https://example.com/<uuid>` (topp-navigering) | Syntetisk HTML: `<template shadowrootmode="closed"><iframe src="about:blank" type="application/pdf">` |
| 2 | `GET blob:https://example.com/<uuid>` (SAMMA URL, andra gången, från den inre iframen) | Syntetisk HTML: `<embed type="application/x-google-chrome-pdf" src="chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/854b6f23-…" original-url="blob:…">` + `pdf_viewer`-JS |
| 3 | `GET chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/854b6f23-…` | De FAKTISKA PDF-bytesen (`Content-Type: application/pdf`, `Content-Length: 434`, bit-identiska med originalet) |

**Resultat, `https:`-fallet (reqid 163, 180, 181):** exakt samma
trestegsmönster — `GET https://www.orimi.com/pdf-test.pdf` två gånger,
sedan `GET chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/253897a6-…`
för de faktiska bytesen.

**Slutsats av mätningen:** antalet hämtningar och kedjans FORM är
**identisk** oavsett schema. Detta är `MimeHandlerViewGuest`-bootstrap-
mönstret (Chromiums PDF-extension-ID är verifierat
`mhjfbmdgcfjbbpaeojofohoefgiehjai` i alla tre resurserna), och det
förklarar INTE i sig varför blob skulle vara långsammare — en hypotes om
"fler nätverksanrop för blob" är alltså **falsifierad** av denna mätning.

**Vad som återstår som förklaring, källbelagt men inte
millisekundmätt av detta pass:** Chromiums egna designdokument för
blob-lagring
(`storage/browser/blob/README.md`, `chromium.googlesource.com`, hämtad
2026-08-22) beskriver att en blob-läsning går genom `mojom Blob`-
gränssnittets `ReadAll`/`ReadRange`-metoder över en Mojo-datapipe, och
att större blobbar kan behöva skrivas till disk innan de kan skickas:
*"Transferring the data can take a lot of time if the blob is large
enough to save it directly to a file, as this means we need to wait for
disk operations before the renderer can get rid of the data."* En andra
läsning av samma `https:`-URL går sannolikt via nätverkstjänstens
HTTP-cache (en betydligt billigare väg, verifierad som ARKITEKTUR men
inte tidsatt av detta pass). **SANNOLIKT, ej millisekund-BELAGT för vår
specifika fil:** varje hopp i den identiska trestegskedjan kostar mer
för `blob:` än för `https:`/`file:`, eftersom det förra passerar
webbläsarprocessens blob-register via IPC och det senare kan träffa en
lokal cache.

En intressant, tidigare oövervägd nyans dök upp under mätningen (se
§ Oväntade fynd): den faktiska PDF-motorn (`<embed
type="application/x-google-chrome-pdf">`) läser sedan bytesen från sin
EGEN `chrome-extension://…/<uuid>`-resurs — inte längre från `blob:`-
URL:en. Om detta betyder att PDFium ALDRIG behöver gå tillbaka till
blob-registret under själva scrollningen (bara vid den initiala
trestegs-bootstrapen) kunde inte avgöras för ett 1-sidigt, 150 KB-
dokument i detta pass — se § Vad jag inte kunde belägga.

## 2. Är `blob:` dokumenterat sämre? — Chromiums egen bugtracker

**Ja, på två oberoende, källbelagda punkter — men ingen av dem är
DIREKT en "scroll är hackig"-rapport.**

**Chromium-bugg 374947864** (P1, Severity S2, **Fixed**, öppnad
2024-10-23, komponent "Internals>Plugins>PDF>OOPIF PDF Migration"),
titel *"Opening a PDF blob with window.open causes a 'connection
refused' error in the OOPIF PDF Viewer"*. Beskrivning verbatim (hämtad
live via `issues.chromium.org/issues/374947864`, 2026-08-22):

> "Open the ObjectURL created in step 3 with window.open. A new tab
> opens, displaying the message 'mhjfbmdgcfjbbpaeojofohoefgiehjai refused
> to connect.' [...] The issue does not occur with the GuestView PDF
> Viewer, but it does when using the OOPIF for PDF Viewer. [...] Since
> it's not possible to specify coep:credentialless or similar when
> making a PDF request with window.open (blob: https://~), it seems
> there's no way to open a blob fetched within the app using the OOPIF
> for PDF Viewer."

Detta är **exakt vårt mönster** (`URL.createObjectURL` + `window.open`)
och bekräftar att Chrome just nu har TVÅ parallella PDF-visar-
arkitekturer (GuestView, den äldre och mer beprövade; OOPIF, den nya,
gradvis utrullade), och att `blob:` + `window.open` är den kombination
som exponerat den nya arkitekturens brister först. Buggen är fixad, men
den visar att blob-vägen är den som får de färska, mindre genomtestade
kodpaths — INTE en anekdot, utan en primärkälla om var i kodbasen
riskerna faktiskt bor.

**Chromium-bugg 40712480** (fortfarande **New**, öppnad 2020-08-18,
Milestone 87, komponent "Internals>Plugins>PDF" +
"Blink>SecurityFeature>ContentSecurityPolicy"), titel *"PDF viewer
appears at half-size when viewing Blob URLs from document with strict
style-src CSP"*. Verbatim (hämtad 2026-08-22):

> "The PDF viewer's internal HTML apparently contains two inline style
> attributes, which are being subjected to the original document's CSP.
> If that CSP is strict on style-src, then the inline styles do not
> apply and the viewer appears at half height. [...] This is an
> extension of <https://crbug.com/chromium/271452>. It exhibits the same
> symptoms, and was regressed at the same time; however, the fix in that
> bug resolved the issue only for PDFs rendered from HTTP URLs."

Sista meningen är den viktiga: en tidigare regression fixades **enbart
för HTTP-levererade PDF:er** — blob-vägen ärvde aldrig samma fix. Detta
är ett andra, oberoende bevis på samma mönster som bugg 374947864: när
Chrome-teamet fixar PDF-visar-problem täcker fixarna ofta HTTP/file
FÖRST, och blob-vägen släpar efter eller missas.

**Blob-URL:er stöder Range-headers, men snävare än HTTP.** En
`blink-dev`-"Intent to Ship"-tråd (`mail-archive.com/blink-dev@chromium.org`,
hämtad 2026-08-22) om "Fetch-compliant range handling for blob URLs"
bekräftar att Chromium svarar 206 för en GILTIG enkel `Range`-header mot
en `blob:`-URL, men att en OGILTIG eller flerdelad `Range`-header (något
HTTP-servrar ofta hanterar mer tolerant, t.ex. genom att falla tillbaka
till hela filen) i stället ger ett hårt nätverksfel för `blob:`. Detta
rör robusthet snarare än hastighet för vår 150 KB enkelsidiga fil, men
bekräftar ändå mönstret: `blob:` är en STRÄNGARE, mindre förlåtande väg
än `http(s)`.

## 3. Popup kontra vanlig flik — spelar det roll?

**Källbelagt: PDF-renderarens EGEN process påverkas inte.** Chromiums
process-modell-dokumentation
(`docs/process_model_and_site_isolation.md`, `chromium.googlesource.com`,
hämtad 2026-08-22) säger uttryckligen om GuestView/MimeHandlerView/
ExtensionOptionsGuest: *"All of these cases use strict site isolation for
content they embed"*, och att extensions *"run in dedicated renderer
processes"*. Detta stämmer med den egna mätningen i § 1: PDF-visar-
extensionen (`chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai`) fick
sin egen process oavsett om värd-dokumentet var `blob:` eller `https:`,
och oavsett hur den öppnande ytan såg ut.

**Vad popup-mönstret FAKTISKT påverkar är den YTTRE, öppnande ramen —
inte PDF:en.** Samma dokument definierar en "browsing context group" som
flikar/ramar med referenser till varandra (t.ex. `window.opener`), och
kräver att samma-site-dokument i samma grupp delar process. Eftersom
`useForhandsvisaDokument.ts`s docblock uttryckligen UTELÄMNAR `noopener`
("anroparens ansvar... verifierat att `window.open('', '_blank',
'noopener')` returnerar `null`"), och SPA:n + den nya fliken är samma-
site (`http://localhost` mot sig själv), tvingas den ÖPPNANDE ramen —
inte PDF-visaren — dela renderarprocess med huvudappen. Det är en
arkitektoniskt begriplig konsekvens av ett redan medvetet designval
(inget `noopener`), men **ingen primärkälla hittades som visar att detta
mäter ut i en GPU-rasteriserings- eller scroll-skillnad.**

**EJ BELAGT:** en direkt, mätt skillnad i occlusion-tracking, GPU-
rasteriseringsprioritet eller compositor-schemaläggning mellan ett
`window.open`-poppat fönster och en vanligt navigerad flik, specifikt
för PDF-innehåll. Chrome har dokumenterade mekanismer för bakgrundsflik-
strypning och fönster-ocklusion (`chromium.org`-designdokument,
allmänt kända), men ingen källa kopplade dem till just detta scenario —
och popup-fönstret öppnas i FÖRGRUNDEN, vilket normalt undantar det från
bakgrunds-strypning oavsett.

**Slutsats för denna delfråga:** popup-mönstret är sannolikt en mindre
faktor, om ens någon, jämfört med leveransschemat (`blob:` mot en riktig
URL). Att byta bort `window.open` till en vanlig flik löser inte den
identifierade flaskhalsen enligt vad detta pass kunnat belägga.

## 4. Rekommenderad leveransväg för en genererad PDF

**Branschstandard, källbelagt via MDN** (`developer.mozilla.org/.../
Range_requests`, hämtad 2026-08-22): en resurs som ska kunna sökas i av
en visare bör serveras med `Accept-Ranges: bytes` och korrekt
`Content-Type`, och stödja `206 Partial Content` för `Range`-förfrågningar
— standarddefinitionen av "gör en fil visare-vänlig", schemaoberoende i
sig men i praktiken en egenskap `http(s)`- och `file:`-resurser får
gratis av nätverksstacken/filsystemet och `blob:` måste implementera via
en separat, striktare kodväg (§ 2).

**Vår egen kod bevisar redan att en riktig URL vinner.** Klass A
(sparade bilagor, `dokumentKalla.ts` rad 53–56) hämtar en signerad
Supabase Storage-URL och sätter den direkt som `handle.location.href` —
INGEN `blob:` inblandad. Detta är precis den väg Marcus A/B-testade som
"perfekt". Klass B/C (mallar/kvitton/den nya bilage-förhandsgranskningen)
bygger i stället `blob:` ur base64/en `Blob`, eftersom innehållet är
TRANSIENT och genererat on-demand utan att någonsin passera Storage.

**Öppen, overifierad caveat: Supabase Storage signerade URL:er kanske
inte annonserar `Accept-Ranges`.** Flera community-trådar (GitHub
`supabase/storage`-repot, `supabase`-org-diskussioner, från 2021, hämtade
2026-08-22) rapporterar att `createSignedUrl`-svar historiskt saknat
`Accept-Ranges`-headern trots att lagringslagret är S3-kompatibelt.
Detta är TREDJEPARTS-community-rapporter, INTE Supabases egen
dokumentation (som inte nämner Range-stöd alls för nedladdningar,
`supabase.com/docs/guides/storage/serving/downloads`, hämtad 2026-08-22),
och rapporterna är fyra-fem år gamla — **EJ BELAGT för nuvarande
Supabase-version**, och borde verifieras med ett direkt `curl -I` mot en
riktig signerad URL i vår egen staging-bucket innan det räknas som
avgörande. Oavsett Range-header-frågan visar Marcus egen A/B-jämförelse
att den signerade Storage-vägen ÄR snabb i praktiken — så även om
Range-stödet skulle visa sig saknas, tycks andra faktorer (enkel
nätverksväg, ingen Mojo-IPC, trolig HTTP-cache-träff vid
bootstrap-kedjans andra hämtning) redan vara tillräckliga.

## 5. Konkreta alternativ, rangordnade

**Detta är en rekommendation, inte ett beslut — Marcus avgör.**
Rangordnad efter hur starkt varje alternativ vilar på belägg, och vad det
faktiskt kostar att pröva.

1. **Signerad Storage-URL, när innehållet FÅR mellanlagras.** Vilar på:
   redan bevisat mönster i denna kodbas (klass A, `dokumentKalla.ts`),
   Marcus egen "upplevs snabb"-bekräftelse, MDN:s Range-rekommendation.
   Gäller INTE direkt för `useForhandsgranskaBilaga` (dess docblock är
   explicit "SIDOEFFEKTSFRI... når aldrig Storage-uppladdningen" — att
   ändra det är ett medvetet kontraktsbrott, inte en gratis vinst) men
   gäller redan, oförändrat, för sparade bilagor och kan övervägas för
   en KORT-LIVAD "utkast"-Storage-sökväg med TTL om Marcus vill riva det
   kontraktet medvetet.
2. **Service Worker som svarar med en riktig `Response` från en
   syntetisk samma-ursprungs-URL.** Vilar på: en förstaparts-dokumenterad
   mönster (`web.dev/articles/sw-range-requests`, hämtad 2026-08-22,
   citerar Workbox-modulen `workbox-range-request` som färdig lösning
   för att parsa `Range`-headers mot ett cachat/i-minnet svar). Appen
   har REDAN en Workbox-baserad service worker (`src/sw.ts`,
   `precacheAndRoute`/`registerRoute` redan i bruk,
   `workbox-precaching`/`workbox-routing`/`workbox-strategies` redan i
   `package.json`) — att lägga till EN route + `workbox-range-request`
   är ett litet, inte ett nytt, ingrepp. Bevarar SIDOEFFEKTSFRIHETEN
   (bytesen lämnar aldrig klienten, ingen Storage-uppladdning) samtidigt
   som PDF-visaren serveras via en väg som ser ut som `https:` för
   nätverksstacken. **Bäst avvägning för `useForhandsgranskaBilaga`s
   specifika kontrakt**, men OPRÖVAD av detta pass — ingen mätning
   bekräftar att det faktiskt eliminerar lagget, bara att arkitekturen
   är etablerad praxis för problemet "servera lokalt byggt innehåll som
   om det vore en riktig nätverksresurs".
3. **`<embed>`/`<iframe>` i egen sida i stället för `window.open`
   ny flik.** REDAN UTVÄRDERAD och avfärdad av grannpasset
   ([`forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22.md`](forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22.md)
   § 2): iframe-inbäddad PDF är strukturellt trasig på iOS Safari
   (renderas som bild, ingen scroll, ingen utskrift) — ett
   kompatibilitetsskäl, inte ett prestandaskäl, men tillräckligt för att
   grannpasset redan konvergerat branschen och vår egen kod mot ny
   flik. Detta pass tillför: att BYTA bort `window.open` löser
   sannolikt INTE blob-kostnaden (§ 1 visar att PDF-visar-processen är
   isolerad oavsett inbäddningsform) men UNDVIKER den specifika,
   dokumenterat instabila `window.open`+`blob:`-kombinationen från § 2
   (bugg 374947864). Räknas därför som en robusthetsvinst, inte en
   prestandafix, och ärver iOS Safari-problemet grannpasset redan
   identifierat.
4. **Nedladdning i stället för visning.** Löser problemet genom att ta
   bort funktionen. Strider direkt mot Marcus eget, färska
   (2026-08-22) produktbeslut, citerat verbatim i
   `useForhandsgranskaBilaga.ts`s docblock: *"Lotta ska inte skickas till
   pdf:en automatiskt utan välja att gå dit"* — han vill ha ett VAL att
   FÖRHANDSGRANSKA, inte tvinga fram en nedladdning. Rangordnas sist.
5. **Acceptera kostnaden.** Filen är 150 KB, en sida, kort-livad
   (stängs av Lotta efter en snabb koll). "Märkbart laggigt" är en
   riktig, av användaren bekräftad regression mot `file://`-upplevelsen,
   men den permanenta leveransvägen (sparade bilagor, klass A) är redan
   den snabba signerade-URL-vägen per ADR-119 — det är bara den
   LIVE-REDIGERINGS-förhandsgranskningen som bär kostnaden, och den är
   per konstruktion transient. Ett giltigt nollalternativ att väga mot
   kostnaden av alternativ 2, inte ett förslag detta pass driver.

## Dom

Frågans premiss — att `blob:`-leveransen är den strukturella boven,
inte PDF-innehållet — håller, och kompletterar (river ingenting i)
grannpassets slutsats att PDF-INNEHÅLLET (transparens, QR-vektorer) inte
är boven för just denna mall. Den EXAKTA mekanismen är dock bara HALVT
belagd: min egen live-mätning falsifierar den naiva "blob hämtas fler
gånger"-hypotesen (identisk trestegs-bootstrap för `blob:` och `https:`),
men bekräftar i stället en STRUKTURELL skillnad i HUR varje hämtning
kostar (Mojo-IPC-blob-läsning kontra sannolik nätverks-cache-träff) —
en skillnad Chromiums egen källkod och designdokument stödjer men som
detta pass inte kunnat tidsätta i millisekunder för den specifika filen.
Utöver ren hastighet finns TVÅ oberoende, källbelagda Chromium-buggar
som visar att `blob:` + `window.open` lever i en mindre väl underhållen,
just nu aktivt föränderlig del av PDF-visar-kodbasen (OOPIF-migrationen)
— ett skäl att föredra en riktig URL som är oberoende av
prestandafrågan. Popup kontra vanlig flik är, källbelagt, sannolikt INTE
en betydande faktor: PDF-renderaren isoleras i sin egen process oavsett.

## Vad jag inte kunde belägga

- **Millisekund-kostnaden av en Mojo-blob-läsning kontra en HTTP-cache-
  träff** för just en 150 KB, 1-sidig fil. Arkitekturen är källbelagd
  (§ 1), den faktiska tidskostnaden är det inte — detta pass körde ingen
  Performance-trace under en verklig scroll (kräver en interaktiv,
  redan öppnad PDF-flik med flera sidor att scrolla i; vårt testdokument
  var för litet för att meningsfullt kunna scrollas alls).
- **Om PDFium går tillbaka till `blob:`-URL:en eller det Mojo-baserade
  blob-registret UNDER SJÄLVA SCROLLNINGEN**, eller om den, efter den
  initiala trestegs-bootstrapen, enbart läser ur sin egen
  `chrome-extension://…/<uuid>`-resurs (som i så fall borde vara lika
  snabb oavsett ursprungsschema). Testfilen (434 byte, en sida) var för
  liten för att detta skulle gå att observera meningsfullt — en
  multi-sidig, multi-megabyte testfil hade krävts, vilket låg utanför
  detta pass tidsram.
- **Om Supabase Storage signerade URL:er annonserar `Accept-Ranges:
  bytes` i nuvarande version.** Community-rapporterna som säger nej är
  fyra–fem år gamla; Supabases egen dokumentation varken bekräftar eller
  dementerar. Ett `curl -I` mot en riktig signerad URL i vår egen
  staging-bucket skulle stänga denna lucka på minuter.
- **En mätbar GPU-rasteriserings- eller schemaläggnings-skillnad mellan
  popup och vanlig flik**, specifikt för PDF-visaren. Ingen primärkälla
  hittades åt någotdera hållet.
- **Om `dokumentKalla.ts`s och `useForhandsgranskaBilaga.ts`s befintliga
  kommentar** ("Chromes PDF-visare gör byte-range-anrop... vid scroll,
  och en tidigt revokerad URL bryter dem") är korrekt i sin PRECISA
  mekanism-beskrivning. Min mätning varken bekräftar eller motbevisar
  den för vår filstorlek (se ovan) — men den ändrar INTE slutsatsen att
  "aldrig revokera tidigt" är en säker policy oavsett mekanism.

## Oväntade fynd

- **`chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai`s trestegs-
  bootstrap-mönster var okänt innan detta pass** (dokument-wrapper →
  inre iframe → extension-egen resurs) och gäller ALLA PDF-navigeringar,
  inte bara `blob:`. Detta är i sig ett generellt PDF-arkitekturfynd som
  kan vara relevant för framtida PDF-relaterade pass (t.ex. det redan
  pågående `pdf-scrollprestanda`-passets § 5 nästa steg, en Performance-
  trace under scroll) och registreras här för återanvändning.
- **Chrome migrerar just nu sin PDF-visare från GuestView till en OOPIF-
  baserad arkitektur** (`kPdfOopif`-feature-flagga,
  `PdfViewerOutOfProcessIframeEnabled`-företagspolicy, komponenttaggen
  synlig i bugg 374947864). Detta betyder att PDF-visarens exakta
  beteende — inklusive eventuella `blob:`-relaterade kvirks — kan
  SKILJA SIG mellan Chrome-kanaler/versioner just nu, på ett sätt som
  inte var sant för några år sedan. Värt att komma ihåg om ett framtida
  test ger andra resultat på en annan Chrome-version.
- **`GenereringsPrototyp.tsx` hann konvergera mot `blob:`-mönstret
  (commits `6959f7ea`, `80ef31dc`) EFTER att grannpasset
  `forhandsgranskning-dokumentgenerering-…` läste och beskrev koden.**
  Ingen kritik av det passet — det beskrev korrekt vad som fanns då.
  Registreras som en påminnelse om att flera parallella research-pass
  samma dag kan se olika ögonblicksbilder av samma fil.

## Källförteckning

### Primärkällor

- Egen live-mätning, Chrome 151.0.7922.170 (macOS), chrome-devtools MCP,
  2026-08-22: nätverksloggar för en hemmagjord `blob:`-PDF och
  `https://www.orimi.com/pdf-test.pdf`, se § 1 för reqid-detaljer.
- Chromium — process-modell och site isolation:
  <https://chromium.googlesource.com/chromium/src/+/main/docs/process_model_and_site_isolation.md>
  (hämtad 2026-08-22)
- Chromium — Blob-lagringens designdokument:
  <https://chromium.googlesource.com/chromium/src/+/master/storage/browser/blob/README.md>
  (hämtad 2026-08-22)
- Chromium-bugg 374947864, "Opening a PDF blob with window.open causes
  a 'connection refused' error in the OOPIF PDF Viewer" (Fixed):
  <https://issues.chromium.org/issues/374947864> (hämtad live via
  chrome-devtools MCP 2026-08-22, sidan är en JS-SPA som inte går att
  hämta statiskt)
- Chromium-bugg 40712480, "PDF viewer appears at half-size when viewing
  Blob URLs from document with strict style-src CSP" (New):
  <https://issues.chromium.org/issues/40712480> (hämtad live via
  chrome-devtools MCP 2026-08-22)
- Chromium-bugg 40545405 (f.d. 775938), "PDF scrolling very slow,
  non-existant" — ingen blob-koppling, men bekräftar Chromes PDF-visares
  on-demand-rastrering som allmän baslinje: <https://issues.chromium.org/issues/40545405>
  (hämtad live via chrome-devtools MCP 2026-08-22)
- WHATWG File API — blob URL-registret, miljöbindning och
  åtkomstbegränsningar: <https://w3c.github.io/FileAPI/#blob-url-registry>
  (hämtad 2026-08-22; `w3c.github.io` är den publicerade spegeln av
  WHATWG-specen)
- MDN — HTTP Range requests: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests>
  (hämtad 2026-08-22)
- web.dev (Chrome-teamet) — "Handling range requests in service
  workers": <https://web.dev/articles/sw-range-requests> (hämtad
  2026-08-22)
- blink-dev — "Intent to Ship: Fetch-compliant range handling for blob
  URLs": <http://www.mail-archive.com/blink-dev@chromium.org/msg16917.html>
  (hämtad 2026-08-22)
- Supabase — "Serving assets from Storage":
  <https://supabase.com/docs/guides/storage/serving/downloads> (hämtad
  2026-08-22, nämner inte Range-stöd)

### Community-/sekundärkällor (tydligt märkta)

- Supabase — GitHub-diskussion, Range-stöd historiskt saknat för
  signerade URL:er, 2021: <https://github.com/orgs/supabase/discussions/4115>
  och <https://github.com/supabase/supabase/discussions/1558> (hämtade
  2026-08-22, fyra-fem år gamla, EJ verifierade mot nuvarande version)
- Mozilla Bugzilla 2056444 (**FIREFOX, INTE CHROMIUM** — citerad enbart
  som ANALOGT arkitektur-exempel på "blob via IPC blir en forward-only-
  ström", inte som belägg om Chrome): <https://bugzilla.mozilla.org/show_bug.cgi?id=2056444>
  (hämtad 2026-08-22)
- mozilla/pdf.js #9862, "Issues with PDFFetchStream and range requests
  (Chrome)" — rör PDF.js, inte Chromes NATIVA PDF-visare, citerad som
  angränsande kontext: <https://github.com/mozilla/pdf.js/issues/9862>
  (hämtad 2026-08-22)

### Interna källor (repot)

- `src/data/mutations/useForhandsvisaDokument.ts` — `window.open('',
  '_blank')`-synkront-mönstret, medvetet uteslutet `noopener`.
- `src/data/mutations/useForhandsgranskaBilaga.ts` — den nya (S108,
  2026-08-22), sidoeffektsfria `blob:`-baserade förhandsgranskningen;
  Marcus dom citerad verbatim i docblocket.
- `src/data/mutations/dokumentKalla.ts` — `blobUrlFranBase64`, den
  signerade-URL-vägen för klass A (`getAttachmentDownloadUrl`), och
  kommentaren om varför blob-URL:er aldrig revokeras.
- `src/components/dokument/DokumentYta.tsx` § docblock — det
  konvergerade ny-flik-mönstret för klass A/B/C.
- `src/components/dokument/prototyp/GenereringsPrototyp.tsx` rad 75,
  1265, 1382 — bekräftar att bilage-editorn nu använder
  `useForhandsgranskaBilaga` + `window.open(url, '_blank')`.
- `src/sw.ts` — den befintliga Workbox-baserade service workern
  (`precacheAndRoute`, `registerRoute`) som alternativ 2 i § 5 skulle
  byggas ovanpå.
- [`ADR-118`](../decisions/ADR-118-bilagors-rackviddsmodell.md),
  [`ADR-119`](../decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md)
  — räckvidds- och renderingsmotor-besluten som ramar in varför
  sparade bilagor (klass A) redan går via Storage och varför
  transienta förhandsgranskningar (klass B/C, samt den nya
  bilage-editor-förhandsgranskningen) medvetet inte gör det.
