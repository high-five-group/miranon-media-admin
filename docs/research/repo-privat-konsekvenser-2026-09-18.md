---
owner: marcus803
updated: 2026-09-18
review_by: 2026-12-18
status: draft
---

# Repot privat — varför blev det publikt, och vad kostar det att stänga det (2026-09-18)

> **Vad jag redan hade att stå på.** `docs/decisions/ADR-024-publika-professionalitetssignaler.md`
> och `ADR-076-merge-grinden-ruleset-pr-flode.md` (läst i sin helhet) samt
> `docs/research/ci-djupgranskning-2026-09-17/` (huvudrapport +
> `10-migrations-och-atgardsplan.md` § B3 + `11-evidens-och-osakerhetsregister.md`
> K03–K05, läst riktat). Den granskningen mätte **att** repot är publikt och
> **att** det gör Actions-minuter gratis (K03) — den undersökte aldrig **varför**
> det blev publikt, och den ställde aldrig frågan "vad händer om vi gör det
> privat", eftersom den frågan inte fanns än. Det är alltså den delen av
> underlaget som är nytt i det här passet, inte en omskrivning. Tråden
> `tasks/threads/T171-personuppgifter-i-publikt-repo.md` (status `active`,
> senast rörd 2026-08-23) var den viktigaste enskilda källan för denna
> frågas del B — den är inte åldrad, den är olöst: en färsk `git grep` i dag
> visar att exponeringen den beskrev fortfarande står orörd på `main`.
> Inget av underlaget var för gammalt för att användas rakt av; det som
> saknades var research mot GitHubs och Vercels PRISSÄTTNING, som jag har
> hämtat live i dag (2026-09-18) mot primärkällor, plus egna mätningar mot
> repots faktiska fakturadata.

## Kort svar

**Varför publikt:** ingen nedskriven avvägning finns. Repot skapades
2026-04-13 (`gh repo view --json createdAt`) redan som publikt — första
commiten samma dag. Den första ADR:n som ens nämner publikheten
(`ADR-024`, 2026-05-06) *förutsätter* den redan, den beslutar den inte. Se
del A.

**Vad kostar privat, per månad:** troligen **0–160 kr–dollar i Actions-
minuter** beroende på hur mycket CI körs (formel och mätning i del B),
plus **0, 19, 30 eller 49 dollar** om ni vill köpa tillbaka CodeQL och/eller
hemlighets-skanning (de stängs annars av tyst, utan rött test). Er
Enterprise Cloud-avgift (~21 dollar/månad) **betalas redan i dag** och
ändras inte av detta beslut.

**Vad går sönder dag ett om inget förbereds:** CodeQL och
hemlighets-skanning slås av tyst (ingen röd check, de försvinner bara) om
ni inte köper licens. Dependabots automatiska förhandsgranskningar på
Vercel slutar troligen fungera (en robot kan inte vara medlem i ert
Vercel-team) — det fungerar bara i dag för att repot är publikt. Allt
annat — kön som styr i vilken ordning kod landar (merge queue), skydds-
reglerna på huvudgrenen, `gh`-kommandona — fortsätter oförändrat, eftersom
er organisation redan har den plan (Enterprise Cloud) som krävs.

**Vad som redan är exponerat och INTE går att ta tillbaka:** riktiga namn
och e-postadresser ur Airtable-basen ligger i dag, olösta, i minst 16 filer
på `main` (tråd `T171`, öppen sedan 2026-08-22 — se del B6). Detta är en
HELT SKILD fråga från publikt/privat: att göra repot privat stoppar inga
nya besökare, men det tar inte bort det som redan finns hos alla som redan
klonat, cachat eller sökmotor-indexerat repot. Den frågan bör lösas
oavsett vad ni beslutar om synlighet — och helst före, eftersom en flytt
till privat annars kan ge en falsk känsla av att problemet är löst.

---

## (A) Varför blev repot publikt?

**Fyndet: skälet är inte nedskrivet någonstans som ett avvägt beslut.**

Tidslinjen, byggd på `git log --reverse`, `gh repo view --json createdAt`
och en fulltextläsning av `ADR-024` och `ADR-076`:

