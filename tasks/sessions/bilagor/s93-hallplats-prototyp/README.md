# Hållplatsen som ETIKETT — DIVERGENS + KONVERGENS (S93, 2026-08-02 → 2026-08-03)

> **Frågan DIVERGENS-passet besvarade (throwaway-kontraktet klausul i,
> verbatim ur uppdraget):**
>
> **"Hur ska alternativ C — hållplatsen som ETIKETT — bäras på eventsidans
> Anmälda deltagare-block: vilken av tre strukturella utföranden (a
> Radbytet, b Stations-railen, c Nästa steg-panelen) gör 'vad gör jag
> härnäst' och 'hitta Anna utan förkunskap' självklara för Lotta, och vilka
> delval låser Marcus?"**
>
> **Svar (Marcus, 2026-08-03): Variant A — Radbytet.** B och C är förkastade
> och RIVNA ur koden i konvergens-passet — se § KONVERGENS-PASSET nedan,
> som är den AKTUELLA, byggda strukturen. Resten av detta dokument ovanför
> den sektionen är DIVERGENSENS historik, bevarad som provenance men inte
> längre den körbara ytan.

## Iterationspunkter för Marcus (valfas-materia — INTE byggda i detta pass)

Tre öppna frågor, itereras live med Marcus i browsern efter landning:

1. **Semantiken "mottagna" vs "klara" på slutbetalnings-raden.** Sedan
   `betalningsSplit()`-enandet (§ KONVERGENS-PASSET, betalningsSplit-fixen)
   räknar `slutMottagna` numera in "Ej relevant"-poster (föreläsningar utan
   slutbetalning) som klara — raden säger fortfarande "mottagna", vilket är
   en term-drift som fanns redan innan detta pass men blir mer synlig nu när
   talen är enade. Ordvalet ("mottagna" kontra "klara"/"färdiga") är inte
   låst.
2. **Utskickshistorikens visning på korten.** Den moved-in arbetsytans
   per-person-historik ("Påminnelse om X skickad …") är återanvänd oförändrad
   — om/hur den ska synas även på REGISTRETS kort (inte bara i den fällda
   arbetsytan) är öppet.
3. **Avbokade-radens exakta form.** Byggkrav 1 (S96) gav den en egen
   `SummeringsRad` i termen "Avbokade" — om det är den slutgiltiga formen,
   eller om avbokade ska synas på annat sätt (t.ex. i registret self, inte
   bara som filter), är öppet.

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

## Så här kör du dem (DIVERGENSENS ursprungliga form — se § KONVERGENS-PASSET för AKTUELL form)

```bash
npm run dev
# och sedan i webbläsaren, på valfritt event (DIVERGENSEN, HISTORISK — b/c finns inte längre):
#   /event/<eventId>?variant=a                ← RADBYTET, IN-MEMORY-fixtur (default i variant-läge)
#   /event/<eventId>?variant=b                ← STATIONS-RAILEN, fixtur (RIVEN — se § KONVERGENS-PASSET)
#   /event/<eventId>?variant=c                ← NÄSTA STEG-PANELEN, fixtur (RIVEN — se § KONVERGENS-PASSET)
#   /event/<eventId>?variant=a&data=verklig   ← samma variant, RIKTIG staging-data
#   /event/<eventId>                          ← skarpa vyn, orörd
```

**Data-kontraktet (S93 fix-våg, 2026-08-03):** fixturerna är DEFAULT i
variant-läge — `?data=verklig` växlar TILL riktig staging-data (S90-
kontraktet, PrototypeSwitcher-railens egen `?data=` null↔'verklig'-toggel).
Se § Review-fix-våg 3 nedan för varför raden ovan bytte riktning. Kontraktet
är OFÖRÄNDRAT i konvergens-passet — bara `b`/`c` slutade svara.

Växlaren (ikon-railen) finns i vyn som vanligt, monterad EN gång i
`EventDetail.tsx` (både Deltagare- och Betalningar-blocket lyssnar
oberoende på samma `?variant=`/`?data=` via `nuqs`).

## Bilderna (DIVERGENSENS, HISTORISK — filerna nedan RADERADE ur bilagan)

> **Konvergens-passet raderade `variant-b-*.png`, `variant-c-*.png`,
> `variant-a-default.png`, `variant-a-proto.png`, `variant-a-avbokade-
> oppnad.png` och `variant-a-avgifter-oppnad.png`** (git rm, samma commit
> som koden) — de visar B/C (rivna) respektive PRE-FIX-tal för variant A
> (byggd ut sedan dess till HELA strukturen). `skarp-utan-variant.png` och
> `betalningar-fraga7-oppnad.png` finns kvar (den förra RETAGEN mot den
> aktuella koden, se § KONVERGENS-PASSET). De AKTUELLA bilderna för variant A
> heter `konvergens-a-*.png`, se § KONVERGENS-PASSET § Bilderna.

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

---

## Review-fix-våg 3 (2026-08-03) — rail-gating + data-kontraktet inverterat

