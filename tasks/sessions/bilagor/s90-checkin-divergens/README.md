# Check-in vid dörren — DIVERGENS-passet (S90, 2026-07-26)

> **Frågan som prototypen besvarar (throwaway-kontraktet klausul i):**
>
> **"Hur ska check-in-sidan fungera när Lotta står vid dörren och deltagarna
> kommer in?"**

Tre strukturellt olika svar, byggda på den befintliga routen
`/event/$eventId/narvaro` med `?variant=a|b|c` (prototyp-skillens underform A:
riktig route, riktig auth, riktig datahämtning genom adaptern — bara det
renderade underträdet byts). **Marcus väljer EN.**

Koden är kastbar och DEV-grindad: `src/components/events/CheckinPrototyp.tsx`
plus en gren i routen. **Ingen mutation är inkopplad** — alla statusändringar
lever i minnet och försvinner vid omladdning. Ingen `operationKey` mot
`Deltaganden` har registrerats, varken mot staging eller prod.

## Så här kör du dem

```bash
npm run dev
# och sedan i webbläsaren:
#   /event/<eventId>/narvaro?variant=a   ← REGISTRET
#   /event/<eventId>/narvaro?variant=b   ← LISTA-FÖRST
#   /event/<eventId>/narvaro?variant=c   ← SÖK-FÖRST
#   /event/<eventId>/narvaro             ← skarpa vyn, orörd
```

Växlaren (ikon-railen) finns i vyn som vanligt. **Bilderna nedan är tagna med
mockad data** — 20 anmälda på ett tvådagars-event, blandade statusar, två
mycket långa namn, två utan e-post, två avbokade. Dörren handlar om VOLYM;
en lista med tre personer bevisar ingenting.

---

## Det som är GEMENSAMT (divergensen gäller arrangemang, inte grammatik)

Alla tre ser ut som samma app och delar samma byggstenar — de är oense om
FORM, inte om språk:

- Kortet/raden som klickyta, kanten finns i båda lägena så geometrin aldrig
  hoppar (task-48:s `MarkerbartKort`-teknik).
- Incheckad bärs av **glyf + text**, aldrig av grönt ensamt (WCAG 1.4.1).
- Räknaren "X av Y incheckade" med **breddlås** (osynlig platshållare i
  maxform + `tabular-nums`) — siffran flyttar sig aldrig under fingret.
- Statusannonsering enligt WCAG 4.1.3 (`sr-only role="status"` i A och B,
  `alertScreenReader` i C).
- Inga hårdkodade färger — allt via tokens. Inga länkar inuti klickytorna
  (L303). §19 följd: incheckning skriver bara internt ⇒ `primary`, aldrig
  `success` (som är reserverat för handlingar som når utomstående).
- **Klient-joinen** `Deltagande.anmalanId → Registration.id` i alla tre.
  Utan den visar dörren **avbokade personer som incheckningsbara** — ingen
  automation raderar deltagandet vid avbokning. Bilderna visar noten
  "2 avbokade anmälningar visas inte i listan".

---

## VARIANT A — REGISTRET

`a-mobil.png` · `a-mobil-hela.png` · `a-desktop.png` ·
`a-mobil-markeringslage.png`

Person × session som **rutnät**, i LMS-registerklassen (Blackboard,
ClassDojo). Alla sex statusvärdena tillgängliga per cell. Massmarkeringen bor
här: "Markera alla närvarande i **Dag 1** / **Dag 2**" (bakom kontrollfråga)
plus **task-48:s markera-läge** med batch-bar — markera N personer, välj en
gemensam status, sätt. Blackboards exakta arbetsordning: sätt hela kolumnen,
rätta sedan avvikelserna.

**Optimerar för:** fullständighet och rättning. Hela sanningen syns på en
gång — vem som var frånvarande, försenad, avbröt eller deltog online, i
vilken session. Det är den enda av de tre där `Närvaropoäng`-kedjan kan
korrigeras fullt ut.

