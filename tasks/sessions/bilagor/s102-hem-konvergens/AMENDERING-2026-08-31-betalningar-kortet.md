# Amendering 2026-08-31 — Hem-kortet Betalningar ersätter Förfallna betalningar (TASK-346.7)

**Yta:** hem-vyn V1 "Lugna morgonen", facit låst i S102
(`tasks/sessions/bilagor/s102-hem-konvergens/facit.json`, Marcus 2026-08-17:
*"Hem-vyn ser bra ut, precis som prototypen."*, stämpel-SHA `8044e5b6`).
Skarp källa i dag: `src/components/hem/Hem.tsx` +
`src/components/hem/ForfallnaBetalningar.tsx`.

**Klass:** *ny form, förhandsmandat S113 Del 11 (B3)* — PRD `TASK-346`
§ Ytorna (beslut 10) och § Inkorgen och formuläret.

---

## FÖRST: vad grinden faktiskt kan se — mätt, inte antaget

`scripts/check-facit.sh` **kan inte fälla den här ändringen**, med eller utan
denna sidofil. Två oberoende skäl, båda mätta på denna gren:

**1. Ytan saknar `referenser`-nyckeln.** Innehållslåset (invariant d) hoppas
över helt för en yta som inte deklarerar den — `scripts/lib/facit-validera.mjs`
lindar hela blocket i `if ('referenser' in yta)`. Grinden NAMNGER i stället
frånvaron på stderr:

```text
⚠️  tasks/sessions/bilagor/s102-hem-konvergens/facit.json · ytan "hem-vyn V1 …"
    — saknar nyckeln "referenser"
⚠️  23 av 27 stämplade ytor saknar innehållslås.
```

Endast fem manifest i repot bär nyckeln (`s108-dokumentytan`,
`s108-generering`, `s109-meddelandefamiljen-konvergens`,
`s109-uppdateringsnotis-konvergens`, `s111-anmalningssidan-konvergens`) —
mätt med `grep -rln '"referenser"' tasks/sessions/bilagor/*/facit.json`.
Backfillen är `TASK-288`, ett Marcus-moment (ADR-104-hooken fryser ett
stämplat manifest), och kan inte utföras av en agent.

**2. Manifestets `kallor` pekar på RIVET prototyp-substrat.** De sex källorna
är `src/routes/dev/hem-prototyp.tsx` och `src/components/dev/hem-prototyp/*`,
alla borta sedan promoveringen. Grinden accepterar frånvaron via
rivnings-klausulen och skriver ut den vid varje körning:

```text
tasks/sessions/bilagor/s102-hem-konvergens/facit.json · ytan "hem-vyn V1 …"
  · src/routes/dev/hem-prototyp.tsx — riven efter stämpeln 8044e5b6
```

Manifestet refererar alltså **inte** den skarpa Hem-koden. En ändring i
`Hem.tsx` är osynlig för grinden per konstruktion.

**Följden:** detta dokument är **bokföring**, inte den grind-tvingade sidofil
`ADR-102` § A3 beskriver. Formen följs ändå — nästa läsare av den här
katalogen ska hitta ändringen där hen letar. Uppdraget till denna skiva
förutsatte att grinden skulle fälla diffen utan sidofil; den premissen är
**falsifierad** och rapporterad i stället för byggd vidare på.

---

## Vad som ändrades

Blockposition 4 i Morgonkollen är nu ett **val** mellan två kort, styrt av
miljöflaggan `betalningarPa()` (`src/lib/funktionsflaggor.ts`):

| Flaggan | Block 4 |
|---|---|
| **AV** (prod i dag) | `ForfallnaBetalningar` — **oförändrad**, samma props, samma svep |
| **PÅ** (dev/staging) | `BetalningarKort` — nytt (`src/components/hem/BetalningarKort.tsx`) |

Växeln är skriven som ETT ternärt uttryck och inte som två villkorade block,
just för att de två korten aldrig ska kunna renderas samtidigt: PRD:n säger
*"ersätter dagens kort … (inte ovanpå det)"*.

**Det nya kortets innehåll**, per PRD § Inkorgen och formuläret:

- `h2` "Betalningar"
- `N öppna · M förfallna · K kvitton att skicka`
- Länken **Registrera betalning** → `/mer/betalningar`
- Knappen **Skicka påminnelse till alla** (befintlig `BulkAtgardsknapp`,
  samma `onSkickaPaminnelseAlla`, samma urval — AC #1: *befintlig funktion,
  flytta eller återanvänd, riv inte*)
- Ett jobb-besked när ett kvittojobb fortfarande **arbetar**

## Vad som FÖRSVINNER med det gamla kortet — och som är en fråga för dig

Detta är amenderingens tyngsta punkt, och den är medvetet inte utjämnad.

