# Amendering 2026-09-05 — Segmentets detaljvy, sju åtgärder (TASK-390)

## Skäl för sidofilen

`facit.json` i den här katalogen är **stämplat** (`godkand.av: marcus`,
`godkand.datum: 2026-08-16`, sha `a40f3543670f0de310d27542241128b4b5242ea3`)
och därmed agent-fryst av `ADR-104`-hooken
(`scripts/deny-facit-godkand-skrivning.sh`) — en agent kan aldrig skriva om
manifestet, inte ens ett fält som inte rör `godkand`. Bokföringen av en
ändring mot ett stämplat facit bor därför i en SIDOFIL bredvid manifestet,
per `ADR-102` § "Amenderingsmekaniken för ett STÄMPLAT facit" (2026-08-22)
och dess kanoniska form (§ A3) — samma mönster
`AMENDERING-2026-08-31-startvyns-sidram-och-messagebox.md` i denna katalog
redan etablerade.

## Yta / berört manifest

`tasks/sessions/bilagor/s104-segment-divergens/facit.json`, ytan
**`segment-detaljvyn`** (`SegmentDetalj` + `PublikSektion`/`PersonRad` i
`src/components/segment/prototyp/VariantD.tsx`, den skarpa vyn sedan
`TASK-249.5`/`TASK-379`). Manifestets `not`-fält för ytan (oförändrat av
denna amendering) beskriver publiklistans PersonsList-anatomi och den
inline-scroll-baserade listan — den byggform denna ändring bygger vidare på,
inte river.

Manifestet stämplades 2026-08-16/17 med citatet *"Godkänd mot facit
2026-08-17"*.

## Avvikelse

**Fyndet, Marcus egna ord (2026-09-04, S120 sessionsdok Del 1, tredje
meddelandet, verbatim):**

> "Om man går inte på ett segment, låt säga RIM 1, så kommer du se saker som
> behöver åtgärdas. Det jag ser är:
>
> - 'Skicka utskick till det här segmentet' behöver bytas ut till 'Gör ett
>   utskick till det här segmentet'.
> - Listan med publiken har inte rätt bredd
> - Scrollbaren på listan med publiken går för högt upp
> - (namn saknas) bör bytas ut mot 'Namn saknas' utan parantes
> - ikonen för alla (initialer-ikonen) måste visa en 'person-ikon' när namn
>   inte finns, exakt som på 'Intresserade-sidan'. Kolla intresserade-sidan
>   hur den listan ser ut.
> - Regel-blocket har en rad 'Form' som säger 'Predikat över dimensioner'.
>   Jag fattar ingenting om vad det betyder.
> - Borde inte reglerna som skrivs ut i regel-blocket typ vara nedtonade
>   eller sitta i pills eller rutor typ?"

**Vad som landade, i slutlig form (sju punkter):**

1. **Primärknappens copy.** "Skicka utskick till det här segmentet" →
   "Gör ett utskick till det här segmentet" — "Skicka" var appens ord för
   AVSÄNDANDET (mailet går ut nu), "Gör" är ordet för att ÖPPNA VERKTYGET;
   knappen leder till granska-läget och skickar ingenting själv.
   Acceptance-testet (`tests/acceptance/mer-segment.acceptance.test.ts`)
   bär nu en explicit synlighets-assertion på den nya texten, inte bara
   klick-lokatorns implicita namnmatchning.
2. **Publiklistans dubbla inset rivet.** En överflödig omslutande
   `<div className="px-4">` la sin egen inset UTANPÅ ulens redan egna
   `px-4`. DOM-mätt (iteration 1): 16 px extra per sida på desktop
   (536→568 px), 32 px totalt på mobil (311→343 px) — plattans yttre bredd
   matchar nu exakt `KORT_KLASS`-kortens (568/343 px), samma x-position som
   sidans övriga kort.
3. **Rullningslistens geometri.** Rotorsak (iteration 3, DOM-mätt): `<ul>`
   VAR den rundade plattan (`scrollerArPlattan: true`), så spåret ritades i
   scroll-containerns padding-box över hela kortets höjd — 7,00 px ovanför
   första raden, lika långt under sista, och ut i hörnkurvan. Strukturell
   fix som förebilden `DeltagarListan` (`Deltagare.tsx:1211`): yttre
   `<div>` är kortet, `<ul>` är bara rullningsytan. Mätt efter (1440 och
   375): overhang topp 7,00 → 0,00 px; spåret 7,00 px innanför plattans ram
   i båda ändar. `tabIndex`, `kanRulla`-vakten, PageDown och print
   oförändrade.
