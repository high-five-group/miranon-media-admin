---
id: TASK-147.1
title: 'Skiva: Sändvägs-EF:n bilage-fri gren + ADR-067-revisionen'
status: Done
assignee: []
created_date: '2026-08-10 06:58'
updated_date: '2026-08-11 19:35'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-147
priority: high
ordinal: 338000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Server-fundamentet för åtgärdssidans utskick: EF-operation för åtgärdsutskick (bekräftelse/påminnelse/eventinfo/fritt) via den befintliga batch-mekanikens kontrakt — idempotens-, samtyckes- och spärrlist-mönstren ärvda ur segment-sändvertikalen (verifiera mot supabase/functions/send-email, ADR-086). Svaret redovisar ärligt delutfall per mottagare — partiellt fel rapporteras aldrig som helt lyckat. Stämpeln 'skickad' sätts server-side av den som vet att sändningen skedde. ADR-067 revideras i samma skiva: sändvägen grenas i två (bilage-fri batch + bilage-bärande loopad singelsändning), den tysta bilage-bristen som skäl, båda avvisade alternativen bokförda (task-147 § Implementationsbeslut).

Täcker användarberättelser: 10, 13, 27 (serversidan).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 EF-operationen tar åtgärdstyp + mottagarurval + redigerad ämnesrad/brödtext och sänder via bilage-fria batchgrenen; per-mottagare-utfall i svaret
- [x] #2 Idempotens bevisad genom omkörning: samma körning två gånger ger ett mail, inte två
- [x] #3 Delutfall testat som delutfall: scenario där några mottagare faller ger svar som säger just det
- [x] #4 ADR-067-revisionen mintad med gren-arkitekturen + tyst-bilage-brist-skälet + avvisade alternativ
- [x] #5 ADR-067-revisionen rymmer uttryckligen test-sändvägen (enkel-mottagare till inloggad användare, T53 väg C) som del av det nya kontraktet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Delutfallet prövat som delutfall: partiellt fel rapporteras aldrig som helt lyckat (PRD DoD 7-arv)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
[TASK-169, backlog-städet uppföljning, 2026-08-11] DoD 1-5 bockade mot belägg (samtliga lämnades okryssade vid stängningen trots full leverans, genuint förbiseende). Källor: PR #1093 (merge 8450808c, verifierat ancestor av origin/main). #1: samtliga 5 AC redan avbockade i kortet. #2: samtliga required CI-jobb SUCCESS (Lint+Audit+TypeCheck, Test suite/Pure+Build, Acceptance, Webblasarbeteende, Docs link check, CodeQL) — motsvarande lokala grindar för rörd filklass (supabase/functions + tests/api). #3: samtliga required checks SUCCESS, källa gh pr view 1093 --json statusCheckRollup. #4: PR-diffen är path-scopad (10 filer: backlog-kortet, ADR/README ej berörda här, _shared/action-mail-template.ts, _shared/confirm-registrations.ts, _shared/field-allowlists.ts, _shared/send-action-email.ts, send-action-email/index.ts, tests/api/action-mail-template.test.ts, tests/api/send-action-email.test.ts — inget orelaterat). #5: redan bevisat av AC#3 (delutfall testat som delutfall, checkad).

[TASK-169 uppföljning, RÄTTELSE 2026-08-11] Föregående notes-rad innehöll ett sakfel: påstod 'ADR/README ej berörda här' för PR #1093. Det är FEL — PR #1093:s faktiska filkorg (gh pr view 1093 --json files) innehåller BÅDA docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md och docs/decisions/README.md, vilket är KORREKT och FÖRVÄNTAT (AC#4/#5 kräver uttryckligen ADR-067-revisionen). Fullständig filkorg (10 filer, samtliga relaterade till denna skivas scope): backlog-kortet, docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md, docs/decisions/README.md, supabase/functions/_shared/{action-mail-template,confirm-registrations,field-allowlists,send-action-email}.ts, supabase/functions/send-action-email/index.ts, tests/api/{action-mail-template,send-action-email}.test.ts. DoD#4-bedömningen (path-scopad, inga orelaterade filer) står fast — bara motiveringstexten var felaktig, inte slutsatsen.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1093 (44233e22, mergad 8450808c): send-action-email-EF:n (fyra åtgärdstyper, per-mottagare-utfall, idempotens via jobId/typ-nyckel, icke-prod-spärren ärvd som golv, atomicitet mail↔stämpel) + ADR-067-revisionen D9 (greningen) + D10 (test-sändvägen, T53 väg C). 311/311 api-pure. Kontraktsytan för 147.5/147.10 bokförd på kortet. Konsent-gaten öppen punkt till Marcus. EF deployad till staging av orkestratorn. AFK-proveniens: S102-batchen kort ④.
<!-- SECTION:FINAL_SUMMARY:END -->
