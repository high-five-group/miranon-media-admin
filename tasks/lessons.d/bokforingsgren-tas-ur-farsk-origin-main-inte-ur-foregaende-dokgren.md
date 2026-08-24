# En bokföringsgren tas ur färsk `origin/main` — inte ur föregående dokgren, som bär en föråldrad kopia av just det du ska bokföra

**Kort, checklistor och sessionsdok är de filer parallella agenter skriver i
medan du arbetar. Grenar du din bokföringsgren ur din FÖRRA dokgren ärver du
en kopia från innan deras landning — och "rättar" då något som redan är rätt,
i en fil som är på väg att bli en konflikt. Varje bokföringsgren tas ur
`git fetch`-färsk `origin/main`, utan undantag.**

Instans (S108, 2026-08-23, Del 15 § C punkt 1): PR `#1872` blev DIRTY därför
att orkestrerarens gren bar kortet i sin form FÖRE `#1862` landade. Agentens
AC-bockning såg därmed ut att saknas, och orkestreraren bockade om den i den
gamla filen. Rättat med `reset --hard origin/main` plus omgjord bokföring.

**Det generella:** en dokgren känns billigare att återanvända än att skapa —
den är ju "bara text". Men bokföringsfilerna är exakt de filer som rör sig
snabbast i ett parallellt flöde, så återanvändningen maximerar konfliktrisken
i stället för att spara arbete. Felet pekar dessutom åt fel håll: det ser ut
som att ARBETET saknas (obockad AC), inte som att din kopia är gammal — vilket
lockar till att göra om arbetet i stället för att misstänka basen. Samma
familj som "ett oisolerat pass läser det träd avsändaren står i" (läs-sidan av
samma träd-ålder) och som huvudkatalogens falska kort-läsningar när den står
på ett gammalt detached HEAD. Den som konsoliderar avgör medvetet om
instanserna ska bli en post eller flera — de har olika operativa motmedel
(synka trädet du dispatchar in i · grena ur färsk `origin/main` · läs med
`git show origin/main:<fil>`).
