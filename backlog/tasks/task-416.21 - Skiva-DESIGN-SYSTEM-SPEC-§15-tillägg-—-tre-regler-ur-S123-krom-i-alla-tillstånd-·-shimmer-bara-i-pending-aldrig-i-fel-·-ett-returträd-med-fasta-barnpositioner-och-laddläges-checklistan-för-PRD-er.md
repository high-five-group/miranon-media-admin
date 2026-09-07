---
id: TASK-416.21
title: >-
  Skiva: DESIGN-SYSTEM-SPEC §15-tillägg — tre regler ur S123 (krom i alla
  tillstånd · shimmer bara i pending, aldrig i fel · ett returträd med fasta
  barnpositioner) och laddläges-checklistan för PRD:er
status: Done
assignee: []
created_date: '2026-09-06 17:13'
updated_date: '2026-09-07 16:49'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: medium
ordinal: 751000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: S123 (2026-09-06) granskningsloopen på 15 PR:er (sessionsdok Del 3 § Beslut på mandatet, § Granskningsloopen) + lessons-fragmentet rundtaket-racker-inte-nar-varje-runda-avtacker-nasta-lager-av-samma-princip.md. Tre regler fastslogs under loopen, instans för instans, och saknas i docs/specs/DESIGN-SYSTEM-SPEC.md §15 (Lugnt laddläge, rad ~1075): (1) sidkromet (SidRam, h1, sidhuvud, filter-/sökrad, handlingsrad) renderas i ALLA query-tillstånd, bara datakroppen växlar — belagt i 416.1 #2401, 416.2 #2415, 416.3 #2396, 416.4 #2392, 416.8 #2395; (2) skeleton och shimmer ENBART i isPending, aldrig i isError — i fel visas kromet med statisk platshållare utan animation och utan aria-busy, felbeskedet bär tillståndet (416.4 r1, 416.8 r2, 416.1 r2–r3); (3) ett returträd med fasta barnpositioner — status-annonseringen och varje block på fast index (null på sin plats), så React inte monterar om header/FilterRad vid landning och fokus/inskriven text överlever (416.8 r1, 416.2 r2, 416.19). Åtgärd, docs-only: skriv de tre reglerna i §15 med källa per regel (PR-nummer, ADR-113/ADR-078-koppling), en kort laddläges-checklista att citera i skivors uppdrag (krom i alla tillstånd · shimmer bara i pending · fasta barnpositioner · aria-busy/role=status per landmärke · mobil viewport · boundingBox före/efter), och en pekare från KVALITETSDEFINITIONER-11-REACT.md om den har en laddläges-rad. Kontrollera ORDLISTA.md för begreppen (sidkrom, returträd) och uppdatera vid kristallisering. Vale/markdownlint gröna (npm run check:docs).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 §15 bär de tre reglerna med källa per regel och kopplingen till ADR-113/ADR-078 utskriven
- [x] #2 Laddläges-checklistan finns i §15 i en form som kan citeras i ett uppdrag (sex punkter)
- [x] #3 ORDLISTA.md prövad för sidkrom/returträd; uppdaterad vid behov
- [x] #4 npm run check:docs grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Genomfört 2026-09-07: tva nya underrubriker i par. 15 (Multivytillstand - tre regler ur S123; Laddlages-checklistan, sex punkter). ADR-113/ADR-078-kopplingen utskriven. Andringslogg-rad tillagd.

Kallor per regel (PR-nummer, verifierade mot sessionsdok S123 Del 3+Del5 och PR-kropparna): regel 1 - PR 2401 (416.1), 2415 (416.2), 2396 (416.3), 2392 (416.4), 2395 (416.8). regel 2 - PR 2392 runda 1, PR 2395 runda 2, PR 2401 rundorna 2-3. regel 3 - PR 2395 (416.8), PR 2415 (416.2), PR 2423 (416.19 - EJ PR 2418, som bara ar kortets mint-commit; PR 2423 ar byggnads-PR:n).

Oppen divergens (ADR-086), bokford i sjalva spec-texten - inte tystad: kortets beskrivning ger regel 3s kalla for TASK-416.2 som runda 2, sessionsdokets Del 3 par. Beslut pa mandatet ger runda 1 for samma PR/fynd. PR-numret (2415) samstammigt i alla kallor - rundnumret ar det inte. Spec-texten citerar PR-nummer som primar kalla och utelamnar det osakra rundnumret for just den posten.

ORDLISTA.md provad (grep, noll traffar for sidkrom/returtrad fore andringen) - INGA poster tillagda: bada ar design-system-/kodmonstertermer, inte produktdomanbegrepp (scope-texten sager uttryckligen att allmanna begrepp exkluderas). Sidkrom har redan sin hemvist i DESIGN-SYSTEM-SPEC.md par. 23. Returtrad definieras inline dar det forst anvands. KVALITETSDEFINITIONER-11-REACT.md provad for en laddlages-rad (grep, noll traffar) - ingen pekare tillagd per kortets egen villkorade formulering, eftersom par. 3 fortfarande ar TBD (Fas 3.5).

Grindar (exitkoder matta separat, aldrig i pipe): npm run check:docs -> exit 0, 14 grona / 14 korda. npx markdownlint-cli2 pa filen -> exit 0, 0 issues i 621 filer totalt. vale pa filen -> exit 0, 0 errors/0 warnings/0 suggestions. Diff: endast docs/specs/DESIGN-SYSTEM-SPEC.md (74 insertions, 0 deletions), path-scopad add, inga orelaterade filer.

FIX-RUNDA 1 (2026-09-07, efter review-runda 1 pa PR 2439): fyra fynd atgardade. (1) warning - terminologikollision: regel 1 omdefinierade sidkrom-termen bredare an par. 23s snava definition (SidRam, exkluderar rubriken uttryckligen). Rattat: regel 1 heter nu Sidramen (sidkromet enligt par. 23) OCH sidans egna statiskt kanda element, med explicit pekare till par. 23 for termens avgransning; ordet sidkrom anvands inte langre for h1 nagonstans i tillagget (rubrik/checklista/andringslogg uppdaterade). (2) warning - regel 1 citerade TASK-416.3 (PR 2396) utan reservation trots att PR 2396s egen kropp bekraftar isError-scope-exkludering och AktivitetsHistorik.tsx fortfarande saknar FilterRad i isError (tre separata topp-niva-returns). Rattat: regel 1 citerar 2396 med reservation (bar bara isPending-grenen); mintat fynd-kort TASK-428 (AktivitetsHistorik isError saknar FilterRad/returtrad), citerat i spec-texten som oppen skuld. (3) info - regel 2s attribution av PR 2395 stod som runda 2, PR 2395s egen kropp lagger h1-alltid-monterad-instansen i Runda 3. Rattat till runda 3. (4) info - PR-kroppens Modell-identitet-avsnitt atergav en overifierad rad kopierad fran PR 2395 - ersatt med arlig beskrivning i PR-kroppen.

STÄNGNING (S123 resume 1, 2026-09-07): PR #2439 → c3740309; post-merge c3740309 GRÖN (D0). Review runda 1: 2 warnings ask-user (sidkrom-terminologi mot §23; #2396 citerat utan isError-reservation) + 2 info, risk medel → fix-runda 1 (82bb6e5e: §23 kanon, reservation, fynd-kort TASK-428, rundnummer rättat) → runda 2: 0 fynd, risk låg, konvergerad. Done-flipp av orkestreraren.
<!-- SECTION:NOTES:END -->
