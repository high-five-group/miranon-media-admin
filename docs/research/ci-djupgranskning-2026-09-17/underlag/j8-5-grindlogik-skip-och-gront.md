---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# J8.5 — Grindlogiken: kan CI bli grönt trots att ett relevant test aldrig kördes?

> **Proveniens:** skriven 2026-09-17 av en analysagent i S126:s CI-djupgranskning
> (modell: Opus 5, 1M kontext — medveten avvikelse från repots tier-policy,
> bokförd i uppdraget). Ögonblicksbilden är `origin/main` på `eeca8c72`
> (2026-09-08) i worktreen `.claude/worktrees/s126-ci-djupgranskning`. Alla
> `gh`-anrop är läsande; ingenting kördes, dispatchades eller ändrades på
> GitHub. Uppdrag: `tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md`
> avsnitt 8.5 (rad 342–352) och fråga 3 av de fem viktigaste (rad 389).
> Arbetskontrakt: `00-agentkontrakt.md` i samma katalog.

## Kort svar

**Ja — men nästan uteslutande på ett sätt som är avsiktligt, utskrivet och
mätbart, inte som ett dolt hål.**

Tre svar i tur och ordning:

1. **Paraply-checken är genuint fail-closed.** Det jobb som ensamt avgör om en
   PR får landa heter i dag `CI Passed or Skipped` och kör alltid. Blir något
   jobb rött eller avbrutet blir paraplyet rött. Jag har verifierat både
   grenarna mot verkliga körningar — inte bara läst koden. Det hål som orsakade
   S77-incidenten (en röd PR som auto-mergades) är stängt.

2. **Tester HOPPAS ändå — men efter en regel, inte av misstag.** Repot har en
   filklassning som säger: rör ändringen bara dokumentation, hoppa hela
   testsviten. Den regeln är byggd som en *tillåtelselista* (bara det som
   uttryckligen står med får hoppa), och varje osäkerhet faller till "kör
   allt". Jag prövade 46 konstruerade ändringsscenarier mot de verkliga
   mönstren och hittade **ingen** kombination där ett jobb som borde ha kört
   blev hoppat av misstag och ändå gav grönt.

3. **Den verkliga faran ligger inte i grindlogiken utan under den.** Hela
   konstruktionen vilar på ett uttalat villkor i `ADR-077`: att hoppa tester
   före landning är försvarbart **endast** om ett skyddsnät kör dem efteråt.
   Det nätet — nattkörningen — har varit **rött 40 nätter i rad**, varje natt
   från 2026-08-10 till 2026-09-17, utan undantag. Det gör rött till en färg
   utan innebörd: när en verklig testregression dök upp natten till 2026-09-17
   landade den i ett larm som redan hade tystnat. Det, och inte klassningen, är
   det som i dag kan låta ett relevant fel passera obemärkt.

Domen: **grindlogiken håller; skyddsnätet gör det inte.** Rekommendationerna
längst ned pekar därför mest på att laga nätet och att riva en
dedup-mekanism som inte längre bär sin komplexitet — inte på att bygga fler
vakter.

## Vad jag läste först

Enligt kontraktet inventerade jag befintlig kunskap innan första sökningen.

| Källa | Vad den redan avgjort | Vad som därför är nytt här |
|---|---|---|
| `docs/decisions/ADR-029-ci-architektur-changed-files-pattern.md` | CI-arkitekturen, `changed-files`-idiomet, säkerhetshärdning | — |
| `docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md` | Klassningen som tillåtelselista, dedupen, nattnätet, paraply-checkens fail-closed-krav | Jag prövar §2:s sundhetsvillkor mot verkligheten och mäter nattnätets faktiska tillstånd |
| `docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md` (+ amendering 2026-08-05) | Rulesetet, merge queue, `strict` avstängd | Jag mäter rulesetet i dag och korsläser mot `ADR-077` §2 |
| `docs/decisions/ADR-105-review-grinden-*.md` | Review-grinden, backstoppen, D0-undantaget | Jag prövar backstoppens skip-beteende empiriskt |
| `docs/decisions/ADR-083-prosa-som-pastar-mekanism.md` | Disciplinen: prosa får aldrig påstå en mekanism som saknas | Fyra nya instanser av den felklassen, listade nedan |
| `tasks/lessons/vol-04.md` `L322`, `L323` | S77-incidenten och dess regel | Jag verifierar att regeln fortfarande gäller i koden |
| `tasks/lessons/vol-05.md` `L395`, `L407`, `L408`, `L415` | Kontrastbevisets form; grindar som saknas för en hel trafikklass; vakter som är tomma i stället för nöjda | Ramverket för hur jag klassar mina egna fynd |
| `docs/research/riskanpassad-ci-design-2026-07-23.md` | Designunderlaget bakom klassning och dedup | — |
| `docs/research/verify-ci-parity-regel-vantetid-2026-08-05.md` | Mätserien bakom paritetsverktygets användningsregel | — |
| `docs/research/kallkodsdrivet-testurval-verktyg-2026-07-29.md`, `testurval-kallkodsdrivet-2026-07-29.md` | Varför en testgraf inte byggdes | Jag bekräftar att slotten fortfarande står öppen |

Ingen tidigare fil i `docs/research/` ställer J8.5:s fråga. Den närmaste
grannen är designunderlaget från S77, som beskriver hur klassningen **skulle**
byggas — inte hur den beter sig i dag, två månader och ett merge queue senare.

## Metod

