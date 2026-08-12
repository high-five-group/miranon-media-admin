---
owner: marcus803
updated: 2026-08-12
review_by: 2027-02-08
status: draft
---

# Hur förhindrar man permanent att Supabase/GitHub-hemligheter exponeras i ett agent-drivet repo — staging och prod (2026-08-12)

> **Proveniens:** Fristående research-pass, beställt efter en skarp incident
> 2026-08-12: `npx supabase projects api-keys --project-ref pqtshyierkdgwdnxuirz
> -o json` (utan `--reveal`) skrev ut den fullständiga legacy
> `service_role`-JWT:n i klartext i ett agent-transkript. Kör oisolerat i
> huvudkatalogen; committar ingenting.

## Kort svar

**Rotorsaken är ett mätt, bekräftat, avsiktligt CLI-/plattformsbeteende — inte
en bugg och inte ett misstag hos den körande agenten.** Supabase CLI:s
`--reveal`-flagga (mätt lokalt: `npx supabase --version` → `2.113.0`, 2026-08-12)
gäller **enbart** de nya `sb_secret_…`-nycklarna. Legacy `service_role`/`anon`
returneras **alltid** i klartext av Management API:t, oavsett flagga eller
output-format — bekräftat verbatim ur `supabase/cli`-issuen som beskriver exakt
detta beteende (se § B6). Det finns **ingen kommandoradsväg** att tysta legacy-
nyckeln. Det betyder att det enda helt tillförlitliga sättet att stänga detta
för gott är **dubbelt**: (1) mekanisera bort möjligheten att köra det råa
kommandot alls (repo-sidan, görbart idag, gratis), och (2) migrera bort från
legacy-nycklar helt (Supabase-sidan — och numera *nödvändigt*, eftersom det
**inte längre går att rotera** en läckt legacy `service_role`-nyckel, mätt
idag mot Supabase egen felsökningsguide, se § A3). Allt annat i denna rapport
— GitHub-scanning, gitleaks/trufflehog, rotations-rutin — är försvar i djupet
ovanpå de två åtgärderna, inte ersättning för dem.

**Detta är inte första gången samma kommando kördes i det här repot.** Ett
tidigare research-pass (`docs/research/task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md`,
2026-08-05 — sju dagar före dagens incident) använde exakt samma kommando mot
samma staging-ref, med en uttalad disciplin: *"hämtades... EN GÅNG, användes
för en fullständig manuell körning, och rensades omedelbart efter"*. Den
disciplinen städade disk (scratchpad, repo) — men adresserade aldrig att
värdet redan hade lämnat maskinen i samma ögonblick CLI:t skrev ut det till
ett agent-observerat stdout, eftersom den texten blir en del av nästa
anrop till modell-API:t. Det är exakt samma gap som utlöste dagens incident,
bara att ingen råkade notera det förra gången. En regel som säger "hämta
bara en gång och städa efteråt" är prosa, inte mekanik — den höll inte andra
gången den prövades.

## Bakgrund — vad jag redan hade när jag började (inventering)

- **Ingen befintlig research-fil** täcker hemlighetsexponering, CLI-utskrift
  av secrets, gitleaks/trufflehog eller Supabase-nyckelrotation
  (`ls docs/research/` genomsökt, 106 filer, ingen träff på ämnet).
- **Ingen ADR avgör frågan.** `ADR-028` (supply chain-incidentrespons för
  `npm`-advisories) är närmast i ANDA — samma "STOPPA → diagnostik →
  åtgärdsmatris → kodifiera"-mönster — men handlar om paket-malware, inte
  hemlighetsutskrift, och tillämpas inte direkt här.
- **Tråd `T34`** (`tasks/threads/README.md`, `paused`) är angränsande men en
  *annan* axel: CLI:t lokalt länkat mot prod-ref → kommandon utan explicit
  `--project-ref` träffar fel miljö. Det är ett **mål**-problem (fel
  databas), inte ett **utskrifts**-problem (rätt databas, men värdet läcker
  till transkriptet). Ingen tråd täcker det senare.
- **Prior art som direkt föregriper dagens incident:**
  `docs/research/task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md`
  (läst i sin helhet) — se ovan. Detta pass bygger vidare på den insikten
  snarare än att upprepa den.
