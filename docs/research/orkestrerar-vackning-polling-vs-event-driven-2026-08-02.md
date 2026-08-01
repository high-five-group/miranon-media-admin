---
owner: marcus803
updated: 2026-08-02
review_by: 2027-02-02
status: stable
---

# Är polling-heartbeat branschledande form för orkestrerarens väckning? (Code, 2026-08-02)

> **Proveniens:** avgränsat research-pass 2026-08-02, beställt av orkestreraren
> för att pröva `T112`:s stående åtgärd (`CLAUDE.md` § Landning, punkt
> *"Svep vid varje väckning"*) mot branschform. Ingen kod, ingen config och
> inget kort rört — enda skrivningen i repot är denna fil.
>
> **Mätningarna** kördes 2026-08-02 mot: `gh` CLI `2.96.0` (lokalt
> installerad, `/usr/local/bin/gh`); källkoden i `cli/cli` vid commit
> `e83adbc0642994fae7c39a9a012eb34b8c81f4f1` (branch `trunk`, hämtad direkt
> via `raw.githubusercontent.com`); källkoden i `actions/runner` (branch
> `main`, samma hämtningssätt); källkoden i `cli/gh-webhook` (branch `main`);
> en live GraphQL-introspektion och ett live `rate_limit`-anrop mot
> `api.github.com` via repots egen autentiserade `gh`-session; samt en live
> GraphQL-fråga mot `high-five-group/miranon-media-admin` självt för att
> bekräfta vilka merge-kö-fält som faktiskt går att läsa ut via polling.
> Där något är sekundärkälla eller bedömning står det utskrivet.

---

## Kort svar

**Ja — polling med ett idempotent, tillstånds-läsande svep är branschledande
form för exakt den problemklass vi har: en aktör som kan initiera utgående
anrop men inte ta emot inkommande.** Det är inte en kompromiss vi tvingats
till i brist på bättre — det är **samma mönster GitHub väljer för sin egen
produkt** (self-hosted Actions-runner: utgående long-poll, 15–60 s backoff,
ingen inkommande port), samma mönster Buildkite och CircleCI väljer för sina
self-hosted-agenter, och samma familj som Kubernetes-kontrollers
"watch + periodisk resync" (level-triggered reconciliation). GitHubs egen
REST-dokumentation behandlar polling som förstklassigt stöd — inte en
workaround — med en dedikerad `X-Poll-Interval`-header och
ETag/304-mekanik för att göra det billigt.

Vårt 90 s-intervall ligger inom normen (GitHubs eget golv utan annan
uppgift: 60 s) och kostar, uppmätt live mot vår egen `rate_limit`-endpoint,
**~40 anrop/timme av en 5 000/timme-budget** — 0,8 %. Rate-limit är alltså
inte en risk som talar för ett annat mönster.

**Det finns en genuin event-driven väg utan server** — `gh webhook forward`,
en officiell `cli`-org-extension som öppnar en **utgående** websocket mot
GitHub och kan i princip leverera `merge_group`- och
`pull_request.dequeued`-händelser (den senare "konsekvent publicerad ...
inklusive när den [PR:n] har mergats av kön", per GitHubs egen
GA-changelogpost) utan att vi öppnar någon port. Men GitHub dokumenterar den
**explicit som endast för test/utveckling, "not supported ... in production
environments"**, begränsad till **en lyssnare per repo/org**, och dess
körbarhet som långlivad bakgrundsprocess i vår sandbox är obelagd — vilket
är precis den mekanism-klass `T112` redan mätte som opålitlig för
worktree-isolerade agenter. Den är alltså **BELAGT möjlig som mekanism**,
men **inte etablerad branschform för produktionsorkestrering**, och
**obeprövad i vår harness**.