Ett begrepp först, för läsaren utan teknisk bakgrund: **CI** ("continuous
integration") är den automatiska kontroll som körs på varje föreslagen ändring
innan den får läggas till i projektet. Den består av **jobb** — avgränsade
uppgifter som "kör testerna" eller "kontrollera stavningen" — som körs på
GitHubs servrar enligt recept som kallas **workflow-filer**.

Jag gjorde sex saker.

1. **Läste aggregatorns kod.** `.github/workflows/ci.yml` (158 676 byte, 2 566
   rader) och `.github/workflows/ci-suite.yml` (53 336 byte, 976 rader) i
   bitar, plus `gate-proof.yml`, `review-backstopp-proof.yml` och
   `post-merge.yml`. Ur det byggde jag sanningstabellen nedan.
2. **Mätte rulesetet.** `gh api repos/high-five-group/miranon-media-admin/rulesets`
   och detaljanropet på ruleset `19627609`, 2026-09-17.
3. **Byggde en lokal kopia av klassningen** och prövade 46 konstruerade
   ändringsscenarier mot den. Kopian läser mönstren **verbatim** ur `ci.yml`
   via filens egna paritets-markörer — jag skrev aldrig av en glob-lista — och
   matchar med `micromatch` 4.0.8, samma bibliotek som `ci.yml`:s egna
   kommentarer och `scripts/verify-ci-parity.mjs` använder som facit.
4. **Validerade kopian mot verkligheten** innan jag litade på den. Fem faktiska
   PR:ers fillistor kördes genom kopian och jämfördes med vad CI faktiskt
   gjorde. Fem av fem stämde (tabell i F8).
5. **Läste verkliga körningar.** 80 `ci.yml`-körningar plus riktade
   jobbutfall för tolv av dem, fyra nattkörningar, samt hela nattnätets
   utfallsserie.
6. **Mätte dedupens träffbarhet lokalt ur git-historiken** — 1 887 merge-commits
   sedan kön aktiverades — utan att belasta GitHubs API.

**Vad kopian inte är:** den är en replik, inte själva actionen. Den kan avvika
från `tj-actions/changed-files` i kanter jag inte prövat (raderade filer,
symlänkar, mycket stora diffar). Där kopian ensam bär ett påstående märker jag
det **starkt indikerad**, inte verifierad. Där ett verkligt körningsutfall
bekräftar samma sak märker jag **verifierad**.

## Fynd

### F1 — Vilka jobb är obligatoriska för merge, och vad heter de i dag

Uppdragsfilen är från 2026-07-29 och namnen har rört sig. Så här ser det ut
2026-09-17.

**Rulesetet kräver exakt EN check.** Mätt 2026-09-17 med
`gh api repos/high-five-group/miranon-media-admin/rulesets/19627609`:

```json
"required_status_checks": [
  { "context": "CI Passed or Skipped", "integration_id": 15368 }
]
```

Det namnet matchar `ci.yml:2538` (`name: CI Passed or Skipped`) **exakt**, och
det rapporteras från samma jobb på båda ytorna — på PR-sidan och i merge-kön —
eftersom hela workflowen lyssnar på både `pull_request` och `merge_group`
(`ci.yml:5–24`). Verifierat i verkliga körningar: PR-körning `34248619879` och
kö-körning `34263297748` bär båda ett jobb med precis det namnet. **Verifierad.**

Ett required check-namn som inget jobb rapporterar skulle ge en PR som väntar
för evigt; ett namn som rapporteras av fel jobb vore ett hål. Ingetdera
föreligger.

Resten av rulesetet, samma mätning:

| Regel | Värde | Innebörd i klartext |
|---|---|---|
| `required_status_checks` | 1 st: `CI Passed or Skipped` | Den enda mekaniska grinden |
| `strict_required_status_checks_policy` | **`false`** | Grenen behöver inte vara uppdaterad mot `main` — kön sköter det |
| `pull_request.required_approving_review_count` | `0` | Ingen mänsklig godkännare krävs |
| `pull_request.require_code_owner_review` | `false` | `CODEOWNERS` är rådgivande, inte blockerande |
| `merge_queue.grouping_strategy` | `ALLGREEN` | Varje köad post byggs och prövas för sig |
| `merge_queue.max_entries_to_merge` | `3` | Upp till tre poster kan landa i samma svep |
| `bypass_actors` | `[]` (tom) | Ingen kan gå förbi grinden |
| `enforcement` | `active` | Regeln gäller skarpt |

**Jobben i `ci.yml`, med dagens namn:**

| Jobbnyckel | Namn i dag | Kör alltid? | Villkor |
|---|---|---|---|
| `changed` | `Detect changed files` | **Ja** | inget `if:`, inget `needs:` |
| `lint` | `Lint + TypeCheck` | **Ja** | inget `if:`, inget `needs:` (namnet bytte 2026-09-04, `TASK-395`) |
| `audit` | `Audit dependencies (audit-ci)` | **Ja** | eget jobb sedan 2026-09-04, `TASK-395` |
| `suite` | `Test suite` | Nej | hoppas vid dokumentations-diff eller dedup-träff |
| `docs` | `Docs link check` | Nej | körs bara när dokumentation ändrats |
| `review-backstopp` | `Review-backstopp (granskningsutlåtande)` | Nej | endast i merge-kön, och inte på dokumentations-diffar |
| `ci-passed` | **`CI Passed or Skipped`** | **Ja** (`if: always()`) | paraplyet, det required check:et |

Tre av sju jobb kan alltså **aldrig** hoppas: `changed`, `lint` och `audit`.
Det är mer täckning än man först tror, eftersom `lint` inte bara är
formatkontroll utan bär ett trettiotal grindvakter — typkontroll, `actionlint`,
`yamllint`, `shellcheck`, mallparitet, frontmatter-kontroll och ett tjugotal
egna testsviter för grindskripten (`ci.yml:503–2096`).

### F2 — Vad "CI Passed or Skipped" innebär: sanningstabellen

Paraply-jobbets hela logik står i `ci.yml:2556–2566` och är kort nog att citera
i sin helhet:

```yaml
- name: Verifiera needs-resultaten (fail-closed)
  env:
    NEEDS: ${{ toJSON(needs) }}
  run: |
    echo "${NEEDS}" | jq -r 'to_entries[] | "\(.key): \(.value.result)"'
    bad=$(echo "${NEEDS}" | jq -r '[to_entries[] | select(.value.result == "failure" or .value.result == "cancelled")] | length')
    if [ "${bad}" -ne 0 ]; then
      echo "❌ ${bad} jobb med failure/cancelled — aggregatorn FAILAR explicit (aldrig skipped; required-check-hålet stängt S77)."
      exit 1
    fi
    echo "✅ CI Passed or Skipped — alla jobb success eller skipped-by-design."
```

Två egenskaper bär hela grinden:

- **`if: ${{ always() }}` ensamt** (`ci.yml:2539`). Jobbet körs oavsett vad som
  hänt med de sex jobb det beror på. Utan `always()` hade GitHub hoppat det så
  fort ett av dem blev rött — och det var precis S77-incidenten.
- **Räkningen är positiv, inte negativ.** Steget räknar `failure` och
  `cancelled` och avbryter med felkod om summan inte är noll. Det gör
  `skipped` till ett tillåtet utfall med avsikt.

Namnet säger alltså exakt vad det gör: *passed or skipped*.

**Sanningstabellen — varje `needs`-jobb mot varje möjligt utfall:**

| `needs`-jobb | `success` | `failure` | `cancelled` | `skipped` | Kan jobbet bli `skipped`? |
|---|---|---|---|---|---|
| `changed` | grön | **RÖD** | **RÖD** | grön | Nej — inget `if:`, inget `needs:` |
| `lint` | grön | **RÖD** | **RÖD** | grön | Nej — samma skäl |
| `audit` | grön | **RÖD** | **RÖD** | grön | Nej — samma skäl (utskrivet i `ci.yml:2545–2550`) |
| `suite` | grön | **RÖD** | **RÖD** | grön | **Ja** — dokumentations-diff eller dedup-träff |
| `docs` | grön | **RÖD** | **RÖD** | grön | **Ja** — när ingen dokumentation ändrats |
| `review-backstopp` | grön | **RÖD** | **RÖD** | grön | **Ja** — utanför kön, eller på dokumentations-diff |

Kolumnerna `success`/`failure`/`cancelled` är läsning av jq-uttrycket ovan.
`skipped`-kolumnen är där hela frågan bor, och den är grön för alla sex.

**Det viktiga är att de tre hoppbara jobben inte kan hoppas godtyckligt.** Alla
tre hänger på `changed`, och GitHubs egen dokumentation är kategorisk om vad
som händer när ett `needs`-jobb fallerar: *"If a job fails or is skipped, all
jobs that need it are skipped unless the jobs use a conditional expression that
causes the job to continue."* Det låter som ett hål — ett rött `changed` skulle
hoppa `suite`, `docs` och `review-backstopp`, och tre hoppade jobb är gröna.
Men `changed` självt står kvar i paraplyets `needs`-lista och är då `failure`,
vilket ensamt fäller grinden. Kedjan sluter sig.

**Empiriskt belagt i båda riktningar:**

| Bevis | Körning | Vad den visar |
|---|---|---|
| Rött inre jobb → rött paraply | `34247598715` (`pull_request`) | `Test suite / Acceptance (hermetisk) (1)` = `failure` → `CI Passed or Skipped` = **`failure`** |
| Avbrutet inre jobb → rött paraply | `34247226761` (`pull_request`) | `Test suite / Acceptance — tvåsidigt bevis` = `cancelled` → `CI Passed or Skipped` = **`failure`** |
| Hoppade jobb → grönt paraply | `34249685743` (`pull_request`) | Fem `skipped` inre jobb, noll röda → `CI Passed or Skipped` = `success` |

**Verifierad.** `cancelled`-grenen är särskilt värd att notera: den är sällan
prövad i den här typen av konstruktioner, och här finns en verklig körning som
visar den fyra.

**En kant att känna till:** en check som aldrig *rapporteras* är inte grön. Om
hela workflowen inte startar blockeras landningen i stället, eftersom GitHub
låter den obligatoriska checken stå kvar som väntande. Förstapartskällan
skiljer uttryckligen på de två fallen: *"Successful check statuses are
`success`, `skipped`, and `neutral`"* men vid filter-skip *"associated checks
stay in a 'Pending' state and block merging"*. Repots konstruktion undviker
det senare genom att aldrig lägga path-filter på själva workflowen — filtret
sitter på jobben inuti. Det är rätt val och det är medvetet.

### F3 — Kan ett viktigt test markeras som hoppat och ändå ge grönt?

Frågan har två helt skilda halvor, och de blandas lätt ihop.

**Halva A — hoppat med avsikt (klassningen sa det).** Ja, och det är hela
poängen. En ändring som bara rör dokumentation hoppar hela testsviten; paraplyet
blir grönt; PR:en landar. Det är designen, den är beslutad i `ADR-077` och den
är utskriven i `ci.yml:2159–2162`. Se F4–F6 för när det är rimligt.

**Halva B — hoppat av misstag.** Det är den farliga klassen. Jag letade efter
den på fyra sätt och hittade den inte:

1. **Ett `if:` som faller fel.** De tre hoppbara jobbens villkor läser alla
   utdata från `changed`. Om en utdata saknas eller är tom utvärderas jämförelsen
   `== 'true'` till falskt — vilket för `suite` betyder *kör* (villkoret är
   `!= 'true'`) och för `docs` betyder *hoppa*. Den senare riktningen är
   fail-open, men bara i teorin: utdatan kan inte saknas utan att steget
   fallerat, och ett fallerat steg gör hela `changed`-jobbet rött, vilket
   fäller paraplyet.
2. **Ett `needs`-jobb som drar med sig barnen.** Täckt ovan — `changed` står
   kvar i paraplyets `needs` och fäller det självt.
3. **`continue-on-error` som maskerar ett rött jobb.** Flaggan finns inte
   någonstans i `ci.yml` eller `ci-suite.yml` utom på ett artefakt-uppladdningssteg
   (`ci-suite.yml:962`), och båda filerna bär uttryckliga förbud i prosa mot att
   införa den (`ci-suite.yml:210` och `:622`). Där den används — i de två
   bevis-workflowsen — är det på **stegnivå** och med en utskriven motivering:
   jobbnivå hade maskerat utfallet även i API:t (`gate-proof.yml:21–23`).
   Mätt med `grep -rn "continue-on-error" .github/workflows/`, 2026-09-17.
4. **Ett hoppat jobb inuti det anropade workflowet.** Här finns en verklig,
   men ofarlig, asymmetri. `Test suite` är ett **anrop** till `ci-suite.yml`,
   och flera jobb därinne hoppas rutinmässigt (`A11y`, de två staging-jobben).
   Ett hoppat inre jobb gör inte anropet rött — bekräftat i körning
   `34249685743`. Men ett **rött** inre jobb gör det, bekräftat i `34247598715`.
   Signalen går alltså uppåt i den riktning som betyder något.

**Slutsats: verifierad.** Jag har inte hittat någon kombination där ett jobb som
borde ha kört blir hoppat av misstag och paraplyet ändå blir grönt. Det betyder
inte att ingen finns — frånvaro av bevis är inte bevis — men fyra oberoende
angreppsvägar gav samma svar.

**Den felklass som faktiskt inträffat är en annan, och den är värd sitt eget
stycke.** Den heter inte "ett jobb hoppades av misstag" utan **"klassningen
räknade fel och lyckades ändå"**. Det har hänt skarpt: före `TASK-15` saknade
`changed-files`-stegen inställningen `quotepath: false`, och Gits standard
gjorde att filnamn med å, ä eller ö inte matchade mönstret `**/*.md`. Följden
var två olika fel i två olika riktningar, båda dokumenterade i `ci.yml`:

- för testsviten blev svaret "kör allt" — dyrt men säkert (`ci.yml:138–145`);
- för dokumentations-jobbet blev svaret `docs_changed=false`, alltså
  **"Docs link check TYST SKIPPAD på en äkta docs-ändring"** — filens egna ord
  (`ci.yml:291–294`), som själv kallar det *"allvarligare granne till
  only_changed-symptomet"*.

Det är den enda mätta instansen av "grönt fast något relevant inte kördes" som
jag hittat i repots historia. **Den är lagad — men fixen är inte vaktad.**
Inställningen står på fyra ställen (`ci.yml:204`, `:295`, `:322`, `:389`) och
ingen grind kräver att den finns kvar: `grep -rn "quotepath" scripts/
.listparitet-policy.conf .ci-parity-policy.json` ger noll träffar (mätt
2026-09-17). Tas den bort ur ett steg återkommer felet tyst. **Verifierad.**

### F4 — Hur `Detect changed files` avgör vilka tester som ska köras

Jobbet kör fyra oberoende matchningar av diffen mot var sin mönsterlista, plus
två skript-steg. Ingen av listorna är en förbudslista: alla fyra är
**tillåtelselistor**, och utfallet blir sant **endast om varenda ändrad fil**
matchar.

Den avgörande detaljen är hur "endast" räknas. `ci.yml:370–379` citerar
actionens källkod vid den fastnaglade versionen:

```text
onlyChanged = otherChangedFiles.length === 0
           && allChangedFiles.paths.length > 0
           && filePatterns.length > 0
```

Andra ledet är det som räddar hela konstruktionen: **noll matchande filer ger
falskt, inte sant.** Utan det hade en tom eller ovanlig diff blivit vakuöst
klassad som "bara dokumentation" och släckt sviten för varje PR. Att någon läste
actionens källa i stället för att anta semantiken är den enskilt viktigaste
designhandlingen i hela filen.

**De sex utdata och vem som lyssnar:**

| Utdata | Vad den betyder | Konsument i dag |
|---|---|---|
| `should_skip_tests` | Varje ändrad fil är i D0-listan (dokumentation och likvärdigt) | `suite`-jobbets `if:`, `review-backstopp`-jobbets `if:` |
| `docs_changed` | Minst en fil rör dokumentationsgrindarna | `docs`-jobbets `if:` |
| `ui_low_risk` (D1) | Varje ändrad fil är ren stilmall eller publik statisk fil | **Ingen** — död sedan `TASK-70.3` |
| `acceptance_local` | Varje ändrad fil ligger i `tests/acceptance/` | **Ingen** — död sedan `TASK-70.3` |
| `dedup_hit` | Trädet är redan bevisat grönt | `suite`-jobbets `if:` |
| `acceptance_urval` | Delmängd spec-filer att köra i stället för hela klassen | `suite`-anropets `acceptance_selection` |

Två av sex levrar beräknas alltså vid varje körning och styr ingenting. Det är
inte en bugg — `ci.yml:2213–2222` skriver ut det öppet och skjuter beslutet om
deras framtid till ett eget pass. Men det är komplexitet som i dag bärs utan
motprestation, och J8.5 bör säga det.

**D0-listan verbatim** (`ci.yml:219–250`, avgränsad av filens egna
paritets-markörer). Först det som får hoppa:

```text
**/*.md · LICENSE · docs/** · tasks/** · tests/vale-regression/** ·
scripts/test-vale-regression.sh · .github/ISSUE_TEMPLATE/** ·
.github/PULL_REQUEST_TEMPLATE.md · .github/CODEOWNERS ·
.vscode/extensions.json · .editorconfig · .lycheeignore · .vale.ini ·
.vale/** · .markdownlint-cli2.jsonc · .claude/** · .claude/**/.*
```

Och sedan undantagen, som slår ut allt ovan om de träffar:

```text
!.github/workflows/** · !.github/dependabot.yml · !package.json ·
!package-lock.json · !audit-ci.jsonc · !tsconfig*.json · !biome.json ·
!vite.config.ts · !playwright.config.ts · !tsr.config.json ·
!.nvmrc · !.gitignore
```

Uppdragets hypotes 2 och 3 är därmed **verifierade**: listan är en
tillåtelselista, och `.claude/**` står med — en ändring i `.claude/settings.json`
klassas som dokumentation (mätt scenario S06 nedan). `CLAUDE.md` bokför redan
den kanten öppet och väljer att inte lappa den, vilket jag håller med om: att
handplocka undantag ur en härledd lista är precis den drift härledningen finns
för att förhindra.

**Dedupen** (`ci.yml:452–499`) är ett eget steg med en egen fråga: när ett
sammanslaget träd landar i `main`, har exakt det trädet redan körts grönt? Den
läser merge-commitens andra förälder, jämför trädens innehåll och frågar
körnings-API:t. Varje avvikelse ger `false`, alltså full svit. Se F7 för varför
den i dag knappt träffar.

### F5 — Vad händer när detektionslogiken har fel: 46 hotscenarier

Jag byggde en lokal kopia av klassningen (metod, punkt 3) och körde 46
konstruerade fillistor genom den. Nedan de sexton som bär något att lära; hela
serien finns i mätdatan bakom filen.

Läsanvisning: **skip** betyder att testsviten hoppas, **docs** att
dokumentations-jobbet körs.

| # | Ändring (alla filer i PR:en) | skip | docs | Utfall i dag | Bedömning |
|---|---|---|---|---|---|
| S01 | `tests/support/hermetik.ts` | nej | nej | Full svit | Rätt |
| S02 | `tsconfig.app.json` | nej | nej | Full svit — undantagslistan fångar | Rätt |
| S03 | `package.json` | nej | nej | Full svit | Rätt |
| S04 | `.purge-staging-policy.json` (rot-config) | nej | nej | Full svit | Rätt |
| S05 | `supabase/functions/_shared/airtable-client.ts` | nej | nej | Full svit | Rätt |
| S06 | `.claude/settings.json` | **ja** | ja | Svit hoppas; Biome i `lint` läser filen | Känd, bokförd kant |
| S07 | `.github/workflows/ci.yml` | nej | ja | Full svit **plus** länkkontroll | Rätt |
| S09 | `docs/byggplan.md` **+** `src/App.tsx` | nej | ja | Full svit — en enda kodfil räcker | Rätt, och viktigt |
| S11 | `docs/mallar/bilagor/kvitto.html` | **ja** | **nej** | Svit hoppas, docs hoppas — men mallparitets-grinden i `lint` fäller | Säker via **annan** väg än den skrivna |
| S12 | `docs/mallar/bilagor/fixtures/kvitto.exempel.json` | **ja** | **nej** | Svit hoppas, docs hoppas; Biome läser JSON | Tunn men ofarlig |
| S13 | `tasks/.../facit.json` | **ja** | **nej** | Svit hoppas; `ADR-102`-grinden i `lint` läser filen | Rätt |
| S18 | `packages/ny-modul/index.ts` (katalog ingen glob känner) | nej | nej | **Full svit** | Rätt — okänt faller till fullt |
| S25 | `Makefile` (fil utan ändelse) | nej | nej | **Full svit** | Rätt |
| S28 | Tom diff (noll filer) | nej | nej | **Full svit** | Rätt — den vakuösa fällan undviks |
| S31 | `docs/.../hitl-loop.template.sh` | **ja** | **nej** | Svit hoppas, docs hoppas, `shellcheck` når inte filen | **Genuint ogrindad** |
| S43 | `docs/mallar/bilagor/kvitto.css` | **ja** | **nej** | Som S11 — mallparitet fäller | Säker via annan väg |

Och de mer sammansatta fallen:

| # | Ändring | Utfall | Bedömning |
|---|---|---|---|
| S21 | CSS **+** en `.tsx`-fil | Full svit | Rätt — blandad diff faller alltid till fullt |
| S22 | En acceptance-spec ensam | Urval: bara den specen körs | Rätt, och asymmetrin är säker (se nedan) |
| S23 | En acceptance-spec **+** ett backlog-kort | Urval: bara specen | Rätt — kortet är neutralt sällskap, med avsikt |
| S24 | `tests/acceptance/acceptance-bas.ts` (delad söm) | **Hela** klassen | Rätt — sömmen är avsiktligt inte valbar |
| S46 | `docs/byggplan.md` **+** `.github/workflows/ci.yml` | Full svit + docs | Rätt |

**Tre klasser av hotscenario jag inte kunde mäta, och det ska stå:**

- **Raderade och omdöpta filer.** `ci.yml`:s egen kommentar säger att raderade
  filer normalt inte når urvalslogiken, men lägger ändå in en kontroll mot
  disken *"eftersom beslutet ska vila på disken och inte på den antagna
  semantiken"* (`scripts/acceptance-urval.sh`). Formuleringen är en disciplin
  jag känner igen och litar på, men jag har inte mätt actionens beteende själv.
  **Osäker.**
- **Symlänkar och mycket stora diffar.** `tj-actions/changed-files` har
  dokumenterade gränser för hur många filnamn den kan lägga i en utdata. Blir
  listan avhuggen skulle `only_changed` kunna räknas på en delmängd. Jag har
  **inte** kunnat pröva det utan att skapa en PR, vilket kontraktet förbjuder.
  **Ej verifierbar** — fyll luckan med en riktad, kastbar test-PR med några
  hundra filer, körd av den som äger huvudkatalogen.
- **Merge-kön med flera poster.** Klassningen på kö-ytan diffar `base_sha` mot
  `head_sha` (belagt i `tasks/lessons/vol-05.md` genom läsning av actionens
  källa vid vår fastnaglade version), vilket täcker **unionen** av alla poster
  före och med den namngivna. Det är den säkra riktningen. Men jag har inte
  sett det mätt på en grupp med tre poster. **Starkt indikerad.**

### F6 — Finns en säker standard där osäkerhet betyder att fler tester körs?

**Ja, och den är byggd i fem oberoende lager.** Det här är
konstruktionens starkaste sida och förtjänar att sägas rakt ut.

| Lager | Var | Vad det gör vid osäkerhet |
|---|---|---|
| Tillåtelselistans form | `ci.yml:219–250` | Allt som inte uttryckligen står med hamnar i full klass |
| `only_changed`-semantiken | actionens källa, citerad `ci.yml:375–378` | Noll matchningar ⇒ falskt ⇒ full svit |
| Undantagslistan | `ci.yml:238–249` | Byggkonfig, manifest och låsfil kan **aldrig** bli lågrisk, ens i sällskap av dokumentation |
| Dedupen | `ci.yml:472–499` | Ingen andra förälder, träd-avvikelse, API-fel eller icke-grön körning ⇒ full svit |
| Acceptance-urvalet | `scripts/acceptance-urval.sh` | En enda post som inte är en spec-fil på disk ⇒ hela klassen |

Bekräftat empiriskt i tre av mina scenarier: en helt okänd katalog (S18), en fil
utan ändelse (S25) och en tom diff (S28) faller alla tre till full svit.
**Verifierad.**

Urvalets asymmetri är värd en mening extra, eftersom den är kärnan i varför
konstruktionen är försvarbar: skriptet kan orsaka att **för mycket** körs, aldrig
att för lite körs — utom via en spec-fil, och en spec-fil kan bara påverka sig
själv. Playwrights inbyggda `--only-changed` prövades och **förkastades**
empiriskt just för att den saknar den egenskapen: en ändrad källfil gav
`Total: 0 tests in 0 files`, alltså noll täckning utan att se avvikande ut.
Den mätningen står i skriptets eget huvud och är precis den typ av fråga J8.5
ställer — ställd och besvarad innan mekanismen byggdes.

### F7 — Kan en ändring i gemensam kod påverka mer än filtret förstår?

Svaret har tre delar.

**(a) I källkoden: nej, för filtret försöker aldrig.** Det finns ingen
testgraf. En ändring i `src/**` eller `supabase/functions/_shared/**` klassas
alltid som full svit (mätt: S05, S09, S21). `ADR-077` §1 lämnar den så kallade
D2-slotten öppen med avsikt och skriver ut att copy-ändringar i komponentfiler
*"klassas ärligt D3 tills en framtida testgrafs-design"*. Ärligheten är
poängen: en klass som inte kan detekteras säkert har inte mintats.

**(b) I dokumentationsytan: ja, och det är den enda platsen.** D0-listan
innehåller filer som **inte** bara är prosa:

- `docs/mallar/bilagor/*.html` och `*.css` är **källan** till de PDF-mallar
  produkten skickar till kunder. En ändring där klassas som dokumentation.
- `docs/backfill/**/*.mjs` och `docs/reference/**/*.js` är körbar kod.
- `docs/mallar/bilagor/fixtures/*.json` är indata till mall-renderingen.
- `tasks/**/facit.json` är de låsta referensbilder som styr visuella tester.

Jag prövade om de faktiskt är ogrindade, och svaret är **nästan alltid nej —
men sällan av det skäl som står skrivet**:

| Fil | Vad prosan säger grindar den | Vad som faktiskt grindar den | Utfall |
|---|---|---|---|
| `docs/mallar/bilagor/kvitto.html` | `biome check .` i `lint` | **Inte Biome** — `biome.json` utesluter `docs/mallar/bilagor/*.html` explicit. `scripts/check-mallparitet.sh` i `lint` fäller i stället | Säker |
| `docs/mallar/bilagor/kvitto.css` | `biome check .` | Biome **och** mallparitet | Säker |
| `docs/design/farg-atlas.tokens.json` | `biome check .` | Biome, bekräftat | Säker |
| `tasks/**/facit.json` | — | `ADR-102`-grinden i `lint` | Säker |
| `docs/**/*.sh` | `biome check .` | **Ingenting** — `shellcheck`-steget listar `scripts/*.sh`, `scripts/lib/`-filer och `.githooks/*`, inte `docs/` | **Ogrindad** |

Mätningarna, alla 2026-09-17: `npx @biomejs/biome check
docs/mallar/bilagor/kvitto.html` svarar *"These paths were provided but
ignored"*; samma kommando mot `docs/design/farg-atlas.tokens.json` svarar
*"Checked 1 file"*; `bash scripts/check-mallparitet.sh` svarar *"Mallparitet
OK — 17 genererade moduler matchar källan"* med felkod 0.

Slutsatsen är nyanserad och bör läsas noga: **utfallet är säkert, motiveringen
är föråldrad.** Undantaget för `docs/**` i `.listparitet-policy.conf` motiveras
med att *"den ytan grindas av biome check . i det alltid-på lint-jobbet"* — och
den meningen är falsifierad för två delmängder (`*.html` under mallkatalogen,
och alla `.sh`). Det spelar ingen roll för mallfilerna, som fångas av en annan
grind. Det spelar roll för `.sh`-filen, som inte fångas alls. Och det spelar
roll principiellt: en motivering som inte längre stämmer är inte längre ett
skäl, och nästa läsare som lutar sig mot den lutar sig mot luft. Det är
`ADR-083`-felklassen, i miniatyr. **Verifierad.**

**(c) Ett fynd om dedupen som pekar mot förenkling.** Uppdragets hypotes 5
gäller merge-dedupen, och den visade sig vara i praktiken **utan verkan** —
samtidigt som den bär full komplexitet.

Dedupen jämför det landade trädet med **PR-huvudets** träd. Det var rätt före
merge-kön, när `main`-pushen var första gången det sammanslagna trädet sågs.
Sedan kön aktiverades 2026-07-29 gäller två saker som ingen konsumerat:

1. **`main` rör sig under nästan varje PR**, så trädjämförelsen faller. Mätt
   lokalt ur git-historiken över 1 887 merge-commits sedan 2026-07-29:
   **568 (30 %)** har identiska träd, **1 319 (70 %)** har det inte. Bekräftat i
   en verklig körning: `34243465042` loggar *"Dedup-miss: träd-avvikelse
   (9ef2bae11cf5 != bf68ec9a430d) → full svit (fail-closed)"*.
2. **En bättre signal finns redan och används inte.** Varje kö-landning ger
   **två** `ci.yml`-körningar på **exakt samma commit** — en på kö-ytan och en
   på `main`-pushen. Mätt: 19 av 19 landningar i mitt fönster är sådana par. Det
   betyder att `main`-pushen kan fråga *"har den här commiten redan en grön
   körning?"* i stället för den svagare frågan om PR-huvudet.

Följden är mätbart dubbelarbete. Commiten `01c33c145` körde hela testsviten
**två gånger** — kö-körning `34241987340` och push-körning `34243465042`, samma
SHA, båda gröna, ingen ny information i den andra.

Att `ADR-077` §2 uttryckligen motiverar dedupens sundhet med *"merge-grindens
strict up-to-date-krav (ADR-076)"* gör bilden skarpare: **det kravet finns inte
längre.** `strict_required_status_checks_policy` är `false` sedan 2026-08-05
(mätt i rulesetet i dag; beslutet står i `ADR-076` § Amendering). Amenderingen
konsumerade `ADR-076`:s egen konsekvens-rad men aldrig `ADR-077` §2:s
sundhetspremiss — exakt den halvkonsumtion `L322`:s följdregel varnar för.

**Ärligt om vad det betyder:** mekanismen är *inte* osäker. Trädjämförelsen är
självbärande och behöver inte `strict`. Men den skrivna motiveringen vilar på en
premiss som föll för sex veckor sedan, och mekanismen levererar 30 % av en
besparing som en enklare fråga hade gett nästan helt. **Verifierad.**

### F8 — De empiriska körningarna

**Först: kopian validerad mot verkligheten.** Fem PR:ers fillistor genom min
lokala kopia, jämförda med vad CI faktiskt gjorde:

| PR | Filer | Kopians svar | CI:s faktiska utfall | Körning |
|---|---|---|---|---|
| `#2470` | 19 | hoppa svit | `Test suite` **skipped** | `34248619879` |
| `#2473` | 7 | hoppa svit | `Test suite` **skipped** | `34263272774` |
| `#2472` | 1 | hoppa svit | `Test suite` **skipped** | `34260972054` |
| `#2469` | 6 | kör svit | Fem inre jobb körda | `34249685743` |
| `#2467` | 10 | kör svit | Fem inre jobb körda | `34248030069` |

Fem av fem. Kopian är trovärdig för de fall jag använt den till.

**Sedan: fem klasser av verkliga körningar.**

| Klass | Körningar | Vad som hände | Paraply |
|---|---|---|---|
| **D0** (dokumentation, PR-ytan) | `34248619879`, `34263272774`, `34260519935` | `Test suite` **skipped**, `Review-backstopp` **skipped**, `Docs link check` **success** | grön |
| **Full** (PR-ytan) | `34249685743`, `34248030069`, `34247598715` | Fem inre jobb körda; staging och a11y **skipped** by design | grön / röd vid rött inre jobb |
| **merge_group** | `34263297748` (D0), `34241987340` (full) | D0: svit och backstopp **skipped**. Full: backstopp **success**, svit körd | grön |
| **push till main** | `34263695294` (D0), `34243465042` (full) | Samma klassning som PR-ytan; dedup **miss** på den fulla | grön |
| **Dedup-träff** | **Ingen observerad** | Alla lästa push-körningar loggar `Dedup-miss` eller `should_skip_tests` | — |

Den sista raden är ett fynd i sig: jag hittade **noll** dedup-träffar i
fönstret. Att bevisa frånvaro kräver mer data än jag har, men tillsammans med
70 %-mätningen i F7 pekar två oberoende spår åt samma håll. **Starkt indikerad.**

**Och en observation som färgar allt annat:** samtliga `ci.yml`-körningar sedan
2026-09-14 är röda, och de faller på jobbet `Audit dependencies (audit-ci)`
(mätt i `35207417255`, 2026-09-17). Grinden gör alltså exakt vad den ska —
paraplyet är rött, ingenting kan landa — men repot står stilla. `main` har inte
rört sig sedan 2026-09-08.

### F9 — Vad bevis-workflowsen bevisar, och vad de inte täcker

| Workflow | Bevisar | Bevisar **inte** | Senast körd |
|---|---|---|---|
| `gate-proof.yml` | Att mönstret `if: always()` + fail-closed-jq blir **failure** på ett rött `needs`-jobb, och att en negativ självtest-körning blir röd | Att **det riktiga** `ci-passed` gör det. Jobbet `umbrella-replica` är en **replik** med sin egen `needs`-lista (`gate-proof.yml:74`) | **2026-09-04**, körning `33875903794`, grön |
| `review-backstopp-proof.yml` | Att `scripts/review-backstopp.mjs` fäller en PR-kropp utan granskningsutlåtande och släpper en med — offline, mot fixturer ur en verklig PR | Att CI-**jobbet** är wirat rätt, att dess `if:` är korrekt, eller att det någonsin fällt skarpt i kön | **2026-08-28**, körningarna `33145964415` (grön) och `33145969468` (negativ kontroll, röd) |

Två luckor, i fallande allvar.

**Lucka 1 — gate-proof prövar en kopia, inte originalet.** jq-uttrycket är
byte-identiskt och det står utskrivet att det ska speglas. Men om någon tar bort
ett jobb ur `ci-passed`:s `needs`-lista — den ändring som faktiskt skulle göra
grinden blind — förblir `gate-proof.yml` grön. Repliken har sin egen
`needs: [forced-red]`. Det är en medveten trohets-kompromiss (GitHub kan inte
visa ett rött jobb i en grön körning) och den är öppet skriven, men den bör
läsas för vad den är: ett bevis om ett **mönster**, inte om **instansen**.

**Lucka 2 — gate-proof körs inte längre efter varje `ci.yml`-ändring.**
`ADR-077` §4 och `ci.yml:2536` säger båda att den ska köras efter varje ändring
i filen (`T85`). Sista körningen var 2026-09-04. `ci.yml` har ändrats **två
gånger** därefter: `d8e2fddd` och `7ab494c4`, båda 2026-09-07 (`TASK-419`).
Regeln är alltså ett arbetssätt, inte en spärr, och den efterlevdes inte senast
den prövades. **Verifierad.**

**Och en öppen skuld som `CLAUDE.md` själv bokför:** backstoppens **första
skarpa fällning på kö-ytan** har aldrig inträffat. Samtliga 19 kö-körningar i
mitt fönster är gröna. Grinden har alltså aldrig, i verkligheten, stoppat något.
Det gör den inte fel — men det gör den obevisad där det räknas.

### F10 — Historiken: vilka hål har hittats, och av vem

| När | Hål | Hur det hittades | Status |
|---|---|---|---|
| 2026-07-23 (S77) | Paraply-checken hoppades vid rött `needs` och GitHub räknade hoppat som uppfyllt — PR `#101` auto-mergades röd | **Incident.** Backstoppen fångade det inom minuter (`main`-rött `30024005788`) | Stängt (`L322`), vaktat av `gate-proof.yml` |
| 2026-07-23 | Halvkonsumerad utelämning: `ADR-029` utelämning #5 bar två saker, bara den ena stängdes | **Efterhandsanalys** av samma incident | Stängt som följdregel i `L322` |
| S69 (`TASK-15`) | `quotepath` saknades — filnamn med å/ä/ö klassades fel; dokumentations-jobbet tyst hoppat på en äkta dokumentationsändring | **Kontrastbevis-körningar** (`29657524469` mot `29657760975`) | Lagat, men **ingen grind vaktar fixen** |
| S91 | `.vale.ini`, `.vale/**`, `.markdownlint-cli2.jsonc` saknades i dokumentations-listan medan de stod i D0 ⇒ både svit och docs hoppade | **Manuell granskning** under `TASK-71` | Stängt; paritetsgrind byggd (`TASK-85`) |
| S91 | `tests/vale-regression/**` stod i D0 men inte i dokumentations-listan — ett befintligt hål som ingen sett | **Samma granskning** | Stängt |
| 2026-07-30 (`TASK-78`) | Post-merge-lagret klassade om från grunden och körde full staging på rena dokumentations-landningar | **Mätning** av en verklig revert som blockerades 25 min | Stängt — klassningen ärvs nu |
| 2026-09-02 (`TASK-365`) | Post-merge-körningen för en kod-landning avbryts av nästa push, som själv hoppar sviten ⇒ kod-landningen får **aldrig** någon efterkontroll | **Manuell forensik** (S113 resume 8) | **ÖPPET** |

Mönstret är entydigt och bör sägas rakt ut: **en enda av de sju hittades av en
maskin.** Två hittades av en incident, fyra av manuell granskning eller
mätning. Det speglar exakt den fångst-fördelning `CLAUDE.md` § Roll-arkitektur
redan bokför — extern fångst dominerar, självgranskning är svag — och det är
argumentet för att fortsätta göra sådana här genomlysningar, inte för att bygga
fler automatiska vakter.

### F11 — Rakt svar på fråga 3, för en läsare utan teknisk bakgrund

> *"Kan CI bli grönt trots att ett relevant test har hoppats över?"*

**Ja — men i två helt olika betydelser, och bara den ena är ett problem.**

**Betydelse 1: ja, med flit.** Systemet har en regel som säger ungefär: *"om
den här ändringen bara rör text och dokumentation, behöver vi inte köra
programmets tester."* Det är ett rimligt beslut. Att köra alla tester tar cirka
sju minuter och kostar datorkraft, och att rätta ett stavfel i en anteckning kan
omöjligt göra programmet trasigt. Regeln är skriven som en **lista över vad som
får hoppa** — inte en lista över vad som är förbjudet — vilket betyder att allt
nytt och okänt automatiskt hamnar i den försiktiga högen. Jag testade 46 olika
tänkbara ändringar mot regeln och den gjorde rätt i alla 46.

**Betydelse 2: nej, inte av misstag — såvitt jag kan mäta.** Jag letade
särskilt efter den farliga varianten: att ett test hoppas för att något gått
snett, och att systemet ändå säger grönt. Jag prövade fyra olika vägar in i det
felet och hittade ingen som fungerar. Grinden är byggd så att den räknar
misslyckanden och säger ifrån, i stället för att leta efter framgångar och tiga
när de uteblir. Skillnaden låter liten men är avgörande, och den är resultatet
av en verklig olycka 2026-07-23 då en trasig ändring slank igenom just på den
punkten.

**Hur allvarligt är det?** Låg risk i själva grinden. Det som hoppas är
dokumentation, och samtidigt fortsätter en stor mängd andra kontroller att köra
oavsett — cirka trettio stycken, inklusive typkontroll och alla de egna
kvalitetsvakterna.

**Hur sannolikt?** Att ett verkligt fel slipper igenom just den vägen: lågt.
Historiken har **en** sådan händelse på cirka fem månader, och den lagades.

**Men — och det här är det egentliga svaret på Marcus fråga.** Hela
konstruktionen vilar på ett löfte som står nedskrivet i beslutsdokumentet: det
är okej att hoppa tester före landning **så länge** samma tester körs efteråt,
varje natt, på det som faktiskt landat. Det löftet infrias inte just nu.
Nattkörningen har misslyckats **fyrtio nätter i rad**, från 2026-08-10 till
2026-09-17. Största delen av rödheten kommer från tre städkontroller som inte
har med testerna att göra — men just därför har färgen rött slutat betyda
något. Natten till 2026-09-17 gick ett verkligt test sönder i nattkörningen, och
det syntes inte, för allt var redan rött.

**Det är alltså inte att ett test hoppas som är faran.** Faran är att larmet
under det har ringt oavbrutet i fem veckor, så att ingen längre hör när det
ringer på riktigt.

## Osäkerheter och vad jag inte kunde belägga

| Fråga | Varför jag inte kunde stänga den | Vad som krävs |
|---|---|---|
| Actionens beteende vid raderade, omdöpta och symlänkade filer | Kräver en verklig PR; kontraktet förbjuder att skapa en | En kastbar test-PR med de tre fallen, körd av den som äger huvudkatalogen |
| Trunkeras fillistan vid mycket stora diffar? | Samma skäl. Gränsen är dokumenterad hos leverantören men inte mätt hos oss | Test-PR med flera hundra filer; läs `changed`-jobbets logg |
| Klassningen på en kö-grupp med tre poster | Ingen sådan grupp i mitt fönster | Läs `changed`-loggen på nästa kö-körning där `max_entries_to_merge` faktiskt bränner |
| Dedup-träffens faktiska beteende | Noll träffar observerade | Vänta på en träff, eller konstruera en genom att landa en PR direkt efter en fast-forward |
| Har backstoppen någonsin fällt skarpt i kön? | Alla 19 kö-körningar i fönstret gröna | Bredare sökning bakåt, eller acceptera skulden som `CLAUDE.md` redan bokför |
| Är nattens acceptance-fel äkta eller en flake? | En enda observation (2026-09-17) | `npm run metrics:flake`, eller läs nästa nattkörning |

**Och en metodgräns att läsa med:** min klassnings-kopia matchar med
`micromatch`, inte med actionen själv. Fem verkliga PR:er bekräftar den, men
fem är fem. Där jag lutar mig enbart på kopian står det utskrivet.

## Risker, rangordnade

| # | Risk | Allvar | Sannolikhet | Evidens |
|---|---|---|---|---|
| **R1** | **Nattnätet — som ensamt gör det försvarbart att hoppa tester före landning — har varit rött 40 nätter i rad.** Rött bär ingen information längre, och en äkta regression (`Acceptance (hermetisk) (2)`, 2026-09-17) kom in i den tystnaden | **Hög** | **Inträffat** | `gh run list --workflow nightly.yml --limit 40`, samtliga `failure`; jobbutfall i `35187813487`, `35061163532`, `34442350224` |
| **R2** | **`TASK-365` är öppen:** en kod-landning som följs av en docs-landning inom ~15 min får **aldrig** någon efterkontroll — sviten avbryts och efterföljaren hoppar den | **Hög** | Återkommande i ett aktivt repo | Kortets egen beskrivning + rättelsenoten (larmkedjan är den primära luckan); `ADR-077` § Kontext gör nätet till ett villkor |
| **R3** | **`gate-proof.yml` prövar en replik, inte instansen — och kördes inte efter `ci.yml`:s två senaste ändringar** | Medel | Inträffat (regeln bröts 2026-09-07) | `gate-proof.yml:74`; sista körning `33875903794` 2026-09-04 mot `git log` på `ci.yml` |
| **R4** | **`quotepath: false` är ogrindad.** Tas raden bort ur ett av fyra steg återkommer `TASK-15`-felet tyst, och dess dokumentations-halva är fail-open | Medel | Låg men ej noll | Fyra rader, noll grindträffar (`grep`, 2026-09-17) |
| **R5** | **Motiveringar som inte längre stämmer.** Fyra mätta instanser (se nedan). Ingen ger ett akut hål, men var och en är ett skäl nästa läsare kan luta sig mot utan att det bär | Medel | Inträffat ×4 | Se tabellen nedan |
| **R6** | **Dedupen bär full komplexitet för ~30 % av en besparing** som en enklare fråga hade gett nästan helt, och dubbelkör sviten på varje kö-landning där `main` rört sig | Låg (kostnad, ej säkerhet) | 70 % av landningarna | 568/1 887 trädlika; `01c33c145` körd två gånger |
| **R7** | **Grinden definieras av koden som granskas.** En PR kan ändra `ci.yml` — inklusive paraplyets `needs`-lista — och landa med noll godkännanden och `CODEOWNERS` som rådgivande | Låg i dag (två användare), strukturell | Ej inträffad | Ruleset: `required_approving_review_count: 0`, `require_code_owner_review: false` |
| **R8** | **`docs/**/*.sh` når ingen grind alls** — varken testsvit, dokumentationsgrind eller `shellcheck` | Låg (en malltext-fil) | Inträffar vid varje ändring | Scenario S31; `shellcheck`-stegets lista `ci.yml:1939–1960` |

**De fyra motiveringarna som inte längre stämmer (R5), med båda källorna:**

| # | Vad prosan påstår | Vad implementationen gör |
|---|---|---|
| 1 | `ci.yml:162–163`: *"ingen grind håller dem synkade — paret hålls för hand"* om D0- och docs-listorna | `scripts/check-listparitet.sh` **vaktar paret** (`klassning-docs-config`). Körd 2026-09-17: felkod 0, *"6 par prövade, samtliga i synk"*. Samma fil motsäger sig själv på rad 216–218 |
| 2 | `.listparitet-policy.conf`, undantaget för `docs/**`: *"den ytan grindas av biome check . i det alltid-på lint-jobbet"* | `biome.json:16` utesluter `docs/mallar/bilagor/*.html` explicit; Biome lintar inte `.sh` alls |
| 3 | `ADR-077` §2: dedupen är *"sund TACK VARE merge-grindens strict up-to-date-krav (ADR-076)"* | `strict_required_status_checks_policy` är `false` sedan 2026-08-05. Mekanismen är fortfarande säker, men inte av det skälet |
| 4 | `.ci-parity-policy.json`, `diffClassification._rationale`: *"klassningen kan bara köra MER än CI … aldrig MINDRE"* | `CLAUDE.md` har **redan rivit** exakt den formuleringen som *"ett löfte ingen implementation kan hålla"* — men bara i sin egen kopia. Originalet står kvar |

Instans 1 och 4 är särskilt värda uppmärksamhet: i båda fallen har repot redan
gjort rätt analys på ett ställe och glömt att konsumera den på det andra. Det är
`L322`:s följdregel — *"när en medveten utelämning stängs, konsumera HELA dess
text"* — som fallerar på sitt eget tillämpningsområde.

## Rekommendationer

Märkta som **rekommendation**, aldrig som beslut. Jag har hållit dem
proportionerliga: det här är en produkt med två slutanvändare, och två av de
sex förslagen river snarare än bygger.

**R1 — Laga nattnätet innan något annat i CI rörs.** *(Rekommendation, hög
prioritet.)* Så länge natten är röd är hela den riskanpassade presubmiten
obevisad, eftersom `ADR-077` § Kontext gör nätet till dess uttryckliga villkor.
Konkret: skilj de tre process-grindarna (`Backlog-stängning`,
`Sessionsdok-fönstret`, `Sannings-avstämning`) från testsviten, så att en röd
städkontroll inte färgar hela natten. Antingen som separat workflow, eller som
två distinkta larm. Målet är att *"natten är röd"* åter ska betyda *"något är
sönder i produkten"*.

**R2 — Stäng `TASK-365`.** *(Rekommendation, hög prioritet.)* Kortet finns,
är plockbart och har fyra formulerade acceptanskriterier. Den delen av dess
rättelsenot som pekar ut **larmkedjan** som primär lucka stämmer med vad jag
mätte: larm-jobbet blir grönt, ingen läser det. Att låta `heartbeat-svep.sh`
rapportera senaste nattkörningens rött som en RÖTT-rad är det billigaste steget
och betalar även R1 delvis.

**R3 — Riv merge-dedupen, eller byt fråga.** *(Rekommendation.)* Två vägar,
båda giltiga:

- **Riv den.** 40 rader skal, ett `actions: read`-grant och en egen felklass för
  30 % träffbarhet på en körning som ändå är en dubblett av kö-körningen.
- **Byt fråga.** Låt `main`-pushen fråga *"har denna exakta commit redan en
  grön `ci.yml`-körning?"* i stället för att jämföra träd med PR-huvudet. Det är
  en strikt starkare fråga (SHA-identitet i stället för träd-identitet), den
  hade träffat på 19 av 19 landningar i mitt fönster, och den är samma mekanik
  `scripts/classify-post-merge.sh` redan använder i sin VÄG A.

Väljs någondera: uppdatera `ADR-077` §2 i samma andetag, eftersom dess
sundhetspremiss redan fallit.

**R4 — Vakta `quotepath: false`.** *(Rekommendation, liten.)* Ett par rader i
en befintlig grind som kräver att alla fyra `tj-actions/changed-files`-steg bär
inställningen. Motivet är inte teoretiskt: felet har inträffat, kostade en
felsökningsrunda, och dess dokumentations-halva är den enda fail-open-riktning
jag hittat i hela klassningen.

**R5 — Rätta de fyra motiveringarna.** *(Rekommendation, liten.)* Ren
textändring, D0-klassad, ingen risk. Särskilt instans 1: `ci.yml` motsäger sig
själv inom femtio rader, och den felaktiga halvan är den som läses först.

**R6 — Lyft `gate-proof`-repliken en nivå, eller skriv ut dess gräns
tydligare.** *(Rekommendation, låg prioritet — och jag lutar åt det senare.)*
Att bevisa instansen i stället för mönstret kräver att man gör en delad
kö-körning avsiktligt röd, vilket `CONTRIBUTING.md` § Rött-först förbjuder med
goda skäl. Alternativet är billigare och nästan lika bra: en statisk kontroll i
`lint` som verifierar att `ci-passed`:s `needs`-lista innehåller **varje**
jobb i `ci.yml` utom sig självt. Det fångar precis den regression repliken inte
kan se, kostar några rader, och kräver ingen avsiktligt röd körning.

**Vad jag uttryckligen INTE rekommenderar.** Att bygga en testgraf för att
kunna klassa `src/**`-ändringar smalare. `ADR-077` §1 lämnar den slotten öppen
med skäl, Playwrights inbyggda variant är mätt och förkastad, och den nuvarande
ordningen — *"all källkod ⇒ full svit"* — är den säkra defaulten. En testgraf
hade infört exakt den felklass J8.5 utreder, i utbyte mot minuter.

## Källor

**Repo-filer** (sökvägar relativt repo-roten):

- `.github/workflows/ci.yml` — särskilt `5–45` (utlösare, concurrency),
  `50–499` (`changed`-jobbet), `219–250` (D0), `297–308` (docs-listan),
  `324–340` (D1), `391–405` (acceptance-klassen), `447–450` (urvalet),
  `452–499` (dedupen), `503–2096` (`lint`), `1939–1960` (shellcheck-scope),
  `2097–2155` (`audit`), `2156–2274` (`suite`), `2278–2482` (`docs`),
  `2483–2520` (`review-backstopp`), `2522–2566` (paraplyet)
- `.github/workflows/ci-suite.yml` — `34–80` (inputs), `89–96` (`purge`),
  `153–155` (`test-fast`), `231–233` + `372` (acceptance + shard-matris),
  `516–517` (självtestet), `625–627` (`webblasarbeteende`), `705–708` (`a11y`),
  `755–762` (`test-staging`), `935–939` (`purge-efter`), `954–962`
  (det enda `continue-on-error`)
- `.github/workflows/gate-proof.yml` — hela filen, särskilt `49–101`
- `.github/workflows/review-backstopp-proof.yml` — `1–66`
- `.github/workflows/post-merge.yml` — `141–144`, `202–248`, `376–379`
- `scripts/acceptance-urval.sh` — hela filhuvudet plus klassningsloopen
- `scripts/classify-post-merge.sh` — `1–150` (VÄG A/VÄG B, event-filtret)
- `scripts/verify-ci-parity.mjs` — `267–322` (`parseraD0Glob`, `klassificeraDiff`)
- `.listparitet-policy.conf` — `140–146` (paren), `205–224` (undantagen)
- `.ci-parity-policy.json` — `diffClassification`, `suiteInputInvariants`
- `biome.json` — `files.includes`
- `.github/CODEOWNERS`
- `docs/decisions/ADR-029-ci-architektur-changed-files-pattern.md`
- `docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md` — § Amendering 2026-08-05
- `docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md` — §§ 1–4
- `docs/decisions/ADR-083-prosa-som-pastar-mekanism.md`
- `docs/decisions/ADR-105-review-grinden-fyra-deltan-byggs-inte-adopteras.md`
- `tasks/lessons/vol-04.md` — `L321`, `L322`, `L323`
- `tasks/lessons/vol-05.md` — `L395`, `L407`, `L408`, `L415`
- `backlog/tasks/task-365 - Post-merge-verifieringen-…md`
- `CLAUDE.md` — §§ Landning, Review-grinden, Bygg/testa/linta

**Kommandon jag körde** (samtliga 2026-09-17, samtliga läsande):

- `gh api repos/high-five-group/miranon-media-admin/rulesets` och `…/19627609`
- `gh run list --workflow ci.yml --limit 80 --json …`
- `gh run view <id> --json jobs,event,conclusion,headSha` för `34263695294`,
  `34263297748`, `34263272774`, `34248619879`, `34249685743`, `34247598715`,
  `34247226761`, `34241987340`, `34243465042`, `34249531833`, `34241449999`,
  `34253969496`, `35207417255`
- `gh run view 34243465042 --log --job 102119299941` (dedup-loggen)
- `gh run list --workflow nightly.yml --limit 40`, samt `gh run view` på
  `35187813487`, `35061163532`, `34442350224`, `34191955829`
- `gh run list --workflow gate-proof.yml|review-backstopp-proof.yml|post-merge.yml --limit 6..12`
- `gh pr view 2467|2469|2470|2472|2473 --json number,files,title`
- `git log --format="%H %T %cI %P" --since=2026-07-29 origin/main` + `awk`
  (dedupensträffbarhet)
- `bash scripts/check-listparitet.sh` (felkod 0)
- `bash scripts/check-mallparitet.sh` (felkod 0)
- `npx @biomejs/biome check docs/mallar/bilagor/kvitto.html` (ignorerad)
- `npx @biomejs/biome check docs/design/farg-atlas.tokens.json` (kontrollerad)
- `node` + `micromatch` 4.0.8 mot mönster hämtade verbatim ur `ci.yml`
  (46 scenarier + 5 verkliga PR-fillistor)

**Webbkällor:**

- <https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax>
  — `jobs.<job_id>.needs`: *"If a job fails or is skipped, all jobs that need it
  are skipped unless the jobs use a conditional expression that causes the job
  to continue."*
- <https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks>
  — *"Successful check statuses are `success`, `skipped`, and `neutral`"*, samt
  skillnaden mot filter-skip där checken stannar i `Pending` och blockerar.
- <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue>
  — merge-köns garanti, citerad i `ADR-076` § Amendering.
