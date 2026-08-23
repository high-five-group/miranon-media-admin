---
id: TASK-308
title: >-
  Fynd: Storage-bucketen bilagor fanns aldrig i prod — provision-skriptet är
  staging-låst, preview-receipt gav 502 'Bucket not found'
status: Done
assignee: []
created_date: '2026-08-23 12:29'
updated_date: '2026-08-23 15:34'
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
- [x] #1 Prod-bucketen bilagor verifierad mot BUCKET_DESIRED_CONFIG med skriptets egen konvergenskontroll (privat, 25 MB, application/pdf) — utfall bokfört
- [x] #2 fas4-prod-deploy.sh --kontrollera rapporterar bucketens existens/konvergens; testsviten scripts/test-fas4-prod-deploy.sh täcker raden i båda riktningar
- [x] #3 Prod-provisioneringens väg (skript med lås ELLER dokumenterat dashboard-steg) bokförd i runbook/atkomst-och-nycklar + ADR-124 § Updates
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## AC #1 — ÖPPEN prod-mätning (Marcus-moment)

AC #2 och #3 är genomförda och gröna (se PR). AC #1 kräver en verifiering mot
PROD som en agent inte kan utföra — `scripts/deny-prod-ref.sh` fäller
mekaniskt varje agent-kommando som nämner prod-refen, och det är rätt
(Marcus-order 2026-08-12).

**Vad som ÄR gjort:** `provision-attachments-bucket.mjs` fick ett nytt,
read-only `--kontrollera <ref>`-läge (accepterar valfri ref som ARGUMENT,
matchar mot `SUPABASE_URL`, skriver aldrig). Testat mot STAGING skarpt av
bygg-agenten: `--kontrollera pqtshyierkdgwdnxuirz` gav
`✅ Bucket "bilagor" konvergerad mot BUCKET_DESIRED_CONFIG.`, exit 0.

**Exakt kommando Marcus kör för att stänga AC #1** (`!`-prefixet eller egen
terminal):

```bash
! SUPABASE_URL="https://lvjsfnphlauldxqlncpl.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="$(npx supabase projects api-keys \
    --project-ref lvjsfnphlauldxqlncpl -o json \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
        const k=JSON.parse(s).find(k=>k.name==="service_role");
        process.stdout.write(k.api_key);
      })')" \
  node scripts/provision-attachments-bucket.mjs --kontrollera lvjsfnphlauldxqlncpl
```

Enklare alternativ (samma kontroll + CORS/hemligheter i ett svep):

```bash
! bash scripts/fas4-prod-deploy.sh --kontrollera lvjsfnphlauldxqlncpl
```

Förväntat vid grönt utfall: `✅ Bucket "bilagor" konvergerad mot
BUCKET_DESIRED_CONFIG.`, exit 0. Bocka AC #1 (`npx backlog task edit 308
--check-ac 1`) när utfallet är bokfört här — inte innan.

Källa: `ADR-124` § Updates 2026-08-23 (`TASK-308`) ·
`docs/reference/atkomst-och-nycklar.md` § "Prod-provisionering av externa
Storage-resurser".

AC #1 PROD-MÄTT 2026-08-23 ~15:35Z av Marcus (fas4-prod-deploy.sh --kontrollera <prod-ref>, kört från s108-bilagesparet på main 42e55431): 'Bucket "bilagor" redan konvergerad (public=false, fileSizeLimit=26214400, allowedMimeTypes=application/pdf). Ingen ändring.' → ✅ konvergerad mot BUCKET_DESIRED_CONFIG, exit 0, länkläge orört. Samma körning visade DOCRAPTOR_API_KEY i prod-secrets (digest identisk med staging — ADR-125 § 4). Bifynd, ej denna skivas: INVITE_REDIRECT_URL saknas i prod-secrets; invite-user faller till undefined → Supabase Site URL (pre-existing, ej blockerande, noterat i S108 Del 15). CI grön på #1862 (landad b71a433e).
<!-- SECTION:NOTES:END -->
