---
owner: marcus803
updated: 2026-08-23
review_by: 2027-02-23
status: draft
---

# CI-städjobbets credential-scope: samma som skaparen, eller smalare?

## Vad jag hittade innan jag sökte vidare

`docs/research/` hade inget pass om just credential-scope för CI-jobb (sökt på
`purge|secret|scope|credential|staging|ci-`) — de sju träffarna
(`ci-parity-*`, `merge-queue-mot-staging-mutex-*`, `prodbas-synk-*`,
`riskanpassad-ci-design-*`, `staging-fixturinventering-*`,
`staging-svitens-tidsbudget-*`, `verify-ci-parity-*`) rör CI:ns tids- och
riskbudget, inte dess secret-topologi. Inget av dem överlappar frågan.

Däremot fanns ett **styrande beslut** som nästan avgör frågan direkt:
**ADR-060** (2026-06-22, Accepted) satte principen "conformance förblir
EF-only" och avvisade uttryckligen **Alt B** — att ge test-miljön en
Airtable-token så testet kan städa sig själv — med motiveringen att det
*"bryter EF-only-säkerhets-gränsen (test-env skulle bära en
data-write-credential), emot CI/CD-praxis att inte bredda credential-scope
för test-bekvämlighet."* ADR-060 är två månader gammal men beslutet är ett
arkitekturmönster (EF-gated privilegierad operation i stället för en rå
data-credential), inte en verktygsversion — det åldras inte på veckor. Jag
har läst det i sin helhet och strukturerat resten av passet som "håller
skälet fortfarande, applicerat på TASK-305:s konkreta fall?" snarare än som
en öppen fråga.

**Skillnaden mot TASK-305 är avgörande och gör att svaret INTE bara är
"nej, samma som ADR-060 sa":** ADR-060:s Alt B handlade om att ge
test-**miljön** en **Airtable data-write-token** — en helt ny credential-klass
in i test-jobbet. TASK-305 handlar om att ge purge-**jobbet** (redan skilt
från test-jobbet, redan Airtable-creddat med sin egen least-privilege-PAT)
**samma fyra `TEST_*`-secrets som `test-staging`-jobbet redan bär i samma
workflow-fil** — inte en ny credential-klass, utan återanvändning av en som
redan finns i samma trust-boundary, för en åtgärd som är EF-gated och
fail-closed på precis det sätt ADR-060 föredrog framför en rå token.

Jag har mätt (kört `grep`, läst kod) i stället för att anta var dessa fyra
secrets redan flödar, se § "Mätning" nedan.

## Delfrågorna

### 1. GitHub Actions — secrets-scope, `environment:`, least privilege

**Secrets och fork-PR:er.** `docs.github.com/en/actions/security-guides/using-secrets-in-github-actions`
(hämtat 2026-08-23): *"With the exception of `GITHUB_TOKEN`, secrets are not
passed to the runner when a workflow is triggered from a forked
repository."* — en `pull_request`-triggad körning från en fork får alltså
INGA av våra secrets, oavsett vilket jobb som deklarerar dem i sitt `env:`.

**Least privilege + per-jobb-ökning.** `docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions`
(hämtat 2026-08-23): *"You should therefore make sure that the
`GITHUB_TOKEN` is granted the minimum required permissions."* och,
avgörande för denna fråga: *"The permissions can then be increased, as
required, for individual jobs within the workflow file."* — mönstret är
INTE "alla jobb delar samma minimibehörighet", utan "workflow-toppen sätter
golvet (`permissions: {}`, redan vår praxis, ADR-029 §4), och varje jobb
höjer EXAKT det jobbet behöver." Samma dokument om `pull_request_target`:
*"Workflows that use these triggers must not explicitly check out untrusted
code, including from pull request forks"* och *"The `pull_request_target`
and `workflow_run` workflow triggers, when used with the checkout of an
untrusted pull request, expose the repository to security compromises."*

