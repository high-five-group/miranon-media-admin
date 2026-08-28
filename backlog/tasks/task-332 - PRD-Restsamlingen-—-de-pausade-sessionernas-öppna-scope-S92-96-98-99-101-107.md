---
id: TASK-332
title: >-
  PRD: Restsamlingen — de pausade sessionernas öppna scope
  (S92/96/98/99/101/107)
status: To Do
assignee: []
created_date: '2026-08-28 03:36'
labels:
  - prd
  - restsamling
  - ready-for-human
dependencies: []
ordinal: 604000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Samlingsartefakten för de SEX pausade sessionsdokens öppna scope-punkter. Marcus order 2026-08-28, verbatim: *"Alla sessionsdok som inte är stängda ännu är det av en anledning, det finns något i dess scope som inte är klart som jag vill/ville få klart. Men en idé kanske skulle vara att samla ihop scope-punkterna till ETT nytt sessionsdok, som kan arbeta med dem senare"* + *"Då är det ju viktigt med referenser, så man alltid kan hitta källan/källorna."*

Formen (PRD-kort, inte sessionsdok) beslutad i `tasks/sessions/2026-08-24-session-112.md` § "Marcus order mitt i resumen" beslut 1 (rad 757–770): ett för-skapat sessionsdok bryter ADR-043 beslut 4 (dok föds vid sessionsstart), och framåtriktat arbete bor i Backlog.md-substratet.

**Ingenting är förkastat.** Varje scope-punkt i de sex doken är klassad **K** (klar, med belägg mätt mot disk/backlog/git) eller **Ö** (öppen). K-punkterna bokförs i respektive doks stängningssektion; Ö-punkterna står nedan, var och en med källdok + rubrik + radintervall samt de kort-/tråd-/PR-referenser den redan pekar på.

De sex doken är stängda via **scope-överföring** — ny stängningsform, bokförd som amendering i `docs/decisions/ADR-052-lifecycle-frontmatter-falt.md` § Updates 2026-08-28.

Mätdatum för allt nedan: **2026-08-28**, mot `origin/main` `10ae24f3`.

---

## S92 — Färgsystemet (`tasks/sessions/2026-07-26-session-92.md`, 699 rader)

Landningen är klar (PR `#285` mergad `03d3a3f4`); det som står kvar är **migreringens förarbete A–E**, som PAUSLÄGET uttryckligen förbjöd att påbörja innan A–D landat.

