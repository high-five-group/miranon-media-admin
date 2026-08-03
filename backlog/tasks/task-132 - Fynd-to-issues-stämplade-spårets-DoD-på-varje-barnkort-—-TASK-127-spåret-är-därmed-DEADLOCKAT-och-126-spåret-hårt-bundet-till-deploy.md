---
id: TASK-132
title: >-
  Fynd: /to-issues stämplade spårets DoD på varje barnkort — TASK-127-spåret är
  därmed DEADLOCKAT och 126-spåret hårt bundet till deploy
status: Done
assignee: []
created_date: '2026-08-03 10:02'
updated_date: '2026-08-03 11:40'
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
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KLASSAD ready-for-human / high (orkestreraren, 2026-08-03, på Marcus delegation). SKÄL: HIGH eftersom kortet blockerar HELA T95-exekveringen — inte en skiva utan två spår. ready-for-human eftersom rättningen är en DoD-text-ändring på 15 kort, och DoD är spec: samma gräns som gjorde att orkestreraren inte skrev om 126.4:s AC i natt (TASK-130). Förslaget i beskrivningen är just ett förslag; valet av var varje grind hör hemma är Marcus.

BESLUT (Marcus delegerade avgörandet till orkestreraren, 2026-08-03: "Du får avgöra vad vi behöver göra, vilket som blir bäst"). Rättningen utförd enligt beskrivningens tre punkter, med en förenkling och en skärpning:

FÖRENKLINGEN: punkt 2 sa att spår-grindarna skulle FLYTTAS till PRD-korten. De låg redan där — verifierat mot disk: task-126 (PRD) bar #5+#6 och task-127 (PRD) bar #5+#6+#7, identiska med barnens. Ingreppet blev därför en ren BORTTAGNING från barnen. PRD-korten är ORÖRDA (6 resp 7 DoD-poster kvar).

SKÄRPNINGEN: #5 (prototyp-passet) togs bort även från 127.3 och 127.6, trots att de är "login- och accept-skivorna" grinden namnger. Skälet: dependencies [TASK-127.1, TASK-127.2] kodar redan samma koppling, och deps är det instrument do-work:s plockbarhetsfilter faktiskt läser. Att behålla en grind av exakt den klass som orsakade deadlocken, som redundans, är att spara felet i miniatyr.

BEHÅLLNA SKIV-GRINDAR (fyra, där grinden är genuint skiv-nivå): Gunilla-principen på 126.3 (bygger install-ytans text) · enhetsverifikatet på 126.5 (QA riktiga enheter) · skarp-inbjudan-spärren på 127.10 (QA skarpt — det ÄR go-live-ögonblicket). Övriga elva skivor bär nu enbart de fyra universella.

UPPLÅST, verifierat: 127.1 och 126.1 hade #1-#4 bockade och blev därmed Done-bara — båda flippade till Done. Det gör 127.4, 127.5 och 126.4 plockbara. RÄKNINGEN I DETTA KORT VAR FEL: beskrivningen sa "låser upp fyra kort", faktiskt utfall är TRE. Differensen är 126.3, som blockeras av 126.2 — och 126.2 hänger på TASK-131:s klassfråga, inte på denna deadlock.

ROTORSAKS-FORMULERINGEN I BESKRIVNINGEN ÄR FÖR BRED och rättas här. Den sa att /to-issues stämplade spår-grindar på barnen. Det stämmer, men det är inte felet: stämplingen är designat beteende och har burit granskningsvågorna i TIO tidigare PRD-familjer utan problem. Mätt 2026-08-03 över hela backlog/: task-1, 4, 8, 9, 17, 18, 19, 36, 54 och 59 bär ALLA identiska extra-DoD-poster på samtliga barn.

DET SOM SKILJER T95 ÄR GRINDARNAS GRAMMATIK. Alla tidigare spår-grindar är predikat över SKIVANS EGET ARBETE och uppfylls av skivan själv — verbatim: "Design-review ... per skiva med UI-yta" (17/18/19) · "varje BERÖRD facit-punkt" (17/18/19) · "varje FLYTTAD fil har tvåsidigt bevis" (59) · "körnings-ID:n citerade PÅ KORTET" (36). En skiva utan UI-yta uppfyller design-review-grinden vakuöst. De skapar granskningsvågor men aldrig ett beroende utåt.

T95:s grindar refererar i stället (a) en SYSTERSKIVAS LEVERABEL — #6 rundturs-e2e ÄR 127.9, vilket är den enda äkta cykeln, och #5 prototyp-pass ÄR 127.2 — eller (b) en HÄNDELSE UTANFÖR REPOT: "efter Grind 0" (Vercel-konto) och "före DMARC-posten satt" (DNS). Klass (b) kan per konstruktion aldrig uppfyllas av kod alls.

Den verkliga rotorsaken: T95 är det första deploy-bundna spåret, och det första där e2e-grönt både är spår-grind OCH egen skiva. /to-issues saknar kontroll som skiljer de två grammatiska klasserna. Tio familjer klarade sig för att de var rena kod-/testspår inom repot — inte för att skillen var rätt.

ANDRA ORDNINGENS FRÅGA, klassad: hub-fixen ska INTE vara "sluta stämpla" (det river tio familjers fungerande granskningsvågor). Den ska vara en regel om vad en spår-grind får REFERERA: endast predikat över skivans eget arbete; grindar som namnger en systerskivas leverabel eller en händelse utanför repot hör på PRD-kortet. Det är en rad i /to-issues-skillen, inte ett eget spår — därför inget eget kort. Registrerad som tråd T115.
<!-- SECTION:NOTES:END -->
