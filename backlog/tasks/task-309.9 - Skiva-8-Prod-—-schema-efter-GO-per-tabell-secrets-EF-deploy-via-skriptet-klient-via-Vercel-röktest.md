---
id: TASK-309.9
title: >-
  Skiva 8: Prod — schema efter GO per tabell, secrets, EF-deploy via skriptet,
  klient via Vercel, röktest
status: To Do
assignee: []
created_date: '2026-08-23 14:38'
labels:
  - ready-for-human
dependencies:
  - TASK-309.8
  - TASK-309.5
parent_task_id: TASK-309
ordinal: 570000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Allt som byggts blir skarpt i prod-appen: basens struktur, hemligheterna, funktionerna och klienten — i den ordning som gör att inget deployas mot tomhet. Täcker användarberättelser: 26, 27, 28, 30.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prod-schemat skapat efter Marcus GO i klartext per tabell (Eventinnehåll, Agendapunkter, Platser; fälten på Eventplanering och Bilagor) med samma namn och typer som staging; prod-ID:n bokförda i datamodell-referensen; seed (Rönninge + sju Eventinnehåll-rader) lagd
- [ ] #2 DOCRAPTOR_API_KEY satt i staging- och prod-secrets av Marcus via egen terminal (nyckeln passerar aldrig chatten); ENVIRONMENT ger test: false i prod
- [ ] #3 fas4-prod-deploy.sh --kontrollera grön (inkl. TASK-308:s bucket-rad) → --deploya av Marcus; UPDATED_AT verifierad för de rörda EF:erna; allowlist-policyn bär de nya/ändrade EF:erna och inte test-docraptor-render
- [ ] #4 Klienten landad via merge-kön och byggd av Vercel; röktest i prod av Marcus: skapa bekräftelsebilaga för ett riktigt event → filen i listan → bifogbar på Åtgärds-sidan → kvittoförhandsgranskning visar nya mallen utan vattenstämpel
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->
