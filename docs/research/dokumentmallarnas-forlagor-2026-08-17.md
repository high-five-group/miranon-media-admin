---
owner: marcus803
updated: 2026-08-17
review_by: 2026-11-17
status: draft
---

# Dokumentmallarnas förlagor — Roger & Lottas verkliga dokument mot appens PDF-generatorer (2026-08-17)

> **Proveniens:** avgränsat utredningspass (fristående subagent, ej
> `marcus-system:research`-skillen), kört i worktree
> `.claude/worktrees/s107-utredningspasset` på gren `docs/s107-bilagesamsyn`
> @ `12907d74` (`origin/main` @ `c9a21e43`). **Modell:** Claude Sonnet 5
> (modell-ID `claude-sonnet-5`). PRODUKTKRAV källmärkt till Marcus
> 2026-08-17 (uppdragstexten): appens dynamiska dokument/mallar MÅSTE se ut
> EXAKT som Roger & Lottas dokument ser ut idag. Läsande pass — **noll
> kodändringar, noll commits.** Källmaterialet lästes med `Read`
> (sidvis för PDF:er) samt `pdffonts`/`pdftocairo`/`pdfimages`
> (poppler-utils, disk-verifierade typsnittsnamn och färgvärden, inte
> visuella gissningar) mot filerna i `/Users/marcus/Downloads/exempelpdokument/`
> och `/Users/marcus/Downloads/Automation exempel.pdf`.

## Kort svar

**Appens två PDF-generatorer (`receipt-pdf.ts` för klass C,
`generate-event-attachment/index.ts` för klass B) producerar just nu ren,
ostylad `pdf-lib`-text på en vit sida — ingen logotyp, inget typsnitt utöver
standard-Helvetica, inga färger, ingen tabell, ingen ram.** Roger & Lottas
verkliga dokument är Word-dokument (Calibri-familjen + typsnittet
`Cavolini-Bold` för dekorativa rubriker, disk-verifierat via `pdffonts`) med
en inklistrad rastrerad logotyp, Words standardfärger (hyperlänk-blått
`#0563C1`, gult överstryk `#FFFF00`, temafärgen `#4472C4`), rundade
ramrutor och — för kvittot — en fullständig fakturalayout som ser ut som
export ur ett separat svenskt bokförings-/faktureringssystem, inte något
byggt av appen. Gapet är inte "lite styling saknas" — det är att generatorn
just nu inte försöker alls: varken logga, typsnitt, färg, layoutstruktur
eller (för klass B) det verkliga brödtextinnehållet matchar förlagan.

Det enda vägen till "EXAKT som förlagan" med dagens bibliotek (`pdf-lib`,
redan grundat i `docs/research/utskicks-bilage-arkitektur-2026-08-03.md`)
går via dess dokumenterade bild- och typsnittsinbäddning (`embedPng`/
`embedJpg`, `embedFont` + `fontkit` för egna TTF:er) — INTE via en
CSS/HTML-renderare, för `pdf-lib` har ingen layoutmotor
(samma pass, § "Begränsning värd att notera"). Det räcker för ett fast
antal mallar (klass B/C, koordinat-ritat), men kräver att varje ruta, kolumn
och radhöjd i förlagan mäts upp och kodas för hand — se § 4.

## 1. Klassificering av källmaterialet

Ordlistans tre dokumentklasser (`ORDLISTA.md` rad 179–186): **A —
uppladdad** (statisk fil), **B — event-mallad** (systemmall + eventfält),
**C — person-genererad** (person- + betalningsdata, t.ex. kvitto).