**`environment:`-skydd.** `docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment`
(hämtat 2026-08-23): *"These secrets are only available to workflow jobs
that use the environment. Additionally, workflow jobs that use this
environment can only access these secrets after any configured rules (for
example, required reviewers) pass."* Mätt i vårt repo: `grep -n "^\s*
environment:" .github/workflows/*.yml` gav **noll träffar** — ingen
workflow i repot använder GitHub Environments i dag, inte ens `test-staging`
som redan bär SEX secrets. Att lägga `environment:` enbart på purge-jobbet
vore alltså en inkonsekvent härdning: den lämnar det tyngre jobbet
(`test-staging`, som redan har admin-JWT-kapacitet via `TEST_ADMIN_*`)
oskyddat medan det lättare jobbet skyddas. Att införa `environment:` för
staging-secret-klassen som helhet är ett större beslut än TASK-305:s scope.

### 2. Teardown/cleanup-mönstret i ephemeral miljöer

**Terraform destroy vs apply.** Sökning (WebSearch, 2026-08-23, flera
sekundärkällor — 8th Light "Minimally Privileged Terraform", OneUptime
"Least Privilege for Terraform Service Accounts") ger samstämmigt:
behörigheten för `plan` skiljer sig från `apply` som skiljer sig från
`destroy` — men mönstret är **separata identiteter SCOPADE TILL VAD
OPERATIONEN KRÄVER**, inte en generell regel om "smalare än skaparen".
`destroy` kräver ofta LIKA MYCKET eller MER (delete-rättighet på det som
apply skapade) — inte mindre. Detta är sekundärkällor, inte HashiCorp
förstaparts-dokumentation direkt citerad — se § Vad jag inte kunde belägga.

**Playwright global teardown.** `playwright.dev/docs/test-global-setup-teardown`
(sekundärt refererat via sökning, ej verbatim-citerat härifrån): setup och
teardown delar SAMMA Node-process och därmed samma `process.env` —
Playwrights EGET mönster är alltså MER delat än vår arkitektur (en separat
CI-*jobb* med egen VM), inte mindre. Detta är svagt jämförbart: Playwrights
globalTeardown städar inom EN testkörning, inte en delad staging-miljö över
körningar — och är därför inte ett starkt precedensfall för vår fråga.

**Supabase branching** (`supabase.com/docs/guides/deployment/branching`,
hämtat 2026-08-23): *"Preview branches are ephemeral and best suited for
focused testing. They are automatically deleted when a PR is merged or
closed."* Dokumentationen säger INGET om vilka credentials/roller som
utför raderingen — sannolikt för att det är en PLATTFORMS-intern operation
(Supabase egen kontrollplan raderar branchen, inte kundens CI-token).
**Detta är svag precedens för vår fråga specifikt** — Supabase branching
delegerar bort hela problemet i stället för att lösa det med en scopad
CI-credential, vilket är precis vad TASK-305 måste göra. Deklarerat öppet:
precedent-rymden för "vilket scope ska EXAKT MITT teardown-CI-jobb ha" är
tunn i förstapartskällorna — ingen av de tre (Terraform/Playwright/Supabase)
ger en direkt, auktoritativ regel. Den starkaste vägledningen kommer i
stället från GitHub Actions egen dokumentation (§1) och från OWASP (§3).

### 3. OWASP/CIS — norm för ett städjobbs scope relativt skaparens

Sökning (WebSearch, 2026-08-23) mot OWASP CI/CD Top 10-sekundärkällor
(Cloudsmith, Palo Alto Networks, secure-pipelines.com — INTE OWASP:s egen
sajt direkt, se § Vad jag inte kunde belägga) ger den konsekventa
formuleringen: *"The principle of least privilege should be applied to
every identity — human users, bot accounts, and service tokens"* och *"to
reduce blast radius, restrict access per pipeline and step, isolate nodes
by sensitivity."* Tolkningen för ETT städjobb är alltså **"vad behöver
DENNA operation, inte mer"** — inte en absolut regel om att städaren
strukturellt måste vara smalare än skaparen. Ett städjobb vars HELA uppgift
är att radera det ett annat jobb skapade behöver per definition
delete-kapacitet mot samma resurs-klass som skaparen skrev till — annars kan
det inte göra sitt jobb. Normen är alltså **scopat till uppgiften**, och
"smalare än skaparen" håller bara när städuppgiften faktiskt är smalare än
skapandet (vilket den ÄR här: purge behöver bara `list_prefix`/
`remove_paths` mot `utkast/`, inte de skrivrättigheter mot `bilagor` som
skapar utkasten).

