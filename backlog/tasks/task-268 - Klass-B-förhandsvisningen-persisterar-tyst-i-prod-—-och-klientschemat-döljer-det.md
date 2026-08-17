---
id: TASK-268
title: >-
  Klass B-förhandsvisningen persisterar tyst i prod — och klientschemat döljer
  det
status: To Do
assignee: []
created_date: '2026-08-17 11:48'
labels:
  - ready-for-agent
dependencies: []
ordinal: 484000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur fas 4-underlagets prövning (S102 resume 8, 2026-08-17). TVÅ LAGER, det andra kvarstår efter EF-deployen.

AKUT (löses av fas 4-deployen): fronten skickar {eventId, preview: true} (src/data/adapters/AirtableAdapter.ts:754-758) men prod-baslinjens generate-event-attachment (git show 9742334a:supabase/functions/generate-event-attachment/index.ts) saknar preview-hantering OCH avvisar inte okända body-nycklar. Flaggan ignoreras, den persisterande vägen körs (Storage-uppladdning + Bilagor-radskapelse), svaret blir 201. Nettot: varje Visa-klick på ett event-mallat dokument föder en riktig Bilagor-rad + Storage-fil i prod-basen. MÄTT 2026-08-17 via Airtable-MCP: prod-basens Bilagor-tabell är TOM (0 rader) — föroreningen har INTE hunnit ske, risken är framtida och utlöses av första klicket.

KVARSTÅR EFTER DEPLOYEN (detta korts egentliga arbete): klienten parsar med DocumentPreviewSchema = z.object({ pdfBase64: z.string() }) — ICKE-STRIKT (src/domain/schemas/Attachment.schema.ts:71-73). Okända nycklar strippas tyst, så ett 201-svar från den persisterande vägen parsas som om det vore ett korrekt preview-svar. Det är schemat, inte EF:en, som gjorde felet OSYNLIGT. Ett strikt schema hade fällt direkt. Frågan kortet ska besvara: ska DocumentPreviewSchema och dess syskon vara strikta, och vilken felyta får användaren då?

Kravet detta bryter mot: TASK-246 AC 3 (sidoeffektsfrihet som hård gräns).

BELÄGG: docs/research/fas4-ef-deploy-underlag-2026-08-17.md rad 173, 428 (beskriver EF-sidan men drar inte ut konsekvensen) — agentens ledvisa verifiering i S102 resume 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Schema-strikthet avgjord för DocumentPreviewSchema och dess syskon — beslut belagt, inte antaget
- [ ] #2 Vald form implementerad; ett svar från fel EF-gren fäller nu synligt i stället för att parsas som giltigt
- [ ] #3 Prod-basens Bilagor-tabell kontrollerad efter fas 4-deployen — noll skräprader, eller städning utförd med antal bokfört
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
