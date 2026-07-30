# Ospårad bokföring är en delad tillståndsyta — den är osynlig för alla utom dig

**Ett kort, en post eller ett nummer som ligger ospårat i ditt arbetsträd finns
inte för någon annan aktör. Räknar de från `main` och du från din disk, allokerar
ni samma nummer — och ingen mekanism ser det förrän båda försöker landa.**
`[UNIVERSAL]`

**Empiri (S91, 2026-07-30):** orkestreraren mintade `TASK-95` och `TASK-96` och
sköt upp deras commit till en samlad bokförings-landning. Under tiden behövde en
bygg-agent minta ett kort för sitt eget AC #4.

Agenten gjorde **allt rätt**: den upptäckte att dess worktree var föråldrad, att
CLI:t därför hade gett den `task-94` (upptaget av en post i merge-kön), och
ff:ade till färsk `main` före `create`. CLI:t gav den då `95`.

**Men `95` var upptaget — av orkestrerarens ospårade fil.** Agenten räknade från
`main`, orkestreraren från sin egen disk, och ingen av dem kunde se den andres
tillstånd. Kollisionen var alltså inte agentens fel; den var orkestrerarens
uppskjutna commit.

**Nästan-instans i samma andetag:** en landad commit hänvisade till `TASK-96`,
ett kort som inte fanns i `main`. Ett pass som räknat från `main` hade gett det
numret till något annat.

**Varför det inte fångas:** allokatorn är monoton och läser disk. Den kan inte
se en fil som inte finns, och den kan inte se en fil som finns bara hos dig.
Verktygets eget skydd mot parallella arbetsträd stod dessutom av sedan
instansens födelse — men även påslaget hade det inte hjälpt här, eftersom
konflikten låg mellan huvudträdet och en gren, inte mellan två grenar.

**Formen:** bokföring som tilldelar ett nummer ur en delad serie **committas i
samma andetag som den skapas**. Ska den landa senare av andra skäl, är det ett
skäl att skapa den senare — inte att låta den ligga. Uppskjuten bokföring är inte
en neutral väntan; den är en osynlig reservation av en delad resurs.

**Rättningen görs via verktyget, inte för hand.** Kortet parkerades utanför
registret och återskapades med CLI:t efter att den andra posten landat, så
allokeringen förblev verktygets. En handredigerad ID-rad hade löst symptomet och
brutit den regel som gör registret trovärdigt.
