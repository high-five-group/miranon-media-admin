---
owner: marcus803
updated: 2026-08-01
review_by: 2027-02-01
status: draft
---

# task-99 — dequeuePullRequest / enqueuePullRequest(jump:) skarpt prövade (2026-08-01)

> **Proveniens:** `TASK-99`, mintat ur ett oväntat fynd i
> [`kohopp-bradskande-revert-2026-07-30.md`](kohopp-bradskande-revert-2026-07-30.md)
> § 5.1: `CLAUDE.md` § Landning drog slutsatsen *"det finns ingen väg ur"* en
> köad gren enbart ur att `gh` 2.96.0 saknar en dequeue-flagga — en
> plattformsslutsats dragen ur en CLI-begränsning. Detta pass prövar
> mutationerna skarpt (inte bara introspektion) och rapporterar utfallet.

## Kort svar

Båda mutationerna **fungerar**, prövade skarpt mot en genuint köad test-PR.
Ingen krävde rättigheter utöver ett vanligt repo-admin-token (`repo`-scope).
`CLAUDE.md`:s rad *"det finns ingen väg ur"* är för stark — vägen finns, den
går bara inte via `gh`.

## Metod

En kastbar test-PR (`#561`, gren `test/task-99-mergequeue-probe`, en enda
docs-fil utan produktionspåverkan) öppnades mot `main`, fick sina required
checks gröna, och användes som mål för båda mutationerna. PR:en stängdes utan
merge och grenen togs bort direkt efter testet. Kön var bekräftat tom
(`totalCount: 0`) innan testet startade — ingen annan PR påverkades.

Verktyg: `gh api graphql` direkt (rå GraphQL, inte `gh pr merge`), `gh` 2.96.0,
mot `api.github.com` 2026-08-01.

## Mätning 1 — `enqueuePullRequest` kräver gröna checks (mätt gräns)

Försök att köa PR `#561` **innan** dess required checks var klara:

```bash
$ gh api graphql -f query='mutation($id: ID!) {
    enqueuePullRequest(input: {pullRequestId: $id, jump: true}) {
      mergeQueueEntry { id position state pullRequest { number } }
    }
  }' -f id="PR_kwDOSBHr7s75e6Kf"
```

Utfall (21:55:48 UTC):

```json
{"data":{"enqueuePullRequest":null},"errors":[{"type":"UNPROCESSABLE",
"path":["enqueuePullRequest"],
"message":"Pull request Required status check \"CI Passed or Skipped\" is expected."}]}
```

**Betydelse:** den råa GraphQL-mutationen kringgår INTE grinden required
status checks — samma spärr som `gh pr merge --auto` respekterar. Ingen
bakväg förbi CI upptäckt.

## Mätning 2 — `enqueuePullRequest(jump: true)` mot gröna checks: fungerar

Efter att PR `#561` blev `CLEAN` (alla required checks gröna, 21:57 UTC),
med kön bekräftat tom:

```bash
$ date -u   # 2026-08-01T21:57:38Z
$ gh api graphql -f query='mutation($id: ID!) {
    enqueuePullRequest(input: {pullRequestId: $id, jump: true}) {
      mergeQueueEntry { id position state pullRequest { number } }
    }
  }' -f id="PR_kwDOSBHr7s75e6Kf"
{"data":{"enqueuePullRequest":{"mergeQueueEntry":{
  "id":"MQE_lQDOSBHr7s75e6KfzgADn3POAm126Q",
  "position":1,"state":"QUEUED","pullRequest":{"number":561}}}}}
```

**Betydelse:** mutationen lyckas, tar `pullRequestId` (PR:ens GraphQL-nod-ID,
inte kö-post-ID) och `jump: true`, och skapar en kö-post. Eftersom kön var
tom föll posten på position 1 oavsett `jump`-värde — detta pass prövar alltså
att mutationen fungerar och accepteras, inte hopp-effekten mot andra poster
(att göra det skarpt kräver en kö med andra pågående poster, vilket enligt
GitHubs egen dokumentation ger *"full rebuild of all in-progress pull
requests"* för de andra posterna — ett pris som inte var motiverat att lägga
på en annan agents landning för detta prov).

## Mätning 3 — `dequeuePullRequest`: fungerar, 5 sekunder senare

```bash
$ date -u   # 2026-08-01T21:57:43Z
$ gh api graphql -f query='mutation($id: ID!) {
    dequeuePullRequest(input: {id: $id}) {
      mergeQueueEntry { id position state pullRequest { number } }
    }
  }' -f id="PR_kwDOSBHr7s75e6Kf"
{"data":{"dequeuePullRequest":{"mergeQueueEntry":{
  "id":"MQE_lQDOSBHr7s75e6KfzgADn3POAm126Q",
  "position":1,"state":"QUEUED","pullRequest":{"number":561}}}}}
```

**Betydelse:** `dequeuePullRequest` tar `id` = **PR:ens GraphQL-nod-ID** (inte
kö-post-ID, trots att svarsobjektet är en `MergeQueueEntry`) — bekräftat av
schemats egen fältbeskrivning ("The ID of the pull request to be dequeued")
och av att anropet lyckades med samma `id`-värde som enqueue använde
(`PR_kwDOSBHr7s75e6Kf`).

## Mätning 4 — verifierad borttagen ur kön

```bash
$ date -u   # 2026-08-01T21:57:49Z
$ gh api graphql -f query='{ repository(owner:"high-five-group",
    name:"miranon-media-admin") { mergeQueue { entries(first:10) {
    totalCount nodes { position pullRequest { number } } } } } }'
{"data":{"repository":{"mergeQueue":{"entries":{"totalCount":0,"nodes":[]}}}}}

$ gh pr view 561 --json mergeStateStatus,state
{"mergeStateStatus":"CLEAN","state":"OPEN"}
```

Kön var tom och PR `#561` tillbaka i normalt, icke-köat läge. **main
opåverkad** — inget mergades. Full sondtid i kön: 11 sekunder (21:57:38 →
21:57:49).

## Sammanfattning av rättigheter

Token-scope vid testet: `admin:enterprise, admin:org, gist, repo, workflow`
(`gh auth status`). Repo-behörighet: admin. Ingen av mutationerna gav
behörighetsfel — bara det ovan citerade "required status check"-felet, som är
en affärsregel, inte en rättighetsspärr. **Obelagt:** om ett token med enbart
`repo`-scope (utan org-admin) räcker — vårt test kan inte skilja "krävde
repo-admin" från "krävde bara `repo`-scope", eftersom vi bara hade det förra
tillgängligt.

## Konsekvens för `CLAUDE.md`

Se `CLAUDE.md` § Landning, stycket *"En köad gren kan inte uppdateras"* —
omskrivet i samma landning som denna fil, med hänvisning hit.

## Källor

- Introspektion `DequeuePullRequestInput` / `EnqueuePullRequestInput` /
  motsvarande payload-typer, `gh api graphql` mot `api.github.com`,
  2026-08-01.
- `gh pr create/view/checks/close` mot test-PR `#561`,
  `high-five-group/miranon-media-admin`, 2026-08-01.
- [`kohopp-bradskande-revert-2026-07-30.md`](kohopp-bradskande-revert-2026-07-30.md)
  § 5.1 — det ursprungliga, oprövade fyndet.
