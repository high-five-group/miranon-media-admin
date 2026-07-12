---
id: TASK-9.4
title: 'Skiva: QA-planen — Mer-vyn till FK-mönstret'
status: To Do
assignee: []
created_date: '2026-07-12 10:17'
labels:
  - ready-for-human
dependencies:
  - TASK-9.1
  - TASK-9.2
  - TASK-9.3
parent_task_id: TASK-9
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell browser-testplan (körs när 9.1–9.3 är levererade):

1. Öppna Mer-fliken på mobilbredd (~375) — jämför mot facit-bilagan m6-facit-mobil.png: rubrik, två luftgrupper, ikonval, luft och radhöjd ska matcha.
2. Desktop-bredd — jämför mot m6-facit-desktop.png: kolumnen centrerad (600 px-ytan), samma form.
3. Klicka varje rad (6 st) — landar på rätt sida varje gång; tillbaka till Mer fungerar.
4. Tab genom sidan — synlig fokusring på varje rad och på Logga ut; Enter aktiverar fokuserad rad.
5. Hovra raderna — INGEN bakgrundsändring på raderna; Logga ut-knappen får sin vanliga knapp-hover.
6. Hög-kontrast-läge (prefers-contrast: more) — synliga kantlinjer på korten.
7. Logga ut — hamnar på inloggningssidan; logga in igen fungerar.
8. Hem-fliken — INGEN 'Mina sidor'-platshållare; hälsningen och resten av Hem oförändrat mot K10.
9. Skärmläsar-stickprov (VoiceOver): nav-landmärket 'Mer-sidor', radnamnen läses rent utan ikonbrus, Logga ut annonseras som knapp UTANFÖR navigationen.

Fynd hanteras som NYA kort med exakt symptom + förväntat beteende — planen retuscheras aldrig. Täcker användarberättelser: samtliga (verifieringsgrind)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga nio testpunkter genomförda i browser och godkända av Marcus
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot M6-facitet godkänd av Marcus (granskningsfärdigt läge per ADR-071 för UI-skivor)
- [ ] #6 Facit-paritet: renderad vy computed-verifierad mot M6-måtten (sessionsdok S64 Del 3)
<!-- DOD:END -->
