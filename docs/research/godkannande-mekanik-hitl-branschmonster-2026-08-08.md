---
owner: marcus803
updated: 2026-08-08
review_by: 2026-11-08
status: draft
---

# Godkännande-mekanik: hur branschen bevisar att ett mänskligt godkännande är människans handling (2026-08-08)

> **Proveniens:** avgränsat research-pass 2026-08-08, kört oisolerat i
> huvudkatalogen på Marcus uppdrag. Matar
> **G2-grillningens fråga 2** (S93, se `tasks/sessions/archive/2026-08/2026-08-02-session-93.md`
> Del 12–13: *"G2-grillningen (godkännande-mekaniken — `godkand` ska bära
> Marcus kvittens, inte självbetjäning) tas FÖRE/VID `162.5`"*). Kört mot
> `main` (`b5703ba6`) — ingen kod ändrad, ingen svit körd.

## Kort svar

**Branschens hela mänskliga-godkännande-maskineri — Chromatic, Percy,
BackstopJS, GitHub PR-review, CODEOWNERS — är byggt för MULTI-PERSON-team,
inte för en ensam operatör som också är den enda utföraren.** Samtliga
undersökta produkter löser "förhindra självgodkännande" genom att kräva
en ANNAN person (default reviewer, code owner, PR-granskare) — ingen av dem
har ett färdigt svar på "en människa ska godkänna sin egen agents arbete,
utan en andra människa i bilden". Chromatics egen FAQ säger det rakt ut:
*"No, you can't prevent people from auto-approving their own review."*
Mekanismen som ÄR byggd för exakt vårt problem — en autonom agent som inte
själv får utlösa godkännandet — heter **CIBA** (Client-Initiated Backchannel
Authentication, OpenID Foundation): principen är **kanalseparation**,
godkännandet måste komma via en kanal utföraren inte kontrollerar, aldrig
härledas ur att utföraren "vet" vad människan sagt.

