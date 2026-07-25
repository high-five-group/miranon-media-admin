---
id: TASK-17.7
title: 'Skiva: Filtervyn på event-listan + skriv ut (review-iteration 1)'
status: Done
assignee: []
created_date: '2026-07-22 09:09'
updated_date: '2026-07-25 09:11'
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
- [x] #2 Filter + utskrift levererade per beslutad spec med e2e + axe-0; URL-STATE-SPEC uppdaterad om URL-state införs
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

AFK-leverans (batch S86, do-work-agent, ADR-071/ADR-076-landningsform):

TDD rött-först (S80-amenderingen): nya describe-blocket 'Filtervyn på event-listan + skriv ut (task-17.7)' (10 tester) kört FÖRE implementation — observerat utfall 9 failed / 1 passed (3,7 min): samtliga nio föll på saknad ingång, 'Test timeout of 30000ms exceeded … waiting for getByRole(button, name /^(Visa|Dölj) filter/)' (bl.a. 'filter-ingången: tratt-knapp …', 'live-filtrering utan Apply …', 'Skriv ut: knappen anropar window.print …', 'axe 0 violations …'); den tionde (skärpt vakt i gamla kontrakts-testet) grön. Efter implementation: 10/10 gröna; hela berörda ytan 36/36 (events-list + events-list-kalender). En cykel (e2e-skarven batchar skivans beteenden; rött+grönt pushas ihop).

Review-piloten (T86): granskat träd adb2c614 (bas main f51ec95) — 6 fynd; ompassering på fix-diffen (träd e1e29f45) — 1 nytt lågfynd. Triage: 6 åtgärdade (print-huvudet villkorat bort i kalenderläget · fokus till tratt-knappen vid Rensa · '1 aktivt filterval' · expect.poll på ren-URL-assert · okänt URL-värde som extra SelectItem · ALLA-sentinel-vakten), 1 bokförd i stället för kodändring (text-[10px]-badgemikrotexten — facit-låst k02-form; skalan saknar steg under text-caption; badge-skalsteg mintas först vid andra konsument). Bokförd degradering (fynd 6a): dimension utan källvärden renderar ingen dropdown — ärligare än död kontroll; laddskelettet visar tre block (slutgeometri för normalfallet).

Öppen facit-avvikelse (WCAG-golvet): badge-texten text-text-inverse i stället för prototypens text-text (2,6:1 mot accent-kopparn — 1.4.3 skärs aldrig; 5,96:1 uppmätt; task-17.2-prejudikatet).

Lokala grindar: typecheck 0 fel · typecheck:tests 0 fel · biome 0 errors · build grön · test:api 376/376 · e2e events-list+kalender 36/36 · axe-0 med öppen panel + aktivt filter. Renderad verifiering (DoD #6): computed-asserts på trigger-aktiv (bg-text), badge (bg-accent/text-inverse), panel (bg-muted, radius 16px), print-emulering (nav/kontroller dolda, print-huvudets exakta text mot k02-print).

CI-bokföring (svans, batch S86): PR #174 MERGED (merge-commit 9ca7b52) · PR-run 30135949402 grön per jobb · main-run 30136271886 grön per jobb (Test suite merge-dedup-SKIPPAD by design, 36.4-träff). Väntar design-review (DoD #5) — Done-flippen är Marcus. AFK-proveniens: batch S86, do-work-agent + svans-agent.

Design-review godkänd: Marcus morgongranskning 2026-07-25 i webbläsaren, utan anmärkning ('OK'). Done-flipp per ADR-071 (utan anmärkning → flipp på kvittens).

## Granskningsvågens FIX (S86 morgongranskning, Marcus-beslut 2026-07-25 — efter Done-flippen)

FYND (Marcus): 'vi har en grå rad för filtreringen som ligger fast där även när filtreringen är stängd … Så va det inte i prototypen va?' — korrekt: prototypen (0eba03b) hade villkorad rendering = ingen rand; facitet avsåg ingen synlig rad i stängt läge.

GRUNDORSAK (verifierad i react-arias useDisclosure-källa): React Aria döljer stängd panel med hidden="until-found" ⇒ content-visibility: hidden — INNEHÅLLET döljs men panel-elementets EGEN bakgrund/padding renderas. Vår panel bar 'rounded-2xl bg-bg-muted p-4' direkt på DisclosurePanel-elementet → tom grå rand (32 px padding-yta med tonal bg).

FIX (React Aria-idiomet; branch fix/s86-granskningsvag, granskningsvågens samlade PR): DisclosurePanel-elementet ostylat (endast data-testid); bakgrund/padding/rounded/gap flyttade till INRE wrapper-div — allt visuellt försvinner med innehållet. Rytmen rad↔öppen panel bärs av wrapperns mt-6 i stället för rotens gap-6 (ett rot-gap hade lämnat 24 px dött utrymme efter det 0 px höga panel-elementet i stängt läge). Aria-wiring, print:hidden, skeleton-läget, dropdowns och panelfot oförändrade. Fil: src/components/events/EventsList.tsx.

E2E-LÅS (events-list.staging.test.ts): nytt test 'stängd panel är VISUELLT FRÅNVARANDE — ingen grå rand' (not.toBeVisible + boundingBox-höjd 0, initialt OCH efter öppna/stäng-cykel; röd mot pre-fix-koden som renderade 32 px-randen); befintliga öppet-läges-formlåset omdirigerat till inre wrappern (panel-elementet är nu ostylat by-design). Rött-först ej observerbart lokalt (5173 = Marcus levande dev-server; portlåst svit med hård vägran) — PR-CI är beviset, bokfört i PR-bodyn. Kortet förblir Done; fixen är granskningsvågens.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit f11cc37 · CI-run 30135949402 (PR) + 30136271886 (main) per jobb · CI-grön-första-pass: ja · defekter under körning: 0 · TDD: 1 cykel (e2e-skarven batchar skivans beteenden; rött-först 9 failed observerat) · AFK-proveniens: batch S86, do-work-agent — väntar design-review (DoD #5), Done-flippen är Marcus
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review: Marcus-granskning i webbläsaren godkänd (per skiva med UI-yta; L220)
- [x] #6 Renderad verifiering (computed-style/skärmdump) per berörd punkt före granskning (L245/L246)
<!-- DOD:END -->