Två fynd ur Marcus granskning, hanterade i samma fix-våg som nattens
CI-röda (fristående av dessa två — ingen gemensam grundorsak).

### Rail-gating (skarpa vyns pixel-drift)

`npm run test:visual` fällde eventsidan: `PrototypeSwitcher` monterades i
`EventDetail.tsx` bakom ENDAST `import.meta.env.DEV` — ingen `?variant=`-
kontroll. Railen läckte därför in på den SKARPA vyns pixlar i varje DEV-
körning (inklusive visual-riggens fixtur-server, som kör DEV-läge).

**Fix:** `EventDetail.tsx` läser nu `?variant=` självständigt (samma
oberoende `useQueryState('variant')` som `Belaggning.tsx`/`Deltagare.tsx`/
`Betalningar.tsx`/`Gruppdynamik.tsx`/`Anteckningar.tsx`) och monterar
railen ENDAST när `isHallplatsVariant(variantParam)` — URL:en är ingången
till prototyp-läget, inte DEV-läget ensamt. `npm run test:visual` grönt
efteråt (mätt, se slutrapporten).

### Data-växlarens kontrakt (Marcus punkt 3 — knappen gjorde inget)

`PrototypeSwitcher`s data-knapp togglar `?data=` mellan `null` och
`'verklig'` (S90-kontraktet — fixturerna är DEFAULT i variant-läge,
knappen växlar TILL riktig data). Samtliga fem filer som läser
`?data=` (`Belaggning.tsx`, `Gruppdynamik.tsx`, `Anteckningar.tsx`,
`Deltagare.tsx`, `Betalningar.tsx`) läste i stället `dataParam === 'proto'`
— ett värde växlaren aldrig sätter. Knappen träffade därför ingenting i
NÅGON av de fem filerna, inte bara en.

**Fix:** samtliga fem invertera till `dataParam !== 'verklig'` (Deltagare/
Betalningar: samma predikat, andra lokala variabelnamn). `PrototypeSwitcher.tsx`
självt är ORÖRT (stående delad komponent, ADR-074) — bara konsumenterna
konformerade till dess redan etablerade kontrakt. § Så här kör du dem ovan
uppdaterad till den nya URL-formen.

### Bevis-snapshot (Marcus punkt 1 — "skarpa vyn saknar Markera/inline-scroll")

