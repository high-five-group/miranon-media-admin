---
id: TASK-128
title: >-
  Fynd: heartbeat-svepets armerings-kandidat fyrar på KÖADE PR:er —
  isInMergeQueue skiljer dem men efterfrågas aldrig
status: To Do
assignee: []
created_date: '2026-08-02 16:16'
updated_date: '2026-08-02 16:45'
labels: []
dependencies: []
ordinal: 215000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt två gånger under TASK-119:s första skarpa natt (2026-08-02, S96): PR #614 och PR #617 flaggades båda som ARMERINGS-KANDIDAT av scripts/heartbeat-svep.sh trots att båda var korrekt armerade och KÖADE. Disambigueringen skriptet självt föreslår (gh pr merge <nr> --auto --merge) svarade i båda fallen 'already queued to merge'.

SYMPTOM: varje PR som armeras och sedan når kön nollar autoMergeRequest (CLAUDE.md § Landning, tabellrad 2: 'PR:en redan CLEAN → köades direkt; inget autoMergeRequest skapas någonsin'). Skriptets kandidat-villkor är automerge==false && !draft && (CLEAN||UNSTABLE) — vilket alltså matchar VARJE framgångsrikt köad PR. Larmet fyrar på normalfallet.

FÖRVÄNTAT BETEENDE: en korrekt armerad och köad PR ska INTE larma. Kandidat-klassen ska bara fånga ALDRIG ARMERAD och UTSPARKAD-med-konsumerad-armering.

ORSAK: skriptets kommentar (rad 286-288) räknar upp TVÅ möjligheter bakom automerge==false och kallar dem 'INTE urskiljbara ur statiskt svar'. Verkligheten har TRE — den tredje är 'redan köad', och den ÄR urskiljbar: GraphQL-fältet isInMergeQueue finns på PullRequest-typen och kan hämtas i samma query. Empiriskt verifierat 2026-08-02 mot PR #617: {"autoMergeRequest":null,"isInMergeQueue":true,"mergeStateStatus":"CLEAN"}. Skriptets EGEN A3b-rubrik (rad 44) nämner isInMergeQueue som något gh pr merge kollar — fältet lästes förbi.

VARFÖR DET SPELAR ROLL: falsklarm på den viktigaste signalen är hur larm slutar läsas. Samma familj som L328/L443 — en vakt vars utslag inte går att lita på efterlevs inte.

ÅTGÄRDSRIKTNING (ej beslutad): lägg isInMergeQueue i GraphQL-queryn och exkludera köade PR:er ur kandidat-klassen; utöka testsviten med ett fall per riktning (köad → EJ kandidat, oarmerad → kandidat). Rör även skriptets kommentar och CLAUDE.md-tabellens läsning.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
EVIDENS FÖRSTÄRKT (S96-natten 2026-08-02, orkestreraren). Falsklarmet mättes SJU gånger under mekanismens första skarpa natt, inte två: PR #614, #617, och därefter #621, #623, #624 i ett enda svep (plus #617 upprepat två gånger till, level-triggered var 300:e sekund). Samtliga disambiguerade med 'already queued to merge'.

FIXEN VERIFIERAD MOT ALLA INSTANSER: gh api graphql mot PullRequest.isInMergeQueue gav true för #621, #623 och #624 samtidigt som autoMergeRequest var null och mergeStateStatus CLEAN. Fältet hade alltså tystat varje falsklarm korrekt utan att röra de äkta vägarna.

OPERATIV KOSTNAD MÄTT: bruset tvingade orkestreraren att höja svep-intervallet från 90 s till 300 s (skriptets dokumenterade --interval-flagga, mekanismen orörd) för att inte riskera att monitorn stängs av för många events. Det är en reell försämring av vaktens upplösning som fixen skulle återställa.
<!-- SECTION:NOTES:END -->