- [ ] **S92-Ö1 · Steg A — namnge de tre alfagrammatikerna.** `--mm-state-outline-{hover,pressed}` · `--mm-state-subtle-{rest,hover,pressed}` · `--mm-state-layer-{default,contrast}` · `--mm-scrim-dialog` · `--mm-shimmer`. Två följdkrav ur researchen: skriv ner VARFÖR outline och subtle skiljer 2 pp (samma fråga som § CARRY rad 645–647), och assertera invarianten vila < hover < pressed som fitness-check. Additivt, inga värden ändras. — *Källa:* § Planen före migreringen → Steg A (rad 480–494). *Belägg för Ö:* grep efter `--mm-state-outline` / `--mm-state-subtle` / `--mm-state-layer` / `--mm-scrim-dialog` / `--mm-shimmer` i `src/styles/tokens/*.css` = **0 träffar**.
- [ ] **S92-Ö2 · Steg B — urvalsrollen.** `--mm-surface-selected{,-hover,-pressed}` som neutral tonal stege per Primer-modellen. — *Källa:* § Steg B (rad 496–501). *Belägg för Ö:* grep efter `--mm-surface-selected` i `src/styles/tokens/*.css` = **0 träffar**.
- [ ] **S92-Ö3 · Steg C — Marcus två delbeslut om mätaren.** (1) fyllnadens kulör: sage-9 eller blue-9 (båda klarar 3:1 mot alla aktuella spår; guld uteslutet av kontrastskäl). (2) ska "fullt" markeras semantiskt — i så fall ett medvetet affärspåstående som kräver ikon eller text utöver färg. Därutöver: komponenten bör klassas om till `role="meter"` (spec-grundat, ej smaksak). — *Källa:* § Steg C (rad 503–513) + § CARRY rad 637–640. **MARCUS-ÄGD.**
- [ ] **S92-Ö4 · Steg D — resten av bristerna.** F1 (login), F4 (cat-gruppen), F5 (spec-synk), F13 (mixarna blir teknisk skuld). Fyndregistret bor i `docs/design/farg-atlas.fynd.json`. — *Källa:* § Steg D (rad 515–517).
- [ ] **S92-Ö5 · Steg E — MIGRERINGEN, ej påbörjad.** Låt `--mm-*`-rollerna peka på tolvstegsskalorna. Ordning enligt riskkartan i atlasens sektion 5; `--mm-btn-primary-hover` (F14) och MessageBox steg 2 kontra 3 är de två beslut som måste fattas under vägen. **Fokusringen migreras aldrig** (`--p-blue-700` är exklusiv per `tasks/lessons.md:298`). — *Källa:* § Steg E (rad 519–526). *Belägg för Ö (viktigt — motsäger en tidigare bedömning):* `src/styles/tokens/primitives.css` rad 149–155 bär rubriken *"DEN GAMLA PALETTEN — utgående … Skalorna ovan är tänkta att ersätta dem, men ingenting är migrerat"*, och `semantic.css` rad 3 lyder `--mm-primary: var(--p-gold-500)` — den GAMLA tresiffriga skalan, inte tolvstegs-`--p-gold-9`. Prefix-bytet `--mm-` → `--p-` i primitives.css är genomfört (162 `--p-`, 0 `--mm-`) men är en ANNAN sak än rollmigreringen.
- [ ] **S92-Ö6 · `--mm-btn-primary-hover` saknar målsteg.** Gamla neutral-700 (L\* 24,4) har ingen bra motsvarighet; närmaste nya är steg 11 (32,2). Designbeslut, inte palettfel. — *Källa:* § CARRY (rad 648–650).
- [ ] **S92-Ö7 · Kandidat F16 — `btn` mot `button`.** Namnklyvningen mellan lager 2 och lager 3, och att `--mm-btn-*` är en komponentnamngiven roll i det SEMANTISKA lagret. Underlaget är korrigerat i § Ett S91-påstående som föll (rad 370–409); S91:s formulering vilade på ett falsifierat påstående. Ej infört i fyndregistret — **namnbeslutet är Marcus**. — *Källa:* § CARRY (rad 651–657) + rad 404–409. *Not:* `T125` handlar om `Button`-primitiven kontra handrullade piller (knappstorlek/radie), INTE om tokennamnen — F16 har alltså ingen egen tråd.
- [ ] **S92-Ö8 · Primer-fyndet mot S91-beslutet.** Primer överger alfa i high-contrast och byter till solida färger, eftersom alfa inte KAN garantera kontrast. Vår `--mm-state-hover-contrast` är 12 % alfa. "Bör prövas separat — kandidat för eget tråd-kort." — *Källa:* § CARRY (rad 641–644). *Belägg för Ö:* inget tråd-kort finns (grep efter `primer` / `high-contrast` i `tasks/threads/README.md` = 0 träffar).
- [ ] **S92-Ö9 · Elva lesson-kandidater, fyra `[UNIVERSAL]`, ej skördade.** Bl.a. `\b` är fel ordgräns för tokennamn · en verifierare som lånar den verifierades kod bevisar ingenting · oberoende implementation räcker inte, antagandena måste också skilja sig · kartlägg verkligheten innan du ändrar den. — *Källa:* § Lesson-kandidater (rad 544–588). *Belägg för Ö:* grep efter tre distinkta fraser ur listan i `tasks/lessons/` + `tasks/lessons.d/` = **0 filer**.

**Så återupptas det tekniska arbetet:** `npm run atlas` (bygger, formaterar, verifierar) ska ge noll avvikelser innan något nytt påbörjas — 1611 kontroller. Se § Så återupptas arbetet (rad 528–542).

