<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk. 8 äkta Vale.Terms-fynd + 1 emergent rad-245-quirk dokumenterade i K2.6.2.D.4 v2-trail. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# todo.md — Miranon Media Admin (React)

<!-- markdownlint-disable-next-line MD036 -->
*Senast uppdaterad: 2026-07-06 (**Session 54 ✅ AVSLUTAD** (lifecycle: closed efter coverage-kvittens, ADR-069-grinden; post 3 inget anmält) — **MIGRERINGS-HUB-SESSION 1 LEVERERAD: utfasningskartans steg 1 + hela migrerings-bunten (p.1–p.6).** Levererat: rigor-migreringen (täcknings-matrisen: hela Migrera-klassen disk-prövad, 8 TÄCKT + lifecycle-delen klar via ADR-069; gap-stängningen code-role-discipline v1.1 [datum-invarianten §1.4 + governing-verifieringen §1.5] + 3+-branschledar-kvantifieraren med ärlighetsklausul i konstitutionen [Marcus-pushback rev avstå-klassningen → L243]; hub `731aa9f`; steg 1-beviset för retirera-steget på plats) · lessons-hub-lyftet S35–S53 (38 [UNIVERSAL]-poster → K35.1–K53.1, agent-transformerat + skript-verifierat verbatim; hub-lyft-skulden NOLL; hub `faf6806`) · plugin 1.10.0→1.11.0 (T66 prototyp-tvåfasen divergens/konvergens [punkterna a–c, web-förankrad Double Diamond + NN/g] + invokerings-UX-README:n [5 laddningsvägs-regler]; hub `6272336`; L55-ritualen grön) · mät-apparaten klassad ÖVERSPELAD av drift-beviset + handoff-klassningen (Decision A) bokförd LEVERERAD (Del 5) · T60 väg b (bearbetningen → research/, rådatan gitignorerad; hub-trädet HELT RENT; hub `d052ebd`) · skörden L243–L244 hub-lyft samma session (K54.1–2, hub `fb52a0c`). Trådflippar: T60 + T66 → closed. INGEN ADR mintad (Accepted efter apparat-migreringen, L241; count 69 orörd). Mekanik-fynd: `~/.claude/CLAUDE.md` = symlink till hub-CLAUDE.md. **OMSTART PENDING (aktiverar 1.11.0).** **NÄSTA: NY session (antagen 55), Marcus väljer spår:** produktspåret (T65 Hem-konvergensen [första T66-konvergens-passet] / nästa vy-PRD / TASK-3-klassning / T64-vägval / T61) eller migrerings-hub-session 2 (kartans steg 2+3: Decision B + retirera relä-apparaten; systemet.md-omskrivningen SIST).)*

> Aktiva uppgifter. Lärdomar fångas i `tasks/lessons.md`.
> Arkitekturbeslut fångas i `docs/decisions/`.
> Implementation-journal i `docs/BUILD-LOG.md`.
> Styrande dokument: [`docs/byggplan.md`](../docs/byggplan.md)

---

## Aktuellt fokus

**Övning 2 (session 51 →)** — epok-ramen per [ADR-068](../docs/decisions/ADR-068-ovnings-ramverket.md); byggplanen är Övning 2:s karta.

**Fas 5.5 — Vertikal write-slice: staging-miljön KLAR ✅; deny/allow-grinden avblockerad.** Server-kontraktet levererat och CI-grönt (operation `mark-registration-fee-paid` → `Anmälningsavgift`, ADR-049). Den isolerade staging-miljön är byggd (ADR-050 bygg-sekvens 1–7 komplett) och hela staging-testsviten grön (41 passed/0 skipped). **Nästa: Fas 5.5 klient-UI (K2) i ny session** (peka bakåt på session 18; en stängd session resume:as ej — ny sessions-yta, ADR-052/L124).

**Session 20 ✅ (lifecycle-fält, ADR-052) + Session 21 ✅ (tråd-arkitektur, ADR-053) KLARA. RESUME av session 19: bygg-steg 3–7 KLARA — ADR-050 staging-migration KOMPLETT (2026-06-15).** Hela sekvensen landad: ADR-050 + förarbete → empirisk läsning + schema-check CLEAN (3) → staging-secrets (4) → 6 EF:er deployade via bare CLI (5) → CI-test-secrets repointade mot staging, väg b (6) → CORS + deny-tester av-skippade (7a) → seedad post + allow-test med restore-teardown (7b). Staging-testsvit: **41 passed/0 skipped**. `staging==prod`-defekten (L110) strukturellt stängd. Återstår (ej staging): Fas 5.5 K2 klient-UI.

### Session 55 🔄 PÅGÅR (2026-07-06) — T65 Hem-konvergensen: första T66-konvergens-passet

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

- [ ] **Riv allowlist-posten GHSA-gv7w-rqvm-qjhr** när esbuild ≥ 0.28.1 nås via
  vite/tsx-bump. Verifierbart sluttillstånd: `npm ls esbuild` visar ≥ 0.28.1
  OCH posten borttagen ur `audit-ci.jsonc` + CI grön. Expiry i posten:
  2026-07-13 — bevaka dependabot-PR:ar för vite/tsx.
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
