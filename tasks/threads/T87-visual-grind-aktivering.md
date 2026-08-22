---
owner: marcus803
updated: 2026-08-22
review_by: 2026-10-24
status: stable
lifecycle: paused
---

# T87 — Visual-grindens aktivering (medvetet parkerad)

> Tråd-kort (ADR-053). Född S81 2026-07-24 ur task-36.7-stängningen.
> Commit-tagg: `[T87]`.

## Ursprung och beslut

Task-36.7 byggde visuell regression från noll: hermetisk fixturvärld,
sex vyer × två vyportar (2x, Marcus-beslut S81), CI-födda linux-baselines
via `visual-baselines.yml`, hela kedjan bevisad ände-till-ände (baseline-PR
nr 140). Det SISTA steget — CI-jobbet som gör jämförelsen till en
blockerande grind — parkerades på **Marcus-beslut A (S81)**: appen är i
tidig UI-fas med många avsiktliga utseende-ändringar per session, och en
aktiv grind hade blockerat auto-mergen vid varje design-ändring — i direkt
konflikt med T85:s processhastighets-arbete. En vakt vars larm är förväntat
vid varje ändring bär ingen signal.

Rådgivande läge (`continue-on-error`) förkastades öppet: signal som får
ignoreras är kyrkogårds-klassen (L321).

## Vad som redan fungerar utan grinden

- `npm run test:visual` lokalt — Codes eget verktyg under bygget
  ("vad ändrade min ändring?"), personliga darwin-baselines gitignorerade.
- `visual-baselines.yml` — dispatchbar när som helst; föder granskningsbar
  baseline-PR (räknefixen `-uall` + inställnings-förutsättningen
  dokumenterad i workflow-headern). **Sedan `TASK-298` (2026-08-22) bär den
  en VALFRI `specfilter`-input** som begränsar körningen till namngivna
  specar; tom input = hela sviten, oförändrat. Riktad körning märks i
  grennamn, PR-titel och PR-kropp, och skräp-input fälls fail-closed före
  bildgenereringen. Ytan beskrivs i `CONTRIBUTING.md` § Visuell regression;
  hela WHY:et i workflow-huvudet § RIKTAD KÖRNING.
- Linux-baselines (2x, 2880×1804) incheckade och Marcus-välsignade
  (PR nr 140, S81).

## Aktiverings-trigger

Grinden aktiveras när UI-iterationstakten lugnat — naturliga kandidater:
inför bas-maximeringen (ADR-063-milstolpen) eller när Lotta börjar använda
appen skarpt. Marcus avgör; tråden är påminnelsen.

## FÖRKRAVET ÄR BETALT (S89 2026-07-25) — `TASK-49` löst

`maxDiffPixels: 2000` satt vid sidan av befintlig ratio. Playwright tar
`Math.min` av de två taken (källkod, `playwright-core` 1.61.1), så det
absoluta taket biter på stora bilder medan ratio-taket biter på små —
ingen per-projekt-uträkning behövs. Bevis: samma app-breda ändring som
QA:n använde fångas nu av **12/12** vyer (före: 4 mobila, 0 desktop), och
12/12 är gröna på orörd kod.

Två av kortets premisser rättades under mätningen: ytkvoten 4,26× är
**maxvärdet, inte det generella** (bilderna är fullPage, så ytan följer
sidans höjd — uppmätta kvoter 2,37–4,26×), och eventsidans desktop-bild
tillät i praktiken 201 772 avvikande pixlar.

**Kvarstående osäkerhet inför aktivering:** brusgolvet (0 px över tre
körningar) är mätt på darwin. Linux-brus i CI är omätt eftersom sviten inte
körs i CI förrän denna tråd aktiverar grinden — första CI-körningen är
facit. Marginalen är tilltagen för det (2000 mot minsta äkta fynd 11 357).

Aktiveringen självt är **oförändrat parkerad** på Marcus-beslut A (S81);
denna sektion tar bara bort blockeraren, den flyttar inte triggern.

## Historik: förkravet som det formulerades (S88 2026-07-25)

QA-vandringen (task-36.8 punkt 11) avslöjade att sviten är **systematiskt
blind på desktop**: en app-bred ändring av brödtextfärgen fångades av 4 av 6
MOBILA vyer och av **noll** desktop-vyer. Grundorsaken är `maxDiffPixelRatio:
0.01` — en ANDEL — mot vyportar med 4,26× ytskillnad (desktop 5 184 000 px
mot mobil 1 218 000 px). Bevis: med ratio 0.001 failade alla 12 inklusive
samtliga desktop.