- **Lagringshygienen verifierad ren** (egen mätning, 2026-08-12): de tre
  committade `.env.*`-filerna (`development`/`staging`/`production`)
  innehåller enbart `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — ingen
  `service_role`. `gh secret list` mot repot visar 8 poster, ingen av dem är
  en Supabase-nyckel eller ett Management-API-token — CI bär alltså inte
  denna specifika risk. Detta bekräftar Marcus egen efterhandskontroll:
  problemet satt i ett kommando som **hämtar och skriver ut**, inte i lagring.
- **38 Edge Functions** (inte "~33" som bakgrunden angav — mätt via
  `grep -rn "SUPABASE_SERVICE_ROLE_KEY" supabase/functions/`, marginell
  korrigering utan konsekvens för rekommendationen) läser
  `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` direkt — var och en av dessa
  måste kodändras vid en migrering till det nya nyckelformatet (§ A2).
- **Repot har redan en mekanism att bygga vidare på:** `scripts/deny-resend-send.sh`
  är ett PreToolUse-hook-mönster (fail-closed, `exit 2`, dubbel botten
  permissions+hook) som redan löser en strukturellt likartad uppgift ("tillåt
  aldrig ett visst kommando/MCP-verktyg att köras rått"). Samma arkitektur
  återanvänds i rekommendationen nedan.

## A. Supabase nyckelmodell och rotation

### A1. Roterbarhet — legacy JWT kontra `sb_publishable_`/`sb_secret_`

Legacy `anon` och `service_role` är båda JWT:er signerade med **samma delade
projekt-hemlighet**. Officiell dokumentation: *"the `anon` and `service_role`
keys... must be rotated simultaneously"* — de kan inte roteras oberoende av
varandra eftersom de härleds ur samma signeringsnyckel
([Supabase, JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys)).

Det nya formatet är designat specifikt för att lösa detta: *"You can run a
separate key per service so a single leak only forces one rotation"* — flera
`sb_secret_…`-nycklar kan existera samtidigt, var och en under ett eget namn i
samma `SUPABASE_SECRET_KEYS`-JSON-objekt
([Supabase, Migrating to publishable and secret API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)).
Rotation blir därmed **oberoende per tjänst** och **utan driftstopp**: skapa
ny nyckel → byt konsument → radera gammal, upprepa per tjänst.

### A2. Migreringskostnad för Edge Functions

**Legacy:** `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` — ren sträng.

**Nytt:** plattformen injicerar i stället `SUPABASE_SECRET_KEYS` (ersätter
service_role) och `SUPABASE_PUBLISHABLE_KEYS` (ersätter anon) — båda är
JSON-objekt nyckelbara på namn, inte strängar. Citat: *"The new ones hold a
JSON object keyed by name, so you parse them and read the key by name"*
([samma källa som ovan](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)).
Exakt läsmönster:

```ts
const secretKey = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default']
```

Migrering kräver **utöver** detta: `verify_jwt = false` i funktionens config,
och att nyckeln skickas på `apikey`-headern i stället för
`Authorization: Bearer`. Auto-injektion är bekräftad live (dokumentationen
säger explicit att plattformen sätter dessa variabler automatiskt), men
kräver att man **verifierar dem i Dashboard → Edge Functions → Secrets innan
man börjar**.

**Konkret för detta repo:** 38 Edge Functions (mätt, se ovan) läser
`SUPABASE_SERVICE_ROLE_KEY` direkt — varenda en av dem behöver denna
kodändring vid en fullständig migrering. Det är inte en enrads-konfig-ändring,
det är en refaktorering över hela EF-ytan.

### A3. Exakt procedur för rotation idag — och vad som går sönder

**Kritiskt, mätt idag (2026-08-12) mot Supabase egen aktuella
felsöknings-sida:** *"it is no longer possible to rotate the legacy anon,
service and JWT secrets"*
([Supabase, Rotating Anon, Service, and JWT Secrets](https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd)).
Detta är skarpt: har en legacy `service_role`-nyckel läckt (vilket den nu
har, för staging) finns **ingen** väg att generera en ny legacy-nyckel och
invalidera den gamla. Den enda vägen är att migrera till det nya
nyckelsystemet och behandla den nya `sb_secret_`-nyckeln som "roterad
ersättning".

**Motsägelse att flagga öppet:** en community-tråd med Supabase-personal
([Discussion #38834](https://github.com/orgs/supabase/discussions/38834),
kollaboratör `GaryAustin1`) säger *"For service_role you need to go in and
change it in the dashboard by changing the JWT secret"* — vilket beskriver
den ROTATION-VÄG som den aktuella felsöknings-sidan säger inte längre
existerar. Jag kan inte datera exakt när svaret i diskussionen skrevs relativt
när "no longer possible"-formuleringen infördes i dokumentationen. Jag
behandlar den **aktuella, idag hämtade** felsökningssidan som auktoritativ
eftersom den är den kanoniska sidan just nu — men motsägelsen är öppen, inte
tyst dold.

**Om man ÄNDÅ roterar hela JWT-hemligheten** (den enda kvarvarande legacy-vägen,
om den fortfarande fungerar för någon): *"Currently active users get
immediately signed out"* — full signerings-hemlighets-rotation loggar ut
**alla** inloggade sessioner omedelbart, med *"downtime, sometimes being
significant"* ([JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys)).

**För nya `sb_secret_`-nycklar:** Settings → API Keys → skapa ny secret key →
byt alla konsumenter → radera den komprometterade. Ingen tvingad utloggning,
eftersom `publishable`/anon-lagret är opåverkat.

**Att avaktivera legacy-nycklar helt** (steg 6 i migrerings-guiden): Settings
→ API Keys → avaktivera legacy-sektionen. Reversibelt. Explicit varning:
*"Before turning the legacy keys off, confirm nothing still depends on
them"* — ingen automatisk användningsspårning finns; man måste manuellt
kontrollera mobilappar redan ute hos användare, CI/CD, tredjepartsintegrationer,
cron-jobb ([Migrating to publishable and secret API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)).

### A4. Officiell rekommendation och deadline

Supabase rekommenderar uttryckligen bort från `service_role`: den nya
secret-nyckeln är *"an improvement over the old JWT-based `service_role`
key"* och *"we recommend using it where possible"*
([Understanding API keys](https://supabase.com/docs/guides/getting-started/api-keys)).

**Deadline, mätt idag:** *"They will be deprecated by the end of 2026"* — cirka
4,5 månader från denna rapports datum. Ett tidigare delmål har **redan
passerat**: *"Projects restored from 1st November 2025 will no longer be
restored with the legacy API keys"* och nya projekt saknar redan helt
`anon`/`service_role` ([Discussion #40300](https://github.com/orgs/supabase/discussions/40300)).

## B. Att förhindra exponering i första ledet

### B5. Branschmönster (minst tre ledare, inte bara vår lokala hook-idé)

1. **1Password CLI (`op run`)** — injicerar hemligheter som miljövariabler i
   en **temporär subshell** för processens livstid enbart; värdena hamnar
   aldrig på disk, aldrig i shell-historik
   ([1Password Developer, Load secrets into the environment](https://developer.1password.com/docs/cli/secrets-environment-variables)).
   1Password har dessutom publicerat förstapartsvägledning specifikt om att
   säkra MCP-servrar/agent-konfigurationer mot exakt den här klassen läckor
   ([1Password, Securing MCP servers with 1Password](https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent)).
2. **HashiCorp Vault / dynamiska hemligheter** — etablerat mönster för att
   aldrig materialisera en långlivad statisk nyckel alls; nämnt som
   referensmönster i GitGuardians kommandorads-cheat-sheet (se nedan).
3. **Supabase egen MCP-vägledning ("defense in depth")** — den starkaste,
   mest relevanta förstapartskällan för just agent-driven risk: `read_only`-läge
   kör allt som en läsbehörig Postgres-roll och stänger av muterande verktyg;
   `project_ref`-scoping begränsar servern till ETT projekt. Men den
   **enskilt starkaste** rekommendationen är strukturell, inte teknisk:
   *"Use the MCP server with a development project, not production"*
   ([Supabase, Defense in Depth for MCP Servers](https://supabase.com/blog/defense-in-depth-mcp)).
   Alltså: den robustaste branschpraxisen är inte att filtrera output mot
   prod — det är att **aldrig peka agent-tooling mot prod över huvud taget**.
4. **GitGuardians kommandoradsguide** etablerar riskkatalogen (shell-historik,
   `ps`/`/proc/<pid>/cmdline`, `stdin`-temp-filer, loggar) och rekommenderar
   hemlighetshanterare + wrapper-funktioner i stället för att någonsin skriva
   ett hemligt värde direkt på kommandoraden
   ([GitGuardian, How to Handle Secrets at the Command Line](https://blog.gitguardian.com/secrets-at-the-command-line/)).

**Claude Code-ekosystemet specifikt — mätt kontrakt, inte antaget:** jag
hämtade `code.claude.com/docs/en/hooks.md` (samma källa som redan citeras
auktoritativt i detta repos `scripts/deny-resend-send.sh`) och verifierade
exakt vad hooks KAN och INTE kan göra:

| Hook | Kan ändra kommandot (input)? | Kan ändra output? | Beslutstyp |
|---|---|---|---|
| `PreToolUse` | **Nej** — bara tillåt/neka/eskalera | N/A (kommandot körs inte alls om nekat) | `permissionDecision` |
| `PostToolUse` | N/A | **Nej** — output är redan i transkriptet | bara `additionalContext`/`systemMessage` |

Det finns alltså **ingen inbyggd, förstaparts väg** att låta ett kommando köra
och sedan redigera bort ett hemligt värde ur dess stdout innan modellen ser
det. Community-projekt existerar som löser en näraliggande del av problemet
(`l-mb/claude-code-redaction-hooks`, `ShindouMihou/cc-redact`) genom att
avlyssna **filläsningar** (`Read`-verktyget) och ersätta hemliga värden med
platshållare INNAN Claude ser filen — men det löser inte "ett kommando
hämtar och skriver ut ett värde som aldrig legat på disk", vilket är exakt
vad som hände här. Två öppna feature requests hos Anthropic bekräftar att
gapet är erkänt men **inte löst**: `anthropics/claude-code#29434` ("mechanism
to redact secrets/PII from context window") och `#39882` ("PreApiCall /
PostApiCall hooks to prevent secret exfiltration") — båda öppna vid
mättillfället.