---

## S96 — Work-batchen, heartbeat + T95 (`tasks/sessions/2026-08-02-session-96.md`, 2363 rader, 8 pauser)

Referenserna nedan går till **åttonde (sista) pausen**, § CARRY / ÖPPNA TRÅDAR (rad 2288–2332) och § KÄNDA KANTER (rad 2334–2350), där alla tidigare pausers carry är ackumulerad.

- [ ] **S96-Ö1 · Marcus två egna mätningar.** (1) Följer namnlisten systemets ljus/mörk-läge i den INSTALLERADE appen? Öppen mätpunkt — varken MDN eller web.dev dokumenterar saken; faller den negativt gäller manifestets vita i båda lägena. (2) Mailet med logotypen, via en återställning till sig själv. — *Källa:* rad 2290–2295. **MARCUS-ÄGD.**
- [ ] **S96-Ö2 · `T124` — EF-lagrets `_shared`-tröskel.** Egen ADR med medvetet valt tal, eller "lokal konvention, ingen ADR"? Fyra ärvande filer medvetet orörda tills formen är vald. — *Källa:* rad 2295–2298. *Belägg för Ö:* `T124` = `paused` i `tasks/threads/README.md`. **MARCUS-ÄGD.**
- [ ] **S96-Ö3 · QA-korten `TASK-126.3` · `TASK-126.5` · `TASK-127.10`.** — *Källa:* rad 2302. *Belägg för Ö:* alla tre **To Do** (`npm run bl -- task list --plain`). **MARCUS EGNA GRINDAR.**
- [ ] **S96-Ö4 · `T127` — install-vägledningen bakom inloggningen.** Den som inte kommit in kan inte läsa hur man kommer in. Marcus har parkerat sidans justering till "senare". — *Källa:* rad 2303–2304. *Belägg för Ö:* `T127` = `paused`.
- [ ] **S96-Ö5 · `T128` — vakter som larmar på FORMEN i stället för handlingen.** Konkret instans: heartbeat-svepets larm läser check-ROLLUP, inte required checks, vilket ger ett larm som strukturellt inte kan tystna. — *Källa:* rad 2305 + § KÄNDA KANTER rad 2336–2340. *Belägg för Ö:* `T128` = `paused`.
- [ ] **S96-Ö6 · `T129` — stagings `rate_limit_email_sent` = 2/h mot rundturs-e2e:s inbjudningar.** **Miljöändring, kräver Marcus.** — *Källa:* rad 2306–2307. *Belägg för Ö:* `T129` = `paused`. **MARCUS-ÄGD.**
- [ ] **S96-Ö7 · `ADR-076` rad 123 bär `--merge`-formen i presens.** Formen är upphävd av merge-kön (`gh` avvisar strategiflaggan), men raden står kvar. Medvetet orörd sedan fjärde pausen: *"en ADR ändras via amendering, inte i förbifarten"*. — *Källa:* rad 2310–2311. *Belägg för Ö:* `docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md` bär alltjämt `gh pr merge --auto --merge` i presens i sitt kontextavsnitt.
- [ ] **S96-Ö8 · `tasks/lessons.d/README.md` saknar en rad** om `##`-underrubrikernas MD024-kollision vid konsolidering. — *Källa:* rad 2312–2313. *Belägg för Ö:* `grep -c 'MD024' tasks/lessons.d/README.md` = **0**.
- [ ] **S96-Ö9 · Larm-heuristiken i `post-merge.yml` är oförändrad** och kommer peka ut oskyldiga PR:er igen. — *Källa:* rad 2314–2315.
- [ ] **S96-Ö10 · Fem lesson-kandidater, ej hub-lyfta.** (1) en konfigurations-diff bevisar att ett fält ändrats, aldrig att det fungerar — en credential kan bara bevisas genom att användas · (2) ett bibliotek kan injicera en default där du utelämnat ett fält (`vite-plugin-pwa` gav Vue-grönt `#42b883`) · (3) zsh ordsplittar inte oquotade variabler · (4) en vakt som matchar FORM larmar på sin egen dokumentation · (5) en självbyggd vakt med fabricerad jämförelse-SHA avslutar omedelbart och ser ut att bevaka. — *Källa:* rad 2317–2332.
- [ ] **S96-Ö11 · Kända kanter som fortfarande gäller.** Mail-låset fäller på kommandotext inklusive dokumentation som citerar värdnamnet (byt verktyg, aldrig regel) · CodeQL default setup-körningar kan inte köras om · en PR som aldrig FICK en CI-körning kan inte köras om (stäng + återöppna, vilket nollar armeringen) · appen saknar mörkt läge helt (noll `prefers-color-scheme` i kodbasen) · localhost-posten i stagings `uri_allow_list` är EJ LÅSBAR. — *Källa:* § KÄNDA KANTER (rad 2334–2350).