**Konsekvens för denna tråd:** aktiverings-steget nedan är fortfarande
tekniskt korrekt, men skulle sätta upp en grind som släpper igenom
desktop-regressioner. Det vore falsk trygghet — sämre än ingen grind, per
husets egen kyrkogårds-regel.

Aktivera alltså INTE före **`TASK-49`** är löst. **(Betalt S89 — se sektionen ovan.)** Marcus-beslutet i S88
(nightly-visual → A, vänta) fattades innan fyndet fanns och **stärktes av
det**: hade vi aktiverat tidigt hade vi trott oss skyddade utan att vara det.

## Aktiverings-steget (EN liten PR)

1. Färska baselines först om utseendet ändrats sedan senaste välsignelsen:
   dispatcha `visual-baselines.yml` → granska → merga baseline-PR:n.
2. Lägg jobbet nedan i `.github/workflows/ci-suite.yml` (efter `a11y`,
   före `test-staging`). Suite-resultatet bär jobbet → paraplyet
   (`ci-passed`, L322) behöver INTE röras; D1 + full-klass kör det,
   docs-klassen skippar det via caller-gaten, nightly får det via samma
   reusable (AC 7 + AC 8 i task-36.7 verkställs båda av detta enda steg).
3. Statiska grindar (actionlint med queue-ignore, yamllint) + PR:ns egen
   gröna körning mot befintliga baselines är beviset.

```yaml
  # Visuell regression (task-36.7, aktiverad via T87) — hermetisk
  # fixturvärld: alltid-färsk dev-server på dedikerad port med FIKTIV
  # Supabase-URL, allt nätverk mockat (tests/support/fixturvarld/hermetic.ts)
  # → INGA secrets, INGEN staging, INGEN mutex. Körs därför ÄVEN för
  # dependabot (secrets-isolationen ADR-031 är irrelevant utan secrets —
  # medvetet INGEN actor-skip): en Playwright-/browser-bump ska få sin
  # FÖRVÄNTADE baseline-drift synlig på själva uppgraderings-PR:n
  # (kadens-regeln, CONTRIBUTING § Visuell regression). Baselines föds
  # ALDRIG här: --update-snapshots=none failar hårt vid saknad eller
  # avvikande baseline — födseln bor i visual-baselines.yml.
  visual:
    name: Visuell regression
    runs-on: ubuntu-latest
    timeout-minutes: 8
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v7
        # Medvetet UTAN fetch-depth-config — utanför bärar-mängden (ADR-039).

      - name: Setup Node
        uses: actions/setup-node@v6.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # Samma cache-nyckel som a11y/test-staging (ADR-029 §1c) — först
      # färdiga jobbet värmer, de andra hit:ar.
      - name: Cache Playwright browsers
        uses: actions/cache@v6.1.0
        id: playwright-cache-visual
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-playwright-

      - name: Install Playwright Chromium
        run: npx playwright install chromium

      - name: Visuella regressionstester (frusen fixturvärld)
        run: npm run test:visual -- --update-snapshots=none

      # Diff-artefakterna (expected/actual/diff per bild) är själva
      # granskningsunderlaget vid rött — utan dem är ett visuellt fel
      # bara en pixelsiffra i loggen.
      - name: Ladda upp visuella diff-artefakter vid rött
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diff-artefakter
          path: test-results/
          retention-days: 7
          if-no-files-found: ignore
```

## Vardagen när grinden är aktiv (så blir det INTE trögt)

Grönt visual-jobb = kvitto på att utseendet står stilla — noll manuellt.
Avsiktlig design-ändring: Marcus godkänner utseendet i browser-QA:n
(granskningsfärdig-läget, ADR-071) som idag — baseline-uppdateringen är
därefter BOKFÖRING på det kvittot (Code dispatchar + refererar
QA-kvittensen), inte en andra bildgranskning. Bild-granskning på riktigt
behövs endast vid uppgraderings-drift (kadens-regeln) — sällan.

## Designtrail

Sessionsdok S81 Del 2–6 (hela bygget) · CONTRIBUTING § Visuell
regression · task-36.7-kortet (AC 7–8 = detta aktiverings-steg) ·
besläktad `T85` (våg 2b).

