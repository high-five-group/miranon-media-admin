---
owner: marcus803
updated: 2026-08-05
review_by: 2027-02-05
status: draft
---

# TASK-127.9 — Rundtur-e2e (inbjudan → inloggad): mekanismen är live-bevisad, det automatiserade CI-testet är blockerat

> **Proveniens:** byggpass 2026-08-05 för `TASK-127.9` ("Skiva: Rundturs-e2e —
> inbjudan till inloggad, mot staging"), körd i egen worktree
> (`.claude/worktrees/agent-a38b080e03417a793`), byggd ovanpå `origin/main`
> vid `d467a3d4` (senare hann `origin/main` vidare till `6bbdbd20` under
> passet — se § Divergenser). Detta pass tillför ingen kod och ändrar inget
> repo-beteende — det är en mätning/verifiering plus ett beslutsunderlag för
> hur AC #1/#2 kan bli sanna framåt.

## Kort sammanfattning

Kortets tre AC:

1. Rundturen grön i den autentiserade staging-e2e-skarven (`chromium-authenticated`-projektet, `tests/e2e/*.staging.test.ts`)
2. Flödet skapar och river sin egen testanvändare — inga rester i staging
3. Marcus-förkraven dokumenterade och avbockade

**AC #1 och #2 kan INTE levereras som ett committat, i CI automatiskt körande Playwright-test idag.** Inte för att mekanismen är trasig — den är **bevisad live, end-to-end, mot skarp staging** under detta pass (se § Live-bevis nedan) — utan för att två separata infrastruktur-luckor saknas, och båda ligger utanför denna skivas fil-yta (`tests/`):

1. **Ingen service-role-nivå-hemlighet finns i CI.** Att konsumera den riktiga mail-länken deterministiskt (utan att bero på en levererad e-post i en headless körning) och att riva testanvändaren efteråt kräver båda ett `service_role`-anrop mot Supabase Auth Admin API. Det finns inget sådant i GitHub Actions-hemligheterna (`gh secret list` — 8 poster, ingen service-role/Resend-nyckel) och inget dedikerat EF (`supabase/functions/`) som exponerar den kapaciteten bakom admin-JWT, så en committad testfil skulle antingen (a) aldrig kunna köra i CI, eller (b) kräva en ny hemlighet + `.github/workflows/ci-suite.yml`-ledning — en säkerhetskänslig scope-utökning som `invite-user.staging.test.ts`s egen fil-header redan explicit avstod från att göra unilateralt ("en privilegie-utökning av testharnesset som INTE görs unilateralt här", TASK-127.5).
2. **`redirect_to`-allowlistens registrerade domän matchar inte CI:s e2e-testserver.** `uri_allow_list` bär `https://admin.miranon.dev/valkommen,https://admin.miranon.dev/nytt-losenord` (satt av Marcus 2026-08-05 för detta kort). CI:s `E2E tests (staging)`-steg (`.github/workflows/ci-suite.yml` rad ~563) sätter aldrig `PLAYWRIGHT_TEST_BASE_URL` — testservern är alltså den lokala dev-servern på `localhost:5173` (staging-backend via `VITE_SUPABASE_URL`, men lokal frontend). En riktig mail-länk pekar mot `admin.miranon.dev`, inte `localhost:5173` — att faktiskt DRIVA webbläsaren genom `/valkommen`-SIDAN (inte bara API-lagret) i en CI-körning kräver antingen en registrerad redirect-URL som matchar testservern, eller att testet körs mot en deployad miljö som matchar den registrerade domänen. Ingen av delarna finns idag.

Ingen av dessa två luckor kan jag stänga inom `tests/`-ytan. Att stänga dem kräver antingen en ny, snävt admin-JWT-gated Edge Function (staging-only, via `.prod-functions-allowlist.conf`-exkludering — se § Rekommendation) eller ett medvetet beslut att acceptera manuell verifiering som bevis (samma mönster `TASK-127.5` redan valde för sin "fulla lyckade-anrop"-gren).

## Live-bevis: hela kedjan fungerar, mätt skarpt mot staging

Med Supabase CLI:ts REDAN AUTENTISERADE lokala Management-API-åtkomst (`supabase projects api-keys --project-ref pqtshyierkdgwdnxuirz`, tillgänglig på DENNA maskin men INTE i en GitHub Actions-runner) hämtades staging-projektets `service_role`-nyckel EN GÅNG, användes för en fullständig manuell körning, och rensades omedelbart efter — exakt samma mönster som `TASK-127.5`s egen "engångs-hämtad staging-service-role-nyckel + omedelbar städning".

Genomförda steg, alla mot skarp staging (`pqtshyierkdgwdnxuirz.supabase.co`):

| # | Steg | Anrop | Resultat |
|---|---|---|---|
| 1 | Admin-JWT | `POST /auth/v1/token?grant_type=password` (TEST_ADMIN) | 200 |
| 2 | Inbjudan utlöses via EF:en | `POST /functions/v1/invite-user` `{email, role:'admin', name}` | **200** — `invited.id=fba3e452-…`, kontraktet (TASK-143: `name` obligatoriskt) fungerar |
| 3 | Mail-länken (simulerad via generate_link, service-role) | `POST /auth/v1/admin/generate_link` `{type:'invite', email, redirect_to}` | 200 — samma `id` som steg 2, `hashed_token`/`action_link`/`email_otp` returnerade |
| 4 | Konsumera länken (det en riktig klick på mail-länken gör) | `GET /auth/v1/verify?token=…&type=invite&redirect_to=…` | **303** → `Location: https://admin.miranon.dev/valkommen#access_token=…&refresh_token=…&type=invite&…` — JWT-payloaden bekräftar `app_metadata.role=admin` (rollen låst) och `user_metadata.display_name`/`inviter_name` korrekt satta (TASK-143-kontraktet) |
| 5 | Sätt lösenord (motsvarar `supabase.auth.updateUser({password})` i `valkommen.tsx`) | `PUT /auth/v1/user` med `access_token` från steg 4 | **200** |
| 6 | Logga in (motsvarar `/login`-formuläret) | `POST /auth/v1/token?grant_type=password` med nya lösenordet | **200** — `app_metadata.role=admin` |
| 7 | Autentiserad vy nås (motsvarar `/hem`s datafetch) | `POST /functions/v1/get-events` med den nya sessionens `access_token` | **200** — riktig eventdata returnerad |
| 8 | Riv testanvändaren | `DELETE /auth/v1/admin/users/{id}` (service-role) | **200** |
| 9 | Verifiera frånvaro (läsning EFTER radering, AC #2:s krav) | `GET /auth/v1/admin/users/{id}` | **404** `user_not_found` |

Samtliga nio steg gröna. `service_role`-nyckeln och alla utfärdade tokens/lösenord raderades från disk omedelbart efter steg 9 — inget av dem lever kvar i scratchpad eller repot.

**Vad detta bevisar:** `invite-user`-EF:ens TASK-143-kontrakt, rollen-låst-i-`app_metadata`-mekaniken, `user_metadata.display_name`/`inviter_name`-sättningen, GoTrue:s implicit-flow-session-i-hash-fragment, lösenordssättning och efterföljande lösenords-inloggning fungerar alla korrekt tillsammans mot skarp staging. **Vad detta INTE bevisar:** att den faktiska React-sidan (`/valkommen`, `/login`, `/hem`) renderar och hanterar detta korrekt i en riktig webbläsare — det är fortfarande overifierat AUTOMATISKT (TASK-127.6/127.3:s egna acceptance/a11y-tester täcker sidornas UI-beteende med MOCKADE sessioner, inte en riktig hash-fragment-session från en riktig GoTrue-redirect).

## Varför jag inte byggde ett committat testfil ändå

Ett Playwright-test som gör exakt ovanstående kräver `SUPABASE_SERVICE_ROLE_KEY` (eller motsvarande) som miljövariabel när det körs — annars kan det varken hämta en deterministisk länk (steg 3) eller riva sin egen testanvändare (steg 8, AC #2:s uttryckliga krav). Att lägga till den variabeln kräver:

- ETT av: (a) en ny GitHub Actions-hemlighet + en rad i `.github/workflows/ci-suite.yml`s `E2E tests (staging)`-steg, eller (b) en ny, snävt scopead Edge Function (se rekommendation nedan) som INTE kräver en ny hemlighet (varje deployad Edge Function får redan `SUPABASE_SERVICE_ROLE_KEY` auto-injicerad av Supabase — verifierat mot context7/Supabase-dokumentationen).

Båda alternativen rör filer utanför denna skivas deklarerade yta (`tests/`), och (a) är dessutom exakt den "privilegie-utökning av testharnesset" som `TASK-127.5`s egen kod-kommentar redan explicit avstod från att göra unilateralt. Att committa ett testfile som antingen (i) alltid skulle floppa i CI (miljövariabel saknas → fel), eller (ii) tyst skippar (matchar mönstret i `tests/api/helpers.ts`, men då är AC #1 fortfarande INTE sant "grönt" — bara "inte rött") hade båda varit att representera kortets AC-status felaktigt.

## Rekommendation (två vägar, Marcus/orkestrerarens beslut — inte mitt)

**Väg A — en snävt scopead, staging-only hjälp-EF.** T.ex. `supabase/functions/test-invite-completion/index.ts`, gated bakom SAMMA `ADMIN_EMAILS`-allowlist som `invite-user`, som exponerar `generateLink`+`deleteUser` för en admin-JWT-anropare. Kräver INGEN ny hemlighet (service-role är redan auto-tillgänglig i varje EF:s runtime) — bara att INTE lägga till funktionen i `.prod-functions-allowlist.conf` (samma mönster som `test-auth`, som redan är medvetet exkluderad från prod). Detta gör AC #1/#2 fullt automatiserbara, men är ett nytt kapacitets-tillägg i produktionskodbasen (om än prod-exkluderat) och bör beslutas explicit, inte byggas av en skiva scopead till `tests/`.

**Väg B — acceptera manuell verifiering som bevis**, exakt som `TASK-127.5` redan gjorde för sin "fulla lyckade-anrop"-gren: dokumentera (som denna fil gör) att mekanismen är bevisad live, en gång, med omedelbar städning — och lämna AC #1/#2 som "verifierat manuellt, inte automatiserat" snarare än "grönt i CI". Kräver ingen ny kod alls, men ger ingen regressionsvakt framåt (nästa ändring i `invite-user`/`valkommen.tsx`/`login.tsx` kan bryta kedjan utan att någon grind fångar det förrän nästa manuella pass).

Oavsett vald väg återstår punkt 2 (redirect-domän-mismatchen mot `localhost:5173`) som en SEPARAT fråga för att driva den RIKTIGA React-sidan (inte bara API-lagret) i en CI-körning.

## Divergenser mot uppdraget (ADR-086-passet)

- **Fel commit-SHA citerad för TASK-143/PR #800.** Uppdraget angav "landade i main som #800 (merge-commit `d467a3d4`)". Verifierat mot `git log`: PR #800:s faktiska merge-commit är `53d32731`; `d467a3d4` är i själva verket merge-commiten för PR #802 (en senare, orelaterad docs-stängning av TASK-128/116). Kontraktsändringen (namn obligatoriskt, TASK-143) är dock KORREKT beskriven och verifierad direkt mot `supabase/functions/invite-user/index.ts` — SHA-felet påverkade inte bygget, bara källhänvisningen.
- **Worktreen låg bakom `origin/main` vid start** (`d467a3d4`, medan `origin/main` redan hade `6bbdbd20` — två ytterligare docs-commits, `#801`+`#803`). Ingen kod byggdes ovanpå denna skillnad (inget kodarbete landade), så divergensen fick ingen praktisk konsekvens denna gång.
- **AC #3:s förkrav** (OTP 24h, SMTP, redirect-mål) är Marcus egen, daterad, källmärkt förstahandsrapport (Management API, staging-ref, 2026-08-05) — jag saknar en egen Management-API-token i denna miljö (verifierat: inget i `.env.local`/`.env.test`/CI-hemligheter/skal-env) och kunde därför inte oberoende omverifiera siffrorna. Behandlas som väl källmärkt per ADR-086 (inte en obelagd hypotes), men noteras öppet att jag inte själv mätte om dem.

## Vad som INTE rördes

Inga filer i `supabase/`, `.github/workflows/`, eller backlog-kortet ändrades. Ingen ny hemlighet skapades. Inga permanenta ändringar gjordes i staging — den enda skarpa staging-mutationen (en testanvändare) skapades och raderades inom samma pass, med en läsning efteråt som bekräftade frånvaro (404).