*Hub-lyftet `L433`–`L479` + fragmenten (rad 2308–2309) är MEDVETET utelämnat här — det ingår i den separata fragment-skörden (121 fragment i `tasks/lessons.d/`), inte i restsamlingen.*

---

## S98 — Nattgrinden och paritetsreglerna (`tasks/sessions/2026-08-05-session-98.md`, 390 rader)

Fyra beslutsposter låg hos Marcus vid pausen. **En är mekaniserad, tre står kvar.**

- [ ] **S98-Ö1 · Dokumentationsluckans rest: `CONTRIBUTING.md` nämner pariteten inte alls** trots att filen bär Definition of Done. NÄR-regeln fick sitt hem i `CLAUDE.md` (§ `verify:ci-parity` är ett DIAGNOSVERKTYG), men DoD-avsnittet i CONTRIBUTING är orört. — *Källa:* § CARRY post 1 (rad 355–359) + § NÄSTA KONKRETA STEG 1 (rad 384–385). *Belägg för Ö:* `grep -c 'ci-parity' CONTRIBUTING.md` = **0**.
- [ ] **S98-Ö2 · UNIVERSAL-konvergensen — sex markörformer, ingen av dem ett beslut.** Fet-stil-formen rekommenderad (noll falska positiver mot backtickens 24). Migrering av 444 poster är Marcus kall; underlaget ligger i `lessons-hub-sync`-skillen. — *Källa:* § CARRY post 2 (rad 360–363). *Belägg för Ö:* `lessons-hub-sync`-skillens egen description lyder alltjämt *"UNIVERSAL-markörens SEX former (konvergens till EN väntar Marcus-beslut)"*. **MARCUS-ÄGD.**
- [ ] **S98-Ö3 · MCP-nyckelns fail-open.** `${VAR}`-expansion FUNGERAR i `~/.claude.json` (skarpt mätt med kastbar variabel), men beteendet är dokumenterat enbart för `.mcp.json` — odokumenterat i vårt scope. Unset-fallet är **fail-open**: misslyckas Keychain-hämtningen skickas strängen `${AIRTABLE_API_KEY}` som nyckel och felet pekar inte på rotorsaken. — *Källa:* § CARRY post 3 (rad 364–368). *Not:* `docs/reference/atkomst-och-nycklar.md` rad 238 nämner sökvägen men inte fail-open-egenskapen.
- [ ] **S98-Ö4 · Lesson-KANDIDAT, ej mintad: en regel skriven på för tunt underlag kan göra problemet värre än ingen regel.** Den föreslagna paritetsregeln mättes till 2,3–2,9× dyrare än vad som faktiskt gjordes. Antecknad, hub-lyfts EJ. — *Källa:* § CARRY (rad 370–373).

---

## S99 — Process-synen, nio uppdrag grillade (`tasks/sessions/2026-08-07-session-99.md`, 1049 rader, 5 pauser)

Agent-sidan av alla nio uppdrag är KOMPLETT (`TASK-161.1`–`161.9` Done). **Det som blockerar session-end är uteslutande Marcus-ägt.** Femte pausens CARRY (rad 1010–1024) hänvisar till fjärde pausens fullständiga listor (rad 921–955).

