---
id: TASK-213.11
title: 'QA: Kontinuerlig bas-maxning våg 1 — registerhygien + manuell korsverifiering'
status: To Do
assignee: []
created_date: '2026-08-14 17:25'
labels:
  - ready-for-human
dependencies:
  - TASK-213.1
  - TASK-213.2
  - TASK-213.3
  - TASK-213.4
  - TASK-213.5
  - TASK-213.6
  - TASK-213.7
  - TASK-213.8
  - TASK-213.9
  - TASK-213.10
parent_task_id: TASK-213
ordinal: 398000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus, staging FÖRST → prod efter varje skivas egen
godkända prod-landning) plus registerhygienen (Å16) i samma landning:

**Del A — registerhygien (Å16, dokumentation, AFK-lämplig underdel):**
1. `data-model.md` § Kända fällor: bocka/uppdatera posterna 27, 31, 32, 34,
   36, 39, 43, 45, 47 med löst-status och länk till respektive skivas PR,
   i takt med att de faktiskt landar (inte i förväg).
2. Rätta § Kända fällor-ingressen mot `ADR-063` § Updates 2026-08-14 — den
   pekar i dag mot en "post-Fas-6-milstolpe" som ADR:n redan rev bort
   (planens § Oväntade fynd, punkt 1).
3. `npm run check:docs` grönt efter ändringen.

**Del B — manuell korsverifiering i browsern, per landad skiva:**
1. MÅNAD/ÅR (skiva 1+10): skapa ett event 2027-01-15 i staging — inget fel.
   Efter skiva 10: ändra ett events startdatum över en årsgräns — `Månad/år`
   följer utan manuell inmatning.
2. MAILLOG + LEADS (skiva 3): maillogens "Antal skickade" stämmer med en
   testrad ≥3 mottagare; de 33 tidigare osynliga leads-kandidaterna syns nu
   (eller är förklarade).
3. NAMN (skiva 4): en tidigare "Ej tillgängligt"-person visar nu förnamn/
   efternamn, "Okänt namn" eller "Namnlös person - {email}" på alla tre
   ytor (personlista, persondetalj, Intresserade).
4. FÖRELÄSNINGS-SEGMENT (skiva 5+6): ett föreläsnings-segment i
   segmentbyggaren visar rätt antal deltagare, inte 0.
5. RIM 3 (skiva 7): en person med genomförd RIM 3 har `Totala deltaganden`
   = `Antal genomförda event` i EF-svaret (devtools/nätverksflik).
6. AKTIV-STATUS (skiva 8): eventsidans register, Gruppdynamik och Åtgärder
   visar samma antal för ett event med en `Inställt`-anmälan.
7. ANMÄLDA/PLATSER KVAR (skiva 9): Psionautics-eventet visar 79 anmälda,
   9 platser kvar — och automation A6 fyrar vid samma faktiska tröskel som
   före fixen (kontrollera A6:s körhistorik efter landning, inte bara
   fältvärdet).
8. Samtliga `fil:rad`-korsverifieringar som citeras i skivorna 1–10 stäms
   av mot faktisk disk (filerna finns, raderna stämmer fortfarande).

Acceptance Criteria:
Ingen — detta är en manuell testplan, inte ett AC-kort (per QA-konventionen).

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § B4 (Å16) och §
Föreslagen arbetsform-tabellens QA-rad.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
