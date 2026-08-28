---
id: TASK-271
title: >-
  Sändytan skarp — sparande och sändning kopplas till riktiga EF:er (spec-frö,
  kräver grillning)
status: To Do
assignee: []
created_date: '2026-08-17 12:10'
updated_date: '2026-08-28 05:10'
labels:
  - ready-for-human
dependencies: []
ordinal: 487000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
HÅLET bokfört på Marcus fråga 2026-08-17 (S104 stängning): segment-ytans FORM är promoverad och skarp, men 'Spara segment' och 'Skapa utskick' är fortfarande SIMULERADE i klienten (setTimeout-no-op, fabricerade ID:n — 249.5-rapporten + utredningens r.210-214-belägg). SERVERSIDAN ÄR KLAR: save-segment + send-email-EF:erna finns, är prod-deployade (38/38, 2026-08-17) och bär hela regelspråket inkl. tidsperioden (249.3). Segment-tabellen i prod är TOM (utredningens fynd — data-model.md rad ~458:s '9 legacy-rader' var fel). KRINGVILLKOR som specen måste ta: mail-låset deny-resend-send (Rogers krav) · consent-golvet {Ej godkänd för mailutskick} (aldrig fällt skarpt, 0 i hela basen) · aktivitetslogg-verb för utskick · 'Prototyp – ingenting sparades'-notens öde (task-258/259-bokfört: den TAS BORT först när sparandet är riktigt — den ljuger annars) · utredningens K2-idé (två förhandsvisningsexempel, namngiven + namnlös) som valdes bort ur K1:s AC. DETTA ÄR ETT SPEC-FRÖ, inte en byggbar skiva: nytt designarbete → börjar med GRILLNING till samsyn (konstitutionens normalstart) → PRD → skivor. Källor: S104 sessionsdok Del 10 · PRD task-249 final summary · docs/research/utskickspublikens-leads-och-namnlosa-2026-08-17.md.
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
AC saknas medvetet: kortet är explicit 'ETT SPEC-FRÖ, inte en byggbar skiva: nytt designarbete → börjar med GRILLNING till samsyn (konstitutionens normalstart) → PRD → skivor.' Kräver grillning med Marcus om kringvillkoren (mail-låset deny-resend-send, consent-golvet, aktivitetslogg-verb, prototyp-notens öde, K2-idén) innan PRD/AC kan skrivas. Källa: kortets egen Description. Verifierat av registerhygien-passet 2026-08-28 (redan taggat ready-for-human).
<!-- SECTION:NOTES:END -->