- [ ] **S99-Ö1 · QA `TASK-160.7`** (compact-formen). — *Källa:* fjärde pausen § CARRY rad 922–923. *Belägg för Ö:* **To Do**. **MARCUS-ÄGD.**
- [ ] **S99-Ö2 · QA `TASK-161.10`** (styrande-docs-auditen; inleds med lärdomslager-rapporten + spårbeslutet). — *Källa:* samma rad. *Belägg för Ö:* **To Do**. **MARCUS-ÄGD.**
- [ ] **S99-Ö3 · BYGGPLAN-LÄTTLÄST-beslutet.** STOP-utfallet i `161.8`: beställ en Gunilla-uppdatering eller bekräfta frysningen. — *Källa:* fjärde pausen rad 923–926. *Belägg för Ö:* `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` bär fortfarande KÄND DRIFT-banderollen (enda filen i `docs/` med den strängen). **MARCUS-ÄGD.**
- [ ] **S99-Ö4 · Hub-sync-vägvalet — MÅSTE föregå lessons-skörden.** `lessons-hub-sync`-skillens monolit-greppar ger tomt mot volymformen. Eget hub-ärende eller inuti hub-lyftet? — *Källa:* fjärde pausen rad 926–929 + MARCUS-SEKVENS rad 956–961. *Belägg för Ö:* `tasks/lessons/vol-01.md` … `vol-07.md` på disk = volymformen är verklighet; skillens grepp är oförändrade. **MARCUS-ÄGD, blockerar skörden.**
- [ ] **S99-Ö5 · Boka `TASK-148.5`.** — *Källa:* fjärde pausen rad 929. *Belägg för Ö:* **To Do**.
- [ ] **S99-Ö6 · Triagera `TASK-154`–`TASK-156`.** — *Källa:* fjärde pausen rad 929–930. *Belägg för Ö:* alla tre **To Do**.
- [ ] **S99-Ö7 · Lärdomslager-spårbeslutet.** Rapporten ligger: `docs/research/lardomslager-branschpraxis-2026-08-07.md`. — *Källa:* fjärde pausen rad 930–931. **MARCUS-ÄGD.**
- [ ] **S99-Ö8 · Lesson-kandidater (a)–(g) plus tredje pausens elva oförlösta.** (a) refererat underlag landar som filartefakt i samma landning som specen · (b) worktree-sessioners transkript bor i egna kataloger per path · (c) `Read` med bar absolut-path läser delade checkouten från agent-worktree · (d) grind-räknings-kopian driftade igen inom timmar (tal ska vara pekare) · (e) bar `git stash` bröt formen hos en agent · (f) en armerad PR vars armering konsumeras av konflikt är samma obevakade klass som `T108` (mätinstans `#1059`) · (g) en huvudkatalog som muterar under en annan sessions läsning ger icke-reproducerbara snapshots. Tredje pausens: ägarskaps-hookens prefix-matchning · ägarlapp återfås inte vid resume · worktree-vaktens komplexitets-heuristik · 158.2-klassen · stängnings-flip ovanpå landad version · DIRTY-släppet `#910` · skal-cwd · docs-grindar lokalt före push · `CLAUDE_PROJECT_DIR` · obockade-AC · ci.yml-conf-serien. — *Källa:* fjärde pausen rad 932–947 + femte pausen rad 1018–1024.
- [ ] **S99-Ö9 · Två skarpbevis som "fyrar naturligt".** Släpp-sidan + post-compact-igenkänningen (första naturliga kompaktering — markör sätts via pre-compact-skillen) · tröskel-zonlarmet (~500k tokens; trigger = auto-nekningen ÄR beviset). Kräver ingen handling, men är obetald skuld tills de fyrat. — *Källa:* fjärde pausen rad 948–951.
- [ ] **S99-Ö10 · `T111`-korrigeringen.** PreCompact-hook-negationen vederlagd; pekare i `ADR-101` § Källmärkning. Triage-kandidat vid beröring. — *Källa:* fjärde pausen rad 952–953.
- [ ] **S99-Ö11 · psionautics-remoten pekar på gamla org-namnet** (`marcus803` → GitHub-redirect). Bokförd teknisk skuld i ett ANNAT repo, ej åtgärdad (`161.8`). — *Källa:* fjärde pausen rad 954.

