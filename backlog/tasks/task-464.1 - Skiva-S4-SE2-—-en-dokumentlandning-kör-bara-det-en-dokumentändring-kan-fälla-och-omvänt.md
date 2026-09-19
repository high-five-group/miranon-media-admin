---
id: TASK-464.1
title: >-
  Skiva: S4 + SE2 — en dokumentlandning kör bara det en dokumentändring kan
  fälla, och omvänt
status: To Do
assignee: []
created_date: '2026-09-18 22:39'
updated_date: '2026-09-19 10:06'
labels:
  - ready-for-agent
dependencies:
  - TASK-450.5
parent_task_id: TASK-464
priority: high
ordinal: 804000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
En ren markdown-landning kostar i dag 35 fakturerade minuter (mätt på #2517: 10 + 9 + 9 + 2 + 5 över fem körningar). Av dem är 4 minuter dokumentgrindar och 1 minut klassning; resten prövar kod som inte ändrats (docs/research/actions-minutbudget-2026-09-18.md § S4/S5). Sådana landningar är 68 % av alla landningar och 22 % av minuterna.

S4: typkontroll och Biome flyttas bakom kodvillkoret, så att en D0-klassad ändring kör dokumentgrindarna + klassningen + aggregatorn och inget mer. SE2 (åtgärdsplanen docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md § SE2) är spegelbilden: de tio alltid-på dokumentationsgrindarna i lint-jobbet (regionen paritet:start docs-grindar-ci) flyttas bakom dokumentvillkoret. De byggs i SAMMA ändring — annars blir lintjobbets grindmängd motsägelsefull, och scripts/check-listparitet.sh tvingar ändå listorna att följas åt.

SE2 är formellt en försvagning (en kodändring granskas av färre kontroller) och krävde ägarens GO: givet i Marcus beslutade sekvens 2026-09-18 (sessionsdok S126 § Paushistorik paus 2, MARCUS-SEKVENS punkt 3) och bekräftat 2026-09-19 (Del 11). VILLKOR, ifrågasätt underifrån: pröva VAR OCH EN av de tio grindarna — kan en REN KODÄNDRING fälla den (t.ex. en länk från ett dokument till en kodfil som döps om eller tas bort)? Ja ⇒ grinden stannar på kodändringar. Bara grindar som bevisligen enbart kan fällas av dokumentändringar flyttas. Villkora på JOBB-nivå så att ingen runner startar; ett jobb på 10 sekunder faktureras som en hel minut, gånger fyra ytor.

Beroende: K1 (b) (TASK-450.5) rör samma fil och ska ha landat först. N4 (aggregatorns needs-vakt) är landad.

Täcker användarberättelser: 1, 3, 4 (TASK-464)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Kontrastpar, mätt med gh run view --json jobs: en D0-klassad PR startar ingen runner för typkontroll eller Biome; en kod-PR kör båda oförändrat
- [ ] #2 Per flyttad dokumentgrind finns ett skrivet svar i PR-kroppen på frågan 'kan en ren kodändring fälla den?' — varje grind med svaret ja står kvar på kodändringar
- [ ] #3 Aggregatorn ci-passed förblir fail-closed: skipped godkänns ENDAST för de jobb som villkorats här; scripts/check-aggregator-needs.mjs, scripts/check-listparitet.sh och gate-proof gröna
- [ ] #4 npm run verify:ci-parity:fast grön; .ci-parity-policy.json och .listparitet-policy.conf följer med; CLAUDE.md-prosan om lintjobbet rättas endast där den blivit falsk, med mätta tal
- [ ] #5 PR-kroppens sektion 'Kostnad i två mått': fakturerade minuter för en ren markdown-landning före (35, #2517) och efter, mätt per yta på en verklig körning, plus väntetid före/efter och månadseffekt vid 1 279 landningar
- [ ] #6 Inget verkligt skydd borta: säkerhetsskanning, tillgänglighets- och hermetikjobb samt review-backstoppen kör exakt som förut på kodändringar — bevisat med jobblistan från kod-PR:en i kontrastparet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTT EFTER LANDNING (S126, 2026-09-19) — AC #1 kontrastpar + AC #5 båda måtten. D0-sidan: #2572 (ren dokumentbunt, första D0-landningen efter S4+S5), körningar 35436151621 (pull_request), 35436267000 (merge_group), 35436352861 (push): 'Lint + TypeCheck', 'Test suite', 'Audit dependencies' och 'Review-backstopp' SKIPPED på alla tre ytorna; körde gjorde endast 'Detect changed files' (11–16 s), 'Docs link check' (60–69 s), 'CI Passed or Skipped' (3 s). Ingen CodeQL-körning på merge-commiten 2a825562. Kod-sidan: #2564:s egna checks (Lint + TypeCheck pass 4m5s) och push-körningen på c5fdc75c (CI + CodeQL körde). VÄNTETID per runda: 1,5 min (förslag) + 1,3 min (kö) = 2,8 min — FÖRE 4,1 + 4,3 = 8,4 min (#2565, samma dag). FAKTURERAT per dokumentlandning: 4 + 3 + 4 + 2 = 13 min — FÖRE 31 min (#2565; 35 min på #2517). Alltså −58 % fakturerat och −67 % väntan; bygg-agentens härledda 23–25 min var för pessimistiskt. Observation: 'Docs link check' ligger PÅ minutgränsen (60–69 s ⇒ fakturerar 1 eller 2 min per yta) — under 60 s stabilt vore värt ~1 min × 3 ytor per dokumentlandning. PR→main-tiden (9 min 54 s) är INTE jämförbar: PR:en rebasades och pushades om mitt i (krock i instrumenteringsloggen mot S127).
<!-- SECTION:NOTES:END -->
