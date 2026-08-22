---
id: TASK-302.2
title: >-
  Skarpa preview-EF:erna returnerar utkast-URL; klienten slutar bygga blob:; AC
  #3 amenderat i filhuvudena
status: To Do
assignee: []
created_date: '2026-08-22 21:21'
updated_date: '2026-08-22 22:57'
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
- [x] #1 preview-receipt och generate-event-attachment(preview:true) svarar { url, utgar }; ingen Bilagor-rad, inget kvittonummer, inget mail (befintliga tester för det förblir gröna)
- [x] #2 DocumentPreviewSchema = { url, utgar }; blobUrlFranBase64 borttagen; hamtaDokumentUrl returnerar Storage-URL för klass A, B och C
- [x] #3 AC #3-formuleringen ur TASK-302 står verbatim i båda EF-filhuvudena med hänvisning till ADR-124
- [x] #4 API-tester gröna mot staging; typecheck, biome, build gröna; båda EF:erna deployade till staging (aldrig prod)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1-4 matta (staging). test:api 1037/1037 grona (1.9 min) inkl preview-receipt.staging.test.ts (8/8) och generate-event-attachment.staging.test.ts preview-testet (HEAD 200/accept-ranges:bytes/content-type:application/pdf + GET-baserat svenska-tecken-bevis i stallet for pdfBase64-avkodning). typecheck/biome/build grona (exit 0 vardera).

TYP-MAPPNING (avvikelse mot uppdragets fallback-instruktion, bokford): uppdraget sa generate-event-attachment -> bilaga ELLER deltagarinformation beroende pa mall, och om ingen distinktion finns ar bilaga ratt. Koden HAR en distinktion: MALL_NAMN='Deltagarinformation' (enda systemmallen, AC2) matchar bokstavligen UTKAST_TYPER-enumens tredje varde, och 302.1s egen MALL_TILL_UTKAST_TYP (GenereringsPrototyp.tsx rad 216-219) mappar redan deltagarinfo->deltagarinformation for samma mall. Valde typ:deltagarinformation for generate-event-attachment (INTE bilaga); preview-receipt -> typ:kvitto.

REGRESSION HITTAD OCH FIXAD, utanfor uppdragets uttryckliga fillista: hamtaDokumentNedladdningsUrl (dokumentKalla.ts) dekorerade tidigare BARA klass A:s URL med ?download=filnamn (klass B/C fick oforandrad blob:-URL dar <a download> honoreras nativt oavsett serverhuvuden). Efter denna skivan ar klass B/C:s URL en CROSS-ORIGIN Storage-signerad URL som klass A -- utan samma dekoration hade webblasaren ignorerat download-attributet pa useLaddaNerDokument.ts:s a-lank och OPPNAT filen i stallet for att spara den. Fixat: alla tre klasser dekoreras nu lika.

DOKBLOCKS-FEL HITTAT (302.1-artefakt, ratt i samma commit): AirtableAdapter.ts renderPdfTillUtkast pastod byter till de skarpa preview-EF-erna vid TASK-302.2 -- FALSKT, ADR-124 Oppet sager explicit att generate-event-attachment fortfarande ritar med pdf-lib och att DocRaptor-bytet ar promoveringens sak. Ratt till samma formulering som syskonmetoden renderPdfFranHtml (vid promoveringen ADR-103).

PARALLELL SANNINGSKALLA utanfor fillistan uppdaterad av nodvandighet: src/domain/models/Attachment.ts DocumentPreview-interfacet (samma pdfBase64->url/utgar-byte som Attachment.schema.ts DocumentPreviewSchema) -- adaptrarnas metodsignaturer typas mot detta interface, maste andras i samma commit eller typecheck faller.

DEPLOY: supabase functions deploy med --project-ref mot STAGING-REF (samma ref 302.1 verifierade). Bada EF-erna (preview-receipt, generate-event-attachment) deployade EXIT 0. Prod ORORD -- Marcus moment.

PREMISS-PASS: origin/main var vid start exakt commit-SHA:n uppdraget angav (matchade). _shared/utkast.ts fanns efter git switch. Radnumren i uppdraget verifierade mot faktisk fil FORE andring -- alla stammde inom uppdragets egen tolerans. Ingen ovrig divergens mot uppdraget.
<!-- SECTION:NOTES:END -->
