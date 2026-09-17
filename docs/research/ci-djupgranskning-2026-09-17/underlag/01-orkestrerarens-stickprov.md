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

### S15 — En av nattnätets tre röda processgrindar är redan dömd att rivas (källa: ändringsloggen)

- **Påstående:** `ADR-131` (work item-substratet flyttar till GitHub Issues)
  är Accepted sedan 2026-09-04 men inte verkställd; den river bland annat
  `check-backlog-closure.sh`, som fortfarande ligger kvar på disk.
- **Prövat med:** `grep` på status- och `## Updates`-raderna i
  `docs/decisions/ADR-131-work-item-substratet-github-issues.md` samt på
  ordet "riv"; `ls -la scripts/check-backlog-closure.sh
  .backlog-closure-policy.conf`.
- **Utfall:** rad 3: *"Status: Accepted (grillad samsyn S118 Del 2,
  2026-09-04, nio beslut kvitterade…)"*. Rad 295–297: `## Updates` — *"Inga
  än."* Rad 170–172, beslut 7 "Rivning i två steg", namnger
  `check-backlog-closure.sh`. Skriptet finns kvar: 61 558 byte, med en
  policy-fil på 14 615 byte.
- **Dom: höll.** Satt bredvid S12 ger det en skarp bild: grinden
  "Backlog-stängning" har hållit nattnätet rött i veckor, S125 lägger i dag
  två PR:er (`#2492`, `#2494`) på att städa dess 30 inkonsistenta kort — och
  ett taget beslut säger att hela grinden ska bort. Ett Accepted-beslut utan
  brytdag är en stående kostnad: maskineriet underhålls tills någon river
  det. Bärs till åtgärdsplanen som en sekvensfråga åt Marcus (verkställ
  `ADR-131`:s brytdag, eller lyft grinden ur nattnätets rött/grönt under
  tiden) — inte som ett fel.

### S16 — Testpyramiden i tal, och mailflödet utan verklighetstest (källa: J7)

- **Påståenden:** den hermetiska acceptance-klassen har vuxit från 18 till
  61 filer medan styrande text fortfarande säger 18; `tests/e2e` bär 34
  filer; åtgärdsutskicken (`send-action-email` — bekräftelse, påminnelse,
  eventinfo, testmail) har inget test genom den verkliga kedjan på någon
  nivå. Sidopåstående: `supabase/functions/` "växte från 51 till 63 poster
  under dagen" i den delade worktreen.
- **Prövat med:** `find tests/acceptance -name "*.test.ts" | wc -l`, samma
  för `tests/e2e`; `grep -n "18 spec"` i `CONTRIBUTING.md`,
  `scripts/acceptance-urval.sh` och `ADR-080`; `grep -rl
  "send-action-email" tests`; läsning av huvudet i
  `tests/api/send-action-email.test.ts` och av `api-pure`/`api-staging` i
  `playwright.config.ts:489-505`; `git status --short` och
  `git ls-tree HEAD supabase/functions/`.
- **Utfall:** 61 acceptance-filer och 34 e2e-filer — stämmer. "18
  spec-filer" står kvar på `CONTRIBUTING.md:1074` och
  `scripts/acceptance-urval.sh:12` (ingen träff på exakt den frasen i
  `ADR-080`). `tests/api/send-action-email.test.ts` (1 275 rader) hör till
  `api-pure` och säger i sitt eget huvud: *"ingen staging, inga creds, NOLL
  riktig Resend/Airtable"*, samt att HTTP-auth och *"RIKTIG
  Airtable-skrivning mot staging"* INTE testas där — *"bokfört öppet"*.
  Ingen `*.staging.test.ts` för funktionen finns under `tests/api`.
  Worktreen: inget utanför granskningskatalogen är rört, och
  `supabase/functions/` bär 63 poster både på disk och i commiten.
