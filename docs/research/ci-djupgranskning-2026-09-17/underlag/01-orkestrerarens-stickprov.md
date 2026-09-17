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
- **PRECISERAD I S20 OCH S30:** gäller en ENSAM landning. Vid en grupplandning
  är `CI [push]` den körning som klassar hela spannet; och dedupen träffar
  när trädet är oförändrat (32 av 32 sådana fall).
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
- **RÄTTAD I S30:** de två nätterna stämmer, generaliseringen gör det inte —
  ett produktskyddande jobb var rött 25 av 52 nätter. Läs S30 före domen nedan.
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
- **RÄTTAD I S30:** mekanismen håller, men den var redan diagnostiserad i
  tråden `T166` (2026-08-21); hålen är 60, inte 85; och det som uteblev är
  staging, a11y och städningen — de hermetiska klasserna kördes av
  `CI [push]`. Läs S30 före domen nedan.
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

### S19 — Nattlarmet saknar spärr mot dubbletter; de två andra kanalerna har en (källa: D3, arkitekturkartan)

- **Påstående:** kartans § 4 säger att `nightly.yml`:s larmjobb skapar ett
  NYTT ärende varje röd natt, medan länkkanalen (`links-arende`) och
  `post-merge.yml` först letar efter ett befintligt ärende och kommenterar det
  i stället ("dedup" — spärr mot dubbletter).
- **Prövat med:** `grep -n "gh issue list\|gh issue create\|gh issue comment"`
  i `.github/workflows/nightly.yml` och `.github/workflows/post-merge.yml`,
  2026-09-17 ~11:10Z.
- **Utfall:** `nightly.yml:225` letar befintligt `lankrota`-ärende och
  kommenterar (`:250`) eller skapar (`:258`). `nightly.yml:863` — larmjobbet —
  är ett rakt `gh issue create` utan någon föregående sökning.
  `post-merge.yml:479` letar befintligt `ci-post-merge`-ärende, kommenterar
  (`:543`, loggraden säger *"samma träd … — dedup"*) eller skapar (`:547`).
- **Dom: höll.** Det förklarar S7:s tal mekaniskt: 21 öppna `ci-natt`-ärenden
  är inte 21 olika fel utan ett och samma röda tillstånd, rapporterat en gång
  per natt. Spärren fanns alltså som mönster i samma fil (rad 225) men byggdes
  aldrig in i huvudlarmet. Liten, reversibel åtgärdskandidat — bärs till
  åtgärdsplanen.
- **Vad kartan INTE får stå oemotsagd på:** dess diagram (§ 1) och
  körytematris (§ 3) anger merge-dedupens träffkvot till *"~30 %"*. Det talet
  är J8.5:s TEORETISKA träffbarhet ur git-historiken (568 av 1 887
  merge-commits trädlika), inte en observerad kvot — J8.5 observerade noll
  träffar, medan J8.7 rapporterar att `metrics:ci` visar 25 av 25. Se
  motsägelsen nedan; kartan rättas när den är avgjord.

### S20 — Merge-dedupen träffar, men bara var sjätte kod-landning (källa: J8.5 mot J8.7; avgör motsägelsen)

- **Påståenden:** J8.5 fann *"noll dedup-träffar"* och kallar mekanismen *"i
  praktiken utan verkan"*. J8.7 skriver *"Dedupen fungerar, med ett
  undantag"* och citerar `metrics:ci`: 25 av 25 träffar. ("Dedup" är här
  steget i `ci.yml` som, när en ändring just landat i `main`, frågar om
  exakt samma filträd redan testats grönt — och i så fall hoppar över den
  tunga testsviten.)
- **Prövat med:** `gh run list --workflow ci.yml --event push --branch main
  --limit 40` (körningarnas längd i sekunder), sedan `gh api
  …/actions/runs/<id>/jobs` och `gh run view <id> --log --job <id>` på
  klassningsjobbet "Detect changed files" i de fyra KORTA körningar vars
  gren hade kodnamn. 2026-09-17, mellan 11:05Z och 11:17Z (klockan avläst
  före och efter — gäller även S21–S27 nedan).
