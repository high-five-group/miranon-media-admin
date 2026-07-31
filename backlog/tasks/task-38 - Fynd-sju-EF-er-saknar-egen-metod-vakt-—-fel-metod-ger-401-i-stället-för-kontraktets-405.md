---
id: TASK-38
title: >-
  Fynd: sju EF:er saknar egen metod-vakt — fel metod ger 401 i stället för
  kontraktets 405
status: In Progress
assignee: []
created_date: '2026-07-24 19:41'
updated_date: '2026-07-31 07:54'
labels: []
dependencies: []
priority: medium
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S84 deny-smoken (2026-07-24) mot prod: get-event-formats, get-events, get-persons, get-registrations, get-segments, get-event-notes och create-admin-user saknar explicit metod-kontroll i index.ts — en GET med giltig Bearer når requireUser/körning i stället för att avvisas 405 (jämför create-event/create-event-note/compute-segment/save-segment/send-email/update-record som har vakten, rad ~9–33). Ingen säkerhetslucka (auth krävs alltid) men API-kontraktet blir asymmetriskt och fel metod med giltig auth ger odefinierat beteende (400/500-klass i stället för 405). Samma kontrakt-hygien-familj som TASK-24 (404-kontraktet).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga tretton allowlistade EF:er avvisar fel metod med 405 före auth-kontrollen (mönstret från create-event rad ~121)
- [x] #2 Deny-smokens källkods-klassning (405/401-splitten) kan tas bort — en förväntan för alla
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Vakten tillagd i de sju som saknade den — sex GET-läs-EF:er (get-event-formats, get-events, get-persons, get-registrations, get-segments, get-event-notes) och create-admin-user (POST). Formen är create-events exakt: handleCors → metod-vakt (405) → requireUser. De sex som redan bar vakten var källkodsverifierade: samtliga hade den korrekt placerad före auth, inga fel-placeringar hittade.

Kontraktet är mekaniserat, inte nedskrivet: tests/api/ef-metod-vakt.test.ts (api-pure, körs i CI-jobbet Pure + Build) läser .prod-functions-allowlist.conf som SSOT och kräver per funktion att metod-vakten finns, svarar 405, ligger EFTER handleCors (annars 405:as varje CORS-preflight) och FÖRE requireUser. Ett fail-closed-test fäller om allowlisten läses tom. Grinden är bevisad i båda riktningar: fyra negativa kontroller (vakt borttagen / vakt efter auth / vakt före handleCors / tom allowlist) gav alla exit 1 med rätt felmeddelande.

AC #2 — vad som faktiskt gick att ta bort: S84:s källkods-klassning var aldrig en committad artefakt. Den levde i S84:s narrativ (research-dokets UTFALL-addendum, L331, BUILD-LOG). Ingenting raderas därför — historiken står kvar korrekt. Det som ÄR uppfyllt: splitten finns inte längre i koden, så nästa deny-smoke bär en förväntan för alla tretton, och grinden ovan håller det så när allowlisten utvidgas.

Ärlig avgränsning: verify_jwt = true i supabase/config.toml gör att Supabase-gatewayen svarar 401 på en anropare utan giltig JWT innan funktionens kod körs. "405 före auth" gäller alltså varje anropare som NÅR funktionen; en anonym begäran med fel metod får fortfarande 401 från plattformen. Discriminatorn är anon-nyckeln (giltigt JWT, faller i requireUser) — samma probe som S84 använde. Bokfört i tasks/lessons.d/en-vakt-forst-i-din-kod-ar-inte-forst-i-kedjan.md.

INGEN DEPLOY utförd. Källan bär nu kontraktet; staging- och prod-artefakterna gör det först vid nästa deploy av respektive miljö.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
