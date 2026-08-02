# Hållplatsen som ETIKETT — DIVERGENS-passet (S93, 2026-08-02)

> **Frågan som prototypen besvarar (throwaway-kontraktet klausul i, verbatim
> ur uppdraget):**
>
> **"Hur ska alternativ C — hållplatsen som ETIKETT — bäras på eventsidans
> Anmälda deltagare-block: vilken av tre strukturella utföranden (a
> Radbytet, b Stations-railen, c Nästa steg-panelen) gör 'vad gör jag
> härnäst' och 'hitta Anna utan förkunskap' självklara för Lotta, och vilka
> delval låser Marcus?"**

Underlag: `docs/research/hallplats-modellen-eventsidan-2026-07-26.md`
(Del 6 alternativ C, Del 3 sex undantagsfall, Del 8 åtta öppna frågor).
Kravkälla, inte fri tolkning.

Tre strukturellt olika svar på den befintliga routen `/event/$eventId` med
`?variant=a|b|c` (prototyp-skillens underform A: riktig route, riktig auth,
riktig datahämtning genom adaptern som default — bara TOPPEN av "Anmälda
deltagare"-blocket byts). **Marcus väljer EN.**

Koden är kastbar och DEV-grindad:
`src/components/events/detail/DeltagareHallplatsPrototyp.tsx` (huvudfilen,
frågan som toppkommentar) + `hallplats-steg-prototyp.ts` (delad logik +
fixturer) + minimala hook-punkter i `Deltagare.tsx`/`Betalningar.tsx`/
`EventDetail.tsx`.

## Så här kör du dem

```bash
npm run dev
# och sedan i webbläsaren, på valfritt event:
#   /event/<eventId>?variant=a               ← RADBYTET
#   /event/<eventId>?variant=b               ← STATIONS-RAILEN
#   /event/<eventId>?variant=c               ← NÄSTA STEG-PANELEN
#   /event/<eventId>?variant=a&data=proto    ← samma variant, IN-MEMORY-fixtur
#   /event/<eventId>                          ← skarpa vyn, orörd
```

Växlaren (ikon-railen) finns i vyn som vanligt, monterad EN gång i
`EventDetail.tsx` (både Deltagare- och Betalningar-blocket lyssnar
oberoende på samma `?variant=`/`?data=` via `nuqs`).

## Bilderna

Tagna med Playwright (fristående script, L304-formen, e2e-svitens
`playwright/.auth/user.json`) mot en dev-server på port 5183 med
`get-event`/`get-registrations` **nätverks-mockade** (page.route) — inte
mot riktig staging. Skälet är dokumenterat, inte en genväg: staging-CORS:ens
allowlist (`docs/reference/prototyp-verifiering-runbook.md:33`) tillåter
EXAKT `http://localhost:5173`/`4173`, och 5173 var upptaget av
huvudträdets EGNA dev-server (annan cwd, startad före denna session — rörd
aldrig). Mock-datat är samma 14-personers fixtur som `?data=proto` använder
i appen (domän-schema-giltigt, samma fält).

- `skarp-utan-variant.png` — baslinje, ingen `?variant`. Identisk kod-gren
  som produktionen (verifierad via `git diff` mot `origin/main`: grenen
  `protoVariant == null` reproducerar de fem ursprungliga
  `SummeringsRad`-raderna ORÖRDA, bara omindragna).
- `variant-a-default.png` / `variant-a-proto.png` — pixel-identiska (mock
  och fixtur bär samma innehåll denna gång; verifierar att koden inte
  skiljer på källa när datat är detsamma).
- `variant-b-default.png` / `variant-b-proto.png`
- `variant-c-default.png` / `variant-c-proto.png`
- `variant-c-genvag-oppnad.png` — variant C:s "Öppna och markera" klickad i
  DEFAULT-läge: öppnar det RIKTIGA `useMarkeringsLage` (task-48, oförändrad)
  med alla 4 väntande förmarkerade (`4 av 4 markerade`).
- `variant-c-proto-kvittens-stubbad.png` — samma knapp i `?data=proto`:
  Bekräfta-mutationen ÄR STUBBAD (inget `send-registration-confirmation`-
  anrop mättes, se verifieringsloggen i slutrapporten) men kvittensen
  ("Skickat — 4 bekräftelser är skickade…") renderar identiskt.
- `betalningar-fraga7-oppnad.png` — Betalningar → Öppna detaljer: Anna Ek/
  Erik Larsson/Maria Holm/Gustav Wik bär nu en "Obekräftad"-pill, Maria Holm
  och Gustav Wik dessutom kategori-pillen ("Manuellt tillagd"/"Från
  väntelistan") — fråga 7, samma i alla varianter.

---

## Det som är GEMENSAMT (divergensen gäller toppens form, inte resten)

- **Registret därunder är OFÖRÄNDRAT**: Obekräftade-kön (fast, ~3 kort,
  scroll — task-48 byggkrav 4) + Bekräftade-registret (fällbart) + kryss-
  läget (Bor över) + markera-läget (`useMarkeringsLage`/`MarkeringsBatchBar`/
  `MarkerbartKort`) — SAMMA mekanik som produktionskoden, ingen kopia.
- **Steg-märke på varje kort**, i metaytan (inte pill-slotten): "Väntar på
  bekräftelse" · "Väntar på betalning" · "Klar" · undantagsorden ("Avbokad" ·
  "Inställt" · "På väg till väntelistan"). En person bär EXAKT ett märke —
  det längst bak liggande ofärdiga steget (Del 6C).
- **A′ inbakat**: "Betalningspåminnelse skickad" flyttar till Betalningars
  räkneradsgrupp (research-doken Del 6, alternativ A′ + Del 1.5 fynd 3).
- **Eventinfo-raden + Bor över-raden står kvar**, ORÖRDA (signal-slot,
  `AutoKryss`, kryss-läget) men visuellt avskilda från steg-räknarna (egen
  `divide-y`-grupp, `gap-2` mellan grupperna).
- **Avbokade synliga** (fråga 6): diskret utfällbar rad "N har avbokat"
  längst ned, `<details>`/`<summary>` (native a11y, ingen egen JS-mekanik).
- **Betalningar fråga 7**: bekräftelseläge-pill (Obekräftad) + kategori-pill
  på `BetalningsPersonRad`, samma i alla tre varianter (prövas ja/nej, inte
  variantval).
- Datavägen: default = riktig hämtning (ADR-061, orörd); `?data=proto` =
  in-memory-fixtur, 14 poster som täcker research-dokens Del 3-nät (se
  `hallplats-steg-prototyp.ts` docblock för den fullständiga listan).

---

## VARIANT A — RADBYTET

`variant-a-default.png` / `variant-a-proto.png`

De fem summeringsraderna ersätts av TRE steg-räknar-rader i EXAKT samma
`SummeringsRad`-grammatik (knapp, `aria-pressed`, hover-bakgrund, höger-
ställt tal): "Väntar på bekräftelse" (röd vid >0) · "Väntar på betalning"
(gul vid >0) · "Klara". Klick filtrerar registret på steget — precis som
dagens filter, samma "Rensa filtret"-mönster återanvänt.

**Vinner:** minsta möjliga ingrepp. Läsordningen är identisk med dagens
sida — ingen ny visuell grammatik att lära sig, bara nya ORD på samma
rader. Billigast att bygga och att granska.

**Offrar:** ingen egen "vad gör jag härnäst"-signal utöver att första raden
råkar stå överst och vara röd. Om "Väntar på betalning" är den enda
brådskande raden (0 obekräftade) syns ingen skillnad mot "Klara" förutom
färgen — mätningskänsligt, kräver att Lotta läser alla tre.

## VARIANT B — STATIONS-RAILEN

`variant-b-default.png` / `variant-b-proto.png`

Samma tre räknare, renderade som en horisontell `<fieldset>`-rail: tre
stationer med nummer 1·2·3, namn, count — och **tyngdpunkten** (första
station med count > 0, Marcus ordning) får en synlig ram/bakgrund utan att
någon siffra behöver läsas för att se var ögat ska landa.

**Vinner:** starkast processkänsla — det ser ut som ett flöde, inte en
lista. Tyngdpunkt-markeringen är den mest direkta "vad gör jag härnäst"-
signalen av de tre, eftersom den fungerar INNAN någon siffra är läst.

**Offrar:** ny visuell grammatik (ingen annan yta på sidan har en
horisontell station-rail) — den kostnaden är research-dokens öppna fråga
("tillför processgrafiken begriplighet eller bara yta?"). Tre stationer på
smal skärm (mobilen är appens primära yta) pressar textstorleken; vid en
framtida fjärde station skulle railen behöva om-tänkas helt.

## VARIANT C — NÄSTA STEG-PANELEN

`variant-c-default.png` / `variant-c-proto.png` (+
`variant-c-genvag-oppnad.png`, `variant-c-proto-kvittens-stubbad.png`)

Samma tre rader som (a) PLUS en "Härnäst"-panel överst som pekar ut EN
handling i klartext: "4 väntar på bekräftelse" + knappen **[Öppna och
markera]**. Knappen öppnar det RIKTIGA markera-läget (task-48, oförändrat)
med alla väntande förmarkerade — genvägs-formen ur TASK-18.20 A3b.

**Vinner:** starkast "vad gör jag härnäst" av de tre — panelen SÄGER det i
ord, i stället för att Lotta ska tolka en siffra eller en färg. Genvägen
till markera-läget gör steget "en person, en plats, ett klick" konkret.

**Offrar:** mest yta (panel + tre rader, mot bara tre rader i a/b) och mest
byggd logik (genvägs-wiring, stub-gren för `?data=proto`). Genvägen finns
ENDAST för "Väntar på bekräftelse" (den enda stationen med en färdig,
orörd mekanik i denna kodbas) — när "Väntar på betalning" är nästa steg
visar panelen bara text ("Se Betalningar-blocket nedan"), ingen knapp. Det
är ett medvetet snitt (se slutrapporten), inte en bugg, men det gör
variantens LÖFTE ("en knapp löser nästa steg") ojämnt infriat mellan
stegen — värt att väga in i valet.

---

## Öppna frågor kvar till Marcus (research-doken Del 8, ordnade)

2. **Flytt eller märke?** — redan besvarad genom detta pass (märke, C).
4. **Bekräftade-registret** — orört i alla tre; ingen av dem river den
   sammanhållna, utskrivbara listan (Åtgärd 6).
5. **K42:s utskicksordning** — reviderad öppet i alla tre (tre steg-rader +
   en fristående utskicks-rad ersätter de fem).
6. **Ska undantagen synas?** — Ja i alla tre (denna prototyp), som en
   diskret rad. Marcus kan fortfarande välja "nej, tyst" — det är en egen,
   billig växel att slå av.
7. **Betalningar: bekräftelseläge + kategori?** — Ja i alla tre (prövat,
   inte variantval). Se `betalningar-fraga7-oppnad.png`.

**Delvalet A/B/C är öppet till Marcus.** Rekommendationen i research-doken
Del 7 var C (starkast branschstöd + billigast strukturellt), men det valet
gjordes FÖRE denna byggda jämförelse — de tre bilderna ovan är underlaget
för det faktiska valet, inte en förhandsdom.

---

## Review-fix (PR #603, 2026-08-02) — read-only-stubben täckte inte alla skrivvägar

Granskningsfynd mot den pushade grenen: read-only-förstärkningen ("UI-varianter
kopplas aldrig till verkliga mutationer") höll bara för Variant C:s
bekräfta-genväg. Två vägar avfyrade RIKTIGA `?data=proto`-mutationer:

1. **Betalningar.tsx** (`BetalningsDetaljer`/`BetalningsLinje`): kryss, notering
   och Påminn byggde en delad `ArbetsytansMutationer` och kallade `.mutate()`
   oavsett dataläge — ett klick på en fixtur-rad avfyrade ett skarpt EF-anrop
   mot staging med ett ID som inte finns där.
2. **Deltagare.tsx** (`toggleBorOver`/`BorOverRad`): Bor över-kryssets
   `lodging.mutate(...)` var ogrindat i proto-läget (endast bekräfta-genvägen
   var stubbad).

**Fixens form (minsta ärliga, per uppdraget — inte kvittens-UI):** disablade
kontroller, inte tyst no-op. `protoDataMode` trädd hela vägen ned till varje
kontroll (`BetalKryss`/`Input`/Påminn-elementet i Betalningar; `BorOverRad` i
Deltagare):

- **Kryss** (betalning + Bor över): `isDisabled` (native RAC-semantik — AT
  läser "avstängd/otillgänglig") + `data-[disabled]:cursor-not-allowed
  data-[disabled]:opacity-60` (samma data-attribut-mönster som `Input`s egen
  disabled-styling). Anropsfunktionerna (`onChange`/`toggleBorOver`) guardar
  ÄVEN explicit på `protoDataMode` — försvar-i-djup, inte den enda spärren.
- **Noteringsfältet:** `isDisabled` på `Input` (blockerar inmatning helt;
  `sparaNotering` guardar också explicit).
- **Påminn:** `<a href="mailto:…">` (med onClick-mutation) byts mot en inert
  `<span aria-disabled="true">` i proto-läge — ingen `mailto:`-navigation,
  ingen onClick, samma ikon/yta (K33: slotten alltid samma bredd).
- **Title/aria + liten text:** EN delad förklaringsrad per arbetsyta
  (`text-caption text-text-muted`, t.ex. "Förhandsvisning (proto) — kryss,
  notering och påminn är inaktiverade nedan, inget sparas") + `title` på
  radens/kortets DOM-wrapper (inte på RAC-komponenten själv — `Checkbox`s
  props-kontrakt saknar `title`, verifierat mot `@react-types/shared`s
  `GlobalDOMAttributes`/`DOMProps`/`InputDOMProps`).

**Default-läget och skarpa vyn (utan `?variant`) står ORÖRDA** — `protoDataMode`
defaultar till `false` i varje ny prop, så oförändrat beteende utanför
prototypen är strukturellt garanterat, inte bara testat.

**Verifiering:** fristående Playwright-skript (L304-formen: e2e-svitens
`playwright/.auth/user.json`, mockad `get-event`/`get-registrations` via
`page.route` + en catch-all-abort på alla ANDRA `/functions/v1/*`-anrop som
säkerhetsnät) mot en dev-server på port 5187. Alla fem skrivvägar klickade i
`?data=proto&variant=c`: betalnings-kryss, noteringsfält-commit, Påminn,
Bor över-kryss, bekräfta-genvägen (två-stegs-dialogen: trigger + "Skicka
N bekräftelse(r)") — **noll mutations-anrop fångade** på samtliga. Skarpa
vyn (utan `?variant`) omkörd separat: `data-disabled` förekommer EN gång i
DOM (en orelaterad "Spara"-knapp i Ändra-morfen, inte Betalningar/Deltagare),
ingen proto-förklaringstext, kryss/notering odisabled, Påminn-länkarna
(mailto) intakta.

---

## Review-fix-våg 2 (2026-08-02) — sex granskningsfynd, orkestrerarens ord "slarvigt byggd"

Marcus underkände hela ytan i granskning ("slarvigt byggd, under all kritik").
Orkestreraren verifierade defekterna mot snapshotsen och gav sex punkter,
åtgärdade punkt för punkt. Prototyp-kontraktet (kastbar kod) står — men
"kastbar" är inte samma sak som "slarvig".

### 1. Sidan motsäger sig själv i `?data=proto` (Beläggning + Gruppdynamik läste RIKTIGA data)

`Belaggning.tsx` och `Gruppdynamik.tsx` läste tidigare ALLTID event-aggregaten
respektive `get-registrations` — oavsett `?data=proto`. Sidan visade därför
"Anmälda deltagare 0 · 0 av 20 · 0 %" (Beläggning) medan Deltagare/Betalningar
samtidigt visade fixturernas 12 personer.

**Fix:** samma DEV-grindade `useQueryState('variant'|'data')`-läsning som
Deltagare.tsx/Betalningar.tsx (nuqs synkar), tillagd i BÅDA filerna.
Beläggning härleder nu `Anmälda deltagare`/`Manuellt tillagda`/`Medföljande`
ur fixturuppsättningens `Källa`-fält (samma K16-kategorier som
Deltagare.tsx:s `kategori()`); Max antal platser förblir eventets RIKTIGA
värde (uppdragets uttryckliga undantag). `Extra platser` och `Väntelista` kan
INTE härledas ärligt ur fixturerna (rent admin-satt tal respektive en HELT
ANNAN Airtable-tabell, `tbl2VxMx7JMkIxD4Q`) — dimmas med en explicit
"Ej i fixturunderlaget (proto)"-not i stället för en osann nolla eller ett
läckt riktigt värde. Gruppdynamik härleder nivåbucketarna ur fixturernas
`antalGenomfordaEvent` (redan satt per fixtur); en sekundär självmotsägelse
hittades och fixades i samma svep — Karin Ström (fixtur 05) bucketades
"1–2 tidigare event" men bar `kurshistorik: null` och hade därför visat
"Inga tidigare event" på sitt eget kort. Två genomförda kurshistorik-rader
lades till hennes fixtur så korten och bucketen säger samma sak.

**Öppet bokfört snitt (fixtur 14, Gustav Wik, Källa='Väntelista'):** faller i
`formulär`-bucketen i Beläggningens härledning eftersom kompositionen saknar
en egen "från väntelistan"-del — utan det snittet hade summan blivit 11 i
stället för de 12 Deltagare visar.

**Ny upptäckt defekt av samma klass (öppet bokförd, inte i den ursprungliga
listan men samma FYND-1-mönster):** Beläggningens "Ändra"-knapp var HELT
ogrindad — ett klick hade öppnat `BelaggningForm` och ett Spara skrivit en
RIKTIG `useUpdateEvent`-mutation, oavsett `?data=proto`. Fixad: `AndraRad`
(`DetaljGrupp.tsx`) fick ett `disabled`-stöd (native `disabled`-attribut);
Beläggning skickar `disabled={protoDataMode}` — morfen kan då aldrig öppnas.

### 2. Anteckningar-composern skrev på RIKTIGA eventet i proto-läget

`Composer` (`Anteckningar.tsx`) hade inget `protoDataMode` alls — samma
FYND-1-mönster som PR #603:s Betalningar/Deltagare-fynd, i en fil ingen
tidigare pass rört. Fix: samma mönster (isDisabled på `TextArea` + Spara/Rensa,
explicit guard i `spara`/`rensa`, delad förklaringsrad).

### 3. Dubbel-etikettering (röd "Obekräftad"-pill + steg-märke samtidigt)

`KortInnehall` (Deltagare.tsx) renderade alltid den röda statuspillen
OBEROENDE av `hallplatsMarke` — i variant-läge visade ett obekräftat kort
därför BÅDE "Obekräftad" (pill) och "Väntar på bekräftelse" (steg-märke) för
samma axel. Fix: pillen villkoras nu även på `!hallplatsMarke` — steg-märket
ERSÄTTER statuspillen i variant-läge; kategori-pillen (Manuellt tillagd m.fl.)
är opåverkad (annan axel).

### 4. Variant B var ingen rail — tre halvstylade chips

`HallplatsToppB` byggdes om till en riktig stations-rail: en horisontell linje
löper GENOM tre lika breda stationer (nummer-i-cirkel + kort etikett + count),
tyngdpunkt-stationen (första med count > 0) får en fylld gulddragen cirkel
(`bg-primary`) i stället för outline-cirkeln. Korta facit-etiketter
("Bekräftelse"/"Betalning"/"Klara") ersätter de fulla `HALLPLATS_LABEL`-orden
ENDAST i denna komponent — ingen radbrytning på smal bredd.

### 5. Eventinfo-raden oavskild bland steg-räknarna

Eventinfo+Bor över-gruppen fick en `border-t` + en diskret grupprubrik
("Utskick") i alla tre varianter — synlig avgränsning i stället för bara ett
`gap-2`.

### 6. Allmän finish

Spacing/typografi i variant B:s nya rail följer SummeringsRad-grammatikens
tokens (`text-caption`/`text-small`/`bg-border`/`bg-primary` — inga
hårdkodade färger). Övriga varianter oförändrade i sin egen finish (redan
byggda mot samma grammatik i PR #603).

### Verifiering (samma rigor, ny metod för nätverks-genvägen)

**CORS-fyndet:** en egen dev-server på en ANNAN port än 5173/4173 blockeras
helt av stagings `CORS_ALLOWED_ORIGINS` (`docs/reference/prototyp-verifiering-runbook.md`
§ Portkartan) — mätt här: samtliga `get-event`/`get-registrations`-anrop gav
`ERR_FAILED`/"blocked by CORS policy" mot en server på port 5195. 5173 är
Marcus levande dev-server (huvudträdet, en ANNAN cwd) och får inte röras eller
användas för att visa DENNA worktrees kod. Lösning: `page.route()` fångar
`get-event`/`get-registrations` INNAN webbläsarens CORS-kontroll appliceras
och fyller dem med RIKTIG data hämtad server-sidan (Node, i
Playwright-processen — Node har ingen CORS-policy). Datan är därför ÄKTA
staging-data för ZZ-GRANSKNING-FIXTUR, inte en syntetisk mock. Metoden är
generell nog att vara värd en framtida runbook-not (se separat commit i
`prototyp-verifiering-runbook.md`).

- Samtliga 7 grund-snapshots (skarp + a/b/c × default/proto) togs om mot
  `reco44UBx6GXcxwu5` (ZZ-GRANSKNING-FIXTUR): **0 console-fel, 0 pageerrors**
  på samtliga sju.
- Interceptions-passet (AC #5), `?data=proto&variant=a|c`: betalnings-kryss
  (`isDisabled` bekräftat true), noteringsfält (Playwright `fill()` kastade
  `TimeoutError` — fältet är native `disabled`, inte bara visuellt dämpat),
  Påminn-spannet (inert, `aria-disabled`), Bor över-kryss (`data-disabled="true"`
  på wrapper-label, `aria-checked` oförändrat före/efter klick), Anteckningar
  (textarea `disabled`, Spara-knappen `isDisabled` true, `fill()` kastade
  samma TimeoutError), bekräfta-genvägens FULLA klick-igenom (öppna → trigger
  → "Skicka 4 bekräftelser" → kvittensen renderar) — **0 nya
  `/functions/v1/*`-anrop efter VARJE steg**, mätt genom att logga ALLA
  (inte bara de mockade läsvägarna) anrop per sida.
- Variant C:s genväg i DEFAULT-läge (riktig data): endast "Öppna och
  markera" klickad (INTE "Skicka" — hade muterat det seedade eventet på
  riktigt), 0 nya icke-GET-anrop, skärmdump tagen.
- Skarpa vyn (`skarp-utan-variant.png`) mot samma riktiga event: Beläggning
  visar 8/30 (27 %), Deltagare "Alla (16)"/"Obekräftade (8)" — matchar
  Airtable (live-verifierat, se slutrapporten), fem-summeringsrad-grammatiken
  orörd, Anteckningar-composern INTE inaktiverad (som förväntat utanför
  prototypen).

Alla tio snapshots i katalogen är omtagna (samma filnamn, samma
Playwright-metod).
