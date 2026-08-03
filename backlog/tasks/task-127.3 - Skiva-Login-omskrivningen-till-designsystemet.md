---
id: TASK-127.3
title: 'Skiva: Login-omskrivningen till designsystemet'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-03 13:13'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
  - TASK-127.2
parent_task_id: TASK-127
ordinal: 207000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Login-vyn — första skärmen Roger och Lotta ser — skrivs om till designsystemet enligt prototyp-facit: appens formprimitiver, enumeration-neutral felhantering och lugnt laddläge. Den gamla vyns ouppfyllda refaktor-löfte från Fas 3 infrias och tas bort. Koordination: ingen parallell session rör login-ytan under skivan (bokfört mot UI-spåret).

Täcker användarberättelse: 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Login-vyn använder designsystemets primitiver fullt ut — ingen rå Tailwind kvar
- [ ] #2 Felmeddelanden är enumeration-neutrala: samma svar oavsett om adressen finns
- [ ] #3 Befintlig autentiserad e2e och a11y-sviten gröna
- [ ] #4 Prototyp-facit följt; varje avvikelse öppet bokförd
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGKRAV UR PROTOTYP-PASSET (TASK-127.2 divergensfas, 2026-08-03) — variant-oberoende, gäller oavsett vilken variant Marcus väljer.

SKARP BUGG FÅNGAD OCH DIAGNOSTISERAD i prototypen: efter ett misslyckat inloggningsförsök kunde nästa försök med RÄTT lösenord aldrig slutföras — submit-handlern eldade aldrig, tyst och reproducerbart.

ROTORSAK: React Arias default validationBehavior="native" speglar isInvalid/errorMessage via input.setCustomValidity(...). Webbläsaren rensar den strängen ENDAST vid en lyckad native submit — inte för att värdet ändras. Nästa submit blockeras därför av webbläsarens EGEN constraint-validering INNAN onSubmit hinner köra; input.validity.customError är fortfarande true trots ett giltigt nytt värde.

ÅTGÄRD I PROTOTYPEN: validationBehavior="aria" på lösenordsfältet. Bevisat i båda riktningar — felet reproducerat två gånger, fixen applicerad, därefter verifierat skarpt (fel → felmeddelande → nytt lösenord → lyckad övergång) på BÅDA skärmarna, som delar samma lösenordsfält-komponent.

VARFÖR DETTA STÅR HÄR: prototypkod befordras aldrig (throwaway-kontraktets klausul iv) — den skarpa implementationen skrivs nyskriven i denna skiva. Utan denna not återintroduceras buggen med hög sannolikhet, eftersom den bara syns vid ANDRA försöket och inte fångas av ett test som prövar ett enda felaktigt försök.

TESTKRAV SOM FÖLJER: sviten ska pröva sekvensen fel → rätt, inte bara fel. Ett test som slutar vid det första felmeddelandet hade varit grönt genom hela buggen.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
