---
id: TASK-309.38
title: >-
  Fynd: väntetexten i PDF-fönstret personlig och Gunilla-begriplig, och
  'Förhandsgranska först' blir 'Förhandsgranska'
status: To Do
assignee: []
created_date: '2026-08-29 07:34'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 609000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-08-29 (S113 sessionsstart, TASK-309.11 punkt 1, event RIM 1 Rönninge 12–13 sept), ordagrant: "Det kommer upp en text i det nya 'pdf-fönstret' typ 'detta fönster byter till pdf:en när den skapats', jag skulle vilja byta ut den till typ 'Ett ögonblick XX (Username: Lotta), pdf:en skapas och visas här om några sekunder' … I mitt fall så skulle det stå alltså 'Ett ögonblick Marcus, bilagan skapas och visas här om några sekunder'." och "Förhandsgranska-knappen har texten 'Förhandsgranska först', jag vill byta till bara 'Förhandsgranska'."

VERIFIERAT LÄGE (main 10c0cedf, läst av orkestreraren 2026-08-29): laddningssidan skrivs av skrivLaddningssida (src/lib/skriv-laddningssida.ts:139) från src/components/dokument/GenereringsVy.tsx:735–738 (förhandsgranskning: 'Skapar förhandsgranskningen. Sidan byter till PDF:en när den är klar.') och :780–783 (skapa: 'Skapar ${meta.namn.toLowerCase()}n. Sidan byter till PDF:en när den är klar.'). Knappen: GenereringsVy.tsx:1132 ('Förhandsgranska först'; pending-etikett 'Skapar PDF …'). Förnamnet finns redan i klienten: user.displayName (src/auth/AuthProvider.tsx:45–47, user_metadata.display_name) + fornamn() (src/components/hem/hem-derivations.ts:127) — samma källa och form som Hem-hälsningen (TASK-220). Pröva varje adress mot disk före bygge (ADR-086).

SCOPE-GRÄNS — ENDAST texter och etiketter. Flödet i sig (nytt fönster även vid Skapa, dubbelrendering, återvändo till dokumentvyn med markerad rad, kvittots form) är ett separat designarbete under research + grillning och rörs INTE här. Skriv inga nya mekanismer.

FORM (Gunilla-principen, ORDLISTA): förhandsgranskning → 'Ett ögonblick <Förnamn>, förhandsgranskningen av <dokumentnamnet i bestämd form> skapas och visas här om några sekunder.'; skapa → 'Ett ögonblick <Förnamn>, <dokumentnamnet i bestämd form> skapas och visas här om några sekunder.' Dokumentnamnet ur meta.namn (bekräftelsebilagan / deltagarinformationen) — aldrig hårdkodat 'bilagan'. Saknas displayName: 'Ett ögonblick, …' utan namn och utan tomt mellanslag/komma. Titeln (document.title) på laddningssidan uppdateras i samma anda. Svep alla anropare av skrivLaddningssida (grep) — kvittoförhandsgranskningen ska bära samma form, eller avvikelsen bokförs med skäl (jfr TASK-309.26 AC #4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Laddningssidans text är personlig med förnamnet ur user.displayName via fornamn(), i formen ovan, med korrekt fallback utan namn — bevisat med test för BÅDA fallen (med och utan displayName) och för båda dokumenttyperna (meta.namn)
- [ ] #2 Knappen heter 'Förhandsgranska' och pending-etiketten 'Förhandsgranskar …' (inte 'Skapar PDF …'); primärknappen 'Skapa <dokumentnamn>' oförändrad; befintliga tester som matchar de gamla strängarna uppdaterade och gröna
- [ ] #3 Alla anropare av skrivLaddningssida svepta: kvittoförhandsgranskningen bär samma form, eller avvikelsen är bokförd i Implementation Notes med skäl
- [ ] #4 Gunilla-läsning av alla ändrade strängar: inga tekniska ord utöver 'PDF', ingen 'sidan byter'-formulering kvar (grep i src/ på 'byter till PDF' ger 0 träffar)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
