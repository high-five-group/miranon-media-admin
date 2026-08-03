---
id: TASK-127.2
title: 'Skiva: Prototyp-passet — login + accept (tvåfas)'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-03 14:52'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-127
ordinal: 206000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tvåfas UI-prototyp (T66-formen) på de två skärmar som ÄR förstaintrycket: den omskrivna login-vyn och accept-sidan. Divergens: tre radikalt olika varianter växlingsbara på en route — Marcus väljer en. Konvergens: vinnaren itereras tills Marcus är helt nöjd. Facit matar byggskivorna; prototypkoden kastas eller absorberas enligt throwaway-kontraktet.

Täcker användarberättelser: 4, 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Divergensfasen visar tre radikalt olika varianter per skärm, växlingsbara på en route
- [x] #2 Marcus har valt EN vinnare per skärm
- [ ] #3 Konvergensfasen avslutad: Marcus helt nöjd och facit dokumenterat som underlag för byggskivorna
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DIVERGENSFASEN AVSLUTAD — MARCUS VAL (2026-08-03).

VALD VARIANT: B ("kontextrik och varm") för BÅDA skärmarna — login och accept. Marcus verbatim: "Jag väljer B på både logga in och välkommen, men vill iterera lite på dem."

De tre varianterna byggdes av tre oberoende bygg-agenter parallellt, var och en med en distinkt designhållning tilldelad av orkestreraren (A minimal/fokuserad, B kontextrik/varm, C snabb/självsäker) — parallell design enligt prototype-skillens NN/g-förankring, inte tre varianter av samma idé. PR: #653 (A + skarven), #652 (B), #655 (C); inkoppling #657 + #658.

KONVERGENSFASEN INLEDD samma dag. Marcus första omgång, verbatim:

LOGIN:
- "Istället för ett M som profilbild vill jag ha en bild på Roger och Lotta"
- "Ditt verktyg för event, anmälningar och gäster" -> "...och deltagare"
- "Allt som rör Miranon media event samlat på ett ställe, så du slipper leta" -> "typ 'Skräddarsytt efter dina preferenser'"
- De tre ikon-punkterna -> "Utveckla verktyget hur du vill i din egen takt", "24/7 support", "Alltid säker inloggning"

VÄLKOMMEN:
- "Ta bort ALLA breda bindestreck, jag gillar den smalare varianten typ (-)"
- "Logga in direkt efteråt - klart" -> "Logga in och upptäck ditt nya verktyg"

ORKESTRERARENS TOLKNINGAR, bokförda så de kan granskas:
1. Em-dash-regeln tillämpas på SYNLIG UI-text i HELA filen (båda skärmarna), inte bara accept-sidan där Marcus listade den. Skäl: typografisk preferens, och inkonsekvens inom samma variant vore sämre än en bredare tillämpning. Kodkommentarer/JSDoc rörs inte.
2. Bilden på Roger och Lotta FINNS INTE i repot (verifierat: public/ bär endast miranon-logo.svg, PWA-ikoner, favicon, screenshots/). Omgång 1 bygger en platshållare med rätt slutform; fotot är en öppen fråga till Marcus. En AI-genererad bild som föreställer verkliga personer är UTESLUTEN och föreslogs aldrig.

ÖPPEN FRÅGA TILL MARCUS (ställd 2026-08-03): em-dash-preferensens räckvidd. Mätt: appen bär 19 rader med em-dash i JSX-nära kod utanför prototypen. Gäller preferensen hela produkten - och i så fall hör den hemma i designsystemet eller ORDLISTA.md, inte som en prototyp-lokal ändring.

AC #2 (Marcus har valt EN vinnare per skärm) UPPFYLLD. AC #1 uppfylld vid divergensfasens leverans. AC #3 kvarstår tills konvergensen är avslutad och facit dokumenterat.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
