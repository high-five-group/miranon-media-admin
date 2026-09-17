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

### S11 — Samma träd testas tre gånger per landning (källa: J8.5, skärpt)

- **Påstående:** J8.5 (Opus) mätte att varje kö-landning ger två
  `ci.yml`-körningar på identisk commit, och att merge-dedupen — byggd för
  att undvika just det — gav noll träffar på 80 körningar.
- **Prövat med:** `git rev-parse 01c33c145` och `gh run list --commit
  01c33c14588adf2c06c2720ca14bead48acfb477`, sedan `gh run view --json jobs`
  på push-körningen `34243465042` och post-merge-körningen `34243464989`.
- **Utfall:** på DEN ENA commiten körde `CI [merge_group]` 15:00:46→15:14:00,
  `CI [push]` 15:14:27→15:26:24 och `Post-merge [push]` 15:14:27→15:34:15 —
  alla gröna. Push-körningen körde om exakt samma jobb som kö-körningen
  (`Pure + Build`, `Webblasarbeteende`, `Acceptance (hermetisk)` 1–3,
  hermetik-självtestet); dedupen slog inte till. Post-merge körde SAMMA
  hermetiska klasser en tredje gång, och därutöver `A11y` och
  `Staging (API + E2E)`.
- **Dom: skärpt.** Det är tre körningar av de hermetiska klasserna på
  identiskt träd, inte två — och med körningen på PR-ytan före kön blir det
  fyra per landad kod-PR. Bara post-merge-körningens a11y- och
  staging-jobb tillför ny information efter kön. `CI [push]`-körningen
  tillför ingenting alls. J8.7 räknar minuterna; jämför i våg 2.

### S12 — Nattnätet är rött av processgrindar, inte av testsviten (källa: J8.5)

- **Påstående:** tre processgrindar (Backlog-stängning, Sessionsdok-fönstret,
  Sannings-avstämning) driver nattnätets rödhet; testsviten var grön
  2026-09-08, 09-10 och 09-16 och gick sönder först 09-17.
- **Prövat med:** `gh run view 35061163532` (natten 09-16) och
  `34935008191` (natten 09-15), filtrerat på röda jobb.
- **Utfall:** båda nätterna var röda på exakt fyra jobb — de tre
  processgrindarna plus `Bredare sårbarhetsgranskning`. Inget testjobb var
  rött. Natten 09-17 (run `35187813487`, mätt vid sessionsstart) tillkom
  `Acceptance (hermetisk) (2)` och `Länkkontroll`.
- **Dom: höll.** Det besvarar den öppna frågan i S7: nätet är inte trasigt,
  det bär FEL LAST. Produktskyddande tester och bokföringsgrindar delar ett
  och samma rött/grönt — så när en äkta testregression väl kom (09-17) föll
  den in i ett larm som varit rött i femtio dygn av andra skäl.

### S13 — Edge Functions-koden kontrolleras inte med Denos verktyg (källa: J1f)

- **Påstående:** 24 av 135 TypeScript-filer under `supabase/functions/`
  typkontrolleras via en Node-baserad genväg (`tsconfig.edge-shared.json`);
  `deno check` och `deno lint` är inte inkopplade någonstans, trots att
  `ADR-010` lovat det. TypeScript är version 7.0.2.
- **Prövat med:** `grep -rn "deno check\|deno lint\|deno task\|setup-deno"`
  över `.github/workflows`, `scripts` och `package.json`;
  `find supabase/functions -name "*.ts" | wc -l`; `npx tsc --version`.
- **Utfall:** noll träffar på Deno-verktygen. 135 `.ts`-filer.
  `Version 7.0.2`. `tsconfig.edge-shared.json` nämner `supabase/functions`
  på 25 rader (förenligt med J1f:s 24 filer plus en kommentarsrad — exakt
  antal ej omräknat av mig).
- **Dom: höll.** Edge Functions är appens ENDA skrivväg mot Airtable och
  Postgres, och körs i en annan runtime (Deno) än den som typkontrollerar
  dem (Node). Jämför med J8.1:s incidentregister: hur många av de fjorton
  produktionsfelen satt i Edge Functions-koden?

### S14 — Repot är PUBLIKT: orkestrerarens egen premiss föll (källa: J8.7)

- **Påstående:** J8.7 rapporterade att repot är publikt, inte privat, och
  att GitHub därför aldrig fakturerar Actions-minuter — 76 080 minuter i
  augusti 2026 till nettokostnad noll.
- **Vad som föll:** ORKESTRERARENS uppdragstexter till J8.7 och J4a angav
  "repot är PRIVAT" under rubriken källmärkta fakta. Det var aldrig mätt —
  ett antagande som fick fel etikett. Exakt den felklass `ADR-086` finns
  för, och mottagaren fångade den.
- **Prövat med:** `gh repo view high-five-group/miranon-media-admin --json
  visibility,isPrivate` och `gh api orgs/high-five-group`, 2026-09-17.
- **Utfall:** `visibility: PUBLIC`, `isPrivate: false`, skapat 2026-04-13.
  Organisationen: plan `enterprise`, ett publikt repo (detta), tre privata.
- **Dom: J8.7 höll, orkestreraren föll.** Följder: (1) J4a:s skalbeskrivning
  ("privat repo") är fel i en detalj som påverkar kostnadsdimensionen —
  rättas i jämförelsen i våg 2; (2) hela kostnadsfrågan i 8.7 byter
  karaktär: minuterna är gratis, så priset för onödiga körningar är
  VÄNTETID och kö-trängsel, inte pengar; (3) att pröva i våg 2: J8.7 uppger
  att Enterprise-planen (~21 USD/månad) köptes för merge-kön — men GitHubs
  dokumentation anger att merge-kö finns för publika repon i organisationer
  oavsett plan. Stämmer det betalar planen för något repot inte behöver.
  Belägg mot `docs.github.com` innan det blir en rekommendation.
- **Utanför granskningens fråga, registrerat (ADR-053: blockerar ej, högt
  värde → flaggas för Marcus, utreds inte här):** ett publikt repo gör
  ALLT incheckat läsbart för vem som helst — sessionsdok, backlog-kort,
  runbooks med bas-ID:n och projektreferenser. Mätt 2026-09-17: de sex
  spårade `.env`-filerna bär bara `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY` och en funktionsflagga (publika per design — de
  ligger i webbläsarbundeln), alltså inga serverhemligheter. Men 86 spårade
  filer nämner förnamnet på den deltagare som prod-incidenten 2026-09-03 är
  uppkallad efter, och spårade dokument bär bland annat 37 adresser på
  `gmail.com` — om de är verkliga personers eller testadresser är INTE
  utrett. Granskningens egna leverabler skriver därför "prod-incidenten
  2026-09-03 (S115)" utan namn.

## Motsägelser mellan agenter

- **`TASK-365`, täckningsluckan efter merge (J1b mot J8.5):** J1b märker
  kortets mekanism **osäker** — `post-merge.yml`:s `concurrency`-grupp är
  per commit-SHA, så en docs-push kan inte avbryta en kod-landnings svit.
  J8.5 kallar luckan *"öppen och bekräftad: en kod-landning följd av en
  docs-push inom ~15 min får aldrig någon efterkontroll"* och pekar på
  kortets rättelsenot om larmkedjan. De kan båda ha rätt om MEKANISMEN är en
  annan än avbrytning (t.ex. den ärvda klassningen i post-merge:s första
  jobb, "körde PR-grinden sviten?"). J8.4 räknar landade träd utan
  post-merge-körning — den mätningen avgör, och korsgranskningen i våg 2
  läser `classify-post-merge.sh`.
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