4. **"(namn saknas)" → "Namn saknas".** `visatNamn()` returnerar nu
   `aktaNamn(m) ?? 'Namn saknas'`, utan parentes — i linje med resten av
   appen (Waitlist/Närvaro/EventCheckin/EventRegistrations).
5. **Person-ikon för namnlösa medlemmar.** `PersonRad` visar `UserRound`
   (Intresserade.tsx-mönstret) i stället för initialer ur
   platshållarsträngen ("NS" ur "Namn saknas" hade sett ut som en persons
   riktiga initialer). Ton justerad i iteration 3 efter Marcus dom (se
   nedan) till exakt samma fyllnad som de namngivnas rundel
   (`bg-bg-emphasized`/`text-text-secondary`, mätt identiska: rgb(237,238,233)
   / rgb(82,81,81), 36×36 px).
6. **"Form"-raden riven.** Raden "Form: Predikat över dimensioner" skilde
   två interna lagringsformer (predikat-motorn mot den äldre uppräknade
   regelformen, migrationssömmen `TASK-249.5` öppnade) — en distinktion
   Lotta aldrig har nytta av (Gunilla-principen). "Räknas ur" bär den
   mening som faktiskt finns för användaren.
7. **Regeln som strukturerade chips.** Avsiktsmeningen (prosa) vinner
   alltid överst; själva regeln renderas därunder som läs-only
   chip-grupper (`RegelStruktur`, samma predikat/`bruttoRegelFor` som
   prosan redan läser — aldrig en egen parallell källa), i husets
   filter-pill-grammatik (Linear/GitHub/Notion-mönstret). Operatorord
   (och/eller/Utan) revs helt i iteration 2 efter Marcus dom; chipsen
   ligger på en rad, inkluderade chips i success-ton med `Check`,
   exkluderade i dämpad ton med `Minus` och `sr-only`-text (färg är
   aldrig ensam bärare, WCAG 1.4.1).

## Iterationshistoriken — fem varv, samtliga Marcus-dömda, plus stämpel

### Iteration 1 — förslaget (2026-09-04, commit `667ce2ce`)

Implementerade alla sju punkter direkt ur Del 1s fynd (ovan) som ett första
förslag — ingen egen Marcus-dom föregår denna, den ÄR det första svaret på
fyndet. Aria-snapshot-referensen för `segment-detaljvyn` lämnades medvetet
oförändrad; diffen mot den nya DOM:en rapporterades i PR-kroppen för Marcus
att bedöma, inte tyst omgenererad.

### Iteration 2 — Marcus dom (2026-09-04, commit `be718de4`)

Marcus dom, verbatim (mot staging, ur commit-meddelandet — INTE en
ordagrann rad i sessionsdokets Del 2, som bara summerar utfallet i
tredje-person-prosa; se § Avvikelse mot uppdraget nedan):

> "jag kan ju inte granska publiklistan för det finns ingen lista, jag ser
> tomläget, som dessutom saknar den streckade konturen som vi precis
> stämplade på Segment-vyn. Ta också bort alla 'utan' och 'eller' chips i
> regelblocket, det blev ju ännu otydligare nu."

Tillägg samma dag:

> "Chipsen borde ligga på samma rad, och den/de chips vars utbildning
> inkluderas i segmentet bör vara grön ju? De andra nedtonade?"

Regelblocket fick tre steg i samma riktning (operatorord + "Utbildning"-chippen
rivna, chipsen till en rad med Check/Minus-semantik); publikens tomläge fick
samma streckade `bg-surface`-ram som segmentlistans då nyligen stämplade
tomläge (`TASK-392`).

### Iteration 3 — Marcus dom (2026-09-05, S120 sessionsdok Del 4, verbatim)

