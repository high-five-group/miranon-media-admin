---
id: TASK-462
title: >-
  Heartbeat-svepet ska vara sessionsmedvetet — larma bara på den egna sessionens
  PR:er
status: To Do
assignee: []
created_date: '2026-09-18 11:53'
updated_date: '2026-09-19 00:02'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 802000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-09-18 (S126 parallellt med S127): scripts/heartbeat-svep.sh sveper ALLA öppna PR:er i repot och rapporterar RÖTT, DIRTY och ARMERINGS-KANDIDAT level-triggered var 90:e sekund. Med två aktiva sessioner får var och en den andras larm: S126 väcktes åtta gånger av S127:s och Dependabots PR:er (#2506, #2536, #2538) och löste det med ett handhållet grep-filter per PR-nummer i monitor-kommandot. HEARTBEAT_EXEMPT_AUTHORS hjälper inte — alla agent-PR:er går under samma konto, och undantaget gäller bara armerings-vägen, inte RÖTT-vägen. Två risker: (1) varje falsk väckning kostar en modell-tur och kontext; (2) ett ARMERINGS-KANDIDAT-larm är enligt CLAUDE.md en ORDER ('armera eller draft i samma svep') — riktad till PR:ens ägare, men svepet säger inte vem ägaren är, så fel session kan armera eller parkera en främmande sessions halvfärdiga PR (en D0-PR landar då utan granskning). Regeln 'en främmande aktiv sessions PR rörs aldrig' är i dag ren prosa. Det handhållna filtret bär dessutom motsatt risk: ett felskrivet nummer döljer den EGNA PR:ens röda. Efter kortet vet svepet vilka PR:er som tillhör sessionen och rapporterar bara dem (med en flagga för att se allt). Form att pröva — orkestrerarens rekommendation, inte ett beslut: en PR-ETIKETT per session (session:S126), satt av bygg-agenten vid gh pr create och av orkestreraren på egna PR:er; svepet filtrerar på etiketten. Skäl: etiketten är synlig på GitHub, överlever paus/resume och kompaktering (till skillnad från en otrackad tillståndsfil), kräver ingen grennamns-konvention, och följer hur stora projekt äger arbete (Kubernetes area/sig-etiketter). Alternativ att väga: grennamns-prefix per session; otrackad lista i arbetsträdet. Berör: scripts/heartbeat-svep.sh + .heartbeat-svep-policy.conf + testsviten, .label-policy.json, .claude/agents/bygg-agent.md (etikett vid PR-skapande), och hubbens session-start/session-resume (monitor-kommandot bär sessionens etikett) — hub-delen som egen commit i hub-repot. Marcus 2026-09-18: 'Sjukt viktig kort-kandidat … Måste väl åtgärdas snarast'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Svepet rapporterar RÖTT/DIRTY/ARMERINGS-KANDIDAT enbart för PR:er som bär sessionens markör; en flagga (t.ex. --alla) ger dagens beteende
- [x] #2 Tvåsidig testsvit: en främmande röd PR ger INGET larm i sessionsläge men larm med --alla; en egen röd PR larmar i båda
- [x] #3 En PR UTAN markör (glömd etikett) syns i ett eget, lågfrekvent besked — aldrig tyst, aldrig som order
- [x] #4 Dependabot-PR:er: beslut utskrivet om de tillhör ingen session (egen kanal) eller den session som äger huvudkatalogen
- [ ] #5 bygg-agentens kontrakt och session-start/-resume bär markören; CLAUDE.md § Landning säger vad svepet nu gör — utan att påstå mer än mekanismen håller (ADR-083)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Bygg-agentens leverans (2026-09-18)

**Vald form: (B) PR-kropps-markör**, inte (A) etikett per session.

Empiriskt prövat innan valet gjordes: `gh pr create --label <ny-etikett>`
FALLERAR helt (exit 1, "could not add label: '<namn>' not found") om
etiketten inte redan finns på repot — `gh` skapar den INTE automatiskt.
Verifierat skarpt mot en kastbar draft-PR (branch
`zz-test-462-label-probe`, städad efter provet: fjärrgren raderad, ingen PR
skapades eftersom anropet föll atomärt). Konsekvensen för (A): varje ny
session hade krävt ett FÖREGÅENDE `gh label create session:SNNN`-anrop innan
`gh pr create`, och etikettlistan hade växt obegränsat (hundratals per år,
ingen prunar dem — `.label-policy.json`/`synka-labels.mjs` rör aldrig en
etikett som inte står i policyn, och en session-etikett hör strukturellt inte
hemma i den kurerade tillstånd/klass/område-taxonomin). (B) kräver ingen
GitHub-sidoeffekt alls: markören är text i ett fält som redan skrivs vid
`gh pr create --body`.

Verifierat att (B) överlever `scripts/uppdatera-review-sektion.mjs`s
full-ersättning av PR-kroppen: `uppdateraPrKropp()`
(`scripts/lib/review-risk-sektion.mjs`) bevarar allt FÖRE
`MARKER_START`/EFTER `MARKER_END` ordagrant — en sessionsmarkör placerad
FÖRST i kroppen (bygg-agent-kontraktet kräver detta) ligger alltid i
`fore`-delen och rörs aldrig av risk-sektionens skrivningar, oavsett hur
många granskningsrundor som körs.

**Markörformat (hårdkodat, ej config-drivet — protokoll, inte projektvärde):**
`<!-- heartbeat-svep:session:<ID> -->`, alltid FÖRST i PR-kroppen.

## AC #5 — DELVIS klar, hub-delen är UTANFÖR denna PR:s scope

Gjort i DENNA PR: `.claude/agents/bygg-agent.md` § Landning bär det fulla
kontraktet (sätt markören om uppdraget anger en sessionsidentitet; skapa
PR UTAN markör och SÄG DET i rapporten om identiteten saknas — gissa
aldrig). `CLAUDE.md` § Landning har två nya stycken som beskriver vad
svepet nu gör och att ett KANDIDAT-larm i sessionsläge är en order till just
den sessionen — utan att påstå att hub-delen redan är klar (ADR-083).

INTE gjort (kräver hubbens EGEN commit-kanal, per uppdraget "Hubben rör du
INTE"):

- `~/Repon/marcus-system/plugins/marcus-system/skills/session-start/SKILL.md`
  rad 180:
  `Monitor({command: "bash scripts/heartbeat-svep.sh --quiet",`
  → `Monitor({command: "bash scripts/heartbeat-svep.sh --quiet --session S<N>",`
  (ersätt `S<N>` med sessionens faktiska nummer, t.ex. `S126`)
- `~/Repon/marcus-system/plugins/marcus-system/skills/session-resume/SKILL.md`
  rad 75, IDENTISK ändring.

Båda rader lästa och verifierade ordagrant 2026-09-18 (grep mot hub-repot,
läsning tillåten även för en isolerad agent — CLAUDE.md § "Worktree-
isoleringens gräns", tabellraden "Annat repo (hubben) — läsning: OK").

## Testsvit och grindar (mätta, exitkoder)

- `scripts/test-heartbeat-svep.sh`: 58 → **77** fall (19 nya: T40–T55 inkl.
  underfall), 0 failade, exit 0. Tvåsidigt bevis per LARM-väg
  (RÖTT/DIRTY/KANDIDAT: egen session larmar, främmande session tyst, --alla
  återställer). Glesnings-paret T47c/T48 bevisar den omärkta-notisens
  intervall-spärr (samma mönster som T28/T29 för gren-städningen).
- `shellcheck --severity=style --enable=all` mot HELA CI:s filsvit (alla
  `scripts/*.sh` + samtliga `.conf`-policyfiler i `ci.yml`s lista): exit 0,
  0 diagnoser.
- `npm run typecheck`: exit 0. `npx @biomejs/biome check .`: exit 0 (18
  pre-existing warnings/84 infos i ANDRA filer, orörda av denna diff).
  `npm run build`: exit 0. `npm run test:api:pure`: 1790 passed, exit 0
  (staging-delen `test:api:staging` MEDVETET INTE körd — instruktion i
  uppdraget, staging överbelastad 2026-09-18). `npm run check:docs`: 14/14
  gröna, exit 0.
- `node scripts/check-langa-streck.mjs`: EJ körd — diffen rör inte `src/`
  (bygg-agent.md-kravet gäller uttryckligen bara `src/`-ändringar).
- `actionlint`: EJ körd — diffen rör inga `.github/workflows/*`-filer.

## Premisser prövade (ADR-086)

- PR #2540 (kortets källa): var OPEN vid start, `mergeStateStatus: BLOCKED`,
  `autoMergeRequest` satt — MERGADE under arbetets gång (bekräftat
  `mergedAt: 2026-09-18T12:13:47Z`). Branchen rebasades om (se nedan) mot
  `origin/main` efter det.
- `scripts/heartbeat-svep.sh`/`.heartbeat-svep-policy.conf`/
  `scripts/test-heartbeat-svep.sh` lästa i sin helhet före design — inga
  divergenser mot uppdragets beskrivning av dagens beteende.
- `.label-policy.json`/`scripts/synka-labels.mjs` lästa: bekräftade att
  policyn INTE tar bort okända etiketter men att en session-etikett ändå
  inte hör hemma i den kurerade taxonomin (se formvalet ovan).
- Git-hantverk: en kastbar testgren (`zz-test-462-label-probe`) skapades av
  misstag PÅ SAMMA branch som det riktiga arbetet fortsatte på. Upptäckt och
  rättat innan push: ny gren `feat/task-462-sessionsmedvetet-heartbeat`
  skapad direkt från `origin/main` (fba38b66), min faktiska diff extraherad
  som patch och applicerad rent ovanpå (`git apply`, 0 konflikter — bekräftat
  att inget av de 5 rörda filerna divergerat mellan kortets bas-commit och
  `origin/main`). Testgrenen raderad lokalt och på fjärren.

## Rörda filer

- `scripts/heartbeat-svep.sh` — sjätte vägen (`--session`/`--alla`,
  markör-hjälpfunktioner, omärkt-PR-notisen, TIPS-raden, `--help`-utökning)
- `.heartbeat-svep-policy.conf` — `HEARTBEAT_OMARKERAD_INTERVALL` (default
  1800, dokumenterad kopia av skriptets egen fail-safe-mot-synlighet-default)
- `scripts/test-heartbeat-svep.sh` — T40–T55 + ström-separation (stdout/
  stderr i EGNA filer, EXPECT_ERR/NOT_EXPECT_ERR) för att kunna bevisa
  TIPS-raden utan att mjuka upp T22/T25b/T35b:s befintliga "helt tyst
  stdout"-kontrakt
- `.claude/agents/bygg-agent.md` — markör-kontraktet vid `gh pr create`
- `CLAUDE.md` — två stycken i § Landning, minimal diff

## Fix-runda (review runda 1, Marcus-beslut 2026-09-19) — ny bygg-agent, PR fortsatt draft

Ursprungsagenten var död; grenen togs över fri (gammal worktree riven, ren, head=fjärr). ORDER = granskarens utlåtande runda 1 (risk medel, 0 error, 2 warning ask-user, 1 info), de två ask-user-frågorna avgjorda av orkestreraren på Marcus mandat.

**Fynd 1 (TIPS-raden på stderr, aldrig synlig via Monitor) — BYGGT.** Ny `tips_notis_om_dags()` (scripts/heartbeat-svep.sh): flyttad till alltid_pa() (stdout, --quiet-immun), taktad av HEARTBEAT_OMARKERAD_INTERVALL, egen state-fil (TIPS_STATE_FILE), anropas nu från sweep_once() i stället för en gång per invokation. Tvåsidigt bevisat: T51 (syns på stdout, kallstart), T51b (syns INTE längre på stderr), T51c (stryps vid omedelbar repetition), T52/T53 (uteblir helt vid --session/--alla).

**Fynd 2 (Dependabot RÖTT/DIRTY osynligt i sessionsläge) — BYGGT.** Ny `dependabot_status_notis_om_dags()`: en HEARTBEAT_EXEMPT_AUTHORS-författares RÖTT/DIRTY rapporteras nu i ett eget, glest besked (samma stämplade-intervall-mönster, HEARTBEAT_OMARKERAD_INTERVALL, egen state-fil DEPENDABOT_STATE_FILE) — INFORMATION, ALDRIG en bitmask-bit i sessionens verdikt. Kod-kommentaren (§ SESSIONSMEDVETET SVEP i heartbeat-svep.sh, och .heartbeat-svep-policy.conf § GRÄNS) rättad — påstod tidigare att dependabot "redan har sin egen hantering" för RÖTT/DIRTY, vilket bara höll för armerings-kandidat-vägen. Författarlistan förblir config-driven (HEARTBEAT_EXEMPT_AUTHORS), ingen ny hårdkodning. Tvåsidigt bevisat: T56/T57 (röd/dirty dependabot-PR i sessionsläge → strypt besked, verdikt 0), T58 (glesning), T59 (--alla → dagens beteende oförändrat, vanlig RÖTT-alarm), T60 (grön dependabot-PR → ingen notis).

**Skarpt levande fall (PR #2506, dependabot, statusCheckRollup FAILURE, verifierat via `gh api graphql` med skriptets exakta query 2026-09-19):** en jämförelsekörning mot ORIGINALKODEN (den orörda commiten, session ZZ-LIVE-VERIFIERING-462) gav "ALLT LUGNT", exit 0 — PR #2506 helt osynlig. Samma körning mot DEN FIXADE koden ger raden "UNDANTAGEN FÖRFATTARE — 1 öppna PR:ar... #2506 (dependabot: RÖTT (FAILURE))", fortfarande exit 0 (ingen bitmask-bit för sessionen). Detta är exakt den bugg granskningens fynd 2 identifierade, bevisad mot verkligt repotillstånd, inte bara mot stubbar.

**Fynd 3 (kostnadsraden saknades) — BYGGT.** Se PR-kroppens nya sektion "Kostnad i två mått".

**Testsvit:** scripts/test-heartbeat-svep.sh 77 → 87 fall (10 nya: T51b, T51c, T56, T56b, T57, T57b, T58, T59, T60, T61), 0 failade, exit 0. shellcheck --severity=style --enable=all mot CI:s fulla filsvit (samma kommando som CI): exit 0, 0 diagnoser. bash -n scripts/heartbeat-svep.sh: syntax OK. npm run check:docs: EJ körd i denna fixrunda — ingen fil under dess grind-scope (docs/**, tasks/**, *.md utanför backlog-kortet) rördes; CLAUDE.md rördes i föregående runda, inte i denna.

**Rörda filer i denna fixrunda:** scripts/heartbeat-svep.sh (tips_notis_om_dags, dependabot_status_notis_om_dags, TIPS_STATE_FILE/DEPENDABOT_STATE_FILE, loop-body-utökning, rättade kod-kommentarer, --help-range 61,198→61,217), scripts/test-heartbeat-svep.sh (T51-T53 omskrivna, T51b/T51c/T56-T61 nya), .heartbeat-svep-policy.conf (GRÄNS-stycket utökat, HEARTBEAT_OMARKERAD_INTERVALL-kommentaren omskriven för tre delade notiser). Riskbedömnings-sektionen i PR-kroppen rördes INTE (uppdragets regel).

## Fix-runda 2 (review runda 3, Marcus-beslut 2026-09-19)

Runda 2 (risk medel) verifierade fix-runda 1:s båda beslut byggda (87/87 gröna, shellcheck 0) och fann ETT nytt fynd (warning/ask-user): de två NYA strypta kanalerna (`tips_notis_om_dags`, `dependabot_status_notis_om_dags`) stryps mot en MASKIN-GLOBAL `STATE_DIR` (default `/tmp/mm-heartbeat-svep`) — empiriskt visat: S126 sveper först och stämplar filen ⇒ S127:s eget svep ser ALDRIG notisen. Exakt den tvärsessions-interferens kortet finns för att ta bort, återinförd i en ny kanal.

**BYGGT.** `--session <ID>` ⇒ de strypta notisernas state-filer bär nu sessionens SANITERADE ID i filnamnet. Ny hjälpfunktion `session_id_sanitize()` (scripts/heartbeat-svep.sh, ren bash-parameterexpansion `${raw//[^A-Za-z0-9_-]/_}`) — behåller endast `[A-Za-z0-9_-]`, allt annat blir `_`; ingen path-traversal möjlig (testat skarpt med session-ID `../../etc/passwd` → statsfil `last-dependabot-notis-______etc_passwd`, direkt i STATE_DIR, ingen subkatalog).

Ny toppnivå-variabel `SESSION_STATE_SUFFIX` beräknas EFTER arg-parsing (samma villkor som `sweep_once()`s `sessionslage`, dupliceras dit eftersom suffixet behövs innan `sweep_once()` någonsin anropas): satt när `--session` är givet OCH `--alla` inte är det, annars tomt. `OMARKERAD_STATE_FILE`/`DEPENDABOT_STATE_FILE`/`TIPS_STATE_FILE` bär nu detta suffix. `STADA_STATE_FILE` (gren-städningens klocka) rördes INTE — medvetet global, oförändrad, enligt uppdraget.

**Asymmetrin mellan kanalerna, viktig att förstå:** `omarkerad_notis_om_dags()` och `dependabot_status_notis_om_dags()` kräver BÅDA `sessionslage=1` (SESSION satt) för att ens köra — deras state-fil är därför ALLTID sessions-scopad när de faktiskt avfyrar, interferensen är FULLSTÄNDIGT löst. `tips_notis_om_dags()` är en ANNAN sak: den körs UTESLUTANDE när SESSION är TOM (motsatt villkor, se dess guard-klausul) — det finns då per definition inget sessions-ID att skopa mot, och dess stämpel förblir OFÖRÄNDRAT GLOBAL PER MASKIN. Detta är INGEN brist i implementationen utan en strukturell konsekvens av TIPS-radens eget syfte (upptäcka `--session`-mekanismen INNAN man känner till den). Dokumenterat explicit som "KÄND BEGRÄNSNING — GLOBAL PER MASKIN" i scripts/heartbeat-svep.sh § SESSIONSMEDVETET SVEP, i SAMMA disclosure-form som gren-städningens befintliga (§ FEMTE VÄGEN) — matchar uppdragets krav ordagrant.

`.heartbeat-svep-policy.conf` § GRÄNS/SESSIONSLÄGE och § "Sessionsmedvetet svep"-kommentaren uppdaterade: "blir heller aldrig helt tyst" var en dold överdrift fram till denna runda (höll bara INOM en session, inte mellan) — nu korrekt för de två per-session-scopade kanalerna, med TIPS-radens kvarvarande globala undantag utskrivet (ADR-083-disciplin).

**Testsvit:** scripts/test-heartbeat-svep.sh 87 → 100 fall (13 nya: T62, T62b, T62c, T62d — två sessioner S126/S127 delar STATE_DIR, dependabot-notisen; T63, T63b, T63c, T63d — samma bevis för omärkt-notisen; T64, T64b, T64c — saniteringen; T65, T65b — TIPS förblir globalt oförändrat), 0 failade, exit 0. shellcheck --severity=style --enable=all mot CI:s fulla filsvit: exit 0, 0 diagnoser. bash -n scripts/heartbeat-svep.sh: syntax OK.

**Differentialbevis (fault injection), inte bara "testerna är gröna":** en extraherad kopia av den ORÖRDA runda-1-koden (git show fe3f1319294a69feb13ff252c4d914c3b8a1f1d0:scripts/heartbeat-svep.sh) kördes mot DENNA rundas nya testfil i isolerad scratchpad-katalog. Utfall: 97 passerade / 3 failade — exakt T62b, T63b, T64b fälls (stdout saknade "UNDANTAGEN FÖRFATTARE" / saknade "SESSION — 1 öppna PR:ar..." / saniterad statsfil hittades inte), medan T62/T63/T64/T65-serien i övrigt går igenom (kallstart-beteendet i sig var redan korrekt, bara ANDRA sessionens tur var trasig). Detta bevisar att de nya testerna FAKTISKT fångar regressionen, inte bara råkar vara gröna mot den fixade koden.

**Rörda filer i denna fixrunda:** scripts/heartbeat-svep.sh (session_id_sanitize(), SESSION_STATE_SUFFIX, tre state-filers namn, KÄND BEGRÄNSNING-stycket, --help-range 61,217→61,246), scripts/test-heartbeat-svep.sh (T62-T65 nya, header/footer-index uppdaterade), .heartbeat-svep-policy.conf (GRÄNS/SESSIONSLÄGE-stycket + OMARKERAD_INTERVALL-kommentaren utökade). Riskbedömnings-sektionen i PR-kroppen rördes INTE (uppdragets regel, verifierat byte-identisk pre/post via diff mot den levande PR-kroppen).

**Kostnad:** PR-kroppens § "Kostnad i två mått" utökad med en tredje rad (100 fall, 3 lokala körningar: 17,591s/13,765s/16,313s, snitt ≈15,89s) och en förklaring av varför fix-runda 2:s per-fall-kostnad är högre än runda 1:s (T62/T63 kör fyra separata run_case-anrop var för det tvåsidiga cross-session-beviset).

## Fix-runda 3 (review runda 3, Marcus-beslut 2026-09-19)

Runda 3 (risk medel) bekräftade fix-runda 2:s tvåsessions-simulering byggd (100/100 gröna, shellcheck 0) men fann: (1) warning — `session_id_sanitize()` mappar olika ID:n till SAMMA filnamn (empiriskt: "S 126" och "S/126" ⇒ "S_126"), vilket tyst återinför tvärsessions-tystnaden, och PR:ens "FULLSTÄNDIGT löst" överclaimade (ADR-083); (2) info — `STATE_DIR` växer med en fil per session-ID, ingen städning, obokfört.

**Fynd 1 — BYGGT, ANNORLUNDA VÄG (enklare, fail-closed i stället för mer sanering).** `--session <ID>` VALIDERAS nu mot `^[A-Za-z0-9._-]{1,64}$` (ny `HEARTBEAT_SESSION_ID_REGEX`) OCH avvisas explicit om det består ENBART av punkter (ny `HEARTBEAT_SESSION_ID_ENDAST_PUNKTER_REGEX`, matchar `^\.+$`) — direkt efter argument-parsningen, innan något svep sker. Ogiltigt ID ⇒ tydligt felmeddelande skrivet BÅDE till stdout OCH stderr (Monitor-formen ser bara stdout) + exit 2 (CLI-fel), ingen körning, ingen fil skriven. `session_id_sanitize()` (scripts/heartbeat-svep.sh, tidigare rad 621) är HELT BORTTAGEN. Filnamnets per-session-del är nu ID:t självt, helt osanerat — kollision är omöjlig PER KONSTRUKTION (två olika giltiga strängar kan aldrig bli samma sträng), inte bara osannolik.

**Kantfall upptäckt under implementationen (ej i granskningens fynd, fångat egenhändigt): `--session ""`.** `[[ -n "${SESSION}" ]]` kan inte skilja "flaggan gavs inte" från "flaggan gavs med tomt värde" — båda ger en tom sträng. Utan en fix hade `--session ""` tyst fallit tillbaka till global/TIPS-läget i stället för att avvisas, trots att uppdraget uttryckligen listar "tomt" som ett av de fem namngivna ogiltiga-fallen. Löst med en ny `SESSION_GIVEN`-flagga (satt i arg-parsningens `--session)`-gren, oavsett värde) som valideringsblocket testar i stället för `-n "${SESSION}"`.

**Fynd 2 — BYGGT (det mindre alternativet, per uppdragets "välj det minsta").** Per-session-statsfilerna (`last-omarkerad-notis-*`, `last-dependabot-notis-*`) städas nu genom att PIGGYBACKA på gren-städningens BEFINTLIGA glesa klocka i `stada_grenar_om_dags()` — samma stämpel (`STADA_STATE_FILE`) och samma intervall (`HEARTBEAT_STADA_GRENAR_INTERVALL`), ingen ny klocka byggd. Varje gång den klockan är due (efter dess egen stämpel-skrivning, oberoende av om själva gren-städningen sedan lyckas eller misslyckas) raderas per-session-statsfiler äldre än ny policy-var `HEARTBEAT_SESSION_STATE_MAX_DAGAR` (default 30 dagar). Ärver gren-städningens på/av-villkor (`HEARTBEAT_STADA_GRENAR_INTERVALL > 0` OCH `stada-grenar.sh` exekverbar) — en spoke utan gren-städning får därför heller ingen statsfil-städning, ett medvetet val för att hålla ändringen till en handfull rader (implementationen är ~15 rader inklusive kommentarer, `# shellcheck disable=SC2312` för `find`-process-substitutionens maskerade exitkod). TIPS_STATE_FILE/global-läget rörs INTE (bär inget session-ID i namnet att matcha mot).

**"FULLSTÄNDIGT löst" bytt mot vad som faktiskt gäller (ADR-083).** Kod-kommentaren (§ SESSIONSMEDVETET SVEP i scripts/heartbeat-svep.sh) och policy-conf-kommentaren skriver nu ut att interferensen är löst GENOM VALIDERING (kollisionsfri per konstruktion, inte bara "sannolikt ok") för omarkerad/dependabot-kanalerna, och att TIPS-kanalens globala begränsning kvarstår OFÖRÄNDRAD som en strukturell konsekvens av dess eget syfte (den körs bara när inget session-ID finns att skopa mot) — inte som en brist i fixen.

**Testsvit:** scripts/test-heartbeat-svep.sh 100 → 111 fall (11 nya: T66 giltigt ID "S126" baseline, T67 giltigt ID med punkt "s126.resume.2", T68 tomt ID ⇒ exit 2, T69 mellanslag ⇒ exit 2, T70 snedstreck ⇒ exit 2, T71 enbart punkter ".." ⇒ exit 2, T72/T72b 65-tecken-gräns ⇒ exit 2, T73 fail-closed skriver ingen fil, T74/T74b/T74c två giltiga ID som delar prefix ⇒ VARSIN statsfil — T64/T64b OMSKRIVNA, samma namn men helt nytt innehåll: farligt ID avvisas nu i stället för saneras), 0 failade, exit 0. shellcheck --severity=style --enable=all mot CI:s fulla filsvit (samma kommando CI kör): exit 0, 0 diagnoser. bash -n scripts/heartbeat-svep.sh: syntax OK.

**Differentialbevis (fault injection):** en extraherad kopia av den ORÖRDA runda-2-koden (git show 961bdbd3ea50952799724fa6ccc67cb486fbcdd6:scripts/heartbeat-svep.sh) kördes mot DENNA rundas nya testfil i isolerad scratchpad-katalog. Utfall: 103 passerade / 8 failade — T64, T64b, T68, T69, T70, T71, T72 fälls exakt (exit 0 i stället för väntat 2 — inget avvisades, eftersom ingen validering fanns), samt T74c (gamla saneringen ersatte punkter med understreck så de förväntade filnamnen "last-omarkerad-notis-v1.2.3"/"...v1.2.30" fanns inte under den gamla koden). Övriga 103 fall gick igenom oförändrat. Detta bevisar att de nya testerna faktiskt fångar regressionen granskningen identifierade, inte bara råkar vara gröna mot den fixade koden.

**Rörda filer i denna fixrunda:** scripts/heartbeat-svep.sh (HEARTBEAT_SESSION_ID_REGEX/-ENDAST_PUNKTER_REGEX, session_id_sanitize() BORTTAGEN, SESSION_GIVEN-flagga, valideringsblock efter arg-parsningen, SESSION_STATE_SUFFIX förenklad till "-${SESSION}" rakt av, ny per-session-statsfil-städning inuti stada_grenar_om_dags(), --help-range 61,246→61,269, rättade kod-kommentarer), scripts/test-heartbeat-svep.sh (T64/T64b omskrivna, T66-T74 nya), .heartbeat-svep-policy.conf (ny HEARTBEAT_SESSION_STATE_MAX_DAGAR=30 med fullt resonemang, GRÄNS/SESSIONSLÄGE-styckena omprövade). Riskbedömnings-sektionen i PR-kroppen rördes INTE (uppdragets regel, verifierat byte-identisk pre/post via diff mot den levande PR-kroppen).

**Kostnad:** PR-kroppens § "Kostnad i två mått" utökad med en fjärde rad (111 fall, 3 lokala körningar: 12,862s/15,206s/15,196s, snitt ≈14,42s). Snittet är LÄGRE än föregående rundas (100 fall, ≈15,89s) trots fler testfall — rapporterat ärligt som mätbrus (loadavg-variation i en delad, oisolerad miljö överskuggar den faktiska per-testfall-kostnaden för detta tillskott), inte utjämnat eller uteslutet.
<!-- SECTION:NOTES:END -->
