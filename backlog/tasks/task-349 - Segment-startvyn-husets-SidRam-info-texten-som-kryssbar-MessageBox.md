---
id: TASK-349
title: 'Segment-startvyn: husets SidRam + info-texten som kryssbar MessageBox'
status: To Do
assignee: []
created_date: '2026-08-31 08:51'
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
- [ ] #1 Startvyn /mer/segment bär husets SidRam med Tillbaka till Mer (chevron), samma anatomi som Intresserade-sidan
- [ ] #2 Info-texten renderas som kryssbar MessageBox intent=info; kryss minns per enhet (localStorage med try/catch); texten oförändrad verbatim
- [ ] #3 Lokala SidRam-kopian i VariantD.tsx borttagen; interna vyer använder husets SidRam/SidRamKnapp; inga beteendeskillnader i vy-bytena
- [ ] #4 Facit-amendering per ADR-102 med utskriven klassning + sidofil; ariaSnapshot-referenser uppdaterade och gröna
- [ ] #5 DoD-grindarna gröna (test:api, typecheck, biome, build) + berörda acceptance-sviter
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
