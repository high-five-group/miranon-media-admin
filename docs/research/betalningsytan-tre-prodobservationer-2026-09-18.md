---
owner: marcus803
updated: 2026-09-18
review_by: 2026-12-18
status: draft
---

# P4 — Betalningsytan: karta över tre prod-observationer (2026-09-18)

**Modell:** Sonnet 5 (`claude-sonnet-5`), read-only kartläggningspass mot huvudkatalogen
`/Users/marcus/Repon/miranon-media-admin` (branch `main`, arbetat via `cd <path> && <kommando>`
från en worktree-session; se § Git status för detaljer).

Not om namn: repot är publikt. Inga deltagarnamn (verkliga eller ur test-/facit-fixturer)
återges nedan — personer refereras generiskt ("en rad", "personen i O1").

---

## O1 — Korthöjden i betalningsinkorgen

### MEKANISM (fil:rad)

Kortets innehåll renderas av `RadInnehall` i
`src/components/betalningar/BetalningsInkorg.tsx:2523-2576`. Pillarna sitter i en
egen rad, alltid monterad men bara ibland fylld:

```text
2540  <div className="flex flex-wrap items-center gap-2">
2555    {rad.forfallen && ( <StatusBadge ton="warning" ...>Förfallen</StatusBadge> )}
2566    {rad.obekraftad && ( <StatusBadge ton="neutral" ...>Obekräftad</StatusBadge> )}
2571    {rad.spegelSlapar && <BasenSlaparPill />}
2572  </div>
```

Containern (rad 2540) har ingen `min-h`/padding. Är alla tre villkor falska renderas
en tom `<div>` — noll pixlar egen höjd (bara `gap-1`:s 4 px mot raden ovanför
återstår). En rad med minst en pill blir däremot `StatusBadge`s egen höjd (`storlek
sm`) högre. Det är EXAKT detta Marcus ser: personen i O1 saknar alla tre villkoren
samtidigt (ingen förfallen, ingen obekräftad, ingen spegelsläpning) → tom rad → lägre
kort än syskonen.

`obekraftad`-fältet härleds i `src/components/betalningar/inkorg-harledningar.ts:115`:

```text
115  obekraftad: betalning.anmalanStatus === 'Obekräftad',
```

`anmalanStatus` kommer i sin tur från Airtables `Status`-fält på anmälan, läst i EF:en
`supabase/functions/hamta-oppna-betalningar/index.ts:491`:

```text
491  anmalanStatus: selectName(f['Status'] ?? null),
```

och typas `z.string().nullable()` i `src/domain/schemas/Betalningar.schema.ts:182`.