Det gamla kortet bar en-påminnelse-modellens **tre tillståndsgrupper**
(S102 Del 10 beslut 7–8):

1. **Att påminna** — rader utan skickad påminnelse, med bulk-knappen.
2. **Väntar** — påminnelse skickad för mindre än sju dygn sedan.
3. **Dags att ringa** — påminnelse skickad för minst sju dygn sedan, med
   **telefonnummer** och **personens notering per avgiftstyp**, i den
   konstaterande copy du själv formulerade (*"Påmind {datum} · obetald"*).

PRD:ns nya kort bär **tre tal och två knappar**. Grupperna har ingen
motsvarighet i det.

- De öppna betalningarna finns kvar i inkorgen (`/mer/betalningar`), grupperade
  per event och märkta `Förfallen` per rad.
- **"Dags att ringa" har ingen motsvarighet någonstans.** Raden med
  telefonnumret till den som fått sin påminnelse och ändå inte betalat
  försvinner ur appen när flaggan slås på.

Skivan bygger PRD:ns form, eftersom det är vad `TASK-346.7` AC #1 säger.
Att i stället behålla grupperna under det nya kortet vore en **formändring
utöver mandatet** — och att tyst tappa dem vore värre. Frågan läggs därför
här, för morgongranskningen.

## En ordval-divergens, liten men värd att se

Hem säger `K kvitton att skicka` (AC #1:s ordalydelse). Inkorgens rubrik säger
`K kvitton i kö` om **samma tal** (`sammanfattaBetalningar().kvittonAttSkicka`
— summan av `OppenBetalning.kvittonAttSkicka`, alltså jobbrader i läge
`vantar`/`pagar`).

Båda är sanna. Att de skiljer sig är inte avsiktligt utan en följd av att AC:n
och den landade inkorgen valde olika ord; 346.6:s yta lämnades orörd hellre än
att jag ändrade en landad formulering på eget bevåg. Välj en av dem i
morgongranskningen.

## Vad som INTE ändrats

- **Blockordningen** — hälsning → Nästa event → Bevakningsrad → Nya
  anmälningar → **block 4** → Genvägar → Senaste aktivitet. Oförändrad.
- **Påminnelsesvepet i sin helhet** — `paminnelseRader`,
  `paminnelsesvepUrval`, `paminnelseAvgiftstyperByRegId`, `SvepOverlay` och
  `nyligenPaminda` är orörda i `Hem.tsx`. Bara *var* knappen sitter ändras.
- **Knappen renderas fortfarande bara när det finns någon att påminna.**
  `harPaminnelser={paminnelseRaderList.length > 0}` bevarar den invariant
  `tests/acceptance/svep-paminnelse-send.acceptance.test.ts` § *"tomt urval
  strukturellt onåbart via UI"* bevisar mekaniskt.
- **Laddläget** följer hemmets egen anatomi (`role="status"` + `aria-busy` +
  exakt ett `.sr-only` som börjar med "Laddar" + `aria-hidden`-skelett), så
  `hem-laddlage.acceptance.test.ts`s blockräkning håller den dag flaggan slås
  på i fixturvärlden.
- **`ForfallnaBetalningar.tsx` är byte för byte orörd.** Den kända
  facit-defekten i dess `ForfallenRadInnehall` (namnkolumnen som kläms till
  ~1,7 px av en `shrink-0`-badge på mobil, bokförd i filens eget docblock)
  är alltså varken lagad eller förvärrad här.

## Testerna

`tests/acceptance/hem.acceptance.test.ts`, `hem-laddlage.acceptance.test.ts`
och `svep-paminnelse-send.acceptance.test.ts` kör med flaggan **`av`**
(`playwright.config.ts` § `VITE_FEATURE_BETALNINGAR: 'av'` i fixturvärldens
webServer-gren), så de ser det gamla kortet och är **opåverkade**. Det är
config-radens uttalade avsikt: dess egen kommentar säger att `TASK-346.6/346.7`
flippar raden när deras ytor faktiskt testas i den klassen — vilket kräver
betalnings-EF-mockar i `tests/support/fixturvarld/handlers.ts` **och** ett
svar på WebSocket-vakten (`JobbLyssnare` sitter i skalet; utan flaggan `av`
föll mätt 48 av 48 autentiserade acceptance-tester). Ingetdera byggs i denna
skiva, och raden lämnas därför orörd.

Nya härledningar prövas i stället hermetiskt i
`tests/api/betalningar-ytor.test.ts` (22 fall, var och en med negativ
kontroll — PRD DoD #5).

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-17-kvittens och SHA `8044e5b6`
(`scripts/deny-facit-godkand-skrivning.sh` fäller varje agent-skrivning mot
ett stämplat manifest ändå).

`bash scripts/check-facit.sh` → **exit 0**, före och efter denna ändring.
