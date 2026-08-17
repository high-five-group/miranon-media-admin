# Arbetskatalogen persisterar mellan Bash-anrop — en `cd` i en kommandokedja är ett globalt tillståndsbyte som driftar tyst

**Ett `cd` inuti ett kommando gäller inte bara det kommandot. Arbetskatalogen
följer med till NÄSTA Bash-anrop, och alla senare git-kommandon utan explicit
mål träffar då det träd man råkade stå i — inte det man tror. Vid arbete mot
flera träd samtidigt (worktrees, syskonrepon) är `-C <mål>` på varje enskilt
git-kommando den enda formen som inte kan driva.** `[UNIVERSAL]`

Instans (S102, 2026-08-17): **TVÅ instanser samma dag**, den andra trots att
den första redan var bokförd. Bokfört i Del 17-skörden som "cwd-drift — en cd
i kommandokedja persisterar över Bash-anrop, git mot delade träd kräver
explicit `-C`".

**Spänningen mot den motsatta rekommendationen är verklig och måste läsas
ihop.** Fragmentet
`nastlade-worktree-sokvagar-faller-textmatchande-katalogvakter.md`
rekommenderar precis tvärtom — byt katalog i ett EGET kommando, låt cwd
persistera, och kör därefter rena git-kommandon UTAN absoluta sökvägar — för
att undvika att repots egen katalogvakt textmatchar huvudkatalogens sökväg och
fäller falskt. Båda observationerna är mätta och båda är sanna om sin egen
felklass:

- **cwd-formen** undviker VAKT-fällningar (sökvägen står inte i kommandotexten).
- **`-C`-formen** undviker DRIFT (målet är explicit i varje anrop).

De är alltså inte utbytbara råd utan en avvägning mellan två risker, och
valet beror på om man arbetar mot ETT träd (cwd-formen räcker, driften kan
inte uppstå) eller mot FLERA (driften är den större risken). Konsolideringen
av de två posterna bör göras medvetet av den som numrerar — inte genom att den
ena tyst skriver över den andra.