### 4. Motargumentet — kapad purge med "admin-JWT" mot staging

**Vad TEST_ADMIN_EMAIL faktiskt är.** Mätt (grep) i `tests/api/helpers.ts`
rad 12: *"TEST_ADMIN_EMAIL — admin login (på ADMIN_EMAILS-listan)"* — detta
ÄR en riktig admin-identitet i appens egen auktoriseringsmodell (används
mot t.ex. `invite-user`-EF:en som skickar riktiga mejl via Resend), inte en
Supabase-plattforms-service-role-nyckel. Frågans "admin-JWT"-framing är
alltså korrekt vad gäller identitetens klass — men fel vad gäller VAD den
kan göra mot just denna EF: `test-attachments-storage/index.ts`s
filhuvud-kommentar säger explicit *"ingen ADMIN_EMAILS-gate: funktionen rör
ingen persondata"* — `requireUser` kräver bara EN GILTIG inloggad
användare, inte admin-status, för `list_prefix`/`remove_paths`. Skriptet
råkar använda `TEST_ADMIN_*` snarare än `TEST_USER_*` av bekvämlighet
(samma fyra env-namn som redan finns), inte för att EF:en kräver det.

**Fail-closed-spärren i EF:en.** Läst `supabase/functions/
test-attachments-storage/index.ts`: `isAllowedPrefix()` tillåter ENDAST
`TEST_EVENT_PREFIX_MARKER` (`ZZ-TEST-EVENT-`) eller `UTKAST_PREFIX_MARKER`
(`utkast`/`utkast/`) — `remove_paths` kontrollerar VARJE path individuellt,
och en traverserings-guard (`harTraversering`, tillagd 2026-08-23 vid
"orkestrerar-härdningen av TASK-302.3") avvisar `..`, `.` och tomma segment
explicit eftersom koden uttryckligen inte litar på att Storage normaliserar
nyckeln åt den. En kapad JWT för denna åtgärd kan alltså — även i värsta
fall — bara lista/radera objekt under två reserverade testnamnrymder,
aldrig produktions- eller skarp affärsdata.

**Vem kan faktiskt kapa jobbet.** Mätt i `.github/workflows/`:
`ci.yml` triggas på `pull_request` (INTE `pull_request_target`) + `push:
main` + `merge_group`, och skickar `run_staging: false` VILLKORSLÖST på sin
egen PR-yta (kommentar rad ~38–45, A7:5/TASK-70.3) — `purge`- och
`test-staging`-jobben instansieras alltså **inte alls** på en PR, fork eller
ej, oavsett secrets. Även om de hade instansierats hade en fork-PR (plain
`pull_request`, ej `_target`) inte fått secrets alls (§1). De två ytor där
`purge` FAKTISKT kör med secrets är `post-merge.yml` (`push: branches:
[main]` — kräver att koden redan är granskad och mergad) och `nightly.yml`
(`schedule` + `workflow_dispatch` — kräver write-access för att triggas
manuellt). Dependabot är redan uteslutet på jobb-nivå
(`github.actor != 'dependabot[bot]'`). **Slutsats:** den som kan "kapa"
purge-jobbet med de fyra `TEST_*`-secreten måste redan kunna pusha till
`main` eller trigga `workflow_dispatch` med write-access — och den aktören
kan i så fall redan läsa `STAGING_AIRTABLE_TOKEN` (redan i purge-jobbet) och
alla sex `test-staging`-secrets direkt ur samma workflow-fil, oavsett vad
TASK-305 beslutar. Att lägga fyra redan-existerande secrets till ett andra
jobb i SAMMA trust-boundary höjer inte den marginella risken nämnvärt — hela
riskökningen är begränsad av EF:ens egen namnrymds-spärr, inte av vilket
jobb som håller nyckeln.

