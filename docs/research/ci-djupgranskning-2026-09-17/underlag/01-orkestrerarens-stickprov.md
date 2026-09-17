---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Orkestrerarens stickprov och bokförda motsägelser — CI-djupgranskningen (S126)

> **Proveniens:** förs löpande av orkestreraren (Session 126, Claude Fable
> 5.1) medan agenterna rapporterar in, 2026-09-17. Uppdraget kräver att
> orkestreraren *"gör egna stickprov på kritiska påståenden innan de tas in i
> slutresultatet"* (uppdragsfilen rad 45). Varje post nedan är ett påstående
> ur en agents fil som orkestreraren SJÄLV prövat mot disk eller mot GitHub —
> med kommandot, utfallet och domen. Ögonblicksbild: `origin/main`
> `eeca8c72`.

## Så läses loggen

En post per stickprov. **Höll** betyder att orkestrerarens egen mätning gav
samma svar som agenten. **Föll** betyder att den inte gjorde det — då står
vad som i stället gäller, och agentens fil rättas i våg 2. **Skärpt**
betyder att påståendet höll men behövde en precisering.

Sist i filen står motsägelser MELLAN agenter och öppna frågor som våg 2 ska
utreda.

## Stickprov

### S1 — Staging-sviten kör aldrig före merge (källa: J1a)

- **Påstående:** fyra av `ci-suite.yml`:s åtta jobb — `purge`, `a11y`,
  `test-staging`, `purge-efter` — körs aldrig på PR- eller kö-ytan, eftersom
  `ci.yml` skickar `run_staging: false` och `run_a11y: false` utan villkor.
- **Prövat med:** `sed -n '2262,2282p' .github/workflows/ci.yml` och
  `grep -n "run_staging\|run_a11y" .github/workflows/*.yml`.
- **Utfall:** `ci.yml:2271-2272` bär de två raderna ordagrant, utan `if:`.
  `ci-suite.yml:96`, `:707`, `:762`, `:938` villkorar de fyra jobben på
  inputen. `post-merge.yml:249` anropar sviten utan `with:`.
- **Dom: höll.** Följd: uppdragets fråga *"körs testet på varje PR för att
  det behövs…"* (rad 340) vilar på en premiss som inte längre gäller.
  Uppdraget till J8.4 skrevs om före spawn, och J8.7 fick rättelsen skickad
  under körning.

### S2 — Aggregatorns logik och täckning (källa: J1a)

- **Påstående:** `ci-passed` ("CI Passed or Skipped") kör alltid
  (`if: always()`), fäller på `failure` eller `cancelled` i något av sina
  sex `needs`, och släpper igenom `skipped` tyst.
- **Prövat med:** `sed -n '2537,2566p' .github/workflows/ci.yml` samt en
  `awk`-uppräkning av toppnivåjobben under `jobs:`.
- **Utfall:** koden är exakt den J1a citerar. `ci.yml` har sju toppnivåjobb
  (`changed` rad 50, `lint` 503, `audit` 2097, `suite` 2156, `docs` 2278,
  `review-backstopp` 2483, `ci-passed` 2537); aggregatorns `needs` räknar upp
  de sex övriga — listan är fullständig i dag.
- **Dom: höll.** Två följdfrågor till våg 2: (a) logiken kan inte skilja en
  AVSIKTLIG skip från en OAVSIKTLIG (ett `if:` som faller fel därför att en
  output från `changed` är tom) — det är J8.5:s huvudfråga; (b) ingen
  mekanism vaktar att ett NYTT toppnivåjobb läggs in i `needs` (J1a:s
  observation — pröva mot `.listparitet-policy.conf` och
  `.ci-parity-policy.json` innan den tas in som fynd).

### S3 — `audit` fäller docs-only-PR:er med avsikt (källa: S125:s fråga c)

- **Påstående att pröva:** S125 frågade om det är avsett att `audit-ci` som
  PR-grind fäller även docs-only-PR:er.
- **Prövat med:** samma läsning som S2.
- **Utfall:** aggregatorns eget kommentarsblock (`ci.yml:2545-2550`) säger
  att `audit` *"har varken `if:` eller `needs:` och kan därför aldrig bli
  `skipped`"* — jobbet är alltså medvetet oberoende av diff-klassningen
  sedan `TASK-395` (2026-09-04).
