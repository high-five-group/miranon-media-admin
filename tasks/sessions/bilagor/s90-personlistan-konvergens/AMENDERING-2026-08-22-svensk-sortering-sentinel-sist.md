# Amendering 2026-08-22 — svensk sortering flyttar sentinel-raden sist (TASK-286.3)

**Pass:** TASK-286.3 (Skiva: Svensk sortering, räknarrad ur arrayen, rivning av
sök-walken), barn av PRD TASK-286 (personregistret). PR #1750.

**Berört manifest:** `tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json`,
yta `personlistan` (godkänd 2026-08-10, citat *"Ser bra ut, godkänner"*, sha
`4ebdcfc85a78df14c47cff058472d1b4da0d8adf`).

**Skäl för sidofilen, inte ett fält i manifestet:** ett stämplat manifest är
agent-fruset i sin helhet. `scripts/deny-facit-godkand-skrivning.sh` prövar det
simulerade RESULTATET av en Edit/Write, och varje stämplat manifest har per
definition ett satt `godkand` — alltså nekas även en ändring som inte rör
fältet ([`ADR-104`](../../../../docs/decisions/ADR-104-facit-stampeln-kanalseparation.md)
§ Beslut 2). En `amendering`-nyckel i JSON:en är därför inte en möjlig form.
Bokföringen bor i denna fil enligt
[`ADR-102`](../../../../docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)
§ A3 (amenderings-mekaniken, landad 2026-08-22 i PR #1748 via `T157`).

**Not om ordningen:** `ADR-102` § A3 landade i `main` kl. 09:26:14Z
2026-08-22 — EFTER att denna skivas gren skapades. Uppdraget till agenten
föreskrev därför "stoppa och rapportera" utan att kunna peka på någon form.
Denna fil följer den nu landade formen i stället, vilket är samma sak
uttryckt mekaniskt: agenten föreslår klass och skriver motiveringen,
omstämplingen ligger kvar hos Marcus.

## Avvikelsen

**Facit visar (det mekaniska facit, `ariaSnapshot`-referenserna):**
`tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-listlage-visual-{desktop,mobile}.aria.yml`
placerar listitem-raden `Ej tillgängligt` (`recVisualPers00017`) på dess
ALFABETISKA plats — mellan `David Dahl` och `Emma Eklund`.

**Skarpt bygge visar (efter TASK-286.3):** raden ligger SIST i listan, efter
`Petra Palm`.

**Orsak:** kortets AC #1 kräver det.
[`ADR-123`](../../../../docs/decisions/ADR-123-forladdat-personregister-sok-och-bokstavsindex-i-klienten.md)
beslut 4: *"Sentinelen `"Ej tillgängligt"` sorteras sist, i sin hink."*
Listan sorteras nu med `Intl.Collator('sv')` på den laddade arrayen
(`src/lib/person-sok.ts`, `sorteraPersonregister`), vilket ger A till Z, sedan
Å, Ä, Ö, med den namnlösa sentinelen (fälla 43) sist.

**Mätt, inte antaget** (`npm run test:visual -- tests/visual/personer-promoverings-grind.spec.ts`):
`main` före ändringen **16 passed**; efter ändringen **10 passed, 6 failed**.
Den ENDA strukturella skillnaden i diffen är sentinel-radens flytt — fyra rader
bort från position 5, fyra rader tillagda sist. Allt annat i utfallet är
Playwrights rendering av regex-mönster mot literalt mottaget värde, inte
innehållsskillnader. De fyra `?variant=`-degraderingsfallen faller mot samma
referens.

## Klassning: **(c)** — formen ändras faktiskt

`ADR-102` § A2 steg 1 är mekaniskt: `godkand` är satt, alltså inte klass (a).

Steg 2:s test — **"Påverkar ändringen vad en användare ser i prod?"** — besvaras
**JA**, och det är inte en gränsdragning:

1. Sentinel-posterna finns i PROD, inte bara i fixturen. `Personer.Namn` är
   formeln `IF(AND(Förnamn="", Efternamn=""), "Ej tillgängligt", …)`
   (fälla 43/51, `docs/reference/data-model.md`), och basfiltret
   (`{Antal anmälningar (totalt)} > 0`) utesluter dem inte. Lotta ser raden
   flytta.
2. Ändringen är **avsiktlig och synlig** — den är hela kortets syfte, inte en
   bieffekt. Det skiljer den från PR #1715:s klass (b)-instans, där `button
   "Ladda fler"` föll bort ur referensen ENBART för att fixturen bär 17
   personer mot render-fönstrets 50, medan knappen finns kvar i prod (559
   personer). Här är det tvärtom: fixturen visar exakt det prod kommer visa.
3. `ADR-102` § A2 skärpning 2 pekar åt samma håll: *"Tar ändringen bort eller
   döper om en nod som finns i prod, är det klass (c)"*. Raden tas bort från
   sin position och läggs till på en annan.

Klass (c) är dessutom rätt klass för det ADR-102 § A4 kallar en **utvidgning av
formen**: B1 ("vid motsägelse vinner prototypen") gäller INOM den låsta formen,
aldrig mot en avsiktlig utvidgning av den. Ordningen är en formaspekt som
facit fångade utan att någon beslutade den — den låstes 2026-08-10 som en
bieffekt av att Airtable sorterade som Airtable sorterade.

## Vad som INTE är amenderat

Formen i övrigt är ORÖRD, och det är mätt i samma körning: de tio gröna fallen
täcker sökläget, tomläget och axe-golvet på båda vyporterna. Tonal kortyta med
`divide-y`-avdelare, låst radhöjd, statuskolumnen (`Aktiv anmälan`) med
reserverad plats, e-post ensam på kontaktraden, interaktionsraden avskild med
4 px utan ikon — samtliga formbeslut manifestets `not`-fält låser är oberörda.
Ingen nod har lagts till, tagits bort eller döpts om. Bara EN rads POSITION
ändras.

Pixel-baselinen `personer.png` är likaså orörd (dess grind är byggd men
medvetet inaktiv i CI; baselines föds i CI via `visual-baselines.yml`, aldrig
lokalt — `CONTRIBUTING.md` § Visuell regression). Den är därmed en generation
bakom vad gäller radordningen.

**Referens + hash:** ytan `personlistan` deklarerar INGEN `referenser`-array i
`facit.json`, så `check-facit.sh` invariant (d) hash-jämför ingenting här
(mätt 2026-08-22: `bash scripts/check-facit.sh` → exit 0, *"22 stämplade ytor
saknar `referenser` och är därmed INTE innehållslåsta"*). Ingen hash-rad är
alltså tillämplig. Det betyder också att den mekaniska bevakningen av just
denna ytas referenser saknas — värt att deklarera `referenser` nästa gång ytan
ändå är ogodkänd, eftersom `ADR-102` § A5 punkt 2 kräver att de deklareras
MEDAN manifestet är ogodkänt.

## Omstämplings-läge

**VÄNTAR MARCUS OMSTÄMPLING.** `godkand` rörs aldrig av en agent
(`ADR-104` § Beslut 2), och för klass (c) avgörs omstämplingen i Marcus egen
kanal — `ADR-102` § A2: *"En agent avgör detta ALDRIG själv."*

Agenten har därför:

- **INTE** rört `facit.json`.
- **INTE** rört de två `.aria.yml`-referenserna.
- Lämnat PR #1750 som **draft**, och AC #5 samt DoD #1/#6 **obockade** på
  kortet.

**Vad Marcus beslut gäller:** ska sentinel-raden ligga sist i personlistan
(kortets AC #1, `ADR-123` beslut 4 — redan beslutat i ADR:n), och ska
referenserna därmed fångas om med stämpeln förnyad? Bekräftas det uppdateras
de två `.aria.yml`-filerna och `godkand` sätts om via Marcus kanal; först då
kan PR #1750 tas ur draft.