1. **2026-04-13 06:02:30 UTC** — repot skapas på GitHub
   (`gh repo view --json createdAt` → `"createdAt":"2026-04-13T06:02:30Z"`).
   Första commiten (`869c7c6c`, "init: projektsetup med CLAUDE.md och
   tasks/") landar samma dag kl 08:02 lokal tid. GitHub tvingar ett
   explicit val (publikt eller privat) vid `gh repo create`/webbformuläret
   — det finns ingen "silent default" att skylla på. **Ingen commit,
   ADR eller sessionsdok från detta datum finns i repot** som förklarar
   valet; det första sessionsdoket som existerar i arkivet är från senare.
2. **2026-05-06** — `ADR-024-publika-professionalitetssignaler.md` skrivs.
   Den öppnar med: *"repot är 11/10 internt ... men 4/10 publikt (ingen CI,
   ingen LICENSE ...)"* — alltså ett konstaterande att repot REDAN är
   publikt, tre veckor gammalt, och att den publika SIDAN av det behöver
   städas upp. ADR:n beslutar `LICENSE`, `CI`, `CODEOWNERS`,
   `CONTRIBUTING.md` etc. — den beslutar aldrig visibility. Frasen
   *"även för privat-projekt"* i beslutstexten syftar på **projektets
   ägarform** (proprietärt, `UNLICENSED`, inte tänkt för extern
   distribution) — inte på GitHub-repots synlighet. De två begreppen
   ("privat projekt" och "privat repo") går lätt ihop vid en snabb
   läsning; de är inte samma sak här.
3. **2026-07-23, korrigerad 2026-07-27** — `ADR-076` är den FÖRSTA platsen
   i repot som kopplar publikheten till en konkret fördel: *"Repot är
   publikt (ADR-024) och User-ägt — rulesets är kostnadsfritt
   tillgängliga; merge queue är det INTE (kräver org-ägt repo)"*.
   Detta citat **felattribuerar** skälet till `ADR-024` (som aldrig beslutat
   visibility) och använder publikheten som en bakgrundsgiven förutsättning
   för att förklara varför merge queue INTE gick att slå på då — inte som
   skälet till att repot en gång blev publikt.
4. **2026-09-17** — `docs/research/ci-djupgranskning-2026-09-17/` (K03)
   mäter att publikheten gör Actions-minuter gratis, och noterar explicit
   att detta var en premiss "ORKESTRERAREN föll (aldrig mätt)" — även den
   granskningen gick alltså tillbaka till en ANTAGEN sanning utan att hitta
   ursprungsbeslutet.