> "Men detaljvyn på segment ser inte bra ut, fixar:
>
> - 'initial-ikonen' för dem som inte har namn har fel grå fyllnadsfärg
>   eller ingen alls, de ska ha exakt samma som de som har namn
> - Scrollbaren går för högt och för lågt så den hamnar utanför
>   blocket/listan fortfarande
> - De 'ej-aktiverade' chipsen har kontur bara, snyggare om stilen går
>   konsekvent med aktiverade/valda chips (de gröna), så en grå
>   fyllnadsfärg istället för kontur tycker jag.
> - Raden 'Motsvarar' behöver vi den?"

Fyra punkter A–D: (A) person-ikonens rundel fick namngiven-grenens egen ton
i stället för Intresserade-mönstrets (som på denna bakgrund gjorde rundeln
osynlig); (B) rullningslisten fick sin strukturella fix (§ Avvikelse punkt
3); (C) "räknas bort"-chipsen fick grå fyllnad i stället för kontur; (D)
"Motsvarar"-raden riven (redundant mot chipsens egen uppräkning), "Räknas
ur" stod kvar.

### Iteration 4 — Marcus dom (2026-09-05, verbatim, efter granskning av
iteration 3)

> "Ser bra ut, det enda jag vill ta bort är '(Närvarande eller deltog
> online)', det räcker liksom att det står 'Närvaro', alltså 'Räknas ur:
> Närvaro'. Håller du inte med? Lotta behöver inte veta mer än så."

