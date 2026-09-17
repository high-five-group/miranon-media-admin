---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Leverabel 4 av 12 — Ändringslogg för CI- och grindvaktsarkitekturen

> **Proveniens:** skrivet av en `research-pass`-agent (modell: se
> slutrapport till orkestreraren) för Session 126, 2026-09-17, som Jobb 1
> (delfråga "Ändringslogg") i den gemensamma CI-djupgranskningen. Metod och
> evidenskrav bärs av `underlag/00-agentkontrakt.md` i samma katalog.
> Ögonblicksbild: `origin/main` på `eeca8c72d8244fcd59ae5d99e0052410dac67bb`
> (2026-09-08, oförändrad sedan dess — Marcus var bortrest en vecka).
> Arbetsgren: `docs/s126-ci-djupgranskning`, HEAD
> `18c8f22e87d9e06fb2a465c3d40883148bbc0c0c`.

"CI" (Continuous Integration, kontinuerlig integration) betyder här hela
maskineriet som automatiskt kontrollerar en kodändring innan den får bli en
del av produkten: GitHub Actions-arbetsflöden (`.github/workflows/`),
skript som stoppar eller varnar (`scripts/`, kallade "grindvakter" i detta
repo), hookar som körs lokalt innan en agent får utföra en handling
(`.claude/settings.json`, `.githooks/`), och konfigurationsfiler som styr
vad de kontrollerar (`*.conf`/`*policy*`-filer, `playwright.config.ts`
med flera).

## Kort svar

Arkitekturen har vuxit i minst tre distinkta faser sedan grunden lades i
maj 2026 (ADR-029), och den **stabiliserar sig inte** i betydelsen "blir
alltmer orörd" — men mönstret för VARFÖR den ändras har flyttat sig. I
maj–juli var nästan varje ändring en ny mekanism (changed-files-klassning,
merge-grind, riskklassning). Sedan slutet av juli är en påtaglig och
återkommande andel i stället **korrigeringar av tidigare CI-ändringar**:
samma yta (post-merge-klassningens ärvning, worktree-hookens
`core.hooksPath`-bugg, acceptance-testens tidsbudget, "facit"-gaten,
backlog-stängningsgrinden) har blivit fixad om och om igen under en och
samma sjuveckorsperiod, i vissa fall tre–fyra gånger. Samtidigt landade
2026-09-04 ett beslut (ADR-131, Accepted men **ännu inte verkställt**) att
riva hela backlog-stängningsgrinden och flytta arbetsspåret till GitHub
Issues — vilket antyder att en del av dagens komplexitet redan är dömd,
inte bara växande. Ungefär **en av fem landningar på `main`** (506 av
2 251, 22,5 procent) rörde CI-ytan under de sju veckor jag undersökt i
detalj (2026-07-20 → 2026-09-08), en andel som legat stabilt mellan cirka
15 och 30 procent varje vecka utan tydlig upp- eller nedåtgående trend.
(Rättat efter orkestrerarens stickprov S27: 2 251 räknar landningar på
`main`s förstaförälderkedja, inte antalet PR:er — omkring 130 av dem är
direktcommits från tiden före PR-flödet, `ADR-076`. Kvoten 22,5 % rörs inte
av distinktionen. Det separata PR-antalet är omkring 2 200, varav omkring
2 100 landade.) **Dom:**
arkitekturen är omfattande, i stort fungerande och tydligt dokumenterad
(varje ändring bär sitt "varför" i commit-meddelande, ADR eller
sessionsdok) — men den bär flera svåra, upprepade felklasser som ännu
inte har en varaktig lösning, och den håller på att delvis ersätta sig
själv (ADR-131) snarare än att lugna ner sig.

Den avgörande delfrågan för denna dom var **"leta aktivt efter
korrigeringar av tidigare CI-ändringar"** — den identifierade fyra
distinkta, flera-gångers-upprepade felklasser (se § Korrigeringskedjor)
som annars är lätta att missa om man bara läser varje PR för sig.

## Vad jag läste först

`docs/research/`-katalogen (135+ filer) innehåller inget pass med samma
frågeställning (en tids- och orsakskedja för CI-arkitekturens ändringar).
Fyra filer överlappar delvis och jag har byggt vidare på dem i stället för
att skriva om dem:

