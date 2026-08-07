---
owner: marcus803
updated: 2026-08-07
review_by: 2026-09-07
status: draft
---

# Eventsidan — varje skillnad mellan prototypen och den skarpa vyn, block för block

> **Proveniens:** avgränsat kartläggnings-pass 2026-08-07, beställt för att ge
> Marcus den lista `ADR-102` B3/B4 förutsätter men som inte fanns. Kört i egen
> worktree (`.claude/worktrees/agent-a025b19eadc24c46f`) mot `origin/main` vid
> `5148e5ae` (`Merge pull request #945`, samma dag som `ADR-102` landade).
> **Ingen produktionskod är ändrad av detta pass.** Kartan är leveransen;
> vad som ska göras åt avvikelserna är Marcus beslut och står inte här.
>
> Styrande beslut: [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md).
> Facit-underlag: `tasks/sessions/bilagor/s93-hallplats-prototyp/README.md`
> (läst i sin helhet, 871 rader) + de fyra `facit-*.png` (2026-08-06).

## Vad kartan säger, kortast möjligt

Eventsidan har **elva block**. **Åtta av dem är redan identiska** mellan
prototypen och den skarpa vyn — inklusive de största (toppblockets sju rader,
deltagarkorten, den inflyttade betalningsytan, Beläggning, Gruppdynamik,
Anteckningar). `TASK-145.1`–`145.5` gjorde det arbetet.

**Sex avvikelser återstår**, och de sitter i **två block**: åtgärds-ytan högst
upp och registrets navigering i Anmälda deltagare. Den avvikelse `ADR-102`
redan hade belagt (åtgärds-ytan) är den största — men den är **inte** ensam.

Utöver dessa sex finns en **andra axel** som `ADR-102` inte tar upp och som
ändrar vad ett godkännande faktiskt betyder: **prototypen har själv ändrats
efter att Marcus låste den.** Två bokförda ändringar. Se § Prototypen har
drivit från sina egna facit-bilder.

## Metoden — och vad den inte kan se

Jag använde **tre spår**, med avsikt att de skulle kunna motsäga varandra.

**1. Källkodsläsning (bärande spåret).** Varje gren på
`isHallplatsVariant`/`protoVariant`/`protoAktiv`/`protoDataMode`/`variantParam`
i `src/components/events/` lästes och klassades som **form-gren** (ytan ser
olika ut) eller **data-gren** (samma yta, annan datakälla eller inaktiverade
kontroller). Detta spår är auktoritativt enligt `ADR-100`: koden äger
beteendet.

**2. Rendering av båda lägena mot SAMMA data.** Jag byggde en tillfällig
Playwright-spec ovanpå repots egen hermetiska fixturvärld
(`tests/support/fixturvarld/hermetic.ts`) och renderade:

- skarpa: `/event/recVisualEvent0001`
- prototyp: `/event/recVisualEvent0001?variant=a&data=verklig`

`?data=verklig` gör att **prototypen hämtar via nätverket precis som skarpa
gör** — och fixturvärlden svarar båda med samma nyttolast. Jämförelsen blir
därmed ren form-jämförelse, inte en jämförelse av två datamängder. Kört i två
vyportar (1440×900 och 375×812). Jag jämförde renderad text, en DOM-strukturdump,
listan över synliga knappar/länkar, samt en CSS-mätning av avdelaren under
registret. Fem interaktiva lägen prövades i båda (Öppna detaljer, Markera-läget,
steg-filter, Bor över, Avbokade). **Noll sidfel i båda lägena.** Specen är
raderad; inga baselines rördes (`page.screenshot`, aldrig `toHaveScreenshot`).

**3. Korsläsning mot bilagans vågbeskrivningar.** Varje funnen avvikelse
kontrollerades mot det Marcus faktiskt beställde i vågorna 1–20, så kartan
skiljer *"skarpa saknar något Marcus bad om"* från *"de två råkar se olika ut"*.

### Vad metoden strukturellt INTE kan se

- **Pixlar.** Ingen pixeldiff kördes. Två ytor med identisk DOM och identiska
  klasser kan ändå skilja på sub-pixelnivå — den klassen fångas inte här.
  Bilagan bokför dessutom en känd, app-bred 1 px-artefakt i `divide-y`-stackar
  (§ Byggkravs-våg punkt 4) som skulle drunkna i en sådan mätning ändå.