`skarp-seed-event-markera.png` — SKARP vy (INGEN `?variant`) av seed-eventet
`reco44UBx6GXcxwu5` (Fjärrskådning, ZZ-GRANSKNING-FIXTUR, 16 anmälningar/8
obekräftade — live-verifierat mot staging samma dag). Tagen med
prototyp-verifiering-runbookens proxy-fetch-mönster (egen dev-server på
port 5174, `page.route()` fångar `get-event`/`get-registrations` och fyller
dem med RIKTIG data hämtad server-sidan i Node — CORS kringgås, staging
rörs aldrig skrivande). Bilden visar Obekräftade-kön (röd "Obekräftade
(8)"-rad) med **Markera**-knappen intakt till höger, och kön avklippt efter
tre kort (Ingrid Rehn/Johan Dahlgren/Karin Olsson) med "Bekräftade (8)"
hopfälld direkt under — den fasta scrollhöjden (task-48 byggkrav 4) syns
alltså i skärmdumpen. 0 sidfel, 0 console-fel. Ingen `PrototypeSwitcher`-rail
i bild (bekräftar samtidigt § Rail-gating ovan — skarpa vyn är fri från
railen även i DEV).

---

## Byggkravs-våg — Variant A (S96, 2026-08-03, Marcus verbatim-kvitterade byggkrav)

Marcus valde Variant A (Radbytet). Fyra byggkrav landade på DENNA variant
ENDAST — variant B/C rörs inte (förkastade, rivs i ett senare konvergens-pass)
och Betalningar-blocket rörs inte (integrationsfrågan är grillningsmateria).
Samtliga fyra är gated på `protoVariant === 'a'` i `Deltagare.tsx` — variant
B/C:s anrop till samma delade komponenter (`HallplatsToppA`, `AvbokadeRad`)
är oförändrade och renderar EXAKT som innan denna våg.

### 1. Avbokade-rad i summeringsblocket

Den gamla `<details>`-raden ("N har avbokat", `AvbokadeRad`-komponenten)
längst ned i registret är ERSATT för variant A av en riktig `SummeringsRad`
(samma grammatik/komponent som "Bor över" — inte `HallplatsRad`, eftersom
raden bor i det SKARPA summeringsblocket, inte i prototypens egen
toppkomponent) längst ner i "Utskick"-gruppen, under "Bor över".

**Formvalet ("Avbokade — N" vs "N har avbokat"), bokfört:** `SummeringsRad`s
grammatik är ALLTID term-vänster/värde-höger (`"Bor över" · 3`, `"Väntar på
bekräftelse" · 4` osv) — aldrig en hel mening i värde-slotten. "Avbokade — N"
är den formen (term="Avbokade", värde=N); "N har avbokat" hade varit den ENDA
raden i hela blocket som bröt grammatiken med en inbäddad sats. Valt: term +
värde, exakt som alla andra rader.

Klick filtrerar registret på de avbokade (`registreringar.filter(status ===
Avbokad)`, samma källa som den gamla `protoAvbokade`-arrayen, oberoende av
flik-valet — avbokade är i övrigt bortfiltrerade ur `aktiva` och därmed ur
`visade` helt, precis som förut). Variant B/C behåller den gamla
`<details>`-raden orörd.

Bevis: `variant-a-avbokade-oppnad.png` — raden aktiv, registret visar Lisa
Fransson + Tomas Berggren (fixturens två avbokade) med "Avbokad"-märket i
metaytan, "Rensa filtret" synlig, 0 sidfel, 0 nya `/functions/v1/*`-anrop.

### 2. "Väntar på betalning" delas i Anmälningsavgifter/Slutbetalningar

`HallplatsToppA` fick en ny OPTIONAL `betalning`-prop (typ
`HallplatsBetalningsSplit`) som — när satt — ersätter mittraden med två
rader i EXAKT Betalningar-blockets grammatik: "Anmälningsavgifter — x av y
mottagna −n" / "Slutbetalningar — x mottagna −n". Variant C:s anrop till
samma komponent utelämnar propen helt och får därför BOKSTAVLIGEN samma tre
rader som innan denna våg — ingen villkorsgren i `HallplatsToppA` läser
`protoVariant`, bara närvaron av propen avgör.

Siffrorna ÅTERANVÄNDER `avgiftKlar`/`slutKlar` — två nya exporter i
`hallplats-steg-prototyp.ts` (samma predikat som `Betalningar.tsx`s privata
funktioner; den filen är oförändrad, `betalKlar` skrevs om i termer av de två
nya funktionerna i stället för sin egen inline-formel). Räknat på
`ArbetsKo`s egen `aktiva` — samma bas som `hallplatsCounts`, ingen delad
state med Betalningar-blockets egen `useQuery`-instans. Verifierat: siffrorna
är IDENTISKA med Betalningar-blockets egna ("5 av 12 mottagna −7" / "3
mottagna −9" i fixturläget; "9 av 16 mottagna −7" / "3 mottagna −13" mot
`reco44UBx6GXcxwu5`) — samma formel, oberoende beräknad.

Klick filtrerar registret på respektive saknar-mängd (`!avgiftKlar(r)` /
`!slutKlar(r)`, på `visade` — flik-valet gäller precis som övriga
hållplats-filter). Bevis: `variant-a-avgifter-oppnad.png` (RADERAD i
konvergens-passet — se § KONVERGENS-PASSET för nya bilder) — 7 kort (alla
utan mottagen avgift, inkl. Inställt/Väntelista-fallen som
Betalningar-blockets egen formel också räknar in).

**README-raden för `betalningsSplit`-fixen (saknades — konvergens-passets
hygien-punkt 7):** Marcus granskning av PR #660 (`variant-a-proto.png`) fann
att toppraden ovan och Betalningar-blockets egna räknerader visade OLIKA
"mottagna"-tal på SAMMA sida trots samma underliggande data. **Rotorsak:**
task-18.8 (2026-07-22, Betalningar-blockets ursprungsbygge) skrev
`slutMottagna` som en EGEN inline-formel i `Betalningar.tsx`
(`PaymentStatus.MOTTAGEN` strikt) — en ANNAN fysisk beräkning än
`Deltagare.tsx`s hållplats-topp, som redan (korrekt) räknade "Mottagen ELLER
Ej relevant" via den delade `slutKlar()`. En "Ej relevant"-registrering
(föreläsning, ingen slutbetalning) föll därför ur BÅDA Betalningar-blockets
tal (varken mottagen eller saknad) samtidigt som Deltagare.tsx:s topprad
räknade den som mottagen — samma sida, olika tal, av en ren
duplicerings-defekt (två ställen som RÄKNAR SAMMA SAK på olika sätt), inte
en avsiktlig skillnad. **Fixen:** `betalningsSplit()` (`hallplats-steg-
prototyp.ts`) är NU den enda fysiska beräkningen — båda ställena anropar
den, så drift mellan dem är strukturellt omöjligt (kräver att ändra på ETT
ställe för att ändra för BÅDA), inte bara konventionellt undvikt. Fullt
rotorsaksresonemang: funktionens eget docblock i
`src/components/events/detail/hallplats-steg-prototyp.ts`.

### 3. "Utskick"-rubriken borttagen (variant A)

`<p>Utskick</p>` renderas nu villkorat på `protoVariant !== 'a'` — texten är
borta för variant A, `border-t`-kanten på wrappern är OFÖRÄNDRAD (byggkravet
gällde texten, "ser hemskt ut designmässigt", inte avdelar-linjen). Variant
B/C behåller rubriken.

### 4. Klara-radens höjd

**Rotorsak funnen och fixad:** `HallplatsRad`s `tonKlass` satte `font-medium`
ENDAST tillsammans med färgen (`ton === 'error' | 'warning'`) — "Klara" (och
nu även de nya Anmälningsavgifter/Slutbetalningar-raderna, `ton` default
`'neutral'`) fick därför font-weight 400 på värdet medan "Väntar på
bekräftelse"/"Väntar på betalning" fick 500. Fixat: `font-medium` är nu
OVILLKORLIG på värde-spannet; `tonKlass` bär bara färgen. Alla värden i
rad-familjen har nu identisk font-vikt, oavsett brådska-ton — en strukturell
fix (komponentens EGEN klasslogik), inte en höjd-hack.

**Öppet bokfört restfynd (INTE fixat, utanför scope):** en separat, ~1 px
sub-pixel-skillnad i `getBoundingClientRect()`-höjd kvarstår mellan sista
raden i EN `divide-y`-stack och raderna ovanför — men den är POSITIONS-bunden,
inte innehålls-bunden (flyttas "Klara" till första platsen i stacken flyttar
1px-avvikelsen till den nya sista raden i stället, mätt med Playwright
DOM-manipulation) och existerar IDENTISKT i den helt orörda, redan skarpa
`Betalningar.tsx`s egen `EtikettVardeRad`-`<dl>` (mätt mot `reco44UBx6GXcxwu5`:
"Anmälningsavgifter" 49 px mot "Slutbetalningar" 48 px, exakt samma mönster).
Det är alltså en app-bred, förbefintlig sub-pixel-renderingsartefakt — inte
en hållplats-prototyp-bugg — och att jaga bort den hade krävt antingen en
explicit `min-height` (exakt den höjd-hack byggkravet uttryckligen förbjuder)
eller att röra `Betalningar.tsx` (förbjudet av uppdraget). Kvarstår öppet,
inte tystat.

### Verifiering (samma metod, samma seed-event)

Samma Playwright-proxy-metod som review-fix-vågorna ovan (`page.route()`
fångar `get-event`/`get-registrations` med RIKTIG server-hämtad data mot
`reco44UBx6GXcxwu5`). `variant-a-proto.png`/`variant-a-default.png` omtagna;
`0` mutations-anrop mätt i samtliga fyra körningar (proto, default,
avbokade-öppnad, avgifter-öppnad) genom att logga alla icke-GET
`/functions/v1/*`-anrop per sida. `npm run test:visual`: 94/94 (den skarpa
vyn, som inte läser `?variant=`, opåverkad).

---

## KONVERGENS-PASSET (S93 Del 3, 2026-08-03) — variant A byggs ut till HELA strukturen

Marcus 8/8-kvitterade beslut (Del 3 § Grillad samsyn, se
`tasks/sessions/archive/2026-08/2026-08-02-session-93.md` Del 3 + Tillägget — kravkällan för
detta pass) tar variant A från "toppens tre rader" till hela den grillade
eventsida-strukturen. **Allt uttrycks i BEFINTLIGT formspråk** (Marcus-krav,
Del 3 beslut 3): inga nya tokens, ingen ny radgrammatik, inga nya
§19-intent-kombinationer — enbart återanvändning av redan etablerade
komponenter/klasser i nya monteringspunkter.

### 1. Betalningar-toppblocket försvinner — arbetsytan flyttar in

`Betalningar({event})` (`Betalningar.tsx`) returnerar nu `null` när
`protoAktiv` (variant A) — blocket försvinner HELT från sidan i variant-läge
(`EventDetail.tsx`s ovillkorliga `<Betalningar event={event} />` renderar
inget). Dess "Öppna detaljer"-arbetsyta (flikarna Saknar/Klara, deadline-
badgen, `BetalningsPersonRad` med kryss/notering/påminn/historik) är
INTE omskriven — `BetalningsDetaljer` och `DetaljRad` exporterades (var
oexporterade privata funktioner) och monteras OFÖRÄNDRADE i `Deltagare.tsx`s
`ArbetsKo`, fällbara under det enade registret, bakom samma K27-form
(`DetaljRad`-disclosure). Deadline-badgen renderas INUTI `BetalningsDetaljer`
och följer därför automatiskt med utan extra kod. `BetalningsInnehall`
(räknerad-`<dl>` + toggle-wrapper) är KVAR i `Betalningar.tsx`, oförändrad,
men bara skarpa vyn når den nu (variant A:s motsvarande räknerader kommer i
stället från `HallplatsToppA`, se punkt 2 nedan — de två `<dl>`-raderna hade
annars dubblats).

**Öppet bokfört, lågrisk-kvarleva:** `BetalningsInnehall`s egna
`protoAktiv`/`protoDataMode`-grenar (påminnelse-räknaren, "fråga 7"-pillarna)
är nu strukturellt ONÅBARA via skarpa `Betalningar()`-anropet (som alltid
skickar `protoAktiv=false` sedan `if (protoAktiv) return null` infördes) —
de rördes INTE, eftersom `BetalningsInnehall` inte är vad som flyttades in
(bara `BetalningsDetaljer`/`DetaljRad` är). Städning av den vestigiala koden
är avsiktligt UTANFÖR detta pass (samma "rör bara det som byggs om"-princip
som resten av byggkravs-historiken ovan).

### 2. Registret blir EN lista (Del 3 beslut 2/3)

"Obekräftade (N)"-rubriken (varningstriangel) och "Bekräftade (N)"-
dropdownen (`GruppRubrik`-parets fällbara arkiv) är RIVNA för variant A.
I deras ställe: en enda `DeltagarListan` sorterad på FYRA steg-hinkar
(`registerOrdning()`, ny export i `hallplats-steg-prototyp.ts`) — väntar på
bekräftelse → avgift-saknare → slut-saknare → klara (installt/
till-väntelista sist, öppet designval, se funktionens docblock) — och INOM
varje hink i anmälningsordning (äldst-registrerad-först, samma FIFO-semantik
som gamla Obekräftade-kön hade, nu tillämpad enhetligt i stället för bara på
kön). Steg-märkena (`HallplatsMarke`, befintlig, oförändrad) ÄR
grupperingen — inga textrubriker.

Inline-scrollen (`rullande`-propen på `DeltagarListan`, byggkrav 4:s
`max-h-[25.5rem]`) är ÅTERANVÄND OFÖRÄNDRAD på den enade listan, inte en ny
klipphöjd — "behåll registrets nuvarande scroll-beteende" (uppdraget) tolkat
bokstavligt.

Skarpa vyn (`protoVariant == null`) och dess Obekräftade/Bekräftade-gren är
STRUKTURELLT ORÖRDA — variant A:s enade lista är en helt ny gren i
`ArbetsKo`s render, inte en ombyggnad av den gamla.

**Genomresa av EN pre-existing bugg, fixad i förbigående:** när en
`hallplatsFilter`/`protoBetalningsFilter`/`protoAvbokadeAktiv` var det som
gjorde `traffar` icke-null (inte `filter`), gjorde den GAMLA "Rensa
filtret"-knappen (`onClick={() => setFilter(null)}`) ingenting — den nollade
bara `filter`, aldrig de tre andra. Bugen var alltid latent men harmlös för
skarpa vyn (de tre andra state-variablerna är alltid `null`/`false` där).
Variant A:s EGNA "Rensa filtret" (`rensaAllaFilterA`) nollar alla fyra
explicit; den gamla knappen lämnas OFÖRÄNDRAD (fortfarande korrekt för sitt
enda kvarvarande användningsfall, skarpa vyn).

### 3. Markera-läget verkar över visad lista (Del 3 beslut 3)

`useMarkeringsLage`s kandidatlista är nu DYNAMISK för variant A: den
filtrerade vyn (`traffar`) när ett steg-räknar-/logistik-filter är valt,
annars HELA den enade sorterade listan — "Lotta filtrerar först via en
steg-räknare, markerar hon inom filtret" (uppdraget), men Markera är INTE
låst till att kräva ett filter (fungerar över hela listan också). Skarpa
vyns kandidatlista (`obekraftadeIds`, Obekräftade-kön) är OFÖRÄNDRAD.

Batch-barens primärknapp byter text till **"Åtgärder"** (Del 3 beslut 5) för
variant A — `MarkeringsBatchBar` fick en ny `valdaNamn?: string[]`-prop:
satt ⇒ "Åtgärder"-knappen ersätter "Bekräfta"-`DialogTrigger`n helt (ingen
kontrollfråga, ingen `useConfirmAll`-mutation — det gamla bekräfta-flödet är
RIVET ur variant-läget, inte bara dolt: utskicket hör hemma på
åtgärds-sidan, byggs i ett eget senare pass per Del 3 beslut 1/4). Klick
öppnar en inline-platshållare — litet kort: "Åtgärds-sidan — eget
prototyp-pass; N mottagare medtagna" + de valda namnen i visningsordning —
INTE en riktig sida. Skarpa vyns `onBekrafta`-väg (samma komponent, samma
fil) är BYTE-IDENTISK: `valdaNamn` är `undefined` där, `onBekrafta` styr
grenvalet.

**Namnkollision, öppet bokförd (inte en bugg, men värd Marcus uppmärksamhet):**
sidan har sedan tidigare (task-18.3) en EGEN "Åtgärder"-rubricerad grupp
längst upp (statiska länkar: "Lägg till manuell anmälan" · "Skicka
bekräftelsemail till obekräftade" · … · "Skriv ut denna detaljsida" — se
`Atgarder.tsx`, orört av detta pass). Batch-barens nya knapp bär SAMMA ord i
en annan betydelse (en handlings-yta för det MARKERADE urvalet, inte en
statisk länklista). Uppdraget specade ordet explicit (Del 3 beslut 5) och
det följdes bokstavligt — men två "Åtgärder"-ytor på samma sida är värt att
väga in när den riktiga åtgärds-sidan designas.

### 4. Auto-kryssen riven (Del 3 beslut 2-rivning 1)

`AutoKryss` (task-18.6, event-info-radens auto-utskicks-checkbox) monteras
INTE längre i variant A:s eventinfo-rad-signal — slotten visar ENDAST
"Dags att skicka"-badgen när den är tänd, annars tomt (reserverad höjd,
`signalSlot` oförändrad). Skarpa vyns motsvarande rad (en helt annan JSX-
gren, `protoVariant == null`) behåller `AutoKryss`-fallbacken OFÖRÄNDRAD.

### 5. Variant B/C rivna — ensam-variant-formen

`HallplatsToppB`, `HallplatsHarnastPanel`, `STATION_LABEL`, `STEG_ORDNING`
och den gamla `<details>`-formen `AvbokadeRad` är BORTA ur
`DeltagareHallplatsPrototyp.tsx`. `HallplatsVariant`-typen i
`hallplats-steg-prototyp.ts` är smalnad till `'a'` (var `'a' | 'b' | 'c'`);
`isHallplatsVariant()` känner bara igen `'a'`. `EventDetail.tsx`s
`HALLPLATS_PROTO_VARIANTS`-array bär nu EN post (`key: 'a'`, oförändrad
nyckel — "vinnaren behåller sin nyckel", Marcus beslut) — `steg` bumpat
1→2 och `stegLabel` `'Divergens'`→`'Konvergens'` (S72-identitetsmodellen:
STEG = konvergens-axeln). `PrototypeSwitcher.tsx` självt är ORÖRT (stående
komponent, ADR-074) — dess egen `endaVarianten`-gren (prototyp-ikon i
stället för bokstavsknapp) triggas automatiskt av array-längden 1, ingen
kod i den filen ändrad.

En stale `?variant=b`/`?variant=c`-URL degraderar numera till skarpa vyn
(både railen och `protoVariant` läser `isHallplatsVariant`, som nu är
`false` för dem) — inget krasch, ingen halvbyggd yta.

## Bilderna — KONVERGENS-PASSET (AKTUELLA, `konvergens-a-*.png`)

Tagna med samma metod som review-fix-vågorna (fristående Node-skript,
`chromium.launch()` — bypassar `playwright.config.ts` helt, se
`docs/reference/prototyp-verifiering-runbook.md`), mot en EGEN dev-server på
port **5188** i DENNA worktree (inte 5173 — annan cwd än huvudträdet).
`get-event`/`get-registrations`/`get-event-notes` hämtades RIKTIGT
server-sidan (Node, ingen CORS-policy) mot det levande seed-eventet
`reco44UBx6GXcxwu5` (ZZ-GRANSKNING-FIXTUR, Event-3905 — existens + data
verifierad LIVE via Airtable MCP 2026-08-03 innan skriptet skrevs) och
matades in via `page.route()`. Mutations-endpoints intercepterades ALDRIG.

- `konvergens-a-fixtur.png` — default-läge (`?variant=a`, fixturdata):
  Betalningar-blocket BORTA, HallplatsToppA:s fyra rader, unified register
  (Anna Ek/Erik Larsson väntar på bekräftelse, Maria Holm med
  "Manuellt tillagd"), "Öppna detaljer" stängd längst ner.
- `konvergens-a-markera-atgarder.png` — Markera-läget aktivt, Anna Ek +
  Erik Larsson valda (gröna kort), "Åtgärder"-knappen klickad: platshållaren
  visar "Åtgärds-sidan — eget prototyp-pass; 2 mottagare medtagna" + båda
  namnen.
- `konvergens-a-avgiftsfilter.png` — Anmälningsavgifter-filtret aktivt:
  flat lista utan sektionsrubriker, "Rensa filtret" synlig, Markera
  tillgänglig även i filtrerat läge.
- `konvergens-a-avbokade-oppnad.png` — Avbokade-filtret aktivt: Lisa
  Fransson + Tomas Berggren, "Avbokad"-märket på båda.
- `konvergens-a-oppna-detaljer.png` — den inflyttade arbetsytan öppen:
  "Saknar betalning (9)/Klara (3)"-flikar, "Deadline passerad · 27 juli"-
  badgen, "Förhandsvisning (proto)"-texten, per-person-rader med
  Obekräftad-/kategori-pillar (fråga 7, oförändrad) och kryss/notering/
  påminn SYNLIGT inaktiverade.
- `konvergens-a-verklig.png` — `?variant=a&data=verklig` mot
  `reco44UBx6GXcxwu5`: RIKTIGA tal ("Anmälningsavgifter 9 av 16 mottagna
  −7" / "Slutbetalningar 3 mottagna −13" / "Väntar på bekräftelse 8") —
  identiska med basens egna fält (`Antal mottagna anmälningsavgifter: 9`,
  `Antal mottagna slutbetalningar: 3`, `Antal slutbetalning saknas: 13`,
  verifierat via Airtable MCP samma dag) — tal-koherensen håller mot
  källan, inte bara internt mellan komponenterna.
- `skarp-utan-variant.png` — RETAGEN mot den aktuella koden (samma fil,
  ersätter divergensens version): `PrototypeSwitcher`-rail count = 0,
  Betalningar-blocket NÄRVARANDE (skarp vy orörd).

### Verifiering (AC-lista, konvergens-passet)

- **`npm run typecheck`:** 0 fel.
- **`npx @biomejs/biome check .`:** 0 fel/varningar i rörda filer (6
  varningar + 27 infos kvarstår, samtliga i ORÖRDA filer — `base.css`,
  `tests/support/test-bas.ts`, `tests/api/*.staging.test.ts` — verifierat
  identiska före/efter denna gren).
- **`npm run build`:** grönt.
- **`npm run test:api`:** 450 passed (api-pure + api-staging; en första
  körning blockerades av `MM_STAGING_PREFLIGHT` medan `post-merge.yml`
  (run 30826680395) höll staging — väntade ut den, retry grönt).
- **`npm run test:visual` — DUBBEL mätning, inte antagen:** `git stash`
  (ren `origin/main`-kod) → `test:visual` → 94/94, föder `-darwin.png`-
  baselines för PRISTINE kod → `git stash pop` (denna grens kod) →
  `test:visual` igen → **94/94, EXIT 0** mot SAMMA baselines. Skarpa vyns
  pixlar är alltså bevisat BYTE-IDENTISKA före/efter, inte bara resonerat
  fram (de lokala `-darwin.png`-filerna är `.gitignore`:ade, `git status`
  visar noll ändringar i `__screenshots__/`).
- **Interceptions-passet (0 mutationer, fixtur-läge):** Markera → 2 valda →
  Åtgärder → platshållare-text verifierad ordagrant → Avbryt →
  Anmälningsavgifter-filter → Avbokade-filter → Öppna detaljer →
  betalnings-kryssruta (`isDisabled(): true`, klick timeoutar efter 30 s —
  Playwright vägrar klicka ett disabled element) → noteringsfält
  (`isDisabled(): true`, `fill()` kastar `TimeoutError`) → Påminn (`0`
  `mailto:`-länkar funna, `aria-disabled="true"`-span i stället). **Sneda
  nätverksanrop under HELA fixtur-passet: 16, samtliga `GET
  .../get-events`** (den separata event-LISTANS bakgrundsläsning, en
  pre-existing, ogated `useQuery` som körs oavsett `?variant=` — se
  `EventValjare`/`useForberedEventDetalj` — INTE en mutation, INTE en
  regression: samma bakgrundsläsning skulle ha triggat identiskt före
  denna gren). **Noll POST/PATCH till `update-record`/`update-event`/
  `send-registration-confirmation`/`create-event-note` under hela passet.**
- **Tal-koherens:** `konvergens-a-verklig.png`s tre räknerader matchar
  Eventplanering-radens egna fält exakt (se § Bilderna ovan) —
  cross-verifierat mot Airtable MCP, inte bara mot sig själv.

## FACIT-LÅST (S93, 2026-08-06) — vågorna 10–20

**Marcus lås:** *"Jag är nöjd. Lås som facit."* (2026-08-06). Elva
iterationsvågor efter konvergens-passet ovan; nedan är vad som faktiskt
ändrades och varför, som spec-underlag för `/to-prd` × 3.

### Betalningsytan — från formulär till läsyta (vågorna 10–17)

Ingången var Marcus dom över personblocken under "Öppna detaljer":
*"innehållet som det behöver ha, men designmässigt är det skit"*, med
anmälnings-detaljsidan utpekad som förebild. Grammatiken som ärvdes är
`DetaljGrupp`/`EtikettVardeRad`: rubrik utanför, kort under, etikett dämpad
vänster, värde primärt höger.

| # | Ändring | Rivningens skäl |
|---|---|---|
| 10 | Personen fick en **kortyta** (`bg-surface`), namn + status utanför | Förut bar bara utskicks-lådan inneslutning — ytans minst viktiga innehåll |
| 10 | **18 tomma `<Input>` rivna** | Ytan är för ÖVERBLICK; editering hör till åtgärds-sidan (Marcus) |
| 10 | **Rött lämnade fältetiketten** | Fliken heter redan "Saknar betalning (9)" — rött per rad upprepade den |
| 11 | Noteringen fick **egen rad, full bredd** | Höger-slotten var för smal för hur Lotta faktiskt skriver |
| 11 | Utskicken blev **`Tidslinje`** | En logg är ingen värde-slot; fyra utskick i en `dd` blir en klump utan tidsaxel |
| 12 | **Luft** runt noteringen: `pt-4` + `leading-relaxed` + `pb-1` | Symmetriskt mot avdelaren (16/17 px, DOM-mätt) |
| 12 | **"Utskick"-rubriken riven**, luften kvar (`pt-8`) | Ordet upprepade noderna under det, med en fjärde textvikt |
| 13 | **Höger-slotten helt riven** ("Saknas"/"Mottagen") | Sa samma sak som krysset — i Saknar-fliken tre gånger om |
| 14 | **Mottagen-pill med datum** (prototyp-lokalt) | Datumet är äkta information krysset inte kan bära |
| 15–16 | **Pill-skalan namngiven**, kontur prövad och riven | Se `T130` |
| 17 | **Hover på "Öppna detaljer"** | Raden var klickbar utan att se klickbar ut |

### Gruppdynamiken (vågorna 18–19)

| # | Ändring | Skäl |
|---|---|---|
| 18 | Fixturen fick **motiveringar, badges och `T16`-divergensen** | Två av tre ytor renderade tomt — blocket gick inte att granska |
| 19 | **Knappformen** härmar Deltagares (36 px platta i `py-2`-förälder) | Hover-plattan var 48 px = hela radhöjden, kant till kant |
| 19 | Personkorten fick **`PersonMiniKort`-formen** | Marcus: *"vill jag ska se ut som dem på anmälan-detaljsidan"* |
| 19 | **"Inga tidigare event"-raden riven** | Upprepade bucketens namn tio gånger |

### Tvärs över (våg 20)

- **Sju proto-texter rivna** (Marcus räknade tre; ordern var "all"). De fyra
  övriga: `Deltagare` (Bor över), `Betalningar` (arbetsytans banderoll + två
  `title`-tooltips). `protoDataMode` styr fortfarande datakällan och håller
  kontrollerna inaktiverade — bara förklaringen är borta.
- **Anteckningscomposern 64 → 112 px** via `size="md"` (primitivens eget nästa
  steg, inte ett handrullat `min-h`). Byter också `text-small` → `text-body`.

### Räckvidd — VIKTIGT för nästa pass

**Vågorna 10–17 är prototyp-grenade** (`protoAktiv`); skarpa betalningsvyn är
orörd. **Vågorna 19–20 är SKARP kod** — `Gruppdynamik` har ingen variant-gren
för form, och proto-texterna satt i delad kod. De syns alltså utan `?variant=a`.

### Bilderna — FACIT (`facit-*.png`)

**Den auktoritativa deklarationen är [`facit.json`](facit.json), inte denna
prosa.** Manifestet är maskinläsbart och grindat av `scripts/check-facit.sh`
(ADR-102): odeklarerad facit-bild, saknad bild eller rivet prototyp-substrat
före Marcus godkännande gör trädet rött. Texten nedan förklarar bilderna;
manifestet avgör vilka som ÄR facit — och deklarerar uttryckligen att
åtgärds-ytan saknar låst facit-bild, så att frånvaron inte kan förväxlas med
ett förbiseende.

Tagna via chrome-devtools MCP mot dev-servern på **5173** i denna worktree,
`?variant=a&data=proto` (in-memory-fixturer — ingen API-interception behövdes,
till skillnad från konvergens-passets Node-skript). 430 px vyport.
Dev-overlays (TanStack-badgen, prototyp-växlaren) är SYNLIGA i bilderna och
medvetet inte bortredigerade: ett försök att dölja dem kollapsade layouten
(farförälder-gissningen träffade `main`), och en facitbild ska visa vad som
faktiskt renderades.

- `facit-betalningar-arbetsytan.png` — Saknar betalning-fliken: personkort med
  `bg-surface`, `Obekräftad`-badge i `sm`, tom utskickslogg med sin nya text,
  Sara Nilssons långa notering över fyra rader.
- `facit-betalningar-maxat-kort.png` — Peter Lund, taket för vad en person kan
  bära: två noteringar + fyra utskick i `Tidslinje`-formen med klockslag.
- `facit-gruppdynamik.png` — tre bucketar, `PersonMiniKort`-formade kort, och
  **`T16`-divergensen synlig**: Gustav Wik i "3+ tidigare event" med badgen
  `Ej påbörjat` (RIM-3-blindheten), plus två motiveringskort varav ett med
  `Läs mer`.
- `facit-anteckningar.png` — composern i sitt nya `md`-steg (112 px, mätt).

### Verifiering (facit-låsningen)

- `npm run typecheck` — 0 fel.
- `npx @biomejs/biome check` — 0 fel i rörda filer.
- `npm run build` — grön.
- `npm run test:api` — **458 passed**.
- `check-thread-index.sh` + `check-lifecycle.sh` — OK (`T130`, mintad som
  `T127`).
- **Grep-verifierat:** `Förhandsvisning (proto)` 0 träffar i `src/`, och
  0 träffar i `tests/` FÖRE rivningen (ingen svit hängde på texten).
- **EJ KÖRT:** `npm run test:visual`. Konvergens-passet körde en dubbel
  stash-mätning för att bevisa att skarpa vyn var byte-identisk. Den mätningen
  gäller INTE här — vågorna 19–20 ÄNDRAR skarp kod med avsikt, så baselines
  förväntas skilja. Omtagning av visuella baselines är en post för nästa pass.
