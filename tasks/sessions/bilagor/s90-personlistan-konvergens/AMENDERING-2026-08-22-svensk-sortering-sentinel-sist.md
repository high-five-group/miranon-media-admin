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
saknar `referenser` och är därmed INTE innehållslåsta"*). Det betyder att den
mekaniska bevakningen av just denna ytas referenser saknas — värt att deklarera
`referenser` nästa gång ytan ändå är ogodkänd, eftersom `ADR-102` § A5 punkt 2
kräver att de deklareras MEDAN manifestet är ogodkänt. **Hasharna efter
`TASK-283.4`:s regenerering skrivs ut i klartext nedan**
(§ Omstämplings-läge).

## Omstämplings-läge

**OMSTÄMPLING BEGÄRD 2026-08-22.** Marcus har sett den färdiga ytan — med
sentinel-raden sist och bokstavsraden ovanför listan — i körande app
(`localhost:5173/personer`, `main` `a7dd94c5`) och godkänt den i klartext:

> *"Ser ju skitbra ut! Bra jobb Claude!"*

Sorteringen ingick i det han såg: `Ej tillgängligt` låg sist i listan vid
granskningen, precis som `ADR-123` beslut 4 föreskriver. Därmed är
`TASK-283.4` AC #1 uppfylld och den enkelriktade ordningen hållen — FÖRST
Marcus ord, DÄREFTER regenereringen.

`godkand` rörs fortfarande **aldrig** av en agent (`ADR-104` § Beslut 2).
Omstämplingen verkställs av Marcus i hans egen `!`-kanal:

```bash
npm run facit:godkann -- --pass s90-personlistan-konvergens --citat "Ser ju skitbra ut! Bra jobb Claude!" --ersatt
```

### Vad som är AMENDERAT — sentinel-radens position, nu i det mekaniska facit

`TASK-283.4` har regenererat samtliga sex `ariaSnapshot`-referenser under
`tests/visual/__aria__/personer-promoverings-grind.spec.ts/`. Denna skivas
bidrag är sentinel-radens FLYTT i de två listlage-referenserna: `Ej
tillgängligt` (`recVisualPers00017`) står inte längre mellan `David Dahl` och
`Emma Eklund`, utan sist — efter `Petra Palm`:

```yaml
  - listitem:
    - link "Petra Palm":
      - /url: /personer/recVisualPers00016
    - text: petra.palm@example.se 7 dagar sedan · Anmälde sig till RIM 2 i Stockholm Aktiv anmälan
  - listitem:
    - link "Ej tillgängligt":
      - /url: /personer/recVisualPers00017
    - text: p.lindqvist@example.se Igår · Hämtade Meditationen Kraftfältet
```

**Det var denna flytt, och bara denna, som höll de sex fallen röda.** Diffen är
fyra rader bort från position 5 och samma fyra rader tillagda sist — sedan
`TASK-286.3` landade har grinden stått 10 passerade / 6 fällda, och de sex
fallen (listläget plus de två `?variant=`-degraderingarna, båda vyporterna)
fällde uteslutande på ordning. `TASK-283.2` och `TASK-283.3` tillförde noll
nya fällningar ovanpå den; bokstavsraden är en extra syskonnod som
`toMatchAriaSnapshot` tolererar partiellt.

### Vad som INTE är amenderat — rad- och listformen är ORÖRD

Att flytten är en FLYTT och inte en formändring är nu **mekaniskt mätt** i
stället för enbart resonerat. Listblocket (`- list "Personer":` till filslut)
extraherades ur referensen före och efter regenereringen, sorterades och
jämfördes:

```bash
diff <(sed -n '/^- list "Personer":/,$p' FÖRE | sort) \
     <(sed -n '/^- list "Personer":/,$p' EFTER | sort)   # exit 0, båda vyporterna
```

**Exit 0 på båda vyporterna.** Nodmängden inuti `list "Personer"` är
byte-identisk före och efter: ingen nod tillagd, ingen borttagen, ingen omdöpt
— sentinel-radens fyra rader är oförändrade ned till tecknet, det är bara deras
POSITION som skiljer. Det är precis den distinktion `ADR-102` § A2 skärpning 2
kräver att man kan visa i stället för att påstå.

Kvar orörda, var för sig:

- tonal kortyta med `divide-y`-avdelare — orörd
- låst radhöjd — orörd
- status (`Aktiv anmälan`) som egen kolumn med reserverad plats — orörd
- e-post ensam på kontaktraden — orörd
- interaktionsraden avskild med 4 px, utan ikon — orörd

**Referensernas regex-mönster är bevarade genom regenereringen.** De nio
`- text: /…\d+ dagar sedan…/`-mönstren plus `- status: /Visar \d+ av \d+
personer\./` är handskrivna och har stått sedan den ursprungliga låsningen
(`301d17af`, 2026-08-10). Playwright skrev inte literaler i deras ställe:
räknat efteråt bär båda listlage-referenserna fortfarande 9 text-regexar och
sin status-regex. Det var inte givet — hade de rivits vore låset en generation
svagare på en axel ingen bett om.

Pixel-baselinen `personer.png` är fortfarande orörd och därmed en generation
bakom vad gäller radordningen. Baselines föds i CI via `visual-baselines.yml`,
aldrig lokalt (`CONTRIBUTING.md` § Visuell regression) — det momentet är
separat från denna landning. `TASK-283.4`:s diff bär **ingen `src/`-ändring
alls**.

**Referens + hash.** Ytan `personlistan` deklarerar fortfarande INGEN
`referenser`-array i `facit.json`, så `check-facit.sh` invariant (d)
hash-jämför ingenting här (om-mätt 2026-08-22 efter regenereringen:
`bash scripts/check-facit.sh` → exit 0, nu *"24 stämplade ytor saknar
`referenser`"* — talet stod som 22 när denna fil skrevs och har vuxit med två
sedan dess). Hasharna skrivs ändå ut, så bokföringen är maskinläsbar den dag
ytan deklareras:

| referens | sha256 efter regenereringen |
|---|---|
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-listlage-visual-desktop.aria.yml` | `373a81a21615b5c8c98d57a08ebde106299cd49b84374eeaec91b25cf6a16c9f` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-listlage-visual-mobile.aria.yml` | `373a81a21615b5c8c98d57a08ebde106299cd49b84374eeaec91b25cf6a16c9f` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-sokning-traff-visual-desktop.aria.yml` | `f83420bda8dde3fcfbd1f1e8b159daaace4f3d9790b24262f68f14dce9716e05` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-sokning-traff-visual-mobile.aria.yml` | `f83420bda8dde3fcfbd1f1e8b159daaace4f3d9790b24262f68f14dce9716e05` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-tomlage-visual-desktop.aria.yml` | `6a5540586cc71cb422c7bb40f549ddc7b3504e78ba43c948a2c1a708a0e1705d` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-tomlage-visual-mobile.aria.yml` | `6a5540586cc71cb422c7bb40f549ddc7b3504e78ba43c948a2c1a708a0e1705d` |

### Grindens utfall — det röda fönstret som denna skiva öppnade är stängt

| | passerade | fällda |
|---|---|---|
| efter `TASK-286.3` (denna skiva) | 10 | 6 |
| före regenereringen (`main` `a7dd94c5`, om-mätt) | 10 | 6 |
| **efter regenereringen** | **16** | **0** |

PR #1750 kunde inte tas ur draft förrän detta skedde; den blockeringen är nu
upplöst av `TASK-283.4`.