- **Facit-bilderna.** Jag jämförde prototypen mot skarpa. Jag jämförde INTE
  någondera mot `facit-*.png` pixel för pixel — de är tagna vid 430 px i
  `?data=proto`, jag renderade vid 1440/375 i `?data=verklig`.
- **`?data=proto`-läget.** Aldrig renderat. Dess dimningar och inaktiverade
  kontroller är enbart kodlästa.
- **Hover, fokus, utskrift, `prefers-contrast`, `prefers-reduced-motion`.**
  Inte jämförda i något läge.
- **Andra eventtillstånd.** En enda datamängd renderades. Ett genomfört event,
  ett fullbokat, ett med väntelista eller ett utan anmälningar kan aktivera
  grenar jag aldrig såg.

Vad detta betyder praktiskt står samlat i § Vad metoden inte kunde avgöra.

## Var koden delar sig — mätt

`grep -rcE 'isHallplatsVariant|protoAktiv|protoDataMode|variantParam' src/components/events/`
reproducerar uppdragets tal exakt. Men **antalet träffar säger nästan
ingenting om antalet avvikelser** — kolumnen längst till höger är den som
betyder något:

| Fil | Träffar | Varav FORM-grenar | Vad resten är |
|---|---|---|---|
| `detail/Betalningar.tsx` | 44 | **0 nåbara** | 5 `protoAktiv`-grenar som alla nås med `protoAktiv={true}` i båda lägena + 1 död komponent (se nedan) |
| `detail/Deltagare.tsx` | 21 (37 med `protoVariant`) | **5** | resten är datakälla, propgenomföring och docblock |
| `detail/Anteckningar.tsx` | 14 | **0** | enbart `protoDataMode` — datakälla + inaktiverad composer |
| `detail/Gruppdynamik.tsx` | 10 | **0** | enbart `protoDataMode` |
| `detail/Belaggning.tsx` | 10 | **0** | enbart `protoDataMode` |
| `EventDetail.tsx` | 4 (5) | **1** | + railens DEV-montering |
| `atgarder/AtgardsSida.tsx` | 2 | **0** | båda är docblock-text |
| `detail/hallplats-steg-prototyp.ts` | 1 | **0** | typvakten `isHallplatsVariant` |

Två fynd förklarar varför `Betalningar.tsx`s 44 träffar ger noll avvikelser:

1. **`Betalningar()` är död kod.** `EventDetail.tsx` renderar den inte längre
   (`EventDetail.tsx:323–331`, `TASK-145.4`), och ingen annan fil importerar
   den — verifierat: enda importen av modulen är
   `Deltagare.tsx:31`, `import { BetalningsDetaljer, DetaljRad }`. Allt bakom
   `Betalningar`/`BetalningsInnehall` — inklusive fem `protoAktiv`-grenar — är
   oåtkomligt i båda lägena.
2. **`BetalningsDetaljer` monteras med `protoAktiv` hårdkodat sant**
   (`Deltagare.tsx:1926`) i BÅDA lägena. Facit-formen är därmed den enda formen
   som renderas, precis som `TASK-145.4` AC #2 föreskriver.

En träff utanför `src/components/events/`:
`src/routes/_authenticated/event/$eventId/narvaro.tsx:34–37` läser också
`?variant=`, men det är **check-in-prototypen** (en annan prototyp, egen route)
— utanför eventsidan och utanför denna karta.

## Blockkartan

Eventsidans elva block i renderingsordning. "Skiljer sig" avser **formen**,
mätt vid identisk data.

