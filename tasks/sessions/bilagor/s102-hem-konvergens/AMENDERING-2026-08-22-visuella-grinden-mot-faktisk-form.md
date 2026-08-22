# Amendering 2026-08-22 — den visuella promoverings-grinden riktas mot den faktiska formen (TASK-243.6)

**Pass:** TASK-243.6 (Fynd: hem-vyns visuella promoverings-grind vaktar den
rivna K10-formen), barn av PRD TASK-243 (Hem-vyns omdesign — Morgonkollen).

**Berört manifest:** `tasks/sessions/bilagor/s102-hem-konvergens/facit.json`,
ytan `hem-vyn V1 "Lugna morgonen"` (godkänd 2026-08-17, citat "Hem-vyn ser bra
ut, precis som prototypen.", sha `8044e5b655dad5b3a12a4eba7fe682f88705f8e4`).

**Skäl för sidofilen, inte ett fält i manifestet:** ett stämplat manifest är
agent-fruset i sin helhet — `scripts/deny-facit-godkand-skrivning.sh`
(`ADR-104` § Beslut 2) prövar det simulerade RESULTATET av en `Edit`/`Write`
och nekar varje skrivning mot ett manifest vars resulterande `godkand` är
icke-null, oavsett om fältet självt rörs. Formen följer `ADR-102` § A3 och
precedenten `AMENDERING-2026-08-17-hover-och-etikett.md` i samma katalog.
`godkand` är aldrig rörd av denna skiva.

## Föreslagen klass: **(b)** — formen oförändrad, referenserna var stale

`ADR-102` § A2 steg 2 ställer EN fråga: **påverkar ändringen vad en användare
ser i prod?**

**Nej — och mätningen är denna:** skivans diff innehåller **noll filer under
`src/`**. Mätt med `git status --porcelain` efter att arbetet var klart:
enbart `tests/visual/**` (två spec-filer, sex referensfiler) och kortet under
`backlog/tasks/`. Den renderade formen är byte-identisk före och efter.

**§ A2 skärpning 2 prövad explicit** ("tar ändringen bort eller döper om en nod
som finns i prod, är det klass (c) — även när borttagningen ser harmlös ut"):

| referens-nod | operation | finns noden i prod? | mätning |
|---|---|---|---|
| `complementary "Senaste aktivitet"` | **borttagen** | **Nej** | `grep -rn "complementary\|<aside" src/components/hem/` → exit 1, noll träffar |
| `heading "Senaste aktivitet" [level=2]` | **tillagd** | Ja | `SenasteAktivitetKompakt.tsx` rad 43 |
| `Roger bekräftade anmälan` → `bekräftade en anmälan` | **omdöpt** | Ja, i den nya formen | mappad verb-copy sedan TASK-225.3 (`src/data/activityLog/verbCopy.ts`) |

Varje redigering flyttar referensen **mot** prod-sanningen. Ingen nod som
faktiskt finns i prod tas bort eller döps om. Klassningen är därför inte
osäker, och faller inte till (c) på osäkerhetsregeln.

## Avvikelsen, och varför den uppstod

**Referenserna beskrev en form som ingen kod längre bär.** Grinden
(`tests/visual/hem-aktivitetsspalt-promoverings-grind.spec.ts`) föddes i
`d72e9c90` (TASK-201.7) mot K10-facitet och fästes vid
`src/components/hem/SenasteAktivitet.tsx`.

`d794669f` (TASK-243.1) **raderade** den filen (203 rader) och ersatte den med
`SenasteAktivitetKompakt.tsx` (87 rader). Disk-verifierat: `git show --stat
d794669f` rör **ingen** fil under `tests/visual/`. Grinden vaktade från den
dagen en riven form.

Det är samma supersedering som är öppet bokförd i
`tasks/sessions/archive/bilagor/s55-hem-konvergens/ARKIVERAD.md` — K10-facitet
arkiverades på Marcus vägval 2026-08-16 ("Kör 1, arkiv-flytten") just därför
att dess källfiler raderades av promoveringen. Den visuella grinden var den
enda artefakten som inte följde med i den flytten.

**TASK-243.3 lagade samma felklass i tre e2e-filer** men nådde inte hit: dess
AC #1 räknade upp `tests/acceptance/hem*.ts`, och dess Implementation Notes
punkt 3 beskriver exakt samma fix på `tests/e2e/aktivitetslogg-skarv.staging.test.ts`
— *"Fix: EN rad, testid → role=region-lokator (samma mönster som
hem-acceptance-sviterna)"*. `tests/visual/` föll utanför uppräkningen.

**Mätt utfall före fixen:** baslinje-dispatchen 2026-08-22 (`gh run view
32587783890`) gav 238 passed / 8 failed, samtliga åtta i hem-vyn. Lokalt
reproducerat mot `main` `9be5172d`: samma åtta.

## Vad som ändrades i referenserna

De två befintliga referenserna regenererades och två nya tillkom, samtliga med
`--update-snapshots=all` (preset `changed` skriver bara om referenser som
FÄLLER och lämnar partiellt passerande filer ofullständiga).

| referens | sha256 |
|---|---|
| `hem-aktivitetsspalt-visual-desktop.aria.yml` | `4143a462b3f93a275bff07dab3b84264233a274bc4844fe191aecde09c95f75d` |
| `hem-aktivitetsspalt-visual-mobile.aria.yml` | `4143a462b3f93a275bff07dab3b84264233a274bc4844fe191aecde09c95f75d` |
| `hem-aktivitetsspalt-under-xl-visual-desktop.aria.yml` (ny) | `4143a462b3f93a275bff07dab3b84264233a274bc4844fe191aecde09c95f75d` |
| `hem-aktivitetsspalt-under-xl-visual-mobile.aria.yml` (ny) | `4143a462b3f93a275bff07dab3b84264233a274bc4844fe191aecde09c95f75d` |
| `hem-aktivitetsspalt-tomlage-visual-desktop.aria.yml` | `c8acae64176660662de8c53abf6551ecb15e6b99d97702f1c7587ed38cea8297` |
| `hem-aktivitetsspalt-tomlage-visual-mobile.aria.yml` | `c8acae64176660662de8c53abf6551ecb15e6b99d97702f1c7587ed38cea8297` |

**Att fyra av dem delar hash är ett RESULTAT, inte slarv.** De två
vyport-lägena (1440 och 1024) producerar identiska ARIA-träd, vilket är själva
beviset för att formen inte divergerar över den gamla `xl`-brytpunkten —
precis vad PRD task-243 kräver ("alla bredder", `Hem.tsx` rad 396).

## Det rivna testfallet

Fallet `under xl — ingen spalt, och inget spår av den i tillgänglighetsträdet`
beskrev K10-formens `hidden … xl:flex`-gren. Det är **omskrivet, inte
borttaget**: den responsiva mätningen är filens egen deklarerade poäng, och en
frånvaro-assertion mot en form som inte längre renderas blir **falskt grön** —
`toBeHidden()` och `toHaveCount(0)` passerar båda trivialt mot element som
aldrig finns. Fallet asserterar därför nu NÄRVARO vid 1024 px och tar ett eget
ariaSnapshot.

Samtidigt rättades fallets ANKARE: `region "Nya anmälningar att hantera"`
existerar inte. Systerblockets tillgängliga namn är dynamiskt — `"N nya
anmälningar att bekräfta"` resp. `"1 ny anmälan att bekräfta"`
(`NyaAnmalningar.tsx` rad 62) — och matchas nu på den stabila svansen.

## Formen i övrigt oförändrad

Samtliga formbeslut manifestets `not`-fält låser är oberörda: blockordningen,
den vertikala rytmen, bevakningsraden, det tomma lägets copy, tidsformerna,
mittpunkts-separatorn och den sammanhängande radformen (aktör + verb-copy +
`·` + objekt). Ingen ny visuell granskning av Marcus krävs av denna skiva.

## Föreslagen inbakning

Marcus väg framåt (via `!`-kanalen, utanför agentens `Edit`/`Write`-yta): lägg
till fältet `amendering` (array) på ytan i `facit.json`:

```json
{
  "datum": "2026-08-22",
  "klass": "(b) — formen oförändrad, referenserna var stale",
  "skiva": "TASK-243.6",
  "vad": "Den visuella promoverings-grinden (tests/visual/hem-aktivitetsspalt-promoverings-grind.spec.ts) och dess sex ariaSnapshot-referenser riktades om från den rivna K10-formen till den promoverade V1-formen: complementary -> region + h2, omappad verb-copy -> mappad (TASK-225.3), xl-only-fallet -> alla bredder.",
  "varfor": "Referenserna beskrev en form som d794669f (TASK-243.1) raderade utan att röra tests/visual/. Skivans diff innehåller noll filer under src/ — den renderade formen är byte-identisk före och efter.",
  "ej_omstamplat": "Ingen nod som finns i prod togs bort eller döptes om; varje redigering flyttar referensen mot prod-sanningen. Stämpeln 2026-08-17 behålls."
}
```

`godkand`-blocket rörs inte av inbakningen — datum, citat och sha står kvar
exakt som de är.

## Om granskningen gör en annan bedömning

Klassningen är ett FÖRSLAG (`ADR-102` § A2, "en agent föreslår klass och
skriver motiveringen"). Bedöms den i stället som klass (c) ändras ingenting i
diffen — omstämplingen ligger hos Marcus i båda fallen, och denna skiva har
aldrig rört `godkand`.
