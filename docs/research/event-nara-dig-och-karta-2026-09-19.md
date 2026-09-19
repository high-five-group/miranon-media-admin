---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: draft
---

# "Event nära dig" och kartan — positionskälla, geokodning, kartleverantör (Code, 2026-09-19)

> **Proveniens:** avgränsat research-pass (bakgrundsagent, Session 128), kört
> **oisolerat** i worktreen `s128-docs` (gren `docs/s128-fodelse`). Ett av tre
> parallella S128-pass (de andra: Luma-mönsterstudien, intagskedjans
> inventering — se § Vad jag redan hade). Ingen produktionskod rörd, inga
> verkliga adresser geokodade. Ingen webbläsar-MCP användes (upptagen av
> parallella pass) — alla fynd kommer från `WebFetch`/`WebSearch` mot
> primärkällor, med sekundärkällor uttryckligen märkta som sådana.

---

## Kort svar

**Domen i klartext:** Bygg "nära dig" på **server-side IP-stad** (Vercels
`x-vercel-ip-city` m.fl., gratis, redan tillgängligt) som en **hint, aldrig
en sanning** — träffsäkerheten på mobilnät är för dålig (mätt medianfel
180–210 km, se § 1) för att stå ensam i ett avlångt land. Kombinera alltid med
ett synligt, manuellt ortval. Skippa webbläsarens `Geolocation`-API som
förvalsväg — det kräver en explicit behörighetsdialog för en precision
("nära dig"-stad) som inte behöver GPS-nivå.

Med **ett fåtal till ett tiotal platser** (se § Metod-not om volym) är
**"nära" en sorterad lista, inte ett radiefilter** — radiefilter ger tomma
eller löjliga resultat vid den volymen. Visa alltid ALLA event, med det
närmaste överst och explicit avstånd, aldrig ett tomt läge.

**Geokoda EN GÅNG, vid skrivning**, inte per request. Lagra koordinater som
additiva fält på `Platser` (typ, precision, källa, tidsstämpel — mappar 1:1
till Postgres-kolumner). Vid vår volym (handfull adresser, geokodas en gång
per ny plats) är **Nominatim/OpenStreetMap** rätt leverantör: gratis, ODbL-
licensierad, och — till skillnad från Google och Mapbox, som **förbjuder**
permanent lagring av koordinater utan separat betald licens (§ 3) —
Nominatims egen policy **förutsätter** att du cachar/lagrar resultatet lokalt
för att slippa fråga igen. Bygg alltid in manuell pin-korrigering, eftersom
Nominatim/OSM kan missa en kursgård på landet.

**"Apple-kartan" är en dom i två delar:** Marcus krav är *upplevelsen*
(en karta i premiumklass, lugn, tillgänglig, inte en amatörmässig blå-nål-
på-standardplattor-karta) — inte nödvändigtvis leverantören Apple. Jag kunde
INTE belägga att Luma faktiskt använder Apple MapKit JS (obelagt även efter
detta pass, se § 7) — hypotesen i uppdraget förblir öppen. **MapKit JS är ett
giltigt, tekniskt fullgott val** (gratis vid vår volym, fungerar i alla
moderna webbläsare enligt Apples egen sida) men kräver ett Apple Developer
Program-medlemskap (99 USD/år) som Marcus måste ordna/bekräfta, och jag hittade
**ingen** Apple-dokumentation om tillgänglighet (tangentbord/skärmläsare) för
MapKit JS — en verklig lucka mot tillgänglighetsgolvet 11. **Rekommendationen
är MapLibre GL JS + öppna vektorplattor (Protomaps eller MapTiler)** med en
noga vald, premiumkänsla-stil: samma visuella klass går att nå utan Apple-
beroendet, till lägre och mer förutsägbar kostnad, med full kontroll över
integritetsytan (self-hostat, inga tredjepartscookies) — se § 4 och § 8 för
den fullständiga avvägningen, inklusive MapLibres egna öppna
tillgänglighetsluckor som måste kompenseras.

**Standardläge på eventsidan: statisk kartbild/adress-text + "Öppna i
Kartor"-länk, interaktiv karta först vid klick.** Det är både bäst för
prestanda, integritet (inget tredjepartsskript laddas förrän besökaren
efterfrågar det) och tillgänglighet (adressen som TEXT är huvudbäraren,
kartan ett komplement — exakt vad WCAG och GOV.UK-mönstret kräver, § 6).

---

## Vad jag redan hade — och vad som är nytt i detta pass

**Inventerat före första sökningen** (`docs/research/`, `docs/decisions/`,
`tasks/lessons.md`, `docs/byggplan.md`, `docs/reference/data-model.md`):

- **Ingen tidigare research finns om karta, geokodning eller
  positionskälla** i detta repo — sökning på "karta", "geo", "MapKit",
  "nominatim", "maplibre", "nära dig" i `docs/` och `tasks/` gav noll träffar
  utanför de tre S128-passen som skrevs idag. Detta är alltså genuint ny
  mark, inget att komplettera.
- **`docs/reference/data-model.md` rad 575:** `Platser`-tabellen
  (prod `tblPeNLeeQ1IduGTK`) bär fälten Namn, Adress (fritext), Parkering,
  Transport, Kläder — **inga koordinater**. Detta bekräftar uppdragets
  premiss exakt. Tabell-ID-listan (rad 85) visar att `Platser` har 5 fält
  (+1 auto-född spegel av `Bilagor`-länken) — det är fält, inte rader; jag
  hittade **ingen** radräkning för `Platser` i detta pass (se § Vad jag inte
  kunde belägga).
- **`docs/decisions/ADR-011`** (CSP-plugin uppskjuten till Fas 7) och
  **`docs/byggplan.md` rad 94:** Fas 7:s CSP ärver **hash-/self-formen**, inte
  nonce — falsifierat i `docs/research/t95-r1-hosting-vercel-2026-08-02.md`
  § 2.4 mot Googles egen Web.dev-vägledning (citerad där: *"Use a hash-based
  CSP for HTML pages served statically... 'self' räcker"* för vårt statiska
  SPA-bygge). Det betyder att `script-src 'self'` är golvet — varje
  kartleverantörs externa skript är ett **tillägg** till den ytan, inte en
  ersättning av mönstret (se § 4-tabellens CSP-kolumn).
- **`docs/byggplan.md` rad 38, rad 94:** Hobby-planen är uttryckligen
  förbjuden för kommersiellt bruk; Vercel Pro är redan Marcus-kvitterat
  hosting-val (`ADR-091`, `t95-r1`). Detta pass utgår från Pro.
- **`docs/research/hallplats-modellen-eventsidan-2026-07-26.md` rad 211**
  nämner i förbigående att den NUVARANDE (Vue-eran/admin-sidans) plats-
  visning är "adress i klartext + inbäddad Google Maps-länk" — inte en
  interaktiv karta. Ingen djupare analys fanns där; det är ett datapunkt om
  nuläget, inte research om den nya publika sidan.
