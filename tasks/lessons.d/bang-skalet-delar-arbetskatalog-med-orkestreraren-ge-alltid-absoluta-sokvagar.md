# `!`-skalet delar arbetskatalog med orkestrerarens Bash — ge alltid absoluta sökvägar i kommandon du lämnar över

**[UNIVERSAL] Ett kommando som Marcus kör via `!`-prefixet startar inte i ett
neutralt skal: det ärver samma arbetskatalog som agentens egna Bash-anrop står
i. Varje relativ sökväg i ett överlämnat kommando är därför ett antagande om
ett tillstånd avsändaren inte har skrivit ut och mottagaren inte kan se. Skriv
absoluta sökvägar — undantagslöst — i allt du ber en människa köra.**

Instans (S111, 2026-08-23, Del 6 § Fönster 2): stämpelkommandot för
`TASK-299.4`:s facit-manifest lämnades över med ett inledande
`cd .claude/worktrees/…`. Det föll — skalet stod redan i worktreen, så den
relativa sökvägen pekade på en katalog under en katalog som inte fanns. Med
absolut sökväg gick samma kommando igenom direkt: *"godkand" stämplat
(av: marcus, sha: d3858a29)*.

## Varför formen lurar

Ett `cd <relativ>` är osynligt fel: det ser korrekt ut för den som skrev det,
eftersom skribenten hade repo-roten i huvudet när kommandot formulerades. Och
felet är inte deterministiskt över tid — samma kommando fungerar när skalet
råkar stå på rätt plats och faller när det inte gör det. Det gör att
formuleringen kan användas många gånger utan att avslöja sig, och sedan falla
i det ögonblick arbetsformen byter katalog (t.ex. när ADR-090:s
worktree-regel gav passet två worktrees i stället för huvudkatalogen).

## Regeln

1. **Absoluta sökvägar i varje överlämnat kommando** — i argument, i
   omdirigeringar och i `cd`. Kostnaden är teckenlängd; alternativet är ett
   fel hos någon som inte kan felsöka det.
2. **Helst inget `cd` alls.** De flesta verktyg tar en sökväg direkt
   (`git -C`, `bash /abs/skript.sh`, `npm --prefix`), och ett kommando utan
   katalogbyte har ingen katalogpremiss att bryta mot.
3. **Skriv ut det förväntade utfallet i samma andetag** — vad som ska stå i
   utdatan när det gick rätt. Mottagaren kan då se skillnad på "kördes" och
   "kördes mot rätt sak".

## Den generella formen

**Ett kommando du lämnar över körs i mottagarens tillstånd, inte i ditt.**
Katalogen är bara en av tillståndsaxlarna; trädets färskhet är en annan
(`L521`, samma session-kluster, samma överlämningskedja). Ansvaret följer
överlämningen i båda fallen: den som formulerar kommandot äger varje premiss
det bär, eftersom mottagaren per definition inte kan se vad avsändaren antog.

## Avgränsning mot två grannposter — de rör olika ytor

`cwd-persisterar-mellan-bash-anrop-och-driftar-tyst.md` och
`nastlade-worktree-sokvagar-faller-textmatchande-katalogvakter.md` handlar båda
om AGENTENS egna kommandon, och drar där motsatta slutsatser (explicit `-C` mot
persisterande cwd) beroende på om risken är drift eller vakt-fällning. Den
avvägningen gäller inte här: en människas `!`-kommando passerar ingen
katalogvakt, och mottagaren har ingen kommandokedja att låta cwd persistera
genom. För ÖVERLÄMNADE kommandon finns alltså ingen avvägning — absoluta
sökvägar är rätt svar utan undantag. Den nya fakta-biten som binder ihop dem är
att `!`-skalet delar cwd med agentens Bash, vilket gör agentens egen
cwd-drift till en premiss i människans kommando.