- [`verify-ci-parity-regel-vantetid-2026-08-05.md`](../verify-ci-parity-regel-vantetid-2026-08-05.md)
  — mätserien bakom `verify:ci-parity`-reglerna som redan citeras i
  `CLAUDE.md`. Jag har inte upprepat den mätningen, bara placerat
  byggkommandot (PR #752, #762) i tidslinjen.
- [`t121-skribenten-claude-code-worktree-hookspath-2026-08-04.md`](../t121-skribenten-claude-code-worktree-hookspath-2026-08-04.md)
  — rotorsaksforskningen bakom `core.hooksPath`-buggen. Jag har placerat
  de TVÅ fix-försöken (PR #718, #723) samma dag i tidslinjen; researchen
  själv är oförändrad och fortfarande giltig (buggen är en känd,
  öppen `claude-code`-issue, inte något som går att laga hos oss).
- [`heartbeat-svep-trigger-agarskap-optionsrymd-2026-08-04.md`](../heartbeat-svep-trigger-agarskap-optionsrymd-2026-08-04.md)
  och [`obevakade-tillstand-vaktens-form-2026-07-30.md`](../obevakade-tillstand-vaktens-form-2026-07-30.md)
  — designresonemanget bakom heartbeat-svepet. Jag har bara daterat
  byggkommandot (PR #614, TASK-119) och den senare grenstädnings-
  utvidgningen (PR #2042, TASK-323).

Ingen av dessa fyra är äldre än sex veckor på ett sätt som gör dem
inaktuella — CI-arkitekturens ändringstakt är hög, men de underliggande
designresonemangen i dessa pass har inte falsifierats av något jag hittat.

**Beslut jag läste i sin helhet innan jag skrev något:** ADR-029, ADR-036,
ADR-076, ADR-077, ADR-080, ADR-083, ADR-094, ADR-096, ADR-097, ADR-100,
ADR-105 (alla explicit nämnda i uppdraget) samt ADR-131 (funnen under
arbetet — se § Fynd 1 nedan). Jag har INTE hittat något beslut som redan
avgjort frågan "har arkitekturen stabiliserat sig" — det är precis den
frågan uppdraget ställer mig, och ADR-131 visar att svaret fortfarande är
under aktiv omprövning på Marcus/orkestrerar-nivå.

## Metod

Jag har arbetat uteslutande lokalt mot den fullständiga git-historiken
(`git log`/`git diff` mot `origin/main`, ingen skrivning, inget
`gh`-anrop som ändrar något). Fem `gh pr view`-anrop (skrivskyddade,
JSON-fält) mot de fem öppna PR:erna uppdraget pekade ut.

**CI-ytans definition** (samma som uppdragets, med tre preciseringar jag
gjort explicita eftersom de annars ger falska träffar):

| Sökväg/mönster | Ingår helt? |
|---|---|
| `.github/`, `scripts/`, `.githooks/`, `.claude/settings.json`, `.claude/agents/` | Ja, allt |
| Rotens `*policy*`- och `*.conf`-filer (39 filer, se nedan) | Ja, allt |
| `playwright.config.ts`, `vite.config.ts`, `biome.json`, `tsconfig*.json`, `audit-ci.jsonc`, `.lycheeignore`, `.vale.ini`, `.markdownlint-cli2.jsonc` | Ja, allt |
| `tests/global-setup.ts`, `tests/global-teardown.ts`, `tests/support/` | Ja, allt |
| `package.json` | **Endast `scripts`-sektionen** — beroendeversion-bumpar (Dependabot) räknas separat, inte som arkitekturändring |
| `docs/decisions/*.md` | **Endast ADR:er vars sakinnehåll är CI/grindvakt/git-flöde** — repot minter en ADR för varenda betydande produktbeslut också, och de flesta ADR-filer denna sökväg matchar (kvitto, bilagor, segment, notiser, betalningar …) hör INTE till CI-ytan |
| `CLAUDE.md`, `CONTRIBUTING.md` | **Endast stycken som rör CI/grindvakt/git-flödet** — dessa filer täcker även Airtable-scheman, mall-förlagor och design-tokens |

Jag räknade **per landad PR** (GitHubs merge-commit på `main`s
förälder-1-kedja), inte per enskild commit inuti PR:en — en PR landar som
en enhet, och det är den enheten grindvakten faktiskt bedömer. För varje
sådan PR jämförde jag hela diffen mot dess förälder (`git diff
<merge>^1 <merge>`) mot mönstertabellen ovan. Facit-, ADR- och
CLAUDE.md-träffar granskade jag därefter styckevis (hunk-rubriker,
diff-innehåll) för att sortera bort de som inte handlar om CI — se
resultatet nedan.

**Vad detta INTE fångar:** en ändring som redigerar en logikfil (t.ex.
`src/pages/Events.tsx`) men som orsakas AV en CI-regel (t.ex. en ny
lint-regel som tvingar en refaktor) syns inte i denna sökning. Jag har
inte letat efter sådana indirekta effekter.

## Del 1 — Full detalj: 2026-08-20 → 2026-09-08

(Uppdraget säger "→ i dag", men `main` har inte rört sig sedan 2026-09-08
— se ögonblicksbilden i proveniensen. De öppna PR:erna från och med
09-09 redovisas separat i § Öppna PR:er.)

**I siffror:** 687 PR:er landade totalt på `main` i detta fönster. 149 av
dem (21,7 procent) matchade CI-ytan enligt tabellen ovan. Av de 149 har
jag granskat filträffarna styckevis; se § Rutinmässiga registreringar för
vad som föll bort och varför.

### Tema 1.1 — Airtable-produktionsbasen låses mekaniskt för agenter

| Datum | PR | Filer | Vad | Varför | Effekt |
|---|---|---|---|---|---|
| 2026-09-07 | [#2442](https://github.com/high-five-group/miranon-media-admin/pull/2442) (`TASK-419`) | `.claude/settings.json`, `.github/workflows/ci.yml`, `.prod-airtable-policy.conf`, `.staging-preflight-wiring-policy.json`, `scripts/deny-prod-airtable.sh`, `scripts/test-deny-prod-airtable.sh` | Ny PreToolUse-hook nekar varje `mcp__airtable__*`-anrop (PAT-servern) mot prod-basen `app8uGPrVCVOm6LfD`, oavsett anropare, och varje `mcp__claude_ai_Airtable__*`-anrop mot prod från en subagent | Fynd-kort TASK-419: "två agenter läste `app8uGPrVCVOm6LfD` i S123" — en läsning mot prod utan spärr | Ny säkerhetsgrind. Marcus beslut ("419 A"): huvudsessionen (Marcus + orkestreraren i samma chatt) släpps ändå igenom mot prod via claude.ai-connectorn — inte en lucka utan ett medvetet undantag |
| 2026-09-07 | [#2450](https://github.com/high-five-group/miranon-media-admin/pull/2450) (`docs/s123-stangning-3`) | `CLAUDE.md` | Dokumentationstillägg om spärren i § Verktygsfakta | Sessionsavslutets dokumentationsbatch | Ingen kodändring — förtydligar det redan byggda |

**Osäkerhet, markerad `ej verifierbar` av mig i detta pass:** CLAUDE.md
säger själv (rad 1110–1125 i nuvarande fil) att "Skarpbeviset genom
harnesset är ÖPPEN SKULD" — hooken registrerades samma dag och kan, per
den generella regeln om nyregistrerade hookar (se § Korrigeringskedjor,
punkt 1 nedan), inte förlitas på i den session som byggde den. Jag har
inte kört en skarp `mcp__airtable__`-provokation själv (jag saknar den
behörigheten i detta pass och det ligger utanför min delfråga).

### Tema 1.2 — Verktygsversion-pinning i hela CI-flottan (ett enda stort svep)

| Datum | PR | Filer | Vad | Varför |
|---|---|---|---|---|
| 2026-08-24 | [#1942](https://github.com/high-five-group/miranon-media-admin/pull/1942) (`TASK-312`) | 6 workflow-filer (`ci.yml`, `ci-suite.yml`, `nightly-watchdog.yml`, `nightly.yml`, `post-merge.yml`, `visual-baselines.yml`) + `.gh-version-policy.conf`, `.jq-version-policy.conf`, `.ci-parity-policy.json`, plus **cirka 30 skriptfiler** (`scripts/lib/gh-guard.sh`, `scripts/lib/jq-guard.sh` nya wrapper-bibliotek + hela den befintliga deny-hook-familjen omskriven att gå via dem) | Pinnar exakta versioner av `jq`, `yamllint`, GitHub Actions och `gh`-CLI:t över hela CI-flottan, via två nya "guard"-wrapper-skript som varje annat skript nu anropar i stället för verktyget direkt | Supply-chain-härdning — en oönskad verktygsuppdatering ska inte kunna ändra CI-beteende i tysthet |

Det här är den enskilt bredaste commiten i hela fönstret (30+ filer på en
gång) och en tydlig **infrastruktur-för-sin-egen-skull**-investering:
den skyddar inte produkten direkt, den skyddar CI-maskineriets egen
förutsägbarhet.

### Tema 1.3 — Review-grinden byggs klart (T173.1–T173.6)

Redan utförligt dokumenterad i `CLAUDE.md` § "Review-grinden — spawn efter
push, före armering" (rad 619–882 i nuvarande fil), som jag betraktar som
primärkälla för MEKANIKEN. Vad jag lägger till här är BARA tidslinjen —
när varje skiva landade:

| Datum | PR | Skiva | Vad |
|---|---|---|---|
| 2026-08-24 | [#1927](https://github.com/high-five-group/miranon-media-admin/pull/1927) | T173.1 | Utlåtande-kontraktet (schema för granskarens JSON-svar); `review-agent.md` skapas |
| 2026-08-26 | [#1980](https://github.com/high-five-group/miranon-media-admin/pull/1980) | T173.2 | Policy-ytan (`.review-policy.json`) injiceras vid spawn |
| 2026-08-26 | [#1993](https://github.com/high-five-group/miranon-media-admin/pull/1993) | T173.3 | Riskbedömnings-sektionen skrivs in i PR-kroppen, idempotent |
| 2026-08-26 | [#2007](https://github.com/high-five-group/miranon-media-admin/pull/2007) | T173.5 | Rundtaks-loopen (max 2 rundor, konvergensregel) |
| 2026-08-28 | [#2049](https://github.com/high-five-group/miranon-media-admin/pull/2049) | T173.4 | CI-backstoppen — mekanisk spärr på `merge_group`-ytan |
| 2026-08-28 | [#2052](https://github.com/high-five-group/miranon-media-admin/pull/2052) | T173.6 | Instrumenteringsloggen (bokföring, fäller inget) |

Fem dagar från kontrakt till mekanisk spärr — en av de snabbast
byggda substantiella grindarna i hela materialet. **Ett skarpt fynd som
inte stod i uppdraget:** samma dag T173.1 landade upptäcktes att den nya
agenttypen `review-agent` inte kändes igen av `Agent`-verktyget i SAMMA
session som skapade den (samma mekanism som hookar, se
§ Korrigeringskedjor 1, nu generaliserad till agentdefinitioner) —
`CLAUDE.md` rad 941–955 dokumenterar detta som skarpbevisat löst
2026-08-26.

### Tema 1.4 — Ännu en instans av "ärvd klassning" — post-merge pekade ut fel landning

| Datum | PR | Filer | Vad | Varför |
|---|---|---|---|---|
| 2026-08-28 | [#2059](https://github.com/high-five-group/miranon-media-admin/pull/2059) (`TASK-334`) | `.github/workflows/ci.yml`, `.github/workflows/post-merge.yml`, `CONTRIBUTING.md`, `docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md`, nya `scripts/post-merge-attribution.sh` (286 rader) + testsvit (445 rader) | Ny attribueringslogik så post-merge-larmet pekar på RÄTT landning | Fynd (`backlog/tasks/task-334`): `post-merge.yml` ärver PR-grindens D0-klassning av SIN EGEN diff och räknar aldrig om mot trädets faktiska hälsa. Konsekvens: efter att PR #2025 (icke-docs-only) fångat en verklig `Staging`-fällning, ärvde VARJE efterföljande docs-only-PR:s post-merge-körning "inget nytt att skydda" och körde aldrig om — den trasiga `get-document-sources.staging.test.ts` förblev **osynlig i tre dagar** (2026-08-27→08-28) trots att larmet redan hade fyrat en gång |

Detta är den tydligaste **regressionen** jag hittat i hela materialet: en
medveten designoptimering (ärvd klassning för att slippa köra om testsviter
i onödan) dolde en verklig, redan känd trasig testsvit. Se § Korrigerings-
kedjor 2 för hela kedjan — detta är den TREDJE separata fixen på samma
yta sedan 2026-07-28.

### Tema 1.5 — TASK-322: worktree-hookens självbevis kan inte litas på i egen session

| Datum | PR | Filer | Vad | Varför |
|---|---|---|---|---|
| 2026-08-28 | [#2044](https://github.com/high-five-group/miranon-media-admin/pull/2044) (`TASK-322`) | `.katalogagarskap-policy.conf`, `scripts/deny-frammande-huvudkatalog.sh`, `scripts/test-deny-frammande-huvudkatalog.sh` | Målstyrd klassning av katalogägarskaps-hooken (skiljer på LÄS mot huvudkatalog via `git -C`/`cd` och SKRIV) | Hooken körs via `CLAUDE_PROJECT_DIR`, som pekar på huvudkatalogen — en worktree-isolerad agent kör alltså huvudkatalogens GAMLA skriptkopia tills huvudkatalogen fast-forwardats, så en agent kan mekaniskt aldrig bevisa sin egen hook-fix skarpt |
| 2026-08-28 | [#2061](https://github.com/high-five-group/miranon-media-admin/pull/2061) (`docs/s112-stangning-batch-3`) | `CLAUDE.md` | Dokumenterar fyndet ovan i § "En ny hooks skarpbevis" | Direkt uppföljning samma dag |

Detta är en **generalisering** av en tidigare känd begränsning (hookar
registrerade mitt i sessionen laddas inte pålitligt om) till en HELT NY
klass: agent-genererade FIXAR av hookar. Samma strukturella problem, en
nivå djupare.

### Tema 1.6 — Nya hookar och skript i en enda stor bunt (S112 "våg 4")

2026-08-26, PR [#1992](https://github.com/high-five-group/miranon-media-admin/pull/1992)
(`fix/s112-vag4-task-185`, `TASK-185`): en enda PR bygger om HELA
deny-hook-familjen (`deny-frammande-huvudkatalog.sh`,
`deny-hemlighet-utskrift.sh`, `deny-resend-send.sh`,
`deny-subagent-vantan.sh`) plus tio motsvarande testsviter, och rör
`.github/workflows/ci.yml` och `CLAUDE.md`. Detta landade **efter**
`#1942` (tema 1.2, tool-pinning) samma vecka men bygger vidare på dess
guard-bibliotek. Fem andra PR:er samma dag ("bunt a" till "bunt h", `#1978`,
`#1985`, `#1987`, `#1988`, `#2000`) är mindre, avgränsade fixar ur samma
S112-svep (thread-index-gate, backlog-closure-policy, `vite.config.ts`,
prod-deploy-script, acceptance-urval).

### Tema 1.7 — Tool-timeout-justeringar, upprepade

| Datum | PR | Vad |
|---|---|---|
| 2026-09-02 | [#2216](https://github.com/high-five-group/miranon-media-admin/pull/2216) | Acceptance-marginal-shard (`ci-suite.yml`) |
| 2026-09-03 | [#2278](https://github.com/high-five-group/miranon-media-admin/pull/2278) | `TASK-239`: acceptance-självtestets timeout 12→20 minuter |
| 2026-09-04 | [#2288](https://github.com/high-five-group/miranon-media-admin/pull/2288) | Lint-docs-timeout höjd till 10 minuter |
| 2026-09-06 | [#2370](https://github.com/high-five-group/miranon-media-admin/pull/2370) | `TASK-404`: staging-jobbets tak höjt till 20 minuter |

Fyra separata timeout-höjningar på fem veckor, alla i samma riktning
(uppåt). Se § Korrigeringskedjor 3 — `TASK-239`-ytan (acceptance-jobbets
tidsbudget) har minst sex distinkta ändringar sedan 2026-08-10 räknat
över hela mitt undersökningsfönster.

### Tema 1.8 — Backlog-stängningsgrindens löpande underhåll (ADR-131:s förhistoria)

| Datum | PR | Vad |
|---|---|---|
| 2026-08-24 | [#1930](https://github.com/high-five-group/miranon-media-admin/pull/1930) (`TASK-281`) | "CI-grönhet härleds ur landningen" — grunden för hur `check-backlog-closure.sh` bedömer Done-status |
| 2026-08-26 | [#1985](https://github.com/high-five-group/miranon-media-admin/pull/1985) | Ytterligare en `backlog-closure-policy.conf`-fix i S112-bunten |
| 2026-09-04 | [#2286](https://github.com/high-five-group/miranon-media-admin/pull/2286) | **`ADR-131` landar** — beslut att RIVA hela denna gate-familj och flytta till GitHub Issues (se § Fynd 1) |

### Tema 1.9 — Övrig substantiell CI-mekanik i fönstret (kort sammanfattning)

- **2026-08-26** [#1978](https://github.com/high-five-group/miranon-media-admin/pull/1978): ny nightly-gate för trådregistrets integritet (`check-thread-index.sh`), wirad i `nightly.yml`.
- **2026-08-28** [#2042](https://github.com/high-five-group/miranon-media-admin/pull/2042) (`TASK-323`): heartbeat-svepet utökas med en gren-städnings-trigger (`stada-grenar.sh`).
- **2026-09-02** [#2206](https://github.com/high-five-group/miranon-media-admin/pull/2206) (`TASK-359`): ny hemlighets-namn-kontroll (`kontrollera-hemlighets-namn.sh`) plus en fix i `fas4-prod-deploy.sh` för invite-redirect-URL:er.
- **2026-09-04** [#2306](https://github.com/high-five-group/miranon-media-admin/pull/2306): ny label-synk (`scripts/synka-labels.mjs`) mot GitHubs 30 labels — sannolikt förarbete inför ADR-131:s labeltaxonomi (samma vecka), men jag har inte hittat en explicit koppling mellan de två i commit-texten och märker detta **osäker**.
- **2026-09-04** [#2316](https://github.com/high-five-group/miranon-media-admin/pull/2316): CI:s eget audit-jobb får en gracefull degraderingsväg (`audit-ci-med-degradering.sh`) i stället för att fälla hela körningen hårt.
- **2026-09-07** [#2445](https://github.com/high-five-group/miranon-media-admin/pull/2445) (`TASK-426`): triage av en länkkontrolls-nightly-fällning (`.lycheeignore`) — den åttonde `.lycheeignore`-relaterade fixen jag hittat sedan juli (se churn-tabellen, § Tal per vecka).

### Rutinmässiga registreringar (granskade, inte individuellt narrerade)

Följande matchade CI-ytans mönster men bär ingen arkitektonisk
förändring — de är data-registreringar i ett redan byggt system. Jag
har läst filträffen för var och en, inte bara mönstret:

- **`.facit-policy.conf`** (10 PR:er i detta fönster) — varje ny
  prototyp-sida registrerar sig i "facit"-gatens (ADR-102) allowlist.
  Rutinmässig, en rad per PR.
- **`tests/support/fixturvarld/*`** (8 PR:er) — nya eller ändrade
  MSW-testfixturer för specifika produktfunktioner (check-in, närvaro,
  klienträckvidd). Del av det hermetiska testlagret, men PR:erna själva
  ändrar produktdata, inte testarkitekturen.
- **`package.json` utan `scripts`-ändring** (5 PR:er, alla Dependabot:
  #2160, #2159, #1826, #2050, samt `#2229` fast-uri-audit-fix) —
  beroendeversion-bumpar. Se § Andelar nedan.
- **Produkt-ADR:er som råkar dela `docs/decisions/`** (cirka 25 PR:er) —
  kvitto (ADR-109), bilagor (ADR-118/124/125/126), personregister
  (ADR-123), eventlänk (ADR-122), notiser (ADR-121), betalningar/inbetalning
  (ADR-128/129/130), segment (ADR-115). Exkluderade i sin helhet från
  CI-narrativet.
- **Sessionsavslutens `CLAUDE.md`-batchar utan CI-innehåll** — 2 PR:er
  (`#2022` mall-förlagornas sökväg, `#2319` ett frontmatter-datum utan
  sakinnehåll) föll bort efter styckesgranskning.

## Del 2 — Kondenserat: 2026-07-20 → 2026-08-19

**I siffror:** 1 566 PR:er landade totalt i fönstret. 357 matchade
CI-ytan (22,8 procent). Jag har grupperat per sammanhängande
ändringskluster (vecka + tema) i stället för att lista alla 357 — se
§ Metod för hur matchningen gjordes.

### Vecka 2026-07-20 → 07-22 (T80/T81-veckan, första CI-hooken)

Merparten av veckans PR:er är prototyp-växlarens iteration (ADR-074,
inte CI). Två CI-relevanta undantag: **2026-07-22, PR #12** bygger den
**första** PreToolUse-hooken i repot — en spärr mot att köra `gh run
watch` i förgrunden (Marcus-direktiv, S76: "harnesset ska spärra", inte
bara en minnesanteckning). Samma dag och dagen innan: tre separata
"läk audit-grinden"-commits (`fast-uri`, `linkify-it`, `sharp`) — det
första exemplet på ett mönster som återkommer genom hela materialet:
en publicerad CVE (GHSA-advisory) tvingar en avgränsad
`audit-ci.jsonc`-override, aldrig en bred allowlist.

### Vecka 2026-07-23 (S77 — merge-grinden föds, ADR-076/077)

Den processgranskning som `ADR-076` dokumenterar landar denna dag i sex
PR:er (`#99` grunden, `#100`/`#102` en aggregator-fix **SAMMA DAG** som
grunden — se § Korrigeringskedjor 4 — `#107`, `#112`/`#113`/`#115`
nattnätet, `#117` D1, `#121` dedup). ADR-077 (riskklassning + nightly +
dedup) myntas denna dag och bär hela trions beslut i en enda ADR.

### Vecka 2026-07-24 → 07-25 (S80–S88 — mätning och nattvakt)

CI-metrik (#125, S80/36.5), "rött-först"-principen kodifierad (#128),
`ci-wait`-verktyget byggs (#195, S87 — ett skript som väntar in en
körning i stället för att en agent pollar för hand), nattvakt (#205,
S88), en required-check-bindning (#203). Tre dependency-override-fixar
(`js-yaml`, `brace-expansion`) och en `.lycheeignore`-fix
(lychee = länkkontrollsverktyget) mellan dem.

### Vecka 2026-07-26 → 07-27 (repot byter ägare, merge queue öppnas)

**2026-07-27, PR #269** ("s91-merge-queue-falsifieringen"): en tidigare
slutsats om merge queue prövas och kullkastas — se ADR-076:s eget
korrigeringsblock (citerat nedan). Samma dag: **ADR-080 landar** (#272,
acceptance-klassen — den hermetiska testklassens grund), MSW-baserat
hermetiskt API-mock-lager byggs (#278, `task-54.1`), och
visual-baseline-rättighetskedjan dokumenteras (#288).

Redan **2026-07-26** (#248) byggs `check:docs` och dess klassning —
grinden denna djupgranskning fick instruktion att INTE köra under
byggandet (se agentkontraktet).

### Vecka 2026-07-28 (kontraktsvakten, typade agenter, post-merge-lagret)

Tät dag: kontraktsvakten byggs i två steg (#299, #346 "alla sju"),
hermetik-självtestet (#309) och dess retry-fix SAMMA DAG (#310),
**typade agenter + worktree-isolering** (#327 — grunden för hela
`bygg-agent`/`review-agent`/`research-pass`-uppdelningen), och
**post-merge-lagret** (#371, `TASK-70.2`) — den mekanism vars
klassningslogik sedan blir en upprepad felkälla (§ Korrigeringskedjor 2,
FÖRSTA instansen: #386, `TASK-73`, samma dag).

### Vecka 2026-07-29 (merge queue aktiveras — den mest tätpackade dagen i hela materialet)

**Merge queue aktiveras** (#403, `TASK-70.1`) samma dag som staging och
a11y tas UR PR-grinden (#395, #409 — flyttas till andra jobb för att
inte blockera varje enskild PR). 24 PR:er landar denna dag totalt inom
CI-ytan, inklusive flake-mätverktyget (#420, `flake-matserie`),
branch-auto-delete (#422, `TASK-70.6`), och **ANDRA instansen** av
post-merge-klassningsbuggen (#433, `TASK-78` — "ärv kö-körningens
klassning", en annan vinkel på samma yta som dagen innan).

### Vecka 2026-07-30 → 07-31 (fynd-svepet — "task-8x" till "task-11x")

En lång rad av enskilda, avgränsade fynd-fixar (`fynd/task-86` till
`fynd/task-108`) — `autoMergeRequest`-signalen rättas (#478),
kortnummer-kollisionen upptäcks (#487, grunden för `check_active_branches`
i `TASK-93`), listparitets-grinden byggs (#489), och **ADR-083 (prosa som
påstår mekanism) får sin egen CI-grind** (#496, `task-98` — meta: en ADR
om ärlighet i dokumentation blir själv mekaniskt kontrollerad).

### Vecka 2026-08-01 (STOP-vakten, ADR-086, sessionsdok single-writer)

STOP-vakten byggs (#551, `TASK-113`), `ADR-086` kodifieras (#552,
premiss-pass-disciplinen som hela detta forskningspass följer),
`TASK-99` (dequeue/enqueue) provas skarpt (`#565` — samma mätning som
`docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md`).

### Vecka 2026-08-02 → 08-03 (heartbeat-svepet, webbläsarbeteende-klassen)

**Heartbeat-svepet mekaniseras** (`#614`, `TASK-119`). **2026-08-03, PR
`#651`: ADR-094 (webbläsarbeteende-testklassen) byggs.** Samma dag:
`TASK-128`s ISSUE — en falsklarmande heartbeat-kandidat kring
`isInMergeQueue` (`#645`) — se § Korrigeringskedjor 5.

### Vecka 2026-08-04 (S97 — den mest hook-intensiva dagen i hela materialet)

30+ PR:er samma dag. Katalogägarskaps-hooken föds (#706), sannings-
avstämningen (#707), en nattvakts-falsklarms-fix (#708), hook-formen
växlas från "ask" till "deny" (#713) — och **`T121`
(`core.hooksPath`-buggen) får TVÅ separata fixförsök samma dag**: #718
("relativ" sökväg) och #723 ("självläkande vakt", efter att #718
visade sig otillräckligt) — se § Korrigeringskedjor 1. Samma dag skrivs
(och senare visar sig delvis fel, enligt `CLAUDE.md`s egen historik)
dokumentationen om att "agenter kan inte cross-repo" (#727) och
worktree-isoleringens gräns (#733).

### Vecka 2026-08-05 (verify:ci-parity byggs OCH korrigeras samma dag)

**PR #752** bygger `verify:ci-parity` som lokal grind. **PR #762, SAMMA
DAG**, lägger till diff-baserad klassning (`TASK-142`) eftersom den
första versionen körde allt oavsett diff. Samma dag: `ADR-076`s
`strict`-inställning stängs av (#749, efter att ha visat sig skapa en
deadlock med den nya kön — se § Korrigeringskedjor 4), `ADR-036`
amenderas (#765), och en tredje ADR (`ADR-095`) skrivs och rättas inom
loppet av två dagar (#740, #744, #751).

### Vecka 2026-08-07 (fem ADR:er på en dag — ADR-096 till ADR-102)

`ADR-096` (subagentens väntekontrakt, #854), `ADR-097` (arbetsformens
tillståndsbärare, #863), `ADR-098` (trådregistret, #889), `ADR-099`
(sessionsdok-fönstret, #903), `ADR-100` (sanningshierarkin, #912),
`ADR-101` (compact-formen, #941) och `ADR-102` (facit-principen, #944)
landar alla denna vecka — samt facit-gatens mekanisering samma dag som
sin egen ADR (#949).

### Vecka 2026-08-08 → 08-09 (den stora ADR-100-revisionen)

Nio separata `TASK-161`-korrigeringar av tidigare dokumentation
(#961–#989) samma dag — en enda revisionsrunda som rättar flera
sakfel som hade smugit sig in i `CLAUDE.md` och ADR:er under den
täta perioden ovan (bland annat en felräknad grindräkning, se
churn-noten i `CLAUDE.md` självt om "13" som borde varit ett annat
tal). Godkännande-mekaniken byggs (#1023, `ADR-104`).

### Vecka 2026-08-10 → 08-14 (prod-ref-låset, aktivitetslogg)

**`Prod-ref-låset` byggs** (#1212, `TASK-203`) — grunden för dagens
`.prod-ref-policy.conf`-mekanism som `CLAUDE.md` dokumenterar utförligt.
Sessionsdok-fönstrets nattgrind aktiveras (#1106, verkställer `ADR-099`).

### Vecka 2026-08-15 → 08-19 (acceptance-jobbets tidsbudget, backlog-CLI-wrappern)

**`TASK-238`/`TASK-239`-ytan (acceptance-testets tidsbudget och
backlog-stängningsgrindens prestanda) får FYRA separata fixar på fem
dagar:** #1398 (12-min-timeout), #1401 (marginal-mätning), #1409
(strukturell warmup-gate, "varv 2" — alltså en andra omgång), #1410
(`backlog-stängningsgrind`-driften och korttiden — den mätning
`CLAUDE.md` citerar: 28,5→1,96 sekunder). Samma vecka: `Fas4`
prod-deploy-skriptet byggs (#1551, `TASK-271`) och `npm run bl`-
wrappern för backlog-CLI:t (#1505, `TASK-250`, grunden för `ADR-117`).

## Del 3 — Epokkarta: ADR-029 (maj 2026) → 2026-07-19

| Datum | ADR/PR | Epokskifte |
|---|---|---|
| 2026-05-12 | ADR-028 | Supply-chain-incidentklass — den första säkerhetsgrinden |
| 2026-05-13 | **ADR-029** | Grundarkitekturen: changed-files-baserad skip-klassning + third-party Actions-policy. Startpunkten uppdraget pekar ut |
| 2026-05-14 | ADR-030 | Docs-grindvakter + frontmatter-policy |
| 2026-05-16 | ADR-031, ADR-033 | Dependabot-strategi 2026; shellcheck-strict-grindvakt |
| 2026-05-20 | ADR-032 | Vale "lazy continuation" helfil-disable |
| 2026-05-27 | ADR-039 | Konsistensgrindarnas kadens. Samma dag: ADR-029:s FÖRSTA korrigering (`fetch-depth` 50→100) |
| 2026-05-29 | (ADR-029-erratum) | `fetch-depth` 100→250 — ANDRA korrigeringen av samma parameter |
| 2026-06-13 | ADR-050 | Isolerad staging-miljö (separat Supabase-projekt + Airtable-bas) — grunden för allt senare E2E/acceptance-arbete |
| 2026-06-17 | ADR-054 | `fetch-depth` 250→0 (hela historiken) — TREDJE korrigeringen, nu en falsifiering av hela "begränsat djup"-idén, inte bara en ny bump |
| 2026-06-22 | ADR-060 | Sentinel setup-purge-create-konformitet — staging-datans livscykel-kontrakt |
| 2026-06-23 | ADR-061 | Lokal miljö-isolation |
| 2026-07-23 | **ADR-076, ADR-077** | Merge-grinden (ruleset + PR-flöde för ALLA landningar) och riskanpassad CI (klassning + dedup + nightly) — den arkitektur som i praktiken gäller i dag. Samma dag: ADR-029:s FJÄRDE korrigering (actionlint-pinning, release-pinnad i stället för muterbart download-script) |

**Tidsmönster jag vill lyfta fram redan här:** ADR-029 korrigerades FYRA
gånger på fem veckor (maj–juli) innan den nådde sitt nuvarande, stabila
värde (`fetch-depth: 0`). Det är samma mönster jag sedan hittar upprepat
på flera andra ytor genom hela materialet (se nästa avsnitt) — detta
repo löser sällan en gate-parameter i ett försök.

## Öppna PR:er — pågående, INTE landade (mätt 2026-09-17)

Dessa fem existerar i skrivande stund men ingår INTE i talen ovan
(de räknas när/om de landar):

- **[#2491](https://github.com/high-five-group/miranon-media-admin/pull/2491)**
  (`TASK-444`, draft): stänger två `audit-ci`-advisories (`sharp`,
  `smol-toml`) som fällt nightlyns "Bredare sårbarhetsgranskning" sedan
  2026-09-09 och blockerat fem Dependabot-PR:er (#2480–#2484). Samma
  mönster som juli-augusti (avgränsad override, inte allowlist). Enligt
  uppdragets egen källmärkning staplar S125 en fix för en utgången
  fixturtoken i acceptance-klassen på samma gren — jag har INTE själv
  verifierat den delen (den syntes inte i de första 900 tecknen av
  PR-kroppen jag läste) och märker den **osäker**.
- **[#2495](https://github.com/high-five-group/miranon-media-admin/pull/2495)**
  (`TASK-445`): rotorsaksfix för en Dependabot-PR (#2481) som själv
  FÄLLDE typecheck i CI — `react-aria-components@1.21.1` kräver
  `@internationalized/date@^3.12.4`, men vårt `package.json` pinnade
  paketet exakt till `3.12.3` utan caret, vilket gav tre nästlade
  dubbletter i stället för en gemensam kopia. Ett rent exempel på att
  **automatiserad CI-städning (Dependabot) själv kan orsaka en
  CI-regression** som kräver manuell utredning.
- **[#2492](https://github.com/high-five-group/miranon-media-admin/pull/2492)**
  och **[#2494](https://github.com/high-five-group/miranon-media-admin/pull/2494)**
  (`TASK-125`, staplade på varandra): rättar backlog-stängningsgrindens
  restlista, 30 → 12 → 2 inkonsekventa kort, utlöst av nightly-körning
  `35187813487` (2026-09-17). De två sista korten är Marcus egna
  medvetna undantag (`TASK-241.5`, `TASK-284.4`). **Detta är särskilt
  värt att notera:** samma gate som ADR-131 (§ Fynd 1) redan beslutat
  att RIVA underhålls fortfarande aktivt, tretton dagar efter det
  beslutet — arkitekturen lever kvar och kräver skötsel även efter att
  den blivit dömd.
- **[#2490](https://github.com/high-five-group/miranon-media-admin/pull/2490)**: arkiverar ett sessionsdokument (S110) för att göra
  sessionsdok-fönstrets nattgrind (`ADR-099`) grön igen — rutinunderhåll
  av samma typ som flera tidigare i materialet.

## Särskilt värdefullt

### Fynd 1 — ADR-131: beslutad men INTE verkställd rivning av en hel gate-familj

**Verifierad** (jag har läst hela ADR-filen och kontrollerat att
skripten den pekar på fortfarande finns på disk). 2026-09-04
(PR [#2286](https://github.com/high-five-group/miranon-media-admin/pull/2286),
grillad samsyn S118): Marcus och orkestreraren beslutade — Status:
Accepted, nio delbeslut kvitterade — att flytta hela
arbets-spårningssubstratet från `Backlog.md` (filer i git) till GitHub
Issues. Beslutet river ÖPPET `ADR-117` och `ADR-127` och planerar att
riva `scripts/check-backlog-closure.sh`, `backlog-kortfakta.mjs`,
`backlog-cli.sh` med testsviter, `backlog.md` som beroende, nightly-
jobbet för backlog-stängning, och två `CLAUDE.md`-avsnitt.

**Ännu inte verkställt:** ADR:ns egen `## Updates`-sektion säger "Inga
än", och samtliga nämnda skript finns oförändrade kvar på disk
(kontrollerat 2026-09-17). Ordningen ADR:n själv lägger fast är:
minimalt test → migrationsskript → "brytdag" med hårt datum → rivning i
EGEN PR efter en veckas verifierad drift. De öppna PR:erna #2492/#2494
(ovan) visar att gate-familjen som ska rivas fortfarande aktivt
underhålls tretton dagar efter beslutet.

**Varför detta hör hemma i en ändringslogg och inte bara i
arkitekturkartan:** det är den STÖRSTA planerade förändringen av
grindvaktsarkitekturen jag har hittat i hela materialet, och den är
osynlig om man bara läser landade commits — den finns bara som ett
beslut som väntar på sin egen genomförande-tidslinje.

### Korrigeringskedjor (samma yta, flera separata fixar)

**1. `core.hooksPath`/worktree-buggen (`T121`) — minst tre distinkta
åtgärder, ingen av dem en verklig lösning.** 2026-08-04: #718
("relativ sökväg"), samma dag #723 ("självläkande vakt" — ett skript
som läker värdet vid nästa commit, eftersom själva buggen ligger i
`claude-code`-binären och inte går att laga hos oss). `CLAUDE.md`
dokumenterar (rad 461–465) att buggen fortfarande triggas vid VARJE
`git worktree add`, och att motåtgärden bara är "isolera efter behov,
inte som default" — mildring, inte lösning. Källor:
`anthropics/claude-code` `#27474`, `#66993`, `#72714` (öppen).
**Generaliseringen** (§ Tema 1.5 ovan): samma "kan inte bevisas i egen
session"-mönster upptäcktes 2026-08-28 gälla även agent-byggda hook-FIXAR,
inte bara nyregistrerade hookar (`TASK-322`).

**2. Post-merge-klassningens ärvning — fyra separata fixar på en
månad.** `TASK-73` (#386, 2026-07-28): post-merge körde ALLT oavsett
klassning, fixad att ärva `ci.yml`s D0-klassning. `TASK-78` (#433,
2026-07-29): en annan vinkel — kö-körningens (`merge_group`) klassning
ärvdes inte korrekt. `T166` (dokumenterad #1716, 2026-08-21, ingen
kodfix synlig i min sökning — bara ett dokumenterat kantfall: "läser
HEAD^2, inte hela push-spannet"). `TASK-334` (#2059, 2026-08-28): den
tredje verkliga koden-fixen — larmet pekade ut FEL landning, och den
underliggande felaktigheten (en trasig testsvit) förblev osynlig i tre
dagar. Detta är den tydligaste enskilda regressionen i hela materialet
(se § Tema 1.4).

**3. Acceptance-testets tidsbudget — minst sex justeringar sedan
2026-08-10.** #1398 (12 min timeout), #1401 (marginal-mätning), #1409
(strukturell warmup, "varv 2"), #1410 (backlog-closure-drift), #1504
(`TASK-239` acceptance-jobbets tak, 2026-08-17), #2216 (marginal-shard,
2026-09-02), #2278 (timeout 12→20 min, 2026-09-03). Sju instanser om man
räknar generöst — jag har INTE läst varje diff i detalj (endast
subjektrader + två diff-stat-kontroller) så antalet är **starkt
indikerad**, inte fullt verifierad ner till varje enskild rad.

**4. ADR-076 (merge-grinden) — tre egna korrigeringar inbakade i sin
egen ADR-text.** Grunden landar 2026-07-23 (#99), men SAMMA DAG
upptäcks och stängs ett "fail-open-hål" i aggregatorn (#100/#102 —
en skippad required check räknades som uppfylld, en PR mergades röd).
2026-07-27: ägarformen ("repot är User-ägt") visar sig ha ändrats när
Marcus flyttade repot till organisationen `high-five-group` för att
öppna merge queue. 2026-08-05 (#749): `strict`-inställningen stängs av
efter att ha visat sig skapa en DEADLOCK med den nya kön (en PR som blev
`BEHIND` innan den hann köas släpptes aldrig in). Alla tre korrigeringar
är skrivna direkt i ADR-076:s eget dokument som öppna
"Korrigering"-block — ett medvetet, transparent mönster för hur detta
repo hanterar att ett beslut visar sig ofullständigt, snarare än att
tyst skriva om historien.

**5. `isInMergeQueue`-fältet — två separata missförstånd.** 2026-08-03
(#645, `TASK-128`): en heartbeat-kandidat falsklarmade eftersom
`autoMergeRequest: null` feltolkades som "aldrig armerad" (fältet nollas
även när en PR är korrekt köad). 2026-08-24 (#1953): en uppföljande
dokumentationsrättelse konstaterar att `gh pr view --json isInMergeQueue`
INTE FINNS som fält i `gh` (mätt två gånger oberoende, 2026-08-24) —
fältet nås bara via `gh api graphql`, inte `gh pr view --json`. `CLAUDE.md`
dokumenterar (rad 545–558) att detta fällde `TASK-128` "sju gånger på en
enda natt" innan roten hittades.

### Regressioner jag hittat (utöver #2059/`TASK-334` ovan)

- **Dependabot som CI-orsak:** #2495/`TASK-445` (öppen) — en helt
  automatiserad, "ofarlig" beroendeuppdatering (#2481) fällde typecheck
  i CI eftersom den exponerade en tyst npm-hoisting-konflikt i en EXAKT
  pinnad transitiv version. Detta är en regression orsakad AV CI-
  maskineriets egen automatisering (Dependabot), inte av produktkod.
- **`ADR-095`-korrigeringen** (#751, 2026-08-05, samma vecka som ADR:n
  själv skrevs #740/#744) — jag har inte läst innehållet i detalj
  (utanför min delfråga) men noterar mönstret: en ADR som rättas inom
  loppet av ett dygn efter att den skrevs.

### Reverts

Jag har INTE hittat något explicit `git revert`-commit-mönster i mitt
sökfönster (`git log --grep="^Revert"` gav inga träffar bland de 506
CI-matchande PR:erna). `CONTRIBUTING.md` § Landnings-ordningen beskriver
en "bråskande revert"-väg (kohopp) som en möjlighet, men jag har inte
hittat ett tillfälle där den faktiskt användes i mitt fönster. Detta är
alltså **frånvaro av bevis, inte bevis på frånvaro** — jag har inte sökt
efter ord som "revert" i löptexten på svenska (t.ex. "återgång",
"rullas tillbaka"), bara det engelska git-konventionsordet.

### CI-maskineri byggt för sin egen skull, snarare än för att skydda produkten

Flera av de största enskilda ändringarna skyddar CI-systemet SJÄLVT,
inte produktkoden direkt:

- Verktygsversion-pinning (#1942, tema 1.2) — skyddar mot att `jq`/`gh`/
  Actions ändrar sig under fötterna på CI.
- `verify:ci-parity` (#752/#762) — låter en agent köra CI:s EGEN
  uppsättning lokalt.
- CI:s eget audit-jobb får en degraderingsväg (#2316) — så att CI:s
  SÄKERHETSKONTROLL inte självt blir en enda punkt av total blockering.
- Instrumenteringsloggen för review-grinden (#2052, T173.6) — mäter
  granskningsprocessen, fäller ingenting.
- `.ci-parity-policy.json`s egen paritetsgrind (nämnd i `CLAUDE.md`) —
  en grind som vaktar att GRINDARNA inte har glidit isär.

Detta är inte ett problem i sig — det är precis vad en "djup modul"
(uppdragets egen term) ska göra: kapsla in sin egen komplexitet. Men det
betyder att en betydande andel av CI-arbetet inte går att mäta i termer
av "vilken produktbugg förhindrade detta", eftersom syftet är
maskinens egen pålitlighet.

### Andelar: nyfunktion, korrigering, anpassning

**Metodnot, läs innan talen:** jag har INTE kategoriserat samtliga 506
CI-matchande PR:er ett och ett — det ligger utanför vad som är rimligt i
ett enda forskningspass. Nedanstående är en **starkt indikerad**
uppskattning över den delmängd (cirka 45–50 PR:er) jag har läst
subjektrad + minst en diff-detalj för, alltså den arkitektoniskt
substantiella delen av materialet. Dependabot-bumparna (dussintals,
rent mekaniska) är medvetet uteslutna ur nämnaren eftersom de saknar
architekturell narrativ i sig själva — men den ENA av dem som orsakade
en regression (#2495) räknas som korrigering.

| Klass | Ungefärlig andel | Exempel |
|---|---|---|
| Ny funktionalitet | ~40 procent | Review-grinden (6 PR:er), merge queue, acceptance-klassen, prod-ref-lock, Airtable-prod-lås, heartbeat-svep, verktygspinning |
| Korrigering av tidigare CI-ändring | ~40 procent | De fem kedjorna ovan, plus ADR-029:s fyra fetch-depth-bumpar, ADR-076:s tre inbyggda korrigeringar, TASK-161:s niofaldiga dokumentationsrättelse |
| Anpassning till yttre förändring (CVE, plattform, beroende) | ~20 procent | `audit-ci`-overrides (minst 6 separata instanser sedan juli), Supabase-CLI-pinning, GitHubs merge queue-funktion som blev tillgänglig efter ägarbytet, `react-aria-components`-konflikten |

Om siffrorna är representativa för HELA populationen på 506 PR:er är
**osäkert** — jag har goda skäl att tro att andelen "korrigering" är
UNDERSKATTAD i helhetspopulationen, eftersom rutinmässiga, enradiga
facit-registreringar (som jag exkluderat ur nämnaren här) späder ut
andelen korrigering om de räknas in, medan de substantiella PR:erna jag
faktiskt läste är just de som var värda att skriva om.

## Osäkerheter och vad jag inte kunde belägga

- **Exakt commit-nivå-räkning (inte PR-nivå) för "andel av alla commits
  på main".** Jag har räknat per landad PR (se § Metod för motiveringen)
  och kan inte utan betydande extra arbete (att gå igenom varenda
  enskild commit inuti varje PR, inte bara merge-diffen) ge ett exakt
  tal för "antal CI-rörande COMMITS". Vad som krävs: samma
  diff-baserade sökning körd mot `git log --no-merges` i stället för
  `--first-parent`, vilket är betydligt dyrare (tusentals ytterligare
  `git diff`-anrop).
- **Om `.review-policy.json`s label-synk (#2306) faktiskt är förarbete
  för ADR-131:s labeltaxonomi** — tidsmässigt sammanfaller de (samma
  vecka) men jag har inte hittat en explicit textkoppling.
- **Om acceptance-timeout-kedjans exakta antal är sex eller sju** — jag
  har inte läst varje diff i detalj, bara subjektrader och två
  diff-stat-kontroller.
- **Skarpbeviset för `TASK-419` (Airtable-prod-låset)** — hooken
  registrerades 2026-09-07 och kan enligt repots egen regel om
  nyregistrerade hookar inte förlitas på i sin egen byggsession. Jag har
  inte själv provocerat den. Vad som krävs: ett agent-anrop med
  `mcp__airtable__`-verktyg riktat mot `app8uGPrVCVOm6LfD`, kört av en
  session som startade EFTER 2026-09-07, med resultatet dokumenterat.
- **Revert-mönster i svensk löptext** — jag sökte bara på engelska
  git-konventionsord. En sökning på svenska termer ("återgång",
  "rullades tillbaka", "kohopp") skulle kunna hitta instanser jag missat.
- **Huruvida `ADR-131`s "brytdag" redan är satt** — ADR:ns text talar om
  ett "hårt brytdatum" men jag har inte hittat ett faktiskt kalenderdatum
  i något dokument jag läst. Detta bör efterfrågas direkt av
  orkestreraren eller Marcus om det är relevant för uppdragets helhet.

## Risker

- **Backlog-stängningsgrinden underhålls fortfarande aktivt (#2492/
  #2494) trots att den är dömd att rivas (ADR-131).** Om rivningen
  dröjer ytterligare veckor riskerar underhållsarbetet att fortsätta
  duplicera arbete som snart kastas.
- **`core.hooksPath`-buggen (`T121`) är en plattformsbugg utan egen
  lösning** — varje ny worktree triggar den, och mildringen
  (självläkning vid nästa commit) är beroende av att `.githooks/
  pre-commit` faktiskt körs. Om den självläkande mekanismen själv
  fallerar tyst finns ingen sekundär vakt jag har hittat i detta pass.
- **Post-merge-attribueringsklassen (nu fyra instanser) tyder på att
  hela klassnings-återanvändningsmönstret (ärv PR-grindens klassning i
  stället för att räkna om) är strukturellt känsligt** — varje ny
  konsument av samma klassningslogik (nightly, post-merge, framtida
  jobb) riskerar samma felklass tills ett gemensamt, en gång för alla
  löst kontrakt finns.

## Rekommendationer

**Detta är rekommendationer, inte beslut.**

1. Överväg att sätta ett explicit kalenderdatum för ADR-131:s "brytdag"
   om det inte redan finns, eftersom en gate-familj som är dömd men
   fortfarande aktivt underhålls (#2492/#2494) är en tydlig kostnad utan
   naturligt slutdatum.
2. Överväg en enda gemensam, testad klassnings-tjänst för "har detta
   träd redan verifierats" i stället för att varje konsument (post-merge,
   nightly, framtida jobb) implementerar sin egen ärvningslogik — detta
   skulle sannolikt förebygga en femte instans av korrigeringskedja 2.
3. Skarpbevisa `TASK-419`s Airtable-prod-lås i en session som startade
   efter 2026-09-07, enligt repots egen regel om nyregistrerade hookar,
   om detta inte redan gjorts sedan mitt pass startade.

## Källor

- Lokal git-historik, `origin/main` (`eeca8c72d8244fcd59ae5d99e0052410dac67bb`,
  2026-09-08) och samtliga citerade commit-SHA:er/PR-nummer ovan —
  hämtade med `git log`/`git diff` mot repots faktiska historik,
  2026-09-17.
- `gh pr view` (JSON-fält, skrivskyddat) mot PR
  [#2491](https://github.com/high-five-group/miranon-media-admin/pull/2491),
  [#2495](https://github.com/high-five-group/miranon-media-admin/pull/2495),
  [#2492](https://github.com/high-five-group/miranon-media-admin/pull/2492),
  [#2494](https://github.com/high-five-group/miranon-media-admin/pull/2494),
  [#2490](https://github.com/high-five-group/miranon-media-admin/pull/2490),
  2026-09-17.
- `CLAUDE.md` (repotoppens styrande fil, läst i sin helhet som del av
  agentens systemprompt) — citerad med radnummer där specifikt.
- `docs/decisions/ADR-029-ci-architektur-changed-files-pattern.md`,
  `ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md`,
  `ADR-050-isolerad-staging-miljo.md`,
  `ADR-054-fetch-depth-full-historik.md`,
  `ADR-060-sentinel-setup-purge-create-conformance.md`,
  `ADR-061-lokal-miljo-isolation.md`,
  `ADR-076-merge-grinden-ruleset-pr-flode.md`,
  `ADR-077-riskanpassad-ci-klassning-dedup-nightly.md`,
  `ADR-080-acceptance-klassen-hermetisk-utbrytning.md`,
  `ADR-094-webblasarbeteende-testklass.md`,
  `ADR-105-review-grinden-fyra-deltan-byggs-inte-adopteras.md`,
  `ADR-131-work-item-substratet-github-issues.md` — samtliga lästa i
  sin helhet eller till relevant sektion, 2026-09-17.
- `backlog/tasks/task-334 - Fynd-post-merge.yml-s-Ärvd-klassning-…md`
  — läst i sin helhet för § Tema 1.4 och § Korrigeringskedjor 2.
- Tre befintliga research-pass, se § Vad jag läste först.
