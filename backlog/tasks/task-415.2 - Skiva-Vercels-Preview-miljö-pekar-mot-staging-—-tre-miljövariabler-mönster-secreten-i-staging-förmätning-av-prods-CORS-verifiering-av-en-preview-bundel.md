---
id: TASK-415.2
title: >-
  Skiva: Vercels Preview-miljö pekar mot staging — tre miljövariabler,
  mönster-secreten i staging, förmätning av prods CORS, verifiering av en
  preview-bundel
status: To Do
assignee: []
created_date: '2026-09-06 11:16'
updated_date: '2026-09-06 12:26'
labels:
  - ready-for-human
dependencies:
  - TASK-415.1
parent_task_id: TASK-415
ordinal: 724000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus händer (Vercel-projektets miljövariabler och prods CORS-läsning ligger bakom prod-låset). Steg: (1) FÖRMÄTNING: varför fungerar previews mot prod i dag? Marcus kör i sin egen terminal en OPTIONS-preflight mot en prod-EF med Origin satt till en verklig preview-origin och läser Access-Control-Allow-Origin — svarar prod med origin är prods CORS-lista bredare än stagings (eget fynd-kort: smalna av); svarar den 403 fungerade previews aldrig fullt ut mot prod (bokför). (2) I Vercel (Settings → Environment Variables) för target Preview ENBART: VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY = stagings värden (ur .env.staging), VITE_FEATURE_BETALNINGAR=pa; Production orörd. (3) Sätt secreten CORS_ALLOWED_ORIGIN_PATTERNS i staging-projektet (agent kan göra detta i 415.1 om Marcus vill — staging-refen är tillåten). (4) Trigga ett förhandsbygge (valfri PR-push) och verifiera: bundeln bär stagings host och inte prods (samma grep-metod som research-passets mätning), appen laddar och inkorgen visar stagings data. (5) Uppdatera ADR-132 § Konsekvenser + TASK-415:s riskformulering med rättelsen att Deployment Protection är PÅ. Förkrav: 415.1 landad och deployad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Förmätningen av prods CORS bokförd verbatim (svar + slutsats) i kortet
- [ ] #2 Preview-target bär stagings tre värden; Production oförändrad (skärmdump eller vercel env ls i kortet)
- [ ] #3 En ny preview-bundel innehåller stagings Supabase-host och ingen prod-host, grep-bevis i kortet; appen laddar i previewen
- [ ] #4 ADR-132 och TASK-415 rättade om Deployment Protection
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
NYTT FÖRSTA STEG (Marcus beslut 2026-09-06, efter granskning av TASK-415.1/PR #2388):

Granskningen av #2388 fann att ett CORS-mönster ankrat på `*.vercel.app` med
bara projektnamnet som literal ("https://miranon-media-admin-*.vercel.app")
är SPOOFBART — projektnamn på Vercels delade `vercel.app`-namnrymd är inte
globalt reserverade åt oss, så vem som helst kan skapa ett eget Vercel-projekt
med matchande prefix och få en OPTIONS-preflight godkänd av staging-EF:erna.
Marcus beslut (verbatim): "Vänta tills preview domänen finns."

Konsekvens för DENNA skiva: innan miljövariablerna sätts i Vercels
Preview-target (steg 2 nedan) och innan CORS_ALLOWED_ORIGIN_PATTERNS sätts på
nytt i staging (steg 3), måste förhandsvisningarna få en EGEN adress under en
domän vi äger — annars är mönstret återigen spoofbart av konstruktion.

NYTT STEG 0 (FÖRE nuvarande steg 1–5, Marcus händer + DNS):

1. Vercel Preview Deployment Suffix (Pro-tillägg,
   https://vercel.com/docs/deployments/preview-deployment-suffix) mot en egen
   underdomän under miranon.dev — t.ex. `preview.miranon.dev` — i stället för
   `vercel.app`. Kräver att domänen (eller en delegerad subdomän) pekar mot
   Vercels namnservrar.
2. Wildcard-DNS hos GoDaddy för den valda subdomänen (`*.preview.miranon.dev`
   eller motsvarande) — `gddy`-CLI:t finns redan i repot/hubben (skill `gddy`)
   för att söka/hantera DNS-poster; använd det i stället för GoDaddys
   webbgränssnitt där det räcker.
3. Verifiera att en NY förhandsvisning faktiskt får adressen under den egna
   domänen (inte längre `*.vercel.app`) innan nästa steg påbörjas.

Ordningen är BINDANDE: miljövariablerna (nuvarande steg 2) och
mönster-secreten (nuvarande steg 3) sätts FÖRST EFTER att suffix-domänen är
verifierat i drift — annars upprepas exakt den spoofbarhet som stoppade
TASK-415.1:s armering. Mönstret i staging blir därefter
`https://*.preview.miranon.dev` (eller den exakta domän Marcus väljer i
steg 0.1) i stället för `https://miranon-media-admin-*.vercel.app` /
`https://miranon-media-ad-git-*.vercel.app` — de två sistnämnda är nu
BORTTAGNA ur staging (TASK-415.1, samma dag) i väntan på detta.
<!-- SECTION:NOTES:END -->
