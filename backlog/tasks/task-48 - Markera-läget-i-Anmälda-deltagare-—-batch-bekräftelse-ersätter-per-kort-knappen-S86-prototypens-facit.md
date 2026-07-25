---
id: TASK-48
title: >-
  Markera-läget i Anmälda deltagare — batch-bekräftelse ersätter
  per-kort-knappen (S86-prototypens facit)
status: To Do
assignee: []
created_date: '2026-07-25 10:51'
labels: []
dependencies: []
ordinal: 109000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus omgranskning S86 (2026-07-25): solid/outline-knappen 'Skicka bekräftelse' inuti deltagarkorten dräper designen oavsett emphasis — löst med NYTT INTERAKTIONSFLÖDE i stället för färgjustering. Prototyp-pass (divergens A/B/C → **A vald**; konvergens steg 2–4; Marcus-låst 'Lås denna' 2026-07-25). Snapshots: tasks/sessions/bilagor/s86-deltagarkort-markering/ (k04-vilande + k04-markera-2-valda). Prototyp-SHA:er (branch proto/s86-deltagarkort-markering, mergas ALDRIG): 7263037 (divergens) → c8b0c01 → cf04096 → e617c8f/6f3179f (låsta steget). Research-belagt: explicit markera-läge = iOS edit-mode-/Material selection-klassen; batch-bar med live-count; GridList-primitiven för AT.

LÅSTA BYGGKRAV (facit):
1. Obekräftade-rubrikraden: 'Markera'-knapp (intent primary, sm) ERSÄTTER Bekräfta alla-pillen; i läget står 'Avbryt' (ghost, X-ikon) på samma plats. K47/K48-formen (Bekräfta alla + kontrollfråga på rubriken) RIVS ÖPPET — facit-revidering av S73/18.6.
2. Markera-läget: hela kortet är klickyta med checkbox-semantik; VALT kort: bg --mm-success-bg + kant --mm-success; Obekräftad-pillen FÖRSVINNER vid val (ingen 'Vald'-pill); kategori-pillen står kvar. Per-kort-knappen 'Skicka bekräftelse' (K46) RIVS HELT — även i vilande läge.
3. Batch-baren (i läget, ovanför kön): [Bekräfta X anmälningar — success solid, mutad vid 0, bredden LÅST på tvåsiffrig maxform via osynlig platshållare 'Bekräfta 99 anmälningar' + tabular-nums] [Markera alla — secondary, mutad när alla valda] [Rensa — ghost, vid ≥1] + sr-only aria-live med antal valda. Solid success förenlig med §19: baren är blockets primära handlingsyta.
4. Kön: max ~3 kort synliga (max-h ≈25.5rem) + inline scroll med scrollbar-inline-utilityn; klippet mitt i kort 4 är scroll-affordancen.
5. BEHÅLL skarpa kortets allt övrigt: Anmäld-radens länk + prefetch (K62/18.17), historikraden (K45), pillar/metayta — prototypens avsaknad av dem var förenkling, INTE facit. Vilande läge = befintliga kortet med sina länkar; markera-läget nås ENBART via Markera-knappen (prototypens kort-klick-öppning var förenkling).
6. Kontrollfrågan (PRD task-18 beslut 7): 'Bekräfta X' öppnar dialogen före sändning — massmutations-grinden oförändrad; bulken pessimistisk som idag.
7. A11y (11-ribban, research 2026-07-25): markera-läget byggs på RAC GridList selectionMode=multiple el. likvärdig aria-multiselectable-form; WCAG 1.4.1-bärare för valt tillstånd (diskret check-indikator/checkbox-slot) läggs till UTAN att ändra den Marcus-låsta visuella formen; Esc lämnar läget; scrollregionen tangentbordsnåbar.
8. Visual-baselines driftar avsiktligt → refresh i T87:s aktiveringssteg.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Markera-flödet levererat per de 8 låsta byggkraven med e2e + axe-0 (nya + befintliga deltagar-tester uppdaterade)
- [ ] #2 K46/K47/K48-rivningarna öppet bokförda i kod-kommentarer + spec; §19-audit-raden för Greta-fallet uppdaterad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
