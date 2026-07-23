---
id: TASK-17.5
title: 'Skiva: Läs-shape-utökningen + bor över-raden på listkortet'
status: Done
assignee: []
created_date: '2026-07-21 08:20'
updated_date: '2026-07-23 11:59'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.2
  - TASK-18.7
parent_task_id: TASK-17
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Listkortens bor över-rad (säng-glyf + antal) läser en HÄRLEDD summering av bor över-kryssen per Anmälan ur event-läsningen; eventKey följer med i läs-shapen. Read-only-utökning — inget nytt lagrat räknefält, ingen bas-ändring (fältet föds i TASK-18.7). Täcker användarberättelser: 9 (TASK-17).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Shape-utökningen kontraktstestad: summeringen motsvarar antalet ikryssade i staging-fixturen
- [x] #2 Bor över-raden renderar per facit på korten; slot-modellen intakt med platshållare vid noll
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementationsnoteringar (task-17.5, AFK-batch)

### Läs-shape-utökningen (borOverAntal)
- borOverAntal?: number ADDITIVT-OPTIONAL på EventSchema + Event-modellen. Paritetsfilen schemas.assignable.ts auto-täcker via AssertEqual (typecheck grön). HÄRLEDD summering, INGET lagrat räknefält (ADR-063; checkbox-fältet Bor över fött i task-18.7).
- get-event: fetchBelaggning utökad — SAMMA registrerings-batch räknar nu ikryssade Bor över (fält adderat till fields-listan, ingen extra rundtur). borOverAntal ALLTID tal >= 0.
- get-events (listkortets datakälla): NY aggregering fetchBorOverAntalByEvent — alla events länk-ID:n (Anmälningar länkat fält) samlas EN gång och batch-hämtas chunkat (get-event:s fetchBelaggning-mönster lyft till list-nivå; aldrig N+1, ceil(N/50) anrop för HELA listan). mapEvent tar borOverAntal-param.
- update-event/create-event RÖRS EJ: write-EF:erna aggregerar aldrig beläggningsräkningarna (samma form som viaFormular/medfoljande) — borOverAntal utelämnas där, OPTIONAL i schemat håller z.array-parsen. create-event är dessutom utanför min yta.
- Checkbox-läsning strikt lika true (Airtable utelämnar okryssad ruta) — samma mappning som get-registrations (18.7). Ingen coerce-helper adderad (inline-formen är kodbasens norm; extraktion premature under ADR-026 >=5-tröskel — coerce.ts orörd).

### EF-deploy (STAGING)
- get-events + get-event deployade till STAGING (--project-ref pqtshyierkdgwdnxuirz, T34-disciplin explicit ref). PROD (lvjsfnphlauldxqlncpl) EJ deployad — Bor över-fältet finns inte i prod-basen ännu (hård prod-deploy-förutsättning, 18.7-bokföringen: fält FÖRE EF per miljö). Aggregeringen prod-säker: saknat fält -> utelämnat -> 0, aldrig fel.

### Fixtur-facit (AC #1) — DELTAT-FÖRST, ingen efemär seed
- 18.7 seedade den PERMANENTA ARBETSKO-fixturen (recZyRIzbqWSifAQO) med 1 av 4 ikryssad Bor över (bekraftadId rec2OjLD2qiKzZCA0) = 17.5:s facit (ARBETSKO_EXPECTED.borOverAntal=1). Live-verifierat via MCP FÖRE bygget: filter Bor över lika 1 ger EXAKT en rad i hela staging.
- AVVIKELSE från FAS-direktivets seeda BELAGGNING via MCP med teardown: den permanenta fixturen bär redan ett känt kryss (18.7 satte det FÖR 17.5, öppet bokfört i fixtures.ts) -> efemär seed onödig och mindre robust. BELAGGNING (recIFrxHZw165ycXk, 0 kryss) = noll-fallets bevis (borOverAntal=0, definit >=0 aldrig undefined i aggregerings-EF:erna).

### Bor över-raden (EventCard, AC #2)
- Säng-glyf (BedDouble) + antal som SISTA metaraden (facit FACIT-listvyn.png: 3 bor över / 0 bor över). Renderas ALLTID (slot-modellen): 0 -> 0 bor över (platshållaren vid noll = raden reserveras), saknat värde (äldre cache) -> streck. Kort med och utan bor över LIKHÖGA (review-våg 1). Ikon aria-hidden, texten bär (WCAG 1.4.1). Ingen ny token (Post 3: text-text-secondary återanvänt).
- EventsList lugnt-laddläge-skeleton fick en fjärde metarad så slutgeometrin matchar (datalandningen flyttar ingenting).
- e2e-mockarnas ev() (list + kalender) bär borOverAntal (default 0) — speglar att get-events alltid returnerar ett tal.

