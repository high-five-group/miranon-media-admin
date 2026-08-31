---
id: TASK-352
title: >-
  Fynd: fallerat/väntande kvitto saknar durabel Skicka-handling — retry-ytan var
  transient komponent-state
status: To Do
assignee: []
created_date: '2026-08-31 10:10'
updated_date: '2026-08-31 10:14'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 655000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur S113-slutvandringen 2026-08-31 (orkestreraren, dev-server mot staging). Uppmätta fakta: (1) Tre kvitton (MM-2026-1010/1011/1012, alla utfardat) fick fallerade utskick i staging-adressvakten ("är inte en Resend-testadress"). Inkorgen (/mer/betalningar) visade en TRANSIENT utfallsregion (BetalningsInkorg.tsx, jobbrad.status==='fel') med per-rad "Skicka igen"-knapp via koaKvitton — men regionen är komponent-state (jobbId/jobb.data), borta efter navigering bort och tillbaka. (2) Efter navigering visar inkorgen "0 kvitton i kö", ingen "Skicka N kvitton"-knapp — de fallerade raderna är inte återköade och kan inte nås via inkorgen. (3) Anmälans detaljvy (AnmalanDetail -> AnmalansBetalningar/InbetalningsLista) visar raden "Kvitto MM-2026-1010 · väntar på att skickas" (kvittolage.ts, utfardat-grenen) med ENDAST Makulera-knapp — ingen skicka-handling, trots att kvittolage.ts redan bär fältet kanSkickaIgen (styr enbart skickaKvittoIgen, kräver ett REDAN skickat kvitto — fel väg för denna rad). (4) PRD TASK-346 berättelse 12 utlovar radvyn "Kvitto MM-…" med Visa OCH Skicka igen — utfärdat-läget uppfyller inte det. Rätt EF-väg för en aldrig-skickad rad är koaKvitton (samma väg som utfallsregionens egna "Skicka igen"-knapp redan använder, se BetalningsInkorg.tsx § SKICKA IGEN — INTE skickaKvittoIgen, som förutsätter ett redan utskickat kvitto). Bunta även en sidofunnen kongruensbugg i samma komponentyta (orkestrerarens tillägg 2026-08-31 ~10:04): utfallsregionens rubrik böjer fel vid N=1 ("1 kvitto skickade" i stället för "1 kvitto skickat") — jobbDelutfall i inkorg-harledningar.ts rad ~501.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En kvittorad i läget utfärdat/ej-skickat ("väntar på att skickas") bär en Skicka igen-knapp i InbetalningsLista.tsx-radvyn, med samma EF-väg (koaKvitton) som utfallsregionens befintliga Skicka igen-knapp i BetalningsInkorg.tsx
- [ ] #2 Knappen erbjuds ALDRIG för ett redan skickat eller makulerat kvitto, och ALDRIG för en makulerad inbetalning
- [ ] #3 Knappen är tillgängligt namngiven per rad (unik per kvittonummer) och utfallet annonseras i en role=status-region
- [ ] #4 Härledningen som styr knappen har tester i båda riktningar (rätt implementation + en negativ kontroll som fäller en trasig variant)
- [ ] #5 BetalningsInkorg.tsx:s utfallsregion böjer kvitto skickat/skickade korrekt: singular (1 kvitto skickat) vid N=1, plural (N kvitton skickade) vid N>1 — testat för båda formerna
- [ ] #6 En inbetalning vars SENASTE kvittojobb (jobb_rad, jobbtyp kvitto) har status 'fel' visar felskälet (jobb_rad.skal) i klartext på raden i InbetalningsLista.tsx (samma visuella klass som makulerings-noten), oavsett om kvittot hann skapas (utfärdat) eller fallerade innan ledger-raden skapades (inget kvitto)
- [ ] #7 Den raden erbjuder en Skicka igen/Försök igen-handling som köar om via koaKvitton; datavägen (hamta-inbetalningar) utökas att bära jobbfelet till klienten eftersom den saknar det i dag — ingen migration (jobb_rad.skal finns redan)
- [ ] #8 Tvåsidigt test på härledningen: senaste jobbet fallerat -> felskäl synligt + köa-om erbjuds; inget/lyckat jobb -> inget felskäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
