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

### S7 — Nattnätet har varit rött i femtio dygn (källa: J1b, skärpt)

- **Påstående:** J1b mätte `nightly.yml` rött 30 av 30 körningar och 22
  öppna, obesvarade `ci-natt`-ärenden i obruten ström sedan 2026-08-28.
  S125 hade uppgett "röd 12 av 12 nätter" och 13 öppna `ci-natt`-larm.
- **Prövat med:** `gh run list --workflow nightly.yml --limit 60` filtrerat
  på `event == "schedule"` och grupperat på utfall; `gh issue list --label
  ci-natt` (öppna respektive alla, `--limit 200`); `gh issue list --label
  ci-post-merge --state all --limit 400`. Alla 2026-09-17.
- **Utfall:** 52 schemalagda nattkörningar sedan 2026-07-28: **51 röda, 1
  grön**. Senaste gröna natten: **2026-07-29**. `ci-natt`: 63 ärenden
  totalt, **21 öppna**, äldsta öppna 2026-08-28, nyaste 2026-09-17.
  `ci-post-merge`: **207 ärenden totalt**, 0 öppna.
- **Dom: skärpt.** J1b:s "30 av 30" var fönstrets tak, inte sanningens:
  nätet har inte varit grönt en enda natt sedan 2026-07-29. J1b:s 22 mot
  mina 21 öppna är en mätning med några timmars mellanrum (S125 stänger
  larm just nu); S125:s 13 stämmer med ingendera och behandlas som
  felräkning.
