# T46 — Go-live-karta: konsoliderad avstånd-till-live per leverans-väg

- Tillstånd: paused
- Uppstod: Session 41
- Karta materialiserad: Session 43 (vid 6g prod-deploy-landningen)

Två-vägs-distinktionen (Skool-export = access-grant, ej consent-gatead / mail =
consent-gatead) och vad som gatear varje väg till prod var durabelt dokumenterat men
SPRITT över ≥5 ytor (segment-arkitektur.md, ADR-062, ADR-067, T44, BUILD-LOG/session-
carries). Denna karta är den konsoliderade operativa vyn: per leverans-väg — vad är
byggt, vad gatear prod, vem äger grinden, hur nära är användaren.

## Go-live-karta (per leverans-väg)

| Väg | Byggt + auditerat | Prod-deployad | Återstående gate till live | Ägare av gaten |
|---|---|---|---|---|
| **Skool-export (6g)** — access-grant, ej consent-gatead | ✅ L1–L4 (S35–S37, arch-audit ren) | ✅ **LEVERERAD S43** — compute-segment/save-segment/get-segments ACTIVE v1 på prod (`lvjsfnphlauldxqlncpl`), auth-grind-bevisad (401/405) | full autentiserad prod-smoke (save-segment happy-path) = **T40**; prod-frontend serverar segment-ytan = overifierat | Code (T40, prod-test-user-förkrav) |
| **Mail (6h)** — consent-gatead | ✅ L0–L3 (S39–S41, arch-audit ren, avvikelse-fix) + T50 UI-härdning (S45, arch-audit ren) | ⚠️ **DEPLOYAD MEN SÖVD (S44)** — send-email i allowlist (11) + prod-deployad, prod-`Idempotensnyckel`-kolumn satt, MEN `ENVIRONMENT` ej satt → fail-closed (`!== 'production'` → 422), noll skickat | **Grind F** (`ENVIRONMENT=production`, sista flippen) + **T51** Marcus-självtest (Reply-To live, första skarpa utskicket) → spårat som **T55** | Marcus/Code i prod-panelen (Chat rör ALDRIG secret) |
| **Frontend/appen (T95)** — publik PWA + inbjudan | Spec klar S95: PRD `TASK-126`/`TASK-127` + 15 skivor; PWA-grund ADR-047 | ❌ **INGEN FRONTEND-DEPLOY FINNS** (bekräftat S95) | **Grind 0-paketet** (nedan) — blockerar T95:s QA-kort och hela inbjudningsvägen | Marcus i paneler + Code på repo-sidan (se paketet) |

## Grind 0-paketet (T95, S95-beslutat — operativ lista, förfinas av skiva TASK-127.4)

Ordningen är den naturliga exekveringsordningen; inget momentet kräver att
skivbyggena väntar (de kör hermetiskt), men QA-korten `TASK-126.5`/`TASK-127.10`
och rundturen `TASK-127.9` grindas av paketet.

1. **Vercel Pro-projekt** kopplas till repot, Vite-preset + SPA-rewrites,
   `--mode production` — Code förbereder config, Marcus skapar konto/projekt
   (Pro-plan Marcus-kvitterad S95; underlag R1). Hosting-ADR mintas på
   R1-underlaget (skiva `TASK-127.1`-klassens ADR-form, hosting-ADR:n egen).
2. **DNS `admin.miranon.dev`** (CNAME → Vercel) — Marcus i GoDaddy.
3. **CORS-utökning:** `CORS_ALLOWED_ORIGINS` får nya origin i staging + prod —
   Code-at-prod under Marcus-auktorisation (annars deployad men datalös app).
4. **Sändande subdomän `send.miranon.dev`** verifieras i Resend + SPF/DKIM —
   Marcus i Resend + GoDaddy (T44 M3-vägen; `RESEND_FROM` byts i samma moment).
5. **DMARC `p=reject` + rua** på `miranon.dev` — Marcus i GoDaddy (S95 beslut 4;
   inget legitimt root-utskick existerar — bytet är riskfritt i dag).
6. **Supabase custom SMTP** mot Resend — Marcus i Supabase-dashboarden
   (default-SMTP:n kan bevisligen inte leverera till Roger/Lotta).
7. **Email OTP Expiration → 24 h** + redirect-URL:er för accept/reset —
   Marcus i Supabase-dashboarden (plattformstaket, S95 beslut 7).

### 6g-grenens leverans-bevis (S43)

Risk-trappa STEG 0–4': forensisk pre-pass (deploy-set = 3, inget prod-schema-gap) →
allowlist-deklaration 7→10 (`dd97807`, fail-closed-test 4/4) → override-smal prod-deploy
(blast-radius exakt 3, de 5 stale T39-EF:er orörda) → deny-grind grön (401/405, inget 200).
Commit-trail: `fbca88f` (doc-födelse) → `dd97807` (allowlist) → BUILD-LOG Session 43.
Deployen committade inget (out-of-CI prod-handling).

## Switch-post vid skarp Lotta-drift: /work-batch B-läget (ADR-073 — INBYGGD grind, kan inte missas vid go-live)

När appen går i skarp Lotta-drift SKA batch-drift byta till B-formen
(pre-beslutad T76-samsyn, färdigspecad ADR-073 beslut 7): UI-korts PR
öppnas som DRAFT och förblir öppen tills design-review; granskningen
sker mot branch-preview (staging-mode-bygge + CORS-godkänd port per
TASK-10-fällorna); merge PÅ Marcus kvittens — inget ogranskat UI når
main. Aktiveras som explicit B-flagga i /work-batch-ordern (skill
1.14.0). Icke-UI-kort behåller v1-flödet. Denna post är go-live-kartans
PROCESS-grind: bocka den i samma moment som Grind F/motsvarande
miljö-flippar.

## UI-vägens prod-moment (registrerade vid TASK-1-skivningen, S52)

- **Display-namn i prod-kontots metadata** — skiva TASK-1.1 (namnkällan)
  sätter display-namn i STAGING-kontonas user_metadata; prod-kontots
  (Lottas) metadata sätts först vid frontend-go-live (ingen frontend-deploy
  finns ännu; värdet saknar konsument dessförinnan). Utan namn hälsar Hem
  neutralt — aldrig e-post (fail-safe, Gunilla-principen). Ägare:
  Marcus/Code i prod-panelen. Registrerad 2026-07-05 (S52 /to-issues,
  skiv-godkännandets beslut C: description-rad på kortet + denna durabla
  bärare — ett stängt kort är en död yta).

## Closeout-förkrav (gatear FULLT Fas 6-avslut)

- **T39** — prod-funktions-drift-sync: de 5 stale prod-EF:erna ligger efter staging-HEAD;
  skärpt S43 (allowlist nu 10 → blind kanonisk deploy osäker, se [README T39-not](README.md)).
- **T40** — autentiserad prod-smoke: nu både create-event (6f) OCH save-segment (6g);
  precondition = prod-test-user via rätt kanal.

Klass: dok-konsolidering / operativ-vy. Blockerar ej; värdefullt (ADR-053: registrera,
förkasta aldrig tyst). Trådtillstånd `paused` — kartan är ritad, men dess spårade subjekt
(6h-grenen + closeout T39/T40) utvecklas alltjämt; stängs när go-live nås på båda vägarna.
Relaterat: T44, T39, T40, ADR-062, ADR-067, segment-arkitektur.md.
