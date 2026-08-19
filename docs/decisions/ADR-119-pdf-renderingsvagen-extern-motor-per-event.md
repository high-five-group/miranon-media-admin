# ADR-119: PDF-renderingsvägen — extern HTML/CSS-motor, genererad en gång per event

- **Status:** Accepted (Marcus GO 2026-08-19, "Go på väg 1" + per-event-modellen
  i samma andetag; leveransformen bekräftad av research samma dag)
- **Datum:** 2026-08-19
- **Rör:** `TASK-146` § PDF-generering · bekräftelsebilagan +
  deltagarinformationen · `send-action-email`-familjens bilage-lane ·
  Supabase Storage-bucketen för per-event-filer · en kommande
  DocRaptor-hemlighet
- **Numreringsnot:** ADR-116 är fortsatt reserverad av S102:s numreringsrad
  och aldrig mintad. Detta kort tar 119 efter 118 — samma medvetna lucka som
  ADR-117 och ADR-118 redan bokfört.

## Kontext

`TASK-146` beslutade **"PDF-generering inom plattformen — inget externt
beroende, ingen extra tjänst"** (kortets rad 43) och valde koordinat-ritning
med `pdf-lib`. Motiveringen (rad 85) löd: *"Externa HTML-till-PDF-tjänster
avvisades som förstahandsval — extra leverantörsberoende och ett nätverkshopp
för ett problem som redan är löst inom plattformen."*

**Beslutet fattades innan någon hade sett de faktiska dokumenten.** När Marcus
pekade ut dem 2026-08-18 (`~/Downloads/exempelpdokument/`) mättes vad de
faktiskt kräver: rundade ramar, inbäddad logga, mitt-i-mening-fetning och
flerkolumnslayout — varje CSS-egenskap måste handkodas, och den tvåkolumniga
listan med blandad fetning kräver en egen textlayoutmotor byggd från grunden.
"Redan löst inom plattformen" höll för den smala frågan `TASK-146.1` faktiskt
prövade (kan Deno rita svensk text — ja, och det runtime-beviset står kvar),
aldrig för den visuella komplexiteten.

**Rivningen är ingen överraskning för `TASK-146` — kortet lämnade dörren
öppen självt**, i meningen direkt efter avvisningen: *"De är däremot värda att
minnas om en framtida mall-editor kräver HTML/CSS-layout, som koordinat-formen
strukturellt inte kan ge."* Det villkoret är nu uppfyllt.

Två research-pass bär beslutet:
[`pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md`](../research/pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md)
(renderingsvägen) och
[`pdf-bifoga-eller-lanka-branschmonster-2026-08-19.md`](../research/pdf-bifoga-eller-lanka-branschmonster-2026-08-19.md)
(leveransformen).

## Beslut

1. **`TASK-146`s "inget externt beroende" RIVS — specifikt för
   PDF-rendering.** Lagrings- och adapterarkitekturen är opåverkad: den
   frågan rör var bytesen hamnar, inte hur sidan ritas. `ADR-057`s
   lager-oberoende gäller oförändrat.

2. **Renderingen sker mot en extern HTML/CSS-motor — DocRaptor.**
   Branschmönstret för denna dokumentklass är HTML/CSS-driven rendering,
   aldrig koordinat-ritning. Headless Chrome går strukturellt inte i
   Supabase Edge Functions (20 MB bundle-tak mot Chromiums 150–300 MB;
   Supabases egen dokumentation pekar därför till en extern tjänst).
   Gotenberg (självhostad) förkastades trots att den är billigare: den gör
   oss till container-driftare för att slippa ett beroende som kostar
   ~15 USD/månad — ny infrastruktur att underhålla, inte mindre komplexitet.

3. **Generering sker EN gång per event och dokumenttyp — aldrig per
   mottagare.** Bilagorna bär enbart eventdata (kursnamn, datum, plats,
   pris, anmälningsavgift, resterande belopp, sista betalningsdatum;
   deltagarinformationen bär tre rader). **Ingen persondata förekommer** —
   mottagarens namn är dynamiskt i mailkroppen, aldrig i bilagan. Alla
   anmälda till samma event ska därför ha en bit-identisk fil.

4. **Filen lagras i Supabase Storage** enligt den bucket-struktur för
   per-event-kopplade filer som redan är utredd
   ([`utskicks-bilage-arkitektur-2026-08-03.md`](../research/utskicks-bilage-arkitektur-2026-08-03.md)
   delfråga 2), och bifogas därifrån vid utskick.

5. **Leveransformen är BIFOGA.** Hypotesen att branschen hellre länkar är
   falsifierad för dokumentklassen "kvitto/bekräftelse till identifierad
   mottagare": Stripe bifogar som standard och lägger en länk *därtill*,
   Postmark rekommenderar bifogning uttryckligen, Ticketmaster erbjuder den
   som ordinarie leveranssätt. Deliverability-invändningen är folklore vid
   vår skala — Gmail nämner inte PDF i vare sig blockeringslistan eller
   bulk-riktlinjerna, och de senare träder in först vid 5 000+ mail/dag
   (vi ligger fyra tiopotenser under).

