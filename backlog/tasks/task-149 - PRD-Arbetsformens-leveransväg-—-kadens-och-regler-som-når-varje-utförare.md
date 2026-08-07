---
id: TASK-149
title: 'PRD: Arbetsformens leveransväg — kadens och regler som når varje utförare'
status: To Do
assignee: []
created_date: '2026-08-07 10:26'
updated_date: '2026-08-07 11:19'
labels:
  - ready-for-human
dependencies: []
ordinal: 254000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Arbetsformens regler når inte utföraren när arbete återupptas. Iterations-kadensens regel (prototype-skillen § 5) var skriven, mätt och specifik — men S93:s resume-väg laddade den aldrig, och en PR pushades + armerades per iterationsvarv (T126, #838; tidigare mätt i T116: #664/#666 = 15–20 min kö per varv för sekunders arbete). Rotorsaks-hypotesen — regler bor i skillen som STARTAR arbetsformen, men arbete återupptas oftare än det startas — är bokförd som ÖPPET OPRÖVAD. Bredare: push-ekonomin (commit ofta, push vid färdig enhet) saknar kodifierad hemvist med undantagslista, och Marcus generella fråga "pushar vi för ofta?" fick sitt svar ur mätdata i grillningen — men svaret måste bo i mekanism och kodifiering, inte i en konversation.

### Lösning

Tillstånd som mekanismer läser, inte regler i dörrar. En arbetsform-tillståndsfil (per arbetsträd, otrackad) sätts när iterations-/konvergensläge inleds och läses av en PreToolUse-hook på git push som nekar med anvisning så länge läget råder — level-triggered och väg-oberoende. Rotorsaks-hypotesen bevisas till MÄTT. Hub-skillsen sätter/rensar tillståndet och handoffen bär en ARBETSFORM-rad så resume ärver läget utan skill-laddning. Push-ekonomins undantagslista + granskning-mot-staging-regeln kodifieras. En inventering kartlägger samtliga arbetsform-regler efter bärarklass; varje bärarlös regel blir eget kort. ADR-097 kodifierar principen.

### Användarberättelser

1. Som Marcus vill jag att en iterationssession aldrig pushar per varv oavsett vilken väg utföraren kom in, så att jag inte behöver upprepa samma korrigering en tredje gång.
2. Som utförare vill jag möta arbetsformens regler som tillstånd i min miljö, så att min efterlevnad inte beror på vilken dörr jag kom in genom.
3. Som orkestrerare vill jag att push under iterationsläge nekas i handlingsögonblicket med en anvisning, så att felet stoppas mekaniskt i stället för att upptäckas av Marcus i efterhand.
4. Som Marcus vill jag att rotorsaken är MÄTT innan mekanismen förklaras lösa problemet, så att åtgärden inte vilar på en rimlig gissning.
5. Som utförare vill jag ha push-ekonomins undantagslista kodifierad, så att jag vet vad som måste pushas direkt (delat tillstånd) och vad som väntar (färdig enhet).
6. Som Marcus vill jag granska mot dev-server/staging i stället för att vänta på landningar, så att verifieringsmomenten är väntfria.
7. Som systemägare vill jag en karta över alla arbetsform-regler och deras bärare, så att bärarlösa regler upptäcks innan de fallerar i drift.
8. Som framtida läsare vill jag förstå varför push nekas i vissa lägen, så att mekanismen inte rivs som ett hinder.

### Implementationsbeslut

- Tillståndsfil per arbetsträd, otrackad (gitignore-post). Innehåll: aktiv arbetsform, inträdes-tidsstämpel, vem satte den. Hooken läser filen vid varje push-försök.
- PreToolUse-hook matchar Bash med git push; deny-skälet är en anvisning (lokal commit per varv · push när Marcus säger klart · hur läget lämnas). Fail-closed på korrupt/oparsbar tillståndsfil; FRÅNVARO av fil = inget särskilt läge = släpp igenom (normalflödet ska aldrig träffas).
- Hub-sidan: prototype-skillen sätter/rensar tillståndet; session-paus skriver ARBETSFORM-rad i handoff-blocket; session-resume återskapar tillståndsfilen ur raden. Plugin-bump + Code-reinstall i samma landning per etablerad praxis.
- Hypotes-beviset: artefakt-läsning (S93-sessionsdok/transcript + skill-beskrivningarnas trigger-mekanik) + strukturell analys av resume-vägen; T126 uppdateras från HYPOTES till MÄTT med belägg, eller falsifieras öppet.
- Push-ekonomin: tabellen (pushas direkt: nummerbärande artefakter, lifecycle-flippar, allt före paus/handoff, hub-bumps, säkerhetsfixar · väntar till färdig enhet: iterationsvarv, WIP inom skiva, utkast) + regeln att granskning sker mot dev-server/staging, aldrig mot väntad landning. Hemvist: CONTRIBUTING § Landnings-ordningen + kort pekare i CLAUDE.md.
- Inventeringen klassar varje funnen arbetsform-regel: mekanisk bärare (hook/grind) · kort-buren (DoD/AC-arv) · startdörrs-bunden (skill/dok som inte auto-laddas vid resume). Grindklassens dubbla bärare (kort-DoD + agentfil) är facit-modellen. Startdörrs-bundna regler är fynd som blir egna kort.
- ADR-097 mintas: över baren (konventionslås för all framtida arbetsforms-design · överraskande utan kontext · verklig avvägning a–d där (c) skill-laddning vid resume och (d) alltid-laddad yta förkastas med skäl).

### Testbeslut

- Hooken: tvåsidig testsvit i deny-familjens form — fäller (push med aktiv iterationsfil), släpper (ingen fil · annan arbetsform · icke-push-Bash), fail-closed (korrupt fil). Externt beteende (exit/permissionDecision), aldrig skriptets inre. Skarpbevis = öppen skuld per hook-regeln.
- Hub-skivan prövas mot hubbens egna grindar; ARBETSFORM-radens rundtur (paus → resume → fil återskapad) verifieras i QA-sessionen.
- Inventeringens kvalitet: varje regel-rad bär källa, bärarklass och belägg — inga obelagd-rader.

### Utanför omfattningen

- Merge-köns/CI:ns struktur (T85-området) — kadensen är beteende, inte infrastruktur.
- Session-batchad push (en push per session) — FÖRKASTAD med mätta skäl (parallella aktörers nummerallokering, agent-synlighet mot origin, write-ahead-principen, stor-batch-risken); bokförs som decline i ADR-097.
- Ny väntetids-mätinfrastruktur — metrics:ci bär redan ledtidsdata och läses vid QA.

### Estimat

7 skivor (varav 1 hub-scopad, 1 QA-kort). Storleksklass medel.

### ADR-koppling

ADR-097 mintas i skiva 1. Styrande: ADR-036 (CI enda mekaniska grinden), ADR-076 (landningsvägen), ADR-096 (väntekontraktet — syskonprincip: tillstånd/mekanism framför prosa), ADR-086 (mottagaren prövar premisser).

### Ytterligare anteckningar

Grillad samsyn: sessionsdok S99 Del 3 (fyra kvitterade frågor). Skarvarna återanvänds från task-148 (hook-testsvits-formen + docs-grindarna, kvitterade i uppdrag 1-grillningen). Kod-verifierat under grillningen: ingen push-hook existerar; bygg-agentens fil saknar kadensregel; DoD-bärarna (kort + agentfil) är facit-modellen för regel-med-bärare.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