**Offrar:** dörren. Ingen av de fem undersökta event-check-in-produkterna
(Eventbrite, Luma, Cvent, Splash, Sched) har massmarkering vid entrén, och
premissen "de flesta har samma tillstånd" är sann EFTER eventet och falsk
under insläppet — då är ingen ännu incheckad. Vidare: en rullgardin per cell
är två gester per person, tabellen kräver precision i pekandet, och på 430 px
kapas långa namn ("Carina Lindqvist-…"). I markera-läget kapas de hårt
("Anneli …"). Det är registrets ärliga mobilkostnad.

**Vinner när:** eventet är slut och Lotta sitter vid köksbordet med datorn och
ska få dagen rätt i basen. Också när något gick fel vid dörren och behöver
lagas.

**Viktigt:** A är INTE ett svagt dörr-förslag — den är ett starkt förslag på
en ANNAN yta. Väljer du A som dörr-lösning väljer du bort dörren.

---

## VARIANT B — LISTA-FÖRST

`b-mobil.png` · `b-mobil-hela.png` · `b-desktop.png` ·
`b-mobil-halvvags.png` (+ `-hela`) · `b-mobil-allt-incheckat.png` (+ `-hela`)

Dörren som en lista man bläddrar i. Alla 18 anmälda i vald session, i
bokstavsordning som ALDRIG sorteras om under fingret. **En gest per rad**:
tryck = incheckad, tryck igen = ångrat. Binärt `Ej avstämt ↔ Närvarande`.
Räknaren är stor och sitter överst med en framstegsstapel — den är listans
navigationsinstrument ("hur långt har jag kommit?"). Sökfältet finns men är
sekundärt: kompakt, under räknaren, utan autofokus.

**Optimerar för:** överblick och tempo när kön kommer i klump. Man ser vilka
som saknas utan att skriva ett tecken, och tre–fem personer kan checkas in i
rad utan att lyfta blicken. Ångra är trivialt: raden står kvar där den var
och bär texten "tryck för att ångra".

**Offrar:** uppslagning. Med 18 personer fungerar bläddring; med 88 (MK-eventet
har 87 anmälda) blir det rullande. Toppen kostar också: rubrik, eventnamn,
sessionsval, räknare, sökfält och avbokad-not tar drygt halva skärmen innan
första raden — bara ~3,5 rader syns ovanför vecket på 430 px.

**Vinner när:** grupperna är små till medelstora (upp till ~30), Lotta känner
igen namnen, och flera kommer samtidigt. Också när nätet krånglar och hon vill
se hela listan utan att lita på en sökning.

---

## VARIANT C — SÖK-FÖRST

`c-mobil.png` · `c-mobil-hela.png` · `c-desktop.png` ·
`c-mobil-sok-traff.png` · `c-mobil-sok-tomt.png` ·
`c-mobil-halvvags.png` (+ `-hela`)

Dörren som en **sökruta**. Autofokuserat 48 px-fält klistrat i toppen, med
räknaren i samma block; typeahead filtrerar över namn och e-post medan man
skriver; träffarna är luftiga rader (64 px) som checkas in direkt.
Escape rensar. Vid tom sökning ligger hela listan under som sekundär yta —
C är alltså aldrig sämre än B, den börjar bara någon annanstans.

**Den strukturella konsekvensen:** sökningen **nollställs efter en
incheckning** så att nästa namn kan skrivas direkt. Då lämnar posten skärmen
— och därför MÅSTE ångra bo någon annanstans än på posten. Det gör den
kvarstående **"Senast incheckade"-panelen** (klistrad i tumzonen, de tre
senaste med var sin Ångra-knapp) till C:s bärande konstruktion, inte en
dekoration. Det är Lumas Express-mönster, och det är också skälet till att
inget toast-lager behövs (T96 orört).

**Optimerar för:** en person i taget, snabbt, oavsett listans längd. Skalar
identiskt för 18 och 88 deltagare. "Anna Ek" hittas på tre tecken.

