# Amendering 2026-08-23 — husets delade SidRam-primitiv ersätter anmälningssidans textlänk (TASK-299.10)

> Denna sidofil finns för att `facit.json` är AGENT-FRUSET: `ADR-104`-hooken
> (`scripts/deny-facit-godkand-skrivning.sh`) nekar varje agent-`Edit`/`Write`
> mot ett manifest vars `godkand` är satt — oavsett om skrivningen rör fältet
> självt. Bokföringen bor därför i en sidofil bredvid manifestet, formen
> kanoniserad i `ADR-102` § Updates 2026-08-22 § A3. `godkand`-fältet i
> `facit.json` är INTE rört av denna commit.

**Yta:** anmälningssidan (`facit.json`s enda `ytor`-post, godkänd
2026-08-23, citat "Det blir bra.", sha
`d3858a29b09dc4a5a6184357eda82d5c04f3d4f8`; källor
`src/components/dev/anmalningar-prototyp/VariantB.tsx` m.fl. — riven källa,
se `check-facit.sh`s rivnings-klausul).

**Avvikelse:** Sidkromet — textlänken `← Tillbaka till Mer`
(`<Link to="/mer" className="mb-4 inline-block text-small underline">`),
byggd av `TASK-299.5` när ytan promoverades ur prototypen — är ersatt av
husets delade `SidRam`-primitiv (`src/components/primitives/SidRam.tsx`,
`TASK-299.1`, PRD `TASK-299` beslut 2–3+5), samma form Väntelistan
(`TASK-299.7`), Dokument-ytan (`TASK-299.11`) och Aktivitetshistorik
(`TASK-299.6`-spec/`TASK-299.11`) redan bär. Missen fångades av Marcus i
QA på förhandsgranskningsbygget 2026-08-23, citat: *"Ser bra ut. Men varför
har inte anmälningssidan bakåtchevronen?"* — PRD `TASK-299` beslutade redan
2026-08-22 att sidramen bärs av ALLA Mer-sidor inklusive anmälningssidan,
och `DESIGN-SYSTEM-SPEC.md` § 23 listade den uttryckligen som "tillkommer
när TASK-299.5 landar" — men TASK-299.5:s promoverings-skiva behöll av
misstag den gamla textlänkens form i stället, och facit-bilderna (tagna
samma dag) ärvde den missen.

Rubriken lever kvar som egen `<h1>` i sidans eget `<header>` (PRD `TASK-299`
§ OMFATTNINGEN LÅST punkt 2 — bara sidkromet, `SidRam`s rubrik-ägande gren
används INTE här — identiskt med Väntelistans/Dokument-ytans val).

**Den genuina formskillnaden, mätt (`boundingBox()`, hermetisk fixturvärld,
5 registreringar/3 event, samma fixturdata som facit-bildtagningen):**

| Element | Före (x, 1280 px) | Efter (x, 1280 px) | Före (x, 375 px) | Efter (x, 375 px) |
|---|---|---|---|---|
| Chevron/tillbakalänk | (textlänk, ingen egen indragning utöver `<main>`s `px-4`) | **372** | — | **32** |
| `<h1>` "Anmälningar" | 356 | **372** | 16 | **32** |
| Filterknappens högerkant | 924 | **908** | 359 | **343** |
| Tomt-/felläget, skelettets rubrikrad | 356 | **372** | 16 | **32** |
| Listkortet (`<ul>`) — **MEDVETET UNDANTAGET** | 356 | **356** (oförändrad) | 16 | **16** (oförändrad) |

Chevronen/rubriken/filterraden/tomt-/felläget/skelettets rubrikrad flyttar
alla 16 px åt höger och landar på x=372 — samma linje väntelistans redan
promoverade form bär (mätt i samma körning: chevron/h1 vid x=372, 1280 px).

**LISTKORTET ÄR MEDVETET UNDANTAGET från indragningen — en avvikelse från
`TASK-299.11`s precedent (Aktivitetshistoriks "dagsgruppernas kort" fick SAMMA
indragning som rubriken), grundad i en mätt regression:**

En rak `px-4` på ankaret UTAN undantag drog ytterligare 32 px (16 px per
sida) från radens `minmax(0,1fr)`-innehållskolumn — samma kolumn
`mer-anmalningar-form.acceptance.test.ts` § Radanatomin vid MOBIL bredd
bevakar sedan en verklig bugg 2026-08-23 (statusbadge + tidskolumn klämde
namnet till två pixlar vid 375 px). Mätt EXAKT: namnkolumnen föll från
98,671875 px (den siffra § SIDMARGINALEN i `AnmalningarSida.tsx`s docblock
redan dokumenterar) till **66,671875 px** — under grindens golv på 80,
grinden röd.