- **Dom: huvudpåståendena höll; sidopåståendet föll.** Katalogen har inte
  vuxit under dagen — J7:s "51" var en felräkning, och förklaringen "snabbt
  rörlig worktree" stryks i våg 2. På e2e-nivån har jag INTE omprövat J7:s
  läsning att ingen fil når Resend (staging bär ett maillås, så ett skarpt
  utskick är spärrat med avsikt) — märkningen där förblir J7:s.
- **Varför det väger:** utskick till verkliga deltagare är appens mest
  följdtunga handling — ett fel där går inte att ta tillbaka. Det är den
  tydligaste kandidaten till Marcus lista över "5–15 mycket viktiga
  realistiska E2E-flöden", och den finns inte. J7 räknar dagens genuint
  realistiska flöden till två filer.
- **Processfynd om granskningen själv:** J7 spawnade tre egna forkar, och
  två av dem skrev till samma målfil trots instruktion om motsatsen. Det
  förklarar taket på 20 samtidiga subagenter (nästlade spawns räknas) och
  betyder att leverabel 8 är en sammanfogning av tre pass — den läses i sin
  helhet för koherens i våg 2.

### S17 — "Obetald skuld" som redan är betald: grenstädningen (källa: J2, skärpt)

- **Påstående:** `CLAUDE.md` § Kortnummer säger (källa `TASK-310`,
  2026-08-24) att ett återkommande lokalt gren-svep är *"flaggat men INTE
  byggt"*. J2 fann att `scripts/stada-grenar.sh` finns sedan 2026-08-07 och
  körs automatiskt av heartbeat-svepet — och daterade automatiken till *"tre
  veckor innan påståendet skrevs"*.
- **Prövat med:** `ls -la scripts/stada-grenar.sh .stada-grenar-policy.conf`;
  `git log -S"stada-grenar" -- scripts/heartbeat-svep.sh`; `grep -n
  "stada-grenar\|STADA_GRENAR" scripts/heartbeat-svep.sh`.