## Mätning (i stället för antagande)

`grep -rln "test-attachments-storage" tests/ scripts/` visar att
`tests/api/test-attachments-storage.staging.test.ts` redan anropar samma
EF med samma fyra `TEST_*`-secrets **inom `test-staging`-jobbet, i samma
workflow-fil**, varje gång staging-sviten kör. De fyra secreten TASK-305
föreslår ge till `purge` flödar alltså REDAN genom `ci-suite.yml` och
utövar redan JWT-gated Storage-operationer mot samma EF. TASK-305 lägger
INTE till en ny credential-klass i workflow-filens attack-yta — det ger ett
andra, redan Airtable-separerat jobb tillgång till en credential-klass som
redan finns där.

## Dom

**Secrets in — men EXAKT de fyra `STORAGE_PURGE_ENV_VARS`-namnen, inget
mer, och ingen ny `environment:`-härdning bara för detta jobb.**

Skälen, sammanvägda:

1. ADR-060:s princip ("bredda inte credential-scope för test-bekvämlighet")
   gäller en ANNAN situation — en rå Airtable-data-write-token in i
   test-miljön. Det TASK-305 föreslår är motsatsen: en redan existerande,
   redan EF-gated, redan fail-closed credential-klass, återanvänd av ett
   REDAN separat jobb för en smalare uppgift än den skaparen (`test-staging`)
   redan utför med samma nyckel.
2. GitHub Actions egen doktrin är "höj per jobb efter behov", inte "dela
   minsta gemensamma nämnare mellan alla jobb" — och den minimala höjningen
   här är fyra namngivna secrets, inte ett blankt `secrets: inherit` eller
   test-jobbets fulla sex.
3. Trigger-begränsningen som branschmönstret (GitHub security hardening,
   OWASP "restrict access per pipeline and step") efterfrågar finns REDAN:
   `run_staging: false` på PR-ytan, `pull_request` (ej `_target`) på hela
   `ci.yml`, Dependabot-skip på jobb-nivå. TASK-305 kräver ingen NY
   härdning för att nå branschgolvet — golvet är redan uppfyllt av
   arkitekturen `purge`-jobbet redan lever i.
4. Blast radius vid en hypotetisk kapning är begränsad av EF:ens
   `isAllowedPrefix` + traverserings-guard, inte av vilket CI-jobb som
   håller JWT:en — samma spärr gäller oavsett om `test-staging` eller
   `purge` är den som anropar.

## Vad jag inte kunde belägga

- **OWASP:s egen förstapartssida** för CI/CD Top 10 citerades inte
  verbatim härifrån — sökningen gav sekundärkällor (Cloudsmith, Palo Alto
  Networks, secure-pipelines.com) som citerar/parafraserar OWASP-listan.
  Jag har inte verifierat ordalydelsen mot `owasp.org` självt.
- **HashiCorp Terraforms egen dokumentation** om destroy- vs apply-scope
  citerades inte verbatim — underlaget är sekundärkällor (8th Light,
  OneUptime) som beskriver branschpraxis, inte HashiCorps egen
  rekommendation ordagrant.
- **Vercel/Netlify preview-cleanup-credentials** undersöktes inte alls i
  detta pass (tidsprioritering mot de tre andra, starkare källorna) — om
  precedens därifrån behövs för ett senare, större CI-secret-scope-beslut
  bör det researchas separat.
- **Om `TEST_ADMIN_*`-JWT:en faktiskt kan missbrukas mot ANDRA admin-gated
  EF:er (t.ex. `invite-user`) om den läcker ur `purge`-jobbets loggar** är
  inte prövat — det är dock samma risk som redan existerar i
  `test-staging`-jobbet i dag, och alltså inte en NY risk TASK-305 inför.
