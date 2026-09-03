# Amendering 2026-09-03 — Ombokningssteget och väntelistepåminnelsen tillkommer på anmälans detaljsida (TASK-368.5)

> **Varför denna sidofil, och varför i DENNA katalog.** Samma skäl som
> [`AMENDERING-2026-09-03-avbokningssteget.md`](AMENDERING-2026-09-03-avbokningssteget.md)
> (`TASK-368.3`) bredvid: anmälans detaljsida
> (`src/components/registrations/AnmalanDetail.tsx`) är Marcus-låst sedan
> Session 83 — *"Lås den"*, 2026-07-24
> (`tasks/sessions/archive/2026-07/2026-07-24-session-83.md` Del 4) — med
> facit-bilagorna `k04.png` och `k04-obekraftad.png` i denna katalog.
> Låsningen föregår `ADR-102`s manifest-mekanik och har därför **ingen
> `facit.json`**; bokföringsformen för en ändring på en låst yta är ändå
> densamma (`ADR-102` § Updates 2026-08-22 § A3): en
> `AMENDERING-<datum>-<slug>.md` bredvid ytans facit-material, med utskriven
> klassning.

## FÖRST: samma premissfel i kortet, verifierat en gång till

`TASK-368.5` AC #1 och DoD #4 pekar båda på
`tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json`, ytan
`anmälningssidan`. Det är fel yta — exakt samma fel som `TASK-368.3` bar, och
det är redan mätt och rättat i den föregående amenderingen (§ FÖRST där, med
kommandona som fällde det).

Verifierat om mot `origin/main` `74ef41e1` (2026-09-03), samma två kommandon:

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

S111-manifestets `anmälningssidan` är anmälnings-LISTAN (`/mer/anmalningar`);
`AnmalanDetail.tsx` förekommer inte i något `facit.json` i repot. **Uppdragets
REGEL bär ändå:** ytan ÄR Marcus-låst, ändringen ÄR en klass (c)-utvidgning,
och den bokförs här mot S83-facitet — ytans faktiska lås. Endast KATALOGEN
skiljer sig från kortets anvisning. Divergensen står även i PR-kroppen och i
kortets Implementation Notes (`ADR-086`).

## Yta och lås

| | |
|---|---|
| **Yta** | Anmälans detaljsida, `/event/$eventId/anmalan/$registrationId` |
| **Komponent** | `src/components/registrations/AnmalanDetail.tsx` (task-18.17) |
| **Lås** | Marcus, 2026-07-24, citat *"Lås den"* (S83 Del 4) |
| **Facit-material** | `k04.png` (bekräftad) · `k04-obekraftad.png` (obekräftad + åtgärd) |
| **Manifest** | **Saknas** — låsningen föregår `ADR-102`s `facit.json`-mekanik |
| **Mekaniskt lås** | **Inget.** `scripts/check-facit.sh` känner inte ytan (den läser bara `facit.json`-manifest), så ingen grind fäller på denna ändring. Bokföringen är det enda som finns; skriv aldrig om den raden till att påstå en spärr (`ADR-083`). |

## Avvikelse 1: en TREDJE knapp och en andra vy inuti Avbokning-gruppen

Avbokningsgruppens bekräftelsesteg (`AvbokningsYta.tsx`, tillagd av `368.3`,
själv en klass (c)-amendering) bar tre element i sin knapprad-region: en
förklarande text, ett frivilligt skäl, betalläget (flaggat) och knappraden
**Avbryt · Avboka anmälan**.

**Tillkommer:**

- En **tredje knapp** sist i knappraden: **Boka om till annat event**
  (`intent="secondary" size="sm"`). Placeringen SIST är uppdragets och
  bevarar `368.3`:s APG-form orörd — Avbryt först och närmast till hands, den
  destruktiva näst, alternativet sist. Mätt i acceptanssviten: knapp 0 =
  "Avbryt", 1 = "Avboka anmälan", 2 = "Boka om till annat event".
- En **andra vy** som ERSÄTTER avbokningsformen när knappen trycks
  (`OmbokningsSteg.tsx`): en egen `<fieldset>` med `<legend class="sr-only">`
  *"Boka om anmälan för `<namn>` till ett annat event"*, innehållande husets
  `EventValjare` i `form="fristaende"` (kommande event, default-omfattningen),
  en **läsbar** skälrad, en mening om vad som händer med pengarna,
  väntelistepåminnelsen, en felrad och knappraden **Avbryt · Boka om
  anmälan**.
