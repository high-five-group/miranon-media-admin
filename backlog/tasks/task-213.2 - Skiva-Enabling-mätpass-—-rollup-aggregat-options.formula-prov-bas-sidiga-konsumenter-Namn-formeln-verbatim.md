---
id: TASK-213.2
title: >-
  Skiva: Enabling-mätpass — rollup-aggregat, options.formula-prov, bas-sidiga
  konsumenter, Namn-formeln verbatim
status: To Do
assignee: []
created_date: '2026-08-14 17:22'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-213
ordinal: 389000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: ett read-only mätpass som stänger fyra av planens sex
mätbehov FÖRE fix, plus ett litet, betydelselöst staging-prov. Utan detta
pass designas fyra kommande skivors fixar på gissningar om vad de ersätter.
Ingen bas rörs annat än det enda uttalade staging-provet i AC #2.

Fyra mätuppgifter:
1. Läs rollup-aggregatens uttryck i Airtables UI för fälten som Å2 (skiva 3)
   och Å8 (skiva 9) ska skriva om — aggregat-uttrycket går inte att läsa via
   API:t.
2. Pröva om `options.formula` går att PATCH:a via Airtables Web API mot ETT
   betydelselöst formelfält i STAGING (`apphjj8Q7lkXCMsL4`) — planens
   enskilt mest hävstångsrika omätta fakta: håller det kan formelfixarna i
   skiva 3, 4, 5, 7, 8, 9 skriptas och granskas i en diff; håller det inte är
   var och en handarbete i UI:t.
3. Kartlägg bas-sidiga konsumenter (vyer, interfaces, formulär) på Personer
   (elva vyer), Anmälningar (sju) och Eventplanering (elva) via
   claude.ai-connectorns `list_views_for_table` / `list_pages_for_base` /
   `get_form_schema` (read-only) — krävs FÖRE skiva 4 (Å3) och varje
   fältradering i en framtida våg.
4. Läs `Personer.Namn`s (`fldnYys0Ac3UGOdpe`) fullständiga formeltext
   verbatim i Airtables UI — dagens kunskap om grenen som returnerar
   `"Ej tillgängligt"` kommer enbart från frysta dokument.

**HITL — Marcus-moment, obligatoriskt.** Uppgift 1 och 4 kräver att en
människa öppnar Airtables UI och läser en formeltext som API:t inte
exponerar; uppgift 3 kräver claude.ai-connectorns interaktiva autentisering
(kan saknas i headless/AFK-körning). Uppgift 2 är en mutation, om än på ett
betydelselöst fält i staging — utförs med Marcus informerad, ingen prod
berörs i denna skiva.

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § De åtta omätta
punkterna (punkt 1, 2 [options.formula-delen], 6) samt § Å3 mätbehov (a),
med underlag i `bas-defekt-kartlaggning-live-2026-08-14.md` § Vad jag inte
kunde belägga och `bas-defekt-konsumtionskarta-2026-08-14.md` § Oväntade
fynd.

Täcker användarberättelser: 12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rollup-aggregatens uttryck för Utskickslogg.Antal skickade och Eventplanering.Antal anmälningar lästa verbatim i Airtables UI och dokumenterade i Implementation Notes
- [ ] #2 options.formula-PATCH provat mot ett betydelselöst formelfält i staging — utfallet (går/går inte) dokumenterat med HTTP-status och svarskropp
- [ ] #3 Bas-sidiga konsumenter kartlagda för Personer (elva vyer), Anmälningar (sju) och Eventplanering (elva) via claude.ai-connectorns list_views_for_table/list_pages_for_base/get_form_schema — vy-villkor för minst Leads-vyn på Personer dokumenterade
- [ ] #4 Personer.Namn-formelns fullständiga text läst verbatim i Airtables UI och citerad i Implementation Notes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Rollback-väg dokumenterad och bevisat reversibel (formeltext eller record-ID:n sparade verbatim) FÖRE varje prod-mutation, per skiva
- [ ] #6 Marcus-GO för prod-mutationen explicit citerat i skivans Implementation Notes, per skiva
<!-- DOD:END -->