"Räknas ur"-radens värde kortat till exakt "Närvaro". De två värdena
(Närvarande / Deltog online) är Airtable-basens interna statusalternativ på
Deltagande-posten (`ORDLISTA.md`, posten Deltagande: "närvaron är statusen
på posten, inte posten själv") — samma klass av intern distinktion som
Form-raden (punkt 6) revs för.

### Iteration 5 — Marcus dom (2026-09-05, verbatim)

> "ta bort pen-ikonen framför 'Ändra regeln'"

`<Pencil>`-ikonen framför "Ändra regeln"-knappen riven; chevron-höger
räcker som riktningssignal. `Pencil`-importen (rad ~226) står kvar — den
används fortfarande i `NyttSegmentVy` ("Bygg med egna villkor", en annan
yta), orörd av denna ändring.

### Stämpel (2026-09-05, verbatim)

> "Nu är vi klara, det blir jättebra"

## Klassning: (c) — utskriven, med mätning

`ADR-102` § A2 testet: *"Påverkar ändringen vad en användare ser i prod?"*

**Ja, otvetydigt** — samtliga sju punkter är synliga formändringar på en
yta Lotta använder (knapptext, listbredd, rullningslist-geometri, en
sträng, en ikon, en borttagen rad, regelns hela renderingsform). Detta är
en revidering av en redan låst, stämplad form — inte en utvidgning av
outforskat territorium — men `ADR-102` § A2:s "Osäkert ⇒ klass (c)"-regel
gäller ändå: ändringen är för omfattande (sju punkter, fem iterationsvarv)
för att motivera den lägre klass (b) (mätt nettonoll-ändring).

**Auktorisationen `ADR-102` § A2 kräver för en klass (c)-motivering är i
denna amendering STARKARE än i `AMENDERING-2026-08-31`s scope-kvittens-form:
Marcus har inte bara godkänt att arbetet FÅR göras — han har ITERERAT
formen live i webbläsaren över fem varv och gett en uttrycklig, avslutande
STÄMPEL** ("Nu är vi klara, det blir jättebra", ovan). Detta är den mest
direkta formen av den skrivna Marcus-grund § A2 efterfrågar: inte en
delegerad kvittens före bygget, utan en levande dom på den faktiska,
färdiga formen.

## Vad som INTE är amenderat

- Publikens filtrering, sökfunktion och sammanfattningsraden ("N personer
  · N får mailet · N får inte mailet") — orörda.
- `PublikSektion`s tomläge fick sin streckade ram i iteration 2 (delar form
  med `TASK-392`); dess text är oförändrad.
- Utskicksflödet (`onSkicka`, granska-läget, "Utskick till N personer")
  bortom knapptexten i punkt 1 — orört.
- `RegelStruktur`s underliggande predikat-/`bruttoRegelFor`-logik — endast
  RENDERINGEN ändrades (chip-grupper i stället för prosa-uppräkning);
  reglernas faktiska INNEHÅLL (vilka utbildningar/nivåer som räknas in/ut)
  är opåverkat.
- `rule` (den underliggande regeldatan) lever kvar oavkortad — både
  "Motsvarar"-radens rivning och "Räknas ur"-radens kortning är
  REVERSIBLA: `tomRegel` läser fortfarande `rule`, så en framtida rad kan
  återge samma information med ett annat uttryck om Marcus säger annat.
  Ingen datamodell rördes, bara presentationen.
- Filens READ-ONLY-förstärkning (no-op-mutationer `saveSegment`/
  `sendEmail`/testmail) — oförändrad.
- `NyttSegmentVy` (segment-byggaren, en annan komponent i samma fil) —
  helt orörd; `Pencil`-importen består eftersom den komponenten
  fortfarande använder ikonen.

## Omstämplings-läge

**Klass (c): `godkand`-fältet rörs INTE av denna commit.** Ingen agent
skriver till ett stämplat manifest (mekaniskt hindrat av
`deny-facit-godkand-skrivning.sh` under alla omständigheter). Manifestets
stämpel (`av: marcus`, `datum: 2026-08-16`, sha `a40f3543…`) står kvar
oförändrad och gäller den ÖVRIGA, orörda formen (de sex andra ytorna i
manifestet, samt `segment-detaljvyn`s egen orörda struktur — publiklistans
anatomi, filtrering, sök). Vill Marcus omstämpla för att uttryckligen
bekräfta den nya formen (sju punkter) sker det via hans egen kanal — inte
via denna sidofil eller denna agent.

## Bilder

Sex nya skärmdumpar av slutformen (efter iteration 5 + stämpel), tagna mot
den hermetiska fixturvärlden med samma 14-personers publik-fixtur som
`granskning-390-matning.spec.ts` (gitignorerad granskningsspec) använder:

- `segment-detaljvyn-v2-desktop.png` / `segment-detaljvyn-v2-mobil.png` —
  hela detaljvyn, 1440×900 resp. 375×812 (`deviceScaleFactor: 2`).
- `publiklistan-v2-desktop.png` / `publiklistan-v2-mobil.png` —
  publiklistans platta (punkt 2, 4, 5).
- `regelblocket-v2-desktop.png` / `regelblocket-v2-mobil.png` —
  Regeln-blocket i slutform (punkt 6, 7, samt iteration 4/5: "Räknas ur:
  Närvaro", ingen pennikon framför "Ändra regeln").

**Namngivning, avsiktligt UTAN `facit-`-prefix** (precedent: PR #2308,
`tasks/sessions/bilagor/s114-segmentlistan-konvergens/
AMENDERING-2026-09-04-tomlagets-yta.md` § "Namngivning, avvikelse…"):
`.facit-policy.conf`s `FACIT_BILD_GLOB="facit-*"` flaggar varje fil som
börjar på `facit-` som en föräldralös facit-bild om den inte är deklarerad
i manifestets `bilder`-lista. Verifierat: `grep -n FACIT_BILD_GLOB
.facit-policy.conf` → `"facit-*"`; ingen av de sex filerna matchar mönstret.

## Referens + hash

`segment-detaljvyn`s manifestpost har `"bilder": []` och saknar nyckeln
`referenser` (mätt: `python3`-inspektion av `facit.json`s `ytor`-array) —
samma täckningslucka `ADR-102` § "Täckningsluckan i invariant (d)"
(2026-08-28) namnger men medvetet INTE fäller på
(`FACIT_VARNA_ODEKLARERAD_REFERENS`, `.facit-policy.conf`). Det finns
alltså inget låst hash-par att uppdatera här.

Det MEKANISKA facit för denna yta är i stället promoverings-grindens
`ariaSnapshot`-referenser
(`tests/visual/__aria__/segment-promoverings-grind.spec.ts/
segment-detaljvyn-visual-{desktop,mobile}.aria.yml`, `TASK-249.1`). De
diffade MEDVETET genom hela iterationshistoriken (iteration 1 → 5, se
respektive commit-meddelande och KÄND FÖLJD-noten i `VariantD.tsx`) och är
**omgenererade i denna landning** efter stämpeln
(`--update-snapshots`, se PR-kroppen och grind-rapporten för det exakta
utfallet — 14/14 gröna efteråt). De sex andra ytornas referenser i samma
spec-fil är oförändrade.
