# ADR-076: Merge-grinden — ruleset på main + PR-flöde för samtliga landningar

- Status: Accepted
- Datum: 2026-07-23
- Fas: Meta (Session 77 — processgransknings-landningen, våg 1)

> **Korrigering (Session 77 samma dag, 2026-07-23 — skipped-aggregator-hålet):** Bevis-sektionens BLOCKED→auto-merge-bevis höll för grön kedja (PR #99/#100), men grinden hade ett fail-open-hål: aggregator-jobbet kunde SKIPPAS när ett needs-jobb var failure, och GitHub räknar en skippad required check som UPPFYLLD — PR nr 101 auto-mergades därför RÖD (runs 30023934304/30024005788; main-backstopen fångade inom minuter). Stängt samma dag i fix-PR:n: aggregatorn kör alltid (`if: always()` ensamt) och failar explicit på failure/cancelled i needs (L322). Detta var ADR-029 utelämning #5:s ANDRA halva — dual-signal-behovet — som inte konsumerades vid stängningen (L321-klassen i praktiken). Required-checken är först härmed fail-closed; fail-grenens gate-proof = öppen bevis-skuld (T85 våg 2a).

## Kontext

Den externa processgranskningen
([docs/research/arbetsflode-processgranskning-2026-07-23.md](../research/arbetsflode-processgranskning-2026-07-23.md),
Codex) fann att `main` saknade branch protection: CI var en överenskommelse,
inte en mekanisk merge-grind. Codes verifikation samma dag (svars-sektionen i
samma dok) bekräftade varje delpåstående och lade till forensiken: luckan var
en MEDVETEN deferral — ADR-029 § Medvetna utelämningar #5 sköt aktiveringen
på framtiden 2026-05-13, `ci-passed`-aggregatorn byggdes uttryckligen
"branch-protection-required-stable", och deferralen återupptogs aldrig.
[ADR-036](ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md) gjorde CI
till enda mekaniska innehålls-grind men lämnade merge-punkten omekaniserad.
Skärpande empiri: PR #94:s enda registrerade review satt på den avsiktligt
RÖDA committen och fem commits följde ogranskade till merge — utan mekanisk
grind gäller granskningen inte slutlig SHA.

Solo-formens paradox: klassiskt PR-krav med approvals är omöjligt (GitHub
räknar inte själv-godkännande). Repot är publikt (ADR-024) och User-ägt —
rulesets är kostnadsfritt tillgängliga; merge queue är det INTE (kräver
org-ägt repo).

## Beslut

1. **Ruleset `main-skydd`** (id 19627609, aktiverat 2026-07-23) på
   default-branchen med fyra regler:
   - `deletion` + `non_fast_forward` — main kan inte raderas eller
     historik-omskrivas.
   - `pull_request` med `required_approving_review_count: 0` — ALLT når
     main via PR (0 approvals löser solo-paradoxen: grinden är CI:n, inte
     ett själv-godkännande).
   - `required_status_checks`: **"CI Passed or Skipped"**
     (aggregator-jobbet, ADR-029 §1e) med
     `strict_required_status_checks_policy: true` — checken gäller senaste
     SHA och branchen måste vara up-to-date (förutsättningen för våg 2:s
     merge-dedup: merge-tree ≡ PR-head-tree).
2. **Tom bypass-lista.** Enda aktören är samma konto som admin; skyddet
   riktar sig mot agent-/automations-misstag, inte illvilja. Nödvägen är
   att synligt inaktivera rulesetet (spårbart i ruleset-historiken) —
   aldrig en tyst gräddfil.
3. **Auto-merge aktiverat** (`allow_auto_merge`) och **PR-flöde för
   samtliga landningar, inklusive bokföring** (Marcus beslut A,
   2026-07-23): branch → `gh pr create` → `gh pr merge --auto --merge`;
   docs-only-CI ≈ 1 min ger +1–2 min landningslatens. Merge-metoden är
   merge commit (husets historik-form).
4. Kanonisk ruleset-konfig (återskapnings-underlag). **Uppdaterad S88
   2026-07-25** — blocket härlett VERBATIM ur live-GET, inte handskrivet.
   Den tidigare versionen hade driftat: tre fält som API:t sätter
   (`allowed_merge_methods`, `required_reviewers`, `do_not_enforce_on_create`)
   saknades, vilket gjorde underlaget lossy — en `PUT` av det gamla blocket
   hade tyst nollat dem. Det finns **ingen PATCH** för rulesets; `PUT` är full
   objekt-ersättning, så återskapning MÅSTE ske från ett komplett block.

   ```json
   {
     "name": "main-skydd",
     "target": "branch",
     "enforcement": "active",
     "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
     "bypass_actors": [],
     "rules": [
       { "type": "deletion" },
       { "type": "non_fast_forward" },
       { "type": "pull_request", "parameters": {
           "allowed_merge_methods": ["merge"],
           "required_approving_review_count": 0,
           "required_reviewers": [],
           "dismiss_stale_reviews_on_push": false,
           "require_code_owner_review": false,
           "require_last_push_approval": false,
           "required_review_thread_resolution": false } },
       { "type": "required_status_checks", "parameters": {
           "strict_required_status_checks_policy": true,
           "do_not_enforce_on_create": false,
           "required_status_checks": [
             { "context": "CI Passed or Skipped", "integration_id": 15368 } ] } }
     ]
   }
   ```

5. **App-bindning på required check** (tillagd S88 2026-07-25, T85-paketets
   punkt 4). `integration_id: 15368` = GitHub Actions, verifierat två
   oberoende vägar: appen som faktiskt publicerar checken på en färsk
   main-commit (`commits/{sha}/check-runs` → `app.id`), och `/apps/github-actions`.

   Utan bindningen räckte det att publicera **namnet** `CI Passed or Skipped`
   för att uppfylla grinden. Hotet var konkret, inte teoretiskt: repot har en
   andra app med `checks:write` installerad, och `POST /repos/.../statuses/{sha}`
   låter vilken write-token som helst sätta kontexten direkt. Den ytan var
   helt oanvänd (`total_count: 0`), så bindningen bröt ingen legitim trafik.

   Riktningen är fail-closed: uteblir Actions-checken förblir PR:n blockerad.
   **Ärlig avgränsning** — bindningen stoppar andra *aktörer*, inte något som
   körs *inne i* Actions (fortfarande app 15368). Den stänger
   förfalsknings-hålet, inte workflow-integritet.

   `gate-proof.yml`:s replik heter `CI Passed or Skipped (replik under bevis)`
   — distinkt kontext, opåverkad.

6. **Merge-only som husregel** (Marcus-beslut S88 2026-07-25, T85-paketets
   beslutsfråga 4). `allowed_merge_methods` låst till `["merge"]`; squash och
   rebase är inte längre valbara.

   Skälet är inte historik-estetik utan **dedupens förutsägbarhet**:
   merge-dedupen (task-36.4) hittar PR-trädet via `HEAD^2`, merge-commitens
   andra förälder. Squash och rebase skapar ingen sådan förälder, så dedupen
   går fail-closed och kör hela sviten igen.

   Ingenting *går sönder* utan låset — men tidsvinsten försvinner **tyst**,
   och en tyst prestandaförlust är svårast att upptäcka i efterhand. Låset
   kostar samtidigt ingenting: merge var redan den enda metod huset använder
   (`gh pr merge --auto --merge` i hela flödet).

## Alternativ som övervägdes

- **B — bypass för ägaren** (direktpush som förut): förkastat — grinden
  skulle inte täcka husets största felkälla (agent-misstag går rakt
  igenom), och skyddet blir teater.
- **C — path-villkorat undantag för bokföring**: inte rent implementerbart
  — rulesets kan inte villkora required checks per fil-path på push-nivå.
- **Classic branch protection** i stället för ruleset: förkastat —
  rulesets är GitHubs aktiva spår (API-först, synlig
  inaktiverings-historik, framtida bypass-audit).
- **Merge queue**: otillgänglig i ägarformen (User-ägt repo; kräver org).
  Strict up-to-date + required check på senaste SHA ger huvudskyddet.

## Bevis (grind-bevisen, 2026-07-23)

- Direktpush mot main → **avvisad**: "Changes must be made through a pull
  request" + "Required status check 'CI Passed or Skipped' is expected"
  (`push declined due to repository rule violations`).
- PR #99 med auto-merge armerad → `mergeStateStatus: BLOCKED` medan CI
  körde — merge mekaniskt spärrad till grön aggregator; mergen utförd av
  auto-merge först efter grönt (run-referens i sessionsdok S77).
- `deletion`/`non_fast_forward` verifierade som aktiva via
  API-återläsning (konfig-bevis; ett skarpt historik-omskrivningstest mot
  levande main konstruerades medvetet inte — rationale över bokstaven).
- Avsiktligt rött ingår INTE i bevisformen (L317 + rött-först-bärarbytet,
  beslut A — verkställs som ADR-071-amendering i våg 2c).

## Konsekvenser

- CI är nu merge-grind på riktigt: CONTRIBUTING § Pull Request-flödets
  formulering blir mekanisk sanning i stället för överenskommelse
  (CONTRIBUTING uppdaterad i samma landning).
- All bokföring (sessionsdok, backlog-flips, trådar, todo) landar via
  auto-merge-PR — PR-nummer i historiken även för docs; latens +1–2 min.
  Sessions-skillsens verb "committa + pusha" uppfylls via PR-flödet
  (ingen hub-ändring krävs; formen är repo-lokal mekanik).
- Strict up-to-date serialiserar PR-landningar — samma seriella form som
  ADR-073-orkestreringen redan kör; vid parallella PR:er krävs
  branch-uppdatering innan auto-merge fyrar.
- ADR-029 utelämning #5 stängd (additiv not där); utelämning #3 stängd i
  samma våg (actionlint release-pinnad, PR #99).
- Deferral-klassens rot — medveten utelämning utan återbesöks-trigger —
  adresseras i sessionens lessons-skörd.
