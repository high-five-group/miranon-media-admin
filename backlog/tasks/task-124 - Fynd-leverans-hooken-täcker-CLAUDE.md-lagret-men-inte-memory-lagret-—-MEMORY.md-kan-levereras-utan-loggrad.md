---
id: TASK-124
title: >-
  Fynd: leverans-hooken täcker CLAUDE.md-lagret men inte memory-lagret —
  MEMORY.md kan levereras utan loggrad
status: Done
assignee: []
created_date: '2026-08-02 08:45'
updated_date: '2026-08-26 05:04'
labels:
  - ready-for-agent
  - intentionally-unchecked
dependencies: []
priority: low
ordinal: 196000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
T100-fyndet 2026-07-27 (restlistans Spår B-rad, bruten vid session-end 2026-08-02): T100:s spärr-/loggapparat för instruktionsleverans täcker CLAUDE.md-lagret, men MEMORY.md (auto-memory-indexet) levererades utan att logga en rad. Risk: instruktionsleverans via memory-lagret är osynlig för trail och grind — samma klass ADR-083 vaktar för permissions-påståenden, fast på leveransvägen.

UPPGIFT: klassa rätt mekanism — utvidga hook-täckningen, en logg-konvention, eller ÖPPET AVSTÅ. Över-engineering-vakten prövas skarpt: EN observerad instans hittills (ursprungsfyndet), noll incidenter efter. T100-baslinjen (132 händelser, 0 träffar) är måttet en leverans-mekanism verifieras mot.

Källor: tasks/threads/T100-instruktionsleveransen.md · tasks/s91-restlistan.md § Spår B (bruten rad, session-end) · sessionsdok S91 Del 42.6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mekanismval redovisat med skäl + förkastade alternativ (verktygsvals-formen, CONTRIBUTING § Verktygsval)
- [ ] #2 Vid bygge: tvåsidigt bevis — fyrar på memory-leverans, tyst annars
- [x] #3 Vid avstå: beslutet öppet bokfört mot T100-baslinjen (inget tyst förkastande)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S112 fix-våg 4 bunt D. Premiss-pass (2026-08-26): kortets tekniska påstående VERIFIERAT SANT mot Anthropics förstapartsdokumentation (context7 /websites/tailwindcss ersatt av WebFetch code.claude.com/docs/en/hooks + /docs/en/memory, 2026-08-26). InstructionsLoaded-hooken (hooks/log-instructions-loaded.sh + hooks/hooks.json i marcus-system-hubben, plugins/marcus-system/) är EXPLICIT scopead: 'When a CLAUDE.md or .claude/rules/*.md file is loaded into context' — MEMORY.md (auto-memory-indexet, ~/.claude/projects/<project>/memory/MEMORY.md, 'loaded... every session, first 200 lines or 25KB') nämns INTE och triggar INTE hooken. load_reason-enumen (session_start | nested_traversal | path_glob_match | include | compact) beskriver uteslutande CLAUDE.md-lagrets laddningsvägar. Fyndet är alltså INTE falsifierat — det är en verklig, källbelagd täckningslucka.

MEKANISMVAL: ÖPPET AVSTÅ (branschledar-prövningen 'hur löser branschledarna detta' gav inget existerande hook-event för auto-memory-läsning specifikt — Claude Code exponerar helt enkelt inget InstructionsLoaded-liknande event för MEMORY.md; verktygsvalsformen per CONTRIBUTING § Verktygsval).

Skäl: (1) Mekanismen som skulle utökas — InstructionsLoaded — kan STRUKTURELLT INTE utökas till att täcka MEMORY.md: det är ett plattforms-event Anthropic explicit scopear bort auto-memory ifrån, inte en gräns vi äger eller kan konfigurera. (2) Den enda framkomliga byggvägen (en SessionStart-hook som själv läser MEMORY.md:s diskläge vid sessionsstart och loggar en syntetisk rad, motsvarande täckning via en ANNAN mekanism än InstructionsLoaded) lever i sin helhet i marcus-system-HUBBEN (plugins/marcus-system/hooks/), INTE i detta repo — miranon-media-admin äger varken filen som skulle ändras eller dess CI/release-väg (pluginversion + reinstall krävs, samma mönster som T100:s ursprungliga InstructionsLoaded-leverans, hub-PR #5/plugin 1.21.0). Att bygga det som en del av en enskild-repo-PR i bunt D vore fel leveransyta. (3) Över-engineering-vakten, som kortet självt åberopar: EN observerad instans hittills, NOLL incidenter efter — mätbar risk under T100-baslinjens tröskel (132 händelser, 0 träffar var vad som motiverade den ORIGINALA hooken; detta fynd har ingen egen mätserie som visar motsvarande skada). (4) Prioritet Low, blockerar inget pågående arbete (ADR-053-triage: blockerar ej + lågt observerat värde -> förkasta EXPLICIT, ej tyst).

Bokfört mot T100-baslinjen (AC #3): T100:s ursprungliga InstructionsLoaded-hook byggdes efter en mätning (132 händelser över 24 sessioner, 0 träffar på de fyra artefaktnamnen) som bevisade en SYSTEMATISK leveransbrist. Detta fynd har INGEN motsvarande mätning — det är en enda observerad avvikelse (kortets egen 'EN observerad instans'-formulering), inte ett mätt mönster. Beslutet är därför att INTE bygga nu, men lämna vägen öppen: en framtida session (i marcus-system-hubben, inte här) kan lägga en MEMORY.md-läsning i hookens SessionStart-gren (session-facts.sh eller en syskonhook) om incidensen växer förbi T100-tröskeln. Detta är EXPLICIT förkastande, inte tyst — kortet lämnas öppet (ej Done) med detta resonemang bokfört.

OBOCKAT MED AVSIKT: AC #2 ar villkorad 'Vid bygge' - mekanismvalet blev OPPET AVSTA (ingen ny hook byggd; InstructionsLoaded-hooken kan strukturellt inte tacka MEMORY.md, och den enda framkomliga vagen bor i marcus-system-HUBBEN, inte detta repo), sa AC #2:s bygg-villkor ar inte uppfyllt och kryssas darfor inte. Kortets egna notes avslutar med 'kortet lamnas oppet (ej Done)' - det lases har som byggagentens konvention att inte sjalv flippa Done (den flippen ager stangningsbatchen), inte som en sakskiljaktighet mot beslutet: AC #1 och #3 - de tva AC som faktiskt styr detta fynds resolution - ar redan bockade, och avsta-vagen ar exakt den 'oppet bokfort' AC #3 sjalv efterfragar. Stangningsbatch 2 (S112 resume 1, 2026-08-26) flippar darfor status Done pa detta bevis.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1987
<!-- SECTION:FINAL_SUMMARY:END -->
