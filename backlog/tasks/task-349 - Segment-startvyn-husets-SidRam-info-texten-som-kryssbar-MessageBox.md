---
id: TASK-349
title: 'Segment-startvyn: husets SidRam + info-texten som kryssbar MessageBox'
status: Done
assignee: []
created_date: '2026-08-31 08:51'
updated_date: '2026-08-31 10:39'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 653000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus S114-scope punkt 2+3 (kvitterad 2026-08-31, sessionsdok S114 Del 1). Verifierat tillstånd: startvyn SegmentLista (src/components/segment/prototyp/VariantD.tsx, header rad ~1896–1916) saknar tillbaka-navigering till Mer-menyn helt; filen bär en LOKAL SidRam-kopia (rad ~1127–1155) i stället för husets primitiv src/components/primitives/SidRam.tsx (ADR-126; används av Intresserade/Maillogg/Väntelista/Aktivitetshistorik med 'Tillbaka till Mer'). Info-texten under h1 ('Urval av personer som du kan skicka riktade mail till. …', rad ~1911–1915) är en ren <p> — ska bli MessageBox intent=info (src/components/primitives/MessageBox.tsx, kryssbar per KRYSS-REGELN), dismiss minns per enhet via localStorage (try/catch, rendera korrekt utan lagrat värde). Konsolidera bort den lokala SidRam-kopian: startvyn får husets SidRam (länk till /mer), interna vy-byten använder SidRamKnapp. Ytan är facit-stämplad (tasks/sessions/bilagor/s104-segment-divergens/facit.json) — ändringen går via ADR-102 § amenderings-mekaniken (klassning utskriven, sidofil) och ariaSnapshot-referenserna uppdateras i samma PR. Filen är read-only-förstärkt (no-op-mutationer) — det ändras INTE av detta kort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Startvyn /mer/segment bär husets SidRam med Tillbaka till Mer (chevron), samma anatomi som Intresserade-sidan
- [x] #2 Info-texten renderas som kryssbar MessageBox intent=info; kryss minns per enhet (localStorage med try/catch); texten oförändrad verbatim
- [x] #3 Lokala SidRam-kopian i VariantD.tsx borttagen; interna vyer använder husets SidRam/SidRamKnapp; inga beteendeskillnader i vy-bytena
- [x] #4 Facit-amendering per ADR-102 med utskriven klassning + sidofil; ariaSnapshot-referenser uppdaterade och gröna
- [x] #5 DoD-grindarna gröna (test:api, typecheck, biome, build) + berörda acceptance-sviter
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ADR-102-KLASSNING: (c) — prod-synlig utvidgning (ny SidRam-chevron på
startvyn + MessageBox-inramning/kryss på info-texten). Marcus-grund citerad
i sidofilen (S114 Del 1 scope-kvittens, "Kvitterar."). godkand-fältet i
facit.json är INTE rört av denna commit (agent-fryst av ADR-104-hooken) —
sidofil: tasks/sessions/bilagor/s104-segment-divergens/AMENDERING-2026-08-31-startvyns-sidram-och-messagebox.md.

ARIASNAPSHOT-REFERENSER: mätt oförändrade. tests/visual/segment-promoverings-grind.spec.ts
14/14 gröna, git status --porcelain tests/visual/ = 0 rader — ingen
--update-snapshots kördes eller behövdes, eftersom SidRam/SidRamKnapp och
MessageBox renderas som syskon-noder FÖRE respektive testid-div, aldrig som
barn (samma strukturella avgränsning som PrototypRigg/SkalprovsVaxel i
samma spec-fils huvud).

test:api — EN förbisedd, ORELATERAD flake: tests/api/generate-event-attachment.staging.test.ts
AC #1 (TASK-340.1, "preview bär kallhash → Skapa med samma hash
PROMOVERAR") faller i FULL svit (1682 passed / 1 failed, två oberoende
körningar) men GRÖN i isolerad körning
(PLAYWRIGHT_NO_WEB_SERVER=1 npx playwright test --project=api-staging
tests/api/generate-event-attachment.staging.test.ts -g "AC #1" → 2 passed).
Feature-ytan (event-bilage-generering, kallhash-promovering) har ingen
koppling till denna skivas diff (segment/SidRam/MessageBox). Bedöms som
pre-existing test-ordning/delat-state-flake i den filen, inte en regression
från detta kort — bokfört öppet, inte tyst.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Husets SidRam (länk /mer) tillagd på startvyn SegmentLista — saknades helt
innan. Info-texten under h1 konverterad till kryssbar MessageBox intent=info
med localStorage-baserad per-enhet-dismiss (segment-startinfo-minne.ts, nytt
litet modul, try/catch-mönster som betalsatt-minne.ts). Lokal SidRam-kopia
(TILLBAKA_KLASS, ChevronLeft, lokal SidRam-funktion) helt riven; alla sex
interna onTillbaka-chevroner (segment-detaljvyn, verkstaden,
nytt-segment-mallvyn, generatorn, utskicksvyn x2) konsoliderade till husets
SidRamKnapp. ADR-102-amendering skriven som sidofil (klass c, Marcus-grund
citerad ur S114 Del 1). ariaSnapshot-referenserna för samtliga sju
facit-ytor mätt oförändrade (14/14 gröna, noll diff på disk) — ändringen
ligger strukturellt utanför varje testid-scope. Grindar: typecheck/biome/
build/langa-streck gröna; test:api 1682/1683 (en orelaterad, pre-existing
flake i generate-event-attachment.staging.test.ts, grön i isolering);
segment-promoverings-grind.spec.ts 14/14; mer-segment.acceptance.test.ts
8/8 (inkl. axe 0 violations).

Landning: PR #2172 (merge 3bac4ca9fbbddea4788980e66a24df362b18f654, 2026-08-31 ~10:09 UTC) · post-merge-verifikat mätt av stängningsbatchen: merge_group CI run 33380173479 conclusion success, kört direkt mot 3bac4ca9. OVÄNTAT, bokfört öppet: INGEN separat push-triggad CI/Post-merge-körning finns för 3bac4ca9 specifikt — nästa landning (PR #2173, merge 1a0fd816) skedde ~2 sekunder senare och GitHubs push-webhook mot main konsoliderade båda till EN körning mot 1a0fd816 (push CI run 33381120523 success, Post-merge run 33381120434 success). git merge-base --is-ancestor 3bac4ca9 origin/main bekräftar 3bac4ca9 som ancestor till 1a0fd816 — koden är därmed täckt av den gröna post-merge-körningen på 1a0fd816, men bär ingen egen isolerad post-merge-signal.
<!-- SECTION:FINAL_SUMMARY:END -->