---

## S101 — L8-workflow-kartläggningen (`tasks/sessions/2026-08-09-session-101.md`, 378 rader)

Hela transformationens etablering är landad (åtta PR:er, ADR-105/106/107, `TASK-173` + sju skivor). Resten är **visionsspåret K3/K4 plus review-grindens svans**. Referenser går till § PAUSLÄGE (rad 314–378).

- [ ] **S101-Ö1 · Review-grindens tre kvarvarande skivor.** `TASK-173.4` (den deterministiska CI-backstoppen som fäller en PR utan giltigt utlåtande) · `TASK-173.6` (fångstrate-instrumenteringen) · `TASK-173.7` (`ready-for-human`). Tills `173.4` finns är review-grinden ett **orkestrerar-åtagande, inte en mekanisk spärr** (`CLAUDE.md` § Review-grinden). — *Källa:* § PAUSLÄGE TILLSTÅND (rad 316–328) + NÄSTA KONKRETA STEG 1 (rad 372–374). *Belägg för Ö:* alla tre **To Do**; `173.1/.2/.3/.5` Done.
- [ ] **S101-Ö2 · K4-verifikaten ×3 — förkrav för K4-grillningen.** SendMessage-persistens över hård omstart · realtids-attach · public-followup-idempotens. Formen: kastbara minimal-test (prototype-skillens LOGIC-gren eller direkta harness-experiment); svaren matar grillningen. — *Källa:* § CARRY (rad 337–341) + NÄSTA STEG 2 (rad 374–376). *Belägg för Ö:* `docs/research/` bär K4-UNDERLAGET (`k4-firstmate-arkitektur-2026-08-09.md`) men inget verifikat-dokument.
- [ ] **S101-Ö3 · K4-grillningen — HUVUDSPÅRET, Marcus startar.** FirstMate/exekverings-hubben; Marcus verbatim *"exakt det jag ser framför mig … ett HUBB-system som man kan plugga in i varje scope"*. Ärver ADR-106:s kontrakts-neutralitet. — *Källa:* § MARCUS-SEKVENS (rad 344–361) + NÄSTA STEG 3 (rad 376–377). *Besläktad tråd:* `T61` (AFK/Ralph-loop + sandbox) står `active` och bär exekverings-loopens obyggda del. **MARCUS-ÄGD.**
- [ ] **S101-Ö4 · K3 — Lavish-minimal-testet vid nästa VERKLIGA plan-tillfälle.** Marcus: *"next-level för vårt UI-arbete/iterationsprocess"*. Dras parallellt med K4 per omprioriteringen. — *Källa:* § MARCUS-SEKVENS + NÄSTA STEG 4 (rad 377–378).
- [ ] **S101-Ö5 · ADR-107:s setup-repo som eget kort.** — *Källa:* § MARCUS-SEKVENS (rad 358–359). *Belägg för Ö:* inget kort i backloggen nämner setup-repot.
- [ ] **S101-Ö6 · Vågorna i övrigt + K9-placeringen** kvar i Marcus prioritering. — *Källa:* § MARCUS-SEKVENS (rad 357–358). **MARCUS-ÄGD.**
- [ ] **S101-Ö7 · Fem lesson-kandidater, ej hub-lyfta — fyra kvarstår.** (1) ADR-katalogdriften: `check-adr-count.sh` validerar endast filantal mot rot-README-token, katalog-raderna är ogrindad blind fläck · (2) L440-fångsten på egen audit-pipe vid sessionsstart · (3) worktree-basen låg på lokal HEAD i stället för `origin/main` vid `EnterWorktree` · (4) heartbeat-larmserien på främmande `#1055` = instansdata till `task-170`. **(5) är BETALD:** att `gh pr view` saknar `isInMergeQueue` och att klassningen kräver GraphQL står nu i `CLAUDE.md` § Landning (om-mätt 2026-08-24). — *Källa:* § CARRY (rad 329–337).
- [ ] **S101-Ö8 · Hub-sync-paketet väntar hub-moment.** Termerna *review-grinden* / *risk-rad* / *rundtak* / *kanalseparation*-mönstret + K6/K7-kandidaterna. — *Källa:* § CARRY (rad 341–343).

