---
id: TASK-371
title: >-
  Fynd: Inställt-anmälningar räknas som aktiva i eventsidans registerfilter och
  i dörrlistan — samma lucka som Är aktiv bar före TASK-368.1
status: To Do
assignee: []
created_date: '2026-09-03 08:39'
labels:
  - ready-for-agent
dependencies: []
ordinal: 665000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Symptom
Granskningen av PR #2232 (TASK-368.1, S115 2026-09-03) fann två ställen som fortfarande exkluderar bara Avbokad/Ombokad, inte Inställt:
1. Eventsidans registerfilter: stegTest() i src/components/events/detail/hallplats-steg-prototyp.ts (rad ~239-246) — casen 'avgift-saknas', 'slut-saknas', 'klar' och 'eventinfo-saknas' använder `r.status !== RegistrationStatus.AVBOKAD`. En inställd anmälan med obetald avgift visas under 'Saknar anmälningsavgift', trots att registerOrdning() redan sorterar Inställt i en egen hink.
2. Dörrlistan vid incheckning: byggRaderD() i src/components/events/EventCheckin.tsx (rad ~268) hoppar bara över AVBOKAD. En anmälan med status Inställt går att checka in.
Båda är befintliga luckor (orörda av #2232), avskrivna medvetet av Marcus i loop-beslutet 2026-09-03 (*'Kör på dina rekommendationer'*) för eget kort med eget test.

## Förväntat beteende
Inställda anmälningar behandlas som inaktiva överallt där aktivitet avgör: de dyker inte upp i betalningsfiltren på eventsidan och kan inte checkas in vid dörren (räknas i stället som bortfall, som avbokade). Den delade funktionen arAktivAnmalan (src/lib/aktiv-anmalan.ts, TASK-368.1) är den naturliga källan — men steg-märkenas egen sex-stegs-modell (hallplats-steg) ska inte ersättas, bara filtren och dörrlistan. Testfall per ställe: en Inställt-anmälan syns inte i 'Saknar anmälningsavgift' respektive är inte incheckningsbar; acceptanstesten för eventsidans register och dörrlistan (event-anmalda / event-checkin-dorrlistan) utökas.

## Källa
Review-utlåtande PR #2232 runda 1 (två info/ask-user-fynd), sessionsdok S115 Del 3–4; TASK-213.8 (den ursprungliga defekten, § Kända fällor post 27).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