- **Luma-studien (samma dag, `luma-studie-monster-for-nya-miranon-se-
  2026-09-19.md`)** dokumenterar uttryckligen att Luma **inte kunde renderas
  i webbläsare** i det passet (delad Chrome DevTools-profil upptagen) — den
  filen innehåller alltså inget om Lumas karta/positionslogik. Detta pass tar
  vid där: jag sökte Lumas **egen hjälpdokumentation** (`help.luma.com`) i
  stället för att rendera sajten, och fick delvis napp (§ 7).

**Nytt i detta pass:** hela svaret på frågan — positionskälla, GDPR/ePrivacy-
dom, geokodningsväg och licensvillkor, kartleverantörsjämförelse,
tillgänglighetskrav, precedent och rekommendation. Inget av detta fanns i
repot innan idag.

---

## 1. Besökarens position — tre vägar

| | IP-geolokalisering (server) | Webbläsarens `Geolocation`-API | Manuellt val av ort |
|---|---|---|---|
| **Träffsäkerhet i Sverige** | Land/region: mycket hög (kommersiella databaser ~99,5–99,8 % på landnivå, MaxMind knowledge base, läst 2026-09-19[^1]). **Stad, särskilt mobilnät: svag.** Mobilnätets medianfel är ~180–210 km, >10× fast bredbands fel, pga carrier-grade NAT som geolokaliserar operatörens växel — inte telefonen (WhatIsMyLocation.org-sammanställning av 2026-studie, läst 2026-09-19[^2]; MaxMind bekräftar samma mekanism[^1]). I ett avlångt land som Sverige kan det felet lägga besökaren i fel landsdel. | Meter-nivå när GPS/Wi-Fi-positionering fungerar — men kräver en explicit tillåt-dialog (W3C-specifikationen, se nedan) som användaren kan neka; vid nekande finns ingen fallback inbyggd. | Perfekt — användaren VET sin ort. |
| **Integritet (GDPR)** | IP-adress är personuppgift (CJEU C-582/14 Breyer, 2016[^3] — dom om dynamisk IP; generaliserad branschkonsensus att detsamma gäller statisk IP och IP-härledd platsdata). Svensk sekundärkälla: *"Legitimt intresse kan användas för mindre precisa platsdata, till exempel IP-baserad geolokalisering, men kräver en dokumenterad intresseavvägning genomförd innan behandlingen startar"*[^4]. **ePrivacy/LEK (6:18 LEK) kräver INTE samtycke** för detta — EDPB:s Guidelines 2/2023 om artikel 5(3):s tekniska räckvidd slår fast att regeln bara gäller åtkomst till/lagring av information i användarens **terminalutrustning**; en server som läser IP-adressen som redan följer med varje HTTP-request rör inte terminalutrustningen och faller **utanför** artikel 5(3)[^5]. Ingen cookie-banner krävs — men GDPR:s allmänna krav på laglig grund + information gäller ändå. | Kräver GDPR-samtycke i praktiken (hög precision, explicit W3C-permission) — se nedan. | Ingen personuppgiftsbehandling alls förrän användaren själv skriver in orten. |
| **Upplevelse** | Osynlig, noll friktion, fungerar direkt. | Friktion: en dialogruta måste besvaras; nekande = ingen signal alls. | Kräver en handling av besökaren, men är den enda som är 100 % korrekt. |
| **Tillgänglighet** | Ingen UI, ingen tillgänglighetspåverkan. | Tillåt-dialogen är webbläsarens egen UI — utanför vår kontroll men generellt tillgänglig. En avslagen dialog får INTE tysta bort funktionen. | Måste vara en riktig, tangentbords- och skärmläsarvänlig `<select>`/kombobox — annars blir den manuella vägen otillgänglig, vilket vore ironiskt som reserv-väg. |
| **Kostnad** | Gratis, ingår i Vercel-planen (Pro **och** Hobby sedan november 2021 — "IP Geolocation now available for all plans"[^6]). | Gratis (webbläsar-API). | Gratis. |

**W3C Geolocation API-specen** (läst 2026-09-19[^7]) kräver uttryckligen:
*"Geolocation is a powerful feature that requires express permission from an
end-user before any location data is shared"*, endast i **secure context**
(HTTPS — annars `PERMISSION_DENIED` direkt), samt att sajten *"clearly and
conspicuously disclose... the purpose... how long the data is retained, how
the data is secured"*. Det är alltså inte bara en teknisk hake — specen
lägger explicit ett informationskrav på oss om vi använder den.

**Vercels geo-headers, verifierat direkt mot `vercel.com/docs` 2026-09-19[^8]:**
tillgängliga headers är `x-vercel-ip-continent`, `-country`,
`-country-region`, `-city`, `-latitude`, `-longitude`, `-timezone`,
`-postal-code`. De levereras till **Vercel Functions/Middleware**, inte till
en helt statisk sida utan serverkod — vår app kör redan Edge
Functions/operations-API (byggplan.md), så detta kräver ingen ny
infrastruktur. Ingen prisuppgift eller kvot nämns i dokumentationen — headern
är en gratis del av request-hanteringen, inte en separat produkt.

**Branschmönstret (Luma, Meetup — se § 7 för fullständiga citat):** ingen av
de undersökta leverantörerna använder webbläsarens `Geolocation`-API som
förstahandsval för "nära dig". Mönstret är **passiv, låg-precision
positionshint (härledd av plattformen) + alltid synligt manuellt
ortbyte/sökfält** — exakt kombinationen IP-hint + manuellt val.

---

## 2. Vad "nära" bör betyda med ett fåtal platser

**Rekommendation: en sorterad LISTA, aldrig ett radiefilter.**

Ett radiefilter (t.ex. "event inom 5 mil") kräver en tät ortfördelning för
att ge meningsfulla resultat. Med 5–10 platser i hela Sverige (bekräftat
fältantal, `data-model.md` rad 79 — radantal overifierat, se § Vad jag inte
kunde belägga) blir ett radiefilter antingen **tomt** (ingen plats inom
radien) eller **irrelevant** (radien måste vara så stor att den inte filtrerar
bort något) — precis den "löjliga vid tio event"-risken uppdraget varnar för.

**Konkret modell:**

1. Sortera ALLA kommande event efter avstånd mellan besökarens position
   (IP-stad eller manuellt vald ort) och eventets `Platser`-koordinat
   (haversine-formel, ren serverkod — ingen extern tjänst behövs för
   sortering när koordinaterna redan är lagrade).