### TDD-bevis
- api RÖTT-FÖRST (EF-deploy-bunden, 18.8-precedent): 2 nya kontraktstester RÖDA mot deployad staging-EF (borOverAntal undefined: get-event härleder + get-events aggregerar/listan), GRÖNA efter redeploy. Full api-svit 349/349.
- e2e RÖTT-FÖRST: bor över-raden per facit RÖD (data-slot bor-over 0 element) före EventCard-raden, GRÖN efter. Full chromium-authenticated 243 passed / 3 skipped på 5188; 3 fail = ICKE-relaterade (hem:410 + hem:663 flaky klock-test, BÅDA gröna i isolering [hem-filen 29/29]; skapa-event:405 sharp EF-read CORS-blockad på 5188, kräver 4173 — orört av denna skiva). a11y 62/62.

### Grindar (lokalt gröna, CI-identiska)
test:api 349 · typecheck 0 · typecheck:tests 0 · biome exit 0 · build grön · test:a11y 62 · e2e (se ovan).

### Öppna review-grindar (Marcus)
DoD #5 (design-review mot S72-facit) + #6 (facit-avprickning mot bilagor) lämnas ÖPPNA — review-bundna (18.7-precedent). Rendered computed-verifiering finns i e2e (data-slot bor-over text/antal/noll-fall, säng-glyf aria-hidden); skärmdumps-avprickning mot FACIT-listvyn.png görs vid granskningen.

POST-CI-BOKFÖRING (batch-merge-agent, TASK-17.5) — GRANSKNINGSFÄRDIG, väntar design-review (Marcus): DoD #5 (design-review mot S72-facit) + #6 (facit-avprickning mot bilagor) står ÖPPNA. PR #86 mergad som merge-commit 9ff4d4644eca4270e7189e41f008887749a49c2f (--merge, ej squash — SHA-bevisen bevaras). DoD #3 bockad HÄR: CI grön per jobb på pushad commit. PR-CI run 29965768561 (pull_request, head 14e4848): 6/6 jobb success (Test+Build bär e2e-beviset: api-staging 147 passed inkl. 2 nya bor över-kontraktstester [get-event härleder + get-events aggregerar/listan], e2e-staging 246 passed av 249 [3 skip, 0 fail], a11y 62/62). main-CI run 29966285253 (push, merge-commit 9ff4d46): 6/6 jobb success, identiska test-counts. Kortet står kvar In Progress — INGEN final-summary, INGEN Done (design-review-grinden till Marcus).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT S72-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-22 09:09
---
Review-våg 1 (Marcus 2026-07-22): emfas — bor över-raden får INTE ändra korthöjd när den landar; kort med och utan bor över ska vara likhöga. AC #2:s slot-modell med platshållare vid noll är exakt detta krav (raden renderas ALLTID, reserverad; prototypens mönster EventsListPrototype rad ~290). Bokfört som review-förankring — ingen spec-ändring behövd.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Läs-shape-utökningen + bor över-raden på listkortet levererad (PR #86, merge-commit 9ff4d46; PR-run 29965768561 + main-run 29966285253, 6/6 jobb gröna — api-staging 147 inkl. 2 nya bor över-kontraktstester, e2e-staging 246, a11y 62/62). DESIGN-REVIEW GODKÄND av Marcus 2026-07-23 (S75 femte resumen, omgransknings-protokollet Yta 1 — kvittens 'Allt ok' över ytans sex kort). DoD #6 FACIT-AVPRICKNINGEN UTFÖRD vid granskningen per kortets egen plan (review-bunden, 18.7-precedenten): renderad verifiering mot skarp staging-lista 390x844 — bor över-raden är SISTA metaraden på varje kort (säng-glyf + antal), glyfen aria-hidden=true (texten bär, WCAG 1.4.1), samtliga 66 kort EXAKT likhöga (unika korthöjder = {193 px}) vilket bevisar slot-modellens platshållare vid noll (review-våg 1:s emfas), och skärmdumpen jämförd mot FACIT-listvyn.png: metarads-grammatiken pin/kalender/säng + beläggningsrad + stapel matchar facit. ENDA avvikelsen mot facit-bilden är den beslutade term-revideringen 'platser bokade' -> 'platser reserverade' (review-våg 1, ORDLISTA-posten). ÖPPET BOKFÖRT: staging-listan bär just nu enbart noll-fallet ('0 bor över' på alla kort) — icke-noll-fallet är bevisat via e2e-mock (3 bor över) + de 2 api-kontraktstesterna mot deployad staging-EF, inte via skarp lista.
<!-- SECTION:FINAL_SUMMARY:END -->
