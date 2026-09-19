---
id: TASK-415.1
title: >-
  Skiva: staging-EF:ernas CORS släpper Vercel-previews via ett mönster i egen
  variabel — cors.ts, Vary: Origin, tester, deploy till staging
status: To Do
assignee: []
created_date: '2026-09-06 11:16'
updated_date: '2026-09-06 12:26'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-415
ordinal: 723000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus GO 2026-09-06 på väg (a) i TASK-415 (research: docs/research/pr-forhandsvisningar-och-backend-branschmonster-2026-09-06.md). supabase/functions/_shared/cors.ts matchar i dag Origin exakt mot CORS_ALLOWED_ORIGINS (komma-separerad, portlåst för E2E: 5173/4173). Vercel-previews får unika origins (commit-form miranon-media-admin-<hash>-marcus-johanssons-projects-1d6d2a3a.vercel.app och gren-form miranon-media-ad-git-<slug>-marcus-johanssons-projects-1d6d2a3a.vercel.app — mät båda mot faktiska deployer via Vercel MCP list_deployments, gissa inte). Bygg: (1) en NY, valfri secret CORS_ALLOWED_ORIGIN_PATTERNS (komma-separerade mönster med * som enda jokertecken, t.ex. https://*-marcus-johanssons-projects-1d6d2a3a.vercel.app — Supabases egen rekommendation för preview-origins, https://supabase.com/docs/guides/auth/redirect-urls), prövad EFTER exaktlistan; mönstret får aldrig matcha ett bart * eller sakna team-suffixet (fail-closed: ett mönster utan minst en literal domän-del ignoreras med loggrad); (2) cors.ts sätter Vary: Origin på svar med Access-Control-Allow-Origin (research sidofynd 3); (3) Deno-tester för matcharen (exakt, mönster, avvisade former, saknad Origin, preflight utan träff → 403) i samma form som repots befintliga EF-tester; (4) deploy till STAGING enbart (staging-refen ur .env.staging; prod-refen får aldrig förekomma i något kommando — deny-prod-ref-låset) och skarpbevis: OPTIONS-preflight mot en staging-EF med Origin satt till en verklig preview-origin ger 204/200 med Access-Control-Allow-Origin = origin och Vary: Origin; med en origin utanför mönstret → 403. CORS_ALLOWED_ORIGINS rörs inte. Bokför i docs/reference/atkomst-och-nycklar.md eller där CORS_ALLOWED_ORIGINS redan är dokumenterad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 cors.ts prövar CORS_ALLOWED_ORIGIN_PATTERNS efter exaktlistan; ett mönster utan literal domän-del ignoreras fail-closed med loggrad; Vary: Origin sätts på alla svar som bär Access-Control-Allow-Origin
- [x] #2 Deno-tester täcker exakt träff, mönsterträff (båda Vercel-adressformerna), avvisad origin, bart *, saknad Origin på preflight
- [x] #3 Deployad till staging; skarpbevis med OPTIONS-preflight för en verklig preview-origin (allow) och en främmande origin (403) bokfört verbatim i kortet
- [x] #4 CORS_ALLOWED_ORIGINS oförändrad; variabeln dokumenterad där den befintliga är
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Skarpbevis (2026-09-06, staging pqtshyierkdgwdnxuirz, EF get-events, OPTIONS-preflight, verbatim):

ALLOW — verklig Vercel-preview-origin (mätt skarpt via GitHub Deployments API för detta repo, gh api repos/high-five-group/miranon-media-admin/deployments/<id>/statuses):
  $ curl -sS -D - -o /dev/null -X OPTIONS -H "Origin: https://miranon-media-admin-462he0s8t.vercel.app" -H "Access-Control-Request-Method: GET" https://pqtshyierkdgwdnxuirz.supabase.co/functions/v1/get-events
  HTTP/2 200
  access-control-allow-origin: https://miranon-media-admin-462he0s8t.vercel.app
  vary: Accept-Encoding, Origin
  access-control-allow-headers: authorization, x-client-info, apikey, content-type
  access-control-allow-methods: GET, POST, PATCH, OPTIONS

DENY — främmande origin:
  $ curl -sS -D - -o /dev/null -X OPTIONS -H "Origin: https://attacker.example.com" -H "Access-Control-Request-Method: GET" https://pqtshyierkdgwdnxuirz.supabase.co/functions/v1/get-events
  HTTP/2 403
  (ingen access-control-allow-origin, ingen Vary: Origin)
  vary: Accept-Encoding

Ytterligare skarpa kontroller (samma EF, samma metod):
  - andra mätta commit-form-origin (miranon-media-admin-n3gl2rmal.vercel.app) → 200, allow-origin ekar
  - gren-form-mönster (miranon-media-ad-git-task-415-1-cors-preview-monster.vercel.app) → 200
  - exaktlistans admin.miranon.dev → 200 (oförändrat beteende, AC #4)
  - lookalike med FEL projektprefix men rätt hash (some-other-project-462he0s8t.vercel.app) → 403
  - underdomän-smuggling (miranon-media-admin-x.evil.com.vercel.app) → 403

Divergens mot uppdraget (bokförd, ADR-086): kortets beskrivna commit-form
(med team-scope-suffix "-marcus-johanssons-projects-1d6d2a3a") stämmer INTE
mot mätt verklighet 2026-09-06 — två oberoende, skarpt uppmätta commit-form-
origins för DETTA repo (via GitHub Deployments API, se ovan) saknar HELT
scope-delen: miranon-media-admin-462he0s8t.vercel.app och
miranon-media-admin-n3gl2rmal.vercel.app. Detta bekräftar (annan metod,
samma dag) forskningspassets eget fynd §1.4. Mönstret byggdes därför mot
MÄTT verklighet (projektnamn som literal-ankare), inte mot uppdragets
antagna form. Vercel MCP (mcp__vercel__list_deployments) är exkluderat ur
bygg-agentens verktygskontrakt (se .claude/agents/bygg-agent.md
disallowedTools) — gren-formens EXAKTA sträng kunde därför inte
skarpmätas (gissningar mot verkliga PR-grenars git-alias gav 404); mönstret
täcker båda kända prefix-varianterna (fullt projektnamn + kortets
dokumenterade trunkerade "miranon-media-ad-git-"-prefix) i stället för att
låsa en enda ogiltig sträng.

Staging-secret satt: CORS_ALLOWED_ORIGIN_PATTERNS =
"https://miranon-media-admin-*.vercel.app,https://miranon-media-ad-git-*.vercel.app"
(npx supabase@2.115.0 secrets set, projekt pqtshyierkdgwdnxuirz, 2026-09-06
11:45 UTC). CORS_ALLOWED_ORIGINS overifierat oförändrad — samma sha256-digest
och updated_at (2026-08-05) före och efter denna skiva.

Deploy: samtliga 57 allowlistade funktioner (scripts/deploy-prod-functions.sh
--project-ref pqtshyierkdgwdnxuirz) + 4/5 test-*-funktioner deployade
skarpt till staging. test-static-files FALLERADE (413 "request entity too
large") — pre-existing, orört av denna skiva: funktionen bundlar
supabase/functions/_shared/mallar/ (5,3 MB, inkl. en 910 kB font-modul) och
låg redan på den gränsen (senast lyckade deploy 2026-08-23, version 10,
oförändrad av detta försök). Bokfört som avvikelse, ej löst här.

Rättelse: föregående styckes 'overifierat oförändrad' ska läsas 'verifierat oförändrad' (skrivfel; sha256-digest + updated_at jämfördes faktiskt före/efter, se ovan).

GRANSKNINGSFYND + Marcus-beslut 2026-09-06 (efter denna skivas första leverans, PR #2388):

Granskningen av #2388 fann att mönstret `https://miranon-media-admin-*.vercel.app`
kan träffas av VEM SOM HELST som skapar ett eget Vercel-projekt med samma
prefix — projektnamn på `*.vercel.app` är INTE globalt reserverade åt oss.
En främmande sida kunde alltså i teorin få sin OPTIONS-preflight godkänd av
staging-EF:erna. Mildrande faktorer (bekräftade i denna skivas eget
research-underlag, oförändrade av fyndet): mönstret sattes ENBART i staging
(prod orörd), anropen bär ingen kaka (`credentials` sätts aldrig av
supabase-client.ts) så en främmande sida kan inte läsa ut vår
`Authorization`-token ur en annan origins lagring, och sessioner ligger i
webbläsarens `localStorage` — en spoofad origin kan alltså få CORS-godkännande
men saknar fortfarande en giltig token att skicka. Ändå: bredden är en verklig
svaghet mönstret inte borde ha, och Marcus GO:ns "kör staging-vägen" avsåg
inte att acceptera ett spoofbart prefix-mönster som permanent lösning.

Marcus beslut (verbatim): "Vänta tills preview domänen finns."

Åtgärdat i denna skiva, samma dag:
- `CORS_ALLOWED_ORIGIN_PATTERNS` TÖMD i staging (pqtshyierkdgwdnxuirz) via
  `npx supabase@2.115.0 secrets unset CORS_ALLOWED_ORIGIN_PATTERNS
  --project-ref pqtshyierkdgwdnxuirz` — bekräftat borta ur `secrets list`.
- Koden (cors.ts, cors-origin-policy.ts) ligger KVAR deployad i staging —
  utan mönster-secreten faller `isAllowedOrigin` tillbaka till exakt samma
  beteende som INNAN TASK-415.1 (bara CORS_ALLOWED_ORIGINS-exaktlistan).
- Skarpbevis (OPTIONS-preflight mot get-events, staging, verbatim):

  Preview-origin som TIDIGARE godkändes av mönstret, nu utan secreten:
    $ curl -sS -D - -o /dev/null -X OPTIONS \
        -H "Origin: https://miranon-media-admin-462he0s8t.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        https://pqtshyierkdgwdnxuirz.supabase.co/functions/v1/get-events
    HTTP/2 403
    (ingen access-control-allow-origin, ingen Vary: Origin — vary: Accept-Encoding enbart)

  Exaktlistans origin, oförändrat:
    $ curl -sS -D - -o /dev/null -X OPTIONS \
        -H "Origin: http://localhost:5173" \
        -H "Access-Control-Request-Method: GET" \
        https://pqtshyierkdgwdnxuirz.supabase.co/functions/v1/get-events
    HTTP/2 200
    access-control-allow-origin: http://localhost:5173
    vary: Accept-Encoding, Origin
    access-control-allow-headers: authorization, x-client-info, apikey, content-type
    access-control-allow-methods: GET, POST, PATCH, OPTIONS

Väg framåt (blockerar armering av #2388 tills klar): mönstret ska bli
`https://*.preview.miranon.dev` (eller den domän Marcus faktiskt väljer) —
en domän VI ÄGER, inte ett spoofbart `*.vercel.app`-prefix. Kräver Vercel
Preview Deployment Suffix satt mot en egen underdomän under miranon.dev
(wildcard-DNS) INNAN mönster-secreten sätts på nytt i staging — se
TASK-415.2:s nya första steg. Denna PR (#2388) förblir DRAFT och armeras
INTE förrän det steget är klart och mönstret pekar dit.
<!-- SECTION:NOTES:END -->
