---
owner: marcus803
updated: 2026-08-12
review_by: 2026-11-12
status: stable
lifecycle: paused
---

# T141 — `~/Downloads` blev onåbart mellan två Claude Code-versioner

> Uppstod i S105 2026-08-12 när Marcus bad agenten läsa en skärmavbild i
> `~/Downloads` och åtkomsten nekades — trots att samma katalog lästes
> framgångsrikt två dagar tidigare. Triagerad enligt `ADR-053`: blockerar
> inte pågående arbete (201-kedjan rullar), men bryter ett arbetsflöde som
> globala `CLAUDE.md` § Instruktioner uttryckligen förutsätter ("Kommer en
> färdig fil utifrån … landar den i `~/Downloads/` och Code utför
> operationen därifrån"). Parkerad på Marcus order: *"Minta en tråd om
> detta … så plockar vi upp den senare."*

## Symptomet

Från S105 (2026-08-12) nekas all åtkomst till innehållet i `~/Downloads`:

```text
ls ~/Downloads              → ls: /Users/marcus/Downloads: Operation not permitted
find ~/Downloads -maxdepth 1 → bfs: error: /Users/marcus/Downloads: Operation not permitted
Read-verktyget mot en fil   → EPERM: operation not permitted, open '…'
textutil mot en .docx       → Error reading … You don't have permission.
```

`stat ~/Downloads` **fungerar** och visar en normal lokal katalog
(`drwx------`, 1078 poster, mtime samma dag). Spärren träffar alltså
`readdir` och `open` — inte metadata på katalogen själv.

## Det avgörande motbeviset: samma sak fungerade 2026-08-10

S104 körde denna rad och fick innehållet:

```bash
textutil -convert txt -stdout ~/Downloads/Inbjudningar-till-communityt.docx
```

Belägget är inte sessionsdokets påstående utan **transkriptets faktiska
utdata** — filens text (`"Inbjudningar till communityt / Status och plan
inför utskicket / Från Marcus · Juli 2026"`) finns i
`~/.claude/projects/-Users-marcus-Repon-miranon-media-admin--claude-worktrees-s104-segment-passet/a02154a9-654a-4f95-9120-0e8b18398ffc.jsonl`.

Samma fil finns kvar i dag — dagens fel är ett **rättighetsfel, inte
"hittas ej"**.

## Vad som är UTESLUTET (mätt, inte antaget)

| Hypotes | Utfall | Belägg |
|---|---|---|
| macOS TCC nekar VS Code | **FALSIFIERAD** | Raden `com.microsoft.VSCode` / `kTCCServiceSystemPolicyDownloadsFolder` = `0` har `last_modified 2026-01-03 18:35:41`. Vore den verksam hade 2026-08-10 fallit också. |
| Olika värdapp | **UTESLUTEN** | Processkedjan spårad för både denna session och S102: `bash → zsh → Claude → zsh → Code Helper → Visual Studio Code`. Marcus i klartext 2026-08-12: *"Jag kör alltid i VS Code utan undantag och har alltid gjort."* |
| Worktree-isoleringen | **UTESLUTEN** | S104 körde också i egen worktree (ADR-090 beslut 2, bokfört i dess sessionsdok-huvud) och läste ändå katalogen. |
| Harnessets rättighetslager | **UTESLUTEN** | `~/.claude/settings.json` har `defaultMode: bypassPermissions`; ingen sökvägs-`deny` finns i vare sig user- eller projekt-settings. |
| Bash-sandlådan | **UTESLUTEN** | `dangerouslyDisableSandbox: true` ger identiskt utfall. Dessutom faller **Read-verktyget** med `EPERM` — en separat kodväg som inte går genom Bash. |
| VS Code uppdaterades | **UTESLUTEN** | App-bundlens mtime är `Aug 7 20:46`, före det fungerande fallet. Version 1.132.1. |

## Den enda mätbara skillnaden

| | S104 (2026-08-10) | S105 (2026-08-12) |
|---|---|---|
| `~/Downloads` | **fungerade** | nekas |
| Claude Code | **2.1.226** | **2.1.227** |

Versionerna lästa ur `"version"`-fältet i respektive sessions transkript.
**Detta är en KORRELATION, inte en fastställd orsak** — mekanismen inuti
2.1.227 är okänd och ska inte gissas.

## Den olösta bi-anomalin

Från samma session, samma ögonblick:

| Katalog | Faktiskt utfall | TCC-värde för VS Code |
|---|---|---|
| `~/Downloads` | NEKAD | `0` |
| `~/Desktop` | **OK** (185 poster) | `2` |
| `~/Documents` | NEKAD | `2` |

`~/Documents` nekas trots beviljad behörighet, och `~/Desktop` släpps
igenom. Ingen prövad hypotes förklarar mönstret. Orsaken är **OMÄTT** —
lämnas öppen med avsikt hellre än att fyllas med en gissning.

> **Uppdaterad senare samma dag:** `~/Desktop`-cellen är nu förklarad — se
> § ORSAKEN FUNNEN nedan. TCC-kolumnen är dessutom irrelevant, eftersom VS
> Code bär Full Disk Access. `~/Documents` förblir oförklarad.

## RÖTT SPÅR STÄNGT: macOS TCC är inte mekanismen

`com.microsoft.VSCode` har **Full Disk Access** i systemets TCC-databas
(`/Library/Application Support/com.apple.TCC/TCC.db`):
`kTCCServiceSystemPolicyAllFiles = 2`, beviljad `2026-03-19 11:46:36`.

FDA går före per-mapp-behörigheter. **Med den beviljad kan TCC inte vara det
som nekar dessa kataloger.** Hela TCC-spåret är därmed dött, inte försvagat —
tabellen ovan är en sann mätning av en mekanism som aldrig var i spel.

Fyndet gjordes av TASK-202-agenten. Orkestrerarens tidigare påstående att
ingen VS Code-post fanns i system-databasen byggde på en fråga som
**avkortades med `head -20`** — raden låg utanför de tjugo. Mätfel, inte
tolkningsfel.

## ORSAKEN FUNNEN: `/add-dir` krymper åtkomsten i stället för att vidga den

Mätt 2026-08-12 med en A→B→A-cykel där båda övergångarna är knutna till en
workspace-ändring. Prov var 20:e sekund, 30 prov
(rådata: sessionens scratchpad, `flapp-resultat.txt`).

| Tid | Händelse | `~/Downloads` | `~/Desktop` | `~/Documents` | `~/.zshrc` |
|---|---|---|---|---|---|
| före 16:48 | utgångsläge | NEKAD | **OK** (185 poster) | NEKAD | OK |
| 16:48:37 | **`/add-dir ~/Downloads`** | NEKAD | **NEKAD** | NEKAD | OK |
| 16:55:14–16:55:34 | prov 1–2 | NEKAD | NEKAD | NEKAD | OK |
| ~16:55:45 | **`/permissions` — Downloads bort ur workspace** | | | | |
| 16:55:54–17:04:56 | prov 3–30 (28 st i rad) | NEKAD | **OK** | NEKAD | OK |
| efter serien | kontrollmätning | NEKAD | **OK** (185 poster) | NEKAD | OK |

Tre slutsatser, var och en direkt ur tabellen:

1. **Att lägga till en katalog i workspace BRÖT åtkomsten till en annan
   skyddad katalog.** `~/Desktop` gick från läsbar till nekad vid
   `/add-dir`, och tillbaka till läsbar när posten togs bort — samma
   poster-antal (185) före och efter.
2. **`/add-dir` gav ingen åtkomst till katalogen den lade till.**
   `~/Downloads` var NEKAD i samtliga 30 prov, inklusive hela perioden den
   låg i workspace. Kommandot tog alltså bara ifrån — det gav ingenting.
3. **Kontrollytan var stabil.** `~/.zshrc` läsbar i alla 30 prov, så det är
   inte en generell filsystems-störning utan träffar specifikt de
   macOS-skyddade katalogerna.

`~/Documents` var nekad i varje läge och är fortfarande **oförklarad**.

### Fällan är kvar och åter-armeras vid nästa sessionsstart

`/permissions` tog bort katalogen ur den LÖPANDE sessionens workspace men
**skrev inte om filen**: `/Users/marcus/Repon/miranon-media-admin/.claude/settings.local.json`
bär fortfarande `additionalDirectories: ["/Users/marcus/Downloads"]`, mtime
oförändrad `16:48:37`. Posten läses sannolikt in igen vid nästa
sessionsstart och bryter då Desktop på nytt. **Filen behöver redigeras för
hand** — en worktree-isolerad agent nekas skriva där
(`Edit the worktree copy of this file instead of the shared-checkout path`),
vilket också bekräftar att `CLAUDE.md`:s worktree-matris är ofullständig:
den bokför bara Bash-git som spärrat, men Edit spärras också.

Noterbart: filen ligger i HUVUDKATALOGEN, inte i sessionens worktree — den
är därmed delad mellan alla sessioner och agenter i repot. En sessions
`/add-dir` kan alltså ändra en annan sessions filsystems-räckvidd. TASK-202-
agenten rapporterade oberoende att `~/Desktop` växlade tillstånd i DESS
session utan känd utlösare under samma tidsfönster; det är förenligt med
delad-fil-hypotesen men inte bevisat.

## Kvar att pröva (billigt, kräver en omstart)

`2.1.228` installerades 2026-08-12 16:17 (paketets mtime +
`package.json`). S105 startade 15:59 och kör därför kvar på `2.1.227`; en
omstartad session plockar upp 228 gratis.

Provet ska köras **inifrån en Claude Code-session**, aldrig i Terminal —
Terminal har egen beviljad Downloads-åtkomst (`com.apple.Terminal` = `2`)
och skulle lyckas oavsett, alltså falskt grönt:

```bash
textutil -convert txt -stdout ~/Downloads/Inbjudningar-till-communityt.docx | head -3
```

- **Tre rader text** ⇒ regressionen låg i 2.1.227 och är åtgärdad. Stäng
  tråden med versionsspannet som belägg.
- **`You don't have permission`** ⇒ regressionen ligger kvar i 228. Då
  finns ett daterat fall med känt versionsspann (fungerande `2.1.226`,
  brutet `2.1.227`+) värt att rapportera uppåt.

Kör samma prov mot `~/Documents` i samma veva — bi-anomalin kan mycket
väl ha samma rot.

## Metodlärdomen (lesson-kandidat, ej landad)

Agenten hittade en TCC-rad som **passade symptomet** och slutade leta.
Raden var sann men irrelevant. Beläggen som motbevisade den — S104:s
lyckade läsning — var tillgängliga hela tiden och lästes först efter att
Marcus tre gånger hävdat att det brukar fungera.

> **En förklaring som passar symptomet är inte verifierad förrän den också
> förklarar fallen där symptomet UTEBLEV.**

Besläktad med den lärdom som skördas parallellt om åtkomstmätning (att
mäta omgivningen är inte att mäta åtkomsten) — samma familj: bekvämt
tillgängligt indicium får ersätta det skarpa provet.

## Berörda ytor

- Globala `CLAUDE.md` § Instruktioner — `~/Downloads`-flödet förutsätter
  åtkomsten och är brutet så länge tråden är öppen.
- `docs/reference/atkomst-och-nycklar.md` (under arbete i samma session) —
  bär fil-åtkomstmatrisen som MÄTNING med öppen orsak, och pekar hit.