- **Väntelistepåminnelsen** (`VantelistePaminnelse.tsx`) i BÅDA
  bekräftelsestegen, mellan betalläget och felraden: *"N personer väntar på
  plats."* plus länken *"Öppna väntelistan"* (`/mer/vantelista`). Raden
  uteblir helt när talet är noll eller okänt.

Gruppen renderas fortsatt **inte alls** för statusarna `Inställt` och
`Flytta till väntelista` — S83-regeln står kvar oförändrad.

## Avvikelse 2: en TRANSIENT ruta OVANFÖR de nio låsta grupperna

`TASK-368.3` valde SIST för sin grupp därför att det var den enda position som
lämnade samtliga låsta grupper på exakt sina platser. **Ombokningskvittot
(`OmbokningsKvitto.tsx`) står i stället FÖRST**, direkt efter headern och före
Kontakt-gruppen — en `MessageBox intent="success"` med rubriken *"Anmälan är
ombokad till `<event>`"*, prisskillnadstexten, och (bakom betalningsflaggan)
en knapp till Registrera betalning respektive Registrera återbetalning.

**Att den positionen ändå inte flyttar något permanent är hela argumentet:**
rutan renderas ENDAST direkt efter en ombokning (kvittot bärs i navigeringens
history-state, `mmOmbokningsKvitto`), och på varje annan laddning av sidan
returnerar komponenten `null` — då står Kontakt exakt där facit har den. Ett
kvitto Lotta hade behövt rulla till sidans botten för att hitta vore inte
*"ett kvitto i klartext"* (kortets AC #2).

**Öppen fråga till Marcus vid omstämplingen:** om ett transient meddelande
överhuvudtaget får stå ovanför de låsta grupperna, eller om det ska in i
Avbokning-gruppen längst ned trots synlighetskostnaden. Denna skiva har valt
synligheten och bokför valet i stället för att avgöra det.

## Klassning: **(c)** — formen ändras faktiskt, prod-synligt

`ADR-102` § A2 steg 2: **påverkar ändringen vad en användare ser i prod?**

**Ja.** Lotta ser (1) en tredje knapp i avbokningssteget som inte fanns förut,
(2) en helt ny vy med en eventväljare när hon trycker den, (3) en
väntelisterad i avbokningssteget när eventet har väntande, och (4) en
kvittoruta högst upp på den nya anmälans sida efter en ombokning. Inget av det
är en fixtur- eller miljöartefakt (`ADR-102` § A2 skärpning 1) utan en
avsiktlig utvidgning av formen.

`ADR-102` § A4 är uttrycklig om just detta fall: *"En utvidgning AV formen är
klass (c) och avgörs av Marcus, inte av B1."* Osäkerhetsregeln ("osäkert ⇒
klass (c)") pekar åt samma håll.

**Mätningen som klassningen vilar på** (hermetisk fixturvärld,
`tests/acceptance/anmalan-ombokning.acceptance.test.ts`, **16/16 gröna**
2026-09-03, plus `anmalan-avbokning` + `anmalan-detalj` **16/16 gröna** som
regressionskontroll):

- knappraden i avbokningssteget har tre knappar i den ordning som anges ovan;
- ombokningsvyn ersätter avbokningsformen (`toHaveCount(0)` på både
  avbokningens grupp och dess skälfält);
- skälraden lyder ordagrant `Ombokad till <eventnamn>, <ISO-datum>`;
- kvittot syns på den NYA anmälans URL och aldrig på den gamlas;
- väntelisteraden visas vid 3 väntande och uteblir helt vid 0;
- `axe` **0 violations** i ombokningssteget och i kvittot, på 1280 px och
  768 px.

## Vad som INTE är amenderat

- **Facit-bilderna `k04.png` och `k04-obekraftad.png` är INTE omtagna.** De är
  nu en generation bakom i TVÅ avseenden (Avbokning-gruppen från `368.3`, och
  denna skivas tillägg). Bilderna byts när Marcus stämplar om, inte av en
  agent.
- **Ingen av de nio ursprungliga grupperna är rörd** — inte header,
  statusbadgens tre former, Kontakt, Avser, Betalningar, Uppgifter,
  Ansökningssvar, Inkom, Interna noteringar eller Händelser. Ingen rad har
  bytt plats, ordning eller ordval.
- **Betalningar-gruppens innehåll är oförändrat för Lotta.** `RegistreraYta`
  har fått en frivillig `triggerId`-prop och `AnmalansBetalningar` skickar ned
  den — exakt spegelbilden av vad `368.3` gjorde med `AterbetalningsYta`.
  Propen sätter enbart ett DOM-`id` på en knapp som redan fanns; ingen text,
  position eller ton ändras.
- **Interna noteringar-gruppen är oförändrad i FORM.** Att dess innehåll växer
  med en `[Ombokad …]`-rad efter en ombokning är serverns Notering-append
  (`TASK-368.4`), inte en formändring här.
- **Inga `ariaSnapshot`-referenser berörs.** Ytan har inga
  (`tests/visual/__aria__/` innehåller ingen post för anmälans detaljsida —
  disk-verifierat 2026-09-03, oförändrat sedan `368.3`).
- **`S111`-manifestet är inte rört.** Det gäller en annan yta (§ FÖRST); dess
  `godkand`, bilder och `referenser: []` står orörda.

## Gränser i det som byggdes, öppet deklarerade

- **Skälet är LÄSBART, inte redigerbart** — mot kortets AC #2, som säger
  "(redigerbart)". Serverkontraktet tillåter det inte:
  `RebookRegistrationInput` (`TASK-368.4`, ADR-130) bär ENDAST
  `registrationId` + `nyttEventId`, och `rebook-registration/index.ts` säger
  rakt ut varför — *"INGET `skal`-FÄLT, med avsikt … En fritextparameter hade
  gjort formen valfri och därmed obeständig."* Ett redigerbart fält hade tagit
  emot Lottas text och tyst kastat den. Steget visar i stället den EXAKTA rad
  servern skriver; att den kan vara sann är mätt (samma två Airtable-fält på
  båda sidor, `ombokning-kvitto.ts` § KÄLLPARITETEN). **Avgörs av Marcus:**
  antingen stryks "(redigerbart)" ur AC #2, eller så får EF:en ett `skal`-fält
  i en egen skiva.
- **Prisskillnaden sägs i siffror EFTER bekräftelsen, inte före** — mot
  kortets AC #3, som vill ha den i båda lägena. Ingen klient-läsbar yta bär
  eventets pris: `get-event`/`get-events` returnerar inget prisfält
  (disk-verifierat mot `supabase/functions/_shared/event-map.ts` och
  `src/domain/schemas/Event.schema.ts`, 2026-09-03), och `rebook-registration`
  har inget torrkörningsläge. Steget säger därför vad som HÄNDER med pengarna;
  kvittot säger beloppet, med serverns egna `nyttPris`/`prisskillnad`. **Vägen
  fram är ett serverbeslut** (ett prisfält i `get-event`, eller ett
  torrkörningsläge i EF:en) och tas inte av denna skiva.
- **Knappen till Registrera betalning/återbetalning i kvittot ligger bakom
  miljöflaggan `VITE_FEATURE_BETALNINGAR`** och saknar därför
  acceptans-täckning: `playwright.config.ts` sätter flaggan till `'av'` för
  hela acceptance-webServern, och Betalningar-gruppen (som äger triggern)
  monteras aldrig. Samma öppna läge som `368.3`:s betalläge redan står i.
  PRISSKILLNADSTEXTEN är oflaggad och prövas i full bredd.
- **Väntelistans tal kommer ur `get-event` och hämtas LAT** — bara när ett
  bekräftelsesteg är öppet. Anmälans normalladdning gör alltså fortfarande
  inget `get-event`-anrop, och sidans laddningsbeteende är oförändrat.

## Ett fynd som INTE lagades här

`AvbokningsBetallage.tsx` (`TASK-368.3`) bär rubriken "Betalläge" som `<h4>`
inuti ett steg vars närmaste föregående rubrik är `DetaljGrupp`s `<h2>`. Det
är en `axe`-överträdelse av regeln `heading-order` — samma överträdelse denna
skivas egen `<h4>Skäl</h4>` fick i sin FÖRSTA testkörning, och som här är
rättad till `<h3>`. Betalläget ligger bakom `VITE_FEATURE_BETALNINGAR` och har
därför aldrig prövats av axe. Fyndet är rapporterat till orkestreraren, inte
tyst lagat: filen tillhör betalningsdomänen och ändringen hör hemma i en egen
landning (`ADR-053` § blockerar ej + värdefullt).

## Omstämplings-läge

**Väntar på Marcus omstämpling** (`ADR-104` beslut 1–2), tillsammans med
`368.3`:s amendering — de två gäller samma yta och samma bilder. Inget
stämpel-fält är rört av denna commit: ytan har inget manifest att röra, och
`S111`-manifestets `godkand` står kvar med sin 2026-08-23-kvittens och sha
`cb7ad681`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter denna commit
(mätt 2026-09-03).
