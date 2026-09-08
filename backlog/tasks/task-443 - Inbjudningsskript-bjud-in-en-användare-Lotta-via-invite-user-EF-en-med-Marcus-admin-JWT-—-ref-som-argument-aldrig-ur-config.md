---
id: TASK-443
title: >-
  Inbjudningsskript: bjud in en användare (Lotta) via invite-user-EF:en med
  Marcus admin-JWT — ref som argument, aldrig ur config
status: To Do
assignee: []
created_date: '2026-09-08 18:18'
updated_date: '2026-09-08 18:20'
labels:
  - ready-for-agent
dependencies: []
ordinal: 770000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bakgrund: Marcus fråga 2026-09-08 (S124 Del 7, källa: tasks/sessions/2026-09-08-session-124.md): "Lotta har ju redan ett konto? lösenord? hur bjuder jag in henne?" Repot bär ingen UI och inget skript för inbjudan. Agenter är mekaniskt låsta från prod: Airtable-låset (`scripts/deny-prod-airtable.sh`) och prod-ref-låset (`scripts/deny-prod-ref.sh`, CLAUDE.md § Prod-EF-deploy). Den skarpa inbjudan av Lotta görs därför av Marcus i hans egen terminal, aldrig av en agent.

FLÖDET (källa: ADR-092 docs/decisions/ADR-092-invite-identitetsmodellen-anvandarinbjudan.md, EF `supabase/functions/invite-user/index.ts` läst i sin helhet 2026-09-08 för detta korts bygge): Marcus anropar EF:en med sin admin-JWT (auth-gate `requireUser` rad ~186, caller-email måste finnas i `ADMIN_EMAILS`-allowlisten rad ~198). Mottagaren får mail från `konto@send.miranon.dev`, sätter lösenordet själv på `/valkommen` (`src/routes/valkommen.tsx`, `INVITE_REDIRECT_URL` → `/valkommen` — registret `docs/reference/atkomst-och-nycklar.md` rad ~122: satt i båda miljöerna 2026-09-02, digest matchar `https://admin.miranon.dev/valkommen`), 24 h-länk, ett omskick är samma anrop (GoTrue slår upp e-posten före den öppnar sin transaktion, ingen dubblett skapas — fil-headern rad ~24-38). Är personen redan bekräftad i prod-Auth → GoTrue svarar 422 `email_exists` innan mailkod körs → hänvisa till `/glomt-losenord`, aldrig en andra inbjudan.

EF:ENS FAKTISKA REQUEST-KONTRAKT (läst rad 209-232, inte antaget): POST med `Authorization: Bearer <admin-JWT>`, JSON-body `{ email: string, role: 'admin', name: string }` — TRE fält, inte två: `name` är OBLIGATORISKT (mottagarens namn, klient-indata för personalisering, `user_metadata.display_name`; saknas/tomt → 400 "name is required"). `role` valideras mot `VALID_ROLES = ['admin']` (rad 89) — enda giltiga värde idag. Inbjudarens identitet härleds SERVER-SIDE ur den anropande adminens JWT (`readDisplayNameFromJwt`, rad ~142), skickas ALDRIG i body. Svar vid framgång: `{ invited: { id, email, role, name } }`. Felvägar: 405 fel metod, 401 ej inloggad, 403 caller ej i ADMIN_EMAILS, 400 valideringsfel (email/role/name), 4xx/5xx från GoTrue vid `inviteUserByEmail` (t.ex. 422 already registered) — `error.status` vidarebefordras rakt av (rad ~275).

SKRIPTETS FORM: `scripts/bjud-in-anvandare.mjs` (eller `.sh`) tar PROJEKT-REF/EF-URL som ARGUMENT, aldrig ur config — samma mönster och skäl som `scripts/fas4-prod-deploy.sh` (`deny-prod-ref.sh` matchar refens närvaro i kommandosträngen; ett skript som läste refen ur en config-fil hade gjort låset verkningslöst, CLAUDE.md § Prod-EF-deploy). Loggar in Marcus med e-post + lösenord via projektets anon-nyckel (`supabase.auth.signInWithPassword` eller motsvarande REST-anrop) för att få hans JWT — lösenordet läses från stdin UTAN EKO (t.ex. Node `readline` med `terminal: false` + rå tty-mute, eller motsvarande), ALDRIG som kommandoradsargument och ALDRIG loggat till stdout/stderr. Anropar EF:en med mottagarens e-post, roll och namn; skriver ut utfallet i klartext (skickad ny inbjudan / omskickad / redan bekräftad → hänvisning till `/glomt-losenord` / nekad → caller saknas i ADMIN_EMAILS). `--kontrollera`-läge: verifierar bara att caller är admin (loggar in, kontrollerar 200 vs 403 på ett harmlöst anrop eller motsvarande) utan att skicka någon inbjudan.

STAGING FÖRST: bevisa mot staging (`apphjj8Q7lkXCMsL4`-basens Supabase-projekt — den ref agenter FÅR bära, till skillnad från prod) med en testadress innan skriptet anses klart. Prod-körningen (den skarpa inbjudan av Lotta) är Marcus egen, i sin egen terminal.

Den skarpa inbjudan av Lotta går via QA-vandringen `TASK-127.10` (To Do, förkrav — S123 satte den) — steg 1 där ("Marcus utlöser skarp inbjudan till egen testadress") är skriptets FÖRSTA användning. Detta kort bygger skriptet; det utlöser inte den skarpa inbjudan.

KÄLLOR: `supabase/functions/invite-user/index.ts` (hela filen, 345 rader), `docs/decisions/ADR-092-invite-identitetsmodellen-anvandarinbjudan.md`, `docs/reference/atkomst-och-nycklar.md` rad ~110-135 (INVITE_REDIRECT_URL-raden), `scripts/fas4-prod-deploy.sh` + `scripts/deny-prod-ref.sh` + `.prod-ref-policy.conf` (argument-mönstret), `src/routes/valkommen.tsx`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skriptet kör mot staging med projekt-ref/EF-URL som ARGUMENT (aldrig ur config) och skickar en inbjudan (email+role+name) till en testadress via invite-user-EF:en; utfallet (ny inbjudan / omskick) skrivs ut i klartext
- [ ] #2 En redan bekräftad mottagare ger ett klart besked i klartext och hänvisar till /glomt-losenord; ingen andra inbjudan skickas (GoTrue 422 email_exists hanteras explicit, inte som ett generiskt fel)
- [ ] #3 Projekt-refen förekommer aldrig i någon config-fil skriptet läser (endast som argument); Marcus lösenord läses från stdin utan eko och syns aldrig i argv, stdout, stderr eller loggar; testsvit för argument-, stdin- och utfallshantering (mockad EF/HTTP), CI-wirad som gatekeeper-svit
- [ ] #4 Runbook-avsnitt (docs/reference/atkomst-och-nycklar.md eller staging-verifiering-runbook.md) beskriver hur Marcus kör skriptet mot prod i sin egen terminal, med hänvisning till TASK-127.10 som skriptets första skarpa användning
- [ ] #5 DoD-kommandona (typecheck, biome, build, check-langa-streck om skriptet bär användar-synlig text) gröna med faktiska exitkoder
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
