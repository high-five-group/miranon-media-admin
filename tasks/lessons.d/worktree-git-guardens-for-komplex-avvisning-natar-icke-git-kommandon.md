# Worktree-isoleringens "för komplex att verifiera"-avvisning nätar även kommandon som inte rör git alls

**Avvisningen `"This command is too complex to verify that it stays inside
the worktree"` triggas inte bara av git-omdirigering (`-C`, `cd && git …`) —
den triggas även av rena, git-fria kommandon som bär ETT sammansatt
skal-mönster: flera satser separerade med `;`/`&&`, eller en
kommandosubstitution `$(...)`. Ett kommando med noll git-innehåll blockeras
ändå, med SAMMA text som git-fallet.** `[UNIVERSAL]`

Instans (TASK-309.19, 2026-08-26), TVÅ separata triggerformer mätta samma
session:

1. `mkdir -p <dir> && SCRATCH=<path> && cd <worktree> && npx @biomejs/biome
   check . > "$SCRATCH/fil.txt" 2>&1; echo "EXIT:$?" | tee -a ...` —
   AVVISAD. Rimlig hypotes: `cd`-token i en sammansatt kedja.
2. Efter att `cd` togs bort helt: `npm run bl -- task edit 309.19
   --append-notes "$(cat /path/till/fil.txt)" --plain` — ETT enda
   kommando, INGEN `cd`, INGET git-anrop över huvud taget (backlog-CLI:t är
   ett Node-skript) — AVVISAD ÄNDÅ, med identisk feltext. Nyckeln kan alltså
   inte vara `cd` eller git specifikt: kommandosubstitutionen `$(...)`
   räcker ensam.

Båda löstes genom att dela upp i separata, enkla Bash-anrop: skriv till fil i
ETT anrop, läs/referera filen i ETT SEPARAT anrop utan `$(...)`, eller (för
lång textinmatning) klistra in bokstavlig flerraders-text direkt som
argumentsträng i stället för att läsa den via en subshell.

**Detta breddar, det motsäger inte, CLAUDE.md § "Worktree-isoleringens gräns
går vid EGET REPOS huvudkatalog"** — den sektionen dokumenterar korrekt att
avvisningen skiljer VAD den stoppar (git mot huvudkatalogen) från VARFÖR
(ett kommando "too complex to check" faller oavsett mål, citerat redan där ur
`code.claude.com/docs/en/sub-agents.md`). Det som inte stod där: mängden
"too complex to check" är bredare än git-relaterade kommandon — den täcker
generella skal-komplexitetsmönster (sammansatta satser, subshells) även när
kommandot aldrig rör vid git. En agent som ser avvisningen och antar "det
måste vara ett git-problem" felsöker fel lager och kan slösa flera turer på
att leta efter ett `-C`/`cd`/`GIT_DIR` den aldrig skrev.

**Praktisk regel:** stöter en worktree-isolerad agent på denna avvisning för
ett kommando UTAN synligt git-innehåll — misstänk `;`/`&&`-kedjan eller
`$(...)` FÖRST, inte en dold git-sökväg. Fixen är alltid densamma: dela upp i
fler, enklare Bash-anrop.
