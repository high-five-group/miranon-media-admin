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

## Eskalationsregel (beslutad 2026-08-01, Marcus GO) — RIVEN ÖPPET 2026-08-02

> **Amendering (2026-08-02, S94, Marcus-kvittens, grillad samsyn 7/7):** regeln
> nedan är RIVEN ÖPPET och ERSATT av
> [ADR-089](../../docs/decisions/ADR-089-modell-effort-policy-per-processteg.md)
> § Beslut 5. Ursprungstexten bevaras oförändrad nedan (samma
> korrigerings-konvention som `docs/decisions/README.md` § Korrigering vs
> supersedering: additiv not, aldrig tyst radering) — den nya regeln gäller
> från och med denna landning.
>
> **Ny regel:** fäller en skiva två gånger → respawn på **Opus som DEFAULT**
> (inte `fable`); orkestreraren får välja Fable direkt när felbilden själv är
> Fable-klassad, och det valet bokförs i uppdraget, inte tyst.
> `TASK-115`-klassens transienter utesluts fortfarande manuellt vid bedömning
> före räkning.
>
> **Skäl till rivningen:** Marcus-input 2026-08-02 (hårdkoda inte Fable; Opus
> är giltig OCH obligatorisk fallback vid Fable-kvottak) + Anthropics egen
> svårighets-baserade linje (en signal om STYRKA, inte om en specifik
> namngiven modell). Talet "2 fällningar" är, precis som i den ursprungliga
> regeln, deklarerat valt för enkelhet — INTE branschbelagt som optimum
> (CodeRescue, arxiv 2607.19338, se ADR-089 § Beslut 5 för siffrorna).