- Jag har INTE kört någon skarp CI-körning för att mäta att
  Storage-purgen faktiskt exekverar med secreten på plats (det är TASK-305:s
  AC #2, inte detta research-pass uppgift).

## Rekommendation (inte ett beslut — Marcus äger AC #1 på TASK-305)

Lägg de fyra `env:`-raderna (`TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`,
`TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`) till `purge`-jobbet i
`.github/workflows/ci-suite.yml`, namngivna exakt som
`STORAGE_PURGE_ENV_VARS` i `scripts/purge-staging-sentinels.mjs` redan
förväntar sig — INTE ett blankt `secrets: inherit` på jobbet. Lägg INTE till
`environment:`-skydd enbart på detta jobb (det vore en inkonsekvent
härdning som hoppar över det tyngre `test-staging`-jobbet); om
`environment:`-gating av staging-secrets ska införas är det ett separat,
bredare beslut som rör hela secret-klassen, inte TASK-305:s scope. Ingen
ytterligare trigger-begränsning behövs — den branschmönstret efterfrågar
(ingen exponering mot fork-PR:er, ingen Dependabot-exponering) finns redan
i `ci.yml`/`ci-suite.yml`s befintliga villkor.

## Källförteckning

- GitHub Docs — [Using secrets in GitHub Actions](https://`docs.github.com/en/actions/security-guides/using-secrets-in-github-actions`) (hämtat 2026-08-23)
- GitHub Docs — [Security hardening for GitHub Actions](https://`docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions`) (hämtat 2026-08-23)
- GitHub Docs — [Using environments for deployment](https://`docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment`) (hämtat 2026-08-23)
- Supabase Docs — [Branching](https://supabase.com/docs/guides/deployment/branching) (hämtat 2026-08-23)
- 8th Light — [Minimally Privileged Terraform](https://8thlight.com/insights/minimally-privileged-terraform) (sekundärkälla, funnen 2026-08-23)
- OneUptime — [How to Implement Least Privilege for Terraform Service Accounts](https://oneuptime.com/blog/post/2026-02-23-how-to-implement-least-privilege-for-terraform-service-accounts/view) (sekundärkälla, funnen 2026-08-23)
- Playwright Docs — [Global setup and teardown](https://playwright.dev/docs/test-global-setup-teardown) (sekundärkälla-refererat, funnen 2026-08-23)
- Cloudsmith — [OWASP CI/CD Top 10: Inadequate IAM](https://cloudsmith.com/blog/owasp-ci-cd-top-10-inadequate-flow-control-in-ci-cd-pipelines-2) (sekundärkälla, funnen 2026-08-23)
- Palo Alto Networks — [Top 10 CI/CD Security Risks](https://www.paloaltonetworks.com/resources/whitepapers/top-10-cicd-security-risks) (sekundärkälla, funnen 2026-08-23)
- [`docs/decisions/ADR-060-sentinel-setup-purge-create-conformance.md`](../decisions/ADR-060-sentinel-setup-purge-create-conformance.md) — styrande beslut, läst i sin helhet
- [`docs/decisions/ADR-124-forhandsgranskningens-leveransvag-transient-utkast-i-storage.md`](../decisions/ADR-124-forhandsgranskningens-leveransvag-transient-utkast-i-storage.md) — kontext för `utkast/`-bindningen
- `.github/workflows/ci.yml`, `.github/workflows/ci-suite.yml`, `.github/workflows/post-merge.yml`, `.github/workflows/nightly.yml` — lokala trigger-villkor, läst i sin helhet för relevanta jobb
- `supabase/functions/test-attachments-storage/index.ts` — `isAllowedPrefix`, `harTraversering`, `requireUser`-gate, läst
- `scripts/purge-staging-sentinels.mjs` — `STORAGE_PURGE_ENV_VARS`, skip-logik, läst
- `tests/api/helpers.ts` — `TEST_ADMIN_EMAIL`/`TEST_USER_EMAIL`-distinktionen, läst
- `backlog/tasks/task-305 - …md` — kortet frågan avgör