| Fil | Klass | Vad den faktiskt är (läst innehåll) | Källa |
|---|---|---|---|
| `2026-08-03 kvitto-forlaga.pdf` | **C — person-genererad** | **Kvitto**, inte bekräftelse. Titelrad "Kvitto", Kvitto-/OCR-nr, fullständig fakturalayout med momsspecifikation och BETALT-summa. | Dokumentets egen titel + innehåll, sid 1 |
| `2026-08-22_23 Rönninge RIM1.pdf` | **B — event-mallad** | **Deltagarinformation** — matchar ordlistans egen exempel ("deltagarinformations-brevet") och appens `MALL_NAMN = 'Deltagarinformation'`. Praktisk förberedelseinfo (kläder, utrustning, parkering, hörlurar) inför ett specifikt kurstillfälle. | `2026-08-22_23 Rönninge RIM1.pdf`, sid 1 |
| `2026-11-14_15 Rönninge RIM1.pdf` | **B — event-mallad, men ANNAN mall** | **Kursbeskrivning/anmälningsinfo** — pris, anmälningsavgift, betalningsvillkor ("Anmälan är bindande"), dagsagenda, QR-koder, bokomslag. Delar eventfält (datum/plats/pris) med Deltagarinformation men är strukturellt ett HELT ANNAT dokument — se § 2.3. | `2026-11-14_15 Rönninge RIM1.pdf`, sid 1 |
| `2025-HörlurarMiranonMedia.pdf` | **A — uppladdad, GLOBAL** | Statisk produktjämförelse för hörlurar. Marcus har bekräftat: global (alla utbildningar oavsett nivå). | Filnamn + innehåll, 2 sidor |
| `Information om Parkering hos Minranon Media.pdf` | **A — uppladdad** | Statisk parkeringsinfo för anläggningen (Uttringe Hages väg 17). Ingen eventkoppling i innehållet — sannolikt också global, men Marcus har inte uttryckligen bekräftat det (bara Hörlurar+Ögonmask är uttryckligen bekräftade globala i uppdraget). | Innehåll, 3 sidor |
| `Misora Sushi Meny.pdf` | **A — uppladdad, TREDJEPARTS-varumärke** | Restaurangkedjans egen meny (eget varumärke "Misora sushi", egen logga/font/färg — noll Miranon-styling). Bifogas troligen inför event där mat beställs. | Innehåll, sid 1 |
| `Ögonmask vid fjärrskådning.pptx` | **A — uppladdad, GLOBAL (Marcus-bekräftad)** | PowerPoint, INTE PDF — `file`-verktyget bekräftar "Microsoft PowerPoint 2007+". Kan inte läsas som PDF (`mdls kMDItemNumberOfPages` gav `null`, ingen sidräkning). **Bokförs som öppen konvertering:** måste exporteras till PDF (PowerPoint/Keynote "Exportera som PDF", eller `mcp__google-drive__convertPdfToGoogleDoc`-vägen omvänt) innan design/innehåll kan granskas. | Filtyp-verifiering (`file`-kommando) |
| `Automation exempel.pdf` | **Ej ett dokumentklass-exempel** | 15 sidor Airtable-automationsdokumentation (flödet `Anmälningar` → `Personer`/`Touchpoints` vid `When a record is created`) — ett skärmdumpsexport av en AUTOMATION, inte en PDF-FÖRLAGA. Läst (sid 1–3) och avfärdad: ger inget designspråk för dokumentmallarna. | `Automation exempel.pdf`, sid 1–3 |

**Sidantal disk-verifierat** via `mdls -name kMDItemNumberOfPages` (inte
antaget): kvitto-förlagan 1, RIM1 aug 1, RIM1 nov 1, Hörlurar 2, Parkering 3,
Misora Sushi 1, Automation exempel 15.

## 2. Designspråket i de dynamiska förlagorna (klass B och C)

Klass A-dokumenten (Hörlurar, Parkering, Misora, PPTX) laddas upp som fil —
deras utseende ska INTE reproduceras av någon generator, bara lagras och
bifogas som de är. Designspråket nedan gäller enbart de dynamiska klasserna
B och C, där appen faktiskt RITAR sidan.

### 2.1 Typsnitt och färger — disk-verifierat, inte gissat

`pdffonts` (poppler-utils) mot varje fils inbäddade typsnittstabell:

| Fil | Inbäddade typsnitt |
|---|---|
| kvitto-förlagan | `Calibri`, `Calibri-Bold` |
| RIM1 aug (Deltagarinformation) | `Calibri`, `Calibri-Bold`, `Calibri-Italic`, **`Cavolini-Bold`** |
| RIM1 nov (kursbeskrivning) | `Cavolini-Bold`, `Calibri`, `Calibri-Bold`, `Calibri-BoldItalic`, **`SegoeUI-Bold`** |
| Hörlurar | `Calibri`, `Calibri-Bold`, `Calibri-Italic`, `Calibri-BoldItalic` |
| Parkering | `Calibri-Bold` (enbart bold — all text i dokumentet är fet) |