**Praktisk konsekvens:** eftersom `PreToolUse` bara kan blockera — inte
skriva om — kan repot inte mekanisera "kör kommandot men maskera outputen".
Det som ÄR mekaniserbart, och som matchar arkitekturen `deny-resend-send.sh`
redan etablerat i detta repo, är: **neka det råa kommandot helt** (mönster-
matcha `supabase ... api-keys` i en PreToolUse-Bash-hook) och tvinga vägen
via ett wrapper-skript som pipar `stdout` genom en maskerings-filter (t.ex.
`sed`/`awk` som ersätter varje sträng som matchar JWT-formen `eyJ…\.eyJ…\.…`
med en trunkerad `eyJ…[MASKERAD]`) innan resultatet någonsin returneras till
Bash-verktyget. Wrappern körs alltså UTANFÖR hook-kontraktets begränsning
(den är inte en hook, den är det enda tillåtna sättet att nå kommandot) —
samma "dubbel botten"-idé som redan finns i mail-låset. **Detta är min
rekommendation, inte ett etablerat mönster jag hittat hos tredje part** — jag
hittade ingen färdig branschlösning för exakt denna komposition (CLI utan
redigerbar output + agent-harness utan output-omskrivning), vilket är värt
att säga öppet: precedent-rymden här är tunn.

