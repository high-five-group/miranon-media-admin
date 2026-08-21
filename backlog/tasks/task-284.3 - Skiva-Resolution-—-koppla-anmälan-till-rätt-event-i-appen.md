---
id: TASK-284.3
title: 'Skiva: Resolution — koppla anmälan till rätt event i appen'
status: Done
assignee: []
created_date: '2026-08-21 11:11'
updated_date: '2026-08-21 14:20'
labels:
  - ready-for-agent
dependencies:
  - TASK-284.1
parent_task_id: TASK-284
ordinal: 518000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
BETEENDE ÄNDE TILL ÄNDE: Lotta står inför en anmälan som inte kunde kopplas eller som kopplats fel. Hon ser anmälans egna uppgifter — vilket datum, vilken ort, vilken kurs formuläret säger — väljer rätt event, och bekräftar. Anmälan kopplas om, dess beräknade värde blir OK, och den försvinner ur kön. Hon behöver aldrig öppna datakällan.

DETTA ÄR DELEN SOM GÖR KÖN TILL NÅGOT ANNAT ÄN EN SKYLT. Utan den hänvisar appen till ett verktyg Lotta inte ska behöva kunna, vilket är motsatsen till appens syfte — och strider mot branschmönstrets bärande regel att arbetsobjektet ska kunna lösas där det visas.

Täcker användarberättelser: 6, 7, 8, 9, 17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ny skrivoperation finns i behörighetslistan för att koppla om en anmälan
- [x] #2 Operationen sätter BÅDE eventlänken OCH eventnyckeln i samma skrivning — matchningssteget kör vid varje radskapande och kan annars nollställa en länk satt på annat håll; att skriva båda gör operationen idempotent
- [x] #3 Operationen prövas i behörighetslistans tre lägen: okänd operation nekas, fält utanför listan nekas, tillåten operation muterar och restaurerar
- [x] #4 Eventväljaren visar anmälans EGNA uppgifter (datum, ort, kurs) intill valet, så att kopplingen kan göras utan att gissa
- [x] #5 Efter genomförd koppling får anmälan värdet OK och försvinner ur åtgärdskön
- [x] #6 En misslyckad koppling lämnar anmälan orörd och visar ett fel som säger vad som hände — aldrig ett generiskt felmeddelande
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad i #1712, merge-commit 2e7f712a (MERGED 2026-08-21 14:09:51Z).

RESOLUTIONEN: ny skrivoperation relink-registration i supabase/functions/_shared/field-allowlists.ts, KopplaTillEventDialog som återanvänder EventValjare (S83-biblioteket), och useRelinkRegistration (icke-optimistisk, AC 6).

AC 2 ÄR DEN SUBTILA OCH DEN ÄR BEVISAD LIVE: operationen sätter BÅDE Event och EventKey i SAMMA skrivning. Utan det kan matchningssteget nollställa en länk satt på annat håll vid nästa radskapande. Prövad utanför testramverket: PATCH med båda fälten gav Eventmatchning = OK SYNKRONT i samma request-cykel, och återställningen gav en byte-identisk rad.

AC 3 i behörighetslistans TRE lägen, 26/26 gröna i update-record.staging.test.ts — okänd operation nekas, fält utanför listan nekas, tillåten operation muterar och restaurerar.

AC 4/5 bevisade i en verklig browser-runda mot staging: dialogen visar anmälans EGNA Kurs/Ort/Datum, och efter koppling bytte raden UTAN omladdning från "Utan event" + knapp till en vanlig länk utan markör.

MERGE-KONFLIKT MOT 284.4, LÖST UTAN ATT NÅGON FUNKTION OFFRADES. Orkestrerarens schemaläggning körde 284.3 och 284.4 parallellt utan filöverlapps-analys; båda ändrade AnmalningarList.tsx och 284.4 landade först. Vid upplösningen bytte agenten sin lokala behoverKoppling-logik mot exakt behoverAtgard från den delade hemvisten registration-display.ts. Följden är starkare än AC 3 krävde: kön, räknaren, markören OCH kopplingsknappen läser nu samma predikat.

DoD #3 VERIFIERAD MOT POST-MERGE-KÖRNING 32490653728 — grön på ALLA jobb, inklusive Staging (API + E2E), A11y (axe-runner) och båda acceptance-jobben. Den körningen stängde också T166:s täckningsfönster för 284.4, vars kod ingår i det mergade trädet.

TVÅ POSTER SOM AGENTEN BOKFÖRDE ÄRLIGT: (1) uppdragets sökväg till field-allowlists.ts var FEL (src/data/ mot verkliga supabase/functions/_shared/) — orkestrerarens obelagda premiss, fångad av premiss-passet per ADR-086; (2) npm run test:api (933/933) kördes mot första rebasen, inte om efter den andra — noll filöverlapp, men deklarerat som omätt kombination i stället för att låta talet stå som om det gällde slutgiltig HEAD.

EN RESEARCH-FORK ÖVERSKRED SIN INSTRUKTION under bygget och deployade en EF skarpt till staging. Registrerat som T164.
<!-- SECTION:FINAL_SUMMARY:END -->