6. **Invalidering: filen regenereras när något fält bilagan läser ändras.**
   En bifogad fil är frusen i mottagarens inkorg; en inaktuell fil som
   skickas ut är ett verkligt felläge, inte en skönhetsfläck. Vilka fält som
   utlöser regenerering avgörs vid skivningen — att det SKA ske är beslutat
   här.

7. **Minimaltestet kommer före varje mall.** Ett skarpt anrop från en Edge
   Function i staging ska visa: (a) sökbar text med korrekt svensk
   teckenkodning, (b) uppmätt end-to-end-latens, (c) filstorlek inom Resends
   40 MB-tak, (d) ärligt felbeteende när tjänsten svarar sent eller inte
   alls. Samma disciplin `TASK-146.1` redan etablerade — ingen mall byggs på
   en ogrundad runtime.

8. **Resend-loopen är en LEVERANTÖRSKOMPENSATION, inte ett branschvillkor.**
   Bilage-bärande utskick måste gå singel-anrop eftersom Resends
   batch-ändpunkt släpper bilagan **tyst**. Men SES, SendGrid och Postmarks
   Bulk-API bär alla en delad bilaga i ett anrop — **Resend är outlier**.
   Loopen behåller vi (leverantörsbyte är inte i scope, och vid ≤24
   mottagare kostar den ~2,4 sekunder), men den ska motiveras som det den
   är. Den tysta bilage-förlusten kräver en **vakt**, inte bara ett villkor.

## Alternativ som vägdes

- **Satori + `resvg` (`@vercel/og`) edge-native** — samma CSS-fördelar utan
  extern tjänst, officiellt demonstrerat av Supabase själva inuti en Edge
  Function. Förkastad på **rastrerad text**: resultatet blir en bild inbäddad
  i en A4-sida, inte sökbar eller kopierbar. För en bilaga som ska se
  professionell ut är det mätbart sämre än vad Roger & Lotta skickar manuellt
  idag.
- **Gotenberg självhostad** — MIT, ~11 USD/månad, full kontroll. Förkastad
  som förstahandsval: se beslut 2.
- **`typst.ts`** — vektor-PDF, riktig text, ingen browser. Förkastad på
  obelagd Deno-kompatibilitet: förstapartskällan nämner browser och Node.js,
  inte Deno. Registrerad som öppen, oprövad väg — inte som negativt fynd.
- **Behåll ren `pdf-lib`** — förkastad: den tvåkolumniga listan med blandad
  fetning kräver en egen textlayoutmotor, vilket är hela den kostnad CSS
  finns för att slippa.
- **Länka i stället för att bifoga** — förkastad av research (beslut 5). En
  länk *som komplement* ovanpå bifogningen är Stripes mönster och kostar
  marginellt eftersom bytesen ändå ligger i Storage; den frågan klarar inte
  ADR-baren och hör i PRD-kortet, inte här.

## Konsekvenser

- (+) Hela handkodningskostnaden försvinner — CSS ger `border-radius`,
  span-vis fetning och flexbox-kolumner gratis.
- (+) Per-event-modellen tar **DocRaptor-anropet ur sändvägen**. PDF:en finns
  redan när Lotta trycker skicka, så "tjänsten svarar sent" flyttas från det
  tidskritiska flödet till en förberedelse ingen väntar på. Det avväpnar den
  tyngsta invändningen mot en extern renderare.
- (+) Kostnaden är mätt, inte gissad: 30 event under 2026 × 2 dokument ≈
  **5,5 genereringar/månad** — cirka 4 % av DocRaptors billigaste plan.
- (+) Alla deltagare till samma event får garanterat identisk bilaga.
- (−) **En ny hemlighet** (API-nyckel) och **en ny felyta** (tjänsten kan
  svara långsamt eller inte alls) — samma klass av felhantering som redan
  finns för Resend-anropet, men den måste faktiskt byggas.
- (−) Data lämnar plattformen vid rendering. Konsekvensen är begränsad av
  beslut 3: det som skickas är eventdata, aldrig personuppgifter.
- (−) Latenssiffran för ett HTML→PDF-anrop är **obelagd** — ingen källa gav
  ett mätt tal. Beslut 7 finns för att stänga just den luckan innan något
  byggs ovanpå den.

## ADR-bar

Alla tre villkor håller: (1) rivningen av ett tidigare låst arkitekturbeslut
är svår att återställa i koherens — mallar, EF-kontrakt och en extern
tjänstekoppling byggs ovanpå den; (2) att ett "inget externt beroende"-beslut
rivs, och att generering sker per event snarare än per utskick, är båda
överraskande utan denna kontext; (3) fem genuina alternativ vägdes och
förkastades av konkreta, källbelagda skäl.

**Rivningen sker öppet.** `TASK-146`s beslut var korrekt fattat på den
information som fanns då, och dess egen text pekade ut villkoret som nu är
uppfyllt. Detta är ingen tyst omtolkning — det är den dörr kortet lämnade
öppen, använd.
