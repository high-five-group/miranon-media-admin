<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk. 8 äkta Vale.Terms-fynd + 1 emergent rad-245-quirk dokumenterade i K2.6.2.D.4 v2-trail. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# todo.md — Miranon Media Admin (React)

<!-- markdownlint-disable-next-line MD036 -->
*Senast uppdaterad: 2026-09-05 (**Session 119 ✅ AVSLUTAD, AFK på förhandskvittens — se § Aktuellt fokus.**) (**Session 121 ⏸️ PAUSAD (paus 2, 2026-09-05, mitt i konvergens-passet; resume 1 landad som `#2342`, iterations-worktree `s121-registrera-betalning` med 13 opushade varv-commits, arbetsform iteration) — Registrera betalningsflöde: TASK-393 Förhandsgranska-knappen med delad RaknarChip-primitiv landad (#2320), grillad samsyn om bekräftelsesteget för inbetalningar (en yta, tre matare — ADR-baren ej nådd, ORDLISTA-poster Bekräftelsesteget + Matare), divergens-prototyp med tre varianter byggd och orkestrerar-godkänd (#2325 DRAFT). Marcus valde **C** (2026-09-05); konvergens varv 1 byggt av orkestreraren själv i appens 600 px-kolumn med husets grammatik (lokal commit `113cc314`, opushad, arbetsform iteration). Varv 2–13 landade lokalt: Lottas morgon som fixtur, bulkvalen rivna, inkorgens lista och kort klass för klass, kortet är kryssrutan (grönt = valt), inkorgens formulär i kortet, efterläget är inkorgens Registrerat nu-block med två knappar två vägar. NÄSTA: `session-resume` i iterations-worktreen → Marcus granskar varv 13 → facit-lås → en push → PRD/skivor. Se § Aktuellt fokus.**) (**Session 120 ▶️ ÅTERUPPTAGEN (resume 2, 2026-09-05 16:09 UTC; pausad 2026-09-05 ~11:50 UTC efter Del 4, paus-grenen landad som `#2343`, egen worktree `s120-anmalningar-segment`, gren `docs/s120-resume-2`) — eventväljaren stämplad och landad (TASK-394, `#2319` `e677d3dd`); detaljvyn iteration 3 pushad som draft (`#2312`) och väntar Marcus dom; TASK-400 mintat. NÄSTA: granskningsvyn för iteration 3 → Marcus dom → stämpel eller iteration 4. Se § Aktuellt fokus.**) (**Session 118 ⏸️ PAUSAD (paus 2) — apparaten, ADR-131 GitHub Issues, minimalt test steg 3 klart; se § Aktuellt fokus.**) (**Session 115 ✅ AVSLUTAD, AFK-läge på Marcus mandat — se § Aktuellt fokus.**) (**Session 84 ✅ AVSLUTAD (2026-07-24)** — **EF-PROD-SYNKEN (parallell session bredvid aktiva S83, egen worktree):** T39-pre-flighten (innehålls-diff deployad-kod-vs-HEAD ×12 → verklig drift SMALARE än versionsgapet, L332; karta+planer i `docs/research/t39-ef-sync-preflight-2026-07-24.md`) → Marcus-förkraven i dashboarden (smoke-user `marcus+ef-smoke@h5gruppen.se` · Playwright-paret + `marcus@marcusjohansson.me` raderade → **T33 STÄNGD**) → **A-kedjan:** test-auth raderad (TASK-35 Done, AC2→TASK-37) · kanoniska full-allowlist-deployen **13/13** (11 bump + notes-paret NYTT I PROD; **L216-override-kravet UPPHÄVT**) · deny-triple ×13 grön (källkods-klassad form, L331; metod-vakts-fyndet→TASK-38) · autentiserade smokes gröna (Airtable-secreterna runtime-bevisade · create-event-idempotensen · notes-rundturen · save-segment) · ZZ-teardown verifierad → **T39 + T40 STÄNGDA** (frontend-kontrollen + allowlist-utvidgningen ärvda av T46; byggplanens closeout-förkrav fick T40-dimensionen). **Fälla 45 född** (Månad/år-options-horisonten dec 2026 — appen kan ej skapa 2027-event i prod förrän löst, L330). Kvälls-incidenterna: GitHub-API-avbrottet överbryggat med retry-vakt · syskonsessionens gröna js-yaml-PR #160 armerad+mergad · gitlab-429:an → `.lycheeignore` (digg.se-precedenten). PR #150/#151/#161 gröna per jobb. **SKÖRD L330–L332** [UNIVERSAL ×3]. **NÄSTA: TASK-37/38 plockbara · T46 bär go-live-resterna · hub-lyftet L284–L332 vid hub-sync · Marcus-moment: Update-klicket i claude.ai.** Numrering efter S84: 85/078/L333/T88/f46/task-39. Full narrativ: sessionsdok S84 Del 1–4 + BUILD-LOG S84-post.) (**Session 82 ✅ AVSLUTAD (2026-07-24)** — **POCOCK V1.1-INTEGRATIONEN (parallell-session bredvid aktiva S81):** fyra YT-transkript gap-analyserade med pre-K-forensik (T71/ADR-068/DECLINE-listorna lästa före förslag) → hub `d369d99` **plugin 1.19.0** (grilling-kärnans fakta/beslut-distinktion + enact-gate · do-work-valideringskadensen · **NY skill `/research`**) + spoke-PR #132 docs-only via egen worktree (korpus: fyra rå-transkript + delta-destillat/gap-analys; **tråd T86 född** — beslutsläge: review-piloten i do-work-skarven PARKERAD tills 36.x-mätinstrumenten [mäts 10–15 skivor → permanentas eller rivs] · Wayfinder-kartklassen + namnfrågan "PRD-kort"→"spec-kort" GRILLNINGSKLASS [trigger AT-Max] · teach-piloten/guide-builder-korsbefruktningen/Lotta-onboarding behovs-triggade · avstått-listan per över-engineering-vakten). Memory `kaizen-i-samarbetet` (bevakningen återkommande). **T86 FÖRBRUKAD → nästa tråd T87** (S81-dokets numrerings-rad skrevs före mergen). Metrics-ytorna orörda. **NÄSTA: T86 § Nästa steg A–D.** Full narrativ: sessionsdok S82 + T86-kortet.) (**Session 81 ✅ AVSLUTAD (2026-07-24)** — **T85 VÅG 2B: 36.7 VISUELL REGRESSION FRÅN NOLL — VAKTEN BYGGD OCH BEVISAD, GRINDEN MEDVETET PARKERAD (T87).** Hermetisk fixturvärld (`tests/visual/support/`: seedad session [nyckel verifierad mot supabase-js dist] · EF-mockar i zod-parsad EF-form · pinnad Inter v20 incheckad · frusen klocka · hermetik-vakt · fixtur-server 5299 med FIKTIV URL — noll staging/mutex/secrets) → **6 facit-tunga vyer × 2 vyportar = 12 bilder på ~15 s** (`npm run test:visual`). Snapshot-mallen amenderad (pre-K-forensik: {projectName}-kollisionsfix + {platform} för AC 3; -darwin gitignorerade). **2x-beslutet** (Marcus efter granskning: deviceScaleFactor 2 + scale device, 2880×1804 — granskningsupplevelsen är del av vaktens design). **Baseline-maskineriet bevisat ände-till-ände:** visual-baselines.yml dispatch → linux-generering → granskningsbar PR nr 140 (12 bilder, -uall-räknefixen skarpt bevisad) → Marcus-välsignad + mergad. **Marcus-beslut A → AC 7–8 (grind-jobbet + nightly) PARKERADE i tråd T87** (aktiverings-jobbet komplett i kortet; trigger: UI-takten lugnar; rådgivande läge förkastat L321-klassen) — kortet **Done** med öppen bokföring. PR #131/#133/#136/#139/#140/#141 alla gröna per jobb. **SKÖRD L327–L328** [UNIVERSAL ×2]: bot-PR-kedjans två plattformsgrindar (repo-inställningen + approval-empirin — mekanism som bär grind bevisas skarpt, ej doc-läses) · BEHIND-svälten (strict + heterogena CI-tider + parallella landningar). **NÄSTA (NY session S83): 36.8 QA-vandringen (ready-for-human, dep 36.7 ✓ AVBLOCKAD — sista skivan i task-36) · T87 vilande (grind-aktiveringen på Marcus-trigger) · hub-lyftet L284–L328 vid hub-sync-moment · dependabot-PR #65/#137 Marcus-review · Marcus-moment: Update-klicket i claude.ai.** Numrering efter S81: 83/078/L329/T88/f45/task-37. Full narrativ: sessionsdok S81 Del 1–7 + BUILD-LOG S81-post.) (**Session 80 ✅ AVSLUTAD (2026-07-24)** — **T85 VÅG 2 FORTS.: 36.5 MÄTSKRIPTET + 36.6 RÖTT-FÖRST BÅDA DONE.** **36.5:** `scripts/ci-metrics.mjs` + parallell fixtur-testsvit (13 fall, TDD 7 cykler rött→grönt) — PR-ledtid median+p95 · staging-kötid · röd-orsak/jobb · flaky · dedup-träffkvot ur changed-loggens markörer (enda källan som skiljer dedup-träff från docs-skip; pre-36.4 = öppet `unknown`); L314+L319 kodade och live-bevisade; `nightly-metrics`-jobb i larmets needs (röda mätningar aldrig tysta) — **ci.yml ORÖRD** (fetch-depth + L322 opåverkade). **Utgångsvärde** (fönster 50): PR-ledtid median 1/p95 13,3 min (n=24) · kötid median 0,2/p95 7,7 min (n=37) · flaky 0,0 % · dedup 100 % (4/0). Bevis: leverans-run 30072089892 full svit + nattbevis 30072499255 (CI-mätningsjobbet grönt, larm SKIPPAT). **36.6** (scope-utvidgning på Marcus-order, docs-only): ADR-071-amendering S80-block överst (lokalt körutdrag som bärare · rött+grönt pushas IHOP · grind-bevis via gate-proof.yml · ingen-ny-ADR öppet motiverad; fix-vågens rad (iv) öppet amenderad) + CONTRIBUTING § Rött-först; run 30073375124. **PR #124–#129 alla grön/jobb first-pass; noll defekter i körning** (2 självfångade före commit). **Första skarpa schemalagda nightly GRÖN** (30065650800). Inga nya lessons/ADR/trådar (T85-kortet: 2a KOMPLETT + 2c VERKSTÄLLD). **NÄSTA (NY session S81): 36.7 visual (EGEN session, ready-for-human) → 36.8 QA (ready-for-human, dep 36.7) · hub-lyftet L284–L326 vid hub-sync-moment · dependabot-PR #65/#126 Marcus-review · Marcus-moment: Update-klicket i claude.ai.** Numrering efter S80: 81/077/L327/T86/f45/task-37. Full narrativ: sessionsdok S80 Del 1–3 + BUILD-LOG S80-post.) (**Session 79 ✅ AVSLUTAD (2026-07-23)** — **CI.YML-TRION T85 VÅG 2A KOMPLETT (36.2+36.3+36.4):** reusable-svit-extraktion (`ci-suite.yml` `workflow_call`, anropad av `ci.yml`+`nightly.yml`; **ADR-077 mintad** — klassning+dedup+nattnät). **36.2 nattnätet** (schema ~03:00 Europe/Stockholm + larmkedja→tilldelat `ci-natt`-ärende med run-länk+commit-spann + moderate-audit + no-cache-länk; grön natt run 30039548355 [larm SKIPPAT, 0 ärenden] · simulate 30039559724→ärende #114 [stängt med motivering] · gate-proof 30038462683 [L322 fail-closed genom refaktorn]) — **3 CI-FÅNGADE DEFEKTER → L326** [UNIVERSAL]: `startup_failure` ×2 (permissions-eskalering i BÅDA reusable-anroparna — ett anropat workflow kan ej eskalera anroparens token; taket måste grantas per anropare) + span-faktafel (samma-SHA-natt = flake-signal). Spiken bar `permissions: {}` = förenkling som maskerade buggen. **36.3 D1-klassen** (ren CSS/stilmall/publik statisk → staging+mutex SKIPPAD, a11y/pure/build kör; allowlist aldrig blocklist, samma exkludering som D0; kontrastbevis-tripel 30043867877 [D1] / 30043886869 [.css+.tsx→full] / 30043233137 [config→full]; `.playwright-mcp/`-gitignore L321-klassen) 0 defekter first-pass-grönt. **36.4 merge-dedup** (main-push läser `HEAD^2`, tree-ekvivalens + `gh run list --commit <full SHA>`; **fail-closed på VARJE avvikelse**; cache-formen FALSIFIERAD ej byggd L325; unit-testad 6 grenar [1 hit+5 fail-closed] FÖRE bygget; kontrastbevis-par MISS 30047428027 [PR full svit] / HIT 30047936570 [main-push config-ändring Test suite SKIPPAD]) 0 defekter. **fetch-depth-invariant (3 bärare) + L322 ORÖRDA genom hela trion.** PR #111–#122 alla grön/jobb. **NÄSTA (NY session S80): 36.5 mätskript (dep 36.2 ✓) → 36.6 rött-först (ADR-071-amendering) → 36.7 visual (egen session, ready-for-human) → 36.8 QA · hub-lyftet L284–L326 vid hub-sync-moment · Marcus-moment: Update-klicket i claude.ai.** Numrering efter S79: 80/077/L327/T86/f45/task-37. Full narrativ: sessionsdok S79 Del 1–4 + BUILD-LOG S79-post.) (**Session 78 ✅ AVSLUTAD (2026-07-23)** — **T85 VÅG 2 SPECCAD + 36.1 LEVERERAD:** `/to-prd` → **TASK-36** + `/to-issues` → **åtta skivor** i beroendeordning (sekvens-invarianten kodad som deps: 36.2→36.3→36.4). **Cache-dedupen FALSIFIERAD öppet** (L325: GHA pull_request-cache merge-ref-scopad, osynlig för main-run) → ersatt med `HEAD^2`+tree-ekvivalens+`gh run list` (väg A, bevisad disk+API `db6ef53`). **work-batch (max-kort 3) levererade 36.1 gate-proof DONE** — S77:s bevis-skuld (L322) BETALD: tvåsidigt bevis (positivt run 30032296699 GRÖN + negativ self-test 30032299223 RÖD). PR #104–#108 alla grön/jobb första passet. **SKÖRD L323–L325** [UNIVERSAL ×3]: subagent bär ej asynkron CI-svans (orkestratorn äger den) · risk-klass = tvingade beroenden ej fil-hemvist · GHA-cache-scoping. **KURSKORRIGERING:** 36.2 (nattnätet) omklassad additiv→ci.yml-klass (nightly kräver ci.yml:s fulla svit); 36.2/36.3/36.4 tas som ETT ci.yml-arbete under direkt hand (reusable-workflow, EJ subagent-batch). **NÄSTA (S79 — HANDOFF på toppnivå i sessionsdok S78 Del 4): ci.yml-trion 36.2 (nattnätet, reusable `workflow_call`) → 36.3 (D1-klass + `.playwright-mcp/`-gitignore) → 36.4 (dedup, HEAD^2-formen) + ADR-077 mintas där · sedan 36.5 (mätskript, dep 36.2) → 36.6 (rött-först ADR-071-am) → 36.7 (visual, egen session) → 36.8 (QA). Invarianter: L322 fail-closed (gate-proof.yml är vakten) · gate-proof-replik-drift-bärare · fetch-depth-3 · sekvens-invarianten.** Numrering efter S78: 79/077/L326/T86/f45/task-37. Full narrativ: sessionsdok S78 Del 1–4.) (**Session 77 ✅ AVSLUTAD 2026-07-23** (`lifecycle: closed` på Marcus coverage-kvittens **"Det är bara att flippa."**) — **PROCESSGRANSKNINGS-LANDNINGEN:** merge-grinden MEKANISERAD (ADR-076: ruleset `main-skydd`, PR-krav 0 approvals + required check strict, TOM bypass; direktpush-bevis + BLOCKED→auto-merge-bevis; ALL bokföring via auto-merge-PR, beslut A) · Test+Build SPLITTAT (mutexen ENDAST på test-staging; Pure+Build-signal 29 s, förr ~10 min; PR #99) · actionlint release-pinnad + SHA256 (utelämning #3 stängd) · riskanpassad CI DESIGNAD (T85 våg 2a/2b/2c: D1-klass + merge-dedup + nightly/larm + visual från noll + rött-först-bärarbytet [beslut A]; våg 3 = staging-isolering vid bas-maximeringen) · Codex-processgranskningen verifierad påstående-för-påstående (svars-sektion i research-doket) · **END-PASS-INCIDENTEN:** röd PR auto-mergad via skipped-aggregator-hålet → FAIL-CLOSED-aggregator (PR nr 102) + **L321–L322** [UNIVERSAL ×2] (deferral-bärare · skippbar required check är fail-open). **NÄSTA: våg 2a/2b/2c per T85 i Marcus-takt · hub-lyftet L284–L322 vid hub-sync · Marcus-moment: Update-klicket i claude.ai.** Full narrativ: sessionsdok Del 1–4. S76 ✅ + S75 ✅ i egna sektioner nedan.) (**Session 76 ✅ AVSLUTAD 2026-07-22** (`lifecycle: closed` efter Marcus design-godkännande **"Nu är det skitbra"** + hela-vägen-ordern som coverage-kvittens) — **T80/T81/T82-MELLANSESSIONEN LEVERERAD FÖRE S75-RESUMEN:** T81 → ADR-071-amenderingen (review-utfalls-klasserna 3+2, tvådelat gränstest, fix-vågens PR-kontrakt, Done-flipp-grinden) · T80 → **ADR-074** (stabila nycklar/vinnaren behåller nyckeln · växlar-standarden · snapshot-par + fönster-jämförelse) + URL-STATE-SPEC §Dev-parametrar · T82-flippen 6 av 7 (work-batch KVARLÅST per ADR-071 b1) · hub-bunten **plugin 1.18.1** + REINSTALL-PRAXISEN (Code kör `claude plugin update` i samma landning — T18 STÄNGD) · **TASK-29 Done GODKÄND: ikon-railen** (SEX vågor, 16 AC; dockad dragbar, badge alltid synlig, rörelse-förbud, inga tooltips) · **MEKANISKA CI-vakt-hooken** i `.claude/settings.json` (foreground-vakt nekas av harnesset; falsk-positiv fångad → position-ankrad) · trådar T78/T80/T81/T82/T18 stängda + **T83** född (Claude Design) · SKÖRD **L307–L310** · numrering 075/L311/T84/f45/TASK-30. **NÄSTA: S75-RESUME med work-batch 12 (huvudspåret, stående JA) · Done-flippar fråga 4 + TASK-25 i S75-loopen · hub-lyftet L284–L310 vid hub-sync · Marcus-moment: Update-klicket i claude.ai.** Full narrativ: sessionsdok Del 1–10. S75 ⏸️ + S74 ✅ i egna sektioner nedan.)* (`lifecycle: closed` efter Marcus coverage-kvittens **"Kvitterar 1 och 2"** — coverage inkl. post 3 inget-att-säkra + batch-ordern i samma kvittens) — **EVENT-FAMILJENS EXEKVERINGS-UNDERLAG KOMPLETT: TASK-17/18/19 (familje-PRD:erna ur S72/S73-faciten) + 25 skivor publicerade i beroendeordning.** Skarv-kvittensen + 4 designbeslut Marcus-kvitterade per rekommendation: två befintliga skarvar (api + e2e/axe) · chevron-regeln RIVS öppet (verkställs TASK-18.3) · hemvisten event-familjens skapa-route + Mer-ingången rivs (TASK-19.2) · Anteckningar = ADDITIV tabell (egen ADR vid TASK-18.11) · publiceringsflaggan additiv nu (kontraktet = T79, registerraden synkad). Klartext-avstämningen (L305-fångsten) låste deadline-regeln start − 14 dagar (18.8). Etiketter: ready-for-agent ×22 + QA ready-for-human ×3; DoD-arvet per skiva (L220/L245/L246 + bas-additivitets-grinden); graf-verifierad — tre disjunkta startkedjor (17.1+17.3 ∥ 18.1 ∥ 19.1) = ADR-073-partitions-kandidaterna; prefaktoreringen 17.3 kursfärgs-tokensen delas av kalendern + gruppdynamiken; familje-rivningen 18.13 sist (dep alla 21 bygg). EF-gap-kartan lagd (uppdatera-event · slutbetalning/notering · bekräfta · bor över · anteckningar · närvaro-write saknas — skarpa 6b/6c/6f-ytor finns = ombyggnad). SKÖRD: **L305–L306** (klartext-avstämningen · cache-läsnings-formen; MD018-kandidaten förkastad med motiv). Inga röda runs (docs-only-formen höll ×5). Ingen ny ADR (73==73, nästa 074) · nästa lesson L307 · nästa tråd T80 · fälla 45. BUILD-LOG S74-post + transcript-ref wc-verifierad. **NÄSTA (NY session S75 — HANDOFF + MARCUS BATCH-ORDER ordagrant i sessionsdok Del 4: work-batch · max-kort 22 · två pipelines [P1 lista+skapa: 17.1→17.3→17.2→17.4→19.1→19.2→19.3→19.4 · P2 eventsidan: 18.1→18.2→18.3→18.8→18.9→18.10→18.11→18.4→18.5→18.6→18.7→18.12 · svans 17.5→18.13] · granskningsfärdig-läge; QA-vågen + design-review + prod-deploy = Marcus ikväll · hub-lyftet L284–L306 + T78-hubhalvan; Marcus-moment: Update-klicket i claude.ai.** Full narrativ: sessionsdok Del 1–4. S73 ✅ i egen sektion nedan.)*

> Aktiva uppgifter. Lärdomar fångas i `tasks/lessons.md`.
> Arkitekturbeslut fångas i `docs/decisions/`.
> Implementation-journal i `docs/BUILD-LOG.md`.
> Styrande dokument: [`docs/byggplan.md`](../docs/byggplan.md)

**Session 116 ✅ AVSLUTAD (2026-09-03, AFK på förhandskvittens) — FÖRHANDSGRANSKA KVITTON: LADDNINGSLÄGET PER RAD RÄTTAT, "FÖRHANDSGRANSKA ALLA" SOM ETT DOKUMENT BYGGT TILL STAGING.** Marcus fråga vid start (två rader laddade samtidigt) gav buggen `TASK-369` (delat `isPending` + TanStacks överskrivna per-anrops-callbacks, `#2237`) och ett nytt designarbete: grillning i sex beslut parallellt med research-pass (`docs/research/kvitto-forhandsgranskning-flera-som-ett-dokument-2026-09-03.md`) → PRD `TASK-370` + fem skivor. Landade genom review-loopen: `370.1` EF-komposition (`#2241`), `370.2` försättsbladet (`#2253`, husets första mall utan förlaga), `370.4` knappen (`#2255`). `370.3` (staging-bevis, tak 30 bekräftat) står i `#2264` i STOPPA-OCH-FRÅGA på två ask-user-fynd. Staging har `preview-receipt` v25. **Handover (S117):** Marcus beslut på `#2264` · `370.5` QA-vandring (Marcus facit för försättsbladet) · `TASK-380` layoutfynd · prod-promovering av 370.x efter QA · Update-klicket i claude.ai. **Numrering efter S116:** ADR 131 · kort 381 · L655 (51 fragment) · T184 · session 117. Full narrativ: sessionsdok S116 Del 1 till 5 + BUILD-LOG S116-post.

**Session 113 ✅ AVSLUTAD (2026-09-02, AFK på förhandskvittens) — BILAGESPÅRET OCH BETALNINGSFLÖDET TILL PROD: NIO PAUSER, PIPELINEN I MÅL.** Marcus åtta prod-röktestfynd på bilagespåret drevs till prod (`TASK-338`/`340`/`339`), följt av en grillning om Lottas betalningsrutin (tretton beslut, `ADR-128`/`ADR-129`), en AFK-natt med sex vågor som byggde Postgres-modellen, jobbmotorn, nio Edge Functions, kvittomallen och facit-ytorna, ett natthaveri övertaget utan förlorat landat arbete (tråd `T179`), promoveringen (`#2193`, 44 commits) och prod-driftsättningen (55 Edge Functions, backfill 327 av 882 inbetalningar för 812 000 kr, `INVITE_REDIRECT_URL` rättad i båda miljöer). Resume 9 landade den sista pipelinen (`#2218`/`#2216`/`#2215`) genom review-loopen, en systematisk namnstädning (tråd `T182`) och en 46-minuters agent-loop-incident som gav tråd `T183`. **Handover (S115, S114 finns redan och är pausad, olandad `#2180`):** priserna på 305 anmälningar (backfill om när Lotta ger värden) · `346.12` riv miljöflaggan · `#1883`/`#1926` baseline-godkännande · Dependabot-PR:er · T183-grillningen · `TASK-346.15`/`365`/`366` plockbara · `hem.acceptance.test.ts:313` öppen fråga · Marcus ögonbevis-lista i prod. **Numrering efter S113:** ADR 130 · kort 367 · L655 (48 fragment) · T184 · session 115 (S114 finns, pausad-olandad `#2180`). Full narrativ: sessionsdok S113 Del 1 till 17 + BUILD-LOG S113-post. **Paus 9 var:** (paus 9, 2026-09-02 ~11:00 UTC — kontext 90 %, pre-compact STOPPAD per ADR-101 (andra impulsen), pipelinen medvetet EJ dränerad: `#2215`/`#2216`/`#2218` i review-loop, handoff i sessionsdok S113 § PAUSLÄGE paus 9; prod i nivå: front `2bf26258`, 55 EF deployade 10:49Z, backfill 327/812 000 kr; kort 358–366 + 346.15 + T182). Resume 8 var: (resume 8, 2026-09-02 ~07:25 UTC, `lifecycle: active`;
Marcus: *"Återuppta S113 … jag behöver din vägledning"* → *"Jag vill att du kör
runbooken!"* — **PROD-DRIFTSÄTTNINGEN KÖRD: steg 1–7 + 10 av orkestreraren
(bypass per Marcus diktering), steg 9 av Marcus, steg 14 flaggan PÅ i prod
(bundel-verifierad); `INVITE_REDIRECT_URL` rättad i båda miljöer
(`TASK-359`-PR i bygge); kvar = steg 12/13/15-beslut hos Marcus**; Lotta-demo
I DAG. Full narrativ: sessionsdok S113 Del 16):** paus 8-landningen `#2201` var RÖD
(audit-ci: två browserslist-advisories publicerade efter `main`s sista gröna
körning, patchade i `4.28.7`) → låsfils-bump som egen kod-PR via bygg-agent;
resume 8 + paus 8 landar tillsammans i `#2201`. Numrering re-verifierad
(ADR 130 · kort 358 · L655 · T182 · 23 fragment, inga divergenser).
Handoffen (sessionsdok S113 § Paushistorik paus 8) bär HELA återstoden:
MARCUS-SEKVENS (terminal-blocket steg 1–10, körklart med kommandon) +
resume 8:s autonoma steg (verifiera blocket → steg 14 Vercel-flaggan →
steg 13 backfillen → steg 16 facit → steg 15 röktest-lista) per paus 7-
MANDATET som KVARSTÅR. promoverings-PR **`#2193` MERGAD** (`9dca0e56`, 44 commits —
hela TASK-346-leveransen + steg 1b Förhandsgranska kvitton, vars
"ren frontend"-premiss falsifierades och löstes som sidoeffektsfri
`preview-receipt`-utökning, staging-skarpbevisad 23/23) · `#2192`
(steg 11-skriptvägen + runbook-rättelser, `9c1fced2`) · `#2194` (steg 8-
allowlistens nio EF:er + intern-auth-klassen i ef-metod-vakten, `a2a9b232`)
· `#2196` baselines (36 bilder, själv-blessad per MANDAT, armerad i kön) —
samtliga genom full review-loop (konvergens, sektion, backstopp; hög
mandat-armerad). **Steg 6 UTFÖRT:** alla nio Airtable-prod-fält skapade +
describe_table-verifierade (formeln exakt). **NÄSTA = STEG 7, MARCUS
TERMINAL-BLOCK steg 1–10 (grinden för Lotta)** — allt dukat: runbooken
aktuell (FYRA migrationer), allowlisten landad, prod-fälten på plats.
Därefter per MANDAT: steg 14 Vercel-flaggan → steg 13 backfillen → steg 16
facit → röktest-listan. Bokfört: TASK-357 mintad (seed-review-prisfälten) ·
346.7 redan Done · T180/T181 grillnings-kandidater post-promovering ·
`#2050`/`#2180` väntar Marcus. Full narrativ: sessionsdok S113 Del 15.

---

## Aktuellt fokus

**Session 119 ✅ AVSLUTAD (2026-09-04, AFK på förhandskvittens; `lifecycle: closed`) — MANDATET: 14 BESLUT PÅ MARCUS FULLMAKT, CI-INCIDENTEN (NPM ADVISORY-ENDPOINTEN) LÖST MED EN NÄTVERKSDEGRADERING, 20 PR:ER GENOM REVIEW-LOOPEN TILL STÄNGNING.** Marcus bad orkestreraren sammanställa S114–S117:s samlade handoffs ("skulle du kunna sammanställa vad jag behöver göra") och gav sedan fullt mandat ("Du har mandat att representera mig och fatta besluten som behöver fattas … Fatta besluten, lås upp agentarbete"). 14 beslut fattade med skäl (Del 2): `TASK-381` (stryk skäl-fältet), allowlist-GO för `cancel-registration`/`rebook-registration` (`#2285`, `TASK-385`, prod-deploy avblockerad), Dependabot-armering, `#2269`:s rebasning m.fl. Marcus QA-vandring verkställd parallellt (Del 5): facit-stämpeln `s114-segmentlistan-konvergens` (`#2293`), `368.6` steg 1–8 i staging, `370.5` godkänt efter `TASK-388`-fixen (`#2295`), en felriktad omstämplingsinstruktion korrekt fälld av ADR-102-grinden (`#2294` CLOSED, kvittensen i `#2309`). En CI-incident (npm:s advisory-bulk-endpoint) blockerade audit-steget i `Lint + Audit + TypeCheck` genom fyra timeout-höjningsrundor (`#2288`, `b44fe981`) innan auditen fick ett eget jobb med en smal, tvåvillkorad nätverksdegradering (`#2316`, `TASK-395`, `38429d77`) — en andra granskningsrunda avtäckte att `pull_request.base.sha` är stale mot merge-refens bas när main rör sig i vår fleet. Efter landningen: en re-armeringsvåg av nio PR:er som förlorat sin armering tyst under incidenten (§ Landning "det fjärde läget"), fyra Dependabot-PR:er saknade Riskbedömnings-sektion och granskades separat, och `#2269` (`TASK-379`-rivningen) krävde en fjärde granskningsrunda efter att en stängningsbatch (`#2323`) gjorde kortet `task-379` DIRTY mot dess egen öppna PR — lärdom bokförd: rör aldrig ett kort vars PR är öppen på en annan gren. Två stängningsbatcher (`#2323` → `cf13c59b`, `#2328` → `590e40d9`) flippade tio kort Done och mintade fyra fynd-kort (`396`–`399`) + tråden `T184` (pnpm som ersättare för npm); `#2269` landade sist (`9c7b85d7`) och `task-379` flippades Done i denna PR som ett elfte kort. **Handover (Marcus):** fas4-prod-deploy av `cancel-registration`/`rebook-registration` m.fl. (allowlisten på `main`) · `TASK-368.6` steg 9 i prod · grillningarna 6h/`271`, `T183`, `T184` · `task-338.6` AC #3 + `TASK-384` (Marcus GO) · `TASK-399` (merge_group-klausulen, matematisk no-op) och degraderingens gröna skarpbevis i nästa CI-session · "Update-klicket i claude.ai" är MOOT — `TASK-318`/`#1957` avvecklade rutinen formellt i `CLAUDE.md` under denna session. **Numrering efter S119:** ADR 132 · kort 400 · L655 (67 fragment) · T185 · session 122. Full narrativ: sessionsdok S119 Del 0 till 10 + BUILD-LOG S119-post.

**Session 120 ▶️ ÅTERUPPTAGEN (resume 2, 2026-09-05 16:09 UTC, `lifecycle: active`; paus 2 ~11:50 UTC landad som `#2343` `4e1d81be`; resume 1 10:20–~11:50 UTC; egen worktree `s120-anmalningar-segment`, gren `docs/s120-resume-2`) — FEM TILLÄGG FRÅN MARCUS, FYRA LANDADE, DETALJVYN I ITERATION 3.** Marcus fråga om Mer → Anmälningar-raden (landade på eventets gamla Anmälda-lista) gav `TASK-389`: länkbyte till anmälans sida + rivning av anmalda-ytan, 18.13-skulden betald (`#2313`, `00496403`). Segmentlistans tomläge fick vit platta med streckad ram efter en avslagen punktraster-iteration, `TASK-392` (`#2308`, `95987a47`, facit-amendering s114). Nolläget "Inget kvar att betala" → "Inget att betala" på fyra ytor, `TASK-391` (`#2311`, `b583a2a0`, revision av 2026-09-01-formuleringen, amendering s103). Intresserade som publik: väg A, ADR-115:s domängräns behålls, 6h-grillningen är vägen till demon. **Väntar Marcus stämpel (drafts):** `TASK-390` detaljvyns sju åtgärder + chips på en rad (`#2312`), `TASK-394` eventväljarens stora form som default (`#2319`); skärmdumpar i `~/Desktop/S120-granskning/`. CI-incident: npm:s advisory-endpoint nere, S119:s `#2316` (audit som eget jobb) väntar GO. Fem lesson-kandidater i sessionsdok Del 2 (fork utan isolation, FETCH_HEAD-volatilitet, grep-forensik, vakt-falsklarm, korrupt loggrad). **Resume 1 (2026-09-05):** Marcus stämplade eventväljaren (*"Eventväljaren ser bra ut."*) → `TASK-394` landad `#2319` `e677d3dd` (review lag, facit-amendering s111, 16 bilder i bilagan s120-eventvaljaren-task394). Detaljvyn fick fyra fixar (ikonens fyllnad, rullningslisten rotorsakad: `<ul>` var plattan, grå fyllda räknas-bort-chips, Motsvarar riven) → iteration 3 pushad `8883650c` till draft `#2312`, DOM-mätt, skärmdumpar i `iteration-3/`. `TASK-400` mintat (riv `KopplaTillEventDialog.tsx`). Tre nya lesson-kandidater (Del 4). **Resume 2 (2026-09-05 16:09 UTC):** re-verifiering mot disk i Del 5 — paus-batchen `#2343` grön per jobb; ägarlappen borta och pid 69649 död (huvudkatalogen ledig på `f5de3898`, rörs inte); S121 parallellt med dev-server på 5174; numrering utan divergens. **NÄSTA:** granskningsvyn för iteration 3 ur agent-worktreen (dev-server på port 11299) → Marcus dom → stämpel eller iteration 4 → amendering s104 + aria/baselines → review → landning; `TASK-400` plockbart. Numrering efter S120 resume 2: ADR 132 · kort 401 · L655 (67 fragment) · T185 · session 122. Full narrativ: sessionsdok S120 Del 1–5 + Paushistorik ×2.

**Session 118 ⏸️ PAUSAD (2026-09-04 ~11:20 UTC, paus 2, `lifecycle: paused`; resume 1 10:05–11:20 UTC; egen worktree `s118-apparaten`, gren `docs/s118-paus-2`) — APPARATEN: KARTAN LANDAD, SUBSTRATET GRILLAT TILL ADR-131, GITHUB ISSUES ÄR NYA SUBSTRATET, MINIMALT TEST HALVVÄGS.** Marcus fråga (*"fyra sessioner stod och väntade … Jobbar verkligen proffs så här?"*) → sex read-only-pass → `tasks/threads/S118-apparatkartan-2026-09-04.md` (183 trådar/118 apparat, 786 kort/212 apparat, 55 ADR:er, väntans-kedjan T108→T112→T114→T119→T126, QA-svansen nio PRD:er) + research med förstapartskällor (proffsen väntar inte; kön är 16 s, granskningen är flaskhalsen). Fem tillägg samma förmiddag (kartan § 9): 45-procents-mätningen S113, designiterationens nio former utan takt-regel, tre stående instruktioner utan mekanik, MCP-dom (Firecrawl ja, DevTools finns, Composio/Higgsfield nej), Backlog-CLI:t som fundamental. **Grillning av `TASK-328` → ADR-131:** sanningen flyttar till GitHub Issues (S48-beslutet rivet öppet), öppna kort migreras med TASK-numret i titeln, Done-korten fryses, brytdatum, explicit stängning efter grön post-merge med `Refs #N`, label-policy i tre familjer, tracker-neutrala hub-skills, rivning i två steg. PRD `#2296` + nio sub-issues `#2297`–`#2305` skapade som första issues; bygg-agent levererade `#2306` (label-policyn, 53 tester, 28 labels skapade) — ogranskad, oarmerad. `TASK-328` Done. Skarp cross-session-samordning med S119 via `SendMessage` (tre vinster på en runda). `#2286` armerad men röd på npm-flappen (S119:s `#2288` fixar). **NÄSTA (resume, HANDOFF i sessionsdok S118 § PAUSLÄGE):** landa `#2286` · review + explicit stängning av `#2298` (minimalt test steg 3–4) · grillning 2 arbetsformen (`/grill-me`, indata kartan § 7 p. 3) · korttriage före brytdagen · skivorna `#2299`–`#2301`. **Numrering efter S118-paus:** ADR 132 · kort ≥ 388 (S119 mintar) · issues ≥ 2307 · L655 · T184 · session 118 (pausad).

Resume 1 (2026-09-04 ~10:05 UTC): handoffen prövad mot disk — `main` oförändrad `78de4a7d`, merge-kön tom, 13 armerade PR:er `BLOCKED` av audit-ci-flappen (npm:s rådgivnings-API; S120:s mätning: steget `npx audit-ci` faller med `code undefined` eller hänger till timeout), `#2288` (timeout-höjningen) grön på lint, väntar acceptance-beviset; `#2286` armerad, senaste körning avbruten (`cancelled`), ny körning triggas av resume-pushen; `#2306` ogranskad och oarmerad, röd på samma lint-jobb. Ägarlappen i huvudkatalogen har bytt ägare (pid 69649 sedan 08:05 UTC, S119:s sannolikt; pid 12838 borta); S118 stannar i sin worktree (ADR-090 beslut 2). Numrering re-verifierad mot disk: ADR 132 · kort 390 (`task-389` finns på en S119-gren) · L655 (63 fragment, handoffens "62" var fel) · T184 · issue/PR ≥ 2308. Nästa: minimalt test steg 3–4 på `#2306` (review-agent i färsk kontext, explicit stängning av `#2298` efter grön post-merge), sedan grillning 2 (arbetsformen).

Paus 2 (2026-09-04 ~11:20 UTC): resume 1 landade `#2286` (`b8f87932`, efter S119:s audit-timeout-fix `#2288`) och drev minimalt test steg 3 till armering: `#2306` granskad i två rundor (runda 1 risk hög med ett falsifierat dataförlust-fynd — headen var bakom main med två merge-baser, inte reverterande; rättningsrunda mergade main och rättade "sju"→"åtta"; runda 2 risk låg, konvergerad exit 0), sektion + backstopp gröna, armerad på head `effccc7a`. Steg 4 (stänga `#2298`, bocka AC, friktioner på `#2297`) vid resume efter grön post-merge. Lesson-kandidater 7–10 i Del 4 (bygg-agenter grenar från main; merge-tree före dataförlust-påstående). Marcus: *"Grillning 2 kör vi i nästa resume."* Paus 2-PR `#2317`; `#2306` köad plats 2 vid paus. Numrering: ADR 132 · kort 395 · issue/PR ≥ 2317 · L655 · T184.

**Session 117 ✅ AVSLUTAD (2026-09-03, AFK på förhandskvittens; `lifecycle: closed`) — SEGMENT-STARTSIDAN (B2): K1 → K3 TILL STÄMPELKLAR, FACIT LANDAT, FLIPPEN I PROD, RIVNINGEN DUKAD.** Tog över B2 från S114 i egna worktrees (huvudkatalogen S115:s). Marcus fynd på K1 (*"skarpa vyn är mycket snyggare"*) mättes mot DOM och kod: K2 = skarpa vyns hantverk verbatim + riktningen, K3 = brickor i Hem-mönstret + korthöjd låst 132 px; stämpelbeslut *"Det blir bra, vi stämplar denna som klar."* → facit-manifest (`godkand: null`) + bilder + markör i `#2256` (review 2 rundor, låg). Snabbvägen på Marcus order: EN kort (`TASK-379`, `#2258`), ingen PRD, inga skivor — flippen `#2266` mergad `a587cfab` med prod-deploy `success`, rivningen `#2269` draft (röd på `check-facit` med avsikt tills stämpeln). Falsifierat: "dev-servern måste köra på 5173" — CORS täcker 5174, skarpa vyn hämtar alla EF:er där. **NÄSTA (Marcus, i ordning — HANDOFF i sessionsdok S117 § K-SISTA):** stämpla `s114-segmentlistan-konvergens` via `!` → prod-titt `/mer/segment` → landa `#2269` (backstopp, ready, armera; AC #2 + Done på 379) → beslut spara-delen (`task-271`/`181`/`258`) → 6h-grillningen. **Numrering efter S117:** ADR 131 · kort 380 · L655 (54 fragment) · T184 · session 118. Full narrativ: sessionsdok S117 Del 1–3 + K-SISTA + BUILD-LOG S117-post.

**Session 115 ✅ AVSLUTAD (2026-09-03, AFK-läge på Marcus mandat; `lifecycle: closed`) — AVBOKNING/OMBOKNING I APPEN LANDAD, PROD-INCIDENTEN CECILIA FÖRKLARAD, RIM 3-FYNDEN RÄTTADE.** Prod-incidenten (inbetalning försvann ur inkorgen = flikens minne, `TASK-367`) + prod-Postgres-läsväg (bypass per kommando, research: stående läsroll) → grillning i elva beslut → PRD `TASK-368` + sex skivor. Landat: `368.1` räknarfixen i prod (`#2232`, 213.8/213.9 Done) · `368.2` operationen `cancel-registration` (`#2236`) · `368.3` Avboka/Återta på anmälans sida (`#2246`) · `368.4` **ADR-130** + `rebook-registration` (`#2247`, hög risk, Marcus GO, 3 rundor) · `368.5` ombokningssteget (`#2267`, 3 rundor, Opus→Sonnet-tier-avvikelse vid endpoint-överbelastning bokförd) · `TASK-382` heading-fix (`#2272`) · RIM 3-fynden `TASK-372` (`#2244`, hög risk, Marcus GO) + `TASK-373` (`#2245`) · CI-timeoutfixen `TASK-383` (`#2278`, 12→20 min, fyra `cancelled`-avbrott). **SKÖRD:** 5 fragment i `tasks/lessons.d/` (3 `[UNIVERSAL]`) — mätning som inte isolerar mekanismen bevisar fel sak · icke-ASCII-sökvägars quotepath-fälla i konfliktlösning · `cancelled` vs `failed` i ett CI-jobb utan headroom · kortets facit-manifest måste verifieras mot ytan, inte ur minnet · Opus-överbelastning under bygge räddas via WIP-diff ur den döda worktreen. **NÄSTA:** `368.6` QA-vandring (Marcus) · prod-deploy av `cancel-registration`/`rebook-registration`/`create-registration`/`get-event` + de sex betalnings-EF:erna (Marcus, fas4) · `TASK-381`-beslutet (skäl-fält, Marcus) · `TASK-383` · `TASK-378` (purge-sentinelns blanksteg) · omstämpling av anmälans detaljsida.
368.7 (pris i get-event + prisbesked före bekräftelse): PR #2280, Opus, review risk låg, konvergerad och armerad; staging-EF:erna get-event/get-events/update-event deployade av orkestreraren. Se Del 7 § 368.7.
**Numrering efter S115:** ADR 131 · kort 384 · L655 (59 fragment) · T184 · session 118 (S116 och S117 redan landade och stängda under samma dag). Full narrativ: sessionsdok S115 Del 1–7 + BUILD-LOG S115-post.

**Session 114 ✅ AVSLUTAD (2026-09-03, AFK på mandat) — SEGMENT OCH
INTRESSERADE: VÅG A, VÅG B-SAMSYN, B3 FRÅN KONVERGENS TILL PROD.** Marcus
sex punkter om Segment-ytan och Intresserade-sidan drevs som våg A
(mekaniska fixar, `TASK-348`/`349`/`350` Done) + våg B-grillning (sju
kvitterade beslut, Del 3 — intresserade blir ALDRIG segment, ADR-115 §
Updates). B3 (Intresserade-listan) itererades K1→K3 mot prod-mätning
(112 intresserade, 63 namnlösa) till stämplat facit (`b391dffe`) → PRD
`TASK-374` + fem skivor, promoverade på fullt mandat (*"Du har mandat
att bedöma skarvarna och gå vidare."*): `374.1` (`#2248`→`bb793c86`),
`374.2`+`374.3`+`374.4` hopvikta i en landning (`#2263`→`2df040c6`,
anmälningssidans precedent), `374.4` AC #4 via riktad baseline-PR
(`#2273`→`6a70368b`), `374.5` QA i staging (prod-punkter som kräver
inloggning öppna åt Marcus). Prod-deployment `6245094695` success
13:34 UTC — B3 är i prod. B2 (segmentlistan) togs över av S117
parallellt. **Handover:** dubblett-e-posten i prod-basen
(`Kallewestholm@hotmail.com`) · prod-QA-punkterna i `374.5` · VoiceOver-
stickprovet · 6h-/`271`-grillningen · `#1883`/`#1926` baseline-PR:er ·
Dependabot `#2050`/`#2159`/`#2160`/`#1826` · T183/arbetssätts-
effektiviseringen (Marcus: *"vi har planerat att kolla på hur vi jobbar
för att kunna effektivisera"* — instansdata bokförd på `T183`).
**Numrering efter S114:** ADR 131 · kort 383 (`task-380` saknas som
fil, mätt gap, ej utrett) · L655 (57 fragment efter denna landning) ·
T184 · session 118. Full narrativ: sessionsdok S114 Del 1–6 + Avslut
K-sista + BUILD-LOG S114-post. **Paus 1 var:**
(paus 1, 2026-08-31, AFK-mandatet slutfört — nästa steg Marcus
granskning; landningen olandad fram till resume 1, `#2180`). **Resume
1 var:** (resume 1, 2026-09-03 — paus-landningen `#2180` hade ALDRIG
nått `main` [CONFLICTING, 119 bakom], rebasad och landad; B3 itererad
K2–K3 till stämpelklar, facit landat i `#2233`).

**Session 113 ✅ AVSLUTAD (2026-09-02, K-sista på Marcus förhandskvittens; `lifecycle: closed`; block nedan är historik från resume 5, 2026-08-30 ~19:00 UTC, `lifecycle: active` vid den tidpunkten;
Marcus: *"Återuppta S113 och kör nattens mandat"* — AFK-NATTEN KÖRS: PRD `TASK-346` Lottas
betalningsflöde, skivor 346.1–346.13 i våg 1–7 mot staging per sessionsdokets HANDOFF (paus 5,
nu Paushistorik) med nattmandat B3/B4; löpande läge i Del 12; Marcus promoverar på morgonen;
paus 5 var 2026-08-30 ~18:50 UTC) — DOKUMENTYTAN BLEV BILAGOR: KORTFORM, ⋯-MENY, HANDLINGSRAD,
BILAGA-SUBSTANTIVET — LANDAT OCH VERIFIERAT I PROD.** Marcus tre anmärkningar
före vandringen (T176 · "Event-mallad" · knapparna) → orkestrerarens
designbedömning mot prod (sex fynd: listan saknade hierarki) → Marcus GO
(*"Gör om direkt i prod"*, sedan kortform + "bilaga" som substantiv +
Mer-fliken "Bilagor", explicit kvittens på att höjdlåsets separator-halva
rivs) → *"fullt AFK-läge … Gör detta ORDENTLIGT!"*. Elva commits, PR `#2123`
(26 filer), två granskningsrundor (risk låg, loop konvergerad), backstopp
grön, landade `50c6493d` 22:17Z, Vercel prod success 22:18Z, **prod
verifierad med eget skript + egna ögon** (h1 Bilagor · Skapa bilaga · kort
124 px · ingen filterrad · inget Event-mallad). Hookens kod byte-identisk
med main. Beslut under mandat: kvittots Ladda ner utgår · URL kvar ·
rullningsskugga · en-radsnamn på mobil. `T176` stängd · `T178` ny (HMR) ·
`TASK-309.42` Done · 4 lessons-fragment (13 totalt) · ORDLISTA § Bilaga.
**Numrering:** ADR 128 (346.1 mintar 128+129) · kort 347/346.14 · L655 · T179 · 20
fragment (RÄTTELSE: resume 4:s "20, inte 19" var fel — README räknades; 19 stämde, nu 20
efter lagrum-fragmentet) · session 113 (disk-verifierat 2026-08-30 ~19:00 UTC, resume 5 — inga divergenser). Fyra skivor i prod
(`01c84076`: 309.43/44/45/46), Marcus: *"nu funkar det perfekt"* efter
rensad site data. **Resume 4 levererat (Del 10):** appvandring (31 skärmdumpar, 6 klick till knappen,
7 klick + 1 belopp per kvitto, ≈143 för en kurs) + branschresearch (SFL 39:5 verifierat,
Pretix ordagrant) + `docs/research/kvitto-beslutsunderlag-2026-08-30.md` + artefakten
*Lottas kvittovandring*. **Grillningen KÖRD (Del 11):** tretton beslut kvitterade — Inbetalningar-tabell i
Supabase Postgres + spegel i basen, global inkorg, registrera-först-skicka-sedan, kö + cron +
kick, Swish-import från början, kreditkvitto i v1, universell härledning + backfill; tre
research-pass + adversarial verifiering (sju blockerare, vågordning). Marcus: *"B4 ja, B3 ja"* → PRD `TASK-346` + 13 skivor (`#2141`). **NÄSTA:**
NATTENS MANDAT pågår (sessionsdok § Paushistorik paus 5 + Del 12): våg 0–2 KLARA (`346.1`–`346.3`
Done; ADR-128/129 + basen + Postgres-schemat landade och skarpt bevisade i staging — 5 granskningsrundor
på #2147, 7 verklighetsfångade buggar fixade; morgonpunkt: radera ERSATT-fältet) → våg 3 KLAR (`346.4`
Done `5b9ded1a`: nio EF:er deployade, kedjebeviset grönt i sex steg, 3+3 granskningsrundor;
TASK-347 mintat) → våg 4 KLAR (`346.5`/`346.6`/`346.8`
Done — kvittomall 0,23 mm, inkorgen med staging-vandring, backfillen efter 4 granskningsrundor
inkl. prod-preflight + förekomst-grind; datafynd: staging saknar priser utanför ZZ) → våg 5 KLAR (`346.7`
landad f575d4d1 — Hem/Åtgärder/anmälan/personkort bakom flaggan, 4 sidofiler, 3 egna vandringsfynd
rättade; `346.11` Done — morgon-runbook 16 steg + färdig checklista) → våg 6 pågår (`346.9` ‖
`346.10`) → våg 7: slutvandringen → paus 6, seriell staging-applicering, `hog` armeras bara vid
konvergerad loop, slutvandring i browsern före paus 6 → morgon: Marcus tittar, justerar, promoverar (prod-fält,
prod-Postgres per runbook 346.11, EF-deploy, flagga, backfill-GO, facit-stämplar) → veto-lista (Marcus: "vi släpper det lite"; +
ny version-kontroll vid flik-fokus?) (strängbytena i `93dbf275`, tomytan under
fyra-korts-låset vid 2–3 bilagor — `min(4, n)` föreslaget, URL-bytet som
kort) → prod-vandringen (testplanen delvis inaktuell efter formbytet) → domar
`340.5`/`340.4` → skörd (17 fragment) → arbetsforms-grillningen (Del 9 §
Tidsfrågan) → `session-end` (114). Arbetssätts-frågan (45 %
bokförings-PR:er, 38 % eskaleringar) är en grillnings-kandidat, Marcus start.
HANDOFF: sessionsdok S113 § PAUSLÄGE (paus 4). Full narrativ: Del 1–9 (+ tillägg).

**Session 112 ⏸️ PAUSAD (paus 3, 2026-08-28 ~16:30, `lifecycle: paused`; resume 2 körd AFK på
fullt mandat — "du bestämmer") — AFK-VÅG 5 LANDAD: FLASKHALSEN BRUTEN, REVIEW-GRINDEN MEKANISK,
REGISTRET RENT.** 21 S112-PR:er + hub-lyft `marcus-system#18`. **Mått:** issues 42 → **1** ·
grenar 178 → **29** (trigger i heartbeat, `#2042`) · fragment 121 → **0** (L570–L654, vol-08) ·
pausade dok 8 → **2** (sex stängda via scope-överföring → `TASK-332`, 56 Ö-punkter) · nightly
3/5 gröna (kvar länkröta `254` + closure `241.5`/`284.4` = Marcus) · Backlog.md 1.50.1 ·
CI-backstoppen live på merge_group-ytan (`#2049`, första fällning på egen batch) ·
instrumenteringen (`#2052`) · hooken läser mål (`#2044`, HÖG→låg) · `TASK-334` attribution ·
`TASK-336` disallowedTools (AC #3 = ny session) · AC-komplettering 12/10/1. **Marcus-listan**
`tasks/marcus-listan.md` (41 punkter) + artifact. **Numrering:** task-337 → 338 · ADR 127 → 128
· L654 → L655 · T176 · fragment 0 · session 112. **NÄSTA:** resume → `336` AC #3 (ny agent) +
`323` AC #2 (≥ 24 h) → Marcus-listan → session-end med skörd (kandidater 25–50). HANDOFF:
sessionsdok S112 § PAUSLÄGE (paus 3). Full narrativ: Del 7–8.

**Session 112 ▶️ ÅTERUPPTAGEN (resume 2, 2026-08-28, `lifecycle: active`) — ORKESTRERARE +
PROJEKTLEDARE PÅ FULLT AFK-MANDAT: BORT FRÅN FLASKHALSEN, TILL ETT RENT REPO.** Marcus
order: *"Återuppta S112 … vad ett RENT och städat läge skulle vara"* + rollen antagen
(*"Antar du den?"* / *"du bestämmer"*). Huvudkatalogen ägs av S108 resume 13 (pid 77130) —
S112 i `s112-stadsessionen`, gren `docs/s112-resume-2` från `7a0a2a46`. `#2012` landad
`27db4d69`. **Numrering mot disk:** task-330 → 331 · ADR 127 → 128 · L533 · **121 fragment**
(handoff sade 112) · T176 · session 113. **Triagen (Del 7, fyra läs-agenter):** nightly rött
3 nätter × 5 jobb = fyra registerhygien-skulder + en fixturdrift (`datum`/`eventmatchning`,
saknar kort) · 42 issues = 42 bot-larm (27 post-merge, 13 ci-natt i obruten följd, 1 lankrota)
· 8 pausade dok: S92/101/107 absorberade, S96/98 delvis, S99 genuin · backlog 168 öppna =
STOR inte smutsig (5 landade-ej-flippade, 24 utan AC, `213` obörjad = S113) · trådar 131/175
öppna, OAVGJORT T01/T17/T19 nu 67–75 d · **178 grenar/154 mergade** (åter sedan 310) ·
**flaskhalsen: planen finns, 327/323/322 obyggda, 328 väntar Marcus; view 130 s under last.**
**Beslut (Del 7):** restsamlingen = PRD-kort med referens per scope-punkt + scope-överföring
som stängningsform (ADR-052-amendering) · larm-issues stängs med motivering · grenstädning
från worktree som 323:s skarpbevis. **NÄSTA (AFK-våg 5): 327 → 323 → 322 · nightly-städ
(arkivering, fixtur, 223) · larm-issues · restsamlingen · 173.4/173.6 · AC-komplettering ·
grenstädning · Marcus-moment orörda (325 · 37 · 326/328/330/254 · bilder · #1957 · dependabot
· vandringsblocket).** Full narrativ: sessionsdok S112 Del 7.

**Session 112 ⏸️ PAUSAD (paus 2, 2026-08-26 ~07:45, `lifecycle: paused`; resume 1
körd AFK på fullt mandat) — FIX-VÅG 4 HELT LANDAD, REVIEW-GRINDEN 173.1–173.5
I DRIFT, FLASKHALSEN UTREDD.** Marcus order: *"Återuppta S112 …"* + kvittens *"Gör det du anser
vi behöver göra. Var noggrann och chansa aldrig."* **Paus-PR `#1969` landad**
(`origin/main` `60b5e659`). Huvudkatalogen ägs av **S108 resume 11** (levande,
pid 23064) — S112 kvar i `s112-stadsessionen`, gren `docs/s112-resume-1`.
**Numrering re-verifierad mot disk:** task-**320** → 321 · ADR **126** på main
(127 = `#1932`, EJ landad) · **L533** · 90 fragment · **T176** · session
**112**. **Avvikelser mot handoffen:** `#1932` var ALDRIG i kön — noll CI på
head (stackad PR auto-retargetad till `main` utan `pull_request`-event; fix =
commit på grenen) · closure-grinden **15/650** (`190`/`193` = S112:s egna
flippar utan `Landning:`-pekare, dolda av karensen) · review-agent-skulden
**BETALD** (typen laddades mitt i sessionen; utlåtande för `#1932`: risk låg,
2 info). **Del 5 (05:30, AFK på mandat): fix-våg 4 LANDAD — 17 PR:er, 27 kort;
closure-grinden 2/661 (bara dina domar 241.5/284.4); `TASK-322`–`328`
mintade; flaskhals-research landad (globalt create-lås, 2/8 vid 8 agenter);
18 lessons-fragment.** Kvar i luften: `#1992` (G, fix) · `#2000` (kö) ·
`173.5` (Opus). **NÄSTA: 173.4/173.6 + stängnings-batch 3 · Marcus-moment:
`TASK-325` prod-deploy · `TASK-326`/`328` beslut · granskningsfärdiga 22/222/223 ·
`#1883`→`#1926` · `#1957` · vandringsblocket.** **Del 6 + PAUSLÄGE (07:45):** #1992/#2000/#2007/#2009/#2010 landade;
`#2012` i kö; closure 2/663; `TASK-329`/`330` mintade; loop-policyfrågan
öppen. HANDOFF: sessionsdok S112 § PAUSLÄGE — Marcus-momenten (325 prod-deploy ·
37 audit · 326/328/330 beslut · 22/222/223 Done-flippar · bilder · #1957),
nästa AFK-våg 173.4/173.6/327/322–324/329. Återupptas via `session-resume`.
Full narrativ: sessionsdok S112 Del 4–6.

**Session 112 ⏸️ PAUSAD (paus 1, 2026-08-25, `lifecycle: paused`) — STÄDSESSIONEN:
REGISTRET SANT, REPOT RENT, ROTORSAKER.** Marcus fullt beslutsmandat ("Go
på alla", 2026-08-24), körs autonomt i worktree `s112-stadsessionen`
(S108 äger huvudkatalogen). Levererat hittills: closure-grinden 38→4
S112-klassade röda · grenstädningen 289→54 · **A2-bågen komplett i prod
(61 fällor desarmerade, fälla 21 STÄNGD)** · 193 kort triagerade · 6
förkastade + 13 stängda · DoD-mekanismen väg iii + `ADR-127` ·
review-grindens skiva 1 · prototyp-substraten rivna · kontrast-vakter +
affordans · två paket bort · hub `vol-07` + do-work-mallen ·
S113-dukningen klar (`docs/reference/s113-basmaxning-dukning.md`).
**ACTIONPLAN + full landningstabell: sessionsdok S112 Del 2** (kö-svans +
flip-batch + slutmätning · fix-våg 3 · vandringsblocket efter Marcus
bildgranskning `#1883`→`#1926` · session-end med skörd). **S113
RESERVERAD för Airtable-fönstret.** claude.ai-projektkunskapen LÄMNAD
(TASK-318) — inga Update-klick-moment framgent. **PAUSAD 2026-08-25 efter
att HELA actionplanen exekverats** (Del 2–3 + slutmätning 14/643 noll
oskötta; A2-bågen komplett i prod). HANDOFF: sessionsdok S112 § PAUSLÄGE
— Marcus-momenten dukade (bilder #1883→#1926 · #1957-draften ·
vandringsblocket · småbesluten), #1932/dependabot-verifikat +
heartbeat-omstart är resume-steg 1. Återupptas via `session-resume`.

**Session 111 ✅ STÄNGD (2026-08-23, K-sista i AFK-läge på Marcus mandat; `lifecycle: closed`) —
ANMÄLNINGSSIDAN I PROD: KONVERGENSPASSET HELA VÄGEN, BEVAKNINGSRADERNA I NY
ANATOMI, SIDRAMEN SOM FAMILJ.** `main` `e1470eb0` = Vercel Production, bundle-
identitet verifierad på `admin.miranon.dev`. Landat: `TASK-299` PRD med
`299.1`–`299.9` + `299.11` Done (`299.10` öppen på steg 10 kontrast, `299.11`
AC #6 väntar omstämpling, PRD:n därmed öppen) · `291` + `303` Done · `ADR-126`
och spec § 23 · ordbytet `Eventinfo → Deltagarinfo` · `L522`–`L532` i ny `vol-07`
(hub `K111.1`–`K111.11`) · `TASK-311`. **Handover (S112):** `#1883` baslinje-PR
(Approve + granska 14 bilder) · omstämpla `s106`/`s102-dokument` · kontrast-
täckningen (scope) · lessons-markörens åtta former (hub-plugin) · hub-`vol-07`
före nästa lyft · `check-backlog-closure` röd på 38 äldre kort · `T172`/`297`,
`293`, `294` · klicka **Update** i claude.ai. Full narrativ: sessionsdok S111
Del 1–7 + BUILD-LOG § Session 111.

**Session 110 ✅ STÄNGD (2026-08-22, K-sista; `lifecycle: closed` efter Marcus coverage-kvittens) —
KALENDERLÄNK-DRIFTEN: F.2-ROTEN LOKALISERAD, 64 FELMATCHADE → 0 I PROD,
VAKTEN LÅST I `ADR-122`, FAMILJEN BYGGD 3/4.** Egen worktree `s110-kalenderlank-driften` (S109
äger huvudkatalogen). **Rotorsak** (fälla F.2, öppen sedan 2026-04-26):
Elfsight-kalenderwidgetens **handskrivna** anmälningslänkar på miranon.se —
Roger duplicerar poster utan att redigera URL-parametrarna; `"10"` →
orphan, `Event-10` → A1 matchar TYST fel event. **Mätt över hela basen**
(304 Huvudformulär-anmälningar): 1 orphan + 64 felmatchade, 52 av dem
obekräftade sedan maj under ett genomfört mars-event; April-saneringens
Event-11-länkning var själv fel (→ Event-60). **Städat (Marcus GO per
steg):** Event-62/63/64 skapade · 61 anmälningar omlänkade · ~124
Deltaganden flyttade/skapade · A7-restlistor · kontrollsvep MISMATCH 65 → 4
(3 väntar Lotta + 1 harmlös), ORPHAN 0, Deltaganden-konsistens 1 777/1 777.
Landat: `#1673` `fd349ac4` · `#1677` `7df69087`. `T158` (omnumrerad efter
kollision med S109:s T157) · `task-232` AC 1–3 · F.2/Lucka 10 omskrivna ·
tre lesson-fragment. Lotta-underlag + text levererade till Marcus.

**Del 3 — VAKTEN GRILLAD OCH LÅST (`ADR-122`).** Fem frågor, Marcus
kvitterade helheten. Rotfixen görs (`AnmälningsURL` ur basen) **och** vakten
byggs — en rutin som brustit tre gånger är ingen grind. A1 **vägrar länka**
vid avvikelse (fail-closed by construction: kraschar skriptet blir `Event`
tomt, det enda som överlever `P16`s tysta automations-korruption); avvikelsen
bärs av ett **formelfält**, inte en flagga; tomt = *kan inte avgöras*; scope
`Huvudformulär`. Appen får en **åtgärdskö** med alla tre delarna — kö, markör
och resolution via ny `relink-registration` (sätter `Event` OCH `EventKey`,
fälla 9:s idempotenskrav). FYNDEN som gjorde det billigt: facit och påstående
ligger redan sida vid sida i `Anmälningar` (fyra lookup-fält finns, `Datum
(visas i länk)` bär exakt formulärets sträng → ren strängmatchning), och
**formen på Hem finns redan** — `Bevakningsrad`, Marcus-låst sedan S102.
Driftdetektorn mot Elfsight **lyft till `T159`** som medvetet bortval.
Landat: `ADR-122` · `ORDLISTA` **Åtgärdskö** · `DESIGN-SYSTEM-SPEC` **§ 22**
(familjegräns mot §21: arbetsobjekt är INTE notiser) · `T159`.

**Del 4 — EXEKVERINGSUNDERLAGET KLART, BYGGET GJORT AUTONOMT.** `TASK-284`
med **sex kort** (PRD + fyra skivor + QA + prod-utrullning). Skarv-valet:
**tre BEFINTLIGA skarvar, noll nya testfiler** — alla tre bär redan mönstret.
**Fyra mätningar mot prod** stängde fyra av fem öppna poster: `Startdatum`/
`Slutdatum` ÄR uppslag (arrayer) · anmälan **ID 21** är en levande
tvåfältsfixtur (formulärtext RIM 1 Rönninge mars mot event RIM 2 **Varberg**
februari) · de falska positiva mätta, och tröskeln kräver normalisering av
tre klasser (skiftläge, mellanslag kring tankstreck, **upprepat årtal**) ·
**A1 läst live → `schema_reference` falsifierad på TVÅ punkter**, varav den
ena styr bygget: kopplingssteget är OVILLKORLIGT, så vakten måste **ERSÄTTA**
steg 1–2 — en validering före det är fail-**OPEN**. Daterad mätnot landad.
**OMKLASSNING på Marcus order:** staging-basen `apphjj8Q7lkXCMsL4` är en
strukturell kopia (alla 11 automationer, **identiska ID:n**, undeployed) →
prod är en utrullningsfråga, inte en byggfråga. `284.1`–`284.4` blev
`ready-for-agent`; `284.6` prod-utrullning bröts ut som `ready-for-human`.
Landat: `#1684` `378b4f62` · `#1686` `9df1ccbe` · `#1690` armerad vid paus.

**Resume 2 + Del 5 (2026-08-21):** handoffen prövad mot disk (`#1690`/`#1691`
landade), självmotsägelsen i `284.1`/`284.2` riven (`#1695` `e703c564`).
**`TASK-284.1` byggd autonomt mot staging och STÄNGD** — `#1698` `af349d83`,
stängning `#1708` `37a1d8f6`, DoD #3 verifierad mot post-merge-körning
`32483469976` (grön på ALLA jobb, inkl. `Staging (API + E2E)` som står
`skipping` i PR-grinden med avsikt, `TASK-70.3`). **Tre fynd registrerade:**
`T161` (`ADR-122` § Fynd 1 felkarakteriserar `Event (namn)` — en jämförelse
mot det fältet vore en tautologi) · **fälla 52** (`Deadline slutbetalning`s
undantags-gren är död kod, valalternativet heter `"Ej relevant (för
föreläsningar)"`; samma döda test i `Slutbetalning status visuellt`; 0
prod-poster i endera felläget, alltså latent) · lärdomsfragment om
trådnummer-kollisionerna (fjärde på tre dygn; `T161` kolliderade skarpt och
`ADR-081`s landnings-regel avgjorde — den andra numrerade om till `T162`).

**Del 6: `284.1`/`284.3`/`284.4` DONE och landade. `284.2` BLOCKERAD** — MCP-ytan
kan inte skriva `customScript`-noden som `ADR-122` beslut 5 kräver
(`update_automation` → `isValid:false`/`readOnlyNodeType`; nodtypen finns inte i
NÅGON katalog i `get_create_automation_instructions`, 1 618 rader, egen
kontroll). Skriptet är ändå skrivet och bevisat i båda riktningar
(`docs/reference/automation-scripts/a1-eventmatchning-vakt.js`); A1 orörd och
`undeployed`, verifierad efter försöket. `#1722` står som DRAFT.

**PAUSAD i väntan på TVÅ MARCUS-BESLUT, I DENNA ORDNING. (1) `T168` — datum-axeln stryker
ALLA årtal, så `12–13 september 2025` och `…2026` ger `OK`. Rör LANDAD kod
(`284.1`:s formelfält driver markören och kö-räknaren) och det ännu ej
live-satta `284.2`-skriptet; rekommendation: jämför årtalens MÄNGD separat.
(2) `T167` — väg för att få vakten live (klistra in skriptet i Airtable-UI:t ·
omklassa till `ready-for-human` och foga in i `284.6` · byt hemvist och riv
`ADR-122` beslut 5). Ordningen spelar roll: går vakten live oförändrad blir
det två omgångar.** `284.5` QA · `284.6` prod · `284.4`:s
DoD #6 (facit-amendering) — alla MARCUS-moment. Öppet: Event-18:s falska positiv ej lokaliserad · Lottas
fyra besked · **Marcus: kalenderlänkarna på miranon.se + Lotta-texten** ·
`task-232` → Done vid stängning. Numrering vid paus, disk-läst mot `2682457a` — RE-DERIVERA
ALLTID i mint-ögonblicket (SEX trådnummer-kollisioner i klustret under
passet): ADR **124** · tråd **T169** · kort **288** · **L512** + 62
fragment · fälla **53** · session **111**. Full narrativ: sessionsdok
S110 Del 1–6 + paushistoriken. **RESUME 3 (2026-08-22):** `#1736` landad
(`aba0d61b`), worktreen ff-synkad på `docs/s110-resume-3`; numreringen
**re-deriverad mot disk och oförändrad** på varje post (ADR 124 · T169 ·
kort 288 · L512 + 62 fragment · fälla 53 · session 111) — ingen
mellansession förbrukade något. Ägarlappen på huvudkatalogen tillhör nu en
TREDJE session (`03bc2d12-…`, PID 28332 levande) — orörd, arbetet fortsätter
i egen worktree. `#1722` kvar DRAFT+CLEAN som avsett. **NÄSTA: de två
blockerande Marcus-besluten i ordning — `T168` (datum-axelns årsblindhet,
rör LANDAD kod) sedan `T167` (vägen som får vakten live) — inget bygge
startar före dem.** **DEL 7 (2026-08-22): BÅDA BESLUTEN FATTADE OCH
VERKSTÄLLDA — VAKTEN ÄR LIVE I STAGING.** `T167`: verktygsgränsen mätt i
TRE former (skapa · uppdatera med bevarad key · placering) — samtliga
`readOnlyNodeType`, ingen skrivning skedde; Marcus klistrade in i UI:t
(väg 1) och A1 står nu `deployed`. Två UI-fällor bokförda: input-variabler
VISAS i Properties men SKAPAS bakom `Edit code`, och namnet är
skiftlägeskänsligt (`anmID` ≠ `anmId`). `T168`: rättad, RIVEN, rättad igen
— första formens `REGEX_EXTRACT` gav **`#ERROR!` på VARJE rad med
Event-länk och tomt `Datum`** (Airtables `AND()` kortsluter inte), mätt på
befintlig staging-data; ersatt med kollaps-i-normaliseringen som inte kan
fela. Verifieringen missade det för att ingen av de fyra fixturerna hade
tomt `Datum`. **`TASK-284.2` STÄNGD** (`#1722` `e885fb6b`, stängning
`#1758` `70c5ac81`, post-merge grön per jobb) efter SEX fall ände-till-ände
i staging: rätt uppgifter länkas trots alla tre formateringsklasserna · fel
år fälls · fel ort fälls · okänd nyckel fälls · express passerar med
skriptet helt tyst · nyckel utan prefix normaliseras. AC 8 är STRUKTURELLT
bevisat (A3 avstängd; dess trigger kräver `Event isNotEmpty`). Mätgräns:
bara A1 är på i staging → passet mäter A1 ISOLERAT, ej kedjan A1→A2→A3.
**ROTFIXEN PÅ MIRANON.SE ÄR GJORD** (Marcus, 2026-08-21) → `284.6`:s
förutsättning uppfylld. `T169` mintad (CLS-flake på `main`, S109:s yta).
QA-planen justerad mot mätning: **steg 8 hoppas över** (tio av köns tolv
rader är andra sviters permanenta fixturer; tomma läget redan
acceptance-testat) och **steg 6 läses mot `ZZ-TASK-284.1 Fixtur OK`**, ej
Event-59 (prod-rader). **NÄSTA: `284.5` QA-vandringen (Marcus) — tyngdpunkt
steg 7/9/10 → `284.4` DoD #6 → `284.6` prod i låst ordning fälten →
kontrollsvep → A1 SIST.** Prod ORÖRD hela passet; mandatet givet men ej
använt. Numrering vid paus 4 — **serierna rörde sig UNDER passet**
(`T170` + `task-288` togs av andra sessioner): ADR **124** · tråd **T171** ·
kort **289** · L512 + 62 fragment · fälla **53** · session **111**.
**RESUME 4 (2026-08-22):** `#1761` landad (`e12eb144`), worktreen på ny
gren `docs/s110-resume-4` från `origin/main`; numreringen **re-deriverad
mot disk och oförändrad** på varje post (ADR 124 · T171 · kort 289 · L512 +
62 fragment · fälla 53 · session 111) — ingen mellansession förbrukade
något. Ägarlappen
(`03bc2d12-…`, PID 28332 levande) orörd, arbetet fortsätter i egen
worktree. `284`-familjen oförändrad. Heartbeat ej startad (inga egna
poster i luften). **NÄSTA: `284.5` QA-vandringen — Marcus moment.**
**DEL 8 (2026-08-22): QA-VANDRINGEN PÅBÖRJAD — TVÅ FYND, ANMÄLNINGSSIDAN
BLIR EGEN ARBETSENHET.** `#1765` → `e2c1a2d7`. Marcus första titt gav två
fynd, båda nya kort per `284.5` AC #2: **`TASK-291`** — åtgärdskö-raden är
visuellt IDENTISK med eventinfo-raden (samma tokens, ingen ikon;
placeringen är låst per `ADR-122` beslut 7, formen öppen; notisfamiljens
varningsfärg är FEL verktyg per beslut 8/§22) → litet divergenspass,
**blockerar `284.4` DoD #6**. **`TASK-292`** — klicket leder till Fas 1-
anmälningssidan (`/mer/anmalningar?visa=atgardskon`, aldrig facitstämplad,
aldrig konvergerad, inget kort planerade det) → egen arbetsenhet EFTER
`284.6`, egen session, grillnings-kandidat med tre disk-mätta frågor (ingen
delad vy-grund: `Sidhuvud` kopieras · initial-cirkeln i 2+2 kopior · Mer-
familjens fem sidor). **INTE utvidgning av 284** — vaktens prod-värde är
oberoende av sidans form. Kortnumren rörde sig igen (289/290 tagna av andra
grenar → 291/292). **NÄSTA: steg 7 (kastbar post krävs — köns 12 rader är
fixturer) → 9 → 10 → `284.6` prod → grilla `TASK-292`.**
**DEL 9 (2026-08-22): `284.5` QA-VANDRINGEN GENOMFÖRD — 6/7/9/10 OK av
Marcus** (7: kastbar post ID 5540, A1 vägrade, resolution i appen satte
Event + EventKey i samma skrivning, OK, städad; 9: enda skillnaden är den
dokumenterade hover/etikett-amenderingen 2026-08-17; 11 delegerat till
`284.6` AC #2). AC #1–2 bockade; Done-stängning följer efter grön CI.
`T169` instans 2 (`22b543bb`, docs-only, CLS-flake) bokförd på indexraden.
**NÄSTA: `284.6` prod — fälten → kontrollsvep (STOPP-grind) → A1 sist,
Marcus GO per steg.**
**DEL 10 (2026-08-22): `284.6` STEG 1 GJORT — FÄLTEN I PROD, KONTROLLSVEPET
FANN EVENT-18.** Marcus GO; `Datum (from Event)` `fldho1zlmKxT4gZ0o` +
`Eventmatchning` `fld40RI3Jf7RaHpTa` (staging-formeln verbatim, tre ID:n
ommappade, strukturellt identisk). Kontrollsvep 5 Avviker mot väntat 4 →
STOPP: 21/22/23 (Lotta) + 960 (harmlös) + **197 = Event-18:s falska positiv,
LOKALISERAD: `14–15+maj+2026`, URL-kodade mellanslag**. Appens resolution
kan inte lösa sådana (sätter inte Datum-texten). Marcus väg (c): datat
rättat för 197/960 med spårbarhetsrad → prod-kön **3** (exakt Lottas);
återfallet som **`TASK-293`** (+ → mellanslag i formel + vakt + fixtur).
`data-model.md` bär nu båda basernas ID:n. AC #1–2 bockade. **NÄSTA: steg 2 —
A1 i prod (AC #3), Marcus i UI:t per `T167`, nytt GO → skarpt prov (AC #4)
→ städning (AC #5).**
**DEL 11 (2026-08-22): VAKTEN ÄR LIVE I PROD.** Marcus bytte A1 i UI:t
(`T167`-vägen); verifierat via API: skriptsteg `wac9BCTqQeSRQQrrx`, `anmId →
trigger.id`, express-gruppen intakt, skriptet = stagings. UI-testets
"Anmälan not found" var Airtables cachade trigger-testrad, inte bygget
(ID:t finns i ingen tabell; fail-closed före skrivning). Skarpt prov (GO
AC4) mot Event-59: avvikande 990 **vägrad** (tom Event, Error-log-diff,
inga Deltaganden) · korrekt 991 **länkad** + OK + A3-Deltaganden — prod
mäter kedjan A1→A2→A3→A12. Nio poster städade i beroendeordning, prod-kön
exakt 3, Event-59 tillbaka på 16. **`284.6` AC #1–6 bockade.** **NÄSTA:
Done-stängning av `284.5` + `284.6` efter grön CI → stäng `284` PRD,
`TASK-232`, `T167`, `T168` → `284.4` DoD #6 väntar `TASK-291`.**
**DEL 12 (2026-08-22): STÄNGNINGEN.** Post-merge grönt per jobb på alla tre
landningarna → `284.5` + `284.6` + `284` PRD + `TASK-232` **Done** (DoD #1–4,
final summary), `T167` + `T168` **closed** (stängningssektion i korten;
indexraderna kortade efter att radlängdstaket fällde första formen).
**KVAR I SPÅRET:** `284.4` DoD #6 (väntar `TASK-291`) · `T161` ADR-122-
amendering · fälla 52 prod · `TASK-292` grillning i egen session · Lottas
besked.
**DEL 13 (2026-08-22): `T161` STÄNGD** — ADR-122 § Fynd 1 rättat öppet
(`Event (namn)` är formel, ej uppslag) + daterad § Updates-post; beslutet
står, bygget var rätt. **S110:s scope är levererat i sin helhet** — kvar
har egna bärare (`TASK-291`/`292`/`293`, fälla 52 via T16, Lottas besked).
Stängning (N+1) är nästa form.
**K-SISTA (2026-08-22):** BUILD-LOG-post, sex lesson-fragment (fem
`[UNIVERSAL]`, hub-lyft vid nästa hub-sync), transcript refererat. **HANDOFF →
S111: scopet RESERVERAT för `TASK-292`** (anmälningssidan = åtgärdskö-sidan,
samma yta i filtrerat läge; `TASK-291` kan inleda). Full handoff: sessionsdok
S110 § HANDOFF → Session 111.
**EFTERFYND vid stängningen (2026-08-22):** session-end körde hub-pluginets
städskript ur cache **1.33.0** (bara `agent-*`), fast `task-211` levererade
sessions-worktree-klassen i **1.34.0** — pluginen släpar efter hubben och
ingen rutin ser det. Hubbens 1.34.0-skript (torrkörning) skulle ta bort fyra
landade sessions-worktrees; `s110-kalenderlank-driften` behålls tills `#1787`
landat. **`TASK-294`** (kontroll i session-start). Åtgärd Marcus: `claude plugin
update marcus-system@marcus-hub` före S111.

**Session 109 ✅ AVSLUTAD (2026-08-22, K-sista; `lifecycle: closed` på Marcus
mandat att köra avslutet autonomt; pausad tre gånger, tre resumes) —
NOTIS- OCH FELMEDDELANDE-FAMILJEN: FRÅN FYRA DESIGNSPRÅK TILL ETT, PLUS DET
FÖRLADDADE PERSONREGISTRET.** Marcus order vid resume 3: *"ALLT ska bli klart
nu."* **Besluten:**
`#1715` **väg B** (referenserna landar, stämpeln behålls, ändringen bokförs som
`amendering`-post) · `T157` **skrivs nu** (amendering till `ADR-102`: klasserna
för när ett stämplat facit får ändras) · `285.13` **alternativ 1** (chunk-bannern
äger "Ladda om"; sektionsfelet visar ingen knapp vid chunk-flagga) · `285.10`
**AC #4 ta om bilden** + **AC #5 friskriv copy för båda ytorna** (facit låser
formen, inte orden). **Divergens fångad vid resume:** elva kort (`285.1`–`285.9`,
`286.1`, `287`) stod `To Do` trots landad kod — stängnings-committen gjordes
aldrig (`TASK-281`:s lucka); **8 av 11 satta `Done`**, tre öppna på obelagd DoD
(`285.5`/`285.6` DoD #6, `286.1` DoD #5–#7). Paus-PR `#1735` mergade **mitt under
LÄS-fasen** — andra instansen av samma fångst-klass.

**Del 14 — NOTISFAMILJEN STÄMPLAD OCH RIVEN; FEM FEL I BOKFÖRINGEN, NOLL I
KODEN.** Sju Marcus-beslut, copy-tabellen kvitterad verbatim (*"Kvitterar.
Snyggt!"*). `ADR-102` § Updates fick **rivnings-klausulen** — `285.11` var den
FÖRSTA rivningen någonsin som nådde B2 steg 4, och `check-facit.sh` fällde på
att manifestets `kallor` pekade på de nyss rivna filerna; mätt över alla tolv
manifest: **22 prototyp-filer i fem stämplade manifest**, alltså fyra familjer
till på väg in i samma vägg. Klausulen härleder ur git att filen fanns vid
stämpelns SHA; sökvägsundantaget avvisades med mätning (`/dev/` hade täckt 14 av
22). Två premisser föll: eventväljaren är INTE diakritik-tolerant hos Lotta
(→ `TASK-290`), och bokstavsraden bröt ALDRIG de sex referenserna (10/6 före,
10/6 efter — `toMatchAriaSnapshot` matchar partiellt, så skulden var gröna men
ofullständiga lås). Första stämpel-försöket förlorat: kommandon givna mot en
checkout tio commits efter `origin/main`.

**Del 15 — PERSONREGISTRET FÄRDIGBYGGT OCH OMSTÄMPLAT; PROD FÖLL PÅ
DEPLOY-ORDNINGEN, INTE PÅ KODEN.** `283.2` bokstavsraden (`#1784` `6c3bf097`,
+1 046/−31): 29 bokstäver + hinken **Utan namn** = 30 knappar, **ett** tabbsteg
via `react-aria-components` `Toolbar`, **28×28 px** träffyta över fem bredder;
`AppShell.tsx:45` kapar innehållskolumnen vid **568 px** medan raden behöver
~1 015 px, så radbrytning valdes mot WCAG 2.2 SC 1.4.10. `283.3` nedtoningen
(`#1798` `2138faad`, +1 024/−34): bunden till HELA registret, aldrig söktermen;
`aria-disabled` valt efter att agenten falsifierade sitt eget APG-antagande —
det som avgjorde var att `react-aria`s fokusfilter matchar
`button:not([disabled])`. Kontrast **5,33:1** normalt / **7,91:1** i
`prefers-contrast: more`; AC #3 bevisad genom att radens mått blev **byte för
byte identiska** med `283.2`:s mätning före nedtoningen. **NUL-byten:**
`PersonsList.tsx` bar en rå 0x00 som fogtecken — `file` sade `data`, `grep -c`
gav tomt, koden fungerade, inget test fällde; `283.2`:s agent bokförde det som
"verktygsartefakt", `283.3`:s agent rotorsakade (`#1799`, en insättning). Ett
test i samma körning **differentialbevisades oberoende** → `TASK-295`.
**Omstämplingen:** Marcus godkände i körande app (*"Ser ju skitbra ut! Bra jobb
Claude!"*), stämpel-SHA `d4997b5a` = merge-commiten för `#1802`.
`--update-snapshots` utan värde har preset `changed` och skrev bara om **2 av
6**; med `=all` **6 av 6** — fyra referenser passerade partiellt UTAN
bokstavsraden. Grinden **10/6 → 16/0**, provokationen fäller nu (exit 1).
**Kvarstående skuld, mätt:** bara **3 av 27** facit-ytor bär `referenser`, och
personlistan är inte en av dem (`TASK-288`, `T172`) — talet 24 i Del 14 § B var
dessutom ren aritmetik, inte felets signal. **PROD-INCIDENTEN VAR ETT
ÅTERFALL:** Vercel deployade fronten automatiskt 16:37:26Z, prod-`get-persons`
var 31–52 h gammal, klientens `?register=true` föll till sök-grenen med
`pageSize` 50 → Lotta såg **50 av 559** och nästan hela alfabetet nedtonat.
EF-deploy 17:13:34Z, `ezbr_sha256` `31a8b234…` → `85306a63…` mot `get-events`
oförändrade `636539ed…`. Prod var ändå fel efteråt: `localStorage`-cachen föddes
i glappet under NY app-version, så bustern matchade och `staleTime` 30 min gjorde
datan färsk. **Samma orsak som S107 fem dagar tidigare** → `TASK-286.8` (**EF
före frontend**). **Baslinjen blockerad:** dispatch `32587783890` gav 238 passed
/ 8 failed, samtliga i hem-vyn — grinden söker en `data-testid` komponenten inte
bär och har ett `under xl`-fall mot kod som säger "alla bredder"; två spår
startade (`#1807` `TASK-243.6` landad `d7498747`, `#1808` `TASK-298` öppen och
oarmerad). Andra dispatchen
föll på 34 s därför att filtret hamnade i `-u`:s **valfria** värde — samma flagga
som ovan, motsatt felmod, samma dag.

**AVSLUTET (2026-08-22).** `#1808` armerades och landade, baslinje-dispatchen
kördes om och födde `#1811` (16 bilder), och `TASK-300` registrerade
pixel-driften på tre orörda ytor — landad på Marcus order utan utredning.
Bokföringspasset `#1816` stängde `283.4`/`285.11`/`298`, bokförde föräldrakorten
och registrerade `T173`. **Kvar till nästa session:** QA-vandringarna `283.5`,
`285.12` och `286.6` är avstådda på Marcus beslut (*"Nej inget Q&A, skit i det.
Gör klart allt de andra."*) och blockerar mätt ingenting — noll kort beror på
dem · föräldrakorten `283`/`285`/`286` står medvetet `To Do` med skälet bokfört
i vart och ett · `TASK-286.8` (prod-utrullning, EF före frontend) · `TASK-288`
(22 ytor utan `referenser`) · `TASK-289` (A2-latensen) · `TASK-295`
(kontrast-flaken) · `TASK-296` (`preview-receipt`-varningen) · `TASK-300` ·
`T173` · **tio S109-kort står `Done` med obockade DoD-punkter**
(`check-backlog-closure.sh` exit 1, mätt vid stängning: `283.1`, `283.3`,
`283.4`, `285.5`, `285.6`, `285.10`, `286.1`, `286.3`, `286.4`, `286.5` —
grinden läser kryssrutan, inte adjudikeringen, och är `nightly.yml`-wirad) ·
dependabot `#1489` står `CLEAN`, odraftad och oarmerad (samma klass som
`#1487`/`#1490`/`#1491`) · fem filer bär kvar en död pekare till det
konsoliderade fragmentet `parkerad-pr-utan-draft-…md` (nu `L485` i
`tasks/lessons/vol-06.md`) — `CLAUDE.md`:s rättades i `#1816`. **Hub-lyftet av
de sju `[UNIVERSAL]`-fragmenten är EJ gjort** — eget moment. Numrering efter
S109 (disk-mätt mot `e012971c`): session **112** (S111 är `active`) · ADR **124**
· kort **301** · lessons **L512** (vol-serien står på `L511`) + **76 fragment**
· tråd **T174** · fälla **53** — re-derivera ALLTID. Full narrativ: sessionsdok
S109 Del 1–15 + tre paushistoriker + BUILD-LOG S109-post.

**Session 109 ⏸️ PAUSAD (tredje gången, 2026-08-22, `lifecycle: paused`, historik) —
NOTISFAMILJEN BYGGD FÄRDIG; ALLT KVARVARANDE ÄR TRE MARCUS-BESLUT.** Marcus AFK
hela passet; orkestreraren ägde svepet manuellt (heartbeat-ordern 2026-08-19
står), landnings-väckningen bars av bundna bakgrundsvakter per PR (fyra fyrade:
13/13/11/13 varv). **TJUGOEN PR:er landade**, `main` **`2682457a`**, arbetsträdet
rent. **NIO SKIVOR** bygger familjen: `285.1` primitiven + flippen · `285.2`
MessageBox (kryss-regeln kodad i TYPEN) · `285.3` appfelet · `285.4` § 21 +
ORDLISTA + `T160` · `285.5` chunk-bannern in i skalet · `285.6` offline staplat ·
`285.7` sektionsfelets "Ladda om" · `285.8` copy-svepet · `285.9` härdningen
(noll `src/`-ändringar). Plus `286.1` EF-registerläget, `TASK-287`
B3-markörerna + grindens ärliga framgångsrad, kontraktsfixen (`check-langa-streck`
in i agentkontraktet), `T162`, `T163`, beslutskortet `285.13` och förkraven på
`285.10`/`285.11`. **PERSONREGISTRET HALVBYGGT:** `286.1` landad, `286.2`
(`#1715`) klar och grön men PARKERAD. **TRE BESLUT VÄNTAR (i ordning):**
(1) `#1715` — `286.2` skriver om ett STÄMPLAT facit (`godkand: marcus
2026-08-10`); enda borttagningen är `button "Ladda fler"`, en fixtur-artefakt
(17 personer, `PAGE_SIZE` 50), ingen produktregression — men ingen grind fällde
och stämpeln intygar nu en form referensen saknar; **blockerar `286.3`, `286.4`,
`283.2`, `283.3`**. (2) `285.13` — vem äger "Ladda om" när chunk-bannern och
sektionsfelet monteras samtidigt med identiskt tillgängligt namn; **blockerar
`285.10`**. (3) `285.10` AC #4–#5 — facit-noten inaktuell + manifestet
inkonsekvent om copy. **`T157` FICK TVÅ INSTANSER PÅ ETT DYGN** och är
fortfarande oskriven — stämplat vs ogodkänt facit avgörs av omdöme i stunden.
Worktree-städning vid paus: 14 borttagna, grenar `202 → 175`. Numrering vid
paus 3: ADR **124** · kort **288** · L512 + **62 fragment** · tråd **T169** ·
fälla **53** · session 111. Full narrativ: sessionsdok S109 Del 10–12 +
PAUSLÄGE.

**Session 109 ⏸️ PAUSAD (andra gången, 2026-08-21, `lifecycle: paused`, historik) — ALLT
SKIVAT FÖR AUTONOMT BYGGE: NOTISFAMILJEN (`TASK-285`, 12 kort) OCH PERSONREGISTRET
(`ADR-123` + `TASK-286`, 6 kort; `TASK-283` amenderad).** Resume 1 landade: notisen
låst efter ETT varv (`#1682`), meddelanderutan + appfel efter FYRA (`#1685`;
familjeregel: ingen kontur, krysset bara på kvitto/info); Marcus valde väg B för
personlistan (*"Då kör vi B!"*) → `283.1`-agenten stoppad, staging-EF återställd,
research (`#1688`), `ADR-123` (`#1689`), kort (`#1687`, `#1693` i kö vid paus).
Två lessons-fragment (stoppad agent med deploy i DoD · nekat kommando körde
ingenting — Del 6 föll bort och återinfördes). **NÄSTA (resume av 109): verifiera
`#1693` · våg 1 med fem bygg-agenter (`285.1`–`285.4`, `286.1`) · svep per
väckning enligt PAUSLÄGE-tabellen · HITL när Marcus är hemma: `285.10`, `286.5`,
`283.4`, QA.** Numrering efter S109 paus 2: ADR 124 · kort 287 · L512 + 60
fragment · T160 · f52 · session 111. Full narrativ: sessionsdok S109 Del 5–9 +
PAUSLÄGE.

**Session 109 ▶️ ÅTERUPPTAGEN (2026-08-21, `lifecycle: active`, historik; pausad en gång
2026-08-21) — NOTIS-FAMILJEN: BYGGET AV `TASK-283` OCH NOTIS-PROTOTYPEN STARTAR.**
Resume 1: handoffen prövad mot disk — `#1674` landad (`2eb9f53f`), `#1676`
(paus-handoffens rättelse, okänd för handoffen) landade `381691f2` under
LÄS-fasen, S110 pausade samtidigt (`#1678`). Ingen ägarlapp → huvudkatalogen tas
av S109; S108 aktiv i egen worktree, S107 + S110 pausade. Numreringen håller:
ADR 122 · kort 284 · L512 + 55 fragment · T158 · f52 · session 111.
Heartbeat-monitorn FORTSATT ej startad (order 2026-08-19). **NU:** `283.1` →
bygg-agent · notis-prototypen EN variant per `ADR-121` beslut 6, prototyp FÖRE
spec. Full narrativ: sessionsdok S109 Del 5.

**Session 109 ⏸️ PAUSAD (första gången, 2026-08-21, `lifecycle: paused`, historik) —
NOTIS- OCH FELMEDDELANDE-FAMILJEN ÖVERTAGEN FRÅN S107; FORMVALET LÅST I
`ADR-121`, BOKSTAVSINDEXET SPECCAT.** Äger huvudkatalogen (lappen släppt vid
paus). Parallell med S108 och S110, båda i egna worktrees; S107 pausad.
**Övertog per S107 Överlämning 2:** uppdateringsnotisen, hela
felmeddelande-familjen, copy-domarna och den saknade styrande ytan — plus en
EXPLICIT bokförd scope-avvikelse (bokstavsindex på person-vyn) som Marcus la
utanför spåret. **CLS mätt på autentiserade vyer** (`/personer` + `/hem`, tolv
celler): research-passets gissning *"samma härad eller högre"* **halvt
falsifierad** — identiskt vid 390 px (`0,1469`), cirka HÄLFTEN vid 1440 och
1280 px. Chunk-läget är det DYRARE (`+68 %` vid 1280 px, 17 % av vyporthöjden
på mobil) men fyrar sällan, medan info-läget fyrar vid varje deploy — det
frekvensargumentet, ur egen mätning och inte ur underlaget, är vad som gör
`ADR-121`s form hållbar. **`ADR-121` mintad** (sju beslut) + **`DESIGN-SYSTEM-SPEC`
§ 21 Notistrappan** — familjens FÖRSTA styrande yta; specen hade noll träffar
på banner/notis/toast/`MessageBox`. **SJÄLVFÅNGST förd IN i ADR:n:** dialog-formen
för databesked-varningen kräver osparad-detektion, exakt den mekanik som vägde
mot det förkastade `Alternativ 2` — varningen ska UT ur notisen, men var den
landar är EJ beslutat. **Bokstavsindexet:** research-pass + `fälla 51` (sort
veckar Å mot A, men filter-jämförelse gör det inte — verifierat oberoende två
gånger) + `TASK-283` med fyra skivor och QA-kort. **`T157` registrerad:**
`ADR-102` saknar amenderings-mekanik för ett STÄMPLAT facit — personlistans
promoverings-grind fäller sex ARIA-referenser så snart bokstavsraden finns;
Marcus valde väg A (additiv amendering) för instansen, klassen är oskriven.
**NÄSTA (resume av 109): `#1674` verifieras landad · `TASK-283.1` plockbar
direkt · notis-prototypen, EN variant itererad per `ADR-121` beslut 6.**
Numrering efter S109: ADR 122 · kort 284 (om `#1674` landat) · L512 + 55
fragment · T158 · f52 · session 111. Full narrativ: sessionsdok S109 Del 1–4 +
PAUSLÄGE.

**Session 108 ✅ K-SISTA KLAR (2026-08-28, STÄNGD 2026-08-28 efter Marcus
kvittens, `lifecycle: closed`, nästa session 113) — HELA BILAGESPÅRET I PROD: NIO PR:ER LANDADE, 45 EF
DEPLOYADE 04:06–04:17Z, DOKUMENT/BILAGOR/KVITTON LIVE INFÖR LOTTAS SÖNDAG.**
Marcus mål för resumen — *"komma hela vägen till session-end"* — nått för allt
som är agent-görbart. **Landat på `main`:** `#2030` · `#2031` (`309.29`,
s102-pensioneringen) · `#2034` (`301`, docraptor-sjalvbarande) · `#2037`
(stängningssvansen, nio kort — inte tre som handoffen sade) · `#2038` (`309.30`,
Plats härledd ur Ort) · `#2040` (`309.26`, popup-bevis i äkta Chrome) · `#2039`
(lessons `L533`–`L569`) · `#2036` (fyra kort mintade) · `#2032` (`309.31`,
`check-facit` varnar; `ADR-102` § Updates) · `#2053` (`333`, testdriften) ·
`#2054` (`309.34` skiva i, `b370e6cb` 04:42:59Z) — elva landningar totalt;
`#2055` kvar som draft (rundtaket nått, `review-loop-beslut` exit 20 — runda 2:s
fix införde ett nytt error, felmeddelandet nollställdes inte vid platsbyte; nu
rättat och pushat som `0fcfc4c8` men OGRANSKAT — runda 3 kräver Marcus GO) och
`#2060` (stängningsbatch 2) MERGED `372050bd` 05:23:48Z.
**PROD tog tre försök, och de TVÅ första gick
båda via `!`-kanalen med OLIKA utfall vid tvåminuterstaket:** (1) harnesset
flyttade körningen till BAKGRUNDEN (*"moved to the background"*), den fortsatte
och föll på Cloudflare 520 vid funktion 26/45 — skriptet avbröt korrekt och
återlänkade staging själv; (2) omkörningen DÖDADES i stället (*"Command timed
out after 2m 0s"*) vid ~5/45 (`get-event-formats`), EXIT-trapen kördes aldrig
och katalogen stod sticky länkad mot PROD i ~10 min; (3) eget terminalfönster,
45 EF `UPDATED_AT` 04:06–04:17Z. Poängen: kanalens beteende vid taket är INTE
förutsägbart. `CLAUDE.md`
§ Prod-EF-deploy nu skärpt PER LÄGE (`--kontrollera` via `!` OK, `--deploya`
aldrig) med rivningen bokförd — granskaren på `#2060` fällde den första,
motsägande formuleringen; preflight-fyndet är `TASK-337`.
**Hub:** `marcus-system` `73803d74` (`K108.1`–`K108.30`). **Fynd:** `TASK-333`
`334` (S112:s) `335` + `TASK-337` (fas4-preflighten, i `#2060`) + `TASK-309.37`
(ärvd race, i `#2055`); `git stash` delas mellan worktrees (S112 mintar).
**MARCUS SKULD, åtta punkter:** prod-röktest `309.11` ·
facit-stämpling (s108-generering, s108-dokumentytan, s106/s111 med `--ersatt`) ·
DocRaptor-rotation i BÅDA miljöer · `325` AC #2 · `INVITE_REDIRECT_URL` ·
`DOCRAPTOR_API_KEY` som GitHub-secret · GO/STOPP för `#2055`:s runda 3 ·
coverage-kvittens. **CI-hygien:** post-merge GRÖN på `b370e6cb`
(run `33142610595`), S108:s fyra larm-issues stängda, worktree-städningen körd
(8 borttagna, 13 kvar) — enda öppna issue i repot är `#1482` (`TASK-254`). **Numrering vid K-sista (disk-mätt mot `ecc324b1`):** ADR 128 ·
kort 337/`309.37` mintade men ej landade → nästa 338/`309.38` (336 togs av S112) ·
`L570` · 85 fragment · `T176` · session 113. **NÄSTA (S113): `309.34` skiva (ii) ·
`309.35` · `309.33` (d) · `#2055` runda 3 eller omtag · `TASK-309.37` · hela
lessons-katalogen = egen planerad session per Marcus beslut A.** Full narrativ:
sessionsdok S108 Del 29 + § K-SISTA.

**Session 108 ▶️ ÅTERUPPTAGEN (2026-08-28, `lifecycle: active`, trettonde
resumen; pausad tolv gånger, historik) — MÅLET ÄR SESSION-END: LOTTA ÄR I
APPEN PÅ SÖNDAG, DOKUMENT/BILAGOR/KVITTON SKA FUNGERA HELT.** Marcus order:
*"Återuppta S108. Gå igenom och kartlägg exakt allt som är kvar att göra …
Sätt ut agenter på allt som går att utföra direkt … Målet med denna session
är att komma hela vägen till session-end."* LÄS-fasen mätt: `#2028`
(höjdanpassningen) **landad** `a620b3f4` 18:01:57Z — live i `main`, **inte i
prod** (kräver en andra EF-deploy, Marcus kanal); huvudkatalogen bär MIN
ägarlapp, ingen parallell session; numreringen håller på alla sex serier
(ADR 128 · kort 331/`309.33` · L533 · 121 fragment · T176 · session 113).
**Divergens mot handoffen, disk vinner:** Cavolini-filerna FINNS på maskinen
(`~/.miranon-fonts/`, fyra vikter sedan 2026-08-19) — bara den git-ignorerade
symlänken saknas i huvudkatalogen; och EF-lagret bundlar Cavolini ALDRIG per
design (`mall-render.ts` § FONT_BASE64_PER_FILNAMN), så prod renderar Comic
Neue oavsett symlänk — "Cavolini-beslutet" är ett licens-/designbeslut om
prod, inte en saknad fil. Heartbeat `bku4n5wpr`. Kartläggningen delegerad;
agenter sätts ut på allt delegerbart. Full narrativ: sessionsdok S108 Del 29.

**Session 108 ⏸️ PAUSAD (tolfte gången, 2026-08-27, `lifecycle: paused`) —
BILAGE-MALLEN I PROD TILL FÖRLAGE-PARITET; KVAR ÄR MARCUS PROD-RÖKTEST,
CAVOLINI OCH K-SISTA (SESSIONSDOK S108 § PAUSLÄGE TOLFTE → MARCUS-SEKVENS).**
Resume 13 löste **rotorsaken**: bilagan blev två sidor oavsett innehåll för att
Prince saknar `align-self: stretch` i row-containers — Del 26:s "knivsegg" och
de tolv EF-deployerna (v37→v49) mätte den buggen. Byggde **den lokala
PDF-loopen** (`npm run mall:pdf`, ~5 s mot tidigare ~45 min) efter Marcus fråga
*"Håller proffs också på så här?"*. **Marcus fyra fångster**, alla verkliga: sex
saknade agendapunkter i BÅDA baserna (Dag Två 10→16) · fetstilen borta sedan
`TASK-309.4` (fyra dagar, inte tre veckor som jag påstod) · förlagornas sökväg
obokförd · en vakt som bara täckte RIM 1. Landade `#2019` `#2020` `#2022`
`#2024` `#2025`; `#2028` (höjdanpassningen) i kön vid paus. **PROD DEPLOYAD
17:35:45 UTC** — 45 EF:er, `generate-event-attachment` v11, förkraven
hash-verifierade. Bilagan är nu i paritet med förlagan **utom rubrikens
typsnitt** (ComicNeue i stället för Cavolini, 80 % av bredden — kräver Marcus
besked om var filen finns). Numrering vid paus 12: ADR **128** ·
task-**331**/`309.33` · **L533** · **121 fragment** · **T176** · session
**113**. Full handoff: sessionsdok S108 § PAUSLÄGE (tolfte) + Del 27–28.

**Session 108 ▶️ ÅTERUPPTAGEN (2026-08-26, `lifecycle: active`, tolfte resumen;
pausad elva gånger, historik) — PAUS-LANDNINGEN DIAGNOSTISERAD: `#2015` FÖLL
INTE PÅ SIN DIFF UTAN PÅ EN ZOMBIE-KÖRNING FRÅN AKTIONS-LÅSET.** Marcus order:
*"Återuppta S108. Jag vill få klart de här nu. Förra resumen fick problem med
paus-landningen så du får kolla upp vad som är problemet och lösa det."* Mätt
15:45 UTC: CI-run `32985153863` `queued` i 19 min med **noll jobb**, CodeQL
`startup_failure` (ej omkörbar), noll check-runs på paus-SHA:n,
`mergeStateStatus: BLOCKED` trots `MERGEABLE` — och **ingenting hade kört i
repot sedan 14:48:52Z**. Åtgärd: resume-commiten ÄR det nya SHA:t (paus +
resume i samma PR `#2015`, push-ekonomin per `ADR-097`). Del 26 § B:s
*"14:24–16:30 UTC"* rättad — mätt lås-fönster **14:24–14:36 UTC**, den övre
gränsen var lokal tid, och låset var **inte** över: symptomet återkom 15:25
UTC. **Marcus-sekvensen (§ Paushistorik 11) står oförändrad:** `#2014` beslut
A/C/D → prod-EF-deploy → röktest → facit-stämpling → nyckelrotation. Full
narrativ: sessionsdok S108 Del 27.

**Session 108 ⏸️ PAUSAD (elfte gången, 2026-08-26, `lifecycle: paused`) —
BILAGE-SPÅRET I PROD UTOM MALLENS B-VÄRDE OCH EF-DEPLOYEN; KVAR ÄR MARCUS TRE
MOMENT (SESSIONSDOK S108 § PAUSLÄGE ELFTE → MARCUS-SEKVENS).** Resume 11
landade **tolv** S108-PR:er (`#1971` `#1972` `#1977` `#1979` `#1984` `#1990`
`#1991` `#1994` `#1995` `#1996` `#1998` `#2002` `#2003` `#2005` `#2006`
`#2008` `#2011` `#1983`); i prod (Vercel): `309.18` `.19` `.20` `.23` `.24`
`.25` `.26` `.28`. **Plats-backfill 27/27** i prod på Marcus GO.
Review-grinden skarp: 12 utlåtanden, sex verkliga fel fångade (bl.a.
`document.write`-kollision reproducerad i Chromium, ASCII-hash-kollisioner).
**Faktureringslås** på GitHub Actions ~14:24–16:30 UTC (prövperioden
utgången → Enterprise Cloud tecknat). **Orkestrerarfel:** "B stängt"
accepterades utan att läsa vad som mätts — Marcus pushback; mätserien
beställd. `#2014` (draft, väntar Marcus beslut A/C/D vid resume (mätserien i PR-kroppen, staging v49 = PR-innehållet)). Prod-EF: EJ deployad — Marcus-moment vid resume (`fas4-prod-deploy.sh`; på `main` väntar `#1939` `#1983` + S112:s `#1940` `#1954` `#1981` `#1988`; `#2014` efter A/C/D). Numrering vid
paus 11: ADR **128** · task-**331**/`309.33` · **L533** · 118 fragment ·
**T176** · f53 · session **113**. Full handoff: sessionsdok S108 § PAUSLÄGE
(elfte) + Del 24–26.

**Session 108 ▶️ ÅTERUPPTAGEN (2026-08-26, `lifecycle: active`, elfte resumen;
pausad tio gånger, historik) — LÄGET RE-MÄTT MOT `origin/main` `60b5e659`:
ALLT ÄR LIVE I PROD, KVAR ÄR MARCUS VERIFIERING OCH BESLUT.** Handoff mot
disk: paus-PR `#1970` landad · `TASK-309` 12 Done / 10 öppna · båda facit-
manifesten `godkand: null` · numreringen OFÖRÄNDRAD sedan paus 10 (ADR 127 ·
task-321 · L533 · T176 · session 113) · huvudkatalogen fast-forwardad
`f5ed41d2` → `60b5e659` · **dev-servern DÖD** (den förutsagda risken) ·
S112 pausad parallellt, ingen öppen PR är S108:s. Live-belägg: Vercel
Production `60b5e659` 2026-08-25T15:00:31Z, prod-schema + 45/45 EF:er sedan
2026-08-24. **MARCUS-SEKVENS (sessionsdok Del 23 § C):** GO på `309.20`-agent
→ röktest i prod (`309.11`, nio punkter) → nyckelrotation (§ (g)) →
stämpling efter `309.20` → `309.8` AC #3/#4 · `ADR-060` · `309.18`/`.19`/`.21`
→ agent-svans + K-sista. Full narrativ: sessionsdok S108 Del 23. **AFK-natten (Del 25):** `#1990` `#1991` `#1994` `#1995` `#1996` `#1998` `#2002` `#2003` `#2005` `#2006` landade — i prod: `309.18` `.19` `.20` `.23` `.25` `.26` `.28` · `#1996` tog fyra review-rundor (document.write-kollision empiriskt fångad) · S112:s fixturflytt `#2000` fällde `#1996` i merge-gruppen (rättad) · kvar: `#1983` (hög risk, Marcus) · `#2008` (`309.24` r2) · `309.27` (HITL). **Forts. (Del 24):** Marcus prod-röktest → sju kort `309.22`–`.28` · **Plats-backfill 27/27 i prod** (Marcus GO) · `#1979` + `#1977` köade, `#1983` (Invalid key) under review · review-agent skarp ×3 · S112 kör AFK-fleet parallellt (prio S108) · **Marcus mandat** → `309.18` riv, `309.19` riv, `309.21` pensionera, `ADR-060` godkänd, `309.8` AC #3 omskrivet · **DEADLINE: Lotta testar i helgen 2026-08-29** — morgonsekvens i Del 24 § G.

**Session 108 ⏸️ PAUSAD (tionde gången, 2026-08-25, `lifecycle: paused`) —
PROMOVERINGEN ÄR I PROD; KORTFAMILJEN HALVSTÄNGD; ALLT SOM ÅTERSTÅR KRÄVER
MARCUS BESLUT (SESSIONSDOK S108 § PAUSLÄGE TIONDE → MARCUS-SEKVENS).**
Resume 10 landade **21 PR:er**. `#1889` merge `24c39777` 17:00:37Z → Vercel
Production 17:01:13Z; prod verifierat med `git merge-base --is-ancestor` mot
deploy-SHA, inte med stränglätning i bundle. `TASK-309`-familjen: **12 Done**
(`.1`–`.7`, `.12`–`.16`), 10 öppna — closure-grinden fäller **noll**
309-kort. Fragment-katalogen 65 → **89**. Efter-körning-purgen skarpt bevisad
i post-merge (`ADR-060` punkt 3 amenderad av agent — **Marcus bör granska**).
Skiva 9:s facit levererat: 22 bilder + 2 manifest, båda `godkand: null`.
**SEX AV ÅTTA AGENTER RÄTTADE ORKESTRERARENS EGET UNDERLAG** — fragment-talet
(66→65), testevent-antalet (44→55, 151 över fem familjer), den falska
förklaringen att setup-purgen inte kör efter, `ADR-109`:s upphävda momsrad,
ett `dvh`-påstående, och att block-dialogens datum-läge skulle vara nåbart
(**död kod** — falsifierar `TASK-309.17`). **TRE FYND INGEN LETADE EFTER:**
två Airtable-rader kvar i **27 och 32 dygn** utan matchande purge-target ·
runbookens mall bar `fullPage: true` och **lärde ut** buggen · `s102`:s
stämplade facit vaktas av **ingenting**. **Lessons-konsolideringen STOPPAD
med avsikt** — 65 av 89 fragment tillhör andra sessioner. **TIDSKRITISKT VID
RESUME: `TASK-309.20`** (två formdefekter vid 375 px som facit fryser om
stämplingen sker före fixen). Därefter `309.8` AC #3 · `ADR-060`-granskningen
· stämpling · röktest · nyckelrotation · `309.18`/`.19`/`.21`.
Numrering vid paus 10: ADR **127** · task-**321** · **L533** · 89 fragment ·
**T176** · f53 · session **113**. Dev-servern lämnad igång på `localhost:5173`
mot staging. Full handoff: sessionsdok S108 § PAUSLÄGE (tionde) + Del 20–22.

**Session 108 🤖 ORKESTRERINGS-PASS (2026-08-24, `lifecycle: active`, tionde
resumen forts.) — PROMOVERINGEN I PROD, ÅTTA AGENTER, NITTON LANDNINGAR,
KORTFAMILJEN 0 → 12 STÄNGDA.** Marcus AFK med order att delegera allt
delegerbart och köra så långt möjligt. **`#1889` landad 17:00:37Z
(`24c39777`)** → Vercel Production 17:01:13Z; prod verifierat via
`git merge-base --is-ancestor` mot deploy-SHA, inte via stränglätning i
bundle. Landat i övrigt: `309.1`–`.7` stängda (`#1946`) · `309.12`–`.16`
stängda (`#1947`/`#1951`/`#1965`) · **efter-körning-purgen** (`#1956`,
`ADR-060` punkt 3 amenderad — **Marcus bör granska**) · **skiva 9:s facit**
(`#1961`, 22 bilder + 2 manifest, båda `godkand: null`) · 24 lessons-fragment
(65 → 89) · `ADR-109`-indexraden · runbookens `fullPage`-fälla · 11 döda
filreferenser. **SEX AGENTER RÄTTADE MITT EGET UNDERLAG** — fragment-talet
(66→65), testevent-antalet (44→55, och 151 över fem familjer), min falska
förklaring att setup-purgen inte kör efter, `ADR-109`:s upphävda momsrad,
och att block-dialogens datum-läge skulle vara nåbart (det är **död kod**,
falsifierar mitt eget `TASK-309.17`). **TRE FYND INGEN LETADE EFTER:** två
Airtable-rader kvar i **27 och 32 dygn** utan matchande purge-target ·
runbookens mall bar `fullPage: true` och **lärde ut** buggen · `s102`:s
stämplade facit vaktas av **ingenting** (innehållslåset gäller bara ytor med
`referenser`-nyckel). **Nya kort:** `309.15`–`.21`. **Lessons-konsolideringen
STOPPAD med avsikt** — 65 av 89 fragment tillhör andra sessioner; ett
fragment är en fullgod leverans. **KVAR FÖR MARCUS:** `309.8` AC #3
(ordalydelsen "identisk med prototypen" är inte längre sann) · `ADR-060`-
amenderingen · **`309.20` är tidskritisk** (två formdefekter vid 375 px som
facit fryser om du stämplar före fix) · prod-röktest · DocRaptor-rotation ·
facit-stämpling · `byggplan.md` §2 saknar hela spåret · `CHANGELOG`
`[Unreleased]` tom sedan `0.8.0`. Full narrativ: sessionsdok S108 Del 22.

**Session 108 ▶️ ÅTERUPPTAGEN (2026-08-24, `lifecycle: active`, tionde resumen;
pausad nio gånger, historik) — LÄGET RE-MÄTT MOT `origin/main`,
GRANSKNINGSYTAN UPPE, `TASK-309.9` AC #3 BOCKAD; MARCUS-SEKVENSEN STÅR
OFÖRÄNDRAD.** Marcus order: *"Återuppta S108."* Paus-PR:en verifierad landad
(`origin/main` `3d4ae13e` — S112 landade vidare under pausen). **Dokgren
`docs/s108-resume-10` tagen ur `origin/main` i `s108-paus-docs`; all
faktainsamling via `git show origin/main:<fil>`** — huvudkatalogen står kvar
detached på `f5ed41d2`, **91 commits bakom**, och gav en FALSK kort-läsning
(`TASK-309.9` AC #1 visades obockad där, är bockad på `main`). Handoffens
numrerings-varning gällde serierna; klassen är bredare — kort-INNEHÅLL ljuger
lika gärna. **Numreringen re-verifierad, ingen post rörde sig:** ADR **127** ·
task-**320** · **L533** · 66 fragment · **T176** · f53 · session **113**.
**AC #3 bockad efter att alla fyra led mätts** (`--kontrollera` + bucket-raden ·
`--deploya` 45/45 · `UPDATED_AT` på nio EF:er · allowlisten 45 poster utan
`test-docraptor-render`). **AC #2 är kandidat men EJ bockad** — prod-secrets kan
inte mätas från agent-sidan, bocken skulle vila på bokföring. **Granskningsytan
uppe** (`agent-a36ffea842efba83a`, `1ec70a85`, `localhost:5173/mer/dokument`
→ 200, staging-URL verifierad skild från prods). Ägarlappen på huvudkatalogen
är BORTA (`T120`-formen: lappen tas vid skrivning, inte vid ankomst) — noterat,
ingen åtgärd. **NÄSTA: Marcus kör MARCUS-SEKVENS steg 0 (`#1883`) + steg 2
(granskningen, sex punkter); agenten tar steg 3–5 och därefter skiva 9 + QA +
AC-bockning.** Full narrativ: sessionsdok S108 Del 20 + § Paushistorik 9.

**Session 108 ⏸️ PAUSAD (nionde gången, 2026-08-24, `lifecycle: paused`) —
PROD ÄR HELT OCH DEPLOYAT; KVAR ÄR MARCUS GRANSKNING AV `#1889` OCH DE TRE
STEGEN EFTER DEN (SESSIONSDOK S108 § PAUSLÄGE NIONDE → MARCUS-SEKVENS).**
Resume 9 landade sju PR:er: `#1893` `#1895` `#1897` `#1900` `#1902` `#1915`
`#1929`. **Del A körd av agenten på Marcus GO** — tre tabeller + 18 fält på
Eventplanering + 2 på Bilagor + seed i prod, basen 21→24 tabeller, alla
prod-ID:n i `data-model.md`. **Prod-deployen föll först** efter 18 av 45
funktioner: `deploy-prod-functions.sh` kallade den GLOBALA CLI-binären
(2.75.0) medan anroparen körde `npx` (2.115.0) — differentialmätt mot
staging. Marcus fällde lapp-fixen (*"vi SKA hålla branschledarstandard i
ALLT"*), sveppasset visade **sju** opinnade anropsställen i stället för ett,
och hela klassen stängdes i `#1915` (`.supabase-cli-policy.conf` + delad
resolver + fail-closed guard i preflighten + 25/25 nya testfall).
Granskningen fällde `#1915` en gång: en miljövariabel kortslöt policyn OCH
framgångsraden ljög om källan. **Omkörd deploy: 45/45, `UPDATED_AT`
verifierad på alla nio — nattens tre prod-fönster STÄNGDA.**
**Granskningsvägen föll strukturellt:** Vercel-preview bygger i
production-läge → pratar med prod → prods CORS matchar Origin EXAKT → en
per-gren-subdomän kan aldrig stå i listan ⇒ `Failed to fetch`. Granskningen
går via dev-servern mot staging. Numrering vid paus 9 (S112 konsumerar
kort-serien snabbt — mät mot `origin/main`, ALDRIG mot huvudkatalogens
detached HEAD): ADR **127** · task-**320** · **L533** · 66 fragment ·
**T176** · f53 · session **113**. Full handoff: sessionsdok S108 § PAUSLÄGE
(nionde) + Del 17–19.

**Session 108 ▶️ ÅTERUPPTAGEN (2026-08-24, `lifecycle: active`, nionde resumen;
pausad åtta gånger, historik) — RESUMEN ÖPPNAR PÅ MARCUS FEM MOMENT; INGET
AGENT-ARBETE ÄR PLOCKBART FÖRE STEG 1–2.** Marcus order: *"Återuppta S108."*
**Paus-PR `#1892` verifierad landad** (`origin/main` `f5ed41d2`).
Huvudkatalogen bär numera DENNA sessions egen ägarlapp (den främmande lappen
från 2026-08-23 hade en död ägare) och är fast-forwardad till `f5ed41d2`,
detached — `main` hålls av `s108-bilagesparet`. Dokgren `docs/s108-resume-9`
från `origin/main` i `s108-paus-docs`. **Numreringen re-verifierad mot disk —
ingen post rörde sig under pausen:** ADR **127** · task-**312** · **L533** ·
66 fragment · **T176** · f53 · session **112**. Arbetsform: inget läge aktivt
i något av de tre träden. Öppna PR:er exakt som handoffen: draft `#1889`
(promoveringen), `#1883` (främmande baseline), fem Dependabot parkerade.
**MÄTT VID RESUME, bekräftar handoffen:** prod-basen `app8uGPrVCVOm6LfD`
saknar `Eventinnehåll`/`Agendapunkter`/`Platser` (read-only MCP-läsning) —
runbookens steg 1 (a)–(d) är alltså OKÖRT och nattens prod-fönster (Del 16
§ C) står fortfarande öppna. Nästa: Marcus kör MARCUS-SEKVENSEN steg 1–2,
agenten assisterar och bokför prod-ID:n. Full handoff: sessionsdok S108
§ Paushistorik 8 + Del 14–16.

**Session 108 ⏸️ PAUSAD (åttonde gången, 2026-08-24, `lifecycle: paused`) —
ALLA AFK-SKIVOR LANDADE; PROMOVERINGEN STÅR SOM DRAFT `#1889`; KVAR ÄR
EXAKT MARCUS FEM MOMENT (SESSIONSDOK S108 § PAUSLÄGE ÅTTONDE →
MARCUS-SEKVENS).** Steg 1: prod-schema+seed+EF-deploy (runbook (a)–(d),
stänger nattens prod-fönster) · steg 2: granska `#1889` mot
Vercel-preview/dev-server · steg 3: `gh pr ready 1889` + armera · steg 4:
röktest (QA `309.11`) · steg 5: rotera DocRaptor-nyckeln. Därefter
agent-arbete: facit (`309.10`), AC-bockning, QA, K-sista. Numrering vid
paus 8 (S111 stängde i natt och förbrukade serier): ADR **127** ·
task-**312** · **L533** · 66 fragment · **T176** · f53 · session **112**.
Full handoff: sessionsdok S108 § PAUSLÄGE (åttonde) + Del 14–16.

**Session 108 🌙 NATTKÖRNING 2 KLAR (2026-08-23 ~23:00, `lifecycle: active`,
resume 8 fortsätter — INTE pausad; Marcus order *"Kör klart så mycket som
bara är möjligt … stäng av monitorn"*) — SKIVOR 0–6 + 8-PREP LANDADE;
PROMOVERINGEN STÅR SOM DRAFT `#1889` OCH VÄNTAR PÅ MARCUS.** ADR-125 →
PRD `TASK-309` → skivorna: `#1867` minimaltest (TS-strängmoduler, static_files
föll) · `#1870` datamodell+läsväg · `#1874` skrivvägar · `#1877` renderaren
(pdf-lib ut ur `generate-event-attachment`) · `#1880` kvittot · `#1879`
Mer-raderna · `#1885` genereringsvyn mot riktig data · `#1884` prod-vägarna
(allowlist-luckan stängd, GO-gate, runbook (a)–(g)). `TASK-308` Done
(Marcus prod-mätning). DocRaptor-nyckeln i BÅDA miljöers secrets
(exponerad i chatt — roteras efter prod-verifiering). **MORGONSEKVENS:
sessionsdok S108 Del 16 § D** — runbook (a)–(d) → granska `#1889` →
ready+armera → röktest → facit (`309.10`) → nyckelrotation. Kända
prod-fönster i natt: Mer-radernas EF:er odeployade (Del 16 § C).
Numrering efter S111:s K-sista: re-mät före nästa skörd.

**Session 108 ▶️ ÅTERUPPTAGEN (2026-08-23, `lifecycle: active`, åttonde resumen;
pausad sju gånger, historik) — MÅL FÖR RESUMEN: HELA VÄGEN TILL PROMOVERING
(PUNKT 4 → 5 → 6), SÅ ATT DENNA RESUME BLIR DEN SISTA.** Marcus order:
*"Återuppta S108 … lägga en plan för att ta detta hela vägen till promovering
så allt, alla sidor/ytor och allt vi gjort i denna session blir live i
prod-appen."* Huvudkatalogen bär ingen ägarlapp (S109 stängd) men står på den
landade grenen `docs/s109-hub-lyft`; S111 `lifecycle: active` i eget träd —
S108 fortsätter i sina egna träd: dok `s108-paus-docs` (gren
`docs/s108-resume-8` från `origin/main` `583fcd45`), kod/deploy
`s108-bilagesparet` (lokal `main`, fast-forwardad till `583fcd45`).
**Paus-PR `#1858` verifierad landad** (`583fcd45`). **Numreringen
re-verifierad mot disk — ingen post rörde sig under pausen:** ADR **125** ·
task-**309** · **L522** · 71 fragment · **T176** · f53 · session **112**.
**Två divergenser mellan handoff och disk, flaggade i resume-rapporten:**
(1) *Skapa*-knappen är INTE en stubb på rad 1009 — den ligger på
`GenereringsPrototyp.tsx:1669` och anropar `skapaDokument(true)`, dvs
utkast-vägen (transient Storage-URL som öppnas) utan persistering till
Bilagor-rad; rad 1009 är "Ladda upp ny fil"-stubben. (2) Prototypen kör
mot en HÅRDKODAD fixtur (`ARBOGA`, rad 99) med platser/innehåll i
React-state — ingen datakälla bär eventinnehåll eller `Platser` ännu
(Del 2 § D beslut 6/8), och mallarna hämtas från `/docs/mallar/bilagor/`
som bara Vite serverar i dev. Promoveringen är därför större än en
flagg-flipp. Plan: sessionsdok S108 Del 14 (väntar Marcus kvittens).

**Session 108 ⏸️ PAUSAD (sjunde gången, 2026-08-23 ~13:00, `lifecycle: paused`) —
PUNKT 1–3 KLARA; LEVERANSVÄGEN OCH KVITTOTS INNEHÅLL I PROD; PUNKT 4
SKAPANDET AV BILAGORNA ÄR NÄSTA.** Resume 7 (22:22 → 13:00, 14 PR:er landade).
Morgonen: deltagarinfo-PDF:en OK · kvittot mot Lottas förlaga (`TASK-306`,
`#1856`+`#1857`): benämning `Utbildning 2026-07-25/26, personlig utveckling,
meditation` på EN rad (kolumnen rymmer 72 tecken, mätt i båda motorerna),
A-pris/Summa netto, etiketten "Slutbetalning" bort (*"bara en betalning, varken
slut eller början"*), Vår referens `Miranon Media/Lotta Gotthardsson`, nytt
fält `Bokföringstext (kvitto)` (prod `fldof3z1V1duVZNjM` · staging
`fldlYgrv3P4hKezJE`) · `TASK-305` secrets in på research (`#1855`) · prod-deploy
39/39 12:16Z · **bucketen `bilagor` fanns aldrig i prod** (502 `Bucket not
found`, Marcus skapade den i dashboarden) → `TASK-308` · `#1857` utsparkad av
flakigt CLS-test → `TASK-307` · `T175` (inget `environment:` i CI). Marcus:
*"nu funkar det"* (prod), *"det är ju fortfarande det gamla fula kvittot"* (ja —
mallen kommer med promoveringen). **NÄSTA (resume av 108): grilla punkt 4
(knappen *Skapa bekräftelsebilaga* är en stubb) → bygg → lås facit → `ADR-125`
→ promovering. Marcus: DocRaptor prod-konto.** Numrering vid paus 7: ADR
**125** · task-**309** · **L522** · 71 fragment · **T176** · f53 · session **112**.
Full handoff: sessionsdok S108 § PAUSLÄGE (sjunde) + Del 11–13.

**Session 108 🌙 NATTKÖRNING KLAR (2026-08-23 ~01:15, `lifecycle: active`, historik; resume 7
fortsätter — INTE pausad; Marcus order *"Kör så långt du kan autonomt"*) —
LEVERANSVÄGEN SKARP I ALLA TRE KLASSER, KVITTOT OCH BILAGORNA PRINCE-RENA.**
Landat i natt: `#1835` · `#1837` (bilagorna i Prince, ikon↔QR-gap borttagen) ·
`#1838` (**302.2**) · `#1844` (**304** kvittots Prince-form, 7/7 ställen 0,00 mm) ·
`#1849` (**302.3** städning + purge-target). `TASK-302.1–302.3` Done; `TASK-302`
In Progress tills Marcus acceptans; `TASK-304` AC 1–4 Done, AC 5 öppet;
`TASK-305` mintat (CI-purgejobbets secret-scope — Marcus beslut). `ADR-124`
§ Updates bär städningen. Orkestreraren verifierade på skärm: Dokument-ytan →
*Öppna Betalningskvitto* → 2,5 s → Storage-URL, kvitto-PDF:en läst.
**MARCUS MORGON-MOMENT, i ordning:** (1) `http://localhost:4173/mer/dokument`
(servern kör ur proto-trädet på `main`, origin tillåten i CORS) → välj ett
event → *Öppna Betalningskvitto* → scrolla: som A? ⇒ `TASK-302` Done ·
(2) **kvittots Prince-PDF** (`TASK-304` AC 5): sökväg + återskapande-kommando i
kortets notes → godkänn formen eller ge dom · (3) `TASK-305`: secrets in i
purge-jobbet eller Storage-purgen lokal/manuell · (4) prod-EF-deploy av
`preview-receipt`, `generate-event-attachment`, `send-receipt-email` via
`scripts/fas4-prod-deploy.sh` (+ `test-docraptor-render`/`test-attachments-
storage` ALDRIG prod) · (5) DocRaptor prod-konto (förkrav promovering).
**NÄSTA I SEKVENSEN efter det:** punkt 4 (skapandet av bilagorna) → 5 (lås
facit) → 6 (promoverings-ADR = **ADR-125**, 124 gick till leveransvägen).
Numrering vid nattens slut: ADR **125** · task-**306** · L512 (+ S109:s
olandade L512–L521) · T174 (S111 tog T174) → **T175** · f53 · session 112.
Heartbeat-monitorn stoppad vid nattens slut. Full narrativ: Del 11 § G + Del 12.

**Session 108 ▶️ ÅTERUPPTAGEN (2026-08-22, `lifecycle: active`, sjunde resumen;
pausad sex gånger, historik) — PUNKT 3:S ANDRA HALVA NÄSTA: LEVERANSVÄGEN
(SIGNERAD STORAGE-URL I STÄLLET FÖR `blob:`).** Marcus order: *"Återuppta
S108."* Egen worktree per ADR-090 beslut 2 — huvudkatalogen ägs av S109:s
lapp (PID 28332, satt 2026-08-22T08:05:20Z, hookens liveness-prov:
**levande**, fällde första orienteringskommandot); dok-trädet
`s108-paus-docs`, gren `docs/s108-resume-7` från `origin/main` `7fdebcc5`.
**Paus-PR `#1817` verifierad landad** (`b77bbb44`) och **`#1815` landad**
(`7fdebcc5`, punkt 3:s första halva). **Numreringen re-verifierad mot disk:
två poster rörde sig under pausen** — ADR **124** · task-**301** · **L512**
· **77** fragment (handoffen sade 75; nästa **78**) · **T174** (handoffen
sade T173 — `T173` finns nu) · **f53** · session **112**. OBS: S109:s gren
`docs/s109-hub-lyft` (`8b993fdc`, ej landad) konsoliderar tio fragment →
**L512–L521**; landar den är nästa lesson **L522** och fragmentantalet
sjunker med tio. Inget arbetsform-läge aktivt (`arbetsform-tillstand.sh
las`) — ingen ARBETSFORM-rad att återskapa. Heartbeat-monitorn FORTSATT ej
startad (`T144` `paused`). Båda S108-träden rena. **NÄSTA: (1) avgör den
öppna designfrågan — sidoeffektsfrihet kontra transient Storage-fil — med
Marcus · (2) bygg leveransvägen som egen arbetsenhet · (3) Marcus verifierar
scrollen i webbläsaren mot `http://`-referensen · sedan kvittots gap/grid-
omgranskning → punkt 4 → 5 → 6.**

**Session 108 ⏸️ PAUSAD (sjätte gången, 2026-08-22, `lifecycle: paused`, historik) —
PUNKT 3:S FÖRSTA HALVA LANDAD; LEVERANSVÄGEN VALD, MÄTT OCH OBYGGD.**
Förhandsgranskningen är nu en RIKTIG PDF genom `ADR-119`-vägen — `#1815`
armerad (5 commits `80ef31dc`…`7af1ef6c`). **Tre grundorsaker, alla mätta:**
(1) DocRaptor 422 `File system access is not allowed` — Vite skriver om
CSS:ens `url()` till `/public/…` och `/@fs/…`, och en ohämtbar referens som
lämnas ORÖRD läses av Prince som filsystemsåtkomst och fäller HELA jobbet
(fail-safe som funkar i webbläsare är destruktiv server-side; neutraliseras
nu med `local("")`). (2) **Prince honorerar INTE flex-`gap`** och renderar
`display:grid` fel — fyra-fallstest genom samma EF; mellanrummet mellan ikon
och QR hade ALDRIG funnits i PDF:en. (3) **Blob-URL:en, inte dokumentet,
orsakar den laggiga scrollen** — Marcus A/B: samma PDF perfekt som `file://`
OCH `http://`, laggig som `blob:`. **Tre agenter:** PDFium-mätning
dekomponerade sidan (bilder 41 %, text 27 %, vattenstämpel 20 %, QR **1,9 %**
— QR-hypotesen föll med siffror), plus två research-pass. **Orkestreraren
stängde passets största öppna fråga med mätning:** Supabase Storage signerade
URL:er svarar `accept-ranges: bytes` + **206** — alternativ A bekräftat
byggbart. **FELKLASS VÄRD ATT MINNAS: tre omätta fixar i rad, alla fällda av
Marcus** — self-review fångade noll. **NÄSTA (resume av 108): leveransvägen
(signerad Storage-URL för klass B/C, Marcus GO), efter att den öppna
designfrågan om sidoeffektsfrihet avgjorts → sedan kvittots gap/grid-
omgranskning → punkt 4 → 5 → 6.** Numrering vid paus 6: ADR **124** ·
task-**301** · **L512** · 75 fragment (nästa **76**) · **T173** · **f53** ·
session **112**.
Full handoff: sessionsdok S108 § PAUSLÄGE (sjätte) + Del 10.

**Session 108 ▶️ ÅTERUPPTAGEN (2026-08-22, `lifecycle: active`, sjätte resumen, historik;
pausad fem gånger, historik) — MARCUS-SEKVENS PUNKT 3 NÄSTA: FÖRHANDS-
GRANSKNINGEN SOM RIKTIG PDF I NY FLIK.** Marcus order: *"Återuppta S108."*
Egen worktree per ADR-090 beslut 2 — huvudkatalogen ägs av lapp `03bc2d12`
(PID 28332, satt 2026-08-22T08:05:20Z, hookens liveness-prov: **levande**);
dok-trädet `s108-paus-docs`, gren `docs/s108-resume-6` från `origin/main`
`d4997b5a`. **Paus-PR `#1801` verifierad landad** (`2794127d`). **Numreringen
re-verifierad mot disk vid resume: OFÖRÄNDRAD på varje post** — ADR **124** ·
task-**296** · **L512** · 69 fragment (nästa **70**) · **T172** · **f53** ·
session **112**. Inget arbetsform-läge aktivt i något träd (`arbetsform-
tillstand.sh las`) — ingen ARBETSFORM-rad att återskapa; `iteration` sätts
när punkt 3-varvet inleds. Båda S108-träden rena, 0 commits före
`origin/main`. **NÄSTA: punkt 3 (förhandsgranskning → riktig PDF i ny flik,
bilaga OCH kvitto) → 4 skapandet av bilagorna → 5 facit-lås → 6
`ADR-124` → PRD/skivor → promovering (ADR-103).**

**Session 108 ⏸️ PAUSAD (femte gången, 2026-08-22, `lifecycle: paused`, historik) —
PROTOTYPEN LANDAD EFTER 18 VARV, MALLARNA MÄTTA MOT ROGERS FÖRLAGOR,
KVITTOTS INNEHÅLL BYGGT — FORMEN KVAR.** Egen worktree `s108-bilagesparet`
(ADR-090 beslut 2), gren `docs/s108-resume` — **PUSHAD** (18 commits,
`da957f75`…`78bf572f`) och arbetsformen `iteration` **RENSAD** medvetet före
pushen. Push-ekonomins undantagslista, posten *"allt före paus/handoff"*
(ADR-096 write-ahead) gör pausen till undantaget från iterations-kadensen —
Marcus frågade, mekanismen svarade.
Marcus dom: *"Nu är jag helt nöjd med hur detta ser ut för
bekräftelsebilagan."* Varv 7–12 drevs av MÄTNING, inte tyckande — och
mätningen **falsifierade handoffens egen hypotes**: Hem-svepets overlay, som
pekats ut som förebild, är med 406 ms nästan dubbelt så långsam som den
"laggiga" blockdialogens 208 ms. Ankringen var axeln, inte hastigheten.
**Formen som sitter:** dialog med låst övre kant + tre zoner (positionsspann
149→0 px) · Inforutan som SEKTIONSMORF utan dialoger, Δ=0 mellan läs- och
ändraläge (602→602 px) · agendan som läslista, 48 px per rad, meditation som
punkttyp i stället för kryssruta (montering 170→58 ms, fält vid öppning 42→0)
· saknat värde markerat med KONTUR i varningsrutans färg · beskrivningen visar
Rogers verbatim text med styckena bevarade och rullisten i rutan.
**FACIT LÅSES INTE ÄN** — Marcus beslut vid pausen: *"Vi låser facit när alla
sidor/ytor sitter."* Bekräftelsebilagans form är därmed oskyddad; behandla den
som frusen tills manifestet skrivs. **Fynd om SKARP kod, ej åtgärdade:**
`RedigeringsRad`s "ändrar från" trunkeras till "Ut…"/"ZZ…" på 390 px ·
"Datum och tid" är fritextfält fast värdet härleds. **PÅGÅR (resume 2026-08-22):
förhandsgranskning · deltagarinformation · kvitto · skapandet av bilagorna, i
den ordning Marcus väljer.** Dev-servern uppe på `localhost:5173` via
polling-configen; prototypmodulen verifierat transformerad (200, 232 KB).
Numrering **re-deriverad mot `origin/main` `aba0d61b`**: ADR **124** ·
task-**288** · **L512** · **62** fragment (nästa **63**) · **T169** · **f53**
— paus-radens värden (task-286 · 60 fragment · T160 · f51) hann förbrukas av
S109/S110 under pausen, precis som handoffen varnade.

**Dagens landningar:** `#1737` (resume) · `#1754` (Del 5) · `#1756` (T170) ·
`#1757` (research) · `#1759` (Del 6) MERGED; `#1763` (kvittots moms + org) och
`#1766` (prototypen + mallarna) armerade i kön vid pausen.
**Två agenter levererade:** kvittots innehåll med momsen bevisad via NEGATIV
KONTROLL (saboterad beräkning → 1 av 11 tester föll → återställd), och
mall-diffen med **78 egenskaper mätta, 76 avvikande, 69 rättade**.
**Grövsta fyndet:** bekräftelsebilagan rymdes inte på en sida (373,6 mm, 26 %
för mycket vertikalt) — ingen tidigare mätning fångade det.
**Dokumentfel rättat:** Del 2 § C:s fem tal HÖLL men gällde
DELTAGARINFORMATIONENS inforuta, inte bekräftelsebilagans — rutorna skiljer
36 mm, och en rak tillämpning hade gjort bekräftelsebilagans ruta 36 mm för
smal.
**NÄSTA (resume av 108): granska mallarnas efter-läge + svara på F1–F7 ·
kvittots FORM · förhandsgranskningen om till faktisk PDF i ny flik ·
skapandet · sedan facit-lås.**
Numrering vid paus (`origin/main` `78f1158d`): ADR **124** · task-**289** ·
**L512** · 62 fragment (nästa **63**) · **T171** · **f53** — mät trådserien i
BÅDA ytorna vid resume, en kollision inträffade i dag på exakt den skillnaden.
**Resume 5 (2026-08-22):** `#1763` landad (`5385fc4b`); `#1766` var RÖD på
`check-langa-streck` (fem tankstreck i prototypen, samma grindklass som
S109:s `60c80175`) → konverterade per policyn, `8c28d05d` pushad, armeringen
kvar; streckfrågan för PDF-dokumenten bokförd som **F8**. Numreringen
re-deriverad: OFÖRÄNDRAD på varje post.
**Resume 5, resten (2026-08-22):** F1–F8 beslutade (Segoe → Selawik Bold,
Microsofts egen OFL-tvilling; F6 egen SVG efter 1200 dpi-mätning — inget av
sju ikonbibliotek bär förlagans 3×3) · **kvittot KLART mot Rogers förlaga**
(form två mätpass + innehåll: `2 500,00`, SEK, e-post, ISO-datum, adress i
tre fält) · persondata i publikt repo → `#1786` + **T171** · **ADR-119
beslut 7 BETALT** (DocRaptor-minimaltest mot testnyckeln, ~3 s/dokument,
åäö + Carlito OK, `docs/research/docraptor-minimaltest-2026-08-22.md`).
13 PR:er landade. 7 agent-worktrees städade. **NÄSTA (resume av 108):
MARCUS-SEKVENS 3 — förhandsgranskningen som riktig PDF i ny flik →
4 skapandet → 5 facit-lås → 6 ADR-124/PRD/promovering** (Marcus vill nå 6
i nästa resume). Numrering vid paus 5 (`a7dd94c5`): ADR **124** ·
task-**296** · **L512** · 69 fragment (nästa **70**) · **T172** · **f53** ·
session **112** — serierna rör sig snabbt, mät mot disk.
Full handoff: sessionsdok S108 § PAUSLÄGE (femte) + Del 8–9.

**Session 107 ⏸️ PAUSAD (sjunde gången, 2026-08-20, `lifecycle: paused`) —
PDF-VÄGEN LÅST I ADR-119, ASSETS OCH FONTER LANDADE, MALLARNA BYGGDA.**
Marcus dom stängde omtaget: *"Nu är jag jättenöjd med hur det ser ut och
funkar."* **PR #1597 MERGED `13203e51`, `Vercel: success` verifierat** —
noll EF-filer i vågen, så ingen prod-EF-deploy behövdes. Fem commits:
rubrikerna bort · **räckvidds-axeln blev EN kontroll** (knappen "Visa
gemensamma dokument" riven, `EventValjare` bär läget via opt-in
`gemensamtAlternativ`; knappens etikett var dessutom OSANN — eventläget
visar redan gemensamma bilagor) · **filen först, räckvidden sedan** (det
permanenta tvåstegs-blocket rivet, `RackviddsDialog` frågar efter filvalet)
· listan rullar inline (exakt 4 rader, 396 px MÄTT, fast höjd så filterbyte
inte flyttar layouten) · listan blev egen `bg-surface`-yta med symmetrisk
ram. **"Delade dokument"**, inte "Alla dokument" (det senare OSANT — bara
Kurstyp/Alla event visas där). **INSTANS SEX av osynlighets-buggen fångad
FÖRE landning** — och den avslöjade en LEVANDE bugg: `RackviddBadge` har
varit osynlig på **Åtgärds-sidans** bilageväljare i tre veckor, friskriven i
prosa utan mätning. Två acceptance-vakter mäter nu faktisk
`backgroundColor`. KVAR (fullständig disk-verifierad restlista i **Del 11 §
D**): **alla 14 kort står To Do** (Del 8 sade nio) · `task-277` ej skapat ·
ORDLISTA § Familj saknas · `VariantD` är LIVE ej prototyp · **lesson-lucka
(16)–(18) aldrig utskrivna** · QA 273.5 steg 6 + QA 275.4. **TRE NYA
MARCUS-PUNKTER i Del 11 § E:** Personer-vyns räknare+filtrering (INTE en
enkel ändring — sju e2e-assertions + saknad serversiffra) ·
**nollställningen inför Lotta / brytpunkts-frågan (tyngst, tidskritisk —
Lotta släpps in imorgon)** · bevakningsraderna (leder ingenstans är
AVSIKTLIGT, sändflödet obyggt i task-241; två lägen finns redan kodade).
**PAUS 5 (2026-08-18): PRIO 1 + 3 STÄNGDA.** Testraden borta ur prod
(`count = 0`, länk återställd till staging). **Eventinfo-svepet LANDAT**
(#1604) — samma overlay + övergång, ordet "nya" återinfört med geometri MÄTT
(375 px en rad, 1440 px två). Åtta PR:er landade (#1600–#1607), `main`
`a54d4bbd`, träd rent. **Marcus pushback fällde tre av Code:s ramar:**
täckningshålet var i själva verket **fälla 47** — `Antal hämtningar` är
`COUNTA({Engagemang})` och `get-leads` filtrerar på den, så **33 riktiga
leads är osynliga i HELA appen** (69 personer bär divergensen, mätt i prod) ·
PDF-frågan var ramad i vår runtime i stället för i branschpraxis → omstyrd
research ger domen **HTML/CSS-rendering, aldrig koordinat-ritning**; headless
Chrome går strukturellt inte i Edge Functions, men Supabases egen dok visar
Satori köra CSS-layout där · nollställningens brytpunkt 2026-04-19 är FEL —
backfillen rörde bara närvaro, så **308 av 457 förfallna ligger FÖRE
fönstret**, och 457 är ett golv (565 anmälningar har TOMMA betalfält).
**SEX ÖPPNA BESLUT väntar Marcus** (PDF-vägen · brytpunkten · de tomma
betalfälten · ompeka basformeln · 69 Engagemang-rader · AC #7 på 241.8).
`TASK-277` färdigspeccad men EJ BYGGD. Heartbeat-monitorn stoppad medvetet —
**starta om vid resume**. Numrering: ADR 119 · **task-278** (277 förbrukat) ·
L512 + 48 fragment · T145 · f50 (ohärledd) — re-derivera ALLTID. Full
handoff: sessionsdok S107 § Paushistorik (femte gången) + Del 14. **RESUME 5
(2026-08-19):** paus-landningen verifierad på `main` (#1609, `f598883d`),
numreringen re-deriverad (f50 nu HÄRLEDD ur disk, var ohärledd; **fragment
är 47, inte 48** — handoffen räknade `README.md` som fragment), todo-rubrikens paus-räknare rättad, och **heartbeat-monitorn
medvetet EJ omstartad** — `#1488` är röd, och policyns GRÄNS-rad undantar
röd-vägen från Dependabot-tystnaden, så en omstart återinför larm var
90:e sekund (`T144`). Vägvalet är Marcus. Läge: Del 15.** **PAUS 6 (2026-08-19):** `TASK-277`+`278` byggda och staging-deployade (`total: 58` verifierat) · **ADR-119** låser PDF-vägen (extern HTML/CSS-motor, generering EN gång per event, BIFOGA) · **ADR-120** gör Resend till ett medvetet val i stället för ett arv · loggan i äkta vektor med originalfärger (Marcus fångst: två hexvärden) · favicon + PWA-ikoner bär nu Rogers riktiga M · Cavolini-licensen MÄTT (`fsType 0x0008`) · `TASK-279` bilage-mallarna byggda (#1634 armerad). **MARCUS ÖPPNA MOMENT: prod-EF-deploy · verifiera favicon+PWA-ikon · granska mallarna (QR-placeringen omvänd i kortet mot förlagan).** Numrering: ADR 121 · task-280 · L512 + 47 fragment · T148 · f51. Full handoff: sessionsdok S107 § PAUSLÄGE (sjätte gången) + Del 17. **RESUME 6 (2026-08-20):** paus-landningen verifierad (`#1634` + `#1635` MERGED, `main` `1f3ddc02`), numreringen re-deriverad — **alla sex serier höll**. **NY DIVERGENS: nattnätet rött TRE nätter i rad (08-18/19/20), obokfört i paus-blocket.** Sex röda jobb i tre klasser — bokföring (31 obockade kort · 2 arkiv-kandidater · **16 obesvarade larm-ärenden sedan `#1428`**), externt (länkröta), och **två äkta trädfel**: `tests/a11y/NavCard.spec.ts` (varierande assertion = misstänkt flake, EJ mätt) och `tests/e2e/mer-index.staging.test.ts:110/:128` — **rad-för-rad identiskt tre nätter, och rad 128 är S107:s EGET fynd-fix-test som aldrig blev grönt** (belagt från larm `#1588`, 2026-08-17). Marcus order: ta nattnätet + larmskulden. Läge: Del 18. **PAUS 7 (2026-08-20):** 21 PR:er landade. **Nattnätet: fyra av sex grindar stängda** — sessionsdok-fönstret, backlog 31→15, A11y (`NavCard`, brytpunkt mätt till två körningar fyra minuter isär, därefter 17/17 röda) och staging-E2E (testet mätte fel sak, produkten var korrekt). Kvar: länkrötan (externt) + 16 larm (medvetet sist). **PROD-DEPLOY: 39/39 EF:er verifierade** — personlistan visar 559, mätt mot basen med kontrollsumma (671 = 559 + 110 + 2); av dem har 377 DELTAGIT och 182 är anmälda utan att ha genomfört. **PWA-ikonen rotorsakad i Chromiums källkod** (icons-listan är Cache-Control: immutable från 144) → `TASK-280` innehållshash. **Centreringen: Marcus öga slog sex mätmetoder** — han bisekterade och valde 1 px mot renderad skala, verkställt i källan med kvitto inom 0,02 px över fem ikoner. **SENTRY HADE ALDRIG VARIT PÅSLAGEN** — DSN i Supabase i stället för Vercel, 3,5 månader tyst; åtgärdad och skarpt verifierad 10:43:14Z (`T151`). **SKÖRD: 8 fragment** (2 UNIVERSAL, 5 egna fel). Trådar `T148`–`T151` födda. **NÄSTA RESUME: uppdateringsbannern + felmeddelandena — ingången är Del 20 § F.** Numrering: ADR 121 · task-283 · L512 + 55 fragment · T152 · f51. Full handoff: sessionsdok S107 § PAUSLÄGE (sjunde gången) + Del 20.

**Session 107 — första passet (historik): NIO-PUNKTSLISTAN: utredning +
nio byggskivor landade på EN dag.** Sju
utredningsagenter →
bas-svepet (Event-59/60/61 skapade, 26 orphan-anmälningar länkade, Agneta
läkt — `{Event}=BLANK()` mätt 0) → PRD 273 (UI-fixpaketet) + 274
(utskicks-spärren) + ADR-118/PRD 275 (bilagornas räckviddsmodell, grillad
samsyn) + förlage-analysen (`docs/research/dokumentmallarnas-forlagor-2026-08-17.md`).
LANDAT: 273.1/.2/.3/.4/.6 · 274 · 275.1/.2/.3 (**PR 1584 merge `4cadf003`
verifierad vid resume**; paus-landningen `28e28148`). KVAR: Done-flippar ·
Marcus QA 273.5 + 275.4 (4
amenderings-sidofiler väntar omstämpling) · spärrens prod-deploy · tre
mallsvaren → PRD 276 · test-aktivitetsraden · S102-arvet (127.10/147.9/269
AC3 → Lotta). Numrering re-deriverad vid resume: ADR 119 · task-276 ·
L512+fragment · T145 · f50 — re-derivera ALLTID. Full handoff: sessionsdok
S107 § Paushistorik + Del 5.**

**Session 106 ✅ AVSLUTAD (2026-08-15, `lifecycle: closed` efter Marcus
coverage-kvittens) — AKTIVITETSHISTORIK-SIDANS OMDESIGN: HELA PROTOTYP→
SKARPT-BÅGEN PÅ EN DAG.** Konvergens-pass direkt på befintlig yta (divergens
bortvald på Marcus order; Check-in-rotdiagnosen S103/task-209 som grund,
varje varv bedömt mot RENDERAD yta) → facit-låsning → PRD `TASK-225` + 5
skivor → flip + härdning → Marcus `godkand`-stämpel via `!` → mekanisk
rivning. **Formen:** husets sidkrom + personlistans radgrammatik + uppdelad
filterrad + NY datumväljare (`DatumFalt`, lyft till primitives) + verb-copy
som presentationslager (delad modul; hem-spalten påkopplad med Marcus-
omstämplad facit-amendering) + EF-totalen ("Visar 20 av 279 poster.",
live-bevisad). **Landningar (alla MERGED):** `#1316`/`#1328`/`#1335` (merge
`b924fb1b`)/`#1345`/`#1353`. Kort `225.1`–`225.5` + PRD `225` Done. **PROD:**
Marcus deployade full allowlist 35/35 (EF-totalen + väntande fixar inkl.
`TASK-196` nu i prod) · display_name satt (Marcus + Lotta) → initialerna
MJ/LG löser sig vid nästa inloggning; historiska rader behåller gamla namn
(append-only, beslut). **Skörd:** 2 lessons-fragment (autofix-helträd
[UNIVERSAL]-kandidat · facit-kallor-före-stämpel) + tråd `T144` (heartbeat-
larmbrus för främmande PR:er). **NÄSTA ARBETE ÖPPNAR S107** — kandidater:
AT-Max-milstolpen (byggplanens nästa) · S105 A-listans rester (tre
oinstrumenterade skrivvägar, runbook-felet) · `T144`. Numrering efter S106:
session 107 · ADR 112 · L512 + 8 fragment · T145 · task-226 — re-derivera
ALLTID. Full narrativ: sessionsdok S106 Del 1–3 + BUILD-LOG S106-post.

**Session 102 ✅ AVSLUTAD (2026-08-17, `lifecycle: closed`) — GO-LIVE-PASSET,
åtta pauser, 2026-08-10 → 2026-08-17. Resume 8 var stängningspasset.
**FAS 4 KLAR: 39 EF:er deployade till prod** via `scripts/fas4-prod-deploy.sh`
(TASK-272, byggt i passet — verifierar länkläget före varje skarp operation
och återlänkar till staging i en EXIT-trap; skyddsräckena höll vid första
verkliga körningen). Mätt mot prod-svaret: 39 ACTIVE, alla `updated_at` inom
55 s, noll `test-*` i prod, `create-attendance` v1 med deny-triple 401/401/405.
**Prod-verifikat i passet:** CORS tvåsidigt bevisad (rätt origin 200 + speglad,
främmande 403) · prod-bundlen bär dagens kod · passkeys aktiva med
`rpId: admin.miranon.dev` · Site URL bekräftad av Marcus · `Bilagor` mätt tom.
**Klass B-buggen (tyst dataförorening vid varje Visa-klick) var redan borta** —
deployen 06:59 bar preview-grenen; kedjan ancestor-bevisad.
**Go-live-planen ommätt:** två kriterier var redan uppfyllda utan att bockas
(person-vyerna, aktivitetsloggen). **KVAR TILL NÄSTA SESSION (Marcus moment):**
QA `127.10` inbjudningsvandringen · QA `147.9` · `269` AC3 (dörrens backup-väg
skarpt) · sedan Lotta. **KVAR TEKNISKT:** stämpel-hookens delta-fix (väg b vald,
obyggd) · `268` schema-strikthet · `239` tre gröna nätter (tidigast 20/8) ·
`256` AC4 · `T144` · `INVITE_REDIRECT_URL` explicit · 40-listan · fem
Dependabot-PR:er. **NÄSTA ARBETE ÖPPNAR NY SESSION.** Numrering efter S102:
task-273 · ADR 116 (reserverad, aldrig mintad) · L512 + 47 fragment · T145 ·
f50 — re-derivera ALLTID. Full narrativ: sessionsdok S102 Del 1–18 + BUILD-LOG
S102-post.** Senior-svepets fynd i resume-rapporten (chatt 2026-08-17):
nightly röd 19 raka nätter — dominanter Länkkontroll (ADR-082-vald
kostnad) + backlog-grinden (task-238-fixen VAR ombord natt 17/8, grinden
cancellades ÄNDÅ mot 10-min-taket → resten av 238 är CI-körtiden) ·
kontraktsvakt-benet #1483 OTRIAGERAT · 5 post-merge-ärenden med färdigt
facit väntar referens-stängning · depbot-majors (react-table 9, motion
13) saknar kort-hem · 6+6 stale grenar städas (arkiv-tag före radering).
Resume 6:s skörd (13 PR:er #1445–#1486): dokument-kedjan KOMPLETT
(stämpel + 147.6 Done + rivning, task-164 Done, ytan SKARP) ·
tid-åtgärden KLAR (rotorsak Zap 4, Opus-backfill 294/294 `Inskickad :=
Rad skapad`, fälla 49, kort 248, A12 skapad+DEPLOYED) · svep-kedjan
stämplad+skivad+BYGGD (241.1 Done, skivor 241.2–241.7 publicerade,
241.2/.3/.4/.5 LANDADE — EF-ytan räckte, unifierad aktivtSvep,
WOW-koreografi + reduced-motion-grind; kvar: QA 241.6 + rivning
241.7) · Morgonkoll-kedjan vid QA-grinden (243.2 facit-tom-granskad,
243.3 hem-sviterna 365→912+ rader — rödserien BRUTEN `5b71dcbb`; kvar:
QA 243.4 + rivning 243.5) · fixvarvet task-247 (b/c/d byggda, a =
basvägen) · Förberedelseskärmen: 233 blink-fix (Sidbytesindikator) +
240 stall-signal+Sentry, båda Done · kort 250/251 mintade · Done-
flippar 164/243.3/233/240 (#1479). **RESUME-INGÅNG (Marcus moment, i
ordning):** (1) QA 243.4 hem-stämpeln + B2-beslutet → 243.5-agent ·
(2) QA 241.6 WOW-domen + facit 18/18 → 241.7-agent · (3)
0.6-grillningen → ADR-115 · (4) EF-deploy-svepet prod (12 EF:er,
HITL) · (5) 40-listan (+ task-34/28 moot, 235 stängningskandidat) ·
(6) passkey p5–6 → 231 → 127.10 · (7) QA-rester 218.5/219.4/127.10+
Roger/147.9 · (8) larm-triage-GO (13 ärenden) + Dependabot #1488.
Rotorsaks-vågen 2026-08-17 fm LANDAD (sessionsdok Del 16): 238/250/
251/255 Done (kvadratroten 1332→14,57 s + ADR-117 · CLI-wrappern ·
worktree-portarna · kontraktsvakt-fixturen), 239 öppen på
mätbevakning, DoD-driftsvepet 24 kort (#1508), issue-svepet 16
stängda/3 bärare, städet 12+148 grenar & 18 worktrees (arkiv-taggat).
Numrering: task-257 (255/256 agent-förbrukade) · ADR 116 (reserverad;
117 förbrukad av 238-agenten) · T146 · L512+18 fragment (+5
kandidater i Del 16) · f50 — re-derivera ALLTID (S104 parallell).
Full handoff: sessionsdok S102 § Paushistorik (sjunde) + Del 15–16. Resume 5:s skörd: Visa-kedjan KOMPLETT (varv
3 #1415 · task-245 byggd+stängd #1423/#1425 · task-246
byggd+stängd #1431/#1433; dokument-stämpeln VÄNTAR — facit-låset
förberett #1437,
`s102-dokument-konvergens`, godkand: null) · **Morgonkollen LANDAD**
(243.1 två varv + S55-arkivflytten [Marcus vägval 1] #1426/`3792359d`,
stängd #1440; skarpa hem ÄR nya formen, OGRANSKAD — 243.4 är grinden) ·
R2 SLUTBEVISAD (244 varv 3+4, post-merge grön run 31958558973, #1403
STÄNGT, Done #1429) · svep varv 1 UNDERKÄNT → varv 2 på Opus #1438
(fem orkestrerar-premisser mätt-falsifierade; Marcus granskar) ·
40-listan levererad #1436 (26/9/5) · prod: passkey t.o.m. p4 +
Dokumentklass-fältet skapat #1435 · 221=B kvitterat · laststormen
(577) sekvenserad cross-session · docs-skulder p8 #1432.
**RESUME-INGÅNG (EXAKT ordning):** (0.5) AVVIKELSE-FIXVARVET (Marcus
prod-fynd: tid-kolumnen saknas · knappbredder olika · bevakningsradernas
kolumn-alignering [ny order, facit-amendering]) FÖRE stämplar · (0.6)
PROCESS-GRILLNINGEN (stämpelordning + mekanisk facit-jämförelse
[ariaSnapshot-grinden beslutad ADR-103 B4 men aldrig skiv-kravsatt] +
main=prod-synlighet in i kontraktet) · (0) Post-merge-facit: RÖD, run
31968918858 — läs loggen först · (1) dokument-stämpeln (`!npm run facit:godkann -- --pass
s102-dokument-konvergens --citat "..."`) → rivningspass · (2)
svep-granskningen 5174 → varv 3/facit-lås · (3) 243.2 → 243.3
(BRÅDSKANDE) → QA 243.4 → 243.5 · (4) 221-rivningen · (5)
CLI-lastkortet mintas · (6) EF-deploy-svepet prod (12 EF:er, HITL) ·
(7) 40-beslutspasset · (8) passkey p5–6 · (9) QA-rester. Numrering:
task-247 · ADR 115 · T145 · L512+18 fragment · f49 — re-derivera
ALLTID (S104 parallell i dag). Full handoff: sessionsdok S102 §
PAUSLÄGE (sjätte) + Del 14. Föregående (femte pausens) skörd: röd-kedjans forensik 12 larm → 6 rötter, 5
fixade+landade (R2 stängd med AC4-bevis 8m34s) · 16 larm stängda, öppet
är ENDAST ärende 1403 (medveten arbetssignal, task-244) · kort 235–244 mintade
(235/236/237/242 + 147.11/147.12 + 208/209 Done) · PRD-paret task-241
Sveparna + task-243 Morgonkollen + ADR-114 publicerade · hem-facit LÅST
(s102-hem-konvergens, godkand: null) · dokument-familjen komplett
(skärpning + klassfält + äkta ersätt/radera) · splash skärpt (tona-in).
**RESUME-INGÅNG:** (1) dokument-varv 3 (Marcus fem kvitterade punkter +
Visa-beteendet) → omgranskning → dokument-facit · (2) task-244 (staging
helt grön → #1403 stängs) · (3) /to-issues på 241+243 · (4) prod-momentet
(allowlist + 147.12-klicklistan + passkey/231) · (5) spot-checks (splash-
övergången) · (6) QA 218.5/219.4 · straggler-kortet · (7) 40-listan ·
221-vägvalet · Airtable-HITL · 127.10+Roger · (8) CLAUDE.md-rättelsen
(§ Kortnummer, "view opåverkad" falsifierad). Numrering: task-245 ·
ADR 115 · T145 · L512+18 fragment · f49 — re-derivera ALLTID. Full
handoff: sessionsdok S102 § PAUSLÄGE (femte) + Del 12–13. Kvällens
skörd: Lotta-vandringen p6–p10 rotorsakade (korten `228`–`234`) · `227`+`228`
BYGGDA+LANDADE+Done · basen 0 olänkade (Helena + batch 7) · passkeys PÅ i
staging (Marcus-aktiverad, e2e-bevisad; prod-klicklista i `231`) ·
prototypens varv 2 + dataläge-knappen landade — granskningspasset på 5174
självbetjänande. **RESUME-INGÅNG:** (1) prototyp-granskningen → facit →
/to-prd · (2) passkey-prod-klicken (`231`) · (3) QA-rester `218.5` · (4)
dokument-prototypen → `147.6` · (5) Airtable-HITL (A2-historik + Helenas
kort) · (6) `221`-vägvalet · (7) plockbara: `233`/`234`/`230` (avblockade) ·
`232` · `222`–`224` · (8) QA `219.4`/`147.9` · `127.10`. Full handoff:
sessionsdok S102 § PAUSLÄGE (fjärde) + Del 11. Laddupplevelsen KLAR OCH
STÄNGD: PRD `218` (Förberedelseskärmen + Startvärmningen, 218.1–218.4
Done, e2e-bevisad i merge-kön) + PRD `219` (Laddtrappan, 219.1–219.3
Done) + `216`/`220` Done + display_name-datafixen i prod (HITL,
verifierad). `218.3` tog FYRA CI-varv — varje rött äkta fångst, inkl. en
genuin produktionsregression (invalidate mot odefinierad auth-kontext)
och fixturvärldens warmup-mockgap. Prototyperna `#1344` på main
(`/dev/hem-prototyp?variant=1/2/3`, kort `226` In Progress tills
vinnarval). `227` mintat (post-login-skärmen). **DEL 10-LÄGET
(2026-08-16):** V1 VALD som vinnare · konvergensvarv 1 i kön (`#1355`) ·
GRILLNING 4 till samsyn (hem = arbetsplatsen · bevakningsraden ·
en-påminnelse-modellen med tre radlägen · kanban avvisad — åtta beslut i
Del 10) · ordlistan +Morgonkoll +Bevakningsrad · CORS/localStorage-
dubbelfällan mätt, dev-servern på 5174. **NÄSTA:** varv 2
(bevakningsraden + tillståndsgrupperna + simulerade datalägen) → Marcus
granskar varv 1+2 i ETT pass → facit → /to-prd hem + svepen · därefter
sekvensen: QA `218.5` · QA `219.4` · `221`-vägvalet · `127.10` + Roger ·
`222`–`224`/`227` plockbara · `147.9`. Numrering: kort 228 · ADR 114 ·
**T145** (T144 förbrukad av S106) · L512+16 fragment — re-derivera
alltid. Full handoff: sessionsdok S102 Del 10.

*(Del 8-blocket nedan är historik.)*
**Session 102 — Del 8-läget (2026-08-15 fm, historik).**
Byggvågens läge: `216`/`219.1`/`220` STÄNGDA (Hej Marcus live) ·
`218.1`/`218.2`/`219.2` levererade+granskade (i kön) · `218.3`+`219.3` i
luften · `218.4` väntar. Display_name-datafixen KLAR (HITL: Marcus
Johansson · Lotta Gotthardsson · EF-smoke; Roger via `127.10`-inbjudan).
Kortkollisionen 217→218/219 löst via CLI (S103-fångst). Fyndvågen
`221`–`224` mintad (`221` = Marcus kravsätt/riv-vägval). **GRILLNING 3
kvitterad: hem-vyns omdesign** (morgonkollen; Obetalda bort; Förfallna
betalningar nytt; SVEPARNA — bekräftelse+påminnelse, EN triad var,
cross-event, egen PRD; estetik via divergens-prototyp V1 ro/V2
kontroll/V3 skönhet, kort `226`) — full samsyn i sessionsdok S102 Del 8.
**NÄSTA:** divergens-agenten → Marcus väljer → konvergens → facit →
/to-prd (hem + svepen) · QA `218.5`/`219.4` · `221`-vägval · `127.10` +
Roger. Numrering: kort 227 (226 förbrukas nu; 225 = S106) · ADR 114 ·
T144 · L512+7 — re-derivera alltid.

*(Del 7-blocket nedan är historik.)*
**Session 102 — Del 7-läget (2026-08-15, historik).**
Resume `#1313` (egen worktree, ADR-090 — huvudkatalogens ägare LEVANDE;
**S106 född parallellt** `#1316`). Vandringens fem inloggnings-punkter
avverkade: `TASK-216` mintad `#1315` + byggd `#1318` (armerad, Done-flipp
efter verifikat) · gul global canvas PROVAD SKARPT OCH SKROTAD
(decline-rationale i Del 7; fyndet `--mm-input-bg`→canvas-kortslutningen
överlever) · display_name-forensiken klar (invite-EF:en kräver namn sedan
TASK-143; HITL-datafix för Marcus/Roger/Lotta väntar signal;
create-admin-user-hålet → kort-våg) · spinner-förbudet spårat till
agent-generalisering utan Marcus-GO · research ×2 landade `#1317`.
**GRILLAD SAMSYN kvitterad (Del 7, nio beslut):** blockerande splash
"Förbereder ditt administrationsverktyg" (Airtable-kompensation, tyst vid
varm start, offline-gate + tyst timeout-släpp, hämta-en-gång-dela,
loaders separat/T90) + laddtrappan i spec §15 (skeleton/knapp-spinner/bar,
S62-golvet orört, Button `isLoading`, fix-våg 32 filer). **NÄSTA:**
/to-prd ×2 + ADR 112/113 + constraints-post → /to-issues → bygge ·
`147.9`-vandringen fortsätter efter fix-vågen. Kvarstår ur paus-sekvensen:
`127.10`/`126.3` · `169`-stängningen. Numrering efter Del 7: ADR **112** ·
T **144** · kort **task-217** · L **512** + 7 fragment — re-derivera
alltid. Full narrativ: sessionsdok S102 Del 7.

**Session 105 ✅ AVSLUTAD (2026-08-15, `lifecycle: closed`, Marcus-kvittens
"Kvitterar, stäng") — FAS 6.5 AKTIVITETSLOGG ✅ KLAR.** Marcus-order:
allt aktivitetsloggs-relaterat ska fungera och vara redo för Lotta.
Landningsverifikat: `#1261`/`#1263`/`#1264`/`#1265` samtliga MERGED —
paus-NÄSTA steg 1 stängt. Komplett fil:rad-belagd inventering i sessionsdok
S105 **Del 9** (Explore-svep + kort-/PR-/facit-/numreringsverifikat):
**A. Lotta-påverkande kvar:** QA `201.10` punkt 2–8 (punkt 1 = facit-stämpeln
REDAN gjord 2026-08-13) · `201.9` AC #4 rök-test hem-spalten i prod (nu
möjligt, `#1264` utrullad) · **TRE oinstrumenterade skrivvägar utanför
mutations-mappen** (`CreateEventForm.tsx:122` createEvent ·
`SegmentMailCompose.tsx:74` sendEmail · `SegmentBuilder.tsx:91` saveSegment —
Marcus-beslut: instrumentera eller öppet undanta) · runbookens § Steg 5-fel
(`401·401·401`, inte 405, med `verify_jwt = true`) · `#1249`-beslutet ·
död kod-beslutet (`useConfirmAll`/`useLogPaymentReminder`).
**B. Stängningar:** korten `201.9`/`201.13`/`201.14`/`210` → Done · PRD `201`
DoD-bockning (byggplan amenderad ✓, facit-stämpel ✓) · dok-driften (byggplans-
rad 92 "EJ ÄNDRAD", ADR-111-inlösta textställen ×3, FEATURE-ACTIVITY-LOG
"Planerad", config.toml-stale-kommentaren, task-207-filnamnet).
**C. Bokfört öppet:** ingen e2e för historikvy/spalt · visual-grinden utanför
blockerande CI · `@ts-nocheck`-asymmetrin · Vercel Skew. Numrering
re-verifierad: ADR 112 · L512 + 4 fragment · T144 · task-214. **EXEKVERINGS-
VÅGEN GENOMFÖRD PÅ MARCUS MANDAT (Del 10, samma kväll):** `#1285`–`#1292` +
`#1287` + `#1249` LANDADE · QA-vandringen körd MEKANISKT (Marcus descope,
verbatim i `201.10`) med kärnbeviset live (hem-spalten utan omladdning,
fritext aldrig exponerad, requestId läst i nätverksfliken) · `201.9`+`201.10`
→ Done · stale-larmet om prod-fronten TILLBAKADRAGET efter förstapartsmätning
(vercel inspect: `main@133cb91c` ⊇ `#1264` aliasad; Vercel-CLI-åtkomsten
FANNS — ny registerrad i `atkomst-och-nycklar.md`) · FYND: event-filtrets
namndubbletter (fix-agent i luften). **FAS 6.5 ✅ KLAR (2026-08-14, Del 11):**
alla 19 kort Done (PRD `201` + 18 underkort; katalog-invarianten slutmätt
16/16/0 efter rivningen `201.18`) · `#1294`/`#1296`/`#1297`/`#1298` MERGED
gröna per jobb · byggplan v1.17 + fas-rad ✅ + Slutförd-paragraf · CHANGELOG
[0.8.0] · BUILD-LOG KOMPLETT-post · lättläst-v3 · två lessons-fragment
(deploy-färskhet-i-kedjan [UNIVERSAL] + nästlade-worktree-sökvägar).
phase-end-sviten körd i ekvivalent grep-form (skriptet kräver rg som saknas
— HUB-FYND); CLAUDE.md/README-checkarna klassade som ADR-100-delegering,
inte drift. **STÄNGD (Del 12):** coverage tolv poster noll SAKNAS ·
transcript-ref 8 062 792 byte · 11 agent-worktrees städade ·
arkiveringen DEFERRED öppet till nästa arkiveringssvep (9 referenser
varav 3 CLI-låsta kort; S87–S104 väntar samma svep) · hub-lyftet deferred
till hub-sync-moment. **NÄSTA ARBETE ÖPPNAR S106.** Numrering efter S105:
ADR 112 · L512 + 6 fragment · T144 · task-215 — re-derivera ALLTID.
Marcus-`!`-moment kvar: facit-notens stale mening (ADR-104-vakten nekar
agent-edit av stämplat manifest, per design). HANDOFF: sessionsdok S105
Del 9–12. *(Paus-blocket nedan bevarat.)*

**Session 105 ⏸️ PAUSAD (2026-08-13 kväll, `lifecycle: paused`, historik) — FAS 6.5
AKTIVITETSLOGGEN ÄR LIVE I PROD.** Marcus körde runbooken själv, guidad
kommando för kommando (prod-låset kringgicks ALDRIG); `activity_log` +
`log-activity` + `get-activity-log` skarpa sedan ~18:30, rök-testet
bevisade kedjan klient→EF→tabell→läsväg. **NOLL LUCKOR på Marcus order:**
15 mutationshooks / 15 loggar (före 15/11/4), uppdateringsbanner +
kraschfönster-fångare byggda, hem-spaltens 5-min-fördröjning lagad.
**Två fel som rök-testet avslöjade och ingen testplan hade fångat:**
SW-precachen fångad LIVE (Marcus browser körde gammal kod) och
hem-spaltens cache. **KVAR FÖR MARCUS:** `#1249` sex ogranskade
baslinjebilder · riva död kod (`useConfirmAll`/`useLogPaymentReminder`,
noll konsumenter) · Vercel Skew Protection (kontobeslut) · Vercel-åtkomst
till registret · rotera `VERCEL_OIDC_TOKEN` · `TASK-196`-fixen till prod
(bilageuppladdningen bär fortfarande buggen där) · `TASK-188`/`205`
motsäger varandra om samma test. Full narrativ: sessionsdok S105 Del 1–8,
Paushistorik ×3, PAUSLÄGE. **Access-"blockeringen" FALSIFIERAD på Marcus invändning:**
Supabase CLI var inloggat via macOS-nyckelringen sedan 2026-03-30 hela tiden
(tom `~/.supabase/` var bevis för RÄTT lagring, läst som frånvaro; nattens
`link`-hängning var lösenordsprompten, inte login). Migrationen applicerad,
`activity_log` live i staging, **`TASK-201.11` stängd som falsifierad**.
**201.2 landad** (`#1202`, `service_role` saknade GRANT trots BYPASSRLS →
append-only nu strukturellt sant) · **201.5 landad** (`#1215`, läsvägen +
hookarna) · **201.3 i luften** (`#1216`, hermetik-vakten löst centralt,
acceptance 189/7 → 197/0). **TASK-196 STÄNGD** — EF:en var aldrig deployad;
deployad nu, 3/3 röda före → 3/3 gröna efter. **SÄKERHET:** `service_role`-JWT
exponerad i agent-transkript av `supabase projects api-keys` UTAN `--reveal`;
research fann att **legacy-nycklar inte längre GÅR att rotera** (Supabase
verbatim) → migrering är GOLV, kort **TASK-204**. **TASK-203** landade
deny-hook + prod-ref-lås (45 tvåsidiga fall); **Marcus beslut A** — låset
brett, `201.9` förblir HITL. **TASK-202** landade åtkomstregistret +
`npm run atkomst:diagnos`. **Trådar `T141`** (`/add-dir` KRYMPER filåtkomsten,
A→B→A-mätt) **och `T142`** (CI hämtar grindverktyg från nätet — sju
fällningar på en eftermiddag, tre i merge_group med tyst konsumerad
armering). **ÖPPEN DESIGNKOLLISION:** facit visar långt tankestreck i
aktivitetsraderna, `check-langa-streck` förbjuder det — två Marcus-beslut
kolliderar, MÅSTE avgöras före 201.7. Grillningen
(fem kvitterade beslut, Del 2): B-målet skivat kärnvy→filterrad · alla
~11 mutationstyper loggas · **Supabase `activity_log`, inte Airtable**
(`ADR-110`) · requestId enda korrelations-ID (`ADR-111`) · xAPI-konformans
= Passionslyfts-förberedelsen. PRD **TASK-201** + skivorna 201.1–201.10;
retroaktivt facit-manifest för s55-hem-konvergens (facit-grinden fällde
två gånger → lagat, grinden fungerar). **Mail-låset utvidgat till egna
send-*-EF:er och SUBAGENT-BEVISAT** (Marcus-order "absolut mekaniskt
stopp"; S102 service-ff:ade huvudkatalogen på SendMessage-bön —
`CLAUDE_PROJECT_DIR`-fyndet är lesson-kandidat 1). **201.1 Done-klass**
(ADR-paret + xAPI-schema + migrationsfil, PR `#1185`); **201.2 STOPPAD
korrekt** — agent-miljön saknar Supabase db-access (fynd **TASK-201.11**,
ready-for-human, PR `#1187`). **RESUME-DAGEN (2026-08-12 förmiddag)
LANDADE ALLT ÖPPET: nattens Nightly-röda rotorsakad och löst via fyra
parallella bygg-agenter** — 201.1 STÄNGD mot belägg (`#1192`) ·
länk-rötan lagad, 4 äkta/5 transienter (`#1193`) · **TASK-196 ROTORSAKAD:
eventual-consistency FALSIFIERAD rött-först; verklig rot =
`storage.list()`-default `limit:100` + obegränsat växande mapp →
`storage.info()`-fix** (`#1194`; EF EJ deployad, väntar token) ·
drift-korten 147.10/184/186 rättade (`#1196`) · T51/T55 STÄNGDA mot S102
Del 6-belägg → 176/177 AC 3 bockat, stängnings-grinden grön (`#1197`).
Token-utredningen: `SUPABASE_ACCESS_TOKEN` saknas genuint (mätt 4 ytor) —
**FALSIFIERAT samma kväll, se Del 5.** **RESUME 3 (2026-08-12 kväll,
Marcus-order "Jag vill få detta klart nu och live i appen"):** `#1216` +
`#1223` verifierade LANDADE (`e4a110bc` / `cf56417b`); paus-landningen
`#1225` var RÖD på `T142`-klassens actionlint-503 (åttonde instansen) →
`gh run rerun --failed` efter `headRefOid`-match → grön → landad
`b5534199`. **Marcus-besluten tagna:** tankestrecket → **mittpunkt `·`**,
inga långa bindestreck i användarsynlig text (facit-grindens larm på just
den skillnaden accepterat) · nyckelmigreringen `TASK-204` = eget pass EFTER
hem-spalten · `~/Downloads`-provet senare. **NÄSTA:** bygg-agenter ute på
`201.4` + `201.6` (båda fria, dep `201.3` landad) + stängning av
`201.2`/`201.3`/`201.5` (landad kod, kort stod kvar `To Do`) → `201.7`
hem-spalten ∥ `201.8` filterraden → `201.9` prod (HITL per beslut A) +
`201.10` QA. **NATTEN LEVERERAD (2026-08-13, AFK-mandat):** hela
vy-kedjan byggd och landad över NIO PR:er — `201.4` (`7e74c94b`) · `201.6`
(`430a8156`) · `201.12` person-navigeringen (`9eaf18f8`) · `201.7`
hem-spalten (`675fed40`) · `201.8` filterraden (`417537f5`) · stängningarna
av `201.2`/`.3`/`.5` (`b8abfb3c`) och av `201.4`/`.6`/`.8`/`.12`
(`7b9441b3`). Sju agenter; `201.7` på Opus per Marcus modell-medskick.
**TVÅ FYND MINTADE:** `TASK-205` (post-merge-rödhet — bisekt-attributionen
FALSIFIERAD av fjorton-körningars mätning, fyra röda interfolierade med
gröna; metodfyndet är att retry-räkningen mäter fel axel) och `TASK-206`
(`check-backlog-closure.sh` ofullbordbar under fleet-last, fyra mätta
instanser; grinden är NATTLIG, ej PR-gate — disk-verifierat).
`T142` nådde ELVA instanser på ett dygn, och `ci.yml`:s egen `ADR-082`-prosa
falsifierades (länkkontrollen är offline, men verktyget hämtas över nätet).
**NÄSTA (Marcus, i ordning): (1) granska hem-spalten + facit-stämplingen —
`201.7` medvetet ÖPPEN, separatorn är mittpunkt `·` som MEDVETEN
facit-avvikelse · (2) `201.9` prod, HITL per ditt beslut A, det är vad som
återstår för "live i appen" · (3) `201.10` QA · (4) `TASK-204`
nyckelmigreringen · (5) `~/Downloads`-provet (`T141`) · (6) diagnos-pass för
`TASK-205`/`TASK-206`.** Numrering disk-re-verifierad vid paus mot
`7b9441b3`: ADR **112** · L**512** + **4 fragment** · tråd **T143** · nästa
toppnivå-kort **task-207** · fälla **48** — re-derivera ALLTID.
**RESUME (2026-08-13 em):** paus-landningen `#1242` VERIFIERAD LANDAD
(`a9115d95`, fyra jobb gröna) · noll öppna PR:er · numreringen oförändrad
mot `a9115d95` · ägarlappen är nu DENNA sessions egen (S102:s borta,
huvudkatalogen vår) · huvudkatalogen släpar 59 PR:er, ej ff:ad.
**NYTT FYND — Nightly RÖD tre nätter i rad** (`a9115d95`/`ddabd215`/
`ca9832d7`), ej bokfört vid paus: backlog-drift på `TASK-176`/`177`/`196`
(Done men 0 AC + 4 DoD obockade) + tre obesvarade larm-ärenden `#1186`
(29 h)/`#1184` (30 h)/`#1174` (32 h), etikett `ci-post-merge`, tröskel
24 h. **INTE `TASK-206`** — grinden fullbordade och fällde på innehåll.
Marcus kvitterade D3-städet som agentspår parallellt med sin sekvens.
Full narrativ: sessionsdok S105 Del 1–7 + Paushistorik ×4.

**Session 102 ⏸️ PAUSAD IGEN (2026-08-11 kväll, `lifecycle: paused`) —
RESUME-DAGEN LEVERERADE GO-LIVE-KÄRNAN: prod-mailvägen SKARP (`176`+`177`
Done, skarpt mail delivered + Reply-To + loggrad), basen synkad
(`Bilagor`+`Kvitton` skapade i prod på GO), 147-kedjan STÄNGD
(Marcus-stämpel `efc4091a`), full-paritetsdeploy 33 EF:er + sju
metod-vakter, rödklassningen stängde 10 ärenden med rotorsak,
`186`+`197` fixade, `169` 14/14 bockade (AC #3 väntar grön natt),
go-live-planen säkrad i `tasks/go-live-plan.md`. Fynd: `196`/`198`/
`199` (stale prod-front, HIGH)/`200`. S105 (aktivitetsloggen, dag
1-krav) STARTAD parallellt — dess PR #1180 stod RÖD vid paus, ägs av
S105.** RESUME-INGÅNG: Marcus muntliga justeringslista FÖRST →
`147.9`-vandringen → `127.10` → `169`-stängning efter grön natt.
Numrering: ADR 110 · L512+3 fragment · T141 · task-202 · f47 —
re-derivera mot disk. Full narrativ: sessionsdok S102 Del 6 +
PAUSLÄGE. Batchen (Marcus-order
max-kort 14 + tak-utvidgning `147.8`): hela `147`-kedjan landad —
bekräftelse/påminnelse/eventinfo/fritt (`147.2`/`147.3`), betalningar
(`147.4`), bilage-sändvägen FRAMME-bevisad (`147.5`), testmailet
(`147.10`, A-rad-formen #1147), ingången+rivningen+mailto-grinden
(`147.8`), kvittot `MM-2026-1001` + **ADR-109** (`147.7`). Tre incidenter
rotorsakade: ref-förväxlingen prod↔staging (S102 Del 4 — prod städad på
Marcus GO, morgonsekvensen RÄTTAD i Del 2), `Event`-fältbuggen
(sändvägens totalblockerare, funnen av FÖRSTA skarpa slutkörningen, fix
PR `#1134`), Deno-boot-felet (`#1145`, grindlucka → `task-195`). Fynd-kort
`187`–`195` (utom 192). **NÄSTA (resume/i morgon): Marcus granskar
åtgärdsytan + STÄMPLAR (`147.10` Done-flipp därefter) · omklicksfrågan
(#1147) · morgonsekvensen per Del 2 RÄTTAD form · kvittots öppna punkter
(moms/pris/org, ADR-109) · QA-korten.** Numrering efter S102:
ADR 110 · L512+3 fragment · T141 · task-196 · f47 — re-derivera ALLTID
(S103/S104 förbrukar parallellt). Full narrativ: sessionsdok S102
Del 1–5 + batchrapporten i Del 5.

**Session 103 ✅ AVSLUTAD 2026-08-15 (`lifecycle: closed` flippas efter
Marcus coverage-kvittens, stängnings-grind 2) — T97-SPÅRET FULLBORDAT:
DÖRRLISTAN ÄR APPENS SKARPA NÄRVARO-YTA.** Promoveringen exekverad
ände-till-ände på Marcus mandat ("orkestrerar oss hela vägen in i mål"):
PRD `task-214` + åtta skivor — WRITE-enabling (`#1299`, idempotent
`create-attendance` som backup) · mutations-kopplingen (`#1301`, Opus,
kvittensfönster-semantiken nätverksbevisad) · referenserna (`#1304`, 12
ariaSnapshot) · FLIPPEN (`#1306`, A/B/C rivna 897 rader) · härdningen
(`#1308`, axe 30/30) · granskningen (orkestreraren på delegerat mandat,
`#1312`) · rivningen (`#1314`, rename `EventCheckin.tsx`, `EventAttendance`
riven) · QA-vandringen (tio punkter, Insiktskedjan levande i basen, `#1321`).
Två CI-varv rotorsakade (streck-grinden, hermetik-skip) → lessons. NIO
fragment skördade (sju UNIVERSAL). Fynd-kort: `task-215` (flake, 2
instanser) · `task-217` (incheckningsverb). **FLAGGOR: TASK-194 prioriterad
(facit-hookens träffyta) · `create-attendance` ej i prod-allowlist
(go-live-punkt) · DoD-mall-läckage (hub-kandidat).** Numrering vid
stängning: ADR **112** · L**512** + 16 fragment · T**144** · task-**218**
— räkna OM (parallellerna S102/S106 förbrukar). **NÄSTA (NY session):
bas-passet HITL — 213.12 (Person-länkningen, Marcus GO per mutation) →
213.2 (mätpasset i Airtables UI) → vågen; TASK-194; plugin 1.34.0.**
**HANDOFF: sessionsdok S103 Del 16 (full tabell + protokollpekare).**
*(Del 15-blocket: se § Paushistorik i sessionsdoket; Del 14-resume- och
pausblocken nedan bevarade.)*

**Session 103 (Del 13, historik) — HÄLSOVÅGEN + KONTINUERLIG BAS-MAXNING +
D GODKÄND OCH STÄMPEL-FÖRBEREDD.**
Nattens tre röda orsaker åtgärdade (`#1270` länken · `#1271` TASK-202/203
Done · `#1273` TASK-205 Done, tredje-orsaks-diagnos: omockad notes-fetch,
+57 px) · 118+17 grenar + 16 worktrees städade · TASK-211 LEVERERAD (hub
`b112257`, plugin **1.34.0**) · TASK-212 mintat. **Marcus beslut: basen
maxas KONTINUERLIGT** → ADR-063 § Updates (`#1275`) + tre Opus-leveranser i
`docs/research/` (bas-defekt-kartlaggning-live · bas-defekt-konsumtionskarta
· bas-atgardsplan, alla 2026-08-14) → **task-213-PRD + 11 skivor** (`#1281`,
alla HITL). **D GODKÄND** (Marcus: "Toppen! Nu vill jag stämpla och
promovera denna") efter två konvergensvarv (`3b5ce0dd` + `247539bb`) —
facit-underlag med `godkand: null` i `#1277` (ADR-104-hooken fällde korrekt
agentens stämplingsförsök; stämpeln är Marcus facit:godkann när `#1277`
landat). **T143** född (prototyp-grund, `#1278`). **ALLT LANDAT före paus:** `#1277` MERGED `0a7f4fe6` · `#1281` MERGED `9986c547`. **NÄSTA: Marcus
stämpel → promoverings-spec (flipp + närvaro-WRITE) → bas-vågen (213.2
mätpasset först) → `#1249` → lessons-skörd (a)–(l).** Numrering mot
`426a1e90`: ADR **112** · L**512** + 4 fragment · T**144** · task-**214** —
räkna OM. **HANDOFF: sessionsdok S103 § PAUSLÄGE (2026-08-14 kväll) +
Del 13.** *(Resume-blocket nedan bevarat.)*

**Session 103 (Del 12, historik) — RESUME MOT
`c8837277`, HUVUDKATALOGEN ÖVERTAGEN.** Paus-lägets påståenden prövade ett i
taget: `#1266` **MERGED** (`f3d3b845`, `2026-08-13T20:26:08Z`) · arbetsform
inget aktivt (inget att återskapa) · närvaro-WRITE 0 träffar oförändrat ·
fixturen antagen kvar (livstid ~2026-08-27, ej re-verifierad mot basen).
**Ägarlapps-skifte:** S105:s lapp prövades mot liveness vid resumens första
git-skrivning, ägaren död — huvudkatalogen bär nu S103:s lapp
(`2026-08-14T15:29:34Z`); landningen sker där, inte i worktree. Numrering
RE-VERIFIERAD mot `c8837277` — samtliga oförändrade: ADR **112** · L**512** +
4 fragment · T**143** · task-**211**. **Läget i sak oförändrat: FORMVALET ÄR
INTE GJORT — NÄSTA: Marcus tittar på D
(`/event/reckgn7arcyW367qT/narvaro?variant=d`) → formval → konvergens →
stämpel → promovering · Carry 11 hemvist-beslut · närvaro-WRITE eget bygge.**
Parallellt: repo-hälsosvep på Marcus order, bokförs vid landning. **HANDOFF:
sessionsdok S103 Del 12 + § Paushistorik (2026-08-13 kväll).**
*(Pausblocket nedan bevarat.)*

**Session 103 (Del 11, historik) — CHECK-IN-PASSET. GRANSKNINGSFIXTUR +
D-VARIANT BYGGD OCH ITERERAD; TVÅ AV ORKESTRERARENS EGNA PÅSTÅENDEN
FALSIFIERADE AV AGENT.** **Kvällens viktigaste
fynd är processuellt:** jag bedömde check-in-varianterna på LÄST KOD utan att ha
sett dem renderade. Marcus fångade det (*"har du ens tittat på hur det ser
ut?"*) och pekade på facit-sidorna som mått. **För en UI-yta är den renderade
bilden källan, inte koden.** **LANDAT:** `#1257` granskningsfixturen
(`d351491c`, `TASK-208` — staging hade NIO `Deltaganden`-rader totalt; nu ett
event `reckgn7arcyW367qT` med 16 personer × 2 sessioner = 32 rader, verifierade
av mig i basen) · `#1259` D-varianten (`453d44ac`, `TASK-209`) · `a4c0a641`
streck-rättelsen. **`#1266` (itereringsvarvet) I LUFTEN vid paus** — armerad
`20:03:47Z`, alla grindar gröna utom `Acceptance` som kör. **CI-fångst:**
`check-langa-streck` fällde `#1259` — grinden bor i jobbet "Lint + Audit +
TypeCheck" och körs INTE av `check:docs`, därför osynlig i agentens lokala svep.
Rättat med OMFORMULERING, inget undantag mintat, så Marcus öppna
tankestrecks-kollision står orörd. **TVÅ ORKESTRERAR-PÅSTÅENDEN FALSIFIERADE:**
"incheckade sorteras överst" var falskt (`byggRaderD` sorterar rent alfabetiskt,
verifierat i `453d44ac`) — defekten verklig men med annan mekanism: nästa
åtgärdbara rad vandrar 65 px per incheckning; och "ingen stämplad sida använder
ytan utanför 600-spalten" var falskt (Hem-facitet gör exakt det). **Mätt
förbättring, mobil, första ÅTGÄRDBARA raden:** 0 incheckade 427 → **367 px**, 5
incheckade 752 (klippt) → **419 px** konstant. **NYTT CARRY 11:** fjärde
bas-defekten — `Personer."Kommande event"` saknar sessions-dedup, dubbelräknar
tvådagars-event, **gäller i prod**; hemvist är Marcus beslut, EJ registrerad.
**FORMVALET ÄR INTE GJORT** — D är landad men inte vald; kvällens arbete gjorde
kandidaten värd att välja, inte valet. **NÄSTA: Marcus tittar på D
(`/event/reckgn7arcyW367qT/narvaro?variant=d`) → formvalet → konvergens →
stämpel → promovering. Närvaro-WRITE fortfarande 0 träffar, eget bygge.**
Numrering vid paus mot `015b4a02`: ADR **112** · L**512** + 4 fragment ·
T**143** · task-**211** (kort-serien rörde sig tre steg under kvällen — räkna
OM). **HANDOFF: sessionsdok S103 § PAUSLÄGE (2026-08-13 kväll) + Del 11.**
*(Resume-blocket nedan bevarat.)*

**Session 103 (Del 10, historik) — RESUME MOT
DISK: PAUS-LÄGETS FEM PÅSTÅENDEN HÖLL, EN DIVERGENS.** `#1229` **MERGED**
(`8b4832c7`, 2026-08-12T20:27:57Z) · `CheckinPrototyp.tsx` **1087 rader** ·
`CHECKIN_PROTO_VARIANTS` rad 1083, routen DEV-grindad `?variant=a|b|c`,
**inget formval gjort** · närvaro-WRITE fortfarande **0 träffar** på
`Deltaganden` i `field-allowlists.ts` · inget arbetsform-läge att återskapa.
**DIVERGENS — carry 9 är förbrukad:** visual-baslinjen är **avfyrad**
(`workflow_dispatch` run `31714504314`, 2026-08-13T15:16:20Z mot `91601d8b`,
success) → **PR `#1249`**, 7 bilder, OPEN/ej draft/`BLOCKED`/oarmerad.
**Utlösaren är S105:s** — `d3f29523` säger i sin body *"Laser upp ADR-103 B4
(visual-baslinjen tas om)"*; carry 9 betalades av en parallell session.
**Rörs INTE av S103** — granskningsbar baslinje-PR som väntar Marcus öga och
ägs av S105; bokförd som fynd, ägaren armerar eller draftar. Numrering RE-VERIFIERAD mot
`91601d8b`: **ADR 112 · L512 + 4 fragment** (båda oförändrade) ·
**T143 · task-208** (båda flyttade sedan pausen, precis som paus-doket
varnade). Arbetsträd `.claude/worktrees/s103-resume-persondetalj-d`, gren
`docs/s103-resume-checkin` ur `origin/main` — huvudkatalogen ägs av levande
S105 (ADR-090 beslut 2). **NÄSTA: check-in-passet — divergens-granskning
(`/event/<id>/narvaro?variant=a|b|c`, Marcus väljer form) + närvaro-WRITE-forken
som eget enabling-bygge FÖRE eller parallellt med formvalet.**
**HANDOFF: sessionsdok S103 Del 10 + § Paushistorik (2026-08-12 sen kväll).**
*(Paus-blocket nedan bevarat.)*

**Session 103 (Del 9, historik) —
PERSONDETALJEN ÄR PROMOVERAD OCH LÅST. ADR-103:s FYRA STEG KLARA, MARCUS
STÄMPEL SATT (`av: marcus, sha: 4648823a`), PROTOTYP-MASKINERIET RIVET.**
`PersonDetailPrototyp.tsx` finns inte längre — den ÄR `PersonDetail.tsx`
(`git mv`, historiken följer FORMEN). Fem granskningsfynd först:
kommande-posten och Just nu-raden klickbara (krävde EF-utökning —
`Deltaganden.Anmälan`/`Event`
fanns i basen, `get-person` exponerade dem inte) · hover-plattan till
eventdetalj-familjens form (mätt: 566 px kant-i-kant → 550 px, radius 0 → 8) ·
motiveringsreferensen särskild med kursfärgs-prick + `·` (INGEN ny form mintad —
repot saknar pill för kursnamn) · pillen först förtydligad, sedan RIVEN HELT på
Marcus omprövning (*"hjälper inte Lotta"*) · aktiv-raden fylld i vila.
**B4-BEVISET: promoverings-grinden 4/4 grön mot ORÖRDA referenser** både efter
flippen och efter renamet. Grinden fällde först — ett **differentialtest mot
FÖRE-läget fällde IDENTISKT**, alltså Playwrights regex-generalisering, inte en
formskillnad; referenserna togs om bokstavligt ur variant-läget med flippen
stashad. **MISSAT CARRY, fångat av CI:** `mailto`-undantaget var fil-scopat till
prototypfilnamnet och dog med renamet — kravet stod i komponentens egen docblock
hela passet. Grinden fångade det, inte självgranskningen.
**NÄSTA: CHECK-IN — förberedelsen är gjord i handoffen** (route
`event/$eventId/narvaro.tsx` · `CheckinPrototyp.tsx` 1087 rader · DIVERGENS med
`?variant=a|b|c`, inget formval gjort · **närvaro-WRITE saknas HELT**, verifierat
0 träffar på `Deltaganden` i `field-allowlists.ts` — det är ett skrivlager att
bygga, inte bara ett designpass). **HANDOFF: sessionsdok S103 § PAUSLÄGE
(2026-08-12 sen kväll) + Del 9.** Föregående pass, Del 8:
**MARCUS GRANSKNINGSVARV PÅ D: SEXTON FEL ÅTGÄRDADE ÖVER FYRA PR:er, TIDSLINJEN
OMBYGGD TILL APPENS LÅSTA `Tidslinje`-FORM.** Del 8: `#1200` (resume,
`011b83bb`) fann att carry 2 var betald av S102 → `#1204` (elva fel,
`f42da6e7` — §46-strängen renderades RÅTT på två ställen; "Nästa event"
visades aldrig; kommande event i Eventhistoriken; "Dag 2" före "Dag 1") →
`#1206` (`ef8f2bf1` — **åtkomsten fanns hela tiden**: jag mätte OMGIVNINGEN
via `printenv`, inte ÅTKOMSTEN via `npx supabase projects list`; se
`docs/reference/atkomst-och-nycklar.md` `#1203`) → `#1210` (`f7ca7ec0` —
meningarna, efter att ADR-108 FAKTISKT lästs: undantaget gäller tre namngivna
fält, och basens mening fylls med avsikt bara på senaste anmälan) → **`#1214`
ÖPPEN VID PAUS** (armerad `16:25:07Z`): tidslinjen till `Tidslinje.tsx`-formen,
fyra geometrifel (strecken 9 px fel på varannan post, fyra posthöjder →
alla 112, pillarna exakt samma färg som kortytan, registrets 128 px-glapp),
och klickbara anmälningar. **`get-person` deployad TRE ggr till staging; prod
ORÖRD.** **PROCESSFEL ×2: EF deployad före conformance-facit landat** —
`f42da6e7` blev röd i post-merge, andra gången räddades av timing.
**HANDOFF: sessionsdok S103 § PAUSLÄGE (2026-08-12) + Del 8.**
*(Föregående paus-block nedan bevarat.)*

**Session 103 (Del 1–7, historik) —
D-VARIANTEN PÅ PERSONDETALJEN BYGGD, MONTERAD MOT RIKTIGT DATALAGER OCH REDO
ATT GRANSKAS; TRE BAS-DEFEKTER BELAGDA.** AFK-passet (Del 7): Marcus blockordning byggd som
`?variant=d` (`#1143`), tre parallella bygg-agenter stängde datalagret —
`get-person` berikad med Touchpoints/Anmälningar som riktiga poster + `flagga`
(`#1149`), flagg-write + antecknings-ström med författare server-side (`#1151`),
seed-skriptets `--rik` + en skarp kaskad-guard-bugg i `planClean` (`#1155`) —
och monteringen band ihop allt (`#1153`). **Basändringar:** `Personer.Flagga`
(fritext, avlöser den döda `Manuella flagga`-singleSelect) + `Anteckningar.Person`
i BÅDA baserna (`#1146`). **GRANSKNINGSYTAN: `/personer/recxF88ZKUbP9JUs1?variant=d`
— Sofia Isaksson.** **Tre bas-defekter belagda, ingen åtgärdad:** §46:s båda
omätta led är nu mätta (motiverings-flerhet observerad live; `Senaste interaktion
(text)` konkatenerar UTAN avgränsare — **levande i den promoverade personlistan**),
och ny §47 (`Antal hämtningar` räknar `Engagemang`, inte hämtningar). **Dagens
dyraste fångst:** en "snyggare" omdöpning av ett spegelfält bröt en parallell
agents namn-läsning tyst; fångad i rapport-granskningen, inte av någon grind —
återställd, lesson-fragment landat. **CARRY 2 (prod-deployen av de tre
EF-ändringarna) ÄR BETALD AV S102** — morgonsekvensen 2026-08-11
full-paritetsdeployade 33 EF:er till prod (S102 Del 6); `get-person-notes`,
`create-person-note` och `update-record` står i `.prod-functions-allowlist.conf`
(`c6c96a52`) och `update-person-flag` finns i `field-allowlists.ts:119`.
**RESUME-INGÅNG (nästa gång): verifiera `#1214`:s utfall → starta om
dev-servern (aldrig verifiera mot en server som överlevt `biome --write`) →
**Marcus fortsätter granska D** på Sofia Isaksson → tre öppna småbeslut
(registrets tomma rad 2 · år-rubrikernas 157 px · FS i `kursfarg.ts`, som rör
kalendern + gruppdynamiken).** Numrering disk-re-verifierad mot `main`
`4a0ff6d6`: ADR **112** · task **204** · **T142** · **L512** + **4** fragment
— re-derivera ALLTID (S105 aktiv parallellt). **HANDOFF: sessionsdok S103
§ PAUSLÄGE (2026-08-12) + Del 8.**
*(Historik nedan bevarad.)*

**Session 103 (Del 1–6, historik) — PERSONLISTAN
PROMOVERAD, GODKÄND OCH RIVEN; NÄSTA ARBETE ÄR EN D-VARIANT PÅ PERSONDETALJEN.**
Dagens kedja efter resumen: **carry 1
löst** (`BAS_FILTER` kontra cursor-testet — fem PERMANENTA, MÄRKTA
conformance-anmälningar med ENBART Person-länk; Event-lös anmälan räknas i
rollupen, mätt · A1/A2 `undeployed` i staging men `deployed` i prod,
differentialmätt · EF deployad med filtret, `545 passed`) → **meningen byggd i
BÅDA baserna** (`Anmälde sig · RIM 1, Rönninge` → `Anmälde sig till RIM 1 i
Rönninge`; `Deltog på RIM 1 i Falköping`) → **ORTEN AVLIVAD** (Marcus fråga
*"man kan väl inte bo på mer än en plats?"* rev premissen: `Personer.Ort` är en
ROLLUP över anmälningar, 27 prod-personer har 2+ orter, persontabellen har
INGET hemortsfält, formuläret frågar inte — fem person-kontexter rivna, sex
event-ytor orörda) → **k14–k16** (status som egen kolumn med reserverad plats ·
4 px närhet · klockan BYGGD OCH BORTTAGEN på Marcus dom *"avståndet räcker"*).
`ADR-108` mintad (gränsen bas/app — vi avvek MEDVETET från research-passets dom,
skälet står i ADR:n). PR `#1114`/`#1118`/`#1119` MERGED. **Vid resumen (Del 5):**
`#1126` hade INTE landat — main avancerade av S104:s `#1127` och `#1126` stod
`DIRTY` på EN fil (`todo.md`, våra två kadensrader); löst semantiskt (min rad +
S104:s rad från main), merge `d9a9e3d7`, `check:docs` 14 gröna, omköad. Mekanism-tro
FALSIFIERAD: armeringen konsumerades INTE av konflikten (`enabledAt` orörd) —
`#1109`-instansen var en kö-utsparkning, inte DIRTY. **Del 6 — PROMOVERINGEN
GENOMFÖRD HELA VÄGEN:** grind + testid-ankare → sex `ariaSnapshot`-referenser
låsta ur variant-läget FÖRE flippen (ordningen är enkelriktad; efter flippen
existerar inte FÖRE-läget) → flippen → Marcus godkännande via `!`-kanalen
(`ADR-104`, kvitto `sha 4ebdcfc8`) → rivningen. Referenserna ORÖRDA genom BÅDA
operationerna och gröna efteråt (**16 passed**) = beviset att rivningen tog
villkor och växlar, aldrig form. `PersonsListPrototyp.tsx` → `PersonsList.tsx`
(git rename). **Två grindar som ljög lagade på vägen:** `TASK-192` (två DÖDA
facit-markörer, dolda bakom att B3-spärren hoppas över när allt är godkänt +
markörlistan vaktade FEL yta) och `TASK-194` (hooken jämför RESULTAT i stället
för DELTA och låser `kallor`-flytten — mintad, oöppnad). **ÖPPET: (1) D-VARIANT
på persondetaljen, Marcus order — blanda A/B/C, INGET formval på A/B/C görs.
(2) Variant C:s ort (`PersonDetailPrototyp.tsx:945`). (3) Check-in orörd +
närvaro-WRITE-forken. (4) Visual-baslinjen förfallen — Marcus avfyrar
`visual-baselines.yml`. (5) Tio oreproducerbara röda skärmbildstester, n=1,
omätt.** **Vid resumen (2026-08-10):** `#1130` (rivningen) och `#1140`
(pauslandningen) BÅDA `MERGED` — `main` `4b085251`; inget i luften som tillhör
S103. Numrering RE-verifierad mot `4b085251` — oförändrad: **109 / task-195 /
T141 / L512** plus 2 nummerlösa fragment. **HANDOFF: sessionsdok S103
§ Paushistorik (efter Del 6) + Del 1–6.** *(S104:s kadensrad nedan, bevarad.)*

**Session 104 ✅ AVSLUTAD (2026-08-17, `lifecycle: closed`, efter resume 5) —
SEGMENT-PROMOVERINGEN FULLBORDAD OCH PRD task-249 DONE; Marcus
slutkvittens i prod "Ser bra ut" + coverage-kvittens "go". Öppna arv:
task-271 (sändytan skarp — GRILLNING som nästa sessions start) · task-265
(B1 Leads-vyn, Marcus-moment) · task-257/258 · 213.4-varningen. Hub-lyft
deferat. HANDOFF: sessionsdok S104 § Sessionsavslut + Del 10.** *(radens
tidigare mitt-i-natten-form nedan, bevarad som historik.)*
NATT-ORKESTRERINGEN FULLBORDAD: alla åtta 249-skivor MERGADE (PR
1475/1477/1478/1480/1492/1494/1501/1510), EF:erna prod-deployade
38/38 (Marcus egen körning), fronten bundle-bevisad färsk, Marcus QA
körd → fyndspåren 259 (`#1534` LANDAD) · utredningen 260 (`#1522`,
0 leads — 154/247 namnlösa är äkta backfill-klass) · K1 `task-264`
(Opus-bygge pågår) · B1 `task-265` (ready-for-human). KVAR: K1-landning
→ 249.8 + PRD-stängning → skörd → session-end. Full narrativ: sessionsdok
Del 10 + BUILD-LOG S104-posten.** **Vid resume 5 (2026-08-17):** ny gren
`docs/s104-resume-5` i samma worktree; numrering RE-verifierad mot
`origin/main`: **115 / task-249 / T145 FÖRBRUKAD (nästa: T146) / L512 +
18 fragment** — handoffens "T144 högst" och "19 fragment" föråldrade av
mellansessioner, disk vinner (L230).
Del 9: PRD `task-249` + åtta skivor publicerade (`#1468` MERGED
`d9c94669`): våg 1 = 249.1 grinden · 249.2 EF-motorn · 249.4
basdim · 249.7 ordlistan; våg 2 = 249.3; våg 3 = 249.5 flippen; våg 4 =
249.6 rivningen; 249.8 QA `ready-for-human` till Marcus. **HANDOFF:
sessionsdok S104 § PAUSLÄGE (efter Del 9) + Del 8–9.** **Vid resumen
(2026-08-17):** paus-PR:en `#1456` `MERGED` (merge `d61ec793`) — inget i
luften; ny gren `docs/s104-resume-4` i samma worktree. Numrering
RE-verifierad mot `d61ec793`: **115 / task-249 / T145 / L512 + 19
fragment** (247/248 + T143/T144 förbrukade av mellansessioner).
Promoveringens steg 1–3 UTFÖRDA samma natt (Del 8): facit FÖRFATTAT
(`#1458`) + STÄMPLAT av Marcus via `!`-kanalen (`#1460`, sha `a40f3543`,
inga undantag) · ADR-115 mintad (`#1462` — regelspråket: AND-primitiven/
partition-generatorn/täckningen; andra förfiningen av ADR-062 beslut 3) ·
basstrukturen BYGGD staging+prod (Marcus GO "Go staging + prod":
`Kursfamilj`+`Kursnivå` på Eventplanering, backfill 51/51 prod
blank-verifierad + 83 staging [1 medvetet tom]; KÄND KANT:
skapelsevägarna sätter inte fälten — PRD-krav, data-model.md). KVAR: PRD +
skivor ur facit (FEM EF-krav + kanten + rivningslistan). Arbetsform EJ
återsatt (PAUSLÄGE-ordern: promoveringen väljer form efter sin process).
Resume 3-dagen: agent-varven 1–4 (Opus; utbildning globalt · täckningens
100 %-kvittens · publiklistan scanlista+inline-scroll · testmail-raden ·
generatorn tre stegkort · begreppsrenheten "alternativ"/"urval") →
research-passet (segment-byggare, 8 produkter: mallar framför byggare) →
direkthands-varven 5–6 (mallvyn "Nytt segment" i tre steg med tre vägar +
levande mening/antal/namn · verkstaden i samma form, namn sist ·
tidsperioden som DatumFalt-kontroll [server-EF-krav bokfört] ·
textinventeringen: VERBET BÄR FORMEN · träff-ordet
utbildningar/föreläsningar/event). Gren
`fix/task-181-s104-granskningsvarv-utbildning-tackning`, PR i
paus-landningen — verifiera vid resume. Fynd-kort väntar skörden:
PersonsList-höjdlåsbuggen (latent, skarp yta) + lessons-kandidater 1–12 +
ORDLISTA-kandidater. Numrering vid paus: 115+/L512+~18 fragment/T143/
task-247 — re-derivera ALLT vid mint. **HANDOFF: sessionsdok S104
§ PAUSLÄGE (efter Del 7) + Del 7.** *(Radens tidigare Del 4–6-narrativ:
sessionsdok Del 4–6 + Paushistorik 3.)* Dagens kedja (13 commits, pushade som
EN enhet på Marcus "landa allt"; PR skapad+armerad i paus-landningen —
verifiera vid resume): AND-primitiven som konjunkt-grupper i `med` med
klient-snitt per unikt villkor (`14c00f12`, differentialbevisad) →
partition-generatorn "Dela upp i grupper" + de fjorton förskapade med
facit-skalprovsmål 1–188 (`4877cb50`, agent-bygge; partitionen disjunkt-bevisad
live: stagings 2 personer i exakt varsin grupp) → täckningsvyn som listläge
(`131d39b0`, agent-bygge; "2 täckta · ingen utanför" mot staging) →
main-synk (bakom-main-rödingen läkt 7/7) → **fem Marcus-varv i realtid**:
underrubriken verbatim · **människomeningar UR AVSIKTEN på korten** ("Har gått
både RIM 1 och RIM 2 - men ingen av de andra två utbildningarna"; Rogers ord
UTBILDNING, ej kurs) · "0 personer ännu"-fraser + "modaliteten" utrensad ur
UI-text · **LÅST KORTHÖJD (Marcus: GLOBAL APP-REGEL)** via min-h-[2lh], mätt
14×168px · knappraden varv 2 (tre kapslar + Täckning som lågmäld textväxel;
varv 1:s zonering föll för ÖGAT, ej mätningen — lesson-kandidat 8
[UNIVERSAL]). **ÖPPET: kurs→utbildning i övriga UI-ytor (ställd, obesvarad) ·
facit-låsning → segment-ADR:n (109 FÖRBRUKAD av S102 ⇒ nästa lediga 110+) →
basstruktur → PRD med FYRA EF-krav.** Numrering vid paus: 110/L512+2
fragment/T141/f47/task-195 — re-derivera vid mint. Arbetsform `iteration`
rensad för landnings-pushen, ÅTERSÄTTS vid resume. **Vid resumen
(2026-08-16):** paus-PR:en `#1150` `MERGED` (merge `86ddaa33`) — inget i
luften; ny gren `docs/s104-resume-3` från `a92877d9` i samma worktree.
Numrering RE-verifierad mot disk — paus-värdena delvis förbrukade: nästa ADR
**115** (110–114 mintade av mellansessioner) · **T143** · **task-247** ·
**L512** (oförändrad) + 18 nummerlösa fragment; fällnumret ej omräknat.
Arbetsform `iteration` återsatt; dev-servern :5175 omstartad. **HANDOFF:
sessionsdok S104 § Paushistorik 3 (efter Del 6) + Del 4–6.** *(Radens
tidigare Del 2/3-narrativ: sessionsdok Del 2–3 + Paushistorik 1–2.)*
*(S103:s kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 103 ▶️ ÅTERUPPTAGEN (2026-08-10, `lifecycle: active`) — PERSONER-LISTANS
FORM ÄR KLAR MEN EJ GODKÄND; BASEN LEVERERAR NU TEXTEN.** Grillad samsyn:
listan är ett **uppslagsverk** (gruppfrågor bor i Segment) → filterpanelen DOG
med skäl · kortytan **tonal** (zebra riven, belagt av Marcus öga + research-pass
med fem designsystem) · radens jobb är **identifiering** (ort in, senaste
interaktion in, erfarenhetsbadge + "N anmälningar" ut) — varmed
`"Ej påbörjat"`-forken dog utan att behöva avgöras. Raden ärver
`PersonMiniKort`s anatomi i tonal listyta, med **låst höjd** (bevisad mot rader
utan ort). **Airtable LIVE i båda baserna:** fyra formler + åtta nya fält —
`Deltog · RIM 1, Falköping` ersätter `Rönninge – Utbildning – …`; ingen backfill
behövdes (`P30` mintad). Seedfixturen ombyggd: `@example.com` (RFC 2606),
riktiga orter, luckor i **prods** proportioner, och `--clean` följer nu
LÄNKGRAFEN i stället för e-postmönstret. **PR `#1096` MERGED.**
**ÖPPET VID PAUS: (1) `BAS_FILTER` fällde cursor-testet — EF rullad tillbaka i
staging, koden intakt i `42655f3f`; resumens första punkt. (2) Formen är EJ
godkänd av Marcus — promovering väntar. (3) Persondetalj + check-in orörda.**
Numrering vid paus: 108/task-185/L512+2 fragment/T140/f47.
**HANDOFF: sessionsdok S103 § Paushistorik + Del 1–3.** Numrering RE-VERIFIERAD
mot disk vid resume — oförändrad. Paus-landningen ligger i PR `#1109` (armerad,
Acceptance kör). Parallellt aktiv: S102 (kadensrad nedan) — dess parentes
"S103 … pausad efter leverans" beskriver läget före denna resume.
*(Föregående kadensrader nedan, bevarade.)*

<!-- Föregående kadensrad, bevarad: -->
**Session 102 🔄 PÅGÅR (2026-08-10, `lifecycle: active`) — GO-LIVE-DAGEN:
batch-orkestrering.** Läge vid kontrollerad kompaktering ~13:50: batchen
(Marcus-order max-kort 14) 10/14 avfyrade, 8 Done, ⑩ (147.2) bygger,
kvar 147.3/147.10/147.5/147.7. Parallellt: S103 (person-passet, pausad
efter leverans) + S104 (segment-passet). Full narrativ + Marcus-hög:
sessionsdok S102 Del 1–3. Morgonsekvensen (Grind F + T51 via
åtgärdssidan): Del 2. *(S93:s stängda kadensrad nedan, bevarad.)*

**Session 93 ✅ AVSLUTAD (2026-08-02 → 2026-08-10, `lifecycle: closed` på
Marcus coverage-kvittens) — EVENTSIDAN SKARP, PROMOVERINGS-APPARATEN BYGGD,
15-STRECKS-SVEPET FULLBORDAT.** Stängningsdagen: Marcus granskning +
omgodkännande-stämpel via `!` (`sha: e25efd05`; första stämpelns
fel-träd-SHA fångad i kvittots granskning → ref-synk + omstämpling,
mekanism-fix `task-175` mintad + fragment) · `172` **Done** (`#1069`,
stängnings-commit `0249d573`) · BUILD-LOG § Session 93 · slutskördens två
fragment i `tasks/lessons.d/`. Nattens facit står i föregående kadensrad
(kedjan `#1060`–`#1065`, hub `b210ee0`, K93.1–K93.39, plugin 1.33.0).
**NÄSTA (NY session, N+1 = S102):** Marcus-utpekade spår — `147`-skivningen
(sändvägen; grillning, ready-for-human) och go-live-inventeringen inför
Roger/Lotta · plockbara: `task-174` + `task-175` + `146.4`/`158.4` (avblockar
`169`-resten) · T135-utredningen på prio · **Marcus-moment: app-omstart
(plugin 1.29.0 → 1.33.0) + Update-klicket i claude.ai.** Numrering efter S93:
102/108/L512+2 fragment/T140/task-176/f47.
**Full narrativ: sessionsdok S93 Del 1–18 + BUILD-LOG § Session 93.**
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 93 ⏸️ PAUSAD (2026-08-09, elfte pausen, `lifecycle: paused`) —
NATTAUTONOMIN FULLBORDAD; ENDAST STÄMPELN + STÄNGNINGEN KVAR.** Nattens
kedja, samtliga MERGED: `#1060` resume · `#1059` S101-lösningen (Marcus-
order, kedje-söm `c4037897`) · `#1062` CLAUDE.md-hook-rättelsen + biome-
bumpen · `#1063` task-174 · `#1064` **15-strecks-rundan LEVERERAD** (17
förekomster, policy tömd, testytor synkade; Done HÅLLS till stämpeln) ·
`#1065` **skörden L480–L511** (8 fragment + 24 nya, carry-tappet öppet
bokfört; lychee-fällning fixad `aa2b802c`). Hub `b210ee0`:
**K93.1–K93.39** + SYSTEMET.md §0-termerna + /prototype-
promoveringskontraktet, **plugin 1.33.0** (app-omstart krävs, sessionen
kör 1.29.0). Stämpeln AVBÖJD av Code med ADR-104-skäl (kanalseparationen
är agent-nekad väg; bokfört Del 17). **MORGONENS TVÅ HANDGREPP: (1)
stämpel-raden via `!` (exakt rad i PAUSLÄGE § MARCUS-SEKVENS) → (2) GO →
`172` Done + session-end → S93 STÄNGS.** `147`-skivningen + go-live-
inventeringen = NY session (Marcus-beslut). Numrering vid paus (hypotes):
108/L512+0/T140/task-175/f47.
**HANDOFF: sessionsdok S93 § PAUSLÄGE (elfte pausen) + Del 17.**
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 99 ⏸️ PAUSAD (2026-08-09, femte pausen, `lifecycle: paused`)
— BEVAKNINGS-PASS UTAN MOMENT; ALLT KVARVARANDE ÄR FORTSATT MARCUS.**
Paus på Marcus order utan ny scope. Resume 4 landade återupptagningen
(`#1002`/`8474872f`, post-merge 0 avvikande jobb) men inga Marcus-moment
hanns med före paus-ordern — passet bevakade parallell-flottan (S93
resume 8→10 + kedjan `task-162`–`172` + ADR-104 · S100 STÄNGD `#1032` ·
S101 född och pausad). **Öppen observation: S101:s paus-PR `#1059` står
KONFLIKTAD och obevakad** (orörd sedan 15:26Z; bokförd även av S93:s
resume-10-block; rörs ej utan order). `#635` väntar fortsatt Marcus.
**NÄSTA (allt Marcus, oförändrat): QA `160.7` + `161.10` ·
BYGGPLAN-LÄTTLÄST-beslutet · hub-sync-vägvalet (FÖRE session-ends
skörd) · boka `148.5` · triagera `154`–`156` · `#635` ·
lärdomslager-spårbeslutet.** **HANDOFF: sessionsdok S99 § PAUSLÄGE
(femte pausen) + § Paushistorik (fjärde) + Del 11–12.** Numrering
disk-rederiverad vid paus (`b84cc157`): **108**/**L480** + 8
fragment/**T140**/**task-174**/f47 (ej omverifierad) — fyra axlar rörde
sig under ett enda bevaknings-pass.
*(Föregående kadensrad nedan, bevarad.)*

**Session 93 ▶️ ÅTERUPPTAGEN (2026-08-09, `lifecycle: active`, tionde
resumen) — 15-STRECKS-RUNDAN ÄR HUVUDSPÅRET.** Paus-PR:en `#1058`
verifierad MERGED (`393825b0` = main-toppen); Post-merge + CodeQL + CI
gröna på main. Huvudkatalogen är S93:s (ingen främmande ägarlapp;
S101:s paus-PR `#1059` står DIRTY — främmande sessions PR, ägarens
svep bär den, bokförd som fynd) — resume-gren `docs/s93-resume-10`
från `origin/main`. Numrering re-verifierad mot disk: nästa ADR
**108** · **L480** + 8 nummerlösa fragment · **T140** håller;
**task-173 FÖRBRUKAT** av S101 (PRD-Review-grinden + 7 skivor) →
nästa kort **task-174**; f47 ej omprövad. **NÄSTA per MARCUS-SEKVENS
(kvitterad väg): 15-strecks-rundan per `172`-notes femstegsplan →
Marcus omgodkännande-stämpling (`--ersatt`) → `172` Done →
session-end-blocket (lessons-skörd 17+ kandidater · hub-sync-paketet ·
CLAUDE.md-rättelsen · ritual) → S93 STÄNGS.** `171.6` väntar `147` ·
`169`-resten väntar `146.4`/`158.4` (Marcus prio).
**HANDOFF: sessionsdok S93 § Paushistorik (tionde) + Del 15–16.**
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 101 ⏸️ PAUSAD (2026-08-09, efter Del 8; PAUSLÄGE amenderat
samma dag på Marcus order) — L8-TRANSFORMATIONENS ETABLERING KOMPLETT.**
Kartläggningen av Kun Chens system (tre transkript djuplästa +
webverifierade) → gap-analys + plan (8 kandidater, 5 vågor) +
ledstjärnan, allt i
`docs/research/l8-workflow-kartlaggningen-2026-08-09.md` · K1-grillningen
→ **ADR-105** (review-grinden) → **PRD TASK-173 + skivorna 173.1–173.7**
(spec-kompletta, 1–6 ready-for-agent) · ställningstagande-grillningarna →
**ADR-106** (agnostik-snittet) + **ADR-107** (reproducerbarhets-målet) ·
ADR-104-katalogdriftfixen · åtta PR:er (`#1045`–`#1056`) gröna per jobb.
**NÄSTA (vid resume, MARCUS OMPRIORITERING 2026-08-09): HUVUDSPÅRET är
K4-verifikaten → K4-grillningen (exekverings-hubben — Marcus
kärnentusiasm) med K3 (Lavish) framdragen parallellt (minimal-test vid
nästa verkliga plan-tillfälle) · `173.1`-kedjan körs som
AFK-bakgrunds-batch via `work-batch` · mottot styr takten: *"bygg
ordentligt eller bygg inte alls"*.**
**HANDOFF: sessionsdok S101 § PAUSLÄGE + Del 1–8.**
*(S93:s paus-kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 93 ⏸️ PAUSAD (2026-08-09, tionde pausen, `lifecycle: paused`) —
PRD-171 FULLBORDAT PÅ EN DAG; 15-STRECKS-BESLUTET ÄR NÄSTA RESUMES
HUVUDSPÅR.** Dagens facit: åtgärds-/granskningssidan SKARP (godkänd
`cfc62f9f` · riven `54e3ff36` · regressionslåst med noll drift) · `168`
Done · `169` levererad (21→5) · `172` levererad+mergad (`#1055`, tre
varv) men ÖPPEN på Marcus-beslutet *"ALLA 15 långa bindestreck i
användarsynlig text MÅSTE bort"* (femstegsplan i kortets notes; avgör
även datumspann-frågan). **NÄSTA RESUME: 15-strecks-rundan → Marcus
omgodkännande-stämpling (`--ersatt`) → `172` Done → session-end-blocket
(lessons-skörd 17+ kandidater · hub-sync-paketet · CLAUDE.md-rättelsen)
→ S93 STÄNGS** (Marcus-kvitterad bedömning: hinner). `171.6` väntar
`147` · `169`-resten väntar `146.4`/`158.4` (Marcus prio). Numrering vid
paus (hypotes — S101 aktiv och snabb): 108/L480+8/T140/task-173/f47.
**HANDOFF: sessionsdok S93 § PAUSLÄGE (tionde pausen) + Del 15–16.**
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 93 ▶️ AKTIV (2026-08-09, Del 16-landningen) — PRD-171 DONE PÅ
EN DAG: ÅTGÄRDS-/GRANSKNINGSSIDAN ÄR SKARP.** Hela promoverings-kedjan
exekverad med förgrundsverifikat per led: `171.1` referenserna (`#1037`,
divergens-fynd: ingen variant-gren) → `171.2` noll-diff-flippen +
markörerna (`#1039`) → `171.3` härdningen (`#1041`, äkta a11y-fynd fixat
utan aria-träd-ändring) → `171.4` Marcus `!`-stämpling (`#1044`) →
`171.5` rivningen (`#1046`, PrototypRigg kvar DEV-grindad som
testinfra) → baslinje-run `31311560867` NOLL drift → `171.7`
QA-vandringen kvitterad *"Ser bra ut"*. Parallellt: `168` Done
(hook-tuningen, 27→37 testfall, fem falsk-positiva klasser släppta) ·
`169` levererad (grinden 21→5; resten väntar `146.4`/`158.4`) · S101
född parallellt utan friktion. **NÄSTA: `172` bindestrecks-svepet
(avblockat, agent spawnas) · `171.6` hopkopplingen villkorad mot `147` ·
`169`-resten + `146.4`/`158.4` är Marcus-prioritering · hub-sync-paketet
vid hub-moment.** **HANDOFF: sessionsdok S93 Del 15–16.**
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 93 ▶️ AKTIV (2026-08-09, Del 15-landningen) — FACIT LÅST,
SKIVORNA UTE.** Dagens kedja efter resume: S100 STÄNGD (`#1032`) ·
`task-169`-agent i arbete · `task-170`/`171`/`172` mintade
(`#1032`/`#1033`) · skarv kvitterad + bindestreck scope A · **Marcus
FACIT-LÅSTE åtgärds-/granskningssidan i klartext** (verbatim i sessionsdok
Del 15 + `task-171`-notes; v1-låsning inkl. S100:s odömda formval) ·
skivorna `171.1`–`171.7` publicerade i beroendeordning. Processfynd:
hook-falsk-positiv klass 4 → `task-168`-notes. **NÄSTA: spawna `171.1`
(referenserna) när skiv-PR:en landat · kedjan `171.2`→`171.3`→`171.4`
(Marcus QA + `!`-stämpling)→`171.5`→`171.7` (QA-vandringen) · `171.6`
villkorad mot `147` · `172` körs EFTER `171.5` (sekvens-villkoret) ·
`169`-stängning efter grön grind/dispatch.**
**HANDOFF: sessionsdok S93 Del 15.**
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 100 ✅ STÄNGD (2026-08-09, via S93-övertagandet — ingen femte
resume; `lifecycle: closed`).** Bo-triagen utförd och bokförd i
sessionsdok S100 § Del 7: bindestrecks-frågan (A/B/C + följdfrågor +
tom-markören `—`) LYFT TILL MARCUS · de odömda formvalen +
`TASK-147` rad 142 + staging-write-härdningen → input till
promoverings-PRD:n · heartbeat-undantagen → **task-170** (mintad,
familj `T128`/`T132`) · 4173-quirksen (CORS + service-worker-hypotesen)
EXPLICIT förkastade (preview-miljö) · lesson-kandidaterna 1–5 kvarstår
dok-bokförda till S93:s skörd. Grund-fakta disk-verifierade:
`docs/s100-paus-3` helt inmergad (0 commits före main), prototypen i
main som `[PROTOTYPE]` (varv 22–23 `34020353`/`5879faf6`), facit OLÅST.
Worktree `s100-atgardssidan` + lokal gren städade.
*(S93:s aktiva kadensrad nedan, oförändrad.)*

**Session 93 ▶️ ÅTERUPPTAGEN (2026-08-09, `lifecycle: active`, nionde
resumen) — S100-ÖVERTAGANDET ÄR HUVUDSPÅRET.** Paus-PR:en `#1030`
verifierad MERGED (`31b2547b`); Post-merge + CI + Push on main gröna per
jobb. Huvudkatalogen är S93:s (S99/S100 `paused`, ingen främmande
ägarlapp) — arbetet fortsätter där, resume-gren `docs/s93-resume-9` från
`origin/main`. Numrering re-verifierad mot disk: nästa ADR **105** ·
**L480** + 8 nummerlösa fragment · **T140** · **task-170** håller; f47 ej
omprövad (re-derivera i mint-ögonblicket). Nattens enda röda ägs av
`task-169` (Backlog-stängnings-grinden, 21 äldre Done-kort). **NÄSTA per
MARCUS-SEKVENS (kvitterad väg): S100:s bo-triage + bindestrecks-frågan
(A/B/C — Marcus) · PRD för åtgärds-/granskningssidans promovering ·
Marcus facit-låser ytan · kön referenser → promovering → härdning → QA →
`!`-stämpling → rivning · parallellt `task-169` (avblockar nattgrinden) ·
`task-168` vid tillfälle · CLAUDE.md-rättelsen + hub-sync-paketet vid
hub-moment.**
**HANDOFF: sessionsdok S93 § Paushistorik (nionde) + Del 13–14.**
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 99 ▶️ ÅTERUPPTAGEN (2026-08-08, `lifecycle: active`, fjärde
resumen) — MARCUS-MOMENTEN ÄR ALLT SOM ÅTERSTÅR** — Marcus resume-order
utan ny scope; agent-pipelinen är TOM och arbetet fortsätter per
MARCUS-SEKVENSEN: QA `160.7` + `161.10` (PRD 160/161 stängs efter dem) ·
BYGGPLAN-LÄTTLÄST-beslutet (frys eller Gunilla-uppdatering) ·
hub-sync-vägvalet (MÅSTE föregå session-ends skörd) · boka `148.5` ·
triagera `154`–`156` · Dependabot `#635` · lärdomslager-spårbeslutet.
Paus-PR:en `#995` verifierad mergad (`8c98f942`) grön per jobb. Egen
worktree `s99-resume-4` per ADR-090 beslut 2 (främmande LEVANDE ägarlapp:
S93 äger huvudkatalogen på gren `docs/fynd-kort-staende-roda` och mintar
fynd-kort otrackat — task-163/164/165 sågs under resumens läsning, och
huvudkatalogens arbetsyta MUTERADE mellan två läsningar). Numrering
re-verifierad mot `2404b421`: **104**/**L480** + 8 fragment/**T139**/
**f47** håller; task-axeln DIVERGERAR från handoffens 163 — committad max
är 162 men S93:s otrackade mints gör nästa lediga ≥166; re-derivera i
mint-ögonblicket och räkna med osynliga systerträds-kort (CLI-hålet,
CLAUDE.md § Kortnummer).
**HANDOFF: sessionsdok S99 § Paushistorik (fjärde) + Del 11–12.**
*(Föregående paus-läge nedan oförändrat.)*

**Session 99 ⏸️ PAUSAD (2026-08-08, fjärde pausen, `lifecycle: paused`) —
AGENT-SIDAN AV UPPDRAG 9 KOMPLETT; ALLT KVARVARANDE ÄR MARCUS-MOMENT.**
Nio av nio agent-skivor i `task-161` Done-flippade efter per-jobb-verifikat
(kedjan `#961`→`#989`; Del 11–12 bär narrativet). Dagens extraleveranser:
nanoid-blockeraren röjd (parallell session vann, vår dubblett städad) ·
Explore-kartan ÅTERFUNNEN ur worktree-sessionens egen transkript-katalog och
landad frusen (`docs/research/styrande-docs-audit-substrat-2026-08-07.md`,
`#976`) på Marcus artefakt-order · skarpbevis 2 av 4 betalda (160.2
manual-neka skarpt via Marcus `/compact` · 160.5 steg 1; resten fyrar
naturligt) · register-auditen svarad (alla fem axlar intakta; **uppdrag 10
registrerat EJ prioriterat**, trigger: ökad parallellitet) · tvillingen kapad
(psionautics `d2415cc`) · BYGGPLAN-LÄTTLÄST fick STOP-utfall (redaktionellt
Marcus-beslut). **NÄSTA (allt Marcus): QA `160.7` + `161.10` ·
BYGGPLAN-LÄTTLÄST-beslutet · hub-sync-vägvalet (FÖRE session-ends skörd) ·
boka `148.5` · triagera `154`–`156` · `#635` · lärdomslager-spårbeslutet.**
**HANDOFF: sessionsdok S99 § PAUSLÄGE (fjärde pausen) + Del 11–12.**
Numrering disk-rederiverad vid paus (`b5703ba6`): **104**/**L480** + 8
fragment/**T139**/**task-163**/**f47** — tre axlar togs av S93 i dag,
re-derivera alltid i mint-ögonblicket.
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 100 ⏸️ PAUSAD (2026-08-08, FJÄRDE pausen, `lifecycle: paused`) —
GRANSKNINGS-YTAN BYGGD I FEM VARV, MED ETT RESEARCH-PASS SOM AVGJORDE FORMEN.**
Marcus fråga vid start ändrade utgångsläget: appen HADE redan en granskningsyta
(`SegmentMailCompose` rad 207–304), men grinden där är **mottagarantalet**, inte
ordet "skicka" — och han kallade den *"baslinje, aldrig genomdesignad"*, alltså
mekanik att låna men inte facit att kopiera. **Formen blev EGEN SIDA, inte
modal** (Marcus-val), och research-passet
[`post-send-tillstandet-bulkutskick-2026-08-08.md`](../docs/research/post-send-tillstandet-bulkutskick-2026-08-08.md)
avgjorde vad som händer efter skick: **resultatet ersätter granskningens
innehåll på SAMMA yta** — tre konvergerande linjer (GOV.UK:s kriterium pågående
resa → notifikation på plats · `ADR-067` D3: ingen leverans-data att visa på en
separat sida · storleksklassen mot Intercoms 1 000-tröskel). **VARV 19–23, sju
lokala commits, INGET pushat** (`T126` efterlevd): gransknings-vyn som egen sida
med urvalsfiltret som **biter** och platshållarna **ifyllda** (ofyllda lämnas i
klartext och varnas om — ett mail med `{deadline}` i texten är vad granskningen
finns för att stoppa) · tre rader bort på Marcus order · **utfallet i tre lägen**
där `MessageBox` säger HUR MÅNGA och korten VILKA OCH VARFÖR · scroll till
toppen, bock på "Skickat", `Obekräftad`-pillen bort · **"Utskicket lyckades"**
ersätter "skickades" (ett utskick KAN skickas utan att lyckas — stämplingslögnens
kärna). **TVÅ FEL VAR MINA:** `#930` klassades som vilande armerings-kandidat
fast den var CLEAN-köad (`autoMergeRequest` sätts aldrig då — `TASK-128`:s egen
förväxling, gjord för hand) · research-passet prövade uppdragets premiss mot
**fel träd** (huvudkatalogen såg inte sessionens opushade varv) och kallade det
verifierat; rättat i filen före commit. **ORDLISTA fick posten `Delutfall`**
(`9a6a66a8`) — Marcus fråga *"vad betyder delutfallet?"* visade att ett bärande
krav i två styrande dokument saknade kanonisk betydelse. **BLOCKERANDE VID
RESUME: bindestreckens scope** — Marcus vill ha korta bindestreck "överallt";
ytan är åtgärdad men A/B/C-frågan (UI-strängar · plus kodkommentarer · hela
repot, 1 382 spårade filer varav flera ägda av S93/S99) är obesvarad och kräver
ett beslut, inte ett bygge. **HANDOFF: sessionsdok S100 § PAUSLÄGE (fjärde
pausen).** Numrering disk-verifierad mot `origin/main`: `103`/**`L480`** + åtta
fragment/**`T138`**/`task-162`/`f47` — tre axlar rörde sig under passet, grenen
låg **64 commits bakom** `main` vid pausen. **`T137` RÄTTAD TILL `T138` VID
MERGEN:** min första mätning räknade FILER i `tasks/threads/` och missade att
`T137` är registrerad i INDEXET av S99 (uppdrag 9-grillningen, CI-hub-visionen)
utan egen kortfil. S99:s samtidiga rad hade rätt siffra hela tiden — en
tråd-mätning måste läsa registret, inte katalogen.
*(S99:s aktiva kadensrad nedan, oförändrad.)*

**Session 99 ▶️ ÅTERUPPTAGEN (2026-08-08, `lifecycle: active`, resume 3) —
UPPDRAG 9-EXEKVERINGEN STARTAR; NUMRERINGEN HÖLL PÅ FYRA AV FEM AXLAR.**
Resume-läsningen disk-verifierade handoffen: paus-PR:n `#955` MERGED
`19:34:02Z` utan röda jobb · alla elva 161-kort orörda `To Do` · ADR **103** /
**L480** / **T138** / **task-162** / **f47** stämmer — men lessons-fragmenten
är **8**, inte handoffens 6 (två nya under pausen; lessons-skörden räknar om
vid session-end). Ägarlappen FRÄMMANDE och har BYTT session-ID på samma PID
under pausen (`5a232dcd`/47876); S93 + S100 båda `lifecycle: active` → egen
worktree `s99-resume-3` per ADR-090 beslut 2. **NÄSTA: tre
skarpbevis-skulder (deny-precompact · post-compact-igenkänning ·
tröskel-verifikatet; varna Marcus före prompt-genererande verifikat) → våg 1
`161.1`+`161.2`+`161.9` → beroendekedjan → `161.10` QA.** Marcus-moment
enligt S99-paus-raden nedan.
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 100 ▶️ ÅTERUPPTAGEN (2026-08-07, `lifecycle: active`, resume 3) —
DE TRETTON VARVEN HAR REDAN LANDAT, OCH HANDOFFEN VISSTE INTE OM DET.**
Resume-läsningen fann **tre divergenser**. (1) PAUSLÄGE:s *"TRETTON VARV
OCOMMITTADE MOT ORIGIN … alla lokala"* var föråldrat i samma andetag det
skrevs: `#930` mergade **`17:15:31Z`** (merge-commit `532ec944`) och bar hela
kedjan `e7b5ebd8` → `d40b38d5` in i `main` — handoffens NÄSTA-punkt 3 ("bestäm
med Marcus om varven landar") är alltså passerad, inte öppen. (2) `task-160` är
taget av S99 → **nästa kort `task-161`**; övriga axlar oförändrade
(`101`/`L480` + sex fragment/`T137`/`f47`). (3) Ägarlappen har **bytt ägare**
under pausen — PID `47876` (session `c91a05a2`), levande; PAUSLÄGE noterade
`90883`. Denna session fortsätter i sin egen worktree per ADR-090 beslut 2.
**ETT FELSTEG VAR MITT:** jag läste `#930` som `auto=false` + ej draft och
klassade den som vilande armerings-kandidat, och körde `gh pr ready 930
--undo`. Den var i själva verket **CLEAN vid armeringen och köad direkt** —
`autoMergeRequest` sätts aldrig i det läget (CLAUDE.md § tabellrad 2). Jag
gjorde för hand exakt den förväxling `TASK-128` mekaniserade bort; kommandot
föll ofarligt (`EXIT=1`, *"is closed"*) eftersom PR:n redan mergat.
**NÄSTA: GRANSKNINGS-YTAN** — och kod-läsningen inför den gav ett fynd som
ändrar utgångsläget: **appen HAR redan en granskningsyta**, i
`SegmentMailCompose.tsx` (rad 207–304) — bekräftelse-modal med
skriv-för-att-bekräfta, förhandsvisning och oåterkallelighets-varning. Grinden
är **mottagarantalet**, inte ordet "skicka". Åtgärds-sidans `Granska och
skicka`-knapp (`AtgardsSida.tsx` rad 1503–1507) saknar `onPress` — knappen
finns, ytan bakom den inte.
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 100 ⏸️ PAUSAD (2026-08-07, TREDJE pausen, `lifecycle: paused`) —
TRETTON VARV PÅ ÅTGÄRDS-SIDAN, EN RIVEN MONTERING OCH EN FÄRG SOM LANDADE I
FYRA HUGG.** Resumen fann först att **paus-PR:n `#905` stod RÖD, inte
väntande** — grenen armerades fyra minuter före `#900` mergade och länkade till
filer som bara fanns där; `BLOCKED` i `gh pr view` skiljer inte "väntar på CI"
från "CI har fällt". Lagad med merge, landade `14:32:07Z`. **VARV 6–18, alla
lokala commits, INGET pushat** (iterations-kadensen `T126` efterlevd med avsikt
denna gång): åtgärdslistan sex → **fyra** utskick med Marcus namn verbatim och
manuell anmälan flyttad upp till mottagar-ytan · previewns namn i **pillar**
(gräns 5 → **7**) · **morf-pariteten ärvd ur `DetaljGrupp`** — Marcus *"jag
avskyr sådana layoutförändringar"* var DOM-mätt **54 px**, nu **0** · bilage-raden
avskalad till kryss·namn·storlek · Granska-knappen mörkgrå solid ·
**betalningarnas EGNA skrivyta** · kryssrutan en form och en riktig token.
**TRE FEL VAR MINA:** `leder: true` navigerade aldrig (chevron lovade en väg som
inte fanns) · **varv 12 monterade en yta som strukturellt inte kan skriva** —
`TASK-145.4` (`c4160cae`, landad 17:23 samma dag) hade gjort
`BetalningsDetaljer` till ren läsyta med *"DoD #7: noll skriv-affordanser"*, och
jag byggde **30 commits bakom `main`** utan att märka det · **den blå
checkboxen var en trasig token** (`--mm-color-primary` finns inte → `accent-color`
föll till webbläsarens default, alltså användarens egen systemaccent — en färg
Lotta kunde ha sett annorlunda). **KRYSSRUTANS FÄRG TOG FYRA HUGG** (blå → guld
→ steg 9 → steg 10 med vit bock); två insikter bär vidare: **kanten kan bära
golvet när plattan inte kan** (markeringskorten kör redan 1,05:1 med kanten som
bärare), och **bocken mäts mot plattan oberoende av kanten** — därför hjälpte
samma trick inte i sista hugget. Slutlig form `--p-gold-10` platta ·
`--p-gold-11` kant · vit bock · 16×16 = **3,06 · 4,91 · 3,06**, alla över WCAG
1.4.11. **`T136` REGISTRERAD** (kryssrutans app-svep) — mintades som `T134`,
kolliderade vid landning eftersom en parallell session hunnit ta både 134 och
135, och flyttades vid merge. **NÄSTA: GRANSKNINGS-SIDAN/YTAN** (Marcus vid
pausen). **HANDOFF: sessionsdok S100 § PAUSLÄGE (tredje pausen).** Numrering
disk-verifierad efter merge: `101`/**`L480`** + sex fragment/`T137`/`task-160`/`f47`
— tre axlar rörde sig under passet, re-verifiera i mint-ögonblicket OCH vid
landning. Heartbeat-monitorn startades aldrig (bokfört val: tre parallella
sessioner ger främmande larm); en riktad vakt på `#905` kördes i stället.
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 99 ⏸️ PAUSAD (2026-08-07, tredje pausen, `lifecycle: paused`) —
UPPDRAG 1–8 KOMPLETTA; UPPDRAG 9 GRILLAT + SPECCAT, EXEKVERINGEN ÄR
RESUMENS JOBB.** Compact-formen LIVE (ADR-101: grind 20/20 · hub-skill
**plugin 1.31.0** · post-compact-igenkänning · tröskel
`CLAUDE_CODE_AUTO_COMPACT_WINDOW=500000` — skill + tröskel biter från
nästa session; QA `160.7` kvar). Uppdrag 9: rotorsaks-paketet kvitterat
(elimination default · review-bumpens mini-audit · ägar-deklarationer) —
**PRD `task-161` + skivorna `161.1`–`161.10` mintade, INGEN spawnad**
(Marcus paus-beslut: exekveringen i resumen). Lärdomslager-researchen
landad (fångst = branschpraxis, formen = NASA-pre-fix-analog, ADR-085 är
husets formfacit → skiva 161.9); **tråd `T137`** (central
CI/grind-visionen, research-krav). Paus-formen valdes per ADR-101:s egen
nisch-regel: tom pipeline + naturlig landningspunkt ⇒ paus, inte
compact. **NÄSTA: resume → betala TRE skarpbevis-skulder
(deny-precompact · post-compact-igenkanning · tröskel-verifikatet) →
spawna våg 1 (161.1 + 161.2 + 161.9) → beroendekedjan → QA.**
**Marcus-moment: QA `160.7` + `161.10` · boka `148.5` · triagera
`154`–`156` · Dependabot `#635` · lärdomslager-spårbeslutet.**
**HANDOFF: sessionsdok S99 § PAUSLÄGE (tredje pausen) + Del 9–10.**
Numrering vid paus: ADR-103/L480 + 6 fragment/T138/task-162/f47 —
re-verifiera mot disk, tre sessioner rörde räknarna i dag.
*(S100:s äldre kadensrad nedan, bevarad.)*

**Session 100 ▶️ ÅTERUPPTAGEN (2026-08-07, `lifecycle: active`, resume 2) —
`#900` LANDAD, PAUS-PR:N `#905` VAR RÖD OCH ÄR LAGAD.** Resume-läsningen fann
**tre divergenser mot handoffen**, alla mot `origin/main` `09de3e50`. (1) Steg 1
i handoffens NÄSTA är **klart**: `#900` MERGED `14:14:07Z` (merge-commit
`68addb6b`) — research-filen, varv 5 och Dokument-ytan ligger i `main`. (2)
**Paus-PR:n `#905` stod RÖD, ej BLOCKED-på-väntan:** `Docs link check` FAILURE
→ `CI Passed or Skipped` FAILURE, tre brutna länkar. Rotorsaken är sekvens, inte
innehåll — grenen `docs/s100-paus-2` armerades `14:09:48Z`, alltså **fyra
minuter före `#900` mergade**, och länkade till
`docs/research/mottagar-preview-monster-2026-08-07.md` +
`tasks/sessions/bilagor/s100-dokumentytan/` som bara fanns i `#900`s gren.
Lagad med merge av `origin/main` i denna landning; båda målen verifierade på
disk efteråt. **Klassen är värd att minnas: en paus-landning som länkar till en
ännu icke-landad systergren är strukturellt röd, och `BLOCKED` i
`gh pr view` skiljer inte "väntar på CI" från "CI har fällt".** (3)
**Numreringen rörde sig på tre axlar under pausen** — `ADR-099` finns (nästa
**`100`**, ej `098`), fragmenten är **sex** (ej fem; nytt:
`uppdragets-kallmarkning-maste-avse-gallande-text`), och `task-159` är mintad
(nästa **`task-160`**, ej `task-158`). Håller: **`L480`** · **`T133`** ·
**`f47`**. **Parallellitet:** `S99` + `S93` båda `lifecycle: active`,
ägarlappen i den delade git-katalogen satt `12:15:55Z` av en **levande** ägare
(PID 90883, starttid verifierad) — denna session arbetar därför vidare i egen
worktree per `ADR-090` beslut 2, som under hela passet. **NÄSTA: dev-servern på
4173 → Marcus granskar varv 5 av åtgärds-sidan i browsern → fler iterationer
efter hans omstyrning, ett varv per omstyrning med egen landning.**
Dokument-ytan rörs INTE (parkerad på Marcus order).
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 100 ⏸️ PAUSAD IGEN (2026-08-07, andra pausen, `lifecycle: paused`) —
FEM VARV PÅ ÅTGÄRDS-SIDAN, ETT RESEARCH-PASS OCH DOKUMENT-YTAN.** Passet gick i
snabb iteration med Marcus granskning i browsern mellan varje varv; **varje
omstyrning träffade UTFÖRANDET, aldrig strukturen B′** som stått orörd sedan
Del 2. Varv 3 (`#888`): fyra formkrav, allt kopierat ur befintliga ytor.
**Varv 4 (`#892`) revs av frågan som styr hela ytan — *"Hur kom Lotta hit?"***
Hon markerade personkort på eventdetaljen, alltså måste hon möta **exakt samma
kort igen, gröna** (`Deltagare` § `MarkerbartKort`); gruppdynamikens kompakta
kort är en SÖKTRÄFF och hör bara i plockaren. Varv 4b–4c (`#894`): listan
INFÄLLD från början så åtgärderna syns utan scroll (sista raden 811 px mot
tab-barens 856), räknaren i 20 px/600 + grön `CircleCheck`. **Marcus dom på
previewn:** *"Jävlar vilken ful preview … oanvändbar och måste göras om"* →
**RESEARCH-PASS** (bakgrundsagent, Sonnet 5) →
[`docs/research/mottagar-preview-monster-2026-08-07.md`](../docs/research/mottagar-preview-monster-2026-08-07.md):
tre oberoende förstapartskällor konvergerar på **gräns 5** (MUI `max = 5` i
källkod · Fluent UI `maxDisplayablePersonas: 5` · Microsoft "default and
recommended"), spridningen ärligt redovisad (Gestalt 3 · Primer 4 med
mönsterbyte · Ant Design inget default); **chips avvisade** (Salesforce bygger
hela tangentbordsmodellen kring borttagning) och **avatarstapel avvisad** (inga
foton i `Registration`/`Person`). Varv 5 (`#900`) bygger previewn mot fynden +
tillägger `aria-atomic="true"` som passet fann saknat. **DOKUMENT-YTAN (`T131`,
scope-punkt 2) BYGGD** — `/mer/dokument`, tre grupper en per dokumentklass, med
den avvisade formen och dess villkor bokförda i koden; **PARKERAD på Marcus
order** (*"Vi avvaktar med den lite"*). Metod-skifte: *"Skit i strukturskisser.
Bygg direkt efter instruktion bara."* **TVÅ MILJÖ-FYND:** `node_modules` var
TOMT i worktreen och gav en falskt grön typecheck (grön grind mot tomma
beroenden ≠ godkännande) · stagings CORS avvisade `4173` mitt i ett pass trots
att porten står tillåten — **ej utredd**. **NÄSTA: verifiera att `#900` landat →
starta dev-servern på 4173 → fler iterationer på åtgärds-sidan efter Marcus
granskning.** **HANDOFF: sessionsdok S100 § PAUSLÄGE (andra pausen).** Numrering
disk-verifierad: `098`/**`L480`** + fem fragment/`T133`/`task-158`/`f47` —
re-verifiera i mint-ögonblicket. Heartbeat-monitorn startades ALDRIG under
resumen (öppet bokfört val: främmande sessioners larm var Del 2:s rotorsak).
*(Föregående kadensrad nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 100 ▶️ ÅTERUPPTAGEN (2026-08-07, `lifecycle: active`, resume 1) —
OMBYGGNADEN AV ÅTGÄRDS-SIDAN, MOT FYRA MARCUS-KRAV.** Marcus kvitterade
tillståndsflippen och gav fyra formkrav direkt in i ombyggnaden: (1) rubrik +
avgränsande linje kopieras EXAKT ur `ManuellAnmalanForm` § `Sidhuvud`
(`border-border border-b px-4 pb-5`, `h1 font-semibold text-3xl`, rund
chevron-tillbaka `size-11 rounded-full bg-bg-muted`) — *"det är ju likadant på
de flesta sidor och så borde du byggt direkt"*; (2) översta blockets IDÉ tas ur
samma sidas Eventet-block (`divide-y divide-border rounded-2xl bg-bg-muted
px-4` med väljaren överst); (3) **deltagarna listas som PERSONKORT, aldrig
rader** — *"big NO NO, Lotta måste känna igen sig"*; korten ska se **exakt**
likadana ut som på eventdetaljerna (`Gruppdynamik` § `PersonKort`) och
anmälans-detaljsidan (`PersonMiniKort`), så att en deltagare som dras från
eventdetaljen in i Åtgärder ser identisk ut; (4) sök-för-att-addera behålls —
men träffarna listas på kort, inte i en radlista. **Numrering re-verifierad mot
`origin/main` vid resumen — TVÅ divergenser mot handoffen:** fragmenten är
**fem** (nytt: `skivning-provas-mot-kodens-kopplingar-inte-mot-funktionsytan`)
och nästa tråd är **`T133`**, inte `T132` (S93 förbrukade både `T131` och
`T132`) — S99:s resume-rad landade samma slutsats oberoende. Övriga axlar
håller: `ADR-098`/**`L480`**/`task-158`/`f47`. **Paus-PR:n `#882` stod DIRTY
vid resumen — verklig konflikt** (S99 skrev sin kadensrad i `todo.md`), löst
med merge av `origin/main` i denna landning; `mergeStateStatus` var alltså sant
den här gången, till skillnad från `#873`-mätningen.
**NÄSTA: (1) åtgärds-sidans yta byggd om mot de fyra kraven · (2)
Dokument-ytans prototyp (`T131`) · (3) facit → `TASK-147` → `/to-issues`.**
*(Paus-kadensraden nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 100 ⏸️ PAUSAD (2026-08-07, första pausen, `lifecycle: paused`) —
ÅTGÄRDS-SIDANS FÖRSTA VARV UNDERLEVERERADE, OCH DET ÄR BOKFÖRT SOM SÅDANT.**
Sessionen startade som den TREDJE parallella (S99 äger huvudkatalogen, S93 kör
byggagenter) och tog egen worktree per `ADR-090` beslut 2. **Marcus rev
grillad samsyn `S93` beslut 8 öppet:** divergens-passets tre varianter
ersattes av tre **strukturskisser i text** → Marcus valde **B** → EN byggd
variant. Rivningen är bokförd i artefakt, inte bara i chatt
(`ATGARDSSIDAN-UNDERLAG.md` § 9, `baaf551b`), tillsammans med två krav som
tillkom under passet — **mottagar-urvalet är REDIGERBART på sidan** (dra in
och ut utan att lämna den) och **sidan står på egna ben med eventväljare**
(TVÅ TILLSTÅND-formen ur `task-18.18`) — plus stängningen av
mottagen-datum-frågan i § 8, som stått öppen i fyra dagar efter att Marcus
väg C togs. **SID-INVENTERINGEN:** 26 sidor, fem med låst facit; djupstuderade
eventdetaljen + anmälningsdetaljen. Två fynd bär vidare: `SegmentMailCompose`
löser mottagarna SERVER-side (*"aldrig en klient-byggd lista"*) medan
åtgärds-sidan bär ett KLIENT-buret urval — kontraktsskillnad mot `ADR-067`
som hör i sändvägs-skivan; och **dokumentklass C** (person-genererad) gör
bilageväljaren till något annat än en filväljare — en klass C-bilaga är SEX
filer till sex mottagare, vilket ger den bilage-bärande sändvägen ett ANDRA,
oberoende skäl utöver den tysta batch-bristen. **MARCUS DOM (verbatim):**
*"En ordentlig underleverans Claude! Den här sidan ser ut att vara ihopkastad
i panik."* Domen är riktig: ytan är en funktionell skiss utan statusbadges,
deadline-signal eller visuell hierarki — grammatiken lästes men omsattes
inte — och **Dokument-ytan (`T131`, scope-punkt 2) byggdes inte alls**.
Rotorsaken bokförd: orkestreraren brände Marcus granskningsfönster på att
kvittera heartbeat-larm om ANDRA sessioners PR:er i stället för att bygga
nästa oberoende scope-post. **MÄTT UNDER PASSET:** stagings CORS-allowlist
tillåter EXAKT `5173`/`4173` (egen port ⇒ 403 preflight) · `mergeStateStatus=
DIRTY` är en HYPOTES (`#873` stod DIRTY men `git merge-tree` gav rent träd och
fältet rättade sig själv) · service worker på `4173` är den sannolika men
**OBEKRÄFTADE** orsaken till att Marcus såg gamla login-sidan (tre mätningar —
4173/5173/prod — visade alla den NYA). **NÄSTA: (1) gör om åtgärds-sidans yta
mot facit-bilderna, samma struktur, riktigt utförande · (2) bygg Dokument-ytans
prototyp · (3) därefter facit → `TASK-147` → `/to-issues`.**
**HANDOFF: sessionsdok S100 § PAUSLÄGE.** Numrering disk-verifierad mot
`origin/main`: `098`/**`L480`** + fyra fragment/`T132`/`task-158`/`f47` —
kortnumren rörde sig 149 → 158 under passet, re-verifiera i mint-ögonblicket.
Heartbeat-monitorn **stoppad med avsikt** — starta den vid resume.
*(S99:s kadensrad nedan, oförändrad.)*

**Session 99 ▶️ ÅTERUPPTAGEN (2026-08-07, `lifecycle: active`, resume 1)**
— paus-antagandet höll: `#876` (149.3) mergad `a95d271c` + paus-PR:n
`#881` mergad `6bfdb751`, båda per-jobb-gröna (Acceptance 8m8s körd;
staging/a11y CI-gatad skip) → **`149.3` FLIPPAD Done** (AC 6 + DoD
bockade, stängnings-summary i kortet). **Numrering re-verifierad mot
disk — EN divergens:** nästa tråd är **T133**, inte handoffens T131 —
T131 (Dokument-ytan) OCH T132 (svepets draftfilter) förbrukade av S93.
Övriga axlar håller: 099/ADR-098/L480 + 4 fragment/task-158
(RESERVERAT)/f47. **Skarpbevis-läget delat:** `deny-subagent-vantan.sh`
registrerad FÖRE sessionsstart ⇒ laddad, betalas nu;
`deny-arbetsform-push.sh` landade UNDER sessionen (`a95d271c`) ⇒ oladdad
här — skulden bokförd i 149.3-kortet, betalas i session född efter
`a95d271c`. Heartbeat-monitorn igång; kända DIRTY-larm `#862` (S93
draft, T132-klassen) + `#882` (S100:s paus-PR) — främmande sessioners
PR:er, rörs ej. **Del 6 LANDAD: uppdrag 6 grillat till samsyn** (sex kvitterade frågor —
domänhierarkin: koden äger beteende & mekanik, prosa är karta;
§0-termposten hub-landad `7913c16`; ingen ny grind, decline ×3) ·
`157.1` ✅ (ADR-098, `#889`) · `149.4` ✅ (hub `93892dd`, plugin
**1.30.0**) · `task-159` + tre skivor mintade. **Del 7 LANDAD: uppdrag 7 klart** — memory-ytan kuraterad på Marcus
beslut (BEHÅLL 6: tre mandat + tre maskinfakta · RADERA 10 inkl. kaizen;
Marcus stänger själv av auto-memory, kvarvarande läses endast instruerat) ·
`158.1` ✅ (ADR-099, `#903` — ADR-041 beslut 6 rivet öppet) · `157.2` i
bygge. **NÄSTA: spawna 159.1 (ADR-100) + 158.2 (arkiverings-skriptet,
båda avblockade av #903) → grilla 8 (/compact) → 9
(styrande-docs-auditen, mot 159-ADR:n som måttstock) · Marcus-moment:
stäng av auto-memory · boka 148.5 · triagera 154–156 · Dependabot #635.**
*(Paus-kadensraden nedan, bevarad.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 99 ⏸️ PAUSAD (2026-08-07, första pausen, `lifecycle: paused`)** —
**PROCESS-SYNEN: FEM AV ÅTTA UPPDRAG GRILLADE OCH EXEKVERADE PÅ EN DAG.**
Uppdrag 1 (parkerings-problemet) → **ADR-096** väntekontraktet +
PreToolUse-spärren (`deny-subagent-vantan.sh`, `#860`) +
instruktionskompletteringen (`#857`) + mätprotokollet (`#856`); rotorsaken
var redan strukturellt belagd, kompensationen mekaniserad. Uppdrag 2
(T126) → **ADR-097** tillståndsbärare + rotorsaken OPRÖVAD→**MÄTT**
(`#865`) + arbetsform-tillståndsfilen + push-hooken
(`deny-arbetsform-push.sh`, `#876` i kön) + bärarkartan (132 regler,
`#870`) + push-ekonomin/draft-regeln kodifierade (`#877`). Uppdrag 3 →
tio kandidater, fyra fynd-kort exekverade (`150`–`153`: larmtext-lögnen
rättad · #844-driften löst + 39 kort etiketterade · `stada-grenar.sh` ·
draft-bäraren), `#871`-transienten triagerad. Uppdrag 4 (trådregistret
214 KB mot Read-taket) → **TASK-157**: tunna radformen + migration +
radlängds-grind (ADR-098 mintas i resumen). Uppdrag 5
(sessionsdok-arkiveringen) → samsyn: rullande fönster, ADR-099 —
**task-158 mintas som FÖRSTA jobb i resumen** (Marcus-beslut, 44 %
kontext). **Uppdrag 6–8 OGRILLADE.** Skarpbevis-skulder: TVÅ hookar.
**NÄSTA: resume → skarpbevisen → minta 158 → spawna 157.1 + 149.4 →
grilla 6/7/8.** **HANDOFF: sessionsdok S99 § PAUSLÄGE.** Numrering vid
paus: 099/L480 + 4 fragment/T131 (re-verifiera — S93 rör sig)/task-158
(RESERVERAT)/f47. Heartbeat-monitorn stoppad med avsikt — starta vid
resume.
*(S93:s kadensrad nedan, oförändrad.)*

**Session 93 ⏸️ PAUSAD (2026-08-09, nionde pausen, `lifecycle: paused`) —
EVENTSIDAN KLAR: PROMOVERAD, GODKÄND, RIVEN, REGRESSIONSLÅST.** Åttonde
resumen tog hela vägen: staging-diagnosens fyra rotorsaker fixade
(`#999`/`#1000`/`#1003`/`#1007`/`#1017`) → första helt gröna post-merge →
larm-ytan nollställd (31+1 ärenden med motivering) → **G2-grillningen →
`ADR-104` kanalseparation** (research-belagd, `!`-kanalens hook-osynlighet
förstahands-mätt) → mekaniken byggd (`#1023`+`#1025`) → Marcus QA godkänd →
`162.5`+PRD-`162` Done → **första skarpa `!`-stämplingen** (`#1024`) +
hook-skarpbeviset betalt i förtid → rivningen (`#1026`, −1475 rader) →
baslinjen omtagen + välsignad (`#1027`) → `145.6`+`167` Done (`#1029`).
Kort `163`–`167` alla Done · `168` (hook-tuning) + `169` (backlog-städet,
äger nattens enda röda: 21-korts-skulden, `#1028` stängt) mintade
plockbara. **NÄSTA RESUME = S100-ÖVERTAGANDET** (kvitterat: bo-triage +
bindestrecks-beslutet Marcus · PRD med test-konsument-svep-AC · Marcus
facit-låsning · S100 stängs). Numrering vid paus mot `a253fb1f`:
105/L480+8 fragment/T140/**task-170**/f47.
**HANDOFF: sessionsdok S93 § PAUSLÄGE (nionde) + Del 12–14.**
*(Föregående resume-block nedan oförändrat.)*

**Session 93 ▶️ ÅTERUPPTAGEN (2026-08-08, `lifecycle: active`, åttonde
resumen) — 162-KÖN KÖRS VIDARE MOT MARCUS QA** — Marcus resume-order utan
ny scope; arbetet fortsätter per handoffens NÄSTA-lista. Paus-PR:en `#996`
mergade i resume-ögonblicket (kön byggde den när svepet började) — doket
lästes från paus-grenen och `main` fast-forwardades före återställningen.
Huvudkatalogen tillgänglig (ägarlappen släppt vid paus; S99 fjärde pausen
`#995` + S100 båda `lifecycle: paused` — ingen parallell session aktiv).
Numrering re-verifierad mot `c929ec6e`, INGEN divergens: 104/L480 + 8
fragment/T139 (indexet, inte filräkning — T137/T138 är indexrader utan
kort)/task-163/f47. **UPPDATERAT under passet (Del 13):** staging-
diagnosen gav 9 unika röda i fyra klasser → testfixarna `#999`+`#1000`
MERGADE · fynd-korten **task-163–165** + tråd **T139** mintade (`#1001`)
på Marcus GO — de stående röda har ägare · AC #6-TOLKNINGEN KVITTERAD
(stäng på promoverings-ytornas gröna, främmande röda på egna kort) ·
**S100-ÖVERTAGANDET KVITTERAT** (åtgärds-/granskningssidan = promoveringens
andra tillämpning efter 162-kön+QA+G2; facit-låsningen Marcus moment).
**HELHETSPLANEN I FIL: sessionsdok S93 § Del 13 Verkställighets-ordningen**
(1 post-merge-bevis→stängningar · 2 spawna 162.4 · 3 163–165+larmstäd ·
4 G2 · 5 QA→145.6 · 6 S100-övertagandet · 7 vilande).
**G2 AVGJORD (Del 14, 2026-08-08 kväll): ADR-104 kanalseparation** — fem
kvitterade beslut + helhetskvittens; `!`-kanalens hook-osynlighet MÄTT
förstahand; bygg-kortet **task-167** (skript+hook+grind-invariant) mintat.
Steg 1–3 slutna: 162.2/162.3/162.4 levererade · 163–166 fixade/stängda ·
`#464` STÄNGT med grönt bevis. Kvar: post-merge-grönt→larmstäd · 167 ·
QA 162.5 (avslutas med `!`-stämplingen) · 145.6 · S100-övertagandet.
**HANDOFF: sessionsdok S93 § Paushistorik (åttonde) + Del 12–14.**
*(Föregående paus-läge nedan oförändrat.)*

**Session 93 ⏸️ PAUSAD (2026-08-08, åttonde pausen, `lifecycle: paused`) —
PROMOVERINGSFORMEN ETABLERAD, 162-KÖN 3 AV 5 LANDADE** — sjunde resumen
levererade hela audit-kedjan: fyra axlar (rotorsaks-verifiering R1–R9 ·
56-posters tidslinje transkript-utvidgad · First principles ·
branschresearch RP1–RP3, `#962`+`#966`) → polval-grillningen (6 kvitterade
beslut) → **`ADR-103` promoveringsformen** ("skarpa bygget" avskaffat;
promovera → granska → godkänn → riv flaggan) + amenderingar 102/074
(`#975`) → PRD `task-162` + 5 skivor (`#979`+`#981`) → **162.1 Done**
(grinden: 12 ariaSnapshot-referenser + tvåsidigt bevis, `#983`+`#987`) →
**162.2 + 162.3 MERGADE** (`#991`+`#992`) — **den promoverade ytan är i
`main`**, bevisad identisk även på skarpa URL:en (8/8). Enabling:
nanoid-fixen (`#959`). **`T138`** född + gren-sanering (358→72 lokala;
remote-halvan var oprunad ref-cache — rättat öppet, `#988`+`#990`).
**VÄNTAR:** 162.4-spawn (deps mergade) → **162.5 Marcus QA** →
G2-grillningen → `145.6` rivning. Numrering vid paus mot `b5703ba6`:
104/L480+8 fragment/**T139**/**task-163**/f47.
**HANDOFF: sessionsdok S93 § PAUSLÄGE (åttonde).**
*(Föregående resume-block nedan oförändrat.)*

**Session 93 ▶️ ÅTERUPPTAGEN (2026-08-07, `lifecycle: active`, sjunde
resumen) — AUDIT-UPPDRAGET: PROTOTYP→SKARP-PROCESSEN SYNAS I GRUNDEN** —
Marcus order vid resume, tvådelad: (1) **full audit** av allt som gått snett
från prototypbygget till skarpa bygget — rotorsakerna (`ADR-102` R1–R9 med
flera) ska VERIFIERAS mot disk/git, varje lösning per rotorsak ska GRILLAS,
och slutmålet är att prototyp→skarp-processen blir *"rolig och enkel …
problemfri och tydlig"*; (2) **skarpa versionen i mål** (`A1`–`A6` → arbete
per B4-ordningen: identisk → Marcus jämför → godkänner → först då rivs
prototypen). Huvudkatalogen är sessionens EGEN — ägarlappen togs över vid
sessionsstart (samma terminalprocess, PID 47876, ny session `5a232dcd`).
Numrering re-verifierad mot `a2ebf8c8`: 103/L480 + åtta fragment/T137/
**task-162** (**DIVERGENS:** handoffens `task-161` förbrukades av S99 under
pausen — kortet + tio skivor finns på disk)/f47.
**HANDOFF: sessionsdok S93 § Del 11 + Paushistorik (sjätte pausen).**
*(Föregående paus-läge nedan oförändrat.)*

**Session 93 ⏸️ PAUSAD (2026-08-07, sjätte pausen, `lifecycle: paused`) —
FACIT-HAVERIET BOKFÖRT OCH MEKANISERAT** — `main` = `73e94776`. **`ADR-102`
mintad på Marcus order:** *"Prototypen ÄR facit … Prototypen och skarpa version
ska vara IDENTISKA"* + *"INGEN prototyp raderas förens jag godkänt att det
skarpa bygget är EXAKT som prototypen."* Fem beslut (B1–B5), **NIO rotorsaker**
mätta — den skarpaste: orkestreraren öppnade en bild från konvergens-passet
(5 aug), kallade den FACIT inför Marcus, **20 min efter att ha beskrivit exakt
den felklassen** och en dag efter att själv ha skrivit lärdomen om den.
**MEKANISERAT** (`#949`): `facit.json`-manifest + `scripts/check-facit.sh` som
CI-grind FÖRE merge (en DoD-post kan aldrig grinda en merge — agentens fynd);
tvåsidigt bevis 18/18; `TASK-145.6` nu `blocked` **av kod**, inte av prosa.
Grinden avgör INTE om ytan SER UT som facit — den jämförelsen är Marcus öga.
**FACITKARTAN** (`#950`): elva block, åtta identiska, **sex avvikelser `A1`–`A6`**
— fem av sex i registret. **TAKTEN:** `145.1`–`146.3` gav netto **−134 rader**
i `src/` (ingenting byggdes från noll); ett-agent-svepet kostade **510k tokens
totalt mot 500–620k PER skiva** ≈ **3× billigare** → `T134`:s första datapunkt.
`145.3`+`145.5` landade grönt; `145.6` **ej byggd** (rivning hade flippat
betalningsytan skrivbar — agentens stopp verifierat korrekt). `main` gick från
**12 röda till 2**, båda andras. Karantänen behövdes aldrig. **`T135`:**
post-merge avbryts trots att filen säger *"ALDRIG"* — reproducerad 2/2, orsak
EJ fastställd. **MOTTAGEN-DATUMET var ingen drift:** fusk-tabellen revs per
Marcus väg C, förmågan finns kvar och väntar `TASK-147`. **VÄNTAR MARCUS:**
`A1`–`A6`:s skivning · åtgärds-sidans hopkoppling (S100 varv 4, 1 850 rader).
Numrering disk-verifierad mot `73e94776`: **103**/L480 + åtta fragment/**T137**
(`T136` mintad av annan session)/**task-161**/f47.
**HANDOFF: sessionsdok S93 § PAUSLÄGE.**
*(Föregående paus-läge nedan oförändrat.)* `145.1` (registret som EN lista) · `145.2`
(summeringsblocket med Bor över + Avbokade i facit-låst form) · `146.1`
(PDF-runtime **BEVIS**) · `146.2` (Bilagor-tabellen, additivitet mätt över 19
tabeller) · `146.3` (privat bucket, AC #3 bevisad i tre oberoende ben) —
samtliga `Done`. **`145.4` (betalningsytan) ARMERAD OCH KÖAD** vid
paus-skrivningen; `PROTO_MOTTAGEN_DATUM` riven till noll träffar.
Enabling-detour: wiring-vaktens självtest gjort config-drivet (`#906`).
**MARCUS UNDERKÄNDE TAKTEN** — verbatim: *"Vi kodar ju inte ett nytt Google
liksom"* + prototyp-jämförelsen. Mätt: `145.1` ensam kostade **2,5 timmar,
varav 72 min rent slöseri** från mina felaktiga uppdrag. Diagnos: skillnaden
mot prototypen är apparaten, inte koden. **TVÅ MARCUS-BESLUT VÄNTAR:** (1)
`main`-rödan (`#895`, 12 väntade staging-tester, ingen regression) — karantän,
låt vara, eller prioritera om · (2) takten — agent-apparat eller direkt
redigering för `145.3`/`145.5`/`145.6`. **BESLUTAT MEN EJ PÅBÖRJAT:** nästa
resume tar `145.3`+`145.5`+`145.6` med EN agent i ett svep, en PR per skiva.
**FEM SPEC-FEL, alla mina, alla fångade externt** → två fragment skördade
(skivning mot kodens kopplingar · källmärkning måste avse gällande text).
**TVÅ TRÅDAR:** `T132` (svepets DIRTY-väg filtrerar inte `isDraft`) · `T133`
(Airtable-PAT har create-rätt mot BÅDA baserna). Numrering disk-verifierad mot
`318b0cd6`: **101**/L480 + sex fragment/**T134**/**task-160**/f47 — axlarna
rörde sig kraftigt (S99/S100 tog `ADR-096`–`100`, `task-149`–`159`).
**HANDOFF: sessionsdok S93 § PAUSLÄGE.**
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 93 ▶️ ÅTERUPPTAGEN (2026-08-07, `lifecycle: active`) — FEMTE
RESUMEN: BYGGAGENTERNA UT** — pausens båda verifikationssteg **KLARA**:
`#850` mergad `09:38:46Z` (`aa132f62`) och paus-landningen `#851` mergad
`09:45:43Z` (`c3cf9f1e`). Svepet: `main` = `c3cf9f1e` (CI `in_progress`) ·
en öppen PR (`#635` Dependabot web-vitals, parkerad) · fyra öppna larm-ärenden
(`#847`/`#844`/`#780`/`#464`, samtliga kända sedan Del 7). **DIVERGENS
FLAGGAD:** huvudkatalogen står på `docs/s99-del2-vantekontraktet` (`aa132f62`)
och dess kopia av sessionsdoket saknar Del 8 + PAUSLÄGE och läser
`lifecycle: active` — **samma fälla Del 7 § Ingången bokförde**; resumen läste
worktree-kopian. Katalogval: ägarlappen tillhör **S99** (pid `90883`, levande)
⇒ arbetet sker i `.claude/worktrees/s93-resume-2` på `docs/s93-resume-5`.
**Numreringen disk-verifierad mot `c3cf9f1e` — fem axlar, noll avvikelser:**
096/**L480**/T132/task-148/f47 + tre nummerlösa fragment. Etiketterna
verifierade per kort: **elva `ready-for-agent`**, två `ready-for-human`
(QA-korten `145.7` + `146.6`). Beroendegrafen läst ur korten: utan beroenden
just nu är `145.1`, `146.1`, `146.2`, `146.3` — men ordningsregeln
*eventsidan före fundamentet* håller tillbaka `146.2`/`146.3`.
**FÖRSTA VÅGEN KÖRD — ETT BEVIS IN, ETT STOPP.** `TASK-146.1` **BEVIS**:
PDF-generering fungerar i den skarpa Edge Runtime (`supabase-edge-runtime-1.74.2`,
Deno v2.1.4 — aldrig Node-proxyn), svenska tecken verifierade två oberoende
vägar med negativ kontroll, heapUsed-delta ~2,8 MB / ~18 ms / kallstart 1180 ms
mot 290–316 ms varm; `cancelled by supervisor` inträffade inte. Landad `#855`
(`38565ae8`). **Ärlig lucka: staging-sviten står `skipping` i CI** — beviset
vilar på lokal körning mot live staging, inte på grinden.
**`TASK-145.1` STOPPAD, EJ ARMERAD — `#862` står `draft`.** Sju AC
live-verifierade och DoD-7-grinden bevisad i båda riktningar, men diffen
raderar **två E2E-filer** (1 310 rader): `event-bor-over` (359) och
`event-bekraftelse` (951). **Bor över är kvitterad som överlevande rad**
(grillad samsyn beslut 2, Del 3) men **ingen skiva äger den** — och luckan är
större: `Avbokade` saknar också ägare som rad. Hål i `/to-issues`-passet, ej
agentens fel. Tredje frågan: produktionsvyn tömdes på räknare/filter/markera-läge
(`145.2`/`145.3`:s AC-yta) ⇒ `main` visar en tunnare eventsida i mellanläget.
**NÄSTA: Marcus avgör de tre frågorna — `145.2` och `145.3` beror båda på
`145.1`, så hela eventsidan står still tills dess.** Numreringen rörde sig
under passet: S99 tog `ADR-096` + `task-148`, senare syntes `task-152`/`153`
⇒ **nästa ADR 097**, kortnummer räknas om mot disk vid varje `task create`.
Lärdomen `parkerad-pr-utan-draft` fick sin **andra instans — av sin egen
författare** (`#866`); hör till `T126`:s mekanism-val. Dev-servern lever på
5173; granskningsfixturen t.o.m. 2026-08-16.
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 93 ⏸️ PAUSAD (2026-08-07, `lifecycle: paused`) — ALLT KLART FÖR
BYGGAGENTER** — **TRETTON SKIVOR PUBLICERADE, ELVA AFK-BARA.** `TASK-145`
(eventsidan) sju skivor · `TASK-146` (bilage-fundamentet) sex · bara de två
QA-korten är `ready-for-human`. **ÅTGÄRDS-SIDANS UNDERLAG LANDAT** som
[`docs/specs/ATGARDSSIDAN-UNDERLAG.md`](../docs/specs/ATGARDSSIDAN-UNDERLAG.md)
— tio avsnitt, konsoliderade ur sessionsdok, bilaga, två research-pass,
ORDLISTA och **docblock i produktionskod** (där mest låg: tabellen över vilka
Åtgärds-rader som flyttar, med Marcus verbatim per rad). **DE SEX
ÅTGÄRDSTYPERNA BEKRÄFTADE:** manuell anmälan · bekräftelse ·
betalningspåminnelse · markera betalda · eventinfo · fritt utskick.
**MARCUS DATUM-BESLUT (väg C):** datumet SKA byggas —`TASK-145` renderar när
fältet bär värde, `TASK-147` äger fält + allowlist + skrivväg;
`PROTO_MOTTAGEN_DATUM` rivs; accepterad konsekvens att gamla betalningar
aldrig får datum. **TRE SKIV-BESLUT mot disk:** betalningsytans rivning+form
ihopslagen (en delad skiva hade fallit på DoD #5) · markera-läget beror på
FILTRERINGEN (mätt: kandidatlistan ÄR den filtrerade) · **Dokument-ytan
utbruten till `T131`** — och därefter, på Marcus fråga, **inflyttad i
åtgärds-sidans session** eftersom bilageväljaren visar det Dokument-ytan
förvaltar. **FYND:** repot har varken `supabase/migrations` eller
storage-konfiguration ⇒ båda provisionerings-skivorna kräver incheckade
idempotenta skript, vilket gjorde dem AFK-bara. **ORDNING:** eventsidan FÖRE
fundamentet — `TASK-146` saknar UI-konsument tills åtgärds-sessionen levererat.
**NÄSTA: verifiera `#850` → svep → skicka ut byggagenter** (`145.1`→`145.2`→
`145.3`, parallellt `145.4`→`145.5`→`145.6`; `146.1` fristående; `145.6`
ALLRA SIST). Parallell ny session tar åtgärds-sidan + Dokument-ytan med
underlaget som ingång — tre krockytor och deras regler i underlaget § 9.
Numrering: 096/**L480**/T132/task-148/f47 + tre nummerlösa fragment.
**HANDOFF: sessionsdok S93 § PAUSLÄGE.**
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 93 ▶️ ÅTERUPPTAGEN (2026-08-07, `lifecycle: active`) — PRD × 3
LEVERERADE** — **GITHUB ACTIONS LÅG NERE, OCH TVÅ VAKTER LJÖG OM DET.**
`#838` stod `BLOCKED` med en required check i `CANCELLED` — jobbet hade kört
**15 min 01 s med noll steg**, alltså *"fick aldrig en runner"*, medan
samtliga substantiella jobb var gröna. Orsak: Actions i `major_outage`
(incident `qcvjkzcs7j74`) medan Git/API/PR var `operational`. Heartbeat-svepet
larmade level-triggered på en rollup som strukturellt inte kunde tystna
(= S96:s `T128`), och den riktade ersättningsvakten bröt på ett
`operational` som statussidan flaxat fram — **förgrundsverifieringen fångade
båda**. Omkörningen stod `queued` i **13 tim med noll jobb**; rätt grepp blev
`git merge origin/main`, som löste `DIRTY` **och** triggade färsk CI.
**NUMMERKOLLISION:** S96 mintade sitt eget `T127` (+`T128`/`T129`) och landade
först — S93:s pill-skala omnumrerad `T127` → **`T130`**, nästa tråd `T131`.
**MARCUS-BESLUT som skrev om kortsnittet:** *"eventsidan är bara för översyn
nu ju, så alla åtgärder flyttar till åtgärdssidan"* — kort 1 krympte till EN
utgång och EN hermetisk skarv, kort 3 svalde hela betalningsvertikalen +
avprickningens staging-skarv; **K27-anden riven öppet**, beslut 1 amenderat.
**LEVERERAT:** `TASK-145` (eventsidans konsolidering) · `TASK-146`
(bilage-fundamentet) · `TASK-147` (åtgärds-sidan) — 14 spec-specifika
DoD-grindar, tre ADR-bar-träffar + `ADR-067`-revision. **FYND:** de sex
åtgärdstyperna finns **ingenstans** på disk (beslut 5 säger "6 typer"; genom-
sökt sessionsdok/research/ORDLISTA/specar/kod) — öppen punkt, ej gissad.
`#838` LANDAD `07:55:07Z` (`3537e39e`). **NÄSTA: `/to-issues`** — kort 2 är
mest redo (dess förkrav är ett bevis vi själva kan köra), kort 1 kräver
Marcus datum-beslut, kort 3 väntar på divergens-passet + de sex typerna +
Roger-avstämningen. Numrering: 096/**L480**/T131/task-148/f47 + tre
nummerlösa fragment. **EJ KÖRT: `test:visual`.** **HANDOFF: sessionsdok S93
Del 7.**
*(S96 är `paused` sedan sin åttonde paus — dess kadensrad nedan, oförändrad.)*

**Session 96 ⏸️ PAUSAD (2026-08-07, åttonde pausen, `lifecycle: paused`)** —
**PRODS UTGÅENDE POST VAR DÖD, OCH DET VAR EN DIFF SOM DOLDE DET.** Marcus fick
inget återställningsmail; prods auth-logg gav rotorsaken direkt — `/recover`
`500` med SMTP-svaret **`535 "Authentication credentials invalid"`**. Resend
avvisade inloggningen, mailet lämnade aldrig Supabase, och det gällde **all**
prod-post — inbjudningar inkluderat. **Del 12:s maskinella diff bevisade att
SMTP-fälten ÄNDRADES, inte att credentialen FUNGERADE**; den skillnaden kostade
ett dygn utan att någon mekanism sa till. Fix: ny domänlåst sending-only
Resend-nyckel via riktad PATCH (2 fält av 242), och **beviset taget
funktionellt** — `/recover` `200` + Resend `delivered` samma sekund.
Mail-taket i prod 2 → 30. **MAILMALLARNA** fick ordmärket som PNG (aldrig SVG —
Gmails webbmail saknar stöd) och sidfoten **"Roger och Lotta"**, deployat till
BÅDA miljöerna med diff-bevis. **APPEN:** fönstertitelns appnamn-suffix bort på
**14 rader i 13 filer** (brödsmulorna i namnlisten var våra egna) + namnlist som
följer ljus/mörkt läge — där en utelämning av `theme_color` hade gett
`vite-plugin-pwa`:s **Vue-gröna** default, fångat genom att läsa den byggda
artefakten. **PWA-frågan besvarad:** Marcus installerade appen och behåller
vägen; ingen ADR har någonsin vägt nedladdningsbar app mot PWA.
**GITHUB ACTIONS LÅG NERE I NIO TIMMAR** (`qcvjkzcs7j74`) mitt i passet — tre
operativa lärdomar, inklusive en tyst konsumerad armering som Marcus såg före
mig. **4 PR:er landade** (`#840`–`#843`). **`T127`–`T129` registrerade.**
**NÄSTA: Marcus två mätningar (namnlisten i mörkt läge · mailet med logotypen)
→ `TASK-116` AC #3 → `TASK-129`/`TASK-138` → `T124` när formen är vald →
QA-korten `126.3`/`126.5`/`127.10`.**
**HANDOFF: sessionsdok S96 § PAUSLÄGE (åttonde pausen).** Numrering
disk-verifierad 2026-08-07 mot `23fecaa7`: 096/**L480** + 3 fragment/**T130**/
task-145/f47. Heartbeat-monitorn är **stoppad med avsikt** — starta den vid
resume.
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 96 ▶️ ÅTERUPPTAGEN (2026-08-06, `lifecycle: active`)** — **ÅTTONDE
PASSET ÖPPNADE MED EN SKARP DEFEKT I PROD, INTE MED HANDOFFENS PUNKT 1.** Marcus
prövade lösenordsåterställningen på `admin.miranon.dev` och fick inget mail.
Rotorsaken är belagd i prods egen auth-logg (`13:51:16Z`, `/recover`,
`status 500`): **`535 "Authentication credentials invalid"`** — Resend avvisar
prods SMTP-inloggning, mailet lämnar aldrig Supabase. Resend-loggen bekräftar
oberoende (noll mail till adressen; senaste posterna är stagings test-inbjudningar
`07:58`/`07:59`). **Konsekvensen är bredare än återställningen: ALL utgående post
från prod är trasig, inbjudningar inkluderat.** Prod och staging bär OLIKA
`smtp_pass`-digester; stagings fungerar. Marcus prod-konto finns (skapat
2026-06-30) men har `last_sign_in_at: None` — fyra misslyckade inloggningar
`13:44`–`13:47` föregick försöket. **Varför ingen såg det:** `/glomt-losenord` är
medvetet fail-open (`TASK-127.7`, ADR-093) och visar "Kolla din inkorg" även vid
`500`; och Del 12:s prod-SMTP verifierades med **maskinell diff**, vilket bevisar
att fälten ändrades — inte att credentialen fungerar. **STOPPA-fråga ute till
Marcus** om credential-källan (Keychain-nyckeln · ny sending-only nyckel · egen
hand i Studio). Mail-låset (`TASK-137`) fällde min tänkta `AUTH`-test mot
`smtp.resend.com` — ej kringgången. Resumen kördes i **huvudkatalogen** (ingen
ägarlapp på `.git/katalogagarskap-agare.json`; ägarskap tas vid första skrivning
per T120). `main` på `58c7867a`, arbetsträd rent, `Nattvakt`/`Post-merge`/`Push
on main` gröna. **Numreringen re-verifierad mot disk — TVÅ AVVIKELSER mot
handoffen:** nästa tråd är **`T127`** (handoffen sa `T125`; S93 förbrukade
`T125`–`T126`) och det finns **3 nummerlösa lessons-fragment** (handoffen sa
noll). Oförändrat: `096`/`L480`/`task-145`/`f47`.
**LEVERERAT SEDAN DESS (Del 17):** prods SMTP lagad med ny domänlåst
Resend-nyckel och **funktionellt bevisad** (`/recover` `500`+`535` → `200`;
mailet `delivered`) · mail-taket 2 → 30 i prod · **`#841`** logotyp + "Roger och
Lotta" i båda mallarna · **`#842`** titel utan appnamn-suffix (14 rader, 13
filer) + namnlist som följer ljus/mörkt läge · mallarna deployade till BÅDA
miljöerna med diff-bevis (2 fält av 242 vardera, `smtp_pass`/`uri_allow_list`
orörda) · **`T127`–`T129`** registrerade. **NÄSTA: Marcus mäter namnlisten i
ljust/mörkt läge (öppen mätpunkt) → `TASK-116` AC #3 → `TASK-129`/`TASK-138` →
`T124` när formen är vald → QA-korten `126.3`/`126.5`/`127.10`.**
**HANDOFF: sessionsdok S96 § Del 17.**
*(S93 är `paused` sedan `#839` — dess kadensrad nedan, oförändrad.)*

**Session 93 ⏸️ PAUSAD (2026-08-06, `lifecycle: paused`) — FACIT LÅST** —
**ELVA ITERATIONSVÅGOR (10–20) OCH MARCUS LÅS.** Betalningsytan blev en
LÄSYTA i anmälningssidans grammatik (`DetaljGrupp`/`EtikettVardeRad`): **18
tomma `<Input>` rivna** (ytan är för ÖVERBLICK — editering hör till
åtgärds-sidan) · höger-slotten **helt riven** (i fliken "Saknar betalning (9)"
sa ytan samma sak TRE gånger: fliknamn, obockat kryss, ordet "Saknas") ·
noteringen fick egen rad med symmetrisk luft · utskicken blev `Tidslinje`
(Shopify/Stripe activity-formen) · mottagen-pill med datum. **Gruppdynamiken:**
fixturen berikades så blocket gick att granska alls — två av tre ytor
renderade tomt — inklusive **`T16`-divergensen gjord synlig** (Gustav Wik "3+
tidigare event" + badge "Ej påbörjat", RIM-3-blindheten). Knappformen härmar
nu Deltagares, personkorten `PersonMiniKort`s. **Sju proto-texter rivna** ·
composern 64 → 112 px. **`T130` mintad** (pill-skalan: 23 pillar i TRE former,
inte två). **DATAGRÄNS:** `Mottagen <datum>` kan inte byggas skarpt — basens
betalningsfält är singleSelect utan tidsstämpel; pillen visas mot
prototyp-lokalt datum, bas-fälten är Marcus beslut. **PROCESSFYND:**
`mt-*`/`mb-*` på `<p>` är TYSTA NO-OPS (global oskiktad `p { margin: 0 }` slår
`@layer utilities`) — två vågor i rad var verkningslösa, lesson-kandidat ·
grenen låg 4 commits bakom `main` hela passet (den formella pausen `#839`
landade under tiden), löst med merge, EN konflikt, ingen bokföring förlorad.
**`#838` bär 26 commits, är UR DRAFT och ARMERAD** (`enabledAt 17:02:40Z`) men
hade INTE landat vid paus-skrivningen — **verifiera först, armera bara om vid
utsparkning.** **NÄSTA: `/to-prd` × 3 → `/to-issues`**
(Marcus förvarnade att det blir nästa resumes arbete). **HANDOFF: sessionsdok
S93 § PAUSLÄGE (facit låst).** Numrering disk-verifierad mot `7c3f4ea7`:
096/**L480**/T131/task-145/f47. **EJ KÖRT: `test:visual`** — vågorna 19–20
ändrar skarp kod med avsikt, baselines förväntas skilja.

**Session 93 ⏸️ PAUSAD (2026-08-06, `lifecycle: paused`)** — **SJU
ITERATIONSVÅGOR PÅ KONVERGENS-PROTOTYPEN + TVÅ PROCESSFEL.** Handoffens alla
fem numreringsaxlar HÖLL denna gång (till skillnad från förra resumen), och
pausens punkt 1 bekräftades: `#830` landade av sig själv (`c4da4d12`).
Tillstånds-återställningen: **PR #833**. **VÅG 3** rev EN rot bakom Marcus fyra
punkter — filterraden var handrullad (`rounded-full`, 37–38 px) medan sidans
knappar går via `Button`-primitiven (`rounded` 4 px, 32 px); allt gick över till
primitiven, `EventsList.tsx` lämnad ORÖRD som produktionskod. **VÅGORNA 4–9:**
Filtrera som text → hela `Disclosure` RIVEN (filtervyn alltid framme, Markera ner
i batch-baren, mätt `y=625,3` i BÅDA lägena ⇒ ingen vertikal förskjutning) →
fotens höjd konstant (502 px tillgängligt mot 535,8 behövt ⇒ text på egen rad,
**höjdskillnad 0 px**) → två ärvda avdelare rivna → synlig hover + badge på Rensa
filter → kort bindestreck. **TRE EGNA FEL, alla fångade av mätning:**
Avbokade-raden byggdes som DUBBLETT (den fanns redan i logistik-gruppen, 197 px
bort) · fotens text mättes aldrig mot radens utrymme · `hover:`-klassen bet inte
mot primitivens `data-[hovered]:` (tailwind-merge ser ingen konflikt). **MARCUS
FÄLLDE KADENSEN:** *"Varför pushar du varje iterationsrunda?"* — regeln fanns i
`prototype`-skillens § 5 men lästes aldrig, eftersom resume→handoff→punktlista
inte laddar skillen. Omklassad från lesson till **`T126`** med eget kort på hans
order, rotorsaken märkt som OPRÖVAD hypotes. Kadensen lades om från våg 4: lokal
commit per varv, `#838` satt till **DRAFT**. **`T125`** registrerad
(knapp-standardiseringen). **NÄSTA RESUME:** `git checkout docs/s93-resume-3` i
`s93-resume-2`, starta dev-servern, ta emot Marcus nästa iteration — **armera
INTE `#838`**. **HANDOFF: sessionsdok S93 § PAUSLÄGE.** Numrering disk-verifierad
2026-08-06: 096/L470/**T127**/task-145/f47 + tre nummerlösa fragment.
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 96 ⏸️ PAUSAD (2026-08-06, sjunde pausen, `lifecycle: paused`)** —
**`TASK-127.9` STÄNGD: HELA INBJUDNINGSKEDJAN BEVISAD ÄNDE TILL ÄNDE.** 14 PR:er
(`#815`–`#836`). `test-invite-completion` byggd som staging-only EF med
adress-allowlist (`+e2e-`, kollad före varje Admin-API-anrop — utan den vore
`generateLink` en account-takeover-väg mellan admins), plus rundturs-e2e som går
`invite-user` → länk → `/valkommen` → `/login` → `/hem` genom riktig
UI-interaktion. **Bevisat i CI: 177 tester, 177 passerade.**
**FAS 7-BLOCKERINGEN VAR INBILLAD** — Marcus fällde påståendet, och mätningen gav
honom rätt: Vercel-integrationen fungerade redan, och hela bristen var **en
saknad post i STAGINGS `uri_allow_list`**. Riktad PATCH, 1 fält av 242, prod
verifierat orörd. Fyra inaktuella statusytor rättade. **FYRA RÖDA KÖRNINGAR MED
FYRA FELUTPEKADE SKYLDIGA:** rotorsaken var S93:s `6f1d8c1a` (sr-only-rubriker
som bröt både axe `heading-order` och Playwrights strict mode); larm-heuristiken
pekade ut oskyldiga PR:er med färdiga revert-kommandon, och `#828` utpekade
rundturen vars **eget test var grönt i samma körning som fällde den**. S93 tog
fixen (`#830`) med en bättre lösning än vår rekommendation. **SKÖRD `L470`–`L479`**
— sex fragment konsoliderade, **fragment-kön är TOM**, två kandidater förkastade
mot befintliga poster. `T124` född · `TASK-143`/`144`-driften rättad (234 kort, 0
inkonsistenta) · fyra larm-ärenden stängda. **NÄSTA: `TASK-116` AC #3 (en
dispatch, kortast väg till stängt kort) → `TASK-129`/`TASK-138` → `T124` när
Marcus valt form → QA-korten `126.3`/`126.5`/`127.10`.**
**HANDOFF: sessionsdok S96 § PAUSLÄGE (sjunde pausen).** Numrering disk-verifierad
2026-08-06 mot `eef720ad`: 096/**L480**/T125/task-145/f47.
*(S93 kör parallellt och är `active` — dess kadensrad nedan, oförändrad.)*

**Session 93 ▶️ ÅTERUPPTAGEN (2026-08-06, `lifecycle: active`)** — **APPSPÅRET
ÅTER I GÅNG** efter pausen med iterationsvåg 2 armerad. Resumen kördes i
**samma worktree** (`s93-resume-2`, ny gren `docs/s93-resume-3`) — huvudkatalogen
bär fortfarande S96:s ägarlapp med **bevisligen levande process** (pid 93545),
och HEAD där bytte gren mitt under min läsning; worktree-lappets egen pid 57625
är död, så trädet var S93:s eget att återta. **PAUSENS PUNKT 1 VERIFIERAD: #830
LANDADE** — `MERGED` 2026-08-06T09:12:37Z, merge-commit `c4da4d12`; ingen
utsparkning, ingen omarmering behövd. **Landningsläget rent:** `main` på
`2406e573` med CI/Post-merge/Push gröna, noll röda, enda öppna PR är den
parkerade Dependabot-posten `#635`. **Numreringen höll denna gång** —
disk-verifierad 2026-08-06 identisk med handoffens paus-tida värden:
`096`/`L470`/`T125`/`task-145`/`f47`, plus sex okonsoliderade lessons-fragment.
Dev-servern på 5173 är NERE (dog med förra sessionen, som handoffen förutsåg).
**NÄSTA: Marcus granskning av iterationsvåg 2** (sju punkter, byggda och
egen-granskade — hans ögon har inte varit på dem) → ev. våg 3 → facit-låsning →
`/to-prd` × 3. **ÖPPET, obesvarat av Marcus:** heartbeat-fyndet (delad
state-fil + icke-atomär skrivning) och talens olika baser (`5 av 12 mottagna`
bredvid `Visar 14 av 14`). **HANDOFF: sessionsdok S93 § Paushistorik
(2026-08-06).**
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 93 ⏸️ PAUSAD (2026-08-06, `lifecycle: paused`)** — **TVÅ
ITERATIONSVÅGOR PÅ KONVERGENS-PROTOTYPEN.** Resumen kördes i egen worktree
(S96 ägde huvudkatalogen, ADR-090 beslut 2); ett tidigare resume-försök samma
dag hade fastnat på just den lappen och eskalerat — rotorsaken landade som
`#807`. **HELA numreringen hade drivit** under pausen (ADR `090`→`095` ·
`L443`→`L469` · tråd →`T123` · kort →`144`). **PR #812** (lifecycle-flipp,
rev en egen MD004-groda: en radbrytning gjorde `+` till listmarkör och fällde
**527 orörda rader** — ett tecken) · **#818** (iterationsvåg 1, Marcus åtta
punkter; **fyra filter-states blev ETT** — splittringen var en mätt buggkälla)
· **#830** (iterationsvåg 2, sju punkter + CI-fixen). **TVÅ EGNA FÅNGSTER
FÖRE HANDOVER:** breddlåset höll inte (143,69 mot 142,33 px — teckenANTAL är
fel proxy för renderad bredd) och Klara-raden var 1 px LÄGRE, inte högre som
rapporterat. **CI FÄLLDE MINA EGNA A11Y-RUBRIKER** (körning 31084229170, larm
`#821`/`#824`/`#825`): sr-only-zonrubriker rev BÅDE axe heading-order och
Playwrights strict mode — det som faktiskt bar tillgängligheten var kryssets
`aria-label` som redan fanns. Borttagna, `mark-paid` 13/13 mot staging.
**ÖPPET FYND, obesvarat:** heartbeat-svepets state delas mellan sessioner
(`/tmp/mm-heartbeat-svep/last-main-sha`) ⇒ bara EN session får veta om en
landning; belagt tre gånger. **NÄSTA RESUME: verifiera att #830 landade →
Marcus granskning av iterationsvåg 2 → ev. våg 3 → facit-låsning →
`/to-prd` × 3.** **HANDOFF: sessionsdok S93 § PAUSLÄGE.** Numrering
disk-verifierad 2026-08-06: 096/L470/T125/task-145/f47.
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 96 ▶️ ÅTERUPPTAGEN (2026-08-05, `lifecycle: active`)** — **MILJÖ- OCH
PROCESSPÅRET ÅTER I GÅNG** efter sjätte pausen. Resumen kördes i
**huvudkatalogen** — ägarlappen (`.git/katalogagarskap-agare.json`) bar denna
sessions egen id, ingen främmande ägare. `main` på `fd41db2e`, arbetsträd rent,
CI grön per jobb (CI · Post-merge · Push on main); enda öppna PR är `#635`
(dependabot web-vitals), oarmerad per stående beslut. **Numreringen
re-verifierad mot disk på `fd41db2e` — samtliga sex axlar oförändrade sedan
pausen** (`096`/`L470` + 6 fragment/`T124`/`task-145`/`f47`); S93 förbrukade
inga nummer under pausen. **Marcus kvitterade handoffens punkt 1** — research-
passets rekommendation (`docs/research/auth-invite-e2e-service-role-branschprecedent-2026-08-05.md`)
går till verkställighet, med passets §8-fynd bokfört i samma veva. **NÄSTA:
`TASK-127.9` enligt beslutet → `TASK-116` AC #3 (en dispatch, sedan stängning)
→ `TASK-129`/`TASK-138`, båda plockbara → QA-korten `126.3`/`126.5`/`127.10` när
Marcus vill.** **HANDOFF: sessionsdok S96 § Paushistorik paus 6.**
*(S93 kör parallellt och är fortsatt `active` — dess kadensrad nedan, oförändrad.)*

**Session 93 ▶️ ÅTERUPPTAGEN (2026-08-05, `lifecycle: active`)** — **APPSPÅRET
ÅTER I GÅNG** efter två dygns paus. Resumen kördes i **egen worktree**
(`s93-resume-2`) — huvudkatalogen bar S96:s ägarlapp med **bevisligen levande
process**, alltså ADR-090 beslut 2 rakt av. **HELA NUMRERINGEN HADE DRIVIT
UNDER PAUSEN** och samtliga fem axlar re-deriverades mot disk: ADR `090`→`095`
· lesson `L443`→`L469` · tråd `T114?`→`T123` · kort `127`→`144` · `f47`
bekräftad (handoffen bar den som hypotes). **Prototyp-läget verifierat, inte
antaget:** konvergens-passet ligger kvar på `main` (`#667` merged 2026-08-03,
`DeltagareHallplatsPrototyp.tsx` + `hallplats-steg-prototyp.ts`), dev-servern
åter uppe på `5173` ur worktreen (symlinkad `node_modules`, HTTP 200 på både
routen och båda modulerna), och granskningsfixturen `reco44UBx6GXcxwu5`
**lever** i
staging — 16 anmälda / 9 anmälningsavgifter / 3 slutbetalningar, utgår
2026-08-16. **FYND doket inte bokförde:** ett tidigare S93-resume-försök samma
dag fastnade på ägarlappen och eskalerade i stället för att ta worktree —
rotorsaken landad som `#807` (handlingsregeln bodde bara på deny-vägen; nu
inlinad i resume-skillen). **NÄSTA: Marcus iterationsvåg(or) på
konvergens-prototypen → facit låses → `/to-prd` ×3 (eventsidans konsolidering ·
bilage-fundamentet · åtgärds-sidan) → `/to-issues` → åtgärds-sidans
divergens-pass → Roger-avstämningen (kvitto-gränsen) före kort 3:s
kvitto-design.** **HANDOFF: sessionsdok S93 § Paushistorik.** Numrering
re-verifierad 2026-08-05 mot `1d7c56e8`: 096/L470/T124/**task-145**/f47
(S96:s rad sa `task-144` — `TASK-144` mintad och stängd sedan dess).
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 96 ⏸️ PAUSAD (2026-08-05, sjätte pausen, `lifecycle: paused`)** —
**MILJÖPAKETET KOMPLETT OCH APPEN ÄR ANVÄNDBAR.** 15 PR:er (`#792`–`#813`).
CORS · HIBP + lösenordsgolv 6→8 · `uri_allow_list` · prod-halvan av SMTP + OTP
— **allt mot BÅDA miljöerna**, varje skrivning en riktad PATCH med maskinell
242-fälts diff, noll oavsiktliga ändringar. **Grind 0: 6 av 7** (punkt 5 DMARC
väntar på rapportdata, inte arbete). **FYRA KORT:** `TASK-143` Done
(namn + inbjudare, spoof-immuniteten LIVE-bevisad mot staging) · `TASK-144`
Done (svenska mail-mallar i prod) · `TASK-128` Done (bokförings-rest — fixen låg
redan på main) · `TASK-136` landad · `TASK-116` delavstämd 3 av 4 AC.
**SECRETEN SOM INTE GICK ATT LÄSA:** stagings CORS-lista är write-only och
bokföringen pekade på fel projekt (2026-05-04-posten hashade till PRODUKTIONENS
digest — staging fanns inte förrän 2026-06-13). Värdet BEVISADES via
SHA256-matchning mot digesten plus preflight-svep, och bar två odokumenterade
Vite-portar som en blind skrivning hade raderat tyst. **PRODS
`uri_allow_list` VAR HELT TOM** — även `/valkommen` saknades, så varje
inbjudningslänk mot prod fick sin `redirectTo` tyst ignorerad.
**`config push` AVSTYRDES AV SIN EGEN DIFF** (`AUTH_SMTP_PASS` unset kunde ha
rivit stagings SMTP). **FYRA FEL I MITT ARBETE FÅNGADES EXTERNT, NOLL AV MIG
SJÄLV:** korten som inte aktualitets-prövades före sju agent-spawns (Marcus —
två av sex redan lösta i S97) · `TASK-144`-luckan (agent) · en felaktig
merge-commit-hänvisning (agent) · **en rekommendation utan belägg** (Marcus
fråga *"är det hur branschledare gör?"*). Den sista rev mitt eget svar TVÅ
gånger: research-passet visar att **väg A ÄR branschmönstret** — fyra varianter
i läsbar mergad kod, inget av 6+ projekt läser en riktig mailbox i CI.
**NÄSTA RESUME PUNKT 1: Marcus beslut på research-passet** (`docs/research/
auth-invite-e2e-service-role-branschprecedent-2026-08-05.md`), inklusive dess
§8-fynd att AC #1 är **Fas 7-beroende**, inte enbart service-role-blockerad.
**HANDOFF: sessionsdok S96 § PAUSLÄGE (sjätte pausen).** Numrering
disk-verifierad på `6ee089bf`: 096/L470/T124/task-145/f47, +6 nummerlösa
fragment. **S93 kör parallellt och är LEVANDE.**
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 98 ⏸️ PAUSAD (2026-08-05, `lifecycle: paused`)** — **NATTGRINDEN
FÄLLDE SIN EGEN SKAPELSE-COMMIT, OCH PARITETSGRINDEN OMKLASSADES.** 18 PR:er
(`#756`–`#773`) + fyra hub-commits + plugin **1.28.4**. **Scopets tre poster
betalda:** grind-fixen (`#757` — `git log --grep` prövar hela meddelandet, så
grindens egen commit citerade `[S96]` i sin body och fällde S96 utan drift) ·
kadensraden `L461`→`L469` (`#758`) · nattärende `#755` stängt med åtgärd.
**Därutöver:** `T123` betald med provenance omverifierad mot `1.48.0` (`#760`)
· `vol-06` roterad + `K97.1`–`K97.13` lyfta · UNIVERSAL-formens sjätte variant
fixad · `TASK-142` diff-klassning (`#762`) · **`L469`** mintad.
**PARITETSGRINDEN OMKLASSAD TILL DIAGNOSVERKTYG** (`#772`): 910,7 s lokal
kostnad mot ~12 s förväntad besparing vid 3 % felfrekvens — ~30× fel; den
regel Code själv föreslog mättes 2,3–2,9× dyrare än vad som faktiskt gjordes.
Rutinraden riven, `ADR-036` amenderad två gånger. **Marcus-fångster: tre** —
paritetens kostnad på docs, att pre-push redan var avgjort i `ADR-036`
2026-05-27, och att sex markörformer är symptomet. **AGENT-PARKERING: tre
agenter fastnade** (`L340`-klassen, känd i tio dagar); `bygg-agent.md` +
`research-pass.md` rättade, men **fixen är instruktion, inte mekanism, och
mätningen är konfunderad**. **HANDOFF + fyra beslutsposter: sessionsdok S98
§ PAUSLÄGE.** Numrering att re-verifiera: 99/096/L470/T124/task-143/f47.
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 97 ✅ AVSLUTAD (2026-08-05, `lifecycle: closed` efter Marcus
coverage-kvittens)** — **SEX MEKANISMER BYGGDA I KOD, TVÅ ROTORSAKER FIXADE.**
Sessionen spände över **fyra pauser**; fjärde resumen var den tyngsta (44
commits, PR `#738`–`#752`). **Marcus fråga vände sessionen:** *"är allt UTFÖRT,
inte bara förberett?"* — svaret var nej, och mandatet blev att bygga.
**BYGGT:** claims-täckning + `merge-tree` (`#745`) · `besläktad`-grinden
(`#747`, symmetrisk, **inget spegelkrav**) · `barn`-manifestet (`#750`,
asymmetrisk, **noll datarader** — mekanismen byggd, migreringen är Marcus
beslut) · nattlarmets timeout-klassning (`#748`) · länkröte-fixen (`#746`) ·
**`verify:ci-parity`** (`#752`, härleder ur `ci.yml` med fail-closed
paritetsvakt). **ADR-095** mintad (`#740`): Marcus öppnade för
Supabase-migrering av hela dokumentationssubstratet, nio system sade nej —
starkast **Backstage självt**, som kallar sin egen databas en *ingest-cache*.
**TVÅ ROTORSAKER:** `BEHIND`-deadlocken var **egen konfiguration** (strict +
merge_queue motverkade varandra; `ADR-076` hade bokfört kostnaden som accepterad
sex dagar före kön fanns och ingen konsumerade raden) — fixad `#749`,
**skarpbevisad** när `#752` landade efter `#751` utan handpåläggning · och
grind-diskrepansen med **fyra instanser på en session**, löst genom härledning
i stället för duplicering. **AGENT-FÅNGSTER:** hub-agentens villkorade mandat
stoppade ett borttag som hade tystat Discover · `TASK-141`-agenten fann två fel
i ADR-095 (stale ordinaltal + en formulering som motsade beslut 2 två stycken
bort) · Dependabot-granskningen fann att `#635` pinnar 6.0.0 medan 6.0.1 rättar
just den kastväg som gör bumpen riskabel. **Uppströmsrapporten postad** till
`anthropics/claude-code#72714`. **NÄSTA (NY session S98): `T123`
(backlog.md-bumpens efterslängar) · S96-resume (Grind 0 DNS + `T95`) ·
S93-resume (appen) · `#635` vid måndagens Dependabot-körning · hub-lyftet måste
**rotera `vol-06` FÖRST**.** Numrering efter S97: 98/096/L469/T124/task-142/f47.
*(Lesson-axeln rättad 2026-08-05 i S98: raden skrevs `L461` vid stängningen,
före `#754` landade `L461`–`L468` som HEAD-mergen. Disk är auktoritativ —
re-derivera alltid mot `tasks/lessons.md`, aldrig ur en kadensrad.)*
Full narrativ: sessionsdok S97 Del 1–10 + BUILD-LOG S97-post.
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 97 ▶️ ÅTERUPPTAGEN (2026-08-05, fjärde resumen — efter fjärde pausen,
`lifecycle: active`)** — **MARCUS-MANDAT PÅ HELA CARRY-BLOCKET.** LÄS-fasen:
numreringen re-verifierad mot disk (**095/L456/T123/task-139/f47** — alla fem
oförändrade, noll mellansessioner har förbrukat nummer) · `main` **`2c929e03`**
grön per jobb (CI · Post-merge · CodeQL) · ägarlappen FRI (filen frånvarande) ·
fyra pausade dok (S92/S93/S96/S97), inget `active` · `#632`–`#635` alla `CLEAN`
och oarmerade. Marcus gav **mandat att utföra samtliga fem beslutsposter på
rekommendation** ("vi har mycket som är belagt med research vilket är ett krav")
plus **två tillägg**: marketplace-entryns föråldrade `plugins[0].description`
(samma dubbel-källa-form som Del 7:s manifest-par, utan belagd
"silently ignored"-egenskap) och **ägarlapps-släppets ordningsregel** ur förra
resumen — släpp lappen som ABSOLUT SISTA handling efter all git-aktivitet,
eftersom varje git-skrivning återtar den, och verifiera alltid mot filens
frånvaro, aldrig mot exitkoden.
**DEL 9 — HELA CARRY-BLOCKET AVBETAT.** Sex PR:er landade (`#738` flipp ·
`#739` **L456–L460** · `#740` **ADR-095** · `#741` **task-139** · `#742`
research · `#632`/`#633`/`#634` dependabot-trion), plus hub `76d47b7` och
uppströmsrapporten **postad** till `anthropics/claude-code#72714` (öppen sedan
2026-07-01 med noll kommentarer — vår 22-worktrees-per-dag-mätning är första
oberoende bekräftelsen). **ADR-095:** Marcus öppnade för Supabase-migrering av
hela dokumentationssubstratet; nio granskade system sade nej, starkast
**Backstage självt** som kallar sin egen databas en *ingest-cache*. Sju beslut,
paraply-form; öppet eskalerat är den semantiska frågan vad som RÄKNAS som barn.
**DEPENDABOT:** `#635` fick `recreate` i stället för armering — den pinnar
6.0.0 medan 6.0.1 rättar exakt den kastväg (`PerformanceObserver` utan optional
chaining, ny i v6) som gör bumpen riskabel; karensen på sju dagar släppte
igenom fel version med 6 h marginal. **MARKETPLACE-DOMEN REVS AV SIN EGEN
UPPFÖLJNING:** hub-agentens villkorade mandat tog **stopp-vägen** — Discover
läser `entry.description` UTAN fallback (noll träffar på `entry.description??`
i bundlen), så borttag hade tystat beskrivningen före install-beslutet. Värre
följdfynd: **`7d4bf51` var inte neutralt** — samma vyer renderar `entry.version`,
så Del 7:s borttag rev versionsraden ur Discover. Åtgärd: fjärde vägen —
version återställd (validatorns cross-check vaktar den igen), description
ersatt med kort stabil bläddringstext som inte kan drifta. **EGNA FEL:**
ADR-räkningen missad (`#740` rött, ADR-039-grinden bor i Lint-jobbet, ej
check:docs) · ett "för/efter-experiment" på `core.hooksPath` som inte var ett
(värdet redan läkt — vilken worktree som helst läker den DELADE configen).
**NÄSTA: `T123`** (backlog.md-bumpens två efterslängar) · S96-resume (Grind 0
DNS + `T95`) · S93-resume (appen). Numrering: **096/L461/T124/task-140/f47**;
`vol-06` måste roteras FÖRE nästa hub-lyft.
— **HOOK-SKULDEN BETALD, OCH `ask` RIVET SOM BESLUTSVÄRDE.** Resumen mötte en
ägarlapp från en **död session** (noll processer, ingen transcript-fil, tom
scratchpad — stale efter ~3 sekunder mot tröskelns 12 timmar) och betalade
skulden **prompt-fritt** via stdin-injektion: 18/18 + 23/23, båda sidor. Marcus
fick ändå **fyra prompts på en timme**, en av dem falsk positiv på ett `grep`
som bara läste hookens källkod — och rev `ask`: *"Jag kan ju inte sitta och
'vaka' över massa frågor som kommer i varje terminalfönster."* **Regeln som
faller ut:** `ask` endast när Marcus är RÄTT BESLUTSFATTARE (irreversibelt,
utanför repot); kan maskinen avgöra saken — `deny`, med skälet till agenten.
Driftbilden avgjorde: tre parallella sessioner × subagenter gör `ask` till en
flaskhals som växer med precis det mekanismen skulle möjliggöra. **Tre PR:er:**
`#712` (`T120` registrerad) · `#714` (research-passet, som dömde TVÄRTOM och
bevaras oförändrat — dess premiss var falsifierad redan när det kördes) ·
`#713` (`ask` → `deny` + kommando-positions-krav + `pipefail`-undantag; 18 →
**23/23**, shellcheck 0 × 3). **ROTORSAK FUNNEN:** ägarlappen registrerar
identitet men aldrig livstid, och ingen kodväg någonstans tar bort den —
skrivvägen finns i tre varianter, frisläppningsvägen i noll. Lucka, inte
bortval (belagt: `T119`, `f5f8fdfb`, ADR-090 § Update nämner livscykeln med
noll ord). ADR-090 citerar Vim som förebild men kopierade fildelen och hoppade
över lösningen. **EGET FEL, fångat av Marcus:** ett godkänt `ask` är omöjligt
att skilja från "hooken fällde aldrig" — jag rapporterade en fällning som
släpp (`T110` klass A). **RÄTTELSE:** mailspärren kör `exit 2`, inte `ask` —
målet är **noll** prompts, inte "en kvar". Hook-ytan mätt: nio registreringar,
sex logiker; två kunde nå Marcus, efter `#713` en, efter pid-liveness noll.
**DEL 6 — ÅTTA PR:er, TRE MARCUS-FÅNGSTER, TVÅ EGNA FEL.** Landat: `#716`
(staging-preflight i pre-commit, mätt 1,2–1,7 s, villkorad) · `#717`+`#718`
(`T121` hooksPath) · `#719` (fyra lesson-fragment — den femte var redan `L235`,
CARRY-blockets "verifierat" var osant) · `#720` (**ägarlappens fyra verb**:
tas vid första git-skrivning · behålls medan processen lever · övertas endast
vid bevisad död ägare, med varning vid smutsigt träd · släpps vid `SessionEnd`
eller `--slapp`; 55/55 + 25/25, mutationstestat) · `#721`+`#722` (två agenter
som byggde INGENTING — stopp-grind, korrekt) · `#723` (självläkande
hooksPath-vakt + git-config-research). **MARCUS FÅNGSTER:** (1) `ask` rivet —
driftbilden, inte irritationen: N sessioner × M agenter köar på en människa ·
(2) referensfönstret — pausade fönster hålls öppna med avsikt · (3)
**toalettscenariot** — tidsbaserat övertagande hade skrivit i en levande
sessions arbetsträd; tid är inte en proxy för "ingen arbetar här", rivet och
bokfört i ADR-090 · (4) **heartbeat-triggern LÖST** — sessionens livscykel ÄR
triggern (`Monitor` + `--quiet`, noll LLM-anrop mot cron-vägens ~960
turer/natt); svaret stod i skriptets filhuvud rad 100, två agenter missade det.
**EGNA FEL:** `T121` stängd för tidigt (värdet drev tillbaka inom timmen —
vakten självläker nu, rotorsak ÖPPEN, research ute) · godkänt `ask` läst som
"fällde inte". **SKARP DRIFT gav lucka på 90 s:** monitorn falsklarmade på
medvetet parkerade dependabot-PR:er; fix ute. **SLUTPASSET:** hub-ändringen landad (`9c0e2a3`, plugin **1.28.0** installerad —
fyra session-skills bär nu `--slapp` + heartbeat-start/stopp) · `T121` STÄNGD
med belagd rotorsak: **Claude Codes egen worktree-kod** skriver om
`core.hooksPath` till absolut vid varje worktree-skapelse (tre publika issues +
verifierat i vår egen binär; vakten självläker, går ej att laga hos oss) ·
`T122` registrerad med research: **filer förblir sanningskälla, INGEN Supabase**
— Backstage kallar själv sin databas ingest-cache · **isolerings-mätningen
gjord:** 22 worktree-skapelser på en dag, 9 undvikbara — `research-pass`-defaulten
var fel (fixad i `#729`), `bygg-agent`-defaulten var RÄTT (12/12 motiverade) ·
heartbeat-monitorn i drift och tyst för parkerade dependabot-PR:er ·
worktree-städning 6 borttagna, grenar 194→**182**. **FJORTON PR:er landade.**
**DEL 8: EN REGEL SOM STOD FEL I TRE VECKOR — OCH SKULDEN DEN ORSAKADE.**
Marcus fråga (*"det är ju bara bygg-agent och research-pass som inte kan jobba
cross-repo eller?"*) rev `CLAUDE.md`s cross-repo-regel. **Mätningen** gällde en
*worktree-isolerad* agent; **slutsatsen** sade *agenttyp*. Fyra celler mätta:
spärren gäller **eget repos huvudkatalog via Bash-git** (även ren LÄSNING),
medan Read-verktyget mot samma katalog **går igenom** och främmande repon är
helt fria — isolerad agent **committade** i ett främmande repo (`c3a9eb5`,
oavsiktligt bevis). Harnessets ord är `shared checkout`, inte "annat repo";
förstaparten: *"A command too complex to check also fails"* — trolig verklig
orsak till S97:s avvisning. **`T06` BETALD** (`8683c69`, `K17.1`–`K20.6`, 20
poster verbatim): skulden och felläsningen var SAMMA SAK — hub-skillen påstod
att `L103`–`L119` "saknas", men de finns i en **femte** markörform
(punktlista); skillens mönster fångade **0 av 14**. 426+17=443, högsta `L443`
— serien kontinuerlig, inget hål. **Fragment TÖMDA** → `L444`–`L455`.
**Research `T119`(d):** bygg ingen ny mekanismklass — `ADR-073` ÄR
branschmönstret (Cursor rev sina agent-lås); disk-verifierat gap: inget skript
kör claims-checken eller `merge-tree`-grinden. **Alla tre agenter fångade fel i
mina egna uppdrag** (ADR-086 fungerar). **VÄNTAR PÅ MARCUS — allt är BESLUT,
ej arbete:** `T122`-ADR · mekaniserings-kort `T119`(d) · dependabot `#632`–`#635`
· `package-lock.json.pre-t118` · uppströmsrapport `#72714`. **NÄSTA HUB-LYFT
MÅSTE ROTERA** (`vol-05` 3 060 rader > 3 000). Numrering: S97/ADR-095/**L456**
(0 fragment)/T123/task-139/f47.

**DEL 7 (resume): BÅDA BEVIS-SKULDERNA BETALDA + MANIFEST-PARET ROTORSAKS-FIXAT.**
Plugin-distributionen bevisad av LÄS-fasen själv (install-record **1.28.1**,
skillsen laddade ur den katalogen — starkare än skuldens 1.28.0).
`SessionEnd`-hooken bevisad skarpt via headless `claude -p`: lappen TAGEN
(`cc35e94b…`, pid 70156) → efter processens slut BORTA. **Ordningen avgjorde** —
hade tillstånds-återställningen körts först hade denna session ägt lappen och
beviset sett grönt ut oprövat. Manifest-paret: **två** `1.12.0`, inte en —
`metadata.version` är marketplace-manifestets egen axel (ORÖRD, handoffens
hypotes höll), `plugins[0].version` **borttagen** (hub `7d4bf51`) eftersom
`plugin.json` alltid vinner *"without warning"* (förstapartskällan + validatorn
*"silently ignored"*). Validatorns eget råd "update to match" valdes bort öppet:
symptomfix som återskapar driften vid nästa bump. **NÄSTA: `T06`-hub-lyftet
(`L103`–`L125`) + numrering av de åtta fragmenten → kodfils-partitionering
(`T119` (d) item 3).**
**VÄNTAR PÅ MARCUS:** relationsmodellens ordning + ADR-mintning (`T122`) ·
dependabot-kvartetten · `package-lock.json.pre-t118` · uppströmsrapport till
`anthropics/claude-code#72714`. Numrering:
S97/ADR-095/L444(+**8** fragment)/**T123**/task-139/f47. Full narrativ:
sessionsdok S97 Del 1–6 + PAUSLÄGE.
*(Föregående kadensrad nedan.)*

<!-- Föregående kadensrad, bevarad: -->

**Session 97 ⏸️ PAUSAD (2026-08-04, andra pausen — `lifecycle: paused`)**
— **MEKANISERINGS-PROGRAMMET: FYRA MEKANISMER I DRIFT, FYRA LÖSA ÄNDAR
STÄNGDA.** Sessionen tog `T119` (a), (b) och (d) item 5 och landade **sex
PR:er**: `#705` (resume-flipp + MCP-skarpbeviset — Del 2:s hypotes bekräftad,
87 Resend-verktyg mot pausens två, tre av fyra sänd-namn verbatim-belagda,
ingen namn-glidning) · `#706`+`bcc25ea8` (**katalogägarskaps-hooken** —
ADR-090 beslut 2 som mekanism, ägarlapp i `--git-common-dir`, ADR-090 fick
Update) · `#707` (**sannings-avstämningarna** — pausade dok + obesvarade larm
som natt-lager i `alarm`:s needs) · `#709` (hook-laddningens gräns +
armeringsformen rättad ×4) · `#708` (**nattvaktens falsklarm** — grundorsaken
till `#469`) · `#710` (**L440 som mekanism**, i kön). CI:s shellcheck-scope
11 → **14** conf-filer. **Fyra tvåsidiga testsviter: 23/23 · 14/14 · 11/11 ·
18/18.** **Sex buggar självfångade före landning** (bl.a. `printf` utan
newline som fick hooken att släppa allt · `\b` finns inte i POSIX ERE ·
shallow-kravet fel formulerat · `set -u` mot tom array). **`#469` STÄNGD**
med regel (a) — falsklarm i fyra av sex röda nätter, grundorsaken fixad.
**Avvikelse 4 UTREDD MED NEGATIVT SVAR:** trådfärskheten kan inte mekaniseras
korrekt förrän barn-relationen själv är det — `T20`/`TASK-108` lämnade frågan
oavgjord, nu vet vi varför (T95 har noll taggar men är mest aktiv; tre
inkompatibla barn-former). **ÖPPEN SKULD:** två hookar är bevisade i logik men
inte via harnesset — hookar registrerade mitt i en session laddas aldrig där
(belagt mot förstaparten + issue #22679), betalas som resumens första
handling. **NÄSTA: resume S97 → betala hook-skulden → `T119` (d) item 4
(staging-preflight → pre-commit, billigast kvar) → (c) → item 3 → item 6-skörd
→ item 7 hub-lyft → `barn:`-fältet.** Numrering oförändrad:
S97/ADR-095/L444(+3 fragment)/T120/task-139. Full narrativ: sessionsdok S97
Del 1–4 + PAUSLÄGE. *(Föregående kadensrad nedan.)*

**Session 96 ⏸️ PAUSAD (2026-08-04, fjärde pausen — `lifecycle: paused`)**
— **HELA T118-SVANSEN EXEKVERAD OCH LANDAD; S97 RESERVERAD FÖR
MEKANISERINGS-PROGRAMMET.** Dagens facit: T118-fixen `#684` → kön tömd
(19 PR:er landade totalt under passet) → resume-flippen + Del 10 (`#689`)
→ prototyp-facit landat (`#690` base.css-fonden + `#691` VariantB/bilagor)
→ delegationsvågen: `TASK-129` (`#687`+`#692`) · `TASK-133` ADR-028-am
(`#693`) · `TASK-135` svep-kallstarten (`#694`) · `T119` mintad (`#695`)
· `TASK-134` fokusringen (`#696`) · `TASK-137` mail-låset (`#697`, 26/26
fail-closed) → slutbunten fyra kort Done + Del 10-am + `TASK-138`
(`#698`). Fem larmärenden stängda med instansierat verifikat.
**Installationer klara** (Resend-plugin/hostad MCP · gddy CLI+skill ·
Vercel MCP) — auth är Marcus-moment i S97:s start. **NÄSTA: S97
(mekaniserings-programmet, T119: skarpbevis + hookdesigner) → därefter
S96-resume (Grind 0 DNS + T95) och S93 parallellt.** Numrering:
S97/ADR-095/L444(+2)/T120/task-139/f47. Full narrativ: sessionsdok S96
Del 10 + Del 10-am + PAUSLÄGE. *(Föregående kadensrad nedan.)*

**Session 96 ▶️ ÅTERUPPTAGEN (2026-08-04, tredje resumen — `lifecycle:
active`)** — **T118 LÖST FORSKNINGSGRUNDAT, KÖN TÖMD, BESLUTSBORDET
EXEKVERAS.** Research `#682` VERIFIERADE riktad overrides-bump och
FALSIFIERADE både full lockfile-regenerering för klassen (ADR-028 beslut 2
är malware-regeln; sex riktade incidenter i git-historiken) och `npm audit
fix` (rör aldrig befintliga overrides — hade lämnat brace-expansion tyst
olöst) → **fix `#684`** (main `c227593f`, alla grindar + test:api 450/450,
ADR-028-avvikelsen öppet bokförd) → åtta PR:er omarmerade, `#680`:s
Vale-fälla enordsrättad, `#677` stängd/utbruten (`#688`). **Marcus-GO över
hela beslutsbordet:** FACIT LÅST (bilagor `72d169cc`) · `T117` → `TASK-134`
· `TASK-129` väg A utförd (`#687`, + `TASK-136` utbruten) · installations-GO
(mekaniskt mail-lås FÖRE Resend — Rogers krav) · mekaniserings-GO
(tre-lagers-doktrinen, `#683` + intern inventering; tråd → `T119`).
Larmhygien: `#616`/`#619`/`#636`/`#656` stängda med instansierat verifikat
(T110-A-fällan undveks — de "gröna" hade aldrig instansierat staging-jobbet)
· `TASK-132`-bocken rättad (`#685`) · kortstängningar `126.4`/`127.4`/
`127.5` Done (`#686`) · `TASK-133`/`134`/`135` mintade (svep-defekten:
avancemang-raden skrevs aldrig — Marcus fångade `#684`:s landning, inte
vakten). **NÄSTA: delegationsvåg 133/134/135 · TASK-129-stängning efter
`#687`-grönt · prototyplandning (deltat re-deriveras efter `#678`) ·
`T119`-tråden · installationsfasen · `#681` efter grön natt.** Numrering:
T119/task-137/ADR-095/L444(+2 fragment)/f47. Full narrativ: sessionsdok S96
Del 10. *(Föregående kadensrad nedan.)*

**Session 96 ⏸️ PAUSAD (2026-08-03 kväll, tredje pausen — `lifecycle:
paused`)** — **PROTOTYP-PASSET: SJUTTON VARV OCH TRE RESEARCH-PASS.**
Marcus dom vid start: *"byggdes så dåligt och slarvigt så det liknar inget.
Väldigt besviken."* Passet rev i tur och ordning varianterna A/C ·
prototyp-headern (vy-axeln in i railen som generisk tredje axel) ·
1200 px-ramen · fotot · punktlistan och bekräfta-lösenord-fältet
(research-grundat) · tvåspalts-skalet · logotypen i tre former.
**Textmängden 95 → 47 ord** (branschsnitt ~17). **RESEARCH:** aktiverings-
sidors branschmönster (`#676`) gav den mätbara kärnan i "KAOS" och det
strukturella svaret på H1/H2 · scrollbar-gutter-fonden (`#677`) landade i
ett belagt **NEJ** — Chromium målar aldrig `background-image` i gutter-ytan
(spec-gap `w3c/csswg-drafts#8099`), löst med kamouflage-lager i exakt
sRGB-mitten · fokusring vid musklick (`#679`) svarade **JA och bredare än
auth**. **`T117` + `T118` mintade.** Fyndet i `T117`: **React Aria äger
appens fokusbeteende**, inte `base.css`. **⚠️ `T118`: MERGE-KÖN ÄR
BLOCKERAD** — tre nya high-advisories fäller `audit-ci` på orört `main`
(publicerade 17:01→17:18 under passet). Sex PR:er står armerade och köar;
strategivalet är Marcus per ADR-028. **Numrering: S96 behålls/ADR-095/L444
(+2 fragment)/T119/task-133/f47.** **NÄSTA: Marcus väljer säkerhetsstrategi
(`T118`) → kön töms av sig själv → Marcus låser facit → prototypkoden landar
i två PR:er (`base.css` för sig) → byggkrav till `TASK-127.3`/`127.6`.**
Full narrativ: sessionsdok S96 Del 9 + PAUSLÄGE. *(Föregående kadensrad
nedan.)*

**Session 96 ▶️ ÅTERUPPTAGEN (2026-08-03 kväll, andra resumen —
`lifecycle: active`)** — **PROCESSFELET BAKOM KONVERGENS-TEMPOT UTRETT OCH
ÅTGÄRDAT FÖRE något prototyparbete.** Marcus fråga öppnade passet: var det
orkestrerar-fel eller processfel att iterationerna tog 10–30 min per varv?
**Båda, i orsaksordning.** (1) Konvergens-varv delegerades till bygg-agenter
trots skillens *"Iterera med Marcus i webbläsaren"* — en interaktiv loop är
inget självständigt uppdrag. (2) **Processhålet, det djupare:** skillen
beskrev VAD men inget om KADENS, och hålet fylldes med default-maskineriet;
även efter formbytet kördes ändringen genom PR + kö (`#670`) utan skäl.
**Rotorsakskedjan:** agentens isolerade worktree är enda vägen för ändringen
att nå Marcus dev-server — delegeringsvalet SKAPADE kö-kostnaden. **Mätt:**
`#664` 15 min i kön · `#666` 20 min · noll varv behövde landa.
**`T116` registrerad + åtgärdad:** kadensen kodifierad i plugin **1.27.0**
(hub `450c628`, hub-PR `#16`) som `SKILL.md` § Standard-formen **punkt 5** —
varvet körs av aktören som sitter med Marcus i dev-serverns worktree · lokal
commit per varv · push + PR EN gång när han är nöjd · skarven mot divergens
hålls skarp. Plugin uppdaterat i samma landning. **Dev-servern uppe på 5174**
ur `proto/s96-konvergens-varv2` (grundad på `main`, alltså MED `#670`) —
Marcus har sett prototyp B. **Tre egna fel bokförda:** huvudkatalogen rörd
tre gånger trots S93:s ägarskap · `mergeStateStatus` läst som fakta på en
redan mergad PR · **resumens steg 6 hoppades över** (sessionen stod `paused`
medan tre PR:er landade) — `check-lifecycle.sh` var grön hela tiden eftersom
den prövar konsistens, inte sanning; **fångad av Marcus, inte av grinden**.
**Numrering: S96 behålls/ADR-095/L444 (+2 fragment)/T117/task-133/f47.**
**NÄSTA: fotnots-texten *"Frågor? Marcus står till ditt förfogande 24/7"*
saknar hemvist — Marcus besked · sedan konvergensvarvet klart ENLIGT NYA
KADENSEN · `TASK-126.2` plockbart parallellt utan Grind 0.** Full narrativ:
sessionsdok S96 Del 8. *(Föregående kadensrad nedan.)*

**Session 93 ⏸️ PAUSAD (2026-08-03 — konvergens-prototypen handövad,
Marcus itererar)** — APPEN ÅTERUPPTAGEN: hållplats-spåret från research till
färdig konvergens-prototyp på EN dag + Roger & Lottas nya produktkrav
(bilagor/utskick) grillat till samsyn 8/8. Levererat: prototyp-kedjan
PR #603→#613→#639→#660→#667 (divergens a/b/c → kvalitetsfix → natt-rött-fixar →
byggkrav + betalningsSplit-PRODUKTIONSBUGGFIX → konvergens: ett block,
steg-räknare, EN lista, integrerad arbetsyta, B/C rivna) · grillningen Del 3
(8/8: utskick/avprickning-snittet · raduppsättningen · registret ·
ENHETLIGA server-utskick · åtgärds-sidans v1 · delad bilage-hemvist ·
dokumentklasserna A/B/C · 3 PRD-kort) · research #661 (KRITISKT: Resend
batch tar EJ bilagor, tyst ⇒ grenad sändväg) · ORDLISTA +4 termer ·
seed-eventet reco44UBx6GXcxwu5 (livstid 2026-08-16) · dev-server 5173
omstartad. Kvitterat: variant A vald · kvittoserien egen räknare ·
tre-veckor (−21). **NÄSTA (resume): Marcus iterations-feedback →
iterationsvågor → facit → /to-prd × 3 · åtgärds-sidans divergens-pass ·
Roger-avstämning kvitto-gränsen.** Numrering: ALLT re-deriveras mot disk
(S95/S96 mintar parallellt). Full handoff: sessionsdok S93 § PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 96 ⏸️ PAUSAD IGEN (2026-08-03 kväll, `lifecycle: paused` — andra
pausen samma dag; återupptas via `session-resume` med BEHÅLLET nummer)** —
**RESUMEN LANDADE T95-VÅGEN OCH INLEDDE PROTOTYP-KONVERGENSEN.** Fjorton PR:er:
`TASK-132` (deadlocken bruten, spår-grindarna av 15 barnkort) · `TASK-128`
(heartbeat-larmets falskpositiv, `isInMergeQueue`) · `TASK-131` (egen
testklass för datalöst webbläsarbeteende + **`ADR-094`**, `#628` stängd utan
kodförlust) · `TASK-127.4` (auth-mallarna + Grind 0-checklistan) ·
`TASK-127.5` (invite-EF:en) · `TASK-126.4` (skärmbilderna) · `TASK-130`-beslutet
(Pure+Build som stående hemvist) · **`ADR-092`-amendering: rollen låses i
`app_metadata`, ALDRIG `user_metadata`** — fångat av en agents premiss-pass,
verifierat mot Supabases egen linter som klassar det som SECURITY ERROR ·
`ADR-091`-domännot · scroll-byggkravet · tre prototyp-varianter + skarven.
**Prototypen: divergens klar, Marcus valde variant B för båda skärmarna**,
konvergensen tre omgångar in. **Formbyte mitt i:** konvergens görs nu DIREKT i
prototypkoden — agent-varv tog 10–30 min för tio sekunders arbete, och Marcus
underkände tempot. **Fyra egna fel bokförda** (två källmärkningsfel i
uppdragstexter, `autoMergeRequest`-läsning utan disambiguering, delade ytor
bara för kortfiler → två merge-konflikter). **Numrering: S96
behålls/ADR-095/L444 (+2 fragment)/T116/task-133/f47.** **NÄSTA: avsluta
konvergensvarvet (fotnots-texten saknar hemvist) · Grind 0 (Vercel + DNS) kan
köras PARALLELLT · `TASK-126.2` är plockbart NU utan Grind 0.** Full narrativ:
sessionsdok S96 Del 1–7 + PAUSLÄGE-blocket. *(Föregående kadensrad nedan.)*

**Session 96 🔄 ÅTERUPPTOGS (2026-08-03 förmiddag)** —
**AFK-BATCHEN + MORGONENS GENOMGÅNG** (egen worktree per ADR-090, parallell med
aktiva S93 som äger huvudkatalogen): `TASK-119` **Done** (heartbeat-svepet
mekaniserat, config-driven, 22 tvåsidiga testfall — i skarp drift samma natt och
bar alla fyra vägar) · `TASK-126.1` + `TASK-127.1` **granskningsfärdiga**
(manifest-kompletteringen med egen mekanisk grind; `ADR-092` + `ADR-093` mintade,
SECURITY-SPEC:s passkey-plan öppet riven) · `TASK-126.2` **byggd men stoppad** —
`hermetik-sjalvtest.mjs` fällde 11 datalösa tester i acceptance-klassen (164
passerade, vakten fällde), PR `#628` röd + dirty. **Marcus batch-order lyfte
halt-first-filten för natten** (ADR-053:s triage gällde inuti batchen), med rutan
*blockerar + utanför scope* undantagen — den utlöstes exakt en gång, av `126.2`.
**SEX FYND registrerade + klassade:** `TASK-128` (heartbeat-larmets falskpositiv,
åtta mätta instanser, `isInMergeQueue` verifierad som fix) · `129` (ADR-091:s
CSP-rivning täcker 15 rader men ytan är 27 förekomster) · `130` (preview-skarven
anropas aldrig av CI) · `131` (**beslut A taget** — egen klass för datalösa
webbläsartester; arbetet kvar) · `132` (**DEADLOCK:** `/to-issues` stämplade
spårets DoD på varje barn; `127.1` Done kräver `127.9` → `127.5` → `127.1` Done)
· tråd `T114` (landningsvakten blind för post-merge-rött). **TVÅ EGNA FEL
BOKFÖRDA:** taket sades vara sju kort när DoD-strukturen bara tillät tre, och
post-merge-röda klassades som "transienta" ur körningar som aldrig instansierade
staging-jobbet (rättad i `T114`). Staging-regressionen överlämnad till S93 som
hypotes → **de fixade den** (`ca350397`, post-merge grön 10:48Z); larm-ärendena
`#616`/`#619`/`#636` står dock kvar öppna. 22 PR:er landade, samtliga
merge_group-verifierade. Worktree-städning: 3 agent-träd bort, grenar 93→87.
**RESUMEN (Del 6): `TASK-132` LÖST — deadlocken bruten.** Spår-grindarna
borttagna från 15 barnkort (PRD-korten bar dem redan — ingreppet blev en
borttagning, ingen flytt); fyra genuina skiv-grindar behållna (Gunilla på
`126.3` · enhetsverifikatet på `126.5` · skarp-inbjudan-spärren på `127.10`).
`127.1` + `126.1` **Done** → `127.4`, `127.5`, `126.4` plockbara. **Kortets
räkning rättad: TRE kort låses upp, inte fyra** (`126.3` hänger på `TASK-131`).
**Rotorsaken var inte stämplingen** — den är designat beteende och bar tio
tidigare PRD-familjer (`task-1/4/8/9/17/18/19/36/54/59`, alla med identiska
extra-DoD på barnen). Skillnaden är grindarnas GRAMMATIK: tidigare grindar är
predikat över skivans eget arbete, T95:s refererar systerskivors leverabler
(`#6` ÄR `127.9` = cykeln) och händelser utanför repot (Grind 0, DMARC).
**Tråd `T115` registrerad** med åtgärdsriktningen (regel om vad en spår-grind
får referera — INTE "sluta stämpla"). **Numrering: S96 behålls/ADR-094/L444
(+1 nummerlöst fragment)/T116/task-133/f47 (hypotes).** **NÄSTA:
`TASK-131`:s klassbygge (löser ut `#628`) · `TASK-127.4`/`127.5`/`126.4`
plockbara · Grind 0 (Vercel + DNS) parallellt · `TASK-127.2` prototyp-passet ·
`TASK-129`/`130` väntar beslut · `#616`/`#619`/`#636` fortfarande öppna (S93:s
yta) · fyra dependabot-PR:er `#632`–`#635` oarmerade.** Full narrativ:
sessionsdok S96 Del 1–6. *(Föregående fokus-text nedan.)*

**Session 95 ✅ AVSLUTAD (2026-08-02, `lifecycle: closed` på Marcus
coverage-kvittens "Jag kvitterar!" — post 3 inget-att-säkra i samma
kvittens, S91/S94-prejudikatformen)** — **T95 ROGER & LOTTA-SPÅRET:
PARKERAD TRÅD → EXEKVERBAR SPEC** (endagssession, egen worktree per ADR-090, parallell med
S93): grillning 9/9 Marcus-kvitterad (deploy framdragen ur Fas 7 öppet ·
Vercel Pro · `admin.`/`send.miranon.dev` · DMARC `p=reject` · invite-EF ·
lösenord+passkey-erbjudande · TTL 24 h [7-dagars-idén plattforms-falsifierad]
· login i Spår B · "riktig app"=B2) → research R1+R2 (Sonnet@xhigh;
**CSP-nonce-mönstret empiriskt falsifierat** → hash/self · ingen wrapper —
Add to Dock Gatekeeper-fri, brytpunkt→Tauri) → **PRD `TASK-126`+`TASK-127` +
15 skivor** (tre startkedjor: 126.1+126.2 ∥ 127.1 ∥ 127.2; prototyp+QA
ready-for-human) → **ADR-091** (hosting; nummer disk-verifierat) →
bokföringen (byggplan-avvikelsen · T44 AVGJORD · T46 Grind 0-paketet 7 p ·
T47-aktivering · T95 `active` · ordlist-post *Användarinbjudan*). PR
Samtliga tio PR:er `#601`–`#610` MERGED git-verifierade (`#609` gick RÖD på
ADR-count-grinden [rot-README-raden 90→91 missad], Marcus fångade externt —
den state-pollande vakten var blind för rött → **SKÖRD L443 [UNIVERSAL]**:
vakta utfallsklasser grönt/rött/timeout, aldrig tillståndsbyte; **Marcus
mekaniserings-order** → `TASK-119` priority high FÖRST i S96-batchen).
Worktree-städning: R1/R2-agentträden bort (2). **Numrering efter S95:
96/ADR-092/L444/T114/f47 (hypotes)/task-128.** **NÄSTA (Marcus-kvitterat
vägval): NY session S96 via session-start → work-batch: `TASK-119`
(trevägs-heartbeaten, Marcus-order) FÖRST + de 7 T95-korten
(126.1+126.2+127.1 → 126.3/126.4/127.4/127.5); prototyp-passet `TASK-127.2`
är Spår B:s grind (HITL, körs bredvid batchen); Grind 0-panelen:
Vercel-konto + DNS-trion när som helst, SMTP/OTP EFTER `127.4`
(panel-checklistan) · hub-lyftet L433–L443 vid hub-sync-moment ·
Marcus-moment: Update-klicket i claude.ai.** Full narrativ: sessionsdok S95
Del 1–4 + BUILD-LOG S95-post. *(Föregående fokus-text nedan.)*

**Session 94 ✅ AVSLUTAD (2026-08-02, `lifecycle: closed` på Marcus
coverage-kvittens "Inget att säkra, kvitterar coverage" — post 3
inget-att-säkra i samma kvittens)** — **ORKESTRERINGS-UTREDNINGEN
→ TIER-POLICY I DRIFT** (endagssession, egen worktree, parallell med S93):
research ×3 + T113:s FÖRSTA Sonnet-datapunkt (16 uppdrag/88 påståenden/4
hårda fel 4,60 % — inom pre-Sonnet-bandet; 14/16 spawns bevisade på
`claude-sonnet-5`) → underlag → grillning 7/7 (tyst auto-isolering FÄLLD på
research-belägg → detektera+fråga) → **ADR-089** (Haiku hittar · Sonnet
utför · Opus avgör/felsöker · Fable orkestrerar; effort explicit i
frontmatter; eskalering 2× fälld → Opus-default, fable-regeln 2026-08-01
öppet riven; routing-regeln "adress→Haiku, omdöme→minst Sonnet, tvekan
uppåt") + **ADR-090** (sessions-parallellitet: detektera+fråga i
sessionsstartens kvittens-utbyte; ovillkorad worktree öppet bokförd som
framtida väg) + **hub-PR #15/plugin 1.26.0 INSTALLERAD** (orkestrerar-rollen
i output-stylen + start/resume-skillsen + SYSTEMET §4 — Marcus behöver
aldrig mer säga "du är orkestrerare") + `TASK-125` (mät Sonnet@high mot
@xhigh; nivåbyte endast på data). Spoke-PR #587–#596 + hub #15, samtliga
merge_group-verifierade. **SKÖRD L441–L442** [UNIVERSAL ×2] (regel utan
bärare på egen yta · fjärr-ref-diff i worktrees). Trådar: T67 verkställd
(`paused`) · T113 eskalationsregel riven · T111 fråga 3 stängd.
Worktree-städning: 5 agent-träd + 7 landade grenar bort. **Numrering efter
S94: 95/ADR-091/L443/T114/f47 (hypotes)/task-126.** **NÄSTA: appen i S93
(parallell) · task-125 plockbar · hub-lyftet L433–L442 vid hub-sync-moment ·
Marcus-moment: Update-klicket i claude.ai.** *(Föregående fokus-text nedan.)*

**Session 91 ✅ AVSLUTAD (2026-08-02, `lifecycle: closed` på Marcus
coverage-kvittens "Kvitterar" — post 3 inget-att-säkra i samma kvittens,
S74-precedentens form)** — S91: 22 pauser/23 resumer, Del 1–42, restlistans
spår A–E genomarbetade. Sista dagen: beslutsbordet 8/8 (varav TVÅ punkter
visade sig redan beslutade — L437-klassen) · `TASK-79` vägval c på natt-datan
(20/20 lokalt, CI n=65) · exekveringsresterna (A2:9/A3b → CONTRIBUTING ·
PreToolUse-rättelsen hub-PR #14) · **SKÖRD L433–L440** (hub-lyft väntar
hub-sync) · BUILD-LOG S91-post · `task-120`–`124` mintade · trådlägen satta
(T108/T113 `paused` m. skäl+trigger) · worktree-städning (2 bort, grenar
55→51). Kort Done i dag: 79/111/122 (+99/110/115/117 under vågen).
Leverans-facit per spår: `tasks/s91-restlistan.md` § Avbockningslogg; full
narrativ: sessionsdok Del 1–42. **Numrering efter S91:
93/ADR-089/L441/T114/f47 (hypotes)/task-125.** **NÄSTA (NY session S93 via
session-start): APPEN — TASK-18.20:s fyra beslut + hållplats-grillningen +
fem facit-lösa ytor · S92 (färgsystemet) pausad parallell · hub-lyftet
L433–L440 vid hub-sync-moment · task-120 väntar Marcus GO (go-live) ·
Marcus-moment: Update-klicket i claude.ai.** *(Föregående fokus-text nedan.)*

**Session 91 🔚 SESSION-END UTFÖRD (2026-08-02) — VÄNTAR MARCUS
COVERAGE-KVITTENS** — Beslutsbordet exekverat 8/8 (Del 42.2; punkt 4 + 5-
destillatet visade sig REDAN beslutade — L437-klassen, stale rader brutna) ·
natt-facit: `TASK-79` Done vägval c, nya former → `task-121` ·
exekveringsresterna körda (A2:9 → CONTRIBUTING + `TASK-122` Done · A3b →
CONTRIBUTING · PreToolUse-rättelsen hub-PR #14 MERGED) · **L433–L440
konsoliderade** (5 fragment + 3 kandidater; hub-lyft väntar hub-sync) ·
BUILD-LOG S91-post · trådlägen satta (T108/T113 `paused` m. skäl+trigger;
T100/103/107/109 var redan `closed`) · `task-120`–`124` mintade ·
worktree-städning (2 bort, grenar 55→51) · kort Done i dag:
79/111/122 (+99/110/115/117 tidigare). Numrering efter S91:
**93**/ADR-089/L441/T114/f47 (hypotes)/task-125. **NÄSTA: Marcus
coverage-kvittens → `lifecycle: closed` (stängnings-commit) → appen öppnar i
NY session S93 via session-start (TASK-18.20:s fyra beslut +
hållplats-grillningen); S92 (färgsystemet) pausad parallell. Marcus-moment:
Update-klicket i claude.ai.** Full narrativ: sessionsdok Del 42.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-08-02, tjugotredje resumen — tillstånd
återställt, natt-utfallet svept, beslutsbordet står)** — Resume på Marcus
order. Svepet FÖRST per paus-blocket: **#576/#577/#578 alla MERGED med
merge_group-verifikat per jobb** · **inga öppna PR:er, inget rött/DIRTY** ·
natt-agentens leverans landad som PR #578 (rapport + rådata,
`docs/research/task-79-flake-baslinje-2026-08-02.md`). Natt-utfallet:
identitetsbeviset **20/20 PASSED lokalt** (0 fällningar, n=20) · CI-basen
n=65, 1 fällning (~1,5 %) · loadavg-kravet <2 EJ uppfyllt (start ≈4,0,
öppet bokfört, Backblaze-fullsynk rotorsakad) · **TVÅ NYA oväntade
fällningar i samma testfil** (hem:437 dagar-kvar-pillen + hem:398
refetchInterval — femte/sjätte flake-form-kandidater, registrerade för
ADR-053-triage, EJ diagnostiserade) · vägvalet EJ föregripet. Numrering
re-verifierad mot disk: 91/ADR-089/L433 (4 fragment)/T114/task-120/f47
(hypotes). Tillstånds-återställningen = resumens enda dok-skrivning
(`lifecycle: paused → active`, PAUSLÄGE-rubriken bruten till
Paushistorik-form). **NÄSTA: beslutsbordet (8 punkter, Paushistorikens
MARCUS-SEKVENS, i ordning) → exekveringsresterna (A2:9 · A3b ·
PreToolUse-klassningen) → DoD-avstämning (41.2) → session-end → appen i
S93.** *(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-08-02, tjugoandra pausen — planerad,
beslutsbordet dukat, natt-mätning igång)** — Vågen landad: 18 spoke-PR:er
(#560–575 + dependabot ×3) + #576 i kön + hub-PR #13 (SYSTEMET §0).
Kort Done: 99/110/115/117 · 111 väntar enbart prod-deploy (Marcus GO) ·
79 karaktäriserad, mätserie kör i natt (ensam maskin, caffeinate) ·
118/119 mintade. G0-retryn i drift (#569). Heartbeat → trevägs
(main/rött/DIRTY), mekanisering = TASK-119. Uppdragsrevision #2: 30/188/11,
båda körningarna pre-Sonnet — T113 väntar första Sonnet-datapunkten (denna
sessions transcript). **NÄSTA RESUME (förmodligen sista): svep natt-agentens
utfall FÖRST → beslutsbordet (8 punkter, PAUSLÄGE § MARCUS-SEKVENS) →
exekveringsrester (A2:9/A3b/PreToolUse-klassning) → DoD-avstämning →
session-end → appen i S93.** Full narrativ: sessionsdok Del 41 + PAUSLÄGE
(tjugoandra). *(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-08-01, tjugoandra resumen — tillstånd
återställt, orkestrerad slutspurt mot appen)** — Resume på Marcus order:
orkestrera, delegera allt delegerbart. Numrering re-verifierad
(91/ADR-089/L433/T114/task-117; f47 ej mekaniskt avläsbar ur data-model.md —
hypotes tills minting). Divergens bekräftad: restlista-kroppen släpar efter
registret (TASK-88/56/93/95/97/113 Done). **Våg 1 (åtta agenter):**
restlista-pass + lesson-fragment · uppdragsrevision #2 · Stop-vakt-svit →
ci.yml · TASK-99 · TASK-110 · TASK-79 · DoD-rekonstruktion (read-only) ·
beslutsunderlag TASK-115/116/111 (read-only). Våg 2: dependabot #65→#162→#260 ·
hub §0 + plugin-bump · Marcus-beslut · Del 39-komplettering · DoD-avstämning →
session-end. Våg 3: appen (18.20:s fyra beslut · hållplats-grillningen · fem
ytor). Full narrativ: sessionsdok Del 41. *(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-08-01, tjugoförsta pausen — planerad, efter
Sonnet-omställningen)** — Fyra landningar denna period, alla
merge_group-verifierade per jobb: `#556` (resume-återställningen) · `#557`
(**`model: sonnet`** i bygg-agent + research-pass, Marcus GO — subagenterna
ärvde tidigare `claude-fable-5[1m]`+xhigh) · `#551` (Stop-vakten/ADR-087,
rebasen löste räknar-dedup-fällan → 88) · `#558` (stängningspaketet via
**första Sonnet-agenten**: TASK-113 Done · TASK-115 instans 6+7 · **T113
mintad** — mätuppföljningen; agentens premiss-pass fångade ett
orkestrerar-hash-fel = mätpunkt 1). Worktree-städning: 32 bort, 8 kvar.
Numrering: 91/ADR-089/L433/T114/f47/task-117. **NÄSTA (resume):
restlista-passet · uppdragsrevisionen · Stop-vaktens svit → ci.yml ·
dependabot #65→#162→#260 · TASK-99/79/110.** VÄNTAR PÅ MARCUS: TASK-111 ·
TASK-115 åtgärdsväg (SJU instanser, eskalerande) · TASK-116. Full narrativ:
sessionsdok Del 40 + PAUSLÄGE (tjugoförsta). *(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-08-01, tjugoförsta resumen — tillstånd
återställt)** — Tjugonde pausen (2026-08-01, current-session-limit vid 96 %,
kontext 41 %) lämnade fyra öppna luckor bokförda i Paushistoriken — denna
kadensrad betalar lucka 2 (todo-synken). Tillstånds-återställningen utförd
som resumens enda dok-skrivning: `lifecycle: paused → active`, tjugonde
pausens `PAUSLÄGE`-rubrik bruten till `Paushistorik`-form. Sedan pausen har
kön landat `#552`–`#555`: `origin/main` = `1ffcafde` (#555), ADR-088 inne,
lessons-konsolideringen inne (0 fragment). **#551 (TASK-113/ADR-087) står
kvar OPEN med den kända räknar-konflikten** — rebase till 88 + åter-armering
är Paushistorikens första kodåtgärd. Numrering re-verifierad mot disk:
91/ADR-089 (087 reserverad i #551, 088 landad)/L433 (0 fragment)/T113/f47/
task-117. **Aktuellt scope (Marcus-order vid resumen):
subagent-modellkonfigurationen** — `bygg-agent.md` + `research-pass.md`
saknar `model:`-fält och ärver huvudloopens `claude-fable-5[1m]` +
`effortLevel: xhigh`; analys + rekommendation levererad i chatten, väntar
Marcus-beslut. Övriga steg per Paushistorikens NÄSTA-lista (restlista-pass ·
uppdragsrevisionen · Stop-vaktens svit → ci.yml · dependabot #65→#162→#260 ·
TASK-99/79/110). *(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-31, tjugonde resumen — tillstånd
återställt)** — Tillstånds-återställningen utförd som resumens enda
dok-skrivning: `lifecycle: paused → active`, nittonde pausens
`PAUSLÄGE`-rubrik bruten till `Paushistorik`-form (grindens prefix-regex
kräver brottet, inte ett appendat tillägg). **Del 39 skrivs av orkestreraren
senare** — ingångsläge, PR-verifikat och numrerings-re-verifiering bor där.
Vid fortsättning gäller Paushistorikens ordning: **de tre ⛔
Marcus-frågorna** (`T87`:s trigger · `T100` steg 4 · hub-`lessons.md`-
uppdelningen `TASK-105`) besvaras före `T87`-beroende arbete · **fem kort i
luften** (`#504` `#505` `#506` `#511` `#514`) stängs först efter
`merge_group`-verifikat **per jobb** · **CI-wiringarna** (`TASK-102` `108`
`109`) tas i EN hand — `ci.yml` är fri. Numrering re-verifieras i Del 39;
fragment-talet är dock **mätt vid återställningen**: grinden räknar **72**
nummerlösa fragment mot Paushistorikens 70, och `lessons.md` är oförändrad
sedan pauscommiten — 70 var fel redan när det skrevs. Övriga axlar per
Paushistoriken: 91/085/L360/T112/f47/task-110. Full narrativ: sessionsdok
**Del 38** + Paushistorik.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-31, nittonde pausen — femtonvågen och två
betalda skulder)** — **NITTON PR:er i spoken + TVÅ i hubben.** **HUB-SKULDEN
BETALD:** `L284–L359` lyfta (72 poster, 22 sessions-H2:er, verbatim-verifierat)
— Spår C:s största uppskjutna post, öppen sedan 2026-07-27. Plugin **1.23.0 →
1.24.0**, reinstallerat i samma landning. **WORKTREE-SKULDEN BETALD:** 20
borttagna, grenar **69 → 32**; `TASK-94`:s mekanism kördes **skarpt för första
gången**. **ÅTTA KORT STÄNGDA** (`TASK-96` `97` `38` `53` `98` `100` `102`
`107`), **tio mintade** (`task-100`–`109`), **`ADR-084` mintad.**
**TRÅDREGISTRET KARTLAGT** på Marcus order — S91-eran är `T100`–`T109` (inte
`T90`–`T109` som orkestreraren gissade), **noll trådar stängbara**, `T87` är
navet. Registret självt rättat: sju falska statuspåståenden, och
lifecycle-grinden visade sig se **11,9 %** av registret medan den presenterades
som täckande. **STAGING STÄDAT** på utvidgat mandat (`Skovde-S75`, 10 poster, 0
kvar). **KÖN HÄNGDE SIG** — en `cancelled` kö-körning som GitHub aldrig startar
om; löst med `gh run rerun`, inte rulesetets nödväg. **ORKESTRERAREN GJORDE FEM
FEL, samtliga fångade av agenter och noll av Marcus:** en filadress som aldrig
funnits · `[UNIVERSAL]`-räkningen 59 mot 72 · "tre äkta fel" som var fem · "nio
grindar" i fel fil · trådregistrets grovmätning fel på två av tre.
**⛔ VÄNTAR PÅ MARCUS: (1)** `T87`:s trigger — tre trådar hänger på den;
**(2)** `T100` steg 4 (`IDENTITET.md`-destillatet); **(3)** hub-`lessons.md`
passerade 5000-radersgränsen (3744 → 5507) — uppdelningsformen är ditt beslut,
registrerat som `TASK-105`. **SKÖRD: 10 fragment.** Numrering:
91/**085**/L360 (**70** fragment)/T110/**f47**/**task-110**. Full narrativ:
sessionsdok **Del 38** + PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-31, artonde pausen — tvåvågen och fyra
research-pass)** — **NITTON PR:er landade, NOLL röda körningar.** Weekly limit
slog i **två gånger**; sju respektive fyra agenter återupptogs och **ingen
behövde börja om** — disken lästes före varje väckning. **FYRA KORT:** `TASK-85`
`93` `94` stängda, `95` väntar på `#493`. **TVÅ MINTADE:** `TASK-98` (HIGH) ·
`TASK-99`. **FYRA RESEARCH-PASS landade.** **TRE FYND STÖRRE ÄN SINA FRÅGOR:**
`npx backlog` kan **exekvera främmande kod** (paketet `backlog` ≠ `backlog.md`,
npx auto-installerar i CI) · § Revert-vägens exponeringsfönster är **dubbelt** så
långt som filen påstår (två CI-lopp, kod ~15 min mot dokumenterade ~8) ·
`Stop`-hooken **mätt** skarpt mot v2.1.220 och kan vägra ett turavslut.
**KLASSEN DÖK UPP I VÅRT EGET MASKINERI TVÅ GÅNGER:** en isolerings-spärr som
**upphör med det den skyddar** (`TASK-94`-agentens worktree auto-städades under
arbetet) · **fem subagent-rapporter blev hemlösa** när deras förälder dog.
**TRE GÅNGER STANNADE EN AGENT VID SCOPE-GRÄNSEN** i stället för att lösa
uppgiften snyggt. **⛔ VÄNTAR PÅ MARCUS: (1)** får `Event-796` städas — 10 poster,
godkännandet gällde ordagrant bara `task-88`; **(2)** når `TASK-95`:s beslut
ADR-baren (blir `ADR-084`)? **SKÖRD: 2 fragment** [UNIVERSAL ×2]. Numrering:
91/**084**/L360 (**60** fragment)/T110/**f47**/**task-100**. Full narrativ:
sessionsdok **Del 37** + PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-30, artonde resumen — vågen hemma)** — **SJU
BYGG-AGENTER, NIO PR:er, NOLL RÖDA KÖRNINGAR.** **Fyra kort stängda:** `TASK-86`
`87` `89` `92`. **`TASK-88` stannar ÖPPEN** — dess anvisade städkommando
**raderar noll poster**: `ZZ-GRANSKNING-S91` byggdes för hand och bär inte
skriptets markörer, alltså immun mot **både** purgen och sitt eget städkommando
(33 poster kvar). Agenten vägrade handradering via MCP och hade rätt.
**AGENTERNAS FYND:** `TASK-52`:s diagnos **falsifierad i motsatt riktning**
(arrayen uppstår vid FÖRSTA motiveringen → **fälla 46**) · `-o`-premissen **mätt**
(382 byte OK mot 764 byte FAILED med curl-exit 0) · stängnings-grinden fäller på
**varje kort en agent just fullföljt**. **TRE FEL ORKESTRERAREN GJORDE SJÄLV,
samtliga självfångade:** ett påhittat SHA gjorde en vakt **fail-open** · en regel
skriven ur två observationer som mätte fel sak, motbevisad av PR:en som bar den ·
en **nummerkollision** orsakad av uppskjuten bokföring (omnumrerat via CLI:t →
`TASK-97`). **WORKTREE-SKULDEN STÄDAD** (16 borttagna, grenar 32 → 5) och
**`bygg-agent.md`-motiveringen rättad** på Marcus delegering. **SKÖRD: 3
fragment** [UNIVERSAL ×3]. Numrering: 91/084/L360 (**58** fragment)/T110/**f47**/
**task-98**. **NÄSTA: `TASK-90` landar · våg 2 = `85` + `93` · `79` på tyst
maskin.** Full narrativ: sessionsdok **Del 34–35**.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-30, artonde resumen — vågen ute)** —
Ingångsläget rent: HEAD `b8ca291`, `#471` landad `17:34:21Z`, tre körningar
`success`, `audit-ci` grön (752 deps), registret **169** kort (123 Done / 46
To Do / **0 In Progress**), restlistan **34** obockade — samtliga tal exakt
`PAUSLÄGE`:s. Numreringen oförändrad på alla sex axlar. **FILYTAS-KONTROLLEN
KÖRD** — den lucka Del 31 lämnade öppen — och gav **två fynd**: `TASK-88` bär en
**Marcus-STOPP i AC #1**, vilket **falsifierar Del 31:s påstående** att
`TASK-70.7` var det enda sådana kortet · `87` och `88` delar
`.purge-staging-policy.json`, som partitionen klassat som semafor-hanterad
(semaforen serialiserar körningar, inte fil-redigeringar). Marcus svar på
ZZ-frågan blev *"Ingen aning"* → **`88` drogs ur vågen** (frånvaro av
auktorisation är inte auktorisation). **WORKTREE-SKULDEN STÄDAD:** 16 avställda
agent-worktrees borttagna (var och en verifierad som förfader till `main`, 0
vägrade), lokala grenar **32 → 5**; rutin-ändringen till `session-paus`/
`session-end` är Marcus beslut och kortas. **VÅG 1 UTE: sex agenter** — `86`
`87` `89` `90` `91` `92`. Våg 2 bär `85` (delar `ci.yml` med `92`) och `93`
(dess AC #3 hade alltid stängt som blockerat under en våg). `TASK-79` separat på
tyst maskin. Numrering: 91/084/L360 (**55** fragment)/T110/f46/**task-94**.
Full narrativ: sessionsdok **Del 34**.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-30, sjuttonde pausen — dukat för
tio-agents-vågen)** — **SEX PR:er landade** (`#463` `#465` `#466` `#467` `#468`
`#470`) plus `#471` armerad; hub `#7` (`000ceab`). **`A2:7` DELAD på Marcus
beslut, båda halvorna besvarade:** nummerhalvan → `TASK-93` (`ADR-081` beslut 4:s
*"Kort: redan löst"* **mätt falskt** — två arbetsträd fick båda `task-4`;
verktygets skydd `check_active_branches` står `false` mot tillverkarens `true`
sedan instansens födelse) · filnamnshalvan **framkallad** (två agenter, samma
sökväg, tyst överskrivning; `Write` skyddas per agent-kontext, **skalet inte**).
**`A2:8` KLAR:** grinden byggd (self-test **7/7**, fäller mot hub-filens faktiska
innehåll inkl. det radbrutna), **`ADR-083` mintad**, hub-`CLAUDE.md` rad 106+129
säger nu PROSA. **`TASK-36.8` STÄNGD** — beslutet fattades för tre dygn sedan och
verkställdes aldrig; backlog-grinden **RENT för första gången** (169 kort, 0
inkonsistenta). **HARNESS-GENOMGÅNGEN:** Del 29.3:s *"inget tak"* är **falskt** —
taket är **20 samtidiga**, verifierat mot docs på 2.1.220; `metrics:agents` hade
aldrig körts (frontmatter-isolering fyrar 100 % för egna typer). **MARCUS FÄLLDE
CODE TRE GÅNGER:** slutsatsen att skyddet ej kan mekaniseras · bokföringen av
`TASK-36.8` · `src/`-argumentet (mekanismerna hanterar redan fallet).
**DUKNING KLAR — partition i Del 33.5:** våg 1 = åtta agenter
(`86` `87` `88` `89` `90` `91` `93` + EN av `85`/`92`) · våg 2 = den andra ·
**`79` separat, tyst maskin**. Numrering: 91/**084**/L360 (**55**
fragment)/T110/f46/**task-94**. Full narrativ: sessionsdok **Del 31–33** +
PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-29, sjuttonde resumen — fyra flaggor, en
äkta)** — LÄS-fasen rapporterade fyra divergenser; **utredningen visade att TRE
INTE VAR STÄDFEL.** Fragment-talet var **Codes eget fel** (`README.md` räknad som
fragment — disk har 54, precis vad PAUSLÄGE sade); dagens **fjärde instans** av
*overifierat påstående skrivet som fakta*, begången i rapporten vars uppgift var
att kontrollera den. `TASK-83`-flaggan var en tidsordnings-artefakt (Del 30 skrevs
`20:01:39`, stängningen kom `20:06:12`). HEAD-SHA:t är **strukturellt** — sjätte
förekomsten; raden kan inte skrivas rätt, eftersom mergen som publicerar den
ändrar det värde den påstår. **ETT ÄKTA FEL: `TASK-70.7`** bar `ready-for-agent`
trots att dess **AC #2 är en STOPP-grind mot Marcus** — och etiketten ÄR
förhandskvittot för commit + push (`ADR-071` beslut 1). Av tio etiketterade kort
var det **enda** med en Marcus-STOPP i sitt AC. Etiketten borttagen via CLI:t med
grund + väg tillbaka på kortet; innehållet orört. **Poolen är NIO — dukningens
lista var korrekt, etiketten var det inte.** Kontroll-lucka funnen: ingen
mekanism prövar att pool-listningar stämmer mot etiketterna på disk — hör till
grillningens `A2:7` och kortas inte före den. Tillstånd återställt
(`active`, paus-rubrik → historik-form). Numrering: 91/083/L360 (**55**
fragment)/T110/f46/**task-93**. **NÄSTA: grillningens `A2:7`-halva** (Marcus
beslut). Full narrativ: sessionsdok **Del 31**.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-29, sextonde pausen — städpasset som dukade för
nästa resume)** — **TIO PR:er landade, noll röda körningar.** **MARCUS FÄLLDE SEX
AV CODES PÅSTÅENDEN:** port 5399 binder inte (agenter kör aldrig sviterna lokalt)
· talet 3 var aritmetik medan loggen bar 6 · staging-taket binder inte oss (noll
av åtta kort rörde `src/`) · 28-kort-förslaget var scope-creep · tre av fyra
spärrar motiverade med *"gratis"*, vilket inte är ett skäl · `Install Vale`
ligger inte utanför exponeringen. **INGET AGENT-TAK ÄR FUNNET** — belagt är sex
läsande; siffran får inte bli en norm. **RESTLISTAN LAGAD:** kontroll 2 byggd ur
en kommentar utan kod (trefaldigt bevisad) · loggens tabell sju fragment → en ·
`Spår E ×4→×3` · fem bärarlösa poster placerade. **TRÅDREGISTRET:** `T74`/`T73`
och `T79`/`T78` stod omkastade — osynligt för varje strukturell kontroll.
**FYND:** `CLAUDE.md` påstod två mekaniserade spärrar som **inte finns**.
**ÅTTA KORT MINTADE** (`TASK-85`–`92`), pool `ready-for-agent` **3 → 9**.
**TVÅ KORT BYGGDA AV AGENTER:** `TASK-83` (agenten räddade kortet från sin egen
rekommendation — `--retry` täcker inte exit 35) · `TASK-84` **DONE**.
**GRILLNINGEN:** `A2:8` avgjord (default-neka mot lista); `A2:7` skriven som
design, **inte kortad** — Marcus: *"Vänta."* **SKÖRD: 5 fragment** [UNIVERSAL ×5].
Numrering: 91/083/L360 (**53** fragment)/T110/f46/**task-93**. Full narrativ:
sessionsdok **Del 27–30** + PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-29, femtonde pausen — efter steg 3:s stängning
och backlog-grinden)** — **TJUGOSEX PR:er landade (`#418`–`#443`), NOLL röda
körningar.** **NIO KORT STÄNGDA:** `TASK-70.6` `72` `75` `76` `77` `78` `81`
`82` `56`. **TRE MINTADE:** `82` `83` `84`. **TVÅ TRÅDAR:** `T107` `T108`.
**STEG 3 STÄNGT.** **GRENSKULDEN STÄDAD** 282→17 fjärr, 222→17 lokalt.
**NY GRIND I DRIFT:** `check-backlog-closure.sh` — läget 1 inkonsistent kort av
160. **EN AGENT ARBETAR VID PAUSEN AVSIKTLIGT:** `TASK-80`:s mätserie är
CPU-exklusiv; kontrollera PR-läge FÖRST vid resume. **MARCUS FYRA FÅNGSTER:**
grenskulden var Codes beslut · arkitektur kräver alltid research · en rättelse är
ingen lösning · notifierings-blindheten (två gånger). **VÄNTAR PÅ MARCUS:**
`TASK-36.8` · `T107` · testgraf-beslutet · grillningens fråga 1. Numrering:
91/083/L360 (**48** fragment)/T109/f46/**task-85**. Full narrativ: sessionsdok
**Del 25–26** + PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-29, femtonde resumen — STEG 3 STÄNGT, tjugo
PR:er, fyra research-pass)** — **ÅTTA KORT STÄNGDA:** `TASK-70.6` `72` `75` `76`
`77` `78` `81` `82`. **TRE MINTADE:** `82` `83` `84`. **EN TRÅD:** `T107`.
**STEG 3 STÄNGT** — `TASK-75` sänkte PR-grindens kritiska väg **411 s → 57 s**
(`−86 %`), båda talen CI-mätta och oberoende verifierade. **GRENSKULDEN STÄDAD:
282 → 17 fjärr, 222 → 17 lokalt** (263 raderade, var och en verifierad som
förfader till `main` före radering). **BACKLOG-STÄNGNINGEN MEKANISERAD** efter
att tre kort landat gröna och stått kvar som `To Do` — ny grind, 10 testfall i
par, skarp körning **21 → 1**; Marcus avvisade baslinje-formen så alla 20
historiska utreddes individuellt. **TRE AC OMFORMULERADE PÅ EN DAG**, gemensam
rot: ett AC ska beskriva EGENSKAPEN som ska hålla, aldrig MEKANISMEN som ska bära
den. **GOVERNANCE-RESEARCHEN FALSIFIERADE VÅR EGEN MODELL:** reversibilitet är
den MINSTA axeln (9 %) i Claude Codes egen regeluppsättning och svarar fel på
vårt eget incidentfall; låst-beslut-golvet höll och finns redan hos Anthropic som
*"manufactured user intent"*. **ÖPPET:** `TASK-36.8` (kräver Marcus) · `T107`
(CI-wiringen, research-runda) · testgraf-beslutet (rek: bygg miss-rate-mätningen
först) · grillningen pausad vid fråga 1 · `TASK-79`/`80` väntar på tyst maskin.
Numrering: 91/083/L360 (**47** fragment)/T108/f46/**task-85**. Full narrativ:
sessionsdok **Del 25**.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-29, femtonde resumen — restlistan mosas med
tre parallella agenter)** — Marcus kvitterade hela den föreslagna planen och gav
**autonomt orkestrerings-mandat** (*"du tar över som chef"*). **Ingångsläget
verifierat mot disk:** HEAD `02a9517` (PAUSLÄGE sade `f3a2a11` — **femte
förekomsten** av att paus-blocket skrivs före sin egen merge landar; disk vinner),
rent träd, sex dependabot-PR:er, noll ärenden, all CI grön inkl. natten
`30421871553`, `audit-ci` grön. **Alla sju numrerings-axlar oförändrade** — ingen
mellansession har förbrukat nummer. **TRE BYGG-AGENTER I LUFTEN:** `TASK-81`
(mätriggen — fyra kort väntar) · `TASK-76` (purge-racet — brådskar, blev dyrare
när `70.3` landade) · `TASK-75` (acceptance-urvalet — stänger steg 3). **`TASK-70.6`
tagen under egen hand** (ändrar noll filer; `ready-for-agent` ≠ *ska spawnas*):
`delete_branch_on_merge` **false → true**, granne-värdena `allow_update_branch`
(false) och `allow_auto_merge` (true) verifierat orörda; AC #2 väntar på nästa
merge. **DIVERGENS FUNNEN I RESTLISTAN:** `A7:3` och `A7:5` står `- [ ]` i kroppen
medan `TASK-70.1` och `TASK-70.3` är Done och korrekt bokförda i
Avbockningsloggen — och **filens egen mekaniska kontroll kan inte se dem**, för
dess regex ankrar kort-ID:t först på raden medan A7-raderna bär det sist. Alla
A7-poster är därmed en blind fläck. **Historik-lucka noterad:** tionde pausens
`Paushistorik`-rubrik saknas i sessionsdoket trots att Del 17 heter *Tionde
resumen* — ordinalerna renumreras INTE, luckan bokförs. Numrering: 91/083/L360
(**43** fragment)/T107/f46/**task-82**. Karta: `tasks/s91-restlistan.md`.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-29, fjortonde pausen — efter merge queue och
steg 3 ned till en post)** — **TJUGOTVÅ PR:er landade (`#389`–`#416`), NOLL röda
körningar.** **SEX KORT STÄNGDA:** `TASK-73` `63` `70.3` `70.1` `74` `70.4`.
**SEX MINTADE:** `76` `77` `78` `79` `80` `81`. **MERGE QUEUE AKTIV** — elva
landningar genom kön, alla gröna; regeln *"armera aldrig två samtidigt"* UPPHÄVD
och ersatt av mekanik. **Revert-vägen prövad SKARPT före aktivering** (på →
verifierad → av → verifierad med tom kö); `PUT` ersätter hela rules-arrayen, så
vägen tillbaka är en FIL. **STEG 3 HAR EN POST KVAR: `TASK-75`** (avblockerad).
**Noll öppna ärenden** — `#392` och `#398` stängda med belägg. **Restlistan har
nu en MEKANISK KONTROLL i filhuvudet** som körs FÖRE varje uppdatering; den
fångade två fel denna resume, varav ett infört av auditen själv och ett fångat
före landning. **TRE AGENTER ARGUMENTERADE MOT SINA EGNA TAL** (`70.3` +1,1 % ·
`70.4` −49 s tillskrevs inte flytten · `74` deflaterade 13→1 till 1-mot-1) — utan
det hade `TASK-75` planerats mot ett tak som inte finns. **MARCUS TRE FÅNGSTER:**
`70.1`-schemaläggningen var Codes beslut · ett fynd måste säga VAR felet sitter ·
`nohup &` ger noll notifieringar. **NÄSTA: `TASK-81` (mätriggen — fyra kort
väntar på den) → `TASK-75` (stänger steg 3) → `TASK-76` (brådskar: racet blir
dyrare efter `70.3`) → steg 4 `TASK-70.6`.** Numrering: 91/083/L360 (**43**
fragment)/T107/f46/**task-82**. Karta: `tasks/s91-restlistan.md`. Full narrativ:
sessionsdok **Del 21–23** + PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-29, trettonde resumen — MERGE QUEUE AKTIV,
steg 3 till tre fjärdedelar)** — **TOLV PR:er landade (`#389`–`#408`), noll röda
körningar.** **FYRA KORT STÄNGDA:** `TASK-73` (AC-svansen, fyra oberoende bevis)
· `TASK-63` (stod `To Do` medan TRE dokument påstod motsatsen — DoD #3 obockad;
bara korsläsning mot registret avslöjade det) · **`TASK-70.3`** (A7-spårets
största post) · **`TASK-70.1`** (merge queue). **FYRA MINTADE:** `76` `77` `78`.
**`TASK-70.3`:** staging ur PR-grinden. Väggklockan för en ensam PR står still
(+1,1 %) — **godkänt utfall per kortet självt**; vinsten är derivatan: FÖRE-talet
växer ~360 s per ytterligare samtidig kod-PR, EFTER-talet är konstant. Kötid
**283 → 0 s**, mätt två gånger oberoende (283 s kontrollerat, 323 s naturligt
experiment). AC #1 godkänt på **rationale, ej bokstav** (skippade placeholders;
literal frånvaro hade krävt radering som kortet förbjuder — nattnätet delar
källan). **`TASK-70.1`:** triggern landad SEPARAT och FÖRE regeln (annars kan
ingen PR landa, inklusive fixen) · **revert-vägen prövad SKARPT med tom kö** (på
→ verifierad → av → verifierad; `PUT` ersätter hela rules-arrayen, så vägen
tillbaka är en FIL) · **AC #6 bevisad genom att göra det gamla förbudet** — `#404`
och `#405` armerade SAMTIDIGT, båda landade. **Research avvärjde två risker
kortet inte nämner:** `changed-files` hanterar `merge_group` (verifierat i koden
vid vår SHA-pin, ej i dokumentationen) · `cancel-in-progress: true` var en
dokumenterad kö-fälla vi undgick **av en slump** — nu explicit.
**RESTLISTANS AUDIT** (tre läsagenter, disjunkta linser): **~20 fynd**, varav
**FEM skapade samma kväll av rättelsearbetet självt**. Tyngsta: `--mm-btn-*` var
INTE oanvända (`CTA.tsx` använder Tailwind-syntax) · `TASK-18.20` blockeras av
fyra Marcus-beslut, ej hållplats-frågan · nio poster saknade bärare i kartan
(orsak: A2:s två första punkter saknade NUMMER, och kartan pekar per nummer → nu
`A2:10`/`A2:11`). **SKÖRD: sex fragment (37 → 43)** — fyra ur Marcus eller
agenternas fångster, ett ur egen reflektion. **MARCUS TRE FÅNGSTER:**
schemaläggningen av `70.1` var Codes beslut · ett fynd måste säga VAR felet sitter
(`#405` rörde ALDRIG PR-grinden) · bakgrundsvakter startade med `nohup &` ger
NOLL notifieringar. **NÄSTA: `TASK-70.4` (bygg-agent arbetar) → `TASK-75`
(avblockerad, samma filer — ej parallellt) → steg 3 STÄNGT. Sedan steg 4
(`70.6`, `delete_branch_on_merge`) som också stoppar grenskulden från att växa —
nu 263 fjärr/191 lokala, +28 % på ett dygn.** Numrering: 91/083/L360 (**43**
fragment)/T107/f46/**task-79**. Karta: `tasks/s91-restlistan.md`. Full narrativ:
sessionsdok **Del 21–22**.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-29, trettonde resumen — tillstånds-
återställning + merge queue framflyttad)** — resumen kördes **tio minuter efter**
pausen (`b354d98` var 8 min gammal); midnattspassagen förklarar datumskiftet.
Numreringens **sju axlar oförändrade** sedan pausen (91/083/L360/**37**
fragment/T107/f46/**task-76**) — ingen mellansession har förbrukat nummer.
**`TASK-74`: ingen PR, ingen branch, kortet `To Do`** — agenten lever (pid 14285,
4 h 25 min, egen låst worktree) i parallell session; inget att ta över.
**HEAD-avvikelsen fjärde förekomsten** (`PAUSLÄGE` sa `bcd9265`, disk `b354d98`
— blocket skrivs före sin egen merge; nu ett mönster, ej ett misstag per gång →
lesson-kandidat). **MARCUS-KORRIGERING:** schemaläggningen av `TASK-70.1` var
Codes beslut, inte hans — kortets *"Marcus kvitterar före avfyrning"* är en
utförande-form (orkestreraren, ej spawnad agent), inte ett beslutsmandat.
**NY ORDNING I STEG 3: `70.3` → `70.1` → `70.4` → `75`.** Merge queue tas direkt
efter staging-flytten: före den fördubblas väntan (27 → 55 min för tre parallella
kod-PR:er, mutexen tas två gånger per PR), efter den är dubbleringen avväpnad
utan villkorings-kod. Live-belagt före beslutet: `owner.type=Organization` ·
`visibility=public` · **en enda** required check (`CI Passed or Skipped`) ·
`allowed_merge_methods=["merge"]`. **NÄSTA: `TASK-70.3` (bygg-agent igång) →
`70.1` under egen hand med revert-vägen prövad FÖRE aktivering → `70.4` → `75`.**
Karta: `tasks/s91-restlistan.md` § VAR VI ÄR. Full narrativ: sessionsdok **Del 21**.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-28, trettonde pausen — efter vägkartan och
steg 1–2)** — **TJUGO PR:er landade (`#362`–`#387`), samtliga gröna per jobb,
noll röda körningar.** **NIO KORT STÄNGDA** (`62` `64`-klass-A `65` `66` `69`
`70.2` `70.5` `71` `63`) och **FEM MINTADE** (`71` `72` `73` `74` `75`).
**VÄGKARTAN IN I RESTLISTAN** — ordningsraden gjord fullständig i nio steg efter
att en väg byggts som tappade tre poster trots att hela filen lästs; formregeln
är *steg, ID och pekare — aldrig status*. **STEG 1 KLART** utom `TASK-36.8`
(Marcus) · **STEG 2 KLART** (post-merge-lagret + revert-vägen **övad**).
**REVERT-VÄGEN ÖVAD SKARPT:** 118 s till revert-commit, **25 min 16 s** till
landad revert — nästan allt köväntan, vilket avtäckte `TASK-73`. **`TASK-64`
KLASS A: 3/8 → 0/8** fällningar med retries av; flakigheten mättes till **63 %**
av CI-körningarna. **MUTEXEN SERIALISERAR** (Marcus fångst): 7,8 mot 20,3 min för
identiskt svit-innehåll ⇒ A7:5:s vinst är att kritiska vägen slutar VÄXA med
antalet parallella PR:er. **Orkestrerarens "under 4 min" RÄTTAT** — acceptance
(422–433 s) blir ensam bärare, `TASK-75` sänker taket. **TRE AGENT-RÄTTELSER av
orkestreraren** (räknefelet · `toHaveAttribute`-no-open · `mer-vantelista`).
**EN AGENT KÖR VID PAUSEN:** `TASK-74` — kontrollera dess PR-läge först vid
resume. Numrering: 91/083/L360 (**37** fragment)/T107/f46/**task-76**. Karta:
`tasks/s91-restlistan.md`. Full narrativ: sessionsdok **Del 20** + PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-28, tolfte resumen — tillstånds-
återställning)** — resumen kvitterad mot disk: numreringens **sju axlar
oförändrade** sedan pausen (91/083/L360/**33** fragment/T107/f46/**task-71** —
ingen mellansession förbrukade nummer), `main` @ `53e951b` rent + i synk med
origin (paus-PR **`#361`** mergade EFTER att PAUSLÄGE skrevs, därav dess
`b4cfbab`), fem senaste main-körningarna **gröna**, `audit-ci` *"Passed"*,
plugin **1.22.0**. **`S92` är fortfarande `lifecycle: paused`** och har inte
rört någon axel. Öppna PR:er: endast de sex dependabot-PR:erna. Worktrees:
huvudkatalogen + `wt-s91`/`wt-atlas` som tillhör ANDRA sessioner — orörda.
**NÄSTA per handoffen:** (1) `TASK-65` + `TASK-66` parallellt (två agenter, bara
den ena rör acceptance-sviten) (2) `TASK-70.1`:s etikett `ready-for-human` →
`ready-for-agent` med utförar-noteringen (3) `TASK-64` under egen hand, steg 0
först. Karta: `tasks/s91-restlistan.md`.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-28, tolfte pausen — efter arbetsflödes-
granskningen och restlistans audit)** — **NIO PR:er landade (`#340`, `#350`–
`#360`), samtliga gröna per jobb, noll röda körningar.** **`TASK-62` Done**
(vakten ombyggd till två mekanismer efter att mätningen visade **51 → 4**
fällningar vid per-fil-aggregering) · **`TASK-69` Done** (felkontrakten 404/400
— kontraktsdriftens **lager 2 byggt**) · **`A7:1`+`A7:2` klara** utan kort.
**ARBETSFLÖDET GRANSKAT PÅ MARCUS BESTÄLLNING — domen DELVIS:** kod-PR:er bär
**7,4 min** kritisk väg mot docs-PR:ers 53–79 s, och **restlistan stängde inte
gapet** (merge queue obeslutad, staging-flytten fanns inte alls). Åtgärdsplanen
mintad som **`A7` + `TASK-70`-familjen** med ordningen kodad som invariant:
**`A7:4` är förkrav för `A7:5`–`A7:6`**. **RESTLISTAN AUDITERAD OCH RÄTTAD:**
**tio motsägelser + tolv statusfel** mot disk, **939 → 585 rader**; beslut **B**
fattat — kanonisk status bor i registren, filen bär ordning och beroenden.
**Marcus fångade en post som fallit ur planen** (preview-miljön → `TASK-70.7`);
`F3` revs som falskt fynd med källa. **KRITISKA VÄGEN BYTTE BÄRARE:**
`Acceptance` **410–452 s** mot `Staging` 313–381 s — staging-flytten räcker inte
ensam, mät före `TASK-70.3`. **SEX AGENTER; fyra rapporterade avvikelser mot
sina egna uppdrag, tre rättade orkestreraren.** **NÄSTA RESUME:** (1) `TASK-65`
och `TASK-66` parallellt (2) `TASK-70.1`:s etikett rättas (3) `TASK-64` under
egen hand. Numrering: 91/083/L360 (**33** fragment)/T107/f46/**task-71**. Karta:
`tasks/s91-restlistan.md`. Full narrativ: sessionsdok **Del 19** + PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-28, elfte resumen — fynd-kedjan klassad och
sekvenserad)** — resumen kvitterad mot disk: numreringens **sju axlar
oförändrade** sedan pausen (91/083/L360/**33** fragment/T107/f46/task-70 —
ingen mellansession förbrukade nummer), `main` @ `50b2c5e` rent + i synk med
origin, fem senaste main-körningarna **gröna**, `audit-ci` *"Passed"*, plugin
**1.22.0**. **FYND VID INGÅNGEN: `S92` är också `lifecycle: paused`** — två
pausade dok på disk; Marcus pekade ut S91, S92 har inte rört numreringen.
**Marcus order: `TASK-63`–`66` + `69` ska ALLA klassas och tas itu med, i rätt
ordning.** Relationen bekräftad — fem av sex är fynd ur `59.8`:s QA-vandring,
det sjätte är kontraktsdriftens lager 2. **Samtliga fem klassade
`ready-for-agent`** (alla bar redan AC — 13 st; till skillnad från
`56`–`58`-klassningen behövde inga skrivas). **Ordningen: `62` → `69` → `65` →
`66` → `64` → `63`**, med deps kodade **bara där beroendet är äkta** (`66→62`
fil-kollision · `64→62` mätinstrument · `69→68` förkrav); `63`/`65` fick ingen
dep — deras plats är schemaläggning, och en falsk dep blir skuld som ser ut som
en invariant. **`TASK-64` spawnas INTE som skiva** trots etiketten — diagnos
under egen hand, anvisningen skriven i kortets egen plan. **NU: `TASK-62`,
mätningen före bygget.** Karta: `tasks/s91-restlistan.md` § Fynd-kedjans
ordning.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-28, elfte pausen — efter kontraktsdriften och
vakten till sju)** — **FEMTON PR:er landade (`#334`–`#348` utom `#340`), samtliga
gröna per jobb, noll röda körningar.** **A5-FAMILJEN KOMPLETT** (`TASK-59.1`–`59.8`
Done) · **`TASK-67` Done** (landnings-ordningen kodad, tillämpad på sin egen
landning) · **`TASK-68` Done** (kontraktsvakten **tre → sju** handlers, `#346`
grön på alla åtta jobb inkl. staging). **KONTRAKTSDRIFTEN KARTLAGD:** testerna
KAN vara gröna medan en verklig EF svarar annorlunda — **det har hänt två
gånger**, och `TASK-52` lever i produktion. **`TASK-62`:s hypotes FALSIFIERAD av
research** (sex ekosystem): exakt-adress-jämförelse missar stavfelet och läser en
förorenad flagga; branschens form är TVÅ mekanismer. Planen omskriven med fyra
steg + mätning FÖRE bygge. **`#340` ligger öppen och OARMERAD med avsikt** — bär
det gamla bygget. **STÅENDE ORDER: Code fortsätter som ORKESTRERARE** (Marcus
2026-07-28). **SKÖRD: 4 fragment** [UNIVERSAL]. **NÄSTA RESUME:** (1) `TASK-62`
mätning + ombyggnad (2) `TASK-69` felkontrakten (3) steg 5 A2:7 — Marcus startar.
Numrering: 91/083/L360 (**33** fragment)/T107/f46/**task-70**. Karta:
`tasks/s91-restlistan.md` § VAR VI ÄR. Full narrativ: sessionsdok **Del 17–18** +
PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-28, tionde resumen forts. — KONTRAKTSDRIFTEN
KARTLAGD)** — **Marcus fråga besvarad med mätning: JA, testerna KAN vara gröna
medan en verklig EF svarar annorlunda — och det har hänt TVÅ gånger.** `TASK-52`
lever i produktion (`Motivering` är lookup ⇒ array, schemat kräver sträng;
persondetaljen faller för varje person med motivering) och kortets egen mening
säger varför: *"fixturvärlden använder schema-trogna strängar, så ingen grind ser
den"*. **Vakten hade fällt första natten — men `get-person` står inte i dess
lista.** Andra fallet upptäckt i utredningen: fixturens `get-person` svarar **200
med tom kropp** där EF:en har uttryckligt 404-kontrakt, och fixturens kommentar
beskriver ett beteende **borttaget i `task-54.2`**. Vaktens räckvidd mätt: **3 av
7 handlers · 3 av 24 EF:er · toppnivå enbart · null-blind 29/32** ·
ordning/antal/paginering/datumformat prövas inte. **De två EF:er som skickar mail
till riktiga människor saknar positivt skrivbevis.** → **`TASK-68`** (vakten till
alla sju, UNDER ARBETE) + **`TASK-69`** (felkontrakten 404/400). Fullt utfall:
[kartläggningen](../docs/research/kontraktsdrift-skyddet-2026-07-28.md).
**`TASK-67` DONE** (`#339`) — landnings-ordningen kodad, **tillämpad på sin egen
landning**; agenten lade till en fjärde form som inte fanns i kortet.
**`TASK-62` STOPPAD FÖR VÄGVAL:** vakten fäller **36 av 153 tester i 8 filer**,
men 30 av dem är normalt batch-idiom ⇒ kriteriet är för trubbigt. **Orkestrerarens
eget fel bokfört:** *"tysta ingenting"* + *"öppna PR"* är oförenliga när jobbet
lyckas ⇒ avsiktligt röd PR i delad kö (avbruten före kön). **Marcus delegerade
vägen med *"gör det som är seniort och BRANSCHLEDANDE"* ⇒ Codes beslut: research
FÖRE ombyggnad** (obelagd hypotes ≠ branschledande); pass mot MSW/Nock/WireMock/
gomock kör, **bygget nästa resume med belägg**. **`T85` våg 3 RÄTTAD** — två
dokument bar samma etikett för olika planer, och `P4` (5 req/s delat per bas)
avgjorde mot båda; **fångat av Marcus-pushback**. **SKÖRD: 4 fragment**
[UNIVERSAL]. Numrering: 91/083/L360 (**33** fragment)/T107/f46/**task-70**.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-28, tionde resumen — `TASK-59.8` QA-vandringen
KÖRD, sju steg)** — resumen kvitterad mot disk: numreringens sju axlar var
oförändrade sedan pausen. **`TASK-59.8` AC 1–3 avbockade; sju steg körda och
nedskrivna per steg** (sessionsdok Del 17). **`#335` grön per jobb** — och den
bär **AC #3:s POSITIVA GREN, den `59.7` inte kunde köra**: en PR vars hela diff
låg under `tests/acceptance/**` gav `Staging sentinel purge` **skipped** +
`Staging (API + E2E)` **skipped** + `Acceptance (hermetisk)` **grön**, exakt
mätningens § 7-recept. **Klassningen är därmed bekräftad korrekt, ej riven.**
Återkoppling **7 min 33 s** totalt, varav **noll väntan på annan** (mutexen tas
inte alls); lint/typecheck 43 s, Pure+Build 1 min 2 s. **Steg 4 gav den äkta
ändring `59.7` saknade** — personlistans 500-felläge, grönt första försöket av
rätt skäl. **FEM FYND-KORT: `TASK-62`** (överskuggning som aldrig matchar är
omekaniserad — 3 röda utan att felet nämner orsaken, **1 grönt på fel data**;
MSW:s `isUsed`+`listHandlers` källverifierade) **· `TASK-63`** (0/18 filer typar
fixturrader mot `z.infer`, 17/18 mot `Record<string, unknown>` → glidning fångas
först nattligen) **· `TASK-64`** (sviten flaky under workerlast, **baseline utan
ändringen fällde mest**, `retries: 2` maskerar) **· `TASK-65`** (2,2 s marginal
mot retrykedjans värsta fall) **· `TASK-66`** (tidsdimensionen odokumenterad).
**Steg 6 gav inget fynd** — kontraktsvaktens larm är direkt handlingsbart.
**Steg 7:** API-sviten **397 passed exit 0**, omfattning bevisat orörd (18 filer
ut ur `tests/e2e/`, **noll** ur `tests/api/`). **ÖPPET FÖR MARCUS:** två
oberoende färska läsare snubblade på samma sten (dubbla `support/`-kataloger) +
namn-invändningen mot "acceptance" — omdöpningar är scope-beslut, ej QA-fynd.
Numrering: 91/083/L360/**29** fragment/T107/f46/**task-67**.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-28, nionde pausen — efter A5:s mätning och
worktree-mekaniseringen)** — **A5 ÄR KLAR UTOM QA:** `TASK-59.1`–`59.7` alla
**Done**, endast `TASK-59.8` återstår i familjen. **TIO PR:er landade
(`#321`–`#331`), samtliga gröna per jobb, noll röda körningar.** Tre kort
stängda (`TASK-60`, `TASK-61`, `TASK-59.7`). **TVÅ ARKITEKTURFRÅGOR AVGJORDA PÅ
DELEGERING:** A4 → **ADR-082** (extern länkyta lämnar presubmit; ADR-029:s
add-only-policy riven öppet) och worktree-mekaniseringen → typade agenter i
`.claude/agents/` + icke-blockerande mätning, **båda efter att Marcus stoppade
förslaget och krävde research först — hooken FUNGERAR men var fel förstaval.**
**`59.7`:s mätning rättade tre siffror:** projektionen faktor 3,8 mot utfallet
**1,49** (avvikelsen RÄKNAD — projektionen räknade 296 mockande TESTER medan
kriteriet är FIL-nivå) · ADR-080:s före-siffra `9,10` reproduceras INTE (mätt
9,77, härledningen okänd och ej gissad) · **orkestrerarens egen "ren varians"
var fel** (~80 % infrastruktur, rättat vid källan). Taket **8 → 12 min** på
acceptance. **`T105` stängd · `T106` FÖDD** (självtestets race — grönt besked
trovärdigt, **RÖTT kan vara falskt**). **MARCUS-SEKVENS FÖR NÄSTA RESUME:**
(1) **`TASK-59.8` QA-vandringen — DELEGERAD TILL CODE**, kortet är
`ready-for-human` men delegeringen står över etiketten (2) steg 4 kadens-regeln
(3) steg 5 A2:7 — **nu MER angelägen av isoleringen, inte mindre.**
**Code fortsätter som ORKESTRERARE; spawna skrivande agenter som `bygg-agent`**
(landad, självisolerande — men agent-typer laddas vid SESSIONSSTART).
**Sessionen lever tills HELA restlistan är avklarad.** **SKÖRD denna resume:
2 fragment** [UNIVERSAL]. Numrering: 91/**083**/L360 (**29** fragment)/**T107**/
f46/**task-62**. Karta: `tasks/s91-restlistan.md` § VAR VI ÄR. Full narrativ:
sessionsdok S91 **Del 16** + PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-28, nionde resumen — A5 KLAR utom QA)** —
**NIO PR:er landade, samtliga gröna per jobb, noll röda körningar** (`#321`–`#330`).
**`TASK-61` Done** (kontraktsvaktens race stängt med oberoende data, ej körordning;
purge-immuniteten prövad mot policyns EGNA funktioner; ärende `#312` stängt).
**`TASK-59.7` Done ⇒ A5 är klar utom `59.8` QA** — mutex-hållningen mätt
**9,77 → 6,55 min** (−32,9 %, faktor **1,49** mot projektionens 3,8);
**avvikelsen RÄKNAD, ej bortförklarad**: projektionen räknade 296 mockande TESTER
men kriteriet är FIL-nivå, och 147 av dem bor i filer med minst ett live-test.
Samma modell på rätt population träffar inom **8 %**. ADR-080:s före-siffra `9,10`
reproduceras INTE (mätt 9,77; härledningen okänd, ej gissad).
**A4 AVGJORD PÅ DELEGERING → ADR-082:** extern länkyta lämnar presubmit
(`--offline`), nattnätet bär den med egen stående `lankrota`-kanal,
`.lycheeignore` roll-bytt till brusfilter och ADR-029:s add-only-policy **riven
öppet**. Tvåsidigt bevisat: trasig intern länk → exit 2, död extern → exit 0.
**Vår egen motivering rättad** — "17 av 19 undantag blir onödiga" höll inte;
**noll** blir onödiga om nattrapporten ska vara läsbar.
**WORKTREE-ISOLERINGEN MEKANISERAD** efter att Marcus stoppade förslaget och
krävde research först: hooken FUNGERAR men är fel förstaval — Anthropic har en
deklarativ plats ett lager under. Steg 1 `.claude/agents/` med
`isolation: worktree` (`#327`, ingen plugin-bump) + steg 2 icke-blockerande
mätning (`#330`, `npm run metrics:agents`), **bevisad i drift**.
**TAKET 8 → 12 min** på acceptance; orkestrerarens "ren varians" var fel —
~80 % infrastruktur, rättat i restlistan. **`T105` stängd · `T106` född**
(självtestets race: grönt besked trovärdigt, RÖTT kan vara falskt).
**NÄSTA: `59.8` QA-vandringen (DELEGERAD TILL CODE — kortet är `ready-for-human`,
delegeringen står över etiketten) → steg 4 kadens-regeln → steg 5 A2:7.**
Numrering: 91/**083**/L360 (**29** fragment)/**T107**/f46/**task-62**.
Karta: `tasks/s91-restlistan.md` § VAR VI ÄR. Full narrativ: sessionsdok S91
**Del 16**.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ ÅTERUPPTAGEN (2026-07-28, nionde resumen)** — **`lifecycle`
tillbaka i `active`; numreringen höll på alla sex axlar** (ADR `082` · `L360` +
**27** fragment · `T106` · `f46` · `task-62`). Ingång: `main` @ `b4f61af`, rent
träd, CI + CodeQL gröna per jobb på de tre senaste main-körningarna, `audit-ci`
grön, plugin **1.22.0**. Kortstatus via backlog-CLI:t: `59.5` · `59.6` ·
`TASK-60` **Done**; `TASK-59` + `59.7` + `59.8` + `TASK-61` **To Do**.
**FYRA DIVERGENSER:** `PAUSLÄGE`-blockets `322a00e` mot faktisk HEAD `b4f61af`
(väntat — blocket skrevs före sin egen landning via `#320`) · **två pausade
sessionsdok** (`session-92`, färgsystemet i egen worktree — Marcus pekade ut
S91, så vägvalet var fattat) · **S92:s todo-kadensrad saknas fortfarande**
(obetald nu över TRE resumes) · dependabot-räkningen stämde (exakt de sex
handoffen namngav). **Fälla-axeln krävde tre grep-försök** — de två första
mönstren träffade fel form och gav `44`, vilket hade blivit en falsk divergens
om siffran skickats vidare oprövad; posten är en numrerad listrad, `45` på rad
182 i `data-model.md`. **INGÅNG KVITTERAD: `TASK-61`** (kontraktsvaktens race)
— punkt 1 i Marcus beordrade sekvens; kärnan är att ett `needs:` bara flyttar
racet medan kriteriet kräver en permanent fixtur purge-mönstret per
konstruktion inte kan träffa. Arbetsformen är beordrad: **Code som
orkestrerare**, subagent bygger + öppnar PR, orkestreraren granskar diffen,
armerar auto-merge och äger CI-svansen. **Sessionen lever tills HELA restlistan
är avklarad.** Karta: `tasks/s91-restlistan.md` § VAR VI ÄR. Full narrativ:
sessionsdok S91 **Del 16**.

**Session 92 ⏸️ PAUSAD (2026-07-27) — PARALLELL SESSION, färgsystemet från
audit till spikad palett.** Raden skriven av S91:s nionde resume på Marcus
order 2026-07-28; S92 utelämnade den MEDVETET två gånger och bokförde avsteget
öppet — `tasks/todo.md` ägdes av en pågående parallell session, och S92:s eget
PAUSLÄGE pekade ut resumen som rätt aktör. Ingen skuld, en sekvensering.
**ALLT ARBETE ÄR LANDAT I `main`** — verifierat, inte antaget: PR `#285` mergad
2026-07-27 (`03d3a3f`), och `origin/docs/farg-atlas` @ `1e1c778` bär **noll**
commits utanför `main`. **Paletten spikad:** sex tolvstegsskalor i OKLCH (104
primitiver, varav **72 nya**) · **62** roller · **85** komponent-tokens ·
`npm run atlas` verifierar med **1611** kontroller utan avvikelser (155 rader
handskrivet fyndregister, allt annat härlett ur `src/`). **15 fynd, 2 lösta**
(F10, F11). **Appens enda faktiska utseendeförändring är ETT tokenvärde**
(`--mm-button-primary-bg-pressed`, F11) — allt annat additivt och utan
konsumenter. **MIGRERINGEN ÄR INTE PÅBÖRJAD** — verifierat mot
`primitives.css`, som säger det i klartext: *"INGEN ROLL PEKAR HIT ÄNNU …
appen renderar oförändrad."* **VÄNTAR PÅ MARCUS:** val 2:s två delfrågor
(mätarens fyllnadskulör `sage-9` mot `blue-9` · om fullt ska markeras
semantiskt) · **F16** `--mm-btn-*` mot `--mm-button-*` (namnbeslutet är
Marcus; S91:s formulering av frågan vilade på ett falsifierat påstående —
korrigerat underlag i S92 § Ett S91-påstående som föll). **NÄSTA:** steg A
(namnge de tre grammatikerna) · B (urvalsrollen) · D (resten av bristerna) —
alla tre kan Code driva; C kräver Marcus; E (migreringen) sist.
**7 lesson-kandidater, 4 [UNIVERSAL], ej hub-lyfta** (paus finaliserar inte).
⚠️ **S92:s egen numreringsrad är FÖRÅLDRAD** (den anger nästa ADR `79`; disk
säger `082`) — re-verifiera mot disk vid resume, dokets paus-tida värden är
hypotes. Full narrativ: sessionsdok S92.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-28, åttonde pausen — efter A5:s migrering)**
— **A5:s MIGRERING ÄR KLAR: samtliga 18 filer ute.** `TASK-59.1`–`59.6` alla
**Done**; checksumman gick ihop exakt (e2e **14** / acceptance **18**, de fjorton
mot namnlista). **`TASK-60` byggd och Done** (`T104`): hermetikens andra led är en
körbar grind i CI — bar 90/90/90 i `59.5` och 152/152/152 i `59.6`. **`TASK-61`
registrerad och plockbar** (kontraktsvaktens race; `fixture-data.ts` orörd av
`59.6` ⇒ fri sekvensering). **A4-RESEARCHEN LANDAD** — formen är branschens
mönster (9 projekt), men vår motivering *"17 av 19"* var fel (22 mönster, 21
externa) och två undantag vilar på ett faktafel. **ADR-baren nås smalt —
Marcus-beslut.** **TVÅ SIFFROR TRÄFFADE INTE**, noterade i ADR-080 § UTFALL i
stället för omräknade tyst: staging `9,25 → ~2,4` projicerat mot `9,10 → 6,50`
faktiskt (≈29 %, ej faktor 3,8) · filantal 19/13 mot 18/14. **NY RISK som A5:s
framgång skapade:** acceptance-jobbet **6,7 min mot tak 8** (sviten 51 → 152
tester) — överlämnad till `59.7`. **ELVA PR:er `#308`–`#319`, samtliga gröna per
jobb.** **FYRA EGNA FEL, alla bokförda:** kostnadsprognosen (lokal mätning
projicerad till CI, 5,8× fel) · BEHIND-svälten (`L328`, nedskriven sedan S81) ·
kort skapat på agentens gren · restliste-post som stått fel i tre dygn.
**MARCUS-SEKVENS FÖR NÄSTA RESUME:** (1) `TASK-61` (2) `59.7` (3) **`59.8`
QA-vandringen DELEGERAD TILL CODE** — kortet är `ready-for-human`, delegeringen
står över etiketten (4) därefter enligt planen. **Code fortsätter som
ORKESTRERARE med subagenter. Sessionen lever tills HELA restlistan är avklarad.**
**SKÖRD: 4 fragment** [UNIVERSAL ×4]. Numrering: 91/082/L360 (**27**
fragment)/**T106**/f46/**task-62**. Karta: `tasks/s91-restlistan.md` § VAR VI ÄR.
Full narrativ: sessionsdok S91 **Del 15** + PAUSLÄGE.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ PÅGÅENDE (2026-07-28, åttonde resumen — A5:s slutspurt)** —
**`TASK-60` + `TASK-59.5` + `TASK-61` landade; A5 på 11 av 18 filer.**
`TASK-60` (hermetik-självtestet, `T104`) gav A5 ett körbart tvåsidigt bevis, och
**det bar sin första skarpa användning redan en skiva senare**: `59.5` gav
`90 tester / 90 fällda / 90 av vakten` — alla 39 nya tester hängde på fixturen
direkt, ingen fil behövde skrivas om. `59.5` fångade dessutom **HTTP-verb-fällan**
(`page.route` matchar alla metoder, `http.get`/`http.post` inte) och en **levande
länk-pekare** i ett research-dokument. **`59.6` PÅGÅR** — de sista sju, med
checksumma i briefen: e2e ska landa på **14** filer, acceptance på **18**, de
fjorton namngivna. **NATTNÄTET LARMADE** (`#312`): kontraktsvakten föll på
`[TOMT-UNDERLAG]` — **race** mot purge (grön dispatch läste 2 s före, röd natt 8 s
efter) men **rotorsaken är designluckan**: `get-event-notes` mäter mot sentinel-data
som purge är designad att radera. Vaktens FÖRSTA schemalagda nattkörning; den
tidigare "larmkedjan bevisad" var timing-tur. → **`TASK-61`**, tas efter `59.6`.
**A4-RESEARCHEN KLAR:** uppdelningen är branschens mönster (9 projekt, noll låter
externa länkar blockera PR), **men vår motivering "17 av 19" är fel** — 22 mönster,
21 externa, och **noll** blir onödiga om nattrapporten ska vara läsbar. Två av våra
undantag vilar på ett faktafel (felcachning borttagen i lychee v0.24.0, vi kör
v0.24.2). ADR-baren nås smalt — **Marcus-beslut**. **TVÅ EGNA FEL:**
kostnadsprognosen (lokal mätning projicerad till CI, 5,8× fel — lagad, `289 s → 75 s`)
och **BEHIND-svälten** (`L328`, nedskriven sedan S81 — jag gick i den ändå).
**SKÖRD: 4 fragment** [UNIVERSAL ×4]. **NÄSTA: `59.6` → `59.7` mätningen (tar
`T105`) → `59.8` QA (`ready-for-human`, Marcus).** Numrering:
91/082/L360 (**27** fragment)/**T106**/f46/**task-62**. Karta:
`tasks/s91-restlistan.md` § VAR VI ÄR. Full narrativ: sessionsdok S91 **Del 15**.
*(Föregående fokus-text nedan.)*

**Session 91 ▶️ ÅTERUPPTAGEN (2026-07-28, åttonde resumen)** — **`lifecycle`
tillbaka i `active`; numreringen höll på alla sex axlar** (ADR `082` · `L360` +
**23** fragment · `T105` · `f46` · `task-60`). Kortstatus läst via backlog-CLI:t:
`59.1`–`59.4` **Done**, `TASK-59` + `59.5`–`59.8` **To Do**. Ingång: `main` @
`61e7fdd`, rent träd, CI + CodeQL gröna, `audit-ci` grön, plugin **1.22.0**.
**FYRA DIVERGENSER:** sessionsstartens git-snapshot var föråldrad (paus-landningen
fullbordades via `#306`+`#307` efter att den togs) · `PAUSLÄGE`-blockets
`c964fc0` mot faktisk HEAD `61e7fdd` (väntat — blocket skrevs före sin egen
landning) · **grep på `lifecycle: paused` gav tre träffar men bara två är äkta**
(`session-53` matchade brödtext, dess frontmatter är `closed` — verifierat före
rapportering) · **S92:s todo-kadensrad saknas fortfarande** (obetald över två
resumes). Dependabot-räkningen stämde denna gång: exakt de sex handoffen namngav.
**MARCUS-BESLUT: `T104` FÖRE `59.5`** (*"Kör som du föreslår"*) — **LEVERERAT
SAMMA PASS som `TASK-60`.** `HERMETIK_SJALVTEST=1` +
`scripts/hermetik-sjalvtest.mjs`, kopplat som steg i CI:s acceptance-jobb.
**TRÅDENS FÖRESLAGNA FORM RÄCKTE INTE** — att bara tömma normalläget lämnar
filer som överskuggar allt de behöver (`persons-list`) obevisade; regimen bär
därför BÅDA leden. **`test.fail()` FÖRKASTADES AKTIVT:** den kontrollerar att ett
test fälls, aldrig varför, och hade i en delad söm körts en enda gång av
ESM-cachen. Grinden kräver i stället `OmockadRequestError` per test.
**TRESIDIGT BEVISAT:** positivt `51 · 51 fällda · 51 av vakten` (exit 0) ·
negativ kontroll `51 · 0 fällda ⇒ bedömningen föll` (exit 0) · **målfallet** —
tillfällig överlevar-fil ⇒ `52 · 51 fällda`, överlevaren namngiven (exit 1).
Fail-closed på tomhet. **KOSTNADSPROGNOSEN VAR MITT EGET FEL:** ~50 s var en
LOKAL mätning projicerad till CI och skrevs ut som *"mätt, inte antagen"* i tre
dokument; skarpt utfall **289 s**, jobbet **6,5 min mot tak 8**. Rotorsak
`retries: CI ? 2 : 0` — i självtestläget är rött det FÖRVÄNTADE utfallet, så
varje test kördes tre gånger med video (153 körningar för noll information).
Orsaken BANDS via `CI=1` lokalt (297 s mot CI:s 289 s), gissades inte. Lagat i
samma pass: `--retries=0` + artefakter av i regimen ⇒ **297 s → 73 s**, jobbet
~2,5 min. **VERIFIERAT SKARPT I CI EFTER FIXEN:** steget `289 s → 75 s`,
jobbet `6,5 → 2,8 min` mot tak 8, beviset oförändrat `51/51/51`. Retries vore
dessutom FEL, inte bara dyrt — ett test som fäller först och passerar sedan är
inget hermetik-bevis. **`TASK-60` Done**, CI grön per jobb 9/9 i båda
landningarna (`#309` run `30320122732` · `#310` run `30321515947`). **`T105` FÖDD:**
hermetik-rapporten skrivs ut ur en gammal mätning som om den vore färsk
(`global-setup` flagg-vaktad, `global-teardown` inte) — verifierat i koden,
deferat till `59.7` som äger instrumentet. **SKÖRD: 3 fragment** [UNIVERSAL ×3]
(grind som ej prövar orsaken · trådens föreslagna form är hypotes · lokal
mätning projicerad till CI är inte en mätning).
**NÄSTA: `59.5` Mer-ytan (6 filer) → `59.6` Event (7) → `59.7` mätningen (tar
`T105`) → `59.8` QA.** Numrering: 91/082/L360 (**26** fragment)/**T106**/f46/
**task-61**. Karta: `tasks/s91-restlistan.md` § VAR VI ÄR. Full narrativ:
sessionsdok S91 **Del 15**. *(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-28, sjunde pausen — mitt i A5:s migreringsvåg)**
— **A5 SPECCAT OCH PÅBÖRJAT; ACCEPTANCE-KLASSEN LEVER I CI.** `TASK-59` (PRD,
14 användarberättelser) + **sju skivor + QA-kort**, vågorna delade efter YTA ej
antal. **`59.1`–`59.4` alla Done, 5 av 18 filer flyttade**, och
`Test suite / Acceptance (hermetisk)` är ett eget **mutexfritt** jobb i CI.
**KLASSNINGEN OMRÄKNAD UR RÅDATA → 18/14**, inte ADR-080:s 19/13: `pwa-offline`
är mekaniskt ren men doktrinärt undantagen (kräver byggd preview), och ADR:n tog
den mekaniska 19:an som beslutets. ADR noterad. **SKARV-VALET BELAGT MOT
PRIMÄRKÄLLA** — EN delad fixturvärld per MSW:s *"single source of truth for your
network across the entire stack"* + Playwrights `mergeTests` (verifierad
exporterad i 1.61.1). **KONTRAKTSVAKTEN I DRIFT och larmkedjan bevisad skarpt**
(dispatch `30309427472`: `Kontraktsvakt: success` + `Larm: success`; ärende
`#300` stängt med motivering) — **vakten larmade på RIKTIG drift inom en timme**:
11 fält som `get-registrations` skickar i 43/43 poster saknades i fixturen.
**ORKESTRERAT MED SUBAGENTER** (Marcus order); workflow förkastat — skivorna är
linjära och `L323` säger att subagent ej bär asynkron CI-svans. **FYRA LATENTA
FEL TÄNDE, tre låg redan i repot:** `gh run list --commit` matchar ej förkortad
SHA (tyst tom lista → falsk timeout; härdad, fällde direkt två självtest-fall) ·
fixturen elva fält efter · **`L264`-tidszonsfelet** (deterministiskt 22–24 UTC;
lärdomen tillämpad på 6 av 7 platser) · `danger.systems` avvisar runners
(undantag nr **20**). **TRE LÄNKFEL, TRE OLIKA RÄTTA SVAR** — undantag ·
ingenting · laga. **FYRA TRÅDAR FÖDDA:** `T101` (oreproducerat visual-fall) ·
`T102` (raster-instabilitet i acceptance men ej e2e) · `T103` (`test-bas.ts`
hemvist) · `T104` (vaktens bevis körs för hand, överlever ej körningen).
**Fjorton PR:er `#291`–`#305`, samtliga gröna per jobb.** **MARCUS-BESLUT VÄNTAR:
(1) `T104` före `59.5` eller ej — Codes rek: JA. (2) A4 länkgrindens form.**
**NÄSTA: `59.5` Mer-ytan (6 filer) → `59.6` Event (7) → `59.7` mätningen →
`59.8` QA.** Numrering: 91/082/L360 (**23** fragment)/**T105**/f46/**task-60**.
Full narrativ: sessionsdok S91 **Del 13 + 14** + PAUSLÄGE. Karta:
`tasks/s91-restlistan.md` § VAR VI ÄR. *(Föregående fokus-text nedan.)*

**Session 91 ▶️ ÅTERUPPTAGEN (2026-07-27, sjunde resumen)** —
**KLASSNINGEN GJORD PÅ MARCUS DELEGERING — OCH DEN AVTÄCKTE EN OSKRIVEN
INVARIANT.** `TASK-56`, `TASK-57` och `TASK-58` klassade **`ready-for-agent`**
(repots `ready-for-human` bär uteslutande QA-planer och PRD:er som kräver
mänskligt omdöme; alla tre korten är avgränsad testinfrastruktur med mekaniskt
verifierbart utfall). **Etiketten kunde inte sättas ensam:** en mätning visade
att **alla 66 befintliga `ready-for-agent`-kort har AC — noll undantag** — och
fynd-korten hade noll. Etikett utan AC hade gjort DoD 1 (*"alla
acceptanskriterier avbockade"*) innehållslös och grinden grön ändå. **13 AC
skrivna mot LÄST KOD** (`hermetic.ts` · `hermetik-vakt.ts` · `handlers.ts` lästa
först), ej mot korttexten: `56`: 4 · `57`: 5 · `58`: 4. `TASK-56`:s
källkodspåstående **verifierat om** — `@msw/playwright/src/fixture.ts` rad
156–166 bär `route.connectToServer()` vid noll WS-handlers, ordagrant som kortet
uppgav. **LÄS-fasen: numreringen oförändrad på samtliga sex axlar**; ingångsläget
rent (`main` @ `5372c95`, båda CI-körningarna gröna, `audit-ci` grön). **Fyra
divergenser flaggade:** dependabot-räkningen ofullständig (handoff 3, disk
**6** — `#260`/`#162`/`#65` ospårade) · restlistan NYARE än `PAUSLÄGE`-blocket
(`c1ea2e3` efter pauslandningen) · S92:s todo-kadensrad saknas fortfarande ·
S92:s PR `#285` **landade** (`03d3a3f`), verifierat som deras pausblock bad om.
**NÄSTA: `TASK-58`** (överskuggningsmönstret `network.use()` dokumenteras i
fixturmodulen) **→ `TASK-57` → A5 de 19 filerna → kadens-regeln.** Numrering:
91/082/L360 (19 fragment väntar)/T101/f46/**task-59**. Full narrativ: sessionsdok
S91 **Del 13**. Karta: `tasks/s91-restlistan.md` § VAR VI ÄR.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-27, sjätte pausen — efter A3:s stängning)** —
**A3:s MSW-PUNKT ÄR HELT STÄNGD: `TASK-54.1` + `54.2` + `54.3` alla Done, och
`TASK-55` med dem.** **`54.2`:** vakten flyttad till MSW:s `onUnhandledRequest`;
**omprövningen VÄNDE PRD-beslut 1** — källkodsläsning
(`@msw/playwright` `fixture.ts` rad 98–103) visade att `skipAssetRequests`
kortsluter tillgångs-anrop FÖRE callbacken, och en probe med `.txt`-URL nådde
**aldrig** vakten utan gick ut på nätet. Optionen står nu **`false`**;
3x-varningen materialiserades inte (17,3 s mot **14,9 s**). Sid-vakten OCH
EF-catch-allen borttagna — catch-allen var **aktivt skadlig** (den matchar, så
vakten fick aldrig se anropet). Tvåsidigt rött-först: `Expected to fail, but
passed` med vakten ej inkopplad. **`54.3` QA körd av Code på Marcus delegering**
— sex steg, ett med öppen avvikelse (nätverksavstängning ej möjlig → ersatt av
restanrops-mätning: **32 filer med restanrop, samtliga e2e, noll visual**). Två
fynd: **`TASK-57`** (vaktens meddelande skalar dåligt) + **`TASK-58`**
(överskuggningsmönstret odokumenterat). **`TASK-55` LÖST:** sex baselines
regenererade, **granskade och godkända av Marcus** (PR #287), bevis-dispatch
`30297097792` loggar *"Inga baseline-ändringar"* → stänger `54.2` DoD 7 +
`54.3` DoD 5. **Tre vyer ändrades, inte en** — `event-lista` bar filterknappen
ur `f11cc37`, ej hover-ändringen som först antogs (rättat genom att öppna
bilderna). **ACTIONS-FLAGGAN SATT PÅ TRE NIVÅER:** dispatchen failade först;
låset satt på **enterprise**, belagt med `409 Conflict: "The enterprise does not
allow GitHub Actions to approve pull requests"`. Workflowens filhuvud kallade
förutsättningen en *repo-inställning* — **faktarättelsen gjord**. **S92
(färgsystemet) landad parallellt och avstämd** — 72 nya primitiver utan
konsumenter, EN ändrad tokenrad, noll baseline-påverkan (mätt, ej ärvt).
**Sex PR:er (#282–#288), alla gröna per jobb första passet.** Pausen landar
**MED** grönt bevis. **NÄSTA (Marcus-order): `TASK-58` → `TASK-57` → A5 de 19
filerna → kadens-regeln.** Numrering: 91/082/L360 (**19** fragment
väntar)/T101/f46/**task-59**. Full narrativ: sessionsdok S91 **Del 12** +
PAUSLÄGE. Karta: `tasks/s91-restlistan.md` § VAR VI ÄR.
*(Föregående fokus-text nedan.)*

**Session 91 (femte resumen, 2026-07-27)** — **MSW-BYTET SPECCAT OCH FÖRSTA
SKIVAN LEVERERAD.** Marcus motto *"Bygg
ordentligt eller bygg inte alls"* delegerade fyra designbeslut:
`skipAssetRequests` **true** (passets slutsats, ej restlistans felläsning) ·
handlers mot **EF-protokollet** · kort-med-skivor ej ad-hoc · två arbetsskivor
ej PRD:ns gissade tre. **`TASK-54` + tre kort publicerade; `54.1` DONE**
(`56e9064`, CI 8/8) — MSW 2.15.0 bär API-lagret, sju handlers, ekvivalens
**pixel-bevisad A/B** mot baselines genererade av gamla mekanismen (12/12).
**Route-precedensen mättes FÖRE bygget** (minimalt test: `page.route`-fallback
når `context.route`) — hade den inte gjort det vore specen inte utförbar. **Tre
avvikelser mot kortets ordalydelse bokförda**, varav en farlig: AC:t ville ta
bort 501-fallbacken, men bindningens default är **tyst bypass** — bokstavlig
följsamhet hade gett en nätverksläcka. **Ekvivalensbeviset gick nästan fel:**
4/12 föll, kontrastkörning visade identiskt utfall med gamla mekanismen ⇒ stale
baselines från S90, ej regression → **`TASK-55`**. **AIRTABLE-KOSTNADEN
DOKUMENTERAD** på Marcus order: ADR-063 § S91-not + `airtable-constraints.md`
**sektion F** (P26 bas-duplicering · P27 självhostning · P4-utvidgning);
gränsdragningen tvång/eget val nedskriven, Fas E-kopplingen inlagd — Postgres
upphäver alla tre tvången. **`TASK-53`** skapat för 429-backoffen (1 s där
Airtable kräver 30 s — dagens enda defekt i produktionskod). **REVIEW-PASSET
KÖRT** på Marcus begäran: 5 fynd, 1 falsifierat med mätning (noll `OPTIONS` —
preflight-blocket var **död kod**, ärvd från gamla tabellen), 3 åtgärdade.
**Tyngst: ADR-080 sa `skipAssetRequests` "måste sättas false" — motsatsen till
koden.** Samma felläsning som restlistan bar; felet hade två hemvister, en känd.
ADR riven med öppen not. **T86-FRIKTIONEN BOKFÖRD:** AgentTool-regeln
verifierad till `~/.claude.json`/`tengu_heron_brook` (ej Marcus fil) —
beslutskriterierna räknar **skivor, ej pass**, så uteblivna pass måste märkas.
**Åtta PR:er, alla gröna per jobb första passet** (#273–#280). Pausen landade
**MED** grönt bevis. **FEMTE RESUMEN 2026-07-27:** numreringen disk-verifierad
**oförändrad på samtliga sex axlar** — inga mellansessioner hade förbrukat
nummer; ingångsläget rent (`main` @ `bbf0b6a`, CI grön, `audit-ci` grön).
**NÄSTA: `54.2`** (vakten → `onUnhandledRequest`, bär
`skipAssetRequests`-omprövningen + WS-noten) **→ `54.3` QA → A5 de 19 filerna
→ kadens-regeln.** Numrering: 91/082/L360 (17 fragment väntar)/T101/f46/task-56.
Full narrativ: sessionsdok S91 **Del 11** + paushistoriken. Karta:
`tasks/s91-restlistan.md` § VAR VI ÄR. *(Föregående fokus-text nedan.)*

**Session 91 (fjärde resumen, 2026-07-27)** — **LESSON-SKULDEN BETALD.**
Tillstånds-återställningen körd (`lifecycle: paused → active`, paus-rubrik →
historik-form, numreringen disk-verifierad **oförändrad** på samtliga sex axlar).
**PR #273 GRÖN OCH MERGAD** (`043e4a0`, `ci-wait` 8/8 per jobb, staging 9 m 53 s)
— handoffens *"landar utan grönt bevis"* var föråldrad: `30271719279` hade
cancellats och en **femte** körning fanns på `e29673a`. `Docs link check` gick
igenom ⇒ `cs.umd.edu`-timeouten var **transient som klassat**, tystades ej.
**Landnings-ordningen valdes medvetet:** återställningen hölls tillbaka tills #273
mergat — en commit till hade superseddat en 9/10-grön körning och kostat
~10 min genom mutexen (A2:5 tillämpad som omdöme, ej kodad). **SPÅR C SKÖRDAT I
SIN HELHET: 14 nya fragment** i `tasks/lessons.d/` (Del 6:s fyra · Del 7:s två ·
Del 8.8:s fem · Del 10.8:s kvarvarande · `.claude/**`-luckan · en ny född vid
skörden). Räkningen blev **14, inte elva** — handoffens varning *"summera dem
inte i förväg"* höll. `check:docs` **9/9**, grinden räknar **15 nummerlösa
fragment**. **STOPP — TVÅ KANDIDATER KUNDE INTE BELÄGGAS:** *autofix förvärrar
en falsk-positiv* + *husets `>`-separerade blockquote-stapling* fanns enbart som
stikkord i PAUSLÄGE; Del-text, dagens fem commits och configdiffarna genomsöktes
utan träff. **De skrivs inte på gissning — Marcus avgör: skriv eller förkasta
explicit** (ADR-053). Iakttagelsen skördad som eget fragment. **NÄSTA: A2:7
partitionerings-regeln + A2:5 landnings-ordningen kodad → A3 MSW-bytet
(`skipAssetRequests: false`) → konsolideringen av de 15 fragmenten från L360.
Byggplanens Fas E-horisont före planering mot ny ordning.** Numrering:
91/082/L360/T101/f46/task-53. Full narrativ: sessionsdok S91 **Del 11**.
*(Föregående fokus-text nedan.)*

**Session 91 ⏸️ PAUSAD (2026-07-27, fjärde pausen — inför fortsättning på ny
yta)** — **TREDJE RESUMEN SATTE RIKTNINGEN OCH STÄNGDE GRILLNINGEN.** Marcus
ordning: **Fas 6 stängs INTE** (appens sidor är inte byggda som han vill) →
**alla fem facit-lösa ytor genom full kedja** (Personer · Hem ·
Mer/Intresserade/Maillogg · Segment · Mail-handling) → **CI-arkitekturen FÖRST**
→ Fas E när sidorna är klara (två veckor = önskan, ej deadline). **90/10-kravet:**
~90 % av CI-arkitekturen ska överleva Supabase-bytet — och snittet fanns redan,
tidsbudget-passets *"gränsen går vid protokollet, inte vid läs/skriv"* ÄR
portabilitets-snittet. **ADR-080 mintad** (acceptance-klassen: klassbytet är
beslutet ej optimeringen · 19/13 vid protokollet · API-sviten flyttas ALDRIG ·
kontraktsvakten som VILLKOR · vakten i abort-läge). **ADR-081 mintad** (nummer
tilldelas vid landning: nummerlösa fragment i `tasks/lessons.d/`, numret sätts
där merge-grinden ändå serialiserar — **lesson-spärren LYFT**; grind + config +
self-test 6/6 + tvåsidigt rött-först; `check:docs` 8 → 9 grindar). Nyckeln kom ur
eget repo: **backlog-CLI:t hade redan mönstret.** **REPOT ÄR ORG-ÄGT PÅ
ENTERPRISE** sedan 11:15:43Z — merge queue-spärrens lager 1 upphävt, lager 2 står
(bokfört i tre artefakter); städningen klar (2 döda issue-länkar · origin ×2 ·
marketplace-källan, uppdateringsvägen skarpt prövad). **RESTLISTAN ÄR KANONISK
BÄRARE:** `tasks/s91-restlistan.md`, fem spår, avbockningsbar. **Marcus fråga
avtäckte A3b:** verktygsvals-prövningen fanns bara som engångs-order, ej stående
krav. **NÄSTA: `session-resume` av 91 → läs av PR #273:s CI (`ci-wait --pr 273`,
named flags) → skörda lesson-fragmenten → A2:7 + A2:5 → A3 MSW-bytet.**
Numrering: 91/**082**/L360/T101/f46/task-53. Full narrativ: sessionsdok S91
**Del 9–10** + PAUSLÄGE. *(Föregående fokus-text nedan.)*

**Session 91 (tredje resumen, 2026-07-27)** — **ANDRA RESUMEN LÖSTE
INSTRUKTIONSLEVERANSEN I GRUNDEN.** `code-role-discipline.md` **AVVECKLAD** (ADR-079 river ADR-042 öppet):
den levererades aldrig, formen saknar precedent (**0 av 9** undersökta
uppsättningar), den bar en **död grind** (§3.3 kvittens-före-commit — hade
STOPPAT arbetsflödet om leveransen börjat fungera) och ett **faktafel** (§6.4).
Bäraren är nu en **output style** i pluginet (`force-for-plugin`, systemprompt,
enda bäraren med inbyggd påminnelse). **Konstitutionen 217 → 192 rader** — under
200-riktvärdet för första gången; **tre döda pekare** bort (roll-disciplinen ·
`code-stoppa-format`-skillen som bott i tre-aktörs-arkivet sedan Chat-ytan
avvecklades · Lovable-guarden per Marcus-beslut). **Fyra hooks byggda och
testade** (`git add -A` 5/5 deny + 4/4 pass · AskUserQuestion · `backlog/tasks/**`
3/3+3/3 · datum-som-faktum). **Plugin 1.22.0**, reinstall körd. Grunden: **tre
parallella research-agenter** + en mätt inventering (158 regelpunkter: TVINGANDE
65 / KUNSKAP 48 / OMDÖME 41 / DÖD 4) — **Codes egen dubblett-hypotes ~50 % mättes
till 18 %** och redovisades öppet. `/to-prd`-sidofynd: frontmatter parsade aldrig,
skillen auto-upptäcktes ALDRIG — T100:s klass i miniatyr, med skärpningen att
verktyget som hade fångat det FANNS men aldrig kördes. **ADR-079:s FÖRSTA SKARPA
PROV ÄR KÖRT VID TREDJE RESUMEN — GRÖNT PÅ ALLA TRE KONTROLLER:**
`instructions-loaded.jsonl` bär två rader ur denna session (hub- + spoke-
`CLAUDE.md`, `reason: session_start`) ⇒ hooken lever · output stylen
**Code-rollen är aktiv i systemprompten utan att någon valt den**, och ingen
`outputStyle`-nyckel finns i någon av de fyra settings-filerna ⇒ `force-for-plugin`
är bäraren · transparens-rapporten skrevs i rätt form utan tillsägelse.
**Två mätta gap** (båda förväntade, nu mekaniskt belagda i stället för antagna):
`IDENTITET.md` + `profile.md` står ALLTJÄMT ej i loggen (väntar Marcus-beslut 3)
· hooken täcker CLAUDE.md-lagret men **inte** memory-lagret — `MEMORY.md`
levererades i systemprompten utan att logga en rad. **REPOT ÄR ORG-ÄGT PÅ
ENTERPRISE SEDAN 2026-07-27 kl 11:15:43Z** (org `high-five-group`, Marcus åtgärd i
förebyggande syfte, syftet var merge queue) — **MERGE QUEUE ÄR DÄRMED ÖPPEN, MEN
SLUTSATSEN STÅR:** research-passets nej kom i **två oberoende lager**, och lager 2
skrevs uttryckligen som "det som gäller även efter en org-flytt". Lager 1
(org-kravet) är **upphävt**; lager 2 håller, eftersom `merge_group`-bygg inte slås
ihop mot en global mutex — **bästa fallet oförändrade ≈27 min, default-fallet ≈55
min** om det tunga jobbet inte villkoras på `github.event_name`. Vinsten som
FAKTISKT är köpt är BEHIND-cykeln (L328), i koordination och latens — ej
väggklockan. **Materiellast:** öppen fråga 1 (`concurrency` × `merge_group`,
odokumenterad hos GitHub) var stämplad "ingen sådan drift är möjlig att observera
i dagens ägarform" — **den kan nu MÄTAS i stället för härledas.** Falsifieringen
bokförd i tre artefakter (research-passet · ADR-076 · processgranskningen
2026-07-23); eftergranskningen 2026-07-24 pekade själv ut org-flytten som rationell
nästa åtgärd om BEHIND-svälten fortsatte. Överföringen verifierad ofarlig:
ruleset `main-skydd` `enforcement=active` · 8 secrets · `marcus803` assignable
(ADR-077-larmet) · CI 8/8. **Enda äkta skadan: 2 döda issue-länkar** i
`session-89.md` (GitHub redirectar `/pull/N` men **inte** `/issues/N` efter
ägarbyte; CI ser det ej — autentiserad lychee följer överföringen). **ÄGARBYTETS
STÄDNING KLAR** (Marcus order punkt 1–3, mätt före åtgärd): av 191
`marcus803`-förekomster i md var bara **fyra** resurs-URL:er och **exakt två
brutna** — alla path-typer utom `/issues/N` ger 301; de 163 bara-förekomsterna är
`owner:`/`--assignee`/prosa som refererar PERSONEN och krävs av
`.frontmatter-policy.conf`. Två issue-länkar ompekade (de två fungerande
pull-länkarna lämnade — reparation ja, kosmetik i historiskt dok nej) · `origin`
ompekad i BÅDA repona, verifierad mot rätt SHA · **hub-repot är också flyttat**
(`high-five-group/marcus-system`, privat) och marketplace-källan ompekad via
verktygets egen väg (`marketplace add`, state backad upp först) — redirect-risken
mättes FÖRST och bar (`git ls-remote` mot gamla namnet gav `db645e7`), så
omkopplingen är robusthet ej akut fix; **uppdateringsvägen skarpt prövad**
(`marketplace update` exit 0, plugin 1.22.0 enabled + 17 skills + hooks +
output style intakta efteråt). **`check:docs` 8 GRÖNA** — helt grön första gången
denna dag. **NÄSTA:
Marcus-beslut 1 (Fas E) före all planering → verktygs-åtgärderna (punkt 3:
MSW-bytet med `skipAssetRequests: false`); CI-/grind-arkitekturen som EGET pass
med grillning — mätning före design.** **SEX MARCUS-BESLUT VÄNTAR** (Fas E-horisonten blockerar ·
`--mm-btn` vs `--mm-button` · IDENTITET.md-destillatet · länkgrindens form ·
grillningens fyra · **merge queue-aktiveringen**). Numrering: 91/**080**/L360 (LÅST till punkt 6)/T101/f46/task-53.
Full narrativ: sessionsdok S91 **Del 8** + PAUSLÄGE. *(Föregående fokus-text
nedan.)*

**Session 91 (andra resumen, 2026-07-27)** — **RESUMEN GAV SEX RESEARCH-PASS, FYRA
MEKANISERINGAR OCH TVÅ RIVNA EGNA SLUTSATSER.** Merge queue **STÄNGD** (batchar
ej `merge_group`-bygg + kräver org-ägt repo). Shardning **blockerad** (Airtable
ej klonbar). Push-kadensen **låg rätt**. **Hermetik-mätningen körd skarpt:** 865
restanrop, 86 % fonts, **19 av 32 filer rena enbart via font-pinning**; tre
körningar gav 118/118/118 staging-anrop. **Falsifierat:** "e2e skriver aldrig
till staging" — `skapa-event` skriver skarpt. **Branschpraxis-passet:** branschen
köper determinism genom **efemär backend**, inte mockning; vår delade staging är
lägst rankad hos Google + HOLD hos Thoughtworks; Ghost är vår manöver exakt —
men precedent för efemär backend mot icke-självhostbar SaaS är **tomt**.
**TVÅ EGNA SLUTSATSER RIVNA:** idempotens-fyndet föll när CI gav grönt (purge
före körning) · fråga 1:s rekommendation byttes helt efter att Marcus uppgav
Supabase-migrering **inom ett par veckor**. **VERKTYGS-LUCKAN AVTÄCKT (Marcus
fråga):** arkitektur researchades, **verktygsval inte** — fyra egenbyggen där
mogna verktyg finns (`npm-run-all` · `gh run watch` · MSW · Nx/`paths-filter`).
**Marcus order: behåll men INAKTIVERA det byggda, bygg om som proffsen** —
**scopet därefter KORRIGERAT** av verktygs-passet: tre av fyra egenbyggen var
motiverade, kvar står MSW-bytet + listparitets-grinden. Mekanisering 1–4 klara
(docs-klassning · `check:docs` · `ci-wait` exit 4 · hub §6 Delegering v1.3);
6–7 öppna. **RESUME 2026-07-27:** numreringen disk-verifierad oförändrad ·
T100:s research-pass startat (leverans-mekaniken, EJ samma fråga som det landade
§6-passet) · **nx.dev-fallet utrett:** länkarna är GILTIGA (200 lokalt + 0 errors
i grön CI-körning 30223666880), den röda main-körningen 30223287042 var
**transient** och överlevde lychees tre default-retries — `.lycheeignore` vore
fel verktyg, retry-härdning är rätt. **NÄSTA: T100-passets utfall → länkgrindens
form (`--offline` finns inbyggt = uppdelningen kräver ingen egen konstruktion) →
verktygs-åtgärderna → avsluta grillningen (4 obesvarade beslut) → de 19
acceptance-filerna.** **AVVIKELSE ATT LÖSA:** byggplanens Fas E säger `DEFER`
post-Fas 7, Marcus säger veckor — byggplanen är styrande och ska uppdateras
först. Numrering: 91/079/L360/T101/f46/task-53. Full narrativ: sessionsdok S91
Del 1–7 + Paushistorik. *(Föregående fokus-text för S91 nedan.)*

**Session 91 (första passet, 2026-07-26)** —
**DESIGN-REVIEWEN AV TASK-48, OCH DAGEN
DÅ ARBETSFORMEN BLEV SITT EGET ÄMNE.** **`task-48` är `Done`** — Marcus
granskade i webbläsaren och gav **fyra fynd**, alla åtgärdade i tre vågor:
Markera-knappens färg var en **facit-avvikelse** (bygget satte `primary`/`subtle`
mot S86-facits mörka solid, löste kollisionen mot §19:s toolbar-rad TYST och
skrev in sin egen lösning som prejudikat — rättat, och §19 bär nu
**lägesöppnar-undantaget**) · check-glyfen **riven** efter mätning (ovald kant är
transparent ⇒ markeringen är att en KONTUR UPPSTÅR, inte ett färgbyte; 5,6:1 mot
vitt, 3,2:1 i ljushet under `contrast-more`; den gröna plattan mäter 1,05:1 och
bär ingenting för den färgblinde) · Avbryt `ghost` → `primary`/`subtle` ·
Obekräftade-kön **inte längre fällbar** (kö mot register, L353-klassen — och
fällningen bar en dold lapp som force-öppnade panelen). **Våg 3 rev Codes egen
diagnos:** sågtanden kom ur BREDD inte höjd, och inom-kort-stabiliteten Code
intygade var en artefakt av fixturens e-postlängder (gamla koden: 166→166→**145**).
Batch-flödet **5 488 ms → 486 ms**, arkivet fälls ut när kön töms, kvittens vid
ren framgång (GOV.UK/Polaris-grundad). **Fyra agenter, elva PR:er** (#233–#245).
**Seed-vägen byggd** (`npm run seed:review`) efter Marcus fångst att samma jobb
gjorts för hand TVÅ gånger utan att lämna en väg — nu även i spoke-CLAUDE.md,
eftersom ett verktyg utanför läs-ordningen inte finns i praktiken.
**Hållplats-kartan** (#239): eventinfo har **ingen motor alls** — krysset skriver
två fält ingen kod läser — men Marcus ordning stämmer, slutbetalnings-deadline
och eventinfo-gränsen är SAMMA dag; `TASK-18.20` är **blockerad**, inte i
konflikt; rek. alternativ C (hållplats som etikett). **CI-FLASKHALSEN MÄTT:**
staging-jobbet är 9,1 av 10 min och bär en global mutex ⇒ alla PR:er
serialiseras; ~20 av 30 min var spill. **MÅLBILDEN inskriven:** människan väntar
aldrig SYSSLOLÖS — skärpningen är avsiktlig, noll väntan leder till att skära i
täckning. **Sju mekaniseringar** i Del 4, sex körbara direkt vid resume.
**INGA lessons mintade av Code** (L354–L359 förbrukade av vågornas agenter).
Ingen ADR (079 ledigt), inga fällor, inga trådar. **RESUMEN + DEL 6 KÖRDA
2026-07-26.** **Researchen klar — fyra pass mot primärkälla.** Merge queue är
**stängd** (batchar inte `merge_group`-bygg, och kräver org-ägt repo — vårt är
användarägt). Shardning **blockerad** (`parallelIndex` kolliderar över shards;
Airtables 5 anrop/s är per BAS; basen går ej att klona — beräknade fält read-only,
`Delete base` enterprise-only). Push-kadensen **låg rätt hela tiden** och
premissen bakom oron föll (worktree-svepet hoppar över träd med opushade
commits). **MÄTNINGEN VÄNDER BILDEN:** E2E-steget är 84 % av 9,25 min och
**skriver aldrig till staging** — 296 av 332 tester mockar redan. **74 % (6,8
min) är flyttbart**; hållningen 9,25 → ~2,4 min utan att skära i täckning, för
API-sviten står kvar och bär integrationsbeviset. **Mekaniserat:** punkt 1
(docs-klassningen — uppdraget pekade på FEL lista, luckan var fyra filer plus ett
befintligt fail-open i Vale-regressionssviten; kontrastbevis skarpt 14,3 min →
35 s) · punkt 2 (`npm run check:docs`, åtta grindar inte tre, saknat verktyg =
SKIPPAT aldrig grönt) · punkt 3 (`ci-wait` exit 4 = superseddad; v1 var grön mot
stubben och föll mot skarpt API). **Tre fel gjorda och fångade** — alla av
mekanisk verifiering, noll av eftertanke. PR #247–#250. **Punkt 4 LANDAD** (hub-PR #3+#4): `code-role-discipline.md`
**v1.3** med ny **§6 Delegering till subagenter** — partition före start, HÅRDA
FÖRBUD i briefen, **explicit gren-mutationsrätt**, ingen dubbelbevakning,
mottagning som hypotes; `SYSTEMET.md` §4 + tillståndsrad + ändringslogg synkade.
Ingen plugin-bump (`templates/` ligger utanför pluginet). **NÄSTA: punkt 6
(nummer-reservation — GRILLNINGSKANDIDAT) · punkt 7 (partitionerings-regeln —
rör Marcus eget arbetssätt, tas ej ensidigt) · E2E-utbrytningen ur mutexen
(ARKITEKTUR → grillning; mät-först per passets rangordning).** Öppet: 109 mergade fjärrgrenar · `ZZ-GRANSKNING-S91` lever i staging ·
`save-segment`-läckan saknar purge-target. Numrering: 91/079/L360/T100/f46/task-53
(fyra lesson-kandidater i Del 6, EJ mintade — punkt 6 först). Full narrativ:
sessionsdok S91 Del 1–6.

**Session 90 ✅ AVSLUTAD (2026-07-26)** — **MARKERA-LÄGET SKARPT, OCH TRE YTOR
SOM FICK SIN FORM.** **`task-48` levererad** (PR #226): byggt test-först,
**11 nya e2e röda före implementation → 17 gröna efter**, axe 0, med
rött-först-utfallet observerat lokalt (T92 (a):s recept — egen dev-server på
4183, Marcus 5173 orörd — därmed **empiriskt bevisat men fortfarande ohärdat**).
Tre former rivna i kod och spec: K46 per-kort-knappen, K47/K48 Bekräfta
alla-pillen, `useSendConfirmation`. Renderad verifiering (DoD #6): valt kort
`rgb(240, 253, 244)` = `--mm-success-bg` · kant `rgb(96, 107, 87)` =
`--mm-success` · batch-knappens bredd **205,89 px identisk vid 2 och 6 valda**
(breddlåset MÄTT) · kön 408 px mot `scrollHeight` 824. **Review-piloten gav
7 fynd + 3 småfynd, alla åtgärdade** — två träffade 11-ribban (fokus föll till
`document.body`; live-regionens attribut otestade) och **ett träffade Lottas
faktiska arbete** (ett `partial`-svar nollade hela markeringen). Kortet står
**`In Progress`** — DoD #5 design-review i webbläsaren är Marcus-moment.
**Tre prototyp-pass** (PR #227), körda som workflows med subagenter på
natt-chefs-order, **67 skärmdumpar över fyra bilagemappar:** Personer-listan
konvergens från EXAKT kopia i elva förfiningssteg med **två forkar kvar på
bild** (tonal mot zebra) · persondetalj divergens A/B/C med **tre defekter
dödade i alla tre = byggkrav oavsett vinnare** · check-in divergens A/B/C, noll
mutationer. **Research-passet VÄNDE check-in-forken:** "markera alla
närvarande" är **inte** ett dörr-mönster — noll av fem undersökta produkter bär
det vid dörren, så A9/A10 hör till registret och per-post-write till dörren.
En skrivväg per situation; ingen fork kvar att välja. **Check-in-underlaget
skarpt utan variantval:** A8 (`wfl1iYPrEmlKpEsRU`) live-verifierad mot prod —
`watchFields` är enbart `Status`, alltså skriver appen **aldrig** `Avstämt`;
allowlist-posten `set-attendance-status` låst med live-grund; generisk
`update-record`, **ingen ny EF**; kort-kartan 0–9 med tre variant-oberoende
skivor som kan börja omedelbart. Attribueringen (`Registrerad av` =
`lastModifiedBy` ⇒ token-ägaren, inte Lotta) står som öppen grillningsfråga.
**TASK-52 FÖDD** — persondetaljen faller för varje person med motivering
(`Motivering (text)` är en LOOKUP och returnerar array, schemat kräver
`z.string()`); live-verifierad, osynlig för alla grindar eftersom fixturvärlden
använder schema-trogna strängar. **TASK-27 fick sin första skarpa träff
bokförd** — CI-run 30178541626 föll 23:07 UTC på ett print-datum i task-17.7:s
svit, alltså i en HELT ANNAN svit än de två kortet kände till; deterministiskt
inom fönstret, tre retries räddade det inte, **landningen blockerad till efter
midnatt UTC**. **Hub-guarden korrigerad** (marcus-system PR nr 2) —
"Airtable MCP kan inte se automationer" gällde en av två servrar;
claude.ai-connectorn bär `list_automations`. **SKÖRD L349–L353**
[UNIVERSAL ×5] — L349 RAC:s roll bor på det dolda `<input>`, inte på träffytan ·
L350 ett 200-svar som inte är rent är inte ett lyckat svar · L351 en kategorisk
guard som är fel i halva sitt område får agenten att sluta leta · L352 en
Tailwind-variant i bas-strängen vinner över en villkorad grundklass · L353
research FÖRE prototyp när frågan är vilken mönsterklass problemet tillhör.
**Ingen ADR** (079 ledigt — närvaro-write-ADR:n mintas i check-in-PRD:ns
grillning efter variantvalet), inga fällor, inga trådar. Öppet vid dagens slut:
PR #226 + #227 omergade (#226 blockerad av TASK-27-klassen, #227 röd på
`Docs link check` med två 403-bottspärrar i research-dokets källförteckning —
`.lycheeignore`-klassen). **NÄSTA (NY session S91): (1) Marcus design-review
av `task-48` i webbläsaren (DoD #5) → Done-flipp · (2) variantvalen —
persondetalj A/B/C, check-in A/B/C, listans tonal/zebra-fork (L237: justeringar
i valfasen blir byggkrav) · (3) därefter PRD + skivor per yta, där
check-in-kartans kort 1–3 är variant-oberoende och kan börja direkt.
`TASK-52` plockbart fynd-kort. **GUIDEN: [`bilagor/s90-review-guide.md`](sessions/bilagor/s90-review-guide.md)** — körbar review-wizard som tar de fyra besluten i beroendeordning med URL:er, bildpar, skiljande frågor, fällor och ifyllnadsrutor; task-48-avsnittet bär facit-jämförelsen mot S86-bilderna + de åtta byggkraven som avprickningslista.** Numrering efter S90:
91/079/L354/T99/f46/task-53. Full narrativ: sessionsdok S90 Del 1–3 +
BUILD-LOG S90-post.

**Session 89 ✅ AVSLUTAD (2026-07-25)** — **QA-VANDRINGENS TRE FYND:
ALLA TRE HADE FEL GRUNDORSAK.** Korten skrevs kvällen innan ur QA-vandringen,
två med stämpeln `GRUNDORSAK (bevisad)` — symptomen var korrekta, steget till
orsak brast i samtliga. **TASK-51:** felet var saknad `--repo` (jobbet gör
ingen checkout), inte 403 — anropet dog före behörighetsprövningen. En fix på
kortets diagnos hade passerat ALLA lokala grindar och ändå inte löst buggen;
AC #1:s krav på **skarpt utfall** räddade den. Tvåsidigt bevis #216 (lögnen)
mot #217 (`ec3877f...4a3a58d`, compare-länk API-verifierad `ahead_by: 3`);
fältnamnet rättat utöver kortet; #114 fick efterspår. **TASK-49:** löst med
global `maxDiffPixels: 2000` — **ingen per-projekt-konfig**, eftersom
Playwrights källkod tar `Math.min` av absolut och ratio-tak. Talet MÄTT
(brusgolv **0 px** ×3 körningar · minsta äkta regression **11 357 px**);
premissen 4,26× rättad till maxvärde (fullPage ⇒ höjdberoende, 2,37–4,26×;
eventsidan tillät **201 772 px**). Utfall före 4 mobila/0 desktop → efter
**12/12**. AC #2 lämnad okryssad (källkodsbelägg ≠ två branschprojekt).
**TASK-50:** kortets mutex hade **rivit ett medvetet designval** —
ålders-guarden ersätter den, står ordagrant i `ci-suite.yml`. Verkligt fel:
`fetch()` utan try/catch (429 hade retry, nätverkslagret inget). Byggt
`fetchWithNetworkRetry` + 9 testfall, tre mot mockad fetch som räknar anrop.
Kollisionen öppet bokförd, EJ byggd bort. **SKÖRD L347–L348** [UNIVERSAL ×2]
— L347 AC mot utfall aldrig mot mekanism (ett åtgärds-AC kan bockas av med
buggen kvar) · L348 kommentar som förklarar frånvaro är ett designval.
**Ingen ADR** (079 ledigt), inga fällor, inga trådar. Fem PR:er gröna per
jobb (#214, #215, #218, #219, #220). **NÄSTA (NY session S90): `task-48`** (Marcus-bokförd)
→ Roger & Lotta-spåret (T95). **T87 avblockerad men oförändrat parkerad**
(linux-brusgolvet omätt tills grinden körs). Numrering efter S89:
90/079/L349/T98/f46/task-52. Full narrativ: sessionsdok S89 Del 1–3 +
BUILD-LOG S89-post. **T98 FÖRBRUKAD → nästa tråd T99** (parallell
utforsknings-session efter S89:s stängning födde
[`T98`](threads/T98-codex-pr-granskningslagret.md) — Codex
PR-granskningslagret; S82-precedenten för nummer taget efter kadens-raden).

**Session 88 ✅ AVSLUTAD (2026-07-25)** — **T85-KORRIGERINGSFÖNSTRET:
PAKETET BETALT, TRE FYND UR QA-VANDRINGEN.** Tolv landningar
(PR #199–#211 + hub-PR #1), alla gröna per jobb utom en självförvållad
röd. **Codex tre mätpåståenden höll alla tre** — det tredje skarpare än
granskaren visste: `redRuns` läste bara `failure`, så måttet hade räknat
repots egen `startup_failure` (run 30038460735, L326) som *inte röd*.
**Nattvakten byggd på research-grundat beslut C** (Marcus delegerade
efter web-research-disciplinen): SRE-checklistan delar problemet längs en
gräns som finns i koden, Prometheus Watchdog är precedenten, och
researchen fann **inget** projekt där en extern vakt ersatte det interna
larmet. Grace mot **uppmätt** drift, dedup, bevis-läge; rekursionen öppet
bokförd. **Punkt 4 bar två fällor** (ingen PATCH för rulesets ·
ADR-076:s kanoniska JSON hade driftat och hade tyst nollat tre fält).
**Punkt 5 föll Codes egen misstanke** — timezone finns sedan 2026-03-19,
prövat tvåsidigt mot den PINNADE actionlint. **QA-VANDRINGEN utförd av
Code på Marcus delegation** (10/12 punkter, två öppet oavklarade) gav
**tre fynd skivornas egna bevis missat: TASK-49** (visual-grinden blind
på desktop — 4/6 mobila fångade, **0/6 desktop**; ratio-tröskel mot
4,26× större yta) · **TASK-50** (purge rör staging utan mutex) ·
**TASK-51** (nattlarmets commit-spann har ALDRIG fungerat — saknar
`actions: read`, felet sväljs tyst; ärende #114 bär samma text sedan
2026-07-23). **Fyra beslut:** kortformalian A · QA:n C · nightly-visual
A (**TASK-49 stärkte det i efterhand**) · **merge-only A, verkställd**.
**SKÖRD L344–L346** [UNIVERSAL ×3] — L344 bärgad ur övergivna PR #192
(osäkrad i tio timmar utan att L-serien visade det) · L345 grind-kvitto
gäller en commit, inte en session · L346 testplaner som frågar "räcker
resultatet?" mäter värdet. **Ingen ADR** (079 ledigt), inga fällor, inga
trådar. **NÄSTA (NY session S89): de tre QA-fynden** i ordning TASK-51 →
TASK-49 → TASK-50, därefter task-48 → Roger & Lotta-spåret (T95).
**T86-beslutet avblockerat av T85 men spärrat av n=6; escapes-räkne-regeln
avgjordes INTE och kvarstår öppen.** Numrering efter S88:
89/079/L347/T98/f46/task-52. Full narrativ: sessionsdok S88 Del 1–3 +
BUILD-LOG S88-post.

**Session 87 ✅ AVSLUTAD (2026-07-25)** — **STÄD-VÅGEN: DEN OBETALDA
RÄNTAN BETALD.** Fem PR:er (#193–#197), alla gröna per jobb, strikt
seriellt landade (merge-grinden gör parallella landningar långsammare, ej
snabbare — L328). Föregicks av en **spaning med nio läsande subagenter**
(0 fel, ~15 min, 483 verktygsanrop, ~1,38 M tokens) vars fyra fynd ändrade
planen innan den verkställdes: **ingen frontend-deploy existerar** (Roger &
Lotta-spårets grind 0 är alltså obyggd) · **Personer + persondetalj är
redan byggda** men förfacit ⇒ ombyggnad, ej nybygge · L340 spred aktivt en
bugg · backlog-kön var tom. **Granskningsrundan rev två av Codes egna
rekommendationer:** T85-låsningen blockerar INTE produktarbete (står
ordagrant i meningen efter), och arkitektur-landningen behövde inte röra
ci.yml (0 URL:er verifierat — agentens rekommendation var internt
motsägelsefull). **LEVERERAT:** `scripts/ci-wait.sh` + 13 testfall
(T1 rött-först-bevisad: trasig form 30 s, läkt 0 s; skarpt 3 s där idiomet
kostade nio minuter) + **L340 amenderad** · arkitektur-korpusen
vendoriserad + destillat (**kärnfynd: AI-assistenten är ett tvärsnitt över
allt byggt, inte en fas — dess verktyg wrappar vårt befintliga
operations-register**) · **T79** uppdaterad, **T92** + **T93** födda ·
task-48 kompletterad till enda plockbara kortet. **INCIDENT → L343**
[UNIVERSAL]: PR #195 gick röd på shellcheck efter att Code rapporterat
grönt — default-flaggor mot grindens `--enable=all`; skärpningen är att
`ci.yml` HADE greppats men installations-steget lästs i stället för
kör-steget. **Ingen ADR** (079 ledigt), inga nya fällor. **NÄSTA (NY
session S88): T85-KORRIGERINGSFÖNSTRET** → task-48 → Roger &
Lotta-spåret. Numrering efter S87: 88/079/L344/T98/f46/task-49. Full
narrativ: sessionsdok S87 Del 1–3 + BUILD-LOG S87-post.

**Session 86 ✅ AVSLUTAD (2026-07-25)** — **NATTBYGGET 6/6 + MORGONGRANSKNINGENS
TRE FIX-VÅGOR.** `/work-batch` max-kort 6 levererade hela event-familjens
återstod i ADR-076-form, **CI grön FÖRSTA PASS i samtliga led**, 0 halt
(17 agenter · ~6,7 h · ~2,3 M subagent-tokens · 1055 verktygsanrop).
**v1-incidenten → L340** [UNIVERSAL]: Monitor-callback når aldrig
workflow-subagenter (L323-repris) → **bygg/svans/verify-splitten** införd,
inget kort byggdes om. **F6** (18.16 på effort `low`): 28,7 min mot
jämförbara 28,1 — ingen avvikelse; de tre fix-vågorna träffade uteslutande
default-effort-skivor. **Morgongranskningen i tre iterationer**
(PR #188/#189/#191 + prototyp-svarfångst #190): **§19 FACIT-REVIDERAD till
intent × emphasis** (research-belagd, AA-vakt på success-outline) ·
**facit punkt 8:s "aldrig autoFocus" rivet öppet** (RAC:s egen prop läker
ett rAF-race som e2e inte kunde se) · rubriken ska RYMMA namnet, inte
klippa det · popovern matchar triggerbredden · fokusringens tre
samverkande CSS-regler. Grundorsaker lästa ur react-arias källa →
**L341** (`until-found` + `content-visibility`) + **L342**
(`scrollbar-gutter` förskjuter canvas-origo). **FIX-VÅGENS TIDSFORENSIK:**
71 min 14 s varav **23,5 min (33 %) död väntan** från idiomet
`tail -f | grep -m1` — **som L340 självt föreskriver**; 16,9 min var
kontrakts-obligatorisk CI-tid och ~20,6 min verkligt arbete
(`ee021eb` = 17 filer / +552 rader). **SKÖRD: task-39–48 · T91 ·
L339–L342** [UNIVERSAL ×4]. T86:s escapes-kolumn **omtriagerad neutralt
i två dimensioner** (diff-synliga vs browser-only) — räkne-regeln avgörs
i T85-sessionen per sekvenslåsningen. **NÄSTA (NY session S87 —
STÄD-VÅGEN): S86-stängning → `scripts/ci-wait.sh` + L340-amendering →
arkitektur-korpusen till `docs/reference/` → task-48 efter länk-forken.
Därefter Marcus vägval: T85-korrigeringen (bindande före T86-beslutet +
vidare CI-utbyggnad — men **blockerar INTE produktarbete**, verifierat i
T85:85–91) vs Roger & Lotta-spåret (grind 0 = frontend-deploy, som
saknas HELT). Bakgrund: hub-lyftet L284–L342 · konventions-grillningen ·
dependabot #162/#65 · Marcus-moment: Update-klicket i claude.ai.**
**T92 mintad** (agent-mekanikens två obetalda poster ur fix-vågs-forensiken).
Numrering efter S86: 87/079/L343/T93/f46/task-49. Full narrativ:
sessionsdok S86 Del 1–4 + BUILD-LOG S86-post.

**Session 85 ✅ AVSLUTAD (2026-07-25)** — **DUKNINGEN FÖR NATTBYGGET:
main läkt + go-redo för S86.** Audit-grinden läkt: `GHSA-mh99-v99m-4gvg`
(high, brace-expansion, publ 21:53Z — ~20 min före S83:s sista
merge-run som gick röd på main) → override **5.0.8**, **PR #169**;
full svit-bevis lokalt (376/376 API) + main-merge-run 30132229085 grön
per jobb (**36.4-dedupens första skarpa config-klass-träff**). Städ:
S84-worktreen riven (0 unika) · 50 mergade lokala brancher rensade
(`proto/*` orörda) · odoo-branchen kvar (Marcus-beslut). Kortläget
re-verifierat via backlog-CLI: ready-for-agent ×6, externa deps Done
×4. **GO-YTAN: `tasks/sessions/bilagor/s85-nattbygget/batch-order.md`**
(max-kort 6 · ADR-071-kontraktet i ADR-076-form · rött-först S80 ·
halt-first · pilot-logg T86 · F6-förslag 18.16 · konventions-bilagan =
L337-skyddet, öppet märkt läskopia). **SKÖRD L338** [UNIVERSAL] (grön
PR-run = ögonblicksbild av omvärlden). **NÄSTA (NY session S86):
NATTBYGGET på Marcus "go"** — ordern i bilagan är batch-kvittot →
morgongranskning → T85-korrigeringsfönstret · konventions-grillningen
(/grill-me) · hub-lyftet L284–L338 vid hub-sync · dependabot #162
Marcus-review · Marcus-moment: Update-klicket i claude.ai. Numrering
efter S85: 86/079/L339/T91/f46/task-39. Full narrativ: sessionsdok S85
Del 1–3 + BUILD-LOG S85-post.

**Session 83 ✅ AVSLUTAD (2026-07-24)** — **PROTOTYP-PASSEN INFÖR
NATTBYGGET: ready-for-agent ×6 NÅDD, nattbygget är körbart** (17.7 ·
18.15 · 18.16 · 18.17 · 18.18 · 18.19). Fyra konvergens-pass låsta av
Marcus i browsern; pass 4 (eventväljar-paret) tog sju iterationer:
18.19 **variant A** · 18.18 tomt/valt som TVÅ TILLSTÅND med progressive
disclosure (disabled-fälten revs), sök, månadsgruppering,
beläggningsstapel. Research avgjorde tre val (Linear/Rails/Jira →
route-alternativ b · USWDS-tröskeln · progressive disclosure).
**INSTANT-KRAVET föddes → ADR-078 mintad** (Marcus-order): navigering
väntar aldrig på data vi redan har — bevisad i skarp kod **PR #163**
(1315 → **278 ms**, CLS 0,000). Tråd **T90** (laddupplevelsen +
belastningsbeslutet). **SKÖRD L333–L337** [UNIVERSAL ×4] — prototypkod
per iteration · `git restore` destruktivt · HTTP 500 ≠ skrivning
uteblev · vakt utan verifiering. Incidenter öppet bokförda:
js-yaml-advisoryn mitt i passet (PR #160) · GitHub-outage ·
dataförlust ×2 (återskapade + verifierade) · nummerkollision med S84
(L330–L332 → omnumrering, PR #167). **ÖPPET: KONVENTIONS-HEMMET**
(Marcus-order, grillnings-/ADR-klass — sessionsdok Del 7).
**NÄSTA (NY session S85): nattbygget** (work-batch, max-kort 6,
pilot-skivor 1–6) → morgongranskning → T85-korrigeringsfönstret ·
konventions-hemmet · hub-lyftet L284–L337 vid hub-sync-moment ·
Marcus-moment: Update-klicket i claude.ai. Numrering efter S83:
85/079/L338/T91/f46/task-39. Full narrativ: sessionsdok S83 Del 1–8 +
BUILD-LOG S83-post.

**Övning 2 (session 51 →)** — epok-ramen per [ADR-068](../docs/decisions/ADR-068-ovnings-ramverket.md); byggplanen är Övning 2:s karta.

**Fas 5.5 — Vertikal write-slice: staging-miljön KLAR ✅; deny/allow-grinden avblockerad.** Server-kontraktet levererat och CI-grönt (operation `mark-registration-fee-paid` → `Anmälningsavgift`, ADR-049). Den isolerade staging-miljön är byggd (ADR-050 bygg-sekvens 1–7 komplett) och hela staging-testsviten grön (41 passed/0 skipped). **Nästa: Fas 5.5 klient-UI (K2) i ny session** (peka bakåt på session 18; en stängd session resume:as ej — ny sessions-yta, ADR-052/L124).

**Session 20 ✅ (lifecycle-fält, ADR-052) + Session 21 ✅ (tråd-arkitektur, ADR-053) KLARA. RESUME av session 19: bygg-steg 3–7 KLARA — ADR-050 staging-migration KOMPLETT (2026-06-15).** Hela sekvensen landad: ADR-050 + förarbete → empirisk läsning + schema-check CLEAN (3) → staging-secrets (4) → 6 EF:er deployade via bare CLI (5) → CI-test-secrets repointade mot staging, väg b (6) → CORS + deny-tester av-skippade (7a) → seedad post + allow-test med restore-teardown (7b). Staging-testsvit: **41 passed/0 skipped**. `staging==prod`-defekten (L110) strukturellt stängd. Återstår (ej staging): Fas 5.5 K2 klient-UI.

### Session 87 ✅ AVSLUTAD (2026-07-25) — Städ-vågen: den obetalda räntan betald

> Scope: sessionsdok `2026-07-25-session-87.md` Del 1 (kanonisk plats).
> Marcus-kvitterat 2026-07-25 ("helt i linje med dina rekommendationer",
> BESLUT 1 alt. A) efter granskningsrunda som reviderade två antaganden.
> Underlag: `bilagor/s87-spaning/` (nio läsande agenter). Kadensrad per L67.

- [x] **S86-stängningen** (2026-07-25): PR #193 mergad, `6d49a02`, main
  grön per jobb (Docs link check körd + grön, Test suite dedup-skippad).
  Del 3–4 + BUILD-LOG-post + T86-omtriage + **T92** mintad.
  **NÄSTA: dok-födelse.**
- [x] **Dok-födelse + spanings-bilagan** (2026-07-25): PR #194 mergad,
  `3cf2add`. S87 Del 1 + `bilagor/s87-spaning/` (nio rapporter, 220 kB +
  README med proveniens och läsvarning — två agent-fynd visade sig
  felaktiga eller internt motsägelsefulla vid granskning och är utskrivna
  som sådana). **NÄSTA: `scripts/ci-wait.sh`.**
- [x] **`scripts/ci-wait.sh` + L340-amendering + L343** (2026-07-25):
  PR #195 mergad, `3cf2add`→`f1ee01e`, grön per jobb. Bounded poll med
  terminal-kontroll FÖRE första sömnen + per-jobb-verdikt (ADR-071
  §2(iii)) + skippade jobb märkta som icke-bevis (L322). 13 testfall,
  gh-stub, noll nätverk; T1 rött-först-bevisad (trasig form 30 s, läkt
  form 0 s). Skarpt: 3 s på en avslutad main-run där idiomet kostade nio
  minuter. **INCIDENT — egen falsk-grön verifiering:** PR:en gick RÖD på
  shellcheck sedan jag rapporterat grönt; jag körde default-flaggor, CI
  kör `--severity=style --enable=all` och alla sex fynden låg i
  optional-mängden. Sex fynd åtgärdade i sak, inga suppressions →
  **L343** [UNIVERSAL]: grindens ANROP är kontraktet, inte verktygets
  namn. Andra fångsten i samma svans: `--pr` latchade på föregående
  körning (PR-API:ts head lagrar efter push) → skriptet visar nu följd
  commit-SHA, och `--commit "$(git rev-parse HEAD)"` är dokumenterad väg.
  **NÄSTA: arkitektur-korpusen.**
- [x] **Arkitektur-korpusen** (2026-07-25): PR #196 mergad, `60745cc`,
  grön per jobb (config-klass → full svit, ej docs-dedup). Rå-doket
  vendoriserat + destillat/gap-analys per Pocock-precedenten, men med
  **snävare exkludering** — bara källfilen, inte hyllan, så destillatet
  grindas som den egna prosa det är. **ci.yml ORÖRD** (0 URL:er + 0
  relativa länkar verifierat — spanings-agentens rekommendation var
  internt motsägelsefull). Kärnfynd: AI-assistenten är ett **tvärsnitt
  över allt byggt**, inte en fas — dess verktyg wrappar vårt befintliga
  operations-register. **T79** uppdaterad (två av tre öppna frågor
  besvarade + publicerings-divergensen utskriven), **T93** registrerad.
  Ingen ADR, ingen byggplans-edit — båda med skäl i klartext.
  **NÄSTA: task-48 (STOPPAD på Marcus-beslut).**
- [x] **task-48 kompletterad och plockbar** (2026-07-25): Marcus-beslut
  bokförda på kortet — **väg A** (länkarna vilar ⇒ rå RAC Checkbox per
  BorOverRad-precedenten, ingen GridList, ~3–4,5 h) och **enskild
  bekräftelse accepterad som riven** eftersom 1-klick-interaktionen byggs
  på **Hem-vyn** i stället; genvägen flyttas dit den hör hemma. Kortet fick
  DoD #5 + #6, serialiserings-not mot TASK-47, förälder-not mot TASK-18
  och `ready-for-agent` — **enda plockbara kortet i kön**.
  `proto/s86-deltagarkort-markering` pushad som försäkring (mergas ALDRIG).
  **ÖPPET BOKFÖRD SCOPE-REDUKTION:** bygget ingick i S87:s scope men
  flyttas till kommande session på Marcus beslut att stänga här.
- [x] **Stängnings-landningen** (2026-07-25, denna PR): sessionsdok
  **Del 2–3** (fyra landningar + spaningens fyra premiss-ändrande fynd +
  granskningsrundans två rättelser + L343-incidenten + transcript-ref) ·
  **BUILD-LOG S87-post** · denna kadens. **NÄSTA (NY session S88):
  T85-KORRIGERINGSFÖNSTRET** — Marcus-beslut; billigaste stunden att röra
  CI är när ingenting är i luften och just nu finns noll öppna PR:er.
  Avblockerar T86-beslutet + **T87**, där task-48:s avsiktliga
  baseline-drift ska landa. Sessionen BÖRJAR med att verifiera Codex tre
  mätpåståenden mot `scripts/ci-metrics.mjs` (hypotes-regeln gäller även
  extern granskare). Därefter: task-48 → Roger & Lotta-spåret (grind 0 =
  frontend-deploy, saknas HELT; grillning + tre ADR:er). Bakgrund:
  hub-lyftet L284–L343 · konventions-grillningen ·
  arkitektur-placeringens epok-grillning (T93/T79) · dependabot #162/#65 ·
  Marcus-moment: Update-klicket i claude.ai.

### Session 86 ✅ AVSLUTAD (2026-07-25) — Nattbygget 6/6 + morgongranskningens tre fix-vågor

> Scope: sessionsdok `2026-07-25-session-86.md` Del 1 (kanonisk plats):
> nattbygget — de sex ready-for-agent-skivorna via /work-batch per
> S85-dukade batch-ordern (ordern är batch-kvittot; Marcus "GO på S86"
> 2026-07-25). Kadensrad per L67.

- [x] **Dok-födelsen** (2026-07-25): `aa89793`, PR #173 mergad.
  Förkravs-re-verifieringen grön (main per jobb · ready-for-agent ×6 ·
  plugin 1.20.1 · audit Passed · numrering 86/079/L339/T91/f46/task-39).
  **NÄSTA: batch-avfyrningen.**
- [x] **v1-avfyrningen + incidenten** (2026-07-25): sekventiell
  do-work-loop; 17.7 LEVERERAD (PR #174) men agenten parkerade på
  Monitor-callback för CI-väntan → schema-retur uteblev → workflow-fel.
  L323-repris, öppet bokförd. Ingen kod förlorad, inget kort studsat.
  **NÄSTA: v2-omstart med rot-orsaks-fix.**
- [x] **v2-batchen KLAR 6/6, noll halt** (2026-07-25):
  bygg/svans/verify-split (L323-formen). 17.7 + 18.15 **REVIEW_READY**
  (Done-flippen är Marcus) · 18.16 (F6, effort low) + 18.17 + 18.18 +
  18.19 **Done**. PR #174–#185 alla mergade, CI grön FÖRSTA PASS per
  jobb i samtliga led. Skörd: task-39–47 (9 fynd-kort) · T91 · L339 +
  L340 [UNIVERSAL ×2] · pilot-loggrader ×6 i T86 · F6-rådata i T89.
  Full narrativ: sessionsdok Del 2.
- [x] **Bokförings-landningen** (2026-07-25): sessionsdok
  Del 2 + L340 + T89 § F6-mätningen + kadens. **NÄSTA (Marcus
  morgongranskning): granskningsvågen i browsern = pilot-loggens
  escapes-facit → Done-flippar 17.7/18.15 + kvittenserna (18.18 ×3 ·
  18.19 AC#2 · 18.16 danger→success + K77 · 18.17 DONE-klassningen) →
  därefter T85-korrigeringsfönstret (sekvens låst) ·
  konventions-grillningen (/grill-me) · hub-lyftet L284–L340 ·
  dependabot #162/#65 · Marcus-moment: Update-klicket i claude.ai.**
- [x] **Done-flippar + escapes-facit** (2026-07-25): PR #187 —
  17.7 + 18.15 Done på Marcus kvittens ("OK" · "Nummerrutorna är ok");
  T86:s escapes-kolumn ifylld ur våg 1. **NÄSTA: fix-vågen.**
- [x] **Granskningsvåg 1** (2026-07-25): PR #188 + fixup `9521be8`
  (två testdefekter ur PR-CI:s första pass). Fem Marcus-beslut —
  18.19 nowrap · 18.18 fast triggerbredd · **18.16 §19 FACIT-REVIDERAD
  till intent × emphasis** (beslut A, AA-vakt på success-outline) ·
  18.17 "Frågor" · 17.7 filterpanelens grå rand (grundorsak i
  react-arias `useDisclosure` → **L341**). **NÄSTA: omgranskning.**
- [x] **Granskningsvåg 2 + iteration 2** (2026-07-25): PR #189 +
  `a79e381`. Rubriken ska RYMMA namnet (pillen viker deterministiskt
  under h1 vid 390) · autofocus-racet läkt med RAC:s egen prop —
  **facit punkt 8 rivet öppet** · popovern matchar triggerbredden
  (form B, `--trigger-width`). Overlay-origo-grundorsaken → **L342**;
  ny lokal bevisform uppfunnen (preview-mätloop 4183, ej härdad).
  **NÄSTA: prototyp-svarfångst + våg 3.**
- [x] **Prototyp-svarfångsten** (2026-07-25): PR #190 — deltagarkortens
  bekräftelseknapp löst med NYTT INTERAKTIONSFLÖDE i st.f. färgjustering;
  divergens A/B/C → A vald → konvergens → Marcus-låst. Facit =
  **task-48** (8 byggkrav) + k04-snapshots. **NÄSTA: våg 3.**
- [x] **Granskningsvåg 3** (2026-07-25): PR #191 — sökrutans fokusring
  deterministisk (tre samverkande CSS-regler var grundorsaken till
  modalitetsflimret) + grått rensa-kryss. Bevis mot levande dev-server.
  **NÄSTA: stängningen.**
- [x] **Stängnings-landningen** (2026-07-25, denna PR): sessionsdok
  **Del 3–4** (de tre vågorna + prototyp-svarfångsten + fix-vågens
  tidsforensik + transcript-ref) · **BUILD-LOG S86-post** ·
  T86-escapes **omtriagerad neutralt i två dimensioner** (diff-synliga
  vs browser-only; räkne-regeln avgörs i T85-sessionen) · denna kadens.
  **NÄSTA (NY session S87 — städ-vågen): S86-stängning →
  `scripts/ci-wait.sh` + L340-amendering (löpande ränta 6–9 min/CI-cykel)
  → arkitektur-korpusen till `docs/reference/` (rör EJ ci.yml — 0 URL:er)
  → task-48 efter länk-forken. Därefter Marcus vägval: T85-korrigeringen
  (bindande före T86-beslutet + vidare CI-utbyggnad — men **blockerar
  INTE produktarbete**, verifierat i T85:85–91) vs Roger & Lotta-spåret
  (grind 0 = frontend-deploy, som saknas HELT — ingen hosting-config,
  ingen deploy-workflow). Bakgrund: hub-lyftet L284–L342 ·
  konventions-grillningen · dependabot #162/#65 · Marcus-moment:
  Update-klicket i claude.ai.**

### Session 85 ✅ AVSLUTAD (2026-07-25) — Dukningen för nattbygget: audit-läkningen + go-redo för S86

> Scope: sessionsdok `2026-07-25-session-85.md` Del 1 (kanonisk plats):
> läk audit-grinden + städa + duka nattbygget så S86 startar på ett
> Marcus-"go". Marcus-kvitterat i sessionsordern 2026-07-25.
> Kadensrad per L67.

- [x] **Audit-läkningen** (2026-07-25): `GHSA-mh99-v99m-4gvg` (high,
  brace-expansion, publ 21:53Z — 20 min före S83:s merge-run som gick
  röd) → override 5.0.8, **PR #169** mergad; main-merge-run
  30132229085 grön per jobb (Test suite dedup-SKIPPAD, 36.4:s första
  skarpa config-klass-träff). Full svit lokalt före push (376/376
  api). **NÄSTA: dok-födelse.**
- [x] **Dok-födelse** (2026-07-25): `31fea35`, PR #170. Numrering
  disk-verifierad (85/079/L338/T91/f46/task-39 — nattbygget = **S86**).
  **NÄSTA: städ + dukning.**
- [x] **Städet** (2026-07-25): S84-worktreen riven (0 unika commits,
  verifierat före riv) · 50 mergade lokala brancher rensade
  (`proto/*` ×5 orörda) · `odoo-autonomous-test-plan` kvar
  (2 unika, Marcus-beslut). Kortläget re-verifierat via backlog-CLI:
  ready-for-agent ×6, externa deps Done ×4.
- [x] **Dukningen** (2026-07-25, denna PR): sessionsdok Del 2 +
  **batch-ordern** `tasks/sessions/bilagor/s85-nattbygget/batch-order.md`
  (ADR-071-kontraktet i ADR-076-landningsform · rött-först per
  S80-amenderingen · halt-first · pilot-loggrad per skiva ·
  F6-förslag: 18.16 · konventions-bilagan = L337-skyddet, öppet märkt
  läskopia — hemfrågan förblir grillnings-klass). **NÄSTA:
  session-end på Marcus coverage-kvittens → S86 NATTBYGGET på Marcus
  "go" (ordern är batch-kvittot).**
- [x] **Stängningen, pre-kvittens** (2026-07-25, denna PR): skörd
  **L338** [UNIVERSAL] (grön PR-run = ögonblicksbild av omvärlden) +
  BUILD-LOG S85-post + sessionsdok Del 3 med transcript-ref
  (472 rader / 1 018 925 byte, wc-verifierat). Ingen ny ADR (öppet
  motiverat) · inga nya trådar (ADR-053-triagen: allt registrerat).
  **NÄSTA: Marcus coverage-kvittens → `lifecycle: closed` +
  rubrik-flipp → S86 nattbygget.**
- [x] **STÄNGD** (2026-07-25, denna PR): Marcus coverage-kvittens
  **"Inget att säkra, flippa"** → `lifecycle: closed` + denna
  rubrik-flipp + toppblock. **NÄSTA ARBETE = NY YTA (S86):
  nattbygget på Marcus "go" — ordern i
  `tasks/sessions/bilagor/s85-nattbygget/batch-order.md` är
  batch-kvittot.**

### Session 77 ✅ AVSLUTAD (2026-07-23) — Processgransknings-landningen: merge-grinden mekaniserad + riskanpassad CI-design

> Scope: sessionsdok `2026-07-23-session-77.md` Del 1 (kanonisk plats):
> svara upp processgranskningens fynd — våg 1 exekverad + våg 2 designad.
> Marcus-kvittens "Kvitterar. Kör." 2026-07-23. Kadensrad per L67.

- [x] **Dok-födelse** (2026-07-23): `d913850`, run 30021430017 grön per
  jobb. Numrering disk-verifierad (77/076/L321/T85/f45/TASK-36 + FYND:
  BUILD-LOG S75-postens 076-fel → rättat i steg 0). **NÄSTA: steg 0.**
- [x] **Steg 0 — svars-sektionen + erratum** (2026-07-23): Codes
  verifikation + beslutsläge in i processgranskningen `f9ef244` +
  BUILD-LOG-rättelsen `ad1fb1f`; run 30021555024 grön per jobb. Sista
  direktpush-era-landningarna. **NÄSTA: steg 1 ruleset.**
- [x] **Steg 1 — MERGE-GRINDEN AKTIVERAD** (2026-07-23): ruleset
  `main-skydd` (id 19627609; PR-krav 0 approvals + required check "CI
  Passed or Skipped" strict + force-push-/deletion-block + TOM bypass) +
  `allow_auto_merge`. Grind-bevis: direktpush AVVISAD (remote rejected,
  regelutslag i klartext) · konfig-återläsning · PR #99 BLOCKED→
  auto-merge. ALL bokföring via auto-merge-PR hädanefter (beslut A).
  **NÄSTA: steg 2+3 ci.yml-PR.**
- [x] **Steg 2+3 — ci.yml-vågen** (2026-07-23, PR #99 `36f06ef`,
  run 30022170992 grön per jobb + AUTO-MERGAD): actionlint
  release-pinnad + SHA256 (utelämning #3 stängd) · Test+Build →
  test-fast/a11y/test-staging (mutexen ENDAST staging; depbot-gruppen
  retirerad) · bärar-invarianten 4→3 (skript + 7/7-testsvit).
  Split-empiri första skarpa runnet: Pure+Build-signal 29 s (förr ~10
  min) · a11y 1:32 parallell · staging 8:35 ensam på mutexen. **NÄSTA:
  steg 4 docs-PR.**
- [x] **Steg 4 — dokumentation + upptag** (2026-07-23, denna PR):
  ADR-076 (merge-grinden; katalograd + räkning 75→76) · ADR-029-noter
  (#3 migrerad, #5 STÄNGD) · ADR-039-not (bärare 6→5) · CONTRIBUTING
  (PR-flödet mekanisk sanning + jobb-namn) · våg 2-designen →
  `docs/research/riskanpassad-ci-design-2026-07-23.md` · tråd **T85**
  (rad + kort) · sessionsdok Del 2–3. **NÄSTA: end-pass på Marcus
  signal.**
- [x] **End-pass** (2026-07-23, PR nr 101): skörd **L321** [UNIVERSAL]
  (deferral utan återbesöks-bärare = tyst permanent;
  MD004-quote-kandidaten FÖRKASTAD som L222-instans med motiv) ·
  BUILD-LOG S77-post · sessionsdok Del 4 + transcript-ref (2 287 081
  bytes). **NÄSTA: incident-läkningen.**
- [x] **END-PASS-INCIDENTEN + aggregator-fixen** (2026-07-23, fix-PR):
  PR nr 101 auto-mergades RÖD — L149-recidiv släppte MD038 till PR:n,
  aggregatorn SKIPPADES vid failure och skippad required check räknas
  som uppfylld (fail-open; runs 30023934304/30024005788) → main rött,
  backstop-fångat → fix-PR: rad-178-läkningen cherry-pickad +
  `ci-passed` FAIL-CLOSED (kör alltid, failar explicit) + **L322**
  [UNIVERSAL] + ADR-076-not. Bevis-skuld: fail-grenens gate-proof →
  T85 våg 2a. Numrering efter S77: 78/077/L323/T86/f45/TASK-36.
  **NÄSTA: Marcus coverage-kvittens → stängnings-PR (`lifecycle:
  closed` + todo-flipp) · därefter NY yta: våg 2a/2b/2c per T85 i
  Marcus-takt · hub-lyftet L284–L322 vid hub-sync-moment ·
  Marcus-moment: Update-klicket i claude.ai.**
- [x] **STÄNGD** (2026-07-23, stängnings-PR): Marcus coverage-kvittens
  **"Det är bara att flippa."** (coverage + fråga 3 = inget att säkra)
  → `lifecycle: closed` + denna rubrik-flipp. PR nr 102 SHA-verifierat
  mergad (fail-closed-aggregatorn PÅ main); incident-backstopen vaktas
  i bakgrund. **NÄSTA ARBETE = NY YTA (S78): våg 2a/2b/2c per T85.**

### Session 76 ✅ AVSLUTAD (2026-07-22) — T80/T81/T82-mellansessionen + TASK-29-railen godkänd + mekaniska CI-vakt-grinden

> Scope: sessionsdok `2026-07-22-session-76.md` Del 1 (kanonisk
> plats): ordningsfrågans verkställande — egen mellansession FÖRE
> S75-resumen (S75 står pausad orörd; batch-huvudspåret vid resume
> oförändrat). Kadensrad per L67.

- [x] **Dok-födelse** (2026-07-22): `11f7047` grön per jobb (run
  29924758953; Docs link check körd, Test+Build docs-only-skippade).
  Numrering disk-verifierad (074/L307/T83/f45/TASK-29; T82
  Marcus-reggad `eb139fa` in i scopet). **NÄSTA: grillning T81.**
- [x] **T81 grillad + spoke-levererad** (2026-07-22, denna landning):
  5 beslut, alla A på Code-rek med Marcus-kvittens, research-grundade
  (Google eng-practices · Conventional Comments · Bugzilla ·
  Scrum/DoR · K8s-triage) → **ADR-071-amenderingen** (klassrymden
  3+2 · tvådelat gränstest · fix-vågens femdelade kontrakt inkl.
  PR-formen kodifierad · iterations-skivans triage-födsel ·
  Done-flipp-grinden per klass). T81-registerraden → spoke LEVERERAD;
  kvar hub-referensraden (hub-bunten). **NÄSTA: grillning T80.**
- [x] **T80 grillad + Del 3-landad** (2026-07-22, denna landning):
  4 beslut (alla A, research-grundade: Storybook · Vercel Toolbar ·
  Chromatic · Polypane · preview-env-praxis) → **ADR-074**
  (adress-strukturen: stabila nycklar + vinnaren behåller nyckeln ·
  minimal-först hörn-växlare med pilstegning · snapshot-par +
  fönster-jämförelse · hemvist/leverans) + URL-STATE-SPEC
  §Dev-parametrar + **TASK-29** ready-for-agent + **T83** reggad
  (Claude Design/DesignSync — Marcus-frågan; Storybook-MCP bokförd i
  ADR-044-vågskålen). Numrering nu: 075/L307/T84/f45/TASK-30.
  **NÄSTA: hub-bunten (T78 b + T81-rad + T82-flaggor = ETT
  plugin-bump-moment).**
- [x] **Hub-bunten + fyra trådstängningar** (2026-07-22, denna
  landning): hub `1f9ca16`, plugin **1.18.0** — prototype-skillens
  Standard-form (T78 b) · work-batch T81-referensraden ·
  T82-flippen 6 av 7 (STOPPA → Marcus A; work-batch KVARLÅST,
  ADR-071 b1) + README-policyn. Registret: **T80/T81/T82/T78
  STÄNGDA** (lessons-buntningen löst upp öppet — L284–L306 kvar i
  S75-end-pass). Marcus-moment: **T18-reinstall 1.16.0 → 1.18.0** +
  aktiverings-verifiering. **NÄSTA: end-pass på signal; TASK-29 +
  S75-resume = Marcus vägval.**
- [x] **Reinstall-praxisen standardiserad + T18 STÄNGD** (2026-07-22,
  Marcus-korrigering "det ska vara praxis efter varje uppdatering"):
  `claude plugin update` körd av Code — 1.16.0→**1.18.0**→**1.18.1**
  (praxis-bumpen `ce9dec5` åt sin egen praxis; list-verifierad) ·
  praxis på tre ytor (minne · hub-README § Distributions-praxis ·
  T18-stängningen). **NÄSTA: TASK-29 via do-work-formen → end-pass.**
- [x] **TASK-29 LEVERERAD i TVÅ vågor → Done** (2026-07-22,
  do-work-formen ur 1.18.1-cachen; Skill-vägran = registerfrys,
  väntat): leverans 1 pill `dadd8a3` → CI RÖD (run 29933197540:
  "Visa prototyp-växlaren" × appens /^Visa/-frånvaro-assertion;
  wrapper-exit-fångsten — vaktens äkta exit stod i FILEN) + Marcus
  facit-revidering ("sidebar med ikoner/tooltips + dragbar", L299
  klassbyte) → leverans 2 IKON-RAIL `a123254` (ADR-074-amendering;
  ref-synkron POS_KEY-persistens efter rött-först-fångst av
  side-effect-i-updater-buggen) — grindar gröna · e2e 56/56 på
  växlarens routes · L304-rail-verifiering grön · stängnings-commit
  efter fil-läst grön vakt. **NÄSTA: end-pass.**
- [x] **Gransknings-vågorna 2–3 + två praxis-korrigeringar +
  L310** (2026-07-22): polervågen `e32839e` (Am. 2: beaker för K ·
  konstant höjd · normalvikts-/sidflipp-tooltips · tangentbords-
  flytt) + mikrocopy-vågen `4ba99c3` (Am. 3: app-fönster-ikon ·
  fönster-knapp utan tooltip · mikroform-copy) · minnes-poster
  reinstall-praxis + CI-vakt-alltid-bakgrund · **L310** (UI-kort bär
  design-review-grind vid födseln — Done före Marcus blick var för
  tidig; session-end-kompletteringen detta bevis). **NÄSTA: Done v2
  på grön vakt → coverage-kvittens → closed.**
- [x] **Mjukhets-vågen + MEKANISKA CI-vakt-grinden** (2026-07-22):
  hook i `.claude/settings.json` `ab52cd5` (position-ankrad;
  falsk-positiv fångad live → skärpt, 5/5 regressionsfall;
  skarpbevisad ×2 + allow-bevis) · våg 4 `4560c4d` (mjuk
  tooltip-entré + 8 px-pil + kortaste copyn; steg ut ur tooltipen)
  — ADR-074 Am. 4. **NÄSTA: Done v3 på grön vakt →
  coverage-kvittens → closed.**
- [x] **A5-vågen + GODKÄNNANDET + STÄNGNING** (2026-07-22): tooltips
  UT + badge alltid synlig + rörelse-förbudet (Am. 5, `30ccc6b`) →
  Marcus **"Nu är det skitbra"** (design-review-kvittensen) +
  hela-vägen-ordern (coverage-kvittensen) → TASK-29 Done slutgiltigt
  (sex vågor, 16 AC) · `lifecycle: closed` · S76 STÄNGD. **NÄSTA
  ARBETE = NY YTA: S75-resume, work-batch 12.**

### Session 75 ✅ AVSLUTAD (2026-07-21 → 2026-07-23; fem pauser/resumer) — Batch-exekveringen → review-vågorna → event-familjen komplett + prod-basen speglad

> Scope: sessionsdok `2026-07-21-session-75.md` Del 1 (kanonisk
> plats): exekvera Marcus batch-order AFK (ordern ordagrant i S74
> Del 4). Sektionen född vid paus-landningen (paus ÄR en landning,
> L67/L223). Kadensrad per L67.

- [x] **Dok-födelse** (2026-07-21): `d71d7ad` (VÄNTAT RÖD på docs-
  jobbet — MD032-incidenten, L297-recidiv: pipe åt exit-koden; läkt
  `117ea30` grön per jobb); numrering disk-verifierad (074/L307/T80/
  f45); S74 closed `d350aa0`. **NÄSTA: batch-avfyrningen.**
- [x] **AVFYRAD + MARCUS-STOPPAD (yt-bytet)** (2026-07-21, Del 2
  kanonisk plats): förkraven gröna (allowlist [känd lucka rm/git rm
  → 18.13 kan stalla, sist] · semafor · B-flaggan AV [T46 ej
  switchad] · 22 kandidater) · claims-fasningen: 19.4 → svansen
  (delar field-allowlists.ts med P2) · orkestrerings-skriptet
  författat + avfyrat (wf_7967e44e-c2b) · Marcus-stopp sekunder
  senare ("vi byter yta") → TaskStop · **sidoeffekt-verifieringen
  REN** (0 remote brancher · inga PR:ar · inga kort-mutationer;
  lokala task/17.1+18.1 städade). **NÄSTA: PAUSAD — se nedan.**
- [x] **PAUSAD** (2026-07-21, Marcus-order "Stoppa! Vi byter yta"):
  `lifecycle: paused` + förankrad PAUSLÄGE-rubrik + fullt HANDOFF
  (TILLSTÅND · CARRY [batch-ordern STÅR — inget nytt kvitto krävs ·
  referens-skriptet · kända risker · lesson-kandidat 1
  L297-recidivet] · numrering · resume-vägen). **NÄSTA: NY Code-yta
  → `/session-resume` på S75 → avfyra batchen per stående ordern →
  AFK-dagen → status-rapport vid Marcus hemkomst.**
- [x] **ÅTERUPPTAGEN** (2026-07-21, Marcus-order `/session-resume på
  S75` i färsk Code-yta + "kör på tills jag kommer hem"):
  `lifecycle: paused → active` + PAUSLÄGE-rubriken →
  Paushistorik-form (grind-konsistensen, session-18-mönstret);
  numrering re-verifierad mot färsk disk — ADR 074 (73 på disk) ·
  L307 (L306 sist) · T80 (T79 sist) · fälla 45 (44 sist), ingen
  mellansession förbrukade nummer; audit-ci PASSED; CI grön på
  paus-committen `68bf3fb`; batch-förkraven re-verifierade
  (semaforen finns · allowlist-luckan rm/git rm STÅR [18.13 sist,
  ofarlig stall] · B-flaggan AV · 25 kort To Do varav 22
  ready-for-agent · caffeinate AKTIV — Marcus-momentet utfört).
  **NÄSTA: avfyra batchen per stående ordern (S74 Del 4 + Del 2:s
  slutliga partition: P1 17.1→17.3→17.2→17.4→19.1→19.2→19.3 · P2
  18.1→18.2→18.3→18.8→18.9→18.10→18.11→18.4→18.5→18.6→18.7→18.12 ·
  svans 17.5→19.4→18.13) → AFK-dagen → status-rapport vid Marcus
  hemkomst.**
- [x] **BATCH KÖRD → HALT 0/22 mergade** (2026-07-21, Del 3 kanonisk
  plats): avfyrad som run `wf_dd115d9e-aca` efter Marcus-kvittot
  "Kör på och lycka till" · **HALT efter ~24 min: 18.1 ABORT —
  claims-luckan `src/domain/**` (läs-shapen: EventSchema + modell +
  paritetsfil) varken tillåten eller förbjuden yta; SYSTEMATISK för
  P2 (även 18.4/18.9/18.10) → drain per kontraktet** · 17.1
  LEVERERAD granskningsfärdig på `origin/task/17.1` (`2f0e666`; TDD
  rött-först, alla grindar gröna, facit-avprickad) men EJ mergad
  (drain — inte fel i leveransen) · övriga 20 ej-startade, orörda.
  Bokfört: 18.1 abort-not `525dac5` · 17.1 drain-not `0677103` ·
  fynd-kort TASK-20 `7f8ae75` · worktrees + lokala brancher städade
  · basen orörd · CI grön per jobb hela vägen. **NÄSTA: MARCUS
  VÄG-BESLUT ikväll ("resten i ny order", S74 Del 4) — rek. A:
  merge:a task/17.1 + ny batch-order med claims-utökning
  `src/domain/**` (18.1/18.4/18.9/18.10) + eventKey-fasning (Del 3
  fynd 1–2); rek. B: ny order enbart claims-säkra kort. Därefter
  end-pass på Marcus-signal.**
- [x] **VÄG-BESLUTET + BATCH V2 AVFYRAD** (2026-07-21, Del 4
  kanonisk plats): Marcus delegerad senior-order ("Du är senior
  här, gör det som blir absolut bäst") på rek. A + kodifieringen —
  order-tolkningen öppet bokförd i Del 4. Utfört: **17.1 MERGAD**
  (kortfil-konflikten union-upplöst `3d72a4c` → PR #68 → tre runs
  gröna per jobb → bokföring `9c6aec0` → städat; kvar: DoD #5
  design-review) · **täcknings-passets premiär** (wf_428c7bef-11b:
  21/21 kort, **15 GAP** — mekanismen empiriskt rättfärdigad) ·
  **ADR-073 Amendering 3** `7c02b64` (täcknings-grinden ·
  delade-ytor-registret 8 poster · konflikt-mandatet) · **batch v2
  avfyrad** (wf_7a56889c-9eb: 21 kort, täcknings-validerade claims
  med FAS-direktiv och konflikt-mandat i merge-kedjan). Lesson-
  kandidater: kollisions≠täcknings ([UNIVERSAL]-kandidat) ·
  pipe-till-tail ×3. **NÄSTA: batch v2 löper → hub-lyftet av
  mekanismen till work-batch-skillen (egen landning, marcus-system)
  → status-rapport vid Marcus hemkomst → QA-våg/design-review =
  Marcus → end-pass på signal.**
- [x] **AUDIT-HALT → LÄKT → BATCH RESUMED** (2026-07-21, Del 5
  kanonisk plats): v2-halt vid 17.3-mergen — TVÅ nya
  upstream-advisories (fast-uri + linkify-it, dev-only-kedjor)
  fällde ALLA runs; 17.3 + 18.1 FÄRDIGBYGGDA på brancher (claims
  v2 höll). Läkning `93eb969` (fast-uri 3.1.4 lockfile ·
  linkify-it-overriden 5.0.1→6.0.0 per 9b97dad-mönstret,
  konsument-verifierad) — CI grön per jobb inkl. fullt Test+Build.
  Resume samma run-ID med v2.1-kedjan (audit-arvs-check ·
  PR-återbruk · kort-state-arv). **Hub-lyftet KLART** (`8ec6c6f`,
  1.17.0; T18-distributions-gapet noterat — reinstall =
  Marcus-moment). **NÄSTA: batch v2.1 löper → status-rapport vid
  hemkomst → QA-våg/design-review = Marcus → end-pass på
  signal.**
- [x] **BATCH V2.1 KLAR: 7 MERGADE + STUDS 18.8 → STOPPAD** (natten
  till 2026-07-22, Del 6 kanonisk plats): **8/22 kort
  granskningsfärdiga i main** (17.1 + 17.3/18.1/17.2/18.2/17.4/
  18.3/19.1, PR #69–75; konflikt-mandatet ×2, båda md-klass) ·
  **18.8 ÄKTA STUDS** (färdigbyggd, PR #76 står; tredje externa
  advisoryn + 3 branch-egna e2e-fel [staging-data-hypotes,
  odiagnostiserad — Marcus ögon per studs-regeln]) · 19.2 byggd +
  drainad (remote står, drain-not) · övriga 12 orörda ·
  **sharp-läkningen `8f4aeb3`** (override 0.35.3; allowlist-vägen
  = Marcus-klass, ej tagen) — repo-vid CI GRÖN igen · fynd-kort
  TASK-21–25 (`9eab457`; TASK-24/25 high — 25 in i review-vågen) ·
  sidoeffekter RENA (remote endast 18.8+19.2, avsiktliga). Batchen
  STOPPAD på senior-beslut (studs + granskningsvågs-principen +
  midnatt). **NÄSTA (Marcus i morgon): (1) REVIEW-VÅGEN — 8 kort
  design-review (DoD #5) + TASK-25-fokusringen; (2) 18.8-vägvalet
  (e2e-diagnosen); (3) ny batch-order för resterande (19.2-mergen
  och 12 kort + ev. 18.8); (4) end-pass-docs (data-model-synken ·
  fälla 45 · STATE-STRATEGY-driften); (5) T18-reinstall
  (plugin 1.17.0).**
- [x] **REMEDIERINGEN + FÖNSTER-RELOAD-PARKERINGEN** (2026-07-22,
  Del 7 kanonisk plats): Marcus-order "tar tag i 19.2 och 18.8" →
  **19.2 MERGAD** (PR #77, tre runs gröna per jobb, kortfil-unionen
  per mandatet, städat) · 18.8: diagnos ×2 + åtgärd ×2 på branchen
  (runda 1: datadrift-hypotesen FALSIFIERAD — TZ-skevheten ×2 +
  av-bock-racet, fix `7592ca1` · runda 2: persist-hydrerings-
  mekanismen trippelbevisad, fix `165fb66` distinkta eventId;
  determinism-bevis 3/3 + 20/20) · fynd TASK-26/27/28 · **merge-
  kedja 2 STOPPAD KONTROLLERAT i steg 5 inför Marcus
  fönster-reload** (PR #76 OPEN, inget mergat; PR-CI server-side;
  parkering `87f6ff2`). **NÄSTA: post-reload — kolla runnet →
  steg 6–10.**
- [x] **18.8 I HAMN — 10/22 GRANSKNINGSFÄRDIGA I MAIN** (2026-07-22,
  Del 7 kanonisk plats): reloaden överlevd, run 29902222934 GRÖN
  per jobb → steg 6–10 körda inline: **PR #76 MERGAD** (`3a36968`,
  main-run 29903576104 grön per jobb) · DoD #3-bokföring `e826d3f`
  (run 29904039235, 0 failure) · städ i kontraktsordning (0
  task-brancher lokalt+remote, 1 worktree). **NÄSTA: (1) MARCUS
  REVIEW-VÅG — 10 kort + TASK-25; per kvittens DoD #5 +
  final-summary och Done-flipp (tvåstegs); (2) ny batch-order för
  resterande 12; (3) end-pass-docs; (4) end-pass/skörd på signal;
  (5) T18-plugin-reinstall (1.17.0).**
- [x] **PAUSAD, ANDRA PAUSEN** (2026-07-22, Marcus-order "Vi pausar
  här och fortsätter på ny yta … kör /session-paus"): `lifecycle:
  paused` + förankrad PAUSLÄGE-rubrik + fullt HANDOFF (TILLSTÅND
  [10/22 mergade · 0 review-kvittenser · sidoeffekter rena ·
  Marcus egen dev-server på 5173 rörs ej] · CARRY [review-vågen ·
  batch-ordern för 12 · end-pass-docs-listan · lesson-kandidater
  1–4 · TASK-20–28 + Dependabot #65/#66] · numrering
  074/L307/T80/f45/TASK-29 · resume-vägen). Todo-radskadan från
  reload-brådskan (AUDIT-HALT-radens huvud) upptäckt + reparerad i
  paus-landningen. **NÄSTA: NY Code-yta → `/session-resume` på S75
  → processa review-kvittenserna → batch-order 12 → end-pass på
  signal.**
- [x] **ÅTERUPPTAGEN, ANDRA RESUMEN** (2026-07-22, Marcus-order
  `/session-resume på S75` i färsk Code-yta): `lifecycle: paused →
  active` + PAUSLÄGE-rubriken → Paushistorik-form (andra pausen;
  grind-konsistensen, session-18-mönstret); numrering re-verifierad
  mot färsk disk — ADR 074 (73 sist) · L307 (L306 sist) · T80 (T79
  sist) · fälla 45 (44 sist) · TASK-29 (task-28 sist), ingen
  mellansession förbrukade nummer; audit-ci PASSED;
  lifecycle-grinden lokalt grön; paus-committens run 29904878141
  GRÖN per jobb (docs-only-formen); S53-falsklarmet avfärdat
  (kropps-rad — frontmatter closed); Marcus egen dev-server på 5173
  ORÖRD; plugin-cachen 1.16.0 (T18-reinstall = Marcus-moment).
  **NÄSTA: (1) MARCUS REVIEW-VÅG — 10 kort + TASK-25; per kvittens
  DoD #5 + final-summary + Done-flipp (tvåstegs); (2) ny
  batch-order för resterande 12 på Marcus-signal (OBS 18.11 mintar
  ADR — nästa nummer disk-verifieras då); (3) end-pass-docs; (4)
  end-pass/skörd på signal; (5) T18-reinstall (1.17.0).**
- [x] **REVIEW-VÅG 1 MOTTAGEN + TRIAGERAD** (2026-07-22, Del 8
  kanonisk plats): Marcus-review på listan/kalendern/detaljsidan + 2
  meta-spår; ALLT verifierat mot kod/kort/FK-referens före klassning
  (3 parallella Explore-agenter). Utfall: 2 defekter (kalenderns
  olikbreda dagar [table-fixed saknas] · idag-markering saknas mot
  FK-golvet IMG_1590) · 2 facit-revideringar (vald dag utan
  guldplatta · "Visa hela månaden"-ersättaren) · 2 småfixar
  (countdown-suffixet [EF-pass-through — käll-verifiering först] ·
  reserverade-termen [KOLLISION med Belaggnings-etiketten,
  term-beslut väntar]) · 2 nya skivor TASK-17.7 (filtervyn+utskrift)
  och TASK-18.15 (åtgärds-siffror) UTAN ready-for-agent · tråd T80
  (prototyp-substratet; ?variant odokumenterad i specs) ·
  review-kommentarer på 17.2/17.4/17.5/18.1/18.8/19.2 ·
  skapa-ingången + "Öppna detaljer" FINNS (e2e-bevisade; korten
  mergade i morse → äldre serverat läge sannolikt; 18.8 kräver även
  minst 1 aktiv anmälan) — omgranskning = Marcus. INGA Done-flippar.
  **NÄSTA: Marcus STOPPA-beslut i chatten (1 fix-vågen nu? · 2
  term-valet · 3 månads-knappen · 4 Done-kandidater
  17.1/17.3/18.2/18.3 [+19.1 via /dev/primitives]; TASK-25 står
  öppen) → review-fix-våg → batch-order 12 → end-pass på signal.**
- [x] **REVIEW-FIX-VÅG 1 LEVERERAD + MERGAD** (2026-07-22, Del 9
  kanonisk plats): Marcus-kvittens 1=A/2=A(kortdelen)/3=A →
  kalenderpaketet (table-fixed likbredd · FK-idag-ring IMG_1590 ·
  vald dag markeringsram utan guldplatta [S72-facit-revidering
  öppen] · toggle-avval [klon-buren onChange — instans-identitets-
  guarden empiriskt belagd]) + countdown-suffixet "kvar till
  eventet" (villkorat; formeln MCP-läst, bifynd eventdagen=Avslutat
  → data-model-synken) + termen "platser reserverade" (EventCard +
  NastaEventCard + 7 e2e-sviter; prototypen orörd — fryst facit).
  Rött-först 7→53/53 i egen worktree/server 5198 (Marcus 5173
  orörd) · CI-fångst: head-trunkerad inventerings-grep dolde 5
  assertions (tysta-cap-klassen, lesson-kandidat 6) → fullsvep →
  PR #78 grön per jobb → mergad `a0ce2eb` → main-run 29912258901
  grön per jobb → städat (0 task-brancher · 1 worktree) →
  huvudträdet pullat (Marcus dev-server bär fixarna vid
  omladdning). T81 registrerad (Marcus-fångst: process-spåret
  saknade tråd) · ORDLISTA "Reserverad plats" · kort-kommentarer
  17.4/18.1/17.2 (DoD #5 öppen). **NÄSTA: (1) MARCUS: omgranska
  fixarna + 18.8 ["Öppna detaljer" kräver event med aktiva
  anmälningar] + 19.2 [skapa-pillen på vy-raden] efter omladdning;
  (2) Done-flippar (fråga 4: 17.1/17.3/18.2/18.3 [+19.1 via
  /dev/primitives]) + TASK-25 + beläggningsradens namn (rek "Extra
  platser"); (3) T80-substrat-researchen (Marcus-prioriterat nästa
  fokus — egen session med grillning rekommenderad); (4)
  batch-order 12 · end-pass på signal.**
- [x] **GRANSKNINGS-DATAT + EXTRA PLATSER-FIXEN** (2026-07-22, Del 10
  kanonisk plats): Marcus mid-turn-order → rotorsak MCP-verifierad
  (staging har NOLL riktiga kommande event — endast ZZ-sentineler) →
  GRANSKNINGSDATA skapade, Notering-märkta: event Event-796
  (recigcY12dDllUkYt, Fjärrskådning Skövde 15–16 aug) + anmälan
  recc45ZswKKBE91BK (Greta Granskning; avgift Mottagen ·
  slutbetalning Ej mottagen · deadline 2026-08-01) → betalningsvyn
  granskningsbar (delta −1 · Öppna detaljer · Påminn-rad); städpunkt
  efter review. **Extra platser-fixen** (Marcus "ta den"): PR #79 →
  mergad `68a1aa5`, main-run 29916640745 grön per jobb; tre
  render-ställen + K16-assertionen; rött-först → 31/31; grindar
  gröna; städat; ORDLISTA-posten uppdaterad; kommentarer
  18.2/17.2/18.8. Lesson-kandidat 7 (pipe-processdöd).
  **NÄSTA: PAUSAD — se nedan.**
- [x] **PAUSAD, TREDJE PAUSEN** (2026-07-22, Marcus-order "sen kör vi
  /session-paus" + batch-förhandsfrågan besvarad JA): `lifecycle:
  paused` + förankrad PAUSLÄGE-rubrik + fullt HANDOFF (TILLSTÅND
  [10/22 mergade + fix-våg 1 komplett PR #78/#79 · 0 formella
  Done-flippar trots positiv generell signal · sidoeffekter rena +
  2 GRANSKNINGSDATA-poster i staging · Marcus dev-server rörs ej] ·
  CARRY [HUVUDSPÅR: work-batch resterande 12 vid resume — ordern ges
  vid avfyrning · review-loopen fråga 4 + TASK-25 + omgranskningar ·
  T80 efter batchen · T81/ADR-071-amendering + end-pass-docs +
  lesson-kandidater 1–7 + TASK-20–28/Dependabot/T18] · numrering
  074/L307/T82/f45/TASK-29 · resume-vägen). **NÄSTA: NY Code-yta →
  `/session-resume` på S75 → avfyra work-batch på resterande 12 per
  Marcus-order → review-kvittenser löpande → T80/end-pass på
  signal.**
- [x] **ÅTERUPPTAGEN, TREDJE RESUMEN** (2026-07-22, Marcus-order
  `/session-resume på S75` i färsk Code-yta efter S76-mellansessionen):
  `lifecycle: paused → active` + PAUSLÄGE-rubriken → Paushistorik-form;
  numrering re-verifierad mot färsk disk — **S76 FÖRBRUKADE nummer**:
  ADR **075** (074 på disk, ej 074) · **L311** (L310 sist, ej L307) ·
  **T84** (T83 sist, ej T82) · fälla 45 (oförändrad) · fynd-kort
  **TASK-30** (task-29 sist); repo rent på `622963f`, main-run
  29940221587 grön per jobb (6/6, docs-only-formen). Carry-divergens:
  T80/T81/T82-ordningsfrågan är **STÄNGD av S76** (ADR-074 +
  ADR-071-amenderingen + T82-flippen levererade FÖRE batchen, precis
  som Code-rek:en föreslog) · work-batch-skillen **KVARLÅST** per
  ADR-071 b1 (ordern måste ges explicit, ej löptext-invokering) ·
  referens-skriptet `work-batch-s75-v2-wf_7a56889c-9eb.js` finns EJ
  kvar på disk (efemär scratchpad — designbesluten är bevarade i Del
  3–6, skriptet återförfattas). **NÄSTA: avfyra work-batch på
  resterande 12 (P1-rest 19.3 · P2-rest
  18.9/18.10/18.11/18.4/18.5/18.6/18.7/18.12 · svans 17.5/19.4/18.13)
  på explicit Marcus-order → review-kvittenser löpande → end-pass på
  signal.**
- [x] **BATCH KÖRD 3–6 → 11/12 MERGADE** (2026-07-22→23, Del 12): fyra
  vågor kring do-work + täcknings-pass. 18.4/18.5/18.6/18.7/17.5/18.9/
  19.4/18.10/18.11/18.12 + 19.3 MERGADE granskningsfärdiga (PR
  #80–90). TRE orkestrator-läkta halter: 19.3 (e2e-session-läkning +
  ny helper + CI-artefakt-uppladdning) · 18.10 (markdown `+`-fällan) ·
  18.11 (3 mekaniska + staging-EF-deploy). **STAGING-EF-DEPLOYS
  autonomt** (create-event-note · get-event-notes · create-registration;
  prod ORÖRD). Fynd TASK-30–34. **21/24 skivor i main, 0 Done-flippar.**
- [x] **18.13 SCOPE-KORRIGERING mot ADR-074** (2026-07-23, Del 13,
  Marcus-order efter S76-läsning): kortet sa "riv växlaren", ADR-074 sa
  "växlaren består" — äkta konflikt, ADR:n vann. Description + AC #1
  omskrivna (river instanser, BEHÅLL PrototypeSwitcher); rm-allowlist
  tillagd. A/B-följdfrågan öppen (Marcus). 18.13 HÅLLET till efter review.
- [x] **PAUSAD, FJÄRDE PAUSEN** (2026-07-23, Marcus-order "pausar vi
  denna sessionen för att köra resume på ny yta, där kör vi hela min
  review"): `lifecycle: paused` + förankrad PAUSLÄGE-rubrik + fullt
  HANDOFF (TILLSTÅND [21/24 i main granskningsfärdiga · HEAD `9f41762`
  grön per jobb] · CARRY [review-vågen · 18.13 A/B · prod-deploy-vågen ·
  17.7/18.15 · fynd · lesson-kandidater] · numrering 076/L311/T84/f45/
  TASK-35 · resume-vägen). **NÄSTA: NY Code-yta → `/session-resume` på
  S75 → hela review-vågen med Marcus → 18.13 A/B + kör → prod-deploy →
  end-pass/skörd (session-end, N+1) på signal.**
- [x] **ÅTERUPPTAGEN, FJÄRDE RESUMEN** (2026-07-23, Marcus-order
  `/session-resume på S75` i färsk Code-yta): `lifecycle: paused →
  active` + PAUSLÄGE-rubriken → Paushistorik-form + Del 14; numrering
  re-verifierad mot färsk disk — **INGEN mellansession förbrukade
  nummer**, handoffens värden håller: ADR **076** (075 sist) · **L311**
  (L310 sist) · **T84** (T83 sist) · fälla **45** (44 sist) ·
  **TASK-35** (task-34 sist); repo rent på `10a5fdc`, audit-ci PASSED,
  0 task-brancher, review-scopet CLI-verifierat (21 kort In Progress).
  DIVERGENS öppet bokförd + UPPLÖST: paus-committens CI-run skapades
  FÖRDRÖJT (~8 min Actions-tröghet, API 0 träffar vid resume-läsningen)
  — `10a5fdc` run 29989982817 · resume-committen `b36b7fb` run
  29990108180, **BÅDA GRÖNA per jobb** (6/6, docs-only-formen).
  Todo-headerns missade PÅGÅR-flip från tredje resumen rättad.
  **NÄSTA: hela review-vågen med Marcus (design-review mot S73-facit
  av de 21 skivorna; tvåstegs-Done per ADR-071-amenderingens
  klassning; öppna design-frågorna 18.5/18.10/18.12) → 18.13 A/B +
  kör → prod-deploy → end-pass/skörd (session-end, N+1) på signal.**
- [x] **REVIEW-VÅGEN IGÅNG: punkt 1–10 + fix-vågorna 2–3** (2026-07-23,
  Del 15): våg 2 (p1–6) klassad + "Go!" → staging-redeploy ALLA 10
  batch-EF:er (STALE LÄGE-roten: dev==staging, endast 3/10 var
  deployade) → **PR #91 MERGAD `fb8388b`** (tvåcommit-formen: röd
  29993773642 på exakt kontrakten → grön 29995321330 per jobb;
  gutter lg→sm · rounded · K62-no-op · tomlägena + min-h-paret).
  Skivor födda: **18.16** (knapp-standard, SCOPE-UTÖKAD, K77-A
  avgjord, ready-for-agent) + **18.17** (anmälan-detaljvyn).
  Senior-delegeringen ("jag kvitterar det du kvitterar") → 8A Rensa ·
  K77-A · font-medium. METODFYND [UNIVERSAL]: CI-overlay-scrollbars
  ⇒ computed-kontrakt för skal-CSS. **PR #92 (våg 3: inset ·
  Spara/Rensa · miranon.se) i luften** — vakter: röd→push→grön→merge
  samt main-vakt fb8388b. **NÄSTA: PR #92-kedjan hem → Marcus git pull +
  omgranskning i färskt läge (vågarna + STALE-ytorna) → Done-flippar
  per kort-kvittens → 18.13 A/B + kör → prod-deploy → end-pass/skörd
  på signal.**
- [x] **VÅGORNA 3–5 HEM + VÄLJAR-SKIVORNA + PAUSAD, FEMTE PAUSEN**
  (2026-07-23, Del 16): PR #92 `f1ff211` · #93 `15c5730` (Actions-
  cancelled run → rerun grön) · #94 `afceeb6` — samtliga main-runs
  GRÖNA per jobb; p12 datumspann-kollapsen · p13 DYNAMISKA grön-regeln
  (Marcus-formen slog K77-A; 18.16 amenderad) · p14–15 "Dra för att
  publicera"/"Publiceras" (MiranonSe RIVEN, K81-sagan stängd;
  SlideToConfirms K82-lyft rivet). **18.18 + 18.19 födda** (event-
  väljaren ny-anmälan + eventsidan; beslut a–d + rubrik A/B öppna).
  "Flippa alla 21"-förslaget AVVISAT mot Done-flipp-grinden →
  **omgransknings-protokollet** som bilaga
  (`bilagor/s75-omgranskningsprotokoll.md`). Sessions-gränsen beslutad:
  resume = S75:s SISTA (protokoll → Done-flippar → 18.13 → QA →
  PROD-DEPLOY [Marcus-beslutad inom S75] → session-end); S77 =
  väljar-grillningen + bygget. `lifecycle: paused` (femte pausen) +
  fullt HANDOFF. **NÄSTA: NY Code-yta → `/session-resume` på S75 →
  Marcus git pull + protokollet → kvittenser/Done-flippar → 18.13 →
  QA → prod-deploy → session-end (N+1).**
- [x] **ÅTERUPPTAGEN, FEMTE RESUMEN** (2026-07-23, Marcus-order "Vi kör
  `/session-resume` på S75" i färsk Code-yta, Del 17): `lifecycle:
  paused → active` + PAUSLÄGE-rubriken → Paushistorik-form +
  PÅGÅR-rubrik; numrering re-verifierad mot färsk disk — **INGEN
  mellansession förbrukade nummer**, handoffens värden håller: ADR
  **076** (075 sist) · **L311** (L310 sist) · **T84** (T83 sist) ·
  fälla **45** (44 sist) · **TASK-35** (task-34 sist). Repo rent på
  `04e60cd` med **grön run** (fjärde pausens saknade-run-divergens
  återkom EJ), audit-ci PASSED, 0 task-brancher; leverans-läget
  CLI-verifierat oförändrat (21 In Progress · 0 Done-flippar · 18.13
  HÅLLET · QA-korten To Do). **NÄSTA: omgransknings-protokollet
  (bilagan) — Marcus git pull + dev-omstart → fyra ytor → "NN
  ok"-kvittenser → Done-flippar löpande → 18.13 A/B → QA-korten →
  prod-deploy-vågen → session-end (N+1).**
- [x] **PROTOKOLLET STÄNGT + 18.13 + PROD-BASEN SPEGLAD** (2026-07-23, Del
  17–18): omgranskningen klar **21/21 kort Done** över fyra ytor (Marcus
  kvitterade yta för yta) · **fix-våg 6** PR #95 rev det GLOBALA
  sidleds-hoppet (React Arias inline `scrollbar-gutter: stable` river vår
  `both-edges` vid varje overlay-öppning — author-!important är motmedicinen)
  · **fix-våg 7** PR #96 (bekräftelse-copyn mot beläggnings-modellen +
  märkningen till K84) · **PR #97** rev ACCESSIBILITY-CHECKLIST-raden öppet
  på Marcus-beslut A och ersatte den med den tvådelade regeln (programmatiskt
  alltid + visuellt på undantagen; GOV.UK-mönstret) · **TASK-18.13** PR #98
  (prototyp-substratet rivet, växlaren fick `/dev/prototyper` per beslut B;
  de tre "döda ytorna" står KVAR per beslut A efter att typecheck avslöjat
  levande konsumenter) · **QA-korten 17.6/18.14/19.5 Done** (Marcus körde
  testplanerna) · **PROD-BASENS BAS-DEL UTFÖRD** (Marcus "Ja, kör"): nio
  additiva ändringar — Anteckningar-tabellen + 5 fält på Anmälningar + 3 på
  Eventplanering, samtliga verifierade med återläsning och bokförda med
  prod-ID:n i data-model.md; `Väntelista (länkat fält)` medvetet EJ speglad
  (prods fält är singleLineText → typkonvertering, ej additivt). **NÄSTA:
  EF-delen SKJUTEN till eget pass (T39 i full omfattning: 11 av 13 prod-EF:er
  ligger flera versioner efter + notes-EF:erna saknas; T40:s prod-smoke ej
  uppsatt) → session-end (N+1) med full skörd. FYND: test-auth ligger i prod
  trots allowlist-förbudet.**

- [x] **SESSIONEN AVSLUTAD** (2026-07-23, Marcus-order "Kör!", Del 19):
  skörd **L311–L320** (tio lärdomar, åtta [UNIVERSAL]) + explicit
  FÖRKASTNINGSLISTA över kandidater som prövades och föll under
  mint-baren (registrerade, ej tyst tappade) · **BUILD-LOG-post** för hela
  spannet `d71d7ad` → `c65ce26` (188 commits) · trådar synkade (T84 född ·
  T39 uppdaterad med MÄTT versions-gap · **TASK-35** registrerad: test-auth
  i prod) · **ingen ny ADR** (K84-förenandet prövat mot ADR-baren och funnet
  under den — befintlig spec bar det; räkningen står på 075) ·
  transcript-referens med verifierade siffror (1 465 rader / 4 869 470 byte).
  **NÄSTA SESSION (S77): EF-delen av prod-deployen (T39/T40) · test-auth-
  städet (TASK-35) · väljar-grillningen 18.18/18.19 + bygget · 17.7 · 18.15 ·
  18.16/18.17 · hub-lyftet L284–L320. Marcus-moment: Update-klicket i
  claude.ai.**

### Session 74 ✅ AVSLUTAD (2026-07-21) — Familje-PRD:erna → 25 skivor → batch-ordern till S75

> Scope: sessionsdok `2026-07-21-session-74.md` Del 1 (kanonisk
> plats): familje-PRD:erna (lista + eventsida + skapa) via `/to-prd`
> → skivor via `/to-issues` (ADR-073-partitionering); de öppna
> designfrågorna avgörs i PRD-arbetet. Kadensrad per L67. (Sektionen
> född vid Del 2-landningen — S70-precedenten.)

- [x] **Dok-födelse** (2026-07-21): `6c9d409`, run 29810667368 grön
  per jobb (docs-only-formen); numrering disk-verifierad (ADR 074
  [73==73, skriptet grönt] · L305 · T80 · fälla 45); audit-ci PASSED;
  inga pausade dok; plugin 1.16.0 AKTIV (sjätte sessionen med
  asynkrona vakten). FYND: Dependabot-PR #65/#66 (defererade, Ej i
  scope). Marcus-kvittens: S74 + scope. **NÄSTA: `/to-prd`.**
- [x] **FAMILJE-PRD-LANDNINGEN** (2026-07-21, Del 2 kanonisk plats):
  **TASK-17** (listan: 4 skivor + QA) · **TASK-18** (eventsidan:
  11 skivor + familje-rivningen + QA; write-vertikalerna + de
  additiva bas-fälten) · **TASK-19** (skapa: 4 skivor + QA)
  publicerade via backlog-CLI:t med DoD-extra-grindarna
  (L220/L245/L246 + bas-additivitets-grinden ADR-050/ADR-063).
  Skarv-kvittensen + 4 designbeslut Marcus-kvitterade per
  rekommendation: två befintliga skarvar (api + e2e/axe) ·
  chevron-regeln RIVS öppet (verkställs i TASK-18 skiva 3) ·
  hemvisten event-familjens skapa-sida + Mer-ingången rivs ·
  Anteckningar = ADDITIV tabell (egen ADR vid skivan) ·
  publiceringsflaggan additiv nu (kontraktet = T79).
  **NÄSTA: skivorna via `/to-issues` (Del 1 scope-punkt 2).**
- [x] **SKIV-LANDNINGEN** (2026-07-21, Del 3 kanonisk plats): **25
  barn-kort publicerade i beroendeordning** — TASK-17: 6 (17.3
  kursfärgs-tokensen = PREFAKTORERING, delas av kalendern +
  gruppdynamiken) · TASK-18: 14 (arbetskön DELAD i skelett 18.4 +
  personkort 18.5 per Marcus-delegerat storleksval; 18.13
  familje-rivningen med --dep på ALLA 21 bygg-skivor) · TASK-19: 5.
  Skiv-godkännandet i klartext-form (Marcus-fångst "för diffusa" →
  tre direkt svarbara frågor): storleken delegerad · beroendena
  kvitterade (17.5←18.7, 19.2←17.2) · **deadline-regeln LÅST: start
  − 14 dagar** (inskriven i 18.8). Etiketter: ready-for-agent ×22 +
  QA ready-for-human ×3; DoD-arvet per skiva; graf-verifierad
  (Sequence 1 = tre disjunkta startkedjor 17.1+17.3 ∥ 18.1 ∥ 19.1 =
  ADR-073-partitions-kandidaterna). **NÄSTA: exekveringen —
  `/do-work` eller Marcus-partitionerad `/work-batch` (ADR-073);
  därefter end-pass på Marcus-signal.**
- [x] **END-PASSET** (2026-07-21, Del 4 kanonisk plats): redo-svaret
  för `/work-batch` levererat (JA + två precisioner: max-kort-
  mekaniken styr "alla en efter en" · UI-skivor landar
  GRANSKNINGSFÄRDIGA, Done-flippen är Marcus [QA-vågen,
  TASK-4.6-precedenten]) · skörden **L305–L306** [UNIVERSAL]
  (klartext-avstämningen · cache-läsnings-formen för user-invocable-
  only-skills; MD018-kandidaten förkastad med motiv) · BUILD-LOG
  S74-posten · transcript-ref wc-verifierad (1 392 628 byte/438
  rader) · numrering vid stängning: 074/L307/T80/f45. **NÄSTA (N+1 =
  S75): `/work-batch` på Marcus-order (max-kort + ev. 2-pipeline-
  partition på startkedjorna); stängningen (`lifecycle: closed`)
  väntar Marcus coverage-kvittens (grind 2, ADR-069).**
- [x] **STÄNGD** (2026-07-21): `lifecycle: closed` efter Marcus
  **"Kvitterar 1 och 2"** (coverage inkl. inget-att-säkra +
  BATCH-ORDERN: work-batch · max-kort 22 · två pipelines per
  partitionen [P1 lista+skapa · P2 eventsidan · svans 17.5+18.13] —
  ordagrant bevarad i sessionsdok Del 4). Granskningsfärdig-läge;
  QA-vågen + design-review + prod-deploy = Marcus ikväll; Macen
  vaken via caffeinate. **S75 föds direkt (Code-körd, samma
  konversation — Marcus bortrest under exekveringen).**

*Senast uppdaterad (S73-stängningen): 2026-07-21 (**Session 73 ✅ AVSLUTAD 2026-07-21** (`lifecycle: closed` efter Marcus coverage-kvittens "Inget att säkra, flippa."; post 3 explicit inget att säkra) — **EVENT-FAMILJEN KOMPLETT KONVERGERAD: eventsidan K1–K72 FACIT (Marcus "nöjd efter 72 iterationer", SHA `9826278`) + Skapa-utökningen K73–K85 FACIT (SHA `a303c65`) + S56 administrativt stängd + fyra skarpa leveranser.** Fem konvergens-pass över tre pauser/resumes (ADR-051/ADR-069 ×3). Facit-kanon = bilagorna `s73-eventsida-konvergens/` (11 skärmar + trailer) + S72-bilagans utöknings-notering. SKÖRD: **L292–L304**. Incidenter öppet bokförda: K69-grindkedjan (läkt) · MD004 ×2 (läkta) · Vite-watchern DÖV ×2 (→ L296) · GitHub sekundär-throttling (L298). BUILD-LOG S73-post + transcript-refs ×4 wc-verifierade. Full narrativ: sessionsdok Del 1–8.)*

### Session 73 ✅ AVSLUTAD (2026-07-19 → 2026-07-21) — Eventsidan K1–K72 FACIT + Skapa-utökningen K73–K85 FACIT + S56 stängd + 4 skarpa leveranser

> Scope: sessionsdok `2026-07-19-session-73.md` Del 1 (kanonisk plats):
> eventsidan (detaljvyn `/event/$eventId`) genom konvergens till facit
> på prototyp-substratet — ingen grillning (Marcus-beslut vid start:
> S72-samsynens grund-arv täcker designbesluten) — + administrativ
> stängning av S56; därefter väg-beslutet list-PRD:ts födelsetidpunkt.
> Kadensrad per L67. (Sektionen född vid Del 2-landningen —
> S70-precedenten; S72-rubriken nedan reparerad PÅGÅR → AVSLUTAD i
> samma landning, öppet bokförd.)

- [x] **Dok-födelse** (2026-07-19): `fc9f2fb`, run 29702964992 grön
  per jobb (docs-only-formen); numrering disk-verifierad (ADR 074
  [73==73], L292, f45, T79); audit-ci PASSED; plugin 1.16.0 AKTIV
  (femte sessionen med asynkrona vakten). S56-FYNDET (pausad 16
  sessioner, KVAR levererat på andra ytor) rapporterat i RAPPORTERA;
  Marcus-kvittens: S73 + scope + S56-stängning + ingen grillning.
  **NÄSTA: S56-stängningen.**
- [x] **S56 ADMINISTRATIVT STÄNGD** (2026-07-19, Del 2 kanonisk
  plats): `lifecycle: paused → closed` + PAUSLÄGE-rubriken till
  historik-form + stängnings-sektion · skörd **L292–L293**
  [UNIVERSAL] (precedens-ändring aktiverar latent död konfiguration —
  inventera vad som VINNER · "min diff grön" ≠ "min run grön" — CI
  dömer hela trädet vid din SHA) · BUILD-LOG S56-post (kronologisk
  position S55↔S57, öppet S73-markerad) · T65-raden `closed` med
  leverans-not (TASK-4 helt Done: 4.1–4.2 S56 · 4.3+4.4 S61 · 4.5
  S62 · QA 4.6 S64/S67). **NÄSTA: konvergens-passet på eventsidan.**
- [x] **KONVERGENS-PASSET K1–K13 + SKARPA APP-REGELN** (2026-07-19/20,
  Del 3 kanonisk plats): K1-substratet (exakt kopia + **T78a-lyftet
  GJORT**: delade PrototypeSwitcher + familje-flödets
  search-genomslag) · **SKARP: headern RIVEN app-brett** (`ac3f198`,
  APP-REGEL i AppShell + shell-e2e count 0; klass C-punkten från S55
  stängd; full e2e/a11y/api-pure-förkontroll) · +3
  Eventmanager-referensbilder i fk-referens-katalogen · sidformen
  Marcus-driven K2→K13: grund-arvet → IMG_1542-formen (grupper
  utanför kort, key-value-rader, Ändra-/Öppna-rader) → identiteten
  som sidhuvud → eventnamnet = h1 + EventKey-pill → stor chevron
  ensam → Ändra-läget (bibliotekets Select/Input/Button + RAC
  DateRangePicker) → sömlös morf 0 px (DOM-mätt) → likbredda fält
  4×240 px + "ändrar från"-mönstret · demo-datat Airtable-troget ·
  1 CI-röd (K11, unsafe-fix-klassen) öppet bokförd + läkt K12
  röd→grön. PRD-krav ackumulerade: eventKey + write-operationer
  (Del 3/PAUSLÄGE). **INGET FACIT LÅST — mycket kvar på sidan.**
- [x] **PAUSAD** (2026-07-20, Marcus-order "Kör /session-paus"):
  `lifecycle: paused` + förankrad PAUSLÄGE-rubrik + fullt
  HANDOFF-block (TILLSTÅND · CARRY/lesson-kandidater ×3 · numrering ·
  resume-vägen) i sessionsdoket; dev-servern stoppad
  (L275/L282-fällan); trädet rent + pushat, CI grön per jobb.
  **NÄSTA: `session-resume` av S73 i färsk kontext — fortsätt
  konvergensen (närmast: Beläggnings-Ändra + innehålls-frågan
  [Eventmanager-referenserna]) till Marcus-låst facit.**
- [x] **ÅTERUPPTAGEN** (2026-07-20, Marcus-order `/session-resume på
  S73`): `lifecycle: paused → active` + PAUSLÄGE-rubriken →
  Paushistorik-form (grind-konsistensen, session-18-mönstret);
  numrering re-verifierad mot färsk disk — ADR 074 (73==73, skriptet
  grönt) · L294 · T79 · fälla 45, ingen mellansession förbrukade
  nummer; audit-ci PASSED; enda pausade dok = S73; färsk dev-server
  startad (L275/L282). **NÄSTA: fortsätt konvergens-passet på
  eventsidan i Marcus-takt — närmast Beläggnings-Ändra (morfen) +
  innehålls-frågan (Eventmanager-referenserna) — tills Marcus låser
  FACIT; därefter list-PRD-vägbeslutet (Del 1 punkt 3).**
- [x] **KONVERGENS-PASSET K14–K44** (2026-07-20, Del 4 kanonisk plats;
  31 commits `bbce0b4`→`92c0d97`, ALLA runs gröna per jobb):
  Beläggnings-morfen + innehållsmodellen (Marcus-modellen == basens
  fält 1:1; segmenterad mätare + Väntelista-rad) · manuell
  anmälan-SIDAN (K17, FK-formklassen, ny route) · Åtgärds-gruppen
  (frekvensordnad, vänsterställd, chevron-prövningen K25) · check-in-
  ingången (svart knapp PRÖVAD-OCH-RIVEN → NavCard-form i radmått) ·
  Betalningar: röda deltan + inline-ARBETSYTAN (flikar · deadline-
  badge · kryss/notering per betalning · påminn-mailto + historik) ·
  Anmälda deltagare-kortet (referensens vita personkort · mail-
  sammanfattning med klickfilter · kategori-flikar · Ohanterade/
  Hanterade-accordions i ARBETSKÖ-mönstret · Lottas mail-flöde
  speglat [bekräftelse→påminnelse→eventinfo] · dags-att-skicka-
  signalen + auto-utskicks-krysset K44). PRD-korgen kraftigt växt +
  7 lesson-kandidater (allt i Del 4/PAUSLÄGE). **INGET FACIT LÅST.**
- [x] **PAUSAD IGEN** (2026-07-20, Marcus-order "kör /session-paus"):
  `lifecycle: paused` + förankrad PAUSLÄGE-rubrik (andra pausen) +
  fullt HANDOFF (TILLSTÅND · CARRY med nästa-sessionens Marcus-order ·
  numrering 074/L294/T79/f45 · resume-vägen); dev-servern stoppad;
  trädet rent + pushat, CI grön per jobb. **NÄSTA: `session-resume`
  av S73 i färsk kontext — utför Marcus-ordern: personkortens metayta
  AVBRUSAS (Anmäld + TID på en rad · endast UTFÖRDA åtgärder ·
  "hos Miranon Media" hela namnet) + HANTERA-flödet för ohanterade
  (knapp/väg saknas) — sedan vidare mot Marcus-låst facit.**
- [x] **ÅTERUPPTAGEN IGEN** (2026-07-20, Marcus-order `Vi kör
  /session-resume på S73`): `lifecycle: paused → active` +
  PAUSLÄGE-rubriken (andra pausen) → Paushistorik-form
  (grind-konsistensen, session-18-mönstret); numrering re-verifierad
  mot färsk disk — ADR 074 (73==73) · L294 · T79 · fälla 45, ingen
  mellansession förbrukade nummer; audit-ci PASSED; enda pausade dok =
  S73; HEAD-driften mot handoffen (7468679 paus-läkningen > 92c0d97
  K44) öppet flaggad, väntad — paus-landningens röda run läkt grön;
  färsk dev-server startad (L275/L282). **NÄSTA: utför Marcus-ordern —
  (a) personkortens metayta AVBRUSAS + (b) HANTERA-flödet för
  ohanterade — på `/event/demo-1?variant=B` i Marcus-takt; sedan
  vidare mot Marcus-låst facit → list-PRD-vägbeslutet.**
- [x] **KONVERGENS-PASSET K45–K65** (2026-07-20, Del 5 kanonisk plats;
  22 commits `e9e11ed`→`b97f75a`): Marcus-ordern a+b LEVERERAD
  (metayta-avbrusningen K45 + hantera-flödet K46) · Bekräfta alla-
  pillen (K47, grön K48, radie K55) + kuvert-grammatiken sluten ·
  **SKARP: sage-gröna #606B57** (K49, primitiv + spec; facit-beröring
  Marcus-kvitterad) · Bor över-raden + kryss-markeringen (K50–K52;
  draget medvetet bortvalt) · **Obekräftade/Bekräftade-språket** (K53;
  ORDLISTA-post; hanterad-carryn STÄNGD) · geometri-fixen Δ=0 (K54) +
  hover (K56) + filterläget avbrusat (K57/K58) · växlaren minimerbar
  (K59) · **NÄRVARO-REGISTRET** (K60, LMS-mönstret) · streck-markörer
  (K61) · Anmäld-raden = anmälan-länk (K62) · **GRUPPDYNAMIK ersätter
  Anmälda** (K63–K65: erfarenhetsmix + accordions med kurshistorik i
  kalenderfärgerna + motiveringarna med Läs mer; Anmälda-rivningen
  STÄNGD) · **K65-RÄTTELSEN** (Marcus-fångst: motiverings-fälten
  FINNS i basen — data-model-gapet stängt durabelt) · öppet röda:
  K56-runnet (läkt K57) + mojibake-incidenten (läkt) + API-rate-limit
  (K61–K65-runs overifierade). **INGET FACIT LÅST.**
- [x] **PAUSAD IGEN — tredje pausen** (2026-07-20, Marcus-order "kör
  /session-paus"): `lifecycle: paused` + förankrad PAUSLÄGE-rubrik
  (tredje) + fullt HANDOFF (TILLSTÅND med CI-skulden · CARRY med 11
  lesson-kandidater · numrering 074/L294/T79/f45 · resume-vägen);
  dev-servern stoppad; trädet rent + pushat; CI-skulden LÖST vid
  läkningen (K61–K65 + landningen per-jobb-gröna — hela tredje passet
  grönt, enda röda K56 läkt K57). **NÄSTA: `session-resume` av S73 i
  färsk kontext — Marcus dömer Gruppdynamik + Närvaro-registret och
  konvergensen fortsätter mot facit → list-PRD-vägbeslutet.**
- [x] **ÅTERUPPTAGEN — TREDJE GÅNGEN** (2026-07-20, Marcus-order
  `/session-resume på S73`): `lifecycle: paused → active` +
  PAUSLÄGE-rubriken (tredje pausen) → Paushistorik-form
  (grind-konsistensen, session-18-mönstret); numrering re-verifierad
  mot färsk disk — ADR 074 (73==73) · L294 · T79 · fälla 45, ingen
  mellansession förbrukade nummer; audit-ci PASSED; enda pausade dok =
  S73; HEAD `8f7c5c5` (paus-läkningen) > `b97f75a` K65 — väntad drift,
  läkningen är bokförd i handoffen själv; färsk dev-server startad
  (L275/L282). **NÄSTA: Marcus dömer Gruppdynamik (K63–K65) +
  Närvaro-registret (K60) i browsern på `/event/demo-1?variant=B`;
  öppna designfrågorna (chevron K25 · hover-affordans K56 · print-CSS ·
  tomlägen · tidKvarTillEvent-raden) — tills Marcus låser FACIT →
  list-PRD-vägbeslutet (Del 1 punkt 3).**
- [x] **KONVERGENS-PASSET K66–K72 → FACIT LÅST** (2026-07-20, Del 6
  kanonisk plats; `04e9b86`→`9826278`): Gruppdynamik + Närvaro-registret
  Marcus-godkända · **ANTECKNINGAR** (K66: tidsstämplad ström,
  författare + härledd Under/Efter-fas; bas-verifierat live —
  Notering-fältet bär ej
  ström-modellen, record comments-API:t nåbart, PRD-vägvalet öppet) →
  Marcus-finlir K67–K69 (Innan-etiketten riven [tysta normen] ·
  kant-inset 16 px runt om · knapp-radien åter primitiv) → K70-greppet
  "bedrövligt" → **AUTO-GROW** (K71, field-sizing; lösningsklassbytet) →
  **hover-plattan på åtgärdsraderna** (K72; K56-följdfrågan besvarad för
  åtgärdsklassen). **FACIT DEKLARERAT** (Marcus: "nöjd … efter 72
  iterationer"): facit-SHA `9826278` · bilagan
  `s73-eventsida-konvergens/` (8 skärmdumpar 390×844 + SHA-trail + öppna
  bokföringar: chevron-konsekvensen [app-regeln rivs öppet ELLER
  prövningen rivs — Marcus-kvittens krävs] · K56-resten Ändra/detalj-
  rader · print-CSS · tomlägen · Firefox-fallbacks) · stegLabel →
  FACIT-formen · HELA event-familjen låst (S72-listfacitet + detta).
  Öppet bokfört: K69-grindincidenten (obunden förkontroll-kedja, läkt
  `2cbcaed`) · CI-skulden f9c3fa3→facit-landningen (rate-limit 403;
  f9c3fa3 väntat röd, läkt) · lesson-kandidater nu 14. **NÄSTA:
  list-PRD-vägbeslutet är MOGET (familje-konvergensen klar, Del 1
  punkt 3): PRD:er för listan + eventsidan (/to-prd) → skivor
  (/to-issues) → ADR-073-parallell-batch; därefter end-pass med skörd
  (14 kandidater) + BUILD-LOG + N+1.**
- [x] **FACIT-UTÖKNINGEN K73–K85: SKAPA NYTT EVENT** (2026-07-20,
  Del 7 kanonisk plats; `c27bc54`→`5e9809c`, T79-taggad): Marcus-
  fångst post-facit ("glömt Skapa nytt event!") → väg A → ingången
  K73 (riven) → **K74 LÅST** (kapsel på vy-väljarraden) → sidan
  K75–K84 i K17-formklassen (Event/Eventtyp-språket [ORDLISTA öppet
  dubbelrättad K77→K78] · publicerings-HANDTAGET slide-to-confirm
  [Resend-research; toggle+fyllnad prövade-och-rivna; pling + bock] ·
  drag-vakterna K79 · frans-diagnosen K80 · mono-domänen K81 ·
  "2 dagar"/"1 dag" K83 · obligatorisk-rivningen K84) · **T79 född**
  (custom miranon.se; publiceringsflaggan FINNS EJ i basen) ·
  **SKARP K85**: falsk fokusring vid mus-öppnade dropdowns släckt
  (RAC-modalitets-regeln i base.css, fulla grindar) · **FACIT:
  Marcus "nöjd med denna sida som facit också"** — facit-SHA
  `a303c65`; bilagorna uppdaterade (S73 +3 skärmar + trail; S72
  utöknings-notering) · miljö-incident ×2: watcher-döva dev-servrar
  (curl-verifiera serverad modul — formen etablerad) ·
  lesson-kandidater nu 18. **NÄSTA: PRD:erna för HELA familjen
  (lista + eventsida + skapa; /to-prd) → skivor (/to-issues) →
  ADR-073-batch · chevron-konsekvensen (Marcus-kvittens) ·
  hemvist-/Mer-ingångs-frågorna vid PRD · session-end med skörd
  (18 kandidater) + BUILD-LOG + N+1.**
- [x] **STÄNGD** (2026-07-21, Marcus coverage-kvittens "Inget att
  säkra, flippa." — post 3 explicit inget att säkra): `lifecycle:
  closed`; do-confirm-passets enda SAKNAS (T78-radsynken `45bbb29`)
  åtgärdad före flip. **NÄSTA = NY SESSION S74: familje-PRD:erna
  (lista + eventsida + skapa; /to-prd) → skivor (/to-issues) →
  ADR-073-batch · chevron-konsekvensen · T79 · hub-lyftet
  L284–L304 + T78-hubhalvan.**
- [x] **SESSION-END-PASSET** (2026-07-20, Marcus-order "Vi kör
  session-end först"; Del 8 kanonisk plats): SKÖRDEN 18 kandidater →
  **L294–L304** (11 [UNIVERSAL]; k3 förkastad som L286/L290-instans,
  k4 som L25-förstärkning — motiv i Del 8) · **BUILD-LOG S73-post**
  (fem pass, två facit, fyra skarpa, incidenterna) · Del 8
  (skörde-redovisning + transcript-referenser ×4 wc-verifierade +
  numrering: 074/L305/T80/f45) · dev-servern stoppad. **NÄSTA (N+1):
  familje-PRD:erna → skivor · chevron-konsekvensen · T79 · hub-lyftet
  L284–L304 + T78-hubhalvan.** Stängningen (lifecycle: closed +
  AVSLUTAD-rubrik) väntar på Marcus coverage-kvittens
  (stängnings-grind 2, ADR-069).

### Session 72 ✅ AVSLUTAD (2026-07-19) — Event-listan: grillad samsyn → konvergens till FACIT (variant B, K1–K14) + skarpa skal-fixar + T78

> Scope: sessionsdok `2026-07-19-session-72.md` Del 1 (kanonisk plats):
> hela event-familjen som mål, EN sida i taget — listan först; kedjan
> grillning → konvergens → facit → PRD → skivor → ADR-073-batch.
> Kadensrad per L67. (Sektionen född vid Del 2-landningen, ej
> dok-födelsen — S70-precedenten, öppet bokfört.)

- [x] **Dok-födelse** (2026-07-19): `18fad51`, run 29687530526 grön
  per jobb (docs-only-formen); numrering disk-verifierad (ADR 074
  [73==73], L290, f45, T78); audit-ci PASSED; plugin 1.16.0 AKTIV
  (fjärde sessionen med asynkrona vakten). **NÄSTA: grillningen.**
- [x] **GRILLAD SAMSYN LÅST — event-listan till FK-mönstret**
  (2026-07-19, Del 2 kanonisk plats): 8 beslut Marcus-kvitterade —
  hela familjen som mål/listan först · grund-arvet (allt ärvbart
  ärvs) · pill-toggle [Kommande|Tidigare] ersätter båda Selecterna
  (väg A; prototyp-förbehåll) · månadsgrupprubriker båda lägena ·
  kort-anatomin 3 rader (typ/betalräknare/tidKvar UTE) · statusbadge
  endast avvikelse (Inställt/Flyttat; **T14 reconcilierad**, not
  uppdaterad) · strukturerat text-tomläge (ingen illustration) ·
  pill-toggle = primitiv (RAC ToggleButtonGroup) + EventCard/
  gruppering vy-lokala + **`?period=upcoming|past`** ersätter
  `?status`+`?sort`. FK-referensen +9 bilder (vab-wizardserien
  IMG_1590–1598, `3a3887d`) · ORDLISTA **Period** (`f4b406a`) ·
  ingen ny ADR (allt under baren; 73==73). **NÄSTA:
  konvergens-passet i browsern → låst facit → PRD + skivor.**
- [x] **KONVERGENSEN TILL FACIT — hela event-listans yta låst**
  (2026-07-19, Del 3 kanonisk plats; bilagan
  `s72-event-lista-konvergens/` = facit-kanon): T66-instans 3,
  K1–K14. Variant B vann divergensen (Marcus-val) → **Steg 2**
  slot-modellen (likformiga kort, badge-formen prövad-och-riven,
  semantisk status-slot, Fullbokat-kontur, Inställt dimmat, bor
  över-raden [FÄLTET FINNS EJ I BASEN — PRD-krav]) → **Steg 3**
  kalendervyn (RAC-motorn + FK-skinnet, vy-ikon-toggeln, solida
  kursfärgs-tiles == legenden, månadssummeringen) → **FACIT**
  (Marcus: "vi låser hela event-listans yta"). SKARPT vid sidan:
  scrollbar-formen `5f93c9a`→`efeb288` (lg-scopad stable
  both-edges + thin-tumme; 2 CI-röda = facit-testernas förtjänst,
  röd→grön + full svit före läkning) · **T78** född
  (PrototypeSwitcher-standardiseringen) · 4 röda main-commits
  öppet bokförda och läkta · lesson-kandidater i Del 3.
  **NÄSTA: session-end → S73 tar EVENTSIDAN (detaljvyn,
  Marcus-deklarerad); öppen punkt: list-PRD:ts födelsetidpunkt.**
- [x] **END-PASSET KÖRT — coverage i STOPPA** (2026-07-19, Del 4
  kanonisk plats): skörd **L290–L291** [UNIVERSAL] (vaktens fråga
  bevisas besvarbar före armering · grind-förkontroll = grindens HELA
  form) + 4 kandidater förkastade med motiv · BUILD-LOG S72-post ·
  transcript-ref wc-verifierad (20 185 034 byte/1 773 rader; 26
  commits `18fad51`→`84e1a6a`) · numrering: ADR 074 · L292 · fälla
  45 · T79 · intentions-grind PASSERAD (nästa = NY session S73:
  eventsidan). Hub-lyftet L284–L291 buntas till nästa hub-beröring.
  Coverage-rapporten i STOPPA; lifecycle-flip väntar Marcus-kvittens.

- [x] **STÄNGD efter Marcus-kvittens** (2026-07-19): coverage-rapporten
  kvitterad ("Inget att säkra, flippa"); post 3 explicit inget att
  säkra. `lifecycle: closed` + rad 7-slutsummeringen +
  S71-text-flytten verbatim i denna stängnings-commit; Del 4-vakten
  grön FÖRE pushen (run 29702494980 per jobb, docs-only-formen).
  Kvar Marcus-moment: Update-klicket i claude.ai. **NÄSTA: S73
  (fräsch chatt) — EVENTSIDAN · list-PRD-punkten · hub-lyftet
  L284–L291 vid nästa hub-beröring.**

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid
> S72-stängningen (rad 7 bär alltid senast stängda sessionen).

*Senast uppdaterad: 2026-07-19 (**Session 71 ✅ AVSLUTAD 2026-07-19** (`lifecycle: closed` efter Marcus coverage-kvittens "Inget att säkra, flippa"; post 3 explicit inget att säkra) — **TASK-16 DONE: ADR-060-PURGENS WIRING SKARP I DRIFT — 22+288 sentineler raderade · alla fyra skyddsräcken skarp-bevisade · L288–L289.** FÖDELSEN (`cdac60c`, run 29684112704 grön per jobb): numrering disk-verifierad (74/L288/f45/T78); plugin 1.16.0 AKTIV (tredje sessionen med asynkrona vakten); Marcus-kvittens "Kvitterar A — kör TASK-16." efter öppen nu-vs-vänta-analys; S72-riktningen deklarerad i samma kvittens (grillning + hela kedjan på event-vyn). **LEVERANSEN** (`e57b2b2`, delegerad senior-form "branschledarmässigt = den vägen"): setup-purge per ADR-060 p3–4 ordagrant — separat CI-jobb **Staging sentinel purge** FÖRE Test+Build (egen runner-VM, egen least-privilege-secret STAGING_AIRTABLE_TOKEN scopad till ENBART staging-basen apphjj8Q7lkXCMsL4; EF-only-gränsen intakt — test-jobbet ser aldrig token; Test+Build `needs: [changed, purge]` med skipped-tolerans men failure-stopp; ci-passed aggregerar — inget falsk-grönt hål) + purge-motorn med FYRA skyddsräcken (bas-guard m. hårt blockerad prod-bas [ID-topologin: staging/prod DELAR tabell-ID:n] · ålders-guard 60 min i KOD på createdTime [CREATED_TIME() i filterByFormula odokumenterad — förstapartskälls-verifierat] · exakt markör-match [ZZ-History + Eventformat-fixturen träffas aldrig] · namn-agnostisk länk-guard [live-schema-fyndet: fältet heter "Anmälningar (länkat fält)"]) + `.purge-staging-policy.json` (config-driven) + `npm run purge:staging` (.env.seed) + guard-testsvit 25 fall. **SKARP-KEDJAN:** MCP-förbevis → run 29685010681 Anmälningar **22/22 + efter-verifiering 0** ✓ men 288/288 event-sentineler länk-guardade på Eventtyp (konstruktions-obligatorisk typ-referens ADR-066 b5; fail-safe-riktningen = ofarlig no-op, 0 felraderingar) ⇒ **linkGuardExcludeFields** (`d599953`, +2 tester: exkluderingen-raderar + exkluderingen-är-smal) ⇒ run 29685680050 **288/288 raderade + efter-verifiering 0 + ålders-guarden SKARP-BEVISAD live (4+4 färska skyddade)**; lokala formen dry-run-bevisad efter Marcus .env.seed-moment (6+6, alla ålders-skyddade — basen ren; cred-fil diagnostiserad med grep-räknare, aldrig cat). **SIDOSPÅRET** (ADR-053-triage: blockerar + utanför scope ⇒ STOPPA): shields.io-outage fällde Docs link check ×2 (dubbel-bevisad äkta outage: lokal curl 000/15 s från separat nät; Errors 0) ⇒ Marcus-kvitterad väg A ("branschledarpraxis"): `.lycheeignore`-post (add-only-beviskravet uppfyllt; badge-dekor utanför länk-grinden, jfr ADR-022 kat. 4) + badge-driften fixad (Biome major-only 2.4→2 · TypeScript 6→7) i `55b0157`, run 29685511779 grön per jobb. CI:s förväntade jobbform är nu SEX jobb (docs-only skippar purge+Test+Build by design — bevisat run 29685962055). gh-frågan besvarad verifierat: 2.88.1 bakom 3 advisories ⇒ `brew upgrade gh` → 2.96.0; ingen repo-åtgärd (lokalt brew-verktyg). SKÖRD: **L288–L289** [UNIVERSAL] (strukturell fail-safe-vakt skiljer konstruktions-obligatorisk referens från verklig data-koppling — annars 100 %-guard = no-op · förkontroll ställer vaktens FAKTISKA fråga — bästa formen är mekanismens egen dry-run) + 4 kandidater FÖRKASTADE med motiv i Del 3; inga nya trådar; ingen ny ADR (wiringen = implementering av redan beslutad form; ADR-060 Updates-post bär landningen; 73==73). BUILD-LOG S71-post + transcript-ref (Code-JSONL 1 830 041 byte/753 rader wc-verifierad vid Del 3). Numrering vid stängning: nästa ADR **074** · lesson **L290** · fälla **45** · tråd **T78**. **NÄSTA (NY session S72 — HANDOFF): grillning + hela kedjan på event-vyn (Marcus-deklarerad riktning → skivor för parallell batch-test per ADR-073) · hub-lyftet L284–L289 vid nästa hub-beröring; Marcus-moment: Update-klicket i claude.ai.** Full narrativ: sessionsdok Del 1–3. S70 ✅ i egen sektion nedan.)*

### Session 71 ✅ AVSLUTAD (2026-07-19) — TASK-16: ADR-060-purgens wiring skarp i drift (22+288 raderade · kortet Done · L288–L289)

> Scope: sessionsdok `2026-07-19-session-71.md` Del 1 (kanonisk plats):
> TASK-16-exekvering via do-work-formen (Marcus-kvittens "Kvitterar A —
> kör TASK-16." efter nu-vs-vänta-analysen; S72-riktningen deklarerad i
> samma kvittens: grillning + hela kedjan på event-vyn). Kadensrad per
> L67.

- [x] **Dok-födelse** (2026-07-19): `cdac60c`, run 29684112704 grön
  per jobb (docs-only-formen); numrering disk-verifierad (ADR 074
  [73==73], L288, f45, T78); audit-ci PASSED; plugin 1.16.0 AKTIV
  (tredje sessionen med asynkrona vakten). **NÄSTA: TASK-16 via
  do-work.**
- [x] **TASK-16 LEVERERAD + Done — purge-wiringen skarp i drift**
  (2026-07-19, Del 2 kanonisk plats): `e57b2b2` (leverans: purge-motor
  och policy och 23 guard-tester och CI-jobbet Staging sentinel purge
  och npm run purge:staging; ADR-060 p3–4 ordagrant, EF-only-gränsen
  intakt) → `55b0157` (grind-sidospår Marcus-kvitterad väg A:
  shields.io → .lycheeignore [dubbel-bevisad outage] + badge-drift
  Biome 2/TS 7) → `d599953` (S71-fyndet: linkGuardExcludeFields —
  Eventtyp-referensen [ADR-066 b5] undantas, 288/288 bar exakt den;
  +2 tester = 25). Skarp-kedjan: run 29685010681 Anmälningar 22/22 +
  efter-verifiering 0 → run 29685680050 **288/288 raderade +
  efter-verifiering 0 + ålders-guarden skarp-bevisad (4+4 färska
  skyddade)**. Kortet Done med final-summary (tvåstegs K61.1;
  CI-grön-första-pass: nej — öppet bokfört). Marcus-moment kvar:
  lokala `.env.seed`. **NÄSTA: end-pass på Marcus-signal.**
- [x] **END-PASSET KÖRT — coverage i STOPPA** (2026-07-19, Del 3
  kanonisk plats): lokala formen dry-run-bevisad efter
  `.env.seed`-momentet (6+6 träffar, alla ålders-skyddade — basen ren;
  båda konsumtionsvägarna bevisade) · `brew upgrade gh` 2.88.1→2.96.0
  (3 advisories stängda) · skörd **L288–L289** [UNIVERSAL]
  (fail-safe-vakt skiljer konstruktions-referens från data-koppling ·
  förkontroll ställer vaktens faktiska fråga) + 4 kandidater
  förkastade med motiv · inga nya trådar · ingen ny ADR (wiringen =
  implementering av ADR-060 p3–4; Updates-posten bär landningen;
  73==73) · BUILD-LOG S71-post · transcript-ref wc-verifierad
  (1 830 041 byte/753 rader vid Del 3) · numrering: ADR 074 · L290 ·
  fälla 45 · T78 · intentions-grind PASSERAD (nästa = NY session S72:
  grillning + hela kedjan på event-vyn). Hub-lyft L284–L289 buntas
  till nästa hub-beröring. Coverage-rapporten i STOPPA;
  lifecycle-flip + rad 7-slutsummeringen väntar Marcus-kvittens.

- [x] **STÄNGD efter Marcus-kvittens** (2026-07-19): coverage-rapporten
  kvitterad ("Inget att säkra, flippa"); post 3 explicit inget att
  säkra. `lifecycle: closed` + rad 7-slutsummeringen +
  S70-text-flytten verbatim + S70-rubrik-reparationen (rubriken åts
  av S71-sektions-editen — upptäckt vid flytten, öppet bokfört) i
  denna stängnings-commit; Del 3-vakten grön (run 29686664816 per
  jobb, docs-only-formen) FÖRE pushen. Kvar Marcus-moment:
  Update-klicket i claude.ai. **NÄSTA: S72 (fräsch chatt) —
  grillning + hela kedjan på event-vyn · hub-lyftet L284–L289 vid
  nästa hub-beröring.**

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid S71-stängningen
> (rad 7 bär alltid senast stängda sessionen).

*Senast uppdaterad: 2026-07-19 (**Session 70 ✅ AVSLUTAD 2026-07-19** (`lifecycle: closed` efter Marcus coverage-kvittens "Inget att säkra, flippa."; post 3 explicit inget att säkra) — **DEPENDABOT-PASSET #58–#63: inbox 0 — 4 merges + 2 durabelt stängda + allowlist-rivningen + biome migrate + TS7 på empiri + TASK-16 klassad · L286–L287.** FÖDELSEN (`601cba3`, run 29680248553 grön per jobb): numrering disk-verifierad (74/L286/f45/T78); plugin 1.16.0 AKTIV (ANDRA sessionen med asynkrona CI-vakten — samtliga vakter bakgrundade). **#58 MERGAD** (`a39a388`): felanalysen friade paketen — rött var markdownlint-MD036, merge-ref äldre än S67:s ADR-010-fix ⇒ L279-klass, parkeringens "#46-klass"-hypotes FALSIFIERAD; supply-chain FÖRE åtgärd (lychee-SHA == v2.9.0-taggen exakt · advisory historisk · setup-node first-party pin-skärpning); rebase → helgrön. **#62 ⇒ DURABEL REGEL** (`fd3b628`): spegel-principen kodifierad som dependabot-ignore semver-major @types/node (L285-formen i stället för tredje återkommande stängningen; syntax käll-verifierad; lyft-villkoret i regelkommentaren); dependabot STÄNGDE SJÄLV #62 på sekunder — regeln bevisad i drift; sidoeffekt öppet bokförd: config-re-parsen omgrupperade #61→#64 (Biome 2.5.4 + vite 8.1.5). **ALLOWLIST-RIVNINGEN** (`606ffef`, S17-tråden STÄNGD): GHSA-gv7w-rqvm-qjhr riven — sluttillståndet STARKARE än riv-villkoret (esbuild HELT ute ur trädet, `npm ls` tomt; npm audit 0 träffar; audit-ci PASSED utan varningen); K0åh-historikformen; S17-riv-todon bockad. **MERGE-KEDJAN** main-CI grön PER STEG: #59 tanstack ×3 (`667b239`) → #60 supabase-js 2.110.6 (`32cf128`) → #64 (`aec61cf`) → biome migrate (`c19fd79`: schema-driften 2.4.15→2.5.4 stängd per S69-villkoret + nyckel-renamen recommended→preset; check 0 fel före/efter). **#63 TS 6.0.3→7.0.2 (nativa Go-kompilatorn) MERGAD PÅ EMPIRI** (`b3e3011`, run 29681765375 full Test+Build grön per jobb): minimaltest i isolerad worktree FÖRE väg-val (typecheck 2,0 s · build+PWA grön) + registry-fakta (latest sedan 2026-07-08; cooldown uppfylld) + upstream-annons (--build/--noEmit stödda; API-gapet berör ej repot) + proveniens utan regression; typecheck main-trädet 7,85→2,5 s (~3×); rollback trivial. **TASK-16 KLASSAD ready-for-agent + medium** (`34f8ac8`; Marcus-ordern + substrat-bedömningen; deadline-signal ≈ 2026-08-30; EF-only-gränsen i klassnings-noten). HYGIEN: labels dependencies+ci skapade (config-deklarerade men saknade i repot). AVVIKELSER ÖPPET BOKFÖRDA: L280-ÅTERFALL ×1 (tail-pipe maskade markdownlint-exit → `8c619e2` pushad röd [MD018] → fix `976ec99`; grindarna därefter på obruten exit-kod) · vakt-avvikelsen (fel workflow på delad headSha, en-jobbs-signaturen) → **L286** · npm install-lockfil-driften → **L287** · R2:s dependabot-gren SKARPBEVISAD ×4 (parallella PR-runs under pågående main-run). SKÖRD: **L286–L287** [UNIVERSAL] (CI-vakt = headSha × workflow-identitet med jobbform-kontroll [skärper L265] · npm ci som post-merge-synkverb [preciserar L275]) + 5 kandidater FÖRKASTADE med motiv i Del 3; inga nya trådar (S17-riv-tråden stängd); ingen ny ADR (ignore-regeln under baren; 73==73). BUILD-LOG S70-post + transcript-ref (Code-JSONL 1 302 607 byte/639 rader wc-verifierad vid Del 3). Numrering vid stängning: nästa ADR **074** · lesson **L288** · fälla **45** · tråd **T78**. **NÄSTA (NY session S71 — HANDOFF): nästa PRD/parallell batch på 1.16.0-registryn · TASK-16 plockbar (ready-for-agent, deadline-signal ≈ 2026-08-30) · hub-lyftet L284–L287 vid nästa hub-beröring; Marcus-moment: Update-klicket i claude.ai.** Full narrativ: sessionsdok Del 1–3. S69 ✅ i egen sektion nedan.)*

### Session 70 ✅ AVSLUTAD (2026-07-19) — Dependabot-passet #58–#63: inbox 0 (4 merges + 2 durabelt stängda + allowlist-rivningen + TS7)

> Scope: sessionsdok `2026-07-19-session-70.md` Del 1 (kanonisk plats):
> Dependabot-passet (felanalys #58 → spegel-prövningen #62 →
> major-review #63 → gröna gruppen → allowlist-prövningen) ·
> TASK-16-klassningen i Marcus-takt · end-pass på signal. Kadensrad
> per L67. (Sektionen född vid Del 2-landningen, ej dok-födelsen —
> öppet bokfört i Del 2.)

- [x] **Dok-födelse** (2026-07-19): `601cba3`, run 29680248553 grön
  per jobb (docs-only: Test+Build by-design-skippad, Docs link check
  körd+grön); numrering disk-verifierad (ADR 074 [73==73], L286, f45,
  T78); audit-ci PASSED; plugin 1.16.0 AKTIV (andra sessionen med
  asynkrona vakten). **NÄSTA: Dependabot-passet.**
- [x] **DEPENDABOT-PASSET KOMPLETT — inbox 0** (2026-07-19, Del 2
  kanonisk plats): `fd3b628`→`b3e3011` (8 commits, main-CI grön PER
  STEG, alla vakter asynkrona). #58 felanalys friade paketen
  (L279-klass: stale bas vs MD036-fixen; "#46-klass"-hypotesen
  falsifierad; supply-chain-koll SHA==tagg + advisories historiska) →
  rebase → `a39a388` · #62 ⇒ **durabel ignore-regel**
  semver-major @types/node (`fd3b628`, L285-formen; dependabot
  stängde själv PR:n på sekunder; sidoeffekt: #61→#64-omgruppering) ·
  **allowlist-rivningen** GHSA-gv7w-rqvm-qjhr (`606ffef`; esbuild
  HELT ute ur trädet — starkare än S17-villkoret; S17-riv-todon
  bockad) · #59 tanstack (`667b239`) · #60 supabase (`32cf128`) ·
  #64 Biome 2.5.4+vite 8.1.5 (`aec61cf`) + **biome migrate**
  (`c19fd79`, schema-driften stängd) · **#63 TS 6→7 mergad på
  empiri** (`b3e3011`: worktree-minimaltest grönt FÖRE väg-val;
  typecheck 7,85→2,5 s ~3×; full Test+Build grön per jobb run
  29681765375; proveniens utan regression). Hygien: labels
  dependencies+ci skapade · vakt-avvikelsen (workflow-filter) ×1
  korrigerad · npm ci-formen ersatte npm install. **NÄSTA:
  TASK-16-klassningen (Marcus) · end-pass på signal.**
- [x] **TASK-16 KLASSAD + END-PASSET KÖRT — coverage i STOPPA**
  (2026-07-19, Del 3 kanonisk plats): TASK-16 → ready-for-agent +
  medium via CLI:t (`34f8ac8`, run 29683361009 grön per jobb;
  Marcus-order + substrat-bedömning; deadline-signal ≈ 2026-08-30) ·
  skörd **L286–L287** [UNIVERSAL] (vakt = headSha ×
  workflow-identitet med jobbform-kontroll [skärper L265] · npm ci
  som post-merge-synkverb [preciserar L275]) + 5 kandidater
  förkastade med motiv ·
  L280-återfall ×1 öppet bokfört (räkning, ej ny post) · inga nya
  trådar; S17-riv-tråden stängd · ingen ny ADR (ignore-regeln under
  baren) · BUILD-LOG S70-post · transcript-ref wc-verifierad
  (1 302 607 byte/639 rader vid Del 3) · numrering: ADR 074 (73==73) ·
  L288 · fälla 45 · T78 · intentions-grind PASSERAD (nästa = NY
  session S71). Hub-lyft L284–L287 buntas till nästa hub-sync.
  Coverage-rapporten i STOPPA; lifecycle-flip + rad 7-slutsummeringen
  väntar Marcus-kvittens.
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-19): coverage-rapporten
  kvitterad ("Inget att säkra, flippa."); post 3 explicit inget att
  säkra. `lifecycle: closed` + rad 7-slutsummeringen +
  S69-text-flytten verbatim i denna stängnings-commit; Del 3-vakten
  grön (run 29683473537 per jobb) FÖRE pushen. Kvar Marcus-moment:
  Update-klicket i claude.ai. **NÄSTA: S71 (fräsch chatt) — nästa
  PRD/parallell batch på 1.16.0 · TASK-16 plockbar (deadline
  ≈ 2026-08-30) · hub-lyftet L284–L287 vid nästa hub-beröring.**

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid S70-stängningen
> (rad 7 bär alltid senast stängda sessionen).

*Senast uppdaterad: 2026-07-19 (**Session 69 ✅ AVSLUTAD 2026-07-19** (`lifecycle: closed` efter Marcus coverage-kvittens "Inget att säkra, flippa."; post 3 explicit inget att säkra) — **FYND-KORTEN: TASK-15 quotepath-fixen + TASK-14 kall-morgon-mätningen → ADR-060-städningen + TASK-13 Node-lyftet — 3 kort Done · TASK-16 fött · L284–L285.** FÖDELSEN 23:50 18/7 (`ed83495`, run 29662614656 grön per jobb): numrering disk-verifierad (74/L284/f45/T78); plugin **1.16.0 AKTIV** (omstarts-momentet avklarat — FÖRSTA sessionen med asynkrona CI-vakten skarp; samtliga vakter bakgrundade i headSha-formen; L265-avvikelse i födelse-vakten [`--commit`-filtret, tomt svar på kort SHA] öppet bokförd + korrigerad); ordningsbytet TASK-15 i kväll/TASK-14 kall morgon Marcus-kvitterat efter förklaringspasset (mätvillkoret: staging hamrad till 21:44 — kvällsmätning kunde inte skilja hypoteserna). **TASK-15 DONE** (`378db8c` + kontrastbevis `7f36257`): `quotepath: false` på BÅDA changed-stegen — K1.17-klassen käll-belagd trippel (jobbgraf run 29657524469 ⇒ only_changed=false · fil-listan: enda klasskillnaden = UTF-8-kortfilen · quotepath-oktalformen + input-dumpens default true); upstream-inputen verifierad i action.yml @ pinnade SHA:n; FÖLJDFYNDET docs-steget (UTF-8-.md-ändring skulle TYST skippa Docs link check — allvarligare granne) fixat i samma invariant; kontrastbeviset run 29663106983 kortfils-only ⇒ Test+Build SKIPPED + Docs link check körd grön (före-bilden full svit ~7 min) — därefter bevisat i drift på sessionens ALLA stängnings-commits. **TASK-14 DONE**: kall-morgon-serien (09:35, ~9 h vila) filtrerad 32,67/31,63/31,92 s vs ofiltrerad ~1,6 s ⇒ transient-hypotesen FALSIFIERAD; mekanismen belagd: staging-secreten REGISTRATIONS_BATCH_SIZE=2 (S26) × **354 create-test-sentineler** på seed-ankarets event ⇒ 180 SERIELLA Airtable-anrop × ~177 ms EU-RTT (`x-sb-edge-region: eu-central-1` — EF exekverar i ANROPARENS region ⇒ CI-grön/lokal-röd = runner-geografi, L284); forensiken vände klassningen: MEDVETET ADR-060-punkt-5-interim, ej läcka (e2e mockar create; S52-prejudikatet fanns i ADR:ns Updates); Marcus-väg B ⇒ markör-matchad MCP-radering av samtliga 354 ur staging-basen apphjj8Q7lkXCMsL4 (bas-identitet TRIPPELVERIFIERAD: seed-ankaret positivt hämtat + basnamnet + prod utan sentinel-träffar; seed + 4 icke-sentineler bevarade; efter-koll 0 träffar; 36 batchar à ≤10) ⇒ **väg D 1,30/1,39/1,31 s · lokala fulla sviten 294/296 → 296/296 (20,1 s) RÖD→GRÖN**; ADR-060 Updates-post (ANDRA tröskeln); timeout-höjning (kortets eget räcke) · EF-parallellisering (prod 8 anrop vid batch 50 — golvet ohotat) · A-härdningen (vore omdesign av båda testernas seed-ankare mot ADR:ns uttalade val) FÖRKASTADE med motiv (`843fccd`→`66c2451`, runs 29678945234/29678985864). **TASK-13 DONE** (`0ef57f4`, run 29679590743 grön per jobb med FULL Test+Build på **v24.18.0** — jobblogg-verifierat, ej antaget): Node-lyftet 20→24 LTS i EN ändring (.nvmrc 24 · engines >=24 · @types/node ^24.13.3 medvetet NED från 25 per spegel-principen från #46-stängningen · README-badgen); CI:s tre setup-node-steg följde node-version-file automatiskt; kompat KÄLL-VERIFIERAD (nodejs/Release schedule.json: v24 Active LTS EOL 2028-04-30, v20 EOL 2026-04-30 · Playwright: 'latest 22.x, 24.x or 26.x' — Node 20 UTE ur stödlistan · Vite 20.19+/22.12+ uppfylls · Biome fristående binär, wrapper >=14.21.3); empirin: lokala noden var redan v24.13.1 — lyftet stängde CI/lokal-driften; biome.json-schema-driften (pre-existerande varning från 2.5-bumpen) noterad ⇒ biome migrate vid nästa Biome-beröring. **TASK-16 FÖTT** (utan triage-etikett — oplockbart tills Marcus klassar): ADR-060-purgens wiring per punkt 3–4 — interim-premissen 'bounded tolereras' falsifierad ×2 (S52 + S69); återackumuleringstakten ~2–3 sentineler/svitkörning ≈ 250/månad ⇒ **~6 veckors horisont** som deadline-signal (L285-mönstret). SKÖRD: **L284–L285** [UNIVERSAL] (miljö-delad latens-anomali diagnostiseras som anropskedja × RTT × exekverings-region — CI-grön/lokal-röd kan vara geografi, inte kod · medvetet tolererat interim utan kvantifierad horisont falsifieras tyst — föds med takt × tröskel-horisont + durabel trigger) + 4 kandidater FÖRKASTADE med motiv i Del 6 (L265-återfallet = befintlig lesson, återfall ×1 öppet · MD004-radbrytet = fångat av bundna formen · quotepath-mekaniken = K1.17-buren · MCP-batchformen = S52-prejudikat i ADR-060); inga nya trådar (TASK-16 = kort-formen; MCP-prod-observationen + biome-driften öppet noterade under baren); hub-lyft L284–L285 buntas till nästa hub-sync (ingen hub-beröring i S69). BUILD-LOG S69-post + transcript-ref (Code-JSONL 2 115 561 byte/823 rader wc-verifierad vid Del 6). Numrering vid stängning: nästa ADR **074** (73==73 — ADR-060-updaten ändrar ej antal) · lesson **L286** · fälla **45** · tråd **T78**. **NÄSTA (NY session S70 — HANDOFF): Dependabot-passet #58–#63 (+pröva allowlist-avlistningen GHSA-gv7w-rqvm-qjhr; #58 röd overifierad [trolig #46-klass] · #63 typescript 6→7 MAJOR · #59–#62 gröna vid parkeringen) · TASK-16-klassningen (Marcus) · nästa PRD/parallell batch på 1.16.0-registryn; Marcus-moment: Update-klicket i claude.ai.** Full narrativ: sessionsdok Del 1–6. S68 ✅ i egen sektion nedan.)*

### Session 69 ✅ AVSLUTAD (2026-07-18/19) — Fynd-korten: TASK-15 quotepath-fixen → TASK-14 kall-morgon-mätningen + ADR-060-städningen → TASK-13 Node-lyftet (3 kort Done · TASK-16 fött · L284–L285)

> Scope: sessionsdok `2026-07-18-session-69.md` Del 1 (kanonisk plats):
> TASK-15 kvälls-ingång (ordningsbytet mot TASK-14:s kall-morgon-villkor
> Marcus-kvitterat) → TASK-14-mätningen i morgon bitti → TASK-13 ·
> Dependabot-passet i mån av scope. Kadensrad per L67.

- [x] **Dok-födelse** (2026-07-18): `ed83495`, run 29662614656 grön per
  jobb (docs-only: Test+Build by-design-skippad, Docs link check
  körd+grön); numrering disk-verifierad (ADR 074 [73==73], L284, f45,
  T78); audit-ci PASSED; plugin **1.16.0 AKTIV** (omstarts-momentet
  avklarat — första sessionen med asynkrona CI-vakten skarp);
  L265-avvikelse i födelse-vakten (`--commit`-filtret på kort SHA)
  öppet bokförd + korrigerad till headSha-match. **NÄSTA: TASK-15.**
- [x] **TASK-15 LANDAD + Done** (2026-07-19, Del 2 kanonisk plats):
  `quotepath: false` på BÅDA changed-stegen (`378db8c`, run
  29662884252 grön per jobb inkl. full Test+Build by design) —
  K1.17-klassen käll-belagd trippel (jobbgraf + fil-lista +
  quotepath-mekaniken); följdfyndet docs-steget (UTF-8-`.md`-ändring
  skulle TYST skippa Docs link check) fixat i samma invariant;
  **KONTRASTBEVISET** run 29663106983 (kortfils-only `7f36257`):
  Test+Build SKIPPED + Docs link check körd grön — före-bilden
  29657524469 full svit på samma fil-klass. Tvåstegs-stängning med
  asynkron vakt ×2. **NÄSTA: TASK-14 kall-morgon-mätningen
  (morgonen).**
- [x] **TASK-14-MÄTNINGEN + KLASSNINGEN** (2026-07-19, Del 3 kanonisk
  plats): kall morgon (09:35, ~9 h vila) filtrerad 32,7/31,6/31,9 s
  vs ofiltrerad ~1,6 s ⇒ **transient FALSIFIERAD**; mekanismen
  belagd: batch=2-secreten (S26) × N=357 på fixtur-eventet
  (juli-kohorten 250 = test-ackumulering, TASK-2-klassen) ×
  sekventiell chunk-loop × EU-RTT (`x-sb-edge-region: eu-central-1`,
  ~177 ms/anrop ×180) ≈ 32 s; CI-grön/lokal-röd = US-runner-RTT.
  Timeout-höjning + EF-parallellisering avförda med motiv.
  **Åtgärdsvalet eskalerat (STOPPA): A test-immunisering ·
  B städning med läck-forensik. Kortet In Progress tills vägval.**
- [x] **TASK-14-ÅTGÄRDEN: ADR-060-städningen — väg D 32 s → 1,3 s,
  sviten 296/296** (2026-07-19, Del 4 kanonisk plats; Marcus-beslut
  "din rekommendation" = B): forensiken visade MEDVETET interim, inte
  läcka (e2e mockar; ADR-060 punkt 5; S52-prejudikatet) →
  markör-matchad MCP-radering av 354 sentineler ur staging-basen
  (bas-identitet trippelverifierad; seed + 4 icke-sentineler bevarade;
  efter-verifiering 0 träffar) → **väg D 1,3 s ×3 · lokala sviten
  294/296 → 296/296 RÖD→GRÖN**; **TASK-16 fött** (purge-wiringen,
  ADR-060 punkt 3–4; ~6 veckors återackumuleringshorisont; utan
  triage-etikett) + ADR-060 Updates-post (andra tröskeln); A-härdningen
  öppet förkastad med motiv. **NÄSTA: TASK-14-stängningen (tvåstegs)
  → TASK-13/Dependabot-passet i mån av scope.**
- [x] **TASK-13 LANDAT + Done: Node-lyftet 20 → 24 LTS** (2026-07-19,
  Del 5 kanonisk plats; efter Marcus förklarings-pass + "kör task
  13"): EN sammanhållen ändring (`0ef57f4`) — .nvmrc 24 · engines
  >=24 · @types/node ^24.13.3 (spegeln: types följer runtime, NED
  från 25) · README-badgen; CI:s setup-node följde .nvmrc
  automatiskt. AC 4 käll-verifierad (nodejs/Release: v24 Active LTS
  EOL 2028-04-30 · Playwright: Node 20 UTE ur stödlistan · Vite
  22.12+ uppfylls · Biome binär). Bevis: lokalt allt grönt inkl.
  296/296; CI-run 29679590743 grön per jobb med FULL Test+Build på
  **v24.18.0** (jobblogg-verifierat). biome.json-schema-driften
  (pre-existerande, endast varning) noterad → `biome migrate` vid
  nästa Biome-beröring. **NÄSTA: end-pass på Marcus-signal
  (Dependabot-passet #58–#63 kvar som S70-ingång).**
- [x] **END-PASSET KÖRT — coverage i STOPPA** (2026-07-19, Del 6
  kanonisk plats): skörd **L284–L285** [UNIVERSAL] (miljö-delad
  latens = kedja × RTT × exekverings-region [CI-grön/lokal-röd kan
  vara geografi] · tolererat interim kräver kvantifierad horisont +
  durabel trigger [ADR-060-bounded ×2 + K1.17-dubbelinstansen]) +
  4 kandidater förkastade med motiv; inga nya trådar (TASK-16 =
  kort-formen; observationerna öppet noterade under baren);
  BUILD-LOG S69-post; transcript-ref wc-verifierad (2 115 561
  byte/823 rader vid Del 6); numrering vid stängning: ADR 074
  (73==73) · L286 · fälla 45 · T78; intentions-grind PASSERAD
  (nästa = NY session S70). Hub-lyft L284–L285 buntas till nästa
  hub-sync. Coverage-rapporten i STOPPA; lifecycle-flip +
  rad 7-slutsummeringen väntar Marcus-kvittens.
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-19): coverage-rapporten
  kvitterad ("Inget att säkra, flippa."); post 3 explicit inget att
  säkra. `lifecycle: closed` + rad 7-slutsummeringen +
  S68-text-flytten verbatim i denna stängnings-commit; Del 6-vakten
  grön (run 29679927591 per jobb) FÖRE pushen. Kvar Marcus-moment:
  Update-klicket i claude.ai. **NÄSTA: S70 (fräsch chatt) —
  Dependabot-passet #58–#63 · TASK-16-klassningen · nästa PRD/batch
  med parallell form på 1.16.0.**

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid S69-stängningen
> (rad 7 bär alltid senast stängda sessionen).

*Senast uppdaterad: 2026-07-18 (**Session 68 ✅ AVSLUTAD 2026-07-18** (`lifecycle: closed` efter Marcus coverage-kvittens "Flippa."; post 3 "Inget mer att säkra") — **ARBETSSÄTTS-PAKETET: asynkron CI-vakt (R1) + dependabot ur staging-mutexen (R2) + TASK-14-prioriteringen (R3) + PR-parkeringen + hub-syncen L267–L283.** Föddes ur arbetssätts-utforskningen "väntan på CI" (samma konversation, före sessionsstart): uppmätt nuläge — docs-lane ~1 min · kod-lane 5,5–7 min där staging-stegen = 345 s av Test+Builds 409 s (E2E 209 · API-staging 96 · a11y 40) · 0 röda Test+Build på main i 50-push-fönstret (alla 6 röda i snabbfilerna, L281-klassen) · dependabot ~85 s arbete/upp till 7m15s FIFO-elapsed (run 29654725274: Test+Build 44 s) — + branschresearch med citat (Fowler 10-min-regeln + pipeline-staging · CircleCI 2026: elit-median <3 min, snitt 11 min · Meta/Graphite stacked-diffs-kadensen "committa → nästa, väntan asynkron" · DevEx-feedback-loops [Noda/Forsgren m.fl.] · GitHub merge queue org-krav [bekräftar S66-researchen] · Pocock-korpusen: lokala täta slingor, INGEN synkron CI-väntan i hans loop, trasig CI = prio 1-avbrott; enda divergensen pre-commit-hooken = vårt medvetna ADR-036-val, ej falsifierat). Marcus-order: "vi kör på dina rekommendationer". **R2** (`62750f0` + grind-fix `3ac7751`): Test+Build-concurrency VILLKORLIG — Dependabot-actorn (skippar SAMTLIGA staging-/serversteg per ADR-031 L3) får unik grupp `depbot-<run_id>`, övriga behåller konstant `staging-tests` + `queue: max`; SAMMA predikat (`github.actor`) driver stegens skip OCH grupp-valet → staging-invarianten definitionell även vid re-run; ADR-073-AMENDERING 2 (additiv); L279-verifiering actionlint (CI:ns install-skript) + yamllint 0 fel; **L280-ÅTERFALL ×1 ÖPPET BOKFÖRT** (pipe-maskade docs-grindar push:ade rött [MD028 + Vale.Terms ×3] → fix `3ac7751`; den därefter BUNDNA kedjan stoppade nästa fel [MD004] FÖRE commit — formens bevis); R2-BEVISET run 29657134390 Test+Build SUCCESS genom hela staging-sviten (dependabot-grenen av uttrycket avfyras skarpt först vid nästa dependabot-run — felriktningen godartad: värsta fallet är gamla kö-beteendet). **R1** (hub `dd15831`, plugin 1.15.0→**1.16.0**): do-work steg 5 + work-batch delta 4 — CI-vakten som BAKGRUNDSTASK (headSha-match L265, aldrig --commit), stängningssteget EXEKVERAS ENDAST på vaktens exit 0 (L280-bindning), halt-first vid rött, aldrig ny push före vaktens utfall, batchens kedjeserialisering per kort OFÖRÄNDRAD; tvåstegs-stängningen L263 + semaforen + worktree-reglerna orörda — endast väntans PLACERING flyttas; DOGFOODAD ×5 vakter i S68 (hela hub-arbetet byggt i run-vakttid); **PLUGIN-UPDATEN UTFÖRD I SESSIONEN** på Marcus-direktiv (L267-kedjan: `claude plugin update` → install-record gitCommitSha == hub-HEAD `6f881d3` VERIFIERAD, inte bara versionssträngen — omstarten är enda kvarvarande momentet, S68-registryn låst vid 1.15.0). **R3:** TASK-14 → `ready-for-agent` + HIGH + not via CLI:t (klassnings-akten = Marcus-ordern; kall-morgon-mätningen = NÄSTA SESSIONS INGÅNG — inget av kortet utfört i S68; väg D-latensen är CI-svansens dominant-granne, rotorsaksfixen dubbel utdelning). **PARKERINGEN:** PR #58–#63 (Marcus-order "Vi parkerar de 6 öppna PR:s som ligger tills senare"; vågen född 17:49–17:51 ur gruppfix-omscannen — korsade S67:s inbox-0-bokföring i minutfönstret, ingen S67-miss; #58 RÖD [trolig #46-klass, OVERIFIERAD] · #63 typescript 6→7 MAJOR · #59–#62 gröna; nästa dependabot-pass ärver + R2 gör PR-sidan parallell där). **HUB-SYNCEN** (`6f881d3`, 287 rader): L267–L283 → sex sektioner K62.1–K67.3 med commit-trail-headerblock per S61-precedenten — S67-handoffens vid-nästa-hub-beröring-villkor löst i samma session som beröringen. **TASK-15 FÖTT + KLASSAT ready-for-agent** (post-coverage-rapport, öppet adderat: vakt #5:s KONTRASTBEVIS — backlog-kortfil i docs-commit körde FULL Test+Build [run 29657524469, ebc422c] medan ren docs-commit skippade korrekt [run 29657760975, 6d8c71b] → UTF-8-glob-hypotesen [K1.17-klassen] med bevisrecept + fix-gräns [ci.yml-changed-steget, aldrig backlog-filnamnen L226]; klassad på villkorad Marcus-order + Code-bedömning mot substrat-kontraktet). SKÖRD: **0 nya lessons** — 5 kandidater FÖRKASTADE med motiv i Del 6 (async-mönstret = design ej korrektion [skill/ADR bär]; L280-återfallet = räkning ej ny post; MD004-radbrytet = trivialt + fångat av formen; predikat-align = ADR-buren; dependabot-omscan-vågen = verktygsbeteende by design); inga nya trådar (PR-vågen parkerad durabelt · audit-ci-observationen GHSA-gv7w-rqvm-qjhr deferred till nästa dependabot-pass via BUILD-LOG-NÄSTA — registrerad, ej tyst). BUILD-LOG S68-post + transcript-ref (Code-JSONL 1 851 277 byte/568 rader wc-verifierad vid stängningsredigeringen). Numrering vid stängning: nästa ADR **074** (73==73 — amendering ändrar ej antal) · lesson **L284** · fälla **45** · tråd **T78**. **NÄSTA (NY session — HANDOFF): TASK-14 kall morgon (HIGH, FÖRST — mätreceptet kräver ohamrat staging-dygn) → TASK-15 (glob-verifieringen, andra kort) · TASK-13 Node-lyftet · dependabot-passet #58–#63 (+pröva allowlist-avlistningen) · nästa PRD/batch på 1.16.0-registryn med parallell form som default; Marcus-moment: OMSTARTEN (aktiverar 1.16.0 — updaten redan utförd i S68).** Full narrativ: sessionsdok Del 1–6. S67 ✅ i egen sektion nedan.)*

### Session 68 ✅ AVSLUTAD (2026-07-18) — Arbetssätts-paketet: asynkron CI-vakt (R1) + dependabot ur staging-mutexen (R2) + TASK-14-prioriteringen (R3) + PR-parkeringen + hub-syncen L267–L283

> Scope: sessionsdok `2026-07-18-session-68.md` Del 1 (kanonisk plats):
> R2 villkorlig concurrency → R1 asynkron CI-vakt (hub 1.16.0) → R3
> TASK-14-prioritering + PR-parkeringen #58–#63 → hub-syncen L267–L283 →
> end-pass. Föddes ur arbetssätts-utforskningen "väntan på CI"
> (branschresearch + uppmätt nuläge i Del 1). Kadensrad per L67.

- [x] **Dok-födelse** (2026-07-18): `fd37fec`, run 29657035657 grön per
  jobb (docs-only: Test+Build by-design-skippad, Docs link check
  körd+grön); numrering disk-verifierad (ADR 074 [73==73], L284, f45,
  T78); audit-ci PASSED; advisories historiska (tj-actions 47.0.6-pin >
  patched 46.0.1 · lychee 2.8.0-pin > patched 2.0.2). **NÄSTA: R2.**
- [x] **R2 LANDAD** (2026-07-18, Del 2 kanonisk plats): villkorlig
  concurrency-grupp (`62750f0`) + ADR-073-amendering 2 —
  Dependabot-runs (som skippar samtliga staging-steg) får unik grupp i
  stället för FIFO-kön (S68-empirin: 44 s arbete/7m15s elapsed);
  L279-verifiering actionlint+yamllint i CI:ns exakta form;
  **L280-ÅTERFALL ×1 öppet bokfört** (pipe-maskade grindar push:ade
  rött docs-jobb; fix `3ac7751`); R2-beviset run 29657134390
  Test+Build SUCCESS genom hela staging-sviten + fixrun 29657198592
  helgrön per jobb. **NÄSTA: R1.**
- [x] **R1 LANDAD** (2026-07-18, Del 3): hub `dd15831` — do-work steg 5 +
  work-batch delta 4 + plugin 1.15.0→**1.16.0**; asynkron
  bakgrundsvakt (headSha-match L265; stängningssteget VILLKORAS av
  vaktens exit 0, L280; halt-first vid rött); tvåstegs-stängningen och
  kedjans serialisering orörda. Aktiveras vid Marcus Update-klick +
  omstart. Dogfoodad ×3 vakter i S68. **NÄSTA: R3 + parkeringen.**
- [x] **R3 + PARKERINGEN** (2026-07-18, Del 4): TASK-14 →
  `ready-for-agent` + priority high + not via backlog-CLI:t
  (klassnings-akten = Marcus-ordern; kall-morgon-mätningen = NÄSTA
  SESSIONS INGÅNG, inget utfört i S68); **PR #58–#63 PARKERADE**
  (Marcus-order; vågen född 17:49–17:51 ur gruppfix-omscannen — korsade
  S67:s inbox-0-bokföring i minutfönstret, ingen S67-miss; #58 röd
  [trolig #46-klass, overifierad] · #63 typescript 6→7 MAJOR ·
  #59–#62 gröna; nästa dependabot-pass ärver). **NÄSTA: hub-syncen.**
- [x] **HUB-SYNCEN L267–L283** (2026-07-18, Del 5): hub `6f881d3` — sex
  sektioner K62.1–K67.3, 17 UNIVERSAL-poster med
  commit-trail-headerblock per S61-precedenten; S67-handoffens
  vid-nästa-hub-beröring-villkor löst. **NÄSTA: end-pass.**
- [x] **END-PASS + STÄNGNING** (2026-07-18, Del 6 + stängningsblocket):
  0 nya lessons (5 kandidater förkastade med motiv) · inga nya trådar
  (allowlist-observationen deferred via BUILD-LOG-NÄSTA) · BUILD-LOG
  S68-post · transcript-ref wc-verifierad · **TASK-15 FÖTT + klassat
  ready-for-agent** (vakt #5:s kontrastbevis, UTF-8-glob-hypotesen) ·
  **plugin-updaten UTFÖRD I SESSIONEN** (1.16.0 @ `6f881d3`,
  L267-verifierad; kvar endast omstarten) · coverage-kvittensen
  "Flippa." (post 3: "Inget mer att säkra") → `lifecycle: closed`.

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid S68-stängningen
> (rad 7 bär alltid senast stängda sessionen).

*Senast uppdaterad: 2026-07-18 (**Session 67 ✅ AVSLUTAD 2026-07-18** (`lifecycle: closed` efter Marcus coverage-kvittens "Flippa."; post 3 utan anmälan) — **QA-VÅGEN → PRD-STÄNGNINGARNA TASK-4/8/9 + TASK-11/12 + PLUGIN 1.15.0 + DEPENDABOT-PASSET: 10 kort Done · inbox 0 · L281–L283.** FÖDELSEN: numrering disk-verifierad (74/L281/f45/T78); plugin vid start 1.14.0 — updaten in i scope på Marcus-order. **TASK-11/12 KONSOLIDERADE** (`bb65b7f`, run 29642391302 grön per jobb): seed-ankaret `TEST_REGISTRATION_RECORD_ID` i `.env.test.example` + Marcus `.env.test` (kvitterad väg), pekande felmeddelanden ×3, nyckeldok i helpers-header + CONTRIBUTING; skipvakts-utökningen 6→7 FÖRKASTAD med motiv (svit-global vakt vs 6-falls-lokal nyckel); bevis RÖD→GRÖN, funktionellt 296/296. **PLUGIN 1.14.0→1.15.0** L267-verifierad (gitCommitSha == hub-HEAD `01eb164`, inte bara versionssträngen); omstarten = sessionsbytet. **QA-VÅGEN (preview-formen 4173 per runbooken; Clear site data = skarpa kallstarter):** TVÅ fynd med hela livscykeln inom vågen — **task-8.6** skeleton-tonen (L269-klassen; WCAG 1.4.11-feltillämpningen på dekorativa block FALSIFIERAD mot W3C Understanding + branschbandet MUI ≈1,3:1 · Carbon ≈1,25–2:1 · shadcn ≈1,1:1 → neutral-200 via NY semantisk roll-token `--mm-bg-placeholder` [inget semantik-lån], shimmer 45→75 %, dubbelriktat test-kontrakt 1,15–2:1 + contrast-more ≥4,5:1; `49fbb76` run 29651370680; "Det blev bättre. Det är OK tillsvidare.") + **task-4.7** fokusring-klippet i anmälningslistans rullningsyta (utanpåliggande ring 4 px utanför boxen klipps av overflow → INSET-formen per React Aria/Spectrum-mönstret via `--mm-focus-ring-offset-inset` + `.focus-ring-inset` på scrollcontainern, containerns egen ring bevarad; 3 bevisbilder i `bilagor/s67-fokusring-klipp/`; TCC-Skrivbordsblocket löst via Downloads-vägen; regressionstest asserterar BÅDA offseten, e2e-beviset i CI [5173-portläget]; `01b4031` run 29652045523; "Mycket bra.") · foundation-drift-observationen (§6-trippelringen vs implementerad enkel-outline) öppet noterad UTAN åtgärd (Marcus: "Det är inget fel på färgen") · Marcus helhetskvittens "Nu godkänner jag allt. Jag godkänner alla 3 QA-kort som ligger." → 4.6/8.5/9.4 Done (DoD 6-mätbevisen burna av 8.4:s boundingBox-svit resp. 9.2:s computed-paritet) → **PRD:erna TASK-4/8/9 DONE** (QA-grinden sista beroendet; T69-kedjan levererad hela vägen; TASK-4:s platshållar-revision bokförd). **DEPENDABOT-PASSET (ADR-031 lager 4; Marcus-delegerat "Lös detta branschledarmässigt"):** 6 squash-merges med main-CI grön PER STEG (#56 tanstack → #57 prod ×8 → #44 checkout 7 → #45 cache → #39 react-aria → #53 dev-deps ×11) + **#46 STÄNGD med motiv** (types speglar runtime, inte springer före); felanalyserna friade båda röda från paketfel — #44 = L279-klassen (branch-ålder; rebase räckte) · #53 varv 1 = ERESOLVE-grupperingsluckan (tanstack-/tailwind-dev-paketen separerade från prod-syskonen) · #53 varv 2 = Biome 2.5:s NYA svg-lintning felträffade public/-assets (favicon = browser-chrome; logotypens a11y = img-alt) → smal path-scopad override `4f90678` dubbelverifierad 2.4+2.5; config-härdningen `fa03742` (dev-gruppen speglar HELA stack-exkluderingslistan — invarianten: stack-grupper äger sina paket oavsett dependency-type); markdownlint-bumpens MD036-felträff på orörd ADR-rad → inline-disable; L275-steget fullbordat ×2 + `npx playwright install` (binär-sidoeffekten fällde a11y 31/31 på millisekunder → grön efter) + Marcus dev-server 5173 & preview 4173 omstartade på nya versionerna (båda 200); verifiering: yamllint ✓ Biome 2.5.3 0 fel ✓ typecheck ✓ a11y 31/31 ✓ build+bundelgrind ✓ test:api 294/296 där väg D-paret = **TASK-14-FYNDET** (eventId-filtrerade EF-vägen STABILT ~30 s ×3 curl-mätningar vs 1,7 s ofiltrerad — EJ deps-regression [request-context-transport; EF:er ej omdeployade; CI grön på samma fall minuter tidigare]; mätserie + diagnostik-recept + hypotesrymd på kortet). **TASK-13 FÖDD** (CI kör EOL-Node: .nvmrc=20, EOL 2026-04-30 → runtime-lyftet 24 LTS som EN medveten ändring). SKÖRD: **L281–L283** [UNIVERSAL] (verktygsbump ändrar grind-utfall på ORÖRD kod — semantisk klassning mot kravets källtext, smalaste undantag, aldrig kosmetisk lydnad [dubbelinstansen; granne L279] · binär-bärande bumpar kräver verktygets EGET install-steg per arbetsyta [kompletterar L275] · dependabot-gruppinvarianten [ERESOLVE-tvärpekar-signaturen]) + 5 kandidater explicit förkastade med motiv; hub-lyft L267–L283 buntas till nästa hub-sync; L280-återfall ×1 i end-passet (semikolon-bruten kedja → tyst utebliven commit) fångat på HEAD-kollen + rättat, öppet bokfört. BUILD-LOG S67-post (10 kort Done + 2 födda + PR #46; sifferkorrigeringen mot chatt-rapportens "12" öppet bokförd) + transcript-ref (Code-JSONL 3 291 347 byte/1 057 rader, wc-verifierad vid Del 5). Numrering vid stängning: nästa ADR **074** (73==73) · lesson **L284** · fälla **45** · tråd **T78**. **NÄSTA (NY session — HANDOFF): nästa PRD/batch med PARALLELL FORM SOM DEFAULT på 1.15.0-registryn (aktiveras av omstarten) · TASK-13 Node-lyftet · TASK-14-mätningen kall morgon · hub-syncen L267–L283 vid nästa hub-beröring; Marcus-moment: Update-klicket + omstarten.** Full narrativ: sessionsdok Del 1–5. S66 ✅ i egen sektion nedan.)*

### Session 67 ✅ AVSLUTAD (2026-07-18) — QA-vågen → PRD-stängningarna + TASK-11/12 + plugin 1.15.0 + dependabot-passet (10 kort Done · inbox 0 · L281–L283)

> Scope: sessionsdok `2026-07-18-session-67.md` Del 1 (kanonisk plats):
> QA-vågen 4.6 → 8.5 → 9.4 → PRD-stängningarna TASK-4/8/9 ·
> TASK-11/12-miljöfixen · dependabot-passet (7 PR:er, ADR-031 lager 4) ·
> plugin-updaten 1.15.0 (omstarten = sessionsbytet). Kadensrad per L67 —
> uppdateras vid varje landning.

- [x] **Dok-födelse** (2026-07-18): sessionsdok fött (`22f44d0`, run
  29642073834 grön per jobb: Lint+Audit+TypeCheck ✓, Docs link check
  körd+grön, Test+Build docs-only-skippad by design); numrering
  disk-verifierad (nästa ADR 074 via check-adr-count 73==73, lesson
  L281, fälla 45, tråd T78); audit-ci PASSED; plugin vid start 1.14.0
  @ `38821c6` (1.15.0-updaten ogjord — in i scope på Marcus-order);
  scope Marcus-kvitterat ("Vi kör på din rekommendation, alla 5
  punkter, inklusive dependabot" + plugin-updaten i sessionen).
  **NÄSTA: TASK-11/12-miljöfixen.**
- [x] **TASK-11/12 STÄNGDA + plugin-updaten 1.15.0 UTFÖRD**
  (2026-07-18, Del 2 kanonisk plats): konsoliderad miljöfix
  (`bb65b7f`, run 29642391302 grön per jobb inkl. Test+Build) —
  seed-ankaret i `.env.test.example` + Marcus `.env.test`
  (kvitterad väg), pekande felmeddelanden ×3, nyckeldok i
  helpers-header + CONTRIBUTING; skipvakts-utökningen 6→7 förkastad
  med motiv; bevis RÖD→GRÖN (funktionellt 296/296; väg D-latens
  riktad-omkörd grön per kortets diagnostik-nyans). Plugin
  1.14.0→**1.15.0** (gitCommitSha == hub-HEAD `01eb164` per
  L267-formen; omstarten = sessionsbytet). QA-förberedelsen:
  staging-bygge + bundelgrind gröna (preview 4173 redo),
  aktualitets-koll 4.6 klar (platshållar-avvikelsen by design ·
  tabbaren oförändrad sedan S52 · punkt 8 testbar via 8.4);
  dependabot-grundtabell 7 PR:er (#53/#44 CI-röda → felanalys i
  passet; lager 4 = Marcus manuell review). **NÄSTA:
  browser-QA-vågen 4.6 → 8.5 → 9.4 (preview 4173, Marcus-takt).**
- [x] **QA-VÅGEN KOMPLETT: 7 kort Done — To Do-kolumnen TOM**
  (2026-07-18, Del 3 kanonisk plats): vågen i preview-formen (4173,
  runbooken; Clear site data = skarpa kallstarter); två fynd med hela
  livscykeln inom vågen — **task-8.6** skeleton-tonen
  (1.4.11-feltillämpningen → branschbandet via ny semantisk roll-token
  `--mm-bg-placeholder`; dubbelriktat test-kontrakt; `49fbb76`, run
  29651370680 grön per jobb; "OK tillsvidare") + **task-4.7**
  fokusring-klippet i anmälningslistans rullningsyta (inset-ring,
  React Aria/Spectrum-mönstret; 3 bevisbilder i
  `bilagor/s67-fokusring-klipp/`; `01b4031`, run 29652045523 grön per
  jobb inkl. e2e-beviset i CI [5173-portläget, 8.4-prejudikatet];
  "Mycket bra."); foundation-drift-observationen (fokusringens §6-form)
  öppet noterad UTAN åtgärd (Marcus: färgen ej problemet); Marcus
  helhetskvittens "Nu godkänner jag allt. Jag godkänner alla 3
  QA-kort som ligger." → 4.6/8.5/9.4 Done med final-summary →
  **PRD-STÄNGNINGARNA TASK-4/8/9 Done** (QA-grinden sista beroendet;
  T69-kedjan levererad hela vägen; TASK-4:s platshållar-revision
  bokförd). Sessionens skörd hittills: 9 kort Done (TASK-11/12 + 7 i
  vågen). **NÄSTA: dependabot-passet (7 PR:er; #53/#44-felanalysen
  först, sedan Marcus-review per ADR-031 lager 4).**
- [x] **DEPENDABOT-PASSET KOMPLETT: 6 merges + #46 motiverat stängd —
  inbox 0** (2026-07-18, Del 4 kanonisk plats; Marcus-delegerat "Lös
  detta branschledarmässigt"): sekvensen #56→#57→#44→#45→#39→#53
  squash-mergad med main-CI grön PER STEG; felanalyserna friade båda
  röda från paketfel — #44 = L279-klassen (rebase räckte) · #53 =
  ERESOLVE-korsberoendet (grupperings-luckan) + Biome 2.5:s nya
  svg-lintning (semantisk felträff → smal override `4f90678`,
  dubbelverifierad 2.4+2.5). Config-härdningen `fa03742`
  (dev-gruppen speglar stack-exkluderingarna). L275-steget fullbordat
  (install ×2 + playwright install [bump-sidoeffekten fällde a11y
  brett innan — lesson-kandidat] + Marcus dev-server 5173 & preview
  4173 omstartade, båda 200). Verifiering på nya versionerna:
  yamllint ✓ · Biome 2.5.3 0 fel ✓ · typecheck ✓ · a11y 31/31 ✓ ·
  build+bundelgrind ✓ · test:api 294/296 → NYTT STABILT FYND
  **TASK-14** (väg D-filtrerade vägen ~30 s ×3 vs 1,7 s ofiltrerad;
  ej deps-regression — CI grön på samma fall; mätserie + recept på
  kortet). **TASK-13** född (CI kör EOL-Node 20 → runtime-lyftet till
  24 LTS; #46 stängd som fel riktning). **NÄSTA: end-pass på
  Marcus-signal (skörd: lessons-kandidaterna Playwright-binärsteget ·
  grupperings-invarianten · ny-filklass-lintning · L269-fynden 8.6/
  4.7 · foundation-drift-observationen).**
- [x] **END-PASSET KÖRT — coverage i STOPPA** (2026-07-18, Del 5
  kanonisk plats): skörd **L281–L283** [UNIVERSAL] (verktygsbump
  ändrar grind-utfall på orörd kod [Biome-svg + markdownlint-MD036,
  granne L279] · binär-bärande bumpar kräver eget install-steg
  [Playwright-signaturen; kompletterar L275] · dependabot-
  gruppinvarianten [stack-grupper äger sina paket oavsett
  dependency-type]) + 5 kandidater explicit förkastade med motiv
  (4.7-inset kodifierad · 8.6-scope bärs av L269+spec ·
  TCC-maskeringen känd klass · foundation-driften observation ·
  väg D-latensen → TASK-14); hub-lyft L267–L283 buntas till nästa
  hub-sync. **BUILD-LOG S67-post** (10 kort Done + 2 födda;
  sifferkorrigeringen mot chatt-rapportens "12" öppet bokförd) +
  transcript-ref (Code-JSONL 3 291 347 byte / 1 057 rader,
  wc-verifierad). Numrering: nästa ADR 074 (73==73) · L284 · fälla
  45 · T78; inga trådar rörda. Intentions-grind PASSERAD (nästa = NY
  session). Coverage-rapporten i STOPPA; lifecycle-flip +
  rad 7-slutsummeringen väntar Marcus-kvittens. Kvar efter stängning:
  Update-klicket + omstarten (aktiverar 1.15.0).
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-18): coverage-rapporten
  kvitterad ("Flippa."); post 3 (osäkrat annan yta) utan anmälan.
  `lifecycle: closed` + rad 7-slutsummeringen + S66-text-flytten
  verbatim i denna stängnings-commit; L280-återfallet ×1 i end-passet
  (semikolon-bruten kedja → tyst utebliven commit, fångad på
  HEAD-kollen) rättat i stunden och öppet bokfört. Kvar
  Marcus-moment: Update-klicket i claude.ai + omstarten (aktiverar
  1.15.0-registryn). **NÄSTA: NY session (fräsch chatt) — nästa
  PRD/batch med parallell form som default (1.15.0) · TASK-13
  Node-lyftet · TASK-14-mätningen kall morgon · hub-syncen
  L267–L283 vid nästa hub-beröring.**

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid S67-stängningen
> (rad 7 bär alltid senast stängda sessionen).

*Senast uppdaterad: 2026-07-12 (**Session 66 ✅ AVSLUTAD 2026-07-12** (`lifecycle: closed` efter Marcus coverage-kvittens "Flippa"; post 3 utan anmälan) — **FÖRBÄTTRINGSPASSET PARALLELL-FORMEN: research → skyddsräcken → batch 4 (3/3) → parallell-batch 2 (2/2, första skarpa 1.14.0-bruket) → ADR-073-amendering + /work-batch 1.15.0 + T76 STÄNGD.** FÖDELSEN: numrering disk-verifierad (73==73, L277, fälla 45, T78); plugin 1.14.0 AKTIV verifierad (install-record + session-registry @ 38821c6); S56-paused-fyndet öppet korrigerat (head-trunkerad grep i RAPPORTERA). **RESEARCH-PASSET (Del 2, 3 web-agenter med citat-krav; kvittens A/A/A/A i delegerad senior-form):** merge queue-klassen löser LOGISK integritet, inte resurs-mutex (pipelines kör parallellt i köerna; GitHub MQ dessutom otillgänglig — User-ägt repo) → orkestrator-serialiseringen BEKRÄFTAD · manuell partitionering + worktree-isolering = state of practice hos alla fyra agent-plattformarna; de mekaniska stegen = claims-check + git merge-tree · SW-spec-fyndet: INTE ENS 404 avregistrerar en aktiv SW (W3C #204 wontfix) → L276-korrigeringen + ADR-073:s B-recept falsifierat. **RÄCKENA:** Test+Build-concurrency `staging-tests` + `queue: max` (`b29168f` runtime-bevis run 29200533939; actionlint-schemasläpet → smal ignore med lift-villkor `a44321d` → run 29200767918 GRÖN per jobb) · CORS-allowlisten +4173 (digest-verifierad superset mot STAGING-refen explicit [CLI-länken är prod — fällan undviken]; trippel preflight-bevis 403→200 · 200 · 403; prod orörd) · TASK-10 AC 1–4 + ready-for-agent. **BATCH 4 (Del 3, sekventiell): 3/3 Done first-pass 6/6 runs** — TASK-5 webServer alltid-färsk på portlåst 5173 + serverfria test:api (följddefekt fångad+fixad i leveransen) · TASK-6 vägval (b) plain-formen icke-stödd EFTER empiriskt RÖD-bevisad (a) (148→259-transitiv-beviset) · TASK-10 fyra staging-scripts + permanent preview-spec + dotenv (source-prefixet PENSIONERAT) + runbooken docs/reference/staging-verifiering-runbook.md (L273-passet fångade äkta bundelgrind-defekt: naken ref-grep vs env-coherence-konstanten). FALSK-RÖD-HALTEN öppet bokförd (grinden mätte portens tomhet, inte agentens egna processer — Marcus levande dev-server fällde batchen trots korrekt agent-beteende) → grind omskriven + cache-resume → **L277**; fynden TASK-11∥12 syskonnoterade (samma rotorsak: 7:e env-nyckeln). **PARALLELL-BATCH 2 (Del 4): 8.4 ∥ 9.2 first-pass 4/4 CI-runs, 0 konflikter** — semaforen formaliserad som repo-artefakt `scripts/staging-semaphore.sh` (shellcheck-STRICT-läxan: lokal blank form var fel grind → **L279**) + central utpekning före spawn; 8.4 DashboardCard/pendingBody-anatomin → layout-skift ≈ 0 by construction (7 e2e-tester delta-verifierade i PR-CI-jobbloggen; `9ffdd5dc` → PR #55 → `2946b29c`) ∥ 9.2 /mer NYSKRIVEN på NavCard mot M6-facitet, computed-mått-assertioner, befintlig hideShellHeader-mekanik återanvänd (`c447fd2` → PR #54 → `f4a0288`). S66-grindarna SKARPBEVISADE: merge-tree 2/2 · claims-kvitton 2/2 · pr-ci-bevisformen bar BÅDA korten (5173 upptagen — e2e via PR-CI, jobblogg-verifierad; Marcus dev-server ALDRIG rörd). NYTT MEKANIK-FYND: worktree-familjens delade origin/main-ref flyttas av parallell orkestrator-merge → förgrenings-SHA-regeln → **L278**. **SLUTLANDNINGEN:** ADR-073 AMENDERAD (immutabilitets-formen: B-receptet → egen preview-port · F1-komplementet [ersättnings-förkastandet står] · beslut 2-skärpningen; 73==73) · hub `01eb164`: **/work-batch 1.15.0** (claims-check · förgrenings-SHA-regeln · semafor-artefakten · merge-tree-grinden · claims-kvittot · pr-ci-bevisformen · post-CI-bockar · reviderat B-recept · NYTT delta 7 post-batch-miljösteget; läs-tillbaka-verifierad). **GRANSKNINGSVÅGEN** Marcus-kvitterad ("allt ser bra ut" — endast siduppdatering krävdes, konsistent med claims-förbudet mot klient-deps) → 8.4 + 9.2 Done med final-summary (`ac4ef57`) → **8.5 + 9.4 OBLOCKADE**. SKÖRD: **L277–L280** [UNIVERSAL] (grind-invarianten · förgrenings-SHA-regeln · CI:ns exakta grind-form · exit-koden BINDER kedjan [skärper L270; ×4-frekvensen öppet bokförd]) + **L276-korrigeringen** (spec-verifierad; runbooken bär korrekt semantik) + 2 kandidater explicit förkastade med motiv (pr-ci-formen kodifierad i skill/ADR; dubblettfyndet under baren); hub-lyft L267–L280 buntas till nästa hub-sync + BUILD-LOG S66-post + **T76 STÄNGD** (kumulativ parallell-empiri 7 kort/2 batchar first-pass 100 %, 0 konflikter, 0 ingripanden; öppna gränser [drain aldrig triggad · B-formen ej i drift · >2 pipelines] ärvs av ADR-073, inte av tråden) + transcript-ref (Code-JSONL 2 258 589 byte/784 rader vid Del 5, wc-verifierad). Numrering vid stängning: nästa ADR **074** · lesson **L281** · fälla **45** · tråd **T78**. **NÄSTA (NY session S67 — HANDOFF): Marcus-takt-korten QA 4.6 · 8.5 · 9.4 (`ready-for-human`) + TASK-11/12-konsolideringen (miljöfixen, en åtgärd stänger båda) + nästa PRD/batch med PARALLELL FORM SOM DEFAULT för disjunkta kort (1.15.0 aktiveras av Update-klicket + plugin-update + omstart, L267-kedjan); hub-sync-momentet (L267–L280) vid nästa hub-beröring.** Full narrativ: sessionsdok Del 1–5. S65 ✅ i egen sektion nedan.)*

### Session 66 ✅ AVSLUTAD (2026-07-12) — Förbättringspasset parallell-formen → batch 4 (3/3) → parallell-batch 2 (2/2) → 1.15.0 + T76 stängd

> Scope: sessionsdok `2026-07-12-session-66.md` Del 1 (kanonisk plats):
> research-pass (merge queue · partitionering · SW-/miljöhygien) →
> skyddsräcken ur TASK-10 → batch 4 (5→6→10 sekventiellt) →
> parallell-batch 2 (8.4 ∥ 9.2, första skarpa 1.14.0-bruket);
> i Marcus-takt QA 4.6 · 8.5 · 9.4. Kadensrad per L67 — uppdateras
> vid varje landning.

- [x] **Dok-födelse** (2026-07-12): sessionsdok fött (`208b2f7`, run
  29199536253 grön per jobb: Lint+Audit+TypeCheck ✓, Docs link check
  körd+grön, Test+Build docs-only-skippad by design); numrering
  disk-verifierad (nästa ADR 074 via check-adr-count 73==73, lesson
  L277, fälla 45, tråd T78); audit-ci PASSED; plugin **1.14.0 AKTIV**
  verifierad (install-record + session-registry @ `38821c6` —
  L267-omstarten = sessionsbytet); scope Marcus-kvitterat ("Låter
  toppen! Kvitterar."). S56-paused-fyndet öppet korrigerat
  (head-trunkerad grep i RAPPORTERA gav fel "inga pausade"-rad; S56
  känd paused, KVAR övertogs av S61). **NÄSTA: research-passet.**
- [x] **Research-syntesen kvitterad A/A/A/A + F1/F2-räckena LANDADE**
  (2026-07-12, Del 2 kanonisk plats; Marcus delegerad senior-form
  "Kör!" = batch-ordern): tre web-agenter med citat-krav →
  orkestrator-serialiseringen + fasat schema BEKRÄFTADE som state of
  practice (alla fyra agent-plattformarna); GitHub MQ otillgänglig
  (User-ägt repo) + löser fel problem (pipelines kör parallellt i
  köerna). **F1 UTFÖRD:** Test+Build-concurrency `staging-tests` +
  `queue: max` (`b29168f` runtime-bevis run 29200533939 →
  actionlint-schemat släpar efter plattformsfeaturen 2026-05-07 →
  `a44321d` smal -ignore med lift-villkor, RÖD→GRÖN lokalt med CI:ns
  binär → run **29200767918 GRÖN per jobb**). **F2 UTFÖRD:** TASK-10
  AC 1–4 + `ready-for-agent` (CLI-läs-tillbaka ✓) +
  CORS-enabling-steget av orkestratorn (digest-verifierad
  superset-skrivning mot STAGING-ref:en explicit [CLI-länken är
  prod — fällan undviken]; trippel preflight-bevis: 4173 **403→200**
  m. origin-echo · 5173 200 · 9999 403; prod orörd). F3: batch
  4-partitionen 5→6→10 sekventiellt max-kort 3. F4: förkastanden
  bokförda (MQ · branch protection [bryter trunk-push; → T46/B-läge]
  · ML-prediktion · beroendegraf · selfDestroying-default ·
  staging-eliminering [tröskel ej nådd; framtida form = preview
  branches]). Öppna revideringar till slutlandningen: ADR-073 b7
  B-receptet (preview på EGEN port — falsifierat av fälla 5) +
  L276-nyansen (404 avregistrerar EJ per spec/web.dev). Batch 2 kör
  med skript-nivå-grindarna claims-check + merge-tree +
  post-batch-install (pilot-före-skill). **NÄSTA: batch
  4-avfyrningen (TASK-5 → TASK-6 → TASK-10).**
- [x] **BATCH 4 KOMPLETT: 3/3 Done first-pass** (2026-07-12, Del 3
  kanonisk plats; run `wf_f6e2f463-866`, 6 agenter): **TASK-5**
  webServer alltid-färsk på portlåst 5173 + test:api* serverfria
  (`f8f48f7`→`a75af7b`; följddefekt fångad+fixad; RÖD→GRÖN med äkta
  främmande server) · **TASK-6** vägval (b) icke-stödd plain-form
  EFTER (a) RÖD-bevisad på fyra ben (`1f92f0a`→`babda68`;
  148→259-transitiv-beviset; miljö-defekten rotorsakad env ≠
  contention) · **TASK-10** fyra staging-scripts + permanent
  preview-spec + dotenv (source-prefixet pensionerat) + runbooken
  (`649374d`→`7963823`; L273-passet fångade äkta bundelgrind-defekt
  [naken ref-grep vs env-coherence-konstanten]; AC 2 skarpt: login +
  Hem-data på 4173, SW-scope 4173, 0 prod-försök). Facit: first-pass
  6/6 runs · 0 permission-stopp · 0 ingripanden · 2 defekter
  agent-fångade · fynden TASK-11∥TASK-12 syskonnoterade (samma
  rotorsak: 7:e env-nyckeln) · Marcus dev-server ALDRIG rörd ·
  falsk-röd-halten (grind mätte portens tomhet, inte agentens
  processer) öppet bokförd + grind omskriven + cache-resume ·
  L270-återfall ×3 fångade i stunden · post-batch-steget avklarat
  (dotenv i huvud-ytan; ingen server-omstart krävs — utanför
  Vite-grafen). **NÄSTA: parallell-batch 2 (8.4 ∥ 9.2).**
- [x] **PARALLELL-BATCH 2 KOMPLETT: 8.4 ∥ 9.2 GRANSKNINGSFÄRDIGA —
  första skarpa 1.14.0-bruket** (2026-07-12, Del 4 kanonisk plats; run
  `wf_a429e729-0ad`; förberett av semafor-formaliseringen
  `scripts/staging-semaphore.sh` [`9039790` efter
  shellcheck-STRICT-remedieringen, öppet bokförd] + central utpekning
  `c0528d2`): **8.4** DashboardCard/pendingBody-anatomin →
  layout-skift ≈ 0 by construction, 7 nya e2e-tester delta-verifierade
  i PR-CI (`9ffdd5dc` → PR #55 → `2946b29c`) ∥ **9.2** /mer nyskriven
  på NavCard mot M6-facitet, computed-mått-assertioner,
  befintlig hideShellHeader-mekanik återanvänd (`c447fd2` → PR #54 →
  `f4a0288`). Facit: first-pass 4/4 CI-runs · 0 konflikter ·
  0 permission-stopp · 0 ingripanden · semaforen höll · Marcus
  dev-server aldrig rörd · drain fortsatt obeprövad (öppet).
  S66-grindarna SKARPBEVISADE: merge-tree 2/2 · claims-kvitton 2/2 ·
  pr-ci-bevisformen bar båda korten (5173 upptagen — e2e via PR-CI
  med jobblogg-verifiering). NYTT MEKANIK-FYND: worktree-familjens
  delade origin/main-ref flyttas av parallell merge → claims
  verifieras mot FÖRGRENINGS-SHA (hub-delta-input + lesson-kandidat).
  Fynd-triaget orkestrator-registrerat (TASK-11-nyansen +
  TASK-8-instruktionerna; AppShell-synken explicit under kort-baren).
  **DoD 5 ÖPPEN på båda: Done-flipp = Marcus granskningsvåg (Hem-
  laddläget + /mer i browsern). NÄSTA: ADR-073-amenderingen +
  hub-deltat 1.15.0; end-pass på Marcus-signal.**
- [x] **SLUTLANDNINGEN: ADR-073-amenderingen + hub-deltat 1.15.0**
  (2026-07-12): **ADR-073 amenderad** (`e46331b`, run 29208022673
  grön; immutabilitets-formen, 73==73 intakt): beslut 7-receptet
  REVIDERAT till egen preview-port [falsifierat av fälla 5/L276] ·
  beslut 4-komplementet `staging-tests` + `queue: max`
  [ersättnings-förkastandet står] · beslut 2-skärpningen
  förgrenings-SHA-regeln + semaforen som repo-artefakt + tre
  skarpbevisade grindar. **Hub `01eb164`: /work-batch 1.15.0**
  (claims-check i delta 1 · förgrenings-SHA-regeln i delta 2 ·
  semaforen som repo-artefakt i delta 3 · merge-tree-grinden +
  claims-kvittot + pr-ci-bevisformen + post-CI-bockar i delta 4 ·
  B-receptet reviderat i delta 6 · NYTT delta 7 post-batch-
  miljösteget; läs-tillbaka-verifierad, markdownlint 0 fel).
  Del 4-runnet 29207984923 grönt. **KVAR (Marcus-moment):
  (a) granskningsvågen 8.4 + 9.2 i browsern → Done-flippar ·
  (b) `claude plugin update` + omstart för 1.15.0 (L267-kedjan) ·
  (c) end-pass på signal — skörden L277+ (falsk-röd-grinden ·
  förgrenings-SHA-fyndet · L276-nyansen · lint-schema-släpet ·
  L270-frekvensen ×4) + BUILD-LOG + T76-synk + coverage.**
- [x] **GRANSKNINGSVÅGEN KVITTERAD + END-PASSET KÖRT — coverage i
  STOPPA** (2026-07-12, Del 5 kanonisk plats; Marcus "allt ser bra
  ut", endast siduppdatering krävdes): **8.4 + 9.2 → Done** med
  final-summary (`ac4ef57`; tvåstegs-stängningen, DoD 5 godkänd) →
  **8.5 + 9.4 oblockade**. Skörd **L277–L280** [UNIVERSAL]
  (grind-invarianten · förgrenings-SHA-regeln · CI:ns exakta
  grind-form · exit-koden binder kedjan [skärper L270]) +
  **L276-korrigeringen** (spec-verifierad: inte ens 404 avregistrerar;
  W3C #204 wontfix) + 2 kandidater explicit förkastade med motiv;
  hub-lyft L267–L280 buntas till nästa hub-sync. BUILD-LOG S66-post ·
  **T76 STÄNGD** (kumulativ empiri 7 kort/2 batchar first-pass 100 %;
  öppna gränser ärvs av ADR-073) · transcript-ref (2 258 589 byte/784
  rader vid Del 5, wc-verifierade). Numrering: nästa ADR 074 · L281 ·
  fälla 45 · tråd T78. Intentions-grind PASSERAD (nästa = NY session
  S67). Coverage-rapporten i STOPPA; lifecycle-flip +
  rad 7-slutsummeringen väntar Marcus-kvittens. Kvar efter stängning:
  Update-klicket + plugin-updaten 1.15.0.
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-12): coverage-rapporten
  kvitterad ("Flippa"); post 3 (osäkrat annan yta) utan anmälan.
  `lifecycle: closed` + rad 7-slutsummeringen + S65-text-flytten
  verbatim i denna stängnings-commit. Kvar Marcus-moment:
  Update-klicket i claude.ai + `claude plugin update` + omstart
  (aktiverar 1.15.0). **NÄSTA: S67 (fräsch chatt) — QA-korten i
  Marcus-takt · TASK-11/12-miljöfixen · nästa PRD/batch med parallell
  form som default.**

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid S66-stängningen
> (rad 7 bär alltid senast stängda sessionen).

*Senast uppdaterad: 2026-07-12 (**Session 65 ✅ AVSLUTAD 2026-07-12** (`lifecycle: closed` efter Marcus coverage-kvittens "Flippa"; post 3 utan anmälan) — **T76-PILOTEN BEVISAD: parallella batch-pipelines från design till Done — 5/5 kort first-pass + ADR-073 + /work-batch 1.14.0 + granskningsvåg.** FÖDELSEN: numrering disk-verifierad (nästa ADR 073 via check-adr-count 72==72, lesson L273, fälla 45, tråd T78). **PILOT-DESIGNEN (Del 2, kvitterad A/A max-kort 5 i delegerad senior-form):** empiri FÖRE design (worktree-minimal-test 2 agenter [npm ci + .env-kopiering per worktree] · CI-concurrency per PR · Test+Build kör staging-stegen → CI-staging-serialiseringen: hela PR→CI→merge-kedjan EN orkestrator-ägd kritisk sektion per kort) · fasat schema 8.1-EXKLUSIV → 8.3∥9.1 → 8.2∥9.3 · mkdir-semafor + port-pre-flight · drain-halt · allowlist-diff. **BATCHEN (Del 3–5): 5/5 FIRST-PASS** — 0 aborts · 0 ingripanden · 0 permission-stopp · 0 merge-konflikter · 7 defekter agent-fångade (0 till main) · parallell-vinst ≈35 % väggklocka · semafor 220 s totalt · varje PR-run OCH main-run grön per jobb första försöket. Leveranser: 8.1 mätprotokollet → skeleton-från-första-bildrutan låst (varm EF 1311–1696 ms, kall dataväg 7,6–7,9 s) · 8.3 persist ADR-072 (falsifikations-pass: varje räcke RÖD-bevisat 2 vägar, fann äkta test-svaghet) · 9.1 NavCard (M6-facitet, TS2322-typbevis) · 8.2 Skeleton (spec-§15-kollisionen DESIGNAD BORT — fungerade exakt) · 9.3 Hem-platshållaren riven (måttidentiskt kort). Mekanik-fynd: draft vestigial i orkestrator-flödet · worktree-remove före branch-delete · webServer GLOBAL. Drain ALDRIG triggad (öppen gräns står). **BEVIS-LANDNINGEN (Del 6):** ADR-073 mintad (7 beslut inkl. B-switch färdigspecad; amenderar ADR-071; 73==73) · T71-raden ÖPPET reviderad (premisserna rivna ben för ben) · T46-switch-posten · hub `38821c6`: /work-batch 1.14.0 + SYSTEMET.md §0-termerna. **GRANSKNINGSVÅGEN + POST-BATCH-FÄLLORNA (Del 7):** två fällor i människans verifieringsmiljö (TASK-10 fälla 4: stale node_modules på main efter manifest-merge + Vite-omstartskravet [`d0b17de`] · fälla 5: byggd SW på dev-originet 5173 servar gammal bundle cache-first, /sw.js-HTML-200 blockerar avregistrering, verifierad kedja disk→transform→färsk kontext [`07b17e8`]) → reparerad miljö → Marcus-kvittens ALLA 4 kort → Done med final-summary (tvåstegs-stängningen; 8.3:s DoD 6 öppen tolkning: e2e-beviset) → **8.4 + 9.2 OBLOCKADE**. Plugin 1.13.0→1.14.0 UTFÖRD (SHA 38821c6; omstart = sessionsbytet). SKÖRD: **L273–L276** [UNIVERSAL] (falsifikations-passet · clock.fastForward-kedjor · manifest-merge/stale arbetsytor · byggd SW på dev-origin; webServer-global + CI-serialiseringen explicit förkastade — ADR-073-kodifierade; hub-lyft L267–L276 buntas till nästa hub-sync) + BUILD-LOG S65-post + T76-synk (PILOT BEVISAD; kvar: första skarpa parallell-bruket + förbättringspasset) + transcript-ref (TVÅ Code-JSONL:er pga VS Code-omstart mitt i — kontinuiteten bars av filartefakterna: 2 215 858 byte/991 rader + 742 491 byte/308 rader, wc-verifierade); L270-återfall öppet bokfört (`fb4fc89`/`4ffd89c` RÖDA på MD004-radbrytning → `50691bc` GRÖN per jobb, run 29198910082). Numrering vid stängning: nästa ADR **074** · lesson **L277** · fälla **45** · tråd **T78**. **NÄSTA (NY session S66 — HANDOFF): förbättringspasset parallell-formen (research-pass mot branschledande precedent [merge queue, affected-graph-partitionering, SW-/dev-origin-hygien] + skyddsräckes-skivor ur TASK-10-klassningen [5 fällor som underlag] + TASK-5/6 batch 4 sekventiellt) → parallell-batch 2 (8.4 ∥ 9.2, första skarpa 1.14.0-bruket); i Marcus-takt QA 4.6 · 8.5 · 9.4.** Full narrativ: sessionsdok Del 1–8. S64 ✅ i egen sektion nedan.)*

### Session 65 ✅ AVSLUTAD (2026-07-12) — T76-piloten bevisad: parallella batch-pipelines (design → 5/5 first-pass → ADR-073 → granskningsvåg)

> Scope: sessionsdok `2026-07-12-session-65.md` Del 1 (kanonisk plats):
> T76-pilot-bygget + piloten på partitionen pipeline A = 8.1–8.3 ∥
> pipeline B = 9.1/9.3; vid bevisad pilot EN bevis-landning (pilot-ADR +
> /work-batch 1.14.0 + T71-revidering + T46-switch-post + termer).
> Kadensrad per L67 — uppdateras vid varje landning.

- [x] **Dok-födelse** (2026-07-12): sessionsdok fött (`5513c3d`, run
  29189698288 grön per jobb: Lint+Audit+TypeCheck ✓, Docs link check
  körd+grön, Test+Build docs-only-skippad by design); numrering
  disk-verifierad (nästa ADR 073 via check-adr-count 72==72, lesson
  L273, fälla 45, tråd T78); audit-ci PASSED; scope Marcus-kvitterat i
  delegerad senior-form. **NÄSTA: förberedelse-läsning + pilot-design.**
- [x] **Pilot-designen KVITTERAD (A/A, max-kort 5)** (2026-07-12, Del 2
  kanonisk plats): förberedelse-läsningen komplett (ADR-071 +
  /work-batch + /do-work + 5 skivkort i helhet) · worktree-mekaniken
  EMPIRISKT verifierad (minimal-test 2 parallella agenter: distinkta
  worktrees, egen branch, main-HEAD, backlog-CLI OK; npm ci +
  .env-kopiering krävs per worktree) · CI-concurrency per PR verifierad
  · Test+Build kör staging-stegen → **CI-staging-serialiseringen**
  (PR→CI→merge-kedjan orkestrator-ägd, seriell per kort) · fasat schema
  8.1-EXKLUSIV (mätvaliditet) → 8.3∥9.1 → 8.2∥9.3 (kollisionsytor
  spec/demo hanteras av faserna; ordinal-avvikelsen 8.3 före 8.2 öppet
  bokförd) · allowlist-diffen landad (16 poster, smala prefix) · T76
  `paused → active` + index-synk. **NÄSTA: semafor-wrapper + fas 1
  (8.1 exklusiv).**
- [x] **FAS 1 LEVERERAD: task-8.1 → Done** (2026-07-12, Del 3 kanonisk
  plats): A1 first-pass (`8f4b7b1`, diff = exakt 2 kortfiler,
  oberoende verifierad) — mätutfall varm EF 1311–1696 ms / kall
  dataväg 7,6–7,9 s → **skeleton från första bildrutan** (kommentar på
  8.4 + metod/råvärden i 8.1-notes); 2 ogiltiga serier kasserade av
  agent-forensik (prod-mode-bygget + CORS-4173). Orkestrator-kedjan:
  PR #48 → CI grön per jobb (29191268155) → merge `a50cce7`
  (draft-ready-mekaniken: lokal no-ff-merge inom allowlisten, öppet
  bokförd; draft skippas fas 2/3) → main-CI grön (29191469255) →
  Done + final-summary. **TASK-10** fynd-kort registrerat
  (orkestrator-serialiserat). **NÄSTA: fas 2 — 8.3 ∥ 9.1.**
- [x] **FAS 2 LEVERERAD: 8.3 ∥ 9.1 PARALLELLT, båda first-pass →
  GRANSKNINGSFÄRDIGA** (2026-07-12, Del 4 kanonisk plats):
  parallell-beviset levererat — A2 ~49 min ∥ B1 ~30 min (väggklocka =
  längsta kortet), semafor höll (220 s total väntan, 0 kollisioner,
  0 kvarlämnade servrar), diff-scope 0 överlapp. **8.3 persist**
  (`3827d2f` → PR #50 → `246bd8c`; ADR-072 komplett; TDD med
  falsifikations-pass — varje räcke RÖD-bevisat 2 vägar; 5 defekter
  fångade internt) · **9.1 NavCard** (`698fb90` → PR #49 → `38ab3aa`;
  10 RÖD → 23/23 GRÖN + TS2322-typbeviset; 0 defekter; spec-§14).
  Mekanik-fynd: webServer GLOBAL (allt playwright i låset) ·
  worktree-remove före branch-delete · 8.2 skrivs som spec-§15
  (konflikt designad bort). DoD 3 + granskningsfärdig-kommentar på
  båda (Done-flipp = Marcus). **NÄSTA: fas 3 — 8.2 ∥ 9.3.**
- [x] **FAS 3 LEVERERAD → BATCHEN KOMPLETT: 5/5 first-pass**
  (2026-07-12, Del 5 kanonisk plats): 8.2 Skeleton (`cac0b16` →
  PR #51 → `221e5f9`; spec-§15 exakt efter §14 — konflikt-designen
  fungerade; TDD 8 RÖD → 31/31; 0 defekter) ∥ 9.3 Hem-platshållaren
  (`eddf928` → PR #52 → `e747b85`; diff 3 filer; K10-avvikelsen
  bokförd; 28/28) — fas 3 ~26 min väggklocka, 0 s semafor-väntan.
  **Batch-facit: 0 aborts · 0 ingripanden · 0 permission-stopp ·
  0 merge-konflikter · 7 agent-fångade defekter, 0 till main ·
  parallell-vinst ≈ 35 % · semafor totalt 220 s.** Env-source-fyndet
  → kommentar på TASK-10. Kort-status: 8.1 Done; 8.3/9.1/8.2/9.3
  granskningsfärdiga. Drain-vägen ALDRIG triggad (obeprövad, öppet).
  **NÄSTA: granskningsvågen (Marcus, 4 kort i browsern) →
  bevis-landningen på kvittens.**
- [x] **BEVIS-LANDNINGEN VERKSTÄLLD** (2026-07-12, Del 6 kanonisk
  plats; Marcus "Jag kvitterar. Du kan fortsätta med det som är
  kvar."): **ADR-073 mintad** (73==73 efter räknings-rad-bump; 7
  beslut inkl. B-switchen färdigspecad; ärliga gränser öppet) ·
  T71-raden ÖPPET reviderad (premisserna rivna ben för ben) · T46
  switch-posten inbyggd · T76-sekvensen synkad · **hub `38821c6`:
  /work-batch 1.14.0** (Parallell form-sektionen + §0-termerna
  pipeline/fan-out fan-in/drain; läs-tillbaka per L239).
  Done-flipparna HÅLLS på browser-grinden (L269 — rapport-kvittens ≠
  design-review). **KVAR: (a) Marcus granskningsvåg 4 kort → Done per
  kvittens · (b) Marcus plugin-update + omstart (L267) för 1.14.0 ·
  (c) end-pass med lessons-skörd på Marcus-signal.**
- [x] **GRANSKNINGSVÅGEN KLAR: 4 kort Done** (2026-07-12, Del 7
  kanonisk plats; Marcus-kvittens efter reparerad granskningsmiljö):
  två post-batch-fällor i människans verifieringsmiljö fångade +
  bokförda som TASK-10 fälla 4 (main:s node_modules stale efter
  package.json-diff — npm install + hård Vite-omstart krävdes;
  `d0b17de`) och fälla 5 (byggd SW på dev-originet 5173 servar gammal
  bundle cache-first; /sw.js-HTML-200 blockerar avregistrering;
  verifierad kedja disk→transform→färsk kontext; `07b17e8`) —
  pilot-facitets mätvärden orörda, lärdomen är ett obligatoriskt
  post-batch-steg (klassningsbeslut på TASK-10). Done-flippar med
  final-summary per tvåstegs-stängningen: 8.2, 8.3 (DoD 6 öppen
  tolkning: e2e-beviset, skivan saknar UI-yta), 9.1, 9.3 → **8.4 +
  9.2 oblockade**. Plugin-updaten UTFÖRD (1.13.0→1.14.0, SHA 38821c6
  verifierad) — omstarten = sessionsbytet. **KVAR: end-pass på
  Marcus-signal (lessons L273+ inkl. dagens två kandidater →
  lifecycle-flip) → omstart → S66 (förbättringspasset
  parallell-formen + nästa batch).**
- [x] **END-PASSET KÖRT — coverage i STOPPA** (2026-07-12, Del 8
  kanonisk plats): lessons-skörd **L273–L276** [UNIVERSAL]
  (falsifikations-passet · clock.fastForward-kedjor ·
  manifest-merge/stale arbetsytor · byggd SW på dev-origin;
  webServer-global + CI-staging-serialiseringen explicit förkastade —
  kodifierade i ADR-073/skill 1.14.0; klient-side-nav → exempel i
  L273) + BUILD-LOG S65-post + T76-synk (PILOT BEVISAD +
  granskningsvåg kvitterad; kvar: första skarpa parallell-bruket +
  förbättringspasset) + transcript-ref (TVÅ JSONL:er pga
  VS Code-omstarten: 2 215 858 + 742 491 byte, wc-verifierade).
  Numrering: nästa ADR 074 · L277 · fälla 45 · T78. Intentions-grind
  PASSERAD (nästa = NY session S66). Coverage-rapporten i STOPPA;
  lifecycle-flip + rad 7-slutsummeringen väntar Marcus-kvittens. Kvar
  efter stängning: Update-klicket + omstarten (1.14.0).
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-12): coverage-rapporten
  kvitterad ("Flippa"); post 3 (osäkrat annan yta) utan anmälan.
  `lifecycle: closed` + rad 7-slutsummeringen + S64-text-flytten
  verbatim i denna stängnings-commit; end-passets CI grönt per jobb
  (run 29198910082 på `50691bc`, docs-only-formen; L270-återfallet
  `fb4fc89`/`4ffd89c` öppet bokfört + remedierat). Kvar
  Marcus-moment: Update-klicket i claude.ai + omstarten (aktiverar
  1.14.0). **NÄSTA: förbättringspasset + parallell-batch 2 som S66
  (fräsch chatt).**

### Session 64 ✅ AVSLUTAD (2026-07-12) — T69-kedjan: samsyn → facit M6 → PRD TASK-9 → skivor 9.1–9.4

> Scope: sessionsdok `2026-07-12-session-64.md` Del 1 (kanonisk plats):
> T69-kedjan rubrik-grillningen (öppna frågan F) → konvergens-pass →
> facit låst → /to-prd → /to-issues; i Marcus-takt QA 4.6 + batch 4
> (TASK-5/6) + task-8.1–8.3 plockbara. Kadensrad per L67 — uppdateras
> vid varje landning.

- [x] **Dok-födelse + T69-upptaget** (2026-07-12): sessionsdok fött
  (`b54379d`, run 29185041969 grön per jobb: Lint+Audit+TypeCheck ✓,
  Docs link check körd+grön, Test+Build by-design-skippad); numrering
  disk-verifierad (nästa ADR 073 via check-adr-count 72==72, lesson
  L272, fälla 45, tråd T77); audit-ci PASSED; T69-kortet flippat till
  `lifecycle: active` + index-raden synkad i upptags-landningen.
  **NÄSTA: research-passet för rubrik-grillningen (öppna frågan F).**
- [x] **Rubrik-frågan + Hem-identiteten LANDAD: chat-samsyn 1–5**
  (2026-07-12, Del 2 kanonisk plats): research-passet käll-verifierat
  (5 konvergerande källklasser: FK 8 skärmar + Apple HIG + Material
  3 + GOV.UK-klassen inkl. GOV.UK-appens källkod + WCAG/SPA-konsensus;
  lokal inventering: alla vyer utom Hem bär redan synlig h1) + **FK
  login-flödesserien** committad (5 bilder; `15b9aea` CI RÖD på
  L270-självfall [pipe-maskad Vale-exit, öppet bokfört, ingen ny
  lesson] → `47a9ec0` GRÖN per jobb, run 29186091764) →
  **Marcus-realiseringen "HELA appen ÄR Mina sidor"** → kvitterade
  beslut ("Yes. Kvitterar!"): (1) rubrikpolicy synlig h1 alla vyer
  utom Hem [Hem-K10 orörd, ingen kollision] · (2) T69 B/B2 RIVNA
  [sex rader i två grupper; namn/e-post → T47] · (3) task-4 beslut 4
  RIVET [Hem-platshållaren bort via PRD-skiva; platsen reserverad
  för klockan] · (4) **T77 notis-centret FÖDD** [aldrig död ikon;
  nästa tråd T78] · (5) ORDLISTA "Mina sidor" omskriven obuntat
  (`1a9e929`). Tråd-synk: T69 § Revision S64 + T77-kort + T47-defer +
  index. **NÄSTA: konvergens-passet (G) → facit låst → /to-prd →
  /to-issues.**
- [x] **KONVERGENS-PASSET KLART: M6 LÅST SOM FACIT** (2026-07-12,
  Del 3 kanonisk plats; Marcus-kvittens "Vi kör på detta. Vi låser."):
  T66-formens konvergens på riktiga `/mer` (underform A, M1 = exakt
  kopia) — 5 Marcus-varv M2→M6 (`e8bc088`→`230f322`, varje steg
  [PROTOTYPE]-committat, CI grönt per jobb inkl. Test+Build):
  FK-formen → hover-testet FÖRKASTAT (M3) → chevronen BORT (M4,
  D-revisionen: app-bred "navigationsrader bär inte chevron") →
  tabbar-ikonparitet (M5, research-verifierad färghierarki: M3-listor
  `on-surface-variant` vs label `on-surface`; chrome-state ≠
  content-färg) → detalj-svepet (M6: FK-måtten, DUBBELKANT-fyndet
  16 px, ikon-krocken Users→Filter, fokus-ring verifierad).
  Facit-spec + byggkravslista i Del 3; bilagor
  `bilagor/s64-mer-konvergens/` (9 dumpar); återupplivningsväg
  `230f322`; tsr-split-stale = lesson-kandidat; prototypen raderad
  (klausul iv). **NÄSTA: /to-prd (ETT PRD: struktur + facit) →
  /to-issues.**
- [x] **/to-prd VERKSTÄLLD: TASK-9 publicerad** (2026-07-12, Del 4
  kanonisk plats; L268-fallbacken öppet bokförd — ordern är kvittot):
  skarv-kvittensen Marcus "A" (två befintliga skarvar: primitiv-axe +
  mer-e2e/axe, inga nya) → **TASK-9 "PRD: Mer-vyn till FK-mönstret"**
  (14 UB, 10 implementationsbeslut, FK-avvikelser låsta, M3 bokförd
  förkastad; 2 extra DoD-spec-grindar: design-review mot facitet +
  computed facit-paritet). CLI-läs-tillbaka ✓. Raderings-CI:t grönt
  per jobb (`a0e2536`, Test+Build ✓ — M1-vyn återställd ren).
  **NÄSTA: /to-issues (4 skivor per estimatet).**
- [x] **/to-issues VERKSTÄLLD: task-9.1–9.4 publicerade** (2026-07-12,
  Del 5 kanonisk plats; skiv-godkännandet Marcus "A. Låter bra."):
  9.1 NavCard-primitiven M oblockad · 9.2 Mer-vyn till facitet M ←9.1
  · 9.3 Hem-platshållar-borttagningen S OBEROENDE · 9.4 QA S
  ready-for-human ←alla (9-punkters browser-testplan). DoD-arv 2
  spec-grindar per skiva; täcknings-pass UB 1–14 + beslut 1–10 utan
  föräldralösa; tavlan CLI-läs-tillbaka-verifierad. **9.1 + 9.3
  oblockade = T76-partitionens pipeline B-kandidater.** T69-kedjan
  KOMPLETT genom spec-ledet. **NÄSTA: session-end (skörd L272-kandidat
  tsr-split-stale + BUILD-LOG + tråd-synk + coverage).**
- [x] **End-passet FÖRBERETT** (2026-07-12, Del 6 kanonisk plats):
  skörd **L272** [UNIVERSAL] (tsr-split-stale — transformerad
  dev-modul är egen cache-nyckel; computed-assertioner slår
  pixel-titt; 2 kandidater explicit förkastade med motiv: L270-
  återfallen ×2 [ingen ny klass] + auth-rotationen [Del 3 bär den];
  hub-lyft L267–L272 buntas till nästa hub-sync) + **BUILD-LOG
  S64-post** + tråd-synk (T76-partitionen KONKRET: 9.1+9.3, kollisions-
  noten 9.1↔8.2) + transcript-ref (Code-JSONL 10 399 049 byte, 1 340
  rader vid Del 6). CI-facit: 3bfa699 GRÖN · b9fdbf8 GRÖN · 73ddbdd
  RÖD (remedierad, öppet bokförd). Intentions-grinden PASSERAD (nästa
  = T76-pilot-bygget, NY session S65). Coverage-rapporten i STOPPA;
  lifecycle-flip + rad 7-slutsummeringen väntar Marcus-kvittens. Kvar
  efter stängning: Update-klicket.

- [x] **STÄNGD efter Marcus-kvittens** (2026-07-12): coverage-rapporten
  kvitterad ("Kvitterar. Flippa."); post 3 (osäkrat annan yta) utan
  anmälan. `lifecycle: closed` + rad 7-slutsummeringen +
  S63-text-flytten verbatim i denna stängnings-commit; end-passets CI
  grönt per jobb (run 29189092052, docs-only-formen). Kvar
  Marcus-moment: Update-klicket i claude.ai. **NÄSTA:
  T76-pilot-bygget + piloten som S65 (fräsch chatt).**

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid S65-stängningen
> (rad 7 bär alltid senast stängda sessionen).

*Senast uppdaterad: 2026-07-12 (**Session 64 ✅ AVSLUTAD 2026-07-12** (`lifecycle: closed` efter Marcus coverage-kvittens "Kvitterar. Flippa."; post 3 utan anmälan) — **T69-kedjan KOMPLETT: upptag → rubrik-research → Hem-identiteten → konvergens-facit M6 → PRD TASK-9 → skivorna 9.1–9.4.** FÖDELSEN: numrering disk-verifierad (nästa ADR 073 via check-adr-count 72==72, lesson L272, fälla 45, tråd T77), CI grönt per jobb (run 29185041969). **RUBRIK-RESEARCHEN (Del 2):** fem källklasser käll-verifierade via 3 web-agenter med citat-krav (FK:s 8 skärmar avlästa + Apple HIG + Material 3 + GOV.UK-klassen inkl. GOV.UK-appens källkod + WCAG/SPA [W3C/TPGi/Deque/Vispero/Gatsby-användartestet]) → konvergens: synlig h1 per vy UTOM hemytan (WCAG Level A-kravet = dynamisk document.title, redan uppfyllt via RouteAnnouncer); FK login-flödesserien (5 nya referensbilder — "Hej Marcus!" bor i FK:s login-loading) committad (`15b9aea` RÖD på L270-självfall [pipe-maskad Vale-exit] → `47a9ec0` GRÖN). **HEM-IDENTITETEN:** Marcus-realiseringen "HELA FK-appen ÄR Mina sidor" → chat-samsyn 1–5 ("Yes. Kvitterar!"): (1) rubrikpolicy synlig h1 alla vyer utom Hem [Hem-K10 ORÖRD — FK/Apple/GOV.UK-appen sanktionerar titel-fri hemyta] · (2) T69 B/B2 RIVNA [sex rader i två grupper; namn/e-post-innehållet → T47] · (3) task-4 beslut 4 RIVET [Hem-platshållaren bort via skiva; platsen reserverad för klockan] · (4) **T77 notis-centret FÖDD** [FK-klockan på Hem; hård guard: aldrig död ikon] · (5) ORDLISTA "Mina sidor" omskriven obuntat (`1a9e929` — hela inloggade appen, aldrig en destination). **KONVERGENS-PASSET (Del 3):** T66-formen på riktiga `/mer` (underform A), M1-baslinje → 5 Marcus-varv → **M6 LÅST SOM FACIT** ("Vi kör på detta. Vi låser."): FK-måtten computed-låsta (sidmarginal 16 [DUBBELKANTS-FYNDET: section-p-4 ovanpå skalets px-4], radhöjd 58, kortgap 10, rytm 32, etikett 600) · chevronen BORT (D-revisionen: app-bred regel "navigationsrader bär inte chevron"; Select-pilen annan mönsterklass) · M3:s hover-variant PRÖVAD+FÖRKASTAD · ikon-krocken Bygg segment Users→Filter (Users == Personer-fliken) · tabbar-ikonparitet 20 px/text-secondary (research-belagd: M3-listspecens leading icon on-surface-variant vs label on-surface — chrome-STATE-färg ≠ content-HIERARKI-färg, matchning via delade tokens). Bilagor 9 dumpar i `bilagor/s64-mer-konvergens/`; återupplivningsväg `230f322`; prototypen raderad (`a0e2536`, klausul iv, CI grönt inkl. Test+Build på återställd vy). **SPEC-KEDJAN (Del 4–5):** skarv-kvittens A (primitiv-axe + mer-e2e/axe, INGA nya) → **TASK-9 publicerad** (PRD: Mer-vyn till FK-mönstret — ETT kort bär struktur + facit per H; 14 UB, 10 implementationsbeslut, 2 extra DoD-spec-grindar) → skiv-godkännande "A. Låter bra." → **task-9.1–9.4 publicerade** (9.1 NavCard-primitiven M oblockad · 9.2 Mer-vyn M ←9.1 · 9.3 Hem-platshållar-borttagningen S OBEROENDE · 9.4 QA S ready-for-human, 9-punkters browser-testplan; DoD-arv per skiva; täcknings-pass UB 1–14 + beslut 1–10 utan föräldralösa). **9.1+9.3 OBLOCKADE = T76-PARTITIONEN KONKRET** (pipeline B mot 8.1–8.3; kollisionsnot 9.1↔8.2 [design-system-specen] i T76-kortet). L268-fallbacken ×2 öppet bokförd (ordern är kvittot; skill-filer lästa verbatim ur cachen); L270-återfall ×2 fångade+remedierade (`47a9ec0`/`b9fdbf8`; `73ddbdd` RÖD öppet bokförd). SKÖRD: **L272** [UNIVERSAL] (tsr-split-stale: transformerad dev-modul är EGEN cache-nyckel — computed-assertioner slår pixel-titt; 2 kandidater explicit förkastade med motiv; hub-lyft L267–L272 buntas till nästa hub-sync) + BUILD-LOG S64-post + tråd-synk T69/T76/T77/T47 + transcript-ref (Code-JSONL 10 399 049 byte, 1 340 rader vid Del 6). Numrering vid stängning: nästa ADR **073** · lesson **L273** · fälla **45** · tråd **T78**. **NÄSTA (NY session S65 — HANDOFF): T76-pilot-bygget + piloten på partitionen task-8-skivorna (8.1–8.3) ∥ task-9-skivorna (9.1/9.3) — kollisionsytor + reservväg i T76-kortet; i Marcus-takt: QA 4.6 · batch 4 (TASK-5/6, sekventiellt) · QA 9.4 efter pilot.** Full narrativ: sessionsdok Del 1–6. S63 ✅ i egen sektion nedan.)*

### Session 63 ✅ AVSLUTAD (2026-07-12) — Task-7-kedjan: grillning → ADR-072 → PRD TASK-8 → skivor 8.1–8.5

> Scope: sessionsdok `2026-07-12-session-63.md` Del 1 (kanonisk plats):
> research-pass → grillning till samsyn → /to-prd → /to-issues på task-7;
> i Marcus-takt QA 4.6 + batch 4 (TASK-5/6). Kadensrad per L67 —
> uppdateras vid varje landning.

- [x] **Dok-födelse** (2026-07-12): sessionsdok fött (`c8ad628`, run
  29169824003 grön per jobb: Lint+Audit+TypeCheck ✓, Docs link check
  körd+grön, Test+Build by-design-skippad); numrering disk-verifierad
  (nästa ADR 072 via check-adr-count 71==71, lesson L271, fälla 45,
  tråd **T77** — T76 registrerades post-S62-stängning, disk vann över
  slutsummeringens "nästa T76"); audit-ci PASSED; midnatts-datum-driften
  fångad (fil-datum 2026-07-12 per `date +%F`). **NÄSTA: grillningen.**
- [x] **Grillad samsyn LANDAD: lugnt laddläge-designen** (2026-07-12,
  Del 2 kanonisk plats): 5/5 beslut på Code-rekommendation A —
  (1) app-bred princip + Skeleton-primitiv (11/11/11), Hem första
  implementationsyta · (2) persist-cache med skyddsräcken
  (logout-rensning via queryClient.clear(), gcTime ≥ maxAge-fällan
  hanterad, buster = app-version; hotmodell: Supabase-tokenen ligger
  redan i localStorage) · (3) riktigt chrome + förenklade datablock,
  långsam shimmer V→H, reduced-motion → statisk, 3:1-kontrast,
  Roselli-markup · (4) mät-först: kallstartsfönstret mäts innan formen
  låses (1 s-tröskeln käll-verifierad; kortets "0,5 s" öppet riven +
  CLI-korrigerad) · (5) ADR-bar-prövning: ADR-072 för persist-beslutet
  mintas i PRD-steget, principen under baren → PRD/spec. ORDLISTA-post
  "Lugnt laddläge" landad obuntad vid kristallisering (`e7a70ac`).
  **NÄSTA: /to-prd på samsynen → /to-issues.**
- [x] **/to-prd VERKSTÄLLD + CI-röd-detour remedierad** (2026-07-12,
  Del 3 kanonisk plats; skarv-kvittensen "Kvitterar" — två befintliga
  skarvar: e2e/axe + a11y-primitiv): **ADR-072 mintad** (klient-persist
  med skyddsräcken; 72==72) · **TASK-8 publicerad** (PRD: Lugnt
  laddläge; 16 UB, 11 implementationsbeslut, estimat 5 skivor
  S/M/M/M/S, DoD 4 defaults + design-review- + layout-skift-grind) ·
  **task-7 → Done** (final summary; research→grillning→/to-prd
  fullföljd) · T76-nummer-noten (pilot-ADR:n ≠ 072). DETOUREN: Del 2-
  run 29170540541 RÖD på pill-testet (4.3 AC 1) — datumsträngar i
  runnerns UTC vs browserns Stockholm i 22–24Z-fönstret (L264-klassen
  för datumsträngar, latent utanför fönstret); TZ=UTC-repro RÖD →
  fix per rad-669-förebilden → RÖD→GRÖN båda zonerna → `c4c52b2` →
  CI grönt per jobb I FÖNSTRET (run 29170841109, Test+Build ✓).
  Lesson-kandidat: L264-skärpningen. **NÄSTA: /to-issues på TASK-8.**
- [x] **/to-issues VERKSTÄLLD: task-8.1–8.5 publicerade** (2026-07-12,
  Del 4 kanonisk plats; skiv-godkännandet Marcus-delegerat till
  senior-avgörande, S56-precedenten — täcknings-pass: 16 UB + 11
  implementationsbeslut mappade, inga föräldralösa): 8.1 Mätprotokollet
  (S, oblockad) · 8.2 Skeleton-primitiven + demo + spec (M, oblockad)
  · 8.3 Persist-lagret ADR-072 (M, oblockad, icke-UI → hela vägen
  Done) · 8.4 Hem till Lugnt laddläge (M, ←8.1+8.2, granskningsfärdig-
  läge) · 8.5 QA-planen (S, ←alla, ready-for-human, 8-punkters
  testplan). DoD-arvet (2 spec-grindar) på varje skiva; tavlan
  CLI-läs-tillbaka-verifierad; 8.1/8.2/8.3 klassade `ready-for-agent`
  = plockbara. **NÄSTA: Marcus väljer — batch på 8.1–8.3
  (/work-batch) · QA 4.6 · batch 4 (TASK-5/6); vid avslut: skörd +
  BUILD-LOG.**
- [x] **End-passet FÖRBERETT** (2026-07-12, Del 5 kanonisk plats;
  Marcus-vägval: S64 = T69-upptaget → S65 = T76-piloten på partitionen
  task-8 ∥ T69, bedömningen säkrad i T76-kortet): skörd **L271**
  [UNIVERSAL] (dygnsgräns-fönstret gör runner-zon-buggar latenta —
  skärper L264; 2 kandidater explicit förkastade med motiv; hub-lyft
  L267–L271 buntas till nästa hub-sync) + **BUILD-LOG S63-post** +
  tråd-synk (T69 upptags-not, T76 partitions-bedömning) +
  transcript-ref (Code-JSONL 1 442 151 byte, 615 rader).
  Intentions-grinden PASSERAD (nästa = T69, NY session S64).
  Coverage-rapporten i STOPPA; lifecycle-flip + rad 7-slutsummeringen
  väntar Marcus-kvittens. Kvar efter stängning: Update-klicket.
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-12): coverage-rapporten
  kvitterad ("Flippa"); post 3 (osäkrat annan yta) utan anmälan.
  `lifecycle: closed` + rad 7-slutsummeringen + S62-text-flytten
  verbatim i denna stängnings-commit; end-passets CI grönt per jobb
  (run 29184699715, docs-only-formen). Kvar Marcus-moment:
  Update-klicket i claude.ai. **NÄSTA: T69-upptaget som S64 (fräsch
  chatt).**

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid S64-stängningen
> (rad 7 bär alltid senast stängda sessionen).

*Senast uppdaterad: 2026-07-12 (**Session 63 ✅ AVSLUTAD 2026-07-12** (`lifecycle: closed` efter Marcus coverage-kvittens "Flippa"; post 3 utan anmälan) — **Task-7-kedjan KOMPLETT: grillning → ORDLISTA → ADR-072 → PRD TASK-8 → skivorna 8.1–8.5 + CI-röd-detour remedierad.** FÖDELSEN: midnatts-datum-driften fångad by design (fil-datum 2026-07-12 per `date +%F`); numrering disk-vunnen (T76 fanns redan → nästa T77). **GRILLAD SAMSYN (Del 2, 5/5 på Code-rekommendation A; research käll-verifierad FÖRE rekommendationerna via web-agent + repo-utforskning):** (1) app-bred **Lugnt laddläge**-princip + Skeleton-primitiv (11/11/11), Hem första yta · (2) persist-cache med skyddsräcken (logout-rensning via queryClient.clear()-mönstret, gcTime ≥ maxAge-fällan, buster = app-version; hotmodell: Supabase-tokenen ligger REDAN i localStorage → ingen ny exponeringsklass) · (3) riktigt chrome + förenklade datablock, långsam shimmer V→H (Chung-empirin), reduced-motion → statisk, 3:1-kontrast, Roselli-markup · (4) mät-först (1 s-tröskeln käll-verifierad NN/g+FK; kortets "0,5 s" ÖPPET RIVEN — okänd proveniens) · (5) ADR-bar-prövning: ADR för persist, principen under baren → PRD/spec. ORDLISTA-posten "Lugnt laddläge" obuntad vid kristallisering (`e7a70ac`). **CI-RÖD-DETOUR (Del 3):** pill-testet (4.3 AC 1) föll i run 29170540541 — datumsträngar i runnerns UTC vs browserns Stockholm, latent 22–24Z-fönsterbugg (first-pass-grönt CI = icke-bevis); TZ=UTC-repro RÖD lokalt medan fönstret var öppet → fix per repots Intl-förebild → `c4c52b2` → CI grön per jobb I FÖNSTRET (run 29170841109, Test+Build ✓) → **L271**. **SPEC-KEDJAN (Del 3–4):** **ADR-072 mintad** (klient-persist med skyddsräcken; 72==72) · **PRD TASK-8 publicerad** (16 UB, 11 implementationsbeslut; Marcus-kvitterad skarv: e2e/axe + a11y-primitiv, INGA nya skarvar) · **task-7 → Done** (final summary) · **skivorna task-8.1–8.5 publicerade** (skiv-godkännandet Marcus-delegerat till senior-avgörande per S56-precedenten; täcknings-pass 16 UB + 11 beslut mappade: 8.1 mätprotokollet S · 8.2 Skeleton-primitiven M · 8.3 persist-lagret M [icke-UI → hela vägen Done] · 8.4 Hem M ←8.1+8.2 [granskningsfärdig-läge] · 8.5 QA S ready-for-human; DoD-arv 2 spec-grindar per skiva; **8.1–8.3 plockbara**) · T76-nummer-noten (pilot-ADR:n ≠ 072). **VÄGVALET (Marcus):** S64 = T69-upptaget (Mer-vyn; samsyn A–H finns i tråd-kortet) → S65 = T76-pilot-bygget + piloten på partitionen task-8-skivorna ∥ T69-skivorna (Code-bedömning + TRE kollisionsytor [lockfilen/design-system-specen/routeTree] + reservvägen 8.2 ∥ 8.3 SÄKRADE i T76-kortet; TASK-5/6 hålls utanför piloten). SKÖRD: **L271** [UNIVERSAL] (dygnsgräns-fönstret gör runner-zon-buggar latenta — skärper L264; 2 kandidater explicit förkastade med motiv) + BUILD-LOG S63-post + tråd-synk T69/T76 + transcript-ref (Code-JSONL 1 442 151 byte, 615 rader); hub-lyft L267–L271 buntas till nästa hub-sync-moment. Numrering vid stängning: nästa ADR **073** · lesson **L272** · fälla **45** · tråd **T77**. **NÄSTA (NY session S64 — HANDOFF): T69-upptaget — samsyn A–H ur tråd-kortet → öppna frågor (F preliminär) → /to-prd → /to-issues → skivorna = pipeline B i T76-piloten; i Marcus-takt: QA 4.6 (sista grinden för TASK-4-PRD:n) · batch 4 (TASK-5/6, sekventiellt) · task-8.1–8.3 plockbara för /work-batch.** Full narrativ: sessionsdok Del 1–5. S62 ✅ i egen sektion nedan.)*

### Session 62 ✅ AVSLUTAD (2026-07-11) — Bygget /work-batch + ADR-071 → batch 3 skarpt → granskningsvåg 4.5 + task-7

> Scope: sessionsdok `2026-07-11-session-62.md` Del 1 (kanonisk plats):
> S61:s deferrade bygge som EN hub-landning → batch 3 (4.5) som skillens
> första skarpa bruk → ev. QA 4.6 + TASK-5/6-klassning + webbtavle-kollen.
> Kadensrad per L67 — uppdateras vid varje landning.

- [x] **Dok-födelse** (2026-07-11): sessionsdok fött (`7c23edb`, run
  29162686873 grön per jobb: Lint+Audit+TypeCheck ✓, Docs link check
  körd+grön, Test+Build by-design-skippad); numrering disk-verifierad
  (nästa ADR 071 via check-adr-count 70==70, lesson L267, fälla 45, tråd
  T76); audit-ci PASSED. **NÄSTA: bygget (LÄS-fas hubben → plan →
  Marcus-kvittens).**
- [x] **Bygget LANDAT: /work-batch + ADR-071 + T75 + hub-lyft**
  (2026-07-11, Del 2 kanonisk plats; Marcus-kvittens "Kör! A."):
  hub-commit `3174a1e` (plugin 1.12.0→1.13.0 — ny skill work-batch;
  do-work steg 5 → tvåstegs-stängning [T75]; hub-lyft K61.1–K61.4
  [L263–L266]; SYSTEMET.md §0 orkestrerings-skript + §5 16 skills + §7
  AFK-formen; konstitutionens ISSUE-SUBSTRAT-rad konsekvens-synkad) +
  spoke: ADR-071 mintad + README-rad (71==71) + tråd-synk (T61/T71
  uppdaterade; T75 → closed). Nästa ADR 072. **NÄSTA: omstart
  (plugin-reload, verifiera 1.13.0 + 16 skills) → batch 3 (4.5) på
  Marcus batch-order.**
- [x] **Omstartsverifiering RÖD → remedierad** (2026-07-11): första
  omstarten laddade 1.12.0 — plugin-cachen uppdateras inte av omstart;
  `claude plugin update marcus-system@marcus-hub` → install-record
  1.13.0 @ `3174a1e` (== hub-HEAD); skillen onåbar i pågående session
  (registry låst vid sessionsstart) → lärdom **L267** [UNIVERSAL]
  (nästa L268). **NÄSTA: NY omstart → verifiera 1.13.0 → batch 3 (4.5)
  på Marcus batch-order (villkorad "vid grönt").**
- [x] **Batch 3 KLAR — /work-batch första skarpa bruk** (2026-07-11,
  Del 3 kanonisk plats): omstartsverifiering nr 2 GRÖN → run
  `wf_72a786e1-c30` (maxCards=1, halt-first) → task-4.5
  GRANSKNINGSFÄRDIG (leverans `c1aa713`, CI grön per jobb attempt 1 →
  `cdfd4ee`); 0 defekter/fynd/ingripanden, ~28 min, first-pass JA;
  avfyrningsmekaniken → L268-kandidat. **NÄSTA: granskningsvåg 4.5
  (Marcus design-review).**
- [x] **Granskningsvåg 4.5 STÄNGD + task-7 fött** (2026-07-11, Del 4
  kanonisk plats): osynligheten GODKÄND live (60+ s), kallstartens
  laddläges-design UNDERKÄND (ospecat designutrymme) → väg A: 4.5 Done
  (`e113890`, AFK-proveniens) + design-kort task-7 (skeleton +
  persist-cache; research→grillning→to-prd-väg) → QA 4.6 OBLOCKAD;
  TASK-4 5/5 skivor Done. **NÄSTA: TASK-5/6-klassning +
  webbtavle-kollen → avslut.**
- [x] **Post-batch + avslut** (2026-07-11, Del 5 kanonisk plats):
  TASK-5/6 → ready-for-agent (AC ×3, `b517d79`) = batch 4-kandidater ·
  webbtavle-kollen empiriskt avgjord (display-quirk, EXPLICIT
  förkastad) · skörd L268–L270 [UNIVERSAL] + BUILD-LOG S62-post +
  transcript-ref (`4fab230`) · coverage-kvittens Marcus ("Inget att
  säkra. Kvitterar, flippa.") → `lifecycle: closed`. **HANDOFF S63:
  task-7-grillningen (/grill-me).**

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid S63-stängningen
> (rad 7 bär alltid senast stängda sessionen).

*Senast uppdaterad: 2026-07-11 (**Session 62 ✅ AVSLUTAD 2026-07-11** (`lifecycle: closed` efter Marcus coverage-kvittens "Inget att säkra. Kvitterar, flippa.") — **Bygget /work-batch + ADR-071 → batch 3 skarpt → granskningsvåg 4.5 + design-fyndet task-7.** BYGGET (Del 2, EN hub-landning `3174a1e`, plugin 1.12.0→1.13.0): /work-batch-skill född (kontraktet kodat: batch-order=kvittot · halt-first + hårda gränser · granskningsfärdig-läge · orkestratorns oberoende disk-verifiering · batch-rapport) · do-work steg 5 → tvåstegs-stängningen (**T75 → closed**) · hub-lyft K61.1–K61.4 (L263–L266) · SYSTEMET.md §0 orkestrerings-skript/§5 16 skills/§7 AFK-formen · **ADR-071 mintad** (spoke, 71==71). OMSTARTSKEDJAN: omstart 1 RÖD — plugin-cachen uppdateras INTE av omstart (marketplace stale sedan 07-08) → `claude plugin update` → **L267** [UNIVERSAL] (tre-länkars distributionskedja; skill-registry session-låst) → omstart 2 GRÖN (1.13.0, gitCommitSha==hub-HEAD, 16 cache-skills). **BATCH 3 (Del 3) — /work-batch FÖRSTA SKARPA BRUK** (run `wf_72a786e1-c30`, maxCards=1, halt-first): task-4.5 Osynliga uppdateringen → GRANSKNINGSFÄRDIG — leverans `c1aa713` (produktkods-delta EN rad `placeholderData: keepPreviousData` [ärligt bokförd inert — SWR-defaulten bar redan osynligheten]; bevisen = permanenta e2e per S55 Del 11-mönstret i prod-form: byte-identiska FÖRE==UNDER==EFTER-skärmdumpar med nätverksnivå-bevisad aktiv omhämtning [2 parkerade EF-anrop] · 5 containrar boundingBox-mät-stilla på ändrat-data-vägen · kallstart utan delay-fönster) → CI grön per jobb ATTEMPT 1 inkl. Test+Build (run 29164601255) → `cdfd4ee`; TDD-avvikelse öppet bokförd (bevis-skiva — testerna gröna direkt; röd-kapabilitet via 2 inducerade prober AC1/AC3); 0 defekter · 0 fynd · 0 ingripanden · 0 permission-stopp · ~28 min · first-pass JA; avfyrningsmekaniken (slash-kommandot måste stå FÖRST; disable-model-invocation stänger Skill-verktygsvägen; ordern-är-kvittot + skill-fil från cache = kontraktsenlig fallback) → **L268**. **GRANSKNINGSVÅG 4.5 (Del 4):** Marcus GODKÄNDE osynligheten live (60+ s utan synbar poll; branschledar-frågan besvarad: stale-while-revalidate/TanStack Query = standardmönstret) men UNDERKÄNDE kallstartens laddläges-design (kollapsade kort + "Laddar…"-textrader = layout-skift; ospecat designutrymme — "lugnt laddläge" [UB 16] odefinierat, K10-facit täcker laddat läge; mekaniska grindar blinda för ospecat → **L269**) → väg-beslut A: 4.5 **Done** (`e113890`, final-summary med AFK-proveniens, tvåstegs-stängningens Done-flip på Marcus-kvittens) + **task-7 FÖTT** (Design: kallstartens laddläge — skeleton + persist-cache till branschstandard; web-research NN/g + repo-specarna bär redan skeleton-mönstret; oetiketterat — väg research → grillning → /to-prd → /to-issues) → **QA 4.6 OBLOCKAD** (`ready-for-human`); **TASK-4 = 5/5 skivor Done** — PRD-stängning väntar QA. **POST-BATCH (Del 5):** TASK-5+6 → `ready-for-agent` på Marcus-kvittens (AC ×3 per kort ur FÖRVÄNTAT-styckena, S61-precedenten AC-före-etikett; `b517d79`) = **batch 4-kandidater** · webbtavle-kollen EMPIRISKT AVGJORD (serverstart visar ALLA kort inkl. ocommittade 17/17 · /api/tasks = uppstarts-snapshot [status-flip-test 17 s] · websocket-UI separat väg → S61-observationen "kort försvann under agent-arbete" = display-quirk i backlog.md 1.47.1, INTE substrat-egenskap; EXPLICIT förkastad per ADR-053, ingen tråd) · QA 4.6 framskjuten (Marcus-takt) · docs-lint-defekten `588e29b` (pipe-maskerad exit-kod) → rättad `d8d5e4f` + **L270**. AFK-TOTALT S61+S62: 4 kort autonomt, first-pass-CI 3/4, 0 ingripanden; stop-vägen fortsatt obevisad (bra utfall, omekaniskt bevisad mekanism). SKÖRD: **L267–L270** [UNIVERSAL] (hub-lyft buntas till nästa hub-sync-moment) + BUILD-LOG S62-post + transcript-ref (Code-JSONL 1 659 603 byte, 336 rader). Numrering vid stängning: nästa ADR **072** · lesson **L271** · fälla **45** · tråd **T76**. **NÄSTA (NY session S63 — HANDOFF): task-7-grillningen — Marcus öppnar med /grill-me på task-7 → design → /to-prd → /to-issues; i Marcus-takt: QA 4.6 (sista grinden för TASK-4-PRD:n; p7–8 i praktiken redan gjorda i Del 4) · batch 4-kandidaterna TASK-5/6 plockbara för /work-batch.** Full narrativ: sessionsdok Del 1–5. S61 ✅ i egen sektion nedan.)*

### Session 61 ✅ AVSLUTAD (2026-07-11) — T71/T61-upptag: autonom AFK-batch över ready-for-agent-skivor

> Scope: sessionsdok `2026-07-11-session-61.md` Del 1 (kanonisk plats):
> T71 (utforskning KLAR S60) + T61 (ARMERAD S50) till beslut — grillning
> med 5-punkts-agenda → samsyn → ev. minimal pilot (TASK-3).
> Kadensrad per L67 — uppdateras vid varje landning.

- [x] **Dok-födelse** (2026-07-11): sessionsdok fött (`ed5d2f0`, run
  29145123124 grön per jobb: Lint+Audit+TypeCheck ✓, Docs link check
  körd+grön, Test+Build by-design-skippad); numrering disk-verifierad
  (nästa ADR 071 via check-adr-count 70==70, lesson L263, tråd T75);
  audit-ci PASSED. Orienterings-passet före födelsen: senior second
  opinion på T71 — tekniska påståenden verifierade 100 % mot färsk
  Anthropic-dok (docs-agent med citat-krav) + branschprecedent-
  kartläggning (Copilot coding agent, Ralph, Backlog.md, Anthropic
  harness/best practices, Codex/Cursor → 8 konvergenspunkter, systemet
  uppfyller 6–7; luckan = hårda stop-villkor + review-yte-valet); fynd:
  AFK-etikett↔DoD #5-kollisionen på UI-skivor, TASK-3 oetiketterad
  (fynd-karantän per design), allowlist-gapet (2 WebFetch-rader).
  **NÄSTA: grillningen (5-punkts-agendan).**
- [x] **Grillad samsyn LANDAD: AFK-batch-kontraktet** (2026-07-11, Del 2
  kanonisk plats): 5/5 beslut på Code-rekommendation — (1)
  granskningsfärdig-läget (UI-skivor: DoD #5 öppen, kort `In Progress` +
  not, Done-flip=Marcus; icke-UI hela vägen Done; granskningsvågor) ·
  (2) halt-first + hårda gränser (max-kort per avfyrning ~3, aldrig
  samma kort ×2, valfritt budget-tak, kill-switch, idempotent omstart) ·
  (3) trunk-push per skiva bevaras + omprövningströskel (skarp
  Lotta-drift ELLER >~5 kort/batch → branch/draft-PR som egen landning) ·
  (4) orkestrerings-skript i session som substrat; pilot på
  klartext-order; `/work-batch`-skill i hubben + ADR-071 vid bevisad
  pilot; allowlist-förkrav i spoke settings.json · (5) pilot = TASK-3
  ensam max 1 kort (AC-komplettering → klassning → allowlist → körning);
  TASK-4-resten = batch 2 med öppet S56-övertagande. **NÄSTA:
  AC-förslag TASK-3 + allowlist-diff → Marcus-kvittens → pilot.**
- [x] **PILOT KÖRD GRÖN: task-3 autonomt To Do→Done** (2026-07-11, Del 3
  kanonisk plats): systemets FÖRSTA AFK-batch — förberedelse `71c9143`
  (AC ×4 + etikett Marcus-kvitterade + allowlist; CI grön per jobb inkl.
  Test+Build) → orkestrerings-skript (maxCards=1, halt-first) → frisk
  do-work-agent → leverans `dae3f1f` (4 testfiler: 3 kända + grep-fyndet
  event-detail; route-release ersätter delayMs — 0 call-sites kvar,
  oberoende verifierat) + stängning `871c804` (DoD #3 + final-summary +
  Done); CI grön per jobb attempt 1 på båda (run 29146238378/29146379537);
  first-pass-CI ja · 0 defekter · ~24 min · 0 mänskliga ingripanden ·
  0 permission-stopp. TDD = flake-repro röd (repeat-each=3: 5/12) →
  härdning → 151/151 grönt (repeat-each=5). Avvikelse öppet bokförd:
  final-summary-självreferensen → tvåstegs-stängning per task-2-precedent
  → **T75 registrerad** (skill-text-förtydligande). T61 + T71 → `active`
  med pilot-not. Orkestratorns oberoende disk-verifiering: kortet 4/4 AC +
  4/4 DoD, path-scope exakt, träd rent. **NÄSTA: Marcus vägval — batch 2
  (4.3+4.4 granskningsvåg) nu, eller /work-batch-skill + ADR-071 först.**
- [x] **BATCH 2 KLAR: 4.3 + 4.4 GRANSKNINGSFÄRDIGA** (2026-07-11, Del 4
  kanonisk plats; Marcus valde väg A): sekventiell 2-korts-batch, frisk
  agent-kontext per kort, båda `review-ready` — In Progress med EXAKT
  DoD #5 (design-review) öppen, alla mekaniska DoD bockade inkl.
  facit-avprickning 11+11 punkter renderat. 4.3: `dc099b3`+`3065a38`,
  CI grön attempt 1 (run 29148028260); h-scroll-defekt fångad+rättad
  före leverans; öppen design-avvikelse: Obetalda-rubrikens
  mobil-radbrytning (reflow-golvet vann). 4.4: `25c63a9` → CI RÖD
  attempt 1 (tidszons-TESTDEFEKT UTC vs Europe/Stockholm, run
  29149331316) → **autonomt remedierad** `e2fdea4` → grön per jobb (run
  29149562570) → stängning `0f20ce6`. **TASK-5 + TASK-6** fynd-kort
  registrerade oetiketterade (stale dev-server falsk-rött; parallell
  staging-contention) — agent 2 TILLÄMPADE agent 1:s mitigations
  (substrat-buren kunskapsöverföring). S56-övertagandet öppet bokfört
  (Del 4). Metrik: 2 agenter · ~109 min · first-pass-CI 1/2 · 0
  ingripanden. S61 totalt: 3 kort autonomt (1 Done + 2 review-ready).
  Webbtavle-avvikelsen (Marcus-observation) bokförd, kollas
  post-session. **NÄSTA: Marcus design-review av /hem mot
  K10-facit-bilagorna → per kvittens: DoD #5 + final-summary + Done
  (Code) → 4.5 plockbar. Därefter S62: /work-batch-skill + ADR-071 +
  T75 + TASK-5/6-klassning.**
- [x] **GRANSKNINGSVÅGEN STÄNGD: 4.3 + 4.4 Marcus-GODKÄNDA → Done**
  (2026-07-11, Del 5 kanonisk plats): båda första varvet ("Det ser
  jättebra ut"), reflow-avvikelsen godkänd; DoD #5 + final-summary
  (AFK-proveniens) + Done-flip per kort på Marcus-kvittens (`c9dca68`).
  **4.5 PLOCKBAR** — vågmekaniken bevisad hela kedjan (kod →
  review-ready → mänsklig grind → flip → nästa våg). TASK-4: 4/5 skivor
  Done, design-review 2/2 första varvet. **NÄSTA (förslag lagt till
  Marcus): session-end S61 → S62: bygget (/work-batch-skill + ADR-071 +
  T75, EN hub-landning) → batch 3 (4.5) som skillens första bruk →
  QA 4.6 (Marcus) → TASK-5/6-klassning + webbtavle-kollen.**
- [x] **End-passet FÖRBERETT** (2026-07-11, Del 6 kanonisk plats; trappan
  Marcus-kvitterad): skörd **L263–L266** (alla [UNIVERSAL]:
  självreferens-tvåstegs-stängning · tidszons-pinnade test-förväntningar ·
  gh-run-list-commit-quirken · substrat-buren kunskapsöverföring;
  hub-lyft deferrad → buntas med S62:s hub-landning) + **BUILD-LOG
  S61-post** + transcript-ref (Code-JSONL 1 784 156 byte) + trådar
  synkade (T75 ny, T61/T71 uppdaterade). Intentions-grinden PASSERAD
  (nästa = bygget i NY session S62). Coverage-rapporten i STOPPA;
  lifecycle-flip + rad 7-slutsummeringen väntar Marcus-kvittens. Kvar
  efter stängning: Update-klicket i claude.ai.

*Senast uppdaterad: 2026-07-11 (**Session 61 ✅ AVSLUTAD 2026-07-11** (`lifecycle: closed` efter Marcus coverage-kvittens "A — inget osäkrat, stäng") — **T71/T61-upptaget: AFK-batch-arbetssättet grillat, piloterat och BEVISAT.** ORIENTERING: T71:s tekniska påståenden 100 % omverifierade mot färsk Anthropic-dok (docs-agent, citat-krav) + branschprecedent 5 källor → 8 konvergenspunkter (systemet uppfyllde 6–7; luckan = hårda stop-villkor + review-ytan); fynd: AFK-etikett↔DoD-5-kollisionen, headless-dörren (`claude -p "/do-work"`) + read-only-agents doc-verifierade. GRILLAD SAMSYN (Del 2, 5/5 på Code-rekommendation): granskningsfärdig-läget (Done-flip=Marcus, granskningsvågor) · halt-first + hårda gränser (max-kort ~3, aldrig samma kort ×2, budget-tak, kill-switch, idempotent omstart) · trunk-push bevaras + omprövningströskel (skarp Lotta-drift ELLER >~5 kort/batch → branch/PR-fråga som egen landning) · orkestrerings-skript i session; /work-batch-skill + ADR-071 vid bevisad pilot; allowlist-förkrav (`71c9143`) · pilot = TASK-3. **PILOT GRÖN (Del 3):** TASK-3 autonomt To Do→Done — `dae3f1f`+`871c804`, CI grön per jobb attempt 1, first-pass JA, 0 defekter, ~24 min, 0 ingripanden; grep-svepet fann 4:e filen (event-detail); `delayMs:`-call-sites i tests/ = 0; avvikelse öppet bokförd → **T75** (final-summary-självreferensen → tvåstegs-stängning per task-2-precedent). **BATCH 2 GRÖN (Del 4):** 4.3 (`dc099b3`+`3065a38`, first-pass JA, h-scroll-defekt fångad+rättad FÖRE leverans, facit-avprickning 11 p renderat) + 4.4 (`25c63a9` → CI RÖD på tidszons-TESTDEFEKT UTC-vs-Europe/Stockholm → **autonomt remedierad** `e2fdea4` → grön per jobb → `0f20ce6`, facit 11 p) — båda GRANSKNINGSFÄRDIGA; **TASK-5+6** fynd-karantän (stale dev-server falsk-rött; parallell staging-contention) — agent 2 TILLÄMPADE agent 1:s mitigations via korten (L266, substrat-buren kunskapsöverföring); S56-övertagandet öppet bokfört. **GRANSKNINGSVÅGEN (Del 5):** Marcus godkände 2/2 FÖRSTA varvet (inkl. reflow-avvikelsen) → DoD 5 + final-summary (AFK-proveniens) + Done (`c9dca68`) → **4.5 PLOCKBAR** (TASK-4: 4/5 skivor Done). DRIFT-METRIK: 3 kort autonomt levererade · first-pass-CI 2/3 · 0 mänskliga ingripanden · 0 permission-stopp. SKÖRD (Del 6): **L263–L266** [UNIVERSAL] (självreferens-tvåstegs-stängning · tidszons-pinnade testförväntningar · gh-run-list-commit-quirken · substrat-buren kunskapsöverföring; hub-lyft → S62:s hub-landning) + BUILD-LOG S61-post + transcript-ref (Code-JSONL 1 784 156 byte). ADR-071 DEFERRAD till S62-bygget (grillad samsyn b4; beslutet durabelt i Del 2 + T61/T71-korten). Numrering vid stängning: nästa ADR **071** · lesson **L267** · fälla **45** · tråd **T76**. **NÄSTA (NY session S62): bygget — /work-batch-skill + ADR-071 + T75-buntning + hub-lyft L263–L266 (EN hub-landning + omstart) → batch 3 (4.5) som skillens första skarpa bruk → QA 4.6 (Marcus) → TASK-5/6-klassning + webbtavle-kollen.** Full narrativ: sessionsdok Del 1–6. S60 ✅ + S59 ✅ i egna sektioner nedan.)*

### Session 60 ✅ AVSLUTAD (2026-07-08 → 2026-07-11) — Airtable-avstämning FJS+RIM1+Psionautics → segment/Skool/Resend-riggen

> Slutsummeringen nedan flyttades VERBATIM från rad 7 vid S61-stängningen
> (rad 7 bär alltid senast stängda sessionen). Full narrativ: sessionsdok
> [`2026-07-08-session-60.md`](sessions/archive/2026-07/2026-07-08-session-60.md) Del 1–6 +
> BUILD-LOG S60-posten.

*Senast uppdaterad: 2026-07-11 (**Session 60 ✅ AVSLUTAD 2026-07-11** (`lifecycle: closed`; 3 pauser/resume-cykler, numret 60 bevarat hela vägen; Marcus coverage-kvittens "A - inget osäkrat, stäng"; **nästa arbete öppnar Session 61**) — **Airtable-avstämning FJS+RIM1 + Psionautics → 5-material-segmentmodell för Skool-inbjudan (Resend).** KLART: sessionsdok fött (`26597df`); Fas 1 read-only-avstämning + **GRIND 1-godkänd A/B/C** (FJS Event-18: 22 närv = 8A+14B, 3 no-show · RIM1 Event-19: 18 närv = 12A+6B, 6 no-show); **20 walk-in-anmälningar** (Marcus Airtable Scripting, ID 916–935); **2 kantfall fixade** — Jasmin namnlös-lead reverse-flow → **fälla 21 BEKRÄFTAD**; Lene case-e-post-dubblett konsoliderad+raderad → **ny fälla**; **FJS+RIM1-närvaro markerad (80 Deltaganden), verifierad** (Andreas FS×1+RIM1×1, 4/4) → segment-värdet för FJS+RIM1 LEVERERAT. LÅSTA BESLUT: 5-material-modellen (utbildnings-gated, källäst); bas-defekterna → data-model §Kända fällor + **T16** (ej tråd/backlog, SYSTEMET.md §2/§7); T18 = plugin-1.12.0-gapet. **DEL 3 KLART (resume):** Psionautics Event-17 A10-bulk 220 → **källavstämning mot Lottas CSV avslöjade över-markering** → path A-korrektion **64 Deltaganden → Ej avstämt** (10 icke-Bekräftade + 44 orphan/test) → verifierat **156 Närvarande** (78 Bekräftade); **status-flip 17/18/19→Genomfört**; **dok klar** (execute-log ny + data-model fälla 40 case-e-post + 41 orphan-Deltaganden + fälla 21/A2-hypotes BEKRÄFTAD + **L254–L255** [UNIVERSAL] + BUILD-LOG S60). STOPPA fångade namn-kollision (2× Stefan Martinsson) före felaktig revert. **DEL 4 KLART (2:a resume):** segment-beräkningen (read-only, källäst) gav **4 material-listor** (RIM 3 = noll närvaro, väntat) och avtäckte **sex bas-defekter** → Marcus STOPPADE exporten → planläge → uppröjning. **NY fälla 42** (anmälan utan e-post → A2 Gren 4 skapar permanent omatchbar Person; skild rot från 40:s skiftläge) — **Ulrika Arvas + Stefan Martinsson konsoliderade** (re-pekat + dubbletter raderade, verifierat 4/4 resp 2/4). **NY fälla 43:** de 186 namnlösa är **DATAFÖRLUST VID KÄLLAN, ej bugg** — 365 namnlösa anmälningar ↔ exakt 365 `firstname: null` i backfill-mapping.yaml ↔ ursprungs-xlsx saknar namnkolumner före 2026-01; återvinningsgrad **0/187** mot två oberoende källor; `create-registration` kräver namn → ej kodväg. Marcus-verifierat: namn fördes aldrig i början. **Roll-matrisen** `docs/reference/testkonton.md` skapad. **INFÖRT FEL, UPPTÄCKT + ÅTERSTÄLLT SAMMA DAG:** `rectU34rbPfo6VD10` klassades som testkonto enbart på adress-match (`highfive.epost@gmail.com`) → dess 2 Närvarande-Delt reverterades → Event-17 skrevs om till 154/66. **Fel.** Marcus: adressen har DUBBELROLL; Lottas CSV (facit, låg i ~/Downloads, lästes aldrig) visar "Marcus Johansson … Bekräftad … Ja[betalt] … Formulär 2026-02-21" — riktig betalande deltagare. Återställt: **Event-17 är 156 Närvarande + 64 Ej avstämt = 220, precis som Del 3 hade rätt i.** → **fälla 44** + **L258** (falskt positivt; spegelbild av L256:s falskt negativa — samma rot: proxy förväxlad med det den mäter). **Ann-Marie** → medföljande till Stefans BEKRÄFTADE anmälan. Dok: fälla 42+43+44, fälla 40 korsref, fälla 41 preciserad, execute-log §Steg 4–5, T16-vidgning, **L256–L258** [UNIVERSAL]. **MARCUS IDENTITET KONSOLIDERAD:** hans Psionautics-anmälan+närvaro+touchpoint re-pekade till `rec8sFNULpjfe0Lw9` (highfive@), tom post raderad — **pre-flight-grinden fällde första försöket** (en touchpoint rapporterad som tp=0 av felläst fält-ID-svar; utan grinden hade historik raderats). Marcus namn ifyllt på `reczBItiZhCLlE2Cs` (han var själv en av de 186 namnlösa). Beslut: **två deltagar-identiteter behålls** (highfive@ → Psionautics; inbox@ → FS/RIM1/RIM2) — sammanslagning vore kosmetisk, A2 matchar på e-post. **Exporten klar men EJ committad** (416 e-postadresser): RIM1 310 · FS 134 · RIM2 85 · **Psio 77** · union 416 (1:1 unika; endast de 2 ÄKTA testartefakterna + Ann-Marie utan e-post exkluderade). **L259** [UNIVERSAL]: konserveringskontroller (`Σ = 220`) är blinda för felklassificering — 156+64 och 154+66 summerar båda till 220; kategori-korrekthet kräver extern källa. **Fälla 42-förfining** [HYPOTES]: roten är A2:s trigger-snapshot (fält tomma vid RECORD_CREATED), ej anmälans sluttillstånd. **DEL 5 — SKOOL-MEKANIKEN AVTÄCKT → PARTITION:** Skool har bara **3 låsta "mentala ankare"** (FS, RIM1, RIM2); **inget Psionautics-ankare** (Marcus: innehåll finns ej ännu → de 39 rena Psionautics-deltagarna bjuds in utan låst material). **Marcus testade empiriskt: samma adress ×3 → 3 inbjudningsmail** ⇒ Skool dedupar INTE ⇒ **grillningens slutsats "partition behövs inte för Skool" RIVEN** (Del 1 §Samsyn, in-place-not); Marcus ursprungliga dubbel-inbjudan-oro var KORREKT för Skool-flödet. Segment-modellen i basen oförändrad (överlappande); det är LEVERANSEN som partitioneras. **Leverans genererad** (`~/Downloads/skool-export-2026-07-09/` + INSTRUKTION.md, EJ i git — 416 adresser): **8 Skool-uppladdningar** (partition: RIM1 197 · FS 62 · RIM1+RIM2 42 · inga-ankare 39 · FS+RIM1+RIM2 38 · FS+RIM1 33 · RIM2 4 · FS+RIM2 1 = 416, var person exakt en gång, verifierat) + **2 Resend-listor** (personlig hälsning 230 / namnlös 186 — fälla 43; disjunkta, verifierat). Ordning: Resend-förvarning FÖRST, sedan Skool. `Mentalt ankare` tillagt i ORDLISTA.md. **Skools CSV-mall verifierad** (`test-skool.csv`: ingen header, en adress/rad, ingen trailing NL) → filerna regenererade; partition-generatorn bevarad som `skool-partition.mjs` (fäller exit 1 vid dubblett/avvikelse). `Mentala ankare` = PLURAL (Marcus-korr). **LEVERANSEN KLAR + VERIFIERAD** (`~/Downloads/skool-export-2026-07-09/`, EJ i git): 8 partitionerade Skool-filer i Skools nakna format (ingen header/trailing-NL, mall-verifierad) + 2 disjunkta Resend-listor. Generatorn `skool-partition.mjs` bevarad i repot, **fäller exit 1** vid dubbel-inbjudan/partition≠union. **DEL 6 KLART (2026-07-10): RESEND-RIGGEN STÅR — sidospåret stängt.** 2 segment importerade (230 personlig / 186 namnlös), 2 broadcasts riggade + BEVISADE (skarpt minitest: `first_name`-chip → "Hej Marcus,"/"Hej där,"; citerad From `"Roger & Lotta - Miranon Media"`; avprenumerera-länk verifierad utan klick) — **R&L väljer sänddag**. Två grundorsaker lösta: OpenDNS/Telenor felstämplade `cdn.resend.app` som PHISHING (`hit-phish.opendns.com`) → Mac-DNS 1.1.1.1/8.8.8.8 (memory-fil skriven); editor-chips binds via egenskapsNYCKELN (`first_name` gemener — `FIRST_NAME` är legacy reserved; docs-lucka, endast video). **T74** registrerad (consent två sanningskällor; flaggan bärs av 0 records idag, live-verifierat). **NYTT (Marcus): Psionautics-ankaret på väg → Skool-partitionen räknas om med 4:e ankare (~14 grupper; unionen 416 + Resend-riggen OPÅVERKADE; sänddag kräver att ankaret finns i Skool).** **OMRÄKNAT (07-10):** Psionautics = 4:e ankaret → **14 grupper** (invarianter gröna, konservering grupp-för-grupp verifierad) → `~/Downloads/skool-export-2026-07-10/` + ny INSTRUKTION (sekvens-krav: Psio-ankaret måste finnas i Skool före sänddagen). **KONSOLIDERAT (07-11):** ett Resend-segment (416) + EN broadcast, nytt minitest grönt (fossil-strukturen två segment riven — Marcus fångade); R&L-mail granskat+korrigerat (417/416, 14 grupper, team-invite ersätter creds-per-mail) + Dropbox-referensdoc levererad. **STÄNGNINGSSEKVENSEN KLAR (07-11):** material-mappningen → `segment-arkitektur.md` §Material-mappningen (ADR-bar-prövad: under baren, ingen ADR); skörd **L260–L262** [UNIVERSAL] (broadcast-låst-kandidaten förkastad öppet); **hub-lyft K60.1–K60.9** (L254–L262 → marcus-system `bc20f0f`); MD033-CI-miss under sekvensen fångad+fixad (`d84e4a9`). Numrering vid stängning: nästa ADR **071** · lesson **L263** · fälla **45** · tråd **T74 finns, nästa T75**. Kvar för R&L (utanför Code): skapa Psionautics-ankaret i Skool → Resend-Send → 14 Skool-uppladdningar (INSTRUKTION.md i `~/Downloads/skool-export-2026-07-10/`). Numrering disk-verifierad: nästa ADR **071**, lesson **L260**, fälla **45**, tråd **T74**. Öppet: dubbelroll-adresser (T72) → staging-först, `Testdata`-fält i basen, plus-adressering; PII i git (T73). Carry: T16 (radera äkta testartefakter+orphans, fälla 42-basfix) + Jessica-Anteckningar. Numrering: ADR 070 (ingen mintad), nästa lesson **L260**, nästa fälla **45**, ingen ny tråd. Full narrativ: sessionsdok Del 4 + `docs/backfill/execute-log.md`. S59 ✅ i egen sektion nedan.)*

### Session 59 (2026-07-07, pågår) — MIGRERINGS-HUB-SESSION 4: kartans steg 4b (SYSTEMET.md-bygget + konsolidering)

> Scope: sessionsdok `2026-07-07-session-59.md` Del 1 (kanonisk plats):
> steg 4b per S57 Del 5 (6 grillade beslut). SYSTEMET.md byggs i hub-roten
> (versal) → absorberar ARKITEKTUR.md + WORKFLOW.md (arkivera-inte-radera,
> T22 konsumeras) → spoke-systemet.md arkiveras + flytt-beroende pekare →
> konsoliderings-ADR (070). Arbetsform (beslut 5): research → DIVERGENS 2–3 →
> Marcus väljer → KONVERGENS → acceptansgrindar (färsk-agent-test m.fl.).
> Kadensrad per L67 — uppdateras vid varje landning.

- [x] **Dok-födelse** (2026-07-07): sessionsdok fött (`4df45a2`, run
  28896822094 grön per jobb: Lint+Audit+TypeCheck ✓, Docs link check ✓ körd,
  Test+Build skipped by-design); numrering disk-verifierad (nästa ADR = 070 via
  check-adr-count 69==69, lesson = L252, tråd = T70; T22 konsumeras); audit-ci
  PASSED; index-artefakten (frontmatter-tillbaka-datering, S58-rest,
  worktree==HEAD) rensad via `git restore --staged`. Research-passet startat
  (3 spår som bakgrundsagenter; A-spårets första körning gav en anomali/0
  tool-uses → omkört rent med injektions-hygien). **NÄSTA: research-syntes →
  DIVERGENS.**
- [x] **Research + divergens + strukturval** (2026-07-07): 3 research-spår
  klara (A Diátaxis/arc42/C4 · B branschprecedent · C intern inventering;
  bilaga `2636ed1`). 3 strukturkandidater producerade (skelett + provsektion
  var) → **Marcus valde kandidat C "Systemkartan" + B:s §4-vinjett utbyggd**.
  Beslut 4 förfinat öppet (C4 = nedstignings-disciplin inuti sektioner, ej
  dok-ryggrad). Del 2 = kanonisk trail. **NÄSTA: KONVERGENS — bygg SYSTEMET.md
  §0–13 i hub-roten sektion-för-sektion mot acceptansgrindarna.**
- [x] **Konvergens + konsolidering LEVERERAD** (2026-07-08, Del 3 kanonisk plats):
  SYSTEMET.md byggd i hub-roten (§0–13, drygt 520 r, kandidat C + dubbelskikt;
  hub `307d1af`→`6837f3d`, läs-tillbaka L239). Acceptansgrindarna klara
  (färsk-agent-test PASSERAT + 2 fynd åtgärdade; **Marcus fångade empiri-attributions-
  fel** [self-review ~9 % mättes på Chat-ytan, ej Code] → rättat `6837f3d`; fel-klass-
  kontroll bredare = rent). Konsolidering: **HUB `04fa792`** (ARKITEKTUR+WORKFLOW →
  archive/absorberad-i-systemet/ + pekare omdirigerade; WORKFLOW:s projekt-livscykel-ops
  → **T70**) · **SPOKE** (spoke-systemet.md arkiverad + pekare-stub [governing 14
  oförändrad] + 4 länkar omdirigerade, L249) · **T22 konsumerad** · **ADR-070 mintad**
  (nummer-not: 068 = Övnings-ramverket orört; två-aktörs-ADR WIP/Proposed, prövotid ej
  bevisad). **NÄSTA: spoke-grind + commit + push + CI → session-end (skörd L252, BUILD-LOG).**

### Session 58 (2026-07-07, pågår) — MIGRERINGS-HUB-SESSION 3: kartans steg 4a (flytt-oberoende ytor + plugin-bunten)

> Scope: sessionsdok `2026-07-07-session-58.md` Del 1 (kanonisk plats):
> kartans steg 4a per S57 Del 5 beslut 6 — färsk 4a-yt-inventering →
> hub-ytorna (§Roll-arkitektur, README, IDENTITET varsamt,
> CLAUDE-engineering, retrospektiv-mallen, bas-PI-prosa/titel) →
> plugin-bunten (8 filer, EN atomisk bump 1.11.0→1.12.0; OMSTART =
> Marcus-moment EFTER) → spoke-ytorna (CONTRIBUTING Aktörer med flera).
> SERIELL: S56 pausad `071b32a` FÖRE födelsen (ingen rivning av
> beslut 6). Kadensrad per L67 — uppdateras vid varje landning.

- [x] **Dok-födelse** (2026-07-07): sessionsdok fött (`fa48591`, run
  28865899722 grön per jobb; Docs link check körd + grön, Test+Build
  by-design-skippad); numrering disk-verifierad (nästa ADR = 070 via
  check-adr-count 69==69, lesson = L249, tråd = T70); audit-ci PASSED;
  seriell-villkoret uppfyllt utan rivning (S56 pausad FÖRE födelsen,
  Marcus-kvitterad väg) + öppnings-empirin (Vale-racet på T69-kortet
  fångat mekaniskt av fil-modifierings-skydd + omläsning per L248;
  T67-klass) bokförd i Del 1. **NÄSTA: kartans fulltext (S47 Del 3) +
  färsk 4a-yt-inventering mot HEAD.**
- [x] **Steg 4a LEVERERAT** (2026-07-07): Chat-ytan avvecklad ur alla
  levande operativa artefakter — 9 commits (6 hub + 3 spoke). HUB (A+B):
  konstitution `0c54799` (§Roll-arkitektur 'Chat, Code, Marcus' → 'Code,
  Marcus'; IDENTITET 'Två läsare'; empirin yt-neutral; Marcus-kalibrerad
  ton via diff-STOPPA) · README+CLAUDE-engineering `331117a` ·
  retrospektiv-mallen arkiverad `34804fd` (levande/död = död) · bas-PI
  RETIRERAD `21af7b2` (OMSKRIV→RETIRERA, över-engineering-vakten;
  snapshot = fallback) · plugin-bunten `505a781`+`1f45767` → 1.12.0
  (6 skills av-dubblade + session-end Code-kört; transcript →
  referera-JSONL; OMSTART PENDING). SPOKE (C): prosa `373ba66`
  (spoke-CLAUDE/CONTRIBUTING/3 docs) · spoke-delta RETIRERAD `1d000d1`
  (→ docs/archive/, symmetrisk; T02 moot → closed) · enabling-fix
  `74f29b4` (bruten systemet.md-länk). Läs-tillbaka L239 grön
  (kvarvarande 'Chat' = historik/härkomst); spoke CI grön per jobb;
  INGEN ADR (count 69). r76/r81 granskade + lämnade (agent-neutrala).
  **NÄSTA: end-passet.**
- [x] **End-passet FÖRBERETT** (2026-07-07, Del 2 kanonisk plats):
  skörden L249–L251 (alla [UNIVERSAL]: inkommande-länkar-vid-arkivering,
  retirera-vs-omskriv-vakten, kalibrera-formulering-en-gång; hub-lyft via
  lessons-hub-sync pending) + T02 stängd (moot: `project-instructions/`
  retirerad) + BUILD-LOG S58-posten + transcript-referens Code-JSONL
  (`99062d28…`, 2 797 632 byte). Intentions-grinden N vs N+1 PASSERAD
  (nästa = steg 4b, NY session S59; Marcus valde end över paus — 4b =
  distinkt scope per S57 beslut 6). Coverage-kvittens-grinden: rapporten
  i STOPPA; `lifecycle: closed` flippas FÖRST efter Marcus-kvittens.
  OMSTART (1.12.0) = Marcus-moment efter stängning.
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-07): coverage-rapporten
  kvitterad ("Stäng"); punkt 3 (osäkrat annan yta) inget att säkra.
  `lifecycle: closed` i denna stängnings-commit + rad 7-slutsummeringen +
  hub-lyft L249–251 (K58.1–3). Kvar Marcus-moment: OMSTART (aktiverar
  plugin 1.12.0) + Update-klick i claude.ai. **NÄSTA: steg 4b som
  S59 (fräsch chatt).**

### Session 57 ✅ AVSLUTAD (2026-07-07, PARALLELL med S56) — MIGRERINGS-HUB-SESSION 2: kartans steg 2+3 + steg 4-grillningen

> Scope: sessionsdok `2026-07-07-session-57.md` Del 1 (kanonisk plats):
> steg 0-inventering + T67 → steg 2 (kirurgiska §4.1/§5, Decision B) →
> steg 3 (retirera relä-apparaten till hub-arkiv, arkivera-inte-radera).
> PARALLELL-PILOT med S56 (annan agent, samma checkout) — guardrails
> 1–6 + pilot-empiri i Del 1. Kadensrad per L67 — uppdateras vid varje
> landning.

- [x] **Dok-födelse** (2026-07-07): sessionsdok fött (`dee9e64`, run
  28855350600 grön per jobb; Docs link check körd + grön, Test+Build
  by-design-skippad); numrering disk-verifierad (nästa ADR = 070,
  lesson = L248, tråd = T67); audit-ci PASSED; pilot-empiri #1
  (förklarad dirty tree = S56-agentens aktiva task-4.1-kort) bokförd
  i Del 1.
- [x] **Steg 0-landningen** (2026-07-07, Del 2 kanonisk plats):
  cross-repo-inventeringen KLASSAD (steg 2/3 exekveras i S57;
  steg 4-kön bokförd inkl. plugin-restposten; RÖR EJ-klassen skyddar
  historiken) + arkiv-beslutet (`archive/tre-aktors-apparaten/` i
  hub-roten) + **T67 REGISTRERAD** (parallella aktiva sessioner —
  arbetssätts-pilot; grillning + ev. ADR efter piloten) + pilot-empiri
  #2 (todo.md ändrad av S56-agenten mitt under S57-turn — staleness-
  fångad, omläst, om-deriverad). Marcus-kvittens: senior-delegering →
  alternativ A.
- [x] **Steg 2 LEVERERAT: Decision B** (2026-07-07, Del 3 kanonisk
  plats): code-role-discipline v1.1→v1.2 (hub `ecbdd53`) — §4.1
  Code→Marcus→Chat → Code→Marcus (relä-etappen borttagen) + §5
  p.1/p.4-kirurgin; ytoberoende rigor-rader ORÖRDA; läs-tillbaka mot
  HEAD-blob grön (L239: relä-markörer 0 träffar). Pilot-empiri #3
  (delat git-index i delad checkout → pathspec-commit-praxis).
- [x] **Steg 3 LEVERERAT: relä-apparaten ARKIVERAD** (2026-07-07,
  Del 4 kanonisk plats): hub `4e751f8` —
  `archive/tre-aktors-apparaten/` (9 filer: ARKIV-README + 2
  templates-filer + 5 claude-app-skills-wrappers via git mv
  [historiken bevarad] + full bas-PI-snapshot före klipp); levande
  bas-PI kirurgiskt klippt 219→148 rader (4-ZONERS +
  INTERAKTIONSMEKANIK + SELF-REVIEW-relä-formen; INGEN rigor struken
  — bärarna verifierade: hub-CLAUDE STOPPA-raden +
  code-role-discipline §3.1/§3.3); läs-tillbaka L239 grön; hub-trädet
  HELT RENT. **KARTANS STEG 2+3 KOMPLETTA** — kvar: steg 4 (egen
  session, systemet.md SIST + plugin-bunten) + steg 5/Accepted.
- [x] **Grillningen inför steg 4 LANDAD** (2026-07-07, Del 5 kanonisk
  plats; Marcus-beordrat scope-tillägg, öppet bokfört): 6 beslut
  kvitterade — scope = operativa systemet KOMPLETT (tredelningen
  bevaras) · dubbelskiktade sektioner (Gunilla-lager + referens) ·
  hub-hemvist `SYSTEMET.md` + konsolidering (ARKITEKTUR/WORKFLOW
  absorberas, T22 konsumeras; sannolik ADR i 4b) · EN fil
  C4-nedstigning · research→divergens 2–3→konvergens +
  FÄRSK-AGENT-TESTET som mekanisk slutgrind · steg 4a
  (flytt-oberoende + plugin-bunt, SERIELLT) → 4b (SYSTEMET.md-bygget,
  egen session). Exekveringen KVAR utanför S57.
- [x] **End-passet FÖRBERETT** (2026-07-07, Del 6 kanonisk plats):
  skörden L248 [UNIVERSAL] (delad-checkout-git-formerna, ur
  pilot-empirin) + hub-lyft SAMMA session (K57.1) + 4 kandidater
  explicit förkastade med bärare + BUILD-LOG S57-posten (6 CI-run-id:n
  bokförda) + transcript-referens Code-JSONL (1 591 675 byte).
  Intentions-grinden N vs N+1 PASSERAD (nästa = steg 4a, NY session).
  Lifecycle-flip väntar på coverage-kvittens (ADR-069-grinden);
  S56 stänger separat senare (guardrail 2).
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-07): coverage-
  rapporten kvitterad ("Kör"); post 3 inget anmält. `lifecycle:
  closed` i stängnings-commiten + slutsummeringen (rad 7 = S57).
  Kvar Marcus-moment: Update-klicket i claude.ai. **NÄSTA: steg 4a
  i NY SERIELL session** (efter S56:s stängning i Marcus ordning).

### Session 56 (2026-07-07, pågår) — T65-kortfödseln: /to-prd → skivning → skarpt Hem-bygge

> Scope: sessionsdok `2026-07-07-session-56.md` Del 1 (kanonisk plats):
> /to-prd på K10-facitet (S55 Del 12 som input, ingen ny intervju) →
> /to-issues-skivning → /do-work skarpt NYSKRIVET Hem-bygge så långt
> sessionen räcker. Kadensrad per L67 — uppdateras vid varje landning.

- [x] **Dok-födelse** (2026-07-07): sessionsdok fött (`6724fe7`, run
  28851427174 grön per jobb; Test+Build by-design-skippad, Docs link
  check körd + grön); numrering disk-verifierad (nästa ADR = 070,
  lesson = L248, tråd = T67); audit-ci PASSED.
- [x] **PRD-KORTET FÖTT: TASK-4 "PRD: Hem-vyn till K10-facit"**
  (2026-07-07, Del 2 kanonisk plats): skarv-kvittensen låst av Marcus
  efter förklarings-varv (EN skarv — befintliga e2e-/axe-sviten; ingen
  api-/unit-skarv) + två öppna deklarationer: B4-datavägen REVIDERAD
  till klient-side-join (Del 12-notens EF-utökning falsifierad mot
  disk; ej tyst rivning) + aktivitets-ytan bekräftad utanför (klass D
  → Fas 6.5). Kropp: 20 användarberättelser, 13 implementationsbeslut,
  EN skarv, estimat 5 skivor S/M/M/M/S + QA; DoD 4 defaults + 2
  facit-grindar (L220 + L245/L246). Läs-tillbaka via CLI verifierad.
  **NÄSTA: /to-issues** (skivningen; skiv-godkännandet är den skillens
  avstämning) → /do-work skarpt NYSKRIVET Hem-bygge.
- [x] **SKIVNINGEN PUBLICERAD: task-4.1–4.6** (2026-07-07, Del 3
  kanonisk plats; skiv-godkännandet Marcus-delegerat till senior-
  granskning — täcknings-pass: varje facit-punkt mappad mot en skiva;
  EXAKT-garantin i fyra lager: mät-AC → facit-avprickningen →
  design-review mot bilagorna → QA sida-vid-sida): 4.1 @layer-
  prefaktoreringen (S, oblockad) → 4.2 Hem-strukturen (M, ←4.1;
  versionskällan öppet flyttad hit från PRD-estimatets skiva 1) →
  4.3 Nästa event + Obetalda (M, ←4.2) · 4.4 Anmälningslistan (M,
  ←4.2) → 4.5 Osynliga uppdateringen (S, ←4.3+4.4) → 4.6 QA-planen
  (ready-for-human, ←alla). DoD-arvet (2 facit-grindar) på varje
  skiva; tavlan CLI-läs-tillbaka-verifierad. **NÄSTA: /do-work →
  task-4.1.**
- [x] **task-4.1 LEVERERAD: @layer base-flytten** (2026-07-07, Del 4
  kanonisk plats; kod+kort `c89a277`, run 28855699515 grön per jobb
  FÖRSTA passet inkl. Test+Build): TDD 1 cykel (permanent
  kaskad-invariant-test rött→grönt); senior-fyndet DashboardCards
  latenta text-text-muted neutraliserad öppet (renderat läge bevarat
  EXAKT — 5 rubriker byte-identiska computed styles före/efter);
  DoD 5 EJ TILLÄMPLIG per grindens villkor (noll synlig UI-yta);
  API-lokal-luckan (TEST_REGISTRATION_RECORD_ID = CI-secret) och
  parallell-lastens e2e-flake (TASK-3-klassen) öppet bokförda.
  Parallell S57 (dee9e64) observerad — noll konflikt. **NÄSTA:
  /do-work → task-4.2 Hem-strukturen (nu oblockad).**
- [x] **task-4.2 KOD LEVERERAD: Hem-strukturen till facit** (2026-07-07,
  Del 5 kanonisk plats): header-avstängning per vy
  (staticData.hideShellHeader), kolumn-geometrin till facitets
  pt-6/pt-14 + 16 px-inset, "Hej {namn}" utan ! + B2-återbesöket,
  Mina sidor-platshållaren (RefreshButton RADERAD; B5 = ADR-017
  Updates-not), versionsraden build-injicerad (B-NYTT2). TDD 5
  beteenden rött→grönt (24/24); geometri-probe mot facit EXAKT;
  fulla e2e 126/2 skip + a11y 13/13 (enda felet = TASK-3:s
  pre-existing narvaro-flake, orörd yta). Kod `9189cb5`, run
  28857988881 grön per jobb FÖRSTA passet inkl. Test+Build.
  **STÄNGD: design-review Marcus-GODKÄND 2026-07-07 (första varvet,
  skal-scopet) → DoD 6/6, final-summary, Done (stängningsnoten
  Del 5). NÄSTA: /do-work → task-4.3 eller 4.4 (BÅDA plockbara).**
- [~] **SESSION 56 PAUSAD** (2026-07-07, PAUSLÄGE-blocket kanonisk
  plats; Marcus-kvittens "kör paus", intentions-grinden passerad):
  durabel parkering mitt i TASK-4 efter skiva 4.2 — numret 56 BEVARAS,
  återupptas via `session-resume`. Levererat i S56: TASK-4 fött +
  skivat (4.1–4.6) + skivorna 4.1 & 4.2 Done (2/5). KVAR: 4.3 + 4.4
  (plockbara) → 4.5 → QA 4.6. Lesson-KANDIDATER antecknade i HANDOFF
  (cascade-aktiverar-död-styling + CI-ärver-förälder-röd), EJ
  hub-lyfta (skördas vid session-end). Session-end-materia (ej paus):
  BUILD-LOG S56-post, T65-flipp, lessons-skörd. Paus-commit `071b32a`,
  CI grön per jobb.

### Session 55 ✅ AVSLUTAD (2026-07-06 → 2026-07-07) — T65 Hem-konvergensen: K10 låst som FACIT

> Scope: sessionsdok `2026-07-06-session-55.md` Del 1 (kanonisk plats):
> konvergens-prototypen (EXAKT kopia av faktiska Hem-vyn) →
> Marcus-iteration till designlåsning → kort + skarpt utförande i
> Marcus-takt. Kadensrad per L67 — uppdateras vid varje landning.

- [x] **Dok-födelse + S55-öppningen** (2026-07-06): sessionsdok fött
  (`7b292be`, run 28809048743 grön per jobb; Test+Build by-design-
  skippad, Docs link check körd + grön) + T65-flipp `paused`→`active`
  med ingång → Del 1 + **T66:s aktiverings-förbehåll INFRIAT**
  (omstarten utförd: install-record 1.11.0 == hub-HEAD `6272336`;
  tvåfas-sektionen live; 15 skill-kataloger) bokfört i Del 1 +
  tråd-registret.
- [x] **Konvergens-prototypen K1 LEVERERAD** (2026-07-06, Del 2
  kanonisk plats; prototype-skillen Marcus-avfyrad — första skarpa
  1.11.0-konvergens-bruket): K1 = EXAKT kopia av faktiska Hem-vyn
  live på `/hem?variant=k1` (kod `4d48f84`, [PROTOTYPE]-märkt);
  exakt-kopian **BEVISAD byte-identisk** (cmp på
  main-element-skärmdumpar) mot staging-data; växlare +
  devtools-gömning + DEV-grind återställda ur `bf705f2`
  (återupplivningsvägen); e2e-baselines opåverkade (utan `?variant=`
  renderas Hem oförändrat — CI-BEVISAT: run 28810028150 grön per jobb
  FÖRSTA passet inkl. Test + Build; Del 2-commiten run 28810089671
  grön per jobb). Körbarhets-golvet grönt (typecheck + Biome 0 fel).
  **NÄSTA: Marcus-iterationen i webbläsaren**
  (`localhost:5173/hem?variant=k1`) — feedback → K2/K3 … tills HELT
  nöjd → svar-fångst → kort ur T65 → skarpt bygge.
- [x] **Designdumpen KLASSAD + K2 BYGGD** (2026-07-06, Del 3 kanonisk
  plats): Marcus rå-dump (18 punkter) triagerad A/B/C/D — klass A
  (design) → K2 på `/hem?variant=k2` (kod `d0001bd`): headern bort,
  adaptiv nav (vänstermeny ≥lg per Material 3, verklig TabBar <lg —
  web-förankrat svar på versions-frågan: EN responsiv app), "Hej
  Lotta" utan !, Mina sidor-knapp, versal-etiketter, Nästa event
  kursnamn/ort/långdatum/dagar-kvar/platser, Obetalda bara siffran,
  scrollbar lista + event-pill, aktivitets-mock nedtill höger,
  version i menybotten; klass B (7 byggkrav, inkl. ÖPPEN REVIDERING
  av G1 beslut a: rad → eventsidan) bokförda för T65-kortet; klass C
  (5 shell-spår, inkl. scrollbar-gutter-kortkandidaten) + klass D
  (Mina sidor-ytan, xAPI→Fas 6.5) registrerade. K1-regressionen GRÖN
  (baslinjen intakt). **NÄSTA: Marcus jämför K1↔K2 i webbläsaren**
  (`localhost:5173/hem?variant=k2`, ←/→) → nästa iterationsvarv.
- [x] **K2 UNDERKÄND → K3 LEVERERAD** (2026-07-06, Del 4 kanonisk
  plats): Marcus 10-punkts-feedback åtgärdad punkt för punkt (kod
  `e3a68a3`): en innehållskolumn (640==640 mät-assertat), tabbar-
  kapseln flippad vertikalt (ej sidebar), app-namnet bort (bara
  v0.1.0), aktivitetsrutan långt höger + ENDAST ≥xl (dold 390/1024
  browser-assertat; Fas 6.5-typerna i innehållet), rubriker
  text-secondary (neutral-600 ur systemet), centrerad scrollmarkör,
  pillen ersatt av event-identitet kurs·ort·datum (exempeldata öppet
  märkt), Nästa event uppstramat inom tokens, växlaren flyttad
  vänster. Processnot Del 4: 2 K2-missar mot dumpen ägda +
  arbetsregeln punkt-för-punkt-verifiering mot rå-dump före leverans
  (skörd-kandidat). **NÄSTA: Marcus granskar K3**
  (`localhost:5173/hem?variant=k3`) → nästa varv eller designlåsning.
- [x] **K3-feedbacken (6 p) → K4 LEVERERAD** (2026-07-06, Del 5
  kanonisk plats; kod `a348816`): kolumnen ALLTID skärm-centrerad
  (720==720 assertat), menyn = tabbarens exakta mått flippade (568 px
  assertat; pill fyller cellen; NÄRA innehållet), aktivitetsloggen →
  subtil live-logg med AKTÖR (Lotta/Roger/Marcus; inga ikoner;
  bottenlinjerad diff 0 assertat; dold <xl), kortrubriker
  accent-KOPPAR (annan färg, ~5,9:1), anmälningslistan per FK
  IMG_1539 (tre-radiga rader + "Anmäld 6 juli" + chevron), eventkortet
  oförändrat (godkänt). Checklista-regeln tillämpad: varje punkt
  avprickad mot assertion. CI-incidenten på K4-pushen (osorterade
  klasser; lokal grind pipe-maskerad — L235-egen-instans,
  skörd-datapunkt) rättad samma varv: fix `60c9fd2`, run 28825318696
  grön per jobb inkl. Test+Build. **NÄSTA: Marcus granskar K4**
  (`localhost:5173/hem?variant=k4`) → nästa varv eller designlåsning.
- [x] **K4-feedbacken (8 p) → K5 + rubrikfärgs-ROTORSAKEN** (2026-07-07,
  Del 6 kanonisk plats; kod `ab68b9f`, run 28826675421 grön per jobb
  inkl. Test+Build): base.css h1–h6-regeln (OLAGRAD) slog alla
  rubrikfärgs-klasser i K3/K4 — computed-assertat; prototyp-fix inline
  token-style + NYTT byggkrav (@layer base-flytt). Rubriker per FK
  IMG_1538 (sentence case, ljusgrå #898989 RENDERAT-assertat; koppar
  förkastad mot referensen), menyn K1-måtten flippade (60×568,
  topplinjerad 56==56), innehållet nedflyttat, appnamn+version
  återställt, relativ tid + chevron bort på raderna, aktivitetsloggen
  chromeless vit utan punkt, koppar-kontur på anmälningskortet
  (fokus-test). Metodfynd-skörd-kandidat: renderad computed-style
  asserteras vid visuell feedback. **NÄSTA: Marcus granskar K5**
  (`localhost:5173/hem?variant=k5`) → nästa varv eller designlåsning.
- [x] **K5-feedbacken → K6 LEVERERAD** (2026-07-07, Del 7 kanonisk
  plats; kod `9cc898e`, run 28827805603 grön per jobb inkl.
  Test+Build): rubrikerna UT ur korten + färgen tillbaka
  (neutral-500; ljusgrå förkastad), K1-MENYN TILLBAKA (botten-
  tabbaren; vertikala förkastad), raderna i historik-teckenstorlek
  (12px==12px) + zebra-test (linjerna borta), loggen svag fyllton
  bg-subtle (vit förkastad), koppar-konturen kvar (godkänd). Allt
  computed-assertat. **NÄSTA: Marcus granskar K6**
  (`localhost:5173/hem?variant=k6`) → nästa varv eller designlåsning.
- [x] **K6-feedbacken → K7 LEVERERAD** (2026-07-07, Del 8 kanonisk
  plats; kod `464702f`, run 28828658849 grön per jobb inkl.
  Test+Build): rubrikerna IN i korten, STORA (assertat identisk stil
  med Fjärrskådning-titeln 20px/600/mörk), radstorlekarna tillbaka
  till K5 (16/14, tiden kvar 12), exempeldata-noterna bort,
  menybaren box-assertad EXAKT K1 + kolumnbredden till K1:s 600
  (K6:s 640 var den reella skillnaden). **NÄSTA: Marcus granskar K7**
  (`localhost:5173/hem?variant=k7`) → nästa varv eller designlåsning.
- [x] **K7-feedbacken → K8 LEVERERAD** (2026-07-07, Del 9 kanonisk
  plats; kod `a8fac47`, run 28829281156 grön per jobb inkl.
  Test+Build): eventnamnet ner i metagruppen (14==14, pillen
  topp-höger), historikrubriken bort + "Se all aktivitetshistorik
  ›"-länk, anmälningsrubriken inflyttad pl-2 (text-linjering 461==461
  assertat). **NÄSTA: Marcus granskar K8**
  (`localhost:5173/hem?variant=k8`) → nästa varv eller designlåsning.
- [x] **K8-feedbacken → K9: OMLADDNINGEN demonstrerad** (2026-07-07,
  Del 10 kanonisk plats; kod `7437104`, run 28829787391 grön per
  jobb inkl. Test+Build): dumpens uppdaterings-krav (B3 — bokfört men
  aldrig demonstrerat, Marcus-fångst) byggt: placeholderData +
  innehålls-blur vid omhämtning, containrar ASSERTAT stilla
  (byte-identiska boxar före/efter) + demo-knapp; anmälningsrubriken
  ut igen + koppar-utropstecken (assertade). **NÄSTA: Marcus granskar
  K9** (`localhost:5173/hem?variant=k9`, klicka "Ladda om datat") →
  nästa varv eller designlåsning.
- [x] **K9-feedbacken → K10: OSYNLIG uppdatering** (2026-07-07, Del 11
  kanonisk plats; kod `bb31a12`, run 28830229793 grön per jobb inkl.
  Test+Build): Marcus REVIDERAR dumpens blur öppet → helt osynlig
  bakgrundsuppdatering (stale-while-revalidate); all fetch-indikation
  bort; BEVIS: main-skärmdumpar FÖRE==UNDER==EFTER byte-identiska
  (cmp) med fetch-flaggan aktiv; kalla första-laddningens undantag +
  persist-cache-optionen bokförda (B3 ersatt). **NÄSTA: Marcus
  granskar K10** (`localhost:5173/hem?variant=k10`) → designlåsning
  närmar sig ("bra grund").
- [x] **DESIGNEN LÅST: K10 = FACIT** (2026-07-07, Del 12 kanonisk
  plats — Marcus-kvittens "prod-vyn ska se EXAKT likadan ut"):
  svar-fångsten komplett — facit-specen + byggkravs-slutlistan
  (B1–B7 + 2 nya) i Del 12; skärmdumps-bilagor säkrade FÖRE radering
  (`sessions/bilagor/s55-hem-konvergens/`: facit desktop+mobil +
  steg-k1–k10); T65-raden → design låst med /to-prd som nästa;
  återupplivningsväg `bb31a12`. **Prototypen RADERAD** (`8c0537f`,
  run 28830857658 grön per jobb inkl. Test+Build): K1–K10 samt
  växlaren och shell-granskningsläget bort; hem.tsx/__root.tsx/AppShell.tsx
  återställda BYTE-IDENTISKT (0 diff mot `c1dce4b` verifierat) —
  klausul iv stängd. **NÄSTA: Marcus avfyrar /session-end → därefter
  /to-prd (kortet föds ur T65, facit-specen Del 12 som input) →
  skarpt NYSKRIVET bygge genom leverans-grindarna.**
- [x] **End-passet FÖRBERETT** (2026-07-07, Del 13 kanonisk plats):
  skörden L245–L247 (alla [UNIVERSAL]: dump-som-checklista,
  renderad-verifiering, beteende-är-prototyp-materia) + hub-lyft
  K55.1–3 samma session; 4 kandidater explicit förkastade med
  bärare; BUILD-LOG S55-posten; transcript-referens Code-JSONL
  (6 717 486 byte vid end-passet); INGEN ADR (under baren, count 69).
  Intentions-grinden N vs N+1 PASSERAD (nästa arbete = NY session,
  antagen 56). **Lifecycle-flip väntar på Marcus coverage-kvittens
  (ADR-069-grinden).**
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-07): coverage-rapporten
  kvitterad; post 3 inget anmält. `lifecycle: closed` i
  stängnings-commiten. **Kvar efter stängning (Marcus-moment):
  Update-klicket i claude.ai.**

### Session 54 ✅ AVSLUTAD (2026-07-06) — MIGRERINGS-HUB-SESSION 1: kartans steg 1 + hela bunten levererade

> Scope: sessionsdok `2026-07-06-session-54.md` Del 1 (kanonisk plats):
> rigor-migreringen + lessons-hub-lyftet + hub-skill-bunten (T66 +
> invokerings-UX) + mät-apparaten/handoff-klassningen + T60.
> Kadensrad per L67 — uppdateras vid varje landning.

- [x] **Dok-födelse** (2026-07-06): sessionsdok fött (`415a360`, run
  28803186379 grön per jobb; Test+Build by-design-skippad).
- [x] **Rigor-migreringen LEVERERAD** (2026-07-06, Del 2 kanonisk
  plats): täcknings-matrisen (kartans hela Migrera-klass disk-prövad:
  8 TÄCKT + lifecycle-delen redan klar via ADR-069) + gap-stängningen
  hub `731aa9f` — code-role-discipline v1.0→v1.1 (datum-invarianten
  §1.4 + governing-verifieringen §1.5) + 3+-branschledar-kvantifieraren
  med ärlighetsklausul i hub-CLAUDE.md:s web-research-rad (levande ytan
  = symlink, mekanik-fynd bokfört i Del 2). Marcus-pushback rev
  avstå-klassningen öppet (skörd-kandidat). Steg 1-beviset för kartans
  steg 3 (retirera) är därmed på plats.
- [x] **Lessons-hub-lyftet LEVERERAT** (2026-07-06, Del 3 kanonisk
  plats): backloggen S35–S53 → hub `faf6806` — 38 [UNIVERSAL]-poster
  (L193–L222 + L234–L241) som K35.1–K53.1 under ETT samlings-H2
  (avvikelse öppet deklarerad); fidelitets-verifiering skript-buren
  (verbatim-substräng alla 38) FÖRE append; 22 stale pending-svansar
  strippade i hub-kopian; spoke-L203:s dubblettfragment rättat i
  spoke; L242 ej UNIVERSAL → kvar. Hub-lyft-skulden från S35→ är
  därmed NOLL.
- [x] **Hub-skill-bunten LEVERERAD** (2026-07-06, Del 4 kanonisk
  plats): plugin 1.10.0→1.11.0 (hub `6272336`, manifest-paret
  atomiskt per L228) — T66 prototyp-tvåfasen i prototype-skillen
  (punkterna a–c; web-förankrad Double Diamond + NN/g
  parallel+iterative) + invokerings-UX-mikrolandningen (NY
  plugin-README = laddningsvägarnas kanoniska hemvist, 5 regler).
  L55-ritualen grön (15 kataloger + README i 1.11.0-cachen;
  hub==cache; install-record 1.11.0, gitCommitSha == HEAD). T66 →
  `closed` med aktiverings-förbehåll. **OMSTART PENDING
  (Marcus-moment).**
- [x] **p.5 + p.6 LEVERERADE** (2026-07-06, Del 5 kanonisk plats,
  Marcus-kvittens på trippelförslaget): mät-apparaten — "full
  apparat" klassad ÖVERSPELAD av drift-beviset (minimiformen ÄR
  apparaten; beskrivningen → två-aktörs-ADR:n vid minting) ·
  handoff-klassningen (Decision A) bokförd LEVERERAD via T62/ADR-069,
  residualerna klassade för kartans steg 3 · T60 väg (b) exekverad
  (hub `d052ebd`: bearbetningen → research/ [54 filer], rådatan
  gitignorerad; hub-trädet HELT RENT) → T60 `closed`; minnesposten
  rensad. **HELA S54-scopet p.1–p.6 LEVERERAT.**
- [x] **End-passet FÖRBERETT** (2026-07-06, Del 6 kanonisk plats):
  L243–L244 skördade (båda [UNIVERSAL]) + hub-lyfta SAMMA session
  (K54.1–2, hub `fb52a0c`; 3 kandidater explicit förkastade med
  bärare) + BUILD-LOG S54-posten + transcript-referens Code-JSONL.
  Intentions-grinden N vs N+1 PASSERAD (nästa arbete = NY session
  55).
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-06): coverage-rapporten
  kvitterad (A); post 3 inget anmält. `lifecycle: closed` i
  stängnings-commiten. **Kvar efter stängning (Marcus-moment):
  omstarten (aktiverar 1.11.0) + Update-klicket i claude.ai.**

### Session 53 ✅ AVSLUTAD (2026-07-05) — T62: lifecycle-verbens Code-körbarhet

> Scope: sessionsdok `2026-07-05-session-53.md` Del 1 (kanonisk plats);
> grillad samsyn = Del 2 (7 beslut). Kadensrad per L67 — uppdateras
> vid varje landning. Marcus-sekvensens steg 1 (FÖRE resume av S52).

- [x] **Dok-födelse + T62-flipp** (2026-07-05): sessionsdok fött
  (`9f2edec`, run 28752512900 grön per jobb) + T62 `paused`→`active`
  med ingång → Del 1 (`bf18b61`, run 28752540221 grön per jobb).
- [x] **Grillningen till samsyn** (2026-07-05): /grill-with-docs
  (Marcus-avfyrad, CHAT-SEED (d)–(i) + forkarna (a)–(c)) → 7 beslut
  kvitterade, Del 2 (kanonisk plats): samexistens/Code kanonisk; två
  nya kataloger 13→15; description-triggade; hela
  kompletteringspaketet 2–6; coverage-Marcus-kvittens-grind före
  `closed` + designprincip (f); EN ADR-069 + Updates-noter i
  041/043/051; S53 stänger före omstarten. STEG 0-fynd: seed (d)
  delvis falsifierad (lessons-läsning TÄCKT); transcript-fyndet
  (`/mnt/transcripts/` är Chat-yta-antagande).
- [x] **Bygget LEVERERAT** (2026-07-05, Del 3 kanonisk plats): hub
  `35a6233` — paus/resume-Code-halvorna (egna kataloger, STOPPA-
  grindar per designprincip f) + start/end-kompletteringspaketet +
  manifest-paret atomiskt 1.9.0→1.10.0 (13→15 skills, L228/L55);
  L55-ritualen grön (15 kataloger i 1.10.0-cachen, nyckelfras-grep,
  byte-identitet, install-record 1.10.0; **OMSTART PENDING,
  Marcus-moment EFTER S53-end**). Spoke `e9013f7` — ADR-069 mintad +
  Updates-noter i ADR-041/043/051 + count 68→69 atomiskt
  (check-adr-count grön).
- [x] **Avslutspasset FÖRBERETT** (2026-07-05, Del 4 kanonisk plats):
  L234 skördad (+ kandidat 2 explicit förkastad — buren av ADR-069
  b5); BUILD-LOG S53-post; T62 `active`→`closed` (ADR-069-pekare +
  aktiverings-förbehåll); transcript-referens yt-beroende
  (session-JSONL, ingen export). Intentions-grinden N-vs-N+1
  PASSERAD (end är rätt verb; nästa nya session = 54).
- [x] **STÄNGD efter Marcus-kvittens** (2026-07-05): coverage-
  rapporten kvitterad; post 3-grinden FÅNGADE verkligt Chat-material
  vid första skarpa körningen → **T63** registrerad (frontend-design-
  plugin vid nästa greenfield; `e5b5ad6`, run 28754091245 grön per
  jobb) — dogfood-evidens för ADR-069. `lifecycle: closed` satt i
  stängnings-commiten. **NÄSTA: omstart (Marcus, aktiverar 1.10.0) →
  /session-resume S52 (resume-Code-halvans första-bruk) → /to-issues
  TASK-1 → /do-work + första drift-metrik-matningen → S52
  end-prövning.**

### Session 52 ✅ AVSLUTAD (2026-07-06) — UI-spårets start: TASK-1 komplett + graderings-prövningen passerad

> Scope: sessionsdok `2026-07-05-session-52.md` Del 1 (kanonisk plats).
> Kadensrad per L67 — uppdateras vid varje landning.
> **ÅTERUPPTAGEN 2026-07-06 via /session-resume (resume 2)** — andra
> pausen 2026-07-06 per ADR-051, numret 52 BEVARAT; båda paus/resume-
> cyklernas historik under sessionsdokets `## Paushistorik`-rubriker.
> Numrering re-verifierad mot disk: nästa ADR = 070, nästa lesson =
> L235, nästa tråd = T65 — handoffens värden HÖLL (inga mellansessioner
> sedan pausen). Tavlan verifierad: task-1.1 + TASK-2 Done; task-1.3
> plockbar (AC #6 prototyp A-grinden), task-1.2 plockbar, task-1.4
> blockad (←1.3), task-1.5 QA blockad (←alla, Marcus). Del 7 + efterspel
> bokförda i checklistan nedan. Marcus-sekvensens steg 1 (resume) KLART.
> **STÄNGD 2026-07-06 efter Marcus-kvittens av coverage-rapporten**
> (ADR-069-grinden; post 3 inget anmält; `lifecycle: closed` i
> stängnings-commiten). QA 11/11 (0 fynd) + TASK-1 STÄNGT (`7e64bd9`);
> end-passet `967dc08` (Del 11: graderings-prövningen PASSERAD —
> migrerings-hub-sessionerna öppnade, INGEN ADR mintad [Accepted efter
> apparat-migreringen, L241]; lessons L235–L242 + 5 kandidater explicit
> förkastade; BUILD-LOG S52-posten). **NÄSTA: NY session (nästa lediga
> nummer per disk, antagen 54) = MIGRERINGS-HUB-SESSION 1
> (Marcus-kvitterad 2026-07-06):** rigor-migreringen + T66-buntningen
> (prototyp-tvåfas-skillen) + lessons-hub-lyftet (L193–L242-klassen) +
> mät-apparaten + handoff-klassningen + invokerings-UX + T60. Därefter
> produktspåret: T65 (Hem-konvergens-passet) / nästa vy-PRD /
> TASK-3-klassning / T64-vägval / T61 (evidensgrinden uppfylld).

- [x] **AKT 0 LEVERERAD** (2026-07-05): fork 5+6-byggena per S47 Del
  13/14 LÅSTA designer → hub `9a747a1` (plugin 1.8.0→1.9.0, 11→13
  skills; manifest-klustret atomiskt per L228; prototype slash-only per
  korpusform, diagnosing-bugs modell-triggad; HITL-mallen i
  references/; DECLINE ej inbyggda; inga NÄR-rader — ej designkrav;
  L55-ritualen (a)–(e) gröna: 13 kataloger i 1.9.0-cachen,
  nyckelfras-grep 1 träff-fil vardera, byte-identitet, install-record
  1.9.0 med gitCommitSha `9a747a1`). **OMSTART PENDING
  (Marcus-moment)** — omstarts-verifiering + första /to-prd-körningen
  dirigeras EFTER omstart. Två-aktörs-ADR:n (WIP) orörd; första
  drift-metrik-matningen kommer i hel-kedje-körningen.
- [x] **Grillningen Hem-piloten LEVERERAD** (2026-07-05, omstartad
  session — 1.9.0-skills synliga): /grill-with-docs på UI-spåret →
  samsyn kvitterad ("Jag kvitterar"; datapunkt 11; 5 frågor + 2
  senior-mandat; första bild-grundade grillningen). Beslut: snitt A
  (första PRD-kortet = Hem-piloten); prototyp-pass FÖRE /to-prd
  (underform A på /hem, 3 varianter, skärpt fråga "Hur arrangeras
  Hem-innehållet inom FK-linjen?"); FK-linjen målbild (referensbilder
  `~/Desktop/fk-referens/`); fasta beslut Hej+namn / vertikal
  stapling / FK-meny; ljus bas (mörk registrerad senare-utforskning);
  grund-låset (b) kvitterat; tabbar IN + brödsmulor DEFER; L220 →
  DoD-grind "Marcus-granskning godkänd" på kortet; 3 skivor S/M/M;
  ingen ADR (under baren), ingen ORDLISTA-post. Kanonisk plats:
  sessionsdok Del 3. **NÄSTA:** referensbild-läsning (`! ls`-vägen) +
  prototyp-pass → /to-prd → /to-issues → /do-work.
- [x] **Prototyp-passet LEVERERAT** (2026-07-05): FK-referensbilderna
  flyttade in i repot (`docs/reference/fk-referens/`, 8 st + README,
  commit `0e3ed14`; Desktop-läsvägen TCC-blockerad → repo-hemvist) +
  UI-prototypen byggd per skill-kontraktet (commit `bf705f2`,
  [PROTOTYPE]-märkt): tre strukturellt olika Hem-arrangemang på
  `/hem?variant=a|b|c` (A FK-hemmet · B Siffror först · C Agenda
  först), underform A (befintlig datahämtning, read-only), flytande
  växlare ←/→, devtools gömda i granskningsläge, prod tree-shakad.
  Körbarhets-golvet grönt + alla tre browser-verifierade mot
  staging-data; CI-run 28747035719 grön per jobb (inkl. Test + Build
  — e2e-baselines opåverkade). **NÄSTA: Marcus-granskning i
  webbläsaren** (svar-fångst → Del 4) → /to-prd → /to-issues →
  /do-work.
- [x] **Svar-fångsten LEVERERAD, prototypen RADERAD** (2026-07-05):
  Marcus-granskning i browsern → svaret låst (Del 4, kanonisk plats):
  **A-skelettet vann** + C:s primär-tint på event-kortet; byggkrav:
  event-kortet helt klickbart, anmälningsrader → eventets anmälda-vy
  (G1 beslut a; eventId disk-verifierat, "Utan event"-fallback), CTA
  → "Visa alla anmälningar" mot NY global lista `/mer/anmalningar`
  (G2 beslut i — ny skiva). **Estimat 3→4 skivor (S/M/M/M).**
  Prototypen raderad per klausul (iv); route + __root återställda
  byte-identiskt (0 diff mot `8dafc9b`); vinnar-koden refererbar i
  git-historiken (`bf705f2`). Processmönster etablerat: svar-fångsten
  ÄR grillningen; justeringar = byggkrav, aldrig prototyp-iterering
  (lesson-kandidat till S52-skörden). Grillfrågor G1+G2 låsta på
  första rekommendationen. **NÄSTA: /to-prd (Marcus-moment)** →
  /to-issues → /do-work + första drift-metrik-matningen.
- [x] **REPOTS FÖRSTA SKARPA PRD-KORT PUBLICERAT** (2026-07-05):
  /to-prd → **TASK-1 "PRD: UI-uppgradering Hem-vyn"** i
  backlog-substratet (syntes ur Del 3-samsynen + Del 4-svaret; ingen
  ny intervju). Skarv-kvittensen (skillens enda avstämning) låst av
  Marcus: EN skarv — befintliga e2e-/axe-sviten (förebilder hem-,
  event-anmälda-, mer-väntelista- + shell-e2e; ingen api-/unit-skarv
  — read-only mot befintliga EF:er). Kropp: 17 användarberättelser,
  10 implementationsbeslut, 4 skivor S/M/M/M, ADR-koppling
  055/057/061/045/017/058, mörk-utforskningen + brödsmulor
  registrerade i Utanför omfattningen. DoD: 4 config-defaults +
  design-review-grinden (L220) som #5. **NÄSTA: /to-issues**
  (skivorna task-1.1–1.4 + QA-kort) → /do-work + första
  drift-metrik-matningen.
- [x] **RESUME-ÖPPNINGEN + SKIVNINGEN LEVERERADE** (2026-07-05,
  återupptagen session): tillstånds-återställningen (`045cb11`, run
  28754735768 grön per jobb; resume-Code-halvans FÖRSTA-BRUK grönt,
  ADR-069 b7) → /to-issues på TASK-1: skiv-godkännandet A/B/C kvitterat
  (snittet 4 skivor + QA; `ready-for-agent` 1–4 — design-review är
  stängningsgrind, inte mitt-i-fråga [lesson-kandidat till skörden];
  prod-namnet → T46-rad) → **task-1.1–1.5 publicerade i
  beroendeordning** (1.3←1.1, 1.4←1.3, QA←samtliga, `ready-for-human`;
  DoD-arv design-review på UI-skivorna 1.1–1.4) + T46-sektionen
  "UI-vägens prod-moment". Kanonisk plats: sessionsdok Del 6.
- [x] **FÖRSTA /do-work-KÖRNINGEN LEVERERAD: task-1.1 Done** (2026-07-06,
  Del 7 kanonisk plats): namnkällan TDD-byggd (rött→grönt bevisat;
  hermetiska hälsningstester via session-patch; staging-TEST_USER bär
  'Lotta', prod-guard höll; kod `6ef4ea8`) + FÖRSTA
  DRIFT-METRIK-MATNINGEN via --final-summary (CI-grön-första-pass: nej —
  orelaterad miljö-incident; TDD: 1 cykel; 0 defekter i kort-scope).
  **Fjärrskådnings-incidenten** hanterad per Marcus väg A: 60
  ZZ-sentinel-event markör-raderade ur staging (sviten 47 s→7,9 s;
  CI-rerun grön per jobb) + rik dokumentation (TASK-2 fynd-kort +
  ADR-060 Updates-not, `9b221d2`). Design-review-loopen fångade
  rubrik-fyndet → **AC #6 på task-1.3** (prototyp A-matchning, ingen
  'Hem'-rubrik); prototypen återupplivad ur `bf705f2` (worktree,
  localhost:5175). Skörd-kandidater: pipe-maskering 3:e punkten,
  själv-referentiell final-summary, prototyp-skärmdumpar före radering.
- [x] **EFTERSPELEN + TASK-2 LEVERERAD** (2026-07-06, Del 7-efterspel
  1–2 kanonisk plats): global-signOut-incidenten (401 på alla EF —
  skript-signOut revokerade delade testkontots sessioner; åtgärd
  logga ut/in; skörd-kandidat 4) → klassnings-praxis kvitterad (**kort
  = kan bli en commit; tråd = behöver bli ett beslut först**;
  Pocock-grundad; "Fynd:"-titel-prefix; skörd-kandidat 5 needs-triage)
  → TASK-2 omscopad + **T64 registrerad** (purge-cred-vägvalet,
  Marcus-beslut) → /do-work-körning 2: **TASK-2 Done** (`13bb905`, CI
  grön per jobb FÖRSTA passet; O(1)-fixtursökning, test:api 290 passed
  16,7 s; drift-metrik-matning 2). **NÄSTA: /do-work på task-1.3
  Hem-omskrivningen i FRISK invokering** (skill-kontraktet: ett kort
  per invokering — störst skiva, färsk kontext; AC #6
  prototyp A-grinden, referens localhost:5175) → task-1.4 → task-1.2 →
  QA-kortet (Marcus) → end-prövning.
- [x] **task-1.3 LEVERERAD: Hem på A-skelettet** (2026-07-06, Del 8
  kanonisk plats; resume 2-öppningen `27d4aea` först — numrering HÖLL):
  7 hem-komponenter NYSKRIVNA mot `bf705f2`-facit (hälsningen = h1
  [AC #6], Nästa event primär-tint + helkorts-stretched-link [AC #2],
  Obetalda antal-stort, rad-länkar + 'Utan event' [AC #3],
  helbredds-CTA; NOLL nya tokens, beslut 2) via TDD på e2e-skarven
  (RÖTT 10/13 → GRÖNT 13/13 + shell 8/8; shell-/auth-flow-assertions
  uppdaterade i samma skiva). Kod `a8afcf9`, CI-run 28785718115 grön
  per jobb FÖRSTA passet; stängning + final-summary =
  **drift-metrik-matning 3** (TDD 1 cykel, 0 defekter i kort-scope).
  Design-review godkänd på AC #6-matchen; Marcus designiteration →
  **T65** (exakt-kopia-prototyp efter TASK-1, `paused`); fynd:
  **TASK-3** (loading-state-flake, stash-belagd pre-existing,
  `b3fa9b7`). task-1.4 OBLOCKAD.
- [x] **task-1.4 LEVERERAD: samlade anmälningslistan + CTA-kopplingen**
  (2026-07-06, Del 9 kanonisk plats; T65/T66 registrerade dessförinnan,
  `455b7ca`): `AnmalningarList` på `/mer/anmalningar` (global läslista,
  senaste först, FK-kort per rad, rad-länk → anmälda-vyn + 'Utan event'
  olänkad; queryKey `registrations.all` utanför polling-scopet;
  DRY-lyft rule-of-three → `registration-display.ts`) + Mer-posten
  först + Hem-CTA → 'Visa alla anmälningar' (beslut 7). TDD RÖTT 7 →
  GRÖNT 24/24, full svit 125 passed. Kod `7f629f2`, CI-run 28789562204
  grön per jobb FÖRSTA passet; design-review godkänd; stängning +
  final-summary = **drift-metrik-matning 4**. Kvar: task-1.2
  (tabbaren) → QA-kortet oblockas.
- [x] **task-1.2 LEVERERAD: tabbaren till FK-mönstret** (2026-07-06,
  Del 10 kanonisk plats): ikon + etikett per flik (lucide,
  domänbegrepps-val; Mer = FK:s '•••') + FLYTANDE kapsel + aktiv
  bred pill i grå betonings-yta — L220-loopens FÖRSTA flervarvs-
  granskning (3 varv: kapsel → skugga bort/bred pill → NY semantisk
  token `--mm-bg-emphasized` [skivans enda; primär-tint-kollisionen
  med event-kortet]). TDD ikon-assertionen RÖTT→GRÖNT; shell 9/9;
  full svit 124 passed, alla axe-baselines 0. Kod `32776d2` +
  loop-commit `c0016a4`, CI grön per jobb båda; stängning +
  final-summary = **drift-metrik-matning 5**. Fynd: person-detail-
  loading pre-existing → TASK-3 tredje fil-instansen.
  **ALLA UI-SKIVOR DONE → QA task-1.5 OBLOCKAT (Marcus).**

### Session 51 ✅ AVSLUTAD (2026-07-05) — Övnings-ramverket: inramnings-landningen

> SCOPE LEVERERAT i sin helhet (sessionsdok Del 1–4 + BUILD-LOG S51-posten
> "Övning 2 börjar här"): besluten 1–8 exekverade via ADR-068 + dok-svepet +
> L4 restlista-reparationen; dp10 10/10. Sektionen står kvar som beslutstrail
> (kanonisk plats för de 8 kvitterade besluten).

Källa: Marcus-direktiv + kvittens 2026-07-05 (post-S50-close;
Chat-trail → säkrat via detta pass). Idé: projektets historia ramas
som övningar — dokumenteras via kanonisk källa + pekare i levande
ytor; historiska artefakter röres ALDRIG retroaktivt (ADR-023-
immutabilitet; ADR-012-precedens: provenance bevaras).

Kvitterade beslut (8):

1. Gränsen (repo-linjalen): Experimentfasen = allt före detta repo
   (Vue-appen ~/Repon/miranon-media-os + datamodell-researchen +
   conversion-plan-eran). Övning 1 = hela React-repots historia,
   session 1→50 — inkl. metodbygget (sessionsdok ~S6–9, lifecycle-
   mekaniken S10–12, Pocock-arbetssättet S47–50) som del av övningens
   berättelse: "började naken, byggde sin egen metod". Övning 2 =
   session 51 och framåt: UI + backend med det uppdaterade arbets-
   sättet; ingen app-kod ändras vid gränsen — Övning 2 tar vid där
   Övning 1 slutade.
2. Sekvens: S51 = inramnings-landningen (dp10 + bygge). S52 =
   UI-spårets start (fork 5+6 akt 0 + första hel-kedje-körningen +
   första drift-metrik-matningen).
3. ADR-numret: inramnings-ADR:n tar nästa lediga nummer (068 per
   S50-slutläge — disk-verifieras vid minting). Två-aktörs-ADR:n
   (Pocock-integrationen, WIP) är EJ hårdlåst till 068 (S47:
   "re-verifiera nästa lediga vid gradering") — tar nästa lediga vid
   sin gradering. Levande "ADR-068"-referenser döps om nummer-
   neutralt ("två-aktörs-ADR:n (WIP)") i S51-svepet.
4. Vue-repot: namnges + refereras härifrån (README-historiken,
   terminologi-posterna, ADR:n); miranon-media-os-repot självt
   röres ej.
5. Supabase-migreringen: skrivs in i byggplanen som namngiven
   SLUTFAS i Övning 2 (efter alla befintliga byggplans-delar), en
   rads beskrivning + pekare "designas i egen ADR när fasen närmar
   sig". Airtable förblir datakällan fram till dess (adapter-gränsen
   är möjliggöraren; ADR-050-staging = befintligt Supabase-fotfäste).
6. Nivå-hierarkin explicit: Experiment → Övningar → byggplanens
   faser → sessioner ("Övning" = epok-nivån ovanför fas/session).
   Bor i ADR:n + README + terminologi-posterna.
7. Lins-noten i ADR:n: ramverket infört 2026-07-05; historiska
   dokument (sessionsdok 1–50, ADR-001–067, arkiv) nämner INTE
   övningarna och läses genom linsen — frånvaron är förväntad,
   inte ett hål.
8. Terminologi-låsning: kanoniska termer "Experimentet (Vue)",
   "Övning 1", "Övning 2" — definieras på ETT ställe (exakt hemvist
   = dp10-gren: ORDLISTA.md är idag Lottas domänvärld; projekttermer
   kan behöva egen sektion/annan yta) och används konsekvent i alla
   nya dokument (BUILD-LOG:s S51-post inleder "Övning 2 börjar här").

Målytor för dok-svepet (preciseras i dp10): inramnings-ADR (kanonisk
definition + rationale + lins-not + hierarki), README (berättelsen
överst — det första en ny läsare möter), byggplan (ramrubrik
"byggplanen = Övning 2:s karta" + Supabase-slutfasen), systemet.md
§0, terminologi-hemvisten, BUILD-LOG additiv gränsnot, todo-/tråd-
huvuden. EJ: retroaktiva ändringar i stängda sessionsdok/ADR:er/arkiv.

dp10-grenar utöver besluten: Supabase-fasens fas-beteckning mot
faktisk byggplan; referens-omdöpningens exakta träffyta (grep mot
levande ytor); ev. framåt-pekare i mallar (over-engineering-vaktas).

Utfasnings-kartan (Chat-pensioneringen) BEKRÄFTAD oförändrad efter
dagens beslut: hybridläge S51–S52 → drift-metriken = evidensgrind →
migrerings-hub-sessionerna (rigor migreras först; systemet.md skrivs
om sist; arkivera-inte-radera) → två-aktörs-ADR:n Accepted →
apparat-radering. Takten ägs av Marcus; tidigareläggning möjlig vid
ren drift. Kartan bor i S47-trailen + migrerings-bunten — dupliceras
ej här.

Skörd-kandidat till S51: "post-close-beslutsfönstret" — beslut
fattade i chatt efter session-close men före nästa session-start
saknar naturlig durabilitets-kadens (datapunkt 2 efter S49-
korrigeringsnoten; prövas mot L26/L230 i S51:s skörd).

### Session 36 ✅ AVSLUTAD (2026-06-26) — Fas 6g L3 (Spara segment — repots första 6g-WRITE)

> SESSIONSGRÄNS, ej fas-avslut (Fas 6 öppen mot L4/6h) → ingen arkivering / CHANGELOG / phase-end-verify / hub-lyft (pending efter Fas 6). `lifecycle: closed` — flippat i do-confirm-passet (ADR-041). Oplanerad enabling-detour (CI-återställning, Session 35-skuld) + schema-mutation (staging+prod) + write-vertikal.

- [x] **Landning 0 — CI-grön-återställning** (`61fdc4e`) — Session 35-skuld: 4 markdownlint-fel (MD028 ADR-062-errata-separator / MD029 fällor 34-35 semantiska ID:n / MD032 segment-arkitektur). Besluts-text orörd. Enabling-detour (ADR-053-triage).
- [x] **Dok-födelse** (`4a47032`) — Session 36-doket fött (create-session-doc), `lifecycle: active`.
- [x] **L0 ADR-065** (`771297b`) — segment-regel-persistens; `App-segmentregel`-fält LÅST (väg-beslut efter STOPPA); migrations-mål; PEKAR ADR-062 b7 + T16. Count 64→65 lockstep (rot-README + decisions/README).
- [x] **Schema-mutation** (`2ed356d`) — `App-segmentregel` (multilineText) staging→prod, additivt; write-isolation empiriskt bevisad (`create_field` staging-only, prod orört); ADR-050 T2 falsifierad → additiv erratum; data-model § Segment-not. Ingen record-write.
- [x] **Write-vertikal Lager 1** (`227c6a4`) — save-segment-EF (fields server-side, allowlist-SSOT) + get-segments-EF (legacy-rad-filtrering L193) + allowlist-post (Make-fält MEDVETET utanför) + SavedSegment-schema + api-staging-test (allow/deny/anon/smoke, ADR-060); staging-deployad.
- [x] **Write-vertikal Lager 2** (`a4ef566`) — adapter saveSegment/listSegments + `queryKeys.segment` + SavedSegmentsList + SegmentBuilder spara-UI + e2e happy-path (axe 0); "Session 36"-mislabel städad.
- [x] **Securing** (denna landning) — ADR-050 ID-topologi-erratum + lessons L197–L198 + Del 2 + BUILD-LOG + todo.
- **Carry:** **T16/T34/T35/T36** `paused`; lessons **L193–L198** EJ hub-lyfta (pending efter Fas 6); **6g-EF:er STAGING-only** (compute-segment/save-segment/get-segments) — prod-deploy pending (medveten separat handling); `/arch-audit` deferrad till 6g fas-avslut (registrerad).
- **Nästa:** **NY session → Fas 6g L4 (frys/export)** — snapshot av nuvarande medlemmar till nedladdningsbar SKOOL-lista (ADR-062 beslut 4).

### Session 35 ✅ AVSLUTAD (2026-06-25) — Fas 6g L1+L2 (segment-motor + byggar-yta)

> SESSIONSGRÄNS, ej fas-avslut (Fas 6 öppen mot L3/L4/6h) → ingen arkivering / CHANGELOG / phase-end-verify / hub-lyft (pending efter Fas 6). `lifecycle: active` — flippas i do-confirm-passet (ADR-041), ej här. App-kod (L1+L2) + securing.

- [x] **6g-pre-pass** (READ-only, ej committad) — live-MCP mot prod: kontrakt låst mot data; STOPPA-fynd (snapshot 3 par ⊊ domän sju par / sex kursnamn); tre Chat-premisser falsifierade (L191-klass).
- [x] **ADR-064 + register** (`7d0e895` + `10bf75a`) — taxonomi från event-domänen + strikt närvaro-golv + ADR-062-förfining; §Kända fällor 34/35 som kravspec (ADR-063) + T16-vidgning. Count-grind grön (L190).
- [x] **L1 beräknings-motorn** (`6f94583`) — compute-segment-EF (repots första POST-läs-EF) + ren computeMembership (`_shared`, noll Airtable-import) + svars-Zod + 24 enhetstester. Consent buren, ej filtrerad.
- [x] **L1 deploy + integration** (`704cc56`) — staging-deploy via explicit `--project-ref` (T34 neutraliserad); api-staging HIT/MISS/AUTH grön; assertion-fix (email-nullbarhet). L185 båda lager.
- [x] **L2 byggar-ytan** (`7afc7e9`) — RadioGroup-primitiv + deriveTaxonomy (domän-härledd) + request-Zod + Status.ts Modalitet + computeSegment-adapter + vy/route/nav + e2e a11y (AxeBuilder 0). JOIN-nyckel teckenexakt (STOPPA-grind).
- [x] **Securing** (denna landning) — sessionsdok Del 2 + BUILD-LOG + lessons L193–L196 + governing-doc `docs/reference/segment-arkitektur.md` + todo.
- **Carry:** **T16** `paused` (utökat — register = kravspec); **T34** `paused` (prod-länkad CLI, durabel re-länk-fix kvar); T31/T35/T36 `paused`. Lessons **L193–L196** EJ hub-lyfta (pending efter Fas 6). `/arch-audit` deferrad till 6g fas-avslut (registrerad).
- **Nästa:** **NY session → Fas 6g L3 (Spara segment)** — regeln sparas (ej lagrad lista), lista över sparade segment; `field-allowlists.ts`-post + deny/allow-test tillkommer (första WRITE i 6g). Per ADR-062/064.

### Session 34 ✅ AVSLUTAD (2026-06-25) — Airtable-basen som förstklassig leverabel (ADR-063) + plan-synk; visions-synk landad på 5 ställen

> SESSIONSGRÄNS, ej fas-avslut (Fas 6 öppen) → ingen arkivering / CHANGELOG / phase-end-verify / hub-lyft (pending efter Fas 6). `lifecycle: closed`. Ren dok-/process-session — ingen app-kod, ingen Airtable-touch.

- [x] **L1 — ADR-063** (`8eeb92d`) — "Airtable-basen som förstklassig leverabel" kanoniserad + öppen rivning av ADR-062:s felpremiss via erratum (original orört) + count 62→63 på BÅDA ytor (L190).
- [x] **L2 — byggplan + lättläst** (`c1b17a0`) — post-Fas-6-milstolpe "Airtable-bas-maximering" (efter Fas 6.5, disk-skäl) + kontext-rad; estimat osatt (ej i grand-total).
- [x] **L3 — spoke-CLAUDE.md** (`13e28cc`) — visionen som upptäckbar orienterings-kontext; systemet.md ej rörd (system-mekanik ≠ app-domän).
- [x] **L4 — data-model + T16** (`e59df41`) — §Kända fällor omframad som KRAVSPEC för bas-maximeringen; #33-blockquote förfinad; ny tråd **T36** (lättläst-footer-staleness) registrerad.
- [x] **L5 — L192** (`ba87618`) — omformulerad: "register" = committad förbättrings-kravspec, ej deferra-och-glöm; [UNIVERSAL] + empiri bevarade.
- [x] **Avslut** — `/session-end` (SESSIONSGRÄNS, ej fas-avslut). Lessons-skörd EJ TILLÄMPLIGT (ingen ny generaliserbar lärdom — L190 tillämpades, L192 förfinades). `/arch-audit` EJ körd (ingen app-kod).
- **Carry:** **T36** `paused` (ny — lättläst-footer-staleness, fixas EJ denna session); T16 `paused` (nu omframat som kravspec-bärare); T34/T35 `paused`. Lessons-backlogg L185–L192 EJ hub-lyfta (pending efter Fas 6).
- **Nästa:** **NY session → Fas 6g (Segment-ytans BYGGE)** — bygg/se/spara/exportera segment, beräknat medlemskap från Deltaganden, snapshot-export (SKOOL), per ADR-062. (Multi-landning, egen session.)

### Session 33 ✅ AVSLUTAD (2026-06-25) — Fas 6e Mer-fliken levererad; L3 rescopad → Segment-yta (6g/6h) via ADR-062

> SESSIONSGRÄNS, ej fas-avslut (Fas 6 öppen) → ingen arkivering / CHANGELOG / phase-end-verify / hub-lyft (pending efter Fas 6). `lifecycle: closed`.

- [x] **L0 — doc-grund** (`32bcaaa`+`2f39a48`+`4ed6790`) — 6e-scope-lås (a–d) + 6f-formalisering + T09-fix + estimat-revidering.
- [x] **L1 — Intresserade** (get-leads): `bf82911` + `78ad1c6` + `16e328f` + `19b8f95` + `8b2d276` (T35 winback). CI-gröna.
- [x] **L2 — Maillogg** (get-mail-log): `473fcaf` + `d1ff5f6` (vy `/mer/maillogg` + e2e). CI-gröna.
- [x] **L3 — RESCOPAD** (ej byggd som "Skicka mail"): forensisk pre-pass mot live-data avtäckte att segment-byggandet låg i Make.com (ej app-nativt) → **L3 omdefinierad till Segment-yta (Fas 6g)**, beräknat medlemskap från källan (Deltaganden); mail = **Fas 6h** efter 6g. Dok-landningar: `dc07a34` (ADR-062, efter count-grind-fix från `423c440`) + `fb20b99` (byggplan 6e→Maillogg / +6g/6h / lättläst) + `500a282` (data-model §Kända fällor 31–33 Luckor A/B/C + T16-vidgning).
- [x] **Avslut** — `/session-end` (SESSIONSGRÄNS, ej fas-avslut). Lessons L185–L192 skördade. `/arch-audit` EJ körd (ingen ny app-kod denna session — rena dok-/scope-landningar).
- **Carry:** **T16 UTÖKAD** (mail-domän-backfill + Luckor A/B/C-reconciliation); **T34** `paused`; **T35** `paused` (winback). Lessons-kandidaterna (proof-gate-mot-tom L188; schema-är-hypotes L189) skördade i denna session-end.
- **Nästa:** **NY session → Fas 6g (Segment-ytans BYGGE)** — bygg/se/spara/exportera segment, beräknat medlemskap från Deltaganden, snapshot-export (SKOOL), per ADR-062. (Multi-landning, egen session.)

### Session 32 ✅ AVSLUTAD (2026-06-23) — T30-klustret LÖST: ADR-061 lokal miljö-isolation (4 pelar-landningar + cred-synk + tråd-flipp)

> SESSIONSGRÄNS, ej fas-avslut: Fas 6 öppen. Egen session (ADR-051). T30-klustret (T12/T28/T29, en rotorsak) strukturellt stängt via ADR-061.

- [x] **ADR-061 beslut** (`632389d`) — lokal miljö-isolation, tre pelare, Väg B (dev→staging interim; lokal-stack → T31). README-index + räkne-rad-bump (L180) + T31/T32 registrerade.
- [x] **Pelare 1** (`dde6d41`) — `Vite` mode-separation: committade `.env.development`/`.staging`/`.production`, dev→staging, `.env.local`-pekaren ut. Steg 0: ingen frontend-deploy finns.
- [x] **Pelare 2** (`8315d5a`) — fail-fast mode-medveten grind (keystone): ren modul `src/lib/env-coherence.ts` + `src/env.ts` (klient-runtime) + `tests/api/helpers.ts` (api-test-yta) + hermetiskt bevis-test.
- [x] **Pelare 2.5** (`eb7ae4c`) — build-tids-vägran via `vite.config.ts` (tredje grind-ytan; `loadEnv` fångar fil-fel + process.env-injektion) + ADR-061-erratum. Avtäckt av L181.
- [x] **Pelare 3** (`445b46f`) — T29 `error-context`-klartext-läcka stängd (`globalTeardown`-purge, reproducerad→bevisad); T12 → UTFALL 2 (auth 400 → cred-split bekräftad).
- [x] **Cred-synk** (ingen commit) — forensik (L183): `@miranon-admin.local` = prod-era-users (2026-05-04), kvarlämnade genom S19 (secrets-only) + S26 (URL-only). Marcus satte nya lösenord (dashboard) + synkade `.env.test` + GitHub-secrets. Code-verifiering: auth mot staging grön (user+admin), noll prod-anrop. Least-privilege hölls (L184 → T34).
- [x] **Tråd-flipp** (`7012d89`) — T12/T28/T29/T30 → `closed`; T30-kortet pekar på ADR-061; T33/T34 registrerade `paused`.
- [x] **`/session-end`** (denna landning) — sessionsdok Del 2–5 bakade; lessons L180–L184 (5× `[UNIVERSAL]`, i lessons.md + Del 3); BUILD-LOG Session 32-post; `lifecycle: closed`. EJ TILLÄMPLIGT (SESSIONSGRÄNS): phase-end-verify, arkivering, CHANGELOG, hub-lyft.
- **Carry:** T12/T28/T29/T30 `closed`; T31/T32/T33/T34 `paused`; T25 `paused`; T19 `active`. Lessons L180–L184 EJ hub-lyfta.
- **Nästa:** NY session (Fas 6 öppen).

### Session 31 ✅ AVSLUTAD (2026-06-23) — T26 e2e-flakiness STÄNGT (2 landningar) + miljö-kluster T30

> SESSIONSGRÄNS, ej fas-avslut: Fas 6 öppen mot 6e. Inga nya EF/deploy/write/kod-i-app (test- + config- + dok-ändringar). Sessionsdok sent fött (POST 0-åtgärd, L179).

- [x] **T26 Landning A — config-grind** (`910ebb9`, CI `28048711187` grön) — `playwright.config.ts`: top-level `retries: process.env.CI ? 2 : 0` + chromium-authenticated `trace` retain-on-failure→`on-first-retry` + stale projekt-räkning 7→8. CI-base-URL-fynd → **T27** (`paused`). E2E 78 passed.
- [x] **T26 Landning B — preventiv test-härdning** (`69a89f4`, CI `28050682542` grön) — repro-path blockerad (lokala creds = de facto prod-creds; kör ej mot prod) → måltesterna `page.route`-mockade = miljö-oberoende → statisk-analys-härdning: (a) `event-anmalda` manuell route-release, (b) `person-detail` aria-live-gate före `toBeFocused`, (c) `events-list` `toHaveCount(3)` före axe. Komponentkod orörd. PREVENTIV, ej trace-belagd. E2E 78 passed **noll flaky**. `error-context`-klartext-cred → **T29** (`paused`).
- [x] **T30 kluster-tråd-kort** (`5e5914b`, CI `28051877515` grön) — forensik (disk-belagd: `conversion-plan:1157-1159` `.env.local`→prod dag ett; auth.setup `fca8bfd` 2026-05-12 före staging-bygge `45c02a9` 2026-06-15; ADR-050 noll lokal-yta) visade T12/T28/T29 = tre symptom EN rotorsak. `T30-lokal-miljo-isolation.md`: rotorsak + lösningsrymd (`Vite` mode-sep / fail-fast-validering / cred-hygien). Diagnostiserar, beslutar ej.
- [x] **`/session-end`** (denna landning) — sessionsdok sent fött + Del 1–5 bakade; lessons L177–L179; BUILD-LOG Session 31-rad; T26 `paused→closed`; T27/T28/T29/T30 bekräftade; `lifecycle: closed`. EJ TILLÄMPLIGT (SESSIONSGRÄNS): phase-end-verify, arkivering, CHANGELOG, hub-lyft.
- **Carry:** T26 `closed`; T27/T28/T29 `paused`; T30 `paused` (kluster-parent T12/T28/T29); T25 `paused`; T19 `active`. Lessons L177–L179 EJ hub-lyfta.
- **Nästa:** NY session → **miljö-isolations-lösnings-session** (T30-klustret strukturellt → ADR: vilka pelare, ordning, mekanism) ELLER **Fas 6e / FULLT Fas 6 fas-avslut**.

### Session 30 ✅ AVSLUTAD (2026-06-23) — Fas 6d Hem-aggregering KLAR (L1+L2 + arch-audit ren, AVVIKELSE ingen)

> SESSIONSGRÄNS, ej fas-avslut: Fas 6 öppen mot 6e. Inga nya EF/deploy/write.

- [x] **L1 — /hem-aggregeringsvy (statisk)** (`fbffa53`, CI `28043340092` grön) — `queryKeys.dashboard` + Hem-container + Greeting + NyaAnmalningar/NastaEvent/Obetalda-cards + CTA + `DashboardCard`-skal + `useDashboardData`; router-context-DI mot befintliga read-EF (get-registrations event-lösa + get-events); 11/10/10, axe 0. Första push röd (skal-/auth-svit pinnade /hem inert) → revert `2be52f1` → STOPPA-OCH-FRÅGA Test 5 → beslut **A** → åter-applicering (`<header>`→`<div>`, h1-autofokus bort, Test 5→oinloggad väg, klass-korsläsning).
- [x] **L2 — polling/refresh + ADR-017-erratum** (`788322c`, CI `28045067055` grön) — `DASHBOARD_POLLING` (60s + bg-false + staleTime 30s + gcTime 300_000) + `<RefreshButton>`→invalidateQueries(dashboard.all); erratum additivt (Accepted orört): §3-mekanik riven (v5 focusManager + staleTime), §2→RefreshButton, §4 typo; §1/§5 orörda. Besluten B/C/D.
- [x] **Arch-audit (ADR-058)** (`028a014`, CI grön) — fem områden GODKÄNDA (i lager-oberoende, ii paritet 15==15==15, iii 0 ny EF, iv golv-JA/spekulation-NEJ, v 11/10/10). **AVVIKELSE: ingen.**
- [x] **`/session-end`** (denna landning) — lifecycle: closed, BUILD-LOG Session 30-rad, L176 `[UNIVERSAL]`, T26 bekräftad öppen, numrering-kontinuitet (nästa = 31). EJ TILLÄMPLIGT (SESSIONSGRÄNS): phase-end-verify, byggplan 6→KLAR, CHANGELOG, hub-lyft L149–L176.
- **Carry:** **T26 `paused`** (e2e-flake-klass); T25 `paused` (chunk-DRY); T19 `active` (Pass 2). Lessons L169–L176 EJ hub-lyfta (vid FULLT Fas 6 fas-avslut efter 6e).
- **Nästa:** NY session → **Fas 6e** (Mer, villkorlig) ELLER **FULLT Fas 6 fas-avslut** (phase-end-verify + CHANGELOG + hub-sync + arkivering).

### Session 26 ✅ AVSLUTAD (2026-06-22, nr 26 BEVARAT) — Fas 6c KLAR (arch-audit ren, fem områden GODKÄNDA, AVVIKELSE ingen)

> /session-resume Session 26 (nr 26 BEVARAT; ADR-051) → resume-finalisering 2026-06-22.
> Build-complete-cykeln stängd: 6c `/arch-audit` ren mot ADR-058 (fem områden GODKÄNDA,
> AVVIKELSE ingen, betyg 11/10/10 × 3 ytor) → **Fas 6c KLAR** (arkitektoniskt förstklassigt).
> SESSIONSGRÄNS, EJ fas-avslut: ingen phase-end-verify/CHANGELOG/arkivering; lessons-HUB-lyft
> PENDING (vid FULLT Fas 6 fas-avslut efter 6d). Full förlopp: sessionsdokets Del 7 + `## PAUSLÄGE`/
> `### HANDOFF`-block + Del 6. Trail: [`tasks/sessions/archive/2026-06/2026-06-20-session-26.md`](sessions/archive/2026-06/2026-06-20-session-26.md).

- [x] **Tillstånds-återställning** (`2f139c7`) — `lifecycle` paused→active + `Väntelista.Event`-supersession (T16/T19-karta: `singleLineText`-konstant, ingen T15-klass) inskriven.
- [x] **Leverabel 1 — get-registrations T15 väg-D-fix** (`29e55ed`) — record-ID-batch via `Anmälningar (länkat fält)` ersätter `buildLinkedRecordFilter`; eventId-grenen + helper-trio (get-attendance-spegel) + `byInskickadDesc`; okänt event → 404; event-lösa grenen oförändrad. Staging-fixtur seedad (event `reci2UQEPBMl3ebNl` = 3 länkade anmälningar, batch=2 multi-chunk) + EF deployad staging v9. **CI staging-conformance GRÖN (65 passed).**
- [x] **MD028-städning** (`67ca624`) — slutförde resume-landningen; CI grön-bekräftad (lärdom: deklarera ej landad på in_progress-CI; `2f139c7` var röd på markdownlint).
- [x] **Tillstånds-återställning omgång 2** (`c283ddc`) — `lifecycle` paused→active + paus-rubrik → öppen historik-form (prefix bruten så ADR-052-grinden ej fäller active-doket).
- [x] **Leverabel 2 — anmälda-vyn** (`/event/$eventId/anmalda`; kod `2f3884e`, CI-grön via `2f4443c`) — `EventRegistrations` speglar EventAttendance 11/10-a11y (väg A: status ren text, ingen primitiv); roster namn/status/ort/antal/inskickad/kontakt; print-läsbar; ingen mark-paid. Route + EventDetail-länk + `event-anmalda.staging.test.ts`. DoD: 11/10/10, **axe 0**, e2e **60 passed**.
- [x] **T24-b — CI auth-rate-limit rotorsaks-fix** (`2f4443c`, tråd `c9174be`) — api-staging-sviten loggade in 44 ggr/körning → GoTrue-429-burst (flaky CI). Nytt `api-setup`-projekt: EN login/credential + token-återanvändning (44→2). api-staging **66 passed, 0 failed** (noll 429). Idiomatisk Playwright setup+dependency.
- [x] **Leverabel 3 — väntelista** (`66f8770`/`b8057a8`/`5c89d10`) — get-waitlist global läs-EF (`NOT({Flyttad till anmälan})`, `singleLineText`-konstant event-fält → ingen T15, de facto global, createdTime desc JS-side) + adapter/schema/queryKey + staging-conformance; `/mer/vantelista`-vy + Mer-landning.
- [x] **Leverabel 4 — create-registration** (4 atomiska landningar, var CI-grön per-jobb): write-EF (`49671c4`, EventKey-lookup + Event-länk, 409 e-post+EventKey, INVARIANT idempotencyKey, Källa=Manuell, Person→A2, ADR-059) + `CreateRegistrationInput`-port + Lägg-till-modal + `useCreateRegistration` (`3c40c06`/`96af589`, axe 0, e2e 5/5) + ADR-060 sentinel-cleanup (`09ee57e`) + 6c-completion-docs (`e499a89`) + airtable-interaction.md full stamp-honest reconciliation (`9063f0c`, sant vid HEAD, elva EF:er, T15 stängd).
- [x] **6c `/arch-audit` (ADR-058, READ-ONLY) → Fas 6c KLAR** — fem fitness-områden GODKÄNDA: i lager-oberoende (port-paritet 15==15==15 inkl. nya `createRegistration`/`fetchWaitlist`, 0 kringgång, DI-switch en rad); ii swappbarhet (`dataSource` direkt-import endast kompositions-rot, dubbel-källa); iii EF-ribba 3/3 + create-registration write-allowlist (`field-allowlists.ts:57`) + deny/allow-conformance grön (T24-b); iv golv hållet i BÅDA riktningar (Supabase-stubbar = port-krav ej "ifall"; 6b chunk()-DRY ej återupprepad); v axel-betyg 11/10/10 × 3 ytor (anmälda-vyn/väntelista-vyn/Lägg-till-modalen), inga oförtjänta 11:or. **AVVIKELSE TOTALT: ingen.**
- [x] **`/session-end` (denna landning)** — lessons L169–L175 skördade (ny H2, hub-lyft PENDING), BUILD-LOG + sessionsdok Del 7 + todo bakade, chunk()-DRY → tråd **T25** (`paused`), `lifecycle: closed`. EJ TILLÄMPLIGT (SESSIONSGRÄNS): phase-end-verify, CHANGELOG-release, arkivering, lessons-HUB-lyft.
- **Carry:** **T15 STÄNGT**; **T19 `active`** (Pass 2 bredare prosa återstår); T24 `closed`; T25 `paused` (chunk()-DRY); ADR-060 sentinel-purge manuell. Lessons L169–L175 EJ hub-lyfta (hub-lyfts vid FULLT Fas 6 fas-avslut EFTER 6d).
- **Nästa:** NY session → **Fas 6d** (Hem-aggregering — bygger på 6a+6b+6c:s data-EF:er; egen arch-audit). FULLT Fas 6 fas-avslut (phase-end-verify + CHANGELOG + hub-sync + arkivering) EFTER 6d (6e villkorlig).

### Session 29 ✅ AVSLUTAD (2026-06-21) — T17 system-dok `systemet.md` LEVERERAD (kartläggning → författning → granskning → wiring)

> Ren dok-/process-session (ingen produktkod; en test-fixtur-touch). Föregår pausad
> Session 26 (6c ej återupptaget). SESSIONSGRÄNS, ej fas-avslut → ingen arkivering
> (ADR-023), ingen CHANGELOG-release. Trail:
> [`tasks/sessions/archive/2026-06/2026-06-21-session-29.md`](sessions/archive/2026-06/2026-06-21-session-29.md).
> Lessons L165–L168 (`[UNIVERSAL]`), hub-lyft pending.

- [x] **Dok-födelse + tråd-flip** (`39abd35`) — sessionsdok fött, T17 `paused`→`active`.
- [x] **Pass 0 / 1a / 1b** (read-only kartläggning, ej committad) — konstitutions-/identitets-kärnan + mekanik-kroppen (templates + 5 disciplin-skills + governing/distributions-mekanik) kartlagda över båda träd (hub + spoke).
- [x] **Pass 2 — författning** (`1462a12`) — [`docs/reference/systemet.md`](../docs/reference/systemet.md), 10 sektioner + öppnings-ruta, färskhets-kontrakt ([STABIL MEKANIK] vs [AKTUELLT TILLSTÅND]), fil:rad-evidens inline; T22 (hub-reconciliation) registrerad.
- [x] **Rättelse #1** (`3d8292a`) — kall granskning fångade 6 fynd (F1–F7): §0 ordlista, fångst-rater omklassade [STABIL MEKANIK]→[AKTUELLT TILLSTÅND] (F5, farliga riktningen), skill-medlemskap likaså, ADR-länkar; + §4.5 arbetscykel-vinjett; + governing-wiring (`.frontmatter-policy.conf` 11→12, fixtur-bump) + per-session-DoD-rad (CONTRIBUTING, mekanism-triggad).
- [x] **Rättelse #2** (`afac99b`) — två precisions-fixar: färskhets-exemplet siffer-löst; §6 kapabilitets-skill-ägare disk-belagt korrekt ("Claude Code-skills", ej "Chat/Code").
- [x] **Pekar-wiring** (`2f0ae23`) — on-demand-pekare till systemet.md i spoke-CLAUDE.md (`## Instruktioner`) + PI-delta. Chat-ytan kräver Marcus PI-omklistring.
- **systemet.md governing (12/12), DoD-bundet (mekanism-triggad), upptäckbart i båda orienterings-ytor.** Trådar T22 + T23 (mekanisera fixtur-koppling) registrerade. Tre Chat-premisser falsifierade mot disk (fångst-arkitektur-validering, L168).
- **Nästa-session-ordning:** **/session-resume Session 26 → 6c-bygget** (T17 var FÖRE 6c i Marcus-ordningen — nu klar; 6c är nästa i kön, på reconcilerat schema + T19/T17-kartor).

### Session 28 ✅ AVSLUTAD (2026-06-21) — T19 app↔Airtable-interaktions-dok LEVERERAD (författning → granskning → rättelse)

> Ren dok-/process-session (ingen produktkod; en test-fixtur-touch). Föregår pausad
> Session 26 (6c ej återupptaget). SESSIONSGRÄNS, ej fas-avslut → ingen arkivering
> (ADR-023), ingen CHANGELOG-release. Trail:
> [`tasks/sessions/archive/2026-06/2026-06-21-session-28.md`](sessions/archive/2026-06/2026-06-21-session-28.md).
> Lessons L162–L164 (`[UNIVERSAL]`), hub-lyft pending.

- [x] **Pass 0** — orientering + komplett interaktions-inventering (9 EF + _shared); sessionsdok fött `346c386`.
- [x] **Landning A** — författade [`docs/reference/airtable-interaction.md`](../docs/reference/airtable-interaction.md) (`f2a7118`), 11 sektioner, fil:rad-belagt mot `346c386`, färskhets-kontrakt (STABIL MEKANIK vs AKTUELLT TILLSTÅND).
- [x] **Landning B** — governing-registrering (`.frontmatter-policy.conf`, nu 11 docs) + data-model EF-pekare live + T19 tråd `active` (`e3e50dd`); test-fixtur-fix för 11:e governing-doc (`cd46bee`).
- [x] **Landning C (Session 28)** — T21 vidgad till båda synkade reference-doken + färsk C1-drift-siffra (hur-systemet-funkar.md: kopia ~19 dagar/24 rader stale) (`84561ad`).
- [x] **Pass 2 + rättelse** — kall extern granskning fångade 4 fynd; rättade (`d866347`): §9 get-waitlist (`Väntelista.Event` = singleLineText-konstant, ej länkfält → ingen T15; öppen design-fråga återställd), get-person T15-över-attribuering, §6 källkod-vs-deploy. CONTRIBUTING DoD-rad för T19-doket (`ab75169`).
- [x] **Sista dok-touch** (`d645745`) — `data-model:221` brand-värde-fix ("Medveten Kontakt" → live-verifierat "Psionautics"; event/brand-förväxling klargjord) + T19 §9-berikning (väntelista de facto global) + T21-not brand/event-kontext.
- **T19 kvar `active`** — §9 (create-registration / get-waitlist / get-registrations-fix) fylls av 6c-bygget; doket är Pass-2-rent som föreskrivande karta tills dess.
- **Nästa-session-ordning** (Marcus-beslutad, kvar från Session 27): **1. T17** (system-/arbetssätts-dok, EFTER T19) → **2. /session-resume Session 26 → 6c-bygget** (på reconcilerat schema + T19-karta).

### Session 27 ✅ AVSLUTAD (2026-06-21) — T16 data-model reconciliation (a) + dok-synk-rutin (b); T16 STÄNGT

> Ren dok-/process-session (ingen kod, inget nytt ADR). Föregår pausad Session 26 (6c ej
> återupptaget). SESSIONSGRÄNS, ej fas-avslut → ingen arkivering (ADR-023). Trail:
> [`tasks/sessions/archive/2026-06/2026-06-21-session-27.md`](sessions/archive/2026-06/2026-06-21-session-27.md).
> Lessons L155–L161 (`[UNIVERSAL]` utom L161), hub-lyft pending.

- [x] **PI-interaktionsregel i hub** (`0212282`, marcus-system) — "inga klick-formulär" alltid-på meta-disciplin i `project-instructions-base.md`. Källa-vs-yta: kräver omklistring i varje spokes claude.ai-PI-ruta.
- [x] **T16 (a) reconciliation** — Pass 1 forensik (1 MCP-anrop; **Hink 1 tom** — doket ljög ej om schemat, "kända" Event(ID)-felet bor i research-doket ej data-model.md) + Pass 2 Commit A `41345e9` (stämpel, deadline-omramning, Lucka 7 STÄNGD, Person-lookup, död synk-pekare path-fix) + Commit B `40431c4` (EF-sektion −200 rader psionautics-EF → T19-pekare, avduplicering).
- [x] **T16 (b) avsluts-rutin** (`0dd1aa1`) — villkorad data-model-uppdaterings-rad i CONTRIBUTING per-session-DoD, parallell med constraints-raden. **T16 STÄNGT.**
- **T19 / T20 / T21** registrerade (paused) — `d652bdf` (T19 interaktions-dok + T20 hook-scope-lucka), `4cc9fb9` (T21 cross-repo psionautics-synk-drift). T21 knuten till T19 + Marcus psionautics-synk-moment.
- **Nästa-session-ordning** (Marcus-beslutad): **1. T19** (app↔Airtable-interaktions-dok — EGEN session, FÖRE 6c; kartan behövs av första write-flödet) → **2. T17** (system-/arbetssätts-dok — EFTER T19, sätter/refererar gränsen) → **3. /session-resume Session 26 → 6c-bygget** (på reconcilerat schema + T19-karta).

### Session 25 ✅ AVSLUTAD (2026-06-20) — Inc 4 (kall arch-audit mot Fas 6a) + Fas 6b Events-domän KLAR

> Inc 4 + tre 6b-landningar + arch-audit, allt CI-grönt. SESSIONSGRÄNS, ej fas-avslut
> (Fas 6 fortsätter 6c–6e). Trail:
> [`tasks/sessions/archive/2026-06/2026-06-20-session-25.md`](sessions/archive/2026-06/2026-06-20-session-25.md).
> Lessons L151–L154 `[UNIVERSAL]` (hub-lyft pending, samma kö som L149–L150).

- [x] **Inc 4** (2026-06-20) — kall `/arch-audit` mot Fas 6a: fem områden rena, 11/10/10,
  dogfood-validerad (14=fritext-räknefel/disk=15), ADR-058-kontraktet bekräftat. (Bockad i
  Session 24-sektionen där raden föddes.)
- [x] **Fas 6b L1** — route-struktur C1 (nested `/event/$eventId/` info+betalning+narvaro) +
  /event-lista (beläggning-text, sort-a11y, aria-live) + spec-reconciliering. T14 registrerad.
- [x] **Fas 6b L2** — get-event-EF (single-get-mall, 404-kontrakt) + staging-deploy + info-vy
  (EventDetail, a11y 11/10) + **NaN-coercion-klassfix** (`scalarNumber` i get-event+get-events,
  L152). Commits `8fadfac`/`6d4220a`/`6b379df`.
- [x] **Fas 6b L3** — get-attendance-EF + närvaro-vy (sessions-grupperad LÄS-vy, a11y 11/10) +
  namn-batch (VÄGVAL A, Personer.Namn) + AttendanceSchema `personNamn`. **Filter-fix väg D**
  (record-ID-batch från event-hållet via `Närvaro (records)`; kringgår T15-klassbugg). Commits
  `0e688a4`/`e8ff852`/`c3fa0d5`/`2ee7a7d`/`c09a67f` + fix `ffbe3e0`/`5f10c9a`/`4642482`.
- [x] **Fas 6b arch-audit** (kall, ADR-058) — fem områden GODKÄNDA, 0 avvikelse, 11/10/10;
  T15-inhägnad + NaN-fix mekaniskt verifierade; `chunk()`-duplicering noterad som framtida
  DRY-trigger (ej avvikelse). **Fas 6b KLAR.**
- **T14 + T15** registrerade (paused) — adresseras i Fas 6c (T15 get-registrations-fix; T14
  temporal-terminologi).
- **Nästa: Session 26 → Fas 6c** (Registrations + Väntelista).

### Session 24 ✅ AVSLUTAD (2026-06-20) — Institutionalisera kvalitetsstandard + arkitektur-fitness-audit (hub-nivå)

> Inc 1–3b landade (kvalitetshållning→hub, ADR-057 fitness-invariant + drift-fixar,
> arch-audit skill-par + ADR-058, plugin 4→5 v1.4.0). Inc 4 deferrad till Session 25.
> SESSIONSGRÄNS, ej fas-avslut (Fas 6 fortsätter 6b). Trail:
> [`tasks/sessions/archive/2026-06/2026-06-20-session-24.md`](sessions/archive/2026-06/2026-06-20-session-24.md). Lessons L149–L150.

- [x] **Inc 1** (2026-06-20) — kvalitetshållning → alltid-på-lagret. base-PI ny sektion
  `KVALITETSHÅLLNING — ALLTID-PÅ` + hub-CLAUDE +2 punkter (över-engineering-vakt + lager-
  oberoende). Hub-commit `ac72925`. (Hub saknar CI — se **T13**.)
- [x] **Inc 2** (2026-06-20) — fitness-kontrakt + drift-fixar. **ADR-057** lager-oberoende-
  invariant (`4811410`, räkning 56→57); CONTRIBUTING-axel, SECURITY §6.10 per-EF-checklista
  och KVALITETSDEFINITIONER status-not (`2f69013`); **T13** registrerad (`578db2b`). CI-grönt.
- [x] **Inc 3a** (2026-06-20) — audit-mekanism + Code-side verifierare. **ADR-058**
  (`ae5c627`, räkning 57→58); `arch-audit`-skill i hub-pluginet (`e17438b`, plugin 4→5,
  v1.3.0→1.4.0, re-install disk-verifierad). Fem fitness-områden mot ADR-057+§6.10+
  KVALITETSDEFINITIONER. Verifierare + betygsättare, fixar ej kod.
- [x] **Inc 3b** (2026-06-20) — Chat-yt-skill `arch-audit` (hub `claude-app-skills/`,
  `d482493`); par till Code-halvan komplett. Befintligt handoff-kontrakt räcker (inget nytt).
- [x] **Inc 4 (2026-06-20, Session 25)** — kall `/arch-audit` mot Fas 6a: fem områden rena
  (i–v GODKÄNDA, noll avvikelse), betyg 11/10/10 på vy-ribban, dogfood-validerad
  (14=fritext-räknefel / disk=15), ADR-058-kontraktet bekräftat. Inget ADR-059 påkallat.

#### Öppna trådar / uppföljning från Session 24

- [ ] **Lesson→grind (ADR-039, L149):** gör markdownlint till mekanisk pre-commit-grind i
  spoken så MD004-klassen blir omöjlig att committa (radstart-`+` slank förbi till CI två
  ggr: `e2b4a3b`/`21601a8`). DISTINKT scope, egen omsorg — verifiera att den ej bryter
  befintliga frontmatter-pre-commit-hooken (samverkan, ej ersättning). Ej denna session.
- **T13** (register): hub-repot saknar CI/docs-grindar — öppen fråga CI-värde vs över-
  engineering → Marcus.

### Session 23 ✅ AVSLUTAD (2026-06-19) — Fas 6a Persons-domän KLAR — Landning 1–6 (cursor-port → write Anteckningar)

> Pausad 2026-06-19 via `/session-paus` (ADR-051/052, **inte** avslut: nummer 23 behålls, ingen
> finalisering) — återupptas som **session 23** via `/session-resume` i färsk chatt. Trail:
> [`tasks/sessions/archive/2026-06/2026-06-18-session-23.md`](sessions/archive/2026-06/2026-06-18-session-23.md) § PAUSLÄGE
> (NULÄGE + CARRY + öppna trådar + nästa steg). Nästa: **Landning 6** (write `Personer.Anteckningar`)
> — sista landningen i Fas 6a; lös Synk-gate-2-status för Anteckningar vid resume.

- [x] **K0 sessionsdok fött** (`623116a`), `lifecycle: active`.
- [x] **Landning 1 — BYGGPLAN-LÄTTLÄST-v3-driftfix** (`b29ace9`, CI-grön run `27769296754`):
  Gunilla-dokumentet låg ett fas-steg efter byggplan.md; speglade Fas 5-avslutets mönster.
  §5/§6/§7-strukturdrift flaggad → **T09**.
- [x] **Steg 0 + Landning 2 — Personer-lista** (T09 `3db9a07`; feature `de210ba`, CI-grön run
  `27771672331`): `/personer` wirad till `fetchPersons` via router-context-DI (ADR-055);
  kolumnval mot faktisk PersonSchema; nuqs `?q`/`?page` + klient-slice (defekt flaggad); 4 e2e + axe 0.
- [x] **ADR-056 — list-paginerings-port (cursor, dubbel-källa)** (`9868326`, CI-grön run
  `27773817942`): skriven **Proposed** → Marcus Gate-2. README 55→56.
- [x] **Steg 0 + Landning 3 — cursor-port end-to-end** (ADR-flip `e2e026c`; T10 `d1dfdd7`;
  T11 `d77a111`; cursor-port `83f55f9`, CI-grön run `27775247396`): ADR-056 **Accepted**;
  opak cursor-codec, `fetchAirtablePage` (ETT anrop/sida), `listPersons`-port, `useInfiniteQuery`
  med "Ladda fler" (a11y 11/10); STATE-STRATEGY §2/§3 reconcilierad; T10/T11 registrerade.
- [x] **Landning 4** — staging-deploy av cursor-EF (`get-persons` v4 ACTIVE) + port-conformance-
  batteri mot riktig staging-data. **KLAR** (CI run `27783202181` grön).
  - steg 1: deploy via bare CLI (v3→v4 ACTIVE), carry-secrets verifierade satta.
  - steg 3: 5 permanenta syntetiska fixtur-records seedade (väg A, käll-fält, ingen PII; bas-nivå write bekräftad); återanvändbar `cursor-conformance.ts`-harness + skarp `get-persons.staging.test.ts` → **API staging 42 passed** (+1 conformance, skarpt mot live-EF). Sid-sekvens [2,2,1], opak cursor verifierad.
- [x] **Landning 5 (detaljvy + get-person)** — KLAR & körnings-bevisad (CI run `27810425110`).
  - L5a (2026-06-18): aggregerande get-person (single-get-mall + 404-kontrakt, batch-historik ur Deltaganden) + full-historik-detaljvy (a11y 11/10) + PersonDetailSchema + person-detail-e2e (mock); P1–P4-förfining (chunkad historik, fel-kontrakt, concurrency, namnlös-titel).
  - L5b (2026-06-19): get-person deployad staging (ACTIVE v4) + skarp conformance (5 fall, **noll-trunkering bevisad** mot historik-fixtur över chunk-gräns, HISTORY_BATCH_SIZE=2). Skarp data avslöjade + fixade 2 buggar (403→null, rollup-array-coercion). **API staging 47 passed.**
- [x] **Gräns-coercion-klassen ("Ort")** (2026-06-19) — KLAR & skarp-bevisad (CI `27812371727`). Kanonisk `_shared/coerce` (scalarString/stringArray/selectName, namngiven efter aritet; selectName 4→1); ort+allaHamtningar → string[] (data-förlust-regression stängd); klass-regressionstest + multi-värd fixtur (2 orter); get-person v5 + get-persons v6. **Tråd-kandidaten (get-persons Ort-array-risk) STÄNGD.**
- [x] **Landning 6 (Fas 6a SISTA)** (2026-06-19) — write `Personer.Anteckningar`, alla CI-gröna. L6a server-op `update-person-note` (`15efaec`); staging-redeploy update-record v4→v5; L6b staging deny/allow mot v5 = S5-bevis (`c80dbb8`, API staging 49→**51**); L6c klient edit-in-place + `useUpdatePersonNote` optimistic + a11y (`4f89cbb`, E2E 30→**34**). Egen oversight: L6c:s glesa axe-mock avslöjade pre-existerande L5a `<p>`-i-`<dl>`-bugg → revert `b9b473c` → fix `6ceda61` → återland `4f89cbb`. **T12** registrerad (`.env.test`→prod). Lesson-kandidat **L144** [UNIVERSAL]. **→ Fas 6a KLAR; återstår fas-avslut + hub-sync (L140–L144) vid session-END.**

#### Öppna trådar från Session 23 (i registret — se [`tasks/threads/README.md`](threads/README.md))

- [ ] **T09** BYGGPLAN-LÄTTLÄST-v3 legibility-svep + klarspråks-paginerings-förklaring (`paused`).
- [ ] **T10** dubbel-källa-conformance + paritets-grind, Fas E (`paused`).
- [ ] **T11** Proposed i `decisions/README` §Format status-enum (`paused`).

### Session 22 ✅ KLAR (2026-06-17) — Fas 5.5 K2 klient-UI → **Fas 5.5 KLAR** (Landning 1 + 2 + 3)

> `/session-end` + phase-end-verify körd; `lifecycle: closed`. **Fas 5.5 markerad KLAR** (byggplan
> §2/§4 v1.11, CHANGELOG 0.7.0, README). Lessons L137–L139 skördade (hub-lyft pending nästa K-sista).
> Arkivering av sessionsdok 16–22 = öppen Marcus-beslut (oarkiverad backlog, ej fas-avslut-arkiverad
> historiskt). Trail: [`tasks/sessions/archive/2026-06/2026-06-17-session-22.md`](sessions/archive/2026-06/2026-06-17-session-22.md).

- [x] **Sessionsdok fött** (`b5ff420`), `lifecycle: active`.
- [x] **Enabling-detour Landning 1 — CI-rotorsak-fix** (`6610d6d`, CI-grön run `27699101873`): `fetch-depth: 250 → 0` (full historik) atomiskt över ADR-039:s 6 bärare; **ADR-054** (Accepted); ADR-029/030/039-errata; T10/T11b frikopplade; **tråd T08** registrerad (avveckla apparaten). Rotorsak: finit djup var anti-mönstret (brast 4 ggr); dok-commit sköt shallow-fönstret 263→264 → 3 orörda governing-docs föll på falsk drift.
- [x] **Landning 2 — K2 klient-UI** (`5006e7b`→`bfc6cf1`, CI-grön run `27706856446`): **ADR-055** (datakälla-åtkomst via router-context-DI, README 54→55); DI-wiring (`dataSource.ts` + `useDataSource()`); typad `EdgeFunctionError` (requestId); `queryKeys`; `markRegistrationPaid` (ADR-016 A–F optimistic); `RegistrationsList` + `MarkPaidButton`; route `event/$eventId`; 3 e2e (`page.route`-gate, DoD 1/5/6/7/8). Foundation-push rött på markdownlint MD028 → fix `bfc6cf1`.
- [x] **Landning 3 — legibility-fix** (`31b2846`, CI-grön run `27708305559`): förtydligat ADR-055:s avvisade alternativ 2 (namnkrock `useDataSource`) + hook-kommentar; ej beslutsändring.
- [x] **/session-end + phase-end-verify** körd — Fas 5.5 ✅ KLAR (byggplan §2/§4 v1.11, CHANGELOG 0.7.0, README, decisions/README ADR-55); lessons L137–L139; `lifecycle: closed`. Trådar T08/T03 registrerade (T10/T11b = tester, ej trådar). **Öppet (Marcus-beslut):** arkivering av oarkiverad sessionsdok-backlog 16–22.

### Session 21 ✅ KLAR (2026-06-14) — tråd-arkitektur (ADR-053, process-fundament)

- [x] **K1 ADR-053** tråd-arkitektur (forensisk läsbarhet + inkodad triage); MEDIUM-på-MINIMAL — `c811a2c`.
- [x] **K2** tråd-register `tasks/threads/` + T01-dogfood-migration (tvåstegs-commit, historik bevarad) — `3e035f5` + `2fba5f6`.
- [x] **K3** lifecycle-grind utvidgad till tråd-kort + CI-täckning (`tasks/threads/`), 16/16 test — `4a0e419`.
- [x] **K4** alltid-på triage-mikroregel (CLAUDE.md + PI-delta) — `ccde82b`.
- [x] **K5** tråd-konventioner formaliserade (`[T<NN>]`-tagg + `Tråd:`-header + `tråd:`-fält) — `e434bc8`.
- [x] **K-sista** lessons L126–L131 + BUILD-LOG + denna todo + sessionsdok Del 2+.
- [ ] **/session-end** ej körd än — Session 21 förblir `lifecycle: active` tills dess (ADR-041).

#### Öppna trådar från Session 21 (i registret — se [`tasks/threads/README.md`](threads/README.md))

- [ ] **T02** project-instructions/ CI-täckningsgap (`paused`) — registret äger beskrivningen.
- [ ] **T03** Session 20 BUILD-LOG-backfill (`paused`, do-confirm-glapp) — registret äger beskrivningen.

### Session 19 ✅ (2026-06-13) — staging-miljö design + förarbete

- [x] **ADR-050** isolerad staging-miljö (Pro Supabase + dedikerad Airtable-bas) — `1f9d5b4` + grindfix `8445f75`.
- [x] **Förarbete steg 1** env-driven `AIRTABLE_BASE_ID` (fail-fast) + tabell per namn i 4 EF:er — `49267b4`.
- [x] **Förarbete steg 2** fail-closed prod-deploy-allowlist (`.prod-functions-allowlist.conf` + `scripts/deploy-prod-functions.sh` + test-svit + CI-steg) — `009a8d1`. Lessons L114–L118.
- [x] **Marcus miljö-moment:** Supabase Pro + staging-projekt (`miranon-media-admin-staging`, AWS eu-west-1, Micro) + Airtable staging-bas ("Miranon Media OS - staging", utan records, samma workspace).
- [x] **Bygg-steg 3 (resume-19, 2026-06-14)** empirisk läsning + schema-check (ADR-050 T4) **CLEAN**: staging-bas `apphjj8Q7lkXCMsL4` ("miranon-media-admin-staging"), 18 tabeller, scope ren (exakt 1 bas). EF-tabellerna Eventplanering/Personer/Anmälningar finns alla i staging (namn-portabelt per `49267b4`). Landnings-post: sessionsdok-19 Del 2.
- [x] **Bygg-steg 4 (resume-19, 2026-06-14)** staging-secrets satta mot ref `pqtshyierkdgwdnxuirz` (Supabase-dokumenterad `--env-file`): `AIRTABLE_TOKEN` + `ADMIN_EMAILS` (via fil) + `AIRTABLE_BASE_ID=apphjj8Q7lkXCMsL4` (inline). Verifierade via `secrets list` (digest). Throwaway-fil raderad. (Secret-set ej committbart → sessionsdok-19 Del 2 ÄR landnings-posten, L67.)
- [x] **Bygg-steg 5 (resume-19, 2026-06-14)** 6 EF:er deployade till staging-ref `pqtshyierkdgwdnxuirz` via **bare CLI** (`supabase functions deploy`) — ADR-050 steg 5 GOVERNING (alla 6 inkl `test-auth`). Prod-allowlist-skriptet EJ använt (PROD-spärr, exkluderar test-auth). Alla `ACTIVE` v1; test-auth nåbar (401 från egen requireUser-logik, ej 404). PROD orört. Migrations ej tillämpligt (L115). Landnings-post: sessionsdok-19 Del 2.
- [x] **Bygg-steg 6 (resume-19, 2026-06-15)** 6 CI-test-secrets repointade mot staging via `gh secret set --env-file` (väg b — Marcus skapade 2 staging-auth-users); `ADMIN_EMAILS` = test-admin. Live-verifierat CI: 40 passed/1 skipped, inga 401 → users↔secrets bekräftade. Landnings-post: sessionsdok-19 Del 2.
- [x] **Bygg-steg 7a (resume-19, 2026-06-15)** `CORS_ALLOWED_ORIGINS=http://localhost:5173` satt på staging; deny-tester (rad 56/83) av-skippade — `ac9f842`. CI: cors.staging + 4 redo-filer gröna.
- [x] **Bygg-steg 7b (resume-19, 2026-06-15)** staging-access-gap löst (Airtable-token-scope utökat); syntetisk Anmälningar-rad seedad (`recynkk5KWpWirv7k`, `Anmälningsavgift='Ej mottagen'`); `TEST_REGISTRATION_RECORD_ID` wired; allow-test (rad 110) aktivt med try/finally-restore + läs-tillbaka-assert — `a63dda2`. CI: **41 passed/0 skipped**; determinism bekräftad. **ADR-050 staging-migration KOMPLETT (steg 1–7).**

#### Öppna trådar från Session 19 (bär in i resume av session 19, efter session 20)

- [x] **KRITISK post-merge (1) LÖST (resume-19 ÅTGÄRD 2, 2026-06-14):** `AIRTABLE_BASE_ID` satt som **prod-secret** mot ref `lvjsfnphlauldxqlncpl` (verifierad digest `a0652ca6…`). Prod-EF:erna fail-fast:ar inte längre på saknat fält vid nästa redeploy. (Secret-set ej committbart → denna rad + resume-rapporten är spåret; prod-secret-landningen har ingen egen sessionsdok-post.)
- [ ] **KRITISK post-merge (2):** prod-deploy hädanefter ENDAST via `scripts/deploy-prod-functions.sh --project-ref <ref>` — aldrig bare `supabase functions deploy`.
- [x] **ADR-050 öppna trådar — T1–T3 LÖSTA:** T1 LÖST (Pro). T2 LÖST (bas-ID `apphjj8Q7lkXCMsL4` läst empiriskt, bygg-steg 3). T3 LÖST (namn-i-path bekräftat + implementerat).
- [ ] **ADR-050 T4 — schema-sync-disciplin staging↔prod (kadens + mekanism) FORTSATT ÖPPEN:** point-in-time-matchen verifierad (bygg-steg 3 schema-check CLEAN), men den **löpande** sync-disciplinen kvarstår — staging saknar migrations, Airtable saknar schema-migration, så kadens/mekanism för att hålla baserna i synk över tid behöver detaljeras (ADR-050 T4). Kandidat för tråd-registret om den växer.
- [x] **Airtable-PAT mot staging-basen:** skapad av Marcus + satt som staging-secret `AIRTABLE_TOKEN` (ref `pqtshyierkdgwdnxuirz`, digest `9e7d54ee…`) i bygg-steg 4.
- [x] **De 3 skippade testerna** (`update-record.staging.test.ts` rad 56/83/110) **AKTIVERADE** (bygg-steg 7a deny 56/83, 7b allow 110) — staging-svit 41 passed/0 skipped.

#### Resume av Session 19 — bygg-steg 5–7 (KLARA)

- [x] **Bygg-steg 5–7 KLARA** (se KLAR-raderna ovan): deploy → secrets-repoint → CORS + deny → seed + allow. ADR-050 staging-migration komplett.
- [x] **`CORS_ALLOWED_ORIGINS`** satt på staging (`http://localhost:5173`, bygg-steg 7a) — cors.staging grön.
- [x] **`SUPABASE_*`-familjen — bekräftad plattforms-auto:** staging-projektet auto-fick egna (syns i `secrets list` efter deploy). Ingen manuell åtgärd, som förutsett.
- [ ] **`VITE_SENTRY_DSN` — optional (frontend):** ej satt på staging; sätt endast om staging-Sentry önskas (ej blockerande).

### Session 18 ⏸ PAUSAD (2026-06-13) — Fas 5.5 server-kontrakt (K1)

- [x] **Operation registrerad + ADR** ✅ committat: `mark-registration-fee-paid`
  → `{ tableId 'tbloOcrppVoyrHbrq', allowedFields ['Anmälningsavgift'] }`
  (`59a5281`); ADR-049 fält-val (`1c7e469`); ADR-016 dubbel-erratum;
  README-räkning 48→49; forward-fix efter rött CI (`2108dd6`); CI grön
  run 27463660822. Lessons L110–L113. Trail:
  [`tasks/sessions/archive/2026-06/2026-06-13-session-18.md`](sessions/archive/2026-06/2026-06-13-session-18.md).

#### Öppna trådar från Session 18

- [x] **(1) Fas 5.5 staging-blockeraren LÖST** — isolerad staging byggd (ADR-050 komplett, resume-19). Kvar är bara K2 klient-UI, som återupptas i ny session (ej längre staging-blockerad).
- [x] **(2) EF `update-record` deployad till staging** (bygg-steg 5) → deny-skippen (rad 56/83, 7a) + allow-skippen (rad 110, 7b) aktiverade. Staging-svit 41 passed/0 skipped.
- [x] **(3) STAGING==PRODUKTION-defekten STRUKTURELLT STÄNGD** — separat staging-Supabase-projekt + dedikerad Airtable-bas byggda; test-infran pekar nu på riktig isolerad staging (bygg-steg 6). L110-klassen stängd.
- [x] **(4) Allow-testet kör nu säkert** (ADR-049 Öppen tråd 2): mot seedad syntetisk staging-post med try/finally-restore — rör aldrig prod-records (löst av riktig staging + teardown).
- [x] **(5) BESLUT byggt:** riktig staging-miljö (ADR-050) levererad och verifierad.
- [ ] **(6) Byggplan-DoD-flaggor** (byggplan ej ändrad): "1 allow-test" deferrad;
  "förbjuden roll" bör preciseras till "anonym → 401". Åtgärdas vid nästa
  byggplan-revision.
- [ ] **(7) Supabase CLI-uppgradering** 2.75.0 → 2.106.0 (mindre; deploy-steget
  kördes aldrig).

### Session 17 ✅ KLAR (2026-06-13) — repo-hygien + synk-horisont

- [x] **Repo-hygien + synk-horisont** ✅ (mellanfas, ingen byggfas).
  Advisory-incident GHSA-gv7w hanterad per ADR-028 (allowlist + expiry,
  `9429336`); flyttar tasks-direktiv/logs/datamodell-research/analysis →
  arkivrötterna (`f343db3`/`39fe4ba`/`43648af`/`4550886`); ADR-048
  synk-horisont + pekar-paket (`bd3957d`/`5dc43e5`/`89b2d4e`); K6-audit
  → K7: sessionsdok in i lint-scope + grindvakts-testsviter in i CI
  (`cced32d`/`49ebbdb`, run 27449167933). K5: synken 91 % → 64 %.
  Lessons L103–L109. Trail:
  [`tasks/sessions/2026-06-13-session-17.md`](sessions/2026-06-13-session-17.md).

### Öppna trådar från Session 17

- [x] **Riv allowlist-posten GHSA-gv7w-rqvm-qjhr** ✅ (2026-07-19, S70
  dependabot-passet): sluttillståndet nått STARKARE än villkoret —
  esbuild HELT ute ur trädet (`npm ls esbuild` tomt; vite 8-erans
  deps-bumpar drog beroendet), npm audit 0 träffar; posten riven ur
  `audit-ci.jsonc` (historik-kommentar kvar per K0åh-formen) + audit-ci
  lokalt PASSED utan varning. [S70]
- [ ] **Hub-ärende (Marcus STOPPA-val A, Session 17):** marcus-system har två
  ospårade kataloger (`odoo-events-transcripts-openai/`,
  `youtube-transcripts/`) — granska + besluta committa/flytta/ignorera i en
  hub-session.
- [ ] **Vid A-track/status-unifiering:** pröva om "Tillägg Fråga 1"-substansen
  i `docs/archive/Code-verification-of-codex-analysis.md` ska lyftas till
  spec/ADR så att byggplan-DoD-guardens pekare kan pensioneras.
- [ ] **Vid Fas 6-avslut (ADR-048 p.3 + K6 Del 2):** exkludera
  `docs/research/` ur projektkunskaps-synken (Marcus-moment) + arkivera
  `vue-project-analysis.md` och `react-*-research` till `docs/archive/`
  med levande-pekar-svep. Verifierbart sluttillstånd: kataloger
  exkluderade i claude.ai + filerna under `docs/archive/` + CI grön.
- [ ] **Vid nästa innehållsrevision av `docs/specs/SPA-ARCHITECTURE-DECISION.md`:**
  överväg ADR-konvertering med Supersedes-not (K6 Del 2 gränsfall 1).
  Ingen åtgärd dessförinnan.

### Session 16 ✅ KLAR (2026-06-12) — Fas 5 App-shell + fas-avslut

- [x] **Fas 5 — App-shell** ✅ med fas-avslut. K1: ADR-047 + byggplan-DoD 4-modernisering (`6c47754`). K2: PWA-fundament — deps (`9a642c3`) + sw.ts/offline.html/manifest/ikoner/registrering (`cdbfe0e`). K3: API-caching-defer (`8137938`) + app-skal på `_authenticated` per STOPPA-utfall A (`f0d392c`). K4: två-lagers error boundaries + offline-config/indikator, Sentry.ErrorBoundary + RouteErrorFallback rivna (`7e558a3`). K5: varaktiga DoD-tester + Lighthouse-mätning (`ae049a5`+`3422e90`). K5b–d: ikon-kvalitet/maskable-geometri/rund favicon efter Marcus-omkollar (`4fea8f4`, `80a93ab`, `750be7e`). Alla Marcus-moment PASS; perf 81 accepterad mot Fynd 7-defern (ADR-047-not). Lessons L96–L102. Trail: [`tasks/sessions/2026-06-12-session-16.md`](sessions/2026-06-12-session-16.md).

### Öppna trådar från Session 16

- [ ] **Varaktigt app-boundary-test (DoD 7-noten)** — app-nivå-fallbacken är K4-ad-hoc-bevisad (temp-grepp, reverterade); ett varaktigt test kräver kontrollerat provider-fel utan skeppad trigger. Kandidat: komponent-test när vitest-infran landar (samma Gate 1-defer som no-flash-/logout-trådarna ovan).
- [ ] **Favicon-/PWA-ikon-källkonsolidering (vid behov)** — två käll-SVG:er (`miranon-logo.svg` för PWA-ikoner via `pwa-assets.config.ts`; `favicon/favicon.svg` för flik-setet via `scripts/generate-favicons.mjs`) med logotyp-skala definierad på två ställen. Konsolidera om en tredje konsument dyker upp.
- [ ] **LÄTTLÄST-skärmbild (Marcus-moment)** — `BYGGPLAN-LÄTTLÄST-v3.md` rad 58 har platshållaren "📸 Här kommer en skärmbild av appen att läggas in när Fas 5 är klar" — Fas 5 är nu klar; Marcus tar skärmbild av inloggat skal (t.ex. /hem med tab bar) och Chat/Code lägger in den.

### Session 15 ✅ KLAR (2026-06-11) — Fas 3.5 A11y-baseline + Fas 3/3.5 fas-avslut

- [x] **Fas 3.5 — A11y-baseline** ✅ + **Fas 3 DoD-stämpling + fas-avslut för båda faserna** ✅. K1: ADR-045 (a11y-runner-arkitektur: webServer-CI-måltavla, 0 violations kanonisk, Test+Build-sfären) + byggplan/checklist components-korrigeringar (`171e366` + `bdee8f8`). K2: axe-runner 7 primitiv-tester + STOPPA→beslut A (--mm-text-muted-kontrastfix, `de33f99`) + DoD 2-gate-proof (run 27337333679 RÖD på a11y-steget, PR #41 stängd utan merge). K3: /dev/patterns 5 referens-implementationer + 5 pattern-specar + port-härdad alltid-färsk a11y-server (`3f66dfb`) + docs/aria-patterns/ (`85b1052`). K4: aria-errormessage-forensik + Marcus VoiceOver-pass → ADR-046 wiring-rivning (`8c4a2da`+`8403040`+`4914955`) + checklist §5/§6-stämplar + BUILD-LOG-gate (`a5ab9a1`). Lessons L91–L94 ([UNIVERSAL], hub-synkade). Trail: [`tasks/sessions/archive/2026-06/2026-06-11-session-15.md`](sessions/archive/2026-06/2026-06-11-session-15.md).

### Öppna trådar från Session 15

- [ ] **Post-fix VoiceOver-omlyssning Input/Select** (Marcus, ej blockerande) — klassar VoiceOver/Safari-beteendet på describedby-defaulten efter ADR-046-rivningen; pre-fix-passet hörde dubbel-uppläsning, post-fix-DOM är en-vägs-verifierad. Skärmläsar-defer-beslut 2026-06-11. *Kvarstår efter Session 16: Marcus VoiceOver-pass där täckte route-announcern, inte formulärfälten — momentet hoppades.*
- [ ] **ACCESSIBILITY-CHECKLIST saknar frontmatter** — möjligt ADR-030-10-docs-list-gap (frontmatter-hooken rör inte filen); Marcus-beslut om listan ska utökas.
- [ ] **react-spectrum#7425-omprövningsvillkoret (ADR-046)** — när AT-stödet för aria-errormessage är komplett och/eller React Aria byter mekanism: ompröva wiringen uppströms i primitiverna.

### Skript-underhåll — hub-pluginets phase-end-verify (fynd från Session 15 fas-avslutet; ej blockerare)

Åtgärds-ytan är `marcus-system`-pluginets `skills/phase-end-verify/scripts/phase-end-verify.sh`; trådarna spåras här där fynden gjordes tills hub-backloggen tar över.

- [ ] **`rg` saknas på bash-PATH i Code-miljön** — skriptet kräver ripgrep men `rg` är en zsh-funktion i harness-snapshotten, inte en binär; körning krävde shim mot Claude Codes vendorerade ripgrep (`/usr/local/lib/node_modules/@anthropic-ai/claude-code/vendor/ripgrep/`). Härdningskandidat: skriptet faller tillbaka på grep eller detekterar/pekar ut binären. *Session 16-tillägg: shimmen måste även välja RÄTT arkitektur-variant — `arm64-darwin/rg` gav "Bad CPU type in executable" på Marcus x64-Mac; `x64-darwin/rg` krävs. Arkitektur-detektering (`uname -m`) hör till samma härdning.*
- [ ] **Fel argumentform gav falsk-grön arkiv-check** — sessionsdok-argumentet ska anges UTAN `.md`; med `.md` letar skriptet efter `<namn>.md.md`, hittar inget och rapporterar "✅ arkiverad" för ett o-arkiverat dok. Robusthetskandidat: arg-validering (strippa/avvisa `.md`-suffix) eller fail-högt-usage. Fångades vid omkörning med korrekta argument; skördad som L95 i `tasks/lessons.md` (hub-lyft K15.5).
- [ ] **Skriptets CLAUDE.md-check speglar äldre layout** — kommentaren "min 1 (Status)" antar fas-status i CLAUDE.md, men projekt-CLAUDE.md bär medvetet ingen fas-status sedan Session 6.7-refaktorn (byggplan §2 är sanningskällan). Underhållspost: uppdatera check/kommentar eller dokumentera kontextuellt-OK-klassningen i skillen.

### Session 14 ✅ KLAR (2026-06-11) — Fas 3 UI-primitiver byggda

- [x] **Fas 3 — UI-primitiver, bygget** ✅ Alla 6 primitiver levererade på 1 session (estimat 2): Button (`7e063ac`), Input + Select + components.css-knapptokens (`f19a262`), MessageBox + Modal + Dialog + --mm-border-field-kontrastfix (`0a70103`). ADR-044 etablerad (react-aria-components som bas + /dev/primitives-demo, `950d6b0`); KVALITETSDEF §1/§2 fyllda (`deb5538`). DoD 2/3/5 uppfyllda; **DoD 1/4 → Fas 3.5 per ADR-020 — Fas 3 stämplas KLAR först då.** K4 stängd som rapport-leverans utan commit (L85/L90). Lessons L88–L90 ([UNIVERSAL], hub-lyft pending nästa K-sista). Trail: [`tasks/sessions/archive/2026-06/2026-06-10-session-14.md`](sessions/archive/2026-06/2026-06-10-session-14.md).

### Öppna trådar från Session 14

- [ ] **DESIGN-SYSTEM-SPEC §1 intern spänning** — komponent-token-exemplen refererar primitiver (`--p-radius-lg` m.fl.) medan components.css-headern förbjuder det; kanonisk-regel-beslut behövs (K2-fynd).
- [ ] **KVALITETSDEFINITIONER-11-REACT status-blockquote** — säger "SKELETT", inaktuell efter §1/§2-fyllningen; §3–§5 kvarstår TBD (K3-fynd).
- [x] **Fas 3.5-flagga: aria-errormessage dubbel-annonsering** ✅ STÄNGD Session 15 K4 — forensik + Marcus VoiceOver-pass → ADR-046: explicit wiring riven, describedby/FieldError enda vägen. Uppföljning: post-fix-omlyssningstråden under Session 15 ovan.
- [ ] **Lesson→grind-kandidat (ADR-039-klass): markdownlint-CI-globben täcker inte `tasks/sessions/**`** — lokal körning är enda grinden för sessionsdok (K-födelse-fynd Session 14; empiriskt bekräftad Session 15 K2 MD033-slippen, L91).
- [ ] **/dev/primitives prod-räckvidd** — nås ej i prod-build (DEV-guard by design, ADR-044); om prod-demo någonsin behövs → env-flagga + ADR-korrigering (K4-analys, alternativ B — vilande). Gäller även /dev/patterns (Session 15 K3).

### Session 8 K0b — lesson→grind-uppföljning (ADR-039, öppen — pending dedikerad session)

Konkret första tillämpning av [ADR-039](../docs/decisions/ADR-039-konsistens-grindar-kadens.md) § lesson→grind-principen — punkten står öppen tills grinden finns (per L52):

- [ ] **CI-wira `test-check-frontmatter.sh` + `test-check-public-checklists.sh`.** K0b DEL 2 avtäckte att dessa två test-suiter — till skillnad från `test-vale-regression.sh` och de nya K0b-suiterna (`test-check-adr-count.sh` / `test-check-fetch-depth-invariant.sh`) — inte körs i CI. Verifiering utan mekanisk enforcement = exakt ADR-039:s lesson→grind-målklass. Sluttillstånd: båda wirade i ci.yml `lint`-jobbet (kör-varje-push, formen K0b valde), grön CI. Pre-existing inkonsistens (ej skapad av K0b) → separat commit. Spårbar via `tasks/lessons.md` L52 + ADR-039.

> **Efterhands-not (Session 9, 2026-05-29):** DEL 2 försökte CI-wira test-suiterna (commit `e25f2fe`) men reverterad (commit `fba2624`) efter att T11b exponerade pre-existing CI-only-race. T11b-fixen (`gc.auto 0` + `maintenance.auto 0` i `setup_repo()`, commit `32c953f`) ligger dormant i scriptet — verifierad mekanism + förstapartskälla mot reellt race, behållen som evidens-trail. Uppföljning ompositionerad: öppen för dedikerad lesson→grind-session där wiring + dormant-fix får full uppmärksamhet (ej Session 10-scope per L57: första-gångs-wiring är upptäcktsoperation som ändrar arbetsbörda radikalt).

### Session 9 — backlog från Session 8 K0c efterhands-verifiering ✅ KLAR (2026-05-29)

- [x] **Omdefiniera session-end-skillens roll: autonom avslutsmotor → verifierings-checklista (kandidat-ADR).**

    *Observation (Session 8 K0c efterhands-verifiering):* session-end-skillen korslästes mot Session 8:s faktiska avslut. Utfall: 13 av 15 spoke-steg var TÄCKT eller EJ TILLÄMPLIGT UTAN att Chat medvetet kört skillen — avslutsstegen utfördes för att de är internaliserade i Chat-dirigeringen, inte för att Code laddade skillen och körde den. Ett standardsteg föll (BUILD-LOG-entry, rättat efter efterhands-fyndet). En hub-checklist-item föll (Marcus-Update-påminnelse).

    *Missmatch:* session-end är arkitekterad som en Code-side discovery-skill (Code möter avslutsögonblick → laddar skill → kör 15 steg). Men i praktiken (Session 7 + Session 8, per trailen) DESIGNAR Chat avslutet och dirigerar Code steg för steg. Skillens antagna funktion (autonom motor) matchar inte dess faktiska användning (Chat bär avslutet). Detta är samma klass av fynd som hela Session 8-retrospektiven: en mekanism vars antagna funktion ≠ faktisk användning.

    *Koppling till etablerade beslut:* K8 (Session 6.7, [ADR-034](../docs/decisions/ADR-034-skill-arkitektur.md)) flyttade meta-discipliner som Chat redan utför nativt UT ur skill-mekanismen till alltid-på (CLAUDE.md / Project Instructions), eftersom de saknar ett kommando-ögonblick att triggas på. Frågan för Session 9: tillhör session-end DELVIS samma kategori? K8 visade samtidigt att session-end TRIGGAR rent (1 av 4 rena discovery-träffar) — så det är inte en description-svaghet; det är en ROLL-fråga.

    *Kandidat-riktning (ej beslutad — Session 9 researchar + avgör):* gör session-end explicit till en VERIFIERINGS-CHECKLISTA som körs MOT ett Chat-dirigerat avslut (det sista Code gör före sessionsstängning är att korsläsa avslutet mot skillen och rapportera TÄCKT / EJ TILLÄMPLIGT / SAKNAS — exakt det K0c-efterhands-verifieringen gjorde, men som STANDARD, inte efterhandstillägg). Det vänder skillens svaghet (opålitlig som autonom motor när Chat kör) till dess styrka (komplett, stabil checklista som fångar vad manuellt avslut tappar). BUILD-LOG-bortfallet i Session 8 är beviset på att checklist-rollen har värde — skillen fångade det när den användes så.

    *Scope för Session 9:* research mot (a) skillens faktiska formulering, (b) ADR-034:s klassningslogik (konstitution vs skill vs alltid-på), (c) K8-utfallet. Överlappar den redan loggade ADR-023-vs-session-end-tvetydigheten (arkivering: [ADR-023](../docs/decisions/ADR-023-sessions-arkivering.md) säger "sessionsavslut" generiskt, skillen säger "fas-avslut endast" — Session 8 K0c bekräftade att skillen vinner i praktiken, men ADR-023:s ospecifika formulering kvarstår). Harmonisera dessa samtidigt. Trolig output: en ADR som fastställer session-end:s roll + harmoniserar ADR-023.

    *Inte i scope:* att bygga om skillen på stående fot. Detta är ett arkitekturbeslut som kräver egen session-omsorg.

> **Stängning (Session 9, 2026-05-29):** ADR-041 etablerad (commit `23e8254`) + ADR-023 additiv erratum (samma commit). Session-end-skillen reframed read-do → do-confirm i hub-pluginet (commits `9725a78` skill-edit + `56684fe` plugin 1.1.1→1.2.0). Roll-arkitektur Chat/Code/Marcus etablerad i båda ytor (DEL 3 spoke `5523278` + DEL 3.5a hub `5866f68`/`1845ca9`). Full retrospektiv: `tasks/sessions/archive/2026-05/2026-05-29-session-9.md`.

### Session 10 — code-roll-disciplin (ADR-042) + session-lifecycle-arkitektur (ADR-043, Proposed) ✅ KLAR (2026-05-30)

- [x] **code-roll-disciplin** ✅ KLAR (2026-05-30) — full HUR-procedur för Code-rollens handover-protokoll, transparens-rapport-format, STOPPA-grindar som procedursteg. Designats grundläggande i Session 9 research-pass (Anthropic Agent Skills + multi-agent LLM-litteratur + Google SRE konvergerade mot explicit roll-arkitektur). Pekare finns i hub-CLAUDE.md `## Roll-arkitektur` (commit `5866f68`) och spoke `project-instructions/miranon-media-admin.md` (commit `5523278`). Levererad som **alltid-på template + konstitution-pekare (ADR-042), inte som skill**. Session 10:s FÖRSTA arbetspunkt — fundament för sömlös Fas 2.5.

> **Stängning (Session 10, 2026-05-30):** Levererad som alltid-på regel, inte skill — skill-mekanismen falsifierad för denna beteende-klass (ADR-034 p.8 + K8). Princip i hub-CLAUDE.md `## Roll-arkitektur`; full HUR i `marcus-system/templates/code-role-discipline.md`. ADR-042 (spoke `c4af8bf`) + hub-pekare (`f9d59f5`). Pluginet förblir 4 skills.

- [x] **session-lifecycle-arkitektur (ADR-043)** ✅ DESIGNAD + COMMITTAD (Proposed, 2026-05-30) — lifecycle som två-ytors skill-par: Chat-halva (claude.ai `/`-anrop) + Code-halva (plugin) bundna av handoff-kontrakt, plus Project Instructions bas/delta-mall och `create-session-doc` i session-starts Code-halva. Ger Chat-ytan lifecycle-mekanism utan discovery-beroende. Avtäckt av Session 10:s tre process-haverier (sessionsdok föddes ej vid start; todo ej landnings-uppdaterat; verifierings-disciplin feltillämpad på eget agerande). ADR-043 (commit `80f87aa`) hålls **Proposed** — ratificerad i direktion, flippas till Accepted vid första inkrementets landning. **Bygge (inkrement 1–5) → Session 11.** Lessons L66–L69 skördade ([UNIVERSAL], hub-lyft pending nästa K-sista). Sessionsdok (138 rader) backfillat från git-trail: `tasks/sessions/archive/2026-05/2026-05-30-session-10.md`.

- [ ] **Sessionsdok-skapande-skill** (Session 10+ kandidat efter code-roll-disciplin-skill) — kodifiera Session 8 + 9-mallens stabiliserade format (frontmatter + H1 + status-blockquote + `## Del N`-sektioner). K8-discovery-trigger: "skriv sessionsdok", "skapa sessionsretrospektiv". Värdet ligger i att skillen föreslår dokumentet vid FÖRSTA leverans-bit per lessons-katalogens "första klunga"-regel — inte i sessions slut (då är trötthetsdrift för stor). Inte konkurrerande med Fas 2.5; egen designsession.

### Session 11 — scope (nästa)

- [x] **ADR-043-bygge — inkrement 1 (PI bas/delta-mall)** ✅ LANDAT 2026-06-03 — hub-bas `marcus-system/templates/project-instructions-base.md` (`16a4e9f`) + spoke-delta/ADR-flip/README (`393ec9c`) per [ADR-043](../docs/decisions/ADR-043-session-lifecycle-skills-arkitektur.md) beslut 6. T1′ (lifecycle-prosa parkerad i delta, ej pekare i bas) + T2 (två-fils-paste); no-loss-diff grön. **ADR-043 Proposed → Accepted bekräftad** (run `26907015576`, commit `6a0ab9c`). Drift-/skip-gap-fixar landade separat. Se [`tasks/sessions/archive/2026-06/2026-06-02-session-11.md`](sessions/archive/2026-06/2026-06-02-session-11.md) Del 2.

- [x] **ADR-043-bygge — inkrement 2 (Code-halva: session-start + create-session-doc)** ✅ LANDAT 2026-06-05 — hub `8db2b5a` (skapande-gren i SKILL.md + `references/create-session-doc.md`, pluginets första referensfil) + `3f11ed2` (marketplace-drift-heal); plugin 1.2.0 → 1.3.0 publicerad via marketplace marcus-hub, verifierad enabled på disk (4-skill-invariant intakt). Minnes-aktivering restart-bunden i körande Code. Se [`tasks/sessions/archive/2026-06/2026-06-05-session-12.md`](sessions/archive/2026-06/2026-06-05-session-12.md) Del 2.
- [x] **ADR-043-bygge — inkrement 3 (Chat-halvor + T1′-swap)** ✅ LANDAT 2026-06-09 — tre Chat-yt-skills `claude-app-skills/session-{start,end,resume}` (hub `332eb04`), uppladdade + `/`-anropbara på claude.ai; T1′-swap fullbordad: pekare i PI-bas (hub `d7eb1e1`) + parkerad prosa raderad i delta (spoke `7c72f78`), no-loss verifierad. Re-paste av PI (bas+delta) = Marcus-moment. Se [`tasks/sessions/archive/2026-06/2026-06-05-session-12.md`](sessions/archive/2026-06/2026-06-05-session-12.md) Del 3.
- [x] **ADR-043-bygge — inkrement 4 (handoff-kontrakt)** ✅ LANDAT 2026-06-10 — hub-template `templates/chat-code-handoff-contract.md` v1.0 (hub `9b19558`): Chat→Code-direktivformatets åtta delar + spegel-tabell mot `code-role-discipline` §2/§4, kodifierad ur Session 12:s körda prompt-praxis. Se [`tasks/sessions/archive/2026-06/2026-06-05-session-12.md`](sessions/archive/2026-06/2026-06-05-session-12.md) Del 4.
- [x] **ADR-043-bygge — inkrement 5 (discovery-/dogfood-test)** ✅ LANDAT 2026-06-10 — skarp dogfood i verkliga ögonblick: `/session-resume` PASS båda halvor (rekonstruktion + read-only-dirigering, skapade inget — ADR-043 beslut 5); `/session-end` körd som Session 12-stängning; **restmoment 5c:** `/session-start` slutverifieras vid Session 13-öppning (create-session-doc-grenen föder Session 13-doket, plugin 1.3.0). ADR-043-bygget komplett (inkrement 1–5). Se [`tasks/sessions/archive/2026-06/2026-06-05-session-12.md`](sessions/archive/2026-06/2026-06-05-session-12.md) Del 5.

- [x] **Fas 2.5 — Schema-kontrakt-sync** ✅ KLAR 2026-06-10 (Session 13, klunga 1–4) — DoD 1–7 uppfyllda: Status.ts 4→6 (`fa712a6`), enum-granskning noll divergens + byggplan-path-fix (`9f5e7a9`), z.enum-hårdning + modell-smalning efter outlier-svep (`c50280a`), adapter-debt-klassning 9 metoder per A5 + EventStatus (`6b7ca56`). Synk-gate 1 stängd före fasen (Marcus-kvittens; inventering: [`docs/research/datamodell-research/09-a1-a12-synk-gate-1-inventering.md`](../docs/research/datamodell-research/09-a1-a12-synk-gate-1-inventering.md)). **Schema-frysen hävs vid fas-stängning → A1–A8 öppna för Fas B-arbete (Lotta/Roger; Marcus kommunicerar).** Trail: [`tasks/sessions/archive/2026-06/2026-06-10-session-13.md`](sessions/archive/2026-06/2026-06-10-session-13.md) Del 2–4.

- [ ] **ADR-044-kandidat — CI-länk-integritet** — täcker cache-maskering (ÖPPEN) + skip-/config-utan-revalidering (LAGADE Session 11 via `6a0ab9c`). Cache-maskering: lychee `cache-lychee-${github.sha}` + restore-keys-prefix + `--max-cache-age 1d` döljer extern länk-röta → "grön-av-cache" i stället för grön-av-verklighet. Vid författande: full options-rymd + 3+ branschledar-research (per konstitution).

- [ ] **lychee-action version-bump (v0.23.0 → v0.24+)** — i veckovis Actions-supply-chain-granskning (ADR-029), ej reaktivt. Signal: lokal lychee 0.24.2 gav 200 för airtable/travisgosselin där CI 0.23.0 gav 406/415 — version kan vara medverkande till UA-WAF-beteendet.

- [ ] **digg.se `.lycheeignore`-re-utvärdering** — i veckovis ignore-granskning. 2-instans-beslut Session 11 (persistent [TIMEOUT] på två färska fetch); ta bort om transient.

**Fas 2 ✅ KLAR 2026-05-13** — Routing + Auth komplett. Alla 8 DoD-rader stängda och empiriskt verifierade via 6-tests Playwright-regression. Defense-in-depth tre-skikt-arkitektur levererad: skikt 1 (klient-guard K3.2/K3.3) + skikt 2 (AuthError throw K3.4) + skikt 3 (server requireUser Fas A M2). Sessions 4 + 5 + 5b (arkiveras till `tasks/sessions/archive/2026-05/` i K5.8). Hub-lyft-kandidater: 7 totalt (K17 + K18 + K19 + K34 + K36 + K37 + K38) för K5.7 hub-sync.

**Session 6 ✅ KLAR 2026-05-14** — CI-optimering mellan Fas 2 och Fas 2.5. Strategi E (Vite-mönstret) etablerad per ADR-029. Empirisk verifikation: doc-only ~34s vs ~95s baseline = ~64 % besparing. Kod ~96s matchar baseline. lychee broken-link-detection etablerad. ADR-028 utvidgad till ADR-029 § Third-party Actions-policy. 17 UNIVERSAL-lessons skördade (största enskilda session-skörd); 10 hub-lyfta. Sessionsdok-trail: [`tasks/sessions/archive/2026-05/2026-05-13-ci-optimering.md`](sessions/archive/2026-05/2026-05-13-ci-optimering.md).

**Session 6.5 ✅ KLAR 2026-05-14** — Broken-links-batch-städning. 54 broken refs eliminerade (6 + 23 + 1 + 24) + 1 disciplin-utvidgning (ADR-022 kategori 4 "Frusen extern leverans"). 8 commits (6 fix + 1 revert + 1 disciplin). 15 lessons-kandidater skördade (13 [UNIVERSAL], 2 lokala). `.lycheeignore` 55 → 35 rader, 6 → 0 DEFERRED-FIX-MARKER. Sessionsdok-trail: [`tasks/sessions/archive/2026-05/2026-05-14-broken-links-cleanup.md`](sessions/archive/2026-05/2026-05-14-broken-links-cleanup.md) (arkiverad).

**Session 6.6 ✅ KLAR 2026-05-15** — Docs-grindvakter + frontmatter-policy + observations-pass. 5 CI-grindvakter etablerade (yamllint + markdownlint-cli2 + scripted-checklist-check + Vale + frontmatter-validator). Frontmatter-policy 4 fält på 9 styrande docs + pre-commit auto-bump + 5-check CI-validator (10 docs explicit lista i ADR-030 § Del 2 inkl. hub). ADR-030 etablerad och Accepted. K7.5 retroaktiv config-driven-refactor av K5 + SC2034 klass-fix polish. 15 lessons-kandidater skördade (alla [UNIVERSAL]). 2 defer-paket öppna (6.6.6 + 6.6.7; 6.6.5 ✅ KLAR 2026-05-16, se BUILD-LOG Session 6.6.5). Strategi E job-skip empirisk på post-K7.5-baseline (docs-only 36s, full-CI 88s). Sessionsdok-trail: [`tasks/sessions/archive/2026-05/2026-05-14-session-6-6.md`](sessions/archive/2026-05/2026-05-14-session-6-6.md) (arkiverad K-sista commit #3).

**Session 6.6.7 ✅ KLAR 2026-05-16** — Shellcheck-strict-grindvakt + shallow-clone-detection levererad. 17 commits (`3f025b9` → K-sista #5/#6 efter denna). ADR-033 Accepted. 12 [UNIVERSAL]-lessons (L_A-L_L). Se [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) Session 6.6.7-block.

**Session 6.6.6 ✅ KLAR 2026-05-24** — Vale-cleanup + lessons-konsolidering. K-sista-0 + K-sista-1-A–H landade (commit-trail `950aa0f` → `62d661b`). 125 lessons-kandidater konsoliderade till L15-L27 (`tasks/lessons.md` H2 "## 2026-05-23 — Session 6.6.6"); ADR-032 Accepted. Se [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) Session 6.6.6-block.

**Session 6.7 ✅ KLAR 2026-05-26** — CLAUDE.md-audit (hub 37→ refaktor 609→118; spoke 31→ refaktor 622→126) + skills-extraktion till Claude Code-plugin distribuerat via git-marketplace `marcus-hub` (inwirat i spoken, steg A–C) + checklist-trimning (K7 trim ≈ noll) + discovery-test (K8 4/6 → 2 meta-discipliner flyttade till alltid-på). ADR-034 Accepted. 10 [UNIVERSAL]-lessons (L28–L37) skördade + hub-synkade (K6.7.1–10). Audit-rubrik flyttad till `marcus-system/templates/`. Sessionsdok-trail: [`tasks/sessions/archive/2026-05/2026-05-24-session-6-7.md`](sessions/archive/2026-05/2026-05-24-session-6-7.md) (arkiverad).

**Nästa efter Session 6.7 (Strategi β):** Session 7 K0 — Fas 2 11/10-verification (7 gap-punkter committed i Session 6.5 pre-K1 som received-defer per K7; se [`docs/archive/Fas-2-11-10-verification-2026-05-14.md`](../docs/archive/Fas-2-11-10-verification-2026-05-14.md)) → Fas 2.5 Schema-kontrakt-sync (per `docs/byggplan.md` §4).

**Strategi β-rationale (post-6.6.7-leverans 2026-05-16):** quick-wins först (6.6.7 ✅ KLAR) → tungt arbete (6.6.6 ✅ KLAR) → process-mognad (6.7) → produkt-leverans (Session 7 K0 + Fas 2.5). 6.6.7-momentum levererat: shellcheck-strict 0/0/0/0 + shallow-clone-detection defense-in-depth lager 2 + 12 [UNIVERSAL]-lessons hub-konsolideringskandidater.

Sessionsdok-trail (arkiverad 2026-05-13 i K5.8): [`tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md`](sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md).

### Mini-session 6.6.6 ✅ KLAR 2026-05-24 — Vale.Terms + Miranon.VueToReact-cleanup

**Status (2026-05-24):** ✅ KLAR. K-sista-0 + K-sista-1-A till -H levererade (F = 6.7-prep-expand `1825b3e` + `762706f`, G = arkivering `d4c3620`, H = final-verifikation `62d661b`). CI grön (run 26362719206).

Vale.Terms (425) + Miranon.VueToReact (114) hanterades via Vale-config-cleanup + per-fil helfil-disable (ADR-032). **Prep-fil:** [`tasks/sessions/archive/2026-05/2026-05-14-session-6-6-6-prep.md`](sessions/archive/2026-05/2026-05-14-session-6-6-6-prep.md). **Klass:** kvalitets-fynd defererade via per-fil rad-1-disable (regression-skydd via Alt F per K1.13-utvidgning). Full trail: sessionsdok Del 8.

**Effektiv ordning (Strategi β bekräftad 2026-05-16):** Startas EFTER Session 6.6.7 — tungt fokus-arbete (~7-10h över 52 filer); momentum från 6.6.7-leverans skyddar mot avstamps-friktion. L15-L18 + L19 + ev. nya lessons skördas + bake:as in vid K-sista i ny H2 `## 2026-05-16 — Session 6.6.5 (post-K-sista #2 retroaktiva)` i `tasks/lessons.md`. Hub-sync konsolideras med 6.6.6:s egna [UNIVERSAL]-skörd.

Defer-bakgrund: K6.2 V4 bekräftade Vale 3.14.1 har INGEN `--fix`-flagga. Manuell sed-batch är osäker för 3/5 unika Vale.Terms-substitutioner (`aria`/`fk`/`vite` har hög kod-bryt-risk). Per-fil rad-1-disable valt för regression-skydd (naturlig disable-borttagning vid 6.6.6-fix).

**ADR-032 (Vale L_X.2 helfil-disable):** Accepted (K3.5, commit `2d55ea0`). Sekvens: ADR-031 (6.6.5 Dependabot) → ADR-032 (6.6.6 Vale, Accepted) → ADR-033 (6.6.7 shellcheck).

### Mini-session 6.6.7 ✅ KLAR 2026-05-16 — shellcheck-grindvakt för scripts/*.sh + .githooks/* (TOP-PRIORITY post-6.6.5 per Strategi β)

**Effektiv ordning (Strategi β bekräftad 2026-05-16):** Startas FÖRE Session 6.6.6 — quick-win (~2-3h) + bygger momentum + konsoliderar Session 6.6.5 K2.1 fetch-depth-fix med defensive-programming-lager (shallow-clone-detection integrerat i K4-scope).

Defer från Session 6.6 K7.B + K7.5.4 (SC2034 klass-blindhet). Egen ADR-trail per ADR-029 § Konvention för framtida CI-utvidgningar.

**Scope (utvidgat 2026-05-16):**

- Shellcheck-strict-mode (0 warnings + 0 errors) som CI-grindvakt för alla bash-scripts i repot. Inkluderar `scripts/*.sh`, `.githooks/*`, `.checklist-policy.conf`, `.frontmatter-policy.conf`
- ADR-033 etablering (shellcheck-strict-grindvakt + scope-definition)
- **NY från K-sista #3 Alt C-defer:** shallow-clone-detection i `scripts/check-frontmatter.sh` via `git rev-parse --is-shallow-repository`-check + gracefully Check 2-degradering
- **NY från ovan:** `scripts/test-check-frontmatter.sh` utvidgning med shallow-clone-scenario-tester
- **NY från ovan:** ADR-030 § Del 3 sub-§ "Implementations-krav på CI-miljö" kompletteras med defensive-programming-not (refererar till scripts-detection)

**Trigger (uppdaterad 2026-05-16):** TOP-PRIORITY post-Session 6.6.5 ✅ KLAR per Strategi β. **Estimat:** ~2-3h totalt (shellcheck baseline ~1-2h + shallow-clone-detection bonus ~1h, inkluderar ev. retroaktiv fix av befintliga warnings utöver SC2034-klass-fix från K7.5 polish).

**Prep-fil:** `tasks/sessions/archive/2026-05/2026-05-14-session-6-6-7-prep.md` (arkiverad K-sista #5 2026-05-16).

### Session 6.6.5 K-sista-checkpoints

- **Dependabot-side empirisk-verifikation (förväntat ~2026-05-18 per weekly schedule):** Marcus reviewar första post-K4 Dependabot-PR och bekräftar (a) grouping enligt production-deps/development-deps/stack-grupper-mönstret, (b) cooldown-filter (versioner <7d skippas, patch <3d), (c) staging-stegen visar "skipped"-status (om Dependabot-actor). Loggas i Session 6.7 K1-sessionsstart eller separat handoff-not.

- **Shallow-clone-detection-tillägg (defensive programming, Alt C-defer från Session 6.6.5 K-sista #3):** `scripts/check-frontmatter.sh` utvidgning med `git rev-parse --is-shallow-repository`-detection som degraderar Check 2 gracefully om fetch-depth-config glöms. Test-suite (`scripts/test-check-frontmatter.sh`) utvidgad med shallow-scenarier. **Allokerad till Session 6.6.7 K4 per Strategi β 2026-05-16** (tematisk match: scripts/*.sh defensive-programming-domän). Inte akut — K2.1 fetch-depth: 50-retrofit löste rotorsaken (commit `a67908d`). Detta är defense-in-depth-lager 2 + hub-portabilitets-skydd. Spårbar via `tasks/lessons.md` L8 + ADR-030 § Del 3 sub-§ "Implementations-krav på CI-miljö".

### Återkommande disciplin: Branch-protection-aktivering på main

ADR-029 § Konsekvenser planerar för manuell aktivering av branch-protection. Aggregator `ci-passed` är ready (empiriskt verifierat Session 6.6 K9 2026-05-15: 5/5 senaste runs gröna med 3-4s aggregator-step).

**Marcus-action:** GitHub Settings → Branches → main → Branch protection rule → require status check `ci-passed` (+ ev. PR-review-krav, linear history per Marcus-preferens).

**Trigger:** när som helst Marcus väljer. Inte session-blockerande. Status 2026-05-15: `gh api repos/marcus803/miranon-media-admin/branches/main/protection` returnerar HTTP 404 "Branch not protected".

**Spårbarhet:** Session 6.6 K9 K9.1 lesson (mekanism-installation ≠ aktivering) + ADR-029 § Konsekvenser-citat.

### Operativ skuld — Transcript-disciplin ej implementerad

`CONTRIBUTING.md` transcript-disciplin (sessions-transcripts till `tasks/sessions/transcripts/<datum>.txt` som sanningskälla vid sessionsavslut) är skriven men inte operativt implementerad. Session 6.5 är första session där noten explicit flaggas som process-skuld.

**Trigger för åtgärd:** vid första framtida session där Marcus får tid att sätta upp transcript-export-rutinen från Chat. Inte blocker för Session 7+ arbete, men disciplin-skuld som driver mot 9/10 ju längre den ligger.

**Källa:** Session 6.5 K-sista.4 beslut 2026-05-14.

### Session 6.5 ✅ KLAR 2026-05-14 — lychee-baseline fix-arbete (deferred från Session 6 K1.D Commit 3)

K1.D Commit 2 lychee-baseline (2026-05-14) fångade 81 broken/stale refs. Per K7 refactor/semantik-separation: CI-arkitektur ≠ content-korrekturläsning. `.lycheeignore` accepterar baseline med DEFERRED-FIX-MARKER-block; fix-arbete spåras här.

**Scope (~67 refs som ska fixas, klassade i [ADR-029 § Baseline-fynd](../docs/decisions/ADR-029-ci-architektur-changed-files-pattern.md)):**

| Kategori | Antal | Drift-typ | Fix-strategi |
|---|---|---|---|
| A.1 docs-omstrukturering (ADR-021) | ~5 unika | `docs/STATE-STRATEGY.md` → `docs/specs/STATE-STRATEGY.md` (+ DESIGN-SYSTEM-SPEC, SECURITY-SPEC, byggplan-revision-inventory, gap-analysis) | Sök-och-ersätt per refererande fil |
| A.2 KVALITETSDEFINITIONER stack-skifte (ADR-027) | ~4 träffar | `KVALITETSDEFINITIONER-11.md` → `KVALITETSDEFINITIONER-11-REACT.md` | Sök-och-ersätt |
| A.3 Sessionsdok-arkivering (ADR-023 / K5.8b) | ~2 träffar | `tasks/sessions/2026-05-11-fas2-routing-auth.md` → `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` | Sök-och-ersätt (eventuellt redan delvis fixat) |
| A.4 Cirkulär-path-bug | ~25 träffar | `docs/research/datamodell-research/06b-supabase-target.md` refererar sig själv via full absolut path från projekt-rot — bör vara hash-only `#L101` etc. | Fixa hash-link-syntax i 06b-supabase-target.md |
| B.1 docs/analysis/ path-konstruktion | ~30 träffar | `src/main.tsx` → `../src/main.tsx` (saknar ../-prefix för djup 2) | Sök-och-ersätt per fil (Codex-project-analysis.md + Code-verification-...md) |
| B.2 docs/archive/ samma bugg | ~7 träffar | Som B.1 fast i `docs/archive/`-filer | Sök-och-ersätt eller markera frozen-zon explicit |

**Per-fas-fix-procedure:**

1. Per drift-kategori: lokalisera alla refererande filer via `rg -l '<gammal-path>' docs/ tasks/`
2. Sök-och-ersätt med `sed -i ''` (macOS) eller motsvarande
3. Verifiera via `git diff` att inga oavsiktliga matches gjordes
4. Kör lokal lychee om verktyget installerats: `lychee --offline './docs/**/*.md' './tasks/*.md' './*.md'`
5. När alla kategorier fixade: ta bort motsvarande DEFERRED-FIX-MARKER-block från `.lycheeignore`
6. CI grön → Session 6.5 ✅ KLAR

**Trigger för start:** Session 6.5 kan köras separat eller integreras med Fas 2.5 / Fas 3 doc-touch. Marcus avgör tajming. Estimat: 1-2 timmar Code-tid.

**Pre-Session 6.5-not (2026-05-14, Session 6 K1.D Commit 4c):** K1.D Commit 4b empiriskt-verifierade fix av tanstack canonical-URLs i `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` (`/query` → `/query/latest`, `/table` → `/table/latest`). CI-verifikation fördröjdes av UTF-8-glob-bug i tj-actions/changed-files (svenska tecken i v3.md-filnamnet gav `should_skip_tests: false` + `docs_changed: false` — lychee kördes inte). Commit 4c (denna uppdatering) triggar ASCII-path docs-changed → lychee körs → 0 errors verifieras empiriskt. UTF-8-bugg flaggas som lessons-kandidat #17 för K-sista hub-lyft-överväganden + ev. ADR-029-appendix om mönstret är reproducerbart.

**Lessons-kandidat #14 (skördas Session 6 K-sista):** lychee + cross-doc-grep är komplementära kvalitetsverktyg — båda behövs vid fas-avslut. lychee fångar **referensdrift**; K5.9c fångar **innehållsdrift**. Generaliserbar disciplin etablerad via ADR-029 § Baseline-fynd.

### Återkommande disciplin: K0åi-trigger för pin-luckring (post-K0åh resolution 2026-05-13)

Allowlist `audit-ci.jsonc` är tom (K0åh, 2026-05-13). Exakt-pin på 5 `@tanstack/*`-paket + `overrides: { "@tanstack/history": "1.161.6" }` bevaras tills TanStack rör `latest`-dist-tag bortom 1.161.6.

- **Trigger:** Vid sessionsstart, om `npm view @tanstack/history@latest version` returnerar annan version än `1.161.6` → starta K0åi (pin-luckring `^`-prefix-återinförande + overrides-borttagning per [ADR-028](../docs/decisions/ADR-028-supply-chain-incident-respons.md) reverse-flow).
- **Senast kontrollerad:** 2026-05-13 (K0åh, returnerade `1.161.6` — pin-disciplin fortsatt motiverad)
- **K0åh resolution-detaljer:** Se [ADR-028](../docs/decisions/ADR-028-supply-chain-incident-respons.md) `## Updates` för advisory-snär-uppdaterings-spårning + reverse-flow-spec.
- **Tas bort från denna lista** när K0åi har körts (overrides + exakt-pin upplöst, post-incident state).

### Återkommande disciplin: Veckovis Actions supply-chain-granskning (ADR-029 §6)

Third-party GitHub Actions med SHA-pin granskas veckovis för:

- Nya releases (uppdatera SHA om relevant security-fix)
- Publicerade supply-chain-incidenter (typ tj-actions mars 2025)
- Withdrawn actions eller maintainer-byten

Pinned third-party Actions just nu:

- `tj-actions/changed-files@9426d40962ed5378910ee2e21d5f8c6fcbf2dd96` (v47.0.6)
- `lycheeverse/lychee-action@8646ba30535128ac92d33dfc9133794bfdd9b411` (v2.8.0)

**Senast granskad:** 2026-05-13 (ADR-029 etablering)
**Nästa granskning senast:** 2026-05-20

**Granskningssteg:**

1. `gh api repos/tj-actions/changed-files/releases/latest --jq '{tag_name, target_commitish, published_at}'`
2. `gh api repos/tj-actions/changed-files/git/refs/tags/<tag_name> --jq '.object.sha'` — verifiera att SHA matchar release-tag
3. Jämför verifierad SHA mot pinned SHA i `.github/workflows/ci.yml`
4. Om SHA skiljer: läs release-notes via `gh api repos/tj-actions/changed-files/releases/latest --jq '.body'`
5. Repetera 1-4 för `lycheeverse/lychee-action`
6. Kolla advisory-status:
   - `curl -s 'https://api.github.com/advisories?affects=tj-actions/changed-files' | jq '.[] | {ghsa_id, severity, first_patched_version, published_at}'`
   - Analysera `first_patched_version` mot vår pinned-version per K18-disciplin
   - Repetera för `lycheeverse/lychee-action`
7. Om incident med vår version aktivt sårbar: följ ADR-028 5-stegs Konvention-flöde anpassat för Actions (SHA-pin till pre-incident-version + uppgradering vid resolution)
8. Om alla rena: uppdatera "Senast granskad"-datum + "Nästa granskning senast" + commit

Se [`docs/byggplan.md`](../docs/byggplan.md) §4 Fas 2-prompten och [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) Session 2 för kontext från Fas A + Fas 0/1.

**Session-historik:**

- **Session 1 (React): 2026-04-14** — Fas 0 + Fas 1 klara. BUILD-LOG + 10 ADR:er skapade. Dokumentationsrutiner (BUILD-LOG + ADR) integrerade i CLAUDE.md sessionsstart/avslut. Commits: `fcc6de3`, `e3d8e8a`, `c91bfa0`, `680858c`.
- **Session 2 (React): 2026-04-30 → 2026-05-05** — Fas A (säkerhetshardening, M1–M8, 14 commits, 113 tester) + P0–P3a byggplan-revision (`docs/byggplan.md` 832 rader, 13 fas-prompter, 10 nya ADR:er ADR-011..ADR-020, 7 UNIVERSAL-lessons). P3b städning pågår. Se [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) Session 2 för full retrospektiv.
- **Session 3 (Pre-Fas-2-verifiering): 2026-05-06** — Repo-strukturell polish + publika professionalitetssignaler. K3 åa-åf: LICENSE + package.json metadata + .github/-paketet (CI + dependabot + templates) + CHANGELOG/SECURITY/CONTRIBUTING + README badges/Documentation map + docs/-omstrukturering (specs/analysis/reference/logs) + analys/ → docs/research/datamodell-research/ + tasks/sessions/-arkivering. 4 nya ADR:er (ADR-021..024). Trail: [`tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md`](sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md).
- **Session 4 (Fas 2 K0 startvillkor): 2026-05-11** — K0 startvillkor 1-3 av 3 klara. Två sub-faser per startvillkor där refactor/semantik kan separeras (K0åb.1+.2, K0åc.1+.2). Plus 4 K1.N early bake-ins av sessionsdoket (`6af3927` + `fc6f43e` + `3b29f41` + `3927a24`). 6 K0-commits: `13cdf86` (nuqs) + `a5a477b` + `1d02b3b` (typecheck:tests + APIResponse + @types/node) + `3015d08` + `1138e38` (CI test:api-split + STAGING_REQUIRED + 6 GitHub-secrets). CI grön på första försök efter K0åc.2 (36s, run 25663357991): 72 pure passed + 38 staging passed + 3 M4-defer skipped + 8 övriga steps. 12 UNIVERSAL-lessons lyfta till lessons.md + hub (`f1e609e` + `91db29b`). Aktiv sessionsdok-trail: [`tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md`](sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md). PÅGÅR — K0åd-K0åf "Direkt efter Fas 2"-fynd + K2 implementation återstår.
- *Session 1 (React) motsvarar Session 31 i total projekthistorik. Vue-bygget var session 1–30 i `~/Repon/miranon-media-os/`. Session 2 = Session 32–34. Session 3 = Session 35. Session 4 = Session 36.*

---

## Fas 0: Projektsetup + tokens ✅ KLAR

**Mål:** Fungerande React-projekt med alla verktyg installerade, tokens konfigurerade, lint som passerar.
**Klar:** 2026-04-14 (Session 1 (React), commit `fcc6de3`).
**Dokumentation:** [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) → Session 1 (React) → Fas 0.

### Initiering

- [x] 0. Initiera Vite-projekt (manuellt, eftersom katalogen inte var tom)

### Filer som skapas

- [x] `package.json` (alla dependencies)
- [x] `vite.config.ts` (React-plugin + `@tailwindcss/vite` — TanStack Router-plugin återinförs i Fas 2)
- [x] `tsconfig.json`
- [x] `tsconfig.app.json`
- [x] `tsconfig.node.json`
- [x] [GA] `biome.json` (Biome 2.4 — se [ADR-001](../docs/decisions/ADR-001-biome-over-eslint-stylelint-prettier.md))
- [x] `index.html`
- [x] `src/main.tsx` (minimal — renderar "Miranon Media Admin" + [GA] registrerar service worker)
- [x] `src/vite-env.d.ts` (bonus-fil för `import.meta.env`-typer)
- [x] `src/styles/tokens/primitives.css` (från DESIGN-SYSTEM-SPEC §1, bindestreck för halvsteg — se [ADR-003](../docs/decisions/ADR-003-css-custom-property-naming.md))
- [x] `src/styles/tokens/semantic.css` (från DESIGN-SYSTEM-SPEC §1)
- [x] `src/styles/tokens/components.css` (skelett)
- [x] `src/styles/base.css` (reset, fokusregel, typografi, Inter-font)
- [x] `src/styles/tailwind.css` (`@import "tailwindcss"` + `@theme`-block från DESIGN-SYSTEM-SPEC §8 — se [ADR-002](../docs/decisions/ADR-002-tailwind-v4-theme-css-first.md))
- [x] `src/lib/cn.ts` (clsx + tailwind-merge)
- [x] [GA] `src/lib/report-web-vitals.ts` (web-vitals → Sentry/sendBeacon)
- [x] [GA] `src/env.ts` (@t3-oss/env-core — validerar VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY vid uppstart)
- [x] `playwright.config.ts` (från DESIGN-SYSTEM-SPEC §6)
- [x] `.env.local` (skapad lokalt, inte committad — `.env.*` i `.gitignore`)
- [x] [GA] `public/sw.js` (tom service worker-skelett — utökas med Workbox i Fas 5)

### Verifiering

- [x] 1. `npm run dev` startar utan fel (Vite 8.0.8, redo på 320 ms)
- [x] 2. `npm run build` producerar output utan varningar (97 moduler, 244.73 kB JS / 10.83 kB CSS)
- [x] 3. `npx tsc --noEmit` — noll TypeScript-fel
- [x] 4. [GA] `npx @biomejs/biome check .` — exit=0 (4 warnings på `!important` i `prefers-reduced-motion`, accepterat)
- [x] 5. Token-CSS laddas: `--mm-primary` → `#d4960a` verifierat via grep i `dist/assets/index-*.css`
- [x] 6. Tailwind genererar utilities från `@theme`: `text-primary`, `bg-surface`, `text-text-secondary`, `text-caption`, `text-body` (1rem/line-height 1.5), `font-sans` (Inter) — alla 8 verifierade i bundled CSS
- [x] 7. [GA] Service worker registrering-kod på plats i `main.tsx`
- [x] 8. [GA] `reportWebVitals` importerbar utan fel (tsc + build passerar)
- [x] 9. [GA] Saknad env-variabel → uppstartsfel (Node-test bevisar ZodError)
- [x] 10. [GA] `npm audit --audit-level=high` — 0 high/critical

---

## Fas 1: Domäntransplant ✅ KLAR

**Mål:** Alla domain- och data-filer kopierade från Vue-repot, Zod-scheman tillagda, supabase-client konsoliderad via `@/env`, `fetchWithRetry` på infrastrukturnivå.
**Klar:** 2026-04-14 (Session 1 (React), commit `c91bfa0`).
**Dokumentation:** [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) → Session 1 (React) → Fas 1.

### Kopierade filer (src)

- [x] `src/domain/models/*.ts` (8 filer — rakt av)
- [x] `src/domain/types/*.ts` (Filters.ts, Status.ts — rakt av)
- [x] `src/data/adapters/*.ts` (DataSourceAdapter, AirtableAdapter, SupabaseAdapter — rakt av)
- [x] `src/data/config/supabase-client.ts` (modifierad — [ADR-009](../docs/decisions/ADR-009-supabase-client-env-consolidation.md) + [ADR-006](../docs/decisions/ADR-006-fetch-with-retry-infrastructure.md))
- [x] `src/lib/alert-screen-reader.ts` (kebab-case rename från `alertScreenReader.ts`)
- [x] `src/lib/focus-utils.ts` (kebab-case rename från `focusUtils.ts`)

### Kopierade filer (binaries + docs + supabase)

- [x] `public/favicon/` (7 filer)
- [x] `public/miranon-logo.svg`
- [x] `docs/` (21 filer — selektivt, ej `tasks/` eller `.claude/`, se [ADR-008](../docs/decisions/ADR-008-file-inventory-selective-run.md))
- [x] `supabase/functions/` (7 Edge Function-filer, Deno-kod)

### [GA] Skapade filer

- [x] `src/domain/schemas/*.schema.ts` (8 filer + barrel `index.ts`) — [ADR-005](../docs/decisions/ADR-005-zod-parallell-definitions.md)
- [x] `src/domain/__tests__/schemas.assignable.ts` (`AssertEqual` compile-time-test)
- [x] `src/data/utils.ts` (`fetchWithRetry`) — [ADR-006](../docs/decisions/ADR-006-fetch-with-retry-infrastructure.md)
- [x] `scripts/verify-phase-1.ts` (runtime-verifiering, 11 assertions)

### Konfigändringar

- [x] `biome.json` exkluderar `supabase/functions` — [ADR-010](../docs/decisions/ADR-010-biome-exclude-deno-edge-functions.md)

### Verifiering

- [x] `npx tsc --noEmit` — 0 fel
- [x] Testfil importerar Event, Registration, Person → resolvar (via `schemas.assignable.ts`)
- [x] `EventSchema.parse({})` → ZodError (runtime-verifierat)
- [x] TypeScript-test: 10 `AssertEqual`-asserts passerar (schema ↔ interface parity för alla domain-typer)
- [x] `fetchWithRetry`: 4 försök (1 + 3 retries), backoff 200ms/400ms/800ms ± jitter (runtime-verifierat)
- [x] `alertScreenReader('test')` → aria-live-element i DOM (runtime-verifierat via stub)
- [x] `npx @biomejs/biome check .` — exit=0
- [x] `git add -A && git commit -m "fas 1: domäntransplant"` → `c91bfa0`
- [x] `git push` → `origin/main`

---

## Fas 2: Routing + Auth ✅ KLAR

Slutförd 2026-05-13 över Sessions 4 + 5 + 5b. Alla 8 DoD-rader stängda och empiriskt verifierade via K4.3 6-tests Playwright-regression. Defense-in-depth tre-skikt-arkitektur levererad (klient-guard + AuthError throw + server requireUser). ADR-026, ADR-027, ADR-028 levererade. 7 hub-lyft-kandidater för K5.7 (K17 + K18 + K19 + K34 + K36 + K37 + K38).

Sessionsdok-trail (arkiverad 2026-05-13 i K5.8): [`tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md`](sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md).

**Fas 2.5 — Schema-kontrakt-sync ← NU** (per `docs/byggplan.md` §4)

---

## Kommande faser (från `docs/byggplan.md` §4)

- **Fas 3: UI-primitiver** — React Aria + CVA + [GA] ARIA 1.3
- **Fas 3.5: Test-infra + mönsterbibliotek** (egen fas per ADR-020)
- **Fas 5: App-shell + Tab bar** — minimal, FK-inspirerad + [GA] error boundaries, service worker, View Transitions
- **Fas 6: Hem + Event + Personer + Mer** — 4 flikar + [GA] optimistic UI, Realtime, stale-while-error
- **Fas 6.5: Aktivitetslogg** — [GA] xAPI-schema, trace_id, GDPR retention
- **Fas 7: Konsolidering** — [GA] CSP, Trusted Types, chaos testing, deploy-pipeline, Golden Master-test, Deno lint på Edge Functions
- **Fas 8 (framtid):** Passkeys, push-notifieringar, avancerad offline

---

## Byggplan-revision (P0 → P3b)

Meta-arbete parallellt med byggfaserna. Reviderade conversion-plan till byggplan baserat på Fas A-fynd, datamodell-research och Codex/Code-verifiering. Slutprodukt: `docs/byggplan.md` (P3a). P3b avslutar med städning + arkivering.

- [x] **P0 — Inventering** ✅ AVSLUTAD 2026-05-04
      Leverans: `docs/logs/byggplan-revision-inventory.md`
- [x] **P1 — Fas-sekvens-revision** ✅ AVSLUTAD 2026-05-04
      Leverans: `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md`
      §5-uppdatering applicerad i commit `5ed4668`
- [x] **P2 — Stödspec-synkning** ✅ AVSLUTAD 2026-05-04
      Leverans: `tasks/sessions/archive/2026-05/2026-05-04-stodspec-synk-p2.md`
      A1-utfall: Fas 3.5 = egen fas (test-infra + mönsterbibliotek bägge JA)
- [x] **P3a — Skriv byggplan + ADR-katalog** ✅ AVSLUTAD 2026-05-05
      Leverans: `docs/byggplan.md` (832 rader, 13 fas-prompter), 10 ADR:er (ADR-011..ADR-020), `tasks/sessions/archive/2026-05/2026-05-05-byggplan-skriv-p3a.md`
- [x] **P3b — Städning + arkivering + BUILD-LOG retrospektiv** ✅ AVSLUTAD 2026-05-05
      Leverans: `tasks/sessions/archive/2026-05/2026-05-05-byggplan-stadning-p3b.md`. 7 commits, direktivet markerat SLUTFÖRT i §11+§12, 7 UNIVERSAL-lessons lyfta till hub.
- [x] **Pre-Fas-2-verifiering — repo 11/10 inför Fas 2** ✅ AVSLUTAD 2026-05-06
      Leverans: `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md`. 4 nya ADR (ADR-021..024), docs/-omstrukturering, .github/-paketet, top-level professional docs, analys/-flyttning, tasks/sessions/-arkivering. Repo redo för Codex-verifiering + Fas 2.
      Trail: `tasks/sessions/archive/2026-05/2026-05-05-byggplan-stadning-p3b.md`
      Direktiv: `tasks/byggplan-direktiv.md` §6 P3 städnings-DoD + §12 slutnot

---

## Teknisk skuld som spåras (från Fas 0 + Fas 1)

- **Zod refaktorering:** Schema blir sanningskälla i Fas 2/3 ([ADR-005](../docs/decisions/ADR-005-zod-parallell-definitions.md))
- **Event-aliasering:** Per-fil alias i Fas 2+, global rename om 5+ filer behöver alias ([ADR-007](../docs/decisions/ADR-007-event-name-collision-deferred-aliasing.md))
- **TanStack Router-plugin:** Återinförs i Fas 2 när `src/routes/` skapas
- **CSP-nonce security headers-plugin:** Fas 7
- **Biomes `no-arbitrary-value` + `no-hardcoded-colors`:** Custom GritQL-plugins i Fas 7
- **Deno lint/check på supabase/functions:** Fas 7 ([ADR-010](../docs/decisions/ADR-010-biome-exclude-deno-edge-functions.md))
- **Schema-validering i adapter-metoder:** Fas 2 ska wrappa `callEdgeFunction`-resultat med `.parse()`
- **`lucide-react@1.8.0` versionsanomalier:** Undersök innan Fas 3 (UI-primitiver) när ikoner börjar användas
- **docs/specs/DESIGN-SYSTEM-SPEC.md stale-risk:** Governance-beslut uppskjutet efter alla faser
- **DEFER → Fas 3:** 4 CSS-warnings i `src/styles/base.css:72-75` (`!important` i `prefers-reduced-motion`). Fas 3 omarbetar `base.css` när primitiver landas — städning sker som biprodukt. Trigger: första Fas 3-session. Källa: P3b sessionsdok Del 3.4 H.1.
- **DEFER → passiv (bevakas):** PostCSS audit-fix. `npm audit` rapporterar PostCSS-relaterade transitive dependencies, inga high/critical. PostCSS uppdateras naturligt via Tailwind v4-uppgradering eller Dependabot. Trigger: om `npm audit --audit-level=high` blir röd, ELLER vid Tailwind v5-migration. Källa: P3b sessionsdok Del 3.4 H.2.
- **DEFER → Fas 7 (SPÄRR finns sedan Session 19):** `supabase/functions/test-auth/` får aldrig nå produktion. Lever idag med `verify_jwt = false` i `config.toml` — Playwright-helper för deny-paths-tester. **Mekanismen finns nu (ADR-050 steg 2):** `scripts/deploy-prod-functions.sh` + `.prod-functions-allowlist.conf` (fail-closed; test-auth prod-exkluderad by default). Återstår till Fas 7: integrera allowlisten i en CI-deploy-pipeline (idag manuell deploy-väg). Källa: P3b sessionsdok Del 3.4 H.4 + Session 19.
- **K3.4-kvalitetsklyfta (2026-05-13, deferred till Fas 3.5):** auth-error-path unit-test-mönster för `getAuthHeader()` AuthError-kontraktet. Test-fall: `callEdgeFunction` + `postEdgeFunction` med session=null → AuthError + fetchWithRetry never called. Vitest-installation hör hemma där per Gate 1-beslut 2026-05-13 (scope-creep att göra i K3.4 utan ADR — projektet är Playwright-only). Sessionsdok-trail: `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 5.9. Lyfts till Fas 3.5-prompten när Session 6+ påbörjar Fas 2.5 → 3 → 3.5-sekvensen.
- **No-flash render-gate-regressionstest (2026-05-27, Session 7 K0.2b, deferred till Fas 3.5):** deterministiskt komponent-test (vitest + @testing-library/react) för render-gaten i `src/main.tsx` `InnerApp` ([ADR-037](../docs/decisions/ADR-037-auth-resolution-render-gate.md)). Test-fall: (1) montera `InnerApp` med `useAuth()` mockad `{ isLoading: true, isAuthenticated: false }` → assertera att `<RouterProvider>` / skyddat innehåll INTE renderas, endast laddnings-UI:t (`role="status"`); (2) flippa mock till `{ isLoading: false, isAuthenticated: true }` → assertera att routern monteras. **Kontrast-krav:** testet ska FALLA mot pre-ADR-037-koden (där `<RouterProvider>` monterades omedelbart oavsett isLoading). Mock: `vi.mock('../auth/useAuth')`. Kräver vitest-infra (samma Gate 1-defer som K3.4-posten ovan). Idag bevisad strukturellt + K4.3-sviten 7/7 — E2E kan inte ge deterministiskt kontrast-bevis (sub-frame `getSession`-fönster, ingen interceptbar request för giltig stored session). Detaljerad nog att Fas 3.5 aktiverar, ej återuppfinner.
- ~~**Fel-hanterings-arkitektur-konsolidering**~~ ✅ STÄNGD Session 16 K4 (2026-06-12) — alla tre frågorna lösta i konsolideringen till exakt två fel-lager (STOPPA-utfall A via Chat): (1) `Sentry.ErrorBoundary` riven ur `__root.tsx` (near-zero unik täckning per K0.3b-empirin); (2) render-gate-ytan täcks nu av `AppErrorBoundary` (`src/main.tsx`, runt providers + router) med branded fallback; (3) capture-vägen konsoliderad till enbart createRoot-hooks (`onCaughtError`/`onUncaughtError` → Sentry) — boundaries renderar, hooks rapporterar. Sektions-lagret = `SectionError` (MessageBox-baserad) som `defaultErrorComponent`; `RouteErrorFallback` raderad. Ursprungstext bevarad nedan för spårbarhet.
  - *Ursprunglig tråd (Session 7 K0.3b, bevarad för spårbarhet):* [ADR-038](../docs/decisions/ADR-038-router-fel-defaultErrorComponent.md) löste router-fel-fallbacken (`defaultErrorComponent`) men avgränsade tre öppna frågor som hör ihop, underbyggda av K0.3b-empirin: (1) **`Sentry.ErrorBoundary`:s roll** — `defaultErrorComponent` fångar nu loader-/route-komponent-/root-route-fel, så `Sentry.ErrorBoundary` (`__root.tsx`) fångar inte längre route-fel; dess unika täckning är near-zero → behåll/omdefiniera/ta bort? (2) **Render-gate-ytan** — fel i `AuthProvider`/`InnerApp` före `<RouterProvider>` (ADR-037) ligger utanför både routerns catch och `Sentry.ErrorBoundary`; fångas bara av `createRoot onUncaughtError`, ingen branded fallback. (3) **Capture-vägs-konsolidering** — `onCaughtError` + `Sentry.ErrorBoundary` + ev. framtida `onError` → en medveten dedupe:ad strategi (K0.3b observerade ingen dubbel-rapport idag, men vägarna bör konsolideras). Trigger: efter Fas 2-fynd-stängning, lämpligen ihop med Fas 3.5-test-infran (testbar fel-hantering). Underlag: K0.3a + K0.3b sessionsdok-trail. [ADR-038](../docs/decisions/ADR-038-router-fel-defaultErrorComponent.md) löste router-fel-fallbacken (`defaultErrorComponent`) men avgränsade tre öppna frågor som hör ihop, underbyggda av K0.3b-empirin: (1) **`Sentry.ErrorBoundary`:s roll** — `defaultErrorComponent` fångar nu loader-/route-komponent-/root-route-fel, så `Sentry.ErrorBoundary` (`__root.tsx`) fångar inte längre route-fel; dess unika täckning är near-zero → behåll/omdefiniera/ta bort? (2) **Render-gate-ytan** — fel i `AuthProvider`/`InnerApp` före `<RouterProvider>` (ADR-037) ligger utanför både routerns catch och `Sentry.ErrorBoundary`; fångas bara av `createRoot onUncaughtError`, ingen branded fallback. (3) **Capture-vägs-konsolidering** — `onCaughtError` + `Sentry.ErrorBoundary` + ev. framtida `onError` → en medveten dedupe:ad strategi (K0.3b observerade ingen dubbel-rapport idag, men vägarna bör konsolideras). Trigger: efter Fas 2-fynd-stängning, lämpligen ihop med Fas 3.5-test-infran (testbar fel-hantering). Underlag: K0.3a + K0.3b sessionsdok-trail.
- **Logout-flödes-regressionstest (2026-05-27, Session 7 K0.5, Fynd 5, deferred):** verifieringen idag bevisar router-reaktion på förlorad session (K4.3 Test 6 rensar storage + reload), men anropar aldrig `auth.logout()`→`supabase.auth.signOut({ scope: 'local' })`-vägen — den är typbevisad (tsc/Biome), ej regressionstestad. Spec: ett test som anropar `auth.logout()` och asserterar (1) `signOut`-anropet skedde + (2) efterföljande router-redirect till `/login` (via `_authenticated` beforeLoad efter `onAuthStateChange`→`setUser(null)`). Aktiveras som **e2e-klick på logout-knapp** när app-shell/logout-UI finns (Fas 5), ELLER **komponent-test** (vitest, Fas 3.5) — det som kommer först. Samma defer-mönster som no-flash-testet ovan. Detaljerad nog att aktiveras, ej återuppfinnas.
- **DEFER → Fas 7 (perf-budget): Main-bundle över Vite-varningsgränsen (Fynd 7, bekräftad Session 7 K0.5).** Main-chunk ~640 kB raw / ~189 kB gzip (640.49/188.97 vid HEAD 2026-05-27), över Vites 500 kB-varning. Hög andel `@supabase/supabase-js`-runtime (~197 kB raw, Kandidat 32). **Medveten Fas 2-defer, ej 11/10-blocker** — Fas 2:s status hålls inte gisslan av en schemalagd optimering. Fas 7-åtgärd: mät + sätt budget, `lazyRouteComponent` på `_authenticated`-trädet, tree-shake-verifikation av Realtime, `chunkSizeWarningLimit: 600`, verifiera med bundle-analyzer. Källa: BUILD-LOG bundle-evolution-tabell + verifieringsdok Fynd 7.
- **Governance-hygien: harmonisera sessionsdok-arkiverings-trigger (2026-05-27, Session 7 K-sista, ej brådskande):** [ADR-023](../docs/decisions/ADR-023-sessions-arkivering.md) säger "arkiveras vid K-sista" (generellt) medan session-end-skillens steg 13 säger arkivering är "fas-avslut-specifik" — de säger emot varandra. Session 7 (K0-verifiering mellan faser, ej fas-avslut) löstes genom att följa den mer specifika skill-regeln (sessionsdoket ej arkiverat), men nästa session bör inte snubbla på samma tvetydighet. Åtgärd: förtydliga ADR-023 (additiv korrigerings-not per decisions/README § Korrigering vs supersedering) ELLER skill-beskrivningen så triggern är entydig. Trigger: nästa gång sessionsdok-arkivering aktualiseras (fas-avslut eller Fas 2.5-start).
- **Airtable formel-drift: Deadline slutbetalning (2026-06-10, Session 13 K2-rapport, Fas B-sfär):** formeln i `Deadline slutbetalning` (`fldGlznON7xqR3IE1`) jämför `{Slutbetalning} = "Ej relevant"` men optionen heter `"Ej relevant (för föreläsningar)"` → villkoret matchar aldrig, deadline beräknas även för föreläsningar. Åtgärd efter schema-frysens hävning (frysen gäller tills Fas 2.5 stängd); Lotta/Roger-moment med Code-stöd punktvis. Källa: Session 13 klunga 2-transparens-rapport (MCP-fynd i förbifarten).
- **CI-lint-glob-gap: sessionsdok saknar CI-grind (2026-06-10, Session 13 FAS 2-forensik):** markdownlint-cli2-globben i `.markdownlint-cli2.jsonc` är `tasks/*.md` — täcker INTE `tasks/sessions/` (96 filer utan explicit arg vs 97 med; arkiv-negationen `!tasks/sessions/archive/**` är idag verkningslös). Sessionsdok lintas lokalt av create-session-doc-grenen men har ingen CI-grind. Åtgärd: bedöm glob-utvidgning till `tasks/**/*.md` (arkiv-negationen blir då aktiv) + Vale-scope-konsekvens. Källa: Session 13 FAS 2 grind-verifiering.
- **Hub-governance-lyft (marcus-system)** — egen framtida session. marcus-system saknar markdownlint-config, CI och frontmatter-hook (mognads-gradient: hubben härdas via frontlinje-spoken, universella mekanismer lyfts när de bevisats). Lever hittills bara som "Ej i scope"-mening i sessionsdok (sedan Session 6.7) — denna post stänger tracking-luckan så tråden överlever sessionsdok-arkivering.
  - Version-sync-mekanism saknas: `plugin.json` ↔ `marketplace.json` (`plugins[].version` + `metadata.version`) hålls inte i synk → drev 1.1.0→1.2.0 obemärkt (Session 12 inkr. 2; reaktivt healed i `3f11ed2`). Kandidat: hook/CI-grind som asserterar version-överensstämmelse vid bump.
- [ ] **Lessons-format-drift (L103–L119 bullets vs ###-bestånd)** — backlog/hygien: 17 bullet-lessons (L103–L119) avviker från filens dominerande ###+Datum/Källa/klass-konvention (107:17). Normalisera till ### (vissa bullets saknar klass: → rekonstruktion) eller besluta konvention medvetet. Ej avsluts-scope; rör landat material. Identifierad Session 20 (L124-drift-klass).
