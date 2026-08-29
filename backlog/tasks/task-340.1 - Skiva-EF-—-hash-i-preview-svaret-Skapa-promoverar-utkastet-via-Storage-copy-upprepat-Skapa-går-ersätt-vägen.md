---
id: TASK-340.1
title: >-
  Skiva: EF — hash i preview-svaret, Skapa promoverar utkastet via Storage copy,
  upprepat Skapa går ersätt-vägen
status: To Do
assignee: []
created_date: '2026-08-29 08:18'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-340
ordinal: 620000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan: generate-event-attachment i preview-läge returnerar { url, utgar, kallhash } (hashen beräknas redan före preview-grenen och kastas i dag bort). I skarpt läge tar EF:en ett valfritt kallhash från klienten, räknar om dagens hash server-side och (a) vid likhet OCH befintligt utkast kopierar utkastets bytes till eventets prefix med Storage copy inom bucketen — ingen DocRaptor-rendering; (b) vid skillnad renderar om och svarar underlagAndrat: true; (c) utan utkast renderar tyst. Finns redan en event-mallad rad för (event × Mall) går skrivningen ersatt-vägen (ADR-125 § 3) automatiskt — EF:en gör uppslaget själv — och svaret bär ersatte: true; ingen ny rad, ingen dubblett. rensaUtkast som i dag. Promoveringsbeslutet är en ren funktion i _shared med enhetstester. Responsformen dokumenteras i EF:ens filhuvud och AC-formuleringen där (ADR-124 beslut 3-texten) uppdateras. Deployas till staging. Läs research-passets § 4 (Storage copy: supabase-js ≥ 2.43.5, EF:erna kör esm.sh @2 → 2.112.4; copy() inom bucket belagt) och ADR-124/125 i sin helhet före design. Täcker användarberättelser: 1, 3, 4, 11.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Staging-test: preview → kallhash i svaret; Skapa med samma hash → sparad fil har SHA-256 identisk med utkastets bytes (mätt, inte antaget) och svaret bär promoverad: true; utkastet borttaget efteråt
- [ ] #2 Staging-test: ändrat underlag mellan preview och Skapa (t.ex. eventfält PATCH:at) → omrendering, underlagAndrat: true; Skapa utan föregående preview (inget utkast) → rendering, inget fel; ogiltig/felaktig hash → verifieras server-side, aldrig promovering av fel underlag
- [ ] #3 Staging-test: andra Skapa för samma event × mall → samma attachmentId (ersatt-vägen), ersatte: true, exakt en Bilagor-rad kvar; listan visar ingen '+1 äldre fil'
- [ ] #4 Enhetstestsvit för promoveringsbeslutet (likhet/skillnad/utkast saknas/ersätt-uppslag) grön; befintliga sviter generate-event-attachment.staging + skapa-om-event-bilaga.staging gröna; filhuvud och ADR-124 beslut 3-texten i EF:en uppdaterade (ADR-083)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön — promovering, hash-verifiering och ersätt-uppslag bor i EF/_shared
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s108-generering/facit.json: avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->