---

## S107 — Nio-punktslistan (`tasks/sessions/2026-08-17-session-107.md`, 2765 rader, 7 pauser)

Två hela spår är ÖVERLÄMNADE och ingår därför INTE nedan: dokument-/bilage-/mallspåret → **S108** (Del 19, rad 2256–2382) och notis-/felmeddelande-spåret → **S109** (Överlämning 2, rad 2649–2765, `S109` numera `closed`). Det som står kvar är exakt vad Överlämning 2 § A räknar upp som "S107 behåller allt annat".

- [ ] **S107-Ö1 · Länkrötan — `.lycheeignore`-beslutet.** ActiveCampaign `403`, `supabase/cli`-fil `404` (flyttad upstream). Nattnätets sista tekniska grind. — *Källa:* § PAUSLÄGE nattnäts-tabellen rad 2591 + NÄSTA STEG 2 (rad 2645). *Belägg för Ö:* `TASK-254` = **To Do** (`ready-for-human`); grep efter `activecampaign` / `supabase/cli` i `.lycheeignore` = **0**. **MARCUS-ÄGD (designad röd yta, ADR-082).**
- [ ] **S107-Ö2 · De obesvarade larm-ärendena.** 16 vid pausen; **26 vid mätningen 2026-08-27** (S112 Fynd 1). Stängs med hänvisning till faktiska fixar, aldrig tyst (`CONTRIBUTING.md` § Nattnätet). — *Källa:* § PAUSLÄGE rad 2592 + NÄSTA STEG 3 (rad 2646). *Not:* S112 resume 2 har GO under mandatet att stänga dem med motivering — samordna innan dubbelarbete.
- [ ] **S107-Ö3 · Preview-miljöns `VITE_SENTRY_DSN`.** Bekräfta att den lades även för Preview, inte bara Production. Production är skarpt verifierad. — *Källa:* § MARCUS ÖPPNA MOMENT 1 (rad 2596–2597). **MARCUS-ÄGD.**
- [ ] **S107-Ö4 · Granska den nya ikoncentreringen** när `#1658` deployats — 1 px vänster, Marcus eget val mot renderad skala. — *Källa:* MOMENT 2 (rad 2598–2599). **MARCUS-ÄGD.**
- [ ] **S107-Ö5 · De 13 klass B-korten.** Väntade på `TASK-281` per Marcus beslut ("vänta med de 15"); `249.1` och `249.9` är redan bockade. **`TASK-281` är nu Done — blockeraren är borta, korten är plockbara.** — *Källa:* MOMENT 4 (rad 2602–2603).
- [ ] **S107-Ö6 · Fyra kvarstående basbeslut.** Nollställningens brytpunkt · de 565 tomma betalfälten · ompeka `Antal hämtningar` (**PROD-SCHEMAÄNDRING**) · 69 `Engagemang`-rader. — *Källa:* MOMENT 5 (rad 2604–2606). **MARCUS-ÄGD.**
- [ ] **S107-Ö7 · `T151` — Sentrys fyra mätta luckor.** Tom `transaction` (`browserTracingIntegration` saknas) · `Users: 0` (ingen user context) · **source maps obesvarat** (röktestet bar ingen riktig stack — avgörs av ett ÄKTA fel ur appens kod) · `reportEdgeFunctionError` utan anropare. `§ LUCKA 3`-skarven mot felmeddelandena tillhör S109, resten S107. — *Källa:* § CARRY (rad 2610–2614). *Belägg för Ö:* `T151` = `active`.
- [ ] **S107-Ö8 · `T147` · `T148` · `T149` · `T150`.** Staging-fixturen (steg 3 plockbart) · flake-riggen acceptance-bunden · två testklasser kan bara fällas efter landning · warmup-gaten. — *Källa:* § CARRY (rad 2615–2617) + NÄSTA STEG 4 (rad 2647). *Belägg för Ö:* alla fyra `active` i trådregistret.
- [ ] **S107-Ö9 · Datakvalitet i personlistan — ej åtgärdad.** ~185–190 av 559 poster har `Namn = "Ej tillgängligt"`; var tredje rad saknar namn när Lotta öppnar listan. **Mätt EN gång utan dubbelkontroll** — mät om innan åtgärd. — *Källa:* § CARRY (rad 2620–2622).
- [ ] **S107-Ö10 · Testposten `Marcus (test) Johansson` i de 559** — riktiga talet är 558. — *Källa:* § CARRY (rad 2623).
- [ ] **S107-Ö11 · `.prod-ref-policy.conf:52` bär ett falskt påstående.** Raden motiverar prod-låset med att CLAUDE.md behandlar Airtables prod-bas som förbjuden UTAN läs-undantag — premissen är falsifierad i Del 13 § D (rad 1442–1458). Låset självt är korrekt; motiveringen är det inte. — *Källa:* § CARRY (rad 2624). *Belägg för Ö:* raden står oförändrad på disk.
- [ ] **S107-Ö12 · Lesson-kandidater ur passen, ej hub-lyfta.** Del 8 § F (fyra, rad 686–707) + Del 14 § G (rad 1694–1710). — *Källa:* de angivna sektionerna.

