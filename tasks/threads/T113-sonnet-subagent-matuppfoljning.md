---
owner: marcus803
updated: 2026-08-01
review_by: 2026-09-01
status: stable
lifecycle: active
---

# T113 — Sonnet-subagent-mätuppföljningen

> **Registrerad 2026-08-01**, ur uppdraget för stängningspaketet efter
> #551/#557. Mäter effekten av modellbytet PR #557 gjorde, mot `T110`:s
> baslinje och mot eskalationsregeln Marcus beslutade samma dag.

## Proveniens

PR #557 (`aac16c757ce9319b4d5a3db7cfc790187c8e867e`, MERGED — se § Källdivergens
nedan) satte `model: sonnet` i `.claude/agents/bygg-agent.md` och
`.claude/agents/research-pass.md` (Marcus GO 2026-08-01; verifierat mot disk:
båda filernas frontmatter bär `model: sonnet`). Tidigare ärvde bygg-agenter och
research-pass-agenter huvudloopens modell, `claude-fable-5[1m]`, med `xhigh`
reasoning-effort.

## Källdivergens — bokförd, inte tystad (ADR-086)

Uppdraget angav PR #557:s merge-SHA som `d0a49b28`. Verifierat mot
`gh pr view 557 --json mergeCommit`: den faktiska merge-SHA:n är
`aac16c757ce9319b4d5a3db7cfc790187c8e867e`. `d0a49b28` matchar ingen commit i
detta repos historik för PR #557. Denna tråd bär den VERIFIERADE SHA:n, inte
uppdragets. Ren siffer-/hash-divergens av `T110`-klass I (räknade tal/hash);
påverkar inte sakinnehållet (rätt PR, rätt filer, rätt ändring — bekräftat med
`gh pr diff 557 --name-only`).

## Vad som mäts

Tre axlar, jämfört löpande mot läget FÖRE bytet:

1. **First-pass-grönt per PR-jobb** — andel bygg-agent-PR:er vars FÖRSTA
   CI-körning (ej merge_group-omkörning) är grön i samtliga obligatoriska jobb,
   utan iteration.
2. **Premiss-pass-fångster mot `T110`-baslinjen** — `T110`:s första
   uppdragsrevision (2026-08-01, körd mot session `fd0eef00` på
   `claude-fable-5[1m]`/xhigh) mätte **192 prövbara faktapåståenden, 6 hårda
   fel (3,8 % av avgjorda, 64 % källmärkta)** över 34 uppdrag. Denna tråd
   jämför samma mätning (`npm run revision:uppdrag`,
   `scripts/uppdragsrevision.mjs`) körd över en session dominerad av
   Sonnet-spawns, när ett jämförbart antal skivor finns.
3. **Eskalationsfrekvens** — hur ofta en skiva träffar eskalationsregeln
   nedan, som andel av byggda skivor.

## Eskalationsregel (beslutad 2026-08-01, Marcus GO)

**Fäller en skiva två gånger → respawn med `model: fable` via Agent-anropets
`model`-parameter** (inte genom att ändra agentdefinitionens frontmatter — den
förblir `sonnet` som default för nästa skiva). "Fäller" avser CI-röd eller
avvisad kö-post på samma skiva, oavsett orsak (för att skilja modell-relaterade
fel från miljöbrus krävs `T115`-klassens transienter uteslutas manuellt vid
bedömning — se `TASK-115`).

## Mätpunkt 1 — denna spawn

Denna agent-körning (worktree `agent-a5c74d1b2d9960a5a`, stängningspaketet
efter #551/#557: TASK-113→Done, TASK-115-notering, minting av denna tråd) körs
på `model: sonnet` per `.claude/agents/bygg-agent.md`s frontmatter, verifierat
vid start av detta uppdrag.

- **Premiss-pass:** samtliga verifierbara premisser i uppdraget prövade mot
  disk/`gh` FÖRE arbetet påbörjades (se slutrapportens § Premiss-pass för full
  lista). **En divergens funnen:** PR #557:s SHA (§ Källdivergens ovan).
  Övriga ~15 prövade premisser (run-ID:n, jobbnamn, exit-koder, citat ur
  CI-loggar, kort-innehåll, senaste tråd-nummer, agentfilernas `model`-fält)
  höll exakt.
- **First-pass-grönt:** OKÄNT vid skrivandets tillfälle — denna spawn parkerar
  aldrig på sin egen landnings-vakt (per `.claude/agents/bygg-agent.md` § Parkera
  aldrig på en landnings-vakt), så CI-facit för denna PR är inte tillgängligt
  när tråden skrivs. **Fylls i av nästa läsare** (orkestrerarens svep eller
  nästa spawn) mot detta PR-nummer, inte antas här.
- **Eskalation:** 0 vid skrivandets tillfälle (första mätpunkten i serien; ingen
  tidigare Sonnet-skiva att jämföra mot inom denna tråd).

## Vad som saknas för att tråden ska bära en riktig jämförelse

- Ett mätbart "cirka 10 skivor byggda på Sonnet" — denna tråd registrerar
  serien, den utför inte en retrospektiv räkning av hur många skivor som redan
  gått genom Sonnet sedan #557 landade. Det är nästa läsares första uppgift
  om axel 1–2 ska fyllas i med riktiga tal.
- En andra `uppdragsrevision`-körning (axel 2) — `T110` var tydlig: "Effektpåståenden
  förblir förbjudna tills revision n≥2". Den här tråden ÄR den andra körningens
  hemvist när den görs.

## Släktskap

`T110` (orkestrerarens felklasser — baslinjen denna tråd jämför mot, och
källan till premiss-pass-disciplinen som ADR-086 mekaniserade) ·
`ADR-086` (uppdragets premisser prövas av mottagaren — mekanismen § Mätpunkt 1
tillämpar) · `TASK-115` (G0-transienten — måste uteslutas manuellt vid
eskalationsbedömning, se § Eskalationsregel).
