---
id: TASK-181
title: 'Prototyp-pass: Segment-ytan (Bygg segment + sändvyn) → facit → promovering'
status: To Do
assignee: []
created_date: '2026-08-10 07:27'
updated_date: '2026-08-10 07:46'
labels:
  - ready-for-human
dependencies: []
priority: high
ordinal: 347000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus granskning 2026-08-10 (S102, i T55 steg 1): funktionaliteten sitter ('verkar väl sitta') men sidan är EJ designad — 'hela sidan måste designas om och gå genom promoveringsformen precis som person-vyn, persondetalj och check-in'. Detta är samma krav byggplanen rad 120 redan bokför (S91 premiss 1+2): Segment är en av de FEM facit-lösa ytorna som ska genom kedjan prototyp → Marcus väljer → facit → PRD → skivor innan Fas 6 stängs.

Omfattar: Bygg segment-sidan + sändvyn (SegmentBuilder.tsx + SegmentMailCompose.tsx, route /mer/segment). T50-härdningens tre skyddslager (skriv-för-att-bekräfta, mottagarkontroll, pessimistisk bulk) är FUNKTIONSKRAV som överlever omdesignen — formen är fri, skyddet är det inte. Körs per /prototype-skillens tvåfas-form (divergens → konvergens) + promoveringskontraktet (ADR-102/103/104, plugin 1.33.0).

Sekvens: går i HITL-kön efter T97-passen (personer-listan pågår, persondetalj + check-in väntar) — Marcus äger ordningen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Divergens-pass genomfört, Marcus har valt variant
- [ ] #2 Konvergens till Marcus 'helt nöjd'; facit låst med stämpel via !-kanalen (ADR-104)
- [ ] #3 T50-skyddslagren intakta i den nya formen (arch-audit-klassens verifikat)
- [ ] #4 PRD + skivor mintade ur facit (promoveringskontraktet)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FORM-KRAV (Marcus 2026-08-10, S102 — Lottas trygghetstriad, samma klass som 147.10): segment-redesignen SKA bära (1) förhandsvisning av mailet som mottagaren ser det, (2) synlig lista över alla mottagaradresser, (3) 'Skicka test till mig'-knapp (T53/147.10-mönstret via den reviderade sändvägen). T50-skyddslagren + trygghetstriaden är formens golv.

FUNKTIONSFYND (Marcus 2026-08-10, S102, vid T55 steg 1-granskningen): det går INTE att bygga ett segment med en handplockad individ — segmenten är enbart filterbaserade (compute-segment). 'Välj personer manuellt' (t.ex. ett en-persons-segment för testutskick) är ett upptäckt funktionskrav som passet ska ta ställning till. Instansen bekräftar passets hela poäng: vid design avtäcks funktionerna — därför finns inga byggskivor för ytan förrän facit är låst (byggplan rad 120-ordningen).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
