# a2-review-pilot-t86-f6

## FRÅGA
Är review-piloten (T86) mogen för utvärdering, kördes F6-testet (T89) inatt, och är utvärderingen en del av T85-korrigeringspaketet — samt är nu rätt läge för korrigerings-sessionen givet att bygget av Check-in/Personer/persondetalj ska starta?

## SVAR
Nej på (a): piloten har mätt SEX skivor av 10–15 — tröskeln är inte nådd, och beslutet är dessutom dubbelspärrat (T85-paketet är LÅST som bindande FÖRE pilotbeslutet). Ja på (b): F6 kördes, på task-18.16 med effort low, och rådatan ligger i T89 § F6-mätningen — utfallet avvek inte från baslinjen (0 blocker, grön CI första pass, 28,7 min mot jämförbara 18.15:s 28,1 min); "F6-upptaget" är det lilla Marcus-beslutet om experimentets slutsats, som per T89 väntade på morgongranskningens escapes-facit — det facit är nu ifyllt, så F6-beslutet är taget-bart idag och är ETT eget litet moment, inte del av T85. Nej på (c): T86-utvärderingen är INTE en del av T85-korrigeringspaketet — T85 § Eftergranskningen säger uttryckligen att paketet är "BINDANDE FÖRE review-pilotens beslut (T86, 10–15 loggrader)"; T89:s F1b/F2/F3 är däremot inbakade i T85-fönstret. Två saker som ändrar bilden och som inte står i något kort ännu: (1) escapes-kolumnen fylldes 09:16Z (PR #187) men DÄREFTER kom tre fix-vågor till (PR #188 09:43Z, #189 10:57Z, #191 11:35Z) med ~8 nedströms-fynd som ligger utanför facit — kolumnen är alltså stale och måste triageras om innan den används som pilot-underlag; (2) det finns NOLL ready-for-agent produktkod-skivor kvar (hela event-familjen 17.x/18.x/19.x är Done) — piloten har inget bränsle förrän nya skivor mintas, vilket gör att vägen till 10–15 rader GÅR genom nästa bygg-våg. Räknar man de sex raderna mot de låsta kriterierna hamnar piloten redan idag i GRÅZON: träffkvot 6/6 och brusandel ~3 % klarar sig, men median-kostnaden är 9,5 min/skiva mot kravet ≤5 min. Om nu är rätt läge för korrigerings-sessionen: ja, men inte parallellt med UI-BYGGE — parallellt med UI-DESIGN går bra, eftersom prototyp-/PRD-fasen inte landar något på main.

## FYND
- **Pilot-loggen har exakt SEX rader (17.7, 18.15, 18.16, 18.17, 18.18, 18.19) — tröskeln 10–15 produktkod-skivor är inte nådd.**
  BEVIS: tasks/threads/T86-pocock-v11-integrationen.md:178-185 (tabellhuvud + sex rader); kriteriet på rad 164-166: '10–15 produktkod-skivor (docs-/config-kort deltar inte)'
- **De låsta beslutskriterierna ger GRÅZON på nuvarande data: träffkvot 6/6 (≥1/3 krävs) OK, brusandel 1 avfärdat av ~36 inom-scope-fynd ≈ 3 % (<50 % krävs) OK, men median-review-tid 9,5 min mot kravet ≤5 min/skiva — och 9,5 är inte >10, så RIV-villkoret slår inte heller till.**
  BEVIS: Kriterierna: T86-kortet rad 152-157. Tider ur tabellens kolumn 'Tid (min)': ~10 · ~8 · ~12 · ~14 · ~7 · ~9 (T86 rad 180-185) → sorterat 7,8,9,10,12,14 → median (9+10)/2 = 9,5. Avfärdade: 1 (17.7, rad 180); routade 8 står per definition utanför nämnaren (rad 148-150)
- **T85-korrigeringspaketet är LÅST som bindande FÖRE pilotbeslutet — T86-utvärderingen kan alltså inte avgöras före T85-sessionen oavsett antal rader.**
  BEVIS: tasks/threads/T85-riskanpassad-ci.md:85-91 — 'SEKVENS LÅST (Marcus 2026-07-24): paketet tas som NÄSTA processfönster — egen fokuserad session EFTER nattbygget, BINDANDE FÖRE review-pilotens beslut (T86, 10–15 loggrader) och före all vidare CI-utbyggnad'
- **F6 kördes inatt på task-18.16 med effort low; rådata + jämförelsetabell finns och utfallet avvek inte från baslinjen.**
  BEVIS: tasks/threads/T89-s83-granskningspaketet.md:68-87 (§ F6-mätningen: 18.16 low 28,7 min / 8 fynd / 0 blocker / CI grön första pass / Done vs 18.15 default 28,1 min); tasks/sessions/archive/2026-07/2026-07-25-session-86.md:139-143
- **'F6-upptaget' = det lilla explicita Marcus-beslutet vid F6:s upptag; T89 anger att slutsatsen kräver jämförelse mot morgongranskningens escapes-facit, som nu ÄR ifyllt.**
  BEVIS: T89:53-56 ('F1a/F4/F6 tas som små explicita Marcus-beslut vid respektive upptag') + T89:86-87 ('Jämförelsen mot Marcus-morgongranskningens escapes-facit återstår innan F6-beslutet tas'); facit ifyllt i commit 3784409 (git show 3784409 — kolumnen '_fylls i morgongranskningen_' → konkreta värden)
- **F6-jämförelsen faller ut till fördel för low-effort: de tre efterföljande fix-vågorna träffade uteslutande 18.18/18.19 (default effort), aldrig 18.16.**
  BEVIS: PR #189 body (18.19 · 18.18), commit 073dc72 'våg 3 — sökrutans fokusring … (18.18/18.19)', 590620c (väljarlistans scrollbar), a79e381 (overlay-origo + rubrik-utrymme). Ingen wave-commit refererar 18.16.
- **Escapes-kolumnen i pilot-loggen är STALE: den fylldes i PR #187 (mergad 09:16Z) medan tre ytterligare Marcus-vågor landade därefter — PR #188 09:43Z, #189 10:57Z, #191 11:35Z.**
  BEVIS: gh pr view 187/188/189/191 --json mergedAt → 09:16:00Z / 09:43:56Z / 10:57:38Z / 11:35:55Z; commit 3784409 (facit-ifyllningen) ligger i PR #187
- **Merparten av våg 2/3-fynden är browser-synliga design-/facit-brister som en diff-läsande subagent strukturellt inte kan se — ett av dem (autofocus) var till och med FACIT-troget byggt och facitet revs i stället.**
  BEVIS: PR #189 body punkt 2: 'Facit punkt 8:s "aldrig autoFocus" rivs öppet'; punkt 3 klassad 'FACIT-KOMPLETTERING, form B'; PR #188 punkt 3 klassad 'FACIT-REVIDERING'
- **T85-korrigeringspaketet består av FEM poster (mätardefinitioner, nattlarms-observatör, Vale-SHA256, required-check app-bindning, cron-timezone) + FYRA Marcus-beslutsfrågor; T89 lägger till F1b/F2/F3 i samma fönster.**
  BEVIS: T85-kortet rad 98-120 (numrerad 1–5 + '## Beslutsklass (Marcus)' med 36.7-formalian · 36.8-ordningen · nightly-visual · merge-only); T89:38-40 (F1b/F2/F3 med fönster 'T85-korrigeringsfönstret')
- **T85-paketet SKRIVER i CI-ytan: ci.yml (Vale-install), nightly.yml (cron), ny workflow för observatören, samt scripts/ci-metrics.mjs + dess fixtursvit.**
  BEVIS: .github/workflows/ci.yml:506-516 (Vale curl-install utan SHA256); .github/workflows/nightly.yml:12-16 (cron '0 1 * * *' + kommentaren 'GitHub-cron saknar tidszon'); scripts/ci-metrics.mjs + scripts/test-ci-metrics.mjs finns (ls scripts/)
- **Det finns NOLL ready-for-agent produktkod-skivor kvar — hela event-familjen är Done; kvar i To Do är oetiketterade fynd-kort task-39–48, QA-kortet 36.8 och PRD-föräldrarna.**
  BEVIS: Statusgenomgång av backlog/tasks/task-1[789]*.md: samtliga 17.1–17.7, 18.1–18.19, 19.1–19.4 = Done. backlog task list --plain --status 'To Do' → task-39..48 utan labels, 36.8 QA, TASK-17/18/19/36 (PRD-föräldrar)
- **Check-in-SIDAN är uttryckligen utanför nuvarande PRD:er och kräver egen konvergens + egen PRD — bygget kan alltså inte starta som batch, det startar som prototyp-/spec-kedja.**
  BEVIS: backlog/tasks/task-18 - PRD-Eventsidan-till-S73-facit.md:90 — 'Check-in-SIDAN och närvaro-write (egen konvergens → egen PRD; här byggs endast ingången)'; task-17:67 samma avgränsning
- **Precedenten för ci.yml-arbete är 'ETT ci.yml-arbete under direkt hand, EJ subagent-batch' — och L328 dokumenterar att parallella landningar svälter långsamma PR:er när strict required checks gäller.**
  BEVIS: tasks/todo.md rad ~1 (S78-blocket): 'KURSKORRIGERING: … 36.2/36.3/36.4 tas som ETT ci.yml-arbete under direkt hand (reusable-workflow, EJ subagent-batch)'; tasks/lessons.md:4801-4822 (L328, tre BEHIND-varv i S81)
- **Repot är rent, i synk med origin och main är grön — inget hindrar att nästa fönster öppnas.**
  BEVIS: git status --short = tomt; git rev-list --left-right --count origin/main...HEAD = 0 0; HEAD 7aa2e02 (PR #191); gh run list --branch main → run 30156511486 success
- **S86 är fortfarande öppen och dess bokföring har en lucka: sessionsdoket slutar vid Del 2 (nattbatchen) och todo-kadensen vid 'Bokförings-landningen' — de tre granskningsvågorna och prototyp-svarfångsten är inte narrativt landade.**
  BEVIS: tasks/sessions/archive/2026-07/2026-07-25-session-86.md slutar rad 159 (Del 2); frontmatter lifecycle: active. git log -- tasks/sessions/archive/2026-07/2026-07-25-session-86.md → senaste fb25e64. git log -- tasks/todo.md → senaste fb25e64. Under tiden landade ee021eb, 0dbe27d, a79e381, c16f654, 073dc72, 590620c

## LUCKOR
- Jag kunde INTE hitta något dokument som triagerar våg 2/3-fynden mot pilot-loggens escapes-definition. Letade i: T86-kortet (hela filen), tasks/sessions/archive/2026-07/2026-07-25-session-86.md (hela filen), tasks/todo.md rad 18-142, git log -- tasks/threads/T86*. HITTADE INTE — kolumnen står orörd sedan 3784409.
- Jag kunde inte verifiera om fix-vågorna (PR #188/#189/#191) själva kördes genom review-piloten. Letade i commit-bodies för ee021eb, 0dbe27d, a79e381, 073dc72, 590620c med grep -i 'pilot' — noll träffar. Tolkning: de kördes under direkt hand, inte via do-work-skarven, och räknas därför rimligen inte som pilot-skivor — men det är en slutsats av frånvaro, inte ett explicit bokfört beslut.
- Jag kunde inte hitta någon plan, kort eller PRD för Check-in/Personer/persondetalj. Letade i: backlog task list --plain (109 rader), grep 'Check-in|Personer|persondetalj' i backlog/tasks/*.md och docs/byggplan.md. Byggplanen rad 85 visar Fas 6a Personer som KLAR (Session 23, lista + detaljvy) — Marcus efterfrågan gäller alltså en NY konvergens av befintlig yta, inte en obyggd fas. Exakt scope är odefinierat på disk.
- Jag har inte verifierat om required-check app-bindningen (T85-post 4) redan är delvis åtgärdad i GitHub-rulesetet — det kräver gh api-anrop mot repo-inställningar som jag bedömde ligga utanför läs-mandatets anda. Posten står som KVAR i T85-kortet rad 111-113.
- Exakt review-tid per skiva är avrundad i loggen ('~10', '~8' …) — median 9,5 min är därför en approximation på approximerade värden. Marginalen till kravet ≤5 min är dock så stor att slutsatsen håller oavsett avrundning.

## REKOMMENDATION
Kör INTE T86-utvärderingen nu — den är omogen på två oberoende grunder (6 av 10–15 rader, och T85-spärren). Gör i stället detta, i ordning:

1. STÄNG S86 FÖRST (30–45 min). Sessionsdoket saknar Del 3 för de tre granskningsvågorna + prototyp-svarfångsten, och todo-kadensen slutar vid nattbatchen. Kontinuitet-arkitekturen säger att filartefakter är enda sanningskällan — just nu lever tre vågors beslut bara i PR-bodies. I samma landning: triagera om T86:s escapes-kolumn ärligt mot våg 2/3 (min läsning: 18.18/18.19 går från "1 design-escape" till "1 escape + N facit-luckor/browser-fynd", med en not om att en diff-läsande subagent strukturellt inte kan se dem — det är pilotens verkliga takyta och måste stå i loggen innan beslutet tas).

2. TA F6-BESLUTET DIREKT (10 min, ingen session). Det är ett eget litet Marcus-beslut, inte T85-materia, och underlaget är komplett: low-effort-skivan avvek inte, och de tre fix-vågorna träffade bara default-effort-skivorna. Min rekommendation: bokför "ingen observerad degradering vid n=1 — otillräckligt för att göra low till standard; experimentet AVSLUTAS som inkonklusivt-positivt och återupptas inte spekulativt". Att bygga en effort-policy på ett enda mätvärde vore precis den spekulativa komplexitet över-engineering-vakten säger nej till.

3. KÖR T85-KORRIGERINGSSESSIONEN SOM NÄSTA FÖNSTER (egen fokuserad session). Sekvensen är låst av Marcus själv, den blockerar pilotbeslutet OCH all vidare CI-utbyggnad (inklusive T87-aktiveringen), och paketet ruttnar — Codex mätpåståenden ska verifieras innan siffrorna används till något. Formen: /to-prd + /to-issues på de åtta mekaniska posterna (T85 1–5 + T89 F1b/F2/F3), plus ~40 min grillning för de fyra beslutsfrågorna. Sessionen BÖRJAR med hypotes-verifieringen av de tre mätpåståendena mot scripts/ci-metrics.mjs.

4. PARALLELLT — men bara design-fasen. Check-in/Personer/persondetalj kan starta SAMTIDIGT som T85-sessionen så länge arbetet stannar i prototyp- och spec-fasen: prototyp-passen landar ingenting på main (proto/-brancher mergas aldrig), och PRD/skivor är backlog-skrivningar. Noll fil-krock, noll CI-krock. Så fort första check-in-SKIVAN börjar byggas (PR mot main) ska CI-kirurgin vara klar — annars får du L328:s BEHIND-svält plus en rörlig grind under ett rörligt bygge.

5. PILOTENS BRÄNSLE. Nästa bygg-våg är där rad 7–12 kommer ifrån. Snabbaste vägen dit är att triagera task-39–48 (tio oetiketterade fynd-kort från nattens skörd) — flera är små produktkod-skivor och skulle ta piloten till tröskeln utan att vänta på hela check-in-PRD-kedjan. Det ger dig dessutom en billig "justeringsrunda" om gråzons-läsningen står sig.

## ARBETSFORM
Tre skilda fordon, inte ett: (1) S86-stängningen = do-work-kort/dokumentations-landning i pågående session; (2) F6-beslutet = kort tråd-notering, inget pass; (3) T85-korrigeringen = egen fokuserad HITL-session med PRD+skivor för de åtta mekaniska posterna + grillning för de fyra beslutsfrågorna. T86-utvärderingen är INGET fordon nu — den är ett beslutsögonblick som utlöses när n≥10 OCH T85 är landad. Check-in/Personer startar som prototyp-pass (UI-grenen, tvåfas) → /to-prd → /to-issues.

## OMFATTNING
S86-stängning + escapes-omtriage: 30–45 min. F6-beslutet: 10 min. T85-korrigeringssessionen: EN fokuserad session, ~4–6 h — jämförbar med S79 (ci.yml-trion) och S80 (36.5+36.6), som båda tog en session var. Tyngdpunkten är post 2 (nattlarms-observatören): ny workflow som kräver skarpt tvåsidigt bevis à la 36.1/gate-proof, den ensam kan bli ett halvt pass. Post 1 (mätardefinitionerna) bär redan en fixtursvit (scripts/test-ci-metrics.mjs) så TDD-formen är billig. Posterna 3–5 är små (~30 min ihop). De fyra beslutsfrågorna: 30–45 min grillning. Check-in/Personer-designkedjan: minst en egen session för prototyp-passet plus en för PRD+skivor — Marcus-tung, browser-bunden.

## BEROENDEN
- T86-pilotbeslutet BEROR PÅ: (a) n≥10 pilot-rader — kräver nästa produktkod-batch, och (b) T85-korrigeringssessionen landad. Båda är hårda spärrar; (b) är Marcus egen låsning från 2026-07-24.
- T86-pilotbeslutet BLOCKERAR: den eventuella ADR:n som permanentar review-blocket i do-work-skillen, och därmed hub-plugin-bumpen.
- T85-korrigeringssessionen BLOCKERAR: all vidare CI-utbyggnad (T85-kortets egen formulering), inklusive T87-aktiveringen (visual-grinden) och task-36.8 (QA-vandringen, vars punkt 11 förutsätter T87-ordningsbeslutet).
- T85-korrigeringssessionen BEROR PÅ: ingenting kvarvarande — nattbygget var dess enda förkrav och det är levererat 6/6.
- T89 F1b/F2/F3 BEROR PÅ: T85-fönstret (F1b kan alternativt tas vid nästa hub-sync). F1b + F4 skriver i HUB-repot (marcus-system-skills), inte i detta repo — kräver plugin-bump + `claude plugin update` i samma landning per memory-regeln.
- Nästa pilot-skivor BEROR PÅ: antingen triage av task-39–48 till ready-for-agent, eller hela kedjan prototyp → PRD → skivor för Check-in/Personer.
- Check-in-bygget BEROR PÅ: egen konvergens + egen PRD (task-18:90) — det finns inget kort att plocka idag.
- Hub-lyftet L284–L342 är obundet och kan tas när som helst; det växte med L341/L342 under fix-vågorna.

## RÖR VID
- .github/workflows/ci.yml — Vale-installationen rad 506-516 får SHA256-verifiering (T85 post 3)
- .github/workflows/nightly.yml — cron-blocket rad 12-16 får timezone: Europe/Stockholm + den inaktuella kommentaren rivs (T85 post 5)
- .github/workflows/ — NY fil för nattlarms-observatören (workflow_run-vakt, T85 post 2); sannolikt även gate-proof-liknande bevis-yta
- scripts/ci-metrics.mjs + scripts/test-ci-metrics.mjs — flaky-nämnaren, kötids-definitionen och röd-orsaks-listan (T85 post 1)
- scripts/proto-verify.mjs — NY fil, parametriserat verifieringsskript (T89 F2)
- GitHub repo-ruleset (ingen fil) — required-check app-bindning mot integration_id (T85 post 4)
- tasks/threads/T85-riskanpassad-ci.md + T89-s83-granskningspaketet.md — statusrader per post
- HUB-REPOT ~/Repon/marcus-system: plugins/marcus-system/skills/session-start/ (F1b) + skills/prototype/ (F2-pekare, F4) — separat repo, separat commit, plugin-bump
- KRITISKT för krock-risk: T85-arbetet skriver ALDRIG i src/ eller tests/ — noll fil-överlapp mot UI-bygge. Krocken är processuell, inte fil-baserad: ändringar i ci.yml/ci-suite.yml/nightly.yml gör varje öppen UI-PR BEHIND (L328) och byter grind under pågående bygge.
- Check-in/Personer-designfasen skriver i: tasks/sessions/bilagor/ (snapshots), backlog/tasks/ (PRD + skivor), proto/-brancher som aldrig mergas — noll överlapp mot T85.

## MARCUS-BESLUT
- F6-slutsatsen (kräver ditt beslut, underlaget är komplett): A) AVSLUTA experimentet som inkonklusivt-positivt — ingen effort-policy mintas på n=1 (Code-rek), B) UPPREPA på 2–3 skivor till i nästa batch innan slutsats, C) ANTA low som standard-effort för avgränsade skivor redan nu.
- Escapes-kolumnens kalibrering (avgör om piloten kan bedömas rättvist): A) räkna ENDAST det en diff-läsande subagent kunde ha sett — browser-only-designfynd hamnar i egen kolumn (Code-rek: annars mäter vi piloten mot något den strukturellt inte kan leverera), B) räkna ALLT Marcus fångade nedströms som escape — hårdare bar, gör sannolikt att piloten rivs.
- Sekvens nästa fönster: A) S86-stängning → T85-korrigeringssessionen → därefter check-in-designkedjan (Code-rek — bryter ingen låsning, rensar CI-ytan innan nästa bygg-våg), B) check-in-designkedjan FÖRST, T85 skjuts — kräver att du öppet river din egen sekvenslåsning från 2026-07-24, C) parallellt: T85-sessionen och check-in-PROTOTYPEN samtidigt (fungerar, noll fil-krock — men båda är Marcus-tunga och konkurrerar om dig, inte om repot).
- Pilotens bränsle till 10–15 rader: A) triagera task-39–48 till ready-for-agent och kör dem som pilot-batch (snabbast till tröskel), B) vänta på check-in/Personer-skivorna (längre, men mer representativa produktkod-skivor), C) både och — triage-batchen först som gråzonens justeringsrunda.
- Nightly-visual-frågan i T85-paketet: Code står fortsatt TVEKSAM (förväntat-röda nätter under UI-fas = kyrkogårds-klassen L321, Codex missade UI-fas-dynamiken). Ska den grillas i korrigeringssessionen som planerat, eller avfärdas direkt med motivering?
