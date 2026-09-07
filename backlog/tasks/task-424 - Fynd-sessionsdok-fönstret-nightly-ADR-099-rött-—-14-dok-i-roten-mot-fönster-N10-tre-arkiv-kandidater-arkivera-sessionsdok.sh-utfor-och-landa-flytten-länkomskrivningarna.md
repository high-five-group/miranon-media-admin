---
id: TASK-424
title: >-
  Fynd: sessionsdok-fönstret (nightly, ADR-099) rött — 14 dok i roten mot
  fönster N=10, tre arkiv-kandidater; arkivera-sessionsdok.sh --utfor och landa
  flytten + länkomskrivningarna
status: To Do
assignee: []
created_date: '2026-09-07 15:30'
updated_date: '2026-09-07 15:52'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 754000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Nightly-körning 34088565869 på a29d8192:s föregångare d99db0ec (2026-09-07 05:54 UTC), jobbet 'Sessionsdok-fönstret (natt-grind, ADR-099)' rött; reproducerat lokalt 2026-09-07 (S123 resume 1): 'bash scripts/check-sessionsdok-fonster.sh' exit 1 med 'DRIFT: roten bär 3 arkiv-kandidat(er) — fönstret (N=10) är överskridet', torrkörningen rapporterar Kvar 14, Flaggade (fail-closed) 3, Skulle arkiveras 3, Länkreferenser som skulle omskrivas 31 (Pass A 31, Pass B 0). Grinden har varit röd sedan 2026-09-05 (S123 Del 1 § Ingångstillstånd). Åtgärd: kör 'scripts/arkivera-sessionsdok.sh --utfor' enligt grindens egen anvisning, landa flytten och länkomskrivningarna som D0-PR. De tre FLAGGADE dokumenten hanteras enligt skriptets egen fail-closed-anvisning — aldrig genom att kringgå den. Dok med lifecycle paused eller active får aldrig flyttas (S112, S118, S122 pausade; S123 aktiv).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 scripts/check-sessionsdok-fonster.sh exit 0 lokalt efter flytten, utdatan bokförd i notes
- [x] #2 Samtliga omskrivna länkreferenser verifierade: npm run check:docs 14/14 gröna (länkkontrollen ingår)
- [x] #3 Inget dok med lifecycle paused eller active flyttat; de tre flaggade dokumenten bokförda med skriptets skäl och vald hantering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Utfört (TASK-424)

`bash scripts/arkivera-sessionsdok.sh --utfor` kört 2026-09-07 (exit 0):
3 arkiverade, 31 länkreferenser omskrivna (Pass A 31, Pass B 0), 14 kvar
i roten, 3 flaggade.

### AC #1 — check-sessionsdok-fonster.sh efter flytten

```
$ bash scripts/check-sessionsdok-fonster.sh
...
Roten ryms redan inom fönstret — inga arkiv-kandidater.

── Summering ──
Kvar:              14
Flaggade:          3
Arkiverade:        0

GRÖNT — roten ryms inom fönstret (N=10).
```
Exit 0 (var exit 1 med DRIFT-meddelande före flytten, exakt reproducerat
per uppdraget).

### AC #3 — de tre flaggade dokumenten

Skriptets skäl (verbatim): "FLAGGAD <filnamn> — oparsbar lifecycle
(fail-closed, rörs aldrig automatiskt)" för samtliga tre:
`2026-06-12-session-16.md`, `2026-06-13-session-17.md`,
`session-20-scope-seed.md`. Verifierat: alla tre saknar `lifecycle:`-fältet
helt (frontmatter bär `owner`/`updated`/`review_by`/`status`, pre-ADR-052 —
matchar ADR-099 § Kontext ordagrant). Vald hantering: LÄMNADE ORÖRDA i
roten enligt uppdragets instruktion ("hanteras enligt skriptets egen
fail-closed-anvisning — aldrig genom att kringgå den") — ingen
lifecycle-tillägg, ingen manuell arkivering. `git diff` mot alla tre
bekräftar noll ändring efter körningen.

Lifecycle active/paused-dokumenten (S112, S118, S122 paused; S123 active)
verifierade orörda individuellt (`git diff --quiet`, exit 0 på var och en)
och kvar på sin rot-sökväg efter körningen.

### AC #2 — check:docs

`npm run check:docs` → "✅ 14 gröna" / "check:docs grönt — samtliga 14
dokumentations-grindar körda." (exit 0). Länkkontrollen (lychee) ingår i
de 14 och validerade samtliga 31 omskrivna referenser.

### Divergens mot uppdragets "D0-PR"-premiss

Diffen innehåller två `.ts`-filer
(`supabase/functions/_shared/receipt-content.ts`,
`supabase/functions/_shared/utkast.ts`) vars kommentarer citerade den
flyttade sessionsdok-sökvägen och skrevs om av skriptets Pass A
(dokumenterat, avsett beteende — "NÅGON git-spårad fil UTANFÖR arkivet").
`.ts`-filer under `supabase/functions/**` matchar INGEN post i ci.yml:s
D0-allowlist (`paritet:start klassning-d0`, rad 219–249) — PR:en klassas
alltså INTE som D0 av CI:s egen `changed`-jobb, till skillnad från
uppdragets premiss. Ändringen i båda filerna är rent kommentar-text (en
sökvägscitering), noll funktionell kod rörd — verifierat med `git diff`.
Åtgärd: körde utöver de begärda docs-grindarna även full lokal DoD
(`typecheck`, `biome check`, `build`, `test:api`) som säkerhetsmarginal —
samtliga gröna utom `api-staging`-projektet (9 av 2281 test, alla i filer
jag inte rört: get-person/get-registrations/generate-event-attachment/
preview-receipt/rebook-registration/send-registration-confirmation
`.staging.test.ts`), vilket är förenligt med pre-existerande
staging-miljö-flakighet och OBEROENDE av denna diff — `ci.yml` sätter
`run_staging: false` VILLKORSLÖST för både `pull_request` och
`merge_group` (rad ~2145), så api-staging körs aldrig i PR-grinden.
`api-pure`-delen (1757 test) var 100 % grön.
<!-- SECTION:NOTES:END -->
