# Amendering 2026-09-03 — Avbokningssteget tillkommer på anmälans detaljsida (TASK-368.3)

> **Varför denna sidofil, och varför i DENNA katalog.** Anmälans detaljsida
> (`src/components/registrations/AnmalanDetail.tsx`) är Marcus-låst sedan
> Session 83 — *"Lås den"*, 2026-07-24
> (`tasks/sessions/archive/2026-07/2026-07-24-session-83.md` Del 4) — med
> facit-bilagorna `k04.png` (bekräftad) och `k04-obekraftad.png` i denna
> katalog. Låsningen är alltså ÄLDRE än `ADR-102`s manifest-mekanik och har
> därför **ingen `facit.json`**. Bokföringsformen för en ändring på en låst
> yta är ändå densamma (`ADR-102` § Updates 2026-08-22 § A3): en
> `AMENDERING-<datum>-<slug>.md` bredvid ytans facit-material, med utskriven
> klassning.

## FÖRST: en premiss i uppdraget var fel, och den rättas öppet här

`TASK-368.3` AC #1 och orkestrerar-uppdraget säger båda att anmälans sida är
facit-stämplad via
`tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json`, ytan
`anmälningssidan`, sju bilder.

**Det stämmer inte, och det är mätt, inte gissat** (2026-09-03, mot
`origin/main` `b391dffe`):

```bash
node -e "const f=require('./tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json');
         console.log(f.ytor[0].yta, f.ytor[0].kallor)"
# anmälningssidan [
#   'src/components/dev/anmalningar-prototyp/VariantB.tsx',
#   'src/components/primitives/FilterRad.tsx',
#   'src/components/events/EventValjare.tsx',
#   'src/components/hem/hem-derivations.ts'
# ]

grep -l "AnmalanDetail" tasks/sessions/bilagor/*/facit.json   # exit 1, noll träffar
```

Ytan `anmälningssidan` i S111-manifestet är **anmälnings-LISTAN**
(`/mer/anmalningar`, scanlistan ur variant B), inte anmälans detaljsida. Dess
sju bilder heter `facit-anmalningssidan-{lista,atgardskon,tomt}-*` plus
`-filterpanel-desktop` — samtliga av listytan. `AnmalanDetail.tsx` förekommer
inte i något `facit.json` i repot.

**Uppdragets REGEL bär ändå:** ytan ÄR Marcus-låst, ändringen ÄR en klass
(c)-utvidgning, och den ska bokföras i en sidofil med utskriven klassning och
lämnas till Marcus för omstämpling. Det är exakt det denna fil gör — mot
S83-facitet, som är ytans faktiska lås. Endast KATALOGEN skiljer sig från
uppdragets anvisning. (Divergensen rapporteras även i PR-kroppen och i kortets
Implementation Notes, per `ADR-086`.)

## Yta och lås

| | |
|---|---|
| **Yta** | Anmälans detaljsida, `/event/$eventId/anmalan/$registrationId` |
| **Komponent** | `src/components/registrations/AnmalanDetail.tsx` (task-18.17) |
| **Lås** | Marcus, 2026-07-24, citat *"Lås den"* (S83 Del 4, efter tre iterationsvarv) |
| **Facit-material** | `k04.png` (bekräftad) · `k04-obekraftad.png` (obekräftad + åtgärd) i denna katalog |
| **Manifest** | **Saknas** — låsningen föregår `ADR-102`s `facit.json`-mekanik |
| **Mekaniskt lås** | **Inget.** `scripts/check-facit.sh` känner inte ytan (den läser bara `facit.json`-manifest), så ingen grind fäller på denna ändring. Bokföringen är alltså det enda som finns; skriv aldrig om den raden till att påstå en spärr (`ADR-083`). |

## Avvikelse: en ny grupp SIST på sidan

Sidan bar nio grupper i fast ordning: header → Kontakt → Avser → Betalningar →
Uppgifter → Ansökningssvar → Inkom → Interna noteringar → Händelser.

