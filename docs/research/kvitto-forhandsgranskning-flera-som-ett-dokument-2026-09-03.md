---
owner: marcus803
updated: 2026-09-03
review_by: 2026-12-03
status: draft
---

# Kvitto-förhandsgranskning av flera på en gång — ett dokument, N sidor, ett fönster

## Fråga

När Lotta registrerat N inbetalningar (typiskt 2–30) och vill förhandsgranska
alla N kvitton innan hon trycker "Skicka N kvitton" — vad är branschmönstret
och vår tekniskt bästa väg för att visa dem som ETT dokument med N sidor i
ETT webbläsarfönster, i stället för N fönster?

## 0. Vad som redan fanns — och vad som är nytt i detta pass

Läst i sin helhet innan sökning, i denna ordning:

- **`kvitto-beslutsunderlag-2026-08-30.md`** + **`kvitto-flodet-kartlaggning-
  2026-08-30.md`** + **`kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md`**
  (S113 resume 3–4) — kartlade flödet FÖRE TASK-353 fanns. Branschavsnittet
  där svarar på "hur skickar proffsen ETT kvitto" och "hur stäms betalningar
  av i bulk" — INTE på dagens fråga (förhandsgranska FLERA som ETT
  dokument). Slutsatsen "bulk finns bara som export av redan utfärdade
  dokument" höll fortfarande vid dagens sökning (Stripe, Bokio, Zettle —
  se § Branschmönster) men är nu nyanserad: Visma Administration och
  Fortnox VISAR att bulk-FÖRHANDSGRANSKNING/utskrift av ännu ej skickade
  dokument faktiskt finns i minst två stora system — det undersökta
  underlaget från augusti täckte aldrig den frågan.
- **`asynkront-kvittojobb-byggstenar-2026-08-30.md`**, **`verifiering-
  kvittoskivning-afk-natt-2026-08-30.md`**, **`forhandsgranska-spara-
  atervand-bilageflodet-2026-08-29.md`** — byggplanering/verifiering av
  HELA kvittoserien (skivning, AFK-natt-genomförbarhet), inte
  dokumentformen för en flerkvitto-förhandsgranskning. Läst för att
  utesluta överlapp; ingen fanns.
- **`docraptor-minimaltest-2026-08-22.md`**, **`mallar-server-side-
  docraptor-prod-2026-08-23.md`**, **`bilagor-prince-omgranskning-
  2026-08-23.md`**, **`kvitto-prince-gap-grid-omgranskning-2026-08-22.md`**,
  **`pdf-forhandsgranskning-leveransvag-blob-vs-url-2026-08-22.md`**,
  **`pdf-bifoga-eller-lanka-branschmonster-2026-08-19.md`**, **`pdf-
  renderingsvagen-html-vs-pdflib-2026-08-18.md`** — grunden för DocRaptor/
  Prince-fakta som redan var källbelagda (60 s synkront tak, `test`-
  semantik, självbärande HTML, `blob:`-scroll-mätningen som fällde
  klientsidig sammanslagning). ÅLDER: 8–15 dagar, tekniskt stabilt
  underlag (API-dokumentationen ändras sällan) — återanvänt rakt av utan
  omsökning, men KOMPLETTERAT med två frågor ingen av dem ställde:
  prissättning (per dokument vs per sida) och `break-before:page` på en
  flex-container. Båda är nya i detta pass.
- **Kod, läst direkt (inte tidigare sammanfattad någonstans):**
  `BetalningsInkorg.tsx` (rad ~827–1000), `inkorg-harledningar.ts`
  (`kanForhandsgranska`), `kvitton.ts` (`useForhandsgranskaKvitto`),
  `preview-receipt/index.ts` (450 rader, hela filen), `_shared/mall-
  render.ts` (hela filen), `_shared/utkast.ts`, `_shared/kvittojobb.ts`.
  Detta gav TVÅ fynd som INTE stod i något tidigare pass (se § Oväntade
  fynd i slutrapporten till orkestreraren): (1) `vantande`-kön i
  `BetalningsInkorg` är SID-omfattande, inte per event — en
  "Skicka N kvitton"-omgång kan alltså spänna över FLERA events samtidigt;
  (2) SEND-vägen (`_shared/kvittojobb.ts`, ADR-129 beslut 10) har REDAN en
  bounded-parallelism-renderare för N kvitton (`korMedTak`,
  `PDF_SAMTIDIGHETSTAK = 2`) — den halva av Option C som "renderar N
  separata PDF:er" är alltså inte hypotetisk, den finns och kör i
  produktion för sändningen. Ingen tidigare research nämner någotdera.

