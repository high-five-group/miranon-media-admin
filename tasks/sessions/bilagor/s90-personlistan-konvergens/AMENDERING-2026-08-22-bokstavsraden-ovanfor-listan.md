# Amendering 2026-08-22 — bokstavsraden läggs ovanför listan (TASK-283.2)

**Pass:** TASK-283.2 (Skiva: Bokstavsraden under sökrutan — tracer bullet),
barn av PRD TASK-283 (bokstavsindex i personlistan).

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
§ A3. Föregångare i samma katalog:
`AMENDERING-2026-08-22-svensk-sortering-sentinel-sist.md` (TASK-286.3) och
`AMENDERING-2026-08-22-task-286-2-referenser.md`.

## Avvikelsen

**Vad som ändrades:** en `role="toolbar"` med 30 knappar (A till Z, sedan Å, Ä,
Ö, plus hinken `Utan namn`) monteras mellan sökrutan och räknarraden, i alla
tre render-grenarna (laddläge, felläge, listläge). Ett tryck filtrerar den
laddade klientarrayen; ett andra tryck släpper filtret; valet lever i
`?bokstav=`.

**Grunden:** PRD `TASK-283` och dess skiva `TASK-283.2`, byggd mot
[`ADR-123`](../../../../docs/decisions/ADR-123-forladdat-personregister-sok-och-bokstavsindex-i-klienten.md)
beslut 3 (*"Bokstavsindexet och räknarraden blir härledningar ur samma
array"*). Marcus beslut om VÄGEN för denna ytas facit-amendering är väg A
(kortets § Implementationsbeslut, 2026-08-21, `T157`): bygget landar först,
Marcus granskar raden visuellt, och FÖRST DÄREFTER regenereras
ARIA-referenserna i en egen commit — `TASK-283.4`. Att låta bygget regenerera
dem själv är uttryckligen förkastat.

**Vad som INTE ändrades i listan:** ingenting. Bokstavsraden är ett TILLÄGG
OVANFÖR listan. Radens och listans form är byte för byte orörd — se § Vad som
inte är amenderat.

## Mätning: fönstret blev INTE bredare, tvärtemot kortets antagande

`TASK-283.2` AC #10 säger att *"promoverings-grindens sex referenser fäller så
snart raden finns, eftersom de låser den gamla formen"*. **Det är falsifierat
av mätning.** Samma kommando, samma maskin, före och efter ändringen
(`npm run test:visual -- tests/visual/personer-promoverings-grind.spec.ts`):

| | passerade | fällda |
|---|---|---|
| `main` (`0900079f`), FÖRE denna skiva | 10 | 6 |
| efter denna skiva | 10 | **6** |

Och det är **samma sex fall** i båda körningarna: `listläget` samt de två
`?variant=`-degraderingsfallen, på båda vyporterna. Orsaken är oförändrad —
sentinel-radens flytt i `TASK-286.3`, redan bokförd i
`AMENDERING-2026-08-22-svensk-sortering-sentinel-sist.md`. Denna skiva
tillför **noll** nya fällningar.

**Mekanismen, för att slutsatsen inte ska läsas som tur:** Playwrights
`toMatchAriaSnapshot` matchar PARTIELLT. Extra syskonnoder i det faktiska
trädet tolereras så länge referensens egna noder står kvar i samma inbördes
ordning. Bokstavsraden är just en sådan extra nod, och den läggs mellan noder
vars ordning inte rubbas. `listläget` fäller därför fortfarande på ORDNING
(sentinel-raden), aldrig på tillägget. `sokning-traff` och `tomlage` passerar
av samma skäl.

**Att de passerar betyder INTE att de beskriver ytan.** Alla sex referenserna
saknar numera bokstavsraden helt. De är gröna men ofullständiga — ett svagare
lås än det som stämplades 2026-08-10, eftersom en framtida ändring av raden
inte kan fällas av dem. Det är den egentliga skulden `TASK-283.4` ärver, och
den är större än den enda ordningsavvikelse en röd grind visar.

## Klassning: **(c)** — formen ändras faktiskt

`ADR-102` § A2 steg 1 är mekaniskt: `godkand` är satt, alltså inte klass (a).

Steg 2:s test — **"Påverkar ändringen vad en användare ser i prod?"** — besvaras
**JA**, utan gränsdragning: 30 nya kontroller monteras permanent på ytan och
syns för Lotta vid varje besök på `/personer`. `ADR-102` § A4 namnger dessutom
klassen exakt: detta är en **utvidgning av formen**, och B1 (*"vid motsägelse
vinner prototypen"*) gäller INOM den låsta formen, aldrig mot en avsiktlig
utvidgning av den.

Att mätningen ovan visar noll NYA röda referenser ändrar inte klassningen.
Klass (b) kräver att skillnaden mot prod är en ARTEFAKT (fixtur, rendering,
miljö) och att det kan sägas med en mätning. Här är skillnaden tvärtom exakt
det avsiktliga, prod-synliga tillägget — och att grindens partiella matchning
råkar tolerera det är en egenskap hos MATCHAREN, inte ett bevis för att formen
står still. Osäkerhet eskalerar dessutom uppåt, aldrig nedåt (§ A2).

## Vad som INTE är amenderat

Manifestets `not`-fält räknar upp de låsta formbesluten. Samtliga är orörda,
och det är mätt i samma körning som ovan (de tio gröna fallen täcker sökläget,
tomläget och axe-golvet på båda vyporterna):

- tonal kortyta med `divide-y`-avdelare — orörd
- låst radhöjd — orörd
- status (`Aktiv anmälan`) som egen kolumn med reserverad plats — orörd
- e-post ensam på kontaktraden — orörd
- interaktionsraden avskild med 4 px, utan ikon — orörd

Ingen nod inuti `list "Personer"` har lagts till, tagits bort eller döpts om.
Sid-inseten (`pt-2 lg:pt-10`, `gap-6`) och h1-formen i
`src/routes/_authenticated/personer/index.tsx` är likaså orörda; den filen
ingår inte i diffen.

**Tomlägets copy är däremot utvidgad, och det hör till formen.** Ett valt
bokstavsfilter utan träffar gav med den gamla grenen beskedet *"Personer dyker
upp här när någon anmäler sig eller lämnar sin e-post"*, vilket är osant när
Lotta just tryckt på Ö. Rena sökfallets ordalydelse (`Ingen person matchar
"X".`, TASK-277:s låsta copy) är ORÖRD; tillskotten är `Ingen person börjar på
X.`, `Ingen person saknar namn.` och `Ingen person <på X | utan namn> matchar
"Y".`.

`slutlage-tonal-{desktop,mobil}.png` och pixel-baselinen `personer.png` är
orörda och därmed en generation bakom vad gäller bokstavsraden. Baselines föds
i CI, aldrig lokalt (`CONTRIBUTING.md` § Visuell regression).

**Referens + hash:** ytan `personlistan` deklarerar INGEN `referenser`-array i
`facit.json`, så `check-facit.sh` invariant (d) hash-jämför ingenting här
(mätt 2026-08-22 på denna gren: `bash scripts/check-facit.sh` → exit 0). Det
betyder att den mekaniska bevakningen av just denna ytas referenser saknas —
`ADR-102` § A5 punkt 2 kräver att `referenser` deklareras MEDAN manifestet är
ogodkänt. **Hasharna efter `TASK-283.4`:s regenerering skrivs ändå ut i klartext
nedan** (§ Omstämplings-läge), så bokföringen är maskinläsbar den dag ytan
deklareras.

## Omstämplings-läge

**OMSTÄMPLING BEGÄRD 2026-08-22.** Marcus har sett den färdiga bokstavsraden
i körande app (`localhost:5173/personer`, `main` `a7dd94c5`) och godkänt den
i klartext:

> *"Ser ju skitbra ut! Bra jobb Claude!"*

Därmed är `TASK-283.4` AC #1 uppfylld, och kortets enkelriktade ordning hållen:
FÖRST Marcus ord, DÄREFTER regenereringen. Aldrig tvärtom — hade bygget
regenererat referenserna själv hade låset återställts av samma arbete som bröt
det, och kunde per definition aldrig fånga den förändring det finns för.

`godkand` rörs fortfarande **aldrig** av en agent (`ADR-104` § Beslut 2).
Omstämplingen verkställs av Marcus i hans egen `!`-kanal:

```bash
npm run facit:godkann -- --pass s90-personlistan-konvergens --citat "Ser ju skitbra ut! Bra jobb Claude!" --ersatt
```

### Vad som är AMENDERAT — bokstavsraden, nu i det mekaniska facit

`TASK-283.4` har regenererat samtliga sex `ariaSnapshot`-referenser under
`tests/visual/__aria__/personer-promoverings-grind.spec.ts/`. Tillägget i var
och en av dem är bokstavsraden:

```yaml
- toolbar "Filtrera på första bokstaven":
  - button "Visa personer som börjar på A"
  …
  - button "Visa personer som börjar på Ö" [disabled]
  - button "Visa personer utan namn": Utan namn
```

30 knappar i ordningen A–Z, Å, Ä, Ö, plus hinken `Utan namn`; de tomma bär
`[disabled]` (nedtoningen, `TASK-283.3` — se
`AMENDERING-2026-08-22-tomma-bokstaver-nedtonade.md`).

**Att regenereringen krävde `--update-snapshots=all`, inte bara `-u`, är
mätt och värt att bokföra.** Playwrights standardläge är `changed`, som bara
skriver om en referens som FÄLLER. Fyra av de sex passerade partiellt utan att
innehålla raden, och hade därför förblivit ofullständiga:

| läge | filer omskrivna | vad som hade blivit kvar |
|---|---|---|
| `--update-snapshots` (preset `changed`) | 2 av 6 | de fyra gröna-men-ofullständiga |
| `--update-snapshots=all` | **6 av 6** | inget |

Det är exakt den skuld detta dokuments § Mätning beskrev: *"Att de passerar
betyder INTE att de beskriver ytan."*

### Vad som INTE är amenderat — rad- och listformen är ORÖRD

Manifestets `not`-fält räknar upp de låsta formbesluten. Samtliga står kvar,
och det är nu **mekaniskt mätt** i stället för enbart resonerat. Listblocket
(`- list "Personer":` till filslut) extraherades ur referensen före och efter
regenereringen, sorterades och jämfördes:

```bash
diff <(sed -n '/^- list "Personer":/,$p' FÖRE | sort) \
     <(sed -n '/^- list "Personer":/,$p' EFTER | sort)   # exit 0, båda vyporterna
```

**Exit 0 på båda vyporterna: nodmängden inuti `list "Personer"` är
byte-identisk.** Ingen nod är tillagd, borttagen eller omdöpt. Det enda som
skiljer är ORDNINGEN — sentinel-raden `Ej tillgängligt`
(`recVisualPers00017`) flyttar från sin alfabetiska plats till sist, vilket är
`TASK-286.3`:s redan bokförda ändring
(`AMENDERING-2026-08-22-svensk-sortering-sentinel-sist.md`), inte denna.

Kvar orörda, var för sig:

- tonal kortyta med `divide-y`-avdelare — orörd
- låst radhöjd — orörd
- status (`Aktiv anmälan`) som egen kolumn med reserverad plats — orörd
- e-post ensam på kontaktraden — orörd
- interaktionsraden avskild med 4 px, utan ikon — orörd

**Referensernas regex-mönster är likaså bevarade** — och det var inte givet.
De nio `- text: /…\d+ dagar sedan…/`-mönstren plus
`- status: /Visar \d+ av \d+ personer\./` är handskrivna och har stått sedan
den ursprungliga låsningen (`301d17af`, 2026-08-10). Playwright bevarade dem
genom regenereringen i stället för att skriva literaler: räknat efteråt bär
båda listlage-referenserna fortfarande 9 text-regexar och sin status-regex.
Hade de rivits vore låset en generation svagare på en axel ingen bett om.

Sid-inseten (`pt-2 lg:pt-10`, `gap-6`) och h1-formen i
`src/routes/_authenticated/personer/index.tsx` är orörda; `TASK-283.4`:s diff
bär **ingen `src/`-ändring alls** (kortets AC #5).

`slutlage-tonal-{desktop,mobil}.png` och pixel-baselinen `personer.png` är
fortfarande orörda och därmed en generation bakom vad gäller bokstavsraden.
Baselines föds i CI via `visual-baselines.yml`, aldrig lokalt
(`CONTRIBUTING.md` § Visuell regression) — det momentet är separat från denna
landning.

**Referens + hash.** Ytan `personlistan` deklarerar fortfarande INGEN
`referenser`-array i `facit.json`, så `check-facit.sh` invariant (d)
hash-jämför ingenting här (mätt 2026-08-22: `bash scripts/check-facit.sh` →
exit 0, *"24 stämplade ytor saknar `referenser`"*). Hasharna skrivs ändå ut,
så bokföringen är maskinläsbar den dag ytan deklareras — och så att nästa
tysta omskrivning ger en hash ingen sidofil bär:

| referens | sha256 efter regenereringen |
|---|---|
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-listlage-visual-desktop.aria.yml` | `373a81a21615b5c8c98d57a08ebde106299cd49b84374eeaec91b25cf6a16c9f` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-listlage-visual-mobile.aria.yml` | `373a81a21615b5c8c98d57a08ebde106299cd49b84374eeaec91b25cf6a16c9f` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-sokning-traff-visual-desktop.aria.yml` | `f83420bda8dde3fcfbd1f1e8b159daaace4f3d9790b24262f68f14dce9716e05` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-sokning-traff-visual-mobile.aria.yml` | `f83420bda8dde3fcfbd1f1e8b159daaace4f3d9790b24262f68f14dce9716e05` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-tomlage-visual-desktop.aria.yml` | `6a5540586cc71cb422c7bb40f549ddc7b3504e78ba43c948a2c1a708a0e1705d` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-tomlage-visual-mobile.aria.yml` | `6a5540586cc71cb422c7bb40f549ddc7b3504e78ba43c948a2c1a708a0e1705d` |

Desktop- och mobil-referensen delar hash i alla tre lägena: samma yta, samma
aria-träd, olika viewport.

### Grindens utfall — det röda fönstret är stängt

| | passerade | fällda |
|---|---|---|
| före regenereringen (`main` `a7dd94c5`) | 10 | 6 |
| **efter regenereringen** | **16** | **0** |

Och täckningen är återställd i BÅDA riktningar, inte bara till grönt: en
provokation som döpte om `Visa personer som börjar på Ö` i tomlägets referens
fällde grinden (exit 1). Före regenereringen kunde samma provokation inte
fälla någonting, eftersom referensen inte innehöll raden alls. Provokationen
är återställd; referenserna står i sitt regenererade läge.
