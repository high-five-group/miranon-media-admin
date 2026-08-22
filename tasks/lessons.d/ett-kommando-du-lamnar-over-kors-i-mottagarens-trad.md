# Ett kommando du lämnar över körs i MOTTAGARENS träd — synka det före överlämningen

**[UNIVERSAL] När du ger en människa ett kommando att köra i sin egen terminal
ärver kommandot hennes arbetsträds tillstånd, inte ditt. Trädets färskhet är
ett förkrav du måste mäta och åtgärda FÖRE överlämningen. Efteråt har handlingen
redan skett, och en handling som skriver en durabel artefakt kan vara
oåterkallelig.**

Instans (S109, 2026-08-22): stämplingskommandon för två facit-manifest lämnades
över mot en checkout som låg **tio commits efter** `origin/main` — utan
`referenser`-fälten som `#1751` just lagt in. Stämpeln landade på ett föråldrat
träd; hade den committats hade den rivit hela `referenser`-arbetet. Marcus
första stämpel gick förlorad. Filen återställdes, trädet synkades, och han fick
stämpla om.

**Signalen fanns i klartext och lästes ändå fel:** grinden rapporterade **24**
ytor utan `referenser` efter stämpeln. Talet skulle ha gått NED från 22. Ett tal
som rör sig åt fel håll är en starkare signal än ett tal som bara är fel — och
det passerade ändå, eftersom ingen hade skrivit ut förväntan innan kommandot
lämnades ut.

**Varför detta inte är samma lärdom som
`stampel-sha-harleds-ur-ref-som-star-stilla.md`:** där härledde ett VERKTYG ett
SHA ur en lokal ref som stod stilla, och fixen låg i verktyget. Här var trädet
självt föråldrat i det ögonblick en människa körde kommandot, och ingen
verktygsfix hade hjälpt. Ansvaret följer överlämningen: den som formulerar
kommandot äger förkravet, eftersom mottagaren inte kan se vad avsändaren antog.

**Formen:** mät eftersläpningen i mottagarens träd (`git fetch` följt av
`git rev-list --count HEAD..origin/main`), synka, och skriv ut i samma andetag
vilket tal grinden ska visa efteråt och åt vilket håll det ska röra sig. Två
instanser på tolv dagar mot samma stämpelkedja gör förkravet till ett steg i
proceduren, inte en försiktighetsåtgärd att komma ihåg.
