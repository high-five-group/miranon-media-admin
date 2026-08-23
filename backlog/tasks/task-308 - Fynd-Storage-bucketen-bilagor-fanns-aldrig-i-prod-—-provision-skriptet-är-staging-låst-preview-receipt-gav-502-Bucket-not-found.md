---
id: TASK-308
title: >-
  Fynd: Storage-bucketen bilagor fanns aldrig i prod — provision-skriptet är
  staging-låst, preview-receipt gav 502 'Bucket not found'
status: To Do
assignee: []
created_date: '2026-08-23 12:29'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 560000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt skarpt 2026-08-23 12:25Z, första prod-användningen av leveransvägen (`TASK-302`): `POST /functions/v1/preview-receipt` i prod → **502** `sb-error-code: EDGE_FUNCTION_ERROR`, body verbatim: `{"error":"Utkastet kunde inte sparas: Bucket not found","requestId":"58c34132-d1eb-4b23-af6c-1bfbaa3c1934"}`. Appen (Vercel) och EF:erna var båda nya och matchade — felet låg i miljön.

## Rotorsak

`scripts/provision-attachments-bucket.mjs` (`TASK-146.3`) skapar bucketen `bilagor` (privat, 25 MB, `application/pdf`) och **vägrar by design köra mot prod** (`PROD_PROJECT_REF`-guard, exit 1 vid icke-staging-ref). Ingen prod-provisionering finns bokförd (BUILD-LOG, sessionsdok, kort: 0 träffar). Klass A (`upload-attachment`) i prod hade aldrig använts skarpt, så luckan var osynlig tills `preview-receipt` skrev sitt första utkast.

Marcus skapade bucketen för hand i dashboarden 2026-08-23 (samma inställningar som skriptets `BUCKET_DESIRED_CONFIG`) — symptomet är borta, men provisioneringen är nu odokumenterad och oupprepbar för prod, exakt det skriptets eget filhuvud varnar för.

## Att göra

1. Ge skriptet en MEDVETEN prod-väg med samma lås-mönster som `fas4-prod-deploy.sh` (refen som argument, `deny-prod-ref.sh` fäller agenter, Marcus kör själv) — eller bokför dashboard-steget som den kanoniska prod-vägen i `docs/reference/atkomst-och-nycklar.md`/runbook. Välj det som håller konvergens-kontrollen (`bucketConfigMatches`) körbar mot prod i `--dry-run`, så driften kan mätas.
2. Lägg bucket-konvergensen i `fas4-prod-deploy.sh --kontrollera` (read-only: finns bucketen, matchar config) så nästa prod-deploy av en Storage-beroende EF inte kan passera utan att bucketen finns — samma klass som CORS-raden i kontrollens utskrift.
3. Bokför instansen i `ADR-124` § Updates och i `docs/reference/data-model.md` § Bucket `bilagor`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prod-bucketen bilagor verifierad mot BUCKET_DESIRED_CONFIG med skriptets egen konvergenskontroll (privat, 25 MB, application/pdf) — utfall bokfört
- [ ] #2 fas4-prod-deploy.sh --kontrollera rapporterar bucketens existens/konvergens; testsviten scripts/test-fas4-prod-deploy.sh täcker raden i båda riktningar
- [ ] #3 Prod-provisioneringens väg (skript med lås ELLER dokumenterat dashboard-steg) bokförd i runbook/atkomst-och-nycklar + ADR-124 § Updates
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
