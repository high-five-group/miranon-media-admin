# Ett oisolerat pass läser det träd avsändaren står i — synka trädet FÖRE passet, annars mäter passet gårdagen korrekt

**En oisolerad agent har ingen egen checkout: den läser huvudkatalogens
arbetsträd, vars gren och ålder avsändaren äger och passet inte kan se. Står
trädet på en gammal gren blir passets fynd en KORREKT mätning av fel träd — och
det färdas vidare som en premisskorrigering, med research-passets auktoritet.
Synka trädet du skickar passet IN i, i samma andetag som du startar passet.**
`[UNIVERSAL]`

Instans (S108, 2026-08-23, Del 14 § B — planen till prod): research-passet
`docs/research/mallar-server-side-docraptor-prod-2026-08-23.md` levererade en
"premisskorrigering" om att `sjalvbarande.ts` inte fanns. Passet hade läst
huvudkatalogen, som stod kvar på den gamla grenen `docs/s109-hub-lyft`. På
`origin/main` fanns filen — **233 rader**. Rättat i forskningsfilen;
huvudkatalogen flyttades till `origin/main` (detached) så att kommande
oisolerade pass läser rätt träd.

**Det generella:** isoleringsvalet i sig är rätt — `[[L453]]` (isolera efter
behov, inte som default) vilar på mätning, och ett pass som skriver EN ny fil
under `docs/research/` behöver ingen worktree. Men valet flyttar ett ansvar
till avsändaren som ingen mekanism bär: den isolerade agenten får ett färskt
träd gratis, den oisolerade ärver ditt. Passets rapport bär normalt varken
gren, SHA eller datum för det träd den läste, så divergensen syns först när
någon prövar fyndet mot `origin/main` — och en "premisskorrigering" är precis
den fyndklass som INTE prövas, eftersom den redan låter som resultatet av en
prövning. Två former stänger luckan: synka trädet före dispatch, och kräv att
passet källmärker vilken SHA det läste.