**Slutsats: hela dokumentserien är skriven i Microsoft Word (Calibri är
Words standard-brödtext-typsnitt), med `Cavolini-Bold` — ett kursivt/
handstils-typsnitt som levereras med macOS — använt SPECIFIKT för de
dekorativa rubrikerna** ("Välkommen till Resor i Medvetandet 1!",
"Utbildning: Resor i Medvetandet 1"). `Cavolini` är alltså inte
Miranon-specifik design — det är ett fabriksinstallerat macOS-typsnitt som
råkade väljas för rubrikkänsla. `SegoeUI-Bold` dyker upp en gång i
RIM1-nov, sannolikt en inklistrad textbit från en annan källa (Windows
standardtypsnitt) — en enstaka avvikelse, inte ett mönster.

Färger extraherade via `pdftocairo -svg` (vektor-fills) + manuell PNG-
dekodning av rasterloggan (se § 2.2) — exakta hex, inte ögonmått:

| Färg | Hex | Var den används | Källa |
|---|---|---|---|
| Tabellrad-grå | `#F2F2F2` | Kvittots tabellhuvud + totalruta-bakgrund | `ulrika.svg`, `fill="rgb(94.902039%, ...)"` |
| Ren svart | `#000000` | All brödtext i samtliga dokument | samtliga SVG-extraktioner |
| Hyperlänk-blå | `#0563C1` | `lotta@outsidereality.se`-länkarna i RIM1 aug — **exakt Words standard-hyperlänkfärg** | `rim1-aug.svg`, `fill="rgb(1.960754%, 38.822937%, 75.686646%)"` |
| Gult överstryk | `#FFFF00` | Parfym/kosmetika-stycket i RIM1 aug — Words standard-överstrykningsgult | `rim1-aug.svg`, `fill="rgb(100%, 100%, 0%)"` |
| Accent-blå | `#4472C4` | "Om Hörlurar"-rubriken — **exakt Office-temats "Blue, Accent 1"** | `horlurar.svg`, `fill="rgb(26.66626%, 44.7052%, 76.863098%)"` |
| Loggans grönt | `#548235` | Vågformen/bokstäverna i MiranonMedia-loggan — **matchar Office-temats standardgrönt** | manuell PNG-pixel-dekodning av extraherad logotyp |
| Loggans rött | `#FF0000` | Skugg-/offset-linjen bakom vågformen — ren primärröd | manuell PNG-pixel-dekodning |

**Viktigt fynd:** ingen av dessa färger är en bespoke Miranon-brandfärg —
samtliga är Microsoft Office/macOS-standardvärden. Dokumenten är Word-brev
som Lotta/Roger skrivit med standardverktygets defaultstil, inte export ur
ett grafiskt designverktyg med en definierad palett.

### 2.2 Loggan — extraherad, och den matchar INTE appens befintliga SVG:er

`pdfimages -list` visar att loggan är EN inbäddad rasterbild (PNG/JPEG,
1152×238 px, ~36,7 KB) — **bit-identisk fil** i både kvitto-förlagan
och RIM1-aug (samma `size`/`ratio` i `pdfimages -list`), vilket bekräftar
att det är EN gemensam mastertillgång Roger/Lotta klistrar in, inte en
nyritad logga per dokument. Extraherad med `pdfimages -png` och verifierad
visuellt: en ljudvågsformad "M" i grönt (`#548235`) med en röd (`#FF0000`)
skuggkant, följt av kursiv text "iranonMedia" i samma två färger — texten
"MiranonMedia" läses ut som helhet via vågformen som första "M".

> **RÄTTELSE 2026-08-19 (S107, Marcus fångst):** stycket nedan är FALSIFIERAT
> i sin huvudsak. `public/miranon-media-ordmarke.svg` är **samma logotyp** som
> förlagans — samma vågform, samma bokstavsformer, samma proportion — endast
> OMFÄRGAD. Marcus: *"det ÄR Rogers Powerpoint-logga fast med justerade färger
> och i SVG-format"*, och färgjusteringen var hans eget experiment för
> miranon.se. Bevisat på tre sätt: (1) `Miranon_Media_logo.svg` i Marcus
> logo-mapp är **byte-identisk** med repots fil (`diff` utan utslag);
> (2) `Miranon Logga.pptx` bär BÅDA paletterna — `FF0000` på slide 1/4/5/6/7
> och `A3491B`+`606C57` på slide 2/3, alltså original och justerad i samma
> källfil; (3) en overlay av repots SVG med färgerna återställda mot
> förlagans rasterlogga visar sammanfallande bokstavsformer, vikt och
> proportion (endast marginalen skiljer, olika beskärning).
>
> Slutsatsen *"den riktiga loggan måste hämtas från Roger/Lotta"* var alltså
> fel väg, och den kostade ett halvt pass i PowerPoint-export, fontsubstitution
> och kalibreringsförsök. Rätt svar var att byta två hexvärden i en fil vi
> redan hade. Resultatet ligger i
> `public/miranon-media-ordmarke-original.svg`.
>
> **Vad felet berodde på:** passet jämförde FÄRG och drog en slutsats om
> IDENTITET. Två renderingar av samma geometri i olika paletter ser olika ut
> för ögat — men geometrin var densamma hela tiden, och den kunde ha mätts.