**Offrar:** överblicken. Vill Lotta veta vilka som ännu inte kommit måste hon
rulla ned i listan under sökfältet — informationen finns, men den är inte det
första hon möter. Sökningen kräver också att hon uppfattar namnet rätt
(vilket den fungerande e-postsökningen mildrar). Och den auto-rensande
sökningen är ett aktivt val som kan kännas abrupt — se öppna frågor.

**Vinner när:** kön rör sig, listan är lång, och varje person ska bli klar på
under fem sekunder. Det är det belagda dörr-mönstret hos alla fem
undersökta produkter (skanna → söka → bläddra; skanna-grenen är inte byggbar
hos oss, vi har ingen biljett-QR).

---

## Bildregistret

| Fil | Visar |
|---|---|
| `a-mobil.png` / `a-mobil-hela.png` / `a-desktop.png` | Registret i utgångsläge |
| `a-mobil-markeringslage.png` | Markera-läget aktivt, två markerade, batch-bar |
| `b-mobil.png` / `b-mobil-hela.png` / `b-desktop.png` | Listan i utgångsläge (3 av 18) |
| `b-mobil-halvvags.png` (+ `-hela`) | 10 av 18 incheckade |
| `b-mobil-allt-incheckat.png` (+ `-hela`) | 18 av 18 — måldraget |
| `c-mobil.png` / `c-mobil-hela.png` / `c-desktop.png` | Sök-först i utgångsläge, fältet fokuserat |
| `c-mobil-sok-traff.png` | Sökning "wahl" → 1 träff |
| `c-mobil-sok-tomt.png` | Sökning utan träff — tomläget |
| `c-mobil-halvvags.png` (+ `-hela`) | 10 av 18, senast-panelen med tre Ångra |

Mobil = 430 px (Lottas faktiska arbetsläge), desktop = 1440 px. Appens
innehållsyta är låst till 600 px, så desktop är samma kolumn med mer luft —
inte en annan layout. Dev-överlägget (devtools + prototyp-railen) är dolt i
bilderna; identiteten bärs av filnamnet.

---

## MIN REKOMMENDATION: **C — sök-först**, med två saker från B

**Varför C.**

1. **Den är den enda som skalar med verkligheten.** MK-eventet har 87 anmälda
   och 218 deltaganden-rader. B:s bläddring fungerar i bilderna för att jag
   mockade 18 personer; vid 88 är den en rullningsövning i dörren. C beter sig
   likadant vid 18 och 88.
2. **Uppslagning slår bläddring — belagt, inte tyckt.** Alla fem undersökta
   produkter lägger en uppslagningsyta ovanpå listan; ingen levererar enbart
   en lista. Personen framför dig är en KÄND post som ska hittas, inte
   upptäckas.
3. **Den löser ångra-frågan strukturellt i stället för att hoppas på den.**
   C:s kvarstående panel är alltid synlig i tumzonen, oavsett var i listan man
   är. B:s ångra-på-posten fungerar bara så länge posten syns — och slutar
   fungera i samma sekund man börjar söka, vilket B ändå tillåter.
4. **Den är billigast att göra rätt i a11y-hänseende.** Fokus bor i sökfältet
   hela tiden; det finns ingen fokusförlust att jaga när listan filtreras om
   (dörrens skarpaste fokusrisk).

**Vad jag skulle ta med från B in i den skarpa skivan (byggkrav, inte ny
prototyp-iteration):**

- **Framstegsstapeln + "N kvar"** ovanför listan. C:s räknare är korrekt men
  torr; B:s stapel svarar på "är vi snart klara?" med en blick, och det är en
  fråga Lotta faktiskt ställer vid dörren.
- **"Tryck för att ångra"-texten på raden.** C har den redan på raderna, men
  den bör överleva även när panelen finns — dubbel väg tillbaka kostar
  ingenting och den ena fungerar när den andra inte syns.

**Och A ska byggas — men inte här.** Registret hör hemma i `Narvaro.tsx` på
eventsidan (som redan ÄR ett register, i dag ren läsning). Det är samma
insikt från två håll: massmarkering är register-arbete, dörren är
per-person-arbete. Att bygga A som check-in-sidan vore att bygga fel yta;
att kasta A vore att kasta bort halva närvaro-problemet.

