---
id: TASK-18.15
title: >-
  Skiva: Åtgärds-radernas siffer-referens — numrerade boxar i stället för ikoner
  (review-iteration 1)
status: In Progress
assignee: []
created_date: '2026-07-22 09:09'
updated_date: '2026-07-25 01:14'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.3
parent_task_id: TASK-18
priority: medium
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg 1 (2026-07-22), fundering lyft till beslut: ersätt åtgärds-radernas ledande lucide-ikoner (Atgarder.tsx: Plus/Mail/BadgeCheck/Printer — kuvert-grammatiken ur 18.3/S73-facit) med RADNUMMER inboxade i en grå ruta med samma hörnradie som kortets ytterram. Motiv: referentbarhet — 'gå till åtgärd 4' i instruktioner och manualer (Gunilla-principen: numrerade steg är entydiga). Detta är en FACIT-REVIDERING mot S73-facitets kuvert-grammatik och rivs i så fall öppet (18.3-precedenten för regelrivning). Beslutsrymd före bygge: nummer ensamt, nummer + ikon, eller avslag. Check-in-kortet och rad-chevronerna berörs ej.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus-beslut bokfört (nummer ensamt / nummer+ikon / avslag) med öppen facit-reviderings-not
- [x] #2 Vid bifall: åtgärds-raderna renderar numrerade boxar per beslut; AT-paritet (radnamn + aria-disabled-interimen oförändrade) och berörda e2e uppdaterade i samma skiva
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PROTOTYP-FACIT S83 (konvergens-pass 2, Marcus-låst 2026-07-24). BESLUT: NUMMER ENSAMT (ikonerna utgår ur åtgärds-raderna) — FACIT-REVIDERING AV S73-K47 RIVS ÖPPET för de LEDANDE ikonerna i Åtgärds-gruppen (kuvert-grammatiken består i övriga ytor; check-in-kortets UserCheck orörd). Beslutsprocess synlig: grå ruta → Marcus-fångst hover-kollision (rutans bg == hover-plattans bg-emphasized) → VIT ruta → mörk grå prövad och förkastad ('hemskt') → VIT LÅST. Bilagor: tasks/sessions/bilagor/s83-numrerade-boxar-konvergens/ (k01 skarp baseline, k03 låst form, k03-hover). Prototyp-SHA (aldrig mergad branch proto/s83-18-15-numrerade-boxar): eda160f.

BYGGKRAV (låsta):
1. NUMRUTA ersätter ledande ikonen i Åtgärds-gruppens SEX rader; numren 1–6 i befintlig frekvensordning (ordningen ändras ej).
2. Rutans form: 24x24 (size-6), rounded-lg, bg-surface (VIT — får ALDRIG dela färg med radens hover-platta bg-emphasized; hover-kollisionen är beslutsgrundad), siffra text-caption font-semibold text-text-secondary, centrerad.
3. AT-PARITET (AC 2): numret är aria-hidden dekor; radNAMNEN, aria-disabled-interimen, chevronerna och hover-plattan OFÖRÄNDRADE. Check-in-kortet berörs EJ.
4. Rivningsnot i koden där kuvert-grammatiken (K47) refereras: ledande ikoner ersatta av radnummer per 18.15-beslutet (referentbarhet, Gunilla-principen: 'gå till åtgärd 4').
5. Berörda e2e uppdateras i samma skiva (radnamns-selektorer består — bara visuellt byte).

AFK-leverans (batch S86, do-work-agent, ADR-071/ADR-076-landningsform):

TDD rött-först (S80-amenderingen): de två 18.15-testerna i event-detail-sviten omskrivna/nya FÖRE implementation — observerat utfall 2 failed / 6 passed (56,7 s): 'Åtgärder: sex rader i frekvensordning med radnummer 1–6 (18.15) och chevroner' föll på toHaveText('1') mot span[aria-hidden] — 'Error: element(s) not found' (numrutan existerar inte i förbe-koden); 'numrutan (18.15): vit 24×24-ruta …' föll på 'Test timeout of 30000ms exceeded' väntande på samma locator. Efter implementation: blocket 8/8 grönt, hela filen 49/49 (inkl. sidans axe-tester = axe-0 med numrutor). En cykel (e2e-skarven batchar skivans beteenden; rött + grönt pushas ihop).

Review-piloten (T86): granskat träd e9cff7d8 (bas main 935da42) — 2 inom-scope-fynd; fokuserad ompassering på fix-diffen (träd 4839d1bb) — 2 nya låg-fynd. Triage: 4 åtgärdade (färg-assert text-text-secondary + LEDANDE-positionsbevis i formtestet · radie-härledningen omformulerad, kortets ytterradie 16 px ≠ rutans 8 px, radens/plattans K56-språk är rätt härledning · centrerings-assert per byggkrav 2 · delta-mätt x utan retry-separerad om-mätning), 0 avfärdade, 2 routade som nya oetiketterade kort (task-39 röststyrnings-gapet i nummer-referensen · task-40 numrutans contrast-more-avgränsning). 0 blocker / 2 kvalitet / 2 brus (brusen var gratis härdningar, åtgärdade ändå). Review-tid ~8 min (två pass).

Lokala grindar: typecheck 0 fel · typecheck:tests 0 fel · biome 0 errors (5 warnings/26 infos = befintlig baslinje) · build grön · test:api 376/376 · e2e event-detail 49/49. Renderad verifiering (DoD #6): computed-asserts på numrutan — 24×24, radius 8 px, font 12 px/600, centrering, bg == --mm-surface OCH != --mm-bg-emphasized i vila + hover (färgvakten är beslutsgrunden), siffra == --mm-text-secondary, ledande position delta 8 px; AT-paritet via toHaveAccessibleName per rad + oförändrat aria-disabled-test; check-in-kortets UserCheck bevisad orörd.

INSTANT-regeln (ADR-078): ej berörd — skivan ändrar ingen datahämtning/navigering; golvet oförändrat (deklareras mätt via befintliga sviten). Visual-baselines (eventsida.png) driftar avsiktligt — uppdateras via visual-baselines-workflowens människogrindade PR, ej CI-grind (T87 ej aktiverad).

Väntar design-review (DoD #5) — Done-flippen är Marcus (granskningsfärdigt läge, ADR-071 beslut 3).

CI-bokföring (svans, batch S86): PR #176 MERGED (merge-commit c224847) · PR-run 30137595027 grön per jobb (8/8) · main-run 30137948566 grön per jobb (Test suite merge-dedup-SKIPPAD by design, 36.4-träff). Väntar design-review (DoD #5) — Done-flippen är Marcus. AFK-proveniens: batch S86, do-work-agent + svans-agent.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit e338782 · CI-run 30137595027 (PR) + 30137948566 (main) per jobb · CI-grön-första-pass: ja · defekter under körning: 0 · TDD: 1 cykel (e2e-skarven batchar skivans beteenden; rött-först 2 failed observerat) · review-pilot T86: 4 åtgärdade, 2 routade som nya kort (task-39, task-40) · AFK-proveniens: batch S86, do-work-agent — väntar design-review (DoD #5), Done-flippen är Marcus
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd (per skiva med UI-yta; L220)
- [x] #6 Renderad verifiering (computed-style/skärmdump) per berörd punkt före granskning (L245/L246)
<!-- DOD:END -->