Fixen: `<ul>` (och dess laddnings-skelett) bär `-mx-4` utöver sin egen
befintliga `px-4`/`p-4` — häver ankarets nya indragning och lämnar kortets
vänsterkant på x=356/16, EXAKT där den stod innan denna landning. Nettot på
radens tillgängliga bredd är NOLL: namnkolumnen mättes till **98,671875 px**
efter fixen — identisk med talet före, verifierat i samma körning som
fällde på 66,671875 (`tests/acceptance/mer-anmalningar-form.acceptance.test.ts`
rad 971, tillfällig `console.log` i mätningen, riven igen efter avläsning).
Golvet (läsbarhet, `~/.claude/CLAUDE.md` § Instruktioner: "Golvet ... skärs
ALDRIG bort i enkelhetens namn") väger tyngre här än pixel-perfekt
kant-linjering av EN boxad komponent — resten av innehållskolumnen är i
linje med väntelistans/dokument-ytans/aktivitetshistorikens form. Fullt
resonemang i komponentens docblock, `AnmalningarSida.tsx` § SIDRAMEN
(TASK-299.10) OCH NAMNKOLUMNENS GOLV.

Radanatomin, dagsgrupperingen (ej tillämpligt denna yta), filterradens fyra
kontroller, statusraden och åtgärdsköns återväg är I ÖVRIGT OFÖRÄNDRADE mot
det godkända facit-manifestet — avvikelsen är avgränsad till sidkromets
IMPLEMENTATION (delad primitiv i stället för textlänk) och till
innehållskolumnens vänstermarginal, MED det explicit dokumenterade
undantaget för listkortet.

**Marcus-grunden:** citatet ovan (QA 2026-08-23) samt PRD `TASK-299` §
OMFATTNINGEN LÅST punkt 2 (ytaxeln: "jag tycker vi ska köra full omfattning"
— den delade sidramen bärs av alla ytor, inklusive anmälningssidan;
ägandeskapsaxeln: bara sidkromet, rubriken lever kvar i sidan).

## Klassning: **(c)** — formen ändras faktiskt, prod-synligt

`ADR-102` § A2 steg 2: **påverkar ändringen vad en användare ser i prod?**

**Ja.** Lotta ser en 44 px rund chevron i stället för en understruken
textlänk, och innehållskolumnens vänstermarginal flyttar 16 px åt höger för
rubriken, filterraden, tomt-/felläget och skelettet — en mätbar, renderad
skillnad (dokumenterad ovan med `boundingBox()`-tal före/efter). Detta är
inte en artefakt av testfixturen eller miljön (`ADR-102` § A2 skärpning 1)
— det är en avsiktlig layoutändring en riktig Lotta ser i prod.
Osäkerhetsregeln ("osäkert ⇒ klass (c)") gör klassningen entydig även om
skillnaden hade varit mindre tydlig.

## Vad som INTE är amenderat

- Facit-BILDERNA (samtliga sju: `facit-anmalningssidan-{lista,atgardskon,
  tomt}-{desktop,mobil}.png` + `facit-anmalningssidan-filterpanel-
  desktop.png`) ÄR ersatta i denna commit — till skillnad från
  `TASK-299.11`s AktivitetsHistorik-precedent (som lämnade sina bilder en
  generation bakom) tar denna skiva om samtliga sju med samma hermetiska
  rigg och samma fixturdata (fem anmälningar/tre event) som den
  ursprungliga `TASK-299.4`-capturen, ompekad mot den skarpa routen
  `/mer/anmalningar` (`/dev/anmalningar-prototyp` är riven enligt `ADR-103`
  B2 steg 4). Mobil-viewportens höjd är samtidigt återställd till
  konventionens 812 px (var 1100 i ursprungsriggen) — höjdökningen fanns
  bara för att den nu rivna `PrototypeSwitcher`-railen annars ockluderade
  radtext; skälet för avvikelsen är borta med resten av
  dev-prototypsubstratet.
- Det mekaniska facit (manifestets `not`-fält) är inte omskrivet —
  `not`-fältets prosa beskriver fortfarande radanatomin, filtrets fyra
  dimensioner och de tre lägena korrekt; bara sidkromets IMPLEMENTATION
  och innehållskolumnens vänstermarginal har flyttat.
- Manifestet deklarerar `"referenser": []` (mekaniskt facit-lås, invariant
  d) — denna amendering påverkar därför inget hash-låst innehåll
  (`scripts/check-facit.sh` invariant (d) berörs inte; `bash
  scripts/check-facit.sh` kördes grönt efter bildbytet).
- Promoverings-grindens `ariaSnapshot`-referenser
  (`tests/visual/__aria__/anmalningssidan-promoverings-grind.spec.ts/`)
  är INTE regenererade — och det är ett mätt fynd, inte en glömska.
  Snapshotten scopas till `[data-testid="anmalningar-yta"]`, och sidkromet
  (textlänken förut, `SidRam` nu) står MEDVETET UTANFÖR det ankaret i BÅDA
  formerna (se `AnmalningarSida.tsx` docblock § YTANS_ANKARE och grindens
  egen fil-docblock § "Ankaret: formen, inte sidkromet"). Grinden kördes
  om oförändrad (`npm run test:visual -- tests/visual/anmalningssidan-
  promoverings-grind.spec.ts`, 18/18 gröna) mot de NYA referenserna utan
  någon regenerering — noll diff, eftersom det ändrade elementet aldrig låg
  inom det som jämförs.

## Omstämplings-läge

**Väntar på Marcus omstämpling** (`ADR-104` beslut 1–2, `!`-kanalen,
`--ersatt`-formen). `godkand`-fältet i `facit.json` rörs INTE av denna
agent-commit.
