---
id: TASK-214.6
title: 'Skiva: Marcus QA + godkännandet av den promoverade ytan'
status: Done
assignee: []
created_date: '2026-08-14 19:19'
updated_date: '2026-08-15 07:04'
labels:
  - ready-for-human
dependencies:
  - TASK-214.5
parent_task_id: TASK-214
ordinal: 407000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
B2 steg 2–3: Marcus granskar den promoverade ytan — facit-bilderna är regressionsstöd, inte spec (rollbytet per ADR-103). Kvittensfönstret syns inte i stillbild och upplevs live. Granskningen sker mot dev-servern med staging-fixturens event. Först efter godkännandet får rivningsskivan köra. Täcker användarberättelser: 12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus har granskat den promoverade dörrlistan mot facit-bilderna (mobil 390x844 + desktop 1280x800) och upplevt kvittensfönstret live mot dev-servern
- [x] #2 Marcus godkännande bokfört i klartext (ADR-103 B2 steg 3) — ändringsönskemål hanteras som ny iteration, aldrig tyst justering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskningen utförd mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json (ytan 'check-in (dörrlistan, variant D)')
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
GRANSKNINGEN UTFÖRD AV ORKESTRERAREN på Marcus klartext-mandat (2026-08-14, verbatim: 'Snälla gör granskningen du Claude! Jag vill inte ha några moment här. Jag vill att du orkestrerar oss hela vägen in i mål.') — bokfört öppet: delegeringen ersatte Marcus öga denna gång; ADR-104 beslut 4 gäller oförändrat (vill Marcus ändra något i efterhand är det en ny iteration, aldrig ett brutet löfte). UTFÖRANDE 2026-08-15 ~09:00, mekaniska bevis i stället för tyckande, mot dev-server :5173 (staging-CORS-porten) med granskningsfixturen reckgn7arcyW367qT via temporär aldrig-committad Playwright-fil (bevis-loop-mönstret, riven efter körning): (1) FACIT-JÄMFÖRELSEN — skärmdumpar i exakt facit-viewports (1280x800 + 390x844) lästa mot slutlage-desktop.png/slutlage-mobil.png: strukturellt identiska — sidkrom, eventidentitet, framstegskort med höjdlås, sessionstoggle, sök, radanatomi, kryssruta; enda divergens är dev-railens chip-uppsättning (A/B/C-chips borta efter rivningen i flippen — railen är byggställning som rivs i 214.7, väntad och godartad). (2) KVITTENSFÖNSTRET LIVE — grön rad med bock + 'Incheckad 09:00' + Ångra-knapp INNAN flytt, kvitto-raden i framstegskortets höjdlåsta utrymme, '15 kvar/1 av 16' direkt; tidsstämpeln rotorsakad korrekt (Date.now vid klick — granskningen skedde 09:02 lokal tid). (3) NÄTVERKS-BEVISEN — ångra inom fönstret: NOLL skrivanrop; riktig incheckning: EXAKT EN skrivning t=1243 ms efter klick (efter 1,2 s-fönstret) med kropp set-attendance-status/Status:Närvarande; urbockning i klargruppen: direkt skrivning Ej avstämt (t=156 ms, post-fönster-ångra är vanlig skrivning per F3). Ingen create-attendance triggades (fixturens rader finns — backup-vägen vilar som den ska). (4) STAGING ÅTERSTÄLLD i samma körning (incheckning → urbockning; Astrid Almqvist åter Ej avstämt). B2 steg 2–3 därmed fullbordade — rivningen (214.7) är avblockad.
<!-- SECTION:FINAL_SUMMARY:END -->
