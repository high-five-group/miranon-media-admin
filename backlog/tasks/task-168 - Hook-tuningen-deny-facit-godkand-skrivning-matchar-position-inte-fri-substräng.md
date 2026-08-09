---
id: TASK-168
title: >-
  Hook-tuningen: deny-facit-godkand-skrivning matchar position, inte fri
  substräng
status: To Do
assignee: []
created_date: '2026-08-09 07:18'
updated_date: '2026-08-09 08:30'
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
- [ ] #1 De tre mätta falsk-positiva klasserna släpps igenom — tvåsidigt bevisat i testsviten
- [ ] #2 Samtliga befintliga deny-fall fäller fortfarande — ingen försvagning av skyddet
- [ ] #3 Skarpbevis eller öppen skuld bokförd per L450-regeln
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FJÄRDE mätta falsk-positiva klassen (2026-08-09, S93): ett backlog task create-anrop vars DESCRIPTION-text NÄMNER stämplingskommandot fälldes av hooken — payload-text i ett CLI-anrop är inte en anropsväg. Omformulering krävdes för att publicera skiva 171.4. Substräng-matchningen träffar alltså även kort-/dok-TEXT som passerar genom Bash-argument, inte bara faktiska kommandon.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
