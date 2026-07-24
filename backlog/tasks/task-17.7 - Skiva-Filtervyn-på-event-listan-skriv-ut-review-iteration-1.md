---
id: TASK-17.7
title: 'Skiva: Filtervyn på event-listan + skriv ut (review-iteration 1)'
status: To Do
assignee: []
created_date: '2026-07-22 09:09'
updated_date: '2026-07-24 14:40'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.2
parent_task_id: TASK-17
priority: medium
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg 1 (2026-07-22, design-review av S75-leveransen): event-listan får en filtrerings-ingång i period-toggel-raden (filterikon eller expander-pil per Marcus-skiss) som expanderar baren nedåt och öppnar en filtervy; i filtervyn även en Skriv ut-knapp för listan. ÖPPNA SPEC-FRÅGOR före ready-for-agent: (1) filterdimensionerna (kurs/eventtyp? ort? status? fritext?), (2) interaktionsformen (disclosure-expansion av baren — FK-/branschmönster researchas per web-research-disciplinen före design), (3) utskriftens omfång (filtrerad lista; print-kravet ur komponent-ribban). Bygger på 17.1:s ToggleButtonGroup-rad + 17.2:s listvy; blir filtren delbara ska URL-state in i URL-STATE-SPEC (nuqs) i samma skiva. Grillnings-kandidat före implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Filterdimensionerna + interaktionsformen Marcus-kvitterade före implementation (research-underlag citerat)
- [ ] #2 Filter + utskrift levererade per beslutad spec med e2e + axe-0; URL-STATE-SPEC uppdaterad om URL-state införs
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PROTOTYP-FACIT S83 (konvergens-pass, Marcus-låst 2026-07-24: 'Vi låser den så'). Research-grund: docs/research/filtervy-listor-monster-2026-07-24.md (disclosure-bar = MOJ-mönstret; FK utan filtermönster; NN/g live-filtrering vid klientlokal data). Bilagor: tasks/sessions/bilagor/s83-filtervy-konvergens/ (k01 exakt kopia, k02 låst filterform, k02-print). Prototyp-SHA (aldrig mergad branch proto/s83-17-7-filtervyn): 0eba03b.

BYGGKRAV (låsta):
1. INGÅNG: tratt-ikonknapp (lucide Filter) HÖGER om period-toggeln i samma rad; öppen/aktiv = bg-text/text-text-inverse; siffer-badge (bg-accent) med antal aktiva val; sr-only-text 'Visa/Dölj filter, N aktiva filterval'; aria-expanded + aria-controls mot panelen.
2. PANEL (disclosure under raden, rounded-2xl bg-bg-muted p-4): TRE dropdowns med Select-primitiven (size sm, synliga labels) i grid gap-3 sm:grid-cols-3 — Typ · Ort · Status. 'Alla typer/orter/statusar' = nolläge. Värden härleds ur HELA datakällan (stabila över periodbyte); typ/ort sv-alfabetiskt, status i kanonisk ordning Planerat/Genomfört/Inställt/Flyttat. Skarpa bygget använder React Aria Disclosure/DisclosurePanel (research-rek) — 11-ribban.
3. SEMANTIK: ETT val per dimension (Select är enval — flerval medvetet avstått, byggs ej 'ifall'), AND över dimensioner, LIVE utan Apply-knapp; filtret appliceras på periodfiltrerade listan; räknare 'Visar X av Y event' i panelfoten + aria-live-bekräftelse; 'Rensa filter'-knapp synlig vid aktiva val.
4. TOMLÄGE: aktiva filter + 0 träffar => 'Inga event matchar filtren' + Rensa-knapp (SKILJT från period-tomläget som består orört).
5. SKRIV UT: knapp i panelfoten (Printer-ikon) => window.print(). @media print döljer nav + kontroller via ÅTERANVÄNDBAR print-utility (GOV.UK-idiomet, ej engångs-CSS); print-huvud renderas: 'Event — {Period}[ · {aktiva filter}] · {N} event · Utskrivet {långdatum}'. Kalenderläget berörs ej av filtret (kalendern äger tiden, PRD beslut 7).
6. ÖPPEN DELFRÅGA FÖRE BYGGE: URL-delbarhet för filterval (?typ/?ort/?status via nuqs + URL-STATE-SPEC-uppdatering per kortets villkor) — Code-rek JA (konsistent med ?period/?vy-grammatiken); Marcus-svar inväntas, bokförs här.

URL-BESLUTET AVGJORT (Marcus 2026-07-24, på Code-rek med förtroende-kvittens; förklarad på Gunilla-nivå — valet hamnar i webbadressen: kopierbar länk, back-bart, omladdnings-säkert): JA — filtervalen URL-delbara via nuqs (?typ/?ort/?status i listans befintliga URL-grammatik, clearOnDefault för ren URL utan filter); URL-STATE-SPEC §Event uppdateras i samma skiva (kortets villkor). Byggkrav 6 därmed stängt — skivan komplett speccad.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd (per skiva med UI-yta; L220)
- [ ] #6 Renderad verifiering (computed-style/skärmdump) per berörd punkt före granskning (L245/L246)
<!-- DOD:END -->
