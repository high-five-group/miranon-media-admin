---
id: TASK-132
title: >-
  Fynd: /to-issues stämplade spårets DoD på varje barnkort — TASK-127-spåret är
  därmed DEADLOCKAT och 126-spåret hårt bundet till deploy
status: To Do
assignee: []
created_date: '2026-08-03 10:02'
updated_date: '2026-08-03 10:02'
labels:
  - ready-for-human
dependencies: []
priority: high
ordinal: 218000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Funnet 2026-08-02→03 (S96, AFK-natten + morgonens genomgång). Blockerar hela T95-exekveringen.

DEADLOCKEN I 127-SPÅRET, verifierad mot kortfilerna:
- TASK-127.4 och TASK-127.5 har dependencies: [TASK-127.1]. De är oplockbara tills 127.1 är Done.
- TASK-127.1:s DoD punkt 6 lyder: 'Rundturs-e2e (inbjudan → accept → inloggning) grön mot staging före kortets Done.'
- Den rundturs-e2e:n ÄR TASK-127.9:s leverabel ('Skiva: Rundturs-e2e — inbjudan till inloggad mot staging').
- TASK-127.9 har dependencies: [TASK-127.3, TASK-127.5, TASK-127.6].
- TASK-127.5 har dependencies: [TASK-127.1].

Cykeln: 127.1 Done kräver 127.9 → 127.9 kräver 127.5 → 127.5 kräver 127.1 Done. Spåret kan inte fortsätta, inte ens efter Marcus prototyp-pass (TASK-127.2). Prototypen löser en ANNAN blockering (127.3 + 127.6), inte denna.

126-SPÅRET: inte cirkulärt, men hårt bundet. TASK-126.1:s DoD punkt 5 kräver 'Marcus-verifikat på riktig enhet per huvudväg (iPad-hemskärm, Mac-Safari Dock, Chromium-prompt) EFTER Grind 0'. TASK-126.4 kräver 126.1 Done. Alltså: ingen 126-skiva efter den första kan plockas förrän appen är deployad på Vercel.

ROTORSAKEN: /to-issues stämplade PRD:ns SPÅR-NIVÅ-grindar på varje barnkorts DoD. Samtliga 127.x bär identiska #5/#6/#7; samtliga 126.x bär identiska #5/#6. Grindar som gäller spåret som helhet ('ingen skarp inbjudan före DMARC är satt') kan per konstruktion inte uppfyllas av en enskild skiva, och när en av dem pekar på en systerskivas leverabel sluts en cirkel.

FÖRSLAG TILL RÄTTNING (ej beslutat — DoD-text är spec och därmed Marcus):
1. Skivans DoD bär ENDAST skiv-nivå-grindar: AC avbockade · lokala grindar gröna för rörd fil-klass · CI grön per jobb · inga orelaterade filer. Det är de fyra universella.
2. Spår-nivå-grindarna FLYTTAS till PRD-kortet (TASK-126 respektive TASK-127), där de hör hemma — de gatar spårets Done, inte varje skivas.
3. Där en skiva GENUINT har en egen mänsklig grind stannar den kvar på just den skivan. Exempel: Gunilla-principen på TASK-126.3 (som bygger install-ytans text) och enhetsverifikatet på TASK-126.5 (QA-kortet). Granskningsvåg-egenskapen bevaras alltså där den är verklig, och tas bort där den var en stämpel-artefakt.

ANDRA ORDNINGENS FRÅGA, egen post: stämplingen kom ur /to-issues-skillen. Rättas bara korten återkommer mönstret vid nästa spår. Om rättningen bekräftar rotorsaken hör en hub-ändring hemma i marcus-system-pluginet.

BELÄGG: samtliga deps och DoD-rader lästa ur backlog/tasks/task-126*.md och task-127*.md på main 6251d95e, 2026-08-03.
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
KLASSAD ready-for-human / high (orkestreraren, 2026-08-03, på Marcus delegation). SKÄL: HIGH eftersom kortet blockerar HELA T95-exekveringen — inte en skiva utan två spår. ready-for-human eftersom rättningen är en DoD-text-ändring på 15 kort, och DoD är spec: samma gräns som gjorde att orkestreraren inte skrev om 126.4:s AC i natt (TASK-130). Förslaget i beskrivningen är just ett förslag; valet av var varje grind hör hemma är Marcus.
<!-- SECTION:NOTES:END -->
