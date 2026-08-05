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

## Grind 0-paketet (T95, S95-beslutat — operativ lista, förfinad av TASK-127.4)

Ordningen är den naturliga exekveringsordningen; inget momentet kräver att
skivbyggena väntar (de kör hermetiskt), men QA-korten `TASK-126.5`/`TASK-127.10`
och rundturen `TASK-127.9` grindas av paketet.

> **STATUS 2026-08-05 (S96):** punkt **1, 4, 6 och 7 är UTFÖRDA**, punkt **5
> halvvägs**. Kvar: **2** (väntar produktionsdeploy-kvittens), **3**, och
> prod-halvan av **6+7**. Per-punkt-detaljerna står i respektive punkt nedan.
> Hela paketet skrevs som en förhandsplan — flera av dess antaganden föll vid
> skarp exekvering, och rättelserna står inline i stället för att planen
> lämnas kvar som den var.

1. ✅ **UTFÖRD 2026-08-05.** Vercel Pro-projekt kopplat, Vite-preset +
   SPA-rewrites, säkerhetsheaders. `vercel.json` ligger i repo-roten
   (`ADR-091` beslut 1+3, form ur R1 §1.3+§2.2); hosting-ADR:n **är** `ADR-091`,
   mintad 2026-08-03. Preview verifierad skarpt: sju headers mätta via
   `vercel curl` (rå `curl` ger 302 från Deployment Protection) och
   SPA-rewriten prövad på tre djupa routes → HTTP 200 text/html.
   **Två fel som planen inte förutsåg, båda rättade:** `postinstall` körde
   `git config core.hooksPath` och dödade bygget med exit 128 i Vercels
   git-lösa byggmiljö (nu fail-safe); `vercel link` la ett brett `.env*` i
   `.gitignore` EFTER repots `!`-undantag och slog därmed ut samtliga sex
   undantagna filer (rivet, bevisat i isolerat testrepo).
   **ÖPPET:** GitHub-integrationen kopplades INTE — `vercel link` svarade
   *"Failed to connect high-five-group/miranon-media-admin to project"*.
   Kräver att Vercels GitHub-app ges åtkomst till organisationen
   (Marcus-moment). Utan den sker ingen auto-deploy vid push.
2. **DNS `admin.miranon.dev`** (CNAME → Vercel) — kan nu utföras av Code via
   `gddy` (PAT-autentiserad, prod), inte enbart av Marcus i webbgränssnittet.
   Väntar på att en PRODUKTIONSdeploy är Marcus-kvitterad, eftersom CNAME:t
   ska peka på den och inte på en preview.
3. **CORS-utökning:** `CORS_ALLOWED_ORIGINS` får nya origin i staging + prod —
   Code-at-prod under Marcus-auktorisation (annars deployad men datalös app).
   Origin är nu känt för preview; produktionens tillkommer med punkt 2.
