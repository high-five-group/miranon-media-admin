---
id: TASK-340.3
title: >-
  Skiva: dokumentationen — ADR-124/125 § Updates, determinism-rättelsen i
  docraptor-minimaltest, T176
status: To Do
assignee: []
created_date: '2026-08-29 08:18'
updated_date: '2026-08-29 10:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-340.1
parent_task_id: TASK-340
ordinal: 622000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan bokför repot flödesbytet öppet: ADR-124 § Updates (preview-svaret bär Källhash; Skapa promoverar utkastet via copy vid likhet; beslut 1–2 och 4 oförändrade; beslut 5:s mätregel styr option C-mätningen i TASK-340.4); ADR-125 § Updates (E: Skapa är ersättning när en rad finns för event × Mall — EF-uppslag, aldrig klientens val); docs/research/docraptor-minimaltest-2026-08-22.md rättas där 'byte-för-byte identiska' påstås — mätningen var byte-ANTAL ur x-pdf-bytes (research 2026-08-29 § 2.3, ADR-083-klassen), rättelsen skrivs som daterad not, aldrig tyst omskrivning; tråd T176:s indexrad noterar att listfrågan hänger på detta beslut. Inga kodändringar. Täcker användarberättelser: 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ADR-124 och ADR-125 har daterade § Updates-rader med besluten och skälen; ingen ny ADR (check-adr-räkningen oförändrad)
- [x] #2 docraptor-minimaltest-2026-08-22.md bär en daterad rättelse-not vid det felaktiga påståendet med pekare till research-filen § 2.3; T176-raden uppdaterad; check-thread-index.sh exit 0
- [x] #3 npm run check:docs exit 0 (14 gröna)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön — promovering, hash-verifiering och ersätt-uppslag bor i EF/_shared
<!-- DOD:END -->
