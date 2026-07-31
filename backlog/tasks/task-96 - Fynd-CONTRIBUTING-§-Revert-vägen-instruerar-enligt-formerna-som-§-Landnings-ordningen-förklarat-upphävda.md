---
id: TASK-96
title: >-
  Fynd: CONTRIBUTING § Revert-vägen instruerar enligt formerna som §
  Landnings-ordningen förklarat upphävda
status: To Do
assignee: []
created_date: '2026-07-30 19:22'
updated_date: '2026-07-31 07:47'
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
- [x] #1 Frågan besvarad FÖRE omskrivningen: behöver en brådskande revert-PR företräde i kön, och finns i så fall en mekanism för det — eller är behovet borta med kön? Utfallet skrivet, även om svaret är att inget behov kvarstår
- [x] #2 Revert-sektionen säger samma sak som § Landnings-ordningen om armering och ordning — motsägelsen borta, inte lappad med en brasklapp
- [x] #3 Bygg-agentens kontrakt i revert-tabellen konsistent med .claude/agents/bygg-agent.md, som rättades 2026-07-30
- [x] #4 Hela CONTRIBUTING.md svept efter fler referenser till formerna A och B — utfallet redovisat även om det är noll
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Landat i CONTRIBUTING.md (en fil) + ett lesson-fragment.

AC #1 — frågan besvarad FÖRE omskrivningen. Research-passet
docs/research/kohopp-bradskande-revert-2026-07-30.md (2026-07-30) avgjorde den;
inget nytt pass kördes. Utfall: behovet av kö-företräde är BORTA. Skrivet in i
§ Revert-vägen som fyra mätta skäl — kö-väntan median 16 s / p90 27 s / max
5 min 8 s över 30 landningar; straffet inverterat mot brådskan (de tre poster som
betalade >240 s var docs grupperade med kod-PR, kod-grannarna 14–23 s, ingen
kod-post över 30 s); jump finns men omordnar bara kön och kan inte förarmeras;
--admin stängd (current_user_can_bypass: never, tom bypass-lista).

Passets STÖRRE fynd bars också in: exponeringsfönstret var fel i filen. Under kön
passerar varje PR TVÅ CI-lopp (PR-grind + kö-bygge). Mätt över 45 landade PR:er:
kod 435 s + 449 s → ca 15 min, docs 73 s + 75 s → ca 3 min. Filens gamla tal —
omkring åtta minuter / drygt en — mättes 2026-07-28 före kön och saknade
kö-bygget. Rättelsen är öppet bokförd i texten.

AC #2 — motsägelsen borttagen, inte lappad. Revert-sektionens köordnings-stycke
(revert-PR:n armeras FÖRST, andra får vänta, det är form B) ersatt av
Brådskan ändrar inte heller ordningen + den mätta grunden. Steg 3:s
Blir revert-PR:n BEHIND gäller form B ersatt av att kön själv uppfyller
up-to-date-kravet.

AC #3 — bygg-agent-kontraktet konsistent med .claude/agents/bygg-agent.md
(läst, ej ändrad). Instruktionen armerar aldrig mergen står kvar; motiveringen
bytt till agentfilens faktiska grund: kön ser inte två diffar som mergar rent men
är fel tillsammans, och agenten kan inte se sina syskonagenter. Orkestrerar-raden
rättad: den sa sekvenserar kön — kön sekvenserar.

AC #4 — svep av hela filen. SEX ställen fanns; fyra läste som gällande
instruktion och är åtgärdade (revert-köordningen, revert-steg-3, bikostnad som
hör till form B, avgränsningen som påstod att merge queue är en egen öppen post
tills den finns). Två är avsiktlig historik och rörs inte: de överstrukna
Form A/Form B-punkterna och MEKANISERAD-styckets omnämnande av dem. Efter
ändringen ger en skiftlägesokänslig sökning på form A/form B/formerna tre
träffar, samtliga inuti det bevarade historik-blocket.

Grind: npm run check:docs → exit 0, 10/10 gröna, noll skippade.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