**Dom:** den mest sannolika, men ODOKUMENTERADE, förklaringen är att
repot sattes till publikt som standardval för ett personligt/portfölj-
liknande projekt (i linje med `ADR-024`:s anda av "professionalitets-
signaler" — en publik närvaro signalerar kompetens) snarare än som resultat
av en avvägd kostnads- eller riskanalys. Den ekonomiska fördelen (gratis
Actions-minuter, gratis rulesets på ett då user-ägt repo) upptäcktes och
dokumenterades FÖRST i `ADR-076`, alltså över tre månader efter att valet
redan var gjort — den är en efterhandskonstaterad bonus, inte den
ursprungliga anledningen. **Detta är ett giltigt fynd i sig:** ett beslut
utan nedskrivet skäl går inte att pröva mot nya omständigheter (som Lottas
faktiska användning) på annat sätt än att fatta ett nytt beslut nu.

---

## (B) Vad händer, konkret, om repot görs privat?

### Mätt underlag, direkt mot GitHubs API i dag (2026-09-18)

| Fakta | Värde | Källa |
|---|---|---|
| Synlighet | `PUBLIC`, 0 forkar, 0 stjärnor, 0 watchers | `gh repo view --json visibility,forkCount,stargazerCount,watchers` |
| Organisationens plan | `enterprise`, 1 platsanvänd (`filled_seats`) | `gh api orgs/high-five-group -q .plan` |
| Organisationens övriga repon | 3 st, ALLA privata sedan tidigare: `psionautics`, `marcus-system`, `claude-skills` | `gh api orgs/high-five-group/repos` |
| Actions-minuter augusti 2026 | 76 080 min (Linux 2-core), bruttopris 456,48 USD, **rabatt 456,48 USD, netto 0 USD** | `gh api "/orgs/high-five-group/settings/billing/usage?year=2026&month=8"` |
| Actions-minuter september (1–18) | 32 759 min hittills (samma nettomönster: 0 kr) | Samma endpoint, `month=9` |
| Enterprise Cloud-avgift | Augusti: 4,06 USD (0,194 användarmånader) · September hittills: 11,90 USD (0,567) — **detta betalas redan, oavsett vad ni beslutar här** | Samma faktura, produkt `ghec` |
| Ruleset `main-skydd` | Intakt: `deletion`, `non_fast_forward`, `pull_request`, `required_status_checks`, `merge_queue` — alla aktiva | `gh api repos/.../rulesets/19627609` |
| `security_and_analysis` | `secret_scanning: enabled`, `push_protection: enabled`, `validity_checks: enabled`, `dependabot_security_updates: disabled` | `gh api repos/.../security_and_analysis` |
| CodeQL | Körs som GitHubs "default setup" (ingen egen workflow-fil), språk `actions`+`javascript`+`javascript-typescript`+`typescript`, veckovis + per-PR | `gh api repos/.../code-scanning/default-setup` |
| Dependabot alerts (öppna) | 4 st | `gh api repos/.../dependabot/alerts` |
| Aktiva commit-författare (mänskliga) | **1** — allt går via GitHub-kontot `marcus803`, oavsett vilken lokal git-e-post commiten bär (`marcus@h5gruppen.se` löses om till `marcus803` via GitHubs egen `commits`-API) | `git log` + `gh api repos/.../commits/<sha>` |
| Bot-commiters | `dependabot[bot]` (38 commits), `github-actions[bot]` (7 commits) | `git log --format` |
| GitHub Apps installerade | Endast **Vercel** (`app_id 8329`), `repository_selection: all`. Ingen Claude-app, inga webhooks. | `gh api orgs/high-five-group/installations`, `gh api repos/.../hooks` |
| Runner-typ i alla 7 workflow-filer | `ubuntu-latest` (2-core Linux) — 100 % | `grep runs-on .github/workflows/*.yml` |

### B1 — Actions-minuter: formeln och det ärliga intervallet

**DOKUMENTERAT** (`docs.github.com`, hämtat live i dag): GitHub Enterprise
Cloud inkluderar **50 000 CI/CD-minuter i månaden**, och överskjutande
minuter kostar **0,006 USD/minut** för en 2-core Linux-runner (`ubuntu-
latest`) — exakt den runnertyp repot uteslutande använder. Denna siffra är
inte gissad: den matchar er egen augusti-faktura EXAKT (76 080 min × 0,006
USD = 456,48 USD — precis det belopp GitHub redan har räknat ut och sedan
rabatterat till noll). Priset sänktes "upp till 39 %" från 1 januari 2026
(`github.blog`, ändringslogg 2025-12-16) — den siffra jag citerar här är
alltså redan den NYA, gällande.

**Formel:** `max(0, minuter_per_månad − 50 000) × 0,006 USD`

| Period | Minuter (mätt) | Minuter/månad (projicerat) | Överskott | Kostnad |
|---|---|---|---|---|
| Augusti 2026 (hel månad) | 76 080 | 76 080 | 26 080 | **156,48 USD** |
| September 2026 (18 av 30 dagar) | 32 759 | ≈ 54 598 | ≈ 4 598 | **≈ 27,59 USD** |

**Osäkerhet, öppet deklarerad:** jag kan INTE mäta hur den inkluderade
50 000-kvoten faktiskt beter sig för just er organisationsform (Enterprise
köpt direkt på en organisation, `seats: 0` i planobjektet — en ovanlig
kombination) eftersom ett publikt repo aldrig förbrukar av kvoten oavsett
hur mycket det kör; jag kan bara citera vad prissidan säger gäller för
"Enterprise Cloud". De tre andra repona i organisationen har mätt NOLL
Actions-minuter båda månaderna, så hela kvoten skulle i praktiken vara
tillgänglig för `miranon-media-admin` ensamt.

**September är redan lugnare än augusti** — utan att jag kan avgöra exakt
varför (fler docs-PR:er, färre kod-PR:er, eller att någon redan börjat
komprimera CI). Slutsatsen håller ändå: **kostnaden är verkligt rörlig och
beror på hur mycket CI som körs, inte ett fast pris.** Granskningens egna
lågt hängande frukter för att sänka minutförbrukningen (`10-migrations-
och-atgardsplan.md` § N6, SE1, SE2) ger enligt min beräkning en modest
minskning (SE1 ensam: ~225 färre sviter/19 dagar ≈ 47 timmar ≈ ~4 450
minuter/månad, cirka 6 % av augusti-volymen) — de löser ingen dramatisk
besparing på egen hand, men sänker golvet något och ger dessutom kortare
väntetid som en sidovinst, oavsett synlighets-beslutet.

### B2 — Merge queue, rulesets, CODEOWNERS: **inget går sönder**

Verifierat LIVE i dag mot GitHubs källkod (`gh api
repos/github/docs/contents/data/reusables/gated-features/merge-queue.md`):

> *"Pull request merge queues are available in any public repository owned
> by an organization, or in private repositories owned by organizations
> using GitHub Enterprise Cloud."*

Er organisation är redan Enterprise Cloud. Det var aldrig repots
publikhet som gjorde merge queue tillgänglig (den delen av `ADR-076`
höll fortfarande, men av fel skäl så fort ni väl köpte Enterprise
2026-07-27) — det är organisationens plan, och den plan-frågan är redan
avgjord och betald. Ruleset `main-skydd` (id `19627609`), `CODEOWNERS` och
`required_status_checks` läses direkt ur GitHub-plattformens
organisationsfunktioner och är okopplade till repo-synlighet.

### B3 — CodeQL, hemlighets-skanning, push protection, Dependabot

**DOKUMENTERAT**, citerat verbatim ur `docs.github.com` (hämtat idag):

> *"If you change the visibility of a public repository to private and
> don't pay for Advanced Security, Advanced Security features will be
> disabled for that repository."*
>
> *"All public repositories have access to code scanning, secret
> scanning, and dependency review [gratis]."*

Det som slås av är alltså **inte en röd check** — det är en TYST
avstängning. Ingen PR blir röd av att sakna CodeQL; kontrollen försvinner
bara ur listan. Det är ett tystare, lättare-att-missa läge än ett rött
bygge, och värt att säga rakt ut till Marcus.

GitHub Advanced Security (GHAS) finns inte längre som en produkt — den
delades 2025 i två fristående tillägg (`github.blog` changelog
2025-03-04, `docs.github.com/billing`, hämtat idag):

| Tillägg | Vad det ger | Pris | Källa |
|---|---|---|---|
| **GitHub Code Security** | CodeQL/kodskanning, Copilot Autofix, dependency review | **30 USD/aktiv committer/månad** | `docs.github.com/billing/.../github-advanced-security` |
| **GitHub Secret Protection** | Push protection, hemlighets-skanning över historik, Copilot secret scanning | **19 USD/aktiv committer/månad** | `docs.github.com/.../estimating-the-price-of-secret-protection` ("$19 per active committer") |
| Båda | — | **49 USD/aktiv committer/månad** | Summan av ovan |

**"Aktiv committer" räknas per person, inte per robot** — GitHub
exkluderar uttryckligen GitHub App-bottar (inklusive Dependabot) ur denna
räkning (`docs.github.com`, hämtat idag: *"GitHub App bots are ignored when
calculating license usage"*). Ni har **exakt en** mänsklig aktiv
committer (`marcus803`) mätt över de senaste 90 dagarna. Det betyder att
priset ovan är den FAKTISKA kostnaden för er — inte ett pris som växer
med antalet agent-genererade PR:er (agenterna pushar under samma
GitHub-konto).

**Dependabot alerts/security updates är GRATIS på alla synligheter, alla
planer** (`docs.github.com` + tre samstämmiga tredjepartskällor, ingen
primärkälla motsäger detta) — det är en bas-funktion, inte en del av
Advanced Security. `dependabot_security_updates: disabled` i er
`security_and_analysis`-status i dag är alltså ett medvetet AV-läge ni
redan valt, inte en kostnadsfråga, och ändras inte av att göra repot
privat.

### B4 — Vercel: en risk som är osynlig i dag EFTERSOM repot är publikt

**DOKUMENTERAT** (vercel.com/docs, community.vercel.com, hämtat idag):

> *"Commits on private Git repositories ... will only be deployed if the
> commit author also has access to the respective project on Vercel."*

**MÄTT, direkt konsekvens:** en Dependabot-PR (`#2506`) fick i dag en
GRÖN `Vercel`-check ("Deployment has completed") — men den commiten är
skapad av `dependabot[bot]`, verifierat via `gh api repos/.../commits/<sha>`
(`author_login: "dependabot[bot]"`). Det fungerar ENDAST för att repot är
publikt just nu — Vercels egen dokumentation säger att just den
begränsningen slår till specifikt på PRIVATA repon. Det finns ingen väg
att göra en robot till medlem i ett Vercel-team, så den mest sannolika
konsekvensen är att Dependabot-PR:ers förhandsgranskning på Vercel börjar
misslyckas ("Team access required to deploy") efter en övergång till
privat — en funktionsförlust, inte en kostnad, och den påverkar INTE
merge queue-grinden (`Vercel` är inte en required check i rulesetet;
enda required-checken är `CI Passed or Skipped`).

Marcus egna commits och PR:er (öppnade under kontot `marcus803`, oavsett
vilken lokal git-e-post som står i commiten) fortsätter fungera
oförändrat — `gh api`-verifieringen ovan visar att GitHub redan i dag löser
om `marcus@h5gruppen.se`-commits till kontot `marcus803`.

**Vad jag INTE kunde belägga:** om `github-actions[bot]`s 7 commits (t.ex.
en auto-genererad committ från ett workflow) drabbas på samma sätt. Samma
mekanism (bot-konto, ingen Vercel-teammedlemskap) gör det sannolikt, men
jag har inte hittat en commit av den typen att testa mot i dag.

### B5 — Repots egna länkar och grindar

- **README:s CI-badge** (`.../actions/workflows/ci.yml/badge.svg`) och
  **70 interna referenser i 25 markdown-filer** till
  `github.com/high-five-group/miranon-media-admin/...` (mätt: `git grep -c`).
  `ci.yml`:s ALLTID-PÅ dokumentations-grind kör lychee med `--offline` —
  den gör AL DRIG en riktig HTTP-förfrågan och påverkas alltså inte alls.
- Den enda länkkontroll som faktiskt hämtar sidor live är `nightly.yml`s
  `nightly-links`-jobb, och den skickar redan `token:
  ${{ secrets.GITHUB_TOKEN }}` till `lychee-action`. Verktyget har inbyggt
  stöd för att autentisera GitHub-API-anrop med en sådan token för att slå
  upp bland annat repo- och issue-länkar — och detta workflows egen token
  har läsrättighet till repot självt eftersom det kör INUTI repot.
  **Jag kunde inte belägga**, trots sökning i lycheeverse/lychee:s egen
  dokumentation (404 på den specifika sidan) om detta även täcker en
  ren bild-URL som `/badge.svg` (som inte är en `github.com/ägare/repo/...`-
  sökväg lychee känner igen som ett GitHub-API-anrop) — detta är alltså en
  ÖPPEN OSÄKERHET, inte ett verifierat "det går sönder". Rekommenderad
  verifiering: kör `nightly-links`-jobbet manuellt (`gh workflow run
  nightly.yml`) DIREKT efter en test-övergång till privat, och läs
  resultatet, snarare än att anta.
- Inga webhooks är registrerade på repot (`gh api repos/.../hooks` → tomt).
  Endast Vercels GitHub App är installerad på organisationen
  (`repository_selection: all`) — ingen Claude-app finns installerad
  (en premiss i uppdraget som alltså FÖLL: det finns ingen sådan app att
  oroa sig för).
- `gh`-baserat arbetsflöde (PR, merge queue, `gh api graphql`-svepen)
  fortsätter fungera identiskt — alla dessa autentiserar redan mot GitHub
  med en token som har full åtkomst till repot, oavsett synlighet.
  WebFetch mot repots EGNA `github.com`-sidor (t.ex. att en agent läser en
  PR-diff via webbläsar-hämtning i stället för `gh api`) SKULLE sluta
  fungera för en icke-autentiserad hämtning — men detta repos konvention
  är redan att använda `gh` för allt GitHub-relaterat (`CLAUDE.md`:
  *"För GitHub-URL:er, föredra `gh`-CLI:t"*), så det är en teoretisk risk
  utan mätt praktisk träffyta i dag.

### B6 — Vad som redan är exponerat, och INTE går att ta tillbaka

**Detta är den viktigaste delen av svaret, och den är i grunden OBEROENDE
av om ni gör repot privat eller ej.**

Tråden `T171-personuppgifter-i-publikt-repo.md` (registrerad 2026-08-22,
status `active` — **fortfarande öppen i dag**) dokumenterar att verkliga
personuppgifter ur Airtable-basen — riktiga namn, riktiga e-postadresser,
och en "live-dump" av anmälda med namn och tidsstämpel — ligger committade
på `main` i minst 13 filer. Jag körde en egen, oberoende sökning i dag
(`git grep -n` efter e-postmönster för gmail/hotmail/outlook/yahoo/live/
icloud) och den bekräftar att problemet **inte är löst**:

| Fil | Antal träffar (rader) | Klass |
|---|---|---|
| `docs/reference/data-model.md` | 4 (rad 2305, 2307, 2311, 2315) | Riktiga e-postadresser + namn, citerade som dubblett-/defektbevis |
| `docs/backfill/execute-log.md` | 5 (rad 55, 98, 119, 129, 190) | Riktiga e-postadresser |
| `docs/research/datamodell-research/02-live-state.md` | 3 (rad 623, 624, 627) | **Live-dump-tabellen T171 pekar ut** — orörd sedan filen skrevs 2026-05-15, alltså FÖRE T171 ens registrerades |
| `docs/reference/testkonton.md` | 2 (rad 23, 47) | Riktig e-postadress (Marcus egen, dubbelroll test/riktig deltagare) |
| `docs/reference/schema_reference.md` | 1 (rad 1888) | Riktig e-postadress i ett exempel-JSON-utdrag |
| `docs/BUILD-LOG.md` | 2 (rad 3345, 3365) | Maskad e-post (redan pseudonymiserad delvis) |
| `tasks/sessions/archive/2026-07/2026-07-08-session-60.md` | 11 rader | Riktiga e-postadresser, forensik-sessionen som upptäckte dubblett-buggen |
| Ytterligare 9 filer (sessionsdok, trådar, todo.md) | 1–3 rader vardera | Samma klass |

**Jag skriver INTE ut namnen eller adresserna här** (uppdragets krav) —
bara fil, rad och klass, precis som T171 själv gör i sin egen tabell.

**Skillnad mellan HEMLIGHET och IDENTIFIERARE (uttrycklig prövning):**

- **HEMLIGHET (måste hanteras som ett dataskyddsärende, oavsett
  synlighet):** de riktiga namnen och e-postadresserna ovan. Det är
  personuppgifter om Lottas kunder/deltagare, inte om systemet. Ingen
  sökning hittade klassiska API-nycklar (`sk_live_`, `AKIA...`,
  PEM-nycklar, `service_role`-nycklar) i tracked filer — secret scanning +
  push protection (redan aktiva) verkar ha gjort sitt jobb för DEN
  klassen. Det som saknas skydd för är namn/e-post i FRI TEXT, som ingen
  mönstermatchning fångar.
- **IDENTIFIERARE (inte hemligt i sig, men kartlägger systemet):**
  `.env.staging`/`.env.development` är TRACKADE (trots att `.gitignore`
  har `.env*`) och innehåller Supabase-URL:er och en `anon`-nyckel i
  klartext — men detta är ett **medvetet, ADR-beslutat val** (`ADR-061`),
  inte en miss: Supabase `anon`-nycklar är designade för att vara publika
  och skyddas av databasens RLS-policyer (Row Level Security), inte av
  hemlighållande. Samma sak gäller Airtable-bas-ID:n (145 filträffar) och
  `.prod-ref-policy.conf`s Supabase-projekt-ref: identifierare som avslöjar
  VILKET system som är prod, men som inte ensamma ger åtkomst.

**Vad som INTE går att ta tillbaka genom att flippa en inställning**
(citerat verbatim ur `docs.github.com/.../setting-repository-visibility`,
hämtat idag):

> *"Public forks are not made private."* (0 forkar idag — moot, men
> notera för framtiden)
>
> *"Stars and watchers for this repository will be erased."* (0 av vardera
> idag)
>
> *"GitHub will no longer include the repository in the GitHub Archive
> Program"* [från och med bytet — redan skedda ögonblicksbilder rörs inte]

Utöver GitHubs egen text: **Software Heritage**, ett oberoende
källkodsarkiv, tar egna, oberoende ögonblicksbilder av publika repon och
tar INTE automatiskt bort dem när originalet blir privat (deras egen
dokumentation, `docs.softwareheritage.org`: borttagning kräver en
manuell, godkänd "takedown"-begäran — det sker inte av sig självt). **Jag
kunde inte verifiera** om just detta repo faktiskt finns i Software
Heritages arkiv (deras API blockerade min automatiserade förfrågan med
ett bot-skydd) — det går att kontrollera manuellt på
`archive.softwareheritage.org` genom att söka på repots URL. Detsamma
gäller GitHubs eget `gharchive.org`-projekt och vanlig sökmotor-cachning
(Google m.fl.): dessa är strukturellt utanför GitHubs kontroll och
utanför vad en synlighetsändring kan påverka.

**Den praktiska slutsatsen:** om syftet med att gå privat delvis är att
skydda Lottas deltagares personuppgifter, löser det INTE det problemet för
allt som redan finns på `main` och i historiken idag — bara för
NYTT innehåll och för nya, oautentiserade besökare. T171:s
pseudonymiseringsarbete (punkt 1–3 i tråden) är den enda åtgärden som
faktiskt adresserar den risken, och den är oberoende av dagens fråga.

---

## Förberedelselista (i ordning)

**FÖRE omställningen (kan göras nu, av en agent, utan att röra
synligheten):**

1. **Behandla `T171` som egen, mer akut fråga** — pseudonymisera de
   ≥ 16 filerna (namn → stabil pseudonym, e-post → maskad form
   `X***@domän`), särskilt live-dump-tabellen i
   `docs/research/datamodell-research/02-live-state.md`. Detta skyddar
   Lottas deltagare oavsett vad ni beslutar nedan, och gör beslutet om
   synlighet renare (det blandas inte längre ihop med en akut
   dataskyddsfråga).
2. **Bestäm om ni vill köpa `GitHub Code Security` (30 USD/månad) och/eller
   `GitHub Secret Protection` (19 USD/månad)** för att behålla CodeQL och
   hemlighets-skanning aktiva efter övergången. Med en (1) aktiv mänsklig
   committer är kostnaden låg och förutsägbar. Om ni avstår: CodeQL och
   push protection stängs AV TYST — bra att veta i förväg, inte upptäcka
   efteråt.
3. **Verifiera att organisationen har en registrerad betalmetod** för
   Enterprise Clouds mätta fakturering (`netAmount` är 0 i dag EFTERSOM
   repot är publikt — det är inte samma sak som "inget kort behövs"; en
   privat övergång kan börja generera en verklig faktura omedelbart).
4. *(Valfritt, låg brådska)* Implementera CI-minutreduktionerna
   `docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md`
   § N6/SE1/SE2 — sänker minutförbrukningen något (uppskattningsvis
   enstaka tior av procent, se B1) och ger dessutom kortare väntetid som
   sidovinst. Kräver Marcus GO per den planens egen rekommendation.

**I SAMMA STUND (Marcus eget klick — ingen agent gör detta):**

1. GitHub → repots `Settings` → `General` → `Danger Zone` → `Change
   repository visibility` → `Private`, bekräfta genom att skriva repots
   namn. (`has_pages: false` är redan verifierat, så GitHub Pages-varningen
   är irrelevant här.)

**EFTER omställningen (verifiera, inom samma dag):**

1. `gh repo view high-five-group/miranon-media-admin --json visibility` →
   ska visa `PRIVATE`.
2. `gh api repos/high-five-group/miranon-media-admin -q .security_and_analysis`
   → se om `secret_scanning`/`code_scanning` flippat till `disabled`; om
   ni köpte licens (punkt 2 ovan) ska de fortsatt vara `enabled`.
3. Öppna eller vänta in nästa Dependabot-PR, kör `gh pr checks <nr>` och
   läs `Vercel`-raden. Blir den röd ("Team access required to deploy") är
   det den förväntade, dokumenterade konsekvensen (B4) — inget att felsöka,
   ett beslut att fatta (acceptera ingen preview för Dependabot-PR:er,
   eller hitta en annan väg).
4. Kör `gh workflow run nightly.yml` manuellt och läs resultatet av
   `nightly-links`-jobbet — det är det enda stället en trasig
   självreferens (README-badge, interna länkar) skulle synas (B5).
5. Skapa en vanlig PR och verifiera att den går igenom merge queue som
   vanligt (B2) — förväntat: ingen skillnad.
6. Vid nästa faktureringscykel: `gh api
   "/orgs/high-five-group/settings/billing/usage"` och jämför verklig
   kostnad mot formeln i B1.

---

## Alternativ till "allt privat"

| Alternativ | Vad det skyddar | Vad det kostar | Kommentar |
|---|---|---|---|
| **1. Gör allt privat** (frågans utgångspunkt) | Nya besökare kan inte längre klona/läsa/söka repot | 0–160 USD/månad Actions (B1) + 0–49 USD/månad säkerhetstillägg (B3) + Dependabot-Vercel-friktion (B4) | Löser INTE B6 (redan exponerad persondata) |
| **2. Behåll publikt, men lös `T171` fullt ut + granska vad som fortsatt får committas i fritext** | Den faktiska risken (personuppgifter), utan att röra CI-ekonomin alls | Lågt — pseudonymiserings-arbete, ingen ny löpande kostnad | Löser INTE att koden/arkitekturen/driftmönstren förblir läsbara för alla — men det är en annan sorts risk än personuppgifter |
| **3. Privat + minska CI-förbrukningen först** (N6/SE1/SE2, ev. fler CI-redundans-fixar ur granskningen) | Samma som (1), men med lägre löpande Actions-kostnad | Låg utvecklingskostnad, modest besparing (~6–30 % av augusti-volymen enligt min beräkning — inte en lösning i sig) | Bäst kombinerat med (1), inte ett alternativ på egen hand |
| **4. Dela repot: publikt kod-repo + privat "drift/session"-repo** (sessionsdok, ADR:er, backlog, lessons i ett separat privat repo) | Renaste separationen — koden förblir en portfölj-tillgång, det mest persondata- och processdata-täta innehållet blir privat | HÖGT engångsarbete: git-historik-kirurgi, och hela detta samarbetssystem (backlog-CLI, review-loop, `check:docs`, ADR-korsreferenser) förutsätter i dag EN repo-rot — omfattande omkoppling av skript och sökvägar | Inte undersökt i detalj i detta pass (utanför frågans scope); nämns här som den strukturellt renaste men dyraste vägen |

**Ingen rekommendation ges här om VILKET alternativ — bara vad vart och
ett faktiskt kostar och skyddar**, per uppdragets instruktion. Om jag ändå
ska peka på en sak: alternativ 2 (lös `T171`) är inte ett ALTERNATIV till
de andra — det är en förutsättning som håller oavsett vilket av 1/3/4 ni
väljer.

---

## Öppna frågor till Marcus

1. Vill ni köpa `GitHub Code Security` och/eller `GitHub Secret
   Protection` för att behålla CodeQL/hemlighets-skanning efter en
   övergång till privat (0/19/30/49 USD/månad), eller acceptera att de
   stängs av?
2. Är det uttalade syftet med "privat" delvis att skydda Lottas
   deltagares personuppgifter? Om ja: `T171` bör lösas FÖRE eller SAMTIDIGT,
   inte efteråt — annars uppstår en falsk trygghetskänsla.
3. Finns en registrerad betalmetod på organisationens Enterprise Cloud-
   konto redan i dag (jag kunde inte se detta via `gh api`)?
4. Ska Dependabots uteblivna Vercel-förhandsgranskningar (B4) accepteras,
   eller ska något byggas för att kompensera (t.ex. manuell trigger,
   eller att någon i Vercel-teamet re-pushar Dependabots ändringar under
   sitt eget konto)?

## Vad jag inte kunde belägga

- **Verktyget `lychee`/badge-frågan (B5):** om `nightly.yml`s redan konfigurerade
  `GITHUB_TOKEN` räcker för att fortsätta verifiera README:s CI-badge-URL
  och de 70 interna `github.com`-länkarna efter en övergång till privat.
  Lycheeverse/lychee:s specifika dokumentationssida för detta gav 404 vid
  hämtning idag; jag fann bara allmänna beskrivningar av tokenets syfte
  (highere rate limits + GitHub-API-baserad länkverifiering), inte en
  bekräftelse för just badge-SVG-ändpunkter.
- **50 000-minuters-kvotens exakta räckvidd** för en organisation som köpt
  Enterprise Cloud direkt (utan ett separat "Enterprise account" som
  paraply för flera organisationer) — dokumenterat att kvoten finns, inte
  mätbart i dag eftersom ett publikt repo aldrig förbrukar av den.
- **Software Heritage-arkivering av just detta repo** — deras eget
  API blockerade min hämtning med ett bot-skydd (Anubis). Går att
  kontrollera manuellt på `archive.softwareheritage.org`.
- **`github-actions[bot]`s 7 commits mot Vercel** — samma mekanism som
  Dependabot (B4) gör en blockering sannolik, men jag hittade ingen
  konkret commit av den typen att pröva mot idag.
- **Exakt varför september har lägre CI-minutförbrukning än augusti** —
  jag har inte spårat detta till en specifik ändring; det kan vara färre
  kod-PR:er, redan påbörjad minutreduktion, eller ren volatilitet.

## Källor

<!-- vale Vale.Terms = NO -->

- GitHub, egen platt­form, hämtat 2026-09-18 (samtliga `gh api`/`gh repo
  view`-anrop ovan är körda direkt mot `high-five-group/miranon-media-admin`
  och organisationen `high-five-group` idag; exakta kommandon i löptexten).
- [github.com/github/docs — `merge-queue.md`-fragmentet](https://github.com/github/docs/blob/main/data/reusables/gated-features/merge-queue.md) — hämtat via `gh api repos/github/docs/contents/...` idag, citerat verbatim i B2.
- [docs.github.com — Setting repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) — citerat verbatim i B6.
- [docs.github.com — GitHub Advanced Security license billing](https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security) — citerat i B3.
- [docs.github.com — Estimating the price of Secret Protection](https://docs.github.com/en/code-security/securing-your-organization/understanding-your-organizations-exposure-to-leaked-secrets/estimating-the-price-of-secret-protection) — pris 19 USD/committer, B3.
- [github.blog — Introducing GitHub Secret Protection and GitHub Code Security (2025-03-04)](https://github.blog/changelog/2025-03-04-introducing-github-secret-protection-and-github-code-security/) — uppdelningen av GHAS, B3.
- [github.blog — Coming soon: simpler pricing for GitHub Actions (2025-12-16)](https://github.blog/changelog/2025-12-16-coming-soon-simpler-pricing-and-a-better-experience-for-github-actions/) — prissänkning från 2026-01-01, B1.
- [docs.github.com — GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) — per-minut-tabell (0,006 USD Linux 2-core), 50 000 min/Enterprise Cloud, B1.
- [github.com/pricing](https://github.com/pricing) — 21 USD/användare/månad Enterprise Cloud (rabatterat första 12 mån), 50 000 min, B1.
- [vercel.com/docs — Deploying Git Repositories with Vercel](https://vercel.com/docs/git) samt [community.vercel.com — Deploy Hooks blocked if commit author not in Vercel team](https://community.vercel.com/t/deploy-hooks-now-blocked-if-commit-author-not-in-vercel-team/41348) — B4.
- [docs.softwareheritage.org — Takedown notices](https://docs.softwareheritage.org/sysadm/mirror-operations/takedown-notices.html) — B6.

<!-- vale Vale.Terms = YES -->
- Interna: `docs/decisions/ADR-024-publika-professionalitetssignaler.md`, `docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md`, `docs/decisions/ADR-061` (nämnd via `.env`-kommentarer), `tasks/threads/T171-personuppgifter-i-publikt-repo.md`, `docs/research/ci-djupgranskning-2026-09-17/` (huvudrapport, `10-migrations-och-atgardsplan.md`, `11-evidens-och-osakerhetsregister.md`).
