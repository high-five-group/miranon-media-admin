# En append-only-logg som flera parallella PR:er skriver i sparkar dem ur kön

**[UNIVERSAL] Två PR:er som båda appendar rader sist i samma fil
konfliktar i merge-kön även när innehållet är oberoende: Git ser två
olika tillägg på samma position. Den som landar först vinner, den andra
sparkas ur kön som DIRTY med förbrukad armering och måste rebasas och
armeras om.** Mätt 2026-09-03 (S114 resume 1,
`tasks/sessions/2026-08-31-session-114.md` Del 5): `#2180` (S114) och
`#2228` (S115) appendade var sin rad i
`docs/reference/review-instrumentering.jsonl`; `#2228` landade 08:07:58Z
och `#2180` dequeuades inom minuten, rebasades på `0b2b81d2` och
armerades om. Samma sak hade hänt redan i den första rebasen (två
S114-rader mot S113:s). Regel: en logg som flera sessioner appendar till
är en kö-konfliktyta per definition — antingen commitas raderna i EGEN
liten PR direkt efter varje loop-beslut (så kön löser konflikten, inte
handen), eller så bärs de som en fil per körning som sammanställs vid
läsning. Tills ett av dem är byggt: räkna med en extra rebase per
parallell session som rör loggen, och pröva `git merge-tree` mot de
andra öppna PR:erna innan armering.