- **Dom: avsett i koden.** Om det är KLOKT är en annan fråga: en ny advisory
  i ett beroende låser i dag VARJE landning, även en ren textändring — det
  är exakt det läge kön står i 2026-09-17. Bärs till åtgärdsplanen som en
  avvägning, inte som ett fel.

### S4 — Prosa som påstår en frånvaro som inte längre stämmer (källa: J1d)

- **Påstående:** Marcus globala `~/.claude/CLAUDE.md` säger om regeln
  "STOPPA-OCH-FRÅGA aldrig som popup" att *"Detta är PROSA, inte en spärr —
  inget hindrar mekaniskt en popup"*; men marcus-system-pluginet bär en hook
  som nekar verktyget.
- **Prövat med:** `ls` på
  `~/.claude/plugins/cache/marcus-hub/marcus-system/1.34.0/hooks/` och
  `grep -n -i askuserquestion` i `hooks.json` + skripten.
- **Utfall:** `deny-askuserquestion.sh` finns (1 267 byte, 2026-08-22) och
  är registrerad i `hooks.json:41-45` med matchern `AskUserQuestion`.
- **Dom: höll.** ADR-083-felet i spegelvänd form. Filen ligger utanför detta
  repo (hubbens konstitution) — bärs till åtgärdsplanen som en
  prosa-rättelse åt Marcus, rörs inte av denna session.

### S5 — Rulesetet `main-skydd`, mätt tre gånger oberoende (källa: J1a, J1e)

- **Påstående:** en enda required check, `"CI Passed or Skipped"`, bunden
  till GitHub Actions-appen (`integration_id` 15368); PR-krav med noll
  godkännanden; tom bypass-lista; merge-kö med `ALLGREEN`, högst tre poster
  per grupp, merge-metod `MERGE`; oförändrat sedan 2026-08-05.
- **Prövat med:** `gh api repos/high-five-group/miranon-media-admin/rulesets/19627609`
  med ett `--jq`-filter över `rules[]`, 2026-09-17.
- **Utfall:** `enforcement: active`, `bypass_actors: 0`, fem regler
  (`deletion`, `non_fast_forward`, `pull_request` med
  `required_approving_review_count: 0`, `required_status_checks` med exakt
  den enda posten ovan, `merge_queue` med `grouping_strategy: ALLGREEN`,
  `max_entries_to_merge: 3`, `min_entries_to_merge: 1`,
  `merge_method: MERGE`), `updated_at: 2026-08-05T01:55:12+02:00`.
- **Dom: höll** — och J1a och J1e kom oberoende till samma värden. Noll
  drift mot `ADR-076`. Grindens YTTRE ram är alltså den bäst belagda delen
  av hela arkitekturen.

### S6 — Ingen mekanism upptäcker en stale prod-deploy (källa: J1e)

- **Påstående:** kortet `TASK-199` (prioritet high) bokför att
  prod-frontenden stod stale i minst 20 timmar trots Vercels git-integration,
  att det upptäcktes av en människa, och att kortet fortfarande är öppet.
- **Prövat med:** `ls backlog/tasks/ | grep "^task-199 "` och kortets
  frontmatter.
- **Utfall:** kortet finns, `status: To Do`, `priority: high`, etikett
  `ready-for-human`, skapat 2026-08-11, senast rört 2026-08-28.
- **Dom: höll.** Detta är granskningens första belagda instans av en
  felklass som INGEN grind täcker: allt maskineri vaktar vägen FRAM till
  `main`, ingenting vaktar att `main` faktiskt når användaren. Jämför med
  J8.1:s incidentregister i våg 2.

## Motsägelser mellan agenter

Inga bokförda ännu.

## Öppna frågor till våg 2

- Vaktas aggregatorns `needs`-lista av någon paritetsgrind? (S2 b)
- Hur många landade träd fick aldrig en `post-merge`-körning? (S125:s fynd a
  = `TASK-365`; J8.4 räknar, J1b läser `concurrency`-blocket — jämför.)