| # | Block | Prototyp (`?variant=a`) | Skarpa | Skiljer sig |
|---|---|---|---|---|
| 1 | Sidhuvud (chevron, eventnamn, EventKey-pill, tid kvar) | samma | samma | Nej |
| 2 | Check-in-kortet | `CheckInKort` | `CheckInKort` | Nej |
| 3 | **Åtgärds-ytan** | `AtgarderKort` + `SkrivUtKort` | `Atgarder` (grupp med två numrerade rader) | **JA — A1** |
| 4 | Om eventet | samma | samma | Nej |
| 5 | Beläggning | samma form | samma form | Nej (endast datakälla) |
| 6a | Anmälda deltagare — toppblocket (7 rader) | `HallplatsToppA` + logistikgrupp | identiskt | Nej |
| 6b | **Registrets navigering** | filterpanel (`RegisterFilterRad`) | tre flikar + "Rensa filtret" | **JA — A2** |
| 6c | **Registrets innehåll (basen)** | hela `registreringar`, avbokade medräknade | `aktiva` genom flikvalet, avbokade uteslutna | **JA — A3** |
| 6d | **Avdelaren under registret** | riven (`border-b-0`) | 1 px kvar | **JA — A4** |
| 6e | **Bor över (kryss-läget)** | filterpanelen står kvar ovanför | "Rensa filtret"-knapp i stället | **JA — A5** |
| 6f | **Registret vid noll träffar** | batch-baren med Markera står kvar | baren försvinner | **JA — A6** |
| 6g | Deltagarkorten (namn, e-post, steg-märke, meta) | samma | samma | Nej |
| 6h | "Öppna detaljer" — betalningsarbetsytan | `BetalningsDetaljer` | identiskt anrop | Nej |
| 7 | Betalningar som eget toppnivå-block | borta | borta | Nej |
| 8 | Närvaro | samma | samma | Nej |
| 9 | Gruppdynamik | samma form | samma form | Nej (endast datakälla) |
| 10 | Anteckningar | samma form | samma form | Nej (endast datakälla) |
| 11 | Prototyp-växlarens rail | monterad | ej monterad | Nej — DEV-ställning, se nedan |

### A1 — Åtgärds-ytan

**Källa:** `EventDetail.tsx:284–291`, `detail/Atgarder.tsx:165–196` (prototyp),
`:308–319` (skarpa).

**Prototypen visar** två fristående element ovanför Om eventet:

1. Ett kort i check-in-kortets exakta form — `Send`-ikon, texten
   **"Gå till åtgärder"**, chevron höger. Klick fäller ut en platshållarrad
   ("Åtgärds-sidan — eget prototyp-pass. Härifrån går utskicken …") i stället
   för att navigera, eftersom sidan inte fanns när kortet byggdes.
2. En högerställd, ramlös **"Skriv ut"**-knapp (ghost, `Printer` 18 px) utanför
   varje kort.

**Skarpa visar** en rubricerad grupp **"Åtgärder"** som innehåller två
numrerade rader: `1 Lägg till manuell anmälan` (länk) och
`2 Skriv ut denna detaljsida` (knapp).

**Skillnaden i klartext:** ingenting av det Marcus beställde 2026-08-05 finns i
skarpa. Ordern citeras ordagrant i `Atgarder.tsx:141–144`; samma fil bokför
öppet på rad 299–306 att steget **inte** togs i `TASK-145.5`. Skarpa river
visserligen de fyra grå löftena (rad 268–277) — men det halverar en grupp som
enligt ordern inte ska finnas kvar alls.

**Renderat, verbatim.** Prototyp: `Gå till åtgärder` · `Skriv ut`.
Skarpa: `Åtgärder` · `1` · `Lägg till manuell anmälan` · `2` ·
`Skriv ut denna detaljsida`.

### A2 — Registrets navigering

**Källa:** `Deltagare.tsx:1699–1718` (skarpas flikar), `:1739–1752`
(prototypens panel), `DeltagareHallplatsPrototyp.tsx:296–532`.

**Prototypen visar** en tonad panel (`bg-bg-muted`, `rounded-2xl`) direkt under
toppblocket, permanent framme, med:

- Två dropdowns sida vid sida: **"Visa"** (åtta val — Alla i registret, Väntar
  på bekräftelse, Saknar anmälningsavgift, Saknar slutbetalning, Klara, Saknar
  eventinfo, Bor över, Avbokade) och **"Väg in"** (fem val — Alla vägar in, Via
  formulär, Manuellt tillagd, Medföljande, Från väntelistan). **Axlarna
  kombineras** ("medföljande som saknar slutbetalning").
- En räknerad: **"Visar N av M i registret"**, med tillägget
  *"- K av dem är avbokade"* när sådana finns.
- En **"Rensa filter"**-knapp som bara syns när något är valt, med en
  räknebadge för antalet aktiva filterval.
- En **"Skriv ut"**-knapp i panelens fot.

**Skarpa visar** i stället tre flikknappar — `Alla (5)` · `Manuella (1)` ·
`Medföljande (0)` — och, när ett topprads-filter är valt, en ensam
**"Rensa filtret"**-knapp.

**Skillnaden i klartext, fyra delar:**

1. Filtrering på steg-axeln kan i skarpa **bara** nås genom att klicka
   toppblockets rader. Det finns ingen yta som visar vad som är valt.
