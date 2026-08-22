---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-22
status: stable
lifecycle: active
---

# T171 — Verkliga personuppgifter ur Airtable-basen ligger i det publika repot

> Registrerad i S108 (2026-08-22) på Marcus order (*"Regga tråden är du
> snäll"*), efter att en bygg-agent flaggade ett kundnamn i en test-fixture
> och orkestrerarens mätning visade att det var ett mönster, inte ett
> undantag. **`active`** — repot är `PUBLIC` (`gh repo view`), och
> uppgifterna är läsbara för vem som helst i dag.

## Vad som är mätt (2026-08-22, `origin/main` `9d4f3167`)

| Klass | Exempel | Var | Mätt med |
|---|---|---|---|
| Kundnamn ur kvittoförlagan, kopplat till ett köp | (pseudonymiserad i `#1786`) | 7 ytor: test-fixture, kodkommentar, `ADR-109`, research, `T170`, tre sessionsdok | `git grep` |
| Verkliga personnamn ur basen, citerade som dubblett-/defektbevis | fem kända namn | **≥ 13 filer**: `docs/reference/data-model.md`, `docs/BUILD-LOG.md`, `docs/backfill/execute-log.md`, `docs/backfill/segment-export/export.mjs`, fyra research-dok, `task-229`, `tasks/lessons/vol-04.md`, `todo.md`, `threads/README.md` | `git grep -l -E` på fem namn — **undre gräns**, fler namn finns säkert |
| **Live-dump av anmälda** med fullständiga namn, tidsstämpel, status | tabellen `\| ID \| Skapat \| Namn \| Status \| Typ \|` | `docs/research/datamodell-research/02-live-state.md` rad ~608 ff | läsning |
| Verkliga e-postadresser | `K***@hotmail.com` (maskad i `#1786`) + minst fyra gmail-adresser | research/backfill | regex över repot, allowlist för test-/exempel-domäner |

Det som INTE är personuppgift och får stå kvar: Airtable record-ID:n
(`recXXXX`), anmälnings-ID:n, belopp, datum utan namn, Roger & Lottas egna
firma-uppgifter (publika på ett kvitto de själva skickar).

## Varför det hände — arbetssättet, inte slarv

Basdefekt-kartläggningen (S102–S106) och backfillen bevisar dubbletter och
länkfel genom att citera de verkliga records som är fel: *"Ulrika X bär två
Person-records"* är beviset. Det är rätt metod — och fel medium. Beviset
behöver record-ID:t och EN stabil pseudonym, aldrig namnet. Samma sak för
kvittoförlagan: vi behövde strukturen och talen, aldrig kunden.

## Vad tråden ska leverera

1. **Pseudonymisera på `main`** — alla klasser ovan, en stabil pseudonym per
   person (så dubblett-bevisen fortfarande går att följa), e-post maskad
   till `X***@domän`. Live-dumpen i `02-live-state.md`: ersätt namnkolumnen
   eller ta bort tabellen (ID + tidsstämpel räcker för dess poäng).
2. **Citeringsregel** i `CLAUDE.md` § Instruktioner eller `data-model.md`:
   basdata citeras med record-ID + pseudonym; förlagor med persondata
   pseudonymiseras vid FÖRSTA citatet, inte vid upptäckt. Lesson-kandidat
   `[UNIVERSAL]`.
3. **Grind, om Marcus vill:** en e-postregex-vakt i `check:docs` med
   allowlist (`example.com`, `*.test`, `miranon.se`, firmadomänerna) —
   billig, fångar klassen som är lättast att matcha mekaniskt. Namn går
   inte att grinda; där bär regeln.
4. **Git-historiken** — separat Marcus-beslut. Uppgifterna finns kvar i
   commits även efter punkt 1. History-rewrite (`git filter-repo` +
   force-push + GitHub-support för cachade vyer) är irreversibel och
   påverkar alla worktrees och parallella sessioner; görs i så fall i ett
   eget, tomt fönster.

## Vad som är gjort

- `#1786` (S108, 2026-08-22): kvittoförlagans kund pseudonymiserad i alla
  sju ytor, den lokala PDF:en omdöpt, en e-postadress maskad.

## Öppet

- Punkt 1–4 ovan. Punkt 1 är en bygg-agent-enhet med `git grep` som facit;
  punkt 2 är en CLAUDE.md-rad; punkt 3 och 4 är Marcus-beslut.