- **Utfall:** skriptet (15 215 byte) och policy-filen finns. Intrådningen i
  svepet är commit `b9dac6a0`, **2026-08-28** (`TASK-323`, *"gles
  gren-städning som svepets femte väg"*), följd av `696c62a2` samma dag.
  Svepet anropar `stada-grenar.sh --utfor` (rad 106–107, 436–472), aldrig
  med `-D`.
- **Dom: skärpt.** I sak har J2 rätt — `CLAUDE.md` är i dag fel, mekanismen
  finns och kör. Men tidslinjen är en annan än J2 skrev: det MANUELLA
  verktyget fanns sexton dagar före noteringen, AUTOMATIKEN kom fyra dagar
  EFTER den. Prosan var alltså sann när den skrevs och blev falsk av en
  senare landning som inte rörde den. Rättas i leverabel 5 i våg 2.
  Observera också gränsen: svepet går bara medan en sessions
  heartbeat-monitor kör — under en vecka utan sessioner städas ingenting
  (S125 mätte 57 lokala grenar vid sin start i dag).
- **Mönstret är granskningens tydligaste hittills:** S4 (hook som prosan
  säger saknas), S10 ("alla sju bevakas" när arton finns), S16 ("18
  spec-filer" när 61 finns) och denna post är SAMMA felklass — styrande text
  som var sann och blev falsk genom tillväxt, åt båda håll (för optimistisk
  och för pessimistisk). `ADR-083` vaktar prosa som påstår en mekanism;
  ingenting vaktar prosa som bär ett TAL eller påstår en FRÅNVARO.

### S18 — Grönt efter merge trots att sviten aldrig kördes: täckningsluckan, mätt och förklarad (källa: J8.4, J8.5, J1b)

- **Påståenden:** J8.4 mätte att 31 av 230 landade träd (13,5 %) aldrig fick
  en post-merge-körning men kunde inte fastställa mekanismen. J8.5 kallade
  luckan bekräftad (`TASK-365`). J1b kallade kortets mekanismförklaring
  osäker, eftersom `post-merge.yml`:s `concurrency`-grupp är per commit-SHA
  och ingenting därför kan avbrytas.
- **Prövat med:** `git log origin/main --first-parent --since=2026-08-20`
  (686 landningar) mot `gh run list --workflow post-merge.yml --limit 1000`
  (alla utfall, tillbaka till 2026-08-10), jämförda på commit-SHA i ett
  engångsskript; därefter `gh run view --json jobs` på två efterföljande
  körningar (`34045141857`, `34146020300`) och `gh run list --commit` på två
  av de saknade kod-commitsen (`7395124e` = PR #2408, `51144a3c` = PR #2442).
- **Utfall, i fyra steg:**
  1. **85 av 686 landningar (12,4 %) saknar post-merge-körning** — förenligt
     med J8.4:s 13,5 % på ett annat fönster.
  2. **Alla 85 följdes av en ny landning inom 15 minuter** (6 inom 5 s, 24
     inom en minut, 55 inom 1–15 min, ingen längre). 14 av de saknade är
     själva docs-/backlog-PR:er; **55 är kod-PR:er vars NÄSTA landning är en
     docs-/backlog-PR**; 16 är kod-PR:er följda av kod.
  3. De två saknade kod-commitsen har **en enda körning var: `CI
     [merge_group]`**. Ingen `CI [push]`, ingen `Post-merge`, ingen CodeQL —
     alltså ingen push-händelse alls för den SHA:n. (Jämför S11, där en
     ensam landning fick alla fyra.)
  4. Den efterföljande docs-landningens post-merge-körning är **grön med
     `Verifierande svit på det mergade trädet: skipped`** — i båda stickproven.
- **Dom: luckan höll, och mekanismen är nu fastställd — ingen av agenterna
  hade den.** Merge-kön landar flera köade PR:er i EN push till `main`; bara
  toppens commit får en push-händelse, och `post-merge.yml` klassar bara
  toppen ("Ärvd klassning — körde PR-grinden sviten?"). Är toppen en
  docs-PR hoppas sviten, körningen blir grön, och kod-PR:en under den får
  aldrig den kontroll som BARA finns efter merge: staging-sviten och a11y
  (S1). J1b hade rätt i att ingenting avbryts; J8.5 hade rätt i att luckan
  är verklig. `TASK-365` beskriver symptomet men inte orsaken.
- **Hur allvarligt:** de hermetiska klasserna KÖRDE på kod-PR:en (kö-ytan) —
  det som uteblev är det post-merge ensamt tillför. Men det är just den
  kontrollen `ADR-077` gör till villkoret för att presubmiten ska vara
  försvarbar, och det enda återstående nätet (natten) har varit rött i
  femtio dygn (S7, S12). För 55 kod-landningar på fyra veckor har alltså
  ingen verklig kedja prövats med ett läsbart utfall. Det är uppdragets
  farligaste felklass — *"ett grönt resultat trots att ett relevant test
  aldrig kördes"* — inte före merge, där J8.5 letade och inget fann, utan
  efter.
- **Riktning för åtgärdsplanen (liten, reversibel, ej beslutad):** låt
  post-merge klassa HELA det pushade spannet (`github.event.before` →
  `github.sha`) i stället för bara toppen — kör sviten om NÅGON landning i
  spannet är kodklassad. Korsgranskningen i våg 2 läser
  `scripts/classify-post-merge.sh` och prövar om det räcker. Klassningen
  ovan (docs/kod) bygger på grenprefix och är en approximation.

## Motsägelser mellan agenter

- **Antalet filer i `scripts/` (orkestreraren mot J1c och J8.8):**
  orkestrerarens "172 filer" var `ls scripts | wc -l` — 171 filer plus
  katalogen `lib` på toppnivå. J1c och J8.8 räknar oberoende 186 filer
  rekursivt (104 `.sh`, 79 `.mjs`, 3 övriga). Agenterna har rätt; 186 gäller.
- **`TASK-365`, täckningsluckan efter merge (J1b mot J8.5):** AVGJORD i S18.
  Ursprunglig bokföring: J1b märker
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
