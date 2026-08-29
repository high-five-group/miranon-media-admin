---
id: TASK-344
title: >-
  Fynd: .review-policy.json:s prod-och-hemligheter-regel fångar inte
  .prod-functions-allowlist.conf — filen som ensam avgör vilka EF:er som når
  prod
status: To Do
assignee: []
created_date: '2026-08-29 16:34'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 630000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfynd (info/ask-user) på PR #2117 runda 2, 2026-08-29.

`.review-policy.json`s regel `prod-och-hemligheter` bär rubriken "Prod-vägar och hemligheter" och prövningstexten "Detta är en kandidat för risk.niva = 'hog'". Dess mönsterlista är:

  .env* · scripts/*prod* · supabase/functions/**/*.ts · *-policy.conf · *-policy.json

Den fångar INTE `.prod-functions-allowlist.conf` — filnamnet bär "allowlist", inte "policy", och filen ligger i repo-roten, inte under `scripts/`. Verifierat: `npm run review:policy -- --pr 2117 --json` gav `"policyRegler": []` för en PR vars ENDA ändrade fil är just den.

Det är ingen bugg i matchningslogiken — `scripts/lib/review-policy.mjs` matchar korrekt vad mönstren faktiskt säger. Det är en namnkonventions-lucka.

VARFÖR DET SPELAR ROLL: `.prod-functions-allowlist.conf` avgör ensam vilka Edge Functions som når prod. Den är precis den filklass regeln finns för. I dag når granskaren rätt slutsats bara om orkestreraren råkar be om det i uppdragstexten — regeln injiceras aldrig automatiskt, oavsett vilken granskare som kör. Instansen som avtäckte luckan (#2117) fick `hog` i runda 1 och `medel` i runda 2, båda på granskarnas egen bedömning, inte på en injicerad regel.

GÖR: (i) avgör om mönsterlistan ska utvidgas — kandidater: `.prod-*`, `*-allowlist.conf`, eller en explicit rad för just denna fil; väg mot att en för bred glob drar in filer regeln inte är skriven för; (ii) svep `.review-policy.json`s samtliga regler mot repo-rotens faktiska filnamn och bokför varje annan fil som borde matcha men inte gör det (samma klass av lucka kan finnas mer än en gång); (iii) landa ändringen med tvåsidigt bevis — en fil som SKA matcha gör det, en som INTE ska fortfarande inte.

Not: `.review-policy.json` läses av `hamta-review-policy.mjs` ur `origin/main` med `git show`, aldrig från disk (ADR-105 beslut 7) — en ändring får alltså effekt först när den landat, inte på grenen som gör den.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mönsterlistan avgjord: utvidgad så att .prod-functions-allowlist.conf matchar, ELLER motiverat orörd med skälet bokfört i .review-policy.json:s egen kommentar
- [ ] #2 Svepet i (ii) genomfört: varje repo-rots-fil som borde matcha någon regel men inte gör det är bokförd, åtgärdad eller motiverat orörd
- [ ] #3 Tvåsidigt bevis: npm run review:policy mot en PR som rör filen injicerar regeln; en PR som inte ska matcha gör det fortfarande inte
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
