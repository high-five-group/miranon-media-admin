---
id: TASK-241.1
title: 'Skiva: Sändytans konvergens-prototyp → facit-lås'
status: To Do
assignee: []
created_date: '2026-08-16 14:39'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-241
ordinal: 452000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sändytan är Sveparnas ansikte och Marcus WOW-yta — den konvergeras till facit INNAN byggskivorna publiceras, samma rytm som hem-prototypen: agent bygger varv → Marcus granskar RENDERAD yta → iterera till 'lås facit'. Divergens bortvald (Marcus-kvitterad 2026-08-16): interaktionsformen är redan grillad och låst (overlay · EN triad cross-event · ett sändanrop per event-grupp, ADR-114 + Del 10 beslut 1/5/7), och Åtgärds-sidans triad är beprövad förebild (AtgardsSida.tsx + atgarder-*-send-acceptance-sviterna). Motorn återanvänds: useSendActionEmail/useSendActionTestEmail + EF send-action-email (registrationIds[] finns redan; testmail låst till 1 mottagare). Urvals-intag från hemmets pekning: history-state-precedentet mmAtgardsUrval (task-228). Prototypen bor i EGEN katalog (src/components/dev/svep-prototyp/) — hem-prototypens katalog rivs i task-243.5 och rivningarna får inte krocka. Husets sidkrom + NOLL meta-text på ytan (147.6-lärdomen); prototyp-verifiering per docs/reference/prototyp-verifiering-runbook.md (portkartan!). Ordlistan: Morgonkoll, Bevakningsrad. Utforskar användarberättelser 2, 3, 4, 5, 9 i PRD:n.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Konvergens-prototyp av sändytan som OVERLAY ovanpå hem-vyn (Del 10 beslut 1: handlingar påbörjas OCH slutförs utan att Lotta lämnar Hem; siffrorna uppdateras på plats) på egen dev-route med simulerade datalägen så alla tillstånd är dömbara
- [ ] #2 Trygghetstriaden komplett i prototypform: adresslista grupperad per event · bläddringsbar per-event-förhandsvisning · testmail-momentet (simulerat, ingen skarp sändning ur prototypen)
- [ ] #3 Båda svep-instanserna representerade: bekräftelsesvepet och påminnelsesvepet (urval ENDAST läge 1 'Att påminna' — mekaniskt spamsäkert per en-påminnelse-modellen)
- [ ] #4 Övergången hem ↔ overlay skissad i prototypen (WOW-riktningen, prefers-reduced-motion respekterad)
- [ ] #5 Facit LÅST efter Marcus konvergensvarv: manifest under tasks/sessions/bilagor/ (godkand: null tills promoveringsstämpel), B3-markör satt — byggskivorna publiceras först mot detta facit (ADR-102 B5)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
