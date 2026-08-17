# Verktygets egen vägran är en starkare vakt än din egen kontroll-loop — en trasig parsning ger falska nollor, aldrig fel

**En hemsnickrad verifierings-loop som parsar utdata rapporterar noll när
parsningen går sönder — och noll ser ut som ett rent resultat. Vakten som
faktiskt håller är verktygets EGEN vägran att utföra en osäker operation: den
kan inte tyst returnera "inget att se här". Bygg destruktiva svep så att
verktygets spärr är det som stoppar dem, inte din egen förkontroll.**
`[UNIVERSAL]`

Instans (S102, 2026-08-17, repo-städet): orkestrerarens dirty-audit-loop före
worktree-raderingen var trasig och gav **falska nollor** ur ett parsningsfel —
den rapporterade alltså att inga träd bar osparat innehåll. Det som räddade
läget var `git worktree remove`s egen spärr, som vägrade ta bort **fem** träd
med innehåll. Allt innehållsprövades därefter mot `main` före force, och två
osäkrade artefakter räddades till scratchpad. 18 worktrees togs bort (28 → 10)
och 148 lokala grenar raderades (18 med unikt innehåll taggades först).
Ärlighetspunkten är öppet bokförd i sessionsdokets Del 16.

**Det generella:** en förkontroll och en spärr misslyckas på motsatta sätt. En
förkontroll som går sönder blir PERMISSIV (noll fynd → kör på); en spärr som
går sönder blir RESTRIKTIV (vägrar → du märker det). Den asymmetrin avgör
vilken av dem som får vara sista ledet före något oåterkalleligt. Kör aldrig
`--force` på grundval av en egen loops tystnad.
