# En dokumenterad väg är inte en övad väg — och skillnaden mäts i storleksordningar

**En instruktion som aldrig körts hela vägen är en hypotes, oavsett hur noggrant
den är skriven. Öva den skarpt, och mät varje led — inte bara det led som är
lätt att mäta.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-28, `TASK-70.5`):** revert-vägen skrevs av en bygg-agent
som körde git-mekaniken i sin egen worktree och mätte **66 s** från beslut till
landningsklar revert-PR. Talet var korrekt. Men agenten fick inte armera mergen
— det är orkestrerarens knapp — så mätningen slutade **precis före** det led där
problemet fanns.

Orkestreraren körde sedan samma kedja skarpt mot `main`. Utfallet:

| Led | Mätt |
|---|---|
| No-op påbörjad → revert-commit | 118 s |
| Revert-commit → **landad** merge-commit | **25 min 16 s** |

Skillnaden mellan *dokumenterad* och *övad* var alltså skillnaden mellan 66
sekunder och 25 minuter. Orsaken var inte revert-vägen utan en flaskhals ingen
mätning på det korta ledet kunde se: post-merge-lagret tog staging-mutexen på
no-op:ens egen landning — en ändring om åtta rader markdown — och revert-PR:n
stod i kö bakom den.

**Fyndet fanns bara därför att övningen kördes.** Ingen kodläsning hade avslöjat
det, eftersom båda delarna var korrekta var för sig. Det var deras möte i skarpt
läge som brast, och det mötet uppstår bara när kedjan körs hela vägen.

**Motmedlet är att skriva ut vilket led som INTE är mätt, i stället för att låta
en delmätning representera helheten.** Agenten gjorde det korrekt — den bokförde
öppet att armering → landad merge återstod. Den ärligheten är vad som gjorde att
ledet faktiskt kördes efteråt i stället för att antas.

Besläktad: [[frånvaro-av-bevis-är-inte-bevis]] · [[ci-diagnos-antagen-fore-loggen-last]]
