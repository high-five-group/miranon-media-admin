# Ett "förekommer inte"-fynd mot installerad paketkod kräver rekursiv sökning, inte en ytlig grep

**[UNIVERSAL] En granskningsagent flaggade ett warning-fynd baserat på en
ytlig grep mot `node_modules` som inte hittade det den letade efter — och
drog slutsatsen att egenskapen saknades, i stället för att slutsatsen var
att sökningen var otillräcklig.** Mätt 2026-09-08 (S124 Del 6, PR #2467
runda 1, `tasks/sessions/2026-09-08-session-124.md`): granskaren påstod att
RAC-popovrarna (react-aria-components) saknade eget z-index och därför
kunde döljas av TabBarens nya `z-30`. Bygg-agentens premiss-pass fällde
påståendet med en REKURSIV sökning i den faktiskt installerade paketkoden
och fann att `useOverlayPosition.mjs` (rad ~191) sätter `zIndex: 100000`
inline på varje Popover — egenskapen fanns hela tiden, den ytliga sökningen
missade den bara. Regel: ett "X förekommer inte"-påstående om beteende som
härrör från tredjepartskod (ett bibliotek, en installerad modul) kräver en
rekursiv sökning i den faktiska källan — top-level-filer eller en enda
grep-träff räcker inte — innan det får bli ett granskningsfynd. En
granskningsprocess (review-kontraktets researchmetod) som konsulterar
installerad paketkod bör kräva rekursiv sökning som lägsta form.