2. Visa det närmaste först, med **explicit avstånd** ("Rönninge, ~3 mil
   bort") snarare än en dold tröskel — transparens slår en falsk känsla av
   närhet.
3. **Om det närmaste ligger 40 mil bort:** visa det ändå, överst, med
   avståndet synligt. Dölj aldrig. Ett event som ligger långt bort är
   fortfarande ett event Marcus vill att besökaren ska hitta — Miranon Medias
   hela verksamhetsmodell är regional turné, inte lokala stadsdelsträffar.
4. **Om positionen är okänd (IP gav inget, eller land ≠ Sverige):** visa
   listan i kronologisk ordning (nästa event härnäst) i stället för
   avståndsordning, med ortval framhävt ovanför listan.
5. **Tomt läge** (inga kommande event alls): en riktig tomt-lägestext, aldrig
   en tyst blank yta (samma princip som repots övriga tomma lägen).
6. En liten, EXTRA framhävd rad — "Ditt närmaste event" — ovanför den
   fullständiga listan ger "nära dig"-känslan utan att låtsas vara ett filter
   som utesluter något.

Detta skalar utan att se konstigt ut: vid 3 event är det uppenbart att listan
visar allt; vid 30 event blir avståndssorteringen den faktiska nyttan.
**Gruppering per ort/region** är en rimlig förfining när platsantalet växer
förbi ett tiotal, men är spekulativ komplexitet vid dagens volym — skär den
tills mätdata (fler platser) visar att den behövs (dubbelriktad
över-engineering-vakt, `~/.claude/CLAUDE.md`).

---

## 3. Geokodning av `Platser.Adress`

### Engångs kontra vid skrivning

**Geokoda vid skrivning (när en `Platser`-rad skapas/redigeras), lagra
resultatet — aldrig per sidvisning.** Adressen ändras i praktiken aldrig för
en etablerad plats; att geokoda vid varje request vore att betala latens och
en extern nätverksanropskostnad för en operation vars svar är statiskt i
åratal. Detta är dessutom den enda modell som är förenlig med samtliga
leverantörers licensvillkor nedan (bulk/repetitiv geokodning av SAMMA adress
är exakt det policyerna vill undvika).

### Leverantörer — licens att LAGRA koordinater

| Leverantör | Kostnad vid vår volym | Får koordinaterna LAGRAS permanent? | Källa |
|---|---|---|---|
| **Google Geocoding API** | Gratistier existerar per-SKU (2025-omläggning avskaffade den gamla $200-krediten[^9]), men irrelevant här. | **Nej, inte utan separat avtal** — standardvillkoren tillåter endast **temporär cache i upp till 30 dygn**, därefter måste värdena raderas (sammanfattning av Google Maps Platform Service Specific Terms, läst via sekundärkälla 2026-09-19 — jag kunde INTE hämta den fullständiga avtalstexten direkt i detta pass, se § Vad jag inte kunde belägga). `place_id` är undantaget och FÅR sparas permanent[^10]. | [cloud.google.com/maps-platform/terms/maps-service-terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) (ej fullt läst), sekundärsammanfattning[^10] |
| **Mapbox Geocoding API** | Temporär endpoint gratis inom kvot; permanent lagring kräver den SEPARATA `mapbox.places-permanent`-endpointen, **ingen gratistier, från $5/1 000**[^11]. | **Nej på standardendpointen** — Mapboxs egen dokumentation: *"geographic coordinates should be used ephemerally and not persisted"* på standardendpointen[^11]. Kräver ett annat, betalt API för permanent lagring. | [docs.mapbox.com — Understand Temporary versus Permanent Geocoding](https://docs.mapbox.com/help/dive-deeper/understand-temporary-vs-permanent-geocoding/)[^11] |
| **Apple Maps Server API (geokodning)** | 25 000 gratis anrop/dag vid Apple Developer Program-medlemskap (99 USD/år)[^12][^13]. | **Overifierat i detta pass** — jag hittade inget uttalat lagringsvillkor för Apples geokodningssvar (WebFetch mot `developer.apple.com/documentation/applemapsserverapi` gav bara sidtiteln, inget innehåll — se § Vad jag inte kunde belägga). Behandla som OKLART tills primärkällan lästs i sin helhet. | [developer.apple.com/documentation/applemapsserverapi](https://developer.apple.com/documentation/applemapsserverapi) (endast titel hämtad) |
| **OpenStreetMap Nominatim** (publikt API) | Gratis. Policyn tillåter **occasional, non-bulk use, max 1 anrop/sekund**; större engångsjobb bör köras på en enda maskin med 4 anrop/minut om skriptet löper längre än en dag; för verklig volym rekommenderas egen instans[^14]. | **Ja, uttryckligen förväntat** — policyn skriver att *"results must be cached on your side"*[^14] just för att undvika upprepade frågor mot den fria servern. Data är OSM/ODbL-licensierad (attribution krävs; ingen förbudsklausul mot att spara härledda koordinater för eget internt bruk). | [operations.osmfoundation.org/policies/nominatim](https://operations.osmfoundation.org/policies/nominatim/)[^14] |
| **Lantmäteriet (Belägenhetsadress)** | Öppna geodata, CC0-licens — fri kommersiell användning[^15]. Kräver ett användarkonto/API-nyckel via Geotorget[^15]. | Ja (CC0). | [lantmateriet.se/oppnadata](https://www.lantmateriet.se/oppnadata), [Geotorget — Belägenhetsadress Direkt](https://geotorget.lantmateriet.se/geodataprodukter/belagenhetsadress-direkt-api)[^15] |

**Slutsats:** vid vår volym (en handfull adresser, geokodas EN gång per ny
plats, av en administratör som klickar en knapp — inte ett bulk-jobb) är
**Nominatims publika API** det enda som är både gratis, licensmässigt fritt
att lagra, och triv­ialt inom sin egen hastighetspolicy (en admin-åtgärd i
veckan är oändligt långt under "1 request/sekund"-taket). Google och Mapbox
löser inte bara ett problem vi inte har (bulk-volym) — de gör det till priset
av en lagringsrestriktion som är direkt oförenlig med planen "lagra
koordinater permanent på `Platser`". Lantmäteriets data är juridiskt renast
(CC0, svensk myndighetskälla) men kräver kontoadministration för en volym där
det inte lönar sig — värt att hålla i bakfickan om Nominatim missar en
specifik adress.

### Var koordinaterna ska bo

**Additiva fält på `Platser`** (ADR-063: additivt, aldrig destruktivt mot
basen), formade för att mappa 1:1 till Postgres i Fas E:

- `Latitud` (number, decimal) · `Longitud` (number, decimal)
- `Positionsprecision` — t.ex. "adress" / "ort" / "manuellt korrigerad"
  (singleSelect) — så gränssnittet kan visa en varningsikon vid låg precision
- `Positionskälla` — "Nominatim" / "Manuell" (singleSelect) — spårbarhet
- `Position uppdaterad` (dateTime)

**PostGIS kontra två numeriska kolumner:** vid vår volym (handfull rader,
enkla "sortera efter avstånd"-frågor, ingen polygon-/routing-logik) är
**två plain `float`/`numeric`-kolumner + haversine i applikationskod
tillräckligt** — PostGIS tillför spatiala index och funktioner (`ST_Distance`,
`ST_DWithin`, m.fl.) som blir värdefulla vid **hundratals-tusentals** rader
eller vid behov av riktiga geometrier (polygoner, radier i databasen)[^16].
Ingen av dessa behov finns idag. **Supabase stödjer PostGIS som en
aktiverbar extension** (bekräftat, Supabase egen dokumentation[^17]) — om
volymen växer är vägen dit alltså öppen och välbelagd, men att bygga den nu
vore precis den "lösning som letar problem" över-engineering-vakten ska skära
bort. Rekommendation: två kolumner nu, PostGIS-migrering som en namngiven,
senare uppgift OM/när platsantalet eller frågebehovet motiverar det.

### Manuell korrigering

Nominatim/OSM geokodar på adressträngar och kan missa en kursgård på landet
utan gatunummer i OSM:s data. Bygg ett admin-flöde: adress skickas till
Nominatim → förslagsposition visas på en karta → administratören kan **dra
nålen** till rätt plats innan sparning, vilket sätter
`Positionsprecision: "manuellt korrigerad"`. Detta är samma "facit-i-basen,
aldrig gissa"-princip som resten av datamodellen (ADR-063) och matchar
Gunilla-principen: Lotta/administratören SER var nålen hamnar och kan rätta
den direkt, i stället för att lita blint på en svart låda.

---

## 4. Kartleverantör — jämförelse

| | Apple MapKit JS | Google Maps JS API | Mapbox GL JS | MapLibre GL + öppna vektorplattor | Leaflet + OSM-raster |
|---|---|---|---|---|---|
| **Visuell kvalitet** | Apples distinkta kartografi ("premiumkänslan" Marcus efterfrågar) — proprietär stil. | Välkänd, polerad, men generisk "Google-karta"-look. | Polerad, WebGL-vektor, mycket stilbar. | Matchar Mapbox visuellt (samma renderingsmotor-arv) — kräver EGEN designad stil (t.ex. Positron/Voyager-liknande) för premiumkänsla; standardstilar från öppna leverantörer varierar i finish. | Klassisk "blå nål på OSM-standardplattor" — lägst visuell ribba av de fem utan betydande anpassning. |
| **Krav & kostnad** | Kräver Apple Developer Program-medlemskap, **99 USD/år**[^12]. Gratis: **250 000 kartvisningar/dag + 25 000 servicecalls/dag**[^18]. Autentisering via server-genererad JWT (Maps ID + privat nyckel)[^19]. | 10 000 gratis dynamiska kartladdningar/månad (2026-nivå, efter mars 2025-omläggningen som avskaffade den gamla $200-krediten), därefter ~7 USD/1 000[^9]. Ingen medlemsavgift, men Google Cloud-konto + betalkort krävs. | 50 000 gratis kartladdningar/månad, därefter ~5 USD/1 000[^20]. Betalkort krävs för aktivering. | I princip gratis vid vår volym: Protomaps drivs via HTTP-range-requests mot en enda plattfil, realistisk månadskostnad "några dollar, ofta noll" med t.ex. Cloudflare R2 som lager[^21]; MapTiler Cloud från 29 USD/månad eller självhostat gratis[^22]. | Gratis (biblioteket); OSM:s publika tile-server har egen fair-use-policy för produktionstrafik — bör proxyas/självhostas vid riktig trafik. |
| **Integritet** | Apples egen marknadsföring betonar integritet ("on-device intelligence", ingen spårning tvärs appar)[^23] — men **ingen bekräftad uppgift i detta pass om VAR MapKit JS processerar data** (EU vs tredje land) — flagga, ej belagt. | Omfattas av Googles EEA-specifika villkor (SCC-baserad tredjelandsöverföring)[^24] — dokumenterad överföringsmekanism finns, men innebär en compliance-yta (privacy policy-text, SCC-referens). | Amerikanskt bolag; motsvarande SCC-baserade EU-villkor förväntas men INTE oberoende verifierade i detta pass — flagga. | Full kontroll: självhostad eller EU-baserad tile-leverantör (MapTiler har EU-region), inget tredjepartsskript som laddar automatiskt förrän kartan initieras — minst integritetsyta av de fem. | Minimal — OSM:s tile-server är non-profit, ingen kommersiell spårning, men produktionsanvändning bör ändå proxyas av god sed (fair-use). |
| **Prestanda** | JS-SDK, laddas från `cdn.apple-mapkit.com`[^25] — vikt ej mätt i detta pass. | JS-SDK, motsvarande vikt-klass som övriga kommersiella SDK:er — ej mätt. | WebGL-vektor; kräver `worker-src blob:` (web workers) — modern men något tyngre än ren raster vid första laddning. | Samma motor-arv som Mapbox GL (öppen fork) — samma vikt-klass. | Lättast: kärnbiblioteket är känt för lägst bundle-storlek bland kartbiblioteken (allmän branschkunskap, ej oberoende mätt i detta pass), men fler nätverksanrop för rastertiles. |
| **Tillgänglighet** | **Ingen Apple-dokumentation om tangentbord/skärmläsarstöd hittades i detta pass** — genuin lucka, se § Vad jag inte kunde belägga. | Aktivt investerad sedan ~2022–2023: tab/piltangent-navigering mellan markörer, ARIA-etiketter, tangentbordsgenvägsdialog (Google Maps Platform-bloggen, läst 2026-09-19[^26]). | Har `respectPrefersReducedMotion` (default `true`) och ett `essential`-flagga för nödvändiga animationer[^27] — god reduced-motion-hantering; ingen lika djup källa om ARIA/tangentbord hittad i detta pass. | KÄNDA, ÖPPNA tillgänglighetsluckor i GitHub-spårningen: dubbelt uppläst etikett (title+aria-label), popup-stängningskryss uppläst som "gånger", ofullständigt tangentbordsfokus-kontrakt[^28] — reellt problem mot 11-golvet som kräver kompensation. | Leafletjs.com har en EGEN, förstapartsförfattad tillgänglighetsguide[^29] och beskrivs (sekundärkällor) som starkast "out of the box" på tangentbordsnavigering[^30]; ett underhållet community-tillägg (`Leaflet.a11y`) täpper återstående luckor[^30]. |
| **CSP-påverkan** | Minst: allowlista `cdn.apple-mapkit.com` i `script-src`; ytterligare `connect-src`-domäner ej fullständigt kartlagda i detta pass. | Allowlista `maps.googleapis.com` (+ ev. Google Fonts) i `script-src`; träfflista ej fullständigt verifierad i detta pass. | Dokumenterat exakt av Mapbox: `worker-src blob:; img-src data: blob:; connect-src https://api.mapbox.com https://events.mapbox.com`[^31]. | Minst styrbar yta av de kommersiella: `connect-src` pekar på EGEN eller vald tile-leverantörs domän (kan proxyas same-origin), `worker-src blob:` ärvt från Mapbox GL-arvet. | Enklast: `img-src` mot tile-domänen, inget `worker-src`/WebGL-krav. |
| **Inlåsning** | Apple-specifik token/JWT-modell, Apple-ekosystem. | Google-konto + fakturering, Google-specifikt stilformat. | Mapbox-konto + fakturering; stilformat är dock i praktiken kompatibelt med MapLibre (allmän branschkunskap om forkens historik, ej oberoende verifierad i detta pass). | Lägst: öppen källkod, tile-leverantör bytbar (Protomaps ↔ MapTiler ↔ självhostat) utan att byta renderingskod. | Lägst: öppen källkod, OSM-data bytbar mot valfri raster-tile-leverantör. |

**Ärlighet om kolumnerna markerade "ej mätt/verifierad i detta pass":** flera
fält (exakt CSP-lista för MapKit/Google, exakt bundle-vikt, Apples
databehandlingsplats) kräver antingen en fullständig läsning av en
Apple-sida som bara gav sin titel vid `WebFetch`, eller ett verktyg
(nätverksinspektion i webbläsare) som var avstängt för detta pass. De är
INTE gissade — de är uttryckligen flaggade som öppna, per uppdragets krav.

---

## 5. Statisk kartbild kontra interaktiv karta

**Rekommendation, med resonemang snarare än ett enskilt namngivet
precedensbevis (se ärlighetsnot nedan): statisk vy som standard, interaktiv
karta bakom ett klick.**

- **Adress som TEXT + en "Öppna i Kartor"-länk kräver ingen API-nyckel och
  ingen leverantörsavtal alls.** Apples universella länkformat är verifierat:
  `maps.apple.com/?q=<sökterm>` eller `?ll=<lat>,<long>` — öppnar Apple Maps-
  appen på iOS/macOS, faller tillbaka på webben annars (Apples egen
  URL-scheme-referens[^32]). Googles motsvarighet:
  `https://www.google.com/maps/search/?api=1&query=<adress>` — cross-platform,
  **ingen API-nyckel krävs** (Google Developers, läst 2026-09-19[^33]). Att
  visa BÅDA länkarna (Apple + Google) täcker samtliga besökares
  standardkarta utan att någonsin behöva veta vilken enhet de använder.
- Detta mönster **kräver noll tredjepartsskript** för standardvyn — den
  interaktiva kartan (vilken leverantör som än väljs, § 4) laddas EFTER ett
  klick ("Visa interaktiv karta"), vilket är rent lazy-load och minimerar
  både prestandakostnad och den mängd tredjepartskod som körs som standard
  för varje besökare.
- **Apple erbjuder även ett dedikerat Snapshot/statisk-bild-API**
  (`developer.apple.com/documentation/snapshots`, bekräftat att sidan
  existerar via sökträff[^34]) — men jag kunde INTE hämta dess innehåll i
  detta pass (samma `WebFetch`-begränsning som Server API ovan, endast
  sidtitel returnerades). Behandla kravbilden (nyckel, kvot, pris) som
  **obelagd** tills primärkällan lästs i sin helhet.
- **Ärlighetsnot:** jag kunde INTE hitta en enskild, namngiven branschledare
  vars publicerade dokumentation ordagrant beskriver exakt "statisk bild →
  klick → interaktiv karta"-flödet på en eventsida (Luma kunde inte
  renderas, Eventbrites utvecklardokumentation gav bara sidtitlar vid
  hämtning). Rekommendationen ovan är därför **principbaserad** (härledd ur
  WCAG/GOV.UK § 6, prestandaresonemang och CSP-golvet ovan) snarare än ett
  citerat precedens — jag flaggar det explicit i stället för att låtsas ha
  ett belägg jag inte har.

---

## 6. Kartans tillgänglighet

**Grundprincip, WCAG 1.1.1 (Techniques H24, W3C, läst 2026-09-19[^35]):**
en karta räknas som icke-textinnehåll och kräver ett textalternativ. Det
enklaste och mest robusta mönstret enligt samma källa: skriv adressen och
vägbeskrivningen som text PÅ SIDAN, inte bara i en `alt`-attribut — texten
ska stå "i böljan av sidan" så att skärmläsaranvändare kan avgöra om de vill
läsa kartan alls.

**GOV.UK/Scotlands designsystem (byggd av en myndighet, läst 2026-09-19[^29])**
formulerar fyra konkreta krav som direkt appliceras här:

1. Direkta textetiketter för allt som bär betydelse (platsnamn) — använd
   ALDRIG bara en nål på kartan som enda bärare.
2. Använd aldrig färg som enda betydelsebärare.
3. Alla interaktiva kontroller (zoom, fullskärm, punkter) måste vara
   tangentbordstillgängliga.
4. Överväg en skip-länk så tangentbordsanvändare kan hoppa förbi hela kartan.

**Direkt applicerbart fynd:** `Platser`-tabellens befintliga fält (Namn,
**Adress**, **Parkering**, **Transport**, **Kläder** — `data-model.md` rad
575) är REDAN precis den textbaserade informationsmängd WCAG/GOV.UK kräver
ska stå bredvid kartan. Datamodellen behöver inget nytt fält för
tillgänglighet här — bara en skyldighet i UI-designen att alltid rendera
dessa fält som synlig text, aldrig gömda bakom en karta som enda källa.

**Karta får aldrig vara ENDA bäraren av platsinformationen** — konkret
mönster för eventsidan: adress + parkering + transport + kläder som text i
sidflödet, "Öppna i Kartor"-länkar (§ 5) som fungerar utan att någon karta
laddats, och den interaktiva kartan (om den väljs) som ett tillägg med en
skip-länk för tangentbordsanvändare.

---

## 7. Precedenter — tre, med öppen ärlighet om tunnheten

**Precedent-rymden är TUNN i detta pass** — jag hade ingen webbläsar-MCP och
fick förlita mig på hjälpcenterdokumentation och sökmotorsammanfattningar.
Jag har TVÅ solida, förstapartsbelagda precedent och en tredje som är
principiell (myndighetsvägledning) snarare än ett kommersiellt exempel.
Deklarerat öppet, inte gömt.

1. **Luma** (`help.luma.com/p/searching-for-events`, hämtad 2026-09-19[^36]):
   citat, ordagrant: *"Search takes your location into account, so events
   near you show up first."* och *"Users can browse events on a map...
   or move the map to a city they're visiting."* samt namngivna
   stadssidor (`luma.com/nyc`). **Mekanismen (IP vs. GPS) anges INTE** i
   denna artikel — hypotesen i uppdraget att Luma använder IP-geolokalisering
   med manuell stadsväljare som reserv förblir alltså **fortsatt HYPOTES**,
   nu belagd på MÖNSTRET (positionshint + manuell override) men inte på
   MEKANISMEN. Jag kunde heller inte bekräfta att Luma använder Apple MapKit
   JS specifikt (sökningar efter `cdn.apple-mapkit.com`/`gl.mapbox.com` på
   `lu.ma` gav inga träffar utan webbläsaråtkomst).
2. **Meetup** (`help.meetup.com`, artiklarna "Changing your account location"
   och "How Meetup Shows You Local Groups and Events", via `WebSearch`-
   sammanfattning 2026-09-19 — DIREKT `WebFetch` blockerades med HTTP 403,
   så detta är en sekundär läsning av förstapartsinnehåll, inte en full
   citering[^37]): plattformen använder profilens sparade ort (stad/postnummer)
   som primär signal, med ett justerbart sökavstånd mellan 2 och 100 miles,
   och ett fritt sökfält som override. Samma mönster: en lagrad/härledd
   ortsignal + manuell justering, ALDRIG ett hårt radiefilter utan reserv.
3. **Myndighetsvägledning som normativt mönster, inte ett kommersiellt
   exempel:** GOV.UK/Scotlands designsystem (§ 6) formulerar samma "karta
   aldrig ensam bärare"-princip som en uttrycklig regel för offentliga
   digitala tjänster. Det är starkare som NORM än som PRECEDENS — jag har
   den med öppet just för att inte dölja att jag bara har två genuina
   kommersiella exempel.

**Sammanfattat:** konvergensen mellan Luma och Meetup — positionssignal +
alltid synlig manuell override, aldrig ett rent radiefilter som enda väg —
är den delen av precedensbilden jag har högst tillit till. Den tredje platsen
(en tredje kommersiell aktör, t.ex. Eventbrite eller Airbnb) förblev
obelagd trots flera sökförsök; Eventbrites egna utvecklardokument
(`eventbrite.com/platform/docs/by-location`) gick INTE att hämta med
innehåll i detta pass.

---

## 8. Rekommendation

**Detta är en rekommendation, inte ett beslut** — Marcus avgör.

### Golv för v1

1. **Positionskälla:** server-side IP-stad via Vercels `x-vercel-ip-city`
   (+ `-latitude`/`-longitude` som extra signal) som förstahandshint, ALLTID
   synlig manuell "byt ort"-kontroll som reserv och korrigering. Ingen
   `Geolocation`-API-dialog i v1 — den precisionen behövs inte för
   stadnivå-"nära dig", och den extra friktionen/samtyckesbördan (§ 1) är
   inte värd nyttan vid vår volym.
2. **"Nära" = sorterad lista**, alltid alla event synliga, avstånd i klartext,
   "Ditt närmaste event" framhävt överst. Ingen radiefiltrering i v1.
3. **Geokodning:** Nominatim/OSM, vid skrivning av en `Platser`-rad, med
   manuell pin-korrigering i admin-UI:t. Additiva fält (`Latitud`, `Longitud`,
   `Positionsprecision`, `Positionskälla`, `Position uppdaterad`) — inga
   destruktiva ändringar av `Platser` (ADR-063).
4. **Lagring:** två `float`/`numeric`-kolumner (eller motsvarande Airtable-
   nummerfält idag), ingen PostGIS förrän volymen eller frågebehovet
   motiverar det.
5. **Kartleverantör, standardläge:** statisk adress+länk (§ 5) — ingen
   tredjeparts-JS laddas för de flesta besök.
6. **Kartleverantör, interaktivt läge (bakom klick):** **MapLibre GL JS +
   Protomaps eller MapTiler** som vektorplatte-källa, med en anpassad stil
   byggd för premiumkänsla. Motivering: matchar den visuella klassen Marcus
   efterfrågar, lägst och mest förutsägbara löpande kostnad vid vår volym,
   minsta integritetsyta (self-hostbar/EU-baserad), öppen källkod = ingen
   inlåsning. **Måste kompenseras för MapLibres kända, öppna
   tillgänglighetsluckor** (§ 4) — egen ARIA-etikettering, testad
   tangentbordsnavigering, och en tydlig skip-länk, byggt av oss ovanpå
   biblioteket, INTE antaget att biblioteket löser det.
7. **Integritetstext:** en kort, transparent rad i sidfoten/integritetspolicyn
   om att sidan använder besökarens ungefärliga plats (IP-härledd stad) för
   att sortera event, med hänvisning till legitimt intresse och en
   dokumenterad intresseavvägning (§ 1) — INGEN cookie-banner krävs för detta
   specifika syfte (§ 1, EDPB Guidelines 2/2023[^5]), men om `Geolocation`-API
   eller andra spårningsmekanismer läggs till senare måste den bedömningen
   göras om.

### Vad Marcus själv måste ordna

- **Om MapLibre+Protomaps/MapTiler väljs (rekommenderat):** ett MapTiler-
  konto om molntjänsten används (från 29 USD/månad[^22]) — ELLER ingen
  extern tjänst alls om Protomaps självhostas via t.ex. Cloudflare R2
  (realistisk kostnad "några dollar, ofta noll"[^21]). Inget nytt
  utvecklarmedlemskap krävs.
- **Om Apple MapKit JS väljs i stället (avstyrks, se dom nedan):** ett
  Apple Developer Program-medlemskap, **99 USD/år**[^12] — jag kunde INTE i
  detta pass bekräfta om Marcus redan har ett sådant medlemskap (oberoende
  av den befintliga miranon.se-driften, som körs på Elfsight/Wordpress-
  liknande verktyg enligt `miranon-se-intagskedjan-idag-2026-09-19.md`, inte
  på Apple-teknik). Detta måste Marcus själv bekräfta eller ordna.
- **Geokodning:** ingen kostnad, inget konto (Nominatims publika API räcker
  vid vår volym) — men admin-flödet för pin-korrigering måste byggas.
- **Domän/hosting:** redan löst (Vercel Pro, `ADR-091`).

### Golv kontra spekulativ komplexitet — skär vid vår volym

| Golv (behålls) | Spekulativ komplexitet (skärs för v1) |
|---|---|
| IP-hint + manuellt ortval | `Geolocation`-API-permission-flöde |
| Sorterad lista, alla event synliga | Radiefilter, "inom X mil"-UI |
| Två koordinatkolumner | PostGIS, spatiala index |
| Nominatim engångsgeokodning + manuell korrigering | Realtids-geokodning, bulk-omgeokodning-jobb |
| Statisk karta som standard, interaktiv bakom klick | Interaktiv karta som förval överallt |
| MapLibre + öppna plattor, egen a11y-härdning | Flera parallella kartleverantörer/failover |

### Dom över "Apple-kartan"

**Apple MapKit JS är ett TEKNISKT giltigt val — gratis vid vår volym,
fungerar enligt Apples egen sida i alla moderna webbläsare[^19], och ger
sannolikt exakt den visuella känsla Marcus menar med "Apple-kartan".** Men
det är INTE bevisat att leverantören Apple är nödvändig för upplevelsen: jag
kunde inte belägga att Luma faktiskt bygger på MapKit JS, MapLibre GL kan nå
en jämförbar visuell klass med en genomarbetad stil, och Apple-vägen har två
konkreta minus jag hittade i detta pass: **ingen dokumenterad
tillgänglighetsberättelse** (en verklig risk mot 11-golvet) och ett extra
**årligt medlemskap Marcus måste ordna och betala**, mot MapLibre-vägens
"några dollar/månad eller noll". **Rekommendationen är därför MapLibre +
öppna plattor** — samma upplevelse, lägre och mer förutsägbar kostnad, bättre
integritetsyta, men med en explicit skyldighet att själva bygga den
tillgänglighet Apple inte dokumenterar och MapLibre själv ännu inte löst.
Om Marcus after att se en MapLibre-prototyp ändå föredrar Apples specifika
kartografiska stil rent visuellt, är MapKit JS fortsatt ett rimligt sekundärt
val — det är då ett estetiskt beslut, inte ett tekniskt nödvändigt.

---

## Vad jag inte kunde belägga

- **Radantalet i `Platser`-tabellen** (hur många faktiska platser Miranon Media
  använder idag) — jag geokodade eller läste inga verkliga rader per
  uppdragets restriktion mot persondata/verklig basdata; endast fältantalet
  (5 fält) är bekräftat, inte radantalet. "Ett fåtal till ett tiotal" kvarstår
  som en overifierad men rimlig hypotes utifrån uppdragets egen ram.
- **Om Luma faktiskt använder Apple MapKit JS** (eller någon annan specifik
  kartleverantör) — obelagt även efter detta pass. `help.luma.com` beskriver
  BETEENDET, inte TEKNIKEN, och ingen webbläsaråtkomst fanns för att
  inspektera nätverkstrafiken.
- **Den fullständiga texten i Google Maps Platform Service Specific
  Terms** — jag har bara en sekundärkällas sammanfattning av 30-dagarsregeln
  för lagring av koordinater, inte den citerade originaltexten. Innan Google
  Geocoding/Maps väljs för NÅGOT ändamål i produktion måste avtalstexten
  läsas i sin helhet.
- **Apple Maps Server API:s och Maps Web Snapshots API:s fullständiga
  innehåll** — `developer.apple.com/documentation/applemapsserverapi` och
  `.../documentation/snapshots` gav bara sina sidtitlar vid `WebFetch`
  (troligen JavaScript-renderad dokumentation som kräver en riktig
  webbläsare). Exakta kvoter, pris bortom gratisnivån, och lagringsvillkor
  för geokodningssvar är därför OBELAGDA för just denna Apple-produkt,
  trots upprepade försök.
- **MapKit JS tillgänglighetsstöd** — ingen Apple-förstapartsdokumentation om
  tangentbord/skärmläsare hittades. Detta är den viktigaste enskilda luckan
  i hela passet eftersom tillgänglighet 11 är golvet utan undantag.
- **En tredje namngiven kommersiell precedent** utöver Luma och Meetup
  (Eventbrite, Airbnb, Bandsintown m.fl. undersöktes men gav inga
  primärkälle-citat om deras exakta "nära dig"-mekanism inom detta pass
  verktygsbudget).
- **Exakt CSP-domänlista för Apple MapKit JS och Google Maps JS** (utöver
  huvudskriptdomänen) — Mapbox/MapLibre-familjens krav är väl dokumenterade,
  Apples och Googles är det inte i detta pass.
- **Om Marcus redan har ett Apple Developer Program-medlemskap** av annan
  anledning (t.ex. en existerande iOS-app) — relevant för kostnadsbilden om
  MapKit JS ändå väljs, men utanför vad detta pass kan avgöra.

---

## Källförteckning

**Vercel / hosting:**
[^6]: [Vercel changelog — IP Geolocation now available for all plans](https://vercel.com/changelog/ip-geolocation-now-available-for-all-plans), läst 2026-09-19
[^8]: [vercel.com/docs/headers/request-headers](https://vercel.com/docs/headers/request-headers), läst 2026-09-19

**GDPR / ePrivacy / svensk rätt:**
[^3]: CJEU, dom C-582/14 *Breyer mot Tyskland*, 2016-10-19 — sammanfattad via [A&L Goodbody](https://www.algoodbody.com/insights-publications/cjeu-rules-ip-addresses-may-constitute-personal-data) och [IAPP](https://iapp.org/news/a/in-breyer-decision-today-europes-highest-court-rules-on-definition-of-personal-data), läst 2026-09-19
[^4]: Svensk sekundärsammanfattning av LEK/GDPR-praxis kring IP-baserad
  geolokalisering och legitimt intresse, `WebSearch`-syntes, läst 2026-09-19
  (ingen enskild primärkälle-URL bar hela svaret)
[^5]: EDPB, [Guidelines 2/2023 on the Technical Scope of Article 5(3) of the
  ePrivacy Directive](https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf), läst 2026-09-19 (via sekundärsammanfattning; själva PDF:en
  citerad av flera juridiska sammanfattningar, ej fullt läst i original i
  detta pass)
[^7]: [W3C — Geolocation API Specification](https://www.w3.org/TR/geolocation/), läst 2026-09-19

**IP-geolokaliseringens träffsäkerhet:**
[^1]: [MaxMind Support — Geolocation accuracy](https://support.maxmind.com/knowledge-base/articles/maxmind-geolocation-accuracy), läst 2026-09-19
[^2]: WhatIsMyLocation.org, sammanställning av 2026-studie om mobil
  IP-geolokaliseringsprecision, läst 2026-09-19

**Geokodningsleverantörer:**
[^9]: Google Maps Platform-prissättning 2026, `WebSearch`-syntes av flera
  tredjepartskällor (woosmap.com, radar.com, mapsi.dev), läst 2026-09-19
[^10]: Sekundärsammanfattning av [Google Maps Platform Service Specific
  Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) —
  originaltexten EJ fullt läst i detta pass, se § Vad jag inte kunde belägga
[^11]: [Mapbox — Understand Temporary versus Permanent Geocoding](https://docs.mapbox.com/help/dive-deeper/understand-temporary-vs-permanent-geocoding/), läst 2026-09-19
[^12]: Apple Developer Program-avgift, 99 USD/år — bekräftad via
  `WebSearch`-sammanfattning av Apples egna villkor, läst 2026-09-19
[^13]: [MapKit JS Pricing — Apple Developer Forums](https://developer.apple.com/forums/thread/782750), läst 2026-09-19
[^14]: [OSM Foundation — Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/), läst 2026-09-19
[^15]: [Lantmäteriet — Öppna data](https://www.lantmateriet.se/oppnadata) och
  [Geotorget — Belägenhetsadress Direkt](https://geotorget.lantmateriet.se/geodataprodukter/belagenhetsadress-direkt-api), lästa 2026-09-19

**Datamodell:**
[^16]: `WebSearch`-syntes om PostGIS kontra plain lat/lng-kolumner vid liten
  datavolym, läst 2026-09-19 (ingen enskild auktoritativ URL bar hela
  jämförelsen — allmän branschkonsensus från flera källor inkl.
  [postgis.net-dokumentationen](https://postgis.net/documentation/tips/lon-lat-or-lat-lon/))
[^17]: [Supabase Docs — PostGIS: Geo queries](https://supabase.com/docs/guides/database/extensions/postgis), läst 2026-09-19

**Kartleverantörer:**
[^18]: MapKit JS gratiskvot, 250 000 kartvisningar + 25 000 servicecalls/dag
  — `WebSearch`-sammanfattning av Apples egen sida, läst 2026-09-19
[^19]: [developer.apple.com/maps/mapkitjs](https://developer.apple.com/maps/mapkitjs/), läst 2026-09-19 (via `WebFetch`-sammanfattning)
[^20]: Mapbox GL JS-prissättning 2026, `WebSearch`-syntes (storerocket.io,
  stratega.co, docs.mapbox.com/mapbox-gl-js/guides/pricing/), läst 2026-09-19
[^21]: [Protomaps.com](https://protomaps.com/), läst 2026-09-19
[^22]: MapTiler-prissättning 2026, `WebSearch`-syntes (maptiler.com/data/pricing, saaspartout.com), läst 2026-09-19
[^23]: Apples marknadsföringstext om integritet i Maps — `WebSearch`-syntes,
  läst 2026-09-19 (marknadsföringspåstående, ej en juridisk avtalskälla)
[^24]: [Google Maps Platform EEA Service Specific Terms](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms), refererad via `WebSearch`-syntes om Airbnbs användning av Google Maps, läst 2026-09-19
[^25]: `cdn.apple-mapkit.com`-domänen, bekräftad via GitHub
  ([apple/mapkit-loader](https://github.com/apple/mapkit-loader)) och
  `WebSearch`-syntes, läst 2026-09-19
[^26]: [Google Maps Platform-bloggen — Improved accessibility in the Maps
  JavaScript API](https://mapsplatform.google.com/resources/blog/improved-accessibility-maps-javascript-api/) m.fl., lästa via `WebSearch`-syntes 2026-09-19
[^27]: Mapbox GL JS — `respectPrefersReducedMotion` och `essential`-flaggan,
  [PR #12694](https://github.com/mapbox/mapbox-gl-js/pull/12694) och
  [PR #8883](https://github.com/mapbox/mapbox-gl-js/pull/8883), lästa via
  `WebSearch`-syntes 2026-09-19
[^28]: MapLibre GL JS, öppna tillgänglighetsissues
  ([#357](https://github.com/maplibre/maplibre-gl-js/issues/357),
  [#359](https://github.com/maplibre/maplibre-gl-js/issues/359),
  [#360](https://github.com/maplibre/maplibre-gl-js/issues/360),
  [#362](https://github.com/maplibre/maplibre-gl-js/issues/362)), lästa via
  `WebSearch`-syntes 2026-09-19
[^29]: [leafletjs.com/examples/accessibility](https://leafletjs.com/examples/accessibility/), refererad via `WebSearch`-syntes 2026-09-19
[^30]: [Leaflet.a11y-tillägget](https://github.com/nfreear/leaflet.plugins),
  refererad via `WebSearch`-syntes 2026-09-19 (sekundärkälla, ej Leaflet-
  kärnans egen dokumentation)
[^31]: [Mapbox GL JS — Security and testing](https://docs.mapbox.com/mapbox-gl-js/guides/security-and-testing/), läst via `WebSearch`-syntes 2026-09-19

**Öppna-i-Kartor-länkar:**
[^32]: [Apple — iPhone URL Scheme Reference, Map Links](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html), läst via `WebSearch`-syntes 2026-09-19
[^33]: [Google for Developers — Maps URLs, Get Started](https://developers.google.com/maps/documentation/urls/get-started), läst via `WebSearch`-syntes 2026-09-19
[^34]: [developer.apple.com/documentation/snapshots](https://developer.apple.com/documentation/snapshots) — sidan bekräftad
  existera via sökträff, innehåll EJ hämtat, 2026-09-19

**Tillgänglighet (kartor generellt):**
[^35]: [W3C — H24: Providing text alternatives for the area elements of
  image maps](https://www.w3.org/TR/WCAG20-TECHS/H24.html), läst via
  `WebSearch`-syntes 2026-09-19

**Precedenter:**
[^36]: [help.luma.com/p/searching-for-events](https://help.luma.com/p/searching-for-events), hämtad direkt via `WebFetch` 2026-09-19
[^37]: [help.meetup.com — How Meetup Shows You Local Groups and Events](https://help.meetup.com/hc/en-us/articles/39488979117837-How-Meetup-Shows-You-Local-Groups-and-Events) och [Changing your account location](https://help.meetup.com/hc/en-us/articles/360025771311-Changing-your-account-location) — direkt `WebFetch` gav HTTP 403, läst via `WebSearch`-sammanfattning 2026-09-19

**Internt (läst i sin helhet, ej ny research):**
[`docs/reference/data-model.md`](../reference/data-model.md) §
Tabell-ID:n + Schema cheat sheet ·
[`docs/decisions/ADR-011-csp-plugin-deferral.md`](../decisions/ADR-011-csp-plugin-deferral.md) ·
[`docs/decisions/ADR-091-hosting-deploy-vercel-pro.md`](../decisions/ADR-091-hosting-deploy-vercel-pro.md) ·
[`docs/byggplan.md`](../byggplan.md) § Fas 7 + Fas E ·
[`t95-r1-hosting-vercel-2026-08-02.md`](t95-r1-hosting-vercel-2026-08-02.md) § 2 ·
[`hallplats-modellen-eventsidan-2026-07-26.md`](hallplats-modellen-eventsidan-2026-07-26.md) ·
[`luma-studie-monster-for-nya-miranon-se-2026-09-19.md`](luma-studie-monster-for-nya-miranon-se-2026-09-19.md) ·
[`miranon-se-intagskedjan-idag-2026-09-19.md`](miranon-se-intagskedjan-idag-2026-09-19.md)
