---
id: TASK-46
title: Dynamisk sidtitel i route-lagret — RouteAnnouncer-tävlingen bort
status: To Do
assignee: []
created_date: '2026-07-25 06:50'
updated_date: '2026-08-28 05:07'
labels:
  - ready-for-human
dependencies: []
ordinal: 107000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur task-18.19:s review-pilot (F2, 2026-07-25): RouteAnnouncer skriver ovillkorligt den generiska staticData-titeln (Event, Person, Anmälan) vid varje klient-navigation, medan sidor med data-driven titel (EventDetail, PersonDetail, AnmalanDetail m.fl.) förfinar document.title när datat landat. Med INSTANT-placeholder (ADR-078) landar sidans skrivning FÖRE announcerns — EventDetail bär i dag en sid-lokal motoffensiv (onResolved-prenumeration + rAF-re-assert, pathname-vaktad). Grundorsaken är app-bred: route-lagret saknar dynamisk titel-mekanik.

Förväntat beteende: EN titel-ägare — route-lagret (t.ex. staticData-titel som funktion av params/cache, eller ett sidan-äger-titeln-kontrakt som announcern respekterar) så att sid-lokala re-asserts kan rivas och annonsering + fönstertitel åter kan hållas koherenta. Berör även skärmläsar-annonseringen (announcern säger Event medan titeln säger eventnamnet).

Symptom-bevis: task-18.19 INSTANT-e2e (toHaveTitle) föll mot Event — Miranon Media Admin före motoffensiven; trail på 18.19-kortet.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fött ur review-pilotens F2 på task-18.19 (S86-nattbatchen). Oetiketterat — plockbarhet klassas av människa (ADR-071).

AC saknas medvetet: kortets Implementation Notes säger explicit 'Oetiketterat — plockbarhet klassas av människa (ADR-071)', och Description föreslår två alternativa arkitekturer (staticData-titel som funktion av params/cache, ELLER ett sidan-äger-titeln-kontrakt) utan att välja. Kräver Marcus-beslut om vilken titel-ägar-modell route-lagret ska bära (påverkar även skärmläsar-annonseringen). Källa: kortets egen Description + Implementation Notes. Verifierat av registerhygien-passet 2026-08-28 (redan taggat ready-for-human).
<!-- SECTION:NOTES:END -->