## Utökat aktiverings-krav (S90, 2026-07-26)

Aktiveringssteget måste förnya **personer-baselinen**, inte bara eventsidans.

S90:s prototyp-pass skrev om den hermetiska fixturvärlden: `get-persons` gick
från ett fruset svar med 8 personer till en **paginerande resolver** med ~17
personer och `FIXTURE_PAGE_SIZE = 10`. Personlistan renderar därmed 10 rader
plus "Ladda fler" där baselinen har 8 rader utan knapp.

`tests/visual/__screenshots__/personer.spec.ts/personer-visual-{desktop,mobile}-linux.png`
är alltså **stale sedan commit `f0f11f3`** och personer-testet går rött så
snart visual-sviten körs på linux. Det märktes inte i S90 eftersom grinden är
parkerad — vilket är precis den tysta drift en parkerad grind samlar på sig.

Sedan tidigare gäller samma sak för `eventsida.png` (task-48 byggkrav 8,
markera-läget). Aktiveringen behöver alltså förnya **minst två** baselines,
och steget bör börja med en inventering av vilka fler som driftat under
parkeringen — inte med en lista skriven före den.

Fynd-källa: S90:s smoke-verifiering av prototyp-varianterna.

## KRAVET ÄR BETALT (S91, 2026-07-27) — `TASK-55` Done

Baselines är regenererade ur CI och granskade av Marcus (PR #287, grön per
jobb 8/8). Bevis-dispatchen därefter loggar *"Inga baseline-ändringar —
renderingen matchar incheckade bilder"* (run `30297097792`). Det som blockerade
aktiveringen finns alltså inte längre: grinden skulle inte fälla på stale
bilder i dag.

**Inventeringen som sektionen efterlyste gjordes — och listan var längre än
väntat.** Sektionen ovan förutsåg två vyer (personer + eventsida). Faktiskt
utfall: **tre vyer × två vyportar = sex bilder**. Den tredje var
`event-lista`, driftad av filterknappen ur `f11cc37` (task-17.7). Den stod
inte i någon lista skriven i förväg — precis den poäng sektionen gjorde om att
börja med en inventering i stället för med en lista.

Varje ändrad bild spårades till en commit efter baseline-commiten `b9d3022`,
och ingen var en regression. En felspårning gjordes på vägen och rättades:
`event-lista` antogs först bero på hover-återkopplingen i `0f8860a` — men
hover fotograferas inte, vilket syntes så snart bilderna faktiskt öppnades och
jämfördes.

**Vad som INTE ändras här:** triggern. Marcus-beslut A (S81) står — grinden
aktiveras när UI-takten lugnar sig, inte för att blockeraren är borta. Denna
sektion tar bort ett hinder, den flyttar inte beslutet.

En sidopost föddes under arbetet: `TASK-56` (WebSocket-vägen går förbi
hermetik-vakten). Den rör fixturvärldens täthet, inte grinden, och är
oetiketterad tills Marcus klassar den.

## Parkeringen bekräftad på nytt (2026-08-01)

S91:s trådkarta prövade frågan aktivt, och Marcus bekräftade parkeringen,
ordagrant: *"T87 ska INTE aktiveras. Det är mycket visuellt arbete kvar i
appen."* Detta är en FÖRNYAD bekräftelse av Marcus-beslut A (S81), inte en ny
trigger — trigger-formuleringen ovan ("grinden aktiveras när
UI-iterationstakten lugnat") står oförändrad, liksom `lifecycle: paused`.

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Titel (fullständig, ursprunglig):**
Visual-grindens aktivering — task-36.7 byggde hela vakten (hermetisk fixturvärld · 12 st 2x-linux-baselines Marcus-välsignade PR nr 140 · `visual-baselines.yml` bevisad ände-till-ände) men SISTA steget (CI-jobbet i ci-suite som blockerande grind, AC 7–8) parkerades på Marcus-beslut A (S81): tidig UI-fas med många avsiktliga utseende-ändringar — aktiv grind hade blockerat auto-mergen per design-ändring (mot T85:s hastighetsarbete); rådgivande läge förkastat (L321-klassen). Aktiverings-jobbet ligger färdigt i kortet; trigger: UI-takten lugnar (bas-maximeringen / Lotta skarp drift)

**Ingång (fullständig, ursprunglig):**
[T87-visual-grind-aktivering.md](T87-visual-grind-aktivering.md) · besläktad `T85`