**Detta är INTE samma logotyp som redan ligger i repot.**
`public/miranon-logo.svg` (fyra sage/copper-parallellogram, `#636b5b` +
`#984f2b`, ingen text) och `public/miranon-media-ordmarke.svg` (bokstavs-
paths i samma sage/copper-palett, `#5e6a55`/`#a3491b`) är en HELT ANNAN
visuell identitet — ingen vågform, inga gröna/röda toner, annan
geometrisk stil. `src/components/AppShell/Forberedelseskarm.tsx` rad
120–129 dokumenterar själv att ordmärket är en egen rekonstruktion
("bokstavsformerna som paths, inga fontberoenden") som `VariantB.tsx`
lämnade oanvänd efter "auth-skärmarnas prototyp-divergens" — den är alltså
en app-intern designövning, inte en spårning av Roger & Lottas verkliga
varumärke. **Ingen av de befintliga SVG-tillgångarna i `public/` kan
användas för att uppnå "exakt som förlagan"** — den riktiga loggan måste
hämtas från Roger/Lotta (helst ett vektor-original) eller extraheras ur
PDF:erna som ovan.

### 2.3 Sektionsstruktur — kvittot (klass C)

`2026-08-03 kvitto-forlaga.pdf`, sid 1, uppifrån och ner:

1. **Sidhuvud:** logga (stor, vänster) + rubrik "Kvitto" (fet, höger) +
   tvåkolumns metarad (Kvitto-/OCR-nr, Datum).
2. **Referensblock (vänster):** Vår referens / Er referens / Förfallodatum
   / Vårt ordernr, som etikett–värde-par.
3. **Fakturaadress (höger, samma höjd):** kundens namn + e-post.
4. **Radtabell:** vit ruta med RUNDADE hörn och tunn ram, ljusgrå
   (`#F2F2F2`) huvudrad ("Benämning / Antal Enhet / A-pris / Summa"), en
   radpost per köp.
5. **Totalruta:** egen rundad ram, fem kolumner (Netto / Exkl. moms / Moms
   / Öresavr / **BETALT**), BETALT-summan i klart större/fetare stil än
   resten ("SEK 2 500,00").
6. **Sidfot:** egen rundad ram, fyra kolumner (Adress / Telefon / Plusgiro
   / Organisationsnr), inklusive momsregistreringsnummer och "Godkänd för
   F-skatt".

Detta är strukturellt identiskt med export ur ett svenskt bokförings-/
faktureringssystem (Fortnox/Bokio-liknande vokabulär: "Kvitto-/OCR-nr",
"Godkänd för F-skatt", momsuppdelning) — **task-146 PRD § Utanför
omfattningen rad 111 flaggar redan att kvittots gräns mot "hans
faktureringssystem" är en öppen Roger-avstämning**; detta fynd bekräftar
visuellt att den gränsen är verklig, inte hypotetisk — kvittot ser ut som
det KOMMER från ett sådant system, oavsett om det faktiskt gör det.

