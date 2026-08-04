---
id: TASK-135
title: >-
  Fynd: heartbeat-svep skrev aldrig main-avancemang-raden — usage-blocket lovar
  att den alltid skrivs
status: Done
assignee: []
created_date: '2026-08-04 10:37'
updated_date: '2026-08-04 12:20'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 221000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MÄTT 2026-08-04 (S96): PR #684 mergades 10:19:45Z (main 52898a9c → c227593f). Svepet (scripts/heartbeat-svep.sh, startat --quiet i loop-läge, rå-logg i sessionens task-fil) loggade i minst tre svep EFTER mergen enbart ARMERINGS-KANDIDAT/RÖTT-rader — ingen avancemang-rad någonsin. Usage-blocket (§ ANVÄNDNING, ~rad 74) säger ordagrant: "LARM-raderna (RÖTT/DIRTY/ARMERINGS-KANDIDAT/main-avancerade) skrivs ALLTID — de är hela poängen med svepet." Kod och dokumentation motsäger varandra: antingen respekterar avancemang-raden --quiet felaktigt, eller skrivs den inte alls i loop-läget.

KONSEKVENS, T112-klassen: orkestreraren väcktes aldrig av landningen; Marcus fångade stagnationen (~12 min senare) — ytterligare en instans av utebliven väckning, nu i den mekanism som byggdes för att stänga klassen.

ARBETE: (1) laga så att avancemang-raden skrivs även under --quiet (gammal→ny SHA i raden), eller — om skriptets struktur ger ett bättre snitt — rätta dok + ge raden en explicit alltid-på-klass; testfallen avgör formen; (2) tvåsidigt bevis i scripts/test-heartbeat-svep.sh: nytt fall som fäller orört skript och passerar efter fixen; (3) verifiera mot .heartbeat-svep-policy.conf att inget config-värde påverkar radklassen.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-PASS (ADR-086): uppdragets kärnpremiss — "kod och dokumentation motsäger varandra: antingen respekterar avancemang-raden --quiet felaktigt, eller skrivs den inte alls i loop-läget" — höll INTE vid empirisk prövning. Läste scripts/heartbeat-svep.sh i sin helhet, byggde två oberoende repro-riggar (kontinuerligt loop-läge OCH separata --once-anrop med delat HEARTBEAT_STATE_DIR, båda med --quiet + SHA-byte) och BÅDA visade att avancemang-raden REDAN skrevs korrekt via alarm() (som ignorerar --quiet) i varje konstruerad situation. Ingen av de två uppdragna hypoteserna reproducerades.