2. "Väg in"-axeln finns inte alls i skarpa; flikarna täcker tre av dess fem
   värden och kan inte kombineras med steg-axeln.
3. Räkneraden ("Visar N av M") finns inte. Skarpa bär i stället antalet inne i
   flikens namn, vilket är en annan uppgift: `Alla (5)` räknar registret,
   `Visar 2 av 5` räknar det som visas just nu.
4. **Registrets egen "Skriv ut"-knapp finns inte i skarpa.** (Nyansen, mätt:
   båda knapparna anropar `window.print()` och skriver alltså ut hela sidan —
   docblockets påstående om "den filtrerade listan" motsvaras inte av kod.
   Skillnaden är alltså en ingång, inte en funktion.)

Detta är den yta Marcus itererade mest på: vågorna 5, 6, 8 och 9 handlar alla
om just denna panel (bilagan § FACIT-LÅST). Ingen av dem finns i skarpa.

### A3 — Registrets innehåll (basen)

**Källa:** `Deltagare.tsx:1328–1335` (`unifiedSorted`, prototypen) mot
`:1349–1356` (`registerLista`, skarpa); båda konsumeras i renderingen på
`:1786` respektive `:1883`.

**Prototypen** sorterar **hela** `registreringar` — avbokade inräknade, med sitt
grå märke, sist i ordningen. Kommentaren på rad 1321–1327 bokför det som
Marcus beslut: *"avbokade ska även synas i registret självt"*.

**Skarpa** sorterar `visade` = flikfiltrerade `aktiva`. `arAktiv` filtrerar bort
avbokade, så de kan **aldrig** stå i skarpas register. Enda vägen till dem är
att klicka Avbokade-raden i toppblocket, vilket byter ut listan mot enbart dem.

Följdeffekt: prototypens fot räknar mot en bas som inkluderar avbokade
(därav tillägget "K av dem är avbokade"); skarpas fliknamn räknar mot en bas
som utesluter dem. Talen kan alltså skilja på samma sida med samma data.

**Ej renderingsbekräftad.** Fixturvärlden har noll avbokade, så skillnaden
syntes inte i mätningen. Detta är ett rent kodläst fynd.

### A4 — Avdelaren under registret

**Källa:** `Deltagare.tsx:1692` —
`cn('flex flex-col gap-2.5 py-3', protoVariant === 'a' && 'border-b-0')`.

**Prototypen** river den ljusgrå linjen mellan registret och "Öppna detaljer".
**Skarpa** behåller den. Kommentaren rakt ovanför (rad 1676–1691) bokför att
klassen är **avsiktligt** villkorad — den skrevs innan skarpa hade fått samma
form och lämnades scopad "där ingen bett om det".

**Mätt i browser**, båda vyportarna:

| Läge | `border-bottom-width` |
|---|---|
| skarpa | `1px solid rgb(225, 227, 225)` |
| prototyp | `0px` |