**Konkret, handlingsbart fynd:** dokumentet innehåller Miranon Media AB:s
verkliga organisationsuppgifter (org.nr, momsreg.nr, adress, telefon,
Plusgiro, Swish) — samma uppgifter som `_shared/receipt-content.ts`
`MIRANON_ORG_PLACEHOLDER` (rad 21–26) flaggar som "EJ BEKRÄFTAT"/"EJ
BEKRÄFTAD" och en öppen punkt i ADR-109. **Den öppna punkten kan nu stängas
med källa** — org.nr `559540-5498`, momsreg.nr `SE559540549801`, adress
"Uttringe Hages väg 17, 144 63 Rönninge, Sverige", Plusgiro `216 10 05-0`,
Swish `123 061 65 08` står tryckt på ett riktigt kvitto Roger & Lotta redan
skickat till en kund. Momsraden (5 kolumner: Netto/Exkl. moms/Moms/
Öresavr/BETALT, med 500,00 kr moms på 2 000 kr netto = 25 %) är också
verklig och närvarande — `receipt-content.ts` rad 9–11 dokumenterar att
momsraden "MEDVETET ÄR UTELÄMNAD" i väntan på "en momsstatus-bekräftelse
... FÖRE kvitton går skarpt till kunder"; detta fynd visar att Roger &
Lottas egna kvitton redan visar moms, vilket är relevant underlag för den
avstämningen (men beslutet om momsraden kvarstår Roger/Marcus, inte detta
pass).

### 2.4 Sektionsstruktur — Deltagarinformation (klass B, RIM1 aug)

`2026-08-22_23 Rönninge RIM1.pdf`, sid 1:

1. **Logga**, centrerad, samma rasterbild som kvittot.
2. **Rubrik** i `Cavolini-Bold` (dekorativt kursivt/handstils-typsnitt):
   "Välkommen till Resor i Medvetandet 1!" — kursnamnet är DYNAMISKT
   (varierar per utbildning).
3. **Infobox:** tunn svart ram med RUNDADE hörn, tre fetstilta etikett-rader
   (Datum och Tid / Plats / Frågor mejla till — den sista med en riktig
   `mailto:`-hyperlänk i Words standardblå `#0563C1`).
4. **Ingress**, kursiv: "Här får du praktisk information inför din
   kommande utbildning."
5. **Ämnesstycken**, vart och ett: fet etikett + löptext i samma stycke —
   Förberedelser / Kläder / Tag med / För dig som röker / **Parfym och
   kosmetika (helt gulmarkerat, `#FFFF00`)** / Mat/fika / Övernattning /
   Parkering / Transport från tåget / Utrustning.
6. **Avslutning:** "Varmt välkomna önskar Roger och Lotta!"

Ingen sidfot, ingen sidnumrering, ingen färg utöver logga/hyperlänk/
överstrykning.

**Vad som varierar per event (mallens dynamiska luckor):** kursnamn
("Resor i Medvetandet 1"), datum/tid, plats (i praktiken alltid samma
adress hittills, men strukturellt ett fält). **Vad som är FAST FORM**
(identiskt oavsett event): logga, rubrik-typsnitt, inforuta-etiketterna,
samtliga ämnesrubriker OCH deras löptext ordagrant — brödtexten är INTE
mall-text med luckor, den är statisk kursspecifik instruktionstext som
återanvänds oförändrad mellan tillfällen (verifierbart eftersom denna typ
av innehåll — kläder, hörlurskrav, parkering — är identiskt oavsett vilket
datum kursen går).

### 2.5 RIM1-jämförelsen: INTE samma mall, två olika dokumenttyper

Uppdraget bad om en jämförelse av de två RIM1-filerna för att skilja fast
form från variabelt innehåll — men det första, disk-verifierade fyndet är
att de **inte är två instanser av samma mall**. `2026-08-22_23 Rönninge
RIM1.pdf` (Deltagarinformation, praktisk checklista) och `2026-11-14_15
Rönninge RIM1.pdf` (kursbeskrivning: prisinfo, betalningsvillkor,
dagsagenda, QR-koder, bokomslag) har helt olika innehållsstruktur, olika
syfte (den ena skickas troligen vid/efter anmälan, den andra strax före
kursstart) och delar bara: logga, `Cavolini-Bold`-rubrikstil, en rundad
infobox med etikett–värde-rader, och avslutningsfrasen "Varmt välkomna
önskar Roger [&/och] Lotta!".

RIM1-nov:s struktur, utöver det gemensamma:

- Hela sidan inramad i EN stor rundad blå ram (kortkänsla, samma
  ramstil som Hörlurar-dokumentet).
- Infoboxen bär PRIS-fält (Pris, Anmälningsavgift, Resterande, Swish,
  Plusgiro) i stället för Deltagarinformationens praktiska fält.