4. **Sändande subdomän `send.miranon.dev`** verifieras i Resend + SPF/DKIM —
   Marcus i Resend + GoDaddy (T44 M3-vägen; `RESEND_FROM` byts i samma moment).

   ✅ **UTFÖRD 2026-08-05.** `send.miranon.dev` står `verified` i Resend, alla
   tre poster gröna. Domänen lades till 2026-08-03 men stod `failed` i två
   dygn — orsaken var att checklistan nedan gissade postnamnen.

   **⚠️ CHECKLISTAN VAR FEL. Rättad mot uppmätt verklighet 2026-08-05.**
   Den skrevs som uttrycklig MALLFORM (se den strukna texten nedan) och
   antog root-domänens mönster. Resend lägger bounce-hanteringen på en
   `send`-subdomän AV den domän man verifierar — för `send.miranon.dev` blir
   det alltså `send.send`, inte `send`. De `send`-poster som redan låg i
   zonen tillhörde **root-domänen** `miranon.dev` (verified sedan
   2026-06-29), och de nya posterna kolliderade därför i namn.

   | Post | Checklistan sa | **Resend krävde faktiskt** |
   |---|---|---|
   | MX (prio 10) | `send` | **`send.send`** |
   | TXT (SPF) | `send` | **`send.send`** |
   | TXT (DKIM) | `resend._domainkey.send` | `resend._domainkey.send` ✓ |

   Endast DKIM-raden stämde. Lärdomen är generell: **hämta postnamnen ur
   Resends egen `get-domain`-respons i stället för att härleda dem** — den
   listar exakt namn, värde och typ per post, och kostar ett anrop.

   - a. Resend → Domains → Add Domain → `send.miranon.dev` (eller MCP:ns
     `create-domain`). DKIM-värdet genereras först här och går inte att
     förbereda.
   - b. Läs `get-domain <id>` och lägg posterna **verbatim** i GoDaddy-zonen
     för `miranon.dev`. Code kan göra det med `gddy dns add` (PAT, prod) —
     använd `add`, aldrig `set`, så root-domänens poster inte skrivs över.
   - c. Trigga `verify-domain` och verifiera status. DNS-propagering tog i
     praktiken minuter, inte de 72 h Resend anger som tak; propageringen kan
     bevakas med `dig +short <typ> <namn> @8.8.8.8` innan verifieringen
     triggas om.
   - d. `RESEND_FROM` (bulk-mail-vägen, `send-email`-EF:en, T55/Grind F) byts
     från root (`miranon.dev`) till en `send.miranon.dev`-adress i SAMMA
     moment — **skild adress/nyckel från auth-mailets `konto@send.miranon.dev`**
     (PRD:n kräver att auth-mail och bulk-mail aldrig blandas ihop; samma
     princip bör hållas för avsändaradresser).

5. 🟡 **HALVVÄGS 2026-08-05.** `rua` pekar nu på `marcus@h5gruppen.se`;
   policyn står kvar på `p=quarantine` i väntan på rapportdata.

   Nuvarande post: `v=DMARC1; p=quarantine; rua=mailto:marcus@h5gruppen.se`
   (`adkim=r`/`aspf=r` borttagna — de är DMARC-specens förvalda värden och
   ändrade alltså ingenting; posten blev bara renare).

   **⚠️ PREMISSEN NEDAN VAR FALSK — därför sattes inte `p=reject` direkt.**
   Punkten motiverade ursprungligen ett hopp över uppvärmningsfasen med att
   *"inget legitimt root-utskick existerar"*. Mätt i Resend-loggen
   2026-08-05: `invite@miranon.dev` skickade ett skarpt broadcast till
   riktiga mottagare (Roger, Lotta m.fl.) **2026-07-10** — en månad innan
   påståendet skrevs. Root-utskick existerar alltså och är legitimt.

   Zonen bar dessutom redan en DMARC-post: GoDaddys automatgenererade
   `p=quarantine` med `rua` till `dmarc_rua@onsecureserver.net` — alltså gick
   rapporterna till GoDaddy, inte till oss, och ingen hade sett en enda.

   `p=reject` är sannolikt ofarligt för Resend-vägen (root är `verified` med
   DKIM i zonen, och DKIM-alignment räcker för DMARC-pass), men risken ligger
   i allt ANNAT som kan skicka från `miranon.dev`. Rätt ordning är därför den
   uppvärmningsfas punkten avfärdade: **läs rapporterna först, flippa på
   data.** Marcus-beslut 2026-08-05.