Inget beslut i `ADR-109`/`ADR-119`/`ADR-124`/`ADR-125`/`ADR-128`/`ADR-129`
tar ställning till en KOMBINERAD flerkvitto-förhandsgranskning — de reglerar
numrering, renderingsväg, leveransväg och jobbmotorn för att SKICKA, inte
formen på en förhandsgranskning av flera. Ingen ADR att falsifiera eller
skydda här; frågan är genuint öppen.

## Sammanfattning

**Rekommendation (inte beslut): Option A** — ETT DocRaptor-anrop med ETT
HTML-dokument som innehåller N ifyllda `.sida--kvitto`-block, sammansatta av
EF:en (mallen `kvitto.html` rörs INTE). Skälen, kort: DocRaptor fakturerar
**per dokument, inte per sida** (verifierat mot `docraptor.com/plans` och
`/compare/selectpdf`, 2026-09-03) — N-sidig förhandsgranskning kostar exakt
lika mycket som dagens EN-sidiga; `break-before: page` för att starta en ny
sida per block är en dokumenterad, sedan länge stabil Prince-mekanism
(motsvarande `h1 { break-before: page }`-exemplet i Prince 14-guiden); och
mönstret finns redan hos branschledare (Visma Administration kombinerar
uttryckligen flera dokument till "en och samma pdf-fil"; Fortnox
massbearbetar med en uttalad "förhandsgranska"-handling; Pretix API:t
"render[ar] a set of tickets into one combined PDF file"). Två saker MÅSTE
mätas innan bygge (§ Vad som måste mätas): renderingstiden vid N≈30 mot vårt
EGET 30 s-klienttak (hälften av DocRaptors 60 s), och om ett ovanligt långt
kvitto (kvittot "får växa", olikt bekräftelsebilagan) bryts korrekt inuti sin
egen flex-container om det växer över en sida. Fönster-först-mönstret
(`window.open('', '_blank')` synkront i klicket) gäller OFÖRÄNDRAT och
STARKARE — Chrome konsumerar användarens klick-behörighet ("transient
activation") inom "a few seconds" (WebKit-teamets egen formulering), och ett
N-sidigt dokument renderar per definition inte snabbare än ett en-sidigt.

## Branschmönster

| System | Mönster | Handlingens namn (verbatim, källspråk) | Belägg |
|---|---|---|---|
| **Visma Administration** (Spiris-hjälpen, samma produktfamilj som eEkonomi) | Inställning kombinerar VARJE dokument som skrivs ut med PDF-val till EN gemensam fil | *"Skicka dokument med utskriftsval Pdf till samma pdf-fil – Om du markerar det här valet kommer de dokument som har utskriftsvalet Pdf att samlas i en och samma pdf-fil."* | [support.spiris.se](https://support.spiris.se/visma-administration-1000/content/online-help/utskrifter-fakturor.htm), hämtat 2026-09-03 |
| **Fortnox** | "Massbearbeta kundfakturor" — markera flera, kör en bulk-handling | *"förhandsgranska, skriva ut, skicka och bokföra"* (fyra bulk-handlingar, förhandsgranskning FÖRST i listan) | [support.fortnox.se/produkthjalp/fakturering/massbearbeta-fakturor](https://support.fortnox.se/produkthjalp/fakturering/massbearbeta-fakturor), hämtat 2026-09-03 |
| **Shopify** (native admin, ingen app krävs) | Markera flera ORDRAR → EN bulk-utskriftshandling → print/PDF-utfall för alla markerade | *"Select the orders that require packing slips. Click Print > Print packing slips."* | [help.shopify.com/…/printing-packing-slips](https://help.shopify.com/en/manual/fulfillment/managing-orders/printing-orders/packing-slips/printing-packing-slips), hämtat 2026-09-03 |
| **Pretix** (biljett-PDF-API, inte fakturaflödet) | Explicit API-kontrakt: lista av "parts" → ETT kombinerat PDF-svar, ASYNKRONT (statuslänk) | *"you can instruct the system to render a set of tickets into one combined PDF file"* | [docs.pretix.eu/dev/api/resources/ticketoutputpdf.html](https://docs.pretix.eu/dev/api/resources/ticketoutputpdf.html), hämtat 2026-09-03 |
| **Stripe** (kontrastfall — NEGATIVT fynd) | INGEN inbyggd bulk-PDF-export i Dashboard; endast CSV-export eller tredjeparts-appar (t.ex. "Bulk Actions" i App Marketplace) | *"Stripe lets you export CSV reports... but not PDFs. To get PDFs, you typically need to click into each invoice"* | [tailride.so/blog/download-stripe-invoices](https://tailride.so/blog/download-stripe-invoices) (tredjepart, sekundär källa), [marketplace.stripe.com/apps/bulk-actions](https://marketplace.stripe.com/apps/bulk-actions) (Stripes egen app-katalog, bekräftar luckan indirekt genom att fylla den), hämtat 2026-09-03 |
| Bokio, Billogram, Zettle | **Ingen bulk-förhandsgranskning hittad** — bulk finns bara som export av redan bokförda verifikat eller e-postinkorg för INKOMMANDE kvitton, inte som "förhandsgranska N innan de går ut" | Frånvaro, inte belägg — se § Vad jag inte kunde belägga | Sökt 2026-09-03, tunn/ingen träff |

**Tolkning:** mönstret "N dokument → EN PDF, förhandsgranskad/utskriven i
klump" finns tydligast i **B2B-fakturering och e-handelns orderhantering**
(Visma, Fortnox, Shopify) och i ett rent **API-kontrakt för
dokumentgenerering** (Pretix). Det är INTE observerat hos de rena
betalnings-/POS-plattformarna (Stripe, Zettle) — där är varje kvitto en
isolerad transaktionshändelse och bulk sker efteråt som export, inte som
förhandsgranskning. Vårt läge (Lotta samlar N betalningar i en session-lokal
kö innan hon skickar) liknar strukturellt fakturerings-fallet mer än
POS-fallet, vilket stödjer att branschens fakturerings-mönster är rätt
referens snarare än POS-mönstret.

## DocRaptor/Prince-fakta

Alla siffror nedan är verifierade direkt mot förstapartskällan 2026-09-03,
utöver det som redan var källbelagt i `mallar-server-side-docraptor-prod-
2026-08-23.md` (återanvänt, inte omsökt, eftersom API-referensen inte ändras
på två veckor).

- **Prissättning: PER DOKUMENT, inte per sida — nytt i detta pass.**
  `docraptor.com/compare/selectpdf`, verbatim: DocRaptor charging per
  document *"without consideration for page count"*, kontrasterat
  uttryckligen mot en konkurrent som *"counts every 50 pages in a document
  as a 'conversion'"*. Plantabellen (`docraptor.com/plans`, hämtad
  2026-09-03): Free $0/5 dok, **Basic $15/125 dok**, Professional $29/325,
  Premium $75/1250, Max $149/5000, Bronze/Silver/Enterprise därutöver.
  Basic-planen matchar ADR-119:s "≈4 % av billigaste plan" (5,5 av 125 ≈
  4,4 %). **Konsekvens för vår fråga:** en kombinerad N-sidig
  förhandsgranskning (Option A) kostar EXAKT SAMMA som dagens en-sidiga —
  N separata renderingar (Option C) kostar N gånger så mycket, även om
  inget av det som renderas faktiskt skickas.
- **Synkront tak 60 s, samtidighetstak ANGES till 30 men är sannolikt
  plantrappat — falsk trygghet att lita blint på talet.**
  `docraptor.com/documentation/api/limits` (hämtad 2026-09-03, oförändrat
  sedan augusti-passet): *"Simultaneous Request Limit: 30"*,
  *"Synchronous Document Generation Time (default): 1 minute"*,
  *"Asynchronous Document Generation Time: 10 minutes"*, och
  **"We do not impose hard limits on numbers of pages, document complexity,
  input size, or output size (except for hosted documents)."** — inget
  sidantalstak alls, källbelagt två gånger oberoende (augusti-passet +
  denna verifiering). MEN: en separat sökning indikerar att *"DocRaptor
  limits generation time, simultaneous requests, and documents created per
  billing period based on your DocRaptor plan"* — alltså plan-beroende,
  vilket stämmer med vår EGEN kods kommentar (`_shared/kvittojobb.ts` rad
  67–72, ADR-129 beslut 10): *"DocRaptors dokumenterade tak för konton utan
  utökad kapacitet är ett litet ensiffrigt tal"* — därav vår egen
  konservativa `PDF_SAMTIDIGHETSTAK = 2`. **De två siffrorna (30 vs
  "ensiffrigt") är INTE en motsägelse jag kunnat lösa** — trolig
  förklaring är att 30 är ett generellt/högre-plans-tak medan vår kontotyp
  (Basic) har ett lägre, odokumenterat golv, men ingen sida jag nådde
  bekräftar detta explicit. Se § Vad jag inte kunde belägga.
- **`break-before: page` är en stabil, väldokumenterad mekanism för att
  starta en NY sida före ett block — oberoende av om blocket är en
  flex-container.** Prince 14-guiden (`princexml.com/doc/14/paged/`,
  hämtad 2026-09-03), verbatim-exempel: `h1 { break-before: page; }` för
  att starta ett nytt kapitel på en ny sida. Named pages (`page:
  <namn>`-egenskapen) tillåter dessutom OLIKA `@page`-regler för olika
  sektioner i SAMMA dokument — irrelevant för oss (alla kvitton är samma
  A4-storlek) men bekräftar att flera logiska "dokument" kan leva i en
  fysisk PDF.
- **Prince har en KÄND, dokumenterad begränsning — men den gäller innehåll
  som måste brytas INUTI en flex-container över en sidgräns, inte att
  FÖRE en flex-container tvinga en ny sida.** Två Prince-forumtrådar
  (`princexml.com/forum/topic/5191` och `/4051`, hämtade 2026-09-03):
  Prince-teamet själva, verbatim: *"our flex column containers don't
  consistently adjust their height to account for fragmentation"* och
  *"CSS does not specify exact details of flex fragmentation"* — ett
  ERKÄNT, ÖPPET problem, senast bekräftat aktivt utan fastställt
  lösningsdatum. Skillnad som spelar roll för oss: vårt `.sida--kvitto`
  är `display:flex; flex-direction:column` (`kvitto.css` rad 59–60), men
  ETT kvitto får i dag plats på EN sida (mätt: 51 823 bytes, "1 sida" i
  `docraptor-minimaltest-2026-08-22.md`). Risken är alltså SMAL: den
  triggas bara om ett enskilt kvitto (som "får växa", olikt
  bekräftelsebilagan) någon gång blir längre än en A4-sida — inte av att
  N kvitton staplas efter varandra. `break-before:page` MELLAN blocken är
  en annan, enklare, väldokumenterad operation än att bryta INUTI ett.
- **`http_timeout`-default är 10 s** (redan källbelagt augusti,
  `docraptor.com/documentation/api`) — gäller resurser Prince HÄMTAR
  under rendering (typsnitt/bilder via URL). Irrelevant här: mallarna är
  helt självbärande (data-URI:er), noll externa hämtningar, mätt genom
  grep i befintligt pass. Oförändrat av att dokumentet blir N gånger
  längre.
- **Vårt EGET klient-timeout, `DOCRAPTOR_TIMEOUT_MS = 30_000`
  (`_shared/mall-render.ts` rad 288), är HÄLFTEN av DocRaptors
  dokumenterade 60 s-tak.** Detta är VÅR kod, inte DocRaptors gräns — en
  `AbortController` som avbryter fetchen och (via `arRetrybart`) triggar
  EN retry på 5xx/timeout. Ett N=30-dokument som tar >30 s att rendera
  hos DocRaptor (men <60 s) skulle alltså trippa VÅRT eget tak i onödan
  och dubbelrendera hela den stora payloaden — en kostnad som inte finns
  vid dagens en-sidiga anrop. Se § Vad som måste mätas.

## Options-rymd A–E

| # | Beskrivning | Fördelar | Nackdelar/risker | Kräver ändring av |
|---|---|---|---|---|
| **A** | ETT HTML-dokument, N ifyllda `.sida--kvitto`-fragment (Eta-fyllda med BEFINTLIG `byggKvittoData`+`fyllOchGorSjalvbarande` per fragment), sammanfogade med `break-before:page`, självbärande-görs EN gång på det sammanslagna dokumentet, EN DocRaptor-POST | Kostar SAMMA som ett kvitto (per-dokument-pris); mallen `kvitto.html` rörs ALDRIG (parity-grinden, minimaltestet och det befintliga sändflödet förblir helt orört); återanvänder 100 % av redan bevisad Eta-fyllnings-/inbäddningslogik; branschmönstret (Visma, Fortnox, Pretix) | Ny kompositionsfunktion i EF-lagret (liten, men ny kod); render tid/storlek för N≈30 är omätt; kräver en NY lagringsnyckel för utkastet eftersom kön kan spänna över FLERA events (`utkast/<eventId>/kvitto.pdf` passar inte) | Ny funktion i `_shared/mall-render.ts` (eller sidomodul); ny `preview-receipt`-gren eller ny EF; `_shared/utkast.ts`s path-schema (ADR-124 § "en fil per event och typ" måste amenderas eller kompletteras) |
| **B** | `kvitto.html`-mallen får en Eta-loop över `data.kvitton[]`, en `<div class="sida sida--kvitto">` per objekt inbyggt i mallen | Samma pris-fördel som A; "renare" om man tycker loopen hör hemma i mallen | Rör en PARITETS-GRINDAD, MINIMALTEST-BEVISAD artefakt som delas med DET SKARPA SÄNDFLÖDET (`send-receipt-email`) — en bugg i loopen kan regrediera det EN-kvitto-flödet aldrig borde påverkas av; `scripts/synka-bilagemallar.mjs` + `check-mallparitet.sh` måste köras om; ingen teknisk fördel över A som väger upp den risken | `docs/mallar/bilagor/kvitto.html`, `kvitto.css` (ev.), `_shared/mallar/kvitto.html.ts` (autogenererad spegel) |
| **C** | N SEPARATA DocRaptor-renderingar (redan byggd bounded-parallelism-kod, `_shared/kvittojobb.ts` `korMedTak`, `PDF_SAMTIDIGHETSTAK=2`), sedan slås de N PDF:erna ihop med en merge-bibliotek (pdf-lib eller likvärdig) | Rendering-halvan är REDAN BYGGD och produktionsbevisad (ADR-129 beslut 10) — bara merge-steget är nytt | Kostar N gånger så mycket per förhandsgranskning (DocRaptor fakturerar per dokument); pdf-lib är TIDIGARE MEDVETET RIVET ur repot — men för RENDERING/textlayout-skäl (ADR-119: "kräver en egen textlayoutmotor"), INTE för merge-förmåga; en ren merge-användning (`PDFDocument.load` + `copyPages` + `save`) är en ANNAN, mycket smalare uppgift än det som fälldes — ändå en ÅTERINFÖRD extern dependency att motivera på nytt; pdf-lib är npm-mätt OUNDERHÅLLET sedan ~12 månader (Snyk/Cloudsmith-skanning, 2026-09-03) men fortsatt 9,8 miljoner npm-nedladdningar/vecka och fungerar utan native-beroenden i Deno | Ny dependency (`pdf-lib` i `package.json` + Deno-import), en ny merge-funktion, `Promise.all`/`korMedTak`-återanvändning för renderingsfasen |
| **D** | Klientsidig sammanslagning i webbläsaren (N XHR mot `preview-receipt`, merge med en JS-PDF-lib i klienten, visa en `blob:`-URL) | Ingen ny EF-kod | **REDAN MÄTT OCH FÖRKASTAT** — `ADR-124`: `blob:`-URL:er laggar vid scroll i Chromes PDF-visare, sex mätta armar, headed Chrome 151 (`TASK-302`). Samma mekanism som redan motiverade att flytta ENA kvittots förhandsgranskning BORT från klientsidig hantering skulle drabba N-sidan HÅRDARE (större dokument, mer scroll) | — (avfärdad, ingen kod skulle byggas) |
| **E** | Webbläsarens inbyggda PDF-visare på ETT N-sidigt dokument (= slutresultatet av A/B, bara en presentationsfråga) ELLER N separata `<embed>`/`<iframe>`-inbäddade PDF:er på en egen sida | E1 (N-sidigt dokument i nativ visare) ÄR bara hur A/B:s resultat VISAS — ingen egen teknik; E2 (N iframes) ger scrollbar överblick utan ett enda stort dokument | E2: ingen industriprecedent hittad, ingen teknisk fördel identifierad över ETT sammanhängande dokument, och N samtidiga PDF-inbäddningar på en sida är en känd prestandarisk (`docs/research/pdf-scrollprestanda-pdfium-chrome-2026-08-22.md`, ej omtaget här men relevant) | — |

**Rekommendation (inte beslut): Option A.** Den enda vägen som (1) matchar
DocRaptors faktiska prismodell (per dokument), (2) inte rör en
parity-grindad, redan minimaltestad mall som delas med det skarpa
sändflödet, och (3) har tre oberoende branschprecedent (Visma, Fortnox,
Pretix). Option C är inte fel — dess rendering-halva är redan byggd och
bevisad i produktion — men kostar N gånger så mycket per förhandsgranskning
för noll extra nytta jämfört med A, och kräver en ny, tidigare medvetet
avfärdad dependency. Option B ger ingen fördel över A men tar en risk A helt
undviker. D är redan mätt och förkastat av `ADR-124`. E är antingen samma
sak som A/B (E1) eller obelagd/riskabel utan motiverande fördel (E2).

## Vad som måste mätas före bygge

Minimaltest-disciplinen (`~/.claude/CLAUDE.md` § Instruktioner — "minimalt
test innan full implementation"), konkret för denna fråga:

1. **2 kvitton, 1 sidbrytning.** Bygg en liten kompositionsfunktion som
   fyller `kvitto.html` två gånger med olika fiktiv data (samma mönster som
   `TYPEXEMPEL` i `preview-receipt/index.ts`), lägger `break-before: page`
   på det andra `.sida--kvitto`-blocket, självbärande-gör HELA det
   sammanslagna dokumentet EN gång, och POST:ar till DocRaptors testnyckel
   (samma mönster som `docraptor-minimaltest-2026-08-22.md`). Verifiera med
   `pdfinfo` (exakt 2 sidor, A4), `pdftotext -bbox` (rätt namn/belopp på
   rätt sida, ingen bleed/overlap vid sidbrytningen) och `pdffonts`
   (Carlito fortfarande `emb=yes` på båda sidor).
2. **Render tid vid N≈30, mätt — inte extrapolerad.** Generera 30 fiktiva
   fragment, mät faktisk DocRaptor-motorlatens (`x-docraptor-ms`-mönstret
   från minimaltestet) och jämför mot VÅRT EGET 30 s-klienttak
   (`DOCRAPTOR_TIMEOUT_MS`) och DocRaptors dokumenterade 60 s-tak. Om
   latensen närmar sig 30 s: höj vårt eget tak (fortfarande gott och väl
   under DocRaptors 60 s) snarare än att riskera en retry som fördubblar
   kostnaden för det stora anropet.
3. **Ett artificiellt långt kvitto.** Fyll ETT av N-fragmenten med ett
   onaturligt stort antal kvittorader så att just det kvittot växer förbi
   en A4-sida, och verifiera att `.sida--kvitto`s flex-brytning ger ett
   läsbart resultat (inte överlappande text) — det är den SMALA risk
   Prince-forumtrådarna (§ DocRaptor/Prince-fakta) faktiskt beskriver.
4. **Payload-storlek: en gång vs N gånger självbärande-görning.** Mät om
   att fylla N Eta-fragment RÅTT och självbärande-göra HELA det
   sammanslagna dokumentet EN gång (rekommenderad form) ger märkbart mindre
   payload/snabbare rendering än att köra `fyllOchGorSjalvbarande` N gånger
   och konkatenera N redan självbärande HTML-dokument (varje med sin egen
   upprepade uppsättning bas64-typsnitt).
5. **Lagringsnyckelns form.** Bekräfta att `vantande`-kön i
   `BetalningsInkorg.tsx` FAKTISKT kan spänna över flera events i en
   verklig session (kod läst, inte skarpt utprovat) och besluta en
   nyckelform för ett kombinerat utkast som inte krockar med
   `ADR-124`s "en fil per event och typ"-invariant.

## Öppna frågor till grillningen

1. Ska en kombinerad förhandsgranskning kunna spänna över FLERA event i
   samma "Skicka N kvitton"-omgång — vilket koden visar att kön redan
   TILLÅTER strukturellt (`vantande` är sid-omfattande state, inte
   per-event)? Om ja: vilken lagringsnyckel ska utkastet få, eftersom
   `utkast/<eventId>/kvitto.pdf` bygger på exakt EN eventId?
2. Ska en "Förhandsgranska alla N"-knapp ERSÄTTA per-rad-knappen (dagens
   TASK-353-form vid N>1) eller KOMPLETTERA den — en superknapp för
   helhetsbilden, per-rad kvar för att snabbt se en enskild persons kvitto?
3. Vid N nära taket (30): är EN lång skrollbar PDF verklig bättre UX för
   Lotta på sin iPad än något grupperat/paginerat — eller blir 30 A4-sidor
   i ett fönster svårnavigerat på en surfplatta? Ingen branschkälla i detta
   pass adresserade skärmstorlek specifikt.
4. Ska "FÖRHANDSVISNING"-platshållaren stå på VARJE sida i det kombinerade
   dokumentet (trivialt, samma sträng N gånger) — eller finns ett behov av
   att visa vilket LÖPNUMMER varje kvitto TROLIGEN kommer få (riskabelt:
   Stripes egen modell visar HELLRE `null`/frånvaro än ett gissat nummer,
   se § Branschmönster-tabellens Stripe-rad och `object`-schemat där
   `number`/`invoice_pdf` är `null` till finalisering)?
5. Hur ska ETT trasigt underlag bland N (t.ex. en anmälan som försvunnit ur
   basen mellan registrering och klick) hanteras i EN kombinerad rendering
   — hoppa tyst över den sidan, lägga en tydlig felsida på dess plats, eller
   fail:a hela den kombinerade förhandsgranskningen? `_shared/kvittojobb.ts`
   FAS 1 har redan en per-post-felmodell för SÄNDNINGEN (`avslutaMedFel`) —
   ska förhandsgranskningen spegla samma disciplin, eller är den enklare
   eftersom den är sidoeffektsfri?

## Vad jag inte kunde belägga

- **Fortnox: exakt om massbearbetningens "förhandsgranska"/"skriva ut" ger
  EN kombinerad PDF eller N separata.** Vendor-sidan bekräftar handlingarna
  (*"förhandsgranska, skriva ut, skicka och bokföra"*) men inte
  filformatet på resultatet. Svagare belägg än Vismas verbatim-citat.
- **DocRaptors samtidighetstak för VÅR kontotyp specifikt.** `/limits`-
  sidan säger 30 rakt av; vår egen kod (ADR-129) antyder ett mycket lägre,
  odokumenterat tak för konton "utan utökad kapacitet". Ingen sida jag
  nådde reder ut om 30 är universellt eller ett högre-plans-tak. Irrelevant
  för Option A (ETT anrop oavsett N) men avgörande om Option C någonsin
  byggs.
- **Chrome/WebKits exakta "transient activation"-varaktighet i sekunder.**
  Både MDN och WebKits egen utvecklarblogg beskriver den som medvetet ICKE
  exponerad och "a short time (a few seconds, maybe)" — ingen förstapartskälla
  ger ett fast tal. Vårt eget mätta fall (Marcus prod-röktest 2026-08-26,
  fönstret blockerades efter "några sekunders" rendering) är alltså
  FÖRENLIGT med mekanismen men inte en mätning av dess exakta gräns.
- **Faktisk DocRaptor-renderingstid vid N=30 fragment i vår mall.** Ingen
  källa (vår egen eller extern) mäter hur rendering skalar med
  sidantal/innehållsmängd för just Eta+Prince på vår specifika CSS. Detta
  är den viktigaste omätta punkten i hela passet — se § Vad som måste
  mätas punkt 2.
- **Bokio, Billogram, Zettle: om en bulk-förhandsgranskning genuint saknas,
  eller bara var svår att hitta i den svenska sökningen.** Frånvaro av
  träff behandlas som frånvaro av belägg, inte som bevis att funktionen
  inte finns.
- **Om `break-before: page` fungerar IDENTISKT på VÅR exakta
  `.sida--kvitto` (med de Prince-primitiv-ersättningar TASK-304 redan gjort:
  grid→table, flex-gap→margin) som på Prince-dokumentationens generiska
  `h1`-exempel.** Ingen Prince-källa adresserar break-before specifikt på en
  flex-container — bara det ANNORLUNDA problemet (brytning INUTI en
  flex-container). Detta är exakt vad minimaltestet (§ Vad som måste mätas
  punkt 1) ska stänga.

## Källor

- DocRaptor — pricing per document vs. per page: [docraptor.com/compare/selectpdf](https://docraptor.com/compare/selectpdf), hämtat 2026-09-03
- DocRaptor — planer och priser: [docraptor.com/plans](https://docraptor.com/plans), hämtat 2026-09-03
- DocRaptor — API-referens (synkront tak, `document_type`, `javascript`): [docraptor.com/documentation/api](https://docraptor.com/documentation/api), hämtat 2026-09-03 (samma sida källbelagd i augusti-passet, oförändrad)
- DocRaptor — API-gränser (samtidighet, sidantal): [docraptor.com/documentation/api/limits](https://docraptor.com/documentation/api/limits), hämtat 2026-09-03
- Prince — Paged Media / `break-before` (Prince 14 User Guide): [princexml.com/doc/14/paged/](https://www.princexml.com/doc/14/paged/), hämtat 2026-09-03
- Prince-forum — Page breaking with Flex: [princexml.com/forum/topic/5191](https://www.princexml.com/forum/topic/5191/page-breaking-with-flex), hämtat 2026-09-03
- Prince-forum — Page-break inside Flexbox: [princexml.com/forum/topic/4051](https://www.princexml.com/forum/topic/4051/page-break-inside-flexbox), hämtat 2026-09-03
- Visma Administration-hjälp (Spiris) — kombinera PDF-utskrifter till en fil: [support.spiris.se/visma-administration-1000/.../utskrifter-fakturor.htm](https://support.spiris.se/visma-administration-1000/content/online-help/utskrifter-fakturor.htm), hämtat 2026-09-03
- Fortnox support — Massbearbeta kundfakturor: [support.fortnox.se/produkthjalp/fakturering/massbearbeta-fakturor](https://support.fortnox.se/produkthjalp/fakturering/massbearbeta-fakturor), hämtat 2026-09-03
- Shopify Help Center — Printing packing slips (bulk): [help.shopify.com/.../printing-packing-slips](https://help.shopify.com/en/manual/fulfillment/managing-orders/printing-orders/packing-slips/printing-packing-slips), hämtat 2026-09-03
- Shopify Help Center — Order Printer, printing documents: [help.shopify.com/.../order-printer/printing-documents](https://help.shopify.com/en/manual/fulfillment/managing-orders/printing-orders/order-printer/printing-documents), hämtat 2026-09-03
- Shopify Changelog — Print packing slips in bulk: [changelog.shopify.com/posts/print-packing-slips-in-bulk-from-the-orders-list](https://changelog.shopify.com/posts/print-packing-slips-in-bulk-from-the-orders-list), hämtat 2026-09-03
- Pretix API-dokumentation — PDF ticket output (kombinerad PDF via "parts"): [docs.pretix.eu/dev/api/resources/ticketoutputpdf.html](https://docs.pretix.eu/dev/api/resources/ticketoutputpdf.html), hämtat 2026-09-03
- Stripe — Invoice object (`number`/`invoice_pdf` null till finalisering): [docs.stripe.com/api/invoices/object](https://docs.stripe.com/api/invoices/object), hämtat 2026-09-03
- Stripe — Preview an invoice: [docs.stripe.com/invoicing/preview](https://docs.stripe.com/invoicing/preview), hämtat 2026-09-03
- Stripe bulk-PDF-lucka (tredjepart, sekundär källa): [tailride.so/blog/download-stripe-invoices](https://tailride.so/blog/download-stripe-invoices), hämtat 2026-09-03; Stripes egen app-katalog som fyller luckan: [marketplace.stripe.com/apps/bulk-actions](https://marketplace.stripe.com/apps/bulk-actions)
- MDN — Transient activation (glossary): [developer.mozilla.org/en-US/docs/Glossary/Transient_activation](https://developer.mozilla.org/en-US/docs/Glossary/Transient_activation), hämtat 2026-09-03
- WebKit-bloggen — The User Activation API ("a short time (a few seconds, maybe)"): [webkit.org/blog/13862/the-user-activation-api](https://webkit.org/blog/13862/the-user-activation-api/), hämtat 2026-09-03
- pdf-lib — underhållsstatus (Snyk-skanning): [security.snyk.io/package/npm/pdf-lib](https://security.snyk.io/package/npm/pdf-lib), hämtat 2026-09-03
- Interna primärkällor (kod, denna worktree): `src/components/betalningar/BetalningsInkorg.tsx`, `src/components/betalningar/inkorg-harledningar.ts`, `src/data/mutations/kvitton.ts`, `src/data/mutations/useForhandsgranskaBilaga.ts`, `supabase/functions/preview-receipt/index.ts`, `supabase/functions/_shared/mall-render.ts`, `supabase/functions/_shared/utkast.ts`, `supabase/functions/_shared/kvittojobb.ts`, `docs/mallar/bilagor/kvitto.css`, `docs/decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md`, `docs/decisions/ADR-129-jobbmotorn-ko-cron-och-kick.md`
