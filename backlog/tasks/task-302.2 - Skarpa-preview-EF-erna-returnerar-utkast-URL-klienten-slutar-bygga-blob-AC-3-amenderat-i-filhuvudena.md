---
id: TASK-302.2
title: >-
  Skarpa preview-EF:erna returnerar utkast-URL; klienten slutar bygga blob:; AC
  #3 amenderat i filhuvudena
status: To Do
assignee: []
created_date: '2026-08-22 21:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-302.1
parent_task_id: TASK-302
priority: high
ordinal: 554000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skiva 2 av `TASK-302`. Plockas FÖRST när 302.1:s Marcus-acceptans är bokförd. Läs förälderns designbeslut och AC #3-formuleringen — den skrivs in VERBATIM.

## Bygg

1. `supabase/functions/preview-receipt/index.ts`: efter `renderKvittoPdf` → `laggUtkast(…, { eventId, typ: 'kvitto', bytes })`; svaret `{ url, utgar }` i stället för `{ pdfBase64 }`. Filhuvudet rad 10–30: sidoeffektsfrihets-stycket amenderas med förälderns nya formulering — det gamla resonemanget (ingen kvittonummer-allokering, inget Resend) STÅR KVAR, det är fortfarande sant.
2. `supabase/functions/generate-event-attachment/index.ts` `preview: true`-grenen (rad ~202, 220): samma — `typ: 'bilaga'` (eller `deltagarinformation` per mall). Rad 58–68 amenderas med samma formulering; *"inte 'sidoeffekter som sedan städas'"*-satsen ersätts öppet, med hänvisning till `ADR-124` och mätningen.
3. `src/domain/schemas/Attachment.schema.ts` rad 81–83: `DocumentPreviewSchema` = `{ url: z.string().url(), utgar: z.string().datetime() }`.
4. `src/data/mutations/dokumentKalla.ts`: `blobUrlFranBase64` tas bort; `hamtaDokumentUrl` returnerar `url` för alla tre klasser. Docblocken (rad 30–35 om revoke/byte-range) är FALSIFIERAD (en blob kan inte svara på byte-range-anrop) — skriv om mot vad som mätts.
5. Adapterna: `previewEventTemplate`/`previewReceipt` returtyper följer schemat; `AirtableAdapter`-stubbarna (om de finns) likaså.
6. Tester: befintliga API-tester för `preview-receipt`/`generate-event-attachment(preview)` uppdateras till URL-formen + HEAD-kontrollen ur 302.1; klient-tester för `hamtaDokumentUrl`. Deploy av båda EF:erna till STAGING; prod är Marcus moment (`scripts/fas4-prod-deploy.sh`), bokförs som öppet i kortets notes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 preview-receipt och generate-event-attachment(preview:true) svarar { url, utgar }; ingen Bilagor-rad, inget kvittonummer, inget mail (befintliga tester för det förblir gröna)
- [ ] #2 DocumentPreviewSchema = { url, utgar }; blobUrlFranBase64 borttagen; hamtaDokumentUrl returnerar Storage-URL för klass A, B och C
- [ ] #3 AC #3-formuleringen ur TASK-302 står verbatim i båda EF-filhuvudena med hänvisning till ADR-124
- [ ] #4 API-tester gröna mot staging; typecheck, biome, build gröna; båda EF:erna deployade till staging (aldrig prod)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