### B6. Kan man hämta projektinfo utan att nyckelvärden ingår? Bugg eller känt beteende?

**Mätt, primärkälla, hämtat verbatim via `gh api` 2026-08-12** (inte bara
websök-sammanfattning):

- `npx supabase projects api-keys --help` (lokalt installerad v2.113.0)
  visar: `--reveal   Reveal the secret API keys in full (e.g. sb_secret_...)`.
  Flaggan existerar och beskrivs **explicit** som gällande `sb_secret_`-format.
- `supabase/cli`-issue [#4775](https://github.com/supabase/cli/issues/4775)
  (stängd 2026-06-20 via PR [#5633](https://github.com/supabase/cli/pull/5633)),
  rapportörens ord verbatim: *"It works well with the legacy keys but now for
  some reason it was decided that the secret api key returned by `supabase
  projects api-keys` will be redacted without any flag to override that
  decision... The key is accessible in the UI dashboard anyway."*
- PR-beskrivningen (verbatim, hämtad via `gh api repos/supabase/cli/pulls/5633`):
  *"Redaction is server-side: new secret keys come back `null` unless the
  request carries `reveal=true`, and the command never sent it."* — och att
  `bootstrap`-flödet *"only consumes the never-redacted anon key"*, dvs.
  legacy-nycklar beskrivs uttryckligen som ALDRIG redigerade av
  Management API:t, till skillnad från de nya nycklarna där redigering är en
  ny, opt-in-serverfunktion.

**Slutsats — mätt, inte antaget:** detta är **bekräftat aktuellt, avsiktligt
plattformsbeteende**, inte en bugg. Management API-endpointen
`GET /v1/projects/{ref}/api-keys` maskerar helt enkelt aldrig legacy-format-
nycklar — redigering (`reveal`) är en mekanism som byggdes **enbart** för det
nya nyckelformatet. Det finns ingen `-o`/`--output`-form (testat: `env`,
`pretty`, `json`, `toml`, `yaml`, `table`, `csv` — samtliga är
formaterings-val, ingen maskerar värden) och inget scopat/läsbegränsat
token-läge för just detta kommando som löser problemet. Det är **strukturellt
omöjligt** att via CLI:t hämta projektets API-nycklar-lista utan att
legacy-värdena följer med i klartext, så länge legacy-nycklar existerar på
projektet.

## C. Att upptäcka exponering

### C7. GitHub secret scanning + push protection — privat repo

**Krav och kostnad:** kräver GitHub Advanced Security / "GitHub Secret
Protection" — en betald funktion för privata repon. Sekundärkällor
(`decryptiondigest.com`, `buildmvpfast.com`) anger **$19/säte**; jag kunde
**inte** verifiera exakt pris direkt på en förstaparts-prissida (se § Vad jag
inte kunde belägga). Aktiveras först på org-nivå, sedan repo-nivå.

**Supabase-täckning, mätt mot GitHubs egen supported-patterns-sida
([GitHub, Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns),
hämtad 2026-08-12):** exakt FYRA Supabase-mönster listas —
`supabase_oauth_access_token` (partner), `supabase_personal_access_token`,
`supabase_scoped_personal_access_token`, `supabase_secret_key`. **Ingen av
dem täcker legacy `anon`/`service_role`-JWT-formatet**, och GitHub har ingen
generisk "detta ser ut som en JWT"-detektor (till skillnad från gitleaks, se
§ C8) — GitHub scannar mot registrerade, kända format. **Konsekvens: GitHub
secret scanning + push protection, även fullt aktiverat och betalt, hade INTE
fångat exakt den nyckeltyp som läckte idag**, vare sig i git-historik eller
(vilket ändå är irrelevant här — se nedan) någon annanstans.

**Anpassade mönster** är möjliga: GHAS stöder regex-baserade custom patterns
på repo/org/enterprise-nivå, med push-protection-integration och
"dry run"-testläge före aktivering
([GitHub, Defining custom patterns for secret scanning](https://docs.github.com/en/code-security/secret-scanning/using-advanced-secret-scanning-and-push-protection-features/custom-patterns/defining-custom-patterns-for-secret-scanning)) —
detta är den mekaniserbara vägen att täcka legacy-JWT-formatet explicit, men
kräver betald GHAS-tier och att någon skriver och underhåller regeln.

**Viktig avgränsning för hela § C7:** push protection gäller **enbart
`git push`**. Den skyddar inte mot exakt det som hände idag — en hemlighet
som aldrig gick via git, utan lämnade maskinen via ett agent-transkript. Se
§ C9.

### C8. gitleaks kontra trufflehog — standardval, konfiguration, GitHub Actions

**2026 branschkonsensus (3+ oberoende källor: `appsecsanta.com`,
`rafter.so`, `secrails.com`):** gitleaks som pre-commit-hook (millisekund-
snabb, regex/SARIF) + trufflehog i CI med `--only-verified` (verifierar
hittade nycklar live mot 800+ leverantörers API:er, filtrerar bort döda
fynd). Detta är den återkommande rekommendationen i samtliga tre källor.

**Mätt, kritiskt fynd som INVERTERAR den standardrekommendationen för
exakt vår nyckeltyp:**

- **gitleaks standardkonfiguration** (hämtad direkt från
  `raw.githubusercontent.com/gitleaks/gitleaks/master/config/gitleaks.toml`,
  2026-08-12): **ingen** Supabase-specifik regel, men EN generisk `jwt`-regel
  (id `jwt`, nyckelord `"ey"`, regex som matchar header.payload.signature-
  formen). Den regeln **skulle ha matchat** dagens läckta legacy-nyckel var
  den än dyker upp i text (git-diff, eller en godtycklig loggfil/transkript
  skannad via `gitleaks dir`/`gitleaks stdin` — moderna gitleaks stöder
  filsystem- och stdin-skanning utanför git-kontext, inte bara `detect`
  mot git-historik). Brusig (flaggar även den medvetet publika anon-nyckeln),
  men den fångar den verkliga läckan.
- **TruffleHogs detektorkatalog** (verifierad direkt via
  `gh api repos/trufflesecurity/trufflehog/contents/pkg/detectors`, inte
  bara websök): exakt EN Supabase-detektor, `supabasetoken`, med regex
  `sbp_[a-z0-9]{40}` — det är **Management API:ts personliga
  access-token**-format, inte projektets `anon`/`service_role`/`sb_secret_`-
  nycklar alls.
- **TruffleHogs nyare generiska JWT-detektor med liveness-verifiering**
  (förstapartskälla,
  [Truffle Security, TruffleHog now detects JWTs with public-key signatures](https://trufflesecurity.com/blog/trufflehog-now-detects-jwts-with-public-key-signatures-and-verifies-them-for-liveness)):
  detektorn *"ignores JWTs signed with a shared secret (i.e., those using
  HMAC-based algorithms)"* uttryckligen, för att undvika att rapportera fynd
  vars livstillstånd inte går att verifiera. Supabase legacy `anon`/
  `service_role` är HS256-signerade (delad hemlighet) — **exakt** den klass
  detektorn medvetet hoppar över.

**Slutsats, mätt inte antaget:** TruffleHog, kört i sitt flaggskepps-läge
("bara verifierade fynd", den egenskap som annars gör det till det
lågbrus-verktyg branschen rekommenderar för CI-grindar), är **strukturellt
blint** för exakt den hemlighetsklass som läckte i denna incident. Gitleaks
generiska, brusiga, overifierade `jwt`-regel är paradoxalt nog den av de två
som faktiskt skulle ha flaggat läckan. Standardrekommendationen "gitleaks
för hastighet, trufflehog för precision" håller inte för Supabase
legacy-nycklar specifikt — här är gitleaks den substantiellt mer relevanta
av de två, inte bara den snabbare.

**GitGuardian** (kommersiell, `ggshield`-CLI gratis för individer,
team-pris offert-baserat) har en **syftesbyggd** "Supabase Service Role JWT"-
detektor som avkodar JWT-payloaden och kontrollerar `role`-claimet — den
skiljer alltså `anon` från `service_role` i stället för att flagga båda,
vilket löser gitleaks brus-problem
([GitGuardian, Supabase Service Role JWT-detektor](https://docs.gitguardian.com/secrets-detection/secrets-detection-engine/detectors/specifics/supabase_service_role_jwt)).
Remediation-sidan är explicit: *"Contact the service support"* eftersom
*"no automated revoker is currently available"* — bekräftar oberoende A3:s
fynd att legacy-nycklar saknar en självbetjänings-rotationsväg.

### C9. Redan-exponerat i loggar/transkript (inte git) — scrubbing-praxis

Etablerad praxis (GitGuardians kommandoradsguide): **rotera omedelbart** —
att ta bort den lokala kopian ändrar ingenting om värdet redan finns någon
annanstans. Citat: *"If a token appears in history, assume compromise risk
and rotate it."* Skrubba shell-historik OCH AI-transkript explicit nämns som
mål; verifiera alltid från en **FÄRSK** shell, eftersom flera öppna shell-
sessioner tyst kan återuppliva raderad historik.

**Den avgörande principen för vårt fall, härledd men inte direkt citerad ur
någon enskild källa:** i det ögonblick Supabase-CLI:t skrev ut nyckeln till
ett agent-observerat stdout, blev den texten en del av nästa meddelande som
skickas till modell-API:t — den lämnade alltså den lokala maskinen redan då,
oavsett vad som senare görs med lokala loggfiler. Det gör "städa bort den
från disk efteråt" (mönstret från 2026-08-05-passet) otillräckligt som
ensam åtgärd: exponeringen inträffade vid överföringstillfället, inte vid
lagringstillfället. **Om en hemlighet inte kan avlägsnas retroaktivt ur något
som redan lämnat lokal disk är rekommendationen entydig i samtliga läsna
källor: rotera — skrubbning är hygien, inte remediering, när värdet redan
transmitterats.**

## D. Rotation som rutin

### D10. Branschstandard för rotations-runbook

**Ingen universell fast kadens hittades** — konsekvent över samtliga källor
jag läste. Vanligt förekommande spann: 30–90 dagar för högprivilegierade
nycklar (service_role-klassen), längre för lägre-scope. NIST SP 800-53
nämns (sekundärkälla) i samband med 90-dagars rotation och
kryptoperiod-baserad (tids- **och** användnings-baserad) gränssättning.
OWASP och NIST SP 800-63 förespråkar begränsade credential-livstider och
automatiserad upptäckt av exponerade/komprometterade nycklar snarare än
enbart kalenderbaserad rotation. **Jag hittade ingen förstaparts-Supabase-
rekommendation om kadens** — deras dokumentation beskriver HUR man roterar,
aldrig HUR OFT.

**Strukturellt bäst-lämpad runbook-form för Supabase specifikt** (härledd ur
§ A1–A4, inte en enskild källas explicita runbook): eftersom det nya
`sb_secret_`-systemet stöder flera samtidiga namngivna nycklar, blir en
säker rotations-runbook: skapa ny namngiven nyckel → driftsätt till EN
konsument/tjänst i taget → verifiera i staging FÖRE prod → upprepa per
tjänst → radera gammal nyckel FÖRST när samtliga konsumenter bekräftat
migrerade. Det är precis den form legacy-systemets delade-hemlighet-design
strukturellt inte kan erbjuda (§ A1, A3).

## Dom

1. **Rotorsaken är plattformens, inte vår.** Legacy `service_role`/`anon`
   kan inte tystas via CLI-flagga (mätt, § B6) och kan inte längre roteras
   alls (mätt, § A3). Detta är inte förhandlingsbart bort — det är
   Supabase-sidans nuvarande verklighet, och det gör migrering till det nya
   nyckelsystemet till en **nödvändig**, inte valfri, del av svaret.
2. **Ingen extern grind (GitHub secret scanning, gitleaks default,
   trufflehog default) täcker legacy-JWT-formatet tillförlitligt utan
   anpassning.** GitHub saknar mönstret helt. Trufflehog är av design blint
   för HMAC-JWT:er. Gitleaks generiska `jwt`-regel är den enda av de tre
   som fångar det, och den är brusig. Detta gap måste antingen stängas med
   en anpassad regel/detektor (gitleaks custom rule, GHAS custom pattern,
   eller GitGuardians syftesbyggda detektor) eller göras irrelevant genom
   att legacy-nyckeln upphör att existera (migrering).
3. **Ingen av de externa grindarna hade förhindrat DAGENS incident
   överhuvudtaget**, eftersom exponeringen aldrig gick via `git push` — den
   gick via ett CLI-kommandos stdout, direkt in i ett agent-transkript.
   Push protection, GitHub secret scanning och en CI-körd scanner är alla
   grindar på **git-ytan**. Vårt hål är på **kommando-utförande-ytan**.
4. **Claude Codes hook-kontrakt kan inte redigera output** (mätt, § B5) —
   bara blockera kommandon innan de körs. Den enda mekaniserbara,
   förstaparts-korrekta lösningen på kommando-utförande-ytan är att neka det
   råa kommandot och tvinga fram en maskerande wrapper, precis som repot
   redan gör för Resend-sändning.

## Vad jag inte kunde belägga

- **Exakt pris för GitHub Secret Protection/GHAS per säte.** Endast
  sekundärkällor gav en siffra ($19/säte); jag fick ingen förstaparts-siffra
  direkt från `github.com/security/plans` (sidan hänvisade vidare utan att
  ange belopp i den hämtade texten).
- **Om GitHubs `supabase_secret_key`-mönster exakt matchar `sb_secret_…`-
  prefixet.** Tidsmässigt sannolikt (mönstret tillkom juni 2026, samtidigt
  som det nya nyckelformatets utrullning) men jag hittade ingen
  förstaparts-bekräftelse av den exakta regexen/prefixmatchningen.
- **Motsägelsen mellan Discussion #38834** (personal-svar: legacy
  `service_role` GÅR att byta via "JWT secret" i Dashboard) **och den
  aktuella felsökningssidan** ("no longer possible"). Jag kunde inte datera
  vilken som är korrekt just nu bortom att behandla den idag hämtade,
  kanoniska felsökningssidan som auktoritativ.
- **Om Claude Code (nuvarande version) har NÅGON förstaparts (icke-community)
  mekanism för output-redigering/redaktion utöver PreToolUse tillåt/neka.**
  Jag hittade enbart community-hook-projekt och två öppna feature requests
  — ingen bekräftelse på att Anthropic redan levererat detta.
- **Exakt team-pris för GitGuardian/ggshield.** Enbart "offert-baserat" från
  sekundärkällor.
- **Om avaktiverade legacy-nycklar helt försvinner ur
  `supabase projects api-keys`-utskriften, eller visas som `null`/återkallade.**
  Resonerat utifrån "avaktivera"-semantiken men inte direkt verifierat mot
  en efter-avaktivering-skärmdump eller exakt dokumentationscitat.
- **Anthropics egen säkerhetspolicy/rekommendation för agent-hanterade
  hemligheter i CLI-verktyg generellt** (utöver hooks-kontraktet ovan) — jag
  sökte inte uttömmande efter en dedikerad Anthropic-sida om detta utöver
  hooks-dokumentationen.

## Rekommendation (min bedömning — inte ett beslut)

Golv markerat **[GOLV]** = säkerhetskritiskt, icke förhandlingsbart givet att
prod bär verklig persondata. Övrigt är förbättring ovanpå golvet.

### Steg 1 — [GOLV] Rotera/stäng av den läckta staging-nyckeln nu

Kostnad: låg (en dashboard-åtgärd + verifiering att inget beroende bryts).
Risk om ej gjort: en läckt `service_role`-nyckel ger fullständig admin-
åtkomst till staging-databasen till vem som helst med transkriptet. Eftersom
legacy-rotation inte längre är möjlig (§ A3) är detta i praktiken samma
handling som Steg 2 (migrering) för just den nyckeln — det finns ingen
billigare separat "bara rotera legacy"-väg längre.

### Steg 2 — [GOLV] Mekanisera bort det råa CLI-kommandot, INTE en prosa-regel

Kostnad: låg–medel (en PreToolUse-deny-hook + ett wrapper-skript, samma
arkitektur som `scripts/deny-resend-send.sh`). Risk om ej gjort: exakt samma
incident upprepas — mätt att den redan hänt två gånger på sju dagar med
samma kommando (§ Bakgrund), och att "kom ihåg att städa efteråt" redan
visat sig otillräckligt en gång. Eftersom `PreToolUse` inte kan redigera
output (§ B5) måste konstruktionen vara: neka `supabase ... (projects
api-keys|...)`-mönster rått → tvinga via ett skript som maskerar varje
JWT-liknande sträng i outputen innan den returneras. Detta är den enda
förstaparts-korrekta mekaniska vägen givet hook-kontraktet, och den enda som
täcker **både** staging och prod eftersom den sitter på kommando-nivå, inte
miljö-nivå.

### Steg 3 — [GOLV] Migrera Edge Functions + klienter till nya nycklar före Q4 2026

Kostnad: medel–hög (38 Edge Functions kodändras, § A2; kräver testning per
funktion i staging före prod). Risk om ej gjort: dubbel — dels missar man
Supabase egen deadline ("end of 2026"), dels **kvarstår den fullständiga
oförmågan att rotera vid nästa läcka** ända tills migreringen är klar. Detta
är inte en "trevlig framtida uppgradering" — det är den enda vägen tillbaka
till att kunna rotera en komprometterad nyckel alls.

### Steg 4 — Förbättring: gitleaks i CI/pre-commit med en Supabase-medveten regel

Kostnad: låg (gratis, OSS, redan branschstandard för pre-commit-hastighet).
Måste **kompletteras** med en riktad regel/allowlist eftersom
standardkonfigurationens generiska `jwt`-regel både (a) är den enda av
gitleaks/trufflehog/GitHub som fångar legacy-formatet alls, och samtidigt
(b) kommer flagga den medvetet publika `anon`-nyckeln som brus. Rimlig form:
behåll `jwt`-regeln, lägg en allowlist-post för den kända, avsiktligt
publika `VITE_SUPABASE_ANON_KEY`, låt allt annat matchande JWT stanna
grindad.

### Steg 5 — Förbättring: GitHub secret scanning + push protection (om budget finns)

Kostnad: hög (GHAS-licens, sekundärkälla anger ~$19/säte/månad, ej
förstaparts-verifierad). Värde: fångar push-baserad läcka av de FYRA
Supabase-partnermönstren som redan täcks (§ C7) plus ger möjlighet till en
anpassad regel för legacy-JWT-formatet. Täcker **inte** transkript-vägen —
komplement till Steg 2, aldrig ersättning.

### Steg 6 — Förbättring: rotations-runbook per D10:s form, dokumenterad

Kostnad: låg (dokumentation + en gång-genomgång). Utför EFTER Steg 3 —
runbooken som beskrivs i § D10 kräver det nya flernyckel-systemet för att
kunna vara zero-downtime och per-tjänst; att skriva en runbook för
legacy-systemet idag vore att dokumentera en väg som redan är stängd (§ A3).

### Explicit ordning och varför

Steg 1–2 är oberoende av varandra och kan göras parallellt idag. Steg 3 är
den enda vägen att återfå en fungerande rotationsförmåga och bör inte skjutas
längre än nödvändigt givet att den redan är obligatorisk oavsett incident.
Steg 4 kan göras oberoende när som helst (billigt, inget beroende). Steg 5–6
är meningsfulla EFTER Steg 2–3 är på plats — att köpa en dyr grind för en
yta (git) som inte var läckans väg, före man stänger den yta som faktiskt
var läckans väg, vore fel prioritetsordning.

## Källförteckning

**Supabase, förstaparts:**

- [Understanding API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Migrating to publishable and secret API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)
- [JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys)
- [Rotating Anon, Service, and JWT Secrets (felsökning)](https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd)
- [Show API keys for a project — CLI-referens](https://supabase.com/docs/reference/cli/supabase-projects-api-keys)
- [Defense in Depth for MCP Servers](https://supabase.com/blog/defense-in-depth-mcp)
- [Supabase MCP Server-dokumentation](https://supabase.com/docs/guides/getting-started/mcp)
- [Upcoming changes to Supabase API Keys — Discussion #29260](https://github.com/orgs/supabase/discussions/29260)
- [Legacy key deprecation-tidslinje — Discussion #40300](https://github.com/orgs/supabase/discussions/40300)
- [Exponerad service_role — community-svar, Discussion #38834](https://github.com/orgs/supabase/discussions/38834)
- [`supabase/cli` issue #4775 (rotorsaks-belägget)](https://github.com/supabase/cli/issues/4775)
- [`supabase/cli` PR #5633 (fixen, `--reveal` för nya nycklar)](https://github.com/supabase/cli/pull/5633)

**GitHub, förstaparts:**

- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns)
- [Defining custom patterns for secret scanning](https://docs.github.com/en/code-security/secret-scanning/using-advanced-secret-scanning-and-push-protection-features/custom-patterns/defining-custom-patterns-for-secret-scanning)
- [Push protection — koncept](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)
- [Secret scanning updates — juni 2026, changelog](https://github.blog/changelog/2026-06-17-secret-scanning-updates-june-2026/)
- [GitHub Secret Protection — produktsida](https://github.com/security/advanced-security/secret-protection)

**Verktyg, förstaparts:**

- [gitleaks — standardkonfiguration (`gitleaks.toml`)](https://raw.githubusercontent.com/gitleaks/gitleaks/master/config/gitleaks.toml)
- [gitleaks — README/usage](https://github.com/gitleaks/gitleaks)
- [trufflehog — detektorkatalog](https://github.com/trufflesecurity/trufflehog/tree/main/pkg/detectors)
- [trufflehog — `supabasetoken`-detektor, källkod](https://github.com/trufflesecurity/trufflehog/blob/main/pkg/detectors/supabasetoken/supabasetoken.go)
- [Truffle Security — JWT-detektion med liveness-verifiering](https://trufflesecurity.com/blog/trufflehog-now-detects-jwts-with-public-key-signatures-and-verifies-them-for-liveness)
- [1Password Developer — Load secrets into the environment](https://developer.1password.com/docs/cli/secrets-environment-variables)
- [1Password — Securing MCP servers](https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent)
- [Claude Code — hooks-referens (`hooks.md`)](https://code.claude.com/docs/en/hooks.md)
- [`anthropics/claude-code` issue #29434 (öppen)](https://github.com/anthropics/claude-code/issues/29434)
- [`anthropics/claude-code` issue #39882 (öppen)](https://github.com/anthropics/claude-code/issues/39882)

**Tredjepart, tydligt märkta som komplement:**

- [GitGuardian — Handling secrets at the command line](https://blog.gitguardian.com/secrets-at-the-command-line/)
- [GitGuardian — Supabase Service Role JWT-detektor](https://docs.gitguardian.com/secrets-detection/secrets-detection-engine/detectors/specifics/supabase_service_role_jwt)
- appsecsanta.com, rafter.so, secrails.com — gitleaks-kontra-trufflehog-jämförelser 2026 (tredjeparts branschöversikter, samstämmiga sinsemellan)
- decryptiondigest.com, buildmvpfast.com — GHAS-prisuppgift ($19/säte), ej förstaparts-verifierad

**Internt (detta repo):**

- `docs/research/task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md` — prior art, samma kommando, 2026-08-05
- `docs/decisions/ADR-028-supply-chain-incident-respons.md` — angränsande process-mönster
- `tasks/threads/README.md` (`T34`) — angränsande men annan axel (fel-mål, inte utskrift)
- `scripts/deny-resend-send.sh` — mekanik-mönster återanvänt i rekommendationen
