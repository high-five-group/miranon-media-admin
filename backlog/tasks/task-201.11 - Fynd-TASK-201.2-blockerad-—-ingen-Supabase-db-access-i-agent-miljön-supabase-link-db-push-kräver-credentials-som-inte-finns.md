---
id: TASK-201.11
title: >-
  Fynd: TASK-201.2 blockerad — ingen Supabase db-access i agent-miljön (supabase
  link/db push kräver credentials som inte finns)
status: To Do
assignee: []
created_date: '2026-08-11 22:11'
updated_date: '2026-08-11 22:13'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-201
priority: high
ordinal: 376000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
KORTETS EGEN RISK, BEKRÄFTAD: TASK-201.2:s notes flaggade db-access för migrations-applicering som OMÄTT. Premiss-pass (TASK-201.2-uppdraget) mätte den och den är NEGATIV — agent-miljön saknar helt Supabase CLI-autentisering.

EXAKT MÄTNING (2026-08-12, denna agent, worktree agent-a5bf46ce80df47c4c):

1. `env | grep -i SUPABASE` — noll träffar. Ingen SUPABASE_ACCESS_TOKEN.
2. `~/.supabase/` innehåller endast `telemetry.json` + `traces/` — inget `access-token`.
3. Ingen av `.env.local`/`.env.staging`/`.env.test`/`.env.seed` bär SERVICE_ROLE-nyckel, DATABASE_URL eller DB-lösenord (grep verifierat, noll träffar utanför en forskningsdok-fil).
4. `.github/workflows/*.yml` refererar ALDRIG SUPABASE_ACCESS_TOKEN eller `supabase link`/`supabase functions deploy`/`db push` — EF-deploy och migrations-applicering sker alltså helt utanför CI, endast via lokal/interaktiv CLI-auth som denna agent inte har.
5. `npx supabase db push --linked` (utan link) — snabbt, rent fel:
   `{"_tag":"Error","error":{"code":"LegacyProjectNotLinkedError","message":"Cannot find project ref. Have you run supabase link?"}}`
6. `npx supabase link --project-ref pqtshyierkdgwdnxuirz` (staging-ref, källa: `scripts/provision-attachments-bucket.mjs` header-kommentar) — HÄNGER OÄNDLIGT utan någon utskrift (två separata körningar, 15–20 s vardera, tvingat dödade; nätverket är INTE boven — `curl https://api.supabase.com` svarade 404 direkt). Mönstret matchar CLI:ts interaktiva browser-login-flöde, som aldrig kan slutföras headless.
7. Kontrollprov: `SUPABASE_ACCESS_TOKEN=sbp_invalid_token_for_access_probe npx supabase projects list` — misslyckas SNABBT och rent (`LegacyInvalidAccessTokenError`), vilket bekräftar att CLI:t svarar direkt när ett (om än ogiltigt) token finns — hänget i (6) beror specifikt på TOTAL FRÅNVARO av token, inte på nätverk eller CLI-bugg.

SLUTSATS: agentens db-access för migrations-applicering är bevisat OMÄTT → NEGATIV, inte bara omätt. TASK-201.2 kan inte fullfölja AC #1 (applicering + query-verifiering) eller AC #2 (RLS-bevis mot den levande tabellen) i denna agent-miljö.

INGEN KRINGGÅENDE VÄG föreslås (kortets egen instruktion): ingen SQL via anon-nyckel, ingen dashboard-instruktion utförd av agenten.

PÅVERKAN: TASK-201.3 (och sannolikt hela resten av 201.4–201.10-kedjan) har `dependencies: [TASK-201.2]` och är därmed blockerad tills migrationen är applicerad mot staging.

FÖRVÄNTAT ÅTGÄRD: Marcus-moment — antingen (a) applicera migrationen manuellt/via en session med riktig `supabase login`-auth och lämna TASK-201.2 för agent-fortsättning av AC #2+#3 därefter, eller (b) förse en framtida agent-session med SUPABASE_ACCESS_TOKEN (och ev. SERVICE_ROLE-nyckel för RLS-write-beviset) via miljö/secret, så hela skivan kan köras end-to-end.
<!-- SECTION:DESCRIPTION:END -->
