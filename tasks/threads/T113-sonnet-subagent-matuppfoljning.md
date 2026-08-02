---
owner: marcus803
updated: 2026-08-02
review_by: 2026-09-01
status: stable
lifecycle: paused
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

## Mätpunkt 2 — S91:s tjugoandra resume (2026-08-02)

### Axel 2 (`uppdragsrevision`-körning #2) — KORRIGERING: fortfarande ingen Sonnet-datapunkt

Uppdragsrevisionens körning #2 (`docs/research/uppdragsrevision-korning-2-2026-08-02.md`,
PR [#573](https://github.com/high-five-group/miranon-media-admin/pull/573),
verifierat **OLANDAD** 2026-08-02 — grenen `docs/uppdragsrevision-korning-2-t110-t113`
läst direkt via `git show`) mätte session `f1ff4bcd…` (artonde resumen) +
`ae112ab2…` (nittonde resumen): **30 uppdrag, 188 prövbara påståenden, 11
hårda fel (6,25 % av avgjorda), 56,9 % källmärkta** — mot baslinjens
`fd0eef00…` (34 uppdrag, 192 påståenden, 6 hårda fel = 3,8 %, 64 %
källmärkta).

**Kritisk korrigering mot vad som troddes vara läget:** rapporten verifierar
själv (`modell: null` på samtliga 30 Agent-anrop) att **BÅDA** de mätta
sessionerna föregår Sonnet-omställningen (PR #557). T113:s axel 2 väntar
alltså fortfarande på sin **FÖRSTA** Sonnet-datapunkt, inte sin andra — n=2
är en pre-Sonnet-mot-pre-Sonnet-jämförelse (bakgrundsvarians inom samma
regim), och bär **noll** information om Sonnet-effekten. Ingen
effektslutsats dras här, i linje med rapportens egen disciplin.

**Nästa revision** ska riktas mot transcriptet för S91:s tjugoandra resume
(session `a964302a-1c0e-4bb6-ad0f-f6842bb80a21`, 2026-08-01→02) — den bär
vågens Sonnet-bygguppdrag (#563–570, 574 nedan) och är den första
transcript-källan där `model: sonnet` faktiskt var satt vid spawn-tillfället.

### Axel 1 (first-pass-grönt) — vågens Sonnet-bygg-PR:er

Verifierat 2026-08-02 via `gh pr view <N> --json ...mergeCommit,commits` +
`gh api .../attempts/1/jobs` mot samtliga åtta PR:er ur tjugoandra resumens
byggvåg: `#563` (TASK-117, stop-vakt-wiring) · `#564` (TASK-110,
test-bas-flytt) · `#565` (TASK-99, dequeue/enqueue-fynd) · `#566` (restlista)
· `#567` (TASK-111, resend-bump) · `#569` (TASK-115, G0-retry) · `#570`
(TASK-79, flake-karakterisering) · `#574` (stängningsbatch).

- **Commit-form:** samtliga åtta bär **exakt 1 commit** — inga
  fixup-/iterations-pushar, konsekvent med "grönt på första försöket".
- **Check-utfall:** samtliga status-checks på samtliga åtta PR:er är
  `SUCCESS`/`SKIPPED` — noll `FAILURE`-conclusions bland dem själva.
- **Landningsstatus, korrigerad mot uppdragets påstående:** uppdraget angav
  *"samtliga landade first-pass"*. Vid verifieringstillfället (2026-08-02) var
  **6 av 8 `MERGED`** (#563 `9f45d3c0`, #564 `57238a19`, #565 `76432065`,
  #566 `b2f02a5d`, #567 `4499635f`, #570 `56f50632`) och **2 av 8 fortfarande
  `OPEN`** med gröna checks men `autoMergeRequest: null` (#569, #574) — inte
  ännu armerade/köade. "Samtliga landade" höll alltså inte bokstavligt vid
  läsningens tidpunkt; CI-grönheten (den egentliga axel-1-mätningen) höll för
  samtliga åtta.

### Axel 3 (eskalationsfrekvens) — noll eskaleringar, men en näraliggande instans bokförd separat

**Ingen skiva föll CI eller queue två gånger** i denna våg — eskalationsregeln
(§ ovan) utlöstes alltså inte. **Men uppdragets ursprungliga premiss "noll nya
TASK-115-instanser under hela vågen" var FEL:** en åttonde G0-transient-instans
inträffade på PR #572 (`run 30721492383`, 2026-08-01T22:33:46Z) — verifierat
rad-för-rad mot job-loggen (samma `playwright --list kunde inte köras: Command
failed` / exit 64-signatur som instans 1–7). Bokförd som **Instans 8** i
`TASK-115`:s eget instansregister (kortet är `○ To Do`, öppet för tillägg —
INTE `Done` som en efterföljande uppdragskorrigering felaktigt hävdade, se
`T110` § Nya instanser nedan). Instansen skiljer sig strukturellt från
1–7: PR #572 stod **aldrig i merge-kön** (checks fortfarande igång när felet
inträffade) — så "noll kö-utsparkningar" är en SEPARAT påstående som fortsatt
höll, medan "noll nya instanser" inte gjorde det. Fix-PR `#569` (bounded
retry) hade inte landat när instansen inträffade — förväntad sista instansen
av det opatchade beteendet.

## Vad som saknas för att tråden ska bära en riktig jämförelse

- Ett mätbart "cirka 10 skivor byggda på Sonnet" — Mätpunkt 2 § Axel 1 ovan
  ger en första riktig delmängd (8 PR:er, samtliga CI-gröna första gången),
  men är inte en fullständig retrospektiv räkning av samtliga Sonnet-skivor
  sedan #557 landade.
- **En Sonnet-datapunkt för axel 2 (`uppdragsrevision`).** Körning #2 (Mätpunkt
  2 ovan) landade, men mäter **fortfarande pre-Sonnet**-sessioner — den fyller
  n=2 för instrumentets egen bakgrundsvarians, inte T113:s Sonnet-fråga.
  Nästa körning måste rikta sig mot session `a964302a-1c0e-4bb6-ad0f-f6842bb80a21`
  (S91:s tjugoandra resume) för att ge den FÖRSTA Sonnet-datapunkten.
  `T110`:s regel gäller fortsatt: "Effektpåståenden förblir förbjudna tills
  revision n≥2" — och den n=2 som räknar måste vara Sonnet-mot-baslinje, inte
  pre-Sonnet-mot-pre-Sonnet.

## Släktskap

`T110` (orkestrerarens felklasser — baslinjen denna tråd jämför mot, och
källan till premiss-pass-disciplinen som ADR-086 mekaniserade) ·
`ADR-086` (uppdragets premisser prövas av mottagaren — mekanismen § Mätpunkt 1
tillämpar) · `TASK-115` (G0-transienten — måste uteslutas manuellt vid
eskalationsbedömning, se § Eskalationsregel).

## Pausad (2026-08-02, session-end S91)

Väntar sin första Sonnet-datapunkt: nästa `revision:uppdrag` riktas mot
tjugoandra resumens transcript (`a964302a-…`, ~15 Sonnet-bygguppdrag).
Återupptas i den framtida session som kör revisionen — era-jämförelser
förblir förbjudna tills datapunkten finns (T110-effektregeln).