- **Utfall:** tre verkliga träffar, med loggraden ordagrant *"✅ Dedup-TRÄFF:
  träd == … och den SHA:n har grön CI-run → tunga jobb hoppas"*:
  run `34184098307` (PR #2458), `34179882751` (PR #2455) och `34051468698`
  (PR #2403) — alla med `Test suite: skipped`. Den fjärde korta,
  `34144253948` (PR #2444), var ingen träff utan en REDUCERAD svit
  (acceptance-urvalet: en skärva i stället för tre). Av fönstrets 40 körningar var 19
  docs-grenar (korta, sviten hoppas av klassningen oavsett dedup), en
  pågående, och **20 kod-landningar: 3 dedup-träffar, 1 reducerad svit, 16
  som körde hela sviten en gång till** (590–806 s).
- **Dom: J8.5 föll, J8.7 skärpt, orkestrerarens egen sammanfattning föll.**
  Dedupen är inte död — men den träffar 3 av 20 kod-landningar (15 %) i
  detta fönster. `metrics:ci`:s "25 av 25" kan alltså inte betyda "varje
  landning dedupliceras"; vad verktyget räknar är inte utrett här.
  Sessionsdokets Del 3 skrev *"merge-dedupen träffar aldrig"* — det var S11:s
  ENA commit generaliserad, och rättas i Del 5. Docs-/kod-indelningen bygger
  på grenprefix (approximation); de fyra kodnamngivna korta körningarna är
  däremot lästa ur logg.
- **Varför den missar:** steget jämför det landade trädet med PR-GRENENS
  huvud. De är lika bara när `main` stått still sedan grenen senast
  uppdaterades; i en aktiv kö har `main` nästan alltid rört sig. Men kön har
  redan testat EXAKT det landade trädet — S11 visade att `CI [merge_group]`
  och `CI [push]` går på samma commit-SHA. En enklare fråga (*"har denna SHA
  redan en grön `ci.yml`-körning?"*) skulle träffa nästan alltid. Det är
  J8.5:s R3 "byt fråga", och den står sig; "riv dedupen" gör det inte.
  Åtgärdskandidat, ej beslutad — KG1 prövar säkerheten i den enklare frågan.
- **Följd för kartan (D3):** "~30 % träff" i `02-…` § 1 och § 3 är J8.5:s
  teoretiska tak ur git-historiken, inte en mätning. Ersätts i putsen med
  det mätta: 3 av 20 kod-landningar.

### S21 — Merge-kön kräver inte Enterprise-planen för ett publikt repo (källa: KG2 A1, besvarar S14:s öppna fråga)

- **Påstående:** GitHub erbjuder merge-kö i varje publikt repo som ägs av en
  organisation, oavsett plan; Enterprise krävs bara för PRIVATA repon.
- **Prövat med:** `gh api
  repos/github/docs/contents/data/reusables/gated-features/merge-queue.md`
  med `Accept: application/vnd.github.raw` — alltså källfilen som
  `docs.github.com` byggs av. 2026-09-17.
- **Utfall, ordagrant:** *"Pull request merge queues are available in any
  public repository owned by an organization, or in private repositories
  owned by organizations using GitHub Enterprise Cloud."*
- **Dom: höll.** Planen betalar inte för DETTA repos kö. D10 tillför
  oberoende att organisationens tre privata repon och org-rulesets är vad
  planen i så fall köper — och att org-rulesets är oanvända. Om planen ska
  behållas är Marcus beslut (kostnaden är liten); granskningen levererar bara
  faktumet. KG2 pekar på en möjlig verklig Enterprise-fördel —
  samtidighetstaket för jobb — som ingen mätning i granskningen isolerat.

### S22 — En rollback hos Vercel stänger av automatisk produktion tills någon aktivt slår på den igen (källa: KG2 A2, besvarar S8:s öppna fråga)

- **Påstående:** efter `vercel rollback` tilldelas nya landningar i `main`
  inte längre produktionsdomänen automatiskt.
- **Prövat med:** hämtning av `https://vercel.com/docs/instant-rollback`
  (sidan daterad 2026-07-07), 2026-09-17.
- **Utfall, ordagrant:** *"After a rollback, Vercel turns off auto-assignment
  of production domains. This means new pushes to your production branch
  won't replace the rolled-back deployment."* Vägen tillbaka: knappen "Undo
  Rollback" eller `vercel promote [deployment-id or url]`, som *"restores
  auto-assignment of production domains"*.
- **Dom: höll.** Satt bredvid S6 är detta en skarp fälla: ingenting hos oss
  upptäcker en produktion som står still (`TASK-199`). Efter en rollback
  skulle `main` fortsätta landa gröna ändringar medan användarna tyst står
  kvar på den gamla versionen — tills en människa märker det. En runbook för
  rollback MÅSTE därför bära steget "promota igen", och `TASK-199`:s vakt
  blir viktigare, inte mindre viktig, av att rollback-vägen finns.

### S23 — Fyra Actions-referenser saknar SHA-pin, alla i det sist tillagda jobbet (källa: D10, skärpt)

- **Påstående:** 4 av 64 `uses:`-referenser saknar SHA-pin, samtliga i
  `ci-suite.yml` rad 903, 945, 950 och 963; D10 kallar det *"SHA-pinningen
  har redan läckt"*. (En "SHA-pin" låser en extern byggsten till en exakt
  version som inte kan bytas ut i efterhand; en tagg som `@v7` kan flyttas
  av den som äger byggstenen.)
- **Prövat med:** `grep -n "uses:" .github/workflows/ci-suite.yml` filtrerat
  på rader utan 40 hexadecimala tecken; `grep -n "actions/checkout@"` i
  samma fil; `grep -rn -i "sha-pin"` i `docs/decisions/`.
- **Utfall:** exakt de fyra raderna: `actions/upload-artifact@v7` (903),
  `actions/checkout@v7` (945), `actions/setup-node@v7.0.0` (950),
  `actions/download-artifact@v8` (963). Filens sju ÖVRIGA
  `actions/checkout`-referenser är SHA-pinnade (`@3d3c42e5…  # v7.0.1`).
  `ADR-029` rad 55 kräver SHA-pin *"på alla non-GitHub-officiella Actions"*.
- **Dom: skärpt.** Alla fyra är GitHubs egna Actions, så `ADR-029` är inte
  bruten — "läckt" är för starkt. Men filen följer i övrigt en strängare
  praxis än policyn kräver, och det sist tillagda jobbet bröt den utan att
  något märkte det: ingen grind vaktar formen. Liten städåtgärd, inte ett
  säkerhetshål.

### S24 — Tre snabba kontroller av våg 2 (källa: D5, KG3, D3)

- **D5, force-push:** leverabel 5 rättar *"force-push är strukturellt
  ovanligt"* till 5 av 22 PR:er, med `#2416` på tre händelser. Prövat med
  `gh api …/issues/2416/timeline --paginate` filtrerat på
  `head_ref_force_pushed`: **3**. **Höll.**
- **KG3, paritetsgrinden känner a11y-jobbet:** `.ci-parity-policy.json:43`
  bär posten ordagrant, och rad 69–71 vaktar att `run_a11y` förblir ett
  villkorslöst `false`. **Höll** — J1c:s sammanfattning ("7 jobb") var ett
  räknefel, inget hål; D10 kom oberoende till samma rättelse (filen har 8
  jobb, policyn listar 8).
- **Bakgrundssignaler överlever en kompaktering (granskningens egen drift):**
  sessionen kompakterades kontrollerat ~11:05Z; agenternas
  fullbordans-notifikationer (D3, KG3, KG2, D5, D10) kom alla fram därefter.
  En instans åt `TASK-160.6`:s öppna mätpunkt — inte ett bevis för alla lägen.

### S25 — Jobbet som bestämmer hela väntetiden kör odelat — känt, kortat, ogjort (källa: D9, skärpt)

- **Påstående:** D9 (Opus) mätte att jobbet "Acceptance — tvåsidigt bevis
  (hermetik-självtest)" står för 12,8–13,7 av körningens 13,6–14,0 minuter
  (3 av 3 körningar), och att det är dyrt *"av misstag"*: det kör 524 tester
  i EN följd, medan klassen det speglar kör samma 524 uppdelade på tre
  parallella jobb ("skärvor", 4,2–6,0 min) sedan 2026-09-02. (Självtestet är
  vakten som bevisar att varje hermetiskt test verkligen hänger på sin
  låtsasvärld — det kör testerna en gång till UTAN den och kräver att de då
  faller.)
- **Prövat med:** `grep -n "shard\|strategy:\|matrix:"` i
  `.github/workflows/ci-suite.yml`; läsning av rad 516–593; `grep -l -i
  sjalvtest backlog/tasks/*.md`; `npm run bl -- task 366 --plain`.
- **Utfall:** `acceptance` har `strategy.matrix.shard` = `[1,2,3]` på full
  klass (rad 366–372, `--shard=I/N` rad 437). `acceptance-sjalvtest` (rad
  516–593) har ingen `strategy` alls och anropar `npm run
  test:acceptance:sjalvtest` rakt av (rad 567–577). Jobbets eget
  kommentarsblock (rad 526–535) bokför att taket HÖJDES 12→20 minuter
  2026-09-03 efter fyra avbrott samma dag, och pekar på ett uppföljningskort
  med *"per-fil-mätning + delningsförslag"*. Kortet är `TASK-366`: status To
  Do, prioritet High, skapat 2026-09-02, titeln säger *"45 sekunder från
  12-min-taket — samma organiska tillväxt som TASK-239, samma fällning
  väntar"*.
- **Dom: skärpt.** Mätningen och mekanismen håller; "av misstag" gör det
  inte. Problemet var känt dagen det uppstod, fick ett högprioriterat kort —
  och sedan höjdes taket i stället för att orsaken åtgärdades. Femton dagar
  senare bestämmer jobbet ensamt hur länge VARJE kod-landning väntar, på två
  ytor i följd (PR och kö). D9:s förbehåll står kvar: domslogiken avvisar en
  tom testmängd, så en delning kräver att skärvornas domar slås ihop — en
  designfråga, inte en flagga.
- **Varför det väger:** detta är granskningens största enskilda ledtidsspak,
  och den kräver inget borttaget skydd. Det är också en ren instans av
  mönstret i S15: ett beslut eller kort som står öppet blir en stående
  kostnad. Marcus upplevelse — *"det enda jag ser och märker av är ju väntan"*
  — har alltså en namngiven, redan kortad huvudorsak.

### S26 — Event i januari 2027 går inte att skapa i dag, och ingen kontroll ser det (källa: D9 risk P1, J8.1 incident 4)

- **Påstående:** Airtable-basens fält "Månad/år" är en fast lista som tar
  slut vid december 2026; serverfunktionen `create-event` svarar med ett
  tekniskt fel för ett startdatum bortom listan; känt sedan 2026-07-24, olöst.
- **Prövat med:** `grep -n "Månad/år"` i `docs/reference/data-model.md`;
  läsning av `supabase/functions/create-event/index.ts:222-239`; och ETT
  läsande schemaanrop mot PRODUKTIONSBASEN via claude.ai-connectorn
  (`get_table_schema`, tabell `tblVE3UKWl1CKrphV`, fält
  `fld2BjFdBd964TzVb`), 2026-09-17 före 11:17Z. Inga poster lästa, ingenting
  skrivet.
- **Utfall:** `create-event/index.ts:233-235` säger ordagrant: *"Basens
  options-lista är ändlig (Nov 2025 – Dec 2026); ett datum utanför den FELAR
  (typecast:false → 500) i stället för att tyst skapa en option — medvetet,
  §Kända fällor 36 + 45."* `data-model.md:2317` (fälla 45) är märkt
  live-bekräftad 2026-07-24. **Prod i dag: fjorton val, "November 2025" till
  "December 2026" — listan är oförändrad.**
- **Dom: höll, och skärps på en punkt.** D9 skriver *"om drygt tre månader"*
  — men felet utlöses av eventets STARTDATUM, inte av dagens datum. Det biter
  alltså första gången någon planerar ett event i januari 2027, vilket kan
  vara i morgon. Att funktionen FELAR i stället för att tyst skapa ett listval
  är ett medvetet och rimligt val (fälla 36); det som saknas är att någon
  fyller på listan, och att något varnar innan den tar slut.
- **Varför det hör hemma i en CI-granskning:** det är den renaste instansen
  av uppdragets fråga 1 vänd bakåt — *ett känt, daterat produktionsfel som
  INGET av de cirka 35 jobben skyddar mot*, medan tre processgrindar håller
  nattnätet rött över bokföring. Åtgärden är inte CI alls: tolv nya listval i
  basen (en minuts arbete för den som äger basen), eller fälla 36:s riktiga
  lösning (härled fältet med en formel). Flaggas för Marcus som "nu"; rörs
  inte av denna session — skrivning i produktionsbasen är hans beslut.

### S27 — "Omkring 2 500 PR:er" är ett nummer, inte ett antal (källa: J8.8, D9 och orkestreraren mot KG3)

- **Påstående:** J8.8, D9 och orkestrerarens egna texter skriver *"~2 500
  PR:er på fyra månader"*. KG3 mätte 2 214 (alla tillstånd) och avrådde från
  det högre talet som *"ospårat"*. Ändringsloggen (`03-…` rad 43) räknar
  *"506 av 2 251 landade PR:er"*.
- **Prövat med:** en GraphQL-fråga mot GitHub (`pullRequests.totalCount` per
  tillstånd samt `issues.totalCount`), 2026-09-17 före 11:17Z; läsning av
  ändringsloggens metodavsnitt (rad 112–119).
- **Utfall:** **2 216 PR:er** — 2 118 mergade, 16 öppna, 82 stängda utan
  merge — och **284 ärenden**. Summan är exakt 2 500: PR:er och ärenden delar
  nummerserie på GitHub, så det högsta PR-NUMRET (omkring 2 498) lästes som
  ett antal. Ändringsloggens 2 251 är något tredje: landningar på `main`s
  förstaförälderkedja, där ungefär 130 är direktcommits från tiden före
  PR-flödet (`ADR-076`).
- **Dom: KG3 höll; J8.8, D9 och orkestreraren föll.** Rätt tal är **omkring
  2 200 PR:er, varav omkring 2 100 landade**. Slutsatserna som vilar på talet
  står sig — arbetsformens skala ändras med tolv procent, inte i sin art —
  och ändringsloggens kvot (22,5 %) rör sig inte märkbart. Men av de 284
  ärendena är 270 maskinskapade larm (207 `ci-post-merge` + 63 `ci-natt`,
  S7): var nionde nummer i repots serie är alltså ett larm som CI själv
  skrev. Rättas i leverablerna i putsen; underlagen från våg 1 lämnas som de
  skrevs, med denna post som gällande version.

### S28 — Review-grinden i tal: nio eskaleringar om dagen, rundtaket passerat 37 gånger, träffsäkerheten omätt (källa: D6)

- **Påstående:** D6 (Opus) räknade själv på
  `docs/reference/review-instrumentering.jsonl`: 262 rader; 42 % av rundorna
  eskalerar till Marcus (omkring nio per dag); 43 är hög risk; 37 är runda 3
  eller högre mot ett deklarerat tak på 2; noll kalibreringsposter.
  (Review-grinden är den AI-granskare som läser varje kod-PR i färsk kontext
  före landning; "kalibrering" är bokföringen av fel som grinden MISSADE och
  Marcus senare hittade — det enda sättet att veta hur träffsäker den är.)
- **Prövat med:** `wc -l` och fyra `jq`-uppräkningar över filen (fälten
  `typ`, `runda`, `beslut`, `risk.niva`, `tidsstampel`), 2026-09-17 före
  11:25Z. Filen är läst, inte rörd.
- **Utfall:** 262 rader, SAMTLIGA av typen `korning` — ingen enda
  `kalibrering`. Rundor: 140 / 85 / 25 / 9 / 3 för runda 1–5, alltså **37 på
  runda 3–5**. Beslut: 130 konvergerade, 22 ny runda, och **110
  eskaleringar** (55 fråga till Marcus, 43 hög risk, 12 tak nått) = 42 %.
  Risk: 162 låg, 57 medel, 43 hög. Fönster: 2026-08-28 → 2026-09-08, tolv
  dagar ⇒ drygt nio eskaleringar per dag.
- **Dom: höll, på varje tal.** Tre saker följer. (1) `CLAUDE.md` säger öppet
  att rundtaket är *"ett åtagande du håller, inte ett lås som håller dig"* —
  loggen visar vad det betyder i praktiken: taket passeras i var sjunde
  körning. (2) Nio eskaleringar om dagen är en mätbar del av det Marcus
  beskriver som *"fel som uppkommer och som måste få en resurs"* — grinden
  ersätter en mänsklig granskare men skickar ändå fyra av tio ärenden till
  människan. (3) Utan en enda kalibreringspost är grindens MISSAR omätta:
  verktyget finns (`npm run review:kalibrering`), och J8.1 räknar sju
  produktionsfel som Marcus hittade själv — inget av dem är bokfört mot
  grinden. Om fyra av tio eskaleringar är rätt nivå eller överförsiktighet
  går därför inte att säga i dag. Åtgärdskandidat: bokför de kända missarna
  retroaktivt, så blir nästa granskning av grinden en mätning i stället för
  en bedömning.

### S29 — Branschjämförelsens bärande citat finns i källorna; inventeringen är mekaniskt hel (källa: D6, D2)

- **D6:s externa citat.** Svaret på Marcus kärnfråga (leverabel 6 § 14) vilar
  på ordagranna citat ur förstapartskällor — den klass av påstående där en
  agent lättast hittar på. Prövat 2026-09-17 genom att hämta sidorna:
  - `anthropic.com/engineering/building-c-compiler`: *"So it's important that
    the task verifier is nearly perfect, otherwise Claude will solve the wrong
    problem."* och *"For autonomous systems, it is easy to see tests pass and
    assume the job is done, when this is rarely the case."* — båda finns;
    artikeln anger 16 agenter.
  - `github.blog/…/agent-pull-requests-are-everywhere-heres-how-to-review-them/`
    (2026-05-07): *"Any CI weakening is a hard stop."* finns, som första punkt
    under "Three takeaways"; *"More than one in five code reviews on GitHub now
    involve an agent."* finns.
  - `dora.dev/guides/dora-metrics/`: *"DORA's research has repeatedly
    demonstrated that speed and stability are not tradeoffs. In fact, we see
    that the metrics are correlated for most teams."* — finns.
  - **Dom: höll.** En nyans att bära till åtgärdsplanen: GitHubs regel gäller
    en AGENT-PR som försvagar CI. Flera av granskningens egna förslag (ta bort
    körningen vid landning, villkora beroendegranskningen) är till FORMEN
    just det. Skillnaden ligger i vem som beslutar: varje sådan åtgärd måste
    visa att skyddet består och bära Marcus uttryckliga GO — aldrig landas av
    en agent på eget bevåg. Metas RADAR-artikel (arXiv 2605.30208) har jag
    INTE hämtat; D6 läste abstraktet, J4a hela texten.
- **D2:s inventering.** `01-inventering.json` är giltig JSON med 367 poster
  (`jq` exit 0). Påståendet att två av klassningsjobbets utdata —
  `ui_low_risk` och `acceptance_local` — beräknas varje körning utan att
  något läser dem: `grep -rn` i `.github/workflows/` ger bara definitionerna
  (`ci.yml:73`, `:78`) och kommentarer; `ci.yml:2213-2214` bokför själv att
  de *"hade `run_staging` som sin ENDA konsument"*. **Höll** — och det är
  öppet bokfört i koden, inte ett förbiseende. Liten städkandidat.

### S30 — Korsgranskningen rättar orkestreraren på tre punkter (källa: KG1, Opus)

KG1 prövade fyra mekanismer i koden och mot 601 pushar. Tre av dess fynd
ändrar vad denna logg tidigare sagt; jag har prövat vart och ett.

- **S12 generaliserade från två nätter — föll.** Jag skrev *"nätet är inte
  trasigt, det bär FEL LAST"* efter att ha läst nätterna 09-15 och 09-16. KG1
  räknade alla 52: ett PRODUKTSKYDDANDE jobb var rött **25 av 52 nätter**
  (staging 15, kontraktsvakten 9 — varav sex i rad 08-22→08-27 — a11y 3,
  acceptance 1). Prövat med `gh api …/actions/runs/<id>/jobs` på två av de
  utpekade nätterna: natten 2026-08-24 (`32682955266`) var kontraktsvakten
  röd; natten 2026-08-19 (`32208177054`) var både `Staging (API + E2E)` och
  `A11y` röda. **KG1 höll.** Rätt bild: nätet bär fel last OCH en äkta
  produktsignal har legat osedd i bruset ungefär varannan natt. KG1:s
  skarpaste belägg för priset: `TASK-239` kräver "tre gröna nätter i rad" för
  acceptance-klassen; den var grön 31 nätter i följd, men kriteriet går inte
  att läsa av, eftersom nattens samlade utfall var rött alla 32.
- **S18:s "mekanismen hade ingen" — föll; mekanismen höll.** KG1 bekräftar
  mekanismen ur koden: `post-merge.yml:228-229` skickar bara `github.sha`
  till `scripts/classify-post-merge.sh` (läst av mig — stämmer). Men repot
  HADE redan diagnosen: tråden `T166` (2026-08-21, pausad) säger ordagrant att
  klassningen *"läser `HEAD^2` — sista PR:en i kö-batchen — inte hela
  pushen"* (`tasks/threads/README.md:209`, läst av mig). Jag återupptäckte
  något som stod nedskrivet fyra veckor tidigare; `TASK-365` (High, To Do)
  bär en annan, delvis falsifierad rotorsak, och de två pekar inte på
  varandra. Det är i sig ett fynd: **ett högprioriterat kort med fel
  rotorsak, bredvid en pausad tråd med rätt.**
- **S18 och S11 skärps i sak:** (a) hålen är **60, inte 85** — bara när
  toppen är en textändring OCH spannet bär kod uteblir något; (b) det som
  uteblev är **staging-sviten, a11y och städningen** — de hermetiska
  klasserna KÖRDES ändå, eftersom `CI [push]` klassar hela det pushade
  spannet (KG1: 14 av 14). S11:s mening *"`CI [push]`-körningen tillför
  ingenting alls"* gäller alltså en ensam landning, inte en grupplandning;
  (c) KG1 mätte exponeringsfönstret: alla 60 hål täcktes av nästa
  kod-landning, median 0,57 timmar, längsta 33 timmar. KG1:s tal (60, 14 av
  14, 0,57 h) har jag INTE räknat om — märkningen är KG1:s.
- **S20 står sig, och får en fälla tillagd.** KG1: dedupen träffade 32 av 32
  gånger där den KAN göra nytta (samma träd, kodspann) — 5,3 % av pusharna;
  mitt "3 av 20 kod-landningar" är samma sak sedd från andra hållet. "Riv
  inte" är gemensam dom. Fällan jag missade: den enklare frågan får aldrig
  vara *"har SHA:n en grön körning?"* — på de 60 hålen är kö-körningen grön
  med sviten HOPPAD. Villkoret måste vara *"sviten körde och var grön"*, och
  ändringen får inte göras före lagningen av post-merge-klassningen.
- **En incident i granskningens egen drift, orsaken fastställd:** KG1
  rapporterade att dess lista över push-körningar (1 000 poster) skrevs över
  på disk mitt i passet. Det var orkestreraren: min fil `ci-push-runs.json`
  (40 poster, skriven 11:07Z) fick samma namn i den delade scratch-katalogen.
  KG1 upptäckte det via en självmotsägelse i en härledd siffra och mätte om.
  Orkestrerarens scratch-filer bär från och med nu prefixet `ork-`.

### S31 — Täckningsluckan sedd live, med granskningens egen PR överst (källa: S18, KG1 fynd 1)

- **Vad som hände:** medan granskningen pågick landade merge-kön tre PR:er i
  EN push, 2026-09-17: `#2500` (en kodfix i fyra acceptance-tester och
  `tests/support/fixturvarld/hermetic.ts`), `#2493` (text) och överst `#2496`
  — denna sessions egen födelse-PR, ren text.
- **Prövat med:** `git log origin/main --first-parent` efter `git fetch`;
  `gh run list --workflow post-merge.yml --limit 8`; `gh run list --commit
  <full SHA>` på `0c8d3edc…` (kodfixen) och `4567a053…` (toppen); `gh api
  …/actions/runs/<id>/jobs` på toppens två körningar. 2026-09-17, mellan
  11:37Z och 11:39Z (klockan avläst före och efter).
- **Utfall:**
  1. Kodfixens landnings-commit `0c8d3edc` har **en enda körning**: `CI
     [merge_group]` (`35215409698`). Ingen `CI [push]`, ingen `Post-merge`.
     Detsamma gäller `a207644c` (`#2493`).
  2. Toppens efterkontroll (`35216597781`) är **grön med "Verifierande svit
     på det mergade trädet: skipped"** — toppen är text, alltså ärvs
     textklassningen.
  3. Toppens `CI [push]` (`35216597754`) kör däremot HELA den hermetiska
     sviten — `Pure + Build`, tre acceptance-skärvor, självtestet,
     `Webblasarbeteende` — trots att toppen själv är ren text. `A11y`,
     `Staging (API + E2E)` och de två städjobben är hoppade.
- **Dom: KG1 höll på varje punkt, och S11:s "`CI [push]` tillför ingenting"
  föll för grupplandningar.** Push-körningen klassar hela det pushade
  spannet och är den som fångar koden under en text-topp; efterkontrollen
  klassar bara toppen. Det som uteblev för `#2500` är exakt det KG1 sa:
  staging-sviten, tillgänglighetsscanningen och städningen. Hål nummer 61 i
  KG1:s räkning — skapat av en sessionsstart-PR. Just detta hål är
  lågriskigt (kodfixen rör bara hermetiska tester, som staging-sviten inte
  läser), och natten eller nästa kod-landning täcker det. Men det visar hur
  vardaglig mekanismen är: **varje session föder ett dok via en text-PR, och
  varje sådan PR kan bli locket över någon annans kod.**
- **Följd för åtgärdsplanen:** KG1:s ordningskrav väger tyngre efter detta —
  rör inte `CI [push]` eller dedupens fråga innan efterkontrollen klassar
  hela spannet.

### S32 — Registrets pekare träffar, och "vem vaktar vakten" har två belagda hål (källa: D12, KG1 fynd 3)

- **Påståenden (registrets rad G05 och G06, ur KG1):** (G06) `gate-proof.yml`
  — provet som ska visa att slutgrinden verkligen fäller — startas bara för
  hand, kördes senast 2026-09-04, och `ci.yml` har ändrats två gånger sedan
  dess utan nytt prov, trots att `ADR-077` §4 säger att det körs *"efter varje
  ci.yml-ändring"*. (G05) Paritetsvakten `verifieraJobbmangd` fäller på ett
  NYTT jobb som policyn inte känner, men kontrollerar inte att jobbet står i
  slutgrindens `needs`-lista — och själva verktyget körs inte i CI.
- **Prövat med:** `sed -n '29,30p' .github/workflows/gate-proof.yml`; `gh run
  list --workflow gate-proof.yml --limit 3`; `git log origin/main -4 --
  .github/workflows/ci.yml`; `sed -n '202,224p' scripts/verify-ci-parity.mjs`;
  `grep -n verify-ci-parity .github/workflows/*.yml`. 2026-09-17, mellan
  11:52Z och 11:54Z (klockan avläst före och efter).
- **Utfall:** triggern är enbart `workflow_dispatch`. Tre körningar någonsin
  i listan: 2026-08-01, 08-26 och **09-04 13:02Z**. `ci.yml` ändrades
  därefter `d8e2fddd` och `7ab494c4`, båda 2026-09-07. Funktionen på rad
  202–224 jämför jobbmängden mot policyn åt båda håll och nämner aldrig
  `needs`. Workflow-filerna kör `node scripts/test-verify-ci-parity.mjs`
  (`ci.yml:1542`) — verktygets TESTSVIT — men aldrig verktyget.
- **Dom: höll, båda.** S2:s öppna fråga (b) är därmed avgjord: ett nytt jobb
  som glöms i `needs` fångas i dag av ingenting som kör automatiskt. Och
  `ADR-077` §4 är ytterligare en instans av mönstret i S4/S10/S16/S17 —
  prosa som beskriver ett arbetssätt som om det vore en mekanism.
  Åtgärdskandidat (KG1): en `paths:`-trigger på `gate-proof.yml` kostar en rad.
- **Registret som helhet:** 130 bärande påståenden, 118 märkta verifierade;
  agenten prövade 14 pekare (alla träffade), jag 2 till (båda träffade).
  Registret fångade fyra ställen där en leverabel ännu sade emot senare
  mätning (M-A, M-B, M-C, M-F) — alla rättade samma dag, se statusnoten i
  registrets avsnitt om kvarstående motsägelser.

## Motsägelser mellan agenter

- **Merge-dedupens faktiska träffkvot (J8.5 mot J8.7, ärvd av D3):** AVGJORD
  i S20 — dedupen träffar, men sällan (3 av 20 kod-landningar).
  Ursprunglig bokföring: J8.5
  (`underlag/j8-5…` rad 504–564) kallar dedupen *"i praktiken utan verkan"* —
  noll observerade träffar, och run `34243465042` loggar *"Dedup-miss:
  träd-avvikelse"*. J8.7 (`underlag/j8-7…` rad 164, 367–374) skriver
  *"Dedupen fungerar, med ett undantag"*: `metrics:ci` rapporterar 100 %
  träff (25 av 25), och 57 % av push-körningarna (n=53) är korta (242 s).
  De kan båda mäta rätt på olika saker: en KORT push-körning kan vara en
  docs-landning (`should_skip_tests`) lika gärna som en dedup-träff, och
  `metrics:ci` kan räkna träffar på ett annat sätt än loggraden. ÖPPEN —
  KG1 äger frågan i våg 2; orkestreraren mäter själv därefter (en påstådd
  träff och en miss, ur `changed`-jobbets logg), eftersom svaret avgör om
  rekommendationen blir "riv dedupen" eller "behåll den".
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