- Löpande brödtext med SELEKTIV fetning av enskilda nyckelord mitt i
  meningar (t.ex. "**Resor i Medvetandet**", "**Additiv meditation**",
  "**mentala ankare**") — ett mönster `pdf-lib`s `drawText` inte ger gratis
  (kräver segmenterad text med olika `font`-anrop per ord).
- Tvåkolumns punktlistor ("Innehåll, Dag Ett" / "Innehåll, Dag Två") med
  vissa poster i en tredje accentfärg (blågrön, meditationspassens namn).
- Sidfot med TRE ikonrutor (Instagram-QR, bokomslagsbild, webb-QR), var
  och en i egen rundad fyrkantsram.

**Konsekvens för scope:** appens `generate-event-attachment` bygger idag
EN hårdkodad mall (`MALL_NAMN = 'Deltagarinformation'`, per PRD task-146 §
Utanför omfattningen "Mall-editor för klass B — uttryckligen senare").
RIM1-nov visar att Roger & Lotta i verkligheten använder minst ett ANNAT
klass B-dokument också — en kursbeskrivning/anmälningsbekräftelse med helt
annan struktur. Det är inte byggt, inte planerat i något existerande kort,
och löses inte av att bara försköna Deltagarinformations-mallen. Detta
bokförs här som ett öppet triage-fynd (ADR-053-klass: värdefullt, blockerar
inte nuvarande arbete) — inget beslut tas i detta pass.

## 3. Gap mot appens nuvarande generatorer

### 3.1 Klass C — `supabase/functions/_shared/receipt-pdf.ts`

`renderKvittoPdf()` (rad 31–49): en sida `[500, 420]` pt, `StandardFonts.Helvetica`
enda typsnittet, text ritad rad för rad med `page.drawText` i svart, ingen
`drawRectangle`, ingen bild. Innehållet kommer från `kvittoRader()` i
`_shared/receipt-content.ts` (rad 67–82): 11 textrader (Kvitto-nr, tomrad,
Kund, Datum, Belopp, Betalsätt, Avser, tomrad, org-namn, org-nr, adress).

| Element i förlagan | I appens generator | Gap |
|---|---|---|
| Logga (raster, `#548235`/`#FF0000`) | Ingen bild alls | Total avsaknad |
| Typsnitt: Calibri/Calibri-Bold | Helvetica (pdf-lib standard) | Fel typsnittsfamilj |
| Rundade rutor (radtabell, totalruta, sidfot) | Ingen ram/box, bara löpande text | Total avsaknad av struktur |
| Kolumn-tabell (Benämning/Antal/Enhet/A-pris/Summa) | En enda textrad ("Avser: …") | Ingen tabell |
| Momsspecifikation (Netto/Exkl.moms/Moms/Öresavr/BETALT) | Ingen momsrad (medvetet uteslutet, se § 2.3) | Saknas helt |
| Verkliga org-uppgifter (org.nr, momsreg.nr, Plusgiro, Swish, telefon) | `MIRANON_ORG_PLACEHOLDER`-platshållartext | Saknas, men nu källbelagt (§ 2.3) |
| Sidstorlek | Förlagan är A4 (implicit, brevformat) | `[500, 420]` pt ≈ 17,6×14,8 cm — INTE A4 (595×842 pt) |

### 3.2 Klass B — `supabase/functions/generate-event-attachment/index.ts`