Ordern som rev den i prototypen är citerad ordagrant i samma kommentar
(iterationsvåg 7, Marcus 2026-08-06: *"Även den som ligger längst ner i blocket
precis över 'öppna detaljer'"*).

### A5 — Bor över (kryss-läget)

**Källa:** `Deltagare.tsx:1753–1758` (prototypen) mot `:1805–1816` (skarpa).

Listan med kryssrutor är **identisk** — samma komponent, samma ordning,
verifierat i rendering (fem namn i samma följd i båda).

Skillnaden är ramen runt den: prototypen har filterpanelen kvar ovanför
(och rensar via dess "Rensa filter"), skarpa monterar en ensam
**"Rensa filtret"**-knapp. Det är A2:s skillnad som visar sig i ett läge till.

### A6 — Registret vid noll träffar

**Källa:** `Deltagare.tsx:1784–1800` (prototypen) mot `:1848–1894` (skarpa).

Prototypen renderar batch-baren **först** och listan (eller texten "Inga träffar
i denna kategori.") därefter — Markera-knappen bor i barens vänsterkant och står
kvar även när träffmängden är tom. Skarpa har hela baren **inuti**
`else`-grenen till `visadRegisterLista.length === 0`, så Markera försvinner.

**Renderat, filter Avbokade (0 träffar):** prototyp visar
`… Skriv ut · Markera · Inga träffar i denna kategori.`, skarpa visar
`Rensa filtret · Inga träffar i denna kategori.`

### Om block 11 — prototyp-växlarens rail

Railen (`PrototypeSwitcher`) monteras endast i prototypläget och endast i
DEV (`EventDetail.tsx:356`). Den syns i mina renderingar som fem extra knappar
och en tvåa. **Det är inte en avvikelse att åtgärda** — den är byggställning,
och `ADR-074` äger den. Den nämns här bara så att den inte förväxlas med en
skillnad när Marcus jämför.

### Om block 5, 9 och 10 — vad `protoDataMode` gör

`Belaggning`, `Gruppdynamik` och `Anteckningar` läser `?variant=`/`?data=`
**oberoende** av `Deltagare.tsx`. Men samtliga grenar är **datakälla**, inte
form:

- `Belaggning.tsx:311, 341` — "Extra platser" och "Väntelista" ersätts av
  texten *"Ej i fixturunderlaget (proto)"* i `?data=proto`.
- `Belaggning.tsx:291, 352` — Ändra-morfen kan inte öppnas i `?data=proto`.
- `Gruppdynamik.tsx:370` — nivåhinkarna räknas ur fixturerna i `?data=proto`.
- `Anteckningar.tsx:110–168` — composern är inaktiverad i `?data=proto`.

Ingen av dem påverkar formen, och ingen av dem är aktiv i `?data=verklig`.
Det stämmer med bilagans egen räckviddsnot (§ Räckvidd): *"Vågorna 19–20 är
SKARP kod … De syns alltså utan `?variant=a`."*

## Rangordning — vad som betyder mest när Marcus granskar

Ordnad efter hur mycket avvikelsen kostar honom att upptäcka och hur direkt den
motsäger en order han gett.

1. **A1 — Åtgärds-ytan.** Ett helt block har fel form. Syns utan att klicka på
   något, står högst upp på sidan, och motsäger en ordagrant citerad order.
   Redan belagd i `ADR-102`.
2. **A2 — Registrets navigering.** Störst yta av de återstående. Fyra av Marcus
   tjugo iterationsvågor sitter i denna panel och ingen av dem finns i skarpa.
   Syns utan att klicka.
3. **A3 — Avbokade i registrets bas.** Ett uttryckligt Marcus-beslut som inte
   följt med. Rankas under A2 för att den kräver ett event med avbokade för att
   synas alls — men den är den enda avvikelsen som får två tal på samma sida att
   räkna olika saker.
4. **A4 — Avdelaren.** En pixel, men en pixel Marcus pekade på och bad om att få
   bort. Syns i default-läget utan interaktion.
5. **A5 — Bor över-ramen.** Kräver ett klick. Innehållet är rätt, ramen är fel.
6. **A6 — Batch-baren vid noll träffar.** Kräver ett klick OCH ett filter som
   inte ger träffar.

## Prototypen har drivit från sina egna facit-bilder

Detta är en **andra axel** och den ligger utanför `ADR-102`:s text. Den avgör
vad ett godkännande faktiskt godkänner, så den hör hemma i kartan.

`DeltagareHallplatsPrototyp.tsx` — prototypens egen komponentfil — är **orörd**
sedan facit-låsningen (`git log ecd4e1c0..HEAD` mot den filen: tomt). Men
`TASK-145`-skivorna ändrade **delad** kod som prototypen renderar, och två av
ändringarna syns i prototypens yta:

| # | Vad som ändrades | Facit (2026-08-06) | Nu, i BÅDA lägena | Bokfört av |
|---|---|---|---|---|
| D1 | Mottagen-pillens datum | `Mottagen 21 juli` | `Mottagen` | `TASK-145.4` AC #10 + Marcus väg C 2026-08-07 — datumet återkommer när domänmodellen bär fältet (`TASK-147`) |
| D2 | Betalningskrysset i arbetsytan | inaktiverat i `?data=proto`, **skrivande** i `?data=verklig` | ovillkorligt inaktiverat, `onChange` tom | PRD `TASK-145` § Implementationsbeslut, *"Eventsidan är en LÄSYTA"* — `Betalningar.tsx:274–281` river K27-anden öppet |

**Underlaget för D1:** `PROTO_MOTTAGEN_DATUM` (fem daterade fixturposter) är
borttagen ur `hallplats-steg-prototyp.ts`; `Betalningar.tsx:259–262` returnerar
numera bara `'Mottagen'` när inget ISO-datum finns, och den enda anroparen
(`:335`) skickar `null`.

**Båda är alltså bokförda Marcus-beslut, inte tyst drift** — och båda gäller
lika i prototypen och i skarpa, så de gör inte de två olika. Men de betyder att
**"skarpa är identisk med prototypen" inte är samma sak som "skarpa är identisk
med `facit-*.png`"**. Gäller `ADR-102` B3:s villkor det förra räcker denna
karta; gäller villkoret det senare måste D1 och D2 vägas in separat.

Övriga ändringar sedan låset rör bara skarpa (`Atgarder.tsx`: fyra grå rader
rivna) eller är osynliga (`Deltagare.tsx`: `pending`-propen och
bekräfta-utfallets state rivna med bekräfta-flödet).

## Vad metoden inte kunde avgöra

Öppet, i fallande ordning efter hur mycket det kan dölja.

1. **Om `facit-*.png` visar något ingen av vyerna visar.** Kartan jämför
   prototyp mot skarpa, inte kod mot bild. Det finns fyra facit-bilder
   (anteckningar, betalningar ×2, gruppdynamik) och **ingen för åtgärds-ytan
   eller registret** — precis de två block där avvikelserna sitter. En
   avvikelse som bara syns mot en bild jag inte kunde ställa sida vid sida med
   en rendering skulle ha undgått mig.
2. **Grenar som en annan datamängd hade väckt.** Fixturvärlden har noll
   avbokade, noll utskickshistorik, noll personer med tidigare kurser och ett
   kommande event. Därför är A3 enbart kodläst, och `Tidslinje`-formen,
   Gruppdynamikens fyllda hinkar, `T16`-divergensen och Närvaro-registrets
   genomförda läge är **oprövade i rendering** i båda lägena.
3. **`?data=proto`-läget.** Aldrig renderat — facit-bilderna är tagna där. Dess
   dimningar och inaktiverade kontroller är enbart kodlästa, och en form-skillnad
   som bara uppstår i fixturläge skulle inte synas här.
4. **Pixlar, färger och sub-pixel-höjder inom identisk DOM.** Ingen pixeldiff
   kördes. `npm run test:visual`s baseline är dessutom stale sedan före
   `TASK-145.1` (`ADR-102` R8) och kunde inte användas.
5. **Hover-, fokus-, utskrifts- och kontrastlägen.** `RegisterFilterRad` bär
   `print:hidden`, `SkrivUtKort` likaså — utskriftsvyerna kan alltså skilja på
   sätt jag inte mätt. Samma för `prefers-contrast: more` och
   `prefers-reduced-motion`.
6. **Vyporten 430 px.** Facit togs där; jag mätte 1440 och 375. Samma avvikelser
   framträdde i båda mina bredder, men en brytpunkt som bara gäller mellan 375
   och 1440 kan finnas.
7. **Åtgärds-sidan (`TASK-147`, S100).** Routerna
   `/event/$eventId/atgarder` och `/atgarder` finns nu och är själva prototyper.
   Ingen av eventsidans två lägen länkar dit — prototypens "Gå till
   åtgärder" fäller ut en platshållartext skriven innan routen fanns, och
   skarpa har ingen ingång alls. Det är en **egen** prototyp-mot-skarpa-fråga
   och ligger utanför denna karta.
8. **Check-in-prototypen** (`narvaro.tsx`, `?variant=a|b|c`) — samma sak, egen
   yta, ej kartlagd.

## Reproducera mätningen

```bash
# 1. Grenräkningen
grep -rcE 'isHallplatsVariant|protoAktiv|protoDataMode|variantParam' src/components/events/

# 2. Prototypens drift sedan facit-låsningen (ecd4e1c0 = FACIT-LÅST-committen)
git log --oneline ecd4e1c0..HEAD -- src/components/events/detail/DeltagareHallplatsPrototyp.tsx
git diff ecd4e1c0..HEAD -- src/components/events/detail/hallplats-steg-prototyp.ts

# 3. Renderingen: lägg en spec under tests/visual/ som går till
#    /event/recVisualEvent0001 respektive
#    /event/recVisualEvent0001?variant=a&data=verklig
#    via tests/support/fixturvarld/hermetic.ts, och kör:
PLAYWRIGHT_VISUAL_DEV_SERVER=1 npx playwright test <spec> --project=visual-desktop
```

Fixturvärlden kräver varken staging-inloggning eller CORS-undantag, och
`?data=verklig` är det som gör jämförelsen ärlig: utan den läser prototypen sina
egna in-memory-fixturer och skarpa läser nätverket, och då jämför man två
datamängder i stället för två former.
