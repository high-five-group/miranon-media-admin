---
id: TASK-138
title: >-
  Fynd: check-thread-index.sh:s felmeddelande föreslår ett pipe-escape som inte
  fungerar
status: Done
assignee: []
created_date: '2026-08-04 12:11'
updated_date: '2026-08-26 04:15'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 223000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MÄTT 2026-08-04 (T119-passets agent, S96 slutbunt). scripts/check-thread-index.sh rad 122 (pipe-kolumnkontrollens fel-gren, rad ~119-125) skriver: "Fix: escapa pipe-tecken i titel/ingång som \| — annars läser varje maskinell läsare fel kolumn." Rekommendationen fungerar INTE: skriptets egen räkning (rad 119) är `PIPES="${line//[^|]/}"` — detta stryker bort ALLA icke-pipe-tecken ur raden, inklusive det inledande backslash-tecknet i \|, så en escapad pipe räknas fortfarande som en pipe i ${#PIPES}. Bekräftat oberoende (denna agent, isolerad bash-repro): `line="| \`T01\` | test \| pipe | active |"`; `PIPES="${line//[^|]/}"`; `${#PIPES}` gav 5 — samma antal som utan escape. Mätt av T119-passets agent (rapporterat: röd→grön först efter att literala pipe-tecken togs bort ur cellinnehållet helt — escape-vägen prövades och gav ingen ändring). ÅTGÄRDSRIKTNING (ej beslutad design): rätta felmeddelandet rad 122 till att rekommendera "undvik literala pipe-tecken i cellinnehåll" i stället för ett escape som inte verkar, och överväg ett testfall i scripts/test-check-thread-index.sh som prövar just detta (planterad rad med \| ska fortsatt fällas av kolumnkontrollen, för att bevisa att escape inte är en giltig kringgång).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Felmeddelandet i scripts/check-thread-index.sh (nuvarande rad ~122) rekommenderar inte längre ett pipe-escape som inte fungerar mot skriptets egen ${line//[^|]/}-räkning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AKTUALITETS-KONTROLL 2026-08-05 (S96 femte resumen, orkestreraren): PROBLEMET KVARSTÅR, men kortets radhänvisning är stale och underskattar omfattningen.

Kortet pekar på scripts/check-thread-index.sh rad 122. Den raden bär i dag ett helt annat felmeddelande (indexet saknas / bruten ryggrad). Den felaktiga escape-rekommendationen sitter på TVÅ ställen:

  rad 205: 'Fix: escapa pipe-tecken i titel/ingång som \| — annars läser varje maskinell läsare fel kolumn.'
  rad 346: 'Fix: escapa pipe-tecken i cellerna som \| — annars läser varje maskinell läsare fel kolumn.'

Filen har vuxit sedan mätningen (TASK-140 och TASK-141 landade grindar i samma skript: commits 335461e3, 513c244e, 0df78b2b). Radnumret 122 ärvdes alltså oprövat.

KONSEKVENS FÖR SCOPET: fixen ska röra båda förekomsterna, inte en. Ett testfall som bara täcker den ena lämnar den andra kvar som felaktig vägledning.

Kortet plockades och stoppades i detta pass — inte för att premissen föll, utan för att det ligger utanför S96:s scope (Marcus styrning 2026-08-05). Det är plockbart som det står, med radnumren ovan.

FIXAT 2026-08-26 (S112 fix-våg 4, bunt A). Radnummer omprövade mot origin/main (orkestrerarens tidigare aktualitets-kontroll 2026-08-05 sade 205/346 — VIDARE stale, filen har vuxit ytterligare): faktiska rader vid denna körning var 231 och 372. Bekräftat två förekomster, precis som notes förutsåg. Båda ändrade till "undvik literala pipe-tecken ... — ett \|-escape löser INTE detta, kontrollen ovan räknar ${line//[^|]/} ...". Tvåsidigt bevis: scripts/test-check-thread-index.sh fick nytt fall T29 (escapad pipe \| fälls ändå, samma klass som T8 men med det tidigare rekommenderade escapet påklistrat) — svit gick från 28 till 29 fall, alla 29 gröna (bash scripts/test-check-thread-index.sh, exit 0). T29 är själva det tvåsidiga beviset: om check-thread-index.sh NÅGONSIN börjar acceptera en escapad pipe (dvs om ${line//[^|]/}-mekaniken ändras) fälls T29 och flaggar att denna dokumentationsändring blivit fel igen. shellcheck --severity=style --enable=all (v0.11.0, CI:s pinnade version) mot scripts/check-thread-index.sh + scripts/test-check-thread-index.sh: exit 0.

DoD-avstämning S112 resume 1 (2026-08-26). DoD #1 (AC avbockade): 1/1 AC bekräftat [x] — check. DoD #2 (grindar gröna): shellcheck --severity=style --enable=all v0.11.0 (CI:s pinnade version) mot scripts/check-thread-index.sh + scripts/test-check-thread-index.sh exit 0, testsvit 29/29 grön (dokumenterat i notes ovan) — check. DoD #4 (inga orelaterade filer): git diff 2774937..efa98ffe (#1978:s förälder->merge) visar check-thread-index.sh + test-check-thread-index.sh + de bundlade bunt A-korten/nightly.yml — TASK-138:s egna filer är exakt dessa två skript, ingen vilsen fil — check. DoD #3 (CI grön per jobb) lämnas obockad, härledd via landningspekaren.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1978. Done-flipp S112 resume 1, 2026-08-26, post-merge efa98ffe74a4 success.
<!-- SECTION:FINAL_SUMMARY:END -->