- **Varför det väger tungt:** `ADR-077` gör ett postsubmit-nät till själva
  VILLKORET för att den riskanpassade presubmiten ska vara försvarbar
  (`ci.yml:2268-2269` citerar det: *"försvarbar ENDAST med ett post-submit-nät
  under sig"*). Ett nät som är rött varje natt bär ingen signal — en ny, äkta
  regression som bara natten ser skulle drunkna bland stående röda jobb.
  **Öppet till våg 2:** VILKA jobb har hållit nätet rött, natt för natt —
  produktskyddande tester eller processgrindar (sessionsdok-fönster,
  backlog-stängning, obesvarade larm)? J8.6 klassar röda körningar; svaret
  avgör om detta är "nätet är trasigt" eller "nätet bär fel last".

### S8 — "Ingen kommandoväg" för rollback av frontenden (källa: J1e mot J4a)

- **Påstående:** J1e skriver om frontendens rollback: *"ingen kommandoväg"*
  — bara Vercel-dashboardens "promota tidigare deploy" eller en revert-PR —
  och sammanfattar läget som *"noll mekanisk rollback var som helst i
  kedjan"*. J4a pekar samtidigt på Vercels Instant Rollback som direkt
  tillämpbar, eftersom Vercel är vår egen hosting.
- **Prövat med:** sökning i Vercels egen dokumentation (Vercel-MCP:ns
  dokumentationssök, 2026-09-17) på rollback via CLI.
- **Utfall:** kommandovägen FINNS. `vercel rollback [deployment-id eller url]`
  och `vercel rollback status` (`vercel.com/docs/cli/rollback`),
  `vercel promote <deployment-url>`
  (`vercel.com/docs/deployments/promote-preview-to-production`), och ett
  REST/SDK-anrop `projects.requestRollback`. Vercel publicerar dessutom en
  hel incidentsekvens — bekräfta felet i loggarna, rulla tillbaka, verifiera,
  hitta den dåliga deployen, `vercel bisect`
  (`vercel.com/docs/deployments/rollback-production-deployment`).
- **Dom: föll delvis.** "Ingen kommandoväg" är fel och rättas i våg 2. Det
  som STÅR KVAR av J1e:s fynd är det väsentliga: vägen har aldrig körts,
  aldrig dokumenterats i en runbook hos oss (`TASK-199`), och ingen mekanism
  upptäcker att den behövs. **Att pröva i våg 2 innan det blir en
  rekommendation:** Vercels dokumentation om Instant Rollback ska läsas på
  en punkt — om en rollback stänger av den automatiska kopplingen mellan
  `main` och Production tills man aktivt promotar igen. I så fall har
  rollbacken en bieffekt på hela landningsflödet som en runbook måste bära.
  Frontenden är också bara ETT av fyra deployspår: för Edge Functions,
  migrationer och Airtable-schema står J1e:s dom orörd.

### S9 — Airtable-skrivvägen saknar omförsök vid 429 (källa: J5)

- **Påstående:** läsfunktionerna i `supabase/functions/_shared/airtable-client.ts`
  försöker om när Airtable svarar 429 (för många anrop), skrivfunktionerna
  gör det inte.
- **Prövat med:** `grep -n "withAirtable429Retry"` samt en uppräkning av
  exporterade funktioner och `method:`-rader i samma fil (523 rader).
- **Utfall:** omförsöks-omslaget används på rad 121, 196 och 241 — inuti
  `fetchFromAirtable` (rad 77), `fetchAirtablePage` (162) och
  `fetchAirtableRecord` (228). De sex skrivande funktionerna —
  `updateAirtableRecord` (266, `PATCH`), `createAirtableRecord` (308,
  `POST`), `upsertAirtableRecord` (353), `deleteAirtableRecord` (411),
  `createAirtableRecords` (448), `deleteAirtableRecords` (497) — anropar det
  aldrig.
- **Dom: höll.** Nyans att pröva i våg 2 innan det blir en rekommendation:
  finns ett bokfört SKÄL (en `POST` som försöks om kan i princip dubbelskapa
  — men ett 429 betyder att Airtable avvisade anropet obehandlat, så just
  det omförsöket är ofarligt)? J5 fann inget skäl och kallar luckan
  odokumenterad. Basen delar dessutom sitt tak på fem anrop per sekund med
  CI:s staging-svit — en skrivning från Lotta kan alltså falla på grund av
  en testkörning, om staging och prod delar arbetsyta (pröva det också).

### S10 — Kontraktsvakten bevakar 7 av 18 mockade Edge Functions (källa: J5)

- **Påstående:** den hermetiska fixturvärlden mockar 18 Edge Functions, men
  den nattliga kontraktsvakten — mekanismen som ska visa att mockarna
  fortfarande liknar verkligheten — jämför bara 7 av dem mot staging, medan
  dess egen kommentar påstår full täckning.
- **Prövat med:** uppräkning av citerade funktionsnamn i
  `tests/support/fixturvarld/handlers.ts` och av `functions/v1/<namn>` i
  `tests/kontraktsvakt/kontraktsfall.ts`, samt `grep -n -i "sju"` i
  kontraktsvaktens filer.
- **Utfall:** `handlers.ts` namnger 18 funktioner. `kontraktsfall.ts` namnger
  8, varav 7 är fixturhandlers (`get-event`, `get-event-formats`,
  `get-event-notes`, `get-events`, `get-person`, `get-persons`,
  `get-registrations`) och en (`create-event`) hör till felfallen.
  `kontraktsfall.ts:25-26` säger ordagrant: *"ALLA SJU FIXTURHANDLERS
  BEVAKAS. `tests/support/fixturvarld/handlers.ts` registrerar sju
  EF-handlers"*.
- **Dom: höll.** Elva mockar binds av ingenting: `get-activity-log`,
  `get-attendance`, `get-event-attachments`, `get-leads`, `get-mail-log`,
  `get-person-notes`, `get-places`, `get-segments`, `get-waitlist`,
  `hamta-oppna-betalningar` och `log-activity`. Kommentaren var sann när den
  skrevs (`TASK-68`) och har blivit falsk genom tillväxt — samma felklass
  som `ADR-083`, men i en testfil där ingen grind läser prosan. Detta är det
  hittills starkaste belägget för Marcus fråga 8.3: *"Hur vet vi att
  simuleringen fortfarande motsvarar de riktiga tjänsterna?"* — för elva av
  arton: det vet vi inte. Jämför med J7 (som räknar oberoende) i våg 2, och
  pröva om acceptance-testerna dessutom bär egna mockar utöver `handlers.ts`.

## Motsägelser mellan agenter

- **Rollback av frontenden (J1e mot J4a):** se S8 — J4a hade rätt i sak,
  J1e rätt i att rutinen är oprövad hos oss.
- **`TASK-365` och PR #2306 (S125:s uppgift mot J1b):** S125 uppgav att
  `post-merge.yml`:s täckningslucka var "mätt på #2306". J1b prövade:
  `gh pr view 2306` är en orelaterad label-policy-PR; kortet `TASK-365` finns
  och står To Do, men dess mekanismförklaring (en docs-push som avbryter en
  kod-landnings svit via `concurrency`) går inte att återskapa mot dagens
  kod, där gruppen är per commit-SHA. J1b märker luckan **osäker**. J8.4
  räknar oberoende vilka landade träd som aldrig fick en post-merge-körning —
  den mätningen avgör.

## Öppna frågor till våg 2

- Vaktas aggregatorns `needs`-lista av någon paritetsgrind? (S2 b)
- Hur många landade träd fick aldrig en `post-merge`-körning? (S125:s fynd a
  = `TASK-365`; J8.4 räknar, J1b läser `concurrency`-blocket — jämför.)