**Tillkommer:** en tionde grupp, `Avbokning`, EFTER Händelser
(`src/components/registrations/AvbokningsYta.tsx`). Den innehåller

- för en AKTIV anmälan (Obekräftad · Bekräftad (mail skickat) ·
  Betalningspåminnelse skickad): en rad med förklarande text och knappen
  **Avboka anmälan** i sekundär destruktiv ton (`intent="danger"
  emphasis="outline" size="sm"`);
- ett **bekräftelsesteg som öppnas på plats** när knappen trycks: förklarande
  text, ett frivilligt fritextskäl (`TextArea`, fokus landar där), personens
  betalläge (endast bakom miljöflaggan `VITE_FEATURE_BETALNINGAR`, se nedan),
  och knappraden Avbryt · Avboka anmälan;
- för en AVBOKAD anmälan: en rad med knappen **Återta avbokning**.

Gruppen renderas **inte alls** för statusarna `Inställt` och
`Flytta till väntelista` — S83-regeln att avvikande anmälningar inte bär
åtgärder står kvar, med återtagandet som enda undantag.

**Placeringen är vald för att minimera amenderingen, inte som ett designval
om läsordning.** Sist är den enda position som lämnar samtliga låsta grupper
på exakt sina platser; varje annan insättning hade flyttat allt under sig.
Att åtgärdsgruppen därmed står efter en passiv tidslinje är en känd svaghet
och en **öppen fråga till Marcus vid omstämplingen** — inte något denna skiva
avgjort på egen hand.

**Marcus-grunden för att ytan över huvud taget ändras:** PRD `TASK-368` beslut
2 (grillad samsyn, `tasks/sessions/2026-09-03-session-115.md` Del 3, elva
beslut slutkvitterade *"Kvitterar syntesen, kör vidare"*): *"'Avboka anmälan'
på anmälans egen sida, sekundär destruktiv ton, bekräftelsesteg. Inte på
Åtgärds-sidan (den är byggd för mail till många)."*

## Klassning: **(c)** — formen ändras faktiskt, prod-synligt

`ADR-102` § A2 steg 2: **påverkar ändringen vad en användare ser i prod?**

**Ja.** Lotta ser en tionde grupp med rubriken "Avbokning" och en knapp som
inte fanns förut, och för en avbokad anmälan en knapp där sidan tidigare var
helt åtgärdslös. Det är ingen fixtur- eller miljöartefakt (`ADR-102` § A2
skärpning 1) utan en avsiktlig utvidgning av formen.

`ADR-102` § A4 är dessutom uttrycklig om just detta fall: *"En utvidgning AV
formen är klass (c) och avgörs av Marcus, inte av B1."* Osäkerhetsregeln
("osäkert ⇒ klass (c)") pekar åt samma håll och hade gett samma svar.

**Mätningen som klassningen vilar på** (hermetisk fixturvärld,
`tests/acceptance/anmalan-avbokning.acceptance.test.ts`, 9/9 gröna
2026-09-03): för statusarna `Obekräftad`, `Bekräftad (mail skickat)` och
`Betalningspåminnelse skickad` renderas rubriken `Avbokning` med knappen
`Avboka anmälan`; för `Avbokad/Ombokad` med knappen `Återta avbokning`; för
`Inställt` och `Flytta till väntelista` renderas rubriken inte alls
(`toHaveCount(0)`). Fyra av basens sex statusvärden ger alltså en synlig
skillnad mot facit-bilderna.

## Vad som INTE är amenderat

- **Facit-bilderna `k04.png` och `k04-obekraftad.png` är INTE omtagna.** De
  visar sidan utan den nya gruppen och är därmed en generation bakom i exakt
  ETT avseende: de saknar Avbokning-gruppen längst ned. Allt de visar ovanför
  den är oförändrat. Bilderna byts när Marcus stämplar om, inte av en agent.
- **Ingen av de nio befintliga grupperna är rörd** — inte header,
  statusbadgens tre former, Kontakt med sin bekräfta-åtgärd, Avser med den
  härledda behörigheten, Betalningar med deadline-pillen, Uppgifter,
  Ansökningssvar, Inkom eller Händelser. Ingen rad har bytt plats, ordning
  eller ordval.
