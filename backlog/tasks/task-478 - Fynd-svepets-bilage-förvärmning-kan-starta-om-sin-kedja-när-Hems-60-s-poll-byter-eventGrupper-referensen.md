---
id: TASK-478
title: >-
  Fynd: svepets bilage-förvärmning kan starta om sin kedja när Hems 60 s-poll
  byter eventGrupper-referensen
status: To Do
assignee: []
created_date: '2026-09-19 09:46'
labels:
  - fynd
  - ready-for-agent
dependencies: []
references:
  - 'https://github.com/high-five-group/miranon-media-admin/pull/2547'
priority: low
type: bug
ordinal: 818000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningens runda 2 på PR #2547 (TASK-455), info-fynd, härlett ur kodläsning — INTE observerat: `useForberedSvepBilagor(eventIds)` (`src/data/queries/useEventAttachments.ts`) beror på en referensstabil `eventIds`-lista. Den byggs i `src/components/svep/SvepOverlay.tsx` (~rad 153) ur `eventGrupper`, som i `src/components/hem/Hem.tsx` (~rad 263) härleds ur `registrationsQuery.data` — en fråga som pollar var 60:e sekund (`DASHBOARD_POLLING`, `useDashboardData.ts`). Ändrar ett poll-svar innehåll medan svepet är öppet byts referensen och hela den sekventiella kedjan startar om från grupp 1; den gamla kedjans redan avfyrade länk hinner inte avbrytas.

Konsekvensen är begränsad: högst en extra samtidig hämtning (ingen burst mot Airtables 5 anrop/s), och redan varma grupper visar ingen ny platshållare. Fixen är liten: gör beroendet innehållsstabilt (t.ex. nyckel på de sammanfogade event-ID:na) i stället för referensstabilt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rött-först: test där eventGrupper får ny referens med SAMMA event-ID:n — i dag startar kedjan om (nya anrop), efter fix inga nya anrop
- [ ] #2 En ändrad MÄNGD event-ID:n värmer fortfarande de tillkomna grupperna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
