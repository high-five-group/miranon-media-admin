---
id: TASK-168
title: >-
  Hook-tuningen: deny-facit-godkand-skrivning matchar position, inte fri
  substräng
status: Done
assignee: []
created_date: '2026-08-09 07:18'
updated_date: '2026-08-09 09:32'
labels:
  - ready-for-agent
dependencies: []
ordinal: 311000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppföljning av ADR-104-hooken (task-167). Mätt friktion 2026-08-08 (två instanser samma kväll): Kanal A substräng-matchar skript-/manifest-relaterade namn i ALL Bash-kommandotext — även rent läsande kommandon (orkestrerarens python3-läsning) och kommandon som bara NÄMNER filnamn (agentens grep/git add/testsvit-körning nekades; agenten tvingades till wrapper-fil utanför repot). Falska fällningar är accepterad kostnad per design, men att KÖRA testsviten lokalt nekas är över gränsen — det tvingar fram kringgåenden, vilket urholkar spärrens legitimitet. FIX: matcha kommando-POSITION/skrivform (kommandot som utförare: redirect/heredoc/sed -i/jq-skrivning MOT manifest-sökväg, resp. skriptet som ANROPAT program i position 0/efter npm run) i stället för fri substräng över hela kommandotexten. Tvåsidig testsvit uppdateras: befintliga deny-fall ska fortsatt fälla, de tre mätta falsk-positiva klasserna (läsning, omnämnande, testsvit-körning) ska släppas. Hook-omladdning: räkna med L450 (kan inte förlitas på mitt-i-sessionen-laddning; en tidig fällning är dock giltigt bevis — se 167:s notes).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 De tre mätta falsk-positiva klasserna släpps igenom — tvåsidigt bevisat i testsviten
- [x] #2 Samtliga befintliga deny-fall fäller fortfarande — ingen försvagning av skyddet
- [x] #3 Skarpbevis eller öppen skuld bokförd per L450-regeln
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FJÄRDE mätta falsk-positiva klassen (2026-08-09, S93): ett backlog task create-anrop vars DESCRIPTION-text NÄMNER stämplingskommandot fälldes av hooken — payload-text i ett CLI-anrop är inte en anropsväg. Omformulering krävdes för att publicera skiva 171.4. Substräng-matchningen träffar alltså även kort-/dok-TEXT som passerar genom Bash-argument, inte bara faktiska kommandon.

Bokföring av klass 5 (uppdragets instruktion, borde skett FÖRST — gjordes efter diagnos/fix i stället; avvikelse flaggad öppet): 'backlog task edit --append-notes' vars notes-TEXT innehöll stämplingsskriptets filnamn som substräng föll för Kanal A:s gamla fria substräng-matchning (samma rotorsak som klass 4, en annan CLI-väg). KÄLLGRANSKNING: PR #1034:s body (gh pr view 1034 --json body) och kortfilen för task-169 innehåller INTE denna instans verbatim vid granskning 2026-08-09 — uppdragets källhänvisning till "PR #1034:s beskrivning" kunde INTE independent verifieras (sökt: grep mot task-169-kortet och PR-kommentarer, båda tomma träffar). Klass 5 räknas ändå som verifierad HYPOTES->BEVISAD via en ANNAN väg: jag reproducerade SAMMA rotorsaksklass (Kanal A fri substräng på skriptets filnamn) LIVE två gånger i denna session mot den ännu olastade hooken (grep-kommandon nekade felaktigt), vilket bekräftar mekanismen oavsett om PR #1034-källan gick att lokalisera.

Fix levererad (TASK-168): scripts/deny-facit-godkand-skrivning.sh Kanal A matchar nu kommando-POSITION (npm run <script> pos 0/1/2, node/direkt-exec pos 0/1, med exakt gräns EFTER '/' — inte fri suffix-match, vilket annars falsk-fällde körning av stämplingsskriptets EGEN testsvit eftersom det filnamnet råkar sluta på skriptnamnet). Kanal B kräver nu att skriv-vektorns MÅL (redirect-token, eller manifest-sökväg i SAMMA segment som tee/sed -i/jq -i) är manifestet, inte fri substräng över hela kommandot. Segmentering (;/&/|/$(/backtick) återanvänder deny-arbetsform-push.sh:s teknik, men med en MARKÖRSTRÄNG i stället för nyradstecken som separator — en nyrads-baserad segmentering visade sig FELAKTIGT splittra en heredoc-BODY (BD4-testfallet) i flera delar och skilde därmed en redirects mål från "godkand"-nämningen på nästa rad; fångat av testsviten själv under bygget (BD4 föll vid första implementationen, grönt efter marköromskrivningen) — se PR-beskrivningen för fullt differentialbevis.

Nya config-värden i .facit-policy.conf (FACIT_GODKANN_NPM_SCRIPT, FACIT_GODKANN_SKRIPT_NAMN) ersätter de tidigare hardkodade strängarna i hook-skriptet, per uppdragets krav #3.

L450/skarpbevis: settings.json ORÖRT (endast skriptets INNEHÅLL ändrat) — men EMPIRISKT MÄTT i denna session att den levande PreToolUse-hooken som facto avfyras mot HUVUDKATALOGENS kopia av scriptet (via ${CLAUDE_PROJECT_DIR:-.}), INTE mot denna worktrees redigerade fil (verifierat: huvudkatalogens scripts/deny-facit-godkand-skrivning.sh är fortfarande 194 rader = originalversionen; ett grep-kommando som borde släppas genom den NYA logiken nekades ändå av den GAMLA meddelandetexten). Detta är alltså INTE L450:s mitt-i-sessionen-omladdningsfråga utan en SEPARAT, redan dokumenterad worktree-isolering-fråga (CLAUDE.md § Worktree-isoleringens gräns). Skarpbevis för logiken levererat i stället via DIREKT manuell körning av denna worktrees skriptfil (hook-JSON på stdin, äkta deny-fall faller, de fem falsk-positiva klasserna släpper) — se PR-beskrivningen för fullt utdrag.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1036 (merge c0b2bcc3), armerad direkt och mergad genom kön; post-merge + CI + Push on main samtliga success på merge-commiten (orkestrerarens väktar-verifikat 2026-08-09). Hooken matchar nu kommando-POSITION/skrivform i stället för fri substräng: testsviten 27 -> 37 fall (0 röda, reproducerat x3), samtliga 10 ursprungliga deny-fall + 2 nya kedjade regressionsfall fäller fortfarande, de FEM mätta falsk-positiva klasserna släpps (differentialbevisat manuellt mot riktig policy-conf — de live-nekade kommandona ur klass 2/3 släpps nu). Nya config-värden i .facit-policy.conf ersätter hardkodning. settings.json orörd — ingen L450-skuld; skarpbevis via direkt manuell körning, bokfört i notes tillsammans med worktree-fyndet (hooken avfyras ur huvudkatalogens kopia) och käll-hypotesen för klass 5. DoD-belägg: #2 shellcheck 0 fynd + check:docs 14/14 (agentrapport/PR-kropp) · #3 kön + gröna runs ovan · #4 diffen = hook-skript + testsvit + policy-conf + kortet.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