`byggPdf()` (rad 152–175): samma `[500, 420]`-sida, samma
`StandardFonts.Helvetica`, samma ramfria `drawText`-loop. Innehåll:
`MALL_NAMN` ("Deltagarinformation"), valfritt kursnamn/ort/datumrad, sedan
`SYSTEMMALL_BRODTEXT` (rad 123–131) — **sju rader HÅRDKODAD generisk text**
("Välkommen till kursen!", "Här är information du behöver inför ditt
deltagande.", "Kom gärna i god tid…", "Vi ses på plats!", "Hälsningar,
Roger & Lotta") som INTE liknar den verkliga Deltagarinformationens
innehåll (Förberedelser/Kläder/Tag med/Parfym/Mat/Övernattning/Parkering/
Transport/Utrustning — nio konkreta, detaljerade ämnesstycken).

| Element i förlagan | I appens generator | Gap |
|---|---|---|
| Logga | Ingen bild | Total avsaknad |
| `Cavolini-Bold`-rubrik | Helvetica 18pt, samma typsnitt som brödtext | Fel typsnitt, ingen rubrik-särprägel |
| Rundad infobox (Datum/Plats/Frågor) | Text i löpande rader utan ram | Ingen box-struktur |
| Hyperlänk (mailto, blå) | Ren text, ingen länk, ingen färg | Saknas |
| Gul överstrykning (Parfym-stycket) | Ingen färg alls i hela dokumentet | Saknas |
| NIO konkreta ämnesstycken (verkligt innehåll) | SJU rader generisk platshållartext | **Innehållet är inte bara ostylat — det är fel innehåll** |
| A4/brevformat | `[500, 420]` pt, samma icke-A4-storlek som kvittot | Fel sidstorlek |

**Sammanfattat gap-mönster, båda generatorerna:** identisk kod-signatur
(`PDFDocument.create()` → `addPage([500, 420])` → `embedFont(Helvetica)` →
`drawText`-loop) — de är byggda som samma minimala runtime-bevis
(task-146.1: "Skiva Runtime-beviset — PDF-generering i den skarpa edge-
runtimen"), inte som produktionsklara mallar. Det syns i koden själv:
docblocket i `generate-event-attachment/index.ts` rad 18–28 dokumenterar
att ens FÄLTFORMEN (dokumentklass-markören) betraktades som klar innan
en granskning (task-147.6) visade motsatsen — inget i historiken tyder på
att någon tidigare skiva någonsin siktat på visuell paritet med förlagan.

## 4. Rekommenderad byggväg

### 4.1 Verktyg: behåll `pdf-lib`, men använd dess fulla API

`docs/research/utskicks-bilage-arkitektur-2026-08-03.md` § "Kan Supabase
Edge Functions generera PDF:er?" har redan grundat `pdf-lib` mot tre
namngivna edge-precedent (Cloudflare Workers, Deno, Supabase EF community-
rapport) och bevisat svensk teckenkodning. Samma pass flaggar explicit att
`pdf-lib` "a programmatic API, not an HTML renderer … there is no layout
engine" — koordinat-ritning, inte CSS. Det är rätt avvägning HÄR: klass B
och C är ett FAST, litet antal mallar (inte en generell mall-editor), och
`pdf-lib`s dokumenterade API täcker exakt det förlagorna kräver:

- **`doc.embedPng(bytes)` / `doc.embedJpg(bytes)`** — bäddar in loggan som
  en riktig bild i stället för att simuleras med text.
- **`doc.embedFont(bytes)` + `registerFontkit(fontkit)`** (pdf-lib.js.org,
  samma förstapartskälla redan citerad i research-passet) — bäddar in en
  riktig Calibri- eller Cavolini-liknande TTF i stället för standard-
  Helvetica. **Detta pass har INTE testat embedPng/embedFont skarpt** — det
  är nästa stegs minimaltest, per repots egen disciplin ("Testa ALLTID
  nytt bibliotek/approach med minimalt test … innan full implementation").
- **`page.drawRectangle({ borderColor, borderWidth, ... })`** med
  `PDFDocument.rgb()`-färger — ger de rundade/räta rutorna. Notera: `pdf-lib`
  stödjer räta hörn nativt; RIKTIGT rundade hörn (som förlagornas boxar)
  kräver antingen `drawSvgPath` med en handmålad rundad rektangel-path
  eller att man accepterar räta hörn som en medveten, dokumenterad
  avvikelse — avgörs bäst i grillning, inte i detta analyspass.
- **A4-sidstorlek** (`595.28 × 841.89` pt, `PageSizes.A4` i pdf-lib) i
  stället för dagens `[500, 420]`.

### 4.2 Hur exaktheten BEVISAS — side-by-side, inte "det ser bra ut"

Rekommenderad verifieringsform, i linje med repots "Verifiera innan klart"-
princip:

1. **Referensbilder från förlagan.** `pdftocairo -png -r 150` (samma
   verktyg detta pass redan använt) mot varje riktig PDF ger en pixel-
   referens per sida.
2. **Samma rendering av appens genererade PDF**, mot IDENTISK testdata
   (samma kursnamn/datum/ort som en riktig förlaga, t.ex. RIM1 aug:s
   faktiska datum) — `preview: true`-vägen i `generate-event-attachment`
   (redan byggd, TASK-246) ger `pdfBase64` utan att skriva till Storage/
   basen, vilket räcker för detta.
3. **Sida-vid-sida-jämförelse**, Marcus granskar (Gunilla-principen: ett
   visuellt facit, inte en diff av koordinater). Playwright eller en enkel
   HTML-sida som lägger de två PNG:erna bredvid varandra räcker — ingen ny
   infrastruktur behövs.
4. **Facit-lås liknande task-147.6:s mönster** ("Dokument-ytan mot verklig
   data facit-lås") — när Marcus godkänt en rendering, spara referens-PNG:n
   i repot och regressionstesta framtida ändringar mot den (pixel-diff-
   tolerans, inte pixel-perfekt — antialiasing/font-hinting varierar
   mellan körningar).

### 4.3 Tillgångar som behöver in i repot, och varifrån

| Tillgång | Källa | Kommentar |
|---|---|---|
| Logotypen (raster ELLER helst vektor-original) | Extraherad i detta pass: `pdfimages -png` ur `2026-08-03 kvitto-forlaga.pdf` → 1152×238 px PNG, `#548235`/`#FF0000`. **Bättre:** be Roger/Lotta om originalfilen (Word-dokumentets inklistrade bild, eller en tidigare logotyp-beställning) — rastret i PDF:en är redan nedskalat/komprimerat (`pdfimages -list` visar `enc=image`, JPEG-liknande artefakter möjliga vid närgranskning). | Samma fil används bit-identiskt i minst två dokument (§ 2.2) — hög konfidens att det är RÄTT logotyp, oavsett källkvalitet. |
| `Cavolini`-typsnittet | macOS-systemfont (`/System/Library/Fonts/` eller `/Library/Fonts/Cavolini.ttc` beroende på macOS-version) — licensfråga för inbäddning i en TTF-embedded PDF måste klargöras (Apples systemtypsnitt har typiskt EJ fri vidaredistributionslicens). **Rekommenderat:** utred om `Cavolini` får bäddas in, annars välj en licensfri ersättning med liknande "handskriven/lekfull kursiv"-känsla (t.ex. Google Fonts `Caveat` eller `Kalam`) — Marcus-beslut, inte detta pass. | Ej löst i detta pass — flaggas som öppen fråga. |
| `Calibri` (brödtext) | Microsoft-licensierat typsnitt — SAMMA licensfråga som Cavolini. Fri ersättning: `Carlito` (metriskt kompatibel, Google/Red Hat, GPL/OFL) är branschstandard-ersättningen för Calibri i öppen programvara. | Ej löst i detta pass — flaggas som öppen fråga. |
| Exakta färgvärden | Redan extraherade i detta pass, § 2.1 (tabell) — kan användas direkt, ingen ytterligare extraktion behövs. | Klart. |
| Ram/box-mått, marginaler, radhöjder | INTE mätta i detta pass (kräver pt-exakt uppmätning av varje boxs position, bäst gjort mot samma `pdftocairo -svg`-utdata detta pass redan producerat, genom att läsa `<rect>`/`<path>`-koordinaterna). | Öppen, nästa steg vid bygge. |

### 4.4 Avgränsning mot befintlig scope

Detta pass ändrar ingen kod och tar inget arkitekturbeslut. De konkreta
uppföljningarna (RIM1-novs saknade mall, moms-öppningen, org-platshållaren,
typsnittslicensfrågan, logotyp-originalkälla) läggs fram som fynd för
Marcus triage (ADR-053) — inte som redan beslutade nästa steg.

## Vad detta pass INTE gjorde

- Extraherade inte exakta ram-/marginalmått (pt-koordinater) ur SVG-
  utdatan — bara färger och typsnittsnamn.
- Testade inte `pdf-lib`s `embedPng`/`embedFont`/`registerFontkit` skarpt
  — bara verifierade att API:t är dokumenterat (samma förstapartskälla som
  redan citerad i `utskicks-bilage-arkitektur-2026-08-03.md`).
- Öppnade inte `Ögonmask vid fjärrskådning.pptx` — filtypen bekräftades
  (`file`-kommandot), innehållet parsades inte (per uppdragets instruktion).
- Läste inte alla 15 sidor av `Automation exempel.pdf` — sidorna 1–3
  räckte för att fastställa att filen är automationsdokumentation, inte
  ett dokumentmalls-exempel.
- Tog inget beslut om huruvida RIM1-novs kursbeskrivning ska byggas som
  en andra klass B-mall — bokfört som öppet fynd för triage.