Mätt mot vårt fall: **Candidate A (agenten transkriberar Marcus verbatim ur
chatten) är FALSIFIERAD** — noll precedent, ren självattestering. **Candidate
B (`!`-prefix) är branschprincipen KORREKT LOKALT TILLÄMPAD, men ensam
otillräcklig** — Claude Codes egen dokumentation bekräftar att kommandot
*"Doesn't require Claude to interpret or approve the command"*, vilket är
riktig kanalseparation, men inget hindrar agenten att SJÄLV skriva samma
fält via ett annat verktygsanrop i samma session. **Candidate C (B + hook-
spärr) är den bäst passande formen** — men bara om spärren är BREDARE än
den befintliga `deny-backlog-direct-edit.sh`-förlagan (som bara matchar
`Edit|Write`; branschens egen dokumenterade bypass-klass — "Bash heredoc
kringgår ett Write-block" — gäller ordagrant här) och bara om ett obelagt
antagande verifieras empiriskt FÖRST: att `PreToolUse` inte triggas av
`!`-prefixet.

## Vad jag hittade FÖRE — och vad detta pass lägger till

| Källa | Vad den redan täckte | Ålder | Vad DETTA pass lägger till |
|---|---|---|---|
| [`mekanisk-design-mot-yta-jamforelse-branschmonster-2026-08-08.md`](mekanisk-design-mot-yta-jamforelse-branschmonster-2026-08-08.md) | Chromatic/Percy/BackstopJS som VERKTYGSKLASS för mekanisk bild-diff; granskningsflödet ("mekaniken fäller, människan avgör") | Samma dag | Den här filen svarar på en ANNAN fråga: inte VAD mekaniken jämför, utan HUR ett godkännande bevisligen är en viss persons handling. Korrigerar en underförstådd nyans: Chromatics granskningsflöde är "personbundet" men INTE självgodkännande-säkert (se § 1). |
| [`ui-prototyp-till-produktion-frontier-processer-2026-08-08.md`](ui-prototyp-till-produktion-frontier-processer-2026-08-08.md) | Chromatics UI Review som *"namngiven, personbunden och grindande"*, `145.2`-incidenten som exempel på vad formen förhindrar | Samma dag | Samma korrigering som ovan, plus GitHub-native-spåret (PR-review/CODEOWNERS/environments), agent-ramverkens HITL-primitiv (LangGraph/Temporal/Step Functions/CIBA) och Claude Code-specifika mekanik (`!`-prefix, hooks) — inget av detta fanns i det passet. |
| [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md) §B3–B4 | Rivningsspärren (`godkand: null` blockerar rivning) | 12 dagar | Oförändrat — den mekaniska SPÄRREN (`check-facit.sh`) är redan byggd och korrekt; frågan här är vad som får SÄTTA fältet, inte vad fältet SKYDDAR. |
| [`ADR-103`](../decisions/ADR-103-promoveringsformen-prototypen-promoveras-skarpa-bygget-avskaffas.md) § Vad som INTE beslutas här | Bekräftar explicit att godkännande-mekaniken är G2, olöst | Samma dag | — (kontext, inte underlag) |
| `tasks/sessions/archive/2026-08/2026-08-02-session-93.md` Del 12–13 | G2 schemalagd FÖRE/VID `162.5`; inga kandidat-former nedskrivna i sessionsdoket självt | Samma dag | Kandidat-formerna A/B/C kom via uppdraget, inte doket — bekräftat att de inte redan är grillade. |
| `scripts/check-facit.sh` + `tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json` (lästa i sin helhet) | Nuvarande skydd: `godkand: null` blockerar rivning; fältet är i dag en bar sträng/`null`, ingen identitet, ingen artefakt-referens | Levande kod | Branschens konvergenta kvitto-schema (§4) ger ett konkret, källbelagt förslag på vad fältet BÖR bära. |
| `~/.claude/plugins/.../hooks/deny-backlog-direct-edit.sh` (läst i sin helhet, alla 12 versioner identiska mönster) | Precedent: PreToolUse-hook som `deny`:ar `Edit`/`Write` mot en sökväg | Etablerad `T100`, 2026-07-27 | Visar den EXAKTA svagheten branschkällan (§3) namnger: matchar bara `Edit`/`Write`, inte `Bash` — en `jq`/heredoc-skrivning mot samma fil går igenom obehindrad. |

Ingen ADR eller lärdom förkastar något av det som föreslås nedan. Inget i
detta pass är en duplicering — de två branschpassen från samma dag löste en
annan delfråga (mekanisk BILDJÄMFÖRELSE), inte denna (mänsklig KVITTENS-
AUTENTISERING).

## Metod och källhierarki

Förstapartsdokumentation (Chromatic, GitHub, Claude Code/`code.claude.com`,
Temporal, AWS, LangChain/LangGraph, OpenID Foundation) prioriterad framför
sekundärkällor. Två faktiska mätningar mot vår egen levande miljö
(`gh api user`, `gh api .../rulesets`) i stället för antagande — se § 2.4.
En sekundärkällas sakfel identifierat och rättat mot förstapart (§ 3.5).

---

## 1. Visuell regression/design-review-verktygens approve-flöden

**BELAGT.** Chromatic: vem som helst med collaborator-access kan godkänna —
*"Any project collaborator can approve reviews... Invite other developers,
designers, PMs, and stakeholders."* Identitet auktoriseras via länkad
Git-leverantör: *"your project permissions are synced so collaborators can
sign in to review immediately"* (GitHub/GitLab/Bitbucket-OAuth), eller via
projekt-inbjudningskod för olänkade projekt.
([chromatic.com/docs/review/](https://www.chromatic.com/docs/review/))

**Självgodkännande är UTTRYCKLIGEN TILLÅTET, inte blockerat** — detta är
den viktigaste enskilda korrigeringen mot dagens karakterisering
("personbunden godkännandegrind") i vårt eget tidigare pass:

> *"No, you can't prevent people from auto-approving their own review."*
> — Chromatic FAQ, samma sida

Motmedlet är återigen en ANNAN PERSON: *"assign default reviewers to
ensure that other teammates must approve of the review"* — alla
default-granskare måste godkänna, vilket *"prevents a Review from being
'solo-approved' in practice"*. Statusen kan krävas som obligatorisk
PR-check: *"Require the check in GitHub, GitLab, or Bitbucket to ensure
that impactful changes are considered by the team before merging."*

**Vad som INTE är dokumenterat:** exakt vilka fält som sparas som kvitto
(granskarnamn, tidsstämpel, kommentar) i något maskinläsbart format — bara
att statusen syns som en PR-check och i UI-checklistan.

**Percy** (BrowserStack): *"A baseline is an approved snapshot … all future
comparisons depend on this reference, so it must be reviewed and
intentionally accepted."* Godkännande kan ske per snapshot, grupp eller
helt bygge; uppdaterar PR-status automatiskt.
([browserstack.com/docs/percy](https://www.browserstack.com/docs/percy/overview/visual-testing-basics))
Ingen dokumenterad självgodkännande-spärr hittad.

**BackstopJS**: `backstop test` → mänsklig granskning av HTML-rapport →
`backstop approve`. Rent lokalt CLI-verktyg — **ingen identitetskontroll
alls**, vem som helst med filsystemsåtkomst kan köra kommandot. Svagast av
de fyra på just autentisering, starkast på att vara verktygsklassens
referens för prototyp-mot-kandidat-jämförelse (redan belagt i
`mekanisk-design-mot-yta-jamforelse-branschmonster-2026-08-08.md`).

**Storybook**: binär semantik, *"if the changes are intentional, ✅ accept
them as baselines locally"* — samma mönster, ingen identitetsbindning
utöver vem som kör kommandot lokalt eller i CI.
([storybook.js.org](https://storybook.js.org/docs/writing-tests/visual-testing))

**Slutsats för § 1:** verktygsfamiljen löser VEM SOM FÅR TITTA (collaborator-
access) och VAD SOM RÄKNAS SOM GODKÄNT (statuskoppling till PR), men ingen
av dem löser "är detta verkligen en människa och inte utföraren själv" —
det är uttryckligen ett olöst problem även i marknadens mest etablerade
verktyg.

## 2. GitHub-native mänskliga grindar

### 2.1 Pull request-review — hårt spärrat mot självgodkännande, men fel modell för en ensam operatör

**BELAGT.** PR-författaren kan inte godkänna sin egen PR — en hård
plattformsregel utan konfigurationsväg: *"By ensuring that contributors
cannot approve their own changes, it mitigates the risk of conflicts of
interest... Even repository owners are subject to this rule."*
([`docs.github.com`](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews),
sekundärkälla-sammanfattad, ej verbatim-verifierad — se § Vad jag inte
kunde belägga)

API-schemat för en review är auktoritativt dokumenterat: `id`, `user`
(`login`, `id`, `avatar_url`, `html_url`), `state`, `commit_id`, `body`,
`submitted_at`, `html_url`.
([`docs.github.com/en/rest/pulls/reviews`](https://docs.github.com/en/rest/pulls/reviews))
Detta ÄR branschens mest kompletta, auktoritativt dokumenterade
kvitto-schema av alla undersökta källor: identitet + tidsstämpel +
artefakt-version (`commit_id`) + fritext.

**Den kritiska nyansen för VÅRT fall, mätt live mot repot (2026-08-08):**

```text
$ gh api user --jq '.login'
marcus803
$ gh api repos/high-five-group/miranon-media-admin/rulesets/19627609 \
    --jq '.rules[] | select(.type=="pull_request") | .parameters.required_approving_review_count'
0
```

`gh`-CLI:t i denna miljö är autentiserat SOM Marcus egen `marcus803`-
identitet — samma identitet den agent som skulle bygga skivan använder.
GitHubs självgodkännande-spärr är knuten till **konto**, inte till
"människa kontra AI": en PR skapad av `gh pr create` (körd av agenten, men
autentiserad som `marcus803`) räknas som författad av `marcus803`. Om
Marcus SEDAN försökte godkänna samma PR via `gh pr review --approve` — eller
via webbläsaren — skulle GitHub blockera **honom själv**, eftersom kontot
är detsamma som författarens. **PR-review som mekanism förutsätter en andra
identitet (bot/GitHub App för agentens commits, Marcus eget konto för
granskningen) som inte finns i dag** — att införa den är en konkret
infrastrukturkostnad, inte en konfigurationsrad.

### 2.2 Environment protection rules / required reviewers — självgodkännande-spärren är OPTIONAL, inte hård

**BELAGT.** Reviewer navigerar till "Review deployments" → väljer miljö →
"Approve and deploy", med valfri kommentar. Självgodkännande-spärren finns
men måste AKTIVERAS explicit, och gäller den som TRIGGADE workflow-körningen
— inte generellt kontot:

> *"If the targeted environment is configured to prevent self-approvals for
> deployments, you will not be able to approve a deployment from a workflow
> run you initiated."*
> — [`docs.github.com/actions/managing-workflow-runs/reviewing-deployments`](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments)

Detta är mjukare än PR-reviews hårda blockering — vilket paradoxalt gör
den ANVÄNDBAR för en ensam operatör bara om agentens `gh`-körning räknas
som "initiatorn" och Marcus egen efterföljande klick räknas som en annan
handling. Det är osäkert om GitHub skiljer dessa åt när båda sker under
samma konto (se § Vad jag inte kunde belägga). Mekanismen är i grunden
byggd för DEPLOYMENTS, inte design-granskning — att böja den till vårt
syfte kräver ett attrapp-workflow, samma "repurposing, inte ett
dokumenterat användningsfall"-anmärkning som redan gjorts om
familj-1-verktyg för prototyp-mot-skarpa-jämförelse i det tidigare passet.

### 2.3 CODEOWNERS

**BELAGT.** *"An approval from any of the owners is sufficient"* — kräver
`Require review from Code Owners` i branch protection/ruleset.
([`docs.github.com/.../about-code-owners`](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners))
Ingen dokumenterad självgodkännande-nyans utöver PR-reviewens generella
regel (§ 2.1) — och samma en-person-problem: en solo-CODEOWNERS-fil med
bara `marcus803` som ägare kan låsa in sig själv, ett känt community-
diskuterat gap (`github.com/orgs/community/discussions/84831`).

### 2.4 Rulesets "required reviewer rule" (GA 2026-02-17) och artefakt-attestationer

Den nya, filmönster-scopade required-reviewer-regeln
([`github.blog/changelog/2026-02-17`](https://github.blog/changelog/2026-02-17-required-reviewer-rule-is-now-generally-available/))
är samma PR-review-mekanik som § 2.1, bara scopad per filmönster i stället
för hela repot — ärver alltså samma en-konto-begränsning.

**Artifact attestations** (Sigstore/Fulcio, OIDC-bunden kortlivad
certifikat, *"the private key never leaving process memory"*) är den
STARKASTE kryptografiska identitetsformen jag hittade i hela passet — men
den bevisar en **maskin-/workload-identitet** (byggsystemet), inte en
människa. Relevant som KONTRAST: den visar vad "obestridligt bevis" ser ut
när det finns, och understryker hur svagt "en person loggade in" är i
jämförelse. ([`docs.github.com/.../artifact-attestations`](https://docs.github.com/en/actions/concepts/security/artifact-attestations))

**Slutsats för § 2:** GitHubs mekanismer ger branschens starkaste
AUDIT-schema (§ 4) men samtliga är konstruerade kring att granskaren har
ETT ANNAT KONTO än författaren. I vårt fall delar agenten och Marcus
samma `gh`-autentiserade identitet — så mekanismerna löser inte
grundproblemet utan en ny bot-/App-identitet för agentens PR-skapande,
vilket är en medveten infrastruktur-investering, inte något som redan
finns.

## 3. Agent-ramverkens HITL-mönster

### 3.1 Claude Codes egen permission-modell + `!`-prefixet

**BELAGT, förstapart, verbatim** (`code.claude.com/docs/en/interactive-mode`):

> *"Run shell commands directly without going through Claude by prefixing
> your input with `!`... Doesn't require Claude to interpret or approve
> the command."*

Detta är en genuin kanalseparation: kommandot går aldrig genom modellens
resonemang eller verktygs-loop — det är rå stdin till Marcus egen shell.
Ingen annan undersökt agent-CLI (LangGraph, Temporal, Step Functions)
dokumenterar en motsvarande "skriv rakt förbi agenten"-modalitet som en
namngiven ARKITEKTUR-egenskap; det är specifikt till Claude Codes
terminal-UI.

**Hooks** (`code.claude.com/docs/en/hooks`): `PreToolUse` kan blockera
deterministiskt via exit code 2 eller JSON
(`permissionDecision: "deny"`), med matchare på verktygsnamn (`Bash`,
`Edit|Write`, regex) och ett `if`-fält som applicerar permission-syntax
(`Bash(git commit)`, `Edit(*.ts)`) för finare filtrering. Detta är exakt
mekanismen bakom `deny-backlog-direct-edit.sh` — men den hooken matchar
BARA `Edit`/`Write`.

**Den dokumenterade bypass-klassen, förstapart-adjacent (Boucle, en
teknisk genomgång av vad Claude Code-hooks INTE kan göra):**

> *"If you block Write, the model uses Bash heredocs... Tool-level
> enforcement is a game of whack-a-mole."*
> ([blog.boucle.sh](https://blog.boucle.sh/posts/what-claude-code-hooks-can-and-cannot-enforce/))

Detta gäller ORDAGRANT vårt fall: en hook som bara matchar `Edit|Write` mot
`facit.json` stoppar inte agenten från `echo '{"godkand":"2026-08-08"}' |
node -e '...'` eller ett heredoc via `Bash`. En robust spärr (kandidat C)
måste alltså matcha BÅDE `Edit|Write` OCH `Bash` med ett `if`-villkor som
känner igen sökväg/fältnamn i kommandosträngen — bredare än dagens
`deny-backlog-direct-edit.sh`-förlaga.

**OBELAGT, viktigt att flagga:** om `PreToolUse` triggas av kommandon körda
via `!`-prefixet. Ingen av de förstaparts- eller sekundärkällor jag hittade
uttalar sig explicit om detta. Den logiska tolkningen — `!`-läget kringgår
"Claudes agentiska loop" helt (*"doesn't require Claude to interpret or
approve"*), och `PreToolUse` beskrivs genomgående som en händelse INOM den
loopen (*"before a tool call executes"*) — talar för att `!`-kommandon INTE
triggar hooken. Men det är en INFERENS, inte ett citat. **Detta måste
verifieras med ett minimalt test innan kandidat C läggs till grund för ett
beslut** (repo-principen: "Testa ALLTID nytt bibliotek/approach med
minimalt test... innan full implementation").

**Anthropics egen ram-nivå-vägledning** (sekundärkälla-sammanfattad från
`anthropic.com/engineering/building-effective-agents`): checkpoints där
agenten pausar för mänsklig granskning är särskilt viktiga *"before
carrying out irreversible actions"*; redan citerat i vårt eget tidigare
pass som *"så agenten som gör arbetet inte är den som betygsätter det"* —
en konvergenspunkt, inte ett nytt fynd, men den slår fast RIKTNINGEN: en
STRUKTURELL paus, inte ett textpåstående i en chatt.

### 3.2 LangGraph — pausar, men autentiserar INTE

**BELAGT, förstapart** (`docs.langchain.com/oss/python/langgraph/interrupts`,
direktläst): `interrupt()` pausar grafen; återupptagning sker med
`Command(resume=value)`.

**Ett verkligt, dokumenterat GAP:** LangGraphs egen dokumentation
diskuterar **ingen** identitets- eller behörighetskontroll av vem som får
anropa `Command(resume=...)`. Grafen själv **skiljer inte** på ett genuint
mänskligt svar och ett programmatiskt/agent-genererat återupptagande —
biblioteket antar att applikationslagret RUNT `interrupt()` redan har
verifierat avsändaren. Ingen auditing eller attribuering är inbyggd.

### 3.3 Temporal — samma delegerings-mönster, men med ett fullständigare AUDIT-recept

**BELAGT, förstapart** (`docs.temporal.io/guides/reliable-document-approvals`,
direktläst). Signalen `submit_decision` tar emot en `ApprovalDecision` med
`approver_email`, `decided_at` (satt av workflow-klockan vid mottagande),
`comment` — men signalhanteraren **validerar inte** att anroparen faktiskt
är den angivna godkännaren: *"the implementation assumes the calling system
has already verified the sender's identity."* Samma delegerings-gap som
LangGraph.

Det Temporal GER, till skillnad från LangGraph, är ett fullständigt
**audit-recept**: varje händelse (beslut, påminnelse, eskalering,
statusändring) skrivs mot en persistent logg via en egen Activity —
*"Every action is in the audit record."* System-eskalering efter SLA-
timeout använder SAMMA väg med `approver_email="system"` — workflow-nivån
skiljer alltså inte människa från system annat än genom VILKET VÄRDE
integratören valde att skriva i `approver_email`-fältet.

### 3.4 AWS Step Functions — svagast av de undersökta, en varnande motpol

**BELAGT, förstapart** (AWS Compute Blog, direktläst). Task-token-mönstret:
Step Functions genererar en unik token, mejlar en länk till en chef, pausar
tills `SendTaskSuccess`/`SendTaskFailure` anropas med token. **Ingen
autentisering av klickaren dokumenteras** — artikeln behandlar
"chefen klickade" som liktydigt med "godkänt", utan att adressera att
vem som helst med tillgång till mejllänken (eller token) kan trigga
samma callback. Detta är den SVAGASTE identitetsgarantin i hela passet,
och en tydlig negativ-kontrast: ett bevis-fritt "kanalseparation utan
autentisering"-mönster som INTE bör kopieras.

### 3.5 CIBA — mönstret som är BYGGT för "agenten får inte självgodkänna"

**BELAGT, primärkälla för specifikationen** (OpenID Foundation,
`openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html`);
konceptuell förklaring hämtad från WorkOS
(`workos.com/blog/ciba-human-approval-ai-agents`), en identitets-
infrastrukturleverantör, alltså en seriös men INTE OpenID-officiell källa
för tolkningen:

> *"The protocol proves approval originated from a genuine separate human
> device... A CIBA request cannot proceed without a token, and no token
> issues without a real human response on a real device."*

Detta är den mest EXPLICITA artikuleringen av principen som ligger under
kandidat B/C: godkännandet får inte gå via en session utföraren delar eller
kontrollerar. Auditfälten som beskrivs (agent-ID, användar-ID, begärd
handling, beslut, tidsstämpel, resulterande token) matchar samma
konvergenta schema som § 4 destillerar oberoende ur GitHub/Temporal.

**Faktafel identifierat och rättat:** WorkOS-blogginlägget kallar CIBA
*"an OAuth 2.0 extension (RFC 9126)"* — det är fel. RFC 9126 är "OAuth 2.0
Pushed Authorization Requests", en HELT ANNAN specifikation. CIBA är en
**OpenID Foundation Core 1.0**-specifikation
(`openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html`),
inte en IETF RFC vid namnet 9126 — bekräftat genom en riktad sökning som
inte hittade någon RFC-koppling för CIBA överhuvudtaget. Den konceptuella
beskrivningen (backkanal, separat enhet, ingen samtidig session) är
oberoende styrkt av tre ytterligare identitetsleverantörer (Auth0,
Authlete, PingIdentity) och behandlas som hållbar; RFC-numret stryks som
obelagt/felaktigt.

**Tillämpbarhet på oss:** CIBA i sin fulla form (OAuth-server, push-
notiser till en separat enhet) är uppenbart överdimensionerat för en
solo-utvecklares en-fil-manifest — men PRINCIPEN, inte protokollet, är vad
som ska tas hem: godkännandet måste ske via en kanal som INTE är en
verktygsanrops-väg agenten kan nå. `!`-prefixet är, arkitektoniskt, vår
lokala miniatyr av exakt den principen (§ 3.1).

## 4. Auditerbarhetens form — vad sparas som kvitto

| System | Identitet | Tidsstämpel | Artefakt-/versionsreferens | Kommentar/rationale | Auktoritativ källa |
|---|---|---|---|---|---|
| GitHub PR-review | `user.login` + `user.id` | `submitted_at` | `commit_id` (SHA) | `body` | [`docs.github.com/en/rest/pulls/reviews`](https://docs.github.com/en/rest/pulls/reviews) |
| GitHub deployment-review | reviewer (underförstådd via API-anrop) | underförstådd, ej verifierad i detalj (se § Vad jag inte kunde belägga) | miljö/körning | valfri kommentar | [`docs.github.com/actions/.../reviewing-deployments`](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments) |
| Temporal | `approver_email` | `decided_at` | workflow-ID (implicit) | `comment` | [docs.temporal.io/guides/reliable-document-approvals](https://docs.temporal.io/guides/reliable-document-approvals) |
| CIBA | agent-ID + användar-ID | tidsstämpel (implicit i token) | begärd handling (scopad token) | — | [openid.net CIBA Core 1.0](https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html) |
| Chromatic | collaborator-konto (via länkad Git-identity) | ej dokumenterat | kopplad build/commit (implicit) | ej dokumenterat | [chromatic.com/docs/review/](https://www.chromatic.com/docs/review/) |
| Vårt `facit.json` i dag | **saknas** | `godkand: <datum>` (sträng, ej strukturerad) | **saknas** | `lasning` finns, men för PROTOTYP-låsningen, inte för promoverings-godkännandet | `scripts/check-facit.sh` |

**Konvergent form, fyra av fem oberoende källor:** identitet, tidsstämpel,
referens till EXAKT vilken artefakt-version som granskades, samt valfri
fritext-motivering. Vårt nuvarande `godkand`-fält bär bara tidsstämpeln —
identitet är underförstådd (solo-repo, mekanismen SJÄLV bevisar vem, se
§ 5) men **artefakt-/versionsreferensen saknas helt**: manifestet säger
inte VILKEN commit/PR-SHA av den skarpa ytan Marcus faktiskt granskade när
han godkände. Det är samma klass av gap som GitHubs `commit_id`-fält och
Temporals `decided_at`+artefakt-koppling löser rutinmässigt.

---

## Syntes — vad branschen konvergerar mot

1. **Kanalseparation, inte innehållsverifiering.** Inget system vi
   undersökte bevisar "detta ÄR en människa" genom att GRANSKA vad som
   sades — alla bevisar det genom att kräva att handlingen kommer via en
   kanal utföraren inte kontrollerar (annan Git-identitet, annan enhet,
   annan process). CIBA formaliserar detta explicit; GitHub, Chromatic och
   Temporal implementerar varianter av samma idé utan att namnge den.
2. **Verifiering av ATT ändringen godkänts är standard; verifiering av VEM
   är svagare och ofta punktad till applikationslagret.** LangGraph och
   Temporal bygger PAUS-primitiv utan inbyggd identitetskontroll — de
   litar på att integratören (oss) bygger den. Det är inte en brist i
   verktygen; det är en medveten gräns i vad en workflow-motor ansvarar
   för.
3. **Branschens starkaste identitetsgarantier (GitHub PR-review, CODEOWNERS)
   är byggda på ANTAGANDET att granskare ≠ författare-konto.** Ingen av
   dem har en dokumenterad lösning för en ensam operatör som delar konto
   med sin egen agent — vilket är exakt vårt fall, mätt live (§ 2.1).
4. **Det konvergenta kvitto-schemat är enkelt:** identitet, tidsstämpel,
   artefakt-/versionsreferens, valfri motivering. Det är billigt att
   kopiera in i `facit.json` oavsett vilken GATING-mekanism som väljs.

---

## Applicerbarhets-analys mot vårt fall

### Kandidat A — agenten transkriberar Marcus verbatim ur chatten

**FALSIFIERAD.** Noll precedent i hela passet för "utföraren skriver ner
vad den tror att människan sa" som ett godkännande-bevis. Det är ren
självattestering — exakt anti-mönstret varje källa (Anthropic, CIBA,
Chromatics default-reviewer-workaround) bygger sig BORT ifrån. Vårt eget
tidigare pass har redan etablerat samma princip oberoende
(*"Den som gör arbetet ska inte vara den som betygsätter det"*,
`ui-prototyp-till-produktion-frontier-processer-2026-08-08.md`) — detta
pass ger den principen sin skarpaste artikulering (CIBA: *"no token
issues without a real human response on a real device"*) och bekräftar att
den gäller oss rakt av.

### Kandidat B — `!`-prefixet ensamt

**Branschprincipen (kanalseparation) korrekt lokalt tillämpad — men
ofullständig som ENSAM mekanism.** Claude Codes egen dokumentation ger
riktig grund: kommandot passerar aldrig agentens tolkning. Men ingenting
i `!`-mekanismen HINDRAR agenten från att, i SAMMA session, skriva samma
fält via sitt eget `Edit`/`Write`/`Bash`-anrop — self-service är
strukturellt fortfarande möjligt via en ANNAN väg. Det är exakt samma
observation som Chromatics "default reviewers krävs, annars är
självgodkännande möjligt": en legitim kanal räcker inte om en illegitim
kanal också står öppen. **Precedent-rymden är TUNN och det deklareras
öppet:** ingen annan agent-harness eller ramverk jag hittade dokumenterar
"utvecklaren skriver ett rått skalkommando i chattens indata" som en
NAMNGIVEN godkännande-form — det är vår egen tillämpning av principen på
Claude Codes specifika UI, inte ett ärvt mönster.

### Kandidat C — B + hook-spärr mot agent-skrivningar

**Bäst passande formen av de tre, med två öppna verifieringspunkter.**
Kombinationen matchar branschens konvergerande struktur (kanal A är
tillåten, kanal B är blockerad) bättre än A eller B ensamma. Två saker
måste dock hålla innan den kan tas i drift:

1. **Obelagt antagande:** att `PreToolUse` inte triggas av `!`-läget (§
   3.1). Rekommenderas verifierat med ett minimaltest INNAN kandidat C
   läggs till grund för beslut — annars kan hooken av misstag blockera
   Marcus egen stämplingsväg också.
2. **Hooken måste vara BREDARE än `deny-backlog-direct-edit.sh`-förlagan.**
   Den befintliga hookens matchare (`Edit|Write`) är dokumenterat
   otillräcklig mot Bash-baserad kringgång (§ 3.1, Boucle-citatet) — en
   robust spärr måste även matcha `Bash` med ett `if`-villkor på
   kommandots innehåll (sökväg + fältnamn), samma mönster som Claude Codes
   egen hooks-dokumentation visar (`if: "Bash(git commit)"`).

### Option D — GitHub-autentiserat godkännande speglat in i manifestet

**Härledd ur källorna, men falsifierad som REN ersättning för C i vårt
specifika läge — dess VÄRDE ligger i schemat, inte i grinden.**
PR-reviewens hårda självgodkännande-spärr (§ 2.1) skulle, mätt live, blocka
Marcus från att godkänna sin egen agents PR:er eftersom `gh` är
autentiserat som samma `marcus803`-konto — att lösa det kräver en separat
bot-/GitHub App-identitet för agentens PR-skapande, en konkret
infrastruktur-investering som inte finns i dag och som `required_approving_
review_count: 0` (mätt live) bekräftar att vi aldrig konfigurerat.
Environment-gates (§ 2.2) undviker den hårda spärren men är en
REPURPOSING av ett deploy-verktyg för ett design-granskningssyfte — samma
"inte ett dokumenterat användningsfall"-anmärkning som redan gjorts om
familj-1-verktyg i det tidigare passet.

**Det Option D FAKTISKT bidrar med, oavsett grind-mekanism:** branschens
mest kompletta, auktoritativt dokumenterade kvitto-SCHEMA (§ 4). Det är
värt att importera till `facit.json` oavsett om GitHub-mekanismen någonsin
blir den faktiska grinden.

---

## Rekommendation — MITT FÖRSLAG, inte ett beslut

1. **Gå vidare med kandidat C**, eftersom den är den enda av de tre som
   både (a) ger Marcus en legitim kanal och (b) mekaniskt kan stänga den
   andra vägen in — matchande branschens konvergerande "tillåten kanal +
   blockerad kanal"-struktur.
2. **Verifiera OBELAGDA antagandet FÖRST, med ett minimaltest** (repo-
   principen om minimaltest före full implementation): bygg en trivial
   testhook som loggar varje `PreToolUse`-anrop, kör en `!`-prefixad
   testskrivning mot en engångsfil, och läs loggen — bekräfta att hooken
   INTE triggades. Faller antagandet, måste hookens matchare exkludera
   Marcus egen stämplingskommando explicit (t.ex. genom att stämplings-
   skriptets exakta kommandorad whitelistas i `if`-villkoret).
3. **Bygg hooken bredare än `deny-backlog-direct-edit.sh`-förlagan:**
   matcha `Edit|Write` MOT `facit.json`-sökvägen OCH `Bash` med ett
   `if`-villkor som känner igen sökvägen/fältnamnet i kommandosträngen —
   annars är spärren en attrapp mot precis den bypass-klass § 3.1 citerar
   källbelagt.
4. **Utöka `godkand`-fältets schema** från bar sträng till att bära minst
   en artefakt-/versionsreferens (vilken commit/PR-SHA av den skarpa ytan
   som faktiskt granskades) — identitet behöver inte ett eget fält (solo-
   repo, mekanismen bevisar redan vem), men referensen till VAD som
   godkändes saknas i dag och är branschens mest konsekvent återkommande
   kvitto-fält (§ 4).
5. **Deklarera precedent-tunnheten öppet i grillningen:** kandidat B/C:s
   exakta FORM (skalkommando i chattens indata) är vår egen tillämpning av
   en branschprincip (kanalseparation), inte ett ärvt mönster — det gör
   den inte fel, men grillningen bör väga in att vi inte kan luta oss mot
   "så gör alla andra".
6. **Parkera Option D som eskaleringsväg, inte som nuläge.** Om/när en
   separat bot-/App-identitet för agentens PR-skapande någon gång byggs av
   ANDRA skäl (t.ex. multi-repo-skalning), blir GitHub PR-review en
   direkt tillgänglig, starkare grind än en hemmabyggd hook — men att
   bygga den identiteten ENBART för detta vore spekulativ komplexitet
   ovanför golvet (dubbelriktad över-engineering-vakt).

## Vad jag inte kunde belägga

+ **Om `PreToolUse` triggas av `!`-prefix-kommandon.** Ingen källa uttalar
  sig explicit; min slutsats är en INFERENS ur två separata dokument-
  avsnitt (§ 3.1). Detta är den mest lastbärande obelagda punkten i hela
  passet och bör verifieras empiriskt före beslut.
+ **Chromatics och Percys exakta lagrade kvitto-fält** (granskarnamn,
  tidsstämpel, kommentar i maskinläsbar form) — dokumentationen beskriver
  UI-beteendet men inte ett auditerbart schema jag kunde citera.
+ **GitHub deployment-reviewens exakta API-svarsschema** — jag fetchade
  översiktssidan, inte REST-referensens fullständiga objektdefinition för
  `deployment_review`; fälten i § 4-tabellen för den raden är därför
  markerade "underförstådd", inte verifierade.
+ **Om GitHubs självgodkännande-block för PR-review skiljer UI-vägen från
  API-vägen identiskt.** Sekundärkälla-sammanfattat som "hård
  plattformsregel utan konfigurationsväg"; jag har inte själv fetchat och
  läst `docs.github.com`s exakta ordalydelse verbatim för denna specifika
  punkt (bara för deployment-reviews, § 2.2, som ÄR verbatim-citerad).
+ **CIBAs RFC-koppling** — WorkOS-bloggens påstående ("RFC 9126") är
  identifierat som felaktigt (§ 3.5); jag hittade ingen RFC-koppling alls
  för CIBA i en riktad sökning, bara OpenID Foundations egen
  Core-1.0-beteckning.
+ **Verkligt track record för solo-utvecklare som använder GitHubs
  required-reviewers mot sin egen agent.** Inget fallstudie-material
  hittades — precedent-rymden för EXAKT vårt scenario (en person, en
  agent, samma konto) är tunn hos alla undersökta leverantörer, inte bara
  hos oss.

## Källförteckning

+ Chromatic — [Review](https://www.chromatic.com/docs/review/) · [UI Review vs UI Tests FAQ](https://www.chromatic.com/docs/faq/ui-review-vs-ui-tests/)
+ Percy (BrowserStack) — [Visual testing basics](https://www.browserstack.com/docs/percy/overview/visual-testing-basics)
+ Storybook — [Visual testing](https://storybook.js.org/docs/writing-tests/visual-testing)
+ GitHub — [Reviews API](https://docs.github.com/en/rest/pulls/reviews) · [Approving a PR with required reviews](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews) · [Reviewing deployments](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments) · [About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) · [Required reviewer rule GA](https://github.blog/changelog/2026-02-17-required-reviewer-rule-is-now-generally-available/) · [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations)
+ Claude Code — [Interactive mode (`!`-prefix)](https://code.claude.com/docs/en/interactive-mode) · [Hooks reference](https://code.claude.com/docs/en/hooks)
+ Boucle — [What Claude Code hooks can and cannot enforce](https://blog.boucle.sh/posts/what-claude-code-hooks-can-and-cannot-enforce/) (sekundärkälla, teknisk genomgång)
+ LangChain/LangGraph — [Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
+ Temporal — [Reliable document approvals](https://docs.temporal.io/guides/reliable-document-approvals)
+ AWS — [Implementing serverless manual approval steps](https://aws.amazon.com/blogs/compute/implementing-serverless-manual-approval-steps-in-aws-step-functions-and-amazon-api-gateway/)
+ OpenID Foundation — [CIBA Core 1.0](https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html)
+ WorkOS — [CIBA for AI agents](https://workos.com/blog/ciba-human-approval-ai-agents) (sekundärkälla, RFC-numret i denna källa är felaktigt — se § 3.5)
+ Anthropic — [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
+ Egna repo-mätningar 2026-08-08: `gh api user` (`marcus803`), `gh api repos/high-five-group/miranon-media-admin/rulesets/19627609` (`required_approving_review_count: 0`)