---

## Hur resterna arbetas

**Detta kort är scope, inte en skiva.** Formen är avsiktlig: punkterna är heterogena (designbeslut, Marcus-QA, trådar, lesson-skörd, ett par plockbara byggen) och delar bara EN egenskap — de är rester ur en pausad session.

1. **Marcus startar en session med detta kort som scope** när han vill arbeta på resterna. Sessionsdoket föds då, vid sessionsstart (ADR-043 beslut 4) — det för-skapas aldrig.
2. **`/to-issues` bryter ned de punkter som är agent-körbara** till skivor när en punkt tas. Punkterna märkta **MARCUS-ÄGD** är beslut, inte bygge — de kan aldrig delegeras till en agent.
3. **Ordningen är inte given här.** Punkterna bär ingen inbördes prioritet; de flesta är oberoende. Två undantag: S92-Ö5 (migreringen) kräver att S92-Ö1–Ö4 landat först, och S99-Ö4 (hub-sync-vägvalet) MÅSTE föregå varje lessons-skörd.
4. **Varje punkt bär sin källa.** Gå alltid till källdoket före arbete — sammanfattningen ovan är en INGÅNG, inte den auktoritativa ytan (ADR-100 §2).

**Källdoken, samtliga `lifecycle: closed` via scope-överföring 2026-08-28:**

- `tasks/sessions/2026-07-26-session-92.md` — 3 K, 9 Ö
- `tasks/sessions/2026-08-02-session-96.md` — 4 K, 11 Ö
- `tasks/sessions/2026-08-05-session-98.md` — 3 K, 4 Ö
- `tasks/sessions/2026-08-07-session-99.md` — 5 K, 11 Ö
- `tasks/sessions/2026-08-09-session-101.md` — 3 K, 8 Ö
- `tasks/sessions/2026-08-17-session-107.md` — 6 K, 12 Ö

Var och en bär en sektion `## Stängd via scope-överföring (2026-08-28)` med sin fullständiga K/Ö-tabell och beläggen för K-klassningarna.

**Utanför detta kort med avsikt:** de 121 lesson-fragmenten i `tasks/lessons.d/` skördas separat (egen kadens); dokument-/bilage-/mallspåret ägs av S108; notis-/felmeddelande-spåret ägdes av S109 (stängd).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