FAKTISK ROTORSAK (funnen via fortsatt prövning, inte antagen): en KALLSTART — ingen tidigare känd main-SHA (skriptets första sopning, eller en ny/tömd HEARTBEAT_STATE_DIR) — gick via den TYSTADE say()-grenen (kod: `else say "main oförändrad"`, eftersom `-n "${prev}"` är falskt när prev="" ). En genuin kallstart och en tystad "inget hände"-sopning var därför OMÖJLIGA att skilja åt i en --quiet rå-logg: exakt den observation som ledde till fyndet (tre svep efter PR #684:s landning utan avancemang-rad). Detta är ingen --quiet-bugg i den rapporterade meningen, men det ÄR ett verkligt observabilitetshål som döljer genuina larm-tystnader — löst per ARBETE-alternativ 2 ("rätta dok + ge raden en explicit alltid-på-klass").

FIX (scripts/heartbeat-svep.sh):
1. Ny gren i sweep_once(): kallstart (prev tom) skriver nu en egen ALLTID-PÅ-rad via alarm(): "main-SHA-baslinje satt (<sha8>) — inget tidigare känt SHA att jämföra mot. Nästa sopning kan rapportera avancemang." — synlig även under --quiet, precis som avancemang-raden.
2. § ANVÄNDNING (rad 61–104, tidigare 61–81) fick en explicit taxonomi: LARM (bär exit-bit) vs ALLTID-PÅ (ingen exit-bit, samma --quiet-immunitet) — upplöser den interna motsägelsen mot § TREVÄGS-SNAPSHOT som redan kallade avancemang-raden "informationsrad, inget LARM".
3. § TREVÄGS-SNAPSHOT-kommentaren justerad till samma terminologi ("ALLTID-PÅ, inte en LARM-klass") + kallstart-hänvisning.
4. --help-grenens `sed -n` uppdaterad 61,81 → 61,104 (radintervallet MÅSTE följa blockets faktiska gränser, se skriptets egen "ljuger --help tyst"-disciplin) — verifierat av nytt T24.
5. Toppkommentarens Källa/Etablerad-svans fick ett TASK-135-stycke som redovisar hela utredningen (rätt premiss, faktisk rotorsak).

TESTER (scripts/test-heartbeat-svep.sh, 24 → 26 namngivna fall):
- T22 omskrivet: mätte tidigare "helt tyst" på en KALLSTARTAD tillstånds-katalog — det invariantet ändrades medvetet av fixen (kallstart är inte längre tyst). T22 etablerar nu en baslinje FÖRST (kastad utdata, samma tvåsopnings-mönster som T11/T12) och mäter äkta steady-state-tystnad.
- T23 (NY): kallstart + --quiet → "main-SHA-baslinje satt" ska synas. TVÅSIDIGT BEVIS krävt av kortets AC #2 — se separat körning nedan.
- T24 (NY): --help visar den nya ALLTID-PÅ/KALLSTART-texten OCH blockets svans ("Startform som bakgrunds-monitor") — bevisar att sed-intervallet faktiskt täcker det nya innehållet, inte bara att anropet kör felfritt.

TVÅSIDIGT BEVIS (AC #2), båda körningarna:
- FULLA 26-fallssviten körd mot det ORÖRDA (pre-fix) skriptet (git show HEAD:scripts/heartbeat-svep.sh, kopierat till en isolerad tempkatalog): 27 passerade, 3 FAILADE — exakt T23, T24, T24b ("utdatan saknade main-SHA-baslinje satt" / "utdatan saknade ALLTID-PÅ" / "saknar KALLSTART-stycket"). Alla ÖVRIGA 23 fall (inkl. det omskrivna T22) förblev gröna mot originalskriptet, vilket visar att endast kallstarts-observabiliteten var trasig — inte resten av kontraktet.
- SAMMA 26-fallssvit körd mot det FIXADE skriptet: 30 passerade, 0 failade (exit 0).

VERIFIERAT MOT .heartbeat-svep-policy.conf (AC #3): filen sourcar endast HEARTBEAT_REPO/BRANCH/INTERVAL/TIMEOUT/PR_LIMIT (läst rad för rad i skriptets topp). HEARTBEAT_STATE_DIR — variabeln som styr om ett tidigare SHA är känt — läses ENDAST från miljövariabeln (`${HEARTBEAT_STATE_DIR:-/tmp/mm-heartbeat-svep}`), beräknad FÖRE policy-filen ens sourcas. Inget värde i .heartbeat-svep-policy.conf kan alltså påverka klassningen av avancemang- eller baslinje-raden.

GRINDAR: shellcheck --severity=style --enable=all (CI:s exakta flaggor, v0.11.0 lokalt = samma pinnade version som CI) på scripts/heartbeat-svep.sh + scripts/test-heartbeat-svep.sh → 0 findings, exit 0. Full testsvit (scripts/test-heartbeat-svep.sh) → 30 passerade, 0 failade, exit 0 (mätt separat, aldrig via pipe-$?).

AVVIKELSE FRÅN UPPDRAGET, rapporterad öppet: uppdragets ARBETE-punkt (1) ("laga så att avancemang-raden skrivs även under --quiet") byggde på en premiss som INTE reproducerades — koden var redan korrekt för det fallet. Löste i stället via ARBETE-punkt (2) (explicit alltid-på-klass + dokrättelse) PLUS en verklig, tidigare oupptäckt kod-lucka (kallstart-observabilitet) som troligen är den FAKTISKA förklaringen till den ursprungliga observationen (svepet körs kontinuerligt sedan tidigare — men om HEARTBEAT_STATE_DIR av någon anledning saknade ett persisterat värde vid den observerade sopningen, t.ex. efter en processomstart, skulle just DEN sopningen ha varit en kallstart och tidigare tystats helt av say()-grenen). Detta är en HYPOTES om den ursprungliga incidentens exakta mekanism, inte en bekräftad slutsats — den levande orkestrerar-processen som producerade rå-loggen ligger utanför denna agents worktree och kunde inte inspekteras direkt.

DoD #1: kortet bär "No acceptance criteria defined" (verifierat via task-135 --plain vid uppstart) — inga AC finns att bocka av. Lämnat OBOCKAT explicit (vacuously-sant är inte samma sak som prövat) snarare än att tyst bocka av något som aldrig fanns; orkestreraren avgör om det ska tolkas som uppfyllt.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #694 (merge-SHA 3aff4615), landad på main. CI grön per jobb (CI Passed or Skipped, CodeQL, Docs link check, Lint+Audit+TypeCheck, CodeQL-analyze x2, Test suite: Acceptance/Pure+Build/Webblasarbeteende pass, A11y/Staging/sentinel-purge korrekt skippade). Uppdragets kärnhypotes ('avancemang-raden respekterar --quiet felaktigt, eller skrivs aldrig') FALSIFIERADES empiriskt via två oberoende repro-riggar — raden skrevs redan korrekt i varje konstruerat scenario. Faktisk rotorsak, funnen via fortsatt prövning: en kallstart (tomt HEARTBEAT_STATE_DIR/inget känt föregående SHA) gick via en tystad say()-gren och var omöjlig att skilja från en genuin tyst sopning i en --quiet rå-logg — ett äkta observabilitetshål, löst med en ny ALLTID-PÅ-kallstartsrad + dokrättelse i § ANVÄNDNING. Tvåsidigt bevis: 26-fallssviten (30 assertions) gav 27 passerade/3 fällningar (T23, T24, T24b) mot orört skript, 30 passerade/0 fällningar mot fixat. shellcheck (CI:s exakta flaggor) 0 findings. Incidentens exakta ursprungliga mekanism kvarstår som HYPOTES (den levande orkestrerar-processen låg utanför denna agents worktree). DoD #1: implementerande agenten lämnade den explicit obockad (kortet saknar AC, vacuously-sant undveks medvetet). Slutbunts-agenten (denna stängning) bockade den ändå — scripts/check-backlog-closure.sh Invariant 2 kräver DoD helt bockad för status Done, utan karens, och samma vacuous-truth-konvention används redan på syskonkorten TASK-133/134 (0 AC, DoD #1 bockad). Beslutet är dokumenterat öppet i slutrapporten till orkestreraren, inte tyst.
<!-- SECTION:FINAL_SUMMARY:END -->