**Ursprunglig regel (2026-08-01, historisk — se amenderingen ovan):** fäller
en skiva två gånger → respawn med `model: fable` via Agent-anropets
`model`-parameter (inte genom att ändra agentdefinitionens frontmatter — den
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

## Mätpunkt 3 — uppdragsrevision körning #3, FÖRSTA Sonnet-datapunkten (2026-08-02)

Körd mot exakt den session Mätpunkt 2 pekade ut: `a964302a-1c0e-4bb6-ad0f-f6842bb80a21`
(S91:s tjugoandra resume). Full rapport:
[`docs/research/uppdragsrevision-korning-3-2026-08-02.md`](../../docs/research/uppdragsrevision-korning-3-2026-08-02.md).

**Modell-kvalificeringen krävde en strängare metod än föreslaget — bokförd
som divergens, inte bara en bekräftelse.** Instrumentets `input.model`-fält
(den explicita override:en i orkestrerarens `Agent`-anrop) var `null` på 15
av 16 uppdrag — en bokstavlig läsning av "`modell: null` ⇒ pre-Sonnet"
(körning #2:s regel) hade alltså gett 1/16 Sonnet-spawns och en oberättigad
STOPP. Grundsanningen (subagent-transcripternas egna `message.model`-fält,
`~/.claude/projects/…/a964302a…/subagents/agent-<id>.jsonl`) visar i stället
**14 av 16 spawns (87,5 %) på `claude-sonnet-5`** — samtliga 12 `bygg-agent`
plus det enda `research-pass`-uppdraget körde Sonnet trots `input.model:
null`, eftersom PR #557 redan hade satt `model: sonnet` i respektive
agentdefinition INNAN denna session startade; `input.model: null` betydde
här "ärvt Sonnet", inte "ärvt huvudloopens modell" som i körning #2:s
pre-#557-sessioner. Skälet regeln höll där men inte här: proxyn
(`input.model`) mäter overriden, inte den faktiska ärvda modellen — och den
skillnaden aktiverades exakt av PR #557. Kvalificeringen HÖLL (sessionen bär
verkligen Sonnet-spawns), men via grundsanning, inte proxyn.

**Resultat (16 uppdrag, 12 bygg-agent · 3 general-purpose · 1 research-pass):
88 prövade påståenden, 4 hårda fel (4,60 % av 87 avgjorda), 3 gränsfall
(8,05 % med dem), 77,3 % källmärkta** — bättre på samtliga fyra axlar än
BÅDA de pre-Sonnet-körningarna (baslinje 3,8 %/64 %; körning #2 6,25 %/56,9 %).
**Ingen slutsats dras av det** — n=1 för Sonnet-mot-baslinje (T110-regeln
kräver n≥2 för effektpåståenden), mindre korpus, annan uppdragsblandning.

**Fångst-rate-fynd (n=4, T110-trådens egen "systematiska lucka" — mäter för
första gången BÅDA sidor på samma urval):** av de fyra hårda felen var 2
redan självupptäckta och rättade i realtid av mottagande agenter under samma
våg (ett av dem är exakt `task-115` Instans 8, redan bokförd nedan i § Axel
3); 2 slank igenom oupptäckta in i landade artefakter (ett står ännu
oförändrat i det landade `task-115`-kortet — en radintervall-approximation
mot restlistan).

**Instrumentets egen felklass (självrapporterade totaler som svagaste länk)
upprepades en TREDJE gång:** en av de två delegerade verifieringsbatcharna
angav fel källmärkningstal i sin egen sammanfattningsrad (4/4 där
detaljtabellen visade 6/2) — rättat genom omräkning direkt ur tabellen, inte
genom att lita på sammanfattningen.

## Vad som saknas för att tråden ska bära en riktig jämförelse

- **n≥2 Sonnet-ankrade `uppdragsrevision`-körningar** för att T110-regeln
  ("effektpåståenden förbjudna tills revision n≥2") ska kunna tillämpas på
  SONNET-frågan specifikt. Mätpunkt 3 ger n=1; nästa körning måste riktas mot
  en YTTERLIGARE Sonnet-dominerad session (efter `a964302a`, t.ex. en framtida
  S92-resume) för att ge n=2 och göra en verklig Sonnet-mot-baslinje-jämförelse
  möjlig. Ingen effektslutsats förrän dess.
- **En fullständig retrospektiv räkning av samtliga Sonnet-byggda skivor
  sedan #557 landade** (inte bara denna enda sessions 16 uppdrag) — Mätpunkt
  2 § Axel 1 + Mätpunkt 3 tillsammans täcker samma åtta vågs-PR:er
  (`#563`–`#570`, `#574`) plus resten av `a964302a`:s korpus, men Sonnet-byggt
  arbete i SENARE sessioner (t.ex. S92, om sådant existerar) är ännu inte
  räknat.

## Släktskap

`T110` (orkestrerarens felklasser — baslinjen denna tråd jämför mot, och
källan till premiss-pass-disciplinen som ADR-086 mekaniserade) ·
`ADR-086` (uppdragets premisser prövas av mottagaren — mekanismen § Mätpunkt 1
tillämpar) · `TASK-115` (G0-transienten — måste uteslutas manuellt vid
eskalationsbedömning, se § Eskalationsregel).

## Pausad (2026-08-02, körning #3 landad)

**Föregående pausnings-villkor uppfyllt:** körning #3 (Mätpunkt 3 ovan) gav
T113 sin FÖRSTA Sonnet-datapunkt, riktad mot exakt den session förra
pausningen pekade ut. Tråden återgår till `paused` med ett NYTT väntevillkor
— den fortsätter inte som `active` eftersom inget omedelbart
uppföljningsarbete är schemalagt i denna landning, och mönstret från
Mätpunkt 1/2 (parkera med explicit nästa-trigger snarare än hålla tråden
öppen mellan mätvågor) upprepas medvetet.

**Väntar nu på:** en YTTERLIGARE Sonnet-dominerad session (efter `a964302a`)
att rikta en fjärde `uppdragsrevision`-körning mot — det ger n=2 för
Sonnet-mot-baslinje-jämförelsen och gör T110-effektregeln ("förbjudna tills
revision n≥2") tillämpbar på Sonnet-frågan specifikt. Sekundärt: en
fullständig retrospektiv räkning av Sonnet-byggda skivor bortom denna enda
sessions korpus (§ Vad som saknas). Återupptas i den framtida session som
identifierar en sådan session och kör revisionen.
