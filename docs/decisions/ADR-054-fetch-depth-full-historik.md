# ADR-054: fetch-depth: 0 (full historik) — finit djup var anti-mönstret

- Status: Accepted (Session 22 — 2026-06-17; ratificerad av Marcus i direktion, byggs omedelbart)
- Datum: 2026-06-17
- Fas: Session 22 — Fas 5.5 K2 enabling-detour (CI-rotorsak-fix, ingen byggfas)

## Kontext

`scripts/check-frontmatter.sh` Check 2 verifierar att en governing-docs `updated:`-fält
matchar filens senaste commit-datum (`git log -1 --format=%cs -- <fil>`). För att det ska
vara tillförlitligt måste CI checka ut tillräckligt med historik för att nå filens sanna
ändrings-commit. Värdet styrdes av en finit `fetch-depth` som hölls enhetlig över sex bärare
(ci.yml × 4 jobb + `.frontmatter-policy.conf` + `check-frontmatter.sh`-default), CI-grindad
av fetch-depth-invarianten ([ADR-039](ADR-039-konsistens-grindar-kadens.md)).

Det finita djupet har nu brustit en **fjärde** gång:

| # | Session | Bump | Utlösare |
|---|---|---|---|
| 1 | 6.7 / 7 K0.S2 | `50 → 100` | Commit-tunga sessioner sköt governing-docs förbi djup 50 |
| 2 | 9 | `100 → 250` | 5 av 9 docs passerade djup 100 (värsta 115) |
| 3 | (latent) | — | Marginal-erosion mellan bumparna |
| 4 | 22 | (denna) | En **dok-commit** sköt fönstret `263 → 264` |

I Session 22 fälldes tre **orörda** governing-docs (`SECURITY-SPEC.md`,
`hur-systemet-funkar.md`, `data-model.md`) på falsk drift: deras sanna ändrings-commit
(`91b6337`, committer-datum 2026-05-17) hamnade på position 264 från HEAD — precis utanför
`fetch-depth: 250`. När `git log -1 -- <fil>` inte når den sanna committen returnerar den
shallow-clone-boundaryns commit som **proxy**, vars datum (2026-05-18) inte matchar `updated:`.
En enda ny commit räckte för att tippa gränsen över ett kalenderdygn. Lokalt (full clone)
passerade alla nio docs — divergensen var rent miljöberoende.

[ADR-039](ADR-039-konsistens-grindar-kadens.md):s Session 9-erratum förutsåg detta uttryckligen:
*"Tredje upprepning av detta mönster ska lyftas till egen ADR ... inte denna gång."* Samma
profetia bärs av L62 (K9.7). Detta är den ADR:n.

## Beslut

Sätt `fetch-depth: 0` (= **hela historiken**) i samtliga sex levande bärare, atomiskt i en
commit (L63 — ett värdes yttringar måste flyttas tillsammans, annars ljuger en bärare om
världen). Tröskel-parametern `FRONTMATTER_MIN_HISTORY_DEPTH` följer med till `0`.

`fetch-depth: 0` är det **kanoniska** svaret för git-log-historik-beroende checks, inte ett
större finit tal. `actions/checkout`-dokumentationen anger värdet direkt: *"Number of commits
to fetch. 0 indicates all history for all branches and tags"*
(`github.com/actions/checkout`, `with.fetch-depth`). När en check fundamentalt beror på att nå en godtyckligt gammal
commit är varje finit djup en lott mot commit-takten — finit djup **är** anti-mönstret, inte
ett dåligt val av konstant. Perf-kostnaden är trivial för repots storlek (~500 commits).

## Alternativ övervägda

- **Femte finita bump (`250 → 500`).** Avvisat: skjuter bara upp den femte bristen. Behandlar
  symptomet (marginalen) i stället för rotorsaken (finit djup mot obegränsat commit-avstånd).
- **Koppla `updated:` till changed-files (kör Check 2 bara på docs i diffen).** Genuint
  attraktivt — det skulle göra hela fetch-depth-apparaten onödig. Men det är en större,
  ortogonal omläggning av frontmatter-grindens topologi och förtjänar egen ADR + egen session.
  Deferrad som tråd **T08** (se nedan), blockerar inte denna fix.

## Konsekvenser

- **Shallow-detektionen blir en no-op.** Hard-fail-villkoret i `check-frontmatter.sh`
  (`IS_SHALLOW=true AND COMMIT_DEPTH < MIN_DEPTH`) kan med tröskel `0` aldrig bli sant
  (`count < 0`). Det är **acceptabelt och avsiktligt**: den kanoniska CI-konfigurationen är nu
  full-clone, så defense-in-depth-lagret mot shallow-clone-bugg
  ([ADR-033](ADR-033-shellcheck-strict-grindvakt.md) K4, L8) skyddar mot ett tillstånd som
  inte längre kan uppstå i CI. Logiken står kvar i koden
  (regression-testad via explicit positiv override-tröskel i T10/T11a/T11b) tills apparaten
  avvecklas.
- **Invarianten består.** [ADR-039](ADR-039-konsistens-grindar-kadens.md):s ägarskap är
  oförändrat: alla sex bärare hålls enhetligt på `0`; `check-fetch-depth-invariant.sh` grindar
  det fortsatt. ADR-029 + ADR-030 + ADR-039 bär additiva, daterade errata som pekar hit.
- **Öppen rivning med kvittens.** [ADR-030](ADR-030-docs-grindvakter-frontmatter-policy.md):s
  finit-djup-rationale (*"fetch-depth: 50 (eller mer)"*) är falsifierad och rivs öppet — inte
  tyst patchad. Tidigare beslutstext + errata bevaras oförändrade (immutabilitet).

## Deferrad tråd

**T08 — Skala Check 2 till ändrade governing-docs → avveckla fetch-depth-apparaten.** Kör
Check 2 (updated-match) enbart på governing-docs som finns i aktuell diff (changed-files-
mönstret); behåll Check 1/3/4/5 kontinuerligt på alla nio. Då blir shallow-detektionen,
fetch-depth-invarianten (ADR-039), sex-bärar-apparaten och dessa errata onödiga. Egen ADR,
egen session. Registrerad `paused` i [`tasks/threads/README.md`](../../tasks/threads/README.md).
