# Amendering 2026-09-03 — Ombokningssteget, väntelistepåminnelsen och prisbeskedet före bekräftelsen tillkommer på anmälans detaljsida (TASK-368.5, TASK-368.7)

> **Denna fil bär TVÅ skivor på samma yta.** `TASK-368.5` lade steget;
> `TASK-368.7` lade prisbeskedet FÖRE bekräftelsen och stängde därmed den
> gräns `368.5` bokförde här (§ Gränser, andra punkten — omskriven, inte
> struken). Ingen ny amenderingsfil skapades: `ADR-102` § A3 klass (c)
> bokför ÄNDRINGEN AV YTAN, och två filer om samma steg hade gjort det
> omöjligt att läsa vad som faktiskt står där i dag.

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
  en **läsbar** skälrad, en **prisruta** (se nedan), väntelistepåminnelsen,
  en felrad och knappraden **Avbryt · Boka om anmälan**.
- **Prisrutan (`TASK-368.7`)**, mellan skälraden och väntelistepåminnelsen:
  samma inramning som skälrutan (`rounded-xl bg-bg-muted p-3`) med rubriken
  **Pris** som `<h3>` — SAMMA rubriknivå som Skäl, och av samma mätta skäl
  (axes `heading-order` fäller ett hopp från `DetaljGrupp`s `<h2>`). Rutan bär
  prisbeskedet i EXAKT kvittots ordalydelse (`prisbesked`, en funktion med två
  anropare) plus raden *"Inbetalningarna som sitter på den här anmälan flyttas
  till den nya. Servern räknar om beloppet vid bekräftelsen."*

  **Rutan står inte alltid framme, och det är avsiktligt.** Beskedets andra
  led är de aktiva inbetalningar som följer med, hämtat ur
  `hamta-inbetalningar` bakom `VITE_FEATURE_BETALNINGAR`. Är summan okänd —
  flaggan av, hämtningen pågår, EF:en föll — visas i stället `368.5`:s
  ursprungliga mening (*"Inbetalningarna … Prisskillnaden räknas ut av servern
  och visas på den nya anmälans sida."*). Att i det läget skicka `null` in i
  `prisbesked` hade gett *"Priset på det nya eventet är inte satt"*, alltså en
  FALSK utsaga om ett event som bevisligen är prissatt. Två skilda okändheter
  får inte säga samma sak.
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
`tests/acceptance/anmalan-ombokning.acceptance.test.ts` — **16/16 gröna** vid
`368.5`, **19/19 gröna** efter `368.7`s tillägg, båda 2026-09-03; plus
`anmalan-avbokning` + `anmalan-detalj` **16/16 gröna** som regressionskontroll
i båda omgångarna):

- knappraden i avbokningssteget har tre knappar i den ordning som anges ovan;
- ombokningsvyn ersätter avbokningsformen (`toHaveCount(0)` på både
  avbokningens grupp och dess skälfält);
- skälraden lyder ordagrant `Ombokad till <eventnamn>, <ISO-datum>`;
- kvittot syns på den NYA anmälans URL och aldrig på den gamlas;
- väntelisteraden visas vid 3 väntande och uteblir helt vid 0;
- `axe` **0 violations** i ombokningssteget och i kvittot, på 1280 px och
  768 px — omkört efter `368.7`s prisruta, med dess `<h3>` på plats;
- prisrutan står INTE framme när inbetalningssumman är okänd, och steget
  påstår då varken ett belopp eller ett osatt pris (`368.7`s eget
  acceptansfall).

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
- ~~**Prisskillnaden sägs i siffror EFTER bekräftelsen, inte före**~~ —
  **STÄNGD av `TASK-368.7` (2026-09-03).** `368.5` bokförde här att ingen
  klient-läsbar yta bar eventets pris och att vägen fram var ett serverbeslut.
  Det beslutet togs: `get-event`/`get-events`/`update-event` bär nu `pris`
  (prisets nivå 2 med Eventinnehåll-standarden som nivå 3, löst med SAMMA
  `valjPris` som serverns egen prisskillnad — `_shared/event-map.ts`
  § EVENTETS PRIS + `_shared/eventpris.ts`), och steget räknar beskedet ur
  `pris` minus de aktiva inbetalningar som följer med. Torrkörningsläget i
  EF:en behövdes aldrig.

  **Vad som ÅTERSTÅR av gränsen, öppet:** beskedet kräver
  inbetalningssumman, som ligger bakom `VITE_FEATURE_BETALNINGAR`. I
  fixturvärlden är flaggan `'av'`, så acceptansklassen kan inte visa
  beskedets tre grenar — de prövas i stället uttömmande mot serverns egen
  härledning i `tests/api/ombokning-prisparitet.test.ts` (**117 fall gröna**
  tillsammans med `event-map.test.ts`, 2026-09-03). Flaggflippen är
  `TASK-346.6/346.7`s arbete, som `playwright.config.ts`s egen rad redan
  pekar ut.
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

## Skuld som `TASK-368.7` lämnar efter sig — INTE betald av dess PR

**Staging-EF:erna är inte deployade med prisfältet.** ADR-050 § Konsekvenser:
*"Ingen deploy-automatik (manuell `supabase functions deploy`)"* — och ingen
workflow i `.github/workflows/` deployar Edge Functions till staging
(disk-verifierat 2026-09-03). De tre nya conformance-fallen i
`tests/api/get-event.staging.test.ts` faller därför tills `get-event`,
`get-events` och `update-event` deployats till staging-projektet.

**Det är mätt, inte befarat, och det är ett TVÅSIDIGT bevis att grinden
biter:** körningen 2026-09-03 mot den då deployade (gamla) EF:en gav
**12 passade, 3 fällda**, och fällningsskälet var exakt rätt —
`get-events utelämnade \`pris\` för en rad: {"id":"rec1VuPVUPH7a3bq7", …}`.
Efter deploy ska samtliga 15 passera.

**PR:ens egen CI påverkas inte:** `ci.yml` skickar `run_staging: false`
villkorslöst (rad ~2001), så staging-klassen körs inte på PR-ytan. Skulden
träffar i stället `post-merge`/`nightly`, och den betalas av en deploy — inte
av en ändring i testet.

Deployen är INTE utförd av byggagenten, med avsikt: den är en skarp operation
mot en delad miljö där `supabase link`-tillståndet är sticky och osynligt
(`CLAUDE.md` § Prod-EF-deploy beskriver samma fällklass), och andra agenters
staging-körningar delar basen. Åtgärden ligger hos orkestreraren.

## Omstämplings-läge

**Kvitterad 2026-09-04** — se § Omstämpling — kvitterad 2026-09-04 nedan,
tillsammans med `368.3`:s amendering: de två gäller samma yta och samma
bilder och kvitterades i samma andetag. Inget stämpel-fält är rört av denna
eller den kvitterande commiten: ytan har inget manifest att röra, och
`S111`-manifestets `godkand` står kvar orört med sin 2026-08-23-kvittens och
sha `cb7ad681`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter denna commit
(mätt 2026-09-03, om efter `TASK-368.7`s tillägg).

## Omstämpling — kvitterad 2026-09-04

**Marcus kvittens, klartext i chatten** (samma kvittens som
[`AMENDERING-2026-09-03-avbokningssteget.md`](AMENDERING-2026-09-03-avbokningssteget.md)
§ Omstämpling — kvitterad 2026-09-04, eftersom den täcker båda stegen på samma
sida i samma QA-vandring):

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
