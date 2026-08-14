# Nästlade worktree-sökvägar fäller textmatchande katalogvakter

**En vakt som textmatchar "kommandot nämner huvudkatalogens sökväg" ger
falska positiver i repon där worktrees bor UNDER huvudkatalogen
(`.claude/worktrees/…`) — varje absolut worktree-sökväg bär då
huvudkatalogen som prefix, och `cd <egen-worktree> && git …`-former fälls
trots att målet är agentens egen katalog. Arbetsformen som håller: byt
arbetskatalog i ett EGET kommando (låt cwd persistera) och kör därefter
rena git-kommandon utan absoluta sökvägar i kommandotexten.**

Mätt 2026-08-14 (S105): orkestreraren + tre oberoende bygg-agenter fälldes
av `scripts/deny-frammande-huvudkatalog.sh` väg 2 (textmönstret) på
kommandon som riktades mot egna worktrees — `cd <worktree> && git checkout`,
`git -C <worktree> …` och `git add`/`git commit` med cd-prefix. En agent såg
dessutom transient fällning där identiskt kommando gick igenom vid retry
(möjlig race i cwd-läsningen). Ingen av fällningarna skyddade något —
huvudkatalogen berördes aldrig.

Detta är en ANNAN felklass än harnessets engelska worktree-isoleringsspärr
("too complex to check") — den svenska hookens väg 2 är repots egen. Vaktens
design är medvetet "hellre för brett" och fällningen är billig att arbeta
runt (cwd-formen ovan), så lärdomen är i första hand OPERATIV för den som
skriver kommandon; en ev. skärpning av väg 2 (exkludera sökvägar under
`<huvudkatalog>/.claude/worktrees/`) är en separat design-fråga för hookens
ägare, inte något en fälld agent ändrar själv.

Instanser: S105 sessionsdok Del 10 § lessons-kandidater p. 3 +
bygg-agenternas slutrapporter (TASK-201.15/201.16/201.18-landningarna).
