---
id: TASK-36.3
title: 'Skiva: D1-klassen — UI-ytan får riskproportionell svit'
status: To Do
assignee: []
created_date: '2026-07-23 17:12'
labels:
  - ready-for-agent
dependencies:
  - TASK-36.2
parent_task_id: TASK-36
ordinal: 92000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idag betalar en ren färg- eller tokenändring samma pris som en ändring i affärslogiken: hela sviten, inklusive den enda staging-mutexen, omkring tio minuter plus kötid. Det är både långsamt och fel signal — staging-testerna säger ingenting om huruvida en knapp fick rätt nyans, medan de tester som FAKTISKT hade sagt något drunknar i väntetiden.

Efter denna skiva känner CI igen en ren UI-ändring och kör det som är relevant för den: lint, snabbtester och a11y — men inte staging, och därmed utan att ta mutexen. Svarstiden går från cirka tio minuter plus kö till ett par minuter, och signalen blir MER relevant för ytan än dagens fullsvit är.

Säkerheten ligger i att klassningen är en allowlist, aldrig en blocklist. Bara det som uttryckligen räknas upp kan bli lågrisk; allt annat, inklusive filtyper vi inte tänkt på än, faller till full svit. Exkluderingarna ärvs oförändrade från dokumentationsklassen, så en ändring av CI-konfigurationen eller låsfilen kan aldrig smyga in i snabbfilen ens när den råkar ligga i samma commit som en CSS-fil.

Beviset är kontrastkörningar, inte resonemang: tre verkliga körningar som visar att klassningen biter åt rätt håll i alla tre riktningarna. Ett fjärde bevis fås gratis — hygien-posten i denna skiva rör låsfilen för ignorerade filer, som står i exkluderingen och därför måste dra full svit.

Hygien-posten: katalogen med browser-verktygets artefakter har rapporterats ospårad i åtta sessioner och stagats av misstag två gånger. Den blev en kandidat i en sessions end-pass-lista utan durabel bärare och dog med den sessionens stängning. Här är bäraren ett acceptanskriterium i stället för en anteckning, och den rider med denna skiva just för att skivan ändå kör full svit.

Täcker användarberättelser: 1, 2, 3, 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En ny riskklass D1 detekteras deterministiskt ur ändrade filer: stilmallar, CSS och publika statiska filer
- [ ] #2 D1 bär SAMMA exkluderingsmönster som dokumentationsklassen redan har — CI-konfiguration, paketmanifest, låsfil och byggkonfigurationer kan ALDRIG bli D1
- [ ] #3 Vid D1 skippas staging-jobbet (och därmed mutexen); lint, snabbtester och a11y kör
- [ ] #4 Allt som inte uttryckligen matchar D0 eller D1 kör full svit — okänt givet klassas som högsta risk
- [ ] #5 Jobb skippas internt med villkor, ALDRIG via path-filter på workflow-nivå — paraply-checken rapporterar alltid
- [ ] #6 Kontrastbevis-tripeln körd med citerade körnings-ID: ren UI-ändring ger D1 utan staging · UI plus komponentkod ger full svit · UI plus CI-konfiguration ger full svit
- [ ] #7 Katalogen med browser-verktygets artefakter är tillagd bland ignorerade filer och syns inte längre som ospårad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Statiska workflow-grindar gröna på ändrad CI-konfiguration (actionlint, yamllint, shellcheck strict)
- [ ] #6 Kontrastbevis körda och körnings-ID:n citerade på kortet — ett bevis utan ID räknas inte
- [ ] #7 L322-invarianten oregresserad: paraply-checken har alltid-kör-villkoret ENSAMT och exit:ar 1 vid failure/cancelled
<!-- DOD:END -->
