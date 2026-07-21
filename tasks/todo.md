<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk. 8 äkta Vale.Terms-fynd + 1 emergent rad-245-quirk dokumenterade i K2.6.2.D.4 v2-trail. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# todo.md — Miranon Media Admin (React)

<!-- markdownlint-disable-next-line MD036 -->
*Senast uppdaterad: 2026-07-21 (**Session 74 ✅ AVSLUTAD 2026-07-21** (`lifecycle: closed` efter Marcus coverage-kvittens **"Kvitterar 1 och 2"** — coverage inkl. post 3 inget-att-säkra + batch-ordern i samma kvittens) — **EVENT-FAMILJENS EXEKVERINGS-UNDERLAG KOMPLETT: TASK-17/18/19 (familje-PRD:erna ur S72/S73-faciten) + 25 skivor publicerade i beroendeordning.** Skarv-kvittensen + 4 designbeslut Marcus-kvitterade per rekommendation: två befintliga skarvar (api + e2e/axe) · chevron-regeln RIVS öppet (verkställs TASK-18.3) · hemvisten event-familjens skapa-route + Mer-ingången rivs (TASK-19.2) · Anteckningar = ADDITIV tabell (egen ADR vid TASK-18.11) · publiceringsflaggan additiv nu (kontraktet = T79, registerraden synkad). Klartext-avstämningen (L305-fångsten) låste deadline-regeln start − 14 dagar (18.8). Etiketter: ready-for-agent ×22 + QA ready-for-human ×3; DoD-arvet per skiva (L220/L245/L246 + bas-additivitets-grinden); graf-verifierad — tre disjunkta startkedjor (17.1+17.3 ∥ 18.1 ∥ 19.1) = ADR-073-partitions-kandidaterna; prefaktoreringen 17.3 kursfärgs-tokensen delas av kalendern + gruppdynamiken; familje-rivningen 18.13 sist (dep alla 21 bygg). EF-gap-kartan lagd (uppdatera-event · slutbetalning/notering · bekräfta · bor över · anteckningar · närvaro-write saknas — skarpa 6b/6c/6f-ytor finns = ombyggnad). SKÖRD: **L305–L306** (klartext-avstämningen · cache-läsnings-formen; MD018-kandidaten förkastad med motiv). Inga röda runs (docs-only-formen höll ×5). Ingen ny ADR (73==73, nästa 074) · nästa lesson L307 · nästa tråd T80 · fälla 45. BUILD-LOG S74-post + transcript-ref wc-verifierad. **NÄSTA (NY session S75 — HANDOFF + MARCUS BATCH-ORDER ordagrant i sessionsdok Del 4: work-batch · max-kort 22 · två pipelines [P1 lista+skapa: 17.1→17.3→17.2→17.4→19.1→19.2→19.3→19.4 · P2 eventsidan: 18.1→18.2→18.3→18.8→18.9→18.10→18.11→18.4→18.5→18.6→18.7→18.12 · svans 17.5→18.13] · granskningsfärdig-läge; QA-vågen + design-review + prod-deploy = Marcus ikväll · hub-lyftet L284–L306 + T78-hubhalvan; Marcus-moment: Update-klicket i claude.ai.** Full narrativ: sessionsdok Del 1–4. S73 ✅ i egen sektion nedan.)*

> Aktiva uppgifter. Lärdomar fångas i `tasks/lessons.md`.
> Arkitekturbeslut fångas i `docs/decisions/`.
> Implementation-journal i `docs/BUILD-LOG.md`.
> Styrande dokument: [`docs/byggplan.md`](../docs/byggplan.md)

---

## Aktuellt fokus

**Övning 2 (session 51 →)** — epok-ramen per [ADR-068](../docs/decisions/ADR-068-ovnings-ramverket.md); byggplanen är Övning 2:s karta.

**Fas 5.5 — Vertikal write-slice: staging-miljön KLAR ✅; deny/allow-grinden avblockerad.** Server-kontraktet levererat och CI-grönt (operation `mark-registration-fee-paid` → `Anmälningsavgift`, ADR-049). Den isolerade staging-miljön är byggd (ADR-050 bygg-sekvens 1–7 komplett) och hela staging-testsviten grön (41 passed/0 skipped). **Nästa: Fas 5.5 klient-UI (K2) i ny session** (peka bakåt på session 18; en stängd session resume:as ej — ny sessions-yta, ADR-052/L124).

**Session 20 ✅ (lifecycle-fält, ADR-052) + Session 21 ✅ (tråd-arkitektur, ADR-053) KLARA. RESUME av session 19: bygg-steg 3–7 KLARA — ADR-050 staging-migration KOMPLETT (2026-06-15).** Hela sekvensen landad: ADR-050 + förarbete → empirisk läsning + schema-check CLEAN (3) → staging-secrets (4) → 6 EF:er deployade via bare CLI (5) → CI-test-secrets repointade mot staging, väg b (6) → CORS + deny-tester av-skippade (7a) → seedad post + allow-test med restore-teardown (7b). Staging-testsvit: **41 passed/0 skipped**. `staging==prod`-defekten (L110) strukturellt stängd. Återstår (ej staging): Fas 5.5 K2 klient-UI.

### Session 75 ⏸️ PAUSAD (2026-07-21) — Batch-exekveringen: work-batch max 22, två pipelines

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
> [`2026-07-08-session-60.md`](sessions/2026-07-08-session-60.md) Del 1–6 +
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
> `### HANDOFF`-block + Del 6. Trail: [`tasks/sessions/2026-06-20-session-26.md`](sessions/2026-06-20-session-26.md).

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
> [`tasks/sessions/2026-06-21-session-29.md`](sessions/2026-06-21-session-29.md).
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
> [`tasks/sessions/2026-06-21-session-28.md`](sessions/2026-06-21-session-28.md).
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
> [`tasks/sessions/2026-06-21-session-27.md`](sessions/2026-06-21-session-27.md).
> Lessons L155–L161 (`[UNIVERSAL]` utom L161), hub-lyft pending.

- [x] **PI-interaktionsregel i hub** (`0212282`, marcus-system) — "inga klick-formulär" alltid-på meta-disciplin i `project-instructions-base.md`. Källa-vs-yta: kräver omklistring i varje spokes claude.ai-PI-ruta.
- [x] **T16 (a) reconciliation** — Pass 1 forensik (1 MCP-anrop; **Hink 1 tom** — doket ljög ej om schemat, "kända" Event(ID)-felet bor i research-doket ej data-model.md) + Pass 2 Commit A `41345e9` (stämpel, deadline-omramning, Lucka 7 STÄNGD, Person-lookup, död synk-pekare path-fix) + Commit B `40431c4` (EF-sektion −200 rader psionautics-EF → T19-pekare, avduplicering).
- [x] **T16 (b) avsluts-rutin** (`0dd1aa1`) — villkorad data-model-uppdaterings-rad i CONTRIBUTING per-session-DoD, parallell med constraints-raden. **T16 STÄNGT.**
- **T19 / T20 / T21** registrerade (paused) — `d652bdf` (T19 interaktions-dok + T20 hook-scope-lucka), `4cc9fb9` (T21 cross-repo psionautics-synk-drift). T21 knuten till T19 + Marcus psionautics-synk-moment.
- **Nästa-session-ordning** (Marcus-beslutad): **1. T19** (app↔Airtable-interaktions-dok — EGEN session, FÖRE 6c; kartan behövs av första write-flödet) → **2. T17** (system-/arbetssätts-dok — EFTER T19, sätter/refererar gränsen) → **3. /session-resume Session 26 → 6c-bygget** (på reconcilerat schema + T19-karta).

### Session 25 ✅ AVSLUTAD (2026-06-20) — Inc 4 (kall arch-audit mot Fas 6a) + Fas 6b Events-domän KLAR

> Inc 4 + tre 6b-landningar + arch-audit, allt CI-grönt. SESSIONSGRÄNS, ej fas-avslut
> (Fas 6 fortsätter 6c–6e). Trail:
> [`tasks/sessions/2026-06-20-session-25.md`](sessions/2026-06-20-session-25.md).
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
> [`tasks/sessions/2026-06-20-session-24.md`](sessions/2026-06-20-session-24.md). Lessons L149–L150.

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
> [`tasks/sessions/2026-06-18-session-23.md`](sessions/2026-06-18-session-23.md) § PAUSLÄGE
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
> historiskt). Trail: [`tasks/sessions/2026-06-17-session-22.md`](sessions/2026-06-17-session-22.md).

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
  [`tasks/sessions/2026-06-13-session-18.md`](sessions/2026-06-13-session-18.md).

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