6. **Supabase custom SMTP** mot Resend — **delvis versionerat i repot sedan
   TASK-127.4** (`supabase/config.toml` § `[auth.email.smtp]` +
   `supabase/templates/{invite,recovery}.html`), delvis kvar som Marcus/Code-moment:

   | Del | Var | Ägare |
   |---|---|---|
   | host/port/user/avsändaradress/avsändarnamn | `supabase/config.toml` (committat) | Versionerat — TASK-127.4 |
   | Mallarnas subjekt + HTML-innehåll (svensk brandad copy) | `supabase/templates/*.html` (committat) | Versionerat — TASK-127.4 |
   | SMTP-lösenordet (Resend API-nyckel, dedikerad — ej `RESEND_API_KEY`) | Supabase secret, aldrig i repo/chatt | Marcus/Code-at-prod |
   | Faktisk `supabase config push --project-ref <ref>` mot STAGING resp. PROD | Terminal-kommando, kräver `SUPABASE_ACCESS_TOKEN` | Code, Marcus-auktoriserad, EFTER punkt 4 (domänverifiering) |

   ✅ **UTFÖRD MOT STAGING 2026-08-05.** SMTP-blocket aktivt
   (`smtp.resend.com:465`, avsändare `konto@send.miranon.dev`), nyckeln i
   macOS-Keychain och läst direkt in i processen —
   `AUTH_SMTP_PASS=$(security find-generic-password -s RESEND_SMTP_PASS -w)
   supabase config push` — så värdet aldrig passerar en agents kontext.
   **PROD ÅTERSTÅR.**

   **✅ SÄKERHETSNOTEN ÄR NU BELAGD — den var mer berättigad än den trodde.**
   Noten sa att nollställnings-risken var *"INTE bekräftat mot en skarp push
   (ingen sådan är körd)"*. Pushen är körd, och hypotesen höll: `config push`
   ÄR deklarativ. Förste pushen mot staging ändrade **22 av 242 fält**, varav
   **sex var oavsiktliga regressioner**:

   | Fält | Före | Efter |
   |---|---|---|
   | `mailer_autoconfirm` | `False` | `True` — e-postbekräftelse AV |
   | `mfa_totp_enroll_enabled` | `True` | `False` — TOTP-registrering AV |
   | `mfa_totp_verify_enabled` | `True` | `False` — TOTP-verifiering AV |
   | `mailer_otp_length` | `8` | `6` |
   | `smtp_max_frequency` | `60` | `1` |
   | `site_url` | `localhost:3000` | `127.0.0.1:3000` |

   Endast TVÅ av dem hade förutsetts. MFA-avstängningen är den allvarligaste
   och stod inte i notens egen exempellista. Samtliga är nu **låsta** i
   `config.toml` § `[auth]` — läs varningskommentaren där före varje ändring.
   (`custom_oauth_max_providers` 3 → 32767 inträffar också, men vid VARJE
   skrivning oavsett väg — det är Management API som normaliserar fältet, inte
   `config push`.)

   **Rättad exekveringsordning, prövad skarpt:**
   1. **STAGING FÖRST**, aldrig prod först — gäller alltjämt och bevisade sitt
      värde: prod var det LÄNKADE projektet när sessionen började.
   2. **Ta förebilden ur Management API**, inte som skärmdumpar:
      `GET /v1/projects/<ref>/config/auth` ger 242 fält som JSON, vilket gör
      efterkontrollen till en maskinell diff i stället för en ögonjämförelse.
   3. **LÄS CLI:ts DIFF.** Det finns ingen `--dry-run` och ingen `config pull`,
      men `config push` skriver ut en fullständig diff före bekräftelsen. Den
      är den enda förhandsgranskning som existerar.
   4. Kör push, hämta efterbilden, diffa mot förebilden fält för fält.
   5. **För ETT ELLER TVÅ enskilda fält: använd `PATCH` mot samma endpoint i
      stället.** Prod-ändringen 2026-08-05 (`site_url` + `disable_signup`)
      rörde då 3 fält av 242, med samtliga känsliga verifierat oförändrade.

7. ✅ **UTFÖRD MOT STAGING 2026-08-05** (samma push som punkt 6).
   `mailer_otp_exp` verifierad `86400` och `uri_allow_list`
   `https://admin.miranon.dev/valkommen` i Management API-svaret efter push.
   **PROD ÅTERSTÅR** — samma ordning och säkerhetsnot som punkt 6.

   **Utöver planen:** `site_url` sattes i samma veva, i BÅDA miljöerna. Den
   var `http://localhost:3000` — utvecklingsstandarden som aldrig ändrades
   sedan projekten skapades (prod 2026-03-30, staging 2026-06-13). Site URL
   används i ALLA auth-mail som saknar explicit redirect, så varje
   inbjudningslänk hade pekat på **mottagarens egen dator**. Det var en tyst
   blockerare för hela inbjudningsvägen som ingen punkt i detta paket
   fångade. Nu `https://admin.miranon.dev` och låst i `config.toml`.

   **Kvar utanför repot:** återställnings-sidans redirect-URL — `/valkommen`
   (accept, ADR-092) är satt, men reset-lösenord-sidans path väljs av
   `TASK-127.7` och läggs till i arrayen där. Kortet är ute hos bygg-agent
   2026-08-05 med den posten uttryckligen i uppdraget.

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