- **Betalningar-gruppens innehåll är oförändrat för Lotta.**
  `AterbetalningsYta` har fått en frivillig `triggerId`-prop och
  `AnmalansBetalningar` skickar ned den, men propen sätter enbart ett DOM-`id`
  på en knapp som redan fanns; ingen text, position eller ton ändras.
- **Interna noteringar-gruppen är oförändrad i FORM.** Att dess innehåll växer
  med en datumstämplad rad efter en avbokning är serverns Notering-append
  (`TASK-368.2`), inte en formändring här.
- **Inga `ariaSnapshot`-referenser berörs.** Ytan har inga
  (`tests/visual/__aria__/` innehåller ingen post för anmälans detaljsida —
  disk-verifierat 2026-09-03), och de snapshots som nämner `/anmalan/` tillhör
  eventsidan och persondetaljen, där bara länk-`href`:ar förekommer.
- **`S111`-manifestet är inte rört.** Det gäller en annan yta (se § FÖRST
  ovan); dess `godkand`, bilder och `referenser: []` står orörda.

## Gränser i det som byggdes, öppet deklarerade

- **Betalläget i steget ligger bakom miljöflaggan `VITE_FEATURE_BETALNINGAR`**
  och saknar därför acceptans-täckning: `playwright.config.ts` sätter flaggan
  till `'av'` för hela den delade acceptance-webServern, och fixturvärlden bär
  inga betalnings-EF-mockar. Själva avboknings- och återtagningsknapparna är
  ALDRIG flaggade. Samma öppna läge som `AnmalansBetalningar` (`TASK-346.7`)
  redan står i.
- **Den direkta vägen till "Registrera återbetalning"** bor i samma flaggade
  block och delar därmed samma täckningsgräns.
- **Ombokningsvalet och väntelistepåminnelsen** (PRD beslut 7 och 9) byggs
  INTE här — de tillhör `TASK-368.5` och blir en egen amendering.

## Omstämplings-läge

**Kvitterad 2026-09-04** — se § Omstämpling — kvitterad 2026-09-04 nedan.
Inget stämpel-fält är rört av denna eller den kvitterande commiten — ytan har
inget manifest att röra, och `S111`-manifestets `godkand` står kvar orört med
sin 2026-08-23-kvittens och sha `cb7ad681`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter denna commit
(mätt 2026-09-03).

## Omstämpling — kvitterad 2026-09-04

**Marcus kvittens, klartext i chatten:**

> "Avboka och boka om, godkänt i staging 2026-09-04."

**Vad som QA:ades:** `TASK-368.6` steg 1–8 i staging (avboka, återta, boka om
till samma/dyrare/billigare pris, betalläge, felläge, mobil) på
granskningsfixturen `ZZ-GRANSKNING-S119`.

**Kanalen:** ytan saknar `facit.json`-manifest (§ Yta och lås ovan), så
`npm run facit:godkann` har ingen post att skriva mot — kvittensen gavs
därför i klartext i chatten (S119, till orkestreraren) i stället för via
kommandot. Ett första försök att bokföra den maskinellt gick mot FEL yta: PR
`#2294` skrev om `s111-anmalningssidan-konvergens/facit.json`
(anmälnings-LISTAN, se § FÖRST ovan) i stället för denna sida, och stängdes
2026-09-04 utan att landa — `s111`:s stämpel (2026-08-23, `godkand.sha`
`cb7ad681…`) står orörd. Kvittensens innehåll är oberoende av den felriktade
kanalen: Marcus godkände i klartext den amenderade detaljsidan, vilket är
exakt vad klass (c) väntar på för en yta utan manifest (`ADR-102` § Updates
2026-08-22 § A3, tabellraden "Omstämplings-läge").

**Facit-bilderna `k04.png`/`k04-obekraftad.png` är fortsatt INTE omtagna** —
kvittensen godkänner formen, den tar inte nya bilder.