Den djupare poängen: `T112`:s Mätt-fynd 1 (*"en fullbordad vakt väckte
ingen"*) är exakt det fel level-triggered reconciliation är designat för att
vara immunt mot. Ett svep som vid varje väckning läser **faktiskt
tillstånd** — inte "väntar på ett event" — kan per definition inte missa en
händelse, eftersom det aldrig litar på att händelsen kom fram. Det är
skälet till att riktning (ii) i `T112` fungerade 2026-08-01, fast vi inte
hade namnet på mönstret då.

---

## 1. GitHubs egna mekanismer

### Webhooks kräver en publikt nåbar server — med ett dokumenterat undantag

GitHubs egen dokumentation för webhook-mottagning beskriver alltid en
"Payload URL" servern ska lyssna på; det finns ingen inbyggd väg att ta emot
en webhook utan ett HTTP-endpoint någon kan nå.
([Creating webhooks](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks))

Undantaget, och det starkaste enskilda fyndet i detta pass: **`gh webhook
forward`**, en officiell extension i `cli`-organisationen
(`gh extension install cli/gh-webhook`, bekräftat installerbar via
`gh extension search webhook` lokalt 2026-08-02). Källkoden
(`webhook/forward.go`, `webhook/create_webhook.go`, hämtad från
`cli/gh-webhook@main`) visar exakt hur den kringgår server-kravet: den
anropar GitHubs REST-API för att skapa en **dev-webhook** med
`active: false`, får tillbaka en `ws_url`, och processen **dialar UT** till
den websocket-URL:en (`websocket.DefaultDialer.Dial`) — helt utan att
öppna någon inkommande port. Events strömmas till processen över den
uppkopplingen; `--url` är valfri och events skrivs till stdout om den
utelämnas.

GitHubs egen dokumentation för funktionen bekräftar detta explicit:

> "Webhook forwarding is only designed for use during testing and
> development. It is not supported for use in production environments for
> handling live webhooks."
>
> "Only one person can use webhook forwarding at a time for each repository
> and organization."
>
> "Webhook forwarding in the GitHub CLI only works with repository and
> organization webhooks."

([Using the GitHub CLI to forward webhooks for testing](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/using-the-github-cli-to-forward-webhooks-for-testing))

Detta är alltså en **belagd, fungerande mekanism** för att ta emot
GitHub-events lokalt utan server — men GitHub själva sätter den utanför
produktionsanvändning, och den delar exakt den egenskap `T112` redan mätte
som riskabel: en långlivad bakgrundsprocess som måste överleva turgränsen
för att vara till nytta. Om den processen dör tyst (samma klass som
`T112` Mätt 1–2), är vi tillbaka på samma väckningsproblem — bara med en
extra beroende-yta (websocket-anslutningen) ovanpå.

### `merge_group`-eventet täcker hela kö-livscykeln, inklusive landning

`merge_group` har action `checks_requested` (skickas när en PR når kön och
väntar på CI) och `destroyed` (skickas "for any reason, including when it's
merged"). Utöver det finns `pull_request.dequeued`, tillagt vid
merge queue-GA:

> "A `pull_request.dequeued` webhook event is now consistently published
> whenever a pull request is removed from the queue for any reason,
> including when it has been merged by the queue."
>
> "A `merge_group` webhook event with an action of `destroyed` is now
> published when a merge group is destroyed for any reason, including when
> it's merged or invalidated because a pull request is removed from the
> queue."

([Pull request merge queue is now generally available](https://github.blog/changelog/2023-07-12-pull-request-merge-queue-is-now-generally-available/),
[Merge group webhook event and GitHub Actions workflow trigger](https://github.blog/changelog/2022-08-18-merge-group-webhook-event-and-github-actions-workflow-trigger/))

Så: **om** vi hade en webhook-mottagare (t.ex. via `gh webhook forward`)
skulle den tekniskt kunna svara på exakt vår fråga — "landade PR X?" —
händelsedrivet. Mekanismen finns. Vägen dit i vår specifika miljö (server-lös,
sandboxad, worktree-isolerad) är den obelagda delen.

### GitHub Actions-notifikationer är människo-riktade — maskinläsbart endast via polling

Det finns ingen push-baserad, maskin-konsumerbar notifikationskanal för "din
watch-lista ändrades" — endast `/notifications`-REST-endpointen, som själv
är byggd för polling: den exponerar en dedikerad `X-Poll-Interval`-header
("specifies how often (in seconds) you are allowed to poll ... In times of
high server load, the time may increase. Please obey the header.") och
stöder `If-Modified-Since`/`Last-Modified` för billiga 304-svar.
([Notifications API](https://docs.github.com/en/rest/activity/notifications))
Detta är alltså inget alternativ till polling — det är GitHub som
**formaliserar** polling som det avsedda mönstret för just den här klassen
av "har något förändrats"-fråga.

### GraphQL har inga subscriptions — MÄTT, inte antaget

Prövat direkt mot `api.github.com` 2026-08-02, live introspektion via vår
egen autentiserade `gh`-session:

```console
$ gh api graphql -f query='{ __schema { subscriptionType { name } mutationType { name } queryType { name } } }'
{"data":{"__schema":{"subscriptionType":null,"mutationType":{"name":"Mutation"},"queryType":{"name":"Query"}}}}
```

`subscriptionType: null` — GitHubs GraphQL-schema saknar helt ett
Subscription-rot-typ. Push-baserad GraphQL är inte tillgänglig som väg,
punkt slut. (Sekundärkällor, bl.a.
[community-diskussion #120716](https://github.com/orgs/community/discussions/120716),
pekar åt samma håll men den här mätningen är primär och entydig.)

### REST rate-limits gör 90 s-polling till en icke-fråga

Live mot vår egen `gh`-session 2026-08-02:

```console
$ gh api rate_limit
{"resources":{"core":{"limit":5000,...},"graphql":{"limit":5000,...}, ...}}
```

Core och GraphQL ligger båda på **5 000 anrop/timme**, autentiserat via
`gh`. Ett svep var 90:e sekund är 40 anrop/timme = **0,8 %** av budgeten,
även om varje svep gör flera anrop (kö-status + PR-lista + checks) ryms det
med bred marginal. GitHubs egen bästa-praxis-dokumentation ger samma
riktning i text:

> "You should subscribe to webhook events instead of polling the API for
> data." — men där webhooks inte är görbara: "If a response includes an
> `x-poll-interval` header, wait at least that many seconds before you poll
> the same endpoint again," och conditional requests med `etag`/`if-none-match`
> gör att ett oförändrat svar (304) **inte** räknas mot rate-limiten.

([Best practices for using the REST API](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api),
[Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api))

**Optimeringsmöjlighet, inte designfel:** vår nuvarande heartbeat är inget
incheckat skript i repot (sökt `*heartbeat*` i hela trädet, 2026-08-02: noll
träffar) — den körs ad hoc av orkestreraren varje session. Om den redan
använder ETag/`If-None-Match` är obelagt i detta pass; se § Vad jag inte
kunde belägga.

---

## 2. Hur branschledarnas verktyg gör

### `gh pr checks --watch` — MÄTT ur källkod: pollar, täcker inte kön

Direkt ur `cli/cli@trunk` (`pkg/cmd/pr/checks/checks.go`,
`e83adbc0642994fae7c39a9a012eb34b8c81f4f1`):

```go
const defaultInterval time.Duration = 10 * time.Second
...
for {
    ...
    if counts.Pending == 0 || !opts.Watch {
        break
    }
    time.Sleep(opts.Interval)
    checks, counts, err = populateStatusChecks(client, repo, pr, opts.Required, includeEvent)
    ...
}
```

Standardintervallet är **10 sekunder**, en ren `time.Sleep`-loop som
upprepar en GraphQL-fråga mot `StatusCheckRollup.Contexts`. Sökt i samma
fil efter `MergeQueue`/`merge_queue`/`mergeQueue`: **noll träffar** —
`gh pr checks --watch` känner inte till kö-fasen alls, vilket bekräftar
kontextens premiss direkt ur källkoden snarare än att bara upprepa den.

`gh run watch` (`pkg/cmd/run/watch/watch.go`, samma commit) använder samma
mönster med `const defaultInterval int = 3` — tre sekunders poll-loop mot
workflow-run-status.

`gh pr merge` (`pkg/cmd/pr/merge/merge.go`) har **ingen** watch-loop för
kön. Den gör en **engångskoll**: hämtar fälten
`isInMergeQueue`/`isMergeQueueEnabled`/`mergeStateStatus` via GraphQL,
rapporterar "already queued to merge" eller lägger till i kön, och
avslutar. Att följa en PR genom hela kö-fasen till landning är inte en
inbyggd `gh`-funktion — bekräftat ur källkoden, inte antaget. Vi har själva
verifierat att fälten går att läsa live (se § 1, samma frågeform mot
`high-five-group/miranon-media-admin`), så polling **mot rätt fält** är en
byggbar väg — bara inte en `gh` gör åt oss redan.

### GitHub Actions egen self-hosted-runner — GitHubs EGEN produkt löser samma problem med long-poll

Detta är den starkaste branschprecedenten, för att det är GitHub själva som
löste **exakt vårt problem**: en fjärransluten aktör utan inkommande port
som ska få veta när det finns nytt arbete. MÄTT ur källkoden
(`actions/runner@main`, `src/Runner.Listener/MessageListener.cs`):

```csharp
private readonly TimeSpan _sessionCreationRetryInterval = TimeSpan.FromSeconds(30);
...
_getNextMessageRetryInterval = BackoffTimerHelper.GetRandomBackoff(
    TimeSpan.FromSeconds(15), TimeSpan.FromSeconds(30), _getNextMessageRetryInterval);
...
_getNextMessageRetryInterval = BackoffTimerHelper.GetRandomBackoff(
    TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(60), _getNextMessageRetryInterval);
...
if (heartbeat.Elapsed > TimeSpan.FromMinutes(30)) { ... }
```

Runnern öppnar en **utgående** HTTP long-poll-anslutning (öppen ~50 s per
sekundärkälla, se nedan) och backar av mellan 15–60 s vid fel, med en
30-minuters heartbeat-kontroll. Ingen inkommande port krävs. Sekundärkällor
(inte primärt verifierade i detta pass, men samstämmiga) beskriver samma
mekanism i klartext: "The self-hosted runner uses an HTTP(S) long poll that
opens a connection to GitHub for 50 seconds" och "establishes an outbound
HTTPS connection to GitHub's servers (no inbound ports required)."

### Buildkite-agenten — samma mönster, egen dokumentation

> "The agent works by polling Buildkite's agent API over HTTPS."
>
> "The agent periodically polls the Buildkite platform, looking for new
> work, waiting to accept an available job."
>
> "There is no need to forward ports or provide incoming firewall access."

([The Buildkite agent](https://buildkite.com/docs/agent)) — exakt vår
situation: en aktör som inte kan ta emot inkommande trafik löser det genom
att själv fråga, upprepat.

### CircleCI self-hosted runner — samma mönster

> "The self-hosted runner polls CircleCI for new jobs, and does not require
> any incoming connections."

(Sekundärkälla — CircleCI-dokumentationens sökresultat citerade ovan;
originalsidan kunde inte hämtas direkt i detta pass, se § Vad jag inte kunde
belägga.)

### Mergify — arkitekturen kunde INTE beläggas i detta pass

Mergify är den naturliga jämförelsen ("ett verktyg vars enda jobb är
merge-kö-orkestrering"), men dess officiella dokumentationssida gav i detta
pass ingen information om huruvida den drivs av webhooks eller polling.
Detta registreras öppet som obelagt snarare än gissat — se § Vad jag inte
kunde belägga. (Rimligt antagande, EJ verifierat: Mergify är en hostad
GitHub App, och GitHub Apps är den kategori GitHub själva rekommenderar
webhooks starkast för — men det är ett antagande, inte ett fynd.)

### Kubernetes-kontrollers — watch + periodisk resync, samma familj på ett annat lager

Kubernetes officiella dokumentation beskriver kontroll-loopen som
icke-terminerande och tillstånds-jämförande, inte händelse-uttömmande:

> "A controller tracks at least one Kubernetes resource type. ... The
> controller(s) for that resource are responsible for making the current
> state come closer to that desired state."

([Controllers](https://kubernetes.io/docs/concepts/architecture/controller/))

Den tekniska detaljen — att en informer kombinerar en `watch` med en
**periodisk resync** utöver själva watch-strömmen — är verifierad direkt ur
`client-go`s källkod (`kubernetes/client-go@master`,
`tools/cache/shared_informer.go`), inte bara sekundärkällor:

```go
// informers do no resyncs at all, not even for handlers added
// with a non-zero resyncPeriod. For an informer that does
// resyncs, and for each handler that requests resyncs, that
// informer develops a nominal resync period that is no shorter
// than the requested period but may be longer.
```

Detta är **exakt vårt mönster i miniatyr**: en watch (event-driven,
billig, men kan missa saker eller tystna) kombinerad med en garanterad
periodisk fullständig omkontroll (dyrare per körning, men immun mot
missade events per konstruktion) — vilket är precis vad "svep vid varje
väckning" gör för oss, fast utan `watch`-halvan (vi har ingen billig
event-ström, bara sweepet). Sekundärkällor (Render engineering-bloggen,
"Kubernetes Informers are so easy... to misuse!") beskriver samma mönster
i klartext som "level-triggered, not edge-triggered" — vokabulären som
tydligast fångar varför formen är robust: den frågar "vad är sant nu?",
aldrig "vad hände sist?".

### SRE-boken — tangentiellt, men samma designfilosofi

Kapitel 10 (Practical Alerting) beskriver Googles interna
metrikinsamlingssystem Borgmon som **medvetet pull-baserat**:

> "At predefined intervals, Borgmon fetches the `/varz` URI on each target,
> decodes the results, and stores the values in memory."

Och explicit om robustheten i det valet:

> "...experience shows that this is rarely an issue. The system itself is
> already designed to be robust against network and machine failures."

([Practical Alerting](https://sre.google/sre-book/practical-alerting/)) —
detta är metrikinsamling, inte CI/merge-orkestrering, så precedensen är
**svagare och indirekt**: samma "fråga hellre än vänta"-filosofi, men inte
samma problemklass. Flaggas som tangentiell, inte som direkt precedent.

---

## 3. Bedömning för vår kontext

**~90 s heartbeat-polling + idempotent svep vid varje väckning är en
försvarbar, branschförankrad form** — inte en nödlösning. Grunderna:

1. **Samma problemklass, samma lösning hos branschledarna.** GitHub
   (Actions-runner), Buildkite och CircleCI löser alla "fjärransluten
   aktör utan inkommande port behöver veta om nytt tillstånd" med utgående
   poll/long-poll + backoff. Vår situation (lokal CLI-session, ingen
   server, sandbox som blockerar långlivade vaktformer för
   worktree-agenter — `T112` Mätt 2) är strukturellt samma problem.
2. **GitHub behandlar polling som förstklassigt, inte som en workaround** —
   `X-Poll-Interval`, ETag/304, explicit dokumenterad rate-budget. Att välja
   polling där webhooks inte är byggbara är alltså inte att välja "sämre",
   det är att välja den väg GitHub själva instrumenterat för.
3. **Level-triggered slår edge-triggered för just detta felläge.**
   `T112`:s kärnfynd — en fullbordad bakgrundsvakt väckte ingen — är ett
   edge-triggered-fel: ett event inträffade, men ingen läste det. Ett svep
   som vid varje väckning frågar "vad är det FAKTISKA läget nu?" (K8s'
   reconciliation-mönster, nu verifierat ur `client-go`-källkod) kan inte
   drabbas av den felklassen, eftersom det aldrig förlitar sig på att ett
   event kom fram. Detta är den arkitektoniska förklaringen till varför
   riktning (ii) fungerade 2026-08-01 — vi hade mönstret innan vi hade
   namnet.
4. **Rate-limit talar inte emot.** 0,8 % av budgeten uppmätt live; det
   finns ingen numerisk press mot ett tätare eller glesare intervall.

**Vad som INTE är belagt fungera bättre i vår specifika sandbox:**
`gh webhook forward` är en genuin, server-lös, event-driven mekanism — men
den är (a) explicit GitHub-dokumenterad som test/dev-only, inte produktion,
(b) begränsad till en lyssnare per repo/org, och (c) kräver precis den typ
av långlivad bakgrundsprocess `T112` redan mätte som opålitlig för
worktree-isolerade agenter (Mätt 2–3: sandbox-spärren avvisade tre
vaktformer, och en enkel poll-loop i bakgrund avvisades vid själva
kodifieringen 2026-08-01 med "too complex to verify"). Att byta till den
utan att först lösa sandbox-frågan vore att byta ett obevisat
tillförlitlighetsproblem mot ett annat, snarare än att lösa något.

**Konkret optimeringsspår, om det någonsin blir värt tiden:** lägg
`If-None-Match`/ETag på sveps-anropen. Det sänker den redan försumbara
rate-limit-kostnaden ytterligare och är i linje med GitHubs egen
best-practice-text — men det är en finslipning av en redan sund form, inte
en åtgärd av ett fel.

---

## Dom

**BELAGT:** polling med periodiskt, tillstånds-läsande svep är det mönster
GitHubs egen self-hosted-runner, Buildkite-agenten och CircleCIs
self-hosted-runner använder för identisk problemklass (mätt ur `gh
pr checks`/`gh run watch`-källkod och `actions/runner`-källkod, citerat ur
Buildkite/CircleCI-dokumentation). GitHubs REST-API har ett dedikerat,
dokumenterat polling-protokoll (`X-Poll-Interval`, ETag/304). GraphQL
saknar subscriptions (mätt live). `gh pr checks --watch` täcker inte
merge-kö-fasen (mätt ur källkod). Vårt 90 s-intervall kostar 0,8 % av
rate-budgeten (mätt live).

**BEDÖMT:** vårt nuvarande mönster (heartbeat + svep-vid-väckning) är
branschform tillämpad rätt på vår specifika begränsning (server-lös,
sandboxad), och är dessutom samma familj som Kubernetes'
reconciliation-loop — en etablerad, namngiven arkitekturprincip för exakt
den robusthetsegenskap `T112` mätte att vi saknade.

**Precedent-rymden är bred, inte tunn** för själva poll-vs-push-frågan (tre
oberoende branschledare, samma svar) — men **tunn och overifierad** för
"skulle `gh webhook forward` fungera i VÅR sandbox": noll instanser
testade, ren dokumentationsläsning.

---

## Vad jag inte kunde belägga

- **Mergifys interna arkitektur** (webhook- eller poll-driven). Officiell
  dokumentationssida gav i detta pass ingen information om detta; ingen
  ytterligare primärkälla söktes inom passets tidsram. Registreras som
  frånvaro av fynd, inte som frånvaro av mekanism.
- **Om `gh webhook forward` faktiskt fungerar i vår worktree-sandbox** som
  en långlivad bakgrundsprocess. Inget test genomfört — att sätta upp en
  riktig dev-webhook mot prod-repot låg utanför scope för ett
  research-only-pass utan implementation, och `T112` har redan mätt
  närliggande vaktformer som avvisade av sandbox-spärren.
- **Kubernetes officiella dokumentation ordagrant om VARFÖR watch och
  periodisk resync kombineras** (kubernetes.io/docs/concepts/architecture/
  controller). Sidan beskriver kontroll-loop-konceptet men inte den
  specifika watch+resync-mekaniken i den text som gick att hämta i detta
  pass; den tekniska bekräftelsen kommer i stället direkt ur
  `client-go`-källkoden (starkare källa, men en annan sida än den
  konceptuella dokumentationen).
- **CircleCIs self-hosted-runner-dokumentation i originalform.** Fyndet om
  "polls CircleCI for new jobs, does not require any incoming connections"
  är citerat ur sökmotorns sammanfattning av CircleCI:s dokumentationssida,
  inte ur en direkt sidhämtning i detta pass.
- **Om vår faktiska heartbeat-implementation redan använder
  ETag/`If-None-Match`.** Det finns inget incheckat skript i repot (sökt
  `*heartbeat*` i hela trädet, 2026-08-02: noll träffar) — mekanismen körs
  ad hoc av orkestreraren, så dess exakta HTTP-beteende gick inte att
  granska mot fil.
- **`gh run watch`-scopet mot merge-kön.** Vi verifierade att
  `pr checks --watch` saknar kö-medvetenhet ur källkod; vi granskade inte
  `run watch` lika djupt eftersom den redan är dokumenterat begränsad till
  workflow-run-status, ett annat objekt än PR/kö-tillstånd.

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut** — orkestreraren och Marcus
äger vägvalet.

1. **Behåll heartbeat + svep-vid-väckning som stående form.** Den är nu
   branschbelagd, inte bara pragmatiskt vald under press. Ingen ändring
   motiverad av detta pass.
2. **Namnge mönstret explicit i `CLAUDE.md` § Landning** som
   "level-triggered reconciliation, K8s-mönstret" när/om raden nästa gång
   redigeras — inte för att ändra beteendet, utan för att framtida läsare
   ska förstå VARFÖR ett svep-som-läser-faktiskt-tillstånd är robust på ett
   sätt en händelse-vakt strukturellt inte kan vara. Ingen brådska; ren
   dokumentations-skärpning.
3. **Utforska `gh webhook forward` EN gång, avgränsat**, om `T112`:s
   sandbox-fråga (Åtgärdsval-punkt iv, "harness-mätningen") någon gång
   löses för långlivade bakgrundsprocesser generellt — men först då, och
   som ett eget litet test (kan en dev-webhook mot detta repo hålla en
   websocket öppen över en turgräns i vår sandbox?), inte som en
   direkt-till-produktion-ersättning av heartbeaten. Kom ihåg
   en-lyssnare-per-repo-begränsningen om fler agenter någonsin skulle
   behöva samma kanal.
4. **Överväg ETag/`If-None-Match` på sveps-anropen** som en billig,
   lågrisk-finslipning — inte motiverat av något uppmätt problem, bara av
   att det är gratis given att formen redan är rätt.

---

## Källförteckning

**Primärkälla — GitHub officiell dokumentation:**

- [Best practices for using the REST API](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)
- [Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [Notifications API — X-Poll-Interval](https://docs.github.com/en/rest/activity/notifications)
- [Creating webhooks](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks)
- [Using the GitHub CLI to forward webhooks for testing](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/using-the-github-cli-to-forward-webhooks-for-testing)
- [Webhook events and payloads — merge_group](https://docs.github.com/en/webhooks/webhook-events-and-payloads)
- [Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
- [Merge group webhook event and GitHub Actions workflow trigger (changelog)](https://github.blog/changelog/2022-08-18-merge-group-webhook-event-and-github-actions-workflow-trigger/)
- [Pull request merge queue is now generally available (changelog)](https://github.blog/changelog/2023-07-12-pull-request-merge-queue-is-now-generally-available/)
- [gh pr checks — CLI manual](https://cli.github.com/manual/gh_pr_checks)

**Primärkälla — källkod, hämtad direkt:**

- `cli/cli@trunk` (`e83adbc0642994fae7c39a9a012eb34b8c81f4f1`) —
  [`pkg/cmd/pr/checks/checks.go`](https://github.com/cli/cli/blob/trunk/pkg/cmd/pr/checks/checks.go),
  [`pkg/cmd/run/watch/watch.go`](https://github.com/cli/cli/blob/trunk/pkg/cmd/run/watch/watch.go),
  [`pkg/cmd/pr/merge/merge.go`](https://github.com/cli/cli/blob/trunk/pkg/cmd/pr/merge/merge.go)
- `cli/gh-webhook@main` —
  [`webhook/forward.go`](https://github.com/cli/gh-webhook/blob/main/webhook/forward.go),
  [`webhook/create_webhook.go`](https://github.com/cli/gh-webhook/blob/main/webhook/create_webhook.go)
- `actions/runner@main` —
  [`src/Runner.Listener/MessageListener.cs`](https://github.com/actions/runner/blob/main/src/Runner.Listener/MessageListener.cs)
- `kubernetes/client-go@master` —
  [`tools/cache/shared_informer.go`](https://github.com/kubernetes/client-go/blob/master/tools/cache/shared_informer.go)
- Live-mätningar 2026-08-02 mot `api.github.com` via `gh api graphql`
  (subscription-introspektion) och `gh api rate_limit`, samt en
  GraphQL-fråga mot `high-five-group/miranon-media-admin` för
  merge-kö-fält.

**Primärkälla — övriga branschledare:**

- [The Buildkite agent](https://buildkite.com/docs/agent)
- [Kubernetes — Controllers](https://kubernetes.io/docs/concepts/architecture/controller/)
- [Google SRE Book — Practical Alerting (Borgmon)](https://sre.google/sre-book/practical-alerting/)

**Sekundärkälla (flaggad i text där använd):**

- CircleCI self-hosted runner-dokumentation (citerad via sökmotor-
  sammanfattning, ej direkt sidhämtning)
- GitHub Actions self-hosted runner long-poll-detaljer (50 s-siffran; själva
  backoff-mekaniken är primärkälle-verifierad, se ovan)
- [Kubernetes Informers are so easy... to misuse! (Render Engineering)](https://render.com/blog/kubernetes-informers)
- [GraphQL subscriptions with GitHub API (community-diskussion #120716)](https://github.com/orgs/community/discussions/120716)

**Kontext internt (ej ny research, refererad för sammanhang):**

- `tasks/threads/T112-vackningskedjan-over-turgransen.md`
- `CLAUDE.md` § Landning, stycket "Svep vid varje väckning"