**Om du väljer B ändå** är det ett legitimt val och inte ett misstag: det är
rätt om du bedömer att Lottas grupper i praktiken är 15–25 personer och att
överblicken ("vem saknas?") är viktigare än hastigheten per person. Då ska
sökfältet ändå flyttas ned i tumzonen och bli klistrat — som det står nu är
det nåbart men inte gripbart med en tumme.

---

## Vad som SAKNADES i datat (och vad prototypen fick kompensera för)

1. **Ingen väg att skriva.** `field-allowlists.ts` har 13 operationer och noll
   mot `Deltaganden`. `updateAttendance()` finns i adapter-kontraktet men har
   noll callers och skulle fällas på okänd `operationKey`. Prototypen skriver
   därför ingenting alls.
2. **`get-attendance` vet inte om anmälan är avbokad** — och ingen automation
   raderar deltagandet vid avbokning. Löst med klient-join mot
   `get-registrations`. Priset är att dörren gör TVÅ anrop, i en klass där
   TASK-14 redan mätt ~31 s på det ena.
3. **`get-attendance` saknar e-post.** Kom också ur joinen. Utan den kan två
   "Anna Andersson" inte skiljas åt vid dörren.
4. **Sessionsstrukturen finns inte i app-shapen.** Basen har inget fält som
   binder `Session` till ett datum; `Eventformat.Format` bär mallen men når
   aldrig `Event`-modellen. Prototypen härleder därför en default (Dag 2 om
   dagens datum = slutdatum, annars första sessionen), **visar den alltid
   explicit** och gör den överstyrbar. Att härleda tyst vore en tyst felkälla:
   `Närvaropoäng` räknar Dag 1 och Föreläsning mot kurshistoriken men INTE
   Dag 2 — fel session ger fel historik utan att någon ser det.
5. **`get-attendance` står inte i `.prod-functions-allowlist.conf`.** All
   närvaro-läsning är fail-closed mot prod i dag.
6. **Latensen är strukturell.** `get-attendance` gör
   `1 + ceil(N/batch) + ceil(P/batch)` SEKVENTIELLA Airtable-anrop — för
   MK:s 218 rader ~150 anrop. Dörrens latensgolv är sub-sekund. Optimistisk
   write med rollback är därför GOLV, inte förfining, i den skarpa skivan.

---

## Öppna frågor till grillningen

1. **Ska sökningen nollställas efter en incheckning (C)?** Jag har byggt det
   så, och det är vad som gör den kvarstående panelen bärande. Motargumentet:
   det kan kännas abrupt att fältet töms under fingret. Alternativet är att
   låta sökningen stå kvar och markera den incheckade i träfflistan — då blir
   panelen ett kvitto i stället för en ångra-väg.
2. **Är dörrens objekt personen eller deltagandet?** Prototypen väljer
   DELTAGANDET (sessions-scopat) för B och C. Alternativet — "Anna är här"
   som skriver dagens session automatiskt — kräver att UI:t ändå visar vilken
   session som träffas, annars är handlingen osynlig i sin effekt.
3. **Ska Lotta behöva bekräfta sessionen varje gång hon öppnar sidan?**
   I dag: nej, den härleds och visas. Om vi inte litar på härledningen är
   alternativet ett aktivt val vid varje öppning — en gest mer, men noll
   tysta fel.
4. **Attribueringen är olöst.** `Registrerad av` är `lastModifiedBy` ⇒
   API-skrivningar bokförs på token-ägaren, inte på Lotta. Vill vi veta VEM
   som checkade in krävs ett eget fält i basen (samma klass som ADR-075:s
   författarfält).
5. **`Avstämt`-ägarskapet.** A8 sätter fältet vid statusändring enligt
   referensen, men MCP kan inte se automationer — påståendet är
   dokumentations-grundat, inte live-verifierat. Kräver HAR-export eller
   skärmdump av A8 innan write-vägen låses. Prototypen skriver aldrig fältet.