Jämförelseytan (bekräftelsesteget, `VariantC.tsx`) hade SAMMA tre pillar tidigare via
`RadMarken` (`src/components/betalningar/prototype/radfalt.tsx:248`), men
`TASK-402.8` (Done, PR #2378 → `6c999f2f`) rev dem DÄR — se docblocket
`VariantC.tsx:861-892`: *"'Förfallen' och 'Obekräftad' satt här via RadMarken ...
Signalerna bor i INKORGEN, där Lotta prioriterar — dess markup är egen
(BetalningsInkorg.tsx § RadInnehall) och orörd av denna skiva."* Inkorgens rad är
alltså explicit LÄMNAD ORÖRD av den skivan — 402.8 löste "alla kort lika höga" i
bekräftelsesteget genom att TA BORT pillarna helt (kortet klipper namnet i stället,
`VariantC.tsx:877-891`), inte genom att reservera plats.

### AVGÖRANDE DATAFÄLT

| Fält (Airtable/domän) | Källa | Värde som ger TOM pillrad |
|---|---|---|
| `Anmälningar.Status` → `anmalanStatus` | `hamta-oppna-betalningar/index.ts:491` | ≠ `'Obekräftad'` (dvs. t.ex. `'Bekräftad'`) |
| `deadlineSlutbetalning` → `forfallen` | `arForfallen()`, `inkorg-harledningar.ts:93-96,114` | `null`, eller inte passerad `idag` |
| `spegelIFas` (jämförelse Postgres-summa vs. Airtable-spegel `Summa inbetalt (kr)`) → `spegelSlapar` | `hamta-oppna-betalningar/index.ts:497` | `spegelIFas === true` (spegeln har hunnit ikapp) |

En prod-uppslagning behöver bara läsa anmälans `Status`-fält (Bekräftad/Obekräftad),
`Deadline slutbetalning` mot dagens datum, och om `Summa inbetalt (kr)` (spegel) ==
Postgres-summan för raden. Om alla tre är "lugna" blir raden tom.

### KLASSNING

**Bugg** (visuell inkonsekvens mot ett uttalat, redan etablerat krav — inte
designval och inte en datafråga). Datafältet `anmalanStatus` är korrekt affärsdata;
felet är att UI:t inte reserverar plats för en pill-rad som kan vara tom. Samma
princip — "alla kort exakt lika höga" — är Marcus egna, upprepade ord i samma
kod­familj: `tasks/sessions/2026-09-04-session-121.md:546-548` (bekräftelsesteget,
Varv 6: *"ALLA kort måste alltid var exakt lika höga"*) och
`tasks/sessions/2026-08-31-session-114.md:316` (Intresserade-listan: *"Marcus krav
på EXAKT lika höga rader löstes med mekanik, inte innehåll"*). Ingen sådan mekanik
finns i `BetalningsInkorg.tsx`s pillrad. Ingen test låser heller inkorgens
radhöjd (sökt `tests/` brett, inga träffar för `BetalningsInkorg`/`RadInnehall` +
höjd/`getBoundingClientRect`), och `tasks/sessions/bilagor/s113-346-6-inkorgen/`
har bara skärmdumpar, ingen `facit.json` — inkorgens kort är alltså INTE en
facit-stämplad, låst yta för just detta.

### ÅTGÄRDSRIKTNING (golv, inte spekulation — pekar på befintligt husmönster)

Två redan använda mönster i SAMMA app löser exakt detta:

1. **Samma familj, samma ursprung (TASK-362):** `RegistreratNuBlock.tsx:544-566`
   reserverar en `min-h-22 sm:min-h-10`-slot som alltid finns, oavsett om
   innehållet (knapp/statusrad/inget) är monterat — dokblocket kallar det
   *"EN STATUSYTA, RESERVERAD HÖJD"*.
2. **Annan familj, samma krav ordagrant:** Intresserade-listan (session-114)
   löste "EXAKT lika höga rader" med `min-h-[1lh]` + `truncate` per rad, DOM-mätt.

Närmaste, minst invasiva fixen är alltså att ge pill-containern (rad 2540) en
fast minimihöjd som matchar en enstaka `StatusBadge storlek="sm"` (samma
`min-h-[…]`-teknik som ovan), inte att gissa fram ett nytt mönster. Det är golv
(redan etablerad husstandard), inte spekulativ komplexitet.

---

## O2 — "Sätt alla belopp" i bulkregistreringen (bekräftelsesteget, `VariantC.tsx`)

### MEKANISM (fil:rad)

Komponenten är `VariantC.tsx` (routen bakom "Registrera N", TASK-402.1/402.3/402.5).
Panelen "Sätt alla belopp" är en `ToggleButtonGroup` med tre lägen
(`VariantC.tsx:687-709`), och varje icke-Förslag-knapp disablas gruppvis:

```text
702  isDisabled={
703    registrerar || (v.lage !== 'forslag' && (lagesTraffar.get(v.lage) ?? 0) === 0)
704  }
```

`lagesTraffar` räknas `VariantC.tsx:371-374`:

```text
371  const lagesTraffar = useMemo(
372    () => new Map(LAGEN.map((v) => [v.lage, antalILage(kvar, v.lage)])),
373    [kvar],
374  );
```

`antalILage`/`berorsAvLage` i `src/components/betalningar/bekraftelsesteg-harledningar.ts:313-323`:

```text
313  export function berorsAvLage(rad: BekraftelseRad, lage: Beloppslage): boolean {
314    if (!rad.markerad) return false;
315    if (rad.utfall?.klass === 'registrerad') return false;
316    if (saknarBelopp(rad)) return false;
317    return beloppForLage(rad, lage) !== null;
318  }
319  export function antalILage(rader: ..., lage): number {
320    return rader.filter((rad) => berorsAvLage(rad, lage)).length;
321  }
```

`beloppForLage(rad, 'avgift')` → `genvagsbelopp` (samma fil, rad 155-160) → letar
i `rad.beloppsknappar` (= `harledBeloppsknappar(inkorgsrad)`,
`src/components/betalningar/inkorg-harledningar.ts:405-437`) efter en kandidat med
`nyckel: 'avgift'`. Den kandidaten läggs BARA till om:

```text
420  if (avgiftKvar !== null && avgiftKvar > 0 && !(kvar !== null && avgiftKvar === kvar)) {
421    knappar.push({ nyckel: 'avgift', ... });
422  }
```

**Alltså:** "Anmälningsavgift"-knappen i "Sätt alla belopp" är disabled när INGEN av
de MARKERADE, ännu ej registrerade, ej-i-"Behöver din hand"-raderna har en
avgifts-kandidat — dvs. när VARJE markerad rad uppfyller minst ett av: (a) avgiften
redan helt betald (`avgiftKvar <= 0`), (b) eventet saknar eget avgifts-fack
(`avgiftKvar === kvar`, "ett pris utan fack", ADR-128 beslut 6), eller (c)
`anmalningsavgift` (eventets avgiftsfält) är `null` i basen. Detta är INTENTIONELLT
och testat: `bekraftelsesteg-harledningar.ts:211-214` docblock, "TRE FALL SOM
MEDVETET GER FÄRRE ÄN TVÅ KNAPPAR" (`inkorg-harledningar.ts:405-418`), samt
enhetstester i `tests/api/bekraftelsesteg-harledningar.test.ts` (t.ex. rad
438-446, 582-584: en rad som redan betalat avgiften har uttryckligen "INGEN
avgifts-kandidat" och lämnas orörd).

**Visning:** knappen är `isDisabled` (gråtonad, `aria-disabled` via RAC
`ToggleButton`), INTE dold. Det finns INGEN text vid själva panelen som förklarar
varför ett läge är avstängt — hjälptexten under rubriken (`VariantC.tsx:658-661`)
förklarar bara vad knappen GÖR, inte varför den är av. Förklarande text
(`handSkal`, `VariantC.tsx:237-245`, resp. `markeringsSkal`,
`bekraftelsesteg-harledningar.ts:216-228`) finns bara PER RAD i "Behöver din
hand"-högen — inte som en gruppförklaring vid den avstängda togglen. Det är alltså
möjligt att stå framför en helt gråtonad "Anmälningsavgift"-knapp utan att appen
säger varför.

### AVGÖRANDE DATAFÄLT

För VARJE markerad person, kolla (Airtable/Postgres):

| Fält | Källa | Villkor som stänger av "Anmälningsavgift" |
|---|---|---|
| `Eventplanering.Anmälningsavgift (kr)` → `anmalningsavgift` | `hamta-oppna-betalningar/index.ts:494` (`ev?.avgift`) | `null` (ej satt för eventet) |
| `avgiftKvar = anmalningsavgift − summaInbetalt` (golvat vid 0) | `inkorg-harledningar.ts:102-105` | `≤ 0` (avgiften redan fullt betald) |
| `avgiftKvar === kvar` (kvar = gällande pris − inbetalt) | `inkorg-harledningar.ts:101,420` | sant (enfacks-event) |

Knappen är av om och bara om SAMTLIGA markerade rader (utom de i "Behöver din
hand") träffar minst ett av dessa tre för just `'avgift'`-läget.

### Hänger O2 ihop med O1? (orkestrerarens hypotes, prövad mot koden)

**Inte strukturellt.** `anmalanStatus`/`obekraftad` (O1, Airtable `Status`-fältet)
och `avgiftKvar`/avgifts-kandidaten (O2, `anmalningsavgift` + `summaInbetalt`) är
HELT OBEROENDE fält — ingen funktion i `inkorg-harledningar.ts` eller
`bekraftelsesteg-harledningar.ts` läser det ena för att sätta det andra. En
"Bekräftad"-anmälan kan mycket väl ha obetald avgift, och en "Obekräftad" kan ha
betalat allt. Hypotesen att "ingen obekräftad-pill ⇒ avgiften redan betald" är
alltså INTE bevisad av koden — den kan råka stämma för just denna markering (om
alla fyra av någon anledning delar samma avgiftsstatus), men det kräver en
faktisk datakontroll, inte en kodläsning.

**Möjlig alternativ/kompletterande förklaring, källbelagd:** `tasks/todo.md`
(S113-handover, rad ~18) bokför öppet: *"priserna på 305 anmälningar
(backfill om när Lotta ger värden)"* — och `TASK-346.15` (status **To Do**,
alltså fortfarande öppet) beskriver att `Pris (kr)`/`Anmälningsavgift (kr)`
INTE går att sätta via appens UI (`CreateEventForm.tsx`/`update-event`s
fält-allowlist saknar dem) — bara via basen/MCP för hand, gjort på tio
event 2026-09-02. Detta träffar dock i första hand `kvar`/"Hela beloppet"
(beror på `gallandePris`), inte direkt `avgiftKvar`/"Anmälningsavgift" (beror
på `anmalningsavgift`, ett annat fält) — så det är en partiell, inte fullständig,
förklaringskandidat för just O2.

### KLASSNING

**Mekanismen är designval** (medvetet, dokumenterat i TASK-402.8, testtäckt).
**Avsaknaden av gruppförklaring vid den avstängda togglen är en UX-lucka** — inte
speccad i 402.8:s AC #1-6, ingen `aria-describedby`/hjälptext kopplad till
`isDisabled`-läget. **Varför just dessa fyra personer triggade det är en
datafråga** — kräver prod-uppslagning av `anmalningsavgift`/`avgiftKvar`/`kvar`
per person, vilket detta pass inte får/kan göra.

### ÅTGÄRDSRIKTNING

Golv: en kort förklaringsrad ("Ingen av de markerade har en anmälningsavgift kvar
att sätta") när ett läge är avstängt av denna anledning är rimlig UX-hygien och
billig att lägga till med befintlig `markeringsSkal`/`handSkal`-logik som mall —
INTE ett nytt mönster. Spekulativt (skär bort): att bygga om hela
avstängningslogiken, eller att anta en koppling till O1 utan att först ha
verifierat datan.

---

## O3 — "8 anmälningar som kräver åtgärd"

### MEKANISM (fil:rad) — EN källa, verifierad genom bred sökning

Enda platsen i appen där "kräver åtgärd" visas med ett tal är Hem-vyns
"Bevakningsrad" (Åtgärdskö-raden), `src/components/hem/Bevakningsrad.tsx:257`:

```text
257  header={`${antal} kräver åtgärd`}
```

`antal` kommer från `atgardskoRad`, `src/components/hem/hem-derivations.ts:416-418`:

```text
416  export function atgardskoRad(regs: Registration[] | undefined): AtgardskoBevakningRad | null {
417    const antal = antalBehoverAtgard(regs);
418    return antal === 0 ? null : { typ: 'atgardsko', antal };
419  }
```

`antalBehoverAtgard`/`behoverAtgard`, `src/components/registrations/registration-display.ts:24-34`:

```text
24  export function behoverAtgard(reg: Pick<Registration, 'eventmatchning'>): boolean {
25    return (
26      reg.eventmatchning === Eventmatchning.AVVIKER ||
27      reg.eventmatchning === Eventmatchning.UTAN_EVENT
28    );
29  }
32  export function antalBehoverAtgard(regs): number {
34    return regs.filter(behoverAtgard).length;
35  }
```

`regs` = `registrationsQuery.data`, dvs. ALLA anmälningar (event-lösa hämtningen,
`src/components/hem/Hem.tsx:233-239`, `useDashboardRegistrations` i
`src/components/hem/useDashboardData.ts:56-64`) — pollas var 60:e sekund,
`staleTime` 30 s, så talet är i praktiken alltid färskt (ingen "basen släpar"-typ
av eftersläpning som på betalningssidan).

Klicket navigerar till `/mer/anmalningar?visa=atgardskon`
(`src/components/hem/Bevakningsrad.tsx:120`), som filtrerar SAMMA predikat
(`AnmalningarSida.tsx:452`: `visaAtgardskon ? registrations.filter(behoverAtgard) : ...`)
— samma tal, samma källa, ingen dubblering (bekräftat med bred grep: ingen annan
"kräver åtgärd"-text eller badge finns i Mer-menyn eller på inkorgen).

`eventmatchning` självt är ett Airtable-formelfält på anmälan (`Anmälningar.Eventmatchning`,
`src/domain/types/Status.ts:161-178`, ADR-122 beslut 3), som jämför anmälans EGEN
inskickade text (`Datum`/`Ort`/`Event (namn)` från formuläret) mot det LÄNKADE
eventets facit (`Ort (from Event)`/`Kurs (from Event)`/`Datum (from Event)`),
normaliserat mot tre kända formateringsklasser (skiftläge, mellanslag runt
tankstreck, upprepat årtal vid månadsskifte). Exakt tre värden: `OK` / `Avviker` /
`Utan event`; tomt jämförelsefält ger ALDRIG `Avviker` (ADR-122 beslut 4).

### AVGÖRANDE DATAFÄLT (för en prod-uppslagning)

| Tabell | Fält | Räknas med i "8" när |
|---|---|---|
| `Anmälningar` | `Eventmatchning` (formel) | `= "Avviker"` ELLER `= "Utan event"` |

Konkret återskapning: filtrera `Anmälningar` på `Eventmatchning != "OK"` (Airtable
`filterByFormula`). Det ÄR hela urvalet — inget ytterligare villkor (inget
event-, datum- eller statusfilter) läggs på av `behoverAtgard`.

### KLASSNING

**Designval som mäter en genuin datakvalitetsfråga** — Eventlänkens vakt
(ADR-122) är byggd EXAKT för att fånga anmälningar vars länkade event inte
stämmer med vad personen fyllde i, eller som saknar länk helt. Räknaren själv är
korrekt implementerad och delad (samma predikat på Hem och på
`/mer/anmalningar`), så "8" är sannolikt en verklig avspegling av 8 rader i
basen just nu — MEN formelfältet har en dokumenterad historik av falska
positiver från formateringsartefakter: `tasks/todo.md` (S118-block, ~rad 415-421)
citerar ett kontrollsvep 2026-08-22 där **5 Avviker mot väntat 4** visade sig bero
på URL-kodade mellanslag i ett datumfält ("Event-18:s falska positiv"), åtgärdat
punktvis i data, inte i formeln. Det betyder att en delmängd av "8" KAN vara
skräp från inmatning/import snarare än riktiga felkopplingar — går inte att
avgöra utan att faktiskt läsa de 8 raderna.

**Ej samma räknare som TASK-368.1** (kollat på uppdrag): den kortet gäller
"Antal anmälningar"/"Är aktiv" PER EVENT (utesluter Avbokad/Ombokad/Inställt från
event-kortens deltagarantal) — en helt annan Airtable-formel
(`Är aktiv (1/0)`, `fld4j7PeckDViTdIB`/prod `fldO9pTic9Mm8G6P4`-familjen) och
rör inte `Eventmatchning`. Nämns här bara för att utesluta den som förklaring,
inte för att den är relevant.

### ÅTGÄRDSRIKTNING

Golv: läs de 8 raderna direkt (`Anmälningar` där `Eventmatchning != "OK"`), och
för var och en jämför anmälans `Datum`/`Ort`/`Event (namn)` mot det länkade
eventets facit — separera "riktig felkoppling" (kräver Lottas hand, A1:s flöde)
från "formateringsartefakt" (samma klass som Event-18-fallet). Ingen kodändring
är indikerad förrän den uppdelningen är gjord — detta är en datafråga, inte en
buggfråga, såvida inte genomläsningen visar en NY formateringsklass formeln
missar (då är det en ADR-122-uppföljning, inte en snabbfix).

---

## Källor lästa (huvudkatalogen, `main`)

**Kod:**
`src/components/betalningar/BetalningsInkorg.tsx` (rad ~2480-2840),
`src/components/betalningar/inkorg-harledningar.ts` (helfil, ~1-440),
`src/components/betalningar/bekraftelsesteg-harledningar.ts` (~140-440),
`src/components/betalningar/prototype/VariantC.tsx` (~100-720, ~850-960),
`src/components/betalningar/prototype/radfalt.tsx` (grep),
`src/components/betalningar/RegistreratNuBlock.tsx` (~440-600),
`src/domain/schemas/Betalningar.schema.ts` (~160-200),
`supabase/functions/hamta-oppna-betalningar/index.ts` (~460-510),
`src/components/registrations/registration-display.ts` (helfil),
`src/components/hem/hem-derivations.ts` (~270-420),
`src/components/hem/Bevakningsrad.tsx` (~1-260),
`src/components/hem/Hem.tsx` (~180-250),
`src/components/hem/useDashboardData.ts` (helfil),
`src/domain/types/Status.ts` (~150-180).

**Kort (via `npm run bl -- task <id> --plain`):** TASK-402.8, TASK-422, TASK-368.1,
TASK-346.15.

**ADR:** ADR-122 (rubriker/struktur), ADR-126 (intro, ej djupt relevant),
ADR-128/129/130 (namn/relevans-koll, ej djupt relevant för dessa tre observationer).

**Sessionsdok/todo:** `tasks/sessions/2026-09-04-session-121.md` (~500-590),
`tasks/sessions/2026-08-31-session-114.md` (~295-330), `tasks/todo.md`
(riktade grep-träffar: rad ~18, ~72, ~405-421).

**Facit/tester (sökt, inga träffar av intresse utöver det citerade):**
`tasks/sessions/bilagor/s113-346-6-inkorgen/` (bara PNG, ingen `facit.json` —
inkorgens kort är EJ facit-stämplade), `.facit-policy.conf` (ingen Betalningsinkorg-
markör), `tests/api/bekraftelsesteg-harledningar.test.ts` (avgifts-kandidat-tester),
bred grep i `tests/` efter `BetalningsInkorg`/`RadInnehall`/`obekraftad`/höjd-mätning.

## Vad jag INTE kunde verifiera

- **Prod-data för de fyra markerade personerna i O2** (exakta värden på
  `anmalningsavgift`/`avgiftKvar`/`kvar`/`Status`) — kräver Airtable-uppslagning
  mot prod, vilket detta read-only-pass varken har åtkomst till eller får försöka.
- **Sammansättningen av de 8 "Avviker"/"Utan event"-raderna i O3** — samma skäl;
  kan inte avgöra hur många som är riktiga felkopplingar kontra
  formateringsartefakter utan att läsa raderna i basen.
- **Om O1/O2 faktiskt är samma fyra personer / samma rader** — endast Marcus
  vet vilka fyra han markerade; jag har bara kodens (obevisade) koppling mellan
  fälten.
- Att `tasks/sessions/bilagor/s121-bekraftelsesteget-konvergens/facit.json` finns
  och är stämplad för VariantC antas utifrån TASK-402.8:s kort-text (`godkand:
  null` vid skivans start) — filen själv öppnades inte (bedömdes utanför scope
  för just dessa tre observationer, som gäller inkorgens kort och
  bulkregistreringens knapplogik, inte facit-bildernas exakta pixelinnehåll).

## Git status (huvudkatalogen `/Users/marcus/Repon/miranon-media-admin`)

```text
$ git rev-parse --show-toplevel
/Users/marcus/Repon/miranon-media-admin
$ git branch --show-current
main
$ git status --porcelain
(tomt — rent träd, 0 rader)
```

Inga ospårade filer i huvudkatalogen från andra pass vid tidpunkten för detta
pass. (Sessionens egen worktree, `.claude/worktrees/s127-docs`, är en separat
checkout för ett annat kort och rördes inte av detta read-only-pass.)
