---
id: TASK-96
title: >-
  Fynd: CONTRIBUTING § Revert-vägen instruerar enligt formerna som §
  Landnings-ordningen förklarat upphävda
status: To Do
assignee: []
created_date: '2026-07-30 19:22'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 176000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`CONTRIBUTING.md` § Landnings-ordningen säger sedan 2026-07-29 (`TASK-70.1`): *"MEKANISERAD — den manuella sekvenseringen nedan är UPPHÄVD"* och *"Armera med gh pr merge --auto --merge och sluta tänka på ordningen."*

Revert-sektionen längre ned i samma fil instruerar ändå enligt de upphävda formerna: revert-PR:n armeras FÖRST, andra landningsklara PR:er får vänta och uppdateras efteråt, *"det är form B i sektionen ovan"*, och att armera samtidigt med en annan PR är *"precis den fälla § Landnings-ordningen beskriver"*.

Upptäckt 2026-07-30 (S91 artonde resumen) under åtgärdandet av samma klass i `.claude/agents/bygg-agent.md`, där BEHIND-motiveringen var falsifierad av `CLAUDE.md` § Landning.

DETTA ÄR INTE EN TEXTRÄTTELSE. Under en merge queue köar en revert-PR bakom det som redan står i kön, så brådskan kan ha ett kvarvarande behov — men mekanismen som beskrivs (håll tillbaka andra, armera först) är inte längre den som gäller. Frågan måste avgöras innan texten skrivs om.

Revert-vägen byggdes och övades i `TASK-70.5`; den övningen är underlaget.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Frågan besvarad FÖRE omskrivningen: behöver en brådskande revert-PR företräde i kön, och finns i så fall en mekanism för det — eller är behovet borta med kön? Utfallet skrivet, även om svaret är att inget behov kvarstår
- [ ] #2 Revert-sektionen säger samma sak som § Landnings-ordningen om armering och ordning — motsägelsen borta, inte lappad med en brasklapp
- [ ] #3 Bygg-agentens kontrakt i revert-tabellen konsistent med .claude/agents/bygg-agent.md, som rättades 2026-07-30
- [ ] #4 Hela CONTRIBUTING.md svept efter fler referenser till formerna A och B — utfallet redovisat även om det är noll
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