6. **Ska check-in-sidan bo på en EGEN route?** Prototypen bor på
   `/narvaro` eftersom det var hemvisten jag fick. Den skarpa sidan bör
   rimligen ha en egen adress (`/event/$eventId/checkin`) och `/narvaro`
   rivas när den föds — task-18.13:s gate.
7. **Ska A byggas in i `Narvaro.tsx` i samma PRD eller i en egen?**
   Rekommendation: egen skiva i samma PRD — write-vägen är gemensam
   (`Deltaganden.Status`), bara ytan skiljer.

---

## Hur bilderna togs (och hur de tas om)

Via en **tillfällig** Playwright-spec (`tests/e2e/zz-proto-checkin.staging.test.ts`)
som raderades direkt efteråt per ordern — den var ett skärmdumps-verktyg, inte
ett test. Receptet, om de behöver tas om:

- `page.route`-mocka `get-event`, `get-attendance` och `get-registrations`
  (svaren har formen `{ event }`, `{ attendance }` respektive
  `{ registrations }`).
- Mockvärlden: 20 anmälda × 2 sessioner = 40 deltaganden-rader. På Dag 1:
  3 Närvarande, 1 Frånvarande, 1 Försenad, 1 Deltog online, resten Ej avstämt.
  Två avbokade anmälningar (som ÄNDÅ har deltaganden — defekten), två utan
  e-post, två medföljande, fyra bor över, två mycket långa namn.
- Kör mot en dev-server på egen port:
  `PLAYWRIGHT_TEST_BASE_URL=http://localhost:4183 npx playwright test --project=chromium-authenticated <spec> --reporter=line`
- Dölj dev-överlägget före bilden (react-query-devtools `.tsqd-parent-container`,
  router-devtools, och prototyp-railen via dess `[aria-label="Skarpa vyn"]`).

## Kastbarhet

`src/components/events/CheckinPrototyp.tsx` och routens `?variant`-gren är
**kastbar kod** per throwaway-kontraktet klausul iv: den absorberas ALDRIG.
När valet är gjort raderas den och vinnaren skrivs OM nyskrivet genom
leverans-grindarna. Bilderna i den här katalogen är bedömningsunderlaget som
ska överleva koden.

---

## Natt-chefens granskningsnot (2026-07-26)

Tillagd av orkestratorn efter egen visuell granskning av samtliga 18 bilder —
inte av bygg-agenten. Tre saker Marcus bör veta innan han väljer:

### 1. Fokusringen kring variant C:s sökfält är TASK-25, inte prototypens fel

På `c-mobil.png` ligger fokusringen som en rektangel utanför fältets rundade
kapsel. Det är den app-breda defekten i `TASK-25` (globala `*:focus-visible`
sätter `border-radius: 2px` och klipper kapselradier vid tangentbordsfokus) —
den syns tydligast här just för att C är den enda varianten som AUTOFOKUSERAR.
Bedöm inte C:s sökfält på den detaljen; den försvinner när TASK-25 landar och
är inget C:s design äger.

### 2. B:s framstegsstapel är starkare än C:s radräknare

Jämför `b-mobil.png` mot `c-mobil.png`: B:s "3 av 18 incheckade / 15 kvar" med
stapel läses på ett ögonkast över ett rum; C:s "3 av 18 incheckade · 18
deltagare" är en textrad som konkurrerar med sökfältet om uppmärksamheten.
"15 kvar" är dessutom det tal som faktiskt betyder något vid dörren — hur många
som ännu inte kommit. Bygg-agentens rekommendation att lyfta in B:s stapel i C
stöds alltså av bilderna, inte bara av resonemanget.

### 3. "Checka in"-etiketten är en affordans utan knapp-yta

I både B och C står "Checka in" som ren text i radens högerkant medan HELA
raden är klickytan. Det fungerar tekniskt (raden bär `aria-pressed`), men vid
dörren — under tidspress, med en person framför sig — är det inte självklart
att man kan trycka var som helst. Öppen fråga till konvergensen: ska
affordansen bli en riktig knapp-yta, eller ska etiketten bort helt och raden
tala för sig själv? Prototypen svarar inte på det.
