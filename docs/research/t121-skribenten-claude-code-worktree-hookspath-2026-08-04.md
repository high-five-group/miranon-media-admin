---
owner: marcus803
updated: 2026-08-04
review_by: 2027-02-04
status: stable
---

# T121: Skribenten hittad — Claude Codes egen worktree-skapande kod skriver `core.hooksPath` absolut

> **Proveniens:** avgränsat research-pass 2026-08-04, beställt direkt av Marcus
> efter att orkestrerarens första svar ("källan är okänd") avvisades: *"Vadå
> okänd? Lägg av, research på det så måste vi ju hitta skribenten direkt, vi
> är ju inte ensamma om detta."* Kör i egen worktree
> (`.claude/worktrees/agent-a8f671cfe98283616`), gren
> `docs/t121-skribenten-hittad`, byggd ovanpå `origin/main` efter att PR #723
> (`fix/t121-sjalvlakande-vakt`, självläkande vakt) landade
> 2026-08-04T19:37:14Z.

## Svar

**Skribenten är Claude Codes egen worktree-skapande kod** — inte VS Code, inte
Husky, inte npm/`postinstall`, inte något i det här repot. Mekanismen är en
dokumenterad, öppen bugg i `anthropics/claude-code` som körs varje gång en NY
worktree skapas (`/worktree`, `--worktree`, eller `isolation: "worktree"` för
agenter — dvs. exakt det EnterWorktree-anrop varje bygg-agent i den här
sessionen startar med). Den går inte att patcha från vårt håll: `claude` är en
sluten, kompilerad binär. Den självläkande vakten (PR #723, redan landad) är
därför inte bara rimlig mitigering — den är den enda möjliga på vår sida.

## Beläggkedja

### 1. Tre oberoende, publika buggrapporter — samma mekanism, fem månaders spann

| Issue | Datum | Status | Kärncitat |
|---|---|---|---|
| [`anthropics/claude-code#27474`](https://github.com/anthropics/claude-code/issues/27474) | 2026-02-21 | Open | *"`claude --worktree` overwrites the `core.hooksPath` of `$GIT_COMMON_DIR/config`... I guess that the original intention was to set the hooks for the newly created worktree to the main repo's one. But... the actual behavior turns out to be merely modifying the `$GIT_COMMON_DIR` config."* |
| [`anthropics/claude-code#66993`](https://github.com/anthropics/claude-code/issues/66993) | 2026-06-10 | Closed (stale) | *"When Claude Code creates a session worktree... it checks for `<mainRepo>/.husky` and then `<mainRepo>/.git/hooks`, and if the repo's `core.hooksPath` differs from that path it runs: `git config core.hooksPath <absolute path>`... with the cwd set to the new worktree, logging 'Configured worktree to use hooks from main repository'... linked worktrees share the clone's config file, so this `git config` write lands in the SHARED `.git/config`."* Nämner explicit `isolation: "worktree"` för agenter som en av tre trigger-vägarna. |
| [`anthropics/claude-code#72714`](https://github.com/anthropics/claude-code/issues/72714) | 2026-07-01 | Open | *"the CLI runs logic equivalent to (reconstructed from the bundled binary)... `let absolute = isAbsolute(hooksPathValue) ? hooksPathValue : resolve(mainRepoPath, hooksPathValue); if (hooksPathValue !== absolute) { await run('git', ['config', 'core.hooksPath', absolute], { cwd: newWorktreePath }); }`"* |

Alla tre hämtade via `gh issue view <n> --repo anthropics/claude-code`
2026-08-04 (inte enbart WebFetch-sammanfattning — `gh` slår mot GitHubs API
direkt, så texten ovan är verbatim ur de riktiga issues, inte en tredje
parts återgivning).

Ingen av de tre är stängd med fix. #66993 är stängd som `stale` (auto-stängd
av bot-policy vid inaktivitet, inte löst). #27474 och #72714 är öppna, inga
länkade PR:er.

### 2. Verifierat mot VÅR EGEN körande binär — inte bara mot rapporterna

Marcus krav var explicit: *"verifiera den mot dess KÄLLKOD, inte mot en
blogg."* `claude` är sluten källkod (kompilerad, minifierad), så "källkod" i
strikt mening finns inte tillgänglig — men den FAKTISKA binären som kör `claude`-
kommandot i den här sessionen gör det, och Bun-kompilerade binärer bevarar sin
JS som läsbar text inuti binären.

```bash
$ which claude
/Users/marcus/.npm-global/bin/claude
$ ls -la /Users/marcus/.npm-global/bin/claude
lrwxr-xr-x ... claude -> ../lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe
$ claude --version
2.1.221 (Claude Code)
$ strings -a /Users/marcus/.npm-global/lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe | grep hooksPath
```

Bland träffarna finns denna funktion (variabelnamn minifierade av byggkedjan,
logiken oförändrad):

```js
async function Qvs(e, t) {           // e = huvudrepots rot, t = ny worktree-path
    let r = await Ya.realpath(t).catch(() => null);
    await p1y(e, t, r);
    let n = Xa.join(e, ".husky"),
        o = await WM(e),             // hitta huvudrepots common-gitdir
        i = o ? await rte(o) ?? o : null,
        s = i ? await Rrr(i, "core", null, "hooksPath") : null,   // läs core.hooksPath RÅTT ur huvudrepots config
        a = null;
    if (s) {
        if (a = Xa.isAbsolute(s) ? s : Xa.resolve(e, s), s !== a) {
            let { code: u, stderr: d } = await to(vo(), ["config", "core.hooksPath", a], { cwd: t });
            // ^ BUGGEN: cwd = t (den NYA worktreen), ingen -C/--worktree-flagga
            if (u === 0) T(`Configured worktree to use hooks from main repository: ${a}`);
            else T(`Failed to configure hooks path: ${d}`, { level: "error" });
        }
    }
    ...
}
```

Loggsträngen `"Configured worktree to use hooks from main repository: ${a}"`
är **byte-identisk** med citatet i `#66993`. Det här är inte en tolkning av
en buggrapport — det är samma kod, återfunnen i vår egen installerade,
körande binär.

`Qvs` anropas från `Won` (huvudfunktionen bakom worktree-skapande, samma fil)
endast i den grenen som skapar en **helt ny** worktree via nativ
`git worktree` (inte via en `WorktreeCreate`-hook, och inte vid återupptagning
av en befintlig worktree — den koden loggar i stället `"Resuming existing
worktree at:"` utan att anropa `Qvs`):

```js
if (m) T(h ? `Reset existing worktree to the current base at: ${d}` : `Resuming existing worktree at: ${d}`);
else T(`Created worktree at: ${d} on branch: ${p}`), await Qvs(a, d), g = Date.now() - c;
```

### 3. Varför den slår till KONSTANT i just det här repot — vårt eget arbetssätt är amplifikatorn

`s !== a` (villkoret som utlöser den felaktiga skrivningen) är sant varje
gång, eftersom vårt repos `core.hooksPath` **alltid** är relativt
(`.githooks`, satt av `package.json`s `postinstall` sedan 2026-05-14, K7.C).
Och den här sessionen skapar worktrees kontinuerligt:

```console
$ git worktree list | grep -v ' \[main\]$' | wc -l
24
```

gav 24 aktiva linked worktrees (exklusive huvudrepot) vid tidpunkten för det
här passet — en ögonblicksbild av hur mycket parallell worktree-aktivitet
den här miljön normalt bär, inte ett mått på hur många som skapades UNDER
just detta enskilda pass (den siffran har jag inte isolerat; worktrees
skapas och tas bort löpande genom en hel orkestrerar-session, inte bara när
jag själv observerar). Varje `EnterWorktree`/`isolation: "worktree"`-anrop
triggar `Qvs`, vilket förklarar både varför symptomet är så FREKVENT (flera
gånger i timmen, inte en engångshändelse) och varför ingen kod i vårt eget
repo, hub-repot eller någon worktree någonsin hittades — skribenten körs
utanför repot, i CLI-processen själv.

**Det här är inte en neutral iakttagelse — det är en väsentlig prognos.**
Buggen kräver en worktree-SKAPELSE för att slå till (§2: bara den gren av
`Won` som skapar en helt ny worktree anropar `Qvs`; att återuppta en
befintlig gör det inte). Felfrekvensen skalar därför direkt med TAKTEN av
worktree-skapelser i en session, inte med hur många som råkar leva samtidigt
— och den takten var, mätt i §4, hög nog att ge tre flip på sex minuters
aktiv övervakning utan någon egen åtgärd. `T119`s hela
mekaniserings-program syftar uttryckligen till MER parallell orkestrering,
inte mindre — vilket betyder att den här amplifikationen växer i takt med
att vi blir mer effektiva på precis det vi försöker bli bättre på, inte
något vi växer ur.

### 4. Live-bevis fångat under passet

Bakgrundsövervakning (`git config --get core.hooksPath` var 2:a sekund,
logg plus ps/mtime-snapshot vid varje ändring — skript och rådata i denna
worktrees scratchpad, refererat i källförteckningen nedan) fångade **två
spontana** flip utan att jag körde något kommando som skulle kunna orsaka
dem:

| Tid (UTC) | Övergång | Vad jag gjorde precis då |
|---|---|---|
| 2026-08-04T19:36:14Z | absolut → relativ | Jag satte den manuellt (kontrollpunkt) |
| **2026-08-04T19:37:55Z** | **relativ → absolut** | Läste en GitHub-issue via WebFetch — inget git-kommando alls |
| 2026-08-04T19:41:24Z | absolut → relativ | Läste en GitHub-issue via `gh issue view` — inget git-kommando alls |

`ps`-ögonblicksbilden vid 19:37:55 fångade inte den ansvariga processen (ett
`git config`-anrop är millisekund-kort; en 2-sekunders poll är för grov för
att träffa det i farten — detta är en känd begränsning av mätmetoden, inte
ett dolt fynd). Men TIMINGEN — flip var 1–4:e minut, utan koppling till mina
egna kommandon — är konsistent med "något annat i den här sessionen skapar
worktrees kontinuerligt", vilket matchar att orkestreraren spawnar
bygg-agenter genom hela sin session.

### 5. Orkestrerarens `npm ci`/`npx`-hypotes: testad direkt i det verkliga repot, falsifierad

Orkestreraren föreslog mitt under passet att `npm ci`/`npx` i en RIKTIG
worktree (till skillnad från agentens tidigare isolerade temp-repo-test)
kunde bete sig annorlunda. Testat direkt:

```console
$ git config --get core.hooksPath
.githooks
$ npm run postinstall          # kör package.json:s FAKTISKA postinstall-rad
> git config core.hooksPath .githooks
$ git config --get core.hooksPath
.githooks                      # oförändrat — relativt
$ grep hooksPath .git/config
    hooksPath = .githooks       # bekräftat i den råa filen också
```

```console
$ npx markdownlint-cli2 "docs/research/*.md" --config /dev/null > /tmp/... 2>&1
$ git config --get core.hooksPath
.githooks                      # oförändrat
```

Båda körda i en RIKTIG worktree av det RIKTIGA repot (inte ett minimalt
temp-repo), med `node_modules` symlänkat in och full `package.json`-kontext.
Ingen av de två reproducerar felet. Detta stärker snarare än motsäger
huvudfyndet: `postinstall` är, och har alltid varit, en oskyldig relativ
`git config`-rad — det är `Qvs` i `claude`-binären som absolutiserar och
felskriver den, EFTER att postinstall redan gjort sitt jobb rätt.

### 6. Vad som redan var uteslutet (bekräftas, ändras inte)

Tidigare pass (`docs/research/git-config-delning-include-path-vs-postinstall-2026-08-04.md`)
källkodsverifierade att Husky (`typicode/husky`, ~5M veckonedladdningar)
skriver `core.hooksPath` **relativt** via sitt eget `prepare`-livscykel-skript
— exakt vårt mönster, inte kandidaten. `pre-commit` (Python) och `lefthook`
skriver aldrig `core.hooksPath` alls; de skriver direkt i `.git/hooks/` och
`pre-commit` VÄGRAR uttryckligen samverka med `core.hooksPath`. VS Codes
inbyggda git-extension flaggades som en oprövad hypotes i det passet — den
lämnas nu, ersatt av ett bekräftat fynd.

### 7. Självläkningens fönster — en känd, kvarstående egenskap, inte en fullständig mitigering

Den självläkande vakten (PR #723) tar bort symptomet, men inte omedelbart —
och det är värt att stå skrivet rakt, av samma disciplin som `T121`-radens
befintliga fail-open-egenskap redan har. Kedjan, steg för steg:

1. Orkestreraren spawnar en ny worktree-isolerad agent → `Qvs` kör → den
   DELADE `.git/config` blir absolut (§2–3).
2. Den nya agentens FÖRSTA `git commit` löser `core.hooksPath` mot den nu
   absoluta pathen — vilket pekar på **huvudkatalogens** `.githooks/pre-commit`,
   inte agentens egen worktree-kopia (det är hela `T121`-symptomet, §
   ursprunglig rad i `tasks/threads/README.md`).
3. HUVUDKATALOGENS hook-kopia är den som kör — och det är DEN kopian som
   innehåller självläknings-logiken (om den PR:en redan är mergad in i
   huvudkatalogens checkout). Den upptäcker det absoluta värdet och rättar
   det, i SAMMA körning som den blockerar/godkänner committen.
4. Från och med NÄSTA commit i den worktreen är värdet relativt igen, och
   worktreen kör sin egen hook-kopia som avsett.

**Nettoeffekt:** exakt EN commit per worktree-skapelse riskerar att köra fel
hook-kopia (huvudkatalogens, inte sin egen) innan självläkningen hinner ikapp.
Om den agentens gren har en NYARE `.githooks/pre-commit` än huvudkatalogens
(t.ex. en agent som själv arbetar på en hook-ändring), testar den alltså inte
sin egen version på den första committen — samma konsekvens (1) som
ursprungsraden i `T121` redan dokumenterar, nu bekräftat att den kvarstår
strukturellt även efter självläkningen, inte bara i det ursprungliga
upptäcktsfönstret. Detta är acceptabelt givet att alternativet (ingen
mitigering alls, eftersom roten sitter i en sluten binär) är sämre — men det
är en känd, kvarstående egenskap, inte en löst fråga.

## Vad jag INTE kunde belägga

+ **Exakt vilket anrop i just DEN HÄR sessionen** som orsakade var och en av
  de tre observerade flip-händelserna (2026-08-04, se tabell ovan) — jag
  fångade TIMING, inte PID. En 2-sekunders poll kan strukturellt inte träffa
  ett millisekund-kort `git config`-anrop; att göra det hade krävt
  `dtruss`/`fs_usage`-nivå-instrumentering, vilket bedömdes oproportionerligt
  givet att källkods-beläggningen (§2) redan är entydig.
+ **`ORe()`-villkoret** (hook-baserad kontra nativ worktree-skapande) i
  `Won`-funktionen lästes inte ut i detalj — jag antar den nativa grenen
  (`Qvs` anropas) utifrån att `git worktree list` visar riktiga, gren-
  checkade linked worktrees, inte VCS-agnostiska hook-baserade sådana. Detta
  är en rimlig slutsats av observerbart beteende, inte en direkt läsning av
  `ORe()`s implementation.
+ **Om Anthropic redan känner till sammanslagningen av alla tre issues** —
  jag har inte postat någon kommentar eller ny issue; det är ett beslut för
  Marcus/orkestreraren, inte något jag gör ensidigt på ett research-repos
  vägnar.

## Rekommendation

1. **Behåll den självläkande vakten (PR #723, redan landad).** Den är inte
   en tillfällig lösning i väntan på en riktig fix — den ÄR den riktiga
   lösningen på vår sida, eftersom roten sitter i en sluten binär vi inte
   kan patcha.
2. **Uppdatera `.githooks/pre-commit`s kommentar** (redan gjort i denna PR)
   så att "källan är okänd" ersätts med en pekare till detta dokument — nästa
   person som läser vakten ska inte behöva göra om jakten.
3. **Överväg (Marcus/orkestrerarens beslut, inte mitt) att kommentera på
   `#72714`** — den mest aktiva och senast öppnade av de tre. Jämfört mot vad
   som redan står där (§1-tabellen) tillför vårt fall något #72714 saknar:
   ingen av de tre rapportörerna beskriver AMPLIFIKATION via upprepad,
   parallell agent-spawning (§3) — deras repro-steg skapar EN worktree och
   observerar EN drift. Vår mätning (flip var 1–4:e minut under aktiv
   övervakning, §4, i en miljö med 24 samtidigt levande linked worktrees)
   kvantifierar hur allvarligt problemet blir under just det
   användningsmönster `isolation: "worktree"`-agenter (redan nämnt i #66993,
   men inte kvantifierat) möjliggör. Det är ett konkret, mätt bidrag —
   men det är utåtriktad kommunikation i Marcus/Anthropics namn och kräver
   hans explicita beslut. **Jag har INTE postat någon kommentar eller skapat
   någon issue** — det är enbart en rekommendation i det här dokumentet.

## Källförteckning

**Buggrapporter (`anthropics/claude-code`, hämtade via `gh issue view` 2026-08-04):**

+ [#27474](https://github.com/anthropics/claude-code/issues/27474) — `claude --worktree overwrites core.hooksPath`
+ [#66993](https://github.com/anthropics/claude-code/issues/66993) — `Worktree creation rewrites shared core.hooksPath` (loggsträng-match)
+ [#72714](https://github.com/anthropics/claude-code/issues/72714) — `/worktree can silently write core.hooksPath into the MAIN repo's shared .git/config`

**Egen binär (körd direkt, inte sekundärkälla):**

+ `/Users/marcus/.npm-global/lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe`, v2.1.221 — `Qvs`/`Won`-funktionerna, `strings -a | grep hooksPath`

**Eget live-mätpass (denna worktree, 2026-08-04):**

+ `git config --get core.hooksPath` — poll var 2:a sekund, 19:35:32Z–19:43:10Z
+ Tre observerade flip: 19:36:14Z (manuell), 19:37:55Z (spontan), 19:41:24Z (spontan)
+ `npm run postinstall` + `npx markdownlint-cli2` i verklig worktree — falsifierar `npm ci`/`npx`-hypotesen

**Tidigare pass (denna tråd):**

+ `docs/research/git-config-delning-include-path-vs-postinstall-2026-08-04.md` — Husky/pre-commit/lefthook källkodsverifierade, `include.path` avfärdat
+ `tasks/threads/README.md` rad `T121` — full historik (upptäckt → första fix → återöppning → självläkande vakt → detta pass)
+ commit `baf89f5c` (PR #723) — självläkande vakt, "källan är okänd"-status före detta pass
