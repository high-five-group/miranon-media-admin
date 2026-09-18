---
id: TASK-462
title: >-
  Heartbeat-svepet ska vara sessionsmedvetet — larma bara på den egna sessionens
  PR:er
status: To Do
assignee: []
created_date: '2026-09-18 11:53'
updated_date: '2026-09-18 12:29'
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
<!-- SECTION:NOTES:END -->
