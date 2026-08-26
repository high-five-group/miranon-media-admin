# Katalogägarskaps-hooken läser hook-inputens `cwd`-fält, inte kommandosträngens `cd`

**En PreToolUse-hook som vaktar vilken katalog Bash-kommandon får rikta
git mot läser Bash-verktygets EGEN `cwd` (satt av harnesset, en gång
per agent-instans) — inte var kommandosträngen själv `cd`:ar till. `cd
<worktree> && git checkout …` fälls så länge verktygets cwd fortfarande
är huvudkatalogen, ÄVEN OM kommandot bevisligen `cd`:ar bort från den
först. Efter att cwd väl persisterat in i worktreen (en separat
mekanism) går exakt samma kommandosträng igenom utan ändring.**

**[UNIVERSAL]**

Instans (S112 Del 4, resume 1, 2026-08-26): `cd <worktree> && git
checkout …` fälldes när Bash-verktygets cwd var huvudkatalogen; efter
att cwd persisterat in i worktreen gick samma kommando igenom.
`EnterWorktree` svarade i det läget "is the current working directory".
Källa: sessionsdokets Del 4 § Katalogval och parallellitet, som
explicit noterar posten som "Lesson-kandidat 10 — komplement till
kandidat 2" (den om `isolation: "worktree"`,
`eget-enterworktree-nekar-bash-at-oisolerade-agenter.md`).

Vidare, enligt uppdragets orkestrerar-trail (S112 resume 1,
2026-08-26; ej verifierat i den del av sessionsdoket jag läste —
flaggat separat): samma hook fäller även på TEXTMÖNSTER —
huvudkatalogens sökväg i kommandosträngen kombinerat med
`checkout`/`prune` fälls även när det FAKTISKA målet är en worktree,
och `for`-loopar klassas som "för komplexa" och fälls schablonmässigt.
Kostade orkestreraren 3 och agenter minst 2 omkörningar.

**Det generella:** en hook som ska avgöra "var pekar det här kommandot"
har två helt olika informationskällor att välja mellan — det
STRUKTURERADE tillståndet (cwd-fältet i hook-inputen, satt en gång) och
den FRIA TEXTEN (kommandosträngens `cd`/sökvägar, tolkad heuristiskt).
Denna hook använder det förra som sanning och mönstermatchar det senare
som tilläggsregel — vilket ger en förutsägbar men kontraintuitiv
avvisningsyta: kommandot kan vara korrekt i sak och ändå fällas, och
rätt åtgärd är att förändra cwd (via `EnterWorktree` eller motsvarande
persisterande mekanism), inte att skriva om kommandosträngen.
